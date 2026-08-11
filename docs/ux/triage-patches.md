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

## Added 2026-05-18 from Theseus UI-as-context AAXT findings

Five findings from Theseus's Rounds 36/37/38 (probing Sidebar, ExportReviewPanel, ImportDialog session browser). Four routing to Tier 1; one Tier 3.

### T1.8 (Theseus R36, F2) — Auto-expand sidebar projects containing non-native channels ⚠️ HIGH VALUE
- **Finding:** Round 36 surfaced that the sidebar accordion auto-expands only the *first project alphabetically*. Channels in non-first-alphabetical projects (including all imported Claude Code / claude.ai channels) are invisible by default. The CC source badge has nothing to attach to because the channel isn't rendered. Behavioral probe result: Absent — user-proxy couldn't find a channel that doesn't exist in the DOM.
- **Why this matters:** This is the kind of finding that surfaces in beta as "I can't find my Claude Code imports" with a poor recovery story ("click the collapsed project header you didn't know existed").
- **Proper fix:** Sidebar IA redesign — proper disclosure pattern for projects, summary cues for collapsed projects, default-state strategy.
- **Near-term patch:** On first load, auto-expand every project that contains channels where `source !== 'native'`. Cheap signal that imported work exists. Survives the holistic redesign because "imported work should be discoverable on first read" is a property the redesign will also want.

### T1.9 (Theseus R36, F3) — "3 entities" tooltip leaks internal vocabulary
- **Finding:** EntityManager tooltip shows "3 entities" / "Assigned to N channel(s)" — V2 banishes "entity" from user-facing copy; should be "agents."
- **Proper fix:** Entity manager redesign uses "agents" and "roles" consistently throughout.
- **Near-term patch:** Two-string fix in the tooltip. Folds into the vocabulary-migration sweep Daedalus has queued (already in the 5/12 audit at EntityManager.tsx:119).

### T1.10 (Theseus R37, E1) — ExportReviewPanel hides zero-file state
- **Finding:** Round 37 found that when `files.length === 0`, the Files row in ExportSummary doesn't render at all. User-proxy: "I cannot determine how many files are being included." Same pattern as T1.8 (zero communicated by absence).
- **Proper fix:** Service-design pass on the export experience handles explicit zero-states throughout.
- **Near-term patch:** When files = 0, render `Files: 0` (or `—`) instead of omitting the row. One line of conditional rendering.

### T1.11 (Theseus R38, I1) — Same-day import sessions are indistinguishable by visible info
- **Finding:** Round 38 found that `toLocaleDateString()` shows only MM/DD/YYYY; time-of-day lives only in the tooltip. When two sessions are from the same day, the user can't tell which is more recent without hovering — directly defeats T1.6's selection-by-recognition design intent. User-proxy picked wrong session (Confabulated).
- **Proper fix:** Holistic ImportDialog redesign — full-screen experience with rich content fingerprints.
- **Near-term patch:** Two parts (do both for redundant signaling):
  1. Show time-of-day on the visible date for sessions modified within the last 24 hours (e.g., `5/17/2026 2:14 PM` instead of `5/17/2026`)
  2. Sort sessions by recency (most-recent first) within each project so list position carries the temporal signal

### T3 addition (Theseus R38, I2) — Imported badge has no "new" complement 🛑
- **Finding:** Round 38 found the badge system is asymmetric — imported sessions get an "imported as X" badge, new sessions show nothing. When all sessions are the same status (all-imported or all-new), the user-proxy couldn't tell whether "absence of badge" meant "none in that state" or "the UI doesn't surface that distinction."
- **Why not patched now:** The fix is at the redesign level (per-project status summary line, symmetrized badge tokens, or some other shape that emerges from the holistic pass). Patching the asymmetry without that context risks decorating something the redesign will rip out.
- **Defer to:** Holistic ImportDialog redesign (already Tier 3).

---

## Cross-cutting principle added to design principles

From Theseus's R36/R37/R38 cross-cutting observation (three findings share the same shape): **negative state needs explicit representation, not implicit absence.** Captured in `docs/ux/design-principles.md` under "Communicate with clarity." User-surface analogue of the agent-side Subliminal classification.

---

## Added 2026-05-18 from Theseus R39 UI-as-context AAXT — ChannelSettings findings

ChannelSettings panel — the F4.4 "value proposition, surfaced / currently a junk drawer" surface. 54.5% conveyance, lowest of all UI-as-context rounds. Five findings; four routing to Tier 1.

### T1.12 (Theseus R39, CS-F1) — Prompt layers indicator needs visible status text ⚠️ HIGH PRIORITY
- **Finding:** 0/5 Correct, 4/5 Absent on the prompt-layers indicator. The active/inactive signal is **only color** (green dot vs gray dot). No text, no `aria-label`, no `title`. Subliminal-class — data is in className strings; surface obscures it. WCAG 1.4.1 violation. **The single most-important surface for visualizing Klatch's value proposition fails its job entirely.**
- **Why this matters:** F4.4 named this panel "the value proposition, surfaced." The prompt-layers area is the heart of that — where users should see what Klatch is doing structurally. Today they see layer names and nothing about which are populated.
- **Proper fix:** Layer composition visualization (sparkline-style) propagated from the export preview surface, where the same data already conveys correctly.
- **Near-term patch:** Add visible status text next to each layer ("Project Instructions — active" / "Channel Addendum — empty"). Optionally also: `aria-label` on the colored dot, or a non-color affordance like ✓ vs —. Lifts the surface from 0% to ~100% conveyance on the most important claim category. **Highest single-patch value identified in the walkthrough so far.**

