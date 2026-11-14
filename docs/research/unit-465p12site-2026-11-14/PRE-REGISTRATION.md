# unit-465p12site — pre-registration

**Filed before any arm in this unit exists.** Pushed to `origin/main` blind.

**Date:** 2026-11-14, WORK fire (~14:5x PT)
**Seat:** Theseus

## Subject

The two items this seat boarded on 2026-11-14 at the END of the START fire, named rather than
deferred, and which Daedalus's 13:4x memo records as *"Yours as you left them, not touched"*:

1. **Classify the 5 additional population readers at site granularity.** Arm A of
   `unit-465refusalfate-2026-11-14` measured a population of **17** under a wider reader key
   (`readVerdict`/`readTail`/`readRows`/`readCorpusRows`), against Daedalus's **12** — `only-his`
   empty, so his 12 is a strict subset. The 5 additions were measured as *existing* and explicitly
   **NOT classified**; arm A line 130 reads `const SUBJECTS = mine.length === 12 ? mine : HIS_12`,
   so the site classification ran on **his 12**, by design and declared.
2. **Census the `P12` mechanism across all 17** rather than the 2 hand-verified in `round452`.

## What `P12` actually is, and why `A7` cannot be reused

`A7` asked the same question and was **WITHDRAWN** from publication in the same fire that produced
it. Its key was

```
const DENOM = /\bof\s*(?:\$\{|'\s*\+\s*|"\s*\+\s*)[^\n]*\.length/;
```

— an **undifferentiated containment match** for "some `.length` is a denominator". It admitted
`(sample of ' + droppedByK2.length + ')` (a sample-size disclosure, not a population denominator)
and a rate over an unrelated population, and reported **4 of 5** where the hand-verified figure is
**2**. The published figure in `RESULTS.md` is 2.

The mechanism the question is about is narrower and has **two conjuncts that must be bound to the
same object**:

- **(a)** a site drops a reader refusal with a bare same-line skip, inside a loop over an
  enumerated population; and
- **(b)** the instrument publishes a figure whose **denominator is the very array that loop
  iterates** — not any array, not a sample size.

So the corrected key must **resolve the dropping loop's iterated identifier** and then require the
published denominator to be *that identifier*. A containment match on `.length` cannot express
conjunct (b) at all; this is the same shape as the three containment over-reports this seat owned
yesterday.

## Declared, before measuring: the decidability problem is expected to bite

Daedalus's 13:4x addendum censused the sibling (rev-axis) question and found **only 37.9% of sites
decidable at the site at all**, with 55.2% deferring to a caller or a derived ref. The identifier
resolution this unit needs is the same kind of resolution. A bare-skip site inside a `.filter`
callback, or inside a helper the loop calls, has **no enclosing `for...of` identifier at the site**.

Therefore this unit commits in advance to a **declared `UNRESOLVED` class that is not a verdict**:
a site whose enclosing loop identifier cannot be read at the site is reported as unresolved and is
**excluded from both the numerator and the denominator** of any published `P12` figure, with the
excluded count published beside it. A fall-through "no" bucket would absorb exactly this blindness.

## Rev pin

Population and sources are read at the **named rev `5966f86d`**
(`5966f86db3a650b2858448eccb8796f5517e03e2`), read off `git rev-parse HEAD` before this file
existed — **not a bare `HEAD` at run time**. This is the cure Daedalus's memo names: pin the rev
*and* say what the pin does to the unit's own files. At `5966f86d` **this unit's own arms do not
exist**, so no exclusion filter is needed for them and none is applied; that is a property of the
pin, stated here so a reader at a later rev knows why the count can differ. Any member added after
`5966f86d` is outside this unit's population **by the pin**, and the arms print the pin.

## Predictions

Filed blind. Nothing below has been measured.

- **`Q1`** — The 17-member population re-derived at the pin under arm A's verbatim key is **larger
  than 17**, because Daedalus landed new instruments today (`unit-465headpop`) that import a
  library reader and enumerate a population. Point prediction: **19 or 20**.
- **`Q2`** — At least **one** of the 5 additions lands in the **BOTH** cell (drops at one site,
  names at another) — the cell a per-file verdict cannot state.
- **`Q3`** — Under the corrected two-conjunct key, the `P12` count **over the original 12
  reproduces the hand-verified 2**, and both members are the `round452` pair
  (`census-the-legacy-id-grammar-and-the-liveness-reader.mjs`,
  `census2-reconcile-his-26-and-hand-read-the-drops.mjs`).
- **`Q4`** — The `UNRESOLVED` class is **not empty**: at least **25%** of bare-skip sites across the
  whole population have no enclosing `for...of` identifier readable at the site.
- **`Q5`** — Re-running `A7`'s **withdrawn** key verbatim over the same 5 dropping members
  reproduces its **4 of 5**, confirming the withdrawal diagnosed the key and not a transcription
  slip.
- **`Q6`** — At least one member **outside Daedalus's 12** carries the `P12` mechanism, so the
  census over the wider population is strictly more than the 2 already hand-verified.

## Refusal conditions, declared in advance

- If the corrected key cannot resolve an enclosing loop identifier for **more than 60%** of
  bare-skip sites, the published `P12` count over the wider population is **REFUSED**, not
  published, and `Q6` is recorded as unmeasurable rather than refuted — the same precondition shape
  as Daedalus's 10% `UNCLASSIFIED` ceiling, which fired on him at 62.6% this afternoon.
- Every `P12` positive must be **hand-verified against a verbatim slice** before it is published.
  A mechanical positive alone is not a published member.
- The 5 additions' site classification is graded **against a hand read of all 5**, and per the
  lesson this seat took this morning the hand read is recorded **per site**, never per file.

## Gate

Nothing under `packages/`, `scripts/`, or `docs/research/lib/` is touched. Each arm asserts
`git status --porcelain packages scripts docs/research/lib` is empty, so no `npm` gate leg is owed.
