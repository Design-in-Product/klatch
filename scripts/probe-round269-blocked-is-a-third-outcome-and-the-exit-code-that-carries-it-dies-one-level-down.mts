/**
 * Round 269, Daedalus, 2026-09-25 (START fire). Drives the Round 269 changes to
 * `scripts/sweep-probes.mjs`, which answer two routed items in one pass:
 *
 *   - Theseus's Round 268 §3: the sweep collapsed `exit 2` ("could not run") and `exit 1` ("failed
 *     a check") into a flat RED, so a red cleared by the operator quitting his own dev server is
 *     indistinguishable from a regression.
 *   - Daedalus's own Round 267 §5: the `why` field is prose, only `expect` is enforced, and the
 *     figure in `why` had drifted from the figure in `expect` five times across that list.
 *
 * ## The half the routed framing did not have
 *
 * The distinction Theseus asked the sweep to surface **is already gone by the time the sweep sees
 * anything.** Measured this fire, with 3001 genuinely held by `npm run dev` in the main checkout:
 *
 *   probe-round225 exits **1**, not 2.
 *   FAIL [B] the repaired round223b runs green against the tree it now describes
 *            — exit 2 after 368 ms — 3 PASS, 0 FAIL
 *
 * Arm B of `probe-round225` drives `probe-round223b`, **reads the child's exit 2 in its own failure
 * detail**, and grades it as a failed regression check. The sweep is downstream of that. So no
 * amount of reporting in `sweep-probes.mjs` can recover the distinction on tonight's red: the
 * information is destroyed one level below, in the arm that had it in hand.
 *
 * > **A conversion from "could not run" to "failed" is lossless nowhere and invisible everywhere.**
 * > The exit code is the only channel that carries it, and a driving arm that grades a child's
 * > refusal spends that channel on a boolean.
 *
 * Arm G is the census that makes the consequence unarguable: **0 of the 13 swept probes contains an
 * `exit(2)` site**, so the BLOCKED state built this fire cannot fire on today's swept set at all. It
 * is built, driven here against processes that really do exit 2, and waiting for the exit code.
 * Arm B is Theseus's file and is routed to him rather than changed here.
 *
 * ## Why BLOCKED is declared and not sniffed
 *
 * Arm A6 is the limb that would be missing from a plausible version of this: an entry with **no**
 * `refusal` declared gets no benefit of the doubt, and its exit 2 stays RED. The alternative — a
 * fleet-wide refusal regex — was measured and rejected: 15 `exit(2)` sites across 108 probe files
 * spell the same intent seven different ways ("Stop it and re-run", "Refusing to start", "REFUSING:",
 * "Cannot run [...]", "usage:", "No database at", "MISMATCH"). Matching that would be the sweep's
 * founding error — *what a probe RUNS is not recoverable from what a probe SAYS* — aimed at a new
 * target.
 *
 * ## Why `verdict` is now a wrapper
 *
 * `probe-round261` arm D drives `verdict()` on four corners and arm E2 asserts it can return both
 * values. `verdict` was NOT copied into a three-valued sibling; it is a wrapper over `classify`, so
 * the two cannot disagree. Round 263's rule turned on my own file: *a remedy that lives as a copy in
 * one file is not available to the next file, only to the next reader of that file.* Arm B here
 * re-drives Round 261's four corners through the new implementation rather than trusting that.
 *
 * Runs nothing live: no server, no port, no database, no corpus, no model call. Every process it
 * spawns is a three-line script it mints itself under gitignored `.testdata/r269/`.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classify,
  diagnosisLine,
  verdict,
  sweepExit,
  entryProblems,
  measurementCheck,
  measurementLines,
  SWEPT,
} from './sweep-probes.mjs';
import { stripSource } from './lib/strip-source.mjs';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const Z_PATHSPECS = ['scripts/', 'packages/'];
const zBefore = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zWindowAtOpen = Z_PATHSPECS.map((p) => `${p} → ${windowState(REPO, p) || '(clean)'}`);

let pass = 0;
let fail = 0;
const meas: string[] = [];

const check = (id: string, claim: string, ok: boolean, detail: string) => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id: string, claim: string, detail: string) => {
  meas.push(id);
  console.log(`  [${id}] MEAS  ${claim}`);
  console.log(`        ${detail}`);
};

const SCRATCH = join(process.cwd(), '.testdata', 'r269');
const FIXTURES = join(SCRATCH, 'fixtures');
rmSync(FIXTURES, { recursive: true, force: true });
mkdirSync(FIXTURES, { recursive: true });

const EXPECT = /All 7 regression checks passed/;
const REFUSAL = /fixture: something already holds the thing/;
const GREEN = 'All 7 regression checks passed, 0 measurements, 0 skips';

// ── arm A: classify on every corner that matters ─────────────────────────────

console.log('\n── arm A: classify — three states, and the two limbs of the new one ──');

check('A1', 'exit 0 + summary line → PASS',
  classify(0, GREEN, EXPECT, REFUSAL).state === 'PASS',
  `state = ${classify(0, GREEN, EXPECT, REFUSAL).state}`);

check('A2', 'exit 1 + summary line → RED (a probe that printed its tail and threw on the way out)',
  classify(1, GREEN, EXPECT, REFUSAL).state === 'RED',
  `state = ${classify(1, GREEN, EXPECT, REFUSAL).state}`);

check('A3', 'exit 0 + no summary line → RED (the probe-round224 limb: a skip must not read as a pass)',
  classify(0, 'silently did nothing', EXPECT, REFUSAL).state === 'RED',
  `state = ${classify(0, 'silently did nothing', EXPECT, REFUSAL).state}`);

check('A4', 'exit 2 + declared refusal → BLOCKED',
  classify(2, 'fixture: something already holds the thing. Stop it and re-run.', EXPECT, REFUSAL).state === 'BLOCKED',
  `state = ${classify(2, 'fixture: something already holds the thing. Stop it and re-run.', EXPECT, REFUSAL).state}`);

check('A5', 'exit 2 WITHOUT the declared refusal → RED, not BLOCKED (an exit 2 from a throw path is not a refusal)',
  classify(2, 'TypeError: cannot read properties of undefined', EXPECT, REFUSAL).state === 'RED',
  `state = ${classify(2, 'TypeError: …', EXPECT, REFUSAL).state} — exit code alone does not buy BLOCKED`);

check('A6', 'exit 2 + refusal text but NO refusal DECLARED on the entry → RED',
  classify(2, 'fixture: something already holds the thing', EXPECT, undefined).state === 'RED',
  'state = RED. This is the limb that keeps membership declared rather than sniffed: an entry that ' +
  'has not stated what its refusal looks like gets no benefit of the doubt from text that matches ' +
  'some other entry\'s pattern.');

const annotated = classify(1, `${GREEN}\nfixture: something already holds the thing`, EXPECT, REFUSAL);
check('A7', 'exit 1 + refusal text → RED, and `refused` is true so the reader can be told why',
  annotated.state === 'RED' && annotated.refused === true,
  `state = ${annotated.state}, refused = ${annotated.refused}. This is tonight's probe-round225 ` +
  'exactly: the refusal is in the output, the exit code is 1, and the sweep must not silently ' +
  'reclassify it. It annotates and does not re-grade.');

check('A8', 'classify CAN return each of its three states — no arm above is vacuous',
  new Set([
    classify(0, GREEN, EXPECT, REFUSAL).state,
    classify(1, GREEN, EXPECT, REFUSAL).state,
    classify(2, 'fixture: something already holds the thing', EXPECT, REFUSAL).state,
  ]).size === 3,
  'PASS, RED and BLOCKED all observed from the same function in this run');

// ── arm B: the wrapper cannot drift from what Round 261 drove ─────────────────

console.log('\n── arm B: verdict is a wrapper, re-driven on Round 261 arm D\'s four corners ──');

check('B1', 'exit 0 + matching summary → ok (261 D1)', verdict(0, GREEN, EXPECT).ok === true, 'ok = true');
check('B2', 'exit 1 + matching summary → NOT ok, matched still true (261 D2)',
  verdict(1, GREEN, EXPECT).ok === false && verdict(1, GREEN, EXPECT).matched === true,
  'ok = false, matched = true');
check('B3', 'exit 0 + no summary → NOT ok, matched false (261 D3)',
  verdict(0, 'nope', EXPECT).ok === false && verdict(0, 'nope', EXPECT).matched === false,
  'ok = false, matched = false');
check('B4', 'exit 1 + no summary → NOT ok (261 D4)', verdict(1, 'nope', EXPECT).ok === false, 'ok = false');
check('B5', 'and an exit 2 with refusal text is still NOT ok through the old two-valued view',
  verdict(2, 'fixture: something already holds the thing', EXPECT).ok === false,
  'ok = false. The wrapper passes no refusal, so BLOCKED is unreachable through `verdict` and ' +
  'Round 261\'s arms keep meaning what they meant.');

// ── arm C: the exit code the sweep itself returns ────────────────────────────

console.log('\n── arm C: sweepExit — the convention propagated up one level ──');

const corners: Array<[Record<string, number>, number, string]> = [
  [{ red: 0, blocked: 0, bad: 0 }, 0, 'clean'],
  [{ red: 1, blocked: 0, bad: 0 }, 1, 'a check failed'],
  [{ red: 0, blocked: 1, bad: 0 }, 2, 'nothing failed, something could not run'],
  [{ red: 1, blocked: 1, bad: 0 }, 1, 'a real failure outranks a blockage'],
  [{ red: 0, blocked: 0, bad: 1 }, 1, 'census problem is a failure'],
  [{ red: 0, blocked: 1, bad: 1 }, 1, 'census problem outranks a blockage'],
];
for (const [input, want, why] of corners) {
  const got = sweepExit(input as { red: number; blocked: number; bad: number });
  check(`C-${JSON.stringify(input)}`, `→ exit ${want} (${why})`, got === want, `got ${got}`);
}
check('C7', 'BLOCKED is never 0 — a blockage cannot summarise as a pass',
  sweepExit({ red: 0, blocked: 3, bad: 0 }) !== 0,
  `3 blocked, 0 red → exit ${sweepExit({ red: 0, blocked: 3, bad: 0 })}. Collapsing this to 0 would ` +
  'reproduce the finding of probe-round224, which is in the swept set.');

// ── arm D: the entry schema, two-sided ──────────────────────────────────────

console.log('\n── arm D: entryProblems — the drift class closed mechanically ──');

const good = { file: 'x.mts', expect: /All 27 regression checks passed/, why: 'reports 27/27, 9 measurements' };
check('D1', 'an entry whose why agrees with its pin has no problems',
  entryProblems(good).length === 0, `problems = ${entryProblems(good).length}`);

const drifted = { file: 'x.mts', expect: /All 27 regression checks passed/, why: 'reports 16/16' };
check('D2', 'why says 16/16 where expect pins 27 → a problem, named',
  entryProblems(drifted).length === 1 && /why says 16 where expect pins 27/.test(entryProblems(drifted)[0]),
  entryProblems(drifted)[0] ?? '(none)');

const loose = { file: 'x.mts', expect: /All \d+ regression checks passed/, why: 'reports 9/9' };
check('D3', 'expect containing \\d → a problem (Round 261 §6b: a count assertion that cannot fail on a count)',
  entryProblems(loose).some((p) => /cannot fail on a count/.test(p)),
  entryProblems(loose).join(' || ') || '(none)');

const silent = { file: 'x.mts', expect: /All 27 regression checks passed/, why: 'run green in some fire; no ports' };
check('D4', 'why stating NO figure → a problem, because a rule an entry satisfies by making no claim is vacuous',
  silent.why !== undefined && entryProblems(silent).some((p) => /vacuous/.test(p)),
  entryProblems(silent).join(' || ') || '(none)');

const unpinned = { file: 'x.mts', expect: /regression checks passed/, why: 'reports 27/27' };
check('D5', 'expect pinning no figure at all → a problem, and the why claim is not silently accepted',
  entryProblems(unpinned).some((p) => /pins no figure/.test(p)),
  entryProblems(unpinned).join(' || ') || '(none)');

const multi = { file: 'x.mts', expect: /All 4 regression checks passed/, why: 'reports 4/4, covered 12/14' };
check('D6', 'a non-self-equal pair like 12/14 is not a pass-count claim and is left alone',
  entryProblems(multi).length === 0,
  'probe-round245\'s real entry shape: 4/4 is checked against the pin, 12/14 is a coverage ratio ' +
  'and is not. A rule that reddened on 12/14 would be pressure to delete true prose.');

const regs = { file: 'x.mts', expect: /All 18 regression checks passed/, why: 'reports 6 regression, 3 skips' };
check('D7', 'the `N regression` spelling is checked too, not just `N/N`',
  entryProblems(regs).some((p) => /why says 6 where expect pins 18/.test(p)),
  entryProblems(regs).join(' || ') || '(none)');

// ── arm E: the live list, which is what the census now enforces ──────────────

console.log('\n── arm E: the live SWEPT list under the rule added this fire ──');

const liveProblems = SWEPT.flatMap((s: { file: string; why: string; expect: RegExp }) =>
  entryProblems(s).map((p) => `${s.file}: ${p}`));
check('E1', 'every one of the live swept entries agrees with its own pin and states a figure',
  liveProblems.length === 0,
  liveProblems.length === 0
    ? `${SWEPT.length} entries, 0 problems. probe-round259's entry stated no figure until this fire ` +
      'and was passing vacuously; 17/17 was added to it in the same commit as this rule.'
    : liveProblems.join('\n        '));

measure('E2', 'how many swept entries declare a refusal pattern',
  `${SWEPT.filter((s: { refusal?: RegExp }) => s.refusal).length} of ${SWEPT.length} — only ` +
  'probe-round225, and per arm G below its exit code cannot reach 2 anyway. Reported so the ' +
  'coverage of the new state is not mistaken for the state working.');

// ── arm F: the measurement claim, checked against the run ────────────────────

console.log('\n── arm F: measurementCheck — enforced where the run permits, reported where it does not ──');

const TWO_SPELLINGS = 'MEAS [F] first fleet spelling\n  [C] MEAS  second fleet spelling\n';
check('F1', 'measurementLines counts BOTH fleet spellings of a measurement line',
  measurementLines(TWO_SPELLINGS) === 2,
  `counted ${measurementLines(TWO_SPELLINGS)} in a fixture holding probe-round225's spelling ` +
  '(`MEAS [F] …`) and probe-round265\'s (`  [C] MEAS  …`). Both are live in the swept set.');

check('F2', 'a claim that agrees with the run produces neither problem nor note',
  Object.keys(measurementCheck({ why: 'reports 27/27, 2 measurements' }, TWO_SPELLINGS)).length === 0,
  'claim 2, emitted 2');

check('F3', 'a claim contradicted by the run is a problem',
  /claims 5 measurements; the run emitted 2/.test(
    measurementCheck({ why: 'reports 27/27, 5 measurements' }, TWO_SPELLINGS).problem ?? ''),
  measurementCheck({ why: 'reports 27/27, 5 measurements' }, TWO_SPELLINGS).problem ?? '(none)');

check('F4', 'a claim the run cannot check is a NOTE, not a problem — unverified is not false',
  measurementCheck({ why: '3 measurements' }, 'no measurement lines here').note !== undefined &&
  measurementCheck({ why: '3 measurements' }, 'no measurement lines here').problem === undefined,
  measurementCheck({ why: '3 measurements' }, 'no measurement lines here').note ?? '(none)');

check('F5', 'an entry making no measurement claim is not nagged',
  Object.keys(measurementCheck({ why: 'reports 27/27' }, TWO_SPELLINGS)).length === 0,
  'no claim, no output');

// ── arm G: the census that prices the new state honestly ─────────────────────

console.log('\n── arm G: can BLOCKED fire on today\'s swept set? ──');

/**
 * Reads CODE, not prose. **Strings blanked as well as comments, and that is not a detail** — the
 * first version of this arm passed `false` here, and the first thing it caught was THIS probe:
 * arm H mints its blocked fixture from a string literal containing `process.exit(2)`, so a probe
 * that *stages* a refusal scored identical to a probe that *performs* one. Round 225's title, on
 * its author, one level in from where it was first found: a citation is not a call, and a citation
 * inside a string is still not a call. Arm G4 drives the difference two-sided.
 */
