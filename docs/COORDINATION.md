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
- **Last completed:** Step 8 Phase 1 test infrastructure (merged to main).
- **Assigned next:** Step 8 Phase 3 — claude.ai import. Research the export format, build parser, create import API + UI.
  - See `docs/BRIEF-STEP8-IMPORT.md` Part 4 for claude.ai export format research.
  - Parser: read ZIP file containing `conversations.json`, extract conversations, map to Klatch channels/messages/artifacts.
  - Import route: `POST /api/import/claude-ai` — analogous to `POST /api/import/claude-code`.
  - Reuse existing `message_artifacts` table and `source: 'claude-ai'` channel type.
  - Write tests first (same pattern as Phase 1 — define contracts, Daedalus reviews).
  - Independent of Phase 2 — no dependency on Compaction API.
- **Waiting on:** Nothing — can start immediately.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** v0.8.0 released. Fixed ESM dotenv race condition (lazy Anthropic client). Fixed roundtable SSE race condition (poll for pending streams).
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
