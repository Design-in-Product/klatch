/**
 * unit-524sixtyvsfiftyfour — the arm.
 *
 * Subject: the disagreement Daedalus named and did not explain in his 11-26 WORK memo —
 * `unit-521` published **54** direct-tail size-keyed sites over 850 instrument files;
 * `unit-523` excluded **60** direct `new Set(...)` tails over 855. He measured that `unit-522`
 * contributes 0 of the 60 and that `unit-523` contributes 0, and concluded the delta is "not
 * population growth … 6 on files that existed at `unit-521`'s SHA".
 *
 * ## Nothing here is retyped
 *
 * Both readers are SLICED out of the two arms' own source, with every start and end marker
 * asserted present before the generated module is compiled. Where a slice is unavailable this arm
 * THROWS rather than falling back to a hand-typed copy: a hand-typed reader is not a slice.
 * `stripSource` and `parenSpanEnd` are the shared `scripts/lib/` readers that BOTH arms import, so
 * using them here is the same dependency both subjects have, not a third implementation.
 *
 * The four texts the two arms share (`CODE_EXT`, the corpus filter arrow, `NEEDLE`, `TAIL`) are
 * asserted BYTE-IDENTICAL between the two files rather than eyeballed as "the same" — a copied
 * population definition that has drifted by one character is exactly the kind of thing that makes
 * two readings of one question incomparable, and the assertion is cheap.
 *
 * ## Two trees, materialised, not reasoned about
 *
 * Both SHAs are checked out into temp directories with `git archive`, so each reading is of the
 * COMMITTED text at that SHA. The worktree is never read for a figure. This arm compares against
 * no brace at any point; it is a consumer of the shared paren reader only.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd, opts = {}) =>
  execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, ...opts });

// ─── §0 ─────────────────────────────────────────────────────────────────────────────────────────
const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') {
  throw new Error(`§0: packages/ or scripts/ is dirty, so no figure here is attributable:\n${dirty}`);
}
const HEAD = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

const PIN521 = '148ebe57'; // unit-521's published host SHA
const PIN523 = 'f247b428'; // the commit carrying unit-523's arm; it was committed before its drive
const P521 = 'docs/research/unit-521setsizefalsegreen-2026-11-26/arm-setsizefalsegreen.mjs';
const P523 = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';

const src521 = readFileSync(`${ROOT}${P521}`, 'utf8');
const src523 = readFileSync(`${ROOT}${P523}`, 'utf8');

// ─── slicing ────────────────────────────────────────────────────────────────────────────────────

function sliceBetween(src, label, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  if (a === -1) throw new Error(`SLICE ${label}: start marker ABSENT, so there is nothing to slice: ${startMarker}`);
  const b = src.indexOf(endMarker, a + startMarker.length);
  if (b === -1) throw new Error(`SLICE ${label}: end marker ABSENT after the start: ${endMarker}`);
  return src.slice(a, b + endMarker.length);
}

function sliceLine(src, label, startMarker) {
  const a = src.indexOf(startMarker);
  if (a === -1) throw new Error(`SLICE ${label}: marker ABSENT: ${startMarker}`);
  const nl = src.indexOf('\n', a);
  return src.slice(a, nl === -1 ? src.length : nl);
}

// 521's whole reader block: NEEDLE through the end of `sitesIn`.
const BLOCK521 = sliceBetween(src521, '521 reader block', "const NEEDLE = 'new Set(';", '  return out;\n}');
// 523's two pieces.
const SIZECMP523 = sliceLine(src523, '523 SIZE_CMP', 'const SIZE_CMP = ');
const TAILIDX523 = sliceBetween(src523, '523 setTailIndices', 'function setTailIndices(code) {', '  return tails;\n}');

// The four shared texts, asserted byte-identical between the two arms.
const CODE_EXT_LINE = sliceLine(src521, '521 CODE_EXT', 'const CODE_EXT = ');
const FILTER_ARROW = sliceLine(src521, '521 corpus filter arrow', '  (p) => CODE_EXT.test(p) &&');
const NEEDLE_LINE = sliceLine(src521, '521 NEEDLE', 'const NEEDLE = ');
const TAIL_LINE = sliceLine(src521, '521 TAIL', 'const TAIL = ');
const shared = [
  ['CODE_EXT', CODE_EXT_LINE],
  ['corpus filter arrow', FILTER_ARROW],
  ['NEEDLE', NEEDLE_LINE],
  ['TAIL', TAIL_LINE],
];
const sharedReport = [];
for (const [name, text] of shared) {
  const present = src523.includes(text);
  sharedReport.push([name, present]);
  if (!present) {
    throw new Error(
      `SHARED-TEXT DRIFT: unit-523's arm does not contain unit-521's \`${name}\` verbatim, so the ` +
        `two published figures are not two readings of one population and this unit's question is ` +
        `malformed as asked. Text:\n${text}`,
    );
  }
}

// 521's own "size-keyed" membership list, sliced from the line that published the 54.
const keyedSliced = /\[\s*'INVARIANCE'[\s\S]*?\]/.exec(src521);
if (!keyedSliced) throw new Error("SLICE 521 KEYED: the 'INVARIANCE' membership array is absent");
const KEYED = JSON.parse(keyedSliced[0].replace(/'/g, '"'));
if (KEYED.length !== 4) throw new Error(`SLICE 521 KEYED: expected 4 members, sliced ${KEYED.length}`);

// ─── the generated module: both readers, one compilation unit, nothing typed by hand ────────────

const GEN = [
  `import { parenSpanEnd } from 'file://${ROOT}scripts/lib/decl-body.mjs';`,
  `import { stripSource } from 'file://${ROOT}scripts/lib/strip-source.mjs';`,
  '',
  "// -- sliced verbatim from unit-521's arm --",
  BLOCK521,
  '',
  "// -- sliced verbatim from unit-523's arm --",
  SIZECMP523,
  TAILIDX523,
  '',
  '// -- shared population definition, sliced from unit-521, asserted present in unit-523 --',
  CODE_EXT_LINE,
  `export const corpusPred = ${FILTER_ARROW.trim().replace(/,$/, '')};`,
  `export const KEYED = ${JSON.stringify(KEYED)};`,
  'export { sitesIn, setTailIndices, SIZE_CMP, TAIL, NEEDLE, stripSource, parenSpanEnd };',
  '',
].join('\n');

const genDir = mkdtempSync(join(tmpdir(), 'u524-gen-'));
const genPath = join(genDir, 'sliced-readers.mjs');
writeFileSync(genPath, GEN);
const mod = await import(`file://${genPath}`);

// ─── the two readings, as functions of (corpus, reader text) ────────────────────────────────────

/** unit-521's reading: `new Set(` sites whose direction is one of its four keyed cells. */
const read521 = (path, raw) => mod.sitesIn(path, raw).filter((s) => mod.KEYED.includes(s.direction));

