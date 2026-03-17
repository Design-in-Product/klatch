# Daedalus Session Log — March 16, 2026

**Started:** 08:03
**Model:** Claude Opus 4.6
**Branch:** main

## Session focus

Sidebar design session with PO. Review wireframe sketch, define key concepts, produce SIDEBAR.md requirements doc.

---

## 08:03 — Session start

Pulled from origin (up to date). Checked COORDINATION.md — Argus Round 6 assigned but not yet started. No new mail for Daedalus. Read yesterday's log for continuity.

PO has sketched a sidebar wireframe (`docs/plans/sidebar-wireframe.png`) and wants to:
1. Define key concepts clearly
2. Produce a SIDEBAR.md requirements doc

## 08:10 — Wireframe review

Reviewed PO's hand-drawn wireframe. Key elements I see:

**Left sidebar structure (top to bottom):**
- **Project switcher** at top — dropdown showing "A PROJECT" / "ANOTHER PROJECT" with "ACTIVE PROJECT" highlighted
- **Entity roster** under active project — @Daedalus, @Argus, @Calliope, @Mnemosyne, plus Theseus, Hermes, Ariadne, Secondes (mix of @ and non-@ suggests entity types?)
- **Channels section** — #standup, #coordination, #retro, #AXT, #water-cooler
- **"YET ANOTHER" section** — other projects with collapsed content
- **ORPHAN CHATS** — channels not assigned to any project
- **CTRLS** — bottom controls area

**Right content area:**
- Message bubbles from different entities (Daedalus standup, Argus standup) with timestamps
- Different bubble styles per role/entity

**Notes at bottom:**
- "only one project open at a time" — collapsible accordion behavior
- "multi project sidebar" title at top
- Entity list includes "#standup" notation — entities tied to channels?

Awaiting PO to talk through definitions.

## 08:14–08:44 — Design session with PO

Worked through terminology and concepts. Key outcomes:

**Glossary established:**
- **Chat** = 1:1 with Claude (imported or native). Belongs to 0 or 1 projects.
- **Klatch** = multi-entity group with orchestration. Belongs to exactly 1 project.
- **Unassigned** = chats with no project (working label for UI polish later).

**Architecture decision:** Keep single `channels` table, add `type: 'chat' | 'klatch'` column. Gall's Law — smallest increment.

**Sidebar structure:** Project accordion (one open) → Chats (top) → Klatches (bottom). Inverts Slack's paradigm. Unassigned section below projects for loose chats. Controls at bottom.

**Key rule:** Klatches require a project. No orphan klatches. Unassigned is chats-only.

PO confirmed alignment, asked for GitHub issue and Argus assignment.

## 08:50 — GitHub issue #8 + Argus assignments

Created issue #8: "Sidebar redesign: project-first accordion with chat/klatch distinction" with 4-phase implementation plan.

Assigned Argus:
- **Round 6** (existing): post-import project reassignment tests
- **Round 7** (new): sidebar redesign tests — type column migration, klatch-requires-project, sidebar grouping by type, unassigned excludes klatches, client accordion behavior

Updated COORDINATION.md. Starting implementation next.

## 10:20 — Phase 1+2 implementation: type column + sidebar redesign

Implemented both phases together since they're tightly coupled:

**Phase 1 — Data model:**
- Added `type TEXT NOT NULL DEFAULT 'chat'` column to `channels` table (migration in `db/index.ts`)
- Added `ChannelType = 'chat' | 'klatch'` to shared types
- Updated `rowToChannel()` to include `type`
- Updated `createChannel()` to accept optional `type` parameter
- Updated `importSession()` to explicitly set `type = 'chat'` on imported conversations
- Updated POST `/channels` endpoint to accept `type` in request body with validation
- Updated test setup (`setup.ts`) to include `type` column in in-memory schema

**Phase 2 — Sidebar UI:**
- Rewrote `ChannelSidebar.tsx` with project-first accordion layout
- **Accordion behavior:** one project expanded at a time; auto-expands project containing active channel
- **Within each project:** Chats section (top) → Klatches section (bottom). Sub-headers only show when both types exist.
- **Unassigned section:** Below projects, always visible. Shows chats without a project assignment.
- Removed old Roles/Channels grouping (was based on entityCount)
- Updated 3 client tests: "Imported" → "Unassigned", Roles/Channels → Chats/Klatches, collapse test uses Unassigned

**Test results:** 622 total (516 server + 106 client), zero failures.

