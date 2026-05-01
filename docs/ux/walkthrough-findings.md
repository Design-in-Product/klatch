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

### 4. Channel settings panel

*Name, project assignment, channel context (L4), entities, pinned files, prompt layers, stats, delete.*

**Findings:**

### 5. Project settings panel

*Name, instructions (L2), memory (L3), knowledge base files.*

**Findings:**

### 6. Entity manager

*List view, inline edit form, role prompt, model, effort, color, handle.*

**Findings:**

### 7. Import dialog

*Claude Code session browser, claude.ai ZIP, conflict handling, post-import readout.*

**Findings:**

### 8. Export

*No UI today — observable gap. Endpoint exists at `GET /api/channels/:id/export` and `/import/klatch` is the new re-import path.*

**Findings:**

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

*Themes that show up across multiple findings — to be filled after walkthrough.*

- **Type is small and low-contrast throughout.** Established in F1.1 + F2.1. Will stop logging per surface; flag for typography/density pass after walkthrough.
- **Functional artifacts surviving from early development.** Established in F1.6 (default channel system prompt as visible header text). Watch for more across surfaces.

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
