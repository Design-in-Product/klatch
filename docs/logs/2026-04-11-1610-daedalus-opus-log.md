# Daedalus Session Log — 2026-04-11

**Started:** 16:10
**Model:** Opus 4.6
**Branch:** main
**Focus:** Step 10 Phase 1 — catch up, design discussion

## Session briefing

- Synced with origin/main. v0.9.0 shipped April 10.
- 6 commits since last session including substantial Step 10 framing work.
- Two memos for Daedalus, both arrived:
  1. Calliope (with xian) — Step 10 plan feedback, "protocol-first" framing, PM Architect alignment addendum, pace principle
  2. Argus — Phase 1 design questions, testability concerns, escalation scale for round-trip tests
- Cross-pollination brief (April 11): Klatch + PM converging on shared architecture (Klatch as context server, PM as task-and-knowledge server, Managed Agents as execution layer)
- Futures memo (`docs/futures/2026-04-10-klatch-as-context-protocol.md`): Phase 1 isn't internal plumbing — it's the protocol Klatch eventually publishes
- Intel sweep April 9: Hono security update, Managed Agents launched, SDK 8 versions behind, compaction helpers deprecated

## Key reframing for Phase 1

**Phase 1 designs the protocol, not just an export format.** This raises the standard on:
- Self-describing schema (JSON Schema published alongside)
- Explicit layer semantics (5-layer structure becomes public contract)
- Versioning from day one (`format_version` field)
- Naming as public API (use `channel_context` not `layer_4_channel_addendum`)

## Concrete implications from the two memos

From Calliope/xian:
- Round-trip is minimum, not maximum (eventually: through Managed Agents, through PM BYOC)
- Compaction: full history default + summary as labeled artifact, never replacement
- Layer 5: format must have *room* for both prompt-as-written and field-notes generation
- Provenance is a chain, not a single value
- Iris loop-in needed earlier — format constrains what UX can later present

From Argus:
- File content: sidecars in zip with manifest references (not embedded base64, not URL refs)
- Conversation history: must be included, sidecars (JSONL per channel), with full metadata
- Compaction state: first-class object with summary + before_message_id + post-summary messages
- Entity references: inlined for clarity and self-containment
- Six-tier round-trip escalation: Klatch→Klatch all the way to three-environment chain
- Independent parser test (~50-line Python script) catches hidden Klatch-isms cheaply
- L1-L4 binary, L5 scored — two different correctness tests
- Test fixtures from day one (3-5 sample packages force the spec to be concrete)
- Format hygiene: stable serialization order, no optional structural fields, versioned

From cross-pollination brief addendum:
- **Time-sensitive: align with PM Architect before Phase 1 design begins**
- They're designing a BYOC MCP server that may consume Klatch context packages
- A short alignment conversation prevents two divergent formats

## Plan for tonight

1. Catch up — done
2. Reply to Iris's three intro questions (overdue)
3. Reach out to PM Architect for alignment conversation before Phase 1 design
4. Draft the Phase 1 schema skeleton informed by all the inputs (or wait for PM Architect response)

## Work log

### 16:10 — Session start
Synced, read all memos and the futures memo. Both Daedalus memos already arrived. Significant new framing — Phase 1 is the protocol, not just an export format. Time-sensitive PM Architect alignment surfaced.

### 16:30 — Iris reply drafted

`docs/mail/daedalus-to-iris-reply-2026-04-11.md`. Answered her three intro questions:
- Entity duplicates: yes, imports create new rows; no dedup story; would build merge if she specs it
- Roundtable ordering: deliberate Gall's law choice; happy to add explicit ordering if discovery surfaces it
- `type` column all 'chat': klatch type structurally correct but behaviorally untested in production — interesting product feedback that the most distinctive Klatch capability isn't being used

Also looped her into Phase 1 with four UX-shaped questions:
1. Layer surfacing — granularity of L3 (one blob vs named knowledge sources)
2. Provenance chain — does the user see it, what labels would they want
3. Layer 5 fidelity gap — how to present "what you're losing"
4. What's *not* in the format that should be — the question I most want her eye on

### 16:45 — PM Architect alignment memo drafted

`docs/mail/daedalus-to-pm-architect-step10-alignment-2026-04-11.md`. Per the cross-pollination brief addendum, this is the time-sensitive item. Memo opens the conversation with:
- Klatch context model (5 layers, fidelity gradient L1→L5)
- Where I think we converge (Klatch context, PM task/knowledge, Managed Agents executes)
- Four alignment questions: field naming, versioning, provenance metadata, minimum overlap
- Three options for response format (async memo, shared draft, real-time conversation)
- Pace note — won't block Phase 1 on this but won't commit until heard from

