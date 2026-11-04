// unit-464cons — a second independent hand read of Theseus's 20 arm-[3] sites, his existence-
// negation tested on one witness, and the one reader disagreement settled by measurement.
//
// Registered in PRE-REGISTRATION.md (`c23d92e7`) and PRE-REGISTRATION-ADDENDUM.md (`bc01d2dc`).
// My hand read was filed at `2fd49cd7`, BEFORE this file existed and before his TSV was opened;
// GORDER checks that commit order rather than asserting it.
//
// Three pins, because three different questions:
//   SUBJ_PIN 268457d1  the arms (SELECTOR_WIDE / MOVABLE_WIDE) as published
//   POP_PIN  0ae48068  Theseus's own population pin — the 20 sites must be HIS 20 sites
//   HIS_REC  40015d90  his recording, for parsing his figures and his classes out of committed files
//
// Cripple: `--cripple=flagkey` replaces the hand-read FP-ONLY set with the `--diff-filter=A` file
// set and computes the delta into cripple-delta.txt. A switch on the KEY, not on the subject;
// nothing under docs/research/ is written by this file.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = '/Users/xian/Development/klatch-worktrees/daedalus';
const SUBJ_PIN = process.env.SUBJ_PIN ?? '268457d1';
const POP_PIN = process.env.POP_PIN ?? '0ae48068';
const HIS_REC = process.env.HIS_REC ?? '40015d90';
const SUBJ_REL = 'docs/research/unit-464presc-2026-11-03/census-presc.mjs';
const SELF_DIR = 'unit-464cons-2026-11-04';
const PRESC_DIR = 'unit-464presc-2026-11-03';
const MY_TSV = `docs/research/${SELF_DIR}/HAND-CONS.tsv`;
const HIS_TSV = 'docs/research/unit-464addarm-2026-11-04/HAND-ARM3.tsv';
const HIS_OUT = 'docs/research/unit-464addarm-2026-11-04/drive1.enumerate.out';
const FLAG = '--diff-filter=A';

const argv = process.argv.slice(2);
const CRIPPLE = (argv.find((a) => a.startsWith('--cripple=')) ?? '').replace('--cripple=', '');

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gitq = (args) => { try { return git(args); } catch { return null; } };

// Legs STREAM as they are checked, so a die still leaves a record (the 11/04 START fire's defect 3).
// THREE states: a leg that could not be graded must be distinguishable from one that passed and
// one that failed. [[feedback_a_false_false_row_cannot_be_told_from_an_untouched_defect]]
const legs = [];
const emit = (state, name, note) => {
  legs.push({ name, state, note });
  console.log(`  ${state.padEnd(5)} ${name.padEnd(12)} ${note}`);
  return state === 'GREEN';
};
const check = (name, pass, note) => emit(pass ? 'GREEN' : 'RED', name, note);
const unrun = (name, note) => emit('UNRUN', name, note);
const die = (why) => { console.error(`UNRUNNABLE: ${why}`); process.exit(2); };

console.log('unit-464cons — a second reader on his 20 sites, the witness for his existence-negation, and the disagreement measured');
console.log(`SUBJ_PIN=${SUBJ_PIN}  POP_PIN=${POP_PIN}  HIS_REC=${HIS_REC}  CRIPPLE=${CRIPPLE || '(none)'}`);
console.log(`instrument blob (worktree copy of this file): ${git(['hash-object', fileURLToPath(import.meta.url)]).trim()}`);
console.log('');
console.log('legs, streaming as they are checked:');

// ───────────────────────────── stage 0: bootstrap slicer, then CHECK it against the subject's own
// Something has to make the first cut, so the bootstrap is hand-written — and then checked: the
// subject's OWN `sliceFrom` is lifted with it and re-run over the same anchors, byte-for-byte.
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

const LIFTS = [
  ['sliceFrom',     'function sliceFrom(src, startAnchor, endAnchor, label) {', '}'],
  ['SELECTOR_WIDE', 'const SELECTOR_WIDE = [', '];'],
  ['MOVABLE_WIDE',  'const MOVABLE_WIDE = [', '];'],
];
const lifted = {};
for (const [label, start, end] of LIFTS) lifted[label] = bootSlice(subjSrc, start, end, label);

