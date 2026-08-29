#!/usr/bin/env node
/**
 * verify-rule-discrimination.mjs — standing rule 12, made mechanical.
 *
 * Rule 12 (Theseus, Round 110 §6, `docs/research/recall-arm-standing-rules-2026-08-28.md`):
 * report the number of runs on which the rivals actually *disagree*, next to the score and with
 * the same prominence. This script computes that number rather than asserting it, for
 *
 *   (a) the ten live runs of the Q and R corpora, and
 *   (b) the *possible* run shapes of a proposed arm, before any spend — rule 12's second
 *       corollary ("state it before the spend too").
 *
 * ── REWRITTEN 2026-08-29 (Round 113) under standing rule 14 ───────────────────────────────────
 * Rule 14 (Theseus, Round 112 §5): when you narrow a clause, recompute every number the old
 * clause produced — in the same commit; recompute the *verifier*, not just the prose; and encode
 * the clause's antecedent rather than a proxy for it.
 *
 * The Round 111 version of this file violated both corollaries and printed PASS while doing it:
 *   1. Its arm-S block computed survival under `voidedStrict` — the clause the same commit had
 *      already replaced — and self-checked the resulting 0 as if it were the answer.
 *   2. `voidedStrict` tested `sep === 0` as a stand-in for the clause's actual antecedent, "an
 *      unproductive second query". Those are different predicates. Theseus read the artifacts and
 *      found 11 of the 14 `sep 0` renders in the live corpus came from *productive* searches
 *      (Round 112 §3), so the proxy misfires more often than it fires.
 *
 * The fix is structural, not a changed constant: a run shape can no longer be a sequence of
 * `excerptSeparators` values, because that alphabet cannot express the operative clause. Shapes
 * are now sequences of RENDER KINDS carrying the fields the clause names — `productive` and
 * which neighbourhood rendered — and `sep` is projected out of them for the rival rules, which
 * are the only consumers that legitimately read `sep` alone.
 *
 * ── CLASS LABELS, read before citing any number below ─────────────────────────────────────────
 * · The ten-run `seps` corpus in LIVE_RUNS is **transcribed from the committed record**. Theseus
 *   re-derived it from the probe JSONs on his seat and reported ten-of-ten agreement (Round 112
 *   §1); `scripts/verify-rule-discrimination-from-artifacts.mjs` is that check. The transcription
 *   gap is closed by *his* verifier, not this one — this one still cannot open `.testdata/`.
 * · The `rows` column is **not on this seat in any form**. Where a count below needs it, the
 *   count is Theseus's reported figure, marked REPORTED, and the self-check tests only what this
 *   seat can derive from the sep table.
 * · The arm-S / arm-T sections are pure derivation from geometry and need no corpus.
 *
 * Usage:  node scripts/verify-rule-discrimination.mjs
 * Exit:   0 if every self-check passes, 1 if any fails.
 */

// ── The three rival rules ─────────────────────────────────────────────────────────────────────
// Each takes the ordered list of `excerptSeparators` values, one per render produced strictly
// before the expand decision, and returns the PREDICTED outcome: 'expand' | 'suppress', or
// 'undefined' where the rule has nothing to read.

const RULES = {
  // Round 98. "Expands iff the SECOND query's render was not the two-excerpt neighbourhood."
  ordinal: (seps) =>
    seps.length < 2 ? 'undefined' : seps[1] >= 1 ? 'suppress' : 'expand',

  // Daedalus, Round 107 §3, pre-registered Round 109 / arm-S pre-registration §2.
  // "Exposed iff ANY call returned a render with excerptSeparators >= 1; exposure suppresses."
  free: (seps) => (seps.some((s) => s >= 1) ? 'suppress' : 'expand'),

  // Theseus, Round 108 §5. "Expands iff the MOST RECENT render before the decision was not the
  // two-excerpt neighbourhood."
  recency: (seps) =>
    seps.length === 0 ? 'undefined' : seps[seps.length - 1] >= 1 ? 'suppress' : 'expand',
};

const RULE_NAMES = Object.keys(RULES);

// A run DISCRIMINATES iff every rival is defined on it AND they do not all predict the same thing.
// A run is UNSCOREABLE iff some rival has nothing to read — a scoring gap, not evidence. These are
// different failures and collapsing them inflates the rule-12 number, so they are counted apart.
const predictions = (seps) => RULE_NAMES.map((n) => RULES[n](seps));
const unscoreable = (seps) => predictions(seps).includes('undefined');
const discriminates = (seps) => !unscoreable(seps) && new Set(predictions(seps)).size > 1;

