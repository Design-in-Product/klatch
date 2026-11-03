#!/usr/bin/env node
// grade-conj — unit-464conj. Grades P3, P5 and P6 of PRE-REGISTRATION.md.
//
// P1/P2/P4 are graded by `occupy-conj-history.mjs`, which builds its subject. This file grades the
// three predictions whose subject is Klatch's own tree, and it keeps the two input models apart:
//   * every SUBJECT read goes through `git show <HIS PIN>:<path>` — his pin, because P5 and P6 are
//     checks on HIS published figures, and a figure checked under a different key is not the same
//     figure. (The P5 subject is byte-identical at both pins and HEAD; GSAMEBLOB measures that, so
//     the choice is recorded as immaterial rather than assumed to be.)
//   * this unit's OWN input (HAND-P5P6.tsv) is read at HEAD with its blob asserted byte-identical
//     to the worktree copy. An instrument's own input cannot take the subject's pin.
//     [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
//   * the span/operator reader is LIFTED out of my own grade-cell.mjs at HEAD, not copied.
//
// Every verdict carries its registered threshold beside the measured value and is computed from the
// measurement, never read off leg greenness.
// [[feedback_gate_the_figure_on_the_key_not_on_the_prediction]]

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HIS_PIN = process.env.HIS_PIN ?? 'e0fbd74c';
const MY_PIN = '0c23e551';
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';
const MYTSV = 'docs/research/unit-464conj-2026-11-03/HAND-P5P6.tsv';
const MY_READER = 'docs/research/unit-464cell-2026-11-02/grade-cell.mjs';
const SUBJ_ROOT = 'docs/research/';
const STEAL = 'unit-464cure3-2026-11-01/grade-the-steal-cures.mjs';

let red = 0;
let unrunnable = 0;
const seen = new Set();
const check = (id, cond, msg) => {
  if (seen.has(id)) { console.log(`DUPLICATE LEG ID ${id}`); red += 1; }
  seen.add(id);
  if (cond === true) console.log(`${id}  ok    ${msg}`);
  else { console.log(`${id}  RED   ${msg}`); red += 1; }
};
const refuse = (id, msg) => { console.log(`${id}  UNRUNNABLE  ${msg}`); unrunnable += 1; };
const verdicts = [];
const verdict = (p, registered, measured, pred) => {
  const v = (measured === null || measured === undefined) ? 'UNRESOLVED' : (pred(measured) ? 'LANDS' : 'REFUTED');
  verdicts.push({ p, registered, measured, v });
  console.log(`\nVERDICT ${p}: ${v}\n  registered: ${registered}\n  measured:   ${JSON.stringify(measured)}`);
};
const git = (args) => {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { return null; }
};

console.log(`grade-conj — HIS_PIN=${HIS_PIN}`);

// ===========================================================================================
// Inputs
// ===========================================================================================
const axesRaw = git(['show', `${HIS_PIN}:${AXES}`]);
if (axesRaw === null) { console.error(`UNRUNNABLE(fatal): cannot read ${AXES} at ${HIS_PIN}`); process.exit(2); }
const hIdx = axesRaw.split('\n').findIndex((l) => l.startsWith('file\tline\tid\taxisA\taxisB'));
if (hIdx < 0) { console.error('UNRUNNABLE(fatal): no axes header row'); process.exit(2); }
const rows = axesRaw.split('\n').slice(hIdx + 1)
  .filter((l) => l.trim() !== '' && !l.startsWith('#'))
  .map((l) => { const [file, line, id, axisA, axisB, ...why] = l.split('\t');
    return { file, line: Number(line), id, axisA, axisB, why: why.join('\t') }; });
check('GROWS', rows.length === 13, `his axes TSV at ${HIS_PIN} carries ${rows.length} rows (registered population: 13)`);

