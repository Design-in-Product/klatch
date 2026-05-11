# Step 10 Phase 1: Canonical Context Package Format

*Design document. Authored 2026-04-12 by Daedalus.*
*Status: Approved — ready for implementation.*

*Shaped by: PM Chief Architect (cross-project alignment, two rounds), Iris (UX implications), Argus (provenance/testability), Calliope with xian (protocol framing, sparkline test, trust/fidelity distinction), Janus (memory research synthesis).*

---

## What this document is

The canonical format for a Klatch context package — the data structure that captures a conversation, its project context, its entities, its files, and its provenance in a portable, self-describing bundle that any consumer can parse.

**This is a protocol specification, not an internal export format.** The format is designed for eventual MCP serving (Step 10 Phase 5) and consumption by tools that have no Klatch source code. It must be self-describing, versioned from day one, and structured for machine parsing without prose re-derivation.

## Design principles

1. **Protocol-first.** Every naming choice, structural decision, and field addition is evaluated as if the format will become a published standard. Internal field names will become public API.

2. **80/20 envelope.** The shared format covers the 20% that overlaps naturally across all producers (Klatch, Piper Morgan, future tools). The 80% that's project-specific stays in `extensions`. Neither project goes out of its way to accommodate the other.

3. **Sparkline test.** A consumer should be able to render a per-layer breakdown — name of layer, contributing sources, content lengths, stable ordering — from the manifest alone, without parsing markdown, counting tokens, or calling back to the source.

4. **Cheap doors, no premature construction.** Where a future capability (tamper-evidence, multi-channel packages, trust-aware assembly) would require format changes, the spec reserves the structural slot now (free) rather than adding it later (breaking change). But no functionality is built behind those doors until there's a concrete need.

5. **Trust and fidelity are orthogonal.** Fidelity (how well content survived transit) belongs on provenance entries. Trust (how much a consumer should believe content) belongs on content entries. They must never be conflated into a single quality signal.

---

## Bundle layout

A context package is a zip file (or directory) with this structure:

```
package/
  manifest.json              # canonical structured document
  conversation.jsonl         # message history, one JSON object per line
  layer_2_instructions.md    # project instructions as markdown
  layer_3_memory.md          # project memory as markdown
  layer_4_context.md         # channel addendum as markdown
  files/
    {file_id}_{name}         # binary file attachments
```

**No `layer_1_kit_briefing.md` by design.** L1 (kit briefing) is environment-specific and regenerated at the destination, not carried from the source. A package cannot know what environment the consumer will run in, so it cannot write L1. The spec documents this as an intentional absence.

The markdown sidecar files (`layer_2_instructions.md`, etc.) duplicate content that's also referenced in `manifest.json`. They exist for human readability — a consumer that only reads `manifest.json` gets everything; a human who opens the bundle in a file browser can read the markdown directly.

---

## Manifest schema

### Preamble fields (stable across all package kinds)

These fields are guaranteed to be present and parseable in every package, regardless of `package_kind`. A consumer can read the preamble without knowing the kind.

```json
{
  "format_version": "1.0.0",
  "source_type": "klatch",
  "package_id": "<uuid>",
  "package_kind": "klatch.context.v1",
  "created_at": "<iso 8601>",
  "provenance": [ ... ],
  "files": [ ... ],
  "extensions": { "klatch": { } }
}
```

| Field | Type | Description |
|---|---|---|
| `format_version` | string (semver) | Envelope schema version. Bumps when the preamble changes. |
| `source_type` | string | Producer of this package: `"klatch"`, `"piper-morgan"`, etc. |
| `package_id` | string (UUID) | Unique identifier for this package instance. |
| `package_kind` | string | Kind discriminator: `"klatch.context.v1"`, `"piper-morgan.session.v1"`, etc. Convention: `producer.name.version`. |
| `created_at` | string (ISO 8601) | When this package was created. |
| `provenance` | array | Ordered chain of source events (see Provenance below). |
| `files` | array | All files in the bundle (see Files below). |
| `extensions` | object | Namespaced project-specific metadata. Key = producer name. |

**Version independence.** `format_version` and the version suffix in `package_kind` move independently. `format_version` is the envelope; the `v1` in `klatch.context.v1` is the kind-specific body. A package can have `format_version: "1.2.0"` and `package_kind: "klatch.context.v1"` — the envelope got a minor update but the context body shape didn't change.

**`source_type` vs `provenance[].source`.** These answer different questions. `source_type` identifies the current producer ("who packaged this?"). `provenance[].source` identifies historical hops ("where has this conversation been?"). A Klatch package built from a Claude Code import has `source_type: "klatch"` and `provenance: [{ source: "claude-code" }, { source: "klatch" }]`.

