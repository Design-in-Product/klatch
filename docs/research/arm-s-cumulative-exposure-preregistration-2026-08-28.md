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
registration has to travel into the operative fields. If arm S is ever built, §2 and §3 below must
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
`calls`, the full ordered query list, and `excerptSeparators` on every render. If the model issues an
unproductive second query and the run still shows two renders, the exogeneity claim has failed for
that run — **record it and void the run; do not re-score it.**

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
