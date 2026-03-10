# Claude Code JSONL Session Format

Reverse-engineered schema for Claude Code session files (`~/.claude/projects/<path>/<session-id>.jsonl`). Anthropic does not publish a formal spec; this document reflects what we've learned from real session files.

**Status:** Living document. Updated as we discover new patterns.
**Last updated:** 2026-03-10 (from session `e19ec6fe`, 5,568 events, 10 compaction cycles)

---

## File Structure

One JSON object per line. Events are chronologically ordered. Each event has a `uuid` and chains to the previous via `parentUuid` (linked list, not tree — only the very first event has `parentUuid: null`).

## Common Fields (all events)

| Field | Type | Description |
|-------|------|-------------|
| `uuid` | string | Unique event ID |
| `parentUuid` | string \| null | Previous event in the chain. Only null for the very first event or `compact_boundary` events |
| `type` | string | Event type (see below) |
| `timestamp` | ISO 8601 | When the event was created |
| `sessionId` | string | Session UUID, same across all events in a file |
| `cwd` | string | Working directory at time of event |
| `version` | string | Claude Code version (e.g., "2.1.63") |
| `gitBranch` | string | Current git branch |
| `slug` | string | Human-readable session name (e.g., "linear-humming-deer") |
| `isSidechain` | boolean | Whether this event belongs to a subagent conversation |
| `userType` | string | Observed: "external" |

## Event Types

### `queue-operation`
Enqueue/dequeue markers. Not part of the conversation.
- `operation`: "enqueue" | "dequeue"
- `content`: The queued message text
- Appears at session start (first event is usually an enqueue)

### `system`
System-level events. Never sent to the Claude API.

| Subtype | Purpose | Key fields |
|---------|---------|------------|
| `compact_boundary` | Marks where compaction occurred | `compactMetadata: { trigger, preTokens }`, `logicalParentUuid`, `parentUuid: null`, `content: "Conversation compacted"` |
| `stop_hook_summary` | Hook execution summary after tool calls | `hookCount`, `hookInfos`, `hookErrors`, `preventedContinuation`, `stopReason`, `hasOutput`, `toolUseID` |
| `api_error` | API call failure with retry info | `error: {}`, `retryInMs`, `retryAttempt`, `maxRetries` |

All system events have:
- `subtype`: string identifying the specific kind
- `level`: "info" | "suggestion" | "error"
- No `message` field

### `user`
Messages with `role: "user"`. **Not all are human-typed.** This is the most complex type because Claude Code injects several kinds of synthetic user messages.

#### How to classify user events:

| Category | Distinguishing fields | Notes |
|----------|----------------------|-------|
| **Real human message** | Has `permissionMode` ("default" \| "acceptEdits"). No `isMeta`, no `isCompactSummary`, no `isVisibleInTranscriptOnly`. | The only kind that should render as "You" in the UI |
| **Compaction summary** | `isCompactSummary: true`, `isVisibleInTranscriptOnly: true`. No `permissionMode`. | Text starts with "This session is being continued from a previous conversation that ran out of context." Always preceded by a `compact_boundary` system event with the same timestamp. |
| **Tool result** | `message.content` is array of `{ type: "tool_result", tool_use_id, content, is_error }`. Has `sourceToolAssistantUUID`, `toolUseResult`. | Response to a previous assistant tool_use block |
| **Hook feedback** | `isMeta: true`. No `permissionMode`. | Content starts with "Stop hook feedback:\n". Injected by pre/post-tool hooks. |
| **Skill/command injection** | `isMeta: true`, `sourceToolUseID` present. No `permissionMode`. | Content is structured markdown (e.g., "# Release a new version..."). Triggered by /slash commands. |
| **Image reference** | `isMeta: true`. No `permissionMode`. | Content matches `[Image: original WxH, displayed at WxH...]` |
| **Task notification** | Content starts with `<task-notification>`. Has `permissionMode` (anomalous). No `isMeta`. | Background agent completion. Contains XML with task-id, status, summary, result. |

#### User event fields:

