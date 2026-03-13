# Design: Project Instructions Inheritance

**Date:** 2026-03-13
**Authors:** Theseus Prime + xian (product owner)
**Status:** Approved — ready for implementation
**Intersects:** 8¾a (project context injection), kit briefing

## Problem

Every channel currently has its own `system_prompt` field. There is no shared project-level context. This means:

- Imported conversations lose their project instructions (CLAUDE.md, prompt_template) unless manually pasted per-channel
- Native channels in the same project can't share instructions
- There's no single place to edit project-wide context

## Decision: `projects` table + two-field inheritance

PO approved two design choices (2026-03-13 15:22):

1. **First-class `projects` table** (not stuffed into `sourceMetadata`)
2. **Two distinct fields** — project instructions + channel addendum

### Why a `projects` table

The alternative was keeping project context in `sourceMetadata` per-channel. Rejected because:
- `sourceMetadata` is per-channel — no sharing across channels in the same project
- Native channels don't have `sourceMetadata` at all
- Editing means touching each channel individually
- Project instructions are inherently relational (one project → many channels)

### Why two fields (not concatenation or replacement)

Three options were considered:

| Option | Model | Tradeoff |
|--------|-------|----------|
| A. Concatenation | `project + channel_prompt` | Channel prompt wasn't written expecting project context above it |
| B. Replacement | Project replaces channel prompt | Loses ability to layer channel-specific context |
| **C. Two fields** | `project_instructions + channel_addendum` | Clean layering, migration-friendly |

Option C won because it maps to the real mental model: project instructions are "what everyone in this project should know," channel addendum is "what's specific to this conversation." It also creates the extension point for future `role.md` layering: `project → role → channel`.

## Schema

### New table: `projects`

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'native',       -- 'native' | 'claude-code' | 'claude-ai'
  source_metadata TEXT NOT NULL DEFAULT '{}',   -- JSON: origin info for imported projects
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Channel changes

```sql
ALTER TABLE channels ADD COLUMN project_id TEXT REFERENCES projects(id);
```

The existing `system_prompt` field becomes the **channel addendum**. No column rename needed — the semantics shift but the storage is the same.

### Effective system prompt

Built at prompt-assembly time in `buildSystemPrompt()`:

```
effective_prompt = [kit_briefing] + [project.instructions] + [channel.system_prompt (addendum)]
```

Where:
- Kit briefing: only for imported channels (existing behavior)
- Project instructions: from `projects.instructions` if channel has a `project_id`
- Channel addendum: from `channels.system_prompt` (existing field, new role)

## Import Integration

### claude.ai imports

- Parse `projects.json` from ZIP → create `projects` rows with `source: 'claude-ai'`
- `prompt_template` → `projects.instructions`
- `project.name` → `projects.name`
- Store original project UUID, docs, etc. in `source_metadata`
- User associates conversations → projects during selective import (dropdown in browse panel)
- Imported channels get `project_id` FK to the created project

### Claude Code imports

- Read `CLAUDE.md` from project root → `projects.instructions`
- Project name from directory basename or user input
- `source: 'claude-code'`, `source_metadata: { cwd, ... }`
- All sessions from the same `cwd` share the same project

### Native channels

- User can create projects in the UI and assign channels to them
- "Project Instructions" is editable at the project level
- When assigning an existing channel to a project:
  - If the channel has a non-default system prompt, warn: "This channel has its own system prompt. It will be kept as a channel-level addendum alongside the project instructions. Continue?"
  - No silent overwrites

## UI Changes

### Channel Settings panel

Currently shows a single "System Prompt" textarea. Changes to:

1. **Project membership** — dropdown: "Project: [None / Project Name]" with link to edit project instructions
2. **Project Instructions** (read-only in channel settings) — shows inherited instructions from project, with "Edit in Project Settings" link. Only visible when channel belongs to a project.
3. **Channel Instructions** — the existing textarea, relabeled. Hint text: "Additional instructions specific to this conversation."

### New: Project Settings

Accessible from sidebar or channel settings link:
- Project name (editable)
- Project instructions (editable textarea — this is the CLAUDE.md equivalent)
- List of channels in this project
- Source badge for imported projects

### Sidebar

No immediate change. Future work (P3): group channels by project.

## Migration Path

1. Add `projects` table
2. Add `project_id` column to `channels` (nullable, no FK constraint initially for safety)
3. For existing imported channels with `sourceMetadata.claudeMd`:
   - Create a project from the source metadata
   - Link the channel to that project
   - Move `claudeMd` content to `project.instructions`
   - Keep `sourceMetadata` intact (don't delete — other fields still needed)
4. Existing native channels: `project_id = NULL`, behavior unchanged

## Prompt Assembly (updated `buildSystemPrompt`)

```typescript
function buildSystemPrompt(entity: Entity, channelPreamble?: string, channel?: Channel): string {
  const parts: string[] = [];

  // 1. Kit briefing (imported channels only)
  if (channel?.source && channel.source !== 'native') {
    parts.push(buildKitBriefing(channel));
  }

  // 2. Project instructions (if channel belongs to a project)
  if (channel?.projectInstructions?.trim()) {
    parts.push(channel.projectInstructions.trim());
  }

  // 3. Channel addendum (channel-specific system prompt)
  if (channelPreamble?.trim()) {
    parts.push(channelPreamble.trim());
  }

  // 4. Entity's own system prompt
  if (entity.systemPrompt?.trim()) {
    parts.push(entity.systemPrompt.trim());
  }

  return parts.join('\n\n');
}
```

## Kit Briefing Interaction

Currently, kit briefing injects CLAUDE.md and MEMORY.md content from `sourceMetadata`. With this design:

- **Project instructions** (CLAUDE.md / prompt_template) move to `projects.instructions` — injected via the new project layer, NOT kit briefing
- **Kit briefing** retains: orientation text ("you are continuing a conversation imported into Klatch..."), capability warnings, and MEMORY.md content
- This deduplicates: project instructions aren't injected twice (once in kit, once in project layer)

## Future Extensions

- **role.md**: Per-entity instructions that layer between project and channel: `project → role → channel`
- **Sidebar grouping**: Group channels by project in the sidebar (P3)
- **Live CLAUDE.md sync**: For Claude Code projects, optionally re-read CLAUDE.md from disk on each message (watch for staleness)
- **memories.json**: Parse and store project-scoped memories, inject alongside project instructions

## Open Questions

1. **Should project instructions have a size limit?** Kit briefing currently truncates at 4000 chars. Project instructions could be much longer (full CLAUDE.md files). Consider a generous but finite limit (e.g., 16K chars) with a UI warning.
2. **Project deletion semantics**: When deleting a project, should channels be unlinked (keep addendum) or deleted? Recommend: unlink, preserve channels.
3. **Multiple projects per channel?** Not for v1. One project per channel keeps the model simple.
