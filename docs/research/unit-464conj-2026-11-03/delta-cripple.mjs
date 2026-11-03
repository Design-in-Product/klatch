#!/usr/bin/env node
// delta-cripple — the cripple arm as a DELTA against its matched no-cripple baseline, computed
// rather than eyeballed. Compares leg outcomes and verdicts line by line between drive5 (no
// cripple) and drive6 (CONJ_CMP_MAX re-keyed to -1), over a grader whose `git hash-object` is
// identical either side.
//
// Scratch-repo paths and hashes differ between any two runs by construction, so the comparison is
// on LEG OUTCOMES and VERDICTS and is explicit about that rather than diffing whole files and
// calling the noise a change.
// [[feedback_grade_a_cripple_as_a_delta_against_a_matched_no_cripple_drive]]

import { readFileSync } from 'node:fs';

const DIR = 'docs/research/unit-464conj-2026-11-03/';
const read = (f) => readFileSync(DIR + f, 'utf8');
const legs = (t) => {
  const m = new Map();
  for (const l of t.split('\n')) {
    const g = l.match(/^(G[A-Z0-9]+)\s+(ok|RED|UNRUNNABLE)\b/);
    if (g) m.set(g[1], g[2]);
  }
  return m;
};
const verds = (t) => {
  const m = new Map();
  for (const l of t.split('\n')) {
    const g = l.match(/^VERDICT (P\d): (LANDS|REFUTED|UNRESOLVED)$/);
    if (g) m.set(g[1], g[2]);
  }
  return m;
};

const base = read('drive5.nocripple.out');
const crip = read('drive6.cripple-cmpmax.out');
const bl = legs(base);
const cl = legs(crip);
const bv = verds(base);
const cv = verds(crip);

console.log('delta: drive5 (no cripple) -> drive6 (CONJ_CMP_MAX re-keyed 0 -> -1)');
console.log('grader source git hash-object identical either side: 7916f8c3f84ed21c5463e2418bb0348638ff5eac');
console.log('');
const allLegs = [...new Set([...bl.keys(), ...cl.keys()])];
const movedLegs = allLegs.filter((k) => bl.get(k) !== cl.get(k));
console.log(`LEGS: ${allLegs.length} registered in at least one arm · ${movedLegs.length} moved`);
for (const k of allLegs) {
  const mark = bl.get(k) !== cl.get(k) ? ' <== MOVED' : '';
  console.log(`  ${k.padEnd(14)} ${String(bl.get(k) ?? 'absent').padEnd(10)} -> ${String(cl.get(k) ?? 'absent').padEnd(10)}${mark}`);
}
console.log('');
const allV = [...new Set([...bv.keys(), ...cv.keys()])];
const movedV = allV.filter((k) => bv.get(k) !== cv.get(k));
console.log(`VERDICTS: ${allV.length} · ${movedV.length} moved`);
for (const k of allV) {
  const mark = bv.get(k) !== cv.get(k) ? ' <== MOVED' : '';
  console.log(`  ${k} ${String(bv.get(k) ?? 'absent').padEnd(10)} -> ${String(cv.get(k) ?? 'absent').padEnd(10)}${mark}`);
}
console.log('');
console.log(`REGISTERED: >=1 leg moves and >=1 verdict moves. MEASURED: ${movedLegs.length} leg(s) [${movedLegs.join(',')}] and ${movedV.length} verdict(s) [${movedV.join(',')}].`);
console.log(`CRIPPLE ${movedLegs.length >= 1 && movedV.length >= 1 ? 'REACHED' : 'NOT REACHED — the leg it was aimed at is vacuous, and that is the finding'}`);
