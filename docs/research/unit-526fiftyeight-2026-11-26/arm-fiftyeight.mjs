#!/usr/bin/env node
/**
 * unit-526 ARM — the 58-vs-58 overlap.
 *
 * Registered in PRE-REGISTRATION.md at `9a658c48`, before this file existed. P1–P12.
 *
 * NEITHER KEY IS RETYPED. Both are SLICED out of their frozen sources:
 *   - arm C's `TIGHT` / `BUFFERISH` / `ARRAYLIKE` / `isComment` / `THIS_UNIT`
 *     from docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-c.mjs
 *   - `UNIT_TAIL` from docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs
 *   - `regionOf` (whole function text) from unit-522's posthoc-which-133.mjs
 *   - the population filter from unit-522's own capture, as that posthoc did
 * Any slice failure ABORTS. A hand-typed key would grade a different population than the one the
 * published figures came from.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const SELF = 'docs/research/unit-526fiftyeight-2026-11-26/arm-fiftyeight.mjs';
const C_ARM = 'docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-c.mjs';
const T_ARM = 'docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs';
const T_PH = 'docs/research/unit-522lengthasbytes-2026-11-26/posthoc-which-133.mjs';
const T_OUT = 'docs/research/unit-522lengthasbytes-2026-11-26/captures/ARM.out';

const P1 = [40, 95];
const P2 = [55, 66];
const P3 = [5, 40];
const P5 = [4, 45];
const P6 = [1, 80];
const P7 = [1, 60];
const P8_FLOOR = 2000;

const say = (...a) => console.log(...a);
const V = [];
const grade = (id, claim, got, lo, hi) => {
  const ok = got >= lo && got <= hi;
  V.push({ id, claim, got, lo, hi, verdict: ok ? 'HIT' : 'REFUTED' });
  say(`  ${ok ? 'HIT     ' : 'REFUTED '} ${id}  ${claim}`);
  say(`           registered [${lo}, ${hi}]   measured ${got}`);
};
const gradeBool = (id, claim, got, want) => {
  const ok = got === want;
  V.push({ id, claim, got: String(got), lo: String(want), hi: String(want), verdict: ok ? 'HIT' : 'REFUTED' });
  say(`  ${ok ? 'HIT     ' : 'REFUTED '} ${id}  ${claim}`);
  say(`           registered ${want}   measured ${got}`);
};
const abort = (why) => { say(`\n  ABORT — ${why}`); process.exit(1); };

/* ===================================================== §0 the fire's own no-op assertion */

say('=== §0 subject state, asserted before any measurement ===\n');
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const productDiff = execFileSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' }).trim();
say(`  HEAD: ${head}`);
say(`  git diff --stat HEAD -- packages/ scripts/: ${productDiff === '' ? 'EMPTY (no-op on product)' : `NON-EMPTY\n${productDiff}`}`);
const frozenDirty = execFileSync('git', ['status', '--porcelain', '--', 'docs/research/unit-465byteslabel-2026-11-13', 'docs/research/unit-522lengthasbytes-2026-11-26', 'scripts/lib'], { encoding: 'utf8' }).trim();
say(`  frozen subjects + scripts/lib dirty? ${frozenDirty === '' ? 'NO — both subject units and the live discriminator are as committed' : `YES\n${frozenDirty}`}`);
if (frozenDirty !== '') abort('a frozen subject unit or the live discriminator has uncommitted edits; the slices would not be of published text.');

/* ===================================================== §1 the slices */

say('\n=== §1 BOTH KEYS SLICED — abort on any failure ===\n');

/** Text between `prefix` and the first `suffix` after it. */
function between(src, prefix, suffix, label) {
  const a = src.indexOf(prefix);
  if (a === -1) abort(`slice failed: prefix ${JSON.stringify(prefix)} not found for ${label}`);
  const b = src.indexOf(suffix, a + prefix.length);
  if (b === -1) abort(`slice failed: suffix ${JSON.stringify(suffix)} not found for ${label}`);
  return src.slice(a + prefix.length, b);
}
/** Compile a `/body/flags` literal's text. */
function compileLiteral(text, label) {
  const m = /^\/([\s\S]*)\/([a-z]*)$/.exec(text.trim());
  if (!m) abort(`slice failed: ${label} is not a regex literal: ${JSON.stringify(text)}`);
  try { return new RegExp(m[1], m[2]); } catch (e) { abort(`slice failed: ${label} would not compile: ${e.message}`); }
}

const cSrc = readFileSync(C_ARM, 'utf8');
const tSrc = readFileSync(T_ARM, 'utf8');
const phSrc = readFileSync(T_PH, 'utf8');
const tOut = readFileSync(T_OUT, 'utf8');

