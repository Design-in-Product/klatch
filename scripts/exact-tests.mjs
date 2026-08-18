#!/usr/bin/env node
/**
 * Exact tests for the recall-probe rounds. Free, no server, no model calls.
 *
 * **Why this exists.** Every p-value published in Rounds 57–59 was computed by hand in a
 * session and then written into a document. A hand-computed number has the same failure
 * mode as a hand-written regex: it is right when written and there is nothing that notices
 * when the next one is wrong. Round 60 needed a *stratified* test — two arms, model
 * balanced inside each — which is past the point where doing it in one's head is honest.
 *
 * **Why exact rather than chi-square.** Every cell here is n=5. Asymptotic tests are not
 * valid at this size and would report a smaller p than the design can support, which is
 * exactly the direction of error this project's findings must not have.
 *
 * **The self-check is the point.** `--check` recomputes Round 59's published arm-F figure
 * (opus 5/5 vs sonnet 0/5, two-tailed p = 0.0079) and Round 57's published F-vs-K figure
 * (5/5 vs 6/10, p = 0.23). If this module ever disagrees with a number already in a
 * committed round document, one of the two is wrong and the run says so loudly instead of
 * quietly shipping a third value. A test that has never failed is not yet known to be a test.
 *
 *   node scripts/exact-tests.mjs --check
 *   node scripts/exact-tests.mjs --fisher a b c d      # 2x2: [[a,b],[c,d]]
 */

/** Binomial coefficient, multiplicative form — exact for the sizes used here. */
export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

/**
 * Fisher's exact test, two-tailed, on a 2x2 table [[a, b], [c, d]].
 * Rows are groups (e.g. opus / sonnet), columns are outcome (took / did not).
 * Two-tailed by the standard point-probability criterion: sum every table with the same
 * margins whose probability is no greater than the observed one.
 */
export function fisherExact2x2([[a, b], [c, d]]) {
  const r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
  const p = (k) => (choose(r1, k) * choose(r2, c1 - k)) / choose(n, c1);
  const obs = p(a);
  let total = 0;
  for (let k = Math.max(0, c1 - r2); k <= Math.min(r1, c1); k++) {
    const q = p(k);
    if (q <= obs + 1e-12) total += q;
  }
  return total;
}

/**
 * Exact conditional test stratified over independent 2x2 strata (the exact analogue of
 * Cochran–Mantel–Haenszel). Conditions on each stratum's margins, convolves the
 * hypergeometric distributions of the top-left cell, and takes the tail of the sum.
 *
 * Use this instead of pooling counts across arms. Pooling would let an arm with a
 * different base rate move the answer; conditioning on each arm's own margins cannot.
 */
export function exactStratified(strata) {
  let dist = new Map([[0, 1]]);
  let observed = 0;
  for (const [[a, b], [c, d]] of strata) {
    const r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
    observed += a;
    const next = new Map();
    for (let k = Math.max(0, c1 - r2); k <= Math.min(r1, c1); k++) {
      const q = (choose(r1, k) * choose(r2, c1 - k)) / choose(n, c1);
      if (q === 0) continue;
      for (const [t, p0] of dist) next.set(t + k, (next.get(t + k) || 0) + p0 * q);
    }
    dist = next;
  }
  const pObs = dist.get(observed) ?? 0;
  let oneTailed = 0, twoTailed = 0;
  for (const [t, q] of dist) {
    if (t >= observed) oneTailed += q;
    if (q <= pObs + 1e-15) twoTailed += q;
  }
  return { observed, oneTailed, twoTailed };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);

