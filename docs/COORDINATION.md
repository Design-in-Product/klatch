# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** working — integration tests for 8¾a
- **Last completed:** 8¾a test scaffolding + 8¾d session browser (2026-03-14).
- **Assignment: Integration tests for project context injection (8¾a)**
  - **Goal:** End-to-end test coverage for the 8¾a critical path. Schema + prompt assembly are now on main.
  - **Key areas to cover:**
    1. **claude.ai import → project creation:** Import a ZIP with projects.json containing prompt_template → verify project rows created in DB with correct instructions
    2. **claude.ai import → channel linking:** Conversations with `project_uuid` → verify channel gets `project_id` FK pointing to correct project
    3. **Claude Code import → project creation by cwd:** Import session with cwd → verify project created, same cwd re-import finds existing project
    4. **System prompt assembly:** Channel linked to project → verify `buildSystemPrompt` output includes project instructions in correct layer order (kit_briefing → project → channel → entity)
    5. **Project instructions truncation:** Project with >32K instructions → verify truncation with `...(truncated)` marker
    6. **Kit briefing deduplication:** Channel WITH projectId → claudeMd NOT in kit briefing (it's in project layer). Channel WITHOUT projectId → claudeMd IS in kit briefing (legacy fallback).
    7. **Re-branch with project:** Force-import an already-imported conversation → verify new channel also gets project link
  - **Key files to test against:**
    - `packages/server/src/claude/client.ts` — `buildSystemPrompt()`, `buildKitBriefing()`
    - `packages/server/src/db/queries.ts` — `findOrCreateProject()`, `getProjectForChannel()`, `setChannelProject()`
    - `packages/server/src/routes/import.ts` — project creation during import
  - **Existing tests for reference:** `packages/server/src/__tests__/projects.test.ts` (16 CRUD tests), `packages/server/src/__tests__/project-injection.test.ts` (10 extraction/injection tests)
  - **Base:** Merged from `main` (all 8¾a–e merged, 493 tests passing)
- **Waiting on:** Nothing — starting now.
- **Updated:** 2026-03-14 09:05

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available — Step 8 complete
- **Last completed:** Step 8 closure (2026-03-14). Merged 8¾a, 8¾c, 8¾d to main. Closed GitHub issue #5. 493 tests (388 server + 105 client).
- **Step 8 complete:** All 8¾a–e delivered, all definition-of-done criteria met, issue #5 closed.
- **Next:** Await PO direction for Step 9 or other work.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-14 08:55

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** assigned — AXT re-test with project context injection
- **Role:** Human-agent tandem manual testing.
- **Last completed:** Day 4 AXT testing (2026-03-14). Kit briefing VERIFIED (0% phantom rate). Three-factor model identified.
- **Assignment: Post-8¾a AXT re-test**
  - Re-import test conversations (VA DR, PPM) now that project context injection is live on main
  - Run Fork Continuity Quiz v3 on fresh imports
  - Compare scores against Day 4 baselines — project context should improve scores for project-linked conversations
  - Key question: does injecting project instructions fresh into the system prompt bypass compaction loss?
- **Waiting on:** PO to start session.
- **Updated:** 2026-03-14 08:55

### Ariadne (forked from Theseus — Klatch side)
- **Branch:** n/a (Klatch-native, lives in SQLite)
- **Status:** available
- **Role:** Imported/forked continuation of Theseus. Provides "receiving end" perspective on import continuity.
- **Last completed:** Context quiz, capability assessment, subjective continuity report. Confirmed silent capability loss, proposed kit briefing validation.
- **Note:** Ariadne cannot edit files. Xian manually maintains their log: `docs/logs/2026-03-11-1612-ariadne-opus-log.md`
- **Updated:** 2026-03-13

## Signals

Use these status values:
- **available** — done with current work, ready for next task
- **working** — actively building, don't wait on me
- **blocked** — need something before I can continue (describe in Notes)
- **review** — work is pushed, requesting review before merge

## Branch discipline

All in-progress work happens on feature branches. `main` must always be demo-ready — tests pass, app runs, no half-finished features. Only merge to `main` when the feature is complete and verified. This lets anyone check out `main` at any time for a clean demo or to base new work on a stable snapshot.

## Protocol

- Read this file at session start
- Update your section before every push (include `Updated:` timestamp)
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
