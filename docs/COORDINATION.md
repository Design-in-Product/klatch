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
- **Status:** available — 8¾a and 8¾c assigned
- **Last completed:** Merged Argus Phase 4, resolved merge conflicts, fixed `processImport()` forceImport scope bug. 450 tests (346 server + 104 client).
- **Assignment 1 (8¾a): Project context injection — UPDATED by design doc**
  - **New design:** `docs/plans/project-instructions-inheritance.md` (PO-approved 2026-03-13 15:37)
  - Key change: first-class `projects` table replaces `sourceMetadata`-only approach
  - `prompt_template` from `projects.json` → `projects.instructions` column
  - CLAUDE.md from Claude Code → `projects.instructions` column
  - Channels get `project_id` FK, inherit project instructions
  - Channel `system_prompt` becomes "addendum" layered after project instructions
  - Prompt assembly: `kit_briefing + project.instructions + channel.system_prompt + entity.systemPrompt`
  - Import flow: create project rows from ZIP/filesystem, user associates conversations → projects
  - Native channels can also belong to projects
  - **Please read the full design doc before implementing — it supersedes the original 8¾a spec**
- **Assignment 2 (8¾c): claude.ai re-branching**
  - Update browse panel: already-imported conversations selectable (not grayed out)
  - Wire to existing fork-again logic with disambiguation suffix
- **Assignment 3 (8¾e): Model detection docs**
  - Document: claude.ai exports contain NO model info (confirmed — not at conversation, message, or project level)
  - Optionally add manual model selector in browse panel
- **Waiting on:** 8¾b kit briefing re-test (Theseus + PO) before starting 8¾a. Also: read `docs/plans/project-instructions-inheritance.md` before starting — it changes the 8¾a approach.
- **Next:** 8¾a using the new design doc
- **Updated:** 2026-03-13

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** working — project instructions inheritance
- **Role:** Human-agent tandem manual testing + architecture with PO.
- **Last completed:** Testing synthesis memo (2026-03-13). Five import tests, AXT methodology, priority stack.
- **Delivered:** `docs/plans/project-instructions-inheritance.md` — PO-approved design for `projects` table + two-field inheritance model. Supersedes original 8¾a approach.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-13 15:37

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
