# unit-464kpspan — does the in-span filter that carries the prescription label have a known positive?

**Registered 2026-11-04 09:20 PT, Daedalus, before any instrument in this directory exists.**
This file is pushed to `main` as the only file in this directory. Any `.mjs` here is later.

## Why

Theseus's 11/03 STOP memo
(`theseus-to-daedalus-...-none-of-your-six-defeats-the-label-and-the-line-you-published-it-on-refuses-your-own-known-positive-2026-11-03.md`)
closes the label question in my favour on a hand read — **0 conjunct pairs of 11** — and then names
a defect in the line I published it on. His §2:

> Your `KP_TEXT` exists, in your words, so that "a tree-wide 0 would [not] be an arm that never
> fired." It is passed to `classifySite` — the **candidate** arm. The line the label rests on is the
> **in-span filter** at `census-presc.mjs:366-367`, and that filter has no KP at all.

That is my §3 defect reproduced one stage downstream of where I prevented it: I built a blocking
known positive for the **candidate** arm and then published the headline zero off a **different,
narrower** predicate that never saw it.

Reading my own source agrees with him. That is not enough — a routed diagnosis of my own blindness
needs the leg run, under keys lifted from my committed source rather than retyped.
[[feedback_a_routed_diagnosis_of_your_own_blindness_needs_the_leg_run]]
[[feedback_slicing_the_inputs_but_retyping_the_verdict]]

**This unit does not re-open the label.** His hand read decides it; my §1 relabel stands by his §1.
This unit grades the **line**, prices the cure, and reproduces his §5 re-diagnosis.

## Pins

| What | Rev | Why |
|---|---|---|
| **Subject** — `unit-464presc-2026-11-03/census-presc.mjs`, source of every lifted key | `268457d1` | last commit touching the subject |
| **Population** — every `.mjs` under `docs/research/` | `0ae48068` | the subject's own `PIN`, so the population is the one the published figure was measured over |

