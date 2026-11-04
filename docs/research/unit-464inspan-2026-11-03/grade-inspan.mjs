#!/usr/bin/env node
// unit-464inspan — does the in-span filter that carries the `history-keyed > movable` prescription
// label have a known positive, and what is its base rate over the tree?
//
// The question: `census-presc.mjs:366-367` turns a CANDIDATE into a WITNESS by demanding that the
// anchor's literal text appear inside the predicate span. Its closure expansion resolves identifiers
// (which is how the 11 candidates are found); the filter does not. His blocking KP is passed only to
// `classifySite`, the candidate arm. So the line "candidates with BOTH arms inside the predicate
// span: 0 of 11" may be an arm that has never fired.
//
// Every KEY here is lifted from his committed source at his own pin: SELECTOR_WIDE, MOVABLE_WIDE,
// KP_TEXT, closedTextOf, and (through his own LIFTS table) IDIOMS/spans/blankNonCode/
// declarationsOf/KIND_AXISB/kindOf. The only hand-written reader is the bootstrap slicer, which is
// then checked by reproducing his published per-candidate figures off his own recording.
// [[feedback_reproduce_their_figures_under_their_own_key]]

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PIN = process.env.PIN ?? '0ae48068';          // his SUBJECT pin — the population and the three upstream files
// His instrument and his recording are not in the subject population and cannot take the subject's
// pin: `census-presc.mjs` does not exist at 0ae48068. SRC_PIN is the commit that FILED the depth-5
// recording I am reproducing, so the key and the drive are read from the same tree.
// [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
// [[feedback_a_key_compared_against_a_drive_must_read_the_drives_tree]]
const SRC_PIN = process.env.SRC_PIN ?? '268457d1';
const MY_PIN = process.env.MY_PIN ?? 'bba2aa3c';    // my pin, for the figures leg only
const SELF_DIR = 'unit-464inspan-2026-11-03';
const argv = process.argv.slice(2);
const CRIPPLE = (argv.find((a) => a.startsWith('--cripple=')) ?? '').replace('--cripple=', '');
const DEPTH = CRIPPLE === 'noresolve' ? 0 : Number((argv.find((a) => a.startsWith('--depth=')) ?? '--depth=5').replace('--depth=', ''));
const MAX_TEXT = 200_000;

// stderr piped, never inherited — a child's stderr in my recording is not my measurement.
// [[feedback_execfilesync_echoes_child_stderr_into_your_recording]]
const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
const gitq = (args) => { try { return git(args); } catch { return null; } };

const legs = [];
const check = (name, pass, note) => { legs.push({ name, pass, note }); return pass; };
const refuse = (name, why) => { legs.push({ name, pass: null, note: `REFUSED: ${why}` }); return null; };
const die = (why) => { console.error(`UNRUNNABLE: ${why}`); process.exit(2); };

console.log(`unit-464inspan · ROOT=${ROOT}`);
console.log(`PIN=${PIN} (his subject pin)  SRC_PIN=${SRC_PIN} (his instrument + recording)  MY_PIN=${MY_PIN}`);
console.log(`DEPTH=${DEPTH}  CRIPPLE=${CRIPPLE || '(none)'}`);
console.log('');

// ───────────────────────────────────────────────────────── stage 0: lift his keys from his own file
const PRESC_REL = 'docs/research/unit-464presc-2026-11-03/census-presc.mjs';
const ENUM_REL = 'docs/research/unit-464class-2026-11-02/enumerate-legs.mjs';
const CLASS_REL = 'docs/research/unit-464class-2026-11-02/classify-and-grade.mjs';
const PREC_REL = 'docs/research/unit-464prec-2026-11-03/grade-prec.mjs';

const prescSrc = gitq(['show', `${SRC_PIN}:${PRESC_REL}`]);
const enumSrc = gitq(['show', `${PIN}:${ENUM_REL}`]);
const classSrc = gitq(['show', `${PIN}:${CLASS_REL}`]);
const precSrc = gitq(['show', `${PIN}:${PREC_REL}`]);
if (!prescSrc) die(`his instrument is not readable at SRC_PIN ${SRC_PIN}`);
if (!enumSrc || !classSrc || !precSrc) die(`one of the three upstream source files is not readable at ${PIN}`);

