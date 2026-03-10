# Phase 3: Claude.ai Conversation Import

## Overview

Import conversations exported from claude.ai (via email → ZIP download) into Klatch as read-only channels. Reuses the Phase 1 DB schema (source, source_metadata, original_timestamp, original_id, message_artifacts) with a new parser for claude.ai's JSON format.

## Input Format

Claude.ai email export delivers a ZIP containing:
```
conversations/
  {uuid}.json          # one file per conversation
  {uuid}.json
  ...
```

Each JSON file contains a single conversation with this structure:
```json
{
  "uuid": "abc-123",
  "name": "Chat about React",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T11:00:00Z",
  "chat_messages": [
    {
      "uuid": "msg-001",
      "text": "Hello",
      "sender": "human",
      "created_at": "2026-01-15T10:00:00Z",
      "attachments": [],
      "files": [],
      "content": [{ "type": "text", "text": "Hello" }]
    },
    {
      "uuid": "msg-002",
      "text": "Hi there!",
      "sender": "assistant",
      "created_at": "2026-01-15T10:00:05Z",
      "attachments": [],
      "files": [],
      "content": [
        { "type": "text", "text": "Hi there!" },
        { "type": "tool_use", "name": "artifacts", "input": { ... } }
      ]
    }
  ]
}
```

Key differences from Claude Code JSONL:
- JSON (not JSONL), one file per conversation
- Flat message list (no parentUuid tree — messages are in order)
- `sender` field ("human"/"assistant") instead of `role`
- Has `content` array (similar to Anthropic API) AND a top-level `text` field
- Tool use appears in `content` array (artifacts, analysis, web_search, etc.)
- No subagent filtering needed
- Conversation metadata (name, uuid) at the top level

## Implementation Plan

### Step 1: DB Migration (already done by Phase 1)

Phase 1 already added:
- `channels.source` TEXT — will use `'claude-ai'`
- `channels.source_metadata` TEXT — JSON with import provenance
- `messages.original_timestamp` TEXT
- `messages.original_id` TEXT
- `message_artifacts` table

**No new schema changes needed.**

### Step 2: Claude.ai Parser (`packages/server/src/import/claude-ai-parser.ts`)

Reuse the same `ParsedSession` / `Turn` / `MessageArtifact` types from Phase 1.

```typescript
export function parseClaudeAiConversation(conversation: unknown): ParsedSession
```

**Parsing rules:**
1. Extract metadata: `uuid` → sessionId, `name` → slug
2. Walk `chat_messages` array in order
3. Group into turns: each "human" message starts a new turn
4. For each "assistant" message in a turn:
   - Extract text from `content` array (type: "text" blocks) or fall back to top-level `text`
   - Concatenate multiple text blocks
   - Summarize tool_use blocks as artifacts (tool name + input summary)
5. Skip empty conversations (no chat_messages)

**Tool summarization for claude.ai tools:**
- `artifacts` → "Created/updated artifact: {title}"
- `web_search` → "Searched: {query}"
- `analysis` → "Ran analysis"
- Other tools → "{name}: {input summary}"

### Step 3: ZIP Handler (`packages/server/src/import/claude-ai-zip.ts`)

```typescript
import AdmZip from 'adm-zip';

export function extractConversationsFromZip(zipBuffer: Buffer): ConversationFile[]
```

- Use adm-zip to read ZIP from buffer
- Find all `.json` files in `conversations/` directory
- Parse each, skip malformed
- Return array of parsed conversation objects with filename metadata

### Step 4: Import Route — extend `packages/server/src/routes/import.ts`

**New endpoint:** `POST /api/import/claude-ai`

**Request:** multipart form data with a `file` field (the ZIP)

**Response (201):**
```json
{
  "imported": [
    { "channelId": "...", "channelName": "...", "messageCount": 4, "conversationId": "..." }
  ],
  "skipped": [
    { "conversationId": "...", "reason": "duplicate", "existingChannelId": "..." }
  ],
  "totalImported": 5,
  "totalSkipped": 2
}
```

**Behavior:**
1. Accept multipart upload, extract ZIP buffer
2. Extract all conversations from ZIP
3. For each conversation:
   - Check for duplicate (existing channel with same source conversationId)
   - Parse with `parseClaudeAiConversation()`
   - Skip empty conversations
   - Create channel with `source='claude-ai'`, `source_metadata` containing original uuid/name/dates
   - Insert messages in transaction with original timestamps
   - Insert artifacts for tool use blocks
