#!/usr/bin/env node
/**
 * unit-484popnarrow ARM — what the population narrowing moves, measured before it lands.
 *
 * Reader: `blankLongStrings` from `scripts/lib/strip-source.mjs` (the cure, imported — not a copy).
 * Keys: CAPTURED out of `scripts/verify-decl-body-slicers.mjs`, so the thing graded is the live
 * gate's own key family and not a re-typing of it (`feedback_slicing_the_inputs_but_retyping_the_verdict`).
 * Subject: the tracked tree.
 *
 * Refusal is TWO independent conditions plus a third, per Theseus's `unit-483` §5 — a fixture can
 * occupy a corner of a key matrix for the wrong reason, and corner coverage alone cannot tell that
 * from the registered reason:
 *   1. every KP lands on its registered side under BOTH readings, AND
 *   2. every KP's registered OPEN_BRACE SITE COUNT under both readings matches, AND
 *   3. three distinct corners are occupied.
 * The arm publishes nothing unless all three hold and the CONTROL column reproduces the live gate.
 *
 * brace-slicer-deliberate: carries quoted naive brace-comparison fixtures on purpose — they are the
 * subject of the measurement, not a tool of it.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const { stripSource, blankLongStrings } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

/* ---- the keys, captured out of the gate ----------------------------------------------------- */
const gateSrc = readFileSync(GATE, 'utf8');
const capture = (label, re) => {
  const m = gateSrc.match(re);
  if (!m) { console.error(`CAPTURE-FAILED — ${label} not found in the gate source.`); process.exit(3); }
  return m[1];
};
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const g = (ch) => new RegExp(cmpRaw(ch).source, 'g');
const K = {};
for (const n of ['OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON']) {
  K[n] = g(capture(n, new RegExp(`const ${n} = cmp\\('(.)'\\)`)));
}
const MARKER = new RegExp(capture('MARKER', /const MARKER = \/(.*?)\/;/));
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
console.log(`=== keys captured out of the gate: ${Object.keys(K).join(', ')}`);
console.log(`    EXTS ${EXTS.size} · SELF ${SELF.size} · MARKER ${MARKER.source}`);

const count = (re, s) => { re.lastIndex = 0; let n = 0; while (re.exec(s)) n += 1; return n; };
/** The gate's own three-way classification, over whichever reading is handed in. */
const verdict = (code, raw) => {
  const ob = count(K.OPEN_BRACE, code), cb = count(K.CLOSE_BRACE, code);
  if (!ob || !cb) return { v: 'OUT', ob };
  if (MARKER.test(raw)) return { v: 'MARKED', ob };
  const guarded = count(K.LPAREN, code) && count(K.RPAREN, code) && count(K.COLON, code);
  return { v: guarded ? 'GUARDED' : 'UNGUARDED', ob };
};
const wide = (raw) => verdict(stripSource(raw, false), raw);
const narrow = (raw) => verdict(blankLongStrings(raw, 2), raw);

/* ---- KPs ------------------------------------------------------------------------------------ */
const KP_L = "let d = 0;\nfor (const c of s) {\n  if (c === '{') d += 1;\n  if (c === '}') d -= 1;\n}\n";
const KP_M = 'const fixture = "if (s[i] === \'{\') d += 1; if (s[i] === \'}\') d -= 1;";\n'
  + 'export const run = () => fixture.length;\n';