const tightBlock = between(cSrc, 'const TIGHT = [\n', '\n];', 'arm C TIGHT');
const tightTexts = tightBlock.split('\n').map((l) => l.trim().replace(/,$/, '')).filter(Boolean);
if (tightTexts.length !== 3) abort(`arm C TIGHT sliced ${tightTexts.length} literal(s), expected 3`);
const TIGHT = tightTexts.map((t, i) => compileLiteral(t, `TIGHT[${i}]`));
const BUFFERISH = compileLiteral(between(cSrc, 'const BUFFERISH = ', ';\n', 'BUFFERISH'), 'BUFFERISH');
const ARRAYLIKE = compileLiteral(between(cSrc, 'const ARRAYLIKE = ', ';\n', 'ARRAYLIKE'), 'ARRAYLIKE');
const IS_COMMENT = compileLiteral(between(cSrc, 'const isComment = ', '.test(line);', 'isComment'), 'isComment');
const C_THIS_UNIT = between(cSrc, "const THIS_UNIT = '", "';", 'arm C THIS_UNIT');
const UNIT_TAIL = compileLiteral(between(tSrc, 'const UNIT_TAIL = ', ';\n', 'UNIT_TAIL'), 'UNIT_TAIL');

const regionFn = `function regionOf${between(phSrc, 'function regionOf', '\n}\n', 'regionOf')}\n}`;
if (!/stripSource\(src, false\)/.test(regionFn) || !/stripSource\(src, true\)/.test(regionFn)) {
  abort('regionOf sliced without both stripSource passes — the discriminator is not the published one');
}
const regionOf = new Function('stripSource', `${regionFn}; return regionOf;`)(stripSource);

const filterLiteral = tOut.match(/the population filter, four links out: (\/.+?\/)\s*$/m)?.[1] ?? null;
if (!filterLiteral) abort("unit-522's population filter could not be sliced off its own capture");
const extRe = compileLiteral(filterLiteral, 'extRe');

say(`  arm C  TIGHT[0]    ${TIGHT[0]}`);
say(`  arm C  TIGHT[1]    ${TIGHT[1]}`);
say(`  arm C  TIGHT[2]    ${TIGHT[2]}`);
say(`  arm C  BUFFERISH   ${BUFFERISH}`);
say(`  arm C  ARRAYLIKE   ${ARRAYLIKE}`);
say(`  arm C  isComment   ${IS_COMMENT}`);
say(`  arm C  THIS_UNIT   ${C_THIS_UNIT}`);
say(`  u-522  UNIT_TAIL   ${UNIT_TAIL}`);
say(`  u-522  extRe       ${extRe}   (off ${T_OUT}, not retyped)`);
say(`  u-522  regionOf    sliced, ${regionFn.split('\n').length} lines, both stripSource passes present`);

/* ===================================================== §2 known positives, per key, before any figure */

say('\n=== §2 KNOWN POSITIVES — each re-derived key must select and must refuse, on text outside both corpora ===\n');

/** arm C's classification of one line: null = not selected at all. */
function classifyC(line) {
  if (!TIGHT.some((re) => re.test(line))) return null;
  if (IS_COMMENT.test(line)) return 'IN-COMMENT';
  if (BUFFERISH.test(line)) return 'BUFFER-correct';
  if (ARRAYLIKE.test(line)) return 'ARRAYLIKE-not-a-byte-claim';
  return 'STRING';
}
/** unit-522's sites in one source text: every `.length` with a unit token in its tail. */
function sitesT(src) {
  const out = [];
  const lines = src.split('\n');
  let off = 0;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    let i = line.indexOf('.length');
    while (i !== -1) {
      const after = i + '.length'.length;
      const rawTail = line.slice(after);
      const cut = rawTail.indexOf('${');
      const labelTail = cut === -1 ? rawTail : rawTail.slice(0, cut);
      const m = labelTail.match(UNIT_TAIL);
      if (m) out.push({ n: n + 1, line, tok: m[1], region: regionOf(src, off + after + labelTail.indexOf(m[1])) });
      i = line.indexOf('.length', i + 1);
    }
    off += line.length + 1;
  }
  return out;
}

const kps = [];
const kpC = (id, line, want, note) => kps.push({ id, got: String(classifyC(line)), want, note });
kpC('KP-C1', 'say(`cap ${s.length} bytes`);', 'STRING', 'the real class — a utf8 string length printed as bytes');
kpC('KP-C2', 'say(`${readFileSync(p).length} bytes`);', 'BUFFER-correct', 'a Buffer length printed as bytes — correct code, must not land in STRING');
kpC('KP-C3', 'say(`${rows.length} bytes`);', 'ARRAYLIKE-not-a-byte-claim', 'a row count next to the word bytes — not a byte claim');
kpC('KN-C1', 'say(`cap ${s.length} chars`);', 'null', 'no unit word — arm C must refuse it entirely');

