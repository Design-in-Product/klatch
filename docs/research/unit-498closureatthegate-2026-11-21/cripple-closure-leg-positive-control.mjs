#!/usr/bin/env node
/**
 * unit-498closureatthegate — cripple for P5.
 *
 * P5: Daedalus's closure leg reports `0 disagreements` between `A` (the widened key) and `B` (the
 * hazard's `/LABEL\s*$/`), over his derived 25-character set, with a 6-character control set that
 * guards the always-TRUE failure. It carries no guard for the always-FALSE failure: two predicates
 * that both return `false` on every member also disagree 0 times, and his control set's
 * both-false expectation is *satisfied* by that pair rather than violated by it.
 *
 * The claim under test is about HIS instrument, so the leg is **sliced out of his published arm
 * byte-identically** and driven here. `docs/research/unit-497paddedlabelclosure-2026-11-21/` is not
 * edited by this file, by reader or by byte — the 11-20 *don't edit them* decision is not reopened.
 * The cripple is applied to THIS unit's in-memory copy of the slice and written only to an
 * untracked scratch path.
 *
 * The cripple mis-keys the verdict vocabulary in BOTH predicates at once, with each substitution's
 * match count asserted to be exactly 1, and asserts that the PLANT literal is untouched — so the
 * cripple changes the readers and nothing else. If his leg still reports 0 disagreements and 6 of 6
 * both-false under it, the leg is green on a pair of readers that cannot see its own subject.
 *
 * A proposed positive control is driven in the same harness, so the finding ships with the
 * counterfactual that would catch it rather than with a recommendation.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const HIS_ARM = resolve(ROOT, 'docs/research/unit-497paddedlabelclosure-2026-11-21/arm-padded-closure.mjs');
const SCRATCH = resolve(ROOT, 'docs/research/unit-498closureatthegate-2026-11-21/scratch-unit498-leg.mjs');

/* ------------------------------------------------- slice HIS leg, by anchor and byte range ---- */
const src = readFileSync(HIS_ARM, 'utf8');
const START_ANCHOR = 'const ws = [];';
const END_ANCHOR = "console.log(`  whitespace characters derived";
const startOffset = src.indexOf(START_ANCHOR);
const endOffset = src.indexOf(END_ANCHOR);
if (startOffset < 0) throw new Error('cripple: start anchor absent from his arm');
if (endOffset < 0) throw new Error('cripple: end anchor absent from his arm');
if (endOffset <= startOffset) throw new Error('cripple: end anchor precedes start anchor');
if (src.split(START_ANCHOR).length - 1 !== 1) throw new Error('cripple: start anchor is not unique');
if (src.split(END_ANCHOR).length - 1 !== 1) throw new Error('cripple: end anchor is not unique');
const leg = src.slice(startOffset, endOffset);
// A count of 1 does not pin an anchor and an anchor does not prove an intact span: assert both.
if (src.slice(startOffset, startOffset + leg.length) !== leg) {
  throw new Error('cripple: slice is not byte-identical to the file span');
}
const legReport = {
  bytes: Buffer.byteLength(leg),
  codeUnits: leg.length,
  startOffset,
  endOffset,
  startLine: src.slice(0, startOffset).split('\n').length,
  endLine: src.slice(0, endOffset).split('\n').length,
};

// The plant shape is a fixture, not a reader. It is typed here and then ASSERTED to be the shape
// his slice actually uses, so the tail below plants what his loop plants.
const PLANT_TEMPLATE = 'row  GUARDED${c}';
if (!leg.includes(`\`${PLANT_TEMPLATE}\``)) {
  throw new Error('cripple: the typed plant template is not the one his sliced leg uses');
}

/* ------------------------------------------------------------------- the cripple, asserted ---- */
const LABEL_SET_LIVE = "const LABEL_SET = ['MARKED', 'GUARDED', 'UNGUARDED'];";
const LABEL_SET_DEAD = "const LABEL_SET = ['ZQMARKED', 'ZQGUARDED', 'ZQUNGUARDED'];";
const RIVAL_LIVE = '/(?:MARKED|GUARDED|UNGUARDED)\\s*$/';
const RIVAL_DEAD = '/(?:ZQMARKED|ZQGUARDED|ZQUNGUARDED)\\s*$/';
for (const [needle, label] of [[LABEL_SET_LIVE, 'LABEL_SET'], [RIVAL_LIVE, 'rival regex']]) {
  const n = leg.split(needle).length - 1;
  if (n !== 1) throw new Error(`cripple: ${label} occurs ${n}x in the slice; exactly 1 required`);
}
const crippled = leg.replace(LABEL_SET_LIVE, LABEL_SET_DEAD).replace(RIVAL_LIVE, RIVAL_DEAD);
if (crippled === leg) throw new Error('cripple: substitution produced an identical body');
// The cripple must move the READERS and nothing else: the plant literal survives untouched, and it
// still names the real label, so the subject of the measurement is unchanged.
const plantsBefore = leg.split(`\`${PLANT_TEMPLATE}\``).length - 1;
const plantsAfter = crippled.split(`\`${PLANT_TEMPLATE}\``).length - 1;
if (plantsBefore !== plantsAfter) throw new Error('cripple: the plant literal moved; the cripple is not reader-only');