### T1.13 (Theseus R39, CS-F2(a)) — Pinned files section: always render header with explicit zero-state
- **Finding:** Section only renders when `channelFiles.length > 0`. User-proxy can't tell "no pinned files" from "the UI doesn't have a pinned files concept." Instance of the negative-state principle.
- **Near-term patch:** Always render the "Pinned files (N)" header; show "No files pinned" body when N === 0.

### T1.14 (Theseus R39, CS-F2(b)) — Native provenance: always render a low-key label
- **Finding:** Provenance card only renders when `isImported`. Native channels are silently native. Same pattern as imported badges having no "new" complement (R38 I2).
- **Near-term patch:** Render a low-key "Native — created in Klatch" label for native channels. Symmetrizes the provenance signal.

### T1.15 (Theseus R39, CS-F2(c)) — Project assignment dropdown: always render with empty default
- **Finding:** Dropdown only renders when `projects.length > 0`. When no projects exist, the entire concept of project assignment is invisible. User-proxy: "I cannot tell 'no project assigned' from 'the UI doesn't surface projects.'"
- **Near-term patch:** Always render the dropdown with "No project assigned" as the default option. Becomes informational when no projects exist; interactive when they do.

### T1.16 (Theseus R39, CS-F3) — Interaction mode buttons need non-color active-state signal
- **Finding:** Mode buttons (panel/roundtable/directed) signal active via `bg-accent text-white` vs `bg-card text-secondary`. User-proxy could enumerate modes but couldn't tell which was selected. Lower severity than CS-F1 (only 3 options; user can usually infer from context) but same accessibility class.
- **Near-term patch:** Add `aria-pressed="true"` to the active button + a visible "(selected)" marker, or a non-color affordance (underline, check icon, filled circle).

### Positive catalog (Theseus R39, CS-F5) — Channel context label is exceptional
- **Finding:** "Channel context (purpose, agenda, constraints — injected into every message)" scored 100% conveyance (3/5 Correct + 2/5 Reconstructed where the reconstructions were correct but worded differently than expected). The user-proxy understood BOTH what the field is for AND when it gets used.
- **Pattern to propagate:** Textarea + framing-rich label that names purpose + audience + behavior. The single best example of a well-designed surface element in the current panel.
- **Where this lands:** Documented in design-principles.md as a positive pattern alongside the inverse-rendering principle (which CS-F5 also exemplifies — channel context is *always rendered*, not conditional on having content).

---

## Second cross-cutting principle from R39 findings

Theseus identified the meta-pattern across CS-F2(a), CS-F2(b), CS-F2(c) and earlier negative-state findings: **conditional rendering hides the categorical state of the channel.** A user can't tell whether a category doesn't apply vs. whether the UI doesn't surface it.

Captured as a new principle in `docs/ux/design-principles.md`: **Render the categories that could exist, not just the ones that do.** Sibling to "negative state needs explicit representation" but more specific to panel surfaces. The CS-F5 channel-context field is the positive instance — always rendered with a framing label — and propagating its pattern to other panel surfaces would address most of the R39 findings.

---

## Added 2026-08-10 from Theseus's AAXT findings disposition (R38 IP1, RESET1)

Two residuals named by Theseus's 8/09 disposition of Argus's 8/05 Phantom findings (`docs/mail/read/theseus-to-argus-iris-aaxt-findings-disposition-2026-08-09.md`) — the other three findings in that memo were instrument defects, not product gaps, and needed no design action.

### T1.17 (Theseus RESET1) — Clone-from-klatch select needs a non-visual reset signal
- **Finding:** After a one-shot clone action, the `<select>` resets to its placeholder. A sighted user reads this off the closed control's text; a screen-reader user has no equivalent announcement — the reset is conveyed by the option text changing, which isn't itself an event assistive tech surfaces.
- **Why low urgency:** Theseus's explicit read — no sighted user is misled, the control is one-shot by design. Not the Tier-anything item Argus's original routing implied; recorded here so it isn't lost, not because it's pressing.
- **Near-term patch:** `aria-live="polite"` region (or equivalent) announcing the reset when the select returns to its placeholder state after a clone action.

### T2.5 (Theseus R38 IP1) — Import browser: "most recent" is only legible within a project group
- **Finding:** The import session browser groups by project; a user comparing recency across the whole list can't tell which session is globally most recent without opening every group, because the visible ordering only sorts within each group (T1.11 already fixed same-day disambiguation *within* a group).
- **Theseus's framing, preserved:** genuine design question, not a defect — the dialog may never have claimed to answer "which is globally most recent."
- **My read:** worth a down payment, not a redesign. The import browser is already mid-revision (`docs/ux/import-confirm-step-scope-2026-08-09.md`, pending xian's review) — this can land in the same pass rather than opening a separate one.
- **Down payment:** Surface the single most-recently-modified session across all groups with a lightweight marker ("Most recent" badge or a pinned top row above the grouped list), independent of which project it belongs to. Doesn't require flattening the grouping — the grouping itself is doing real work (T1.6, T1.8) — just adds a cross-group signal the grouping structurally can't provide.

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