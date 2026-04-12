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

### 17:10 — PM Architect memo delivered via xian

### 17:30 — Architect reply received and reviewed

`docs/mail/memo-arch-to-daedalus-step10-alignment-2026-04-11.md`. Substantive, sharp, and pushes back in exactly the right places. Key points:

**PM correction:** Not "task-and-knowledge server" — "PM colleague that happens to have access to tasks and knowledge." Voice-inflected, opinionated. The voice is part of the data. Doesn't change the format conversation but reframes how I think about what PM's interior contains.

**Four schema changes accepted:**
1. Add `source_type` field at top level — `"klatch"` or `"piper-morgan"`. Discriminator I was missing.
2. Add `extensions` as escape hatch for project-specific metadata. **Load-bearing insight of the reply** — without this, every new concept either forces format revision or gets jammed somewhere awkward.
3. Rename `channel` → `conversation_context`. Neutral container for the slot that holds "user's current focus." Klatch puts channel data inside; PM puts session state inside. Shape *inside* varies by source.
4. Add optional `layer_fidelity` slot in provenance entries. Records which layers transferred at what fidelity during each hop. Connects format directly to RFC-001.

**80/20 framing:** "The value here is in the 20% of the format that overlaps naturally — the envelope, the provenance, the layer vocabulary. The 80% that's project-specific should stay project-specific." This is the right principle and matches my pace instinct. Don't try to unify everything; share the envelope.

**Pattern-062 caveat:** Format alignment reduces wiring-pass cost; doesn't eliminate it. Don't oversell what alignment achieves.

**Process:** One more async round. I revise the schema sketch with these adjustments and send it back. Two rounds total.

### 17:45 — xian's clarification on source_type

xian asked: would `source_type` apply to imported agent sources like Claude Code, claude.ai? My answer: no, those live in `provenance` (history), not `source_type` (producer). A Klatch package built from a Claude Code import has `source_type: "klatch"` (currently producing) and `provenance: [{ source: "claude-code" }, { source: "klatch" }]` (historical chain). The format is open to eventually having other producers (Claude Code, claude.ai) if they ever publish packages, but today there are two producers and many possible chain entries.

Also xian's nice articulation: Klatch is a *place*, PM is an *agent*. The shared envelope + project-specific interior maps cleanly onto this — the protocol doesn't need to know whether the producer is a place or an agent, only that the envelope is consistent.

### 18:00 — Revised schema sketch (round 2)

Incorporating Architect's four changes + the source_type/provenance clarification.

#### Bundle layout (unchanged from round 1)

```
package/
  manifest.json              # the canonical structured doc
  conversation.jsonl         # message history, one per line
  layer_2_instructions.md    # project instructions as text
  layer_3_memory.md          # project memory as text
  layer_4_context.md         # channel addendum as text
  files/
    {file_id}_{name}         # binary file attachments, scoped via top-level files[]
```

#### `manifest.json` shape (round 2)

```json
{
  "format_version": "1.0.0",
  "source_type": "klatch",
  "package_id": "<uuid>",
  "package_kind": "klatch.context.v1",
  "created_at": "<iso 8601>",

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
      "at": "2026-04-11T...",
      "layer_fidelity": {
        "L1": "full",
        "L2": "full",
        "L3": "full",
        "L4": "partial",
        "L5": "rebuilt"
      }
    }
  ],

  "project": {
    "id": "<uuid>",
    "name": "Klatch",
    "instructions": { "ref": "layer_2_instructions.md", "length_chars": 1234 },
    "memory": { "ref": "layer_3_memory.md", "length_chars": 5678 },
    "knowledge_base_file_ids": ["f1", "f2"]
  },

  "conversation_context": {
    "id": "<uuid>",
    "name": "Step 10 design",
    "type": "chat",
    "mode": "panel",
    "context": { "ref": "layer_4_context.md", "length_chars": 0 },
    "pinned_file_ids": [],
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

  "files": [
    {
      "id": "f1",
      "name": "ROADMAP.md",
      "mime_type": "text/markdown",
      "size_bytes": 4321,
      "ref": "files/f1_ROADMAP.md",
      "scope": "project",
      "scope_id": "<project_id>",
      "ref_type": "imported"
    }
  ],

  "conversation_history": {
    "ref": "conversation.jsonl",
    "message_count": 142,
    "first_message_at": "2026-04-11T16:10:00Z",
    "last_message_at": "2026-04-11T17:00:00Z"
  },

  "extensions": {}
}
```

#### Changes from round 1

| Change | Reason |
|---|---|
| Added `source_type: "klatch"` | Architect Q1: discriminator at envelope level |
| Added `extensions: {}` | Architect Q1: escape hatch for project-specific metadata |
| Renamed `channel` → `conversation_context` | Architect Q1: neutral container, shape inside varies by source |
| Added `layer_fidelity` to provenance entries | Architect Q3: optional, records hop-level transfer fidelity |
| Top-level `files` array (was inline) | Architect minimum field set: enumerable without crawling structure |
| Project & channel reference files by id | Consequence of top-level files |