/* --------------------------------------------------------------------------- drive both arms -- */
const TAIL = `
const plantOf = (c) => \`${PLANT_TEMPLATE}\`;
const bothTrue = ws.filter((c) => A(plantOf(c)) && B(plantOf(c))).length;
const bothFalseControls = CONTROLS.filter((c) => !A(plantOf(c)) && !B(plantOf(c))).length;
console.log(JSON.stringify({
  wsMembers: ws.length,
  disagreements: disagreements.length,
  controlDisagreements: controlDisagreements.length,
  controlsBothFalse: bothFalseControls,
  controlsTotal: CONTROLS.length,
  membersBothTrue: bothTrue,
  hisTwoTermsSatisfied: disagreements.length === 0 && controlDisagreements.length === 0,
  proposedPositiveControlSatisfied: disagreements.length === 0 && bothTrue === ws.length,
}));
`;

function run(bodyText, name) {
  writeFileSync(SCRATCH, bodyText + TAIL);
  try {
    const r = spawnSync(process.execPath, [SCRATCH], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`cripple: ${name} drive exited rc=${r.status}: ${r.stderr}`);
    return JSON.parse(r.stdout.trim());
  } finally {
    rmSync(SCRATCH, { force: true });
  }
}

const control = run(leg, 'control (his leg verbatim)');
const dead = run(crippled, 'crippled (both readers mis-keyed)');

/* ------------------------------------------------------------------------------------ report -- */
console.log('unit-498closureatthegate — cripple on the closure leg (P5)');
console.log('');
console.log('## provenance — his leg, sliced byte-identically, never edited in place');
console.log(`  subject: docs/research/unit-497paddedlabelclosure-2026-11-21/arm-padded-closure.mjs`);
console.log(`  span: offsets ${legReport.startOffset}..${legReport.endOffset}`
  + ` (source lines ${legReport.startLine}..${legReport.endLine}),`
  + ` ${legReport.bytes} bytes (Buffer.byteLength) / ${legReport.codeUnits} UTF-16 code units`);
console.log('  byte-identical to the file span: true   both anchors unique: true');
console.log(`  plant literal occurrences, before cripple ${plantsBefore} / after ${plantsAfter}`
  + '  (cripple is reader-only)');
console.log('');
console.log('## the two drives');
const row = (name, r) => {
  console.log(`  ${name}`);
  console.log(`      ws members ${r.wsMembers}   disagreements ${r.disagreements}`
    + `   control disagreements ${r.controlDisagreements}`
    + `   controls both-false ${r.controlsBothFalse} of ${r.controlsTotal}`);
  console.log(`      members on which BOTH predicates are TRUE: ${r.membersBothTrue} of ${r.wsMembers}`);
  console.log(`      his two terms of \`ok\` satisfied: ${r.hisTwoTermsSatisfied}`
    + `      proposed positive control satisfied: ${r.proposedPositiveControlSatisfied}`);
};
row('CONTROL — his leg verbatim', control);
row('CRIPPLE — `GUARDED` mis-keyed in LABEL_SET *and* in the rival regex, plant untouched', dead);
console.log('');
const legStaysGreen = dead.disagreements === 0
  && dead.controlDisagreements === 0
  && dead.controlsBothFalse === dead.controlsTotal
  && dead.hisTwoTermsSatisfied === true;
const proposedCatchesIt = control.proposedPositiveControlSatisfied === true
  && dead.proposedPositiveControlSatisfied === false;
console.log(`  P5 — leg reports GREEN under the cripple: ${legStaysGreen}`);
console.log(`  the proposed positive control separates the two drives: ${proposedCatchesIt}`
  + `  (control ${control.proposedPositiveControlSatisfied} / cripple ${dead.proposedPositiveControlSatisfied})`);
console.log(`  control reproduces his published figures (25 / 0 / 6 of 6): `
  + `${control.wsMembers === 25 && control.disagreements === 0 && control.controlsBothFalse === 6}`);
console.log('');
console.log(`CRIPPLE ${legStaysGreen && proposedCatchesIt ? 'CONFIRMS P5' : 'REFUTES P5'} —`
  + ' the cripple is applied to a byte-identical slice in an untracked scratch path; his published'
  + ' instrument is unmodified.');
