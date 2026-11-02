// unit-464dir — stage 1b: the same 12 predicates, with their identifier declarations printed, and
// the two defects drive1 recorded repaired.
//
// drive1 (kept, and its .out is the recording of both) was wrong twice:
//
//  1. **`>` matched the `>` of an arrow function.** `GLIFT2`'s predicate contains no comparison at
//     all — its only `>` is in `(d) => d.key` inside the why-string's map callback. drive1 reported
//     `ops: >` for it, so `GSPANCMP` was satisfied VACUOUSLY on the one row whose operator set is
//     the finding. Repaired by blanking `=>` before any single-char operator test, and `GOPMODEL`
//     below is the known-positive/known-negative pair that keeps the repaired model refusable.
//  2. **A call site whose line begins `if (` was labelled `call`.** The first `(` at or after the
//     line start is then the `if`'s own paren, so the slicer captured the right TEXT under the
//     wrong NAME, and `enclosingIf` found nothing because an `if`'s condition is not inside its own
//     body. Repaired by reading the token before the matched `(`.
//
// The widening of the operator model is a correction, not a relaxation to fit: a conjunction of
// negated booleans (`preHas.x && !postHas.x`) is a predicate, and drive1's model called it a
// message string. `GOPMODEL` is what stops the widened model from accepting everything.
//
// What this stage adds: for every identifier in each predicate that is declared in the same file,
// the declaration line. That closure is the thing LEG-CLASS-CONVENTION.md §3 measured a detector
// failing to resolve. This file does not classify from it — it PRINTS it, for a hand read.

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = '/Users/xian/Development/klatch-worktrees/theseus';
const RES = join(ROOT, 'docs/research');
const SELF = 'unit-464dir-2026-11-02';
const PIN = 'b0de039bd79f3fa30daba69353d2eeaf48c42a2e';

