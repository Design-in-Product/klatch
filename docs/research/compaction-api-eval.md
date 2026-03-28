# Compaction API Evaluation (`compact-2026-01-12`)

**Filed by:** Argus
**Date:** 2026-03-28
**Source:** Round 13 Part C1 (Daedalus assignment)
**Status:** Research complete — ready for Daedalus review

---

## 1. How Compaction Works

When input tokens exceed the configured trigger threshold:

1. **Generates a summary** of the conversation history using a summarization prompt (default or custom).
2. **Returns a `compaction` content block** at the start of the assistant response containing the summary.
3. **Continues generating** the actual response after the compaction block (unless `pause_after_compaction` is true, which stops with `stop_reason: "compaction"`).

On subsequent requests, when the compaction block is passed back in the assistant message, **the API automatically drops all content blocks prior to the compaction block.** The conversation continues from the summary.

**This is lossy.** Each compaction loses specifics (exact error messages, subtle reasoning, architectural nuances). Repeated compactions compound: a summary of a summary degrades significantly.

The default summarization prompt asks Claude to write a `<summary>` block. Custom instructions via the `instructions` parameter **completely replace** (not supplement) this default.

## 2. Threshold Assessment

| Parameter | Value |
|-----------|-------|
| Klatch current | **80,000 tokens** |
| API minimum | 50,000 tokens |
| API default | 150,000 tokens |
| Claude Code uses | ~167,000 (83.5% of 200K) |

**Assessment:** 80K is conservative — triggers at 40% of the 200K context window. With **1M context now GA for Opus 4.6 and Sonnet 4.6 at standard pricing**, 80K is only 8% of capacity.

**Recommendation:** Raise to at least **150,000** (the API default). Consider higher with 1M context. For imported sessions that are already large, 80K may trigger on the very first turn — which compresses imported history before the user's first message. This might be desirable or surprising depending on context.

## 3. Multi-Entity Context Preservation

**Not preserved by default.** The default summarization prompt focuses on task state, next steps, and learnings — no awareness of roundtable entity markers.

**Fix: custom `instructions`.** For roundtable channels, provide entity-aware summarization:

```
Summarize this multi-participant conversation. Preserve the identity of each participant
and attribute key points, decisions, and positions to the correct entity. Maintain
entity attribution markers. Capture discussion state, areas of agreement/disagreement,
and next steps. Wrap your summary in a <summary></summary> block.
```

Klatch's current implementation already only enables compaction for the first entity in a roundtable round (line 761-768 of `client.ts`), with the comment "subsequent entities get synthetic context, compaction would be confusing." This is correct — the custom instructions approach makes it roundtable-safe for that first entity.

## 4. Latency Impact

- **Only adds latency on the compaction turn** (when threshold is exceeded). Zero overhead on non-compaction turns.
- The compaction step is an additional LLM sampling step — essentially an extra inference call to summarize 80K-150K+ tokens. Expect several seconds.
- **Summarization counts toward rate limits and billing** — billed for tokens used to generate the summary.
- **Net effect over time is positive:** After compaction, subsequent turns process fewer input tokens (faster, cheaper). One-time cost is amortized across future turns.
- With `pause_after_compaction`: two round-trips instead of one, but allows injecting context between them.

## 5. Per-Channel Configuration

**Already partially implemented.** Klatch enables compaction based on channel source:

```typescript
// client.ts line 674
const compactionEnabled = channel?.source !== 'native';
```

This can be extended to full per-channel settings. Options to expose:

| Setting | Description |
|---------|-------------|
| Enable/disable | Toggle compaction entirely |
| Trigger threshold | e.g., 80K for short channels, 300K for deep research |
| Custom instructions | Roundtable-aware summarization for multi-entity channels |
| Pause mode | `pause_after_compaction` for imported sessions where user reviews summary |

No schema change needed for basic enable/disable — it's already a per-request parameter. For persistent per-channel config, add a `compaction_config` JSON column to `channels` (or extend existing `compaction_state`).

## Recommendations Summary

| Decision | Recommendation |
|----------|---------------|
| Threshold | Raise from 80K to at least 150K; consider higher with 1M context |
| Roundtable safety | Use custom `instructions` to preserve entity attribution |
| Per-channel config | Extend existing source-based toggle to full per-channel settings |
| Pause mode | Consider `pause_after_compaction: true` for imported sessions |
| 1M context | Now GA at standard pricing — compaction becomes less urgent; higher thresholds viable |

## Sources

- [Compaction - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Context Windows - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Automatic Context Compaction Cookbook](https://platform.claude.com/cookbook/tool-use-automatic-context-compaction)
- [How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works)
- [Opus 4.6 Context Compaction - InfoQ](https://www.infoq.com/news/2026/03/opus-4-6-context-compaction/)
- [Token-Saving Updates - Anthropic](https://www.anthropic.com/news/token-saving-updates)
