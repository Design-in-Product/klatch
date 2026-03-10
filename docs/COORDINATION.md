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
- **Last completed:** Step 8 briefing merged to main. Excellent work on JSONL research + subagent taxonomy.
- **Working on:** Nothing — awaiting Step 8 test assignments below.
- **Waiting on:** Nothing.
- **Notes for Daedalus:** Briefing reviewed and approved. All open questions resolved.

**Step 8 assignments from xian (start immediately, parallel to Daedalus on main):**

1. **Test fixtures** — Create `packages/server/src/__tests__/fixtures/` with minimal JSONL files from `research/` samples:
   - `simple-session.jsonl` — 2-3 user/assistant text turns, no tool use
   - `tool-heavy-session.jsonl` — user turn + assistant with tool_use/tool_result chain + final text
   - `subagent-session.jsonl` — main session referencing subagent (isSidechain events to skip)
   - `compaction-subagent.jsonl` — `acompact-*` style with `<summary>` block to extract
   - `malformed.jsonl` — some valid lines + some broken JSON + empty lines (parser must be tolerant)
   Each fixture should be small (5-15 events) and self-contained. Use real field shapes from `research/` samples.

2. **Parser unit tests** — `packages/server/src/__tests__/parser.test.ts`:
   - Test `parseEvents()` (pure function, array of events in → ParsedSession out)
   - Event filtering: skip progress, file-history-snapshot, queue-operation; keep user/assistant
   - Subagent classification: `a{hex}` = task (skip), `acompact-*` = extract summary, `aprompt_suggestion-*` = skip
   - Text extraction: string content (user), array content with text blocks (assistant)
   - Tool-use summarization: "Read: src/App.tsx", "Bash: npm test"
   - Turn grouping: parentUuid=null user events are boundaries
   - Compaction summary extraction from acompact subagent output
   - Edge cases: empty session, single-message session, assistant with only tool_use (no text)

3. **Import integration tests** — `packages/server/src/__tests__/import.test.ts`:
   - POST /api/import/claude-code with valid path → 201 + ImportResult
   - Missing file → 404
   - Non-.jsonl file → 400
   - Empty session (no conversation events) → 400
   - Duplicate session → 409 with existing channel info
   - After import: channel appears in GET /channels with source='claude-code'
   - After import: messages appear with original timestamps

4. **Migration test update** — `packages/server/src/__tests__/migration.test.ts`:
   - Verify source/source_metadata columns on channels
   - Verify original_timestamp/original_id columns on messages
   - Verify message_artifacts table creation + CASCADE delete

**Key function signatures** (Daedalus will implement, you write tests against):
- `parseEvents(events: RawEvent[]): ParsedSession` — in `packages/server/src/import/parser.ts`
- `importSession(params): ImportResult` — in `packages/server/src/db/queries.ts`
- `findChannelByOriginalSessionId(sessionId): Channel | undefined` — in queries.ts
- POST `/api/import/claude-code` body: `{ sessionPath: string, channelName?: string }`

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Step 7 complete (v0.7.0 released). Step 8 briefing reviewed and approved. Plan finalized.
- **Working on:** Step 8 Phase 1 implementation — schema migration → parser → DB operations → API route → UI → badges.
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
