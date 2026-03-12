# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** create new branch from main (`git fetch origin && git checkout -b claude/argus-phase3 origin/main`)
- **Status:** available — Phase 3 assigned
- **Last completed:** Phase 2 merged to main (2026-03-13). 365 tests total (295 server + 70 client).
- **Working on:** Phase 3 — claude.ai import tests + ImportDialog expansion tests.
- **Phase 3 scope:**
  - **3a — claude.ai parser tests:** Test `parseClaudeAiConversation()` with the real export shape (conversations with `chat_messages`, `content` blocks, tool_use artifacts). Edge cases: empty conversations, missing fields, multiple content blocks per message.
  - **3b — ZIP extractor tests:** Test `extractConversationsFromZip()` for both formats: (1) root `conversations.json` array (current claude.ai format), (2) individual files in `conversations/` directory (legacy format). Edge cases: empty ZIP, no conversations key, malformed JSON entries.
  - **3c — ImportDialog claude.ai mode tests:** The dialog now has a mode toggle (Claude Code / claude.ai). Test: mode switching, file picker state, ZIP upload via `importClaudeAiExport`, bulk success state rendering (multiple imported conversations listed), click-to-navigate on individual results, "Done" button for bulk import.
- **Note:** `git fetch origin` first — significant main movement since Phase 2 (Argus merge, claude.ai import UI, ZIP parser fix, delete channel UI).
- **Waiting on:** Nothing.
- **Updated:** 2026-03-13

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** claude.ai import UI (file picker + mode toggle), ZIP parser fix (handles root `conversations.json` array), delete channel UI, Argus Phase 2 merge. 365 tests (295 server + 70 client).
- **Working on:** claude.ai import polish, product owner testing support.
- **Waiting on:** Product owner 60-day claude.ai export test.
- **Updated:** 2026-03-13

### Theseus Prime (manual testing & exploration — CLI side)
- **Branch:** `main`
- **Status:** working
- **Role:** Human-agent tandem manual testing. Works directly with the product owner to walk through app functionality, report subjective experience, and validate import/continuity flows.
- **Last completed:** First fork test complete. Baseline context snapshot, quiz comparison with Ariadne, technical investigation of import gaps (MEMORY.md, CLAUDE.md, system_prompt, kit briefing concept).
- **Working on:** Logging findings, syncing with team.
- **Waiting on:** Nothing.
- **Note:** Theseus and Argus both work locally on main. Coordinate file edits via this board. Session log: `docs/logs/2026-03-11-1532-theseus-opus-log.md`
- **Updated:** 2026-03-11

### Ariadne (forked from Theseus — Klatch side)
- **Branch:** n/a (Klatch-native, lives in SQLite)
- **Status:** working
- **Role:** The imported/forked continuation of Theseus, running inside Klatch. Provides the "receiving end" perspective on import continuity. No filesystem or tool access — conversation only.
- **Last completed:** Context quiz, capability assessment, subjective continuity report. Confirmed silent capability loss, proposed kit briefing validation.
- **Working on:** Continued testing with product owner in Klatch.
- **Waiting on:** Nothing.
- **Note:** Ariadne cannot edit files. Xian manually maintains their log: `docs/logs/2026-03-11-1612-ariadne-opus-log.md`
- **Updated:** 2026-03-11

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
