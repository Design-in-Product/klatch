#!/usr/bin/env node
// grade-cell — unit-464cell. Grades the six predictions of PRE-REGISTRATION.md.
//
// Every subject read goes through `git show <PIN>:<path>`; the worktree is never read for a
// subject. This unit's OWN input (HAND-COUNTS-CONJ.tsv) is read at HEAD, not at the subject's pin,
// with GMYTSV asserting the HEAD blob is byte-identical to the worktree copy.
// [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
//
// Every verdict prints its REGISTERED threshold beside the MEASURED value and is computed from the
// measurement, never read off leg greenness.
// [[feedback_gate_the_figure_on_the_key_not_on_the_prediction]]
// [[feedback_a_verdict_keyed_map_cannot_name_a_reached_meas_leg]]

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const PIN = process.env.PIN ?? '0c23e551';
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';
const MYTSV = 'docs/research/unit-464cell-2026-11-02/HAND-COUNTS-CONJ.tsv';
const SUBJ_ROOT = 'docs/research/';

let red = 0;
let unrunnable = 0;
const seen = new Set();

const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
};

const check = (id, cond, msg) => {
  if (seen.has(id)) {
    console.log(`DUPLICATE LEG ID ${id} — a second registration under one name`);
    red += 1;
  }
  seen.add(id);
  if (cond === true) console.log(`${id}  ok    ${msg}`);
  else {
    console.log(`${id}  RED   ${msg}`);
    red += 1;
  }
};

// A refusal is its own outcome and is NOT conjoined into any verdict.
// [[feedback_a_grading_instrument_that_cannot_refuse_manufactures_findings]]
// [[feedback_a_refusal_conjoined_away_publishes_a_false_red]]
const refuse = (id, msg) => {
  console.log(`${id}  UNRUNNABLE  ${msg}`);
  unrunnable += 1;
};

// Verdicts: each carries the registered threshold and the measured value, and the predicate is
// derived from the two. LANDS / REFUTED / UNRESOLVED are three distinct outcomes.
const verdicts = [];
const verdict = (p, registered, measured, pred) => {
  let v;
  if (measured === null || measured === undefined) v = 'UNRESOLVED';
  else v = pred(measured) ? 'LANDS' : 'REFUTED';
  verdicts.push({ p, registered, measured, v });
  console.log(`\nVERDICT ${p}: ${v}\n  registered: ${registered}\n  measured:   ${JSON.stringify(measured)}`);
};

console.log(`grade-cell — PIN=${PIN}`);

// ---------------------------------------------------------------------------
// 0. Inputs
// ---------------------------------------------------------------------------
const axesRaw = git(['show', `${PIN}:${AXES}`]);
if (axesRaw === null) {
  console.error(`UNRUNNABLE(fatal): cannot read ${AXES} at ${PIN}`);
  process.exit(2);
}
const axesLines = axesRaw.split('\n');
const hIdx = axesLines.findIndex((l) => l.startsWith('file\tline\tid\taxisA\taxisB'));
if (hIdx < 0) {
  console.error('UNRUNNABLE(fatal): no axes header row in his TSV');
  process.exit(2);
}
const rows = axesLines.slice(hIdx + 1)
  .filter((l) => l.trim() !== '' && !l.startsWith('#'))
  .map((l) => {
    const [file, line, id, axisA, axisB, ...why] = l.split('\t');
    return { file, line: Number(line), id, axisA, axisB, why: why.join('\t') };
  });
check('GROWS', rows.length === 13, `his axes TSV at the pin carries ${rows.length} rows (registered population: 13)`);

// My own counts TSV, read at HEAD and asserted against the worktree copy.
const myHead = git(['show', `HEAD:${MYTSV}`]);
let myWork = null;
try { myWork = readFileSync(MYTSV, 'utf8'); } catch { myWork = null; }
if (myHead === null || myWork === null) {
  refuse('GMYTSV', `my counts TSV unreadable (HEAD=${myHead === null ? 'missing' : 'ok'}, worktree=${myWork === null ? 'missing' : 'ok'}) — the graded input is not demonstrably the committed one`);
} else {
  check('GMYTSV', myHead === myWork,
    `my HAND-COUNTS-CONJ.tsv is byte-identical at HEAD and in the worktree (${myHead.length} bytes), so the input graded below is the committed one`);
}
const myRows = (myHead ?? '').split('\n')
  .filter((l) => l.trim() !== '' && !l.startsWith('#') && !l.startsWith('file\t'))
  .map((l) => {
    const [file, line, id, joiner, operands, cmps, litCmps, callOps, note] = l.split('\t');
    return { file, line: Number(line), id, joiner, operands: Number(operands), cmps: Number(cmps), litCmps: Number(litCmps), callOps: Number(callOps), note };
  });

