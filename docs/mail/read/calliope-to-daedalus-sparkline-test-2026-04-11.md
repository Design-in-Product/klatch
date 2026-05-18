# To: Daedalus / From: xian (with Calliope) / Re: Phase 1 design test — "what would a sparkline of this look like?"

**Date:** 2026-04-11
**Priority:** Time-sensitive — for the round 3 schema revision
**Re:** `docs/plans/STEP-10-EXPORT-META-MODEL.md`, schema sketch in `docs/logs/2026-04-11-1610-daedalus-opus-log.md`
**Related:** `docs/mail/memo-janus-to-calliope-labrador-research-2026-04-11.md`

---

Daedalus —

A late-arriving design test for Phase 1, surfaced by Janus's research into a project called Labrador. This is a small ask but the timing matters because round 3 of your async exchange with PM Architect will probably be the round that commits the schema.

## The convergence

Janus filed a research memo today on Labrador, a self-hosted AI Command Center built by Erika Flowers. Without coordination between the two projects, Labrador and Klatch arrived at structurally identical context architectures: layered prompt assembly, named agents, persistent memory, channel-specific overlays, project knowledge bases. The metaphors differ ("typed cells", "cartridges") but the load-bearing concepts map one-to-one onto Klatch's five layers and entity model. The full table is in Janus's memo — eight rows of equivalents.

This is independent validation of the architecture you're formalizing into a protocol. Two solo builders, no contact, same answers. The model isn't a Klatch idiosyncrasy.

## The thing Labrador has that Klatch doesn't (yet)

**The context sparkline.** Every Labrador response shows a colored bar in the chat UI revealing which sources contributed to the assembled context — identity, memories, knowledge, cartridges, documents, conversation history. The sparkline is expandable to per-source token counts and details. Composition is **visible at inference time, in the product itself**.

Klatch surfaces prompt composition three ways today: PROMPT-ASSEMBLY.md as canonical spec, session logs after the fact, and the AAXT prompt-debug endpoint for testing. All three are post-hoc or theoretical. Labrador's sparkline is live and in-product. It's the single feature that struck Janus hardest in the research.

Klatch may eventually want a sparkline of its own — that's a Phase 3 / future-Iris-collaboration question, not a Phase 1 question. **But the format you commit in Phase 1 either makes a sparkline possible or doesn't.** That makes "could a consumer build a sparkline from this manifest?" a useful test for whether the format is structured correctly.

## The test, concretely

Run your round 2 schema sketch through this question:

> Could a consumer parse this manifest and produce a per-layer breakdown — name of layer, name of contributing sources, token counts, a stable ordering — without re-deriving anything from prose, without parsing markdown, and without round-tripping through Klatch source code?

If the answer is yes for all five layers, the format is right. If the answer is no for any layer, that's where the format needs sharpening.

Going through your round 2 sketch with this lens, I see most of what's needed already there:

- **L1 (kit briefing):** Out of scope by your design — destination-generated, not carried. Sparkline test passes vacuously: the consumer wouldn't render this slot from the package because the package doesn't claim it.
- **L2 (project instructions):** `instructions: { ref, length_chars }` — `length_chars` is the token-count proxy (or the precursor to one). A consumer can render "Project Instructions: ~1,234 chars from layer_2_instructions.md." Passes.
- **L3 (project memory + KB files):** `memory: { ref, length_chars }` plus `knowledge_base_file_ids` array. The memory passes. The KB files need a small refinement — see below.
- **L4 (channel context + pinned files):** Same shape as L3, same passes-with-refinement.
- **L5 (entities):** `entities[].prompt` is inlined text. A consumer can render "Daedalus (Opus, high effort): ~XXX chars" but only if it's willing to count chars itself, since the schema doesn't carry a length. Worth adding `prompt_length_chars` for parity with L2/L3/L4.

## Two small refinements that would make the test pass cleanly

### Refinement 1: KB and pinned file enumeration via the `files` array

Your round 2 sketch references files by id (`knowledge_base_file_ids: ["f1", "f2"]`) and resolves them via the top-level `files[]` array. That's correct architecturally — it avoids duplication. But the `files[]` entries don't currently carry a content length, so a consumer rendering a sparkline would have to parse each file to count its tokens.

Add `length_chars` (or `size_bytes` plus a noted token-estimation rule) to each `files[]` entry. You already have `size_bytes` in the round 2 sketch — that may be sufficient if the protocol documents an estimation rule, or you can add `length_chars` alongside it. Either way, the consumer should be able to render "ROADMAP.md: ~4,321 bytes" without opening the file.

### Refinement 2: Entity prompt length

Add `prompt_length_chars` to each entity entry alongside `prompt`. Same logic as L2/L3/L4. The consumer doesn't have to count.

## What this is not

This is not a request to build a sparkline. Building it is downstream Phase 3 work and an Iris collaboration. It's not even a request to commit to ever building one.

This is a request to ensure the **format does not foreclose the possibility**. A consumer that wants to render a per-layer breakdown should be able to do so from the manifest alone, in a single pass, without parsing markdown content or counting tokens itself. That's a low bar but it's load-bearing — it's the same bar that ensures any future per-layer view (sparkline, debug panel, export preview, audit log) can be built without a format change.

Janus's framing: **"if the package can't be rendered as a per-layer breakdown with token counts, the format probably isn't quite right yet."** I think the round 2 sketch is 90% there. The two refinements above close the remaining 10%.

## Connection to the round 3 conversation with PM Architect

Worth raising this with PM Architect in round 3 too. The principle generalizes: any consumer that wants to render the contents of a Klatch or PM package as a per-source breakdown should be able to do so from the manifest. PM's `extensions` field will need its own length conventions if PM intends to surface those sources in any UI. Architect will probably have opinions.

You might add a sentence to the round 3 memo along the lines of: *"Independent validation arrived this afternoon — a project called Labrador, built without contact with Klatch or PM, has converged on essentially the same architecture and surfaces it via a per-layer 'context sparkline' in their UI. The principle that any consumer should be able to render a per-source breakdown from a package manifest without re-parsing content seems load-bearing enough to bake into v1.0 of the format. Adding length fields to file entries and entity prompts is the small change that makes this work."*

That's my suggested framing; use whatever wording feels right.

## On pace

Same as before. This is a refinement, not a blocker. If round 3 lands without these two additions, we can iterate in round 4. But they're small enough and well-grounded enough that adding them to the round 3 sketch is probably the cleanest path. Whatever rhythm works for you.

— xian (with Calliope)
