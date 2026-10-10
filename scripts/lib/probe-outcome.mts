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
  /**
   * Only the boolean `true` is a pass. Round 357: this is checked by VALUE and not merely
   * believed from the declaration, because an `any` reaches here with no diagnostic and a truthy
   * non-boolean (`-1`, `'false'`, `[]`) read as a pass. See the note above `failed` in
   * {@link summarise}.
   */
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
   *
   * Round 359: read by TYPE. A present, non-nullish non-array here refuses the run at code 3
   * instead of throwing `inapplicable.map is not a function` out of the all-green limb — which,
   * driven, was the ONLY limb that could reach it. `null`/`undefined` still mean "no hatch".
   */
  inapplicable?: string[];
  /**
   * Which `kind` counts as a hard check. Default `'regression'`.
   *
   * Round 358: read by TYPE before anything is counted against it. A non-string here refuses the
   * whole run at code 3 rather than defaulting, because every count in {@link summarise} is an
   * equality against this value and an unreadable one makes `readKind`'s safe default the unsafe
   * one — driven, a failing row tagged `'regression'` came out as `All 1 regression checks
   * passed`. A string that no row carries is NOT refused in general — that is legitimate for a
   * probe that tags nothing — but a failing row stranded by it is named in `reasons` (see the note
   * beside `strandedFailures`), and Round 359 refuses the ONE stranding that cannot have been
   * meant: a configured kind that no row carries, beside a row carrying `MODULE_DEFAULT_KIND`.
   * See the note beside `invertedVocabulary` for the four conditions and the declared cost.
   */
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
 *
 * Round 356, Theseus: that refusal is code 3 only when nothing failed. A genuine failure still
 * dominates it — see the precedence note in {@link summarise} for why, and for what the first
 * version of this cure swallowed.
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
 * The kind this module counts as a hard check when the caller configures nothing — and the name
 * every untagged row is read as, via `readKind`. Named rather than spelled twice because Round 359
 * keys a refusal on it: a row carrying THIS token while the configured vocabulary is some other
 * string that no row carries is the one stranding that cannot have been meant. The literal is also
 * the most-used `kind` under `scripts/` by a factor of ~8 over the next hard-check spelling
 * (census in the {@link withinOneEdit} docblock: `regression` 72, `check` 9, `hard` 3).
 */
const MODULE_DEFAULT_KIND = 'regression';

/**
 * Decide the outcome without printing or exiting — so a control can drive this function
 * directly and assert on the result rather than scraping a subprocess's stdout.
 */
