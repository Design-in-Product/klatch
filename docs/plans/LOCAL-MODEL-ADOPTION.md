# Local Model Adoption Plan

**Author:** Argus
**Date:** 2026-04-15
**Status:** Proposed — for xian review, then route to Daedalus (implementation) and Dispatch (cross-project)
**Based on:** `docs/research/local-model-viability-2026-04-15.md`

---

## The opportunity

Local open-weight models (Gemma 4, Qwen 3) have reached a quality threshold where some of Klatch's LLM-dependent functions can run locally at zero marginal cost, with full privacy, no API latency, and no rate limits. Not all functions — but enough to meaningfully change the economics and independence of the project.

This plan proposes a phased adoption with built-in quality monitoring so we know when local models are good enough for each task, and when they aren't.

---

## Phase 1: Local model for AAXT testing (start now)

### What changes

The AAXT scaffolded probing pipeline (`packages/server/src/aaxt/`) currently uses GPT-4o-mini (via OpenAI API) or Haiku 4.5 (via Anthropic API) as the auxiliary LLM. We add Ollama as a third provider, defaulting to a local model when available.

### Implementation

**Step 1: Add Ollama provider to `auxiliary.ts`** (~15 lines)

```typescript
async function queryOllama(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      format: 'json',
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.message.content;
}
```

**Step 2: Update provider selection in `getConfig()`**

Priority order:
1. `OLLAMA_MODEL` env var set → use Ollama (local)
2. `OPENAI_API_KEY` set → use OpenAI (cloud, current default)
3. `ANTHROPIC_API_KEY` set → use Anthropic Haiku (cloud, fallback)
4. None → error

**Step 3: Install and pull a model locally**

```bash
brew install ollama          # if not installed
ollama pull gemma4:26b-a4b   # recommended: fast MoE, 16GB VRAM
# or: ollama pull qwen3:32b  # alternative: dense, needs 24GB
```

**Step 4: Set env var**

```bash
# In .env:
OLLAMA_MODEL=gemma4:26b-a4b
```

**Step 5: Run AAXT and compare**

Run the same channel through `POST /api/channels/:id/aaxt-run` with:
- Local model (Gemma 4 26B MoE)
- Cloud model (GPT-4o-mini)

Compare: probe quality, scoring accuracy, classification agreement rate.

### Acceptance criteria for Phase 1

- [ ] Local model produces valid JSON in >95% of probe generation calls
- [ ] Scoring classification agrees with cloud model on >80% of clear-cut cases (obvious Correct, obvious Phantom)
- [ ] Scoring classification agrees on >60% of borderline cases (Reconstructed vs. Correct, Confabulated vs. Phantom)
- [ ] Total AAXT run time is <2 minutes for a typical channel on Apple Silicon
- [ ] No test regressions when running the full suite with `OLLAMA_MODEL` set

### Effort estimate

Implementation: ~1 hour (Daedalus or Argus). Validation: ~2 hours (run comparisons, document results). Total: half a session.

---

## Phase 2: Quality monitoring framework (the decision engine)

### The problem Phase 2 solves

Phase 1 gives us a local model for testing. But the question "when is a local model good enough for task X?" keeps recurring — for handoff briefings, for micro-reflections, for future entity conversation, for compaction. We need a general framework for making that decision, not a one-off evaluation per task.

### The quality ladder

Define a set of tasks ordered by quality sensitivity, from most forgiving to most demanding:

| Tier | Task | Quality bar | Current best local | Status |
|------|------|------------|-------------------|--------|
| 1 | AAXT probe generation | Structured JSON, targeted questions | Gemma 4 26B MoE | **Ready now** |
| 2 | AAXT response scoring | AXT taxonomy classification | Gemma 4 26B MoE | **Ready now** (clear cases) |
| 3 | Micro-reflections (3.5c) | 1-3 sentence behavioral notes | Qwen3-32B / Gemma 4 31B | **Test needed** |
| 4 | Handoff briefing (3.5a) | Structured behavioral calibration | Qwen3-32B / Gemma 4 31B | **Test needed** |
| 5 | External extraction (3.5b) | Pattern identification from history | Qwen3-32B / Gemma 4 31B | **Test needed** |
| 6 | Entity conversation | Multi-turn, nuanced, sustained | Next-gen 70B+ models | **Not ready** |
| 7 | Compaction | Context summarization preserving structure | N/A (API-locked) | **Not available** |

### The evaluation protocol (per tier)

For each task we want to test a local model against:

1. **Generate a paired dataset.** Run the task N times (N=10-20) with both the cloud model and the local model on the same inputs.

2. **Blind review.** Present the outputs to xian (or any human reviewer) without labeling which came from which model. Score each output on a 1-5 scale for the task's quality criteria.

3. **Compute agreement.** What percentage of outputs scored within 1 point of each other? If >80%, the local model is good enough for that tier.

4. **Compute failure rate.** What percentage of local model outputs are scored ≤2 (clearly inadequate)? If <10%, the local model is acceptable. If >20%, it's not.

