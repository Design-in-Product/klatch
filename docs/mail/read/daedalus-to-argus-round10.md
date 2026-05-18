# Memo: Daedalus → Argus — Round 10 Assignment

**Date:** 2026-03-19
**Re:** Cloud session import test coverage

## Context

We just shipped v0.8.7 cloud import support — JSONL file upload, buffer-based parsing, repo export convention with scanner, and project basename matching. All existing 569 server tests still pass. Need test coverage for the new code paths.

## Test File

`packages/server/src/__tests__/cloud-import.test.ts` (new file)

## Test Plan

### 1. Buffer-based JSONL Parsing

**Functions:** `parseJsonlContent()`, `parseClaudeCodeSessionFromContent()` in `packages/server/src/import/parser.ts`

Tests:
- `parseJsonlContent` with valid JSONL string → correct events array, skippedLines = 0
- `parseJsonlContent` with malformed lines mixed in → correct events, skippedLines > 0
- `parseJsonlContent` with empty string → empty events, skippedLines = 0
- `parseClaudeCodeSessionFromContent` with a multi-turn session → correct ParsedSession with turns, metadata
- `parseClaudeCodeSessionFromContent` with inline compaction events → compactionSummary extracted

### 2. Multipart Upload Route

**Endpoint:** `POST /import/claude-code` with `multipart/form-data`

Use the existing test infrastructure (mock DB, supertest-like approach). Build a minimal JSONL string with a few user/assistant events, create a mock File/FormData.

Tests:
- Upload valid .jsonl file → 201 with channelId, messageCount, etc.
- Upload non-.jsonl file → 400 error
- Upload empty session (no conversation events) → 400 error
- Upload duplicate sessionId (already imported) → 409 conflict
- Upload with `forceImport=true` on duplicate → 201 with disambiguation suffix
- Uploaded session has `cloudUpload: true` in source_metadata

### 3. Project Basename Matching

**Function:** `findUniqueProjectByName()` in `packages/server/src/db/queries.ts`

Tests:
- Exact one project with matching name → returns it
- Zero projects with that name → returns undefined
- Multiple projects with same name → returns undefined (ambiguous)

**Integration (via route):**
- Upload a session with cloud cwd `/home/ubuntu/klatch` when a local project "klatch" exists → session links to existing project (same projectId)
- Upload a session with cloud cwd `/home/ubuntu/newproject` when no matching project exists → new project created

### 4. Export Directory Scanner

**Function:** `scanExportedSessions()` in `packages/server/src/import/session-scanner.ts`

These require filesystem mocking (or a temp directory approach). Tests:
- Directory with .jsonl files → returns ProjectSessions with correct sessions, all marked `isExported: true`
- Empty directory → returns null
- Non-existent directory → returns null
- Sessions already imported → `alreadyImported: true` in results
- `.gitkeep` and non-jsonl files are ignored

### 5. Sessions Endpoint Integration

**Endpoint:** `GET /import/claude-code/sessions`

- When exports/sessions/ has files, they appear in the response alongside local sessions
- Exported sessions group has `projectName: 'Exported sessions'`

## Key Files to Reference

- `packages/server/src/import/parser.ts` — new `parseJsonlContent`, `parseClaudeCodeSessionFromContent`
- `packages/server/src/routes/import.ts` — multipart handling in `POST /import/claude-code`, `processClaudeCodeImport` helper
- `packages/server/src/db/queries.ts` — new `findUniqueProjectByName`
- `packages/server/src/import/session-scanner.ts` — new `scanExportedSessions`
- `packages/server/src/__tests__/setup.ts` — test DB schema and helpers

## Notes

- The `parseClaudeCodeSessionFromContent` is synchronous (not async) — no disk I/O
- For route tests, you can build JSONL content as a string and create a Blob/File from it
- The existing `makeSession()` helper in tests can be used as a reference for building test JSONL events
- The project basename matching only fires for cloud uploads (when cwd doesn't exist locally). In tests, use a cwd like `/nonexistent/path/klatch` to trigger the fallback path.