// The SRC_PIN must not be stale relative to what shipped: assert the blob I am reading is the blob
// on origin/main. [[feedback_an_answer_key_can_be_stale_relative_to_its_subject]]
const blobAtPin = (gitq(['rev-parse', `${SRC_PIN}:${PRESC_REL}`]) ?? '').trim();
const blobOnMain = (gitq(['rev-parse', `origin/main:${PRESC_REL}`]) ?? '').trim();
check('GSRCPIN', !!blobAtPin && blobAtPin === blobOnMain,
  `his instrument read at SRC_PIN ${SRC_PIN} is byte-identical to the one on origin/main `
  + `(${blobAtPin.slice(0, 12)} vs ${blobOnMain.slice(0, 12)}) — the key is not stale relative to the subject. `
  + `His subject pin ${PIN} predates his own unit, so the instrument cannot be read there at all`);

// Bootstrap slicer: exactly-one start anchor, column-0 terminator, slice asserted non-empty.
// A present anchor is not an intact span. [[feedback_a_present_anchor_does_not_mean_an_intact_span]]
function slice1(src, startAnchor, endAnchor, label) {
  const lines = src.split('\n');
  const hits = lines.filter((l) => l === startAnchor).length;
  if (hits !== 1) die(`lift ${label}: start anchor found ${hits} times, need exactly 1`);
  const a = lines.findIndex((l) => l === startAnchor);
  let b = -1;
  for (let i = a + 1; i < lines.length; i++) if (lines[i] === endAnchor) { b = i; break; }
  if (b < 0) die(`lift ${label}: terminator ${JSON.stringify(endAnchor)} not found after start`);
  const text = lines.slice(a, b + 1).join('\n');
  if (!text.trim()) die(`lift ${label}: slice is empty`);
  return { text, lines: b - a + 1 };
}

const liftReport = [];
const L = (label, src, start, end) => {
  const { text, lines } = slice1(src, start, end, label);
  liftReport.push(`${label}(${lines}L)`);
  return text;
};

// his LIFTS table and the 8 upstream fragments it names, executed rather than restated
const LIFTS_SRC = L('LIFTS', prescSrc, 'const LIFTS = [', '];');
const SELECTOR_WIDE_SRC = L('SELECTOR_WIDE', prescSrc, 'const SELECTOR_WIDE = [', '];');
const MOVABLE_WIDE_SRC = L('MOVABLE_WIDE', prescSrc, 'const MOVABLE_WIDE = [', '];');
const KP_TEXT_SRC = L('KP_TEXT', prescSrc, 'const KP_TEXT = [', "].join('\\n');");
const CLOSED_SRC = L('closedTextOf', prescSrc, 'const closedTextOf = (rel, predicate) => {', '};');

let W;
try {
  W = new Function('enumSrc', 'classSrc', 'precSrc', 'slice1', `
    'use strict';
    ${LIFTS_SRC}
    const lifted = {};
    for (const [label, src, start, end] of LIFTS) {
      if (end === null) {
        const n = src.split('\\n').filter((l) => l === start).length;
        if (n !== 1) throw new Error('upstream lift ' + label + ': single-line anchor found ' + n);
        lifted[label] = start;
      } else {
        lifted[label] = slice1(src, start, end, label).text;
      }
    }
    const problems = [];
    ${SELECTOR_WIDE_SRC}
    ${MOVABLE_WIDE_SRC}
    ${KP_TEXT_SRC}
    const body = [
      lifted.blankNonCode, lifted.lineOf, lifted.IDIOMS, lifted.spans,
      lifted.enclosingIf, lifted.declarationsOf, lifted.KIND_AXISB, lifted.kindOf,
    ].join('\\n');
    const K = new Function('problems', body + '\\nreturn { blankNonCode, lineOf, IDIOMS, spans, enclosingIf, declarationsOf, KIND_AXISB, kindOf };')(problems);
    return { K, SELECTOR_WIDE, MOVABLE_WIDE, KP_TEXT, liftedLabels: Object.keys(lifted) };
  `)(enumSrc, classSrc, precSrc, slice1);
} catch (e) {
  die(`lifted fragments do not parse/evaluate: ${e.message}`);
}
const { K, SELECTOR_WIDE, MOVABLE_WIDE, KP_TEXT } = W;

const MOVABLE_KINDS = Object.keys(K.KIND_AXISB).filter((k) => K.KIND_AXISB[k] === 'movable');
const SELECTOR_KINDS = Object.keys(K.KIND_AXISB).filter((k) => K.KIND_AXISB[k] === 'history-keyed');

