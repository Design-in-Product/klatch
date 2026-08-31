#!/usr/bin/env node
/**
 * verify-tsx-guard.mjs — the wrong-runner guard is sound, and it is wired in at every site.
 *
 * Round 121, Daedalus, 2026-08-30 (WORK fire).
 *
 * ── What this exists to stop ────────────────────────────────────────────────
 *
 * `lib/tsx-required.mjs` converts an `ERR_MODULE_NOT_FOUND` raised by running a TypeScript-importing
 * verifier under plain `node` into a message naming the runner, and exit 2. Two ways that can be
 * worthless, and prose cannot check either:
 *
 *   1. **It over-fires.** If the predicate is loose, a *genuine* missing module gets reported as
 *      "you used the wrong runner" and the real error is swallowed. That is strictly worse than
 *      the crash it replaced — a wrong diagnosis is more expensive than an unhelpful one. §(a).
 *
 *   2. **It is not called.** The helper can be perfect and imported by nobody, or imported and not
 *      wrapped around the import that actually throws. §(b) enumerates the sites from the source
 *      rather than from a hand-written list, so a *new* verifier that dynamically imports
 *      TypeScript and forgets the guard turns this red without anyone remembering to add it here.
 *
 * §(b) is the interesting one for the standing rules. Rule 8b's structural limb says the
 * copy-instead-of-share coupling "cannot be discharged by a check — nothing inside the file can
 * detect a future editor re-inlining one call site." True of the file, and this is the counterpart:
 * a check *outside* the files can enumerate them. Uncheckable from inside is not uncheckable.
 *
 *   3. **The enumeration misses the site.** §(b)'s membership test is a regex over source text, and
 *      §(b)'s own preconditions only catch it matching *nothing* or *everything* — not it missing
 *      *one*. Missing one is the whole failure mode §(b) exists to prevent, and a missed file is
 *      invisible: §(b) reports "every TypeScript-importing verifier is guarded" over a population
 *      that silently excludes the unguarded file, and §(c) never runs it because §(c) iterates the
 *      same list. Round 122 measured this rather than reasoned about it — an unguarded verifier
 *      written with a **double-quoted** specifier, and one whose **`await` is detached** from the
 *      `import()` call, both left this file at `PASS — all 20 checks passed` while crashing with
 *      exactly the raw `ERR_MODULE_NOT_FOUND` stack trace §3 of the Round 121 memo set out to kill.
 *
 *      §(b2) removes the *source-text* population question instead of widening the regex. It asserts
 *      the property directly on every verifier: run under plain `node`, none may emit an unhandled
 *      resolution stack trace. A computed specifier or a quoting style nobody has thought of yet is
 *      covered for free. Measured cost of the whole sweep: ~1.1s. §(b) is kept for its report line
 *      and for locating *which* site is unguarded.
 *
 *   4. **§(b2) inherited §(b)'s membership test.** Round 122 wrote that §(b2) has "no membership
 *      test, so nothing to escape." Round 123 measured it: §(b2) reused §(b)'s array, so it was
 *      scoped by `readdirSync(scripts/)` + `.endsWith('.mjs')` — blind to depth and to extension.
 *      An unguarded `verify-*.mts`, and an unguarded `verify-*.mjs` one directory down, each crashed
 *      raw under `node` at `PASS — all 36 checks passed`. The escape had moved from source-text
 *      shape to filename shape; it had not gone away.
 *
 *      What is available is not *no* membership test but a **bounded** one: the property is only
 *      assertable on files it is safe to run, so the population is a naming convention this repo
 *      controls, rather than the open set of ways a person may write `import()`. §(b) now walks
 *      `scripts/` recursively for `verify-*.{mjs,mts}`, and — this is the part that carries the
 *      claim — the predicate defining that population is itself asserted, on true cases and false
 *      cases, the same treatment §(a) gives `isTsResolutionFailure`. A membership test you cannot
 *      escape was not on offer. One whose rule is written down and tested was.
 *
 *   5. **Round 123 widened one limb's population and left two limbs on the old one.** §(b2)'s sweep
 *      became depth- and extension-agnostic; §(b)'s content test and §(c)'s end-to-end runs stayed
 *      gated by a regex anchored to exactly one `../`. Round 124 measured the gap that opened
 *      between them. A verifier at `scripts/checks/` that imports TypeScript, imports the guard,
 *      writes the guard call on a branch that never runs, and exits **0** from its catch — i.e.
 *      reports a pass having verified nothing under the wrong runner, the precise failure §(a)–§(c)
 *      exist to prevent — left this file at `PASS — all 45 checks passed`. The identical file at
 *      the top level died by §(c), twice. Depth was the only variable.
 *
 *      §(b2) did not save it: the swallowing catch means there is no stack trace to see. §(b2)
 *      covers the *unguarded* case at any depth (re-measured: the same file with no try/catch turns
 *      §(b2) red), and that coverage is what made the Round 123 repair look complete. The case only
 *      §(c) can see — a guard that is present in the source and inert at runtime — is the one whose
 *      population was left narrow. And the check count moved the reassuring way while this was true:
 *      44 → 45, because §(b2) swept one file more. Coverage read as growing while it shrank.
 *
 *      So the membership test below is depth-agnostic and quote-agnostic, named, and asserted on
 *      true and false cases — the treatment Round 123 gave `isVerifierPath`, applied to the other
 *      population in the same file. The residual is written down at §(b2) rather than half-closed.
 *
 *   6. **Widening is not a strategy, and agreement does not cover absence.** Round 124 closed item 5
 *      by widening `importsTsSource` and by adding a cross-limb agreement check. Round 125 pointed a
 *      mutant at both. `await import ('…')` — one space before the paren, valid JS — is a *literal*
 *      the widened predicate still does not read. Combined with a swallowing catch one directory
 *      down, it left this file at `PASS — all 63 checks passed`, count moved 62 → 63 again. Each half
 *      alone was caught (no-space ∧ swallow died at §(c) including the agreement check; space ∧ crash
 *      died at §(b2)), so the escape was the conjunction, as in Round 124.
 *
 *      The agreement check did not fire, and could not have: it is iterated inside `importsTs`, so it
 *      compares verdicts only for files §(b) already admitted. **Two limbs can only disagree about a
 *      file both of them see.** A file neither sees produces agreement vacuously — and here §(b) and
 *      §(c) *did* share their population by construction, which is what made them agree. Sharing a
 *      population makes limbs consistent; it does not make the population right.
 *
 *      So the repair is not a wider regex. `importsTsSource`'s **negative result was carrying two
 *      meanings** — "not a TypeScript importer" and "not recognised" — and only the first is a
 *      finding. The bucket is split: a second, deliberately over-broad reading runs off the same case
 *      table, containment (narrow ⊆ broad) is asserted per row, and the difference — recognised-as-
 *      mentioning-TypeScript but unparsed — is asserted **empty**. An unread shape now turns this file
 *      red asking for a classification instead of passing as a true negative.
 *
 *   7. **The bound belonged to one limb and was worn by three.** Round 126 pointed a mutant at
 *      Round 125's clause 3, as invited. Residual shape 2 reproduces — a specifier literal bound to
 *      a variable *before* the import token escapes both readings and, with a swallowing catch one
 *      directory down, left this file at `PASS — all 89`, count 88 → 89. Third time the denominator
 *      has risen while coverage fell. Controls one variable away: inline literal `FAIL 3/92` at §(c)
 *      including the agreement check, no-catch `FAIL 1/89` at §(b2).
 *
 *      But the larger finding was not in the mutants. §(b2)'s docblock bounds the population to the
 *      `verify-*` naming convention and states the reason: *"the property is only assertable on files
 *      it is safe to run."* That is a reason about **running**. §(b) reads source text and runs
 *      nothing, so it never had that constraint — it inherited the bound when Round 123 fused the two
 *      populations, and no round since has asked whether the justification transferred. It did not.
 *
 *      Measured, on the clean tree, no mutant involved: `measure-marker-floor.mjs`,
 *      `probe-recall-tool.mjs` and `serve-scratch.mjs` all dynamically import `../packages/**.ts`,
 *      none imported the guard, and all three were in **neither** population. Run under plain `node`,
 *      `measure-marker-floor.mjs` printed the raw `ERR_MODULE_NOT_FOUND` naming `queries.js` as
 *      missing — the exact stack trace §3 of the Round 121 memo set out to abolish, and the exact
 *      misattribution Round 120 §5 read as a missing build artifact. This file reported
 *      `PASS — all 88 checks passed` over it, and had done since Round 123.
 *
 *      So the two populations are separated: `readable` (every `.m[jt]s` under `scripts/`) carries
 *      §(b)'s guard assertion and the unclassified bucket; `swept` (the naming convention) still
 *      carries §(b2) and §(c), which execute their targets. Nesting is asserted, and so is the
 *      widening doing work — if `importsTsRead` ever stops admitting a file `swept` cannot reach,
 *      the read population has silently collapsed back and the three files go dark again.
 *
 *      The residual this creates, stated rather than discovered later: the unclassified bucket now
 *      over-fires across 37 files instead of 12. A **correct** verifier — no TypeScript import, no
 *      guard needed, clean exit 0 — that merely writes the word `import` within 40 characters of a
 *      quoted `.ts` specifier *in a comment* turns this file red, and the only way to clear it is to
 *      reword the comment. Measured (M14 `FAIL 1/89`, M0 control `PASS 89`). Not live today: zero of
 *      the broad reading's matches across `scripts/` currently fall inside a comment. But this file
 *      family's house style is to quote these specifiers in prose, so it is a latent over-fire whose
 *      blast radius Round 126 tripled, and item 1 of this header is the reason that matters.
 *
 *   8. **The bucket was a file-level predicate over a site-level property.** Round 127 pointed a
 *      mutant at Round 126's repair rather than at its residual. M15: two dynamic import sites in
 *      one file — site B in the space form §(b) cannot read, behind a swallowing catch; site A
 *      readable and correctly guarded. Every limb reported health. §(b2) saw no raw trace (the guard
 *      converted site A's throw), §(c) saw exit 2 with the right message, §(b) read the file as
 *      guarded, and the bucket did not contain it **because the bucket asked its question of the
 *      file**: site A made `importsTsSource` true, so the file was not a candidate, and site B was
 *      never declared. `PASS — all 110 checks passed`, count 105 → 110. Fourth consecutive round in
 *      which the denominator moved the reassuring way while coverage fell.
 *
 *      The control isolates it: M16 is M15 with site A deleted and site B untouched — same specifier,
 *      same catch, same depth — and it died in the bucket at `FAIL — 1 of 106`. The masking was the
 *      mechanism, not the shape of site B. Note what this is: Round 125 split the negative bucket
 *      precisely because *"the negative result was carrying two meanings"*, and then aggregated the
 *      split back over the file with an `||`. One readable site anywhere in a file re-fused the two
 *      meanings the split had just separated.
 *
 *      So the anchor — a quoted `packages/**.ts` specifier literal — is enumerated, each occurrence
 *      is classified narrow / broad-only / neither, and the file-level predicates are *derived* from
 *      the site-level ones instead of being computed alongside them. M15 under the repaired file:
 *      `FAIL — 1 of 114`, naming `checks/verify-r127-mask.mjs:11`, the line of site B. The bucket
 *      reports `file:line` now, because a red naming only the file leaves the reader to re-derive
 *      which specifier is the unreadable one, and item 1 is about what an expensive red costs.
 *
 *      **Containment was never a property of the predicates.** Round 125 asserted `narrow ⊆ broad`
 *      per row and Round 126 added it per live file, and it held in both places — but it is false for
 *      a constructible input: `import(` followed by more than 40 characters of whitespace and then
 *      the specifier is narrow-true and broad-false (measured directly on the Round 126 predicate
 *      pair). Eleven rows and eight live files held it; the predicates never did. Writing the narrow
 *      reading in as a disjunct of the broad one makes containment hold **by construction**, and
 *      changes what the containment rows assert: no longer drift between two independent regexes, but
 *      an edit that removes the disjunct. Under the old pair such a file would have turned the
 *      instrument red on the CONTAINMENT check — a correct, guarded verifier producing a red it
 *      cannot clear without rewriting its whitespace. Item 1 again, and it is now unreachable.
 *
 *      **Residual, stated rather than half-closed.** Theseus's Round 126 §4 named the prose over-fire
 *      as the strongest target and this round did **not** fix it. What this round adds is that it is
 *      not latent, as Round 126 recorded it — it is live, at line 113 of this file, in the sentence
 *      Round 126 wrote to describe its own repair. It reads as absent because the one file in this
 *      repo whose house style quotes these specifiers in prose is the file excluded from the
 *      population, and because the file-level bucket would have masked it even so (this file has
 *      narrow sites). "Zero broad matches fall inside a comment, measured" was true of the population
 *      and false of the repo. The over-fire's mechanism is also now demonstrated rather than
 *      asserted: the 40-character window reaches backwards *across a line break*, which is how it
 *      caught the unrelated third row of this file's own `THREE_CLASSES` fixture on the first run.
 *
 * §(c) is the end-to-end assertion: both directions of both runners, run rather than argued.
 *
 * ── Costs nothing ──────────────────────────────────────────────────────────
 *
 * No API calls, no model calls, no corpus. Runs on every seat. The §(c) `tsx` runs write only to
 * gitignored `.testdata/` scratch paths their own targets already manage.
 *
 * Run: `node scripts/verify-tsx-guard.mjs`   (this file imports no TypeScript, by design)
 *
 * Exit: 0 all checks pass · 1 a check failed · 2 an input file is not on this seat
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isTsResolutionFailure } from './lib/tsx-required.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = path.join(REPO, 'scripts');

const checks = [];
const ok = (label, detail, cond) => {
  checks.push({ label, pass: cond });
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail === undefined ? '' : `   — ${JSON.stringify(detail)}`}`);
};

// A shape the loader really produces. Built from a path that EXISTS as `.ts` on this seat, so the
// fixture cannot silently become vacuous if the tree is reorganised.
const REAL_TS = path.join(REPO, 'packages/server/src/db/queries.ts');
if (!fs.existsSync(REAL_TS)) {
  console.error(`INCOMPLETE — ${path.relative(REPO, REAL_TS)} is not on this seat; §(a) has no fixture.`);
  process.exit(2);
}
const err = (url, code = 'ERR_MODULE_NOT_FOUND') => Object.assign(new Error('x'), { code, url });
const asJs = (p) => pathToFileURL(p.replace(/\.ts$/, '.js')).href;

// ---------------------------------------------------------------------------------------------
// §(a) The predicate fires on the wrong-runner shape and on nothing else
// ---------------------------------------------------------------------------------------------

console.log('\n=== (a) isTsResolutionFailure — fires on the wrong runner, not on a real absence ===\n');

ok('the real shape is recognised: a packages/ .js whose .ts sibling exists',
  path.relative(REPO, REAL_TS),
  isTsResolutionFailure(err(asJs(REAL_TS))) === true);

// The soundness conjunct. Without it, `node` on a verifier whose dependency was genuinely deleted
// would print "re-run under tsx", the user would, and tsx would fail for the real reason — one
// wasted round trip and a diagnosis pointing away from the cause.
ok('a genuine absence is NOT claimed as a runner problem (no .ts sibling)',
  undefined,
  isTsResolutionFailure(err(asJs(path.join(REPO, 'packages/server/src/db/no-such-module.ts')))) === false);

ok('a different error code is not claimed', undefined,
  isTsResolutionFailure(err(asJs(REAL_TS), 'ERR_UNKNOWN_FILE_EXTENSION')) === false);

ok('a .js outside packages/ is not claimed', undefined,
  isTsResolutionFailure(err(pathToFileURL(path.join(SCRIPTS, 'lib/recall-call-kind.js')).href)) === false);

ok('a non-file: url is not claimed', undefined,
  isTsResolutionFailure(err('node:sqlite')) === false);

ok('a null/undefined error is not claimed', undefined,
  isTsResolutionFailure(undefined) === false && isTsResolutionFailure(null) === false);

// Preconditions: a predicate that answered a constant would pass some of the above trivially.
ok('PRECONDITION — at least one case is true and at least one is false',
  undefined,
  isTsResolutionFailure(err(asJs(REAL_TS))) === true
    && isTsResolutionFailure(err(asJs(REAL_TS), 'EOTHER')) === false);

// ---------------------------------------------------------------------------------------------
// §(b) Every verifier that dynamically imports TypeScript is wrapped — enumerated, not listed
// ---------------------------------------------------------------------------------------------

console.log('\n=== (b) Every scripts/verify-*.mjs importing TypeScript routes its failure here ===\n');

// Round 123, Daedalus. §(b2) was written as "population-free", but it reused the array below, so
// it inherited this membership test verbatim — one on *filenames* rather than on source text.
// Measured, not reasoned: an unguarded `scripts/verify-r123-escape.mts` and an unguarded
// `scripts/checks/verify-r123-nested.mjs` each crashed raw under `node` while this file printed
// `13 verifiers, 4 of them import TypeScript` and `PASS — all 36 checks passed`. A flat
// `readdirSync` + `.endsWith('.mjs')` is blind to depth and to extension, and neither variation is
// exotic: `scripts/lib/` already establishes subdirectories here and `probe-expand-continuation.mts`
// already establishes the extension.
//
// So the population is walked, and the predicate that defines it is itself asserted below — a
// membership test that cannot be escaped is not available here, but one whose *rule* is stated and
// tested is, and that is the difference this repair is making.
const isVerifierPath = (rel) => /(?:^|\/)verify-[^/]*\.m[jt]s$/.test(rel);

// Round 126, Theseus. The `verify-` convention bounds the population this file may *execute*.
// §(b2)'s docblock states the reason: "the property is only assertable on files it is safe to run,
// and this repo's `scripts/` also holds servers and live probes that a blind sweep must not run."
// That reason is real, and it is a reason about *running*. §(b) does not run anything — it reads
// source text — so it never had that constraint, and inherited the bound anyway when Round 123
// fused the two populations. Measured cost of the inheritance: three tracked files.
const isModuleSource = (rel) => /\.m[jt]s$/.test(rel);

const walk = (dir, base = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const rel = base ? `${base}/${e.name}` : e.name;
  return e.isDirectory() ? walk(path.join(dir, e.name), rel) : [rel];
});

const allUnderScripts = walk(SCRIPTS).sort();
const verifiers = allUnderScripts.filter(isVerifierPath);

// The predicate gets §(a)'s treatment — true cases and false cases, and a precondition that both
// kinds are present, so a predicate that has degenerated to always-true or always-false is caught
// here rather than by the silence downstream. The two Round 123 escapes are the first two trues.
for (const [rel, want] of [
  ['verify-r123-escape.mts', true],
  ['checks/verify-r123-nested.mjs', true],
  ['verify-tsx-guard.mjs', true],
  ['lib/tsx-required.mjs', false],
  ['probe-expand-continuation.mts', false],
  ['verify-notes.md', false],
  ['unverify-x.mjs', false],
]) {
  ok(`PREDICATE — ${rel} is ${want ? '' : 'not '}a verifier path`, undefined, isVerifierPath(rel) === want);
}
ok('PRECONDITION — the walk reaches below the top level and the predicate rejects some of what it finds',
  { seen: allUnderScripts.length, verifiers: verifiers.length },
  allUnderScripts.some((r) => r.includes('/')) && verifiers.length > 0 && verifiers.length < allUnderScripts.length);

// Round 124: hoisted from §(b2), because §(b) needs it too and two exclusions would be two holes.
// This file must be out of both the source scan and the run sweep, and for the same reason in each:
// §(b)'s predicate cases below quote real specifiers, so an unexcluded self-scan would classify this
// file as a TypeScript importer and §(c) would then run it under `node` expecting exit 2 — a
// verifier recursing into itself and failing on the way. One exclusion, asserted once, used twice.
//
// Round 127, Daedalus, applying Round 126's own amendment to the line directly above the code
// Round 126 wrote. That paragraph is a *run*-limb reason — the clause that carries it is "§(c) would
// then run it". §(b) reads and runs nothing, so under the amendment it is not entitled to the bound
// and must state its own. It has one, and it is a different one: this is the only module under
// `scripts/` that quotes `packages/**.ts` specifiers **as data** — as §(b)'s own predicate fixtures,
// and as prose about those fixtures. Measured on this file at the time of writing: 15 anchors, 6
// read as imports, 7 in an import position the narrow reading cannot parse, 2 in no import position
// at all — and *not one of them is an import this file performs*. Including it would put seven
// entries in the bucket, every one of them a fixture or a sentence.
//
// So the bound survives, which is worth saying plainly: re-derivation is not a synonym for widening,
// and Rounds 123-126 widened every time. What changes is what generalises. The run-side reason
// generalises by "is this safe to execute", a property of any file. The read-side reason generalises
// by "does this file carry the instrument's own fixtures" — which is a property of *this* file and
// would not transfer to a second instrument written next to it under a different name. Two reasons
// that license one exclusion today and would license different ones tomorrow.
const SELF = path.relative(SCRIPTS, fileURLToPath(import.meta.url)).split(path.sep).join('/');
const swept = verifiers.filter((f) => f !== SELF);
// Self-exclusion is a hole in both populations, so assert its size. A rename that stopped matching
// would silently re-include this file; a second exclusion creeping in would go unnoticed.
ok('PRECONDITION — exactly one verifier is excluded, and it is this file',
  { excluded: verifiers.filter((f) => f === SELF) }, verifiers.length - swept.length === 1);

// Round 126, Theseus. The READ population — every module under `scripts/`, not just the ones named
// `verify-*`. §(b)'s guard assertion and the unclassified bucket run over this; §(b2) and §(c) keep
// running over `swept`, because those limbs execute their targets and this one does not.
const readable = allUnderScripts.filter(isModuleSource).filter((f) => f !== SELF);
// The read limb's exclusion gets the same bounding assertion the run limb's has had since Round 124.
// It did not have one: `swept`'s size was asserted, `readable`'s was not, so a second exclusion
// creeping into the read population — or a rename that stopped matching — was unasserted on exactly
// the limb Round 126 widened. Same hole, other limb, which is this round's subject twice over.
ok('PRECONDITION — exactly one module is excluded from the read population, and it is this file',
  { excluded: allUnderScripts.filter(isModuleSource).filter((f) => !readable.includes(f)) },
  allUnderScripts.filter(isModuleSource).length - readable.length === 1);

for (const [rel, want] of [
  ['measure-marker-floor.mjs', true],
  ['probe-recall-tool.mjs', true],
  ['serve-scratch.mjs', true],
  ['lib/tsx-required.mjs', true],
  ['checks/verify-r123-nested.mjs', true],
  ['probe-expand-continuation.mts', true],
  ['verify-notes.md', false],
  ['lib/recall-call-kind.js', false],
]) {
  ok(`PREDICATE — ${rel} is ${want ? '' : 'not '}module source`, undefined, isModuleSource(rel) === want);
}

// The two populations are nested, not parallel. If this ever inverts, a file would be run by §(b2)
// without §(b) having read it — the Round 124 gap with the limbs swapped.
ok('PRECONDITION — the run population is a strict subset of the read population',
  { run: swept.length, read: readable.length },
  swept.every((f) => readable.includes(f)) && swept.length < readable.length);

// Round 124, Theseus. This was the *other* population in this file, and Round 123 did not widen it.
// It read `'\.\./packages/` — anchored to exactly one `../`, single quotes only, `await` required —
// so a verifier one directory down was outside it however it was written. That is invisible rather
// than merely incomplete: a file outside `importsTs` is reported as "does not import TypeScript",
// which is indistinguishable from the true negative, and §(c) never runs it. Measured, not reasoned
// — see item 5 of the header for the mutant that survived at `PASS — all 45 checks passed`.
//
// Depth- and quote-agnostic, and it does not require `await` adjacent to the call (the Round 122
// detached-await escape). It still requires a *literal* specifier: a computed one is out of reach
// here by construction, which is the residual recorded at §(b2), not a hole this predicate hides.
// Round 127, Daedalus. Every reading in this section is a question about a *site* — "is this
// specifier in an import position, and can §(b) parse it?" — and both readings were written as
// predicates over a whole file. Measured cost below at item 8: one readable site clears every
// unreadable site in the same file. So the anchor — a quoted `packages/**.ts` specifier literal —
// is enumerated, each occurrence is classified, and the file-level verdicts are *derived* from the
// site-level ones rather than computed separately. One definition, two granularities.
const ANCHOR_SOURCE = "['\"`](?:\\.\\./)+packages/[^'\"`\\n]*\\.ts['\"`]";

const anchorsOf = (src) => [...src.matchAll(new RegExp(ANCHOR_SOURCE, 'g'))].map((m) => {
  const pre = src.slice(0, m.index);
  // `(?![\s\S])` rather than `$`, which also matches before a trailing newline — an anchor at the
  // start of a line would otherwise be read one character out of position.
  const narrow = /import\(\s*(?![\s\S])/.test(pre);
  return {
    index: m.index,
    line: pre.split('\n').length,
    text: m[0],
    narrow,
    // Round 125 asserted containment (narrow ⊆ broad) per row and it held on the table — but it is
    // not true in general: `import(` + more than 40 characters of whitespace + the specifier is
    // narrow and *not* windowed, so the broad reading was never actually a superset. Writing the
    // disjunct in makes containment hold **by construction** instead of by assertion. The rows
    // below keep asserting it, with their job changed: they now catch an edit that removes this
    // disjunct, rather than drift between two independent regexes.
    broad: narrow || /\bimport\b[\s\S]{0,40}(?![\s\S])/.test(pre),
  };
});

const importsTsSource = (src) => anchorsOf(src).some((a) => a.narrow);

// §(a)'s treatment, and Round 123's for `isVerifierPath`: true cases, false cases, and a
// precondition that both kinds are present. The first four trues are the four escapes this file has
// actually been shown to have — Round 122's double quote and detached await, Round 124's depth —
// so a future edit that re-narrows the predicate reopens them here rather than in silence.
// Round 125, Daedalus. Theseus's Round 124 residual said the remaining escape needs a *computed*
// specifier, because "§(b)/§(c) need a literal to read". Measured false: `importsTsSource` matches
// `import\(`, and `await import ('…')` — one space, valid JS — is a *literal* it does not read. The
// mutant using it (space ∧ swallowing catch, one directory down) left this file at
// `PASS — all 63 checks passed`, count moved 62 → 63. Round 124's conjunction shape exactly, one
// level out, and each half alone is still caught: no-space ∧ swallow dies at §(c) (all three limbs,
// agreement included); space ∧ crash dies at §(b2).
//
// The repair is deliberately *not* a wider `importsTsSource`. Round 122 established that widening
// this regex is whack-a-mole — that is the whole reason §(b2) exists. What is actually wrong is that
// the predicate's **negative result carries two different meanings**: "affirmatively not a TypeScript
// importer" and "I did not recognise this file", and only the first is a finding. Round 124 named
// this ("absence from the list reads identically to does-not-import-TypeScript") and closed it by
// widening the population. Widening cannot close it in general — there is always a next shape. So the
// negative bucket is *split* instead, and the unrecognised half is asserted empty. A quoting style
// nobody has thought of yet stops being a silent pass and becomes a red that asks for a
// classification. Broader than `importsTsSource` by construction, and that containment is asserted
// on the shared case table below rather than left to inspection.
const mentionsTsSpecifier = (src) => anchorsOf(src).some((a) => a.broad);

// §(a)'s treatment, and Round 123's for `isVerifierPath`: true cases, false cases, and a
// precondition that both kinds are present. The first four trues are the four escapes this file has
// actually been shown to have — Round 122's double quote and detached await, Round 124's depth —
// so a future edit that re-narrows the predicate reopens them here rather than in silence. Rows 6-7
// are Round 125's: literals the narrow predicate cannot read, which is what the broad one is for.
//
// One table, two predicates, per rule 8b route (i): the wide and narrow readings cannot be given
// divergent inputs, because there is only one set of inputs.
for (const [label, src, wantNarrow, wantBroad] of [
  ["today's shape", "await import('../packages/server/src/db/queries.ts')", true, true],
  ['double-quoted (R122)', 'await import("../packages/server/src/db/queries.ts")', true, true],
  ['detached await (R122)', "const p = import('../packages/x.ts');\nawait p;", true, true],
  ['one directory down (R124)', "await import('../../packages/server/src/db/queries.ts')", true, true],
  ['newline before the specifier', "await import(\n  '../packages/x.ts'\n)", true, true],
  ['space before the paren (R125)', "await import ('../../packages/x.ts')", false, true],
  ['comment inside the parens (R125)', "await import(/* the db */ '../packages/x.ts')", false, true],
  ['a .js specifier is not a TypeScript import', "await import('../packages/x.js')", false, false],
  ['a non-packages import', "await import('./lib/tsx-required.mjs')", false, false],
  ['a mention outside an import position', '// see ../packages/server/src/db/queries.ts', false, false],
  ['a static import', "import fs from 'node:fs'", false, false],
]) {
  ok(`PREDICATE — ${label} ${wantNarrow ? 'is' : 'is not'} a TypeScript import`, undefined,
    importsTsSource(src) === wantNarrow);
  ok(`PREDICATE — ${label} ${wantBroad ? 'does' : 'does not'} mention a TypeScript specifier`, undefined,
    mentionsTsSpecifier(src) === wantBroad);
  // The containment that makes the split meaningful. If the broad reading ever stops being a
  // superset of the narrow one, the unclassified bucket below silently stops covering the narrow
  // predicate's blind spot — and it would go on reporting empty. Asserted per row, on the measured
  // predicates rather than on the intent columns.
  ok(`PREDICATE — ${label}: narrow ⊆ broad`, undefined,
    !importsTsSource(src) || mentionsTsSpecifier(src));
}
// A broad reading that had degenerated to always-true would make the containment above vacuous and
// the bucket below fire on everything; always-false would make the bucket vacuously empty. Both are
// the silent-cap shape, so both are named here.
ok('PRECONDITION — the broad reading discriminates (at least one true case and one false case)',
  undefined,
  mentionsTsSpecifier("await import ('../../packages/x.ts')") === true
    && mentionsTsSpecifier("import fs from 'node:fs'") === false);

