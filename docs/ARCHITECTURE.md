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

## Data Isolation Note

Klatch, claude.ai, and Claude Code are three completely independent systems:
- **Klatch**: local SQLite DB (`klatch.db`), uses Anthropic API
- **claude.ai**: Anthropic's cloud storage, subscription model
- **Claude Code**: `~/.claude/` JSONL files, uses Anthropic API with own session management

No shared conversation pools between any of them.
