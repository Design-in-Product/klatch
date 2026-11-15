# Pre-registration C — unit-465readerset (2026-11-14)

**Filed:** 2026-11-14 17:26:47 PST (`date`-read), after arm B was driven, committed (`26cfd4a8`) and
pushed, and **before `arm-readerset-c.mjs` exists**. Same pin `e96741bf`.

## Why there is a C

Arm B's `B1` was refuted 36 against a predicted ≤12, and the over-report is **structural, not a
margin**. `DATA_STRING` fuses two things that are not the same mechanism:

- a reader name inside a **selector** — Theseus's `READERS = ['readVerdict', …]` membership list, a
  `new RegExp(name)`, a regex literal, an `.includes()` argument. The name is *matching* something.
- a reader name inside a **label** — `console.log('refused by readVerdict: …')`, a leg's reason
  string, a prose message. The name is *being talked about* and selects nothing.

So arm B's `24 of 36 ADMITS-NON-BEARING` is unpublishable, and the reason is worth stating plainly:
**my key is as wide as Theseus's was narrow.** His §4 key resolved the loop's iterated identifier and
required the denominator to name it, and found `0` carriers where the answer was 2 — a 100% false
negative behind a green leg. Mine admits any appearance of the name in quotes and reports 36 where
the selector count is smaller. These are one defect in opposite directions, and arm B's recording
stands verbatim with its 36 in it, as his stands with its 0.

## Predictions

- **`C4`** *(blind)* Splitting name-as-data into `SELECTOR` / `LABEL` by the **enclosing bracket and
  callee** cuts 36 files to **≤ 15** carrying at least one `SELECTOR` occurrence.
- **`C5`** *(blind)* Of arm B's **24** `ADMITS-NON-BEARING` files, **≤ 8** survive the split with a
  non-refusal-bearing reader named in a `SELECTOR` position.
- **`C6`** *(the known-positive leg, and the census is void without it)* Theseus's
  `unit-465refusalfate-2026-11-14/arm-refusalfate-a.mjs:73` — `const READERS = ['readVerdict',
  'readTail', 'readRows', 'readCorpusRows'];` — classifies as `SELECTOR` on **all four** names. A
  census that loses the one site we know carries the property is measuring something else.
- **`C7`** *(blind, and the interesting one)* Among `SELECTOR` sites that admit a non-refusal-bearing
  reader, a **majority name an `attested-rounds.mjs` reader** (`unattestedRoundsAt`,
  `casePathsPresent`, `attestedRounds`, `dirRounds`) rather than `readCorpusRows`. If so, the hazard
  Theseus named inside `verdict.mjs` is the **minority** case and the class actually lives in the
  second lib module — where **every** reader-shaped export lacks a refusal shape, so a selector there
  cannot admit a bearing reader at all.
- **`C8`** *(refusal ceiling — a precondition, not a forecast)* If more than **30%** of name-as-data
  occurrences land in `UNRESOLVED` (enclosing bracket found but callee not in either list, or no
  enclosing bracket), the leg goes **RED** and `C4`, `C5` and `C7` are **void by my own terms**,
  however well they agree with the hand map.
- **`C1`** *(restated from `PRE-REGISTRATION.md`, unchanged, now gradeable)* Sites carrying the
  **full** conflation — a `SELECTOR` admitting a non-refusal-bearing reader **and** a justifying
  sentence in refusal/exposure terms — corpus-wide: **exactly 1**, Theseus's.
- **`C3`** *(restated, unchanged)* At least one `C2` file never tests `.ok` on any reader result.

## Method commitments, fixed now

1. **Hand reading is primary at this population size.** Arm C prints the **verbatim source line** for
   every `SELECTOR` occurrence. The published classification is the hand map; the mechanical split is
   the instrument that produces the candidate list, and any disagreement between them is reported as
   a disagreement, not resolved silently in the arm's favour.
2. Arm C publishes with **`renderTail`**, not `renderVerdict`, because arms A and B published verdict
   lines whose leg and prediction reason strings — and therefore `B1`'s and `B4`'s actual figures —
   are **absent from their own recordings**. A verdict without its rows is not a measurement anyone
   can check.
3. `C1` is a claim about a **justifying sentence**, which no source key reads. It is graded by hand
   over the `C5` survivors only, and the arm says so rather than implying it censused prose.

— Daedalus
