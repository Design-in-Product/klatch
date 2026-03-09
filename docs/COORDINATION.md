# Agent Coordination

Two agents work on this repo. This file is the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
<<<<<<< HEAD
- **Status:** working
- **Last completed:** Step 8 design analysis and briefing document with claude.ai export schema research.
  - **`docs/BRIEF-STEP8-IMPORT.md`** — Full briefing covering: JSONL format research (49 sessions analyzed), concept model alignment, phased implementation plan (3 phases, 15 sub-steps), schema proposals, token efficiency strategy via Anthropic's Compaction API, claude.ai export format research (with reverse-engineered Zod schemas), and open design questions.
  - Tests: 148 server + 6 client = **154 all passing** (unchanged — this was research/planning only).
- **Working on:** Reviewing sample JSONL file from xian for format nuances.
- **Waiting on:** Nothing.
- **Notes for Daedalus:** Read `docs/BRIEF-STEP8-IMPORT.md` for full design doc. Phase 1 starts with 8.1 (parser).

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Steps 7a-7d complete — all three interaction modes implemented (panel, roundtable, directed). Sidebar now splits channels into Roles (@prefix, 1 entity) vs Channels (#prefix, 2+ entities).
- **Working on:** Step 7 code review, then Step 8 (import).
- **Waiting on:** Nothing.
- **Notes for Argus — new priority assignments from xian:**
  1. **Entity `handle` field** (new feature). Add optional `handle` (slug) field to Entity schema. Examples: `exec`, `cxo`, `lead`. Used for @-mention shorthand (`@exec` instead of `@"Chief of Staff"`). Schema: add `handle TEXT` column to entities table + migration. Update `parseMentions`/`resolveMentions` in `packages/shared/src/types.ts` to match on handle OR name. Update Entity Manager UI to show handle input. Update mention autocomplete in MessageInput.tsx to display/match handles. **This is additive — no breaking changes.**
  2. **Cross-validate directed mode** — test @-mention parsing with various entity names: spaces (`@"Chief of Staff"`), hyphens (`@code-reviewer`), case sensitivity (`@claude` vs `@Claude`), multi-mention (`@Claude @Reviewer`), no-mention error case. Verify `resolveMentions` in shared/types.ts handles all edge cases. Add tests.
  3. **Test sidebar grouping** — verify entityCount from `GET /channels` response, confirm sidebar Roles/Channels split works when entities are assigned/removed. Test edge: channel goes from 1→2 entities mid-session (should move from Roles to Channels).
  4. **Finish README refresh + website/demo work** when above are done.

  **Key changes since last sync:**
  - `packages/shared/src/types.ts`: Added `parseMentions()`, `resolveMentions()`, `entityCount?` on Channel
  - `packages/server/src/routes/messages.ts`: Directed mode dispatch (parses @-mentions, routes to mentioned entities only)
  - `packages/server/src/db/queries.ts`: `getAllChannels()` now returns entityCount via LEFT JOIN
  - `packages/client/src/components/ChannelSidebar.tsx`: Split into Roles (@) and Channels (#) sections
  - `packages/client/src/components/MessageInput.tsx`: @-mention autocomplete dropdown in directed mode
  - `packages/client/src/components/ChannelSettings.tsx`: Directed button enabled (all modes active)
  - `packages/client/src/App.tsx`: sendError state for directed mode missing-mention error, refreshes channels on entity assign/remove

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
