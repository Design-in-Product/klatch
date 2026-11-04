#!/usr/bin/env node
// unit-464moves — probe-residual.mjs
//
// probe-hiskey.mjs found no direct key that gives his 325 / 90 / 195. But his four rows sum to his
// own three totals, and the totals reproduce exactly off `ls-tree` (309 .mjs at bba2aa3c). So the
// hypothesis this probe tests is that one of his four rows is a RESIDUAL — total minus the other
// three — rather than a key over the tree.
//
// Test: assign every path at his pin to a family by an explicit first-component key, with NO
// fall-through, and compare each of his four rows to the keyed count. A row that departs while the
// other three are exact, by exactly the amount the keyed families leave over, is the residual.
//
// Member lists, not counts: the departing .mjs are printed by name.

import { execFileSync } from 'node:child_process';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const PIN = 'bba2aa3c'; // the pin HIS table was taken at
// his 11/03 table: [all-dirs, dirs-with-.mjs, .mjs]
const HIS = {
  'unit-464': [37, 35, 106],
  roundNNN: [325, 90, 195],
  'unit-other': [2, 2, 6],
  other: [44, 1, 2],
  TOTAL: [408, 128, 309],
};

function git(args) {
  try {
    return execFileSync('git', ['-C', REPO, ...args], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch { return null; }
}

const paths = (git(['ls-tree', '-r', '--name-only', PIN, 'docs/research/']) ?? '').split('\n').filter(Boolean);

// Every distinct directory path at every depth under docs/research/ (his all-dirs total is 408,
// and the first-component count is only 140, so his dir column must be at every depth).
const dirPaths = new Set();
for (const p of paths) {
  const parts = p.split('/');
  for (let i = 3; i <= parts.length - 1; i += 1) dirPaths.add(parts.slice(0, i).join('/'));
}

// Family key: on the FIRST component under docs/research/. No fall-through — anything the four
// keys do not claim is reported as UNCLAIMED and named.
function family(firstComponent) {
  if (/^unit-464/.test(firstComponent)) return 'unit-464';
  if (/^round\d+-instruments$/.test(firstComponent)) return 'roundNNN';
  if (/^unit-/.test(firstComponent)) return 'unit-other';
  return 'other';
}

const fams = ['unit-464', 'roundNNN', 'unit-other', 'other'];
const dirCount = Object.fromEntries(fams.map((f) => [f, 0]));
const mjsCount = Object.fromEntries(fams.map((f) => [f, 0]));
const dirsWithMjs = Object.fromEntries(fams.map((f) => [f, new Set()]));
const mjsMembers = Object.fromEntries(fams.map((f) => [f, []]));

for (const d of dirPaths) {
  const first = d.split('/')[2];
  dirCount[family(first)] += 1;
}
for (const p of paths) {
  if (!p.endsWith('.mjs')) continue;
  const first = p.split('/')[2];
  const f = family(first);
  mjsCount[f] += 1;
  mjsMembers[f].push(p);
  dirsWithMjs[f].add(p.split('/').slice(0, -1).join('/'));
}

console.log(`=== pin ${PIN} — ${paths.length} blobs, ${dirPaths.size} distinct directory paths at every depth, ${paths.filter((p) => p.endsWith('.mjs')).length} *.mjs`);
console.log('key: family assigned on the FIRST path component under docs/research/, no fall-through:');
console.log('     unit-464 =~ /^unit-464/ | roundNNN =~ /^round\\d+-instruments$/ | unit-other =~ /^unit-/ | other = the rest');
console.log('');
console.log('family        keyed all-dirs  his    keyed dirs-with-.mjs  his    keyed .mjs  his');
let sumDirs = 0; let sumWith = 0; let sumMjs = 0;
for (const f of fams) {
  const w = dirsWithMjs[f].size;
  sumDirs += dirCount[f]; sumWith += w; sumMjs += mjsCount[f];
  const h = HIS[f];
  const mark = (a, b) => (a === b ? ' =' : ' *');
  console.log(`${f.padEnd(12)}  ${String(dirCount[f]).padStart(13)}${mark(dirCount[f], h[0])}${String(h[0]).padStart(5)}  ${String(w).padStart(20)}${mark(w, h[1])}${String(h[1]).padStart(5)}  ${String(mjsCount[f]).padStart(10)}${mark(mjsCount[f], h[2])}${String(h[2]).padStart(5)}`);
}
console.log(`${'TOTAL'.padEnd(12)}  ${String(sumDirs).padStart(13)}  ${String(HIS.TOTAL[0]).padStart(5)}  ${String(sumWith).padStart(20)}  ${String(HIS.TOTAL[1]).padStart(5)}  ${String(sumMjs).padStart(10)}  ${String(HIS.TOTAL[2]).padStart(5)}`);
console.log('');

// Residual test: his row minus my keyed row, for each family.
console.log('residual test — his row minus the keyed row:');
for (const f of fams) {
  const h = HIS[f];
  console.log(`  ${f.padEnd(12)} dirs ${String(h[0] - dirCount[f]).padStart(5)}   dirs-with-.mjs ${String(h[1] - dirsWithMjs[f].size).padStart(4)}   .mjs ${String(h[2] - mjsCount[f]).padStart(4)}`);
}
console.log('');

// The non-.mjs instruments under roundNNN dirs — the candidate explanation for dirs-with 87 -> 90.
const mts = paths.filter((p) => /^docs\/research\/round\d+-instruments\//.test(p) && p.endsWith('.mts'));
const mtsDirs = new Set(mts.map((p) => p.split('/')[2]));
console.log(`*.mts under roundNNN dirs: ${mts.length} files in ${mtsDirs.size} dirs -> ${[...mtsDirs].sort().join(', ')}`);
const mjsDirsK1 = new Set(mjsMembers.roundNNN.map((p) => p.split('/')[2]));
const addedByMts = [...mtsDirs].filter((d) => !mjsDirsK1.has(d));
console.log(`  dirs that hold a .mts but NO .mjs (would lift dirs-with 87 -> ${87 + addedByMts.length}): ${addedByMts.join(', ') || '(none)'}`);
console.log(`  .mjs + .mts under roundNNN dirs: ${mjsCount.roundNNN + mts.length}`);
console.log('');

console.log('members of the "other" family (every .mjs the three named keys do not claim):');
for (const p of mjsMembers.other) console.log(`  ${p}`);
console.log('');
console.log('first components in the "other" family that hold any file:');
const otherFirsts = new Set();
for (const p of paths) {
  const first = p.split('/')[2];
  if (family(first) === 'other') otherFirsts.add(first);
}
console.log(`  n=${otherFirsts.size} -> ${[...otherFirsts].sort().join(', ')}`);
