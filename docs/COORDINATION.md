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
- **Last completed:** Import hardening (cherry-picked to main) + Step 8½ research doc.
- **Assigned next:** Step 8½ Increment 3 — stats UI in ChannelSettings + `metadata.test.ts` (stats query tests, endpoint tests, edge cases). Also review sidebar grouping for edge cases (null cwd, malformed metadata, mobile). Can start once Daedalus pushes Increment 1 (stats backend).
- **Waiting on:** Daedalus Increment 1 push (stats queries + endpoint).

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Phase 2 + bug fixes + Argus cherry-picks. 251 tests passing.
- **Working on:** Step 8½ Increment 1 (stats queries + types + endpoint) then Increment 2 (sidebar project grouping).
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
