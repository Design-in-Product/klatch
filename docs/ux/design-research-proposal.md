# Design Research Proposal

**Author:** Iris (UX designer/developer)
**Status:** First pass
**Date:** 2026-04-13
**Scope:** Phase 3 export UI + holistic context visibility

---

## The research question

**How should Klatch make invisible context visible — for humans and for agents?**

Klatch's backend computes a rich model of context: five layers, per-layer fidelity, provenance chains, trust vocabulary, file scoping, compaction state. The UI shows almost none of it. The most significant design challenge for 1.0 is the Phase 3 export UI, but context visibility is a broader concern that affects import, channel settings, onboarding, and the eventual workflow concept.

This proposal structures a research phase to explore the fundamental question before committing to specific UI designs.

---

## Why research before design

The Phase 3 export UI is described by xian as "fluid, supportive, service design-oriented — something with the qualities of an LLM under the hood with the comfort of a UI." That's a high bar and an unusually open brief. The export isn't a configuration screen — it's a service. The moving company metaphor (guide the homeowner through what can and can't be shipped) is the right frame, but nobody has designed a "context moving company" before. This is genuinely novel UX work.

Jumping straight to wireframes risks:
- Designing for the current export endpoint shape rather than for the user's mental model
- Missing the bidirectional opportunity (export preview + import readout as the same view)
- Over-building complexity that the user doesn't need (showing all five layers when three are empty)
- Under-building for power users who want full control

Research gives us the mental models, the failure modes, and the vocabulary to design well on the first pass.

---

## Proposed research activities

### 1. Competitive analysis: context visibility in multi-agent and AI tools

**Question:** How do existing tools surface agent context, and what can we learn?

**Targets:**
- **Labrador** (Erika Flowers) — has a live per-layer sparkline in the product UI. The most direct precedent for what we're building. Convergent architecture independently discovered.
- **Cursor 3** — autonomous agent mode with "Plan → Act → Observe → Correct" loop. How does it surface what the agent knows?
- **LangGraph / LangSmith** — trace visualization for multi-step agent workflows. How do they show context flow across steps?
- **ChatGPT memory settings** — the simplest context-visibility UI in a major product. What do they show, what do they hide?
- **Notion AI / Linear AI** — AI tools that operate on structured data. How do they communicate what the AI has access to?
- **Slack workflow builder** — the closest existing UI for "persistent meeting with phases." What can we learn about representing workflows in a chat-adjacent interface?

