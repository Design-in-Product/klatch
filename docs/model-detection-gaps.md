# Model Detection Gaps in claude.ai Exports

**Date:** 2026-03-14
**Author:** Daedalus
**Status:** Documented — accepted limitation
**Ticket:** 8¾e

## Finding

Claude.ai data exports contain **no model information** at any level:

- **Conversation level:** No `model` field on conversation objects
- **Message level:** No `model` field on `chat_messages` entries
- **Project level:** No `model` field on `projects.json` entries

This is a platform limitation in the claude.ai export format. It applies to all conversations regardless of which model was used (Opus, Sonnet, Haiku, etc.).

### Comparison with Claude Code

Claude Code JSONL sessions include model info on each assistant response event (`event.message.model`). Our parser extracts this as `ParsedTurn.model` and determines the most common model per session (`ParsedSession.model`). Imported channels from Claude Code display correct model attribution.

### What we know about the export format

From Hermes's export format analysis (2026-03-13):

| Field | claude.ai conversations.json | Claude Code JSONL |
|-------|------------------------------|-------------------|
| Conversation ID | `uuid` | session ID (directory name) |
| Conversation name | `name` | `slug` (from cwd) |
| Message sender | `sender: 'human' \| 'assistant'` | Event role inference |
| Message model | **Not present** | `event.message.model` |
| Project link | `project_uuid` | Implicit (cwd) |
| Timestamps | `created_at`, `updated_at` | Event timestamps |

## Impact

When importing from claude.ai, all conversations default to the channel's current model setting (typically the Klatch default, currently Opus 4.6). This means:

1. Conversations originally held with Sonnet or Haiku will be continued using Opus (or whatever the channel default is)
2. There's no way to display historical model info for imported messages
3. The user has no signal about which model was originally used

### Severity: Low

In practice, this is acceptable:
- Users choosing to continue an imported conversation generally want the best available model
- Historical model info is "nice to have" but not required for conversation continuity
- The kit briefing and project context injection (8¾a) matter far more for import fidelity than model matching

## Decision

**Accept the limitation.** Specifically:

1. **Default behavior:** All claude.ai imports use the channel's model setting (unchanged from current behavior)
2. **No heuristic detection:** We will NOT try to infer model from conversation names, message style, or other signals — this would be fragile and misleading
3. **Future option: Manual override.** If users report this as a pain point, we can add a model selector in the import browse panel. The infrastructure exists (`channel.model` is already editable per-channel). This is a UI-only change when/if needed.

## Verification

Confirmed by inspecting:
- `packages/server/src/import/claude-ai-parser.ts` — `ClaudeAiMessage` and `ClaudeAiConversation` interfaces have no model field
- `packages/server/src/import/claude-ai-zip.ts` — No model extraction from ZIP
- `packages/server/src/import/parser.ts` — Claude Code parser DOES extract model (lines 329-354, 407-430)
- Hermes research doc (`research/claude-export-format-analysis.docx`)

## Related

- 8¾a: Project context injection — captures and injects project prompts (higher impact than model matching)
- 8¾b: Kit briefing verification — confirmed working (0% phantom rate)
- Step 8 remaining work plan: `docs/plans/step8-remaining.md`
