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
- **Last completed:** Phase 1 implementation — 47 new tests across 4 files. Cherry-picked to main, reviewed by Daedalus.
- **Assigned next:** Phase 2 — MockEventSource + hook tests, PLUS Step 8¾ validation tests. GO — approved by product owner.
  - Phase 2a: MockEventSource + hook tests (from TESTING-STRATEGY.md)
  - Phase 2b: Step 8¾ validation — kit briefing integration test (verify system prompt sent to API for imported channels), fork marker component test (MessageList with channelSource + mixed originalId messages), import context edge cases (large CLAUDE.md truncation, permission-denied paths, missing cwd)
  - Note: `git fetch origin` first — main has moved significantly since Phase 1 (Step 8¾ landed: `buildKitBriefing` export in `client.ts`, `channelSource` prop in `MessageList.tsx`, context capture in `import.ts`)
- **Waiting on:** Nothing — go ahead.
- **Updated:** 2026-03-12

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** working
- **Last completed:** Step 8¾ implementation (v0.8.5) — kit briefing, CLAUDE.md/MEMORY.md capture, fork marker, compaction verification. 279 tests passing (273 server + 6 client). Merged Argus Phase 1 tests.
- **Working on:** Finalizing Step 8¾, pending manual testing for v0.8.5 release.
- **Waiting on:** Product owner manual testing of fork marker + kit briefing.
- **Updated:** 2026-03-12

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
