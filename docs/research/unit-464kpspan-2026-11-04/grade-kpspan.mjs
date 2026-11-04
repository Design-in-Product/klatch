#!/usr/bin/env node
// unit-464kpspan — does the IN-SPAN filter that carries the prescription label have a known positive?
//
// Theseus's 11/03 §2: my blocking KP (`KP_TEXT`) is passed to `classifySite` — the CANDIDATE arm —
// while the headline zero the label rests on is published off the IN-SPAN filter, a narrower
// predicate that never saw that KP. This grades the line, prices the cure, and reproduces his §5.
//
// TWO PINS, on purpose:
//   SUBJ_PIN — where every lifted key comes from (the subject's committed source)
//   POP_PIN  — where the sites come from (the subject's own PIN, so the population is the one the
//              published figure was measured over)
// Pinning both to one rev would silently re-key one of them.
// [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
//
// Every key is LIFTED by anchored slice from committed source and evaluated, never retyped:
// SELECTOR_WIDE, MOVABLE_WIDE, KP_TEXT, classifySite, closedTextOf, the in-span filter EXPRESSION
// itself, and the site walker. A failed lift is UNRUNNABLE, not degraded.
// [[feedback_slicing_the_inputs_but_retyping_the_verdict]]
//
// Cripple: `--cripple=nospan` applies the in-span predicate to each leg's CLOSED text instead of
// its predicate SPAN. A switch on the key, not the subject; nothing under docs/research/ is written.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = '/Users/xian/Development/klatch-worktrees/daedalus';
const SUBJ_PIN = process.env.SUBJ_PIN ?? '268457d1';
const POP_PIN = process.env.POP_PIN ?? '0ae48068';
const SUBJ_REL = 'docs/research/unit-464presc-2026-11-03/census-presc.mjs';
const SELF_DIR = 'unit-464kpspan-2026-11-04';
const PRESC_DIR = 'unit-464presc-2026-11-03';

const argv = process.argv.slice(2);
const CRIPPLE = (argv.find((a) => a.startsWith('--cripple=')) ?? '').replace('--cripple=', '');
const DEPTH = Number((argv.find((a) => a.startsWith('--depth=')) ?? '--depth=1').replace('--depth=', ''));
const MAX_TEXT = 200_000;

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gitq = (args) => { try { return git(args); } catch { return null; } };

const legs = [];
const check = (name, pass, note) => { legs.push({ name, pass, note }); return pass; };
const die = (why) => { console.error(`UNRUNNABLE: ${why}`); process.exit(2); };

console.log('unit-464kpspan — the in-span filter, its missing known positive, and the price of its cure');
console.log(`SUBJ_PIN=${SUBJ_PIN}  POP_PIN=${POP_PIN}  CRIPPLE=${CRIPPLE || '(none)'}  DEPTH=${DEPTH}`);
console.log(`instrument blob (worktree copy of this file): ${git(['hash-object', fileURLToPath(import.meta.url)]).trim()}`);
console.log('');

// ───────────────────────────────────────── stage 0: bootstrap slicer, then CHECK it against the subject's
//
// The bootstrap slicer is hand-written — it has to be, something must do the first cut. So it is
// checked: the subject's OWN `sliceFrom` is lifted with the bootstrap, evaluated, and then re-run
// over the same anchors. Every slice must come back BYTE-IDENTICAL. A hand-written reader that
// agrees with the committed one on every slice it takes is no longer the weak link.
// [[feedback_a_hand_typed_reader_is_not_a_slice]]
function bootSlice(src, startAnchor, endAnchor, label) {
  const lines = src.split('\n');
  const hits = lines.filter((l) => l === startAnchor).length;
  if (hits !== 1) die(`lift ${label}: start anchor found ${hits} times, need exactly 1`);
  const a = lines.indexOf(startAnchor);
  let b = -1;
  for (let i = a + 1; i < lines.length; i++) if (lines[i] === endAnchor) { b = i; break; }
  if (b < 0) die(`lift ${label}: terminator ${JSON.stringify(endAnchor)} not found after start`);
  return lines.slice(a, b + 1).join('\n');
}

