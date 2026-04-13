# UX Evaluation

**Author:** Iris (UX designer/developer)
**Status:** First pass — observations grounded in code review, API testing, and export endpoint analysis
**Started:** 2026-04-12
**First pass completed:** 2026-04-13
**Evaluation frame:** Does the experience support the canonical use cases? Where does it fall short, and what should change?

---

## Evaluation approach

Grounded in two canonical use cases from Piper Morgan (daily omnibus synthesis, weekly work stream review) and the smart/dumb bottleneck heuristic. Evaluated against the design principles in `docs/ux/design-principles.md`, not against generic chat app heuristics. Klatch is pre-release (v0.9.x); this evaluates what the experience *should become*, not what production users experience today.

Sections that directly inform Phase 3 (export UI) are flagged and prioritized, per Calliope's note that Daedalus is being held pending these findings.

**Method:** Code review of all client components, API endpoint testing (including live export bundles), cross-reference with the Phase 1 format spec, and evaluation against the design principles.

---

## 1. Sidebar and navigation

*How does the user find and manage their conversations?*

### What works

- **Project-first accordion** with exclusive expansion (one project at a time). Auto-expands to the active channel's project — smart behavior that reduces hunting.
- **Channel prefixes** (`@` for chat, `#` for klatch) are immediately scannable. Users learn the pattern within seconds.
- **Source badges** ("CC" for Claude Code imports) signal provenance without noise.
- **Last-activity sorting** within projects surfaces recent conversations naturally.
- **Pinned #general** at the top provides a stable entry point.

### What doesn't work

- **No entity count visible per channel.** The API returns `entityCount` but the sidebar doesn't display it. Users can't tell at a glance whether a klatch has 2 or 5 participants — they must open settings to see. A small badge (e.g., "3e") next to klatch names would surface crucial information. *Burden test: the user bears the burden of remembering entity composition.*
- **Project settings unreachable on mobile.** The gear icon on project headers is `opacity-0 group-hover:opacity-100` — invisible on touch devices. No alternative affordance exists. Mobile users cannot edit project instructions or memory from the sidebar.
- **No search or filter.** With 30-50 real channels across 5-6 projects, scrolling is the only navigation. Cmd+K or a quick filter would dramatically reduce friction for power users.
- **No "recent" or "favorites" section.** Users who work across 2-3 active channels in different projects must expand/collapse projects repeatedly.
- **Chat/Klatch sub-labels only appear when both types exist** within a project. If a project has only chats, there's no "Chats" label, so users don't learn the distinction. Inconsistent mental model.

### The footer grab bag

The sidebar footer stacks four unrelated concerns vertically: theme toggle, entities button, import button, and "+ New channel" form. These are settings, navigation, data operations, and creation — four different information-architecture categories sharing one space because each needed a home. Functional but undesigned. *This is the "rookie error" xian identified — plumbing surfaced without organizational logic.*

### The create channel form

**Strengths:** Chat/Klatch toggle is clear, conditional fields appear only for klatch type (good progressive disclosure), entity picker enforces the 5-entity limit with a count display.

**Weaknesses:**
- **Mode selector descriptions are too technical.** "All entities respond independently in parallel" is jargon. A new user can't understand the difference between panel and roundtable without trial-and-error. These need plain-language descriptions with examples: "Panel — everyone answers your question separately, at the same time."
- **No inline entity creation.** If a user needs a new entity while creating a channel, they must cancel the form, open Entity Manager, create the entity, return, and re-fill the form. Breaks flow.
- **Project dropdown is flat and unsorted** for the klatch creation flow. With many projects, no way to find the right one quickly.

### Recommendation priority

1. Entity count badges in sidebar (quick win, high value)
2. Project settings accessible on mobile (high priority for touch users)
3. Mode selector copy improvement (quick copy update, reduces confusion)
4. Search/filter (medium effort, high value at scale)

---

## 2. Channel view — conversation experience

*What does it feel like to have a conversation in Klatch?*

### What works

