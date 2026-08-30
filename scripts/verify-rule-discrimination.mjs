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
 * Exit:   0 if every self-check passes, 1 if any fails, 2 if a repo artifact it reads is absent.
 *
 * Section (f) reads `docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md` — a
 * TRACKED repo file, not `.testdata/`, so it is present on every seat and in every clone. It is
 * still preflighted rather than read blind: the convention (from
 * `verify-rule-discrimination-from-artifacts.mjs`, and added to `verify-x0-reachability.mjs` in
 * Round 115) is that "not runnable here" must exit 2 with a diagnostic, never throw — a crash is
 * indistinguishable from a broken script, which is a different fact from a failed check.
 */

import { readFileSync, existsSync } from 'node:fs';

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
//
// ── SPLIT AGAIN 2026-08-29 (Round 115) ────────────────────────────────────────────────────────
// S-exposed was enumerated over ONE alphabet — [E, M, X1, X0] — mixing kinds that are in-cell with
// kinds that are only reachable if a geometric property the design ASSERTS has failed.
// Pre-registration §1 says of S-exposed: "the token-bearing neighbourhood is the *only* productive
// query." If that holds, X0 and X1 — both defined as a SECOND distinct productive neighbourhood —
// cannot occur at all. They are breach kinds, exactly as Z is for S-unexposed.
//
// The block above already segregated S-unexposed's breach kind because mixing it hid which
// condition was doing the work (Round 113 §3). The same discipline was not applied one cell over,
// in the same file, in the same commit. That is why "is X0 reachable?" looked like a question about
// the ten-run corpus (Rounds 112–114) rather than what it is: a question about a gate nobody wrote.
//
// §3's gate list checks S-unexposed's geometric claim (gate 2, by enumerating the query set) and
// does NOT check S-exposed's (gate 1 only checks the call-1 render). See Round 115 §2.
const CELLS = [
  {
    cell: 'S-exposed',
    label: 'S-exposed, gate 1b HOLDING (one productive neighbourhood, per §1)',
    shapes: enumerateKindShapes([K.E], [K.E, K.M], MAXLEN),
  },
  {
    cell: 'S-exposed',
    label: 'S-exposed, gate-1b BREACH reachable',
    shapes: enumerateKindShapes([K.E], [K.E, K.M, K.X1, K.X0], MAXLEN).filter((s) =>
      s.some((k) => k.id === 'X0' || k.id === 'X1'),
    ),
  },
  {
    // HISTORICAL, printed not asserted. The single unsplit alphabet Rounds 113 and 114 argued over.
    // Retained under rule 14: the superseded framing's numbers stay visible beside the operative
    // ones instead of being remembered. The 10-of-10 (Round 113) and 7-of-10 (Round 114) ambiguity
    // counts are both properties OF THIS ROW and of no other.
    cell: 'S-exposed',
    label: 'S-exposed, UNSPLIT alphabet (SUPERSEDED framing, Rounds 113–114)',
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
    // Round 115: the sep-shapes themselves, so invariance across the gate-1b split can be checked
    // as set equality rather than as two counts that happen to match.
    survivingSepShapeList: [...new Set(survive.map((s) => seps(s).join(',')))].sort(),
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

const SEX_HOLD = armS['S-exposed, gate 1b HOLDING (one productive neighbourhood, per §1)'];
const SEX_BREACH = armS['S-exposed, gate-1b BREACH reachable'];
const SEX_UNSPLIT = armS['S-exposed, UNSPLIT alphabet (SUPERSEDED framing, Rounds 113–114)'];

check('S-exposed discriminating kind-shapes SURVIVE the operative clause (Round 112 §2)', SEX_UNSPLIT.survive > 0, true);
check(
  'the Round 111 number, reproduced as history: zero survive the SUPERSEDED strict clause',
  SEX_UNSPLIT.strictSurvive,
  0,
);
check(
  'HISTORICAL, unsplit alphabet: every discriminating sep-shape is ambiguous — the Round 113 §2 number',
  SEX_UNSPLIT.ambiguousSepShapes,
  SEX_UNSPLIT.discSepShapes,
);
check(
  'both cells admit an unscoreable one-call shape (the ordinal rule has no call 2)',
  [SEX_HOLD.gaps > 0, armS['S-unexposed, gate 2 HOLDING'].gaps > 0],
  [true, true],
);

// ── Round 115 §2–§3. The gate-1b split, and what it does to the ambiguity dispute. ─────────────
check(
  'GIVEN GATE 1b, S-exposed admits no X0 and no X1, so NOTHING in it can be voided',
  SEX_HOLD.survive,
  SEX_HOLD.disc,
);
check(
  'and its discriminating sep-shapes are then UNAMBIGUOUS on seps alone — 0, not 10 and not 7',
  SEX_HOLD.ambiguousSepShapes,
  0,
);
check(
  'a gate-1b BREACH reaches discriminating shapes — so the ambiguity is conditional on the gate',
  SEX_BREACH.disc > 0,
  true,
);
check(
  'and every one of them is removed by §3.1, which is the runtime backstop — same shape as gate 2',
  SEX_BREACH.survive,
  0,
);
// The load-bearing invariance. If this fails, the gate-1b reading changes the arm's advertised
// discriminating power and cannot be adopted without re-opening §2a's headline number.
check(
  'the SURVIVING sep-shapes are IDENTICAL across the split — the 10 does not move with the gate',
  SEX_HOLD.survivingSepShapeList,
  SEX_UNSPLIT.survivingSepShapeList,
);
check(
  'and there are ten of them, matching §2a as it stands',
  SEX_HOLD.survivingSepShapeList.length,
  10,
);
// Why the dispute existed at all: ambiguity is a CROSS-GATE artifact. Neither block alone has any.
check(
  'ambiguity is zero WITHIN each block and nonzero only when they are mixed — it measured the mixing',
  [SEX_HOLD.ambiguousSepShapes, SEX_BREACH.ambiguousSepShapes, SEX_UNSPLIT.ambiguousSepShapes > 0],
  [0, 0, true],
);
// The identical property, one cell over, found in Round 113 and not carried across in that commit.
check(
  'S-unexposed shows the same pattern, which is why this one should have been caught then',
  [
    armS['S-unexposed, gate 2 HOLDING'].ambiguousSepShapes,
    armS['S-unexposed, gate-2 BREACH reachable'].ambiguousSepShapes,
  ],
  [0, 0],
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
  The comparison as it stands now:            arm T 15 of 15  vs  arm S ${SEX_HOLD.survive} discriminating
  kind-shapes surviving the operative clause, every one of them flagged sequenceEndogenous. That
  count is unchanged by the Round 115 gate-1b split — the surviving sep-shapes are set-identical
  across it (self-check above), so nothing in this pricing moves with the gate.

  So arm T's margin is no longer "some Q2 power vs none". It is:
    · unflagged vs flagged  — T's sequence is forced by geometry, so no T run is sequenceEndogenous;
    · guaranteed vs base-rate-dependent — T lands on its shape by construction, S lands on one only
      if the model issues a second query (10/10 observed, Round 112 §4; a two-target geometry, so
      undetermined for S's one-target cells).
  The third limb — unambiguous vs ambiguous — is GONE, not merely closeable. Round 113 §5 priced it
  as closeable for free by the §3 record fix. Round 115 finds it was never a margin at all: arm S's
  ambiguity is ${SEX_HOLD.ambiguousSepShapes} given gate 1b, and the ${SEX_UNSPLIT.ambiguousSepShapes} that Rounds 113/114 disputed is a property of the
  unsplit alphabet rather than of the cell. T never had this limb to win.

  That margin is real, it is much smaller than a 15-vs-0, and it is now two limbs rather than three.
  It remains conditional on a buildability nobody has derived — and gate 1b adds a second underived
  condition on the S side of the comparison, which cuts the other way. See Round 115 §5.`);

console.log('\n  self-checks:');
check('every T cell discriminates', ARM_T_CELLS.every((c) => discriminates(c.seps)), true);
check(
  'the three cells cover all three pairwise separations',
  [...allPairsCovered].sort(),
  ['free vs recency', 'ordinal vs free', 'ordinal vs recency'],
);
check(
  "arm S's operative Q2 power is not zero, so the 15-vs-0 framing no longer holds",
  SEX_HOLD.survive > 0,
  true,
);
check(
  "T's ambiguity limb is empty under gate 1b — it was priced as closeable, it was never a margin",
  SEX_HOLD.ambiguousSepShapes,
  0,
);

// ── (e) Did gate 1b hold in the corpus? The two runs that match gate 1's shape ─────────────────
// Round 114 §2 (Theseus) reports zero X0 witnesses across all ten runs. That result has a reading
// stronger than "X0 is unwitnessed", and it is the reading that bears on arm S: it is evidence
// about GATE 1b, in the only corpus runs whose trajectory matches S-exposed's gate-1 shape.
//
// A run matches gate 1 iff its FIRST render carries sep >= 1. In such a run gate 1b is breached iff
// some later render introduced a neighbourhood not already on screen — i.e. a later X1 (a second
// sep>=1 render introducing new rows) or a later X0 (a productive sep-0 render introducing new
// rows). The first disjunct is derivable HERE from the sep table; the second is Theseus's zero.

console.log('\n=== (e) Gate 1b in the ten-run corpus — the runs matching S-exposed`s gate-1 shape ===\n');

const gate1Runs = LIVE_RUNS.filter((r) => r.seps.length > 0 && r.seps[0] >= 1);
// Derivable here: a later X1 requires a SECOND sep>=1 render. Count them per run.
const laterSepGE1 = (r) => r.seps.slice(1).filter((s) => s >= 1).length;
// REPORTED — Round 114 §2: no productive sep-0 render in ANY of the ten runs introduced a new
// neighbourhood. This seat cannot open the artifacts; the dependency is named, not hidden.
const REPORTED_X0_WITNESSES = 0;

for (const r of gate1Runs) {
  console.log(
    `  ${r.id}  seps=[${r.seps.join(',')}]  later sep>=1 renders: ${laterSepGE1(r)} (derived here)` +
      `   later X0: ${REPORTED_X0_WITNESSES} (REPORTED, Round 114 §2)`,
  );
}
console.log(`
  In both, gate 1b HELD: no later render introduced a neighbourhood the call-1 render had not
  already shown. The mechanism is not luck — the sep>=1 render is the UNION of the family's two
  regions, so every later render is a subset of it. Gate 1b is therefore ENTAILED by gate 1 in any
  geometry where every QUERY-RENDERABLE row lies inside the union the exposing query renders.

  AMENDED 2026-08-29 (Round 117 §1), and the amendment is against this seat's own Round 115 §4,
  which stated the antecedent as "exactly two regions where the exposing query reaches both" and
  called the resulting count the cheapest open item. Arm R satisfies THAT antecedent — two regions
  total — so nothing in this section moves. Arm S-exposed cannot satisfy it at all: see (f).

  CLASS LABEL, and it is the whole caveat: this is arm R's TWO-target geometry. Standing rule 11 —
  a finished arm is a prior, not a cell, unless the geometry matches on what the premise reads.
  This is a prior of 2 of 2. It is NOT a derivation for arm S, and after (f) it is no longer a
  \`--dry\`-checkable question either: gate 1b stays an enumeration over the registered query set.`);

console.log('\n  self-checks:');
check(
  'exactly two corpus runs match gate 1 (call-1 render carries sep>=1)',
  gate1Runs.map((r) => r.id),
  ['R L1', 'R L5'],
);
check(
  'neither has a second sep>=1 render, so neither admits a later X1 — derived from the sep table',
  gate1Runs.map((r) => laterSepGE1(r)),
  [0, 0],
);
check(
  'with Round 114 §2`s zero X0, gate 1b held in 2 of 2 — a two-target-geometry PRIOR, not a derivation',
  [gate1Runs.length, REPORTED_X0_WITNESSES],
  [2, 0],
);
// The shape those two runs exhibit is the one the whole dispute was about.
check(
  'and the shape they exhibit, [1,0], is a SURVIVING sep-shape under both readings of the alphabet',
  [
    SEX_HOLD.survivingSepShapeList.includes('1,0'),
    SEX_UNSPLIT.survivingSepShapeList.includes('1,0'),
  ],
  [true, true],
);

// ── (f) Arm S-exposed's region count — CLOSED, and against Round 115 §4 ─────────────────────────
// Round 115 §4 (this seat) stated the entailment as:
//
//     "Gate 1b is ENTAILED by gate 1 in any geometry with exactly two regions where the exposing
//      query reaches both"
//
// and called the resulting question — arm S-exposed's region count — "the cheapest of the open
// items" (Round 115 §5). Both are wrong, and Theseus's Round 116 gate 3b is what makes them
// checkable rather than merely arguable.
//
// The mechanism the entailment rests on is a SUBSET argument: the sep>=1 render is the union of the
// exposing family's regions, so every later render is a subset of it and can introduce nothing. That
// step needs "no renderable row lies outside the union" — which the antecedent supplied by asserting
// the geometry has exactly two regions in total. Arm R's two-target geometry satisfies it.
//
// Arm S-exposed CANNOT, by construction. Gate 3b — "No query in the registered query set renders any
// restriction row, in either cell" — asserts a row-range that no query renders. A range no query
// renders is not inside the range the exposing query renders. So it is a third region, and the
// antecedent "exactly two regions" is FALSE for S-exposed. The count was never open: it is >= 3, and
// it has to be, or the arm has no DV to measure (the restriction must be off-screen for an `expand`
// to be the thing that reaches it).
//
// What rescues the entailment is that the relevant quantity was never "regions" but "regions a QUERY
// can render". Gate 1b's breach kinds X0 and X1 are both `productive: true` — productivity is a
// property of a query render, and `seps` is defined in this file (line ~84) as the per-render list
// "up to but NOT including the expand call". An expand-only range therefore cannot instantiate X0 or
// X1 at all. Corrected antecedent:
//
//     Gate 1b is ENTAILED by gate 1 in any geometry where every QUERY-RENDERABLE row lies inside the
//     union the exposing query renders.
//
// Arm R satisfies it by having two regions total. Arm S-exposed satisfies it IFF gate 3b holds at
// S-EXPOSED scope — i.e. exactly Theseus's Round 116 §6 both-cells scope call, which he flagged for
// objection. It is adopted here, and on a stronger ground than he gave: at S-exposed scope gate 3b
// is what makes S-exposed's version of this antecedent stateable at all. Under an S-unexposed-only
// scope the third region is unconstrained and the entailment has no S-exposed form.
//
// NO NUMBER MOVES. The corpus 2-of-2 was already labelled a PRIOR, not a derivation (standing rule
// 11), and section (e) above is untouched. What is retracted is the claim that the pre-spend check
// "reduces to counting the regions" for arm S. Gate 1b stays what its own text says it is: an
// enumeration over the registered query set.
//
// ── Round 118 (Theseus), two corrections to the section above, both against this seat ────────────
//
// (1) THE CORRECTED-ANTECEDENT CHECK WAS VACUOUS AS FIRST WRITTEN. It read
//
//       queryRenderable            = REGIONS.filter(r => r.renderedBy === 'query')
//       outsideUnionAndRenderable  = REGIONS.filter(r => !queryRenderable.includes(r)
//                                                        && r.renderedBy === 'query')
//
//     — a conjunction of a predicate with its own negation. It is the empty list for EVERY possible
//     input, so `check(..., 0)` passed on a tautology and would have passed on a geometry that
//     violated the antecedent outright. The mutation did not catch it, because the mutation asserted
//     over `renderedBy` rather than over this filter. Standing rule 8's own failure mode, one level
//     up: a mutant that does not exercise the check it is placed under is a silently-skipped test.
//     The two fields are now independent (`queryRenderable`, `outsideCall1Union`) and the filter is a
//     real conjunction over them — the gate-3b mutant now drives it to ['RESTR'].
//
// (2) THE TWO GROUNDS FOR ">= 3" WERE PACKED INTO ONE FIELD. See the inventory comment below. The
//     consequence is not cosmetic: gate 3b's satisfiability is an OPEN item (§6), and an encoding in
//     which the 3b mutant also fells the ">= 3 BY CONSTRUCTION" check says, mechanically, that a
//     closed item is hostage to an open one. It is not — the DV ground stands whatever becomes of
//     3b. Three checks now pin this, including a mutation in each direction.
//
// Still no number moves: the count is 3, the surviving-shape count is 10, section (e) untouched.

console.log('\n=== (f) Arm S-exposed`s region count — closed, against Round 115 §4 ===\n');

const PREREG_PATH = new URL(
  '../docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md',
  import.meta.url,
);
if (!existsSync(PREREG_PATH)) {
  console.error(
    `\n  arm-S pre-registration not found at ${PREREG_PATH.pathname}.\n` +
      `  Section (f) checks a gate string verbatim against that tracked repo file; without it this\n` +
      `  check is not runnable here. Sections (a)–(e) above ran and their verdicts stand.\n`,
  );
  process.exit(2);
}
const prereg = readFileSync(PREREG_PATH, 'utf8').replace(/\s+/g, ' ');
const GATE_3B_TEXT = 'No query in the registered query set renders any restriction row, in either cell.';

// The S-exposed region inventory, as the design asserts it. Each entry names what renders it.
//
// AMENDED 2026-08-29 (Round 118 §1, Theseus, against Round 117 §(f) — this seat's own encoding).
// The docblock above states TWO independent grounds for RESTR being a third region:
//
//   (i)  gate 3b — no registered query renders a restriction row, so it is outside the call-1 union;
//   (ii) the DV — the restriction must be off-screen at the decision or `expand` has nothing to
//        reach and the arm measures nothing. This one cites no gate at all.
//
// The prose had both. The DATA MODEL had one field, `renderedBy`, carrying both — so the gate-3b
// mutation below (which sets it to 'unconstrained') knocked out ground (ii) as collateral, and the
// ">= 3 BY CONSTRUCTION" check went red for a reason its own text does not name. Read literally, the
// instrument said the count's closure depends on gate 3b, whose satisfiability is an OPEN item (§6).
// It does not: ground (ii) is untouched by 3b's fate. Left as it was, the next fire to find 3b
// unsatisfiable would have reopened an item that never rested on it.
//
// So the two grounds are now separate fields. `queryRenderable` is what gate 3b decides;
// `outsideCall1Union` is what the DV decides. The mutation strips only the former.
const S_EXPOSED_REGIONS = [
  {
    id: 'E-a',
    renderedBy: 'query',
    queryRenderable: true,
    outsideCall1Union: false,
    groundsForSeparateRegion: [],
    why: '§1: call-1 render is two-excerpt (`excerptSeparators: 1`) — first excerpt',
  },
  {
    id: 'E-b',
    renderedBy: 'query',
    queryRenderable: true,
    outsideCall1Union: false,
    groundsForSeparateRegion: [],
    why: '§1: … second excerpt of the same sep-1 render',
  },
  {
    id: 'RESTR',
    renderedBy: 'expand',
    queryRenderable: false, // decided by gate 3b
    outsideCall1Union: true, // decided by the DV, independently of any gate
    groundsForSeparateRegion: ['gate-3b', 'DV'],
    why: 'gate 3b: no query renders any restriction row · DV: `expand` must have somewhere to go',
  },
];
// ── Round 119 (Daedalus), standing rule 8b: a mutation licenses only the assertion it actually
// runs through. Round 118 fixed the vacuous filter but re-expressed each predicate INLINE at its
// mutant site, so check and mutant were two copies of one intent — the drift the rule is about,
// one level down. They are now single named bindings applied to both the real and the mutant
// inventory, so no later edit can move one without moving the other. Discharge is STRUCTURAL, not
// assertional: no check can detect a future editor re-inlining one of these. What IS assertable is
// that the mutation still moves the licensed expression's value, and each has a `BITES` check below.
const queryRenderableRows = (regions) => regions.filter((r) => r.queryRenderable);
const renderableOutsideUnion = (regions) =>
  regions.filter((r) => r.queryRenderable && r.outsideCall1Union);
// Grounds for the >= 3 conclusion that do NOT cite gate 3b. If this is empty, the closure of the
// region count really is hostage to an open item and should be re-labelled as conditional.
const gate3bFreeSupport = (regions) =>
  regions.flatMap((r) => r.groundsForSeparateRegion.filter((g) => g !== 'gate-3b'));
// The ">= 3 BY CONSTRUCTION" claim in full. Round 118's real check asserted only the `some(...)`
// half while its mutant asserted `some(...) && length >= 3` — already a different expression from
// the one it licensed, before any later edit. One binding now carries the whole claim.
const countIsAtLeastThreeByConstruction = (regions) =>
  regions.some((r) => r.outsideCall1Union) && regions.length >= 3;

const queryRenderable = queryRenderableRows(S_EXPOSED_REGIONS);
const outsideUnionAndQueryRenderable = renderableOutsideUnion(S_EXPOSED_REGIONS);
const gate3bFreeGrounds = gate3bFreeSupport(S_EXPOSED_REGIONS);

for (const r of S_EXPOSED_REGIONS) {
  console.log(`  ${r.id.padEnd(6)} rendered by ${r.renderedBy.padEnd(6)} — ${r.why}`);
}
console.log(`
  region count (S-exposed):                 ${S_EXPOSED_REGIONS.length}   → old antecedent wanted exactly 2: FALSE
  of those, QUERY-renderable:               ${queryRenderable.length}   → all inside the call-1 union
  query-renderable OUTSIDE the union:       ${outsideUnionAndQueryRenderable.length}   → corrected antecedent: SATISFIED, given gate 3b

  Arm R, for contrast: 2 regions total, the exposing query reaches both — it satisfies the OLD
  antecedent, so section (e)'s 2-of-2 prior is unaffected by this correction.

  Grounds for RESTR being a third region:    ${S_EXPOSED_REGIONS.find((r) => r.id === 'RESTR').groundsForSeparateRegion.join(', ')}
  of those, NOT citing gate 3b:              ${gate3bFreeGrounds.join(', ') || 'NONE'}
  → the >= 3 count is closed on the DV ground alone. Gate 3b's satisfiability is still OPEN (§6),
    and that open item cannot reopen this closed one. What DOES need 3b is the corrected antecedent,
    not the count — the two mutations below separate them.`);

console.log('\n  self-checks:');
check(
  'gate 1b`s breach kinds are both PRODUCTIVE — so productivity is a property of QUERY renders',
  [K.X0.productive, K.X1.productive],
  [true, true],
);
check(
  'an expand-only range cannot instantiate X0 or X1 — no kind in the alphabet is an expand render',
  Object.values(K).every((k) => k.productive === false || typeof k.nbhd === 'string'),
  true,
);
check(
  'gate 3b is present verbatim in the pre-registration, at BOTH-cells scope',
  prereg.includes(GATE_3B_TEXT.replace(/\s+/g, ' ')),
  true,
);
check(
  'S-exposed`s region count is 3, not 2 — Round 115 §4`s antecedent is FALSE for this arm',
  S_EXPOSED_REGIONS.length === 2,
  false,
);
check(
  'and it is >= 3 BY CONSTRUCTION: dropping the restriction region leaves the DV nothing to reach',
  countIsAtLeastThreeByConstruction(S_EXPOSED_REGIONS),
  true,
);
// Round 118 §1. The check above now reads `outsideCall1Union` (the DV ground) rather than
// `renderedBy` (which the gate-3b mutation overwrites). This one asserts the independence itself,
// so it is not merely implicit in the field split.
check(
  'the >= 3 conclusion has at least one ground that does not cite gate 3b — so 3b`s open satisfiability cannot reopen a closed item',
  gate3bFreeGrounds,
  ['DV'],
);
check(
  'the CORRECTED antecedent is satisfied for S-exposed: no query-renderable row outside the union',
  outsideUnionAndQueryRenderable.length,
  0,
);
// Mutation (standing rule 8 — a mutant that did not apply is a silently-skipped test). Drop gate 3b
// from S-exposed scope and the restriction region becomes query-renderable-for-all-we-know, which
// puts a renderable row outside the union and voids the corrected antecedent.
//
// Round 118 §1: the mutant now flips ONLY `queryRenderable`, which is the single fact gate 3b
// decides. Round 117's mutant overwrote `renderedBy`, the field both grounds were packed into, so it
// knocked out the DV ground as collateral. Two checks below pin the difference: the antecedent must
// break, and the >= 3 count must NOT.
const MUTANT_REGIONS = S_EXPOSED_REGIONS.map((r) =>
  r.id === 'RESTR' ? { ...r, queryRenderable: true, groundsForSeparateRegion: ['DV'] } : r,
);
check(
  'MUTANT — without gate 3b at S-exposed scope, the corrected antecedent is UNMET: a query-renderable row sits outside the union',
  renderableOutsideUnion(MUTANT_REGIONS).map((r) => r.id),
  ['RESTR'],
);
check(
  'MUTANT — and the region count survives it: >= 3 still holds on the DV ground alone',
  countIsAtLeastThreeByConstruction(MUTANT_REGIONS),
  true,
);
// Rule 8b, assertable half: the mutation must MOVE the value of the very expression the check reads.
// A mutant that applies, goes red elsewhere, and leaves this expression where it was licenses nothing.
check(
  'BITES — the gate-3b mutation moves the licensed expression itself, not merely some neighbouring one',
  renderableOutsideUnion(S_EXPOSED_REGIONS).length !== renderableOutsideUnion(MUTANT_REGIONS).length,
  true,
);
// And the other direction is a real claim too: this mutation must NOT move the count expression.
// Round 117's mutant did move it, which is the collateral Round 118 separated out.
check(
  'BITES — and it leaves the count expression alone, so the two grounds are genuinely independent',
  countIsAtLeastThreeByConstruction(S_EXPOSED_REGIONS) ===
    countIsAtLeastThreeByConstruction(MUTANT_REGIONS),
  true,
);
// Second mutation, in the other direction: strip the DV ground and the >= 3 claim loses its
// gate-independent support, which is the state Round 117's encoding was indistinguishable from.
const MUTANT_NO_DV = S_EXPOSED_REGIONS.map((r) =>
  r.id === 'RESTR'
    ? { ...r, outsideCall1Union: false, groundsForSeparateRegion: ['gate-3b'] }
    : r,
);
check(
  'MUTANT — strip the DV ground and no gate-3b-free support remains, so the closure would be conditional on an open item',
  gate3bFreeSupport(MUTANT_NO_DV),
  [],
);
check(
  'BITES — the DV-stripping mutation moves the support expression the closure check reads',
  gate3bFreeSupport(S_EXPOSED_REGIONS).length !== gate3bFreeSupport(MUTANT_NO_DV).length,
  true,
);
check(
  'no count moves: S-exposed`s surviving discriminating shapes are still 10 under gate 1b',
  SEX_HOLD.survive,
  10,
);

console.log(
  `\n${failures.length === 0 ? `PASS — all self-checks passed` : `FAIL — ${failures.length} self-check(s) failed:\n  ` + failures.join('\n  ')}`,
);
process.exit(failures.length === 0 ? 0 : 1);
