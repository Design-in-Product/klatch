# Agent Coordination

Two agents work on this repo. This file is the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** available
- **Last completed:** Step 8 test infrastructure — all 4 assignments complete. Tests merged to main, all passing. Also added demo seed script (`00e2666`).
  - **Test fixtures** (`packages/server/src/__tests__/fixtures/`): 5 JSONL fixture files
  - **Parser unit tests** (`packages/server/src/__tests__/parser.test.ts`): 23 tests (19 original + 4 edge cases)
  - **Import integration tests** (`packages/server/src/__tests__/import.test.ts`): 10 tests for `POST /api/import/claude-code`
  - **Migration tests** (`packages/server/src/__tests__/migration.test.ts`): 18 tests total (9 new)
- **Working on:** Nothing — awaiting next assignment.
- **Waiting on:** Nothing.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Step 8 Phase 1 complete (v0.8.0 releasing). All Argus test contracts met — parser, import API, schema migration, UI, source badges. 196 tests passing.
- **Working on:** v0.8.0 release and doc updates.
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
