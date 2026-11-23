#!/usr/bin/env node
/**
 * unit-504mixedstalelabels — P1. The stale limb's per-entry cost, re-derived from the LIVE branch
 * literal by this seat, without reading `unit-503`'s derivation.
 *
 * Theseus routed a general form to me in `unit-503` §4. A routed finding does not validate its
 * routed cure, and the weakest possible reason to adopt a law is that the memo proposing it did the
 * arithmetic. So this script re-derives the form from the gate's own source:
 *
 *   1. locate the per-entry statement by anchoring on its own text (never a line number — this
 *      corpus has shipped stale line citations repeatedly, and his own memo cited L385 for a
 *      statement that is at L389 in the tracked file);
 *   2. slice the `emitErr(...)` argument out of that statement;
 *   3. evaluate the template with `f` and `verdicts` bound, which is the gate's own rendering and
 *      not a retyped copy of it;
 *   4. byte-length the result, plus the newline `console.error` appends.
 *
 * The gate is never executed. Nothing is hand-typed that can be read.
 *
 * P7 hygiene: no quoted-character comparison and no exemption token appears contiguously in this
 * source, in a string, a comment or a regex. The gate's own keys therefore cannot match this file
 * and it stays out of the population, out of DEAD MARKERS and out of the quoted-only list — the two
 * doors by which `unit-502` (string literal) and `unit-503` (comment) each moved the standing
 * figure while measuring it.
 */
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const UNIT = import.meta.dirname;
const ROOT = resolve(UNIT, '../../..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';
const src = readFileSync(join(ROOT, GATE_REL), 'utf8');

const must = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };

/* --------------------------------------------------- 1. the statement, found by its own text */
const ANCHOR = 'for (const f of stale) emitErr(';
const at = src.indexOf(ANCHOR);
must(at >= 0, 'the per-entry statement anchor is not in the live gate');
must(src.indexOf(ANCHOR, at + 1) < 0, 'the anchor occurs more than once — the slice is ambiguous');
const stmtEnd = src.indexOf('\n', at);
const stmt = src.slice(at, stmtEnd);
const lineNo = src.slice(0, at).split('\n').length;

/* ------------------------------------------------------------ 2. the argument, sliced not typed */
const open = stmt.indexOf('(', ANCHOR.length - 1);
const close = stmt.lastIndexOf(')');
must(open > 0 && close > open, `cannot slice the call argument out of ${JSON.stringify(stmt)}`);
const arg = stmt.slice(open + 1, close);
const BT = String.fromCharCode(96);
must(arg.startsWith(BT) && arg.endsWith(BT), 'the sliced argument is not a single template literal');

/* --------------------------------------------- 3. evaluate it, with the gate's own locals bound */
// eslint-disable-next-line no-new-func
const render = new Function('f', 'verdicts', `return ${arg};`);
const one = (path, label) => render(path, new Map([[path, label]]));
// `label === null` exercises the `?? 'ABSENT'` default by leaving the path out of the map entirely,
// which is the state a baseline entry for a deleted file is actually in.
const absent = (path) => render(path, new Map());
const costOf = (text) => Buffer.byteLength(text, 'utf8') + 1;   // + the newline console.error adds

/* ------------------------------------------- 4. the reachable label set, read off the live source */
const labelsLine = src.split('\n').find((l) => l.startsWith('const LABELS = '));
must(labelsLine, 'cannot find the live LABELS declaration');
const LABELS = new Function(`${labelsLine}; return LABELS;`)();
const staleLine = src.split('\n').find((l) => l.startsWith('const stale = baseline.filter('));
must(staleLine, 'cannot find the live stale filter');
const excluded = LABELS.filter((v) => staleLine.includes(v));
const dflt = (arg.match(/\?\?\s*'([A-Z]+)'/) || [])[1];
const reachable = [...LABELS.filter((v) => !excluded.includes(v)), dflt].sort();

/* ------------------------------------- the constant, decomposed member-wise rather than as a total */
const SP = String.fromCharCode(32);
const ARROW = String.fromCharCode(0x2192);
const pieces = [
  ['indent', SP.repeat(6)],
  ['gap', SP.repeat(2)],
  ['arrow', ARROW],
  ['" now "', `${SP}now${SP}`],
  ['open backtick', BT],
  ['close backtick', BT],
];
const emptyRender = render('', new Map([['', '']]));
const expectedEmpty = pieces.map(([, s]) => s).join('');
const widths = Object.fromEntries(pieces.map(([k, s]) => [k, Buffer.byteLength(s, 'utf8')]));
const constant = pieces.reduce((n, [, s]) => n + Buffer.byteLength(s, 'utf8'), 0) + 1;

/* --------------------------------------------------------------------------------------- grades */
const LENS = [40, 57];
const verdict = {};
for (const L of LENS) {
  const path = 'p'.repeat(L);
  for (const label of reachable) {
    const text = label === dflt ? absent(path) : one(path, label);
    const want = 19 + L + label.length;
    verdict[`P1.a  len ${L} / ${label}: cost = 19 + ${L} + ${label.length} = ${want}`] =
      costOf(text) === want;
  }
}
verdict['P1.b  the constant is 19 and decomposes 6 + 2 + 3 + 5 + 1 + 1 + 1 member-wise'] =
  constant === 19
  && widths.indent === 6 && widths.gap === 2 && widths.arrow === 3
  && widths['" now "'] === 5 && widths['open backtick'] === 1 && widths['close backtick'] === 1;
verdict['P1.b2 the empty render IS that concatenation, not merely the same length'] =
  emptyRender === expectedEmpty;
verdict['P1.c  the reachable label set is exactly {ABSENT, GUARDED, MARKED}'] =
  JSON.stringify(reachable) === JSON.stringify(['ABSENT', 'GUARDED', 'MARKED']);
verdict['P1.c2 UNGUARDED is excluded BY the live filter, read rather than assumed'] =
  excluded.length === 1 && excluded[0] === 'UNGUARDED';

/* ------------------------- P1.d — the published law line, and what it already says about its scope */
const lawLine = src.split('\n').find((l) => l.includes('stale limb:') && l.includes('227 +'));
must(lawLine, 'cannot find the published stale law line in the docblock');
verdict['P1.d  the published law ALREADY carries the scope annotation (all ABSENT)'] =
  lawLine.includes('(all ABSENT)');

console.log(JSON.stringify({
  gateRel: GATE_REL,
  statementLine: lineNo,
  statement: stmt.trim(),
  slicedArgument: arg,
  publishedLawLine: lawLine.trim(),
  constant,
  constantPieces: widths,
  reachableLabels: reachable,
  excludedByFilter: excluded,
  derivedForm: 'per-entry bytes = 19 + len(path) + len(label)',
  samples: Object.fromEntries(LENS.flatMap((L) => reachable.map((label) => {
    const path = 'p'.repeat(L);
    const text = label === dflt ? absent(path) : one(path, label);
    return [`len${L}/${label}`, { bytes: costOf(text), render: text }];
  }))),
  verdict,
}, null, 2));