- **Auto-scroll with manual override.** Scrolls to new content during streaming unless the user has scrolled up (80px threshold). Respects user intent — this is well-implemented and feels natural.
- **Entity attribution on multi-entity responses.** Colored avatar badges with first letter, entity name, and model label. Clear visual identity per speaker.
- **Fork marker between imported and native messages.** A clean visual divider with date, signaling where history ends and new Klatch-native conversation begins.
- **Smart artifact collapsing.** Tool-use summaries show individually up to 3, then collapse to "+N more" — expandable without overwhelming. Thinking indicators show count.
- **Streaming is smooth.** Real-time content updates via SSE callbacks, no jank, clear visual state.

### What doesn't work

- **Action buttons are keyboard-inaccessible.** Copy, retry, and delete are hidden by default and revealed on hover (`opacity-0 md:group-hover:opacity-100`). Tab focus cannot reach them. This is the single most critical accessibility failure in the application — it means keyboard-only users cannot copy, retry, or delete messages.
- **No confirmation for message deletion.** Delete is a single click that immediately removes the message. No undo, no "are you sure?" High-risk action with no safety net. (Entity deletion has a 2-click pattern; messages should too.)
- **Retry only works on the last assistant message.** If a mid-conversation response failed in a multi-entity roundtable, the user can't retry just that response — they must regenerate the entire last round. This blocks workflows with mid-sequence errors.
- **Streaming wait state is passive.** Messages awaiting content show "..." with no visual indicator of progress. A pulsing animation or subtle spinner would communicate "working" rather than "stuck."
- **No "jump to latest" button** when the user has scrolled up. Auto-scroll is disabled (correctly), but there's no way to snap back to the bottom other than manually scrolling.

### The empty state

Currently: Klatch logo + "Start a conversation" + "Send a message to begin." Minimal and clean, but offers no onboarding guidance. No indication of what Klatch can do, what a channel is, or how multi-entity conversations work. In directed mode, the placeholder says "Type @ to mention an entity" — helpful, but only after the user has already set up a directed channel. *The empty state is where the gap between "a stage for a cast of characters" and "a chat app" is most visible.*

### Multi-entity response rendering

Not directly observed in a live multi-entity channel (test database has no klatches with real conversations), but from code review: panel mode renders multiple assistant responses sequentially (each with its own entity attribution), roundtable mode shows responses in order with accumulated context, directed mode routes via @-mention. The rendering pattern is clean but untested in production scenarios.

---

## 3. Channel settings

*Can the user configure what a conversation is and does?*

### What works

- **Pinned files section** is clear and functional — shows file list with icons, download links, sizes, promote-to-project button, unpin button. The note "Pinned files are listed in the channel context sent to entities" explains the purpose.
- **Import provenance** for imported channels shows source, project, import date, event count — useful metadata.
- **Statistics card** for imported channels shows message count, tool call count, and top tools. Well-presented.

### What doesn't work

- **Prompt layers display is minimal.** Each layer gets a colored dot (green=active, gray=inactive) but no status detail — no character count, no file count, no project name. The prompt-debug endpoint returns all of this information (`ACTIVE — from project "Piper Morgan" (3180 chars)`) but the UI reduces it to a dot. *This is the biggest Phase 3-relevant finding: the backend has rich layer-by-layer data that the UI barely exposes.*
- **No assembled prompt preview.** The user cannot see what context actually gets sent to the model. The prompt-debug endpoint returns the full assembled prompt and its character count, but neither is surfaced.
- **Channel context field only appears for klatches, not chats.** This means a user can't add Layer 4 context to a single-entity conversation. The field should be available for both types — even a 1:1 chat can have a purpose.
- **No warning when a project is unlinked.** If a user removes the project association from a channel, they silently lose L2 (instructions) and L3 (memory + KB files) from the prompt assembly. No confirmation, no indication of what will change.
- **Compaction state is invisible.** If a channel's history has been compacted, the user has no way to know. No indicator, no summary shown, no "this conversation has been summarized" notice.

### Phase 3 implications

The channel settings panel is the natural home for the layer-aware context visibility that Phase 3 needs. The prompt-debug endpoint already provides the data. What's missing is the *presentation*:

- A layer composition view (the sparkline) showing each layer's contribution by name and size
- Fidelity indicators per layer (full/partial/absent/rebuilt)
- File inventory with scope clarity (which files are project-level vs. channel-level)
- Assembled prompt length with token estimate
- Provenance chain (if imported) rendered as a compact timeline

These are not new features — they're visual treatments of data the server already computes.

---

## 4. Entity management

