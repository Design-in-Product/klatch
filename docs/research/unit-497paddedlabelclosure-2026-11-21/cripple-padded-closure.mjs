#!/usr/bin/env node
/**
 * unit-497paddedlabelclosure — cripple, against the WHOLE real gate rather than a sliced body.
 *
 * The arm proved the widened key refuses padded plants inside a sliced `publish()`. This file asks
 * the different question: does the LANDED gate refuse them, end to end, and is the refusal coming
 * from assertion (c) rather than from anything else the gate does?
 *
 * Every arm runs a scratch copy of the gate at `scripts/` depth (a copy at any other depth refuses
 * every cell for reasons that have nothing to do with the plant) and the copy is deleted per arm.
 * `drive0` is an identity copy with no plant at all, asserted byte-identical in stdout to the real
 * gate — if that arm is not green, no other arm's verdict means anything.
 *
 * brace-slicer-deliberate: none. No slicer is hand-rolled here.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = resolve(ROOT, 'scripts/scratch-unit497-cripple.mjs');

const src = readFileSync(GATE, 'utf8');
const ANCHOR = "emit('verify-decl-body-slicers — brace-balance body slicers in the TRACKED tree');";
if (src.split(ANCHOR).length - 1 !== 1) throw new Error('cripple: plant anchor is not unique');
const WIDE_KEY = 'LABELS.find((v) => line.trimEnd().endsWith(v))';
const NARROW_KEY = 'LABELS.find((v) => line.endsWith(v))';
if (src.split(WIDE_KEY).length - 1 !== 1) throw new Error('cripple: the widened key is not in the gate exactly once');

const plant = (text) => src.replace(ANCHOR, `${ANCHOR}\n  emit(${JSON.stringify(text)});`);
const narrow = (s) => {
  const out = s.replace(WIDE_KEY, NARROW_KEY);
  if (out === s) throw new Error('cripple: could not revert the key');
  return out;
};
const disable = (s) => {
  const out = s.replace(WIDE_KEY, 'undefined');
  if (out === s) throw new Error('cripple: could not disable the key');
  return out;
};

function run(text) {
  writeFileSync(SCRATCH, text);
  try {
    const r = spawnSync(process.execPath, [SCRATCH], { encoding: 'buffer', cwd: ROOT });
    return { rc: r.status, stdout: r.stdout, stderr: r.stderr };
  } finally {
    rmSync(SCRATCH, { force: true });
  }
}

const real = spawnSync(process.execPath, [GATE], { encoding: 'buffer', cwd: ROOT });

const ARMS = [
  ['drive0-identity-no-plant', src, 'publishes', 'identity copy at the right depth, no plant'],
  ['padded-one-space', plant('  x  GUARDED '), 'refuses', 'the whole point: one trailing space'],
  ['padded-two-spaces', plant('  x  GUARDED  '), 'refuses', 'more than one'],
  ['padded-tab', plant('  x  GUARDED\t'), 'refuses', 'a tab, not a space'],
  ['bare-label', plant('  x  GUARDED'), 'refuses', 'the reach the narrow key already had'],
  ['C0-padded-narrow-key', narrow(plant('  x  GUARDED ')), 'publishes', 'CONTROL: same plant, key reverted'],
  ['C0b-padded-key-disabled', disable(plant('  x  GUARDED ')), 'publishes', 'CONTROL: assertion dead'],
  ['control-quoted-token', plant('  x  `GUARDED`'), 'publishes', 'no over-refusal on the cure form'],
  ['control-absent-terminal', plant('  x  → now ABSENT'), 'publishes', 'ABSENT is not in LABELS, hole unchanged'],
];

console.log('unit-497paddedlabelclosure — cripple, 9 arms against the whole landed gate');
console.log(`  real gate: rc=${real.status}  stdout ${real.stdout.length} B  stderr ${real.stderr.length} B`);
console.log('');
let pass = 0;
const results = [];
for (const [name, text, expect, why] of ARMS) {
  const r = run(text);
  const got = r.rc === 2 ? 'refuses' : r.rc === 0 ? 'publishes' : `rc=${r.rc}`;
  const ok = got === expect;
  if (ok) pass += 1;
  results.push({ name, expect, got, ok });
  const extra = name === 'drive0-identity-no-plant'
    ? `  stdout byte-identical to real gate: ${Buffer.compare(r.stdout, real.stdout) === 0}`
    : '';
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(26)} expected ${expect.padEnd(10)} got ${got.padEnd(10)} — ${why}${extra}`);
}
const drive0 = run(src);
const identical = Buffer.compare(drive0.stdout, real.stdout) === 0;
console.log('');
console.log(`  depth arm: identity copy stdout byte-identical to the real gate = ${identical}`);
console.log('');
console.log(`CRIPPLE ${pass === ARMS.length && identical ? 'OK' : 'ATTENTION'} — ${pass} of ${ARMS.length}:`
  + ' the widened key refuses every padded spelling end to end, both controls show the refusal is'
  + ' assertion (c) and not the gate\'s other work, and neither cure form is over-refused.');