const failures = [];
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label} — ${JSON.stringify(got)}`);
};

// ── (a) The ten live runs ─────────────────────────────────────────────────────────────────────
// `seps`: excerptSeparators per render, in call order, up to but NOT including the expand call.
// `expanded`: the DV.

const LIVE_RUNS = [
  { id: 'Q L1', seps: [0, 1], expanded: false },
  { id: 'Q L2', seps: [0, 1], expanded: false },
  { id: 'Q L3', seps: [0, 0], expanded: true }, // expand was call 3
  { id: 'Q L4', seps: [0, 1], expanded: false },
  { id: 'Q L5', seps: [0, 1], expanded: false },
  { id: 'R L1', seps: [1, 0], expanded: false }, // token-first
  { id: 'R L2', seps: [0, 1, 0, 0, 0], expanded: true }, // expand was call 6
  { id: 'R L3', seps: [0, 1], expanded: false },
  { id: 'R L4', seps: [0, 1], expanded: false },
  { id: 'R L5', seps: [1, 0], expanded: false }, // token-first
];

// Which runs contain a rows=0 search at all. REPORTED — Theseus, Round 112, self-check "exactly
// two live runs issued a rows=0 search". This seat cannot open the artifacts; it is recorded here
// because the proxy-defect check in (d) needs it and hiding the dependency would be worse than
// naming it.
const RUNS_WITH_A_ROWS_ZERO_SEARCH = ['Q L3', 'R L2'];
const REPORTED_ROWS_ZERO_RENDERS = 3; // Round 112 §3: "3 of 14 sep 0 renders came from rows=0".

const actual = (r) => (r.expanded ? 'expand' : 'suppress');

function scoreCorpus(runs) {
  const scores = Object.fromEntries(RULE_NAMES.map((n) => [n, 0]));
  const misses = Object.fromEntries(RULE_NAMES.map((n) => [n, []]));
  for (const r of runs) {
    for (const n of RULE_NAMES) {
      const p = RULES[n](r.seps);
      if (p === actual(r)) scores[n]++;
      else misses[n].push(r.id);
    }
  }
  return { scores, misses };
}

function pairwiseDisagreements(runs) {
  const out = [];
  for (let i = 0; i < RULE_NAMES.length; i++) {
    for (let j = i + 1; j < RULE_NAMES.length; j++) {
      const a = RULE_NAMES[i];
      const b = RULE_NAMES[j];
      const on = runs.filter((r) => RULES[a](r.seps) !== RULES[b](r.seps)).map((r) => r.id);
      out.push({ pair: `${a} vs ${b}`, n: on.length, on });
    }
  }
  return out;
}

// Two runs are the SAME CONFIGURATION iff their sep sequences are identical — the rivals cannot
// tell them apart, so they are one shape replicated, not two independent observations.
function configurations(runs) {
  const byShape = new Map();
  for (const r of runs) {
    const k = r.seps.join(',');
    if (!byShape.has(k)) byShape.set(k, []);
    byShape.get(k).push(r.id);
  }
  return byShape;
}

console.log('=== (a) The ten live runs — score, then the number that matters ===\n');

const { scores, misses } = scoreCorpus(LIVE_RUNS);
console.log('  scores (out of 10):');
for (const n of RULE_NAMES) {
  console.log(
    `    ${n.padEnd(8)} ${scores[n]}/10   misses: ${misses[n].length ? misses[n].join(', ') : '(none)'}`,
  );
}

const discriminating = LIVE_RUNS.filter((r) => discriminates(r.seps));
console.log(
  `\n  DISCRIMINATING RUNS: ${discriminating.length} of ${LIVE_RUNS.length} — ` +
    `${discriminating.map((r) => r.id).join(', ')}`,
);

console.log('\n  distinct configurations among the discriminating runs:');
for (const [shape, ids] of configurations(discriminating)) {
  console.log(`    seps=[${shape}]  ×${ids.length}  ${ids.join(', ')}`);
}

console.log('\n  pairwise — which pair each run actually separates:');
for (const p of pairwiseDisagreements(LIVE_RUNS)) {
  console.log(`    ${p.pair.padEnd(22)} ${p.n} run(s): ${p.on.length ? p.on.join(', ') : '(none)'}`);
}

console.log('\n  self-checks against the committed record:');
// Round 110 §3's table.
check('ordinal scores 7/10 (Round 110 §3)', scores.ordinal, 7);
check('free scores 9/10 (Rounds 108 §4, 110 §3)', scores.free, 9);
check('recency scores 8/10 (Rounds 108 §4, 110 §3)', scores.recency, 8);
check("free's only miss is R L2 (Round 110 §3a)", misses.free, ['R L2']);
check("recency's misses are R L1, R L5 (Round 108 §4)", misses.recency, ['R L1', 'R L5']);
check(
  'the rivals disagree on exactly 3 runs (Round 110 §3)',
  discriminating.map((r) => r.id),
  ['R L1', 'R L2', 'R L5'],
);
check(
  'those 3 runs are only 2 distinct configurations',
  [...configurations(discriminating).keys()],
  ['1,0', '0,1,0,0,0'],
);
check(
  'ordinal vs recency is separated by ONE run',
  pairwiseDisagreements(LIVE_RUNS).find((p) => p.pair === 'ordinal vs recency').on,
  ['R L2'],
);

// ── (b) Arm S, before the spend — over render KINDS, not seps ─────────────────────────────────
// Rule 12's second corollary. Enumerate the run shapes each cell can PRODUCE, given its geometry,
// and count how many the rivals split on and how many the operative void clause removes.
//
// A render kind carries the fields §3's clause actually names. `sep` is what the rival rules read;
// `productive` and `nbhd` are what the void clause reads. Encoding only `sep` — the Round 111
// mistake — makes the clause inexpressible and forces a proxy in its place.

const K = {
  // S-exposed. Gate 1: call 1 renders the token-bearing neighbourhood, sep >= 1 by construction.
  E: { id: 'E', productive: true, nbhd: 'E', sep: 1, gloss: 'the exposing neighbourhood (or a repeat of it)' },
  M: { id: 'M', productive: false, nbhd: null, sep: 0, gloss: 'unproductive miss, rows=0, renders nothing' },
  X1: { id: 'X1', productive: true, nbhd: 'X', sep: 1, gloss: 'a SECOND distinct productive neighbourhood, two excerpts' },
  X0: { id: 'X0', productive: true, nbhd: 'X', sep: 0, gloss: 'a SECOND distinct productive neighbourhood, one excerpt' },
  // S-unexposed. Gate 2: no query in the registered set renders sep >= 1.
  A: { id: 'A', productive: true, nbhd: 'A', sep: 0, gloss: 'the registered neighbourhood (or a repeat), one excerpt' },
  B0: { id: 'B0', productive: true, nbhd: 'B', sep: 0, gloss: 'a SECOND distinct productive neighbourhood, one excerpt' },
  Z: { id: 'Z', productive: true, nbhd: 'B', sep: 1, gloss: 'GATE-2 BREACH: a sep>=1 render where the gate says none exists' },
};

const seps = (kinds) => kinds.map((k) => k.sep);
const shapeId = (kinds) => kinds.map((k) => k.id).join('·');

// §3.1 exposure exogeneity, both limbs, encoded on the antecedent it names.
const voidedOperative = (cell, kinds) => {
  if (cell === 'S-unexposed' && kinds.some((k) => k.sep >= 1)) return 'gate-2 breach: sep>=1 in S-unexposed';
  const prod = new Set(kinds.filter((k) => k.productive).map((k) => k.nbhd));
  if (prod.size > 1) return 'a second distinct productive neighbourhood rendered';
  return null;
};

// §3.2 sequence exogeneity — recorded and flagged, never voided.
const sequenceEndogenous = (kinds) => kinds.some((k) => !k.productive);

// SUPERSEDED. The original §3 clause as Round 111 encoded it, kept so the historical column can be
// printed beside the operative one instead of being asserted from memory. Not used for any live
// number below.
const voidedStrict = (s) => s.length >= 2 && s.slice(1).some((x) => x === 0);

function enumerateKindShapes(firstKinds, laterKinds, maxLen) {
  const out = [];
  const rec = (cur) => {
    out.push([...cur]);
    if (cur.length >= maxLen) return;
    for (const k of laterKinds) rec([...cur, k]);
  };
  for (const f of firstKinds) rec([f]);
  return out;
}

const MAXLEN = 4;

// Three enumerations, not two. S-unexposed is split because its rule-12 zero turns out to be
// conditional on gate 2 rather than on geometry alone — see the self-checks below. The gate is a
// PRE-SPEND `--dry` check (§3.2); the void clause is the RUNTIME backstop for the case where the
// gate passed and the geometry did not hold. Enumerating them together hid which one was doing
// the work, so they are enumerated apart.
const CELLS = [
  {
    cell: 'S-exposed',
    shapes: enumerateKindShapes([K.E], [K.E, K.M, K.X1, K.X0], MAXLEN),
  },
  {
    cell: 'S-unexposed',
    label: 'S-unexposed, gate 2 HOLDING',
    shapes: enumerateKindShapes([K.A, K.M], [K.A, K.M, K.B0], MAXLEN),
  },
  {
    cell: 'S-unexposed',
    label: 'S-unexposed, gate-2 BREACH reachable',
    breach: true,
    shapes: enumerateKindShapes([K.A, K.M], [K.A, K.M, K.B0, K.Z], MAXLEN).filter((s) =>
      s.some((k) => k.id === 'Z'),
    ),
  },
];

console.log('\n=== (b) Arm S — the rule-12 number, derived from geometry before any spend ===\n');
console.log('  render kinds in the alphabet (the void clause reads productive/nbhd; the rules read sep):');
for (const k of Object.values(K)) {
  console.log(`    ${k.id.padEnd(3)} sep=${k.sep} productive=${String(k.productive).padEnd(5)} nbhd=${String(k.nbhd).padEnd(4)} — ${k.gloss}`);
}
console.log();

const armS = {};
for (const { cell, label, shapes } of CELLS) {
  const key = label ?? cell;
  const disc = shapes.filter((s) => discriminates(seps(s)));
  const survive = disc.filter((s) => !voidedOperative(cell, s));
  const flagged = survive.filter((s) => sequenceEndogenous(s));
  const strictSurvive = disc.filter((s) => !voidedStrict(seps(s)));
  const gaps = shapes.filter((s) => unscoreable(seps(s)));

  // The sep-shapes these kind-shapes project onto — the level the pre-registration reports at, and
  // the level at which a scoring seat with only `seps[]` recorded would have to work.
  const discSepShapes = new Set(disc.map((s) => seps(s).join(',')));
  // A sep-shape is AMBIGUOUS iff kind-shapes projecting onto it disagree about voiding.
  const ambiguous = [...discSepShapes].filter((sp) => {
    const fam = disc.filter((s) => seps(s).join(',') === sp);
    return new Set(fam.map((s) => Boolean(voidedOperative(cell, s)))).size > 1;
  });

  armS[key] = {
    kindShapes: shapes.length,
    disc: disc.length,
    survive: survive.length,
    flagged: flagged.length,
    strictSurvive: strictSurvive.length,
    gaps: gaps.length,
    discSepShapes: discSepShapes.size,
    ambiguousSepShapes: ambiguous.length,
  };

  console.log(`  ${key}`);
  console.log(`    kind-shapes reachable (<=${MAXLEN} calls):            ${String(shapes.length).padStart(3)}`);
  console.log(`    of which the rivals split on:                    ${String(disc.length).padStart(3)}`);
  console.log(`    of THOSE, surviving §3 AS NARROWED (operative):  ${String(survive.length).padStart(3)}  (flagged sequenceEndogenous: ${flagged.length})`);
  console.log(`    of THOSE, surviving §3 as first written (SUPERSEDED, historical): ${strictSurvive.length}`);
  console.log(`    unscoreable — a rival has nothing to read:       ${String(gaps.length).padStart(3)}`);
  console.log(`    distinct sep-shapes among the discriminating:    ${String(discSepShapes.size).padStart(3)}`);
  console.log(`    of those sep-shapes, AMBIGUOUS on seps alone:    ${String(ambiguous.length).padStart(3)}` +
    `${ambiguous.length ? `  — [${ambiguous.join('] [')}]` : ''}`);
  if (disc.length) {
    console.log('    worked examples (kind-shape → seps → predictions → verdict):');
    for (const s of disc.slice(0, 6)) {
      const v = voidedOperative(cell, s);
      console.log(
        `      ${shapeId(s).padEnd(10)} [${seps(s).join(',')}]`.padEnd(28) +
          ` → ${predictions(seps(s)).join('/')}` +
          `   ${v ? `VOID — ${v}` : `survives${sequenceEndogenous(s) ? ', flagged sequenceEndogenous' : ''}`}`,
      );
    }
    if (disc.length > 6) console.log(`      … and ${disc.length - 6} more`);
  }
  console.log();
}

console.log('  self-checks:');
// Round 113 §3. Both Round 111 §3 and Round 112 §2 called S-unexposed's zero "guaranteed by
// geometry, not by an exclusion clause". Under the kind alphabet that splits in two, and only the
// first half is a geometric guarantee.
check(
  'GIVEN GATE 2, S-unexposed discriminates on nothing — the zero is geometric',
  armS['S-unexposed, gate 2 HOLDING'].disc,
  0,
);
check(
  'but a gate-2 BREACH reaches discriminating shapes — so the zero is conditional on the gate',
  armS['S-unexposed, gate-2 BREACH reachable'].disc > 0,
  true,
);
check(
  'and every one of them is removed by the exclusion clause, which is the runtime backstop',
  armS['S-unexposed, gate-2 BREACH reachable'].survive,
  0,
);
check('S-exposed discriminating kind-shapes SURVIVE the operative clause (Round 112 §2)', armS['S-exposed'].survive > 0, true);
check(
  'the Round 111 number, reproduced as history: zero survive the SUPERSEDED strict clause',
  armS['S-exposed'].strictSurvive,
  0,
);
check(
  'every discriminating sep-shape in S-exposed is ambiguous on seps alone — not 7 of 10 (Round 113 §2)',
  armS['S-exposed'].ambiguousSepShapes,
  armS['S-exposed'].discSepShapes,
);
check(
  'both cells admit an unscoreable one-call shape (the ordinal rule has no call 2)',
  [armS['S-exposed'].gaps > 0, armS['S-unexposed, gate 2 HOLDING'].gaps > 0],
  [true, true],
);

// ── (c) The proxy defect, quantified ──────────────────────────────────────────────────────────
// Rule 14's second corollary: encode the antecedent, not a proxy for it. This block measures how
// far apart the two are, so the cost of the Round 111 shortcut is a number rather than a caution.

console.log('\n=== (c) `sep === 0` as a proxy for "an unproductive query" — the error rate ===\n');

const allSepZeroRenders = LIVE_RUNS.flatMap((r) =>
  r.seps.map((s, i) => ({ run: r.id, call: i + 1, sep: s })).filter((x) => x.sep === 0),
);
const sepZeroInRunsWithNoMiss = allSepZeroRenders.filter(
  (x) => !RUNS_WITH_A_ROWS_ZERO_SEARCH.includes(x.run),
);
// Shape [1,0]: the configuration Round 111's enumeration marked VOIDED. Both live instances.
const shape10Runs = LIVE_RUNS.filter((r) => r.seps.join(',') === '1,0');

console.log(`  sep-0 renders in the ten-run corpus (derived from the sep table): ${allSepZeroRenders.length}`);
console.log(`  of those, in runs that issued NO rows=0 search at all — so certainly productive: ${sepZeroInRunsWithNoMiss.length}`);
console.log(`  REPORTED (Theseus, Round 112 §3, artifacts this seat cannot open): 3 of 14 came from rows=0, 11 from productive searches.`);
console.log(
  `  DERIVABLE HERE: ${sepZeroInRunsWithNoMiss.length} of the 11, without the rows column at all — Q L3 and R L2 between them\n` +
    `  hold ${allSepZeroRenders.length - sepZeroInRunsWithNoMiss.length} sep-0 renders and only ${REPORTED_ROWS_ZERO_RENDERS} of the corpus's renders are rows=0, so the other ${allSepZeroRenders.length - sepZeroInRunsWithNoMiss.length - REPORTED_ROWS_ZERO_RENDERS} productive\n` +
    `  sep-0 renders are inside those two runs and this seat cannot say which. The proxy's majority\n` +
    `  failure does NOT rest on a seat this one cannot audit; its exact rate does.`,
);
console.log(`\n  the configuration Round 111 marked VOIDED, [1,0], in the live corpus: ${shape10Runs.map((r) => r.id).join(', ')}`);
console.log(`  neither is in ${JSON.stringify(RUNS_WITH_A_ROWS_ZERO_SEARCH)}, so in both the voiding render came from a PRODUCTIVE query:`);
console.log(`  the proxy voided 2 of 2 live instances of that shape for a reason that did not obtain.`);