// ---------------------------------------------------------------------------
// P1 — the history-keyed COLUMN total, and which empty cells it forces
// ---------------------------------------------------------------------------
const A_VALS = ['conjunctive', 'delta', 'identity'];
const B_VALS = ['movable', 'immovable', 'history-keyed'];
check('GAXISVALS',
  rows.every((r) => A_VALS.includes(r.axisA)) && rows.every((r) => B_VALS.includes(r.axisB)),
  `every row's axisA is one of ${A_VALS.join('/')} and axisB one of ${B_VALS.join('/')} — no row falls outside the declared value sets`);

const cell = (a, b) => rows.filter((r) => r.axisA === a && r.axisB === b);
const colTotal = (b) => rows.filter((r) => r.axisB === b).length;
const rowTotal = (a) => rows.filter((r) => r.axisA === a).length;
const empties = [];
for (const a of A_VALS) for (const b of B_VALS) if (cell(a, b).length === 0) empties.push(`${a} x ${b}`);
console.log(`\nCROSS-TAB (derived from his TSV, not re-typed):`);
for (const a of A_VALS) for (const b of B_VALS) console.log(`  ${a.padEnd(11)} x ${b.padEnd(13)} ${cell(a, b).length}`);
console.log(`  axis A totals: ${A_VALS.map((a) => `${a} ${rowTotal(a)}`).join(' · ')}`);
console.log(`  axis B totals: ${B_VALS.map((b) => `${b} ${colTotal(b)}`).join(' · ')}`);
console.log(`  EMPTY cells (${empties.length}): ${empties.join(' ; ')}`);

const hk = colTotal('history-keyed');
// A column with k members leaves at least 3-k of its three cells empty for arithmetic reasons
// alone, whatever the possibility set is.
const forcedEmptyMin = Math.max(0, B_VALS.length === 3 ? 3 - hk : 0);
const emptiesInHk = empties.filter((e) => e.endsWith('x history-keyed')).length;
const informative = empties.filter((e) => {
  const [a, b] = e.split(' x ');
  return rowTotal(a) > 0 && colTotal(b) > 1;
});
console.log(`  history-keyed column total k=${hk} → at least ${forcedEmptyMin} of its 3 cells are empty by ARITHMETIC, independent of possibility`);
console.log(`  empty cells lying in the history-keyed column: ${emptiesInHk}`);
console.log(`  empty cells whose row total >0 AND column total >1 (an occupied cell was available): ${informative.length === 0 ? '(none)' : informative.join(' ; ')}`);
check('GP1MEMBERS', cell('delta', 'history-keyed').length === 1 && cell('delta', 'history-keyed')[0].id === 'C2b',
  `the one history-keyed row is ${cell('delta', 'history-keyed').map((r) => `${r.file.split('/').pop()}:${r.line} ${r.id}`).join(',') || '(none)'} — named, not counted`);
verdict('P1', 'colTotal(history-keyed) == 1 AND 2 of his 3 empty cells lie in that column',
  { hkColTotal: hk, forcedEmptyMin, emptiesInHkColumn: emptiesInHk, totalEmpty: empties.length, informativeEmpty: informative },
  (m) => m.hkColTotal === 1 && m.emptiesInHkColumn === 2);

