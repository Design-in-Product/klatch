# Triage: Patches vs. Real Design

**Author:** Iris (UX design)
**Date:** 2026-05-11
**Status:** First pass — for xian review and Daedalus pickup
**Source:** `docs/ux/walkthrough-findings.md` (surface skim across 8 surfaces + Pass 2 realistic scenario)

---

## Framing

Two tracks running in parallel:

- **Track 1 — Patches (Daedalus):** Incremental improvements that won't be wasted work even after the holistic redesign.
- **Track 2 — Design (xian + Iris):** Holistic UX redesign for the panels-as-musculature, composition gesture, transport-aware export, and the entity reframe.

This document is Track 1: a triage of findings into three tiers, plus one cross-cutting pass that touches everything.

### What makes a good patch

- **Specific:** scoped enough to land in a few hours, not a few weeks
- **Directionally right:** even if the surface gets replaced later, the underlying work (e.g., extracting a content fingerprint for each session) is reused
- **No design dependency:** doesn't require a decision the redesign hasn't made yet
- **Unblocks real workflows:** the user can do something today they couldn't before

### What disqualifies a patch

- **Would be wasted:** decorating a panel that's about to be redesigned
- **Forces a design decision now:** picking a final shape for something that needs deeper thinking
- **Bigger than a patch:** the right fix is the holistic one, attempting it incrementally would be a distraction

---

## Cross-cutting pass: typography + contrast

**Why this is its own thing:** F1.1 + F2.1 established small/low-contrast type as a finding at the first two surfaces; the pattern carries through every other surface. This isn't a per-panel patch — it's a single sweep across the app's design tokens.

| Aspect | Proper fix | Near-term patch |
|---|---|---|
| **Default text size** | Comprehensive typographic scale aligned with the holistic visual design (when chosen) | Bump base font size; raise small-caps sizes; review minimum line-height. Picking a coherent baseline now lets the eventual redesign tune from a sensible starting point rather than from current too-small defaults. |
| **Contrast ratios** | WCAG AA verified across light/dark themes with semantic color tokens | Audit the existing CSS variables; raise gray-on-white pairings that fail AA; same in dark mode. Down payment — the variables are the right structure, only the values need adjustment. |
| **Small caps usage** | Consider whether section labels actually want small caps in the holistic design | If kept, raise size + tighten letter-spacing for legibility. If discarded later, that's fine — the readability fix is independent of the typographic choice. |

**Effort:** Single Daedalus session. Touches `packages/client/src/index.css` and a few component utility classes.
**Reuse:** Full. Whatever the final visual design does, it inherits readable defaults instead of the current cramped baseline.

---

## Tier 1 — Clear patches (Daedalus can do today)

These have no design ambiguity. The proper fix is part of a larger redesign, but the near-term patch is directionally correct and won't be thrown away.

### T1.1 — Hide the literal default channel prompt from the header
- **Finding:** F1.3 — "You are a helpful assistant." rendered in the channel header is a stray artifact.
- **Proper fix:** The channel header is part of the panel-as-musculature redesign; it should communicate the channel's purpose, not its raw prompt.
- **Near-term patch:** When the channel's `systemPrompt` equals the literal default string ("You are a helpful assistant."), don't render the subtitle at all. Five-minute fix. Removes a jarring artifact without committing to what the header *should* show.

### T1.2 — Replace technical jargon in import dialog
- **Finding:** F7.2 — "jsonl" and similar implementation terminology surfaced to user.
- **Proper fix:** Import becomes a full-screen experience with clear user-facing copy throughout.
- **Near-term patch:** String substitution. Replace user-facing references to "jsonl", "JSONL", etc. with "session file" or similar. Audit other implementation-leak terms in the dialog at the same time. Trivial.

### T1.3 — Add unselect-all to import session browser
- **Finding:** F7.5 — "All" or "chosen" defaults; no unselect-all affordance.
- **Proper fix:** Import browse list is redesigned with full-screen treatment, clustering, content fingerprints, project association.
- **Near-term patch:** Add an "Unselect all" link alongside the existing "Select all" affordance. Standard form control. Trivial. Won't be wasted.

