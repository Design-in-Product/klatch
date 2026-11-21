#!/usr/bin/env node
// Reconciliation of the two places my replication's numbers differ from
// unit-492 RESULTS.md, so that neither is left as an unexplained disagreement.
//
//   A. instrumented units: mine 191, Theseus 190.
//      Hypothesis: unit-492frozenredrive became instrumented when ITS OWN drive
//      artefacts committed (b14db238), which is after his census ran.
//      Test: the instrumented set at b14db238^ should be 190 and should not
//      contain unit-492frozenredrive; at HEAD it should be 191 and contain it.
//
//   B. event count: mine 32, his 48.
//      Hypothesis: his key is file-level, mine is (commit, unit)-level.
//      Test: my file-level row count is 48 exactly, and 48 - 32 = 16 rows are
//      additional files inside a commit that already counted for that unit.

import { execFileSync } from 'node:child_process';
const git = (a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const unitOf = (p) => (/^docs\/research\/([^/]+)\//.exec(p) ?? [])[1] ?? null;

const instrumentedAt = (rev) => {
  const s = new Set();
  for (const p of git(['ls-tree', '-r', '--name-only', rev, 'docs/research/']).split('\n')) {
    if (/\.out$/.test(p)) { const u = unitOf(p); if (u) s.add(u); }
  }
  return s;
};

const before = instrumentedAt('b14db238^');
const now = instrumentedAt('HEAD');

console.log('=== A. instrumented-unit gap ===');
console.log(`instrumented at b14db238^ (pre Theseus RESULTS commit): ${before.size}`);
console.log(`instrumented at HEAD                                  : ${now.size}`);
console.log(`unit-492frozenredrive instrumented before : ${before.has('unit-492frozenredrive-2026-11-20')}`);
console.log(`unit-492frozenredrive instrumented at HEAD: ${now.has('unit-492frozenredrive-2026-11-20')}`);
const added = [...now].filter((u) => !before.has(u));
console.log(`units that became instrumented in between: ${JSON.stringify(added)}`);

console.log('');
console.log('=== B. event-granularity gap ===');
const log = git(['log', '--date=short', '--format=__C__%H %ad', '--name-status', '--diff-filter=M', '--', 'docs/research/']);
let sha = null;
const fileRows = [];
for (const line of log.split('\n')) {
  if (line.startsWith('__C__')) { sha = line.slice(5).trim().split(/\s+/)[0]; continue; }
  const t = line.trim();
  if (!t || !sha) continue;
  const parts = t.split('\t');
  if (parts[0] !== 'M') continue;
  const path = parts[parts.length - 1];
  if (!/\.out$/.test(path) || !unitOf(path)) continue;
  fileRows.push({ sha, path, unit: unitOf(path) });
}
const pairs = new Set(fileRows.map((r) => `${r.sha}:${r.unit}`));
console.log(`file-level M-on-.out rows        : ${fileRows.length}`);
console.log(`distinct (commit, unit) pairs    : ${pairs.size}`);
console.log(`difference (same-commit siblings): ${fileRows.length - pairs.size}`);
const byPair = new Map();
for (const r of fileRows) byPair.set(`${r.sha}:${r.unit}`, (byPair.get(`${r.sha}:${r.unit}`) ?? 0) + 1);
console.log('commits rewriting >1 .out in one unit:');
for (const [k, n] of [...byPair].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n} files  ${k.slice(0, 8)}  ${k.split(':')[1]}`);
}
