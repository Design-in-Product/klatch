# unit-464t8-mapdecay — results, 2026-10-29 STOP fire

Drive rev `ec0db7f7` (`baseline.rev`). Predictions filed first in `predicted.md`, committed at
`8b5f570f` **before** `map-decay-footprint.mjs` was run. Subject of the re-drives:
`docs/research/round464-instruments/grade-the-stop-condition.mjs`.

Routed here by Theseus's 10-29 WORK memo §5 ("Yours, new, if you want it"): stamp this seat's
10-29 MID cripple maps with their rev and leg/pred counts, and re-drive `t8-unpinned` and
`t8-ceiling-blind` against them.

## 1. The stamp (the routed deliverable)

`docs/research/unit-464t8-2026-10-29/cripple-maps-predicted.md` now carries a **COMPLETENESS
STAMP**: filing rev `df8c3b5f`, cell size at filing `legs=22 preds=8`, the two deltas, and a
pointer to this unit. The three recorded map tables are **unchanged** — a stamp is added above
them, not edited into them.

## 2. `PRED-A` — his §3 table reproduces under this seat's own drive, at a different rev

He drove at `2cf37348`; these are at `ec0db7f7`. Verdict lines, read off the recordings:

```
drive1.clean                 VERDICT/1 RED legs=26 red=[T2b]            refused=[T8] preds=10 refuted=[P7,P2]
drive2.redrive-t8-ceiling-blind  VERDICT/1 RED legs=26 red=[T2bKP,T2b,T8KP] refused=[T8] preds=10 refuted=[P7,P2]
drive3.redrive-t8-unpinned       VERDICT/1 RED legs=26 red=[T2b,T8]      refused=[]   preds=10 refuted=[P7,P2,P11,P9,P12]
drive4.redrive-t9-insensitive-leg VERDICT/1 RED legs=26 red=[T2b,T10]    refused=[T8] preds=10 refuted=[P7,P2]
```

| arm | map filed at `df8c3b5f` | at `ec0db7f7` | delta |
|---|---|---|---|
| `t8-ceiling-blind` | `red=[T2b,T8KP]` | `red=[T2bKP,T2b,T8KP]` | **+`T2bKP`** |
| `t8-unpinned` | `refuted=[P7,P2,P11,P9]` | `refuted=[P7,P2,P11,P9,P12]` | **+`P12`** |
| `t9-insensitive-leg` | `red=[T2b,T10]` `refused=[T8]` `n=3` | identical | — |

`t9`'s identity is checked at the figures its map named, not just at the verdict line. Both of
its detail lines are **byte-identical** to the 10-29 MID recording, compared as strings rather
than read by eye:
`detail: sensitive=[T2,T2c,T2b] n=3; refusing=[T8]; probes=[0,1,4,5,6,12]; figure=2` and
`detail: insensitive=[T10CRIPPLE] sensitive=[T2,T2c,T2b] refusing=[T8] registered=5`.
`registered=5` on both sides is the arm's own stub on top of a registry that did **not** grow
between the two revs: clean reads `registered=4` at `df8c3b5f` *and* at `ec0db7f7`, and the arm
reads 5 at both. That is why this is the one arm of the three with no delta — the four legs and
two predictions added in between put nothing into the figure-reader registry this arm perturbs
(`T2bSAT` is a `[MEAS]` leg in the `declared=` drift list, not a figure reader). **PRED-A lands.**

His §1 cross-check also reproduces here: `t8-ceiling-blind` reddens `T2bKP` with
`misses=[pin-arm-above-ceiling]` and that row only.

## 3. `PRED-C`/`PRED-D`/`PRED-E` — the footprint matrix, 18 of 18 cells as predicted

`drive6.footprint-labels-fixed.out`, verbatim:

```
GSUBSET ok  verdict movement is a subset of detail movement: cells=18 verdictMoved=2 detailMoved=4 violations=[] refusedCells=0 vacuous=false
MEAS   under-reported by a verdict-only map: 2 of 4 reached cells [drive2.redrive-t8-ceiling-blind.out/T2bSAT,drive3.redrive-t8-unpinned.out/T2bSAT]
```

Every cell of the hand-read matrix in `predicted.md` §`PRED-C` matches the drive, including the
row named in advance as the one that could come out the other way: **`T2bORACLE` does not move
under `t8-ceiling-blind`, and that is correct.** The oracle recomputes the *token* —
count-the-population-above-each-arm, threshold at `N` — which is where the saturation modes live;
it never calls `ceilingKey`, so mis-keying the ceiling cannot reach it. The *guard* is `T2bKP`'s
to grade, and `T2bKP` does grade it. The pair covers both propositions and neither leg claims the
other's. **No defect here** — the hypothesis was checked and came back negative, which is recorded
rather than dropped.

### The finding: a verdict-keyed map under-reports an arm's footprint at *every* rev

§3 of his memo establishes that a filed map goes **stale** as the cell grows. The matrix adds a
second, independent deficiency which is present at the filing rev itself:

**4 cells are reached; a verdict-keyed map can name 2.** The two it cannot name are both
`T2bSAT`, under both `t8` arms. `T2bSAT` is a `[MEAS]` leg: it has no verdict to move, so it can
never enter `red=`/`refused=`/`refuted=`, however hard an arm perturbs what it reads. Its
*detail* line moves under both arms — `key= >= → ===` under `t8-ceiling-blind`, `popMax` and both
distances under `t8-unpinned` — so the arm demonstrably reaches it.

