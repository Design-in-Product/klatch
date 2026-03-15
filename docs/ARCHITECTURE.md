# Architecture Log

## Decisions Record

### 2026-03-07: Project Inception

**Decision**: Standalone web app, not Slack integration.
**Rationale**: Full control over UX, no external dependencies, can tailor everything to Claude's capabilities (tool use visualization, multi-entity chat, etc).

**Decision**: Vite + React over Next.js.
**Rationale**: No SSR/edge deployment needed. Local-first single-user tool. Vite is faster to iterate on, zero opinions about the server.

**Decision**: Hono over Express.
**Rationale**: 14kB, TypeScript-native, built-in SSE streaming. Express is legacy bloat for a new 2026 project.

**Decision**: SSE over WebSockets for streaming.
**Rationale**: Communication is fundamentally unidirectional (server→client for token streaming). SSE auto-reconnects, works through proxies, maps directly to how the Anthropic SDK works internally.

**Decision**: POST + SSE pattern (separate message creation from stream observation).
**Rationale**: A streaming POST response can't be retried, can't be observed by other tabs, and is harder to cancel. Separating them gives idempotent retry and future multi-tab/multi-entity support.

**Decision**: SQLite via raw better-sqlite3 (no ORM).
**Rationale**: 3 tables don't need Drizzle. Synchronous reads are fast. Full visibility into queries. Add ORM when complexity warrants it (likely Step 6: multi-entity chat).

**Decision**: npm workspaces (no Turborepo).
**Rationale**: One developer, three packages. Turbo's caching/orchestration adds overhead for a project where `npm run dev` takes <1s.

**Decision**: Default model is Opus 4.6 (`claude-opus-4-20250514`).
**Rationale**: User preference for best-quality responses from day one.

### 2026-03-07: Step 4 — Conversation Control

**Decision**: Two-click confirmation for destructive actions (clear history).
**Rationale**: First click shows "Confirm clear?" with 3-second auto-dismiss. Prevents accidental data loss without adding a modal interruption.

**Decision**: Abort via `.abort()` on Anthropic SDK stream, catch `APIUserAbortError`.
**Rationale**: Clean cancellation that stops both the API call and the SSE stream. No orphan token accumulation.

### 2026-03-08: Step 5 — Channel Identity

**Decision**: Per-channel model selection (not global).
**Rationale**: Different conversations benefit from different models. Opus for deep work, Sonnet for speed, Haiku for quick tasks. The channel *is* the context for model choice.

**Decision**: Responsive mobile-first layout (v0.5.5) before multi-entity (Step 6).
**Rationale**: User priority. Running Klatch on a phone matters more than fancy features on desktop.

**Decision**: Semantic color tokens for theming (v0.5.6).
**Rationale**: A single set of `--color-*` variables that both light and dark themes override. Components reference semantics (`--color-bg-primary`), not values. Makes future theme changes trivial.

### 2026-03-08: Step 6 — Multi-Entity Conversations

**Decision**: Entities as first-class objects, not channel properties.
**Rationale**: An entity (name, model, system prompt, color) can be reused across channels. The `channel_entities` join table enables N:M relationships.

**Decision**: Channel system prompt becomes shared preamble, prepended to each entity's prompt.
**Rationale**: The channel prompt sets the scene; each entity's prompt defines their role within it. This is how you get a "marketing team" channel with distinct personas that all share context.

**Decision**: Cap at 5 entities per channel.
**Rationale**: Practical limit. Each entity generates a parallel stream per user message. More than 5 creates UX noise and API cost without proportional value.

**Decision**: Multi-agent development (Daedalus + Argus).
**Rationale**: Two Claude Code agents with complementary roles (architecture/implementation vs. quality/testing) can work asynchronously via COORDINATION.md. Step 6 was the first feature built this way.

### 2026-03-09: Step 7 — Interaction Modes

**Decision**: Three modes — panel, roundtable, directed — not a single "best" approach.
**Rationale**: Each mode reflects a different conversational pattern. Panel = brainstorm. Roundtable = deliberation. Directed = consultation. Forcing one mode would limit the product's expressiveness.

