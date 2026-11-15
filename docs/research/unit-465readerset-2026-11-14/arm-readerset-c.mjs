/**
 * unit-465readerset — arm C. The selector/label split.
 *
 * Arm B's `DATA_STRING` fused a name inside a SELECTOR with a name inside a LABEL, and reported 36
 * files where the selector count is smaller. This arm splits the class by the occurrence's
 * ENCLOSING BRACKET and CALLEE, keeps an `UNRESOLVED` refusal bucket with a pre-registered 30%
 * ceiling, and prints the verbatim source line for every SELECTOR so the published classification
 * can be a hand map rather than the arm's own say-so.
 *
 * Published with `renderTail`, not `renderVerdict`: arms A and B emitted a verdict line whose leg
 * and prediction reason strings are absent from their recordings, so B1's and B4's figures are not
 * in the artefact that carries them.
 *
 * Pin `e96741bf`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderTail } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PIN = 'e96741bf';
const SELF_DIR = 'docs/research/unit-465readerset-2026-11-14/';
const KP_FILE = 'docs/research/unit-465refusalfate-2026-11-14/arm-refusalfate-a.mjs';
const KP_LINE = 73;

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
const legs = [];
const preds = [];
// The row field is `what`, NOT `why`. renderRowSet reads `it.what ?? ''`, so a `why` renders an
// empty detail and the figure the leg was scored on reaches nothing. drive3 was published that way
// (verdict.mjs:437-447 documents the same defect from Round 449); drive4 is this arm with the field
// corrected and no other change. `what` must be newline-free, so reasons are joined with ' · '.
const one = (s) => String(s).replace(/\s*\n\s*/g, ' · ');
const check = (id, ok, what) => { legs.push({ id, ok, what: one(what) }); return ok; };
const pred = (id, landed, what) => { preds.push({ id, landed, what: one(what) }); return landed; };

// ── the property axis, re-derived here from the cured slicer rather than retyped ─────────────────
function bodyOfCured(src, startIdx) {
  const lp = src.indexOf('(', startIdx);
  if (lp < 0) return null;
  let d = 0, after = -1;
  for (let i = lp; i < src.length; i += 1) {
    if (src[i] === '(') d += 1;
    else if (src[i] === ')') { d -= 1; if (d === 0) { after = i + 1; break; } }
  }
  if (after < 0) return null;
  const open = src.indexOf('{', after);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
}
const LIBS = ['docs/research/lib/verdict.mjs', 'docs/research/lib/attested-rounds.mjs'];
const AXIS = new Map();
const MODULE_OF = new Map();
for (const p of LIBS) {
  const src = git(['show', `${PIN}:${p}`]);
  for (const m of src.matchAll(/^export function ([A-Za-z0-9_]+)\s*\(/gm)) {
    const body = bodyOfCured(src, m.index);
    if (body === null) continue;
    const rets = [...body.matchAll(/\breturn\b([^;\n]*(?:\n(?![ \t]*\})[^;\n]*)*)/g)].map((x) => x[0]).join(' ');
    const bearing = /\bok\s*:/.test(rets) && (/\brefusal\s*:/.test(rets) || /\brefuse\w*\s*\(/.test(rets));
    const readerish = /^read/.test(m[1])
      || /\b(readFileSync|existsSync|execFileSync|spawnSync|git\s*\(|ls-tree|ls-files)/.test(body);
    if (readerish) { AXIS.set(m[1], bearing); MODULE_OF.set(m[1], p.endsWith('attested-rounds.mjs') ? 'attested' : 'verdict'); }
  }
}
check('M0', AXIS.size === 10 && AXIS.get('readCorpusRows') === false && AXIS.get('readVerdict') === true,
  `axis re-derived here, not retyped: ${AXIS.size} reader-shaped exports, `
  + `bearing=[${[...AXIS].filter(([, v]) => v).map(([k]) => k).join(',')}]`);

// ── context mask (identical key to arm B, so the split is a refinement of that census) ───────────
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
      if (ch === '\n' && quote !== '`') { state = 'c'; lastSig = ''; }
      i += 1; continue;
    }
    mask[i] = 'r';
    if (ch === '\\') { if (i + 1 < src.length) mask[i + 1] = 'r'; i += 2; continue; }
    if (ch === '\n') { state = 'c'; lastSig = ''; i += 1; continue; }
    if (ch === '/') { state = 'c'; lastSig = '/'; }
    i += 1;
  }
  return mask;
}

