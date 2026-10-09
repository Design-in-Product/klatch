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
 *
 * PIN-NEUTRALITY: that default is safe for the VERDICT and unsafe for the PIN, and the two point
 * in opposite directions. `ran` — the integer in `All ${ran} regression checks passed`, which
 * `sweep-probes.mjs` pins per probe with an `expect:` regex — counts untagged verdicts too. So a
 * probe migrating a hand-rolled tail to {@link summariseAndExit} must tag every measurement with a
 * **non-regression kind** (`kind: 'measurement'`), or `All 3` becomes `All 5` and the sweep reddens.
 *
 * Do not clear that red by restaging the pin to the larger integer. Restaging accepts the inflated
 * population and promotes those measurements to hard checks: a failing measurement then returns
 * code 1, where the tagged shape leaves the probe green. The red is loud; the contract change that
 * clears it is silent. Driven both ways in `probe-round325` C1-C3; Theseus found the condition in
 * Round 324 §5, against a Round 323 §3 recipe of mine that called migration "pin-neutral by
 * construction" without stating it.
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
   * It exists so that the alternative to it is not "don't call `skip()` at all", which loses
   * the record entirely. If you reach for it, the test is whether an operator could make the
   * arm run by changing something about the machine. If they could, it is a skip.
   *
   * This list is not prose. `probe-round224` arm E reads the line below, measures the real
   * caller population under `scripts/`, and goes red when the two disagree — in either
   * direction. Until 2026-09-29 the same arm asserted the population was *empty*, which is why
   * it reddened the day the hatch was first used for what it was built for. Add a caller, add
   * it here; the red names the file you missed.
   *
   * INAPPLICABLE-CALLERS: probe-round291, probe-round292
   */
  inapplicable?: string[];
  /** Which `kind` counts as a hard check. Default `'regression'`. */
  regressionKind?: string;
};

/**
 * Round 355, Daedalus — Theseus's Round 354 mechanism, found in this module.
 *
 * He found it in a research key: a guard that watches member **identity** cannot see a corrupted
 * member **value**, because `(h === 'label')` is false for every value outside the declared domain
 * and not only for a missing one. The same shape is here, in the shared lib every probe in the
 * fleet summarises through, and the consequence is one grade worse than a moved figure.
 *
 * `kind` is a free-form `string` whose legal values are declared in prose above and enforced
 * nowhere. Every comparison in `summarise` is `=== regressionKind`. So:
 *
 * ```
 *   a FAILING hard check, kind: 'regression'   ->  code 1,  1 of 3 regression check(s) FAILED.
 *   the same row,         kind: 'regresion'    ->  code 0,  All 2 regression checks passed.
 *   the same row,         kind omitted          ->  code 1  (the `?? regressionKind` default)
 *   a HARD skip,          kind: 'regresion'    ->  code 0  (vs code 3 INCONCLUSIVE tagged)
 * ```
 *
 * Driven directly against this function, known negative graded first. One byte, two separate
 * exit-code inversions: a red becomes `exit 0` with the word "passed" in it, and a hard skip
 * stops forcing 3. The docblock on {@link ProbeVerdict} reasons carefully about the MISSING case
 * and defaults it IN, which is the safe direction; nothing reasons about the WRONG case, and the
 * wrong case defaults OUT. That asymmetry is the whole defect.
 *
 * **Why this is not cured with a fixed domain.** A census of every literal `kind:` under
 * `scripts/` (194 files) finds `regression` 72, `measurement` 62, `open` 6, `check` 9, `hard` 3,
 * `open-item` 2 — plus unrelated `kind` fields on other objects entirely. `regressionKind` is
 * caller-configurable by design and the soft kinds are deliberately open-ended, so a fixed list
 * here would redden legitimate probes, and an optional opt-in list would be decorative for every
 * probe that never opts in (Round 352: a selector on optional metadata fails silently).
 *
 * **The invariant that does hold:** only a misspelling of `regressionKind` can change the exit
 * code, and no legitimate soft kind has any reason to be one typo away from the hard kind. So a
 * kind within edit distance 1 of `regressionKind` — substitution, insertion, deletion, or
 * transposition — and not equal to it is refused: code 3, naming the row, printing no "passed".
 * Limit, stated: a typo two or more edits out (`rgerssion`) is NOT caught, and a kind that is a
 * legitimately different word remains unexamined. This narrows the hole; it does not close it.
 */
const withinOneEdit = (a: string, b: string): boolean => {
  if (a === b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  // Transposition of two adjacent characters (Damerau), which Levenshtein scores as 2.
  if (a.length === b.length) {
    const d: number[] = [];
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) d.push(i);
    if (d.length === 1) return true;
    return d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]];
  }
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  for (let i = 0; i <= short.length; i += 1) {
    if (long.slice(0, i) + long.slice(i + 1) === short) return true;
  }
  return false;
};

/**
 * Decide the outcome without printing or exiting — so a control can drive this function
 * directly and assert on the result rather than scraping a subprocess's stdout.
 */
export function summarise(input: SummariseInput): ProbeOutcome {
  const regressionKind = input.regressionKind ?? 'regression';
  const inapplicable = input.inapplicable ?? [];

  // Round 355 — refuse rather than report, per the note on `withinOneEdit` above. This runs
  // before any count is taken, because every count below is computed by equality against
  // `regressionKind` and a near-miss silently leaves the population that decides the exit code.
  const nearMisses: string[] = [
    ...input.results
      .filter((r) => r.kind !== undefined && withinOneEdit(r.kind, regressionKind))
      .map((r) => `verdict [${r.arm}] ${r.check} — kind=${JSON.stringify(r.kind)}`),
    ...(input.skipped ?? [])
      .filter((s): s is { label: string; kind?: string } => typeof s !== 'string')
      .filter((s) => s.kind !== undefined && withinOneEdit(s.kind, regressionKind))
      .map((s) => `skip ${s.label} — kind=${JSON.stringify(s.kind)}`),
  ];
  if (nearMisses.length > 0) {
    return {
      code: 3,
      headline: `INCONCLUSIVE — ${input.probeName} carries ${nearMisses.length} kind value(s) one `
        + `edit from ${JSON.stringify(regressionKind)} without being it. Every count here is an `
        + `equality against that string, so these rows have silently left the population that `
        + `decides the exit code. This is not a pass.`,
      ran: 0,
      failed: [],
      reasons: nearMisses.map((m) => `kind is one edit from ${JSON.stringify(regressionKind)}: ${m}`),
    };
  }

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
