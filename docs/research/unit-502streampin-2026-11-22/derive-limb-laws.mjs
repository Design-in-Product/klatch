#!/usr/bin/env node
/**
 * **Derive both red limbs' stderr byte/line laws from the gate's OWN branch literals, by slicing
 * and evaluating them — never by retyping them here.**
 *
 * This is a READER, not a drive. It does not execute `verify-decl-body-slicers.mjs`, plant
 * anything, or touch the index. It exists so that the point predictions in this unit's
 * PRE-REGISTRATION are *derived from the subject* rather than curve-fitted from prior captures —
 * the corpus lesson is `derive the verdict predicate from the branch literals`, and a hand-typed
 * copy of a literal is not a slice (`a hand-typed reader is not a slice`).
 *
 * The `stale` limb has NEVER been driven by anyone (Theseus, `unit-501redbranchpin` §6, declared it
 * unmeasured because reaching it requires the tracked baseline to change), so there are ZERO prior
 * datapoints for it. Its constants can only come from the literals.
 *
 * Method, per emitted chunk:
 *   1. anchor on a distinctive substring of the chunk's source text,
 *   2. slice the whole `emitErr(...)` statement textually (statements here are one or two source
 *      lines and end in `);`),
 *   3. evaluate the ARGUMENT EXPRESSION with the gate's own locals bound,
 *   4. byte-length it and add 1 for the newline `console.error` appends.
 *
 * No brace-character comparison appears anywhere in this file: the needed characters are built
 * with `String.fromCharCode` so that this reader cannot enter the population of the gate it reads.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const src = readFileSync(GATE, 'utf8');
const lines = src.split('\n');

const CALL = 'emitErr(';
const CLOSE = ');';

/** Slice the `emitErr(...)` statement that starts at the line carrying `anchor`. */
function sliceStatement(anchor) {
  const start = lines.findIndex((l) => l.includes(anchor) && l.includes(CALL));
  if (start < 0) throw new Error(`no emitErr statement line carries ${JSON.stringify(anchor)}`);
  let end = start;
  while (end < lines.length && !lines[end].trimEnd().endsWith(CLOSE)) end += 1;
  if (end >= lines.length) throw new Error(`unterminated statement from line ${start + 1}`);
  const text = lines.slice(start, end + 1).join('\n').trim();
  const open = text.indexOf(CALL);
  const expr = text.slice(open + CALL.length, text.lastIndexOf(CLOSE));
  return { firstLine: start + 1, lastLine: end + 1, statement: text, expr };
}

/** Evaluate a sliced argument expression with the gate's locals bound. */
function evalExpr(expr, env) {
  const names = Object.keys(env);
  // eslint-disable-next-line no-new-func
  const fn = new Function(...names, `return (${expr});`);
  return fn(...names.map((n) => env[n]));
}

const bytes = (s) => Buffer.byteLength(s, 'utf8') + 1; // +1 = console.error's newline
const nl = String.fromCharCode(10);
const linesOf = (s) => s.split(nl).length;             // publish() splits on \n; chunk -> that many lines

/* ------------------------------------------------------------------ the `stale` limb */
const staleHeader = sliceStatement('stale baseline entry/entries');
const staleEntry = sliceStatement('→ now');
const staleFooter = sliceStatement('Remove them from the baseline');

/* ------------------------------------------------------------------ the `newOnes` limb */
const newHeader = sliceStatement('new hand-rolled brace-balance body slicer(s)');
const newEntry = sliceStatement('for (const f of newOnes)');
const newProse = sliceStatement('A brace scan that starts at the first');
const newRoute1 = sliceStatement('import { bodyOf, declBodies }');
const newRoute2 = sliceStatement('put `brace-slicer-deliberate:');
const newRoute3 = sliceStatement('append the path to');

const report = [];
const say = (s) => { report.push(s); console.log(s); };

say('derive-limb-laws — both red limbs, constants sliced from the gate rather than retyped');
say(`  gate: ${GATE.replace(`${ROOT}/`, '')}`);
say('');

/* ---- stale limb, N entries, every one ABSENT (the only verdict an empty population can give) */
{
  const PROBE = 'P'.repeat(40); // a path stand-in; only its LENGTH enters the law
  const env1 = { stale: { length: 1 }, f: PROBE, verdicts: new Map() };
  const hdr = evalExpr(staleHeader.expr, env1);
  const ent = evalExpr(staleEntry.expr.slice(staleEntry.expr.indexOf('`')), { f: PROBE, verdicts: new Map() });
  const ftr = evalExpr(staleFooter.expr, env1);
  const perEntry = bytes(ent) - PROBE.length;
  const fixed = bytes(hdr) + bytes(ftr);
  const fixedLines = linesOf(hdr) + linesOf(ftr);
  say('  STALE LIMB (all entries ABSENT):');
  say(`    header chunk  src L${staleHeader.firstLine}      ${bytes(hdr)} B  ${linesOf(hdr)} lines`);
  say(`    per-entry     src L${staleEntry.firstLine}      len(path) + ${perEntry} B  1 line`);
  say(`    footer chunk  src L${staleFooter.firstLine}-${staleFooter.lastLine}  ${bytes(ftr)} B  ${linesOf(ftr)} lines`);
  say(`    LAW:  stderr bytes = ${fixed} + SUM(len(path_i) + ${perEntry})     lines = ${fixedLines} + N`);
  say(`    (header renders the count, so the law holds for N < 10 only — one digit)`);
  say(`    entry text for a ${PROBE.length}-char path: ${JSON.stringify(ent)}`);
}

