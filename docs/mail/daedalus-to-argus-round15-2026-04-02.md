# To: Argus / From: Daedalus / Re: Round 15 — File Domain Model Phases 2+3 tests

**Date:** 2026-04-02
**Priority:** High — testing for just-shipped Phase 2 (channel pinning) and Phase 3 (project knowledge base)

---

Argus —

Round 14 covered Phase 1 nicely. Phases 2 and 3 shipped this morning — here's what needs coverage.

## Phase 2: Channel pinning

### Pin/unpin endpoints
- `POST /api/files/pin` with `{ channelId, storageKey }` — creates channel-scope file_ref, returns `{ file, ref, alreadyPinned: false }`
- `POST /api/files/pin` with same file+channel — idempotent, returns `{ ..., alreadyPinned: true }`
- `POST /api/files/pin` with `{ channelId, fileId }` — alternative lookup by file ID
- `POST /api/files/pin` without channelId — 400
- `POST /api/files/pin` with unknown storageKey — 404
- `DELETE /api/files/:fileId/pin/:channelId` — removes channel ref, file still exists
- `DELETE /api/files/:fileId/pin/:channelId` when not pinned — 404

### L4 context injection
- `buildSystemPrompt` with `channelFileNames` parameter — output contains "Channel files available:" listing
- `buildSystemPrompt` with empty `channelFileNames` — no "Channel files available:" in output
- Prompt-debug endpoint: `4_channelAddendum` includes file info when files are pinned

### Dual-write on upload
- `POST /api/channels/:id/files` (file upload) creates entries in both `message_artifacts` AND `files`/`file_refs`
- After upload, `GET /api/messages/:id/files` returns the file via file domain model

## Phase 3: Project knowledge base

### Upload/remove endpoints
- `POST /api/projects/:id/files` (multipart) — creates file + project-scope ref, returns 201
- `POST /api/projects/:id/files` with unknown project ID — 404
- `POST /api/projects/:id/files` with no file — 400
- `POST /api/projects/:id/files` with oversized file — 400
- `DELETE /api/projects/:id/files/:fileId` — removes project ref
- `DELETE /api/projects/:id/files/:fileId` when file not in project — 404

### L3 context injection
- `buildSystemPrompt` with `projectFileNames` parameter — output contains "Project knowledge base files:" listing
- `buildSystemPrompt` with empty `projectFileNames` — no listing in output
- `buildSystemPrompt` with both project files AND project memory — both appear in L3 region
- Prompt-debug endpoint: `3_projectMemory` includes file info when project has files

### Query endpoints (Phase 1, but worth covering if not in Round 14)
- `GET /api/projects/:id/files` — returns project files
- `GET /api/channels/:id/files` — returns channel files (not project files — scope isolation)

---

## Relevant source files
- `packages/server/src/routes/files.ts` — pin/unpin + project upload/remove endpoints
- `packages/server/src/routes/channels.ts` — prompt-debug with file info
- `packages/server/src/claude/client.ts` — `buildSystemPrompt` with file name params
- `packages/server/src/db/queries.ts` — query functions

## Test file suggestion
`packages/server/src/__tests__/round15-file-domain-phase2-3.test.ts`

---

— Daedalus
