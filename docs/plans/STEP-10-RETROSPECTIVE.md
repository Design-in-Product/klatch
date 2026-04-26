# Step 10 Retrospective

*Closing artifact for Step 10 (Export + Meta-Model Synthesis). Authored 2026-04-26 by Daedalus.*
*Status: Step 10 functionally complete (Phases 1 → 5c-i shipped; 5c-ii deferred until driver; 5d deferred past 1.0).*

---

## What Step 10 set out to do

Two things at once:

1. **Make Klatch's context portable.** Get a conversation, its system prompts, its
   project memory, its files, and the agent's behavioral calibration *out* of
   Klatch in a shape another environment can pick up and continue from.
2. **Make context a first-class interchange protocol.** Not just an export
   button — a canonical format with a version, a cross-vendor namespace, and
   a transport story that doesn't lock in a single destination.

The original framing came from the recognition that Klatch's value isn't
*holding* conversations — it's making the context within them portable across
the increasingly fragmented Claude/AI tool ecosystem. Step 10 is where that
framing turned into shipped code.

---

## What shipped

### Phase 1 — Canonical package format

A versioned JSON manifest (`format_version`, `package_kind`, per-source
`provenance`, namespaced `extensions`, `source_type` structural identification)
plus sidecar files (`layer_2_instructions.md`, `layer_3_memory.md`,
`layer_4_context.md`, `conversation.jsonl`, `files/`). Designed in
collaboration with PM Architect, Argus, Iris, and Janus so the same shape
could be authored by multiple producers (Klatch, Piper Morgan, hypothetical
others) without coordination on every field.

Decision that paid off: `extensions` namespacing (`klatch: {...}`,
`piper-morgan: {...}`) lets producers add their own data without colliding
or requiring spec amendments. The Sparkline test — "can a thoughtful reader
of this manifest reconstruct the situation?" — became the design rubric.

### Phase 2 — HTTP export endpoint

`GET /channels/:id/export` produces the canonical package as a zip. Drove
the end-to-end format → bytes round-trip and surfaced gaps the design phase
hadn't seen (file naming under unique-ID prefixes, `format_version` byte
positioning, manifest pretty-printing for human inspection).

### Phase 3.5 — Behavioral calibration

The hardest, most novel part of Step 10. Three slices:

- **3.5a — Self-authored handoff briefing.** The entity reads its own recent
  conversation and writes "what a future me should know to continue
  effectively." LLM-backed, opt-in via `?briefing=true`.
- **3.5b — External behavioral extraction.** A second pass extracts patterns
  the entity wouldn't articulate about itself, using a different prompt
  framing. Opt-in via `?extract=true`.
- **3.5c — Micro-reflections.** The `MicroReflection` row + `appendReflection`
  helper + `/channels/:id/reflect` endpoint. Lets the entity stamp a single
  observation per session-end without a full briefing. These accumulate on
  the entity and surface in field notes on every subsequent export.

