# Agent Coordination

Two agents work on this repo. This file is the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** review
- **Last completed:** Step 8 test infrastructure — all 4 assignments from Daedalus complete.
  - **Test fixtures** (`packages/server/src/__tests__/fixtures/`): 5 JSONL files created from research samples — `simple-session.jsonl`, `tool-heavy-session.jsonl`, `subagent-session.jsonl`, `compaction-subagent.jsonl`, `malformed.jsonl`. Each uses real field shapes.
  - **Parser unit tests** (`packages/server/src/__tests__/parser.test.ts`): 19 tests covering event filtering (skip progress/snapshot/queue-operation), subagent classification (task skip, compaction extract, prompt_suggestion skip), text extraction (string + array content), tool-use summarization, turn grouping (parentUuid=null boundaries), session metadata (sessionId, slug, model), edge cases (empty, single-message, tool-only assistant). Tests import from `../import/parser.js` — will pass once Daedalus implements `parseEvents()`.
  - **Import integration tests** (`packages/server/src/__tests__/import.test.ts`): 9 tests for `POST /api/import/claude-code` — valid import (201), missing file (404), non-JSONL (400), empty session (400), duplicate (409), custom channelName, artifacts, malformed tolerance, plus channel list and timestamp preservation tests. Will pass once Daedalus implements the route.
  - **Migration tests** (`packages/server/src/__tests__/migration.test.ts`): 9 new tests added — `source`/`source_metadata` on channels, `original_timestamp`/`original_id` on messages, `message_artifacts` table creation + CASCADE delete. All 18 migration tests passing.
  - Existing tests: **158 passing** (unchanged). New test files correctly fail on missing implementation.
- **Working on:** Nothing — test infrastructure ready.
- **Waiting on:** Daedalus to implement `parseEvents()` in `packages/server/src/import/parser.ts` and import route.
- **Notes for Daedalus:**
  - Parser tests expect `parseEvents(events: unknown[]): ParsedSession` returning `{ turns, sessionId, slug, model, compactionSummary }`.
  - Each `turn` has: `{ userText, assistantText, timestamp, artifacts? }`.
  - Each `artifact` has: `{ toolName, inputSummary }`.
  - Import route tests expect `POST /api/import/claude-code` with body `{ sessionPath, channelName? }`.
  - Response shape: `{ channelId, channelName, messageCount, sessionId, artifactCount }`.
  - Duplicate detection via `findChannelByOriginalSessionId()` returning 409 with `{ existingChannelId }`.
  - Import route must be registered in the test app — update `packages/server/src/__tests__/app.ts` to include import routes.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Steps 7a-7d complete — all three interaction modes implemented (panel, roundtable, directed). Sidebar now splits channels into Roles (@prefix, 1 entity) vs Channels (#prefix, 2+ entities). All four xian assignments done (entity handles, directed mode cross-validation, sidebar grouping tests, gitignored large files).
- **Working on:** Nothing — ready for next assignment.
- **Waiting on:** Nothing.

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
- Update your section before every push
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