4. Return summary of imported vs skipped

**Status codes:**
- 201 — at least one conversation imported
- 400 — not a ZIP, or ZIP contains no conversations
- 409 — all conversations already imported (all duplicates)

### Step 5: Tests

**Files to create:**
- `packages/server/src/__tests__/claude-ai-parser.test.ts` — unit tests for parser
- `packages/server/src/__tests__/claude-ai-import.test.ts` — integration tests for endpoint
- `packages/server/src/__tests__/fixtures/claude-ai/` — test fixtures:
  - `simple-conversation.json` — basic human/assistant exchange
  - `tool-heavy-conversation.json` — conversation with artifacts/web_search
  - `test-export.zip` — ZIP file containing multiple conversations (for integration test)

**Test cases (parser):**
- Extracts conversation metadata (uuid, name)
- Groups messages into turns (human starts each turn)
- Extracts text from content array
- Falls back to top-level text field
- Summarizes tool_use blocks as artifacts
- Handles empty conversation
- Handles single human message with no response

**Test cases (import endpoint):**
- 201 for valid ZIP with conversations
- Imports all conversations from ZIP
- 400 for non-ZIP file
- 400 for ZIP with no conversations
- 409 when all conversations are duplicates
- Partial import (some new, some duplicates) returns 201
- Channels appear with source='claude-ai'
- Messages preserve original timestamps

### Step 6: Wire Up

- Add `adm-zip` dependency: `npm install adm-zip && npm install -D @types/adm-zip` in packages/server
- Register import route in `packages/server/src/index.ts`
- Register import route in test app `packages/server/src/__tests__/app.ts`

### Step 7: Shared Types

Add to `packages/shared/src/types.ts`:
```typescript
// Import-related types
export interface ImportResult {
  channelId: string;
  channelName: string;
  messageCount: number;
  sessionId?: string;      // claude-code
  conversationId?: string; // claude-ai
  artifactCount?: number;
}

export interface ClaudeAiImportResult {
  imported: ImportResult[];
  skipped: { conversationId: string; reason: string; existingChannelId?: string }[];
  totalImported: number;
  totalSkipped: number;
}
```

Update `Channel` interface to include optional import fields:
```typescript
export interface Channel {
  // ... existing fields ...
  source?: string;           // 'claude-code' | 'claude-ai'
  sourceMetadata?: string;   // JSON string
}
```

Update `Message` interface:
```typescript
export interface Message {
  // ... existing fields ...
  originalTimestamp?: string;
  originalId?: string;
}
```

## File Inventory

| File | Action | Description |
|------|--------|-------------|
| `packages/server/src/import/claude-ai-parser.ts` | CREATE | Parser for claude.ai JSON format |
| `packages/server/src/import/claude-ai-zip.ts` | CREATE | ZIP extraction utility |
| `packages/server/src/routes/import.ts` | CREATE or EXTEND | Import route (may already exist from Phase 1) |
| `packages/server/src/db/queries.ts` | EXTEND | Add `findChannelBySourceId()` if not already present |
| `packages/server/src/db/index.ts` | VERIFY | Ensure Phase 1 migrations are in place |
| `packages/server/src/__tests__/claude-ai-parser.test.ts` | CREATE | Parser unit tests |
| `packages/server/src/__tests__/claude-ai-import.test.ts` | CREATE | Integration tests |
| `packages/server/src/__tests__/fixtures/claude-ai/` | CREATE | Test fixture directory |
| `packages/server/src/__tests__/app.ts` | EXTEND | Register import routes |
| `packages/server/src/index.ts` | EXTEND | Register import routes |
| `packages/shared/src/types.ts` | EXTEND | Import-related types |
| `packages/server/package.json` | EXTEND | Add adm-zip dependency |

## Dependencies

- `adm-zip` — ZIP reading (lightweight, no native deps)
- `@types/adm-zip` — TypeScript types (dev dependency)

## Open Questions (resolved)

1. ~~ZIP library~~ → adm-zip
2. ~~Multi-conversation UX~~ → Import all, user browses/deletes
3. ~~File upload vs path~~ → Multipart file upload
