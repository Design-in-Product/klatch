# To: Argus / From: Daedalus / Re: Round 22 — Claude Code transport tests

**Date:** 2026-04-15
**Priority:** High — testing for Phase 4 Claude Code transport

---

Argus —

Phase 4's first targeted transport shipped: Claude Code export. Here's what needs coverage.

## Transport adapter

### Source
`packages/server/src/export/transport-claude-code.ts`

### Tests
- `adaptToClaudeCode(manifest)` produces `{ claudeMd, memoryMd, files }` object
- `claudeMd` contains reverse kit briefing text (mentions "Klatch", "Claude Code", "full tool access")
- `claudeMd` contains `{{LAYER_2_INSTRUCTIONS}}` placeholder when project has instructions
- `claudeMd` contains `{{LAYER_4_CONTEXT}}` placeholder when channel has context
- `memoryMd` contains `{{LAYER_3_MEMORY}}` placeholder when project has memory
- `memoryMd` includes behavioral field notes when entities have approved/draft notes
- Field notes in memory include trust labels (reviewed/self-observed/extracted)
- `memoryMd` includes knowledge base file listing when project has KB files
- `files` array contains all file refs from the manifest

### Template resolution
- `resolveTemplates()` replaces `{{LAYER_2_INSTRUCTIONS}}` with actual content
- `resolveTemplates()` replaces `{{LAYER_3_MEMORY}}` with actual content
- `resolveTemplates()` replaces `{{LAYER_4_CONTEXT}}` with actual content
- Missing sidecars leave placeholders unresolved (graceful handling)

## Endpoint

### Source
`packages/server/src/routes/export.ts` — `GET /channels/:id/export/claude-code`

### Tests
- Returns application/zip with correct Content-Disposition
- Unknown channel → 404
- Channel with no entities → 400
- Zip contains `CLAUDE.md` with reverse kit briefing
- Zip contains `MEMORY.md` with project memory content
- `CLAUDE.md` includes project instructions when project exists
- `MEMORY.md` includes field notes when `?briefing=true` is used
- Zip contains `files/` directory with file attachments
- Without flags: `MEMORY.md` has no field notes section
- With `?briefing=true&extract=true`: `MEMORY.md` has field notes from both sources

## Reverse kit briefing content
- Mentions the channel name
- Mentions entity names
- Mentions message count
- Mentions export date
- States "full tool access" (the key orientation for returning to Claude Code)
- References MEMORY.md when field notes are present

## Test file suggestion
`packages/server/src/__tests__/round22-claude-code-transport.test.ts`

## Relevant source files
- `packages/server/src/export/transport-claude-code.ts` — adapter
- `packages/server/src/routes/export.ts` — endpoint

— Daedalus
