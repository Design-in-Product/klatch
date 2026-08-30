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
 *      §(b2) removes the population question instead of widening the regex. It asserts the property
 *      directly on **every** `verify-*.mjs`: run under plain `node`, none may emit an unhandled
 *      resolution stack trace. No membership test, so nothing to escape — a computed specifier or a
 *      quoting style nobody has thought of yet is covered for free. Measured cost of the whole
 *      sweep: ~1.1s. §(b) is kept for its report line and for locating *which* site is unguarded.
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

const verifiers = fs.readdirSync(SCRIPTS)
  .filter((f) => f.startsWith('verify-') && f.endsWith('.mjs'))
  .sort();

const importsTs = verifiers.filter((f) =>
  /await import\(\s*\n?\s*'\.\.\/packages\/[^']*\.ts'/.test(fs.readFileSync(path.join(SCRIPTS, f), 'utf8')));

const unguarded = importsTs.filter((f) => {
  const s = fs.readFileSync(path.join(SCRIPTS, f), 'utf8');
  return !(s.includes("from './lib/tsx-required.mjs'") && s.includes('explainTsxRequirement(err, import.meta.url)'));
});

console.log(`  ${verifiers.length} verifiers, ${importsTs.length} of them import TypeScript:`);
for (const f of importsTs) console.log(`    ${unguarded.includes(f) ? 'UNGUARDED' : 'guarded  '}  ${f}`);
console.log('');

ok('every TypeScript-importing verifier imports the guard and wraps its import', unguarded, unguarded.length === 0);

// Without this, §(b) passes vacuously the day the regex stops matching anything — the silent-cap
// shape, in the check written to catch a different silence.
ok('PRECONDITION — the enumeration is non-empty', importsTs.length, importsTs.length > 0);
ok('PRECONDITION — it does not match every verifier (the regex discriminates)',
  [importsTs.length, verifiers.length], importsTs.length < verifiers.length);

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
// on the whole directory and let membership fall out: under plain `node`, no verifier may emit an
// unhandled module-resolution stack trace. Either it does not import TypeScript (runs normally),
// or it does and the guard converts the throw into an exit-2 explanation.

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

const SELF = path.basename(fileURLToPath(import.meta.url));
const swept = verifiers.filter((f) => f !== SELF);
// Self-exclusion is a hole in the sweep, so assert its size. A rename that stopped matching would
// silently re-include this file and recurse; a second exclusion creeping in would go unnoticed.
ok('PRECONDITION — exactly one verifier is excluded from the sweep, and it is this file',
  { excluded: verifiers.filter((f) => f === SELF) }, verifiers.length - swept.length === 1);

for (const f of swept) {
  const r = run('node', [`scripts/${f}`]);
  ok(`${f} — under plain node: no raw resolution stack trace`, { rc: r.rc }, !rawResolutionCrash(r.out));
}

// ---------------------------------------------------------------------------------------------
// §(c) End to end: wrong runner exits 2 and says so; right runner is unchanged
// ---------------------------------------------------------------------------------------------

console.log('\n=== (c) End to end, both runners, run rather than argued ===\n');

// One representative per guarded site would leave the others unasserted; run all of them.
for (const f of importsTs) {
  const bad = run('node', [`scripts/${f}`]);
  ok(`${f} — plain node: exit 2, not a stack trace`,
    { rc: bad.rc },
    bad.rc === 2 && bad.out.includes('run under plain `node`') && !bad.out.includes('ERR_MODULE_NOT_FOUND\n    at'));
  ok(`${f} — …and it names the invocation that works`,
    undefined,
    bad.out.includes(`npx tsx scripts/${f}`));
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
