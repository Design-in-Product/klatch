#!/usr/bin/env node
// unit-464moves — grade-census-keys.mjs
//
// Grades addendum 1's R1REPRO / R2ENTRIES / R3MEMBERS / R4NEITHER / R5MTS. Predictions were
// committed and pushed before this file existed.
//
// The control is R1REPRO itself: the key must land ALL FOUR of his 11/03 rows in both measured
// columns, not just the row we disagree about. A key tuned until the disputed row lands measures
// the tuning.
//
// Usage: node grade-census-keys.mjs [--cripple=tunedisputedonly] [--key=tuned]
//
//   --cripple=tunedisputedonly  grades R1REPRO on the roundNNN row ALONE — the vacuous version.
//   --key=tuned                 swaps in a TUNED key: identical to his on the disputed roundNNN row
//                               (the two lib files move from `other` to `unit-other`, which leaves
//                               roundNNN untouched at 90/195) and wrong on two other rows.
//
// ADDED AFTER drive2, and declared: on the real key both arms of the cripple read GREEN, so the
// cripple alone does NOT show the four-row conjunction is load-bearing. The counterfactual that
// does is `--key=tuned --cripple=tunedisputedonly` (passes) against `--key=tuned` (must fail).
// Without the tuned key the conjunction is an untested claim about the test.

import { execFileSync } from 'node:child_process';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const PIN = 'bba2aa3c';   // the pin his 11/03 table was taken at
const MY_PIN = '0ae48068'; // the population pin — my 91/191 is re-asserted here as a leg
const CRIPPLE = (process.argv.slice(2).find((a) => a.startsWith('--cripple=')) ?? '').split('=')[1] ?? null;
const KEY = (process.argv.slice(2).find((a) => a.startsWith('--key=')) ?? '').split('=')[1] ?? 'his';

// His 11/03 table, as TARGETS: [all-dirs, dirs-with-.mjs, .mjs]
const HIS = {
  'unit-464': [37, 35, 106],
  roundNNN: [325, 90, 195],
  'unit-other': [2, 2, 6],
  other: [44, 1, 2],
};
const HIS_TOTAL_ENTRIES = 408;
// Registered in addendum 1 R3MEMBERS, in full, as a member list.
const R3 = [
  'docs/research/round352-valuation-leg-key.mjs',
  'docs/research/round427-capability-test-pointer/the-history-window-is-200-messages-not-the-file.mjs',
  'docs/research/round445-capability-test/klatch-capability-test.mjs',
  'docs/research/round445-capability-test/verify-request-shapes.mjs',
];