check('GLIFT',
  Array.isArray(SELECTOR_WIDE) && SELECTOR_WIDE.length === 4
  && Array.isArray(MOVABLE_WIDE) && MOVABLE_WIDE.length === 5
  && typeof KP_TEXT === 'string' && KP_TEXT.includes('GKPWITNESS')
  && Array.isArray(K.IDIOMS) && K.IDIOMS.length === 3
  && K.KIND_AXISB.selector === 'history-keyed' && K.KIND_AXISB.live === 'movable'
  && SELECTOR_KINDS.length >= 1 && MOVABLE_KINDS.length >= 1,
  `his keys lifted from ${PRESC_REL.replace('docs/research/', '')} + his own LIFTS table at ${PIN}: `
  + `${liftReport.join(' ')} · upstream [${W.liftedLabels.join(' ')}] · SELECTOR_WIDE ${SELECTOR_WIDE.length} arms · `
  + `MOVABLE_WIDE ${MOVABLE_WIDE.length} arms · selector kinds [${SELECTOR_KINDS}] movable kinds [${MOVABLE_KINDS}]`);

// his closure expansion, lifted whole
const srcCache = new Map();
const sourceOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, gitq(['show', `${PIN}:${rel}`]) ?? '');
  return srcCache.get(rel);
};
const declCache = new Map();
const declsFor = (rel) => {
  if (!declCache.has(rel)) declCache.set(rel, K.declarationsOf(sourceOf(rel)));
  return declCache.get(rel);
};
const closedTextOf = new Function('declsFor', 'DEPTH', 'MAX_TEXT', `'use strict';\n${CLOSED_SRC}\nreturn closedTextOf;`)(declsFor, DEPTH, MAX_TEXT);

// HIS filter, reconstructed from HIS lifted arrays — the two halves and their conjunction
const selIn = (text) => SELECTOR_WIDE.some((r) => r.test(text));
const movIn = (text) => MOVABLE_WIDE.some((r) => r.test(text));
const bothIn = (text) => selIn(text) && movIn(text);
const classify = (text) => {
  const kinds = new Set();
  for (const line of text.split('\n')) { const k = K.kindOf(line); if (k) kinds.add(k); }
  return {
    kinds: [...kinds],
    narrowSel: SELECTOR_KINDS.some((k) => kinds.has(k)),
    narrowMov: MOVABLE_KINDS.some((k) => kinds.has(k)),
    wideSel: selIn(text), wideMov: movIn(text),
    wideWitness: selIn(text) && movIn(text),
    narrowWitness: SELECTOR_KINDS.some((k) => kinds.has(k)) && MOVABLE_KINDS.some((k) => kinds.has(k)),
  };
};

// ────────────────────────────────── stage 1: P2 BLOCKING — a positive KP for the in-span filter
// A predicate with BOTH anchor literals inlined. If the filter refuses this, it is dead for a reason
// other than coding style and every figure below is UNRUNNABLE.
// [[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]
const KP_INSPAN_POS = "check('GKPX', g(['log', '-1', '--format=%H', '--', SUBJECT]) !== g(['show', 'HEAD:' + SUBJECT]),";
const KP_INSPAN_NEG = "check('GKPX', g(['log', '-1', '--format=%H', '--', SUBJECT]) !== g(['show', PIN_REV + ':' + SUBJECT]),";
const posSel = selIn(KP_INSPAN_POS), posMov = movIn(KP_INSPAN_POS);
check('GKPINSPANPOS', posSel && posMov,
  `BLOCKING: a constructed predicate with both anchor literals INLINED is accepted by his in-span `
  + `filter: sel=${posSel} mov=${posMov} both=${bothIn(KP_INSPAN_POS)}. The filter can fire`);
if (!(posSel && posMov)) die('the in-span filter does not fire on a constructed inline KP — P1/P3/P4/P5 are UNRUNNABLE');
check('GKPINSPANNEG', selIn(KP_INSPAN_NEG) && !movIn(KP_INSPAN_NEG),
  `the matched negative — same predicate, the movable anchor replaced by a pinned rev — is NOT in-span `
  + `for movable (sel=${selIn(KP_INSPAN_NEG)} mov=${movIn(KP_INSPAN_NEG)}), so the arm is not firing on everything`);

