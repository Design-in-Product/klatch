#!/usr/bin/env node
// Independent replication of Theseus's unit-492 §1 figure: the re-drive ceiling.
//
// Written from scratch rather than adapted from `arm-frozenredrive.mjs`, so that a
// disagreement is informative. Keys declared up front:
//
//   UNIT          a tracked directory immediately under docs/research/
//   FIRST(unit)    author date (--date=short) of the EARLIEST commit touching that directory
//   REDRIVE EVENT  a commit in which a path matching docs/research/<unit>/**.out has
//                  diff status M (modified) -- not A, not R, not D
//   GAP            days(event author date) - days(FIRST(unit))
//
// Reported: event count, histogram of GAP, max GAP, and the per-unit event list.
// Author dates throughout; no mtime is read anywhere (the wrapper re-syncs this
// worktree before every fire, which would make every directory look fresh).

import { execFileSync } from 'node:child_process';

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });

const unitOf = (p) => {
  const m = /^docs\/research\/([^/]+)\//.exec(p);
  return m ? m[1] : null;
};

// ---- Pass 1: FIRST(unit) for every unit, one reverse walk of the whole history.
const first = new Map();
{
  const log = git([
    'log', '--reverse', '--date=short', '--format=__C__%ad', '--name-only',
    '--', 'docs/research/',
  ]);
  let date = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('__C__')) { date = line.slice(5).trim(); continue; }
    if (!line.trim() || !date) continue;
    const u = unitOf(line.trim());
    if (u && !first.has(u)) first.set(u, date);
  }
}

// ---- Pass 2: M-events on .out files.
const events = [];
{
  const log = git([
    'log', '--date=short', '--format=__C__%H %ad', '--name-status',
    '--diff-filter=M', '--', 'docs/research/',
  ]);
  let sha = null, date = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('__C__')) {
      const [h, d] = line.slice(5).trim().split(/\s+/);
      sha = h; date = d;
      continue;
    }
    const t = line.trim();
    if (!t || !sha) continue;
    const parts = t.split('\t');
    if (parts[0] !== 'M') continue;
    const path = parts[parts.length - 1];
    if (!/\.out$/.test(path)) continue;
    const u = unitOf(path);
    if (!u) continue;
    events.push({ sha, date, unit: u, path, first: first.get(u) ?? null });
  }
}

const days = (a, b) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

// One event = one (commit, unit) pair; a commit modifying three .out files in one
// unit is ONE re-drive event, not three. Declared, because it is the obvious place
// for my count to diverge from a per-file key.
const seen = new Set();
const rows = [];
for (const e of events) {
  const k = `${e.sha}:${e.unit}`;
  if (seen.has(k)) continue;
  seen.add(k);
  rows.push({ ...e, gap: e.first ? days(e.first, e.date) : null });
}

const hist = new Map();
for (const r of rows) hist.set(r.gap, (hist.get(r.gap) ?? 0) + 1);

const instrumented = new Set();
{
  const tracked = git(['ls-files', 'docs/research/']).split('\n');
  for (const p of tracked) if (/\.out$/.test(p)) { const u = unitOf(p); if (u) instrumented.add(u); }
}

console.log('=== unit-493 ceiling replication (Daedalus, independent key) ===');
console.log(`tracked unit directories        : ${new Set(git(['ls-files', 'docs/research/']).split('\n').map(unitOf).filter(Boolean)).size}`);
console.log(`instrumented units (>=1 .out)   : ${instrumented.size}`);
console.log(`M-on-.out events (commit,unit)  : ${rows.length}`);
console.log(`M-on-.out file-level rows        : ${events.length}`);
console.log('');
console.log('GAP histogram (days from unit FIRST commit):');
for (const gap of [...hist.keys()].sort((a, b) => a - b)) {
  console.log(`  +${String(gap).padStart(2)}d  ${'#'.repeat(hist.get(gap))} ${hist.get(gap)}`);
}
const maxGap = rows.reduce((m, r) => (r.gap > m ? r.gap : m), -1);
console.log('');
console.log(`MAX GAP at which any .out has been rewritten: +${maxGap}d`);
console.log('');
console.log('events beyond +0d:');
for (const r of rows.filter((r) => r.gap > 0).sort((a, b) => b.gap - a.gap)) {
  console.log(`  +${r.gap}d  ${r.sha.slice(0, 8)}  ${r.unit}  first=${r.first} at=${r.date}`);
}
