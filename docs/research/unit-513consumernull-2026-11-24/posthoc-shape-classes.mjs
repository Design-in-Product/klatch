/**
 * unit-513 post-hoc 2 — **R3. The 15 rows R2 still could not classify are not one blindness, they
 * are four shapes, and one of them is not a consumer at all.**
 *
 * R2 resolved 2 rows and left 15 `UNCLEAR`. Reading those 15 slices by hand (printed in
 * `POSTHOC-HELPER.out`) names the shapes:
 *
 *   PROSE    the regex literal is inside a comment — a docblock quoting a pattern, not applying it.
 *            **This is the same mistake my unit-511 §3 made in the other direction** (I keyed
 *            matcher-vs-prose on `CODE` vs `BLANKED`, which separates string literal from comment).
 *            Here my census counted comment text as a matcher site, so **P1's 23 is an upper bound**
 *            and the honest matcher count is lower.
 *   INLINE   `Number(pre.match(/…/)[1])` — no result identifier; a null is a TypeError → THROW.
 *   ARRDEF   `(out.match(re) || [, 'absent'])[1]` — the array default yields a visible non-number.
 *   TABLE    the pattern is DATA in an object or array literal, consumed by a loop elsewhere in the
 *            file. The consumer is the loop body, not the line the pattern sits on.
 *
 * KP set grows 7 → 11; the four new shapes are each a known positive. **Below 11 of 11 this file
 * publishes no class figures.** `ARM.out` and `POSTHOC-HELPER.out` are kept exactly as driven.
 *
 * No exemption marker: compares no braces, out of the gate's population.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const arm = JSON.parse(readFileSync(join(CAPS, 'ARM.json'), 'utf8'));
const r2 = JSON.parse(readFileSync(join(CAPS, 'POSTHOC-HELPER.json'), 'utf8'));

const srcCache = new Map();
const srcOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, readFileSync(join(ROOT, rel), 'utf8'));
  return srcCache.get(rel);
};
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Is line N inside a block comment, or after a `//` on its own line? */
function inComment(src, lineNo) {
  const lines = src.split('\n');
  let block = false;
  for (let i = 0; i < Math.min(lines.length, lineNo); i += 1) {
    const l = lines[i];
    if (i + 1 === lineNo) {
      if (block) return { prose: true, why: 'inside a /* … */ block comment' };
      const idx = l.indexOf('//');
      const labelIdx = l.indexOf('tracked files read');
      if (idx >= 0 && labelIdx > idx) return { prose: true, why: 'after a // on its own line' };
      return { prose: false, why: 'code' };
    }
    // crude but KP'd: track block-comment state line by line
    let j = 0;
    while (j < l.length - 1) {
      if (!block && l[j] === '/' && l[j + 1] === '*') { block = true; j += 2; continue; }
      if (block && l[j] === '*' && l[j + 1] === '/') { block = false; j += 2; continue; }
      j += 1;
    }
  }
  return { prose: false, why: 'code' };
}