### T1.4 — Tooltip on truncated project names in sidebar
- **Finding:** F2.4 — "INSTRUCTIONS ONLY PR..." cuts off with no recovery.
- **Proper fix:** Sidebar IA redesign handles truncation + density coherently.
- **Near-term patch:** `title` attribute or hover tooltip showing the full project name when truncated. Cheap, universally useful. Survives any sidebar redesign.

### T1.5 — Loading state for "Preparing export preview..."
- **Finding:** F8.2 — User can't tell if working or hanging during Phase 3.5 generation.
- **Proper fix:** Phase 3.5d UI gets full design pass including progress, partial-result reveal, cancellation.
- **Near-term patch:** Add a spinner + brief explanatory text ("Generating behavioral notes... this may take up to a minute"). Honest about what's happening. Removes the "is it stuck?" question.

### T1.6 — Surface content fingerprint for each import session ⚠️ **HIGH VALUE**
- **Finding:** F7.6 + F-P2.A.2/A.3 — Session labels read as serial numbers. Forced xian to guess-import + inspect-and-rename in the real workstream review attempt.
- **Proper fix:** Full-screen import browser with content preview, clustering, project hierarchy, smart selection.
- **Near-term patch:** For each session in the browse list, surface:
  - First user message (truncated to ~80 chars)
  - Message count
  - Last-active date
  - Project association (if any) — promoted visually if present
  - Optional: derived name from the first prompt (e.g., first 5-7 words capitalized)

  All of this data exists in the JSONL or is cheap to extract on scan. The session-list rendering changes; the underlying "extract content surface" work is reused by any future redesign. **This is the single highest-leverage patch in the list** — it would have changed yesterday's Pass 2 from "guess and rename" to "select by recognition."

### T1.7 — Move Entities button OR move the Entities panel
- **Finding:** F6.7 — Lower-left button opens a right-side panel; spatial logic broken.
- **Proper fix:** Entity manager becomes the "library" view in the panels-as-musculature redesign, with its own information architecture.
- **Near-term patch:** Either (a) put the panel on the left adjacent to the button it came from, or (b) move the button to the right side near where the panel appears. Restores spatial expectation. Either direction is a down payment toward the eventual library treatment.

---

## Tier 2 — Down payments (directionally right, might evolve)

These are patches whose specific shape might change in the holistic design, but doing them now is still a net improvement and they teach us something for the redesign.

### T2.1 — Show channel-count per entity in the entity manager list
- **Finding:** F6.1 — Entities listed without context for where they're used.
- **Proper fix:** Entity manager becomes the library view, showing roles with their full participation graph, lineage, and provenance.
- **Down payment:** Add a small "in N channels" badge or count next to each entity. Tells the user "this role is used in your workflow." First step toward the library treatment. The data is cheap (the `channel_entities` join table already knows this).

### T2.2 — Consistent panel disclosure pattern (per-category)
- **Finding:** F4.2 + F8.7 — Modal-vs-not is ambiguous; chat peeks through at certain zooms.
- **Proper fix:** Panel disclosure decided as part of the holistic design (settings inline, tasks full-screen, library integrated).
- **Down payment (Iris recommendation, xian-approved):** Two categories, two treatments — both directionally correct:
  1. **Settings panels that slide down from the header** (Channel settings, Project settings): make them **truly inline**. Push the message list down rather than overlay it. The "skirt" disappears because there is no overlay. Musculature-friendly — settings are part of the channel's identity, not an admin interruption.
  2. **Task and library panels** (Entity manager, Import dialog, Export preview): make them **true modals with an explicit semi-transparent backdrop** that visually establishes focus. The "skirt" disappears because the backdrop is honest about what's happening.
- **Why this works as a patch:** Two small changes, both honest treatments of what each panel actually is. Previews the holistic direction (settings → inline / tasks → eventually full-screen / library → eventually integrated) without committing to it.