const subjSrc = gitq(['show', `${SUBJ_PIN}:${SUBJ_REL}`]);
if (subjSrc === null) die(`cannot read the subject ${SUBJ_REL} at ${SUBJ_PIN}`);

// The upstream files the subject itself lifted from, read at the POPULATION pin exactly as it did.
const ENUM_REL = 'docs/research/unit-464class-2026-11-02/enumerate-legs.mjs';
const CLASS_REL = 'docs/research/unit-464class-2026-11-02/classify-and-grade.mjs';
const PREC_REL = 'docs/research/unit-464prec-2026-11-03/grade-prec.mjs';
const enumSrc = gitq(['show', `${POP_PIN}:${ENUM_REL}`]);
const classSrc = gitq(['show', `${POP_PIN}:${CLASS_REL}`]);
const precSrc = gitq(['show', `${POP_PIN}:${PREC_REL}`]);
if (enumSrc === null) die(`cannot read ${ENUM_REL} at ${POP_PIN}`);
if (classSrc === null) die(`cannot read ${CLASS_REL} at ${POP_PIN}`);
if (precSrc === null) die(`cannot read ${PREC_REL} at ${POP_PIN}`);

const LIFTS = [
  // from the SUBJECT — the keys the published sentence was computed with
  ['sliceFrom',     subjSrc,  'function sliceFrom(src, startAnchor, endAnchor, label) {', '}'],
  ['SELECTOR_WIDE', subjSrc,  'const SELECTOR_WIDE = [', '];'],
  ['MOVABLE_WIDE',  subjSrc,  'const MOVABLE_WIDE = [', '];'],
  ['KP_TEXT',       subjSrc,  'const KP_TEXT = [', "].join('\\n');"],
  ['classifySite',  subjSrc,  'const classifySite = (text) => {', '};'],
  ['closedTextOf',  subjSrc,  'const closedTextOf = (rel, predicate) => {', '};'],
  // from UPSTREAM at the population pin — the site walker and the published kind map
  ['blankNonCode',  enumSrc,  'function blankNonCode(src) {', '}'],
  ['IDIOMS',        enumSrc,  'const IDIOMS = [', '];'],
  ['spans',         enumSrc,  'function spans(src, blanked, idiom, rel) {', '}'],
  ['enclosingIf',   enumSrc,  'function enclosingIf(src, blanked, at) {', '}'],
  ['declarationsOf', classSrc, 'function declarationsOf(src) {', '}'],
  ['KIND_AXISB',    precSrc,  'const KIND_AXISB = {', '};'],
  ['kindOf',        precSrc,  'const kindOf = (line) => {', '};'],
];
const LINE_OF = "const lineOf = (src, idx) => { let n = 1; for (let k = 0; k < idx; k++) if (src[k] === '\\n') n++; return n; };";

const lifted = {};
const liftReport = [];
for (const [label, src, start, end] of LIFTS) {
  lifted[label] = bootSlice(src, start, end, label);
  liftReport.push({ label, lines: lifted[label].split('\n').length });
}
{
  const n = enumSrc.split('\n').filter((l) => l === LINE_OF).length;
  if (n !== 1) die(`lift lineOf: single-line anchor found ${n} times, need exactly 1`);
  lifted.lineOf = LINE_OF;
}

// GBOOT — the subject's own slicer, re-run over the same anchors, must agree byte-for-byte.
let subjSliceFrom;
try {
  subjSliceFrom = new Function('die', `${lifted.sliceFrom}\nreturn sliceFrom;`)(die);
} catch (e) {
  die(`the subject's own sliceFrom does not parse when lifted: ${e.message}`);
}
const bootDisagree = [];
for (const [label, src, start, end] of LIFTS) {
  const theirs = subjSliceFrom(src, start, end, label);
  const mine = lifted[label];
  const theirText = typeof theirs === 'string' ? theirs : theirs?.text;
  if (theirText !== mine) bootDisagree.push(label);
}
check('GBOOT', bootDisagree.length === 0,
  `my hand-written bootstrap slicer agrees BYTE-IDENTICALLY with the subject's own committed ` +
  `sliceFrom on all ${LIFTS.length} slices (disagreements: ${bootDisagree.length ? bootDisagree.join(',') : 'none'}) ` +
  `— so the first cut is not an unchecked hand-written reader`);
