#!/usr/bin/env node
/**
 * unit-482floorceiling arm — is `18 of 69` a floor that can be widened into a measure?
 *
 * Control discipline, unchanged from unit-480 arm B: every key is CAPTURED out of a source file and
 * `eval`'d, never re-typed. The gate's keys come out of `scripts/verify-decl-body-slicers.mjs`; the
 * floor key `DEPTH_LINE` comes out of `docs/research/unit-480guardorder-2026-11-18/arm-b.mjs`, so
 * the published 18 is re-driven under the published key. The five live-gate figures are a CONTROL
 * and nothing is published if any cell mismatches.
 *
 * brace-slicer-deliberate: this arm carries naive brace-comparison readers on purpose — they are
 * the subject being censused, not a tool being used.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const ARMB = join(ROOT, 'docs/research/unit-480guardorder-2026-11-18/arm-b.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const ROUND401 = 'docs/research/round401-instruments/census-the-branch-polarity-axis.mjs';
const CURE = 'scripts/lib/decl-body.mjs';

const gateSrc = readFileSync(GATE, 'utf8');
const armbSrc = readFileSync(ARMB, 'utf8');

const capture = (label, re, src) => {
  const m = src.match(re);
  if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); }
  return m[1];
};
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/, gateSrc);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const g = (ch) => new RegExp(cmpRaw(ch).source, 'g');
const chars = {};
for (const n of ['OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON']) {
  chars[n] = capture(n, new RegExp(`const ${n} = cmp\\('(.)'\\)`), gateSrc);
}
const K = Object.fromEntries(Object.entries(chars).map(([k, c]) => [k, g(c)]));
const MARKER = new RegExp(capture('MARKER', /const MARKER = \/(.*?)\/;/, gateSrc));
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\)/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));

// M1's key, captured out of the PUBLISHED arm rather than re-typed.
const depthLineSrc = capture('DEPTH_LINE', /const DEPTH_LINE = (\/[\s\S]*?\/);\n/, armbSrc);
// eslint-disable-next-line no-eval
const DEPTH_LINE = eval(depthLineSrc);
// The window width M1 was published with, also captured rather than re-typed.
const DEPTH_WINDOW = +capture('M1 window', /lineEnd \+ (\d+)\)\)/, armbSrc);

const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

/* ---- the two new key families -------------------------------------------------------------- */
const SLICE_CALL = /\.(?:slice|substring|substr)\s*\(/g;              // M2: any slice-family call
const SLICE_ARGS = /\.(?:slice|substring|substr)\s*\(([^()]*)\)/g;    // D2: its argument text
const D1_RADIUS = 200;                                                // D1: ± chars around a site
const IDENT = /[A-Za-z_$][\w$]*/g;
const STOPWORDS = new Set(['if', 'else', 'return', 'const', 'let', 'var', 'for', 'while', 'function',
  'true', 'false', 'null', 'undefined', 'typeof', 'new', 'this', 'break', 'continue', 'case',
  'switch', 'do', 'in', 'of', 'length', 'push', 'test', 'slice', 'substring', 'substr']);

const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };
const allCaps = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m[1]); return out; };

const lineOf = (code, i) => {
  const lineStart = code.lastIndexOf('\n', i) + 1;
  let lineEnd = code.indexOf('\n', i); if (lineEnd < 0) lineEnd = code.length;
  return { lineStart, lineEnd, text: code.slice(lineStart, lineEnd) };
};

const classify = (code) => {
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  const inPop = ob.length > 0 && cb.length > 0;

  // M1 — every open-brace comparison site sits on a multi-bracket disjunction/membership line.
  let m1 = inPop;
  for (const i of ob) {
    const { lineStart, lineEnd } = lineOf(code, i);
    const window = code.slice(lineStart, Math.min(code.length, lineEnd + DEPTH_WINDOW));
    if (!DEPTH_LINE.test(window)) { m1 = false; break; }
  }

  // M2 — no slice-family call anywhere in the file.
  const sliceSites = all(SLICE_CALL, code);
  const m2 = inPop && sliceSites.length === 0;

  // D1 — some open-brace comparison site has a slice-family call within +-D1_RADIUS chars.
  let d1 = false, d1site = null;
  for (const i of ob) {
    const lo = Math.max(0, i - D1_RADIUS), hi = Math.min(code.length, i + D1_RADIUS);
    if (sliceSites.some((s) => s >= lo && s <= hi)) { d1 = true; d1site = i; break; }
  }

  // D2 — an identifier on a comparison's own line also appears inside a slice call's arguments.
  const argIdents = new Set();
  for (const args of allCaps(SLICE_ARGS, code)) {
    for (const id of args.match(IDENT) || []) if (!STOPWORDS.has(id)) argIdents.add(id);
  }
  let d2 = false, d2ident = null;
  for (const i of ob) {
    const { text } = lineOf(code, i);
    for (const id of text.match(IDENT) || []) {
      if (!STOPWORDS.has(id) && argIdents.has(id)) { d2 = true; d2ident = id; break; }
    }
    if (d2) break;
  }
  return { inPop, ob: ob.length, cb: cb.length, m1, m2, d1, d2, d1site, d2ident, slices: sliceSites.length };
};

