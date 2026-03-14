# Daedalus Session Log — 2026-03-14

**Agent:** Daedalus (architecture & implementation)
**Model:** Opus 4.6
**Human:** Xian (product owner)
**Started:** 6:18 AM PT

---

## 06:18 — Session Start (Day 4)

### Product owner feedback on design doc review
PO approved the project-instructions-inheritance design doc (Argus):
1. Design doc looks great
2. Trusts Daedalus's instincts on schema details
3. Same `cwd` = same project (sharing semantics)
4. Auto-populate projects then organize after import (Gall's law)
5. Bump size limit for project instructions

### Theseus Day 4 report review

Read `research/memo-theseus-day4-testing-report.md` and `docs/logs/2026-03-14-0539-theseus-opus-log.md`. Key findings:

**Kit briefing: CONFIRMED WORKING (8¾b verified)**
- Q4 (tool awareness) answered correctly by every branch across all 4 paired tests
- 0% phantom rate — no phantom tools, no confusion about capabilities
- Daedalus unblocked for 8¾a

**Three-factor model (corrects previous diagnosis):**
1. **No project context injection** — affects all imports. Project prompt, memories, docs all exist in ZIP but aren't wired to conversations (no FK)
2. **Compaction loss** — affects long conversations disproportionately. VA DR (365 msgs, 628K chars) lost everything; PPM (12 msgs, 14K chars) retained most context
3. **Knowledge location** — in-chat knowledge survives better than tool-accessed knowledge

Previous hypothesis was "conversation density explains fidelity." Corrected: it's compaction + missing project wiring. **8¾a fixes the worst gaps by injecting project context fresh into system prompt, bypassing compaction entirely.**

**Bug found:** `memories.json` stores project memories as character arrays, not strings. Each memory entry is `["*", "*", "P", "u", "r", ...]` — need to detect and join.

**8¾a elevated to P0.** All data exists in ZIP. Implementation tasks:
- Extract `prompt_template` from `projects.json`
- Parse and join `project_memories` from `memories.json` (fix char array bug)
- Build project association UI in import browser
- Inject project prompt + memories into channel system prompt

### Notable test observations
- VA DR branch: "Well-lit room with good acoustics but no furniture" — perfect metaphor for import without project context
- CoS original independently derived our fidelity framework: "I have all the furniture"
- SecOps branch: "I'm a specialist without broader project context" — best "absent" reporting, zero confabulation
- Tacit knowledge from kit briefing: agents know facts but can't cite the briefing as source. Absorbed but not inspectable.

## 06:30 — Implementation Planning: 8¾a

With kit briefing verified and PO design decisions confirmed, proceeding with 8¾a implementation. Key decisions from PO:
- Same cwd = same project (auto-populate by cwd grouping)
- Auto-populate then organize (Gall's law)
- Bump size limits
- Projects table approach (approved design doc)

Need to review current codebase state, check Argus's branch for any relevant changes, then begin implementation.

## 06:35 — 8¾a Implementation Complete

Built on feature branch `daedalus/project-context-injection`. Full implementation delivered:

### Schema (db/index.ts)
- New `projects` table: `id, name, instructions, source, source_metadata, created_at`
- New `channels.project_id` FK column (nullable — channels can be unlinked)

### Shared types (packages/shared/src/types.ts)
- Added `Project` interface
- Added `projectId` to `Channel` interface

### ZIP extractor (import/claude-ai-zip.ts)
- `ProjectInfo` now includes `promptTemplate` and `docsContent` fields
- `extractFromZip` extracts `prompt_template` from projects.json
- `extractFromZip` extracts project knowledge doc content
- Added `projectMemories` map (project UUID → joined memory string)
- **Fixed memories.json char array bug:** New `joinIfCharArray()` detects and joins `["H","e","l","l","o"]` → `"Hello"`
- Handles both object format (`conversations_memory` + `project_memories`) and legacy array format

### Import routes (routes/import.ts)
- **claude.ai import:** Auto-creates projects from projects.json via `findOrCreateProject`. Links conversations via `project_uuid` → `projectId`.
- **Claude Code import:** Auto-creates projects by `cwd` (PO decision: same cwd = same project). Reads CLAUDE.md + MEMORY.md into project instructions.
- Preview endpoint: now returns `hasPromptTemplate` and `hasDocsContent` per project.

### System prompt assembly (claude/client.ts)
- `buildSystemPrompt` now 4-layer: kit_briefing → project.instructions → channel.system_prompt → entity.systemPrompt
- Project instructions limit: 32K chars (bumped from 4K per PO request)
- Kit briefing: `claudeMd` moved to project layer for linked channels; stays as fallback for legacy imports. `memoryMd` always injected via kit.
- Project lookup via `getProjectForChannel()` in both `streamClaude` and `streamClaudeRoundtable`.

### Project queries (db/queries.ts)
- Full CRUD: `createProject`, `getProject`, `getAllProjects`, `updateProject`, `deleteProject`
- `findOrCreateProject`: idempotent creation by source identity (matches by JSON field in source_metadata)
- `getProjectForChannel`: JOIN lookup for prompt assembly
- `setChannelProject`: link/unlink channels

### Project API (routes/projects.ts)
- `GET /api/projects` — list all projects
- `GET /api/projects/:id` — get single project
- `POST /api/projects` — create project
- `PATCH /api/projects/:id` — update project
- `DELETE /api/projects/:id` — delete (unlinks channels)

### Tests
- 26 new tests in 2 files:
  - `projects.test.ts` (16 tests): CRUD, findOrCreate, channel linking, importSession with projectId
  - `project-injection.test.ts` (10 tests): prompt_template extraction, char array fix, kit briefing behavior with/without project link
- **476 total tests (372 server + 104 client), all passing.**

### Design decisions applied
- Per PO: same cwd = same project (auto-populate by cwd)
- Per PO: auto-populate then organize (Gall's law)
- Per PO: bumped size limit (32K for project instructions)
- Per design doc: projects table, two-field inheritance, prompt assembly order
- Kit briefing deduplication: project instructions NOT duplicated in kit + project layer

## 06:52 — Session Resumed (Context Continuation)

Previous session ran out of context after pushing 8¾a. Resuming to check status and continue.

### Status check
- **8¾a branch:** `daedalus/project-context-injection` — pushed, commit `1cea121`, 476 tests passing
- **Argus:** Pushed 8¾d (Claude Code session browser) on `claude/audit-and-planning-xn2w7`, commit `9b4ee19`. Status: review.
- **Main:** Not yet merged — both 8¾a and 8¾d await review/merge.

### 8¾e: Model Detection Gaps — Complete

Wrote `docs/model-detection-gaps.md` documenting the claude.ai model detection limitation:
- claude.ai exports contain NO model info at any level (conversation, message, project)
- Claude Code exports DO include model via `event.message.model`
- Decision: accept the limitation. Default to channel model. No heuristic inference.
- Future option: manual model selector in browse panel if users request it

This was a documentation-only task. No code changes needed.

## Status

- **8¾a:** Complete, pushed, awaiting review/merge
- **8¾d (Argus):** Complete, pushed, awaiting review/merge
- **8¾e:** Complete (docs only)
- **8¾c:** Blocked on 8¾a merge (builds on projects table)

## Next

- Merge 8¾a to main (needs PO approval)
- Merge 8¾d to main (needs PO approval)
- After merge: 8¾c (claude.ai re-branching)
- Argus: additional tests for 8¾a after merge
