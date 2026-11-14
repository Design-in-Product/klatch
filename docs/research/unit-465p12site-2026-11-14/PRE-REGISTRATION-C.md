# unit-465p12site — pre-registration C

**Filed after arm B, before any line of arm C exists.** Pushed to `origin/main` blind.

**Date:** 2026-11-14, WORK fire (~15:0x PT)
**Seat:** Theseus
**Pin:** unchanged — `5966f86d`

## Why there is an arm C

Arm B's `R4` **landed on a true predicate with a false reason**, and chasing the reason found a
defect one level up — in the population key this seat published *this morning*.

`B7`'s predicate is true: `round451-instruments/settle-the-subset-question-on-real-exemplars.mjs`
calls a library reader once and never tests `.ok`. `B7`'s printed conclusion is that this is *"a
third fate: the refusal is neither declared nor dropped at a tested site."*

**That conclusion is false.** Hand-read at the pin, the call is
`const r = readCorpusRows(l);` → `if (r.rows.length === 0) continue;`, and
`docs/research/lib/verdict.mjs:662` returns **`{ rows, unknown }`** from `readCorpusRows` — there is
**no `.ok` and no `.refusal` on that shape at all.** The member does not test `.ok` because the
reader it calls has none to test. There is no refusal, so there is no fate.

## The defect that is actually load-bearing

This morning's `unit-465refusalfate` arm A widened Daedalus's population key from `readVerdict` to
**four** readers on this stated rationale, quoted verbatim from `arm-refusalfate-a.mjs:69–71`:

> His key named `readVerdict` specifically; mine admits readTail/readRows/readCorpusRows too,
> because those are the library's readers as well and **a consumer of one of them is as exposed to a
> refusal as a consumer of readVerdict**.

For `readCorpusRows` that rationale is **false**, measured. So the population under my widened key
is defined as *"instruments exposed to a reader refusal"* while admitting members that are not
exposed to one. That widening is what refuted Daedalus's `P1` this morning and what I published as
*"my set is a strict superset, so his 17/15/12 is right under his key"* — the superset claim is
arithmetic and survives, but the **meaning** of the extra members does not.

**It also sets the denominator of every figure in this unit:** arm A's `0 of 20`, arm B's `2 of 20`,
`A5`'s cross-tab over 20, and `A6`'s classification of "the 5 additions" are all keyed on that 20.

## Provenance, stated before predicting

**Already read, NOT predicted:** `readCorpusRows` returns `{ rows, unknown }` (`verdict.mjs:662`);
round451's call site and its `r.rows.length === 0` guard.

**Not read:** the return shapes of `readVerdict`, `readTail`, `readRows`; which population members
are admitted by which reader; every figure below.

## Predictions

- **`S1`** — `readVerdict` **does** return an `{ ok, refusal }`-shaped result. (Cheap: this unit has
  been reading `v.ok`/`v.refusal` off it all day.)
- **`S2`** — The four readers **do not** share one shape: at least two distinct return shapes exist
  across `readVerdict` / `readTail` / `readRows` / `readCorpusRows`, so "the library's readers" is
  a name for a set whose members answer different questions.
- **`S3`** — At least one member of the 20 is in the population **only** because it calls a
  refusal-free reader — i.e. it calls no reader that can refuse — and is therefore admitted to a
  population defined by exposure to refusal while having no exposure. Point prediction: round451 is
  such a member.
- **`S4`** — Daedalus's 12 are **unaffected**: every one of his 12 calls `readVerdict`, so the
  defect is confined to *my* widening and none of his members is admitted spuriously. (If this is
  refuted, the defect is his key's too and that must be said.)
- **`S5`** — Re-deriving the population under a **refusal-bearing-readers-only** key gives a count
  **strictly between 12 and 20**, so both this unit's 20 and this morning's 17 are overstated as
  "exposed to a refusal", and the corrected `P12` denominator shrinks. The `P12` **numerator** stays
  **2** — both carriers call `readVerdict` — so the published rate moves while the member list does
  not.

## Refusal condition

Each reader's shape is established by **reading its `return` statements at the pin and printing
them verbatim in the arm's output**, not by testing a sample input — a sample that happens not to
refuse cannot show whether a refusal shape exists.

Arms A and B stand verbatim. Their figures are **not** edited; `RESULTS.md` states the corrected
denominator beside them and says which figures move.
