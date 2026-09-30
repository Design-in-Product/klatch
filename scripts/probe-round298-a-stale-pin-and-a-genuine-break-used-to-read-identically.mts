/**
 * A stale pin and a genuine break used to read identically, and a duration could pose as a count.
 *
 * Round 298, Argus, 2026-09-30 (START fire). Closes an item both Daedalus and Theseus explicitly
 * declined to build and handed forward, most recently Theseus 297 §6: *"It is now been passed over
 * by both of us for the same stated reason, which is worth flagging: that is the shape of an item
 * that never gets built. It should probably be somebody's first unit of a fire."* This is that fire.
 *
 * ## Part 1 — the RED-path message could not distinguish its two causes
 *
 * Argus's own WORK-fire §3 (2026-09-29): when a swept probe's output fails to match its `expect`
 * regex, the sweep prints `exit N, summary line NOT FOUND — <diagnosisLine>`. That sentence is
 * printed identically whether the probe genuinely broke (threw, produced no conclusion line at all)
 * or is merely reporting a DIFFERENT, still-clean conclusion — the pin read `All 10 regression
 * checks passed` and the probe now honestly says `All 12`. A reader gets no signal from the message
 * about which repair is needed, and has to re-drive the probe by hand to find out.
 *
 * `diagnosisLine` already recovers the real conclusion line (Round 271). The gap was narrower than
 * "regex vs. count": nothing had ever diffed that recovered line's own figure against the pin's.
 * `pinDiagnosis` (new export) does exactly that diff and nothing else — it does not touch `classify`,
 * so no probe's PASS/RED/BLOCKED verdict moves; only the printed sentence for an already-RED entry
 * gets more specific.
 *
 * ## Part 2 — `entryProblems` could not tell a self-equal DURATION from a self-equal COUNT
 *
 * Found by Theseus pasting his own SWEPT entry (297 §6): `entryProblems` scans `why` for `N/N` and
 * treats any self-equal pair as a pass-count claim to check against the pin. `probe-round246`'s
 * entry avoids a false claim here only because its two timing arms happened to differ
 * (`27258/27620 ms`). `probe-round297`'s two arms took the same time, and its entry had to be
 * worded `932 ms per arm` — not the fleet's own `N/N` idiom — to dodge a false CENSUS RED that a
 * literal `932/932 ms` would have produced. The fix (`(?!\s*ms\b)` on the `N/N` scan, in
 * `entryProblems`, same commit as Part 1 because it is the same class of confusion in the sibling
 * function) removes the need to word around the bug.
 *
 * Runs nothing live: no server, no port, no database, no corpus, no model call. Every process it
 * spawns is a two-line script it mints itself under gitignored `.testdata/r298/`.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diagnosisLine, pinDiagnosis, entryProblems, classify, SWEPT } from './sweep-probes.mjs';
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

const SCRATCH = join(process.cwd(), '.testdata', 'r298');
rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });

// ── arm A: pinDiagnosis — the three corners the RED-path message now distinguishes ──────────────

console.log('\n── arm A: pinDiagnosis — stale pin vs. agreement vs. no signal at all ──');

check('A1', 'a probe still concluding cleanly with a DIFFERENT count → names both figures',
  pinDiagnosis('All 10 regression checks passed', 'All 12 regression checks passed')
    === 'pin says 10, observed says 12 — the pin needs bumping',
  `got: ${pinDiagnosis('All 10 regression checks passed', 'All 12 regression checks passed')}`);

check('A2', 'pin and observed AGREE → undefined (this shape means `matched` was already true upstream, so the caller never asks)',
  pinDiagnosis('All 10 regression checks passed', 'All 10 regression checks passed') === undefined,
  `got: ${pinDiagnosis('All 10 regression checks passed', 'All 10 regression checks passed')}`);

check('A3', 'a conclusion line that is not the "All N regression checks passed" shape → undefined, not a guess',
  pinDiagnosis('All 10 regression checks passed', 'INCONCLUSIVE — established 4, skipped 1') === undefined,
  `got: ${pinDiagnosis('All 10 regression checks passed', 'INCONCLUSIVE — established 4, skipped 1')}` +
  '. INCONCLUSIVE carries no pass count to diff, so this must not fabricate one.');

check('A4', 'no digit in the pin source at all → undefined',
  pinDiagnosis('regression checks passed', 'All 10 regression checks passed') === undefined,
  'a pin that names no figure has nothing to diff — Round 261 §6b territory, entryProblems\' business, not this function\'s');

// ── arm B: entryProblems — a self-equal duration must not read as a self-equal count ────────────

console.log('\n── arm B: entryProblems — the duration/count confusion, driven on realistic why text ──');

const realShape = {
  file: 'x.mts',
  expect: /All 10 regression checks passed/,
  why: 'driven twice by the promotion path (real HOME and an empty HOME): 10/10 green, exit 0 both arms, 932 ms per arm; unchanged',
};
check('B1', 'round297\'s actual entry shape (worded AROUND the bug, "932 ms per arm") has no problems',
  entryProblems(realShape).length === 0, `problems = ${JSON.stringify(entryProblems(realShape))}`);

const durationCollidesWithPin = {
  file: 'x.mts',
  expect: /All 10 regression checks passed/,
  why: 'driven twice by the promotion path: 10/10 green, exit 0 both arms, 10/10 ms; unchanged',
};
check('B2', 'a self-equal DURATION that happens to equal the pin is still not double-counted as a second, redundant claim',
  entryProblems(durationCollidesWithPin).length === 0,
  `problems = ${JSON.stringify(entryProblems(durationCollidesWithPin))}. The coincidentally-equal ` +
  '"10/10 ms" is excluded from the claim set rather than silently agreeing with the pin by luck — ' +
  'if it were counted as a SECOND claim on top of the real "10/10 green" one, this would still read ' +
  'as zero problems (both would agree with the pin), so the case that actually distinguishes ' +
  '"excluded" from "counted and lucky" is B3/B4 below, where the duration does NOT match the pin.');

/**
 * The defect itself, reproduced directly rather than asserted. `oldClaims` is the PRE-298 regex,
 * kept here only as a comparison fixture — not a copy of production logic this file is obliged to
 * maintain, the same role round269 arm G's `blankStrings` toggle plays for its own repaired reader.
 */