if (bootDisagree.length) die(`bootstrap slicer disagrees with the subject's on: ${bootDisagree.join(',')}`);

// ───────────────────────────────────────────────────────── stage 0b: evaluate the lifted fragments
let K;
try {
  K = new Function(`
    'use strict';
    const problems = [];
    ${lifted.blankNonCode}
    ${lifted.lineOf}
    ${lifted.IDIOMS}
    ${lifted.spans}
    ${lifted.enclosingIf}
    ${lifted.declarationsOf}
    ${lifted.KIND_AXISB}
    ${lifted.kindOf}
    return { blankNonCode, lineOf, IDIOMS, spans, enclosingIf, declarationsOf, KIND_AXISB, kindOf, problems };
  `)();
} catch (e) {
  die(`lifted walker fragments do not parse: ${e.message}`);
}

let S;
try {
  S = new Function('K', 'MAX_TEXT', 'DEPTH', 'declsFor', `
    'use strict';
    const SELECTOR_KINDS = Object.keys(K.KIND_AXISB).filter((k) => K.KIND_AXISB[k] === 'history-keyed');
    const MOVABLE_KINDS  = Object.keys(K.KIND_AXISB).filter((k) => K.KIND_AXISB[k] === 'movable');
    ${lifted.SELECTOR_WIDE}
    ${lifted.MOVABLE_WIDE}
    ${lifted.KP_TEXT}
    ${lifted.classifySite}
    ${lifted.closedTextOf}
    return { SELECTOR_WIDE, MOVABLE_WIDE, KP_TEXT, classifySite, closedTextOf, SELECTOR_KINDS, MOVABLE_KINDS };
  `);
} catch (e) {
  die(`lifted subject fragments do not parse: ${e.message}`);
}

check('GLIFT', liftReport.length === LIFTS.length,
  `${LIFTS.length + 1} fragments lifted (subject at ${SUBJ_PIN}, walker at ${POP_PIN}) and evaluated: ` +
  `${liftReport.map((r) => `${r.label}(${r.lines}L)`).join(' ')}`);

// ──────────────────────── stage 0c: the IN-SPAN FILTER, lifted as the EXPRESSION the subject ran
//
// Not a column-0-terminated block, so it is lifted as an exact line pair and then asserted on
// CONTENT and on PARSE — a present anchor is not an intact span.
// [[feedback_a_present_anchor_does_not_mean_an_intact_span]]
const IN_SPAN_START = 'const inSpanWitnesses = wideWitnesses.filter((s) =>';
const subjLines = subjSrc.split('\n');
const isAt = subjLines.indexOf(IN_SPAN_START);
if (isAt < 0 || subjLines.filter((l) => l === IN_SPAN_START).length !== 1) {
  die(`the in-span filter anchor was found ${subjLines.filter((l) => l === IN_SPAN_START).length} times, need exactly 1`);
}
const IN_SPAN_SRC = subjLines.slice(isAt, isAt + 2).join('\n');
const inSpanLine = isAt + 1;

check('GINSPANTEXT',
  /SELECTOR_WIDE/.test(IN_SPAN_SRC) && /MOVABLE_WIDE/.test(IN_SPAN_SRC)
  && /s\.span/.test(IN_SPAN_SRC) && !/s\.closed/.test(IN_SPAN_SRC)
  && (IN_SPAN_SRC.match(/s\.span/g) ?? []).length === 2,
  `the lifted in-span filter is the published one and reads the PREDICATE SPAN, not the closed text ` +
  `(${SUBJ_REL.replace('docs/research/', '')}:${inSpanLine}-${inSpanLine + 1}; s.span ×2, s.closed ×0)`);

// The filter applied to arbitrary text, by running the SUBJECT'S OWN EXPRESSION over a synthetic
// one-element array. The verdict is the subject's line, not my restatement of it.
let inSpanFilter;
try {
  inSpanFilter = new Function('SELECTOR_WIDE', 'MOVABLE_WIDE', 'wideWitnesses',
    `'use strict';\n${IN_SPAN_SRC}\nreturn inSpanWitnesses;`);
} catch (e) {
  die(`the lifted in-span filter expression does not parse: ${e.message}`);
}

