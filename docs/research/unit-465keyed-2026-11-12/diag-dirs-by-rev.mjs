#!/usr/bin/env node
/**
 * DIAGNOSTIC, not a graded arm — it carries no predictions, so it scores nothing and cannot be read
 * as a pass. It answers one question drive2's `Q4a` raised: the unit-dir count and its per-round
 * breakdown at each of tonight's revs, so a 91-vs-92 disagreement can be attributed to a rev rather
 * than to either seat's arithmetic.
 *
 * Reader imported from the subject module, as everywhere in this unit.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classifyPath, git } from '../lib/attested-rounds.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const REVS = [
  ['69cf9167', 'my memo/figures rev'],
  ['684dea64', 'my attestdenial drive rev (where 83 was taken)'],
  ['3ee13880', 'the rev HIS drive printed as head='],
  ['04414a41', 'his unit + cure commit'],
  ['1869dab6', 'his mail commit'],
  ['7f0b63e6', 'his coord+log commit'],
  ['723fe495', "Iris's commit — origin/main at this fire's open"],
  ['b1ddae20', 'my pre-reg commit (this unit is born)'],
  ['HEAD', 'now'],
];

console.log('=== DIAG/465-keyed — unit-dir population by rev (no predictions; MEAS only) ===');
console.log(`CLOCK ${new Date().toISOString()}`);
console.log('');

for (const [rev, label] of REVS) {
  const resolved = (git(REPO, ['rev-parse', rev]) ?? '').trim();
  const tree = git(REPO, ['ls-tree', '-r', '--name-only', rev]);
  if (tree === null || !resolved) {
    console.log(`  ${rev.padEnd(9)} REFUSED  ${label}`);
    continue;
  }
  const byDir = new Map();
  for (const p of tree.split('\n')) {
    const c = classifyPath(p);
    if (c.source !== 'S5') continue;
    const dir = p.split('/').slice(0, 3).join('/');
    if (!byDir.has(dir)) byDir.set(dir, c.round);
  }
  const perRound = new Map();
  for (const r of byDir.values()) perRound.set(r, (perRound.get(r) ?? 0) + 1);
  const rounds = [...perRound.keys()].sort((a, b) => a - b);
  const breakdown = rounds.map((r) => `${r}: ${perRound.get(r)}`).join(' · ');
  const sum = rounds.reduce((a, r) => a + perRound.get(r), 0);
  console.log(
    `  ${rev.padEnd(9)} dirs=${String(byDir.size).padStart(3)}  rounds=${rounds.length} {${rounds}}  ${breakdown}` +
    `${sum === byDir.size ? '' : `  ** breakdown sums to ${sum}, not ${byDir.size} **`}  (${label})`
  );
}