#### Open questions for round 2

1. **`source_type` vs provenance levels** — confirming with Architect that we agree these answer different questions (producer vs history). Want to make this explicit so future producers (claude-code, claude-ai if they ever publish packages) slot in cleanly.

2. **`layer_fidelity` controlled vocabulary** — Architect's example used "full", "partial", "rebuilt". I'd propose four levels:
   - `"full"` — content present and verified byte-equivalent
   - `"partial"` — content present but degraded (e.g., compacted, truncated)
   - `"rebuilt"` — content reconstructed from observation, not from source
   - `"absent"` — content not transferred (slot deliberately empty)
   Want Architect's reaction. This connects to AAXT failure modes but isn't the same vocabulary — the AAXT taxonomy classifies *probe responses*; layer_fidelity classifies *transfer states*. Related but distinct.

3. **Inside `conversation_context`** — for Klatch, I'm putting channel-flavored fields directly inside (id, name, type, mode, context, pinned_file_ids, compaction_state). The Architect said the inside varies by source. Want to confirm they're comfortable with that level of Klatch-specificity inside the field, or whether they'd want even the channel-level fields to have a more neutral surface.

4. **`package_kind`** — I added this in round 1 as a discriminator for future package types (entity packages, project packages). The Architect didn't comment. Worth checking whether they think it's necessary or whether `source_type` + `format_version` is enough.

5. **`extensions` namespacing** — should each project's extensions live under a namespaced key (e.g., `extensions.klatch.*` vs `extensions.piper_morgan.*`) so a package that grows multiple producers' extensions doesn't collide? Or is `source_type` sufficient because each package only has one producer?

### 18:15 — Memo back to Architect drafted (held for integration)

`docs/mail/daedalus-to-pm-architect-step10-alignment-round2-2026-04-11.md`. Drafted but not yet sent. About to receive Iris's reply, so holding to integrate.

### 18:30 — Iris reply received

`docs/mail/iris-to-daedalus-step10-phase1-ux-2026-04-11.md`. Substantive, sharp, several specific format-shaping requests. Decision: hold the round 2 Architect memo and revise to integrate Iris's input. Avoid running two bilateral conversations when one multilateral integration is cheaper and produces a better result.

#### Iris additions to schema (mostly additive)

| Iris ask | Format change |
|---|---|
| `field_notes` as structured array, not string blob | Document as `null \| FieldNote[]`; commit to array structure |
| File metadata: `added_at`, `source` per file | Add to all file entries in `files[]` |
| Channel lifecycle | Add `created_at` and `last_active_at` to `conversation_context` |
| Compaction metadata | `compacted_at` in addition to summary + before_message_id |
| Provenance optional `summary` field | Human-readable hint per entry |
| L1 kit briefing explicitly out | Document in spec — regenerated at destination |
| Entity ordering for roundtable | Array order is source of truth — document the contract |

#### Iris structural ask (load-bearing)

**Single-channel vs project-scope packages.** The user's mental model is project-first. When xian thinks about taking Piper Morgan to a new environment, he thinks "take the project," not "take these N channels." Canonical use cases (daily omnibus, weekly ship) all live within project scope and share KB files, memory, entities. Single-channel packages would duplicate context.

Iris's recommendation, which I'm adopting: **use `package_kind` as the load-bearing discriminator**. Phase 1 ships `klatch.context.v1` (single channel) only. Reserve `klatch.project.v1` for the future. Document the *contract* that fields outside the kind-specific body are stable across kinds. This is what makes the multi-channel version possible later without surprising consumers.