*Can the user define and manage their cast of characters?*

### What works

- **Inline editing** — no modal stacking. Entity cards flip to edit forms in place. Fast to tweak definitions.
- **Role prompt field** is correctly labeled "Role prompt" per the nomenclature work. Good.
- **Effort level selector** with model-aware constraint (max only for Opus) and clear disabled state.
- **2-click delete** with 3-second auto-dismiss. Good confirmation pattern.
- **Color picker** is visual and quick — 8 presets with clear selection state.

### What doesn't work

- **No dedup story.** 1,275 entities in the test database, many duplicates from imports ("Analyst" appears 7+ times). No way to find, merge, or clean up duplicates. Daedalus has offered to build a merge operation if I spec it.
- **System prompt truncated in card view** — shows first line only. Users can't preview the full prompt without entering edit mode. A tooltip or expandable preview would help.
- **No unsaved changes warning.** If a user edits an entity and clicks Cancel, changes are silently discarded.
- **Effort level has no explanation.** Four buttons (low/medium/high/max) with no indication of what they mean — faster? cheaper? different quality? Tooltips needed.
- **Handle field has no uniqueness check** visible in the form. Server may enforce uniqueness, but the form doesn't surface conflicts.
- **Edit/delete buttons on entity cards are hover-only** — keyboard-inaccessible, same pattern as message action buttons.

### The cast-of-characters gap

The blog says "Claude is not one assistant. It's a cast of characters you direct. Klatch is the stage." The entity manager is where you define that cast — but it's tucked behind a footer button in a modal overlay. There's no entity *browser*, no way to see which entities participate in which channels, no entity templates or presets. The canonical use cases need seven leadership roles — creating and managing seven entities through the current inline form, one at a time, is tedious.

For the weekly ship workflow, a user needs to quickly see: "Who are my leadership roles? Are they all assigned to the Shipping News channel? What prompts do they have?" The current UI answers none of these questions without clicking into each entity individually.

---

## 5. Project settings

*Can the user organize work at the project level?*

### What works

- **Instructions and Memory** are separate textareas with helpful labels: "Instructions (CLAUDE.md / project rules — injected into every chat)" and "Memory (accumulated knowledge — MEMORY.md / claude.ai memories)." The layer function is communicated through the parenthetical.
- **Knowledge base file management** — upload, list, remove, with file icons and sizes. Label clarifies scope: "Knowledge base (N files — listed in L3 context for all channels in this project)."
- **Character count** on instructions and memory — useful for monitoring prompt size.
- **Import source info** shows path, timestamp, and source badge for imported projects.

### What doesn't work

- **No project statistics.** How many channels belong to this project? How many messages total? Which channels are most active? The user can see individual channels in the sidebar but has no project-level overview.
- **No link between project and channels.** From project settings, there's no way to see which channels are linked, jump to them, or manage the association. The relationship is one-directional (channel → project via dropdown).
- **No memory format indicator.** The memory textarea is a single field with no indication of structure. When the Phase 1 "typed" memory format arrives (per the evolution path in the format spec), the UI will need a way to present structured entries with metadata — but the current flat textarea provides no foundation for that.
- **No preview of assembled context.** Similar to channel settings — the user can edit instructions and memory but can't see how they combine with other layers.

---

## 6. Import flows

*Can the user bring existing Claude work into Klatch?*

### What works

- **Claude Code session browser** scans `~/.claude/projects/` and presents sessions for multi-select import. Path-based or file-upload fallback.
- **claude.ai ZIP import** with preview: checkbox selection per conversation, project assignment dropdown per conversation.
- **Conflict handling** shows existing channel and offers Replace / Fork / Go to existing.

### What doesn't work

- **No import fidelity readout.** After a successful import, the user sees: channel name, message count, artifact count (if any), and a "Go to channel" button. No indication of which layers were populated. The user doesn't know whether L2 (project instructions) was captured, whether L3 (memory) arrived, or whether L5 (entity prompts) were created. *Success looks the same regardless of fidelity — a full-context import and an empty-context import produce the same "success" message.*
- **No post-import orientation.** After import, the user goes to the channel and... then what? No guidance on "your imported conversation is missing project context — would you like to link it to a project?" or "entity prompts were not imported — you may want to customize the default entity."
- **Silent skipping.** When conversations are skipped during bulk import (duplicate or empty), the reason is minimal. "Skipped: 3" without explaining which ones or why.
- **Conflict dialog doesn't show enough context.** "This session was already imported" without indicating when, whether new messages exist, or what the consequences of each option are.

