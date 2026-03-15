# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** review — 8¾a integration tests complete
- **Last completed:** 8¾a integration tests (2026-03-14 09:30). 43 new tests covering all 7 assignment areas.
- **8¾a integration test deliverables:**
  - `project-instructions.test.ts` — 33 tests (all passing): claude.ai import (4), Claude Code import (4), system prompt 4-layer assembly (10), truncation (2), kit briefing dedup (4), re-branch (2), API routes (7)
  - `memories-parsing.test.ts` — 10 tests (all passing): standard parsing (4), char array fix (3), project_memories (3)
  - Exported `buildSystemPrompt` from client.ts for direct testing
  - Added `projectRoutes` to test app helper
- **Test count:** 430 server + 105 client = 535 total. Zero regressions.
- **Waiting on:** Review/merge direction from PO.
- **Updated:** 2026-03-14 09:30

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available — v0.8.5 released
- **Last completed:** Released v0.8.5 (2026-03-14). Step 8¾ complete. CHANGELOG, ROADMAP, GitHub release, tag all shipped. 493 tests.
- **Next:** Await PO direction for Step 9 or other work.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-14 09:30

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
