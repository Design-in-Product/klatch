// recon-denial-shapes.mjs — RECON ONLY, no graded legs, no verdict, no exit code claim.
//
// Purpose: before adopting Daedalus's denial-filtered 174 (memo 2026-10-28 §3, "removed:
// exactly [465]"), enumerate the shape space his DENIAL_RE is one spelling of.
//
// His key, verbatim from unit-464t2-population-2026-10-28/grade-the-round-population.mjs:67:
//     const DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;
//
// His D1/D2/D3 legs are ALL keyed on the member 465. A population-level claim ("the removed
// set is exactly [465]") graded only by legs about 465 cannot see a second denial shape, nor
// a false positive. This recon measures the corpus; the grader beside it grades it.
//
// Pinned rev is a PARAMETER so the population is reproducible from a rev rather than from
// the drive clock or from `ls-files`.

import { execFileSync } from 'node:child_process';

const REV = process.env.REV || '10ebefaaae00f7dd4202da132bbb6de70238c020';
const FLOOR = 292; // LAST_PRODUCT_ROUND, per both our cells

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'pipe'], // never let child stderr land in the recording
  });
}

console.log(`recon-denial-shapes  REV=${REV}  FLOOR=${FLOOR}`);
console.log(`repo HEAD at drive  : ${git(['rev-parse', 'HEAD']).trim()}`);

const rows = git(['log', '--format=%H\x1f%s', REV])
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    const i = l.indexOf('\x1f');
    return { h: l.slice(0, i), s: l.slice(i + 1) };
  });
console.log(`\nsubject corpus      : ${rows.length} commits reachable from REV`);

// Every round number above FLOOR named anywhere in a subject, however spelled.
const ROUND_TOKEN = /\bround\s*(\d{3})\b/gi;

function roundsIn(subject) {
  ROUND_TOKEN.lastIndex = 0;
  const out = new Set();
  let m;
  while ((m = ROUND_TOKEN.exec(subject))) {
    const n = Number(m[1]);
    if (n > FLOOR) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

// Deliberately WIDER than any denial model: a negation/absence token anywhere in a subject
// that also names a round above the floor. Over-inclusive on purpose — the point is to hand
// read the whole candidate set, not to pre-decide it with a second regex.
const ABSENCE =
  /\b(no|not|never|none|nonexistent|non-existent|without|absent|missing|skip|skipped|lacks|lacking|isn't|doesn't|does not|did not|dropped|dead|empty|unused|phantom|invented|denies|denied|denial|retracted|withdrawn|mislabel\w*|wrong)\b/i;

const candidates = [];
for (const r of rows) {
  const nums = roundsIn(r.s);
  if (!nums.length) continue;
  if (!ABSENCE.test(r.s)) continue;
  candidates.push({ h: r.h.slice(0, 8), nums, s: r.s });
}

console.log(
  `\nCANDIDATES: subjects naming a round > ${FLOOR} AND carrying an absence token: ${candidates.length}`
);
for (const c of candidates) {
  console.log(`  ${c.h}  rounds=[${c.nums.join(',')}]`);
  console.log(`            ${c.s}`);
}

// What HIS regex catches out of that candidate set.
const HIS_DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;
console.log(`\nHIS KEY /\\bno\\s+round\\s*(\\d+)\\b/i applied to each candidate:`);
for (const c of candidates) {
  const m = HIS_DENIAL_RE.exec(c.s);
  console.log(`  ${c.h}  hisKey=${m ? `MATCH -> denies ${m[1]}` : 'no match'}`);
}

// And the complement: every subject his key matches anywhere in the corpus, floor or not.
// A key can also OVER-reach; this is the half his 465-keyed legs cannot see.
const hisHits = rows.filter((r) => HIS_DENIAL_RE.test(r.s));
console.log(`\nHIS KEY total matches across the whole corpus: ${hisHits.length}`);
for (const r of hisHits) {
  console.log(`  ${r.h.slice(0, 8)}  ${r.s}`);
}

console.log(
  `\nRECON ONLY — nothing above is a graded leg. grade-the-denial-model.mjs grades it.`
);
