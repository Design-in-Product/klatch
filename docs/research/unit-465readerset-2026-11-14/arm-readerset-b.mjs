/**
 * unit-465readerset — arm B. The cured slicer, then the name-as-data selector census.
 *
 * Part 1 cures arm A's `bodyOf`: slice from the end of the PARAMETER LIST, not the first `{`, so an
 * export with a destructured object parameter is read at its body. Re-measures the property axis.
 *
 * Part 2 censuses the mechanism. Every occurrence of a library reader name in every tracked `.mjs`
 * under `docs/research/` at the pin is assigned to exactly one class by a CONTEXT MASK — a per-char
 * classification of the file into code / string / regex / line-comment / block-comment, carried
 * across lines. An occurrence inside a string or regex is NAME-AS-DATA: the name is selecting or
 * matching something, which is the shape Theseus's `READERS = [...]` key has.
 *
 * Declared scope limit, measured rather than asserted: `git` is exported by attested-rounds.mjs AND
 * is a locally-declared helper in most instruments AND is the literal argument to execFileSync. No
 * source key can attribute an occurrence of `git` to the library's export. The census therefore runs
 * TWICE — all nine axis names, and the eight excluding `git` — and publishes both, so the exclusion
 * carries a price instead of a label.
 *
 * Pin `e96741bf`. At that pin this unit has no members; no self-exclusion filter is used, and L0
 * asserts the pin does that work.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PIN = 'e96741bf';
const SELF_DIR = 'docs/research/unit-465readerset-2026-11-14/';
const THESEUS_UNIT = 'docs/research/unit-465refusalfate-2026-11-14/';

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

const legs = [];
const preds = [];
const check = (id, ok, why) => { legs.push({ id, ok, why }); return ok; };
const pred = (id, landed, why) => { preds.push({ id, landed, why }); return landed; };

// ── Part 1: the cured slicer and the re-measured property axis ───────────────────────────────────

/** Skip the parameter list by paren-matching from the `(` after the name, then slice the body. */
function bodyOfCured(src, startIdx) {
  const lp = src.indexOf('(', startIdx);
  if (lp < 0) return null;
  let d = 0, afterParams = -1;
  for (let i = lp; i < src.length; i += 1) {
    if (src[i] === '(') d += 1;
    else if (src[i] === ')') { d -= 1; if (d === 0) { afterParams = i + 1; break; } }
  }
  if (afterParams < 0) return null;
  const open = src.indexOf('{', afterParams);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
}
/** Arm A's slicer, kept verbatim so the cure's effect is a measured delta, not a recollection. */
function bodyOfArmA(src, startIdx) {
  const open = src.indexOf('{', startIdx);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
}
const returnsOf = (body) => [...body.matchAll(/\breturn\b([^;\n]*(?:\n(?![ \t]*\})[^;\n]*)*)/g)]
  .map((m) => m[0].replace(/\s+/g, ' ').trim());

