# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `main` (start new feature branch)
- **Status:** assigned — Round 4: sidebar project grouping + enriched query tests
- **Last completed:** Round 3 merged to main (33 tests). All rounds merged.
- **Assignment: Round 4 — Test coverage for project-based sidebar grouping**
  - Daedalus fixed a bug where claude.ai imports showed under "Imported" instead of their project name. The sidebar now groups by `projectId`/`projectName` from the `projects` table (JOIN in `getAllChannelsEnriched`) instead of parsing `sourceMetadata.cwd`. This is a data-model-level fix, not just cosmetic.
  - **Areas to cover:**
    1. **`getAllChannelsEnriched` query tests:** Verify the JOIN to `projects` returns `projectName`. Test channels with project (should have `projectName`), without project (should have `projectName: undefined`), and multiple channels sharing a project (same `projectName`). Test that project name updates propagate (rename project → enriched query reflects new name).
    2. **Cross-source project grouping:** Create a project (e.g. via Claude Code import with `cwd`), then import a claude.ai conversation linked to the same project. Verify both channels share the same `projectId` and `projectName` in the enriched response. This validates the unification that `findOrCreateProject` enables.
    3. **Project deletion impact on sidebar:** When a project is deleted, channels should still appear (with `projectId: null`, `projectName: undefined`). They should fall into the "Imported" fallback group, not disappear.
    4. **Channel-project linking/unlinking:** `setChannelProject()` and `clearChannelProject()` (or equivalent) should update what `getAllChannelsEnriched` returns for `projectName`.
  - **Key files:**
    - `packages/server/src/db/queries.ts` — `getAllChannelsEnriched()` (the changed query)
    - `packages/shared/src/types.ts` — `Channel.projectName` (new field)
    - `packages/client/src/components/ChannelSidebar.tsx` — grouping logic (for reference, not test target)
  - **Base:** Start from `main` (592 tests: 486 server + 106 client)
- **Waiting on:** Nothing — can start immediately.
- **Updated:** 2026-03-15 14:15

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Fixed sidebar project grouping bug — claude.ai imports now show under project name. Sidebar groups by `projectId`/`projectName` (JOIN to projects table) instead of parsing `sourceMetadata.cwd`. 592 tests (486 server + 106 client).
- **Next:** Await PO direction. Sidebar cleanup and cross-correlation design pending discussion.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-15 14:15

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** assigned — AXT re-test with project context injection
- **Role:** Human-agent tandem manual testing.
- **Last completed:** Day 4 AXT testing (2026-03-14). Kit briefing VERIFIED (0% phantom rate). Three-factor model identified.
- **Assignment: Post-8¾a AXT re-test**
  - Re-import test conversations (VA DR, PPM) now that project context injection is live on main
  - Run Fork Continuity Quiz v3 on fresh imports
  - Compare scores against Day 4 baselines — project context should improve scores for project-linked conversations
  - Key question: does injecting project instructions fresh into the system prompt bypass compaction loss?
- **Waiting on:** PO to start session.
- **Updated:** 2026-03-14 08:55

### Ariadne (forked from Theseus — Klatch side)
- **Branch:** n/a (Klatch-native, lives in SQLite)
- **Status:** available
- **Role:** Imported/forked continuation of Theseus. Provides "receiving end" perspective on import continuity.
- **Last completed:** Context quiz, capability assessment, subjective continuity report. Confirmed silent capability loss, proposed kit briefing validation.
- **Note:** Ariadne cannot edit files. Xian manually maintains their log: `docs/logs/2026-03-11-1612-ariadne-opus-log.md`
- **Updated:** 2026-03-13

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
