#!/usr/bin/env node
// drive-kp.mjs — unit-464absorb, 2026-10-31 WORK fire (Daedalus).
//
// Drives the four KP arms and grades K1-K4 against PRE-REGISTRATION-2.md. The verdict is
// derived from the checker's OWN PRINTED LINES, parsed by the prefix the checker actually
// prints (`GTYPEDDEF`, not a guessed `GTYPED_DEF`), and a line that fails to parse REFUSES
// rather than counting as a pass — an instrument that cannot refuse manufactures findings.
//
// The maps are passed with `--map=<file>` resolved from this unit dir, so `MAP_PATH` differs
// from the committed recording's and the stdout is NOT expected to be byte-identical to it.
// The reaching and inertness gates for the scratch copy are in `drive.mjs`; this file does
// not re-assert them and does not pretend to.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const CELL_DIR = resolve(HERE, '../unit-464authored-2026-10-31');
const SCRATCH = '../unit-464absorb-2026-10-31/grade-filed-maps.INSTRUMENTED.mjs';

// argv sliced from the cell's committed drive, same gate as drive.mjs.
const cellSrc = readFileSync(resolve(CELL_DIR, 'drive.mjs'), 'utf8');
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
const fill = (s) => s.replaceAll('${T}', T).replaceAll('${D}', D);
const ARM = fill(sliceOnce('ARM', /^const ARM = `([^`]+)`;/gm));
const CLEAN = fill(sliceOnce('CLEAN', /^const CLEAN = `([^`]+)`;/gm));
const CONTROL = [...sliceOnce('CONTROL', /^const CONTROL = \[([^\]]+)\];/gm).matchAll(/`([^`]+)`/g)].map((m) => fill(m[1]));
if (CONTROL.length !== 2) {
  console.error(`FATAL CONTROL slice gave ${CONTROL.length} member(s), need 2`);
  process.exit(2);
}

const MAPS = {
  base: '../unit-464absorb-2026-10-31/../unit-464authored-2026-10-31/V22-MAP.md',
  kp: '../unit-464absorb-2026-10-31/KP-MISATTRIBUTED-MAP.md',
  ctl: '../unit-464absorb-2026-10-31/KP-ALIGNED-MAP.md',
};

const run = (tag, mapKey, boundary) => {
  const r = spawnSync('node', [SCRATCH, `--map=${MAPS[mapKey]}`, CLEAN, ARM, ...CONTROL], {
    cwd: CELL_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, ABSORB_BOUNDARY: boundary, ABSORB_CRIPPLE: '', ABSORB_DUMP: resolve(HERE, `${tag}.absorb.json`) },
  });
  const outPath = resolve(HERE, `${tag}.out`);
  writeFileSync(outPath, r.stdout ?? '');
  writeFileSync(resolve(HERE, `${tag}.err`), r.stderr ?? '');
  console.log(
    `--- ${tag.padEnd(16)} map=${mapKey.padEnd(5)} boundary=${boundary.padEnd(5)} exit=${r.status} ` +
      `out=${statSync(outPath).size}B err=${statSync(resolve(HERE, `${tag}.err`)).size}B`,
  );
  return { stdout: r.stdout ?? '', status: r.status };
};

const ARMS = {
  'kp0-base-live': ['base', 'live'],
  'kp0-base-wide': ['base', 'wide'],
  'kp1-mis-live': ['kp', 'live'],
  'kp2-mis-wide': ['kp', 'wide'],
  'kp3-ctl-live': ['ctl', 'live'],
  'kp4-ctl-wide': ['ctl', 'wide'],
};
const got = {};
for (const [tag, [m, b]] of Object.entries(ARMS)) got[tag] = run(tag, m, b);
console.log('');

// --- Readers over the checker's OWN printed lines. Each returns null on a parse failure,
// and null propagates to a REFUSAL, never to a pass.
const lineWith = (s, prefix) => s.split('\n').find((l) => l.startsWith(prefix)) ?? null;
const typedDef = (s) => {
  const l = lineWith(s, 'GTYPEDDEF ');
  if (l === null) return null;
  if (/^GTYPEDDEF ok /.test(l)) {
    const m = l.match(/(\d+) typed tokens across/);
    return m === null ? null : { ok: true, n: Number(m[1]), tokens: [] };
  }
  if (/^GTYPEDDEF RED /.test(l)) {
    const m = l.match(/(\d+) typed token\(s\) — quoted OF a member that never emits it: \[([^\]]*)\]/);
    return m === null ? null : { ok: false, n: Number(m[1]), tokens: m[2] === '' ? [] : m[2].split(',') };
  }
  return null;
};
// The completeness figures are printed inside the per-arm block. `grab` takes the FIRST
// occurrence, which is only a reader for a single-arm run — so the arm count is ASSERTED
// here rather than assumed, and a second arm makes this refuse instead of silently reading
// arm 1 and reporting it as the figure.
const figures = (s) => {
  const occurrences = (k) => (s.match(new RegExp(`${k}=`, 'g')) ?? []).length;
  if (occurrences('fullyNamed') !== 1 || occurrences('fullyCaptured') !== 1) {
    return { fullyNamed: null, fullyCaptured: null };
  }
  const grab = (k) => {
    const m = s.match(new RegExp(`${k}=(\\S+)`));
    return m === null ? null : m[1];
  };
  return { fullyNamed: grab('fullyNamed'), fullyCaptured: grab('fullyCaptured') };
};
const diffLines = (x, y) => {
  const a = x.split('\n');
  const b = y.split('\n');
  let n = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) n += 1;
  return n;
};

const problems = [];
const grade = (id, pred, verdict) => {
  const state = verdict === null ? 'REFUSED' : verdict ? 'LANDS' : 'REFUTED';
  if (verdict === null) problems.push(`${id} REFUSED — a figure could not be read off the checker's own output`);
  else if (!verdict) problems.push(`${id} REFUTED`);
  console.log(`${id.padEnd(4)} ${state.padEnd(8)} ${pred}`);
};

