#!/usr/bin/env node
/**
 * Geometry solver for the **marking-before-seed** arm (Round 63 §7, Daedalus's
 * 2026-08-19 §3 `markingBeforeSeed` flag).
 *
 * **Zero API calls, zero server, zero DB.** This is arithmetic, not a probe. It exists
 * because Round 63 §7 promised "the first action on it is the arithmetic, then a `--dry`",
 * and because the arithmetic turned out to decide the arm rather than merely size it.
 *
 * ── What it models ────────────────────────────────────────────────────────────
 *
 * The `evictedMarking` seeding branch (`probe-recall-tool.mjs:1200-1223`) emits, in order:
 *
 *     leadPairs × (q,a) from FILLER_LEAD
 *     seedUser, seedAck                     ← the handover; carries the token
 *     gapPairs × (q,a) from FILLER
 *     markUser, markAck                     ← the restriction; carries markPhrase
 *     (P - gapPairs) × (q,a) from FILLER
 *     restateUser, restateAck               ← carries the token a second time
 *
 * `markingBeforeSeed` swaps the seed pair and the marking pair, leaving the gap filler
 * between them. Everything else is untouched. This file derives, for any (L, G, P):
 * every ordinal, the offered addresses at both render shapes, the eviction margins, and
 * whether the arm's own preconditions hold.
 *
 * ── Self-check before it is trusted ───────────────────────────────────────────
 *
 * The unswapped model is validated against arm N1's *observed* geometry — the numbers a
 * live fire read out of `.testdata/` on 2026-08-19 and wrote into
 * `docs/research/round63-arm-n1-equal-size-offers-live-2026-08-19.md`: fact seqs [31, 59],
 * marking seq [35], 60 rows, single-excerpt offers 1-28 / 34-60, two-excerpt trailing
 * 34-56. If the model of the seeder is wrong, this fails loudly before printing any
 * recommendation. Same discipline as the probe's own structural block: re-derive rather
 * than import, so a disagreement is informative.
 *
 * Usage: node scripts/geometry-marking-before-seed.mjs
 */

const RADIUS = 2;   // RECALL_NEIGHBOUR_RADIUS (recall.ts:100)
const WINDOW = 20;  // CARRIED_CONTEXT_MAX_MESSAGES
const MAX_EXPAND = 30; // RECALL_MAX_EXPAND_ROWS (recall.ts:647)

const LIST_LENGTHS = { FILLER: 12, FILLER_LONG: 17, FILLER_LEAD: 15 };

/**
 * Row-by-row layout. Returns 1-indexed seqs for every landmark plus the derived render.
 *
 * Every row seeded by this branch is in the holder's scope — user rows carry
 * `entity_id IS NULL` in a channel the holder belongs to, assistant rows carry the
 * holder's id — so the scoped ordinal and the raw ordinal coincide and there is no
 * Round 52 gap to model. (True of every 1-1 arm; arm G's second speaker is the one
 * case where it is not, and G is not a candidate here.)
 */
