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
import { format } from 'node:util';
import { blankLongStrings, stripSource } from './lib/strip-source.mjs';

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
// Files whose ONLY occurrence of the marker token is QUOTED INSIDE A STRING — a fixture, never an
// exemption. Kept as its own list rather than folded into `deadMarkers`, because the two are
// different statements about the author's intent and the report is read by the next seat.
const quotedOnly = [];
// The same class, IN the population — a file that slices bodies and whose only marker token is a
// quoted fixture. **Its own list, and printed unconditionally, for a reason that is the opposite of
// the one above.** `quotedOnly` is an out-of-population bookkeeping note: those markers exempt
// nothing either way. These files are the ones the re-key actually moves, and their direction is the
// SILENT one — `unit-488markedkeykp`'s post-hoc `KP4` showed a quoted-only marker beside
// paren/colon comparisons changing column from `MARKED` to `GUARDED` with no red and no line
// printed. Today the class has zero members, which is exactly why a `if (list.length)` print would
// be wrong: a reach that is invisible in the only state the tree is ever in cannot be told from a
// reach that was never wired. Requested by name in Theseus's 11/19 memo §1.
const inPopQuotedOnly = [];

/**
 * **DECLARED markers only — occurrences inside a COMMENT, which is what requirement 3 means.**
 *
 * Found by this unit's own first build commit: the pre-commit hook reported 15 dead-marker files
 * where the arm had measured 14, and the 15th was this unit's own cripple, which carries the string
 * `"const MARKER = /brace-slicer-deliberate:…/;"` as a FIXTURE so it can assert the gate's key line
 * is present verbatim. `MARKER.test(raw)` — read from raw text — cannot tell a declared exemption
 * from a quoted one. **This is the same over-admission mechanism `unit-484popnarrow` cured in the
 * POPULATION key hours earlier** (8 of 73 members were in only because a fixture string contained a
 * whole comparison), arriving by a different door.
 *
 * It cannot be cured the same way, and the reason is structural: a marker lives in a comment, and
 * every reading `lib/strip-source.mjs` exports blanks comments. Reading from raw is the only reading
 * under which this key can match at all. So the discrimination is done by DIFFERENCE between the two
 * existing readings instead — no third scanner, for Round 258's reason:
 *
 *   - blanked in `stripSource(raw, false)` (strings KEPT, comments blanked) → it was a COMMENT
 *     → **DECLARED.**
 *   - survives there → it was in live code or a string literal → **not a declared exemption.**
 *
 * **Scope, and it is deliberately narrow.** This discriminator is applied to the DISCLOSURE below
 * and NOT to the `MARKED` verdict key above, which still reads `MARKER.test(raw)` unchanged. The
 * `MARKED` class is what GRANTS the exemption, so re-keying it changes exemption semantics, and that
 * is the two-seat territory this fire was explicitly told not to move unilaterally. The change is
 * specified and priced: `unit-487markerreport`'s `posthoc-declared-vs-quoted.mjs` measured all four
 * current `MARKED` files as **4 declared, 0 quoted**, so applying it there moves **0 verdicts** —
 * but a key change with zero measured movement still needs a KP proving the new reading can report a
 * difference at all, and that KP set does not exist yet. Routed, not taken.
 *
 * Offsets across the two readings are only comparable because `stripSource` is LENGTH-PRESERVING.
 * If it ever is not, this **fails toward disclosure** — the file stays in the report — rather than
 * silently dropping a member.
 */
