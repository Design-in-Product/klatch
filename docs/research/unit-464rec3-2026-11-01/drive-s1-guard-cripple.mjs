#!/usr/bin/env node
// unit-464rec3 — C1b, done properly.
//
// The first version of C1b in grade-the-three-cures.mjs was VACUOUS: it asserted that the
// grep's hit list does not contain a 40-zero sha, which is true by construction and exercises
// none of S1's new guard. A printed self-test that gates nothing. Recorded as a defect of this
// unit's own instrument (drive5 holds the vacuous version), and replaced here by an execution.
//
// Both arms are GENERATED from the real cured source by one string substitution — never
// hand-typed — and the substitution is asserted to have changed something, so a no-op edit
// cannot masquerade as a cripple. The cripple perturbs the KEY (which rev is pinned); the
// subject (the instrument's logic) is byte-identical across arms but for that one literal.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const S1 = 'docs/research/round378-instruments/grade-b3-known-positive.mjs';

const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

console.log(`# unit-464rec3 — S1's guard, driven. rev ${git(['rev-parse', 'HEAD']).trim()}`);

const src = readFileSync(join(REPO, S1), 'utf8');
const GOOD = (src.match(/^const CURE = '([0-9a-f]{40})';$/m) ?? [null, null])[1];
if (GOOD === null) {
  console.log('REFUSED: no literal `const CURE = <40 hex>;` in the cured source.');
  process.exit(1);
}
// A real commit, and one the cure's subject phrase cannot possibly name.
const WRONG = git(['rev-list', '--max-parents=0', 'HEAD']).trim().split('\n')[0];
console.log(`[MEAS] GOOD pin  (from source): ${GOOD}`);
console.log(`[MEAS] WRONG pin (repo root):   ${WRONG}`);
if (GOOD === WRONG) {
  console.log('REFUSED: the two arms would be identical; the cripple could not move anything.');
  process.exit(1);
}

const arms = [
  ['CONTROL (pin unchanged)', src, GOOD],
  ['CRIPPLE (pin re-pointed at a real but unnamed commit)', src.split(GOOD).join(WRONG), WRONG],
];

const results = [];
for (const [label, text, expectPin] of arms) {
  // Gate the substitution: a cripple that did not change the file is not a cripple.
  const changed = (label.startsWith('CRIPPLE') ? text !== src : text === src);
  const tmp = join(HERE, `.arm-${label.startsWith('CRIPPLE') ? 'cripple' : 'control'}.mjs`);
  writeFileSync(tmp, text);
  let rc, out;
  try {
    out = execFileSync(process.execPath, [tmp], {
      cwd: REPO, // S1 resolves `scripts` from cwd, so both arms run from the repo root
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    rc = 0;
  } catch (e) {
    rc = e.status ?? 'signal';
    out = (e.stdout ?? '') + (e.stderr ?? '');
  } finally {
    unlinkSync(tmp);
  }
  const threw = /no longer selected by its own subject/.test(out);
  results.push({ label, rc, threw, changed, expectPin });
  console.log(`\n[MEAS] arm: ${label}`);
  console.log(`         substitution gate (arm's text is as intended): ${changed}`);
  console.log(`         exit code: ${rc}`);
  console.log(`         guard message present in output: ${threw}`);
  const first = out.split('\n').find((l) => l.trim().length > 0) ?? '(no output)';
  console.log(`         first output line: ${first.slice(0, 110)}`);
}

const control = results.find((r) => r.label.startsWith('CONTROL'));
const cripple = results.find((r) => r.label.startsWith('CRIPPLE'));
const gatesOk = control.changed && cripple.changed;
console.log(`\n[MEAS] both arms' substitution gates passed: ${gatesOk}`);
console.log(`[MEAS] CONTROL exit ${control.rc}, guard fired: ${control.threw}`);
console.log(`[MEAS] CRIPPLE exit ${cripple.rc}, guard fired: ${cripple.threw}`);
const delta = control.threw === false && cripple.threw === true && control.rc !== cripple.rc;
console.log(
  `\n[C1b] ${gatesOk && delta ? 'GREEN' : 'RED'} — S1's guard is REACHED and DISCRIMINATING: ` +
    `silent under the correct pin, fatal under a real-but-unnamed one. Graded as the delta ` +
    `between two arms that differ in exactly one literal.`,
);
