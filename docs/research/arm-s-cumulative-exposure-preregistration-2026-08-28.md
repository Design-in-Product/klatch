# Arm S — cumulative exposure, pre-registration

**Author:** Daedalus · **Date:** 2026-08-28 (WORK/MID fire)
**Status:** **REGISTERED, NOT AUTHORISED.** No GO exists. Nothing in this document licenses a live
run, and no arm-S code exists in `scripts/` as of this writing.
**Purpose:** discharge precondition 2 of my Round 107 §4 — *the scoring rule chosen and written down
**before** the runs* — while the outcomes are still unknown. Theseus's Round 108 §5 is the argument
for doing this now: he refined a rule after seeing the data, it lost, and he could only say so
because it lost. A rule registered after the fact is worth less even when it wins.

---

## 0. Why this document exists before the code does

The ordinal-free rule (§2 below) was **selected by me on 2026-08-28 after seeing the Q, N1 and R
outcomes** (Round 107 §3). That is a retrofit. It scores 14/15 on those fifteen runs and that number
is *not* evidence for the rule in the way a pre-registered 14/15 would be.

Registering it here, against a corpus that does not yet exist, is the only move that converts it
into a prediction. If arm S is never authorised, this document still has value: it is a dated record
that the rule was fixed before the data, so no later seat has to take my word for the ordering.

**The docblock is not this file.** Standing rule 5 (de-stale every field a reader sees) says the
registration has to travel into the operative fields. If arm S is ever built, §2, **§2a** and §3 below must
be copied **verbatim** into (a) the arm entry's `expectation` string in `scripts/probe-recall-tool.mjs`
and (b) the file docblock, and the authorisation line must be written at the same time — not after.
Standing rule 3 and Round 106 §4 are why: `expectation` is the field that prints into every artifact.

---

## 1. The design

**The variable:** cumulative exposure to the two-excerpt neighbourhood — the render carrying
`excerptSeparators: 1` (three addresses), as against the single-excerpt render (two addresses).

**The design problem this fixes.** Arm R let the model choose its own search order. It admitted two
orders and got both (Round 106 §4: L1/L5 token-first, L2/L3/L4 token-second). Order then partly
determines the render sequence, which is exactly what R's premise conditioned on. **Any further arm
that leaves the search order free is measuring a mixture**, and Round 106 §4's own hazard note —
that a premise reading a property of call 2 is partly reading how much searching the model did,
which is close kin to the DV — applies to it.

**The fix is geometric, not statistical.** Make the order exogenous by making only one query
productive. Two cells:

| cell | geometry | call-1 render, by construction |
|---|---|---|
| **S-exposed** | the token-bearing neighbourhood is the *only* productive query | two-excerpt (`excerptSeparators: 1`) |
| **S-unexposed** | the two-excerpt neighbourhood is not renderable by any query; the restriction rows are reachable only by `expand` | single-excerpt (`excerptSeparators: 0`) |

**DV:** does the run issue an `expand` call. Binary, per run, as in Q / N1 / R.

There is **no wording manipulation** in this arm. That is deliberate — it premises on a property the
geometry fixes, which is standing rule 3.

---

## 2. The registered scoring rule — ordinal-free

> **A run is EXPOSED iff at least one tool call in the run returned a render with
> `excerptSeparators >= 1`, regardless of which call it was.** Ordinal plays no part. A run with no
> such call is UNEXPOSED.
>
> **Predicted relation: exposure suppresses expansion.** EXPOSED runs do not expand; UNEXPOSED runs
> do.

This is the rule from Round 107 §3, stated as a prediction. The rival it is registered *against* is
Round 98's ordinal rule (*"expands iff the second query returned the two-excerpt render"*) and
Theseus's Round 108 §5 recency rule (*"expands iff the most recent render before the decision was
not the two-excerpt neighbourhood"*). All three are scored on arm S's data; only the ordinal-free
one is registered as the prediction.

**Registered numeric predictions, before any spend:**

| cell | predicted expands | falsified if |
|---|---|---|
| S-unexposed | **≥ 4 of 5** | ≤ 2 of 5 |
| S-exposed | **≤ 1 of 5** | ≥ 3 of 5 |

**The single result that kills the hypothesis:** the two cells landing in the same band. If exposed
and unexposed expand at the same rate, cumulative exposure is not the driver and the 14/15 was
fitting noise across three geometries.

**No re-scoring under a different rule.** Round 104 §3's clause binds here as it bound in Round 106:
a premise failure is a finding about the instrument and does not license re-scoring. The rival rules
above are reported alongside; they do not replace the registered one.

---

## 2a. Rule-12 disclosure — S-exposed discriminates on **10 shapes, every one flagged**; S-unexposed on **zero**

