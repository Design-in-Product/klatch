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
- **No ORM**: Raw `better-sqlite3` queries. Add Drizzle when we hit 8+ tables (currently at 6).

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
- `channels` — id, name, system_prompt, created_at, source, source_metadata, project_id
- `messages` — id, channel_id, role, content, status, created_at, original_timestamp, original_id
- `entities` — id, name, model, system_prompt, color, handle
- `channel_entities` — channel_id, entity_id (join table)
- `projects` — id, name, instructions, source, source_metadata
- `message_artifacts` — id, message_id, type, tool_name, input_summary, content

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

Four agents work on this repo: **Daedalus** (architecture & implementation), **Argus** (quality & testing), **Theseus** (manual testing & exploration, working in tandem with the product owner), and **Calliope** (writing, chronicling & documentation). See `docs/ROSTER.md` for the full team. Follow this workflow:

1. **Session start:** Pull from origin, then read `docs/COORDINATION.md` for status/assignments and check `docs/mail/` for any new memos addressed to you. This is your full briefing — do it every time you're started or re-awoken.
2. **Before executing:** Check COORDINATION.md again — confirm your assigned work, verify dependencies are met (e.g., "Waiting on" is resolved), and avoid duplicating or conflicting with the other agent's in-progress work.
3. **Before every push:** Update your section in COORDINATION.md with current status, what you completed, and what you're working on next.

Statuses: available, working, blocked, review. See `docs/COORDINATION.md` for the full protocol.

## Session Logs

Agents maintain session logs in `docs/logs/` during working sessions.

- **Filename:** `YYYY-MM-DD-HHMM-NAME-MODEL-log.md` (e.g., `2026-03-11-1532-theseus-opus-log.md`)
- **Purpose:** Record decisions, findings, test results, and observations during a session
- **When:** Create a log at session start if doing substantive work (testing, investigation, implementation)
- **Content:** Timestamped entries with context, findings, and next steps
- **Update continuously:** Add timestamped entries as work progresses — do not reconstruct from memory at session end

## Session Wrap Protocol (required before closing every session)

Before writing any "done" or "complete" claim in your session log, you must verify your work is actually in the repository. This is not optional.

**Step 1 — Confirm your commits landed:**
```bash
git log origin/YOUR-BRANCH --oneline -5
```
Paste the output into your session log. If your commits do not appear, do not claim the work is done.

**Step 2 — Confirm each deliverable file exists:**
For every file you claim to have created or modified, run:
```bash
ls PATH/TO/FILE
```
If a file is missing, note it explicitly. Do not write "done" for work you cannot verify is present.

**Step 3 — Push your session log last:**
Commit and push your session log after verifying Steps 1 and 2. The log is the final record, not the first.

**If verification fails:** Write exactly what was attempted, what commit hashes exist, and what is missing. Report to xian before closing. Do not fabricate a completion record.

## Git Safety Rules

- **No force pushes without explicit approval from xian.** `git push --force` and `git push -f` are prohibited unless xian has specifically authorized the operation in the current session.
- **If a rebase goes wrong, stop and report.** Do not attempt to recover a failed rebase on your own and push the result. The risk of silently losing work is too high. Report the state to xian and wait for guidance.
- **Verify after any recovery operation.** If you recover from a rebase conflict or merge issue, run `git log --oneline -10` and check that your work commits are present before pushing.

## Conventions

- No auth (single-user local tool)
- No state management library yet (plain React state; add Zustand if needed)
- Gall's law: each feature is the smallest working increment

## Deliverables

Research, audits, and design work must be committed to `docs/` — not just reported in chat. If a task produces findings, plans, or decisions, write them to a markdown file in the repo so other agents and future sessions can reference them. Chat is ephemeral; the repo is the source of truth.