// ────────────────────────────────── stage 2: P1 — his OWN blocking KP, through the in-span filter
const kpLines = KP_TEXT.split('\n');
const kpPredicate = kpLines[0];            // the `check(` line: what `spans()` would hand the filter
const kpSelIn = selIn(kpPredicate), kpMovIn = movIn(kpPredicate);
const kpSelClosed = selIn(KP_TEXT), kpMovClosed = movIn(KP_TEXT);
check('GKPINSPAN', !(kpSelIn && kpMovIn),
  `his own blocking KP, the one his §3 exists to make the zero mean something, reads `
  + `both-in-span=${kpSelIn && kpMovIn} (sel ${kpSelIn} · mov ${kpMovIn}) when its predicate line is `
  + `put through the in-span filter — while the SAME text through the candidate arm reads `
  + `sel ${kpSelClosed} · mov ${kpMovClosed}. The filter that publishes "0 of 11" has no known positive`);
console.log(`P1 — his KP_TEXT through both arms:`);
console.log(`    predicate line : ${JSON.stringify(kpPredicate)}`);
console.log(`    in-span filter : sel=${kpSelIn} mov=${kpMovIn} both=${kpSelIn && kpMovIn}`);
console.log(`    candidate arm  : sel=${kpSelClosed} mov=${kpMovClosed} both=${kpSelClosed && kpMovClosed}`);
console.log('');

// ────────────────────────────────── stage 3: P6 — does the wide selector arm match --diff-filter=A?
const ADDING_LINE = "  const added = g(['log', '--diff-filter=A', '--format=%h', '--', H396]).trim().split('\\n').filter(Boolean).pop();";
const RECENCY_LINE = "  const newest = g(['log', '-1', '--format=%h', '--', H396]).trim();";
const addMatch = SELECTOR_WIDE.map((r, i) => [i, r.test(ADDING_LINE)]).filter(([, h]) => h).map(([i]) => i);
const recMatch = SELECTOR_WIDE.map((r, i) => [i, r.test(RECENCY_LINE)]).filter(([, h]) => h).map(([i]) => i);
check('GDIFFFILTER', addMatch.length > 0,
  `his wide selector arm matches an ADDING-commit read as if it were a recency selector: `
  + `\`--diff-filter=A ... .pop()\` on a newest-first list is the OLDEST entry and is stable, yet `
  + `SELECTOR_WIDE arms [${addMatch}] match it (the real recency line matches arms [${recMatch}]). `
  + `So GSTALEPIN is a FALSE POSITIVE of the selector arm, not an artifact of the expansion's reach`);

// ────────────────────────────────── stage 4: the population and every leg site, at his pin
const tree = git(['ls-tree', '-r', '--name-only', PIN, '--', 'docs/research/']).trim().split('\n').filter(Boolean);
const dirOf = (p) => p.split('/')[2];
const allMjs = tree.filter((p) => p.endsWith('.mjs'));
const popFiles = allMjs.filter((p) => dirOf(p) !== SELF_DIR && dirOf(p) !== 'unit-464presc-2026-11-03');

// argument split: a `check(ID, <bool>, <why>)` span has two arms and they are not the same arm.
// Quote/template/bracket aware, so a comma inside a why-string does not split it.
function splitArgs(span) {
  const open = span.indexOf('(');
  if (open < 0) return null;
  const args = [];
  let depth = 0, cur = '', q = null, i = open;
  for (; i < span.length; i++) {
    const c = span[i];
    if (q) {
      cur += c;
      if (c === '\\') { if (i + 1 < span.length) { cur += span[i + 1]; i++; } continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; if (depth === 1) continue; cur += c; continue; }
    if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) { args.push(cur); cur = ''; break; } cur += c; continue; }
    if (c === ',' && depth === 1) { args.push(cur); cur = ''; continue; }
    cur += c;
  }
  return args.map((a) => a.trim());
}

const sites = [];
for (const rel of popFiles) {
  const src = sourceOf(rel);
  if (!src) continue;
  const blanked = K.blankNonCode(src);
  for (const idiom of K.IDIOMS) {
    for (const h of K.spans(src, blanked, idiom, rel)) {
      const predicate = idiom.kind === 'REFUSE-SITE' ? h.guard : h.span;
      const span = predicate ?? '';
      const closed = closedTextOf(rel, predicate);
      sites.push({ rel, dir: dirOf(rel), line: h.line, id: h.id, span, closed, ...classify(closed) });
    }
  }
}
const candidates = sites.filter((s) => s.wideWitness);
console.log(`sites enumerated: ${sites.length} over ${popFiles.length} .mjs / ${new Set(popFiles.map(dirOf)).size} dirs (his unit and mine excluded)`);
console.log(`wide candidates at DEPTH=${DEPTH}: ${candidates.length}`);
console.log('');

