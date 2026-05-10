# Walkthrough Findings

**Authors:** xian (driver) + Iris (note-taker)
**Date:** 2026-04-30
**Method:** Two-pass walkthrough of the running Klatch app at v0.10/1.0-beta.
- Pass 1: Surface skim — observable issues at a glance, no deep workflow execution
- Pass 2: Realistic scenario — set up the Shipping News weekly review workflow, capture friction
**Companion:** Manual Agent Experience Testing (MAXT) on round-trip scenarios planned for after the walkthrough

---

## Pass 1: Surface skim

xian drives, sharing observations and screenshots; Iris captures findings.

### 1. First-load impression

*What the user sees on opening the app for the first time.*

**Caveat noted:** Database is xian's working DB, not a clean slate. Real first-time experience would benefit from a DB reset / demo seed; deferred. Current findings still valid for "experienced user opens the app" framing.

**Findings:**

- **F1.1 — Type is small and low-contrast.** Gray-on-white at small sizes throughout the sidebar and channel header. Small caps for project headers compounds the legibility issue. Hard to read at a glance.
- **F1.2 — Large empty content area with unclear call to action.** Visual hierarchy doesn't direct the user toward the primary action. The blank center reads as "something should be here but isn't."
- **F1.3 — Default channel system prompt is generic and visible.** "You are a helpful assistant." rendered in the header is a stray functional artifact from early development that never got revisited. Reads as boilerplate, not as the channel's purpose.
- **F1.4 — Empty-state copy treats Klatch as a chat front-end.** "Start a conversation / Send a message to begin." The framing is generic chat-app, not "a stage for a cast of characters." First impression undersells the product.
- **F1.5 — API key configuration is invisible from the UI.** No setup flow, no "connect your Anthropic account," no indication that the app is talking to Claude on the user's behalf. xian is connected because xian configured `.env`; a new user has no path. (Out of scope for "review my user experience" framing today, but a 1.0-beta gap.)
- **F1.6 — Functional artifacts surviving from early development.** F1.3 is one example; pattern likely repeats elsewhere. Worth a sweep for "things that work but were never revisited" as a category.

### 2. Sidebar

*Project accordion, unassigned section, #general, footer.*

**Findings:**

- **F2.1 — Type is small and hard to read.** Same problem as F1.1; carries through the whole sidebar (channel names, project headers, counts, footer buttons). Becoming a cross-cutting finding — flag for the polish/density/typography pass.
- **F2.2 — Reads as "list of chats" by default.** Superficially makes sense as a Slack-like index, which means the user pattern-matches it to a familiar metaphor and stops looking for what's distinctive. The Klatch concepts (projects, klatches, entities, the @ vs # prefix system) are present but not communicated.
- **F2.3 — Section meaning is unclear.** "AAXT TEST PROJECT", "INSTRUCTIONS ONLY PR...", "KLATCH", "UNASSIGNED" — no labels or affordances explaining what each section *is* or what the user can *do* with it. The user has to infer from contents. Project headers in small caps with a count and a chevron read as decoration, not as interactive structure.
- **F2.4 — Project name truncation breaks comprehension.** "INSTRUCTIONS ONLY PR..." cuts off mid-word with no tooltip or expand affordance visible. The user literally can't read the section name.
- **F2.5 — Confirms F2.4 from prior sessions.** "Unassigned" lacks contextual cue — no indication of why a chat is unassigned or what unassigned means. Carried over from Iris's Session 5 evaluation; observable here.
- **F2.6 — Lower-left block is a hodgepodge.** Dark mode toggle, Entities, Import, "+ New channel" stacked in the footer. Not inherently confounding, but doesn't read as well-thought-out. Confirms xian's Session 6 observation that this is undesigned grab-bag territory. Re-noted because it's observable at a glance, not just on use.

### 3. Channel header + content area

*Channel name, entity pills, mode badge, messages, action buttons, empty state.*

**Findings:**

