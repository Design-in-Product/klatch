# To: Argus / From: Daedalus / Re: Round 20 — Phase 3.5 behavioral calibration tests

**Date:** 2026-04-13
**Priority:** High — testing for three new phases shipped today

---

Argus —

The full Phase 3.5 behavioral calibration pipeline shipped tonight. Three phases to test.

## Phase 3.5a: Self-authored handoff briefing

### Source
`packages/server/src/export/briefing.ts` + export endpoint `?briefing=true`

### Tests (mock the Anthropic client)
- `generateHandoffBriefing()` with valid messages returns FieldNote[] array
- Each FieldNote has: observation (string), citations (string[]), confidence (high/medium/low), source ("self-authored-briefing"), trust ("agent-observed"), status ("draft"), category (string)
- Empty messages array returns empty FieldNote[]
- Malformed JSON response falls back to a single FieldNote with the raw text
- Export endpoint with `?briefing=true` includes field_notes on entities in the manifest (non-null)
- Export endpoint without `?briefing=true` has field_notes as null on entities

## Phase 3.5c: Micro-reflections

### Schema
- `entities` table has `reflections` column (TEXT, default '[]')
- `appendReflection()` appends a MicroReflection to the entity's reflections JSON array
- `getEntityReflections()` returns the parsed array
- `rowToEntity()` includes reflections in the returned entity (undefined when empty)

### Endpoint
- `POST /api/channels/:id/reflect` — returns `{ reflections, count }`
- Unknown channel → 404
- Channel with no messages → 400
- Reflections are stored on the entity (verify with `getEntity()` after reflect call)

### Export integration
- Export includes accumulated micro-reflections in field_notes alongside briefing notes
- Micro-reflection field notes have source="micro-reflection", trust="agent-observed"

## Phase 3.5b: External extraction

### Source
`packages/server/src/export/external-extraction.ts` + export endpoint `?extract=true`

### Tests (mock the auxiliary LLM)
- `extractBehavioralPatterns()` with valid messages returns FieldNote[] array
- Each FieldNote has source="external-extraction", trust="synthesized"
- Conversations with <5 messages return empty array (too little to extract from)
- Export endpoint with `?extract=true` includes external extraction notes in field_notes
- Export with both `?briefing=true&extract=true` merges notes from both sources into one field_notes array

## Cross-cutting

### Field notes merging
- Export with no flags: field_notes is null (unless entity has accumulated reflections)
- Export with `?briefing=true`: field_notes contains briefing notes only (+ any reflections)
- Export with `?extract=true`: field_notes contains extraction notes only (+ any reflections)
- Export with both: field_notes contains all three sources merged
- Each note's `source` field correctly identifies its origin

### The consensus filter (if you want to test extraction quality)
- Generated notes should be actionable, specific, non-obvious, relational, durable
- This is a quality test, not a structural test — run it manually on a real channel if you want to validate extraction prompt quality

## Test file suggestion
`packages/server/src/__tests__/round20-phase35-calibration.test.ts`

## Relevant source files
- `packages/server/src/export/briefing.ts` — handoff briefing generation
- `packages/server/src/export/external-extraction.ts` — external behavioral extraction
- `packages/server/src/routes/export.ts` — export endpoint with ?briefing and ?extract params, reflect endpoint
- `packages/server/src/db/queries.ts` — appendReflection(), getEntityReflections()

— Daedalus