/** unit-523's reading: literal `.size <op> <n>` matches sitting at a balanced-span tail index. */
function read523(raw) {
  const code = mod.stripSource(raw, true);
  const tails = mod.setTailIndices(code);
  const out = [];
  for (const m of code.matchAll(mod.SIZE_CMP)) if (tails.has(m.index)) out.push(m);
  return { code, out };
}

const lineOfIdx = (text, idx) => text.slice(0, idx).split('\n').length;

// ─── KP gate: planted OUTSIDE both corpora, in a temp dir ───────────────────────────────────────

const LONG = ' '.repeat(2) + '/*' + 'y'.repeat(60) + '*/' + ' '.repeat(2);
const KP_LINES = [
  'let kpAcc = 0;',
  'const kpArr = [1, 1, 2];',
  'if (new Set([1, 1]).size === 1) kpAcc++;',
  'const kpS = new Set(kpArr);',
  'if (kpS.size === 1) kpAcc++;',
  "const kpStr = 'new Set(zz).size === 1';",
  'const kpN = 3;',
  'if (new Set(kpArr).size === kpN) kpAcc++;',
  `if (new Set(kpArr)${LONG}.size === 1) kpAcc++;`,
  'export { kpAcc, kpS, kpStr, kpN };',
];
const KP_SRC = KP_LINES.join('\n') + '\n';
const KP_LINE = {
  direct: 3, // KP1
  bound: 4, // KP2 — the `new Set(kpArr)` site itself
  boundCmp: 5, // KP2 — the indirect comparison
  inString: 6, // KP3
  nonLiteral: 8, // KP4
  windowed: 9, // KP5
};
const kpDir = mkdtempSync(join(tmpdir(), 'u524-kp-'));
const kpPath = join(kpDir, 'kp-plants.mjs');
writeFileSync(kpPath, KP_SRC);

const kpSites = mod.sitesIn(kpPath, KP_SRC);
const kpAll = mod.sitesIn(kpPath, KP_SRC);
const kpKeyed = kpAll.filter((s) => mod.KEYED.includes(s.direction));
const { code: kpCode, out: kpExcl } = read523(KP_SRC);
const kpExclLines = kpExcl.map((m) => lineOfIdx(kpCode, m.index));
const keyedAt = (ln) => kpKeyed.some((s) => s.line === ln);
const siteAt = (ln) => kpSites.find((s) => s.line === ln);
const exclAt = (ln) => kpExclLines.includes(ln);