*Added 2026-08-28 (STOP fire) under standing rule 12, before any authorisation. Heading corrected
2026-08-29 (Round 113): it read "this arm distinguishes the rivals on **zero** runs" for a day after
the body below was corrected away from zero — a stale headline over an amended section, which is
the same shape as the defect rule 14 was written about, recurring in the commit that fixed it.
Heading corrected **again** 2026-08-29 (Round 114 §5): it then read "10 shapes, every one flagged
**and ambiguous**", asserting unscoped a property that the same commit's §3 record amendment had
already removed — ambiguity is a property of adjudicating from `seps[]` alone, and the amended
record does not. Second consecutive round of a superseded property surviving in this heading.
Derivation and output: Round 113 §2 and Round 114 §§1–3; verifiers
`scripts/verify-rule-discrimination.mjs` and `scripts/verify-x0-reachability.mjs`.*

*Round 115 (2026-08-29) leaves this heading alone, and that is now a checked fact rather than an
oversight: **the 10 is set-identical across the gate-1b split**, so the one number the heading
carries does not move. What Round 115 changes is the **ambiguity** discussion below — see the
disclosure block.*

Rule 12's second corollary requires a proposed arm to state, before the spend, on how many of its
runs the rivals will actually disagree. Enumerating the run shapes each cell can produce:

| cell | kind-shapes reachable (≤4 calls) | shapes the rivals split on | surviving §3 **as narrowed** (operative) | surviving §3 as *originally* written (superseded) |
|---|---|---|---|---|
| **S-unexposed**, gate 2 holding | 80 | **0** (geometric — see the gate caveat below) | 0 | 0 |
| **S-unexposed**, gate-2 breach | 90 | 78 | **0** (all removed by §3.1) | 0 |
| **S-exposed**, gate 1b holding | 15 | 10 | **10** (0 of their sep-shapes ambiguous) | 0 |
| **S-exposed**, gate-1b breach | 70 | 52 | **0** (all removed by §3.1) | 0 |
| *S-exposed, unsplit alphabet (superseded)* | *85* | *62* | *10* (*10 ambiguous*) | *0* |

*S-exposed row split 2026-08-29 (Round 115 §3), mirroring the S-unexposed split that Round 113 §3
introduced and did not carry one cell over. The unsplit row is retained as the superseded framing
because the 10-vs-7 ambiguity dispute of Rounds 113–114 is a property of it and of nothing else.
The operative **10** is unchanged and set-identical across the split.*

*Table recomputed 2026-08-29 (Round 113) over **render kinds** rather than `excerptSeparators`
sequences. The shape counts changed because the alphabet did, not because the geometry did: a
sequence of `sep` values cannot express §3's void clause, whose antecedent names `rows` and which
neighbourhood rendered. The row that matters — S-exposed's 10 — is unchanged from Theseus's
Round 112 recompute; the ambiguity count and the S-unexposed caveat are not.*

**Corrected 2026-08-28 STOP fire (Theseus, Round 112 §3). The number is not 0 of 10.** As first
written this section reported 0, computed under the void clause **as originally written** — the same
commit that added this section narrowed that clause in §3 below, and the number was not recomputed.
Under the operative clause **nothing in S-exposed is voided**: voiding requires an *exposure*
exogeneity violation (`sep >= 1` in S-unexposed, or a second distinct productive neighbourhood), and
a `rows=0` miss is neither. All ten discriminating shapes survive, flagged `sequenceEndogenous`.

The superseded sentence, quoted so the change is visible: *"§3 is narrowed below; even narrowed, the
discriminating shapes are the ones the exogeneity design exists to suppress, so the honest number
stays at or near zero."* That was an intuition standing where a count belongs — the substitution rule
12 exists to prevent — and the recomputation, not the reasoning, is what caught it.

**S-unexposed's 0 is untouched and was never in dispute:** no render in it ever carries `sep >= 1`,
so all three rivals predict expand on every reachable shape.

*Sharpened 2026-08-29 (Round 113 §3), and this corrects a sentence Rounds 111 and 112 both wrote.*
Both said the zero was "guaranteed by geometry, not by an exclusion clause". Enumerating the breach
case shows that is two claims: **given gate 2, the zero is geometric** — 0 of 80 shapes discriminate,
no clause consulted. **If gate 2 is breached at runtime**, 78 of 90 reachable shapes discriminate and
every one of them is removed by §3.1. So the exclusion clause *is* load-bearing here; it is the
runtime backstop for the case the pre-spend gate was supposed to have excluded, which is what a
backstop is for. The durable claim is "geometric **given gate 2**, clause-covered otherwise" — not
"geometric, full stop". Gate 2 is itself underived (§6, first bullet), so the condition is not idle.

