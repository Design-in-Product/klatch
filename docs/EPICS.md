# Epic Decomposition

Detailed breakdown of Steps 6–9 from the roadmap, decomposed into implementable tasks. Each task is scoped to be completable in a single focused session.

---

## Step 6: Multi-Entity Conversations

**The big shift.** This is where Klatch stops being "a nicer claude.ai" and becomes something new. The core challenge: the entire current architecture assumes one assistant per message, one stream per send. This step rewires that assumption.

### 6a: Prep — Schema and validation hardening
_Do this first, before any entity work._
- [ ] Add input validation on POST `/channels/:channelId/messages` (content required, channel must exist)
- [ ] Wrap user + assistant message creation in a SQLite transaction
- [ ] Update model IDs in `AVAILABLE_MODELS` to current versions (`claude-opus-4-6`, `claude-sonnet-4-6`, latest Haiku)
- [ ] Add `DELETE /channels/:id` endpoint (with cascade delete of messages)
- [ ] Update README and ROADMAP to reflect Steps 4–5 completion

### 6b: Entities table and CRUD
- [ ] Create `entities` table: `id`, `name`, `model`, `system_prompt`, `color`, `created_at`
- [ ] Migration: add `entity_id TEXT REFERENCES entities(id)` to messages table (nullable for backward compat)
- [ ] Create a "default" entity on first run (maps to current "Claude" identity)
- [ ] API: `GET /api/entities`, `POST /api/entities`, `PATCH /api/entities/:id`, `DELETE /api/entities/:id`
- [ ] Shared types: `Entity` interface, update `Message` to include optional `entityId`

### 6c: Channel-entity assignment
- [ ] Create `channel_entities` junction table: `channel_id`, `entity_id`, `added_at`
- [ ] API: `POST /api/channels/:id/entities` (assign), `DELETE /api/channels/:id/entities/:entityId` (remove), `GET /api/channels/:id/entities` (list)
- [ ] When creating a channel, auto-assign the default entity
- [ ] Existing channels get the default entity via migration

### 6d: Multi-entity streaming
- [ ] Modify POST `/channels/:channelId/messages` to create one assistant placeholder **per assigned entity**
- [ ] Return array of `{ entityId, assistantMessageId, model }` instead of single message
- [ ] `streamClaude` now takes an `entityId` parameter, uses that entity's model and system prompt
- [ ] Kick off N parallel streams (one per entity)
- [ ] Client opens N SSE connections, one per assistant message

### 6e: Client — entity UI
- [ ] Entity management panel (create, edit, delete entities — could be a sidebar section or settings page)
- [ ] Channel settings: entity assignment UI (add/remove entities from channel)
- [ ] `MessageBubble` shows entity name + color instead of generic "Claude"
- [ ] Entity avatar: colored circle with first letter (simple, no images yet)
- [ ] Update `useMessages` and streaming state to handle N concurrent streams

### 6f: Single-entity backward compatibility
- [ ] Channels with one entity behave exactly like today (no visual changes)
- [ ] API responses remain backward-compatible (single-entity response is a 1-element array, or keep the old shape with a compat layer)
- [ ] Test: existing conversations render correctly after migration

---

## Step 7: Interaction Modes

**Three modes, each a different answer to "what happens when I send a message?"**

### 7a: Mode infrastructure
- [ ] Add `mode` column to `channel_entities` or `channels` table: `'panel' | 'roundtable' | 'directed'`
- [ ] Default mode: `panel` (simplest, entities respond independently)
- [ ] UI: mode selector in channel settings (radio buttons or segmented control)
- [ ] Shared type: `InteractionMode`

### 7b: Panel mode (parallel responses)
- [ ] All entities receive the user message + their own conversation history
- [ ] Each entity streams independently and simultaneously
- [ ] Messages display side-by-side or stacked with clear entity attribution
- [ ] This is what 6d already implements — panel mode is the natural default

### 7c: Roundtable mode (sequential with shared context)
- [ ] Entities respond in order (configurable order in `channel_entities`)
- [ ] Each entity sees all prior responses in the round, not just its own history
- [ ] Server orchestrates: stream entity 1, wait for completion, stream entity 2 with entity 1's response in context, etc.
- [ ] Client shows responses appearing sequentially
- [ ] New concept: "round" — a group of entity responses triggered by one user message

### 7d: Directed mode (@-mentions)
- [ ] Parse `@entity-name` from user message content
- [ ] Only the mentioned entity responds
- [ ] If no @-mention, fall back to panel mode (all entities respond)
- [ ] Autocomplete UI in message input: type `@` to see entity list
- [ ] Visual: @-mentions rendered as styled chips in the message

### 7e: Mode-specific message history
- [ ] Panel mode: each entity has its own conversation thread (sees only its own responses + user messages)
- [ ] Roundtable mode: all entities share one thread (everyone sees everything)
- [ ] Directed mode: mentioned entity sees full history, unmention entities are dormant
- [ ] This changes how `streamClaude` builds the `history` array — parameterize by mode

---

## Step 8: Import and Unify

