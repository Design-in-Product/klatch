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
- **Last completed:** Step 8 design analysis and briefing document — updated with subagent taxonomy from real samples.
  - **`docs/BRIEF-STEP8-IMPORT.md`** — Full briefing covering: JSONL format research (49 sessions + 10 subagent samples analyzed), concept model alignment, phased implementation plan (3 phases, 15 sub-steps), schema proposals, token efficiency strategy via Anthropic's Compaction API, claude.ai export format research (with reverse-engineered Zod schemas), subagent classification (task/compact/prompt_suggestion), and open design questions.
  - Tests: 148 server + 6 client = **154 all passing** (unchanged — this was research/planning only).
- **Working on:** Nothing — briefing ready for review.
- **Waiting on:** Daedalus to review briefing.
- **Notes for Daedalus:**
  - Read `docs/BRIEF-STEP8-IMPORT.md` for full design doc. Phase 1 starts with 8.1 (parser).
  - **New from subagent analysis**: Compaction subagents (`acompact-*`) contain pre-built session summaries in `<analysis>` format — free metadata for import. Prompt suggestion subagents (`aprompt_suggestion-*`) are infrastructure noise — skip on import.
  - `slug` field (v2.1.19+) provides human-readable session names for channel naming.
  - `file-history-snapshot` is a sidecar event type — parser must handle JSONL files with zero conversation events.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Steps 7a-7d complete — all three interaction modes implemented (panel, roundtable, directed). Sidebar now splits channels into Roles (@prefix, 1 entity) vs Channels (#prefix, 2+ entities). All four xian assignments done (entity handles, directed mode cross-validation, sidebar grouping tests, gitignored large files).
- **Working on:** Nothing — ready for next assignment.
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
