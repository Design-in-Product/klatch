# Step 8 Briefing: Import & Unify

**To:** Daedalus (architecture & implementation)
**From:** Argus (quality & research) + xian (product direction)
**Date:** March 9, 2026
**Re:** Design analysis and phased plan for Step 8 — importing external Claude conversations into Klatch

---

## Executive Summary

Step 8 makes Klatch the single pane of glass for all Claude interactions. We import Claude Code sessions (Phase 1), add a metadata framework (Phase 2), and later support claude.ai exports (Phase 3). The design stores full-fidelity data locally but displays it collapsed, and leverages Anthropic's server-side **compaction API** for efficient history management when continuing imported conversations.

Key design decisions already aligned with xian:
- **Fork, don't sync**: Imports are snapshots. Continuing a conversation forks into Klatch-native chronology. No write-back.
- **Store everything, display selectively**: Full JSONL data preserved in DB. Tool use collapsed by default, expandable on demand.
- **Seamless fork continuity**: When you continue an imported conversation, Claude "remembers" everything — the API is stateless, so we just send the reconstructed message history.
- **Subagents tracked, not surfaced**: Subagent sessions stored as metadata, visible as tool-use summaries. Full introspection is a future feature.

---

## Part 1: Claude Code JSONL Format (Research Complete)

### Source location
Sessions live at `~/.claude/projects/<munged-path>/`. The path is the project directory with `/` replaced by `-`. Each session is a `.jsonl` file named by UUID. Subagent sessions are nested under `<sessionId>/subagents/agent-<agentId>.jsonl`.

### Event structure
Each JSONL line is one event:

```
{
  type:           "user" | "assistant" | "system" | "queue-operation" | "progress"
  uuid:           string          // unique event ID
  parentUuid:     string | null   // links into a tree (null = conversation root)
  sessionId:      string          // groups events into a session
  timestamp:      string          // ISO 8601
  userType:       "external"      // human-initiated
  version:        string          // Claude Code version
  cwd:            string          // working directory
  gitBranch:      string          // active branch
  permissionMode: string          // "default" etc.
  message: {
    role:    "user" | "assistant"
    content: ContentBlock[]       // array of typed blocks
  }
}
```

### Content block types

| Type | Description | Frequency in sample |
|------|-------------|---------------------|
| `text` | Conversation content (the actual dialogue) | ~14% |
| `tool_use` | Tool invocation (`name`, `input` params) | ~39% |
| `tool_result` | Tool output (linked to tool_use by `tool_use_id`) | ~39% |
| `thinking` | Extended thinking / chain-of-thought | ~3% |
| `image` | Base64-encoded images (screenshots) | <1% |

**Key finding: ~80% of content blocks are tool traffic.** A 227-event session contained only 30 text blocks vs. 180 tool-use/tool-result pairs.

### The parentUuid graph

The parentUuid chain forms a **tree, not a linked list**:

```
user message (root, parentUuid=null)     ← human turn boundary
  └─ assistant: thinking
       └─ assistant: text ("Let me look at...")
            ├─ assistant: tool_use(Read)     ← branches = parallel tool calls
            │    └─ user: tool_result
            ├─ assistant: tool_use(Bash)
            │    └─ user: tool_result
            └─ assistant: tool_use(Read)
                 └─ user: tool_result
                      └─ assistant: text ("Here's what I found...")
```

- **Roots** (parentUuid=null) are user messages — each starts a new conversational turn
- **Branches** occur at parallel tool calls — one parent spawns multiple children
- **tool_result events have `role: "user"`** — they're system-generated, not human
- In a sample session: 2 roots, 41 branching parents out of 180 total, up to 114 descendants per turn

This tree structure gives us the **ordering and grouping** needed to reconstruct "this text response was the culmination of these 12 tool calls."

### Subagent sessions

```
Parent session: ebafb5f5-748a-...
  └─ subagents/agent-a3413560563e42a06.jsonl (146 lines)
     - isSidechain: true
     - agentId: a3413560563e42a06    ← links to parent's tool_use(Agent) call
     - sessionId: same as parent
     - Own tool chain: 146 events (Bash, Read, Glob, etc.)
```