- **F3.1 — "A relatively familiar looking chat UI."** xian's first impression. Knowing these are Claude chats, it's not instantly clear where or how this UI differs from any other Claude chat UI. The structural distinctions that make Klatch different (entities, modes, layered context, file pinning, provenance) are absent or invisible at the content-area surface. The user pattern-matches to "chat app" and stops looking for what's distinctive — directly parallels F2.2 at the sidebar level.
- **F3.2 — Single-entity channels genuinely ARE just a chat UI.** This is partly accurate: with one entity, no mode behavior, no pinned files, no project context shown, the content area has nothing distinctive to show. The question this raises: should *something* communicate the structural difference even when the channel isn't using distinctive features? Or is "looks like a chat when used as a chat" correct and the differentiation lives at the configuration surface, not the conversation surface?
- **F3.3 — Multi-entity rendering still unobserved.** The cases where Klatch should look different (panel/roundtable/directed mode with multiple entities responding) aren't present in the test channels xian is looking at. To assess these surfaces we'll need a real multi-entity klatch — which is exactly what the Piper Morgan workstream review use case will require us to set up. The composition gap (xian Session 6) means we may discover *en route* whether this differentiation surface even exists today.

### 4. Channel settings panel

*Name, project assignment, channel context (L4), entities, pinned files, prompt layers, stats, delete.*

**Findings:**

- **F4.1 — No clear boundary or transition state on open.** The display changes when the user clicks to expand settings, but nothing signals *what* changed. No animation, no clear container, no header for the panel itself. The user has to infer they're now looking at a different surface.
- **F4.2 — Modal-vs-not is ambiguous.** At default zoom the panel covers the whole chat area, reading as modal. Zooming out reveals it's actually an overlay with the chat still active beneath it — possibly not truly modal. The user can't tell from the visible UI whether the conversation is paused, dismissible, persistent, or what would happen if they clicked through. The disclosure pattern (overlay vs. modal vs. inline expansion vs. separate view) isn't communicated.
- **F4.3 — "Dog's breakfast" / junk drawer.** xian's framing: the panel is not really designed — it's a somewhat-functional accumulation of fields. Each item works in isolation; nothing organizes them as a coherent view. Explicitly NOT a critique of Daedalus or Argus's implementation: they delivered to spec on the layers we defined. This is a design gap that surfaces when the spec didn't say what the panel is *for* beyond holding fields.
- **F4.4 — High-leverage surface, undesigned. ⚠️** This panel is where the structural difference from a regular chat UI should be most visible. Entity assignment, interaction mode, channel context (L4), pinned files, prompt layer status, import provenance — every distinctive Klatch concept lives here. **This panel IS the value proposition, surfaced.** That it's currently a junk drawer is the single most consequential finding from the surface skim so far. If a user opened this and saw something coherent and powerful, they'd understand what Klatch is. Right now they see a settings page.

### 5. Project settings panel

*Name, instructions (L2), memory (L3), knowledge base files.*

**Findings:**

