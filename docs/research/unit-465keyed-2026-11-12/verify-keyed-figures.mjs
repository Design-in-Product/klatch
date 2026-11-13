#!/usr/bin/env node
/**
 * unit-465keyed-2026-11-12 — grade three routed figures and one of my own unlabelled ones.
 *
 * Every round attribution is read by IMPORTING the subject module's own readers. The only reader
 * written here is the first-component directory name of a path, because the module exposes a round
 * and the figure in dispute is a count of DIRS.
 *
 * Exit 1 on any red leg or any unexplained refusal. A refusal is NOT a pass: a leg that cannot read
 * its input prints REFUSED and is counted separately from green.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  attestedRounds, classifyPath, git, DENIAL_RE,
} from '../lib/attested-rounds.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const THESEUS_REV = '69cf9167';      // the rev my memo's figures were taken at
const DAEDALUS_REV = '3ee13880';     // the rev his §5 enumeration was taken at
const FLOOR = 292;                   // the floor every live consumer counts above
const ROUND9_PATH = 'docs/mail/read/daedalus-to-argus-round9.md';

const out = [];
const say = (s) => { out.push(s); console.log(s); };

const legs = [];
const check = (id, ok, note) => {
  // `ok` must be a BOOLEAN already evaluated by the caller into a variable, never an expression that
  // can throw inside this argument list: a `!` on a null crashes upstream of the leg that would
  // diagnose it.
  legs.push({ id, ok, note });
  say(`  ${ok === null ? 'REFUSED' : ok ? 'ok     ' : 'RED    '} ${id}  ${note}`);
};

const headRev = (git(REPO, ['rev-parse', 'HEAD']) ?? '').trim() || null;

say('=== VERIFY/465-keyed — are the two numbers the same quantity, and is the blind-spot member reachable ===');
say(`REPO       ${REPO}`);
say(`HEAD_REV   ${headRev ?? '(refused)'}`);
say(`THESEUS_REV ${THESEUS_REV}  (literal, my memo's rev)`);
say(`DAEDALUS_REV ${DAEDALUS_REV}  (literal, his §5 rev)`);
say(`CLOCK      ${new Date().toISOString()}`);
say(`FLOOR      ${FLOOR}`);
say('');

/** The population at a rev, under the live (cured) denial key. `null` on refusal. */
function pop(rev) {
  return attestedRounds(REPO, rev, { denialRe: DENIAL_RE });
}
/** Members strictly above the floor — the quantity my memo printed as a bare `175`. */
function aboveFloor(p) {
  return [...p.filtered].filter((n) => n > FLOOR).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
say('--- [MEAS] P1/P2 — which quantity is which number');
const pTh = pop(THESEUS_REV);
const pHead = headRev === null ? null : pop(headRev);
const pDae = pop(DAEDALUS_REV);

if (pTh === null) {
  check('P1a', null, `population at ${THESEUS_REV} refused`);
  check('P1b', null, `population at ${THESEUS_REV} refused`);
} else {
  const n = pTh.filtered.size;
  const above = aboveFloor(pTh);
  say(`  M-prior  rev=${THESEUS_REV}  |filtered|=${n}  above ${FLOOR}=${above.length}  max=${[...pTh.filtered].sort((a, b) => a - b).at(-1)}  removed=[${pTh.removed}]`);
  const p1a = n === 464;
  check('P1a', p1a, `|filtered| @${THESEUS_REV} = ${n}, predicted 464 (his number IS a count)`);
  const p1b = above.length === 175;
  check('P1b', p1b, `above ${FLOOR} @${THESEUS_REV} = ${above.length}, predicted 175 (my number is a count of a DIFFERENT set)`);
}

if (pHead === null) {
  check('P2', null, 'population at HEAD refused');
} else {
  const n = pHead.filtered.size;
  const above = aboveFloor(pHead);
  say(`  M-now    rev=${headRev.slice(0, 8)}  |filtered|=${n}  above ${FLOOR}=${above.length}  max=${[...pHead.filtered].sort((a, b) => a - b).at(-1)}  removed=[${pHead.removed}]`);
  const p2 = n === 465;
  check('P2', p2, `|filtered| @HEAD = ${n}, predicted 465`);
}
if (pDae !== null) {
  say(`  M-his    rev=${DAEDALUS_REV}  |filtered|=${pDae.filtered.size}  above ${FLOOR}=${aboveFloor(pDae).length}  (his drive's own tree, for the comparison to be keyed on it)`);
}
say('');

// ---------------------------------------------------------------------------
say('--- [MEAS] P3/P4 — the unit-dir figure under both keys');

/** unit-* dir names at a rev, mapped to the round the MODULE's classifier assigns. */
function unitDirs(rev) {
  const tree = git(REPO, ['ls-tree', '-r', '--name-only', rev]);
  if (tree === null) return null;
  const byDir = new Map();
  for (const p of tree.split('\n')) {
    const c = classifyPath(p);
    if (c.source !== 'S5') continue;
    const parts = p.split('/');            // docs/research/<dir>/...
    const dir = parts.slice(0, 3).join('/');
    if (!byDir.has(dir)) byDir.set(dir, c.round);
  }
  return byDir;
}

const dirsHead = headRev === null ? null : unitDirs(headRev);
const dirsTh = unitDirs(THESEUS_REV);

if (dirsHead === null) {
  check('P3a', null, 'tree at HEAD refused');
  check('P3b', null, 'tree at HEAD refused');
} else {
  const perRound = new Map();
  for (const r of dirsHead.values()) perRound.set(r, (perRound.get(r) ?? 0) + 1);
  const rounds = [...perRound.keys()].sort((a, b) => a - b);
  const breakdown = rounds.map((r) => `${r}: ${perRound.get(r)}`).join(' · ');
  say(`  M-standing  rev=${headRev.slice(0, 8)}  dirs=${dirsHead.size}  rounds=${rounds.length} {${rounds}}  ${breakdown}`);
  const p3a = dirsHead.size === 92;
  check('P3a', p3a, `standing dirs = ${dirsHead.size}, predicted 92`);
  const p3b = rounds.length === 3 && rounds.join(',') === '307,464,465';
  check('P3b', p3b, `standing round set = {${rounds}}, predicted {307,464,465}`);
}

if (dirsHead === null || dirsTh === null) {
  check('P4a', null, 'one of the two trees refused');
  check('P4b', null, 'one of the two trees refused');
} else {
  // The interval figure: dirs present at HEAD and absent at my rev. A set difference over dir NAMES,
  // not two counts subtracted — two counts that differ by 83 need not differ by these 83 members.
  const added = [...dirsHead.keys()].filter((d) => !dirsTh.has(d));
  const dropped = [...dirsTh.keys()].filter((d) => !dirsHead.has(d));
  const perRound = new Map();
  for (const d of added) perRound.set(dirsHead.get(d), (perRound.get(dirsHead.get(d)) ?? 0) + 1);
  const rounds = [...perRound.keys()].sort((a, b) => a - b);
  say(`  M-interval  ${THESEUS_REV}..HEAD  added=${added.length} dropped=${dropped.length}  rounds=${rounds.length} {${rounds}}  ${rounds.map((r) => `${r}: ${perRound.get(r)}`).join(' · ')}`);
  say(`  M-predating  dirs at ${THESEUS_REV} = ${dirsTh.size}  rounds={${[...new Set(dirsTh.values())].sort((a, b) => a - b)}}`);
  const p4a = added.length === 83;
  check('P4a', p4a, `interval dirs = ${added.length}, predicted 83`);
  const p4b = rounds.length === 2 && rounds.join(',') === '464,465';
  check('P4b', p4b, `interval round set = {${rounds}}, predicted {464,465}`);
}
say('');

// ---------------------------------------------------------------------------
say('--- [MEAS] P5/P6 — the blind-spot member, reachability and uniqueness');

if (pHead === null) {
  check('P5a', null, 'population at HEAD refused');
  check('P5b', null, 'population at HEAD refused');
  check('P5c', null, 'population at HEAD refused');
  check('P6', null, 'population at HEAD refused');
} else {
  const in9 = pHead.filtered.has(9);
  const p5a = in9 === false;
  check('P5a', p5a, `9 in filtered @HEAD = ${in9}, predicted false (the member the four sources miss)`);

  const tree = git(REPO, ['ls-tree', '-r', '--name-only', headRev]);
  if (tree === null) {
    check('P5b', null, 'tree at HEAD refused');
    check('P6', null, 'tree at HEAD refused');
  } else {
    const paths = tree.split('\n');
    const present = paths.includes(ROUND9_PATH);
    const p5b = present === true;
    check('P5b', p5b, `${ROUND9_PATH} in tree @HEAD = ${present}, predicted true`);

    const p5c = 9 < FLOOR;
    check('P5c', p5c, `9 < ${FLOOR} = ${p5c}, so admitting it moves no above-floor figure any live consumer prints`);

    // P6 — strict `round(\d+)` over docs/mail/ paths only. Typed here deliberately: this is the
    // CANDIDATE sixth source, which by definition does not exist in the module yet, so there is
    // nothing to import. Its strictness is the point — the loose spelling admits `round-2026`.
    const MAIL_ROUND_RE = /round(\d+)/;
    const mailRounds = new Set();
    let mailPathsWithToken = 0;
    for (const p of paths) {
      if (!p.startsWith('docs/mail/')) continue;
      const m = MAIL_ROUND_RE.exec(p);
      if (m) { mailRounds.add(Number(m[1])); mailPathsWithToken += 1; }
    }
    const newMembers = [...mailRounds].filter((n) => !pHead.filtered.has(n)).sort((a, b) => a - b);
    say(`  M-mail  paths with a strict round token=${mailPathsWithToken}  distinct rounds=${mailRounds.size}  NOT already in filtered=[${newMembers}]`);
    const p6 = newMembers.length === 1 && newMembers[0] === 9;
    check('P6', p6, `strict mail source would add [${newMembers}], predicted exactly [9]`);
  }
}
say('');

// ---------------------------------------------------------------------------
const red = legs.filter((l) => l.ok === false).map((l) => l.id);
const refused = legs.filter((l) => l.ok === null).map((l) => l.id);
const verdict = red.length === 0 && refused.length === 0 ? 'GREEN' : 'RED';
say(`VERDICT/${verdict === 'GREEN' ? 0 : 1} ${verdict} legs=${legs.length} red=[${red}] refused=[${refused}]`);
process.exit(verdict === 'GREEN' ? 0 : 1);