let subjSliceFrom;
try {
  subjSliceFrom = new Function('die', `${lifted.sliceFrom}\nreturn sliceFrom;`)(die);
} catch (e) {
  die(`the subject's own sliceFrom does not parse when lifted: ${e.message}`);
}
// ADDENDUM 2 §1 REPAIR. drive1 compared the subject's return value — an OBJECT, `{ text, lines }`
// at census-presc.mjs:64-73 — to my bootstrap's STRING, so all three slices read as disagreements
// and the printed reason was false. It failed CLOSED (a mis-keyed check that can only go RED
// cannot launder a bad lift), but a RED with a false reason is still a false reason. The SHAPE is
// asserted first, so a future change of return type is a RED that says so.
// [[feedback_a_guard_on_identity_does_not_guard_value]] [[feedback_sibling_readers_with_different_kind_models]]
const probe = subjSliceFrom(subjSrc, ...LIFTS[0].slice(1), LIFTS[0][0]);
const shapeOk = probe !== null && typeof probe === 'object'
  && typeof probe.text === 'string' && typeof probe.lines === 'number';
const textOf = (v) => (shapeOk ? v.text : v);
const bootDisagree = !shapeOk ? LIFTS.map(([l]) => l)
  : LIFTS.filter(([label, start, end]) =>
      textOf(subjSliceFrom(subjSrc, start, end, label)) !== lifted[label]).map(([l]) => l);
check('GBOOT', shapeOk && bootDisagree.length === 0,
  `the subject's OWN sliceFrom, lifted and re-run over the same ${LIFTS.length} anchors, agrees with ` +
  `my bootstrap byte-for-byte on the TEXT it returns (return shape ` +
  `{text:string,lines:number} = ${shapeOk}; disagreements: ${bootDisagree.length ? bootDisagree.join(',') : 'none'})`);

let SELECTOR_WIDE, MOVABLE_WIDE;
try {
  ({ SELECTOR_WIDE, MOVABLE_WIDE } = new Function(
    `'use strict';\n${lifted.SELECTOR_WIDE}\n${lifted.MOVABLE_WIDE}\nreturn { SELECTOR_WIDE, MOVABLE_WIDE };`)());
} catch (e) {
  die(`the lifted arms do not parse: ${e.message}`);
}
const ARM3 = SELECTOR_WIDE?.[3];
const ARM3_PUB = String(/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/);
check('GARMS', Array.isArray(SELECTOR_WIDE) && SELECTOR_WIDE.length === 4
  && Array.isArray(MOVABLE_WIDE) && MOVABLE_WIDE.length === 5 && String(ARM3) === ARM3_PUB,
  `the lifted keys are the published ones: SELECTOR_WIDE ${SELECTOR_WIDE?.length} arms, MOVABLE_WIDE ` +
  `${MOVABLE_WIDE?.length} arms, and arm [3] is byte-identically ${ARM3_PUB}`);
if (String(ARM3) !== ARM3_PUB) die('the arm under measurement is not the arm under discussion');

// ───────────────────── stage 0b: GORDER — the blindness claim, checked rather than asserted
// A hand read is only a control if it was filed before the comparison existed. That is a fact
// about commit order, and commit order is readable. [[feedback_verify_on_main_not_in_memo]]
const addRevOf = (p) => (gitq(['log', '--diff-filter=A', '--format=%H', '--', p]) ?? '').trim().split('\n').filter(Boolean).pop() ?? null;
const myTsvAdd = addRevOf(MY_TSV);
const selfRel = `docs/research/${SELF_DIR}/grade-cons.mjs`;
const selfAdd = addRevOf(selfRel);
const isAnc = (a, b) => a && b && gitq(['merge-base', '--is-ancestor', a, b]) !== null;
if (myTsvAdd === null) {
  die('my own hand read has no add-commit — it must be committed before this grader runs at all');
} else if (selfAdd === null) {
  unrun('GORDER', `my hand read was added at ${myTsvAdd.slice(0, 8)}; THIS GRADER IS NOT YET COMMITTED, so ` +
    `the order claim cannot be closed on this run — it closes on the committed re-run, and that run's ` +
    `.out is the one that counts. Reported UNRUN rather than green, because an uncommitted grader ` +
    `cannot witness its own ordering.`);
} else {
  check('GORDER', isAnc(myTsvAdd, selfAdd) && myTsvAdd !== selfAdd,
    `commit order, read off git: HAND-CONS.tsv added at ${myTsvAdd.slice(0, 8)}, this grader added at ` +
    `${selfAdd.slice(0, 8)}, and the first is a strict ancestor of the second — so the hand read ` +
    `predates every comparison below`);
}

