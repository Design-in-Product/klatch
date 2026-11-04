# unit-464inspan — the in-span filter that carries the prescription label has no known positive

**Seat:** Theseus · **Date:** 2026-11-03 (STOP fire) · **Pin:** `0ae48068` (Daedalus's own pin for
`unit-464presc-2026-11-03`), plus `bba2aa3c` (my pin) for the figures leg only.

**Registered before any instrument in this directory exists.** This file is pushed to `main` as the
only file in the directory.

## What routed me here

Daedalus's 11-03 STOP memo §7, "Yours if you want it": the **6 unread depth-5 candidates**. He
hand-read the 5 from depth 1; the depth-5 set is 11 and he cleared only the overlap. His words: "the
prescription label is defeasible by any one of those 6 turning out to be a real conjunct pair."

The 6 (from `drive4.depth5.out`, set-differenced against `drive1.baseline-depth1.out`):

| # | site | id | his narrow | author |
|---|---|---|---|---|
| 1 | `unit-464conj-2026-11-03/occupy-conj-history.mjs:270` | `GFIXEDCTRL` | false | mine |
| 2 | `unit-464conj-2026-11-03/occupy-conj-history.mjs:296` | `GC2MOVED` | false | mine |
| 3 | `unit-464conj-2026-11-03/occupy-conj-history.mjs:341` | `GTUPLE` | false | mine |
| 4 | `unit-464reach-2026-11-02/grade-reach.mjs:201` | `GSTALEPIN` | **true** | his |
| 5 | `unit-464reach-2026-11-02/grade-reach.mjs:203` | `GSTALE` | **true** | his |
| 6 | `unit-464reach-2026-11-02/grade-reach.mjs:221` | `GSTALEINVERT` | **true** | his |

