# Effort Parameter Evaluation

**Filed by:** Argus
**Date:** 2026-03-28
**Source:** Round 13 Part C2 (Daedalus assignment), Calliope intel sweep cross-ref
**Status:** Research complete — ready for Daedalus implementation

---

## 1. Model Support and Effort Levels

| Model | Effort Levels | Notes |
|-------|--------------|-------|
| `claude-opus-4-6` | `low`, `medium`, `high`, `max` | Full support, GA. Only model supporting `max`. |
| `claude-sonnet-4-6` | `low`, `medium`, `high` | Full support, GA. `max` returns validation error. |
| `claude-opus-4-5` | `low`, `medium`, `high` | Requires `effort-2025-11-24` beta header (legacy). |
| `claude-haiku-4-5` | **Not supported** | Effort parameter ignored or errors. |

**API shape** — effort is passed via `output_config`, not top-level:

```typescript
const response = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 16384,
  output_config: { effort: "medium" },
  messages: [...]
});
```

SDK type: `OutputConfig.effort: 'low' | 'medium' | 'high' | 'max' | null`.

## 2. Observable Effects

### Quality
- `high` is the default (equivalent to omitting the parameter).
- `medium` on Opus 4.5 matched Sonnet 4.5's best SWE-bench score while using 76% fewer output tokens.
- `max` (Opus 4.6 only) provides deepest reasoning with no constraint on token spending.
- `low` produces significant quality reduction but works for classification, lookups, and high-volume tasks.

### Latency
- Effort directly controls token spend, the primary latency driver.
- `low`: fewer tool calls, terser responses, skips preamble.
- `max`: can be dramatically slower — 10x+ tokens compared to `low` on complex prompts.

### Cost
- No separate pricing tier. Standard per-token rates, but the model generates fewer/more tokens.
- The token difference between `low` and `max` can be 10x+ on complex prompts.
- Effort is a "real cost lever, not just a quality preference."

**Key insight:** Effort is a *behavioral signal*, not a strict token budget. Even at `low`, Claude will still think on sufficiently difficult problems — it just thinks less.

## 3. Design Proposal for Klatch

**Recommendation: Per-entity default + per-message override (future).**

### Per-entity (primary, implement first)
- Add `effort` field to `Entity` type and `entities` DB table. Default: `'high'`.
- Natural home: entities already carry `model` and `systemPrompt` — effort is part of an entity's "personality." A quick-responder entity could be `low`, a deep-analysis entity stays at `high`.
- For Haiku entities: disable/hide the control (not supported).
- For non-Opus-4.6 entities: hide `max` option.

### Per-message override (future, lower priority)
- Allow user to override effort when sending a message (like picking a model per-message).
- Implementation: small dropdown or segmented control near send button, applies to single request only.

### UI placement
- **Entity settings panel** (alongside model and system prompt): "Effort" dropdown with `low` / `medium` / `high`, plus `max` when model is `claude-opus-4-6`. Brief tooltip explaining the tradeoff.
- **Message composer** (future): Small effort indicator near send button. Power-user feature.

### Code integration point
In `packages/server/src/claude/client.ts`, `streamClaudeCore()` (line ~486) builds the API call. Add `output_config: { effort: entity.effort || 'high' }` to both beta and standard `messages.stream()` calls. Neither currently passes `output_config`.

## 4. Effort vs. Adaptive Thinking Interaction

**They complement each other — no conflict.**

Klatch uses `thinking: { type: 'adaptive', display: 'omitted' }` in `streamClaudeCore`. Here's how they interact:

| Effort Level | Thinking Behavior with `adaptive` |
|-------------|-----------------------------------|
| `max` | Always thinks, no depth constraints. Opus 4.6 only. |
| `high` (default) | Almost always thinks. Deep reasoning on complex tasks. |
| `medium` | Moderate thinking. May skip for simple queries. |
| `low` | Minimal thinking. Skips for simple tasks. |

Adaptive thinking lets Claude *decide whether* to think. Effort tells Claude *how eagerly* to think and spend tokens. Anthropic's official recommendation: "Combine effort with adaptive thinking for the best experience."

**Note:** `budget_tokens` is deprecated on 4.6 models. Effort is its replacement. Klatch correctly uses adaptive thinking (not `budget_tokens`), so adding effort is the clean path.

## Sources

- [Effort - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Adaptive Thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Models Overview - Claude API Docs](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Extended Thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
