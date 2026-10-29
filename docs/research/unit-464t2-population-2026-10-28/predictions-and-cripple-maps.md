# Unit 464-T2-population — predictions and hand-derived cripple maps

Daedalus, 2026-10-28 STOP fire. **Written and committed BEFORE the first drive of
`grade-the-round-population.mjs`.** Nothing in this file was edited after a drive; any
correction appears as a dated note below the original, never as a rewrite (the
"prose written beside its own cure needs a pin" rule).

## Why this unit exists

Theseus's 10/28 WORK memo (§4) says both our `consecutive` figures count
`roundNNN-instruments/` directories, and the track has moved to `unit-*` directories. He
framed it as round 467 having no dir. Reading the tree, it is stronger than that: the dir
population is **terminated**, not merely incomplete. If no `roundNNN-instruments/` dir will
ever be created again, then `consecutive = count(dirs > last)` is pinned at a constant for
all future time, and my own standing stop-condition cell — whose T2 leg is keyed on exactly
that figure — can never report that the condition fired, no matter what the track does.

That is a defect in the instrument this seat has quoted in `COORDINATION.md` every fire,
and it is mine.

## Pre-registered predictions

Each is a figure I commit to before measuring. A prediction that fails is recorded as
failed, not re-aimed.

| id | prediction | source of the expectation |
|---|---|---|
| `PRED-1` | `dirsAbove292 === 91` | reproduces Theseus §4's floor figure |
| `PRED-2` | `rawUnionAbove292 === 175` | reproduces Theseus §4's union figure |
| `PRED-3` | `denialFilteredUnionAbove292 === 174`, and the member set removed by the denial filter is **exactly `[465]`** | Theseus §4's own self-reported defect: his union credits 465, attested only by two subjects that say "no Round 465" |
| `PRED-4` | `dirsCreatedAfterMaxDir === 0` — the dir population is terminated | read of `git ls-tree -d docs/research/`: `round464-instruments` is the last round dir, followed by five `unit-*` dirs |
| `PRED-5` | across `REV_PRIOR=8fe017b4` → `REV_NOW=HEAD`, `dirsAbove292` is **unchanged** while `rawUnionAbove292` **strictly increases** | round 467 (`6190a0dd`, mine, 09:36 today) landed in that span and filed into `unit-307c4-rekey-2026-10-28/`, not a round dir |

`PRED-5` is the one that matters: it is a two-point measurement of whether each measure is
alive. A measure that does not move when a round happens is not a floor that grows slowly;
it is dead.

## Leg roster

**GATE legs** — if any is red, no figure below it is published. Kept separate from the
prediction legs on purpose: a gate leg is the one site where a refusal must stay a RED.

* `G1` — `git ls-tree` resolved at both revs and the dir population is non-empty.
* `G2` — cross-check against Theseus's own cell: drive
  `unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs` as a child process and parse
  its `dir-only figure published as the floor` line; it must equal my `dirsAbove292`. I do
  not re-type his reader — my copy of a key has disagreed with its author before.

**FREEZE legs** — the finding.

* `F1` — zero `roundNNN-instruments/` dirs were created after the creator commit of the
  highest round dir.
* `F2` — at least one `unit-*` dir was created after that same commit. (Exact count is a
  `[MEAS]`, not a prediction: I have not counted which of the five precede it.)
* `F3` — saturation: `count(dirs > maxDir) === 0`, so the dir key's `consecutive` is `0`
  whenever `last === maxDir`, which is the value the standing cell publishes today.
* `F4` — `PRED-5`'s two-point growth test.

**DENIAL legs.**

* `D1` — the raw subject key credits round 465.
* `D2` — the denial-filtered key does not credit round 465.
* `D3` — round 465 is attested by **no** non-subject source, so the denial filter is
  sufficient and not merely necessary.

**PUBLISH legs.** `P1`/`P2`/`P3` assert `PRED-1`/`-2`/`-3`.

## Hand-derived cripple maps

Five cripples, dispatched by `CRIPPLE=<name>`. Each map is derived by hand from the source
below, **before** the cripple is driven. `expected red` is the full set; a cripple that
reddens a leg not listed, or leaves a listed leg green, is a defect in my model of my own
cell and is recorded as one.

| cripple | what it changes | expected red | expected to stay green |
|---|---|---|---|
| `no-denial-filter` | denial filter disabled — filtered set := raw set | `D2`, `P3` | `D1`, `D3`, `P1`, `P2`, `F1`–`F4`, `G1`, `G2` |
| `credit-465-a-dir` | injects `465` into the dir source set | `D2`, `D3`, `P1`, `P3` | `D1`, `P2`, `G2` is **also expected red** (my `dirsAbove292` moves to 92 while his cell still reads 91) |
| `fake-new-round-dir` | injects a synthetic `{round: maxDir+1, creatorDate: now}` row into the creation-row list the freeze legs read | `F1`, `F3`, `P1` | `D1`–`D3`, `P2`, `P3` |
| `dir-key-only` | attestation union := dirs only | `P2`, `P3`, `D1`, `F4` | `P1`, `F1`, `F3`, `G1`, `G2` |
| `xcheck-wrong-figure` | cross-check parses the union line instead of the dir line | `G2` | everything else |

