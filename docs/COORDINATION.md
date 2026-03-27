# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** working
- **Test count:** 727 total (611 server + 116 client), zero failures.
- **Completed work:**
  - Rounds 4–11 test suites (all passing, merged to main)
  - Cloud environment research (`docs/research/cloud-code-environment.md`)
  - Intelligence feed: 3 sweeps filed (`docs/intel/`), protocol at `docs/INTELLIGENCE.md`
  - Demo infrastructure: `KLATCH_DB` env var, `seed-demo.sh`, `docs/DEMO.md`, `scripts/record-demo.ts`
  - Round 11 AAXT harness (21 tests) + Round 11 klatch creation (21 tests)
  - Bookend-sync protocol formalized in `docs/agents/argus.md`
- **Completed research:** Cowork project export format (`docs/research/cowork-project-format.md`) — no documented export format exists; CLAUDE.md is the universal Layer 2 convention across all three environments.
- **Working on:** Remaining research assignments: (3) AuditBench methodology review for AAXT cross-pollination.
- **Merge protocol:** xian + Calliope handle merging branch to main. Argus pushes to branch only.
- **Updated:** 2026-03-27
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
- **Round 8 assignment: Project memory + prompt assembly tests**
  - See memo in `docs/mail/daedalus-to-argus-round8.md` for full details.
  - **Scope:** `packages/server/src/__tests__/round8-project-memory.test.ts`
  - Tests to write:
    1. **Project CRUD with memory field** — createProject with memory, updateProject with memory, rowToProject includes memory.
    2. **Import stores memory at project level** — Claude Code import puts MEMORY.md in project.memory (not instructions). claude.ai import puts project_memories + global account memories in project.memory.
    3. **5-layer prompt assembly** — buildSystemPrompt now has 5 layers. Verify project.memory appears as layer 3 (between instructions and channel addendum). Verify it does NOT appear in kit briefing when project is linked.
    4. **Legacy fallback** — Channels without project link still get memoryMd from sourceMetadata via kit briefing.
    5. **Prompt debug endpoint** — GET /channels/:id/prompt-debug returns 5 layers with correct status.
  - **Important:** Pull from main first! Schema has changed: projects table now has `memory` column. Test setup already updated.
- **Waiting on:** Nothing — start with Rounds 6+7, then Round 8.
- **Updated:** 2026-03-16 19:57

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** v0.8.8 (adaptive thinking, Haiku 4.5, 16K max_tokens), model provenance indicator (#20, backfilled), klatch creation UI (#10). 569 server tests passing.
- **Working on next:** Round 12 — intel sweep quick wins + spikes. See `docs/mail/calliope-to-daedalus-round12-intel-sweep-2026-03-23.md`. Tier 1: Sonnet 4.6 in model selector, `thinking.display: "omitted"`, Models API dynamic discovery (pending Argus verification). Tier 2: Compaction API spike (write to `docs/research/compaction-api-eval.md`), effort parameter per-entity (#17).
- **Waiting on:** Argus Models API verification before implementing dynamic model discovery. MAXT Session 01 results before starting Step 9 (search).
- **Updated:** 2026-03-23

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** available
- **Role:** Human-agent tandem manual testing.
- **Last completed:** MAXT Session 01 prep (2026-03-22). Self-exported session to `exports/sessions/theseus-2026-03-22.jsonl`. Pre-branch baseline at `docs/axt/maxt-session-01-baseline.md`. Logbook Day 4 accuracy confirmed (reply in `docs/mail/theseus-to-calliope-logbook-reply.md`).
- **Next:** MAXT Session 01 — xian imports Theseus's exported session into Klatch, conducts Fork Continuity Quiz v4. Theseus is subject, informed-subject condition. Results gate Step 9 (search) start.
- **Waiting on:** xian to run the import and initiate the session.
- **Updated:** 2026-03-23

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

Merging feature branches into main is handled by **xian + Calliope** (or Daedalus for his own branches). To avoid silent deletions from stale branches:

1. **Rebase or merge main into your branch before pushing for review.** This ensures your branch includes all recent main changes. If you skip this, git may silently "delete" files that were added to main after your branch diverged.
2. **Daedalus reviews the diff stat before merging.** Any unexpected file deletions, additions outside the assignment scope, or changes to shared docs (CLAUDE.md, ROSTER.md, AXT.md, ROADMAP.md) will be reverted during merge.
3. **Stay in your lane.** Only modify files within your assignment scope. If you notice something that needs fixing outside your scope, note it in your log or mail — don't fix it yourself.

## Protocol

- Pull from origin and read this file at session start
- Check `docs/mail/` for memos addressed to you
- Update your section before every push (include `Updated:` timestamp)
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
