#!/usr/bin/env node
/**
 * grade-t3-nonempty.mjs — Unit 465-t3nonempty, 2026-11-13 WORK, Argus
 *
 * THE MISSING CONJUNCT. Theseus's 11/12 §4 (grading his own `unit-465attestdenial`): `T3` asserts
 * the as-filed key (`B`) and the cure (`C`) agree member-for-member at `REV_NOW`, and the agreement
 * is **vacuous** there — both `removed` sets are empty, so `T3` is true in every arm he drove,
 * including the cripple built to redden it. Claimed on this seat in the 11/12 STOP memo; still open
 * and untouched this morning per both Daedalus's and Theseus's 11/13 memos §6.
 *
 * `grade-the-denial-rekey.mjs` and its four committed `.out` recordings are Theseus's stamped work
 * and are NOT edited here — re-keying a leg after its drive re-scores a graded run. This is a FRESH
 * unit: it imports the same lib, re-derives the same two arms (`B`, `C`) at the same two revs, under
 * the SAME two cripples `unit-465attestdenial/cripple-maps-predicted.md` declares, and adds the
 * fixed leg (`T3b`) beside a verbatim reproduction of the original (`T3`) — neither replacing the
 * other.
 *
 * ## The fix
 *
 *   T3   bcAgreeNow                                     — reproduced, unchanged
 *   T3b  bcAgreeNow AND (B.removed or C.removed is non-empty)   — refuses (not passes) a vacuous
 *                                                                  agreement between two empty sets
 *
 * A genuine disagreement (`bcAgreeNow === false`) is NOT gated on non-emptiness: if the keys
 * disagree, at least one `removed` set is non-empty by construction (equal removal implies equal
 * `above()`), so the gate would be redundant there and T3b tracks T3 exactly on that branch.
 *
 * ## Cripples — additive off `argv`, nothing in the tree edited
 *
 *   --cripple=blind-key      C's key becomes the never-matching one. B is untouched, at EITHER rev.
 *   --cripple=prior-as-now   REV_PRIOR := REV_NOW. T3b reads only REV_NOW, so this must not move it.
 */
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attestedRounds,
  DENIAL_RE,
  LEGACY_DENIAL_RE,
  git,
  selfTest as attestedSelfTest,
} from '../lib/attested-rounds.mjs';
import { allOf, renderVerdict, renderRows, renderPredRows } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(dirname(dirname(HERE)));

const CRIPPLES = new Set(['none', 'blind-key', 'prior-as-now']);
const cArg = process.argv.find((a) => a.startsWith('--cripple='));
const CRIPPLE = cArg ? cArg.slice('--cripple='.length) : 'none';
if (!CRIPPLES.has(CRIPPLE)) {
  console.log(`UNKNOWN CRIPPLE ${JSON.stringify(CRIPPLE)} — known: ${[...CRIPPLES].join(', ')}`);
  process.exit(3);
}

/** A regex that matches nothing — C's key under `blind-key`, same literal as the unit this grades. */
const NEVER_RE = /$^/;
const LIVE_RE = CRIPPLE === 'blind-key' ? NEVER_RE : DENIAL_RE;

const REV_NOW = (git(REPO, ['rev-parse', 'HEAD']) ?? 'UNRESOLVED\n').trim();
const REV_PRIOR_LITERAL = '69cf9167';
const REV_PRIOR = CRIPPLE === 'prior-as-now'
  ? REV_NOW
  : (git(REPO, ['rev-parse', REV_PRIOR_LITERAL]) ?? 'UNRESOLVED').trim();

console.log('=== GRADE/465-t3nonempty — T3\'s missing non-emptiness conjunct ===');
console.log(`REV_NOW   ${REV_NOW}`);
console.log(`REV_PRIOR ${REV_PRIOR}  (literal ${REV_PRIOR_LITERAL})`);
console.log(`CLOCK     ${new Date().toISOString()}`);
console.log(`CRIPPLE   ${CRIPPLE}`);
console.log('');

// ── the gate on the imported reader ──────────────────────────────────────────────────────────────
let selfOk = null;
let selfWhy = 'not run';
try {
  selfOk = attestedSelfTest() === true;
  selfWhy = selfOk ? 'true' : 'returned a non-true value';
} catch (e) {
  selfOk = false;
  selfWhy = e.message;
}

// ── B and C, at both revs ────────────────────────────────────────────────────────────────────────
const read = (rev, re) => (rev === 'UNRESOLVED' ? null : attestedRounds(REPO, rev, { denialRe: re }));
const arms = {
  now: { B: read(REV_NOW, LEGACY_DENIAL_RE), C: read(REV_NOW, LIVE_RE) },
  prior: { B: read(REV_PRIOR, LEGACY_DENIAL_RE), C: read(REV_PRIOR, LIVE_RE) },
};

const LAST_PRODUCT_ROUND_CLAIMED = 292;
const above = (r) => (r === null ? null : r.sorted.filter((n) => n > LAST_PRODUCT_ROUND_CLAIMED));

