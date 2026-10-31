#!/usr/bin/env node
// price-the-cure.mjs — unit-464reach, 2026-10-31 START fire (Theseus).
//
// P5 / P6: does the one-character-class cure redden `GTYPEDDEF` on the map Daedalus just
// filed as its only authored green cell? His §4 expects yes and did not drive it.
//
// THE LIVE CHECKER IS NOT EDITED. Two SCRATCH copies are made in THIS directory, which is
// at the SAME depth as the checker's own directory (`docs/research/unit-*/`) — a scratch
// copy at the wrong depth has refused whole cells on this track before, because `GMUST`
// realpaths the map's DECLARED paths against cwd.
//
// THE ARM/CLEAN/CONTROL TUPLE IS SLICED OUT OF HIS COMMITTED `drive.mjs`, not retyped.
// Slicing the inputs and then retyping the invocation is how a reproduction stops being
// one.
//
// P6 is the MATCHED NO-CRIPPLE drive: the uncured scratch copy must reproduce his
// committed recording's own lines. A cripple graded without a matched no-cripple drive is
// not graded, so if P6 fails, P5 is WITHDRAWN rather than reported.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const HIS_DIR = '../unit-464authored-2026-10-31';
const CHECKER_SRC = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const SCRATCH = 'grade-filed-maps.SCRATCH.mjs';
const CURED = 'grade-filed-maps.CURED.mjs';
const BOUNDARY = '(?:^|\\s)';
const CURED_BOUNDARY = '(?:^|[^A-Za-z0-9_.])';

let fatal = 0;
const FATAL = (why) => {
  console.log(`FATAL — ${why}`);
  fatal += 1;
};

// --- Slice the tuple out of his harness.
const hisDrive = readFileSync(`${HIS_DIR}/drive.mjs`, 'utf8');
const constBlock = (() => {
  const lines = hisDrive.split('\n');
  const start = lines.findIndex((l) => l.startsWith('const CHECKER = '));
  const end = lines.findIndex((l, i) => i > start && /^const CONTROL = \[/.test(l));
  if (start === -1 || end === -1) return null;
  // CONTROL's literal is one line in his file; take through it.
  return lines.slice(start, end + 1).join('\n');
})();
const drive1Literal = (() => {
  const m = hisDrive.match(/^\s*drive1:\s*(\[[^\]]*\]),?\s*$/m);
  return m === null ? null : m[1];
})();

if (constBlock === null) FATAL('could not slice his const block (CHECKER..CONTROL) out of drive.mjs');
if (drive1Literal === null) FATAL("could not slice his `drive1:` argv literal out of drive.mjs");

let argv = null;
if (constBlock !== null && drive1Literal !== null) {
  try {
    // eslint-disable-next-line no-new-func
    argv = new Function(`"use strict";\n${constBlock}\nreturn ${drive1Literal};`)();
  } catch (e) {
    FATAL(`his sliced tuple did not evaluate (${e.message})`);
  }
}
if (argv !== null) {
  console.log(`TUPLE  sliced from ${HIS_DIR}/drive.mjs — ${argv.length} arg(s):`);
  for (const a of argv) console.log(`         ${a}`);
  if (!argv.some((a) => a === '--map=V22-MAP.md')) {
    FATAL('the sliced tuple does not target V22-MAP.md — this is not his green cell');
  }
}

// --- Build the two scratch copies.
const src = readFileSync(CHECKER_SRC, 'utf8');
writeFileSync(SCRATCH, src);
const occurrences = src.split(BOUNDARY).length - 1;
if (occurrences !== 1) {
  FATAL(
    `the boundary ${BOUNDARY} occurs ${occurrences}x in the WHOLE checker, not once — a blanket ` +
      `substitution would be ambiguous and is refused`,
  );
}
const curedSrc = src.replace(BOUNDARY, CURED_BOUNDARY);
writeFileSync(CURED, curedSrc);

// --- CUREDIFF: exactly one LINE differs, asserted line-for-line and FATAL, not skipped.
{
  const a = src.split('\n');
  const b = curedSrc.split('\n');
  if (a.length !== b.length) FATAL(`cure changed the line count ${a.length} -> ${b.length}`);
  const differing = a.map((l, i) => (l === b[i] ? -1 : i)).filter((i) => i !== -1);
  const ok = differing.length === 1;
  console.log(
    `CUREDIFF ${ok ? 'ok ' : 'FATAL'} ${differing.length} line(s) differ between the scratch copy ` +
      `and the cured copy${differing.length > 0 ? ` (line ${differing.map((i) => i + 1).join(',')})` : ''}`,
  );
  if (ok) {
    console.log(`         -  ${a[differing[0]].trim()}`);
    console.log(`         +  ${b[differing[0]].trim()}`);
  } else {
    FATAL('the cure is not a one-line change');
  }
}

