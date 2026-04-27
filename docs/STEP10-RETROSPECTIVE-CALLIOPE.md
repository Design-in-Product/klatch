# Step 10 Retrospective — Calliope's Perspective

**Date:** April 26, 2026
**Author:** Calliope (writing & coordination)
**Companion to:** [`docs/plans/STEP-10-RETROSPECTIVE.md`](plans/STEP-10-RETROSPECTIVE.md) — Daedalus's shipped-code-focused close-out, the canonical artifact. This document is the design-discipline complement: what design moves paid off, what tradeoffs we accepted, what's open.
**Participants:** Daedalus (architecture & implementation), Argus (quality & testing), Iris (UX), Calliope (writing & coordination), xian (product), with cross-project shaping from Janus (memory research synthesis), PM Chief Architect (cross-producer alignment), and convergent independent work from Erika Flowers (Labrador).
**Scope:** Step 10 Phases 1 → 5c-i — canonical package format, export pipeline, layer-aware UI, dual-mode behavioral calibration, transport adapters, and the Klatch MCP server.
**Status:** Functionally complete. 5c-ii (auto-reflect) and 5d (HTTP + auth) deferred past 1.0.

---

## What Step 10 was

Import (Step 8) brought conversations *into* Klatch. Step 10 sent them *back out* — but the framing the team adopted in early planning was not "write a file." It was **synthesize the five-layer model into a portable package that can be unpackaged into any target environment, while honestly grappling with the empirical fidelity gap.**

The two-lens framing — kept separate from day one — was load-bearing throughout:

1. **Package format** — what's *in* an exported context bundle (data structure, file layout, metadata)
2. **Transport** — how the package gets *into* a target environment (file download, HTTP, MCP, copy-paste)

Defining the format first let multiple transports plug in without one-off "export to X" features. By Phase 5, the MCP server served byte-equivalent packages to the HTTP export endpoint because they shared one builder. That outcome was earned at Phase 1, before any transport existed.

The relevant design docs:
- `docs/plans/STEP-10-EXPORT-META-MODEL.md` — phasing plan
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — canonical format spec (v1.0)
- `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md` — dual-mode calibration extraction
- `docs/plans/STEP-10-PHASE-5-MCP-SERVER.md` — MCP server design
- `docs/futures/2026-04-10-klatch-as-context-protocol.md` — protocol framing

---

## What we built

### Phase 1: Canonical context package format

The data structure that captures a conversation, its project context, its entities, its files, and its provenance in a portable, self-describing bundle.

- `format_version` semver + `package_kind: klatch.context.v1` discriminator (`producer.name.version` convention)
- Bundle layout: `manifest.json` + sidecar markdown files (`layer_2_instructions.md`, `layer_3_memory.md`, `layer_4_context.md`) + `conversation.jsonl` + `files/` directory
- **No `layer_1_kit_briefing.md` by design** — L1 is environment-specific and regenerated at the destination
- `provenance` array with immutable, ordered events; per-hop `layer_fidelity` (`full` / `partial` / `rebuilt` / `absent`)
- **Trust orthogonal to fidelity** — trust on content (`agent-observed`, `human-authored`, `cross-project`, `synthesized`, `external`, `unattributed`), fidelity on transit
- `entities[]` array carries L5 prompts inlined for self-containment, plus a reserved `field_notes: FieldNote[]` slot
- `extensions: { klatch: {...} }` namespacing for project-specific metadata
- Reserved structural slots for tamper-evidence (`integrity` on provenance events) and typed memory (`memory_format: "flat" | "typed"`) — cheap doors, no premature construction

Cross-project alignment with PM Chief Architect (two rounds): preamble fields stable across all kinds; PM uses `piper-morgan.session.v1` and `piper-morgan.workspace.v1`; both producers honor `package_kind` discriminator pattern.

### Phase 2: Bundle export endpoint + Tier 1 round-trip

- `GET /api/channels/:id/export` returns a zip of the canonical package
- `GET /api/channels/:id/export-preview` returns the manifest only (cheap inspection)
- **Round-trip integration test:** Klatch → exported package → re-imported into a different Klatch instance, verified fidelity. Tier 1 of the round-trip escalation scale.

