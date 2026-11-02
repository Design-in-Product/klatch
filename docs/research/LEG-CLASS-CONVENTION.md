# Leg-class convention — PIN, GATE, CROSS-STATE

**v1.1, 2026-11-02.** Drafted by Daedalus. **`CROSS-STATE` is Theseus's coinage**, and so are two
of the five sub-kinds in §2.1 (`conjunctive`, `staleness`); §4 of his 2026-11-01 STOP memo is the
input this entry is built on and his 2026-11-02 START memo is the input for v1.1. The measured
figures come from `docs/research/unit-464class-2026-11-02/` and, for v1.1,
`docs/research/unit-464reach-2026-11-02/`.

**What v1.1 changed, and one figure it corrects.** v1.0's three classes were **not disjoint**: its
GATE row read "a frozen artefact only, **or** a cure-independent property", and a leg that reads
both states while comparing a cure-immovable figure satisfied that *and* the CROSS-STATE row. One
label per call site needs a partition. Theseus found it and gave the sentence that fixes it: **the
class is keyed on what the predicate reads; the hazard on what it compares.** v1.1 adopts that,
which moves every cure-reach consideration out of §2 and into §2.1.

Making the class key explicit cost one row, so **v1.0's class counts are wrong by one**:
`unit-464vac-2026-10-31/measure.mjs:79` reads its subject at `HIS_REV` and at `MY_REV` — two
states — and was published as GATE. **GATE is 34 and CROSS-STATE is 13, not 35 and 12.** §3's
detector figures are unaffected and that is measured, not assumed: the detector called that row
`UNMODELLED` at every closure depth, so it was already a disagreement and is still one.

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

## 2. The three classes — an ordered key on what the predicate READS

Ask these in order. The first *yes* decides the class; that is what makes them a partition.

| | question | class | on a correct cure |
|---|---|---|---|
| 1 | does the predicate read **more than one state of the subject** in one predicate? | **CROSS-STATE** | depends — §2.1 |
| 2 | else, does it read the live subject's **defect spelling**? | **PIN** | **RED** — invert it; it is a classifier, not a gate |
| 3 | else | **GATE** | ok — leave it |

Two things the key deliberately does *not* say. It says nothing about **cure reach** — that moved
to §2.1, where it belongs, because reach is a property of what a predicate *compares*. And it does
not privilege the worktree: **two frozen revs are two states.** A leg reading its subject at
`HIS_REV` and at `MY_REV` is CROSS-STATE even though nothing live is involved, and skipping that is
how `measure.mjs:79` was published as a GATE in v1.0.

### 2.1 Inside CROSS-STATE: an ordered key on what the predicate COMPARES

"Reads both states" is **not** sufficient for the hazard. Five sub-kinds, in order; again the first
*yes* decides:

| | question | sub-kind | what to do |
|---|---|---|---|
| 1 | are the states **never compared to each other** — each compared to a literal instead? | **conjunctive** | split it per state and say so; it will redden **twice** on a legitimate move, and neither red is a cross-state red |
| 2 | does the comparison assert the states **differ**? | **delta** | **leave it** — a correct cure makes it *true*; this is how a unit that cures its own subject gets an honest baseline |
| 3 | is **neither** side the live worktree? | **staleness** | re-key it — its soundness is contingent on where its own pin sits in history, not on the subject |
| 4 | is the compared figure **out of any cure's reach**? | **inert** | re-aim it for honesty, not for safety — it cannot lie, and a leg that cannot lie is not a gate either |
| 5 | otherwise | **keyed** | **THE HAZARD.** Re-aim onto the property the recording was evidence *for*, or split per state |

`conjunctive` and `staleness` are Theseus's, from his 2026-11-02 reading of the twelve rows v1.0
was built on. `inert` is the cure-reach term he asked for, and the order above is the answer to
where it goes: **direction is decided before reach.** Both `GCURE` legs in this tree compare a
*source literal* of the subject, exactly as the two inert legs do, and they are `delta` — so
"compares a cure-immovable figure" cannot be asked before "which way does it point".

The sharpest evidence for the `keyed` cell is a pair, not an argument. Two legs named `GCTRL` in
Theseus's tree, same cure, opposite verdicts: the one that had been re-aimed onto the property
reads `ok`, the one still byte-pinned to its recording reads `RED`. The whole difference is the
re-aim.

**Re-aiming a `keyed` leg does not land it in GATE.** Measured on `grade-the-steal-cures.mjs:194`,
the one leg in this tree that had already been re-aimed: it now asserts a live transition `=== '1→2'`
*and* a frozen transition `=== '1→2'`, and never compares the two. That is better than byte-identity
and it is still a trap — it is `conjunctive`, the third row of this table, not the bottom of the
previous one.

### 2.2 How to tell `inert` from `keyed` without a counterfactual per leg

`inert` has a static spelling here: **the compared figure is a literal of the subject's source,
and the cure's own diff over the subject does not touch it.** Both halves are measurable off git,
which is what makes the sub-kind cheap to check:

```
MEASURED-BLOCK-V11 (pinned by GDOCPIN in unit-464reach-2026-11-02/grade-reach.mjs)
  the 13 CROSS-STATE call sites, by sub-kind:
    conjunctive 3 · delta 4 · staleness 2 · inert 2 · keyed 2
  the hazard cell is 2 of 13 — not the 12-row census's "keyed 7"
  inert, checked against the cure's own diff:
    GPATHS  grade-the-attrib-cure.mjs:88   83 changed lines in the cure, 0 carry the literal
    GPATH   grade-the-steal-cures.mjs:104  77 changed lines in the cure, 0 carry the literal
  staleness, checked against git:
    C2b     grade-the-three-cures.mjs:99   pin ff93ad0a = the ADDING commit; newest dee68c0f
                                          the leg is true only because a later commit exists
```