const hasExitTwo = (file: string, blankStrings = true): boolean => {
  const code = stripSource(readFileSync(join(REPO, 'scripts', file), 'utf8'), blankStrings);
  return /process\.exit\(2\)|exitCode\s*=\s*2/.test(code);
};

const sweptWithExitTwo = SWEPT.map((s: { file: string }) => s.file).filter((f: string) => hasExitTwo(f));
check('G1', 'no swept probe can exit 2, so the BLOCKED state cannot fire on today\'s swept set',
  sweptWithExitTwo.length === 0,
  sweptWithExitTwo.length === 0
    ? `0 of ${SWEPT.length} swept probes contain an exit(2) site in comment-stripped source. The ` +
      'mechanism is built and driven above against real exit-2 processes (arm H); it is waiting ' +
      'for a swept probe that propagates one. When this arm goes red that is the good news.'
    : `NOW REACHABLE from: ${sweptWithExitTwo.join(', ')} — re-read this arm's detail, the ` +
      'consequence in the memo has changed.');

const fleet = readdirSync(join(REPO, 'scripts')).filter((f) => /^probe-/.test(f));
const fleetWithExitTwo = fleet.filter((f) => hasExitTwo(f));
const fleetSoft = fleet.filter((f) => hasExitTwo(f, false));
measure('G2', 'exit(2) sites across the whole probe fleet, for contrast with G1',
  `${fleetWithExitTwo.length} of ${fleet.length} probe files refuse with exit 2 — all of them in ` +
  `DEFERRED. The convention exists and is used; the swept set is the part of the fleet that does ` +
  `not use it.\n        ${fleetWithExitTwo.slice(0, 6).join(', ')}…`);

