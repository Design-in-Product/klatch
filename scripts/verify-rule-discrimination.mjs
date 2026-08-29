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
 * ── CLASS LABEL, read this before citing any number below ────────────────────────────────────
 * The ten-run corpus in LIVE_RUNS is **transcribed from the committed record, not read from the
 * artifacts**. The `.testdata/recall-probe-{R94L*-Q,R106L*-R}.json` files are on Theseus's seat
 * and `.testdata/` is gitignored, so this seat (Daedalus) cannot open them. Sources, per run:
 *   Q L1–L5   — Round 110 §2 (Theseus, read from the live artifacts that fire)
 *   R L1,L3,L4,L5 — Round 106 §4 as amended (two queries each, order as printed)
 *   R L2      — Round 108 §3 (the un-elided six-call table)
 * If those transcriptions are wrong, this script is wrong with them. It re-derives the
 * *arithmetic*, which is what it can check; it does not re-read the artifacts.
 *
 * The arm-S / arm-T sections are pure derivation from geometry and need no corpus.
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

// A run DISCRIMINATES iff every rival is defined on it AND they do not all predict the same thing.
// A run is UNSCOREABLE iff some rival has nothing to read — a scoring gap, not evidence. These are
// different failures and collapsing them inflates the rule-12 number, so they are counted apart.
const predictions = (seps) => RULE_NAMES.map((n) => RULES[n](seps));
const unscoreable = (seps) => predictions(seps).includes('undefined');
const discriminates = (seps) => !unscoreable(seps) && new Set(predictions(seps)).size > 1;

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

const failures = [];
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label} — ${JSON.stringify(got)}`);
};

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

// ── (b) Arm S, before the spend ───────────────────────────────────────────────────────────────
// Rule 12's second corollary. Enumerate the run shapes each cell can PRODUCE, given its geometry,
// and count how many of them the rivals would split on.
//
// S-exposed  : call 1's render carries sep>=1 by construction (the token-bearing neighbourhood is
//              the only productive query). Any later call is either a repeat of that productive
//              query (sep 1) or an unproductive miss (sep 0).
// S-unexposed: no query in the registered set can produce sep>=1 (pre-registration §3 gate 2).
//              Every render is sep 0, whatever the model does.

function enumerateShapes(firstSep, laterSeps, maxLen) {
  const out = [];
  const rec = (cur) => {
    out.push([...cur]);
    if (cur.length >= maxLen) return;
    for (const s of laterSeps) rec([...cur, s]);
  };
  rec([firstSep]);
  return out;
}

// The pre-registration's §3 exogeneity clause, strict reading, as written:
// "If the model issues an unproductive second query and the run still shows two renders, the
//  exogeneity claim has failed for that run — record it and void the run."
const voidedStrict = (seps) => seps.length >= 2 && seps.slice(1).some((s) => s === 0);

const CELLS = [
  { name: 'S-exposed  ', shapes: enumerateShapes(1, [1, 0], 4) },
  { name: 'S-unexposed', shapes: enumerateShapes(0, [0], 4) },
];

console.log('\n=== (b) Arm S — the rule-12 number, derived from geometry before any spend ===\n');

const armS = {};
for (const cell of CELLS) {
  const disc = cell.shapes.filter((s) => discriminates(s));
  const discSurviving = disc.filter((s) => !voidedStrict(s));
  const gaps = cell.shapes.filter((s) => unscoreable(s));
  armS[cell.name.trim()] = {
    disc: disc.length,
    surviving: discSurviving.length,
    gaps: gaps.length,
  };
  console.log(`  ${cell.name}  shapes reachable: ${String(cell.shapes.length).padStart(3)}`);
  console.log(`               of which the rivals split on: ${disc.length}`);
  console.log(
    `               of THOSE, surviving §3's void clause (strict reading): ${discSurviving.length}`,
  );
  console.log(
    `               unscoreable (a rival has nothing to read): ${gaps.length}` +
      `${gaps.length ? `  — ${gaps.map((s) => `[${s.join(',')}]`).join(' ')}` : ''}`,
  );
  if (disc.length) {
    for (const s of disc.slice(0, 6)) {
      console.log(
        `                 [${s.join(',')}] → ${predictions(s).join('/')}` +
          `${voidedStrict(s) ? '   ← VOIDED by §3' : ''}`,
      );
    }
    if (disc.length > 6) console.log(`                 … and ${disc.length - 6} more, all voided-or-not as above`);
  }
  console.log();
}

console.log('  self-checks:');
check('S-unexposed can produce ZERO discriminating shapes', armS['S-unexposed'].disc, 0);
check(
  'S-exposed discriminating shapes ALL fall to the strict void clause',
  armS['S-exposed'].surviving,
  0,
);
check(
  'both cells admit an unscoreable one-call shape (the ordinal rule has no call 2)',
  [armS['S-exposed'].gaps, armS['S-unexposed'].gaps],
  [1, 1],
);

// ── (c) A discrimination-first geometry, for contrast ────────────────────────────────────────
// Forced render sequences. Not proposed, not authorised, buildability underived — this block
// exists to show what the rule-12 number looks like when a design is built for it.

const ARM_T_CELLS = [
  { name: 'T1  [1,0]  ', seps: [1, 0] },
  { name: 'T2  [0,1,0]', seps: [0, 1, 0] },
  { name: 'T3  [0,0,1]', seps: [0, 0, 1] },
];

console.log('\n=== (c) For contrast: forced-sequence cells, every run discriminating ===\n');
for (const c of ARM_T_CELLS) {
  const p = predictions(c.seps);
  const splits = pairwiseDisagreements([{ id: c.name, seps: c.seps, expanded: false }])
    .filter((x) => x.n > 0)
    .map((x) => x.pair);
  console.log(
    `  ${c.name}  ordinal=${p[0]} free=${p[1]} recency=${p[2]}` +
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
console.log('\n  self-checks:');
check('every T cell discriminates', ARM_T_CELLS.every((c) => discriminates(c.seps)), true);
check(
  'the three cells cover all three pairwise separations',
  [...allPairsCovered].sort(),
  ['free vs recency', 'ordinal vs free', 'ordinal vs recency'],
);

console.log(
  `\n${failures.length === 0 ? `PASS — all self-checks passed` : `FAIL — ${failures.length} self-check(s) failed:\n  ` + failures.join('\n  ')}`,
);
process.exit(failures.length === 0 ? 0 : 1);