// ───────────────────────────────────────────────────── stage 1: the population, read from POP_PIN
const tree = git(['ls-tree', '-r', '--name-only', POP_PIN, '--', 'docs/research/']).trim().split('\n').filter(Boolean);
const allMjs = tree.filter((p) => p.endsWith('.mjs'));
const dirOf = (p) => p.split('/')[2];
const familyOf = (d) => /^unit-464/.test(d) ? 'unit-464'
  : /^round\d+/.test(d) ? 'roundNNN'
  : /^unit-/.test(d) ? 'unit-other'
  : 'other';

// The subject excluded its OWN directory. At POP_PIN this directory does not exist yet, but exclude
// it explicitly too, so the population cannot drift as this unit lands.
// [[feedback_an_instrument_does_not_census_its_own_source]]
const popFiles = allMjs.filter((p) => dirOf(p) !== SELF_DIR && dirOf(p) !== PRESC_DIR);
const popWithPresc = allMjs.filter((p) => dirOf(p) !== SELF_DIR);
console.log(`population at ${POP_PIN}: ${allMjs.length} .mjs under docs/research/ ` +
  `(subject's arm excluded its own dir ⇒ ${popWithPresc.length} files)`);
console.log('');

const srcCache = new Map();
const sourceOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, gitq(['show', `${POP_PIN}:${rel}`]) ?? '');
  return srcCache.get(rel);
};
const declCache = new Map();
const declsFor = (rel) => {
  if (!declCache.has(rel)) declCache.set(rel, K.declarationsOf(sourceOf(rel)));
  return declCache.get(rel);
};

const SUB = S(K, MAX_TEXT, DEPTH, declsFor);
const { SELECTOR_WIDE, MOVABLE_WIDE, KP_TEXT, classifySite, closedTextOf } = SUB;

check('GARMS', Array.isArray(SELECTOR_WIDE) && SELECTOR_WIDE.length === 4
  && Array.isArray(MOVABLE_WIDE) && MOVABLE_WIDE.length === 5
  && typeof KP_TEXT === 'string' && KP_TEXT.includes('GKPWITNESS'),
  `the lifted keys are the published ones: SELECTOR_WIDE ${SELECTOR_WIDE?.length} arms, ` +
  `MOVABLE_WIDE ${MOVABLE_WIDE?.length} arms, KP_TEXT ${KP_TEXT?.length}B naming GKPWITNESS`);

// ──────────────────────────────────────────────────────────── stage 2: enumerate every leg site
const walk = (files) => {
  const out = [];
  for (const rel of files) {
    const src = sourceOf(rel);
    if (!src) continue;
    const blanked = K.blankNonCode(src);
    for (const idiom of K.IDIOMS) {
      for (const h of K.spans(src, blanked, idiom, rel)) {
        const predicate = idiom.kind === 'REFUSE-SITE' ? h.guard : h.span;
        const text = closedTextOf(rel, predicate);
        out.push({ rel, dir: dirOf(rel), fam: familyOf(dirOf(rel)), line: h.line, id: h.id,
          span: predicate ?? '', closed: text, ...classifySite(text) });
      }
    }
  }
  return out;
};
const sites = walk(popWithPresc);
const wideWitnesses = sites.filter((s) => s.wideWitness);

// ─────────────────────────── P6 (BLOCKING): does my reconstruction reproduce the PUBLISHED figures?
const selFilesWide = popWithPresc.filter((rel) => SELECTOR_WIDE.some((r) => r.test(sourceOf(rel))));
const pubMjs = 310, pubSites = 670, pubCand = 5, pubSel = 40;
const p6 = sites.length === pubSites && popWithPresc.length === pubMjs
  && (DEPTH !== 1 || wideWitnesses.length === pubCand) && selFilesWide.length === pubSel;
