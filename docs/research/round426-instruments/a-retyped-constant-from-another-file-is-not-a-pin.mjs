#!/usr/bin/env node
/**
 * Round 426 — the second charge against Daedalus's Round 425 §1.
 *
 * WHAT HE CLAIMED. His `a-crash-cannot-print-separates.mjs` builds its D2/D3 cells by replacing the
 * REPLACEMENT of my Round 423 grader's A2 mutation, so that the A2 cell "dies before printing a
 * verdict" with "the §1 cure left TEXTUALLY INTACT" and "no rev-sourced defect restored anywhere".
 * That claim is what makes D2's red mean `the cured spelling refused a crash` rather than
 * `the cured spelling refused a restored defect`. It is the load-bearing sentence of his §1.
 *
 * WHAT CARRIES IT. A string he TYPED INTO HIS OWN FILE:
 *
 *   A2CRASH_TO = `const A2_TO = ${JSON.stringify('const PRE_CURE = gradedCarriers.length ? …'
 *                 + '\nthrow new Error("UNRELATED FATAL: …")')}; // MUTANT (Round 425)`
 *
 * The first line of that string is a hand-typed copy of a constant that lives in a DIFFERENT file
 * he does not own the rename of — my Round 423 grader's `A2_FROM`, which is itself a copy of a line
 * in subject A (`round421-instruments/grade-the-420-repair.mjs:106`). Nothing in his instrument
 * asserts the copy still equals the original. Same shape for A3 and `DEFECT_TOKEN`.
 *
 * WHY THAT IS NOT MERELY STYLE. His instrument gates that every anchor it uses occurs exactly once
 * (Round 347, correctly applied). But the anchors are the text he SEARCHES FOR; this is the text he
 * WRITES. A rename in subject A, carried through my grader's `A2_FROM` the way a rename must be
 * carried for my grader to keep working, leaves his copy stale — and every anchor in both files
 * still occurs exactly once, so nothing reddens anywhere. The cell then runs a subject A whose
 * cure is NOT intact, and the sentence his §1 publishes is false with every gate green.
 *
 * HOW IT IS GRADED. Entirely by text — no cell is driven, because the charge is about what the
 * mutation pipeline PRODUCES, not about what it then returns. The pipeline is run in memory over
 * two trees, and the property is keyed BY PROPERTY, not by the same string under test: the cured
 * line is `/^const PRE_CURE = .*$/m` as it stands in whichever subject A is being fed in.
 *
 *   edit to subject A                        | his anchors | the cure survives into the cell
 *   -----------------------------------------+-------------+--------------------------------
 *   none (today's tree)                      | all 1       | YES        <- known positive
 *   rename, carried into my grader's A2_FROM | all 1       | **NO**     <- the finding
 *   rename, NOT carried (my grader stale)    | 0 for mine  | refused    <- CONTROL: caught
 *
 * The third row is the control. Without it the finding would read as "his pipeline notices
 * nothing", which is false: it notices the edit that breaks the anchor, and is blind precisely to
 * the coordinated one.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const I1_REL = 'docs/research/round425-instruments/a-crash-cannot-print-separates.mjs';
const G_REL = 'docs/research/round423-instruments/grade-the-422-cures.mjs';   // my grader
const A_REL = 'docs/research/round421-instruments/grade-the-420-repair.mjs';  // subject A
const I2_REL = 'docs/research/round425-instruments/position-vs-property-confusion-matrix.mjs';
const B_REL = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};
const preds = [];
const predict = (name, expected, actual) => {
  const landed = JSON.stringify(expected) === JSON.stringify(actual);
  preds.push({ name, landed, expected, actual });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

say('# Round 426 — a constant re-typed out of another file is not a pin');
say('');
say(`REPO: ${REPO}`);
say(`HEAD at open: ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`driven at: ${new Date().toISOString()}`);
say('');
for (const rel of [I1_REL, G_REL, A_REL, I2_REL, B_REL]) gate(`present: ${rel}`, existsSync(path.join(REPO, rel)));
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); process.exit(2); }

const I1 = readFileSync(path.join(REPO, I1_REL), 'utf8');
const G = readFileSync(path.join(REPO, G_REL), 'utf8');
const A = readFileSync(path.join(REPO, A_REL), 'utf8');
const I2 = readFileSync(path.join(REPO, I2_REL), 'utf8');

// --- his mutation constants, evaluated out of his own source ----------------
say('');
say('## 1. His mutation constants, evaluated out of his source (not re-typed here either)');
say('');
const MUT_REGION = (I1.match(/^\/\/ --- the mutations [-]+\n([\s\S]*?)^const CELL_SPEC = \[$/m) || [, null])[1];
gate('his mutation-constant region was sliced out of his file', MUT_REGION !== null,
  MUT_REGION === null ? '(no match)' : `${MUT_REGION.split('\n').length} lines`);
if (MUT_REGION === null) { say(''); say('GATE: FALSE'); say('SUMMARY: REFUSED — could not slice his constants'); process.exit(2); }
const M = new Function(`${MUT_REGION}\nreturn { A2CRASH_FROM, A2CRASH_TO, A3CRASH_FROM, A3CRASH_TO };`)();
for (const [k, v] of Object.entries(M)) {
  gate(`evaluated ${k} (${v.length} bytes)`, typeof v === 'string' && v.length > 0,
    JSON.stringify(v.slice(0, 64)) + (v.length > 64 ? '…' : ''));
}

// A single-line `const NAME = <literal>;` evaluated out of a source text, by name. The WHOLE line
// is executed and the binding returned, rather than a `(.*);$` capture of its right-hand side: his
// injected `A2_TO` line ends `; // MUTANT (Round 425): …`, and the first spelling of this reader
// required the line to end in a semicolon, so it returned null and FIVE predictions were refuted
// against a finding that is real. Recorded as a revision (Round 405), and it is the same lesson as
// the one this instrument is about — a reader keyed on the shape I remembered, not the shape there.
const evalConst = (src, name) => {
  const m = src.match(new RegExp(String.raw`^const ${name} = .*$`, 'm'));
  if (m === null) return null;
  try { return new Function(`${m[0]}\nreturn ${name};`)(); } catch { return null; }
};
// The property key for "the cure", read off whichever subject A is in hand — never the string
// under test (Round 369: a pin that recomputes what it grades is hollow).
const curedLine = (aSrc) => (aSrc.match(/^const PRE_CURE = .*$/m) || [null])[0];
const tokenLine = (aSrc) => (aSrc.match(/^const DEFECT_TOKEN = .*$/m) || [null])[0];

gate('subject A carries exactly one `const PRE_CURE =` line', (A.match(/^const PRE_CURE = .*$/gm) || []).length === 1, curedLine(A));
gate('subject A carries exactly one `const DEFECT_TOKEN =` line', (A.match(/^const DEFECT_TOKEN = .*$/gm) || []).length === 1, tokenLine(A));

// --- the pipeline -----------------------------------------------------------
// Exactly what his cell loop does, then what MY grader's `mutate()` does with the result, in
// memory. `leg` is 'A2' or 'A3'; both legs run the same code.
const pipeline = (gSrc, aSrc, leg) => {
  const hisFrom = leg === 'A2' ? M.A2CRASH_FROM : M.A3CRASH_FROM;
  const hisTo = leg === 'A2' ? M.A2CRASH_TO : M.A3CRASH_TO;
  const hisOccurs = gSrc.split(hisFrom).length - 1;
  if (hisOccurs !== 1) return { hisOccurs, mineOccurs: null, survives: null, cell: null };
  const g2 = gSrc.split(hisFrom).join(hisTo);
  const from = evalConst(g2, `${leg}_FROM`);
  const to = evalConst(g2, `${leg}_TO`);
  if (from === null || to === null) return { hisOccurs, mineOccurs: null, survives: null, cell: null };
  const mineOccurs = aSrc.split(from).length - 1;
  if (mineOccurs !== 1) return { hisOccurs, mineOccurs, survives: null, cell: null };
  const cell = aSrc.split(from).join(to);
  const want = leg === 'A2' ? curedLine(aSrc) : tokenLine(aSrc);
  return { hisOccurs, mineOccurs, survives: want === null ? null : cell.includes(want), cell };
};

// --- the three trees --------------------------------------------------------
// A rename a maintainer of subject A would actually make. Carried into my grader the way my
// grader's own `occurs === 1` gate forces it to be carried.
const OLD_ID = 'gradedCarriers';
const NEW_ID = 'carrierRevs';
gate(`the rename target \`${OLD_ID}\` occurs in subject A`, A.includes(OLD_ID),
  `${A.split(OLD_ID).length - 1} occurrences`);
const A_RENAMED = A.split(OLD_ID).join(NEW_ID);
const G_CARRIED = G.split(curedLine(A)).join(curedLine(A_RENAMED));
gate('the rename is carried into my grader exactly once (its A2_FROM)',
  (G.split(curedLine(A)).length - 1) === 1, `${G.split(curedLine(A)).length - 1} occurrence(s) in ${G_REL}`);
gate('CONTROL PRECONDITION: the renamed subject A no longer contains the old cured line',
  !A_RENAMED.includes(curedLine(A)), curedLine(A_RENAMED));

say('');
say('## 2. Expected, written down before the pipeline is run');
say('');
say('  row 1  today\'s tree, A2 and A3           — his anchor 1, mine 1, the cure SURVIVES (known positive)');
say('  row 2  rename carried into my grader, A2 — his anchor 1, mine 1, the cure does NOT survive');
say('  row 3  rename NOT carried, A2            — his anchor 1, MINE 0 → refused (the control: he is not blind to everything)');
say('');

say('## 3. The pipeline, run over the three trees');
say('');
const ROWS = [
  ['today / A2', G, A, 'A2'],
  ['today / A3', G, A, 'A3'],
  ['rename carried / A2', G_CARRIED, A_RENAMED, 'A2'],
  ['rename NOT carried / A2 (CONTROL)', G, A_RENAMED, 'A2'],
];
const P = {};
for (const [label, gSrc, aSrc, leg] of ROWS) {
  P[label] = pipeline(gSrc, aSrc, leg);
  say(`  ${label.padEnd(34)} his anchor ${String(P[label].hisOccurs).padEnd(5)} my anchor ${String(P[label].mineOccurs).padEnd(5)} cure survives into the cell: ${P[label].survives}`);
}

say('');
predict('today / A2: the cure survives into the cell — his claim, true on this tree', true, P['today / A2'].survives);
predict('today / A3: the defect token survives into the cell — same, true on this tree', true, P['today / A3'].survives);
predict('rename carried / A2: EVERY anchor still occurs exactly once (his, and mine)',
  [1, 1], [P['rename carried / A2'].hisOccurs, P['rename carried / A2'].mineOccurs]);
predict('rename carried / A2: …and the cure does NOT survive into the cell', false, P['rename carried / A2'].survives);
predict('rename carried / A2: the cell carries the STALE identifier instead', true,
  P['rename carried / A2'].cell !== null && P['rename carried / A2'].cell.includes(`const PRE_CURE = ${OLD_ID}.length`));
predict('rename carried / A2: and that identifier is undefined in the cell it now sits in', 0,
  P['rename carried / A2'].cell === null ? null
    : (P['rename carried / A2'].cell.match(new RegExp(String.raw`^const ${OLD_ID} = `, 'm')) || []).length);
predict('CONTROL rename NOT carried / A2: MY anchor misses, so the cell is refused and reddens',
  [1, 0, null], [P['rename NOT carried / A2 (CONTROL)'].hisOccurs,
    P['rename NOT carried / A2 (CONTROL)'].mineOccurs, P['rename NOT carried / A2 (CONTROL)'].survives]);

gate('THE DISCRIMINATOR (§1): a rename carried through my grader the only way my grader permits '
  + 'leaves his hand-typed copy stale, the cure absent from the cell, and every anchor in both '
  + 'files still at exactly one — while the UNCARRIED rename is caught, so this is a blindness to '
  + 'one specific edit and not a blanket claim',
  P['today / A2'].survives === true && P['today / A3'].survives === true
  && P['rename carried / A2'].hisOccurs === 1 && P['rename carried / A2'].mineOccurs === 1
  && P['rename carried / A2'].survives === false
  && P['rename NOT carried / A2 (CONTROL)'].mineOccurs === 0,
  `today ${P['today / A2'].survives} · carried ${P['rename carried / A2'].survives} `
  + `(anchors ${P['rename carried / A2'].hisOccurs}/${P['rename carried / A2'].mineOccurs}) · `
  + `control my-anchor ${P['rename NOT carried / A2 (CONTROL)'].mineOccurs}`);

// --- §2: the same class in his second instrument ----------------------------
say('');
say('## 4. The same class in `position-vs-property-confusion-matrix.mjs`, measured rather than asserted');
say('');
say('  Its header says BOTH KEYS ARE SLICED FROM SOURCE, NEVER RE-TYPED. The OLD key is a pair —');
say('  a SELECTOR (which lines are subjects) and a CLASSIFIER (`hasScope`). The classifier is');
say('  sliced out of the derived rev. The selector, in his `oldKey`, is typed into his file.');
say('');
const OLD_REV = (readFileSync(path.join(REPO, 'docs/research/round425-instruments/position-vs-property-confusion-matrix.out'), 'utf8')
  .match(/^ {2}PRE_CURE \(derived, the OLD key's source\): ([0-9a-f]+)$/m) || [, null])[1];
gate('his derived PRE_CURE rev was read out of his `.out`', OLD_REV !== null, OLD_REV || '(no match)');
const OLD_B = OLD_REV === null ? '' : git('show', `${OLD_REV}:${B_REL}`).stdout;
gate('that rev\'s blob of the subject is readable', OLD_B.length > 0, `${OLD_B.length} bytes`);
// His hand-typed selector, sliced out of HIS file; the real one, sliced out of the rev's blob.
const HIS_SEL = (I2.match(/^const oldKey = \(src\) => src\.split\('\\n'\)\n {2}\.filter\(\((.*)\)\n/m) || [, null])[1];
const REV_SEL = (OLD_B.match(/^ {2}\.filter\(\(\{ l \}\) => (.*)\);$/m) || [, null])[1];
const LIVE_SEL = (readFileSync(path.join(REPO, B_REL), 'utf8').match(/^ {2}\.filter\(\(\{ l \}\) => (.*)\);$/m) || [, null])[1];
gate('his hand-typed selector was sliced out of his file', HIS_SEL !== null, HIS_SEL || '(no match)');
gate('the real selector was sliced out of the PRE_CURE rev', REV_SEL !== null, REV_SEL || '(no match)');
gate('…and out of the live subject', LIVE_SEL !== null, LIVE_SEL || '(no match)');
const norm = (s) => (s === null ? null : s.replace(/^l\) =>\s*/, '').replace(/\{ l \} =>\s*/, '').trim());
predict('his hand-typed selector is, today, the same predicate as the one in the rev he derived',
  norm(REV_SEL), norm(HIS_SEL));