- **F5.1 — Same "undesigned accumulation" pattern as Surface 4.** Project settings panel is another junk drawer of fields. Each works in isolation; nothing organizes them as a coherent view of what the project IS. The findings from F4.1–F4.4 apply structurally here too (no clear transition state, modal-vs-not ambiguity, junk drawer, high-leverage surface undesigned).
- **F5.2 — Panels need to scaffold workflow, not just provide fields. ⚠️** xian's framing: "For each aspect of the project or object, not only do we need to provide affordances for inspecting and interacting with them, but we need to provide guidance around how to work with them, particularly before and after migrations either way." This is a generalization of F4.4. The panel's job isn't only "be the identity surface" — it's also **"guide the user through working with this object, especially at the boundaries"** (import in, export out, migration between environments). Today the panels expose state; they don't help the user act on it at the moments that matter.
- **F5.3 — Klatch is responsible for the memory layer when accessing chats via API. ⚠️** Architectural realization with direct UX consequences: in claude.ai, the memory layer is maintained by Anthropic's UI (memories.json is curated through the claude.ai surface). When Klatch accesses Claude via API, that maintenance responsibility falls to Klatch. Currently the project memory field is a textarea — there's no maintenance scaffolding (when was it last updated? what should be in it? what's stale? how does it grow over time?). This is a gap that grows in importance as Klatch is used over long horizons. Connects to Janus's memory research from April and to PM's ADR-054 composting pipeline; the work is already mapped at the architectural level, but UX scaffolding for the user-facing maintenance experience doesn't exist today.

### 6. Entity manager

*List view, inline edit form, role prompt, model, effort, color, handle.*

**Findings:**

- **F6.1 — Entities listed without context for where they're used.** xian sees three entities (one generic "helpful assistant" with Opus, two imported role descriptions for Daedalus and Argus). What he can't see: which channels each entity participates in, when they were last active, what their lineage is. The entity manager is its own island; the user can't tell from this surface how entities relate to channels or history.
- **F6.2 — "Entity" may be the wrong word in the UI.** xian: not sure "entity" is the right word for what these are; "role" might be more accurate. This is a nomenclature question the team has touched without closing. Worth deciding deliberately as part of the panel-as-identity-surface work — the word the UI uses shapes the user's mental model.
- **F6.3 — Import-vs-create asymmetry persists. ⚠️** xian's standing observation (Session 5, 6, 7): he'd expect to import roles into Klatch more often than create them from scratch. The current entity manager privileges creation (the + button) and has no path to import from here. Import lives in the footer grab bag (F2.6) and produces channels, not entities. The entity reframe (filed 4/18) says entities are existing conversations promoted into roles; this surface doesn't reflect that direction at all.
- **F6.4 — "+" produces a dumb form with no guidance.** Same junk-drawer pattern as F4 and F5. Form fields exist; nothing helps the user write a useful role prompt, paste an existing one cleanly, or understand what makes a role prompt good. xian flags an LLM-assisted creation path as plausible future work (well-prompted assistance for "describe this role and I'll draft the prompt"), but today the form is bare scaffolding.
- **F6.5 — The composition gesture is not findable from the entity manager. ⚠️** The user can manage entities here but can't get one into a klatch from this surface. The composition gap (xian Session 6, biggest gap of the walkthrough) is reinforced: even when the user is *looking at* entities, the path to "put these entities in a room together" doesn't exist on this surface. We still haven't found where it lives — because it doesn't yet.
- **F6.6 — Model setting on the entity may be misplaced.** xian raises this aloud, not resolved: in the entity-as-role reframe, model might be a property of the conversation (what model is running this channel right now), not the role definition (who this is). The entity might carry a *default preference*, but the channel determines the active model. Worth a real conversation about where model selection belongs — entity, channel, or both layers with clear precedence. Connects to the Opus 4.7 default-flip context Argus surfaced in April.
- **F6.7 — Entity manager opens on the right, disconnected from the Entities button on the lower left. ⚠️** No expectations set by the affordance. Clicking a left-footer button to get a right-side panel breaks spatial logic. This is "classic undesigned 'admin' approach to the core UI." xian's reframe: **"These are not the edge-case settings/prefs for a chat app but the unique musculature that preserves context in these chat-agent workflows."** This is sharper than the F4.4 value-proposition framing — the panels aren't *settings*, they're *musculature*. They're how the product moves. Treating them as admin overlays is structurally wrong.

### 7. Import dialog

*Claude Code session browser, claude.ai ZIP, conflict handling, post-import readout.*

**Findings:**

- **F7.1 — Narrow dialog box for a first-class verb.** Confirms Session 6: import is a primary action of the product but presented as a modal dialog. Reinforces "import wants a full-screen experience" (Session 6).
- **F7.2 — Technical jargon leaking into the surface.** "jsonl" appears multiple times in the dialog. Implementation terminology surfaces directly to the user without translation into product language. Same pattern as F1.3 (default channel prompt as visible header text): functional artifacts surviving from early development.
- **F7.3 — IA and labeling are a jumble.** The dialog's structure doesn't communicate what the user is doing. No clear guidance on the best or easiest path through it. The user is presented with options without orientation.
- **F7.4 — Claude Code browse flow bifurcates each session as a potential project. ⚠️** Treats every session as if it might be its own project. The result: horrendous fragmentation of what should be coherent groupings. Sessions belonging to one project read as if they're separate projects.
- **F7.5 — "All" or "chosen" by default, no unselect-all.** Selection controls are missing the inverse affordance. Easy to start over-broad, hard to recover from there.
- **F7.6 — Session labels read as serial numbers, not work. ⚠️** Sessions appear as "session c5535c's chat called ef776fbb..." style labels — hexadecimal identifiers, no semantic surface. Today's test data wasn't overwhelming, but on xian's other laptop the list was. **The UI shows metadata, not the content's surface.** Needs better extraction: first prompt, derived name, a short content fingerprint — anything that lets the user recognize what they're looking at. Clustering of generic stuff would also help.
- **F7.7 — Actual import behavior not yet tested.** xian deferring import action to the e2e testing flow. Surface skim only captured findings about the dialog itself.

### 7. Import dialog

*Claude Code session browser, claude.ai ZIP, conflict handling, post-import readout.*

**Findings:**

### 8. Export

*Phase 3.5d review UI was specced and shipped — re-evaluating live.*

**Findings:**

- **F8.1 — Export is findable but not discoverable.** xian: "a subtle 'export' link in the channel settings for a single-entity chat." Had to look around to find it. Confirms Session 6: export is a first-class verb buried as a settings sub-action. Not visible from the channel surface, not visible from the sidebar, only reachable after expanding channel settings and reading carefully.
- **F8.2 — "Preparing export preview..." state is ambiguous.** xian: "can't tell if it's working or hanging." Loading state has no progress, no spinner, no estimated time. Phase 3.5 generation (briefing + extraction) takes real time because it's making LLM calls; the user has no signal that work is in progress vs. stalled.
- **F8.3 — Phase 3.5d review UI IS shipped and working. 🎯** This is the surface I specced (`iris-to-daedalus-phase35d-spec-2026-04-14.md`). Daedalus built it. xian's reaction: "results. interesting. needs more explanation for sure, but intriguing... looks like it has good bones?" The bones exist: Package contents section + Field notes section + per-note Accept/Reject + citations + confidence + source. This is the meaningful-review surface we agreed should not be a rubber stamp.
- **F8.4 — The field notes themselves look genuinely good.** Sample observations visible in the screenshots: "Xian operates as a 'smart bottleneck' — they want collaborative design, not code generation"; "Xian thinks in terms of design principles and names them explicitly — Gall's Law, Tesler's Law, pace layers"; "Don't claim work is done without verification. The session wrap protocol exists because agents have fabricated completion records." These pass the five-criteria filter from our consensus (actionable, specific, non-obvious, relational, durable). The Phase 3.5 extraction is producing real signal.
- **F8.5 — Package contents section reads as sparkline-style composition.** "Project instructions: 7,034 chars from 'klatch'", "Project memory: 8,623 chars", "Role prompt (Claude): 28 chars", "Conversation: 143 messages", "Entities: 1". This is exactly the per-layer composition the Phase 1 sparkline test enables. **The visibility-gap finding (F1/F2/F3 + Iris Session 5 evaluation) is partially solved here, at the export surface.** The same data should be visible at the channel settings level, not only when packaging for export.
- **F8.6 — "Needs more explanation."** The mix of content types in the preview is intriguing but not framed. Top section (Package contents) lists payload by category; bottom section (Field notes) is the Phase 3.5 review interface. The user isn't told *what these are*, *why they're separated*, *what happens when they Accept or Reject*, *what "Self-reported high confidence" means*, *how field notes relate to the package contents*. Good bones, missing voice.
- **F8.7 — Layer-status indicator appears to be cut off at modal bottom.** A purple bar with text starting "Project memory: Yes. One fact: 'Xian (Christian Crumlish, xian@kindsys.us) is a Product Manager at Kind..." is visible at the bottom of the export preview modal, partially obscured. Unclear if this is intentional content (a project memory summary) or an overflow / clipping issue. Worth verifying.
- **F8.8 — Only one extraction source visible.** All field notes shown are tagged "Self-reported" (Mode 2, self-authored briefing). The dual-mode design we agreed on (Mode 1 external extraction + Mode 2 self-authored briefing, with agreement/disagreement signaling) doesn't appear to be surfacing both modes. Either extraction wasn't invoked for this preview, or the UI isn't yet distinguishing them. Worth checking — this is the cross-validation pattern we considered the highest-value design element.
- **F8.9 — No transport selection visible.** From the discussion in Session 6, we agreed export should be transport-aware: claude.ai gets the fidelity-loss panel + Phase 3.5 defaults on; canonical zip gets defaults off; honest declaration of L4 loss. Today's preview shows package contents and field notes but doesn't ask the user to pick a destination format. Either it's the canonical zip by default with no destination selection (in which case the fidelity-loss UX hasn't landed yet), or the destination is selected elsewhere and we haven't found that flow yet.

