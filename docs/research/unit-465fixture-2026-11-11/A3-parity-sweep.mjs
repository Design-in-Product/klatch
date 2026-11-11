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
 * The `evictedMarking` seeding branch (`probe-recall-tool.mjs`, `if (arm.evictedMarking) {` —
 * cited as `:1200-1223` until 2026-08-25, stale by 22 lines when written) emits, in order:
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
let viol=0, eq=0, cells=0;
const trailForms=new Set(), leadParity=new Set();
for (const P of [11,12,13,17,20,25]) {
  for (const L of [1,2,3,14,15,16,17,20,33,50]) {
    const g=layout({L,G:1,P,markingBeforeSeed:false});
    cells++;
    if (g.leadingWidth===g.trailingWidth) eq++;
    if (g.leadingWidth%2!==0 || g.trailingWidth%2!==1) viol++;
    trailForms.add(P+':'+(g.trailingWidth-(2*P+3)));
    leadParity.add(g.leadingWidth-(2*L-2));
  }
}
console.log('cells='+cells, 'equal='+eq, 'parityViolations='+viol);
console.log('trailingWidth - (2P+3) distinct deltas:', [...new Set([...trailForms].map(s=>s.split(':')[1]))]);
console.log('leadingWidth - (2L-2) distinct deltas:', [...leadParity]);
const n1=layout({L:15,G:1,P:12,markingBeforeSeed:false});
console.log('anchor N1 L=15 P=12: leading='+n1.leadingWidth+' trailing='+n1.trailingWidth);
const l20=layout({L:20,G:1,P:12,markingBeforeSeed:false});
console.log('L=20 P=12: leading='+l20.leadingWidth+' (MAX_EXPAND='+MAX_EXPAND+')');
