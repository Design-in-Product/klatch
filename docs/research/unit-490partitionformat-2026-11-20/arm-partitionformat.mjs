#!/usr/bin/env node
/**
 * **unit-490partitionformat — the PRICE of Daedalus's §5 partition-format change, measured.**
 *
 * He routed a two-seat decision here (`daedalus-to-theseus-argus-…-2026-11-20.md` §5): the gate's
 * published partition rows are built from `Object.entries(counts).sort(...)` over verdicts actually
 * observed, so **an empty class prints no row**, and his half is yes *conditional on fixed order
 * with the count first*. His blocker against taking it: it moves every captured drive's
 * comparability across this unit series.
 *
 * This arm prices the change instead of arguing about it. Three separable parts, each driven:
 * zero-rows, count-first, fixed-order.
 *
 * ## Restraints this file is built to honour
 *
 * - **The tracked gate is NEVER edited.** Every variant is a PINNED substitution applied to a
 *   relocated `.gitignore`d copy, and the substitution refuses (`rc=3`) if its anchor is absent or
 *   appears more than once. An anchor that matches twice is not an anchor.
 * - **The copy sits at the depth `ROOT = resolve(HERE, '..')` requires** — a DIRECT child of the
 *   repo root (`.scratch/`), not one directory deeper. `unit-489markedrekey` §3(a): *a scratch copy
 *   at the wrong depth refuses every cell*, a lesson that file had quoted in its own docblock while
 *   committing the defect six lines below. So quoting it here is worth nothing and the CONTROL below
 *   GRADES it: if the copy's population reads 0, this harness exits 3 and no claim leg is graded.
 * - **No reader is hand-typed.** Every censused reader is sliced verbatim out of a tracked file as a
 *   regex literal and compiled from those bytes. The one probe that is NOT a slice is DERIVED by a
 *   mechanical operand swap on a captured literal and is LABELLED `DERIVED` in the output, with its
 *   source span named. A hand-typed reader is not a slice, and a derivation that calls itself a
 *   slice is worse than one that admits it.
 * - Membership in the affected class is **behavioural, not nominal**: a reader is in-population iff
 *   its own bytes match INSIDE one of this gate's live partition rows. A sub-split keyed on the
 *   label it mentions cannot partition a class keyed on what it reads.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = join(ROOT, '.scratch');
/* The copy MUST be a direct child of ROOT so that its own `resolve(HERE, '..')` lands on the repo
 * root and `git ls-files` sees the tracked tree. `.scratch/u490/gate.mjs` would be the 489 defect. */
const COPY = join(SCRATCH, 'u490-gate.mjs');

let refusals = 0;
const refuse = (why) => { console.log(`REFUSED — ${why}`); refusals += 1; return null; };

/* ------------------------------------------------------------------ pinned substitution helper */
function pinnedReplace(src, anchor, replacement, what) {
  const n = src.split(anchor).length - 1;
  if (n === 0) throw new Error(`rc=2 absence: anchor for ${what} not found`);
  if (n > 1) throw new Error(`rc=3 ambiguity: anchor for ${what} appears ${n} times`);
  return src.replace(anchor, replacement);
}

/* ------------------------------------------------------------------------- capture: gate source */
const gateSrc = readFileSync(GATE, 'utf8');

/* The print block, captured verbatim from the gate rather than retyped. */
const PRINT_ANCHOR = [
  'for (const [v, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {',
  '  console.log(`      ${v.padEnd(10)} ${n}`);',
  '}',
].join('\n');
if (!gateSrc.includes(PRINT_ANCHOR)) {
  console.log('REFUSED rc=2 — the gate print block is not where this arm pins it. Re-read the gate'
    + ' before trusting any figure below.');
  process.exit(2);
}

/* Fixed order is DERIVED from the gate's own verdict-branch order — the order in which each label
 * first appears in a `verdicts.set(` call — never from this seat's preference. */
const FIXED_ORDER = [];
for (const m of gateSrc.matchAll(/verdicts\.set\(rel, '([A-Z]+)'\)/g)) {
  if (!FIXED_ORDER.includes(m[1])) FIXED_ORDER.push(m[1]);
}
if (FIXED_ORDER.length !== 3) {
  console.log(`REFUSED rc=3 — derived fixed order has ${FIXED_ORDER.length} members, expected 3`);
  process.exit(3);
}

/* ------------------------------------------------------------------------------- build the copy */
mkdirSync(SCRATCH, { recursive: true });

