/**
 * `unit-465s6bounds-2026-11-13`, arm C — ADDITIVE, one job: attribute arm B's T10 red.
 *
 * Arm B measured at-risk@6c9a4348 = [270,282,319,466] against his published [10,270,282,319,466].
 * Arms A and B are not edited. The hypothesis is that the gap is the CLASSIFIER axis and not an
 * arithmetic error on either side: I read his tree rev with HEAD's six-source classifier, he read it
 * with the five-source one his own cure replaced. If so, the same reader pointed at the sliced
 * classifier reproduces his set exactly — which makes the red an instance of the mechanism his own
 * T11 found, one figure over.
 *
 * Run:  node docs/research/unit-465s6bounds-2026-11-13/arm-s6bounds-c.mjs
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const MOD = 'docs/research/lib/attested-rounds.mjs';
const REV = '6c9a4348';

const legs = [];
function leg(id, ok, note) { legs.push({ id, ok, note }); console.log(`${ok ? 'ok  ' : 'RED '} ${id}  ${note}`); }

function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, ...args], { stdio: 'pipe', encoding: 'utf8' });
  return r.status !== 0 ? null : r.stdout;
}

/** ONE reader, pointed at whichever module it is handed. */
function atRisk(mod, rev) {
  const pop = mod.attestedRounds(REPO, rev);
  if (pop === null) return null;
  const n = new Map();
  for (const r of pop.rows) if (r.round !== null && r.denies !== r.round) n.set(r.round, (n.get(r.round) || 0) + 1);
  return [...pop.filtered].filter((x) => !pop.nonSubject.has(x) && n.get(x) === 1).sort((a, b) => a - b);
}

const live = await import(`file://${join(REPO, MOD)}`);
const baseSrc = git(REPO, ['show', `${REV}:${MOD}`]);
if (baseSrc === null) {
  console.log('VERDICT/2 REFUSED legs=0 red=[] refused=[slice]');
  process.exit(2);
}
const out = join(HERE, 'sliced-classifier-6c9a4348.mjs');
writeFileSync(out, baseSrc);
const base = await import(`file://${out}`);

const withBase = atRisk(base, REV);
const withHead = atRisk(live, REV);
leg('U1', String(withBase) === String([10, 270, 282, 319, 466]),
  `at-risk@${REV} under the FIVE-source classifier (sliced at ${REV}) = [${withBase}] — his published set`);
leg('U2', String(withHead) === String([270, 282, 319, 466]),
  `at-risk@${REV} under the SIX-source classifier (HEAD) = [${withHead}] — arm B's reading`);
leg('U3', withBase !== null && withHead !== null && withBase.length - withHead.length === 1
  && withBase.includes(10) && !withHead.includes(10),
  `the whole gap is round 10, and it is the member his own §2 says S6 protects: ` +
  `gap=[${withBase.filter((n) => !withHead.includes(n))}]`);

const pop = live.attestedRounds(REPO, REV);
leg('U4', pop !== null && pop.nonSubject.has(10) && pop.mailRounds.has(10),
  `under HEAD's classifier, 10 ∈ mailRounds=${pop && pop.mailRounds.has(10)} and ∈ nonSubject=${pop && pop.nonSubject.has(10)} ` +
  `— so S6 removes it from at-risk by doing exactly what it was taken to do`);

const red = legs.filter((l) => !l.ok).map((l) => l.id);
console.log(`VERDICT/${red.length ? 1 : 0} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=[${red}] refused=[] preds=0 refuted=[]`);
process.exit(red.length ? 1 : 0);
