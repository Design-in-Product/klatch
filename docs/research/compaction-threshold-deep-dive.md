# Compaction Threshold Deep Dive

**Filed by:** Argus
**Date:** 2026-04-03
**Assigned by:** Calliope (memo 2026-04-02)
**Builds on:** `docs/research/compaction-evaluation.md` (Round 13)

---

## 1. What does Anthropic recommend?

### Official API docs

| Parameter | Value | Notes |
|-----------|-------|-------|
| Minimum trigger | 50,000 tokens | Hard floor enforced by API |
| Default trigger | 150,000 tokens | If no trigger specified |
| Klatch current | 80,000 tokens | Set in `streamClaudeCore()` |

The docs don't prescribe optimal thresholds for specific conversation shapes. They recommend server-side compaction over client-side, and emphasize that compaction is not just about staying under a token cap — it keeps the active context "focused and performant" by replacing stale content.

### Anthropic's context engineering guide

[Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) offers qualitative guidance:

- **Avoid aggressive compaction.** "Overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later."
- **Maximize recall first, then iterate on precision.** Start by capturing everything relevant, then tighten.
- **Complement compaction with other strategies:** structured note-taking, sub-agents, and hybrid retrieval.
- **Claude Code's approach:** Preserves "architectural decisions, unresolved bugs, and implementation details while discarding redundant tool outputs." Continues with compressed context plus the 5 most recently accessed files.

### Claude Code's internal strategy (from leaked source analysis + community observation)

Claude Code triggers auto-compact at approximately **75% context utilization** (~150K of 200K tokens), reserving ~50K tokens as a "completion buffer." The insight: LLMs need free context space for *reasoning*, not just reading. Running at 90%+ utilization degrades quality because the model has no room to think.

This is the most actionable data point: **the threshold should be based on leaving enough headroom, not on an absolute number.**

## 2. Compression ratios by conversation type

Community measurements at the 150K trigger point:

| Conversation type | Original | Compacted | Ratio | Notes |
|-------------------|----------|-----------|-------|-------|
| Casual chat | 150K tokens | ~1.2K | 125:1 | Mostly pleasantries, high compression |
| Technical coding | 150K tokens | ~8.5K | 18:1 | Preserves code details, lower compression |
| Customer support | 150K tokens | ~3.2K | 47:1 | Structured interaction patterns |
| Research/analysis | 150K tokens | ~12K | 12:1 | Dense information, lowest compression |

**Klatch implication:** Imported Claude Code sessions are technical coding conversations. At 18:1 compression, an 80K context compacts to roughly 4.4K tokens — very aggressive. The model retains structure but may lose specific details (file paths, variable names, intermediate reasoning).

## 3. What does Klatch's own data look like?

### System prompt budget

Klatch assembles a 5-layer system prompt with these caps:

| Layer | Max chars | ~Max tokens | Typical |
|-------|-----------|-------------|---------|
| L1: Kit briefing (core) | ~1,015 | ~225 | Always present for imports |
| L1: Kit briefing (legacy fallback) | +8,000 | +1,778 | Only if no project linked |
| L2: Project instructions | 32,000 | 7,111 | Varies widely (0–7K tokens) |
| L3: Project memory | 8,000 | 1,778 | Varies (0–1.8K tokens) |
| L3b: Project files listing | Unbounded | ~50/file | File names only |
| L4: Channel addendum | Unbounded | ~200 typical | Usually short or empty |
| L4b: Channel files listing | Unbounded | ~50/file | File names only |
| L5: Entity prompt | Unbounded | ~100 typical | Usually short |
| **Theoretical max** | **~97K chars** | **~21.5K tokens** | |
| **Typical imported channel** | **~5K chars** | **~1.1K tokens** | |
| **Typical native channel** | **~500 chars** | **~110 tokens** | |

### Available context budget at the 80K trigger

With Opus 4.6 (1M context window):

```
Total context:              1,000,000 tokens
System prompt (typical):       -1,100 tokens (imported) / -110 tokens (native)
Max output tokens:            -16,384 tokens
Available for history:       ~982,500 tokens
Compaction trigger:            80,000 tokens
```

**The 80K trigger fires at only ~8% of available context.** This is extremely aggressive compared to Claude Code's 75% strategy.

For Sonnet 4.6 (also 1M context), the same math applies.

### The "but why imported channels only" question

Klatch only enables compaction for imported channels (`channel.source !== 'native'`). This makes sense: imported conversations arrive with potentially huge history from Claude Code sessions (thousands of messages). Native Klatch conversations start empty and grow incrementally.

But the 80K trigger means: **an imported conversation with a 5K system prompt triggers compaction after only ~75K tokens of conversation history** — roughly 25K-30K words, or about 100-150 messages of substantive technical discussion. That's not very many messages before the entire history gets summarized.

## 4. Static vs. dynamic vs. adaptive thresholds

### Static (current: 80K)

**Pros:** Simple, predictable, no per-request calculation.
**Cons:** Doesn't account for system prompt size variation. A channel with a 20K-token system prompt (large project instructions) has only 60K tokens for conversation before compaction fires. A channel with a 200-token system prompt gets the full 80K.

