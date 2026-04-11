# Changelog

All notable changes to Klatch are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions correspond to roadmap steps.

---

## [0.9.0] — 2026-04-10

### Step 9 Complete: Files & Context Architecture

The biggest release since Step 8. Files are now first-class citizens with their own domain model, scope-aware context injection at Layers 3 and 4, and upward promotion through scopes. The UI vocabulary is clarified with a full nomenclature guide. Compaction is research-backed and tuned for 1M-context models. Entities gain per-model effort control. AAXT scaffolded probing lays groundwork for automating the gap between structural and behavioral testing. The test suite grew from 727 to 849.

This release also marks Klatch's transition from "tools for xian" to "tools other people can try."

### Added — File Domain Model (Phases 1–5)

- **File domain model**: New `files` and `file_refs` tables with scope-aware references (message, channel, project, entity). Backfill migration from existing `message_artifacts`. Indexes on scope lookups.
- **Channel file pinning (Phase 2)**: Pin files to channels via `POST /api/files/pin`. Pinned files listed in Layer 4 system prompt as "Channel files available: ...". Pin/unpin UI on file cards. Pinned files section in channel settings.
- **Project knowledge base (Phase 3)**: Upload files to project knowledge base. Project files listed in Layer 3 system prompt as "Project knowledge base files: ...". Upload, view, and remove from project settings.
- **Dual-write completion (Phase 4)**: All file creation paths (`save_file` tool, upload endpoint, backfill migration) now consistently populate both `message_artifacts` and `files`/`file_refs`.
- **File promotion (Phase 5)**: `POST /api/files/:id/promote` promotes files upward (message → channel → project). Idempotent, additive (original refs preserved). "Promote to project" button on channel-pinned files.
- **File API endpoints**: `GET /api/projects/:id/files`, `GET /api/channels/:id/files`, `GET /api/entities/:id/files`, `GET /api/messages/:id/files`, `GET /api/files/:id/refs`.

### Added — Step 9a–d (File Upload & Artifacts)

- **File upload/attach (9a)**: Multipart file upload to channels. File attachment cards in messages. MIME detection with extension fallback. File storage on disk with served endpoint.
- **Artifact rendering (9b)**: Inline artifact rendering in messages.
- **Kit briefing file awareness (9c)**: Layer 1 includes file handling guidance for entities.
- **Code block save (9d-A)**: Save code blocks from messages as files. Smart filename detection from language hints and content.
- **Tool-based file creation (9d-B)**: `save_file` tool enables entities to create files natively during conversation.

### Added — Infrastructure

- **Per-entity effort parameter**: New `effort` column on entities (low/medium/high/max). Passed as `output_config: { effort }` in API calls. Model-aware defaults: Sonnet → medium, others → high. `max` restricted to Opus 4.6. Effort selector in entity settings, filtered by model capabilities.
- **Compaction threshold tuned**: Raised from 80K to 160K tokens (research-backed — 80K fired at 8% of 1M context, Claude Code uses 75%). Entity-attribution preservation instructions for roundtable/directed channels.
- **AAXT Scaffolded Probing Phase 1**: Probe generator, scorer, and auxiliary LLM client (GPT-4o-mini default, Haiku fallback). Reads prompt-debug layer status, generates targeted behavioral questions per layer, classifies responses against the AXT taxonomy. Implements the highest-priority recommendation from the AuditBench methodology review. `POST /api/channels/:id/aaxt-probe`, `GET /api/aaxt/status`.

### Changed

- **Nomenclature rename**: "System prompt" → "Channel context" (Layer 4) and "Role prompt" (Layer 5) across all UI surfaces. Terminology guide at `docs/NOMENCLATURE.md`.
- **File Domain Model phases resequenced**: Phases 6–7 (memory-as-file, entity library) deferred to Steps 10–11 where they deliver more user value.
- **Prompt-debug endpoint**: Now reports file info in both Layer 3 (project files) and Layer 4 (channel files) sections.

### Documentation