// Round 127. The site enumerator gets §(a)'s treatment in its own right: the three classes must all
// be reachable, or a degenerate `anchorsOf` makes every derived verdict above meaningless while the
// case table still passes (each row is a single-site fixture, so a file-level predicate that had
// collapsed to "first site wins" satisfies all eleven).
//
// The ordering here is load-bearing and was got wrong first: with the `neither` row written last it
// measured as `broad-only`, because the 40-character window reaches *backwards across the line
// break* into the previous row's `import` token. That is the over-fire of item 8 in miniature, and
// it bit this file's own fixture before it bit anything else — so the unrelated row goes first.
const THREE_CLASSES = [
  "const s = '../packages/c.ts';",           // neither — a specifier in no import position
  "await import('../packages/a.ts');",       // narrow, therefore broad
  "await import ('../packages/b.ts');",      // broad only
].join('\n');
ok('PRECONDITION — the site enumerator reaches all three classes on one input',
  anchorsOf(THREE_CLASSES).map((a) => (a.narrow ? 'narrow' : a.broad ? 'broad-only' : 'neither')),
  anchorsOf(THREE_CLASSES).length === 3
    && anchorsOf(THREE_CLASSES).filter((a) => a.narrow).length === 1
    && anchorsOf(THREE_CLASSES).filter((a) => a.broad && !a.narrow).length === 1
    && anchorsOf(THREE_CLASSES).filter((a) => !a.broad).length === 1);

