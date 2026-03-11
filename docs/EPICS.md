# Epic Decomposition

Detailed breakdown of Steps 6–9 from the roadmap, decomposed into implementable tasks. Each task is scoped to be completable in a single focused session.

---

## Step 6: Multi-Entity Conversations ✅

**The big shift.** This is where Klatch stops being "a nicer claude.ai" and becomes something new. The core challenge: the entire current architecture assumes one assistant per message, one stream per send. This step rewires that assumption.

### 6a: Prep — Schema and validation hardening ✅
_Do this first, before any entity work._
- [x] Add input validation on POST `/channels/:channelId/messages` (content required, channel must exist)
- [x] Wrap user + assistant message creation in a SQLite transaction
- [x] Update model IDs in `AVAILABLE_MODELS` to current versions (`claude-opus-4-6`, `claude-sonnet-4-6`, latest Haiku)
- [x] Add `DELETE /channels/:id` endpoint (with cascade delete of messages)
- [x] Update README and ROADMAP to reflect Steps 4–5 completion

### 6b: Entities table and CRUD ✅
- [x] Create `entities` table: `id`, `name`, `model`, `system_prompt`, `color`, `created_at` — `db/index.ts`
- [x] Migration: add `entity_id TEXT REFERENCES entities(id)` to messages table (nullable for backward compat) — `db/index.ts`
- [x] Create a "default" entity on first run (maps to current "Claude" identity) — `db/index.ts:162`
- [x] API: `GET /api/entities`, `POST /api/entities`, `PATCH /api/entities/:id`, `DELETE /api/entities/:id` — `routes/entities.ts`
- [x] Shared types: `Entity` interface, update `Message` to include optional `entityId` — `shared/types.ts`

### 6c: Channel-entity assignment ✅
- [x] Create `channel_entities` junction table: `channel_id`, `entity_id`, `added_at` — `db/index.ts:69`
- [x] API: `POST /api/channels/:id/entities` (assign), `DELETE /api/channels/:id/entities/:entityId` (remove), `GET /api/channels/:id/entities` (list) — `routes/entities.ts`
- [x] When creating a channel, auto-assign the default entity
- [x] Existing channels get the default entity via migration — `db/index.ts:172`

### 6d: Multi-entity streaming ✅
- [x] Modify POST `/channels/:channelId/messages` to create one assistant placeholder **per assigned entity**
- [x] Return array of `{ entityId, assistantMessageId, model }` instead of single message
- [x] `streamClaude` now takes an `entityId` parameter, uses that entity's model and system prompt
- [x] Kick off N parallel streams (one per entity)
- [x] Client opens N SSE connections, one per assistant message

### 6e: Client — entity UI ✅
- [x] Entity management panel (create, edit, delete entities — could be a sidebar section or settings page)
- [x] Channel settings: entity assignment UI (add/remove entities from channel)
- [x] `MessageBubble` shows entity name + color instead of generic "Claude"
- [x] Entity avatar: colored circle with first letter (simple, no images yet)
- [x] Update `useMessages` and streaming state to handle N concurrent streams

### 6f: Single-entity backward compatibility ✅
- [x] Channels with one entity behave exactly like today (no visual changes)
- [x] API responses remain backward-compatible (single-entity response is a 1-element array, or keep the old shape with a compat layer)
- [x] Test: existing conversations render correctly after migration

---

## Step 7: Interaction Modes ✅

**Three modes, each a different answer to "what happens when I send a message?"**

### 7a: Mode infrastructure ✅
- [x] Add `mode` column to channels table: `'panel' | 'roundtable' | 'directed'` — `db/index.ts:45,102`
- [x] Default mode: `panel` (simplest, entities respond independently) — `shared/types.ts:40`
- [x] UI: mode selector in channel settings (radio buttons or segmented control) — `ChannelSettings.tsx:244`
- [x] Shared type: `InteractionMode` — `shared/types.ts:39`

### 7b: Panel mode (parallel responses) ✅
- [x] All entities receive the user message + their own conversation history
- [x] Each entity streams independently and simultaneously
- [x] Messages display side-by-side or stacked with clear entity attribution
- [x] This is what 6d already implements — panel mode is the natural default