function layout({ L, G, P, markingBeforeSeed }) {
  const rows = [];
  const pair = (tag) => { rows.push(`${tag}-q`); rows.push(`${tag}-a`); };

  for (let i = 0; i < L; i++) pair('lead');
  if (markingBeforeSeed) {
    rows.push('markUser', 'markAck');
    for (let i = 0; i < G; i++) pair('gap');
    rows.push('seedUser', 'seedAck');
  } else {
    rows.push('seedUser', 'seedAck');
    for (let i = 0; i < G; i++) pair('gap');
    rows.push('markUser', 'markAck');
  }
  for (let i = 0; i < P - G; i++) pair('rest');
  rows.push('restateUser', 'restateAck');

  const seqOf = (name) => rows.indexOf(name) + 1;
  const T = rows.length;
  const seed = seqOf('seedUser');
  const mark = seqOf('markUser');
  const restate = seqOf('restateUser');

  // ── The render, at the two shapes Rounds 59-63 actually observed ────────────
  // Single-excerpt: the live query `Larkspur rollback codeword` matched the seed row
  // alone on all five N1 runs. Two-excerpt: match set {seed, restate}, which is the
  // shape the render *can* take and which M's §5 correction cost a round by mixing up.
  const ex1 = { from: Math.max(1, seed - RADIUS), to: Math.min(T, seed + RADIUS) };
  const single = {
    excerpt: ex1,
    leading: ex1.from > 1 ? { from: 1, to: ex1.from - 1 } : null,
    trailing: ex1.to < T ? { from: ex1.to + 1, to: T } : null,
  };
  const ex2 = { from: Math.max(1, restate - RADIUS), to: Math.min(T, restate + RADIUS) };
  const two = {
    excerpts: [ex1, ex2],
    leading: single.leading,
    // The trailing offer on excerpt 1 stops one row short of excerpt 2's opening row.
    trailing: ex1.to + 1 <= ex2.from - 1 ? { from: ex1.to + 1, to: ex2.from - 1 } : null,
  };

  const width = (a) => (a ? a.to - a.from + 1 : 0);
  const windowFrom = T - WINDOW + 1; // first seq the live window carries

  return {
    T, seed, mark, restate, rows,
    single, two,
    leadingWidth: width(single.leading),
    trailingWidth: width(single.trailing),
    trailingWidthTwoExcerpt: width(two.trailing),
    windowFrom,
    // Margin = how many rows short of the window the landmark falls. >0 means evicted.
    factMargin: windowFrom - seed,
    markMargin: windowFrom - mark,
    // Which offer contains the restriction, and how far into it the restriction sits.
    coveringOffer:
      single.leading && mark >= single.leading.from && mark <= single.leading.to ? 'leading'
        : single.trailing && mark >= single.trailing.from && mark <= single.trailing.to ? 'trailing'
          : 'neither (inside the excerpt, or unreachable)',
    offsetIntoCovering:
      single.leading && mark >= single.leading.from && mark <= single.leading.to
        ? mark - single.leading.from
        : single.trailing && mark >= single.trailing.from && mark <= single.trailing.to
          ? mark - single.trailing.from
          : null,
  };
}

// ── Self-check: the unswapped model against arm N1's observed geometry ─────────
{
  const n1 = layout({ L: 15, G: 1, P: LIST_LENGTHS.FILLER, markingBeforeSeed: false });
  const want = {
    T: 60, seed: 31, mark: 35, restate: 59,
    leading: '1-28', trailing: '34-60', trailingTwo: '34-56',
    covering: 'trailing', offset: 1,
  };
  const got = {
    T: n1.T, seed: n1.seed, mark: n1.mark, restate: n1.restate,
    leading: `${n1.single.leading.from}-${n1.single.leading.to}`,
    trailing: `${n1.single.trailing.from}-${n1.single.trailing.to}`,
    trailingTwo: `${n1.two.trailing.from}-${n1.two.trailing.to}`,
    covering: n1.coveringOffer, offset: n1.offsetIntoCovering,
  };
  const bad = Object.keys(want).filter((k) => want[k] !== got[k]);
  if (bad.length) {
    console.error('SELF-CHECK FAILED against arm N1 observed geometry. Mismatched:', bad);
    console.error('want', want);
    console.error('got ', got);
    process.exit(1);
  }
  console.log('self-check: unswapped model reproduces arm N1 exactly');
  console.log(`  N1  rows=${n1.T}  fact=[${n1.seed},${n1.restate}]  marking=[${n1.mark}]  ` +
    `offers ${got.leading} / ${got.trailing} (two-excerpt trailing ${got.trailingTwo})`);
  console.log(`  N1  covering offer = ${n1.coveringOffer}, restriction sits +${n1.offsetIntoCovering} ` +
    `inside its start; fact margin ${n1.factMargin}, marking margin ${n1.markMargin}`);
  // Arm M, the other landed evictedMarking arm with a lead, as a second anchor.
  const m = layout({ L: 4, G: 1, P: LIST_LENGTHS.FILLER, markingBeforeSeed: false });
  console.log(`  M   rows=${m.T}  offers ${m.single.leading.from}-${m.single.leading.to} / ` +
    `${m.single.trailing.from}-${m.single.trailing.to}  (M's doc: 1-6 / 12-38)`);
}

