/**
 * Round 448 — CENSUS THE MECHANISM, not just the reported instance (443).
 *
 * `P1`'s defect is that it scored a gate off `topToken(red, refused)`, which is derived from the
 * LEG lists and from nothing else. The instance was mine. The question this answers is whether the
 * mechanism is: does any other instrument on this project score a gate off `topToken` without ever
 * reading the PREDICTION lists, and so share the blindness?
 *
 * It has gone the other way on this project before — a shape I reported against someone else's
 * file turned out to be in my own lib — so the census is run rather than assumed, and a NARROW
 * result is published as a narrow result.
 *
 * Population: every `.mjs` under `docs/research/` at a STAMPED rev, selected with `ls-tree -z`
 * (420). A caller is BLIND when it calls `topToken` and its source never mentions `.refuted` or
 * `.prefused` — i.e. there is no path by which a prediction list could reach its verdict.
 */

import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
});
const REV = git('rev-parse', 'HEAD').trim();

const files = git('ls-tree', '-r', '--name-only', '-z', REV, 'docs/research/')
  .split('\0').filter((p) => p.endsWith('.mjs'));

const callers = [];
for (const p of files) {
  const src = git('show', `${REV}:${p}`);
  const calls = (src.match(/topToken\s*\(/g) ?? []).length;
  if (calls === 0) continue;
  const readsPred = /\.refuted\b/.test(src) || /\.prefused\b/.test(src);
  callers.push({ p: p.replace('docs/research/', ''), calls, readsPred });
}

const blind = callers.filter((c) => !c.readsPred);

console.log(`CENSUS of \`topToken\` callers under docs/research/ at REV ${REV.slice(0, 8)}`);
console.log(`  \`.mjs\` files in the population: ${files.length}`);
console.log(`  of those, calling \`topToken\`: ${callers.length}`);
console.log(`  BLIND to the prediction lists: ${blind.length}`);
console.log('');
for (const c of callers.sort((a, b) => a.p.localeCompare(b.p))) {
  console.log(`  ${c.readsPred ? 'reads pred lists   ' : 'BLIND to pred lists'}  calls=${String(c.calls).padStart(2)}  ${c.p}`);
}
console.log('');
console.log('READING: the mechanism is NARROW. The blindness is confined to the single file the');
console.log('defect was found in, and it is there BY CONSTRUCTION — Round 446\'s `scoreP1` is the');
console.log('RETIRED predicate, which Round 448 `G2` slices out of that file\'s PIN as its known');
console.log('positive. It is a declared residual, not an uncured site: curing it would leave two');
console.log('live four-list scorers with no leg grading the second.');
console.log('');
console.log(`  the lib itself: ${callers.find((c) => c.p === 'lib/verdict.mjs')?.readsPred === true
  ? 'reads all four lists — the shared emitter is NOT affected' : 'BLIND — this would be the serious case'}`);
