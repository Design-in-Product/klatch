/**
 * Verifier for `lib/offer-choice.mjs` — replays published rounds through the scorer.
 *
 * Built 2026-08-18 (START fire, Daedalus) alongside the module, for the reason
 * `verify-recogniser-equivalence.mjs` exists: the numbers this scorer produces get
 * written into round documents, so the scorer needs a check that does not depend on
 * spending money or on trusting the person who wrote it.
 *
 * **What it checks, and what it cannot.** The fixtures below are transcribed from the
 * per-run `offered | asked` tables *published* in Rounds 61 and 62 — which are, as of
 * this fire, the only surviving record of those runs: the raw JSONs live in `.testdata/`
 * and are deleted at end of fire (Round 62 §9). So this verifies that the scorer
 * reproduces the published record. It cannot verify the published record against the
 * runs. That gap is the subject of Round 62 §7's open question about committing raw
 * JSONs, and §3 below is what the gap costs.
 *
 *   node scripts/verify-offer-choice.mjs
 *
 * Zero API calls, no database, no server.
 */

import { scoreOfferChoice, formatOfferChoice } from './lib/offer-choice.mjs';

const CONV = 'vesper-1-1';
const o = (from, to) => ({ conversation: CONV, from, to });
const search = (...offers) => ({ kind: 'search', offeredAddresses: offers });
const expand = (from, to, ...offers) =>
  ({ kind: 'expand', expand: o(from, to), offeredAddresses: offers });

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}` +
    (ok ? `  = ${JSON.stringify(actual)}` : `  expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`));
};

// ── Round 62, arm M: the fixture, transcribed from the round doc's §2 table ──────
//
// Two offers on every search render (leading `1-6`, trailing `12-38`), fact at seq 9,
// restriction at seq 13, 38 rows. The offers attributed to *expand* renders are the ones
// the table records "in the result".
const MARKING = { markingSeqs: [13], markingConversation: CONV };
const ROUND62 = {
  M1: [search(o(1, 6), o(12, 38)), search(o(1, 6), o(12, 38)), expand(12, 38)],
  M2: [search(o(1, 6), o(12, 38)), search(o(1, 6), o(12, 38)), expand(1, 6, o(7, 38))],
  M3: [search(o(1, 6), o(12, 38)), search(o(1, 6), o(12, 38))],
  M4: [search(o(1, 6), o(12, 38)), search(o(1, 6), o(12, 38)),
       expand(1, 6, o(7, 38)), expand(12, 20, o(1, 11), o(21, 38))],
  M5: [search(o(1, 6), o(12, 38)), search(o(1, 6), o(12, 38)), expand(1, 6, o(7, 38))],
};

// ── Round 61, arm L: the single-offer control ────────────────────────────────────
//
// Every arm before M seeded the fact at row 1, so every excerpt was flush left and every
// render offered exactly one address. L expanded 5/5 and held the restriction 5/5. The
// fixture matters because the new fields' whole claim is that they read *the same* as the
// old ones on one offer and differently on two; a module verified only against M could
// not support that.
const ROUND61 = {
  L1: [search(o(4, 30)), expand(4, 30)],
  L2: [search(o(4, 30)), expand(4, 30)],
  L3: [search(o(4, 30)), expand(4, 12)],
  L4: [search(o(4, 30)), expand(4, 30)],
  L5: [search(o(4, 30)), expand(4, 12)],
};
// L's restriction sits at seq 5 (Round 61; the `expectation` string prints marking seqs
// `[5]`), so on L *both* the whole offer and the cut-down 4-12 cover it — which is why
// L reads 5/5 on `expansionHeldTheMarking` and why one offer cannot ask M's question.
const MARKING_L = { markingSeqs: [5], markingConversation: CONV };

const scoreAll = (runs, marking) =>
  Object.fromEntries(Object.entries(runs).map(([k, calls]) =>
    [k, scoreOfferChoice({ calls, ...marking })]));

const M = scoreAll(ROUND62, MARKING);
const L = scoreAll(ROUND61, MARKING_L);
const countM = (f) => Object.values(M).filter((s) => s[f]).length;
const countL = (f) => Object.values(L).filter((s) => s[f]).length;

console.log('\n── 1. Arm M reproduces the numbers Round 62 published ──────────────────\n');

// Round 62 §1 and §4: expanded at all 4/5, expansion held the restriction 2/5.
check('runs that expanded (doc: 4/5)', Object.values(M).filter((s) => s.expandCalls > 0).length, 4);
check('runs taking a covering address (doc: held the restriction 2/5)', countM('tookACoveringAddress'), 2);
check('  and they are M1 and M4 (doc §4)',
  Object.entries(M).filter(([, s]) => s.tookACoveringAddress).map(([k]) => k), ['M1', 'M4']);

// Round 62 §5/§7: the field that carried the round and did not exist.
check('runs that expanded somewhere non-covering instead (the new failure mode)',
  countM('tookANonCoveringAddressInstead'), 2);
check('  and they are M2 and M5 (doc §5)',
  Object.entries(M).filter(([, s]) => s.tookANonCoveringAddressInstead).map(([k]) => k), ['M2', 'M5']);
check('runs declining by never expanding (doc §4: M3)',
  Object.entries(M).filter(([, s]) => s.declinedByNotExpanding).map(([k]) => k), ['M3']);

// Round 62 §3: `from` is a copied field, and 0 of them was 4.
check('every asked start was an offered start (doc §3: copied, 6/6)',
  Object.values(M).filter((s) => s.expandCalls > 0).every((s) => s.everyAskedStartWasOffered), true);
check('asked starts, all runs (doc §3: every from was 1 or 12)',
  [...new Set(Object.values(M).flatMap((s) => s.perCall.map((p) => p.asked.from)))].sort((a, b) => a - b),
  [1, 12]);
check('any asked start equal to 4 (doc §3: 0)',
  Object.values(M).flatMap((s) => s.perCall).filter((p) => p.asked.from === 4).length, 0);

// Round 62 §3's precision point, now a field rather than a hand observation.
check('calls copying a start from a stale render, not the freshest (doc §3: M4 call 4)',
  Object.entries(M).flatMap(([k, s]) =>
    s.perCall.filter((p) => p.askedStartWasOffered && !p.copiedStartFromFreshestRender)
      .map((p) => `${k}/call${p.call}`)),
  ['M4/call4']);

// Round 62 §5: widths.
check('runs taking some offered range entire (doc §5: 4 of 5)', countM('tookSomeOfferEntire'), 4);
check('calls cutting an offer down (doc §5: M4 call 4, width 9)',
  Object.entries(M).flatMap(([k, s]) =>
    s.perCall.filter((p) => !p.matchedAnOfferVerbatim && p.withinAnOffer)
      .map((p) => `${k}/call${p.call}/w${p.widthAsked}`)),
  ['M4/call4/w9']);

// The instrument field: what makes M different from every arm before it.
check('runs facing a genuine choice of offers (M is the first arm where this is true)',
  countM('choiceWasAvailable'), 5);

console.log('\n── 2. Arm L: one offer, and the new fields agree with the old ones ─────\n');

check('runs that expanded (Round 61: 5/5)', Object.values(L).filter((s) => s.expandCalls > 0).length, 5);
check('runs taking a covering address (Round 61: held the restriction 5/5)',
  countL('tookACoveringAddress'), 5);
check('runs expanding somewhere non-covering (must be 0 — the mode needs two offers)',
  countL('tookANonCoveringAddressInstead'), 0);
check('runs facing a choice of offers (must be 0 — every earlier arm seeded at row 1)',
  countL('choiceWasAvailable'), 0);
check('calls cutting an offer down (Round 61: L3 and L5 asked 4-12 of an offered 4-30)',
  Object.values(L).flatMap((s) => s.perCall).filter((p) => !p.matchedAnOfferVerbatim && p.withinAnOffer).length, 2);

console.log('\n── 3. The expand-call count Round 62 states three times ────────────────\n');

// Round 62 says "6 expand calls" in §1 (twice) and §3, and "1 of 6 expand calls" in §5.
// Its own §2 per-run table yields 5, and two independent derivations inside the same
// document agree with the table:
//   (a) §1 records call counts 3, 3, 2, 4, 3 = 15 total, and §2 shows two searches per
//       run = 10 searches, leaving 5 expands.
//   (b) §5 lists the widths taken as 27, 6, 6, 6 whole plus M4's 9 — five widths.
// This check asserts the table's figure, so it FAILS LOUDLY if the fixture is ever
// re-transcribed to match the prose instead.
const expandCallTotal = Object.values(M).reduce((n, s) => n + s.expandCalls, 0);
check('expand calls implied by the §2 table', expandCallTotal, 5);
check('  total calls in the §2 table (§1 says 3+3+2+4+3)',
  Object.values(ROUND62).reduce((n, calls) => n + calls.length, 0), 15);
check('  searches in the §2 table (two per run)',
  Object.values(ROUND62).flat().filter((c) => c.kind === 'search').length, 10);
console.log('\n  Round 62 §1/§3/§5 say SIX. The table, the call counts and the width list all say');
console.log('  FIVE. No conclusion in Round 62 changes either way — 0 of 5 fours is still zero —');
console.log('  but "0 of 6" is in a published record three times and one of the two numbers is');
console.log('  wrong. The raw JSONs that would settle it were deleted at end of fire (§9), so');
console.log('  this is unresolvable from the repository. That is the concrete cost of not');
console.log('  committing them, and it landed on the first round after the durable-extract fix.');

console.log('\n── 4. Sample of the per-call reporting line (Theseus\'s §7 ask) ─────────\n');
console.log(`  M4 — the run with two expand calls:\n${formatOfferChoice(M.M4)}`);
console.log(`\n  M2 — the new failure mode:\n${formatOfferChoice(M.M2)}`);
console.log(`\n  M3 — never expanded:\n${formatOfferChoice(M.M3)}`);

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
