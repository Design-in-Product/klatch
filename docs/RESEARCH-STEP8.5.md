# Step 8½ — Metadata Framework Research

Research completed 2026-03-11 by Argus. This documents what exists, what's missing, and the recommended implementation plan.

## Current State (What Step 8 Already Built)

### Schema additions (all present in `packages/server/src/db/index.ts`):

**channels table:**
- `source TEXT DEFAULT 'native'` — tracks origin ('native', 'claude-code', 'claude-ai')
- `source_metadata TEXT` — JSON blob with source-specific metadata

**messages table:**
- `original_timestamp TEXT` — preserved from import source (ISO 8601)
- `original_id TEXT` — original event UUID (for dedup)

**message_artifacts table:**
- id, message_id, type, tool_name, input_summary, content, created_at
- Types: tool_use, tool_result, thinking, image
- Indexed on message_id

### Source metadata captured for Claude Code imports:
```json
{
  "originalSessionId": "string",
  "cwd": "string (project path)",
  "gitBranch": "string",
  "slug": "string (human-readable name)",
  "version": "string (Claude Code version)",
  "eventCount": number,
  "firstTimestamp": "ISO 8601",
  "lastTimestamp": "ISO 8601",
  "compactionSummary": "string (optional)",
  "importedAt": "ISO 8601"
}
```

## What's Missing

1. **No aggregated statistics layer** — stats must be computed on-the-fly via SQL
2. **No project grouping** — channels are flat in sidebar, no "proto-projects" concept
3. **No search foundation** — message_artifacts stored but not FTS-indexed
4. **No artifact display** — tool-use data exists in DB but invisible in UI

## Recommendation: Zero New Tables

All stats are computable from existing `message_artifacts` table. Project grouping is derivable from `json_extract(source_metadata, '$.cwd')`. No schema migration needed.

## Implementation Plan

### Phase 1: Stats Infrastructure

Add 4 query helpers to `packages/server/src/db/queries.ts`:

```typescript
// Get artifact counts by type for a single message
getMessageArtifactStats(messageId: string): MessageArtifactStats

// Get tool-use frequency for a channel (ordered by count desc)
getChannelToolStats(channelId: string): ChannelToolStat[]

// Get overview statistics for a channel
getChannelStats(channelId: string): ChannelStats

// Get imported channels grouped by project (cwd)
getProjectsWithChannels(): ProjectGroup[]
```

**Key SQL patterns:**
```sql
-- Per-channel tool summary
SELECT tool_name, COUNT(*) as count
FROM message_artifacts ma
JOIN messages m ON ma.message_id = m.id
WHERE m.channel_id = ? AND ma.type = 'tool_use'
GROUP BY tool_name ORDER BY count DESC;

-- Project grouping (no new tables!)
SELECT
  COALESCE(NULLIF(json_extract(source_metadata, '$.cwd'), ''), 'Other') as project_name,
  c.id, c.name, c.source
FROM channels c
WHERE c.source IS NOT NULL AND c.source != 'native'
ORDER BY project_name, c.created_at;
```

### Phase 2: Types (packages/shared/src/types.ts)

```typescript
export interface ProjectChannelSummary {
  id: string;
  name: string;
  source: ChannelSource;
  entityCount?: number;
  messageCount?: number;
  artifactCount?: number;
}

export interface ProjectGroup {
  projectName: string;
  channels: ProjectChannelSummary[];
}

export interface MessageArtifactStats {
  total: number;
  toolUses: number;
  toolResults: number;
  thinking: number;
  images: number;
}

export interface ChannelToolStat {
  tool: string;
  count: number;
}

export interface ChannelStats {
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  artifactCount: number;
  uniqueTools: number;
  toolsUsed: number;
  lastMessageAt: string | null;
}
```

### Phase 3: Sidebar Project Grouping UI

Update `ChannelSidebar.tsx` to show:
- **Projects** section (collapsible) — imported channels grouped by `cwd`
- **Conversations** section — native channels (unchanged)

```tsx
const nativeChannels = channels.filter(ch => !ch.source || ch.source === 'native');
const projectsByName = groupBy(
  channels.filter(ch => ch.source === 'claude-code'),
  (ch) => JSON.parse(ch.sourceMetadata || '{}').cwd
);
```

### Phase 4: Channel Settings Stats Display

Show in channel settings panel:
- Message count, tool-use count, artifact count
- Original project (cwd) from source_metadata
- Import timestamp
- Top tools used (from getChannelToolStats)

### Phase 5: FTS5 Foundation (documentation only)

Document the schema for Step 9 but don't implement:
```sql
CREATE VIRTUAL TABLE IF NOT EXISTS fts_messages USING fts5(
  content,
  message_id UNINDEXED,
  channel_id UNINDEXED,
  role UNINDEXED,
  created_at UNINDEXED,
  source UNINDEXED,
  original_id UNINDEXED
);
```

## Testing Strategy

New test file: `packages/server/src/__tests__/metadata.test.ts`

- `getMessageArtifactStats` counts by type correctly
- `getChannelToolStats` returns tools in frequency order
- `getProjectsWithChannels` groups by source_metadata.cwd
- Native channels excluded from project grouping
- `getChannelStats` computes all aggregates

## Scope Boundaries

**Step 8½ includes:** query helpers, types, sidebar grouping, stats display, tests
**Step 8½ does NOT include:** compaction API, artifact visualization in chat, FTS implementation, per-project settings

## Effort Estimate

~2-3 focused sessions: 1 backend (queries + types), 1 client UI (sidebar + settings), 1 testing + refinement.