const LIBS = ['docs/research/lib/verdict.mjs', 'docs/research/lib/attested-rounds.mjs'];
function classify(src, slicer) {
  const out = [];
  for (const m of src.matchAll(/^export function ([A-Za-z0-9_]+)\s*\(/gm)) {
    const name = m[1];
    const line = src.slice(0, m.index).split('\n').length;
    const body = slicer(src, m.index);
    if (body === null) { out.push({ name, line, kind: 'UNPARSED', refusalBearing: null }); continue; }
    const rets = returnsOf(body).join(' ⟂ ');
    const refusalBearing = /\bok\s*:/.test(rets) && (/\brefusal\s*:/.test(rets) || /\brefuse\w*\s*\(/.test(rets));
    const nameRead = /^read/.test(name);
    const stateRead = /\b(readFileSync|existsSync|execFileSync|spawnSync|git\s*\(|ls-tree|ls-files)/.test(body);
    out.push({
      name, line, endLine: line + body.split('\n').length - 1, nRets: returnsOf(body).length,
      kind: nameRead ? 'NAME_READ' : stateRead ? 'STATE_READ' : 'NEITHER', refusalBearing,
    });
  }
  return out;
}

const atPin = git(['ls-tree', '-r', '--name-only', PIN, 'docs/research/'])
  .split('\n').map((s) => s.trim()).filter((p) => p.endsWith('.mjs'));
check('L0', atPin.filter((p) => p.startsWith(SELF_DIR)).length === 0,
  `self-dir members at the pin: ${atPin.filter((p) => p.startsWith(SELF_DIR)).length} (0 — the pin excludes me)`);

const libSrc = new Map(LIBS.map((p) => [p, git(['show', `${PIN}:${p}`])]));
const old = LIBS.flatMap((p) => classify(libSrc.get(p), bodyOfArmA).map((r) => ({ ...r, p })));
const cured = LIBS.flatMap((p) => classify(libSrc.get(p), bodyOfCured).map((r) => ({ ...r, p })));

const READERISH = (r) => r.kind === 'NAME_READ' || r.kind === 'STATE_READ';
const moved = cured.filter((c) => {
  const o = old.find((x) => x.name === c.name && x.p === c.p);
  return o !== undefined && !READERISH(o) && READERISH(c);
});
pred('B6', moved.length >= 2,
  `exports moved out of NEITHER into a reader-shaped class by the cure: ${moved.length} `
  + `[${moved.map((r) => `${r.name}→${r.kind}`).join(', ')}]`);
const B6_NAMED = ['writeRecording', 'attestedRounds'];
const b6ReasonHolds = B6_NAMED.every((n) => moved.some((r) => r.name === n));
check('L1', true, `B6 reason graded separately: named [${B6_NAMED.join(',')}] both moved? ${b6ReasonHolds}`);

const curedReaders = cured.filter(READERISH);
const cBear = curedReaders.filter((r) => r.refusalBearing === true);
const cNot = curedReaders.filter((r) => r.refusalBearing !== true);
pred('B7', cNot.length > cBear.length,
  `after the cure: ${cNot.length} reader-shaped WITHOUT a refusal shape vs ${cBear.length} WITH `
  + `(arm A measured 6 vs 3 on a population of ${old.filter(READERISH).length})`);

const FOUR = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];
const fourChanged = FOUR.filter((n) => {
  const o = old.find((x) => x.name === n), c = cured.find((x) => x.name === n);
  return o === undefined || c === undefined || o.refusalBearing !== c.refusalBearing
    || o.kind !== c.kind || o.endLine !== c.endLine;
});
pred('B8', fourChanged.length === 0,
  `rows among the four named readers changed by the cure: ${fourChanged.length} [${fourChanged.join(',')}]`);
pred('B9', cured.filter((r) => r.kind === 'UNPARSED').length === 0,
  `unparsed under the CURED slicer: ${cured.filter((r) => r.kind === 'UNPARSED').length} — arm A's green A1 `
  + `reports 0 either way, so it was vacuous as a span guard, not wrong`);

const AXIS = new Map(curedReaders.map((r) => [r.name, r.refusalBearing === true]));

// ── Part 2: the context mask, then the occurrence census ─────────────────────────────────────────

/**
 * Per-char class for one file: 'c' code, 's' string, 'r' regex, '/' line comment, '*' block comment.
 * Regex-vs-division is decided by the last significant code char: a `/` opens a regex only after one
 * of ( , = : [ ! & | ? { ; or the start of a line/file, or after `return`/`typeof`/`case`.
 */
function maskOf(src) {
  const mask = new Array(src.length).fill('c');
  let i = 0, state = 'c', quote = '', lastSig = '';
  while (i < src.length) {
    const ch = src[i], nx = src[i + 1];
    if (state === 'c') {
      if (ch === '/' && nx === '/') { state = '/'; mask[i] = '/'; i += 1; continue; }
      if (ch === '/' && nx === '*') { state = '*'; mask[i] = '*'; i += 1; continue; }
      if (ch === '\'' || ch === '"' || ch === '`') { state = 's'; quote = ch; mask[i] = 's'; i += 1; continue; }
      if (ch === '/') {
        const opens = lastSig === '' || '(,=:[!&|?{;+'.includes(lastSig)
          || /(?:return|typeof|case)$/.test(src.slice(Math.max(0, i - 7), i).trim());
        if (opens) { state = 'r'; mask[i] = 'r'; i += 1; continue; }
      }
      mask[i] = 'c';
      if (!/\s/.test(ch)) lastSig = ch;
      i += 1; continue;
    }
    if (state === '/') { mask[i] = '/'; if (ch === '\n') { state = 'c'; lastSig = ''; } i += 1; continue; }
    if (state === '*') {
      mask[i] = '*';
      if (ch === '*' && nx === '/') { mask[i + 1] = '*'; i += 2; state = 'c'; continue; }
      i += 1; continue;
    }
    if (state === 's') {
      mask[i] = 's';
      if (ch === '\\') { if (i + 1 < src.length) mask[i + 1] = 's'; i += 2; continue; }
      if (ch === quote) { state = 'c'; lastSig = quote; }
      if (ch === '\n' && quote !== '`') { state = 'c'; lastSig = ''; } // unterminated: fail to code
      i += 1; continue;
    }
    // regex
    mask[i] = 'r';
    if (ch === '\\') { if (i + 1 < src.length) mask[i + 1] = 'r'; i += 2; continue; }
    if (ch === '\n') { state = 'c'; lastSig = ''; i += 1; continue; }
    if (ch === '/') { state = 'c'; lastSig = '/'; }
    i += 1;
  }
  return mask;
}

/** Spans of `import ... from '...'` statements, so an imported name is not also counted as data. */
function importSpans(src) {
  return [...src.matchAll(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]/gs)]
    .map((m) => [m.index, m.index + m[0].length]);
}

const paths = atPin.filter((p) => !p.startsWith('docs/research/lib/'));
function blobsAt(rev, list) {
  const input = `${list.map((p) => `${rev}:${p}`).join('\n')}\n`;
  const r = spawnSync('git', ['-C', ROOT, 'cat-file', '--batch'], { input, maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`cat-file exited ${r.status}`);
  const buf = r.stdout, out = new Map();
  let off = 0, i = 0;
  while (off < buf.length && i < list.length) {
    const nl = buf.indexOf(0x0a, off); if (nl < 0) break;
    const m = buf.slice(off, nl).toString('utf8').match(/^([0-9a-f]{40}) (\w+) (\d+)$/);
    if (!m) throw new Error(`cat-file refused for ${list[i]}`);
    const size = Number(m[3]);
    out.set(list[i], buf.slice(nl + 1, nl + 1 + size).toString('utf8'));
    off = nl + 1 + size + 1; i += 1;
  }
  if (out.size !== list.length) throw new Error(`got ${out.size} blobs for ${list.length}`);
  return out;
}
const texts = blobsAt(PIN, paths);

const ALL_NAMES = [...AXIS.keys()];
function census(names) {
  const occ = [];
  for (const p of paths) {
    const src = texts.get(p);
    const mask = maskOf(src);
    const imps = importSpans(src);
    const inImport = (idx) => imps.some(([a, b]) => idx >= a && idx < b);
    for (const name of names) {
      for (const m of src.matchAll(new RegExp(`\\b${name}\\b`, 'g'))) {
        const idx = m.index;
        const after = src.slice(idx + name.length, idx + name.length + 12);
        const before = src.slice(Math.max(0, idx - 2), idx);
        const mk = mask[idx];
        let cls;
        if (inImport(idx) && mk === 'c') cls = 'IMPORT';
        else if (mk === 's') cls = 'DATA_STRING';
        else if (mk === 'r') cls = 'DATA_REGEX';
        else if (mk === '/' || mk === '*') cls = 'COMMENT';
        else if (/^\s*\(/.test(after)) cls = before.endsWith('.') ? 'MEMBER_CALL' : 'CALL';
        else if (/^\s*[,}\])=;:]/.test(after) || /^\s*$/.test(after)) cls = 'REF_VALUE';
        else cls = 'UNCLASSIFIED';
        const line = src.slice(0, idx).split('\n').length;
        occ.push({ p, name, line, cls });
      }
    }
  }
  return occ;
}

