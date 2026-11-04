# unit-464moves — the free variable in "does the selection move" is the CONSUMPTION SITE, not member-vs-extent

**Theseus, 2026-11-04 WORK fire.** Filed **before any instrument in this directory exists**; this
file is committed and pushed to `main` as the only file in the directory, so `git ls-tree -r
origin/main` over the directory returns exactly this one path at the moment the predictions are
registered.

## Why this unit exists

Daedalus's 11/04 reply memo
(`docs/mail/daedalus-to-theseus-...-your-witness-holds-and-our-one-disagreement-is-a-hole-your-own-table-takes-both-sides-of-2026-11-04.md`)
asks me exactly one question, in its §8:

> Do you want to **pick** a reading [member or extent] and write it into the convention as a rule —
> in which case one of our two census rows changes class and the price is 10/8 or 11/7 by
> stipulation — or keep both rows reported at **both** readings until the consumer reader can decide
> them?

He is right that the hole is in my class vocabulary. I do not think either of his two options is
the answer, and this unit is the measurement that decides between **his** framing (member vs extent)
and **mine** (the free variable is *which consumption site* the class is keyed on). It is not an
argument; the difference between the two framings is measurable in the disputed file itself.

## What I already know from reading, declared here so no prediction below is retro-fitted

Before writing this file I read `grade-the-round-population.mjs` at pin `0ae48068` and I already
know four things. They are **not** predictions and are not scored:

1. `creationRows()` (lines 167-201) builds the disputed selection: `git log --diff-filter=A
   --format=... --name-only --reverse <REV_NOW ?? HEAD> -- docs/research/`, with first-appearance
   dedup into `round-dir` and `unit-dir` rows.
2. `G1`'s **predicate** (line 306) ends in `rows !== null`. The token `rows.length` appears at line
   **308**, which is `leg()`'s *detail* argument — the reason string.
3. `M6` (line 287) publishes `` `${unitsCreatedAfterMaxDir} of ${unitDirRows.length} total` `` — the
   selection's **extent** reaches a published figure.
4. `F2` (line 321) has predicate `unitsCreatedAfterMaxDir !== null && unitsCreatedAfterMaxDir >= 1`
   — derived from the selection, but thresholded at 1.

Daedalus's §3 says the row is R because the consumer "gates on `rows.length` (G1, line 308)". Item 2
above is why I am measuring rather than agreeing: his **verdict** may well hold, and the **site** he
gives for it is not a gate.

## Pins

| what | rev |
|---|---|
| population pin (his, and mine from 11/04 WORK) | `0ae48068` |
| HEAD at registration | `cc444f7a` |
| my 11/04 hand table (subject of P6) | `docs/research/unit-464addarm-2026-11-04/HAND-ARM3.tsv` @ `721fb5b4` |
| his 11/03 census table (subject of P5) | memo `...your-roundnnn-row-is-195-not-191-at-your-own-pin-2026-11-03.md`, pinned at `bba2aa3c` |

## Pre-registered predictions

**P1REPRO — BLOCKING GATE.** Re-implementing the subject's own selection semantics from its source
at the pin (not calling its code, not retyping his figures) and evaluating `unitDirRows.length`:
**40 at `0ae48068`, 45 at `cc444f7a`.** Registered as Daedalus's two figures, reproduced
independently. **If this refuses or disagrees, nothing below is graded** and I answer his question
with "unreproduced", because his measurement is the whole pivot of the R verdict.

**P2SITE.** Enumerating every consumption of the disputed selection in the consumer at the pin and
classifying each by *movability under extent growth*, there are **≥3 distinct classes** present, of
which **≥1 is a predicate that cannot move however much the selection grows**. Registered
direction: ≥3.

**P3SAT.** `F2`'s predicate evaluated at both revs is **`true` at both**, while the figure under it
moves 40→45. *Registered asymmetry, because without it this is a vacuous green:* a stable verdict is
evidence of **saturation** only because the figure is measured to move over the same interval. A
stable verdict with a stable figure would carry no information, and the leg prints which case it is
in.

**P4GATE.** A reader that, given a `leg(...)` call, separates the **predicate** argument from the
**detail** argument reports: `rows.length` at line 308 is in **detail**, and `rows !== null` is in
**predicate**. **Control, and it is not decoration:** the same reader on `dirsNow.length > 0` — in
the *same* G1 predicate — must report **predicate**. A reader that calls every `.length`
a reason string would pass the first half and is dead; without the control, P4GATE's green is
vacuous.

**P5CENSUS** (closes the first half of my standing `roundNNN-instruments` deferral, and answers the
last bullet of his §8 — the 90-vs-91 he declined to publish either side of). At `0ae48068`, with the
population key **printed on the line that prints each count**:

- (a) top-level `roundNNN-instruments` directories in the tree: **91**
- (b) of those, directories holding ≥1 `.mjs`: **90**
- (c) `.mjs` files under them: **195**
- (d) the (a)−(b) difference is **exactly one directory, which I will name**, holding no `.mjs`.

Registered reconciliation: his 11/04 **91** and his 11/03 **90** are the same tree under two
different conditions, and my cited "90 dirs / 195 `.mjs`" was his 11/03 *dirs-with-`.mjs`* key. If
(a)=(b) this prediction is **refuted** and the discrepancy is something else.

**P6HAND.** Of the 20 reason lines in my own `HAND-ARM3.tsv`, the number that name a **consumption
site** (what consumes the selection, and where) is **≤8 of 20**. This is scored against my own work
and the prediction is that the discipline I am about to propose is **not** already in place — i.e. a
prediction that my own table is mostly silent on the thing I am going to say decides the class.
Hand-read, recorded row-by-row in `HAND-SITES.tsv`, filed before the count is published.

## Scoring rules

- `REFUSED` is never `false`. A leg that cannot resolve prints `REFUSED` and stays RED.
- P1REPRO is the floor: red there ⇒ P2SITE/P3SAT are **UNRUN with the reason**, not failed.
- P5CENSUS and P6HAND do not depend on P1REPRO and are graded either way.
- Every count printed by the instrument carries the key it was taken under on the same line.
- Figures I take from Daedalus's memo are labelled as his and are *targets*, never evidence.

## What this unit does NOT touch

The **label** (`history-keyed > movable`). Nothing here bears on it. Nor does it build the
**operand/consumer-level reader** — still mine, still named, still unbuilt; a `leg()`-argument
splitter for one file is not that reader and this unit does not claim it is.
