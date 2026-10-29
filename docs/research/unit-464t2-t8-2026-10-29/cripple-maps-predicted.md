# unit-464t2-t8 — cripple verdict maps, hand-derived BEFORE their drives

Committed before any arm is driven. Each map is the **absolute** expected `red=[...]`/`refused=[...]`,
not a delta from the clean arm — the 10-28 unit's three misses were all a delta map graded against
an absolute report.

**Clean arm, already driven** (`drive5.clean-anchor-repaired.out`):
`VERDICT/1 RED legs=12 red=[U1,U2,U4,U5,U6] refused=[] preds=6 refuted=[] prefused=[]`

## Divergence from `predicted.md`'s filed arm set, recorded rather than tidied

`predicted.md` listed four cripples: `ceiling-removed`, `containment-broken`,
`figures-from-dot-population`, `anchor-drift`. Two changed and the reason is not cosmetic:

1. **`ceiling-removed` is not a cripple — it became a real drive.** It is his cell run in a scratch
   clone carrying one synthetic attested round above `467`, recorded as
   `drive3.scratch-ceiling-removed.out`. A real drive is strictly better evidence than a crippled
   one, so the arm was promoted rather than kept. `PRED-5` is therefore DRIVEN, not modelled.
2. **`containment-broken` is implemented as `containment-key-blind`**, which blinds *my* detector
   rather than inventing a different construction for his. It is paired with a new arm,
   **`ceiling-key-equality`**, which drives the `===`-instead-of-`>=` mis-key this cell nearly
   shipped: keyed on `===`, a `lastUnion` strictly *above* the population max reads as "not at the
   ceiling", which is the worse case passing as the good one.

## Maps

| arm | what it breaks | predicted verdict |
|-----|----------------|-------------------|
| `anchor-drift` | one slicing anchor perturbed so it matches 0 times | `RED red=[G1] refused=[U1,U1KP,U2,U2KP,U3,U4,U5,U6,M1,M2,M0]` |
| `containment-key-blind` | the nesting detector cannot see the seeded construction | `RED red=[U1,U2KP,U4,U5,U6]` — `U2` turns **green** (vacuous), `U2KP` reddens |
| `ceiling-key-equality` | the ceiling key is `===` instead of `>=` | `RED red=[U1,U1KP,U2,U4,U5,U6]` — `U1` still reds on the clean primary (`467 === 467`), and `U1KP`'s `above` row misses |
| `figures-from-dir-population` | the primary operands are sliced from his `drive3` (dir population) | `RED red=[U1,U2,U5,U6]` — `U4` turns **green**, because the primary's `T8=ok` now differs from the ceiling-removed arm's `RED` |

## The two arms predicted to separate by turning a leg GREEN

`containment-key-blind` (`U2`) and `figures-from-dir-population` (`U4`). Neither is scoreable at
the verdict level — a green leg looks the same as a leg nobody exercised. That is why `U2KP` exists
and why `U4` is read beside `M1`'s table rather than alone. Stated here before the drive so that a
green is not read afterwards as a pass.

— Theseus, 2026-10-29 START fire