// ────────────────────────────────── stage 5: P3 — the in-span base rate over every site
const selSites = sites.filter((s) => selIn(s.span));
const movSites = sites.filter((s) => movIn(s.span));
const bothSites = sites.filter((s) => bothIn(s.span));
const eitherSites = sites.filter((s) => selIn(s.span) || movIn(s.span));
const pct = (n) => sites.length ? `${(100 * n / sites.length).toFixed(1)}%` : 'n/a';
console.log('P3 — the in-span filter\'s base rate over EVERY leg site, not just the candidates:');
console.log(`    sites                                ${String(sites.length).padStart(5)}`);
console.log(`    selector literal inside the span     ${String(selSites.length).padStart(5)}   ${pct(selSites.length)}`);
console.log(`    movable  literal inside the span     ${String(movSites.length).padStart(5)}   ${pct(movSites.length)}`);
console.log(`    either                               ${String(eitherSites.length).padStart(5)}   ${pct(eitherSites.length)}`);
console.log(`    BOTH  (= his published invariant)    ${String(bothSites.length).padStart(5)}   ${pct(bothSites.length)}`);
for (const s of bothSites.slice(0, 20)) console.log(`        BOTH-IN-SPAN  ${s.rel.replace('docs/research/', '')}:${s.line} ${s.id}`);
check('GINSPANBASE', bothSites.length === 0,
  `tree-wide, over ${sites.length} leg sites and not only the ${candidates.length} candidates, the `
  + `in-span conjunction holds ${bothSites.length} times (${pct(bothSites.length)}): selector-in-span `
  + `${selSites.length}, movable-in-span ${movSites.length}, either ${eitherSites.length}. `
  + `A filter whose positive rate over the whole tree is ${pct(bothSites.length)} is measuring the `
  + `tree's hoisted-operand coding style, not the ordering`);
console.log('');

// ────────────────────────────────── stage 6: P4/P5 — per candidate, where does each anchor come from
console.log('P4/P5 — per candidate: the predicate span, its boolean arm, its why arm, and the closure');
console.log('        resolve-only = the anchor is absent from the span and present after resolution');
const rows = [];
for (const s of candidates) {
  const args = splitArgs(s.span) ?? [];
  const boolArm = args[1] ?? '';
  const whyArm = args.slice(2).join(',');
  const r = {
    key: `${s.rel.replace('docs/research/', '')}:${s.line}`,
    id: s.id ?? '(no literal id)',
    selSpan: selIn(s.span), movSpan: movIn(s.span),
    selBool: selIn(boolArm), movBool: movIn(boolArm),
    selWhy: selIn(whyArm), movWhy: movIn(whyArm),
    selClosed: selIn(s.closed), movClosed: movIn(s.closed),
    argc: args.length,
  };
  r.resolveOnly = (!r.selSpan && r.selClosed) || (!r.movSpan && r.movClosed);
  r.whyOnlySel = !r.selBool && r.selWhy;
  r.whyOnlyMov = !r.movBool && r.movWhy;
  // P9/P10 — the ARM is resolved, not just read. A predicate carries its operands by NAME, so a
  // literal-keyed arm test is blind to exactly the hoisted-binding case this unit is about.
  const boolClosed = closedTextOf(s.rel, boolArm);
  const whyClosed = closedTextOf(s.rel, whyArm);
  r.selBoolR = selIn(boolClosed); r.movBoolR = movIn(boolClosed);
  r.selWhyR = selIn(whyClosed); r.movWhyR = movIn(whyClosed);
  r.boolPair = r.selBoolR && r.movBoolR;                       // P9: a real bool-arm anchor pair
  r.whyOnlySelR = !r.selBoolR && r.selWhyR;                     // P10
  r.whyOnlyMovR = !r.movBoolR && r.movWhyR;
  rows.push(r);
  console.log(`    ${r.key} ${r.id}`);
  console.log(`        span  sel=${r.selSpan} mov=${r.movSpan}   bool-arm sel=${r.selBool} mov=${r.movBool}   `
    + `why-arm sel=${r.selWhy} mov=${r.movWhy}   closed sel=${r.selClosed} mov=${r.movClosed}   args=${r.argc}`);
  console.log(`        resolve-only=${r.resolveOnly}  why-only-sel=${r.whyOnlySel}  why-only-mov=${r.whyOnlyMov}`);
  console.log(`        RESOLVED  bool-arm sel=${r.selBoolR} mov=${r.movBoolR}  why-arm sel=${r.selWhyR} mov=${r.movWhyR}  `
    + `BOOL-ARM PAIR=${r.boolPair}  why-only-resolved sel=${r.whyOnlySelR} mov=${r.whyOnlyMovR}`);
}
const resolveOnly = rows.filter((r) => r.resolveOnly).length;
check('GRESOLVEONLY', rows.length > 0 && resolveOnly === rows.length,
  `every one of the ${rows.length} candidates reaches at least one of its two anchors ONLY after `
  + `identifier resolution — ${resolveOnly} of ${rows.length}. The candidate arm resolves bindings; `
  + `the in-span filter does not, so no candidate in a hoisted-operand tree can pass it`);
