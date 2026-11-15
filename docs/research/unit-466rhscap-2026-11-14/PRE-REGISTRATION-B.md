# unit-466rhscap — pre-registration B

**Written after arm A's drive (`drive1.arma.out`, verbatim and unedited) and before arm B exists.**

## What arm A settled, and what it broke

Settled — the boarded question is answered. `A2`/`A3` reproduced the recording's figures exactly
(11 cap hits; 7/4/2/4), so the delta is attributable to the key. Under `A6`, **both** named unbound
sites have **byte-identical chains** under `K-cap` and `K-bal`, and **no cap-hit declaration appears
in either chain**. `P4` landed: the 4-line cap is not the cause of their unboundness. They are
genuinely unbound.

Broke — `A7` printed `K-cap P12 2 of 20 (recording's B5: 2; members **DIFFER**)` and `P5` came back
**REFUTED**, while the same line reports `P12 membership unchanged` between the two keys and `bound
sites 2 → 2`. Those two readings cannot both be about the measurement. The refutation is almost
certainly **mine**: `B5` in the recording prints its members through `p.replace('docs/research/',
'')` — a *display* transform — and arm A compared that printed list against `CAP.p12Members`, which
holds the **join key**, the full repo-relative path. If so, `P5` was refuted by a string form and not
by a fact, and the arm published a REFUTED against a true prediction.

Arm A is **not** edited and **not** re-driven. `drive1.arma.out` stands with its `members DIFFER` and
its `REFUTED P5` in it, because the defect is this unit's evidence.

## Arm B's job

1. Normalise both sides to one key form and **re-decide `P5`**, publishing the corrected verdict next
   to the uncorrected one.
2. **Assert the diagnosis** rather than eyeball it: that the prefix is the *sole* cause.
3. Widen `A6` from the 2 named sites to **all** sites, because "not implicated for these two" is a
   weaker claim than the data may support.

## Predictions — blind, before arm B is written

| id | prediction |
|---|---|
| `Q1` | After normalising the recording's display strings to the join-key form, `K-cap`'s `P12` membership is **identical** to the recording's — i.e. `P5`'s refutation was entirely an artefact of my comparison. |
| `Q2` | The prefix is the **sole** cause: no member differs for any other reason once `docs/research/` is accounted for. |
| `Q3` | **None** of the 4 `RESOLVED` sites has a chain that differs between `K-cap` and `K-bal` — the 11 cap hits are inert for this measurement across the board, not merely for the 2 named sites. |
| `Q4` | At least one of the 11 cap-hit declarations appears in **no** chain of **any** site, so the cap-hit count overstates the cap's reach into this measurement. |
| `Q5` | The corrected `P12` is **2 of 20**, unchanged under either key — so the whole re-key buys nothing on this question and should **not** be promoted. |

`Q1`/`Q2` are about my defect. `Q3`/`Q4`/`Q5` are the widened answer to the boarded question.

## Legs

`B0` recording re-captured at `2694a13e` · `B1` normalised comparison, `P5` re-decided · `B2` the
prefix is the sole cause, asserted · `B3` per-site chain delta across all sites under both keys ·
`B4` cap-hit declarations' reach into any chain · `B5` the corrected `P12` and the promotion call ·
`B-gate` porcelain clean.

`B1` is a **gate**: if the normalised lists still differ, the diagnosis is wrong and `Q2` is refuted
rather than quietly re-explained.