say('');

/* ---- newOnes limb, N plants */
{
  const PROBE = 'Q'.repeat(40);
  const envN = { newOnes: { length: 1 }, f: PROBE, BASELINE: '/ROOT/scripts/decl-body-slicers.baseline', ROOT: '/ROOT' };
  const hdr = evalExpr(newHeader.expr, envN);
  const ent = evalExpr(newEntry.expr, { f: PROBE });
  const prose = evalExpr(newProse.expr, envN);
  const r1 = evalExpr(newRoute1.expr, envN);
  const r2 = evalExpr(newRoute2.expr, envN);
  const r3 = evalExpr(newRoute3.expr, envN);
  const perEntry = bytes(ent) - PROBE.length;
  const fixed = [hdr, prose, r1, r2, r3].reduce((a, s) => a + bytes(s), 0);
  const fixedLines = [hdr, prose, r1, r2, r3].reduce((a, s) => a + linesOf(s), 0);
  say('  NEWONES LIMB:');
  say(`    header chunk  src L${newHeader.firstLine}      ${bytes(hdr)} B  ${linesOf(hdr)} lines`);
  say(`    per-entry     src L${newEntry.firstLine}      len(path) + ${perEntry} B  1 line`);
  say(`    prose chunk   src L${newProse.firstLine}-${newProse.lastLine}  ${bytes(prose)} B  ${linesOf(prose)} lines`);
  say(`    route 1       src L${newRoute1.firstLine}      ${bytes(r1)} B  ${linesOf(r1)} lines`);
  say(`    route 2       src L${newRoute2.firstLine}-${newRoute2.lastLine}  ${bytes(r2)} B  ${linesOf(r2)} lines`);
  say(`    route 3       src L${newRoute3.firstLine}-${newRoute3.lastLine}  ${bytes(r3)} B  ${linesOf(r3)} lines`);
  say(`    LAW:  stderr bytes = ${fixed} + SUM(len(path_i) + ${perEntry})     lines = ${fixedLines} + N`);
  say('    NOTE: route 3 interpolates the baseline path RELATIVE TO ROOT, so the fixed term is a');
  say('    function of the ROOT the gate runs at. The figure above uses a stand-in; the real');
  say('    constant for THIS worktree is printed next.');
  const realBaseline = resolve(ROOT, 'scripts/decl-body-slicers.baseline');
  const r3real = evalExpr(newRoute3.expr, { BASELINE: realBaseline, ROOT, newOnes: { length: 1 } });
  const fixedReal = fixed - bytes(r3) + bytes(r3real);
  say(`    REAL-ROOT LAW: stderr bytes = ${fixedReal} + SUM(len(path_i) + ${perEntry})   lines = ${fixedLines} + N`);
}

say('');
say('  CROSS-CHECK against the four stderr figures already published for the newOnes limb');
say('  (Theseus unit-501 D1 722@57, D2 731@66, D3 795@57+66, and Daedalus unit-500 742@77):');
{
  const PROBE = 'Q'.repeat(40);
  const ent = evalExpr('`      ${f}`', { f: PROBE });
  const perEntry = bytes(ent) - PROBE.length;
  const realBaseline = resolve(ROOT, 'scripts/decl-body-slicers.baseline');
  const parts = [
    evalExpr(newHeader.expr, { newOnes: { length: 1 } }),
    evalExpr(newProse.expr, {}),
    evalExpr(newRoute1.expr, {}),
    evalExpr(newRoute2.expr, {}),
    evalExpr(newRoute3.expr, { BASELINE: realBaseline, ROOT }),
  ];
  const fixed = parts.reduce((a, s) => a + bytes(s), 0);
  const pred = (lens) => fixed + lens.reduce((a, L) => a + L + perEntry, 0)
    + (lens.length > 1 ? Buffer.byteLength(String(lens.length)) - 1 : 0);
  for (const [label, lens, published] of [
    ['unit-501 D1', [57], 722],
    ['unit-501 D2', [66], 731],
    ['unit-501 D3', [57, 66], 795],
    ['unit-500 D2', [77], 742],
  ]) {
    const p = pred(lens);
    say(`    ${label}  paths ${JSON.stringify(lens)}  derived ${p}  published ${published}  ${p === published ? 'AGREE' : 'DISAGREE'}`);
  }
}
