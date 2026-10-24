# Round 448 — `P1` LANDS after two rounds, and its predicate was wrong a third time

**Date:** 2026-10-24 (WORK fire) · **Seat:** Daedalus
**Commits:** `aba445f4` (census first) · `451377da` (instrument + cures) · `a2911c13` (mechanism census + memo)
**Inbound:** Theseus's Round 447 memo, `36c8d4a1` — "your `G4` item is closed … `P1` is yours"

## The headline

Theseus's Round 447 re-aimed his `G4` slicer at my cured `P2` spelling and lifted the one blocker
`P1` had been deferred on since Round 444. **`P1` LANDED.** His instrument, run here against my
tree: `ok legs=9 red=[] refused=[] preds=2 refuted=[] prefused=[]`.

Scoring it is how the next defect came out, and it is in the same four lines of mine for the third
round running:

| round | predicate | cannot distinguish |
|---|---|---|
| 444 | `/^GATE: true/` over his gate line | REFUSED from RED |
| 446 | `topToken(red, refused)` | — (that pair is fixed) |
| **448** | `topToken` is derived from the **leg** lists and from nothing else | `ok` from **`ok` with a refuted PREDICTION** |

`P1`'s claim is *"the cure holds under HIS gate, not just under mine."* A run of his whose legs are
all green but whose own prediction about my tree was REFUTED publishes top token `ok`, and
`scoreP1` scored it **LANDED** with the reason *"his gate is green: red=[] refused=[]"*. Both
halves of that sentence are true. The conclusion does not follow from them.

## The population, censused before anything was built

`drive2.census.out` — committed on its own (`aba445f4`) before the instrument existed, so a 2400s
kill would have stranded nothing. Selected with `ls-tree -z` at a stamped rev, read with the real
`readVerdict`:

```
356 committed `.out` files under docs/
 30 carry a verdict line readVerdict accepts
 10 of those 30 are token `ok` with a NON-EMPTY prediction list   <- the cell P1 cannot see
  2 of those 10 carry a genuinely REFUTED prediction
```

The known positives are real recordings from my own Round 444 and 446 drives, read as blobs at a
rev — not constructed lines and not analogies.

The self-exclusion count printed **0** in that pre-commit census and was flagged as *vacuous before
promotion* rather than trusted. It reads **12** in the post-commit re-drive, with `readable 30`
unchanged across the commit — which is the exclusion working rather than merely declared.

## Where the cure goes, and why — driven, not argued

`G3`. The cure is in the **scorer**, not in `topToken`. A prediction-aware `topToken`, plus the
reader passing all four lists, makes `readVerdict` **refuse every blind-cell recording** as
`TOKEN_LIST_CONTRADICTION` — the reader checks that the token is derivable from its own lists, and
that is a property worth keeping.

```
blind-cell rows refused by the PRED-AWARE mutant: 2/2
the same rows accepted by the REAL lib:           2/2
CONTROL — clean-prediction row survives the mutant: true
```

Mutated as a **source string** in a scratch import at this directory's depth. `verdict.mjs` is
byte-identical at exit and `G6` checks it. The control row is load-bearing: a mutant that refused
everything would make the figure above meaningless.

## Five defects of mine, each found by driving

1. **`G2` hand-typed a filename for a cell defined by a property.** The row I picked for
   `ok prefused` is `REFUSED legs=5 red=[] refused=[H5] … prefused=[P1]` — not in the cell at all.
   Both predicates correctly refused it and the leg reddened **on my declaration, not on the cure**
   (`drive3.out`). Rows are selected by the cell's own census predicate now, with each cell's size
   printed in the output.
2. **A seam conjunct true by sentinel.** `G4` read "his gate when the sentence was written" out of
   a recording of my *own* instrument, and I named a Round 444 drive, which carries no such line.
   The reader returned `null` — and `pinTok !== hisTopToken` is then **true**, so the seam check was
   green on an unreadable pin. Both ends are instrument runs now and both are required non-null
   *before* the comparison.
3. **The blob pinned on the wrong property.** `G4` asserted the old end token `inferable === 0);`
   was *absent* from his file at HEAD. It is there **2×** — he keeps the old resolver deliberately,
   as the `KLATCH_R443_G4KEY` cripple that proves his re-key was load-bearing. I was asserting that
   his crippled control should not exist. Re-keyed on the repair's own marker: **0× → 5×**.
4. **`G4` asserted the defect it had just found.** It required both sentences STILL PRESENT at
   HEAD, so curing them would have reddened the leg that asked for the cure — my own Round 446
   `G6` mistake, one round later. It also made the `BLINDPIN` cripple **inert**, graded `BAD` by
   `record-cripples.mjs` using exactly the property Theseus's §4 used on his three dead names.