// ---------------------------------------------------------------------------
// P2 — mechanism census: recency selectors across docs/research at the pin
// ---------------------------------------------------------------------------
const tree = git(['ls-tree', '-r', '--name-only', PIN, '--', SUBJ_ROOT]);
if (tree === null) {
  refuse('GCENSUSPOP', `cannot list ${SUBJ_ROOT} at ${PIN} — the census has no population`);
  verdict('P2', 'site count of the recency-selector mechanism, with member list', null, () => false);
} else {
  const files = tree.split('\n').filter((p) => /\.(mjs|mts)$/.test(p));
  check('GCENSUSPOP', files.length > 0, `census population: ${files.length} .mjs/.mts files under ${SUBJ_ROOT} at the pin`);

  // A recency selector is a `git log` invocation that is NOT pinned to a rev and whose output is a
  // commit identity (%h/%H or -1 with a pathspec). The literal-vs-selector model is explicit:
  // `rev-parse <rev>:<path>` and `log <REV>` are FIXED; `log -1 ... -- <path>` with no rev is a
  // SELECTOR, because which commit it names depends on history, not on a named rev.
  const SELECTOR = /(?:'log'|"log"|\blog\b)[^\n]{0,160}?(?:'-1'|"-1"|\s-1\b)/;
  const FORMAT_H = /%h|%H/;
  const sites = [];
  const skippedFixed = [];
  for (const p of files) {
    const src = git(['show', `${PIN}:${p}`]);
    if (src === null) { skippedFixed.push(`${p}(unreadable)`); continue; }
    const code = stripSource(src, false); // keep string bodies: the selector IS a quoted argv
    const lines = code.split('\n');
    lines.forEach((l, i) => {
      if (!SELECTOR.test(l)) return;
      if (!FORMAT_H.test(l)) { skippedFixed.push(`${p}:${i + 1}(log -1 without %h/%H)`); return; }
      // A selector must not carry an explicit rev argument. A rev argument here is an identifier
      // ending in REV / _REV / PIN, or a 7-40 hex literal.
      const hasRev = /\b[A-Za-z_]*(?:REV|PIN|SHA)\b/.test(l) || /['"][0-9a-f]{7,40}['"]/.test(l);
      if (hasRev) { skippedFixed.push(`${p}:${i + 1}(log -1 %h pinned to a named rev)`); return; }
      sites.push(`${p}:${i + 1}`);
    });
  }
  console.log(`\nMECHANISM CENSUS — recency selectors (unpinned \`git log -1\` yielding %h/%H):`);
  console.log(`  sites (${sites.length}): ${sites.length === 0 ? '(none)' : sites.join(' ; ')}`);
  console.log(`  files: ${new Set(sites.map((s) => s.split(':')[0])).size}`);
  console.log(`  rejected as FIXED, not selector (${skippedFixed.length}): ${skippedFixed.slice(0, 12).join(' ; ')}${skippedFixed.length > 12 ? ` …+${skippedFixed.length - 12}` : ''}`);
  // The reader must be able to refuse. A known positive: C2b's own line must be IN the site list,
  // or the census has not demonstrated it can see the one instance we already know about.
  const c2bFile = `${SUBJ_ROOT}${rows.find((r) => r.id === 'C2b')?.file ?? 'x'}`;
  const sawC2bFile = sites.some((s) => s.startsWith(c2bFile));
  check('GCENSUSKP', sawC2bFile,
    `KNOWN POSITIVE: the census finds a selector site in C2b's own file (${c2bFile}) — a census that misses the one instance both of us already named cannot be quoted for the rest`);
  verdict('P2', 'site count of the recency-selector mechanism, member list printed; either exactly 1 (genuinely rare) or >=2 (the 13-row sample under-represents it)',
    { sites: sites.length, files: new Set(sites.map((s) => s.split(':')[0])).size, members: sites, knownPositiveSeen: sawC2bFile },
    (m) => m.knownPositiveSeen === true && (m.sites === 1 || m.sites >= 2));
}

// ---------------------------------------------------------------------------
// Span model for P4/P5/P6 — declared, with its blindness stated
// ---------------------------------------------------------------------------
// A row's SPAN is the registered line plus continuation lines until the parenthesis opened on the
// registered line closes, read over the STRINGS-AND-COMMENTS-BLANKED source. If the registered
// line opens no paren, the span is that line alone.
// STATED BLINDNESS: the span is a syntactic window, not an expression tree. It cannot see an
// operand derived above the registered line (which is exactly §2.1b's point and, as it turns out,
// `measure.mjs:79`'s), and it decides literal-vs-not on the token adjacent to an operator.
const CMP = /===|!==|==(?!=)|!=(?!=)|<=|>=|(?<![<>=!])<(?![<=])|(?<![<>=!])>(?![>=])/g;
const spanOf = (file, line) => {
  const path = `${SUBJ_ROOT}${file}`;
  const src = git(['show', `${PIN}:${path}`]);
  if (src === null) return null;
  const all = stripSource(src, true).split('\n'); // strings blanked FIRST — a why-string's ${…}
  // interpolation would otherwise put an identifier on the wrong side of an operator.
  const start = line - 1;
  if (start < 0 || start >= all.length) return null;
  let depth = 0;
  let opened = false;
  const out = [];
  for (let i = start; i < all.length; i += 1) {
    out.push(all[i]);
    for (const ch of all[i]) {
      if (ch === '(') { depth += 1; opened = true; }
      else if (ch === ')') depth -= 1;
    }
    if (opened && depth <= 0) break;
    if (!opened && i > start) break;
    if (i - start > 40) break;
  }
  return { text: out.join('\n'), lines: out.length, firstLine: line };
};

const countOps = (text) => {
  const cmps = (text.match(CMP) ?? []).length;
  // Top-level joiners: && / || at paren depth 0 relative to the span's own first open paren.
  let depth = 0;
  let andTop = 0;
  let orTop = 0;
  let base = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') { depth += 1; if (base === null) base = depth; continue; }
    if (ch === ')') { depth -= 1; continue; }
    if (text.startsWith('&&', i) && base !== null && depth === base) { andTop += 1; i += 1; continue; }
    if (text.startsWith('||', i) && base !== null && depth === base) { orTop += 1; i += 1; continue; }
  }
  // Comparisons with a LITERAL on one side. The string alternatives are `'[^']*'` and not `''`
  // BECAUSE strings arrive here BLANKED-BUT-LENGTH-PRESERVED: `=== '1→2'` is `=== '    '` by the
  // time this regex runs, and an empty-quote pattern reads 0 on it.
  // [[feedback_a_source_regex_fails_by_returning_a_smaller_number]]
  const LITERAL = String.raw`-?\d+(?:\.\d+)?|true|false|null|undefined|'[^']*'|"[^"]*"|\`[^\`]*\``;
  const LIT = new RegExp(String.raw`(?:===|!==|==|!=|<=|>=|<|>)\s*(?:${LITERAL})`, 'g');
  const litAfter = (text.match(LIT) ?? []).length;
  const LITB = new RegExp(String.raw`(?:${LITERAL})\s*(?:===|!==|==|!=|<=|>=|<|>)`, 'g');
  const litBefore = (text.match(LITB) ?? []).length;
  // Call-wrapped operands: an identifier applied to arguments, excluding the registered check/refuse
  // call itself and the language's own built-ins we can see here.
  const SKIP = new Set(['check', 'refuse', 'if', 'console', 'log', 'for', 'while', 'return', 'String', 'Number', 'Boolean', 'Array', 'Object', 'JSON', 'Math', 'Set']);
  const calls = [];
  for (const m of text.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) if (!SKIP.has(m[1])) calls.push(m[1]);
  return { cmps, andTop, orTop, litCmps: litAfter + litBefore, calls: [...new Set(calls)] };
};