**Net read: this is the strongest surface in the app so far.** It's the one place where the Phase 3.5 work has produced a coherent meaningful-review interface, where the sparkline composition is partially visible, and where the user can see *what the package is and what they're committing to.* It also needs more explanatory voice, transport selection, and dual-mode visibility — but the bones xian noticed are real. The musculature framing from F6.7 applies here too, and this is the surface where it's least undeveloped.

---

## Pass 2: Realistic scenario — Shipping News weekly review

*Set up the workflow xian actually wants to run.*

### Phase A: Bring leadership roles into Klatch as entities

**Friction observed:**

### Phase B: Compose them into a klatch with the right interaction mode

**Friction observed:**

### Phase C: Pin the relevant context files (omnibus logs, etc.)

**Friction observed:**

### Phase D: Run the synthesis (CoS + xian editing pattern)

**Friction observed:**

### Phase E: Export the result

**Friction observed:**

---

## Cross-cutting patterns

*Themes that show up across multiple findings.*

- **Type is small and low-contrast throughout.** F1.1 + F2.1. Flag for typography/density pass.
- **Functional artifacts surviving early development.** F1.6 (default prompt as header text), F7.2 ("jsonl" in import dialog), F7.6 (serial-number session labels) all instance the same pattern — implementation defaults visible to users as if they were product copy.
- **Overlay panels have a "skirt" problem.** F4.2 + F8.7 are the same pattern: panels read as modal but aren't, with the chat content peeking out the bottom or sides at certain zooms. The disclosure pattern (modal / overlay / inline / separate view) isn't communicated and isn't structurally consistent.

