#!/usr/bin/env node
/**
 * drive-cripples.mjs — drives each DECLARED cripple of grade-the-denial-model.mjs and
 * records its own .out/.err pair. Separate from the grader so the grader's own recordings
 * are never written by the thing it grades.
 *
 * Grades on the RED MEMBER LIST against the hand map pre-registered in `predicted.md`, not
 * on the verdict: a cripple that reddens a leg other than the one it aims at reads as a
 * working cripple if you only check that something went red. `fp-safe-key` is predicted to
 * separate by turning a leg GREEN, which a verdict-level check cannot score at all.
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CELL = join(HERE, 'grade-the-denial-model.mjs');

// Hand map, transcribed from predicted.md which is committed at f5bc7253, BEFORE the grader
// existed. Not re-derived from any drive.
const HAND = {
  'no-denial-filter': { drive: 4, red: ['G1', 'G2'] },
  'fp-safe-key': { drive: 5, red: [] },
  'xcheck-wrong-figure': { drive: 6, red: ['G2'] },
  'hand-map-widened': { drive: 7, red: ['G3', 'G7'] },
  'control-off': { drive: 8, red: ['G4', 'G4c'] },
};

function sameMembers(a, b) {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((v, i) => v === y[i]);
}

let separating = 0;
let matched = 0;
const results = [];

for (const [name, spec] of Object.entries(HAND)) {
  const r = spawnSync(process.execPath, [CELL], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    env: { ...process.env, CRIPPLE: name },
  });
  const base = join(HERE, `drive${spec.drive}.cripple-${name}`);
  writeFileSync(`${base}.out`, r.stdout ?? '');
  writeFileSync(`${base}.err`, r.stderr ?? '');

  const v = /^VERDICT\/(\d+) (\w+) legs=(\d+) red=\[([^\]]*)\] refused=\[([^\]]*)\]/m.exec(
    r.stdout ?? ''
  );
  if (!v) {
    // A cell that reached no verdict line is UNRUNNABLE, which is its own finding and must
    // not be scored as a cripple that failed to separate.
    results.push({ name, actual: null, note: 'NO VERDICT LINE — unrunnable under this cripple' });
    continue;
  }
  const actual = v[4] ? v[4].split(',') : [];
  const token = Number(v[1]);
  const status = r.status;
  const sep = !sameMembers(actual, ['G4']); // the clean arm's red set
  const asPredicted = sameMembers(actual, spec.red);
  if (sep) separating++;
  if (asPredicted) matched++;
  results.push({ name, actual, predicted: spec.red, sep, asPredicted, token, status });
}

console.log(`cripple grading — ${Object.keys(HAND).length} declared, clean arm red=[G4]\n`);
for (const x of results) {
  if (x.actual === null) {
    console.log(`  UNRUNNABLE  ${x.name.padEnd(20)} ${x.note}`);
    continue;
  }
  console.log(
    `  ${x.asPredicted ? 'MAP-OK ' : 'MAP-OFF'}  ${x.name.padEnd(20)} actualRed=[${x.actual.join(',')}] predicted=[${x.predicted.join(',')}] separates=${x.sep} token=${x.token} exit=${x.status}`
  );
}
const exitHonest = results.every(
  (x) => x.actual === null || x.token === x.status
);
console.log(
  `\nCRIPPLE SUMMARY maps=${matched}/${Object.keys(HAND).length} separating=${separating}/${Object.keys(HAND).length} exitMatchesToken=${exitHonest}`
);
const ok = matched === Object.keys(HAND).length && exitHonest && results.every((x) => x.actual !== null);
console.log(`VERDICT/${ok ? 0 : 1} ${ok ? 'GREEN' : 'RED'} every declared cripple ran, matched its pre-registered member list, and printed a token equal to its exit status`);
process.exit(ok ? 0 : 1);
