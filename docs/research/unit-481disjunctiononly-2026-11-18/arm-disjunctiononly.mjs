#!/usr/bin/env node
/**
 * unit-481disjunctiononly arm — **how much of this seat's PUBLISHED census UNGUARDED verdict column
 * is the disjunction-only class Daedalus measured against his baseline?**
 *
 * Daedalus's `unit-480guardorder` arm B measured 18 of 68 tracked population members whose every
 * brace comparison sits in a `'(' || '[' || '{'` disjunction, and noted all 18 sit in the gate's
 * baseline. A baseline is an exemption list. `unit-469braceslice`'s UNGUARDED column is a **defect
 * count that was published and routed**, and the same key has never been run against it.
 *
 * Control discipline, same as his: **every key is captured out of the authoring file's source text
 * and `eval`'d, never re-typed** — the gate's comparison keys out of `scripts/verify-decl-body-
 * slicers.mjs`, and `DEPTH_LINE` plus its window constant out of his `arm-b.mjs`. Both member
 * lists are **captured off the two instruments' own stdout**, which this arm reads from the drive
 * files rather than re-deriving: a re-derived population would be grading my walk, not their
 * verdicts.
 *
 * brace-slicer-deliberate: this arm carries brace comparisons inside KP source strings on purpose —
 * they are the subject being classified, not a reader being used. (Requirement 3 of the gate.)
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const HIS_ARM = join(ROOT, 'docs/research/unit-480guardorder-2026-11-18/arm-b.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const DRIVE1 = join(HERE, 'drive1.census-at-head.out');
const DRIVE2 = join(HERE, 'drive2.his-armb-at-head.out');

const die = (code, msg) => { console.error(`\n${msg}`); process.exit(code); };

/* ================================================================ captured keys */
const gateSrc = readFileSync(GATE, 'utf8');
const hisSrc = readFileSync(HIS_ARM, 'utf8');
const capture = (label, re, src) => {
  const m = src.match(re);
  if (!m) die(3, `CAPTURE-FAILED — ${label}`);
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

// His key and his window, out of his file.
const depthLineSrc = capture('DEPTH_LINE', /const DEPTH_LINE = (\/[\s\S]*?\/);\n/, hisSrc);
// eslint-disable-next-line no-eval
const DEPTH_LINE = eval(depthLineSrc);
const WINDOW = Number(capture('his window constant', /lineEnd \+ (\d+)\)/, hisSrc));
if (!Number.isFinite(WINDOW) || WINDOW <= 0) die(3, 'CAPTURE-FAILED — window constant');

// **The mirror class, derived from his source text by substitution rather than written out.** His
// bracket class `[([{]` matches OPEN brackets only, so a CLOSE-brace comparison line can satisfy
// his key only by accident. The post-hoc V2 leg needs the close-bracket twin; it is built by
// replacing that one class, with the replacement count asserted so a silent no-op cannot pass.
const OPEN_CLASS = '[([{]';
const CLOSE_CLASS = '[)\\]}]';
const occ = depthLineSrc.split(OPEN_CLASS).length - 1;
if (occ !== 4) die(3, `CAPTURE-FAILED — expected 4 occurrences of the bracket class in DEPTH_LINE, saw ${occ}`);
// eslint-disable-next-line no-eval
const DEPTH_LINE_CLOSE = eval(depthLineSrc.split(OPEN_CLASS).join(CLOSE_CLASS));

const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };

/* ================================================================ his depthOnly, verbatim */
// His loop: every OPEN_BRACE site's line (+WINDOW chars of lookahead) must match DEPTH_LINE.
const siteTest = (code, sites, re) => {
  for (const i of sites) {
    const lineStart = code.lastIndexOf('\n', i) + 1;
    let lineEnd = code.indexOf('\n', i); if (lineEnd < 0) lineEnd = code.length;
    const window = code.slice(lineStart, Math.min(code.length, lineEnd + WINDOW));
    if (!re.test(window)) return false;
  }
  return true;
};