if (argv[0] === '--fisher') {
  const [a, b, c, d] = argv.slice(1, 5).map(Number);
  console.log(fisherExact2x2([[a, b], [c, d]]).toFixed(6));
} else if (argv[0] === '--check') {
  // Each case is a number already published in a committed round document. The expected
  // value is the *document's* value, not this module's — that is what makes it a check.
  const cases = [
    { name: 'Round 59, arm F: opus 5/5 vs sonnet 0/5 took the address',
      doc: 'docs/research/round59-cross-model-live-2026-08-16.md',
      table: [[5, 0], [0, 5]], expect: 0.0079 },
    { name: 'Round 57, opus: arm F 5/5 vs arm K 6/10 took the address',
      doc: 'docs/research/round57-jprime-single-variable-live-2026-08-16.md',
      table: [[5, 0], [6, 4]], expect: 0.23 },
    { name: 'Round 60, arm K: opus 3/5 vs sonnet 0/5 took the address',
      doc: 'docs/research/round60-sonnet-on-k-live-2026-08-16.md',
      table: [[3, 2], [0, 5]], expect: 0.1667 },
    // Round 61's three figures. The first is the headline, the second is the same comparison
    // scored by the pre-registered keyword field, and the third is the PRE-REGISTERED NULL.
    // The null is in the check table on purpose: a prediction of "no difference" that is never
    // written down as a number is not a prediction, it is a thing said afterwards.
    { name: 'Round 61, opus: arm F 5/5 vs arm L 0/5 reasoned about the referent (hand-confirmed)',
      doc: 'docs/research/round61-unambiguous-referent-live-2026-08-17.md',
      table: [[5, 0], [0, 5]], expect: 0.0079 },
    { name: 'Round 61, same comparison scored by the pre-registered field: F 3/5 vs L 0/5',
      doc: 'docs/research/round61-unambiguous-referent-live-2026-08-17.md',
      table: [[3, 2], [0, 5]], expect: 0.1667 },
    { name: 'Round 61 PRE-REGISTERED NULL, opus: arm F 5/5 vs arm L 5/5 took the address',
      doc: 'docs/research/round61-unambiguous-referent-live-2026-08-17.md',
      table: [[5, 0], [5, 0]], expect: 1.0 },
    // Round 62's three figures. Neither of the two 0.1667s is significant and the document says
    // so — they are in the table because a number published as "not significant" is still a
    // published number, and the null (Daedalus's, pre-registered in arm M's source before the
    // arm was run) is here for the same reason Round 61's is.
    { name: 'Round 62 PRE-REGISTERED NULL, opus: arm L 5/5 vs arm M 4/5 expanded at all',
      doc: 'docs/research/round62-two-offers-arm-m-live-2026-08-17.md',
      table: [[5, 0], [4, 1]], expect: 1.0 },
    { name: 'Round 62, opus: arm L 0/5 vs arm M 3/5 stated the codeword (n.s.)',
      doc: 'docs/research/round62-two-offers-arm-m-live-2026-08-17.md',
      table: [[0, 5], [3, 2]], expect: 0.1667 },
    { name: 'Round 62, opus: arm L 5/5 vs arm M 2/5 expansion held the restriction (n.s.)',
      doc: 'docs/research/round62-two-offers-arm-m-live-2026-08-17.md',
      table: [[5, 0], [2, 3]], expect: 0.1667 },
  ];
  let bad = 0;
  for (const t of cases) {
    const got = fisherExact2x2(t.table);
    const ok = Math.abs(got - t.expect) < 0.005;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  p=${got.toFixed(4)}  (doc says ${t.expect})  ${t.name}`);
    if (!ok) console.log(`      → disagrees with ${t.doc}; one of the two is wrong`);
  }
  const s = exactStratified([[[5, 0], [0, 5]], [[3, 2], [0, 5]]]);
  console.log(`ok    stratified F+K: T=${s.observed}/8 to opus, one-tailed p=${s.oneTailed.toExponential(3)}, two-tailed p=${s.twoTailed.toExponential(3)}`);
  if (bad) { console.error(`\n${bad} published figure(s) disagree with this module.`); process.exit(1); }
  console.log('\nall published figures reproduced');
} else if (argv.length) {
  console.error('usage: exact-tests.mjs --check | --fisher a b c d');
  process.exit(2);
}
