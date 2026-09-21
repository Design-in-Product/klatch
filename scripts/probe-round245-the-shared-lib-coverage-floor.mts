#!/usr/bin/env npx tsx
/**
 * Round 245 — which `scripts/lib` modules does `npm test` actually reach?
 *
 * ## Why this is a probe and not a note in a writeup
 *
 * The received claim, in my own Round 243 §8 and repeated in Theseus's Round 244 §9, was
 * *"`scripts/lib/*.mts` has no `npm test` coverage"* — two modules, no mechanism. Measured
 * instead of recalled, the directory held **13 modules, 5 of them covered**, and the covered ones
 * were covered by direct relative import from `packages/server/src/__tests__` — the mechanism was
 * in use in three test files and had been since Round 71. What was true was narrower than what
 * was said, and the part that was false was the part that mattered: that there was nothing to
 * build on.
 *
 * A number like that goes stale the moment someone adds a module. So the measurement is an
 * instrument, run on demand, rather than a figure in a document.
 *
 * ## The assertion, and why it is a floor rather than a pin
 *
 * Theseus, Round 244 §3: *"A two-sided control anchored on a live artifact is a pin. If the
 * artifact is the thing your finding asked someone to repair, the control is scheduled to break
 * on success."* A probe asserting "exactly these 7 of these 13 are covered" is that mistake —
 * covering a sixth module is the outcome this round wants, and it would turn the control red.
 *
 * So the recorded set is a **floor**: every module named in {@link COVERED_FLOOR} must still be
 * reachable from the suite. Adding coverage cannot redden it; removing coverage — deleting an
 * import, moving a test, renaming a module — is the only thing that can. Breaks on regression,
 * never on success.
 *
 * ## The walk
 *
 * `readdirSync` throughout, never a glob, and **recursive** — Round 244's finding was that the
 * staleness sweep's one-level `readdirSync` never descended into `scripts/lib` at all. The same
 * defect here would make every module report as uncovered, so the walk prints its own depth and
 * the arm below checks the population it found is the population on disk.
 *
 * Reachability is transitive: a lib module pulled in by a module pulled in by a test counts, which
 * is how `probe-corpus-sessions.mts` is reached through `mint-transcript.mts` as well as directly.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIB_DIR = join(ROOT, 'scripts', 'lib');

/**
 * Modules reachable from `npm test` as of Round 245 (2026-09-21), measured by this probe.
 * Add to this list when you add coverage; never remove from it to make a run go green.
 *
 * Round 247 added `probe-outcome.mts` — 8 / 13.
 */
const COVERED_FLOOR = [
  'marker-floor.mjs',
  'mint-transcript.mts',
  'opaque-container.mjs',
  'probe-corpus-sessions.mts',
  'probe-outcome.mts',
  'recall-call-kind.mjs',
  'recall-recogniser.mjs',
  'recall-tap.mjs',
];

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    // Round 247: a dot-prefixed file under `scripts/lib` is a mutation harness's working copy,
    // not a module. This probe's own Round 245 capability run reddened arm B at "14 vs 13"
    // against exactly such a file, and read it as a nested-module finding.
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Every module in `scripts/lib`, by directory read, at whatever depth it sits. */
const libFiles = walk(LIB_DIR)
  .map((p) => relative(LIB_DIR, p))
  .sort();

/** Every test file the two workspace vitest configs collect (`src/**‌/*.test.ts(x)`). */
const testFiles: string[] = [];
for (const ws of ['packages/server', 'packages/client']) {
  try {
    testFiles.push(...walk(join(ROOT, ws, 'src')).filter((p) => /\.test\.tsx?$/.test(p)));
  } catch {
    // A workspace without a src/ is not an error here; the arm below would notice an empty total.
  }
}

const IMPORT_RE = /(?:from|import)\s+['"]([^'"]+)['"]/g;

function tryResolve(spec: string, fromFile: string): string | null {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  // `.js` specifiers resolve to `.ts` sources under this repo's bundler resolution.
  const candidates = [
    base,
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    `${base}.mjs`,
    join(base, 'index.ts'),
  ];
  for (const c of candidates) {
    try {
      if (statSync(c).isFile()) return c;
    } catch {
      /* next candidate */
    }
  }
  return null;
}

const visited = new Set<string>();
const queue = [...testFiles];
const importers = new Map<string, Set<string>>();

while (queue.length) {
  const f = queue.shift()!;
  if (visited.has(f)) continue;
  visited.add(f);
  let src: string;
  try {
    src = readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  for (const m of src.matchAll(IMPORT_RE)) {
    const r = tryResolve(m[1], f);
    if (!r) continue;
    if (r.startsWith(LIB_DIR)) {
      const name = relative(LIB_DIR, r);
      if (!importers.has(name)) importers.set(name, new Set());
      importers.get(name)!.add(relative(ROOT, f));
    }
    if (!visited.has(r)) queue.push(r);
  }
}

const covered = libFiles.filter((f) => importers.has(f));
const uncovered = libFiles.filter((f) => !importers.has(f));

console.log(`scripts/lib modules on disk (recursive readdirSync): ${libFiles.length}`);
console.log(`test files collected (server + client):              ${testFiles.length}`);
console.log(`source files visited transitively:                   ${visited.size}`);
console.log('');
for (const f of libFiles) {
  const who = importers.get(f);
  if (who) console.log(`  COVERED   ${f}  <- ${[...who].sort().join(', ')}`);
  else console.log(`  UNCOVERED ${f}`);
}
console.log('');
console.log(`covered ${covered.length} / ${libFiles.length}; uncovered ${uncovered.length}`);

const results: ProbeVerdict[] = [];

// [A] The floor. Breaks when coverage is LOST, never when it is gained.
const lost = COVERED_FLOOR.filter((f) => !importers.has(f));
results.push({
  arm: 'A',
  check: `every module covered at Round 245 is still reachable from the suite (${COVERED_FLOOR.length} recorded)`,
  pass: lost.length === 0,
  kind: 'regression',
});
if (lost.length) console.log(`[A] LOST coverage: ${lost.join(', ')}`);

// [B] The walk's own depth. A one-level walk of scripts/lib would still find every module today —
// the directory is flat — so this arm states the flatness rather than assuming it, and will notice
// the day someone nests one. Without it, arm A's denominator is "whatever the walk reached".
const oneLevel = readdirSync(LIB_DIR, { withFileTypes: true })
  .filter((e) => e.isFile() && !e.name.startsWith('.')).length;
results.push({
  arm: 'B',
  check: `the recursive walk and a one-level read agree (${libFiles.length} vs ${oneLevel}) — scripts/lib is flat today`,
  pass: libFiles.length === oneLevel,
  kind: 'regression',
});

// [C] The instrument found tests at all. An empty test population would make every module report
// as uncovered and arm A would go red for the wrong reason — a red that says "coverage lost" when
// what happened is "the walker broke" is the failure this repo keeps re-finding.
results.push({
  arm: 'C',
  check: `the test walk found test files (${testFiles.length}) and reached beyond them (${visited.size} visited)`,
  pass: testFiles.length > 0 && visited.size > testFiles.length,
  kind: 'regression',
});

// [D] Measurement, not a check: the standing uncovered list, for whoever takes the next one.
results.push({
  arm: 'D',
  check: `uncovered: ${uncovered.length ? uncovered.join(', ') : 'none'}`,
  pass: true,
  kind: 'measurement',
});

summariseAndExit({ probeName: 'probe-round245-the-shared-lib-coverage-floor', results });
