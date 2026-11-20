#!/usr/bin/env node
/**
 * **Two-sided cripple of the dead-marker report's key, on a relocated scratch copy. The tracked
 * gate is never edited.** (`unit-484popnarrow` §8's discipline; a cripple's restore-from-HEAD
 * discards an uncommitted cure, so there is nothing to restore here by construction.)
 *
 * Why two sides, pre-registered as P5: side (a) alone is satisfied by a reader that is simply
 * DEAD. A dead-marker count of 0 cannot be told apart from a reader that never ran — this corpus's
 * zero-valued-fixture lesson — so (b) drives the key the other way and requires the count to
 * saturate at a figure computed from the same run's own printed totals.
 *
 * ## The relocation, and why it needs its own control
 *
 * The gate computes `ROOT = resolve(HERE, '..')` and `BASELINE = join(HERE, '…baseline')`. A scratch
 * copy under a per-unit `scratch` directory would make ROOT the UNIT directory, so `git -C ROOT
 * ls-files` would list a handful of files and every cell would refuse — *a scratch copy at the wrong
 * depth refuses every cell*. So the copy lives in `.scratch/` (gitignored, root line 38), a DIRECT
 * child of the repo root, where `resolve(HERE,'..')` is the repo root exactly as for `scripts/`.
 *
 * Two consequences handled rather than assumed:
 *  - the baseline is copied next to it, because `BASELINE` is `HERE`-relative;
 *  - the `./lib/strip-source.mjs` import is rewritten to the absolute path of the TRACKED module,
 *    so the reading under test is the real one and not a copy that can drift.
 *
 * **That rewrite is an edit, so arm CONTROL runs the relocated copy UNCRIPPLED and requires it to
 * reproduce the tracked gate's four figures exactly.** Without it, the cripple grades the
 * relocation. The control is the KP for the harness, not for the key.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = join(ROOT, '.scratch');

const TRACKED_SRC = readFileSync(GATE, 'utf8');
// The exact tracked line, asserted present so a rename upstream fails loudly instead of producing
// an uncrippled "cripple" that passes. A declared cripple no hook reads makes every crippled
// control clean.
const KEY_LINE = "const MARKER = /brace-slicer-deliberate:\\s*\\S+/;";
if (!TRACKED_SRC.includes(KEY_LINE)) {
  console.error(`BLOCKED — the key line this cripple rewrites is not present verbatim in ${GATE}.`);
  console.error('  Expected: ' + KEY_LINE);
  process.exit(2);
}
const IMPORT_LINE = "import { blankLongStrings } from './lib/strip-source.mjs';";
if (!TRACKED_SRC.includes(IMPORT_LINE)) {
  console.error('BLOCKED — the strip-source import is not present verbatim; relocation would fail.');
  process.exit(2);
}

/** @param {string} replacement  the `const MARKER = …;` line to substitute, or null for control */
function drive(name, replacement) {
  mkdirSync(SCRATCH, { recursive: true });
  let src = TRACKED_SRC.replace(
    IMPORT_LINE,
    `import { blankLongStrings } from ${JSON.stringify(join(ROOT, 'scripts/lib/strip-source.mjs'))};`,
  );
  if (replacement) src = src.replace(KEY_LINE, replacement);
  const copy = join(SCRATCH, 'crippled-gate.mjs');
  writeFileSync(copy, src);
  writeFileSync(
    join(SCRATCH, 'decl-body-slicers.baseline'),
    readFileSync(join(ROOT, 'scripts/decl-body-slicers.baseline'), 'utf8'),
  );
  const r = spawnSync('node', [copy], { encoding: 'utf8', cwd: ROOT });
  const out = (r.stdout || '') + (r.stderr || '');
  rmSync(copy, { force: true });

  // Read figures off the printed output with START-ANCHORED keys. Theseus's `unit-486markerstale`
  // §5: his control leg read `/GUARDED\s+(\d+)/` and it matched inside `UNGUARDED  58`, turning a
  // stable instrument into a reported `GUARDED 3 → 58` move. One verdict label is a suffix of
  // another, so every label key here is anchored with `^\s*` under `m`.
  const one = (rx) => { const m = out.match(rx); return m ? Number(m[1]) : null; };
  return {
    name,
    rc: r.status,
    trackedRead: one(/^\s*tracked files read: (\d+)/m),
    population: one(/^\s*population \(compares against both braces\): (\d+)/m),
    MARKED: one(/^\s*MARKED\s+(\d+)/m),
    GUARDED: one(/^\s*GUARDED\s+(\d+)/m),
    UNGUARDED: one(/^\s*UNGUARDED\s+(\d+)/m),
    deadFiles: one(/^\s*(\d+) tracked file\(s\), carrying/m),
    deadOcc: one(/carrying (\d+) marker occurrence\(s\)/),
    liveOcc: one(/carry\s+(\d+) occurrence\(s\) that ARE load-bearing/),
    out,
  };
}