const oldClaims = (why: string): string[] =>
  [...why.matchAll(/(\d+)\/(\d+)/g)].filter((m) => m[1] === m[2]).map((m) => m[1]);

const durationMismatchesPin = {
  file: 'x.mts',
  expect: /All 10 regression checks passed/,
  why: 'driven twice: 10/10 green, exit 0 both arms, 15/15 ms; unchanged',
};
check('B3', 'the OLD regex would have produced a false claim from the duration alone — the defect, demonstrated on a fixture that is otherwise well-formed',
  oldClaims(durationMismatchesPin.why).includes('15'),
  `old claims = ${JSON.stringify(oldClaims(durationMismatchesPin.why))} — "15" from "15/15 ms" would ` +
  'have been checked against the pin (10) and reported as a false CENSUS RED on an entry whose real ' +
  'check-count claim (10/10) agrees with its pin');

check('B4', 'the NEW entryProblems does not report that false problem',
  entryProblems(durationMismatchesPin).length === 0,
  `problems = ${JSON.stringify(entryProblems(durationMismatchesPin))}. Same why text as B3\'s fixture, ` +
  'read through the repaired scanner: the real check-count claim (10/10) is still checked and still ' +
  'agrees; the duration is excluded rather than mistaken for a second claim');

const realDrift = { file: 'x.mts', expect: /All 27 regression checks passed/, why: 'reports 16/16' };
check('B5', 'a genuine drift is still caught — the fix narrows what counts as a claim, it does not turn the check off',
  entryProblems(realDrift).length === 1 && /why says 16 where expect pins 27/.test(entryProblems(realDrift)[0]),
  entryProblems(realDrift)[0] ?? '(none)');

const nonSelfEqualUnaffected = { file: 'x.mts', expect: /All 4 regression checks passed/, why: 'reports 4/4, covered 12/14 ms' };
check('B6', 'a non-self-equal pair (12/14) was already excluded by the m[1]===m[2] filter and stays excluded regardless of a trailing "ms"',
  nonSelfEqualUnaffected.why.match(/(\d+)\/(\d+)(?!\s*ms\b)/g)?.length === 2 &&
  entryProblems(nonSelfEqualUnaffected).length === 0,
  'both N/N tokens still match the pattern (the lookahead only screens self-equal-duration pairs at ' +
  'the filter step); 12/14 was never self-equal so it was never a claim');

// ── arm C: the live SWEPT list — the entry this bug was found on, read through the fix ──────────

console.log('\n── arm C: the live SWEPT list, under both repairs at once ──');

const liveProblems = SWEPT.flatMap((s: { file: string; why: string; expect: RegExp }) =>
  entryProblems(s).map((p) => `${s.file}: ${p}`));
check('C1', 'every live swept entry still agrees with its own pin — the narrower scan did not open a hole',
  liveProblems.length === 0,
  liveProblems.length === 0
    ? `${SWEPT.length} entries, 0 problems, including probe-round297's real "932 ms per arm" entry`
    : liveProblems.join('\n        '));

const r297 = SWEPT.find((s: { file: string }) => s.file.startsWith('probe-round297'));
check('C2', 'round297\'s live entry is present and its why still carries the "932 ms per arm" wording this probe was written about',
  r297 !== undefined && /932 ms per arm/.test(r297.why),
  r297 ? r297.why : '(not found)');

// ── arm D: end-to-end, against real spawned processes ───────────────────────────────────────────

console.log('\n── arm D: the RED-path message, composed against two REAL processes ──');