/* ---- the tree ------------------------------------------------------------------------------- */
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const baseline = readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
const baselineSet = new Set(baseline);

const rows = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const code = stripSource(raw, false);
  const c = classify(code);
  const marked = MARKER.test(raw);
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  const verdict = !c.inPop ? 'OUT' : marked ? 'MARKED'
    : (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED';
  rows.push({ rel, ...c, marked, verdict });
}

/* ---- CONTROL -------------------------------------------------------------------------------- */
const pop = rows.filter((r) => r.inPop);
const tally = (k, rs) => rs.reduce((a, r) => (a[r[k]] = (a[r[k]] || 0) + 1, a), {});
const v = tally('verdict', pop);
const readable = tracked.filter((f) => EXTS.has(extname(f))).length;
const exp = {
  tracked: +process.argv[2], population: +process.argv[3],
  UNGUARDED: +process.argv[4], MARKED: +process.argv[5], GUARDED: +process.argv[6],
};
const got = {
  tracked: readable, population: pop.length,
  UNGUARDED: v.UNGUARDED || 0, MARKED: v.MARKED || 0, GUARDED: v.GUARDED || 0,
};
console.log('=== CONTROL — re-derived vs the LIVE gate (P1) ===');
let ok = true;
for (const k of Object.keys(exp)) {
  const good = got[k] === exp[k]; if (!good) ok = false;
  console.log(`  ${k.padEnd(11)} captured ${String(got[k]).padStart(4)}  live ${String(exp[k]).padStart(4)}  ${good ? 'OK' : 'MISMATCH'}`);
}
console.log(`  DEPTH_LINE captured from arm-b.mjs, window ${DEPTH_WINDOW}: ${DEPTH_LINE}`);
if (!ok) { console.error('\nCAPTURE-FAILED — nothing below is published.'); process.exit(3); }

/* ---- KNOWN POSITIVES ------------------------------------------------------------------------ */
console.log('\n=== KNOWN POSITIVES — all four keys satisfiable in both directions ===');
const kp = (name, text, want, note) => {
  const c = classify(stripSource(text, false));
  const keys = ['m1', 'm2', 'd1', 'd2'];
  const pass = keys.every((k) => want[k] === undefined || c[k] === want[k]);
  console.log(`  ${name.padEnd(5)} m1=${String(c.m1).padEnd(5)} m2=${String(c.m2).padEnd(5)} d1=${String(c.d1).padEnd(5)} d2=${String(c.d2).padEnd(5)}  want ${keys.map((k) => want[k] === undefined ? '*' : String(want[k])[0]).join('/')}  ${pass ? 'PASS' : 'FAIL'}   ${note}`);
  return pass;
};
const KPH = "let d=0; for (const c of s) { if (c === '{' || c === '(') d++; else if (c === '}' || c === ')') d--; }";
const KPI = "if (src[i] === '{') hit = true; if (src[j] === '}') end = j;\nconst body = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));";
// KP-J — the round401 / decl-body.mjs shape, built by hand: a brace comparison whose index is handed
// to a helper, and an UNRELATED slice call far outside D1's window.
const KPJ = [
  "export const spanEnd = (code, from) => {",
  "  let depth = 0;",
  "  for (let k = from; k < code.length; k++) {",
  "    const ch = code[k];",
  "    if (ch === '{') depth++;",
  "    else if (ch === '}') { depth--; if (depth === 0) return k; }",
  "  }",
  "  return -1;",
  "};",
  ...Array.from({ length: 14 }, (_, n) => `const filler${n} = ${n} * 2 + 1;`),
  "export const nameOf = (row) => {",
  "  const parts = String(row.label);",
  "  return parts.toUpperCase();",
  "};",
  ...Array.from({ length: 14 }, (_, n) => `const pad${n} = '${'x'.repeat(10)}';`),
  "export const render = (text, start) => {",
  "  const stop = spanEnd(text, start);",
  "  return text.slice(start, stop + 1);",
  "};",
].join('\n');
const kph = kp('KP-H', KPH, { m1: true, m2: true, d1: false }, 'pure two-sided depth counter, no slice');
const kpi = kp('KP-I', KPI, { m1: false, m2: false, d1: true }, "indexOf('{') + slice beside a comparison");
const kpj = kp('KP-J', KPJ, { m1: false, m2: false, d1: false, d2: false }, 'CRUX: comparison -> helper, slice far away');
if (!(kph && kpi && kpj)) { console.error('\nKP-FAILED — the keys are not demonstrably satisfiable as registered. Nothing published.'); process.exit(4); }