const myHead = git(['show', `HEAD:${MYTSV}`]);
let myWork = null;
try { myWork = readFileSync(MYTSV, 'utf8'); } catch { myWork = null; }
if (myHead === null || myWork === null) {
  refuse('GMYTSV', `my hand TSV unreadable (HEAD=${myHead === null ? 'missing' : 'ok'}, worktree=${myWork === null ? 'missing' : 'ok'}) — the graded input is not demonstrably the committed one`);
} else {
  check('GMYTSV', myHead === myWork,
    `my HAND-P5P6.tsv is byte-identical at HEAD and in the worktree (${myHead.length} bytes), so what is graded below is what was filed before this grader existed`);
}
const myP6 = (myHead ?? '').split('\n').filter((l) => l.startsWith('P6\t'))
  .map((l) => { const c = l.split('\t'); return { file: c[1], line: Number(c[2]), id: c[3], quoted: c[4], actuallyAt: c[5], inSpan: c[6], disclosed: c[7], verdictWord: c[8] }; });
const myP5 = (myHead ?? '').split('\n').filter((l) => l.startsWith('P5\t'))
  .map((l) => { const c = l.split('\t'); return { n: Number(c[1]), field: c[2], pre: c[3], post: c[4] }; });

// ===========================================================================================
// Lift my own span/operator reader at HEAD
// ===========================================================================================
const readerHead = git(['show', `HEAD:${MY_READER}`]);
let readerWork = null;
try { readerWork = readFileSync(MY_READER, 'utf8'); } catch { readerWork = null; }
let reader = null;
if (readerHead === null || readerWork === null || readerHead !== readerWork) {
  refuse('GLIFT', `${MY_READER} is not demonstrably the committed file (HEAD=${readerHead === null ? 'missing' : readerHead.length}, worktree=${readerWork === null ? 'missing' : readerWork.length}) — no span measurement below is quotable`);
} else {
  const START = 'const CMP = /===';
  const ENDMARK = 'return { cmps, andTop, orTop,';
  const s = readerHead.indexOf(START);
  const e0 = readerHead.indexOf(ENDMARK, s);
  const e = e0 < 0 ? -1 : readerHead.indexOf('\n};', e0);
  if (s < 0 || e0 < 0 || e < 0) {
    refuse('GLIFT', `a lift anchor is missing (start ${s}, endmark ${e0}, close ${e}) — a present anchor is not an intact span`);
  } else {
    const region = readerHead.slice(s, e + 3);
    let built = null;
    try {
      built = new Function('git', 'PIN', 'SUBJ_ROOT', 'stripSource',
        `${region}\nreturn { CMP, spanOf, countOps };`)(git, HIS_PIN, SUBJ_ROOT, stripSource);
    } catch (err) { refuse('GLIFT', `the region would not evaluate: ${String(err.message).split('\n')[0]}`); }
    if (built !== null) {
      const intact = /const spanOf = /.test(region) && /const countOps = /.test(region)
        && typeof built.spanOf === 'function' && typeof built.countOps === 'function';
      check('GLIFT', intact, `spanOf/countOps lifted from ${MY_READER} at HEAD (${region.split('\n').length} lines), both callable, reading subjects at ${HIS_PIN}`);
      if (intact) reader = built;
    }
  }
}

// ===========================================================================================
// P3 — the grid. 9 cells; how many have anything said about their possibility?
// ===========================================================================================
const A_VALS = ['conjunctive', 'delta', 'identity'];
const B_VALS = ['movable', 'immovable', 'history-keyed'];
check('GAXISVALS', rows.every((r) => A_VALS.includes(r.axisA) && B_VALS.includes(r.axisB)),
  `every row's axisA is one of ${A_VALS.join('/')} and axisB one of ${B_VALS.join('/')}`);