for (const [tag, g] of Object.entries(got)) {
  const t = typedDef(g.stdout);
  console.log(
    `GTYPEDDEF  ${tag.padEnd(16)} ` +
      (t === null ? 'UNREADABLE' : `${t.ok ? 'ok ' : 'RED'} n=${t.n} tokens=[${t.tokens.join(',')}]`),
  );
}
console.log('');

const tKpLive = typedDef(got['kp1-mis-live'].stdout);
const tKpWide = typedDef(got['kp2-mis-wide'].stdout);
const tCtlLive = typedDef(got['kp3-ctl-live'].stdout);
const tCtlWide = typedDef(got['kp4-ctl-wide'].stdout);

grade('K1', 'mis-attributed map at LIVE: GTYPEDDEF green, 0 typed tokens', tKpLive === null ? null : tKpLive.ok && tKpLive.n === 0);
grade(
  'K2',
  'mis-attributed map at WIDE: GTYPEDDEF RED, exactly 1 token, t2-dir-only:pinDistance',
  tKpWide === null ? null : !tKpWide.ok && tKpWide.n === 1 && tKpWide.tokens.length === 1 && tKpWide.tokens[0] === 't2-dir-only:pinDistance',
);
const ctlPrice = diffLines(got['kp3-ctl-live'].stdout, got['kp4-ctl-wide'].stdout);
const basePrice = diffLines(got['kp0-base-live'].stdout, got['kp0-base-wide'].stdout);
const kpPrice = diffLines(got['kp1-mis-live'].stdout, got['kp2-mis-wide'].stdout);
console.log('');
console.log(`CUREPRICE  base map   live->wide: ${basePrice} differing line(s)`);
console.log(`CUREPRICE  ALIGNED    live->wide: ${ctlPrice} differing line(s)   (control)`);
console.log(`CUREPRICE  MISATTRIB  live->wide: ${kpPrice} differing line(s)   (KP)`);
console.log('');
grade(
  'K3',
  `control (aligned) green at BOTH boundaries and cure price 0, matching the base map's ${basePrice}`,
  tCtlLive === null || tCtlWide === null ? null : tCtlLive.ok && tCtlWide.ok && ctlPrice === 0 && basePrice === 0,
);

// K4: nothing but the typed-token key moves. Compared per boundary against the base map.
const f = (tag) => figures(got[tag].stdout);
const k4rows = [
  ['kp1-mis-live', 'kp0-base-live'],
  ['kp2-mis-wide', 'kp0-base-wide'],
  ['kp3-ctl-live', 'kp0-base-live'],
  ['kp4-ctl-wide', 'kp0-base-wide'],
];
let k4 = true;
let k4readable = true;
for (const [x, base] of k4rows) {
  const a = f(x);
  const b = f(base);
  if (a.fullyNamed === null || b.fullyNamed === null || a.fullyCaptured === null || b.fullyCaptured === null) k4readable = false;
  const same = a.fullyNamed === b.fullyNamed && a.fullyCaptured === b.fullyCaptured;
  if (!same) k4 = false;
  console.log(
    `K4ROW      ${x.padEnd(16)} vs ${base.padEnd(16)} fullyNamed ${a.fullyNamed}/${b.fullyNamed} ` +
      `fullyCaptured ${a.fullyCaptured}/${b.fullyCaptured} -> ${same ? 'unchanged' : 'MOVED'}`,
  );
}
console.log('');
grade('K4', 'fullyNamed and fullyCaptured unchanged on both minted maps at both boundaries', k4readable ? k4 : null);

console.log('');
console.log(problems.length === 0 ? 'KPVERDICT/0 ok  4 of 4 predictions land' : `KPVERDICT/1 RED ${problems.length} problem(s):`);
for (const p of problems) console.log(`  - ${p}`);
if (problems.length > 0) process.exitCode = 1;
