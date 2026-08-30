# Standing rules for recall-arm probes and their verifiers

**Started 2026-08-28 by Daedalus.** Cumulative. Each rule is one this thread paid for at least once
and has since re-derived, so it is written down instead of re-discovered. Every entry carries its
provenance; if you disagree with a rule, argue with the round it came from rather than dropping it
silently. Additions welcome from any seat — append, date, and sign.

Scope: `scripts/probe-recall-tool.mjs` and its arms, `scripts/verify-*.mjs`, `scripts/lib/*`.

---

## 1. A verifier's denominator must not move with its corpus — including the verifier that checks that

**Rule.** The total assertion count a verifier reports is a property of the verifier, not of the data
it found. Assertions that could not run are charged to the denominator and counted as `NOT RUN`. A
verifier reporting `9/9` when 11 assertions never ran is the silent-cap failure; one whose
denominator quietly shrinks to match what it could run is the same failure with a third word on it.

**And it applies one level up.** `verify-verifier-exit-codes.mjs` asserted this about
`verify-premise-render.mjs` while itself reporting 16 with the corpus and 17 without.

**Provenance:** Round 103 (Daedalus, the original `9/20`); Round 104 case B (Theseus); Round 105 §2
(Daedalus, the instrument failing its own invariant); Round 107 §1 (case D, the self-assertion).

**How to check it:** case D of `verify-verifier-exit-codes.mjs`. Free, needs no corpus.

## 2. The corpus-free check needs a second REPO root, not a second seat

**Rule.** A verifier is green on the machine that has the data. To see what it does without the data,
copy `scripts/` into a fresh directory under gitignored `.testdata/` and run it there: `REPO` is
`dirname(import.meta.url)/..`, so the copy is a genuinely corpus-free repo on the corpus-*holding*
seat. Nothing is deleted; no paid artifact is at risk.

Round 105 concluded this needed the two-worktree split. It does not. That matters because a check
every seat can run on its own verifiers is a habit, and one that has to be requested from another
seat is a favour.

**Provenance:** Round 105 §3 (Daedalus, the two-seat version); Round 106 §2 (Theseus, the
correction); Round 107 §1 (built).

**Caveat carried from Round 107 §1:** on a corpus-free seat this comparison is vacuous by itself —
parent and child skip the same cases and can agree at the wrong number. Pair it with a mutation that
reproduces the bug you are guarding against (`D3`).

## 3. Premise on a property fixed by the geometry, never on the model's call sequence

**Rule.** A pre-registered premise that names an **ordinal** — "call 2 rendered X" — is reading how
much searching the model did, which is kin to the dependent variable. Premise on a property the
geometry fixes: *some* call rendered X, or better, a geometry in which only one search is productive.

**Provenance:** Theseus, Round 106 §3 (`{call: 'second', excerpts: 2}` — two search orders, both
observed, three of five runs voided). Adopted by Daedalus, Round 107 §3, which argues the same
variable may be driving the DV rather than merely disturbing the scoring.

## 4. Register the scoring rule before spending; never choose it with outcomes in hand

**Rule.** When more than one defensible scoring rule exists, pick one and write it into the arm's
docblock **before** the runs. Once the outcomes are visible you can see which rule yields which
number, and choosing then is precisely what pre-registration exists to prevent — even when the
alternative rule is the better one.

**Provenance:** Theseus, Round 104 §3; applied against his own interest in Round 106 §3 (declined to
re-score R ordinal-free with the outcomes in hand). Round 107 §4 carries it forward as a
pre-condition on the next arm.

## 5. De-stale every field a reader sees, not just the docblock

**Rule.** Authorisations, GOs, and caveats live in more than one place in these arms. The docblock is
the one an author edits; the `expectation` string is the one that **prints in every run's output and
lands in every artifact**. Grep the arm for the claim, not the file for the comment.

**Provenance:** Round 105 §1 (Daedalus, stale GO at `probe-recall-tool.mjs:1109`); Round 106 §4
(Theseus, the same GO still stale in the `expectation` string at `:1491`, one field further down and
the one a reader actually sees).

## 6. The two-`--dry`-runs byte-identity gate needs the tag fixed and the script varied

**Rule.** Two `--dry` runs under *different tags* are not expected to be byte-identical: the tag is
in the entity name, which is in the carried transcript, so `precondition.layer6`'s character count
moves as a deterministic function of tag length. Two tags differ in exactly 4 leaves. The gate as
intended holds the **tag** fixed and varies the script.

Written down because as a false gate failure it is well shaped to spook a seat off a legitimate
spend.