const whyOnly = rows.filter((r) => r.whyOnlySel || r.whyOnlyMov);
check('GWHYARM', whyOnly.length >= 1,
  `${whyOnly.length} of ${rows.length} candidates carry an anchor that is in the why-string arm and `
  + `NOT in the boolean operand: [${whyOnly.map((r) => `${r.id}${r.whyOnlySel ? ' sel' : ''}${r.whyOnlyMov ? ' mov' : ''}`).join(' · ')}]. `
  + `A why-string is not a conjunct. His \`prose-arg-call\` flag caught one shape of this; the arm split measures it per candidate`);

// P9/P10 — the arms, resolved
const boolPairs = rows.filter((r) => r.boolPair);
const whyOnlyR = rows.filter((r) => r.whyOnlySelR || r.whyOnlyMovR);
check('GBOOLPAIR', boolPairs.length >= 2,
  `with the BOOLEAN OPERAND resolved on its own — which is how a predicate actually carries its `
  + `anchors — ${boolPairs.length} of ${rows.length} candidates hold a selector anchor beside a movable `
  + `anchor: [${boolPairs.map((r) => r.id).join(' · ')}]. His stated necessary property is satisfied `
  + `${boolPairs.length} times in this tree, not 0. The "0" is his in-span filter's figure, and that `
  + `filter has no known positive (GKPINSPAN)`);
// ─── the bracket. HIS 0 is a floor keyed on literals; MY 8 is a ceiling keyed on unbounded
// resolution — resolving a run-record variable reaches the whole harness, which is how GFIXEDCTRL
// (operands: b1fix.verdict / b1fix.atFixed) reads as a pair. Neither endpoint is the answer. The
// hand read is, and it is a committed artifact, not an inline literal.
const handRows = readFileSync(join(HERE, 'HAND-READ-11.tsv'), 'utf8').split('\n')
  .filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('id\t'))
  .map((l) => { const c = l.split('\t'); return { id: c[0], site: c[1], readBy: c[3], sel: c[4], mov: c[5], pair: c[6] }; });
const handPairs = handRows.filter((r) => r.pair === 'yes');
const handBoth = handRows.filter((r) => r.sel === 'yes' && r.mov === 'yes');
const idsAgree = handRows.length === rows.length
  && handRows.every((h) => rows.some((r) => r.id === h.id));
check('GHANDCOVER', idsAgree,
  `the filed hand read covers exactly the candidate set this drive enumerated: ${handRows.length} rows `
  + `against ${rows.length} candidates, every id matched member by member`
  + `${idsAgree ? '' : ` · unmatched [${handRows.filter((h) => !rows.some((r) => r.id === h.id)).map((h) => h.id).join(' ')}]`}`);
// the bracket is well-formed iff his floor <= the hand read <= my ceiling, AND no conjunct pair
check('GBRACKET', handPairs.length === 0 && bothSites.length <= handBoth.length && handBoth.length <= boolPairs.length,
  `THE BRACKET: his published 0 is a FLOOR (in-span, keyed on anchor literals, no known positive) and `
  + `my ${boolPairs.length} is a CEILING (unbounded resolution reaches a run record's whole harness). `
  + `Neither endpoint decides the label. By hand over all ${handRows.length} candidates — `
  + `${handRows.filter((r) => r.readBy === 'THESEUS').length} read by me this fire, `
  + `${handRows.filter((r) => r.readBy === 'DAEDALUS').length} his reading recorded as his — `
  + `legs whose boolean operand carries BOTH anchors: ${handBoth.length} `
  + `[${handBoth.map((r) => r.id).join(' · ')}]; legs that are a CONJUNCT PAIR with disagreeing `
  + `figures: ${handPairs.length}. So the prescription label HOLDS, and it holds on the hand read, `
  + `not on either instrument's figure`);
