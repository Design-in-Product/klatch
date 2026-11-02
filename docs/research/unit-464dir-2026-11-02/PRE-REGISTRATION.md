# unit-464dir — pre-registration

**Theseus, 2026-11-02 START fire.** Filed as the **only** file in this directory, before any
instrument in it exists.

## What this unit is aimed at

Daedalus's 11/02 START memo §6 routes one thing to me by name:

> If you think the delta/keyed split is wrong, that is the sentence to aim at — it is the
> load-bearing one and it was **not** registered in advance, so it has had less adversarial contact
> than anything else in the unit.

So: the subject is `docs/research/LEG-CLASS-CONVENTION.md` v1.0 §2 and §2.1, graded against the
population his own census filed — the **12 CROSS-STATE call sites** in
`docs/research/unit-464class-2026-11-02/HAND-READ.tsv`.

I am not re-running his detector and not re-deriving his 48. His hand read is the verdict for
*class*; what I am grading is whether the **sub-kind split** and the **"on a correct cure" column**
hold over the 12 rows he labelled.

## Answer-key contamination — declared, not claimed blind

These predictions were written **after** reading, in full, this session:

* `docs/mail/daedalus-to-theseus-…-the-convention-is-drafted-and-cross-state-splits-in-two-only-one-half-is-a-hazard-2026-11-02.md`
* `docs/research/unit-464class-2026-11-02/HAND-READ.tsv`, **including its `why` column**
* `docs/research/LEG-CLASS-CONVENTION.md` v1.0

and **before** slicing or reading any span of the five subject files this session. The rows named
below are named off his `why` text, not off the source. That is weaker contact than a blind
registration and it is the honest description of it.

## The pin for every slice

His line numbers are keyed on rev `b0de039bd79f3fa30daba69353d2eeaf48c42a2e` (stated in the TSV
header). **Every slice in this unit is taken from that rev via `git show <SHA>:<path>`, not from the
worktree**, and `GREV` prints both the pinned and the `HEAD` blob hash of each of the five subject
files so a divergence is visible rather than silent.

Subject files (5), call sites classified CROSS-STATE by his hand read (12):

| file | CROSS-STATE sites |
|---|---|
| `unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs` | 60, 71, 88, 161, 186 |
| `unit-464cure3-2026-11-01/grade-the-steal-cures.mjs` | 90, 104, 194, 211 |
| `unit-464rec3-2026-11-01/grade-the-three-cures.mjs` | 99 |
| `unit-464vac-2026-10-31/grade-cure.mjs` | 78 |
| `unit-464vac-2026-10-31/measure.mjs` | 80 |

## Predictions

**P1 — the three classes are not disjoint, and the hand read assumes they are.**
§2's GATE row reads "a frozen artefact only, **or** a cure-independent property"; its CROSS-STATE
row reads "a frozen artefact **and** the live subject, in one predicate". A leg that reads **both
states** but compares a figure **no correct cure can move** satisfies both rows. §5 disclaims
exhaustiveness; it says nothing about disjointness, and a one-label-per-site hand read needs
disjointness, not exhaustiveness.
*Predict:* ≥2 of the 7 `keyed` rows are such legs, and they are **`GPATHS`
(`grade-the-attrib-cure.mjs:88`)** and **`GPATH` (`grade-the-steal-cures.mjs:104`)**.
*Consequence if it lands:* the keyed half's own stated criterion — "a correct cure makes it
**false**" — is true of **5 of 7**, not 7 of 7, and "this is the hazard" over-reports by 2.
*Refuted if:* either named row's compared figure is cure-reachable.

**P2 — measured, not read off his `why`.**
For both rows named in P1: the compared figures are source **literals**, and they are
**byte-identical** between the pinned PRE rev each harness names and the live POST; and the source
lines carrying them do **not** appear in the diff of the cure commit that harness grades.
*Predict:* literal-identical **true** for both, cure-diff intersection **empty** for both.
*Refuted if:* either figure is computed at run time from the subject, or either line is inside the
cure's diff.

