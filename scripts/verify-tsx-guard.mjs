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
const SELF = path.relative(SCRIPTS, fileURLToPath(import.meta.url)).split(path.sep).join('/');
const swept = verifiers.filter((f) => f !== SELF);
// Self-exclusion is a hole in both populations, so assert its size. A rename that stopped matching
// would silently re-include this file; a second exclusion creeping in would go unnoticed.
ok('PRECONDITION — exactly one verifier is excluded, and it is this file',
  { excluded: verifiers.filter((f) => f === SELF) }, verifiers.length - swept.length === 1);

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
const importsTsSource = (src) => /import\(\s*['"`](?:\.\.\/)+packages\/[^'"`\n]*\.ts['"`]/.test(src);

// §(a)'s treatment, and Round 123's for `isVerifierPath`: true cases, false cases, and a
// precondition that both kinds are present. The first four trues are the four escapes this file has
// actually been shown to have — Round 122's double quote and detached await, Round 124's depth —
// so a future edit that re-narrows the predicate reopens them here rather than in silence.
for (const [label, src, want] of [
  ["today's shape", "await import('../packages/server/src/db/queries.ts')", true],
  ['double-quoted (R122)', 'await import("../packages/server/src/db/queries.ts")', true],
  ['detached await (R122)', "const p = import('../packages/x.ts');\nawait p;", true],
  ['one directory down (R124)', "await import('../../packages/server/src/db/queries.ts')", true],
  ['newline before the specifier', "await import(\n  '../packages/x.ts'\n)", true],
  ['a .js specifier is not a TypeScript import', "await import('../packages/x.js')", false],
  ['a non-packages import', "await import('./lib/tsx-required.mjs')", false],
  ['a mention outside an import position', '// see ../packages/server/src/db/queries.ts', false],
  ['a static import', "import fs from 'node:fs'", false],
]) {
  ok(`PREDICATE — ${label} ${want ? 'is' : 'is not'} a TypeScript import`, undefined,
    importsTsSource(src) === want);
}

const importsTs = swept.filter((f) => importsTsSource(fs.readFileSync(path.join(SCRIPTS, f), 'utf8')));

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

const unguarded = importsTs.filter((f) => !importsGuardSource(fs.readFileSync(path.join(SCRIPTS, f), 'utf8')));

console.log(`  ${swept.length} verifiers scanned (${verifiers.length} less this file), ${importsTs.length} of them import TypeScript:`);
for (const f of importsTs) console.log(`    ${unguarded.includes(f) ? 'UNGUARDED' : 'guarded  '}  ${f}`);
console.log('');

ok('every TypeScript-importing verifier imports the guard and wraps its import', unguarded, unguarded.length === 0);

// Without this, §(b) passes vacuously the day the regex stops matching anything — the silent-cap
// shape, in the check written to catch a different silence.
ok('PRECONDITION — the enumeration is non-empty', importsTs.length, importsTs.length > 0);
ok('PRECONDITION — it does not match every verifier (the regex discriminates)',
  [importsTs.length, swept.length], importsTs.length < swept.length);

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