The `agentId` field links back to the specific `tool_use(Agent)` in the parent. The subagent has its own conversation but shares the parent's `sessionId` and is flagged `isSidechain: true`.

### Tool distribution (from Klatch project sessions, 49 files, 41K total lines)

Common tool names in `tool_use` blocks: `Read`, `Bash`, `Write`, `Edit`, `Glob`, `Grep`, `TodoWrite`, `Agent`, `WebSearch`, `WebFetch`, `NotebookEdit`.

---

## Part 2: Concept Model Alignment

### The mapping

| Human concept | Klatch term | Claude Code equivalent | API reality |
|---|---|---|---|
| "A place I talk about X" | **Channel** | Session | N/A (Klatch-only) |
| "A Claude I configured" | **Entity** | Implicit (one model per session) | One `messages[]` array per API call |
| "The back-and-forth" | Entity's history in a channel | The JSONL file | Stateless — rebuilt each call |
| "A work session" | (Channel, time range) | Session file | N/A |

**Key insight**: Claude's API is stateless. There is no server-side "session" — each call sends the full message history. So importing doesn't break any contract. We're just pre-populating the message list that gets sent on the next call.

This means:
- A Klatch **channel** = a conversation space (organizational)
- A Klatch **entity** = an API-level conversation thread (model + prompt + history)
- An imported Claude Code **session** = a channel with one auto-created entity
- **Each entity in a multi-entity channel is its own Claude "session" at the API level**

### What import creates

For a Claude Code session import:
1. **One channel** — named from project + date (e.g., "klatch-import-2026-03-08")
2. **One entity** — auto-created with the session's model, a generic system prompt, and an import-source color
3. **Messages** — user text + assistant text turns, with original timestamps
4. **Artifacts** — tool-use sequences, thinking blocks, images stored separately, linked to their parent message

---

## Part 3: History Construction & Token Efficiency

### The fork continuity problem

When a user continues an imported conversation, Claude must "remember" the prior context. Since the API is stateless, Klatch sends the message history on each call. But a raw Claude Code session might be 200K+ tokens of tool traffic.

### Solution: Anthropic's Compaction API

Anthropic provides a **server-side compaction** feature (beta: `compact-2026-01-12`) that is purpose-built for this:

```typescript
const response = await client.beta.messages.create({
  betas: ["compact-2026-01-12"],
  model: "claude-opus-4-6",
  max_tokens: 4096,
  messages,
  context_management: {
    edits: [{
      type: "compact_20260112",
      trigger: { type: "input_tokens", value: 150000 }
    }]
  }
});
```

**How it works:**
1. When input tokens exceed the trigger threshold (default: 150K, min: 50K), Claude automatically summarizes older context
2. Returns a `compaction` block containing the summary
3. On subsequent requests, everything before the compaction block is dropped
4. Supports custom `instructions` to guide what the summary preserves
5. Supports `pause_after_compaction` for inserting additional context after summary

**Complementary feature: Context Editing** — Anthropic also offers `clear_tool_uses_20250919`, a lighter-touch approach that specifically clears old tool results from history without full summarization. For imported Claude Code sessions where tool results dominate (~80%), this could be applied first (strip tool results from older turns) with compaction as a second pass if still over threshold.

JetBrains research on coding agent context management confirms this strategy: masking old tool observation outputs while keeping the full action/reasoning chain was the most effective approach. Their best result: keep the last 10 turns at full fidelity, summarize 21 turns at a time for older context.

**Why this is ideal for Klatch:**
- We don't need to build our own summarization. The API handles it.
- Two-tier approach: context editing strips tool bloat first, compaction summarizes if still over threshold
- We can set a conservative trigger (e.g., 80K tokens) for imported channels with heavy history
- Custom instructions can say: "Preserve the conversational content and decisions. Tool use was for code editing and file reading — summarize outcomes, not individual operations."
- Klatch stores the full history locally regardless — compaction only affects what's sent to the API

### History construction strategy for imported channels

1. **Build message array**: user text + assistant text turns only (skip tool blocks, thinking, images)
2. **Enable compaction**: all channels with imported history get compaction enabled by default
3. **Custom compaction instructions per channel**: stored alongside channel metadata, defaults to a sensible import-focused prompt
4. **Result**: First message in a forked-from-import channel feels seamless — Claude has the full conversational context without the token weight of every `cat file.ts` result