**The operative pre-spend disclosure:**

> All 10 of S-exposed's discriminating shapes survive the operative clause; S-unexposed discriminates
> on nothing. Whether runs *land* on the discriminating shapes turns on the second-query rate — in a
> non-voided S-exposed run only one neighbourhood is productive, so any second query is unproductive,
> renders `sep 0`, and lands on a discriminating shape. That rate is **10/10 in the only corpus
> available** (Round 112 §4) and **undetermined for S's one-target geometry**, since the Q/R prompts
> present two search targets and S-exposed presents one. Every discriminating run carries
> `sequenceEndogenous: true`, so any rival comparison drawn from this arm is flagged evidence.
> **Ambiguity on `seps` alone is zero, given gate 1b** — and the whole of the 10-vs-7 dispute below
> was a property of an enumeration, not of this cell. *(Rewritten 2026-08-29, Round 115 §3.)*
> Kinds `X0` and `X1` are both defined as a **second distinct productive neighbourhood**, which
> §1 asserts S-exposed does not admit and **gate 1b now checks**. Enumerating the cell together
> with its own breach — as Rounds 113 and 114 both did — returns 10 ambiguous sep-shapes;
> enumerating the two apart, the way S-unexposed has been enumerated since Round 113 §3, returns
> **0 within each block**. The ambiguity measured the mixing. Under a gate-1b breach, `X0` and `X1`
> are reachable and §3.1 removes **every** discriminating shape they appear in — the same structure
> as gate 2 and the same runtime backstop. **The discriminating count of 10 is set-identical across
> the split** (checked as set equality, not as two matching counts), so nothing else in this
> section moves.
>
> *(History, quoted so the change is visible. This read "seven of the ten" as first written
> 2026-08-28 (Round 112 §3); raised to "all ten" 2026-08-29 (Round 113 §2); the Round 113
> attribution to Theseus's artifact read was withdrawn 2026-08-29 (Round 114 §1), which established
> that **`X0` has zero witnesses** — all 11 productive `sep 0` renders in the corpus re-rendered
> rows already on screen — and held the number at "10 conservatively, 7 witnessed, the difference
> riding on `X0`'s reachability". The superseded sentence: **"All ten shapes are additionally
> ambiguous on `seps` alone — conservatively; seven is the witnessed number and the other three
> ride on an underived assumption."** Round 115 §1–§3 finds that neither 10 nor 7 is a property of
> the cell: `X0`'s reachability was never a corpus question, because §1 already asserted the
> property that decides it and no gate checked the assertion. Theseus's zero is retained and is
> load-bearing in a different place — Round 115 §4 reads it as evidence that **gate 1b held in 2 of
> 2** corpus runs matching gate 1's shape. Verifiers: `scripts/verify-rule-discrimination.mjs`
> (36 self-checks) and `scripts/verify-x0-reachability.mjs`.)*

Flagged, caveated, resting on an untransferred base rate — but not zero.

*Both verifiers now compute the operative number. `scripts/verify-rule-discrimination.mjs` was
rewritten 2026-08-29 (Round 113) under rule 14: it enumerates render kinds, encodes §3.1's antecedent
rather than a `sep === 0` proxy for it, and prints the superseded strict number as a labelled
historical column instead of self-checking it as the answer.
`scripts/verify-rule-discrimination-from-artifacts.mjs` remains the transcription check and the only
one that reads `rows` first-hand.*

**Consequence for what this arm claims.** Two questions were being run together and are now split:

- **Q1 — does exposure drive suppression at all?** The registered rule against the null. **Arm S
  answers this**, and §2's numeric predictions are predictions about Q1.
- **Q2 — which of the three exposure-reading rules is right?** **Arm S answers this weakly and only
  on flagged runs** *(amended 2026-08-28, Round 112 §3/§5; as first written this read "does not
  answer this, by construction")*. Making the search order exogenous is in real tension with rules
  that read position — Round 111 §4's argument for that is correct and stands — but the tension is
  **partial, not total**. Discrimination survives on any run where the model issues a second query,
  and every such run is flagged `sequenceEndogenous`.

This remains a downward revision of the arm's advertised value relative to Round 109, entered before
any GO. A result from arm S must not be reported as evidence for the ordinal-free rule *over its
rivals* **unless** the flagged discriminating runs are reported with their flag, their count, and
**gate 1b's verdict on the runs being reported**. *(Amended 2026-08-29, Round 115 §3: this required
"the `seps`-ambiguity caveat above", which no longer exists as a caveat — ambiguity is 0 given gate
1b. What has to travel with the number is not an ambiguity warning but the gate: whether gate 1b
passed at `--dry`, and whether any reported run breached it at runtime, in which case §3.1 has
already voided it and it is not among the runs being reported at all.)* Round 111 §6 sketches, and does not propose, what a dedicated Q2 arm
would require — and that sketch was priced against an arm S with *zero* Q2 power. **That re-pricing
is done: Round 113 §5, and it cuts arm T's case down rather than making it.** Arm T's margin over the
operative arm S is no longer "some Q2 power vs none"; it is unflagged-vs-flagged and
guaranteed-vs-base-rate-dependent — real, much smaller than the 15-vs-0 it was sketched against, and
conditional on a buildability nobody has derived.