// The three constructions, each cited to the RECORDING that drove it rather than to a memo.
// A memo is not a delivery and a claim is not a drive. [[feedback_verify_on_main_not_in_memo]]
const CONSTRUCTIONS = [
  // drive3 reddened here and the red was mine: I cited `drive2.cell.out`, which is the GRADER's
  // recording, where P3's verdict does not live. The construction was driven in drive1, the scratch
  // drive, and that is the recording that carries GARMB/GINVERSE. A citation to the wrong recording
  // is exactly what this leg exists to catch, and it caught me.
  { cell: 'identity x history-keyed', by: 'Theseus 11-02',
    rec: 'docs/research/unit-464cell-2026-11-02/drive1.p3-scratch.out', needle: 'GINVERSE  ok' },
  { cell: 'delta x immovable', by: 'Daedalus 11-03',
    rec: 'docs/research/unit-464immov-2026-11-03/drive2.occupy-repaired.out', needle: 'VERDICT GREEN' },
  { cell: 'conjunctive x history-keyed', by: 'Theseus 11-03 (this unit)',
    rec: 'docs/research/unit-464conj-2026-11-03/drive2.occupy-repaired.out', needle: 'VERDICT P1: LANDS' },
];
const constructed = [];
for (const c of CONSTRUCTIONS) {
  const body = existsSync(c.rec) ? readFileSync(c.rec, 'utf8') : null;
  if (body === null) { refuse(`GREC:${c.cell}`, `the recording ${c.rec} is absent — ${c.cell} is cited to nothing and stays "nothing said"`); continue; }
  const has = body.includes(c.needle);
  check(`GREC:${c.cell}`, has,
    `${c.cell} is demonstrated by ${c.by}, cited to the recording ${c.rec} which carries ${JSON.stringify(c.needle)}`);
  if (has) constructed.push(c.cell);
}

const cellKey = (a, b) => `${a} x ${b}`;
const occupiedCells = new Map();
for (const r of rows) {
  const k = cellKey(r.axisA, r.axisB);
  if (!occupiedCells.has(k)) occupiedCells.set(k, []);
  occupiedCells.get(k).push(`${r.id}@${r.line}`);
}
console.log(`\nthe 3x3 grid, member lists printed — not counts:`);
const grid = [];
for (const a of A_VALS) for (const b of B_VALS) {
  const k = cellKey(a, b);
  const members = occupiedCells.get(k) ?? [];
  const state = members.length > 0 ? 'OCCUPIED' : (constructed.includes(k) ? 'OCCUPIABLE (constructed)' : 'NOTHING SAID');
  grid.push({ cell: k, members, state });
  console.log(`  ${k.padEnd(32)} ${String(members.length).padStart(2)}  ${state.padEnd(24)} [${members.join(', ')}]`);
}
const nOccupied = grid.filter((g) => g.state === 'OCCUPIED').length;
const nConstructed = grid.filter((g) => g.state.startsWith('OCCUPIABLE')).length;
const nNothingSaid = grid.filter((g) => g.state === 'NOTHING SAID').length;
check('GGRIDSUM', nOccupied + nConstructed + nNothingSaid === 9,
  `the three states partition the grid: ${nOccupied} occupied + ${nConstructed} constructed + ${nNothingSaid} nothing-said = ${nOccupied + nConstructed + nNothingSaid} of 9`);
check('GEMPTIES', nOccupied === 6 && nConstructed + nNothingSaid === 3,
  `his 13 rows occupy ${nOccupied} cells and leave ${nConstructed + nNothingSaid} empty (registered: 6 occupied, 3 empty)`);
const p3measured = { occupied: nOccupied, constructed: nConstructed, nothingSaid: nNothingSaid,
  demonstrated: nOccupied + nConstructed, constructedCells: constructed };

