# Plan: Re-import Handling

**Status:** Draft
**Assignee:** TBD
**Roadmap ref:** Step 8¾ core fix — "Re-import"

## Problem

When importing a session that already exists in Klatch (matched by `originalSessionId`), the server returns a hard 409 block. The user's only option is to manually delete the channel and re-import, losing any new conversation they've added.

This blocks iterative testing and is wrong for sessions that grow over time (a Claude Code session you import today may have 50 more turns tomorrow).

## Proposed UX

When the server detects a duplicate, instead of a 409 error, return the conflict info to the client. The ImportDialog presents three options:

1. **Cancel** — do nothing (current behavior, minus the error)
2. **Replace** — delete the existing channel and re-import fresh. Simple, destructive. Appropriate when the old import was a test or the user hasn't added new messages.
3. **Fork again** — import as a new channel with a disambiguated name (e.g., "Daedalus — 2026-03-08 (2)"). Preserves the original import. Appropriate when the user wants both the old snapshot and a newer one.

**Not in scope (yet):** incremental merge/sync. That's a much harder problem (matching messages, handling edits) and violates Gall's law. Fork-again covers the use case without the complexity.

## Server Changes

### 1. New response shape for duplicates

Instead of returning 409, return 409 with structured conflict info:

```typescript
// POST /import/claude-code or /import/claude-ai
// When duplicate detected:
{
  error: 'duplicate',
  existingChannelId: string,
  existingChannelName: string,
  existingMessageCount: number,   // helps user decide
  hasNewMessages: boolean,        // true if channel has messages beyond the original import
  sessionId: string,
}
```

### 2. Replace endpoint

`DELETE /api/channels/:id` already exists. The client calls delete then re-imports. No new server endpoint needed — the client orchestrates the two-step.

### 3. Fork-again

Add an optional `forceImport: true` parameter to the import endpoints. When set, skip the dedup check entirely. The client is responsible for passing a disambiguated channel name (or the server auto-appends a suffix).

Alternative: server-side suffix generation — if `forceImport` is true and no custom name is given, append ` (2)`, ` (3)`, etc. based on how many channels share the same `originalSessionId`.

## Client Changes

### ImportDialog conflict state

When the import returns 409 with the new shape, show a conflict resolution UI:

```
⚠ This session was already imported

  Channel: "Daedalus — 2026-03-08"
  Messages: 47 (12 added since import)

  [Cancel]  [Replace]  [Import as new]
```

- **Cancel** — close dialog
- **Replace** — calls DELETE then re-imports, shows loading state
- **Import as new** — calls import with `forceImport: true`

### claude.ai bulk import

For claude.ai bulk imports, duplicates are already handled per-conversation (skipped with reason). The current "skipped (duplicate)" display is fine. Could add a "re-import" link per skipped conversation in a future iteration.

## Test Plan

- Import a session → succeeds
- Import same session → gets conflict UI with correct channel info
- Cancel → nothing changes
- Replace → old channel deleted, new channel created with same content
- Replace when user has added messages → `hasNewMessages: true` shown as warning
- Fork again → new channel created alongside old one, disambiguated name
- claude.ai bulk → duplicates still skipped gracefully (no regression)

## Estimated Scope

- Server: ~30 lines changed (conflict response shape + forceImport param)
- Client: ~80 lines (conflict UI state in ImportDialog)
- Tests: ~8-10 new tests
- Complexity: Low-medium. Mostly UI state management.