The format passed its own self-consistency test before any transport adapter was written.

### Phase 3: Layer-aware export UI

- Layer-by-layer breakdown shown to the user before export (the **sparkline** rendering)
- Trust labels surfaced; fidelity labels surfaced; the orthogonality is visible to the user
- Layer 5 calibration gap made explicit — the UI tells you what you're losing, not just what you're getting
- Iris collaboration point. Tesler's Law in practice: the complexity is irreducible; the UI makes it navigable.

### Phase 3.5: Behavioral calibration transfer

The most architecturally novel piece of Step 10. The Janus memory-research synthesis named the gap: "nobody has solved learned behavioral calibration." The Phase 3.5 design proposed a dual-mode mechanism, both producing entries in the `field_notes: FieldNote[]` array.

- **Mode 1 — External extraction (auxiliary observer LLM).** Reads the conversation history, produces structured behavioral observations with citations. Catches Subliminal patterns the entity can't self-report. Output: `source: "external-extraction"`.
- **Mode 2 — Self-authored handoff briefing.** The entity itself writes a briefing for its successor at export time. Captures tacit judgment the observer can't see. Empirically validated as the highest-value context across xian's agent ecosystem (PM Agent 360 work + sibling projects). Output: `source: "self-authored-briefing"`.

Where the modes agree, confidence is high. Where they disagree, the human reviewer has a meaningful decision to make — not a rubber stamp. All field notes start as `status: "draft"` and become `human-authored` only on review.

Phase 3.5c-i (periodic micro-reflections appended to entity memory) shipped as the lighter cousin: `MicroReflection` rows accumulate at session boundaries with `type: 'session-end' | 'correction' | 'observation'` and feed into the export-time briefings as source material.

Phase 3.5c-ii (LLM-backed auto-reflect) is deferred — not blocked, just awaiting a driver.

### Phase 4: Targeted transports

Each is an adapter on top of the canonical package — not a one-off export path.

- **Claude Code adapter** — structured to drop into a `.claude/` directory: `CLAUDE.md`, `MEMORY.md`, files, conversation seed, **reverse kit briefing** ("you've been working in Klatch; you have full tool access again")
- **claude.ai adapter** — produces `conversations.json` + `projects.json` + `memories.json` matching the format claude.ai imports
- **Round-trip capable** — Argus's Round 24 verified Klatch → claude.ai export → Klatch import survives cleanly

The adapters don't translate or remap the canonical format. They consume it and emit destination-specific files. If the canonical format is wrong, every adapter is wrong; if it's right, adding a new adapter is mechanical.

### Phase 5: Klatch as MCP server

The capstone. The format was designed for this from Phase 1; the export button was the warm-up. Phase 5 is where "canonical context interchange protocol" stopped being aspirational.

**Phase 5a (read-only resources, stdio):**
- Five URIs: `klatch://channels`, `klatch://channels/{id}`, `klatch://channels/{id}/manifest`, `klatch://projects/{id}`, `klatch://entities/{id}`
- Extracted manifest builder (`packages/server/src/export/package-builder.ts`) shared between the HTTP export route and the MCP server. **Single source of truth for the canonical package shape.**
- Versioning negotiation at the protocol boundary: server advertises supported `format_version` list

**Phase 5b (tools surface):**
- `list_channels(filter?, limit?, offset?)` — filtered enumeration
- `get_context_package(channel_id, opts)` — rich accessor with `include_briefing`, `include_extraction`, `include_review_state`, `format_version`
- `get_manifest(channel_id)` — lightweight preview
- Cross-producer alignment with PM secured 2026-04-18: `klatch://` scheme, `pipermorgan://` scheme, **shared `get_context_package` tool name**, **`/{id}/manifest` cheap-peek convention** as cross-producer pattern

