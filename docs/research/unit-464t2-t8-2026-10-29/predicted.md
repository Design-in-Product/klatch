# unit-464t2-t8 — predictions and cripple hand map, PRE-REGISTERED

**Written and committed BEFORE the grader exists.** The commit carrying this file contains no
grader. If a prediction below is wrong, it is recorded as wrong; this file is not edited to fit.

Routed to this seat by Daedalus, 2026-10-29 START fire memo §4: *"Yours, if you want it: grading
`T8`'s new RED. It is load-bearing now rather than latent, and I would rather you keyed the cell
that decides whether the two credit keys can be reconciled than have me grade my own re-key's
consequence."*

Subject: `T8` in `docs/research/round464-instruments/grade-the-stop-condition.mjs`, which asserts
`consecutiveSelfOnly === consecutiveUnion` and published `RED  detail: dir 2 vs union 0; last
dir=464 union=467` at his `69cf9167` and again at my `f66c6631`.

**Reproduced before anything was written:** `drive1.repro-clean.out` vs his
`unit-464t2-rekey-2026-10-29/drive2.stop-clean.out` — the `T8`, `T2b`, `T2c`, `G1` and `VERDICT`
lines are byte-identical; every diff is `REV`, `CLOCK`, or the 4 docs-only commits since his drive.

**The question being graded is narrower than "is the RED correct".** It is: does `T8`'s comparison
have two moving operands, or is one of them pinned — because if `consecutiveUnion` is 0 for a
structural reason, `T8` reduces to "the dir arm is non-zero" and reports the dir key's freeze under
a leg text that claims to report key disagreement.

## Predictions

| id | claim | expected |
|----|-------|----------|
| `PRED-1` | the union arm sits at the ceiling of the population it counts over: `lastUnion === max(attested)` | `467\|467\|true` |
| `PRED-2` | `T8` is one-sided **by construction** — the union cure set is seeded from the dir cure set and only ever `add`ed to, so `consecutiveUnion <= consecutiveDir` always | `seededFromDir=true addsOnly=true` |
| `PRED-3` | of the 4 cells of (dir arm ∈ {0, non-zero}) × (union arm ∈ {0, non-zero}), `T8` is green in exactly one, `(0,0)` | `greenCells=1 members=["dir0/union0"]` |
| `PRED-4` | under his own `population-dir-only` cripple `T8` is **green**, and the union arm's 0 there has a *different* cause: `lastUnion` is **strictly above** the population max rather than equal to it | `t8=ok causeAttested=equal causeDir=above` |
| `PRED-5` | a synthetic attested round above `467` that the union key does not credit moves the union arm to 1 and `T8` **stays RED** — so the RED is insensitive to the only thing that would make it a key-disagreement signal | `union=1 t8=RED` |
| `PRED-6` | `T2c` and `T8` share the operand `consecutiveSelfOnly`, and their other operands are both 0-by-ceiling — so one figure leaving 0 flips both legs | `sharedOperand=true` |

`PRED-5` is driven in a **scratch clone**, never in another seat's tree. If the scratch drive cannot
be made to work inside this fire, `PRED-5` is recorded as **modelled, not driven**, with that said
in its own detail — not quietly downgraded to an assertion about arithmetic.

## Cripples — hand-derived red sets, written before any cripple is driven

Each is an **absolute** red set (the full expected `red=[...]`), not a delta from the clean arm.
The 10-28 unit's three misses were all bookkeeping: a delta map graded against an absolute report.

| cripple | what it breaks | predicted verdict |
|---------|----------------|-------------------|
| `ceiling-removed` | adds a synthetic attested round above the union key's last, so the union arm leaves 0 | `RED red=[U1]` — `U1` is keyed positively on "the arm is NOT at the ceiling", so removing the ceiling turns it **green**; the arm that then reddens is `U4`, which asserts T8's RED is insensitive to the union arm. **Predicted: `red=[U4]`** |
| `containment-broken` | drops a dir-key member from the union set so the sets are no longer nested | `RED red=[U2]` |
| `figures-from-dir-population` | slices the operands out of his `drive3` recording (dir population) instead of `drive2` | `RED red=[U1,U5]` — the ceiling cause becomes `above` not `equal`, and the control's live disagreement disappears because T8 is green there |
| `anchor-drift` | perturbs one slicing anchor so it matches 0 times | `REFUSED refused=[G1,U1,U3,U4,U5,U6]` — the gate refuses and every operand-derived leg refuses with it; `U2` survives because it reads source, not the recording |

`ceiling-removed` is predicted **not** to separate `U1` by reddening it — it separates by turning
`U1` green, which is the shape I flagged in Daedalus's own cure on 10-28 and which no verdict-level
check can score. It is therefore graded by a second leg (`U4`) rather than by `U1`'s colour, and the
prediction above is written in those terms deliberately.

## What a RED means in each leg, stated before the drive

- `G1` — the gate. Every anchor used to slice his recordings matched **exactly once**; a drifted or
  duplicated anchor refuses rather than silently taking the first hit.
- `U1` — **the union arm is NOT at the ceiling of the population it counts over.** RED = it is, so
  the operand is 0 for a structural reason.
- `U2` — **`T8` is two-sided**: the union arm can in principle exceed the dir arm. RED = nested sets
  make that impossible.
- `U3` — the `[MEAS]`-free statement of which end can move: the union arm leaves 0 exactly when an
  attested round above `lastUnion` appears that the union key does not credit. RED = no such path
  exists (i.e. the operand is pinned, not merely at the ceiling today).
- `U4` — **`T8`'s RED is sensitive to the union arm.** RED = it is not; the RED is produced by the
  dir arm alone.
- `U5` — **control**: a genuine key disagreement with neither arm at the ceiling still reds `T8`.
  Without this, `U1`–`U4` could all be detecting "T8 is red" rather than why.
- `U6` — `T2c` and `T8` do not share a load-bearing operand. RED = they do, so the verdict counts
  one fact twice.
- `M-` legs carry values and assert nothing: the 2×2 reachability map, and the distance from the
  ceiling in attested rounds.

— Theseus, 2026-10-29 START fire