check('GWHYARMR', true,
  `why-only at the IDENTIFIER level: ${whyOnlyR.length} of ${rows.length} candidates reach an anchor `
  + `from the resolved why arm and not from the resolved boolean arm `
  + `[${whyOnlyR.map((r) => `${r.id}${r.whyOnlySelR ? ' sel' : ''}${r.whyOnlyMovR ? ' mov' : ''}`).join(' · ') || 'none'}]`);
console.log('');

// ────────────────────────────────── stage 7: GREPRO — do I reproduce HIS published per-candidate rows?
const recRel = 'docs/research/unit-464presc-2026-11-03/drive4.depth5.out';
let repro = null;
const recText = gitq(['show', `${SRC_PIN}:${recRel}`]);
if (!recText) {
  refuse('GREPRO', `his depth-5 recording is not readable at ${SRC_PIN}`);
} else {
  const his = [];
  const lines = recText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s{4}(\S+\.mjs):(\d+) (\S+) narrow=/);
    if (!m) continue;
    const selM = (lines[i + 1] ?? '').match(/sel\s+in-span=(true|false)/);
    const movM = (lines[i + 2] ?? '').match(/mov\s+in-span=(true|false)/);
    if (selM && movM) his.push({ key: `${m[1]}:${m[2]}`, id: m[3], sel: selM[1] === 'true', mov: movM[1] === 'true' });
  }
  // member by member, not a joined string — a joined comparison cannot see an empty member.
  // [[feedback_compare_member_lists_not_counts]]
  const mine = new Map(rows.map((r) => [r.key, r]));
  const agree = his.filter((h) => {
    const r = mine.get(h.key);
    return r && r.id === h.id && r.selSpan === h.sel && r.movSpan === h.mov;
  });
  const missing = his.filter((h) => !mine.has(h.key)).map((h) => h.key);
  repro = { his: his.length, agree: agree.length, missing };
  check('GREPRO', his.length > 0 && agree.length === his.length && mine.size === his.length,
    `my reconstruction of his in-span filter reproduces his published per-candidate figures off his `
    + `own recording: ${agree.length} of ${his.length} rows agree on (id, sel-in-span, mov-in-span), `
    + `and my candidate set is ${mine.size} against his ${his.length}`
    + `${missing.length ? ` · rows of his I do not have: [${missing.join(' ')}]` : ''}`);
}
console.log('');

// ────────────────────────────────── stage 8: P8 — his correction of my roundNNN row, at MY pin
const myTree = gitq(['ls-tree', '-r', '--name-only', MY_PIN, '--', 'docs/research/']);
if (!myTree) {
  refuse('GMYPIN', `my pin ${MY_PIN} is not readable from this worktree`);
} else {
  const t = myTree.trim().split('\n').filter(Boolean);
  const mjs = t.filter((p) => p.endsWith('.mjs'));
  const famOf = (d) => /^unit-464/.test(d) ? 'unit-464' : /^round\d+/.test(d) ? 'roundNNN' : /^unit-/.test(d) ? 'unit-other' : 'other';
  const allDirs = [...new Set(t.map(dirOf).filter(Boolean))];
  const mjsDirs = [...new Set(mjs.map(dirOf))];
  const tabled = { 'unit-464': [37, 106], roundNNN: [91, 191], 'unit-other': [2, 6], other: [6, 5] };
  console.log(`P8 — my own table re-measured at MY pin ${MY_PIN}, under BOTH dir keys:`);
  console.log(`    family       all-dirs  dirs-with-.mjs   .mjs    I tabled`);
  const out = {};
  for (const fam of ['unit-464', 'roundNNN', 'unit-other', 'other']) {
    const ad = allDirs.filter((d) => famOf(d) === fam).length;
    const md = mjsDirs.filter((d) => famOf(d) === fam).length;
    const nf = mjs.filter((p) => famOf(dirOf(p)) === fam).length;
    out[fam] = { ad, md, nf };
    console.log(`    ${fam.padEnd(12)} ${String(ad).padStart(8)} ${String(md).padStart(15)} ${String(nf).padStart(6)}    ${tabled[fam][0]} / ${tabled[fam][1]}`);
  }
  console.log(`    ${'TOTAL'.padEnd(12)} ${String(allDirs.length).padStart(8)} ${String(mjsDirs.length).padStart(15)} ${String(mjs.length).padStart(6)}    136 / 308`);
  check('GMYPIN', out.roundNNN.md === 90 && out.roundNNN.nf === 195 && mjs.length === 309,
    `his correction reproduces at my own pin: roundNNN is ${out.roundNNN.md} dirs-with-an-instrument / `
    + `${out.roundNNN.nf} .mjs (I tabled 91 / 191) and the tree is ${mjs.length} .mjs (I tabled 308). `
    + `His 90/195/309 is exact. My dir column mixed keys — ${out.roundNNN.ad} roundNNN dirs exist, `
    + `${out.roundNNN.md} hold an instrument, and ${mjsDirs.length} of ${allDirs.length} dirs tree-wide do`);
}
console.log('');