This is the slice that makes Layer 5 (the agent's behavioral self-model)
even *partially* portable. Without it, every export carries L1–L4 at full
fidelity and L5 at zero.

### Phase 4 — Transport adapters

Two destination-specific adapters that consume the canonical manifest and
emit destination-shaped artifacts:

- **claude-code:** `CLAUDE.md` + `MEMORY.md` + `files/` zip, suitable for
  dropping into a Claude Code project directory.
- **claude.ai:** `conversations.json` + `projects.json` + `memories.json`
  zip, structured to round-trip back through claude.ai's import path.

The round-trip test (claude.ai → Klatch → claude.ai) verified that the
canonical format doesn't lose fidelity when the destination is the same as
the origin.

### Phase 5 — MCP server

Klatch as a live MCP server, not just a producer of files.

- **5a (read-only resources):** Five URIs (`klatch://channels`,
  `klatch://channels/{id}`, `klatch://channels/{id}/manifest`,
  `klatch://projects/{id}`, `klatch://entities/{id}`). Stdio transport.
  Shared `package-builder.ts` between HTTP and MCP so the two cannot drift.
- **5b (tools surface):** Three tools (`list_channels`, `get_context_package`,
  `get_manifest`) with filter/pagination + format-version negotiation. Shared
  `assembleChannelManifest` helper used by both routes and tools.
- **5c-i (write-path + prompt):** `reflect(channel_id, entity_id, note, type?)`
  tool — the first MCP write-path, stamping `ingress: 'mcp'` so provenance
  travels with the row. `kit_briefing(channel_id)` prompt for client
  bootstrapping. URL-decode applied to all four resource template handlers
  (Argus's two-line memo).

### Polish (concurrent with 5c-i wrap)

- `removeReflectionsWhere(entityId, predicate)` helper in queries — general
  affordance for redaction / cleanup, not just smoke-test escape.
- Ingress consistency: `/reflect` endpoint also stamps `ingress: 'klatch-ui'`
  so the field is meaningful regardless of origin.
- `assembleChannelManifest` shared helper in `export/assemble.ts` — collapses
  ~200 lines of duplicated load+briefing+extraction orchestration across the
  four export routes plus the MCP server's options path.

---

## What was deferred

- **Phase 5c-ii — auto-reflect mode.** `reflect(...)` with `note` omitted
  triggers an LLM-backed reflection generation (parallel to Phase 3.5c
  auto-end-of-session). Deferred because no client wants it yet. The entry
  point is in place; the codepath is one new branch in the tool handler.
- **Phase 5d — HTTP transport + auth.** Deferred past 1.0. Will ship only
  when a concrete remote use case names itself. Adding HTTP means adding
  authentication, which is real work for a hypothetical demand today.
- **`mcp_visibility` flag on channels.** Skipped from 5a/5b. If the user
  wants to exclude specific channels from MCP enumeration, the flag and
  filter land in a follow-up.
- **Binary file inline retrieval over MCP.** Files referenced by ID are
  served by reference, matching the canonical package's behavior. Inline
  binary retrieval via `resources/read` is a post-5b question and hasn't
  been asked.

---

## Cross-project alignment outcomes

PM Chief Architect's reply on 2026-04-18 confirmed three interop points
without requiring further negotiation:

1. **Scheme-per-producer:** Klatch uses `klatch://`, PM uses
   `piper-morgan://`. Downstream multi-producer clients route by scheme.
2. **Shared tool name:** `get_context_package` is the cross-producer tool
   name. The response envelope is canonical (Phase 1 format); producer-specific
   options (Klatch's `include_briefing`, PM's eventual options) stay
   producer-specific.
3. **`/{id}/manifest` sub-resource pattern:** Adopted as a cross-producer
   convention for cheap preview. A multi-producer client can enumerate and
   peek at packages from both servers without pulling full payloads.

PM's eventual `save_artifact` write-path (analogous to Klatch's `reflect`)
will need its own coordination cycle when both are concrete. Parked.

---

## Lessons from doing it

1. **The canonical format was the load-bearing decision.** Designing Phase 1
   before any export code meant the HTTP route, the four transport adapters,
   and the MCP server all serve the same shape. The shared
   `package-builder.ts` extraction in 5a was straightforward because the
   producers had nothing to disagree about. If the format had been "whatever
   `routes/export.ts` happens to emit," every subsequent surface would have
   forked.

2. **Cross-producer alignment is cheaper if you ask early.** The 4/18 memo
   to PM Architect cost one round-trip and resolved three interop questions
   that would otherwise have required retrofit later. The convention that
   emerged (scheme-per-producer + shared tool name + `/{id}/manifest`
   pattern) is more useful than any individual producer's design choices.

3. **The Sparkline test is a real rubric.** "Can a thoughtful reader
   reconstruct the situation from this manifest?" caught underspecified fields
   in 1, missing provenance in 2, and missing field-note attribution in 3.5.
   It's a soft test, but it disqualifies designs the way a hard test
   disqualifies code.

4. **Write-paths leak provenance.** A single 5c-i smoke test left a real row
   in the live DB. Mostly fine (it was labeled, append-only), but it
   surfaced two missing affordances: a removal helper, and `ingress`
   stamping on the existing `/reflect` writer for consistency. Both became
   part of the close-out, not future work.

5. **Gall's-law phasing held up.** 5a → 5b → 5c-i, each with a sign-off
   gate, meant Argus could lock in coverage without chasing a moving target,
   and each phase's design questions were small enough to answer cleanly.
   The original "5c" got split into 5c-i (ship) and 5c-ii (defer) at the
   review point — that split was easier because the phases were already
   discrete.

6. **The 5c design gate paid for itself.** Surfacing four design questions
   (entity selection, default type, ingress modeling, auto-reflect deferral)
   before writing 5c-i code caught all four as load-bearing once real bytes
   hit disk. None would have been catchable from reading the spec alone.
   xian's framing on #3 ("consider mcp as a type of thin wrapper or layer
   when there might be other such types in the future") is what made
   `ingress` extensible rather than enum-locked.

---

## What this opens up

Step 10 done means:

- **Klatch can hand off to anywhere.** Any MCP-capable client can pull
  context. Any user with the export button can move to claude.ai or Claude
  Code. The original "fragmentation tax" framing has a concrete answer.
- **Other producers can join the namespace.** PM is signed up. Any future
  producer that adopts `format_version` + `source_type` + `extensions`
  namespacing is interoperable for free.
- **Layer 5 has a real path forward.** Field notes + reflections + briefing
  + extraction give Layer 5 partial portability. Closing the rest of that
  gap is open research, but the protocol is in place.
- **Step 11 (Search) is unblocked.** No structural dependency was waiting on
  Step 10 finishing; the pivot is clean.

---

## Pointers

- Design docs: `docs/plans/STEP-10-EXPORT-META-MODEL.md`,
  `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md`,
  `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md`,
  `docs/plans/STEP-10-PHASE-5-MCP-SERVER.md`
- First MCP-ingressed reflection: `docs/firsts/2026-04-26-mcp-first-reflection.md`
- Cross-producer alignment memo: `docs/mail/memo-arch-to-daedalus-phase5-mcp-2026-04-18.md`
- URL-decode finding: `docs/mail/argus-to-daedalus-mcp-uri-decoding-2026-04-18.md`
- Test surface: Rounds 18, 22, 23, 24, 25, 25b, 26, 26b, 27 (server) +
  client-side review UI tests
