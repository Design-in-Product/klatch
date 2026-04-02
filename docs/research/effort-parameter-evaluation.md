# Effort Parameter Evaluation (Round 13, C2)

**Filed by:** Argus
**Date:** 2026-04-02
**GitHub issue:** #17
**Status:** Research complete — design proposal below

---

## Current State

Klatch does not currently use the effort parameter. All API calls use the default (`high` effort) with `thinking: { type: 'adaptive', display: 'omitted' }`.

## Research Findings

### 1. Which models support which effort levels?

| Model | low | medium | high (default) | max |
|-------|-----|--------|----------------|-----|
| Claude Opus 4.6 | Yes | Yes | Yes | Yes |
| Claude Sonnet 4.6 | Yes | Yes | Yes | No (error) |
| Claude Opus 4.5 | Yes | Yes | Yes | No |

**Key:** `max` is Opus 4.6 exclusive. Sending `max` to other models returns an error.

The Models API (`GET /v1/models`) returns supported effort levels in `capabilities.effort`, so Klatch can dynamically discover which levels are available per model. Klatch's Models API route already extracts this (see `packages/server/src/routes/models.ts` line 58–63).

### 2. Observable effects of effort levels

Effort is a **behavioral signal**, not a strict token budget. It affects:

- **Text responses and explanations** — lower effort = shorter, more direct
- **Tool calls** — lower effort = fewer calls, less preamble, terse confirmations
- **Extended thinking** — at `high`/`max`, Claude almost always thinks. At `low`, it may skip thinking for simpler problems.

**Performance characteristics:**

| Level | Token spend | Latency | Quality | Best for |
|-------|------------|---------|---------|----------|
| `max` | Highest | Highest | Highest | Deepest reasoning, most thorough analysis |
| `high` | High | High | High | Complex reasoning, agentic tasks (current default) |
| `medium` | Moderate | Moderate | Good | Balanced — agentic coding, tool workflows |
| `low` | Lowest | Lowest | Adequate | Simple tasks, subagents, high-volume |

**Anthropic's recommendation for Sonnet 4.6:** Use `medium` as the default, not `high`. Sonnet at `high` effort can have unexpected latency for the speed tier.

### 3. Design proposal: Where does effort belong in Klatch?

**Recommendation: Per-entity effort configuration.**

Rationale:
- Effort maps naturally to entity identity. A "quick assistant" entity should use `low` effort; a "deep analyst" entity should use `high` or `max`.
- Per-message effort is too granular — users shouldn't need to think about this for every message.
- Per-channel effort is too coarse — roundtable channels have multiple entities that should use different effort levels.

**Proposed schema change:**

```sql
ALTER TABLE entities ADD COLUMN effort TEXT DEFAULT 'high';
```

Valid values: `'low'`, `'medium'`, `'high'`, `'max'`.

**UI placement:** Entity settings panel, alongside model selection. Show only effort levels supported by the entity's selected model (use `capabilities.effort` from Models API).

**Validation:** Reject `max` for non-Opus-4.6 models at the API layer. The Models API already provides the capability data to drive this.

### 4. How does effort interact with adaptive thinking?

For Opus 4.6 and Sonnet 4.6, effort **replaces** `budget_tokens` as the recommended way to control thinking depth:

- `budget_tokens` is **deprecated** on Opus 4.6 and Sonnet 4.6 (still accepted, will be removed in future model release)
- Klatch currently uses `thinking: { type: 'adaptive', display: 'omitted' }` — this is correct and compatible with effort
- When effort is set alongside adaptive thinking:
  - `high`/`max`: Claude almost always thinks deeply
  - `medium`: Claude thinks when needed, moderate depth
  - `low`: Claude may skip thinking for simpler problems

**Klatch action:** Pass the entity's effort level in `output_config.effort` alongside the existing `thinking` parameter. No changes needed to the thinking configuration.

**API parameter location:** Effort goes in `output_config`, not at the top level:

```typescript
const stream = client.messages.stream({
  model,
  max_tokens: 16384,
  thinking: { type: 'adaptive', display: 'omitted' },
  output_config: { effort: entity.effort || 'high' },
  system: systemPrompt,
  messages: history,
});
```

---

## Implementation Plan

### Phase 1: Entity-level effort (minimal)
1. Add `effort` column to `entities` table (default `'high'`)
2. Pass `output_config: { effort }` in `streamClaudeCore()`
3. Add effort selector to entity settings UI (filtered by model capabilities)
4. Validate: reject `max` for non-Opus-4.6 models

### Phase 2: Smart defaults (optional)
1. Default Sonnet 4.6 entities to `medium` effort (per Anthropic recommendation)
2. Default subagent/utility entities to `low` effort
3. Show estimated cost/speed impact in UI

### Phase 3: Dynamic effort (future)
1. Per-message effort override via message input (e.g., "think harder" prefix)
2. Automatic effort escalation: start low, escalate on complex queries

---

## Summary

| Question | Answer |
|----------|--------|
| Where does effort belong? | Per-entity setting |
| Default for Opus 4.6? | `high` (current behavior) |
| Default for Sonnet 4.6? | `medium` (Anthropic recommendation) |
| Interaction with thinking? | Compatible — effort controls thinking depth via adaptive mode |
| `budget_tokens` status? | Deprecated on Opus/Sonnet 4.6; don't use |
| `max` availability? | Opus 4.6 only |

---

## Sources

- [Effort API Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Adaptive Thinking Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- Klatch source: `packages/server/src/claude/client.ts`, `packages/server/src/routes/models.ts`