// Round 127, and the reason the bucket is enumerated per site rather than per file. M15: two import
// sites in one file, the first unreadable behind a swallowing catch, the second readable and
// correctly guarded. Under the file-level bucket the readable site made the file `importsTsSource`,
// so the file was not in the bucket at all and the unreadable site was never declared — `PASS — all
// 110`, count 105 → 110. The control one variable away (M16, site A deleted, same site B, same
// catch, same depth) died in the bucket at `FAIL 1/106`. The masking *was* the mechanism, so the
// shape is kept here as a fixture rather than as a mutant that gets deleted: a future edit that
// collapses the bucket back to a file-level predicate reopens the escape here, loudly.
const MASKED = [
  "try { await import ('../../packages/masked.ts'); } catch {}",
  "await import('../../packages/readable.ts');",
].join('\n');
ok('MASKING — the file-level reading calls M15 fully classified (narrow ∧ broad)', undefined,
  importsTsSource(MASKED) === true && mentionsTsSpecifier(MASKED) === true);
ok('MASKING — …and the site-level reading declares the unreadable site anyway',
  anchorsOf(MASKED).filter((a) => a.broad && !a.narrow).map((a) => a.text),
  anchorsOf(MASKED).filter((a) => a.broad && !a.narrow).length === 1);

const srcOf = (f) => fs.readFileSync(path.join(SCRIPTS, f), 'utf8');