## 14:30 — Theseus testing report review + bug fixes

Reviewed Theseus's Day 6 testing report (6 findings, P1-P6). Analysis:

**P1 — "System prompt not attaching"** — NOT A BUG. This is working as designed. The admin UI shows the channel's `system_prompt` field (layer 3, intentionally empty for imports). The actual prompt sent to Claude is assembled dynamically at stream time by `buildSystemPrompt()` — 4 layers: kit briefing + project instructions + channel addendum + entity prompt. Verified DB: Piper Morgan project has full v6.0 instructions and channels are correctly linked. The confusion is a UX gap: the admin UI doesn't show the *assembled* prompt. Filed as future improvement.

**P2 — No klatch creation UI** — Correct, this is Phase 3 of issue #8. On the roadmap.

**P3 — Project name wrapping** — FIXED. Added `truncate` to project name span and `overflow-hidden min-w-0` to parent button in sidebar accordion.

**P4 — "Save blocked on project-only reassignment"** — NOT A BUG. The project dropdown already saves immediately via `onSave({ projectId })` on change (no Save button needed). The mode toggle works the same way. Text fields (name, system prompt) use the Save button pattern. Mixed metaphor is confusing but functional. May add visual confirmation later.

**P5 — Stale sidebar after import** — FIXED. Added `fetchChannels().then(setChannels)` to the import dialog's `onClose` handler so sidebar refreshes with enriched project data when the dialog is dismissed.

**P6 — Entities panel in chats** — Valid UX concern, deferred. Lower priority.

All fixes verified: 622 tests, zero failures.

## 15:45 — GitHub issues filed + sort-by-activity shipped

Filed 6 GitHub issues from the testing findings and PO discussion:
- **#9** — System prompt assembly: admin UI doesn't show dynamic 4-layer prompt (P1)
- **#10** — Add klatch creation UI (P2)
- **#11** — Entity panel confusing for 1:1 chats (P6)
- **#12** — Sort chats by last activity, most recent first
- **#13** — Kit briefing should be foregrounded, not invisible
- **#14** — Channel settings: mixed save patterns confuse users

Shipped #12 immediately — sidebar now sorts chats within each section by `lastMessageAt` desc, newest first. Commit `f4fab47`.

## 16:00 — Architecture discussion: prompt layers + kit briefing foregrounding

PO wants to discuss the 4-layer prompt architecture before Phase 3. Key insight: the P1 "bug" is actually a UX representation problem — the system works but the user can't see it working. Two threads:
1. How should the admin UI represent the assembled prompt (showing all 4 layers)?
2. Should the kit briefing create an observable transition moment for the agent?

PO finds the wireframe-then-discuss workflow efficient. Next step: PO will sketch a domain model bridging prompt concerns, then review together as with the sidebar wireframe.

## 16:15 — Deep prompt architecture discussion

Built debug endpoint (`GET /channels/:id/prompt-debug`) to verify what agents actually receive. Returns all 4 layers with status + the assembled prompt. Shipped as `bd1d6b2`.

Explained to PO: the CIO likely does "see" the kit briefing but doesn't surface it because system prompt is subtext (shapes behavior, doesn't prompt disclosure). Need empirical verification via debug endpoint.

Clarified channel addendum vs entity prompt distinction:
- **Entity prompt** = who you are (travels with the entity everywhere)
- **Channel addendum** = where you are / what's happening here (applies to everyone in this channel)
- For chats: channel addendum is vestigial (no "room" concept in 1:1)

## 16:30 — Data source mapping table + decisions

Created comprehensive table mapping every context data element across all three source paths (claude.ai import, Code import, Klatch native). Identified 5 gaps. Committed to `docs/plans/prompt-architecture-audit.md`.

**Four decisions locked with PO:**
1. MEMORY.md → project level (add `memory` column to projects table)
2. Don't drop claude.ai memories — normalize and store
3. Role/persona is future opportunity; manual customization for now
4. Channel addendum hidden in chat UI; only shown for klatches

**Note for Calliope:** PO suggests today's design session (sidebar wireframe → glossary → prompt architecture audit) might make a good blog post. The PO's sketches could be visually interesting for illustration.

PO is now sketching a domain model. Implementing approved decisions while they draw.

## 18:40 — Decision implementation (context swap)

Resumed after context window swap. Implemented three of the four locked decisions:

**Decision 1: MEMORY.md → project level** ✅
- Added `memory TEXT NOT NULL DEFAULT ''` column to `projects` table (migration + test schema)
- Added `memory` field to `Project` interface in shared types
- Updated all project CRUD: `rowToProject`, `createProject`, `updateProject`, `findOrCreateProject`
- **Claude Code import**: MEMORY.md → `project.memory` (separate from `project.instructions` = CLAUDE.md)
- **claude.ai import**: project-scoped memories → `project.memory` (separate from `project.instructions` = prompt_template)
- System prompt assembly now 5 layers: kit briefing → project instructions → project memory → channel addendum → entity prompt
- Legacy fallback preserved: channels without project link still get sourceMetadata fallback via kit briefing
- PATCH `/projects/:id` accepts `memory` field
- prompt-debug endpoint updated for 5 layers

**Decision 2: Don't drop claude.ai global memories** ✅
- Global `conversations_memory` from claude.ai exports now merged into each project's `memory` field
- Labeled as "Account memories (from claude.ai)" to distinguish from project-scoped memories
- Unassigned channels still get memories via sourceMetadata legacy fallback

**Decision 4: Hide channel addendum for chats** ✅
- ChannelSettings.tsx: system prompt textarea only renders when `channel.type === 'klatch'`
- Removed the CLAUDE.md/session summary loading buttons (those are now handled at project level)
- Renamed label from "System prompt" to "Channel prompt" for clarity

Decision 3 (role/persona = future opportunity, manual for now) requires no code changes — it's a design constraint, not a feature.

**Test results:** 624 total (518 server + 106 client), zero failures.

## 20:00 — Project settings panel + Argus Round 8

Built the Project Settings panel (priority B from prioritization):
- New `ProjectSettings` component: name, instructions, memory — all editable with save/cancel
- Source provenance badge for imported projects (CC/AI with path and import date)
- Char counts shown below textareas (instructions can be large)
- `font-mono` on textareas since instructions/memory are typically code/markdown
- Gear icon on project accordion headers in sidebar (shows on hover)
- Wired into App.tsx: clicking gear opens project settings in the main panel area
- Mutual exclusion: opening project settings closes channel settings and vice versa
- API client: added `fetchProject()` and `updateProjectApi()` functions

Also wrote Argus Round 8 assignment (project memory + prompt assembly tests) and pushed to origin.

**Test results:** 624 total (518 server + 106 client), zero failures.

## 21:25 — Argus Rounds 6-8 merge + legacy test fix

Selectively merged Argus's completed work from `origin/claude/audit-and-planning-xn2w7`:
- **Round 6** (14 tests): project reassignment via PATCH, channel name prefixing, fetchProjects API
- **Round 7** (11 tests): type column, sidebar grouping by type, accordion behavior
- **Round 8** (24 tests): project memory CRUD, import memory routing, 5-layer prompt assembly
- **Client** (10 tests): sidebar redesign — project accordion, chat/klatch sections, unassigned

Had to selectively cherry-pick — Argus's branch was stale (branched before ProjectSettings commit), so their client changes would have reverted the new component. Took only test files and docs.

Also applied Argus's recommended fix for 14 pre-existing test failures: added `import './setup.js'` to 4 legacy test files (queries, channels, entities, metadata) that were running against real `klatch.db` instead of in-memory test DB.

**Test results:** 683 total (567 server + 116 client), zero failures.

## Session summary

Massive design day. Started with sidebar wireframe review, ended with full prompt architecture audit and three shipped decisions.

**Design work:**
- Sidebar wireframe → glossary (Chat/Klatch) → GitHub issue #8
- Prompt architecture deep dive → 5-layer model → data source mapping table
- Prioritization: B (project settings) → A (model provenance) → D (klatch creation) → E (import merge)
- Shared data model CSV as living design document

**Shipped:**
- Sidebar redesign Phase 1+2 (type column, project-first accordion)
- Decision 1: MEMORY.md → project level (memory column on projects)
- Decision 2: Don't drop claude.ai memories (merged into project memory)
- Decision 4: Hide channel addendum for chats
- Project settings panel (name, instructions, memory — all editable)
- Sort-by-activity (#12)
- P3 truncation fix, P5 stale sidebar fix
- prompt-debug endpoint
- 14 pre-existing test failures fixed
- 6 GitHub issues filed (#9-#14)

**Test count:** 683 (up from 516 at session start). Zero failures.

**Tomorrow:** PO tests project settings panel. Then model provenance indicator (A) and klatch creation UI (D).