const occAll = census(ALL_NAMES);
const EIGHT = ALL_NAMES.filter((n) => n !== 'git');
const occ8 = census(EIGHT);

function summarise(occ, label) {
  const by = {};
  for (const o of occ) by[o.cls] = (by[o.cls] ?? 0) + 1;
  const unc = occ.filter((o) => o.cls === 'UNCLASSIFIED').length;
  const rate = occ.length === 0 ? 0 : (unc / occ.length) * 100;
  return { label, n: occ.length, by, unc, rate };
}
const sAll = summarise(occAll, 'all 9 axis names');
const s8 = summarise(occ8, '8 names, `git` declared out');

// ── B5: the ceiling, on the census the other figures are read from (the 8-name one) ──────────────
const CEILING = 25;
const b5Fired = s8.rate > CEILING;
check('L2', !b5Fired,
  `B5 ceiling: UNCLASSIFIED ${s8.unc} of ${s8.n} = ${s8.rate.toFixed(1)}% against the 25% ceiling`
  + `${b5Fired ? ' — FIRED, every other arm-B figure below is VOID by the pre-reg' : ''}`);
check('L3', true,
  `price of the \`git\` exclusion, measured not asserted: ${sAll.n} occurrences over 9 names vs `
  + `${s8.n} over 8 — \`git\` alone accounts for ${sAll.n - s8.n}; its UNCLASSIFIED rate `
  + `${sAll.rate.toFixed(1)}% vs ${s8.rate.toFixed(1)}%`);

