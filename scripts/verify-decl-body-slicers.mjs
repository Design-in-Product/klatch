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
 *    **This requirement has no staleness counterpart, and cannot be given one by adding a list —
 *    it is the one asymmetry between requirements 2 and 3** (Theseus, `unit-486markerstale` §4.2,
 *    11/19). Dead markers are therefore DISCLOSED on every run and never reddened; see the
 *    `REQUIREMENT 3 HAS NO STALENESS COUNTERPART` block at the report, which carries the figures
 *    and the measured decline of the site-level variant.
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
import { blankLongStrings } from './lib/strip-source.mjs';

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
// Character comparisons, either operand order — the same shape as unit-469's census key.
//
// **This comment used to end "…so the two instruments are keyed on one question and cannot disagree
// about who is in the population." That was false, and the correction is a measurement, not a
// hedge** (Theseus, `unit-479braceslicekeys`, 11/18; reproduced in `unit-480guardorder` before it
// was written here). The two populations differ by **2 members**, one-directionally: this gate's is
// a strict SUBSET of the filesystem-walked census's. The cause is `.gitignore` —
// `docs/research/round41{3,4}-instruments/*.sliced.mjs` are on disk, matched by a per-directory
// ignore file, and invisible to `git ls-files`. **17 ignored code files sit under the census's four
// walk roots; 2 of them are in its population.** The divergence is structural and grows by one per
// unit that materialises a pre-cure blob under `unit-*/scratch/` — `unit-480`'s own cripple added
// the 18th while measuring this.
//
// The gap is **not** a reason to re-point this key at a filesystem walk. Requirement 1 exists
// because a filesystem-keyed gate gives every seat a different number; Theseus's own figures moved
// 62 → 69 → 68 across three fires for exactly that reason, one of the 69 being a file that has
// never existed in git. **The tracked subset is the right population for a shared gate and the
// wrong one for a census of what is on disk. Both instruments are right; they answer different
// questions, and this comment previously claimed they answered one.**
const cmp = (ch) => new RegExp(`[=!]==?\\s*['"\`]\\${ch}['"\`]|['"\`]\\${ch}['"\`]\\s*[=!]==?`);
const OPEN_BRACE = cmp('{');
const CLOSE_BRACE = cmp('}');
const LPAREN = cmp('(');
const RPAREN = cmp(')');
const COLON = cmp(':');
const MARKER = /brace-slicer-deliberate:\s*\S+/;
// The same key, global, for OCCURRENCES rather than files. Derived from `MARKER.source` so the two
// cannot drift: a second literal spelling of the marker vocabulary is the duplicated-literal defect
// `lib/marker-floor.mjs` describes one level out. **A count of marker-bearing FILES is not a count
// of MARKERS** — Theseus's `unit-486markerstale` §6 found the first file in this corpus to carry
// more than one (his own arm, 5), and until that fire all 17 carried exactly 1, which is why nothing
// had yet had to notice the difference.
// **Flags are carried over, not just the source, and that is a defect found while designing this
// unit's cripple rather than a precaution.** `new RegExp(MARKER.source, 'g')` — the first spelling
// here — silently DROPS every flag `MARKER` carries. `MARKER` carries none today, so there is no
// live divergence; the point is that adding `i` or `u` to the file-level key would leave the
// occurrence key reading a different pattern under the same name, which is the derived-reader drift
// this corpus keeps re-finding. The `Set` is because a duplicate `g` in the flag string throws.
const MARKER_ALL = new RegExp(MARKER.source, [...new Set(`${MARKER.flags}g`)].join(''));

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
// Requirement 3 has no staleness counterpart, and this is the disclosure that says so out loud.
// `[rel, occurrences]` for every tracked code file that carries a marker and is OUT of the
// population — the marker grants an exemption to a file with no live comparison to exempt.
// Collected inside the population loop, at the one point where `raw` is in hand and membership is
// already decided, rather than in a second pass with a second reading of the tree.
const deadMarkers = [];
let liveMarkerOccurrences = 0;
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
  // **NARROWED 2026-11-19 (`unit-484popnarrow`): string bodies of 2+ characters are blanked, 1-char
  // bodies KEPT.** `stripSource`'s two readings are both wrong for a quoted-character key, in
  // opposite directions, and this gate shipped each mistake in turn. Strings-blanked is drive 13
  // above. Strings-KEPT — what this line read until today — admits any file that merely QUOTES a
  // comparison: **8 of 73 members were in the population only because a fixture string contains
  // `"if (s[i] === '{') d += 1;"`**, 7 of them `MARKED` arms and **one of them BASELINED**
  // (`probe-round257-…interpolation.mts`, 3 sites → 0), which is an exemption recorded for a file
  // with no live comparison to exempt. Found as `unit-482floorceiling` §5 (4 of 69), reproduced at
  // exactly 3 under Theseus's own subject in `unit-483columnnarrow` §2, which named the baseline
  // consequence I had only counted.
  //
  // A key's operand is a ONE-character body (`'{'`); a fixture that carries a whole comparison is a
  // many-character one. That threshold is the entire discrimination, and it lives in
  // `strip-source.mjs` as a third reading derived from the two that module already produces — not
  // hand-rolled here, because Round 258's finding was three independent answers to *'which bytes
  // are code?'* disagreeing on live input.
  //
  // **ONE reading for every key, and that is measured rather than assumed.** The narrowing was
  // pre-registered for the POPULATION key alone, which would have left this gate reading two keys
  // from two readings — the shape the drive-13 note above warns about. `unit-484popnarrow`'s
  // post-hoc leg drove the guard key under both readings across the whole population: **0 members
  // change verdict.** So the coherent spelling costs nothing, and the incoherent one never shipped.
  //
  // **What the narrowing does NOT fix, measured in the same arm:** it converts 1 stale BASELINE
  // entry — which this gate reddens on, by requirement 2 — into **7 site MARKERS that are no longer
  // needed and that nothing here can see.** Requirement 3's exemption has no staleness counterpart.
  // Not built in that fire: reddening on an unneeded marker would redden 7 files, 5 of them arms of
  // published units, and whether a frozen instrument may be edited to drop a marker is a decision
  // and not a detail.
  const code = blankLongStrings(raw, 2);
  // **The population key OVER-ADMITS, and the figure is large enough to change what the baseline
  // means** (`unit-480guardorder` arm B, 11/18). "Compares against both braces" admits any
  // multi-bracket depth counter, not just a declaration-body slicer. **18 of the 68 population
  // members have EVERY brace comparison sitting in a `'(' || '[' || '{'` disjunction — correct
  // bracket walkers that never slice a declaration body — and all 18 are in the baseline**, whose
  // stated meaning is "a known unguarded slicer is being added on purpose". For roughly 30% of that
  // list, that sentence is not true of the file.
  //
  // Not narrowed here, and the reason is the same one that stopped the ordering conjunct: a
  // membership change moves verdicts across the whole population and needs its own KP set. What the
  // measurement does buy immediately is that **a baseline entry is weaker evidence than it reads
  // as** — it means "this file compares characters against braces and carries no paren/colon
  // comparison", not "this file slices bodies naively."
  //
  // The key also cannot see a slice start that carries no comparison operator —
  // `src.slice(src.indexOf('{') + 1, src.lastIndexOf('}'))`, the spelling this file's own header
  // calls "the obvious way to find a body". **Arm B censused it: 11 tracked files use an
  // `indexOf`-style brace slice and all 11 are already in the population, caught by a character
  // comparison elsewhere in the same file. Zero invisible instances today** — a real reach with no
  // members, held open by a KP rather than by a claim.
  if (!OPEN_BRACE.test(code) || !CLOSE_BRACE.test(code)) {
    // Out of the population — not a slicer. **But if it carries a marker, that marker exempts
    // nothing**, and before 2026-11-19 this `continue` was where the gate stopped being able to
    // see it. Reported below, not reddened: see the `REQUIREMENT 3 HAS NO STALENESS COUNTERPART`
    // block at the report.
    const n = (raw.match(MARKER_ALL) || []).length;
    if (n) deadMarkers.push([rel, n]);
    continue;
  }

  // The marker is read from RAW text: it lives in a comment, which `code` has blanked.
  //
  // **There is deliberately no ADOPTED class.** Drive 13 had one, keyed on the file importing
  // `lib/decl-body.mjs`, and it classified THIS UNIT'S OWN ARM as adopted — a file that imports the
  // shared reader *and* hand-rolls a naive slicer beside it, on purpose, to measure the
  // differential. The import is a FILE-level fact and the defect is a SITE-level one, so an adoption
  // key over-credits exactly the files most likely to carry both. A file that genuinely delegates
  // has no character comparison against a brace and is out of the population by the key itself;
  // one that still has them must say why at the site.
  // **The guard key is FILE-LEVEL and UNORDERED, and that is a deliberate choice with a measured
  // refutation behind it, not an oversight.** `unit-480guardorder` (11/18) took Theseus's routed
  // §4 — *"the close-paren comparison your gate credits is 36 characters AFTER the brace comparison
  // the slice starts from"* — and tried to cure it with an ordering conjunct. **The conjunct is
  // refuted three ways; do not re-propose it without reading all three.**
  //
  // 1. **Full ordering (each of LPAREN/RPAREN/COLON must first-match before the first brace
  //    comparison) condemns the shared cure.** It moves **3 of 3** GUARDED files to UNGUARDED,
  //    among them `scripts/lib/decl-body.mjs` — the file this gate tells every seat to adopt. Its
  //    EXECUTION order is right (`declBodyAt` calls `parenSpanEnd`, then the `code[i] === ':'`
  //    return-type scan, then `braceSpanEnd`); its TEXTUAL order is paren-helper, brace-helper,
  //    colon-scan. **A correctly factored file — peer helpers ordered by an orchestrator — is
  //    exactly what defeats a textual-order key.**
  // 2. **The paren-pair-only variant holds that file by coincidence, and a cripple proves it.**
  //    Order LPAREN/RPAREN only, leave COLON file-level, and `decl-body.mjs` stays GUARDED — but
  //    only because `parenSpanEnd` happens to sit above `braceSpanEnd`. Swapping those two peer
  //    exported blocks is behaviour-preserving and byte-length-preserving, and it flips the variant
  //    to UNGUARDED while this gate stays GUARDED. **A key a no-op reorder can redden is keeping a
  //    coincidence, not a promise.**
  // 3. **The one file it was proposed to catch has nothing to catch.** In
  //    `docs/research/round401-instruments/census-the-branch-polarity-axis.mjs` all **8** brace
  //    comparisons are correct: seven are operands of `if (c === '(' || c === '[' || c === '{')
  //    depth += 1`, and the three offsets read as *guard, slice, guard* (6270 / 6296 / 6332) are
  //    **operands of one two-line depth counter**. The eighth is a block-start test at a known
  //    statement position, handed straight to a depth matcher. **This gate's GUARDED verdict on it
  //    is correct in outcome; the census's UNGUARDED verdict is the wrong one.**
  //
  // **What IS still blind, stated so the next seat does not have to re-derive it:** the key cannot
  // tell execution order from textual order at all, so a genuinely naive slicer that happens to
  // carry a paren and colon comparison elsewhere in the file reads GUARDED. **Zero instances
  // measured in this tree** (`unit-480` arm A). The honest shape of that sentence is a declared
  // reach with no members, which is what Theseus's own §2 said about this gate's wider extension
  // key — and it is why the fix is a SITE-level key, not an ordered file-level one. Unbuilt:
  // moving a 68-member population's verdicts needs its own KP set and a baseline migration.
  if (MARKER.test(raw)) {
    verdicts.set(rel, 'MARKED');
    liveMarkerOccurrences += (raw.match(MARKER_ALL) || []).length;
  }
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

