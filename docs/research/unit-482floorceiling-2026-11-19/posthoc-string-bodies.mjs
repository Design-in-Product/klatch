#!/usr/bin/env node
/**
 * unit-482floorceiling POST-HOC leg 2 — NOT predicted, found while naming D1's sites in drive2.
 *
 * `scripts/verify-decl-body-slicers.mjs` calls `stripSource(raw, false)`, and `blankStrings: false`
 * is the reading that KEEPS string bodies (`scripts/lib/strip-source.mjs` docblock, "Two readings,
 * one scanner"). So a brace comparison written inside a quoted KP fixture is counted as a brace
 * comparison in the file that quotes it. drive2 shows this concretely for
 * `unit-480guardorder-2026-11-18/arm-b.mjs`: both of its "comparison sites" are inside the
 * double-quoted fixture arguments of `kp('KP-E', …)` and `kp('KP-F', …)`.
 *
 * This leg measures the size of that effect over the whole population: how many members are in it
 * ONLY under the string-keeping reading, and how the verdict columns move under the other reading.
 *
 * CONTROL: the string-keeping column is re-derived here and must reproduce the live gate's five
 * figures, exactly as the arm's does, before anything is printed about the other column.
 *
 * brace-slicer-deliberate: carries naive brace-comparison readers on purpose — the subject, not a
 * tool.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const gateSrc = readFileSync(GATE, 'utf8');

const capture = (label, re, src) => {
  const m = src.match(re); if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); }
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

const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

// The gate's own argument, captured rather than assumed: which reading does it ask for?
//
// **This capture was wrong on its first drive and the wrongness is kept as `drive3`** (rc=3). A bare
// `/(stripSource\([^)]*\))/` over the gate's RAW source matched `stripSource(raw, true)` at `:127` —
// a string inside the gate's own DOCBLOCK, describing the Drive-13 defect it repaired — and the
// guard aborted the leg claiming the tree had moved. The live call is at `:137` and is
// `stripSource(raw, false)`. A source-scanning reader that reads comments as code is exactly the
// defect `strip-source.mjs` exists to answer, so the capture now runs against the comments-blanked
// reading, and anchors on the assignment rather than on the call text alone.
const gateCode = stripSource(gateSrc, false);
const gateCall = capture('gate stripSource call', /(const code = stripSource\([^)]*\))/, gateCode);
console.log(`=== the gate's own reading, captured from its comments-blanked source: ${gateCall}`);
if (!/false/.test(gateCall)) {
  console.error('CAPTURE-FAILED — the gate no longer asks for the string-KEEPING reading; this leg is about a tree that has moved.');
  process.exit(3);
}
const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const baselineSet = new Set(readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean));

const verdictUnder = (code, raw) => {
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  if (!ob.length || !cb.length) return { v: 'OUT', ob: ob.length, cb: cb.length };
  if (MARKER.test(raw)) return { v: 'MARKED', ob: ob.length, cb: cb.length };
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  return { v: (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED', ob: ob.length, cb: cb.length };
};

const rows = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const keep = verdictUnder(stripSource(raw, false), raw);   // the gate's reading
  const blank = verdictUnder(stripSource(raw, true), raw);   // strings blanked too
  rows.push({ rel, keep, blank });
}

/* ---- CONTROL — the gate's column must reproduce the live gate ------------------------------- */
const popKeep = rows.filter((r) => r.keep.v !== 'OUT');
const t = (rs, k) => rs.reduce((a, r) => (a[r[k].v] = (a[r[k].v] || 0) + 1, a), {});
const vk = t(popKeep, 'keep');
const readable = tracked.filter((f) => EXTS.has(extname(f))).length;
const exp = { tracked: +process.argv[2], population: +process.argv[3], UNGUARDED: +process.argv[4], MARKED: +process.argv[5], GUARDED: +process.argv[6] };
const got = { tracked: readable, population: popKeep.length, UNGUARDED: vk.UNGUARDED || 0, MARKED: vk.MARKED || 0, GUARDED: vk.GUARDED || 0 };
console.log('\n=== CONTROL — the string-KEEPING column vs the LIVE gate ===');
let ok = true;
for (const k of Object.keys(exp)) {
  const good = got[k] === exp[k]; if (!good) ok = false;
  console.log(`  ${k.padEnd(11)} captured ${String(got[k]).padStart(4)}  live ${String(exp[k]).padStart(4)}  ${good ? 'OK' : 'MISMATCH'}`);
}
if (!ok) { console.error('\nCAPTURE-FAILED — nothing below is published.'); process.exit(3); }

/* ---- KP — the effect is demonstrable on a hand-built fixture -------------------------------- */
console.log('\n=== KNOWN POSITIVE — a file whose ONLY brace comparison is inside a quoted fixture ===');
const KPK = `const fixture = "if (s[i] === '{') d++; if (s[i] === '}') d--;";\nexport const run = () => fixture.length;`;
const kpKeep = verdictUnder(stripSource(KPK, false), KPK);
const kpBlank = verdictUnder(stripSource(KPK, true), KPK);
console.log(`  KP-K  string-keeping: ${kpKeep.v} (${kpKeep.ob} open-brace site(s))  ·  strings-blanked: ${kpBlank.v} (${kpBlank.ob})`);
const kpPass = kpKeep.v !== 'OUT' && kpBlank.v === 'OUT';
console.log(`  KP-K  ${kpPass ? 'PASS' : 'FAIL'} — the reading, not the reader, decides membership`);
if (!kpPass) { console.error('\nKP-FAILED — nothing published.'); process.exit(4); }

/* ---- the measurement ------------------------------------------------------------------------ */
const dropped = popKeep.filter((r) => r.blank.v === 'OUT');
const added = rows.filter((r) => r.keep.v === 'OUT' && r.blank.v !== 'OUT');
const vb = t(rows.filter((r) => r.blank.v !== 'OUT'), 'blank');
console.log('\n=== MEASUREMENT — how much of the population is string-literal text? ===');
console.log(`  population, gate's string-keeping reading:   ${popKeep.length}`);
console.log(`  population, strings-blanked reading:         ${rows.filter((r) => r.blank.v !== 'OUT').length}`);
console.log(`  members present ONLY under the gate's reading: ${dropped.length}`);
console.log(`  members present ONLY under strings-blanked:    ${added.length}   (must be 0 — blanking can only remove matches)`);
console.log(`  verdict columns  keeping: UNGUARDED ${vk.UNGUARDED || 0} · MARKED ${vk.MARKED || 0} · GUARDED ${vk.GUARDED || 0}`);
console.log(`                   blanked: UNGUARDED ${vb.UNGUARDED || 0} · MARKED ${vb.MARKED || 0} · GUARDED ${vb.GUARDED || 0}`);
console.log('\n  the members that are in the population only because a STRING contains the comparison:');
for (const r of dropped) {
  console.log(`      ${r.keep.v.padEnd(9)} ${baselineSet.has(r.rel) ? 'baselined' : '  —      '}  ${r.keep.ob} site(s)  ${r.rel}`);
}
const droppedBaselined = dropped.filter((r) => baselineSet.has(r.rel));
console.log(`\n  of those, sitting in the baseline as "a known unguarded slicer added on purpose": ${droppedBaselined.length}`);
console.log(`  of those, MARKED (declared naive on purpose): ${dropped.filter((r) => r.keep.v === 'MARKED').length} of ${vk.MARKED || 0}`);
