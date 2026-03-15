# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `main` (start new feature branch)
- **Status:** assigned — Round 3 test expansion
- **Last completed:** Round 2 import hardening tests merged to main (2026-03-14). 22 tests, reviewed ✅.
- **Assignment: Round 3 — Test expansion across four areas**
  - **Goal:** Broaden test coverage beyond import into core infrastructure: Claude Code HTTP import, compaction, entities, and streaming.
  - **Areas to cover:**
    1. **Claude Code import via HTTP:** POST /api/import/claude-code with JSONL session path → verify channel creation, source metadata, project linking by cwd. Test with missing file path, non-existent file, invalid JSONL. Mirror the multipart pattern from Round 2 but for the JSONL path-based endpoint.
    2. **Compaction API:** Test the continuation flow for imported channels that use `compaction_state`. Verify compaction summary is stored, subsequent messages include compacted context, compaction triggers at threshold. Key file: `packages/server/src/claude/client.ts` (compaction logic).
    3. **Entity CRUD edge cases:** Entity assignment to channels (add/remove), mode switching validation (panel/roundtable/directed), entity handle uniqueness, max entities per channel (5), entity deletion when assigned to channels. Key files: `packages/server/src/routes/entities.ts`, `packages/server/src/db/queries.ts`.
    4. **Streaming route tests:** SSE connection lifecycle, abort mid-stream (APIUserAbortError handling), race condition (stream completes before SSE connects → DB check fallback). Key files: `packages/server/src/routes/messages.ts`, `packages/server/src/claude/client.ts`.
  - **Key files:**
    - `packages/server/src/routes/import.ts` — Claude Code import endpoint
    - `packages/server/src/claude/client.ts` — compaction + streaming
    - `packages/server/src/routes/messages.ts` — SSE streaming routes
    - `packages/server/src/routes/entities.ts` — entity CRUD
    - `packages/server/src/db/queries.ts` — entity + channel queries
  - **Base:** Start from `main` (558 tests passing: 453 server + 105 client)
- **Waiting on:** Nothing — can start immediately.
- **Updated:** 2026-03-14 21:34

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Merged Argus Round 2 (22 tests). Fixed import error handling + json_valid guards. Updated roadmap with sidebar nav, project spaces, entity model. 558 tests (453 server + 105 client).
- **Next:** Await PO direction.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-14 21:34

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
