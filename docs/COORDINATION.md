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
- **Assigned next:** Validation pass — rebase branch on main, run full suite, test both import formats (Claude Code JSONL + claude.ai ZIP), flag anything broken. Then ready for next assignment.
- **Waiting on:** Nothing — can start immediately.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Phase 2 Increment 1 — imported channels now talkable (history cap + empty-content filter). SDK upgraded to v0.78.0. 233 tests passing.
- **Working on:** Phase 2 Increment 2 — Compaction API integration (context_management, compaction-aware history builders).
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
