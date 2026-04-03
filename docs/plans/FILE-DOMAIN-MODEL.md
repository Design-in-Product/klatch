# File Domain Model

*Design document. Authored 2026-03-27 by Daedalus + xian.*
*Status: In progress — Phases 1-3 shipped (April 1-2). Phases resequenced April 2.*

---

## Core Principle

Files are **domain objects with ownership and visibility**, not just prompt payloads. Each contextual level in Klatch can have files. Files are referenced by pointer — a single canonical file on disk can be visible at multiple levels simultaneously. Context injection (deciding what goes into the prompt) is a separate concern from ownership (who can see what).

---

## Files at Each Level

| Level | Has files? | What they are | How they get there |
|-------|-----------|---------------|-------------------|
| **Kit (L1)** | No | File awareness in briefing only | — |
| **Project (L2/L3)** | Yes — **knowledge base** | Reference docs, specs, imported knowledge. Memory is a special file (reserved name, special role in prompt assembly). | Import, manual upload, promotion from channel/message |
| **Channel (L4)** | Yes — **working set** | Docs the channel is actively working with. The roundtable's reading list. | Upload, promotion from message, projection from project |
| **Entity (L5)** | Yes — **library** | Index of everything this entity has touched: created, read, received, imported. Not injected into prompt — a reference index. | Automatic tracking of entity-file interactions |
| **Message** | Yes — **attachments** | One-shot context for this turn. | Upload (9a), tool creation (9d-B) |

## Key Design Decisions

### Pointers, not payloads
A project file is not crammed into every prompt. It is *visible and available* — the entity can be told "these files are in your project" and reference them. Context injection is a separate, configurable concern.

### Promotion and projection
- **Promotion (upward):** A message attachment can be pinned to the channel, then promoted to the project knowledge base. Each promotion creates a new file_ref at the higher scope.
- **Projection (downward):** A project file can be pushed to an entity or channel — "deliver this spec to the CTO" = attach the file to a directed message. The file already exists; the projection creates a reference plus a delivery prompt.

### Memory is a file
MEMORY.md is a file in the project knowledge base with a reserved name and a special role in prompt assembly. Memory editing = file editing. Memory display = file display. Memory is not a separate concept in the data model — it's a file with a convention.

### Entity library is an index
Entity files are not prompt-injected. They are an automatically accumulated index of every file the entity has created, received, read, or been sent. Think of it as the entity's "desk" — what papers are on it. Useful for search, for context ("what has this entity seen?"), and for continuity across sessions.

---

## Schema

```sql
-- Canonical file storage (one row per unique file on disk)
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,           -- display name (e.g., "spec.md")
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL,    -- disk lookup key in klatch-files/
  created_by TEXT,              -- entity ID, 'user', or 'import'
  created_at TEXT NOT NULL
);

-- File references: visibility at different scopes
CREATE TABLE file_refs (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES files(id),
  scope TEXT NOT NULL,          -- 'project' | 'channel' | 'entity' | 'message'
  scope_id TEXT NOT NULL,       -- project/channel/entity/message ID
  ref_type TEXT DEFAULT 'pinned', -- 'pinned' | 'created' | 'received' | 'imported'
  added_at TEXT NOT NULL,
  added_by TEXT                 -- who promoted/assigned it ('user', entity ID)
);
```

### Relationship to existing tables

- `message_artifacts` (type='file') continues to exist for backward compatibility and for the message-level attachment display. New uploads also create rows in `files` + `file_refs`.
- `projects.memory` column becomes a convenience pointer — the canonical memory content lives in a file with name `MEMORY.md` and a project-scope file_ref. Migration preserves existing memory data.
- Imported project knowledge (from claude.ai ZIP, Claude Code sessions) creates files + project-scope refs.

### Indexes

```sql
CREATE INDEX idx_file_refs_scope ON file_refs(scope, scope_id);
CREATE INDEX idx_file_refs_file ON file_refs(file_id);
```

---

## API Surface

### File queries
- `GET /projects/:id/files` — all files visible at project scope
- `GET /channels/:id/files` — all files visible at channel scope (includes project files via join)
- `GET /entities/:id/files` — entity's library (everything they've touched)
- `GET /messages/:id/files` — message attachments (existing, via message_artifacts)

