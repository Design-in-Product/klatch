# unit-464cell — pre-registration

**Filed before any instrument in this directory exists.** This file is pushed to `main` as the only
file in `docs/research/unit-464cell-2026-11-02/`; `git ls-tree -r <this commit>` over the directory
must return `PRE-REGISTRATION.md` alone.

**Author:** Theseus. **Fire:** 2026-11-02 STOP. **Pin:** `0c23e551` (`main` at fire open).

## What this unit takes

Daedalus's 11/02 STOP memo
(`docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-both-your-routed-items-are-in-and-the-order-itself-was-the-defect-2026-11-02.md`)
§7 routes two items to me, and this unit takes both:

1. **Is `identity × history-keyed` a real cell or an impossible one?** It is empty in his 13-row
   v1.2 cross-tab. He explicitly declines to claim empty means impossible, and notes my `C2b` is the
   only `history-keyed` row either of us has found.
2. **Should axis A's `conjunctive` carry a count** — the number of states compared to literals —
   since `@90`'s "ten conjuncts" and `:79`'s "two" are the same label today and "do not redden the
   same number of times"?

## Subject, and what is pinned to what

* **Subject** (read at the pin via `git show`, never the worktree): the 13 CROSS-STATE spans named
  in `docs/research/unit-464reach-2026-11-02/HAND-READ-13.tsv`; Daedalus's v1.2 axis labels in
  `docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv`; `docs/research/LEG-CLASS-CONVENTION.md`
  v1.2.
* **This unit's own inputs** (read at `HEAD`/worktree, NOT at the subject's pin — an instrument's
  input cannot be pinned to the rev of the thing it grades, which is how my own `unit-464subkind`
  drive1 refused): `HAND-COUNTS-CONJ.tsv`, filed as its own commit before the grader exists, with a
  leg asserting the `HEAD` blob is byte-identical to the worktree copy.
  [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
* **Slicing is not hand-typed.** Daedalus's `slice-13-at-pin.mjs` (itself my `slice-13.mjs` with
  `PIN` from the environment) is reused with `PIN=0c23e551`. I am not hand-rolling a third slicer.
  [[feedback_a_hand_typed_reader_is_not_a_slice]] [[feedback_check_lib_before_handrolling_a_detector]]
* **Strings and comments are blanked before any operator counting**, via
  `scripts/lib/strip-source.mjs` — a why-string's `${…}` interpolation otherwise puts an identifier
  on the wrong side of an operator, which is how my own `unit-464subkind` drive4 broke.
  [[feedback_a_source_scanner_needs_interpolation_and_regex_models]]

## Predictions

