# Agent Coordination

Two agents work on this repo. This file is the async handoff protocol.

## How it works

1. When an agent finishes a unit of work, it updates its section below
2. It pushes the branch (including this file)
3. The other agent (or the human) reads this file to know what's ready

## Status board

### Argus (quality & test infrastructure)
- **Branch:** `claude/audit-and-planning-xn2w7`
- **Status:** working
- **Last completed:** Validation pass complete. Rebased on main, 231 tests passing. Code review of both import formats found no blockers. Flagged hardening items:
  - Path traversal: `sessionPath` expansion trusts user input; should validate against whitelisted directory.
  - HOME fallback: `process.env.HOME || ''` creates malformed paths; use `os.homedir()`.
  - Silent JSONL skip: Malformed lines are silently dropped; should report skip count.
  - Content size limits: No max artifact/message size validation; should enforce at HTTP layer.
  - Type safety: `as` casts on enum values from DB lack runtime validation.
  Also added "Permission controls and agent freedom" vision section to ROADMAP.
- **Assigned next:** Items 1-3 from hardening list above. **Note:** branch must rebase on current main — it predates Phase 2 Increments 2+3 (compaction, context loading). Do NOT merge branch as-is; it would revert shipped work.
- **Waiting on:** Rebase on current main before starting hardening work.

### Daedalus (architecture & implementation)
- **Branch:** `main`
- **Status:** available
- **Last completed:** Phase 2 complete — all 3 increments shipped and merged to main. (1) Imported channels talkable with history cap + empty filter. (2) Compaction API integrated via beta Messages API with context_management. (3) Context loading: CLAUDE.md load button, session summary button, contextual hints in ChannelSettings. Cherry-picked Argus's ROADMAP vision section. 241 tests passing.
- **Working on:** Nothing — ready for next assignment.
- **Waiting on:** Nothing.

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
- Update your section before every push
- If you need something from the other agent, say so in "Waiting on"
- Keep Notes short — link to docs/tests for details
