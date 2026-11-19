#!/usr/bin/env node
/**
 * unit-480guardorder arm — does an ORDERING conjunct on the gate's guard key move any verdict,
 * and is a file-level ordering key the right size of response?
 *
 * **The control comes first, because without it this is a rival reading rather than a measurement
 * of the gate.** Every key is CAPTURED out of `scripts/verify-decl-body-slicers.mjs`'s source text
 * at drive time — the `cmp` factory source, the five character arguments, `EXTS`, `SELF`, and the
 * `MARKER` regex — never re-typed here. The re-derived unordered classification is then graded
 * against the LIVE gate's own printed figures, passed in on argv. A mismatch exits CAPTURE-FAILED
 * rather than publishing: a hand-typed reader grading a shipped one is the defect this corpus has
 * filed repeatedly.
 *
 * brace-slicer-deliberate: this arm reproduces the gate's naive file-level guard key on purpose, in
 * order to measure what an ordered key would change. It carries both readers by construction.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');

/* ---------------------------------------------------------------- capture, not re-type */
const gateSrc = readFileSync(GATE, 'utf8');

function capture(label, re) {
  const m = gateSrc.match(re);
  if (!m) {
    console.error(`CAPTURE-FAILED — could not capture ${label} from ${GATE}`);
    process.exit(3);
  }
  return m[1];
}

// The cmp factory, captured verbatim out of the gate and EVALUATED rather than re-interpreted.
// Textually rebuilding it would mean re-implementing the template literal's own escape handling
// (`\\s`, `\``, `\\${ch}`) here — a second definition of the key, which is the whole defect class
// this unit is in. `eval` of the gate's own expression is the one way to get the gate's regex and
// not a lookalike. Only the `g` flag is added, off `.source`, so the pattern itself is untouched.
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const cmp = (ch) => new RegExp(cmpRaw(ch).source, 'g');
const cmpBody = cmpRaw('{').source;
// the five character arguments, in the gate's own order of definition
const chars = {};
for (const name of ['OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON']) {
  chars[name] = capture(name, new RegExp(`const ${name} = cmp\\('(.)'\\)`));
}
const KEYS = Object.fromEntries(Object.entries(chars).map(([k, ch]) => [k, cmp(ch)]));
const markerSrc = capture('MARKER', /const MARKER = \/(.*?)\/;/);
const MARKER = new RegExp(markerSrc);
const extsSrc = capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/);
const EXTS = new Set(extsSrc.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const selfSrc = capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\)/);
const SELF = new Set(selfSrc.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));

// the gate reads its population from the comments-blanked / strings-KEPT reading; same import, not
// a second definition of stripSource
const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

console.log('=== CAPTURE ===');
console.log(`  cmp body: ${cmpBody}`);
console.log(`  chars: ${JSON.stringify(chars)}`);
console.log(`  MARKER: /${markerSrc}/`);
console.log(`  EXTS: ${[...EXTS].join(' ')}`);
console.log(`  SELF: ${[...SELF].join(' ')}`);

/* ---------------------------------------------------------------- the tree */
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const baseline = existsSync(BASELINE)
  ? readFileSync(BASELINE, 'utf8').split('\n').map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean)
  : null;
if (baseline === null) { console.error('CAPTURE-FAILED — baseline missing'); process.exit(3); }
const baselineSet = new Set(baseline);

const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };

const rows = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw;
  try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const code = stripSource(raw, false);
  const ob = all(KEYS.OPEN_BRACE, code);
  const cb = all(KEYS.CLOSE_BRACE, code);
  if (ob.length === 0 || cb.length === 0) continue; // not a slicer: out of population
  const lp = all(KEYS.LPAREN, code);
  const rp = all(KEYS.RPAREN, code);
  const co = all(KEYS.COLON, code);
  const marked = MARKER.test(raw);

  // the gate's live key: file-level, unordered
  const unordered = marked ? 'MARKED'
    : (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED';
  // the candidate cure: each guard key must FIRST match before the FIRST brace comparison
  const firstBrace = ob[0];
  const before = (xs) => xs.some((i) => i < firstBrace);
  const ordered = marked ? 'MARKED'
    : (before(lp) && before(rp) && before(co)) ? 'GUARDED' : 'UNGUARDED';

  rows.push({ rel, unordered, ordered, ob, cb, lp, rp, co, marked, firstBrace });
}