const classify = (raw) => {
  const code = stripSource(raw, false);
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  const inPop = ob.length > 0 && cb.length > 0;
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  const gateVerdict = !inPop ? 'OUT' : MARKER.test(raw) ? 'MARKED'
    : (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED';
  // HIS key, open-brace sites only
  const depthOnly = inPop && siteTest(code, ob, DEPTH_LINE);
  // P5, as pre-registered: the SAME key also applied to the close-brace sites
  const depthOnlyV1 = depthOnly && siteTest(code, cb, DEPTH_LINE);
  // POST-HOC V2: the close-brace sites graded against the mirror class
  const depthOnlyV2 = depthOnly && siteTest(code, cb, DEPTH_LINE_CLOSE);
  return { inPop, nOb: ob.length, nCb: cb.length, gateVerdict, depthOnly, depthOnlyV1, depthOnlyV2 };
};

/* ================================================================ KPs (R6) — before any figure */
console.log('=== KNOWN POSITIVES — is the V1/V2 distinction demonstrably satisfiable? (R6) ===');
const KPS = [
  ['KP-G', "let d=0;\nif (c === '(' || c === '[' || c === '{') d += 1;\nelse if (c === ')' || c === ']' || c === '}') d -= 1;\n",
    { depthOnly: true, depthOnlyV2: true }, 'pure two-sided bracket depth counter'],
  ['KP-H', "let d=0;\nif (c === '(' || c === '[' || c === '{') d += 1;\nconst end = (s[j] === '}') ? j : -1;\n",
    { depthOnly: true, depthOnlyV2: false }, 'open brace in a disjunction, close brace a naive slice END'],
  ['KP-I', "if (s[i] === '{') start = i;\nif (s[i] === '}') end = i;\n",
    { depthOnly: false, depthOnlyV2: false }, 'the naive slicer the gate exists to catch'],
];
let kpOk = true;
for (const [name, text, want, why] of KPS) {
  const got = classify(text);
  const pass = got.depthOnly === want.depthOnly && got.depthOnlyV2 === want.depthOnlyV2;
  if (!pass) kpOk = false;
  console.log(`  ${name}  his=${String(got.depthOnly).padEnd(5)} V1=${String(got.depthOnlyV1).padEnd(5)} V2=${String(got.depthOnlyV2).padEnd(5)}`
    + `  want his=${want.depthOnly}/V2=${want.depthOnlyV2}  ${pass ? 'PASS' : 'FAIL'}  — ${why}`);
}
if (!kpOk) die(4, 'KP-FAILED — the variant is not demonstrably different from his key. Nothing published.');

/* ================================================================ C1 — reproduce HIS 18 of 68 */
console.log('\n=== C1 — his figure, re-derived here, graded against his own driven stdout ===');
if (!existsSync(DRIVE2)) die(3, `CAPTURE-FAILED — ${DRIVE2} absent`);
const d2 = readFileSync(DRIVE2, 'utf8');
const m2 = d2.match(/multi-bracket depth counter: (\d+) of (\d+)/);
if (!m2) die(3, 'CAPTURE-FAILED — his depthOnly line not found in drive2 stdout');
const hisDepth = +m2[1], hisPop = +m2[2];

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const baseline = readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
const baselineSet = new Set(baseline);

const trackedRows = new Map();
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  trackedRows.set(rel, classify(raw));
}
const trackedPop = [...trackedRows].filter(([, r]) => r.inPop);
const mine = trackedPop.filter(([, r]) => r.depthOnly);
const okPop = trackedPop.length === hisPop;
const okDepth = mine.length === hisDepth;
console.log(`  population   mine ${String(trackedPop.length).padStart(3)}  his ${String(hisPop).padStart(3)}  ${okPop ? 'OK' : 'MISMATCH'}`);
console.log(`  depthOnly    mine ${String(mine.length).padStart(3)}  his ${String(hisDepth).padStart(3)}  ${okDepth ? 'OK' : 'MISMATCH'}`);
if (!okPop || !okDepth) die(3, 'CAPTURE-FAILED — my re-derivation of his key does not reproduce his driven figure. Nothing below is published (R1).');

const inBaseline = mine.filter(([rel]) => baselineSet.has(rel)).length;
const byVerdict = mine.reduce((a, [, r]) => (a[r.gateVerdict] = (a[r.gateVerdict] || 0) + 1, a), {});
console.log(`  P6 — of my ${mine.length}: baselined ${inBaseline}, gate verdicts ${JSON.stringify(byVerdict)}`);
const cure = trackedRows.get('scripts/lib/decl-body.mjs');
console.log(`  P7 — scripts/lib/decl-body.mjs depthOnly=${cure?.depthOnly} (want false), in population=${cure?.inPop}`);

