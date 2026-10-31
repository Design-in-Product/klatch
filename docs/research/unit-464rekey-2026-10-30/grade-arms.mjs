#!/usr/bin/env node
// grade-arms.mjs — unit-464rekey, 2026-10-30 STOP fire (Daedalus).
//
// Reads the committed `.out` recordings and prints the red-set DELTAS and the figures the
// predictions are keyed on. Nothing here recomputes a grade: every figure is sliced out of
// a recording, because a verdict I re-type is not the verdict the drive printed.
//
// Cripples are graded as a delta against a MATCHED no-cripple drive of the same argv — the
// method the `control-fallback` refutation forced on 10-30 WORK, where three gates shared
// one precondition and no absolute red list could isolate an arm.

import { readFileSync } from 'node:fs';

const read = (n) => readFileSync(`${n}.out`, 'utf8');

const redOf = (n) => {
  const m = /^MAPVERDICT\/(\d+) (ok|RED) gates=(\d+) red=\[([^\]]*)\]$/m.exec(read(n));
  if (m === null) return null; // REFUSE: never [] — an unreadable verdict is not a clean one
  return { code: Number(m[1]), gates: Number(m[3]), red: m[4] === '' ? [] : m[4].split(',') };
};

// Figures sliced per arm block. Keyed on the `ARM <name>` header so a figure is never
// taken from the wrong arm's block.
const figures = (n, arm) => {
  const t = read(n);
  const i = t.indexOf(`\nARM ${arm}`);
  if (i === -1) return null;
  const rest = t.slice(i + 1);
  const j = rest.indexOf('\nARM ');
  const block = j === -1 ? rest : rest.slice(0, j);
  const g = (re) => {
    const m = re.exec(block);
    return m === null ? null : m[1];
  };
  return {
    fullyNamed: g(/fullyNamed=(\S+)/),
    fullyCaptured: g(/fullyCaptured=(\S+)/),
    underReportedRaw: g(/underReported=\[([^\]]*)\]/),
    underReportedArmCaused: g(/underReportedArmCaused=\[([^\]]*)\]/),
    tokensTyped: g(/tokensTyped=\[([^\]]*)\]/),
    linesSubjected: g(/linesSubjected=(\S+)/),
    liveWithheld: g(/withheld (\d+) context line/),
    unionBearing: g(/unionBearing=(\S+)/),
    rowT9: g(/^ {4}T9 +(.*)$/m),
    rowT2: g(/^ {4}T2 +(.*)$/m),
  };
};

const delta = (label, base, arm) => {
  const a = redOf(base);
  const b = redOf(arm);
  if (a === null || b === null) {
    console.log(`DELTA ${label.padEnd(26)} REFUSED — unreadable verdict in [${a === null ? base : arm}]`);
    return;
  }
  const adds = b.red.filter((x) => !a.red.includes(x));
  const removes = a.red.filter((x) => !b.red.includes(x));
  console.log(
    `DELTA ${label.padEnd(26)} ${base} red=[${a.red.join(',')}] exit=${a.code}`
    + `  →  ${arm} red=[${b.red.join(',')}] exit=${b.code}`
    + `   adds=[${adds.join(',')}] removes=[${removes.join(',')}]`
  );
};

console.log('=== VERDICTS ===');
const ALL = [
  'drive1.mapA-honest', 'drive2.mapA-subject-blind', 'drive3.mapA-subject-rows-only',
  'drive4.mapA-subject-bold-only', 'drive5.mapA-prose', 'drive6.mapB-honest',
  'drive7.mapB-typed-ungated', 'drive8.mapB-subject-rows-only', 'drive9.mapB-subject-bold-only',
  'drive10.mapB-subject-blind', 'drive11.mapA-poisoned', 'drive12.mapA-poisoned-header-blind',
  'drive13.mapA-foreign-control', 'drive14.mapA-crippled-clean', 'drive15.mapA-nomoved',
];
for (const n of ALL) {
  const v = redOf(n);
  console.log(`  ${n.padEnd(34)} ${v === null ? 'REFUSED' : `exit=${v.code} gates=${v.gates} red=[${v.red.join(',')}]`}`);
}