Independent confirmation that `package_kind` (which I added in round 1 and the Architect didn't comment on) is load-bearing. Both Iris and I converged on it from different angles.

#### Layer 5 framing improvement

Iris pushes back on my "here's what you're losing" language and offers a better one from the "What Doesn't Transfer" blog: *information transfers; judgment doesn't transfer but is recoverable through use*. Adopting this. The export isn't a loss event — it's a handoff with some pieces the receiver will rebuild. More accurate and more productive frame.

### 18:45 — Schema sketch revised (round 2, integrated)

This replaces the round 2 sketch above. Same JSON, with all Iris additions integrated.

#### Bundle layout

```
package/
  manifest.json              # the canonical structured doc
  conversation.jsonl         # message history, one per line
  layer_2_instructions.md    # project instructions as text
  layer_3_memory.md          # project memory as text
  layer_4_context.md         # channel addendum as text
  files/
    {file_id}_{name}         # binary file attachments, scoped via top-level files[]

# Note: no layer_1_kit_briefing.md by design.
# L1 is environment-specific and regenerated at destination, not carried from source.
```

#### `manifest.json` shape (round 2 integrated)

```json
{
  "format_version": "1.0.0",
  "source_type": "klatch",
  "package_id": "<uuid>",
  "package_kind": "klatch.context.v1",
  "created_at": "<iso 8601>",

  "provenance": [
    {
      "source": "claude-code",
      "path": "/Users/xian/...",
      "session_id": "abc-123",
      "at": "2026-03-11T...",
      "summary": "Original Claude Code session"
    },
    {
      "source": "klatch",
      "instance": "klatch-laptop",
      "at": "2026-04-11T...",
      "summary": "Imported and worked on in Klatch",
      "layer_fidelity": {
        "L1": "full",
        "L2": "full",
        "L3": "full",
        "L4": "partial",
        "L5": "rebuilt"
      }
    }
  ],

  "project": {
    "id": "<uuid>",
    "name": "Klatch",
    "instructions": { "ref": "layer_2_instructions.md", "length_chars": 1234 },
    "memory": { "ref": "layer_3_memory.md", "length_chars": 5678 },
    "knowledge_base_file_ids": ["f1", "f2"]
  },

  "conversation_context": {
    "id": "<uuid>",
    "name": "Step 10 design",
    "type": "chat",
    "mode": "panel",
    "created_at": "2026-04-11T16:10:00Z",
    "last_active_at": "2026-04-11T18:45:00Z",
    "context": { "ref": "layer_4_context.md", "length_chars": 0 },
    "pinned_file_ids": [],
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

  "files": [
    {
      "id": "f1",
      "name": "ROADMAP.md",
      "mime_type": "text/markdown",
      "size_bytes": 4321,
      "ref": "files/f1_ROADMAP.md",
      "scope": "project",
      "scope_id": "<project_id>",
      "ref_type": "imported",
      "added_at": "2026-03-11T...",
      "source": "imported"
    }
  ],

  "conversation_history": {
    "ref": "conversation.jsonl",
    "message_count": 142,
    "first_message_at": "2026-04-11T16:10:00Z",
    "last_message_at": "2026-04-11T17:00:00Z"
  },

  "extensions": {}
}
```

#### Schema notes (to be expanded in design doc)

- **`entities[]` array order is the source of truth for roundtable mode response order.** Documented contract; matches current Klatch behavior. If a future kind needs explicit ordering, add a `position` field then.
- **`field_notes`** is `null | FieldNote[]`. Phase 1 ships as null. Phase 3.5 populates the array. Each `FieldNote` is a typed object — exact field set TBD with Iris but at minimum `observation`, `citations`, `confidence`, `source`, `status`. Committing to the array structure now prevents Phase 3.5 from being locked into wall-of-text UX.
- **`compaction_state`** is shown as null in the example. When non-null, it carries `summary`, `before_message_id`, and `compacted_at` at minimum. Possibly more.
- **`layer_fidelity`** values: `full | partial | rebuilt | absent`. Optional per provenance entry. Origin entries don't need it. See round 2 questions to Architect for the controlled vocabulary discussion.

#### `package_kind` contract (load-bearing)

Phase 1 ships `klatch.context.v1` (single channel) only. Future kinds reserved.

**The contract:** these fields are *stable across all kinds* and form the manifest preamble:
- `format_version`
- `source_type`
- `package_id`
- `package_kind`
- `created_at`
- `provenance`
- `files`
- `extensions`

These fields are *kind-specific* and may differ in shape between kinds:
- `project`
- `conversation_context`
- `entities`
- `conversation_history`

A consumer reads `package_kind` to know which body shape to expect. Preamble fields can always be parsed without knowing the kind. This contract is what makes future kinds (`klatch.project.v1` for multi-channel project export, possibly others) possible without breaking existing consumers.

### 19:00 — Round 2 Architect memo revised

`docs/mail/daedalus-to-pm-architect-step10-alignment-round2-2026-04-11.md` rewritten to integrate Iris's input. Carries the integrated sketch, attributes the additions, expands the open questions to include `package_kind` contract validation.

### 19:15 — Reply to Iris drafted

`docs/mail/daedalus-to-iris-round2-2026-04-11.md`. Acknowledges her input is going to the Architect verbatim, confirms the structural call on `package_kind`, accepts the array commitment for `field_notes`, accepts the working-together norm of cross-tagging on design-touching session logs.

### 19:20 — Wrapping for now

Six artifacts produced this session:
- Iris round 1 reply (intro questions + Phase 1 UX questions)
- PM Architect alignment memo (round 1)
- Architect reply received and processed
- Iris reply received and processed
- Schema sketch revised twice (round 1, then round 2 integrated)
- Round 2 Architect memo (integrated, ready to deliver via xian)
- Reply to Iris (confirmation + working norms)

No code. No design doc committed. The schema doc waits until the integrated round 2 lands, the Architect's response comes back, and the open questions resolve.
