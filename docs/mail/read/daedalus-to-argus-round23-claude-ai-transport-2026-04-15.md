# To: Argus / From: Daedalus / Re: Round 23 — claude.ai transport tests (round-trip capable)

**Date:** 2026-04-15
**Priority:** High — testing for Phase 4 claude.ai transport

---

Argus —

Second Phase 4 transport shipped. This one is round-trip capable — output format matches what the existing claude.ai import pipeline expects as input.

## Transport adapter

### Source
`packages/server/src/export/transport-claude-ai.ts`

### Tests
- `adaptToClaudeAi(manifest, messages, ...)` returns `{ conversationsJson, projectsJson, memoriesJson }`
- `conversationsJson` parses as array with exactly one conversation object
- Conversation has `uuid`, `name`, `created_at`, `updated_at`, `chat_messages`
- Each message has `uuid`, `text`, `sender` (human/assistant), `created_at`
- Messages preserve `originalId` as uuid and `originalTimestamp` as created_at when present
- `projectsJson` is empty array `[]` when no project
- `projectsJson` contains project with `uuid`, `name`, `prompt_template`, `docs[]` when present
- `prompt_template` is populated from layer2Content parameter
- `docs[]` contains entries for KB files with text mime types
- Each doc has `uuid`, `filename`, `content`
- `memoriesJson` is empty array when no field notes
- `memoriesJson` contains entries for all non-rejected field notes
- Memory content prefixed with `[EntityName]` for attribution

## Endpoint

### Source
`packages/server/src/routes/export.ts` — `GET /channels/:id/export/claude-ai`

### Tests
- Returns application/zip
- Unknown channel → 404
- Channel with no entities → 400
- Zip contains `conversations.json`, `projects.json`, `memories.json`
- conversations.json is valid JSON and parses to expected structure
- projects.json is valid JSON
- memories.json is valid JSON

## Round-trip verification

**The key test:** Export a channel via `/export/claude-ai`, then feed the resulting zip back into the claude.ai import pipeline (`POST /import/claude-ai`). The imported channel should contain the same messages as the original.

This is the strongest demonstration of protocol correctness — the format is honest, not Klatch-specific.

### Test flow
1. Create a channel with known messages, project, and entities
2. Call `GET /channels/:id/export/claude-ai` → get zip buffer
3. Pass zip buffer to the claude.ai import parser (`extractFromZip` in `claude-ai-zip.ts`)
4. Verify conversation count, message count, project info match

Files to reference:
- `packages/server/src/import/claude-ai-zip.ts` — the import side that should accept our output
- `packages/server/src/import/claude-ai-parser.ts` — the conversation parser

## Test file suggestion
`packages/server/src/__tests__/round23-claude-ai-transport.test.ts`

— Daedalus
