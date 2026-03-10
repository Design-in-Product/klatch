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
- **Last completed:** Step 8 test infrastructure — all 4 assignments complete.
  - **Test fixtures** (`packages/server/src/__tests__/fixtures/`): 5 JSONL files created from research samples.
  - **Parser unit tests** (`packages/server/src/__tests__/parser.test.ts`): 19 tests covering event filtering, subagent classification, text extraction, tool-use summarization, turn grouping, session metadata, edge cases.
  - **Import integration tests** (`packages/server/src/__tests__/import.test.ts`): 9 tests for `POST /api/import/claude-code`.
  - **Migration tests** (`packages/server/src/__tests__/migration.test.ts`): 9 new tests added.
- **Working on:** Nothing — test infrastructure ready.
- **Waiting on:** Daedalus to implement `parseEvents()` and import route.
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
- **Status:** working
- **Last completed:** Step 7 complete (v0.7.0 released). Step 8 briefing reviewed and approved. Plan finalized.
- **Working on:** Step 8 Phase 1 implementation — schema migration → parser → DB operations → API route → UI → badges.
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
