#!/usr/bin/env node
// drive.mjs — unit-464v21map, 2026-10-30 WORK fire (Theseus).
//
// Drives the v2.1 checker against the first map AUTHORED under v2.1, and probes the
// control pair's unchecked provenance. stdout and stderr are captured SEPARATELY and the
// child's `stdio` is pinned, so a 0-byte `.err` is a property of the child and not of the
// capture (execFileSync otherwise echoes a child's stderr into the parent's recording).
//
// Nothing here drives the CELL. Every recording read is already committed.

import { spawnSync } from 'node:child_process';
import { writeFileSync, statSync } from 'node:fs';

const CHECKER = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const T = '../unit-464t2b-sat-2026-10-29'; // clean + the six arm recordings
const D = '../unit-464t8-mapdecay-2026-10-29'; // the second no-cripple drive

const MAP = [
  '--map=V21-MAP.md',
  `--clean=${T}/drive2.clean.out`,
  `--arm=t8-unpinned=${T}/drive-cripple-t8-unpinned.out`,
];

// The HONEST control pair: two no-cripple drives of the same cell, two authors, two revs.
const HONEST = [`--control=${T}/drive2.clean.out`, `--control=${D}/drive1.clean.out`];

// The POISONED pair: the clean drive against THE ARM RECORDING ITSELF. Not a no-cripple
// drive, and nothing in the checker reads provenance. drive2 differs from drive1 in this
// one argument and nothing else — the matched-delta method v2.1 §4 adopted.
const POISONED = [
  `--control=${T}/drive2.clean.out`,
  `--control=${T}/drive-cripple-t8-unpinned.out`,
];

// A map that DOES under-report, so the poisoned control has something to hide. The v1
// PRE-REGISTRATION map with its three mapped arms scored membership 5 + tokens 10 under the
// honest control (Daedalus, unit-464drift drive1). drive4/drive5 differ in --control only.
const V1MAP = [
  `--map=${T}/PRE-REGISTRATION.md`,
  `--clean=${T}/drive2.clean.out`,
  `--arm=t2b-sat-wrong-arm=${T}/drive-cripple-t2b-sat-wrong-arm.out`,
  `--arm=t2b-dir-pinned=${T}/drive-cripple-t2b-dir-pinned.out`,
  `--arm=t8-ceiling-blind=${T}/drive-cripple-t8-ceiling-blind.out`,
];

/** @type {{name:string, args:string[], why:string}[]} */
const DRIVES = [
  { name: 'drive1.v21map-honest-control', args: [...MAP, ...HONEST], why: 'A1-A5 — the measurement' },
  { name: 'drive2.v21map-poisoned-control', args: [...MAP, ...POISONED], why: 'B1-B4 — an arm recording passed as a control; differs from drive1 in --control only' },
  { name: 'drive3.v21map-no-control', args: [...MAP], why: 'the refusal shape for a MAPPED arm with rows (drive1/2 are both given a pair)' },
  { name: 'drive4.v1map-honest-control', args: [...V1MAP, ...HONEST], why: 'B3 baseline — a map that DOES under-report, honest control' },
  { name: 'drive5.v1map-poisoned-control', args: [...V1MAP, ...POISONED], why: 'B3 — the same map and arms, --control poisoned; differs from drive4 in --control only' },
];

for (const d of DRIVES) {
  const r = spawnSync('node', [CHECKER, ...d.args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const header = `# ${d.name}\n# why: ${d.why}\n# argv: ${d.args.join(' ')}\n# exit: ${r.status}\n`;
  writeFileSync(`${d.name}.out`, header + (r.stdout ?? ''));
  writeFileSync(`${d.name}.err`, r.stderr ?? '');
  console.log(
    `${d.name}  exit=${r.status}  out=${statSync(`${d.name}.out`).size}B  err=${statSync(`${d.name}.err`).size}B`,
  );
}