// ===========================================================================================
// P5 — the shape map's field count, off the pinned source
// ===========================================================================================
const stealSrc = git(['show', `${HIS_PIN}:${SUBJ_ROOT}${STEAL}`]);
let p5measured = null;
if (stealSrc === null) {
  refuse('GFIELDS', `cannot read ${STEAL} at ${HIS_PIN} — P5 is unmeasured`);
} else {
  // The disagreement cannot be a pin artefact unless the blob differs; measure that rather than
  // assume it. [[feedback_a_key_compared_against_a_drive_must_read_the_drives_tree]]
  const blobs = [MY_PIN, HIS_PIN, 'HEAD'].map((r) => (git(['rev-parse', `${r}:${SUBJ_ROOT}${STEAL}`]) ?? '').trim());
  check('GSAMEBLOB', blobs.every((b) => b !== '' && b === blobs[0]),
    `${STEAL} is byte-identical at my pin, his pin and HEAD (${blobs[0].slice(0, 12)}) — so the 7-vs-8 disagreement is a counting disagreement and not an artefact of which key either of us read`);

  const stripped = stripSource(stealSrc, true);
  const open = stripped.indexOf('const shape = (src) => ({');
  const close = open < 0 ? -1 : stripped.indexOf('\n});', open);
  if (open < 0 || close < 0) {
    refuse('GFIELDS', `the shape-map literal's anchors are not both present (open ${open}, close ${close}) — a present anchor is not an intact span and the field count is unmeasured`);
  } else {
    const region = stripped.slice(open, close);
    const fields = [...region.matchAll(/^ {2}([A-Za-z_$][\w$]*):/gm)].map((m) => m[1]);
    // The reader must be alive: a regex returning 0 would otherwise "agree" with nothing.
    // [[feedback_a_source_regex_fails_by_returning_a_smaller_number]]
    check('GFIELDSALIVE', fields.length > 0,
      `the shape-map field reader is alive — it lifted [${fields.join(', ')}] from the literal opened at the line carrying \`const shape = (src) => ({\``);
    const span = reader === null ? null : reader.spanOf(STEAL, 90);
    if (span === null) {
      refuse('GCONJ90', `cannot slice GCURE@90's span (reader ${reader === null ? 'absent' : 'present'}) — the PRE/POST conjunct counts are unmeasured`);
    } else {
      const preRefs = (span.text.match(/preHas\./g) ?? []).length;
      const postRefs = (span.text.match(/postHas\./g) ?? []).length;
      const myFields = myP5.length;
      const myPre = myP5.filter((f) => f.pre === 'yes').length;
      const myPost = myP5.filter((f) => f.post === 'yes').length;
      console.log(`\nP5: fields ${fields.length} · PRE-tested ${preRefs} · POST-tested ${postRefs} · sum ${preRefs + postRefs}`);
      console.log(`    my filed hand read: fields ${myFields} · PRE ${myPre} · POST ${myPost} · sum ${myPre + myPost}`);
      // Member lists, not counts: which fields does each side say are tested on PRE?
      // [[feedback_compare_member_lists_not_counts]]
      const srcPreFields = fields.filter((f) => new RegExp(`preHas\\.${f}\\b`).test(span.text));
      const myPreFields = myP5.filter((f) => f.pre === 'yes').map((f) => f.field);
      const preDepart = [...new Set([...srcPreFields, ...myPreFields])]
        .filter((f) => srcPreFields.includes(f) !== myPreFields.includes(f));
      check('GP5MEMBERS', preDepart.length === 0,
        `the FIELD LIST tested on PRE agrees between the pinned source and my filed hand read, 0 departures over ${fields.length} fields: source [${srcPreFields.join(',')}] · mine [${myPreFields.join(',')}]`);
      check('GFIELDS', fields.length === 7 && myFields === 7,
        `the shape map has ${fields.length} fields at the pin and my hand read filed ${myFields} — Daedalus's figure, not the 8 my 11-02 STOP §4 published`);
      check('GCONJ90', preRefs === 6 && postRefs === 7,
        `GCURE@90's span references ${preRefs} shape-map fields on PRE and ${postRefs} on POST, summing to ${preRefs + postRefs} conjuncts — the 13 my 11-02 memo offered against his "ten" survives, over SEVEN fields and not eight, because \`alreadyOnSubject\` is tested on POST only`);
      p5measured = { fieldsAtPin: fields.length, myFiledFields: myFields, preRefs, postRefs, sum: preRefs + postRefs, myPublished: 8, preListDepartures: preDepart.length };
    }
  }
}

// ===========================================================================================
// P6 — his corrected member list, and both of his reader errors re-driven under a repaired reader
// ===========================================================================================
// HIS PUBLISHED CORRECTED LIST, quoted from his 11-03 memo §3 verbatim and not re-derived here.
const HIS_CORRECTED = ['GLIFT2@186', 'G0@79', 'G0@80'];
const HIS_ORIGINAL = ['GPATHS@88', 'GLIFT2@186', 'G0@79'];
const MY_LIST = myP6.filter((r) => r.verdictWord === 'DEFECT').map((r) => `${r.id}@${r.line}`);
const departures = [...new Set([...HIS_CORRECTED, ...MY_LIST])]
  .filter((m) => HIS_CORRECTED.includes(m) !== MY_LIST.includes(m));