check('P6REPRO', p6,
  `reconstruction vs the subject's PUBLISHED figures: .mjs ${popWithPresc.length} (pub ${pubMjs}) · ` +
  `leg sites ${sites.length} (pub ${pubSites}) · wide candidates@depth${DEPTH} ${wideWitnesses.length} ` +
  `(pub ${pubCand} at depth 1) · wide-selector files ${selFilesWide.length} (pub ${pubSel})`);
if (!p6) die(`reconstruction does not reproduce the published population — every figure below would ` +
  `be keyed on a different population from the published sentence`);

// ────────────────── P1 (BLOCKING): the in-span filter, applied to MY OWN blocking known positive
//
// The KP's span is derived by MY OWN LIFTED SITE WALKER over KP_TEXT — not hand-split into a
// "predicate line" by me. A KP I cut by hand is not a slice.
// [[feedback_a_hand_typed_kp_is_not_a_slice]]
const kpBlanked = K.blankNonCode(KP_TEXT);
const kpSites = [];
for (const idiom of K.IDIOMS) {
  for (const h of K.spans(KP_TEXT, kpBlanked, idiom, 'KP_TEXT(virtual)')) {
    kpSites.push({ idiom: idiom.idiom, kind: idiom.kind, line: h.line, id: h.id,
      span: (idiom.kind === 'REFUSE-SITE' ? h.guard : h.span) ?? '' });
  }
}
console.log(`KP_TEXT, walked by the lifted site walker: ${kpSites.length} site(s)`);
for (const k of kpSites) console.log(`    ${k.idiom} line=${k.line} id=${k.id} span=${JSON.stringify(k.span)}`);
console.log('');
if (kpSites.length === 0) {
  die(`the lifted walker finds NO site in KP_TEXT — P1 is UNRUNNABLE, not confirmed: a KP the ` +
    `walker cannot see is not evidence that the filter refuses it`);
}

const kpSpan = kpSites[0].span;
const kpSelInSpan = SELECTOR_WIDE.some((r) => r.test(kpSpan));
const kpMovInSpan = MOVABLE_WIDE.some((r) => r.test(kpSpan));
const kpBothViaFilter = inSpanFilter(SELECTOR_WIDE, MOVABLE_WIDE, [{ span: kpSpan }]).length === 1;
// And the CANDIDATE arm, for the contrast that is the whole finding.
const kpCand = classifySite(KP_TEXT);

console.log('P1 — my own BLOCKING known positive, through the two arms:');
console.log(`    in-span filter (the line the label rests on) : sel=${kpSelInSpan}  mov=${kpMovInSpan}  both=${kpBothViaFilter}`);
console.log(`    candidate arm  (the arm the KP was built for): sel=${kpCand.wideSel}  mov=${kpCand.wideMov}  both=${kpCand.wideWitness}`);
console.log('');
check('P1KPREFUSED', kpSelInSpan === false && kpMovInSpan === false && kpBothViaFilter === false,
  `the in-span filter REFUSES my own blocking known positive (sel=${kpSelInSpan} mov=${kpMovInSpan} ` +
  `both=${kpBothViaFilter}) while the candidate arm it was built for ACCEPTS it ` +
  `(both=${kpCand.wideWitness}) — my §3 defect, reproduced one stage downstream of where I prevented it`);

// ───────────── P2: the filter's tree-wide positive rate, as MEMBER LISTS and not counts alone
const keyOf = (s) => `${s.rel.replace('docs/research/', '')}:${s.line} ${s.id ?? '(no id)'}`;
const readField = (s) => (CRIPPLE === 'nospan' ? s.closed : s.span);
const selMembers = sites.filter((s) => SELECTOR_WIDE.some((r) => r.test(readField(s)))).map(keyOf);
const movMembers = sites.filter((s) => MOVABLE_WIDE.some((r) => r.test(readField(s)))).map(keyOf);
const bothMembers = sites.filter((s) => inSpanFilter(SELECTOR_WIDE, MOVABLE_WIDE, [{ span: readField(s) }]).length === 1).map(keyOf);
const eitherMembers = [...new Set([...selMembers, ...movMembers])];

