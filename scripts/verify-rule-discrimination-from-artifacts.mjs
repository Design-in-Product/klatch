#!/usr/bin/env node
/**
 * verify-rule-discrimination-from-artifacts.mjs — Theseus, Round 112.
 *
 * Companion to `scripts/verify-rule-discrimination.mjs` (Daedalus, Round 111). That script says of
 * itself, in its header: the ten-run corpus is "transcribed from the committed record, not read
 * from the artifacts … If those transcriptions are wrong, this script is wrong with them."
 *
 * This one reads the artifacts. They are on Theseus's seat, in gitignored `.testdata/`, which is
 * why Daedalus could not. It does three things his cannot:
 *
 *   (a) DERIVES the ten-run `seps` table from the probe JSONs and diffs it against the hardcoded
 *       table, closing the transcription gap mechanically rather than by eye.
 *   (b) Reports the BEHAVIOURAL base rates the arm-S estimate needs — how many calls runs actually
 *       make, how often a query comes back `rows=0`, whether models ever repeat a query.
 *   (c) Recomputes arm S's rule-12 number under the NARROWED void clause that the 2026-08-28 STOP
 *       fire put into the pre-registration, rather than the strict clause that fire superseded.
 *
 * Requires `.testdata/recall-probe-{R94L1..L5-Q,R106L1..L5-R}.json`. Exits 2 (not 1) if they are
 * absent, so "no data on this seat" is distinguishable from "a check failed".
 *
 * Usage:  node scripts/verify-rule-discrimination-from-artifacts.mjs
 * Exit:   0 all checks pass · 1 a check failed · 2 artifacts not on this seat
 */

import fs from 'node:fs';

// ── The three rival rules — character-for-character the definitions in Round 111's verifier ────
const RULES = {
  ordinal: (seps) => (seps.length < 2 ? 'undefined' : seps[1] >= 1 ? 'suppress' : 'expand'),
  free: (seps) => (seps.some((s) => s >= 1) ? 'suppress' : 'expand'),
  recency: (seps) =>
    seps.length === 0 ? 'undefined' : seps[seps.length - 1] >= 1 ? 'suppress' : 'expand',
};
const RULE_NAMES = Object.keys(RULES);
const predictions = (seps) => RULE_NAMES.map((n) => RULES[n](seps));
const unscoreable = (seps) => predictions(seps).includes('undefined');
const discriminates = (seps) => !unscoreable(seps) && new Set(predictions(seps)).size > 1;

// What Round 111's verifier hardcodes, reproduced here as the CLAIM under test.
const TRANSCRIBED = {
  'Q L1': { seps: [0, 1], expanded: false },
  'Q L2': { seps: [0, 1], expanded: false },
  'Q L3': { seps: [0, 0], expanded: true },
  'Q L4': { seps: [0, 1], expanded: false },
  'Q L5': { seps: [0, 1], expanded: false },
  'R L1': { seps: [1, 0], expanded: false },
  'R L2': { seps: [0, 1, 0, 0, 0], expanded: true },
  'R L3': { seps: [0, 1], expanded: false },
  'R L4': { seps: [0, 1], expanded: false },
  'R L5': { seps: [1, 0], expanded: false },
};

const ARTIFACTS = [
  ['Q L1', 'R94L1-Q'],
  ['Q L2', 'R94L2-Q'],
  ['Q L3', 'R94L3-Q'],
  ['Q L4', 'R94L4-Q'],
  ['Q L5', 'R94L5-Q'],
  ['R L1', 'R106L1-R'],
  ['R L2', 'R106L2-R'],
  ['R L3', 'R106L3-R'],
  ['R L4', 'R106L4-R'],
  ['R L5', 'R106L5-R'],
];

