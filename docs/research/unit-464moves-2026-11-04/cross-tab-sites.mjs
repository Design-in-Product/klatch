#!/usr/bin/env node
// unit-464moves — cross-tab-sites.mjs
//
// DECLARED POST-HOC, and that declaration is the first thing in the output. This is NOT a
// pre-registered prediction: I formed the impression while hand-reading HAND-SITES.tsv, so no
// prediction about it could have been honest. It is a derivation from a table already committed
// (HAND-SITES.tsv, filed in its own commit before the drive that graded P6HAND), computed here
// rather than counted by eye, and it is reported as a [MEAS] with no leg and no verdict.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UNIT = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(UNIT, 'HAND-SITES.tsv'), 'utf8').split('\n')
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.split('\t'))
  .filter((r) => r[0] !== 'site_id');

console.log('POST-HOC. Derived from HAND-SITES.tsv; not pre-registered, and not graded. No leg, no verdict.');
console.log('');
console.log(`rows: ${rows.length}`);
console.log('');

const CLASSES = ['R', 'A', 'O', 'W'];
const cell = (names, cls) => rows.filter((r) => r[1].trim() === names && r[2].trim() === cls);

console.log('            names a consumption site');
console.log('class          yes      no    total');
for (const c of CLASSES) {
  const y = cell('yes', c).length; const n = cell('no', c).length;
  if (y + n === 0) { console.log(`  ${c}            ${String(y).padStart(4)}    ${String(n).padStart(4)}     ${String(y + n).padStart(4)}   (empty cell — nothing in this class on this corpus)`); continue; }
  console.log(`  ${c}            ${String(y).padStart(4)}    ${String(n).padStart(4)}     ${String(y + n).padStart(4)}`);
}
const yTot = rows.filter((r) => r[1].trim() === 'yes').length;
const nTot = rows.filter((r) => r[1].trim() === 'no').length;
console.log(`  total        ${String(yTot).padStart(4)}    ${String(nTot).padStart(4)}     ${String(rows.length).padStart(4)}`);
console.log('');

// The off-diagonal, by name. The cells that do NOT fit the pattern are the only ones worth printing
// individually: following only the rows that fit would be following the pattern rather than testing it.
const offA = cell('yes', 'A');
const offR = cell('no', 'R');
const offO = rows.filter((r) => r[2].trim() === 'O');
console.log('off-pattern rows, named (the pattern being: names-a-consumer <-> class R):');
console.log(`  class R with NO consumer named (${offR.length}):`);
for (const r of offR) console.log(`    ${r[0]}  <- ${r[3]}`);
console.log(`  class A WITH a consumer named (${offA.length}):`);
for (const r of offA) console.log(`    ${r[0]}  <- ${r[3]}`);
console.log(`  class O rows at all (${offO.length}), which the two-way pattern has no cell for:`);
for (const r of offO) console.log(`    ${r[0]}  [names=${r[1]}]  <- ${r[3]}`);
console.log('');

const flagArgued = rows.filter((r) => r[3].includes("call's own shape"));
const flagArguedA = flagArgued.filter((r) => r[2].trim() === 'A');
console.log(`rows whose reason rests on the CALL'S OWN SHAPE (the key v1.8 2.1j declares known-wrong): ${flagArgued.length}`);
console.log(`  of those, classed A: ${flagArguedA.length} of ${rows.filter((r) => r[2].trim() === 'A').length} A rows`);
console.log('  NOT a claim that those classes are wrong. It is a claim that their REASONS are keyed on');
console.log('  the flag rather than on consumption, so re-reading them at their consumption sites is');
console.log('  unmeasured work, not a correction. One of them has already flipped under that reading');
console.log('  (unit-464t2-population, by his P8MOVED and my drive1) and the rest have not been read.');
