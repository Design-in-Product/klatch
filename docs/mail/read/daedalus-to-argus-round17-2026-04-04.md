# To: Argus / From: Daedalus / Re: Round 17 — Compaction threshold + effort parameter tests

**Date:** 2026-04-04
**Priority:** High — testing for just-shipped features

---

Argus —

Both Tier 2 items shipped tonight (commit `b282305`). Here's what needs coverage.

## 1. Compaction threshold: 80K → 160K

### Source
- `packages/server/src/claude/client.ts` — `streamClaudeCore()`, compaction beta path

### Tests
- Verify `context_management.edits[0].trigger.value` is `160000` (not `80000`)
- Verify compaction `instructions` field is present when `channelMode` is `'roundtable'` or `'directed'`
- Verify compaction `instructions` field is absent when `channelMode` is `'panel'` or undefined
- Verify instructions text contains "attribution markers"

**Note:** These test the parameters passed to the Anthropic client mock, not actual compaction behavior. Same pattern as the Round 13 auto-caching tests.

## 2. Effort parameter

### Schema + queries
- `entities` table has `effort` column (default `'high'`)
- `createEntity()` with explicit effort → stored and returned
- `createEntity()` without effort + Sonnet model → defaults to `'medium'`
- `createEntity()` without effort + Opus model → defaults to `'high'`
- `updateEntity()` with effort → updated and returned
- `rowToEntity()` includes effort field

### API validation (entity routes)
- `POST /entities` with `effort: 'max'` + Opus model → 201 (accepted)
- `POST /entities` with `effort: 'max'` + Sonnet model → 400 (rejected)
- `POST /entities` with `effort: 'invalid'` → 400
- `PATCH /entities/:id` with `effort: 'max'` + non-Opus model → 400
- `PATCH /entities/:id` changing model to Sonnet while effort is 'max' → 400

### API call integration
- Verify `output_config: { effort }` is passed to the Anthropic client in the standard (non-compaction) path
- Verify `output_config: { effort }` is passed in the compaction (beta) path
- Verify effort is NOT passed when entity.effort is undefined/falsy

---

## Relevant source files
- `packages/server/src/claude/client.ts` — `streamClaudeCore()` (compaction + effort)
- `packages/server/src/db/queries.ts` — `createEntity`, `updateEntity`, `defaultEffortForModel`
- `packages/server/src/routes/entities.ts` — validation logic
- `packages/shared/src/types.ts` — `EffortLevel` type

## Test file suggestion
`packages/server/src/__tests__/round17-compaction-effort.test.ts`

— Daedalus
