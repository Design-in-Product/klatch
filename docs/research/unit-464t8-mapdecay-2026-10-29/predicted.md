# unit-464t8-mapdecay — predictions, written BEFORE the footprint instrument is driven

> **Added after the drive, 2026-10-29 STOP — the prediction rows below are unchanged.**
> `PRED-A` through `PRED-E` all land; results in `RESULTS.md`. **One sentence of rationale in
> `PRED-B` is wrong** and is corrected in `RESULTS.md` §4, not here: it says the reader's absolute
> member count disagreed with the cell's because the reader *also* matched the refuted-prediction
> lines in the legs region — i.e. that it over-counted. It **under**-counted, by one, because it
> omitted the cell's `REF ` label and was blind to every REFUSED leg. The gate `GABS` and the
> cripple arm `--cripple=labels-miss-refused` were added in response and are not predicted below.

Filing rev: `ec0db7f7eb9e0d591d24682bff78f92c1dc3d25b` (`baseline.rev`).
Cell under observation: `docs/research/round464-instruments/grade-the-stop-condition.mjs`.

## Why this unit exists

Theseus's 10-29 WORK memo §3 reported that two of the three cripple maps filed by
`unit-464t8-2026-10-29` moved without anything in that unit being touched, because the cell grew
four legs and two predictions afterwards. His conclusion — **a filed cripple map is complete only
at its filing rev** — is accepted and is being stamped onto that unit's map file in this same fire.

This unit measures the next question, which §3 does not answer: **which** new members an arm
reaches, and whether a verdict-keyed map can see all of them.

## Prediction set, filed before the drive

**`PRED-A` — the three re-drive deltas reproduce under this seat's own drive at a different rev.**
Theseus drove at `2cf37348`; this unit drives at `ec0db7f7`. Predicted identical to his §3 table:

| arm | map filed by `unit-464t8` | predicted today | predicted delta |
|---|---|---|---|
| `t8-ceiling-blind` | `red=[T2b,T8KP]` | `red=[T2bKP,T2b,T8KP]` | +`T2bKP` |
| `t8-unpinned` | `refuted=[P7,P2,P11,P9]` | `refuted=[P7,P2,P11,P9,P12]` | +`P12` |
| `t9-insensitive-leg` | `red=[T2b,T10]` `refused=[T8]` `n=3` | identical | — |

**`PRED-B` — the added-member population is 6, and the reader's delta agrees with the cell's own
`legs=`/`preds=` delta.** `legs` 22 → 26 and `preds` 8 → 10, so the cell's delta is **6**, and the
added names are `T2bSAT, T2bKP, T2bORACLE, M0c, P12, P13`, with **nothing removed**. This is
`GDELTA`. The footprint reader's *absolute* member count is known to disagree with the cell's
`legs=` by a constant offset — it also matches the refuted-prediction lines printed in the legs
region — so only the delta is used, and the delta is gated rather than assumed.

**`PRED-C` — the footprint matrix, 6 members × 3 arms = 18 cells.** Read off the source by hand
before driving (for a 6-member population the hand reading is primary; the instrument exists to
grade it). `v` = verdict position moved, `d` = the member's own detail line moved.

| member | input set it reads | `t8-ceiling-blind` (perturbs the KEY `ceilingKey`) | `t8-unpinned` (perturbs the SUBJECT: appends a population member) | `t9-insensitive-leg` (perturbs the figure-reader REGISTRY) |
|---|---|---|---|---|
| `T2bSAT` | `popMaxForT2b`, both arms, `ceilingKey` | `d` only (MEAS — no verdict to move) | `d` only | — |
| `T2bKP` | `ceilingKey` on synthetic operands | **`v`+`d`** | — | — |
| `T2bORACLE` | synthetic triples; does **not** call `ceilingKey` | — | — | — |
| `M0c` | `CELL_SOURCE` + `CRIPPLES` | — | — | — |
| `P12` | `popMaxForT2b − pinArm` | — | **`v`+`d`** | — |
| `P13` | `pinArmLast` and the two arms' `last` | — | — | — |

Totals predicted: `verdictMoved=2`, `detailMoved=4`, `violations=0`, `refusedCells=0`,
`vacuous=false`, under-reported `=2`.

**`PRED-D` — the gate `GSUBSET` holds: verdict movement is a strict subset of detail movement.**
No cell has a verdict that moves while the member's own detail line is frozen.

**`PRED-E` — the under-report is 2 of 4 reached cells, and both are `T2bSAT`.** This is the point
of the unit: a map keyed on `red=`/`refused=`/`refuted=` — which is how **every** map in both
seats' units is keyed — names 2 of the 4 cells an arm demonstrably reaches. The two it cannot name
are a `[MEAS]` leg, which has no verdict to move. So the verdict-keyed map does not merely go stale
as the cell grows (§3); at any rev it under-reports the arm's footprint by the MEAS legs, and the
under-report is invisible to a re-drive that compares only verdict sets.

## The one way this can come out the other way, named in advance

If `T2bORACLE` moved under `t8-ceiling-blind` it would mean the oracle does share the ceiling key
and the hand reading of lines 920–929 is wrong. Predicted **not** to move, and predicted to be
**correct** in not moving: the oracle recomputes the *token* (count-above, threshold at N), which is
where the saturation modes live; it does not recompute the *refusal guard*, which is `T2bKP`'s job.
The pair covers both propositions. Recorded here so that a non-moving oracle is a landed prediction
rather than an absence nobody keyed on.

## Known positive, driven before the matrix

`KP` has 4 rows on synthetic recordings, one per answer the reader must be able to give:
`verdict-moves-detail-frozen` (carries the property `GSUBSET` exists to detect),
`both-move`, `detail-only`, and the control `member-absent-refuses` — which must come back
**REFUSED**, not `false`, because a reader that answers `false` for an unreadable member grades
every unrunnable arm as clean. Predicted 4/4 with `misses=[]`.
