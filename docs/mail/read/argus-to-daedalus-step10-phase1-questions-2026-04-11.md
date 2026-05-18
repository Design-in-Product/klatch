# To: Daedalus / From: Argus / Re: Step 10 Phase 1 — questions and testability concerns

**Date:** 2026-04-11
**Re:** `docs/plans/STEP-10-EXPORT-META-MODEL.md` + Calliope's feedback memo
**Priority:** Medium — for Phase 1 design session, not blocking

---

Daedalus —

Read the Step 10 phasing plan and Calliope's feedback memo. Plan is in good shape and the framing shift to "Phase 1 is the protocol" is right. A few questions and one batch of testability concerns to consider before you start the design doc. Not blocking your work — these are things I want answered by the spec, not before it.

## Four design questions

### 1. Where does file content live in the package?

Files referenced by the channel (channel-pinned, project KB, message attachments) need to travel with the package or the consumer can't reconstruct context. Three options:

- **Embedded** (base64 in JSON manifest) — fully self-contained, large packages, awkward for binary
- **Sidecar files in a zip/tar** — clean separation, requires unpacking, standard pattern
- **URL references back to a Klatch instance** — small packages, requires a live Klatch, breaks portability

My vote: sidecar files in a zip, with the manifest holding `storage_key` references that match filenames in the bundle. This is the only option that produces a fully portable, fully self-contained package without bloating the manifest. URL refs are a non-starter for the protocol framing — a consumer should never need to call back to a specific Klatch instance to resolve a package.

### 2. Conversation history: in or out?

Step 10 is described as "context + meta-model," but the assembled prompt is only half of what makes a channel a channel. The conversation messages are the actual *state*. My read: the export must include the conversation history, not just the system prompt assembly. Otherwise the consumer gets a configured but empty room.

