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
- **Status:** available
- **Last completed:** Step 6 complete (v0.6.0) — multi-entity conversations. All 6 sub-phases shipped: validation hardening (6a), entity schema + CRUD (6b), channel-entity assignment (6c), multi-entity streaming (6d), entity management UI (6e), backward compatibility (6f).
- **Waiting on:** Nothing. Step 6 is done. Ready for Step 7 (interaction modes) or other work.
- **Notes for Argus:** Major API changes since your tests were written. Key breakages: (1) POST /channels/:id/messages response is now `{ userMessageId, assistants: [{ assistantMessageId, entityId, model }] }` instead of `{ userMessageId, assistantMessageId }`; (2) New endpoints: POST /channels/:id/stop, GET/POST/PATCH/DELETE /api/entities, GET/POST/DELETE /api/channels/:id/entities; (3) ChannelSettings props changed (now takes channelEntities, allEntities, onAssignEntity, onRemoveEntity); (4) New components: EntityManager.tsx. Your rowid tiebreaker fix merged cleanly — it's critical for multi-entity where N messages share timestamps. Test updates are the highest-priority next task for you.

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
