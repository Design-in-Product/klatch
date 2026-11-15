# Pre-registration B — unit-465readerset (2026-11-14)

**Filed:** 2026-11-14, after arm A was driven, committed (`87854faa`) and pushed, and **before
`arm-readerset-b.mjs` exists**. Same pin `e96741bf`.

## Why there is a B

Arm A came back **`VERDICT/1 RED legs=5 red=[A5]`** and its own recording showed a second defect my
legs did not catch:

- **`A5` is refuted as a design claim.** I built the refusal key to admit a helper call
  (`return refuse('CODE')`) on the reasoning that a literal-only key would invert `readVerdict`.
  `disagree.length === 0`: `readVerdict`, `readRows` and `readTail` each ALSO write a literal
  `refusal: null` on their success return, so the literal-only rival produces the same nine answers.
  The leg is honestly red and the care bought nothing.
- **`bodyOf` mis-sliced four exports.** It takes the first `{` after the signature; for an export
  with a **destructured object parameter** that `{` is the parameter pattern. `renderVerdict@249-249`,
  `writeRecording@747-747`, `renderTail@1106-1106` and `attestedRounds@580-580` all report
  `endLine === line` and `rets=0`, so their class came off an **empty return set**. `A1`
  (`unparsed === 0`) stayed green because the brace match **succeeded on the wrong braces** — a
  present anchor is not an intact span.

So arm A's `reader-shaped: 9` is a **floor**, and `A2`'s direction rests on an under-counted
population. Arm B cures the slicer and re-measures before it censuses anything.

## Predictions on the cure

- **`B6`** *(blind)* Slicing the body from the **end of the parameter list** rather than the first
  `{` moves **≥ 2** exports out of `NEITHER` into a reader-shaped class (`NAME_READ`/`STATE_READ`).
  Reason offered, and gradeable separately from the predicate: `writeRecording` and `attestedRounds`
  both read git or fs state in bodies arm A never looked at.
- **`B7`** *(blind)* After the cure, `A2`'s **direction still holds** — reader-shaped exports lacking
  a refusal shape still outnumber those carrying one. A direction that survives a population cure is
  worth more than one measured once.
- **`B8`** *(blind)* The cure changes **no row among the four named readers** — none of
  `readVerdict`/`readTail`/`readRows`/`readCorpusRows` has a destructured parameter — so the headline
  table Theseus published and I verified is **unaffected** by my own slicer defect. If this is
  refuted, his table needs re-deriving too and that is the bigger finding.
- **`B9`** *(blind, and it grades arm A's green `A1` rather than the library)* Re-running arm A's
  own `unparsed === 0` check under the cured slicer still reports **0 unparsed**, confirming that
  `A1` was **vacuous** rather than wrong: it can report 0 whether the slice is right or not, so it
  was never a guard on span integrity.

## The selector census

`B1`–`B5` stand exactly as filed in `PRE-REGISTRATION.md` and are **not** restated or amended here.
`B5`'s 25% ceiling applies to arm B's occurrence classification and voids arm B's other figures if
it fires, including the cured property axis above.

## Grading

`B6`'s reason is graded separately from its predicate, per rule 4 of the original pre-reg: if ≥2
exports move but the two I named are not among them, that is **predicate landed, reason refuted**.

— Daedalus
