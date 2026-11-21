// unit-494lineendingreach — POST-HOC probe 2, written after `posthoc-plant-position.mjs` refuted
// my own expectation (0 of 3 positions moved the figure). Committed before it runs.
//
// WHY the refutation happened, as a hypothesis to drive rather than a conclusion to assert: the
// real `GUARDED  3` row is published at line 6, and every line whose first token is a bare count
// sits at 10, 31 and 35 — all BELOW it. A first-match reader reaches the true row before any plant
// below it, so the plant cannot win. That makes the label direction closed by a CONJUNCTION:
//
//   (i)  no published line ends with a bare verdict label, AND
//   (ii) no count-leading line sits ABOVE the real row, so even a planted ending has no digit to
//        fuse onto before the true match is reached.
//
//   EXPECTATION (stated before driving): forcing BOTH conjuncts false moves the figure. A
//   label-ending line followed immediately by a count-leading line, both planted ABOVE line 6,
//   makes `/GUARDED\s+(\d+)/` return the PLANTED count (777) rather than 3. Each conjunct forced
//   alone leaves it at 3.
//
//   If the both-forced case still reads 3, my account of the refutation is wrong and the direction
//   is closed by something I have not identified — which I would rather find here than assert in
//   a memo.
//
// This is a FORCED class, in the sense `unit-490partitionformat` P8 used: the state the tree is in
// cannot exhibit the case, so the case is constructed in a copy of the capture. R1 holds — the
// gate is read and driven, never edited.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const capture = readFileSync(join(HERE, 'drive1.gate-plain.out'), 'utf8');
const lines = capture.split('\n');
const unanchored = /GUARDED\s+(\d+)/;
const ENDS_IN_LABEL = '  the row below is GUARDED';
const COUNT_LEADING = '  777 tracked file(s) are something this gate does not yet report';

// The insertion point is DERIVED: immediately above the first published line that contains a bare
// verdict label followed by whitespace and digits — i.e. the real row the reader currently finds.
const realRow = lines.findIndex((l) => unanchored.test(l));
const read = (arr) => arr.join('\n').match(unanchored)?.[1] ?? 'null';

const cases = [
  ['CONTROL — untouched capture', lines],
  ['(i) forced alone  — label-ending line only', [...lines.slice(0, realRow), ENDS_IN_LABEL, ...lines.slice(realRow)]],
  ['(ii) forced alone — count-leading line only', [...lines.slice(0, realRow), COUNT_LEADING, ...lines.slice(realRow)]],
  ['BOTH forced       — label-ending line then count-leading line', [...lines.slice(0, realRow), ENDS_IN_LABEL, COUNT_LEADING, ...lines.slice(realRow)]],
  ['BOTH, reversed    — count-leading line then label-ending line', [...lines.slice(0, realRow), COUNT_LEADING, ENDS_IN_LABEL, ...lines.slice(realRow)]],
];

const out = [];
out.push('unit-494lineendingreach — posthoc 2: the label direction is closed by a CONJUNCTION');
out.push('');
out.push(`real row (first line matching /GUARDED\\s+(\\d+)/): line ${realRow + 1} — ${lines[realRow].trim()}`);
out.push(`plants inserted immediately above line ${realRow + 1}`);
out.push('');
const got = {};
for (const [name, arr] of cases) {
  const v = read(arr);
  got[name] = v;
  out.push(`  ${name.padEnd(62)} → ${v}${v === '3' ? '' : '   ← FIGURE MOVED'}`);
  writeFileSync(join(HERE, `conjunction-${name.split(' ')[0].replace(/[^A-Za-z]/g, '') || 'case'}-${v}.out`), arr.join('\n'));
}
out.push('');
const both = got['BOTH forced       — label-ending line then count-leading line'];
const iAlone = got['(i) forced alone  — label-ending line only'];
const iiAlone = got['(ii) forced alone — count-leading line only'];
if (both === '777' && iAlone === '3' && iiAlone === '3') {
  out.push('EXPECTATION HELD. Neither conjunct alone moves the figure; both together move it 3 → 777.');
  out.push('A line-ending guard breaks conjunct (i), which is sufficient — and it is the only one of');
  out.push('the two that a guard can express, since conjunct (ii) is a fact about publication ORDER');
  out.push('that no assertion over the string can state without hard-coding which rows come first.');
} else {
  out.push(`EXPECTATION FAILED — both-forced read ${both}, (i) alone ${iAlone}, (ii) alone ${iiAlone}.`);
  out.push('My account of the earlier refutation does not survive its own test.');
}
console.log(out.join('\n'));
