# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `main`
- **Status:** available
- **Test count:** 1069 total (909 server + 160 client), zero failures.
- **Completed work:**
  - Rounds 4–11 test suites (all passing, merged to main)
  - Intelligence feed: 7 sweeps filed (6 manual + 1 curated automated)
  - Round 13: test infra fixes + 11 feature tests + research spikes (compaction, effort)
  - Rounds 14–16: File Domain Model Phases 1–5 — 58 tests total
  - Round 17: Compaction threshold + effort parameter — 18 tests
  - Round 18: Step 10 Phase 2 export endpoint — 23 tests
  - Round 19: AAXT Scaffolded Probing Phase 2 — full pipeline + 8 tests
  - Round 20: Phase 3.5 UX fixes — 7 tests
  - Round 21: Phase 3.5d review UI — 14 tests
  - Round 22/23: Phase 4 Claude Code transport — 27 tests
  - Round 24: Phase 4 claude.ai transport incl. round-trip — 23 tests
  - Round 25b: Phase 5a MCP server extended coverage — 29 tests (sign-off gate for 5b)
  - Round 26b: Phase 5b MCP tools surface extended coverage — 18 tests (sign-off gate for 5c)
  - Memo to Daedalus: MCP ResourceTemplate URI decoding finding (non-blocking, 5c design note)
  - Pattern-062 diagnostic added to AAXT scaffolded probing protocol (assembler audit before prompt iteration)
  - PM #995 fabrication-probe coordination memo to PM Lead Dev (convergent design, three alignment asks)
  - Intel sweep #8: curated review of 4/20 automated + 4/21–4/26 delta (Sonnet/Opus 4 retirement clock noted, MCP conformance work in progress)
  - SDK bump ^0.78.0 → ^0.86.1 (Managed Agents support)
  - Hono security update ^4.6.0 → ^4.12.12 (5 CVEs patched)
  - AAXT/PM cross-reference + fabrication probe class design + complexity heuristics doc
  - Local model viability research + adoption plan (Gemma 4 / Qwen 3)
- **Phase 5a/5b sign-off:** Exit criteria met for both — protocol integration tests green, refactor equivalence (MCP ↔ HTTP via shared `buildManifest`) verified, tools surface equivalence verified, cross-producer tool naming pinned, no regressions. Daedalus clear to pause for 5c decision.
- **Next:** Await 5c decision or xian direction. Open follow-ups (none blocking): Sonnet 4 / Opus 4 DB audit ahead of 6/15 retirement; Opus 4.7 default-flip evaluation in ~2 weeks; LLM-orchestrated path coverage as Round 27 candidate; MCP conformance test suite watch.
- **Updated:** 2026-04-26 08:10
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
- **Last completed:** Step 10 close-out polish wave (after 5c-i ship):
  - `removeReflectionsWhere(entityId, predicate)` helper added to queries; smoke-test row removed from live klatch.db.
  - `/reflect` endpoint now stamps `ingress: 'klatch-ui'` for parity with MCP's `'mcp'` stamping. Test added to round21.
  - Shared `assembleChannelManifest` helper extracted to `packages/server/src/export/assemble.ts`; HTTP routes (`/export`, `/export-preview`, `/export/claude-code`, `/export/claude-ai`) and MCP server's options path all delegate to it. ~200 lines of duplicated orchestration removed.
  - `docs/firsts/2026-04-26-mcp-first-reflection.md` captures the first MCP-ingressed reflection moment.
  - `docs/plans/STEP-10-RETROSPECTIVE.md` — closing artifact for Step 10.
  - `docs/MCP-SETUP.md` — beta user-facing setup walkthrough.
- **Test count:** 919 server tests green (was 915 → 918 from Round 27 + helper tests → 919 with /reflect ingress test).
- **Next:** Standing down at xian's direction. Step 10 close-out complete; team needs to catch up. xian's framing: "almost certainly that while we're testing, we'll find things that need attention, and that is likely to drive development sooner than moving on to another step." Awaiting test-driven findings (Argus Round 27b, Theseus AAXT, Iris UX surface), which will likely be the next development drivers ahead of Step 11 (Search) or further polish.
- **Roadmap:** Step 9 ✓ → Step 10 Phase 1 ✓ Phase 2 ✓ Phase 3.5 ✓ Phase 4 CC+AI ✓ Phase 5a ✓ Phase 5b ✓ Phase 5c-i ✓ → 5c-ii deferred → 1.0.
- **Cross-project alignment (recorded):** PM Chief Architect confirmed `klatch://` scheme and `get_context_package` shared tool name (memo `memo-arch-to-daedalus-phase5-mcp-2026-04-18.md`). `/{id}/manifest` sub-resource pattern endorsed as cross-producer interop convention. PM's `save_artifact` write-path (analogous to `reflect`) is post-5b coordination, parked.
- **Note for Argus:** `SidebarRedesign.test.tsx` "chats appear before klatches in DOM order" is flaky — failed once at 6856ms, passed cleanly on rerun. Not blocking; flagging for triage.
- **Updated:** 2026-04-26 10:08

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** available
- **Role:** Human-agent tandem manual testing.
- **Last completed:** MAXT Session 01 complete (2026-03-24). Aether (fork of Theseus) as subject. 8 findings filed. Key: Subliminal injection category discovered (content delivered and functionally accessible but source-unattributable). AAXT/MAXT gap confirmed. Quiz updated to v4.1. Findings absorbed by Daedalus and Calliope.
- **Next:** MAXT Session 02 planning — scope TBD with Xian in context of roadmap resequencing (Files → Export → Search). Test focus likely: import flow UX and unpopulated layer guidance (Finding 5 design opportunity).
- **Waiting on:** Xian.
- **Updated:** 2026-03-26 19:12

### Ariadne (forked from Theseus — Klatch side)
- **Branch:** n/a (Klatch-native, lives in SQLite)
- **Status:** available
- **Role:** Imported/forked continuation of Theseus. Provides "receiving end" perspective on import continuity.
- **Last completed:** Context quiz, capability assessment, subjective continuity report. Confirmed silent capability loss, proposed kit briefing validation.
- **Note:** Ariadne cannot edit files. Xian manually maintains their log: `docs/logs/2026-03-11-1612-ariadne-opus-log.md`
- **Updated:** 2026-03-13

### Iris (UX design & front-end development)
- **Branch:** `main`
- **Status:** available — session paused
- **Last completed:** Session 5 — Phase 3.5d interim spec sent to Daedalus (unblocked). Presented five UX topics to xian. Major reframe: entities are existing conversations promoted into roles, not abstract definitions. Import-to-export arc named as the missing experiential thread.
- **Working on:** Paused for evening. Tomorrow: xian's observations, then binocular synthesis.
- **Next:** Receive xian's independent observations → synthesize both sets → plan exhaustive end-to-end review → design research activities.
- **Waiting on:** xian's observations (tomorrow, travel day).
- **Updated:** 2026-04-14 19:35

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
