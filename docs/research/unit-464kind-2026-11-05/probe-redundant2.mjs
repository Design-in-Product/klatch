#!/usr/bin/env node
// DECLARED POST-HOC, and a CORRECTION of one arm of probe-redundant.mjs. No prediction claimed.
//
// WHAT WAS WRONG, and it was my own output's arithmetic that said so, not my noticing the code.
// probe-redundant reported the no-flag arm as "MOVED 29 · STABLE 35". Every STABLE row it printed
// read `members=2`, and the P4QUANT histogram reads `2:35` — the same 35. The agreement is exact,
// which is the signature of a forced cell rather than a measurement.
//
// The cause: that probe drew the interval's upper endpoint as the selection's SECOND add-commit.
// Without `--reverse` the first record is the NEWEST commit as of the rev read. For a selection
// with exactly 2 members the second add-commit IS the newest at the pin, so `pMid` and `pPin` are
// the same commit BY CONSTRUCTION. 35 of the 64 tested selections have members==2, so 35 of them
// were being asked a question with one possible answer.
//
// 29 "moved" over 29 selections that had room is a different sentence from 29 over 64, and only the
// first is true. The `--reverse` arm is unaffected — `[0]` is the oldest at every rev — so
// probe-redundant's 64-of-64 stands and is NOT withdrawn. Only its no-flag half is vacuous at 35
// rows, and probe-redundant.out is kept with that half labelled, per §2.1n ("a withdrawal is not a
// correction") read the other way: this is a correction of a live arm, so the superseded figure is
// named rather than deleted.
//
// THE FIX: upper endpoint = the PENULTIMATE add-commit. At that rev a selection with members >= 2
// has strictly fewer members than at the pin under either ordering, so both arms have room.

import { execFileSync } from 'node:child_process';

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) => execFileSync('git', ['-C', TOP, ...args], { encoding: 'utf8' });
const PIN = '0ae48068';
const refuse = (m) => { console.log(`REFUSE: ${m}`); process.exit(2); };

try { git(['rev-parse', '--verify', `${PIN}^{commit}`]); } catch { refuse(`pin ${PIN} unreadable`); }

console.log('=== probe-redundant2 (DECLARED POST-HOC — corrects probe-redundant\'s no-flag arm) ===');
console.log(`pin ${PIN}`);
console.log('endpoint: the selection\'s PENULTIMATE add-commit (was: the SECOND, which is the same');
console.log('          commit as the pin\'s newest whenever members == 2)');
console.log('');

let entries;
try { entries = git(['ls-tree', '--name-only', `${PIN}:docs/research`]).split('\n').filter((l) => l.trim()); }
catch (e) { refuse(`ls-tree failed: ${String(e.message).split('\n')[0]}`); }
const rounds = entries.filter((e) => e.startsWith('round') && e.endsWith('-instruments'));
if (rounds.length === 0) refuse('0 round*-instruments directories — an empty listing is not a reading');

let noInterval = 0, revImmovable = 0, revMoved = 0, plainMoved = 0, plainStable = 0, skipped = 0;
const revMovedRows = [], plainStableRows = [];
const byMembers = new Map(); // members -> {moved, stable}

for (const r of rounds) {
  const ps = `docs/research/${r}/`;
  let adds;
  try { adds = git(['log', '--diff-filter=A', '--reverse', '--format=%H', PIN, '--', ps]).trim(); }
  catch (e) { skipped++; continue; }
  if (adds === '') { skipped++; continue; }
  const list = adds.split('\n');
  if (list.length === 1) { noInterval++; continue; }

  const mid = list[list.length - 2];           // PENULTIMATE, not second
  const firstAt = (rev, reverse) => {
    const args = ['log', '--diff-filter=A', '--format=%H'];
    if (reverse) args.push('--reverse');
    args.push(rev, '--', ps);
    const out = git(args).trim();
    return out === '' ? null : out.split('\n')[0];
  };

  let rMid, rPin, pMid, pPin;
  try { rMid = firstAt(mid, true); rPin = firstAt(PIN, true); pMid = firstAt(mid, false); pPin = firstAt(PIN, false); }
  catch (e) { skipped++; continue; }
  if ([rMid, rPin, pMid, pPin].some((x) => x === null)) { skipped++; continue; }

  // A sanity check the first probe did not have: the endpoint must actually hold FEWER members
  // than the pin, or the comparison is degenerate again in a new way.
  const midCount = git(['log', '--diff-filter=A', '--format=%H', mid, '--', ps]).trim().split('\n').length;
  if (midCount >= list.length) { skipped++; continue; }

  if (rMid === rPin) revImmovable++;
  else { revMoved++; revMovedRows.push(`${r}  members=${list.length}  --reverse [0] MOVED`); }

  const slot = byMembers.get(list.length) ?? { moved: 0, stable: 0 };
  if (pMid !== pPin) { plainMoved++; slot.moved++; }
  else { plainStable++; slot.stable++; plainStableRows.push(`${r}  members=${list.length}  no-flag [0] STABLE at ${pMid.slice(0, 8)}`); }
  byMembers.set(list.length, slot);
}

const tested = revImmovable + revMoved;
console.log(`round*-instruments directories at the pin : ${rounds.length}`);
console.log(`  members == 1, NO INTERVAL of their own  : ${noInterval}   (not counted as agreement)`);
console.log(`  members >  1, differentially tested      : ${tested}`);
console.log(`  skipped / degenerate endpoint             : ${skipped}`);
console.log('');
console.log('-- under --reverse --');
console.log(`  IMMOVABLE : ${revImmovable} of ${tested}`);
console.log(`  MOVED     : ${revMoved}`);
for (const row of revMovedRows.slice(0, 10)) console.log(`     ${row}`);
console.log('');
console.log('-- without the flag (newest-first) --');
console.log(`  MOVED  : ${plainMoved} of ${tested}`);
console.log(`  STABLE : ${plainStable}`);
for (const row of plainStableRows.slice(0, 10)) console.log(`     ${row}`);
console.log('');
console.log('-- no-flag outcome BROKEN OUT BY MEMBER COUNT, so a forced cell cannot hide in a total --');
for (const [m, v] of [...byMembers.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  members=${String(m).padStart(2)}  moved ${String(v.moved).padStart(3)}  stable ${String(v.stable).padStart(3)}`);
}
console.log('');
if (tested === 0) {
  console.log('** 0 selections tested — a refusal, not a result.');
} else {
  console.log(`CONCLUSION, on a non-degenerate interval for all ${tested} selections with members > 1:`);
  console.log(`  --reverse [0] immovable ${revImmovable}/${tested} · no-flag [0] moved ${plainMoved}/${tested}.`);
  console.log(`  probe-redundant's 29-of-64 for the no-flag arm is SUPERSEDED: it was 29 over the 29`);
  console.log(`  selections whose interval had room, and forced-stable over the 35 with members == 2.`);
  console.log(`  The --reverse arm is unchanged at ${revImmovable}/${tested} and was never affected.`);
}
console.log('');
console.log(`REDUNDANT2: rounds=${rounds.length} nointerval=${noInterval} tested=${tested} revimmovable=${revImmovable} revmoved=${revMoved} plainmoved=${plainMoved} plainstable=${plainStable} skipped=${skipped}`);