function git(args) {
  try {
    return execFileSync('git', ['-C', REPO, ...args], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// HIS key, as registered: family on the FIRST-LEVEL NAME under docs/research/; round* (not
// round\d+-instruments) is roundNNN; a bare .mjs in docs/research/ is held by docs/research/.
// ---------------------------------------------------------------------------
function hisFamily(firstLevelName) {
  if (KEY === 'tuned') {
    // TUNED: identical on the disputed row, wrong on two others. `lib` -> unit-other.
    if (/^unit-464/.test(firstLevelName)) return 'unit-464';
    if (/^round/.test(firstLevelName)) return 'roundNNN';
    if (/^unit-/.test(firstLevelName) || firstLevelName === 'lib') return 'unit-other';
    return 'other';
  }
  if (/^unit-464/.test(firstLevelName)) return 'unit-464';
  if (/^round/.test(firstLevelName)) return 'roundNNN';
  if (/^unit-/.test(firstLevelName)) return 'unit-other';
  return 'other';
}
// MY key, for the same tree: only /^round\d+-instruments$/ is roundNNN.
function myFamily(firstLevelName) {
  if (/^unit-464/.test(firstLevelName)) return 'unit-464';
  if (/^round\d+-instruments$/.test(firstLevelName)) return 'roundNNN';
  if (/^unit-/.test(firstLevelName)) return 'unit-other';
  return 'other';
}

const FAMS = ['unit-464', 'roundNNN', 'unit-other', 'other'];

// First-level entries, with their git object type — the R2ENTRIES measurement.
function firstLevel(rev) {
  const out = git(['ls-tree', rev, 'docs/research/']);
  if (out === null) return null;
  const entries = [];
  for (const line of out.split('\n')) {
    const m = /^\d+ (tree|blob) [0-9a-f]+\tdocs\/research\/(.+)$/.exec(line);
    if (m) entries.push({ type: m[1], name: m[2] });
  }
  return entries;
}

function tally(rev, famOf) {
  const paths = (git(['ls-tree', '-r', '--name-only', rev, 'docs/research/']) ?? '').split('\n').filter(Boolean);
  const mjsCount = Object.fromEntries(FAMS.map((f) => [f, 0]));
  const holders = Object.fromEntries(FAMS.map((f) => [f, new Set()]));
  const members = Object.fromEntries(FAMS.map((f) => [f, []]));
  for (const p of paths) {
    if (!p.endsWith('.mjs')) continue;
    const parts = p.split('/');
    const first = parts[2];
    const isBare = parts.length === 3; // docs/research/<file>.mjs
    const f = famOf(first);
    mjsCount[f] += 1;
    members[f].push(p);
    // "a directory that holds an instrument": the first-level entry, or docs/research/ itself for a
    // bare file. Keyed at the first level, matching the column his table reports.
    holders[f].add(isBare ? 'docs/research/' : first);
  }
  return { mjsCount, holders, members, paths };
}

const legs = [];
function leg(id, kind, value, why, detail) { legs.push({ id, kind, value, why, detail }); }

const his = tally(PIN, hisFamily);
const mine = tally(PIN, myFamily);
const mineAtMyPin = tally(MY_PIN, myFamily);
const fl = firstLevel(PIN);

// --- R1REPRO ---------------------------------------------------------------
console.log(`--- [MEAS] R1REPRO — his four rows under HIS registered key, at his pin ${PIN}`);
console.log('  key: family on the FIRST-LEVEL NAME under docs/research/; round* -> roundNNN; a bare *.mjs is held by docs/research/ itself');
const rowOk = {};
for (const f of FAMS) {
  const w = his.holders[f].size; const n = his.mjsCount[f];
  const h = HIS[f];
  rowOk[f] = w === h[1] && n === h[2];
  console.log(`  ${f.padEnd(11)} dirs-with-.mjs ${String(w).padStart(4)} (his ${String(h[1]).padStart(3)}) ${w === h[1] ? '=' : '*'}    .mjs ${String(n).padStart(4)} (his ${String(h[2]).padStart(3)}) ${n === h[2] ? '=' : '*'}`);
}
const allFour = FAMS.every((f) => rowOk[f]);
const disputedOnly = rowOk.roundNNN;
console.log(`  rows landing in BOTH columns: ${FAMS.filter((f) => rowOk[f]).length} of 4`);
console.log('');

leg('R1REPRO', 'GATE',
  CRIPPLE === 'tunedisputedonly' ? disputedOnly : allFour,
  CRIPPLE === 'tunedisputedonly'
    ? 'CRIPPLED: graded on the DISPUTED row alone — the vacuous version, which a key tuned to that row passes'
    : 'ONE key reproduces all four of his 11/03 rows in both measured columns. The four-row conjunction is the control: a key tuned until the disputed row lands measures the tuning',
  `all-four=${allFour} disputed-only=${disputedOnly} per-row=${FAMS.map((f) => `${f}:${rowOk[f]}`).join(' ')}`);

// --- R2ENTRIES -------------------------------------------------------------
const trees = fl === null ? null : fl.filter((e) => e.type === 'tree').length;
const blobs = fl === null ? null : fl.filter((e) => e.type === 'blob').length;
console.log(`--- [MEAS] R2ENTRIES — what the 408 denominator counts, at ${PIN}`);
console.log(`  key: git ls-tree <rev> docs/research/ (non-recursive), entries split by git object type`);
console.log(`  first-level entries total : ${fl === null ? 'REFUSED' : fl.length}   (his all-dirs column sums to ${HIS_TOTAL_ENTRIES})`);
console.log(`  of which trees (directories) : ${trees ?? 'REFUSED'}`);
console.log(`  of which blobs (loose files) : ${blobs ?? 'REFUSED'}`);
const hisEntryByFam = Object.fromEntries(FAMS.map((f) => [f, 0]));
if (fl !== null) for (const e of fl) hisEntryByFam[hisFamily(e.name)] += 1;
for (const f of FAMS) console.log(`  entries in family ${f.padEnd(11)}: ${String(hisEntryByFam[f]).padStart(4)} (his all-dirs ${String(HIS[f][0]).padStart(4)}) ${hisEntryByFam[f] === HIS[f][0] ? '=' : '*'}`);
console.log('');

leg('R2ENTRIES', 'FINDING',
  fl !== null && fl.length === HIS_TOTAL_ENTRIES && blobs > trees
    && FAMS.every((f) => hisEntryByFam[f] === HIS[f][0]),
  'his all-dirs column counts FIRST-LEVEL ENTRIES, not directories: all four row figures land exactly on the entry count, the total is 408, and the majority of the 408 are loose files. A label defect, not an arithmetic one — the true first-level directory count is the tree count printed above',
  `entries=${fl === null ? 'REFUSED' : fl.length} trees=${trees} blobs=${blobs} per-row-exact=${FAMS.every((f) => hisEntryByFam[f] === HIS[f][0])}`);

// --- R3MEMBERS -------------------------------------------------------------
const diff = his.members.roundNNN.filter((p) => !mine.members.roundNNN.includes(p)).sort();
console.log('--- [MEAS] R3MEMBERS — the 4 .mjs his roundNNN holds and mine does not, by name');
for (const p of diff) console.log(`  ${p}`);
console.log(`  his other row members: ${his.members.other.join(' , ') || '(none)'}`);
console.log('');

leg('R3MEMBERS', 'FINDING',
  diff.length === R3.length && diff.every((p, i) => p === [...R3].sort()[i]),
  'the 195-vs-191 gap is exactly the four named .mjs files, member list not count: one bare file with no directory at all, one under round427-capability-test-pointer, two under round445-capability-test — none of them in a *-instruments directory',
  `diff=${diff.length} registered=${R3.length} exact=${diff.length === R3.length && diff.every((p, i) => p === [...R3].sort()[i])}`);

leg('R3OTHER', 'CONTROL',
  his.members.other.length === 2 && his.members.other.every((p) => p.startsWith('docs/research/lib/')),
  "CONTROL for R3MEMBERS: his `other` row's 2 .mjs must be exactly the two docs/research/lib files. Without it, the four that moved could have come from anywhere and the partition would not be accounted for end to end",
  `other=${his.members.other.length} -> ${his.members.other.join(' , ')}`);

// --- R4NEITHER -------------------------------------------------------------
const myRound = { dirs: new Set(mineAtMyPin.members.roundNNN.map((p) => p.split('/')[2])).size, mjs: mineAtMyPin.mjsCount.roundNNN };
const allRoundDirs = (() => {
  const out = firstLevel(MY_PIN);
  return out === null ? null : out.filter((e) => e.type === 'tree' && /^round\d+-instruments$/.test(e.name)).length;
})();
console.log(`--- [MEAS] R4NEITHER — my own figures re-derived at my own pin ${MY_PIN}`);
console.log(`  key: /^round\\d+-instruments$/ first-level dirs = ${allRoundDirs}; of those, holding >=1 .mjs = ${myRound.dirs}; .mjs under them = ${myRound.mjs}`);
console.log('');

leg('R4NEITHER', 'FINDING',
  allFour && allRoundDirs === 91 && myRound.mjs === 191,
  'neither figure is an arithmetic error: his 90/195 is exact under his first-level-name key and my 91/191 is exact under mine. Two populations, one tree. The 11/03 sentence correcting my row to "90 dirs / 195 .mjs at your own pin" compares across the two keys',
  `his-key-all-four=${allFour} my 91=${allRoundDirs} my 191=${myRound.mjs}`);

// --- R5MTS -----------------------------------------------------------------
const mts = mine.paths.filter((p) => /^docs\/research\/round\d+-instruments\//.test(p) && p.endsWith('.mts'));
const mjsDirs = new Set(mine.members.roundNNN.map((p) => p.split('/')[2]));
const mtsOnlyDirs = [...new Set(mts.map((p) => p.split('/')[2]))].filter((d) => !mjsDirs.has(d));
const rivalDirs = mjsDirs.size + mtsOnlyDirs.length;
const rivalFiles = mine.mjsCount.roundNNN + mts.length;
console.log('--- [MEAS] R5MTS — the rival explanation, and its discriminator');
console.log(`  key: .mjs + .mts under /^round\\d+-instruments$/ dirs`);
console.log(`  rival dirs-with-instrument: ${rivalDirs} (his 90 -> ${rivalDirs === 90 ? 'MATCHES, so the dirs column does not discriminate' : 'differs'})`);
console.log(`  rival file count          : ${rivalFiles} (his 195 -> ${rivalFiles === 195 ? 'MATCHES — the two explanations are INDISTINGUISHABLE and I must say so' : 'differs, so the rival is refuted on the file column'})`);
console.log('');

leg('R5MTS', 'FINDING',
  rivalFiles !== 195 && rivalDirs === 90,
  'the rival (.mjs+.mts) explains his dirs column exactly — 90 — and NOT his file column: 197, not 195. So the dirs column alone cannot discriminate between the two explanations and the file column does. Registered as a refutation of the rival, not as evidence for my key',
  `rival dirs=${rivalDirs} files=${rivalFiles}; his 90/195`);

// ---------------------------------------------------------------------------
console.log('--- legs');
let red = 0;
for (const l of legs) {
  const v = l.value === true ? 'GREEN' : 'RED';
  if (v === 'RED') red += 1;
  console.log(`  ${v.padEnd(5)} ${l.id.padEnd(10)} ${l.kind.padEnd(8)} ${l.why}`);
  console.log(`        detail: ${l.detail}`);
}
console.log('');
console.log(`VERDICT ${red === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${red}${CRIPPLE ? ` CRIPPLE=${CRIPPLE}` : ''}`);