---

## Initial synthesis

*Written at the close of the surface skim, before the realistic-scenario pass. Names the load-bearing patterns without yet proposing fixes.*

### The headline finding

**Klatch's distinctive value lives in surfaces that read as settings/admin rather than as the product's functional musculature.** Every concept that differentiates Klatch from a generic Claude chat UI — entity assignment, interaction mode, channel context (L4), pinned files, project memory, prompt layers, import composition, export packaging — lives in panels that have been built as field accumulation rather than as deliberately designed surfaces.

xian's reframe at F6.7 is the load-bearing principle: *"These are not the edge-case settings/prefs for a chat app but the unique musculature that preserves context in these chat-agent workflows."* The panels are organs, not admin. Today they're treated as admin.

### Three patterns across the skim

**1. "Looks like chat" pattern-match.** At every surface where Klatch first shows its hand to the user, the user pattern-matches it to a chat app and stops looking for what's distinctive.
- F2.2: Sidebar reads as Slack-like list of chats. Klatch concepts present, not communicated.
- F3.1: Channel content area is "a relatively familiar looking chat UI."
- F8.1: Export buried as a settings sub-action, not visible as a primary verb.

The product's value proposition is invisible at the surfaces where users would discover it. They have to know what to look for to find it.

**2. Musculature treated as admin.** The panels that *should be* the product's functional organs are designed as accumulation, not as surfaces with a job.
- F4.3 / F5.1: Channel and project settings as "dog's breakfast" / junk drawer.
- F6.7: Entity manager opens on the right disconnected from the Entities button on the lower left — classic "admin" approach to the core UI.
- F7.3 / F7.4 / F7.6: Import dialog as a jumble — narrow modal, technical jargon, serial-number session labels that hide content.