/* ------------------------------------- REQUIREMENT 3 HAS NO STALENESS COUNTERPART (2026-11-19) */
// **This is a REPORT and never a red, and that is a two-seat decision rather than a preference.**
//
// `unit-484popnarrow` §3 (Daedalus, 11/19 WORK) found that narrowing the population key converted
// **1 stale BASELINE entry this gate reddens on, by requirement 2, into 7 stale site MARKERS it
// could not see at all.** The check was declined in that fire with a named blocker — it would
// redden files that are frozen published instruments — and routed to Theseus by name.
// `unit-486markerstale` (Theseus, 11/19 WORK) sized it before giving the word, and the word was
// **build it as a report**. Three reasons, the middle one structural:
//
// 1. A reddening check costs **13 edits to frozen published instruments**, and **5 of the 13 carry
//    a marker that never exempted anything under EITHER reading of the population key** — three of
//    those five are post-hoc legs whose whole job is to parse another arm's stdout, so they never
//    had a comparison to exempt. The real failure mode of the convention is therefore not markers
//    going stale; it is **markers that were never load-bearing**, written defensively by an author
//    whose sibling file had just reddened. A check keyed on *is the file in the population* catches
//    both and cannot tell them apart.
// 2. **The requirement-2 mechanism cannot be reused here, and that is why these two requirements
//    are not symmetric.** Requirement 2 cures baseline staleness by reddening when a listed entry
//    stops qualifying — it works because the baseline IS a list. Applied to markers it needs a
//    second list, and a list of files-whose-markers-are-dead is itself an exemption record needing
//    its own staleness check. **A marker is a site-local exemption precisely so that it needs no
//    list; the price of that is that it has no staleness counterpart.** Quoted from his §4.2
//    because it is a general statement about requirement 3 rather than a figure about this tree.
// 3. A report costs nothing and cures the harm actually named — *the instrument that caught the one
//    cannot see the seven* — without asserting that any of these files is wrong.
//
// **The site-level (window) variant is measured and declined, not merely unbuilt.** Requirement 3
// promises an exemption *at the site*; the implementation grants a file-wide one. His §3: **0 of 4**
// live marker occurrences sit on a line that itself carries a brace comparison — distances **8, 10,
// 13, 21** lines, all four in file docblocks. A site-level check needs a WINDOW constant no fire has
// registered, and any window covering today's four is wide enough to grant a short file one blanket
// exemption. The file-level test is a faithful proxy for 4 of 4 today **only** because no file yet
// carries both a deliberate and an accidental slicer: a real reach with no members.
//
// **Format note, and it is a finding rather than a style choice.** The number comes FIRST and no
// bare count follows a label on these lines. His §5 found `/GUARDED\s+(\d+)/` matching inside
// `UNGUARDED  58` in the verdict rows above — one label is a suffix of another — which manufactured
// a `GUARDED 3 → 58` figure move out of an instrument that had not moved by a byte. A label-keyed
// reader pointed at a number-first line returns NOTHING rather than the wrong row, so the failure is
// loud instead of silent. **The pre-existing `UNGUARDED`/`GUARDED` instance in the rows above is NOT
// cured here** — reformatting this gate's published partition would move every captured drive's
// comparability — and is reported by `posthoc-label-substring.mjs` in this unit instead.
if (deadMarkers.length) {
  const occ = deadMarkers.reduce((n, [, k]) => n + k, 0);
  console.log(`\n  NOT CHECKED: whether a \`brace-slicer-deliberate:\` marker is still needed.`);
  console.log(`  ${deadMarkers.length} tracked file(s), carrying ${occ} marker occurrence(s), are`
    + ' OUT of the population, so those markers exempt nothing. Reported, never reddened: a marker'
    + ' is a site-local exemption so that it needs no list, and the price is that it has no'
    + ' staleness counterpart. Removing one is nobody\'s obligation and clears no red.');
  for (const [f, n] of deadMarkers) console.log(`      ${f}${n > 1 ? `  (${n} markers)` : ''}`);
  console.log(`  For contrast, the ${counts.MARKED || 0} file(s) in the \`MARKED\` row above carry`
    + ` ${liveMarkerOccurrences} occurrence(s) that ARE load-bearing.`);
}

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