*Amended 2026-08-29 (Round 115 §5). This read "unflagged-vs-flagged, **unambiguous-vs-ambiguous**,
and guaranteed-vs-base-rate-dependent … The record-schema fix in §3 closes the ambiguity limb of
that margin for free and without a GO." The middle limb was **never a margin**: arm S's ambiguity is
0 given gate 1b, so there was nothing for the record fix to close and nothing for arm T to win.
Cutting the other way, and recorded because it tells against this document's own arm: **gate 1b is a
second underived condition on the S side**, where the Round 113 pricing counted one (gate 2's
satisfiability). Net — T's margin is two limbs rather than three, and S carries one more open
`--dry` check. The record-schema fix in §3 stays regardless: gate 1b is the pre-spend check and
§3.1 is the runtime backstop for its breach, and the backstop is only computable if the record
carries the fields §3 now names.*

*Amended again 2026-08-29 (Round 116 §2), and it moves the same way — against this arm. Running
standing rule 16's check 16a over this whole document (list the asserted geometric properties, list
the gates, diff) returns **two** further ungated assertions beyond the one Round 115 found, **both in
S-unexposed**: single-productivity at arm scope (now gate 2b) and restriction-reachability-only-by-
`expand` (now gate 3b). **No count in this section moves** — `B0` has been inside the
gate-2-**holding** block since Round 113, so S-unexposed's zero was already computed under the weaker
assertion and is correct as it stands. What moves is the ledger: where Round 113 counted one
underived pre-spend condition on the S side and Round 115 counted two, there are now **four** (gate
2's satisfiability, gate 1b's, gate 2b's, gate 3b's). Arm T's margin is unchanged at two limbs; the S
side of that comparison is worse. Recorded here rather than netted out, per Round 115 §5's own
accounting. Verifier: `scripts/verify-design-assertions-gated.mjs` §(a) — 18 self-checks, no corpus
required, runs on every seat.*

**Scoring gap, stated so no seat silently defaults it.** The ordinal rule reads *call 2*. A one-call
run has no call 2, so the ordinal rule is **`undefined`** on it — not "expand", not "suppress".
Record such runs as `ordinal: undefined`. *(Amended 2026-08-28, Round 112 §4: this previously called
one call "the modal expected shape in S-exposed, since only one query is productive". The gap is
real; the modal claim is not supported — **0 of 10** live runs issued only one search, the minimum
was two, and no run ever repeated a query. Treat the one-call shape as possible and unquantified.)* The registered ordinal-free rule reads no position and is unaffected;
that is a property it happens to have, not a virtue this design was built to reward.

---

## 3. The validity gate, checked before spending

Pre-spend on `--dry`, per cell, in the structural check — not after the live call:

1. **S-exposed:** the call-1 render carries `excerptSeparators >= 1`. If it does not, the cell is not
   the geometry it claims and nothing is spent.
