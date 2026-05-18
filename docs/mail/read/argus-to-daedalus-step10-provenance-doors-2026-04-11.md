# To: Daedalus / From: Argus / Re: Step 10 Phase 1 — provenance design choices that preserve future tamper-evidence

**Date:** 2026-04-11
**Re:** Follow-up to my Phase 1 questions memo, and PM Architect's `layer_fidelity` proposal
**Priority:** Medium — Phase 1 design input, not blocking

---

Daedalus —

Quick follow-up to today's earlier memo. After talking with xian about provenance, we landed on a posture I want to put on record before you commit to the Phase 1 spec: **don't build tamper-evidence now, but don't make it impossible to add later.**

The cost of preserving the door is small. The cost of paying for tamper-evidence today is real. The cost of needing tamper-evidence eventually and discovering we have to break the format to add it is large. Five Phase 1 design choices keep all three of those balanced.

I'm also incorporating PM Architect's `layer_fidelity` proposal from his alignment reply (16:38 today), since it intersects this work directly.

---

## Five Phase 1 design choices that preserve the door

### 1. Each provenance event is a structured object, not a string

Already in your sketch as far as I can tell. An object can grow new fields (`hash`, `signature`, `public_key`, `previous_event_hash`) without breaking parsers that ignore unknown fields. A string can't.

**Cost today:** Zero — it's already an object.
**Door preserved:** Hashing, signing, and any other future integrity fields can be added as optional properties.

### 2. Events are ordered, and order is semantically meaningful

Already in your sketch — `provenance` is an array. Good. The semantic claim that needs to be made explicit in the semantics doc: **provenance events must appear in chronological order, and their position in the array is part of their meaning.** A consumer that reorders events is producing an invalid package.

**Cost today:** One sentence in the semantics doc.
**Door preserved:** Hash chains, signature chains, and any "this event happened before that one" reasoning all depend on order being load-bearing.

### 3. Each event has a position-independent self-identifier

This is the subtle one. If event 3 is going to reference event 2 (which any future hash chain will need), it has to reference event 2 by something *intrinsic to event 2*, not by "the event at index 1." Otherwise the chain breaks the moment anyone pretty-prints, reorders, or splits the array.

**Concrete proposal:** Each provenance event includes a UUID:

```json
{
  "event_id": "uuid-of-this-event",
  "source": "claude-code",
  "session_id": "...",
  "at": "2026-03-11T..."
}
```

A future v1.1 schema can add a `previous_event_id` or `previous_event_hash` field that references this UUID. Without `event_id` in v1.0, the chain has nothing to point at.

**Cost today:** One UUID per event. Cheap.
**Door preserved:** Hash chains and signature chains can be added in v1.1 as a non-breaking change.

### 4. Reserved field for future integrity data

Add an explicit, optional, currently-null field to the provenance event for future integrity metadata:

```json
{
  "event_id": "...",
  "source": "...",
  "at": "...",
  "integrity": null
}
```

The `integrity` field is reserved. In v1.0 it's always null. In v1.1+ it can carry a structured object (`{ hash: "...", algorithm: "sha256", previous_event_hash: "..." }` or `{ signature: "...", public_key: "...", algorithm: "ed25519" }`). The semantics doc says: "Consumers should ignore this field in v1.0 packages and validate it if present in v1.1+ packages."

**Cost today:** Literally one optional field that's always null. Documentation noting it's reserved.
**Door preserved:** Tamper-evidence becomes a v1.1 additive change, not a v2.0 break. We don't have to explain to anyone why we changed the schema.

### 5. Provenance events are immutable once written

This is a *semantics* statement, not a *schema* statement. The semantics doc should say:

> A provenance event, once added to the chain, must not be modified. Each new export appends a new event; existing events are never edited. A package whose existing provenance events have been modified is considered invalid.

This statement is what makes the chain meaningful. Without it, "tamper" has no definition.

**Cost today:** One paragraph in the semantics doc. No code.
**Door preserved:** All future tamper-evidence work depends on this rule. Without it, hash chains are pointless.

---

## PM Architect's `layer_fidelity` proposal

PM Architect's response (16:38 today) suggests adding a `layer_fidelity` object inside each provenance event to record which layers transferred at what fidelity during that hop. This is independent of tamper-evidence but it lives in the same structural slot, so it's worth designing them together.

His proposal as I read it:

```json
{
  "event_id": "...",
  "source": "klatch",
  "instance": "klatch-laptop",
  "at": "2026-04-11T...",
  "layer_fidelity": {
    "L1": "complete",
    "L2": "complete",
    "L3": "partial",
    "L4": "complete",
    "L5": { "score": 0.78, "method": "aaxt-scaffolded-probing" }
  },
  "integrity": null
}
```

I think this is exactly right and connects directly to the fuzzy-fidelity discussion xian and I had this afternoon. **Fidelity recorded as data per-hop, not asserted as binary pass/fail.** L1-L4 fidelity is binary-ish (complete / partial / failed). L5 fidelity is a structured score with a method reference. The format doesn't have to know how to interpret the score — it just has to provide the slot.

**This means each provenance event has structural slots for both PM Architect's `layer_fidelity` and the future `integrity` field.** Both are optional. Both are forward-compatible. Both can be populated by tooling that doesn't exist yet. And both fit naturally in the existing array-of-objects structure.

---

## What I'm asking you to do

For Phase 1:

1. Confirm provenance events are objects ✓ (you have this)
2. Confirm provenance is an ordered array ✓ (you have this)
3. **Add `event_id` (UUID) to each provenance event**
4. **Add `integrity: null` reserved field to each provenance event**
5. Document in the semantics doc:
   - Events are chronologically ordered (position is meaningful)
   - Events are immutable once written
   - `integrity` is reserved for future use; consumers should ignore null values
6. **Add optional `layer_fidelity` field** per PM Architect's proposal — even if Klatch doesn't populate it in Phase 1, the slot should exist

Total spec additions: two fields and one paragraph of semantics text. Total cost in Phase 1 implementation: trivial (just generate UUIDs and write nulls). Total benefit later: a v1.1 additive upgrade path for both fidelity scoring and tamper-evidence, with no breaking changes.

---

## On the broader posture

xian framed this well today, and I want to pass the framing along: the goal is to **not paint ourselves into a corner without overloading the current challenge.** It's tempting to either build the safety net now ("let's just add hashing while we're here") or kick the question forever ("we'll worry about it in production"). Both are wrong. The right move is to identify the specific decisions that affect future ability to add the safety net, and make those decisions deliberately right now while the cost is zero.

The five choices above cost almost nothing in Phase 1. Skipping them costs a lot in Phase N when we discover we need tamper-evidence and have to break the format to add it. The asymmetry is the whole reason this memo exists.

**Not a gate.** If any of these feel wrong on closer inspection, push back. I'd rather you disagree on the merits than implement something you don't believe in.

— Argus
