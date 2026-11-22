/**
 * unit-501redbranchpin — declared POST-HOC.
 *
 * Written after the arm drove, to read the instrument rather than to explain my leg's result —
 * which is the exact failure Daedalus recorded against himself in `unit-500` §2 ("the post-hoc
 * inherited the predicate's blindness"). So this reads the CAPTURES on disk, both streams, and
 * reports the lines rather than re-deriving a verdict.
 *
 * It exists because P4 came back FALSE in a way I did not register: `d3` (two plants) and `d1` (one
 * plant) have **identical stdout byte counts and different stdout bytes.** This names the moved
 * lines.
 *
 * Reads captures only. Drives nothing. Writes nothing outside this unit's directory.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CAP = (n) => readFileSync(resolve(HERE, 'captures', n), 'utf8');

const d1o = CAP('d1-red-plant-a.out').split('\n');
const d3o = CAP('d3-red-both-plants.out').split('\n');
const d0o = CAP('d0-green-baseline.out').split('\n');
const d1e = CAP('d1-red-plant-a.err');
const d3e = CAP('d3-red-both-plants.err');

const report = [];
const say = (s) => { report.push(s); console.log(s); };

say('# unit-501 post-hoc — which lines move, and on which stream');
say('');
say('## 1. One plant vs two: identical stdout LENGTH, different stdout BYTES');
say('');
say(`d1 stdout ${Buffer.byteLength(CAP('d1-red-plant-a.out'))}B · d3 stdout ${Buffer.byteLength(CAP('d3-red-both-plants.out'))}B`);
say(`line counts ${d1o.length - 1} vs ${d3o.length - 1}`);
say('');
const moved = [];
for (let i = 0; i < Math.max(d1o.length, d3o.length); i += 1) {
  if (d1o[i] !== d3o[i]) moved.push([i + 1, d1o[i], d3o[i]]);
}
say(`differing stdout lines: ${moved.length}`);
for (const [n, a, b] of moved) {
  say(`  L${n}`);
  say(`    one plant : ${JSON.stringify(a)}`);
  say(`    two plants: ${JSON.stringify(b)}`);
  say(`    byte lengths: ${Buffer.byteLength(a ?? '')} vs ${Buffer.byteLength(b ?? '')}`);
}
const widthsHold = moved.every(([, a, b]) => Buffer.byteLength(a ?? '') === Buffer.byteLength(b ?? ''));
say('');
say(`every moved line keeps its byte length: ${widthsHold}`);
say(`  -> the 3935 figure survives a change in the number of reported defects ONLY because every`);
say('     figure that moved kept its digit count. This is the same coincidence that has protected');
say('     4160 across four units, and it is the first time it hides a CONTENT change rather than');
say('     merely surviving one.');

say('');
say('## 2. Green vs red on stdout: which lines the red state DROPS');
say('');
const d0set = d0o.length;
say(`green ${d0set - 1} lines · red ${d1o.length - 1} lines`);
const dropped = [];
for (let i = 0; i < Math.max(d0o.length, d1o.length); i += 1) {
  if (d0o[i] !== d1o[i]) dropped.push([i + 1, d0o[i], d1o[i]]);
}
say(`differing lines between green and red stdout: ${dropped.length}`);
for (const [n, a, b] of dropped.slice(0, 8)) {
  say(`  L${n}`);
  say(`    green: ${JSON.stringify(a)}`);
  say(`    red  : ${JSON.stringify(b)}`);
}

say('');
say('## 3. The red stderr in full, for the record — never captured by anyone before 11-22');
say('');
say(`one plant : ${Buffer.byteLength(d1e)}B · ${d1e.replace(/\n$/, '').split('\n').length} lines`);
say(`two plants: ${Buffer.byteLength(d3e)}B · ${d3e.replace(/\n$/, '').split('\n').length} lines`);
say('');
say('```');
for (const l of d1e.replace(/\n$/, '').split('\n')) say(l);
say('```');

say('');
say('## 4. What each stream carries, keyed on content rather than on bytes');
say('');
const FIG = [
  ['tracked files read', /tracked files read:\s*(\d+)/],
  ['population', /population \(compares against both braces\):\s*(\d+)/],
  ['MARKED', /MARKED\s+(\d+)/],
  ['UNGUARDED', /UNGUARDED\s+(\d+)/],
  ['baseline entries', /baseline entries:\s*(\d+)/],
];
for (const [name, re] of FIG) {
  const inOut = re.exec(CAP('d1-red-plant-a.out'));
  const inErr = re.exec(d1e);
  say(`  ${name.padEnd(20)} stdout: ${inOut ? inOut[1] : 'ABSENT'}   stderr: ${inErr ? inErr[1] : 'ABSENT'}`);
}
say('');
say(`  plant path          stdout: ${CAP('d1-red-plant-a.out').includes('plant-a.mjs') ? 'PRESENT' : 'ABSENT'}   `
  + `stderr: ${d1e.includes('plant-a.mjs') ? 'PRESENT' : 'ABSENT'}`);
say(`  announced count     stdout: ${/RED — \d+ new/.test(CAP('d1-red-plant-a.out')) ? 'PRESENT' : 'ABSENT'}   `
  + `stderr: ${/RED — \d+ new/.test(d1e) ? 'PRESENT' : 'ABSENT'}`);
say('');
say('Every tree-keyed figure is on stdout and nowhere else. Every defect-keyed fact is on stderr and');
say('nowhere else. The two streams are not two views of one report; they are a tree report and a');
say('defect report, and a byte pin cannot mean the same thing on both.');

writeFileSync(resolve(HERE, 'captures', 'posthoc-which-lines-move.out'), `${report.join('\n')}\n`);