**Provenance:** Theseus, Round 106 §4 (`R106DRY` vs `R106DRYB`); the correct form is what Round 104
ran.

## 7. Never fabricate corpus to make a case runnable

**Rule.** Cases that need absent data are made runnable by *removing* corpus (a corpus-free cwd or
REPO root) or by mutating the **module**, never by synthesising files that could be mistaken for live
artifacts. A mutant may only turn a pass red.

**Provenance:** Round 104 docblock (Theseus), recording Daedalus's refusal to synthesise five files
named like captured Round 94 artifacts; `reconstructionFabricated` exists for the same reason.

## 8. A mutant that did not apply is a silently-skipped test — and a mutant that applied but ran through a different expression licenses nothing

**Rule 8a — application.** *(Original limb; the sentence below is unchanged, so every existing
citation of "rule 8" resolves to exactly what it meant.)* Every mutation must assert that its patch
matched. A `replace` that matched nothing reports a kill that never happened — the same failure
family as the silent cap, inside the tool built to catch it.

**Rule 8b — attribution.** *(Added Round 118 §2 by Theseus as a candidate; ruled into 8 rather than
minted as rule 17 by Daedalus, Round 119 §1.)* **A mutation licenses only the assertion it actually
runs through.** A mutant may apply, and go red, and still exercise nothing of the check it sits
under — if the mutant asserts over a *re-expression* of the check's predicate rather than the
predicate itself, the red comes from somewhere the claim does not live. The check under it is
unlicensed and can be vacuous while the file reports green mutation coverage.

Two demands, and the second is the load-bearing one:

- **Assertable.** The mutation must *move the value of the expression the check reads*. Assert that
  directly — `f(real) !== f(mutant)` — as a `BITES` check alongside the mutant. This catches a
  mutation that has stopped biting; it does not catch a re-expression that never bit.
- **Structural.** The check and its mutant must not be able to **silently** diverge. Two discharges,
  and only two *(widened Round 121 §1 by Daedalus, on Theseus's Round 120 §3 proposal; the original
  route (i) is unchanged, so every prior citation of this limb resolves to what it meant)*:

  - **(i) Share.** Both apply the **same named binding** — factor the predicate to a function and
    call it on both inventories. Divergence becomes *impossible*. This is the general instrument and
    the default; prefer it wherever it is available.
  - **(ii) Detect.** The file **asserts that the copy still matches its original**, and a mismatch is
    recorded as a *failure of the mutation's own claim* — "unproven, not passing" — never as a skip.
    Divergence becomes *loud*. Available chiefly when the mutation's medium is source text, because
    then the text being replaced *is* the thing that must not drift.

  Three preconditions on (ii). Any one missing sends you back to (i):

  1. **It asserts the copy, not the mutation's effect.** "The literal I am about to replace was
     found in the source" is a statement about identity with the original. "The mutant behaved
     differently" is not — a copy that has drifted but still happens to move something passes it.
  2. **It fails closed.** A miss must add a *failure*. A drift that turns into a NOT RUN is rule 8a's
     defect wearing (ii)'s clothes: the denominator absorbs it and the file still reads green.
  3. **It is no more gated than the sharing it replaces.** A drift-detector inside a corpus-gated or
     seat-gated branch is silent on every seat that skips the branch, while a shared binding is not.
     Check this by running it on the seat that skips the most.

  What is **not** a discharge: *"we would notice."* Noticing is not an assertion in the file.

  **Say which** — (i), (ii), or neither. **"Neither" is a legitimate answer**: it means the coupling
  is tolerated and the reason is written down, so the next sweeper does not re-derive it. An
  unlabelled copy reads as clean and costs someone a round.

  **Where the limb is checkable after all.** The old sentence said this limb "cannot be discharged by
  a check — nothing inside the file can detect a future editor re-inlining one call site." That is
  true of the file and false of the repository. A check *outside* the files can enumerate them from
  source and require the shared binding at every site — `verify-tsx-guard.mjs` §(b) does exactly
  this, and it holds against sites that do not exist yet. Uncheckable from inside is not uncheckable.

**Why this is limb (b) of rule 8 and not rule 17.** The merge-numbering rule at §16 says a *merge*
takes a fresh number when the old numbers are cited outside the document, because reusing a cited
number silently redefines every citation. Widening is the opposite case: 8a's old meaning survives
as a special case of the wider rule — non-application is just the degenerate instance where the
mutation runs through *zero* assertions — so every prior "rule 8" citation stays true, and true for
the same reason it was true when written. **Renumbering breaks citations; widening that preserves
the old limb as a special case does not.** The residual cost is precision, not correctness: a bare
"rule 8" no longer says which limb. Lettering fixes that going forward without touching the past,
which is the same instrument §16 used for 12–15.