const KP_N = KP_L + KP_M;
const KP_Q = "if (c === '\\u007b') d += 1;\nif (c === '\\u007d') d -= 1;\n";
const KPS = [
  { name: 'KP-L', text: KP_L, wideIn: true, narrowIn: true, wideOb: 1, narrowOb: 1,
    why: 'a real two-sided depth counter — 1-char operands KEPT' },
  { name: 'KP-M', text: KP_M, wideIn: true, narrowIn: false, wideOb: 1, narrowOb: 0,
    why: 'the identical comparison inside a quoted multi-char fixture — BLANKED' },
  { name: 'KP-N', text: KP_N, wideIn: true, narrowIn: true, wideOb: 2, narrowOb: 1,
    why: 'both in one file — the real reader survives beside the fixture' },
  { name: 'KP-Q', text: KP_Q, wideIn: false, narrowIn: false, wideOb: 0, narrowOb: 0,
    why: 'P8: the escaped spelling was ALREADY unreachable under the gate reading' },
];
console.log('\n=== KNOWN POSITIVES — sides AND site counts AND corner coverage ===');
let kpOk = true;
const corners = new Set();
for (const kp of KPS) {
  const w = wide(kp.text), nv = narrow(kp.text);
  const wIn = w.v !== 'OUT', nIn = nv.v !== 'OUT';
  const sideOk = wIn === kp.wideIn && nIn === kp.narrowIn;
  const obOk = w.ob === kp.wideOb && nv.ob === kp.narrowOb;
  if (!sideOk || !obOk) kpOk = false;
  corners.add(`${wIn}/${nIn}`);
  console.log(`  ${kp.name}  wide ${String(wIn).padEnd(5)} (ob ${w.ob}, want ${kp.wideOb})`
    + `  narrow ${String(nIn).padEnd(5)} (ob ${nv.ob}, want ${kp.narrowOb})`
    + `  side ${sideOk ? 'PASS' : 'FAIL'} count ${obOk ? 'PASS' : 'FAIL'}   ${kp.why}`);
}
console.log(`  corners occupied: ${corners.size} — ${[...corners].sort().join(' ')}`);
if (!kpOk) { console.error('\nKP-FAILED — a fixture missed its registered side or site count. Nothing published.'); process.exit(4); }
if (corners.size !== 3) { console.error(`\nKP-FAILED — ${corners.size} corners occupied, 3 registered. Nothing published.`); process.exit(4); }

/* ---- CONTROL (R2) --------------------------------------------------------------------------- */
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const baseline = readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
const baselineSet = new Set(baseline);

const rows = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  rows.push({ rel, w: wide(raw), n: narrow(raw) });
}
const popWide = rows.filter((r) => r.w.v !== 'OUT');
const tally = (rs, k) => rs.reduce((a, r) => (a[r[k].v] = (a[r[k].v] || 0) + 1, a), {});
const tw = tally(popWide, 'w');
const got = {
  tracked: tracked.filter((f) => EXTS.has(extname(f))).length,
  population: popWide.length,
  UNGUARDED: tw.UNGUARDED || 0, MARKED: tw.MARKED || 0, GUARDED: tw.GUARDED || 0,
};
const exp = {
  tracked: +process.argv[2], population: +process.argv[3],
  UNGUARDED: +process.argv[4], MARKED: +process.argv[5], GUARDED: +process.argv[6],
};
console.log('\n=== CONTROL — the wide column vs the LIVE gate (figures from drive0, passed in) ===');
let ctlOk = true;
for (const k of Object.keys(exp)) {
  const ok = got[k] === exp[k]; if (!ok) ctlOk = false;
  console.log(`  ${k.padEnd(11)} captured ${String(got[k]).padStart(4)}  live ${String(exp[k]).padStart(4)}  ${ok ? 'OK' : 'MISMATCH'}`);
}
if (!ctlOk) { console.error('\nCAPTURE-FAILED — the arm does not reproduce the live gate. Nothing below is published.'); process.exit(3); }

/* ---- the measurement ------------------------------------------------------------------------ */
const popNarrow = rows.filter((r) => r.n.v !== 'OUT');
const tn = tally(popNarrow, 'n');
const dropped = rows.filter((r) => r.w.v !== 'OUT' && r.n.v === 'OUT');
const added = rows.filter((r) => r.w.v === 'OUT' && r.n.v !== 'OUT');

console.log('\n=== P1/P6 — the population under each reading ===');
console.log(`  population wide   (all string bodies kept):  ${popWide.length}`
  + `   UNGUARDED ${tw.UNGUARDED || 0} · MARKED ${tw.MARKED || 0} · GUARDED ${tw.GUARDED || 0}`);
console.log(`  population narrow (bodies >= 2 blanked):     ${popNarrow.length}`
  + `   UNGUARDED ${tn.UNGUARDED || 0} · MARKED ${tn.MARKED || 0} · GUARDED ${tn.GUARDED || 0}`);
console.log(`  P1 dropped: ${dropped.length}   (registered 4..8, point estimate 5)`);
console.log(`  P4 added:   ${added.length}   (registered 0 — the fourth corner must be unreachable)`);

