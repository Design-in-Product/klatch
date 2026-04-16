# Local Model Viability: Gemma 4, Qwen 3, and Klatch Use Cases

**Filed by:** Argus
**Date:** 2026-04-15
**Request:** xian — two questions: (a) when can we use a local model for LLM-based testing? (b) when can we use one for mission-critical functions?

---

## TL;DR

**(a) LLM-based testing: now, already.** Qwen3-32B or Gemma 4 26B-A4B (MoE) running locally via Ollama can serve as the auxiliary LLM in our AAXT scaffolded probing pipeline. The quality is sufficient for probe generation and response scoring. You'd lose some nuance vs. GPT-4o-mini, but the cost drops to zero and the latency is comparable.

**(b) Mission-critical functions: not yet, but close.** For the entity handoff briefing (Phase 3.5a) and the export flow's behavioral extraction, local models lack the judgment quality of Opus/Sonnet. Within 6-12 months — likely with the next generation of open 30-70B models — the gap will be small enough for most use cases. Today, a hybrid approach works: local for testing/evaluation, cloud for user-facing generation.

---

## The landscape as of April 2026

### Gemma 4 (Google, released April 2, 2026)

| Model | Params | Active | Context | MMLU Pro | LiveCodeBench v6 | Codeforces ELO | VRAM (Q4) |
|-------|--------|--------|---------|----------|-------------------|----------------|-----------|
| Gemma 4 31B | 31B dense | 31B | 256K | 85.2% | 80.0% | 2150 | ~20 GB |
| Gemma 4 26B-A4B | 26B MoE | 4B | 256K | 82.6% | 77.1% | 1718 | ~16 GB |
| Gemma 4 E4B | 8B | 4.5B | 128K | 69.4% | 52.0% | 940 | ~5 GB |
| Gemma 4 E2B | 5.1B | 2.3B | 128K | 60.0% | 44.0% | 633 | ~3 GB |

**Headline:** Gemma 4 31B scores 80.0% on LiveCodeBench — competitive with Claude Opus 4.6 (80.8%) and GPT-5.4 (~80%). It sits "on the same leaderboard row as Claude Sonnet 4.5." The MoE variant loses 2-3% on benchmarks but runs 2-4x faster because only 4B parameters are active during inference.

**Local inference:** Gemma 4 31B needs ~20 GB RAM at Q4 quantization. Runs on any Mac with 24+ GB unified memory. The MoE variant (26B-A4B) pushes ~300 tok/s on a Mac Studio M2 Ultra. Apache 2.0 license.

### Qwen 3 (Alibaba, released 2025, actively updated)

| Model | Params | Active | Context | HumanEval | SWE-bench Verified | VRAM (Q4) |
|-------|--------|--------|---------|-----------|---------------------|-----------|
| Qwen3-32B | 32B dense | 32B | 128K | ~93% | ~50% (est.) | ~20 GB |
| Qwen3-30B-A3B | 30B MoE | 3B | 128K | — | 50.3% | ~18 GB |
| Qwen3-14B | 14B dense | 14B | 128K | — | — | ~11 GB |
| Qwen3-8B | 8B dense | 8B | 128K | — | — | ~6 GB |

**Headline:** Qwen3-32B "matches or beats GPT-4o on several reasoning benchmarks." Qwen3-Coder-30B-A3B (coding-specialized MoE) scores 50.3% on SWE-Bench Verified and runs at 73-87 tok/s on a single RTX 4090. Apache 2.0 license.

**Local inference on Apple Silicon:** With Ollama 0.19's MLX backend (shipped March 31, 2026), Qwen3.5 32B runs at ~112 tok/s on M4 Max with 64GB. Requires 32+ GB unified memory for the MLX backend.

### Also notable: Qwen3-Coder-Next

A bleeding-edge coding agent model from Alibaba. Not fully benchmarked yet but positioned as a "run powerful AI coding agents locally" solution. Worth watching for Klatch's use case.

---

## Question (a): Local model for LLM-based testing

### What we need