| Field | Type | Presence | Description |
|-------|------|----------|-------------|
| `message` | object | Always | `{ role: "user", content: string \| ContentBlock[] }` |
| `permissionMode` | string | Real human messages + task notifications only | "default" or "acceptEdits" |
| `isMeta` | boolean | Hook/skill/image injections | Marks system-injected content |
| `isCompactSummary` | boolean | Compaction summaries only | Most reliable compaction flag |
| `isVisibleInTranscriptOnly` | boolean | Compaction summaries only | Secondary compaction flag |
| `sourceToolAssistantUUID` | string | Tool results only | Links back to the assistant event that made the tool call |
| `toolUseResult` | object | Tool results only | `{ stdout, stderr, interrupted }` or similar |
| `sourceToolUseID` | string | Skill injections only | References the Skill tool invocation |

### `assistant`
Claude's responses. Always have `message.role: "assistant"`.

| Field | Type | Description |
|-------|------|-------------|
| `message.content` | ContentBlock[] | Array of content blocks |
| `message.model` | string | Model used (e.g., "claude-opus-4-20250514") |
| `message.id` | string | Anthropic API message ID |
| `message.stop_reason` | string \| null | "end_turn", "tool_use", or null (streaming) |
| `message.usage` | object | `{ input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens }` |
| `requestId` | string | API request ID |

### `progress`
Tool execution progress updates. Skipped during import.

### `file-history-snapshot`
File state snapshots. Skipped during import.

## Content Blocks

Used in `message.content` arrays:

| Type | Key fields | Description |
|------|-----------|-------------|
| `text` | `text: string` | Text content |
| `tool_use` | `id, name, input` | Tool invocation (e.g., Read, Write, Bash, Grep, Glob, Edit) |
| `tool_result` | `tool_use_id, content, is_error` | Tool execution result |
| `thinking` | `thinking: string` | Extended thinking block |
| `image` | `source: { type, media_type, data }` | Base64-encoded image |

## Subagent Events

Events from subagents have `isSidechain: true` and an `agentId` field.

| Pattern | Type | Description |
|---------|------|-------------|
| `a{hex}` (e.g., `a62e6d96761c1c910`) | Task subagent | Spawned by Agent tool for parallel work |
| `acompact-{id}` | Compaction subagent | Performs context summarization |
| `aprompt_suggestion-{id}` | Prompt suggestion | Generates follow-up suggestions (skip entirely) |

## Compaction Lifecycle

When a session exceeds the context window (~167K tokens observed):

1. **Compaction subagent** runs on a sidechain (`agentId: "acompact-..."`, `isSidechain: true`)
2. **`compact_boundary`** system event is written:
   - `parentUuid: null` (breaks the chain)
   - `logicalParentUuid`: points to the last pre-compaction event (preserves logical continuity)
   - `compactMetadata: { trigger: "auto", preTokens: 167012 }`
3. **Compaction summary** user event immediately follows:
   - `isCompactSummary: true`
   - `isVisibleInTranscriptOnly: true`
   - `parentUuid` points to the `compact_boundary` event
   - Content is the summary text starting with "This session is being continued..."
4. Conversation continues from the summary as new context

A long session can have many compaction cycles (10 observed in a ~5,500-event session).

## Import Implications

For Klatch import:
- **Parse**: user + assistant events where `isSidechain: false`
- **Turn boundaries**: user events that are real human messages (have `permissionMode`, no `isMeta`/`isCompactSummary`)
- **Compaction summaries**: render as system banners, not "You" bubbles
- **Tool results**: collapse into artifacts on the preceding assistant message
- **Skip**: queue-operation, system, progress, file-history-snapshot, prompt_suggestion sidechains
- **Extract from sidechains**: compaction summaries (from acompact-* events), task subagent metadata

## Open Questions

- [ ] Are there other `system` subtypes we haven't seen?
- [ ] Does `permissionMode` ever appear on compaction summaries? (Not observed)
- [ ] What does `logicalParentUuid` look like in non-compaction contexts?
- [ ] How do multi-session projects link sessions together?
- [ ] Are there other `userType` values besides "external"?