### Token budget design principle (new, for ROADMAP)

> **Token discipline**: Klatch is a thin layer over the API. Imported history is sent as compressed conversation turns, not raw transcripts. Tool-use detail is stored locally but never re-transmitted. System prompts should be measured and their token cost made visible. Every token sent to the API should earn its place.

---

## Part 4: claude.ai Export Format (Phase 3 Research)

### What we know

- **Export method**: Settings → Privacy → Export Data (web/desktop only, not mobile)
- **Delivery**: HTTPS link sent to verified email, expires in 24 hours
- **Format**: ZIP file containing JSON conversation data
- **Known limitation**: The official export **does not include model information** per conversation — third-party tools infer it from timestamps + Anthropic's default model timeline
- **No artifacts in export**: File attachments and artifacts are not included in the official export
- **All-or-nothing**: You export everything, not individual conversations

### What we don't know yet (needs hands-on research with an actual export)

- Exact JSON schema of the conversation files inside the ZIP
- How projects/folders are represented (if at all)
- Whether system prompts from claude.ai projects are included
- Timestamp granularity on individual messages

### Implications for Klatch design

- The ZIP-based format is fundamentally different from Claude Code's per-session JSONL — we need a separate parser
- Missing model info means we may need to infer or let the user choose when importing
- Missing artifacts means claude.ai import will be text-only (which is fine for Phase 3)
- The schema differences confirm that our import architecture must be **pluggable** — each source gets its own parser that normalizes into Klatch's internal format

### No paradigm lock-in

The Phase 1 design (Claude Code import) does not lock us into anything incompatible with Phase 3:
- The `source` field on channels accommodates any source type
- The `source_metadata` JSON blob is schema-free per source
- The message + artifact storage model works for both tool-heavy JSONL and text-only claude.ai conversations
- Compaction works the same regardless of import source

---

## Part 5: Phased Implementation Plan

### Phase 1: Read-only Claude Code import (MVP)

| Sub-step | Description | Size |
|----------|-------------|------|
| 8.1 | **Parser**: JSONL reader that walks the parentUuid tree, extracts text turns, collapses tool-use into summaries | M |
| 8.2 | **Artifact storage**: New `message_artifacts` table for tool-use sequences, thinking blocks, images | M |
| 8.3 | **Import API**: `POST /api/import/claude-code` — accepts session path, creates channel + entity + messages + artifacts | M |
| 8.4 | **Minimal UI**: Import button in sidebar, file path input, progress indicator, navigate to new channel on completion | S |
| 8.5 | **Source badges**: Visual indicator on imported channels (icon, "imported from Claude Code" tag in channel settings) | S |

### Phase 1.5: Metadata Framework (Step 8½)

| Sub-step | Description | Size |
|----------|-------------|------|
| 8.6 | **Schema additions**: `source`, `source_metadata` on channels; `original_timestamp`, `original_id` on messages | S |
| 8.7 | **Import provenance**: Track when imported, from where, original session ID, project name | S |
| 8.8 | **Tool-use stats**: Per-message artifact counts; per-channel summary (files read, commands run, etc.) | S |
| 8.9 | **Cross-channel grouping**: Proto-project support — "these channels were imported from the same project directory" | M |

### Phase 2: Make imports useful

| Sub-step | Description | Size |
|----------|-------------|------|
| 8.10 | **Fork continuity**: Enable compaction for imported channels; build smart history construction (text-only + compaction) | M |
| 8.11 | **Continue-from-import**: Auto-entity creation, first message sends reconstructed history | M |
| 8.12 | **Bulk import**: Scan `~/.claude/projects/`, show session list with metadata preview, multi-select import | M |

### Phase 3: claude.ai import (independent track)

| Sub-step | Description | Size |
|----------|-------------|------|
| 8.13 | **Research**: Obtain actual export, document JSON schema, map to Klatch concepts | S |
| 8.14 | **Parser**: ZIP reader, JSON conversation extractor, model inference from timestamps | M |
| 8.15 | **Import API + UI**: `POST /api/import/claude-ai` with file upload | M |