### 7c: Roundtable mode (sequential with shared context) ✅
- [x] Entities respond in order (configurable order in `channel_entities`)
- [x] Each entity sees all prior responses in the round, not just its own history
- [x] Server orchestrates: stream entity 1, wait for completion, stream entity 2 with entity 1's response in context, etc.
- [x] Client shows responses appearing sequentially
- [x] New concept: "round" — a group of entity responses triggered by one user message

### 7d: Directed mode (@-mentions) ✅
- [x] Parse `@entity-name` from user message content
- [x] Only the mentioned entity responds
- [x] If no @-mention, fall back to panel mode (all entities respond)
- [x] Autocomplete UI in message input: type `@` to see entity list — `MessageInput.tsx`
- [x] Visual: @-mentions rendered as styled chips in the message

### 7e: Mode-specific message history ✅
- [x] Panel mode: each entity has its own conversation thread (sees only its own responses + user messages)
- [x] Roundtable mode: all entities share one thread (everyone sees everything)
- [x] Directed mode: mentioned entity sees full history, unmention entities are dormant
- [x] This changes how `streamClaude` builds the `history` array — parameterize by mode

---

## Step 8: Import and Unify

**Making Klatch the single pane of glass.** Full design analysis in `docs/BRIEF-STEP8-IMPORT.md`. Retrospective in `docs/STEP8-RETROSPECTIVE.md`.

### Phase 1: Read-only Claude Code import (MVP) ✅

#### 8.1: JSONL Parser ✅
- [x] Document the JSONL format in `~/.claude/projects/` — see briefing Part 1
- [x] Identify: parentUuid tree structure, content block types, subagent nesting
- [x] Decision: tool use collapsed in display, stored in full fidelity
- [x] Implement: tree-walking parser that extracts text turns and collapses tool-use into summaries — `import/parser.ts`

#### 8.2: Artifact storage ✅
- [x] New `message_artifacts` table: id, message_id, type, content (JSON), summary (text), sequence_order — `db/index.ts:141`
- [x] Types: `tool_use`, `tool_result`, `thinking`, `image`, `tool_batch_summary`
- [x] Index on message_id for fast lookup — `db/index.ts:150`

#### 8.3: Import API ✅
- [x] `POST /api/import/claude-code` with `{ sessionPath: string }` — `routes/import.ts:46`
- [x] Create channel (source: 'claude-code') + auto-entity (from session model)
- [x] Insert messages with original timestamps + artifacts in batch
- [x] Store subagent references as metadata (not imported as separate channels)

#### 8.4: Minimal UI ✅
- [x] Import button in sidebar or settings — `ImportDialog.tsx`
- [x] File path input (later: directory scanner)
- [x] Progress indicator for large imports — loading state in ImportDialog
- [x] Navigate to new channel on completion

#### 8.5: Source badges ✅
- [x] Visual indicator on imported channels (icon/tag) — "CC" badge in `ChannelSidebar.tsx`
- [x] "Imported from Claude Code" in channel settings with source metadata — `ChannelSettings.tsx`

### Phase 1.5: Metadata Framework (Step 8½) ✅

#### 8.6: Schema additions ✅
- [x] `source TEXT` + `source_metadata TEXT` on channels — `db/index.ts:125`
- [x] `original_timestamp TEXT` + `original_id TEXT` on messages — `db/index.ts:132-136`

#### 8.7: Import provenance ✅
- [x] Track: import timestamp, source path, original session ID, project name — stored in `source_metadata` JSON
- [x] Display in channel settings — `ChannelSettings.tsx` provenance card

#### 8.8: Tool-use statistics ✅
- [x] Per-message artifact counts — `getChannelStats()` in `db/queries.ts:98`
- [x] Per-channel summary: files read, commands run, files written, subagents spawned — stats endpoint + ChannelSettings UI