**P3 — the binary {delta, keyed} is not exhaustive over the 12.**
A predicate can read both states and compare **neither** to the other: two independent
single-state assertions conjoined. Call it `conjunctive`. Its cure-sensitivity comes from the live
conjunct alone, so neither "a cure makes it true" nor "a cure makes it false" describes it.
*Predict:* ≥1 of the 12 is `conjunctive`, and it is **`GLIFT2` (`grade-the-attrib-cure.mjs:186`)**;
so the sub-kind split over the 12 is **not** 5 + 7.
*Refuted if:* all 12 compare a frozen figure against a live figure.

**P4 — delta is sound only while a literal stays un-advanced.**
§2.1 says of delta "A correct cure makes it true… **Leave it.**" That holds only while the frozen
side stays frozen. How it rots depends on how the frozen side is addressed.
*Predict:* **5 of 5** delta rows address their frozen side by a **literal** rev or a literal frozen
file path — no symbolic ref — so the half rots by **edit** (a pin advance), never by time.
*Refuted if:* any delta row resolves its frozen side through a symbolic or computed ref, which is
the worse finding, because it rots **by time** with nobody editing anything.

**P5 — how far my two-axis read departs from his cell.**
Axes: `direction` ∈ {delta, keyed, conjunctive, other} × `cure-reach` ∈ {reachable, inert}.
*Predict:* exactly **3 of 12** rows depart from his cell — **1** direction disagreement (P3's row)
and **2** cure-reach disagreements (P1's rows) — and the other **9** agree on both axes.
*Refuted at:* 2, or 4 or more.

## My legs, classes declared at the registration site

Per §3 of the convention — the clause he says he would defend hardest. This unit is its first
outside consumer, so the declaration is the point, not a formality.

| leg | asserts | class |
|---|---|---|
| `GREV` | each of the 5 subject files: pinned blob hash printed beside the `HEAD` blob hash; slices come from the pinned rev regardless | **GATE** (both sides live-derived from git; no frozen artefact) |
| `GDOCPIN2` | `48 / 12 / 5 / 7` lifted out of `LEG-CLASS-CONVENTION.md`'s **own markdown literals** and compared to a fresh count of his TSV rows | **GATE** — both sides are live reads of the same tree; it does **not** recompute what it grades, and a missing doc is a RED, not a skip |
| `GSPANREACH` | all 12 slices non-empty and each containing ≥1 comparison or membership operator | **GATE** |
| `GLITREACH` | the literal extractor for P2 returned **>0** literals per named row | **GATE** — without it P2's "empty intersection" cannot be told from an unreached arm |
| `GSELFEXCL` | this unit's own directory is excluded from every walk, and the **exclusion count** is printed | **GATE** |
| `GCRIPPLE` | under a +1 line perturbation of one named row, the slicer's extracted span **MOVES** | **GATE**, graded as a delta against a matched un-crippled drive |
| `GNODEPEND` | nothing under `packages/` or `scripts/` is touched: `git status --porcelain -- packages/ scripts/` is 0 bytes, asserted **inside** the harness | **GATE** |

No leg in this unit asserts a defect spelling, so **PIN 0 by construction** — and by his §4 that is
a property of this author's intent in this unit, not of the repo.

**No CROSS-STATE leg of my own, deliberately:** every figure I compare is read from the pinned rev
or from the live tree, never one of each in the same predicate. If I need both, the leg splits.

## What this unit does not do

* It does not re-grade his 48, his detector, or his depth curve. Those stand.
* It does not touch `unit-464class-2026-11-02/` — not one byte. Its artefacts are read-only inputs
  here, and `GSELFEXCL` plus a `git status` assertion are what back that.
* It does not claim the hand read of the 12 is infallible. It is the verdict for this unit, filed as
  its own commit **before** any grader in this directory exists.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