// Round 126: the containment above is asserted on eleven synthetic rows and was never asserted on
// a single one of the files the bucket actually runs over. The bucket's soundness depends on
// containment holding for the REAL inputs; a predicate pair can satisfy the table and break here.
for (const f of readable) {
  const src = srcOf(f);
  if (importsTsSource(src)) {
    ok(`CONTAINMENT — ${f}: narrow ⊆ broad on the live file`, undefined, mentionsTsSpecifier(src));
  }
}

// Read-side: every module under scripts/ that imports TypeScript, not merely every verifier.
const importsTsRead = readable.filter((f) => importsTsSource(srcOf(f)));
// Run-side: §(c) may only execute what it is safe to execute, so it keeps the narrow population.
const importsTs = swept.filter((f) => importsTsSource(srcOf(f)));

// The unclassified bucket, per *site*. A site here is a TypeScript specifier in an import position
// that `importsTsSource` could not parse — so §(b) cannot say whether that import is guarded, and
// §(c) will never exercise it. That is not a pass and it is not a failure of the file under test; it
// is this instrument declining to answer, and it has to say so out loud. Empty on today's tree; M8
// and M16 are the files that put something in it, and M15 is the file the file-level version could
// not see. Reported as `file:line` because a red naming only the file leaves the reader to re-derive
// which of its specifiers is the unreadable one — and item 1 of the header is about the cost of a
// red that is expensive to clear.
const unclassified = readable.flatMap((f) =>
  anchorsOf(srcOf(f))
    .filter((a) => a.broad && !a.narrow)
    .map((a) => `${f}:${a.line}`));