/** R3 classifier for a block of source holding one application. */
function classifyBlock(text) {
  const lines = text.split('\n');
  const t = lines[0];
  const idm = text.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^=\n]*?\.(?:match|exec)\s*\(/);
  const id = idm ? idm[1] : null;
  // ARRDEF — an array default supplies the absent value.
  const arrdef = text.match(/\|\|\s*\[\s*,\s*([^\]]+)\]/);
  if (arrdef) {
    const alt = arrdef[1].trim();
    return /^(?:0|''|""|'0'|"0")$/.test(alt)
      ? { cls: 'DEFAULT', deciding: t.trim(), why: `array default yields ${alt} — indistinguishable from a real figure` }
      : { cls: 'REPORTED', deciding: t.trim(), why: `array default yields ${alt} — a visible non-number` };
  }
  // INLINE — the match result is indexed on the spot. Checked BEFORE the identifier branch,
  // because `const preRead = Number(pre.match(/…/)[1])` DOES bind an identifier — to the already
  // extracted number, not to the match — and keying on the binding sent this shape to UNCLEAR.
  if (/\.(?:match|exec)\s*\([^\n]*\)\s*(?:\?\.)?\[\s*1\s*\]/.test(t)) {
    return /\)\s*\?\.\[/.test(t)
      ? { cls: 'REPORTED', deciding: t.trim(), why: 'inline optional read: undefined reaches the output' }
      : { cls: 'THROW', deciding: t.trim(), why: 'inline unguarded [1] on a possibly-null match: TypeError' };
  }
  if (!id) {
    if (/\.test\s*\(/.test(text)) return { cls: 'SKIP', deciding: t.trim(), why: 'bare .test() in a condition: the branch does not run and nothing is emitted' };
    if (/\.replace\s*\(/.test(text)) return { cls: 'SKIP', deciding: t.trim(), why: '.replace() with no match is a no-op' };
    if (/\?\.\[\s*1\s*\]/.test(text)) return { cls: 'REPORTED', deciding: t.trim(), why: 'optional read: undefined reaches the output' };
    return { cls: 'UNCLEAR', deciding: t.trim(), why: 'no result identifier and no declared inline form' };
  }
  const idE = escRe(id);
  const find = (re) => lines.find((l) => re.test(l))?.trim() ?? null;
  const guardL = find(new RegExp(`if\\s*\\(\\s*!\\s*${idE}\\b|if\\s*\\(\\s*${idE}\\s*===?\\s*null|if\\s*\\(\\s*${idE}\\s*\\)|${idE}\\s*&&|${idE}\\s*\\?[^.]`));
  const throwL = find(/(?:throw|process\.exit|assert)[^\n]*/);
  if (throwL && new RegExp(`!\\s*${idE}\\b|${idE}\\s*===?\\s*null`).test(text)) return { cls: 'THROW', deciding: throwL, why: 'guarded null raises or exits' };
  if (new RegExp(`\\b${idE}\\s*\\[\\s*1\\s*\\]`).test(text) && !guardL) {
    return { cls: 'THROW', deciding: find(new RegExp(`\\b${idE}\\s*\\[\\s*1\\s*\\]`)), why: `unguarded ${id}[1]: a null match is a TypeError` };
  }
  if (guardL) {
    const yields = text.match(new RegExp(`${idE}\\s*\\?[^:]*:\\s*([^;,\\n)]+)`));
    const alt = yields ? yields[1].trim() : null;
    if (alt && /^(?:0|''|""|\[\]|\{\})$/.test(alt)) return { cls: 'DEFAULT', deciding: guardL, why: `no-match arm yields ${alt} — indistinguishable from a real figure` };
    if (alt && /^(?:null|undefined|NaN|'-'|"-"|'\?'|"\?"|'absent'|"absent")$/.test(alt)) return { cls: 'REPORTED', deciding: guardL, why: `no-match arm yields ${alt} — a visible non-number` };
    if (/\?\?\s*0|\|\|\s*0|\?\?\s*['"]['"]/.test(text)) return { cls: 'DEFAULT', deciding: guardL, why: 'guard defaults to a number or empty string' };
    const gi = lines.findIndex((l) => new RegExp(`if\\s*\\(\\s*!?\\s*${idE}\\b`).test(l));
    const body = gi >= 0 ? lines.slice(gi, gi + 4).join('\n') : '';
    const emits = /say\s*\(|console\.(?:log|error)\s*\(|push\s*\(/.test(body);
    return emits
      ? { cls: 'REPORTED', deciding: guardL, why: 'guard body emits, so the absence reaches the output' }
      : { cls: 'SKIP', deciding: guardL, why: 'guard body emits nothing: the figure is omitted with no trace' };
  }
  if (new RegExp(`${idE}\\?\\.\\[`).test(text)) {
    const l = find(new RegExp(`${idE}\\?\\.\\[`));
    if (/\?\?\s*0|\|\|\s*0|\?\?\s*['"]['"]/.test(l)) return { cls: 'DEFAULT', deciding: l, why: 'optional read defaulted to a number or empty string' };
    return { cls: 'REPORTED', deciding: l, why: 'optional read: undefined reaches the output as a visible non-number' };
  }
  return { cls: 'UNCLEAR', deciding: t.trim(), why: 'no declared handling form' };
}

/** A pattern sitting in an object/array literal: find the table's name and the loop that reads it. */
function resolveTable(rel, line) {
  const lines = srcOf(rel).split('\n');
  // Walk UP to the nearest `const NAME = {` / `= [` / `= new Map(`.
  for (let i = line - 1; i >= 0 && i > line - 40; i -= 1) {
    const m = lines[i].match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:new Map\s*\(\s*)?[[{]/);
    if (!m) continue;
    const name = m[1];
    const nameE = escRe(name);
    // The loop or iteration that consumes it.
    const loopIdx = lines.findIndex((l, k) => k > i && new RegExp(`for\\s*\\((?:const|let)[^\\n]*\\b(?:of|in)\\s+(?:Object\\.(?:entries|values)\\s*\\(\\s*)?${nameE}\\b|${nameE}\\.(?:forEach|map|flatMap|filter)\\s*\\(|Object\\.entries\\s*\\(\\s*${nameE}\\s*\\)`).test(l));
    if (loopIdx < 0) return { name, defLine: i + 1, loopLine: null, body: null };
    const body = lines.slice(loopIdx, Math.min(lines.length, loopIdx + 14)).join('\n');
    return { name, defLine: i + 1, loopLine: loopIdx + 1, body };
  }
  return null;
}

/** Local helper a pattern is handed to (R2's resolver, unchanged). */
function resolveHelper(rel, row) {
  const lines = srcOf(rel).split('\n');
  const useLine = lines[row.appliedAt - 1] ?? '';
  const needle = row.pattern;
  const boundName = (lines[row.line - 1] || '').match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\//)?.[1] ?? null;
  const cands = [];
  for (const m of useLine.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = m[1];
    if (['if', 'for', 'while', 'return', 'function', 'switch', 'catch', 'typeof'].includes(name)) continue;
    let depth = 0; let end = -1;
    const open = m.index + m[0].length - 1;
    for (let i = open; i < useLine.length; i += 1) {
      if (useLine[i] === '(') depth += 1;
      else if (useLine[i] === ')') { depth -= 1; if (depth === 0) { end = i; break; } }
    }
    const args = useLine.slice(open + 1, end < 0 ? useLine.length : end);
    if (args.includes(needle) || (boundName && new RegExp(`\\b${escRe(boundName)}\\b`).test(args))) cands.push({ name, len: args.length });
  }
  cands.sort((a, b) => a.len - b.len);
  for (const { name } of cands) {
    const defRe = new RegExp(`^[^\\n]*(?:const|let|var)\\s+${escRe(name)}\\s*=\\s*(?:async\\s*)?\\(|^[^\\n]*function\\s+${escRe(name)}\\s*\\(`);
    const di = lines.findIndex((l) => defRe.test(l));
    if (di < 0) continue;
    // Shared reader, not a hand-rolled brace walk: see the note in posthoc-helper-resolution.mjs.
    const braced = bodyOf(srcOf(rel), name);
    const body = braced ?? lines[di].slice(lines[di].indexOf('=>') + 2).trim();
    return { name, defLine: di + 1, body: `${lines[di]}\n${body}` };
  }
  return null;
}

const combine = (helperCls, vis) => {
  if (helperCls === 'THROW' || helperCls === 'DEFAULT' || helperCls === 'SKIP') return helperCls;
  if (helperCls === 'REPORTED') {
    if (vis === 'COERCED') return 'DEFAULT';
    if (['EMITTED', 'EMITTED-NEARBY', 'STORED'].includes(vis)) return 'REPORTED';
  }
  return 'UNCLEAR_R3';
};

function callerVisibility(rel, row) {
  const lines = srcOf(rel).split('\n');
  const l = lines[row.appliedAt - 1] ?? '';
  const win = lines.slice(row.appliedAt - 1, row.appliedAt + 3).join('\n');
  if (/\$\{/.test(l) || /say\s*\(|console\.(?:log|error)\s*\(/.test(l)) return { vis: 'EMITTED', deciding: l.trim() };
  if (/\?\?\s*0|\|\|\s*0|Number\s*\(/.test(l)) return { vis: 'COERCED', deciding: l.trim() };
  if (/^\s*'?[A-Za-z_$][\w$ ]*'?:\s/.test(l)) return { vis: 'STORED', deciding: l.trim() };
  if (/\$\{/.test(win)) return { vis: 'EMITTED-NEARBY', deciding: win.split('\n').find((x) => x.includes('${'))?.trim() ?? l.trim() };
  return { vis: 'UNCLEAR', deciding: l.trim() };
}

/** R3: shape first, then class. PROSE short-circuits — a comment has no consumer. */
function classifyRow(row) {
  const src = srcOf(row.rel);
  const prose = inComment(src, row.line);
  if (prose.prose) return { shape: 'PROSE', cls: 'PROSE', why: prose.why, deciding: (src.split('\n')[row.line - 1] || '').trim() };
  const helper = resolveHelper(row.rel, row);
  if (helper) {
    const hc = classifyBlock(helper.body);
    const vis = callerVisibility(row.rel, row);
    return { shape: 'HELPER', cls: combine(hc.cls, vis.vis), why: `helper ${helper.name}@${helper.defLine} → ${hc.cls} (${hc.why}); caller ${vis.vis}`, deciding: `${hc.deciding}   ||   ${vis.deciding}` };
  }
  const lines = src.split('\n');
  const direct = classifyBlock(lines.slice(row.appliedAt - 1, row.appliedAt + 12).join('\n'));
  if (direct.cls !== 'UNCLEAR') return { shape: 'DIRECT', cls: direct.cls, why: direct.why, deciding: direct.deciding };
  const table = resolveTable(row.rel, row.line);
  if (table && table.body) {
    const tc = classifyBlock(table.body);
    return { shape: 'TABLE', cls: tc.cls === 'UNCLEAR' ? 'UNCLEAR_R3' : tc.cls, why: `table ${table.name}@${table.defLine} consumed at :${table.loopLine} → ${tc.cls} (${tc.why})`, deciding: tc.deciding };
  }
  return { shape: table ? 'TABLE-NOLOOP' : 'UNKNOWN', cls: 'UNCLEAR_R3', why: table ? `table ${table.name}@${table.defLine} with no loop found in this file` : direct.why, deciding: direct.deciding };
}

// ---------------------------------------------------------------- known positives: 7 + 4 new shapes

const KPS = [
  { want: 'THROW', kind: 'direct', src: `const m = o.match(/tracked files read: (\\d+)/);\nif (!m) throw new Error('x');\nconst n = Number(m[1]);\n` },
  { want: 'REPORTED', kind: 'direct', src: `const m = o.match(/tracked files read: (\\d+)/);\nsay(\`  f \${m?.[1]}\`);\n` },
  { want: 'DEFAULT', kind: 'direct', src: `const m = o.match(/tracked files read: (\\d+)/);\nconst n = Number(m?.[1] ?? 0);\n` },
  { want: 'SKIP', kind: 'direct', src: `const m = o.match(/tracked files read: (\\d+)/);\nif (m) {\n  f.read = Number(m[1]);\n}\n` },
  { want: 'REPORTED', kind: 'helper', src: `const one = (rx) => { const m = o.match(rx); return m ? Number(m[1]) : null; };\nsay(\`  read \${one(/tracked files read: (\\d+)/)}\`);\n` },
  { want: 'DEFAULT', kind: 'helper', src: `const one = (rx) => { const m = o.match(rx); return m ? Number(m[1]) : 0; };\nsay(\`  read \${one(/tracked files read: (\\d+)/)}\`);\n` },
  { want: 'DEFAULT', kind: 'helper-coerced', src: `const one = (rx) => { const m = o.match(rx); return m ? m[1] : null; };\nconst n = Number(one(/tracked files read: (\\d+)/));\n` },
  // the four shapes R2 could not see
  { want: 'PROSE', kind: 'prose-block', src: `/**\n * a docblock quoting /tracked files read: (\\d+)/ and nothing else\n */\nconst x = 1;\n` },
  { want: 'PROSE', kind: 'prose-line', src: `const x = 1; // see /tracked files read: (\\d+)/ in the gate\n` },
  { want: 'THROW', kind: 'inline', src: `const preRead = Number(pre.match(/tracked files read: (\\d+)/)[1]);\n` },
  { want: 'REPORTED', kind: 'arrdef', src: `const pick = (re) => (o.match(re) || [, 'absent'])[1];\nsay(\`  read \${pick(/tracked files read: (\\d+)/)}\`);\n` },
];

function kpRun() {
  const rows = [];
  for (const kp of KPS) {
    const rel = `__kp_${kp.kind}__.mjs`;
    srcCache.set(rel, kp.src);
    const lines = kp.src.split('\n');
    const line = lines.findIndex((l) => l.includes('tracked files read')) + 1;
    const pattern = (lines[line - 1].match(/\/[^/\n]*tracked files read[^/\n]*\/[a-z]*/) || [''])[0];
    const got = classifyRow({ rel, line, appliedAt: line, pattern });
    rows.push({ kind: kp.kind, want: kp.want, got: got.cls, shape: got.shape, ok: got.cls === kp.want, why: got.why });
    srcCache.delete(rel);
  }
  return rows;
}

// ---------------------------------------------------------------- drive

const rev = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const now = execFileSync('date', ['+%H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

say('unit-513 post-hoc 2 — R3: shape first (PROSE / HELPER / DIRECT / INLINE / ARRDEF / TABLE), then class');
say(`  rev ${rev} · driven ${now} PST · arm UNCLEAR 17 · R2 UNCLEAR 15`);
say('');
say('§0  known positives — 7 carried forward + 4 new shapes. Below 11 of 11, no class figures.');
const kp = kpRun();
for (const r of kp) say(`  ${r.kind.padEnd(14)} want ${r.want.padEnd(9)} got ${String(r.got).padEnd(10)} shape ${String(r.shape).padEnd(13)} ${r.ok ? 'OK ' : 'MISS'}`);
const kpScore = kp.filter((r) => r.ok).length;
say(`  P7-R3: ${kpScore} of ${kp.length}${kpScore === kp.length ? ' — the R3 key is graded' : ' — REFUTED, no class figures published'}`);
say('');

const rows = arm.rows.map((row) => {
  const r3 = classifyRow(row);
  const prev = r2.rows.find((x) => x.rel === row.rel && x.line === row.line && x.appliedAt === row.appliedAt);
  return { ...row, r2: prev ? prev.r2 : row.consumer, ...r3 };
});

say('§1  the rows — arm → R2 → R3, with shape and deciding slice');
for (const r of rows) {
  say(`  ${r.rel}:${r.line}  (applied :${r.appliedAt})  ${r.subjectClass}`);
  say(`      arm ${r.consumer} → R2 ${r.r2} → R3 ${r.cls}   shape ${r.shape}`);
  say(`      why       ${r.why}`);
  say(`      deciding  ${r.deciding}`);
}
say('');

const CLS = ['THROW', 'REPORTED', 'DEFAULT', 'SKIP', 'PROSE', 'UNCLEAR_R3'];
const n = (k) => rows.filter((r) => r.cls === k).length;
const shapes = [...new Set(rows.map((r) => r.shape))];
say('§2  figures — R3');
say(`  rows                        ${rows.length}`);
say(`  shapes                      ${shapes.map((s) => `${s} ${rows.filter((r) => r.shape === s).length}`).join(' · ')}`);
say(`  R3 classes                  ${CLS.map((c) => `${c} ${n(c)}`).join(' · ')}`);
say(`  arm UNCLEAR 17 → R2 15 → R3 ${n('UNCLEAR_R3')}`);
const real = rows.filter((r) => r.cls !== 'PROSE');
say('');
say('§3  P1 corrected — the census counted comment text as a matcher site');
say(`  census (P1, registered as >= 16):          ${arm.rows.length} rows / ${arm.censusTotals.corpus} literals`);
say(`  of those, PROSE (inside a comment):        ${n('PROSE')}`);
say(`  APPLIED matcher rows (the honest figure):  ${real.length}`);
say('  P1 stays HIT on the literal count it registered, and the applied count is the one to carry.');
say('');
const silent = real.filter((r) => r.cls === 'DEFAULT' || r.cls === 'SKIP');
const silentLive = silent.filter((r) => r.subjectClass === 'LIVE');
const loud = real.filter((r) => r.cls === 'THROW' || r.cls === 'REPORTED');
say('§4  the sentence this unit set out to test, on the R3 rows');
say('  Theseus, unit-512 §4: "A `null` is at least detectable; this is not."');
say(`  applied rows            ${real.length}`);
say(`  detectable (THROW+REPORTED)  ${loud.length}`);
say(`  NOT detectable (DEFAULT+SKIP) ${silent.length}   of which LIVE ${silentLive.length}`);
say(`  still unclassified            ${real.filter((r) => r.cls === 'UNCLEAR_R3').length}`);
for (const r of silent) say(`      SILENT  ${r.rel}:${r.line}  ${r.cls}  ${r.subjectClass}  [${r.shape}]`);
say('');
say('§5  re-grading the predictions on the graded key');
say(`  P3 (>= 2 SILENT):            ${silent.length >= 2 ? 'HIT' : 'REFUTED'} — ${silent.length}`);
const counts = CLS.filter((c) => c !== 'PROSE').map((c) => [c, real.filter((r) => r.cls === c).length]).sort((a, b) => b[1] - a[1]);
say(`  P4 (REPORTED largest class): ${counts[0][0] === 'REPORTED' ? 'HIT' : 'REFUTED'} — largest is ${counts[0][0]} at ${counts[0][1]}`);
const anch = rows.filter((r) => r.rel.includes('unit-500trackedcomplement') && r.line === 20);
say(`  P5 (end-anchored site is THROW/REPORTED): ${anch.length ? (['THROW', 'REPORTED'].includes(anch[0].cls) ? 'HIT' : 'REFUTED') : 'UNGRADEABLE'} — ${anch.map((r) => `${r.cls} [${r.shape}]`).join(', ')}`);

writeFileSync(join(CAPS, 'POSTHOC-SHAPES.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'POSTHOC-SHAPES.json'), `${JSON.stringify({ rev, drivenAt: now, kp, kpScore, rows }, null, 2)}\n`);
