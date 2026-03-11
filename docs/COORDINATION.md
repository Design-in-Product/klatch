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
- **Last completed:** Step 8½ Increment 3 (stats UI + metadata tests, 15 new tests). Cherry-picked to main.
- **Assigned next:** Read `docs/MEMO-TESTING-DEMO-REFLECTION.md` and reflect on the prompts there. Then discuss roadmap + step 9 gameplan with the team.
- **Waiting on:** Nothing.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Cherry-picked Argus Increment 3 to main. Wrote testing/demo/reflection memo. 266 tests passing (260 server + 6 client). Step 8 + 8½ fully merged.
- **Working on:** Nothing — awaiting manual testing + roadmap discussion.
- **Waiting on:** Product owner manual testing, then roadmap discussion.

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