const kpCells = [
  ['KP1 direct tail `new Set([1, 1]).size === 1` — counted by BOTH', keyedAt(KP_LINE.direct) && exclAt(KP_LINE.direct)],
  [
    'KP2 indirect `const kpS = new Set(kpArr)` then `kpS.size === 1` — counted by NEITHER as a direct tail',
    !keyedAt(KP_LINE.bound) && !exclAt(KP_LINE.bound) && !keyedAt(KP_LINE.boundCmp) && !exclAt(KP_LINE.boundCmp),
  ],
  [
    'KP3 the same text inside a STRING literal — excluded by both, so the strip is live',
    !keyedAt(KP_LINE.inString) && !exclAt(KP_LINE.inString) && !siteAt(KP_LINE.inString),
  ],
  [
    'KP4 non-literal RHS `.size === kpN` — excluded by both, since both regexes require \\d+',
    !keyedAt(KP_LINE.nonLiteral) && !exclAt(KP_LINE.nonLiteral),
  ],
  [
    "KP5 >40 blanked comment chars before `.size` — counted by 523, MISSED by 521 (P8's mechanism, reachable)",
    !keyedAt(KP_LINE.windowed) && exclAt(KP_LINE.windowed),
  ],
  [
    "KP6 the disagreeing member's reported text is the WHOLE line, not a truncated field",
    (() => {
      const s = siteAt(KP_LINE.windowed);
      return Boolean(s) && KP_LINES[KP_LINE.windowed - 1].includes('.size === 1');
    })(),
  ],
];

console.log(`unit-524sixtyvsfiftyfour — arm`);
console.log(`  HEAD ${HEAD} · clock ${CLOCK}`);
console.log(`  readers SLICED from: ${P521} · ${P523}`);
console.log(`  generated module: ${genPath}`);
console.log('');
console.log('─── shared-text byte equality between the two arms ─────────────────────────────');
for (const [name, ok] of sharedReport) console.log(`  ${ok ? 'IDENTICAL' : 'DRIFTED  '}  ${name}`);
console.log(`  521's own size-keyed membership list, sliced: ${JSON.stringify(KEYED)}`);
console.log('');
console.log('─── KP gate ────────────────────────────────────────────────────────────────────');
let kpPass = 0;
for (const [label, ok] of kpCells) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (ok) kpPass += 1;
}
console.log(`  KP ${kpPass} of ${kpCells.length}`);
if (kpPass !== kpCells.length) {
  console.log('');
  console.log('KP GATE RED — ABORTING. No census is published off this drive; the capture is');
  console.log('committed unedited. KP member lines, whole:');
  for (let i = 0; i < KP_LINES.length; i += 1) console.log(`    ${i + 1}: ${KP_LINES[i]}`);
  console.log(`  521 sites: ${JSON.stringify(kpAll.map((s) => [s.line, s.direction]))}`);
  console.log(`  523 excluded lines: ${JSON.stringify(kpExclLines)}`);
  process.exit(1);
}

// ─── materialise both trees ─────────────────────────────────────────────────────────────────────

function materialise(sha) {
  const d = mkdtempSync(join(tmpdir(), `u524-${sha}-`));
  sh(`git archive ${sha} --format=tar | tar -x -C ${d}`);
  const files = sh(`git ls-tree -r --name-only ${sha}`).split('\n').filter(Boolean).filter(mod.corpusPred);
  return { dir: d, files };
}

function measure(sha) {
  const { dir, files } = materialise(sha);
  const cells = {};
  const perFile = new Map();
  let c521 = 0;
  let c523 = 0;
  let unreadable = 0;
  for (const p of files) {
    let raw;
    try {
      raw = readFileSync(join(dir, p), 'utf8');
    } catch {
      unreadable += 1;
      continue;
    }
    const all = mod.sitesIn(p, raw);
    for (const s of all) cells[s.direction] = (cells[s.direction] || 0) + 1;
    const keyed = read521(p, raw);
    const { code, out } = read523(raw);
    c521 += keyed.length;
    c523 += out.length;
    if (keyed.length !== out.length) {
      perFile.set(p, {
        keyed,
        excl: out.map((m) => ({ idx: m.index, line: lineOfIdx(code, m.index) })),
        raw,
      });
    }
  }
  return { sha, dir, files, cells, c521, c523, perFile, unreadable };
}

