#!/usr/bin/env node
/**
 * unit-506labelmultiset — P6's check, done the only way that can answer it.
 *
 * All three standing captures in this unit are **4390 B / 44 lines**. That is NOT evidence that
 * nothing moved: this gate's green byte count has been measured useless as a pin in both directions
 * — `4160` held across a tree change in two seats' captures a day apart (`unit-501` §1), and this
 * unit's own `tracked files read` moved `1071 → 1072` with the byte count standing still, because
 * the digit width did not change.
 *
 * So the comparison is by **LINE MULTISET**, and the figures are read **by name**, which is what
 * the docblock's own pin section says to do.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CAP = join(import.meta.dirname, 'captures');
const read = (n) => readFileSync(join(CAP, n), 'utf8');

const STAGES = [
  ['standing-pre', 'at HEAD, before this unit had a single file'],
  ['standing-after-arm', 'arm + pre-registration + captures committed and TRACKED'],
  ['standing-after-docblock', 'after the two docblock landings'],
];

const NAMED = {
  'tracked files read': /tracked files read:\s*(\d+)/,
  population: /population \(compares against both braces\):\s*(\d+)/,
  MARKED: /^\s+MARKED\s+(\d+)\s*$/m,
  GUARDED: /^\s+GUARDED\s+(\d+)\s*$/m,
  UNGUARDED: /^\s+UNGUARDED\s+(\d+)\s*$/m,
  'baseline entries': /baseline entries:\s*(\d+)/,
  'dead marker files': /^\s+(\d+) tracked file\(s\), carrying/m,
  'dead marker occurrences': /carrying (\d+) marker occurrence/,
  'quoted-only': /^\s+(\d+) tracked file\(s\) contain the marker token ONLY/m,
  'in-population quoted-only': /^\s+(\d+) in-population file\(s\) carry/m,
};

const rows = [];
for (const [stem, what] of STAGES) {
  const out = read(`${stem}.out`);
  const err = read(`${stem}.err`);
  const figs = {};
  for (const [k, re] of Object.entries(NAMED)) {
    const m = out.match(re);
    figs[k] = m ? Number(m[1]) : null;
  }
  rows.push({
    stage: stem,
    what,
    outBytes: Buffer.byteLength(out, 'utf8'),
    outLines: out.split('\n').length - (out.endsWith('\n') ? 1 : 0),
    errBytes: Buffer.byteLength(err, 'utf8'),
    figures: figs,
    lines: out.split('\n'),
  });
}

/** Line-multiset difference between two captures, order-insensitive. */
function multisetDiff(a, b) {
  const count = (xs) => xs.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
  const ca = count(a);
  const cb = count(b);
  const only = (x, y) => [...x].flatMap(([l, n]) => {
    const d = n - (y.get(l) || 0);
    return d > 0 ? Array(d).fill(l) : [];
  });
  return { onlyInFirst: only(ca, cb), onlyInSecond: only(cb, ca) };
}

const comparisons = [];
for (let i = 1; i < rows.length; i += 1) {
  const d = multisetDiff(rows[i - 1].lines, rows[i].lines);
  comparisons.push({
    from: rows[i - 1].stage,
    to: rows[i].stage,
    bytesEqual: rows[i - 1].outBytes === rows[i].outBytes,
    linesEqual: rows[i - 1].outLines === rows[i].outLines,
    differingLineCount: d.onlyInFirst.length + d.onlyInSecond.length,
    onlyInFirst: d.onlyInFirst,
    onlyInSecond: d.onlyInSecond,
  });
}

const firstToLast = multisetDiff(rows[0].lines, rows[rows.length - 1].lines);

const flatFigures = Object.keys(NAMED).filter(
  (k) => new Set(rows.map((r) => r.figures[k])).size === 1,
);
const movedFigures = Object.keys(NAMED).filter(
  (k) => new Set(rows.map((r) => r.figures[k])).size > 1,
);

console.log(JSON.stringify({
  stages: rows.map(({ lines, ...rest }) => rest),
  pairwise: comparisons,
  preToPost: {
    bytesEqual: rows[0].outBytes === rows[rows.length - 1].outBytes,
    differingLineCount: firstToLast.onlyInFirst.length + firstToLast.onlyInSecond.length,
    onlyInPre: firstToLast.onlyInFirst,
    onlyInPost: firstToLast.onlyInSecond,
  },
  flatFigures,
  movedFigures,
  verdict: {
    'P6.a  DEAD MARKERS flat at 21 files / 24 occurrences across all three stages':
      rows.every((r) => r.figures['dead marker files'] === 21
        && r.figures['dead marker occurrences'] === 24),
    'P6.b  quoted-only flat at 3 across all three stages':
      rows.every((r) => r.figures['quoted-only'] === 3),
    'P6.c  population flat at 65 and MARKED/GUARDED/UNGUARDED flat at 4/3/58':
      rows.every((r) => r.figures.population === 65 && r.figures.MARKED === 4
        && r.figures.GUARDED === 3 && r.figures.UNGUARDED === 58),
    'P6.d  `tracked files read` is the ONLY named figure that moved':
      movedFigures.length === 1 && movedFigures[0] === 'tracked files read',
    'P6.e  `tracked files read` is the ONLY line that differs, pre to post':
      firstToLast.onlyInFirst.length === 1 && firstToLast.onlyInSecond.length === 1
      && firstToLast.onlyInFirst[0].includes('tracked files read')
      && firstToLast.onlyInSecond[0].includes('tracked files read'),
    'P6.f  stderr is 0 B at every stage — the gate stayed green':
      rows.every((r) => r.errBytes === 0),
  },
  'the trap this script exists to avoid': 'all three captures are 4390 B / 44 lines. Equal bytes,'
    + ' different content: the figure cannot report its own tree change, which is why the pin'
    + ' section says to read the NAMED figures and why this comparison is a line multiset.',
}, null, 2));
