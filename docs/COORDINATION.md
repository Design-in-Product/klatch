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
- **Last completed:** Phase 3 claude.ai ZIP import. Merged to main (cherry-picked new files, adapted to existing types/queries). Also completed research on permission toggling for chats (filed for later).
- **Assigned next:** Either (1) Validation pass — rebase on main, run full suite, test both import formats; or (2) Phase 2 Increment 3 — context loading UI in ChannelSettings (hints for imported channels, "Load CLAUDE.md" button, "Use session summary" button, GET /api/channels/:id/context-file endpoint). Check with xian for preference.
- **Waiting on:** Nothing — can start immediately.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Phase 2 Increments 1+2 — imported channels talkable + Compaction API integrated. Beta API with context_management, compaction-aware history builders, compaction_state column. 236 tests passing.
- **Working on:** Phase 2 Increment 3 — context loading (CLAUDE.md import, hints in ChannelSettings).
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
