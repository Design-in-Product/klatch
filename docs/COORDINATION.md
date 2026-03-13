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
- **Last completed:** Kit briefing data pipeline fix for claude.ai imports (2026-03-13 06:15). Extracted project docs content + memories from ZIP into sourceMetadata. Also fixed `forceImport` merge gap in processImport. 7 new tests. 456 tests total (352 server + 104 client).
- **Prior delivery:** Phase 4 selective import browser, merged to main 2026-03-13.
- **Phase 5 assignment: Claude Code session browser (8¾d)**
  - New endpoint: `GET /api/import/claude-code/sessions` — scan `~/.claude/projects/`, return directory tree with session metadata
  - Browse UI: "Browse..." button in Claude Code import mode → project tree with sessions, dedup detection
  - Tests for session scanner, browse UI, and dedup marking
  - See `docs/plans/step8-remaining.md` for full spec
- **Also assigned:** Tests for 8¾a (project context injection) and 8¾c (re-branching) after Daedalus delivers
- **Working on:** Merge conflict resolution, ROSTER.md creation, awaiting direction.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-13

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available — 8¾a and 8¾c assigned
- **Last completed:** Merged Argus Phase 4, resolved merge conflicts, fixed `processImport()` forceImport scope bug. 450 tests (346 server + 104 client).
- **Assignment 1 (8¾a): Project context injection for claude.ai imports**
  - Extract `prompt_template` from `projects.json` in ZIP (confirmed present: Piper Morgan, VA DR, etc.)
  - Store project system prompts in `source_metadata`
  - Inject into kit briefing / channel system prompt
  - Project association UI in browse panel (conversations → projects)
  - Note: `project_uuid` missing from conversations in export — need user-driven association or heuristic
- **Assignment 2 (8¾c): claude.ai re-branching**
  - Update browse panel: already-imported conversations selectable (not grayed out)
  - Wire to existing fork-again logic with disambiguation suffix
- **Assignment 3 (8¾e): Model detection docs**
  - Document: claude.ai exports contain NO model info (confirmed — not at conversation, message, or project level)
  - Optionally add manual model selector in browse panel
- **Waiting on:** 8¾b kit briefing re-test (Theseus + PO) before starting 8¾a
- **Note:** Theseus + PO working on project instructions inheritance design (2026-03-13 15:22). Intersects 8¾a — coordinate before implementing project context injection.
- **Next:** 8¾a after kit briefing verified
- **Updated:** 2026-03-13

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** working — project instructions inheritance
- **Role:** Human-agent tandem manual testing + architecture with PO.
- **Last completed:** Testing synthesis memo (2026-03-13). Five import tests, AXT methodology, priority stack.
- **Current work: Project instructions inheritance for chats**
  - PO direction (2026-03-13 15:22): Chats should inherit CLAUDE.md from their project instructions (as called in the UI). Currently each channel has its own system_prompt — need a project-level instructions layer.
  - This is the high-fidelity prompt source Hermes identified: `prompt_template` from `projects.json` for claude.ai imports, CLAUDE.md for Claude Code imports.
  - Future: more granular per-role instructions (role.md or similar), but start with project-level inheritance.
  - Intersects with 8¾a (project context injection) — Daedalus should coordinate.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-13

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