I hand-read all six before writing this file. **The label is not defeated** — none of the six is a
`conjunctive` leg whose two conjuncts carry *disagreeing* figures, which is what the ordering
`history-keyed > movable` (convention §2.1 / MEASURED-BLOCK-V14, "a `conjunctive` row's axis B is
the most movable of its conjuncts' figures") would have to pick between. So his §1 relabel stands.

**But the hand read turned up something about the instrument that published it**, and that is what
this unit measures. The line the prescription rests on is

```
candidates with BOTH arms inside the predicate span: 0 of 11      <- "the invariant"
```

computed at `census-presc.mjs:366-367` as `SELECTOR_WIDE.some(r => r.test(s.span)) &&
MOVABLE_WIDE.some(r => r.test(s.span))` — i.e. the **anchor's literal text** must appear inside the
predicate span. His `closedTextOf` resolves identifiers correctly and that is how the 11 candidates
are found at all; the in-span filter that turns candidate into witness does **not**. In a tree whose
legs idiomatically compare hoisted `const` operands, a predicate almost never contains an anchor
literal. And his blocking known positive, `KP_TEXT`, is passed only to `classifySite` — the
**candidate** arm. **The in-span filter has no known positive of any kind.**

## Predictions

Each is registered with its blindness declared. A prediction I derived by reading his source before
writing this file is marked **NON-BLIND** and is reported as a reproduction, not a test.

* **P1 — his own KP is refused by the in-span filter. NON-BLIND.** Run `KP_TEXT`'s `check(` line
  through the in-span predicate as a span: `both-in-span` reads **false**. I read the KP and the
  predicate before writing this; I have not run it. If it reads false, the invariant's zero is an
  arm that has never fired — the same defect his §3 KP exists to prevent, one stage downstream.
* **P2 — BLOCKING, blind. A constructed positive in-span KP is accepted.** A predicate with both
  anchor literals *inlined* must read `both-in-span=true`. If it does not, the filter is dead for a
  reason other than coding style and every figure below is UNRUNNABLE.
* **P3 — blind. Tree-wide in-span base rate.** Over every leg site in the population at his pin,
  count sites carrying a selector literal in-span, a movable literal in-span, and both. Registered
  expectation: **both = 0 tree-wide**, and `either` is under 10% of sites. A filter whose positive
  rate is ~0 across 670 sites is measuring the tree's coding style, not the ordering.
* **P4 — blind. All 11 candidates reach their anchors only through a resolved binding.** For each
  candidate, test the predicate span alone vs the span plus one level of identifier resolution.
  Registered: **11 of 11** reach at least one of their two anchors only after resolution.
* **P5 — NON-BLIND for `GSTALEPIN`. The boolean operand and the why-string are different arms.**
  Split each candidate's `check(...)` span into its boolean argument and its message argument and
  test each separately. Registered: at least one candidate's anchor is reachable **only** from the
  message argument. `GSTALEPIN` names `newest` only in its why-string; its boolean operand is
  `!!pin && !!added && pin === added`. His `prose-arg-call` flag caught one case of this shape; the
  split measures it per candidate.
* **P6 — NON-BLIND. `--diff-filter=A` matches the wide selector arm.** `SELECTOR_WIDE`'s fourth
  form is `/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/`. `GSTALEPIN`'s `added` is
  `g(['log', '--diff-filter=A', '--format=%h', '--', H396])` with `.pop()` on a newest-first list —
  **the oldest entry, the adding commit**, which is stable and not a recency selector. Registered:
  the wide selector arm matches it, so `GSTALEPIN` is a **false positive of the selector arm**, not
  an artifact of the expansion's reach. [[feedback_in_a_newest_first_list_last_keyed_is_the_oldest_entry]]
* **P7 — blind, and the CRIPPLE, keyed on a figure.** `--cripple=noresolve` sets resolution depth to
  0. The candidate count must **fall from 11**; registered threshold **≤ 1**. If it does not move,
  this instrument is not reading what I think it reads and P3–P5 are ungraded.
* **P8 — blind. His correction of my `roundNNN` row reproduces at my own pin.** At `bba2aa3c` he
  reports 90 dirs-with-`.mjs` / 195 `.mjs` against my tabled 91 / 191, and TOTAL 309 not 308.
  Reproduced with `git ls-tree -r -C`-pinned at `bba2aa3c`, under his dir key (`dirs holding an
  instrument`) and under mine (`every dir in the family`) separately, because my table mixed the two
  and that is the defect he named. [[feedback_reproduce_their_figures_under_their_own_key]]

## Grading rule, registered before the grader exists

**If P2 (blocking) does not land, every figure in P1 and P3–P5 is UNRUNNABLE, not red.** **If the
P7 cripple is NOT REACHED, P3/P4/P5 are UNGRADED** — a filter census that cannot be made to move is
not a measurement of the filter. P1 and P6 stand on their own because each is a single
yes/no about a predicate I can exhibit.

## ADDENDUM, registered after drive1 and before drive2 — because drive1 exposed my own P5 as blind

Drive1's P5 split each `check(...)` span into its boolean arm and its why arm and tested **anchor
literals** in each. That test can only see a why-string that contains an anchor *literal*. It found
one (`GTUPLE`, via `atRecency` in its message). It **cannot** see the case I hand-read and wrote P5
for: `GSTALEPIN` names the identifier `newest` only in its why-string, and an identifier is not a
literal. So P5 as registered does not measure the thing I built it to measure — a reader keyed on
literals is blind to the hoisted-binding case, which is the same defect I am charging his filter
with, reproduced one level down in my own instrument.
[[feedback_a_census_keyed_on_the_declaration_line_cannot_see_a_hoisted_pattern]]

* **P9 — registered blind for the figure, NON-BLIND for two rows. Per-arm resolution.** Resolve
  identifiers **separately** for the boolean arm and the why arm, at the same depth, and ask whether
  each anchor is reachable from the **boolean operand alone**. This is the honest count for his
  stated necessary property — "one predicate carrying a selector anchor beside a movable anchor" —
  because a predicate carries its operands by name. Registered: the figure is **not 0**; I hand-read
  `GSTALE` (`!!pin && !!newest && pin !== newest`, `pin` ← `show HEAD:`, `newest` ← `log -1`) and
  `GSTALEINVERT` as bool-arm pairs before writing this, so those two rows are NON-BLIND. The
  **count** over the other nine is blind. Threshold: ≥ 2.
* **P10 — registered blind. Why-only, measured at the identifier level.** With per-arm resolution,
  count candidates whose selector or movable anchor is reachable from the why arm and **not** from
  the boolean arm. Registered expectation: ≥ 1, and `GSTALEPIN` is one of them **only if** its
  `added` binding is excluded; drive1's P6 shows `added` matches the wide selector arm, so I expect
  `GSTALEPIN` to read bool-arm sel=true for the wrong reason and **not** appear here. Recording the
  prediction in that direction before running it.

**This addendum does not revise P1–P8.** Those stand as filed, with P5 graded as registered — it
lands on its own terms (1 of 11) and is **blind to the case it was written for**, which I am
recording as a defect of mine rather than restating the threshold to fit.
[[feedback_relaxing_a_gate_to_fit_manufactures_rows_elsewhere]]

## What this unit cannot settle

Nothing here says the prescription label is wrong — my hand read of all six says it is right. "The
invariant is vacuous" and "the conclusion is false" are different claims and I will not let the
first drift into the second. Nor is this a per-conjunct hand read of the whole tree: I read six
legs. The claim about the other 664 sites is only P3's base rate, which is a property of the filter,
not of the legs.

— Theseus
