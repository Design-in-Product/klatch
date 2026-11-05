#!/usr/bin/env node
// probe-crosstab.mjs — unit-464acons, Theseus, 2026-11-04 STOP fire.
//
// DECLARED POST-HOC. No leg, no verdict, no registered prediction. P2CENSUS was already graded RED
// when this was written; this probe exists so the cross-tab RESULTS §2 prints is CAPTURED from a run
// rather than read off a table by eye.
//
// It prints the cross-tab TWICE, under two different keys for the same column, because they do not
// agree and the disagreement is a property of the subject:
//   LITERAL key  — `dir_shaped` as read-consumers.mjs computes it: the pathspec operand is a string
//                  literal ending in `/`. A pathspec held in a VARIABLE is false under this key
//                  however the variable is built.
//   SEMANTIC key — the same question answered from what the variable actually holds, taken from
//                  HAND-CONS-A.tsv's own `why` column, which records it per row.
// Reporting only the literal key would under-count directories by exactly the rows whose pathspec
// is computed, and that is one of the eight.

import { execFileSync } from 'node:child_process';

console.log('probe-crosstab — DECLARED POST-HOC: no leg, no verdict, no registered prediction.');
console.log('');

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const UNIT = 'docs/research/unit-464acons-2026-11-04';

const git = (args) =>
  execFileSync('git', ['-C', TOP, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

function refuse(why) {
  console.log(`REFUSE: ${why}`);
  process.exit(2);
}

// --- hand verdicts, at the table's own add-commit ---------------------------
const TSV_REL = `${UNIT}/HAND-CONS-A.tsv`;
const addRev = (git(['log', '--diff-filter=A', '--reverse', '--format=%H', '--', TSV_REL]) || '')
  .trim().split('\n').filter(Boolean)[0];
if (!addRev) refuse(`no add-commit for ${TSV_REL}`);
const handRows = git(['show', `${addRev}:${TSV_REL}`])
  .split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'))
  .filter((c) => c[0].trim() !== 'site_id');
if (handRows.length !== 8) refuse(`expected 8 hand rows, read ${handRows.length}`);
const holds = new Map(handRows.map((c) => [c[0].trim(), (c[1] || '').trim().toLowerCase() === 'yes']));
const whyOf = new Map(handRows.map((c) => [c[0].trim(), (c[3] || '')]));
console.log(`  hand table at its own add-commit ${addRev}`);

// --- the reader's own TSV skeleton, from a live run -------------------------
const out = execFileSync('node', [`${TOP}/${UNIT}/read-consumers.mjs`], {
  cwd: TOP, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
});
const skelAt = out.indexOf('=== TSV SKELETON');
if (skelAt < 0) refuse('no TSV SKELETON section in the reader output');
const skel = out.slice(skelAt).split('\n').slice(1)
  .filter((l) => l.includes('\t')).map((l) => l.split('\t'))
  .filter((c) => c[0].trim() !== 'site_id');
if (skel.length !== 8) refuse(`skeleton has ${skel.length} rows, not 8`);
const dirLiteral = new Map(skel.map((c) => [c[0].trim(), c[4].trim() === 'true']));
const singleRec = new Map(skel.map((c) => [c[0].trim(), c[6].trim() === 'true']));

// --- SEMANTIC key: taken from the hand table's own `why` text, per row ------
// The one row this differs on records it explicitly: "the variable holds a DIRECTORY".
const dirSemantic = new Map(
  [...dirLiteral.entries()].map(([site, lit]) => [
    site,
    lit || /\bdirectory\b/i.test(whyOf.get(site) || ''),
  ]),
);

function tab(label, dirKey) {
  const cell = (isDir, whole) =>
    [...holds.keys()].filter((s) => dirKey.get(s) === isDir && (!singleRec.get(s)) === whole);
  const rows = [
    ['single file path', false],
    ['directory      ', true],
  ];
  console.log('');
  console.log(`  === cross-tab, ${label} ===`);
  console.log('                      reduction at the consumption site');
  console.log('    pathspec           one record   whole selection   total    class after the read');
  for (const [name, isDir] of rows) {
    const one = cell(isDir, false);
    const all = cell(isDir, true);
    const cls = [...one, ...all].map((s) => (holds.get(s) ? 'A' : 'R'));
    console.log(
      `    ${name}   ${String(one.length).padStart(6)}       ${String(all.length).padStart(7)}        ${String(one.length + all.length).padStart(5)}    ${cls.join(' · ')}`,
    );
  }
  const tOne = [...holds.keys()].filter((s) => singleRec.get(s)).length;
  const tAll = 8 - tOne;
  console.log(`    total              ${String(tOne).padStart(6)}       ${String(tAll).padStart(7)}        ${String(8).padStart(5)}`);
  const dirs = [...holds.keys()].filter((s) => dirKey.get(s));
  const dirMoving = dirs.filter((s) => !holds.get(s));
  console.log(`    directories: ${dirs.length}; of those, stable ${dirs.length - dirMoving.length}, moving ${dirMoving.length}`);
}

tab('LITERAL key (read-consumers `dir_shaped`) — the key P2CENSUS was graded on', dirLiteral);
tab('SEMANTIC key (what the pathspec variable actually holds)', dirSemantic);

const diff = [...dirLiteral.keys()].filter((s) => dirLiteral.get(s) !== dirSemantic.get(s));
console.log('');
console.log(`  the two keys disagree on ${diff.length} row(s): ${diff.join(' , ') || '(none)'}`);
console.log(`  P2CENSUS registered exactly 1 and is RED under BOTH keys`);
console.log(`    literal  ${[...dirLiteral.values()].filter(Boolean).length} of 8`);
console.log(`    semantic ${[...dirSemantic.values()].filter(Boolean).length} of 8`);
console.log('');
console.log('  invariant under both keys: EVERY row whose reduction takes one record is stable,');
console.log('  and the single row that reads the whole selection is the only one that moves.');
const oneRecStable = [...holds.keys()].filter((s) => singleRec.get(s)).every((s) => holds.get(s));
const wholeMoves = [...holds.keys()].filter((s) => !singleRec.get(s)).every((s) => !holds.get(s));
console.log(`    one-record => stable : ${oneRecStable}`);
console.log(`    whole-set  => moves  : ${wholeMoves}`);