1b. **S-exposed:** **no** query in the registered query set is productive in a neighbourhood other
   than the token-bearing one. Same method as gate 2 below — enumerate the set, do not observe one
   run. *(Added 2026-08-29, Round 115 §2.)* §1 above **asserts** this property — "the token-bearing
   neighbourhood is the *only* productive query" — and until this fire nothing checked it, while the
   exactly analogous assertion for the other cell was checked by gate 2. Under it, render kinds `X0`
   and `X1` (both defined as a **second distinct** productive neighbourhood) are unreachable and
   S-exposed's discriminating sep-shapes are **unambiguous**; under a breach they are reachable and
   §3.1 removes every discriminating shape they appear in. **Gate 1b is entailed by gate 1** in any
   geometry where every **query-renderable** row lies inside the union the exposing query renders,
   since the `sep >= 1` render is then the union and every later render a subset (held 2 of 2 in the
   corpus runs matching gate 1's shape, at a two-target geometry, so a prior and not a derivation —
   standing rule 11).
   *(**Antecedent corrected 2026-08-29, Round 117 §1**, against Round 115 §4, which wrote it as
   "exactly two regions where the exposing query reaches both" and concluded that the pre-spend check
   **reduces to counting the regions**. That conclusion is withdrawn for this arm. **S-exposed's
   region count is 3, and must be at least 3 by construction**: gate 3b asserts no query renders any
   restriction row, so the restriction is a region outside the call-1 union — and it has to be, or an
   `expand` has nothing to reach and the arm has no DV. The count was never the cheap open item
   Round 115 §5 called it; it was decided by the design from the start. What rescues the entailment
   is that gate 1b's breach kinds `X0` and `X1` are both **productive**, i.e. properties of query
   renders, and the run record ends at the expand decision — so an expand-only region cannot
   instantiate either. Hence the corrected antecedent quantifies over query-renderable rows, and
   **S-exposed satisfies it exactly when gate 3b holds at S-exposed scope**. No number moves: the
   2 of 2 was already labelled a prior. Gate 1b remains what the sentence above says — an enumeration
   over the registered query set, not an arithmetic count. Verifier:
   `scripts/verify-rule-discrimination.mjs` §(f), 8 self-checks including a mutation.)*
   *(**Dependency separated 2026-08-29, Round 118 §1.** The paragraph above gives two grounds for the
   restriction being a third region and leads with gate 3b, whose satisfiability is **open** (§6).
   The two are independent and only one of them is a gate: **(i)** gate 3b — no registered query
   renders a restriction row, so it lies outside the call-1 union; **(ii)** the DV — the restriction
   must be off-screen at the decision or `expand` has nothing to reach. Ground (ii) cites no gate and
   is untouched by whatever becomes of 3b. **So the count's closure is not conditional on an open
   item**, and a later finding that 3b is unsatisfiable would **not** reopen it. What does rest on 3b
   is the *corrected antecedent*, not the count. §(f) now carries the grounds as separate fields with
   a mutation in each direction — strip 3b and the antecedent breaks while `>= 3` survives; strip the
   DV ground and the closure loses its gate-independent support.)*
2. **S-unexposed:** **no** query in the registered query set produces `excerptSeparators >= 1`. This
   is a claim about the geometry, so it must be checked by enumerating the set, not by observing one
   run. If any query can produce it, the cell is not exogenous.
2b. **S-unexposed:** **no** query in the registered query set is productive in more than one
   neighbourhood. *(Added 2026-08-29, Round 116 §2 — the exact mirror of gate 1b, in the cell gate 1b
   was modelled on.)* §1's body states the arm's design fix as *"make the order exogenous by making
   only one query productive"* — at **arm** scope, both cells. §1's table then realises it for
   S-exposed only, and gate 2 constrains `sep`, not productivity: a query productive in a second
   region renders one excerpt, so `sep 0`, so it **passes gate 2**. The kind is already in the
   enumeration — `B0`, in the gate-2-**holding** block since Round 113 — so no number moves, and
   that is the point: the enumeration is computed under the weaker assertion and is correct, while
   the cell is left with the free search order the whole arm exists to remove. Not an ambiguity
   question (Round 115 §4 disposed of that correctly and for the right reason); a **Q1** question,
   because search volume is Round 106 §4's kin-of-the-DV hazard and a cell with two productive
   queries invites more of it than a cell with one.

   **Gate 2b adds no new mechanism — it supplies the missing pre-spend half of a backstop that
   already exists.** §3.1's void clause voids *"if a second distinct productive neighbourhood renders
   in **either cell**"*, and `verify-rule-discrimination.mjs:219–223` encodes exactly that: the
   `prod.size > 1` limb is cell-independent, so a `B0` run in S-unexposed is already voided at
   scoring time today. The structure is therefore identical to gate 1b's — pre-spend gate, §3.1
   runtime backstop — and S-unexposed has had the backstop without the gate since the clause was
   written. That asymmetry is what check 16a surfaces and it is why this gate is cheap to adopt:
   nothing downstream changes.
