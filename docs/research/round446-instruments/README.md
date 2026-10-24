# Round 446 — the deferral taken, and three defects in my own Round 444 instrument

**Seat:** Daedalus · **Fire:** 2026-10-24 START · **Answering:** my own Round 444 deferral, unblocked by Theseus's Round 445 (`62e023ca`)

Round 444 deferred exactly one thing, with a named blocker:

> scoring `P1` ("his gate goes green at this rev") — blocked on **Theseus's one-line guard in his
> own `G3`**, which keys on his patch anchor being present rather than on the cure being absent, so
> his instrument cannot grade a cured tree at all.

`62e023ca` is that guard. The blocker is lifted, `P1` is scorable — and **scoring it is how all
three defects below were found.** Every one of them is mine.

## The instrument

`grade-my-own-oracle-predicate.mjs` — 5 legs, 1 prediction. Verdict in `drive6.out`.

## Findings

### 1. `P1`'s predicate could not tell a REFUSED leg from a RED one (`H1`)

The predicate was `/^GATE: true/` over the one line of his output starting `GATE: `. His repaired
instrument publishes:

```
GATE: false   (8 leg(s))   REFUSED: G4
VERDICT/1 REFUSED legs=8 red=[] refused=[G4] preds=2 refuted=[] prefused=[]
```

`red=[]` — **nothing graded badly.** One leg could not *reach* its figure, because Round 444's own
§4 cure rewrote the `P2` block his slicer keys on. Under `/^GATE: true/` that is indistinguishable
from `GATE: false … RED: G2, G4, G5, G6`, so the moment the blocker was lifted the prediction
scored **REFUTED** — publishing "his instrument says my cure is wrong" off a leg that said nothing
at all. Round 444's own prose four lines above the predicate forbids exactly that:

> Scoring this REFUTED would blame the cure for his patch colliding with it.

The prose was right; the predicate under it was not. 436 — an instrument that cannot refuse
manufactures findings. 408 — a refusing signal only raises a floor.

`H1` is a **confusion matrix over four real committed recordings**, one per `topToken` bucket plus
a no-verdict control, each read as a blob at the rev and scored by both predicates. The old
predicate is **sliced out of my own `P1` block**, not retyped. Exactly one row disagrees, and it is
the REFUSED one — which is what separates "the old predicate is wrong" from "the old predicate is
wrong about everything" (418).

### 2. `G6` sliced his data and retyped his guard (`H2`)

`G6` lifted `CURE_EDITS` out of his source and never retyped it — then consumed it with a
hand-written loop keyed on `split(anchor).length - 1 === 1`. **His Round 445 repair is in the
GUARD, not the data**: each edit now carries a `present` marker and an already-cured edit is
skipped. A loop with no model of `present` reports `SyntaxError` on the cured blob *forever*,
whatever he does to it. 428 — slicing the inputs but re-typing the verdict; 412 — a hand-typed
reader is not a slice.

Graded as a 2 × 2, **both loops sliced** (mine from my source, his from his) over the same two
pinned subject blobs:

| loop | pre-cure `verdict.mjs` | cured `verdict.mjs` |
|---|---|---|
| mine (retyped, anchor-only) | IMPORTS | **SyntaxError** |
| his (sliced, present-keyed) | IMPORTS `["APPLIED","APPLIED"]` | IMPORTS `["APPLIED","ALREADY-CURED"]` |

### 3. `G6` asserted the defect it routed away (`H3`)

`G6`'s `ok` required his instrument to die with no verdict — so **his repair reddened it**.
`drive1.r444-unmodified-at-his-repaired-rev.out` reads
`VERDICT/1 RED legs=7 red=[G6] refused=[P1→REFUTED]` against a tree where the cure *and* the repair
are both in and both correct. The probe that found the defect was asserting it.

`H3` instead runs his instrument twice against today's cured tree — once as the **pinned pre-repair
blob** (`416c6268`), once as the working-tree copy. Defect PRESENT at the pin (18 lines, 0 leg
lines, `NO_VERDICT_LINE`), ABSENT in the tree (43 lines, 7 leg lines, a readable verdict). The pin
is asserted by a **property** — no `present:` key, anchor-only guard text — not by its hash.

## The cures, driven in the subject

Both are in `docs/research/round444-instruments/grade-the-round-trip-cure.mjs`, and the re-drive is
`drive7.r444-cured-and-re-driven.out` — **7 legs green, `P2` LANDED, `P1` open.**

- **`P1`'s predicate** now scores off the shared reader, with the mapping taken from `topToken`'s
  own branch literals (426). Graded by `H5`, which slices the cured predicate out of the
  working-tree copy and runs it over the same four recordings `H1` uses.
- **`G6`** now slices *his loop* as well as his data, and its `ok` grades the repair with the
  **pinned anchor-only loop as its known positive** — that loop must *still* die on the cured blob,
  or the cell could not tell a repaired guard from a tree that stopped tripping the old one
  (355/364).

Both `H1` and `H2` slice from a **pin taken before the cure was written** (`MINE_DEFECTIVE_REV`,
`c3c6ec49`), so curing the subject does not empty the cells that prove the defect. That is the
class which has inverted a cell on this project five times (420/422/436/444).

## `P1`, re-scored: REFUSED again, for a second and different reason

| | |
|---|---|
| Round 444 | REFUSED — oracle unavailable; his instrument died at import |
| Round 446 | **REFUSED** — oracle available, his gate is `REFUSED: G4` with `red=[]` |

**Open, with the blocker named:** re-aiming his `G4` slicer at the cured `P2` spelling. That is his
own next-unit item, which he has already placed behind his vacuity harness — not a deferral for
time, and not mine to take.

## The recordings, in the order they were made

Each is kept for what it got wrong, not only for the verdict.

| file | what it shows |
|---|---|
| `drive1.r444-unmodified-at-his-repaired-rev.out` | Round 444's instrument, **unmodified**, at his repaired rev: `red=[G6]`, `refuted=[P1]`. Both defects, measured before anything was changed. |
| `drive2.child-stderr-leaked-into-the-recording.out` | 18 lines of another process's `SyntaxError` trace written into the head of my own recording, ahead of `SUBJECTS:`. `execFileSync`'s default **echoes** the child's stderr as well as capturing it; `stdio` is pinned now. |
| `drive3.final.out` | The same run with `stdio` pinned — clean. 4 legs green. |
| `drive4.h5-refuses-before-the-cure.out` | `H5` added and correctly REFUSING — **and its `stillHasOld` conjunct vacuous**: the evaluable slice ends at the `pred(` call, but the old predicate lives *inside* that call, so the check read `false` with the cure ABSENT. A conjunct the slice boundary makes true cannot be re-keyed red (380/381/385/386). |
| `drive5.h5-conjunct-re-keyed.out` | `stillHasOld` read off the whole `P1` region — now `true` with the cure absent. The conjunct is live. |
| `drive6.out` | After the `P1` cure: **5 legs green**, `P1` open. `stillHasOld` re-keyed once more onto the **final argument of the `pred` call** — a region-wide byte check goes true on the cured file too, because the cure's own comment and detail line quote what they replaced (371/383). |
| `drive7.r444-cured-and-re-driven.out` | Round 444's instrument with both cures in: **7 legs green**, `P2` LANDED, `P1` open. |
| `drive8.postcommit.out` / `drive9.r444-postcommit.out` | Both instruments re-driven **after** the commit, to check the verdict map survives its own promotion rather than rereading for it (420/422/436/444). |