/* ================================================================ C2 — capture the census column */
console.log('\n=== C2 — the census UNGUARDED column, captured off its own stdout ===');
if (!existsSync(DRIVE1)) die(3, `CAPTURE-FAILED — ${DRIVE1} absent`);
const d1 = readFileSync(DRIVE1, 'utf8');
const total = d1.match(/^\s+UNGUARDED:\s+(\d+)$/m);
if (!total) die(3, 'CAPTURE-FAILED — census UNGUARDED total line not found');
const censusUnguarded = [...d1.matchAll(/^\s+UNGUARDED (\S+)$/gm)].map((m) => m[1]);
console.log(`  printed total ${total[1]}  ·  captured members ${censusUnguarded.length}  `
  + `${+total[1] === censusUnguarded.length ? 'OK' : 'MISMATCH'}`);
if (+total[1] !== censusUnguarded.length) die(3, 'CAPTURE-FAILED — captured member list does not match the printed total (R2).');
const popTotal = d1.match(/SLICER \(also compares against a close brace\):\s+(\d+)/);
const walked = d1.match(/files walked: (\d+)/);
console.log(`  census at HEAD: walked ${walked?.[1]} · SLICER ${popTotal?.[1]} · UNGUARDED ${total[1]}`);

/* ================================================================ P3/P4 — the headline */
console.log('\n=== P3/P4 — how much of the published UNGUARDED column never slices a body? ===');
const rows = [];
for (const rel of censusUnguarded) {
  const abs = join(ROOT, rel);
  let raw; try { raw = readFileSync(abs, 'utf8'); } catch { rows.push({ rel, missing: true }); continue; }
  const c = classify(raw);
  rows.push({ rel, ...c, tracked: trackedRows.has(rel) });
}
const missing = rows.filter((r) => r.missing);
const dj = rows.filter((r) => r.depthOnly);
const pct = (n, d) => `${((n / d) * 100).toFixed(1)}%`;
console.log(`  census UNGUARDED members unreadable from this seat: ${missing.length} ${missing.map((r) => r.rel).join(' · ')}`);
console.log(`  P3 — disjunction-only (never slices a declaration body): ${dj.length} of ${rows.length}   (floor 15)`);
console.log(`  P4 — share: ${pct(dj.length, rows.length)}   (floor 25%)`);
for (const r of dj) console.log(`      DISJ-ONLY  tracked=${String(r.tracked).padEnd(5)} gate=${r.gateVerdict.padEnd(9)} ob=${String(r.nOb).padStart(2)} cb=${String(r.nCb).padStart(2)}  ${r.rel}`);

/* ================================================================ P5 / V2 */
console.log('\n=== P5 — his loop ranges over OPEN-brace sites only; his comment says "every brace comparison site" ===');
const v1 = dj.filter((r) => r.depthOnlyV1);
const v2 = dj.filter((r) => r.depthOnlyV2);
console.log(`  of the ${dj.length} disjunction-only members of the census column:`);
console.log(`      V1 (pre-registered: HIS key applied to the close-brace sites too): ${v1.length} survive`);
console.log(`      V2 (POST-HOC: close-brace sites graded against the MIRROR class):  ${v2.length} survive`);
const v1t = mine.filter(([, r]) => r.depthOnlyV1).length;
const v2t = mine.filter(([, r]) => r.depthOnlyV2).length;
console.log(`  same two variants over HIS tracked ${mine.length}: V1 ${v1t} · V2 ${v2t}   (P5 wants V1 < ${mine.length})`);
for (const r of dj.filter((x) => !x.depthOnlyV2)) console.log(`      V2-DROPS   ${r.rel}`);

/* ================================================================ P8 — the ignored gap */
console.log('\n=== P8 — do the .gitignore-only members contribute any disjunction-only verdict? ===');
const untrackedDj = dj.filter((r) => !r.tracked);
console.log(`  disjunction-only census-UNGUARDED members NOT in the gate's tracked population: ${untrackedDj.length}`);
for (const r of untrackedDj) console.log(`      UNTRACKED  ${r.rel}`);

/* ================================================================ cross-tab */
console.log('\n=== cross-tab: census UNGUARDED × gate verdict × disjunction-only ===');
const tab = {};
for (const r of rows.filter((x) => !x.missing)) {
  const k = `${r.tracked ? 'tracked' : 'ignored'} / gate=${r.gateVerdict} / disj=${r.depthOnly}`;
  tab[k] = (tab[k] || 0) + 1;
}
for (const [k, n] of Object.entries(tab).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${k}`);
console.log('\nARM COMPLETE');
