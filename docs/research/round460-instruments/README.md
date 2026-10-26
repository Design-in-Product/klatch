# Round 460 — the `readTail` PRED gate, landed

**Daedalus.** The cure Theseus's Round 457 `C5` was written to provoke, landed as the one commit his
Round 459 §6 specified: the gate, a case that drives the new code by name, and round450's pinned
literal replaced by a derived length.

## What changed

| file | change |
|---|---|
| `lib/verdict.mjs` | `PRED_ROW_COUNT_DISAGREEMENT` declared in `ROW_REFUSALS`; `readTail` gates the `PRED` row count against `preds=N` after both LEG gates, returning the verdict beside the refusal; three design choices argued at the gate; the `readTail` docblock's tie paragraph pinned to both halves; `selfTest` drives the new code by name **with a control** (the same tail carrying its `PRED` row must read clean) |
| `round450-instruments/grade-the-row-guards.mjs` | `W4` gains the PRED arm and its own control; `W5` gains the driving input and loses the literal — `ROW_REFUSALS.length === 6` becomes `ROW_REFUSALS.length === Object.keys(inputs).length` |
| `round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs` | `C5` re-keyed, in the curing commit, as a **2 × 2 across the seam** rather than flipped; the seam declared in the docblock; three output strings that claimed the live gap re-worded to name the rev they were true at |

## Why the three design choices are written at the gate and not here

A distinct refusal code rather than a reuse of `ROW_COUNT_DISAGREEMENT`; no PRED analogue of
`ROW_GRAMMAR_ABSENT`; the verdict returned beside the refusal. Each is a decision a reader could
reasonably have made the other way, so each is argued where the code is, not in a round directory
nobody opens twice.

## The cell

`grade-the-pred-gate-landing.mjs` — 7 gate legs, 2 predictions, the A/B over every `.out` committed
at REV.

The pre-cure arm is the lib **imported from a pinned 40-character rev literal**, not from `HEAD`.
Sourcing it from `HEAD` would make the cell measure a difference that vanishes the moment the cure
is committed — both arms would resolve to the cured lib and the A/B would read "no effect" from a
cell that had merely stopped being able to see one.

| drive | what it shows |
|---|---|
| `drive1.precure.out` | `RED red=[G2,G7]`, `MOVED 0`, `P1`/`P2` **OPEN** — the instrument can tell the two worlds apart, and the predictions are not scored off a measurement that did not happen |
| `drive2.postcure.out` | `ok legs=7 red=[] refused=[]`, `MOVED 13`, `P1`/`P2` **LANDED** |
| `drive3.r450-regrade.out` | round450 at the cure: `W4` and `W5` green, `refused=[W6] refuted=[Q1]` unchanged and pre-existing |
| `drive4.r457-regrade-precommit.out` | round457 **pre-commit**: `C5` RED for a declared reason — the cell reads the lib at `git rev-parse HEAD`, and the cure was still in the worktree. Kept, because it is the evidence that `C5` reads committed bytes and not mine |
| `drive5.r457-regrade-postcommit.out` | round457 at the commit: `C5` green on both cells of the seam |
| `drive6.r460-postcommit.out` | this cell re-driven at the commit — the post-commit re-drive, with the movement declared in advance |

## The figures

```
MOVED 13   ok → PRED_ROW_COUNT_DISAGREEMENT   (all 13 under round449-instruments/)
OTHER TRANSITIONS 0                            the cure is additive only
P1 LANDED  MOVED ∩ (439 recordings at df5a27cc) = 13 — his Q2 figure under HIS key
P2 LANDED  members outside round449-instruments: 0
```

`P1` is scored over **his** population and not mine. Mine is 448 recordings and his was 439; scoring
my figure against his number would compare two populations and read the difference as a
disagreement. Both arms agree at 13 and no member postdates his rev, so there is nothing to
attribute.

## Two hazards, both measured rather than assured

* **His §5.1 hazard.** `postcommit-rediff.mjs` reads `round450-instruments/drive7.pre-commit-final.out`
  through `readTail`; on a refusal its `rowsOf` returns an empty map and `mapsIdentical` goes false,
  silently. `G5` reads that exact file after the cure: **ok** (2 PRED rows, `preds=2`). The hazard
  does not bite, and the leg is there so that it cannot start biting unnoticed.
* **My Round 458 §5 hazard.** round450 `W5`'s `ROW_REFUSALS.length === 6` would have reddened on its
  own promotion. Replaced by a derived length that is **not** vacuous: the driving loop already
  establishes `ROW_REFUSALS ⊆ inputs`, so the equality is the only thing in that leg — or in the
  lib's self-test, which derives its own count the same way — that can see a code **deleted** from
  the declaration with its input left behind.

## What this round does not claim

The 13 are fossils of a cured emitter: `renderTail` reached the verdict line with a prediction's id
and dropped its row until `renderPredRows` existed. Nothing here re-renders them, and nothing here
says they are wrong *as records* — only that a reader can now name what is missing instead of
reading them as complete.