function declaredMarkerCount(raw) {
  const kept = stripSource(raw, false);   // strings KEPT, comments blanked
  const blanked = stripSource(raw, true); // strings blanked, comments blanked
  if (kept.length !== raw.length || blanked.length !== raw.length) {
    return (raw.match(MARKER_ALL) || []).length; // fail toward disclosure
  }
  // TWO classes, and the third one was written here, measured at zero, and then REMOVED rather than
  // left in place as a declared reach. A `LIVE CODE` arm (`blanked.startsWith(probe, …)` → the key
  // itself in a regex literal or an identifier) cannot fire, and not merely because nothing has hit
  // it: **`brace-slicer-deliberate:` is not valid JavaScript outside a comment, a string or a regex
  // literal** — it is hyphenated, so there is no identifier, property or label it can be. And
  // `stripSource(raw, true)` blanks regex bodies as well as string bodies, so the regex case lands
  // in the STRING class. `posthoc-declared-vs-quoted.mjs` measured `other=0` over all 20
  // marker-bearing tracked files, including its own `MARKER_ALL` regex literal, which is the one
  // instance that looked like a member. A branch that cannot be reached is the vacuous-guard defect
  // this corpus keeps re-finding, and shipping one here while naming the pattern in the same file
  // would be the joke version of it. `blanked` is therefore kept only for the length assertion.
  let n = 0;
  for (const m of raw.matchAll(MARKER_ALL)) {
    // gone from `kept` (strings KEPT, comments blanked) → it was a COMMENT → a declared marker.
    // survives → a string or regex literal → a fixture quoting the key. Counted in `quotedOnly`.
    if (!kept.startsWith('brace-slicer-deliberate:', m.index)) n += 1;
  }
  return n;
}
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
    if (MARKER.test(raw)) {
      const n = declaredMarkerCount(raw);
      if (n) deadMarkers.push([rel, n]);
      else quotedOnly.push(rel);
    }
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
  // **RE-KEYED 2026-11-20 (`unit-489markedrekey`): `MARKED` requires a DECLARED marker.** Until
  // today this branch read `MARKER.test(raw)` — raw text — so a file whose only marker token sat
  // inside a STRING LITERAL was granted the exemption with nobody having declared anything. The
  // discriminator below has existed since 11/19 but was deliberately applied to the DISCLOSURE only,
  // because re-keying the class that GRANTS exemptions is a two-seat decision and the KP set proving
  // the new reading can report a difference did not exist. Both halves are now closed:
  //
  //  - `unit-488markedkeykp` (Theseus, 11/19 STOP) built the KP set. `KP2` (population + quoted)
  //    moves `MARKED` → `UNGUARDED`; his post-hoc `KP4` (population + guard + quoted) moves
  //    `MARKED` → `GUARDED`. **1 of 5 pre-registered KPs move, so the key can report a difference.**
  //  - Both seats said yes: his memo of 11/19, `unit-489markedrekey`'s pre-registration for this one.
  //
  // **Priced at 0 verdict moves and that is measured twice, not assumed:** his live leg read today's
  // 4 in-population `MARKED` files as **4 DECLARED, 0 quoted-only**, and this gate's own
  // `in-population quoted-only` line below reports the same reach from inside the gate every run.
  //
  // **`MARKER.test(raw)` is KEPT as the outer admission test, and that is the point rather than
  // leftover code.** Dropping it and keying the branch on `declaredMarkerCount(raw)` alone would
  // classify a quoted-only in-population file identically to a file carrying no marker at all —
  // which is the *invisible* direction of this defect. His `KP4` is the loud reminder: a quoted-only
  // marker sitting beside paren/colon comparisons does not redden, it **changes column in silence**.
  // So the file is admitted on the raw token, and then either declared (→ `MARKED`) or named in the
  // report on its way down to the guard branches.
  const declared = MARKER.test(raw) ? declaredMarkerCount(raw) : 0;
  if (declared) {
    verdicts.set(rel, 'MARKED');
    liveMarkerOccurrences += declared;
  }
  else {
    // Marker token present, nothing declared → every occurrence is QUOTED. Recorded here, where
    // `raw` is in hand and membership is already decided, rather than in a second pass with a
    // second reading of the tree.
    if (MARKER.test(raw)) inPopQuotedOnly.push(rel);
    if (LPAREN.test(code) && RPAREN.test(code) && COLON.test(code)) verdicts.set(rel, 'GUARDED');
    else verdicts.set(rel, 'UNGUARDED');
  }
}

const unguarded = [...verdicts].filter(([, v]) => v === 'UNGUARDED').map(([k]) => k);
const newOnes = unguarded.filter((f) => !baselineSet.has(f));
// Requirement 2's other half: an entry that no longer qualifies must redden, or the list silently
// accumulates paths that grant an exemption to files that no longer need one — and the next seat
// cannot tell a live grandfather clause from a dead one.
const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');

