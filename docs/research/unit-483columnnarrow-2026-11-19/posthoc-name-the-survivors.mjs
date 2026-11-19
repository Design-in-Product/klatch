#!/usr/bin/env node
/**
 * unit-483columnnarrow POST-HOC — **name the 39 survivors' classes instead of reporting them as a
 * verdict histogram.**
 *
 * The arm's P5 line printed `survivors by live gate verdict: {"GUARDED":1,"UNGUARDED":34,"MARKED":4}`.
 * A verdict histogram cannot say WHICH member is the GUARDED one, and the whole reason that cell
 * matters is that `unit-481` established by hand which file it should be — the `round401` file where
 * the gate's GUARDED is right and this seat's census UNGUARDED is wrong. Reading that off the count
 * would be inferring the member from the number (`feedback_a_verdict_level_matrix_marks_a_cell_hit_
 * while_its_note_is_false`).
 *
 * This leg re-runs the arm's own classifier by importing nothing: it shells the arm and parses the
 * arm's stdout, then names each survivor class from the live gate's own verdict. No new key.
 *
 * brace-slicer-deliberate: no brace comparison is used as a reader here; the arm's stdout is parsed.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const PUBLISHED = join(ROOT, 'docs/research/unit-481disjunctiononly-2026-11-18/drive1.census-at-head.out');
const ARM_OUT = join(HERE, 'drive2.arm.out');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');

const die = (code, msg) => { console.error(`\n${msg}`); process.exit(code); };
const capture = (label, re, src) => { const m = src.match(re); if (!m) die(3, `CAPTURE-FAILED — ${label}`); return m[1]; };

if (!existsSync(ARM_OUT)) die(3, `CAPTURE-FAILED — ${ARM_OUT} absent; drive the arm first.`);
const armOut = readFileSync(ARM_OUT, 'utf8');
const pub = readFileSync(PUBLISHED, 'utf8');

/* the published column and the two narrowed sets, all three read off stdout, none re-derived */
const column = [...pub.matchAll(/^\s+UNGUARDED (\S+)$/gm)].map((m) => m[1]);
const kDepth = new Set([...armOut.matchAll(/^\s+K-DEPTH\s+gate=\S+\s+ob=\s*\d+ cb=\s*\d+\s+(\S+)$/gm)].map((m) => m[1]));
const kQuoted = new Set([...armOut.matchAll(/^\s+K-QUOTED\s+gate=\S+\s+baselined=\S+\s+ob \d+->\d+ cb \d+->\d+\s+(\S+)$/gm)].map((m) => m[1]));
if (!kDepth.size || !kQuoted.size) die(3, 'CAPTURE-FAILED — could not capture the arm\'s two member lists off its stdout');
const survivors = column.filter((rel) => !kDepth.has(rel) && !kQuoted.has(rel));
console.log(`published column ${column.length} · K-DEPTH ${kDepth.size} · K-QUOTED ${kQuoted.size} · survivors ${survivors.length}`);

/* the live gate's own verdict, its keys captured out of the gate */
const gateSrc = readFileSync(GATE, 'utf8');
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
const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));
const baselineSet = new Set(readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean));
const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };

const verdict = (rel) => {
  const raw = readFileSync(join(ROOT, rel), 'utf8');
  const code = stripSource(raw, false);
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  if (!ob.length || !cb.length) return 'OUT';
  if (MARKER.test(raw)) return 'MARKED';
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  return (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED';
};

const byClass = new Map();
for (const rel of survivors) {
  const v = verdict(rel);
  if (!byClass.has(v)) byClass.set(v, []);
  byClass.get(v).push(rel);
}
console.log('\n=== the survivors, NAMED by live gate verdict ===');
for (const [v, members] of [...byClass].sort((a, b) => a[1].length - b[1].length)) {
  console.log(`\n  ${v} — ${members.length} member(s)`);
  for (const rel of members) console.log(`      baselined=${String(baselineSet.has(rel)).padEnd(5)} ${rel}`);
  if (v === 'UNGUARDED' && members.length > 12) console.log(`      (… the undeclared class; listed in full above)`);
}

const guarded = byClass.get('GUARDED') || [];
const marked = byClass.get('MARKED') || [];
console.log('\n=== what the survivor count is, and is not ===');
console.log(`  survivors:                                         ${survivors.length}`);
console.log(`  of those, gate=GUARDED — the two instruments disagree and unit-481 hand-read the gate`);
console.log(`  as RIGHT, so this is a false census verdict NEITHER key reaches: ${guarded.length}  ${guarded.join(' · ')}`);
console.log(`  of those, gate=MARKED — a naive slicer DECLARED at the site, so the census is right`);
console.log(`  about it and the gate merely knows why:                          ${marked.length}`);
console.log(`  remaining undeclared unguarded slicers:                          ${survivors.length - guarded.length - marked.length}`);
console.log('\nrc=0');