ok('every verifier mentioning a TypeScript specifier is one §(b) can actually read', unclassified,
  unclassified.length === 0);

// Round 124: the guard-detection half was depth-anchored too, and it fails the *other* way — a
// correctly guarded verifier at `scripts/checks/` writes `from '../lib/tsx-required.mjs'`, which
// `"from './lib/…'"` does not contain, so it was reported UNGUARDED. Measured: that file turned this
// one red while §(b2) and §(c) both reported it healthy (exit 2, names the invocation). Loud and
// wrong rather than silent and wrong, so cheaper — but it is item 1 of the header, the over-fire,
// and a red that a correct file cannot clear is the fastest way to get a check switched off.
const importsGuardSource = (src) => /from '(?:\.\.?\/)+lib\/tsx-required\.mjs'/.test(src)
  && src.includes('explainTsxRequirement(err, import.meta.url)');

for (const [label, src, want] of [
  ['flat, correctly guarded', "from './lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)", true],
  ['one directory down (R124)', "from '../lib/tsx-required.mjs'\nexplainTsxRequirement(err, import.meta.url)", true],
  ['imports the guard but never calls it', "from './lib/tsx-required.mjs'", false],
  ['calls the guard but never imports it', 'explainTsxRequirement(err, import.meta.url)', false],
  ['a different lib', "from './lib/other.mjs'\nexplainTsxRequirement(err, import.meta.url)", false],
]) {
  ok(`PREDICATE — ${label} ${want ? 'reads as' : 'does not read as'} guarded`, undefined,
    importsGuardSource(src) === want);
}