The AAXT scaffolded probing pipeline uses an "auxiliary LLM" for two tasks:

1. **Probe generation:** Read prompt-debug layer content, generate 5-19 targeted questions per assessment
2. **Response scoring:** Read an agent's response + expected answer, classify as Correct/Reconstructed/Confabulated/Absent/Phantom/Subliminal

Both tasks require:
- JSON output (structured responses)
- Reasoning about text similarity and meaning
- Instruction following (specific output format)
- ~2K-4K context per call (small context windows are fine)

### Assessment: ready now

**Recommended model: Qwen3-32B or Gemma 4 26B-A4B (MoE)**

Both are strong enough for probe generation and scoring:

| Requirement | Qwen3-32B | Gemma 4 26B-A4B |
|-------------|-----------|-----------------|
| JSON output | Yes (Ollama supports structured output) | Yes |
| Reasoning quality | Competitive with GPT-4o | ~82.6% MMLU Pro (strong) |
| Instruction following | Good | Good |
| Speed (Apple Silicon) | ~112 tok/s (M4 Max, MLX) | ~300 tok/s (MoE, M2 Ultra) |
| VRAM | ~20 GB (Q4) | ~16 GB (Q4, MoE) |
| License | Apache 2.0 | Apache 2.0 |
| Cost | Free after download | Free after download |

**The quality gap vs. GPT-4o-mini for testing:**
- Probe generation: minimal difference. Generating targeted questions from context is well within these models' capabilities.
- Response scoring: slightly lower nuance for borderline cases (Reconstructed vs. Correct, Confabulated vs. Phantom). The six-category AXT taxonomy requires judgment calls that benefit from stronger reasoning. But for clear-cut cases (obvious Phantom, obvious Correct), local models are fine.

**Practical recommendation:**
- Use a local model as the default auxiliary for AAXT runs during development and CI
- Use GPT-4o-mini (or Haiku) for high-stakes assessment runs (MAXT validation, pre-release fidelity checks)
- The AAXT pipeline already supports both — `OPENAI_API_KEY` triggers cloud, fallback to `ANTHROPIC_API_KEY`, and we could add Ollama as a third option with minimal code

### Implementation effort

The `auxiliary.ts` module already has a provider abstraction. Adding Ollama as a third provider:

```typescript
// In auxiliary.ts, add:
async function queryOllama(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
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
  const data = await res.json();
  return data.message.content;
}
```

~15 lines. The config check would be: if `OLLAMA_MODEL` env var is set, use local; otherwise fall through to OpenAI/Anthropic.

---

## Question (b): Local model for mission-critical functions

### What we need

"Mission-critical" in Klatch's context means:

1. **Entity response generation** — the actual conversations in channels (currently Opus/Sonnet via Anthropic API)
2. **Handoff briefing generation (Phase 3.5a)** — entity writes a behavioral calibration briefing for its successor
3. **Micro-reflections (Phase 3.5c)** — entity notes what it learned at session end
4. **Compaction** — summarizing conversation history (currently server-side via Anthropic beta API)

### Assessment: not yet, but the gap is closing fast

**Entity response generation:** This is the hardest bar. Klatch entities are expected to produce Opus/Sonnet-quality reasoning, code generation, and nuanced conversation. Gemma 4 31B is competitive on benchmarks but:
- Benchmark scores ≠ real-world conversation quality. The "feel" of a 31B local model vs. Opus 4.6 is still distinguishable in sustained multi-turn conversation.
- Extended thinking / adaptive reasoning isn't available in open models the way Anthropic implements it.
- The 256K context window (Gemma 4) vs. 1M (Opus/Sonnet) matters for long imported conversations.

**Timeline estimate:** 6-12 months before a local 30-70B model matches Sonnet 4.6 quality for sustained conversation. The trajectory is clear — Gemma 4 31B is already competitive on coding benchmarks, and each generation closes the gap significantly (Gemma 3 27B scored 29.7% on LiveCodeBench; Gemma 4 31B scores 80.0%).

