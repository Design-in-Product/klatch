# Klatch UX Design Brief

**Authors:** Iris + xian
**Date:** 2026-05-12
**Status:** Working document. Synthesizes the April-May UX walkthrough + object-model + vocabulary work into a holistic design direction. Frames the 1.0 critical path and what continues in parallel post-beta.

---

## Why this document exists

After ~10 sessions of evaluation, walkthrough, object-model work, and vocabulary resolution, we have enough foundation to:

1. Synthesize what we know about Klatch's UX direction
2. Frame the holistic design that Klatch is moving toward
3. Identify the **minimum 1.0 scope** to get a working version into beta testers' hands
4. Note what continues in parallel after 1.0 ships

The design strategy is **not** "complete the holistic redesign before 1.0." It is "ship the minimum that lets a user set up and run a meeting in a klatch; continue the holistic redesign in parallel using beta feedback to inform it."

---

## Synthesis: what we know

### Klatch's value proposition

The walkthrough surfaced one load-bearing reframe (xian, F6.7) that anchors everything else:

> **The panels are not edge-case settings/prefs for a chat app. They are the unique musculature that preserves context in these chat-agent workflows.**

Klatch's distinctive surfaces — channel settings, project settings, entity manager, import dialog, export preview — are functional organs, not admin overlays. They are where Klatch's value proposition lives. Treating them as admin is structurally wrong.

Three additional load-bearing insights from the work:

- **Klatches are synthetic** (T1). Each agent in a klatch experiences a normal single-user chat with context injected. The human user sees a group chat. The agents don't. The orchestration is invisible to the participants but real to the system.
- **Role persistence is Klatch's unique value vs. generic chat products** (T2). Entities mature into roles with consistent identity and ongoing function in a project. No other tool does this well.
- **Klatch should be transparent about what it currently can and cannot import and export, down to the layer level** (xian, post-Surface 8). A baseline product property, not just an export feature.

### The object model

Resolved across six tensions yesterday (`docs/ux/object-model.md`):

- **Channel** (parent, implementation) → contains chats (single-entity) and klatches (multi-entity)
- **Agent** (user-facing broad) → any AI participant; **role** is the subset that has matured to persistent identity in a project
- **Project** typically contains channels + L2 instructions + L3 memory + KB files + roles. Constraints are typical-but-not-mandatory.
- **L4 (channel context)** stays a string (what agents see); a separate structural object (workflow) lives alongside it (what the system orchestrates)
- **Field notes** attach to the entity; the project + user dimensions are implicit in the canonical case
- **Workflow** is the parent category; **meeting** is one type. Every klatch has a workflow. Default is broadcast.

### The user-facing vocabulary

Resolved across five questions today:

- **V1:** Chats and klatches are primary; conversation is the singular generic fallback; channel stays in implementation
- **V2:** Agent (broad) + role (subset); entity stays in implementation
- **V3:** Workflow and meeting stay internal; the user "sets up a klatch" with direct field-level properties
- **V4:** Composition verbs are **invite** (add agent to existing klatch) and **convene** (create new klatch)
- **V5:** Naming an agent IS the promotion to role; "promote" is internal vocabulary only

### The design principles

From the design principles doc, with the meta-principle anchoring them: **Who bears the burden?**

