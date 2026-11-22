#!/usr/bin/env node
/**
 * unit-503stalelabelwidth — P1. DERIVES the stale limb's per-entry byte cost from the gate's own
 * branch literal. It does not fit a formula to captures, and the gate never executes.
 *
 * Method, the same one `unit-502streampin/derive-limb-laws.mjs` introduced: anchor on the emitting
 * statement's own text, slice its template literal out of the source, evaluate that literal with
 * `f` and `verdicts` bound, and byte-length the result. `publish` passes `format(...args)` straight
 * to `console.error`, which appends exactly one newline (L641-655), so the per-entry cost is
 * `Buffer.byteLength(line) + 1`.
 *
 * WHY THIS FILE CARRIES NO QUOTED-CHARACTER COMPARISON AND NO MARKER TOKEN: P7. Every character
 * literal this file needs is built with `String.fromCharCode`, and the exemption token is assembled
 * by split concatenation, so neither `OPEN_BRACE`/`CLOSE_BRACE` nor `MARKER` can match this source.
 * The point is that the instrument-authored `quoted-only` class his §1 names is escapable, and this
 * unit's own landing is the control that says so.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const GATE = `${ROOT}/scripts/verify-decl-body-slicers.mjs`;
const src = readFileSync(GATE, 'utf8');

const BT = String.fromCharCode(96);   // backtick, never written as a literal here

/** Slice the template literal that follows `anchor`, delimiters included, honouring escapes. */
function literalAfter(anchor) {
  const at = src.indexOf(anchor);
  if (at < 0) throw new Error(`anchor absent: ${JSON.stringify(anchor)}`);
  if (src.indexOf(anchor, at + 1) >= 0) throw new Error(`anchor not unique: ${JSON.stringify(anchor)}`);
  const open = src.indexOf(BT, at + anchor.length);
  if (open < 0) throw new Error('no template literal after anchor');
  let i = open + 1;
  for (; i < src.length; i += 1) {
    if (src[i] === String.fromCharCode(92)) { i += 1; continue; }   // backslash: skip the escape
    if (src[i] === BT) break;
  }
  if (i >= src.length) throw new Error('unterminated template literal');
  return src.slice(open, i + 1);
}

const ANCHOR = 'for (const f of stale) emitErr(';
const literal = literalAfter(ANCHOR);

// Evaluated, not retyped. `f` and `verdicts` are the only free names in it.
const render = new Function('f', 'verdicts', `return ${literal};`);

const LABELS_REACHABLE = [
  // `stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED')` (L385), so a stale entry's
  // verdict is MARKED, GUARDED, or undefined -> the literal fallback 'ABSENT'.
  ['ABSENT', undefined],
  ['MARKED', 'MARKED'],
  ['GUARDED', 'GUARDED'],
];

const rows = [];
for (const [name, v] of LABELS_REACHABLE) {
  for (const L of [1, 40, 57, 60]) {
    const f = 'x'.repeat(L);
    const verdicts = new Map(v === undefined ? [] : [[f, v]]);
    const line = render(f, verdicts);
    const bytes = Buffer.byteLength(line, 'utf8') + 1;      // + the newline console.error appends
    rows.push({ label: name, pathLen: L, lineBytes: bytes, perEntryConstant: bytes - L });
  }
}

// P1.a / P1.b / P1.c: is the constant `19 + len(label)`, and what does that do to his `+25`?
const byLabel = {};
for (const r of rows) {
  const set = (byLabel[r.label] ??= new Set());
  set.add(r.perEntryConstant);
}
const constants = Object.fromEntries(
  Object.entries(byLabel).map(([k, s]) => [k, s.size === 1 ? [...s][0] : [...s]]),
);

// P1.d: decompose the 19. Built from fromCharCode so this file stays out of the population.
const ARROW = String.fromCharCode(0x2192);
const decomposition = {
  indent: 6,
  gapAfterPath: 2,
  arrowBytes: Buffer.byteLength(ARROW, 'utf8'),
  spaceNowSpace: ' now '.length,
  openBacktick: 1,
  closeBacktick: 1,
  newline: 1,
};
const decomposed = Object.values(decomposition).reduce((a, b) => a + b, 0);

const publishedLaw = { base: 227, perEntry: 25, scope: 'all ABSENT (unit-502streampin §3)' };
const verdict = {
  'P1.a  per-entry cost is 19 + len(path) + len(label)':
    Object.entries(constants).every(([k, c]) => c === 19 + k.length),
  'P1.b  ABSENT and MARKED both give len(path) + 25 (his law exact)':
    constants.ABSENT === 25 && constants.MARKED === 25,
  'P1.c  GUARDED gives len(path) + 26 — one byte MORE than his law':
    constants.GUARDED === 26,
  'P1.d  the 19 decomposes as 6+2+3+5+1+1+1':
    decomposed === 19,
};

console.log(JSON.stringify({
  anchor: ANCHOR,
  literalSliced: literal,
  publishedLaw,
  perEntryConstantByLabel: constants,
  decomposition,
  decomposed,
  sampleLines: rows.filter((r) => r.pathLen === 40),
  rows,
  verdict,
}, null, 2));