/** Render the parameterised print block. `order`: 'sorted'|'fixed'. `first`: 'label'|'count'.
 *  `zero`: whether classes with no members print a row. */
function printBlock({ order, first, zero }) {
  const rows = order === 'fixed'
    ? JSON.stringify(FIXED_ORDER)
    : 'Object.entries(counts).sort((a, b) => b[1] - a[1]).map((e) => e[0])';
  const body = first === 'count'
    ? 'console.log(`      ${String(n).padEnd(4)} ${v}`);'
    : 'console.log(`      ${v.padEnd(10)} ${n}`);';
  return [
    `for (const v of ${rows}) {`,
    '  const n = counts[v] || 0;',
    zero ? '  // zero rows ON: an empty class prints its row' : '  if (!(v in counts)) continue;',
    `  ${body}`,
    '}',
  ].join('\n');
}

/* **The relocation needs TWO things, and this arm's CONTROL found that out the hard way** — see
 * `drive0`, kept. Putting the copy at a direct child of ROOT satisfies `resolve(HERE, '..')`, which
 * is `unit-489markedrekey` §3(a)'s whole lesson, and it still refused every cell: the gate imports a
 * SIBLING, `./lib/strip-source.mjs`, which does not exist beside the copy. **Correct depth is
 * necessary and not sufficient; a relocated instrument needs its sibling closure too**, and the two
 * constraints pull in opposite directions — mirroring the sibling by moving the copy INTO `scripts/`
 * would break nothing and write an untracked file into a tracked directory, so instead the import
 * specifier is re-pointed, by pin, at the tracked module itself. The dependency under test stays the
 * real one. */
const IMPORT_ANCHOR = "from './lib/strip-source.mjs'";
const IMPORT_FIXED = `from '${join(ROOT, 'scripts/lib/strip-source.mjs')}'`;
/* And the sibling closure has a SECOND member, found by the same CONTROL on the next drive
 * (`drive1`, kept): `const BASELINE = join(HERE, 'decl-body-slicers.baseline')`. The gate REFUSED
 * (`rc=2`, "a detector with no baseline would redden on the whole frozen population") rather than
 * reporting a pass it could not support — so the tracked gate's own refusal is what made my second
 * relocation defect loud. Re-pointed by pin at the tracked baseline, same reasoning as the import. */
const BASELINE_ANCHOR = "const BASELINE = join(HERE, 'decl-body-slicers.baseline');";
const BASELINE_FIXED = `const BASELINE = '${join(ROOT, 'scripts/decl-body-slicers.baseline')}';`;

function buildCopy(variant, { emptyMarked = false } = {}) {
  let src = gateSrc;
  src = pinnedReplace(src, IMPORT_ANCHOR, IMPORT_FIXED, 'sibling import re-point');
  src = pinnedReplace(src, BASELINE_ANCHOR, BASELINE_FIXED, 'baseline path re-point');
  src = pinnedReplace(src, PRINT_ANCHOR, printBlock(variant), `print block (${variant.tag})`);
  if (emptyMarked) {
    src = pinnedReplace(src, 'if (declared) {', 'if (false && declared) {', 'MARKED collapse');
  }
  writeFileSync(COPY, src);
}

