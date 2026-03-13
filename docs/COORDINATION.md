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
- **Prior delivery:** Phase 4 selective import browser (2026-03-13 06:01). ZIP preview endpoint, selective filter, browse UI.
- **Working on:** Session briefing, roadmap review, awaiting direction.
- **Waiting on:** Nothing.
- **Updated:** 2026-03-13

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Re-import handling (2026-03-12). Enriched 409 with conflict info, forceImport param, conflict resolution UI (Replace/Import as new/Cancel). 419 tests (329 server + 90 client).
- **Also completed today:** Copy message button, project name resolution for claude.ai imports, Argus Phase 3 merge.
- **Waiting on:** User testing of re-import + project name with fresh claude.ai download.
- **Next:** Plan project knowledge file ingestion from projects.json.
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