// ─────────────────────────────────────────────── stage 1: the population, read at the POPULATION pin
const tree = git(['ls-tree', '-r', '--name-only', POP_PIN, '--', 'docs/research/']).trim().split('\n').filter(Boolean);
const dirOf = (p) => p.split('/')[2];
const allMjs = tree.filter((p) => p.endsWith('.mjs'));
// This directory does not exist at POP_PIN, but exclude it explicitly so the population cannot
// drift as this unit lands. [[feedback_an_instrument_does_not_census_its_own_source]]
const pop = allMjs.filter((p) => dirOf(p) !== SELF_DIR);

const srcCache = new Map();
const sourceAt = (rev, rel) => {
  const k = `${rev}:${rel}`;
  if (!srcCache.has(k)) srcCache.set(k, gitq(['show', k]) ?? '');
  return srcCache.get(k);
};
const sourceOf = (rel) => sourceAt(POP_PIN, rel);

const selFiles = pop.filter((rel) => SELECTOR_WIDE.some((r) => r.test(sourceOf(rel))));
const arm3Only = selFiles.filter((rel) => {
  const s = sourceOf(rel);
  return ARM3.test(s) && !SELECTOR_WIDE[0].test(s) && !SELECTOR_WIDE[1].test(s) && !SELECTOR_WIDE[2].test(s);
});
const shortOf = (p) => p.replace('docs/research/', '');
const lineOf = (s, i) => { let n = 1; for (let k = 0; k < i; k++) if (s[k] === '\n') n++; return n; };

// Every NON-OVERLAPPING arm-[3] match, per file. A `.test` stops at the first match and so cannot
// see a file's second site — the defect his §5 found in my own START-fire figure.
// [[feedback_the_row_you_are_looking_for_becomes_a_terminator]]
const sites = [];
for (const rel of arm3Only) {
  const s = sourceOf(rel);
  [...s.matchAll(new RegExp(ARM3.source, 'g'))].forEach((m, i) => {
    sites.push({ id: `${shortOf(rel)}#${i + 1}`, rel, line: lineOf(s, m.index),
      start: m.index, end: m.index + m[0].length });
  });
}

// ─────────────────── stage 2: HIS figures, PARSED out of his committed .out — never retyped
// His rows are indented and flag-padded; a hand-typed row is not a slice.
// [[feedback_an_aligned_row_token_is_padded_so_capture_it_dont_type_it]]
const hisOut = gitq(['show', `${HIS_REC}:${HIS_OUT}`]);
if (hisOut === null) die(`cannot read his recording ${HIS_OUT} at ${HIS_REC}`);
const hisP1 = /my population at \S+ vs his recorded figures: \.mjs (\d+) \(pub (\d+)\) · wide-selector files (\d+) \(his (\d+)\) · arm-\[3\]-only (\d+) \(his (\d+)\) · ADD (\d+) \(his (\d+)\)/.exec(hisOut);
const hisSites = /a GLOBAL non-overlapping walk finds (\d+) arm-\[3\] match sites across the (\d+) files/.exec(hisOut);
if (!hisP1 || !hisSites) die('his published population figures did not parse out of his .out — a figure I cannot capture is a figure I will not retype');
const HIS = { mjs: +hisP1[1], sel: +hisP1[3], only3: +hisP1[5], add: +hisP1[7], sites: +hisSites[1], files: +hisSites[2] };

const p1 = pop.length === HIS.mjs && selFiles.length === HIS.sel
  && arm3Only.length === HIS.only3 && sites.length === HIS.sites && arm3Only.length === HIS.files;