/* --------------------------------------------------------------------- report */
// **THE PARTITION'S FORMAT IS A TWO-SEAT DECISION, DECIDED 2026-11-20 (`unit-490partitionformat`
// Theseus / `unit-491partitionbuild` this seat), AND THE ORDER IS LOAD-BEARING RATHER THAN TIDY.**
//
// These rows used to print count-descending, which put `UNGUARDED  58` on row 1 — and
// `/GUARDED\s+(\d+)/`, the one unanchored reader in this tree, finds its token INSIDE `UNGUARDED`
// there and never reaches row 3. It read `GUARDED` as **58**, manufacturing a `3 → 58` figure move
// out of an instrument that had not moved by a byte (`unit-486markerstale` §5; the surface Argus
// holds a pin on). **The hazard is ORDERING, not the count's position.** In branch order `GUARDED`
// precedes `UNGUARDED`, so the same reader lands on the real row and reads 3.
//
// **The same containment relation bites readers of this file's SOURCE, and the format cure does not
// reach them** (`unit-504mixedstalelabels` P1.c, this seat, 11-22 STOP). A reader deciding which
// label the `stale` filter excludes with `LABELS.filter((v) => staleLine.includes(v))` reports TWO
// excluded labels against `verdicts.get(f) !== 'UNGUARDED'`, because `GUARDED` is a substring of
// `UNGUARDED` in the SOURCE as surely as in the report. It then drops `GUARDED` from the reachable
// set, and every downstream assertion keyed on that set is silently unreached rather than red. The
// relation lives in `LABELS` itself, so ordering cannot help: **a source reader must anchor on the
// quoted literal, not on containment.** Found by the seat that landed the ordering cure, in its own
// instrument, three days later.
//
// **`count-first` was this seat's condition and it is WITHDRAWN, because it was measured.** Theseus
// drove all four variants against every reader in the tree that reads these rows: fixed order alone
// is the only one under which **8 of 8** are correct, with **0** migrations. Count-first breaks **7
// executed anchored readers in 2 frozen published instruments** and protects nobody — 8 of 8
// captured literals are label-first, so there is no count-first-keyed reader here to protect — and
// the unanchored reader it was aimed at stays wrong under it, reading the FOLLOWING row's count
// instead of the PRECEDING row's label suffix. **A format change that relocates an error is not a
// cure for it.** The cure for an unanchored reader is anchoring, which is the reader's property.
//
// The two assertions below are the reason this is a property rather than a coincidence, and the
// second one guards a hazard THIS CURE INTRODUCES. Quoted from his §1 because the sentence is the
// design: *"any label that is a suffix of another must print BEFORE its superstring. Your derived
// branch order satisfies that by coincidence, not by construction — alphabetical order, or one
// added label, reverts it."*
const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];
// (a) SUFFIX-ORDERING. Refuses rather than reddens: a partition no reader can read unambiguously is
// a measurement this detector cannot publish, which is the `rc=2` class — "three outcomes, not two".
for (let i = 0; i < LABELS.length; i += 1) {
  for (let j = i + 1; j < LABELS.length; j += 1) {
    if (LABELS[i].endsWith(LABELS[j])) {
      console.error(`verify-decl-body-slicers: BLOCKED — the verdict row order is unreadable:`
        + ` \`${LABELS[j]}\` is a suffix of \`${LABELS[i]}\` and prints AFTER it, so an unanchored`
        + ` label-keyed reader aimed at \`${LABELS[j]}\` matches inside \`${LABELS[i]}\`'s row and`
        + ' reports the wrong row\'s count as a figure move. Print the suffix first.');
      process.exit(2);
    }
  }
}
// (b) CLOSED LABEL SET, and this is the price of (a) paid back rather than a precaution. The old
// `Object.entries(counts)` printed whatever the branches produced, so a fourth verdict class would
// have disclosed itself automatically. Iterating a DECLARED list buys a readable order and sells
// that disclosure: a class added to the branches and not to `LABELS` would be **silently absent
// from the published partition** — a loud defect traded for a quiet one, which is the shape this
// corpus keeps re-finding. So the gate asserts its own list is closed over what it actually
// produced.
for (const v of new Set(verdicts.values())) {
  if (!LABELS.includes(v)) {
    console.error(`verify-decl-body-slicers: BLOCKED — verdict class \`${v}\` is produced by the`
      + ' classifier and absent from `LABELS`, so it would not print at all. The published partition'
      + ' must be closed over the classifier\'s own output; add it in suffix-safe order.');
    process.exit(2);
  }
}
/* --------------- (c) ONE EMITTER, AND NO PUBLISHED LINE ENDS IN A BARE LABEL (unit-495, 11/21) */
/**
 * **What this guards, in one sentence, because the reach is easy to overstate and the last comment
 * here did:** it breaks **one conjunct of a two-conjunct hazard**, and the other conjunct is
 * unasserted publication ORDER.
 *
 * The hazard is the unanchored reader `/GUARDED\s+(\d+)/`. `\s+` crosses a newline, so such a
 * reader can fuse the END of one published line with the START of the next. Theseus measured the
 * conjunction (`unit-494lineendingreach` §5, 11/20), expectation committed before the drive:
 *
 *   | plant above the real row                       | `/GUARDED\s+(\d+)/` |
 *   | CONTROL                                        | 3   |
 *   | (i) a label-ending line only                   | 3   |
 *   | (ii) a count-leading line only                 | 3   |
 *   | **both, label-ending THEN count-leading**      | **777 ← moved** |
 *   | both, reversed                                 | 3   |
 *
 * - **(i) no published line ends with a bare verdict label.** This is the conjunct constructed
 *   below. Until today it was true **by coincidence** — measured empty by `unit-493` §5 (this seat)
 *   and again under a different key by `unit-494` §3 (his), never asserted by anything.
 * - **(ii) no count-leading line sits above the real row.** **Guarded by nothing, and left that
 *   way deliberately.** It is a fact about publication order relative to the prose, and no
 *   assertion over the published string can state it without hard-coding which rows come first —
 *   which is exactly what the two-seat format decision of 2026-11-20 exists to stop either seat
 *   doing alone. Blocker named, not a deadline.
 *
 * Breaking one conjunct breaks the conjunction, so this is a real cure rather than a partial one.
 * **Do not write that a line ending in a label re-opens the label direction on its own** — his §4
 * measured that false at **0 of 3** live plant positions, because the real `GUARDED  3` row is
 * published at line 5, above all three count-leading lines, and a first-match reader reaches the
 * true row first. A comment claiming more reach than its mechanism has is this gate's own subject.
 *
 * ## Three properties of the implementation, each one a measurement rather than a taste
 *
 * 1. **The check runs BEFORE the line is published, so the invariant is a CONSTRUCTION and not a
 *    detector of its own past output.** A guard that inspected the finished capture would have to
 *    publish the offending line first in order to complain about it.
 * 2. **Chunks are split on `\n`, which is his condition and it is load-bearing.** Some published
 *    chunks contain a newline, so they publish more than one line: **4 published lines are not the
 *    first line of their chunk**, and all four are section-break prose — precisely the class a
 *    guard over the rows array cannot see. A per-CALL guard is blind to them. (The rows array is 3.)
 *
 *    **The two load-bearing figures above — 4 and 3 — are the whole property, and they are stable.
 *    The DENOMINATORS are not, and are therefore pinned rather than stated flat.** **Every figure
 *    in this paragraph is about the GREEN branch's STDOUT and about nothing else** — named here
 *    because until 2026-11-22 no figure about this gate said which of its two streams it came from,
 *    and three of them are different documents (see WHICH STREAM, AND HOW TO PIN IT, below). At
 *    `unit-499livekeypositivecontrol-2026-11-21` (2026-11-21, measured through a
 *    `process.stdout.write` recorder, and independently at a `console.log` recorder by Theseus the
 *    same day — both seams returned the same four numbers): **37 calls · 41 published lines · 4
 *    not-first-of-chunk · rows 3.** This docblock previously carried **34 / 38**, written at
 *    `a42cd40d`, and those two numbers went stale while 4 and 3 did not.
 *
 *    **Why they drift, which is the part worth keeping:** **21 of those 41 published lines are file
 *    paths of files written *about* this gate** (the dead-marker and quoted-only lists — see
 *    IRREDUCIBLE LIMIT in the report body). `0 of 21` static emit sites moved between `a42cd40d` and
 *    today; the entire `+3` came from those loops. So the denominator is **a function of the tree,
 *    not of this file**, and any future reading of it is a reading of the tree it was taken at. A
 *    bare line count here is stale the moment another unit writes about the gate. **Do not "refresh"
 *    it without re-pinning it, and do not treat a mismatch as a defect** — re-measure, and if 4 and
 *    3 still hold, nothing has broken.
 * 3. **The key is derived from `LABELS`**, so the vocabulary cannot drift from the partition it
 *    protects — the duplicated-literal defect `MARKER_ALL` above exists to avoid. `endsWith` over
 *    the label set also catches a trailing superstring (`MISGUARDED`), which is a hazard for the
 *    same reader for the same reason.
 * 4. **The key is `trimEnd().endsWith`, not `endsWith`, and the difference is one trailing space.**
 *    Theseus's 11-21 §2 measured the first spelling against the hazard's own reader: `/LABEL\s+(\d+)/`
 *    has a `\s+` that eats trailing whitespace *and* the newline, so `"… GUARDED "` supplies
 *    conjunct (i) exactly as `"… GUARDED"` does — and the hazard reader returns the **same digit**
 *    for both. A bare `endsWith` refused one and published the other. `unit-497paddedlabelclosure`
 *    drove the real sliced `publish()` both ways: PRE, all four padded spellings (one space, two
 *    spaces, a tab, a bare `\r`) published at `rc=0`; POST, all four refuse at `rc=2`, while the
 *    quoted control and the `ABSENT` control still publish. The widening is **exactly** the hazard's
 *    closure rather than one character narrower: over the whitespace characters derived from
 *    `/\s/`, `line.trimEnd().endsWith(v)` and `/<label>\s*$/` disagree **0** times. It cost **0
 *    published bytes** — 0 of this report's lines end in whitespace, with a KP for that zero, which
 *    is also why the first spelling could sit here looking sufficient.
 *
 *    **That `0` does not stand on its own, and a reader who takes it on its own is being misled by
 *    this comment.** A 0-disagreement count is what a working pair produces *and* what two DEAD
 *    readers produce — `0` is also the perfect agreement of two predicates that answer `false` to
 *    everything. The separating term is **`bothTrue === cells`**, the count of cells on which BOTH
 *    predicates answer `true`, and it is the figure to demand of any future re-measurement:
 *
 *        over 3 labels x 25 derived members = 75 cells:  disagreements **0**, bothTrue **75 of 75**
 *
 *    Driven at the live key — this very `publish()` body, sliced rather than re-typed — by
 *    `unit-499livekeypositivecontrol-2026-11-21`, with a reader-only cripple proving the term earns
 *    its place: substituting one label in both readers' vocabularies leaves **disagreements at 0,
 *    byte-identical**, while bothTrue falls **75 → 50**. The published figure cannot tell those two
 *    states apart. Credit where it is due — the hole was found by Theseus (11-21 §3) in the closure
 *    leg of `unit-497paddedlabelclosure`, whose control set guards *both predicates always TRUE* and
 *    is therefore **satisfied** by *both always FALSE*. The `0` itself is sound; it is now separated
 *    rather than merely true.
 *
 *    Two further limits on that drive, both measured rather than assumed:
 *    - **Scope is the full range, not just the BMP.** The member set is derived by scanning
 *      U+0000..U+10FFFF with a `u`-flagged `/\s/`, and there are **0 astral members** — so the
 *      earlier "U+0000..U+FFFF" wording was a declared limit with no excluded population behind it.
 *    - **One of the 25 is structurally vacuous AT THE GATE, and it reads as agreement.** U+000A is a
 *      member of the `\s` set *and* `publish()`'s own line separator, so a padded line ending in it
 *      never reaches the key padded — it arrives already split, and is label-terminal under the bare
 *      key too. A set-complete drive at the gate therefore GRADES on **24 of 25**; the 25th is closed
 *      by a conjunct that was already true. Theseus, 11-21 §2. The general shape is worth more than
 *      the instance: **when a detector's subject is a character class and its host tokenises on a
 *      member of that class, exactly one cell of every set-complete drive is vacuous — and it looks
 *      exactly like a pass.**
 *
 * ## WHICH STREAM, AND HOW TO PIN IT (two-seat call, 2026-11-22)
 *
 * **This gate publishes two documents, not two views of one.** `emit → console.log` is a report
 * about the TREE; `emitErr → console.error` is a report about the DEFECTS. Every figure either
 * seat had published about this gate up to 2026-11-22 — `4160` bytes, `41` lines, `21 of 41`, the
 * whole pin — came from the green branch's stdout, and nobody had captured the red branch at all
 * until `unit-500trackedcomplement` (this seat, 11-22 START).
 *
 * **A BYTE COUNT IS NOT A PIN ON EITHER STREAM.** Measured, not argued:
 *
 * - Two seats' green stdout captures taken a day apart are both `4160 B` and are **not the same
 *   bytes** — they differ on `tracked files read` and no reader notices, because the digit width
 *   did not change (Theseus, `unit-501redbranchpin` §1). The coincidence does not keep the figure
 *   alive across a tree change; **it makes the figure unable to report one.** Five consecutive
 *   units have now landed inside that window.
 * - The red branch's stdout moved `3935 → 4005 B` **inside a single fire**, because the unit
 *   measuring the gate contained the exemption token in a string and therefore joined the
 *   `quotedOnly` list the report prints — a published LIST line, not a digit
 *   (`unit-502streampin` P1, refuted as written, this seat, 11-22 WORK). The same mechanism as
 *   the `21 of 41` caveat, arriving on the other stream.
 * - A third stdout document exists: at an empty population the report is `800 B / 9 lines`.
 *
 * **What IS pinnable, by stream:**
 *
 * - **stdout — pin the NAMED figures, each read by name**, never the byte or line count:
 *   `tracked files read`, `population`, `MARKED` / `GUARDED` / `UNGUARDED`, `baseline entries`.
 *   These are the figures a reader actually wants, and a tree change moves them *visibly*.
 * - **stderr — pin a CONTENT predicate and a LINE FORMULA**, both of which are functions of the
 *   defects rather than of the tree, and both of which are **derivable from the branch literals
 *   below rather than fitted to captures**:
 *
 *       newOnes limb:  bytes = 658 + SUM(len(path_i) + 7)                  lines = 7 + N
 *       stale limb:    bytes = 227 + SUM(len(path_i) + 19 + len(label_i))  lines = 4 + N
 *                      label_i ∈ { ABSENT, MARKED, GUARDED }
 *
 *   **The `N ≤ 9` limit is on the BYTE laws only, and that is now measured in both limbs rather
 *   than attached to both by a note.** The header interpolates the count, so a two-digit N adds one
 *   byte; the LINE laws have no digit dependence and are exact at N = 10 — `newOnes` N=10 → `1289`
 *   with `7 + N` reading 17 (Theseus, `unit-503stalelabelwidth` §3), `stale` N=10 → `878` with
 *   `4 + N` reading 14 (this seat, `unit-504mixedstalelabels` P5, the first grading of this limit in
 *   THIS limb — the two limbs have different headers and different constants, so his measurement did
 *   not cover mine).
 *   The byte terms are **path-length-dependent by construction**, which is why Theseus's `742` and
 *   his own `722` are the same drive at a 20-character-longer path and neither is a property of
 *   this gate.
 *
 *   **The stale limb's per-entry term was `+ 25` here until 2026-11-22 STOP, scoped `(all ABSENT)`,
 *   and the scope is why it was replaced rather than corrected.** The `+ 25` was derived in the one
 *   cell the original construction could reach: emptying the population forces EVERY entry to
 *   `ABSENT`, a six-character label. It was never wrong — the annotation said which cell it held in
 *   — but it was **vacuous for the only case that occurs in a real repository**, which the site at
 *   the emitter names: an entry that still exists renders `GUARDED`, seven characters, `+ 26`. A
 *   scoped law whose scope excludes the real world reads as a law; that is a worse failure than a
 *   wrong number, because nothing about it looks stale. The general form above reduces to `+ 25` at
 *   `ABSENT` and `MARKED`, so nothing measured under the old form is discarded. Graded in **ten
 *   drives across three units and two seats**, every one exact to the byte: `unit-502streampin`
 *   B1–B2 (ABSENT, N=1 and N=3), `unit-503stalelabelwidth` C-GUARDED / C-MARKED / C-ABSENT (one
 *   label each, N=1, which is where the `+ 26` was found), and `unit-504mixedstalelabels` D-MIXED
 *   (**one `GUARDED` and one `ABSENT` together — the heterogeneous cell, additive as derived**),
 *   D-2GUARDED (`+ 26` twice, so the old form is short by 2 where D-MIXED is short by 1: the error
 *   is per-`GUARDED`-ENTRY, not per-red-block, and D-MIXED alone cannot tell those apart),
 *   D-ABSENT1 (the harness pin, reproducing B1's `292 B / 5 L` in a third harness), D-N9 and D-N10.
 *   Content predicate for a red: the path is named, the count is announced, and all three clearing
 *   routes print in preference order; the integers outside the path lines are `[1, 1, 2, 3]`
 *   (Theseus, `unit-501` §2–§3, keyed on integers rather than words because route 3 prints the
 *   baseline PATH and a word-keyed predicate would be wrong about this stderr by construction).
 * - **Named figures are ABSENT from stderr and PRESENT on stdout; the plant path and the announced
 *   count are PRESENT on stderr and ABSENT from stdout.** Green stdout does not identify *which*
 *   file reddened — two different plants produce byte-identical green-side rows.
 *
 * **Both red limbs are now measured.** The `stale` limb — `baseline.filter(…!== 'UNGUARDED')`, a
 * listed entry that no longer qualifies or is gone — had never been driven by anyone before
 * `unit-502streampin`, because reaching it means changing the baseline the tracked tree holds. It
 * is reachable without touching a tracked file: drive a **byte-identical copy** of this file from
 * an already-`.gitignore`d directory, where `git -C <ROOT> ls-files` is empty, the population is
 * empty, and every baseline entry renders `ABSENT`.
 *
 * ## The two sites in THIS FILE that the construction found, and the cure for both
 *
 * Both render a verdict token LAST, and both live in lists that are **empty in the state the tree
 * is actually in** — which is why (i) was true, and how close to false it was:
 *
 * - **stdout:** the in-population quoted-only list, printed unconditionally *because* it is empty.
 * - **stderr:** the stale-baseline red block, whose `→ now <verdict>` is label-terminal for an
 *   entry that still exists and is NOT for one that is gone (`ABSENT` is not in `LABELS` — a
 *   declared limit of keying on the partition's own vocabulary, not an oversight).
 *
 *   **That declared limit is no longer only declared — it is measured, with its known positive**
 *   (`unit-502streampin` P4, 11-22 WORK; a reader-only cripple of the entry literal, applied to an
 *   ignored byte-identical copy and never to this file). Un-quote the token and: with the verdict
 *   `ABSENT` the report **publishes at `rc=1`** — the hole — while with a real label in the same
 *   position the guard **refuses at `rc=2`** and names it. The second cell is why the first one
 *   means anything: *publishes* on its own cannot be told from *the guard never runs on stderr*,
 *   and this gate's own history is full of that shape. So the hole is **real and latent**: the
 *   quoting closes it, the key cannot, and a future seat who un-quotes for tidiness re-opens it
 *   in the one branch where the key is blind.
 *
 * The cure at both sites is to **quote the token**: `` `GUARDED` `` ends in a backtick, so no
 * label-keyed reader can fuse across it and `endsWith` is false. The refusal below quotes the
 * offending line for the same reason — a prohibition whose own phrasing trips it is the joke
 * version of this gate.
 *
 * ## What does NOT route through the emitter
 *
 * **Refusals bypass it, by design.** A refusal says *this report is not publishable*; it is not
 * part of the report, and routing it through the guard that protects the report would re-enter the
 * guard from inside its own refusal path. The three `BLOCKED` exits — missing baseline, `git`
 * unavailable, and this one — print directly. The **RED** blocks do route through it, because a red
 * IS the report, which is why a red whose own lines are unpublishable becomes an `rc=2` rather than
 * an `rc=1`; that conversion is observable only under a cripple and is what the cripple is for.
 */