#### 8.9: Cross-channel project grouping ✅
- [x] "These channels were imported from the same project directory" — `getAllChannelsEnriched()` extracts cwd from metadata
- [x] Proto-project UI: grouping in sidebar or filter — `ChannelSidebar.tsx` collapsible project groups

### Phase 2: Make imports live (partial)

#### 8.10: Fork continuity via Compaction ⚠️ (partial)
- [x] Enable Anthropic Compaction API (`compact-2026-01-12` beta) for imported channels — `claude/client.ts:207`
- [x] Build history constructor: text-only turns + compaction
- [ ] Custom compaction instructions per source type — **not implemented**
- [x] Configurable trigger threshold (default: 80K tokens for imported channels) — hardcoded at 80K in `client.ts:216`, not yet user-configurable

#### 8.11: Continue-from-import ⚠️ (partial)
- [x] Auto-entity creation from session config — import creates entity from session model
- [x] First new message sends reconstructed history seamlessly
- [ ] "Forked from import" marker in conversation flow — **not implemented**

#### 8.12: Bulk import — not started
- [ ] Scan `~/.claude/projects/` directory
- [ ] Show session list: project name, date, message count, tool-use stats
- [ ] Multi-select import with progress

### Phase 3: claude.ai import (independent track) ✅

#### 8.13: Research ✅
- [x] Obtain actual claude.ai data export (ZIP with JSON)
- [x] Document exact JSON schema of conversation files
- [x] Map: conversations → channels, note missing model info + artifacts

#### 8.14: Parser ⚠️ (partial)
- [x] ZIP reader + JSON conversation extractor — `import/claude-ai-zip.ts`, `import/claude-ai-parser.ts`
- [ ] Model inference from timestamps (or user selection) — **not implemented**, uses default model
- [x] Normalize to Klatch internal format

#### 8.15: Import API + UI ✅
- [x] `POST /api/import/claude-ai` with file upload — `routes/import.ts:168`
- [x] Reuse import UI patterns from Phase 1

### Known refinements (tracked, pre-Step 9)
- [ ] **Compaction summary misattribution**: `isCompactSummary` events render as "You" instead of system banner
- [ ] **`isMeta` event filtering**: hook feedback, skill injections should be filtered or rendered distinctly
- [ ] **Re-import / refresh**: allow updating existing channel (currently blocked by dedup 409)
- [ ] **Demo automation**: automated demo recording (currently manual)
- [ ] **"Forked from import" marker**: visual indicator when conversation transitions from imported to native
- [ ] **User-configurable compaction threshold**: currently hardcoded at 80K tokens
- [ ] **Custom compaction instructions per source type**: not yet implemented
- [ ] **claude.ai model inference**: imported conversations use default model instead of inferring from timestamps or allowing user selection

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

8.1 (parser) → 8.2 (artifacts table) → 8.3 (import API) → 8.4 (UI) → 8.5 (badges)
                                              ↓
                                    8.6–8.9 (metadata framework)
                                              ↓
                                    8.10 (compaction) → 8.11 (continue) → 8.12 (bulk)

8.13 (claude.ai research) → 8.14 (parser) → 8.15 (import + UI)
   (independent of Phase 1/2)

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
| 8.1 | M | JSONL tree-walking parser (research done) |
| 8.2 | M | Artifacts table + schema |
| 8.3 | M | Import API + batch insert |
| 8.4 | S | Minimal import UI |
| 8.5 | S | Source badges |
| 8.6 | S | Schema additions (source, metadata cols) |
| 8.7 | S | Import provenance tracking |
| 8.8 | S | Tool-use statistics |
| 8.9 | M | Cross-channel project grouping |
| 8.10 | M | Compaction API integration |
| 8.11 | M | Continue-from-import flow |
| 8.12 | M | Bulk import scanner + UI |
| 8.13 | S | claude.ai export research |
| 8.14 | M | claude.ai parser |
| 8.15 | M | claude.ai import API + UI |
| 9a | M | FTS5 setup + triggers |
| 9b | M | Search UI + navigation |
| 9c | M | Command palette from scratch |
| 9d | S | Export logic + UI button |
| 9e | S | Boolean column + filter UI |