console.log('--- [MEAS] B and C, two revs');
for (const [when, rev] of [['now', REV_NOW], ['prior', REV_PRIOR]]) {
  for (const [key, label] of [['B', 'as-filed  '], ['C', 'cured/live']]) {
    const r = arms[when][key];
    console.log(
      `  M-${when}-${key}  ${label}  rev=${rev.slice(0, 8)}  `
      + `removed=[${r === null ? 'REFUSED' : r.removed.join(',')}]  `
      + `above=${r === null ? 'REFUSED' : above(r).length}`,
    );
  }
}
console.log('');

// Compared as ARRAYS with lengths, never as a joined string (a joined-string comparison cannot see
// an empty member, and two empty populations would agree vacuously) — same idiom as the unit graded.
function sameMembers(x, y) {
  if (x === null || y === null) return null;
  const ax = above(x);
  const ay = above(y);
  if (ax.length !== ay.length) return false;
  for (let i = 0; i < ax.length; i += 1) if (ax[i] !== ay[i]) return false;
  return true;
}

/** `true` iff at least one side's `removed` is non-empty. `null` propagates. */
function removedNonEmpty(x, y) {
  if (x === null || y === null) return null;
  return x.removed.length > 0 || y.removed.length > 0;
}

const bcAgreeNow = sameMembers(arms.now.B, arms.now.C);
const bcNonEmptyNow = removedNonEmpty(arms.now.B, arms.now.C);
const bcAgreePrior = sameMembers(arms.prior.B, arms.prior.C);
const bcNonEmptyPrior = removedNonEmpty(arms.prior.B, arms.prior.C);

/**
 * The fixed conjunct. A genuine disagreement is not gated on non-emptiness (it already implies
 * non-emptiness); a vacuous agreement refuses rather than passes.
 */
function t3b(agree, nonEmpty) {
  if (agree === null) return null;
  if (agree === false) return false;
  return nonEmpty === null ? null : (nonEmpty ? true : null);
}

const t3bNow = t3b(bcAgreeNow, bcNonEmptyNow);
const t3bPrior = t3b(bcAgreePrior, bcNonEmptyPrior);

console.log('--- [MEAS] T3 (reproduced) and T3b (fixed) at both revs');
console.log(`  M-bc-now    B vs C at REV_NOW:   ${bcAgreeNow === null ? 'REFUSED' : bcAgreeNow ? 'identical, member for member' : 'DISAGREE'}  nonEmpty=${bcNonEmptyNow}`);
console.log(`  M-bc-prior  B vs C at REV_PRIOR: ${bcAgreePrior === null ? 'REFUSED' : bcAgreePrior ? 'identical, member for member' : 'DISAGREE'}  nonEmpty=${bcNonEmptyPrior}`);
console.log('');

// ── legs ─────────────────────────────────────────────────────────────────────────────────────────
const legs = [];
const add = (id, ok, what) => legs.push({ id, ok, what });

add('G1', selfOk === true ? true : false,
  `[GATE  ] attested-rounds.mjs selfTest() === true — ${selfWhy}`);

const readersOk = allOf(
  arms.now.B !== null, arms.now.C !== null, arms.prior.B !== null, arms.prior.C !== null,
);
add('G2', readersOk,
  `[GATE  ] every reader resolved at both revs — now=${arms.now.C !== null} prior=${arms.prior.C !== null}`);

add('T3', bcAgreeNow,
  `[PIN   ] reproduced verbatim from unit-465attestdenial T3: B vs C at REV_NOW agree=${bcAgreeNow}`);

add('T3b', t3bNow,
  `[CLAIM ] the fixed conjunct: agree AND (removed non-empty) at REV_NOW: agree=${bcAgreeNow} nonEmpty=${bcNonEmptyNow} -> ${t3bNow}`);

add('T3-prior', bcAgreePrior,
  `[PIN   ] T3's formula at REV_PRIOR, cross-check only: agree=${bcAgreePrior}`);

add('T3b-prior', t3bPrior,
  `[CLAIM ] the fixed conjunct at REV_PRIOR: agree=${bcAgreePrior} nonEmpty=${bcNonEmptyPrior} -> ${t3bPrior}`);

// ── predictions, registered in README.md before this arm ran ───────────────────────────────────
// Both are cripple-INVARIANT: measured directly, never gated on CRIPPLE's name, so a prediction that
// turns out to depend on the arm shows up as a genuine refutation in that arm rather than being
// silently excused from it. Cross-arm comparisons (REV_PRIOR under each cripple; T3b-now holding
// still under prior-as-now) are read off the three committed drives by hand in RESULTS.md, not
// smuggled into a single arm's prediction set.
const preds = [
  {
    id: 'P1',
    landed: allOf(bcAgreeNow === true, arms.now.B.removed.length === 0, arms.now.C.removed.length === 0),
    what: 'T3 reproduces exactly, including the vacuity, at REV_NOW (B.removed=[] C.removed=[] agree=true)',
  },
  {
    id: 'P2',
    landed: t3bNow === null,
    what: 'T3b refuses the same vacuous cell at REV_NOW',
  },
];

console.log('--- legs');
console.log(renderRows(legs).join('\n'));
console.log('');
console.log('--- predictions');
console.log(renderPredRows(preds).join('\n'));
console.log('');
const line = renderVerdict({ legs, preds });
console.log(line);
const red = legs.filter((l) => l.ok === false);
const refused = legs.filter((l) => l.ok === null);
process.exit(red.length || refused.length ? 1 : 0);