console.log('\n=== CRIPPLE DELTAS (each against its matched no-cripple drive of the same argv) ===');
delta('subject-blind/MAP-A', 'drive1.mapA-honest', 'drive2.mapA-subject-blind');
delta('subject-rows-only/MAP-A', 'drive1.mapA-honest', 'drive3.mapA-subject-rows-only');
delta('subject-bold-only/MAP-A', 'drive1.mapA-honest', 'drive4.mapA-subject-bold-only');
delta('typed-ungated/MAP-B', 'drive6.mapB-honest', 'drive7.mapB-typed-ungated');
delta('subject-rows-only/MAP-B', 'drive6.mapB-honest', 'drive8.mapB-subject-rows-only');
delta('subject-bold-only/MAP-B', 'drive6.mapB-honest', 'drive9.mapB-subject-bold-only');
delta('subject-blind/MAP-B', 'drive6.mapB-honest', 'drive10.mapB-subject-blind');
delta('control-header-blind', 'drive11.mapA-poisoned', 'drive12.mapA-poisoned-header-blind');

console.log('\n=== R1/R2: MAP-A, Theseus\'s drive1 vs mine, same argv, one code change apart ===');
const HIS = '../unit-464v21map-2026-10-30/drive1.v21map-honest-control';
const hisText = readFileSync(`${HIS}.out`, 'utf8');
const hisBlock = hisText.slice(hisText.indexOf('\nARM t8-unpinned'));
const hisG = (re) => {
  const m = re.exec(hisBlock);
  return m === null ? null : m[1];
};
const mine = figures('drive1.mapA-honest', 't8-unpinned');
const rows = [
  ['tokensTyped', hisG(/tokensTyped=\[([^\]]*)\]/), mine.tokensTyped],
  ['fullyNamed', hisG(/fullyNamed=(\S+)/), mine.fullyNamed],
  ['fullyCaptured', hisG(/fullyCaptured=(\S+)/), mine.fullyCaptured],
  ['underReported RAW', hisG(/underReported=\[([^\]]*)\]/), mine.underReportedRaw],
  ['underReportedArmCaused', hisG(/underReportedArmCaused=\[([^\]]*)\]/), mine.underReportedArmCaused],
  ['T9 row', hisG(/^ {4}T9 +(.*)$/m), mine.rowT9],
  ['T2 row', hisG(/^ {4}T2 +(.*)$/m), mine.rowT2],
];
for (const [k, his, me] of rows) {
  console.log(`  ${k.padEnd(24)} ${his === me ? 'SAME' : 'MOVED'}\n      his:  ${his}\n      mine: ${me}`);
}

console.log('\n=== R5: is the UNBOLDED half of the subject parse load-bearing on MAP-B? ===');
for (const arm of ['t2b-sat-wrong-arm', 't2b-dir-pinned', 't8-ceiling-blind']) {
  const bold = figures('drive9.mapB-subject-bold-only', arm);
  const blind = figures('drive10.mapB-subject-blind', arm);
  const broad = figures('drive6.mapB-honest', arm);
  const keys = ['linesSubjected', 'unionBearing', 'fullyNamed', 'fullyCaptured', 'underReportedRaw', 'tokensTyped'];
  const diffs = keys.filter((k) => bold[k] !== broad[k]);
  const boldVsBlind = keys.filter((k) => bold[k] !== blind[k]);
  console.log(
    `  ${arm.padEnd(20)} broad-vs-bold-only differs on [${diffs.join(',')}]`
    + `  ·  bold-only-vs-subject-blind differs on [${boldVsBlind.join(',')}]`
  );
}

console.log('\n=== R7: GTYPEDDEF on MAP-B, and R12: the foreign control ===');
for (const [n, re] of [
  ['drive6.mapB-honest', /^GTYPEDDEF .*$/m],
  ['drive7.mapB-typed-ungated', /^GTYPEDDEF .*$/m],
  ['drive13.mapA-foreign-control', /^GCTRLPROV .*$/m],
  ['drive13.mapA-foreign-control', /^GCTRL {2}.*$/m],
  ['drive14.mapA-crippled-clean', /^GCTRLPROV .*$/m],
  ['drive11.mapA-poisoned', /^GCTRLPROV .*$/m],
  ['drive11.mapA-poisoned', /^GCTRL {2}.*$/m],
  ['drive15.mapA-nomoved', /^GTYPEDDEF .*$/m],
]) {
  const m = re.exec(read(n));
  console.log(`  ${n.padEnd(34)} ${m === null ? 'NOT FOUND' : m[0]}`);
}
