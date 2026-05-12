# Anthropic Memory/Dreaming — Impact on Klatch's Import/Export Contract

**Filed by:** Argus
**Date:** 2026-05-12 (in progress — this doc evolves as the spike proceeds)
**Triggering memo:** `docs/mail/calliope-to-argus-anthropic-memory-dreaming-research-spike-2026-05-12.md`
**Cross-project parallel:** Piper Alpha is running the PM-side equivalent independently; cross-read after both publish.
**Scope discipline:** narrow on Klatch's import/export *contract surface* — the April 12 Janus synthesis did the broad memory-systems taxonomy.

---

## Plan of attack

Working through this in five passes. Each pass updates this doc.

| Pass | Goal | Status |
|------|------|--------|
| 1 | Plan + scoping (this section) | ✅ complete |
| 2 | External evidence: what is Anthropic's "Dreaming" technically — artifact shapes, wire formats, where it reads from / writes to | ✅ complete |
| 3 | Internal evidence: what Klatch's current import + export pipeline touches, ignores, and could surface | ✅ complete |
| 4 | PM's dreaming model context — find xian's design, understand the producer-vs-consumer shape | ✅ complete |
| 5 | Synthesize: four answers with evidence + decisions-needed section | ✅ complete |

**Spike complete 2026-05-12.** Single-session, ~2 hours. Cross-read with Piper Alpha's PM-side spike pending publication of theirs.

Discipline: I will not start pass N+1 until pass N's evidence section has at least three concrete citations. Spike risk is going wide without grounding.

## Why this spike now

The 5/11 strategic framing in `argus-to-calliope-managed-agents-dreaming-2026-05-11.md` named the consequence: **Step 11 differentiation must move off "external memory layer for Claude" and onto conversation-as-substrate + cross-channel context assembly.** xian's sharper question this morning: **what does Anthropic's memory/dreaming model do to our import/export contract — before, during, and after migration?**

