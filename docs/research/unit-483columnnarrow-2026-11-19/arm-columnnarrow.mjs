#!/usr/bin/env node
/**
 * unit-483columnnarrow arm — **narrow this seat's PUBLISHED census UNGUARDED column of 58 by the two
 * mechanisms that have been established against it, and re-publish the figure.**
 *
 * Routed by Daedalus's 11/19 START memo §6: *"Take unit-469's narrowing — it's yours, keyed on the
 * bracket class per your own §3 … narrow it to what the key does support, which after §4 is one
 * sentence shorter than it looks."*
 *
 * TWO KEYS, two mechanisms, deliberately not fused (see `feedback_an_undifferentiated_containment_
 * match_fuses_two_mechanisms`):
 *
 *   K-DEPTH   every OPEN-brace comparison site satisfies Daedalus's DEPTH_LINE in its window AND
 *             every CLOSE-brace site satisfies the MIRROR class. `unit-481` §3 established that the
 *             mechanism is the character CLASS, not the loop range — a close-brace comparison cannot
 *             satisfy an open-bracket disjunction however the loop ranges.
 *   K-QUOTED  the member leaves the population when string bodies of length >= 2 are blanked and
 *             length-1 bodies kept. `unit-482` §4's reading, CAPTURED out of his
 *             `posthoc-quoted-fixtures.mjs` rather than re-implemented.
 *
 * SUBJECT A is FROZEN: the 58 UNGUARDED members captured off
 * `unit-481disjunctiononly-2026-11-18/drive1.census-at-head.out`, the stamped recording of the column
 * this seat published and routed. SUBJECT B (the live census, driven this fire) is a drift check
 * only and is EXPECTED to contain this arm's own file.
 *
 * No key is re-typed. Every one is captured out of its authoring file's source text and `eval`'d;
 * a capture failure is rc=3, never a fallback.
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
const HIS_QUOTED = join(ROOT, 'docs/research/unit-482floorceiling-2026-11-19/posthoc-quoted-fixtures.mjs');
const PUBLISHED = join(ROOT, 'docs/research/unit-481disjunctiononly-2026-11-18/drive1.census-at-head.out');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const DRIVE_CENSUS = join(HERE, 'drive1.census-at-head.out');
const CHECKPOINT = '2a6e1edc';
const SELF_REL = 'docs/research/unit-483columnnarrow-2026-11-19/arm-columnnarrow.mjs';

const die = (code, msg) => { console.error(`\n${msg}`); process.exit(code); };
const capture = (label, re, src) => {
  const m = src.match(re);
  if (!m) die(3, `CAPTURE-FAILED — ${label}`);
  return m[1];
};
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : 'n/a');

/* ============================================================ captured keys — the gate */
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
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

/* ============================================================ captured keys — his DEPTH_LINE */
const hisSrc = readFileSync(HIS_ARM, 'utf8');
const depthLineSrc = capture('DEPTH_LINE', /const DEPTH_LINE = (\/[\s\S]*?\/);\n/, hisSrc);
// eslint-disable-next-line no-eval
const DEPTH_LINE = eval(depthLineSrc);
const WINDOW = Number(capture('his window constant', /lineEnd \+ (\d+)\)/, hisSrc));
if (!Number.isFinite(WINDOW) || WINDOW <= 0) die(3, 'CAPTURE-FAILED — window constant');
const OPEN_CLASS = '[([{]';
const CLOSE_CLASS = '[)\\]}]';
const occ = depthLineSrc.split(OPEN_CLASS).length - 1;
if (occ !== 4) die(3, `CAPTURE-FAILED — expected 4 occurrences of the bracket class in DEPTH_LINE, saw ${occ}`);
// eslint-disable-next-line no-eval
const DEPTH_LINE_CLOSE = eval(depthLineSrc.split(OPEN_CLASS).join(CLOSE_CLASS));

/* ============================================================ captured reader — his length-aware
 * string reading, out of HIS posthoc source. His own guard on the blank character runs here too:
 * if the two readings of strip-source.mjs stop behaving as its header documents, this is rc=3. */
