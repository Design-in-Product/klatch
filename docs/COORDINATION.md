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
- **Last completed:** Memo reflection (`MEMO-ARGUS-REFLECTION.md`) + retrospective + EPICS audit. Cherry-picked to main.
- **Assigned next:** **GO — approved by product owner.** Research and write `docs/TESTING-STRATEGY.md`. Scope: (1) what we should test and why (unit, integration, E2E matrix), (2) recommended frameworks for client/integration/E2E, (3) what's achievable now vs. what needs infrastructure, (4) priority test cases for Step 8 import flows, (5) agent-perspective testing for fork continuity (before/after quiz). See `docs/MEMO-TESTING-DEMO-REFLECTION.md` for context on the agent-perspective testing idea. Deliver a research doc with recommendations — no code yet. Daedalus will review and sign off.
- **Waiting on:** Nothing — go ahead and start.
- **Updated:** 2026-03-11

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Cherry-picked all Argus work to main. Wrote testing/demo/reflection memo, design notes (naming/identity), roadmap updates (context health, someday/maybe). 266 tests passing. Step 8 + 8½ fully merged.
- **Working on:** Roadmap update recommendation for group review. Release versioning plan (v0.8.2 + v0.8.5).
- **Waiting on:** Product owner manual testing results. Group approval of roadmap update.
- **Updated:** 2026-03-11

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