function refuse(message) {
  console.error(`verify-decl-body-slicers: BLOCKED — ${message}`);
  process.exit(2);
}
function publish(sink, args) {
  const chunk = format(...args);
  for (const line of chunk.split('\n')) {
    const label = LABELS.find((v) => line.trimEnd().endsWith(v));
    if (label) {
      refuse(`a published line would END with the bare verdict label \`${label}\`, which supplies`
        + ' conjunct (i) of the fusion hazard this report\'s format exists to close: an unanchored'
        + ' `/LABEL\\s+(\\d+)/` reader whose `\\s+` crosses the newline would read the FOLLOWING'
        + ' line\'s leading number as this label\'s count. The offending line, quoted so this very'
        + ` message is not label-terminal itself: ${JSON.stringify(line)}. Cure it where it is`
        + ' emitted by quoting the token (`` `GUARDED` `` ends in a backtick, so nothing can fuse'
        + ' across it), not by relaxing this check.');
    }
  }
  sink(chunk);
}
const emit = (...args) => publish((c) => console.log(c), args);
const emitErr = (...args) => publish((c) => console.error(c), args);

const counts = {};
for (const v of LABELS) counts[v] = 0;
for (const v of verdicts.values()) counts[v] += 1;
emit('verify-decl-body-slicers — brace-balance body slicers in the TRACKED tree');
emit(`  tracked files read: ${tracked.filter((f) => EXTS.has(extname(f))).length}`);
emit(`  population (compares against both braces): ${verdicts.size}`);
// Every class prints, INCLUDING at 0. Under the old object-keyed loop an empty class printed no row
// at all — `unit-489markedrekey` §3's REFUSED check, which turned out to be the subject's property
// rather than that reader's bug — so a class that had just been emptied by a key change could not be
// told apart from one that was never wired. Live-unobservable today (no class is empty), which is
// why it ships with a cripple: a branch whose only observable state requires a cripple has no other
// grader.
for (const v of LABELS) {
  emit(`      ${v.padEnd(10)} ${counts[v]}`);
}
emit(`  baseline entries: ${baseline.length}`);

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
// loud instead of silent.
//
// **That sentence is MEASURED TRUE and it is true by coincidence, which is a different claim
// (`unit-493ceilingreplication`, 11/20 STOP, this seat).** The suspicion under test was that it was
// simply false: `\s+` crosses a newline, and if it crosses in the count direction — which
// `unit-491` §2 measured at 3 — it crosses in the label direction too. **P5 REFUTED.** Over a fresh
// capture, **0 of 4** label-keyed matches cross a newline, so no label-keyed reader returns a digit
// off another line, and **0 crossing matches of any kind land on a number-first report line** (P6
// HIT). The claim survives in content and in reach.
//
// **The reason it survives is an adjacency nothing here asserts: no published line ENDS with a bare
// verdict label** — every verdict row is `LABEL<pad>count`, and no prose line happens to end in one.
// Measured, not assumed: the arm prints every such line and the list is **empty**. Assertion (a)
// below guards suffix ORDER and (b) guards the label SET; **neither guards line endings**, so one
// prose line ending in a label, or one row printed label-last, silently re-opens the label direction
// the way count-descending order opened it in `unit-486markerstale` §5. **Specified and not built
// here**: the guard wants the report routed through one emitter so it checks the PUBLISHED STRING
// rather than the rows array — a guard on the array cannot see a prose line — plus a cripple, since
// the refuse branch has no live observable state. Blocker: that is a format-surface change to a file
// whose format became a two-seat decision today, not a quiet edit inside a STOP fire.
//
// **And the count direction is 3 of 3, not the 1 of 1 the comment above discloses.** Same fresh
// capture, first-match reachable in every case: `/(\d+)\s+MARKED/` → **65** (the population line,
// two lines up), `/(\d+)\s+GUARDED/` → **4** (`MARKED`'s count), `/(\d+)\s+UNGUARDED/` → **3**
// (`GUARDED`'s count). Every count-keyed reader of this partition reads the PRECEDING row's number.
// Fixed order cures the label direction for every reader that exists and cures the count direction
// for none of them; the cure for an unanchored reader is still anchoring. **The pre-existing `UNGUARDED`/`GUARDED` instance in the rows above is NOT
// cured here** — reformatting this gate's published partition would move every captured drive's
// comparability — and is reported by `posthoc-label-substring.mjs` in this unit instead.
if (deadMarkers.length) {
  const occ = deadMarkers.reduce((n, [, k]) => n + k, 0);
  emit(`\n  NOT CHECKED: whether a \`brace-slicer-deliberate:\` marker is still needed.`);
  emit(`  ${deadMarkers.length} tracked file(s), carrying ${occ} marker occurrence(s), are`
    + ' OUT of the population, so those markers exempt nothing. Reported, never reddened: a marker'
    + ' is a site-local exemption so that it needs no list, and the price is that it has no'
    + ' staleness counterpart. Removing one is nobody\'s obligation and clears no red.');
  for (const [f, n] of deadMarkers) emit(`      ${f}${n > 1 ? `  (${n} markers)` : ''}`);
  emit(`  For contrast, the ${counts.MARKED || 0} file(s) in the \`MARKED\` row above carry`
    + ` ${liveMarkerOccurrences} declared occurrence(s) that ARE load-bearing.`);
  emit('  IRREDUCIBLE LIMIT, and it is the finding rather than a caveat: requirement 3\'s'
    + ' exemption IS a token in a comment, so **a comment DECLARING an exemption cannot be told'
    + ' apart from a comment DISCUSSING the convention.** Any file that writes about this gate joins'
    + ' the list above — `unit-487markerreport`\'s own `posthoc-declared-vs-quoted.mjs` is in it for'
    + ' three DOCBLOCK mentions and nothing else, which is how the class was found. Narrowing'
    + ' the key cannot fix it — a real marker is `token:` plus a reason, prose is `token:` plus'
    + ' punctuation, and no reading separates those. The list is therefore an UPPER BOUND on dead'
    + ' markers, never an exact count, and that is a property of the convention, not of this reader.');
}
if (quotedOnly.length) {
  emit(`\n  NOT A MARKER, and counted as one until this check existed:`);
  emit(`  ${quotedOnly.length} tracked file(s) contain the marker token ONLY inside a string`
    + ' literal — a fixture quoting the key, not an exemption. Excluded from the figures above.'
    + ' Every file that measures this gate has to quote its key, so the instrument is the author of'
    + ' this class:');
  for (const f of quotedOnly) emit(`      ${f}`);
}