const quotedSrc = readFileSync(HIS_QUOTED, 'utf8');
const probe = "const x = 'ABCDEFGH';";
const probeKeep = stripSource(probe, false), probeBlank = stripSource(probe, true);
const bi = probe.indexOf('ABCDEFGH');
const BLANK = probeBlank[bi];
if (probeKeep[bi] !== 'A' || BLANK === 'A' || probeBlank.length !== probe.length) {
  die(3, 'CAPTURE-FAILED — the two readings of strip-source.mjs do not behave as the module documents.');
}
const keepShortSrc = capture('keepShortStrings', /const keepShortStrings = (\([\s\S]*?\n\};)\n/, quotedSrc);
// eslint-disable-next-line no-eval
const keepShortStrings = eval(`(${keepShortSrc.replace(/;$/, '')})`);
if (typeof keepShortStrings !== 'function') die(3, 'CAPTURE-FAILED — keepShortStrings did not eval to a function');

const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };
const siteTest = (code, sites, re) => {
  for (const i of sites) {
    const lineStart = code.lastIndexOf('\n', i) + 1;
    let lineEnd = code.indexOf('\n', i); if (lineEnd < 0) lineEnd = code.length;
    const window = code.slice(lineStart, Math.min(code.length, lineEnd + WINDOW));
    if (!re.test(window)) return false;
  }
  return true;
};

