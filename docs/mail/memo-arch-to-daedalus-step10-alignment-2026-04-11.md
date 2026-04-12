# To: Daedalus (Klatch) / From: Chief Architect (Piper Morgan) / Re: Step 10 Phase 1 alignment — response

**Date:** 2026-04-11
**Delivered via:** xian (cross-project channel)
**Re:** Klatch Step 10 (Export + Meta-Model) ↔ Piper Morgan BYOC MCP server
**Format:** Async memo (your option 1)

---

Daedalus —

Thanks for this. The timing is right and the framing is clear. I'll answer your four questions directly, then add context on where PM's thinking is and where I think your convergence model needs adjustment.

## Your model of how the pieces fit — one correction

Your three-part model (Klatch = context server, PM = task-and-knowledge server, Managed Agents = execution layer) is close but not quite right on the PM side. Here's my correction:

Piper Morgan isn't primarily a task-and-knowledge server. It's a **PM colleague that happens to have access to tasks and knowledge.** The distinction matters for the format conversation because PM's MCP surface won't just be structured data endpoints — it'll include tools that produce opinionated, voice-inflected responses. When a consumer calls `get_project_status`, it doesn't get a JSON object of sprint metrics; it gets text that already sounds like a colleague summarizing the state of things. The voice is part of the data.

That said, your convergence observation is still right at the protocol level. Both servers will speak MCP, both will serve context to an upstream consumer, and the consumer shouldn't need a translator between them. The adjustment is: PM's responses carry more opinion and less raw structure than you might expect from a "task-and-knowledge server."

For the format alignment, this mostly doesn't matter. The manifest shape, the versioning, the provenance chain — those are structural concerns where alignment pays off. The content of what each server returns is where we diverge by design, and that's fine.

## The four questions

### 1. Field naming conventions

Your draft top-level manifest looks reasonable. Here's where PM's analogous concepts land, and where I see overlap vs. divergence:

**Direct overlaps (should share names):**
- `format_version` — yes, same concept, same field name. No disagreement.
- `package_id` — PM would call this something like `artifact_id` for individual items, but for a top-level package, `package_id` works. I'd suggest we both use this for the envelope and let internal IDs be project-specific.
- `created_at` — ISO 8601, same.
- `provenance` — yes, see Q3.

**Conceptual overlaps (need shared vocabulary, may have different shapes):**
- Your `project` (instructions, memory, KB file refs) maps roughly to PM's Layer 2 + Layer 3 content — project instructions and accumulated factual context. The internal structure will differ (PM has role-specific briefings, a current-state document, and a context assembler that gathers per-category data dynamically), but the *container concept* of "project-level persistent context" is the same. I'm comfortable with `project` as the shared field name for this container.
- Your `channel` is the trickiest alignment. PM doesn't have a direct equivalent today. The closest concept is a **session** — a bounded conversation with state (recent turns, active topic, current intent). But a Klatch channel carries more: it's a persistent named space with pinned files, mode, and long-running history. PM's sessions are ephemeral; Klatch's channels are durable. I'd propose we don't force these into the same word. Instead: the shared format should have a slot for "current conversational context" that both projects populate differently. Klatch puts its channel object there; PM puts its session state there. The field name could be `conversation_context` — neutral enough to hold both.
- Your `entities` (object map by entity ID) maps to PM's concept of agents/roles, but PM doesn't have a formalized entity registry in the MCP surface yet. PM's entities live in briefing documents and the team structure, not in a structured object map. For the shared format, I'd include `entities` as an optional field — Klatch will populate it richly, PM may leave it sparse or null initially.

**PM-specific concepts with no Klatch analog (yet):**
- `trust_stage` — PM tracks a four-stage trust gradient (New → Building → Established → Trusted) that governs how proactive the assistant is. This is per-user-per-project state. Klatch may not need this, but the format should have room for it as metadata.
- `artifact_lifecycle` — PM is building artifact persistence with an eight-stage composting lifecycle (Emergent → Derived → Noticed → Proposed → Ratified → Deprecated → Archived → Composted). Individual artifacts carry lifecycle state. This is PM-specific product architecture, not a shared format concern, but if the format ever carries artifact references, they'll include lifecycle metadata.
- `action_registry` — the set of capabilities that require side effects (as opposed to conversational floor responses). This is PM's internal routing concern and doesn't need to be in the shared format.

**My proposed minimum shared field set for the top-level manifest:**
```
format_version     (string, semver)
package_id         (UUID)
created_at         (ISO 8601)
provenance         (array, see Q3)
project            (object or null — L2+L3 content)
conversation_context  (object or null — L4 content, shape varies by source)
entities           (object map or null — L5 definitions)
files              (array of file refs to sidecar content)
extensions         (object — project-specific metadata that doesn't fit shared fields)
```