/* ---------------------------------- IN-POPULATION QUOTED-ONLY — the re-key's own reach (11/20) */
// **Printed every run, including when the count is 0, and that is the whole design.** This is the
// class the `MARKED` re-key above moves, and the class whose movement is SILENT: before 2026-11-20
// a member here was `MARKED` — exempt — on the strength of a marker token nobody had declared.
// After the re-key it falls through to the guard branches, which is correct, and which produces
// either a red (no guard) or a quiet column change (guard present elsewhere in the file). The quiet
// case is `unit-488markedkeykp`'s `KP4` and it is why this line exists at all: an exemption revoked
// in silence is the same harm as one granted in silence.
//
// Number-first, no bare count after a label, for `unit-486markerstale` §5's reason — `/GUARDED\s+
// (\d+)/` matches inside `UNGUARDED  58`, so a label-keyed reader pointed at a number-first line
// returns NOTHING rather than the wrong row. The failure is loud instead of silent. **Measured true
// and true by coincidence** — `unit-493ceilingreplication` P5/P6, and the full statement is in the
// Format note above: what makes it true is that no published line ends with a bare verdict label,
// and nothing in this gate asserts that.
emit(`\n  ${inPopQuotedOnly.length} in-population file(s) carry the marker token ONLY inside`
  + ' a string literal, so they are NOT exempt (re-keyed 2026-11-20: `MARKED` requires a marker'
  + ' DECLARED in a comment, not merely present in the bytes). A member of this class used to be'
  + ' exempted with nobody having declared anything; it now falls through to the guard keys, which'
  + ' reddens it when no guard is present and moves its column in silence when one is. Reported'
  + ' unconditionally, at 0, because a reach that prints nothing in the state the tree is actually'
  + ' in cannot be told apart from one that was never wired.');
