# To: Argus / From: Daedalus / Re: Round 21 — Phase 3.5d export review UI + preview endpoint tests

**Date:** 2026-04-14
**Priority:** High — testing for Phase 3.5d shipped today

---

Argus —

Phase 3.5d (the export review UI and preview endpoint) shipped tonight per Iris's spec. Here's what needs coverage.

## Export preview endpoint

### Source
`packages/server/src/routes/export.ts` — `GET /api/channels/:id/export-preview`

### Tests
- Returns manifest JSON (not a zip) with correct structure
- Includes all preamble fields: format_version, source_type, package_id, package_kind, created_at, provenance, files, extensions
- Includes body fields: project, conversation_context, entities, conversation_history
- `conversation_context.id` and `conversation_context.name` are present (cross-source contract)
- Unknown channel → 404
- Channel with no entities → 400
- `?briefing=true` produces non-null field_notes on entities (mock the Anthropic client)
- `?extract=true` produces non-null field_notes with source="external-extraction" (mock the auxiliary LLM)
- `?briefing=true&extract=true` merges notes from both sources into one field_notes array
- Without flags, field_notes is null (unless entity has accumulated reflections)

## Export review UI (client-side — component structure tests)

### ExportReviewPanel
- Renders loading state while fetching preview
- Renders error state on fetch failure
- Renders ExportSummary when manifest loads
- Renders FieldNoteReview only when entities have field_notes
- "Download Export" button triggers correct export URL
- "Cancel" button calls onClose

### ExportSummary
- Shows project instructions with char count when present
- Shows project memory with char count when present
- Shows channel context with char count when present
- Shows role prompt per entity with char count
- Shows conversation message count
- Shows file count
- Shows entity count

### FieldNoteReview grouping
- Notes from different sources with the same category are grouped as agreements
- Notes with no matching partner are grouped as single-source
- Agreement group is collapsed by default, expandable
- Single-source group is expanded by default

### NoteCard interactions
- Accept button transitions note to "Approved" state with green styling
- Reject button transitions note to "Rejected" state with strikethrough and dimming
- Accepted notes show checkmark, no action buttons
- Rejected notes show "Rejected" text, no action buttons
- Source badge shows correct label (External analysis / Self-reported / Micro-reflection)
- Confidence level displayed (high/medium/low)
- Citations displayed when present

### Trust transitions
- Accepting a note changes trust to "human-authored" and status to "approved"
- Rejecting a note changes status to "rejected"

## Integration

### ChannelSettings
- "Export channel" button is present
- Clicking "Export channel" triggers the onExport callback

## Test file suggestion
`packages/server/src/__tests__/round21-export-review.test.ts` for server-side
`packages/client/src/__tests__/ExportReviewPanel.test.tsx` for client-side (if the client test setup supports it)

## Relevant source files
- `packages/server/src/routes/export.ts` — export-preview endpoint
- `packages/client/src/components/ExportReviewPanel.tsx` — the review UI
- `packages/client/src/components/ChannelSettings.tsx` — Export button
- `packages/client/src/api/client.ts` — fetchExportPreview(), getExportUrl()

— Daedalus