console.log(`P2 — the in-span filter over ALL ${sites.length} leg sites (field=${CRIPPLE === 'nospan' ? 'CLOSED TEXT (crippled)' : 'predicate span'}):`);
console.log(`    sel-in-span  ${String(selMembers.length).padStart(3)}  (${(100 * selMembers.length / sites.length).toFixed(1)}%)`);
console.log(`    mov-in-span  ${String(movMembers.length).padStart(3)}  (${(100 * movMembers.length / sites.length).toFixed(1)}%)`);
console.log(`    either       ${String(eitherMembers.length).padStart(3)}  (${(100 * eitherMembers.length / sites.length).toFixed(1)}%)`);
console.log(`    BOTH         ${String(bothMembers.length).padStart(3)}  (${(100 * bothMembers.length / sites.length).toFixed(1)}%)`);
console.log('    sel-in-span members:');
for (const m of selMembers) console.log(`        ${m}`);
console.log('    mov-in-span members:');
for (const m of movMembers) console.log(`        ${m}`);
if (bothMembers.length) { console.log('    BOTH members:'); for (const m of bothMembers) console.log(`        ${m}`); }
console.log('');

const unionOk = eitherMembers.length === new Set([...selMembers, ...movMembers]).size;
const interOk = bothMembers.every((m) => selMembers.includes(m) && movMembers.includes(m));
const P2EXP = { sel: 3, mov: 11, either: 14, both: 0 };
check('P2RATE',
  CRIPPLE === 'nospan' ? true
  : (selMembers.length === P2EXP.sel && movMembers.length === P2EXP.mov
     && eitherMembers.length === P2EXP.either && bothMembers.length === P2EXP.both && unionOk && interOk),
  CRIPPLE === 'nospan'
    ? `(not graded on the crippled arm — the field is the closed text, not the span)`
    : `Theseus's figures reproduce under my own lifted key: sel ${selMembers.length}/${P2EXP.sel} · ` +
      `mov ${movMembers.length}/${P2EXP.mov} · either ${eitherMembers.length}/${P2EXP.either} · ` +
      `both ${bothMembers.length}/${P2EXP.both}; member lists internally consistent (union ${unionOk}, intersection ${interOk})`);

// ─────────────── P3 (BLOCKING, THE CURE): the known positive the in-span filter never had
//
// Both anchors INLINED in one predicate. Passed as TEXT — writing it under docs/research/ would put
// it in the population and turn the measured zero into a one.
// [[feedback_an_instrument_does_not_census_its_own_source]]
const KP_INSPAN_POS =
  "check('GKPINSPAN', g(['log', '-1', '--format=%H', '--', SUBJECT]) === cell(readFileSync(join(LIVE, 'map.tsv'), 'utf8')),";
// Matched negative: SAME text, the MOVABLE anchor swapped for a pinned rev. Only the movable anchor
// changes, so a verdict flip is attributable to that one edit.
const KP_INSPAN_NEG =
  "check('GKPINSPAN', g(['log', '-1', '--format=%H', '--', SUBJECT]) === cell(readFileSync(join('/pinned/0ae48068', 'map.tsv'), 'utf8')),";

const posSel = SELECTOR_WIDE.some((r) => r.test(KP_INSPAN_POS));
const posMov = MOVABLE_WIDE.some((r) => r.test(KP_INSPAN_POS));
const posBoth = inSpanFilter(SELECTOR_WIDE, MOVABLE_WIDE, [{ span: KP_INSPAN_POS }]).length === 1;
const negSel = SELECTOR_WIDE.some((r) => r.test(KP_INSPAN_NEG));
const negMov = MOVABLE_WIDE.some((r) => r.test(KP_INSPAN_NEG));
const negBoth = inSpanFilter(SELECTOR_WIDE, MOVABLE_WIDE, [{ span: KP_INSPAN_NEG }]).length === 1;

console.log('P3 — the known positive the in-span filter never had (both anchors INLINED in one predicate):');
console.log(`    positive (inlined HEAD-ish movable) : sel=${posSel}  mov=${posMov}  both=${posBoth}`);
console.log(`    matched negative (movable → pinned) : sel=${negSel}  mov=${negMov}  both=${negBoth}`);
console.log('');
check('P3KPINSPAN', posBoth === true && negBoth === false && negSel === true,
  `the in-span filter is ALIVE, not dead: a predicate with both anchors inlined reads both=true, ` +
  `and its matched negative — one edit, the movable anchor swapped for a pinned rev — reads ` +
  `both=false while the selector arm still fires (sel=${negSel}). So the tree-wide 0 measures ` +
  `CODING STYLE (anchors sit on binding lines), not the absence of the property`);