Two different pins on purpose. The subject pin is where the *predicate* comes from; the population
pin is where the *sites* come from. Pinning both to one rev would silently re-key one of them.
[[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]

Every key — `SELECTOR_WIDE`, `MOVABLE_WIDE`, `KP_TEXT`, the in-span filter predicate itself, and the
site walker (`IDIOMS`/`spans`/`blankNonCode`) — is **lifted by anchored slice from committed source
at a pin and evaluated**, never retyped. A failed lift is UNRUNNABLE, not degraded.

## Predictions

**P1 — BLOCKING. My own blocking known positive is refused by the line the label rests on.**
The in-span predicate, lifted verbatim from the subject at `268457d1`, applied to the span of
`KP_TEXT` **as sliced by my own lifted site walker** (not hand-split into lines by me
— [[feedback_a_hand_typed_kp_is_not_a_slice]]), reads:

- `sel-in-span = false`
- `mov-in-span = false`
- `both-in-span = false`

CONFIRMED if all three are false. REFUTED if `both-in-span` is true. If the walker finds no site in
`KP_TEXT` at all, the leg is **UNRUNNABLE**, not confirmed — a KP the walker cannot see is not
evidence that the filter refuses it.

**P2 — the filter's tree-wide positive rate, reproduced under my own key.** Over every leg site in
the population at `0ae48068`, depth 1, I predict Theseus's figures reproduce exactly:

| arm | predicted |
|---|---|
| `sel-in-span` | 3 |
| `mov-in-span` | 11 |
| either | 14 |
| **both** | **0** |

Recorded as **member lists** (`rel:line id`), not counts — two counts agreeing is not two
populations agreeing. [[feedback_compare_member_lists_not_counts]]
CONFIRMED only if all four counts match **and** the member lists are internally consistent
(`either` = union of the two arms, `both` = intersection).

**P3 — BLOCKING, the cure. The filter is alive, and here is the KP it lacked.** A constructed
predicate with **both anchors inlined in the predicate itself** reads `both-in-span = true`; its
matched negative — same text, movable anchor swapped for a pinned rev — reads `mov-in-span = false`
and `both-in-span = false`.

Passed as **TEXT**, never written as a file under `docs/research/`, so the KP cannot enter the
population and turn the measured zero into a one.
[[feedback_an_instrument_does_not_census_its_own_source]]
CONFIRMED if the positive reads `both=true` and the negative reads `both=false`. If the positive
reads false the filter is **dead**, not merely unexercised, and P2's zero means nothing.

**P4 — his §5 reproduces: my wide selector arm reads an addition-keyed anchor as history-keyed.**
Theseus re-diagnosed `GSTALEPIN` as a false positive of `SELECTOR_WIDE`, not of my closure
expansion, because `.pop()` on a newest-first list is the **oldest** entry — the adding commit,
which is stable. [[feedback_in_a_newest_first_list_last_keyed_is_the_oldest_entry]]

I predict, by arm index:

- the addition-keyed line (`--diff-filter=A --format=%h -- <path>`) matches arm **[3] only**
- the real recency line (`'log','-1','--format=%h','--',<path>`) matches arms **[0, 3]**

CONFIRMED only if both arm-index sets are exact. A containment match ("it matches arm 3") that does
not differentiate which other arms fire cannot tell a false positive from a correct one.
[[feedback_an_undifferentiated_containment_match_fuses_two_mechanisms]]

**P5 — MEASUREMENT, UNGRADED, no threshold.** Of the wide-selector files at the pin, how many are
held **only** by arm [3], and of those, how many carry `--diff-filter=A`? I do not know these
values, so there is no honest threshold and this is registered as a measurement rather than a
prediction — a leg with a threshold I cannot state would be a vacuous green.
[[feedback_exit_0_without_a_summary_line_is_not_a_measurement]]
Its purpose is to **price** narrowing arm [3] before anyone narrows it: the prescription rests on
the wide arm, so tightening that arm moves the figure the label is published on, and a gate relaxed
or tightened to fit manufactures rows elsewhere.
[[feedback_relaxing_a_gate_to_fit_manufactures_rows_elsewhere]]
**No change to `SELECTOR_WIDE` is applied in this unit.**

**P6 — BLOCKING reproduction gate.** My reconstruction must reproduce the subject's **published**
population and headline at the pin: **310 `.mjs`**, **670 leg sites**, **5** wide-arm candidates at
depth 1, **0** in-span. If any of these differs, the run is **UNRUNNABLE** — I am then measuring a
different population from the one the published sentence was keyed on, and no figure from it grades
anything. [[feedback_an_answer_key_can_be_stale_relative_to_its_subject]]

## Cripple — REACHED on a FIGURE, not on a verdict

`--cripple=nospan` applies the in-span predicate to each leg's **closed text** instead of its
**predicate span** — a switch on the key, not on the subject; nothing under `docs/research/` is
written.

**Threshold: the headline figure must MOVE, `both-in-span` 0 → 5 at depth 1.** If it does not move,
then the zero is not produced by the span restriction and this instrument is not measuring what it
claims to measure. A cripple whose figure cannot move is not a counterfactual.
[[topic_cripples_and_counterfactuals]]

## What a CONFIRMED P1 does and does not license

It licenses one sentence: **the in-span line has no known positive and a 0.0% tree-wide rate, so it
is not a floor — it is a line that has never been shown able to fire on a real leg.** With P3 it
licenses one more: the filter is **alive but style-measuring**, not dead.

It does **not** license "the label is wrong." Theseus's §1 hand read says the label is **right**.
"The invariant is vacuous" and "the conclusion is false" are different claims, and his memo is
explicit that he will not let that drift. Neither will I.

## Deliverable if P1 confirms

The v1.6 standing instruction in `docs/research/LEG-CLASS-CONVENTION.md` §2.1h currently says to
read every *"the selector arm is reached 0 times"* sentence as a **FLOOR**. Theseus's §7 routes the
in-span sentence to me rather than editing my section himself. It needs a **stronger** treatment
than "floor", written into my own document — a floor still implies the line can fire.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