**Decision**: Sidebar grouping — Roles (@prefix, 1 entity) vs Channels (#prefix, 2+ entities).
**Rationale**: Single-entity channels are fundamentally different from multi-entity ones. Splitting them in the UI makes the distinction immediate. Borrowed from Slack's DMs vs channels paradigm.

**Decision**: Entity handles for @-mentions (optional short slugs).
**Rationale**: Typing `@Chief Executive Officer` is painful. Handles like `@exec` enable quick directed messages. Optional because not every entity needs one.

### 2026-03-09: Step 8 Phase 1 — Claude Code Import

**Decision**: Fork, don't sync. Imports are snapshots.
**Rationale**: Claude Code sessions are live, evolving files. Syncing would require file-watching, conflict resolution, and write-back — complexity that doesn't serve the use case. An import captures a point-in-time snapshot. Continuing the conversation in Klatch forks into Klatch-native chronology.

**Decision**: Store full-fidelity data, display collapsed.
**Rationale**: Tool-use blocks (~80% of Claude Code events) are stored in `message_artifacts` but not shown inline. The conversation view shows human-readable turns. Full detail is preserved for future introspection features.

**Decision**: `message_artifacts` table with `tool_name` and `input_summary` columns.
**Rationale**: Lightweight summaries ("Read file: src/App.tsx", "Ran: npm test") give import provenance without rendering raw tool JSON. The `content` column stores the full original block for fidelity.

**Decision**: Dedup via `json_extract(source_metadata, '$.originalSessionId')`.
**Rationale**: Detect-and-warn (409 response) rather than silent skip or silent duplicate. The user decides whether to re-import.

**Decision**: Turn grouping via BFS on the `parentUuid` tree.
**Rationale**: Claude Code events form a tree (parallel tool calls branch). BFS from each root (`parentUuid=null`) collects all events belonging to one human turn, then flattens into user text + assistant text + tool artifacts.

**Decision**: Test-driven contract between agents (Argus writes tests, Daedalus implements).
**Rationale**: Argus's 836 lines of test infrastructure defined the parser and import API contracts before implementation began. This inverted the usual flow and caught interface mismatches early — the parser output shape was reconciled to match the test contract, not the other way around.

### 2026-03-10: v0.8.1 — Phase 1 Bug Fixes

**Decision**: Replace BFS root-detection with `isHumanTurnBoundary()` for turn grouping.
**Rationale**: Real Claude Code sessions form a linked list (`parentUuid` chains), not a tree with multiple roots. Only the very first event has `parentUuid=null`. A 5,365-event session produced 1 turn instead of 67 under the old logic. Boundary detection by content (finding user events with actual text vs. system-injected `tool_result` blocks) matches how Claude Code actually structures events.

**Decision**: Lazy-init `getAnthropicClient()` instead of top-level `new Anthropic()`.
**Rationale**: ESM hoists all `import` statements before module body code runs. The Anthropic constructor was executing before `dotenv.config()` in the server entrypoint, causing auth failures. Lazy init defers construction to first use, after env vars are loaded. Also fixes the Claude for Mac issue where `ANTHROPIC_API_KEY=""` is set in the child process environment (fixed with `dotenv({ override: true })`).

**Decision**: SSE polling for roundtable entities 2+ ("emitter not yet created" case).
**Rationale**: In roundtable mode, entities stream sequentially. When the client opens an SSE connection for entity 2 before entity 1 finishes, there's no emitter yet. The original code treated "no emitter" as "already completed." Now checks DB status — if `streaming` with no emitter, polls at 200ms until the emitter appears or status changes. Two-minute timeout prevents orphan connections.

### 2026-03-11: v0.8.2 — Fork Continuity & claude.ai Import

**Decision**: Anthropic Compaction API (`compact-2026-01-12` beta) for imported channel continuation.
**Rationale**: Imported conversations can have thousands of messages. Sending raw history would overflow the context window. The Compaction API summarizes automatically when input exceeds a threshold (80K tokens). Compaction is enabled only for non-native channels (imported sessions are the ones with long histories). Summary stored per-channel in `compaction_state` JSON column.

**Decision**: Compaction summary injected as a synthetic `user` message at the start of history, not as system prompt.
**Rationale**: The summary is conversational context, not instruction. Placing it in the message history (as a user turn) lets the model treat it as "what we discussed" rather than "how to behave." `coalesceMessages()` handles the case where the first real message after the boundary is also a user message.

**Decision**: Safety cap of 200 messages for non-compacted history.
**Rationale**: Native channels (no compaction) could grow unbounded. 200 messages is well within context limits for normal conversation. When compaction state exists, the cap is bypassed — compaction manages length instead.

**Decision**: claude.ai import via ZIP file parsing, reusing Phase 1 import patterns.
**Rationale**: claude.ai's data export is a ZIP containing `conversations.json` (array of conversation objects with `chat_messages`). The parser maps claude.ai's format to the same `ImportTurn` structure used by Claude Code import. Dedup uses the conversation UUID as `originalSessionId`. Same `importSession()` DB function, same 409-on-duplicate pattern.

**Decision**: Sidebar project grouping via `cwd` from source metadata.
**Rationale**: Imported Claude Code sessions carry their working directory. Grouping by `cwd` creates natural project clusters without requiring users to organize manually. Implemented as `useMemo` grouping in the sidebar with `Map<string, {name, channels[]}>` for O(n) clustering.

### 2026-03-13–14: v0.8.5 — Kit Briefing, Project Context, 4-Layer Prompt

**Decision**: Kit briefing — orientation text injected into system prompt for imported channels.
**Rationale**: The Theseus/Ariadne fork test revealed that imported agents experience "silent capability loss." They retain conversational memory but don't know they've lost tools, file access, and search. The kit briefing explicitly tells the model: you're in Klatch, conversation-only, no tools. This eliminated phantom tool beliefs (0% phantom rate across all post-kit tests). The briefing fires only for non-native channels (`channel.source !== 'native'`).

**Decision**: First-class `projects` table with idempotent `findOrCreateProject()`.
**Rationale**: Project context was previously embedded in channel source metadata — unstructured, duplicated across channels from the same project. A proper `projects` table with `instructions` and `source_metadata` columns lets multiple channels share one project. `findOrCreateProject()` uses a source-specific identity key (`cwd` for Claude Code, `originalProjectUuid` for claude.ai) for dedup, creating on first import and reusing on subsequent imports.

**Decision**: 4-layer system prompt assembly (kit briefing → project instructions → channel prompt → entity prompt).
**Rationale**: Each layer addresses a different concern. Kit briefing orients on environment transition. Project instructions carry CLAUDE.md / prompt_template content (the "how to work on this project" knowledge). Channel prompt sets conversation-specific context. Entity prompt defines persona. The layers are additive — each is optional and independently useful. The ordering ensures the most general context (orientation) comes first and the most specific (persona) comes last.

**Decision**: Kit briefing deduplication — CLAUDE.md moves to project layer for linked channels, stays as fallback for legacy imports.
**Rationale**: Before 8¾a, the kit briefing injected CLAUDE.md content from `sourceMetadata`. After 8¾a, project instructions contain the same content. Injecting both would double the token cost and confuse the model with redundant instructions. The fix: `buildKitBriefing()` only injects `claudeMd` from source metadata when `!channel.projectId` (legacy fallback). MEMORY.md stays in kit briefing regardless — it's accumulated memory, not project instructions.

**Decision**: claude.ai project context injection — `projects.json` prompt templates and knowledge docs become project instructions.
**Rationale**: claude.ai exports include `projects.json` with project names, prompt templates, and knowledge documents. These map directly to Klatch's `projects.instructions` column. `extractFromZip()` parses these, and `processImport()` creates Klatch projects from them before importing conversations. Channels with `project_uuid` in the export get linked to the corresponding Klatch project. This closes the "instructional fidelity" gap — the fourth and hardest level in the fidelity framework.

**Decision**: Re-branching — already-imported conversations selectable for re-import with disambiguation.
**Rationale**: During testing, we needed to re-import the same conversation multiple times (different conditions, different kit briefing versions). The `forceImport` flag bypasses dedup, and `countChannelsByOriginalSessionId()` generates a disambiguation suffix ("(2)", "(3)"). The UI shows visual states distinguishing "re-branch" from "already imported."

**Decision**: Claude Code session browser — scan `~/.claude/projects/` to discover sessions.
**Rationale**: Asking users to paste JSONL file paths was a bad UX. The session scanner reads the known Claude Code directory structure, groups sessions by project, and returns previews with message counts and import status. Multi-select import replaces the single-file modal. The scanner is read-only — it never modifies Claude Code's files.

## Data Isolation Note

Klatch, claude.ai, and Claude Code are three completely independent systems:
- **Klatch**: local SQLite DB (`klatch.db`), uses Anthropic API
- **claude.ai**: Anthropic's cloud storage, subscription model
- **Claude Code**: `~/.claude/` JSONL files, uses Anthropic API with own session management

As of v0.8.5, Klatch can **import** both Claude Code sessions (JSONL) and claude.ai conversations (ZIP export). Imports are read-only snapshots — no write-back to source files. Fork continuity is live via the Anthropic Compaction API. The 4-layer system prompt assembly (kit briefing → project instructions → channel prompt → entity prompt) ensures imported conversations land with proper orientation.
