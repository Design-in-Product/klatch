#!/usr/bin/env node
// xcheck-his-drive1.mjs — unit-464nomoved, 2026-10-30 STOP fire (Theseus).
//
// Does my drive1 reproduce HIS drive1? Same checker, same clean/arm/control argv, same map
// CONTENT — but his `--map=` pointed at the working-tree file and mine at a copy extracted
// from git at baseline.rev, and his cwd was his unit dir and mine is mine.
//
// Both recordings are committed in this tree, so this reads his file, it does not re-drive it.
// Anchors are sliced from both .out files; nothing is re-typed. An anchor absent from either
// side REFUSES rather than comparing equal.

import { readFileSync, writeFileSync } from 'node:fs';

// Recorded as well as printed: a self-test whose result lives only in a terminal is not an
// artifact, and this one's verdict is cited in RESULTS.md.
/** @type {string[]} */
const LOG = [];
const say = (/** @type {string} */ s) => {
  LOG.push(s);
  process.stdout.write(`${s}\n`);
};

const MINE = 'drive1.baseline.out';
const HIS = '../unit-464rekey-2026-10-30/drive1.mapA-honest.out';

const ANCHORS = {
  summary: /^\s*reached=.*$/m,
  underReportedRaw: /^\s*underReported=\[.*$/m,
  underReportedArm: /^\s*underReportedArmCaused=\[.*$/m,
  subjectKey: /^\s*subject key: .*$/m,
  GTYPED: /^GTYPED .*$/m,
  GTYPEDDEF: /^GTYPEDDEF .*$/m,
  GRADE: /^GRADE .*$/m,
  GRADEA: /^GRADEA .*$/m,
  TYPED: /^TYPED .*$/m,
  GCONF: /^GCONF .*$/m,
  MAPVERDICT: /^MAPVERDICT\/.*$/m,
};

function figures(path) {
  const txt = readFileSync(path, 'utf8');
  /** @type {Record<string, string|null>} */
  const out = {};
  for (const [k, re] of Object.entries(ANCHORS)) {
    const m = txt.match(re);
    out[k] = m === null ? null : m[0].trim();
  }
  return out;
}

const mine = figures(MINE);
const his = figures(HIS);

let agree = 0;
let differ = 0;
let refused = 0;
say(`=== ${MINE}  vs  ${HIS} ===`);
for (const k of Object.keys(ANCHORS)) {
  const a = mine[k];
  const b = his[k];
  if (a === null || b === null) {
    refused++;
    say(`REFUSED ${k.padEnd(18)} mine=${a === null ? 'ANCHOR-ABSENT' : 'present'} his=${b === null ? 'ANCHOR-ABSENT' : 'present'}`);
  } else if (a === b) {
    agree++;
    say(`AGREE   ${k.padEnd(18)} ${a}`);
  } else {
    differ++;
    say(`DIFFER  ${k.padEnd(18)}`);
    say(`   mine ${a}`);
    say(`   his  ${b}`);
  }
}
const n = Object.keys(ANCHORS).length;
say(`XCHECK  agree=${agree}/${n} differ=${differ} refused=${refused}`);
say(differ === 0 && refused === 0
  ? 'VERDICT REPRODUCES — his drive1 figures hold under my argv on the git-pinned subject'
  : 'VERDICT DOES NOT REPRODUCE — a figure or an anchor moved; the delta unit is confounded');
writeFileSync('xcheck-his-drive1.out', `${LOG.join('\n')}\n`);
process.exit(differ === 0 && refused === 0 ? 0 : 1);
