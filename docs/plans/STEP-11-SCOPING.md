# Step 11 — scoping notes (post-Dreaming reframe)

**Author:** Calliope
**Date:** 2026-05-12
**Status:** Draft for xian + Daedalus review. **Not a design doc; not a sprint plan.** Pre-work to inform Step 11 scoping after the Managed Agents "Dreaming" landing on May 6 reframed the competitive position.

---

## Why this doc exists

The ROADMAP entry for Step 11 was authored before Anthropic shipped SDK-level memory tooling. "Search and recall" as a Step 11 framing assumed Klatch's value-add for memory was a layer Anthropic didn't yet provide. After May 6, that assumption no longer holds — and the May 11 cross-pollination brief named the implication directly:

> *"Reframes Step 11 differentiation: don't compete with SDK-level memory primitives; compete on conversation-as-substrate and cross-channel context assembly."*

This doc is a working scope-pass for Step 11 with the new positioning in view. It does **not** propose a final shape; it surfaces what changed, what didn't, and what xian + Daedalus should decide before scoping the actual phases. The April 12 Janus memory-research synthesis and Daedalus's 5/10 MemPalace delta remain the schema references; this is a positioning + scope reframe, not a schema reframe.

---

## What's still true (carry-forward from prior ROADMAP)

1. **FTS5 full-text search across all messages** is still load-bearing. Anthropic's dreaming doesn't replace it; Klatch's value at finding things across all conversations is independent of whether the agent itself has dreaming memory. Different surface.
2. **Cmd+K command palette** is still load-bearing. Quality-of-life layer; orthogonal to memory architecture.
3. **The schema decisions from April 12** (six-tier memory framework, `valid_from`/`type`/`source`/`trust_level` field set on field notes, Phase 3.5 dual-mode bridge) are correct. Daedalus's 5/11 Round 34 (`MicroReflection.validUntil`) was the first concrete step of this; the rest of the typed-memory evolution is still ahead.
4. **`memory_format: "flat"` → `"typed"` evolution path** is documented in `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` line 411–417. Step 11 is the natural time to flip.
5. **Phase 3.5 dual-mode (briefing + extraction)** is a working bridge for transferring behavioral calibration across format boundaries. Theseus's April 27 live run demonstrated cross-validation working as designed.

## What changed on May 6

Anthropic announced **Managed Agents "Dreaming"** at "Code with Claude":
- Self-improving memory for Claude Managed Agents (research preview)
- After each session the agent reviews past sessions for patterns
- Updates a persistent memory store automatically
- Multiagent sessions beta + webhooks support shipped alongside

**The competitive shift:** Klatch can no longer claim "we are the memory layer Claude doesn't have." That layer now exists at the SDK level. The implication is **not** that Klatch's memory work is wasted — Klatch's six-tier framework is more thoughtful than Anthropic's defaults, and the project knowledge accumulated since April is still load-bearing. The implication is that **positioning** must move from primitives to assembly.

## Reframed Step 11 positioning

**Before May 6 (implicit framing):**
*Klatch is an external memory layer for Claude. We persist and structure memories the SDK doesn't.*

**After May 6 (explicit reframe):**
*Klatch is the assembly layer. We organize conversations, projects, entities, files, and memory artifacts (Klatch-native and Anthropic-native) into a context substrate that the SDK doesn't provide and isn't positioned to provide.*

The distinction lives in what the SDK can't naturally do:
- **Cross-channel synthesis** — memory accumulated in one channel becomes legible to another channel in the same project; assembly across conversations, not just within them
- **Conversation-as-substrate** — the conversation is the unit of work, with entities, files, project context, and memory all hung from it; the SDK treats conversation as input to an agent, Klatch treats conversation as the durable record
- **Multi-producer memory** — Klatch's Phase 3.5 field notes, Anthropic's dreaming memories, PM's dreaming model, OpenLaws' future analog — all coexist as memory producers with provenance attribution; Klatch becomes the place where multiple memory producers can be composed
- **Human-in-the-loop curation** — the Phase 3.5 review UI demonstrates this; users curate which memories travel forward, which get rewritten, which get rejected; the SDK assumes the agent's self-update is final

## Pending — the Anthropic memory/dreaming research spike

Filed today (2026-05-12) as a research spike to Argus paralleling PM's
Piper Alpha spike. The spike answers four questions about Klatch's
import/export contract:

1. **Before migration in** — what dreaming state does Klatch's current import pipeline absorb / drop / sidecar?
2. **During migration** — what does Klatch surface to the user about imported dreaming state?
3. **After migration out** — does Klatch generate dreaming-compatible artifacts for the destination environment?
4. **PM's dreaming model vs Anthropic's** — compatible, distinct, or producer-specific? Provenance implications.

**Step 11 should not be scoped until that spike returns.** The architectural-impact findings will shape what Step 11 includes (and what it explicitly defers).

## Proposed Step 11 phasing — for discussion, not commitment

This is one possible scope shape. The Argus spike output and xian's positioning judgment will reshape it.

### Phase A — Search baseline (carry-forward, unchanged)

- FTS5 index across all messages, metadata-aware (project, channel, layer, source filters)
- Search UI with results + snippets + click-to-navigate
- Cmd+K command palette

