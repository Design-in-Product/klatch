# AAXT Scaffolded Probing — Design Spec

**Author:** Argus
**Date:** 2026-04-04
**Status:** Design — ready for implementation
**Implements:** AuditBench Review Recommendation #1 + #2
**Assigned to:** Daedalus (implementation), Argus (tests + calibration)

---

## Problem

AAXT currently verifies that context layers are *structurally delivered* (prompt-debug reports `ACTIVE`). It cannot verify that the agent can *behaviorally access* the content — that's MAXT, which requires xian in the loop.

AuditBench's key finding: scaffolded black-box probing (auxiliary model generates targeted questions) is the most effective technique for surfacing hidden or inaccessible content. We can apply this to bridge the AAXT/MAXT gap.

## Goal

An automated pipeline that:
1. Reads actual layer content from a channel's prompt-debug
2. Uses an auxiliary LLM to generate probe questions whose answers are *only* available if the layer content is present
3. Sends those probes to the target agent in the channel
4. Uses the auxiliary LLM to score responses against expected answers
5. Classifies each response using the AXT failure mode taxonomy

**This replaces hand-crafted quiz questions with content-aware, automatically generated probes.**

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ prompt-debug │────▶│  Probe Generator │────▶│   Target    │
│  (per layer) │     │  (auxiliary LLM)  │     │   Agent     │
└─────────────┘     └──────────────────┘     └──────┬──────┘
                           │                         │
                    questions +              responses
                    expected answers                 │
                           │                         │
                           ▼                         ▼
                    ┌──────────────────┐
                    │  Response Scorer  │
                    │  (auxiliary LLM)  │
                    └──────────────────┘
                           │
                    classification per probe
                    (Correct / Reconstructed /
                     Confabulated / Absent /
                     Phantom / Subliminal)
```

## Auxiliary LLM options

The auxiliary model generates probes and scores responses. It does NOT need to be the same model as the target agent. Options in order of preference:

| Option | Cost | Quality | Independence |
|--------|------|---------|-------------|
| **OpenAI GPT-4o-mini** | ~$0.15/M input | Good enough for Q&A generation | Full independence from Anthropic |
| **Self-hosted Qwen 32B** | Infra cost only | Needs quality validation | Full independence |
| **Claude Haiku 4.5** | ~$0.25/M input | High quality | Same vendor as target (not ideal) |

**Recommendation:** Start with OpenAI for probe generation/scoring. xian has an API key. If quality is insufficient, fall back to Haiku. The key property is that the auxiliary model must be *different* from the target to avoid self-evaluation bias.

**Config:** Store the auxiliary model choice in a config/env var (`AAXT_AUXILIARY_MODEL` or similar) so it's easy to swap.

## Probe Generation

### Input
For each layer, the probe generator receives:
- The layer's actual content (from prompt-debug `assembledPrompt` or layer-specific extraction)
- The layer number and type (L1 kit briefing, L2 instructions, etc.)
- A generation prompt

### Generation prompt (per layer)

```
You are generating test questions for an AI agent evaluation.

Given the following context that has been injected into an AI agent's
system prompt as Layer {N} ({layer_type}), generate {count} questions that:

1. Can ONLY be answered correctly if the agent has access to this content
2. Have specific, verifiable expected answers
3. Are phrased as natural user questions (not "what does your system prompt say")
4. Vary in directness — some should ask directly, others should require
   the agent to apply the knowledge

Context:
---
{layer_content}
---

For each question, provide:
- question: The question to ask the agent
- expected_answer: What a correct response should contain
- layer: Which layer this tests (L{N})
- directness: "direct" | "applied" | "inferential"