const conj = rows.filter((r) => r.axisA === 'conjunctive');
check('GCONJCOUNT', conj.length === 5, `his TSV marks ${conj.length} rows conjunctive (his published axis A total: conjunctive 5)`);

console.log(`\nSPAN COUNTS over the ${conj.length} conjunctive rows (strings+comments blanked, span = registered line to paren close):`);
const measured = [];
for (const r of conj) {
  const s = spanOf(r.file, r.line);
  if (s === null) { refuse(`GSPAN:${r.id}@${r.line}`, `cannot slice the span for ${r.file}:${r.line} at the pin`); continue; }
  const c = countOps(s.text);
  const operands = c.andTop > 0 ? c.andTop + 1 : (c.orTop > 0 ? c.orTop + 1 : 1);
  measured.push({ ...r, ...c, operands, spanLines: s.lines });
  console.log(`  ${r.file.split('/').pop()}:${r.line} ${r.id.padEnd(9)} spanLines=${String(s.lines).padStart(2)}  topJoiner=${c.andTop > 0 ? '&&' : c.orTop > 0 ? '||' : 'none'}  &&=${c.andTop} ||=${c.orTop}  operands=${operands}  cmps=${c.cmps}  litCmps=${c.litCmps}  calls=[${c.calls.join(',')}]`);
}

// Reader control, both directions: a row where cmps MUST be >0 and a row where it MUST be 0.
const at = (line, id) => measured.find((m) => m.line === line && m.id === id);
const kpPos = rows.find((r) => r.line === 161 && r.id === 'GCTRLPRE');
let kpPosCmps = null;
if (kpPos) {
  const s = spanOf(kpPos.file, kpPos.line);
  if (s) kpPosCmps = countOps(s.text).cmps;
}
if (kpPosCmps === null) refuse('GCMPREADER', 'cannot slice the known-positive span (:161) — the operator reader is ungraded in the positive direction');
else check('GCMPREADER', kpPosCmps === 3,
  `KNOWN POSITIVE (both directions): :161 GCTRLPRE reads ${kpPosCmps} comparison operators; Daedalus's GSPANBLIND measured 3 at his own pin. A reader returning 0 everywhere could not pass this leg.`);