const at521 = measure(PIN521);
const at523 = measure(PIN523);

const show = (r, label, published) => {
  console.log('');
  console.log(`─── ${label} — SHA ${r.sha} ─────────────────────────────────────────`);
  console.log(`  instrument corpus files: ${r.files.length}   (unreadable ${r.unreadable})`);
  const order = ['NOT-SIZE-KEYED', 'NO-COMPARISON', 'CHANGE', 'OTHER-N', 'INVARIANCE', 'EMPTY', 'SCAN-FAILED'];
  const total = Object.values(r.cells).reduce((a, b) => a + b, 0);
  console.log(`  \`new Set(\` sites: ${total}`);
  for (const k of order) console.log(`      ${k.padEnd(16)} ${r.cells[k] ?? 0}`);
  console.log(`  unit-521 reading — size-keyed sites:            ${r.c521}${published.c521 === undefined ? '' : `   (published ${published.c521})`}`);
  console.log(`  unit-523 reading — excluded direct tails:       ${r.c523}${published.c523 === undefined ? '' : `   (published ${published.c523})`}`);
  console.log(`  the two readings differ by:                     ${r.c523 - r.c521}`);
  console.log(`  files on which the two readings disagree:       ${r.perFile.size}`);
};

show(at521, "unit-521's pinned population", { c521: 54 });
show(at523, "unit-523's pinned population", { c523: 60 });

// ─── the members, WHOLE LINES, every one ────────────────────────────────────────────────────────

function members(r, label) {
  console.log('');
  console.log(`─── ${label}: every disagreeing file, every member, whole lines ──────────────`);
  if (r.perFile.size === 0) {
    console.log('  none — the two readers agree file-for-file on this population.');
    return;
  }
  for (const [p, v] of r.perFile) {
    const lines = v.raw.split('\n');
    console.log(`  ${p}   521-keyed ${v.keyed.length} · 523-excluded ${v.excl.length}`);
    for (const s of v.keyed) console.log(`      521  L${s.line} ${s.direction}  | ${lines[s.line - 1]}`);
    for (const e of v.excl) console.log(`      523  L${e.line} idx=${e.idx}      | ${lines[e.line - 1]}`);
  }
}

members(at521, "At unit-521's SHA");
members(at523, "At unit-523's SHA");

// ─── growth attribution: which files are new, and what do they contribute ───────────────────────

const set521 = new Set(at521.files);
const newFiles = at523.files.filter((p) => !set521.has(p));
console.log('');
console.log('─── population growth, attributed file by file ─────────────────────────────────');
console.log(`  files in 523's corpus absent from 521's: ${newFiles.length}`);
let growth521 = 0;
let growth523 = 0;
for (const p of newFiles) {
  let raw;
  try {
    raw = readFileSync(join(at523.dir, p), 'utf8');
  } catch {
    console.log(`      UNREADABLE  ${p}`);
    continue;
  }
  const keyed = read521(p, raw);
  const { out } = read523(raw);
  growth521 += keyed.length;
  growth523 += out.length;
  console.log(`      ${p}`);
  console.log(`          521-keyed ${keyed.length} · 523-excluded ${out.length}`);
  const lines = raw.split('\n');
  for (const s of keyed) console.log(`          L${s.line} ${s.direction}  | ${lines[s.line - 1].trim()}`);
}
console.log(`  the 5 new files contribute: 521-keyed ${growth521} · 523-excluded ${growth523}`);
const lostFiles = at521.files.filter((p) => !new Set(at523.files).has(p));
console.log(`  files in 521's corpus absent from 523's: ${lostFiles.length}${lostFiles.length ? ` — ${lostFiles.join(', ')}` : ''}`);

console.log('');
console.log('─── the closure ────────────────────────────────────────────────────────────────');
console.log(`  published delta to explain:                     60 - 54 = 6`);
console.log(`  reader-level delta at ONE pinned population:    ${at521.c523 - at521.c521}  (unit-521's SHA)`);
console.log(`  growth contribution to the 523 reading:         ${growth523}`);
console.log(`  reader delta + growth:                          ${at521.c523 - at521.c521} + ${growth523} = ${at521.c523 - at521.c521 + growth523}`);
console.log(`  reproduced 521's published 54?                  ${at521.c521 === 54 ? 'YES' : `NO — ${at521.c521}`}`);
console.log(`  reproduced 523's published 60?                  ${at523.c523 === 60 ? 'YES' : `NO — ${at523.c523}`}`);
