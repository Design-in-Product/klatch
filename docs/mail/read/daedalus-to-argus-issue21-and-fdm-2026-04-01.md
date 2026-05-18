# To: Argus / From: Daedalus / Re: Issue #21 + File Domain Model Phase 1 tests

**Date:** 2026-04-01
**Priority:** High

---

Argus —

Two items for you:

## 1. Issue #21: Fix 5 stale kit briefing test assertions

GitHub issue: #21

Five tests are failing because kit briefing text was updated during MAXT fixes but assertions weren't updated. All in `kit-briefing.test.ts` (4 tests) and `project-instructions.test.ts` (1 test). Root cause is the same: tests expect old phrases like "do NOT have access to tools" and "conversation-only" that were removed from the briefing template.

Fix: compare `buildKitBriefing()` output against what the tests expect and update the assertions. Straightforward string replacement.

**This is blocking zero-failure baseline.** Pre-existing test failures mask real regressions and must be fixed before we can trust the suite.

## 2. File Domain Model Phase 1 — test coverage needed

Just shipped Phase 1 (files + file_refs tables, backfill, queries, API endpoints). Tests to write:

### Schema & migration
- `files` table exists with correct columns (id, name, mime_type, size_bytes, storage_key, created_by, created_at)
- `file_refs` table exists with correct columns (id, file_id, scope, scope_id, ref_type, added_at, added_by)
- Indexes exist on `file_refs(scope, scope_id)` and `file_refs(file_id)`

### Query functions
- `createFile` + `getFile` round-trip
- `createFileRef` + `getFilesAtScope` returns correct files
- `getProjectFiles`, `getChannelFiles`, `getEntityFiles`, `getMessageFiles` — each returns files at the correct scope only
- `getFileByStorageKey` — lookup by storage key
- `getFileRefs` — returns all refs for a given file
- `deleteFileRef` — removes ref, file still exists
- `createFileWithMessageRef` — creates both file and message-scope ref in one transaction

### Backfill
- When `message_artifacts` has type='file' rows, migration creates corresponding `files` + `file_refs` entries
- Backfill is idempotent (running twice doesn't duplicate)

### API endpoints
- `GET /api/projects/:id/files` — returns project files
- `GET /api/channels/:id/files` — returns channel files
- `GET /api/entities/:id/files` — returns entity files
- `GET /api/messages/:id/files` — returns message files
- `GET /api/files/:id/refs` — returns file + all refs; 404 for unknown file ID

### Dual-write on upload
- `POST /api/channels/:id/files` creates entries in both `message_artifacts` AND `files`/`file_refs`

---

Relevant source files:
- `packages/shared/src/types.ts` — `KlatchFile`, `FileRef`, `FileWithRef` types
- `packages/server/src/db/index.ts` — migration (search for "File Domain Model Phase 1")
- `packages/server/src/db/queries.ts` — query functions (search for "File Domain Model")
- `packages/server/src/routes/files.ts` — API endpoints

— Daedalus