**Deliverable:** Annotated screenshots + a synthesis document identifying patterns worth adopting, patterns to avoid, and gaps no existing tool addresses (which is where Klatch's opportunity lives).

**Effort:** 1-2 sessions of focused research.

### 2. Mental model mapping: how xian thinks about context

**Question:** When xian prepares for the weekly ship, what does he think he's doing? What vocabulary does he use? Where does his mental model diverge from the five-layer implementation model?

**Method:** A structured walkthrough of the weekly ship workflow with xian, but focused not on the steps (we've documented those) but on the *mental model*: what does he think the channel "knows"? What does he expect the entities to see? When he pins a file, what does he think happened? When he exports, what does he expect to be in the package?

The goal is to map the gap between the implementation model (five layers, provenance, trust) and the user's mental model (whatever vocabulary xian naturally uses). The UI should bridge to the user's model, not require the user to learn the implementation model.

**Deliverable:** A mental model map showing: user vocabulary → implementation concept → current UI surface (if any) → gap.

**Effort:** 1 session with xian.

### 3. Information hierarchy: what matters most in a context summary

**Question:** If a context summary can only show 3 things, what should they be? 5 things? 10 things?

**Method:** Take a real export manifest from a live channel and progressively reduce the information to see what's essential. Start with the full manifest — everything the format carries. Strip one field at a time. At each step, ask: would the user still understand what's in this package? When the answer becomes "no," the last thing removed is essential.

This produces an information hierarchy that tells us: what's always shown (the sparkline view), what's shown on expand (the detail view), and what's only in the raw manifest (power-user territory). It directly informs the progressive disclosure design for Phase 3.

**Deliverable:** A ranked information hierarchy for the context summary view, with three tiers: always-shown, expand-on-demand, power-user-only.

**Effort:** Can be done solo with the export endpoint data.

### 4. Prototype: the "moving company" export experience

**Question:** What does a service-design-oriented export actually feel like?

**Method:** Before building anything in React, sketch 3-5 different approaches to the export experience:

- **The sparkline approach:** Visual composition bar → tap to drill into any layer → download when satisfied.
- **The conversational approach:** Klatch walks you through the export in a chat-like flow: "I'm packaging this conversation. Here's what I found. Your project instructions are 3,180 chars. Memory is empty — would you like to add context before exporting?"
- **The checklist approach:** Each layer is a checkbox with a summary. Toggle what to include. Simple, direct, less innovative.
- **The timeline approach:** The export is framed as the conversation's life story — born in Code, imported to Klatch, worked on here, now leaving. Provenance is the organizing structure.
- **The dashboard approach:** A panel showing the package contents like a packing list — files, layers, entities, history. Dense but comprehensive.

Each sketch gets tested against:
- The canonical use cases (can I export the weekly ship output?)
- The design principles (who bears the burden? is this a service or a form?)
- The progressive disclosure principle (does it start simple and reveal complexity?)
- The "first export" test (would a new user understand what's happening?)

**Deliverable:** Sketches (hand-drawn or wireframe-quality) for 3-5 approaches, with an evaluation against the tests above. One or two will emerge as the strongest candidates for Phase 3 implementation.

**Effort:** 1-2 sessions, possibly with xian for reaction and selection.

### 5. Bidirectional fidelity view: export and import as the same language

**Question:** Can we design one visual language for context visibility that works for both export preview and import readout?

**Method:** Take the Phase 3 export UI direction (from prototype activity above) and test whether it works in reverse — as a post-import summary. If the export preview shows "L2: project instructions (3,180 chars, full fidelity)" and the import readout shows "L2: project instructions (captured, 3,180 chars)" — is that the same view with different data, or a fundamentally different view?

If it's the same view, we design one component and use it bidirectionally. If it's different, we design two components with a shared visual vocabulary. Either way, the user learns the visual language once.

**Deliverable:** Design recommendation for whether the fidelity view is one component or two, with mockups showing both contexts.

**Effort:** Builds on the prototype activity above. 1 additional session.

---

## What this is NOT

- **Not a full UX redesign.** The evaluation identified problems across 11 areas. This research proposal is focused on the Phase 3 export UI and bidirectional context visibility — the most significant UX challenge. Other issues (accessibility, sidebar IA, entity management) are addressed through the prioritized issues list, not through research.
- **Not "mobile UX" research.** Per xian's design philosophy, there is no separate mobile experience. The research addresses holistic design that adapts to context. Responsive behavior is a lens applied to every design, not a separate deliverable.
- **Not a delay tactic.** Each research activity produces a concrete deliverable. The research phase can run in parallel with Daedalus's Phase 2 work (the export endpoint is already built). The goal is to inform Phase 3 design before it starts, not to postpone it.

---

## Sequencing

| Activity | Dependencies | Effort | Output |
|---|---|---|---|
| 1. Competitive analysis | None | 1-2 sessions solo | Annotated screenshots + synthesis |
| 2. Mental model mapping | xian availability | 1 session with xian | Mental model map |
| 3. Information hierarchy | Export endpoint running | 1 session solo | Ranked info hierarchy |
| 4. Export prototype sketches | Activities 1-3 | 1-2 sessions, xian for review | 3-5 sketches with evaluation |
| 5. Bidirectional fidelity view | Activity 4 | 1 session solo/with xian | Design recommendation + mockups |

Activities 1 and 3 can start immediately (no dependencies). Activity 2 requires xian's time. Activities 4-5 build on the earlier work.

**Total estimated effort:** 5-8 sessions, spread across 1-2 weeks. Some activities can run in parallel.

---

## What success looks like

At the end of this research phase, we have:
- A clear mental model of how the user thinks about context (not how the implementation models it)
- A competitive landscape of how other tools surface agent context (and where none do)
- An information hierarchy for the context summary view (what's always shown vs. progressive reveal)
- 3-5 concrete approaches to the Phase 3 export UI, evaluated against design principles and canonical use cases
- A recommendation for whether the fidelity view is one bidirectional component or two
- Enough specificity that Daedalus can build Phase 3 from the design output without ambiguity

The research doesn't produce a finished design. It produces the inputs a finished design needs.