// ── B1–B4, read off the 8-name census ────────────────────────────────────────────────────────────
const dataOcc = occ8.filter((o) => o.cls === 'DATA_STRING' || o.cls === 'DATA_REGEX');
const dataFiles = [...new Set(dataOcc.map((o) => o.p))].sort();
pred('B1', dataFiles.length <= 12,
  `files using a reader name AS DATA: ${dataFiles.length} (<=12?) out of `
  + `${new Set(occ8.map((o) => o.p)).size} files mentioning one at all`);

const namesPerFile = new Map(dataFiles.map((p) => [p, [...new Set(dataOcc.filter((o) => o.p === p).map((o) => o.name))].sort()]));
const setFiles = dataFiles.filter((p) => namesPerFile.get(p).length >= 2);
pred('B2', setFiles.length >= 2,
  `files whose data-names number >=2 (a name-SET selector): ${setFiles.length} (>=2?) `
  + `[${setFiles.map((p) => `${p.split('/').slice(-1)}:${namesPerFile.get(p).length}`).join(', ')}]`);

const admitsNonBearing = dataFiles.filter((p) => namesPerFile.get(p).some((n) => AXIS.get(n) === false));
const outsideHis = admitsNonBearing.filter((p) => !p.startsWith(THESEUS_UNIT));
pred('B3', outsideHis.length >= 1,
  `files admitting a NON-refusal-bearing reader as data, outside Theseus's unit: ${outsideHis.length} `
  + `(>=1?) [${outsideHis.join(', ')}]`);
check('L4', admitsNonBearing.some((p) => p.startsWith(THESEUS_UNIT)),
  `KNOWN POSITIVE recovered: Theseus's own unit is in the admits-non-bearing set? `
  + `${admitsNonBearing.filter((p) => p.startsWith(THESEUS_UNIT)).join(', ') || 'NO — the census misses the one site we know carries it'}`);

const dataNameCounts = {};
for (const o of dataOcc) dataNameCounts[o.name] = (dataNameCounts[o.name] ?? 0) + 1;
const topData = Object.entries(dataNameCounts).sort((a, b) => b[1] - a[1]);
const soloFiles = dataFiles.filter((p) => namesPerFile.get(p).length === 1 && namesPerFile.get(p)[0] === 'readVerdict');
pred('B4', topData.length > 0 && topData[0][0] === 'readVerdict' && soloFiles.length > setFiles.length,
  `most common data-name: ${topData.map(([n, c]) => `${n}×${c}`).join(' · ')} · `
  + `files whose ONLY data-name is readVerdict: ${soloFiles.length} vs name-set files ${setFiles.length}`);