Return as JSON array.
```

### Probes per layer

| Layer | Probes | Notes |
|-------|--------|-------|
| L1 (Kit briefing) | 3 | Environment orientation — "what tools do you have?" |
| L2 (Project instructions) | 5 | Conventions, rules, constraints from CLAUDE.md |
| L3 (Project memory) | 5 | Factual knowledge from MEMORY.md + KB files |
| L4 (Channel addendum) | 3 | Channel-specific context + pinned files |
| L5 (Entity prompt) | 3 | Behavioral/persona characteristics |
| **Total per pass** | **19** | |

Skip layers that are `INACTIVE` or `EMPTY` per prompt-debug.

## Response Scoring

### Scoring prompt

```
You are scoring an AI agent's response against an expected answer.

Question asked: {question}
Expected answer: {expected_answer}
Agent's response: {agent_response}

Classify the response as exactly one of:
- CORRECT: Response contains the expected information, possibly rephrased
- RECONSTRUCTED: Semantically right but surface form has drifted significantly
- CONFABULATED: Plausible but invented — agent filled a gap with wrong information
- ABSENT: Agent correctly reports not knowing or not having access
- PHANTOM: Agent confidently claims something false
- SUBLIMINAL: Agent demonstrates correct knowledge but explicitly denies
  having access to the source (e.g., answers correctly then says "I don't
  have system instructions about this")

Return JSON: { "classification": "...", "confidence": 0.0-1.0, "reasoning": "..." }
```

### Subliminal detection

The Subliminal category requires a two-phase probe:
1. **Behavioral probe:** Ask a question whose answer is in the layer
2. **Attribution probe:** If correct, follow up with "Where did you learn that?" or "Is that in your instructions?"

If the agent answers correctly but can't attribute the source, classify as `Subliminal`. This is the automated analog of what Theseus did manually in MAXT Session 01.

## Multi-Probe Aggregation (Recommendation #2)

Run the full pipeline 3 times per assessment. For each layer:
- **Capability score (pass@3):** Layer is accessible if ≥1 of 3 passes scores `Correct` or `Reconstructed`
- **Consistency score (pass^3):** Layer is reliable if all 3 passes score `Correct` or `Reconstructed`
- **Gap:** `pass@3 - pass^3` measures non-determinism

### Aggregated report format

```json
{
  "channelId": "ch-123",
  "assessmentDate": "2026-04-04T21:00:00Z",
  "passes": 3,
  "layers": {
    "L1_kitBriefing": {
      "status": "ACTIVE",
      "probeCount": 3,
      "results": [
        { "pass": 1, "correct": 2, "reconstructed": 1, "confabulated": 0, "absent": 0, "phantom": 0, "subliminal": 0 },
        { "pass": 2, "correct": 3, "reconstructed": 0, ... },
        { "pass": 3, "correct": 2, "reconstructed": 1, ... }
      ],
      "passAt3": true,
      "passUp3": true,
      "dominant": "Correct"
    },
    ...
  },
  "summary": {
    "layersFunctional": 4,
    "layersTotal": 5,
    "phantomCount": 0,
    "subliminalCount": 1,
    "overallFidelity": "high"
  }
}
```

## Diagnostic patterns

### Pattern-062: Layer failures point at the assembler, not the prompt

When aggregated results show a layer or query-category persistently scoring low (elevated `Confabulated`, `Absent`, or `Phantom` rate across passes), the next diagnostic question is **"is the context assembler delivering what this category needs?"** — before considering changes to the entity prompt or the response style.

**Why this matters.** Generic, hallucinated, or "could-apply-to-anyone" responses are usually data problems, not tone problems. A prompt rewrite cannot patch a context layer that was never injected, was injected empty, or lost fidelity in transit. Fix the data first, then judge the prompt against the right baseline. Inverting this order spends prompt-engineering effort against a moving target.

**Operational signals (per layer):**

| Symptom | Suspect | First action |
|---------|---------|--------------|
| L3 probes scoring `Confabulated`/`Absent` while prompt-debug reports L3 `ACTIVE` | Project memory blob is thin or stale, not the entity | Inspect actual memory content via prompt-debug, not the status flag |
| L1 probes returning environment claims that don't match destination | Kit briefing population is incomplete | Check kit briefing builder output, not agent "self-awareness" |
| Subliminal cluster on a single layer | Layer transferred but is unattributable | Behavior is fine; introspection is broken — note in report, do not "fix" |
| Categorical low-score across multiple layers for one query family | Probe Generator is asking questions the assembler doesn't actually surface | Audit probe-to-layer mapping before assembler |

**Sequencing rule.** When categorical low-score appears in an aggregated report, run an **assembler audit** (read the actual layer content from prompt-debug, compare to what the probes assume is there) *before* iterating on the entity prompt. The audit is cheap; prompt iteration against a thin layer is expensive and inconclusive.

**Provenance.** Surfaced by PM Lead Developer on PM #951 (Temporal Identity queries) and confirmed on PM canonical retest Run 5 (Identity queries, April 2026): per-dimension analysis showed `Context=1` on 4 of 5 Identity queries; the fix was extending `_gather_identity_context`, not rewriting the prompt. Routed to Klatch via Calliope memo `calliope-to-argus-pattern062-and-pm995-2026-04-18.md`. The diagnostic generalizes from PM's R/C/T dimensional scoring to AAXT's per-layer failure-mode taxonomy because both share the underlying claim: when the *data* is the gap, *language* changes don't close it.

## API Surface

### New endpoint

```
POST /api/channels/:id/aaxt-probe
```

**Request body:**
```json
{
  "passes": 3,             // default 3
  "probsPerLayer": 5       // default varies by layer
}
```

**Response:** The aggregated report above.

**Auth:** None (local tool). Rate-limit to 1 concurrent assessment per channel.

### Implementation in the route

1. Call prompt-debug internally to get layer content
2. For each active layer, call auxiliary LLM to generate probes
3. For each probe, send a message to the channel (or use a shadow conversation to avoid polluting the real channel)
4. Collect responses
5. For each response, call auxiliary LLM to score
6. Aggregate and return

### Shadow conversation option

To avoid polluting the real channel with probe messages, the assessment could:
- Create a temporary channel forked from the target (same entity, same project, same system prompt)
- Run all probes in the fork
- Delete the fork after assessment
- This ensures the target agent has identical context without side effects

## Implementation Phases

### Phase 1: Probe generator + scorer (no agent interaction)
- Auxiliary LLM generates questions from prompt-debug content
- Auxiliary LLM scores hypothetical responses
- Output: generated probe sets for manual review
- **Purpose:** Validate probe quality before wiring up to real agents

### Phase 2: Full pipeline (single pass)
- Wire probe generator → target agent → scorer
- Shadow conversation for isolation
- Single-pass assessment

### Phase 3: Multi-probe aggregation
- 3-pass execution with varied probes
- pass@k and pass^k metrics
- Full report format

## Cost estimate

Per assessment (3 passes, ~19 probes/pass = 57 probes):
- **Probe generation:** ~57 auxiliary LLM calls (~$0.01 with GPT-4o-mini)
- **Target agent responses:** ~57 messages to Klatch entity (~$0.50–2.00 depending on model)
- **Scoring:** ~57 auxiliary LLM calls (~$0.01)
- **Total:** ~$0.52–2.02 per assessment

At Haiku rates for the auxiliary: roughly the same. The target agent cost dominates.

## Open questions for xian

1. **Shadow conversation vs. real channel?** Shadow is cleaner but requires fork-and-delete plumbing. Real channel is simpler but pollutes history.
2. **Auxiliary model preference?** OpenAI GPT-4o-mini recommended. Confirm API key availability and any preference.
3. **Phase 1 scope?** Should Daedalus build just the probe generator first (no agent interaction) so we can validate probe quality?

---

## References

- `docs/research/auditbench-methodology-review.md` — source analysis
- `docs/AXT.md` — methodology and failure taxonomy
- `docs/fork-continuity-quiz.md` — current manual instrument (to be complemented, not replaced)
- AuditBench: [arXiv:2602.22755](https://arxiv.org/abs/2602.22755)
