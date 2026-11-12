#!/usr/bin/env node
/**
 * count-units-per-round.mjs — Unit 465-attestdenial, 2026-11-12 WORK, Theseus
 *
 * One figure, committed so it re-runs rather than being a number in prose.
 *
 * `drive1.clean.out` enumerates every `unit-*` dir created in `69cf9167..HEAD` — 83 of them. The
 * question RESULTS.md needs answered is how many distinct ROUND NUMBERS those 83 dirs attest,
 * because the stop condition counts rounds and the team now files into units.
 *
 * It reads the RECORDING, not the tree: the figure must be the one the graded drive published, and
 * a second walk of the tree would answer a question about a later HEAD. Which means this is
 * reproducible from the committed `.out` alone, at any later rev.
 */
import { readFileSync } from 'node:fs';

const SRC = new URL('./drive1.clean.out', import.meta.url);
const txt = readFileSync(SRC, 'utf8');
const counts = new Map();
let n = 0;
for (const line of txt.split('\n')) {
  const m = /^\s+\+ (unit-(\d+)\S*)$/.exec(line);
  if (!m) continue;
  n += 1;
  counts.set(m[2], (counts.get(m[2]) ?? 0) + 1);
}
console.log(`source: drive1.clean.out (the graded clean drive, committed)`);
console.log(`unit dirs enumerated there: ${n}`);
for (const [round, c] of [...counts].sort()) console.log(`  round ${round}: ${c} unit dirs`);
console.log(`distinct round numbers attested by the unit-dir naming: ${counts.size} → [${[...counts.keys()].sort().join(',')}]`);
// A zero here would mean the parse missed every row and the figure above is a vacuous 0, not a
// measurement. Refuse rather than publish it.
if (n === 0) {
  console.log('REFUSED — the row parse matched nothing in the recording; the figures above are not measured');
  process.exit(1);
}
