# Step 10: Export + Meta-Model — Phasing Plan

*Planning document. Authored 2026-04-10 by Daedalus + xian.*
*Status: Phasing agreed. Phase 1 design pending next session.*

---

## Framing

Step 10 is not "write a JSON file." It's about synthesizing the 5-layer model into a portable package that can be unpackaged into any target environment, while honestly grappling with the empirical fidelity gap (L1–L3 transfer at 100%, L4 partial, L5 at 0%).

**Two lenses kept separate by design:**

1. **Package format** — what's *in* an exported context bundle (data structure, file layout, metadata)
2. **Transport** — how the package gets *into* a target environment (file download, MCP, Agent SDK, copy-paste)

Defining the package format first lets multiple transports plug in without one-off "export to X" features.

## Phasing

### Phase 1: Define the canonical package format
- JSON manifest + supporting files (markdown for L2/L3, conversation history, file references)
- Schema doc, sample bundle hand-written, no transport yet
- Smallest thing that proves the meta-model is real
- **Deliverable:** schema doc, sample bundle, brief design rationale

### Phase 2: Bundle export endpoint
- `GET /api/channels/:id/export` returns a zip (or directory tree) of the package
- Includes everything visible in prompt-debug today: kit briefing reverse, project instructions, project memory, channel addendum, file references, conversation history
- **Round-trip test:** import a Klatch bundle into a *different* Klatch instance and verify fidelity
- **Deliverable:** working endpoint, round-trip integration test

### Phase 3: Layer-aware export UI
- Show the user what's being packaged, layer by layer
- Make Layer 5 gap explicit
- Let user edit/augment the package before download
- This is where Tesler's Law shows up — the complexity is irreducible, but we make it navigable
- **Iris collaboration point.** UX of "here's what you're losing" matters more than data structure here.

### Phase 3.5 (possible): Layer 5 field-notes generator
- Use the auxiliary LLM from AAXT to extract behavioral calibration notes from the conversation
- "When asked to do X, this entity tended to Y"
- Surface as a draft the user can edit before export
- Scope carefully — this is the most creative part and the most uncertain
- May warrant its own design discussion before building

### Phase 4: Targeted transports
- Export to Claude Code: structured to drop into a `.claude/` directory + seed first message
- Export to claude.ai: project structure with knowledge files
- Export to Cowork: matching the format Argus researched
- Each is an adapter on top of the canonical package

### Phase 5 (deferred): MCP server
- Klatch as an MCP server that any client can request a context package from
- The "universal context transport" vision item from ROADMAP
- Defer until phases 1–4 prove the format

## Open questions for Phase 1

1. **Does an exported package round-trip into another Klatch?** Simplest correctness test. Forces us to define the format completely.

2. **Compaction strategy for export.** Full history, API-compacted summary, or user choice? Default leaning: full history for fidelity, with a "compact for export" option as a second pass.

3. **Layer 5 surfacing.** Field-notes generator vs. just exposing entity prompts as-written. Affects Phase 3 / 3.5.

4. **Imported vs. native channel export.** Preserve original provenance (cwd, original session ID) or recast as new origin? Fork-don't-sync suggests recast.

## Design principles in play

- **Gall's Law:** Each phase is the smallest working increment. Phase 1 is just a format spec — no behavior changes.
- **Tesler's Law (DP8):** The L5 fidelity gap is irreducible complexity. We grapple with it; the user doesn't have to.
- **Fork-don't-sync:** Exported packages are snapshots, not live mirrors.
- **No points for rushing.** This is valuable work worth taking time to get right.

## Next steps

- Phase 1 design doc next session
- Iris loop-in at Phase 3 planning (sooner if her discovery surfaces relevant findings)
- Argus loop-in for Phase 2 round-trip test design
