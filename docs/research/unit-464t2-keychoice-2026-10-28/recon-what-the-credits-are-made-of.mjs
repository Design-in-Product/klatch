#!/usr/bin/env node
// recon-what-the-credits-are-made-of.mjs — Unit 464-T2-keychoice, 2026-10-28, Daedalus
//
// Theseus routed one decision here (his §8): which credit key the stop condition uses.
// Before choosing between his two keys, this recon reads what the credits are MADE OF.
//
// The condition is mine, and its own sentence is:
//
//   "The track continues while its rounds keep curing defects in surfaces that have a
//    standing gate (packages/, scripts/). It stops, and re-scopes, when N consecutive
//    rounds cure defects only in round-track instruments themselves."
//
// The clause after the comma names the stopping case as "round-track instruments
// themselves". The gate before it admits all of `scripts/`. `scripts/` is where this
// track's instruments live. So the two halves of my own sentence may not agree, and that
// is a question about the SURFACE predicate, not about Theseus's key.
//
// This file MEASURES, it does not grade. No verdict line, deliberately: it exists to
// print the per-edge gated file lists so the grader's surface key can be written against
// what is actually there rather than against my guess about what is there.
//
// The edge enumeration is written INDEPENDENTLY of his `grade-the-credit-key.mjs` so the
// grader can cross-check the two as member lists. Copying his reader would make the
// cross-check vacuous ("my copy of his key agreed with him" is not a measurement).

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const SINCE = '2026-10-13 00:00:00'; // absolute, per his design note 4 (a bare date is clock-keyed)
const SEP = '\u001f';

// `-C` pinned on every call: an unpinned git subcommand answers about whatever directory
// the process happens to be in.
function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const REV = git(['rev-parse', 'HEAD']).trim();
const GATED_RE = /^(packages|scripts)\//;
const ROUND_DIR_RE = /^docs\/research\/round(\d+)-/;
const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;

const raw = git(['log', `--since=${SINCE}`, '--name-only', `--format=%x00%H${SEP}%an${SEP}%cI${SEP}%s`]);
const commits = [];
for (const rec of raw.split('\u0000')) {
  if (!rec.trim()) continue;
  const lines = rec.split('\n');
  const [hash, author, date, ...subj] = lines[0].split(SEP);
  if (!hash) continue;
  const files = lines.slice(1).filter((l) => l.trim().length > 0);
  const rounds = new Set();
  for (const f of files) {
    const m = ROUND_DIR_RE.exec(f);
    if (m) rounds.add(Number(m[1]));
  }
  const sm = SUBJECT_ROUND_RE.exec(subj.join(SEP));
  commits.push({
    hash,
    author,
    date,
    subject: subj.join(SEP),
    files,
    gatedFiles: files.filter((f) => GATED_RE.test(f)),
    dirRounds: [...rounds].sort((a, b) => a - b),
    subjectRound: sm ? Number(sm[1]) : null,
  });
}

const roundDirs = readdirSync(`${REPO}/docs/research`)
  .map((d) => /^round(\d+)-instruments$/.exec(d))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .sort((a, b) => a - b);

console.log('=== RECON/464-T2-keychoice — what the credit edges are made of ===');
console.log(`REV ${REV}`);
console.log(`WINDOW --since=${JSON.stringify(SINCE)}`);
console.log(`CLOCK ${new Date().toISOString()}`);
console.log(`commits=${commits.length} gatedCommits=${commits.filter((c) => c.gatedFiles.length).length} roundDirs=${roundDirs.length}`);

const edges = [];
for (const c of commits) if (c.gatedFiles.length) for (const r of c.dirRounds) edges.push({ round: r, commit: c });
edges.sort((a, b) => a.round - b.round);

console.log(`\nCREDIT EDGES (commit touches round R's dir AND a gated file): ${edges.length}`);
for (const e of edges) {
  const c = e.commit;
  console.log(`\n  round ${e.round} ← ${c.hash.slice(0, 8)} ${c.author} ${c.date.slice(0, 16)}`);
  console.log(`    subject      : ${c.subject.slice(0, 110)}`);
  console.log(`    subjectRound : ${c.subjectRound ?? '-'}`);
  console.log(`    gated files  : ${c.gatedFiles.length}`);
  for (const f of c.gatedFiles) console.log(`      ${f}`);
  console.log(`    packages/ among them: ${c.gatedFiles.filter((f) => /^packages\//.test(f)).length}`);
}

// The union of every gated file that appears in any credit edge. This is the set the
// grader's surface key has to classify — not all 213 files under scripts/.
const union = [...new Set(edges.flatMap((e) => e.commit.gatedFiles))].sort();
console.log(`\nUNION of gated files across all credit edges: ${union.length}`);
for (const f of union) console.log(`  ${f}`);
console.log(`\npackages/ members of that union: ${union.filter((f) => /^packages\//.test(f)).length}`);
console.log(`scripts/  members of that union: ${union.filter((f) => /^scripts\//.test(f)).length}`);

// Every gated commit in the window, credited or not — so that "no packages/ work happened
// at all" can be told apart from "packages/ work happened but credited no round".
const allGatedFiles = [...new Set(commits.flatMap((c) => c.gatedFiles))].sort();
console.log(`\nALL gated files touched in the window (any commit, credited or not): ${allGatedFiles.length}`);
console.log(`  packages/: ${allGatedFiles.filter((f) => /^packages\//.test(f)).length}`);
console.log(`  scripts/ : ${allGatedFiles.filter((f) => /^scripts\//.test(f)).length}`);
for (const f of allGatedFiles.filter((f) => /^packages\//.test(f))) console.log(`    PKG ${f}`);