if (fatal > 0) {
  console.log(`\nREFUSED — ${fatal} FATAL condition(s). P5 and P6 are UNMEASURED.`);
  process.exit(2);
}

// --- Drive. cwd is HIS directory so his relative tuple resolves exactly as it did for him.
const drive = (tag, checkerRel) => {
  const r = spawnSync('node', [checkerRel, ...argv], {
    cwd: HIS_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  writeFileSync(`${tag}.out`, r.stdout ?? '');
  writeFileSync(`${tag}.err`, r.stderr ?? '');
  console.log(
    `--- ${tag}  checker=${checkerRel}  exit=${r.status}  err=${statSync(`${tag}.err`).size}B`,
  );
  return r.stdout ?? '';
};

const lineOf = (text, prefix) => text.split('\n').find((l) => l.startsWith(prefix)) ?? '(ABSENT)';
const ANCHORS = ['MAPVERDICT', 'GTYPEDDEF', 'GTYPED ', 'GSUBJ', 'GCOMPLETE', 'GCONFORM'];

const uncured = drive('drive4.scratch-uncured', `../unit-464reach-2026-10-31/${SCRATCH}`);
const hisRecording = readFileSync(`${HIS_DIR}/drive1.out`, 'utf8');

// --- P6: MATCHED NO-CRIPPLE. Compare ANCHOR BY ANCHOR, and an ABSENT anchor REFUSES
// rather than comparing equal to another absence.
let p6differ = 0;
let p6refused = 0;
console.log('\n--- P6: the uncured scratch copy against his committed drive1.out, anchor by anchor');
for (const a of ANCHORS) {
  const mine = lineOf(uncured, a);
  const his = lineOf(hisRecording, a);
  if (mine === '(ABSENT)' || his === '(ABSENT)') {
    console.log(`P6 REFUSED ${a}: mine=${mine === '(ABSENT)' ? 'ABSENT' : 'present'} his=${his === '(ABSENT)' ? 'ABSENT' : 'present'}`);
    p6refused += 1;
    continue;
  }
  const same = mine === his;
  if (!same) p6differ += 1;
  console.log(`P6 ${same ? 'ok ' : 'RED'} ${a}`);
  if (!same) {
    console.log(`       his:  ${his}`);
    console.log(`       mine: ${mine}`);
  }
}
const p6 = p6differ === 0 && p6refused === 0;
console.log(
  `P6 ${p6 ? 'LANDS' : 'FAILS'} — ${ANCHORS.length} anchor(s), ${p6differ} differ, ${p6refused} refused. ` +
    (p6
      ? 'The scratch copy at identical depth reproduces his recording, so any delta below is attributable to the one character class.'
      : 'P5 is WITHDRAWN: without a matched no-cripple drive the cured result is not attributable to the cure.'),
);

const cured = drive('drive5.scratch-cured', `../unit-464reach-2026-10-31/${CURED}`);

console.log('\n--- P5: the SAME tuple, SAME cwd, one character class changed');
for (const a of ANCHORS) {
  const u = lineOf(uncured, a);
  const c = lineOf(cured, a);
  console.log(`P5LINE ${u === c ? 'same   ' : 'MOVED  '} ${a}`);
  if (u !== c) {
    console.log(`         uncured: ${u}`);
    console.log(`         cured:   ${c}`);
  }
}
const typedCured = lineOf(cured, 'GTYPEDDEF');
const red = /^GTYPEDDEF RED/.test(typedCured);
console.log(
  `P5 ${!p6 ? 'WITHDRAWN' : red ? 'LANDS' : 'REFUTED'} — GTYPEDDEF on his authored green cell under ` +
    `the cured boundary is ${red ? 'RED' : 'NOT red'}.` +
    (p6
      ? red
        ? " His §4 expectation holds on his own map: the cure reddens the cell he filed as its green."
        : ' His §4 expectation does NOT hold on his own map, and neither does mine.'
      : ' Not attributable — see P6.'),
);
