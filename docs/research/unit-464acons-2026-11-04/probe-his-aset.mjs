#!/usr/bin/env node
// probe-his-aset.mjs — unit-464acons, Theseus, 2026-11-04 STOP fire.
//
// DECLARED POST-HOC. No leg, no verdict, no prediction. Written after grade-acons.mjs had already
// graded all eight registered legs, because the question only occurred to me once P1BEXACT had
// landed: Daedalus's second independent hand read of these same 20 sites produced SEVEN A rows
// against my EIGHT. Which seven?
//
// Both tables are read at THEIR OWN add-commits, derived here, never from the worktree. Headers are
// dropped by the literal name in column 0, never by position. The comparison is a SET DIFFERENCE
// over member lists, not a comparison of counts.

import { execFileSync } from 'node:child_process';

console.log('probe-his-aset — DECLARED POST-HOC: no leg, no verdict, no registered prediction.');
console.log('');

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

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

function addCommitOf(rel) {
  const log = git(['log', '--diff-filter=A', '--reverse', '--format=%H', '--', rel]);
  const rev = (log ?? '').trim().split('\n').filter(Boolean)[0];
  if (!rev) refuse(`no add-commit for ${rel}`);
  return rev;
}

function tableAt(rel, headerToken) {
  const rev = addCommitOf(rel);
  const src = git(['show', `${rev}:${rel}`]);
  if (!src || !src.trim()) refuse(`${rel} reads empty at ${rev}`);
  const rows = src
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('\t'));
  const body = rows.filter((c) => c[0].trim() !== headerToken);
  if (body.length !== 20) refuse(`${rel}: expected 20 body rows at ${rev}, read ${body.length}`);
  return { rev, body };
}

// HIS table: unit-464cons/HAND-CONS.tsv, columns site|line|class|blind|consumer|reason
const HIS_REL = 'docs/research/unit-464cons-2026-11-04/HAND-CONS.tsv';
const his = tableAt(HIS_REL, 'site');
// MY table: unit-464addarm/HAND-ARM3.tsv, CLASS in column 6
const MY_REL = 'docs/research/unit-464addarm-2026-11-04/HAND-ARM3.tsv';
const mine = tableAt(MY_REL, 'site_id');

console.log(`  his  ${HIS_REL}`);
console.log(`       at its own add-commit ${his.rev}`);
console.log(`  mine ${MY_REL}`);
console.log(`       at its own add-commit ${mine.rev}`);
console.log('');

const tally = (rows, col) => {
  const t = {};
  for (const r of rows) {
    const k = (r[col] || '').trim();
    t[k] = (t[k] || 0) + 1;
  }
  return t;
};
console.log(`  his  class tally  ${JSON.stringify(tally(his.body, 2))}`);
console.log(`  mine class tally  ${JSON.stringify(tally(mine.body, 6))}`);
console.log('');

const hisA = his.body.filter((r) => (r[2] || '').trim() === 'A').map((r) => r[0].trim());
const myA = mine.body.filter((r) => (r[6] || '').trim() === 'A').map((r) => r[0].trim());
const hisSet = new Set(hisA);
const mySet = new Set(myA);

const onlyHis = hisA.filter((s) => !mySet.has(s));
const onlyMine = myA.filter((s) => !hisSet.has(s));

console.log(`  |his A| = ${hisA.length}    |my A| = ${myA.length}`);
console.log(`  IN HIS A, NOT MINE  (${onlyHis.length}): ${onlyHis.join(' , ') || '(empty)'}`);
console.log(`  IN MY A, NOT HIS    (${onlyMine.length}): ${onlyMine.join(' , ') || '(empty)'}`);
console.log(`  his A is a SUBSET of my A: ${onlyHis.length === 0}`);
console.log('');

// what class did HE give the row I flipped, and in his own words
const FLIPPED = 'unit-464t2-population-2026-10-28/grade-the-round-population.mjs#1';
const hisRow = his.body.find((r) => r[0].trim() === FLIPPED);
if (!hisRow) refuse(`${FLIPPED} absent from his table at ${his.rev}`);
console.log(`  THE ROW MY HAND READ FLIPPED: ${FLIPPED}`);
console.log(`    his class    ${(hisRow[2] || '').trim()}`);
console.log(`    his blind    ${(hisRow[3] || '').trim()}`);
console.log(`    his consumer ${(hisRow[4] || '').trim()}`);
console.log(`    his reason   ${(hisRow[5] || '').trim()}`);
const myRow = mine.body.find((r) => r[0].trim() === FLIPPED);
console.log(`    my class at ${mine.rev.slice(0, 8)}  ${(myRow[6] || '').trim()}`);
console.log('');
console.log(`  SO: the ONE row the two independent hand reads disagreed on is the ONE row the`);
console.log(`      consumption-site read moves, and it moves TO HIS SIDE.`);
console.log('');

// Do the two reads now agree on all 20? Checked as a PER-SITE JOIN over member lists, never by
// comparing tallies: two tallies can match while the members differ, and that is the mistake this
// line exists to avoid.
const myClassAfterFlip = new Map(
  mine.body.map((r) => {
    const site = r[0].trim();
    const cls = (r[6] || '').trim();
    return [site, site === FLIPPED ? 'R' : cls];
  }),
);
const hisClass = new Map(his.body.map((r) => [r[0].trim(), (r[2] || '').trim()]));
const sitesUnion = [...new Set([...myClassAfterFlip.keys(), ...hisClass.keys()])];
if (sitesUnion.length !== 20) refuse(`site union is ${sitesUnion.length}, not 20 — the tables are not over the same population`);
const mismatches = sitesUnion.filter((s) => myClassAfterFlip.get(s) !== hisClass.get(s));
console.log(`  PER-SITE JOIN over the ${sitesUnion.length}-site union, my column AFTER the flip vs his:`);
console.log(`    disagreements: ${mismatches.length}`);
for (const s of mismatches) {
  console.log(`      ${s}   mine=${myClassAfterFlip.get(s)}  his=${hisClass.get(s)}`);
}
const blindCount = his.body.filter((r) => (r[3] || '').trim() === 'blind').length;
console.log(`  his rows marked \`blind\`: ${blindCount} of 20; the flipped row is marked \`${(hisRow[3] || '').trim()}\`.`);
