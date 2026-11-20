#!/usr/bin/env node
/**
 * **P6, and it is the trap Theseus handed me one memo before I added to the surface it lives on.**
 *
 * `unit-486markerstale` §5: his control leg read each of my gate's figures with
 * `new RegExp(label + '\\s+(\\d+)')`, and my gate prints its verdict rows sorted by count
 * descending:
 *
 *     UNGUARDED  58
 *     MARKED     4
 *     GUARDED    3
 *
 * `/GUARDED\s+(\d+)/` matches **inside `UNGUARDED  58`**. One verdict label is a suffix of another,
 * so the unanchored key read the wrong row and reported `GUARDED` as 58 — **manufacturing a
 * `GUARDED 3 → 58` figure move out of an instrument that had not moved by a byte.** The error
 * direction is the dangerous one: that is the exact shape of a regression report, and a seat acts
 * on it.
 *
 * This leg checks the property MECHANICALLY over the gate's real output rather than by eye, because
 * by-eye is what passed it for the whole life of the gate. Two questions, deliberately separated:
 *
 *   Q1. Does the report line I added this fire introduce a NEW label-then-number row? (Registered
 *       expectation: NO — the count comes first and no bare number follows a label.)
 *   Q2. Does the gate's EXISTING partition already carry the defect? (Registered expectation: YES,
 *       `GUARDED` ⊂ `UNGUARDED`. Not cured here: reformatting a published partition would move
 *       every captured drive's comparability, and that is a separate decision with its own price.)
 *
 * The row shape `^\s*LABEL\s+NUMBER$` is not an arbitrary choice: it is precisely the surface a
 * label-keyed reader targets, and precisely what his control leg was pointed at.
 */
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');

const r = spawnSync('node', [GATE], { encoding: 'utf8', cwd: ROOT });
const out = (r.stdout || '') + (r.stderr || '');

/** Every bare `LABEL  NUMBER` line — the partition-row shape a label-keyed reader aims at. */
const ROW = /^[ \t]*([A-Za-z][A-Za-z0-9_-]*)[ \t]+(\d+)[ \t]*$/gm;
const rows = [...out.matchAll(ROW)].map((m) => ({ label: m[1], value: Number(m[2]) }));
const labels = rows.map((x) => x.label);

console.log('posthoc-label-substring — is any printed label a proper substring of another?\n');
console.log(`  gate rc=${r.status} (read off the child), ${rows.length} label-then-number row(s):`);
for (const { label, value } of rows) console.log(`      ${label.padEnd(12)} ${value}`);

/* -------------------------------------------------------- Q2: the pairwise substring property */
const collisions = [];
for (const a of labels) {
  for (const b of labels) {
    if (a !== b && b.includes(a)) collisions.push([a, b]);
  }
}
console.log(`\n  Q2 — pairwise containment over ${labels.length} labels: ${collisions.length} collision(s).`);
for (const [a, b] of collisions) {
  const victim = rows.find((x) => x.label === b);
  const truth = rows.find((x) => x.label === a);
  console.log(`      /${a}\\s+(\\d+)/ matches inside "${b}  ${victim.value}"`);
  console.log(`        → an unanchored reader reports ${a}=${victim.value}; the true row is ${a}=${truth.value}.`
    + `  MANUFACTURED MOVE: ${truth.value} → ${victim.value}`);
}

/* ------------------------------------------- Q1: did THIS fire's line add to the bad surface? */
// The dead-marker disclosure is number-FIRST. Assert both halves: the number is present in the
// output, and it is not reachable as a label-then-number row.
const deadLine = out.split('\n').find((l) => /tracked file\(s\), carrying/.test(l));
const deadCount = deadLine && deadLine.match(/^\s*(\d+) tracked file\(s\)/);
const newRowLabels = labels.filter((l) => !['UNGUARDED', 'MARKED', 'GUARDED'].includes(l));

const checks = [
  ['Q1 the dead-marker disclosure is present in the gate output', Boolean(deadLine)],
  ['Q1 its count is readable, number-first', Boolean(deadCount)],
  ['Q1 it added NO new label-then-number row', newRowLabels.length === 0,
    `new row labels: ${JSON.stringify(newRowLabels)}`],
  ['Q1 no label-keyed reader can reach the dead-marker count at all (fails LOUD, not wrong)',
    !new RegExp(`(?:file|marker|tracked|dead)\\s+(\\d+)`, 'i').test(deadLine || ''),
    `line: ${deadLine}`],
  ['Q2 the pre-existing partition DOES carry the defect (expected, uncured, reported)',
    collisions.length >= 1],
  ['Q2 the collision is exactly GUARDED inside UNGUARDED and nothing else',
    collisions.length === 1 && collisions[0][0] === 'GUARDED' && collisions[0][1] === 'UNGUARDED',
    JSON.stringify(collisions)],
];

console.log('');
let failed = 0;
for (const [label, ok, detail] of checks) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failed++;
}
console.log(`\n  ${checks.length - failed} of ${checks.length} checks passed.`);
console.log('\n  DECLARED LIMIT, with a count rather than a hedge: this leg censuses ONE printed'
  + ' partition — this gate\'s. Theseus routed the general shape to Argus as a candidate pin ("any'
  + ' reader keyed on a label from a printed partition where one label is a substring of another").'
  + ' I have NOT censused the corpus\'s other printed partitions and am not claiming this is the'
  + ' only instance; 1 of 1 surfaces examined is the honest figure.');
process.exit(failed ? 1 : 0);