### Phase 3 implications

The import flow and the export flow are two halves of the roundtrip. The import side currently shows basic stats; the export side (Phase 3) will show layer-aware composition. There's a design opportunity to unify: the same "layer fidelity view" should be available both after import ("here's what you got") and before export ("here's what you're sending"). This creates a consistent language for context visibility that applies bidirectionally.

---

## 7. File and artifact features

*Can the user work with documents and files in context?*

### What works

- **File attachment** works via paperclip button with chip display showing filename and size. Clear before-send preview.
- **Pin/unpin** in channel settings with scope explanation.
- **Promote to project** button on pinned files — moves files from channel scope to project scope, making them available to all channels in the project.
- **Code block copy/save buttons** appear on hover with clear feedback ("Copied!", "Saved!" with checkmarks).
- **Artifact rendering** groups files, tool uses, and thinking blocks with sensible collapsing.

### What doesn't work

- **File attachment display uses plain text parsing.** User messages with files show `📎 filename (size)` which is matched by regex. This is fragile — if the format changes or a message contains a similar pattern, it could render incorrectly.
- **No drag-and-drop.** Attachment requires clicking the paperclip and using the native file picker. Drag-and-drop onto the input area is expected in modern interfaces.
- **File size errors use `alert()`.** When a file exceeds 10MB, the browser's native alert box appears — jarring and blocks interaction. Should be a toast notification.
- **No file preview before send.** For images, a thumbnail preview would prevent wrong-file mistakes.
- **Pin/unpin scoping not visually distinct.** In channel settings, pinned files are listed, but the user can't easily see which files are *only* in this channel vs. *also* in the project KB. The scope distinction (channel vs. project) isn't visually communicated.

### The "Paste It Again" question

The blog post names the anti-pattern: pasting the same document into every new conversation. Klatch's file domain model (project KB, channel pinning, promotion) architecturally solves this — a file pinned to a project is available to all channels without re-pasting. But the UI doesn't celebrate this. There's no moment where the user thinks "oh, I don't need to paste this again" — the feature is structurally present but experientially invisible. The promotion flow (message → channel → project) could be made more visible as a progressive arc.

---

## 8. Export and context packaging (Phase 3)

*Can the user take a conversation out of Klatch with maximum fidelity?*

### Current state

The export endpoint (`GET /api/channels/:id/export`) produces a well-structured zip bundle per the Phase 1 spec. The manifest is self-describing, versioned, and carries provenance, layer fidelity, trust levels, and file references. **The backend is production-ready. There is no UI for it.**

Tested against a live channel: the export correctly includes the manifest, conversation JSONL, layer sidecar files (L2/L3/L4 as markdown), and file attachments. Provenance chain tracks import history with per-hop layer fidelity. Entity definitions are inlined with prompt length.

### What the Phase 3 UI needs to surface

This is the most detailed section of the evaluation because Phase 3 is identified as the most significant UX challenge of the project.

**1. Layer composition view (the sparkline).** The format carries `length_chars` on every content reference and `prompt_length_chars` on entities. A visual breakdown showing "L2: 3,180 chars (project instructions) / L3: 0 chars + 3 KB files / L4: 28 chars + 2 pinned files / L5: 287 chars (Daedalus)" would give the user an at-a-glance understanding of what's in the package. This is the sparkline test as a feature.

**2. Trust indicators per item.** The format carries a trust vocabulary (human-authored, synthesized, cross-project, external, agent-observed, unattributed) on files and field notes. The UI should surface this as visual badges — not text labels, but color or icon signals that communicate provenance without requiring the user to read JSON.

**3. Provenance as a compact timeline.** The chain with `summary` and `layer_fidelity` per hop tells a story. xian and I agreed: not visible by default, but a subtle affordance that signals when the lineage is interesting (deep history, old origin, multiple environments). Tap to expand for the full chain. This should feel like a timeline, not a data table.