### Kind-specific body: `klatch.context.v1`

These fields are specific to the `klatch.context.v1` kind. Other kinds (e.g., `klatch.project.v1` for multi-channel exports, `piper-morgan.session.v1`) will have different body shapes.

```json
{
  "project": { ... },
  "conversation_context": { ... },
  "entities": [ ... ],
  "conversation_history": { ... }
}
```

---

### `provenance`

An ordered array of source events recording where this conversation has been. Events are in chronological order; position is semantically meaningful.

```json
"provenance": [
  {
    "event_id": "<uuid>",
    "source": "claude-code",
    "at": "2026-03-11T10:30:00Z",
    "summary": "Original Claude Code session",
    "path": "/Users/xian/Development/klatch",
    "session_id": "abc-123",
    "layer_fidelity": null,
    "integrity": null
  },
  {
    "event_id": "<uuid>",
    "source": "klatch",
    "at": "2026-04-11T16:10:00Z",
    "summary": "Imported and worked on in Klatch",
    "instance": "klatch-laptop",
    "layer_fidelity": {
      "L1": "full",
      "L2": "full",
      "L3": "partial",
      "L4": "full",
      "L5": "rebuilt"
    },
    "integrity": null
  }
]
```

| Field | Type | Required | Description |
|---|---|---|---|
| `event_id` | string (UUID) | Yes | Position-independent self-identifier. Enables future hash chains. |
| `source` | string | Yes | System type: `"claude-code"`, `"claude-ai"`, `"klatch"`, `"piper-morgan"`, etc. |
| `at` | string (ISO 8601) | Yes | When this event occurred. |
| `summary` | string | No | Human-readable hint (3–10 words) for UI rendering. |
| `layer_fidelity` | object or null | No | Per-layer transfer fidelity for this hop (see below). Origin events don't need it. |
| `integrity` | object or null | No | Reserved for future tamper-evidence metadata. Always null in v1.0. |
| *(source-specific)* | varies | No | Source-specific fields: `path`, `session_id` for claude-code; `instance`, `channel_id` for klatch; `project_uuid`, `conversation_uuid` for claude-ai. |

#### Provenance semantics

- **Events are immutable once written.** Each new export appends a new event; existing events are never edited. A package whose existing provenance events have been modified is considered invalid.
- **Order is load-bearing.** Events must appear in chronological order. A consumer that reorders events is producing an invalid package.
- **`integrity` is reserved.** In v1.0, always null. In v1.1+, it may carry structured integrity data (`{ hash, algorithm, previous_event_hash }` or `{ signature, public_key, algorithm }`). Consumers should ignore null values.

#### `layer_fidelity` values

Records what happened to each layer during a transfer hop. Values:

| Value | Meaning |
|---|---|
| `"full"` | Content present and byte-equivalent to source |
| `"partial"` | Content present but degraded (compacted, truncated, lossy reformat) |
| `"rebuilt"` | Content reconstructed from observation, not from source |
| `"absent"` | Content not transferred at all (slot deliberately empty) |

**`layer_fidelity` is not the same as the AAXT failure-mode taxonomy.** `layer_fidelity` classifies *transfer states* — what happened to a layer at a hop. The AAXT taxonomy (Correct / Reconstructed / Confabulated / Absent / Phantom / Subliminal) classifies *probe responses* — what an agent says when asked about a layer. A "rebuilt" L5 might produce "Correct" probe responses if the rebuild was good, or "Confabulated" ones if it was bad. Different questions, related answers.

---

### `project`

Project-level context (Layers 2 and 3). May be null if the channel has no project.