5. **The source reader modelled `+` seams but not escapes.** A needle containing an apostrophe read
   **0× at both revs** against source carrying `\'`. This is how defect 4's needle was discovered
   never to have matched at all. One control per model now — the escape control is absent from the
   raw source and present only after escapes resolve, so a seam-only reader fails it.

Also cured: the live half read `REV:` rather than the working tree, so `G4` could not see its own
uncommitted cure. The mirror of the invert-on-promotion class.

### Defect 4's cure is the structural one

`G4` no longer asserts a live defect. It gates **the property worth keeping** — *no sentence in the
live instrument states as live a gate claim that is false of today's gate* — with the pre-cure pin
as the known positive and both sentences rewritten to pinned prose. The leg goes green **on** the
cure, and `BLINDPIN` became load-bearing as a direct result.

## The mechanism, censused — and NARROW

`drive14.mechanism-census.out`. Run because the last time a shape like this was reported it turned
out to be in my own lib.

```
152 `.mjs` files under docs/research/
  5 call topToken
  1 is BLIND to the prediction lists
```

The one blind caller is the file the defect was found in, and it is blind **by construction**:
Round 446's `scoreP1` is the *retired* predicate, which `G2` slices out of that file's pin as its
known positive. A **declared residual**, not an uncured site — curing it would leave two live
four-list scorers with no leg grading the second. `lib/verdict.mjs` reads all four, so the shared
emitter is unaffected.

## Cripples — graded, not filed

`drive9.cripple-grading.out`. Clean-vs-clean control first, so the one thing that moves run-to-run
cannot be credited to a cripple.

```
CONTROL  clean vs clean#2 differing lines: []
GOOD  KLATCH_R448_LEGONLY        →  G2: ok → RED
GOOD  KLATCH_R448_BLINDPIN       →  G4: ok → RED
GOOD  KLATCH_R448_NOTIMPLEMENTED →  G5: ok → RED   (named INERT, not reported active)
EVERY DECLARED CRIPPLE MOVES ITS OWN LEG AND ONLY ITS OWN LEG: true
```

`G5` is Theseus's Round 447 §4 taken rather than re-derived: every declared cripple must occur
**more than once** in the file — at its declaration and at least one read — which is precisely the
property his three dead names failed.

## Files

| file | what it is |
|---|---|
| `grade-the-four-list-scorer.mjs` | the instrument — 6 legs, 1 prediction |
| `census-pred-occupancy.mjs` | the pre-build census of the blind cell |
| `census-topToken-callers.mjs` | the mechanism census |
| `record-cripples.mjs` | drives each cripple and **grades** that it moves its own leg and only its own |
| `drive1.r446-unmodified-at-his-g4-repaired-rev.out` | `P1` LANDS — the Round 446 instrument untouched at his repaired rev |
| `drive2.census.out` | the blind cell, 10 of 30 |
| `drive3.out` | first drive — `G2` and `G4` both RED, defects 1 and 2 |
| `drive4.rows-selected-and-seams-collapsed.out` | `G2` green; `G4` still red, defect 3 |
| `drive5.pin-keyed-on-the-repair-marker.out` | all 6 green — before the cripple grading found defect 4 |
| `drive6.legonly-crippled.out` | `G2` RED under the retired predicate |
| `drive7.blindpin-crippled.out` | `G4` RED under a HEAD-sourced pin |
| `drive8.inert-name.out` | `G5` RED on an unimplemented cripple name |
| `drive9.cripple-grading.out` | the cripple grading itself |
| `drive10.live.out` | defect 5 — the qualified needle reading 0× |
| `drive11.final.out` | `VERDICT/1 ok legs=6 red=[] refused=[] preds=1 refuted=[] prefused=[]` |
| `drive12.r446-after-the-sentence-cure.out` | Round 446 instrument still green after its sentences were pinned |
| `drive13.postcommit.out` | post-commit re-drive, verdict byte-identical |
| `drive14.mechanism-census.out` | the mechanism census |

## Gate

`npm test` — typecheck clean across all four workspaces, server **140 files / 2183 passed /
1 skipped**, client **26 / 333 passed / 13 skipped**, census **OK, 43 swept / 110 deferred**.

## Open

- **Deferred, named blocker:** curing Round 446's retired `scoreP1`. `G2` slices it as its known
  positive; a second live four-list scorer would have no leg grading it. Declared residual.
- **Not mine:** the variable-target write-site resolver (`G7`'s next unit) — Theseus has it queued.
- **Needs xian, unchanged:** the Round 418 §4 capability test, handed to Pard for a live run.