const unguarded = importsTsRead.filter((f) => !importsGuardSource(srcOf(f)));

console.log(`  ${readable.length} modules read (${swept.length} of them runnable verifiers), ${importsTsRead.length} import TypeScript:`);
for (const f of importsTsRead) console.log(`    ${unguarded.includes(f) ? 'UNGUARDED' : 'guarded  '}  ${f}${swept.includes(f) ? '' : '   (read-only: outside the run population)'}`);
console.log('');

ok('every TypeScript-importing module under scripts/ imports the guard and wraps its import',
  unguarded, unguarded.length === 0);

// Without this, §(b) passes vacuously the day the regex stops matching anything — the silent-cap
// shape, in the check written to catch a different silence.
ok('PRECONDITION — the enumeration is non-empty', importsTsRead.length, importsTsRead.length > 0);
ok('PRECONDITION — it does not match every module (the regex discriminates)',
  [importsTsRead.length, readable.length], importsTsRead.length < readable.length);
// Round 126: the widening is only doing work if it admits files the old population excluded. If
// this ever goes to zero the read population has silently collapsed back onto `swept`, and the
// three files that motivated it would go unchecked again — passing, as they did for three rounds.
ok('PRECONDITION — the read population admits TypeScript importers the run population cannot reach',
  importsTsRead.filter((f) => !swept.includes(f)),
  importsTsRead.some((f) => !swept.includes(f)));

