# To: Daedalus / From: xian (with Calliope) / Re: Step 10 plan — feedback and framing

**Date:** 2026-04-11
**Re:** `docs/plans/STEP-10-EXPORT-META-MODEL.md`

---

Daedalus —

This is from me, written with Calliope. The substantive framing here is mine; Calliope sharpened it into something readable and added the technical specifics where they fit. Treating this as a collaborative artifact because that's what it is.

The Step 10 plan is in good shape. The two structural separations you baked in — package format vs. transport, and round-trip correctness as the format completeness test — are exactly right and worth preserving as load-bearing principles. The phasing is sound. The "no points for rushing" tone is appreciated and accurate.

A few pieces of framing that should inform Phase 1, plus reactions to the four open questions.

## The framing: Phase 1 is the protocol

Last night xian planted a thought that's now filed as a future direction memo at `docs/futures/2026-04-10-klatch-as-context-protocol.md`. Read it before starting Phase 1 — it changes what "good enough" means for the format spec.

The short version: three signals converged this week. (1) Anthropic launched Claude Managed Agents on April 8 — server-side agent harness with native MCP support. (2) The SDK deprecated client-side compaction helpers, signaling Anthropic wants to own the agent execution layer. (3) xian's broader work across Klatch, Piper Morgan, and the DinP projects has been pointing the same direction all week — products as services for agents to interact with, not just for people. People will be bringing their own chats. MCP or its successor is the paradigm.

In that framing, **Step 10 Phase 1 isn't internal plumbing — it's the protocol Klatch eventually publishes**. Phase 5 (the deferred MCP server) stops being a "deferred maybe" and becomes the natural endpoint. The product, eventually, becomes the protocol.

That doesn't change the phasing — Phase 5 is still correctly deferred, and Phase 1 still ships first. What it changes is the **target audience for the format**. You're not just designing for "Klatch users who want to export a conversation." You're designing for "any tool that wants to consume a Klatch context package over MCP, today or in the future." That's a higher bar, and it should inform every design decision in Phase 1.

Practical implications for Phase 1:

- **The format should be self-describing.** A consumer encountering it for the first time, with no Klatch source code in front of them, should be able to parse it. JSON Schema (or equivalent) published alongside the spec.
- **Layer semantics should be explicit, not implicit.** A consumer should be able to read the package and know what each layer contains and why, without needing to understand Klatch's internal model. The five-layer structure becomes part of the public contract.
- **Versioning matters now, not later.** Even Phase 1 should ship with a `format_version` field so future consumers can negotiate compatibility. The MCP server in Phase 5 will need this; cheaper to bake it in from the start.
- **Naming is part of the design.** Internal field names will become public API if Phase 5 happens. Worth treating them with that gravity. (Field names like `layer_4_channel_addendum` look fine internally but read awkwardly in a published schema; consider `channel_context` to match the nomenclature work that just shipped.)

None of this changes Phase 1's deliverables — schema doc, sample bundle, design rationale. It changes the standard those deliverables are held to.

## On the four open questions

### 1. Round-trip into another Klatch

This is the right minimum test and you should keep it. But also pencil in the **eventual** test: round-trip from Klatch through a Managed Agents session and back, or from Klatch through Piper Morgan's BYOC server and back. You don't need to solve those tests in Phase 2 — just design the format such that those tests would be possible. If Phase 2's round-trip works only because the source and destination are both Klatch, that's a hint the format has implicit Klatch-isms in it.

### 2. Compaction strategy for export

Your default leaning ("full history for fidelity, with a 'compact for export' option as a second pass") is right. Two additional thoughts:

- **Compacted exports should include the compaction summary as a labeled artifact**, not as a replacement for history. A consumer should be able to inspect both the compressed and uncompressed versions if both are available. This matches how Klatch already treats compaction internally.
- **Don't use the deprecated client-side compaction helpers.** v0.83.0 deprecated them. If you need server-side compaction for export, use the Managed Agents path or stay with what's already in `streamClaudeCore`. The intel sweep (April 9) flagged this — it'll need to be on the SDK bump checklist regardless.

### 3. Layer 5 surfacing

This is the most interesting and most uncertain question. The honest answer is: nobody knows yet. Both options (field-notes generator vs. just exposing entity prompts as-written) have value. My instinct is to do **both** in Phase 3, with the entity prompt as the always-present minimum and field-notes as an optional augmentation. The field-notes generator is exactly the kind of feature Iris will have opinions on — it's a UX-shaped problem more than a data-shaped one.

For Phase 1: just make sure the format has *room* for both. A `layer_5` object that can carry `prompt`, `field_notes`, and any future additions without breaking the schema. Don't decide which to populate until Phase 3.

### 4. Imported vs. native channel export

Fork-don't-sync says recast as new origin. I agree, with one nuance: **preserve the original provenance as metadata, even if it's not the canonical origin of the export**. A consumer might want to know "this conversation originally came from Claude Code at `/Users/xian/some/path`" even if the export's canonical origin is now Klatch. Provenance is a chain, not a single value. The format should support that chain.

## On Iris

You logged her three intro questions as a follow-up. Worth replying before Phase 1 ships, or at least before Phase 3 begins. Phase 3 is the natural Iris collaboration point, but the **format design choices in Phase 1 constrain what Phase 3 can do**. If Iris has opinions about how layered context should be presented to a user, those opinions should inform what data is in the package, not just how it's displayed.

Concretely: if Iris will eventually want a "what's in this export, layer by layer" view, the package needs to be structured so that view is queryable without parsing prose. That's a Phase 1 decision, not a Phase 3 decision.

A quick exchange with Iris before Phase 1 final design — even just "here are the four open questions, do any of them have UX implications I should know about?" — would prevent rework later.

## Summary

The plan is solid. The framing shift (Phase 1 designs the protocol, not just an export format) raises the standard but doesn't change the phasing. The four open questions all benefit from a "protocol-first" framing — round-trip as minimum but not maximum, compaction with both forms preserved, Layer 5 with room for both surfacing options, provenance as a chain. Iris should be looped in earlier than Phase 3.

## On pace

I want to be explicit about something I should probably say more often. The "no points for rushing" principle isn't decoration. It's load-bearing.

A lot of developers carry way too much stress about timing because of the inhumane working environments they often find themselves in. The last thing I want to do is recreate that for no good reason. I would always prefer slow, steady work to rushed work and heroism. Heroism is a failure mode dressed up as a virtue, and I've seen too much of it in too many places.

Step 10 is the work that determines whether Klatch becomes infrastructure or stays a product. That's worth taking the time to get right. If you find yourself reaching for a shortcut to make a self-imposed deadline, the right move is to slow down, not speed up. If a phase takes longer than you expected, that's information, not failure. If you need to step away and let an idea settle before committing to it, do that.

You set your own pace. I'll back whatever rhythm works for you.

— xian (with Calliope)