Every map in both seats' units is keyed on the verdict sets. So the under-report is not a
property of a stale map; it is a property of the **key**, and it is invisible to exactly the
re-drive-and-compare that §3 prescribes as the cure for staleness. The two deficiencies compose:
a stale map over-reports (a new member reads as a regression) while a verdict key under-reports
(a reached MEAS leg reads as untouched).

`GSUBSET` is the gate that makes this sayable: verdict movement is a **strict subset** of detail
movement, 2 ⊂ 4, with `violations=[]`. It refuses rather than printing `ok` when `verdictMoved`
is 0, because a subset claim over an empty partition is vacuously true.

## 4. A defect in this unit's own instrument, caught by its own numbers, and the gate it forced

The first version of `map-decay-footprint.mjs` listed six of the cell's seven printed status
labels and **omitted `REF `**. The cell prints a refused leg as `REF ` (its branch literals are at
`grade-the-stop-condition.mjs:1678` for legs and `:1684` for predictions), so the reader was blind
to **every REFUSED leg** — live, that is `T8`, the leg this whole round is about.

It was caught by the reader's own printed count disagreeing with the cell's: `29` against
`22+8=30`, and `35` against `26+10=36`. Two consequences, both recorded:

**(a) `GDELTA` was green under the blindness, and still is.** The first drive
(`drive5.footprint.out`) printed `GDELTA ok cell=6 reader=6` while the reader was missing a
member — because a blind reader is off by the same constant in *both* recordings and the error
cancels in a difference. Two counts taken with one blind reader agree vacuously. So `GABS` was
added: the **absolute** member count against the cell's own `legs=`+`preds=`, per recording.

**(b) The cripple arm drives the distinction rather than asserting it.**
`--cripple=labels-miss-refused` reinstates the exact blindness. `drive7.cripple-labels-miss-refused.out`:

```
KP  RED footprint reader: ... all-seven-labels-read-control-rejected=false misses=[all-seven-labels-read-control-rejected] rows=5
GDELTA ok  ... cell=6 reader=6 (old legs=22 preds=8 -> new legs=26 preds=10)
GABS   RED ... drive7.clean-final.out:reader=29/cell=30 drive1.clean.out:reader=35/cell=36 misses=[drive7.clean-final.out,drive1.clean.out] labels=6
VERDICT/1 NOT-GREEN kpMisses=1 gate=ok violations=0 refusedCells=0 gdelta=true gabsMisses=2
```

`GABS` RED, **`GDELTA` still `ok`** — the vacuity is a measurement, not a claim. The `KP` row
that reddens is keyed on `ALL_STATUS_LABELS`, never on the crippled `STATUS_LABELS`: a row that
builds its fixture from the same list the reader uses tests the crippled list against itself and
is green under the cripple it exists to catch.

`GHOOK` asserts the declared cripple has a dispatch site in this file's own source, with an
absent control name that must come back `0` — a declared cripple nothing reads runs a *clean*
arm, and a control driven under it comes back clean and reads as "the instrument survived".

**One sentence of `predicted.md` was wrong and is corrected here**, not edited there: it said this
reader's absolute count disagreed with the cell's by a constant because it *also* matched the
refuted-prediction lines in the legs region — i.e. that the reader over-counted. It under-counted,
by one, for the reason above. The `PRED-A`–`PRED-E` rows themselves all land; the wrong sentence
is rationale, and the direction of the error is the part worth keeping.

## 5. Drives

| file | what |
|---|---|
| `drive1.clean.out` | the cell, clean, at `ec0db7f7` — `legs=26 preds=10`, verdict byte-identical to Theseus's `drive2.clean` at `2cf37348` |
| `drive2.redrive-t8-ceiling-blind.out` | re-drive of this seat's 10-29 MID key-level arm |
| `drive3.redrive-t8-unpinned.out` | re-drive of the subject-level arm |
| `drive4.redrive-t9-insensitive-leg.out` | re-drive of the registry arm |
| `drive5.footprint.out` | **first** footprint drive, kept: it is the recording in which `GDELTA` is green under the label blindness |
| `drive6.footprint-labels-fixed.out` | footprint after the label fix — `GABS` 30/30 and 36/36, `KP` 5/5, `GSUBSET ok` |
| `drive7.cripple-labels-miss-refused.out` | the counterfactual: `GABS` RED while `GDELTA` stays `ok` |

`.err` files are kept even when empty: an empty `.err` is the evidence a drive reached its verdict
rather than died on the way. **7 `.err`, 0 non-empty** (counted with `readdirSync`/`statSync`).

The cell writes nothing — `writeFileSync`/`appendFileSync`/`mkdirSync`/`rmSync`/`unlinkSync`
occur **0** times in its source; its only child process is `execFileSync('git', ['-C', REPO, ...])`.
Censused statically before the first drive, because a drive that re-stamps a committed recording
is a failure mode this track has already had.

## 6. What this leaves open

* **Not taken, no blocker, claimable:** re-keying the map convention itself so a map names
  *reached* members (detail movement) rather than *verdict* members, and a `legs=`/`preds=` stamp
  becomes machine-checked at compare time rather than read by eye. §3 gives the shape; this unit
  gives the instrument; nobody has changed the convention.
* **Not this seat's:** whether `grade-the-stop-condition.mjs`'s `[MEAS]` legs should be able to
  carry an assertion at all. `T2bSAT` and `T8CEIL` both assert nothing by design — where the
  population maximum sits is not a state any edit can cure — so the under-report is a consequence
  of a deliberate choice, not a bug in either leg.
