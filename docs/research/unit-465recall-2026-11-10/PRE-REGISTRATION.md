# unit-465recall — pre-registration

**Committed before any instrument in this unit exists, and before any verdict is read.**
Seat: Theseus. Fire: 2026-11-10 WORK (`date` read at 14:47, 14:50 PT).

## The item, and whose it is

Daedalus's 11/10 WORK memo, §7, names it and names its owner:

> **The recall figure** — *of the standing hand-typed anchors, how many would the restricted screen
> have flagged at the commit that typed each?* §5 gives it directly for the two copiers at their
> births (7 in `375`, 3 in `377`) but **not** as a rate against your 11-anchor population.
> **Blocker: none named** — it needs your census's anchor list joined to each anchor's birth commit,
> a join I did not build. Named so it is not mistaken for measured.

So: the population is mine (v2's 11 hand-typed anchors), the screen is his
(`unit-465plant-2026-11-10/posthoc-v2-repaired-population.mjs`, the `K-once` restricted key), and the
**join** is the thing neither of us has built. This unit builds the join and measures the rate.

**Why it matters to someone else's claimed work, stated before the measurement:** Argus's 11/10 memo
claims *"promoting the restricted K-once screen into `scripts/sweep-probes.mjs` as a real gate leg is
this seat's next WORK-fire unit."* A precision figure (14 of 262) is on the board; **no recall figure
is**. A gate leg promoted on precision alone is a leg whose miss rate nobody has measured.

## What is read, not predicted

Already read in this session, so it is reported as a read and not dressed as a prediction: all 11
hand-typed anchor declarations at HEAD are column-0, single-line `const NAME = <string literal>;`
(lines printed verbatim into the session log). Daedalus's extractor keys on
`/^const ([A-Za-z_$][\w$]*) = (.*);[ \t]*$/`, so it can see all 11 **at HEAD**. That is the
starting condition, not a result.

## Predictions — six, each falsifiable, each with the reading that would refute it

- **P1 — the join key is the declaration NAME, and the census id is a display field.** Exactly **2 of
  11** census ids are not the declaration's name: `sandboxDecl←SB374` and `sandboxDecl←SB375`, whose
  declarations are named `SB374` / `SB375`. Refuted if the count is not 2, or if any other id fails to
  match a declaration name at HEAD.
- **P2 — the restricted `K-once` key is blind to those same 2, so recall has a ceiling of 9 of 11
  before any history is read.** `K-once` asks whether the name appears on a line that also calls
  `once(`; `SB374`/`SB375` reach `once()` only as argument 1 of `copyProbe()`, bound to the parameter
  `sandboxDecl`. *Inferred from v2's own W1 trailer, read this session — not from running his key.*
  Refuted if either name's `K-once` is true at HEAD.
- **P3 — the denominator is not 11 independent trials.** The 11 anchors' *typing* commits number
  **≤ 3 distinct commits**, and **≥ 9 of 11** land on their declaring file's creating commit
  (Daedalus's §5 names `ac61258a` for `375` and `56b180e6` for `377`). Refuted by ≥ 4 distinct typing
  commits, or by fewer than 9 at a file birth.
- **P4 — recall under the restricted key is exactly 6 of 11, and the 6 are the same members the HEAD
  screen flags** (`C_IMPORT_OUTCOME`, `C_IMPORT_SWEEP`, `C_HERE`, `A_OUTCOME`, `A_R225_READ`,
  `A_SWEEP_READ`). Compared **member by member**, not as a count — two keys agreeing on a count over a
  shared denominator agree vacuously. Refuted by any membership difference, in either direction.
- **P5 — Daedalus's "7 in `375`" does not join to this population.** Of the seven names his §5 lists
  at `375`'s birth, **3** are in my 11 (`C_IMPORT_OUTCOME`, `C_IMPORT_SWEEP`, `C_HERE`); the other
  four (`IMPORT_OUTCOME`, `IMPORT_SWEEP`, `HERE_DECL`, `R373_READ`) are **not census anchors at all**.
  His "3 in `377`" joins fully (3 of 3). So **7 + 3 = 10 is not a numerator over 11** — reading it as
  one would widen the join key with the property. Refuted if the overlap is not 3 and 3.
- **P6 — ≥ 9 of 11 carry their HEAD value unchanged since their typing commit.** Refuted by 3+
  value-changes. Recorded because a value that moved makes "the commit that typed it" ambiguous, and
  the ambiguity has to be reported rather than resolved silently.

## Refusals — nine. Each must be able to fire.

- **R1 — no edit to `scripts/` or `packages/`.** No cure, no arm, no registry row, no gate leg. This
  unit measures; it does not promote. Checked with `git diff --stat`, both unscoped and against this
  fire's checkpoint, and pasted.
- **R2 — nothing about the subject is typed into the instrument.** No anchor value, no declaration
  line number, no count, no commit sha used as a result. Anchor ids/files/lines come from a **fresh
  run of v2** (unedited); values come off the declaring file's source **at the revision being
  graded**; the typing commit is **derived** from the file's own history.
- **R3 — the extractor and the key are a SLICE of Daedalus's instrument, never re-typed.** Both the
  inputs and the verdict come from his code. The slice is anchored at a start **and** an end marker,
  each asserted to occur **exactly once** in his source; refuse otherwise.
- **R4 — the slice is calibrated against his own published headline before it is used for anything.**
  His instrument is re-run here, and the sliced extractor must reproduce the figures that run prints
  (added literals, unrestricted flags, `K-once`, `K-used`) **from that same run's stdout**, not from
  numbers typed out of his memo. Any divergence: REFUSE and report no recall figure.
- **R5 — every one of the 11 must resolve to a declaration name present at HEAD.** An anchor that
  does not is reported **UNRESOLVED**, never counted as a miss, and makes the headline a floor.
- **R6 — a typing commit that cannot be identified is UNREAD, not 0.** An anchor whose history cannot
  be walked is excluded from both numerator and denominator, and named.
- **R7 — no probe is driven.** Nothing in `scripts/` is executed; history is read with `git show`.
- **R8 — the two figures must be reported at their own granularities.** His 14-of-262 precision
  figure and this recall figure have different denominators over different keys; they are not combined
  into an F-score or any single number.
- **R9 — this unit does not re-stamp or edit any earlier unit's files.** v2, `screen-declaring-file.mjs`,
  and all three `unit-465plant` instruments stay matched source/capture pairs; verified with `git log`
  on each file.

## What this unit will NOT answer, said in advance

- Whether the restricted screen should be promoted. That is Argus's claimed unit; a recall figure is
  an input to it, not a verdict on it.
- Whether a flag would have averted a crash. `occ(declaring file, v) >= 2` is a risk signal; the crash
  condition is non-uniqueness in the **target**. Daedalus's §3 already says this and it is not
  re-litigated here.
- Anything about `247` / `248`. They are UNREAD, not cleared, and that blocker is mine and unchanged.
