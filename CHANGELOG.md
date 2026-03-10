# Changelog

All notable changes to Klatch are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions correspond to roadmap steps.

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
