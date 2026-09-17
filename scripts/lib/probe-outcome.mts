/**
 * Probe outcome — one place for "what does this run's exit code mean?"
 *
 * ## Why this exists
 *
 * Theseus, Round 223 (`docs/mail/theseus-to-daedalus-…-your-twenty-undriven-probes-are-driven-and-two-report-success-on-a-port-they-cannot-own-2026-09-17.md` §3):
 * two probes, run against an occupied port, printed a correct diagnosis and then contradicted
 * it in the two channels a wrapper and a skimming operator actually read.
 *
 * ```
 * port 3001 is occupied — stop `npm run dev` and re-run.
 * SKIP [R] needs a free port 3001 and a readable corpus
 * SKIP [S] needs a free port 3001 and a readable corpus
 * …
 * All regression checks passed; 1 measurements recorded.
 * ---- EXIT 0 ----
 * ```
 *
 * `probe-turncount-live-http` did the same, printing `0/0 checks passed` and exiting 0.
 *
 * The knowledge was present in both runs. The defect is not the skip — skipping is right, and
 * `browse-latency`'s arm M genuinely does not need the port. The defect is that **the summary
 * aggregated over what remained** and the exit code reported the aggregate as success.
 * `All regression checks passed` is true of the empty set; `0/0 checks passed` is a summary
 * that cannot go red.
 *
 * Theseus's rule, adopted here: **a probe that skips its way to zero checks reports success.**
 * Sibling to Round 215's *a probe that only measures cannot notice that the thing it measured
 * got fixed* — in both, a construct that asserts nothing sits in the place a reader reads for
 * an assertion.
 *
 * ## The invariant this module exists to hold
 *
 * There is exactly one place in a probe that may print the word "passed", and it may only do
 * so when **the ran count is greater than zero and nothing was skipped.** Everything else is
 * INCONCLUSIVE. Encoded in {@link summariseAndExit} rather than left to each probe's tail,
 * because the four probes that had this defect each wrote that tail by hand and two got it
 * wrong in different ways.
 *
 * ## Exit codes, and why 3
 *
 * | code | meaning | who sets it |
 * |---|---|---|
 * | 0 | every regression check ran and passed | here |
 * | 1 | a regression check failed — something broke | here |
 * | 2 | refused at the door: the probe cannot own its server | `requireAnUnoccupiedPort` |
 * | 3 | ran, established less than it set out to | here |
 *
 * **3 is not new and not invented for this.** `scripts/measure-marker-floor.mjs:227` already
 * exits 3 for the same reason, in prose that could stand as this module's docstring:
 * *"enumerated 0 files. Refusing to report — an all-zero table over an empty corpus is
 * indistinguishable from a clean one."* `probe-scratch-server.mjs:233` exits 3 for an occupied
 * port. Both are "this run did not establish the thing"; so is this.
 *
 * 2 and 3 stay distinct on purpose. 2 means nothing ran and there is a clear operator action.
 * 3 means part of the run stands — a wrapper may legitimately want to tell those apart, and
 * collapsing them would lose the distinction `requireAnUnoccupiedPort` was written to make.
 */

/**
 * The shape every probe's `results` array already has. Extra fields are ignored.
 *
 * `kind` is optional because several probes (e.g. `probe-import-live-http`) record only hard
 * checks and never declared the field. A verdict with no `kind` counts as a hard check — the
 * safe reading, since the alternative silently drops it from the count that decides the exit.
 */
export type ProbeVerdict = {
  arm: string;
  check: string;
  pass: boolean;
  kind?: string;
};

export type ProbeOutcome = {
  code: 0 | 1 | 3;
  /** The single summary line. Contains "passed" only when `code === 0`. */
  headline: string;
  ran: number;
  failed: ProbeVerdict[];
  /** Why the run is inconclusive, in the order a reader should see them. */
  reasons: string[];
};

/**
 * A skipped arm. A bare string is a **hard** skip: it forces code 3, which is the safe default
 * for the four probes migrated on 2026-09-17 and for anything written without thinking about it.
 *
 * Tag the skip with the `kind` of the arm it replaced when that arm was never a hard check.
 * Driven, 2026-09-17: `probe-turncount-live-http` on a FREE port, all 5 regression checks
 * passing, exited 3 because arm J — an **open-item** arm, which by that probe's own convention
 * must not redden an exit — skipped for want of a corpus exercising the line cap. A skipped
 * open-item arm leaves a known-open item unevaluated, which is its normal state; it does not
 * leave a promised property unverified. Those are different and the first version of this
 * module treated them alike.
 *
 * That was the mirror of Theseus's Round 223 §6.2 note — *"it counted SKIP as a conclusion …
 * that reddened the two exit-0 probes for the honest half of what they do"* — made one layer up,
 * in the module written to fix the thing he found.
 */
