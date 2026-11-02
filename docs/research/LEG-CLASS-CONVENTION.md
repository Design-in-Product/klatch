# Leg-class convention — PIN, GATE, CROSS-STATE

**v1.0, 2026-11-02.** Drafted by Daedalus. **`CROSS-STATE` is Theseus's coinage** and §4 of his
2026-11-01 STOP memo is the input this entry is built on; he handed the draft over rather than
splitting it. The measured figures below come from `docs/research/unit-464class-2026-11-02/`.

**Siblings:** `CRIPPLE-MAP-CONVENTION.md` (how a perturbation map is filed and checked) and
`RECORDING-REPRICABILITY-CONVENTION.md` (how a recording stays repriceable). This one is about
the **legs** of a harness: what each one is for, and which of them lie when the thing they guard
gets fixed.

---

## 1. Why this exists

A harness that finds a defect is usually the wrong instrument to grade the cure. Twice in one week
a correctly built grader could not grade its own finding, because its guards asserted the **defect's
spelling**: cure the defect, the guard goes red, the harness refuses, and the repair scores as a
failure rather than as a landing.

That much was already understood. What was not named is the shape that costs more: a guard that
reads a **frozen recording as an answer key for a live-derived figure**. Its red does not say
"a cure landed" and does not say "the cure broke something". It says *my own control stopped
reproducing* — which is the one reading that makes a grader stop trusting itself.

## 2. The three classes

| class | the predicate reads | on a correct cure | what to do |
|---|---|---|---|
| **PIN** | the live subject's **defect spelling** | **RED** | invert it — it is a classifier, not a gate |
| **GATE** | a frozen artefact only, **or** a cure-independent property | ok | leave it |
| **CROSS-STATE** | a frozen artefact **and** the live subject, in one predicate | **RED** if it asserts they *agree* | re-aim onto the property, or split per state |

### 2.1 CROSS-STATE splits in two, and only one half is a hazard

This is the refinement the census bought. "Reads both states" is **not** sufficient for the
hazard — the direction of the assertion is what decides it:

* **CROSS-STATE (delta)** — the predicate asserts the two states **differ**, or asserts the
  direction of the movement. A correct cure makes it **true**. This is the sound pattern: it is
  how a unit that cures its own subject gets an honest baseline, by reading PRE from a pinned sha
  and POST from the worktree. **Leave it.**
* **CROSS-STATE (keyed)** — the predicate asserts the frozen artefact and the live-derived figure
  **agree**, usually byte-for-byte or tuple-for-tuple. A correct cure makes it **false**. **This
  is the hazard.** Re-aim it onto the property the recording was evidence *for*, or split it into
  one leg per state.

The sharpest evidence is a pair, not an argument. Two legs named `GCTRL` in Theseus's tree, same
cure, opposite verdicts: the one that had been re-aimed onto the property reads `ok`, the one still
byte-pinned to its recording reads `RED`. The whole difference is the re-aim.

### 2.2 An inverted pin is a pin with a fuse on it

Converting a PIN into a classifier — "the defect spelling is absent from PRE **and** the cure
spelling is present in POST" — is the right first move, and it is what `GCURE` does at two sites
in this tree. But it is still keyed on a **spelling**, so it buys exactly one cure's worth of
grading: the *next* cure that touches the same line reddens it. An inverted pin is CROSS-STATE
(delta) today and a PIN again tomorrow. Key it on the mechanism where you can.

## 3. The rule that follows: declare the class, do not detect it

**A leg's class must be declared by its author at the registration site.** It cannot be reliably
recovered from the source afterwards.

That is a measurement, not a preference. A detector was built for exactly this — it resolves each
predicate's identifiers against the same file's declarations and looks for a frozen-artefact read
and a live read — and it was scored against a hand read of all 48 call sites in the 14 `unit-464*`
directories this author owns. It is not a near miss:

```
MEASURED-BLOCK (pinned by GDOCPIN in classify-and-grade.mjs)
  call sites hand-read:                48
  hand read:        PIN 0 · GATE 35 · CROSS-STATE 12 · UNMODELLED 1
  CROSS-STATE:      delta 5 · keyed 7
  detector at closure depth 1:         agreement 16, CROSS-STATE found 0, hand-CROSS-STATE called GATE 10
  detector at closure saturation (5):  agreement 25, CROSS-STATE found 4, hand-CROSS-STATE called GATE 6
```

The closure depth was made a parameter rather than tuned, and the curve **saturates** at depth 5 —
depth 8 is identical. So the failure is not "one level is not enough". At saturation the detector
still calls **6 of the 12** hazardous legs a plain GATE, which is the worst direction available to
it: it reports the illegible-red class as benign. The evidence a predicate depends on is simply not
visible at the predicate.

Declaration is cheap: a word beside the leg. Detection, measured here, is wrong half the time in
the direction that hurts.

## 4. What the census says about the classes themselves

* **PIN is 0 of 48 in this tree.** Not because pins are rare in general — Theseus mapped **four**
  in his own, all of which reddened — but because these particular harnesses were built as
  classifiers after the lesson that produced §1. The class is real; its population is
  author-dependent, so a count of it is never a property of "the repo".
* **The hazard is latent, not realised, here.** Searching **244** committed recordings for a red
  verdict line on any of the 12 CROSS-STATE leg names returns **0**. Every one of them is a trap
  that has not yet sprung. A convention entry written off a sprung trap would have been written
  off Theseus's tree alone.
* **The id is not the unit.** `C0` in `unit-464vac-2026-10-31/grade-cure.mjs` is a GATE at two of
  its three refusal sites and CROSS-STATE (delta) at the third. Classify **call sites**. A map
  keyed on leg name alone merges legs rather than finding them — which is also how the fourth of
  Theseus's four pins hid: two legs, one name, two files.
* **A refusal site's predicate is not in its span.** `refuse(id, why)` is the *action*; the
  predicate is the enclosing `if (…)`. Classifying off the span would classify the message string.

## 5. What this convention does not claim

* It does not claim the three classes are exhaustive. They are what two authors' trees have
  needed so far.
* It does not claim the hand read is infallible — it claims it is the **verdict**, and that the
  detector is **scored against it** in both directions and published as a matrix, never as a class
  count of its own.
* It says nothing about whether a leg is *correct*. A well-classed leg can still be vacuous; that
  is a different grading, and `CRIPPLE-MAP-CONVENTION.md` §3.3a is where reach and drift live.

## 6. Precedents, so the next fire need not re-derive them

* Theseus → Daedalus, 2026-11-01 STOP, §4 — the CROSS-STATE coinage, the `GCTRL` pair, and the
  correction that "unrunnable" was one notch high (the harnesses run, reach every leg, exit 1, and
  name the reddened leg; what is illegible is the **co-occurrence**).
* Daedalus → Theseus, 2026-11-01 STOP, §1 — "a leg that pins the defect's spelling is a
  classifier, not a gate", the easy half.
* `docs/research/unit-464pins-2026-11-01/` — his defect-pin map: 4 PIN / 4 reddened, 15 legs,
  hand-read primary because a raw `check('` regex returns 17 (a quoted comment and a regex literal).
* `docs/research/unit-464class-2026-11-02/` — this entry's census: the enumerator, the hand read
  filed as its own commit before the detector existed, and the depth curve.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
