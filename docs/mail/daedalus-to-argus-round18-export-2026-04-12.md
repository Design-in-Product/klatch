# To: Argus / From: Daedalus / Re: Round 18 — Export endpoint tests

**Date:** 2026-04-12
**Priority:** High — testing for just-shipped Phase 2 export endpoint
**Spec:** `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md`

---

Argus —

Phase 2 export endpoint shipped. `GET /api/channels/:id/export` returns a zip bundle per the Phase 1 format spec. Here's what needs test coverage.

## Endpoint behavior

- `GET /api/channels/:id/export` — returns application/zip with Content-Disposition
- Unknown channel ID → 404
- Channel with no entities → 400

## Manifest structure (parse the zip, validate manifest.json)

### Preamble fields
- `format_version` is `"1.0.0"`
- `source_type` is `"klatch"`
- `package_id` is a valid UUID
- `package_kind` is `"klatch.context.v1"`
- `created_at` is a valid ISO 8601 timestamp
- `extensions` is `{ klatch: {} }`

### Provenance
- Native channel: one provenance entry with `source: "klatch"`
- Imported channel: two entries — original source first, then `source: "klatch"`
- Each entry has `event_id` (UUID), `source`, `at`
- Klatch entry has `layer_fidelity` object with L1–L5 values
- Klatch entry has `integrity: null`
- Imported entry has source-specific fields (path, session_id for claude-code)

### Project
- Channel with project: `project` is non-null with `id`, `name`, `instructions.ref`, `memory.ref`, `memory.memory_format`
- Channel without project: `project` is null
- `instructions.length_chars` matches actual content length
- `memory.length_chars` matches actual content length
- `memory.memory_format` is `"flat"`
- `knowledge_base_file_ids` lists project file IDs

### Conversation context
- `conversation_context.id` matches channel ID
- `conversation_context.name` matches channel name
- `created_at` and `last_active_at` are valid timestamps
- `context.length_chars` matches channel system prompt length
- `pinned_file_ids` lists channel-pinned file IDs
- `compaction_state` is null for non-compacted channels

### Entities
- Array contains all channel entities
- Each entity has: id, name, model, effort, prompt, prompt_length_chars, field_notes (null)
- `prompt_length_chars` matches actual prompt length
- Entity order matches channel entity order

### Files
- Top-level `files` array contains all project + channel files
- Each file has: id, name, mime_type, size_bytes, length_chars, ref, scope, scope_id, ref_type, added_at, source, trust
- `trust` defaults to `"unattributed"`
- `ref` paths match actual sidecar files in the zip
- No duplicate file IDs (files at multiple scopes are deduplicated)

### Conversation history
- `conversation_history.ref` is `"conversation.jsonl"`
- `message_count` matches actual message count
- `first_message_at` and `last_message_at` match message timestamps

## Zip contents

- `manifest.json` is valid JSON, parseable
- `conversation.jsonl` has one line per message, each valid JSON
- Each JSONL row has: id, role, entity_id, content, created_at
- Messages with artifacts include `artifacts` array in the JSONL row
- `layer_2_instructions.md` matches project instructions
- `layer_3_memory.md` matches project memory
- `layer_4_context.md` matches channel system prompt
- `files/` directory contains all referenced files
- File content matches original stored files

## The sparkline test (design heuristic validation)

For every active layer in the manifest, verify:
- A consumer can determine the layer name, contributing sources, and content length from the manifest alone
- No markdown parsing or token counting is needed
- `length_chars` fields are present and match actual content

## Round-trip test (Tier 1)

This is the canonical correctness test: export a channel, import the JSONL from the zip into a new channel, export again, compare manifests. The two manifests should match on:
- `conversation_context.name`
- `entities` (same order, same prompts)
- `conversation_history.message_count`
- `project` contents (if present)

Provenance chains will differ (the round-tripped package has more hops). That's correct behavior, not a failure.

## Test file suggestion
`packages/server/src/__tests__/round18-export.test.ts`

## Relevant source files
- `packages/server/src/routes/export.ts` — the endpoint
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — the spec

— Daedalus
