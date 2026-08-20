#!/usr/bin/env node
/**
 * How far can the restriction be pushed *away from the offered start* without leaving the
 * `evictedMarking` family? — the arithmetic for a distance arm, 2026-08-20 (START), Theseus.
 *
 * **Why this exists.** Round 63 §4 recorded a hazard as a hypothetical: four of five N1 runs
 * read `offered start + 6…10` rows and stopped, and N1's restriction happened to sit at
 * offered-start **+1**, so a short read still caught it. *"Put it 12 rows into a 27-row offer
 * and that appetite misses on four runs of five while `tookTheAddress` and `withinAnOffer` both
 * score `true`."* That is the most product-relevant failure this instrument has ever pointed at
 * and it has never been run.
 *
 * Round 63 §7 proposed getting there by *swapping* the restriction in front of the handover.
 * Daedalus's 2026-08-20 memo §4 shows that swap varies two things at once — direction of
 * reference **and** speech-act type (restriction-on-a-known-item is not available at row 5,
 * because nothing has been handed over yet). This file asks whether the same hazard is
 * reachable by moving **one** field, `gapPairs`, which changes the restriction's distance from
 * the fact and nothing else about the speech act.
 *
 * **Answer: yes, but not on `FILLER`.** The bound is `gapPairs ≤ fillerPairs − 9`, so the
 * shared 12-pair list caps the offset at **+5** — inside the observed appetite *floor* of +6,
 * which means the cheap version cannot produce a miss and is not worth running. See §5 of
 * `docs/research/round66-fifth-filler-constraint-and-the-distance-arm-bound-2026-08-20.md`.
 *
 * **The formulas are asserted against measured arms, not derived and trusted.** Arm M's and arm
 * N1's ordinals were produced by the live instrument (M: five live runs, Round 62; N1: five live
 * runs plus two independent `--dry` renders, Rounds 63/64) and are checked below. A geometry
 * calculator that agrees with nothing is the same trivial agreement Round 59 warned about.
 *
 * Zero cost: pure arithmetic, no server, no model calls, nothing written.
 *
 * Usage:  node scripts/geometry-distance-arm.mjs
 * Exit:   0 formulas reproduce every measured arm · 1 a formula disagrees with a measurement
 */

/** Carried window, `carried-context.ts:38` — read this session, not recalled. */
const CARRIED_CONTEXT_MAX_MESSAGES = 20;
/** `recall.ts:647` — read this session. One expand call renders at most this many rows. */
const RECALL_MAX_EXPAND_ROWS = 30;

/**
 * The `evictedMarking` seeding loop (`probe-recall-tool.mjs:1226-1241`) as algebra.
 *
 *   2·L  lead pairs · 2 seed · 2·G gap pairs · 2 marking · 2·(F−G) rest · 2 restate
 *
 * `G` moves the marking later and moves **nothing else** — the seed row, the total, both offers
 * and the window edge are all functions of `L` and `F` only. That is the whole reason this is
 * the one-variable manipulation the swap is not.
 */
function geometry({ leadPairs: L, fillerPairs: F, gapPairs: G }) {
  const total = 2 * L + 2 * F + 6;
  const seedRow = 2 * L + 1;                    // the fact — the row the search hits
  const restateRow = total - 1;                 // the second hit
  const markRow = 2 * L + 2 * G + 3;
  const markAckRow = markRow + 1;
  // Radius-2 excerpt around the first hit → offers are everything before and everything after.
  const leadOffer = [1, 2 * L - 2];
  const trailOffer = [2 * L + 4, total];
  const windowStart = total - CARRIED_CONTEXT_MAX_MESSAGES + 1;
  return {
    total, seedRow, restateRow, markRow, markAckRow, leadOffer, trailOffer, windowStart,
    leadWidth: leadOffer[1] - leadOffer[0] + 1,
    trailWidth: trailOffer[1] - trailOffer[0] + 1,
    /** Rows from the offered start to the restriction — the quantity a short read has to cover. */
    markOffset: markRow - trailOffer[0],
    /** The arm is only in this family if the restriction is out of the carried window. */
    evicted: markAckRow < windowStart,
    evictionMargin: windowStart - markAckRow,
  };
}