const control = drive('CONTROL — relocated, uncrippled', null);
const dead = drive('(a) MARKER never matches', 'const MARKER = /(?!)/;');
const live = drive('(b) MARKER matches every file', 'const MARKER = /^/;');

const rows = [control, dead, live];
console.log('cripple-dead-marker-key — two-sided, on a relocated .scratch copy\n');
for (const r of rows) {
  console.log(`  ${r.name}`);
  console.log(`      rc=${r.rc} · trackedRead=${r.trackedRead} · population=${r.population}`
    + ` · UNGUARDED=${r.UNGUARDED} · MARKED=${r.MARKED} · GUARDED=${r.GUARDED}`
    + ` · deadFiles=${r.deadFiles} · deadOcc=${r.deadOcc} · liveOcc=${r.liveOcc}`);
}

/* ------------------------------------------------------------------ the assertions */
const checks = [];
const eq = (label, got, want) => checks.push([label, got === want, `got ${got}, want ${want}`]);

// CONTROL: the relocation is neutral. Figures taken from the tracked gate's own live run, not typed.
const liveGate = spawnSync('node', [GATE], { encoding: 'utf8', cwd: ROOT });
const lg = (rx) => { const m = ((liveGate.stdout || '') + (liveGate.stderr || '')).match(rx); return m ? Number(m[1]) : null; };
const tracked4 = {
  population: lg(/^\s*population \(compares against both braces\): (\d+)/m),
  MARKED: lg(/^\s*MARKED\s+(\d+)/m),
  deadFiles: lg(/^\s*(\d+) tracked file\(s\), carrying/m),
  deadOcc: lg(/carrying (\d+) marker occurrence\(s\)/),
};
eq('CONTROL rc is the tracked gate\'s rc', control.rc, liveGate.status);
for (const k of Object.keys(tracked4)) {
  eq(`CONTROL ${k} reproduces the tracked gate`, control[k], tracked4[k]);
}

// (a) the key is what produces the report: kill it and BOTH marker classes empty.
eq('(a) deadFiles', dead.deadFiles, null);   // the whole block is suppressed when the set is empty
eq('(a) MARKED', dead.MARKED, null);          // and the MARKED verdict row disappears with it
eq('(a) population unchanged — the cripple hits the marker key, not membership',
  dead.population, control.population);
// The MARKED files do not vanish from the population; they are re-classified. That is the limb that
// proves (a) is not simply a dead run: a dead run would also move `population`.
eq('(a) the 4 former MARKED files land in the other two classes',
  (dead.UNGUARDED ?? 0) + (dead.GUARDED ?? 0),
  (control.UNGUARDED ?? 0) + (control.GUARDED ?? 0) + (control.MARKED ?? 0));

// (b) saturate it. Registered arithmetic, computed from THIS run's printed totals, not typed here:
//     classifiable = trackedRead − (SELF entries that have a code extension) = trackedRead − 1
//     deadFiles    = classifiable − population
const SELF_CODE_FILES = 1; // 'scripts/verify-decl-body-slicers.mjs'; the `.baseline` has no code ext
const classifiable = live.trackedRead - SELF_CODE_FILES;
eq('(b) MARKED saturates to the whole population', live.MARKED, live.population);
eq('(b) deadFiles = classifiable − population', live.deadFiles, classifiable - live.population);
eq('(b) deadOcc = deadFiles (one match per file under `/^/` without `m`)',
  live.deadOcc, live.deadFiles);
eq('(b) UNGUARDED and GUARDED are emptied', (live.UNGUARDED ?? 0) + (live.GUARDED ?? 0), 0);
eq('(b) population unchanged', live.population, control.population);

// The arithmetic tell from Theseus's §5, applied to my own numbers: two cells of a partition
// reading the same value is the cheapest check there is.
checks.push([
  'no two distinct printed cells of the CONTROL partition share a value by accident',
  new Set([control.UNGUARDED, control.MARKED, control.GUARDED].filter((n) => n !== null)).size === 3,
  `UNGUARDED=${control.UNGUARDED} MARKED=${control.MARKED} GUARDED=${control.GUARDED}`,
]);

console.log('');
let failed = 0;
for (const [label, ok, detail] of checks) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : ` — ${detail}`}`);
  if (!ok) failed++;
}
console.log(`\n  ${checks.length - failed} of ${checks.length} checks passed.`);
console.log(`  classifiable = trackedRead(${live.trackedRead}) − SELF-with-code-ext(${SELF_CODE_FILES})`
  + ` = ${classifiable}; ${classifiable} − population(${live.population}) = ${classifiable - live.population}`);
process.exit(failed ? 1 : 0);