/* ---------------------------------------------------------------- CONTROL: grade against the live gate */
const count = (k) => rows.filter((r) => r[k] === arguments).length;
const tally = (k) => rows.reduce((a, r) => (a[r[k]] = (a[r[k]] || 0) + 1, a), {});
const un = tally('unordered');
const readable = tracked.filter((f) => EXTS.has(extname(f))).length;
const expected = {
  tracked: Number(process.argv[2]), population: Number(process.argv[3]),
  UNGUARDED: Number(process.argv[4]), MARKED: Number(process.argv[5]), GUARDED: Number(process.argv[6]),
};
console.log('\n=== CONTROL — re-derived unordered key vs the LIVE gate\'s printed figures ===');
const got = { tracked: readable, population: rows.length, UNGUARDED: un.UNGUARDED || 0, MARKED: un.MARKED || 0, GUARDED: un.GUARDED || 0 };
let ok = true;
for (const k of Object.keys(expected)) {
  const good = got[k] === expected[k];
  if (!good) ok = false;
  console.log(`  ${k.padEnd(12)} captured ${String(got[k]).padStart(4)}  live ${String(expected[k]).padStart(4)}  ${good ? 'OK' : 'MISMATCH'}`);
}
if (!ok) {
  console.error('\nCAPTURE-FAILED — the re-derived reader does not reproduce the live gate. Nothing below is published.');
  process.exit(3);
}
console.log('  → the reader below IS the gate\'s reader.');

