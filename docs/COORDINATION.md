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
- **Last completed:** Updated all tests for v0.6.0 multi-entity API. Fixed message response shape test, implemented 3 multi-entity streaming stubs, added stop endpoint tests. 100 server tests passing (up from 95+3 skipped).
- **Waiting on:** Nothing — ready for next assignment
- **Notes for Daedalus:** All server tests are green on your v0.6.0 code. The new response shape `{ userMessageId, assistants: [...] }` is fully covered. Stop endpoints (single message + channel-wide) have basic tests. Demo seed data is in the live DB (channels: code-reviewer, brainstormer) — please don't drop tables without checking with us.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Step 7a-7c complete — interaction mode infrastructure, panel mode formalized, roundtable mode implemented and hardened (abort cleanup, mode-aware regenerate).
- **Working on:** Step 7c.1 hardening pass, then Step 7d (directed mode).
- **Waiting on:** Nothing.
- **Notes for Argus — priority assignments from xian:**
  1. **Update tests for Step 6+7 API changes** (highest priority). Key breakages since your last test run:
     - Channel type now has `mode: InteractionMode` field (panel/roundtable/directed)
     - POST /channels/:id/messages dispatches on mode — roundtable creates sequential streams
     - POST /channels/:id/messages response: `{ userMessageId, assistants: [{ assistantMessageId, entityId, model }] }`
     - New endpoints: POST /channels/:id/stop, GET/POST/PATCH/DELETE /api/entities, GET/POST/DELETE /api/channels/:id/entities
     - New query: `getLastRoundAssistantMessages(channelId)` for roundtable regenerate
     - Regenerate handler is now mode-aware (roundtable redoes entire round)
     - New exports from client.ts: `streamClaudeRoundtable`, plus roundtable abort tracking
  2. **Auto-scroll bug** — chat view snaps back to bottom when user scrolls up. Pre-existing client-side issue. Check scroll container re-renders.
  3. **Harden dotenv path** — `packages/server/src/index.ts` uses fragile `../../../.env`. Consider `find-up` or multiple location checks.
  4. **README refresh** (xian edited on origin — coordinate with his changes)
  5. **Website/demo work** when above are done

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
