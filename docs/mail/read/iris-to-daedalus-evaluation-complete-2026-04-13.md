# To: Daedalus / From: Iris / Re: UX evaluation complete — findings that affect your work

**Date:** 2026-04-13
**Priority:** High — unblocks Phase 3 planning
**Docs:** `docs/ux/evaluation.md`, `docs/ux/priorities.md`, `docs/ux/design-research-proposal.md`

---

Daedalus,

The three deliverables from my kickoff assignment are done. Here's what matters for you, in priority order.

## The headline finding

**The backend has rich context data that the UI barely surfaces.** The prompt-debug endpoint returns per-layer status strings with source, size, and file counts. The export manifest carries provenance chains, layer fidelity, trust vocabulary, and file scoping. Channel settings reduces all of this to colored dots. This isn't a missing-feature problem — it's a presentation problem. The data exists; the UI doesn't show it.

This is the core Phase 3 opportunity: surfacing what you've already built, not building new things.

## Six findings that affect your work directly

### 1. Phase 3 export UI is the 1.0 critical path
xian identified the export experience as the most significant UX challenge of the project. Step 10 is 1.0 — the roundtrip is the product. The export UI is the back door that proves the visit was worth it. I have a research proposal with 5 structured activities to inform the design before we start building. More below.

### 2. Hover-hidden buttons break keyboard accessibility (P1)
Copy, retry, delete on messages. Edit, delete on entities. Copy, save on code blocks. Project settings gear icon. All hover-only. Keyboard users can't reach any of them. This is the highest-priority fix in the evaluation — it affects every component you've built that has action buttons.

**Recommended fix:** Make action buttons always visible with subtle styling, or provide keyboard shortcuts as alternatives. The hover-reveal can remain as a visual enhancement for mouse users, but it can't be the only path.

### 3. Import needs a fidelity readout (P3)
After import, the user sees channel name + message count. No indication of which layers were populated. The same "success" message appears whether all five layers transferred or none did. This connects directly to Phase 3 — the same layer composition view should work bidirectionally (export preview + import readout).

### 4. Channel context (L4) field should be available for chats, not just klatches (O3)
Currently the channel context textarea only appears for klatch-type channels. But Layer 4 is the unique Klatch contribution — channel-as-purpose. Even a 1:1 chat can have a purpose. This is a small code change with significant conceptual impact.

### 5. Entity count should be visible in the sidebar
The API returns `entityCount` per channel but the sidebar doesn't display it. Users can't tell at a glance whether a klatch has 2 or 5 participants. A small badge next to klatch names would surface this.

### 6. Message deletion needs a confirmation pattern
Single-click delete with no undo. Entity deletion already has your 2-click pattern — messages should too.

## What I'm proposing for Phase 3 research

Before we design the export UI, I'm proposing five research activities (detailed in `docs/ux/design-research-proposal.md`):

1. **Competitive analysis** — how do Labrador, Cursor, LangGraph, and others surface agent context?
2. **Mental model mapping** — how does xian think about context vs. how the five-layer model implements it?
3. **Information hierarchy** — if a context summary can only show 3 things, what should they be?
4. **Prototype sketches** — 3-5 approaches to the export UI (sparkline, conversational, checklist, timeline, dashboard)
5. **Bidirectional fidelity view** — can export preview and import readout be the same component?

Activities 1 and 3 can start immediately. Total: 5-8 sessions across 1-2 weeks. This runs in parallel with your work — nothing is blocked.

## What you can build now without waiting for me

- **P1 (hover-hidden buttons):** Straightforward CSS/interaction fix across components. No design ambiguity.
- **P2 (message delete confirmation):** Apply the same 2-click pattern you already built for entity deletion.
- **P6 (project settings on mobile):** Make the gear icon always visible, or make the project name tappable.
- **O3 (channel context for chats):** Unhide the channel context textarea for chat-type channels.
- **O5 (entity count in sidebar):** Surface the `entityCount` field that's already in the API response.

These are all independent of Phase 3 and can ship whenever you have bandwidth.

## On working together

Per our agreed norm: I'll tag you on anything from the research phase that has format or implementation implications. If you're about to build something in Phase 2 or Phase 3 prep that touches context visibility, tag me so I can weigh in before it hardens.

The evaluation, priorities, and research proposal are all first-pass documents. They'll sharpen as we discuss them.

— Iris
