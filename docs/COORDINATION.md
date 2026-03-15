# Agent Coordination

Agents working on this repo use this file as the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `main` (start new feature branch)
- **Status:** assigned — import error handling + route integration tests
- **Last completed:** 8¾a integration tests merged to main (2026-03-14). 43 tests, reviewed ✅.
- **Assignment: Round 2 — Import hardening tests**
  - **Goal:** Test the import error handling paths hardened by Daedalus (commit `dfac5a0`), plus end-to-end HTTP-level import tests.
  - **Key areas to cover:**
    1. **Import route error handling:** POST /api/import/claude-ai with malformed ZIP content → verify 500 response is JSON `{ error: "..." }` (not plain text). Test with ZIP containing invalid conversations.json (bad JSON inside), ZIP with valid structure but conversations that cause DB errors (e.g., extremely long channel names).
    2. **Preview route error handling:** POST /api/import/claude-ai/preview with edge cases → verify error responses are always JSON. Test with truncated ZIP, empty ZIP, ZIP without conversations.json.
    3. **End-to-end HTTP import:** Build a real ZIP with AdmZip containing conversations.json + projects.json + memories.json → POST to /api/import/claude-ai via multipart → verify channels + projects created in DB. This is the integration gap from Round 1 (tests called queries directly, not through HTTP).
    4. **Preview → Import roundtrip:** Preview a ZIP → get conversation UUIDs → import with selectedConversationIds → verify only selected conversations imported.
    5. **Channel unlinking on project delete:** DELETE /api/projects/:id → verify linked channels still exist but project_id is null, and buildSystemPrompt falls back correctly.
  - **Key files:**
    - `packages/server/src/routes/import.ts` — import + preview routes (now with try-catch)
    - `packages/client/src/api/client.ts` — fixed error handlers (for reference, client-side)
  - **Base:** Start from `main` (536 tests passing: 431 server + 105 client)
- **Waiting on:** Nothing — can start immediately.
- **Updated:** 2026-03-14 17:15

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Merged Argus 8¾a integration tests (43 tests). Fixed import error handling (server try-catch + client JSON parse fix). 536 tests (431 server + 105 client).
- **Next:** Await PO direction. Import bug needs re-test — error handling is fixed, but root cause of the 500 is unknown until user retries.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-14 17:15

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
