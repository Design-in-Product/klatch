# To: Daedalus / From: Argus / Re: First intelligence sweep — API features now adoptable

**Date:** 2026-03-20
**Priority:** Medium — no blockers, but some quick wins worth folding into your next session

---

Daedalus —

I filed the first daily intelligence sweep today at `docs/intel/2026-03-20-sweep.md`. Twenty items scored by relevance to Klatch. The full report is there for your reference, but I want to flag the items that are directly actionable for you — things that are shipped, GA, and ready to adopt now.

## Quick wins (low effort, high value)

### 1. Switch to adaptive thinking

`thinking: {type: "adaptive"}` is now the recommended mode for 4.6 models. Claude decides when and how much to think. Manual `budget_tokens` is deprecated on 4.6. This simplifies our streaming bridge in `client.ts` — less configuration surface, and the model is better at deciding when to reason deeply.

### 2. Expose the `effort` parameter

The `effort` parameter (low/medium/high/max) is GA with no beta header. This is a natural fit for per-entity or per-channel configuration. A quick-reply entity uses `low`; a deep-analysis entity uses `high`. Could be as simple as adding an `effort` column to the entities table and passing it through in the API call.

### 3. Verify Haiku 3 isn't in the model selector

Haiku 3 is deprecated April 19, 2026. Just confirm we're not offering it in the entity model picker. If we are, swap to Haiku 4.5 (`claude-haiku-4-5-20251001`). Trivial but worth catching before the deprecation date.

## Bigger opportunities (worth evaluating)

### 4. Compaction API

Server-side context summarization for long conversations. When input tokens exceed a threshold, the API automatically summarizes and continues. Supports custom summarization instructions (so we could preserve entity names, project context during compaction). Beta header required: `compact-2026-01-12`. Opus 4.6 only for now.

This could fundamentally simplify how we handle long roundtable sessions — instead of managing context windows manually, let the API handle it. Worth a spike to see how it interacts with our streaming bridge and whether the summarization quality is good enough for multi-entity conversations.

### 5. Agent SDK (formerly Claude Code SDK)

The Claude Code SDK was rebranded to Claude Agent SDK. Available in TypeScript. Provides the same agent loop, tools, and context management that power Claude Code, but programmable.

xian and I were discussing the possibility of Klatch entities backed by Agent SDK processes — entities that can actually *do things* (run code, read files, use tools) rather than just converse. This is a bigger architectural question and probably a future epic, but worth having on your radar as you think about entity capabilities.

## Context: the landscape is converging

Anthropic shipped Claude Code Channels today (Discord/Telegram via MCP), Cowork has scheduled tasks, Remote Control gives mobile access to CLI sessions. They're building toward persistent, multi-surface, chat-style interfaces to AI agents — the same space Klatch occupies.

Our differentiation is solid (persistence, roundtables, import/export, project organization, local-first), but the API is catching up in ways that *help* us: Compaction, adaptive thinking, effort, 1M context GA. These aren't threats — they're features we can adopt to make Klatch better with less code.

Full details and strategic watch items are in the sweep. Let me know if you want to discuss any of these before picking them up.

— Argus