- RFC-001 Five-Layer Context Model response filed with Dispatch (Klatch authored the original model)
- Nomenclature guide (`docs/NOMENCLATURE.md`)
- File Domain Model design doc (`docs/plans/FILE-DOMAIN-MODEL.md`)
- Compaction threshold deep dive (`docs/research/compaction-threshold-deep-dive.md`) — recommends 80K → 160K
- Effort parameter evaluation (`docs/research/effort-parameter-evaluation.md`)
- AuditBench methodology review (`docs/research/auditbench-methodology-review.md`) — 4 cross-pollination recommendations for AXT
- AAXT Scaffolded Probing design spec (`docs/plans/AAXT-SCAFFOLDED-PROBING.md`)
- Blog: "Your Model or Theirs" (Tesler's Law), "What Doesn't Transfer" (Layer 5 calibration gap), "Paste It Again" (file domain model in plain language)
- Intelligence sweeps #5 and #6, plus first automated external scan (April 9)

### Team

- **Iris** joined as the team's first dedicated UX designer/developer (April 5). Named for the Greek goddess of the rainbow — messenger between gods and humanity. Working in parallel with Daedalus.
- **Metis** joined as Cowork-environment coordination (April 1). Cross-environment knowledge stewardship.

### Technical

- **849 tests passing** (710 server + 139 client), zero failures. Up from 727 at v0.8.9.
- Rounds 13–18: test infra fixes, feature tests, FDM coverage (58 FDM tests), compaction + effort coverage (Round 17, 18 tests), AAXT × FDM (Round 18, 12 tests).
- Root-level `npx vitest run` fixed (Vitest v4 workspace config).
- New tables: `files`, `file_refs`. New columns: `entities.effort`.
- New shared types: `FileRefScope`, `FileRefType`, `KlatchFile`, `FileRef`, `FileWithRef`, `EffortLevel`.
- Vitest workspace config at repo root (`vitest.config.ts`).
- GitHub #21 closed (stale kit briefing assertions).

---

## [0.8.9] — 2026-03-27

### Round 12: API Optimization & Kit Briefing

Five infrastructure wins that reduce cost, improve latency, and address MAXT Session 01 findings. The Models API dynamic discovery is the biggest architectural change — Klatch now fetches available models from the Anthropic API at runtime instead of maintaining a hardcoded list.

### Added
- **Auto-prompt caching**: `cache_control: { type: 'ephemeral' }` on all API calls. Automatic cache placement for multi-turn conversations — system prompt + conversation prefix cached at 10% of input token cost. One parameter, major cost reduction.
- **Models API dynamic discovery**: New `GET /api/models` endpoint fetches from Anthropic `GET /v1/models`, caches with 1-hour TTL, falls back to hardcoded list on failure. Returns model capabilities: thinking modes, effort levels, compaction support, max output tokens. Client `useModels()` hook with shared cache.
- **Kit briefing: current date injection (MAXT F4)**: "Today is Thursday, March 27, 2026" — fixes temporal gap where imported agents thought it was their last conversation date.
- **Kit briefing: layer awareness (MAXT F3 + F2)**: "Your context may include project instructions and project memory... You may access knowledge from these sources without being able to identify their origin." Addresses subliminal injection and compliance gap findings.
- **`thinking.display: "omitted"`**: Thinking tokens no longer streamed to client (Klatch doesn't surface them). Reduces time-to-first-token. Still billed but faster streaming.

### Changed
- All 6 client components updated from static `AVAILABLE_MODELS` imports to dynamic `getModelLabel()` / `useModels()` hook.
- Entity model selector now populated from API response (with static fallback).
- New `packages/client/src/hooks/useModels.ts` — shared model cache across all components.
- New `packages/server/src/routes/models.ts` — Models API route with cache and fallback.

### Technical
- 1041 tests passing (all pre-existing failures documented with root causes — see session log).
- Pre-existing test infrastructure issues cataloged: 3 root causes, fixes assigned to Argus Round 13.
- Subliminal scoring category (MAXT F2) already in quiz rubric since v4.1.

---

## [0.8.8] — 2026-03-20

### Quick Wins: Adaptive Thinking & Model Updates

### Added
- **Adaptive thinking**: `thinking: { type: 'adaptive' }` on both API call sites. Claude decides when and how deeply to reason.
- **Haiku 4.5**: Model selector updated from Haiku 3.5 to Haiku 4.5 (`claude-haiku-4-5-20251001`). Backward-compat alias for legacy DB records.
- **16K max_tokens**: Output limit bumped from 4096 to 16384.
- **Model provenance indicator (#20)**: Messages display which model generated them.
- **Klatch creation UI (#10)**: Create klatches (multi-entity channels) from sidebar.

### Changed
- `MODEL_ALIASES` map extended for backward compatibility with legacy model IDs.

---

## [0.8.7] — 2026-03-19

### Cloud Import & Session Browser

### Added
- **Cloud session import**: Three paths for importing JSONL from cloud agents: (1) agent self-export to `exports/sessions/`, (2) browser file upload (multipart), (3) manual path entry.
- **Buffer-based JSONL parsing**: `parseJsonlContent()` and `parseClaudeCodeSessionFromContent()` — parse from string instead of disk path.
- **Multipart upload**: `POST /import/claude-code` now accepts both JSON (path-based) and multipart (file upload).
- **Project basename matching**: When cloud cwd doesn't exist locally, fallback to matching by `path.basename(cwd)` — only if exactly one match.
- **Export directory convention**: `exports/sessions/` at repo root for agent self-export.
- **Session browser**: Updated to scan exported sessions alongside local sessions.

---

## [0.8.6] — 2026-03-18

### Sidebar Redesign & Prompt Architecture

Major design session with the PO produced a new sidebar, a reworked prompt model, and the first editable project UI. The sidebar now groups channels by project in an accordion layout with chat/klatch type distinction. System prompt assembly moves from 4 layers to 5 with memory promoted to a first-class project field. Calliope published a blog post on the design process.

### Added
- **Sidebar redesign (#8, Phases 1+2)**: Project-first accordion layout — one project expanded at a time, auto-expands project containing active channel. Channels typed as "chat" (1:1) or "klatch" (multi-entity group). Sub-headers only appear when both types exist within a project. Unassigned section for chats without a project.
- **Project settings panel**: Gear icon on project accordion headers opens full project editor. Editable name, instructions (CLAUDE.md), and memory (MEMORY.md). Source provenance badges for imported projects. Character counts on textareas.
- **Project memory column (Decision 1)**: New `memory` field on `projects` table. MEMORY.md and claude.ai memories stored separately from instructions. Injected as layer 3 in the 5-layer system prompt assembly.
- **claude.ai global memories preserved (Decision 2)**: Account-level `conversations_memory` from claude.ai exports now merged into project memory, labeled "Account memories (from claude.ai)".
- **Prompt debug endpoint (#9)**: `GET /channels/:id/prompt-debug` shows all 5 assembled prompt layers with per-layer status, lengths, and the final concatenated prompt.
- **Sort by activity (#12)**: Sidebar sorts chats by most recent message within each section.
- **Shared data model CSV**: `data-model-thoughts.csv` — living design artifact mapping concepts across claude.ai, Claude Code, and Klatch.

### Changed
- System prompt assembly now 5 layers (was 4): kit briefing → project instructions → project memory → channel addendum → entity prompt.
- Channel addendum (system prompt textarea) hidden for chats in settings UI (Decision 4) — only shown for klatches. Renamed to "Channel prompt".
- Kit briefing: memoryMd fallback from sourceMetadata now only for channels without a project link.
- Import routes: CLAUDE.md → `project.instructions`, MEMORY.md → `project.memory` (were previously concatenated).
- PATCH `/projects/:id` accepts `memory` field.

### Fixed
- Long project names wrapping in sidebar (P3: added `truncate` + `overflow-hidden`)
- Stale sidebar after import (P5: refresh channels on import dialog close)
- 14 pre-existing test failures: legacy test files running against real DB instead of in-memory mock

### Technical
- 683 tests passing (567 server + 116 client). 190 new tests since v0.8.5.
- New column: `projects.memory TEXT NOT NULL DEFAULT ''`
- New column: `channels.type TEXT NOT NULL DEFAULT 'chat'`
- New component: `ProjectSettings.tsx`
- New API functions: `fetchProject()`, `updateProjectApi()`
- Argus Rounds 6-8 merged: project reassignment, sidebar redesign, project memory tests
- Blog post: "You Can't Vibe Your Way to a Glossary" (Calliope)

---

## [0.8.5] — 2026-03-14

### Step 8¾: Import Refinements

Closes the fidelity gaps that the Theseus/Ariadne fork test revealed. Imported conversations now carry their full project context, and forked channels orient themselves correctly. The biggest release since Step 8 shipped — tests nearly doubled (266 → 493).

### Added
- **Project context injection (8¾a)**: First-class `projects` table. claude.ai imports auto-create projects from `projects.json` with prompt templates and knowledge docs. Claude Code imports create projects by `cwd` with CLAUDE.md and MEMORY.md content. 4-layer system prompt assembly: kit briefing → project instructions → channel prompt → entity prompt. Project API (full CRUD). `findOrCreateProject` idempotent by source identity.
- **Kit briefing verification (8¾b)**: Theseus Prime confirmed 0% phantom tool rate across all fork continuity tests. Kit briefing correctly orients imported conversations — agents know they're in Klatch without tool access.
- **claude.ai re-branching (8¾c)**: Already-imported conversations are now selectable for re-import. Visual states show "(re-branch)" vs "(already imported)". Submit button shows re-branch count. `forceImport` flag bypasses dedup, creates new channel with disambiguation suffix.
- **Claude Code session browser (8¾d)**: Scan `~/.claude/projects/` to discover importable sessions. Preview panel with message counts, timestamps, and import status. Multi-select import with progress tracking.
- **Model detection gaps documentation (8¾e)**: Documented that claude.ai exports contain no model info at any level. Decision: accept limitation, default to channel model.
- **Agent Experience Testing (AXT) research**: Fork Continuity Quiz v3, three-factor fidelity model (project context × compaction loss × knowledge location), 4-level fidelity framework.
- **memories.json char array fix**: Detects and joins character arrays (`["H","e","l","l","o"]` → `"Hello"`) in project memories. Bug discovered during Theseus Day 4 testing.
- **Project knowledge doc extraction**: Extracts and concatenates text from project knowledge documents in claude.ai exports.
- **Kit briefing deduplication**: CLAUDE.md content moves to project layer for linked channels; stays as fallback for legacy imports. No double-injection.

### Changed
- Import dialog updated: projects show "(instructions will be imported)", memories show "(included in project context)".
- System prompt now 4-layer instead of 2-layer (kit briefing and project layers added).
- Project instructions limit bumped to 32K characters.
- GitHub issue #5 (Step 8¾) closed with all criteria met.

### Technical
- 493 tests passing (388 server + 105 client). 227 new tests since v0.8.2.
- New tables: `projects` (id, name, instructions, source, source_metadata), `channels.project_id` FK.
- New routes: `GET/POST/PATCH/DELETE /api/projects`, project CRUD and channel linking.
- New queries: `findOrCreateProject()`, `getProjectForChannel()`, `setChannelProject()`, full project CRUD.
- `buildSystemPrompt()` updated for 4-layer assembly with project lookup.
- `extractFromZip()` now extracts projects, memories, and project memories from claude.ai exports.
- `joinIfCharArray()` utility for memories.json char array bug.
- Multi-agent team: Daedalus (architecture), Argus (quality, 4 test phases), Theseus Prime (AXT), Ariadne (Klatch-side), Hermes (research), Calliope (writing).

---

## [0.8.2] — 2026-03-11

### Step 8 Complete: Import & Unify

Step 8 is now fully shipped — Claude Code import, claude.ai import, fork continuity, and metadata framework. Klatch is now the single place where your Claude interactions live.

### Added
- **Phase 2 — Fork continuity**: Continue imported conversations with full context. Anthropic Compaction API integration for automatic summarization. CLAUDE.md context loading, session summary injection. History cap and empty message filtering for imported channels.
- **Phase 3 — claude.ai import**: Parse claude.ai ZIP data exports. Maps conversations to channels, extracts artifacts. Reuses Phase 1 import patterns.
- **Step 8½ — Metadata framework**: `getChannelStats()` returns message counts, artifact counts, tool breakdown per channel. `getAllChannelsEnriched()` enriched channel list with activity metadata. Sidebar project grouping — imported channels grouped by project (from `cwd` in source metadata), collapsible sections. Stats UI card in channel settings.
- **Import hardening**: Path traversal protection, file size limits, skip reporting for malformed events. 10 new hardening tests.
- **Multi-agent coordination**: Theseus Prime (manual testing) and Ariadne (forked Klatch-side perspective) added to the team. Session logs in `docs/logs/`.

### Fixed
- **Auth with Claude for Mac**: Claude for Mac sets `ANTHROPIC_API_KEY=""` in the child process environment. Dotenv's default is to not overwrite existing vars, so the `.env` file's valid key was silently ignored. Fixed with `override: true`.
- **6 bugs from Phase 2 live testing**: Fixed during integration pass (see `af80e48`).
- **Channel auto-naming**: Scan past queue-operation events to find `cwd` for imported channel names.

### Changed
- Channel list endpoint now returns enriched data (message counts, last activity).
- Roadmap updated: Step 9 is now Search & Recall (promoted), Step 10 is Files & Artifacts (deferred). Step 8¾ import refinements added as pre-Step 9 polish checkpoint.
- COORDINATION.md protocol now includes timestamp convention.

### Technical
- 266 tests passing (260 server + 6 client). 70 new tests since v0.8.1.
- New routes: `/api/import/claude-ai`, `/api/channels/:id/stats`
- New queries: `getAllChannelsEnriched()`, `getChannelStats()`
- Compaction state stored per-channel as JSON in `compaction_state` column
- Sidebar `useMemo` grouping with `Map<string, {name, channels[]}>` for O(n) project clustering

---

## [0.8.1] — 2026-03-10

### Step 8 Phase 1: Bug Fixes

Three bugs discovered during import testing and demo recording, all fixed.

### Fixed
- **Parser turn detection**: real Claude Code sessions form a linked list (`parentUuid` chains from each response to the next), not a tree with multiple roots. Only the very first event has `parentUuid=null`. Replaced root-detection with `isHumanTurnBoundary()` which identifies turn boundaries by finding user events with actual text content (vs system-injected `tool_result` blocks). A 5,365-event session now correctly produces 67 turns instead of 1.
- **Roundtable SSE race condition**: when the client opened an SSE connection for roundtable entities 2+, the in-memory emitter didn't exist yet (entity hadn't started streaming). The endpoint incorrectly treated "no emitter" as "already completed." Now checks DB status — if still `streaming` with no emitter, polls (200ms interval, 2-minute timeout) until the emitter appears or DB status changes.
- **ESM import hoisting / Anthropic auth failure**: `new Anthropic()` was called at module load time, before `dotenv.config()` ran in the server entrypoint (ESM hoists all `import` statements before module body code). Replaced with lazy-init `getAnthropicClient()` that defers construction to first use.

### Technical
- `isHumanTurnBoundary()` exported from parser for testability
- `groupIntoTurns()` rewritten: chronological boundary detection instead of BFS from parentUuid roots
- Demo seed script for mystery-menu roundtable (`scripts/seed-demo.ts`)
- **196 tests passing** (unchanged)

---

## [0.8.0] — 2026-03-09

### Step 8 Phase 1: Claude Code Import

Klatch can now import Claude Code JSONL sessions — the first step toward becoming the single pane of glass for all Claude interactions.

### Added
- **JSONL parser**: walks the `parentUuid` tree, extracts text turns, collapses tool-use into human-readable summaries. Classifies subagents by type (task/compaction/prompt_suggestion), extracts compaction summaries.
- **Import API**: `POST /api/import/claude-code` accepts a session file path, creates a channel with messages and artifacts. Dedup detection returns 409 if the session was already imported.
- **Message artifacts table**: `message_artifacts` stores tool-use, thinking, and image blocks at full fidelity with `tool_name` and `input_summary` columns for display.
- **Schema migration**: `source` and `source_metadata` on channels, `original_timestamp` and `original_id` on messages, new `message_artifacts` table with CASCADE delete.
- **Import UI**: sidebar import button, session path input modal, optional channel name, loading/error/success states, navigate to imported channel on completion.
- **Source badges**: "CC" badge on imported channels in sidebar. Import provenance section in channel settings (project, import date, event count, Claude Code version).
- **Auto-naming**: imported channels named `{project} — {YYYY-MM-DD}` from working directory and timestamp.
- 46 new tests: parser (23), import API (10), migration (18 total, 9 new). **196 tests passing**.
- Multi-agent coordination: Argus wrote test infrastructure (836 lines) defining parser and import API contracts; Daedalus implemented to match.

### Changed
- `createChannel` return value now includes `source: 'native'` for type consistency
- Architecture decision log updated through Step 8

---

## [0.7.0] — 2026-03-09

### Step 7: Interaction Modes

Three ways to orchestrate multi-entity conversations, plus sidebar grouping and entity handles.

### Added
- **Mode selector** in channel settings: panel, roundtable, directed
- **Roundtable mode**: entities respond sequentially, each seeing all prior responses in the round. Shared context builds a genuine discussion.
- **Directed mode**: @-mention routes messages to specific entities. Supports `@Name`, `@handle`, and `@"Quoted Name"` syntax.
- **@-mention autocomplete** in message input (directed mode): type `@` to see entity list, keyboard navigation, handle display
- **Entity handles** (slugs): optional short identifier per entity (e.g., `exec`, `cxo`). Used for quick @-mentions and displayed in UI.
- **Sidebar grouping**: channels split into **Roles** (@prefix, 1 entity) and **Channels** (#prefix, 2+ entities), inspired by Slack/Discord DM vs channel paradigm
- `parseMentions()` and `resolveMentions()` shared utilities for @-mention parsing
- `entityCount` on Channel type, computed via LEFT JOIN for sidebar grouping
- 36 new tests: mention parsing (24), directed mode API (4), sidebar grouping (4), entity handle CRUD (4). Total: **154 tests passing**.
- Mode-aware regenerate: regenerates using the correct mode's orchestration logic
- Hide mode selector for single-entity channels (only one mode makes sense)

### Changed
- Roundtable abort cleanup: all in-flight streams abort when any entity errors
- Website refreshed: light theme, updated roadmap, mentions both Claude agents

---

## [0.6.0] — 2026-03-08

### Step 6: Multi-Entity Conversations

The first feature impossible in claude.ai or Claude Code. Multiple Claude personas in one channel.

### Added
- **Entities**: named Claude personas with model, system prompt, and avatar color
- Entity CRUD API and management UI (create, edit, delete, color picker)
- Assign up to 5 entities per channel
- N parallel streams per user message (panel mode)
- Entity-aware message display: colored avatars, entity names, model labels
- Channel header shows entity pills with colored dots
- Channel system prompt becomes shared preamble prepended to each entity's prompt
- `channel_entities` join table for entity-channel assignments
- Default entity auto-assigned to new channels
- Backward compatible: single-entity channels look and work identically to before

### Infrastructure
- Multi-agent coordination protocol (`docs/COORDINATION.md`): Daedalus (architecture) + Argus (quality)
- Test count: 62 → 118
- CC BY 4.0 license

---

## [0.5.6] — 2026-03-08

### Added
- Light/dark theme system with semantic color tokens
- Theme toggle in sidebar footer
- K-Channel logo (SVG) in sidebar header

---

## [0.5.5] — 2026-03-08

### Added
- Responsive layout: mobile-first with collapsible sidebar drawer
- Hamburger menu on mobile, backdrop overlay
- Touch-friendly message input and controls

---

## [0.5.0] — 2026-03-07

### Step 5: Channel Identity

### Added
- Edit channel name and system prompt after creation
- Per-channel model selection (Opus, Sonnet, Haiku)
- Channel settings panel (expandable from header)
- Model change markers in conversation flow
- Confirmation step for clear history (two-click with auto-dismiss)

---

## [0.4.0] — 2026-03-07

### Step 4: Conversation Control

### Added
- Clear channel history with two-click confirmation
- Stop generation mid-stream (abort Anthropic SDK stream)
- Regenerate last assistant response
- Delete individual messages
- `APIUserAbortError` handling for clean stream cancellation

---

## [0.3.0] — 2026-03-07

### Steps 1–3: Foundation

### Added
- Single-channel Claude conversation with SQLite persistence
- Channel sidebar with creation and custom system prompts
- Independent conversation histories per channel
- Streaming responses via POST + SSE pattern
- Markdown rendering with syntax-highlighted code blocks
- Copy button on code blocks
- Hono API server + Vite React client monorepo