const mint = (name: string, body: string) => {
  const p = join(SCRATCH, name);
  writeFileSync(p, body);
  return p;
};
const spawn = (p: string) => {
  const r = spawnSync(process.execPath, [p], { encoding: 'utf8', timeout: 30_000 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

// Simulates a probe whose pin is stale: it still concludes cleanly, at a different count.
const staleFixture = mint('stale.mjs', 'console.log("All 12 regression checks passed, 0 measurements, 0 skips");\nprocess.exit(0);\n');
// Simulates a probe that genuinely broke: no conclusion line of any recognised shape.
const brokenFixture = mint('broken.mjs', 'console.error("TypeError: cannot read properties of undefined (reading \'x\')");\nprocess.exit(1);\n');

const EXPECT = /All 10 regression checks passed/;
const stale = spawn(staleFixture);
const broken = spawn(brokenFixture);

// Reproduces the exact composition at sweep-probes.mjs's call site, not a paraphrase of it: the
// same three expressions (classify's `matched`, diagnosisLine, pinDiagnosis) in the same order.
const compose = (code: number | null, out: string, expect: RegExp) => {
  const { matched } = classify(code, out, expect);
  if (matched) return (out.match(expect) || [''])[0];
  const conclusion = diagnosisLine(out);
  const diag = pinDiagnosis(expect.source, conclusion);
  return diag
    ? `exit ${code}, ${diag} — ${conclusion.slice(0, 110)}`
    : `exit ${code}, summary line NOT FOUND — ${conclusion.slice(0, 110)}`;
};

const staleMsg = compose(stale.code, stale.out, EXPECT);
check('D1', 'a real process concluding cleanly at a different count → the message NAMES the stale pin',
  staleMsg === 'exit 0, pin says 10, observed says 12 — the pin needs bumping — All 12 regression checks passed, 0 measurements, 0 skips',
  `got: "${staleMsg}"`);

const brokenMsg = compose(broken.code, broken.out, EXPECT);
check('D2', 'a real process that genuinely broke → the ORIGINAL message, unchanged, because pinDiagnosis correctly abstains',
  brokenMsg === "exit 1, summary line NOT FOUND — TypeError: cannot read properties of undefined (reading 'x')",
  `got: "${brokenMsg}"`);

check('D3', 'D1 and D2 are driven on the SAME EXPECT regex and read differently only because of what each process actually printed',
  staleMsg !== brokenMsg && staleMsg.includes('pin says') && !brokenMsg.includes('pin says'),
  'this is the property Argus\'s WORK-fire §3 named as missing: before this fix, both of these would ' +
  'have printed as "summary line NOT FOUND — <tail>" and a reader could not tell them apart without ' +
  're-driving the probe by hand');

check('D4', 'the two processes really did exit differently — this is not a fixture asserting its own premise',
  stale.code === 0 && broken.code === 1,
  `stale exit ${stale.code}, broken exit ${broken.code}`);

measure('D5', 'diagnosisLine on the broken fixture, for readers who want the raw recovered line',
  diagnosisLine(broken.out));

// ── arm E: classify's verdict does not move — diagnostic text only ──────────────────────────────

console.log('\n── arm E: classify itself is untouched — this patch changes what is PRINTED, not what is GRADED ──');

check('E1', 'the stale-pin process still classifies RED (a different count is not the pinned one, however clean the process was)',
  classify(stale.code, stale.out, EXPECT).state === 'RED',
  `state = ${classify(stale.code, stale.out, EXPECT).state}. pinDiagnosis makes the RED\'s PRINTED ` +
  'reason more specific; it does not make the RED go away, and it must not — a pin that has drifted ' +
  'still needs a human to bump it or decide the probe regressed.');

check('E2', 'the broken process still classifies RED, same as before this patch existed',
  classify(broken.code, broken.out, EXPECT).state === 'RED',
  `state = ${classify(broken.code, broken.out, EXPECT).state}`);

// ── arm Z ─────────────────────────────────────────────────────────────────────────────────────

console.log('\n── arm Z: this run changed nothing under scripts/ or packages/ ──');

const zAfter = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zMoved = Z_PATHSPECS.filter((_, i) => zAfter[i] !== zBefore[i]);
check('Z1', 'no file under scripts/ or packages/ was changed BY THIS RUN — a before/after content fingerprint',
  zMoved.length === 0,
  zMoved.length === 0
    ? `fingerprints identical across the whole run for ${Z_PATHSPECS.join(' and ')}; every write went to ${SCRATCH.replace(process.cwd(), '.')}`
    : `MOVED: ${zMoved.join(', ')}\n        before: ${zBefore.join(' || ')}\n        after:  ${zAfter.join(' || ')}`);
measure('Z2', 'state of the window when this run opened — reported, NOT graded',
  zWindowAtOpen.join('\n        '));
check('Z3', 'the fixtures are under gitignored .testdata/ and nowhere else',
  existsSync(SCRATCH) && SCRATCH.includes('.testdata'),
  `fixtures at ${SCRATCH.replace(process.cwd(), '.')}`);

console.log('');
console.log(`${fail === 0 ? `All ${pass} regression checks passed` : `FAILED — ${fail} of ${pass + fail}`}, ${meas.length} measurements, 0 skips`);
process.exit(fail === 0 ? 0 : 1);