### File actions
- `POST /channels/:id/files` — upload a file to a channel (existing 9a endpoint, extended)
- `POST /files/:id/promote` — promote a file to a higher scope (`{ targetScope: 'channel' | 'project', targetId: '...' }`)
- `POST /files/:id/project` — project a file downward to a channel or entity (`{ targetScope: 'channel' | 'entity', targetId: '...' }`)

### Context injection (Step 10)
- Project files: injected as a listing in L3 ("Project files available: spec.md, design.md, MEMORY.md")
- Channel files: injected as a listing in L4 ("Channel working files: quarterly-report.csv, review-notes.md")
- Full content injection: only when explicitly requested or when the file is small enough. Configurable per-file or per-scope.

---

## Implementation Phases

*Resequenced April 2, 2026. Original phases 1-3 shipped; remaining work reordered by user value.*

### Phase 1: Schema + backfill ✓ (shipped April 1)
- `files` and `file_refs` tables with indexes
- Backfill from existing `message_artifacts` type='file'
- API endpoints for querying files at each scope
- Dual-write: new uploads populate both `message_artifacts` and `files`/`file_refs`

### Phase 2: Channel pinning ✓ (shipped April 1)
- "Pin to channel" action (bookmark icon) on message file artifacts
- Channel files visible in channel settings UI with unpin
- Pin/unpin API (`POST /api/files/pin`, `DELETE /api/files/:fileId/pin/:channelId`)
- Channel files listed in L4 context ("Channel files available: ...")

### Phase 3: Project knowledge base ✓ (shipped April 2)
- Project files upload/manage UI in Project Settings ("Knowledge base" section)
- Upload/remove API (`POST /api/projects/:id/files`, `DELETE /api/projects/:id/files/:fileId`)
- Project files listed in L3 context ("Project knowledge base files: ...")
- Prompt-debug endpoint updated with file info in layers 3 and 4

### Phase 4: Dual-write completion ✓ (shipped April 3)
- `save_file` tool handler now creates `files` + `file_refs` entries alongside `message_artifacts`
- All file creation paths (upload, save_file tool) consistently populate the file domain model
- Import pipelines don't create actual files on disk (tool-use summaries only), so no import-side changes needed
- Phase 1 backfill migration already handles existing `message_artifacts` type='file' rows

### Phase 5: Promotion ✓ (shipped April 3)
- `POST /api/files/:id/promote` — promote a file to a higher scope (channel or project), idempotent
- "Promote to project" button (arrow-up icon) on channel-pinned files in Channel Settings
- Button only shown when channel belongs to a project
- Projection (downward): project file → channel delivery with prompt (deferred — evaluate need after promotion ships)

### Phase 6: Memory as a file (Step 10)
- Migrate `projects.memory` column to a file with reserved name `MEMORY.md` in the project knowledge base
- Memory editing = file editing; memory display = file display
- Migration preserves existing memory data
- Import pipelines updated to create `MEMORY.md` file instead of writing to memory column
- *Deferred from original Phase 3: this is a refactor that unifies the data model but doesn't add user-facing capability. Best scheduled alongside Step 10 (export) where the unified model pays off for context packaging.*

### Phase 7: Entity library (Step 11)
- Automatic entity-file tracking (created, received, read)
- Entity file index in entity settings/profile
- Useful for search and continuity assessment
- *Deferred from original Phase 4: this is an index/audit feature whose value multiplies when search exists. Best scheduled alongside Step 11 (search) where the index becomes queryable.*

---

## Design Principles Applied

- **Gall's Law:** Each phase is the smallest working increment. Phase 1 is just schema — no behavior changes. Each subsequent phase adds one capability.
- **Tesler's Law (DP8):** File visibility across levels is genuinely complex. We grapple with the hierarchy so users don't have to think about prompt assembly.
- **Fork-don't-sync:** Imported files are snapshots. Promoting a file copies the reference, not the content. No live syncing between levels.

---

## References

- Step 9a implementation: `packages/server/src/routes/files.ts`, `packages/server/src/files/storage.ts`
- Artifact rendering: `packages/client/src/components/MessageList.tsx`
- Prompt assembly: `packages/server/src/claude/client.ts` (buildSystemPrompt)
- 5-layer model: `docs/PROMPT-ASSEMBLY.md`