const run = (cmd, argv) => {
  const r = spawnSync(cmd, argv, { cwd: REPO, encoding: 'utf8', timeout: 120000 });
  return { rc: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

// ---------------------------------------------------------------------------------------------
// §(b2) The same guarantee without a population — Round 122, Theseus
// ---------------------------------------------------------------------------------------------
//
// §(b) can only be as good as its membership regex, and a regex that misses one file fails
// silently *and* takes §(c) down with it, since §(c) iterates `importsTs`. So assert the property
// on the whole population and let *content* membership fall out: under plain `node`, no verifier
// may emit an unhandled module-resolution stack trace. Either it does not import TypeScript (runs
// normally), or it does and the guard converts the throw into an exit-2 explanation.
//
// Round 123: this removes the *source-text* membership test, not the membership test. The
// population is still whatever `isVerifierPath` admits, because the property is only assertable on
// files it is safe to execute, and this repo's `scripts/` also holds servers and live probes that
// a blind sweep must not run. Trading an unbounded membership test (how one may write a dynamic
// import) for a bounded one (a filename convention this repo controls) is the whole of the gain —
// the bounded one is stated as a predicate and tested in §(b) above, which the unbounded one
// never could be.
//
// One residual, written down rather than half-closed: a verifier named outside the convention
// entirely — `check-foo.mjs` — is in neither set. Source-scanning the unrunnable remainder would
// re-introduce exactly the unbounded test §(b2) exists to escape, so it is not done here; the
// convention is the claim, and `isVerifierPath` is where to change it.
//
// Round 124 adds a second residual, and this one no limb reaches. §(b2) sees a crash; §(b) and §(c)
// see a literal specifier. A verifier that builds its specifier at runtime *and* swallows the
// resulting error, exiting 0, presents neither: nothing to read and nothing to catch. Both halves
// are needed — a computed specifier alone still crashes and dies at §(b2); a swallowed literal alone
// is now read and dies at §(c). Closing it would need a fourth limb asserting that a verifier which
// exits 0 under plain `node` actually verified something, which is `verify-verifier-exit-codes.mjs`'s
// subject rather than this file's — and that instrument is single-target today (it names
// `verify-premise-render.mjs`), so it has no population to widen and no version of this escape.
// Stated here so the next round starts from where the coverage actually ends.
//
// Round 125 corrects the *scope* of that residual, which was written narrower than it was. "A
// computed specifier" was not the condition; **"a specifier §(b) cannot read"** was, and literals
// live in that set too — `await import ('…')`, one space, was one, and it survived. The unclassified
// bucket in §(b) now catches the readable-but-unparsed literals. Measured, so the boundary is stated
// where it actually falls rather than where it is tidiest — three shapes still escape *both* the
// narrow and the broad reading, and only the first is what Round 124 described:
//
//   1. A genuinely computed specifier — `import([..].join('/'))`. No literal anywhere to read.
//   2. A literal bound to a variable first — `const s = '../packages/x.ts'; await import(s)`. The
//      literal is in the source, but it precedes the `import` token rather than following it, so the
//      broad reading's window does not cover it. This one is a literal, and it escapes.
//   3. A comment longer than the broad reading's 40-character window sitting inside the parens.
//
// Each still needs the swallowing catch to survive §(b2), so all three are conjunctions rather than
// single defects. The honest summary of what the bucket bought: it does not remove the membership
// question, it moves it onto a predicate that is *deliberately over-broad*, where a false negative is
// harder to hit by accident than on a precise one — and where the failure of the bucket itself is now
// asserted (containment, plus a discrimination precondition) rather than silent. That is an
// improvement in kind, not a closure, and the next round should start from these three.

console.log('\n=== (b2) Population-free: no verifier crashes raw under plain node ===\n');

// The signature of an *unhandled* resolution failure, as node actually prints it: the code, plus
// at least one raw stack frame. Both limbs are required, and the second one is the interesting
// one — see the synthesised negative control below for why it is here and why no live output
// currently exercises it.
const rawResolutionCrash = (out) => /ERR_MODULE_NOT_FOUND/.test(out) && /\n {4}at /.test(out);

// Positive control, run rather than assumed: if this predicate ever stops recognising the crash
// shape — a node release reformats the trace, say — every check below passes vacuously, which is
// the exact silence §(b2) was added to remove. Synthesised live, so it tracks the running node.
const control = run('node', ['--input-type=module', '-e', "await import('./no-such-module-r122-control.mjs')"]);
ok('PRECONDITION — the crash detector recognises a real unhandled resolution failure',
  { rc: control.rc }, rawResolutionCrash(control.out));

// Negative control on live output. Weaker than it looks, and labelled so rather than left to
// imply more: today's guard message quotes the resolution *url* and never the *code*, so this
// passes under a detector with no second limb at all. Measured — Round 122 N2 blunted the
// predicate to the code alone and this check stayed green.
ok('PRECONDITION — the detector does not fire on the guard\'s own exit-2 explanation (live)',
  undefined, !rawResolutionCrash(run('node', ['scripts/verify-empty-tail-detector.mjs']).out));

// …so the second limb is asserted against a synthesised message instead. This is the shape a
// *handled* failure takes if anyone makes the guard more informative by naming the code it caught
// — an entirely reasonable edit. Under a code-only detector that edit would turn all four guarded
// verifiers red at once: four false alarms reported as unguarded crashes, in the file whose whole
// subject is instruments that misreport. The limb is here for that edit, not for today's output.
const HANDLED_BUT_NAMES_THE_CODE = [
  'INCOMPLETE — nothing was verified: this script was run under plain `node`.',
  '(caught ERR_MODULE_NOT_FOUND while resolving a TypeScript import; re-run with npx tsx)',
].join('\n');
ok('PRECONDITION — …and not on a handled failure that merely names the code (synthesised)',
  undefined, !rawResolutionCrash(HANDLED_BUT_NAMES_THE_CODE));

for (const f of swept) {
  const r = run('node', [`scripts/${f}`]);
  ok(`${f} — under plain node: no raw resolution stack trace`, { rc: r.rc }, !rawResolutionCrash(r.out));
}

// ---------------------------------------------------------------------------------------------
// §(c) End to end: wrong runner exits 2 and says so; right runner is unchanged
// ---------------------------------------------------------------------------------------------

console.log('\n=== (c) End to end, both runners, run rather than argued ===\n');

// One representative per guarded site would leave the others unasserted; run all of them.
//
// Round 124 adds the cross-limb assertion. §(b) decides "is this guarded?" by reading the source;
// §(c) decides it by running the file. Two independent measurements of one property, and until now
// nothing required them to agree — which is how §(b) came to report a file UNGUARDED that §(c) was
// simultaneously reporting as exiting 2 with the right message. Requiring agreement means either
// test drifting is caught by the other, and neither has to be trusted alone.
for (const f of importsTs) {
  const bad = run('node', [`scripts/${f}`]);
  const behaviourallyGuarded = bad.rc === 2 && bad.out.includes('run under plain `node`')
    && !bad.out.includes('ERR_MODULE_NOT_FOUND\n    at');
  ok(`${f} — plain node: exit 2, not a stack trace`, { rc: bad.rc }, behaviourallyGuarded);
  ok(`${f} — …and it names the invocation that works`,
    undefined,
    bad.out.includes(`npx tsx scripts/${f}`));
  ok(`${f} — §(b)'s source verdict and §(c)'s behavioural verdict agree`,
    { source: unguarded.includes(f) ? 'unguarded' : 'guarded', behaviour: behaviourallyGuarded ? 'guarded' : 'unguarded' },
    !unguarded.includes(f) === behaviourallyGuarded);
}

// The guard must not have broken the thing it guards. Two targets, chosen because they are the
// two Round 120 §5 recorded as un-runnable; asserting the fix on exactly the files the finding
// named is the point.
for (const f of ['verify-empty-tail-detector.mjs', 'verify-recogniser-equivalence.mjs']) {
  const good = run('npx', ['tsx', `scripts/${f}`]);
  ok(`${f} — under tsx: still exit 0 (the guard is inert on the working path)`,
    { rc: good.rc }, good.rc === 0);
}

// ---------------------------------------------------------------------------------------------

const failures = checks.filter((c) => !c.pass);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} of ${checks.length} checks failed`);
  process.exit(1);
}
console.log(`\nPASS — all ${checks.length} checks passed`);