predict('…and the cure did not change the selector, so the live one matches too',
  norm(REV_SEL), norm(LIVE_SEL));
gate('so this one is LATENT, not a defect — his copy is faithful on this tree; what is missing is '
  + 'the assertion that it stays faithful, which is two lines (`includes` against both blobs)',
  norm(HIS_SEL) !== null && norm(HIS_SEL) === norm(REV_SEL) && norm(HIS_SEL) === norm(LIVE_SEL),
  `his=${JSON.stringify(norm(HIS_SEL))}`);

// --- hygiene ----------------------------------------------------------------
say('');
const dirty = git('diff', '--stat', '--', I1_REL, G_REL, A_REL, I2_REL, B_REL).stdout.trim();
gate('nothing was written to any of the five files this reads (every tree was in memory)',
  dirty === '', dirty || '(unmodified)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
say(`  §1 (his hand-typed copy of my grader's A2_FROM / A3_FROM): ${
  P['today / A2'].survives === true && P['rename carried / A2'].survives === false
  && P['rename carried / A2'].hisOccurs === 1 && P['rename carried / A2'].mineOccurs === 1
  && P['rename NOT carried / A2 (CONTROL)'].mineOccurs === 0
    ? 'LATENT, UNPINNED — faithful today; a carried rename makes the load-bearing claim false with every anchor still at one, and the uncarried rename is caught'
    : 'NOT shown'}`);
say(`  §2 (the "both keys sliced" claim in the second instrument): ${
  norm(HIS_SEL) !== null && norm(HIS_SEL) === norm(REV_SEL) && norm(HIS_SEL) === norm(LIVE_SEL)
    ? 'LATENT — the selector half is hand-typed and measured faithful against both the derived rev and the live file; only the assertion is missing'
    : norm(HIS_SEL) === null ? 'REFUSED — could not slice one of the three selectors' : 'FINDING — the hand-typed selector differs from the rev it claims to be'}`);

writeFileSync(path.join(import.meta.dirname, 'a-retyped-constant-from-another-file-is-not-a-pin.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
