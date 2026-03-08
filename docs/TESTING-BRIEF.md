# Testing Infrastructure Brief

## Welcome to the core team

Your audit work (docs/AUDIT.md, docs/EPICS.md) was excellent — thorough, well-structured, and directly shaped the Step 6 implementation plan. The P1 findings (input validation, channel existence checks, transactional message creation, stale model IDs) have already been addressed in Phase 6a, which is landing now on main.

Based on that work, we'd like you to take on a permanent role: **quality and test infrastructure lead**. Your audit instincts — finding the gaps, thinking about edge cases, validating assumptions — are exactly what testing needs. And the timing is right: Step 6 (multi-entity conversations) is the most complex change yet, and we're building it without a safety net.

Your job is to build that safety net.

## The assignment

### 1. Set up Vitest

- Install `vitest` and `@hono/testing` (or Hono's built-in test helpers)
- Configure for the monorepo (packages/server tests first, client tests later)
- Add a `test` script to the root `package.json`
- Keep it simple — no coverage thresholds or CI pipelines yet, just `npm test` works

### 2. Test the existing API surface (green tests against current main)

These tests validate what's already working and will catch regressions as Step 6 lands.

**Layer 1: Database queries** (`packages/server/src/db/queries.ts`)
- `createChannel`, `getChannel`, `getAllChannels`, `updateChannel`, `deleteChannel`
- `insertMessage`, `createMessagePair` (transactional), `getMessage`, `getMessages`
- `deleteMessage`, `deleteAllMessages`, `getLastAssistantMessage`
- Edge cases: nonexistent IDs return undefined, `deleteChannel` cascades messages

**Layer 2: API routes** (via Hono's test client)
- `POST /api/channels` — validation (empty name → 400), success → 201
- `PATCH /api/channels/:id` — invalid model → 400, nonexistent → 404
- `DELETE /api/channels/:id` — default channel → 400, nonexistent → 404, success → 200
- `POST /api/channels/:id/messages` — empty content → 400, nonexistent channel → 404, valid → creates pair
- `DELETE /api/channels/:id/messages` — clears all
- `DELETE /api/messages/:id` — nonexistent → 404, success → 200
- `POST /api/channels/:id/regenerate` — no assistant → 404, nonexistent channel → 404

**Layer 3: Model migration**
- Verify `MODEL_ALIASES` mapping works (old IDs get rewritten on startup)
- Verify new channels get current model IDs

### 3. Write tests for the Step 6 interfaces (TDD — these start red)

Read the Step 6 plan at `.claude/plans/linear-humming-deer.md` and the epic breakdown at `docs/EPICS.md`. Write tests for the interfaces described there. These tests will fail until the implementation lands — that's the point. They define the contract.

**Phase 6b: Entity CRUD**
- `GET /api/entities` — returns array including default entity
- `POST /api/entities` — creates with name, model, systemPrompt, color
- `POST /api/entities` — empty name → 400
- `PATCH /api/entities/:id` — updates fields
- `DELETE /api/entities/:id` — can't delete default entity
- Default "Claude" entity exists on fresh DB (id: `default-entity`, color: `#6366f1`)
- `Entity` type has: `id, name, model, systemPrompt, color, createdAt`

**Phase 6c: Channel-entity assignment**
- `GET /api/channels/:id/entities` — returns assigned entities
- `POST /api/channels/:id/entities` — assigns an entity
- `DELETE /api/channels/:id/entities/:entityId` — unassigns (can't remove last)
- New channels auto-assign default entity
- Existing channels have default entity after migration

**Phase 6d: Multi-entity streaming**
- `POST /api/channels/:id/messages` — returns `{ userMessageId, assistants: [{ assistantMessageId, entityId, model }] }`
- Single-entity channel: `assistants` array has 1 element
- Multi-entity channel: `assistants` array has N elements (one per assigned entity)

Mark these clearly as `test.todo()` or `test.skip()` with a comment like `// Step 6b — will pass after entity implementation lands` so they're visible but don't block the test run.

## Key files to read

| File | What it tells you |
|------|------------------|
| `.claude/plans/linear-humming-deer.md` | The full Step 6 implementation plan |
| `docs/EPICS.md` | Epic decomposition with subtask checklists |
| `docs/AUDIT.md` | Your own audit (for context on what's been fixed) |
| `packages/shared/src/types.ts` | All shared types + model IDs |
| `packages/server/src/db/queries.ts` | All database operations |
| `packages/server/src/db/index.ts` | Schema + migrations |
| `packages/server/src/routes/messages.ts` | Message API (POST + SSE) |
| `packages/server/src/routes/channels.ts` | Channel API (CRUD + DELETE) |
| `packages/server/src/claude/client.ts` | Streaming bridge |
| `CLAUDE.md` | Project conventions |

## Conventions

- Work in a branch off main (e.g., `test-infrastructure`)
- Test files go next to source: `queries.test.ts`, `messages.test.ts`, etc. (or in a `__tests__` directory — your call, just be consistent)
- Use a test-specific SQLite database (in-memory or temp file), never touch `klatch.db`
- Keep tests fast — mock the Anthropic SDK for streaming tests
- If you find bugs or edge cases while writing tests, open a GitHub issue describing the finding

## How this fits

You're not writing tests after the fact. You're defining the contract that Step 6 has to satisfy. When the implementation merges and your red tests turn green, that's the validation that the feature works. This is the most leveraged work available right now.
