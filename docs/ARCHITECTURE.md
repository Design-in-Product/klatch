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

## Data Isolation Note

Klatch, claude.ai, and Claude Code are three completely independent systems:
- **Klatch**: local SQLite DB (`klatch.db`), uses Anthropic API
- **claude.ai**: Anthropic's cloud storage, subscription model
- **Claude Code**: `~/.claude/` JSONL files, uses Anthropic API with own session management

As of v0.8.5, Klatch can **import** both Claude Code sessions (JSONL) and claude.ai conversations (ZIP export). Imports are read-only snapshots — no write-back to source files. Fork continuity is live via the Anthropic Compaction API. The 4-layer system prompt assembly (kit briefing → project instructions → channel prompt → entity prompt) ensures imported conversations land with proper orientation.

*Note: The decision log above covers through Step 8 Phase 1 (v0.8.0). Decisions for v0.8.1–v0.8.5 (fork continuity, claude.ai import, sidebar project grouping, kit briefing, project context injection, 4-layer prompt assembly, re-branching, session browser) are pending documentation — see Calliope's memo to Daedalus dated 2026-03-15.*