/* ---- the answer key ------------------------------------------------------------------------- */
const markedRows = pop.filter((r) => r.verdict === 'MARKED');
const cureRow = rows.find((r) => r.rel === CURE);
const r401Row = rows.find((r) => r.rel === ROUND401);
console.log('\n=== ANSWER KEY — present in the tree? ===');
console.log(`  MARKED members (declared slicers):      ${markedRows.length}`);
console.log(`  ${CURE}:  ${cureRow ? 'present, inPop=' + cureRow.inPop : 'ABSENT'}`);
console.log(`  ${ROUND401}: ${r401Row ? 'present, inPop=' + r401Row.inPop : 'ABSENT'}`);
if (!cureRow?.inPop || !r401Row?.inPop) {
  console.error('\nANSWER-KEY-FAILED — a graded member is not in the population. Nothing published.');
  process.exit(5);
}

/* ---- P2/P3/P4 — the floor ------------------------------------------------------------------- */
const m1Set = pop.filter((r) => r.m1), m2Set = pop.filter((r) => r.m2);
const floor = pop.filter((r) => r.m1 || r.m2);
const m2Only = m2Set.filter((r) => !r.m1);
console.log('\n=== FLOOR — sufficient conditions for "never slices a declaration body" ===');
console.log(`  P2  M1 depth-counter-only:                 ${m1Set.length} of ${pop.length}        (expect 18)`);
console.log(`      of those, baselined:                   ${m1Set.filter((r) => baselineSet.has(r.rel)).length} of ${baseline.length}`);
console.log(`  P3  M2 no slice-family call at all:        ${m2Set.length} of ${pop.length}`);
console.log(`      M2 members M1 does not have:           ${m2Only.length}        (P3 expects >= 1)`);
for (const r of m2Only) console.log(`        + ${r.verdict.padEnd(9)} ${baselineSet.has(r.rel) ? 'baselined' : '         '} ${r.rel}`);
console.log(`      UNION FLOOR |M1 u M2|:                 ${floor.length} of ${pop.length}        (P3 expects >= 19)`);
const floorBaselined = floor.filter((r) => baselineSet.has(r.rel));
console.log(`      of the union floor, baselined:         ${floorBaselined.length} of ${baseline.length}   (${(100 * floorBaselined.length / baseline.length).toFixed(1)}% of the baseline)`);
console.log(`  P4  round401 in the union floor:           ${floor.some((r) => r.rel === ROUND401)}        (expect false)`);
console.log(`      round401: m1=${r401Row.m1} m2=${r401Row.m2} (${r401Row.slices} slice-family call(s), ${r401Row.ob} open-brace comparison(s))`);

/* ---- P5/P6/P7/P8 — the upper bound ---------------------------------------------------------- */
const d1Set = pop.filter((r) => r.d1), d2Set = pop.filter((r) => r.d2);
const markedD1 = markedRows.filter((r) => r.d1);
console.log('\n=== UPPER BOUND — graded against the 8 known body-slicers ===');
console.log(`  P5  MARKED files D1 reaches:               ${markedD1.length} of ${markedRows.length}        (expect >= 5)`);
for (const r of markedRows) console.log(`        ${r.d1 ? 'REACHED ' : 'MISSED  '} d2=${String(r.d2).padEnd(5)} ${r.rel}`);
console.log(`  P6  D1 reaches ${CURE}: ${cureRow.d1}        (expect false — the headline)`);
console.log(`  P7  D2 reaches ${CURE}: ${cureRow.d2}        (expect false)`);
console.log(`      ${CURE}: ${cureRow.slices} slice-family call(s), ${cureRow.ob} open-brace comparison(s)${cureRow.d2ident ? `, D2 ident "${cureRow.d2ident}"` : ''}`);
console.log(`  P8  round401 in D1 u D2:                   ${r401Row.d1 || r401Row.d2}        (expect false)`);
console.log(`      round401: d1=${r401Row.d1} d2=${r401Row.d2}${r401Row.d2ident ? ` ident "${r401Row.d2ident}"` : ''}`);
console.log(`      |D1| = ${d1Set.length} of ${pop.length} · |D2| = ${d2Set.length} of ${pop.length} · |D1 u D2| = ${pop.filter((r) => r.d1 || r.d2).length}`);

/* ---- P9/P10 — soundness and the interval ---------------------------------------------------- */
const both = floor.filter((r) => r.d1);
console.log('\n=== SOUNDNESS AND THE INTERVAL ===');
console.log(`  P9  |union floor n D1|:                    ${both.length}        (expect 0)`);
for (const r of both) console.log(`        CONTRADICTION  m1=${r.m1} m2=${r.m2} d1=${r.d1}  ${r.rel}`);
const ceiling = pop.length - d1Set.length;
console.log(`  P10 ceiling (population - |D1|):           ${ceiling}`);
console.log(`      floor:                                 ${floor.length}`);
console.log(`      interval width:                        ${ceiling - floor.length}        (P10 expects >= 20)`);
console.log(`      the class size is somewhere in [${floor.length}, ${ceiling}] of ${pop.length} —`);
console.log(`      and the ceiling ${cureRow.d1 ? 'EXCLUDES' : 'ADMITS'} ${CURE}, which every seat agrees slices bodies.`);