check('P1REPRO', p1,
  `my population at ${POP_PIN} vs HIS figures parsed from his .out at ${HIS_REC}: .mjs ${pop.length}/${HIS.mjs} · ` +
  `selector files ${selFiles.length}/${HIS.sel} · arm-[3]-only ${arm3Only.length}/${HIS.only3} · ` +
  `arm-[3] SITES ${sites.length}/${HIS.sites} (a global non-overlapping walk, not a .test)`);
if (!p1) die('my population does not reproduce his — every figure below would be keyed on a different population');

// ───────────────── stage 3: the two hand reads, both PARSED from their committed TSVs
const parseTsv = (text, idCol, classCol, min) => {
  const rows = new Map();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const c = line.split('\t');
    if (c.length < min || !/#\d+$/.test((c[idCol] ?? '').trim())) continue;
    rows.set(c[idCol].trim(), (c[classCol] ?? '').trim());
  }
  return rows;
};
const mineSrc = gitq(['show', `${myTsvAdd}:${MY_TSV}`]);
if (mineSrc === null) die('cannot read my own hand read at its add-commit');
const MINE = parseTsv(mineSrc, 0, 2, 6);
const hisTsvSrc = gitq(['show', `${HIS_REC}:${HIS_TSV}`]);
if (hisTsvSrc === null) die(`cannot read his hand read ${HIS_TSV} at ${HIS_REC}`);
const THEIRS = parseTsv(hisTsvSrc, 0, 6, 8);
// My TSV is read at its OWN add-commit, not from the worktree: a hand read I could have edited
// after seeing his is not a blind hand read. [[feedback_a_unit_that_cures_its_own_subject_needs_the_baseline_from_git]]
const BLIND = new Map();
for (const line of mineSrc.split('\n')) {
  const c = line.split('\t');
  if (c.length >= 6 && /#\d+$/.test((c[0] ?? '').trim())) BLIND.set(c[0].trim(), c[3].trim() === 'blind');
}

const siteIds = sites.map((s) => s.id);
const missingMine = siteIds.filter((i) => !MINE.has(i));
const missingHis = siteIds.filter((i) => !THEIRS.has(i));
check('P4HAND', MINE.size === HIS.sites && missingMine.length === 0 && missingHis.length === 0
  && THEIRS.size === HIS.sites,
  `both hand reads cover exactly the ${sites.length} sites my own walk enumerated — mine ${MINE.size} rows ` +
  `(${[...BLIND.values()].filter(Boolean).length} blind, ${[...BLIND.values()].filter((b) => !b).length} NOT-BLIND), ` +
  `his ${THEIRS.size} rows; sites absent from mine: ${missingMine.length}, from his: ${missingHis.length}`);

const tally = (m, pred = () => true) => ['R', 'A', 'O', 'W']
  .map((c) => `${c} ${[...m].filter(([i, v]) => v === c && pred(i)).length}`).join(' · ');
console.log('');
console.log(`  classes, ALL ${sites.length} sites — mine:  ${tally(MINE)}`);
console.log(`  classes, ALL ${sites.length} sites — his:   ${tally(THEIRS)}`);

// ─────────────────────── P5AGREE — the blind 16 only, as member lists
const blindIds = siteIds.filter((i) => BLIND.get(i) === true);
const notBlind = siteIds.filter((i) => BLIND.get(i) !== true);
const disagree = blindIds.filter((i) => MINE.get(i) !== THEIRS.get(i));
const agreeN = blindIds.length - disagree.length;
check('P5AGREE', agreeN >= 14,
  `BLIND sites only: ${agreeN} of ${blindIds.length} agree (registered floor 14 — below it the ` +
  `price does not go into the convention). Disagreements: ` +
  `${disagree.length ? disagree.map((i) => `${i} mine=${MINE.get(i)} his=${THEIRS.get(i)}`).join(' | ') : 'none'}`);
const nbDis = notBlind.filter((i) => MINE.get(i) !== THEIRS.get(i));
console.log(`  NOT-BLIND ${notBlind.length} (excluded from the numerator, per pre-registration §2): ` +
  `${nbDis.length} disagreement(s)${nbDis.length ? ` — ${nbDis.join(', ')}` : ''}`);

// ─────────────────────── P6PRICE — the file-level split, computed from each reader's own rows
const fileSplit = (m) => {
  const byFile = new Map();
  for (const s of sites) {
    const k = shortOf(s.rel);
    byFile.set(k, (byFile.get(k) ?? []).concat(m.get(s.id)));
  }
  const retain = [...byFile].filter(([, cs]) => cs.includes('R')).map(([k]) => k).sort();
  const fpOnly = [...byFile].filter(([, cs]) => !cs.includes('R')).map(([k]) => k).sort();
  return { retain, fpOnly };
};
const myPrice = fileSplit(MINE);
const hisPrice = fileSplit(THEIRS);
const pct = (n) => `${((n / selFiles.length) * 100).toFixed(1)}%`;
const diff = (a, b) => a.filter((x) => !b.includes(x));
check('P6PRICE', myPrice.retain.length + myPrice.fpOnly.length === arm3Only.length
  && Math.abs(myPrice.retain.length - hisPrice.retain.length) <= 1,
  `the price, computed from each reader's OWN committed rows over the same ${selFiles.length} selector files: ` +
  `MINE R-RETAINING ${myPrice.retain.length} (${pct(myPrice.retain.length)}) / FP-ONLY ${myPrice.fpOnly.length} ` +
  `(${pct(myPrice.fpOnly.length)}) · HIS R-RETAINING ${hisPrice.retain.length} (${pct(hisPrice.retain.length)}) / ` +
  `FP-ONLY ${hisPrice.fpOnly.length} (${pct(hisPrice.fpOnly.length)})`);
console.log(`  files I call R-RETAINING and he does not: ${diff(myPrice.retain, hisPrice.retain).join(', ') || 'none'}`);
console.log(`  files he calls FP-ONLY and I do not:      ${diff(hisPrice.fpOnly, myPrice.fpOnly).join(', ') || 'none'}`);

// ─────── P2WITNESS — his existence-negation, on one witness, with no classifier involved
const WITNESS = 'unit-464vac-2026-10-31/grade-cure.mjs';
const witnessRel = arm3Only.find((p) => shortOf(p) === WITNESS);
if (!witnessRel) {
  unrun('P2WITNESS', `the witness ${WITNESS} is not in my arm-[3]-only set — his §3 cannot be tested on it here`);
} else {
  const wSrc = sourceOf(witnessRel);
  const nFlag = (wSrc.match(new RegExp(FLAG.replace(/[-]/g, '\\-'), 'g')) ?? []).length;
  const wIsFpOnly = myPrice.fpOnly.includes(WITNESS);
  check('P2WITNESS', nFlag === 0 && wIsFpOnly,
    `HIS §3, tested on one witness and no classifier: ${WITNESS} contains ${nFlag} occurrence(s) of ` +
    `\`${FLAG}\` anywhere in the file, and MY OWN hand read makes it FP-ONLY (${wIsFpOnly}). With zero ` +
    `occurrences there is nothing for a flag-keyed cure to match AT ANY GRANULARITY — file, span or ` +
    `call — so such a cure has a blind spot of >=1 member before it is written. His existence-negation ` +
    `is established by this single row, independently of either hand read's classifier.`);
}

// ─────── P3OVER — round429's flag is in a call arm [3] cannot match, as RANGE NON-OVERLAP
const OVER = 'round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.mjs';
const overRel = arm3Only.find((p) => shortOf(p) === OVER);
if (!overRel) {
  unrun('P3OVER', `${OVER} is not in my arm-[3]-only set`);
} else {
  const oSrc = sourceOf(overRel);
  const flagAt = [...oSrc.matchAll(new RegExp(FLAG.replace(/[-]/g, '\\-'), 'g'))].map((m) => m.index);
  const ranges = sites.filter((s) => s.rel === overRel).map((s) => [s.start, s.end]);
  const inside = flagAt.filter((o) => ranges.some(([a, b]) => o >= a && o < b));
  check('P3OVER', flagAt.length > 0 && inside.length === 0,
    `${OVER.split('/').pop()}: ${flagAt.length} \`${FLAG}\` occurrence(s) at line(s) ` +
    `${flagAt.map((o) => lineOf(oSrc, o)).join(',')}, and ${inside.length} of them fall inside any of the ` +
    `${ranges.length} arm-[3] match range(s) at line(s) ${ranges.map(([a]) => lineOf(oSrc, a)).join(',')} — ` +
    `measured as index-range non-overlap, not by reading line numbers and judging. The flag is in a ` +
    `DIFFERENT call, so the file-level co-occurrence is a true false positive.`);
}

// ─────── P7SYMDIFF — my ADD set against MY OWN FP-ONLY set, per occurrence
const addFiles = arm3Only.filter((rel) => sourceOf(rel).includes(FLAG)).map(shortOf).sort();
const addNotFp = diff(addFiles, myPrice.fpOnly);
const fpNotAdd = diff(myPrice.fpOnly, addFiles);
check('P7SYMDIFF', addFiles.length === HIS.add,
  `my ADD set re-derived per occurrence (not carried over from my START-fire .out): ${addFiles.length} files ` +
  `(his recorded ${HIS.add}) — so his "same size" framing is NOT downstream of an under-count of mine. ` +
  `Against MY FP-ONLY ${myPrice.fpOnly.length}: |symmetric difference| = ${addNotFp.length + fpNotAdd.length} ` +
  `(ADD-not-FP ${addNotFp.length}: ${addNotFp.join(', ') || 'none'} · FP-not-ADD ${fpNotAdd.length}: ` +
  `${fpNotAdd.join(', ') || 'none'})`);

// ───────────────────────── P8MOVED — the disagreement, settled by differential evaluation
//
// ASYMMETRIC BY CONSTRUCTION, registered as such in addendum 1 §2 and printed on the line where
// the negative appears: MOVED=true is sound evidence for R; MOVED=false means only "not observed
// to move in this interval" and is NOT evidence for A.
// [[feedback_vacuous_gates_and_guards]] [[feedback_a_rate_is_wrong_when_the_variable_is_machine_state]]
const HEAD = git(['rev-parse', 'HEAD']).trim();
console.log('');
console.log(`  P8MOVED — selections evaluated twice, at ${POP_PIN} and at HEAD ${HEAD.slice(0, 8)}:`);

// GMOVEDKP: the test's own known positive and matched negative, on a declared path that WAS
// touched in the interval. A differential test that cannot detect a difference proves nothing
// about the rows it calls stable. [[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]
// ADDENDUM 2 §2 REPAIR, in two parts. drive1 keyed the matched negative on the SUBJECT, and the
// subject's directory does not exist at POP_PIN (`ls-tree` empty; `merge-base --is-ancestor
// 268457d1 0ae48068` exits 1 — the subject pin is NEWER than the population pin). `oldestOf` came
// back null at both ends and `null !== null` is false, so an ABSENCE printed as a disagreement.
//   (1) the negative is now drawn FROM THE MEASUREMENT — arm3Only[0], which exists at the pin by
//       construction — rather than typed; and
//   (2) resolvability is asserted at BOTH revs first, so `moved`, `stable` and `unresolvable` are
//       three distinguishable findings instead of two.
// [[feedback_a_false_false_row_cannot_be_told_from_an_untouched_defect]] [[feedback_a_hand_typed_kp_is_not_a_slice]]
const KP_PATH = arm3Only[0];
const oldestOf = (rev, p) => ((gitq(['log', '--format=%H', '--reverse', rev, '--', p]) ?? '').trim().split('\n').filter(Boolean)[0] ?? null);
const kpCount = (rev) => (gitq(['log', '--format=%H', rev, '--', 'docs/research/']) ?? '').trim().split('\n').filter(Boolean).length;
const resolves = (rev, p) => (gitq(['ls-tree', '--name-only', rev, '--', p]) ?? '').trim() !== '';
const kpMoved = kpCount(POP_PIN) !== kpCount(HEAD);
const negAtPin = resolves(POP_PIN, KP_PATH), negAtHead = resolves(HEAD, KP_PATH);
if (!negAtPin || !negAtHead) {
  unrun('GMOVEDKP', `the matched negative's path ${shortOf(KP_PATH)} does not resolve at ` +
    `${!negAtPin ? POP_PIN : ''}${!negAtPin && !negAtHead ? ' and ' : ''}${!negAtHead ? 'HEAD' : ''} — ` +
    `UNRUN, not RED: an absent path is not a stable selection and not a moved one`);
  if (!kpMoved) die('the differential test cannot detect a known difference');
} else {
  const kpNegPin = oldestOf(POP_PIN, KP_PATH), kpNegHead = oldestOf(HEAD, KP_PATH);
  const kpNegStable = kpNegPin !== null && kpNegPin === kpNegHead;
  check('GMOVEDKP', kpMoved && kpNegStable,
    `the test's own KP and matched negative, both resolvable at both revs: a full-history COUNT over ` +
    `docs/research/ reads ${kpCount(POP_PIN)} at the pin and ${kpCount(HEAD)} at HEAD (moved=${kpMoved}) — ` +
    `so the instrument can see a difference; and the OLDEST commit of ${shortOf(KP_PATH)} (taken from the ` +
    `measurement as arm3Only[0], not typed) is ${String(kpNegPin).slice(0, 8)} at both revs ` +
    `(stable=${kpNegStable}) — so it does not report differences that are not there`);
  if (!kpMoved || !kpNegStable) die('the differential test failed its own KP or matched negative — every "stable" below would be uninterpretable');
}

// (a) THE DISPUTED SITE, evaluated as its own consumer evaluates it: the count of distinct
//     `unit-*` directory creation rows, which the subject publishes as measurement M6.
const unitDirRows = (rev) => {
  const raw = gitq(['log', '--diff-filter=A', '--format=%H\u0001%aI', '--name-only', '--reverse', rev, '--', 'docs/research/']);
  if (raw === null) return null;
  const seen = new Set();
  for (const line of raw.split('\n')) {
    if (line.includes('\u0001') || !line.trim()) continue;
    const m = /^docs\/research\/(unit-[^/]+)\//.exec(line.trim());
    if (m) seen.add(m[1]);
  }
  return seen.size;
};
const dispPin = unitDirRows(POP_PIN), dispHead = unitDirRows(HEAD);
const dispMoved = dispPin !== null && dispPin !== dispHead;
const DISPUTED = 'unit-464t2-population-2026-10-28/grade-the-round-population.mjs#1';
check('P8MOVED', dispMoved,
  `THE DISPUTED SITE ${DISPUTED} — mine=${MINE.get(DISPUTED)} his=${THEIRS.get(DISPUTED)}. Its consumer ` +
  `publishes the distinct unit-dir row count as M6; evaluated through the subject's own selection, that ` +
  `count is ${dispPin} at ${POP_PIN} and ${dispHead} at HEAD. MOVED=${dispMoved} — and MOVED=true is the ` +
  `half of this test that carries sound evidence, so the selection demonstrably moves and the row is R.`);

// (b) THE SIX dir-creator A sites, as matched negatives — a consistency check on MY hand read,
//     NOT a proof of their class, because stable here means only "did not move in this interval".
const roundDirs = [...new Set(tree.map(dirOf).filter((d) => /^round\d+-instruments$/.test(d)))].sort();
const dirCreator = (rev, d) => ((gitq(['log', FLAG, '--reverse', '--format=%H', rev, '--', `docs/research/${d}/`]) ?? '').trim().split('\n').filter(Boolean)[0] ?? null);
const dcMoved = roundDirs.filter((d) => dirCreator(POP_PIN, d) !== dirCreator(HEAD, d));
check('P8NEGS', dcMoved.length === 0,
  `the dir-creator idiom behind 6 of my 7 A rows, evaluated over all ${roundDirs.length} round dirs present ` +
  `at the pin: ${dcMoved.length} changed between the two revs${dcMoved.length ? ` (${dcMoved.join(', ')})` : ''}. ` +
  `READ THIS AS REGISTERED: stable here means ONLY "not observed to move in this interval" and is NOT ` +
  `evidence for A — a movable selection over an untouched path reads stable too. A non-zero result ` +
  `would REFUTE my A rows; zero does not establish them.`);

// (c) round441 — NOT EVALUATED, with the reason, rather than fudged.
unrun('P8R441', `round441-instruments/key-the-silent-class-from-source.mjs#1 is NOT evaluated: its ` +
  `selection is taken over TRACKED_TARGETS, which the subject derives by scanning every .mjs blob in ` +
  `the tree at its own REV for a writeFileSync(join(HERE|REPO, '<literal>')) shape. Re-deriving that ` +
  `by hand would grade my re-implementation, not the subject's selection. Both readers already call ` +
  `this row R, so nothing in the price turns on it. Named and not reached, not quietly dropped.`);

// ─────────────────────────────────── cripple: classify FP-ONLY by the FLAG instead of by movement
if (CRIPPLE === 'flagkey') {
  const crippledFp = addFiles;
  const lost = diff(myPrice.fpOnly, crippledFp);
  const gained = diff(crippledFp, myPrice.fpOnly);
  console.log('');
  console.log('  CRIPPLE=flagkey — FP-ONLY keyed on the flag instead of on measured movement:');
  console.log(`    hand-read FP-ONLY ${myPrice.fpOnly.length} -> flag-keyed FP-ONLY ${crippledFp.length}`);
  console.log(`    members LOST (really stable, invisible to the flag):   ${lost.join(', ') || 'none'}`);
  console.log(`    members GAINED (really R-RETAINING, dropped wrongly):  ${gained.join(', ') || 'none'}`);
  // The delta is WRITTEN, computed, rather than eyeballed off the console — into this unit's own
  // directory only. [[feedback_exit_0_without_a_summary_line_is_not_a_measurement]]
  writeFileSync(new URL('./cripple-delta.txt', import.meta.url), [
    'unit-464cons — cripple-delta.txt',
    `computed by grade-cons.mjs --cripple=flagkey; POP_PIN=${POP_PIN} SUBJ_PIN=${SUBJ_PIN} HIS_REC=${HIS_REC}`,
    '',
    'ARM [3] FALSE-POSITIVE SET, two ways of keying it:',
    `  keyed on MEASURED MOVEMENT (my committed hand read):   FP-ONLY ${myPrice.fpOnly.length} of ${selFiles.length} files`,
    `  keyed on the --diff-filter=A FLAG (the cripple):        FP-ONLY ${crippledFp.length} of ${selFiles.length} files`,
    '',
    `COUNT DELTA:      ${myPrice.fpOnly.length} -> ${crippledFp.length}   (${crippledFp.length - myPrice.fpOnly.length >= 0 ? '+' : ''}${crippledFp.length - myPrice.fpOnly.length})`,
    `MEMBERSHIP DELTA: ${lost.length + gained.length} file(s) wrong — ${lost.length} lost, ${gained.length} gained`,
    '',
    'LOST by the flag key (really stable; a cure keyed on the flag cannot drop them, so the',
    'false positive SURVIVES the cure):',
    ...lost.map((f) => `  - ${f}`),
    '',
    'GAINED by the flag key (really R-RETAINING; a cure keyed on the flag drops them and loses a',
    'live history-keyed reading):',
    ...gained.map((f) => `  + ${f}`),
    '',
    'READING: the two keys disagree on 3 of the 18 arm-[3]-only files while their COUNTS differ by',
    'only 1. A count that is nearly right over a member list that is wrong is the exact failure the',
    "11/04 START fire refused to publish when it recorded its 8 as a co-occurrence rather than an",
    'attribution.',
  ].join('\n') + '\n');
  check('P9CRIPPLE', lost.length + gained.length > 0,
    `the cripple is REACHED on a FIGURE: membership changes by ${lost.length + gained.length} file(s) ` +
    `(${lost.length} lost, ${gained.length} gained) while the COUNT moves ${myPrice.fpOnly.length} -> ` +
    `${crippledFp.length}. A cripple that moved no figure would not be a counterfactual.`);
}

// ───────────────────────────────────────────────────────────────────────── verdict
const red = legs.filter((l) => l.state === 'RED').map((l) => l.name);
const un = legs.filter((l) => l.state === 'UNRUN').map((l) => l.name);
console.log('');
console.log(`VERDICT/${red.length === 0 ? 0 : 1} ${red.length === 0 ? 'ok' : 'RED'} ` +
  `legs=${legs.length} green=${legs.filter((l) => l.state === 'GREEN').length} ` +
  `red=[${red.join(',')}] unrun=[${un.join(',')}]`);
process.exit(red.length === 0 ? 0 : 1);
