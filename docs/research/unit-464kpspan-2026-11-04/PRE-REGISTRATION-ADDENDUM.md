# unit-464kpspan — addendum: P7/P8, registered 2026-11-04 09:24 PT, BEFORE drive2

**Registered after drive1, before any arm of drive2 ran.** `drive1.depth1.{out,err}` is kept
exactly as it ran, UNRUNNABLE and all. P1's threshold is **not** restated, relaxed, or re-aimed —
it stands as written and its recorded outcome stands as recorded.
[[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]

## What drive1 found, and why it is worse than the memo it answers

P1 hit the **UNRUNNABLE branch I registered for it**:

```
KP_TEXT, walked by the lifted site walker: 0 site(s)
UNRUNNABLE: the lifted walker finds NO site in KP_TEXT — P1 is UNRUNNABLE, not confirmed
```

Theseus's §2 says the in-span filter **refuses** my blocking known positive. The measurement says
something stronger and worse: **`KP_TEXT` is not a leg site at all under my own walker.** It has no
span to refuse.

The mechanism, read off the lifted source: `spans` is a **balanced-paren slicer** — it opens at
`check(` and walks until depth returns to 0 on the blanked copy. `KP_TEXT`'s first line is

```
check('GKPWITNESS', atRecencyHead === cellNow,
```

which never closes. Its other two lines carry `g([…])` — skipped, because that idiom sets
`firstArgIsString: true` and the first argument is an array literal — and `cell(`, which is not an
idiom at all. So the site count is 0, not 1.

**What this means for the published zero.** My §3 reasoning was "a tree-wide 0 would be an arm that
never fired, so here is a blocking KP." The KP was accepted by `classifySite`, which takes raw
**text** and never asks whether that text is a **site**. So the KP could never have graded *any*
stage keyed on a span — not just the in-span filter. The guard I built against a vacuous zero was
itself keyed on something weaker than the thing it was guarding.
[[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]

## P7 — BLOCKING. The repaired known positive, which IS a site.

A KP repaired **only** to balance its parens — same anchors, same shape, anchors still on the
neighbouring binding lines — passed as TEXT, walked by the same lifted walker, with its
declarations resolved through the **lifted** `closedTextOf` at depth 1 via a virtual-file hook.

Predicted:

- the walker finds **exactly 1** site in it
- that site's **span** is REFUSED by the in-span filter: `sel=false`, `mov=false`, `both=false`
- that site's **closed text** is ACCEPTED by the candidate arm: `wideWitness=true`

CONFIRMED only if all three hold. If the span reads `both=true`, Theseus's §2 is REFUTED and the
in-span filter does see a hoisted-binding KP. If the closed text reads `wideWitness=false`, the
repair changed the KP's meaning and the leg is **UNRUNNABLE**, not confirmed — a repaired KP that
no longer carries the property is not the same known positive.

## P8 — the mechanism, isolated by a ONE-EDIT counterfactual.

Appending the single missing `)` to `KP_TEXT`'s first line — **one character, nothing else** — must
take the site count from **0 to ≥ 1**.

CONFIRMED if 0 → ≥1. REFUTED if it stays 0, in which case the unbalanced paren is **not** the cause
and my diagnosis above is wrong. This is registered because "the slicer needs balanced parens" is a
claim about a mechanism, and a mechanism claim needs a counterfactual that moves, not a reading of
the source.
[[topic_cripples_and_counterfactuals]]

## One reporting fix, declared — not a threshold change

drive1 printed **no leg notes at all**, because `die()` fires before the legs table. Five blocking
legs (`GBOOT`, `GLIFT`, `GINSPANTEXT`, `GARMS`, `P6REPRO`) had already PASSED — including the
reproduction of the published 310 / 670 / 5 / 40 — and the recording lost every one of them.

drive2 onward streams each leg's verdict and note **as it is checked**. This changes **no
threshold and no verdict**; it changes only whether a run that dies leaves a diagnostic record.
A recording whose silence is not diagnostic is the harm.
[[feedback_exit_0_without_a_summary_line_is_not_a_measurement]]

---

# Addendum 2: P11, registered 2026-11-04 09:27 PT, BEFORE drive3

**Registered after drive2, before drive3.** `drive2.repaired-depth1.{out,err}` is kept exactly as
it ran, including its RED.

## What drive2 found: P3's matched negative was never matched

P3 went **RED**, correctly, and the defect is mine:

```
positive (inlined HEAD-ish movable) : sel=true  mov=true  both=true
matched negative (movable → pinned) : sel=true  mov=true  both=true
```

The **positive** behaves as predicted — a predicate with both anchors inlined reads `both=true`, so
the in-span filter is **alive**, not dead. The **negative** failed: it still reads `mov=true`.

Cause: I swapped `join(LIVE, …)` for `join('/pinned/0ae48068', …)` and called that "the movable
anchor removed." It was not. `MOVABLE_WIDE` has **five** arms, and the text still carried
`cell(` — which is arm `[3]`, `/\bcell\(/`, a movable anchor in its own right. I changed the
anchor's **identity** and checked that one thing had changed, without checking that the **property**
was gone. [[feedback_a_guard_on_identity_does_not_guard_value]]

A matched negative that does not remove the property is not a control; it is a second positive.

## P11 — BLOCKING. The corrected matched negative.

The criterion is **not** "one character changed" — that was the wrong criterion and is what produced
the RED. The criterion is that the negative differs from the positive in **exactly the property
under test**: every `MOVABLE_WIDE` arm absent, the selector anchor retained.

Negative: the inlined movable read replaced by a **pinned** read that goes through neither `LIVE`
nor `cell(`.

Predicted:

- positive: `sel=true`, `mov=true`, `both=true` (unchanged from drive2 — it was already right)
- negative: `sel=true`, **`mov=false`**, **`both=false`**
- and, reported as the check that the negative is really matched: the **count of `MOVABLE_WIDE` arms
  firing** on the negative is **0 of 5**, printed per-arm rather than asserted in aggregate, so an
  arm I did not think about cannot hide inside a true conjunction.
  [[feedback_a_joined_string_comparison_cannot_see_an_empty_member]]

CONFIRMED only if all of the above hold. If the negative still reads `mov=true`, the finding is that
I cannot construct a matched negative for this filter at all, and P3's aliveness claim rests on the
positive alone — which would make "the filter is alive" a **one-sided** result and I will say so.

## P5's `--diff-filter=A` column is a FILE-LEVEL co-occurrence, not an attribution

Recording this before it can be over-read, including by me. drive2's P5 says 18 of the 40
wide-selector files are held **only** by arm `[3]`, and that **8** of those 18 contain
`--diff-filter=A` somewhere. That 8 does **not** say arm `[3]`'s match in those files *is* the
addition-keyed line — the file containing both strings anywhere is a containment match that fuses
two mechanisms. [[feedback_an_undifferentiated_containment_match_fuses_two_mechanisms]]

It is a **flag for hand reading**, not evidence of a false positive at any of those sites. The price
of narrowing arm `[3]` is therefore bounded by **18 of 40 files (45%)**, with the share that are
genuine false positives **unmeasured** in this unit.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