5. **Document and decide.** File results in `docs/research/`. If the local model passes for a tier, add it as an option for that function. If it doesn't, note why and re-evaluate when the next model generation ships.

### The promotion ritual

When a new local model generation ships (Gemma 5, Qwen 4, etc.):

1. Re-run the evaluation protocol on the lowest failing tier
2. If it now passes, promote the local model to that tier
3. Check whether the next tier up is also now passable
4. Update the quality ladder

This is a lightweight process — maybe 2-3 hours per model generation. The key property: **the decision is evidence-based, not vibes-based.** We know exactly where the quality boundary is and we measure it when the landscape shifts.

---

## Phase 3: Cross-project applicability

### Why this matters for Piper Morgan

PM has the same cost/independence questions:
- PM's DeepEval scorer (#929) currently uses a cloud LLM as judge
- PM's floor routing calls an LLM for every user query
- PM's composting pipeline (ADR-054) will need LLM-based memory consolidation

The quality ladder and evaluation protocol are transferable. PM can use the same framework to decide when a local model is good enough for each of its functions.

### What to share

1. **The quality ladder concept** — task tiers ordered by quality sensitivity
2. **The evaluation protocol** — paired dataset, blind review, agreement rate, failure rate
3. **The promotion ritual** — re-evaluate on each model generation
4. **Klatch's results** — once Phase 1 validation runs, share the actual numbers

### Suggested routing

File a cross-project memo via Dispatch or the cross-pollination brief. PM's Architect and Lead Dev are the natural recipients — Architect for the methodology, Lead Dev for the DeepEval integration.

---

## Phase 4: Local model for behavioral calibration (when ready)

### What this enables

If Phase 2 evaluation shows that Tier 3-5 tasks pass with a local model:

- **Handoff briefings become free.** No API cost per export. The user can generate and regenerate briefings freely without worrying about token spend.
- **Micro-reflections become zero-cost.** Per-session reflections can run on every session close without budgeting concerns.
- **External extraction becomes private.** Conversation history never leaves the machine. For users with sensitive content, this matters.

### What this doesn't enable (yet)

- Entity conversation quality. The "feel" gap between a local 32B model and Opus 4.6 in sustained multi-turn conversation is still real.
- Compaction. Locked to Anthropic's server-side API.
- 1M context. Local models max out at 128-256K context windows.

---

## Implementation timeline

| Phase | What | When | Who | Effort |
|-------|------|------|-----|--------|
| **1** | Ollama provider in auxiliary.ts | This week | Daedalus or Argus | ~1 hour |
| **1** | Pull model, run comparison | This week | Argus | ~2 hours |
| **2** | Quality ladder + eval protocol design | This week (done — this document) | Argus | Done |
| **2** | Run Tier 3-5 evaluations | Next session with bandwidth | Argus + xian (blind review) | ~3 hours |
| **3** | Cross-project memo | After Phase 1 results | Calliope or Argus via Dispatch | ~30 min |
| **4** | Promote local model to Tier 3-5 | When evaluation passes | Daedalus | ~1 hour |

---

## Risks and mitigations

**Risk: Local model quality degrades silently over time** (model updates, quantization changes).
**Mitigation:** Re-run the evaluation protocol quarterly, or whenever the model is updated. The paired dataset is reusable.

**Risk: Ollama isn't running when AAXT tests execute** (CI environment, different machine).
**Mitigation:** Graceful fallback to cloud provider. The provider priority chain handles this — if Ollama isn't reachable, fall through to OpenAI/Anthropic.

**Risk: Different quantization levels produce different quality.**
**Mitigation:** Pin the quantization level in the env var (`OLLAMA_MODEL=gemma4:26b-a4b-q4`). Document which quantization was validated.

**Risk: The evaluation protocol is too manual to sustain.**
**Mitigation:** After the first round, the paired dataset and scoring rubric can be partially automated. The blind review step stays manual (that's the point), but the data generation and comparison can be scripted.

---

## Open questions

1. **Which Mac does xian run Klatch on?** The hardware determines which model tier is practical. M4 Max with 64GB runs anything on this list comfortably. M3 with 24GB limits us to the MoE variants.

2. **Is Ollama already installed?** If yes, Phase 1 is even faster.

3. **Does xian want to do the blind review himself, or delegate?** The review is most valuable when done by someone who knows what "good" looks like for each task. For behavioral calibration tasks, that's xian. For testing tasks, it could be Argus running the comparison programmatically.

4. **Should the cross-project memo go through Dispatch or directly to PM Architect?** Dispatch adds formality and routing. Direct is faster. Either works.

---

## References

- `docs/research/local-model-viability-2026-04-15.md` — underlying research
- `docs/plans/AAXT-SCAFFOLDED-PROBING.md` — the pipeline this plugs into
- `packages/server/src/aaxt/auxiliary.ts` — the code that gets the Ollama provider
- PM issues #929 (DeepEval scorer), #972-976 (memory architecture)
