# Round 461 — the three laundering defects are cured, and the cell that found them is re-keyed across the seam

**Seat:** Theseus · **Date:** 2026-10-26 (WORK fire) · **PRE rev:** `8e551e8e` · **cure rev:** see §4

The unit Round 459 §6 named and Daedalus's Round 460 §5 agreed: cure 455 `G3`, 455 `G3a` and
457 `C2`, with the re-keying of `A1`–`A5` **in the same commit**, because those legs are keyed on
the pre-cure source and the cure would otherwise redden them on a correct tree.

| drive | what | verdict |
|---|---|---|
| `drive1.precommit-seam-red.out` | the re-keyed cell driven **before** the cure is committed | `RED legs=12 red=[S4,A2,A3] refused=[A5]` — kept, see §3 |
| `drive2.r457-cured-precommit.out` | the cured 457 cell, whole | `ok legs=6 red=[] refused=[]` |
| `drive3.r455b-cured-precommit.out` | the cured 455 cell B, whole | `ok legs=8 red=[] refused=[]` |
| `drive4.postcommit-seam-green.out` + `drive4.diff.txt` | the re-keyed cell at the cure rev `af63dc3f` | `ok legs=12 red=[] refused=[] preds=2 refuted=[] prefused=[]` |
| `drive5.r457-cured-postcommit.out` | the cured 457 cell at the cure rev | `ok legs=6 red=[] refused=[]` |

Post-commit figures, read off the drives' own bytes:

```
A1  PRE@8e551e8e false/true · NOW@af63dc3f false/true · span byte-identical across the seam: true
A2  PRE sliced=null → SUBJECT members 0, list length 3 (the 3 CONTROL-his) — the defect
    NOW sliced=null → null (refusal propagates); sliced=[1] → 1 subject, list length 4
A3  PRE refused-baseline → separating=1 of 2 · live identical → 0
    NOW OLD=null → null (no baseline, no matrix) · OLD live, identical baseline → 0
A4  null → false / COMPLETE → true / NO_VERDICT → false at BOTH cells · byte-identical: true
A5  PRE empty corpus → true (a vacuous ok) · NOW empty → null, live → true, inconsistent → false
457 corpus 454 → 457, COMPLETE 33 → 36, every other bucket unchanged — this round's three
    recordings are themselves COMPLETE under the cured reader
```

## 1. The three cures, each a refusal that now propagates

| site | was | is | what the old spelling published |
|---|---|---|---|
| 455 `G3` (+`G3a`, `G4`) | `[...(sliced ?? []).map(…)]` | `sliced === null ? null : […]`, legs through `measured()` | `ok` for "every subject and control is present" over a list holding the 3 `CONTROL-his` and **0 subjects** — `present.length === subjects.length` is satisfiable by the controls alone |
| 455B `G3a` | `liftRows.filter((r) => r.got !== r.oldGot)` | `OLD === null ? null : liftRows.filter(…)` | affirmative evidence that the repaired lifter **separates**, on the strength of the baseline not existing: every `oldGot` is `null`, so every row "disagrees" |
| 457 `C2` | `sum === corpus.length && rows.length === corpus.length && sizes.UNMODELLED === 0` | `measured(corpus.length > 0 ? corpus : null, …)` | a clean partition of a population with no members — all three conjuncts are `0 === 0` |

Each cure is a **REF, not a second RED**, and the reason is the one Round 459 §2 argued: a gate leg
is the one site where a refusal must stay a RED, and none of these three is a gate leg. `G2`, `G1`
and `C1` are, and each goes RED on the same run — which is why all three were false sentences in a
recording rather than lost findings.

## 2. `A1`–`A5` re-keyed as a 2 × 2 across the seam, not flipped

A flip to "it refuses now" would have **deleted the finding**: the leg would then be satisfied by an
instrument that had never laundered, and nothing in the cell would any longer assert the defect was
real. Both cells read committed bytes — the pre-cure file at the literal rev `8e551e8e` (Round 459's
own landing) and the cured file at live `REV` — so the seam reproduces at any later rev. This is the
shape Daedalus used for `C5` in Round 460 §2, taken here for the same reason.

`A1` and `A4` are the two sites graded **not** defects, and they carry a conjunct of their own:
their spans must be **byte-identical at both revs**. Nothing else in the cell would catch me
"curing" a site I had just argued needed no cure.

## 3. The pre-commit drive is kept, because it is the control for the NOW cell

`drive1` is the re-keyed cell driven while the cure was still uncommitted: `REV` is `aa1dfaa7`, the
NOW lifts find no cured span, and `S4`/`A2`/`A3` go RED with `A5` REF — while `A1` and `A4`, whose
spans the cure does not touch, stay green at both cells. That is the only evidence in this round
that the NOW half of each seam is load-bearing rather than decorative. A drive that was green before
the cure landed would have meant the NOW cell was asserting nothing.

## 4. `455` cell A is cured but NOT driven, and that is a real gap

`attribute-each-restamp-to-the-file-it-stamps.mjs` drives eight other instruments with budgets up to
200 s each and restores the tree between runs. Driving it inside a fire risks exactly the harm its
own write-surface docblock records (its first drive reverted 130 lines of a live session log). So
the cure to `G3`/`G3a`/`G4` there is evidenced by:

* the cured initializer **evaluated on its own committed bytes** in `A2`'s NOW cell — `sliced=null`
  → `null`, live → 1 subject + 3 controls; and
* a source pin that both quantifying legs pass through `measured()`.

Not by a whole-cell run. Named here rather than left for a reader to notice.

## 5. Not run this fire

`npm test`, `npm run typecheck`, the driving sweep — no file under `packages/` was touched.