function drive(label) {
  let out = '';
  let rc = 0;
  try {
    /* stdio is PINNED to pipe on both streams. The first spelling left stderr at `execFileSync`'s
     * default, which inherits the parent's — so the gate's own RED block (written with
     * `console.error`) leaked into this arm's captured artefact OUT OF ORDER, printed between two
     * drives it did not belong to, and was absent from the `out` the legs then read. An artefact
     * whose lines are interleaved from two writers is not a capture of either. */
    out = execFileSync('node', [COPY], {
      encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    out = `${e.stdout || ''}${e.stderr || ''}`;
    rc = typeof e.status === 'number' ? e.status : -1;
  }
  return { label, out, rc };
}

/* Partition rows are located STRUCTURALLY — between the population line and the baseline line —
 * never by matching the label format this arm is about to change. */
function partitionRows(out) {
  const lines = out.split('\n');
  const a = lines.findIndex((l) => l.startsWith('  population '));
  const b = lines.findIndex((l) => l.startsWith('  baseline entries:'));
  if (a < 0 || b < 0 || b <= a) return null;
  return { from: a + 1, to: b, lines: lines.slice(a + 1, b) };
}

/* ======================================================================= CONTROL, graded first */
console.log('unit-490partitionformat — arm: the price of the §5 partition-format change\n');
console.log(`  derived fixed order (from the gate's own verdict-branch order): ${FIXED_ORDER.join(', ')}`);

buildCopy({ order: 'sorted', first: 'label', zero: false, tag: 'control' });
const control = drive('CONTROL (copy, format unchanged)');
const BASE = control.out;
const basePop = BASE.match(/^ {2}population \(compares against both braces\): (\d+)$/m);
const baseRows = partitionRows(BASE);
console.log(`\nCONTROL — rc=${control.rc}, population=${basePop ? basePop[1] : 'null'},`
  + ` partition rows=${baseRows ? baseRows.lines.length : 'null'}`);
if (baseRows) for (const l of baseRows.lines) console.log(`    |${l}|`);

if (control.rc !== 0 || !basePop || Number(basePop[1]) === 0 || !baseRows || baseRows.lines.length !== 3) {
  console.log('\nCONTROL FAILED — the relocated copy does not reproduce the tracked gate. Exiting 3'
    + ' WITHOUT grading any claim leg: a reach printed at 0 on a run that classified nothing scores'
    + ' a vacuous PASS, which is exactly the finding this harness was told to respect.');
  process.exit(3);
}

/* The live counts, read off the CONTROL's own rows rather than assumed. */
const liveCounts = {};
for (const l of baseRows.lines) {
  const m = l.match(/^ {6}([A-Z]+) +(\d+)$/);
  if (m) liveCounts[m[1]] = Number(m[2]);
}
console.log(`  live counts read off CONTROL: ${JSON.stringify(liveCounts)}`);
if (Object.keys(liveCounts).length !== 3) {
  console.log('CONTROL FAILED — could not read all three counts off the control rendering.');
  process.exit(3);
}

/* =========================================================================== CENSUS of readers */
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').filter((f) => f && EXTS.has(extname(f)));

const LABELS = Object.keys(liveCounts);
const LABEL_RE = new RegExp(`(${LABELS.join('|')})`);
const RX_SPAN = /\/((?:[^/\\\n[]|\\.|\[(?:[^\]\\]|\\.)*\])+)\/([a-z]*)/g;

const members = [];
let ambiguous = 0;
for (const rel of tracked) {
  const raw = readFileSync(join(ROOT, rel), 'utf8');
  if (!LABEL_RE.test(raw)) continue;
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes('(\\d+)')) continue;
    if (!LABEL_RE.test(line)) continue;
    const spans = [...line.matchAll(RX_SPAN)]
      .filter((m) => m[1].includes('(\\d+)') && LABEL_RE.test(m[1]));
    if (spans.length !== 1) { ambiguous += 1; continue; }
    const [, body, flags] = spans[0];
    let compiles = true;
    try { new RegExp(body, flags.replace(/[^gimsuy]/g, '')); } catch { compiles = false; }
    const t = line.trim();
    members.push({
      rel, line: i + 1, body, flags, compiles,
      /* ANCHORED is read off the literal's own bytes: a `^` start anchor, or a fixed-width indent
       * class at the head. This is the property that actually decides loudness, so it is captured
       * rather than assumed. */
      anchored: /^\^/.test(body),
      prose: t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'),
    });
  }
}

/** Where does this reader's own match land in a rendering? Returns { value, lineText }, `null` for
 *  NO MATCH, and throws for a reader that cannot be compiled.
 *
 *  **`drive2` is kept because this function refused the P5 probe and the refusal was graded as
 *  evidence about the gate.** The first spelling opened with `if (!member.rx) return null;` — a
 *  null-guard on a field only the CENSUS path populates. The derived probe is built by hand further
 *  down and carries no `rx`, so the guard returned `null`, `null` is also this function's NO-MATCH
 *  value, and P5 scored FAIL with `got=null` — *"the current format does not fuse across the
 *  newline"* — on a probe that never ran. **A guard sharing its return value with a legitimate
 *  result converts a missing field in my own harness into a finding about the subject**, and the
 *  direction is the dangerous one: it reported the hazard ABSENT. The guard is gone; the regex is
 *  compiled from the captured bytes on every call, and a bad literal throws rather than reading as
 *  a quiet no-match. */
