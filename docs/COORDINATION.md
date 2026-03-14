# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7` (merged to main 2026-03-13)
- **Status:** available — Phase 5 assigned
- **Last completed:** Phase 4 merged (2026-03-13). Selective import browser: ZIP preview endpoint, selective conversation filter, browse UI with checkboxes. 450 tests total (346 server + 104 client) after merge conflict resolution.
- **Phase 5 assignment: Claude Code session browser (8¾d)**
  - New endpoint: `GET /api/import/claude-code/sessions` — scan `~/.claude/projects/`, return directory tree with session metadata
  - Browse UI: "Browse..." button in Claude Code import mode → project tree with sessions, dedup detection
  - Tests for session scanner, browse UI, and dedup marking
  - See `docs/plans/step8-remaining.md` for full spec
- **Also assigned:** Tests for 8¾a (project context injection) and 8¾c (re-branching) after Daedalus delivers
- **Waiting on:** Nothing — can start immediately.
- **Updated:** 2026-03-13

### Daedalus (architecture & implementation)
- **Branch:** `daedalus/project-context-injection`
- **Status:** review — 8¾a complete, requesting review before merge
- **Last completed:** 8¾a project context injection (2026-03-14). Full implementation:
  - `projects` table: first-class schema with id, name, instructions, source, source_metadata
  - `channels.project_id` FK column linking channels to projects
  - `extractFromZip` updated: extracts `prompt_template`, project docs, project-scoped memories
  - **memories.json char array bug fixed**: detects and joins `["H","e","l","l","o"]` → `"Hello"`
  - claude.ai import: auto-creates projects from `projects.json`, links conversations via `project_uuid`
  - Claude Code import: auto-creates projects by `cwd` (same cwd = same project)
  - `buildSystemPrompt` now 4-layer: kit_briefing → project.instructions → channel.system_prompt → entity.systemPrompt
  - Kit briefing: claudeMd moved to project layer (fallback for legacy imports only), memoryMd still in kit
  - Project CRUD API: `GET/POST/PATCH/DELETE /api/projects`
  - `findOrCreateProject`: idempotent project creation by source identity
  - 26 new tests (16 project CRUD + 10 project injection). 476 total (372 server + 104 client), all passing.
- **Next:** 8¾c (claude.ai re-branching), 8¾e (model detection docs)
- **Waiting on:** Review/merge of 8¾a before starting 8¾c
- **Updated:** 2026-03-14

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** available — ready for next assignment
- **Role:** Human-agent tandem manual testing.
- **Last completed:** Day 4 AXT testing (2026-03-14). Kit briefing VERIFIED (0% phantom rate). Three-factor model: (1) no project context injection, (2) compaction loss, (3) knowledge location. 8¾a elevated to P0. memories.json char array bug discovered.
- **8¾b: COMPLETE.** Kit confirmed working across 4 paired tests, two projects.
- **Next:** Re-test after Daedalus 8¾a merges — verify project context injection improves quiz scores.
- **Waiting on:** Daedalus 8¾a merge.
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