const overReported = fleetSoft.filter((f) => !fleetWithExitTwo.includes(f));
check('G4', 'the strings-kept reading over-reports, and by a named amount — a citation in a string is not a call',
  fleetSoft.length > fleetWithExitTwo.length && overReported.length === fleetSoft.length - fleetWithExitTwo.length,
  `strings KEPT: ${fleetSoft.length}. strings BLANKED: ${fleetWithExitTwo.length}. ` +
  `Over-reported by ${overReported.length}: ${overReported.join(', ')}. ` +
  'This probe is one of them — arm H mints a refusing fixture from a string — and probe-round250 is ' +
  'the other, which nobody had noticed. The figure quoted in sweep-probes.mjs\'s header was the ' +
  'strings-kept one until this arm produced the correction.');

const citationOnly = join(FIXTURES, 'citation-only.mts');
const realCall = join(FIXTURES, 'real-call.mts');
writeFileSync(citationOnly, 'const body = "process.exit(2);\\n";\nexport default body;\n');
writeFileSync(realCall, 'if (process.argv[9]) { process.exit(2); }\nexport default 1;\n');
const hardOf = (p: string) => /process\.exit\(2\)/.test(stripSource(readFileSync(p, 'utf8'), true));
check('G5', 'driven two-sided on one minted pair: string-only citation scores 0, real call scores 1',
  hardOf(citationOnly) === false && hardOf(realCall) === true,
  `citation-only → ${hardOf(citationOnly)}, real-call → ${hardOf(realCall)}. The two files differ ` +
  'only in whether the same eighteen characters sit inside quotes. Without this pair, G1 and G4 ' +
  'would both be asserting a mask behaviour neither one demonstrates.');