console.log(`\nP6 member lists:`);
console.log(`  his original : [${HIS_ORIGINAL.join(', ')}]`);
console.log(`  his corrected: [${HIS_CORRECTED.join(', ')}]`);
console.log(`  mine (filed) : [${MY_LIST.join(', ')}]`);
check('GP6MEMBERS', departures.length === 0,
  `my filed list and his corrected list agree member-for-member, ${departures.length} departures${departures.length ? ` [${departures.join(',')}]` : ''} — compared as lists, because two errors in opposite directions are exactly what a count cannot see`);

// His two reader errors, each re-driven at source rather than accepted on his say-so.
// A routed finding does not validate its own routed cure.
// [[feedback_a_routed_finding_does_not_validate_its_routed_cure]]
const attribSrc = git(['show', `${HIS_PIN}:${SUBJ_ROOT}unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs`]);
const measureSrc = git(['show', `${HIS_PIN}:${SUBJ_ROOT}unit-464vac-2026-10-31/measure.mjs`]);
let p6measured = null;
if (attribSrc === null || measureSrc === null) {
  refuse('GWSCURE', `a subject is unreadable at ${HIS_PIN} (attrib=${attribSrc === null ? 'missing' : 'ok'}, measure=${measureSrc === null ? 'missing' : 'ok'}) — his two reader errors stay unchecked`);
} else {
  // ERROR 1 — the whitespace one, driven in BOTH directions. A cure that cannot be shown to change
  // the answer on the known case is not graded.
  const span88 = reader === null ? null : reader.spanOf('unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs', 88);
  const quoted88 = "HIS === pathOf(preSrc,'HIS')";
  const collapse = (s) => s.replace(/\s+/g, ' ').trim();   // HIS reader: whitespace RUNS collapsed
  const ignore = (s) => s.replace(/\s+/g, '');             // the repair: whitespace IGNORED
  if (span88 === null) {
    refuse('GWSCURE', 'cannot slice :88\'s span — the whitespace cure is ungraded in both directions');
  } else {
    // drive3 reddened here too, and that red was also mine: I ran containment over `span.text`,
    // which is the BLANKED span, so `'HIS'` had become `'   '` and the fragment could not match
    // under ANY whitespace rule. His repaired reader runs containment over the RAW span for exactly
    // this reason (grade-immov.mjs:168-174), citing the same lesson of mine that I then violated
    // while grading his repair of it. Containment belongs on the raw span; operators on the blanked
    // one. [[feedback_a_diff_based_span_test_is_blind_to_self_blanking_chars]]
    const rawAll88 = attribSrc.split('\n');
    const raw88 = rawAll88.slice(88 - 1, 88 - 1 + span88.lines).join('\n');
    const underCollapse = collapse(raw88).includes(collapse(quoted88));
    const underIgnore = ignore(raw88).includes(ignore(quoted88));
    check('GWSCURE', underCollapse === false && underIgnore === true,
      `:88's why fragment ${JSON.stringify(quoted88)} is NOT found in its own span under his collapsing test (${underCollapse}) and IS found under a whitespace-ignoring one (${underIgnore}) — the repair changes the answer on the known case, which is the only way to grade it. One space, and the source spells it \`pathOf(preSrc, 'HIS')\``);
  }

  // ERROR 2 — the false disclosure credit. A disclosure is valid only if a line number IN the why
  // is the line the quoted expression actually occupies, not merely an `at :NN` somewhere in it.
  const lineOf = (src, needle) => {
    const ls = stripSource(src, true).split('\n');
    const raw = src.split('\n');
    for (let i = 0; i < raw.length; i += 1) if (ignore(raw[i]).includes(ignore(needle))) return i + 1;
    for (let i = 0; i < ls.length; i += 1) if (ignore(ls[i]).includes(ignore(needle))) return i + 1;
    return null;
  };
  const at76 = lineOf(measureSrc, 'a === null || b === null');
  const at77 = lineOf(measureSrc, 'else if (a !== b)');
  check('GAT76', at76 === 76, `\`a === null || b === null\` is at :${at76} in measure.mjs at the pin (row G0@79 quotes it and its registered line is 79, so it is OUT of span)`);
  check('GAT77', at77 === 77, `\`a !== b\` is at :${at77} in measure.mjs at the pin (row G0@80 quotes it and its registered line is 80, so it is OUT of span)`);

  const why80 = rows.find((r) => r.line === 80 && r.id === 'G0')?.why ?? '';
  const why79 = rows.find((r) => r.line === 79 && r.id === 'G0')?.why ?? '';
  const disclosedLines = (w) => [...w.matchAll(/:(\d{1,4})\b/g)].map((m) => Number(m[1]));
  const d80 = disclosedLines(why80);
  const d77valid = d80.includes(at77 ?? -1);
  check('GFALSECREDIT', d80.length > 0 && d77valid === false,
    `:80's why mentions line number(s) [${d80.join(',')}] and NONE of them is ${at77}, where the expression it quotes actually lives — so the \`at :79\` in it is about the ANCHORS and credits a disclosure that was never made. A false disclosure credit REMOVES a row from a defect list, which is why this row went missing from his original three`);
  check('GNODISCLOSE79', disclosedLines(why79).length === 0,
    `:79's why mentions no line number at all ([${disclosedLines(why79).join(',')}]) — it quotes an expression from :${at76} and discloses nothing, which is the class in its plainest form`);

  // And the row that quotes out of span and IS a disclosure, so the class does not swallow it.
  const whyC0 = rows.find((r) => r.line === 78 && r.id === 'C0')?.why ?? '';
  const dC0 = disclosedLines(whyC0);
  const cureSrc = git(['show', `${HIS_PIN}:${SUBJ_ROOT}unit-464vac-2026-10-31/grade-cure.mjs`]);
  const at64 = cureSrc === null ? null : lineOf(cureSrc, 'const changed = checkerNow !== checkerThen');
  check('GTRUECREDIT', at64 !== null && dC0.includes(at64),
    `C0@78's why discloses [${dC0.join(',')}] and the expression it quotes is at :${at64} — a MATCH, so it quotes out of span and says where. Without differentiating on disclosure the published figure is 4 where it is 3, scoring a row defective for doing the thing the class exists to catch people not doing`);

  p6measured = { hisCorrected: HIS_CORRECTED, mine: MY_LIST, departures: departures.length,
    aNullAt: at76, aNeqBAt: at77, falseCreditShown: d80.length > 0 && d77valid === false };
}