**Handoff briefing + micro-reflections:** These are more tractable. They're single-turn tasks with structured output, similar to the testing use case. A Qwen3-32B or Gemma 4 31B could likely produce acceptable briefings today, especially if the handoff prompt is well-structured (which ours is — the six-point consensus prompt). The risk is confabulation quality — a local model might fabricate behavioral patterns more readily than Opus, producing field notes that look right but aren't grounded.

**Compaction:** Currently tied to Anthropic's server-side `compact-2026-01-12` beta API. No local equivalent exists. This is the most cloud-locked function. Eventually, a local model could do client-side summarization, but we'd lose the API's integration with the compaction block format.

### The hybrid approach (recommended for now)

| Function | Local viable? | Recommendation |
|----------|--------------|----------------|
| AAXT probe generation | **Yes, now** | Add Ollama provider to auxiliary.ts |
| AAXT response scoring | **Yes, now** (with caveats for borderline cases) | Same |
| Handoff briefing (3.5a) | **Maybe** — test quality first | Run A/B: local vs. cloud briefings, compare reviewer acceptance rate |
| Micro-reflections (3.5c) | **Probably yes** — simpler task than briefing | Test with a few sessions |
| Entity conversation | **Not yet** | Stay on Anthropic API |
| Compaction | **No** | Anthropic-locked (server-side beta) |

---

## Hardware requirements summary

For xian's Mac setup:

| Model | Min RAM | Recommended RAM | Speed (est.) |
|-------|---------|-----------------|--------------|
| Gemma 4 E4B (8B) | 8 GB | 16 GB | Fast, lightweight |
| Qwen3-14B | 16 GB | 24 GB | Good balance |
| Gemma 4 26B-A4B (MoE) | 24 GB | 32 GB | Fast (only 4B active) |
| Qwen3-32B | 24 GB | 48 GB | ~112 tok/s (M4 Max, MLX) |
| Gemma 4 31B (dense) | 24 GB | 48 GB | Slower than MoE but higher quality ceiling |

**The sweet spot for Klatch's testing use case:** Gemma 4 26B-A4B (MoE). Only 4B parameters active during inference = fast. 16 GB VRAM at Q4 = fits on most modern Macs. 82.6% MMLU Pro = strong enough for probe generation and scoring. Apache 2.0 = no licensing concerns.

---

## What to try first

1. **Install Ollama** (if not already): `brew install ollama`
2. **Pull a model:** `ollama pull gemma4:26b-a4b` or `ollama pull qwen3:32b`
3. **Test probe generation manually:** Send the AAXT probe generation prompt to the local model, compare output quality against GPT-4o-mini
4. **If quality is acceptable:** Add Ollama provider to `auxiliary.ts` (~15 lines), set `OLLAMA_MODEL=gemma4:26b-a4b` in `.env`
5. **Run AAXT with local model:** Compare scored results against a cloud-model baseline

This is a low-risk experiment. If the local model's probe quality is good enough, we get free, private, zero-latency AAXT runs. If it's not, we learn where the quality boundary is and wait for the next model generation.

---

## Sources

- [Gemma 4 announcement](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/) (Google)
- [Gemma 4 on Hugging Face](https://huggingface.co/blog/gemma4)
- [Gemma 4 on Apple Silicon](https://sudoall.com/gemma-4-31b-apple-silicon-local-guide/) (SudoAll)
- [Qwen 3 announcement](https://qwenlm.github.io/blog/qwen3/) (Alibaba)
- [Qwen3-Coder-Next local guide](https://dev.to/sienna/qwen3-coder-next-the-complete-2026-guide-to-running-powerful-ai-coding-agents-locally-1k95) (DEV Community)
- [Ollama MLX backend](https://ollama.com/blog/mlx) (Ollama)
- [DeepEval LLM evaluation framework](https://deepeval.com/) (Confident AI)
- [SWE-bench leaderboard](https://www.swebench.com/)
- [Home GPU LLM Leaderboard](https://awesomeagents.ai/leaderboards/home-gpu-llm-leaderboard/)