**Rationale:** orthogonal to dreaming. Ships value independent of the positioning reframe. The "biggest single unlock" framing from the original ROADMAP holds.

### Phase B — Typed memory evolution (carry-forward, sharpened)

- Flip `memory_format` from `"flat"` to `"typed"`
- Field notes carry `type` (fact / decision / preference / episode), `valid_from`, `trust`, `source`
- UI for invalidating reflections (the slot Round 34 created for `validUntil`)
- Migration path for existing flat memories

**Rationale:** Daedalus's 5/11 status pass identified this as Step 11 territory. April 12 synthesis schema. The differentiation reframe doesn't change the schema; it sharpens *why* the schema matters — Klatch's typed memory carries provenance and trust attribution that SDK-level memory may not.

### Phase C — Multi-producer memory composition (new, dreaming-aware)

- Memory entries declare their producer (`klatch.phase35`, `anthropic.dreaming`, `pm.dreaming`, etc.) in provenance
- Import pipeline preserves producer attribution on memory artifacts from upstream environments
- Export pipeline emits producer-aware payloads (Klatch's field notes, Anthropic-compatible memory entries, both)
- Phase 3.5 review UI extends to surface multi-producer agreement/disagreement (analogous to briefing-vs-extraction)

**Rationale:** this is the assembly-layer move. The SDK can't compose multiple producers; Klatch can. This is the work that makes the positioning real rather than rhetorical.

### Phase D — Cross-channel synthesis surface (new, the differentiator)

- "What did I learn across this project this week?" query across channels
- Memory entries in one channel surface as suggested context for new channels in the same project
- Cross-channel composition gesture (per Iris's object model: workflow = parent term, klatch = type-of-workflow)

**Rationale:** this is the load-bearing differentiator. Anthropic's dreaming improves an agent's own memory across its own sessions. Klatch enables a *user's* memory to compose across multiple agents and channels. Different surface; different value.

### Deferred to a later step

- **Workflows** (multi-phase orchestration across entities) — flagged in ROADMAP "Vision" section. Iris's 5/11 object model surfaces workflow as the parent term; this wants its own scoping pass and shouldn't be folded into Step 11.
- **Context reconstruction** (importing the `.claude/` tree, project knowledge files) — flagged in ROADMAP "Vision." High-value but a different shape of work than Step 11.
- **Subagent introspection** — also Vision territory.

These are not Step-11 candidates. Naming them explicitly so they don't get pulled in during scoping discussions.

## Open questions for xian

1. **Positioning approval:** does the "assembly layer" reframe match your read of where Klatch should go, or is there a different framing that better captures the post-Dreaming position? The blog post Calliope is contemplating (the MCP/1.0 beta capstone) would land much harder with the reframe explicit; worth deciding the positioning before publication.
2. **Argus spike sequencing:** the spike is filed but unscheduled. Step 11 scoping should wait for it; do you want to nudge timing, or let Argus self-pace?
3. **Multi-producer support — how strict?** Phase C above implies Klatch can ingest Anthropic dreaming memories and PM dreaming memories as first-class. Is that the right scope, or should Klatch hold strictly to its own field-notes format and translate at the boundary? The April 12 synthesis leaned toward producer-agnostic with provenance; the spike's answer to Q4 will sharpen this.
4. **The "extracted > designed" tension:** this scoping doc is somewhat *designed in advance*. The honest move is probably to wait for the Argus spike and for one or two more dreaming integrations to surface real friction before locking the phasing. The phasing above is a starting frame, not a commitment.

## What this doc is NOT

- A sprint plan (no time estimates, no commitments to dates)
- A design doc (no schema details, no API shapes, no test plan)
- A unilateral Calliope decision (xian + Daedalus + Argus's spike output all reshape this)
- Final (the doc explicitly invites the Argus spike to reshape it)

## What this doc IS

A scoping starting-point that takes the May 6 Dreaming landing seriously, names the positioning reframe explicitly, separates carry-forward from new work, and frames the open questions xian + Daedalus need to answer before scoping Step 11 properly.

---

## References

- `docs/ROADMAP.md` — current Step 11 framing (pre-reframe)
- `docs/briefs/cross-pollination/2026-05-12.md` — Managed Agents Dreaming insight + Argus's strategic framing
- `docs/mail/argus-to-calliope-managed-agents-dreaming-2026-05-11.md` — Argus's strategic framing memo
- `docs/mail/calliope-to-argus-anthropic-memory-dreaming-research-spike-2026-05-12.md` — the spike ask filed today
- `docs/mail/memo-janus-memory-research-synthesis-2026-04-12.md` — April 12 synthesis (the schema reference)
- `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` — `memory_format: "flat" → "typed"` evolution path documented line 411–417
- `docs/plans/STEP-10-PHASE-3.5-BEHAVIORAL-CALIBRATION.md` — the dual-mode bridge that's the model for multi-producer composition
- `docs/ux/object-model.md` — Iris's 5/11 object model; workflow vs klatch distinction relevant to deferred-work scoping
- `docs/research/mempalace-step-11-reference.md` — Argus's 5/10 MemPalace delta on Step 11 readiness
