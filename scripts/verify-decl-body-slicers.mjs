#!/usr/bin/env node
/**
 * **The detector half of `unit-469braceslice`'s routing: no NEW hand-rolled brace-balance body
 * slicer enters the tracked tree.**
 *
 * Why a detector and not a lesson, in one paragraph, because the next seat to read this will be
 * tempted to delete it: three fires hit the same defect in eighteen hours, and when Theseus
 * censused it (`docs/research/unit-469braceslice-2026-11-17/`) **four of the six files that had the
 * cure had written it BEFORE the incidents, and two of those four belonged to the seat that then
 * wrote the uncured form three days later, in the same directory, on the same day.** The cure was
 * already in both seats' own prior work, in those words, and did not reach the next instrument.
 * `indexOf('{')` is the obvious way to find a body; the guard appears only when the author has just
 * been bitten. That is a default, not a knowledge gap, and a default is cured by a gate.
 *
 * ## The four requirements, each one a measurement rather than a preference
 *
 * From `docs/research/unit-470bodyslice-2026-11-17/RESULTS.md`:
 *
 * 1. **Keyed on `git ls-files`, never a filesystem walk.** Theseus's census walked the filesystem
 *    and reported 52 unguarded; the same arm in my worktree reported 56, because **6 of my members
 *    were untracked scratch artefacts** and 2 of his were his own. A filesystem-keyed gate gives
 *    every seat a different number and lets an untracked file redden or green a shared check
 *    (RESULTS §1). The tracked figure is the only one two seats can both see.
 * 2. **Baselined by path**, so this reddens on a NEW slicer and not on the frozen population — 91%
 *    of which is one-off research arms whose figures are already published, where a migration buys
 *    nothing (RESULTS §2). A baseline entry that stops qualifying ALSO reddens: a pin whose red is
 *    cleared by editing the list is a gate, which is this corpus's established shape
 *    (`probe-round261`).
 * 3. **A declared marker at the site, not a path allowlist**, for a deliberate reproduction.
 *    Landing the cure *raised* the census's unguarded count by one, because the arm that measures
 *    the differential has to carry the naive walk on purpose (RESULTS §9). The next such arm will
 *    live at a path nobody has written down yet, so the exemption has to travel with the code.
 * 4. **The guard key covers the RETURN TYPE as well as the parameter list.** A brace-bearing return
 *    type (`): { prompt: string; floorApplied: boolean } {`) defeats a paren-match-only guard, and
 *    it is live at 16 sites in `packages/`. A key that accepts the paren-match alone would certify
 *    all six files Theseus called GUARDED as cured when they are not (RESULTS §4).
 *
 * ## How to clear a red
 *
 * Three ways, in preference order, printed by the run itself:
 *
 * - **Adopt the shared reader**: `import { bodyOf } from '<…>/scripts/lib/decl-body.mjs'`. This is
 *   the cure; the other two are escapes.
 * - **Mark the site** with `brace-slicer-deliberate:` and a reason on the same line, when the file's
 *   job is to reproduce the defect (a comparison arm, a mutant, a fixture).
 * - **Append the path to the baseline** when neither applies, which is a statement that a known
 *   unguarded slicer is being added on purpose. The baseline is a reviewable list, not a wildcard.
 *
 * Exit 0 = green, 1 = red, 2 = the detector could not run (missing baseline, `git` unavailable) —
 * three outcomes, not two, so a detector that cannot measure cannot report a pass.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { stripSource } from './lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BASELINE = join(HERE, 'decl-body-slicers.baseline');
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);

// This file and its baseline are outside the population by construction: a hygiene gate that walks
// its own directory reddens in every cell, and this seat has shipped exactly that defect.
const SELF = new Set([
  'scripts/verify-decl-body-slicers.mjs',
  'scripts/decl-body-slicers.baseline',
]);

/* ---------------------------------------------------------------- the keys */
// Character comparisons, either operand order — the same shape as unit-469's census key, so the two
// instruments are keyed on one question and cannot disagree about who is in the population.
const cmp = (ch) => new RegExp(`[=!]==?\\s*['"\`]\\${ch}['"\`]|['"\`]\\${ch}['"\`]\\s*[=!]==?`);
const OPEN_BRACE = cmp('{');
const CLOSE_BRACE = cmp('}');
const LPAREN = cmp('(');
const RPAREN = cmp(')');
const COLON = cmp(':');
const MARKER = /brace-slicer-deliberate:\s*\S+/;

/* ------------------------------------------------------------- the tracked tree (req. 1) */
let tracked;
try {
  tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
    .split('\n').map((l) => l.trim()).filter(Boolean);
} catch (e) {
  console.error(`verify-decl-body-slicers: BLOCKED — could not list tracked files: ${e.message}`);
  process.exit(2);
}
if (!existsSync(BASELINE)) {
  console.error(`verify-decl-body-slicers: BLOCKED — baseline missing at ${BASELINE}.`
    + ' A detector with no baseline would redden on the whole frozen population; it refuses rather'
    + ' than reporting a pass it cannot support.');
  process.exit(2);
}
const baseline = readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
const baselineSet = new Set(baseline);

