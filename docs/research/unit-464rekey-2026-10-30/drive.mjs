#!/usr/bin/env node
// drive.mjs — unit-464rekey, 2026-10-30 STOP fire (Daedalus).
//
// Drives the three checker changes Theseus's §5 routed here, in his declared order. stdout
// and stderr are captured SEPARATELY and the child's `stdio` is pinned, so a 0-byte `.err`
// is a property of the child and not of the capture.
//
// Nothing here drives the CELL. Every recording read is already committed.

import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, statSync } from 'node:fs';

const CHECKER = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const T = '../unit-464t2b-sat-2026-10-29'; // clean + the six arm recordings
const D = '../unit-464t8-mapdecay-2026-10-29'; // the second no-cripple drive
const V = '../unit-464v21map-2026-10-30'; // Theseus's v2.1-authored map

// MAP-A — the map AUTHORED under v2.1. His drive1 argv, unchanged.
const MAPA = [
  `--map=${V}/V21-MAP.md`,
  `--clean=${T}/drive2.clean.out`,
  `--arm=t8-unpinned=${T}/drive-cripple-t8-unpinned.out`,
];

// MAP-B — the v1 map with a REAL typed-token defect (`pinned` where the cell prints
// `pinArmPinned`), the 2(b) defect this checker was built to catch. His drive4 argv.
const MAPB = [
  `--map=${T}/PRE-REGISTRATION.md`,
  `--clean=${T}/drive2.clean.out`,
  `--arm=t2b-sat-wrong-arm=${T}/drive-cripple-t2b-sat-wrong-arm.out`,
  `--arm=t2b-dir-pinned=${T}/drive-cripple-t2b-dir-pinned.out`,
  `--arm=t8-ceiling-blind=${T}/drive-cripple-t8-ceiling-blind.out`,
];

const HONEST = [`--control=${T}/drive2.clean.out`, `--control=${D}/drive1.clean.out`];
// The POISONED pair: the clean drive against THE ARM RECORDING ITSELF — Theseus's drive2.
const POISONED = [`--control=${T}/drive2.clean.out`, `--control=${T}/drive-cripple-t8-unpinned.out`];
// A recording from the WRONG INSTRUMENT FAMILY: a grade-filed-maps `.out`, which carries
// `cripple: none (clean arm)` about a different subject entirely. PRE-REGISTRATION D3/R12.
const FOREIGN = [`--control=${T}/drive2.clean.out`, `--control=${V}/drive1.v21map-honest-control.out`];

