# Plan: Selective Import Browser

**Status:** Draft
**Assignee:** TBD
**Roadmap ref:** Step 8¾ additional fix — "Selective import browser"

## Problem

Currently, claude.ai import is all-or-nothing: upload a ZIP, every conversation gets imported. Users can't preview what's in the export, pick specific conversations, or import project knowledge files. For Claude Code, there's no way to browse available sessions at all — you have to know the exact JSONL path.

## Proposed UX

### claude.ai mode

After selecting a ZIP file, instead of immediately importing, show a **preview panel**:

```
┌─────────────────────────────────────────────┐
│  Import from claude.ai                       │
│                                              │
│  my-export.zip (4.2 MB)          [Change]    │
│                                              │
│  ☑ Conversations (12)                        │
│    ☑ React architecture chat    24 msgs      │
│    ☑ CIO briefing              18 msgs      │
│    ☐ Quick question             2 msgs      │
│    ...                                       │
│                                              │
│  ☐ Project knowledge (3 projects)            │
│    ☐ Piper Morgan — 4 docs                   │
│    ☐ Side project — 1 doc                    │
│                                              │
│  ☐ Memories (15 items)                       │
│                                              │
│  [Import selected (10)]    [Cancel]          │
└─────────────────────────────────────────────┘
```

- Conversations are checked by default, knowledge/memories unchecked
- Select all / deselect all per section
- Shows conversation name, message count, project association
- Grays out already-imported conversations (with "already imported" label)
- Import button shows count of selected items

### Claude Code mode (stretch)

Add a "Browse..." button that scans `~/.claude/projects/` and shows available sessions:

```
┌─────────────────────────────────────────────┐
│  Import from Claude Code                     │
│                                              │
│  [Browse sessions...]   or paste path:       │
│  [______________________________.jsonl]      │
│                                              │
│  ▸ klatch/ (3 sessions)                      │
│    ☐ e19ec6fe... — 2026-03-07  142 events   │
│    ☑ a3b4c5d6... — 2026-03-10   87 events   │
│    ☐ f1e2d3c4... — 2026-03-12  203 events   │
│  ▸ other-project/ (1 session)                │
│                                              │
│  [Import selected (1)]    [Cancel]           │
└─────────────────────────────────────────────┘
```

This is stretch scope — it requires a server endpoint to scan the filesystem and return session metadata. The claude.ai preview is the priority.

## Architecture

### Phase 1: ZIP preview (claude.ai)

#### New server endpoint

`POST /api/import/claude-ai/preview`

Accepts the same ZIP upload as `/import/claude-ai` but returns metadata only — no database writes:

```typescript
interface ZipPreview {
  conversations: Array<{
    uuid: string;
    name: string;
    messageCount: number;
    projectUuid?: string;
    projectName?: string;
    createdAt: string;
    updatedAt: string;
    alreadyImported: boolean;      // checked via findChannelByOriginalSessionId
    existingChannelId?: string;    // if already imported
  }>;
  projects: Array<{
    uuid: string;
    name: string;
    documentCount: number;
    documents: Array<{ name: string; sizeBytes: number }>;
  }>;
  memories: Array<{
    uuid: string;
    content: string;   // truncated preview
    createdAt: string;
  }>;
}
```

#### Modified import endpoint

`POST /api/import/claude-ai` gains an optional `selectedConversationIds: string[]` filter. If provided, only import conversations whose UUID is in the list. If omitted, import all (backward compatible).

#### Client flow

1. User selects ZIP → client calls `/preview` → shows browse UI
2. User checks/unchecks items → clicks "Import selected"
3. Client calls `/import/claude-ai` with `selectedConversationIds`
4. Success state as today

### Phase 2: Project knowledge import

This requires new infrastructure:

- **Knowledge storage**: Where do project docs go? Options:
  - As messages in a special "knowledge" role (hacky)
  - As `source_metadata` on the channel (limited to one project per channel)
  - As a new `knowledge_documents` table (cleanest, most future-proof)
  - As system prompt injection (most immediately useful — append to channel's system prompt)
- **Decision needed**: How knowledge files map to channels. One knowledge channel per project? Inject into existing project channels? User picks?

Defer the storage decision until we see real usage patterns from the selective browser.

### Phase 3: Claude Code session browser (stretch)

New server endpoint: `GET /api/import/claude-code/sessions`

Scans `~/.claude/projects/`, returns directory listing with session metadata (file size, modification date, line count estimate). Client renders as a browsable tree.

## ZIP Extractor Changes

`extractFromZip()` already extracts conversations and projects. Extend to also extract:

- `memories.json` — array of memory objects
- Document counts per project (from `projects.json` knowledge docs)

Return shape becomes:

```typescript
interface ClaudeAiExport {
  conversations: ConversationFile[];
  projects: Map<string, ProjectInfo>;   // already exists
  memories: MemoryItem[];               // new
}

interface ProjectInfo {
  uuid: string;
  name: string;
  documents: Array<{ name: string; content: string }>;  // extend existing
}
```

## Test Plan

- Preview endpoint: returns correct counts, detects already-imported conversations
- Selective import: only imports checked conversations, skips unchecked
- Backward compat: import without `selectedConversationIds` imports all
- UI: checkboxes toggle, "Import selected" count updates, grayed-out duplicates
- Empty sections hidden (no "Memories (0)" if no memories)
- Large ZIP: preview is fast (no parsing of message content, just metadata)

## Estimated Scope

**Phase 1 (ZIP preview + selective import):**
- Server: ~60 lines (preview endpoint + selection filter)
- Client: ~150 lines (browse UI with checkboxes, section headers)
- ZIP extractor: ~20 lines (memories extraction)
- Tests: ~15 new tests
- Complexity: Medium. The UI is the main work.

**Phase 2 (knowledge import):** Needs design decision. ~TBD.

**Phase 3 (Claude Code browser):** ~100 lines server + ~100 lines client. Medium.
