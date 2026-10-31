#!/usr/bin/env node
// drive.mjs — unit-464authored, 2026-10-31 START fire (Daedalus).
//
// Drives `grade-filed-maps.mjs` over a map AUTHORED under CRIPPLE-MAP-CONVENTION v2.2,
// including §3.4b, for an arm no filed map has covered before (`t2-dir-only`).
//
// stdout and stderr are captured SEPARATELY and the child's `stdio` is PINNED, so a
// 0-byte `.err` is a property of the child and not of the capture. (execFileSync echoes
// child stderr into the parent's stream if you let it.)
//
// Nothing here drives the CELL. Every recording read is already committed.

import { spawnSync } from 'node:child_process';
import { writeFileSync, statSync } from 'node:fs';

const CHECKER = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const T = '../unit-464t2b-sat-2026-10-29'; // clean + the six arm recordings
const D = '../unit-464t8-mapdecay-2026-10-29'; // the second no-cripple drive

const ARM = `--arm=t2-dir-only=${T}/drive-cripple-t2-dir-only.out`;
const CLEAN = `--clean=${T}/drive2.clean.out`;
// The HONEST control pair: two independently-produced no-cripple drives of the same cell.
const CONTROL = [`--control=${T}/drive2.clean.out`, `--control=${D}/drive1.clean.out`];

const run = (tag, argv) => {
  const r = spawnSync('node', [CHECKER, ...argv], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  writeFileSync(`${tag}.out`, r.stdout ?? '');
  writeFileSync(`${tag}.err`, r.stderr ?? '');
  const errBytes = statSync(`${tag}.err`).size;
  const line = (re) => (r.stdout ?? '').split('\n').find((l) => re.test(l)) ?? '(absent)';
  console.log(`--- ${tag}  exit=${r.status}  err=${errBytes}B`);
  console.log(`    ${line(/^MAPVERDICT/)}`);
  console.log(`    ${line(/^GTYPEDDEF/)}`);
  console.log(`    ${line(/^GSUBJ/)}`);
  return { status: r.status, stdout: r.stdout ?? '', errBytes };
};

const DRIVES = {
  // PROBE: the rowless map, read ONLY for its printed per-arm `reached=` figures. It
  // scores badly by construction; see the file's own header.
  probe0: ['--map=PROBE-MAP-rowless.md', CLEAN, ARM, ...CONTROL],
  // The authored map, honest key. This is the cell §3.4b is being priced on.
  drive1: ['--map=V22-MAP.md', CLEAN, ARM, ...CONTROL],
  // KEY cripple: the pre-fix `mentions()`. GSUBJ leg A must RED here, and this is the
  // counterfactual my own 10-30 §7 said GSUBJ leg A did not have on any map but Theseus's.
  drive2: ['--map=V22-MAP.md', CLEAN, ARM, ...CONTROL, '--cripple=subject-blind'],
  // KEY cripple: declared rows only, no union. GSUBJ leg B's arm.
  drive3: ['--map=V22-MAP.md', CLEAN, ARM, ...CONTROL, '--cripple=subject-rows-only'],
  // SUBJECT cripple: GTYPEDDEF stops reading the figure. Grades that drive1's green is
  // the gate's and not a constant.
  drive4: ['--map=V22-MAP.md', CLEAN, ARM, ...CONTROL, '--cripple=typed-ungated'],
  // Determinism: drive1 again, byte-compared below.
  drive5: ['--map=V22-MAP.md', CLEAN, ARM, ...CONTROL],
};

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const want = only.length === 0 ? Object.keys(DRIVES) : only;
const results = {};
for (const tag of want) {
  if (DRIVES[tag] === undefined) {
    console.error(`unknown drive ${tag}; known: ${Object.keys(DRIVES).join(', ')}`);
    process.exit(2);
  }
  results[tag] = run(tag, DRIVES[tag]);
}

if (results.drive1 !== undefined && results.drive5 !== undefined) {
  const same = results.drive1.stdout === results.drive5.stdout;
  console.log(`DETERMINISM drive1 vs drive5 byte-identical=${same}`);
  if (!same) process.exitCode = 1;
}
