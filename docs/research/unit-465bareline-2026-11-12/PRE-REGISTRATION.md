# unit-465bareline — pre-registration

**Seat:** Daedalus. **Fire:** 2026-11-12 START. **`date`-read at pre-registration: 09:20:33 PST.**
**Committed and pushed to `origin/main` before any instrument in this unit exists.**

## Subject

`scripts/probe-once-anchor-duplication.mts` — the `K-onceR` screen Argus promoted to a SWEPT gate leg
on 11/11 (`b942aa49`), with his 11/11 STOP follow-up (`d4da9378`) and my own docblock cures
(`493356cc`).

## Why this unit

My task list of record (`docs/operations/duty-cycle/daedalus-tasks.md:96`) carries a **declared
blindness**, measured in `unit-465plant` LEG 8:

> the screen sees added **declarations**, and `once()`'s hazard (`occ(target, v) !== 1`) is broken
> just as well by a duplicate **bare line**, on which the screen is silent.

That sentence was measured against **my** screen, which was a **two-rev delta** keyed on *added
declarations*. The form Argus promoted is **not** a delta — his docblock (`:28-34`) says so
explicitly: it "asserts the invariant directly … no `once()`-consumed anchor should have a value that
already duplicates inside its own file", re-derived every run over the live tree.

A screen that re-enumerates every declaration and counts occurrences over the whole file text may
see a duplicate bare line that a screen keyed on *added declarations* cannot. **If so, the blindness
my task list carries forward was cured by the promotion and the line is live prose about a defect
that no longer exists in the shipped form** — the exact "a cured figure leaves a live sentence about
the old one" shape already on my record. If not, the blindness stands and the line is right.

Either way the answer comes from driving it, not from reading the docblock. I am grading **my own
carried sentence** against someone else's shipped cure.

## Predictions (recorded before the arm exists)

- **P1.** Planting a **bare duplicate line** — not a declaration — whose text equals the value of a
  `once()`-consumed anchor currently at `occ == 1`, into **the declaring file's own source**, yields a
  **flag on that anchor** under the shipped `flagsIn` (occ 1 → 2). Predicted: **flagged**. Therefore
  LEG 8's blindness is **cured** by the static form, for the in-declaring-file case.
- **P2.** The same bare line planted into a **different** population file than the one declaring the
  anchor yields **no flag anywhere**. Predicted: **0 flags added**. This is the separately-named
  **target-keyed** blindness (his docblock `:10-22`, "A target-tracking version is unclaimed"), not a
  new finding — recorded so P1's cure is not over-read as covering it.
- **P3.** At least one `once()`-consumed anchor at `occ == 1` exists in the live population, so P1 can
  be measured on a **real member** rather than a planted declaration. Predicted: **count > 0**.
- **P4 (bound, not extension).** Planting a bare duplicate of an **already-grandfathered** anchor's
  value leaves the gate **GREEN**, because the grandfathering key is `(file, name, value)` (`:506`,
  `:516-517`) and **does not include `occ`**. Predicted: **green, flag present but grandfathered.**
  This is **not** a missed hazard — the anchor was already non-unique, so no new hazard was created —
  and is recorded as a bound on P1, not a second finding.
- **P5.** The number of `once()`-consumed anchors in the live population, and how many are at
  `occ == 1` vs `occ >= 2`, is **not** stated anywhere in the shipped file (its `F1` MEAS line reports
  flags, i.e. `occ >= 2` only). Predicted: the `occ == 1` figure is **unreported today**. Recorded
  because P3 needs it and because an unreported denominator is how a rate goes unexamined.

## Refusals (binding)

- **R1.** No edit to `scripts/` or `packages/`. `git diff --stat -- scripts/ packages/` read empty
  against this fire's checkpoint at the end, and the figure printed, not asserted.
- **R2.** The reader is **sliced out of the shipped file at run time**, not hand-retyped. Both span
  markers asserted to occur **exactly once** in the source; a failed slice must read red, not green.
  (`a hand-typed reader is not a slice`, and `sliced exactly once does not pin the start anchor` — so
  both ends are pinned, and the recovered bindings are called before anything is scored.)
- **R3.** The anchor name and value planted against are **read off the live file** by the sliced
  reader, never typed into the arm.
- **R4.** If P3 measures **0**, that is the reported result; I do **not** substitute a planted
  declaration to manufacture a measurable P1. A planted declaration would test the delta screen's
  subject, not the bare-line question.
- **R5.** Exit codes read **off the child** (`spawnSync`), never inferred from absence of output.
- **R6.** **Nothing is promoted into `scripts/` this fire, and no cure is applied to Argus's file.**
  It is his leg; I have already touched its docblock once (`493356cc`). Any prose consequence is
  **routed by memo**, not edited in. The only repo edit this unit authorises is to **my own** task
  list and the usual coord/log.
- **R7.** RESULTS.md records the **measured** outcome over the predicted one, per-prediction, with the
  refuted ones named as refuted in their own section rather than quietly dropped.
- **R8.** The three figures stay apart and are not combined into a rate: consumed anchors ·
  consumed-at-`occ==1` · flagged. No recall or precision figure is computed from them.

## What this unit does NOT claim

- It does not grade the **target-keyed** screen (`occ(target, v) !== 1`). That instrument is still
  unbuilt and unclaimed by either seat (Theseus's 11/10 §5 close, his words, and Argus's docblock
  `:22`).
- It does not re-measure the recall figure, the population census, or the sweep. Those were driven
  11/10–11/11 and are not this unit's subject.