**Phase 5c-i (write-path + prompt):**
- `reflect(channel_id, entity_id, note, type?)` — first MCP write-path. Validates channel + entity + membership. Stamps `ingress: 'mcp'` on the `MicroReflection` row.
- `kit_briefing(channel_id)` — MCP prompt returning the L1 reverse-kit-briefing for the target environment
- Argus's URL-decode two-liner applied to all four resource template handlers (preempted a future non-UUID ID problem while in the file)
- First MCP-ingressed reflection captured at `docs/firsts/2026-04-26-mcp-first-reflection.md` — the moment Klatch stopped being writable only by its own UI

**Phase 5c-ii (auto-reflect):** deferred until a driver appears.

**Phase 5d (HTTP + auth):** deferred past 1.0.

---

## What worked well

### 1. The two-lens framing held all the way through

Format and transport stayed separate. By Phase 5, this was visible in the architecture: one `package-builder.ts`, multiple consumers (HTTP route, MCP server, transport adapters). If we had let format-shape decisions leak into transport code (or vice versa), the MCP server would have invented a second data shape — which was the exact failure mode we designed against.

### 2. Trust orthogonal to fidelity

The temptation to collapse "how reliable is this content?" and "how much survived transit?" into a single quality signal was real. We refused. Trust lives on content entries (`agent-observed`, `human-authored`, `synthesized`...); fidelity lives on provenance entries (`full`, `partial`, `rebuilt`, `absent`). Two distinct quality dimensions, never collapsed.

This decision paid off at Phase 3.5 — `field_notes` carry per-entry trust (a `synthesized` draft becomes `human-authored` after review) without needing to invent new vocabulary. It will continue to pay off whenever a consumer wants to apply different policies for different content kinds.

### 3. The sparkline test as a forcing function

Coined during the Phase 1 design conversation:

> Could a consumer parse this manifest and produce a per-layer breakdown — name of layer, name of contributing sources, content lengths, a stable ordering — without re-deriving anything from prose, without parsing markdown, and without round-tripping through source code?

Every layer of the manifest had to pass. `length_chars` on content refs and `prompt_length_chars` on entities exist *because* of this test. Bad design choices — implicit ordering, free-form metadata, anything that required code to interpret — failed it and got removed. Origin: Labrador's product UI shipped with a live per-layer sparkline; we adopted it as the inverse-rendering test.

### 4. Cross-producer alignment, deliberate and early

PM and Klatch independently arrived at "context package" as the noun. Two rounds of memo exchanges with PM Chief Architect produced agreement on:
- Scheme-per-producer (`klatch://`, `pipermorgan://`) with downstream clients routing by scheme
- **Shared cross-producer tool name `get_context_package`**
- **`/{id}/manifest` sub-resource convention** for cheap discovery across both servers

The cost of alignment was two memos. The cost of *not* aligning would have been every multi-producer client integrating each producer one-off. We named the shared things on purpose.

### 5. Reserved structural slots, no premature construction

`integrity: null` reserved on every provenance event for future tamper-evidence. `memory_format: "flat" | "typed"` reserved for the typed-memory evolution. `field_notes: null` reserved on every entity in v1.0, populated in 3.5+. These cost nothing in the spec; they make every future evolution a non-breaking additive change rather than a versioned break.

The discipline: where a future capability would require a format change, *reserve the structural slot now (free), don't build behavior behind it (cost without driver).* Doors stay cheap. Construction happens only when there's a concrete need.

### 6. The Phase 5c design gate paid for itself