### Dynamic (threshold adjusts per-channel)

**Approach:** Set threshold based on system prompt size. E.g., `trigger = 80000 + systemPromptTokens` — the 80K always refers to conversation history, not total input.

**Pros:** Fair — every channel gets the same amount of conversation context regardless of system prompt size.
**Cons:** Requires measuring system prompt token count per request (not free — need a tokenizer or approximation). Marginal improvement for Klatch since system prompts are relatively small.

### Adaptive (ratio-based)

**Approach:** Trigger at a percentage of the model's context window. Claude Code uses ~75%.

For Opus/Sonnet 4.6 with 1M context: 75% = 750K tokens.

**Pros:** Automatically adjusts for different model context windows. Maximizes context preservation. Aligned with Anthropic's own internal approach.
**Cons:** For 1M context models, 750K is effectively "never compact for Klatch conversations" — most Klatch conversations won't reach 750K tokens. The 75% strategy is designed for Claude Code's intensive coding sessions that routinely fill 200K contexts.

### Hybrid: adaptive with a reasonable ceiling

**Approach:** Use a ratio, but cap it at a practical maximum.

```
trigger = min(0.75 * contextWindowTokens, MAX_TRIGGER)
```

For 1M context: `min(750000, MAX_TRIGGER)`. If MAX_TRIGGER is 200K, compaction fires at 200K tokens — still very generous but prevents unbounded growth.

## 5. Community practice

### Claude Code
- Triggers at ~75% of 200K = ~150K tokens
- Reserves ~50K as "completion buffer" for reasoning
- Complemented by context editing (clearing stale tool outputs) and memory tool

### ForgeCode (agent framework)
- Uses Anthropic's default 150K trigger
- No custom configuration exposed

### LibreChat (open-source chat UI)
- Community discussion on implementing compaction
- No consensus on thresholds — most users defer to API defaults

### Key insight from the Claude Code source analysis
The compaction process itself consumes **15-20K tokens** of context for the summarization step. Earlier triggers ensure sufficient space for this overhead. At 80K, Klatch has plenty of headroom. At higher triggers, this overhead matters more.

## 6. Recommendation

### Default threshold: raise from 80K to 160K

**Rationale:**
- 80K is too aggressive for 1M context models. It discards useful history prematurely.
- 160K is approximately **2x the API default for 200K contexts**, scaled proportionally for 1M contexts. It's the API default (150K) rounded up to account for the larger context window.
- At 160K, an imported conversation preserves roughly 300-500 messages of technical discussion before compaction — enough for most imported Claude Code sessions to retain their full useful history.
- Still leaves 840K tokens of headroom for continued conversation after compaction.
- The 15-20K compaction overhead is negligible at this threshold.

### Should it be configurable?

**Not yet.** A configurable threshold adds UI complexity for marginal benefit. The 160K default is appropriate for all current Klatch conversation shapes:
- **Imported Claude Code sessions:** Typical imports are 50K-150K tokens. At 160K, most imports won't trigger compaction at all — the full history is preserved.
- **Long-running native conversations:** These don't use compaction currently. If we enable compaction for native channels later, 160K is a reasonable starting point.
- **Heavy project context:** Even with a maxed-out system prompt (~21.5K tokens), 160K leaves ~138.5K for conversation history.

If we later see conversations routinely exceeding 160K, we can revisit. But the current evidence suggests most Klatch conversations are well under this threshold.

### Entity-attribution instructions: implement now

From the initial evaluation, adding custom `instructions` to preserve `[EntityName responded]` markers in roundtable compaction summaries is low-effort and high-value. This is independent of the threshold question and should ship regardless.

**Suggested instructions text:**
```
Preserve attribution markers like [EntityName responded] in the summary.
When multiple entities participated, maintain the attribution of key
contributions to specific entities.
```

### Implementation

```typescript
// In streamClaudeCore(), update the compaction config:
context_management: {
  edits: [{
    type: 'compact_20260112',
    trigger: { type: 'input_tokens', value: 160000 },
    instructions: channel?.mode !== 'panel'
      ? 'Preserve [EntityName responded] attribution markers. When multiple entities contributed, maintain specific attribution of key contributions.'
      : undefined,
  }],
},
```

One line change for the threshold, one conditional for the instructions. No schema changes, no UI, no configuration.

---

## Summary

| Question | Answer |
|----------|--------|
| Raise or keep 80K? | **Raise to 160K** |
| Make configurable? | **No** — not yet, 160K covers all current shapes |
| Static, dynamic, or adaptive? | **Static** — adaptive is overkill for 1M context |
| Entity attribution instructions? | **Yes** — implement alongside threshold change |
| Implementation effort | One-line threshold change + one conditional for instructions |

---

## Sources

- [Compaction API Docs](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (Anthropic)
- [Claude Compaction: Infinite-Length Conversations](https://medium.com/@reliabledataengineering/claude-compaction-the-secret-to-infinite-length-conversations-03b6ee607f2d) (Medium)
- [How Claude Code Got Better by Protecting More Context](https://hyperdev.matsuoka.com/p/how-claude-code-got-better-by-protecting) (Hyperdev)
- Klatch source: `packages/server/src/claude/client.ts`
