#!/usr/bin/env node
// reaching-arm.mjs — unit-464reach, 2026-10-31 START fire (Theseus).
//
// `priceA` found the cured and uncured scratch copies BYTE-IDENTICAL on stdout. That is
// indistinguishable from "the cured file was never loaded": three identical runs read as
// "no effect" when all three are dead.
//
// So this is the REACHING arm. A third scratch copy gets a boundary that can match almost
// nothing (a private-use character that does not occur in any recording), which must MOVE
// the output if and only if the copied file is really the code being executed. The gate is
// on the DEAD arm MOVING, not on the cured arm standing still.
//
// If G3 lands, `priceA`'s byte-identity is a measurement. If G3 fails, `priceA` published
// nothing and says so.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const HIS_DIR = '../unit-464authored-2026-10-31';
const CHECKER_SRC = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const DEAD = 'grade-filed-maps.DEAD.mjs';
const BOUNDARY = '(?:^|\\s)';
// A private-use codepoint. It occurs in no recording and no map, so the only tokens the
// dead tokenizer can still reach are those at absolute line start.
const DEAD_BOUNDARY = '(?:\\uE000)';

const src = readFileSync(CHECKER_SRC, 'utf8');
const deadSrc = src.replace(BOUNDARY, DEAD_BOUNDARY);
writeFileSync(DEAD, deadSrc);
{
  const a = src.split('\n');
  const b = deadSrc.split('\n');
  const differing = a.map((l, i) => (l === b[i] ? -1 : i)).filter((i) => i !== -1);
  console.log(
    `DEADDIFF ${differing.length === 1 ? 'ok ' : 'FATAL'} ${differing.length} line(s) differ ` +
      `(line ${differing.map((i) => i + 1).join(',')})`,
  );
  if (differing.length !== 1) {
    console.log('FATAL — the dead cripple is not a one-line change; nothing published');
    process.exit(2);
  }
  console.log(`         +  ${b[differing[0]].trim()}`);
}

// Tuple sliced from his harness, same as priceA.
const hisDrive = readFileSync(`${HIS_DIR}/drive.mjs`, 'utf8');
const lines = hisDrive.split('\n');
const start = lines.findIndex((l) => l.startsWith('const CHECKER = '));
const end = lines.findIndex((l, i) => i > start && /^const CONTROL = \[/.test(l));
const constBlock = lines.slice(start, end + 1).join('\n');
const drive1Literal = (hisDrive.match(/^\s*drive1:\s*(\[[^\]]*\]),?\s*$/m) ?? [])[1];
// eslint-disable-next-line no-new-func
const argv = new Function(`"use strict";\n${constBlock}\nreturn ${drive1Literal};`)();

const r = spawnSync('node', [`../unit-464reach-2026-10-31/${DEAD}`, ...argv], {
  cwd: HIS_DIR,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 64 * 1024 * 1024,
});
writeFileSync('drive6.scratch-dead.out', r.stdout ?? '');
writeFileSync('drive6.scratch-dead.err', r.stderr ?? '');
console.log(
  `--- drive6.scratch-dead  exit=${r.status}  err=${statSync('drive6.scratch-dead.err').size}B`,
);

const uncured = readFileSync('drive4.scratch-uncured.out', 'utf8');
const cured = readFileSync('drive5.scratch-cured.out', 'utf8');
const dead = r.stdout ?? '';

const moved = dead !== uncured;
console.log(
  `\nG3 ${moved ? 'ok ' : 'RED'} REACHING — the DEAD copy's stdout ${moved ? 'MOVES' : 'does NOT move'} ` +
    `against the uncured copy (${dead.length}B vs ${uncured.length}B). ` +
    (moved
      ? 'The scratch file IS the code being executed, so byte-identity between the cured and uncured arms is a RESULT.'
      : 'The scratch copies are NOT being executed; priceA published nothing and P5/P6 stay UNMEASURED.'),
);
if (moved) {
  const ul = uncured.split('\n');
  const dl = dead.split('\n');
  let shown = 0;
  for (let i = 0; i < Math.max(ul.length, dl.length) && shown < 6; i += 1) {
    if (ul[i] !== dl[i]) {
      console.log(`   U: ${ul[i] ?? '(none)'}`);
      console.log(`   D: ${dl[i] ?? '(none)'}`);
      shown += 1;
    }
  }
}
console.log(
  `\nP5RESTATED — cured vs uncured byte-identical: ${cured === uncured}; dead vs uncured moved: ${moved}. ` +
    (cured === uncured && moved
      ? 'GTYPEDDEF on V22-MAP.md is GREEN under the cured boundary, and the whole 59-line stdout is ' +
        "unchanged. Daedalus's §4 expectation that the cure reddens every filed map does NOT hold on " +
        'the one map it has now been driven against — his own.'
      : 'no restatement is warranted.'),
);
