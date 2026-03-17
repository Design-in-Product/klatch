# Test Failure Triage — 2026-03-17

**Author:** Argus
**Scope:** 14 pre-existing test failures across 4 files

## Root Cause: Missing DB Mock in Legacy Test Files

All 14 failures share a single root cause: **the legacy test files (`queries.test.ts`, `channels.test.ts`, `entities.test.ts`, `metadata.test.ts`) run against the real `klatch.db` instead of an in-memory test database.**

### Why

The test infrastructure has two generations:

1. **Legacy tests** (Round 1–3): Written before `setup.ts` existed. They import query functions directly and assume a working database. They have no `vi.mock('../db/index.js')` call.

2. **Modern tests** (Round 4+): Import `./setup.ts` which mocks `getDb()` to return a fresh in-memory SQLite database per test via `beforeEach`.

The `vitest.config.ts` has `setupFiles: ['./src/__tests__/setup.ts']`, which means `setup.ts` runs before each test file. However, **`vi.mock()` calls are hoisted to the top of the file they're written in** — they do NOT propagate globally from `setupFiles`. So the `vi.mock('../db/index.js')` in `setup.ts` only applies to test files that **explicitly import `setup.ts`**.

The `beforeEach` and `afterAll` hooks in `setup.ts` DO register globally via `setupFiles`, but since the mock doesn't apply, `getDb()` returns the real database in legacy tests, and the `testDb` variable in `setup.ts` is never used by them.

### Evidence

- The failure counts **change between runs** (e.g., `expected 3, received 23` → `expected 3, received 29` → `expected 3, received 11`). This is because each test run inserts rows into the real `klatch.db`, and the accumulated rows persist.
- The real `klatch.db` shows 5 messages and 12 entities in the `default` channel — growing with each test run.
- Tests fail even when run **in isolation** (single file), confirming it's not cross-file contamination.
- All Round 4+ test files import `./setup.ts` and pass consistently.

### Affected Files and Failure Counts

| File | Failures | Total Tests | Notes |
|------|----------|-------------|-------|
| `queries.test.ts` | 6 | 43 | Direct query tests; counts accumulate in `default` channel |
| `channels.test.ts` | 1 | 27 | `entityCount` check on `default` channel |
| `entities.test.ts` | 4 | 30 | Entity assignment counts on `default` channel |
| `metadata.test.ts` | 3 | 15 | Stats/enriched queries; also `getDb()` import on line 3 |

### Failure Details

**queries.test.ts (6 failures):**
1. `getMessages returns channel messages ordered by created_at` — expects 3 messages, finds accumulated total
2. `deleteAllMessages removes all messages in channel` — expects count of 3, deletes accumulated total
3. `getLastAssistantMessage returns undefined when no assistant messages` — finds leftover assistant messages
4. `default channel has default entity assigned` — expects 1 entity, finds accumulated entities
5. `assignEntityToChannel adds an entity` — expects 2 entities, finds accumulated + 1
6. `getChannelEntityCount returns correct count` — expects 1, finds accumulated

**channels.test.ts (1 failure):**
1. `default channel has entityCount of 1 (Roles group)` — accumulated entities from prior test runs

**entities.test.ts (4 failures):**
1. `assigns an entity to a channel` — entity count off
2. `unassigns an entity from a channel` — entity count off
3. `cannot remove the last entity from a channel (400)` — not actually last due to accumulated entities
4. `returns assistants array for single-entity channel` — not single-entity due to accumulation

**metadata.test.ts (3 failures):**
1. `returns zero stats for default channel (no artifacts)` — has messages from prior runs
2. `includes messageCount and lastMessageAt fields` — accumulated messages
3. `default channel has zero messageCount` — accumulated messages
4. `channels with same cwd share a project` — uses `getDb()` directly (line 3), gets real DB

## Fix

**Single-line fix per file:** Add `import './setup.js';` to each legacy test file. This causes `vi.mock` to be evaluated in the setup context before the test file's imports resolve, and the `beforeEach` hook provides a fresh in-memory DB per test.

Affected files:
- `packages/server/src/__tests__/queries.test.ts`
- `packages/server/src/__tests__/channels.test.ts`
- `packages/server/src/__tests__/entities.test.ts`
- `packages/server/src/__tests__/metadata.test.ts`

### Severity

**Low.** These are test infrastructure issues only — no production code is affected. The tests themselves are correct; they just need the mock to be applied. The failing tests are all testing real functionality that works correctly (as verified by the passing Round 4+ tests that cover similar ground).

### Note on `metadata.test.ts`

This file also directly imports `getDb` from `../db/index.js` (line 3) to seed test data. With the mock applied, this will correctly return the in-memory DB. No code changes needed beyond the import.
