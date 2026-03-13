# Step 8 Remaining Work — Gameplan

**Date:** 2026-03-13
**Status:** Draft for product owner review

## Context

Step 8 (Import & Unify) is ~95% complete. Core import flows for both Claude Code and claude.ai work, including selective browse, dedup detection, re-import handling, fork continuity, kit briefing, and metadata framework. 450 tests passing.

This plan covers the remaining work to close Step 8 before moving to Step 9 (Search).

## What's Left

### 8¾a — Project context injection for claude.ai imports

**Problem:** When importing from claude.ai, the kit briefing fires but has no project context to inject. Claude Code imports can read CLAUDE.md and MEMORY.md from the filesystem, but claude.ai imports can't — there's no `cwd` to read from.

**What we found in the ZIP:**
- `projects.json` contains `prompt_template` (the project system prompt) — confirmed present for Piper Morgan, VA Decision Reviews, Play Acting Piper Morgan
- `projects.json` also contains `docs` array (project knowledge files) with content
- `memories.json` contains user memories (project-scoped)
- `conversations.json` does **NOT** contain `project_uuid` — we cannot automatically link conversations to projects from the ZIP alone
- **No model info anywhere** in the export — this is a claude.ai limitation

**Design:**
1. At import time, extract `prompt_template` from each project in the ZIP
2. Store project system prompts in `source_metadata` on imported channels
3. Let the user associate a conversation with a project during the selective import flow (dropdown or grouping UI)
4. Inject the project's system prompt into the channel's kit briefing and/or system prompt field
5. For memories: store in `source_metadata` and inject into kit briefing (project-wide context)

**Manual workaround (parallel):** Allow users to paste context directly into a channel's system prompt field — this works today but isn't import-specific. A "paste from claude.ai" helper or memory editor could make this smoother.

**Scope:** Medium. Server: extract + store prompt_template and memories. Client: project association UI in browse panel. Kit briefing: inject project prompt.

### 8¾b — Kit briefing verification for claude.ai imports

**Problem:** Theseus testing (Mar 11-12) found kit briefing not firing for claude.ai imports. Code audit shows the kit briefing code handles both sources. Needs a clean re-test with the uncontaminated protocol (neutral prompt first, then quiz).

**Action:** Manual test only — no code change expected. If the test reveals a bug, fix it.

**Scope:** Small. 30-minute manual test session.

### 8¾c — Claude.ai re-import with deliberate re-branching

**Problem:** Re-importing from claude.ai currently skips already-imported conversations silently. Works fine for "get new stuff." But users should also be able to deliberately re-branch an already-imported conversation (e.g., the conversation grew since last import).

**What exists:** Claude Code re-import already supports Replace / Import as new / Cancel. Claude.ai imports skip duplicates automatically.

**Design:** In the selective import browse panel, already-imported conversations are currently grayed out. Instead:
- Show them as selectable with a visual indicator ("already imported — will re-branch")
- When imported, use the existing fork-again logic (disambiguation suffix)
- Optionally show a diff: "12 new messages since last import"

**Scope:** Small-medium. Server: allow re-import of selected conversations. Client: update browse panel to allow selecting already-imported items.

### 8¾d — Claude Code session browser

**Problem:** Importing from Claude Code requires knowing the exact JSONL path. Users should be able to browse available sessions.

**Design:**
- New endpoint: `GET /api/import/claude-code/sessions` — scans `~/.claude/projects/`, returns directory tree with session metadata (file size, date, line count)
- Client: "Browse..." button in Claude Code import mode → shows project tree with sessions
- Dedup detection per session (mark already-imported)
- Multi-select import

**Scope:** Medium. Server: filesystem scan + metadata extraction. Client: tree browser UI.

### 8¾e — Model detection gaps

**Finding:** claude.ai exports contain NO model information — not at conversation, message, or project level. This is a platform limitation we can't work around.

**Options:**
1. Accept the limitation — all claude.ai imports default to channel default model (currently Opus). Document this.
2. Let users set model per-conversation during selective import (dropdown in browse panel). Stored in source_metadata.
3. Heuristic: parse conversation names for model hints (e.g., "(o4.6)", "(haiku)") — fragile, user-convention dependent.

**Recommendation:** Option 1 (accept) + Option 2 (manual override in browse panel) as a nice-to-have. Don't try to infer.

**Scope:** Small if we just document. Small-medium if we add the dropdown.

## Proposed Order

| Phase | Work | Why this order | Assignee |
|-------|------|----------------|----------|
| **1** | 8¾b: Kit briefing re-test | Validates before we build on top of it | Theseus + PO |
| **2** | 8¾a: Project context injection | Highest value — unlocks cross-project import fidelity | Daedalus |
| **3** | 8¾c: claude.ai re-branching | Completes the re-import story for both sources | Daedalus |
| **4** | 8¾d: Claude Code session browser | Quality-of-life for CC imports | Argus |
| **5** | 8¾e: Model documentation | Accept + document the limitation | Daedalus (docs) |

Phase 1 is a dependency — if kit briefing is broken, we need to fix it before injecting project context through it. Phases 2-4 can run in parallel after that.

## GitHub Issues

**Close:** #3 (v0.6 multi-entity) and #4 (v0.7 interaction modes) — both completed.

**Update #5 (v0.8):** Refresh body with current status, mark completed sub-items, add remaining work from this plan.

**Keep #6 (v0.9) open:** Unchanged, next after Step 8 closes.

## Agent Assignments

### Daedalus
- **8¾a:** Project context injection (prompt_template extraction, storage, kit briefing injection, project association UX in browse panel)
- **8¾c:** Claude.ai re-branching (update browse panel to allow selecting already-imported items, wire to fork-again logic)
- **8¾e:** Document model detection limitation

### Argus
- **8¾d:** Claude Code session browser (filesystem scan endpoint, tree browser UI, tests)
- **Tests** for 8¾a and 8¾c after Daedalus delivers

### Theseus + PO
- **8¾b:** Kit briefing re-test (clean protocol: neutral prompt → quiz → analysis)
- Manual testing of all deliverables

## Definition of Done for Step 8

All of the following are true:
- [ ] Kit briefing fires and injects context for both Claude Code and claude.ai imports (verified by clean test)
- [ ] claude.ai imports capture and inject source project system prompts
- [ ] claude.ai imports can selectively re-branch already-imported conversations
- [ ] Claude Code sessions can be browsed from `~/.claude/projects/`
- [ ] Model detection limitation documented
- [ ] All tests pass
- [ ] GitHub issue #5 closed
