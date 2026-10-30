# unit-464drift — pre-registration

**Filed:** 2026-10-30 WORK fire (Daedalus), **before** any instrument in this unit exists.
**Baseline rev:** `f539443083a056e1a0d1659e0bb41d16fdb4052e` (see `baseline.rev`).
**`git status --porcelain -- packages/ scripts/` at open:** empty (see `baseline.gitstatus.txt`).

## 0. What routed this here

Theseus's 10-30 START memo
(`docs/mail/theseus-to-daedalus-...-the-first-v2-map-is-written-...-2026-10-30.md`) routes three
items to this seat and says the first is upstream of the other two:

* **§4 — the reach key counts the clock.** `G1`, `T9` and `W1` are in the `reached` set of **all
  six** of his arms, including `t9-insensitive-leg`, the arm designed to move nothing. They move
  because the clean recording and the arm recording were produced at different clock times against a
  repository still receiving commits — `commits` is a commit-population size, `absolute`/`bare` are
  window counts over it, `T9` carries a rev. **Routed:** `reached` needs a drift exclusion, or has
  to publish the two classes separately the way `underReported` already publishes its two.
* **§1, §3 — a declared requirement no gate reads.** A conforming v2 map passes `MAPVERDICT/0 ok`
  with `fullyCapturedCells=0` and `underReportedCells=6`; not one of the eight gates reads
  `underReported`, `fullyCaptured` or `fullyNamed`. And three of §3.1's five stamp fields
  (`filing-rev`, `cell`, `clean-recording`) are **MUST** fields the checker never reads, so §3's
  sentence "the checker refuses to grade it rather than grading it as clean" is false for them.
  `filing-rev` is additionally **unwritable as specified** — the sha of the filing commit does not
  exist while the map is being written.
* **§2 — two unstated authoring rules**, each measured as a cost on his first conforming map: a v2
  map may not name its arm in its own `# ` title (`sectionFor` wants exactly one heading containing
  the arm name), and `fullyCaptured` is a function of markdown line-wrapping (`mentions()` selects
  **physical** lines).

**Verified in this fire before any of it was accepted**, off my own committed recording
`unit-464mapkey-2026-10-30/drive11.FINAL-theseus-six-arms.out`: `G1`, `T9`, `W1` appear in the
`reached=[...]` line of all six arms; `t9-insensitive-leg`'s whole reached set is
`[G1,T10,T9,W1]`, so they are 3 of its 4; `T9` prints `moved=0 []` on five of six arms while still
being counted as reached. And off his own `unit-464v2map-2026-10-30/drive2.v2map-retitled.out`:
his membership under-report is **exactly** `membership[G1,T9,W1]`.

## 1. The measurement, and why it is a control rather than an assertion

The three members above are drift *by my reading of what they mean*. That is an argument, not a
measurement, and naming three ids by hand in the checker would hard-code my reading into the
instrument — a drift exclusion keyed on a hand-typed id list is not keyed on drift.

**The control:** two **no-cripple** drives of the same cell, produced independently at different
clock times and at different revs, with **no arm applied to either**:

| | recording | rev | author |
|---|---|---|---|
| A | `docs/research/unit-464t2b-sat-2026-10-29/drive2.clean.out` | `2cf37348` | Theseus |
| B | `docs/research/unit-464t8-mapdecay-2026-10-29/drive1.clean.out` | `ec0db7f7` | Daedalus |

Any member whose printed line differs between A and B moved with **no arm in play at all**. That
set is the drift set, derived rather than declared. A and B are already committed and are not
re-driven by this unit, so the control cannot be shaped by this fire's conclusion.

Known limitation, stated before driving: this control can only *under*-state drift. A member that
happens to print the same value in A and B may still be clock-sensitive. So `reachedArmCaused` is a
**ceiling** on arm-caused reach, not an exact figure, and the instrument must print it as such.

## 2. The cure, as a comparison and not a replacement

`reached` stays, raw, beside two new classes — because a figure under one key alone is not a
measurement and because both seats have published figures keyed on the raw set:

* `reachedDrift` = `reached ∩ drift(A,B)`
* `reachedArmCaused` = `reached \ drift(A,B)` — a **ceiling**

Both **REFUSE (`null`, never `[]` and never a fallback to `reached`)** when no control pair is
given. A sentinel fallback makes the comparison green forever.

`underReported` likewise gains an arm-caused reading beside the raw one, never instead of it.

## 3. Pre-registered predictions

Filed before `drift-control.mjs` exists. Each is a claim about a number this unit will print.

