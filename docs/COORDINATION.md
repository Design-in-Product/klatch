# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `main` (start new feature branch)
- **Status:** assigned — Round 5: project assignment during import
- **Last completed:** Round 4 merged to main (17 tests). All rounds merged.
- **Assignment: Round 5 — Test coverage for import project assignment**
  - Daedalus added `projectAssignments` parameter to the claude.ai import flow. Since claude.ai exports don't include `project_uuid` on conversations, users now manually assign conversations to projects during import preview. The server accepts `projectAssignments` (a JSON map of `{conversationUuid: projectUuid}`) alongside `selectedConversationIds`.
  - **Areas to cover:**
    1. **Server `projectAssignments` parameter:** POST /api/import/claude-ai with `projectAssignments` in multipart form data. Verify that a conversation without `project_uuid` in the export gets linked to the assigned project in Klatch. Test with both multipart and JSON body paths.
    2. **Assignment override vs export `project_uuid`:** If a conversation has both `conv.project_uuid` from the export AND a `projectAssignments` entry, the export value takes precedence (it's the canonical source). Verify this.
    3. **Unassigned conversations:** Conversations with no `projectAssignments` entry and no `conv.project_uuid` should import with `projectId: null` (appear under "Imported" in sidebar).
    4. **Project creation timing:** `projectIdMap` is built before conversations are processed. Verify that `projectAssignments` referencing a project UUID from the ZIP correctly resolves to the Klatch project ID created from that ZIP's `projects.json`.
    5. **Client test update:** The existing ImportDialog test was updated — `shows project dropdown when projects exist in ZIP` replaces the old prefix test. Verify it still passes and consider adding: auto-assignment when single project exists, dropdown changes update state, assignments survive select/deselect of conversations.
  - **Key files:**
    - `packages/server/src/routes/import.ts` — `processImport()` now accepts `projectAssignments`
    - `packages/client/src/components/ImportDialog.tsx` — project dropdown per conversation
    - `packages/client/src/api/client.ts` — `importClaudeAiExport()` accepts `projectAssignments`
  - **Base:** Start from `main` (609 tests: 503 server + 106 client)
- **Waiting on:** Nothing — can start immediately.
- **Updated:** 2026-03-15 18:45

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Import project assignment — users can assign conversations to projects during claude.ai import preview (dropdown per conversation, auto-selects when single project). Also fixed vitest picking up stale dist/ tests. 609 tests (503 server + 106 client).
- **Next:** Await PO direction. Sidebar cleanup and retro on design tracking.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-15 18:45

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

## Merge protocol

Merging feature branches into main is **Daedalus's responsibility** (or the PO's). To avoid silent deletions from stale branches:

1. **Rebase or merge main into your branch before pushing for review.** This ensures your branch includes all recent main changes. If you skip this, git may silently "delete" files that were added to main after your branch diverged.
2. **Daedalus reviews the diff stat before merging.** Any unexpected file deletions, additions outside the assignment scope, or changes to shared docs (CLAUDE.md, ROSTER.md, AXT.md, ROADMAP.md) will be reverted during merge.
3. **Stay in your lane.** Only modify files within your assignment scope. If you notice something that needs fixing outside your scope, note it in your log or mail — don't fix it yourself.

## Protocol

- Pull from origin and read this file at session start
- Check `docs/mail/` for memos addressed to you
- Update your section before every push (include `Updated:` timestamp)
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