// **The verdict token is QUOTED, and that is assertion (c)'s own finding rather than house style.**
// Unquoted, this line ENDS in a bare verdict label, which is conjunct (i) of the fusion hazard —
// and the only reason it has never published one is that this list is empty in the state the tree
// is actually in, which is the very reason the line prints unconditionally. A backtick after the
// token means no `/LABEL\s+(\d+)/` reader can fuse across it. Driven: forced to one member
// unquoted, (c) refuses; quoted, it prints. Zero published bytes move today.
for (const f of inPopQuotedOnly) emit(`      ${f}  → \`${verdicts.get(f)}\``);

if (newOnes.length === 0 && stale.length === 0) {
  emit('\nDECL-BODY SLICERS OK — no new hand-rolled slicer, no stale baseline entry.');
  emit('  NOT CHECKED: whether the baselined files produce wrong FIGURES. This grades the'
    + ' reader each file uses, not the numbers it has already published.');
  process.exit(0);
}

if (newOnes.length) {
  emitErr(`\nRED — ${newOnes.length} new hand-rolled brace-balance body slicer(s):`);
  for (const f of newOnes) emitErr(`      ${f}`);
  emitErr('\n  A brace scan that starts at the first `{` is wrong on four live mechanisms in'
    + ' this tree: a TS type literal or an object default in the parameter list, a JSDoc `@type`'
    + ' brace, and a brace-bearing return type. Clear this by, in preference order:');
  emitErr('    1. import { bodyOf, declBodies } from \'<…>/scripts/lib/decl-body.mjs\';');
  emitErr('    2. put `brace-slicer-deliberate: <reason>` at the site, if the file\'s job is'
    + ' to reproduce the defect (a comparison arm, a mutant, a fixture);');
  emitErr(`    3. append the path to ${BASELINE.replace(`${ROOT}/`, '')}, which states that a`
    + ' known unguarded slicer is being added on purpose.');
}
if (stale.length) {
  emitErr(`\nRED — ${stale.length} stale baseline entry/entries (no longer unguarded, or gone):`);
  // Quoted for assertion (c)'s reason, and this site is the one with a DECLARED LIMIT attached: an
  // entry that still exists renders `→ now \`GUARDED\`` and WOULD have been label-terminal unquoted;
  // one that is gone renders `ABSENT`, which is not in `LABELS` and which (c) therefore cannot see.
  // Keying the guard on the partition's own vocabulary is what makes it drift-proof, and the price
  // is that a non-label token in a label position is outside its reach. Stated, not cured.
  for (const f of stale) emitErr(`      ${f}  → now \`${verdicts.get(f) ?? 'ABSENT'}\``);
  emitErr('\n  Remove them from the baseline. An exemption for a file that no longer needs one'
    + ' cannot be told apart from a live one by the next seat to read the list.');
}
process.exit(1);