const g = (args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const gates = [];
const gate = (id, ok, note) => { gates.push({ id, ok, note }); return ok; };

// ───────────────────────────────────────────────────────────────────── the repaired operator model
const MULTI = ['===', '!==', '==', '!=', '>=', '<=', '.includes(', '.has(', '.every(', '.some(', '.startsWith(', '.endsWith('];
const SINGLE = ['>', '<'];
const BOOL = ['&&', '||', '!'];

/** `=>` blanked, so an arrow is never read as `>`. Length-preserving. */
function blankArrows(t) {
  return t.replace(/=>/g, '  ');
}

/** The operators a predicate carries. A why-string carries none; that is what GOPMODEL asserts. */
function opsOf(text) {
  const t = blankArrows(text);
  const found = [];
  for (const o of MULTI) if (t.includes(o)) found.push(o);
  for (const o of SINGLE) if (t.includes(o)) found.push(o);
  for (const o of BOOL) if (t.includes(o)) found.push(o);
  return found;
}

// GOPMODEL — a known negative and a known positive for the widened model, in the model's own call
// shape. Without this the widening is unfalsifiable.
const KN = "`the two subject states differ (${a} -> ${b}) lines`".replace(/[`${}]/g, '');
const KP1 = 'a === b';
const KP2 = 'preHas.x && !postHas.x';
const KP3 = '(d) => d.key';   // the arrow alone must read as NO operator
gate('GOPMODEL',
  opsOf(KN).length === 0 && opsOf(KP1).length > 0 && opsOf(KP2).length > 0 && opsOf(KP3).length === 0,
  `KN(prose)=${opsOf(KN).length} KP(===)=${opsOf(KP1).length} KP(&&!)=${opsOf(KP2).length} KN(arrow)=${opsOf(KP3).length} — expect 0 / >0 / >0 / 0`);

// ───────────────────────────────────────────────────────────────── the population, from HIS TSV
const TSV = join(RES, 'unit-464class-2026-11-02/HAND-READ.tsv');
const allRows = readFileSync(TSV, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => { const [file, line, id, kind, cls, subkind, why] = l.split('\t'); return { file, line: Number(line), id, kind, cls, subkind, why }; });
const rows = allRows.filter((r) => r.cls === 'CROSS-STATE');
gate('GTSVSHAPE', allRows.length === 48 && rows.length === 12, `${allRows.length} rows, ${rows.length} CROSS-STATE (expect 48 / 12)`);

// ──────────────────────────────────────────────────────── GDOCPIN2: his figures, from his markdown
//
// Lifted out of LEG-CLASS-CONVENTION.md's own markdown literals and compared to a fresh count of
// his TSV. It does not recompute what it grades. A missing doc is a RED, not a skip.
let docNote = 'doc unreadable';
let docOk = false;
try {
  const doc = readFileSync(join(RES, 'LEG-CLASS-CONVENTION.md'), 'utf8');
  const m48 = doc.match(/call sites hand-read:\s*(\d+)/);
  const mCls = doc.match(/hand read:\s*PIN (\d+) · GATE (\d+) · CROSS-STATE (\d+) · UNMODELLED (\d+)/);
  const mSub = doc.match(/CROSS-STATE:\s*delta (\d+) · keyed (\d+)/);
  if (!m48 || !mCls || !mSub) throw new Error('figures not found in the doc');
  const d = {
    sites: Number(m48[1]), pin: Number(mCls[1]), gate: Number(mCls[2]), cross: Number(mCls[3]),
    unmod: Number(mCls[4]), delta: Number(mSub[1]), keyed: Number(mSub[2]),
  };
  const t = {
    sites: allRows.length,
    pin: allRows.filter((r) => r.cls === 'PIN').length,
    gate: allRows.filter((r) => r.cls === 'GATE').length,
    cross: rows.length,
    unmod: allRows.filter((r) => r.cls === 'UNMODELLED').length,
    delta: rows.filter((r) => r.subkind === 'delta').length,
    keyed: rows.filter((r) => r.subkind === 'keyed').length,
  };
  const diffs = Object.keys(d).filter((k) => d[k] !== t[k]);
  docOk = diffs.length === 0;
  docNote = `doc ${JSON.stringify(d)} vs TSV ${JSON.stringify(t)} — ${diffs.length ? 'DIFFER on ' + diffs.join(',') : 'agree on all 7'}`;
} catch (e) { docNote = `RED: ${e.message}`; }
gate('GDOCPIN2', docOk, docNote);

// ─────────────────────────────────────────────────────────────── GSELFEXCL, with the real count
const unitDirs = readdirSync(RES).filter((d) => d.startsWith('unit-464') && statSync(join(RES, d)).isDirectory());
const excluded = unitDirs.filter((d) => d === SELF);
gate('GSELFEXCL', excluded.length === 1, `${unitDirs.length} unit-464* dirs, ${excluded.length} excluded as own, ${unitDirs.length - excluded.length} on the surface`);

// ─────────────────────────────────────────────────────────────────────────────────── the slicer
function lineStarts(src) { const at = [0]; for (let i = 0; i < src.length; i++) if (src[i] === '\n') at.push(i + 1); return at; }
function matchParen(blank, open) {
  let depth = 0;
  for (let i = open; i < blank.length; i++) {
    if (blank[i] === '(') depth++;
    else if (blank[i] === ')') { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}
/** The token immediately before `(` — this is the repair for defect 2. */
function tokenBefore(blank, open) {
  let i = open - 1;
  while (i >= 0 && /\s/.test(blank[i])) i--;
  let end = i + 1;
  while (i >= 0 && /[A-Za-z0-9_$.]/.test(blank[i])) i--;
  return blank.slice(i + 1, end);
}

const sliced = [];
const srcCache = new Map();
for (const [ix, r] of rows.entries()) {
  const p = `docs/research/${r.file}`;
  if (!srcCache.has(p)) srcCache.set(p, g(['show', `${PIN}:${p}`]));
  const src = srcCache.get(p);
  const blank = stripSource(src, true);
  const starts = lineStarts(src);
  const from = starts[r.line - 1];
  const open = blank.indexOf('(', from);
  const to = matchParen(blank, open);
  const tok = tokenBefore(blank, open);
  const text = src.slice(open, to);

  // Identifier closure: every identifier in the predicate that this file declares.
  const idents = [...new Set((blankArrows(stripSource(text, true)).match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []))]
    .filter((w) => !['true', 'false', 'null', 'undefined', 'length', 'Array', 'isArray', 'JSON', 'stringify', 'map', 'join', 'split', 'const', 'if', 'return'].includes(w));
  const decls = [];
  const unresolved = [];
  const srcLines = src.split('\n');
  const blankLines = blank.split('\n');
  for (const id of idents) {
    const re = new RegExp(`(^|[^A-Za-z0-9_$.])(const|let|var|function|async function)\\s+${id}\\b`);
    const hits = [];
    for (let i = 0; i < blankLines.length; i++) if (re.test(blankLines[i])) hits.push(i + 1);
    if (hits.length === 0) unresolved.push(id);
    else for (const h of hits) decls.push({ id, line: h, text: srcLines[h - 1].trim() });
  }

  sliced.push({ ix, ...r, tok, took: tok === 'if' ? 'if-condition' : 'call-args', text, ops: opsOf(text), idents, decls, unresolved });
}

gate('GSPANREACH', sliced.every((s) => s.text.trim().length > 0), `${sliced.filter((s) => s.text.trim().length > 0).length} of 12 predicates non-empty`);
gate('GSPANCMP', sliced.every((s) => s.ops.length > 0), `${sliced.filter((s) => s.ops.length > 0).length} of 12 predicates carry >=1 operator under the repaired model`);
const arrowRows = sliced.filter((s) => /=>/.test(s.text));
gate('GARROW', arrowRows.length > 0 && arrowRows.every((s) => !opsOf(s.text).includes('>') || /[^=]>/.test(blankArrows(s.text))),
  `${arrowRows.length} of 12 predicates contain an arrow; none of them reports '>' from the arrow alone`);
gate('GIFLABEL', sliced.some((s) => s.took === 'if-condition'),
  `${sliced.filter((s) => s.took === 'if-condition').length} of 12 predicates are an if-condition (drive1 labelled all 12 'call')`);
gate('GCLOSURE', sliced.every((s) => s.decls.length > 0),
  `${sliced.filter((s) => s.decls.length > 0).length} of 12 predicates resolved >=1 same-file declaration; ${sliced.reduce((a, s) => a + s.unresolved.length, 0)} identifiers unresolved in total`);

const status = g(['status', '--porcelain', '--', 'packages/', 'scripts/']);
gate('GNODEPEND', status.length === 0, `git status --porcelain -- packages/ scripts/ is ${status.length} bytes`);

// ───────────────────────────────────────────────────────────────────────────────────── the report
const lines = [];
const say = (s = '') => lines.push(s);
say(`unit-464dir / slice-closure — pinned rev ${PIN.slice(0, 12)}, drive rev ${g(['rev-parse', 'HEAD']).trim().slice(0, 12)}`);
say();
for (const s of sliced) {
  say(`  [${s.ix}] ${s.file}:${s.line}  ${s.id}  (${s.kind})   his subkind: ${s.subkind}`);
  say(`      taken: ${s.took}  (token before the paren: '${s.tok}')   ops: ${s.ops.join(' ') || '(none)'}`);
  say('      ── predicate ──');
  for (const l of s.text.split('\n')) say(`      | ${l}`);
  say('      ── same-file declarations of its identifiers ──');
  for (const d of s.decls) say(`      ${String(d.line).padStart(4)}: ${d.text.slice(0, 160)}`);
  if (s.unresolved.length) say(`      unresolved (imported, global, or a property): ${s.unresolved.join(' ')}`);
  say();
}
say('GATES');
for (const gt of gates) say(`  ${gt.ok ? 'ok  ' : 'RED '} ${gt.id}  ${gt.note}`);
const allOk = gates.every((gt) => gt.ok);
say();
say(`VERDICT: ${allOk ? 'ok' : 'RED'} — ${gates.filter((gt) => !gt.ok).length} of ${gates.length} gates red`);

const text = lines.join('\n') + '\n';
process.stdout.write(text);
writeFileSync(join(RES, SELF, 'spans.12.closure.txt'), text);
process.exit(allOk ? 0 : 1);