const kpT = (id, src, want, note) => {
  const s = sitesT(src);
  kps.push({ id, got: s.length ? `${s[0].tok}/${s[0].region}` : 'NONE', want, note });
};
kpT('KP-T1', 'const s = "x";\nsay(`cap ${s.length} bytes`);\n', 'bytes/LABEL-IN-STRING', 'the real class, and the token this unit counts');
kpT('KP-T2', 'const x = "y";\n// then ${x.length} bytes of it\n', 'bytes/IN-COMMENT', 'L1 prose — selected by the tail key, excluded by region');
kpT('KN-T1', 'const x = [];\nconst n = x.length, bytes = 2;\n', 'bytes/IDENT-IN-CODE', 'a variable NAMED bytes after a comma — must not read as a label');

for (const k of kps) {
  k.ok = k.got === k.want;
  say(`  ${k.ok ? 'PASS' : 'FAIL'}  ${k.id.padEnd(6)} want ${k.want.padEnd(22)} got ${k.got}`);
  say(`        ${k.note}`);
}
const kpPass = kps.filter((k) => k.ok).length;
say(`\n  ${kpPass} of ${kps.length} known positives/negatives pass`);
if (kpPass !== kps.length) abort('a re-derived key failed a known positive — no figure is published off an ungraded key.');

/* ===================================================== §3 populations */

say('\n=== §3 POPULATIONS — each key over its own, overlap over the shared one ===\n');

const lsFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);
const lsTree = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);
const inTree = new Set(lsTree);
const EXCLUDE = new Set([SELF, T_ARM, T_PH]);

const C_POP = lsTree.filter((p) => p.endsWith('.mjs') && !p.startsWith(C_THIS_UNIT) && !EXCLUDE.has(p));
const T_POP = lsFiles.filter((p) => extRe.test(p) && !EXCLUDE.has(p));
const SHARED = lsFiles.filter((p) => inTree.has(p) && p.endsWith('.mjs') && extRe.test(p) && !p.startsWith(C_THIS_UNIT) && !EXCLUDE.has(p));
const sharedSet = new Set(SHARED);

say(`  git ls-files: ${lsFiles.length}   git ls-tree -r HEAD: ${lsTree.length}   (difference ${Math.abs(lsFiles.length - lsTree.length)})`);
say(`  C-POP  (arm C's own: tracked .mjs minus its THIS_UNIT): ${C_POP.length}`);
say(`  T-POP  (unit-522's own: tracked files passing extRe):   ${T_POP.length}`);
say(`  SHARED (both enumerations, .mjs, extRe, minus arm C's self-exclusion): ${SHARED.length}`);
say(`  excluded from every population as this fire's instruments or the subjects' own: ${[...EXCLUDE].join(', ')}`);

/* ===================================================== §4 the two selections */

say('\n=== §4 SELECTIONS ===\n');

const cAll = [];
for (const p of C_POP) {
  let t;
  try { t = readFileSync(p, 'utf8'); } catch { continue; }
  t.split('\n').forEach((line, i) => {
    const kind = classifyC(line);
    if (kind === 'STRING') cAll.push({ p, n: i + 1, line: line.trim() });
  });
}

const tAll = [];
let lengthOccurrences = 0;
for (const p of T_POP) {
  let t;
  try { t = readFileSync(p, 'utf8'); } catch { continue; }
  let i = t.indexOf('.length');
  while (i !== -1) { lengthOccurrences += 1; i = t.indexOf('.length', i + 1); }
  for (const s of sitesT(t)) {
    if (s.tok === 'bytes' && s.region === 'LABEL-IN-STRING') tAll.push({ p, n: s.n, line: s.line.trim() });
  }
}

say(`  arm C STRING over C-POP:                      ${cAll.length}   (published 58 on 2026-11-13's tree)`);
say(`  unit-522 bytes-token LABEL-IN-STRING over T-POP: ${tAll.length}   (published 58 on 2026-11-26's tree)`);
say(`  total '.length' occurrences in T-POP:         ${lengthOccurrences}`);

const key = (s) => `${s.p}:${s.n}`;
const cShared = cAll.filter((s) => sharedSet.has(s.p));
const tShared = tAll.filter((s) => sharedSet.has(s.p));
const cKeys = new Set(cShared.map(key));
const tKeys = new Set(tShared.map(key));
const bothKeys = [...cKeys].filter((k) => tKeys.has(k)).sort();
const cOnly = [...cKeys].filter((k) => !tKeys.has(k)).sort();
const tOnly = [...tKeys].filter((k) => !cKeys.has(k)).sort();
const cFiles = new Set(cShared.map((s) => s.p));
const tFiles = new Set(tShared.map((s) => s.p));
const bothFiles = [...cFiles].filter((p) => tFiles.has(p)).sort();

const smaller = Math.min(cKeys.size, tKeys.size);
const share = smaller === 0 ? 0 : (bothKeys.length / smaller) * 100;