/**
 * The innermost unmatched bracket at or before `idx`, counting only chars the mask calls code, plus
 * the identifier immediately before it when that bracket is `(`.
 */
function enclosing(src, mask, idx) {
  let p = 0, b = 0, c = 0;
  for (let i = idx - 1; i >= 0; i -= 1) {
    if (mask[i] !== 'c') continue;
    const ch = src[i];
    if (ch === ')') p += 1; else if (ch === ']') b += 1; else if (ch === '}') c += 1;
    else if (ch === '(') { if (p > 0) p -= 1; else { const m = src.slice(Math.max(0, i - 40), i).match(/([A-Za-z0-9_$.]+)\s*$/); return { kind: '(', callee: m === null ? '' : m[1] }; } }
    else if (ch === '[') { if (b > 0) b -= 1; else return { kind: '[', callee: '' }; }
    else if (ch === '{') { if (c > 0) c -= 1; else return { kind: '{', callee: '' }; }
  }
  return { kind: 'none', callee: '' };
}

const MATCHERS = ['RegExp', 'includes', 'test', 'match', 'matchAll', 'exec', 'startsWith', 'endsWith',
  'indexOf', 'lastIndexOf', 'split', 'replace', 'replaceAll', 'has', 'get', 'set', 'filter', 'some',
  'every', 'find', 'findIndex', 'search'];
const LABELLERS = ['log', 'error', 'warn', 'leg', 'check', 'pred', 'join', 'padEnd', 'padStart',
  'stringify', 'Error', 'write', 'appendFileSync', 'writeFileSync', 'concat'];
const tailId = (callee) => callee.split('.').filter((s) => s !== '').pop() ?? '';

const atPin = git(['ls-tree', '-r', '--name-only', PIN, 'docs/research/'])
  .split('\n').map((s) => s.trim()).filter((p) => p.endsWith('.mjs'));
check('M1', atPin.filter((p) => p.startsWith(SELF_DIR)).length === 0,
  `self-dir members at the pin: ${atPin.filter((p) => p.startsWith(SELF_DIR)).length} (0 — pin, not filter)`);

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

// `git` stays out, for the reason arm B measured: 2244 of 2790 occurrences, unattributable to the
// library's export by any source key.
const NAMES = [...AXIS.keys()].filter((n) => n !== 'git');

