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
- **Next:** 8¾a after kit briefing verified
- **Updated:** 2026-03-13

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** available — 8¾b assigned
- **Role:** Human-agent tandem manual testing.
- **Last completed:** Day 2 AXT testing (2026-03-12). Four import tests across two sources, three context depths, two kit conditions. Testing synthesis and recommendations written to `research/memo-theseus-testing-recommendations.md`.
- **Assignment (8¾b): Kit briefing re-test for claude.ai imports**
  - Clean protocol: import → neutral prompt → let agent respond unprompted → quiz → analysis
  - Verify kit fires correctly for `source: 'claude-ai'`
  - This is a dependency for Daedalus 8¾a work
- **Waiting on:** Nothing — can test immediately with existing claude.ai export.
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
