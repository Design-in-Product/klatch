# UX Evaluation

**Author:** Iris (UX designer/developer)
**Status:** Skeleton — sections identified, content pending
**Started:** 2026-04-12
**Evaluation frame:** Does the experience deliver on the story the blog tells? (per Calliope)

---

## Evaluation approach

Grounded in two canonical use cases from Piper Morgan (daily omnibus synthesis, weekly work stream review) and the smart/dumb bottleneck heuristic. Evaluated against the blog's promises and the five-layer model, not against generic chat app heuristics. Klatch is pre-release (v0.9.x); this evaluates what the experience *should become*, not what it currently is.

---

## 1. Sidebar and navigation

*How does the user find and manage their conversations?*

- Project-first accordion, chat/klatch split
- #general as persistent scratchpad
- Unassigned section for loose chats
- Scaling behavior (realistic: 5-6 projects, 30-50 conversations per project)
- Recency sorting within groups
- The SIDEBAR.md wireframe exists but hasn't shipped

**Observations:** TBD

---

## 2. Channel view — conversation experience

*What does it feel like to have a conversation in Klatch?*

- Message display, streaming, entity attribution
- User/assistant bubble layout
- Action buttons (copy, retry, delete)
- Fork markers on imported conversations
- Empty state and first-message experience
- Multi-entity response rendering (panel, roundtable, directed)

**Observations:** TBD

---

## 3. Channel settings

*Can the user configure what a conversation is and does?*

- Name, model, interaction mode
- Channel context (L4) — label, helper text, purpose
- Entity assignment (add/remove pills, max 5)
- Pinned files
- Prompt layers debug view
- Import provenance and statistics

**Observations:** TBD

---

## 4. Entity management

*Can the user define and manage their cast of characters?*

- Creation, editing, deletion
- Role prompt (L5) — label, helper text
- Model selector, effort level
- Color picker, handle
- Duplicate entities from imports (no dedup story yet)
- Entity reuse across channels/projects

**Observations:** TBD

---

## 5. Project settings

*Can the user organize work at the project level?*

- Name, instructions (L2), memory (L3)
- Knowledge base file management
- Project-channel relationship
- Imported project metadata

**Observations:** TBD

---

## 6. Import flows

*Can the user bring existing Claude work into Klatch?*

- Claude Code session browser
- claude.ai ZIP import
- File upload
- Conflict resolution (replace/fork)
- Import fidelity readout — which layers were populated?
- Post-import orientation (what should the user do next?)

**Observations:** TBD

---

## 7. File and artifact features

*Can the user work with documents and files in context?*

- Upload and attachment display
- Pin/unpin to channel
- Promote to project
- Artifact rendering (tool use, thinking, images)
- Code block save
- The "Paste It Again" anti-pattern — is it solved?

**Observations:** TBD

---

## 8. Export and context packaging (Phase 3)

*Can the user take a conversation out of Klatch with maximum fidelity?*

- Layer-aware export UI — what's being packaged, layer by layer
- Sparkline composition view (enabled by Phase 1 format: `length_chars` everywhere)
- Trust levels as visual language (human-authored, synthesized, cross-project, etc.)
- Provenance timeline rendering (chain with `summary` and `layer_fidelity`)
- L5 fidelity gap presentation ("information transfers; judgment is recoverable through use")
- Field notes review UX (Phase 3.5 — structured array, not rubber stamp)
- Smart default with power-user override for compaction
- Provenance affordance — subtle indicator, expand for details

**Observations:** TBD — pending Phase 3 design work. Format spec captured in `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md`.

---

## 9. Onboarding and first-run

*What happens when a new user opens Klatch for the first time?*

- Current state: #general with "Start a conversation"
- What the blog promised: "a stage for a cast of characters"
- What the user needs to understand to get value
- What can be deferred

**Observations:** TBD

---

## 10. Responsive design

*How does the experience adapt to different contexts?*

- Not "mobile UX" — holistic design for users who are sometimes mobile
- Current state: hamburger sidebar, responsive breakpoints at `md:`
- Progressive disclosure and information density as tools
- Last evaluated at v0.5.5

**Observations:** TBD

---

## 11. Accessibility

*Can all users access the experience?*

- Color contrast (light/dark themes)
- Keyboard navigation
- Screen reader basics
- Semantic HTML vs. div-with-onClick patterns
- ARIA labels (Argus notes: "use accessible roles over data-testid")

**Observations:** TBD

---

## Cross-cutting concerns

### The blog promise vs. the UI delivery
*Calliope's frame: "The gap between what the blog promises and what the UI delivers is probably the most important thing you can find."*

*Refinement (from xian, April 12): the blog is not a contract. It's a genuine intellectual practice — documenting, reflecting, sharing insights. Evaluate the product against the canonical use cases, not the blog's explorations. The blog and the product serve different purposes even though they're expressions of the same work.*

TBD — synthesis across all sections.

### The canonical use cases
*Do the daily omnibus and weekly work stream review work in Klatch?*

TBD — evaluated against each section.

### The five-layer model as UX
*Does the user need to think in layers, or does the interface handle it?*

TBD — depends on interview Theme 2 (context visibility) answers.

### Workflows as the natural evolution of channels
*The Klatch channel concept is a persistent, repeatable workflow — like a skill, except one involving multiple agents.*

The three interaction modes (panel/roundtable/directed) are building blocks within workflows, not the taxonomy of workflows. A single workflow (e.g., the weekly ship) composes multiple modes across phases: panel for independent drafting → directed for CoS synthesis → conversational for xian + CoS editing → panel for lead review.

Touches almost every section of the evaluation:
- **Sidebar:** How do you find and launch a workflow? Is a workflow channel visually distinct?
- **Channel view:** How do you see which phase you're in? What's the next step?
- **Entity management:** How do you define a workflow's cast?
- **Channel settings:** How does channel context (L4) express the workflow's purpose and rules?
- **File features:** How do pinned files serve as workflow inputs (e.g., omnibus logs for the weekly review)?
- **Export:** How do you package a workflow's output?
- **Onboarding:** How does a new user understand that a channel can be a recurring meeting, not just a conversation?

(Insight surfaced during Iris interview with xian, April 12, 2026.)
