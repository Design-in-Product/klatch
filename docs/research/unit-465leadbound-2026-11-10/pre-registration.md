# unit-465leadbound — does widening the solver's `FILLER_LEAD` bound change its recommendation?

**Seat:** Theseus. **Opened:** 2026-11-10 STOP fire (`date`-read, see the session log entry).
**Status at the time this file is committed:** nothing measured. No solver has been run in this
fire, no scratch copy exists, and no output has been read. This file is pushed **before** the
instrument is built, so the predictions below cannot have been fitted to a reading.

---

## The subject

`scripts/geometry-marking-before-seed.mjs:44` hard-codes

```js
const LIST_LENGTHS = { FILLER: 12, FILLER_LONG: 17, FILLER_LEAD: 15 };
```

and uses `LIST_LENGTHS.FILLER_LEAD` as a **loop bound** — `for (let L = 0; L <= LIST_LENGTHS.FILLER_LEAD; …)`
at `:220`, `:245`, `:259`, `:276`. The live array in `scripts/probe-recall-tool.mjs` holds **20**
pairs (hand-counted independently by this seat and by Daedalus on 2026-11-10; both counts are
*leads to check*, not the source this unit will cite — see P6).

So the solver enumerates `L ≤ 15` over a seeder that can emit `L ≤ 20`. Because the constant is a
bound and not an assertion, the disagreement surfaces nothing and the instrument stays green —
even though the file's own header (`:35`) says its constants are re-derived rather than imported
*"so a disagreement is informative."*

**The drift is this seat's, and dates to one commit:** `c017af03` (2026-08-25, *"arm Q (distance):
5 `FILLER_LEAD` pairs, …"*) grew the live array to 20 and left the solver's bound at 15.

## Why this is a unit and not a patch

Bumping `15` → `20` answers a different question and destroys the evidence for this one. The claim
worth pre-registering is whether the five never-enumerated values **change what the solver
recommends** — because a published design ruling of Daedalus's rests on the narrow run:

> *"`leadPairs: 15` (leading 28) is correct over 14 (leading 26)"*, plus the `≤ 16` ceiling
> (`docs/operations/duty-cycle/daedalus-tasks.md:39`, which he marked **not settled** and pending
> this unit in his 2026-11-10 memo, §3).

If widening changes nothing, that ruling survives and is for the first time *measured* rather than
assumed. If it changes something, the ruling was argued off a solver that never enumerated `L > 15`.

## Predictions

Graded after the fact, each against a named recording. A prediction is FALSE if the recording
disagrees, regardless of how reasonable it looked here.

- **P1 — the bound is binding at its top edge, not interior.** In the **baseline** run (solver
  unmodified, at HEAD), at least one configuration printed by Sweep 1 — whether `FEASIBLE` or a
  printed near-miss — carries `L=15`, the enumeration boundary. *If every printed row sits at
  `L < 15`, the bound is slack and the whole unit is a non-finding, which is a real outcome.*
- **P2 — widening adds members and removes none.** The widened run's evaluated configuration set
  strictly contains the baseline's, with new rows at `16 ≤ L ≤ 20` and no baseline row absent.
  (A mechanical check on the instrument, not a claim about feasibility.)
- **P3 — the recommendation changes: at least one configuration with `L > 15` is FEASIBLE on a
  list that exists today.** This is the claim the unit exists to settle. Stated as the direction I
  expect, *and I expect it could easily be false*: three constraints bite harder as `L` grows
  (`no-truncation-leak` caps the leading offer at `MAX_EXPAND = 30`, and both
  `reachable-by-observed-appetite` and `restriction-outside-radius` are keyed on where the mark
  lands relative to the offer start).
- **P4 — Sweep 2's `firstFeasibleP` does not rise, and I predict it falls.** Widening the `L`
  search can only find feasibility at the same or a smaller `P`, never a larger one — so a rise
  would mean the instrument is not isolating the bound. I predict a **strict fall**: widening buys
  authoring effort back. (Falsifiable both ways; "unchanged" refutes the second half only.)
- **P5 — the self-check is byte-identical across the two runs.** The arm-N1/arm-M validation block
  is keyed on observed geometry, not on the bound, so it must not move. **This is the control:** if
  it moves, the widened arm is not a single-variable change and nothing below is interpretable.
- **P6 — the live length comes from an instrument that already prints it, and it reads 20.**
  `scripts/verify-filler-constraints.mjs:329-330` already prints `FILLER_LEAD ${FILLER_LEAD.length}`
  on **every run**, parsed out of the probe's source (`literal()`, `:115`). So the number this unit
  stands on is read from an existing instrument, not from either seat's hand count — and the
  disagreement with the solver has been observable on every run of that verifier since 8/25.
  Predicted reading: **20**. *If it prints anything else, both hand counts were wrong and P1–P4 are
  keyed on the wrong width.*

## Instrument, declared before it exists

1. **Baseline from the tree, pinned.** `git diff --quiet -- scripts/geometry-marking-before-seed.mjs`
   must be clean, and the blob sha recorded, so "baseline" is a rev and not a mood.
2. **Live length from `verify-filler-constraints.mjs`**, run unmodified, its `corpora:` line captured.
3. **Widened arm = a copy of the solver with `FILLER_LEAD` set to the live length, nothing else.**
   The solver performs **no file reads** (`grep -n 'readFile\|require(\|^import \|readdir\|__dirname\|process.argv'`
   → no matches, run this fire), so the copy's directory depth cannot change its behaviour. The
   copy's diff against the original will be shown in full, so "nothing else" is checkable.
4. Both runs' stdout captured whole to files in this directory, exit codes recorded separately from
   stdout, and diffed.

**What this unit does not do:** it does not land a cure. Whether to bump the constant, and where
the equality check (`LIST_LENGTHS.FILLER_LEAD === FILLER_LEAD.length`, re-derived not imported)
should live, is a decision the measurement informs; a cure landed in the same breath as its
measurement is the move this file exists to refuse.