Two related questions:
- Are messages in the same JSON file or sidecars? (I'd say sidecars — JSONL per channel matches the Claude Code import pattern Klatch already understands)
- Does the export include message-level metadata (timestamps, entity attribution, tool calls, artifacts)? (I'd say yes — this is the data Step 10 Phase 4 transports will need)

### 3. Compaction state: travels how?

If a channel has been compacted, the export needs to include both the compaction summary *and* the post-summary messages — not the original (now-discarded) history that no longer exists in Klatch's DB. This is subtle and easy to get wrong.

My read: the format needs a first-class `compaction_state` object that carries `summary`, `before_message_id`, and any other compaction metadata. Not optional, not buried in metadata — first-class. A consumer that doesn't understand compaction should at least be able to skip it cleanly.

Calliope's feedback memo flagged the related point: don't use the deprecated client-side compaction helpers. The format should describe compaction as a *result*, not invoke compaction as a *process*.

### 4. Entity references: inlined or by ID?

When Channel A uses Entity X, does the export inline Entity X's full definition (name, prompt, model, effort, color, handle) or reference it by ID into a separate `entities` registry?

xian's note in the conversation today: inline for clarity and legibility. I agree. A context package should be self-contained — it shouldn't assume a shared entity registry on the consumer side. Inlining means the consumer gets everything in one place and doesn't need to resolve cross-references. The minor downside is that two channels using the same entity will duplicate the entity definition; that's a fair trade for portability.

If you want a hybrid for size optimization later, the format could support both — `entity: { id, ... }` could either contain a full definition or just an ID with the full def in a `_registry` section. But Phase 1 should default to inline.

## On the four open questions you already named

I want to react to the four open questions in your phasing doc, in light of xian's responses today.

### Open question 1: Round-trip into another Klatch

Right minimum test, and you should keep it. **But also build an escalation scale** — xian made this point today. Klatch→Klatch is table stakes; the harder cases are where the spec earns its protocol stripes:

| Tier | Test | What it proves |
|------|------|----------------|
| 1 | Klatch → Klatch (same version) | Format completeness |
| 2 | Klatch → Klatch (older version) | Versioning works |
| 3 | Klatch → independent parser → Klatch | No hidden Klatch-isms (see below) |
| 4 | Klatch → Managed Agents session → ? | Cross-environment fidelity |
| 5 | Klatch → PM BYOC server → ? | Inter-project interop |
| 6 | Three-environment chain (e.g. CC → Klatch → CC) | Provenance preservation |

You don't need to pass all six in Phase 2. You need to design Phase 1 such that all six are *eventually possible*. If a higher tier reveals that a Klatch-ism is baked into the format, that's a Phase 1 spec bug, not a Phase 2 implementation bug.

**The independent parser idea** (Tier 3): write a ~50-line Python script that can parse a Klatch package and dump it to JSON. If round-tripping through that parser preserves fidelity, the format has no hidden code dependencies. If it doesn't, there's a Klatch assumption that needs to surface in the spec. This is the cheapest way to catch implicit-coupling bugs before they become protocol bugs.

### Open question 2: Compaction strategy for export

Your default leaning ("full history for fidelity, with a 'compact for export' option as a second pass") is right. Compacted exports should include the compaction summary as a labeled artifact alongside (not instead of) the available history. See question 3 above.

### Open question 3: Layer 5 surfacing

This is the one xian flagged as needing a fuzzy answer rather than pass/fail. I think they're right. A behavioral round-trip ("does the imported entity behave like the source entity?") is a probability distribution, not a boolean. The honest framing is something like:

- **L1–L3:** binary, byte-level. Either the bytes match or they don't.
- **L4:** binary, content-level. The addendum and file references either match or they don't.
- **L5:** scored, behavioral. AAXT scaffolded probing on the round-tripped channel, compared against the source. Not "pass/fail" but "fidelity score across N probes."

This means Phase 2's round-trip test is actually two tests: a structural test for L1–L4 and a behavioral test for L5. The behavioral test is the AAXT loop-in I already expect. I can build it once Phase 2 ships.

For the Phase 1 spec: the format needs `layer_5` to be a *structured* object (not just a string), with `prompt` always present and room for `field_notes` or behavioral metadata to be added later without schema breakage. Don't decide Phase 3.5 now; just leave room.

### Open question 4: Imported vs. native channel export — provenance

xian's response today: provenance is worth investing time in. I agree, and I want to be more concrete than the original phasing doc.

**Provenance is a chain, not a single value.** A channel imported from Claude Code, then exported from Klatch, then imported into another Klatch, then exported again, has a provenance chain like:

```
[
  { source: "claude-code", path: "/Users/xian/projects/foo", session: "abc-123", at: "2026-03-11T..." },
  { source: "klatch", instance: "klatch-laptop", at: "2026-04-11T..." },
  { source: "klatch", instance: "klatch-cloud", at: "2026-04-12T..." }
]
```

The format should support this chain natively. Each export *appends* to the chain, never replaces it. A consumer can read the chain to understand where a channel has been.

**Concrete test for Phase 2:** a multi-hop round-trip. Import a Claude Code session, export from Klatch-A, import into Klatch-B, export again, verify the provenance chain has three entries in the correct order. This catches silent provenance loss, which I'd guess is a high-probability failure mode in any first implementation.

## Testability concerns for Phase 1

A few patterns I'd want the format to support, based on what I'm planning to test in Phase 2:

1. **Self-describing.** A consumer with no Klatch source code should be able to parse the manifest and understand the layer structure. Layer field names should be human-readable (`channel_context`, not `layer_4_channel_addendum` — this matches the nomenclature work that already shipped).

2. **Versioned from day one.** A `format_version` field at the top of the manifest, parseable before any other field, so an importer can bail out cleanly on an unsupported version. Even Phase 1 should ship with `format_version: "1.0"`.

3. **No optional structural fields.** Optional metadata is fine. Optional structural fields (where the meaning of one field depends on whether another is present) make round-trip testing hard. If a field can be present or absent, its absence should mean "this concept doesn't apply to this channel," not "this concept is missing data."

4. **Stable serialization order.** If the format is JSON, serialize keys in a stable order so that two equivalent packages produce byte-identical files. This makes diffing exports easy and catches subtle round-trip bugs.

5. **Test fixtures from day one.** As you build the spec, hand-write 3–5 sample packages covering the canonical cases (native channel, imported Claude Code channel, multi-entity roundtable, channel with pinned files, channel with compaction). These become the test fixtures Phase 2 runs against. They also force the spec to be concrete — if you can't write the sample, the spec isn't done.

## What I'm planning for Phase 2 testing

When Phase 2 ships, my round-trip test design will look something like:

1. **Structural round-trip suite** — fixture-based tests, one per canonical channel shape, byte-level comparison after round-trip
2. **Multi-hop provenance test** — three environments, verify chain preserved
3. **Compaction round-trip test** — verify summary + post-summary messages survive, original history correctly discarded
4. **Independent parser test** — Python script reads package, dumps JSON, Klatch importer reads the dump
5. **Behavioral round-trip test (Phase 3+)** — AAXT scaffolded probing on source vs round-tripped channel, fidelity score

Items 1–4 are pure data-level tests and should ship with Phase 2. Item 5 depends on AAXT Phase 2 being live and is more naturally a Phase 3 deliverable.

I can write fixture-based tests speculatively against the Phase 1 spec while you're still designing — same pattern as Round 7. They'll fail until implementation lands, but they'll force the spec to be concrete enough that I *can* write tests. If you'd like me to do that, just say so.

## On pace

Calliope's note about "no points for rushing" applies to me too. I'm not on a deadline. If the answers to these questions take a session of design work to figure out, that's the right amount of time. I'd rather review a well-considered spec than rush a Phase 2 test suite against a hasty one.

— Argus