const occ = [];
for (const p of paths) {
  const src = texts.get(p);
  const mask = maskOf(src);
  const imps = [...src.matchAll(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]/gs)]
    .map((m) => [m.index, m.index + m[0].length]);
  const lineStarts = [0];
  for (let i = 0; i < src.length; i += 1) if (src[i] === '\n') lineStarts.push(i + 1);
  const lineAt = (idx) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1; } return lo; };
  for (const name of NAMES) {
    for (const m of src.matchAll(new RegExp(`\\b${name}\\b`, 'g'))) {
      const idx = m.index;
      const mk = mask[idx];
      if (mk !== 's' && mk !== 'r') continue;                              // not name-as-data
      if (imps.some(([a, b]) => idx >= a && idx < b)) continue;            // an import, not data
      const li = lineAt(idx);
      const text = src.slice(lineStarts[li], (lineStarts[li + 1] ?? src.length) - 1);
      const enc = enclosing(src, mask, idx);
      const id = tailId(enc.callee);
      // comparison position: `=== 'name'` / `!== 'name'`, read off the code before the quote
      const codeBefore = src.slice(Math.max(0, idx - 30), idx).replace(/['"`]\s*$/, '');
      const cmp = /(===|!==|==|!=)\s*$/.test(codeBefore);
      let cls;
      if (mk === 'r') cls = 'SELECTOR';                 // a regex literal matches, by construction
      else if (enc.kind === '[') cls = 'SELECTOR';      // an element of a membership list
      else if (cmp) cls = 'SELECTOR';
      else if (enc.kind === '(' && MATCHERS.includes(id)) cls = 'SELECTOR';
      else if (enc.kind === '(' && LABELLERS.includes(id)) cls = 'LABEL';
      else cls = 'UNRESOLVED';
      occ.push({ p, name, line: li + 1, cls, enc: `${enc.kind}${id ? `:${id}` : ''}`, mk, text: text.trim() });
    }
  }
}

// ── C8: the ceiling, before any figure is read off this census ───────────────────────────────────
const unres = occ.filter((o) => o.cls === 'UNRESOLVED');
const rate = occ.length === 0 ? 0 : (unres.length / occ.length) * 100;
const c8Fired = rate > 30;
check('M2', !c8Fired,
  `C8 ceiling: UNRESOLVED ${unres.length} of ${occ.length} name-as-data occurrences = ${rate.toFixed(1)}%`
  + ` against 30%${c8Fired ? ' — FIRED, C4/C5/C7 are VOID' : ''}`);

const sel = occ.filter((o) => o.cls === 'SELECTOR');
const lab = occ.filter((o) => o.cls === 'LABEL');
const selFiles = [...new Set(sel.map((o) => o.p))].sort();
const dataFiles = [...new Set(occ.map((o) => o.p))].sort();

// ── C6: the known positive, named and located, not recognised ────────────────────────────────────
const kp = sel.filter((o) => o.p === KP_FILE && o.line === KP_LINE);
const kpNames = [...new Set(kp.map((o) => o.name))].sort();
check('M3', kpNames.length === 4,
  `KNOWN POSITIVE ${KP_FILE}:${KP_LINE} classified SELECTOR on ${kpNames.length} of 4 names `
  + `[${kpNames.join(',')}] — a census that loses it is measuring something else`);
pred('C6', kpNames.length === 4, `KP recovered on all four names: ${kpNames.join(',') || 'NONE'}`);

pred('C4', selFiles.length <= 15,
  `files with >=1 SELECTOR occurrence: ${selFiles.length} (<=15?), down from arm B's `
  + `${dataFiles.length} name-as-data files`);

// ── C5 / C7: who admits a non-bearing reader, in a selector position ─────────────────────────────
const selNamesPerFile = new Map(selFiles.map((p) => [p, [...new Set(sel.filter((o) => o.p === p).map((o) => o.name))].sort()]));
const admits = selFiles.filter((p) => selNamesPerFile.get(p).some((n) => AXIS.get(n) === false));
pred('C5', admits.length <= 8,
  `SELECTOR files admitting a NON-refusal-bearing reader: ${admits.length} (<=8?), against arm B's `
  + `24 on the un-split key [${admits.map((p) => p.split('/').slice(-2).join('/')).join(', ')}]`);

const admitOcc = sel.filter((o) => AXIS.get(o.name) === false);
const byModule = { attested: 0, verdict: 0 };
for (const o of admitOcc) byModule[MODULE_OF.get(o.name)] += 1;
const admitFilesByModule = { attested: 0, verdict: 0, both: 0 };
for (const p of admits) {
  const mods = new Set(selNamesPerFile.get(p).filter((n) => AXIS.get(n) === false).map((n) => MODULE_OF.get(n)));
  if (mods.has('attested') && mods.has('verdict')) admitFilesByModule.both += 1;
  else if (mods.has('attested')) admitFilesByModule.attested += 1;
  else admitFilesByModule.verdict += 1;
}
pred('C7', admitFilesByModule.attested > admitFilesByModule.verdict,
  `admitting SELECTOR files by which module's non-bearing reader they name: attested-rounds only `
  + `${admitFilesByModule.attested} · verdict only ${admitFilesByModule.verdict} · both `
  + `${admitFilesByModule.both} (occurrences: attested ${byModule.attested}, verdict ${byModule.verdict})`);

// ── C2 / C3: the latent-hazard population, and whether anyone tests `.ok` ────────────────────────
const BEARERS = ['readVerdict', 'readTail', 'readRows'];
const importsOf = new Map();
for (const p of paths) {
  const named = new Set();
  for (const m of texts.get(p).matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*)['"]/gs)) {
    if (!/lib\/(verdict|attested-rounds)\.mjs$/.test(m[2])) continue;
    for (const raw of m[1].split(',')) { const n = raw.trim().split(/\s+as\s+/)[0].trim(); if (n !== '') named.add(n); }
  }
  importsOf.set(p, named);
}
const c2 = paths.filter((p) => importsOf.get(p).has('readCorpusRows') && BEARERS.some((b) => importsOf.get(p).has(b)));
pred('C2', c2.length >= 2, `files importing readCorpusRows alongside >=1 bearing reader: ${c2.length} (>=2?) [${c2.join(', ')}]`);
const neverOk = c2.filter((p) => !/\.ok\b/.test(texts.get(p)));
pred('C3', neverOk.length >= 1,
  `of those, files that never write \`.ok\` at all: ${neverOk.length} (>=1?) [${neverOk.join(', ')}]`);

// ── C1 is a claim about a justifying SENTENCE. No source key reads one. ──────────────────────────
check('M4', true,
  `C1 is NOT decided by this arm: it asks whether a site's prose justifies its population in `
  + `refusal terms, which is a hand read over the ${admits.length} C5 survivors, listed below`);

// ── output ───────────────────────────────────────────────────────────────────────────────────────
console.log(`── arm C · selector/label split over ${paths.length} tracked .mjs, pin ${PIN} ──\n`);
console.log(`name-as-data occurrences (8 names, \`git\` out): ${occ.length}`);
console.log(`  SELECTOR   ${sel.length}  in ${selFiles.length} files`);
console.log(`  LABEL      ${lab.length}  in ${new Set(lab.map((o) => o.p)).size} files`);
console.log(`  UNRESOLVED ${unres.length}  (${rate.toFixed(1)}%, ceiling 30%)\n`);

console.log('SELECTOR occurrences, verbatim source line, for the hand map:\n');
for (const p of selFiles) {
  const ns = selNamesPerFile.get(p);
  const flag = ns.some((n) => AXIS.get(n) === false) ? '  ADMITS-NON-BEARING' : '';
  console.log(`${p}${flag}`);
  for (const o of sel.filter((x) => x.p === p)) {
    console.log(`   ${String(o.line).padStart(5)} ${o.mk === 'r' ? 'rx ' : 'str'} ${o.name.padEnd(19)} enc=${o.enc.padEnd(16)} │ ${o.text.slice(0, 118)}`);
  }
  console.log('');
}
console.log(`UNRESOLVED occurrences — the refusal bucket, listed so the ceiling is auditable:\n`);
for (const o of unres) console.log(`   ${o.p}:${o.line} ${o.name} enc=${o.enc} │ ${o.text.slice(0, 110)}`);
console.log(`\nLABEL occurrences, by file (arm B counted every one of these as a selector):\n`);
for (const p of [...new Set(lab.map((o) => o.p))].sort()) {
  console.log(`   ${p}: ${lab.filter((o) => o.p === p).map((o) => `${o.name}@${o.line}`).join(' ')}`);
}
console.log(`\n${renderTail({ legs, preds })}`);
process.exit(legs.some((l) => l.ok === false) ? 1 : 0);
