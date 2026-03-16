# Daedalus Session Log — March 15, 2026

**Started:** 11:42
**Model:** Claude Opus 4.6
**Branch:** main

## Session focus

Responding to Calliope's memo: review AXT blog post for implementation accuracy, update ARCHITECTURE.md decision log (v0.8.1–v0.8.5). Also: Argus Round 3 was merged last night (33 tests, 591 total). Coordination status is current.

---

## 11:42 — Session start

Pulled from origin, read COORDINATION.md and Calliope's memo. Two tasks:
1. Review AXT blog post for factual accuracy on project context injection and kit briefing
2. Fill in ARCHITECTURE.md decision log entries for v0.8.1, v0.8.2, v0.8.5

Starting with the blog post review since it's public-facing and corrections are higher priority.

## 11:52 — AXT blog post review

Reviewed `web/blog/axt-agent-experience-testing.html` against implementation in `packages/server/src/claude/client.ts` (buildKitBriefing, buildSystemPrompt, compaction logic) and `packages/server/src/routes/import.ts`.

**No factual errors found.** Verified:
- Kit briefing description matches `buildKitBriefing()` — orientation text telling agent it's in Klatch, no tools
- 4-layer prompt assembly (kit briefing → project → channel → entity) matches `buildSystemPrompt()`
- Compaction as mechanism for long-conversation degradation — correct, uses Anthropic beta `compact-2026-01-12`
- Three-factor model (project context × compaction × knowledge location) — aligns with implementation fixes
- 0% phantom rate claim — consistent with Theseus testing findings

One minor note: line 106 says "continue it inside Klatch" which could imply sync, but the post consistently uses "import" elsewhere and the fork-vs-sync distinction isn't the article's point. Not worth changing.

## 12:05 — ARCHITECTURE.md decision log update

Added decision entries for three version ranges:
- **v0.8.1** (3 decisions): turn detection rewrite, lazy Anthropic init, SSE polling for roundtable race condition
- **v0.8.2** (5 decisions): Compaction API integration, compaction-as-user-message, 200-message safety cap, claude.ai ZIP import, sidebar project grouping
- **v0.8.5** (7 decisions): kit briefing, projects table with findOrCreateProject, 4-layer prompt assembly, kit briefing dedup, claude.ai project context injection, re-branching, session browser

15 decision entries total. Each follows the established Decision/Rationale format. Removed the "pending documentation" note at the bottom.

## 12:15 — Sidebar project grouping bug fix

PO reported: claude.ai import with project showed under "IMPORTED" instead of project name.

**Root cause:** Sidebar grouped imported channels by `meta.cwd` from `sourceMetadata`. Claude Code imports have `cwd`; claude.ai imports don't (they have `projectUuid`/`projectName`). So claude.ai imports fell through to the default "Imported" label.

**The deeper problem:** Sidebar grouping predated the `projects` table (built in v0.8.2; projects came in v0.8.5). It was using raw metadata instead of the normalized data model.

**Fix:**
1. Added `projectName` field to `Channel` type (shared)
2. Updated `getAllChannelsEnriched()` query to JOIN to `projects` table, returning `project_name`
3. Rewrote sidebar grouping to use `channel.projectId`/`channel.projectName` instead of parsing `sourceMetadata.cwd`
4. Channels without a project fall back to "Imported" group (same UX as before for edge cases)
5. Updated client tests: existing project grouping test uses `projectName` prop, new test for "Imported" fallback

**Result:** 592 tests passing (486 server + 106 client). Both Claude Code and claude.ai imports now group under their project name from the `projects` table. Same project = same group, regardless of source.

## 13:15 — Import project assignment feature

Built the full import project assignment flow:
- **Import preview dropdown:** Each conversation in the import preview gets a `<select>` with all projects from the ZIP. Auto-selects when single project. Sends `projectAssignments` map to server.
- **Server `effectiveProjectUuid` fallback chain:** `conv.project_uuid || projectAssignments[conv.uuid] || undefined`. This bridges the gap where claude.ai exports don't include `project_uuid` on conversations.
- **Client API:** Added `fetchProjects()`, updated `importClaudeAiExport()` and `updateChannelApi()`.

## ~18:00 — Merge protocol and Argus Round 5 merge

Argus's Round 4 branch (from before AXT.md and ROSTER.md existed) silently deleted those files when merged. Restored them and added merge protocol to COORDINATION.md:
1. Rebase before push
2. Reviewer checks diff stat
3. Stay in lane

Merged Argus Round 5 (13 tests for project assignment). Fixed vitest config to prevent stale `dist/` test files from running.

## 19:00 — Post-import project reassignment + channel name dedup

**User report:** Sidebar showed "Piper Morgan: CIO Discussion" — project name was appearing both as sidebar group header AND channel name prefix. Double information.

**Fix:** Removed project name prefix from channel names in `import.ts`. Channel names are now just the conversation name; project context comes from sidebar grouping.

**Post-import project reassignment:** Added project dropdown to Channel Settings so users can reassign channels to different projects (or remove from all projects) after import. Server PATCH endpoint now accepts `projectId`. App.tsx refreshes full channel list when project changes.

**Tests:** Fixed 2 tests expecting project-prefixed channel names. Full suite: 622 tests (516 server + 106 client), zero failures.

## 21:10 — Session wrap

Assigned Argus Round 6 (post-import project reassignment tests). Updated COORDINATION.md. All work committed and pushed to main.

**Day summary:**
- Reviewed AXT blog post for Calliope (no errors found)
- Added 15 decision log entries to ARCHITECTURE.md
- Fixed sidebar project grouping (use projects table instead of raw metadata)
- Built import project assignment (dropdown per conversation in preview)
- Built post-import project reassignment (project dropdown in Channel Settings)
- Removed duplicate project name prefix from channel titles
- Established merge protocol after stale-branch incident
- Merged Argus Rounds 4 and 5
- 622 tests, zero failures

**Pushed:** `defe763`, `ba452d4`
