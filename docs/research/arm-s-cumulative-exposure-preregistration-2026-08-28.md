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

## 2a. Rule-12 disclosure — this arm distinguishes the rivals on **zero** runs

*Added 2026-08-28 (STOP fire) under standing rule 12, before any authorisation. Derivation and
output: Round 111 §3; verifier `scripts/verify-rule-discrimination.mjs`.*

Rule 12's second corollary requires a proposed arm to state, before the spend, on how many of its
runs the rivals will actually disagree. Enumerating the run shapes each cell can produce:

| cell | shapes reachable | shapes the rivals split on | surviving §3 **as narrowed** (operative) | surviving §3 as *originally* written (superseded) |
|---|---|---|---|---|
| **S-unexposed** | 4 | **0** (guaranteed by geometry) | 0 | 0 |
| **S-exposed** | 15 | 10 | **10** (7 of them ambiguous on `seps` alone) | 0 |

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
so all three rivals predict expand on every reachable shape. It is guaranteed by geometry rather than
by an exclusion clause. That is the durable half of the original claim.

**The operative pre-spend disclosure:**

> All 10 of S-exposed's discriminating shapes survive the operative clause; S-unexposed discriminates
> on nothing. Whether runs *land* on the discriminating shapes turns on the second-query rate — in a
> non-voided S-exposed run only one neighbourhood is productive, so any second query is unproductive,
> renders `sep 0`, and lands on a discriminating shape. That rate is **10/10 in the only corpus
> available** (Round 112 §4) and **undetermined for S's one-target geometry**, since the Q/R prompts
> present two search targets and S-exposed presents one. Every discriminating run carries
> `sequenceEndogenous: true`, so any rival comparison drawn from this arm is flagged evidence. Seven
> of the ten shapes are additionally ambiguous on `seps` alone (a later `sep >= 1` is a permitted
> repeat or a voiding second neighbourhood, and the sep sequence does not say which).

Flagged, caveated, resting on an untransferred base rate — but not zero.

*Recompute verified by `scripts/verify-rule-discrimination-from-artifacts.mjs`. Note that
`scripts/verify-rule-discrimination.mjs` still computes the superseded strict number and prints PASS
next to it; read its arm-S section as historical.*

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
rivals* **unless** the flagged discriminating runs are reported with their flag, their count, and the
`seps`-ambiguity caveat above. Round 111 §6 sketches, and does not propose, what a dedicated Q2 arm
would require — and that sketch was priced against an arm S with *zero* Q2 power, so its motivation
needs redoing before arm T is argued for (Round 112 §7).

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
2. **S-unexposed:** **no** query in the registered query set produces `excerptSeparators >= 1`. This
   is a claim about the geometry, so it must be checked by enumerating the set, not by observing one
   run. If any query can produce it, the cell is not exogenous.
3. **The restriction is inside an offered address in both cells** — otherwise the DV is unreachable
   and a non-expansion means nothing (Rounds 61/62's shape).
4. **Carried context ACTIVE**, prompt holds the fact, prompt does not hold the marking, prompt names
   the tool — the four preconditions N1 recorded 5/5 (Round 63 §3).

**Recorded per run whether or not it bears on the DV** (Round 106 §4's hazard, made operative):
`calls`, the full ordered query list, and `excerptSeparators` on every render.

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
   depart from the registered rule, so voiding them would delete the arm's entire (already
   near-zero) discriminating power — see §2a. Any rival-comparison drawn from a flagged run carries
   the flag with it.

**Per-run scoring record:** `{ cell, seps[], expanded, ordinal, free, recency, sequenceEndogenous,
voided, voidReason }`, with `ordinal: "undefined"` written literally for one-call runs (§2a).

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

**Amended 2026-08-28 (STOP fire), and it moves option A down.** §2a establishes that neither option
distinguishes the registered rule from its rivals — the rule-12 number is zero either way. Option A's
advantage was "a result worth citing"; what it buys is a **clean within-arm contrast on Q1**, not a
verdict among the three rules. That is still worth something and it is less than the earlier phrasing
implied. If the appetite is specifically for Q2, **neither option delivers it** and the honest answer
is that no arm currently designed does.

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
- **That the ordinal-free rule is true.** It is registered, not supported. Its 14/15 is a retrofit
  and stays labelled as one.
- **N1's per-call renders as artifact-class.** They are doc-class from Round 63 §2 and permanently
  so — the `.testdata/` JSONs were deleted at end of fire and `.testdata/` is gitignored. Standing
  rule 10. Everything §4 option B rests on inherits that label.