say(`\n  on SHARED — arm C STRING: ${cKeys.size} distinct site(s) · unit-522: ${tKeys.size} distinct site(s)`);
say(`  site-level overlap: ${bothKeys.length}   (${share.toFixed(2)}% of the smaller selection, ${smaller})`);
say(`  arm C only: ${cOnly.length}   ·   unit-522 only: ${tOnly.length}`);
say(`  file-level overlap: ${bothFiles.length}   (arm C ${cFiles.size} file(s) · unit-522 ${tFiles.size} file(s))`);

const lineOf = (k, pool) => pool.find((s) => key(s) === k)?.line ?? '(line not found)';
say('\n  THE OVERLAP, every member printed whole:');
if (!bothKeys.length) say('    (none)');
for (const k of bothKeys) say(`    ${k}\n      ${lineOf(k, cShared)}`);

say('\n  ARM C ONLY — selected by arm C STRING, missed by unit-522\'s key, every member printed whole:');
if (!cOnly.length) say('    (none)');
for (const k of cOnly) say(`    ${k}\n      ${lineOf(k, cShared)}`);

say('\n  UNIT-522 ONLY — selected by unit-522\'s key, missed by arm C, every member printed whole:');
if (!tOnly.length) say('    (none)');
for (const k of tOnly) say(`    ${k}\n      ${lineOf(k, tShared)}`);

/* ===================================================== §5 the two mechanisms, named */

say('\n=== §5 MECHANISM of each asymmetry, named rather than counted ===\n');

const tokenPrecedes = cOnly.filter((k) => {
  const line = lineOf(k, cShared);
  const b = line.search(/bytes/i);
  const l = line.indexOf('.length');
  return b !== -1 && l !== -1 && b < l;
});
say(`  P11 cause — arm-C-only sites where the unit token PRECEDES the '.length' (UNIT_TAIL reads only after it): ${tokenPrecedes.length}`);
for (const k of tokenPrecedes) say(`      ${k}\n        ${lineOf(k, cShared)}`);

const tOutsideMjs = tAll.filter((s) => !s.p.endsWith('.mjs'));
const tOutsideShared = tAll.filter((s) => !sharedSet.has(s.p));
say(`\n  P12 cause — unit-522 sites in files arm C's population cannot reach at all: ${tOutsideShared.length} outside SHARED, of which ${tOutsideMjs.length} are not .mjs`);
const extTally = tOutsideShared.reduce((a, s) => { const e = s.p.replace(/^.*(\.[^.]+)$/, '$1'); a[e] = (a[e] ?? 0) + 1; return a; }, {});
say(`      by extension: ${Object.entries(extTally).map(([k, v]) => `${k}=${v}`).join(' · ') || '(none)'}`);

/* ===================================================== §6 grading */

say('\n=== §6 GRADING against PRE-REGISTRATION.md §4 ===\n');

grade('P1', "arm C STRING re-derived over C-POP", cAll.length, ...P1);
grade('P2', "unit-522 bytes-token re-derived over T-POP", tAll.length, ...P2);
grade('P3', 'site-level overlap on SHARED', bothKeys.length, ...P3);
gradeBool('P4', 'overlap is < 80% of the smaller SHARED selection — the keys are NOT extensionally identical', share < 80, true);
grade('P5', 'file-level overlap on SHARED', bothFiles.length, ...P5);
grade('P6', 'arm-C-only sites on SHARED', cOnly.length, ...P6);
grade('P7', 'unit-522-only sites on SHARED', tOnly.length, ...P7);
gradeBool('P8', `vacuity floor — '.length' occurrences in T-POP >= ${P8_FLOOR}`, lengthOccurrences >= P8_FLOOR, true);
gradeBool('P9', 'the site-level overlap is NON-EMPTY (registered apart from P3)', bothKeys.length > 0, true);
gradeBool('P10', 'BOTH SHARED selections are non-empty (registered apart from P4/P6/P7)', cKeys.size > 0 && tKeys.size > 0, true);
gradeBool('P11', 'at least one arm-C-only site is missed because the token PRECEDES the .length', tokenPrecedes.length >= 1, true);
gradeBool('P12', "at least one unit-522 site sits in a file arm C's population cannot reach", tOutsideShared.length >= 1, true);

const hits = V.filter((v) => v.verdict === 'HIT').length;
const refs = V.filter((v) => v.verdict === 'REFUTED').length;
say(`\n  graded: ${V.length} — ${hits} HIT, ${refs} REFUTED`);
if (refs) { say('\n  REFUTED, named:'); for (const v of V.filter((x) => x.verdict === 'REFUTED')) say(`    ${v.id}  ${v.claim}: registered [${v.lo}, ${v.hi}], measured ${v.got}`); }

say('\n=== END ARM ===');
