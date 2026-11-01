#!/usr/bin/env node
// inspect-dump.mjs — unit-464vac. One trial drive, to learn the dump's SHAPE before the
// measurement instrument assumes one. Writes only under this unit's directory.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, basename, resolve } from 'node:path';

const HERE = resolve('.');
const sat = JSON.parse(readFileSync('../unit-464sat-2026-10-31/sat.json', 'utf8'));
const CHECKER = resolve('../unit-464absorb-2026-10-31/grade-filed-maps.INSTRUMENTED.mjs');

// The 3-arm cell is the one worth inspecting: grouping only matters there.
const cell = sat.results.find((r) => r.argv.filter((t) => t.startsWith('--arm=')).length === 3);
const dump = `${HERE}/inspect.dump.json`;
const r = spawnSync('node', [CHECKER, ...cell.argv], {
  cwd: resolve('../../..', dirname(cell.map)),
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, ABSORB_DUMP: dump, ABSORB_BOUNDARY: 'live' },
  maxBuffer: 64 * 1024 * 1024,
});
writeFileSync(`${HERE}/inspect.out`, r.stdout ?? '');
writeFileSync(`${HERE}/inspect.err`, r.stderr ?? '');
console.log(`cell ${basename(cell.map)} / ${cell.arm}   rc=${r.status}   stderr=${(r.stderr ?? '').length}B`);
const j = JSON.parse(readFileSync(dump, 'utf8'));
console.log(`boundary=${j.boundary} cripple=${JSON.stringify(j.cripple)}`);
console.log(`arms=${j.arms.length}  rows=${j.rows.length}`);
console.log(`arm keys: ${Object.keys(j.arms[0]).join(',')}`);
j.arms.forEach((a, i) => console.log(`  arm[${i}] unmapped=${a.unmapped} secLines=${a.sectionLines} reached=${a.reached.length} emitted=${a.emitted.length} quoted=${a.quoted.length}`));
console.log(`row ids in order: ${j.rows.map((x) => x.id).join(',')}`);
console.log(`\n--- GTYPEDDEF / MAPVERDICT / TYPED from stdout ---`);
for (const l of (r.stdout ?? '').split('\n')) if (/^(GTYPEDDEF|MAPVERDICT|TYPED|ARMS|MEAS)/.test(l)) console.log(l);