### T2.3 — Helper text on export preview sections
- **Finding:** F8.6 — Good bones, missing voice. Users see "Package contents" + "Field notes for Claude" without framing.
- **Proper fix:** Service-design pass on the export experience with full guidance copy, transport-aware framing, and the moving-company metaphor.
- **Down payment:** A short explanatory line under each section header. E.g., under Package contents: "What goes into this export, by layer." Under Field notes: "Behavioral observations from this conversation. Review and approve to include." Replaceable later; doesn't constrain the redesign.

### T2.4 — Brief description text under "Unassigned" sidebar header
- **Finding:** F2.5 — No context for what "Unassigned" means.
- **Proper fix:** Sidebar IA redesign with deliberate section semantics.
- **Down payment:** One-line subtitle: "Chats not yet assigned to a project." Cheap. Down payment toward the eventual "what does this section mean" treatment.

---

## Tier 3 — Wait for design

These should NOT be patched. Attempting a partial fix would either be wasted work or would force a premature design decision.

### Composition gesture (F-P2.C.1, F6.5, etc.) 🛑
**The 1.0 blocker.** Klatch lacks a path from "I have these existing conversations" to "they are now in a klatch together." This is the entity reframe (4/18 direction note) made operational. Cannot be patched — it requires the design work that determines what promotion-from-existing-conversation looks like as a gesture, what the entity manager becomes (forge → library), and how the import-to-export arc connects.

### Panel-as-musculature redesign (F4.4, F5.1, F6, F7.1, F8) 🛑
**The dominant design theme of the walkthrough.** The panels (channel settings, project settings, entity manager, import dialog, export review) are simultaneously the highest-leverage surfaces and the most undesigned. The proper fix is a coherent design language for the panels that answers: identity, affordance, guidance-at-boundaries. Patching any one panel without that language is decoration.

### Transport-aware export with fidelity loss disclosure (F8.9) 🛑
**Already agreed in Session 6.** Wait for design. The transport selection moment is where the fidelity-loss panel + Phase 3.5 defaults + honest L4 declaration all need to come together. Attempting incrementally would force premature decisions about presentation.

### Memory-layer maintenance UX (F5.3) 🛑
**Architectural + UX.** Klatch is responsible for memory-layer maintenance when accessing Claude via API. Today it's a passive textarea. The proper fix requires deciding how memory grows, what staleness looks like, how the user curates accumulated knowledge. Connects to Janus's memory research and PM's composting pipeline thinking. Don't patch.

### Entity manager redesign (F6.3, F6.4) 🛑
**Tied to composition gesture.** The "+" form is a dumb form because the entity reframe says the entity manager isn't primarily for creating from scratch — it's a library of promoted conversations. Patching the form would design for the wrong workflow. Wait for the entity reframe to land in UI.

### Empty state design (F1.2, F1.4) 🛑
**High-leverage surface for the product's identity.** What a new user sees on first load is the strongest opportunity to communicate what Klatch is. Don't decorate "Start a conversation"; redesign the surface deliberately as part of the onboarding pass.

### Channel content area differentiation (F3.1, F3.2) 🛑
**Requires a deliberate decision** about whether single-entity chats should look distinct from multi-entity klatches, and how. F3.2 is itself an open design question. Don't patch.

---

## Summary

**Cross-cutting (1):** typography + contrast pass.

**Tier 1 (7 patches):** all directionally correct, no design dependency. **T1.6 (content fingerprint in import) is the highest-value patch in the list** — it directly addresses the friction that derailed yesterday's Pass 2 attempt.

**Tier 2 (4 down payments):** lighter-touch, might evolve, but worth doing.

**Tier 3 (6 wait-for-design items):** explicitly NOT patches. These are the substantive design work for Track 2.

**Suggested ordering for Daedalus, if a quick win is wanted first:**
1. Cross-cutting typography + contrast (biggest visible improvement per hour of work)
2. T1.6 content fingerprint (highest workflow value)
3. T1.1 + T1.2 + T1.3 + T1.4 + T1.5 + T1.7 in any order (all small, all useful)
4. Tier 2 items as time permits

The Tier 3 items become the agenda for the design work xian and Iris will do in parallel.