function readAt(member, out) {
  const rx = new RegExp(member.body, member.flags.replace(/[^imsuy]/g, ''));
  const m = rx.exec(out);
  if (!m) return null;
  const before = out.slice(0, m.index);
  const lineNo = before.split('\n').length - 1;
  const lineText = out.split('\n')[lineNo];
  const num = m.slice(1).find((g) => g !== undefined && /^\d+$/.test(g));
  return { value: num === undefined ? null : Number(num), lineText };
}

/* In-population iff the reader's own match lands inside one of the CONTROL's partition rows. */
const rowSet = new Set(baseRows.lines);
const uncompilable = members.filter((m) => !m.compiles);
for (const m of members) {
  if (!m.compiles) { m.inPop = false; m.baseHit = null; continue; }
  const hit = readAt(m, BASE);
  m.baseHit = hit;
  m.inPop = Boolean(hit && rowSet.has(hit.lineText));
}

const inPop = members.filter((m) => m.inPop);
const outPop = members.filter((m) => !m.inPop);

console.log(`\nCENSUS — ${members.length} captured reader literal(s) in ${new Set(members.map((m) => m.rel)).size}`
  + ` tracked file(s); ${ambiguous} line(s) refused for span ambiguity (counted, not dropped).`);
console.log(`  IN-POPULATION (own bytes match inside a live partition row): ${inPop.length}`);
for (const m of inPop) {
  const labels = LABELS.filter((L) => m.body.includes(L));
  /* label-first vs count-first is read off the literal's own byte offsets, not from its name. */
  const li = Math.min(...labels.map((L) => m.body.indexOf(L)).filter((x) => x >= 0));
  const ci = m.body.indexOf('(\\d+)');
  m.spelling = li < ci ? 'label-first' : 'count-first';
  m.labels = labels;
  console.log(`      ${m.rel}:${m.line}  ${m.spelling}${m.prose ? ' PROSE' : ''}`
    + `  /${m.body}/${m.flags}  → ${m.baseHit.value}`);
}
console.log(`  OUT-OF-POPULATION (reads a different instrument's format): ${outPop.length}`);
for (const m of outPop) console.log(`      ${m.rel}:${m.line}  /${m.body}/${m.flags}`);

/* ===================================================================== the four format variants */
const VARIANTS = [
  { tag: 'V1-zero-only', order: 'sorted', first: 'label', zero: true },
  { tag: 'V2-count-first', order: 'sorted', first: 'count', zero: false },
  { tag: 'V3-fixed-order', order: 'fixed', first: 'label', zero: false },
  { tag: 'V4-proposal', order: 'fixed', first: 'count', zero: true },
];
const renders = {};
for (const v of VARIANTS) {
  buildCopy(v);
  const d = drive(v.tag);
  renders[v.tag] = d;
  const rows = partitionRows(d.out);
  console.log(`\n${v.tag} — rc=${d.rc}`);
  if (rows) for (const l of rows.lines) console.log(`    |${l}|`);
  else console.log('    (partition block not locatable)');
}

/* forced-empty drives: MARKED collapsed to 0, under the current format and under the proposal */
buildCopy({ order: 'sorted', first: 'label', zero: false, tag: 'E-current' }, { emptyMarked: true });
const emptyCurrent = drive('EMPTY/current-format');
buildCopy({ order: 'fixed', first: 'count', zero: true, tag: 'E-proposal' }, { emptyMarked: true });
const emptyProposal = drive('EMPTY/V4-proposal');
for (const d of [emptyCurrent, emptyProposal]) {
  const rows = partitionRows(d.out);
  console.log(`\n${d.label} (MARKED forced empty) — rc=${d.rc}`);
  if (rows) for (const l of rows.lines) console.log(`    |${l}|`);
}

/* ================================================================================== PREDICTIONS */
const results = [];
const grade = (id, claim, ok, detail) => {
  results.push({ id, ok, claim, detail });
  console.log(`\n${ok === null ? 'REFUSED' : ok ? 'PASS' : 'FAIL'} ${id} — ${claim}\n    ${detail}`);
  if (ok === null) refusals += 1;
};

/* P1 — census size */
const files = new Set(inPop.map((m) => m.rel));
grade('P1', 'in-population reader census is >=4 and <=12 literals, members named',
  inPop.length >= 4 && inPop.length <= 12,
  `${inPop.length} literal(s) across ${files.size} file(s): ${[...files].join(', ')}`);

/* P2 — predominantly label-first */
const lf = inPop.filter((m) => m.spelling === 'label-first');
grade('P2', 'at least half of the in-population readers are label-first',
  lf.length * 2 >= inPop.length,
  `${lf.length} label-first of ${inPop.length}`);