const r225 = stripSource(readFileSync(join(REPO, 'scripts', 'probe-round225-a-citation-is-not-a-call.mts'), 'utf8'), false);
/**
 * Round 271: this arm has changed polarity, and the change is the point.
 *
 * In Round 269 G3 was a TRIPWIRE. It asserted the defect — `r223bExit === 0`, mapping exit 2 and
 * exit 1 onto one FAIL — and its stated purpose was to go red when Theseus repaired arm B, because
 * that red is the signal to widen this file's BLOCKED limb. In Round 270 he repaired it. The arm
 * fired. It was doing its job, and a fired tripwire that is left asserting the old world becomes a
 * permanent false red that the next reader learns to ignore.
 *
 * So it is now an ASSERTION OF THE REPAIRED STATE: the three-valued `classifyDrive` is present and
 * the boolean conjunction is gone. A revert on Theseus's side reddens this again, which is the
 * property the tripwire had and which is worth keeping; what it no longer does is redden on
 * success.
 */
const armBRepaired = /classifyDrive/.test(r225) && !/r223bExit === 0 &&/.test(r225);
check('G3', 'probe-round225 arm B distinguishes its child\'s exit 2 from exit 1 — the conversion routed in 269, repaired in 270',
  armBRepaired,
  armBRepaired
    ? '`classifyDrive` is present and the `r223bExit === 0 &&` conjunction is gone: arm B now ' +
      'returns green | red | could-not-run and records a HARD SKIP for the third, which is what ' +
      'makes the probe exit 3. This arm was a tripwire in 269 asserting the defect; it fired when ' +
      'Theseus repaired it, and it is now the assertion of the repair so that a revert still reds.'
    : 'arm B has returned to grading its child\'s exit as a boolean, or `classifyDrive` is gone. ' +
      'That re-destroys the exit-2/exit-1 distinction one level below this file and makes the ' +
      'BLOCKED limbs unreachable again.');