const failures = [];
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label} — ${JSON.stringify(got)}`);
};

// ── Read ───────────────────────────────────────────────────────────────────────────────────────
const missing = ARTIFACTS.filter(([, f]) => !fs.existsSync(`.testdata/recall-probe-${f}.json`));
if (missing.length) {
  console.error(
    `artifacts not on this seat (${missing.length}/${ARTIFACTS.length} missing, e.g. ` +
      `.testdata/recall-probe-${missing[0][1]}.json).\n` +
      `.testdata/ is gitignored; this check only runs on the seat that produced the probes.`,
  );
  process.exit(2);
}

const runs = ARTIFACTS.map(([id, f]) => {
  const r = JSON.parse(fs.readFileSync(`.testdata/recall-probe-${f}.json`, 'utf8'))['0'];
  const calls = r.toolCalls.map((c) => ({
    kind: c.kind,
    query: c.query ?? '',
    rows: c.rows,
    // The rules read renders produced STRICTLY BEFORE the expand decision, so `expand` calls are
    // excluded below rather than filtered here — kept visible so the exclusion is auditable.
    sep: c.rendered ? c.rendered.excerptSeparators : null,
    matchCount: c.rendered ? c.rendered.matchCount : null,
    shownCount: c.rendered ? c.rendered.shownCount : null,
    edgeLines: c.rendered ? c.rendered.edgeLines : null,
    offers: c.rendered ? (c.rendered.addressesOffered ?? []).length : null,
  }));
  const searches = calls.filter((c) => c.kind === 'search');
  return {
    id,
    file: f,
    calls,
    searches,
    seps: searches.map((c) => c.sep),
    expanded: r.expandAction.expandCallCount > 0,
  };
});

// ── (a) Transcription: derived vs hardcoded ────────────────────────────────────────────────────
console.log('=== (a) Ten-run table DERIVED from the artifacts, diffed against the transcription ===\n');
console.log('  run    calls  searches  seps (from artifacts)   expanded   vs Round 111 verifier');
for (const r of runs) {
  const t = TRANSCRIBED[r.id];
  const same =
    JSON.stringify(t.seps) === JSON.stringify(r.seps) && t.expanded === r.expanded;
  console.log(
    `  ${r.id.padEnd(6)} ${String(r.calls.length).padStart(3)}    ` +
      `${String(r.searches.length).padStart(4)}      ${`[${r.seps.join(',')}]`.padEnd(20)} ` +
      `${String(r.expanded).padEnd(9)} ${same ? 'MATCH' : `MISMATCH (had [${t.seps.join(',')}] / ${t.expanded})`}`,
  );
}

console.log('\n  self-checks:');
check(
  'every derived sep sequence matches the transcribed one',
  runs.filter((r) => JSON.stringify(TRANSCRIBED[r.id].seps) !== JSON.stringify(r.seps)).map((r) => r.id),
  [],
);
check(
  'every derived DV matches the transcribed one',
  runs.filter((r) => TRANSCRIBED[r.id].expanded !== r.expanded).map((r) => r.id),
  [],
);

// ── (b) The behavioural base rates the arm-S estimate needs ────────────────────────────────────
console.log('\n=== (b) Base rates, read from the same artifacts ===\n');

const searchCounts = runs.map((r) => r.searches.length);
const oneSearchRuns = runs.filter((r) => r.searches.length === 1);
const zeroRowRuns = runs.filter((r) => r.searches.some((c) => c.rows === 0));
const repeatQueryRuns = runs.filter((r) => {
  const qs = r.searches.map((c) => c.query);
  return new Set(qs).size !== qs.length;
});

console.log(`  searches per run:            [${searchCounts.join(', ')}]  (min ${Math.min(...searchCounts)})`);
console.log(`  runs issuing only ONE search: ${oneSearchRuns.length}/10  ${oneSearchRuns.map((r) => r.id).join(', ')}`);
console.log(`  runs with a rows=0 search:    ${zeroRowRuns.length}/10  ${zeroRowRuns.map((r) => r.id).join(', ')}`);
console.log(`  runs repeating a query:       ${repeatQueryRuns.length}/10  ${repeatQueryRuns.map((r) => r.id).join(', ')}`);

// What a rows=0 render actually contains — the fact the strict void clause turns on.
console.log('\n  every rows=0 render, itemised (the shape §3\'s strict clause counts as "a render"):');
for (const r of runs) {
  r.searches.forEach((c, i) => {
    if (c.rows !== 0) return;
    console.log(
      `    ${r.id} call ${i + 1}: sep=${c.sep} matchCount=${c.matchCount} shownCount=${c.shownCount} ` +
        `edgeLines=${c.edgeLines} addressesOffered=${c.offers}`,
    );
  });
}
const zeroRowRenders = runs.flatMap((r) => r.searches.filter((c) => c.rows === 0));
const productiveSepZero = runs.flatMap((r) => r.searches.filter((c) => c.rows > 0 && c.sep === 0));
console.log(
  `\n  sep-0 renders come in two kinds: ${zeroRowRenders.length} from rows=0 (0 excerpts, 0 offers) ` +
    `and ${productiveSepZero.length} from rows>0 (a real single-excerpt render).`,
);

console.log('\n  self-checks:');
check('no live run issued fewer than two searches', Math.min(...searchCounts), 2);
check('no live run issued exactly one search', oneSearchRuns.length, 0);
check('no live run ever repeated a query', repeatQueryRuns.length, 0);
check('exactly two live runs issued a rows=0 search', zeroRowRuns.map((r) => r.id), ['Q L3', 'R L2']);
check(
  'every rows=0 render shows nothing: 0 excerpts and 0 offered addresses',
  zeroRowRenders.every((c) => c.shownCount === 0 && c.offers === 0 && c.edgeLines === 0),
  true,
);
check(
  'sep 0 also occurs on PRODUCTIVE renders, so sep alone cannot identify an unproductive query',
  productiveSepZero.length > 0,
  true,
);

// ── (c) Arm S under the strict clause vs the narrowed one now in the pre-registration ──────────
console.log('\n=== (c) Arm S: the rule-12 number under each version of §3 ===\n');

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

// STRICT — the original clause, used for the "0 of 10" in the memo and pre-registration §2a:
// "unproductive second query AND the run still shows two renders" ⇒ void. Encoded on seps alone.
const voidedStrict = (seps) => seps.length >= 2 && seps.slice(1).some((s) => s === 0);

// NARROWED — pre-registration §3 as amended 2026-08-28 (Round 111 §5.2). Void ONLY on an exposure-
// exogeneity violation: sep>=1 in S-unexposed, or a second DISTINCT productive neighbourhood. A
// rows=0 miss is "recorded, scored, and flagged as sequenceEndogenous", NOT voided.
//
// On seps alone, a later sep>=1 in S-exposed is undecidable — a repeat of the one productive
// neighbourhood (allowed) and a second distinct one (void) both print sep 1. That ambiguity is
// reported rather than resolved, because the enumeration does not carry the field that decides it.
const voidedNarrowed = (cell, seps) => {
  if (cell === 'S-unexposed') return seps.some((s) => s >= 1);
  return false; // S-exposed: a rows=0 miss no longer voids; a repeat is permitted.
};
const ambiguousNarrowed = (cell, seps) => cell === 'S-exposed' && seps.slice(1).some((s) => s >= 1);

const CELLS = [
  { cell: 'S-exposed', shapes: enumerateShapes(1, [1, 0], 4) },
  { cell: 'S-unexposed', shapes: enumerateShapes(0, [0], 4) },
];

const armS = {};
for (const { cell, shapes } of CELLS) {
  const disc = shapes.filter((s) => discriminates(s));
  const strictSurv = disc.filter((s) => !voidedStrict(s));
  const narrowSurv = disc.filter((s) => !voidedNarrowed(cell, s));
  const narrowClean = narrowSurv.filter((s) => !ambiguousNarrowed(cell, s));
  armS[cell] = {
    shapes: shapes.length,
    disc: disc.length,
    strict: strictSurv.length,
    narrowed: narrowSurv.length,
    narrowedUnambiguous: narrowClean.length,
  };
  console.log(`  ${cell.padEnd(12)} shapes ${String(shapes.length).padStart(3)}  ` +
    `discriminating ${String(disc.length).padStart(2)}  ` +
    `surviving STRICT §3 ${String(strictSurv.length).padStart(2)}  ` +
    `surviving NARROWED §3 ${String(narrowSurv.length).padStart(2)} ` +
    `(of which unambiguous on seps alone: ${narrowClean.length})`);
}

console.log(
  '\n  The behavioural join — what the shape count means for runs you would actually observe:\n' +
    '    In a non-voided S-exposed run only one neighbourhood is productive (cell design; §3.1 voids\n' +
    '    a second distinct one). So ANY second query is unproductive ⇒ sep 0 ⇒ shape [1,0,…], which\n' +
    `    discriminates. Runs issuing a second query in the observed corpus: ${10 - oneSearchRuns.length}/10.`,
);

console.log('\n  self-checks:');
check('S-unexposed discriminates on nothing under either clause', [armS['S-unexposed'].strict, armS['S-unexposed'].narrowed], [0, 0]);
check('under the STRICT clause S-exposed survival is zero (reproduces Round 111)', armS['S-exposed'].strict, 0);
check('under the NARROWED clause S-exposed survival is NOT zero', armS['S-exposed'].narrowed > 0, true);
check(
  'the narrowed number equals the full discriminating set — nothing is voided in S-exposed',
  armS['S-exposed'].narrowed,
  armS['S-exposed'].disc,
);

console.log(
  failures.length ? `\nFAIL — ${failures.length} check(s) failed:\n  ${failures.join('\n  ')}` : '\nPASS — all self-checks passed',
);
process.exit(failures.length ? 1 : 0);
