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
