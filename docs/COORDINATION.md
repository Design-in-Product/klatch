# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** create new branch from main
- **Status:** assigned — Round 6 + Round 7
- **Last completed:** Round 5: import project assignment tests (merged to main).
- **Test count:** 516 server + 106 client = 622 total. Zero failures.
- **Round 6 assignment: Post-import project reassignment + channel name tests**
  1. **PATCH /api/channels/:id with projectId** — Test that sending `projectId` in the PATCH body updates the channel's project. Test setting a project, changing to a different project, and removing (setting `projectId: null`). Verify the response reflects the change and that `getAllChannelsEnriched()` returns the updated `projectName`.
  2. **Channel names don't include project prefix** — Import conversations that have project assignments and verify channel names are just the conversation name (not "ProjectName: ConvName"). This was a bug we fixed; make sure it stays fixed.
  3. **fetchProjects API** — Test `GET /api/projects` returns all projects (used by Channel Settings dropdown). Verify projects created during import appear here.
  4. **Project reassignment end-to-end** — Import a conversation assigned to Project A, then PATCH it to Project B. Verify sidebar grouping would reflect the change (channel's `projectId` and `projectName` update correctly).
  - **Scope:** `packages/server/src/__tests__/round6-project-reassignment.test.ts`
  - **Important:** Pull from main first! Channel names no longer include project prefix. The `setChannelProject` function in `db/queries.ts` handles the DB update; the PATCH handler in `routes/channels.ts` calls it.
- **Round 7 assignment: Sidebar redesign tests (GitHub issue #8)**
  - Read `docs/plans/SIDEBAR.md` for full design spec before writing tests.
  - **Scope:** `packages/server/src/__tests__/round7-sidebar-redesign.test.ts` (server) + `packages/client/src/__tests__/Sidebar.test.tsx` (updates to existing)
  - Tests to write:
    1. **`type` column migration** — Verify `channels` table accepts `type` field with values `'chat'` and `'klatch'`. Default is `'chat'`. Existing channels without explicit type get `'chat'`.
    2. **Klatch requires project** — Creating/updating a klatch with no `projectId` should fail or be rejected. Chats can have `projectId: null`.
    3. **Sidebar grouping by type** — `getAllChannelsEnriched()` returns `type` field. Chats and klatches within a project can be distinguished.
    4. **Unassigned excludes klatches** — Query for unassigned channels (no project) should only return type `'chat'`, never `'klatch'`.
    5. **Client sidebar sections** — Within a project, chats render above klatches. Unassigned section only shows chats.
    6. **Accordion behavior** — Expanding one project collapses others (client test).
  - **Important:** These tests should be written to pass against the *planned* implementation. Daedalus will implement the data model changes (Phase 1) first, then the UI (Phase 2). Coordinate via this file — Round 7 tests can be written speculatively and will fail until implementation lands. That's fine.
- **Waiting on:** Nothing — start with Round 6, then Round 7.
- **Updated:** 2026-03-16 08:50

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Sidebar redesign Phase 1+2 shipped (commit `66b5755`). Type column added, sidebar rewritten with project-first accordion, chat/klatch sections, unassigned area. 622 tests, zero failures.
- **Working on:** Available for Phase 3 (context-aware creation) or Argus R6/R7 merge when ready.
- **Waiting on:** PO direction or Argus deliverables.
- **Updated:** 2026-03-16 10:30

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** available
- **Role:** Human-agent tandem manual testing.
- **Last completed:** Day 6 manual testing (2026-03-16). Sidebar spot-check + CIO reimport AXT session. Six findings filed. Memo to Daedalus in `docs/mail/`.
- **Key finding:** System prompt / project context injection (8¾a) confirmed NOT reaching imported channels. Kit briefing absent. P1 bug — needs Daedalus investigation before clean AXT re-test can run.
- **Next:** Clean AXT re-test (Fork Continuity Quiz v3) deferred pending P1 fix. Will resume once Daedalus resolves system prompt attachment.
- **Updated:** 2026-03-16 14:27

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

## Merge protocol

Merging feature branches into main is **Daedalus's responsibility** (or the PO's). To avoid silent deletions from stale branches:

1. **Rebase or merge main into your branch before pushing for review.** This ensures your branch includes all recent main changes. If you skip this, git may silently "delete" files that were added to main after your branch diverged.
2. **Daedalus reviews the diff stat before merging.** Any unexpected file deletions, additions outside the assignment scope, or changes to shared docs (CLAUDE.md, ROSTER.md, AXT.md, ROADMAP.md) will be reverted during merge.
3. **Stay in your lane.** Only modify files within your assignment scope. If you notice something that needs fixing outside your scope, note it in your log or mail — don't fix it yourself.

## Protocol

- Pull from origin and read this file at session start
- Check `docs/mail/` for memos addressed to you
- Update your section before every push (include `Updated:` timestamp)
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
