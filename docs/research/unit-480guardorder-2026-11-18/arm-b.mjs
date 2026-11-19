#!/usr/bin/env node
/**
 * unit-480guardorder arm B — is the defect in the gate's POPULATION key rather than its guard key?
 *
 * Same control discipline as arm A: the population and guard keys are captured and `eval`'d out of
 * `scripts/verify-decl-body-slicers.mjs`, never re-typed, and the re-derived unordered verdicts are
 * graded against the live gate's printed figures before anything is published.
 *
 * brace-slicer-deliberate: this arm carries naive brace-comparison and `indexOf('{')` readers on
 * purpose — they are the subject being censused, not a tool being used.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const gateSrc = readFileSync(GATE, 'utf8');

const capture = (label, re) => {
  const m = gateSrc.match(re);
  if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); }
  return m[1];
};
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const g = (ch) => new RegExp(cmpRaw(ch).source, 'g');
const chars = {};
for (const n of ['OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON']) {
  chars[n] = capture(n, new RegExp(`const ${n} = cmp\\('(.)'\\)`));
}
const K = Object.fromEntries(Object.entries(chars).map(([k, c]) => [k, g(c)]));
const MARKER = new RegExp(capture('MARKER', /const MARKER = \/(.*?)\/;/));
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const baseline = readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
const baselineSet = new Set(baseline);
const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };

/* ---- the Q1 key: a slice START that carries no comparison operator at all ------------------ */
// Deliberately NOT the gate's shape. `indexOf('{')`, `search(/\{/)`, `.split('{')` and friends find
// a brace without ever comparing a character to one, so cmp('{') cannot see them.
const INDEXOF_BRACE = /\.(?:indexOf|lastIndexOf|search|split|slice|substring|indexOfBrace)\s*\(\s*['"`]\{['"`]/g;
// A multi-bracket disjunction/membership operand: the correct depth-counter form.
const DEPTH_LINE = /(?:[=!]==?\s*['"`][([{]['"`][\s\S]{0,80}?\|\|[\s\S]{0,40}?[=!]==?\s*['"`][([{]['"`])|(?:['"`][([{]['"`]\s*,\s*['"`][([{]['"`])|(?:\.includes\s*\(\s*c\s*\))/;

const rows = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const code = stripSource(raw, false);
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  const inPop = ob.length > 0 && cb.length > 0;
  const idx = all(INDEXOF_BRACE, code);
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  const marked = MARKER.test(raw);
  const unordered = !inPop ? 'OUT' : marked ? 'MARKED'
    : (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED';
  // depth-counter-only: every brace comparison site sits on a line that is a multi-bracket
  // disjunction or membership test
  let depthOnly = inPop;
  for (const i of ob) {
    const lineStart = code.lastIndexOf('\n', i) + 1;
    let lineEnd = code.indexOf('\n', i); if (lineEnd < 0) lineEnd = code.length;
    // allow the disjunction to wrap one line
    const window = code.slice(lineStart, Math.min(code.length, lineEnd + 120));
    if (!DEPTH_LINE.test(window)) { depthOnly = false; break; }
  }
  rows.push({ rel, inPop, ob, cb, idx, unordered, marked, depthOnly });
}

/* ---- CONTROL ------------------------------------------------------------------------------- */
const pop = rows.filter((r) => r.inPop);
const tally = (k, rs) => rs.reduce((a, r) => (a[r[k]] = (a[r[k]] || 0) + 1, a), {});
const un = tally('unordered', pop);
const readable = tracked.filter((f) => EXTS.has(extname(f))).length;
const exp = { tracked: +process.argv[2], population: +process.argv[3], UNGUARDED: +process.argv[4], MARKED: +process.argv[5], GUARDED: +process.argv[6] };
const got = { tracked: readable, population: pop.length, UNGUARDED: un.UNGUARDED || 0, MARKED: un.MARKED || 0, GUARDED: un.GUARDED || 0 };
console.log('=== CONTROL — re-derived vs the LIVE gate ===');
let ok = true;
for (const k of Object.keys(exp)) {
  const good = got[k] === exp[k]; if (!good) ok = false;
  console.log(`  ${k.padEnd(11)} captured ${String(got[k]).padStart(4)}  live ${String(exp[k]).padStart(4)}  ${good ? 'OK' : 'MISMATCH'}`);
}
if (!ok) { console.error('\nCAPTURE-FAILED — nothing below is published.'); process.exit(3); }

/* ---- KPs for the new keys ------------------------------------------------------------------ */
console.log('\n=== KNOWN POSITIVES for arm B\'s two new keys ===');
const kp = (name, text, want) => {
  const code = stripSource(text, false);
  const got2 = { inPop: all(K.OPEN_BRACE, code).length > 0 && all(K.CLOSE_BRACE, code).length > 0, idx: all(INDEXOF_BRACE, code).length > 0 };
  const pass = got2.inPop === want.inPop && got2.idx === want.idx;
  console.log(`  ${name.padEnd(6)} inPop=${String(got2.inPop).padEnd(5)} indexOf=${String(got2.idx).padEnd(5)} want ${want.inPop}/${want.idx}  ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
};
// KP-D: the exact naive form the gate's docblock names — invisible to the gate, visible to Q1's key
const kpd = kp('KP-D', "const body = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));", { inPop: false, idx: true });
// KP-E: the gate's own shape — visible to the gate, invisible to Q1's key
const kpe = kp('KP-E', "let i=0; while (s[i] !== '{') i++; if (s[j] === '}') done = true;", { inPop: true, idx: false });
// KP-F: both spellings in one file
const kpf = kp('KP-F', "if (s[i] === '{') d++; if (s[i] === '}') d--; const k = s.indexOf('{');", { inPop: true, idx: true });
if (!(kpd && kpe && kpf)) { console.error('\nKP-FAILED — the new keys are not demonstrably satisfiable. Nothing published.'); process.exit(4); }

/* ---- Q1/Q2 --------------------------------------------------------------------------------- */
console.log('\n=== Q1/Q2 — is the gate blind to indexOf(\'{\')? ===');
const idxFiles = rows.filter((r) => r.idx.length);
const idxOnly = idxFiles.filter((r) => !r.inPop);
console.log(`  tracked files with an indexOf/search/split-style brace slice start: ${idxFiles.length}`);
console.log(`  of those, NOT in the gate's population (invisible to it):          ${idxOnly.length}   (Q1 wants >= 1)`);
for (const r of idxOnly) console.log(`      INVISIBLE  ${r.rel}  (${r.idx.length} site(s))`);
console.log(`  of those, in the population and so already graded:                 ${idxFiles.length - idxOnly.length}`);
for (const r of idxFiles.filter((x) => x.inPop)) console.log(`      graded ${r.unordered.padEnd(9)} ${r.rel}  (${r.idx.length} indexOf site(s))`);

/* ---- Q3/Q4/Q5 ------------------------------------------------------------------------------ */
console.log('\n=== Q3/Q4/Q5 — does the population over-admit depth counters? ===');
const depthOnly = pop.filter((r) => r.depthOnly);
console.log(`  population members whose EVERY brace comparison is a multi-bracket depth counter: ${depthOnly.length} of ${pop.length}   (Q3 wants >= 8)`);
const depthBaselined = depthOnly.filter((r) => baselineSet.has(r.rel));
console.log(`  of those, sitting in the baseline as "a known unguarded slicer added on purpose":  ${depthBaselined.length} of ${baseline.length}   (Q4 wants >= 10)`);
const cure = rows.find((r) => r.rel === 'scripts/lib/decl-body.mjs');
console.log(`  scripts/lib/decl-body.mjs depth-counter-only: ${cure?.depthOnly}   (Q5 wants false)`);
console.log('  first 12 depth-counter-only members:');
for (const r of depthOnly.slice(0, 12)) console.log(`      ${baselineSet.has(r.rel) ? 'baselined' : '         '}  ${r.unordered.padEnd(9)} ${r.rel}`);

/* ---- Q6: the cripple ----------------------------------------------------------------------- */
console.log('\n=== Q6 — CRIPPLE: is the paren-pair ordering variant keeping a promise or a coincidence? ===');
// The variant: LPAREN and RPAREN must first-match before the first brace comparison; COLON stays
// file-level. Arm A showed it holds decl-body.mjs and moves only the round401 file.
const parenOrdered = (code, marked) => {
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  if (!ob.length || !cb.length) return 'OUT';
  if (marked) return 'MARKED';
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  const before = (xs) => xs.some((i) => i < ob[0]);
  return (before(lp) && before(rp) && co.length) ? 'GUARDED' : 'UNGUARDED';
};
const curePath = join(ROOT, 'scripts/lib/decl-body.mjs');
const cureRaw = readFileSync(curePath, 'utf8');
console.log(`  baseline (as shipped):            ${parenOrdered(stripSource(cureRaw, false), MARKER.test(cureRaw))}`);

// The behaviour-preserving reorder: move the `braceSpanEnd` export block ABOVE `parenSpanEnd`.
// Both are top-level `export const` arrow helpers with no reference to each other, so swapping them
// cannot change behaviour in an ES module.
const lines = cureRaw.split('\n');
const findBlock = (name) => {
  const start = lines.findIndex((l) => l.startsWith(`export const ${name} =`));
  if (start < 0) return null;
  // include the preceding JSDoc block
  let docStart = start;
  while (docStart > 0 && (lines[docStart - 1].startsWith(' *') || lines[docStart - 1].startsWith('/**'))) docStart--;
  let end = start;
  while (end < lines.length && lines[end] !== '};') end++;
  return { docStart, end };
};
const pb = findBlock('parenSpanEnd'), bb = findBlock('braceSpanEnd');
if (!pb || !bb) { console.error('  CRIPPLE-BLOCKED — could not locate both helper blocks; no verdict.'); process.exit(5); }
const pText = lines.slice(pb.docStart, pb.end + 1), bText = lines.slice(bb.docStart, bb.end + 1);
const swapped = [...lines.slice(0, pb.docStart), ...bText, ...lines.slice(pb.end + 1, bb.docStart), ...pText, ...lines.slice(bb.end + 1)].join('\n');
const scratch = join(HERE, 'scratch');
mkdirSync(scratch, { recursive: true });
writeFileSync(join(scratch, 'decl-body.swapped.mjs'), swapped);
console.log(`  swapped a ${pText.length}-line and a ${bText.length}-line peer export block, no other edit`);
console.log(`  byte-length preserved: ${swapped.length === cureRaw.length}  (a pure reorder)`);
const sVerdict = parenOrdered(stripSource(swapped, false), MARKER.test(swapped));
console.log(`  paren-ordered verdict after the no-op reorder:  ${sVerdict}   (Q6 wants UNGUARDED)`);
console.log(`  unordered (live gate) verdict after the reorder: ${(() => { const c = stripSource(swapped, false); const lp = all(K.LPAREN, c), rp = all(K.RPAREN, c), co = all(K.COLON, c); return MARKER.test(swapped) ? 'MARKED' : (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED'; })()}   (the shipped gate is indifferent, as it should be)`);
console.log(`  scratch copy written to docs/research/unit-480guardorder-2026-11-18/scratch/decl-body.swapped.mjs`);
console.log('  NOTE: the tracked scripts/lib/decl-body.mjs was NOT edited; the reorder lives only in the scratch string.');