3. **The restriction is inside an offered address in both cells** — otherwise the DV is unreachable
   and a non-expansion means nothing (Rounds 61/62's shape).
3b. **No query in the registered query set renders any restriction row, in either cell.** *(Added
   2026-08-29, Round 116 §2.)* §1 asserts *"the restriction rows are reachable only by `expand`"*.
   Gate 3 checks the **sufficiency** direction — `expand` can reach the restriction. Nothing checked
   **necessity**, and the two existing gates in that cell are jointly blind to a breach: a query
   matching only restriction rows renders a single excerpt, `sep 0`, passing gate 2, while gate 3 is
   satisfied either way. This is load-bearing for the **meaning of the DV** rather than for any
   count: the DV is *does the run issue an `expand` call*, and a non-expansion is informative only
   if `expand` was the sole route to the restriction. If it was not, a suppressed run and a run that
   read the restriction by query are recorded identically. **Scope note:** §1 asserts this for
   S-unexposed only; the gate is written for both cells because the DV argument is cell-independent
   and gate 3 is already a both-cells gate. Extending the scope is a Round 116 proposal, flagged for
   Daedalus rather than assumed agreed — if he prefers it S-unexposed-scoped, the S-exposed analogue
   becomes an unasserted property rather than an ungated one, which is a different and weaker
   finding.
   **Scope ADOPTED at both cells, 2026-08-29 (Round 117 §1), and on a load-bearing ground rather than
   an absence of objection.** At S-exposed scope this gate is what makes gate 1b's entailment
   *stateable*: the corrected antecedent quantifies over query-renderable rows, and 3b is the only
   thing in the design that says the restriction region is not one of them. Under an
   S-unexposed-only scope, S-exposed's restriction region is unconstrained, the entailment has no
   S-exposed form at all, and the open item Round 115 called cheapest would have stayed open
   permanently. Round 116 §6 offered this as a scope call with a weak justification; the justification
   is stronger than its author claimed. Recorded separately: **a check that quantifies over
   *asserted* properties can be evaded by asserting less** — narrowing an assertion's scope moves the
   property out of check 16a's quantifier entirely, turning a finding into a silence. That is a real
   limit of 16a and it is noted at the rule, not only here.
4. **Carried context ACTIVE**, prompt holds the fact, prompt does not hold the marking, prompt names
   the tool — the four preconditions N1 recorded 5/5 (Round 63 §3).

**Recorded per run whether or not it bears on the DV** (Round 106 §4's hazard, made operative):
`calls`, the full ordered query list, `excerptSeparators` on every render, and — *added 2026-08-29,
Round 113 §4* — **`rows` on every call, and an identifier for the neighbourhood each render showed**
(the address of its first matched row is sufficient and is already in the render).

*Why this was a defect and not an enhancement:* §3.1's void clause turns on whether a query was
productive and whether a **second distinct** neighbourhood rendered. Neither is recoverable from
`excerptSeparators`, and the list above did not carry either. A scoring seat holding only the
originally-specified record could not have applied the operative clause at all — it could only have
applied a proxy for it, which is precisely the substitution rule 14's second corollary forbids and
the one that produced the superseded number. The query list is *not* a substitute: two distinct
queries can render the same neighbourhood, and one query can be productive in one run and `rows=0`
in another.

**The void clause, narrowed and split** *(amended 2026-08-28 STOP fire; Round 111 §3 and §5. The
original read: "If the model issues an unproductive second query and the run still shows two
renders, the exogeneity claim has failed for that run — record it and void the run; do not re-score
it." That conflated two different exogeneity claims and, under the strict reading, voided every run
on which the rival rules disagree. The text is amended, not deleted, and the original is quoted here
so the change is visible.)*

Two exogeneity claims, and only one of them is load-bearing for this arm:

1. **Exposure exogeneity — load-bearing. Violation voids the run.** The cell must determine whether
   the run was exposed. Void if a render carrying `sep >= 1` appears in **S-unexposed**, or if a
   second *distinct productive neighbourhood* renders in either cell. Either means the run is not in
   the cell it was assigned to, and the registered rule's input is corrupt. Record and void; do not
   re-score.
2. **Sequence exogeneity — not load-bearing. Violation is recorded, not voided.** A `rows=0` miss
   adds a null render (`sep 0`) without changing which neighbourhoods the model saw — exposure is
   untouched. Such runs are **scored normally under the registered rule** and flagged
   `sequenceEndogenous: true`. They are the only runs on which the ordinal and recency rivals can
   depart from the registered rule, so voiding them would delete **the arm's entire discriminating
   power** — all 10 surviving shapes, see §2a. *(Corrected 2026-08-29, Round 113: this read "the
   arm's entire (already near-zero) discriminating power". The parenthesis was the superseded number
   surviving inside the very clause whose narrowing superseded it — rule 14's failure mode, in the
   text of the amendment itself.)* Any rival-comparison drawn from a flagged run carries the flag
   with it.

**Per-run scoring record** *(amended 2026-08-29, Round 113 §4 — the three fields after `seps[]` are
new, and without them `voided` cannot be computed from the record at all):*

```
{ cell, seps[], rows[], neighbourhoods[], productive[],
  expanded, ordinal, free, recency, sequenceEndogenous, voided, voidReason }
```

with `ordinal: "undefined"` written literally for one-call runs (§2a). **The invariant to check at
scoring time:** `voided` must be derivable from `cell`, `neighbourhoods[]` and `productive[]` alone.
If any scoring path reads `seps[]` to decide voiding, it is applying the superseded proxy — `seps[]`
is input to the three rival rules and to nothing else.

---

## 4. Cost, and a cheaper first cut that xian can choose between

Two options. I am not asking for either; this is the decision laid out so a GO can be a one-word
answer.

**Option A — both cells, 10 live `claude-opus-5` runs.** Roughly twice arm R's spend. Clean
within-arm contrast; both cells share a geometry family, so the comparison carries no
geometry-mismatch caveat.

**Option B — exposed cell only, 5 live runs, scored against N1's existing 5/5 as the unexposed
prior.** Half the spend. **The caveat is real and has to travel with the number:** N1's geometry is
60 rows with equal 28/27 offers (Round 63 §3); arm R's family is 80 rows with 9-row and 5-row
neighbourhoods. Theseus's Round 108 §7 flags exactly this mismatch. N1 is a **prior**, not a cell.
Under option B the arm can falsify the hypothesis (exposed expands ≥3/5) but cannot cleanly confirm
it, because a null contrast would be confounded with the geometry difference.

**My read:** option B is the right first cut *if* the appetite is for a cheap falsification attempt,
because the informative cell is the exposed one — the unexposed prediction is the one already
supported by 5/5 at another geometry. If the appetite is for a result worth citing, option A.

**Amended 2026-08-28 (STOP fire), and it moves option A down.** Option A's advantage was "a result
worth citing"; what it buys is mostly a **clean within-arm contrast on Q1**, not a verdict among the
three rules. That is still worth something and it is less than the earlier phrasing implied.

**Re-amended 2026-08-29 (Round 113 §5), and this moves option A back up a little.** The 8/28
amendment justified itself with *"§2a establishes that neither option distinguishes the registered
rule from its rivals — the rule-12 number is zero either way"*, which was the superseded number
propagating one section downstream from the table that had already been corrected. Under the
operative clause the ordering between the options changes, because **all of the arm's Q2 power lives
in the exposed cell**: S-unexposed discriminates on nothing under either option, so option B — the
exposed cell only — retains **100% of a Q2 power that is flagged and base-rate-dependent**
rather than 0% of a power that did not exist. *(Amended 2026-08-29, Round 114 §5: this read
"flagged, **ambiguous** and base-rate-dependent" for the length of one commit. The word was
unscoped and already superseded — ambiguity is a property of adjudicating from `seps[]` alone, and
§3's record amendment in the same commit records `rows[]`, `neighbourhoods[]` and `productive[]` so
that no scoring seat has to. Round 113 §5 drew exactly this conclusion for arm T's margin and it did
not propagate the two sections to here.)* The Q1 argument is unchanged and still favours A. So
the corrected read is: **A for Q1, B loses nothing on Q2**, where the 8/28 text said Q2 was
unavailable either way. If the appetite is specifically for a *clean* Q2 verdict, neither option
delivers that and no arm currently designed does — that much of the sentence survives.

---

## 5. Preconditions status

| # | precondition (Round 107 §4) | status |
|---|---|---|
| 1 | the N1 read, *"because it can kill this arm for free"* | **discharged 2026-08-28.** It does not kill it — Round 108 §3, independently re-derived on my seat this fire (Round 109 §2). |
| 2 | scoring rule registered before the runs | **discharged by this document**, §2. Not yet in the docblock or `expectation`, because no arm-S code exists — §0 states the requirement for when it does. |
| 3 | `expectation` string carrying the authorisation, not just the docblock | **open, and cannot be discharged** — there is no authorisation to carry. |
| 4 | xian's GO | **absent.** |

---

## 6. What this document does not establish

- **That the two cells are buildable at the stated geometry.** The arm-N doc (2026-08-18) found that
  the trailing offer is 27 rows in every arm of this family *by arithmetic, not choice*. Whether a
  geometry exists in which no query renders `excerptSeparators >= 1` is **not derived here** and is
  the first thing to check on `--dry` before any code is written for real. If it does not exist, the
  unexposed cell is unbuildable and option B becomes the only form of this arm.
- **That render kind `X0` is reachable in S-exposed.** *(Added 2026-08-29, Round 114 §1.)* `X0` — a
  productive query rendering a **second distinct** neighbourhood as a **single** excerpt, so `sep 0`
  — is the kind that makes `[1,0]`, `[1,0,0]` and `[1,0,0,0]` unadjudicable on `seps` alone. It has
  **zero witnesses** in the ten-run corpus: all 11 productive `sep 0` renders re-rendered rows
  already on screen, because the second-target token matches in both regions and so any query
  reaching the new neighbourhood re-reaches the old one and prints two excerpts. Reaching `X0`
  requires a registered query matching **exactly one row, in a region not yet rendered**. Whether
  arm S's one-target geometry and registered query set admit one is **not derived here** and is a
  `--dry`-time check, same class as the gate-2 bullet above.

  **Restated 2026-08-29 (Round 115 §§1–4), and the restatement is the point.** This bullet was
  written as an open question about the *corpus* — is `X0` witnessed? It is not that. §1 already
  **asserts** that S-exposed's token-bearing neighbourhood is the only productive query, which
  settles `X0` and `X1` together, and until Round 115 no gate checked that assertion. The check is
  now **gate 1b** (§3), and it reduces further: gate 1b is *entailed* by gate 1 in any geometry where
  every query-renderable row lies inside the union the exposing query renders. Theseus's
  zero-witness result is retained and relocated: read against the two corpus runs that match gate
  1's shape (R L1, R L5, both `[1,0]`, neither with a second `sep >= 1` render), it says **gate 1b
  held 2 of 2** — at a two-target geometry, so a prior and not a derivation (standing rule 11).
  §2a's ambiguity is **0 given gate 1b**; the superseded "10 conservatively / 7 witnessed" framing
  is quoted there. The discriminating count of 10 is set-identical across the split.

  **CLOSED 2026-08-29 (Round 117 §1). Between Round 115 and here this bullet carried a sub-item —
  arm S-exposed's region count, "an arithmetic fact this document does not state" — and it is now
  stated: the count is 3, and no seat needed a corpus to say so.** Gate 3b (§3, Round 116) asserts
  that no query renders any restriction row, so the restriction is a region outside the call-1 union;
  the two excerpts of the `sep 1` render are the other two. It cannot be 2 for any buildable version
  of this arm — an `expand` must have somewhere to go. So the Round 115 §4 antecedent was not an open
  question with a cheap answer, it was **already false when it was written**, and Round 115 §5's
  "cheapest of the open items" is withdrawn. The entailment survives in corrected form (§3, gate 1b)
  because gate 1b's breach kinds are properties of *query* renders. This closes an item; it does not
  open one, and no count moves.

  *(**Round 118 §1.** The closure has **two** grounds and only one is a gate: 3b, and the DV clause
  above — "it cannot be 2 for any buildable version of this arm." The DV ground stands whatever
  becomes of gate 3b's still-open satisfiability, so **this closed item cannot be reopened by that
  open one.** Recorded because both statements of the closure lead with 3b, and a future fire finding
  3b unsatisfiable would otherwise read them as reopening the count.)*

  The mirror kind `B0` in S-unexposed was listed here as open for the same reason. **It is not the
  same situation** *(Round 115 §7)*: §1 makes no one-productive-query claim for S-unexposed, so
  `B0` is in-cell, has been enumerated in the gate-2-holding block since Round 113, and contributes
  0 ambiguity there (self-check). It needs no reachability discharge.

- **Whether gates 2b and 3b are satisfiable jointly with gate 2, and whether either is buildable.**
  *(Added 2026-08-29, Round 116 §2.)* Gate 2b asks that no registered query be productive in two
  neighbourhoods; gate 3b asks that no registered query render a restriction row. Both are
  `--dry`-checkable by enumeration, same method as gate 2, and neither has been checked because
  neither existed until this fire. Gate 3b interacts with gate 3 in a way worth deriving before
  spending: gate 3 requires the restriction to sit inside an **offered** address, and an offered
  address is by construction a region the model can ask about — so 3b is a constraint on the
  registered *query set*, not on the geometry, and may be satisfiable by query-set design alone.
  Not derived here. **These two are the reason S now carries four underived pre-spend conditions
  rather than two** (§2a). *(**Round 118 §1:** if gate 3b turns out unsatisfiable, what fails is the
  **corrected antecedent** of gate 1b at S-exposed scope — **not** the region count, which is closed
  on the DV ground independently. Scoped here so the blast radius of this open item is written down
  before it is checked, rather than argued about after.)*
- **Whether gate 1b is satisfiable jointly with gate 1.** *(Added 2026-08-29, Round 115 §7.)* Gate 1
  requires a query reaching two regions; gate 1b requires that no query reach a third. Plausibly
  compatible — it is what the corpus geometry does — but not derived, and it is a second underived
  condition on the S side of the arm-T comparison, which §2a now records against itself.
- **That the ordinal-free rule is true.** It is registered, not supported. Its 14/15 is a retrofit
  and stays labelled as one.
- **N1's per-call renders as artifact-class.** They are doc-class from Round 63 §2 and permanently
  so — the `.testdata/` JSONs were deleted at end of fire and `.testdata/` is gitignored. Standing
  rule 10. Everything §4 option B rests on inherits that label.
