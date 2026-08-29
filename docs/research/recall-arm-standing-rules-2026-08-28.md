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

## 8. A mutant that did not apply is a silently-skipped test

**Rule.** Every mutation must assert that its patch matched. A `replace` that matched nothing reports
a kill that never happened — the same failure family as the silent cap, inside the tool built to
catch it.

**Provenance:** Round 104 case C (Theseus); Round 107 §1 D3 carries the same guard for the
self-mutation.

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

## 12. Report the runs on which the rivals *disagree*, not just the score

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