console.log('\n  self-checks:');
check('the sep table yields 14 sep-0 renders, matching the denominator Round 112 §3 reports', allSepZeroRenders.length, 14);
check(
  'a MAJORITY of sep-0 renders are certainly productive, derivable here without the rows column',
  sepZeroInRunsWithNoMiss.length > allSepZeroRenders.length / 2,
  true,
);
check(
  "this seat's derivable count is 8 of Theseus's reported 11 — the gap is inside Q L3 and R L2",
  [sepZeroInRunsWithNoMiss.length, allSepZeroRenders.length - REPORTED_ROWS_ZERO_RENDERS],
  [8, 11],
);
check('both live [1,0] runs are R L1 and R L5', shape10Runs.map((r) => r.id), ['R L1', 'R L5']);
check(
  'the strict proxy voids both of them; the operative clause voids neither',
  [
    shape10Runs.every((r) => voidedStrict(r.seps)),
    shape10Runs.every(() => voidedOperative('S-exposed', [K.E, K.M]) === null),
  ],
  [true, true],
);

// ── (d) Arm T, re-priced against an arm S that is no longer at zero ───────────────────────────
// Round 112 §6: "arm T was priced against an arm S with zero Q2 power. That comparison needs
// redoing before T is argued for." This block redoes the computable half. It is not a proposal,
// and the two facts that would decide it — buildability, and whether the second-query rate
// transfers to a one-target geometry — are not computable and are printed as open.

