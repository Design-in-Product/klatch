#!/usr/bin/env node
// unit-493 arm: grade P4/P5/P6 — does `\s+` cross a newline in the LABEL direction too,
// and if so is my gate's twice-asserted "returns NOTHING rather than the wrong row"
// false, or merely over-reaching?
//
// Subject: a FRESH capture of `scripts/verify-decl-body-slicers.mjs` stdout, taken by
// this arm, not a stored one. Readers applied to the whole published text, because that
// is what a reader in this corpus is actually pointed at — every captured literal in the
// tree reads a drive's stdout, not a hand-selected region of it.
//
// Keys, declared:
//   LABEL-KEYED   /LABEL\s+(\d+)/g   — the shape the docblock's claim is about
//   COUNT-KEYED   /(\d+)\s+LABEL/g   — the shape unit-491 §2 measured at 3
//   CROSSING      the matched span contains a newline, so label and digit are on
//                 different lines and the reader reports a figure it never looked at
//   NUMBER-FIRST  a line whose first non-whitespace character is a digit (the report
//                 lines the docblock's sentence is actually about)

import { execFileSync } from 'node:child_process';

const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];

let out;
try {
  out = execFileSync('node', ['scripts/verify-decl-body-slicers.mjs'], { encoding: 'utf8' });
} catch (e) {
  // rc!=0 still publishes stdout, and a gate that reddens must still be gradeable here.
  out = e.stdout ?? '';
  console.log(`(gate exited non-zero; stdout captured anyway, ${out.length} bytes)`);
}

const lines = out.split('\n');
const lineStarts = [];
{
  let acc = 0;
  for (const l of lines) { lineStarts.push(acc); acc += l.length + 1; }
}
const lineOf = (idx) => {
  let lo = 0, hi = lineStarts.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= idx) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
};
const isNumberFirst = (n) => /^\s*\d/.test(lines[n] ?? '');

const rows = [];
for (const L of LABELS) {
  for (const [kind, re] of [
    ['LABEL-KEYED', new RegExp(`${L}\\s+(\\d+)`, 'g')],
    ['COUNT-KEYED', new RegExp(`(\\d+)\\s+${L}`, 'g')],
  ]) {
    let m;
    while ((m = re.exec(out)) !== null) {
      const span = m[0];
      const crossing = span.includes('\n');
      const digitIdx = kind === 'LABEL-KEYED'
        ? m.index + span.lastIndexOf(m[1])
        : m.index + span.indexOf(m[1]);
      const labelIdx = kind === 'LABEL-KEYED' ? m.index : m.index + span.indexOf(L);
      rows.push({
        label: L, kind, value: m[1], crossing,
        labelLine: lineOf(labelIdx) + 1,
        digitLine: lineOf(digitIdx) + 1,
        digitOnNumberFirstLine: isNumberFirst(lineOf(digitIdx)),
        firstOnly: false,
      });
    }
  }
}

// A reader in this corpus is almost always `.match(re)` / a single capture — first match
// wins. Mark the first match of each (label, kind) pair, because that is the value a real
// reader actually returns, and a crossing match that no reader reaches is not a defect.
const firstSeen = new Set();
for (const r of rows) {
  const k = `${r.label}:${r.kind}`;
  if (!firstSeen.has(k)) { firstSeen.add(k); r.firstOnly = true; }
}

console.log('=== unit-493 arm: crossing readers over the gate\'s published output ===');
console.log(`captured stdout: ${out.length} bytes, ${lines.length} lines`);
console.log('');
console.log('ALL matches (first-match rows marked *, which is what a real reader returns):');
for (const r of rows) {
  console.log(
    `  ${r.firstOnly ? '*' : ' '} ${r.kind}  ${r.label.padEnd(10)} -> ${String(r.value).padStart(4)}`
    + `   labelLine=${String(r.labelLine).padStart(3)} digitLine=${String(r.digitLine).padStart(3)}`
    + `   crossing=${r.crossing ? 'YES' : 'no '}  digitOnNumberFirstLine=${r.digitOnNumberFirstLine}`
  );
}

const crossing = rows.filter((r) => r.crossing);
const crossingFirst = crossing.filter((r) => r.firstOnly);
const labelCrossing = crossing.filter((r) => r.kind === 'LABEL-KEYED');
const labelCrossingFirst = labelCrossing.filter((r) => r.firstOnly);
const crossingOntoReport = crossing.filter((r) => r.digitOnNumberFirstLine);

console.log('');
console.log('--- grades ---');
console.log(`P4  any crossing match at all                     : ${crossing.length > 0 ? 'HIT' : 'REFUTED'}`
  + `  (${crossing.length} crossing of ${rows.length} matches; ${crossingFirst.length} of them first-match)`);
console.log(`P5  a LABEL-KEYED reader returns a wrong-line digit: ${labelCrossing.length > 0 ? 'HIT' : 'REFUTED'}`
  + `  (${labelCrossing.length} crossing label-keyed matches; ${labelCrossingFirst.length} reachable as first match)`);
console.log(`P6  no crossing match lands on a number-first line : ${crossingOntoReport.length === 0 ? 'HIT' : 'REFUTED'}`
  + `  (${crossingOntoReport.length} crossing matches whose digit is on a number-first report line)`);

console.log('');
console.log('number-first lines in the published output (the lines the docblock claim is about):');
for (let i = 0; i < lines.length; i += 1) {
  if (isNumberFirst(i)) console.log(`  line ${String(i + 1).padStart(3)}: ${lines[i].slice(0, 96)}`);
}

console.log('');
console.log('lines whose LAST token is a bare verdict label (the adjacency P4 needs):');
for (let i = 0; i < lines.length; i += 1) {
  const t = (lines[i] ?? '').trimEnd();
  if (LABELS.some((L) => t.endsWith(L))) console.log(`  line ${String(i + 1).padStart(3)}: ${t.slice(-96)}`);
}