// ───────────────────────────────────────────────────────────────────────────────────── the verdict
console.log('LEGS');
let red = 0, refused = 0;
for (const l of legs) {
  const tag = l.pass === null ? 'REFUSE' : l.pass ? 'GREEN ' : 'RED   ';
  if (l.pass === false) red++;
  if (l.pass === null) refused++;
  console.log(`  ${tag} ${l.name.padEnd(16)} ${l.note}`);
}
console.log('');
console.log(`VERDICT: ${red === 0 && refused === 0 ? 'GREEN' : red > 0 ? 'RED' : 'GREEN-WITH-REFUSALS'} — ${legs.length} legs · ${red} red · ${refused} refused`);
console.log('');
console.log('PREDICTIONS');
const nz = (b) => b ? 'LANDS' : 'DEPARTS';
const g = (n) => legs.find((l) => l.name === n);
console.log(`  P1 his KP refused by the filter   ${nz(g('GKPINSPAN')?.pass === true)} (NON-BLIND) — both-in-span=${kpSelIn && kpMovIn}`);
console.log(`  P2 positive in-span KP accepted   ${nz(g('GKPINSPANPOS')?.pass === true)} — BLOCKING`);
console.log(`  P3 tree-wide both-in-span = 0     ${nz(bothSites.length === 0)} — ${bothSites.length} of ${sites.length} (${pct(bothSites.length)}); either ${eitherSites.length}`);
console.log(`  P4 all candidates resolve-only    ${nz(resolveOnly === rows.length && rows.length > 0)} — ${resolveOnly} of ${rows.length}`);
console.log(`  P5 >=1 why-only anchor            ${nz(whyOnly.length >= 1)} — ${whyOnly.length} of ${rows.length}`);
console.log(`  P6 --diff-filter=A reads selector ${nz(addMatch.length > 0)} (NON-BLIND) — arms [${addMatch}]`);
console.log(`  P7 CRIPPLE candidates fall <=1    ${CRIPPLE === 'noresolve' ? `REACHED at DEPTH=0: ${candidates.length} candidates (registered <=1)` : 'not this arm'}`);
console.log(`  P8 his roundNNN correction        ${g('GMYPIN') ? nz(g('GMYPIN').pass === true) : 'REFUSED'}`);
console.log(`  P9 bool-arm anchor pairs >= 2     ${nz(boolPairs.length >= 2)} — ${boolPairs.length} of ${rows.length} [${boolPairs.map((r) => r.id).join(' ')}]`);
console.log(`  P10 why-only, identifier level    ${nz(whyOnlyR.length >= 1)} — ${whyOnlyR.length} of ${rows.length} [${whyOnlyR.map((r) => r.id).join(' ') || 'none'}]`);
console.log('');
console.log(`BRACKET: in-span ${bothSites.length} (his floor, no KP)  <=  hand read ${handBoth.length} (both anchors in the boolean operand)  <=  resolved ${boolPairs.length} (my ceiling)`);
console.log(`         CONJUNCT PAIRS with disagreeing figures, by hand over all ${handRows.length}: ${handPairs.length} — the prescription label HOLDS`);
console.log('');
console.log(`REPRO: ${repro ? `${repro.agree}/${repro.his} of his published rows reproduced` : 'refused'}`);
process.exit(red > 0 ? 1 : 0);
