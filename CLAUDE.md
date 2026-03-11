# Klatch

A standalone, local-first web app for managing Claude AI conversations through a Slack-inspired interface.

## Quick Start

```bash
npm run dev    # starts server (:3001) and client (:5173)
```

Requires `ANTHROPIC_API_KEY` in `.env` at project root.

## Architecture

**Monorepo** (npm workspaces):
- `packages/shared` — TypeScript types shared between client and server
- `packages/server` — Hono API server + SQLite + Anthropic SDK
- `packages/client` — Vite + React + Tailwind UI

**Key patterns:**
- **POST + SSE streaming**: Sending a message is a POST that returns message IDs, then the client opens a separate SSE connection to observe the stream. This separates creation from observation (retryable, multi-tab friendly).
- **SQLite as source of truth**: Completed messages live in `klatch.db`. Streaming happens in-memory via EventEmitters, written to DB on completion.
- **No ORM**: Raw `better-sqlite3` queries. Add Drizzle when we hit 8+ tables.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 19 |
| Backend | Hono (TypeScript) |
| Database | SQLite via better-sqlite3 |
| Streaming | Server-Sent Events (SSE) |
| Styling | Tailwind CSS v4 |
| AI | Anthropic SDK (default: Opus 4.6) |

## Database

Schema in `packages/server/src/db/index.ts`. Tables:
- `channels` — id, name, system_prompt, created_at
- `messages` — id, channel_id, role, content, status, created_at

## Key Files

- `packages/server/src/claude/client.ts` — Streaming bridge between Anthropic SDK and SSE
- `packages/server/src/routes/messages.ts` — API surface (POST + SSE pattern)
- `packages/server/src/db/queries.ts` — All database operations
- `packages/client/src/hooks/useStream.ts` — Client-side SSE consumption
- `packages/client/src/App.tsx` — Main app component

## Testing

- **Framework:** Vitest (`npm test` at root runs server tests)
- **Test location:** `packages/server/src/__tests__/`
- **DB isolation:** In-memory SQLite per test via mock of `getDb()`
- **Streaming:** `claude/client.js` is mocked in route tests

## Multi-Agent Coordination

Two agents (Daedalus and Argus) work on this repo. Follow this workflow:

1. **Session start:** Read `docs/COORDINATION.md` to see current status, assignments, and blockers.
2. **Before executing:** Check COORDINATION.md again — confirm your assigned work, verify dependencies are met (e.g., "Waiting on" is resolved), and avoid duplicating or conflicting with the other agent's in-progress work.
3. **Before every push:** Update your section in COORDINATION.md with current status, what you completed, and what you're working on next.

Statuses: available, working, blocked, review. See `docs/COORDINATION.md` for the full protocol.

## Conventions

- No auth (single-user local tool)
- No state management library yet (plain React state; add Zustand if needed)
- Gall's law: each feature is the smallest working increment