- **Absorb complexity** — tool bears complexity burden (Tesler's Law, smart defaults, service design not configuration)
- **Communicate with clarity** — interface bears communication burden (handoffs not losses, focus, honesty)
- **Preserve human agency** — system bears mechanical burden; human bears judgment burden (smart/dumb bottleneck, central review, accountability)
- **Build from evidence** — evidence bears design burden (Gall's Law, worked examples, methodology beats code)

### The composition gap

Pass 2's stress test on May 10 produced a lived confirmation: **the composition gesture is the 1.0 blocker.** xian could import + identify + cluster the Piper Morgan leadership conversations, but could not bring them into a klatch together. Klatches today require entity creation from scratch; promotion-from-existing-conversation has no surface. The product's central gesture has no home.

This is the central thing 1.0 must fix.

---

## The holistic design direction

What Klatch's experience should *ultimately* be — across all surfaces, audiences, and contexts.

### Three audiences, three views

Klatch is a system that serves three distinct audiences simultaneously:

1. **The human user.** Sees a workspace with chats and klatches organized by project. Configures klatches by filling in their properties (purpose, agents, cadence, mode). Composes new klatches by convening agents — typically roles they've already developed. Exports work back to the environments they live in.
2. **The AI agents (Claude, etc.).** Experience normal chats with context injected. Don't experience klatches as group chats; experience them as chats with helpful awareness of other agents' contributions. The orchestration is invisible to them.
3. **The system itself, and downstream MCP consumers.** Sees the workflow + meeting structure underneath. Orchestrates message routing. Maintains role persistence. Exposes the context interchange protocol Klatch built in Step 10.

Each audience needs the right abstraction. The design honors all three.

### Surfaces as musculature

Every panel should answer three jobs simultaneously:

- **Identity surface:** what is this object?
- **Affordance surface:** what can I do with it?
- **Guidance surface:** what should I do, especially at boundaries (import, export, migration)?

Today's panels mostly do #2 by accident — fields exist. The holistic redesign treats each panel as doing all three jobs deliberately.

### Composition as the central gesture

The act of bringing existing roles together in a klatch is Klatch's distinctive verb. The composition flow — **convene** — is the primary entry point to the multi-agent experience. From it:

- The user selects existing roles to invite (canonical case) or creates new agents inline (fallback)
- The user fills in the klatch's properties: purpose, cadence, phases (if structured), what it produces
- The system maintains the workflow object underneath; the user just configures the klatch

### Context transparency

Following xian's principle: Klatch should be transparent about what it currently can and cannot import/export, down to the layer level. Applied broadly:

- **In channel/project panels:** show the assembled context honestly — which layers are populated, with what content, at what sizes (the sparkline already exists at the export surface; propagate to other surfaces)
- **At import:** show fidelity readout (Daedalus shipped a minimal version) — what arrived, what didn't
- **At export:** show what's being packaged and where fidelity might be lost (Session 6 work — transport-aware defaults, honest L4 declaration)
- **At promotion:** show what changes when an agent becomes a role (its appearance in libraries, its availability to klatches)

### Mobile and responsive

Per xian's philosophy: holistic design that adapts to context, not a separate "mobile UX." The design system flexes through progressive disclosure and information density. Phone-sized viewports get the same product, expressed appropriately for the context. Touch targets, gesture affordances, and content prioritization respect the form factor without becoming a parallel product.

### Agentic surfaces

Klatch is already an MCP server (Phase 5 shipped). The agentic surface is alive. The design implications:

- The MCP context interchange protocol (Phase 1's canonical package format) is the same shape consumed by other tools (Claude Code, Claude Desktop, hypothetical future MCP clients)
- The user-facing UX and the agent-facing protocol are two projections of the same underlying object model. They stay in sync structurally even when the surface treatments differ.
- "Bring your own chat" — the reverse direction — is also part of this. Agents from elsewhere should be able to arrive into Klatch via the protocol; the import flow is the human-facing version of what MCP enables programmatically.

### CLI / integration

Future surfaces. The design should leave room for:

- A CLI that lets a user run "klatch convene shipping-news --invite-roles cxo,cio,ppm" type commands
- Integration with Claude Code (already partial — Claude Code can be both a source and target)
- Eventual third-party integrations that consume the canonical package format

None of these are 1.0 work. But the object model and vocabulary should not make them harder than they need to be.

---

## Tier 1 + Tier 2 status (where Daedalus is)

From the triage at `docs/ux/triage-patches.md`. Status as I understand it (verify with Daedalus / Argus):

### Cross-cutting

- **Typography + contrast pass** — partial. Argus Round 33 shipped contrast tests with WCAG-AA math. Real finding surfaced: `--c-faint` token at 2.43:1 in light theme used as actual text. Spec to Daedalus today (`iris-to-daedalus-faint-token-reclassify-2026-05-12.md`) — reclassify three surfaces from `text-faint` → `text-muted`.

### Tier 1 (clear patches)

- T1.1 hide default channel prompt from header — pending
- T1.2 replace "jsonl" jargon in import dialog — pending
- T1.3 add unselect-all to import browser — pending
- T1.4 tooltip on truncated project names — pending
- T1.5 loading state for export preview — pending
- **T1.6 surface content fingerprint for import sessions ⚠️** — ✅ shipped (Argus Round 33 — server-side contract complete; client integration likely pending)
- T1.7 fix Entities button/panel spatial disconnect — pending

### Tier 2 (down payments)

- T2.1 channel-count per entity in entity manager — pending
- T2.2 consistent panel disclosure pattern (settings inline; modal+backdrop for tasks) — pending
- T2.3 helper text on export preview sections — pending
- T2.4 subtitle under "Unassigned" sidebar header — pending

**Net:** T1.6 (server side) and partial cross-cutting work done. 9 mechanical patches pending across Tier 1+2. The faint-token reclassify is the smallest urgent fix; the others are batched ready for a Daedalus session.

---

## The 1.0 critical path

**Minimum to enable "set up and run a meeting in a klatch."**

This is the goal. Everything in this section is required for 1.0; everything not in this section is not.

### Must-ship for 1.0

1. **The composition gesture.** Users can convene a new klatch and invite existing agents (typically roles). This is the 1.0 blocker from Pass 2.
2. **A klatch setup surface** that supports the meeting being set up:
   - Name the klatch
   - Define its purpose (a string for L4)
   - Invite agents (selected from existing agents / roles)
   - Choose orchestration mode (broadcast / panel / roundtable / directed — existing concepts surfacing as user-facing)
   - Pin context files (existing)
   - Save and enter the klatch
3. **The remaining Tier 1 patches** that materially affect this flow:
   - Cross-cutting typography + contrast (the experience needs to be legible)
   - T1.4 tooltip on truncated project names (sidebar navigation usable)
   - T1.5 loading state for export preview (already partial value)
   - T1.6 client integration for content fingerprint (selection by recognition, not guessing)
   - Faint-token reclassify (accessibility)
4. **A working meeting experience inside a klatch.** Roundtable / panel / directed modes do their thing. The user can run the meeting, see responses, edit a synthesis with one agent (the CoS pattern from the canonical use case), and export the result.
5. **The promotion gesture: naming an agent IS the promotion.** The user can give an existing agent a name + role title, and that act adds it to the roles library and makes it invitable to klatches as a role.

### Defer past 1.0

- Holistic panels-as-musculature redesign (too big; needs beta feedback)
- Entity manager → roles library full redesign (after composition ships)
- Empty state / first-run experience design
- Memory-layer maintenance UX
- Transport-aware export with fidelity-loss disclosure (the L4/L5 round-trip work)
- Channel content area differentiation
- Step 11 (Search) — explicitly post-1.0 per roadmap

### What this means concretely

The composition gesture and klatch setup surface are the design and implementation work that has to happen now. Daedalus's queue is currently waiting on Track 1 patches; once those are absorbed, the composition + klatch-setup work is the next Daedalus assignment, and that needs design specs from us before he can build.

The patches are roughly mechanical (Daedalus + Argus can pick them up); the composition gesture is genuinely design work (xian + Iris needs to specify it before Daedalus implements). This is the natural division of labor for the next few weeks.

---

## What continues in parallel post-1.0

The holistic redesign work doesn't stop when 1.0 ships. It continues, informed by:

- **Beta feedback** — real users in real workflows, the only honest source of design validation
- **Step 11 work** — search is the next major roadmap step; surface design happens alongside it
- **AAXT / MAXT continuing** — agent experience testing keeps producing findings that affect the design

Specifically, the parallel-track items are:

1. **Surface-by-surface panels-as-musculature redesign.** Each panel gets its design pass (channel settings, project settings, entity manager / roles library, import experience, export experience). One at a time. Prioritized by user impact.
2. **The empty state / first-run experience.** Once we know what 1.0 users see when they open Klatch for the first time, we design for that moment deliberately.
3. **Memory-layer maintenance UX.** Klatch is responsible for memory maintenance via API (F5.3). The passive-textarea today is not enough. Designed in conjunction with Janus's memory research + PM's composting work.
4. **Transport-aware export with fidelity-loss disclosure.** The Session 6 work. Tier 3 in the triage. Lands when the export experience gets its design pass.
5. **Mobile and responsive density refinement.** As we learn what beta users do on phones, we tune.
6. **Agentic surface refinement.** The MCP server is alive but the user-facing affordances around it (Klatch as a context server) are not yet a deliberate UX. Designed as the BYOC / Managed Agents ecosystem matures.
7. **The CLI / integration surfaces.** Possible Step 12+ work. Designed when there's a concrete driver.

---

## The proposed sequence

1. **Now (in flight):** Daedalus picks up the Tier 1 + Tier 2 patches; the faint-token spec is in queue.
2. **Next (Iris + xian):** Design the composition gesture and klatch setup surface concretely. Specs for Daedalus. Sketches if/when xian has reMarkable time.
3. **Then (Daedalus):** Implement composition + klatch setup against the spec.
4. **Then (Theseus + xian):** MAXT-style validation. Can xian actually set up the Piper Morgan workstream review through this? Repeat the Pass 2 stress test with the new UX.
5. **1.0 beta release.** Calliope coordinates messaging; users invited.
6. **In parallel from this point on:** holistic redesign continues, informed by beta feedback. Step 11 (Search) work begins.

The discipline of this approach: **don't try to ship the redesign with 1.0.** Ship the minimum that lets the canonical workflow run end-to-end. Use the post-1.0 window to do the real design work without artificial pressure.

---

## Open questions

- **Promotion lifecycle:** when the user names an agent, what does the system do with the promotion? Add it to the roles library, make it invitable, generate a default role title from the conversation? To spec.
- **Default orchestration:** broadcast is the default workflow; how is "broadcast" exposed to the user in the setup surface? As a mode picker with a description, or implicit when nothing else is configured? To decide.
- **Pre-1.0 vocabulary migration:** today's UI uses "entity" and "channel" liberally. When do we sweep through and update copy? Probably part of the composition + setup spec.
- **What "running a meeting" actually looks like inside a klatch:** is the experience differentiated from a regular chat by visible phase indicators, mode-specific UI affordances, both, neither? To decide.

These are 1.0-scope questions that need answers before we can spec the composition flow precisely. The next session is the right place to tackle them.