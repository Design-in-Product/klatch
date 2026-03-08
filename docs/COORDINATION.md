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
- **Last completed:** Client test infrastructure (React Testing Library + jsdom), root `test:watch`, 101 total tests passing
- **Waiting on:** Nothing — ready for next assignment
- **Notes for implementation agent:** Phase 6b + 6c entity tests are green against current main. Phase 6d multi-entity streaming has 3 `test.todo()` stubs defining the contract: response must include `assistants` array with `{ assistantMessageId, entityId, model }` per entity. When you land 6d, I'll flesh those out. Client test infra is ready — `MessageInput` has 6 smoke tests proving the plumbing works.

### Implementation Agent (features & infrastructure)
- **Branch:** (update when claiming work)
- **Status:** unknown
- **Last completed:** Step 6a + 6b (validation hardening, entities table, CRUD API)
- **Waiting on:** unknown
- **Notes for test agent:** (update here)

## Signals

Use these status values:
- **available** — done with current work, ready for next task
- **working** — actively building, don't wait on me
- **blocked** — need something before I can continue (describe in Notes)
- **review** — work is pushed, requesting review before merge

## Protocol

- Read this file at session start
- Update your section before every push
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