Two notes on the maps, because both are places this seat has been wrong before:

1. `credit-465-a-dir` is expected to redden `G2` **as a side effect**, not by design. I am
   writing that down rather than discovering it in the drive and calling it expected.
2. `dir-key-only` is expected to redden `D1` by making the positive class empty — a
   key-choice cripple has nothing to disagree about once nothing is credited. If `D1`
   instead stays green there, the leg is vacuous and that is the finding, not the cripple.

---

## ADDENDUM 2026-10-28, after drive1–drive6 (pre-repair), before drive7+

The original maps above are left exactly as written. This addendum records what the drives
said, the two defects they found in this cell, and the **re-derived** maps for the repaired
cell. Re-deriving is not optional: a hand map derived against the pre-repair subject goes
stale the moment the subject is fixed, and this seat has shipped a prediction written
against code it had already changed.

### Scoreboard against the original maps

All five of `PRED-1`…`PRED-5` landed exactly (`drive1.clean`, `VERDICT/0`, 13 legs,
`.err` 0 bytes). Four of five cripple maps matched: `no-denial-filter` `[D2,P3]`,
`credit-465-a-dir` `[G2,D2,D3,P1,P3]`, `dir-key-only` `[F4,D1,P2,P3]`,
`xcheck-wrong-figure` `[G2]`.

`fake-new-round-dir` did **not** match: predicted `[F1,F3,P1]`, actual `[F2]`. The two legs
it was aimed at stayed green and an unrelated one reddened. That mismatch is the finding.

### Two defects in this cell, both invisible to the clean green

1. **`F1` could not fire.** It asked "was any round dir created after the *highest* round
   dir". A new round dir *becomes* the highest, so it moves the reference point instead of
   reddening the leg: `M4` shifted to the synthetic `round465-instruments` and `M5` stayed
   `0`. The leg would have gone on publishing "TERMINATED" on the day the termination
   ended — the same guard-cannot-fire shape this unit was built to expose, reproduced in the
   instrument exposing it.
   **Repair:** the termination instant is a pinned literal (`725f97ee`'s commit date,
   `2026-10-27T17:52:54.000Z`); `F1`/`F2` count rows after that fixed instant.
2. **`F3` was a tautology.** `dirsNow` is sorted ascending and `maxDir` is its last element,
   so `count(dirs > maxDir) === 0` holds for every possible input. `F3` asserted nothing,
   and the claim written in its own `why` string — that the standing cell publishes
   `last=maxDir`, hence `consecutive=0` — was never tested.
   **Repair:** `F3` now drives `round464-instruments/grade-the-stop-condition.mjs` as a
   child and asserts against the figure it actually prints.

`F2`'s red under that cripple was incidental — the synthetic row's date postdated every
`unit-*` dir, so "units after the max row" went to 0. Keyed on the pin, that goes away.

### Re-derived maps (repaired cell, 13 legs, 6 cripples)

| cripple | expected red | changed from the original map? |
|---|---|---|
| `no-denial-filter` | `D2`, `P3` | no |
| `credit-465-a-dir` | `G2`, `F3`, `D2`, `D3`, `P1`, `P3` | **yes** — gains `F3`: `maxDir` becomes 465 while the standing cell still publishes `last=464`, so the two disagree |
| `fake-new-round-dir` | `F1` **only** | **yes** — `F1` now fires (that is the repair); `F2` no longer reddens incidentally; `F3`/`P1` were never reachable from this cripple and I was wrong to predict them |
| `dir-key-only` | `F4`, `D1`, `P2`, `P3` | no |
| `xcheck-wrong-figure` | `G2` | no |
| `standing-last-mismatch` *(new)* | `F3` | new cripple, added because nothing in the original five could reach `F3` |

Both previously-unreachable legs now have a cripple that reddens them: `F1` via
`fake-new-round-dir`, `F3` via `standing-last-mismatch` and independently via
`credit-465-a-dir`. A leg no cripple can redden is not evidence, and before this repair two
of the four freeze legs were in that state while printing `ok`.

## What this unit does NOT settle

Whether the track stops and re-scopes is xian's, unchanged. Whether `292` is the right
`last` figure is settled elsewhere (Theseus §2: the cure predicate is the repair, and it
agrees with the label-only key today). This unit is only about the **denominator** — the
population `consecutive` counts — and about the fact that my standing cell's T2 leg cannot
fire.
