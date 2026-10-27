#!/usr/bin/env node
// Round 464 recon — what does Daedalus's proposed stop condition actually key on?
//
// His 2026-10-27 memo (§"Ask 1 — a stop condition, proposed rather than declared") proposes:
//
//   "The track continues while its rounds keep curing defects in surfaces that have a standing
//    gate (packages/, scripts/). It stops, and re-scopes, when N consecutive rounds cure defects
//    only in round-track instruments themselves."
//
// and reports as its "current value, same window": 8 scripts/ files and 4 census-population
// probes touched, "8 against 755".
//
// This recon does NOT grade. It establishes the population shapes the grading cell will need,
// because the proposal's key has two free variables his figure does not separate:
//   (a) the unit is a ROUND, but his figure counts FILES/COMMITS;
//   (b) a gated-surface commit may be round work or NON-round work (routed defects, Argus's
//       gate maintenance, Iris's UI work) and his number does not say which.
//
// Everything here reads git only. No writes outside this directory.

import { execFileSync } from 'node:child_process';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');

function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

const REV = git(['rev-parse', 'HEAD']).trim();
const SINCE = '2026-10-13';

console.log(`RECON/464 REV=${REV} SINCE=${SINCE}`);

// ---------------------------------------------------------------------------
// 1. Every commit in the window, with its author and its touched-path classes.
// ---------------------------------------------------------------------------
const SEP = '\u0001';
const raw = git([
  'log',
  `--since=${SINCE}`,
  `--format=${SEP}%H${SEP}%an${SEP}%ad${SEP}%s`,
  '--date=short',
  '--name-only',
]);

const commits = [];
for (const chunk of raw.split(SEP + '').slice(0)) {
  // handled below; split on record boundary instead
}

// Re-parse properly: records begin with SEP.
const records = raw.split('\n' + SEP).map((r, i) => (i === 0 ? r.replace(/^\u0001/, '') : r));
for (const rec of records) {
  if (!rec.trim()) continue;
  const lines = rec.split('\n');
  const head = lines[0].split(SEP);
  if (head.length < 4) continue;
  const [hash, author, date, ...subjParts] = head;
  const files = lines.slice(1).filter((l) => l.trim().length > 0);
  commits.push({ hash, author, date, subject: subjParts.join(SEP), files });
}

console.log(`COMMITS in window: ${commits.length}`);

const roundDirRe = /^docs\/research\/round(\d+)-/;
const gatedRe = /^(packages|scripts)\//;

let gatedCommits = 0;
let roundCommits = 0;
let bothCommits = 0;
const gatedByAuthor = new Map();
const gatedFiles = new Set();
const roundsSeen = new Set();

for (const c of commits) {
  const touchesGated = c.files.some((f) => gatedRe.test(f));
  const roundsInCommit = new Set();
  for (const f of c.files) {
    const m = roundDirRe.exec(f);
    if (m) roundsInCommit.add(Number(m[1]));
  }
  c.touchesGated = touchesGated;
  c.rounds = [...roundsInCommit].sort((a, b) => a - b);
  for (const r of c.rounds) roundsSeen.add(r);
  if (touchesGated) {
    gatedCommits++;
    for (const f of c.files) if (gatedRe.test(f)) gatedFiles.add(f);
    gatedByAuthor.set(c.author, (gatedByAuthor.get(c.author) ?? 0) + 1);
  }
  if (c.rounds.length > 0) roundCommits++;
  if (touchesGated && c.rounds.length > 0) bothCommits++;
}

console.log(`GATED commits (touch packages/ or scripts/): ${gatedCommits}`);
console.log(`ROUND commits (touch a docs/research/roundNNN- dir): ${roundCommits}`);
console.log(`BOTH in one commit: ${bothCommits}`);
console.log(`DISTINCT gated files touched: ${gatedFiles.size}`);
console.log(`DISTINCT rounds with a dir touched in window: ${roundsSeen.size}`);
console.log(
  `ROUND span in window: ${Math.min(...roundsSeen)}..${Math.max(...roundsSeen)}`
);
console.log(`GATED commits by author:`);
for (const [a, n] of [...gatedByAuthor].sort((x, y) => y[1] - x[1])) {
  console.log(`  ${n}\t${a}`);
}

console.log(`\nGATED files, listed (the population his "8" is a count of):`);
for (const f of [...gatedFiles].sort()) console.log(`  ${f}`);

console.log(`\nGATED commits, listed with their rounds (if any):`);
for (const c of commits.filter((x) => x.touchesGated)) {
  const rounds = c.rounds.length ? `rounds=[${c.rounds.join(',')}]` : 'rounds=NONE';
  console.log(`  ${c.hash.slice(0, 8)} ${c.date} ${c.author.padEnd(18)} ${rounds} :: ${c.subject.slice(0, 90)}`);
}