/* P3 — count-first breaks label-first readers LOUDLY */
const v2 = renders['V2-count-first'].out;
const loud = [];
const silent = [];
for (const m of lf) {
  const h = readAt(m, v2);
  (h && h.value !== null ? silent : loud).push(`${m.rel}:${m.line}→${h ? h.value : 'null'}`);
}
grade('P3', 'every in-population label-first reader returns NULL against count-first, never a number',
  silent.length === 0,
  `loud(null)=${loud.length} [${loud.join(' ')}] · silent(number)=${silent.length} [${silent.join(' ')}]`);

/* P4 — no reader reads another row's number under count-first */
const wrong = [];
for (const m of inPop) {
  const h = readAt(m, renders['V4-proposal'].out);
  if (!h || h.value === null) continue;
  if (m.labels.length === 1 && h.value !== liveCounts[m.labels[0]]) {
    wrong.push(`${m.rel}:${m.line} claims ${m.labels[0]} but read ${h.value}`);
  }
}
grade('P4', 'under the V4 proposal no reader returns another row\'s number',
  wrong.length === 0, wrong.length ? wrong.join(' · ') : 'no silent cross-row read');

/* P5 — the CURRENT format already fuses across the newline for a count-first reader.
 * The probe is DERIVED, not sliced: take a captured label-first literal and swap its operands. */
const donor = members.find((m) => m.body === 'GUARDED\\s+(\\d+)')
  || members.find((m) => /^[A-Z]+\\s\+\(\\d\+\)$/.test(m.body));
let p5 = null;
if (!donor) {
  grade('P5', 'a count-first reader silently reads the POPULATION count off the current format',
    null, 'REFUSED rc=2 — no donor literal of the form LABEL\\s+(\\d+) found to derive from');
} else {
  const derivedBody = donor.body.replace(/^([A-Z]+)(\\s\+)(\(\\d\+\))$/, '$3$2UNGUARDED');
  const derived = { rel: `DERIVED from ${donor.rel}:${donor.line}`, line: 0, body: derivedBody, flags: '', prose: false };
  if (derivedBody === donor.body) {
    grade('P5', 'a count-first reader silently reads the POPULATION count off the current format',
      null, `REFUSED rc=3 — operand swap did not change the donor body /${donor.body}/`);
  } else {
    p5 = readAt(derived, BASE);
    console.log(`\n  P5 probe (DERIVED by operand swap on /${donor.body}/ at ${donor.rel}:${donor.line}):`
      + ` /${derivedBody}/ → ${p5 ? p5.value : 'null'} on line |${p5 ? p5.lineText : ''}|`);
    grade('P5', 'the derived count-first probe reads the POPULATION count (65), not 58 and not null, off the CURRENT format',
      Boolean(p5) && p5.value === Number(basePop[1]),
      `got ${p5 ? p5.value : 'null'}; population=${basePop[1]}, UNGUARDED=${liveCounts.UNGUARDED}`);
    /* and the same probe against the proposal */
    const p5b = readAt(derived, renders['V4-proposal'].out);
    console.log(`    same probe against V4-proposal → ${p5b ? p5b.value : 'null'}`
      + ` on line |${p5b ? p5b.lineText : ''}|`);
  }
}

/* P6 — the zero-row half is unobservable in the live state */
grade('P6', 'adding zero rows alone leaves the live rendering byte-identical',
  renders['V1-zero-only'].out === BASE,
  renders['V1-zero-only'].out === BASE
    ? 'V1 === CONTROL byte-for-byte, so the design cannot be graded by driving the live tree'
    : 'V1 differs from CONTROL — the zero-row branch IS observable live');

/* P7 — fixed order moves the live rendering, and only inside the partition block */
const v3rows = partitionRows(renders['V3-fixed-order'].out);
const outside = (() => {
  const a = BASE.split('\n');
  const b = renders['V3-fixed-order'].out.split('\n');
  if (a.length !== b.length) return 'line count moved';
  const diffs = [];
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) diffs.push(i);
  const inBlock = diffs.every((i) => i >= baseRows.from && i < baseRows.to);
  return inBlock ? null : `diff outside the block at lines ${diffs.filter((i) => i < baseRows.from || i >= baseRows.to).join(',')}`;
})();
const orderMoved = v3rows && v3rows.lines.join('\n') !== baseRows.lines.join('\n');
grade('P7', 'fixed order MOVES the live partition block, and nothing outside it',
  Boolean(orderMoved) && outside === null,
  `moved=${orderMoved} · ${outside === null ? 'no diff outside the partition block' : outside}`
  + ` · sorted=[${baseRows.lines.map((l) => l.trim().split(/\s+/)[0]).join(',')}]`
  + ` fixed=[${v3rows ? v3rows.lines.map((l) => l.trim().split(/\s+/)[0]).join(',') : '?'}]`);

