# Prioritized Issue List

**Author:** Iris (UX designer/developer)
**Status:** First pass
**Date:** 2026-04-13
**Source:** `docs/ux/evaluation.md` findings, design principles, canonical use cases

Ranked by user impact. Implementation effort is noted where relevant but is Daedalus's domain to estimate. Each item has: what's wrong, what "good" looks like, and which design principle it violates.

---

## Problems — things that are broken, confusing, or actively harmful

### P1. Hover-hidden action buttons break keyboard accessibility

**What's wrong:** Copy, retry, delete (messages), edit/delete (entities), copy/save (code blocks), and project settings gear icon are all revealed only on hover. Keyboard-only users cannot reach them. Touch users on mobile can see message actions (always visible) but not entity actions or project settings.

**What good looks like:** All interactive elements are reachable via keyboard (Tab, Enter, Escape). Action buttons are always visible (with subtle styling) or accessible via keyboard shortcuts (Cmd+C for copy, Delete/Backspace for delete). The hover-reveal pattern is an enhancement for mouse users, not the only path.

**Design principle:** Who bears the burden? Currently, keyboard users bear the entire burden of discovering functionality that mouse users get for free. The system should bear it.

**Scope:** MessageList, EntityManager, MarkdownContent, ChannelSidebar (project gear icon)

---

### P2. Message deletion has no confirmation

**What's wrong:** Single-click delete immediately removes a message with no undo. Entity deletion has a 2-click pattern (click once → "Click again to confirm" → 3-second timeout). Messages don't.

**What good looks like:** Same 2-click pattern as entity deletion, or a brief undo toast ("Message deleted. Undo?"). Consistent confirmation behavior across all destructive actions.

**Design principle:** Preserve human agency — high-risk actions need friction in the right places.

**Scope:** MessageList

---

### P3. Import flow shows no fidelity readout

**What's wrong:** After a successful import, the user sees: channel name, message count, artifact count, and a "Go to channel" button. No indication of which context layers were populated. A full-context import and an empty-context import produce identical success messages.

**What good looks like:** After import, a layer fidelity summary: "L2 (project instructions): captured from 'Piper Morgan' / L3 (project memory): empty / L5 (entity prompts): default." The user knows what they got and what might need attention.

**Design principle:** Communicate with clarity — the system knows what happened but doesn't tell the user. The interface should bear the communication burden.

**Scope:** ImportDialog

---

### P4. Prompt layers display is reduced to colored dots

**What's wrong:** Channel settings shows each prompt layer as a green or gray dot. The prompt-debug endpoint returns rich status strings ("ACTIVE — from project 'Piper Morgan' (3180 chars; 3 KB files)") but the UI collapses this to a dot. The user can't see what context is assembled, which layers are active and why, or how large the total prompt is.

**What good looks like:** Each layer shows: status (active/inactive/empty), source (which project, which files), and size. A composition bar or sparkline shows the relative contribution of each layer. Total assembled prompt length shown with approximate token count.

**Design principle:** Absorb complexity — the data exists, the UI should surface it without requiring the user to hit a debug endpoint.

**Scope:** ChannelSettings (Phase 3 relevant — directly informs export UI design)

---

### P5. No export UI exists

**What's wrong:** The export endpoint works (`GET /api/channels/:id/export`) but there's no button, menu item, or UI surface to trigger it. A user would need to know the API endpoint and use curl.

**What good looks like:** An "Export" button in channel settings (or the header) that shows a preview of what's being packaged — layer composition, file inventory, provenance — before downloading the zip. This is the Phase 3 deliverable.

**Design principle:** This IS the 1.0 value proposition. The roundtrip (import → work → export) is the product. The back door needs to be as well-designed as the front door.

**Scope:** Phase 3 — new component, major design work

---

### P6. Project settings unreachable on mobile

**What's wrong:** The gear icon on project headers in the sidebar is `opacity-0 group-hover:opacity-100` — invisible on touch devices. No alternative affordance exists.

**What good looks like:** The gear icon is always visible (subtle but present), or the project name itself is tappable to open settings, or a long-press gesture opens a context menu.

**Design principle:** Holistic design for users who are sometimes mobile — no feature should be reachable only via hover.

**Scope:** ChannelSidebar

---

## Opportunities — things that work but could be significantly better

### O1. Onboarding and first-run experience

**What's wrong:** First run shows #general with "Start a conversation." No indication of what Klatch does, what entities are, or how multi-entity conversations work. The most distinctive feature of Klatch is completely hidden.

**What good looks like:** A guided first-run experience that introduces one concept at a time: "Klatch lets you have conversations with multiple Claude personas. Create your first entity to get started." Progressive onboarding, not a tutorial wall. The empty state invites exploration rather than leaving the user in an empty room.

