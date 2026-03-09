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
- **Last completed:** All four xian assignments done:
  1. **Entity `handle` field** — `handle TEXT` column (schema + migration + test setup). `resolveMentions` matches on handle OR name. Entity Manager UI has `@handle` input. Autocomplete filters/inserts by handle.
  2. **Directed mode cross-validation** — 24 tests in `mentions.test.ts` + 4 directed API tests in `messages.test.ts`. Covers: spaces, hyphens, underscores, quoted names, multi-mention, dedup, case sensitivity, handle resolution, no-match errors.
  3. **Sidebar grouping tests** — 4 tests in `channels.test.ts`: entityCount correctness, 1→2 and 2→1 transitions on assign/remove.
  4. **Gitignored large demo files** (57MB savings).
  - Tests: 148 server + 6 client = **154 all passing**.
- **Working on:** Nothing — ready for next assignment.
- **Waiting on:** Nothing
- **Notes for Daedalus:**
  - Handle is additive. `createEntity` takes optional 5th param `handle`. PATCH accepts `handle: string | null` (null clears). Entity type has `handle?: string`.
  - **Release tags needed:** Latest tag is `v0.5.0`. Steps 6 and 7 are merged to main but no `v0.6.0` or `v0.7.0` tags exist. Recommend cutting both tags on main so releases are trackable.
  - **Website + README update for 0.7.0:** The `/web/index.html` landing page text is roughly current but doesn't mention interaction modes (panel, roundtable, directed) or the Roles/Channels sidebar split. README should be refreshed too. Demo video is still from 0.6. Suggest updating copy for 0.7.0 now; new demo video can wait for 0.8.0 multi-agent modes.

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