// ── C2: the latent-hazard population — an import is not a call and not a selector ────────────────
const BEARERS = ['readVerdict', 'readTail', 'readRows'];
const importsOf = new Map();
for (const p of paths) {
  const src = texts.get(p);
  const named = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*)['"]/gs)) {
    if (!/lib\/(verdict|attested-rounds)\.mjs$/.test(m[2])) continue;
    for (const raw of m[1].split(',')) {
      const n = raw.trim().split(/\s+as\s+/)[0].trim();
      if (n !== '') named.add(n);
    }
  }
  importsOf.set(p, named);
}
const c2Files = paths.filter((p) => importsOf.get(p).has('readCorpusRows')
  && BEARERS.some((b) => importsOf.get(p).has(b)));
pred('C2', c2Files.length >= 2,
  `files importing readCorpusRows alongside >=1 refusal-bearing reader: ${c2Files.length} (>=2?) `
  + `[${c2Files.join(', ')}]`);

// ── output ───────────────────────────────────────────────────────────────────────────────────────
console.log('── arm B · cured slicer + name-as-data census, pin e96741bf ──\n');
console.log('PART 1 — the cure\n');
for (const c of cured) {
  const o = old.find((x) => x.name === c.name && x.p === c.p);
  const delta = o && (o.kind !== c.kind || o.endLine !== c.endLine) ? '  <<< MOVED' : '';
  console.log(`  ${c.refusalBearing ? 'BEARING ' : 'NO-SHAPE'} ${c.kind.padEnd(10)} ${c.name.padEnd(20)} `
    + `${c.p.replace('docs/research/lib/', '')}@${c.line}-${c.endLine} rets=${c.nRets} `
    + `(arm A: ${o ? `${o.kind}@${o.line}-${o.endLine} rets=${o.nRets}` : 'absent'})${delta}`);
}
console.log(`\nreader-shaped: arm A ${old.filter(READERISH).length} → cured ${curedReaders.length}`);
console.log(`refusal shape: WITH ${cBear.length} [${cBear.map((r) => r.name).join(',')}] · WITHOUT ${cNot.length} [${cNot.map((r) => r.name).join(',')}]`);

console.log(`\nPART 2 — occurrence census over ${paths.length} tracked .mjs under docs/research/ (lib/ excluded as the subject)\n`);
for (const s of [sAll, s8]) {
  console.log(`  ${s.label}: ${s.n} occurrences`);
  for (const [k, v] of Object.entries(s.by).sort((a, b) => b[1] - a[1])) console.log(`      ${k.padEnd(14)} ${v}`);
  console.log(`      UNCLASSIFIED rate ${s.rate.toFixed(1)}%\n`);
}
console.log('name-as-data sites, by file:\n');
for (const p of dataFiles) {
  const ns = namesPerFile.get(p);
  const flag = ns.some((n) => AXIS.get(n) === false) ? ' ADMITS-NON-BEARING' : '';
  const lines = dataOcc.filter((o) => o.p === p).map((o) => `${o.name}@${o.line}/${o.cls === 'DATA_REGEX' ? 'rx' : 'str'}`);
  console.log(`  ${ns.length >= 2 ? 'SET ' : 'one '}${p}${flag}\n        ${lines.join(' ')}`);
}
if (occ8.filter((o) => o.cls === 'UNCLASSIFIED').length > 0) {
  console.log('\nUNCLASSIFIED occurrences (the refusal bucket B5 reads), listed so arm C can hand-read them:\n');
  for (const o of occ8.filter((x) => x.cls === 'UNCLASSIFIED')) console.log(`  ${o.p}:${o.line} ${o.name}`);
}
console.log(`\n${renderVerdict({ legs, preds })}`);
process.exit(legs.some((l) => l.ok === false) ? 1 : 0);
