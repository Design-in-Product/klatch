# Step 8½ Increment 3 — Prep Notes

Argus prep work while waiting on Daedalus Increment 1 (stats backend).

## metadata.test.ts — Test Plan

New file: `packages/server/src/__tests__/metadata.test.ts`

Uses the same pattern as existing tests: in-memory SQLite via `setup.ts`, fresh DB per test.

### Test fixtures needed

A helper that seeds a realistic imported channel with artifacts:

```typescript
function seedImportedChannel(db) {
  // 1. Insert channel with source='claude-code' and source_metadata JSON
  // 2. Insert ~5 messages (mix of user/assistant)
  // 3. Insert ~10 artifacts across messages:
  //    - 4x tool_use (Read x2, Bash x1, Grep x1)
  //    - 3x tool_result
  //    - 2x thinking
  //    - 1x image
}
```

### Test cases

#### `getChannelStats(channelId)`
1. **Populated channel** — returns correct messageCount, userMessages, assistantMessages, artifactCount, uniqueTools, toolsUsed, lastMessageAt
2. **Empty channel** — returns all zeros, lastMessageAt null
3. **Native channel (no artifacts)** — returns message counts, zero artifacts
4. **Channel doesn't exist** — returns all zeros (not an error)

#### `getChannelToolStats(channelId)`
1. **Returns tools in frequency order** — Read(2) > Bash(1) = Grep(1)
2. **Only counts tool_use type** — tool_result and thinking excluded
3. **Empty channel** — returns empty array
4. **Channel with no tool_use artifacts** — returns empty array (even if thinking/image exist)

#### `getMessageArtifactStats(messageId)`
1. **Counts by type correctly** — total=10, toolUses=4, toolResults=3, thinking=2, images=1
2. **Message with no artifacts** — returns all zeros
3. **Message doesn't exist** — returns all zeros

#### `getProjectsWithChannels()`
1. **Groups by cwd** — two channels with same cwd appear in one ProjectGroup
2. **Different cwds** — separate groups
3. **Null/missing cwd** — grouped under "Other"
4. **Native channels excluded** — only source != 'native' appear
5. **Empty DB** — returns empty array
6. **Mixed sources** — claude-code and claude-ai channels both appear, grouped by cwd

#### Endpoint tests (if Daedalus adds a `/api/channels/:id/stats` endpoint)
1. **GET returns stats JSON** — 200 with ChannelStats shape
2. **Invalid channelId** — 404 or empty stats (TBD based on Daedalus's design)
3. **GET /api/projects** — returns ProjectGroup[] shape

#### Edge cases
1. **Malformed source_metadata JSON** — `json_extract` returns null, channel grouped under "Other"
2. **source_metadata with empty cwd** (`""`) — grouped under "Other" (COALESCE handles this)
3. **Artifacts with null tool_name** — excluded from tool stats, counted in totals
4. **Very large artifact counts** — performance sanity (100+ artifacts per channel)
5. **Concurrent reads** — SQLite WAL mode handles this, but worth a basic test

## Stats UI — Component Structure for ChannelSettings

### Where it goes

Inside ChannelSettings.tsx, after the existing provenance card (line 128) and before the channel name field (line 130). Only shown for imported channels.

### Component sketch

```tsx
{/* Channel statistics — imported channels */}
{isImported && stats && (
  <div className="rounded-lg border border-line bg-card p-3">
    <div className="text-xs font-medium text-secondary mb-2">Statistics</div>

    {/* Stat grid: 2x2 or 3x2 */}
    <div className="grid grid-cols-3 gap-3 text-center">
      <div>
        <div className="text-lg font-semibold text-primary">{stats.messageCount}</div>
        <div className="text-[10px] text-muted">Messages</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-primary">{stats.toolsUsed}</div>
        <div className="text-[10px] text-muted">Tool calls</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-primary">{stats.uniqueTools}</div>
        <div className="text-[10px] text-muted">Unique tools</div>
      </div>
    </div>

    {/* Top tools — compact horizontal list */}
    {toolStats.length > 0 && (
      <div className="mt-3 pt-2 border-t border-line">
        <div className="text-[10px] text-muted mb-1">Top tools</div>
        <div className="flex flex-wrap gap-1">
          {toolStats.slice(0, 5).map(t => (
            <span key={t.tool} className="text-[10px] px-1.5 py-0.5 rounded bg-badge text-muted">
              {t.tool} ({t.count})
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

### Data fetching

Two options:
1. **Inline in channel fetch** — Daedalus adds stats to the channel response (denormalized)
2. **Separate endpoint** — `GET /api/channels/:id/stats` fetched on ChannelSettings mount

Option 2 is cleaner (stats are expensive, only needed when settings panel is open). Use a `useEffect` to fetch on mount.

```typescript
const [stats, setStats] = useState<ChannelStats | null>(null);
const [toolStats, setToolStats] = useState<ChannelToolStat[]>([]);

useEffect(() => {
  if (!isImported) return;
  fetch(`/api/channels/${channel.id}/stats`).then(r => r.json()).then(setStats);
  fetch(`/api/channels/${channel.id}/tool-stats`).then(r => r.json()).then(setToolStats);
}, [channel.id, isImported]);
```

Or if Daedalus bundles them into one endpoint, a single fetch.

## Sidebar Grouping — Edge Cases

### Edge cases to review once Daedalus pushes Increment 2

| Case | Expected behavior |
|------|-------------------|
| **Null cwd** | Channel appears under "Imported" or "Other" group, not lost |
| **Empty string cwd** | Same as null — "Other" group |
| **Malformed source_metadata** | `JSON.parse` fails — catch and treat as null cwd |
| **Very long project path** | Display only last path segment (`cwd.split('/').pop()`) |
| **Single imported channel** | Still shows Projects section header (don't hide for n=1) |
| **All channels are imported** | "Roles"/"Channels" sections may be empty — hide empty sections |
| **Mobile drawer** | Project groups must be collapsible or the sidebar gets too long |
| **Channel moves between groups** | If metadata changes (re-import?), sidebar re-renders correctly |
| **Mixed native + imported** | Clear visual separation between native conversations and imported projects |

### Mobile-specific concerns
- Project groups add vertical height — consider collapsed-by-default on mobile
- Touch targets must remain ≥44px
- "CC" badge still visible when channel name is truncated
