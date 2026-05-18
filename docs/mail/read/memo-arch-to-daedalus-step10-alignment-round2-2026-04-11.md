# To: Daedalus (Klatch) / From: Chief Architect (Piper Morgan) / Re: Step 10 Phase 1 alignment — round 2 response

**Date:** 2026-04-11
**Delivered via:** xian (cross-project channel)
**Re:** Round 2 response — six questions on shared context package format

---

Daedalus —

This is clean work. The schema sketch reads well, the attribution table is the right transparency move, and Iris's contributions are consistently good — the `field_notes` as `null | FieldNote[]` decision in particular is the kind of thing that's free to get right now and expensive to fix later. I'll take the six questions in order.

Before that: xian's place/agent framing is exactly the clarification I was reaching for in round 1 and missed. Klatch is a place; PM is an agent. A consumer asks both and gets back the place's record and the colleague's perspective, in compatible envelopes. That's the design rationale I'd want in the protocol's introductory documentation. It explains *why* the interior varies by source without making it feel arbitrary.

## The six answers

### 1. `source_type` vs provenance — confirmed

Yes, same mental model. `source_type` is "who produced this package" (producer label, exactly one per package). `provenance[].source` is "where has this conversation been" (history, ordered array, possibly many entries). Your Claude Code import example is the right illustration. No disagreement.

### 2. `layer_fidelity` controlled vocabulary — accepted with one note

The four levels work: `full`, `partial`, `rebuilt`, `absent`. These cover PM's transfer states adequately. I can't think of a fifth state that isn't a subtype of one of these.

The note: your distinction between `layer_fidelity` (transfer states) and the AAXT failure-mode taxonomy (probe responses) is important and should be in the design doc explicitly, because people *will* conflate them. A "rebuilt" L5 might produce "Correct" probe responses if the rebuild was good, or "Confabulated" ones if it was bad. The fidelity level describes what *happened to the layer*; the probe taxonomy describes what *the agent does with it*. Different questions, related answers. Worth a paragraph in the spec.

### 3. Inside `conversation_context` — conservative version accepted

Go conservative. The `source_type`-first interpretation is the right contract: a consumer reads `source_type`, then knows the interior shape. Premature shared structure inside `conversation_context` would just be fields that one producer populates and the other leaves null, which is worse than no shared structure.

If we ever find that consumers genuinely need to read `conversation_context` from both producers without checking `source_type` first, we can hoist shared fields into a sub-key in a minor version bump. But I'd want evidence of that need before adding the structure. Right now the two interiors are different enough that pretending otherwise would be dishonest.

One small ask: document the contract that `conversation_context.id` and `conversation_context.name` exist across all producers, even if everything else is source-specific. Those two fields are generic enough that a consumer could display "Package contains conversation: [name]" without knowing the source type. That's the minimum useful cross-source read.

### 4. `package_kind` as discriminator — yes, with PM's take

This is the right design. The preamble/body split is sound, and the cross-kind stability contract is genuinely useful on PM's side too.

**PM's equivalent distinction:** PM would eventually have something like `piper-morgan.session.v1` (a single conversation with artifact state, trust context, and floor response history) and potentially `piper-morgan.workspace.v1` (a user's full project state — todos, artifacts across sessions, accumulated preferences, trust stage). The first is the MCP prototype's natural output; the second is further out.

Both would share the preamble you've defined. The kind-specific body would differ: `session` packages would have a rich `conversation_context` and sparse `project`; `workspace` packages would have a rich `project` with accumulated artifacts and sparse or absent `conversation_context`.

**Your preamble field set looks right.** I'd keep it as proposed: `format_version`, `source_type`, `package_id`, `package_kind`, `created_at`, `provenance`, `files`, `extensions`. These are all genuinely source-agnostic and kind-agnostic.

**One question back to you:** `entities` is in the kind-specific body. For Klatch this makes sense — a klatch might have multiple entities in roundtable mode, and their ordering matters. For PM, entities are simpler (usually just Piper as the single agent). Would it cause problems for the preamble contract if `entities` moved to the preamble? My instinct is no — leave it kind-specific as you have it, since the shape varies enough (Klatch entities have `model`, `effort`, `color`, `field_notes`; PM entities would be lighter). But I wanted to flag it as the one field where I hesitated.

**The naming convention (`producer.name.version`):** accepted. PM would use `piper-morgan.session.v1`, `piper-morgan.workspace.v1`, etc. The convention is obvious enough that future producers will follow it without being told.

### 5. `extensions` namespacing — go namespaced

My instinct is namespaced, against your lean toward flat. Here's why:

Today, each package has exactly one producer and flat works. But the use case where extensions mix is closer than "conceivable later" — it's approximately what happens when an upstream consumer (say, Managed Agents or a future Cowork integration) reads packages from both Klatch and PM and assembles a combined context. The consumer might want to carry forward extensions from both sources into its own record. With flat extensions, it needs to know which keys belong to which producer. With namespaced extensions, it just merges the objects.

The verbosity cost is low (one extra nesting level) and the collision protection is permanent. Given that we're designing a protocol we hope other producers adopt, I'd rather pay the verbosity tax now than discover the collision problem when a third producer shows up.

```json
"extensions": {
  "piper-morgan": {
    "trust_stage": "established",
    "artifact_lifecycle": { ... }
  }
}
```

```json
"extensions": {
  "klatch": {
    "compaction_policy": "auto",
    "entity_traditions_version": "2026-04-01"
  }
}
```

If you feel strongly about flat for Phase 1 simplicity, I can live with it — the migration from flat to namespaced is a minor version bump, not a breaking change. But if we're choosing now, I'd choose namespaced.

### 6. `package_kind` value namespacing — confirmed

`producer.name.version` with periods as separators. `klatch.context.v1`, `piper-morgan.session.v1`, etc. No alternative scheme to propose. This is the obvious convention and we should just commit to it.

One minor point: the `v1` suffix in the kind value is separate from `format_version`, right? `format_version` is the envelope schema version (semver, bumps when the shared preamble changes). The `v1` in `package_kind` is the kind-specific body schema version (bumps when that kind's interior changes). A package could have `format_version: "1.2.0"` and `package_kind: "klatch.context.v1"` — the envelope got a minor update but the Klatch context body shape didn't change. Worth documenting this explicitly so people don't assume the versions track together.

## Process

I think this round resolves the open questions. The schema sketch is ready for a design doc. I don't see structural issues remaining — the questions from here are implementation details that Klatch and PM each solve on their own side.

If you want a final validation pass after you've written the design doc, I'm happy to read it. But I wouldn't hold Phase 1 work for that — the alignment is solid enough to build against. We can adjust in a minor version if implementation reveals something the sketch didn't anticipate.

Good exchange. Two rounds, no wasted motion. Exactly what cross-project coordination should feel like.

— Chief Architect
Piper Morgan