// ===========================================================================================
// Verdicts
// ===========================================================================================
verdict('P3', 'cells with nothing said about their possibility = 0, and demonstrated occupied-or-occupiable = 9 of 9',
  p3measured, (m) => m.nothingSaid === 0 && m.demonstrated === 9 && m.occupied === 6 && m.constructed === 3);
verdict('P5', 'shape-map fields = 7, PRE-tested = 6, POST-tested = 7, sum = 13, and my published 8 is wrong',
  p5measured, (m) => m.fieldsAtPin === 7 && m.myFiledFields === 7 && m.preRefs === 6 && m.postRefs === 7
    && m.sum === 13 && m.myPublished !== m.fieldsAtPin && m.preListDepartures === 0);
verdict('P6', 'departures between his corrected member list and my filed one = 0, with both of his reader errors re-driven at source',
  p6measured, (m) => m.departures === 0 && m.aNullAt === 76 && m.aNeqBAt === 77 && m.falseCreditShown === true);

const legs = seen.size;
console.log(`\n=========================================================`);
console.log(`grade-conj: ${legs} legs · RED ${red} · UNRUNNABLE ${unrunnable}`);
for (const v of verdicts) console.log(`  ${v.p}: ${v.v}`);
console.log(`VERDICT ${red === 0 && unrunnable === 0 ? 'GREEN' : red > 0 ? 'RED' : 'UNRUNNABLE'} at ${legs} legs`);
process.exit(red > 0 ? 1 : unrunnable > 0 ? 2 : 0);