Each panel's job is unclear beyond "hold fields." A coherent surface needs to answer **what is this object** (identity), **what can I do with it** (affordance), and **what should I do with it, especially at boundaries** (guidance, per F5.2).

**3. The visibility gap closes at exactly one surface.** F8.3-F8.5: the Phase 3.5d export review UI is the strongest panel in the app. Not polished — but organized around a *task* (review what's being packaged) and a *concept* (per-source field notes with provenance and citations). The Package contents section is the sparkline test as a visible feature. **The architecture and the design language to solve the visibility gap exist; they just haven't been pushed to the other surfaces.**

### Three things the walkthrough confirmed about prior findings

- **The composition gap is real and three times confirmed.** Not findable from the sidebar (F2), not visible at the channel content area (F3.3), not reachable from the entity manager (F6.5). The product's central gesture — bring existing conversations into a room together — has no home in the UI.
- **The entity reframe has not landed in the UI.** F6.3 — the entity manager still privileges creation over import/promotion. The most consequential product finding of April 14 has not yet been threaded into the surface where it belongs.
- **Klatch is responsible for the memory layer when accessing Claude via API.** F5.3 — currently treated as a passive textarea. The maintenance scaffolding doesn't exist.

### Two product principles emerging from xian during the walkthrough

- **Panels are musculature, not admin.** (F6.7) Treating them as settings overlays misnames what they are and how they should be designed.
- **Klatch should be transparent about what it currently can and cannot import and export, down to the layer level.** (xian, post-Surface 8) A stronger statement than "show fidelity loss at transport selection" — this is a baseline product property, not just an export feature. Applied broadly: every panel that involves importing, exporting, layering, or transferring context should disclose its current capabilities and limits honestly.

### What Pass 2 (realistic scenario) will test

The Piper Morgan workstream review setup is the most direct test of the patterns above:
- Can xian *find* the Piper Morgan leadership conversations among the serial-number-labeled sessions? (F7.6)
- Can he *select* the ones he wants from the bifurcated browse flow? (F7.4)
- Can he *compose them into a klatch with the right interaction mode*? (composition gap)
- Can he *pin the relevant context files* (omnibus logs, prior ship docs)? (file features unexercised in skim)
- Can he *run the synthesis*? (multi-entity content area, mode behavior, unexercised in skim)
- Can he *review and export the result*? (Phase 3.5d review surface — the strongest panel)

Pass 2 will tell us where the path breaks and where it holds.

### What this synthesis does NOT yet propose

This is a diagnosis, not a treatment plan. xian flagged a separate conversation on triage and immediate patchwise usability fixes vs. deeper design work. That conversation comes next — likely after Pass 2, since the realistic scenario will sharpen which patches are urgent vs. which can wait for the holistic redesign.

---

## Known issues already named (carried over from prior work)

These don't need re-finding; they're context for the walkthrough:

- **The composition gap** — no UI surface for composing a klatch from existing entities (xian, Session 6)
- **Import findability** — buried in footer grab bag with theme toggle and entities button (xian, Session 6)
- **Import-as-modal is wrong** — should be a full-screen experience for first-class verbs (xian, Session 6)
- **The visibility gap** — backend computes rich context (5 layers, fidelity, provenance, trust, file scoping) that the UI barely surfaces (Iris, Session 5)
- **Sidebar IA** — three jobs (navigation, communication, actions) with uneven success; entity existence invisible from sidebar (Iris, Session 5)
- **Empty state doesn't reflect channel purpose** — no entities, mode, pinned files visible (Iris, Session 5)
- **Multi-entity rendering** — needs live observation; not yet exercised in production data (Iris, Session 5)
- **Hover-hidden action buttons** — keyboard accessibility issue across components (Iris, Session 4 evaluation)
- **Entity reframe** — entities are existing conversations promoted into roles, not abstract definitions (Iris + xian, filed as direction note 4/18)
- **L4/L5 round-trip loss** — settled framing (transport-aware fidelity-loss panel + transport-aware Phase 3.5 defaults + honest declaration of L4 loss; Session 6)
- **UUID-matching UX on re-import** — pending Iris read on four shapes (Daedalus memo 4/28)