**Making Klatch the single pane of glass.**

### 8a: Research — Claude Code session format
- [ ] Document the JSONL format in `~/.claude/projects/`
- [ ] Identify fields: session ID, messages, tool use, timestamps, project path
- [ ] Determine what maps to Klatch concepts (session → channel, messages → messages)
- [ ] Handle tool-use messages (display-only? collapse? reconstruct?)

### 8b: Claude Code import — backend
- [ ] API: `POST /api/import/claude-code` with `{ sessionPath: string }`
- [ ] Parser: read JSONL, extract user/assistant messages, skip tool-use internals
- [ ] Create a new channel per imported session (name: project name + date)
- [ ] Create an entity that matches the session's system prompt/model
- [ ] Insert messages with original timestamps preserved
- [ ] Batch insert for performance (100+ messages per session is common)

### 8c: Claude Code import — frontend
- [ ] Import UI: file picker or path input for session directory
- [ ] Preview: show session metadata before importing (message count, date range, project)
- [ ] Progress indicator for large imports
- [ ] Post-import: navigate to the new channel

### 8d: Research — claude.ai export format
- [ ] Investigate claude.ai data export (Settings → Export data)
- [ ] Document the export format (likely JSON archive)
- [ ] Map claude.ai concepts to Klatch (projects → ?, conversations → channels)
- [ ] Identify gaps: artifacts, file attachments, project knowledge

### 8e: claude.ai import
- [ ] Parser for claude.ai export format
- [ ] API: `POST /api/import/claude-ai` with uploaded archive
- [ ] Handle multi-turn conversations with system prompts
- [ ] Tag imported channels with source metadata

---

## Step 9: Search and Recall

**Finding things across all your conversations.**

### 9a: Full-text search via FTS5
- [ ] Create FTS5 virtual table: `messages_fts` mirroring `messages.content`
- [ ] Triggers to keep FTS in sync on INSERT/UPDATE/DELETE
- [ ] Rebuild command for existing data
- [ ] API: `GET /api/search?q=query` — returns matching messages with channel context
- [ ] Snippet extraction with highlight markers

### 9b: Search UI
- [ ] Search bar (top of sidebar or in header)
- [ ] Results list: message snippet, channel name, date, entity name
- [ ] Click result → navigate to channel, scroll to message
- [ ] Keyboard shortcut: Cmd+K or Cmd+F to focus search
- [ ] Debounced input (300ms) for live results

### 9c: Command palette
- [ ] Cmd+K opens command palette overlay
- [ ] Actions: switch channel, create channel, search messages, open settings
- [ ] Fuzzy matching on channel names and entity names
- [ ] Recent items / frequently used at top
- [ ] This is independent of FTS — it's navigation, not content search

### 9d: Export
- [ ] `GET /api/channels/:id/export?format=markdown` — returns channel as .md
- [ ] `GET /api/channels/:id/export?format=json` — returns structured JSON
- [ ] Include entity attribution in export
- [ ] UI: export button in channel settings
- [ ] Bulk export: all channels as a zip

### 9e: Bookmarks
- [ ] Add `bookmarked` boolean column to messages
- [ ] API: `PATCH /api/messages/:id` with `{ bookmarked: true }`
- [ ] UI: bookmark icon on message hover (star or flag)
- [ ] Bookmarks panel: view all bookmarked messages across channels
- [ ] Bookmarks in search results get priority ranking

---

## Dependency Graph

```
6a (prep) → 6b (entities) → 6c (assignment) → 6d (streaming) → 6e (UI) → 6f (compat)
                                                      ↓
                                                7a (modes) → 7b (panel) → 7c (roundtable)
                                                                  ↓
                                                            7d (directed) → 7e (history)

8a (research) → 8b (CC backend) → 8c (CC frontend)
8d (research) → 8e (claude.ai import)

9a (FTS5) → 9b (search UI)
9c (command palette) — independent
9d (export) — independent
9e (bookmarks) → feeds into 9b
```

Steps 8 and 9 are independent of each other and can be interleaved with Step 7. Step 6 must complete before Step 7.

---

## Effort Estimates (relative, not time)

| Task | Size | Notes |
|------|------|-------|
| 6a | S | Validation + cleanup, low risk |
| 6b | M | New table, CRUD, types |
| 6c | S | Junction table + simple API |
| 6d | L | Core architectural change to streaming |
| 6e | L | Significant client-side work |
| 6f | S | Testing + edge cases |
| 7a | S | Schema + types |
| 7b | S | Already works after 6d |
| 7c | L | Sequential orchestration is complex |
| 7d | M | Parsing + autocomplete UI |
| 7e | M | Rethinking history construction |
| 8a | S | Research only |
| 8b | M | Parser + batch insert |
| 8c | M | File handling UI |
| 8d | S | Research only |
| 8e | M | Parser + upload handling |
| 9a | M | FTS5 setup + triggers |
| 9b | M | Search UI + navigation |
| 9c | M | Command palette from scratch |
| 9d | S | Export logic + UI button |
| 9e | S | Boolean column + filter UI |