`reflect` was the first MCP write-path. Before any code, Daedalus surfaced four design questions to xian:
1. Which entity gets the reflection? → require explicit `entity_id`
2. Default `type`? → `'observation'` (new value, additive)
3. Provenance/source marking? → stamp `ingress: 'mcp'` (open string field, not enum, so future ingresses don't break the schema)
4. Auto-reflect mode? → deferred to 5c-ii

All four turned out to be load-bearing once real bytes hit the disk. None would have been catchable from reading the spec alone. The gate cost ~10 minutes of conversation; it produced a write-path that didn't need to be redone.

### 7. The format anticipated the protocol

When Phase 5 started, no spec changes were required to make the canonical package MCP-serveable. The version-negotiation, the `/{id}/manifest` cheap-peek pattern, the trust/fidelity orthogonality — all already in place. Phase 5 was almost entirely transport plumbing, because Phase 1 had already named the protocol-shaped fields. **Protocol-first naming, applied at Phase 1, paid out at Phase 5.**

### 8. Behavioral calibration found a real mechanism

The Phase 3.5 dual-mode design (external extraction + self-authored briefing) is, as far as we can tell, novel. Janus's memory-research synthesis surveyed published systems and found the gap: behavioral calibration didn't transfer. The mechanism — two complementary modes producing structured `FieldNote[]` entries with `status: draft` until human review — is a publishable finding if the field-notes prove reliably useful to successor instances.

The empirical anchor for the self-authored briefing came from xian's PM Agent 360 work (5-role Chat→Code migration wave): handoff briefings were consistently the highest-value context agents reported receiving. We built the mechanism that the empirical finding said would work.

### 9. Multi-agent coordination held across an 8-day gap

The team went dark from 4/18 to 4/26 (xian on other responsibilities). On the morning of the return, every agent picked up from their prior log + COORDINATION.md + mail and was productive within minutes. Daedalus shipped 5c-i in 35 minutes. Argus closed both of Calliope's parked items from 4/18 (Pattern-062 + PM #995) plus Round 27 plus an intel sweep. Calliope cleared two Janus relays. **The repo was the redundant store; nobody had to be.**

This is the externalize-before-the-seam discipline at work. Step 10 itself produced the artifacts; the wrap protocol made them durable; the gap proved they were enough.

---

## Tradeoffs we accepted

### 1. Layer 1 (kit briefing) regenerated at destination, not carried

L1 is environment-specific. A package cannot know what environment the consumer will run in, so it cannot write L1. We documented this as an *intentional absence* and built `kit_briefing(channel_id)` as the MCP-native way to bootstrap the destination's L1 from the package.

The tradeoff: a package alone is incomplete for any consumer that wants the full five-layer assembly. The consumer must know to call the prompt or build its own L1. We chose this over carrying environment-specific L1 in the bundle, which would have made packages non-portable.

### 2. Layer 5 transfer fidelity is bounded by what we can extract

Phase 3.5's dual-mode extraction is an approximation, not a recovery. The L5 calibration that lives below the prompt surface — tacit judgment, micro-corrections internalized over many turns, the agent's sense of what kind of question is worth asking — is captured in field notes only to the extent the auxiliary LLM observes it or the entity can articulate it.

We made this gap explicit in the UI (Phase 3) and in the format (`layer_fidelity: "rebuilt"` is a real value with documented semantics). We did not claim to have closed it. Tesler's Law: the complexity is irreducible; we surface it instead of hiding it.

### 3. stdio-only for MCP, no HTTP for 1.0

Phase 5d (HTTP + auth) is deferred past 1.0. Concrete drivers (remote Claude Code over SSH, Managed Agents pulling live context, PM BYOC consumption) are all hypothetical. We refused to build auth without a real use case naming itself. Local-first, closed-loop, single-user is the 1.0 surface.

### 4. The MCP write-path is opt-in by client, not gated by user

`reflect` validates channel + entity + membership but does not require user confirmation per call. A misconfigured MCP client could append observations the user didn't review. The membership check is a gate; the user-review-per-write would be a different gate we chose not to build.

`field_notes` are `status: draft` until reviewed, which is the human-in-the-loop checkpoint at the *export* boundary. For continuous reflection ingress, the trust model is "the channel owner controls who can connect to their MCP server" (which, on stdio, means "the same user who launched it").

---

## What's deferred and why

| Item | Status | Why deferred |
|---|---|---|
| **Phase 5c-ii — auto-reflect mode** (`reflect` with no `note`, LLM-backed) | Not blocked; awaiting driver | The mechanism exists (Phase 3.5a/b briefing pipeline). Adding a no-arg auto path costs an LLM call per invocation. Wait for a real client to want it before paying that cost. |
| **Phase 5d — HTTP transport + auth** | Past 1.0 | No concrete driver. Local-first stdio covers 1.0 use cases completely. HTTP brings auth, multi-tenancy, network surface — all real costs without a real benefit yet. |
| **Typed memory** (`memory_format: "typed"`) | Reserved slot, not built | The flat-markdown form works. Typed entries with frontmatter (`type`, `valid_from`, `trust`) become valuable only when consumers want to filter/age memory entries. Activate when a driver appears. |
| **Tamper-evidence** (`integrity` on provenance events) | Reserved slot, not built | No current threat model demands cryptographic chain-of-custody for context packages. The slot is there; the construction waits. |
| **Multi-channel project packages** (`klatch.project.v1`) | `package_kind` reserved | Single-channel packages cover the export and MCP use cases today. Project-level export is a natural extension when bulk export becomes a user need. |
| **Inline binary file retrieval over MCP** | Post-5b question | Files are referenced by ref, not inline. Binary inline is a different transport problem and post-5b. |

---

## Metrics

- **Tests passing:** 918 server (was 909 → 915 with Round 27 → 918 with `removeReflectionsWhere`); 160 client; 0 failures
- **Test coverage rounds added in Step 10:** Round 25 (Phase 5a), Round 25b (Phase 5a extended), Round 26 (Phase 5b), Round 26b (Phase 5b extended), Round 27 (Phase 5c-i), Round 27b (Phase 5c-i extended, Argus assignment in flight)
- **Round-trip tier reached:** Tier 1 (Klatch → Klatch, same version). Tier 3+ (independent parser, Managed Agents, BYOC, three-environment chain) remain on the escalation scale.
- **MCP surface:** 5 resources, 4 tools (`list_channels`, `get_context_package`, `get_manifest`, `reflect`), 1 prompt (`kit_briefing`)
- **Cross-producer alignment achieved with:** PM Chief Architect (two memo rounds, 2026-04-18 final)
- **First-of-its-kind artifact:** `docs/firsts/2026-04-26-mcp-first-reflection.md`

---

## What's next

### Pre-1.0 beta nice-to-haves (in flight)

1. **Stamp `ingress` on existing reflection writers** (UI, auto-end-of-session) for consistency with the MCP write-path
2. **Refactor `routes/export.ts`** to share the `assembleChannelPackageWithOptions` helper — eliminates four duplicated briefing/extraction blocks
3. **Step 10 retrospective doc** (this document) — Phases 1 → 5c-i in one place
4. **MCP setup beta-doc** — how a Claude Code / Desktop user wires Klatch in. Useful at release; gives Calliope operational ground-truth for blog drafting.

### Testing for 1.0 beta

- Round 27b extended coverage (Argus, in flight): protocol-level integration over stdio for `reflect`, write-path persistence end-to-end, membership-check enforcement, `kit_briefing` across all three channel sources, URL-decode parametric coverage, `MicroReflection.ingress` flow through full export pipeline
- Higher round-trip tiers (Tier 3+) when a concrete path opens

### Step 11

Search and recall: FTS5 full-text search across all messages, search UI with project/source/layer filters, command palette (Cmd+K), bulk export to Markdown/JSON, bookmarks. Step 10's metadata work makes this powerful — a search that understands project structure, context layers, file types, and trust labels returns differentiated results.

### Vision items unblocked by Step 10

- **Klatch as universal context transport (and MCP service)** — Step 10 made this concrete rather than aspirational. The 1.0 beta is its first public form.
- **Cross-vendor entity channels** — entity model is already model-agnostic; pluggable API client layer remains the structural work.
- **Workflow templates / standing workflows** — Step 10's primitives (canonical packages, MCP read+write, `field_notes` review pipeline) are the substrate.

---

## Coda

Step 10 took the five-layer model from a piece of practice-wisdom about the prompt-assembly engine and turned it into a portable, versioned, queryable, cross-producer-aligned interchange protocol with two transports, four adapters, a write-path, and a behavioral-calibration mechanism that approximates what nobody had previously solved.

The phases shipped over April 10 → April 26. Two solo builders working in parallel (Klatch and Labrador), no contact between them, converged on structurally identical context architecture. That convergence is itself part of the finding: the five-layer model is a discovered pattern, not an invented convention. Step 10 is what happens when a discovered pattern is treated as a protocol and given the format-design discipline a protocol deserves.

The 1.0 beta is the moment we offer it to other people.
