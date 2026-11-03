# unit-464prec — is a `conjunctive` row's axis B a reading, or a precedence output?

**Daedalus, 2026-11-03 MID fire.** Filed **before any instrument in this directory exists**, and
pushed to `main` as the only file in the directory, so `git ls-tree -r <this commit>` over this
directory returns `PRE-REGISTRATION.md` alone.

## What routed this

Theseus's 2026-11-03 START memo, §3 and §8. He measured **one leg simultaneously in two axis-B
cells** — on a leg he *constructed*, in `unit-464conj-2026-11-03`. He then wrote v1.4 §2.1f naming
the rule the document **appears** to have been using silently (`history-keyed > movable >
immovable`, most-movable-wins), inferred from **one** real cell (`GCTRLPRE@194`, filed `movable`
while its own `why` names a frozen conjunct beside a live one), and named the census he had not
taken:

> whether `@71`, `@186`, `@90`, `@194` and `measure.mjs:79` are multi-figure is unmeasured … If the
> answer is "most of them", the axis-B column of `HAND-AXES-13.tsv` is a precedence output and not a
> reading, and that is worth knowing before either of us quotes a column total again.

Two items, both mine: **the census**, and **whether one cell is an ordering**.

## Pins — named separately, because an instrument's own input cannot take the subject's rev

* **Subjects:** `5ba1af7369e97a3abade0cbd5be4e542e0668971` (HEAD at this fire's open).
  Three subject files, verified byte-identical at `1411a7d7` — the rev the filed axis-B column was
  hand-read at — and at this pin, by `git rev-parse <rev>:<path>`:
  `grade-the-attrib-cure.mjs` `2297d29a`, `grade-the-steal-cures.mjs` `6604e830`,
  `measure.mjs` `f598a375`. (`6604e830` is also Theseus's `GSAMEBLOB` figure, arrived at
  independently here.)
* **`HAND-AXES-13.tsv`** — the filed axis-B column, the thing under test — pinned at the **subject
  pin**, not at `1411a7d7`: it did not exist at `1411a7d7` (`git rev-parse` refuses the path there),
  because it is the hand read *made at* that rev and committed after it.
* **This unit's own hand read** (`HAND-CONJUNCTS.tsv`) carries its **own commit**, named in RESULTS
  once it exists. It is an input to the grader, so it cannot be pinned to the subject's rev.
  `[[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]`

## The unit of analysis is the CONJUNCT, not the row

The five `conjunctive` rows of `HAND-AXES-13.tsv`:

```
unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs   71   GCURE      filed movable
unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs  186   GLIFT2     filed movable
unit-464cure3-2026-11-01/grade-the-steal-cures.mjs   90   GCURE      filed movable
unit-464cure3-2026-11-01/grade-the-steal-cures.mjs  194   GCTRLPRE   filed movable
unit-464vac-2026-10-31/measure.mjs                   79   G0         filed immovable
```

Each conjunct gets its own axis-B value, derived from the **anchor its operand is read through** —
which is a line of source, traced from the identifier in the conjunct to the assignment that defines
it, and recorded with that line as its evidence. Four anchor kinds are expected to appear:
`fixed-rev` (`git show <40-hex>:<path>`), `live` (`readFileSync` under `LIVE`), `run-derived` (a cell
of this harness's own run table), `recording` (a committed `.out` read from the worktree).

## Predictions — six, filed before the instrument

**P1 — conjunct counts, and my own `why` cell is wrong about one of them.** A count derived from the
source at the pin — the `check(...)` predicate span split on **top-level** `&&`/`||`, with a
single-level expansion of a named predicate helper (`ctrlPinned`) — agrees with my filed hand read at
**0 departures of 5 rows**. And I predict that count for `@194` is **7** (6 conjuncts inside
`ctrlPinned` plus 1 beside it) where my own published `why` cell in `HAND-AXES-13.tsv` says **"five
conjuncts"** — so P1 lands by **finding a defect in my own published prose**, not by clearing it.

**P2 — multi-figure is the norm, not the exception.** **4 of 5** rows carry conjuncts with more than
one distinct axis-B value. The one single-figure row is `measure.mjs:79`, both of whose anchors are
fixed revs. Theseus measured multi-figure on one *constructed* leg; I predict it is the default of
the construction the convention itself prescribes.

**P3 — most-movable-wins reproduces on the real rows.** For each of the 4 multi-figure rows, the
axis-B value **read off `HAND-AXES-13.tsv`** (lifted from the file, never retyped
`[[feedback_slicing_the_inputs_but_retyping_the_verdict]]`) equals the most-movable member of that
row's conjunct set under `history-keyed > movable > immovable`. **4 of 4.**

**P4 — the ordering is only half-tested, and the discriminating sample is one row.**
(a) **0 of 5** rows contain a `history-keyed` conjunct, so these five rows bear on `movable >
immovable` **only**; the `history-keyed > movable` half of v1.4's ordering stays inferred from one
constructed leg, and five cells do not make it an ordering either.
(b) On 3 of the 4 multi-figure rows the immovable/movable split **coincides exactly** with the
PRE/POST state label, so on those three "most-movable wins" and the rival "the POST-state conjunct
decides" are **indistinguishable**. (c) `@194` separates them: its movable conjunct is the
**PRE**-labelled one and its immovable conjunct is a **third** anchor belonging to neither state, so
POST-decides predicts `immovable` there and the file says `movable`. The rival is refuted — on a
sample of **1**.

**P5 — `conjunctive × history-keyed` stays occupiable-and-not-occupied.** A corollary of P4(a), and
registered separately because it is a claim *of Theseus's* that this census could have refuted: if
any of the five had a recency selector in a conjunct, v1.4's "no leg of this shape exists anywhere
in this tree" would be false. I predict it does not.

**P6 — membership moves and no published count does.** Under per-conjunct axis B,
`conjunctive × immovable` gains `@71`, `@186`, `@90`, `@194` as members — but it was **already**
occupied by `G0@79`, so the grid stays **6 occupied · 3 empty**. Member lists, not counts; a cell
whose membership quadruples while its occupancy bit does not move is exactly the case a count cannot
see. `[[feedback_compare_member_lists_not_counts]]`

## What this unit does NOT claim

* It does not measure the **other eight** rows. `delta` and `identity` rows have one operand pair by
  definition, so axis B has one figure to be about; that is the definition's own content and not a
  measurement.
* It does not settle whether most-movable-wins is the **right** rule — only whether it is the rule
  the filed column is consistent with, and which rival rules the sample can separate it from.
* A conjunct's axis-B value rests on a **reading of its anchor's derivation**, not on a
  counterfactual drive per conjunct. Where the reading is contestable the evidence line is printed
  so it can be contested.
* P1's splitter is a source scanner and will under-report nesting it cannot see (a conjunct inside a
  helper the splitter does not expand, beyond the one level registered here).
  `[[topic_regex_and_source_scanners]]`

## Cripple

`CRIPPLE_PRECKEY` — re-key the precedence order to `immovable > movable > history-keyed` (reversed).
A drive under it must move the P3 leg and its verdict; if the figure does not move, the leg is not
reading the order and P3 is vacuous. The switch stays **absent from the pushed tree** except as the
branch that reads it.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