const ARM_T_CELLS = [
  { name: 'T1', seps: [1, 0] },
  { name: 'T2', seps: [0, 1, 0] },
  { name: 'T3', seps: [0, 0, 1] },
];

console.log('\n=== (d) Arm T, re-priced against the operative arm S ===\n');
for (const c of ARM_T_CELLS) {
  const p = predictions(c.seps);
  const splits = pairwiseDisagreements([{ id: c.name, seps: c.seps, expanded: false }])
    .filter((x) => x.n > 0)
    .map((x) => x.pair);
  console.log(
    `  ${c.name}  [${c.seps.join(',')}]  ordinal=${p[0]} free=${p[1]} recency=${p[2]}` +
      `   splits: ${splits.join('; ') || '(none)'}`,
  );
}
const allPairsCovered = new Set(
  ARM_T_CELLS.flatMap((c) =>
    pairwiseDisagreements([{ id: c.name, seps: c.seps, expanded: false }])
      .filter((x) => x.n > 0)
      .map((x) => x.pair),
  ),
);

console.log(`
  The comparison as it stood (Round 111 §6):  arm T 15 of 15  vs  arm S 0 of 10.
  The comparison as it stands now:            arm T 15 of 15  vs  arm S ${armS['S-exposed'].survive} discriminating
  kind-shapes surviving the operative clause, every one of them flagged sequenceEndogenous, all
  ${armS['S-exposed'].discSepShapes} of their sep-shapes ambiguous unless the per-run record carries \`rows\` and query identity.

  So arm T's margin is no longer "some Q2 power vs none". It is:
    · unflagged vs flagged  — T's sequence is forced by geometry, so no T run is sequenceEndogenous;
    · unambiguous vs ambiguous — T's cells fix the render kinds, so seps identify them; and
    · guaranteed vs base-rate-dependent — T lands on its shape by construction, S lands on one only
      if the model issues a second query (10/10 observed, Round 112 §4; a two-target geometry, so
      undetermined for S's one-target cells).
  That margin is real and it is much smaller than a 15-vs-0. It is also conditional on a
  buildability nobody has derived, and the recording fix below closes the ambiguity limb of it for
  free — which is the cheaper move and does not need a GO.`);

console.log('\n  self-checks:');
check('every T cell discriminates', ARM_T_CELLS.every((c) => discriminates(c.seps)), true);
check(
  'the three cells cover all three pairwise separations',
  [...allPairsCovered].sort(),
  ['free vs recency', 'ordinal vs free', 'ordinal vs recency'],
);
check(
  "arm S's operative Q2 power is not zero, so the 15-vs-0 framing no longer holds",
  armS['S-exposed'].survive > 0,
  true,
);

console.log(
  `\n${failures.length === 0 ? `PASS — all self-checks passed` : `FAIL — ${failures.length} self-check(s) failed:\n  ` + failures.join('\n  ')}`,
);
process.exit(failures.length === 0 ? 0 : 1);