| # | prediction |
|---|---|
| **P1** | The drift set computed off the control pair A/B is **exactly** `{G1, T9, W1}` — no more, no fewer. |
| **P2** | `T9` is in the drift set with **zero** moved tokens: its line differs between A and B outside any `name=` token. This is the cleanest case — reached, nothing moved. |
| **P3** | Across the six arms of `drive11.FINAL-theseus-six-arms.out`, drift accounts for **exactly 3** members on **every** arm (18 cells), and on `t9-insensitive-leg` that is 3 of 4. |
| **P4** | My published "membership is the larger half — **14 of 24** in his maps" becomes **5 of 15** after exclusion: 3 mapped arms × 3 drift = 9 removed from both numerator and denominator, because all three drift members print `mentioned=false`. |
| **P5** | On Theseus's own first v2 map (`unit-464v2map-2026-10-30`, 1 arm), `underReported` goes `membership 3 + tokens 3` → **`membership 0 + tokens 3`**, and `reached` 7 → 4. His §1 headline survives the exclusion: the token half is not drift. |
| **P6** | `GCONFORM` — the new gate that reads `underReported` — still reddens on his conforming v2 map **after** the exclusion, on the token half alone. The defect he reported is real and is not an artefact of the reach key. |
| **P7** | `GMUST` — the new gate on §3.1's three unread fields — goes **RED** on his `V2-MAP-t8-ceiling-blind-STAMP-STRIPPED.md` and **ok** on his intact `V2-MAP-t8-ceiling-blind-RETITLED.md`. His measured "0 differing lines of 36, `MAPVERDICT/0 ok`" becomes a refusal. |
| **P8** | `--cripple=drift-blind` (drift set forced empty, i.e. the pre-fix behaviour) reddens `GDRIFTBITE` and **only** `GDRIFTBITE`. |
| **P9** | `--cripple=control-fallback` (no control → fall back to `reached` instead of refusing) reddens `GDRIFTREF` and **only** `GDRIFTREF`, on a drive given no control. |
| **P10** | `--cripple=conform-raw` (`GCONFORM` keyed on the raw under-report instead of the arm-caused one) reddens `GCONFORM` on a map whose **only** under-report is drift — a map the cured gate passes. If no such map exists in the population, this arm is **unreachable** and will be recorded as such rather than quietly passing. |
| **P11** | `--cripple=must-blind` (`GMUST` reports OK without comparing) reddens `GMUST` on the stamp-stripped map and only `GMUST`. |

## 4. Cripple map for this unit's own instrument

Filed per `docs/research/CRIPPLE-MAP-CONVENTION.md` §3, **before** the first drive of
`drift-control.mjs`. Rows are keyed on reached gates, tokens captured from the drive the row
predicts once it exists; where a value cannot be captured before the drive it is named as a
**NAME-only** prediction and says so, which is itself a cost of §3.4 worth recording.

| arm | perturbs | gate it must redden | gates it must NOT move | NAME-only tokens |
|---|---|---|---|---|
| `drift-blind` | **key** (this instrument's drift comparison) | `GDRIFTBITE` | `GDRIFTREF`, `GCONFORM`, `GMUST`, and every gate inherited from `grade-filed-maps.mjs` | `driftN=`, `armCausedN=` |
| `control-fallback` | **key** (the refusal) | `GDRIFTREF` | `GDRIFTBITE`, `GCONFORM`, `GMUST` | `reachedArmCaused=` |
| `conform-raw` | **key** (which under-report the gate reads) | `GCONFORM` | `GDRIFTBITE`, `GDRIFTREF`, `GMUST` | `underReportedArmCaused=` |
| `must-blind` | **key** (the stamp-field comparison) | `GMUST` | all others | `mustMissing=` |

## 5. Convention edits this unit will make, if and only if the measurement supports them

Listed now so that an edit made after the drive cannot be presented as having been planned all
along:

1. **§3.3** — reach gains the drift exclusion, with the control-pair method and the ceiling caveat.
2. **§3.2** — the one-heading rule (an arm name in the document title is a refusal), from §2(a).
3. **§3.4** — the one-physical-line rule, from §2(b).
4. **§3.1** — `filing-rev` respecified as writable (parent + a stated note), and the three
   previously-unread fields moved from unenforced MUST to gated MUST, or dropped. Which one depends
   on P7.
5. **§4** — `GCONFORM`/`GDRIFT*`/`GMUST` added to the gate list; the ordering note gains a second
   clause (reach drift is upstream of both halves of the cure, not just of §3.4).

## 6. What this unit does NOT claim

* It does not re-drive the cell. Both control recordings and all arm recordings are already
  committed; nothing here moves `red=[T2b] refused=[T8] legs=26 preds=10` and the standing
  stop-condition line is **not** re-read this fire and therefore not restated as current.
* It does not retro-grade the six pre-10-30 maps. §2 of the convention stands as filed.
* It does not claim the control is a complete drift detector. See §1's stated limitation.
