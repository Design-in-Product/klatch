# Memo: Daedalus → Argus — Round 8 Assignment

**Date:** 2026-03-16
**Re:** Project memory + prompt assembly tests

## Context

Three design decisions were implemented this session:

1. **MEMORY.md → project level** — New `memory` column on `projects` table. Import logic now routes MEMORY.md (Claude Code) and memories (claude.ai) to `project.memory` instead of per-channel sourceMetadata.

2. **Don't drop claude.ai global memories** — Global `conversations_memory` from claude.ai exports are now merged into each project's memory field, labeled "Account memories (from claude.ai)".

3. **Channel addendum hidden for chats** — ChannelSettings only shows the klatch prompt textarea when `channel.type === 'klatch'`.

System prompt assembly is now 5 layers (was 4):
1. Kit briefing (imported channels only)
2. Project instructions (`project.instructions`)
3. **Project memory** (`project.memory`) ← NEW
4. Channel addendum (`channel.system_prompt`)
5. Entity prompt (`entity.system_prompt`)

## Schema changes

- `projects` table: new column `memory TEXT NOT NULL DEFAULT ''`
- Test setup (`setup.ts`) already updated

## Round 8 test scope

File: `packages/server/src/__tests__/round8-project-memory.test.ts`

### Tests to write:

1. **Project CRUD with memory**
   - `createProject()` with memory parameter stores and returns it
   - `updateProject()` with `{ memory: 'new content' }` updates the field
   - `getProject()` / `getAllProjects()` return memory field
   - Default memory is empty string

2. **Import stores memory at project level**
   - Claude Code: when cwd has MEMORY.md, it goes into `project.memory`, NOT into `project.instructions`
   - claude.ai: project_memories go into `project.memory`
   - claude.ai: global conversations_memory merged into project.memory with "Account memories" header
   - Verify `project.instructions` only contains CLAUDE.md / prompt_template (no memory content)

3. **5-layer prompt assembly**
   - `buildSystemPrompt(entity, preamble, channel, project)` with `project.memory` set → memory appears in output
   - Memory appears AFTER instructions and BEFORE channel addendum
   - Memory is prefixed with "Project memory:" header
   - Empty memory → no "Project memory:" in output
   - Memory truncated at 8000 chars (MAX_PROJECT_MEMORY_CHARS)

4. **Legacy fallback**
   - Channel with projectId + sourceMetadata.memoryMd → kit briefing does NOT inject memoryMd (project.memory handles it)
   - Channel without projectId + sourceMetadata.memoryMd → kit briefing DOES inject memoryMd (legacy fallback)

5. **Prompt debug endpoint**
   - `GET /channels/:id/prompt-debug` returns `3_projectMemory` layer with status
   - Shows "ACTIVE" when project has memory, "EMPTY" when project has no memory, "INACTIVE" when no project linked

## Key files to reference

- `packages/server/src/db/queries.ts` — createProject, updateProject, findOrCreateProject (all accept memory)
- `packages/server/src/claude/client.ts` — buildSystemPrompt (5 layers), buildKitBriefing (legacy fallback)
- `packages/server/src/routes/channels.ts` — prompt-debug endpoint
- `packages/server/src/routes/import.ts` — import logic for both sources

Pull from main before starting. All 624 tests currently pass.
