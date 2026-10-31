#!/usr/bin/env node
// drive.mjs — unit-464absorb, 2026-10-31 WORK fire (Daedalus).
//
// Drives the INSTRUMENTED scratch copy over the same cell the committed recording was made
// on, with `cwd` pinned to that cell's unit dir so every `--map`/`--clean`/`--arm`/`--control`
// path resolves exactly as it did for `unit-464authored-2026-10-31/drive1.out`.
//
// The arm tuple is SLICED out of that unit's committed `drive.mjs` rather than retyped — a
// hand-typed argv is not a slice, and a retyped tuple that drifts reads as a disagreement
// about the cure. The slice is gated: each of the four argv shapes must be found exactly once.
//
// stdout and stderr are captured SEPARATELY with the child's `stdio` PINNED, so a 0-byte
// `.err` is a property of the child and not of the capture.
//
// Nothing here drives or edits the live checker or the cell. Every path written is under
// this unit directory.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const CELL_DIR = resolve(HERE, '../unit-464authored-2026-10-31');
const CELL_DRIVE = resolve(CELL_DIR, 'drive.mjs');
const SCRATCH = '../unit-464absorb-2026-10-31/grade-filed-maps.INSTRUMENTED.mjs';
const COMMITTED = resolve(CELL_DIR, 'drive1.out');

// --- The argv, SLICED from the cell's own committed drive. Each pattern must hit once.
const cellSrc = readFileSync(CELL_DRIVE, 'utf8');
const sliceOnce = (tag, re) => {
  const hits = [...cellSrc.matchAll(re)];
  if (hits.length !== 1) {
    console.error(`FATAL slice ${tag}: ${hits.length} hit(s), need exactly 1`);
    process.exit(2);
  }
  return hits[0][1];
};
const T = sliceOnce('T', /^const T = '([^']+)';/gm);
const D = sliceOnce('D', /^const D = '([^']+)';/gm);
const ARM_TPL = sliceOnce('ARM', /^const ARM = `([^`]+)`;/gm);
const CLEAN_TPL = sliceOnce('CLEAN', /^const CLEAN = `([^`]+)`;/gm);
const CONTROL_TPL = sliceOnce('CONTROL', /^const CONTROL = \[([^\]]+)\];/gm);