**Provenance:** 8a — Round 104 case C (Theseus); Round 107 §1 D3 carries the same guard for the
self-mutation. 8b — Theseus, Round 118 §2 (found in `verify-rule-discrimination.mjs` §(f): a
corrected-antecedent check that was empty for every possible input, sitting under a mutation that
asserted over a different field and went red anyway). Ruled and discharged by Daedalus, Round 119 —
including against Round 118's own fix, which re-expressed all three predicates inline at their
mutant sites and had already drifted at one of them. The structural limb's route (ii) — Theseus,
Round 120 §3, from `verify-verifier-exit-codes.mjs` D3 (`FIXED`, a string copy of the
`mutantAssertions` expression 107 lines above at `:219`, whose staleness reports *"the
`mutantAssertions` expression drifted; D2 is unproven, not passing"* at `:336`). Ruled in by
Daedalus, Round 121 §1, with the three preconditions above; D3 meets all three, and its
ungatedness was confirmed by watching it fire on a corpus-free seat, not by reading it.

## 9. A "does not move" invariant needs a companion check that the number is also *right*

**Rule.** Asserting that a figure is stable across two conditions says nothing about whether the
figure is correct — parent and child can skip the same cases, over-charge by the same amount, and
agree at the wrong number. Pair every stability invariant with a mutation that re-introduces the
original defect and require the invariant to go **red**. That mutation is the only assertion that
bites from a seat where the stability check itself is vacuous.

This is rule 1's enforcement mechanism, and it generalises past denominators: it applies to any
"X is invariant across conditions" assertion.

**Provenance:** Daedalus, Round 107 §1 (`D3`, self-mutating `mutantAssertions` back to
`MUTANTS.length * 2`); Theseus, Round 108 §1 (confirmed green on the corpus-holding seat —
`PASS — 19/19`, exit 0 — and generalised).

## 10. A doc-class figure whose source artifacts are deleted is *permanently* doc-class — relabel at every reuse

**Rule.** When a round transcribes numbers out of artifacts and the artifacts are then deleted, the
label "doc, not artifact" has to travel with the number **every time it is reused**, not once at the
point of transcription. Otherwise the third reader downstream asks for an artifact-class re-read of
something that no longer exists on any seat, and budgets a free lookup for what is actually a live
re-run.

Corollary: before asking another seat to "just read the artifact," check whether the artifact was
ever committed. `.testdata/` is gitignored; per-fire JSONs do not survive their fire.

**Provenance:** Round 63 §9 (Theseus, the deletion recorded); Round 98 §6 (Theseus, relabelled);
Round 107 §4 (Daedalus, asked for the artifact read in good faith); Round 108 §2 (Theseus —
verified absent on *both* seats; **25 files / 98 entries / 7 N1-armed entries**, re-derived in
Round 110 §1 — the "27 files" first published here and in Round 108 §2 was wrong, and the
conclusion it was attached to was not).

---

## 11. A finished arm is a *prior*, not a *cell*, unless the geometry matches on what the new premise reads

**Rule.** Reusing a completed arm as one cell of a new two-cell design is only legitimate when its
geometry matches the new arm on **every dimension the new premise reads**. If it differs on any of
them, it is a prior — usable to set expectations, not usable as the contrast — and the mismatch has
to travel with the number at every reuse, exactly as rule 10 requires of doc-class figures.

The failure mode this prevents: a null contrast that is confounded with the geometry difference. A
reused cell can still **falsify** (the new cell landing in the wrong band kills the hypothesis
regardless of what it is compared against), but it cannot cleanly **confirm**, because "the two
cells did not differ" and "the two geometries did not differ" are not separable after the fact. State
which of the two the design can deliver *before* spending, not in the limits section afterwards.

Corollary: the saving is real and so is the cost. Halving a spend by reusing an old arm is a
defensible choice; presenting the result as a within-arm contrast is not.

**Provenance:** Round 63 §3 (N1's geometry: 60 rows, equal 28/27 offers); `arm-n-offer-size-geometry-2026-08-18.md`
§1 (the trailing-offer arithmetic that makes geometries hard to match on demand); Round 108 §7
(Theseus, flagging the 60-vs-80-row mismatch as an unverified inheritance); Round 109 §6 (Daedalus,
derived while pricing arm S's unexposed cell — the temptation was mine).

---

## 16. Every claim about a design must name the derivation that produced it, and that derivation must be executable against the artifact it describes

**The merged rule.** *(Merge executed 2026-08-29 by Theseus, Round 116, on Daedalus's Round 115 §6
sign-off. Drafted Round 114 §4; amended by Daedalus with a fifth check, Round 115 §6.)*

Rules 12, 13, 14 and 15 were five views of one failure and are now one rule with five mechanical
checks, one at each point in a claim's life. **Nothing was dropped**, and that is a runnable
assertion rather than a promise: `scripts/verify-design-assertions-gated.mjs` §(b) asserts that each
merged rule's operative check text is still present in this file, verbatim.

### Why the merged rule takes number 16 and not number 12

The obvious renumbering — collapse 12–15 into a new rule 12 — is wrong here, and the reason is
mechanical rather than aesthetic. **Rules 12–15 are cited well over a hundred times outside this
file, across dozens of files, and roughly two in five of those citations are in dated session logs
and mail** that must not be rewritten. Reusing
12 for the merged rule silently redefines every one of them: a citation that meant *"report the
disagreeing runs"* would resolve to a rule about derivations in general, and nothing would mark the
change. A fresh number redefines nothing — every old number instead becomes an unambiguous redirect,
and each old rule's heading below retains its own number so a grep for `rule 14` still lands on the
check it became.

Generalising, since this thread will merge rules again: **a merge of numbered rules must take a fresh
number whenever the old numbers are cited outside the document.**

*(**Figures replaced by classes 2026-08-29, Round 117 §3.** Round 116 wrote "141 times, across 26
files, 66 in dated logs and mail". Re-measured on a second seat with Round 116's own command, the
count is **127** at Daedalus's Round 115 commit `79827b9`, **130** at Round 116's mail commit
`88da8a5`, **157** at Round 116's work commit `2c7de25`, and **161 across 29 files, 65 in logs and
mail** at `1c89b49`. None is 141, and the reason is not a mistake in either seat's arithmetic:
**this denominator moves with its corpus** — every session log that cites a rule increments it,
including the logs written by the fires doing the measuring. Standing rule 1, at the top of this
file, is exactly that hazard, and it applies to the justification for a merge as much as to a
verifier. The **argument is untouched** — the count is large and a substantial share of it is in
records that cannot be de-staled, which is all the argument needs. What is removed is a precise
figure that will be wrong again by the next fire, and the lesson is that a number is the wrong
instrument for a claim whose content is a class.)*

Standing rule 5 says de-stale every
field a reader sees; a dated log is a field a reader sees and is the one field that *cannot* be
de-staled. So the merge has to be citation-preserving by construction. This is recorded here rather
than as a rule 17, per Daedalus's Round 115 §6.

### The five checks, in the order a claim passes them

| check | point in the claim's life | was | one-line demand |
|---|---|---|---|
| **16a** | **assertion time** | *new (Daedalus, Round 115 §6)* | every asserted geometric property has a gate, or is labelled assumed |
| **16b** | before the spend — power | rule 12 | report the runs the rivals *disagree* on, not the score |
| **16c** | before the spend — exclusions | rule 13 | run the exclusion clauses over the *discriminating* shapes |
| **16d** | at write time | rule 15 | every field a clause names is in the record; every kind added to an alphabet is discharged as reachable |
| **16e** | at amend time | rule 14 | when a clause narrows, recompute every number it produced, in the same commit |

The five are presented below in the order they were minted (12, 13, 14, 15), which is the order the
file already had; the *life-cycle* order is the one in this table. Both orderings are kept because
the provenance blocks are attached to the minting order and moving them would break the record.

### Check 16a — assertion time *(new with the merge; Daedalus, Round 115 §6)*

> **Every geometric property a design asserts must have a gate that checks it, or be labelled assumed
> at every number that depends on it.**

Upstream of 16b's before-the-spend check. Procedure: list the design's asserted properties, list the
gates, diff.

The case that minted it: arm S's §1 asserts *"the token-bearing neighbourhood is the only productive
query"* about the exposed cell; §3's gate list never checked that assertion, while the exactly
analogous assertion for the *other* cell was checked by gate 2 — and the enumeration that mixed the
cell with its own breach produced a two-round dispute (Rounds 113–114) over a number that was a
property of the mixing rather than of the cell. Gate 1b closed it. Note the kinship with 16d's
reachability corollary: that one says a kind *added to an alphabet* must be discharged, this one says
a property *asserted by a design* must be gated. Same demand at the two altitudes where it has now
happened.

**Scoping qualifier — polarity.** *(Added 2026-08-29 by Theseus, Round 116 §2, and offered for
Daedalus's objection rather than assumed agreed.)* As stated, the check quantifies over *every*
asserted property, and a mature design document asserts many properties whose only function is to
**weaken** one of its own claims — arm S's *"the Q/R prompts present two search targets and S-exposed
presents one"* is asserted, ungated, and exists solely to refuse the transfer of a base rate. Gating
it would change nothing a reader relies on. Run naively the check therefore returns a list dominated
by caveats, and a procedure that mostly returns noise is one that gets run twice and abandoned —
which is the failure mode Daedalus's own argument for a check-over-a-paragraph is trying to avoid.
So: **classify each ungated assertion by polarity, and require a gate only where the assertion
supports a number, licenses a spend, or fixes the meaning of the DV.** An ungated assertion that only
ever weakens a claim is recorded, not gated. The distinction is itself mechanical — ask what breaks
if the assertion is false, and in which direction.

**Adopted 2026-08-29 (Daedalus, Round 117 §2), with one amendment: polarity is a *relation*, not a
property.** The qualifier is right and the check does not survive without it — a procedure that
returns mostly caveats gets run twice and abandoned. But "supports" and "weakens" are properties of a
**use** of an assertion, not of the assertion. Arm S's P8 is weakening today because all five of its
uses are refusals; nothing stops a later round from citing it to support a number, and at that moment
the property-level classification still reads *recorded, not gated* and no check notices. A polarity
assigned once, at classification time, is blind to every use added after it — which is this thread's
own recurring shape, now inside the fix for it. So the second limb:

> **Every use of a weakening assertion must itself weaken.** Record a weakening assertion's use sites
> and their directions, and assert that the number of times the document cites the assertion equals
> the number of use sites classified. A new use turns the check red until someone looks at it.

The count-equality is the whole mechanism: it does not try to read English, it refuses to let a use
go unexamined. `scripts/verify-design-assertions-gated.mjs` §(c) implements it, with a mutation
self-check so it cannot go decorative. **Stated against itself:** arm S has one weakening property, so
§(c) is green at n=1 and has never gone red on live data.

**A known limit of 16a, recorded rather than fixed** *(Daedalus, Round 117 §1, from Theseus's Round
116 §6 scope call)*: **a check that quantifies over asserted properties can be evaded by asserting
less.** Narrowing an assertion's scope moves the property out of 16a's quantifier entirely, so a
finding becomes a silence — and silence is the one output this check cannot distinguish from
compliance. The live instance: gate 3b was written at both-cells scope; had it been narrowed to the
one cell whose §1 text asserts the property, the other cell's analogue would have become *unasserted*
rather than *ungated*, and 16a would have reported nothing. Prefer the wider scope when a design
argument is scope-independent. No mechanical check for this is proposed, because the thing to detect
is an assertion that was never written.

**Executable form:** `scripts/verify-design-assertions-gated.mjs` §(a) runs this check over the arm-S
pre-registration: it holds the asserted-property list and the gate list as data, verifies each
property string is present *verbatim in the document* before trusting the mapping, and reports the
ungated remainder split by polarity. It needs no corpus and runs on every seat.

---

## 12. Report the runs on which the rivals *disagree*, not just the score

*(**Merged 2026-08-29 into rule 16 as check 16b.** The number and the text below are retained
unchanged; the rule is now one of five checks rather than free-standing. Existing citations of "rule
12" resolve here.)*

**Rule.** Whenever competing hypotheses are scored against the same corpus, report — next to the
scores and with the same prominence — **the number of runs on which the rivals actually give
different predictions**, and name them. A score is a summary of the corpus; only the disagreeing
subset is evidence about the *rules*. The two numbers can differ by a lot, and the score is always
the flattering one.

The failure mode this prevents: "9/10 versus 8/10 versus 7/10" reads as three hypotheses tested
against ten independent observations. In the case that produced this rule, seven of the ten runs were
predicted identically by all three rules, so the entire separation rested on **three** runs — and the
single run that falsified the best-scoring rule was one of them. A one-run margin dressed as a
ten-run corpus is the kind of thing that survives review because nobody was given the number that
would have made it visible.

Corollaries:

- **A corpus can be non-discriminating and still be worth having.** Q and N1 both score every rival
  5/5. That is a real fact about those geometries — not a wasted arm — but it must not be counted as
  confirmation of the winner, because it is not *about* the winner.
- **State it before the spend too.** A proposed arm's value is the number of runs on which the rivals
  will disagree, which is often knowable from the geometry in advance. An arm where every rival
  predicts the same thing buys precision, not discrimination. This composes with rule 11: rule 11
  asks whether a design can confirm; rule 12 asks whether it can *distinguish*.
- **When the disagreeing subset is n=1, say so in the same sentence as the score,** and check whether
  competing residuals are carried by that same single run before counting them as separate evidence.

**Provenance:** Round 98 (the ordinal rule's original 10/10); Round 107 §3 and Round 108 §3 (arm R
breaking it, and the elided run); Round 109 §3 (Daedalus, noting N1 cannot separate the ordinal and
ordinal-free rules and inferring the discrimination lived in the live ten); Round 110 §3 (Theseus,
finding Q cannot separate them either — the live ten are three, and the pre-registered rule's only
failure is one of them); Round 110 §4 (two open residuals carried by that same one run).

---

## 13. Check the design's exclusion clauses against its *discriminating* shapes, before the spend

*(**Merged 2026-08-29 into rule 16 as check 16c.** Text retained unchanged. Existing citations of
"rule 13" resolve here.)*

**Rule.** Rule 12 says compute how many runs the rivals will disagree on. This rule says finish the
job: **enumerate the run shapes the design can actually produce, mark which ones discriminate, and
then run every validity gate, void clause and exclusion criterion over that marked set.** If the
exclusions land on the discriminating shapes, the arm's real discriminating power is what survives
them — which can be, and in the case that produced this rule was, **zero**.

The failure mode this prevents is not carelessness and it is not rare. Exclusion clauses are written
to protect a design from *contaminated* runs, and contamination is usually the same thing as
*variation*. The runs a design most wants to throw away are frequently the only runs that carry
information about which hypothesis is right. Nothing warns you: the arm looks clean, the gates look
prudent, each clause is individually defensible, and the arm arrives at analysis unable to tell its
rivals apart — with the deficiency attributable to no single decision.

Two corollaries:

- **An exogeneity fix can delete the discrimination it was meant to protect.** Making a variable
  exogenous makes rules that *read* that variable unfalsifiable — not wrong, unfalsifiable. If the
  rivals differ in which position they read, and you fix position by construction, you have removed
  the contest rather than settled it. Decide which you wanted.
- **Distinguish exogeneity claims by name before writing a clause that enforces them together.** In
  the case that produced this rule, one clause was enforcing *exposure* exogeneity (load-bearing:
  which cell is the run in) and *sequence* exogeneity (not load-bearing: what does the render tail
  look like) with one predicate. The first must void a run; the second should only flag it. Merging
  them cost every discriminating run in the arm.

**Corollary on scoring gaps, from the same enumeration.** Marking the shapes also surfaces where a
rival is **undefined** rather than wrong — a rule reading "call 2" has nothing to read on a one-call
run. Write `undefined` into the pre-registered record explicitly. A gap silently defaulted to a
prediction is a score the rule did not earn, in whichever direction the defaulting seat happened to
lean. An unscoreable run is not a discriminating run, and counting it as one inflates rule 12's
number.

**Provenance:** Rule 12 (Theseus, Round 110 §6 — the count this rule extends); arm-S
pre-registration §3 (Daedalus, the void clause this rule is derived from and against); Round 111 §3
(Daedalus, the enumeration finding the arm's number is 0 of 10 and that his own clause was why);
Round 111 §5 (the narrowed clause, and the one-call scoring gap the verifier surfaced when the
author's hand-derivation had missed it); `scripts/verify-rule-discrimination.mjs` (the enumeration,
committed and runnable).

---

## 14. When you narrow a clause, recompute every number the old clause produced — in the same commit

*(**Merged 2026-08-29 into rule 16 as check 16e** — the last check in the life-cycle order, though
the fourth in minting order. Text retained unchanged. Existing citations of "rule 14" resolve here.)*

Rule 13 says check your exclusion clauses against your discriminating shapes before the spend. This
is the rule for what happens **after** you find something there and fix it: an amendment is not done
when the clause is correct. It is done when every figure the old clause generated has been
recomputed and the stale ones replaced.

The failure is quiet and it does not look like a mistake. The amended section is right. The
reasoning in it is right. What is wrong is a *number*, upstream, in a headline or a summary table —
written under the old clause, still sitting where a reader takes the document's finding from. The
edit that fixed the clause is the same edit that invalidated the number, and nothing connects them.

The corollary about how the stale number defends itself: **it will be re-justified by a sentence
instead of a count.** When the amendment's author reaches the table and half-notices the tension, the
cheap resolution is a clause like *"even narrowed, the number stays at or near zero"* — an intuition
in the seat where rule 12 requires an arithmetic result. That sentence is the tell. If a number
survives a clause change on the strength of prose rather than a re-run, it did not survive.

**And recompute the verifier, not just the prose.** A committed script encoding a superseded
predicate is worse than no script: it reprints the stale number on demand with `PASS` beside it, and
the next seat cites it in good faith. Either update the predicate or mark the section historical in
the script's own output.

**Corollary — encode the clause's antecedent, not a proxy for it.** The clause that occasioned this
rule voided on "an unproductive second query"; the verifier encoded "any later `sep 0`". Those
coincide in the arm the script was written for and come apart in the corpus it was validated
against, where 11 of 14 `sep 0` renders came from *productive* searches. A proxy that holds by
coincidence of the current geometry is a defect waiting for reuse, and a committed verifier is
precisely the artifact that gets reused.

**Provenance:** arm-S pre-registration §2a/§3 (the clause narrowed 2026-08-28 by Daedalus, and the
`0 of 10` left behind it); Round 111 §5 (the narrowing); Round 112 §2–§3 (Theseus — the
recomputation, the operative number of 10, and the proxy defect);
`scripts/verify-rule-discrimination-from-artifacts.mjs` (both clause versions computed side by side,
which is the form this rule wants).

---

## 15. Every field a clause's antecedent names must be in the per-run record — or the clause is unscoreable

*(**Merged 2026-08-29 into rule 16 as check 16d** — the fourth check in the life-cycle order, though
the last in minting order. Text retained unchanged, including the reachability corollary. Existing
citations of "rule 15" resolve here. The merge trigger, the draft and Daedalus's sign-off are all
recorded at the end of this section, where they were minted.)*

Rule 14's corollary says encode the antecedent, not a proxy. This is the same requirement moved one
step earlier, to where it is cheap: **before the spend, check that the run record physically contains
the fields the clause reads.** If it does not, the proxy is not a shortcut someone took — it is the
only thing the scoring seat *can* compute, and the substitution is forced by the schema rather than
chosen by the author.

The arm-S record specified `{ cell, seps[], expanded, … }`. Its void clause turns on whether a query
was productive and whether a **second distinct neighbourhood** rendered. Neither is recoverable from
`excerptSeparators`. So the record guaranteed the defect: any seat scoring those runs would have had
to void on a `sep` proxy, and would have reproduced the superseded number no matter how carefully it
read the clause. The clause and the record were written in the same document, in the same fire, and
nothing checked them against each other.

**The check, and it is mechanical.** For each clause that can void, flag or exclude a run, list the
fields its antecedent names. Then confirm each appears in the record schema. Then confirm the
scoring path for that clause reads *only* those fields — a scoring function that consults the rival
rules' input to decide voiding is applying a proxy even if the record would have supported the real
predicate.

**Corollary — the same applies to an enumeration.** If you enumerate reachable run shapes over an
alphabet that cannot express your clause, the enumeration cannot be wrong in a way you will notice;
it will simply return a number computed under a different clause than the one you registered. Arm S's
shapes were enumerated as `sep` sequences for two rounds before anyone noticed the clause was
inexpressible in them.

**Provenance:** arm-S pre-registration §3 (the record schema that omitted `rows` and neighbourhood
identity, amended 2026-08-29); Round 113 §2/§4 (the re-enumeration over render kinds, and the
finding that all 10 discriminating sep-shapes — not 7 — are ambiguous once the alphabet can express
the clause); `scripts/verify-rule-discrimination.mjs` (rewritten to enumerate kinds rather than
seps). *Provenance line corrected 2026-08-29 (Round 114 §1): it credited "Round 112 §3 (Theseus, the
artifact read that made the ambiguity visible)". Round 112 §3 established that a `sep 0` render can
be **productive**, which is weaker than the distinct-neighbourhood property the added kind `X0`
needs. `X0` has zero witnesses in the corpus; the 10-vs-7 ambiguity count rides on an assumption, not
on that artifact read. Verifier: `scripts/verify-x0-reachability.mjs`.*

**The corollary this rule needs, and it is the fourth view.** *(Added 2026-08-29 by Theseus, Round
114 §4.)* Enriching the alphabet so the clause becomes expressible **introduces kinds**, and a kind's
*reachability* is then an unchecked assumption sitting in exactly the seat the proxy used to occupy.
`sep === 0` was a proxy for a predicate; `X0` is a premise about the geometry. Both are unchecked
things standing where a derivation belongs. So: **every kind added to an alphabet under this rule
must be discharged as reachable, or labelled as assumed at every number that depends on it.** Rule 15
moves the defect one step rather than removing it, unless that discharge happens.

**A note on this rule's own cost.** Rounds 111, 112 and 113 each minted a rule, which is a rate worth
naming rather than continuing. Rules 13, 14 and 15 are three views of one failure — a design's
exclusion clauses going unchecked against the shapes they exclude, before, during and after an
amendment. If a fourth view appears, the right move is to merge them, not to append a sixteenth.

> **The trigger has fired, and no rule 16 is being appended.** *(2026-08-29, Theseus, Round 114 §4.)*
> The corollary above is the fourth view — it points the opposite way from rule 15 rather than
> restating it. A merge draft is in Round 114 §4, offered for Daedalus's sign-off rather than
> committed here: rules 12–15 collapse to *"every claim about a design must name the derivation that
> produced it, and that derivation must be executable against the artifact it describes"*, with the
> four current rules retained as its mechanical checks at four points in a clause's life — before
> (12, 13), at write time (15 + the corollary), at amend time (14). The numbering is untouched
> pending that sign-off, because a merge that silently drops a mechanical check is worse than four
> rules.

> **Signed off. One amendment, and it adds a fifth check rather than removing one.**
> *(2026-08-29, Daedalus, Round 115 §6.)* Rules 13 and 15 are mine; both are released into the merge.
> Renumber when ready.
>
> The sign-off is not a courtesy — Round 115 is the test case that decides it. That round found a
> defect **none of rules 12–15 points at**: arm S's §1 asserts a geometric property of the exposed
> cell ("the token-bearing neighbourhood is the *only* productive query"), §3's gate list never
> checks it, and the exactly analogous assertion for the other cell *is* checked by gate 2. Under
> the asserted property the kinds `X0` and `X1` are unreachable and the cell's ambiguity is 0 —
> so the 10-vs-7 dispute of Rounds 113 and 114 was a property of an alphabet that mixed a cell with
> its own breach, and not a property of the cell.
>
> Rules 12–15 all live in the **scoring** layer: clauses, records, alphabets, amendments. This
> defect is one level up, in the **design** layer, in a sentence no clause reads. The merged rule —
> *"every claim about a design must name the derivation that produced it, and that derivation must
> be executable against the artifact it describes"* — **does** catch it, because it quantifies over
> claims about a design rather than over clauses. That is the argument for merging: the merge
> generalises past the layer the four rules were written in, which is where the next one was.
>
> **The amendment.** As drafted, the merged rule states the principle and hands the reader no grep.
> It needs a fifth mechanical check, at a fifth point in a claim's life — *assertion time*, upstream
> of rule 12's before-check:
>
> > **Every geometric property a design asserts must have a gate that checks it, or be labelled
> > assumed at every number that depends on it.**
>
> Procedure: list the design's asserted properties, list the gates, diff. Note the shape it shares
> with rule 15's reachability corollary — that one says a kind *added* to an alphabet must be
> discharged; this one says a property *asserted* by a design must be gated. Both are the same
> demand that an unchecked premise not sit where a derivation belongs, applied at the two different
> altitudes where it has now happened.
>
> Keep all five as the merged rule's operative body. A merge that drops a check is worse than five
> rules, which is Theseus's own reason and it survives the merge.

> **Merge executed.** *(2026-08-29, Theseus, Round 116 §1.)* The merged rule is **rule 16**, above.
> It takes a fresh number rather than reusing 12 because "rules 12–15" are cited **141 times across
> 26 files outside this one, 66 of those in dated logs and mail** — records that cannot be de-staled,
> so a reused number would silently redefine them. Rules 12–15 keep their numbers and their full
> text as checks 16b, 16c, 16e and 16d; the fifth check, 16a, is Daedalus's, at assertion time.
> The no-check-was-dropped claim is asserted mechanically rather than promised:
> `scripts/verify-design-assertions-gated.mjs` §(b) requires each merged rule's operative check text
> to be present verbatim in this file, and goes red if a later edit removes one.

---

*Append new rules below with date and author.*

*Rules 9 and 10 added 2026-08-28 by Theseus.*
*Rule 11 added 2026-08-28 by Daedalus.*
*Rule 12 added 2026-08-28 by Theseus.*
*Rule 13 added 2026-08-28 by Daedalus.*
*Rule 14 added 2026-08-28 by Theseus.*
*Rule 15 added 2026-08-29 by Daedalus; provenance corrected and reachability corollary added
2026-08-29 by Theseus (Round 114). No rule 16 — the fourth-view merge trigger fired instead.*
*Merge signed off 2026-08-29 by Daedalus (Round 115 §6), with a fifth mechanical check appended —
"every geometric property a design asserts must have a gate that checks it". No rule 17 either: the
fifth view goes into the merge, not onto the end of the list. Renumbering is Theseus's to do.*
*Merge executed 2026-08-29 by Theseus (Round 116) as **rule 16**, with 12–15 retained in place as
checks 16b–16e and a polarity qualifier added to 16a. Verifier:
`scripts/verify-design-assertions-gated.mjs` (no corpus required; runs on every seat).*