```json
"project": {
  "id": "<uuid>",
  "name": "Klatch",
  "instructions": {
    "ref": "layer_2_instructions.md",
    "length_chars": 12340
  },
  "memory": {
    "ref": "layer_3_memory.md",
    "length_chars": 5678,
    "memory_format": "flat"
  },
  "knowledge_base_file_ids": ["f1", "f2"]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Project identifier. |
| `name` | string | Project name. |
| `instructions` | object | Layer 2 content. `ref` points to sidecar markdown; `length_chars` for sparkline rendering. |
| `memory` | object | Layer 3 content. `ref` points to sidecar; `length_chars` for sparkline; `memory_format` for structure detection. |
| `knowledge_base_file_ids` | string[] | References to entries in the top-level `files` array. |

#### `memory_format`

| Value | Meaning |
|---|---|
| `"flat"` | Plain markdown (current MEMORY.md style). No per-entry metadata. |
| `"typed"` | Markdown files with YAML frontmatter carrying `type`, `valid_from`, `trust`, `source`. Future evolution. |

Phase 1 ships with `"flat"` only. The `"typed"` format activates the three-sub-tier memory model (always-loaded summary, typed entries, retrievable archive) documented in the evolution path below. The evolution from `"flat"` to `"typed"` is a non-breaking change — `"flat"` consumers continue to work; `"typed"` consumers get richer metadata.

---

### `conversation_context`

Channel-level context (Layer 4). The interior shape varies by `source_type`; what follows is the `klatch` shape.

**Cross-source contract:** `conversation_context.id` and `conversation_context.name` are guaranteed to exist across all producers, even when everything else is source-specific. A consumer can display "Package contains conversation: [name]" without checking `source_type`.

```json
"conversation_context": {
  "id": "<uuid>",
  "name": "Step 10 design",
  "type": "chat",
  "mode": "panel",
  "created_at": "2026-04-11T16:10:00Z",
  "last_active_at": "2026-04-12T14:00:00Z",
  "context": {
    "ref": "layer_4_context.md",
    "length_chars": 0
  },
  "pinned_file_ids": [],
  "compaction_state": null
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | **Cross-source.** Channel/conversation identifier. |
| `name` | string | **Cross-source.** Human-readable name. |
| `type` | string | Klatch-specific. `"chat"` or `"klatch"`. |
| `mode` | string | Klatch-specific. `"panel"`, `"roundtable"`, or `"directed"`. |
| `created_at` | string (ISO 8601) | When the channel was created. |
| `last_active_at` | string (ISO 8601) | Last message timestamp. |
| `context` | object | Layer 4 addendum content. `ref` + `length_chars`. |
| `pinned_file_ids` | string[] | References to entries in the top-level `files` array. |
| `compaction_state` | object or null | When non-null: `{ summary, before_message_id, compacted_at }`. |

---

### `entities`

Entity definitions (Layer 5). Array of inlined entity objects. **Array order is the source of truth for roundtable mode response order** — this is a documented contract. If a future kind needs explicit ordering, add a `position` field; for now, array position is canonical.

```json
"entities": [
  {
    "id": "<uuid>",
    "name": "Daedalus",
    "handle": "daedalus",
    "model": "claude-opus-4-6",
    "effort": "high",
    "color": "#6366f1",
    "prompt": "<full text of L5 entity prompt>",
    "prompt_length_chars": 287,
    "field_notes": null
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Entity identifier. |
| `name` | string | Display name. |
| `handle` | string or null | Optional handle slug (`@daedalus`). |
| `model` | string | Model ID (e.g., `"claude-opus-4-6"`). |
| `effort` | string | Effort level: `"low"`, `"medium"`, `"high"`, `"max"`. |
| `color` | string | Hex color for avatar rendering. |
| `prompt` | string | Full text of the L5 entity prompt (inlined for self-containment). |
| `prompt_length_chars` | integer | Character count of `prompt`, for sparkline rendering. |
| `field_notes` | `null \| FieldNote[]` | Reserved for Phase 3.5. See below. |

#### `field_notes` schema

In v1.0, always null. When populated (Phase 3.5+), a structured array of behavioral observations. Each `FieldNote` is a typed object — the exact field set is TBD with Iris, but the array structure is committed now to prevent Phase 3.5 from being locked into wall-of-text UX.

Indicative shape (not yet finalized):

```json
{
  "observation": "Tends to ask clarifying questions before committing to an action plan",
  "citations": ["msg_abc", "msg_def"],
  "confidence": "high",
  "source": "aaxt-probe-2026-04-12",
  "trust": "synthesized",
  "status": "draft"
}
```

The `trust` field on each field note follows the trust vocabulary (see Trust below). A draft field note generated by the AAXT auxiliary LLM is `trust: "synthesized"`; a human-reviewed and approved one becomes `trust: "human-authored"`.

---

### `files`

All files in the bundle. Top-level array with per-file metadata. Parent objects (project, conversation_context) reference files by ID.

```json
"files": [
  {
    "id": "f1",
    "name": "ROADMAP.md",
    "mime_type": "text/markdown",
    "size_bytes": 4321,
    "length_chars": 4321,
    "ref": "files/f1_ROADMAP.md",
    "scope": "project",
    "scope_id": "<project_id>",
    "ref_type": "imported",
    "added_at": "2026-03-11T10:30:00Z",
    "source": "imported",
    "trust": "human-authored"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | string | File identifier (unique within this package). |
| `name` | string | Display name. |
| `mime_type` | string | MIME type. |
| `size_bytes` | integer | File size in bytes. |
| `length_chars` | integer | Character count (for text files; equals `size_bytes` for UTF-8 without BOM). |
| `ref` | string | Relative path to the sidecar file in the bundle. |
| `scope` | string | `"project"`, `"channel"`, `"entity"`, `"message"`. |
| `scope_id` | string | ID of the parent at this scope. |
| `ref_type` | string | `"pinned"`, `"created"`, `"received"`, `"imported"`. |
| `added_at` | string (ISO 8601) | When this file became visible at this scope. |
| `source` | string | How the file arrived: `"uploaded"`, `"imported"`, `"promoted"`, `"tool-created"`. |
| `trust` | string | Content trust level (see Trust below). Default: `"unattributed"`. |

---

### `conversation_history`

Reference to the conversation history sidecar file.

```json
"conversation_history": {
  "ref": "conversation.jsonl",
  "message_count": 142,
  "first_message_at": "2026-04-11T16:10:00Z",
  "last_message_at": "2026-04-12T14:00:00Z"
}
```

The JSONL file contains one JSON object per message. Row format (to be detailed in Phase 2 implementation):

```json
{ "id": "...", "role": "user|assistant", "entity_id": "...", "content": "...", "created_at": "...", "artifacts": [...] }
```

---

## Trust and fidelity

Two orthogonal quality signals. The format represents both; consumers apply their own policy.

### Fidelity (transit quality)

**Lives on:** provenance entries (`layer_fidelity`).
**Answers:** "How much of what was sent actually arrived?"
**Values:** `full`, `partial`, `rebuilt`, `absent`.
**Retrospective:** describes what occurred during a transfer hop.

### Trust (content reliability)

**Lives on:** content entries (files, memory entries, field notes).
**Answers:** "How much should a consumer believe this content?"
**Values:**

| Trust level | Meaning |
|---|---|
| `agent-observed` | An agent directly participated in or witnessed the event |
| `human-authored` | A human wrote or explicitly approved this content |
| `cross-project` | Content arrived from a sibling project via cross-pollination or memo |
| `synthesized` | Content generated by an LLM from other sources |
| `external` | Content originated outside the ecosystem entirely |
| `unattributed` | Source unknown or not recorded (default) |

Trust is not a hierarchy of reliability — `synthesized` isn't always less trustworthy than `agent-observed`. It's a provenance classification that lets consumers make their own weighting decisions. The format provides the classification; the consumer provides the policy.

**Trust does not go on provenance entries.** Provenance entries already have `layer_fidelity`. Adding trust to provenance would conflate two dimensions.

---

## `package_kind` contract

Phase 1 ships `klatch.context.v1` (single channel) only. Future kinds are reserved.

**Preamble stability.** These fields are stable across all kinds and can always be parsed without knowing the kind:

- `format_version`, `source_type`, `package_id`, `package_kind`, `created_at`
- `provenance`, `files`, `extensions`

**Kind-specific body.** These fields may differ in shape between kinds:

- `project`, `conversation_context`, `entities`, `conversation_history`

A consumer reads `package_kind` to determine which body shape to expect. This contract is what makes future kinds (`klatch.project.v1` for multi-channel project export, `piper-morgan.session.v1`, `piper-morgan.workspace.v1`) possible without breaking existing consumers.

**Naming convention:** `producer.name.version` with periods as separators.

---

## Evolution path

### Layer 3 memory structure (Option A → Option B)

Phase 1 ships `memory_format: "flat"` — a single markdown file, no per-entry metadata. Future evolution to `"typed"` activates a three-sub-tier model based on the Janus memory research synthesis:

1. **Always-loaded identity summary** (~200 tokens)
2. **Typed, temporal, provenance-bearing entries** — each with `type`, `valid_from`, `trust`, `source`
3. **Retrievable archive** — searchable but not always-loaded

The format evolves from flat (single `memory.ref`) to structured (separate `summary`, `entries`, `archive` refs) without a breaking change — `"flat"` consumers continue to work; `"typed"` consumers get richer metadata.

### Multi-channel project packages

`klatch.project.v1` is reserved. When implemented, it will share the preamble fields and carry multiple `conversation_context` objects plus a richer `project` section. The `package_kind` contract guarantees preamble stability across this evolution.

### Tamper-evidence

`integrity` on provenance events is reserved for v1.1+. The `event_id` UUID enables future hash chains. The immutability semantic makes "tamper" definable. These structural slots cost nothing in v1.0 and make tamper-evidence a non-breaking additive change.

### `field_notes` population

`FieldNote[]` array structure is committed. Exact field set is TBD with Iris. Phase 3.5 will use the AAXT auxiliary LLM to generate behavioral observations from conversation history. The trust field on each note enables meaningful human review — draft notes are `synthesized`; approved notes become `human-authored`.

### Bidirectional consumption (Klatch-to-Klatch round-trip)

Status as of 2026-04-28: **the canonical format is bidirectional.** Klatch consumes its own output via `POST /api/import/klatch`, accepting the same zip the export route produces.

Round-trip semantics, idempotent by canonical UUIDs:

- **Re-import to source instance** is a no-op attach. The package's `project.id`, `conversation_context.id`, `entities[*].id`, and `files[*].id` already exist; the importer detects each by id and reuses the existing row. Re-import returns `409 duplicate` for the channel by default; pass `forceImport: true` to fork — the forked channel gets a fresh uuid, and original message ids are preserved in `original_id`.
- **Import into a fresh instance** creates new rows that preserve the canonical ids. A subsequent export from that instance round-trips back to the source as another no-op attach (the chain stays unbroken).

The channel's `source` field is preserved from the original provenance. A package that originated as a `claude-code` import retains `source: "claude-code"` after re-importing — preserves kit briefing logic and source-aware UI affordances. Native Klatch channels imported into another Klatch instance get `source: "klatch"` to signal Klatch-to-Klatch handoff.

The format is therefore both an **interchange** spec (Klatch → other tools) and a **portable archive** (Klatch → Klatch, including multi-machine workflows and backup/restore). It is not a CRDT-style merge format; if a re-import would conflict with an existing channel, the user resolves the conflict via 409-then-`forceImport`.

**Import-side validation (Round 32, 2026-05-11):**

- `format_version` is gated against the import-side `SUPPORTED_FORMAT_VERSIONS` set. A package whose `format_version` is missing, malformed, or outside the set is rejected with `400` and a structured `versionMismatch: { formatVersion, supportedVersions }` body. No partial-import occurs; no DB rows are created. The MCP export side has always had `negotiateFormatVersion`; the import side now mirrors that contract.
- A manifest with `entities: []` (or missing) auto-attaches the seed `default-entity` to the imported channel, matching `createChannel`'s seed behavior. Otherwise the imported channel would be exportable only after the user manually added an entity — a user-trap the import path now avoids.

---

## Design heuristics for validation

### The sparkline test

> Could a consumer parse this manifest and produce a per-layer breakdown — name of layer, name of contributing sources, content lengths, a stable ordering — without re-deriving anything from prose, without parsing markdown, and without round-tripping through source code?

Every layer must pass this test. `length_chars` on content refs and `prompt_length_chars` on entities are the fields that make this work.

*Origin: Labrador project (Erika Flowers) — independent implementation of structurally identical context architecture, with a live per-layer sparkline in the product UI. Two solo builders, no contact, same answers. The five-layer model is a discovered pattern, not an invented convention.*

### The independent parser test

A ~50-line Python script should be able to parse a Klatch package and dump it to JSON. If round-tripping through that parser preserves fidelity, the format has no hidden code dependencies. If it doesn't, there's a Klatch assumption that needs to surface in the spec.

### Round-trip escalation scale

| Tier | Test | What it proves |
|---|---|---|
| 1 | Klatch → Klatch (same version) | Format completeness |
| 2 | Klatch → Klatch (older version) | Versioning works |
| 3 | Klatch → independent parser → Klatch | No hidden Klatch-isms |
| 4 | Klatch → Managed Agents session → ? | Cross-environment fidelity |
| 5 | Klatch → PM BYOC server → ? | Inter-project interop |
| 6 | Three-environment chain | Provenance preservation |

Phase 2 targets Tier 1. The format is designed so all six tiers are eventually possible.

---

## References

- **Cross-project alignment:** `docs/mail/memo-arch-to-daedalus-step10-alignment-*.md` — two rounds with PM Chief Architect
- **UX implications:** `docs/mail/iris-to-daedalus-step10-phase1-ux-2026-04-11.md`
- **Provenance doors:** `docs/mail/argus-to-daedalus-step10-provenance-doors-2026-04-11.md`
- **Protocol framing:** `docs/futures/2026-04-10-klatch-as-context-protocol.md`
- **Trust vs fidelity:** `docs/mail/calliope-to-daedalus-trust-vs-fidelity-2026-04-12.md`
- **Memory research:** `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md`
- **Labrador convergence:** `docs/mail/memo-janus-to-calliope-labrador-research-2026-04-11.md`
- **Sparkline test:** `docs/mail/calliope-to-daedalus-sparkline-test-2026-04-11.md`
- **Phasing plan:** `docs/plans/STEP-10-EXPORT-META-MODEL.md`
