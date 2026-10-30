#!/usr/bin/env node
// drive.mjs — unit-464drift, 2026-10-30 WORK fire (Daedalus).
//
// Drives the cured `grade-filed-maps.mjs` nine times and records each drive's stdout and
// stderr into SEPARATE files. `execFileSync` echoes a child's stderr into the parent's
// recording unless `stdio` is pinned, so it is pinned here and both streams are captured
// by hand; a `.err` that is 0 bytes is then a property of the child, not of the capture.
//
// Nothing in this unit re-drives the CELL. Every recording this reads is already
// committed; the control pair is two no-cripple cell drives from two earlier units at two
// different revs.

import { spawnSync } from 'node:child_process';
import { writeFileSync, statSync } from 'node:fs';

const CHECKER = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const T = '../unit-464t2b-sat-2026-10-29'; // Theseus's 10-29 unit: clean + six arms
const V2 = '../unit-464v2map-2026-10-30'; // Theseus's 10-30 unit: the first v2 map
const D = '../unit-464t8-mapdecay-2026-10-29'; // my 10-29 unit: clean + three re-drives
const T8 = '../unit-464t8-2026-10-29'; // my filed v1 maps

// The CONTROL PAIR. Two no-cripple drives of the same cell, different authors, different
// revs, different clock times. Neither is an arm.
const CONTROL = [`--control=${T}/drive2.clean.out`, `--control=${D}/drive1.clean.out`];

const SIX_ARMS = [
  `--arm=t2b-sat-wrong-arm=${T}/drive-cripple-t2b-sat-wrong-arm.out`,
  `--arm=t2b-dir-pinned=${T}/drive-cripple-t2b-dir-pinned.out`,
  `--arm=t8-ceiling-blind=${T}/drive-cripple-t8-ceiling-blind.out`,
  `--arm=t8-unpinned=${T}/drive-cripple-t8-unpinned.out`,
  `--arm=t9-insensitive-leg=${T}/drive-cripple-t9-insensitive-leg.out`,
  `--arm=t2-dir-only=${T}/drive-cripple-t2-dir-only.out`,
];

const MY_ARMS = [
  `--arm=t8-ceiling-blind=${D}/drive2.redrive-t8-ceiling-blind.out`,
  `--arm=t8-unpinned=${D}/drive3.redrive-t8-unpinned.out`,
  `--arm=t9-insensitive-leg=${D}/drive4.redrive-t9-insensitive-leg.out`,
];

const V2MAP = [
  `--map=${V2}/V2-MAP-t8-ceiling-blind-RETITLED.md`,
  `--clean=${T}/drive2.clean.out`,
  `--arm=t8-ceiling-blind=${T}/drive-cripple-t8-ceiling-blind.out`,
];
const V2MAP_STRIPPED = [
  `--map=${V2}/V2-MAP-t8-ceiling-blind-STAMP-STRIPPED.md`,
  `--clean=${T}/drive2.clean.out`,
  `--arm=t8-ceiling-blind=${T}/drive-cripple-t8-ceiling-blind.out`,
];
const HIS_V1 = [`--map=${T}/PRE-REGISTRATION.md`, `--clean=${T}/drive2.clean.out`];
const MY_V1 = [`--map=${T8}/cripple-maps-predicted.md`, `--clean=${D}/drive1.clean.out`];

/** @type {{name:string, args:string[], why:string}[]} */
const DRIVES = [
  // --- The measurement.
  { name: 'drive1.his-six-arms-with-control', args: [...HIS_V1, ...CONTROL, ...SIX_ARMS], why: 'P3, P4 — the six arms his §4 is about, drift excluded' },
  { name: 'drive2.v2map-with-control', args: [...V2MAP, ...CONTROL], why: 'P5, P6 — his first v2 map under the exclusion' },
  { name: 'drive3.v2map-stamp-stripped', args: [...V2MAP_STRIPPED, ...CONTROL], why: 'P7 — GMUST on the three previously-unread MUST fields' },
  { name: 'drive4.my-three-arms-with-control', args: [...MY_V1, ...CONTROL, ...MY_ARMS], why: 'corroboration — my recordings were produced in one clock window' },
  // --- The cripple arms, one per new gate.
  { name: 'drive5.cripple-drift-blind', args: [...HIS_V1, ...CONTROL, ...SIX_ARMS, '--cripple=drift-blind'], why: 'P8 — the pre-fix behaviour must redden GDRIFTB alone' },
  { name: 'drive6.cripple-control-fallback', args: [...HIS_V1, ...SIX_ARMS, '--cripple=control-fallback'], why: 'P9 — an absent control falling back to reached' },
  { name: 'drive7.cripple-conform-raw', args: [...V2MAP, ...CONTROL, '--cripple=conform-raw'], why: 'P10 — GCONFORM keyed raw instead of arm-caused' },
  { name: 'drive8.cripple-must-blind', args: [...V2MAP_STRIPPED, ...CONTROL, '--cripple=must-blind'], why: 'P11 — GMUST reporting OK without comparing' },
  // --- The refusal baseline: no control, no cripple. This is what every drive recorded
  // before this fire was, and it must now be an incomplete audit rather than a pass.
  { name: 'drive9.no-control-baseline', args: [...HIS_V1, ...SIX_ARMS], why: 'GCTRL — a drive with no control pair never looked at drift' },
];

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const rows = [];
for (const d of DRIVES) {
  if (only.length > 0 && !only.some((o) => d.name.includes(o))) continue;
  const r = spawnSync('node', [CHECKER, ...d.args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  writeFileSync(`${d.name}.out`, r.stdout ?? '');
  writeFileSync(`${d.name}.err`, r.stderr ?? '');
  const verdict = (r.stdout ?? '').split('\n').find((l) => l.startsWith('MAPVERDICT/')) ?? '(no MAPVERDICT line)';
  rows.push({ name: d.name, status: r.status, errBytes: statSync(`${d.name}.err`).size, verdict, why: d.why });
  console.log(`${d.name}  rc=${r.status}  err=${statSync(`${d.name}.err`).size}B`);
  console.log(`    ${verdict}`);
  console.log(`    (${d.why})`);
}
console.log('');
console.log(`DRIVES ${rows.length} recorded · non-empty .err: ${rows.filter((x) => x.errBytes > 0).length}`);