// ───────── P4: his §5 — does my wide selector arm read an ADDITION-keyed anchor as history-keyed?
const ADD_LINE = "const added = g(['log','--diff-filter=A','--format=%h','--',H396]).trim().split('\\n').filter(Boolean).pop();";
const REC_LINE = "const newest = g(['log','-1','--format=%h','--',H396]).trim();";
const armsOf = (text) => SELECTOR_WIDE.map((r, i) => (r.test(text) ? i : -1)).filter((i) => i >= 0);
const addArms = armsOf(ADD_LINE);
const recArms = armsOf(REC_LINE);
console.log('P4 — SELECTOR_WIDE by ARM INDEX (his §5):');
console.log(`    addition-keyed line (.pop() on newest-first = OLDEST = the adding commit) : arms [${addArms}]`);
console.log(`    real recency line                                                        : arms [${recArms}]`);
console.log('');
check('P4ADDARM',
  addArms.length === 1 && addArms[0] === 3 && recArms.length === 2 && recArms[0] === 0 && recArms[1] === 3,
  `his §5 reproduces by arm index: the addition-keyed anchor matches arm [3] ONLY (got [${addArms}]) ` +
  `and the real recency anchor matches arms [0,3] (got [${recArms}]) — arm 3 (\`--format=%h … --\`) ` +
  `cannot tell "newest commit touching the path" from "commit that ADDED the path", so it reads a ` +
  `STABLE anchor as history-keyed`);

// ───── P5: MEASUREMENT, UNGRADED — the price of narrowing arm [3], measured before anyone narrows it
const arm3Only = [];
const arm3OnlyAdd = [];
for (const rel of selFilesWide) {
  const src = sourceOf(rel);
  const arms = armsOf(src);
  if (arms.length === 1 && arms[0] === 3) {
    arm3Only.push(rel.replace('docs/research/', ''));
    if (/--diff-filter=A/.test(src)) arm3OnlyAdd.push(rel.replace('docs/research/', ''));
  }
}
console.log(`P5 (MEASUREMENT, ungraded) — the price of narrowing arm [3]:`);
console.log(`    wide-selector files                      ${selFilesWide.length}`);
console.log(`    held ONLY by arm [3]                     ${arm3Only.length}`);
console.log(`    …of those, carrying --diff-filter=A      ${arm3OnlyAdd.length}`);
for (const f of arm3Only) console.log(`        ${/--diff-filter=A/.test(sourceOf('docs/research/' + f)) ? 'ADD ' : '    '} ${f}`);
console.log('');

// ──────────────────────────────────────────────────────── the cripple's own threshold, as a FIGURE
if (CRIPPLE === 'nospan') {
  check('CRIPPLEFIG', bothMembers.length === pubCand,
    `CRIPPLE=nospan moved the HEADLINE FIGURE: both-in-span ${P2EXP.both} → ${bothMembers.length} ` +
    `(threshold: 0 → ${pubCand} at depth 1). The zero IS produced by the span restriction, not by the arms`);
}

// ─────────────────────────────────────────────────────────────────────────────────── the report
console.log('legs:');
let red = 0;
for (const l of legs) {
  if (!l.pass) red++;
  console.log(`  ${l.pass ? 'GREEN' : 'RED  '} ${l.name.padEnd(13)} ${l.note}`);
}
console.log('');
console.log(`VERDICT: ${red === 0 ? 'GREEN' : 'RED'} — ${legs.length - red} of ${legs.length} legs pass` +
  (red ? `, ${red} RED` : '') + `  [SUBJ_PIN=${SUBJ_PIN} POP_PIN=${POP_PIN} CRIPPLE=${CRIPPLE || 'none'} DEPTH=${DEPTH}]`);
process.exit(red === 0 ? 0 : 1);
