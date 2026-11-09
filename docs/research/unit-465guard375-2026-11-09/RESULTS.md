# unit-465guard375 — results

**13 of 13 grades true, exit 0, on the FIRST run** (`grade-run1.txt`). Run 2 (`grade-run2.txt`) is
identical in every grade and adds one labelled NOTE about a mislabelled field in this grader's own
output; no predicate changed between the runs and both are kept so the diff is readable.

Subject: `scripts/probe-round375-…-passes-on-a-comment.mts` and its entry in
`scripts/sweep-probes.mjs`. Cure: `6f790f15`. Pre-registration: `35d736a7`, **committed before the
cure and before this grader existed**.

## The table

| # | state | prediction | reading |
|---|---|---|---|
| P0 | the shipped registry | every anchor unique | round373 file-line **1**, round225 file-line **1**, round373 file+expect **1**, round373's exit call **1**; the bare `expect:` line alone occurs **4** |
| P1 | CONTROL, verbatim registry | exit 0, `All 10` | exit **0**, own headline **All 10 regression checks passed**, 10 rows, no failing arm |
| P2 | `R225` renamed | `A0g` sole red, rows ≥ 1, headline | exit **1**, **A0g** sole red, **2** rows, summary line present |
| P3 | **THE DEFECT** — PRE-cure, same state | exit 1, **0 rows, no headline** | exit **1**, **0** rows, no headline, `TypeError: Cannot read properties of undefined (reading 'refusal')` |
| P4 | `R373` renamed | `A0r` sole red | exit **1**, **A0r** sole red, 2 rows |
| P5 | `R373` present, not a headline pin | `A0r` sole red | exit **1**, **A0r** sole red, 2 rows |
| P6 | **ORDERING** — +1-arm sibling, pin moved with it | PRE red at C1, CUR green | PRE exit **1**, **C1** sole red, child printed **All 16** · CUR exit **0**, **All 10**, no failing arm |
| P7 | +1-arm sibling, pin NOT moved | CUR red at C1 | exit **1**, **C1** sole red |
| P8 | the declined third guard | the mutant lookup is never REACHED | arms that reported at all: **A0g A0r** — no A3 row, no A5 row |
| P9 | `probe-round377` live | exit 0 **and** its C5 list unchanged | exit **0**, 13 rows, and C5 is `[ok]` reading **`A1 A2 A4 C2`** off a driven copy of this file |
| P10a/b/c | `entryProblems` on the edited entry | empty; not empty unrespelled; vacuous if deleted | `[]` · `["why says 8 where expect pins 10"]` · `["why states no figure, so the agreement rule is vacuous on it (expect pins 10)"]` |

Sites figure (`[NOTE] SITES`): the sibling's frozen total, **PRE 1 raw occurrence of the full
literal and 3 lines mentioning the number at all → CUR 0 and 0.** Removed, not refreshed.

## The three rows worth more than their checkmark

**P6 is the reason this file is step 3's head, and it is now a measurement.** My 11/08 §2 and
Theseus's 11/09 §7 both carried the remaining three as *"373 15→16, 375 8→10, 377 13→14"*, an
unordered list. It is not unordered. `probe-round375`'s C1 froze `probe-round373`'s arm total in a
**live predicate**, so the `373` bump landing first would have reddened a swept probe — exactly the
coupling this family keeps producing, and the third time in four fires that the obvious-looking order
was the wrong one. The leg drives the state rather than arguing it: the live sibling plus **one
asserted inserted arm** (a slice, not a hand-written stand-in) with its registry pin moved to match.
PRE red at C1, CUR green.

**P7 says the cure is a strengthening, not a desensitisation** — the same cell with the pin *not*
moved reddens the CURED C1 too. That matters because the easy reading of "replace the number with a
property" is that the arm got weaker. AGREEMENT is strictly stronger than both alternatives here: a
frozen number reddens on a legitimate bump, a `/^All \d+ …$/` SHAPE passes when a member's arms
silently vanish, and agreement catches that while surviving the bump. Step 1 reached the same split
from the other side; this is its first independent confirmation in a third file.

**P8 is a refusal, pre-registered, and it is the finding this unit adds to the pass.** The registry's
own note counts **11** live `.refusal!`/`.skip!` dereferences in this file. Two of them are registry
lookups. Only one got an arm. The mutant-registry lookup's red is **unreachable while A0g is green**
— the mutant module is one asserted substitution (A3) off the same source A0g read, and A5 already
asserts both member lists live — and the leg drives it: in the one state that could make it
`undefined`, **only A0g and A0r report at all**, no A3 row and no A5 row, so the line is never
reached. An arm there would have been a vacuous pin, and it would have been counted as coverage.
**A census of unguarded dereference SITES is not a census of reachable defects**, and step 3's
remaining two members should be read that way rather than site-by-site.

## Honesty notes

- **A mislabelled field in this grader, not in the subject.** The `own headline` column is the last
  `All \d+ regression checks passed` in a run's output, and `A0r` *prints the pin it read* — so the
  A0g cell reports `All 15 regression checks passed` while having 2 rows and never reaching section
  C. That is a pin echoed in a verdict row, not a headline. It decided nothing: no red cell's
  predicate reads the field, and P3's `own === null` is conjoined with `rows === 0`, where there is
  no row to echo. `[NOTE] OWN-FIELD` in run 2 says this in the output itself. The subject's own C1 is
  not exposed to it — its reader runs over the CHILD's output, and P7 is the control that proves the
  child's summary is genuinely last there.
- **One correction made in passing, inside the subject.** `driveSubject`'s `C-drive` measurement
  line published `.exec(out)?.[0]` — the FIRST headline — in output that carries several, because
  the child it drives mints a child of its own. It now reads the last. Same mislabelled-field shape
  as above, one level down, and the same hazard Theseus called out in his 11/09 §1.
- **Zero refusals this run.** All three refusals named in the pre-registration were spelled around
  in advance (the shared `expect:` line anchored on two lines; `lib/strip-source.mjs` copied beside
  each registry copy; the `HERE` block anchored as three lines because the subject carries that
  declaration a second time as a string). Naming them in advance is why there is no `grade-run0`
  here — unlike steps 1 and 2, which each lost runs to exactly these.

## What is NOT done, with blockers named

- **`373` 15→16.** Now UNBLOCKED by this cure — P6 is the leg that says so. Blocker was this file;
  there is none now beyond the fire's own budget.
- **`377` 13→14.** The FIGURE needs re-deriving before it lands: `13→14` was estimated on 11/08,
  before this morning's A0g/A0r precedent existed, and `probe-round377` holds **three** registry
  lookups in one block. P8 is directly relevant — some of those sites may be guarded by construction,
  so the arm count is a measurement and not an addition.
- **`round374b`** — Theseus's, step 4.
- **The shared guarded registry reader.** `scripts/lib/` holds 23 files and none mentions `SWEPT`.
  This unit grew the third and fourth private copies of this guard. Still unowned; Theseus's 11/08 §3.
- **`entryProblems`'s `MM/DD` datestamp hazard**, routed here by Theseus's 11/09 §6(a). Blocker:
  widening that rule is a registry-wide change; this unit's scope was two files. Noted live: this
  unit's own `why` carries `11/09`, which is self-unequal and therefore dropped by the rule — the
  hazard needs a date whose month and day agree.