console.log('\n=== P2 — the dropped members, named, with baseline membership ===');
for (const r of dropped) {
  console.log(`  ${r.w.v.padEnd(9)} ${baselineSet.has(r.rel) ? 'BASELINED' : '    —    '}`
    + `  ob ${r.w.ob} -> ${r.n.ob}   ${r.rel}`);
}
const droppedBaselined = dropped.filter((r) => baselineSet.has(r.rel));
const droppedMarked = dropped.filter((r) => r.w.v === 'MARKED');
console.log(`  of the dropped: BASELINED ${droppedBaselined.length} of ${baseline.length}`
  + ` · MARKED ${droppedMarked.length} of ${tw.MARKED || 0}`
  + ` · UNGUARDED-unbaselined ${dropped.filter((r) => r.w.v === 'UNGUARDED' && !baselineSet.has(r.rel)).length}`);
if (added.length) {
  console.log('\n  P4 REFUTED — members present only under the NARROW reading:');
  for (const r of added) console.log(`      ${r.n.v} ${r.rel}`);
}

console.log('\n=== P5 — the shared cure must stay in the population and stay GUARDED ===');
const cure = rows.find((r) => r.rel === 'scripts/lib/decl-body.mjs');
console.log(`  scripts/lib/decl-body.mjs   wide ${cure.w.v}  narrow ${cure.n.v}`
  + `  (narrow must be GUARDED)   ${cure.n.v === 'GUARDED' ? 'HIT' : 'REFUTED'}`);

console.log('\n=== P3/P7 — what the gate would print, before and after the migration ===');
const newWide = popWide.filter((r) => r.w.v === 'UNGUARDED' && !baselineSet.has(r.rel)).map((r) => r.rel);
const newNarrow = popNarrow.filter((r) => r.n.v === 'UNGUARDED' && !baselineSet.has(r.rel)).map((r) => r.rel);
const narrowV = new Map(rows.map((r) => [r.rel, r.n.v]));
const staleWide = baseline.filter((f) => (rows.find((r) => r.rel === f)?.w.v) !== 'UNGUARDED');
const staleNarrow = baseline.filter((f) => narrowV.get(f) !== 'UNGUARDED');
console.log(`  newOnes wide ${newWide.length} · narrow ${newNarrow.length}   (P7: both 0)`);
for (const f of newNarrow) console.log(`      new under narrow: ${f}`);
console.log(`  stale   wide ${staleWide.length} · narrow ${staleNarrow.length}   (P3: narrow > 0 before the migration)`);
for (const f of staleNarrow) {
  console.log(`      stale under narrow: ${f}  -> now ${narrowV.get(f) ?? 'ABSENT'}`);
}
console.log(`\n  P3 predicts the cure WITHOUT the migration prints rc=1 with exactly these`
  + ` ${staleNarrow.length} stale entr${staleNarrow.length === 1 ? 'y' : 'ies'} and 0 new slicers.`);
console.log(`  P6 predicts that after removing them the gate prints: population ${popNarrow.length}`
  + ` · UNGUARDED ${tn.UNGUARDED || 0} · MARKED ${tn.MARKED || 0} · GUARDED ${tn.GUARDED || 0}`
  + ` · baseline ${baseline.length - staleNarrow.length}`);

/* ---- POST-HOC, UNREGISTERED: would narrowing the GUARD key too move a verdict? --------------- */
// Not pre-registered, and labelled so. The registered cure narrows the POPULATION key only, which
// leaves the gate reading two keys from two readings — the shape its own drive-13 docblock warns
// about. If the guard key moves nobody under the narrow reading, the gate can use ONE reading
// throughout and the incoherence never ships. If it moves somebody, that is a verdict change inside
// the population and a separate item, because a GUARDED -> UNGUARDED move can REDDEN a file and P7
// only covers removals.
console.log('\n=== POST-HOC (unregistered) — the guard key under the narrow reading ===');
const guardMoves = popNarrow.filter((r) => {
  const raw = readFileSync(join(ROOT, r.rel), 'utf8');
  const wv = verdict(stripSource(raw, false), raw).v;
  return wv !== r.n.v && wv !== 'OUT';
});
console.log(`  members whose VERDICT differs between the readings (excluding departures): ${guardMoves.length}`);
for (const r of guardMoves) console.log(`      ${r.rel}  wide ${r.w.v} -> narrow ${r.n.v}`);
console.log('  0 means the gate may read ONE reading for every key with no verdict cost.');
