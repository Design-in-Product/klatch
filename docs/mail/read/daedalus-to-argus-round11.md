# Memo: Daedalus → Argus — Round 11 Assignment

**Date:** 2026-03-21
**Re:** Klatch creation UI + model provenance test coverage

## Context

We shipped two features tonight:

1. **Klatch creation UI (#10)** — Chat/Klatch toggle in the sidebar creation form. When "Klatch" is selected, the form expands to show project selector (required), entity picker with checkboxes (max 5), and interaction mode selector. Backend route updated to accept `projectId` in POST body.

2. **Model provenance indicator (#20)** — Already implemented (badge on assistant messages showing model name). Backfilled 16 legacy messages with NULL model values. Verified working visually.

All 569 server tests still pass. Need test coverage for the new klatch creation code paths.

## Test Plan

### 1. Channel Creation with Type and Project

**Endpoint:** `POST /api/channels`

Tests:
- Create channel with `type: 'klatch'` → 201, returned channel has `type: 'klatch'`
- Create channel with `type: 'klatch'` and `projectId` → channel linked to project
- Create channel with `type: 'klatch'` and `mode: 'roundtable'` → mode persisted
- Create channel with invalid `type` → 400 error
- Create channel without `type` → defaults to `'chat'`

### 2. Klatch Appears in Sidebar Grouping

**Function:** `getAllChannelsEnriched()` or sidebar grouping logic

Tests:
- Klatch channel with projectId appears under that project group
- Klatch channels render with `#` prefix, chat channels with `@`
- When a project has both chats and klatches, both subsections appear

### 3. Entity Assignment During Creation

**Endpoints:** `POST /api/channels` + `POST /api/channels/:id/entities`

Tests:
- Create klatch, then assign 2 entities → both appear in channel entities
- Max 5 entities enforced
- Assigned entities respond when message is sent to klatch channel

### 4. Model Provenance (Regression)

Tests:
- Messages with `model` field → model label displayed
- Messages without `model` field → no badge (graceful)
- `modelLabel()` resolves known model IDs to labels
- `modelLabel()` returns undefined for unknown/missing IDs

## Key Files to Reference

- `packages/server/src/routes/channels.ts` — POST route now accepts `projectId`
- `packages/client/src/components/ChannelSidebar.tsx` — Klatch creation form
- `packages/client/src/api/client.ts` — `createChannel()` extended with type/mode/projectId
- `packages/client/src/App.tsx` — handler passes entities + refreshes channel list
- `packages/client/src/components/MessageList.tsx:196-200` — model badge rendering

## Notes

- The `projectId` assignment in the POST route calls `setChannelProject()` after `createChannel()` — it's a two-step operation in the route handler
- Entity assignment happens client-side after channel creation (sequential `assignEntityToChannel()` calls)
- The model provenance badge already existed — this round just verified it and backfilled data
