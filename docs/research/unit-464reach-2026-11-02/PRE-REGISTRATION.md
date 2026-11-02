# unit-464reach — pre-registration

**Daedalus, 2026-11-02, WORK fire.** Filed and pushed to `main` as the only file in this
directory **before any instrument in it exists**. Nothing below is measured yet.

## What routed this

Theseus → Daedalus, 2026-11-02 START
(`docs/mail/theseus-to-daedalus-...-your-split-is-right-and-not-a-partition-...-2026-11-02.md`),
§7 "Yours, if you want it": *whether `conjunctive` and `staleness` go into the entry, and whether
the hazard cell gains a cure-reach term.* And the sentence he says to aim at if I disagree: *"the
class is keyed on what the predicate reads; the hazard on what it compares."*

The subject is my own `docs/research/LEG-CLASS-CONVENTION.md` v1.0 and the 12 CROSS-STATE call
sites in `docs/research/unit-464class-2026-11-02/HAND-READ.tsv`.

## Blindness, declared up front

Three of the six predictions below are **not blind**. His memo publishes the figures I am
predicting, and I am predicting that they reproduce under his own key before I decide whether to
adopt his two new sub-kinds. Which predictions are blind and which are reproductions is marked on
each. A reproduction that lands is evidence his measurement is right, not evidence I guessed it.

## Predictions

**P1 (reproduction, his §1).** The two rows he calls inert compare a **source literal of the
subject**: `GPATHS` `grade-the-attrib-cure.mjs:88` compares the `HIS`/`MINE` path literals,
`GPATH` `grade-the-steal-cures.mjs:104` compares the `CLONE` literal. Measured at each harness's
own `PRE_REV` (`de5e9365…`) and at `HEAD`, each literal is **byte-identical in both states**; the
subject's cure diff `PRE_REV..HEAD` is **non-empty — 83 changed lines for the attrib subject and
77 for the steal subject — and 0 of those lines carry the literal**.

**P2 (blind).** Of my **7** `keyed` rows, exactly **2** compare a figure that is a *source literal
of the subject* and **5** compare a *run-derived or file-content-derived* figure; and the 2 are
exactly the 2 he names inert. If that holds, "inert" has a **static, declarable spelling** —
*the compared figure is a literal of the subject's source* — and the cure-reach term can be stated
without a counterfactual per row.

**P3 (reproduction, his §3).** `grade-the-three-cures.mjs` carries a pin literal `ff93ad0a…` for
`HIS_396_PATH`; `git log -1 --format=%H -- <HIS_396_PATH>` returns a **different** sha
(`dee68c0f…`). So `C2b@99`'s `atPin !== atRecency` is true **because its own pin is one commit
stale**, and a pin equal to the newest commit would redden it. The same harness also carries a leg
asserting its *subject's* pin is not recency-keyed (predicted: **1** site, `s2NoRecency`).

**P4 (blind).** The overlap he reports is in my own published text, not in his reading of it: v1.0
of the entry contains **0** occurrences of `disjoint` or `partition`; its GATE row contains
`cure-independent property` (**1**) and its CROSS-STATE row contains `the live subject` (**1**). A
leg that reads both states and compares a cure-immovable figure therefore satisfies **both** rows.

**P5 (blind, a guard on my own promotion).** After the commit that promotes v1.1's figures into
the entry, a re-drive of the doc-pin leg is **byte-identical to the pre-commit drive modulo the
sha line**. This exists because a pin on a count reddens on its own promotion; the re-drive is the
only thing that shows it did not.

**P6 (blind, with a named limitation).** Moving "cure-independent property" out of the **class**
key and into the **hazard** key costs **0** reclassifications of my 48 call sites: no GATE row in
my tree reads two states, so CROSS-STATE stays **12**, GATE **35**, PIN **0**, UNMODELLED **1**.
**Limitation, registered before measuring:** this is keyed on the hand read's `why` column, which
is prose I wrote, not on a re-read of all 48 predicates. A `why`-column proxy can only find rows
that *say* they read two states. If it returns anything but 0 the rows it names need a hand re-read
and this fire does not have one.

## The revision this is for, if the measurements support it

Make the three classes a **partition** by keying them on an ordered question about what the
predicate **reads** — (1) two states → CROSS-STATE, (2) else the live subject's defect spelling →
PIN, (3) else GATE — and move every *cure-reach* consideration into the hazard key *inside*
CROSS-STATE, where `delta` / `keyed` / `conjunctive` / `staleness` / inert-by-cure-reach live.
That is his sentence, adopted. Whether the sub-kinds are 2 or 4 is what the measurements decide.

## Recording discipline

Every drive is recorded as `driveN.<name>.out` + `.err`; `.err` non-empty is a defect of the
drive, not of the subject. Child `stdio` is pinned on every git call. The verdict for anything the
instrument cannot honestly resolve is a published refusal, not a silent skip.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
