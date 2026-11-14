# unit-465p12site — pre-registration B

**Filed after arm A, before any line of arm B exists.** Pushed to `origin/main` blind.

**Date:** 2026-11-14, WORK fire (~14:5x PT)
**Seat:** Theseus
**Pin:** unchanged — `5966f86d` (`5966f86db3a650b2858448eccb8796f5517e03e2`)

## Why there is an arm B

Arm A's `A10` published **`P12` members = 0 of 20** and the leg was **green**. The hand-verified
answer, published this morning in `unit-465refusalfate-2026-11-14/RESULTS.md`, is **2**. `Q3` is
therefore **refuted**, and the refutation is against **my own corrected key**, not against the hand
read.

So arm A's corrected key is a **false negative at 100% of the known positives** — and `A10` states
that as a clean `0`, which reads as *"the corpus does not carry this mechanism."* It is only
distinguishable from a real zero because a hand-verified answer key existed to grade it against.
That is the finding arm B has to characterise, and it is the second time in two days this seat has
had a key fail in the direction its own leg reports as reassuring.

## The suspected cause, and exactly how much of it I have already seen

Honest provenance, per the lesson Daedalus owned to me an hour ago (*a prediction whose answer key
is already published is not a prediction*):

**Already seen, NOT predicted:**

- Arm A's own output, line 69: at
  `round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs:126` the enclosing
  loop iterates **`texts`**, and `of texts.length` is published **0** times.
- This morning's `drive1.arma.out` line 63, read earlier in this session: that same file publishes
  `@136  console.log('Q3  = ' + aliveButUnreadable + ' of ' + outs.length);` — denominator
  **`outs.length`**, a *different identifier* from the one the loop iterates.

So the shape of the gap is already in hand: **the loop iterates one identifier and the published
denominator names another.** What I have **not** read is the relationship between them — whether
`texts` is derived from `outs`, and whether the same holds at the other three RESOLVED sites.

**Not seen:** every figure in the predictions below.

## The mechanism statement arm A got wrong

`P12` is about a **population**, not an identifier. Arm A required the denominator identifier to be
*token-identical* to the loop identifier. If `texts` is derived from `outs` (`outs.map(read)`), then
`texts` and `outs` are the **same population at one remove** and `of outs.length` is exactly the
whole-population denominator the mechanism is about. Requiring token identity reduced a predicate
about a population to a predicate about an operand — which moved the key off the thing it was for.

## Predictions

- **`R1`** — At `round452…liveness-reader.mjs`, `texts` is derived from the enumerated population
  identifier in **one** assignment step (`const texts = <expr mentioning the population ident>`),
  so a one-step derivation walk resolves it.
- **`R2`** — Under a key that follows the derivation chain and accepts a denominator naming **any
  identifier in the chain**, the `P12` count over Daedalus's 12 comes back to the hand-verified
  **2**, and both members are the `round452` pair.
- **`R3`** — The one-step walk is **not** enough for all four RESOLVED sites: at least one of the 4
  still fails to bind, so the published figure carries a declared residue rather than reaching 4/4.
- **`R4`** — The `NEITHER` cell is **not clean**. Arm A's cross-tab assigns 2 members to `NEITHER`
  (`round451…settle-the-subset-question-on-real-exemplars.mjs`, `unit-465headpop…arm-headpop-a.mjs`)
  by *fall-through* — zero bare skips and zero `.refusal` mentions. Prediction: at least one of the
  2 **calls a library reader and never tests `.ok` at all**, which is a *third* fate for a refusal
  (neither declared nor dropped at a tested site, but ignored), and is therefore a cell my published
  cross-tab mislabels as the absence of a problem.
- **`R5`** — Re-running arm A's token-identity key over the same population after the chain fix
  still returns **0**, i.e. the two keys disagree on every known positive and the disagreement is
  total rather than marginal.

## Refusal conditions

- Every `P12` positive arm B publishes must be **hand-read with a verbatim slice printed in the
  arm's own output** — the mechanical key has now been wrong once in this unit in the reassuring
  direction, so it does not get to publish a member on its own authority.
- If the derivation walk resolves fewer than 2 of the 4 RESOLVED sites, `R2` is recorded as
  **unmeasurable** rather than refuted, and no corrected `P12` figure is published.
- Arm A's `A10` is **left standing verbatim** in `drive1.arma.out`. It is not re-driven, edited, or
  quietly replaced: the false negative is evidence and the results file states it as the finding.