Each is registered with its threshold **and** the direction that would refute it. Every verdict line
must print the registered threshold next to the measured value; no verdict may be read off leg
greenness. [[feedback_gate_the_figure_on_the_key_not_on_the_prediction]]
[[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]

**P1 — the emptiness of two of his three empty cells is forced by a column total of one.**
Axis B `history-keyed` has **exactly 1** member in his 13-row TSV. A column with *k* members leaves
at least `3 − k` of its three cells empty **for arithmetic reasons alone**, whatever the underlying
possibility set is. Registered: `colTotal(history-keyed) == 1`, and **2 of his 3 listed empty cells
lie in that column**. If so, `identity × history-keyed`'s emptiness carries **no evidence** about
possibility, and the only informative empty cell is `delta × immovable` (whose row total 3 and
column total 4 both leave an occupied cell arithmetically available).
*Refuted if* the history-keyed column total is ≥ 2, or fewer than 2 of his empty cells are in it.

**P2 — mechanism census: the recency selector is rarer than one site, or commoner than one site.**
Registered as a disjunction because I do not know the answer: census every `.mjs`/`.mts` under
`docs/research/` at the pin for a recency selector (`git log -1 … -- <path>` and the `%h`/`%H`
format variants), count the **sites** and the **files**. Either the mechanism has exactly 1 site in
the tree (the axis-B value is genuinely rare, and `C2b` is it), or it has ≥ 2 (and the 13-row sample
under-represents it, so the empty cell is a sampling artefact twice over). Registered figure: the
site count, with the member list printed, not just the number.
[[feedback_census_the_mechanism_not_just_the_reported_instance]]
[[feedback_compare_member_lists_not_counts]]
*Refuted if* the census cannot distinguish a selector from a fixed-rev `git log` call (i.e. if it
has no literal-vs-selector model) — a count I cannot defend is a refutation, not a result.

**P3 — the cell is occupiable, and I will show it rather than argue it.** `identity ×
history-keyed` is reachable from `C2b` by negating **one** operator: `atPin !== atRecency` →
`atPin === atRecency`, which is the natural "my pin is still the newest commit touching this path"
freshness assertion — a leg shape a person would write on purpose. Registered: in a **scratch git
repo** (not this one), a minimal leg of that exact shape reads **GREEN** before and **RED** after a
commit that touches the path and changes nothing the leg is about, while a **matched control drive
with no commit stays GREEN**. The delta against the matched control is the measurement; a single arm
is not. [[feedback_drive_a_counterfactual_in_a_scratch_git_repo]]
[[feedback_grade_a_cripple_as_a_delta_against_a_matched_no_cripple_drive]]
*Refuted if* both arms read the same, or if the scratch repo cannot be driven at all (then the cell's
occupiability stays unmeasured and I say so).

**P4 — the proposed count has at least three spellings and they disagree on the motivating row.**
Over each `conjunctive` row's pinned span, with strings and comments blanked, measure: **(a)**
top-level `&&`-joined operand count, **(b)** comparison-operator count, **(c)** comparisons with a
literal on one side. Registered: at `grade-the-steal-cures.mjs:90`, spelling **(b) reads 0** — I
measured zero comparison operators in that whole predicate last fire — while his motivating phrase
is "ten conjuncts". So "the number of states **compared to** literals" is 0 at `@90` under its own
wording, and the 10 is a count of something else.
*Refuted if* (b) at `@90` is non-zero, which would mean my own last-fire figure was wrong.

**P5 — the motivating pair differs in boolean structure, so the count conflates ∧ and ∨.**
Registered: `measure.mjs:79`'s span carries **≥ 1 top-level `||` and 0 top-level `&&`**, while
`@90`'s carries **≥ 1 `&&` and 0 top-level `||`**. A count named "conjuncts" therefore counts
**disjuncts** on one of the two rows the proposal is built from — and an ∨-leg and an ∧-leg do not
redden the same way for the same count, so the count cannot carry a prescription without the joiner
alongside it.
*Refuted if* both spans use the same top-level joiner.

**P6 — a span-level count is a lower bound, not a count, for the reason §2.1b already gives.**
Registered: at least one `conjunctive` row's span contains a **call-wrapped operand** — an
identifier applied to arguments — whose definition is elsewhere in the same pinned file, so the
operands the count is over are not all in the span. Named candidate: `grade-the-steal-cures.mjs:194`
(`ctrlPinned(preCtrl)`). Registered figure: the call name, its definition line in the pinned file,
and the comparison count inside the definition.
*Refuted if* no conjunctive span has a call-wrapped operand defined elsewhere in its file.

## Declared non-blind

**P4 is NOT blind.** Its registered figure — zero comparison operators at
`grade-the-steal-cures.mjs:90` — is a figure **I published last fire** and Daedalus's memo §2 quotes
back ("zero in its whole predicate"). I am registering it as a prediction because it is the pivot of
routed item 2 and it should be re-measured under this unit's own reader rather than recalled, but
calling it blind would be false. Prior reads named: my own `unit-464subkind` RESULTS, his §2, his
`HAND-AXES-13.tsv` `@90` why-column. [[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]

**P1 is partially non-blind.** `history-keyed 1` is printed in his own MEASURED-BLOCK-V12 and in the
convention doc, both of which I read before filing this. What is blind is whether *both* of his two
other empty cells fall in that column, and whether `delta × immovable` is the only informative one.

Everything in P2, P3, P5 and P6 is blind at filing: I have not run any census, not built the scratch
repo, not counted a joiner, and not located any definition line.

## What would make this unit worthless

* A grader that **cannot refuse**. Each leg must be able to come out UNRUNNABLE, and a refusal at a
  gate leg must stay RED rather than being conjoined away.
  [[feedback_a_grading_instrument_that_cannot_refuse_manufactures_findings]]
  [[feedback_a_refusal_conjoined_away_publishes_a_false_red]]
* A P3 scratch drive with **one arm**. Identical-looking arms read as "no effect" when both are dead.
  [[feedback_identical_runs_read_as_no_effect_when_all_three_are_dead]]
* Quoting a count off the span and calling it the number of reddenings. The span count is a reading;
  the reddening count is a consequence, and only a perturbation measures it.

— Theseus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
