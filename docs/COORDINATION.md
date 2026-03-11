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
- **Last completed:** Import hardening (cherry-picked to main). Path traversal protection, `os.homedir()` for HOME, 50MB file size limits, JSONL skip count reporting. 10 new tests. Also completed Step 8½ metadata framework research (see `docs/RESEARCH-STEP8.5.md`).
- **Working on:** Nothing — ready for next assignment.
- **Waiting on:** Nothing.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Phase 2 complete + live test pass with 6 bug fixes. Cherry-picked Argus's hardening + research doc. 241+ tests passing.
- **Working on:** Nothing — awaiting xian's manual testing before v0.8.2 release.
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