const fill = (s) => s.replaceAll('${T}', T).replaceAll('${D}', D);
const ARM = fill(ARM_TPL);
const CLEAN = fill(CLEAN_TPL);
const CONTROL = [...CONTROL_TPL.matchAll(/`([^`]+)`/g)].map((m) => fill(m[1]));
if (CONTROL.length !== 2) {
  console.error(`FATAL CONTROL slice gave ${CONTROL.length} member(s), need 2`);
  process.exit(2);
}
const ARGV = ['--map=V22-MAP.md', CLEAN, ARM, ...CONTROL];
console.log('SLICE  argv sliced from the cell\'s own committed drive.mjs, not retyped:');
for (const a of ARGV) console.log(`         ${a}`);
console.log('');

const run = (tag, env) => {
  const dump = resolve(HERE, `${tag}.absorb.json`);
  const r = spawnSync('node', [SCRATCH, ...ARGV], {
    cwd: CELL_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, ABSORB_DUMP: dump, ...env },
  });
  const outPath = resolve(HERE, `${tag}.out`);
  const errPath = resolve(HERE, `${tag}.err`);
  writeFileSync(outPath, r.stdout ?? '');
  writeFileSync(errPath, r.stderr ?? '');
  console.log(
    `--- ${tag.padEnd(24)} boundary=${(env.ABSORB_BOUNDARY ?? 'live').padEnd(5)} ` +
      `cripple=${(env.ABSORB_CRIPPLE ?? '(none)').padEnd(18)} exit=${r.status} ` +
      `out=${statSync(outPath).size}B err=${statSync(errPath).size}B`,
  );
  return { stdout: r.stdout ?? '', status: r.status, bytes: statSync(outPath).size };
};

const ARMS = {
  'a-live': { ABSORB_BOUNDARY: 'live', ABSORB_CRIPPLE: '' },
  'b-wide': { ABSORB_BOUNDARY: 'wide', ABSORB_CRIPPLE: '' },
  'c-dead': { ABSORB_BOUNDARY: 'dead', ABSORB_CRIPPLE: '' },
  // Each cripple is driven at BOTH boundaries, so it is graded as a delta against a matched
  // same-boundary drive and never against a different boundary.
  'd-live-ownempty': { ABSORB_BOUNDARY: 'live', ABSORB_CRIPPLE: 'ownemits-empty' },
  'e-wide-ownempty': { ABSORB_BOUNDARY: 'wide', ABSORB_CRIPPLE: 'ownemits-empty' },
  'f-live-ctxwhole': { ABSORB_BOUNDARY: 'live', ABSORB_CRIPPLE: 'ctx-whole-section' },
  'g-wide-ctxwhole': { ABSORB_BOUNDARY: 'wide', ABSORB_CRIPPLE: 'ctx-whole-section' },
  'h-live-emitempty': { ABSORB_BOUNDARY: 'live', ABSORB_CRIPPLE: 'emitted-empty' },
  'i-wide-emitempty': { ABSORB_BOUNDARY: 'wide', ABSORB_CRIPPLE: 'emitted-empty' },
};

const got = {};
for (const [tag, env] of Object.entries(ARMS)) got[tag] = run(tag, env);

console.log('');
// --- P1a INERTNESS: the live arm must reproduce the committed recording byte for byte.
const committed = readFileSync(COMMITTED, 'utf8');
const inert = got['a-live'].stdout === committed;
// Both figures in BYTES. `String.length` is UTF-16 code units and this stdout carries §, —
// and ·, so printing one of each beside the other reads as a 39-byte disagreement under a
// line that says byte-identical=true. First drive did exactly that.
console.log(
  `P1a INERT   a-live vs committed ${COMMITTED.replace(/.*\/docs\//, 'docs/')}: ` +
    `byte-identical=${inert}  (${Buffer.byteLength(got['a-live'].stdout)}B vs ` +
    `${Buffer.byteLength(committed)}B; string lengths ${got['a-live'].stdout.length} vs ${committed.length})`,
);
// --- P1b REACHING: the dead arm must MOVE. Byte-identity at `wide` means nothing otherwise.
const reaching = got['c-dead'].stdout !== got['a-live'].stdout;
console.log(
  `P1b REACH   c-dead vs a-live: moved=${reaching}  (${got['c-dead'].bytes}B vs ${got['a-live'].bytes}B)`,
);
// --- The cure's own price on this cell, re-derived rather than inherited from his memo.
const diffLines = (x, y) => {
  const a = x.split('\n');
  const b = y.split('\n');
  let n = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) n += 1;
  return n;
};
console.log(
  `PRICE       b-wide vs a-live: ${diffLines(got['b-wide'].stdout, got['a-live'].stdout)} differing line(s)` +
    `  (${got['b-wide'].bytes}B vs ${got['a-live'].bytes}B)`,
);
console.log('');
for (const [tag, g] of Object.entries(got)) {
  const base = tag.includes('wide') ? 'b-wide' : tag === 'c-dead' ? 'c-dead' : 'a-live';
  if (tag === base) continue;
  console.log(
    `DELTA       ${tag.padEnd(18)} vs matched ${base.padEnd(8)} ` +
      `${diffLines(g.stdout, got[base].stdout)} differing line(s)`,
  );
}

// --- THE DECOMPOSITION ROW. The delta table above asks "does this cripple move the
// output" — which it does for all three, at both boundaries, and that is NOT the routed
// question. The routed question is whether the CURE's price is still zero once a route is
// removed. So: re-derive the cure's price INSIDE each cripple, same cripple on both arms,
// and compare against the uncrippled price. A route is LOAD-BEARING iff removing it makes
// the cure's price non-zero.
console.log('');
console.log('CUREPRICE   the cure (live -> wide) priced INSIDE each route, same cripple both arms:');
const PAIRS = [
  ['R-none (as shipped)', 'a-live', 'b-wide'],
  ['R-OWN removed', 'd-live-ownempty', 'e-wide-ownempty'],
  ['R-CTX removed', 'f-live-ctxwhole', 'g-wide-ctxwhole'],
  ['R-EMIT removed', 'h-live-emitempty', 'i-wide-emitempty'],
];
const curePrice = {};
for (const [label, lo, hi] of PAIRS) {
  const n = diffLines(got[lo].stdout, got[hi].stdout);
  curePrice[label] = n;
  console.log(
    `              ${label.padEnd(20)} ${String(n).padStart(3)} differing line(s)   ` +
      `${got[lo].bytes}B -> ${got[hi].bytes}B   ${n === 0 ? 'route NOT load-bearing' : 'LOAD-BEARING'}`,
  );
}

if (!inert || !reaching) {
  console.log('');
  console.log('GATE FAILED — the measurement is not offered. ' +
    `${!inert ? 'The instrumentation is NOT inert. ' : ''}${!reaching ? 'The scratch file is NOT the code run. ' : ''}`);
  process.exitCode = 1;
}
