#!/usr/bin/env node
/**
 * recon-what-affirmed-465.mjs — Unit 465-attestdenial, 2026-11-12 WORK, Theseus
 *
 * RECON, written AFTER `drive1.clean.out` and graded by nothing. No predictions are scored here
 * and no leg in `grade-the-denial-rekey.mjs` is re-keyed on anything below: drive1 stands as the
 * graded run against the pre-registration, refutations included.
 *
 * Three questions drive1 raised and could not answer, each of which a reader of its refutations
 * would otherwise have to guess at:
 *
 *   R-A  WHAT affirmed 465? At `69cf9167` the cured key removed it (its only attestations were
 *        denials); at HEAD it does not. Something in the interval names round 465 affirmatively.
 *        Name the commit, don't infer it.
 *
 *   R-B  Did the RAW (denial-blind) population move member-for-member? drive1 scored P4 on the
 *        CURED arm and reported both raw counts as 175 — but two counts can agree while the
 *        members diverge, which is a defect this seat has already published once. Measured as a
 *        set difference in both directions, not as a count comparison.
 *
 *   R-C  Where does the standing cell's 2 → 3 come from? Its `consecutive` counts the attested
 *        population strictly above the last gated-curing round. Enumerate that slice at both revs
 *        instead of reasoning about it.
 */
import { attestedRounds, git, DENIAL_RE, SUBJECT_ROUND_RE } from '../lib/attested-rounds.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const REV_NOW = (git(REPO, ['rev-parse', 'HEAD']) ?? 'UNRESOLVED').trim();
const REV_PRIOR = (git(REPO, ['rev-parse', '69cf9167']) ?? 'UNRESOLVED').trim();
const LAST_PRODUCT_ROUND_CLAIMED = 292;

console.log('=== RECON/465-attestdenial — what affirmed 465, whether the raw set moved, and where 2 → 3 came from ===');
console.log(`REV_NOW   ${REV_NOW}`);
console.log(`REV_PRIOR ${REV_PRIOR}`);
console.log(`CLOCK     ${new Date().toISOString()}`);
console.log('');

// ── R-A ──────────────────────────────────────────────────────────────────────────────────────────
console.log('--- R-A: every commit in the interval whose subject names round 465');
const raw = git(REPO, ['log', '--format=%H\u0001%an\u0001%aI\u0001%s', `${REV_PRIOR}..${REV_NOW}`]);
if (raw === null) {
  console.log('  REFUSED — git log over the interval failed; nothing below R-A is measured');
} else {
  let hits = 0;
  for (const line of raw.split('\n').filter(Boolean)) {
    const [hash, author, date, subject = ''] = line.split('\u0001');
    const sm = SUBJECT_ROUND_RE.exec(subject);
    if (!sm || Number(sm[1]) !== 465) continue;
    const dm = DENIAL_RE.exec(subject);
    const denies = dm ? Number(dm[1]) : null;
    hits += 1;
    console.log(`  ${hash.slice(0, 8)} ${date.slice(0, 16)} ${author}`);
    console.log(`     subject : ${subject}`);
    console.log(`     affirms 465? ${denies === 465 ? 'NO — this subject DENIES it' : 'YES'}`);
  }
  console.log(`  subjects naming round 465 in the interval: ${hits}`);
}
console.log('');

// ── R-B ──────────────────────────────────────────────────────────────────────────────────────────
console.log('--- R-B: did the denial-blind population move member-for-member, or only agree on its count?');
const NEVER_RE = /$^/;
const rawNow = attestedRounds(REPO, REV_NOW, { denialRe: NEVER_RE });
const rawPrior = attestedRounds(REPO, REV_PRIOR, { denialRe: NEVER_RE });
if (rawNow === null || rawPrior === null) {
  console.log('  REFUSED — a reader did not resolve at one of the revs');
} else {
  const a = rawPrior.sorted.filter((n) => n > LAST_PRODUCT_ROUND_CLAIMED);
  const b = rawNow.sorted.filter((n) => n > LAST_PRODUCT_ROUND_CLAIMED);
  const gained = b.filter((n) => !a.includes(n));
  const lost = a.filter((n) => !b.includes(n));
  console.log(`  counts            : prior=${a.length} now=${b.length}`);
  console.log(`  gained (now∖prior): ${gained.length} → [${gained.join(',')}]`);
  console.log(`  lost   (prior∖now): ${lost.length} → [${lost.join(',')}]`);
  console.log(`  so the equal counts are ${gained.length === 0 && lost.length === 0 ? 'the same MEMBERS' : 'DIFFERENT members — the count agreement was coincidental'}`);
}
console.log('');

// ── R-C ──────────────────────────────────────────────────────────────────────────────────────────
console.log('--- R-C: the slice the standing cell counts — attested members strictly above the last gated-curing round');
const curedNow = attestedRounds(REPO, REV_NOW);
const curedPrior = attestedRounds(REPO, REV_PRIOR);
const LAST_CURING_DIR_KEY = 464; // the cell's own figure, read off drive2.standing-cell-child.out
if (curedNow === null || curedPrior === null) {
  console.log('  REFUSED — a reader did not resolve at one of the revs');
} else {
  const sl = (r) => r.sorted.filter((n) => n > LAST_CURING_DIR_KEY);
  console.log(`  above ${LAST_CURING_DIR_KEY} at REV_PRIOR : [${sl(curedPrior).join(',')}]  n=${sl(curedPrior).length}`);
  console.log(`  above ${LAST_CURING_DIR_KEY} at REV_NOW   : [${sl(curedNow).join(',')}]  n=${sl(curedNow).length}`);
  console.log(`  delta                      : ${sl(curedNow).length - sl(curedPrior).length}`);
  console.log('');
  console.log('  and what attests each member of the HEAD slice:');
  for (const n of sl(curedNow)) {
    const viaNonSubject = curedNow.nonSubject.has(n);
    const viaSubject = curedNow.affirmedBySubject.has(n);
    const denied = curedNow.deniedRounds.has(n);
    console.log(`    ${n}: non-subject source=${viaNonSubject}  affirmed by a subject=${viaSubject}  also denied somewhere=${denied}`);
  }
}
console.log('');
console.log('RECON COMPLETE — no legs, no predictions, nothing above re-scores drive1.');