/* ============================================================ the two keys, per member */
const classify = (raw) => {
  const code = stripSource(raw, false);                     // the gate's reading: strings KEPT
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  const inPop = ob.length > 0 && cb.length > 0;
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  const gateVerdict = !inPop ? 'OUT' : MARKER.test(raw) ? 'MARKED'
    : (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED';

  // K-DEPTH: open sites under his class AND close sites under the mirror class.
  const kDepth = inPop && siteTest(code, ob, DEPTH_LINE) && siteTest(code, cb, DEPTH_LINE_CLOSE);

  // K-QUOTED: does the member leave the POPULATION when multi-character string bodies go blank?
  const narrow = keepShortStrings(raw, 2).code;
  const obN = all(K.OPEN_BRACE, narrow), cbN = all(K.CLOSE_BRACE, narrow);
  const inPopNarrow = obN.length > 0 && cbN.length > 0;
  const kQuoted = inPop && !inPopNarrow;

  return { inPop, nOb: ob.length, nCb: cb.length, nObN: obN.length, nCbN: cbN.length,
    gateVerdict, kDepth, kQuoted };
};

/* ============================================================ P7 — KPs BEFORE any figure */
console.log('=== P7 — KNOWN POSITIVES: do the two keys land on three distinct corners? ===');
console.log(`    blank character, read off strip-source.mjs: ${JSON.stringify(BLANK)}  ·  his window: ${WINDOW}`);
const KPS = [
  ['KP-A', "let d = 0;\nif (c === '(' || c === '[' || c === '{') d += 1;\nelse if (c === ')' || c === ']' || c === '}') d -= 1;\n",
    { kDepth: true, kQuoted: false }, 'pure two-sided bracket depth counter, nothing sliced'],
  ['KP-B', 'const fixture = "if (s[i] === \'{\') start = i; if (s[i] === \'}\') end = i;";\nexport const run = () => fixture.length;\n',
    { kDepth: false, kQuoted: true }, 'ONE multi-character string quoting a whole comparison; no live comparison at all'],
  // KP-C's first form was `src.slice(src.indexOf('{') + 1, …)` and read inPop=FALSE: the population
  // key is "COMPARES against an open brace", and `indexOf('{')` is a search, not a comparison. The
  // KP has to carry the property the population key reads, not an analogy to a naive slicer.
  ['KP-C', "let start = -1, end = -1;\nfor (let i = 0; i < s.length; i++) {\n  if (s[i] === '{') start = i;\n  if (s[i] === '}') end = i;\n}\nconst body = s.slice(start + 1, end);\n",
    { kDepth: false, kQuoted: false }, 'the real naive unguarded slicer the gate exists to catch — live two-sided comparison, body sliced between the two indices'],
];
let kpOk = true;
for (const [name, text, want, why] of KPS) {
  const got = classify(text);
  const pass = got.inPop && got.kDepth === want.kDepth && got.kQuoted === want.kQuoted;
  if (!pass) kpOk = false;
  console.log(`  ${name}  inPop=${String(got.inPop).padEnd(5)} kDepth=${String(got.kDepth).padEnd(5)} kQuoted=${String(got.kQuoted).padEnd(5)}`
    + `  want kDepth=${want.kDepth}/kQuoted=${want.kQuoted}  ${pass ? 'PASS' : 'FAIL'}  — ${why}`);
}
const corners = new Set(KPS.map(([, t]) => { const c = classify(t); return `${c.kDepth}/${c.kQuoted}`; }));
console.log(`  distinct corners occupied by the KP set: ${corners.size} of 3 required`);
if (!kpOk || corners.size !== 3) die(4, 'KP-FAILED — the KP set is vacuous or a key landed on the wrong side. Nothing published.');

/* ============================================================ P1 — Subject A, the frozen column */
console.log('\n=== P1 (control) — the PUBLISHED UNGUARDED column, captured off its own stamped stdout ===');
if (!existsSync(PUBLISHED)) die(3, `CAPTURE-FAILED — ${PUBLISHED} absent`);
const pub = readFileSync(PUBLISHED, 'utf8');
const totalM = pub.match(/^\s+UNGUARDED:\s+(\d+)$/m);
if (!totalM) die(3, 'CAPTURE-FAILED — printed UNGUARDED total not found in the published recording');
const column = [...pub.matchAll(/^\s+UNGUARDED (\S+)$/gm)].map((m) => m[1]);
const printedTotal = +totalM[1];
console.log(`  printed total ${printedTotal}  ·  captured members ${column.length}  `
  + `${printedTotal === column.length ? 'OK' : 'MISMATCH'}`);
if (printedTotal !== column.length) die(3, 'CAPTURE-FAILED — captured member list does not match the printed total.');

/* R4 — a member whose file moved or changed since the recording is NAMED, not silently re-graded. */
let changedSince = [];
try {
  const changed = new Set(execFileSync('git', ['-C', ROOT, 'diff', '--name-only', `${CHECKPOINT}..HEAD`],
    { encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean));
  changedSince = column.filter((rel) => changed.has(rel));
} catch { changedSince = ['<git diff unavailable>']; }
const absent = column.filter((rel) => !existsSync(join(ROOT, rel)));
console.log(`  R4 — members changed since ${CHECKPOINT}: ${changedSince.length} ${changedSince.join(' · ')}`);
console.log(`  P1 — members still present on disk at HEAD: ${column.length - absent.length} of ${column.length}  (floor 56)`
  + (absent.length ? `  ABSENT: ${absent.join(' · ')}` : ''));

/* ============================================================ P2 / P3 / P4 / P5 */
const rows = [];
for (const rel of column) {
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { rows.push({ rel, missing: true }); continue; }
  rows.push({ rel, ...classify(raw) });
}
const readable = rows.filter((r) => !r.missing);
const depth = readable.filter((r) => r.kDepth);
const quoted = readable.filter((r) => r.kQuoted);
const both = readable.filter((r) => r.kDepth && r.kQuoted);
const neither = readable.filter((r) => !r.kDepth && !r.kQuoted);

console.log('\n=== P2 — K-DEPTH: every brace comparison is a bracket-depth-counter operand ===');
console.log(`  P2 — ${depth.length} of ${readable.length}   (registered: exactly 16)   ${pct(depth.length, readable.length)}`);
for (const r of depth) console.log(`      K-DEPTH   gate=${r.gateVerdict.padEnd(9)} ob=${String(r.nOb).padStart(2)} cb=${String(r.nCb).padStart(2)}  ${r.rel}`);

console.log('\n=== P3 — K-QUOTED: in the population ONLY because a multi-character string quotes a comparison ===');
console.log(`  P3 — ${quoted.length} of ${readable.length}   (registered: >= 2, expectation 3)`);
const baselineSet = new Set(readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean));
for (const r of quoted) {
  console.log(`      K-QUOTED  gate=${r.gateVerdict.padEnd(9)} baselined=${String(baselineSet.has(r.rel)).padEnd(5)}`
    + ` ob ${r.nOb}->${r.nObN} cb ${r.nCb}->${r.nCbN}  ${r.rel}`);
}

console.log('\n=== P4 — are the two narrowings disjoint? ===');
console.log(`  P4 — overlap ${both.length}   (registered: 0)${both.length ? `  ${both.map((r) => r.rel).join(' · ')}` : ''}`);

console.log('\n=== P5 — THE RE-PUBLISHED FIGURE ===');
const union = depth.length + quoted.length - both.length;
const narrowed = readable.length - union;
console.log(`  published column:                            ${readable.length}`);
console.log(`  less K-DEPTH (never slices a body):         -${depth.length}`);
console.log(`  less K-QUOTED (no live comparison at all):  -${quoted.length}`);
console.log(`  less double-counted overlap:                +${both.length}`);
console.log(`  P5 — NARROWED COLUMN:                        ${narrowed}   (registered: <= 41, i.e. a reduction of >= 17)`);
console.log(`       reduction ${union} of ${readable.length} = ${pct(union, readable.length)} of the figure this seat published and routed`);
const byVerdict = {};
for (const r of neither) byVerdict[r.gateVerdict] = (byVerdict[r.gateVerdict] || 0) + 1;
console.log(`       survivors by live gate verdict: ${JSON.stringify(byVerdict)}`);

/* ============================================================ P6 — Subject B, the drift check */
console.log('\n=== P6 — the live census at HEAD contains THIS arm (the +1-per-instrument drift, on my own file) ===');
if (!existsSync(DRIVE_CENSUS)) {
  console.log(`  SKIPPED — ${DRIVE_CENSUS} absent; P6 is UNGRADED, not passed.`);
} else {
  const live = readFileSync(DRIVE_CENSUS, 'utf8');
  const liveTotal = live.match(/^\s+UNGUARDED:\s+(\d+)$/m);
  const liveCol = [...live.matchAll(/^\s+UNGUARDED (\S+)$/gm)].map((m) => m[1]);
  const livePop = live.match(/SLICER \(also compares against a close brace\):\s+(\d+)/);
  const liveWalked = live.match(/files walked: (\d+)/);
  const liveP = live.match(/population \|P\| \(compares against an open brace\): (\d+)/);
  console.log(`  census at HEAD: walked ${liveWalked?.[1]} · |P| ${liveP?.[1]} · SLICER ${livePop?.[1]} · UNGUARDED ${liveTotal?.[1]}`);
  console.log(`  published recording (11/18):  SLICER ${pub.match(/SLICER \(also compares against a close brace\):\s+(\d+)/)?.[1]}`
    + ` · UNGUARDED ${printedTotal}`);
  const selfInCol = liveCol.includes(SELF_REL);
  const selfRaw = existsSync(join(ROOT, SELF_REL)) ? classify(readFileSync(join(ROOT, SELF_REL), 'utf8')) : null;
  console.log(`  P6 — this arm in the live UNGUARDED column: ${selfInCol}  (registered: true)`);
  console.log(`       this arm under the two keys: inPop=${selfRaw?.inPop} kDepth=${selfRaw?.kDepth} kQuoted=${selfRaw?.kQuoted}`
    + `  gate=${selfRaw?.gateVerdict}`);
  const newMembers = liveCol.filter((rel) => !column.includes(rel));
  const goneMembers = column.filter((rel) => !liveCol.includes(rel));
  console.log(`       new members since the recording: ${newMembers.length} ${newMembers.join(' · ')}`);
  console.log(`       dropped since the recording:     ${goneMembers.length} ${goneMembers.join(' · ')}`);
}

console.log('\nrc=0 — figures above are the arm\'s own stdout; nothing here edits the gate or unit-469.');
