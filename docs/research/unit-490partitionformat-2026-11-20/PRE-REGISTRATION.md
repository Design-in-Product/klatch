# unit-490partitionformat — PRE-REGISTRATION

**Seat:** Theseus · **Fire:** 2026-11-20 START · **Registered rev:** `a446ab4b`
**`date`-reads:** 10:48:22 · 10:49:15 PST (read, not estimated)

**Pushed to `main` BEFORE any drive, before the scratch copy exists, and before the candidate
format is written.** If this file is not on `main` at a commit that precedes every `drive*.out` in
this directory, the unit is void.

## The question, and it is not mine to decide alone

`daedalus-to-theseus-argus-…-2026-11-20.md` §5 routes a **two-seat decision** here, blocker named
rather than taken: the gate's published partition rows

```
      UNGUARDED  58
      MARKED     4
      GUARDED    3
```

are built from `Object.entries(counts).sort((a, b) => b[1] - a[1])` where `counts` is accumulated
only over verdicts actually observed, so **an empty verdict class prints no row at all** — one
screen above a line (the 11/20 in-population quoted-only reach) that exists precisely to report a
class at zero. His half is **yes, conditional on: rows printed in a fixed order with the count
first**, or the label-substring surface Argus holds a pin on comes back.

His named blocker against taking it himself: *"reformatting the published partition moves every
captured drive's comparability across this entire unit series."*

**This seat's half will be a measurement, not an opinion.** The measurement is the price of the
format change, and the price has three separable parts, each of which this unit grades:

- **(i)** who reads those rows today, and in which spelling;
- **(ii)** what count-first does to each of those readers — loudly or silently;
- **(iii)** whether the zero-row half of the change is observable at all in the state the tree is
  actually in.

## Restraints (binding, and checked in RESULTS)

- **R1 — the tracked gate is NOT edited.** `scripts/verify-decl-body-slicers.mjs` stays byte-identical;
  the candidate format is applied to a **relocated `.gitignore`d copy**. Verified by
  `git status --porcelain scripts` empty and a `git diff --stat` of the file at the end.
- **R2 — the copy sits at the depth the gate's own `ROOT = resolve(HERE, '..')` requires**, i.e. a
  **direct child of the repo root** (`.scratch/`), not one directory deeper. This is
  `unit-489markedrekey` §3(a)'s defect — *a scratch copy at the wrong depth refuses every cell* —
  and quoting it here is not applying it, so **the control below grades the relocation before any
  claim leg runs**, and the harness **exits non-zero** rather than reporting a figure if the copy
  reads an empty tree.
- **R3 — no reader is hand-typed.** Every censused reader expression is **sliced verbatim** out of
  the tracked file that contains it; a capture that fails or is ambiguous refuses (`rc=3`) rather
  than falling back to a typed spelling. A hand-typed reader is not a slice.
- **R4 — no marker removed from any file**, verified by diff, not asserted.
- **R5 — `packages/` untouched**, so `npm test` is not claimed as a gate leg.

## CONTROL (graded first, kept separate from every claim leg)

**C0.** The relocated copy, unmodified, reproduces the tracked gate's live figures exactly:
population `65`, `UNGUARDED 58`, `MARKED 4`, `GUARDED 3`, `rc=0`. If population reads `0`, or the
rows are absent, the harness exits `3` and **no claim leg is graded** — a leg that conjoins a
sanity check with its claim cannot say which half reddened, and a reach printed at `0` on a run that
classified nothing scores a vacuous `PASS` (his §4, and this is the cure he named).

## Predictions

Registered before the census runs. Figures below are this seat's priors, stated so they can be
wrong.

**P1 — census size.** The number of **tracked** files carrying a reader keyed on the gate's
partition verdict rows is **≥ 4 and ≤ 12**, and every member is named. Four live surfaces are
already attested in mail (two of this seat's, Daedalus's `unit-487` one, his `unit-489` `drive5`),
so < 4 would mean the census key is narrower than the record.
*REFUTED if* the census returns < 4, or > 12, or cannot name its members.

**P2 — the spelling is predominantly label-first.** Of the censused readers, **at least half** key
the label BEFORE the count (`LABEL` … `(\d+)`), because that is the format the gate has always
printed.
*REFUTED if* fewer than half are label-first.

**P3 — count-first breaks label-first readers LOUDLY.** Every censused label-first reader, run
against the count-first rendering of the same live figures, returns **no match / null** — never a
number.
*REFUTED if* any label-first reader returns a numeric value against the count-first rendering.

**P4 — count-first does not merely MOVE the substring surface.** Against the count-first rendering,
no censused reader and no cross-label probe keyed count-first (`(\d+)\s+GUARDED` pointed at the
`UNGUARDED` row) returns another row's number.
*REFUTED if* any count-first reader reads `58` as `GUARDED`.

**P5 — the CURRENT format already has a silent cross-line fusion, and it is not the one Argus
pinned.** A count-first-keyed reader (`(\d+)\s+UNGUARDED`) run against the **current** label-first
rendering returns a number, and that number is **`65`** — the population line's count, which ends
the line immediately above the first verdict row — because `\s+` crosses the newline. Not `58`, and
not null.
*REFUTED if* it returns null, or `58`, or any value other than `65`.

**P6 — the zero-row half of the change is UNOBSERVABLE in the live state.** With all three verdict
classes non-empty today, adding the zero-row branch leaves the rendered partition block
**byte-identical**. The design therefore cannot be graded by driving the live tree; it needs a
forced-empty class.
*REFUTED if* the zero-row branch changes a single byte of the live rendering.

**P7 — fixed order DOES move the live rendering, and that is the price Daedalus named.** Today's
count-descending order is `UNGUARDED, MARKED, GUARDED`. A fixed order taken from the gate's own
verdict-branch order in source (`MARKED`, then `GUARDED`/`UNGUARDED`) is **different**, so the live
partition block moves and every captured drive loses byte-comparability **in exactly that block and
no other**.
*REFUTED if* the fixed order coincides with the count-sorted order on the live figures, or if the
diff touches any line outside the partition block.

**P8 — a forced-empty class is absent today, and present under the candidate.** Driving the copy in
a state where one verdict class has zero members, the **current** format prints no row for it (so a
reader must derive the zero from an accounting identity) and the **candidate** format prints it with
`0`.
*REFUTED if* the current format prints a zero row, or the candidate omits one.

## What this unit does NOT do

- It does **not** build the format into the tracked gate. That is Daedalus's seat under R1/R2 of his
  own series convention, and this fire's output is a **word plus a price**, not a cure.
- It does **not** re-open the `MARKED` re-key, which both seats have now said yes to and which is
  landed at `0eb0099f`.
- It does **not** narrow the 16-file disclosure list or touch Argus's label-substring pin on the
  rows this unit is about; if the measurement bears on that pin it is **offered**, not taken.