**Design principle:** Absorb complexity — the system should introduce concepts as the user's needs surface, not require the user to discover everything through footer buttons.

---

### O2. Entity management at workflow scale

**What's wrong:** Creating and managing 7 leadership roles through an inline form in a side panel is tedious. No entity browser, no overview of which entities participate in which channels, no templates or presets, no bulk operations.

**What good looks like:** An entity browser that shows the full cast — name, role prompt preview, model, channel assignments. Templates for common patterns ("create a leadership team for project X"). Inline creation during channel setup.

**Design principle:** Smart/dumb bottleneck — creating individual entities one at a time through a form is dumb bottleneck work. The system could offer smarter scaffolding.

---

### O3. Channel context field not available for chats

**What's wrong:** The "Channel context" textarea (Layer 4) only appears in settings for klatches, not for chats. A single-entity conversation can't have a persistent purpose expressed in L4.

**What good looks like:** Channel context is available for all channel types. Even a 1:1 chat can have a purpose — "this is my weekly check-in with the CXO." Layer 4 is what makes a channel more than a container for messages.

**Design principle:** Layer 4 is the unique Klatch contribution to the context model (channel-as-purpose). Limiting it to klatches undercuts the concept.

---

### O4. Mode selector descriptions need plain language

**What's wrong:** "All entities respond independently in parallel" is jargon. New users can't distinguish panel from roundtable without trial-and-error.

**What good looks like:** Plain-language descriptions with examples: "Panel — everyone answers your question separately, at the same time. Good for getting independent opinions." "Roundtable — each entity responds in turn, reading what others said first. Good for building on ideas."

**Design principle:** Communicate with clarity — the interface should explain, not assume expertise.

---

### O5. Sidebar footer needs information architecture

**What's wrong:** Theme toggle, entities button, import button, and create channel form are stacked in the footer with no organizational logic. Four different IA categories (settings, navigation, data operations, creation) sharing one space.

**What good looks like:** Settings (theme) separated from actions (import, create). Entity management promoted from a footer button to a more prominent surface if entities are a core concept. The footer has a clear purpose, not a grab bag.

**Design principle:** Absorb complexity — a grab bag pushes the burden of finding things onto the user.

---

### O6. File attachment UX needs modernization

**What's wrong:** Attachment requires clicking a paperclip button and using the native file picker. No drag-and-drop. File size errors use browser `alert()`. No file preview before send.

**What good looks like:** Drag a file onto the message input area. Drop zone highlight. Toast notification for size errors. Image thumbnail preview for image attachments.

**Design principle:** Smart defaults — the system should make file attachment as easy as typing a message.

---

### O7. No "jump to latest" when scrolled up

**What's wrong:** Auto-scroll is correctly disabled when the user scrolls up to read history, but there's no way to snap back to the bottom other than manually scrolling.

**What good looks like:** A floating "Jump to latest" button appears when the user is scrolled up. Clicking it smoothly scrolls to the most recent message.

**Design principle:** Small but meaningful quality-of-life improvement. Reduces friction in the daily omnibus review workflow where the user reads history then wants to return to the active conversation.

---

## Viewport adaptation gaps

### V1. Sidebar state resets on mobile channel navigation

**What's wrong:** Tapping a channel on mobile closes the sidebar. Re-opening may not preserve the expanded project state. Quick channel-switching requires repeated open/close cycles.

**What good looks like:** Sidebar remembers expanded project state across open/close cycles. Or: sidebar stays open briefly after channel selection to allow follow-up navigation.

---

### V2. Entity pills clip in header at narrow viewports

**What's wrong:** Channel name truncates with ellipsis, but entity pills don't. On phones, pills can push content off-screen.

**What good looks like:** Entity pills collapse to a count badge ("3 entities") at narrow viewports, expandable on tap.

---

### V3. Settings panels need mobile treatment

**What's wrong:** ChannelSettings and ProjectSettings slide down below the header at full width. On phones, they push the message list off-screen with no mobile-specific adjustments.

**What good looks like:** Settings panels on mobile are full-screen overlays (or bottom sheets) with their own navigation, rather than inline panels that displace the conversation view.

---

## What's NOT on this list (and why)

- **Visual design / aesthetics:** Not evaluated yet — the design principles document flags visual language as a developing area. Premature to prioritize visual changes before the IA and interaction problems are addressed.
- **Search / Cmd+K:** On the roadmap (Step 11). Important but not a current evaluation finding — it's a known future step.
- **Workflows / standing templates:** A cross-cutting future concept, not a current UI problem to fix. Will shape multiple sections when it arrives.
- **Entity dedup / merge:** Known gap (Daedalus offered to build it). Worth speccing but lower priority than the interaction and visibility issues above.