Cross-project frame: same external dependency (Anthropic's memory defaults) reshapes both Klatch's and PM's import/export surfaces simultaneously. PM has had its own dreaming model since last summer (xian-designed); Anthropic now has one. Two producers, possibly writing into the same artifact slot, possibly not.

## Out of scope

- Implementation. Pure research + memo.
- Contract changes. Make the changes (if any) legible and decidable; Daedalus + xian decide.
- General memory-systems taxonomy. April 12 synthesis already did it.
- PM-side architecture impact. That's Piper Alpha's seat.
- Performance/scale implications. If they exist they belong in a separate spike.

---

## Pass 2: External evidence — what is "Dreaming" technically

### Headline reframing

**Dreaming is not the artifact. Memory stores are.** The trade-press framing ("Anthropic gave Claude self-improving memory") flattens a two-layer architecture:

- **Memory stores** — persistent, workspace-scoped, addressable. The thing that crosses session boundaries.
- **Dreams** — an asynchronous job that READS a memory store + sessions and PRODUCES a new memory store. The cleanup/curation pass.

The portability question for Klatch is therefore about **memory stores**, not dreams. Dreams are an internal mechanism; their output is just another memory store.

### Memory store technical shape (the load-bearing finding)

From the official docs (`platform.claude.com/docs/en/managed-agents/memory`):

> A memory store is a workspace-scoped collection of text documents optimized for Claude. When you attach a store to a session, it is mounted as a directory inside the session's container. The agent reads and writes it with the same file tools it uses for the rest of the filesystem.

**It's a filesystem of markdown files.**

- Each memory addressed by a path (`/preferences/formatting.md`, `/archive/2026_q1_formatting.md`)
- Mounted at `/mnt/memory/` in the agent's container
- Plain text content; ≤100KB / ~25k tokens per file
- Content hash on every entry (`content_sha256`)
- Workspace-scoped (one workspace can have many stores)
- Up to 8 stores per session
- Read-only or read-write attach modes
- Every change creates an immutable memory version (`memver_...`)
- Version retention: 30 days default, recent always kept

**This is exactly the architectural pattern the April 12 Janus synthesis identified as Lin's "underrated" approach.** Anthropic converged to the same shape: typed-but-textual files, hierarchical namespace, version-tracked.

### Dreams technical shape

API: `POST /v1/dreams` with required betas `managed-agents-2026-04-01` + `dreaming-2026-04-21`.

Inputs:
- 1 pre-existing memory store (verified, deduplicated, reorganized)
- Optionally up to 100 sessions (transcripts mined for patterns)
- Model: `claude-opus-4-7` or `claude-sonnet-4-6`
- Optional natural-language `instructions`

Output:
- A NEW memory store (input never modified — auditability primitive)
- Lifecycle: `pending → running → completed | failed | canceled`
- Async, "minutes to tens of minutes"
- Output store ID becomes a normal memory store usable as session resource

The crucial design choice: **dreams produce a new store, never mutate the input.** This means the "dream output" is just another memory store the user can review and either adopt or discard.

### Memory store API surface

Full CRUD plus version operations:

- `memory_stores.create / retrieve / update / list / archive / delete`
- `memories.create / retrieve / update / list / delete` (path-addressed within a store)
- `memory_versions.list / retrieve / redact` (for audit + compliance)

**Critical for portability question:** there is **no native "export memory store as archive" endpoint.** To serialize a store you would:

1. List all memories (with `path_prefix=/`, paginated)
2. Retrieve each by ID for full content
3. Reconstruct the tree externally

Possible, but it's a workflow built on the API, not a single call. The docs explicitly say: "To preserve memory history for longer, export versions via the API" — implying the export is the consumer's responsibility.

### Where this surfaces in Klatch's user world

Critical scoping note: **Memory stores + Dreams are Managed Agents API features.** They are NOT exposed in:

- Claude Desktop (consumer app)
- Claude Code (CLI / IDE tool, even though it imports JSONL transcripts)
- claude.ai (consumer web app)

Memory stores live in the **Anthropic Workbench / API** layer. A user encountering them is one who is **building a Managed Agent** with the SDK.

This narrows the realistic Klatch-exposure scenarios significantly:

- **Today's Klatch import sources** (Claude Code JSONL, claude.ai ZIP) **don't carry memory store content.** They carry conversation history. Tool-use events for `Read("/mnt/memory/...")` may appear in a JSONL if the source agent had a memory store mounted, but the store content itself is workspace-side.
- **The "user has dreaming state to import" scenario** is: a developer building a Managed Agent, who wants to bring their workspace's memory store into Klatch as a starting point for further conversation, OR vice versa.

### Source citations

- [Anthropic — Dreams reference](https://platform.claude.com/docs/en/managed-agents/dreams)
- [Anthropic — Memory Stores reference](https://platform.claude.com/docs/en/managed-agents/memory)
- [SiliconAngle coverage](https://siliconangle.com/2026/05/06/anthropic-letting-claude-agents-dream-dont-sleep-job/)
- [VentureBeat coverage](https://venturebeat.com/technology/anthropic-introduces-dreaming-a-system-that-lets-ai-agents-learn-from-their-own-mistakes)
- [The New Stack coverage](https://thenewstack.io/anthropic-managed-agents-dreaming-outcomes/)
- [BuildFastWithAI explainer](https://www.buildfastwithai.com/blogs/claude-managed-agents-dreaming-explained)

### Pass 2 conclusions feeding pass 3

1. The artifact format is **markdown files in a hierarchical namespace** — directly comparable to Klatch's L3 (project memory) substrate.
2. The portability surface is **list + retrieve + create**, not an archive endpoint. Any serialization Klatch does is workflow code over the SDK.
3. The realistic Klatch-user exposure is **narrower than trade press suggests** — Memory Stores aren't in Claude Code or claude.ai today. The contract question matters most for: (a) Klatch users who are also Managed Agent developers, and (b) future Klatch-to-Managed-Agent export targets.
4. **No `extensions`-namespace addition is needed for "dreams" specifically** — dreams produce memory stores; only memory stores need representation.

---

## Pass 3: Internal evidence — Klatch's import/export pipeline today

### Import surface

Three importers, located in `packages/server/src/import/`:

| Importer | Source | What it absorbs | What it ignores |
|----------|--------|-----------------|-----------------|
| `parser.ts` (Claude Code JSONL) | `~/.claude/projects/[path]/[session].jsonl` | Conversation transcript, tool-use events, parentUuid tree, compaction | Anything outside the JSONL — including memory-store mounts that produced tool_use events |
| `claude-ai-parser.ts` + `claude-ai-zip.ts` | claude.ai export ZIP | conversations.json transcripts, project_memories, account memories, artifact references | No memory-store concept exists in claude.ai today |
| `klatch-import.ts` | Klatch canonical zip (`klatch.context.v1`) | Full manifest + sidecars (L2/L3/L4) + conversation.jsonl + files | (Bidirectional with own export — no asymmetry) |

**Critical finding:** **No importer touches Anthropic memory store APIs.** None has a code path that fetches a memory store, lists memories, or assembles them into project memory. The conceptual slot exists (project memory at L3), but the wire is absent.

If a Claude Code JSONL captured tool-use events of an agent reading `/mnt/memory/preferences.md`, the JSONL would contain the tool call IDs and the returned content as ordinary `tool_result` events. The CONTENT is in the transcript, but the SOURCE (it came from a memory store, was governed by versioning, can be edited by a workflow) is not preserved.

### Export surface

Three transports, located in `packages/server/src/export/`:

| Transport | Target | Memory-shaped output |
|-----------|--------|----------------------|
| `transport-claude-code.ts` | Claude Code project (CLAUDE.md + MEMORY.md) | YES — directly writes Layer 3 content as MEMORY.md |
| `transport-claude-ai.ts` | claude.ai (memories.json + project conversations) | YES — Phase 3.5 briefing/extraction generates `memories.json` entries |
| `package-builder.ts` (canonical) | `klatch.context.v1` zip | Indirect — `memory_format: "flat"` ships a single MEMORY.md sidecar; `"typed"` reserved for the three-sub-tier evolution |

**No transport targets the Anthropic Managed Agents memory store API today.** Klatch can write Claude Code's MEMORY.md and claude.ai's memories.json — both are file-and-blob shapes that Claude reads via app conventions, not the Memory Stores API.

### The `extensions` namespace pattern (already in place)

`package-builder.ts:184` ships `extensions: { klatch: {} }` on every canonical package. Format spec:

> `extensions` | object | Namespaced project-specific metadata. Key = producer name.

This is **the architectural slot Calliope's Q4 was asking about.** Adding a memory-producer field for "dreams output," "PM filing dreams," or "Klatch L3" doesn't require a format change — it requires a producer to start writing into the namespace and a consumer to start reading. The slot is permissive by design.

### What the 5-layer model already accommodates

| Layer | Klatch role | Anthropic memory-store equivalent |
|-------|-------------|-----------------------------------|
| L1 Kit Briefing | Environment orientation | N/A (Klatch-side) |
| L2 Project Instructions | CLAUDE.md / behavioral rules | Read-only memory store at `/instructions/` (a usage convention) |
| **L3 Project Memory** | **MEMORY.md + referenced files** | **Direct equivalent — a memory store is exactly this shape** |
| L4 Channel Addendum | Per-conversation framing | Per-session `instructions` on the memory_store resource attach |
| L5 Entity Prompt | Agent identity | The agent's `system_prompt` config in Managed Agents |

**L3 is the load-bearing convergence.** Klatch's project memory IS architecturally a memory store. The remaining question is the wire.

### Pass 3 conclusions feeding pass 4

1. Klatch's import pipeline doesn't touch memory stores; **the gap is at the wire level, not the conceptual model.** The conceptual slot exists (L3).
2. Klatch's export pipeline already writes memory-shaped artifacts for Claude Code and claude.ai; **adding a Managed Agents memory-store target is workflow code, not a new format.**
3. The `extensions` namespace already accommodates producer attribution; **no format-version bump is needed for "memory producer" claims.**
4. The conceptual asymmetry is small: Klatch already thinks about memory the way Anthropic now does (markdown-files-in-a-tree, hierarchical, version-tracked). Architectural decisions made in Step 10 Phase 1 (the `memory_format: "flat" → "typed"` evolution path; the `extensions` namespace; the field set Daedalus reserved at spec line 199) **anticipated this convergence with 90% accuracy.** That's the April 12 Janus synthesis paying off.

---

## Pass 4: PM's dreaming model — compatible, distinct, in conflict?

### What PM has (xian-designed, last summer)

Per cross-pollination brief 2026-04-13 + April 12 Janus synthesis:

PM's "dreaming" is **two-typed**:

- **Type 1 — "filing dreams":** consolidation/indexing during quiet hours. Designed (ADR-054 composting pipeline) but not implemented as of April 13. Conceptually equivalent to Anthropic's dreams: consolidation, dedup, reorganization.
- **Type 2 — "anxiety dreams":** the system imagines failure scenarios to prepare ("what if the floor fabricates again?", "what if the briefing is stale when the gate tester arrives?"). Janus's April 12 survey of 20+ external memory systems confirmed: **none implement this risk-simulation pattern.** Genuinely novel to PM.

PM's substrate is the **filesystem + mailbox + omnibus log** governance — typed messages, audit-trailed, append-only institutional memory. Memory lives in markdown files; dreams are processes that operate on those files.

### What Anthropic has (just shipped)

Anthropic's dreams = **PM's Type 1 only.** Read a memory store + sessions → produce a curated memory store. Consolidation, dedup, insight surfacing.

**Anthropic does NOT have an equivalent of PM's Type 2 "anxiety dreams."** No risk simulation, no "imagine the failure mode and prepare for it" pass. This remains PM's distinctive contribution to the design space.

### Compatible / distinct / conflict?

| Dimension | PM | Anthropic | Relationship |
|-----------|-----|-----------|--------------|
| Substrate | Markdown files in repo + mailbox | Markdown files in workspace memory store | **Compatible** (same shape) |
| Producer (Type 1) | Composting pipeline, not yet implemented | Dreams API, shipping as research preview | **Compatible producers, different runtimes** |
| Producer (Type 2) | Anxiety dreams, novel | Not present | **PM-distinctive** |
| Consumer | PM agents read MEMORY.md / mailbox | Managed Agents read `/mnt/memory/` | **Compatible** (both read filesystem-shaped material) |
| Provenance | Implicit via filesystem audit | Explicit via `memory_versions` API | **Compatible**; different surfacing |

**No conflict.** Two producers writing into substantially the same artifact shape, both operating on the consolidation pattern, with PM having additional Type 2 work that Anthropic doesn't.

### What this means for Klatch's contract

If Klatch ever needs to distinguish "this memory entry was written by PM Type 1 vs Anthropic Dreams vs Klatch L3 manual curation vs Klatch validUntil-invalidated entry":

**The provenance chain in `klatch.context.v1` already supports this.** Every export currently records a `provenance` array (`packages/server/src/export/package-builder.ts` lines 49-83) with hop-by-hop attribution. Adding a `memory_producer` field on individual memory entries is one additional discriminator at the entry level — a `memory_format: "typed"` flip would give us the per-entry shape required.

Producer-agnostic-with-provenance is the right posture. Klatch shouldn't need to know which producer wrote a given entry to consume it (the content is text either way). Klatch SHOULD be able to surface producer attribution to the user when reviewing memory ("this was Anthropic-dream-curated; this was your manual edit"). That's a UI affordance, not a contract requirement.

### Pass 4 conclusions feeding pass 5

1. PM and Anthropic dreams are **compatible producers** writing into the same substrate. No format conflict.
2. Klatch's existing provenance chain pattern handles producer-attribution at the package level today.
3. Per-entry producer attribution requires the `memory_format: "typed"` evolution path — already specified, not yet activated.
4. PM's Type 2 (anxiety dreams) is the surviving differentiator; if Klatch ever wants to surface it as a distinct kind of memory entry, the `type` field in the `"typed"` schema is where it lives.

---

## Pass 5: Synthesis — the four answers + decisions needed

### Q1 — Before migration in: what does Klatch absorb?

**Today: nothing memory-store-specific.** No importer touches the Anthropic Memory Stores API. None of Klatch's three importers (Claude Code JSONL, claude.ai ZIP, canonical Klatch zip) has a code path that pulls memory store content.

**The conceptual slot exists** in the 5-layer model (L3 = project memory = a markdown filesystem at the project root). Anthropic's memory store is structurally identical. The wire is missing, not the model.

**No new layer is needed.** The 5-layer model accommodates the artifact shape directly via L3.

**The realistic gap:** If a Klatch user is also a Managed Agent developer who wants to seed a Klatch project from their workspace's memory store, today they would have to manually copy files. A future "import from Anthropic Memory Store" affordance would be a workflow on top of the SDK (list memories, retrieve each, write to project memory directory) — small surface, no contract change required.

### Q2 — During migration: what does Klatch surface to the user?

**Today: nothing, because there's no import path to surface.**

**Future:** if/when a memory-store importer ships, the natural surfacing is to treat it as project memory (L3). A new affordance in the import flow ("import an Anthropic Memory Store as project memory") is a UX question for Iris's Track 2 work.

**No prompt-assembly change needed.** Memory-store-imported content lives at L3 in the existing 5-layer assembly; it gets the same treatment as any other project memory.

**Producer attribution at the UI level** (telling the user "this entry came from a memory store; that one came from your manual edit") is the only meaningful UX surfacing — and only if the user is the kind of developer who cares. Most Klatch users won't. This is a Step 11+ affordance, not a 1.0 requirement.

### Q3 — After migration out: what does Klatch generate?

**Today: Klatch generates memory-shaped artifacts for two of three transports:**

- **Claude Code transport:** writes `CLAUDE.md` (L2) + `MEMORY.md` (L3) directly. These are file-shaped artifacts that Claude Code reads via app conventions; they ARE the source-of-truth memory in that environment. **Klatch already generates "memory" for Claude Code.**
- **claude.ai transport:** Phase 3.5 briefing + extraction generates structured behavioral notes that land as `memories.json` entries. **Klatch already generates memory for claude.ai.**
- **Canonical Klatch zip:** ships `memory_format: "flat"` — a single MEMORY.md sidecar.

**What Klatch does NOT generate today:** Anthropic Managed Agents Memory Store entries via the `memories.create` API. This is a missing transport (`transport-managed-agents.ts` doesn't exist).

**Phase 3.5 is the closest current analog and it's good enough for the consolidation use case.** When Klatch generates field_notes via the auxiliary LLM, those notes ARE consolidation output — a "this is what the agent learned" summary, structured for downstream consumption. Anthropic dreams produces the same shape (curated memory store).

**To support Klatch-to-Managed-Agent export:** add a transport that takes Klatch L3 content + project files and writes them as memory store entries via the `memories.create` API. Each Klatch project file → `memories.create({ path: "/files/" + filename, content })`. Each MEMORY.md entry → `memories.create({ path: "/MEMORY.md", content })`. Optionally also generate field_notes via Phase 3.5 and write them to `/playbooks/` paths (matching the trade-press "playbooks" framing).

**This is workflow code over the SDK, not a contract change.** Estimated scope: parallel to existing transports; a Round-shaped piece of work.

### Q4 — PM's dreaming vs Anthropic's: compatible, distinct, in conflict?

**Compatible.** Both producers write into substantially the same artifact shape (markdown files in a hierarchical namespace). Both operate on the consolidation pattern (PM Type 1 ≅ Anthropic Dreams). PM's Type 2 (anxiety dreams) is novel to PM and not present in Anthropic's offering.

**Klatch's `klatch.context.v1` does NOT need a memory-producer namespace addition for compatibility.** The existing `extensions` namespace pattern already accommodates producer-specific metadata; the existing provenance chain handles package-level attribution.

**Per-entry producer attribution would require the `memory_format: "typed"` evolution flip.** That flip is already designed (spec line 411–417, fields named at line 199); it's an additive non-breaking change. The `source` field on a typed memory entry is the natural slot for "this entry was written by Anthropic Dreams" vs "PM filing dream" vs "Klatch user manual edit."

**Recommended posture: producer-agnostic with provenance attribution.** Klatch consumes memory text without caring about producer; surfaces producer info on-demand for users who want to see it. Same shape as the existing reflection-with-ingress pattern (`klatch-ui` / `mcp` / `import` ingress values on MicroReflection).

### Cross-cutting observation

The April 12 Janus synthesis predicted 90% of Anthropic's design space:

- "Storage technology is irrelevant; write governance is everything" — Anthropic chose markdown filesystem (not vector DB, not graph), validating Lin's framing.
- The April 12 recommendation that Klatch's `valid_from` / `type` / `source` / `trust_level` schema fields anticipate per-entry typed memory — Anthropic's Memory Versions API formalizes the same audit primitives (`content_sha256`, immutable versions, version-level redact).
- Daedalus's Step 10 Phase 1 reservation of `memory_format: "typed"` (spec line 411) — the evolution path is the right shape; activation is just a flip.

**The substantive new requirement from this spike is small:** add a `transport-managed-agents.ts` if/when a real Managed Agents export use case arrives.

---

## Decisions Daedalus + xian need to make

In rough order of timeline:

### Now (no urgency)

**D1 — Posture on memory-store import.** Today: no path. Reasonable options:
  - (a) Wait for a real user who is a Managed Agent developer asking for it. Simplest.
  - (b) Pre-build a one-direction "seed from memory store" helper script (not a full importer) for internal use. ~Day of work.
  - (c) Ignore — Klatch's L3 already accommodates the content; manual copy is fine for the foreseeable user base.

**Recommendation: option (a).** No real driver yet. The format slot is in place; activate the wire when somebody has the use case.

**D2 — Posture on memory-store export (transport-managed-agents.ts).** Today: missing transport. Klatch already exports memory-shaped artifacts for Claude Code and claude.ai; adding a Managed Agents target is symmetric work. Reasonable options:
  - (a) Wait for a real user. Same as D1.
  - (b) Build it as part of Phase 5d (HTTP transport) when that ships, since both target the Managed Agents API surface.
  - (c) Build it now as a polish/closure item on Step 10 transport coverage.

**Recommendation: option (b).** Naturally clusters with Phase 5d's auth/HTTP work.

### Next 1–2 weeks

**D3 — Activate `memory_format: "typed"`?** Already specified (spec line 411–417). Activation requires:
  - Define the typed-entry schema (`type`, `valid_from`, `trust`, `source`, content)
  - Migrate MEMORY.md content from flat to typed (one-time, non-breaking — flat consumers ignore the new fields)
  - Update `package-builder.ts` to emit `"typed"` format
  - Update HTTP routes + MCP server to surface typed entries

This was already on the Step 11 implicit roadmap. The spike confirms there's no reason to do it sooner than Step 11 — but no reason to delay either.

**Recommendation: defer to Step 11 design session.** Bring it in as a scoped sub-task of Step 11, not a separate round.

### Strategic / Step 11 framing

**D4 — Step 11 differentiation positioning.** The 5/11 framing stands and gets sharper:

> Step 11 should NOT compete on "we are an external memory layer for Claude" — Anthropic shipped that natively.
>
> Step 11 should differentiate on **conversation-as-substrate + cross-channel context assembly**: things SDK-level memory can't naturally do.

Concrete differentiators worth owning:

- **Multi-channel synthesis** — pulling a coherent context across many channels with different agents, not just one agent's memory store
- **Reflection-grade temporal validity** — `validUntil` ships in Round 34; Anthropic's memory versions are audit-only, not validity-windowed in the same way
- **Provenance across producers** — Klatch can compose memory from multiple producers (PM, Anthropic, manual) cleanly; native memory stores are workspace-scoped to one producer
- **Fork-don't-sync continuity** — Klatch's import-as-snapshot semantics give the user a recoverable timeline; Anthropic memory mutates in place

**The April 12 Janus synthesis recommendations + Daedalus's Step 10 Phase 1 design choices already position Klatch correctly here.** No re-positioning required; Step 11 design session can lean into existing framing.

### Cross-project alignment

**D5 — Cross-read with Piper Alpha when ready.** Calliope's memo notes Piper Alpha is running the same spike from PM's side. The cross-read will be most useful AFTER both publish: PM's findings on impact to PM's existing architecture will tell us whether the convergence is symmetric (both projects converge on producer-agnostic-with-provenance) or asymmetric (PM has constraints we don't, or vice versa).

**No coordination needed before publication.** Independent reports; cross-read after.

---

## Summary for the executive reader

**The headline:** Anthropic's "Dreaming" doesn't break Klatch's import/export contract. The artifact shape (markdown files in a hierarchical namespace, version-tracked, per-workspace) is structurally identical to Klatch's existing L3 (project memory) — exactly what the April 12 Janus synthesis predicted. The conceptual slot already exists in Klatch's 5-layer model.

**The wire:** missing in two places, both small. (a) An "import from Anthropic Memory Store" workflow if a Klatch-user-who's-also-a-Managed-Agent-developer asks for one. (b) A `transport-managed-agents.ts` parallel to the existing claude-code and claude-ai transports if/when Phase 5d ships HTTP transport.

**The format:** `klatch.context.v1` doesn't need a memory-producer namespace addition. The existing `extensions` pattern handles package-level producer attribution; per-entry producer attribution comes free with the already-specified `memory_format: "typed"` flip (spec line 411–417, fields at line 199).

**The strategic frame:** Step 11 differentiation is unchanged from the 5/11 framing — conversation-as-substrate + cross-channel synthesis, not "external memory layer for Claude." The April 12 Janus synthesis + Daedalus's Step 10 Phase 1 evolution paths already position Klatch correctly.

**The PM angle:** Klatch's current contract is producer-agnostic with provenance attribution. PM's dreaming model (Type 1 filing dreams + Type 2 anxiety dreams) is compatible — Type 1 maps to Anthropic dreams, Type 2 is PM-distinctive and not present in Anthropic's offering. No conflict.

**Five concrete decisions** (D1–D5 above) — none urgent, none blocking. The most actionable single recommendation: defer `memory_format: "typed"` activation to Step 11 design session (D3) where it fits naturally rather than treating it as separate work.



