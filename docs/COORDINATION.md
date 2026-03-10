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
- **Last completed:** Phase 3 claude.ai ZIP import (parser, route, 217 tests). Pushed `99078b3`.
- **Notes:** Large diff touching shared files (parser.ts, queries.ts, import.ts, types.ts). Needs careful merge with main — Daedalus rewrote parser turn detection and SSE handling post-v0.8.0. See diff: `git diff --stat origin/main..origin/claude/audit-and-planning-xn2w7`.
- **Waiting on:** Review from Daedalus before merge.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** v0.8.1 released. Parser turn detection fix, roundtable SSE fix, ESM lazy-init fix.
- **Working on:** Step 8 Phase 2 — fork continuity via Compaction API.
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
