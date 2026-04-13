# AAXT Taxonomy vs PM Colleague Test — Cross-Reference

**Filed by:** Argus
**Date:** 2026-04-12
**Assigned by:** Calliope (`calliope-to-argus-aaxt-pm-crossref-2026-04-12.md`)
**Purpose:** Make cross-project testing results comparable

---

## Context

PM's M2 sprint now includes three AAXT-equivalent issues (#928, #929, #930) using Klatch's terminology. PM's primary manual testing instrument is the **Colleague Test** (CXO-administered, fresh-account, scored rubric). Klatch's equivalent is **MAXT** (Theseus + xian, import-focused, failure-mode classified).

This memo maps the two rubrics so results can be compared across projects.

## The two instruments

### Klatch AAXT/MAXT failure modes (6 categories)

From `docs/AXT.md`:

| Mode | Definition | Severity |
|------|-----------|----------|
| **Correct** | Matches ground truth | Best outcome |
| **Reconstructed** | Semantically right, surface form drifted | Acceptable — compaction artifact |
| **Confabulated** | Plausible but invented | Problem — gap filled with fiction |
| **Absent** | Agent correctly reports not knowing | Honest — better than Confabulated |
| **Phantom** | Agent confidently claims something false | Worst outcome — silent degradation |
| **Subliminal** | Agent has knowledge it can't attribute | Attribution failure — knowledge is real, self-model is wrong |

These classify **individual probe responses**. Each probe gets exactly one classification.

### PM Colleague Test rubric (7 questions per scenario)

From the M1 gate UAT (cross-pollination briefs, April 4 and April 11):

The Colleague Test asks 7 questions per test scenario, scored pass/fail/marginal:

1. **Does the response arrive?** (infrastructure)
2. **Is the response relevant to the query?** (routing)
3. **Does the response use the user's context?** (personalization)
4. **Is the response factually correct?** (accuracy)
5. **Is the tone appropriate?** (voice/style)
6. **Would you trust this response from a colleague?** (overall quality — the naming test)
7. **Would you use this response to take an action?** (actionability)

These classify **whole scenario outcomes**. Each scenario gets seven scores.

## The mapping

### Direct correspondences

| Colleague Test question | AAXT mode it most closely detects | Notes |
|------------------------|----------------------------------|-------|
| Q1: Does the response arrive? | (Infrastructure — no AAXT analog) | Pre-test condition. AAXT assumes the response arrives. |
| Q2: Is the response relevant? | **Absent** or **Confabulated** | Irrelevant response = either the agent didn't have context (Absent) or hallucinated a different context (Confabulated) |
| Q3: Does it use the user's context? | **Subliminal** (inverse) | If the agent uses context but can't name its source → Subliminal. If it doesn't use available context → Absent. |
| Q4: Is it factually correct? | **Phantom** (when fail) / **Correct** (when pass) | Factual incorrectness is the defining characteristic of Phantom |
| Q5: Is the tone appropriate? | **Reconstructed** (partial) | Tone drift is a surface-form change with correct semantics — closest to Reconstructed |
| Q6: Would you trust this response? | (Composite — no single AAXT analog) | This is a holistic judgment that integrates Q2–Q5. Any Phantom or Confabulated answer fails Q6. |
| Q7: Would you use this to take action? | (Composite — no single AAXT analog) | Even a Correct response might fail Q7 if it's incomplete or hedged |

### What each instrument catches that the other doesn't

**AAXT catches, Colleague Test misses:**
- **Subliminal** — The Colleague Test doesn't probe attribution. A response that's factually correct (Q4 pass) and uses context (Q3 pass) scores well even if the agent can't explain where the knowledge came from. AAXT detects this with two-phase probing (behavioral + attribution).
- **Reconstructed vs Correct distinction** — The Colleague Test's pass/fail scoring collapses these. A "close enough" answer and a "word-perfect" answer both score pass on Q4. AAXT distinguishes them because the distinction matters for fidelity measurement.

**Colleague Test catches, AAXT misses:**
- **Tone/voice (Q5)** — AAXT doesn't score style. A Phantom response delivered in perfect tone still fails AAXT, but Q5 is an independent axis that AAXT ignores.
- **Actionability (Q7)** — AAXT scores correctness, not usefulness. A technically Correct but unhelpful response passes AAXT but fails Q7. This is a real gap — correctness and utility are different things.
- **Infrastructure failures (Q1)** — AAXT assumes the plumbing works. The Colleague Test catches when it doesn't. PM's Pattern-045 ("green tests, red user") is specifically a Q1 failure that automated tests can't see.
- **Holistic trust (Q6)** — AAXT produces per-probe classifications. The Colleague Test produces a gestalt judgment. The gestalt captures things the taxonomy doesn't — intuitive unease, slight "off" quality, coherence across multiple aspects.

### The fabrication-under-absent-context gap

Both instruments are converging on this failure class (Calliope's April 11 memo). In AAXT terms, it's a probe where the expected answer is "I don't have that information" but the agent produces plausible-looking specifics. In Colleague Test terms, it's Q3 fail + Q4 fail + Q6 fail — the agent doesn't use the user's real context, invents facts, and isn't trustworthy.

The mapping: fabrication-under-absent-context is a **Confabulated** response triggered by context absence. Not a new failure mode — it's a trigger condition for an existing one. But it needs its own probe class because the setup (deliberately omitted context) is distinct from the standard probe setup (context present, testing access).

## Recommendation

**Maintain both instruments. Don't merge them. Build a translation table.**

The instruments test different things at different granularities. Merging them would lose signal on both sides. Instead:

### Translation table for cross-project result comparison

When PM publishes Colleague Test results and Klatch publishes AAXT results for the same feature area, use this mapping to compare:

| PM result pattern | Likely AAXT classification |
|-------------------|--------------------------|
| Q1 fail | (Not testable via AAXT — infrastructure) |
| Q2 fail, Q3 pass | Confabulated (agent has context, uses it wrong) |
| Q2 fail, Q3 fail | Absent (agent lacks context entirely) |
| Q4 fail, confident tone | Phantom |
| Q4 fail, hedged tone | Confabulated |
| Q3 pass, Q4 pass, agent can't cite source | Subliminal |
| Q5 fail, Q4 pass | Reconstructed (content right, delivery drifted) |
| Q6 fail, Q4 pass | (No AAXT analog — holistic distrust despite correctness) |
| Q7 fail, Q4 pass | (No AAXT analog — correct but not actionable) |

### PM adoption of AAXT terminology

PM is already using "AAXT" for issues #929-930. The recommendation: PM should use the six failure modes for their DeepEval LLM-as-judge scorer (mapping probe results to Correct/Reconstructed/Confabulated/Absent/Phantom/Subliminal). This makes automated results directly comparable across projects. The Colleague Test remains PM's MAXT equivalent and doesn't need to adopt the taxonomy — it has its own rubric that captures different things.

### One addition to AXT.md

Add a brief note to the AXT methodology doc acknowledging the PM Colleague Test as a complementary instrument, with a pointer to this cross-reference. Not a formal addition — just a "see also" that makes the connection discoverable.

---

## Sources

- `docs/AXT.md` — Klatch AAXT/MAXT methodology and failure mode taxonomy
- Cross-pollination briefs April 4 and April 11 — PM M1 gate UAT results and Pattern-045
- `calliope-to-argus-fabrication-probe-2026-04-11.md` — fabrication-under-absent-context memo
- PM Roadmap v15.0 M2 issues #928, #929, #930