const m90 = at(90, 'GCURE');
const m79 = at(79, 'G0');
verdict('P4', 'comparison-operator count at grade-the-steal-cures.mjs:90 == 0 (NON-BLIND: my own last-fire figure, re-measured here), while the motivating phrase is "ten conjuncts"',
  m90 ? { cmps: m90.cmps, operandsUnderAnd: m90.operands, litCmps: m90.litCmps, spanLines: m90.spanLines } : null,
  (m) => m.cmps === 0);
verdict('P5', "measure.mjs:79's span carries >=1 top-level || and 0 top-level &&, while @90's carries >=1 && and 0 top-level ||",
  m79 && m90 ? { at79: { and: m79.andTop, or: m79.orTop, cmps: m79.cmps, spanLines: m79.spanLines }, at90: { and: m90.andTop, or: m90.orTop } } : null,
  (m) => m.at79.or >= 1 && m.at79.and === 0 && m.at90.and >= 1 && m.at90.or === 0);

// P6 — a call-wrapped operand whose definition is elsewhere in the same pinned file
const m194 = at(194, 'GCTRLPRE');
let p6 = null;
if (m194) {
  const path = `${SUBJ_ROOT}${m194.file}`;
  const src = git(['show', `${PIN}:${path}`]);
  if (src !== null) {
    const code = stripSource(src, true).split('\n');
    const found = [];
    for (const name of m194.calls) {
      const defIdx = code.findIndex((l) => new RegExp(`(?:const|let|var|function)\\s+${name}\\b`).test(l));
      if (defIdx >= 0 && defIdx + 1 !== m194.line) {
        // count comparisons inside the definition's own paren/brace extent (bounded window)
        const win = code.slice(defIdx, defIdx + 12).join('\n');
        found.push({ name, defLine: defIdx + 1, cmpsInDef: (win.match(CMP) ?? []).length });
      }
    }
    p6 = { spanCalls: m194.calls, definedElsewhere: found, spanCmps: m194.cmps };
    console.log(`\nP6 — call-wrapped operands at :194: ${JSON.stringify(p6)}`);
  }
}
verdict('P6', 'at least one conjunctive span carries a call-wrapped operand defined elsewhere in the same pinned file, so the span count is a LOWER BOUND; named candidate :194 ctrlPinned',
  p6, (m) => m.definedElsewhere.length >= 1);

// ---------------------------------------------------------------------------
// My own hand read vs the measured counts — a departure census, not a re-typing
// ---------------------------------------------------------------------------
if (myRows.length === 0) {
  refuse('GHANDJOIN', 'my counts TSV parsed to 0 rows — the hand read cannot be compared to the measurement');
} else {
  const departures = [];
  for (const m of measured) {
    const h = myRows.find((x) => x.file === m.file && x.line === m.line && x.id === m.id);
    if (!h) { departures.push(`${m.file.split('/').pop()}:${m.line} MISSING from my hand read`); continue; }
    const d = [];
    if (h.joiner !== (m.andTop > 0 ? '&&' : m.orTop > 0 ? '||' : 'none')) d.push(`joiner ${h.joiner}!=${m.andTop > 0 ? '&&' : m.orTop > 0 ? '||' : 'none'}`);
    if (h.operands !== m.operands) d.push(`operands ${h.operands}!=${m.operands}`);
    if (h.cmps !== m.cmps) d.push(`cmps ${h.cmps}!=${m.cmps}`);
    if (d.length) departures.push(`${m.file.split('/').pop()}:${m.line} ${m.id} — ${d.join(', ')}`);
  }
  console.log(`\nHAND-vs-MEASURED departures (${departures.length} of ${measured.length}): ${departures.length === 0 ? '(none)' : departures.join(' ; ')}`);
  check('GHANDJOIN', myRows.length === conj.length,
    `my hand read covers ${myRows.length} rows against ${conj.length} conjunctive rows in his TSV, joined on (file,line,id) — no label in this unit comes from my re-typing his`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const legs = seen.size;
console.log(`\n=========================================================`);
console.log(`LEGS ${legs} · RED ${red} · UNRUNNABLE ${unrunnable}`);
for (const v of verdicts) console.log(`  ${v.p}: ${v.v}`);
console.log(`VERDICT ${red === 0 && unrunnable === 0 ? 'GREEN' : red > 0 ? 'RED' : 'UNRUNNABLE'} at ${legs} legs`);
process.exit(red > 0 ? 1 : unrunnable > 0 ? 2 : 0);