// ── The constraint set for a marking-before-seed arm ───────────────────────────
//
// Each is stated with the reason it binds, because a solver that prints a number
// without the reason is a number a later fire will trim to save authoring effort —
// which is exactly what N1's `leadPairs: 15` docblock exists to prevent.
const CONSTRAINTS = [
  {
    key: 'covering-is-leading',
    why: 'the arm exists to make the *leading* offer the covering one, so reading forward is wrong',
    test: (g) => g.coveringOffer === 'leading',
  },
  {
    key: 'restriction-outside-radius',
    why: 'inside the radius it is in the excerpt already and no expansion is needed — that is arm E',
    test: (g) => g.mark < g.single.excerpt.from,
  },
  {
    key: 'marking-evicted',
    why: 'hard precondition — the probe throws if the marking survives the window',
    test: (g) => g.markMargin > 0,
  },
  {
    key: 'fact-evicted-margin-5',
    why: 'F/L/M/N1 all evict the handover; matching the margin keeps the comparison single-variable',
    test: (g) => g.factMargin >= 5,
  },
  {
    key: 'covering-offer-not-cheaper',
    why: 'if the covering offer is also the cheap one, a preference for it is cost-explicable — arm M\'s confound',
    test: (g) => g.leadingWidth >= g.trailingWidth,
  },
  {
    key: 'no-truncation-leak',
    why: 'an offer wider than RECALL_MAX_EXPAND_ROWS truncates, which is a second variable (N1\'s ceiling argument)',
    test: (g) => g.leadingWidth <= MAX_EXPAND && g.trailingWidth <= MAX_EXPAND,
  },
  {
    key: 'reachable-by-observed-appetite',
    why: 'the replicated appetite is offered-start +6..+10; a restriction further in is missed for appetite, not direction',
    test: (g) => g.offsetIntoCovering !== null && g.offsetIntoCovering <= 4,
  },
];

function evaluate(cfg) {
  const g = layout({ ...cfg, markingBeforeSeed: true });
  const failed = CONSTRAINTS.filter((c) => !c.test(g)).map((c) => c.key);
  return { cfg, g, failed, ok: failed.length === 0 };
}

function fmt(r) {
  const { cfg, g } = r;
  return `L=${String(cfg.L).padStart(2)} G=${String(cfg.G).padStart(2)} P=${String(cfg.P).padStart(2)} | ` +
    `rows ${String(g.T).padStart(2)} | mark@${String(g.mark).padStart(2)} fact@${String(g.seed).padStart(2)} | ` +
    `offers ${`${g.single.leading ? `${g.single.leading.from}-${g.single.leading.to}` : '—'}`.padStart(7)} (${String(g.leadingWidth).padStart(2)}) / ` +
    `${`${g.single.trailing ? `${g.single.trailing.from}-${g.single.trailing.to}` : '—'}`.padStart(7)} (${String(g.trailingWidth).padStart(2)}) | ` +
    `+${g.offsetIntoCovering ?? '—'} into ${g.coveringOffer.padEnd(8)} | ` +
    `factMargin ${String(g.factMargin).padStart(3)} | ` +
    (r.ok ? 'FEASIBLE' : `fails: ${r.failed.join(', ')}`);
}

