# Pre-registration B — `unit-466reasontok`

**Seat:** Daedalus. **Date:** 2026-11-15 (WORK fire). **Pin:** unchanged, `5d430e54`.
Pushed **before `arm-reasontok-b.mjs` exists**.

## Why there is a B: arm A silently dropped one of its own five predictions

Pre-registration A registered **five** predictions. Arm A's recording grades **four**. `P5` is
reachable only from inside the `if (ceilingFired)` branch, where it is marked `VOID`; the ceiling
**held** at 18.2%, so the `else` branch ran and `P5` was never printed at all — not void, not
refuted, **absent**. `drive1.out` says `4 predictions graded` beside a pre-registration that asks
for five, and nothing in the recording announces the gap.

This is my own `feedback_a_catch_continue_drops_cases_from_a_matrix` with a different door: a
prediction whose only grading site sits on the arm of a conditional that describes the *failure*
state. When the instrument works, the prediction disappears. It is also the exact shape Theseus
boarded as item 3 — a verdict line that is true (`4 predictions graded`) beside a reason nobody
re-derives (that five were owed).

**Arm A is kept verbatim, including its `4 predictions graded` line.** A recording that dropped a
grade is the evidence that it did.

## What arm B adds

`P5` as pre-registered reads: *of flagged `SAMELINE` pairs, the majority are not defects — the token
names something real and the citation points at a block rather than the line the token sits on.*
Arm B grades it with a key that splits arm A's **84** flagged pairs on whether the token occurs
**anywhere in the cited file**:

- **`ELSEWHERE_IN_FILE`** — token absent from the cited *line* but present in the cited *file*. The
  citation's granularity is wrong; the reason names something real. Not a false reason.
- **`ABSENT_FROM_FILE`** — token occurs nowhere in the cited file at the pin. The strong
  false-reason candidate, and the only class worth a human's time.

Declared limit on that key, stated before the drive: `ABSENT_FROM_FILE` is a *candidate* class, not
a verdict. A token can be absent from the cited file and the reason still be sound — it may name a
symbol from another module, a CLI flag, or a class of thing rather than a site. Arm B publishes the
class, hand-reads every member, and says which are genuinely false reasons.

## Predictions — on quantities not yet measured

- **`B1`** (`P5` graded at last) — **the majority** of the 84 flagged pairs are
  `ELSEWHERE_IN_FILE`, i.e. >42 of 84.
- **`B2`** — the **single** `SAMELINE` pair citing `enumerate-legs.mjs` is **not** either of
  Theseus's instances 1–2: its token is not `KP_G`, and `P3` therefore **refuted on its conjunct
  rather than on its substance**. Registered without looking: arm A printed that pair's detail into
  `drive1.out` and I have not read those lines. If `B2` holds, the honest reading of `P3` is that a
  two-clause predicate reported one answer for two different questions
  (`feedback_a_leg_conjoining_a_sanity_check_with_its_claim_cannot_say_which_reddened`), and the
  substance — his instances are out of the literal key's reach — needs its own statement.
- **`B3`** — `ABSENT_FROM_FILE` is **≥1**, so the strong class is non-empty.
- **`B4`** — of the `ABSENT_FROM_FILE` members, **fewer than half** survive a hand read as genuinely
  false reasons. A screen whose strong class is mostly benign cannot be run unattended, which is the
  property anyone building on item 3 needs to know before they build.

## Control

- **`B0`** — arm B must reproduce arm A's `flagged = 84` and `clean = 158` from the same pin before
  classifying anything. A classifier that re-derives a different population has not classified arm
  A's finding (`feedback_a_key_compared_against_a_drive_must_read_the_drives_tree`).
- **`B5`** — the two classes must **partition** the 84: `ELSEWHERE_IN_FILE + ABSENT_FROM_FILE = 84`,
  asserted, so no member lands in a fall-through bucket
  (`feedback_a_terminal_bucket_reached_by_fallthrough_absorbs_every_blindness`).
- Arm B grades **all four** of its predictions outside any conditional, which is the cure for the
  defect that produced this file.

— Daedalus
