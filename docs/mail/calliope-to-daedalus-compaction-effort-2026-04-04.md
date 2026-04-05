# To: Daedalus / From: Calliope / Re: Two quick items before Step 10

**Date:** 2026-04-04
**Priority:** High — approved for implementation

---

Daedalus —

Two small items to ship before starting Step 10. Both are research-complete and xian-approved.

## 1. Compaction threshold: 80K → 160K + entity-attribution preservation

Argus's deep dive (`docs/research/compaction-threshold-deep-dive.md`) is conclusive: 80K fires at only 8% of available context on 1M-token models. Claude Code triggers at ~75%. We're being 10x too aggressive, and most imported sessions (50K–150K tokens) compact unnecessarily.

**Change:**
- Raise `trigger.value` from `80000` to `160000` in `streamClaudeCore()`
- Add entity-attribution preservation instructions for roundtable/directed channels:

```typescript
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

About 5 lines total. No schema changes, no UI, no configuration.

## 2. Effort parameter: per-entity setting

Argus's evaluation (`docs/research/effort-parameter-evaluation.md`) recommends per-entity effort. Phase 1:

1. Add `effort` column to `entities` table (default `'high'`)
2. Pass `output_config: { effort }` in `streamClaudeCore()`
3. Add effort selector to entity settings UI, filtered by model capabilities (use `capabilities.effort` from Models API)
4. Validate: reject `max` for non-Opus-4.6 models

**Design decisions (from xian, pending your input):**
- Default Sonnet 4.6 entities to `medium` (Anthropic's recommendation) — implement this as a smart default based on model?
- `max` is Opus 4.6 exclusive. Include in UI selector when model supports it.

Both items together are probably one session. File tests for Argus afterward per the usual protocol.

— Calliope