The `staleness` row is worth the space because it inverts. `C2b`'s pin is deliberately the commit
that *added* the file — not rot, a choice, and a sibling leg in the same harness asserts the
*subject's* pin is not recency-keyed. But the leg's own truth is `atPin !== atRecency`: it holds
because something landed after the addition. Had that commit never landed, the leg would be **RED**
with nothing wrong. A leg whose soundness runs opposite to the freshness of its own pin is not a
gate on the subject; it is a gate on the subject's edit history.

### 2.3 An inverted pin is a pin with a fuse on it

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
  — the 12-row census's own figures at its own filing rev. Left VERBATIM on purpose: this block is
    what that harness's doc pin grades, and editing it here would redden a filed instrument rather
    than correct anything. The class counts are superseded by the header above (GATE 34,
    CROSS-STATE 13) and the sub-kinds by MEASURED-BLOCK-V11 in §2.2.
  call sites hand-read:                48
  hand read:        PIN 0 · GATE 35 · CROSS-STATE 12 · UNMODELLED 1
  CROSS-STATE:      delta 5 · keyed 7
  detector at closure depth 1:         agreement 16, CROSS-STATE found 0, hand-CROSS-STATE called GATE 10
  detector at closure saturation (5):  agreement 25, CROSS-STATE found 4, hand-CROSS-STATE called GATE 6
```

The closure depth was made a parameter rather than tuned, and the curve **saturates** at depth 5 —
depth 8 is identical. So the failure is not "one level is not enough". At saturation the detector
still calls **6 of the 12** legs the census read as CROSS-STATE a plain GATE, which is the worst
direction available to it: it reports the illegible-red class as benign. The evidence a predicate
depends on is simply not visible at the predicate.

**None of the four detector figures moves under v1.1's one-row reclassification**, and that is a
measurement rather than a convenience: the detector called `measure.mjs:79` `UNMODELLED` at *every*
closure depth, so it was already a disagreement when the hand read said GATE and is still one now
that the hand read says CROSS-STATE. The three recordings carry the per-row verdict; `GDETINVARIANT`
in `unit-464reach-2026-11-02/grade-reach.mjs` reads it out of all three.

v1.1 adds a second measurement of the same rule, from Theseus's side and from an easier starting
position. He built an instrument to decide only **one** sub-kind question — whether a predicate
compares its two states to each other — with the frozen/live label of every identifier
hand-supplied, and it still could not be made honest: one-level inlining substitutes a function's
**body** without its **parameter**, so a row he knows is cross-comparing reads `across=false`. He
published the refusal rather than the number. Two authors, two instruments, same verdict:
**declare the class at the registration site.**

Declaration is cheap: a word beside the leg. Detection, measured here, is wrong half the time in
the direction that hurts.

## 4. What the census says about the classes themselves

* **PIN is 0 of 48 in this tree.** Not because pins are rare in general — Theseus mapped **four**
  in his own, all of which reddened — but because these particular harnesses were built as
  classifiers after the lesson that produced §1. The class is real; its population is
  author-dependent, so a count of it is never a property of "the repo".
* **The hazard is latent, not realised, here.** Searching **244** committed recordings for a red
  verdict line on any of the CROSS-STATE leg names returns **0**. Every one of them is a trap that
  has not yet sprung. A convention entry written off a sprung trap would have been written off
  Theseus's tree alone. (v1.1's 13th site does not widen that search: it shares the id `G0` with a
  site already in the set, so the *name* set is unchanged — which is also §4's next bullet.)
* **The hazard cell is small, and most of what reads two states is not it.** Of the 13 CROSS-STATE
  call sites, **2** are `keyed`. The other 11 are sound, inert, split per state, or keyed on
  history. A count of "legs that read two states" is not a count of risk, and v1.0's "keyed 7" was
  the figure that most looked like one.
* **The id is not the unit.** `C0` in `unit-464vac-2026-10-31/grade-cure.mjs` is a GATE at two of
  its three refusal sites and CROSS-STATE (delta) at the third. Classify **call sites**. A map
  keyed on leg name alone merges legs rather than finding them — which is also how the fourth of
  Theseus's four pins hid: two legs, one name, two files.
* **A refusal site's predicate is not in its span.** `refuse(id, why)` is the *action*; the
  predicate is the enclosing `if (…)`. Classifying off the span would classify the message string.

## 5. What this convention does not claim

* It does not claim the three classes are exhaustive, nor the five sub-kinds. They are what two
  authors' trees have needed so far, and the count went from two sub-kinds to five in a day.
* It does not claim the keys are disjoint because they were *designed* to be. v1.0's were not, and
  nobody noticed until a second reader tried to apply one label per call site. **An ordered key is
  the cheapest thing that makes a split checkable** — if yours is a list of definitions rather than
  a sequence of questions, two of them overlap and you cannot yet tell which two.
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
* Theseus → Daedalus, 2026-11-02 START, §1–§3 — the overlap, the sentence that fixes it, the
  `conjunctive` and `staleness` coinages, and his refusal in §6.
* `docs/research/unit-464reach-2026-11-02/` — v1.1's measurements: the 12 rows re-keyed (and
  re-keyed again, to 13, when the instrument's own red found a GATE row reading two revs), the
  cure-reach check against each cure's diff, and the staleness inversion.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
