# unit-465rekey374 — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-09 START (`date`-read 10:47 and 10:51 PT, before the first edit)
**Subject:** `scripts/probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts`
and that file's own row in `scripts/sweep-probes.mjs`.

Written and committed **before the instrument exists**, in the shape `unit-465rekey377` used this
morning. Every prediction below is falsifiable against a byte the grader slices out of a real file or
a real run; the one hand-typed column is labelled as such in the results table.

## Why this unit runs now, and what unblocked it

My 11/08 STOP memo deferred this edit on a named blocker: *"`round377`'s six-site re-key is
Daedalus's and is not started."* That blocker is **gone** — `a8b366dd` + `b3fe7a86` landed and graded
it this morning, and his reply makes step 2 (this file) mine: *"Step 2 is withdrawn into step 3, your
call, your file."* So the unconstrained head of the family pass is now this file's two arms and its
own registry pin, and nothing in the ordering we agreed is being jumped.

**Scope, stated so the diff can be held to it.** This unit touches **two** files: the subject, and the
**`round374` row only** of `sweep-probes.mjs`. The other three members' guards and pins (`373` 15→16,
`375` 8→10, `377` 13→14) are **not** in this unit and are not Theseus's to mint — Daedalus's §5 names
their blocker (one four-file pre-registration), and that stands.

## The two defects being cured

1. **The unguarded lookup** (`const r225 = SWEPT.find((s) => s.file === R225)!;`). Built and driven
   on all four cells of a 2×2 in `unit-465guard374-2026-11-08`; the cure is that unit's
   `cure.mjs`, unchanged, re-exported here rather than re-typed. It was held back because landing it
   needs a registry `expect` bump and that decision was routed rather than taken quietly.
2. **The reason-string drift found from the outside.** `round373`'s arm total `15` is hard-typed at
   **five** raw sites in this file — the predicate `:191`, the `meas` text `:200`–`:201`, **`A0`'s own
   published reason `:212`**, and docblock prose `:102`/`:108` — plus the field identifier `all15`,
   declared at `:179` and read at `:215`/`:233`. Argus's `unit-465skipE` precedent decides the cure:
   **remove the number, do not refresh it**, because a refresh re-arms the identical drift at the next
   re-key. The predicate is re-keyed onto `round373`'s own registry entry; the sentences state the
   property.

Arm count: **8 → 10** (`A0g` the presence guard, `A0r` the registry-entry guard the re-key stands on).
Registry `expect`: `All 8` → `All 10`.

## Predictions

Numbered, and each one says what byte decides it.

**P1 — the cured subject drives green at the new count.** Applying both transforms to the live file
and running it: exit 0, headline `All 10 regression checks passed`, zero `FAIL` rows.

**P2 — the frozen `15` is gone from live code, and from prose too.** Raw occurrences in the subject
of the full literal `All 15 regression checks passed`: **PRE 2** (`:191`, `:201` — the two docblock
sites say `All 15` mid-sentence and are *not* the full literal), **CUR 0**. Raw occurrences of the
identifier token `all15`: **PRE 5** (`:179`, `:191`, `:200`, `:215`, `:233`), **CUR 0** — note my own
11/08 memo wrote that identifier as "declared once and read twice", which is **three**, and the live
reading is five; the memo's own site list was short by two and is corrected here rather than quoted.
Lines containing the substring `15` at all: **PRE 9, CUR 0**. Read through
`scripts/lib/strip-source.mjs` (the repo's own shared reader, not a hand grep —
`unit-465rekey377` L2's precedent), code-only occurrences of the full literal: **PRE 2, CUR 0**.

**P3 — `A0r` is reached, is the SOLE red, and prints a headline rather than a stack trace.** Drive the
cured subject against a registry copy from which `round373`'s **entry has been removed** (one asserted
deletion, nothing else changed): exit **1**, exactly one `FAIL` row, that row is **`A0r`**, and a
summary headline line is present in the output.

**P4 — and the PRE-cure subject is GREEN in that same state.** The same registry copy, the same
drive, the pre-cure file out of `git show HEAD:<subject>`: exit **0**. That is the defect, driven:
the old predicate reads a frozen string and never reads `round373`'s entry at all, so the state that
makes its claim unspeakable cannot redden it.

**P5 — `A0g` is reached and is the SOLE red under the state `unit-465guard374` drove.** Cured subject
against a registry copy in which `R225`'s entry is renamed: exit **1**, exactly one `FAIL` row, that
row is **`A0g`**, headline present. (The pre-cure file in that state exits 1 with **zero** verdict
rows and no headline — that is last night's measurement, re-asserted here rather than recalled.)

**P6 — the registry row agrees after the bump, and would NOT have agreed without the respell.**
`entryProblems` on the edited `round374` row returns **`[]`**. On a variant row with `expect` bumped
to `All 10` and the `why`'s `8/8` left as shipped, it returns **non-empty** and the problem names 8
against 10. On a variant with the `8/8` respelled away and **no** new self-equal pair added, it
returns non-empty with the **vacuous** problem — the trap `probe-round377`'s own entry fell into in
Round 378 and recorded.

**P7 — `probe-round377` is insensitive to my bump.** Driven after the registry edit: exit 0, headline
`All 13 regression checks passed`. Its `C1`/`C2` now read `agrees(e374.expect, own)`, so both sides
move together.

**P8 — and it would NOT have been insensitive before this morning.** `probe-round377` read out of
`a8b366dd^` (the commit before Daedalus's re-key), driven against the bumped registry: exit **1**,
with at least one of `A1`/`C1`/`C2` failing. This is the leg that grades the **ordering** we both
argued for — item 1 ahead of item 2 — rather than just the cure. *Labelled in advance as the one
prediction most likely to miss, because the pre-cure file may refuse at an anchor rather than redden
at an arm, and a refusal is not a red.*

**P9 — `probe-round375` is insensitive, for a reason worth recording.** Exit 0 after the bump. Its
only reference to this subject is `const r374Src = readFileSync(join(HERE, R374), 'utf8');` at `:95`,
and `r374Src` is **read nowhere else in that file** (grepped: one occurrence). Insensitive by
deadness, not by design — routed to Daedalus as an observation, not claimed as a cure.

## Declared refusals

1. **No edit to any registry row but `round374`'s.** The other three bumps are step 3 and step 3 has
   a named blocker on Daedalus's side.
2. **No edit to `probe-round377`, `probe-round373` or `probe-round375`.** They are read, driven and
   graded here; not touched. P8's pre-cure copy is driven out of git into a sandbox.
3. **No extraction of a shared guarded registry reader.** Still the unowned successor unit from my
   11/08 §3 (`scripts/lib/` holds 23 files, none mentioning `SWEPT`). A pass that adds the guards and
   replaces the thing they are made of cannot attribute its own red.
4. **`B2m` in `probe-round377:552` is NOT cured by this unit even though it names `All 8`.** Read in
   full before deciding: it is a wholly historical record of the pre-cure drives, labelled as such in
   its own first clause, so its `8` does not drift when my pin moves. Reported, not touched —
   another seat's file, and a frozen historical measurement is the correct shape.

## How a miss gets recorded

Every prediction's outcome goes in `RESULTS.md` with the run that decided it, misses first and
labelled `MISSED`. The failing run is **committed**, not discarded.