**4. The L5 gap as a handoff, not a loss.** Entity prompts are always present. Field notes are null in v1.0. The UI should frame this as: "Role prompt: carried. Behavioral calibration: will develop through interaction in the new environment." Not "WARNING: Layer 5 missing." The framing matters — it positions Klatch as a tool that helps you prepare for the handoff, not one that warns you about an unsolvable problem.

**5. Smart defaults with optional power-user access.** Export should do the right thing by default (full history, all layers, all files). Power users who want to choose compaction or exclude specific files can access those controls through progressive disclosure. The default experience is a single "Export" action that produces a good package without configuration.

**6. Bidirectional fidelity view.** The same layer composition view should work for both export preview ("here's what you're sending") and import readout ("here's what you received"). This creates a consistent visual language for context visibility that the user learns once and applies everywhere.

### What the Phase 3 UI should NOT do

- Show the raw assembled prompt (too verbose, not useful)
- Require the user to understand layer numbers (use meaningful labels: project instructions, project memory, channel context, role prompt)
- Present the export as a configuration problem (it's a service, not a form)
- Show fidelity warnings as alerts or errors (frame as informational, not failure)

---

## 9. Onboarding and first-run

*What happens when a new user opens Klatch for the first time?*

### Current state

The user sees: #general in the sidebar, the main area shows the Klatch logo with "Start a conversation" and "Send a message to begin." The sidebar footer has theme toggle, entities, import, and new channel buttons.

### What's missing

- **No indication of what Klatch is or does.** The blog says "a stage for a cast of characters" — the first-run experience says "a chat box." A new user who cloned the repo after reading the blog will find an empty room with no stage, no characters, and no indication of how to create them.
- **No guided path.** Three natural entry points exist (start a conversation in #general, create a new entity, import existing sessions) but none is suggested or prioritized. The user must discover these through the footer buttons.
- **No connection between entities and channels.** A new user doesn't know that entities exist, that they can be assigned to channels, or that multiple entities can participate in one conversation. The most distinctive feature of Klatch is completely hidden on first run.
- **No sample content or templates.** An empty Klatch provides no mental model of what a populated Klatch looks like. A "Create your first entity" prompt or a sample project with a few pre-configured entities would accelerate understanding.

### Design principle test

*Who bears the burden?* Currently, the user. They must discover the entity concept, figure out how to create entities, learn about channel types, and understand the relationship between projects, channels, and entities — all without guidance. The system could bear more of this through progressive onboarding (introduce one concept at a time as the user's needs surface).

---

## 10. Responsive design

*How does the experience adapt to different contexts?*

### What works

- **Hamburger menu on mobile** (`md:hidden`) with drawer overlay and backdrop. Standard pattern, clean implementation.
- **Message bubbles adapt.** 90% width on mobile, 75% on desktop. Prevents overly wide bubbles.
- **Touch-friendly targets.** Buttons have sufficient padding for tap interaction.

### What doesn't work

- **Sidebar state resets on mobile navigation.** When a user taps a channel, the sidebar closes. Re-opening the sidebar may not preserve the expanded project state. This creates friction for quick channel-switching.
- **Entity pills in the header don't clip gracefully.** On narrow viewports, the channel name truncates but entity pills don't — they can push content off-screen or wrap awkwardly.
- **Settings panels take full width without responsive treatment.** ChannelSettings and ProjectSettings slide down below the header but don't have mobile-specific layout adjustments. On a phone, the settings panel pushes the message list off-screen.
- **Project settings gear icon is invisible on touch devices** (hover-only reveal). See sidebar section above.
- **Code block copy/save buttons are hover-only.** On mobile, these buttons are always visible (good), but they overlap with the code content at narrow widths.

### Design principle test

*"Users who are mobile sometimes"* — the current implementation handles basic mobile layout (sidebar drawer, responsive widths) but hasn't been refined for mobile workflows. The biggest gap is sidebar state management and settings panel behavior, which make phone-scale interaction frustrating rather than adapted.

---

## 11. Accessibility

*Can all users access the experience?*

### Critical failures

- **Hover-hidden action buttons throughout the application.** Message actions (copy, retry, delete), entity card actions (edit, delete), code block actions (copy, save), and project settings gear icon are all revealed on hover only. **Keyboard-only users cannot reach any of these.** This is the highest-priority accessibility issue — it blocks core functionality for an entire category of users.
- **No keyboard shortcut system.** No Cmd+K, no Cmd+C for copy, no shortcut to navigate between channels. All interaction requires mouse or touch.

### Other concerns

- **Mention dropdown lacks ARIA attributes.** No `role="listbox"`, no `aria-selected`, no live-region announcements. Screen readers won't understand the mention autocomplete.
- **File input has no accessible label.** The hidden `<input type="file">` relies on the paperclip button as its only affordance — no `aria-label` or `<label>` association.
- **Semantic HTML is mostly present.** Buttons are `<button>`, inputs are `<input>`, textareas are `<textarea>`. The main gap is the action buttons that are `<button>` elements but unreachable via keyboard.
- **Color contrast appears sufficient** in both light and dark themes based on the CSS variable definitions, but formal WCAG testing has not been performed.

### Design principle test

*Who bears the burden?* Keyboard and screen-reader users bear the entire burden of discovering and accessing functionality that hover users get for free. The fix is straightforward: make action buttons always visible (or provide keyboard shortcuts as alternatives), add ARIA attributes to dynamic elements, and associate labels with form inputs.

---

## Cross-cutting concerns

### The canonical use cases

*Could someone run the daily omnibus synthesis or the weekly work stream review in the current Klatch UI?*

**Partially.** The architectural foundations are present — multi-entity channels, interaction modes, file pinning, channel context, project organization. But the experience gaps would make these workflows frustrating in practice:

- **Gathering phase:** Files can be pinned to a channel, but there's no way to pin multiple files at once or to see at a glance which files are pinned vs. available. The user would need to pin each omnibus log individually.
- **Convening phase:** Creating a multi-entity channel with 6-7 leadership roles requires selecting each entity from a checkbox list in a small scrollable div. If entities need to be created first, the flow breaks (see entity management section).
- **Synthesis phase:** The CoS entity responds in the channel, but the user can't see what context the CoS is working from — which layers are active, which files are pinned, what the assembled prompt looks like.
- **Review phase:** The user and CoS edit together conversationally, which works well in the basic chat model. But there's no way to "pin" or "mark" the final output as distinct from the discussion that produced it.
- **Export phase:** The export endpoint works, but there's no UI for it — the user would need to know the API endpoint and use curl.

The roundtrip (import → structured work → export) is architecturally complete but experientially incomplete. Phase 3 is the missing piece.

### The five-layer model as UX

*Does the user need to think in layers?*

**No — and the UI should keep it that way.** The five-layer model is an implementation framework, not a user-facing concept. The user thinks in terms of: "What does this entity know?" "What files can it see?" "What are the project's rules?" The UI should answer these questions using the user's vocabulary (entity, files, project, channel), not layer numbers.

The prompt-debug endpoint returns data labeled as "1_kitBriefing", "2_projectInstructions", etc. The Phase 3 UI should translate these to human-readable labels: "Environment briefing", "Project instructions", "Project memory", "Channel context", "Role prompt." The numbers are for developers; the names are for users.

### Workflows as the natural evolution of channels

See the cross-cutting concern added in the skeleton (April 12). The channel-as-workflow concept touches every section of this evaluation. The current UI has no concept of workflow phases, phase transitions, or recurring workflows. This is expected at v0.9 — the concept emerged during the interview process and isn't yet on the roadmap as a designed feature. When it arrives, it will require rethinking the sidebar (how do you find a workflow?), the channel view (how do you see which phase you're in?), and the channel settings (how does L4 express a workflow's purpose and rules?).

### The blog promise vs. the UI delivery

*Refinement (from xian, April 12): the blog is not a contract. Evaluate the product against the canonical use cases, not the blog's explorations.*

The blog promises a context architecture, transparent agent transitions, knowledge that rises as it proves value, and "a stage for a cast of characters." The UI delivers a competent chat interface with multi-entity support and a sophisticated backend. The gap is in *visibility* — the backend knows things the UI doesn't show. The five-layer model, the provenance chain, the trust vocabulary, the file scoping, the compaction state — all of this exists in the server and the export format, but the user interacts with a chat interface that shows messages and a settings panel that shows dots.

Phase 3 is where this gap begins to close. But there's an opportunity to close it incrementally before Phase 3: surfacing prompt-debug data in channel settings, adding a layer composition view, showing import fidelity after import. These don't require the full export UI — they're information design improvements to existing surfaces.