/* P8 — forced-empty class: absent today, present under the proposal */
const curEmpty = partitionRows(emptyCurrent.out);
const propEmpty = partitionRows(emptyProposal.out);
const curHasMarked = curEmpty ? curEmpty.lines.some((l) => l.includes('MARKED')) : null;
const propMarkedRow = propEmpty ? propEmpty.lines.find((l) => l.includes('MARKED')) : null;
grade('P8', 'with MARKED forced empty the current format prints NO row and the proposal prints 0',
  curHasMarked === false && Boolean(propMarkedRow) && /\b0\b/.test(propMarkedRow || ''),
  `current rows=[${curEmpty ? curEmpty.lines.map((l) => l.trim()).join(' | ') : '?'}]`
  + ` · proposal MARKED row=|${propMarkedRow || 'ABSENT'}|`);

/* ===================================================== POST-HOC, and it inverts the condition */
/* Not pre-registered. P3 and P4 refuted the premise that count-first makes a label-keyed read
 * LOUD, so the question that actually decides the vote is which readers are ANCHORED — because
 * anchoring, not row order, is what forbids a cross-row read. Labelled POST-HOC and reported with
 * its own numbers rather than folded into a registered prediction. */
const executed = inPop.filter((m) => !m.prose);
const proseOnly = inPop.filter((m) => m.prose);
const unanchoredExecuted = executed.filter((m) => !m.anchored);
const wrongOnBase = [];
for (const m of inPop) {
  const h = m.baseHit;
  if (h && h.value !== null && m.labels.length === 1 && h.value !== liveCounts[m.labels[0]]) {
    wrongOnBase.push(`${m.rel}:${m.line} claims ${m.labels[0]} reads ${h.value}${m.prose ? ' (PROSE)' : ''}`);
  }
}
console.log('\nPOST-HOC — anchoring, not row order, is the property that decides loudness:');
console.log(`    in-population: ${inPop.length} · EXECUTED ${executed.length} · PROSE-ONLY ${proseOnly.length}`);
console.log(`    anchored among EXECUTED: ${executed.filter((m) => m.anchored).length}/${executed.length}`
  + ` · UNANCHORED among EXECUTED: ${unanchoredExecuted.length}`
  + ` [${unanchoredExecuted.map((m) => `${m.rel}:${m.line}`).join(' ')}]`);
console.log(`    silent cross-row reads against the CURRENT format: ${wrongOnBase.length}`
  + ` [${wrongOnBase.join(' · ')}]`);
for (const m of inPop) {
  const hv = (tag) => {
    const h = readAt(m, renders[tag].out);
    return h ? (h.value === null ? 'match/no-digit' : String(h.value)) : 'null';
  };
  const expected = m.labels.length === 1 ? liveCounts[m.labels[0]] : '—';
  console.log(`      ${m.anchored ? 'ANCH' : 'CONT'} ${m.prose ? 'PROSE' : 'EXEC '}`
    + ` ${m.rel}:${m.line} expects ${expected} · CONTROL ${m.baseHit.value}`
    + ` · V2 ${hv('V2-count-first')} · V3 ${hv('V3-fixed-order')} · V4 ${hv('V4-proposal')}`);
}
console.log(`    uncompilable captured literals (counted, not dropped): ${uncompilable.length}`);

/* ======================================================================================= tally */
const pass = results.filter((r) => r.ok === true).length;
const fail = results.filter((r) => r.ok === false).length;
console.log(`\n--- ${pass} PASS · ${fail} FAIL · ${refusals} REFUSED ---`);

/* R1/R4/R5: restraint checks, driven not asserted */
const dirty = execFileSync('git', ['-C', ROOT, 'status', '--porcelain', 'scripts', 'packages'],
  { encoding: 'utf8' }).trim();
console.log(`R1/R5 — git status --porcelain scripts packages: ${dirty === '' ? 'EMPTY (clean)' : dirty}`);
rmSync(COPY, { force: true });
process.exit(fail > 0 ? 1 : 0);