// ── Sweep 1: the two lists that exist today ───────────────────────────────────
console.log('\n── Sweep over the filler lists that exist today ─────────────────────────');
for (const [name, P] of [['FILLER', LIST_LENGTHS.FILLER], ['FILLER_LONG', LIST_LENGTHS.FILLER_LONG]]) {
  const all = [];
  for (let L = 0; L <= LIST_LENGTHS.FILLER_LEAD; L++) {
    for (let G = 0; G <= P; G++) all.push(evaluate({ L, G, P }));
  }
  const feasible = all.filter((r) => r.ok);
  console.log(`\n${name} (P=${P}): ${feasible.length} feasible of ${all.length} configurations`);
  if (feasible.length) feasible.forEach((r) => console.log('  ' + fmt(r)));
  else {
    // Print the near-misses — the ones failing exactly one constraint — because
    // "infeasible" is only useful alongside *which* constraint is binding.
    const near = all.filter((r) => r.failed.length === 1);
    const byConstraint = {};
    for (const r of near) (byConstraint[r.failed[0]] ||= []).push(r);
    console.log('  none. Configurations failing exactly one constraint, grouped by which:');
    for (const [k, rs] of Object.entries(byConstraint)) {
      console.log(`   · ${k} (${rs.length})`);
      rs.slice(0, 3).forEach((r) => console.log('       ' + fmt(r)));
      if (rs.length > 3) console.log(`       … and ${rs.length - 3} more`);
    }
  }
}

// ── Sweep 2: how much authoring buys feasibility ──────────────────────────────
console.log('\n── Smallest filler list that admits a feasible configuration ────────────');
let firstFeasibleP = null;
for (let P = LIST_LENGTHS.FILLER; P <= 30 && !firstFeasibleP; P++) {
  for (let L = 0; L <= LIST_LENGTHS.FILLER_LEAD && !firstFeasibleP; L++) {
    for (let G = 0; G <= P; G++) {
      const r = evaluate({ L, G, P });
      if (r.ok) { firstFeasibleP = { P, r }; break; }
    }
  }
}
if (firstFeasibleP) {
  const { P, r } = firstFeasibleP;
  console.log(`P=${P} — ${P - LIST_LENGTHS.FILLER_LONG} pair(s) beyond FILLER_LONG, ` +
    `${P - LIST_LENGTHS.FILLER} beyond FILLER`);
  console.log('  ' + fmt(r));
  // All feasible configurations at that P, so the choice among them is visible.
  const all = [];
  for (let L = 0; L <= LIST_LENGTHS.FILLER_LEAD; L++) for (let G = 0; G <= P; G++) all.push(evaluate({ L, G, P }));
  const feasible = all.filter((x) => x.ok);
  console.log(`  all ${feasible.length} feasible configuration(s) at P=${P}:`);
  feasible.forEach((x) => console.log('    ' + fmt(x)));
} else {
  console.log('no feasible configuration at any P ≤ 30 — the constraint set is over-tight');
}

// ── Sweep 3: the relaxation that costs no authoring ───────────────────────────
//
// Relaxing exactly one constraint at a time, on the lists that exist, says what the
// arm would have to give up to be buildable today. Printed rather than chosen: which
// constraint is cheapest to drop is a design call, not an arithmetic one.
console.log('\n── What one relaxation buys, on the existing lists ──────────────────────');
for (const relax of CONSTRAINTS.map((c) => c.key)) {
  for (const [name, P] of [['FILLER', LIST_LENGTHS.FILLER], ['FILLER_LONG', LIST_LENGTHS.FILLER_LONG]]) {
    const hits = [];
    for (let L = 0; L <= LIST_LENGTHS.FILLER_LEAD; L++) {
      for (let G = 0; G <= P; G++) {
        const r = evaluate({ L, G, P });
        if (r.failed.length === 1 && r.failed[0] === relax) hits.push(r);
      }
    }
    if (!hits.length) continue;
    console.log(`\ndrop "${relax}" on ${name}: ${hits.length} configuration(s)`);
    hits.slice(0, 4).forEach((r) => console.log('  ' + fmt(r)));
    if (hits.length > 4) console.log(`  … and ${hits.length - 4} more`);
  }
}

console.log('\nNothing above is a build. See docs/research/ for the decision this feeds.');