/* ---------------------------------------------------------------- KPs */
console.log('\n=== KNOWN POSITIVES ===');
const kp = (name, text, wantUn, wantOrd) => {
  const code = stripSource(text, false);
  const ob = all(KEYS.OPEN_BRACE, code), cb = all(KEYS.CLOSE_BRACE, code);
  const lp = all(KEYS.LPAREN, code), rp = all(KEYS.RPAREN, code), co = all(KEYS.COLON, code);
  const inPop = ob.length > 0 && cb.length > 0;
  const u = !inPop ? 'OUT' : (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED';
  const o = !inPop ? 'OUT' : ([lp, rp, co].every((xs) => xs.some((i) => i < ob[0]))) ? 'GUARDED' : 'UNGUARDED';
  const pass = u === wantUn && o === wantOrd;
  console.log(`  ${name.padEnd(6)} unordered=${u.padEnd(9)} ordered=${o.padEnd(9)} want ${wantUn}/${wantOrd}  ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
};
// KP-A: guards AFTER the brace comparison — the whole point of the ordered key
const kpa = kp('KP-A', `
  let i = 0; while (s[i] !== '{') i++;         // the brace scan
  if (s[j] === '(' ) depth++;                  // guard, too late
  if (s[j] === ')' ) depth--;
  if (s[j] === ':' ) seen = true;
  if (s[k] === '}') done = true;
`, 'GUARDED', 'UNGUARDED');
// KP-B: guards BEFORE the brace comparison
const kpb = kp('KP-B', `
  if (s[j] === '(' ) depth++;
  if (s[j] === ')' ) depth--;
  if (s[j] === ':' ) seen = true;
  let i = 0; while (s[i] !== '{') i++;
  if (s[k] === '}') done = true;
`, 'GUARDED', 'GUARDED');
// KP-C: the shared cure delegates, so it is out of the population under BOTH keys
const kpc = (() => {
  const text = readFileSync(join(ROOT, 'scripts/lib/decl-body.mjs'), 'utf8');
  const code = stripSource(text, false);
  const ob = all(KEYS.OPEN_BRACE, code), cb = all(KEYS.CLOSE_BRACE, code);
  const out = !(ob.length && cb.length);
  console.log(`  KP-C   scripts/lib/decl-body.mjs in population: ${!out}  want false  ${out ? 'PASS' : 'FAIL'}`);
  return out;
})();
if (!(kpa && kpb)) {
  console.error('\nKP-FAILED — the ordered key is not demonstrably satisfiable in both directions.'
    + ' A zero-mover result would be indistinguishable from an unsatisfiable key. Nothing published.');
  process.exit(4);
}

/* ---------------------------------------------------------------- the measurement */
console.log('\n=== P1/P2 — cross-tab, unordered (live gate) × ordered (candidate cure) ===');
const xt = {};
for (const r of rows) { const k = `${r.unordered} → ${r.ordered}`; xt[k] = (xt[k] || 0) + 1; }
for (const [k, n] of Object.entries(xt).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(26)} ${n}`);
const movers = rows.filter((r) => r.unordered !== r.ordered);
const upward = movers.filter((r) => r.unordered === 'UNGUARDED' && r.ordered === 'GUARDED');
console.log(`  movers: ${movers.length} · UNGUARDED→GUARDED: ${upward.length} (P1 wants 0)`);
console.log(`  of the ${rows.filter((r) => r.unordered === 'GUARDED').length} gate-GUARDED files, ${movers.filter((r) => r.unordered === 'GUARDED').length} move (P2 wants 1)`);

console.log('\n=== the movers, with offsets ===');
for (const r of movers) {
  console.log(`  ${r.rel}`);
  console.log(`      first OPEN_BRACE comparison at char ${r.firstBrace} (of ${r.ob.length} brace comparison(s))`);
  for (const [n, xs] of [['LPAREN', r.lp], ['RPAREN', r.rp], ['COLON', r.co]]) {
    const b = xs.filter((i) => i < r.firstBrace), a = xs.filter((i) => i > r.firstBrace);
    console.log(`      ${n.padEnd(7)} nearest BEFORE ${b.length ? b[b.length - 1] : 'null'} · nearest AFTER ${a.length ? a[0] : 'null'}`
      + (a.length && !b.length ? `   ← ${a[0] - r.firstBrace} chars AFTER the brace comparison, none before it` : ''));
  }
  console.log(`      in baseline: ${baselineSet.has(r.rel)}   (P3 wants false)`);
}

console.log('\n=== P3 — what the ordered gate would exit ===');
const ordUnguarded = rows.filter((r) => r.ordered === 'UNGUARDED').map((r) => r.rel);
const ordNew = ordUnguarded.filter((f) => !baselineSet.has(f));
const ordStale = baseline.filter((f) => (rows.find((r) => r.rel === f)?.ordered) !== 'UNGUARDED');
console.log(`  ordered UNGUARDED: ${ordUnguarded.length} · NEW (not baselined): ${ordNew.length} · stale baseline entries: ${ordStale.length}`);
console.log(`  → ordered gate exit would be ${ordNew.length || ordStale.length ? 1 : 0}`);
for (const f of ordNew) console.log(`      NEW: ${f}`);

console.log('\n=== P4/P5 — what the conjunct must NOT move ===');
const ord = tally('ordered');
console.log(`  MARKED unordered ${un.MARKED || 0} → ordered ${ord.MARKED || 0}  (P4 wants equal)`);
console.log(`  population ${rows.length} (P5 wants 66) · tracked files read ${readable}`);

console.log('\n=== P6 — is a FILE-level ordering key the right size? ===');
const multi = rows.filter((r) => r.ob.length >= 2);
console.log(`  population members with ≥2 OPEN_BRACE comparisons: ${multi.length} of ${rows.length}  (P6 wants ≥5)`);
const histo = {};
for (const r of rows) { const k = Math.min(r.ob.length, 5); histo[k] = (histo[k] || 0) + 1; }
for (const k of Object.keys(histo).sort()) console.log(`      ${k === '5' ? '5+' : k} brace comparison(s): ${histo[k]}`);

console.log('\n=== P7 — site-level residue among files the ORDERED key still calls GUARDED ===');
// Stated honestly: as written, P7 is unsatisfiable under a file-level reading — a guard that
// precedes the FIRST brace comparison precedes every later one. The measurable question it was
// reaching for is site-level: a brace comparison with no guard comparison in the preceding WINDOW.
const WINDOW = 400;
const stillGuarded = rows.filter((r) => r.ordered === 'GUARDED');
let residue = 0;
for (const r of stillGuarded) {
  const bad = r.ob.filter((i) => ![r.lp, r.rp, r.co].every((xs) => xs.some((j) => j < i && i - j <= WINDOW)));
  if (bad.length) { residue++; console.log(`  ${r.rel}: ${bad.length} of ${r.ob.length} brace site(s) with no full guard set within ${WINDOW} chars before`); }
}
console.log(`  files with site-level residue: ${residue} of ${stillGuarded.length} ordered-GUARDED`);

console.log('\n=== P8 — order vs distance, on the 3 gate-GUARDED files ===');
for (const r of rows.filter((x) => x.unordered === 'GUARDED')) {
  const dist = [r.lp, r.rp, r.co].map((xs) => Math.min(...xs.map((i) => Math.abs(i - r.firstBrace))));
  const withinWindow = dist.every((d) => d <= WINDOW);
  console.log(`  ${r.rel}`);
  console.log(`      ordered verdict ${r.ordered} · min |distance| L/R/C = ${dist.join(' / ')} · all within ${WINDOW}: ${withinWindow}`);
}
console.log(`\nKP-C (shared cure stays out of population): ${kpc ? 'PASS' : 'FAIL'}`);
