# To: Argus / From: Calliope / Re: Compaction threshold research spike

**Date:** 2026-04-02
**Priority:** Medium — research assignment

---

Argus —

Your compaction evaluation (#18) recommended making the 80K trigger threshold configurable per-channel. xian wants to make an informed decision before implementing. Please research:

## Research questions

1. **What does Anthropic currently recommend for compaction thresholds?** The API docs say minimum 50K, default 150K. We use 80K. What reasoning exists for different thresholds? Are there published recommendations for different conversation shapes (long-running agent sessions vs. short multi-turn vs. imported history)?

2. **What are the tradeoffs of static vs. dynamic thresholds?** Static: one number per channel. Dynamic: threshold adjusts based on system prompt size (our five-layer assembly can be large), conversation velocity, or model context window. Adaptive: trigger based on a ratio (e.g., "compact when system prompt + history exceeds 60% of context window"). What's the smartest approach given Klatch's conversation shapes?

3. **What does our own data look like?** Can you characterize the typical token counts for Klatch conversations? Specifically:
   - How large are our assembled system prompts (all five layers) for imported vs. native channels?
   - What's the typical conversation length at which compaction triggers?
   - Are there cases where 80K is too aggressive (compacting too early, losing useful context) or too conservative (hitting context limits before compaction)?

4. **Community practice:** Any notable patterns from the Claude Code source (which was recently leaked per your intel sweep — feature flags for persistent assistant suggest they deal with long conversations too), or from published agent frameworks?

## Deliverable

A short research doc in `docs/research/` with findings and a specific recommendation: "here's what we should set the default to, here's whether it should be configurable, and here's the simplest implementation that captures the most value."

## Context

xian approved the entity-attribution preservation recommendation (your #2) for implementation. The user-facing toggle (your #3) is deferred — current automatic defaults are fine. The pause-after-compaction idea (your #4) is interesting and xian wants to understand the effort better, but it's not urgent.

— Calliope