export function summarise(input: SummariseInput): ProbeOutcome {
  const regressionKind = input.regressionKind ?? MODULE_DEFAULT_KIND;

  // Round 357 — `kind` is read by TYPE, not just by equality. The missing case was already
  // defaulted IN (see {@link ProbeVerdict}); an unreadable case now defaults in the same
  // direction, which is what keeps a failing row in the population. Found by driving the limit
  // the note above `failed` records, which is why that note no longer claims a throw: four of
  // five non-string shapes DO throw inside `withinOneEdit` (`123`, `null`, `{}`, `true`), but
  // `kind: ['regression']` does not. Its length is 1 against the string's 10, so the near-miss
  // refusal's own length pre-test returns false, the equality against `regressionKind` is false,
  // and the row leaves the counted population silently: a failing hard check summarised as
  // `code 0, All 1 regression checks passed`. Same inversion as Round 355, reached by type
  // instead of by typo. I had reasoned "loud throw" and written it down; one drive found the
  // counterexample in the same minute.
  const readKind = (k: unknown): string => (typeof k === 'string' ? k : regressionKind);

  /**
   * Round 358, Theseus — `JSON.stringify` is not total, and the reason builders below are the
   * only place a value of a type nobody intended ever gets printed. Driven against the Round 357
   * limbs: a `kind` of `10n` and a `kind` of a circular object both make `JSON.stringify` THROW
   * — out of the very limb that exists to refuse instead of throwing, so the run produced no
   * headline at all and no channel named the row. A `pass` of `10n` does the same thing on the
   * code-1 path, where the verdict had already been computed correctly and then never printed.
   *
   * Byte-identical for every value `JSON.stringify` handles, which is what arm M grades as a
   * known negative — a serialisable `kind` or `pass` must come out of here unchanged, or this
   * helper has quietly rewritten the reasons the sweep's pins read.
   *
   * Residual, driven and NOT cured here: a RegExp still serialises to `{}` and a Symbol or
   * function to `undefined`-then-`String()`. The `typeof` beside it carries the information;
   * widening the printed form would change the bytes of reasons that work today, which is the
   * trade this module keeps refusing to make.
   */
  const describe = (value: unknown): string => {
    try {
      const s = JSON.stringify(value);
      if (s !== undefined) return s;
    } catch { /* BigInt and circular structures: JSON.stringify throws rather than returns */ }
    try { return String(value); } catch { return `[un-printable ${typeof value}]`; }
  };

  /**
   * Round 359, Daedalus — the escape hatch, type-read. Theseus drove this in Round 358 §5 and
   * handed the call over rather than taking it ("turning a crash into a code 3 is the demotion
   * Round 356 caught, and the hatch is yours").
   *
   * Driven again here, with every return site of this function enumerated from source rather than
   * reasoned about, because the asymmetry IS the finding and it is easy to state one limb too
   * narrowly:
   *
   * ```
   *   inapplicable: 'probe-x' | 123 | {}   green run  ->  THREW TypeError: inapplicable.map …
   *                                        red run    ->  code 1   (never reaches the hatch)
   *                                        skip / near-miss / unreadable-kind / config  ->  code 3
   *   inapplicable: null                   green run  ->  code 0   (the `?? []` default, intact)
   * ```
   *
   * So the one limb that prints "passed" was the only one that could crash, and the throwing class
   * is **present, non-nullish, non-array** — narrower than "non-array", since `null` and
   * `undefined` both mean "no hatch" by this field's own documented default and still do.
   *
   * **Why code 3 and not Theseus's demotion worry.** His concern is Round 356's: a refusal must
   * not swallow a genuine red. It cannot here, and that is driven rather than argued — beside a
   * failure the hatch is unreachable, so there is no input on which this moves a 1 to a 3. What it
   * moves is a crash with NO headline, no `REGRESSIONS:` block and no named field into a verdict
   * that names the field, its type and its value. **Why not code 0 with a reason line**, which was
   * the other candidate: nothing gates on `reasons`, so the type defect would become invisible to
   * every instrument in the fleet — curing a crash must not make the defect quieter, and a printed
   * line that gates nothing is this project's own standing failure shape.
   *
   * Limit, declared: the labels in an unreadable hatch are not salvaged into the list. A string is
   * the plausible slip (`inapplicable: 'probe-x'`) and wrapping it would be guessing at intent, so
   * the value is printed in the reason instead — the label survives, in a channel that names it as
   * unreadable rather than as a declared inapplicable arm.
   */
  const hatch: unknown = input.inapplicable;
  const inapplicable: string[] = Array.isArray(hatch) ? hatch : [];
  const hatchProblems: string[] = (hatch === undefined || hatch === null || Array.isArray(hatch))
    ? []
    : [`inapplicable is ${typeof hatch} ${describe(hatch)}, not an array of labels. Every arm this `
      + `run meant to declare inapplicable is unread, so what this run set out to do is not `
      + `knowable from it. The value is quoted here in case it WAS the label.`];

  const labelOf = (s: SkipRecord) => (typeof s === 'string' ? s : s.label);
  const kindOf = (s: SkipRecord) => (typeof s === 'string' ? regressionKind : readKind(s.kind));
  const allSkips = input.skipped ?? [];
  /** Skips of arms that would have contributed a hard check. Only these force code 3. */
  const skipped = allSkips.filter((s) => kindOf(s) === regressionKind).map(labelOf);
  /** Skips of open-item or measurement arms: reported, but they do not weaken the run. */
  const softSkips = allSkips.filter((s) => kindOf(s) !== regressionKind).map(labelOf);

  /**
   * Round 361, Daedalus — the run's account of its own SCOPE, carried on every limb.
   *
   * Measured per return site rather than reasoned about, with all eight enumerated from source and
   * each driven with the same inputs. Of the four reporting channels this function has, two were
   * wired to exactly one limb — and it is the limb that prints `passed`:
   *
   * ```
   *   hard skips          carried on 7 of 7 limbs they can reach   (`did not run:`)
   *   unreadable hatch    carried on 7 of 7 limbs it can reach     (`inapplicable is …`)
   *   soft skips          the code-0 limb, and no other
   *   inapplicable arms   the code-0 limb, and no other
   * ```
   *
   * So this module named the complaint that a run's scope is UNREADABLE everywhere, and dropped the
   * scope itself the moment the run had bad news. Driven on the live shape: `probe-round291` builds
   * its `inapplicable` list by pushing arm C1's label (the arm whose docblock exists to justify
   * declaring it inapplicable rather than skipped, per this module's own stated test), and on a run
   * where one of its forty rows goes red the summary is `1 of 40 regression check(s) FAILED.` with
   * **`reasons: []`** — the scope declaration is not de-emphasised, it is absent, and the reader of
   * the red run cannot tell that two arms were deliberately excluded.
   *
   * `hatchProblems`' own sentence is the argument: *"what this run set out to do is not knowable
   * from it."* That was true of an unreadable hatch and it was equally true of a readable one on
   * seven of eight limbs. Same shape as Round 356 (the skips dropped by the near-miss limb), 357
   * (the unreadable kinds) and 359 (the inverted vocabulary), one field over — and the first of
   * those three is in this module's own history, so the rule was already written down here.
   *
   * Carried LAST in every limb's `reasons`, after `skipped`: a declared non-contribution is the
   * weakest statement in the list, and appending leaves every existing reason's relative order
   * untouched, so no published figure moves. Named once and spread, rather than spelled at eight
   * sites, because eight copies of a reporting rule is how the first two limbs came to disagree.
   *
   * **NOT** seeded into the `reasons` gate below (the one whose `.length` decides code 3): a run
   * that declares an inapplicable arm and passes everything else is green, and seeding it would
   * convert exactly those runs — the trap the note beside that array already warns about. Driven
   * over 2592 inputs: zero code movements, in either direction.
   *
   * **The two halves are not carried on the same limbs, and Theseus's arm O is why.** The first
   * version of this cure spread both everywhere, and cell O3 of his Round 360 arm reddened inside
   * the minute: `not a hard check, did not run:` is *the sentence his round is named after*, and
   * `softSkips` is a classification computed by an equality against `regressionKind` (`kindOf`).
   * On a limb that is refusing the run BECAUSE that vocabulary is unreliable — unreadable
   * (`configProblems`), one edit off (`nearMisses`), or inert (`invertedVocabulary`) — asserting
   * which skips were "not hard checks" asserts the one thing the headline above it says is not
   * knowable, about a skip that declared itself a hard check in this module's own default
   * vocabulary. So that half is gated and the `inapplicable` half is not: an inapplicable arm is
   * declared by the caller outright and is keyed on no vocabulary at all.
   *
   * On the code-0 limb all three of those lists are empty by construction (each has its own limb
   * above this one), so the gate is always open there and that limb's bytes do not move.
   */
  const softSkipReasons = softSkips.map((s) => `not a hard check, did not run: ${s}`);
  const inapplicableReasons = inapplicable.map((s) => `not applicable: ${s}`);

  const regressions = input.results.filter((r) => readKind(r.kind) === regressionKind);

  /** Rows and skips whose `kind` is present but not a string. Defaulted IN above; named here. */
  const unreadableKinds: string[] = [
    ...input.results
      .filter((r) => r.kind !== undefined && typeof r.kind !== 'string')
      .map((r) => `verdict [${r.arm}] ${r.check} — kind is ${typeof r.kind} `
        + `${describe(r.kind)}, not a string. Counted as a ${describe(regressionKind)} `
        + `check, which is the safe direction; fix the field.`),
    ...allSkips
      .filter((s): s is { label: string; kind?: string } => typeof s !== 'string')
      .filter((s) => s.kind !== undefined && typeof s.kind !== 'string')
      .map((s) => `skip ${s.label} — kind is ${typeof s.kind} ${describe(s.kind)}, not a `
        + `string. Counted as a ${describe(regressionKind)} skip, which is the safe `
        + `direction; fix the field.`),
  ];

  // Round 357, Daedalus — Theseus handed this over undriven in Round 356 ("`pass` is not
  // value-guarded (`!r.pass`, so a truthy non-boolean reads as a pass)"), and driven it inverts
  // an exit code the same way the Round 355 `kind` typo did. `pass` is declared `boolean` and
  // every one of the 62 callers is a `.mts` file inside `scripts/tsconfig.json`, so this is only
  // reachable where something defeats the checker — which `any` does silently, being assignable
  // to `boolean` with no diagnostic under `strict`.
  //
  // Measured with the CHECKER rather than a regex (a regex over `pass:` returns 243 sites, mostly
  // prose and parameter declarations): **9** `any`-typed values reach a boolean verdict position
  // in the live tree, and all 9 hand-read as `typeof … === 'string' && ….includes(…)`, `.some(…)`,
  // `.every(…)`, `!…` or `… && … === false` — runtime-boolean-or-throw. So the live count of
  // actual non-booleans is **zero**; what is missing is anything HOLDING it at zero. The shape one
  // edit away is `pass: anyValue.indexOf(x)`, where `-1` is truthy.
  //
  // Driven against this function before the cure:
  //
  // ```
  //   pass: false      ->  code 1,  1 of 2 regression check(s) FAILED.     (correct)
  //   pass: 'FAIL'     ->  code 0,  All 2 regression checks passed.
  //   pass: -1         ->  code 0,  All 2 regression checks passed.
  //   pass: []         ->  code 0,  All 2 regression checks passed.
  //   pass: 'false'    ->  code 0,  All 2 regression checks passed.
  //   pass: undefined  ->  code 1   (falsy — already a loud red, and must stay one)
  // ```
  //
  // **Why this counts as a failure and is not refused.** Round 356 is the reason. My Round 355
  // cure refused a near-miss with code 3 and thereby demoted a genuinely failing check from 1 to
  // 3; Theseus found it. A falsy non-boolean is a loud `code 1` TODAY, so refusing here would
  // repeat that mistake in the other half of the same function. `r.pass !== true` instead of
  // `!r.pass` is monotone louder in both directions: every all-boolean run is byte-identical, a
  // truthy non-boolean moves from a silent pass to a named red, and a falsy one does not move at
  // all. The denominator needs no floor language either — an unreadable row is still a
  // regression-kinded row, so it is counted in `ran`; only a near-miss removes rows.
  //
  // The rows are named in `reasons` as well as in `failed`, because `failed` alone prints
  // `[A] the thing holds` and sends the operator to look for a product defect that is not there.
  // That is this module's Round 223 shape again: the knowledge was in the run.
  //
  // Round 358, Theseus — the two sentences that stood here were the Round 357 note's own
  // unverified half ("a non-string `kind` … throws inside `withinOneEdit` instead — loud …
  // Recorded, not cured"), and both halves were false by the time the commit landed: the type IS
  // cured, thirty lines up, and the shape that found the cure does not throw. The Round 357
  // comment above `readKind` says "that note no longer claims a throw"; the note did, in the same
  // commit, because the correction and the superseded prose were written a minute apart. Driven
  // and replaced rather than deleted, because the mechanism generalises past the one shape:
  // `withinOneEdit` throws only on a value with NO `.length` (`{}`, `123`, `true`) and drops the
  // row SILENTLY on every value that has one — `['regression']` (length 1), `new Array(10)`
  // (length 10, which reaches the equal-length diff loop and comes out false), `{ length: 10 }`,
  // and a function (length 0, its arity). So the silent class is "has a length", not "is an
  // array", and the throw was the exception rather than the rule.
  const failed = regressions.filter((r) => r.pass !== true);
  const unreadable = regressions.filter((r) => typeof r.pass !== 'boolean');
  const unreadableReasons = unreadable.map(
    (r) => `pass is not a boolean — verdict [${r.arm}] ${r.check} carries `
      + `${typeof r.pass} ${describe(r.pass)}. Counted as a FAILURE: an unreadable verdict `
      + `is not a pass. Fix the verdict's type; this row says nothing about the subject either way.`,
  );
  const ran = regressions.length;

  // Round 355 — refuse rather than report, per the note on `withinOneEdit` above. Computed
  // before any outcome is returned, because every count above is an equality against
  // `regressionKind` and a near-miss silently leaves the population that decides the exit code.
  const nearMisses: string[] = [
    // Round 357 — `typeof === 'string'` rather than `!== undefined`: `withinOneEdit` indexes and
    // slices its arguments, so a non-string `kind` threw here (driven: `123`, `null`, `{}`,
    // `true`). The unreadable case is reported through `unreadableKinds` instead.
    // Round 358 — and `typeof regressionKind === 'string'` for the same reason on the other
    // operand. The field is declared `string` and guarded below, but `withinOneEdit` must not be
    // the thing that discovers it isn't one: a non-string RIGHT operand neither throws nor
    // returns usefully, it just answers "not a near-miss" for every row.
    ...(typeof regressionKind !== 'string' ? [] : input.results
      .filter((r) => typeof r.kind === 'string' && withinOneEdit(r.kind, regressionKind))
      .map((r) => `verdict [${r.arm}] ${r.check} — kind=${describe(r.kind)}`)),
    ...(typeof regressionKind !== 'string' ? [] : (input.skipped ?? [])
      .filter((s): s is { label: string; kind?: string } => typeof s !== 'string')
      .filter((s) => typeof s.kind === 'string' && withinOneEdit(s.kind, regressionKind))
      .map((s) => `skip ${s.label} — kind=${describe(s.kind)}`)),
  ];
  const nearMissReasons = nearMisses.map(
    (m) => `kind is one edit from ${describe(regressionKind)}: ${m}`,
  );

  /**
   * Round 358, Theseus — the field the Round 355/357 cures compare everything AGAINST.
   *
   * Both cures guard the row's `kind`: one byte out of place at the row site is refused (355), a
   * type out of place at the row site is defaulted IN and named (357). Nothing guards
   * `regressionKind` itself, and every count in this function is an equality against it — so a
   * `regressionKind` that is not a string makes the safe default UNSAFE. `readKind` hands an
   * unreadable row `regressionKind`, which then equals itself by identity and is counted; a row
   * carrying the string `'regression'` does not equal a non-string and leaves the population.
   *
   * Driven, over a population of one kind-tagged failing row and one untagged passing row:
   *
   * ```
   *   regressionKind: ['regression']  ->  code 0, ran 1, All 1 regression checks passed
   * ```
   *
   * The failing row is absent from `failed`, so no REGRESSIONS block prints and the headline is
   * the one this module exists to make impossible. It is the Round 355 inversion reached through
   * the CONFIGURATION rather than the data, and the near-miss refusal cannot see it: its own
   * first act is a length pre-test against the same unreadable operand.
   *
   * Refused rather than defaulted, which is the opposite call from `readKind` thirty lines up and
   * deliberately so: an unreadable ROW can be defaulted in a safe direction because the rest of
   * the run is still readable, and an unreadable VOCABULARY has no safe direction — every count
   * in the function is already keyed on it by the time anything could be defaulted. A failure
   * still dominates (Round 356), so this can only ever turn an exit 0 into an exit 3.
   *
   * Live cost measured, not assumed: three files supply `regressionKind`, all three supply the
   * literal `'regression'`, and all three tag at least one verdict with it.
   */
  const configProblems: string[] = typeof regressionKind === 'string' ? [] : [
    `regressionKind is ${typeof regressionKind} ${describe(regressionKind)}, not a string. Every `
    + `count in this summary is an equality against that value, and an unreadable \`kind\` is `
    + `defaulted to it — so rows tagged with a STRING kind have silently left the population `
    + `while untagged rows were counted. No verdict below can be trusted either way.`,
  ];

  /**
   * Round 358 — the same inversion with a tsc-legal string, reported and NOT refused.
   *
   * `regressionKind: 'check'` over the same mixed population returns `code 0, All 1 regression
   * checks passed` with the failing row absent, and needs no `any` at all: `'check'` is a
   * `string`, untagged rows are explicitly blessed above, and Round 311 drove the configuration
   * mismatch over a HOMOGENEOUS population, where it lands on `ran 0 → code 3` and is loud. One
   * untagged row in the same run is the whole difference between code 3 and code 0.
   *
   * Why a reason and not a refusal: every refusal I could write for this false-reds a legitimate
   * shape. "No row carries the configured kind" is legitimate for a probe that tags nothing;
   * "a stranded row is failing" is legitimate for a deliberately-failing `kind: 'open-item'` row
   * beside untagged hard checks, which is this module's own documented minimal-tagging style. So
   * this limb puts the knowledge in the run — the rule this module was built on — and leaves the
   * exit-code call to the seat that owns the vocabulary. Narrowed to FAILING stranded rows, so a
   * conventional `kind: 'measurement'` row (always `pass: true` in all three helper shapes) adds
   * no line to a green run.
   */
  const carriesTheKind = input.results.some((r) => r.kind === regressionKind);
  const strandedFailures = carriesTheKind ? [] : input.results
    .filter((r) => typeof r.kind === 'string' && r.kind !== regressionKind
      && !(typeof regressionKind === 'string' && withinOneEdit(r.kind, regressionKind))
      && r.pass !== true)
    .map((r) => `NOT COUNTED, and it is a failure — verdict [${r.arm}] ${r.check} carries kind `
      + `${describe(r.kind)}, the regression kind is ${describe(regressionKind)}, and no row in `
      + `this run carries that kind. Every row that WAS counted carries no \`kind\` of its own. `
      + `If this row was meant to be a hard check, the exit code above does not include it.`);

  /**
   * Round 359, Daedalus — the string half of Round 358 §4, refused on the one key that does not
   * false-red a shape this module's own docblocks defend. Theseus handed the call over explicitly
   * ("if the answer is that a row tagged with the module's own default name can only ever have
   * meant hard check, that is a narrower cure than anything I could grade, and it's yours").
   *
   * His blocking argument is correct as stated and both of the refusals he tried do false-red:
   *
   * ```
   *   "no row carries the configured kind"  ->  false-reds a probe that tags NOTHING    (blessed)
   *   "a stranded row is failing"           ->  false-reds a failing `kind: 'open-item'`
   *                                             row beside untagged hard checks         (blessed)
   * ```
   *
   * The key that dodges both is the identity of the stranded token, not the shape of the run.
   * Refuse only when ALL FOUR hold: the configured kind is a string, it is NOT
   * `MODULE_DEFAULT_KIND`, NO row carries it, and some row carries `MODULE_DEFAULT_KIND`. Then the
   * configuration is inert — every counted row was counted by `readKind`'s default rather than by
   * the configuration — and the one row that declared itself a hard check in this module's own
   * vocabulary is the one the configuration excluded. **The safe default and the configuration
   * disagree, and the row lost.**
   *
   * Driven against both of his known negatives, which is the condition this cure had to meet:
   *
   * ```
   *   tags nothing,        rk 'check'      ->  code 0   no row carries 'regression'  (unmoved)
   *   failing 'open-item', rk default      ->  code 0   rk IS the default            (unmoved)
   *   failing 'open-item', rk 'check'      ->  code 0   stranded token is not ours   (unmoved)
   *   failing 'regression',rk 'check'      ->  code 3   REFUSED                      (the cure)
   *   passing 'regression',rk 'check'      ->  code 3   REFUSED                      (see below)
   *   failing untagged beside either       ->  code 1   a failure still dominates    (Round 356)
   * ```
   *
   * Round 311's three arms are also in this population and all three are unmoved: C1/C2 drive the
   * default `regressionKind` (so the second condition fails), and C3 supplies `regressionKind:
   * 'check'` over a row that CARRIES `'check'` (so the third fails). That probe is the near-miss in
   * the literature — it drove this mismatch over a homogeneous population, got `ran 0 → code 3`,
   * and recorded it as "a trap rather than a defect"; its C1/C2 pin the homogeneous case, which is
   * why nothing in the tree noticed the mixed one arriving. Left where it is, re-read not re-pinned.
   *
   * **Refused regardless of the stranded row's `pass`,** which is wider than the `reasons` line
   * below it and deliberately so: the defect is in the configuration, not in the row. A passing
   * stranded row means `ran` is counting a population that a declared hard check has left, and the
   * exit code is right by luck. A `pass`-keyed refusal would also have made the cure's reachability
   * depend on the subject's health, which is the property that makes a guard untestable.
   *
   * Declared cost, the one shape this refuses that a sufficiently contrary caller could have meant:
   * renaming the hard-check vocabulary to something else while using `'regression'` as the name of
   * a SOFT kind. Nothing in the tree does this (three files supply `regressionKind`, all three
   * supply `'regression'`), and it would mean using this module's own default token for the
   * opposite of its meaning. Priced and accepted, rather than discovered later.
   *
   * Round 360, Theseus — both of this key's population conditions read `input.results` only, and
   * `summarise` counts TWO populations against `regressionKind`. `skipped` is the other one, via
   * `kindOf` → `readKind` thirty lines up. Three of the four other `kind`-reading guards in this
   * function already read both (`unreadableKinds`, `nearMisses`, and `kindOf` itself); this key and
   * `strandedFailures` read one. Driven, with the member list checked in both directions:
   *
   * ```
   *   skip {kind:'regression'}, DEFAULT rk            ->  code 3  hard skip          (correct)
   *   skip {kind:'regression'}, rk 'check'            ->  code 0  "All 1 regression checks passed."
   *                                                       + "not a hard check, did not run: X"
   *   the same, plus a RESULTS row tagged 'regression' ->  code 3  REFUSED (condition 4 held)
   * ```
   *
   * So the demotion a skip-carried inversion produces is **3 → 0**, which is worse than the
   * results-row case this key was built for: a skip that declared itself a hard check in this
   * module's own vocabulary is reported on the green limb under a line that denies it
   * (`not a hard check, did not run:`), beside the one headline this module exists to prevent.
   * It is the sentence `probe-round224` is named after, reached through the skip population.
   *
   * Live instances **0**, and the honest version of that number is the near miss: `probe-round250`
   * is the only self-configuring caller that tags a skip `'regression'` (its Z3), and it is
   * protected by condition 4 via its `check()` helper's results rows rather than by anything that
   * reads its skips — so a single edit renaming its vocabulary is the whole distance.
   *
   * Widened by adding the skip population to both conditions, and NOT by loosening either one:
   * condition 3 now fails when a SKIP carries the configured kind, because such a skip is selected
   * by the configuration (`kindOf` makes it a hard skip and it forces code 3) — so the
   * configuration is not inert and this key's own reason line, which says it "counted nothing",
   * was false of exactly that run. Driven before the widening: that run refused with that sentence.
   *
   * The reason and headline keep their Round 359 bytes whenever the carriers are all rows, which
   * is every shape in Daedalus's 33-case corpus: the skip clause is additive, so his published
   * table is byte-identical after this change rather than re-aimed around it.
   */
  const taggedSkipKinds: unknown[] = allSkips
    .filter((s): s is { label: string; kind?: string } => typeof s !== 'string')
    .map((s) => s.kind);
  /** Condition 3, over both counted populations. `carriesTheKind` is left alone: `strandedFailures` keys on it. */
  const configuredKindIsCarried = carriesTheKind || taggedSkipKinds.includes(regressionKind);
  const defaultRows = input.results.filter((r) => r.kind === MODULE_DEFAULT_KIND).length;
  const defaultSkips = taggedSkipKinds.filter((k) => k === MODULE_DEFAULT_KIND).length;
  /** Condition 4, over both counted populations. */
  const defaultCarriers = defaultRows + defaultSkips;
  /** `"1 row(s)"` when no skip carries it — byte-identical to Round 359 — and named when one does. */
  const carrierPhrase = defaultSkips === 0
    ? `${defaultRows} row(s)`
    : `${defaultRows} row(s) and ${defaultSkips} skip(s)`;

  const invertedVocabulary: string[] = (
    typeof regressionKind === 'string'
    && regressionKind !== MODULE_DEFAULT_KIND
    && !configuredKindIsCarried
    && defaultCarriers > 0
  ) ? [
      `the configured regressionKind ${describe(regressionKind)} is carried by NO row in this run, `
      + `while ${carrierPhrase} carry `
      + `${describe(MODULE_DEFAULT_KIND)} — this module's own default, and the name every untagged `
      + `row is counted under. So the configuration counted nothing and excluded the rows that `
      + `declared themselves hard checks. Fix the configuration or the rows; which of these is a `
      + `hard check is not knowable from this run.`,
    ] : [];

  /**
   * Round 361 — see the note beside `softSkipReasons`. Defined here rather than beside its two
   * halves because the gate reads all three vocabulary complaints, and `invertedVocabulary` is the
   * last of them to be computed.
   */
  const vocabularyIsTrustworthy = configProblems.length === 0
    && nearMisses.length === 0
    && invertedVocabulary.length === 0;
  const scopeDeclared: string[] = [
    ...(vocabularyIsTrustworthy ? softSkipReasons : []),
    ...inapplicableReasons,
  ];

  // A failure dominates. If something broke, that is the headline even on a partial run —
  // exit 1 is the louder code and the operator's next action is the same either way.
  //
  // Round 356, Theseus — and it dominates a near-miss too, which is why this limb is here and
  // not below the refusal. Round 355's refusal was correct about an untrustworthy COUNT and
  // wrong about precedence: returning early, it demoted a GENUINELY failing hard check from
  // code 1 to code 3 and emptied `failed`, so {@link summariseAndExit} printed no REGRESSIONS
  // block and no channel of the run named the row that broke. Driven against both functions on
  // one input (`{ regression/false, regression/true, regresion/true }`):
  //
  // ```
  //   pre-355   code 1  failed 1  names [A] THE REAL BREAK
  //   355       code 3  failed 0  names nothing — only the typo
  //   356       code 1  failed 1  names the break AND the typo, denominator declared a floor
  // ```
  //
  // That is this module's own Round 223 shape one more turn in: the knowledge was in the input
  // and absent from every channel a reader reads. The reachability is exactly the refusal's own
  // — a typo'd kind — and the two coincide more often than they look, because the agent most
  // likely to mistype a `kind` is the one mid-edit on the probe, who is also the one most likely
  // to have just broken something. So: stay red, name the rows, and refuse the DENOMINATOR
  // rather than the verdict — `ran` is reported as a floor, since a near-miss can only have
  // removed rows from the counted population, never added them.
  if (failed.length) {
    return {
      code: 1,
      headline: nearMisses.length === 0
        ? `${failed.length} of ${ran} regression check(s) FAILED.`
        : `${failed.length} of ${ran} regression check(s) FAILED — and ${ran} is a floor, not the `
          + `total: ${nearMisses.length} kind value(s) one edit from ${JSON.stringify(regressionKind)} `
          + `left the counted population. Fix the kind and re-run; the failure above stands either way.`,
      ran,
      failed,
      // Unreadable rows first: they explain which of the names printed above is a type defect
      // rather than a broken subject.
      // Round 359 — `invertedVocabulary` and `hatchProblems` are carried here too, because a run
      // can hold a failure AND a configuration this unreadable, and the failure limb returning
      // first must not be the reason the configuration goes unnamed. Same reason Round 356 added
      // the skips to the near-miss limb and 357 the unreadable kinds.
      reasons: [
        ...configProblems, ...invertedVocabulary, ...strandedFailures,
        ...unreadableReasons, ...unreadableKinds, ...nearMissReasons,
        ...hatchProblems, ...skipped.map((s) => `did not run: ${s}`),
        ...scopeDeclared,
      ],
    };
  }

  // Round 358 — the vocabulary itself is unreadable. Below the failure limb, so this can only
  // ever turn an exit 0 into an exit 3 and never a 1 into a 3 (Round 356's lesson, kept).
  if (configProblems.length > 0) {
    return {
      code: 3,
      headline: `INCONCLUSIVE — ${input.probeName} was summarised against a \`regressionKind\` of `
        + `type ${typeof regressionKind}, not a string. Every count here is an equality against `
        + `that value, so which rows are hard checks is not knowable from this run. `
        + `This is not a pass.`,
      ran,
      failed: [],
      reasons: [
        ...configProblems, ...unreadableKinds, ...hatchProblems,
        ...skipped.map((s) => `did not run: ${s}`), ...scopeDeclared,
      ],
    };
  }

  if (nearMisses.length > 0) {
    return {
      code: 3,
      headline: `INCONCLUSIVE — ${input.probeName} carries ${nearMisses.length} kind value(s) one `
        + `edit from ${JSON.stringify(regressionKind)} without being it. Every count here is an `
        + `equality against that string, so these rows have silently left the population that `
        + `decides the exit code. This is not a pass.`,
      ran: 0,
      failed: [],
      // Round 356 — the skips too. The early return dropped them, and a run can carry both.
      // Round 357 — and the unreadable kinds, for the same reason: a run can carry both.
      reasons: [
        ...invertedVocabulary, ...strandedFailures, ...unreadableKinds, ...nearMissReasons,
        ...hatchProblems, ...skipped.map((s) => `did not run: ${s}`), ...scopeDeclared,
      ],
    };
  }

  // Round 359 — the configured vocabulary counted nothing and excluded the rows that named
  // themselves hard checks. Below the failure limb AND below the near-miss limb: a failure still
  // dominates (Round 356), and a `regressionKind` one edit from the default is better diagnosed as
  // the typo it is than as an inversion. See the note beside `invertedVocabulary` for the four
  // conditions and for both of the Round 358 known negatives this is keyed to clear.
  if (invertedVocabulary.length > 0) {
    return {
      code: 3,
      headline: `INCONCLUSIVE — ${input.probeName} was summarised against a \`regressionKind\` of `
        + `${JSON.stringify(regressionKind)} that no row carries, while ${carrierPhrase} carry `
        + `${JSON.stringify(MODULE_DEFAULT_KIND)}. The rows that declared themselves hard checks `
        + `were the ones the configuration left out. This is not a pass.`,
      ran,
      failed: [],
      reasons: [
        ...invertedVocabulary, ...strandedFailures, ...unreadableKinds, ...hatchProblems,
        ...skipped.map((s) => `did not run: ${s}`), ...scopeDeclared,
      ],
    };
  }

  // Round 357 — an unreadable `kind` on an otherwise-clean run gets its own limb rather than
  // being folded into either neighbour, because both neighbours would describe it wrongly. The
  // near-miss headline says the rows "have silently left the population", which is the opposite
  // of what happens here (they are defaulted IN); the skip headline below would read
  // `established 2 of its checks and skipped 0 arm(s)`. Code 3 rather than 0: the field that
  // decides the population is of a type nobody intended, so this run has not established what it
  // set out to, and this module's standing rule is to refuse rather than print "passed" beside a
  // defect. Live cost measured, not assumed: zero non-string `kind` values under `scripts/`.
  if (unreadableKinds.length > 0) {
    return {
      code: 3,
      headline: `INCONCLUSIVE — ${input.probeName} carries ${unreadableKinds.length} \`kind\` `
        + `value(s) that are not strings. Each was counted as a `
        + `${JSON.stringify(regressionKind)} check, which is the safe direction, so no verdict `
        + `below is understated — but the field that decides the population is the wrong type. `
        + `This is not a pass.`,
      ran,
      failed: [],
      reasons: [
        ...strandedFailures, ...unreadableKinds, ...hatchProblems,
        ...skipped.map((s) => `did not run: ${s}`), ...scopeDeclared,
      ],
    };
  }

  // NOT seeded with `strandedFailures` — `reasons.length` is the gate for code 3 below, and
  // seeding it would convert exactly the green runs this limb is deliberately not refusing.
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
      reasons: [...strandedFailures, ...hatchProblems, ...reasons, ...scopeDeclared],
    };
  }

  // Round 359 — the escape hatch is not a list. Last of the code-3 limbs, because every one above
  // it is a stronger statement about the run, and `inapplicable` decides no population: it is the
  // only field here whose unreadability costs the run its own account of its SCOPE rather than its
  // verdicts. See the note beside `hatchProblems` for why this is a refusal and not a reason line,
  // and for the driven reason it cannot demote a failure.
  if (hatchProblems.length > 0) {
    return {
      code: 3,
      headline: `INCONCLUSIVE — ${input.probeName} declared its inapplicable arms as `
        // No "passed" in this string, deliberately: this module's own invariant is that exactly
        // one limb may print that word. The first draft of this headline read "Every hard check
        // passed; …" and arm N of `probe-round224` reddened on it in the same minute — which is
        // the arm doing its job, so the sentence is written the long way round instead.
        + `${typeof hatch}, not an array, so the arms it meant to exclude are unreadable. Every `
        + `hard check was established and none failed; what this run set out to COVER is not `
        + `knowable from it. This is not a pass.`,
      ran,
      failed: [],
      reasons: [...hatchProblems, ...strandedFailures, ...scopeDeclared],
    };
  }

  return {
    code: 0,
    headline: `All ${ran} regression checks passed.`,
    ran,
    failed: [],
    reasons: [
      // Round 358 — first, because on this limb they are the only thing in the run that says the
      // headline above is counting a population a failing row has left.
      ...strandedFailures,
      ...scopeDeclared,
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