### Dependency graph

```
8.1 (parser) → 8.2 (artifacts table) → 8.3 (import API) → 8.4 (UI) → 8.5 (badges)
                                              ↓
                                    8.6–8.9 (metadata framework)
                                              ↓
                                    8.10 (compaction) → 8.11 (continue) → 8.12 (bulk)

8.13 (claude.ai research) → 8.14 (parser) → 8.15 (import + UI)
   (independent of Phase 1/2)
```

---

## Part 6: Schema Additions

### channels table

```sql
ALTER TABLE channels ADD COLUMN source TEXT NOT NULL DEFAULT 'native';
-- values: 'native', 'claude-code', 'claude-ai'

ALTER TABLE channels ADD COLUMN source_metadata TEXT;
-- JSON: { sessionPath, projectName, importedAt, originalSessionId, originalMessageCount }
```

### New table: message_artifacts

```sql
CREATE TABLE message_artifacts (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  -- 'tool_use', 'tool_result', 'thinking', 'image', 'tool_batch_summary'
  content TEXT NOT NULL,
  -- JSON blob: full original content block for fidelity
  summary TEXT,
  -- Human-readable: "Read file: src/App.tsx" or "Ran: npm test (exit 0)"
  sequence_order INTEGER NOT NULL DEFAULT 0,
  -- Ordering within a message's artifact chain
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_artifacts_message ON message_artifacts(message_id);
```

### messages table additions

```sql
ALTER TABLE messages ADD COLUMN original_timestamp TEXT;
-- Preserved from import source

ALTER TABLE messages ADD COLUMN original_id TEXT;
-- UUID from source system, for dedup on re-import
```

---

## Part 7: Open Questions for Discussion

1. **Subagent introspection depth**: Phase 1 tracks subagents as metadata. Future: should subagent sessions render as expandable sub-threads within the parent channel, or as linked child channels? (Leaning toward expandable sub-threads to avoid channel proliferation.)

2. **Import deduplication**: If you import the same session twice, should we detect and skip? Or create a second channel? (Leaning toward detect-and-warn via `original_id` matching.)

3. **Compaction instruction tuning**: The default compaction prompt is generic. Should Klatch provide per-source-type defaults? E.g., Claude Code imports: "Preserve decisions and outcomes, compress tool operations." Claude.ai imports: "Preserve the full conversational flow."

4. **Image handling**: Claude Code sessions can contain screenshots (base64 images). Store in `message_artifacts` as blobs? Or extract to filesystem and store paths? (Leaning toward DB blobs for portability, with a size warning for very large sessions.)

5. **Channel naming on import**: Auto-generated from project + date, but should the user be able to rename during import? (Probably yes — a simple text field in the import UI.)

---

## Part 8: Roadmap Updates

### Additions to Design Principles

> **7. Token discipline**: Klatch is a thin layer over the API. Imported history is sent as compressed conversation turns, not raw transcripts. Tool-use detail is stored locally but never re-transmitted. System prompts should be measured and their token cost made visible. Every token sent to the API should earn its place.

### Additions to Vision (far horizon)

> **Subagent introspection**: Imported Claude Code sessions may contain subagent work trees. Future versions could render these as expandable traces, enabling users to inspect how an agent delegated, what each subagent discovered, and how results were synthesized — a "replay debugger" for agentic workflows.

### Step 8½: Metadata Framework (inserted between Import and Search)

> **Dimension: provenance.** Where did each conversation come from, and how do they relate?
>
> Import provenance tracking, cross-channel project grouping, tool-use statistics, and the foundation for metadata-aware search. This is the hidden value layer — it automates the manual coordination overhead of tracking which conversations happened when and where.

---

## References

- [Anthropic Compaction API docs](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Anthropic Context Editing docs](https://platform.claude.com/docs/en/build-with-claude/context-editing)
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [JetBrains: Cutting Through the Noise — Smarter Context Management](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)
- [Claude Help Center: Export Data](https://support.claude.com/en/articles/9450526-how-can-i-export-my-claude-data)
- Claude Code JSONL analysis: 49 sessions from `~/.claude/projects/-home-user-klatch/`, 41K total events
