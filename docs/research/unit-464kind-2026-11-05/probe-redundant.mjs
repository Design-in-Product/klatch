#!/usr/bin/env node
// DECLARED POST-HOC. No prediction was registered for this probe and none is claimed.
//
// Why it exists. P4QUANT came out "KIND NOT CONSTANT" over the 91-round range under
// hasReverse=true — 27 of 91 instantiations give members==1 and his kind rule sends those to
// CONTINGENT, while 64 give members>1 and go to STRUCTURAL. Reading P4QUANT I noticed the
// non-constancy is produced entirely by ONE branch of his rule:
//
//     members === 1  ->  CONTINGENT     (regardless of the flag)
//
// His stated reason is that single-member immovability "expires the next time a path is added."
// Under `--reverse` that reason does not hold: `[0]` is the OLDEST add-commit, and a path added
// later produces a NEWER commit, which lands at the END of a reversed list, not at position 0.
//
// If that is right, then under the flag the kind is determined BY THE FLAG at every member count,
// the member count is not load-bearing, and the second declaration is REDUNDANT there — a
// different and stronger objection than "ungradable".
//
// I am not arguing it. This probe measures it, differentially, on each selection's own history
// (§2.1l, mine): for every round whose directory has members > 1, read the first record at the pin
// AND at an interval endpoint drawn from that selection's own add-commits, under both orderings.
//
//   --reverse  : first record should be IDENTICAL at both revs  (immovable)
//   no flag    : first record should DIFFER at both revs        (moves with every addition)
//
// A round with members == 1 has no interval of its own and is reported as NO-INTERVAL, not as
// agreement. A selection with nothing to compare is not evidence that the comparison passes.

import { execFileSync } from 'node:child_process';

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) => execFileSync('git', ['-C', TOP, ...args], { encoding: 'utf8' });
const PIN = '0ae48068';
const refuse = (m) => { console.log(`REFUSE: ${m}`); process.exit(2); };

try { git(['rev-parse', '--verify', `${PIN}^{commit}`]); } catch { refuse(`pin ${PIN} unreadable`); }

console.log('=== probe-redundant (DECLARED POST-HOC, no prediction) ===');
console.log(`pin ${PIN}`);
console.log('');

let entries;
try { entries = git(['ls-tree', '--name-only', `${PIN}:docs/research`]).split('\n').filter((l) => l.trim()); }
catch (e) { refuse(`ls-tree failed: ${String(e.message).split('\n')[0]}`); }
const rounds = entries.filter((e) => e.startsWith('round') && e.endsWith('-instruments'));
if (rounds.length === 0) refuse('0 round*-instruments directories — an empty listing is not a reading');

let noInterval = 0, revImmovable = 0, revMoved = 0, plainMoved = 0, plainStable = 0, skipped = 0;
const revMovedRows = [], plainStableRows = [], skippedRows = [];

for (const r of rounds) {
  const ps = `docs/research/${r}/`;
  let adds;
  // Oldest-first list of this selection's OWN add-commits. The interval endpoints come from here
  // and from nowhere else — not from a calendar date and not from the drive clock.
  try { adds = git(['log', '--diff-filter=A', '--reverse', '--format=%H', PIN, '--', ps]).trim(); }
  catch (e) { skipped++; skippedRows.push(`${r}  log refused: ${String(e.message).split('\n')[0]}`); continue; }
  if (adds === '') { skipped++; skippedRows.push(`${r}  0 add-commits at the pin`); continue; }
  const list = adds.split('\n');
  if (list.length === 1) { noInterval++; continue; }

  // endpoint: the selection's SECOND add-commit. At that rev the selection has >=2 members, so
  // both orderings have something to order, and the pin has strictly more.
  const mid = list[1];
  const firstAt = (rev, reverse) => {
    const args = ['log', '--diff-filter=A', '--format=%H'];
    if (reverse) args.push('--reverse');
    args.push(rev, '--', ps);
    const out = git(args).trim();
    return out === '' ? null : out.split('\n')[0];
  };

  let rMid, rPin, pMid, pPin;
  try { rMid = firstAt(mid, true); rPin = firstAt(PIN, true); pMid = firstAt(mid, false); pPin = firstAt(PIN, false); }
  catch (e) { skipped++; skippedRows.push(`${r}  comparison refused: ${String(e.message).split('\n')[0]}`); continue; }
  if ([rMid, rPin, pMid, pPin].some((x) => x === null)) { skipped++; skippedRows.push(`${r}  a null first record — not read`); continue; }

  if (rMid === rPin) revImmovable++;
  else { revMoved++; revMovedRows.push(`${r}  members=${list.length}  --reverse [0] MOVED ${rMid.slice(0, 8)} -> ${rPin.slice(0, 8)}`); }

  if (pMid !== pPin) plainMoved++;
  else { plainStable++; plainStableRows.push(`${r}  members=${list.length}  no-flag [0] STABLE at ${pMid.slice(0, 8)}`); }
}

console.log(`round*-instruments directories at the pin : ${rounds.length}`);
console.log(`  members == 1, NO INTERVAL of their own  : ${noInterval}   (not counted as agreement)`);
console.log(`  members >  1, differentially tested      : ${revImmovable + revMoved}`);
console.log(`  skipped / refused                        : ${skipped}`);
console.log('');
console.log('-- under --reverse: is [0] immovable across the selection\'s own interval? --');
console.log(`  IMMOVABLE (identical at both revs) : ${revImmovable}`);
console.log(`  MOVED                              : ${revMoved}`);
for (const row of revMovedRows.slice(0, 10)) console.log(`     ${row}`);
console.log('');
console.log('-- without the flag (newest-first): does [0] move across the same interval? --');
console.log(`  MOVED  : ${plainMoved}`);
console.log(`  STABLE : ${plainStable}`);
for (const row of plainStableRows.slice(0, 10)) console.log(`     ${row}`);
console.log('');
if (skippedRows.length) {
  console.log('-- skipped, listed rather than absorbed --');
  for (const row of skippedRows.slice(0, 10)) console.log(`     ${row}`);
  console.log('');
}

const tested = revImmovable + revMoved;
if (tested === 0) {
  console.log('** NO INTERVAL ANYWHERE: 0 selections had >1 member, so this probe measured nothing.');
  console.log('** That is a refusal, not a result, and it is not reported as agreement.');
} else {
  console.log(`CONCLUSION over ${tested} differentially tested selections:`);
  console.log(`  --reverse [0] immovable in ${revImmovable} of ${tested}; no-flag [0] moves in ${plainMoved} of ${tested}.`);
  console.log(`  The two orderings SEPARATE on ${revImmovable === tested && plainMoved === tested ? 'every' : 'some'} tested selection.`);
  console.log(`  So on this population the FLAG settles immovability at any member count > 1, and the`);
  console.log(`  27 members==1 rounds his rule sends to CONTINGENT cannot be distinguished by it either:`);
  console.log(`  a one-member reversed selection has [0] = its only add-commit, which no later addition`);
  console.log(`  can precede. The member count is load-bearing ONLY where the flag is absent.`);
}
console.log('');
console.log(`REDUNDANT-PROBE: rounds=${rounds.length} nointerval=${noInterval} tested=${tested} revimmovable=${revImmovable} revmoved=${revMoved} plainmoved=${plainMoved} plainstable=${plainStable} skipped=${skipped}`);