// ── Assert against arms whose ordinals were measured, not derived ────────────
//
// M: Round 62, five live runs; re-rendered `--dry` 2026-08-19. N1: Round 63, five live runs;
// `--dry` twice, by two agents independently (2026-08-19 START and the Round 64 baseline).
const MEASURED = [
  {
    name: 'M  (Round 62, live ×5 + --dry)', cfg: { leadPairs: 4, fillerPairs: 12, gapPairs: 1 },
    expect: { total: 38, seedRow: 9, markRow: 13, leadOffer: [1, 6], trailOffer: [12, 38] },
  },
  {
    name: 'N1 (Round 63, live ×5 + --dry ×2)', cfg: { leadPairs: 15, fillerPairs: 12, gapPairs: 1 },
    expect: { total: 60, seedRow: 31, markRow: 35, restateRow: 59, leadOffer: [1, 28], trailOffer: [34, 60] },
  },
];

const disagreements = [];
for (const { name, cfg, expect } of MEASURED) {
  const g = geometry(cfg);
  for (const [field, want] of Object.entries(expect)) {
    const got = g[field];
    const same = Array.isArray(want) ? want.join(',') === got.join(',') : want === got;
    if (!same) disagreements.push(`${name}: ${field} — measured ${want}, formula ${got}`);
  }
}
if (disagreements.length) {
  console.log('formulas disagree with measured arms — nothing below can be trusted:');
  for (const d of disagreements) console.log(`  ✗ ${d}`);
  process.exit(1);
}
console.log(`formulas reproduce ${MEASURED.length} measured arms exactly:`);
for (const { name } of MEASURED) console.log(`  ✓ ${name}`);

// ── The observed appetite, from runs, not from theory ────────────────────────
//
// Six points across three offer geometries: N1 live ×4 at +10, +7, +7, +6; M4 at +8; F/L modal
// at +8. The fifth N1 run took its whole 27-row offer verbatim, so it is not an appetite point.
const APPETITE = { floor: 6, ceiling: 10 };

// ── The bound ────────────────────────────────────────────────────────────────
console.log(`\ncarried window ${CARRIED_CONTEXT_MAX_MESSAGES} · expand cap ${RECALL_MAX_EXPAND_ROWS} · ` +
            `observed read appetite offered-start +${APPETITE.floor}…+${APPETITE.ceiling}\n`);
console.log('  F   maxG  markOffset  margin   lead×trail (at closest-to-equal L)   verdict');

for (const F of [12, 17, 21, 25]) {
  // Eviction: markAckRow < windowStart  ⇔  2G + 4 < 2F − 13  ⇔  G ≤ F − 9.
  const maxG = F - 9;
  // Offers are equal when 2L − 2 = 2F + 3, whose RHS is odd — so they are **never** exactly
  // equal in this family. Closest is L = F + 3, leading dearer by exactly one row. At F = 12
  // that is L = 15, which is arm N1 — reached by argument in Round 63 and by identity here.
  const L = F + 3;
  const g = geometry({ leadPairs: L, fillerPairs: F, gapPairs: Math.max(maxG, 0) });
  const verdict = maxG < 1 ? 'infeasible — no gap fits'
    : g.markOffset < APPETITE.floor ? `caps at +${g.markOffset}: inside the appetite FLOOR — cannot miss`
    : g.markOffset <= APPETITE.ceiling ? `+${g.markOffset}: inside the appetite band — ambiguous`
    : `+${g.markOffset}: clear of the ceiling by ${g.markOffset - APPETITE.ceiling}`;
  console.log(`  ${String(F).padStart(2)}  ${String(maxG).padStart(4)}  ` +
              `${String('+' + g.markOffset).padStart(10)}  ${String(g.evictionMargin).padStart(6)}   ` +
              `${String(`${g.leadWidth}×${g.trailWidth} (L=${L}, ${g.total} rows)`).padEnd(34)}  ${verdict}`);
}

console.log(`\nFILLER is 12 pairs and FILLER_LONG is 17. Neither is a free choice:`);
console.log(`  · F=12 caps the offset at +5 and cannot produce the miss. The cheap arm is dead.`);
console.log(`  · F=17 reaches +15, but needs leadPairs 20 for the closest-to-equal offers —`);
console.log(`    FILLER_LEAD holds 15, so that is 5 new pairs, and both offers then exceed the`);
console.log(`    ${RECALL_MAX_EXPAND_ROWS}-row expand cap, so reading one whole takes two calls.`);
console.log(`\nNothing here licenses a build. It says which builds are arithmetically available.`);