// ── arm H: the states arise from real processes, not from hand-passed integers ──

console.log('\n── arm H: driven against minted scripts that really exit 0, 1 and 2 ──');

const FIX = FIXTURES;
const mint = (name: string, body: string) => {
  const p = join(FIX, name);
  writeFileSync(p, body);
  return p;
};
const spawn = (p: string) => {
  const r = spawnSync(process.execPath, [p], { encoding: 'utf8', timeout: 30_000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

const greenFixture = mint('green.mjs', `console.log(${JSON.stringify(GREEN)});\nprocess.exit(0);\n`);
const redFixture = mint('red.mjs', 'console.log("FAILED — 1 of 7");\nprocess.exit(1);\n');
const blockedFixture = mint('blocked.mjs',
  'console.error("fixture: something already holds the thing. Stop it and re-run.");\nprocess.exit(2);\n');

const g = spawn(greenFixture);
const r = spawn(redFixture);
const b = spawn(blockedFixture);

check('H1', 'a real process exiting 0 with the summary line classifies PASS',
  classify(g.code, g.out, EXPECT, REFUSAL).state === 'PASS',
  `exit ${g.code} → ${classify(g.code, g.out, EXPECT, REFUSAL).state}`);
check('H2', 'a real process exiting 1 classifies RED',
  classify(r.code, r.out, EXPECT, REFUSAL).state === 'RED',
  `exit ${r.code} → ${classify(r.code, r.out, EXPECT, REFUSAL).state}`);
check('H3', 'a real process exiting 2 with its declared refusal on STDERR classifies BLOCKED',
  classify(b.code, b.out, EXPECT, REFUSAL).state === 'BLOCKED',
  `exit ${b.code} → ${classify(b.code, b.out, EXPECT, REFUSAL).state}. The refusal was written to ` +
  'stderr, which is where every real refusal on this fleet is written, and the sweep concatenates ' +
  'both streams before grading.');
check('H4', 'and the sweep-level exit code over that mixed set is 2, not 1 and not 0',
  sweepExit({
    red: [g, r, b].filter((x) => classify(x.code, x.out, EXPECT, REFUSAL).state === 'RED').length - 1,
    blocked: [g, r, b].filter((x) => classify(x.code, x.out, EXPECT, REFUSAL).state === 'BLOCKED').length,
    bad: 0,
  }) === 2,
  'one PASS and one BLOCKED with the RED excluded → 2. With the RED included it is 1, which arm ' +
  'C already drove; this arm is about the three states arising from processes rather than from ' +
  'integers I chose.');

// ── arm J: the exit-3 limb and the diagnosis line (Round 271) ────────────────

/**
 * Round 271. Theseus's Round 270 §4 and §5, driven rather than accepted.
 *
 * The fixture mints a script that calls the REAL `summariseAndExit` from `probe-outcome.mts` with
 * a real hard skip, rather than one that prints a plausible-looking exit-3 transcript and exits 3.
 * That distinction is this file's founding rule aimed at its own newest arm: what a probe RUNS is
 * not recoverable from what a probe SAYS, so a fixture that only says `did not run:` would prove
 * nothing about the code path the sweep actually meets. It also means the legend line under J3 is
 * emitted by the library, so if the library stops emitting it this arm notices.
 */
console.log('\n── arm J: exit 3 with a declared skip, driven through the real probe-outcome ──');

const SKIP_LABEL = 'arm Q: the drive of some-child — it refused at its own door';
const SKIP = /arm Q: the drive of some-child/;
const outcomeMod = JSON.stringify(join(REPO, 'scripts', 'lib', 'probe-outcome.mts'));
const skipFixture = mint('inconclusive.mts',
  `import { summariseAndExit } from ${outcomeMod};\n` +
  'summariseAndExit({\n' +
  '  probeName: "fixture-probe",\n' +
  // `pass`, not `ok`: ProbeVerdict's field is `pass`, and the first version of this fixture used
  // `ok`, which is not merely ignored — an absent `pass` reads as falsy, so the fixture exited 1
  // as a FAILED check instead of 3. J1 caught it, which is the reason J1 asserts the exit code
  // separately from J2 rather than letting a wrong fixture quietly redden the limb under test.
  '  results: [{ arm: "A", check: "a check that really ran", pass: true }],\n' +
  `  skipped: [${JSON.stringify(SKIP_LABEL)}],\n` +
  '});\n');
const tsxBin = join(REPO, 'node_modules', '.bin', 'tsx');
const jr = spawnSync(tsxBin, [skipFixture], { encoding: 'utf8', timeout: 60_000, cwd: REPO });
const jOut = `${jr.stdout || ''}${jr.stderr || ''}`;

check('J1', 'the fixture really exits 3 through probe-outcome — not a transcript that says 3',
  jr.status === 3,
  `exit ${jr.status} from a real run of summariseAndExit with one hard skip. A fixture that ` +
  'printed this transcript and exited 3 by hand would demonstrate nothing about the path the ' +
  'sweep meets.');

check('J2', 'exit 3 carrying the entry\'s DECLARED skip label classifies BLOCKED',
  classify(jr.status, jOut, EXPECT, REFUSAL, SKIP).state === 'BLOCKED',
  `state = ${classify(jr.status, jOut, EXPECT, REFUSAL, SKIP).state}. This is the state Round 269 ` +
  'built and could not reach: the run established a check and broke none, so neither PASS nor RED ' +
  'is honest.');

check('J3', 'and a bare exit 3 with NO declared skip stays RED — arm A6\'s discipline on the new limb',
  classify(jr.status, jOut, EXPECT, REFUSAL, undefined).state === 'RED',
  `state = ${classify(jr.status, jOut, EXPECT, REFUSAL, undefined).state}. Same output, same exit ` +
  'code, no declared label — an undeclared not-green is not evidence about its own cause. This is ' +
  'the limb a plausible version of this change would omit, and it is omitted the same way twice.');

check('J4', 'a declared label that does NOT appear in the run does not buy BLOCKED either',
  classify(jr.status, jOut, EXPECT, REFUSAL, /arm Z: a skip that never happened/).state === 'RED',
  `state = ${classify(jr.status, jOut, EXPECT, REFUSAL, /arm Z: a skip that never happened/).state}` +
  '. Declaring a skip is not the same as the run reporting one, so the pattern must match the ' +
  'run\'s own `did not run:` line rather than merely be present in the entry.');

const jLast = jOut.trim().split('\n').map((l) => l.trim()).filter(Boolean).pop() || '';
check('J5', 'the OLD last-line heuristic quotes the legend, not the conclusion — the defect, demonstrated',
  /^\(exit 3 —/.test(jLast),
  `last line was: "${jLast.slice(0, 80)}". This is why the repair is needed rather than asserted: ` +
  'summariseAndExit prints the legend AFTER the headline, so the informative line is ' +
  'second-to-last for every probe that exits 3.');

check('J6', 'and diagnosisLine recovers the conclusion instead',
  /^INCONCLUSIVE — /.test(diagnosisLine(jOut)),
  `diagnosisLine → "${diagnosisLine(jOut).slice(0, 80)}". Driven two-sided against J5 on ONE ` +
  'output: the pair is what shows the repair changed the reader, rather than prose claiming it did.');

check('J7', 'diagnosisLine still returns the plain tail for output that never routes through probe-outcome',
  diagnosisLine('some probe that rolls its own tail\nFINAL: 3 of 3 ok') === 'FINAL: 3 of 3 ok' &&
  diagnosisLine('') === '(no output)',
  `bespoke tail → "${diagnosisLine('some probe that rolls its own tail\nFINAL: 3 of 3 ok')}", ` +
  `empty → "${diagnosisLine('')}". 95 deferred probes are not all on the shared library, so a ` +
  'heuristic that returned nothing for them would be a regression against the behaviour it replaces.');

check('J8', 'the live probe-round225 entry declares a skip label that matches its own source',
  (() => {
    const e = SWEPT.find((s) => s.file.startsWith('probe-round225'));
    if (!e || !e.skip) return false;
    const src = readFileSync(join(REPO, 'scripts', 'probe-round225-a-citation-is-not-a-call.mts'), 'utf8');
    return src.search(e.skip) >= 0;
  })(),
  'the declared `skip` pattern is found in probe-round225\'s own source, so the label is a ' +
  'contract with the file rather than a guess about it. This is the check that would have caught ' +
  'a paraphrase of the label — the failure mode of every prose-matching rule on this fleet.');

// ── arm Z ───────────────────────────────────────────────────────────────────

console.log('\n── arm Z: this run changed nothing under scripts/ or packages/ ──');

const zAfter = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zMoved = Z_PATHSPECS.filter((_, i) => zAfter[i] !== zBefore[i]);
check('Z1', 'no file under scripts/ or packages/ was changed BY THIS RUN — a before/after content fingerprint',
  zMoved.length === 0,
  zMoved.length === 0
    ? `fingerprints identical across the whole run for ${Z_PATHSPECS.join(' and ')}; every write ` +
      `went to ${FIX.replace(process.cwd(), '.')}`
    : `MOVED: ${zMoved.join(', ')}\n        before: ${zBefore.join(' || ')}\n        after:  ${zAfter.join(' || ')}`);
measure('Z2', 'state of the window when this run opened — reported, NOT graded',
  zWindowAtOpen.join('\n        '));
check('Z3', 'the fixtures are under gitignored .testdata/ and nowhere else',
  existsSync(FIX) && FIX.includes('.testdata') && !existsSync(join(REPO, 'scripts', 'green.mjs')),
  `fixtures at ${FIX.replace(process.cwd(), '.')}; scripts/green.mjs does not exist`);

console.log('');
console.log(`${fail === 0 ? `All ${pass} regression checks passed` : `FAILED — ${fail} of ${pass + fail}`}, ${meas.length} measurements, 0 skips`);
process.exit(fail === 0 ? 0 : 1);
