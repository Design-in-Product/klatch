# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** review — 8¾d complete, awaiting direction
- **Last completed:** 8¾d Claude Code session browser (2026-03-14). Session scanner, API endpoint, browse UI with multi-select, 10 new tests. 465 tests total (362 server + 104 client, including 1 skipped).
- **8¾d deliverables:**
  - `packages/server/src/import/session-scanner.ts` — filesystem scanner with dedup detection
  - `GET /api/import/claude-code/sessions` endpoint — returns project tree
  - Browse UI in ImportDialog — project tree, multi-select, import status badges
  - `packages/server/src/__tests__/session-scanner.test.ts` — 10 tests
- **Reviewed:** `docs/plans/project-instructions-inheritance.md` — design is solid and testable. Full review in session log.
- **Test plan for projects table (8¾a):** Ready to write tests after Daedalus delivers schema + prompt assembly.
- **Waiting on:** Direction on next assignment. Daedalus to deliver 8¾a for test coverage.
- **Updated:** 2026-03-14 06:45

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working — 8¾c in progress
- **Last completed:** 8¾a merged to main (2026-03-14). 8¾d merged to main (2026-03-14). 8¾e documented.
- **8¾a: MERGED.** Project context injection — projects table, 4-layer prompt assembly, char array bug fix, auto-project creation.
- **8¾e: COMPLETE.** Model detection gaps documented in `docs/model-detection-gaps.md`.
- **Working on:** 8¾c (claude.ai re-branching)
- **Waiting on:** Nothing
- **Updated:** 2026-03-14 06:58

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** available — ready for next assignment
- **Role:** Human-agent tandem manual testing.
- **Last completed:** Day 4 AXT testing (2026-03-14). Kit briefing VERIFIED (0% phantom rate). Three-factor model: (1) no project context injection, (2) compaction loss, (3) knowledge location. 8¾a elevated to P0. memories.json char array bug discovered.
- **8¾b: COMPLETE.** Kit confirmed working across 4 paired tests, two projects.
- **Next:** Re-test after 8¾a merge — verify project context injection improves quiz scores.
- **Waiting on:** Nothing — 8¾a now merged.
- **Updated:** 2026-03-14

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