/* ------------------------------------------------------------------- classify */
const verdicts = new Map();
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw;
  try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  // **Drive 13 defect, repaired here; drive 13 is kept as `drive13.detector-baseline-empty.out`.**
  // Every key here is a comparison against a QUOTED CHARACTER, so it must be read from the
  // comments-blanked / **strings-KEPT** reading. Drive 13 read the guard key from
  // `stripSource(raw, true)` — strings blanked — where `=== '('` has become `===  ` and the key
  // cannot match anything. The result was **0 GUARDED across a population of 62**, with
  // `scripts/lib/decl-body.mjs`, the cure itself, reported as a new hand-rolled slicer. A key whose
  // conjuncts are read from incompatible readings is not strict, it is unsatisfiable, and the tell
  // was the saturated verdict: when a three-way classification returns zero in one class, check
  // whether that class is reachable at all before writing down the other two.
  //
  // `blankStrings: false` is the reading `strip-source.mjs`'s own header names for "the caller is
  // looking for a quoted literal", which is exactly this caller. Comments are still blanked, so a
  // paren comparison quoted inside a comment cannot credit a file with a guard it does not run.
  const code = stripSource(raw, false);
  if (!OPEN_BRACE.test(code) || !CLOSE_BRACE.test(code)) continue; // not a slicer: out of population

  // The marker is read from RAW text: it lives in a comment, which `code` has blanked.
  //
  // **There is deliberately no ADOPTED class.** Drive 13 had one, keyed on the file importing
  // `lib/decl-body.mjs`, and it classified THIS UNIT'S OWN ARM as adopted — a file that imports the
  // shared reader *and* hand-rolls a naive slicer beside it, on purpose, to measure the
  // differential. The import is a FILE-level fact and the defect is a SITE-level one, so an adoption
  // key over-credits exactly the files most likely to carry both. A file that genuinely delegates
  // has no character comparison against a brace and is out of the population by the key itself;
  // one that still has them must say why at the site.
  if (MARKER.test(raw)) verdicts.set(rel, 'MARKED');
  else if (LPAREN.test(code) && RPAREN.test(code) && COLON.test(code)) verdicts.set(rel, 'GUARDED');
  else verdicts.set(rel, 'UNGUARDED');
}

const unguarded = [...verdicts].filter(([, v]) => v === 'UNGUARDED').map(([k]) => k);
const newOnes = unguarded.filter((f) => !baselineSet.has(f));
// Requirement 2's other half: an entry that no longer qualifies must redden, or the list silently
// accumulates paths that grant an exemption to files that no longer need one — and the next seat
// cannot tell a live grandfather clause from a dead one.
const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');

/* --------------------------------------------------------------------- report */
const counts = {};
for (const v of verdicts.values()) counts[v] = (counts[v] || 0) + 1;
console.log('verify-decl-body-slicers — brace-balance body slicers in the TRACKED tree');
console.log(`  tracked files read: ${tracked.filter((f) => EXTS.has(extname(f))).length}`);
console.log(`  population (compares against both braces): ${verdicts.size}`);
for (const [v, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`      ${v.padEnd(10)} ${n}`);
}
console.log(`  baseline entries: ${baseline.length}`);

if (newOnes.length === 0 && stale.length === 0) {
  console.log('\nDECL-BODY SLICERS OK — no new hand-rolled slicer, no stale baseline entry.');
  console.log('  NOT CHECKED: whether the baselined files produce wrong FIGURES. This grades the'
    + ' reader each file uses, not the numbers it has already published.');
  process.exit(0);
}

if (newOnes.length) {
  console.error(`\nRED — ${newOnes.length} new hand-rolled brace-balance body slicer(s):`);
  for (const f of newOnes) console.error(`      ${f}`);
  console.error('\n  A brace scan that starts at the first `{` is wrong on four live mechanisms in'
    + ' this tree: a TS type literal or an object default in the parameter list, a JSDoc `@type`'
    + ' brace, and a brace-bearing return type. Clear this by, in preference order:');
  console.error('    1. import { bodyOf, declBodies } from \'<…>/scripts/lib/decl-body.mjs\';');
  console.error('    2. put `brace-slicer-deliberate: <reason>` at the site, if the file\'s job is'
    + ' to reproduce the defect (a comparison arm, a mutant, a fixture);');
  console.error(`    3. append the path to ${BASELINE.replace(`${ROOT}/`, '')}, which states that a`
    + ' known unguarded slicer is being added on purpose.');
}
if (stale.length) {
  console.error(`\nRED — ${stale.length} stale baseline entry/entries (no longer unguarded, or gone):`);
  for (const f of stale) console.error(`      ${f}  → now ${verdicts.get(f) ?? 'ABSENT'}`);
  console.error('\n  Remove them from the baseline. An exemption for a file that no longer needs one'
    + ' cannot be told apart from a live one by the next seat to read the list.');
}
process.exit(1);