// MAP-A with every row's bolded subject span REMOVED, so the map declares no subjects and
// D2's union carries the whole key. Written by a scripted edit of the committed file, not
// by hand — a hand-typed fixture is not a slice of the population.
const proseSrc = readFileSync(`${V}/V21-MAP.md`, 'utf8');
const prose = proseSrc.replace(/^(\s*[-*+]\s+)\*\*`([^`]+)`\*\*/gm, '$1$2');
writeFileSync('V21-MAP.prose.md', prose);
const debolded = proseSrc.split('\n').filter((l, i) => l !== prose.split('\n')[i]).length;
console.log(`V21-MAP.prose.md written — ${debolded} row line(s) de-bolded`);
const MAPA_PROSE = [`--map=V21-MAP.prose.md`, ...MAPA.slice(1)];

// MAP-A with ONE substring neutralised: the `T9 moved=0` the T2 row quotes out of §3.3a's
// own worked example. Added AFTER the first drive round, which refuted R1 — the subject
// re-key cured `N` and moved `moved` onto T2, the row that actually quotes it, so
// GTYPEDDEF reddened MAP-A and the gate had no green cell anywhere in this population. A
// gate with no green cell has not been shown to discriminate. Scripted single substitution
// on the committed file, so what the gate is sensitive to is settled by a delta of two
// drives differing in one string.
const quoted = '`T9 moved=0`';
if (!proseSrc.includes(quoted)) {
  console.error(`FATAL: ${quoted} not present in V21-MAP.md — the drive15 counterfactual would be a no-op`);
  process.exit(2);
}
writeFileSync('V21-MAP.nomoved.md', proseSrc.replaceAll(quoted, 'T9 moved zero tokens'));
const MAPA_NOMOVED = [`--map=V21-MAP.nomoved.md`, ...MAPA.slice(1)];

/** @type {{name:string, args:string[], why:string}[]} */
const DRIVES = [
  // --- §2, on the map the defect was measured on.
  { name: 'drive1.mapA-honest', args: [...MAPA, ...HONEST], why: 'R1/R2/R9 — MAP-A post-fix; the matched no-cripple drive for drive2/3/4' },
  { name: 'drive2.mapA-subject-blind', args: [...MAPA, ...HONEST, '--cripple=subject-blind'], why: 'R3 — the pre-fix key restored; delta against drive1' },
  { name: 'drive3.mapA-subject-rows-only', args: [...MAPA, ...HONEST, '--cripple=subject-rows-only'], why: 'R4 — the union dropped; predicted VACUOUS on MAP-A' },
  { name: 'drive4.mapA-subject-bold-only', args: [...MAPA, ...HONEST, '--cripple=subject-bold-only'], why: 'D1 — bold-only parse on a map whose rows ARE bolded; predicted no change' },
  { name: 'drive5.mapA-prose', args: [...MAPA_PROSE, ...HONEST], why: 'R4/D2 — MAP-A with no declared subjects; the non-collapse proof as a delta, not an argument' },
  // --- §3, on the map that carries a real typed-token defect.
  { name: 'drive6.mapB-honest', args: [...MAPB, ...HONEST], why: 'R6/R7 — the known positive: `pinned` survives the re-key and GTYPEDDEF bites. Matched drive for 7/8/9' },
  { name: 'drive7.mapB-typed-ungated', args: [...MAPB, ...HONEST, '--cripple=typed-ungated'], why: 'R8 — the gate reports ok without reading; delta against drive6' },
  { name: 'drive8.mapB-subject-rows-only', args: [...MAPB, ...HONEST, '--cripple=subject-rows-only'], why: 'R4 — the union dropped on a map with no bolded rows' },
  { name: 'drive9.mapB-subject-bold-only', args: [...MAPB, ...HONEST, '--cripple=subject-bold-only'], why: 'R5 — is the unbolded half of the subject parse load-bearing?' },
  { name: 'drive10.mapB-subject-blind', args: [...MAPB, ...HONEST, '--cripple=subject-blind'], why: 'R5 control — the pre-fix key on MAP-B, to compare bold-only against' },
  // --- §4, on the argv whose published row this inverts.
  { name: 'drive11.mapA-poisoned', args: [...MAPA, ...POISONED], why: 'R10 — Theseus\'s drive2 argv; his row read MAPVERDICT/0 ok. Matched drive for drive12' },
  { name: 'drive12.mapA-poisoned-header-blind', args: [...MAPA, ...POISONED, '--cripple=control-header-blind'], why: 'R11 — provenance not read; delta against drive11' },
  { name: 'drive13.mapA-foreign-control', args: [...MAPA, ...FOREIGN], why: 'R12/D3 — a recording from the wrong instrument family as a control' },
  { name: 'drive14.mapA-crippled-clean', args: [`--map=${V}/V21-MAP.md`, `--clean=${T}/drive-cripple-t8-unpinned.out`, `--arm=t8-unpinned=${T}/drive-cripple-t8-unpinned.out`, ...HONEST], why: 'the clean-path leg of GCTRLPROV: an ARM recording passed as --clean' },
  // --- Added after round 1 refuted R1: does GTYPEDDEF have a GREEN cell in this population?
  { name: 'drive15.mapA-nomoved', args: [...MAPA_NOMOVED, ...HONEST], why: 'R1 follow-up — MAP-A with `T9 moved=0` neutralised; differs from drive1 in one quoted string' },
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