export type SkipRecord = string | { label: string; kind?: string };

export type SummariseInput = {
  probeName: string;
  /** Every verdict recorded, of every kind. */
  results: ProbeVerdict[];
  /**
   * Arms that did not run. A bare-string entry, or one whose `kind` is the regression kind,
   * weakens the run and forces code 3. See {@link SkipRecord}.
   */
  skipped?: SkipRecord[];
  /**
   * Arms that did not run and genuinely did not apply — a corpus that legitimately contains
   * no instance of the thing, not an environment the operator can fix. These are reported and
   * do NOT force code 3.
   *
   * **No caller uses this yet** (2026-09-17). It exists so that the alternative to it is not
   * "don't call `skip()` at all", which loses the record entirely. If you reach for it, the
   * test is whether an operator could make the arm run by changing something about the
   * machine. If they could, it is a skip.
   */
  inapplicable?: string[];
  /** Which `kind` counts as a hard check. Default `'regression'`. */
  regressionKind?: string;
};

/**
 * Decide the outcome without printing or exiting — so a control can drive this function
 * directly and assert on the result rather than scraping a subprocess's stdout.
 */
export function summarise(input: SummariseInput): ProbeOutcome {
  const regressionKind = input.regressionKind ?? 'regression';
  const inapplicable = input.inapplicable ?? [];

  const labelOf = (s: SkipRecord) => (typeof s === 'string' ? s : s.label);
  const kindOf = (s: SkipRecord) => (typeof s === 'string' ? regressionKind : s.kind ?? regressionKind);
  const allSkips = input.skipped ?? [];
  /** Skips of arms that would have contributed a hard check. Only these force code 3. */
  const skipped = allSkips.filter((s) => kindOf(s) === regressionKind).map(labelOf);
  /** Skips of open-item or measurement arms: reported, but they do not weaken the run. */
  const softSkips = allSkips.filter((s) => kindOf(s) !== regressionKind).map(labelOf);

  const regressions = input.results.filter((r) => (r.kind ?? regressionKind) === regressionKind);
  const failed = regressions.filter((r) => !r.pass);
  const ran = regressions.length;

  // A failure dominates. If something broke, that is the headline even on a partial run —
  // exit 1 is the louder code and the operator's next action is the same either way.
  if (failed.length) {
    return {
      code: 1,
      headline: `${failed.length} of ${ran} regression check(s) FAILED.`,
      ran,
      failed,
      reasons: skipped.map((s) => `did not run: ${s}`),
    };
  }

  const reasons: string[] = [];
  if (ran === 0) {
    reasons.push(
      'zero regression checks ran — there is no aggregate to report, and a summary over the ' +
      'empty set cannot go red',
    );
  }
  for (const s of skipped) reasons.push(`did not run: ${s}`);

  if (reasons.length) {
    const what = ran === 0
      ? 'established nothing'
      : `established ${ran} of its checks and skipped ${skipped.length} arm(s)`;
    return {
      code: 3,
      headline: `INCONCLUSIVE — ${input.probeName} ${what}. This is not a pass.`,
      ran,
      failed: [],
      reasons,
    };
  }

  return {
    code: 0,
    headline: `All ${ran} regression checks passed.`,
    ran,
    failed: [],
    reasons: [
      ...softSkips.map((s) => `not a hard check, did not run: ${s}`),
      ...inapplicable.map((s) => `not applicable: ${s}`),
    ],
  };
}

/**
 * Print the outcome and exit. The summary names the skips rather than aggregating over what
 * remains, per Theseus's Round 223 recommendation.
 */
export function summariseAndExit(input: SummariseInput): never {
  const outcome = summarise(input);

  if (outcome.failed.length) {
    console.log('\nREGRESSIONS:');
    for (const f of outcome.failed) console.log(`  [${f.arm}] ${f.check}`);
  }
  if (outcome.reasons.length) {
    console.log('');
    for (const r of outcome.reasons) console.log(`  ${r}`);
  }
  console.log(`\n${outcome.headline}`);
  if (outcome.code === 3) {
    console.log(
      '  (exit 3 — see scripts/lib/probe-outcome.mts. 0 established, 1 broke, 2 refused to ' +
      'start, 3 ran and established less than it set out to.)',
    );
  }
  process.exit(outcome.code);
}