Will be delivered to PM Architect via xian.

### 17:00 — Schema sketch (informal, working draft)

Not a design doc. Just my current thinking about the package shape, to be sharpened by feedback from Iris, PM Architect, and continued discussion. **Subject to change.**

#### Bundle layout (zip or directory)

```
package/
  manifest.json              # the canonical structured doc
  conversation.jsonl         # message history, one per line
  layer_2_instructions.md    # project instructions as text
  layer_3_memory.md          # project memory as text
  layer_4_context.md         # channel addendum as text
  files/
    {storage_key}_{name}     # binary file attachments (project KB + channel pinned + message attachments)
```

Why sidecar files: per Argus's recommendation, keeps the manifest small and parseable, handles binary cleanly, standard pattern. The text-form layer files are duplicative of `manifest.json` content but provide a human-readable view that doesn't require JSON parsing.

#### `manifest.json` shape (working draft)

```json
{
  "format_version": "1.0",
  "package_id": "<uuid>",
  "created_at": "<iso 8601>",
  "package_kind": "klatch.context.v1",

  "provenance": [
    {
      "source": "claude-code",
      "path": "/Users/xian/...",
      "session_id": "abc-123",
      "at": "2026-03-11T..."
    },
    {
      "source": "klatch",
      "instance": "klatch-laptop",
      "channel_id": "xyz-789",
      "at": "2026-04-11T..."
    }
  ],

  "project": {
    "id": "<uuid>",
    "name": "Klatch",
    "instructions": { "ref": "layer_2_instructions.md", "length_chars": 1234 },
    "memory": { "ref": "layer_3_memory.md", "length_chars": 5678 },
    "knowledge_base_files": [
      { "name": "ROADMAP.md", "mime_type": "text/markdown", "size_bytes": 4321, "ref": "files/abc_ROADMAP.md" }
    ]
  },

  "channel": {
    "id": "<uuid>",
    "name": "Step 10 design",
    "type": "chat",
    "mode": "panel",
    "context": { "ref": "layer_4_context.md", "length_chars": 0 },
    "pinned_files": [],
    "compaction_state": null
  },

  "entities": [
    {
      "id": "<uuid>",
      "name": "Daedalus",
      "handle": "daedalus",
      "model": "claude-opus-4-6",
      "effort": "high",
      "color": "#6366f1",
      "prompt": "<full text of L5 entity prompt>",
      "field_notes": null
    }
  ],

  "conversation_history": {
    "ref": "conversation.jsonl",
    "message_count": 142,
    "first_message_at": "2026-04-11T16:10:00Z",
    "last_message_at": "2026-04-11T17:00:00Z"
  }
}
```

#### Notes on this draft

- **Naming follows the public-API standard.** `channel.context` (not `layer_4_channel_addendum`). `entities[].prompt` (not `system_prompt`). Matches the recent nomenclature work.
- **Layers are addressable but text content is sidecar.** The manifest carries metadata + structure. The actual content of L2/L3/L4 lives in markdown files. Means the manifest is small, parseable, and the text is readable without parsing.
- **Compaction state is first-class** but null in this example. Per Argus: when present, it's an object with summary, before_message_id, post-summary message refs.
- **Entity prompts are inlined** (text content directly in manifest) rather than sidecar — they're typically small and tightly coupled to the entity definition.
- **`field_notes` is reserved** for Phase 3.5's L5 surfacing work. Always present in schema, null until populated.
- **Provenance is a chain.** Each export *appends* an entry. Multi-hop history preserved.
- **`package_kind`** field gives a clear discriminator if other package types are eventually defined (e.g., entity packages, project packages without channels).

#### What's still unresolved in this sketch

- Conversation history JSONL row format — what does each line look like? Almost certainly `{ id, role, entity_id, content, created_at, artifacts: [...] }` but I haven't drafted it
- Provenance entry shape — should `source` be an enum or freeform? What about source-specific fields (path vs instance vs URL)?
- Whether `project` is a sub-document or a separate package that channels reference (current draft inlines)
- File reference resolution — relative paths in the bundle, or some other addressing
- How to encode an export from a multi-channel project — does each channel get its own package, or is there a project-wide package with multiple channels?

Most of these will be clarified by the alignment conversation with PM Architect and the Iris exchange. Some I'll just need to pick a direction and iterate.

### 17:10 — Wrapping for now

Three artifacts produced this session:
- Iris reply (with Phase 1 UX questions)
- PM Architect alignment memo (delivered via xian)
- Informal schema sketch in this log

No code. No design doc committed. The schema doc waits until the alignment conversations have time to land.
