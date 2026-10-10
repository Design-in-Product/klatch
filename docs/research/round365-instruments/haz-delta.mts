/**
 * Round 365 — did any of the three files I touched gain a hazard class? Run the detector over the
 * HEAD text and the working-tree text of each, rather than reasoning about which strings it reads.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { hazards } from '../../../scripts/promote-probes.mts';

const FILES = [
  'scripts/probe-round283-the-classification-theseus-asked-for-exists-and-it-has-been-red-since-yesterday.mts',
  'scripts/probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts',
  'scripts/probe-round304-the-deferral-was-repaired-with-a-declaration-and-both-repair-shapes-redden-the-arm-that-pinned-it.mts',
];

// Known positive for the detector itself: a string the Round 296 rule classes as `suite`.
const KP = hazards('const x = "npm run test -w packages/server";');
console.log(`KP (a file naming the npm-prefixed suite script): [${KP.join(', ')}]`);
let bad = KP.includes('suite') ? 0 : 1;
if (bad) console.log('GRADE detector: false — the known positive did not class as `suite`');

for (const f of FILES) {
  const head = execFileSync('git', ['show', `HEAD:${f}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const now = readFileSync(f, 'utf8');
  const a = hazards(head).sort();
  const b = hazards(now).sort();
  const added = b.filter((c) => !a.includes(c));
  const removed = a.filter((c) => !b.includes(c));
  if (added.length) bad += 1;
  console.log(
    `${added.length ? 'ADDED' : 'OK   '} ${f.split('-').slice(0, 2).join('-')}: HEAD [${a.join(', ')}] → tree [${b.join(', ')}]` +
      `${added.length ? ` · ADDED ${added.join(', ')}` : ''}${removed.length ? ` · removed ${removed.join(', ')}` : ''}`,
  );
}

console.log(`GRADE no hazard class added by this fire: ${bad === 0}`);
if (bad !== 0) process.exit(1);
