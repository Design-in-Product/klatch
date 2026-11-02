// unit-464dir — stage 1: slice the 12 CROSS-STATE predicates from the PINNED rev.
//
// This stage prints NO direction, NO sub-kind and NO cure-reach verdict for any row. The hand read
// filed as `HAND-READ-12.tsv` — its own commit, before `grade-direction.mjs` exists — is the
// verdict. A sub-kind printed here would be an answer key for that read.
//
// Everything is sliced from rev b0de039b, which is the rev his line numbers are keyed on (stated
// in his TSV header). Slicing from the worktree would mis-aim every row the moment either tree
// moves, and the mis-aim would be silent. GREV prints the pinned blob hash beside the HEAD blob
// hash of all five subject files so a divergence is visible instead.
//
// Per LEG-CLASS-CONVENTION.md §4, "a refusal site's predicate is not in its span": for every row
// this prints BOTH the call-argument span and the enclosing `if (…)` condition, and names which
// one it took as the predicate.

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

// ───────────────────────────────────────────────────────────── the population, from HIS hand read
//
// Lifted out of his TSV rather than retyped: the row set is his, and a retyped row set could not
// disagree with him about which sites are CROSS-STATE.
const TSV = join(RES, 'unit-464class-2026-11-02/HAND-READ.tsv');
const tsvLines = readFileSync(TSV, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
const allRows = tsvLines.map((l) => {
  const [file, line, id, kind, cls, subkind, why] = l.split('\t');
  return { file, line: Number(line), id, kind, cls, subkind, why };
});
const rows = allRows.filter((r) => r.cls === 'CROSS-STATE');

gate('GTSVSHAPE', allRows.length === 48 && rows.length === 12,
  `his TSV parses to ${allRows.length} rows, ${rows.length} CROSS-STATE (expect 48 / 12)`);

const files = [...new Set(rows.map((r) => r.file))];
gate('GFILES', files.length === 5, `${files.length} distinct subject files (expect 5)`);

// ─────────────────────────────────────────────────────────────────────────── GREV: pin vs HEAD
const revNotes = [];
let revOk = true;
for (const f of files) {
  const p = `docs/research/${f}`;
  let pinned = 'MISSING', head = 'MISSING';
  try { pinned = g(['rev-parse', `${PIN}:${p}`]).trim(); } catch { revOk = false; }
  try { head = g(['rev-parse', `HEAD:${p}`]).trim(); } catch { /* reported as MISSING */ }
  revNotes.push(`${pinned.slice(0, 12)} pinned · ${head.slice(0, 12)} HEAD · ${pinned === head ? 'IDENTICAL' : 'DIVERGED'} · ${f}`);
  if (pinned === 'MISSING') revOk = false;
}
gate('GREV', revOk, `all 5 subject files readable at the pin; ${revNotes.filter((n) => n.includes('DIVERGED')).length} diverged from HEAD`);

// ────────────────────────────────────────────── GSELFEXCL: an instrument does not census its own
//
// The surface is every `unit-464*` directory under docs/research/. This unit's own directory is
// one of them — it exists, PRE-REGISTRATION.md is committed in it — so the exclusion count is a
// figure a cure could move, not a constant 0.
const unitDirs = readdirSync(RES).filter((d) => d.startsWith('unit-464') && statSync(join(RES, d)).isDirectory());
const excluded = unitDirs.filter((d) => d === SELF);
const surface = unitDirs.filter((d) => d !== SELF);
gate('GSELFEXCL', excluded.length === 1 && !surface.includes(SELF),
  `${unitDirs.length} unit-464* dirs seen, ${excluded.length} excluded (own: ${SELF}), ${surface.length} on the surface`);

// ──────────────────────────────────────────────────────────────────────────────── the slicer
const CMP = ['===', '!==', '==', '!=', '>=', '<=', '>', '<', '.includes(', '.has(', '.every(', '.some(', '.startsWith(', '.endsWith('];

function lineStarts(src) {
  const at = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') at.push(i + 1);
  return at;
}

/** The index just past the `)` matching the `(` at `open`, read off the BLANKED copy. */
function matchParen(blank, open) {
  let depth = 0;
  for (let i = open; i < blank.length; i++) {
    if (blank[i] === '(') depth++;
    else if (blank[i] === ')') { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

/** The call-argument span of the first `(` at or after line `ln`. */
function callSpan(src, blank, starts, ln) {
  const from = starts[ln - 1];
  if (from === undefined) return null;
  const open = blank.indexOf('(', from);
  if (open < 0) return null;
  const end = matchParen(blank, open);
  if (end < 0) return null;
  return { from: open, to: end, text: src.slice(open, end) };
}

/** The nearest enclosing `if (…)` condition whose body contains `at`, or null. */
function enclosingIf(src, blank, at) {
  let best = null;
  for (let i = 0; i + 2 < at; i++) {
    if (blank.slice(i, i + 2) !== 'if') continue;
    const before = i === 0 ? ' ' : blank[i - 1];
    if (/[A-Za-z0-9_$]/.test(before)) continue;      // `elif`, `notif`, an identifier ending in "if"
    let j = i + 2;
    while (j < blank.length && /\s/.test(blank[j])) j++;
    if (blank[j] !== '(') continue;
    const end = matchParen(blank, j);
    if (end < 0) continue;
    // Does the `if`'s body (from `end` to the end of its statement/block) contain `at`?
    let k = end;
    while (k < blank.length && /\s/.test(blank[k])) k++;
    let bodyEnd;
    if (blank[k] === '{') {
      let depth = 0;
      bodyEnd = blank.length;
      for (let m = k; m < blank.length; m++) {
        if (blank[m] === '{') depth++;
        else if (blank[m] === '}') { depth--; if (depth === 0) { bodyEnd = m + 1; break; } }
      }
    } else {
      const semi = blank.indexOf(';', k);
      bodyEnd = semi < 0 ? blank.length : semi + 1;
    }
    if (at >= end && at < bodyEnd) best = { from: j, to: end, text: src.slice(j, end) };
  }
  return best;
}

// A +1 perturbation of ONE named row's line number, to show the slicer is not constant.
// Graded as a delta against a matched un-crippled drive, never on its own.
const CRIPPLE = process.env.DIR_CRIPPLE_ROW ? Number(process.env.DIR_CRIPPLE_ROW) : null;

const sliced = [];
const srcCache = new Map();
for (const [ix, r] of rows.entries()) {
  const p = `docs/research/${r.file}`;
  if (!srcCache.has(p)) srcCache.set(p, g(['show', `${PIN}:${p}`]));
  const src = srcCache.get(p);
  const blank = stripSource(src, true);
  const starts = lineStarts(src);
  const ln = CRIPPLE === ix ? r.line + 1 : r.line;

  const call = callSpan(src, blank, starts, ln);
  const encl = call ? enclosingIf(src, blank, call.from) : null;

  // Which one is the predicate? The call span, unless it carries no comparison and the enclosing
  // `if` does — which is the `refuse(id, why)` shape §4 names.
  const hasCmp = (t) => t && CMP.some((c) => t.includes(c));
  let took = 'call';
  if (!hasCmp(call && call.text) && hasCmp(encl && encl.text)) took = 'if';
  const pred = took === 'if' ? encl : call;

  sliced.push({
    ix, ...r, lineUsed: ln, crippled: CRIPPLE === ix,
    took, predText: pred ? pred.text : '', callText: call ? call.text : '', enclText: encl ? encl.text : '',
    cmpOps: pred ? CMP.filter((c) => pred.text.includes(c)) : [],
  });
}

gate('GSPANREACH', sliced.every((s) => s.predText.trim().length > 0),
  `${sliced.filter((s) => s.predText.trim().length > 0).length} of ${sliced.length} predicates non-empty`);
gate('GSPANCMP', sliced.every((s) => s.cmpOps.length > 0),
  `${sliced.filter((s) => s.cmpOps.length > 0).length} of ${sliced.length} predicates carry >=1 comparison/membership operator`);

const status = g(['status', '--porcelain', '--', 'packages/', 'scripts/']);
gate('GNODEPEND', status.length === 0, `git status --porcelain -- packages/ scripts/ is ${status.length} bytes`);

// ────────────────────────────────────────────────────────────────────────────────── the report
const lines = [];
const say = (s = '') => lines.push(s);

say(`unit-464dir / slice-spans — pinned rev ${PIN.slice(0, 12)}`);
say(`drive rev (HEAD): ${g(['rev-parse', 'HEAD']).trim().slice(0, 12)}`);
say(`cripple: ${CRIPPLE === null ? 'none' : `row ${CRIPPLE} line +1`}`);
say();
say('SUBJECT FILES');
for (const n of revNotes) say(`  ${n}`);
say();
say(`SURFACE: ${unitDirs.length} unit-464* dirs, ${excluded.length} excluded as own, ${surface.length} remain`);
say();
say('THE 12 CROSS-STATE PREDICATES, sliced from the pin');
for (const s of sliced) {
  say();
  say(`  [${s.ix}] ${s.file}:${s.lineUsed}  ${s.id}  (${s.kind})${s.crippled ? '  <<CRIPPLED +1>>' : ''}`);
  say(`      his subkind: ${s.subkind}`);
  say(`      predicate taken from: ${s.took}   ops: ${s.cmpOps.join(' ') || '(none)'}`);
  say('      ── predicate ──');
  for (const l of s.predText.split('\n')) say(`      | ${l}`);
  if (s.took === 'call' && s.enclText) {
    say('      ── enclosing if (not taken) ──');
    for (const l of s.enclText.split('\n').slice(0, 6)) say(`      . ${l}`);
  }
}
say();
say('GATES');
for (const gt of gates) say(`  ${gt.ok ? 'ok  ' : 'RED '} ${gt.id}  ${gt.note}`);
const allOk = gates.every((gt) => gt.ok);
say();
say(`VERDICT: ${allOk ? 'ok' : 'RED'} — ${gates.filter((gt) => !gt.ok).length} of ${gates.length} gates red`);

const text = lines.join('\n') + '\n';
process.stdout.write(text);
writeFileSync(join(RES, SELF, CRIPPLE === null ? 'spans.12.txt' : 'spans.12.crippled.txt'), text);
process.exit(allOk ? 0 : 1);
