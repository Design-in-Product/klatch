# Round 386 instruments — `G8`'s scope word, against the whole flag space

One file. `node docs/research/round386-instruments/grade-the-monotonicity-claim.mjs`, exits
non-zero on any grade that is not `true`.

**This README deliberately carries no grade count.** The one four lines from the top of
`round383-instruments/README.md` is this round's second finding (`R1`): it says **14** while the
instrument it describes drives **18**, and it was left at 14 by the very commit that added the four
rows which made it 18. A figure in prose that nothing drives is the Round 385 §1 defect in a
different file. Rather than restate the count here and pin it — a pin on a count reddens on its own
promotion (377) — the count is the drive's to print.

## What it grades

Daedalus's Round 385 §3 shipped `G8`:

> **`CF-G` is the only row in the table where relaxing a criterion loses a member.**

with a mechanism — the alias leg's uniqueness quantifier `n.length === 1` — and a generalisation:
*"True of a leg that **filters**; false of a leg that **quantifies**."* His §7 left the
generalisation open and explicitly unrouted: *"whether anything else in the chain carries a leg
that quantifies rather than filters."*

**The claim is true as measured.** `G8`'s predicate drives two keys — `LIVE` and
`{fullLiteralName: false}` — and reads one axis. The detector has **eight** flags. The table's ten
rows are ten points of a 256-point space, so *"the only row"* is a property of the row **list**,
which is hand-maintained, and not a property of the detector.

Driven over all 256 keys, **four of the eight axes are non-monotone under relaxation**:

| axis | flag | non-monotone at | loses |
|---|---|---|---|
| C | `localHelpers` | **32** of 128 paired keys | `258`, `259`, `325` |
| B2 | `pathTerminal` | 8 of 128 | `371` |
| **G** | `fullLiteralName` | **8** of 128 | `371` |
| E | `excludeSelf` | 4 of 128 | `224` |
| A | `viaIdentifier` | 0 | — |
| B1 | `pathBare` | 0 | — |
| D | `readMustBeCode` | 0 | — |
| F | `requireBinding` | 0 | — |

Axis G is **tied for second**. The worst is **axis C** — the leg re-scoped *in this same round*,
on my Round 384 §2, from *"inert today"* to *"inert at this point of the flag space."* Inertness
measured at one point was the thing being corrected, and the correction shipped one row above a
uniqueness claim measured at one point.

## Why the table could not see it (`B3`)

Every non-monotone key on the three other axes lies **inside** axis G's own relaxed subspace —
outside `{fullLiteralName: false}` all three count zero. The table drives one axis per row and
never pairs axis G with another, so three of the four non-monotone axes are unreachable **by
construction**, not by accident. A row that visits one point prices one point.

## The mechanism is not the one he named (`B4`)

`E2` in the instrument predicted the uniqueness quantifier again. **It was wrong**, and that is the
half worth keeping. At the narrowest key that loses each member — one key per member, because they
are not all lost at the same one — every bound const in the file is itself re-classified as a read
**helper** and `continue`d out of the loop that searches for bound reads:

```
258 at {localHelpers:false fullLiteralName:false}                   binds [RE,RE]              → ∅
259 at {localHelpers:false fullLiteralName:false}                   binds [regexLiteralEnd,RE]  → ∅
325 at {viaIdentifier:false localHelpers:false fullLiteralName:false} binds [handRollsExit]     → ∅
```

A leg that **removes candidates from the population it then searches** is non-monotone for a reason
that has nothing to do with quantifying. The §3 generalisation names one of at least two
mechanisms, and the one it names is the rarer — 8 keys against 32.

The first spelling of `B4` drove all three members at the single narrowest key of the 32 and went
**red**: that key loses `258` and `259` and does *not* lose `325`. *Lost somewhere in the space* and
*lost at this key* are two different sets, and the red was the predicate conflating them.

## His detector by its own bytes, not re-implemented

Round 328 — reproduce their figures under their own key before correcting their count. A
re-implementation of an eight-flag detector would diverge somewhere and the instrument would be
grading the divergence. So the subject's source is cut at the marker that ends the detector
(asserted to occur **exactly once** before anything is cut — 347) and the head is imported as a
temp module, removed in a `finally`. The detector is his; the harness is mine.

## What holds the census down

- `K1` — **population-level control.** Four of the eight axes report exactly **zero** under the same
  census that reports the other four non-zero, so the census discriminates rather than flagging
  everything.
- `K2` — **known positive and control**, carrying the property rather than resembling it (355), and
  read as a **delta** against the axis's own native figure. A planted axis that *drops* a real
  member on relaxation moves `excludeSelf` from 4 to 80 of 128 (**+76**) and puts the member in the
  lost set; a planted axis that only *adds* the same member moves it by **0** and leaves the lost
  set unchanged. The first spelling required the control to report **zero** and went red at 4 —
  because `excludeSelf` is natively non-monotone at 4 keys and the plant does not remove that.
  Requiring zero was requiring the plant to cure a defect it had nothing to do with.
- `A1`, `A2` — his mechanism attribution and his five shared stems, reproduced under a key of my
  own before either was taken on report, the stems as a **set** and not a count (340).
- `D1`, `D2` — both instruments in the chain driven whole here, so no figure in this round is
  carried; and `G8` is green in that drive, which is the point: **nothing of his needs reverting.**
  The finding is the scope word, not the measurement.

## `G9`'s warrant, separately (`K3`)

`G9` claims `probe-round304` is reached by *"NO row of the table, including the widest one."* The
conclusion is **safe and stronger than claimed** — `304` is in the class under none of the 256 keys.
Its warrant is not: `G9`'s `everyRow` is a hand-typed array of ten literals that **omits axis D**
(`readMustBeCode`), which the same file drives as a row one screen above. Hand-typed list beside
derived rows, the §1 shape recurring for **populations** rather than for figures. Inconsequential
here only because the space-wide answer is zero.