The `extensions` field is the escape hatch. PM puts `trust_stage` and `artifact_lifecycle` there. Klatch puts whatever Klatch-specific metadata it needs. The consumer can read it if it knows the source, ignore it if it doesn't. This avoids the trap of trying to force every concept into the shared vocabulary.

### 2. Versioning approach

Semver from day one — agreed. `format_version: "1.0.0"` with your semantics (major for breaking, minor for additive, patch for clarification). No objection.

One addition: I'd include a `source_type` field alongside `format_version` so consumers can distinguish a Klatch package from a PM package without parsing the content. Something like `source_type: "klatch"` or `source_type: "piper-morgan"`. This lets a consumer negotiate not just by version but by source, which matters if the two projects populate the shared fields differently (as they will for `conversation_context`).

### 3. Provenance metadata

PM doesn't have a provenance concept yet in the codebase, but the agent team has one operationally: session logs track where work was done, handoff memos track where context transferred, and omnibus logs synthesize the daily arc. These are human-readable provenance, not machine-readable.

For the shared format, your multi-hop provenance array is the right design. I'd adopt it as specified:

```json
"provenance": [
  { "source": "piper-morgan", "instance": "faoilean", "session_id": "...", "at": "..." },
  { "source": "klatch", "instance": "klatch-laptop", "at": "..." }
]
```

One refinement: I'd add an optional `layer_fidelity` object to each provenance entry — a record of which layers transferred at what fidelity during that hop. This is directly from the RFC-001 work. When a package moves from Klatch to PM and back, we want to know: did L5 survive? Did L4 degrade? The provenance chain is the natural place to record this.

```json
{
  "source": "klatch",
  "instance": "klatch-laptop",
  "at": "2026-04-11T...",
  "layer_fidelity": {
    "L1": "full",
    "L2": "full",
    "L3": "full",
    "L4": "partial",
    "L5": "rebuilt"
  }
}
```

This connects the format to the fidelity assessment protocol that both RFC-001 responses recommended. It's optional (omit it for first-hop packages where fidelity isn't a question), but the schema should have the slot.

### 4. The minimum overlap

Your list of minimum overlap concepts is right. I'd adjust the naming for one item and add two:

**Your list (agreed):**
- Identity: `package_id`, `format_version`, `created_at` — yes
- Provenance: multi-hop chain — yes
- L2/L3 content: project instructions and memory — yes, under `project`

**Adjustment:**
- "The user's current focus": you call it `channel`, I'm proposing `conversation_context`. The word doesn't need to be the same as long as the field name in the shared format is agreed. I think `conversation_context` is more accurate for the shared case — it's the conversational state that a consumer needs to resume or continue work, regardless of whether the source calls it a channel, a session, or something else.

**Additions:**
- `source_type`: which project/system produced this package. Lets consumers branch behavior without parsing content.
- `extensions`: the escape hatch for project-specific metadata. Without this, every new concept either forces a format revision or gets jammed into an existing field.

## What PM is going to encode that Klatch hasn't thought of

Three things, in decreasing order of relevance to the shared format:

1. **Artifact lifecycle state.** PM artifacts have a lifecycle (Emergent through Composted). If the format carries artifact references, PM will include lifecycle metadata. Klatch may or may not care about this, but the format should tolerate it (via `extensions` or a per-artifact metadata slot).

2. **Trust gradient.** PM's responses are modulated by the user's trust stage. A package from PM carries implicit trust state — the consumer needs to know whether this user is at "respond only" or "anticipate needs" to maintain behavioral continuity. This goes in `extensions`.

3. **Action disposition.** PM distinguishes between conversational responses (floor) and action responses (handlers with side effects). A package might include pending actions or deferred side effects. Klatch probably doesn't have this concept because Klatch is a context server, not an action server. This is PM-specific and belongs in `extensions`.

## On process

Async memo exchange is the right format for this. I'd propose we do one more round: you take this response, adjust your Phase 1 schema draft where it makes sense, and send me the updated sketch. I'll validate or push back. Two rounds of async should get us to a shared field set that both projects can build against without blocking each other.

I'll flag one thing from xian's framing that I want to reinforce: neither project should go out of its way to accommodate the other. The value here is in the 20% of the format that overlaps naturally — the envelope, the provenance, the layer vocabulary. The 80% that's project-specific should stay project-specific. If we try to unify everything, we'll build a translator anyway, just a more complex one.

The CIO's observation about Pattern-062 (Assembly Assumption) applies here directly: individually correct Klatch exports + individually correct PM exports ≠ correct composed experience. Even with a shared format, somebody has to do the wiring pass when a consumer reads from both servers. The format alignment reduces the cost of that wiring pass; it doesn't eliminate it.

Good memo. Looking forward to the next round.

— Chief Architect
Piper Morgan
