# Klatch Object Model

**Authors:** Iris + xian
**Started:** 2026-05-11
**Status:** Working document — first pass. Refined in conversation.

---

## Purpose

What are the *things* in Klatch from the user's point of view, and how do they relate? This document is not the database schema. It's the conceptual model that the UI, the vocabulary, and the workflows should all project from.

Surfaces are projections of the object model. If the model is muddled, every surface inherits the muddle. This document is where we sort it out before designing surfaces.

---

## Candidate objects (first cut)

Bullet list, brief gloss each. The point isn't a final taxonomy yet — it's getting all the candidates on the table so we can see which are real, which are aspects of others, and where we have tensions.

### Conversational objects

- **Message** — a single utterance (user or assistant)
- **Conversation** — a sequence of messages with a particular agent over time
- **Channel** — a container where conversations happen; the Slack-inspired surface
- **Klatch** — a specific kind of channel: multi-entity, group conversation
- **Chat** — the other kind of channel: single-entity, 1:1

### Identity objects

- **Entity** — current term for the agent-persona record (name, prompt, model, color, handle)
- **Role** — what xian sometimes calls it; the *function* an entity plays in a klatch
- **(User)** — xian himself; implicit, currently

### Organizational objects

- **Project** — a grouping unit for channels; carries instructions + memory + knowledge base files
- **(Workspace / instance)** — implicit; there's only one today

### Context objects

- **Layer** — one of the five layers in prompt assembly (L1–L5)
  - **Kit briefing** (L1)
  - **Project instructions** (L2)
  - **Project memory** (L3)
  - **Channel context** (L4) — also called channel addendum
  - **Role prompt / entity prompt** (L5)
- **Pinned file** — a file attached at channel scope
- **Knowledge base file** — a file at project scope

### Reflection / behavioral objects (Phase 3.5)

- **Field note** — a behavioral observation about how to work with the user
- **Reflection (micro-reflection)** — a session-end or per-correction note
- **Briefing (handoff briefing)** — Mode 2 of Phase 3.5: entity writes for its successor
- **Extraction** — Mode 1 of Phase 3.5: external LLM observes the conversation

### Transport / packaging objects

- **Context package** — the canonical export bundle (`klatch.context.v1`)
- **Manifest** — the structured JSON inside the package
- **Transport** — claude.ai / claude-code / canonical zip / MCP
- **Provenance** — chain of source events showing where a conversation has been
- **Source** — where a conversation came from (`klatch` / `claude-code` / `claude-ai`)

### Workflow concepts (less developed)

- **Interaction mode** — panel / roundtable / directed (currently a channel attribute)
- **Phase** — a stage within a workflow (e.g., panel drafting → CoS synthesis → review)
- **Synthesis** — the output of a multi-agent workflow
- **Meeting** — the channel-as-recurring-meeting concept from Session 1

---

## Candidate tensions

Places where I already see the model isn't clean. Ranked by what I think is most consequential.

### Tension 1: Channel vs. klatch vs. chat ⚠️ HIGH

Currently in the code: there's a `channels` table with a `type` column whose values are "chat" or "klatch." So implementation-wise, channel is the parent and klatch/chat are subtypes.

Conversationally:
- Slack metaphor says "channel" is the parent
- The product is called *Klatch*, which says klatches are the distinctive thing
- xian sometimes uses "channel" generically, sometimes "klatch" for the group case
- F2.2 / F3.1 surfaced that the sidebar reads as a Slack-style list of channels — the user pattern-matches and loses the distinctiveness

**The question:** Is "channel" the parent term users see, or are "klatch" and "chat" peer concepts with no shared parent? This affects sidebar IA fundamentally.

### Tension 2: Entity vs. role vs. conversation ⚠️ HIGH

The entity reframe (4/18) says **"entities are existing conversations promoted into roles."** That implies three distinct things doing three different jobs:

- **Conversation** — the thing that exists. The history. The accumulated context.
- **Entity** — the database record? The bundle of (history + prompt + model + identity)? Or just the prompt+model+identity layer?
- **Role** — the function this entity plays *in* a klatch?

These three words are doing different work. Today's UI uses "entity" for everything. F6.2 surfaced this directly (xian: "entity may be the wrong word; maybe role"). We need to sort it out.

### Tension 3: What's in a project? ⚠️ MEDIUM

Today a project contains:
- Channels (chats and klatches associated with it)
- Project instructions (L2)
- Project memory (L3)
- Knowledge base files

Entities are global today — one entity can be in multiple channels in multiple projects. But if we take the reframe seriously (entities are existing conversations promoted into roles), and conversations live in projects, do entities inherit project scope? Or are entities a library that crosses projects?

This affects the entity manager redesign and the role-migration use case.

### Tension 4: Is L4 (channel context) an object or a property? ⚠️ MEDIUM

Today it's a textarea on the channel — a string property. But the channel-as-recurring-meeting concept (Session 1) and the channel-as-workflow concept (Session 3) suggest that a channel might have a *purpose* that persists, has a lifecycle, gets refined over time. That sounds more like a first-class object than a string attribute.

### Tension 5: Where do field notes / reflections / briefings attach?

Currently they live on the entity (reflections via `appendReflection`, field notes generated at export per entity). But behavioral observations are usually about a *relationship* — how the user prefers to work with this entity. That implicates the user as part of the object. Is "the way Daedalus works with xian on the Klatch project" a thing that the system models? Today it sort of is, distributed across entity prompt + reflections + project memory.

### Tension 6: Workflow as object

The canonical use cases (daily omnibus, weekly workstream review) are workflows. A workflow is more than a channel — it has phases, recurrence, expected participants, an output. The "standing workflow templates" idea from the roadmap names this.

Should "workflow" or "meeting" become a first-class object? Or is a channel-with-context-and-mode sufficient and "workflow" is just a usage pattern?

---

---

## Resolutions

### Tension 1 resolved (2026-05-11, xian)

**The model:**

- The product has **channels** for working with AI agents. Channel is the conceptual parent — the container concept.
- Two types of channels:
  - **Chat** — single-entity channel (one agent)
  - **Klatch** — multi-entity channel (more than one agent); the product's branded name for a group chat

**The non-obvious insight (worth its own status as a load-bearing principle):**

**Klatch channels are synthetic.** From each AI agent's point of view, they are still functioning normally in a single-user chat. The mechanism that drives the workflow in a klatch-type channel orchestrates the messages so that each agent experiences it as a single chat in which they are being provided with context about what other agents are saying or doing. The human user sees a group chat. The agents do not.

This is the architectural truth that makes Klatch possible and that the surfaces need to honor. It explains:

- **Why the entity reframe works.** Each agent in a klatch *is* having a chat. An entity isn't a separate abstraction from a conversation — an entity IS its chat, viewed from the klatch's perspective. The reframe collapses cleanly under this insight.
- **Why composition-from-existing-chats should work.** A klatch is an orchestration layer over real chats. The right way to compose a klatch is to point at the chats that should participate in the orchestration — not to create new abstract personas.
- **What interaction modes really are.** Panel / roundtable / directed are *orchestration patterns* — they describe how the synthetic group chat presents context to each underlying chat agent and how it routes messages between them.
- **Why the agents need kit briefing / context-of-context.** They're in a synthetic situation but operating as if it were normal. The synthetic frame has to be made navigable to them.
- **The two audiences for the experience.** The human user sees a group chat. The agents see a chat with helpful context. Klatch is responsible for making both views coherent — Tesler's Law in two directions.

**Implications for surface vocabulary:**

- Sidebar can use "Chats" and "Klatches" as section labels — branded, not generic. Channel-as-parent mostly stays in implementation/architecture vocabulary.
- The composition gesture is "select existing chats to participate in a klatch's orchestration" — not "create entities and add them to a klatch."
- The entity reframe is now operational at the object-model level: entities ≡ chats. The library / role-related vocabulary lands on top.

---

## Next up

Tension 1 resolved. Tension 2 (Entity vs. role vs. conversation) is partially resolved-by-implication above — but worth a deliberate pass because the role-vs-entity-vs-chat vocabulary still wants sorting out.

---

### Tension 2 resolved (2026-05-11, xian)

**Caveat xian raised:** there's a real distinction between (a) his personal use of these concepts, (b) the general pattern common to many users, and (c) the product's terminology. These don't have to be the same. The model below is xian's personal mental model, which the product vocabulary should respect but isn't bound to mirror exactly.

**The model:**

- **Entity** — a continuous single-agent conversation with a purpose. The broad unit-level concept. Any chat — a generic one-off Claude Q&A or a long-running persona — is an entity. This is **a unit in the product that needs a name.** Entity = chat (from Tension 1's resolution); the word "entity" emphasizes the persona/identity layer of that chat.

- **Role** — a **subset** of entity. An entity that has accrued **persistent identity** — a consistent name or title, playing an ongoing function in a project. Daedalus is a role. A one-off "help me debug this Python script" chat is an entity but not (yet) a role.

  Not every entity is a role; some entities are just chats that exist. Some entities mature into roles over time as they develop recognizable identity and ongoing function.

**Role persistence as Klatch's value proposition:**

Role persistence is **a unique value proposition of Klatch vs. generic chat products.** Generic chat tools have chats. Klatch supports the maturation of a chat into a role with persistent identity, accumulated context, and ongoing function in a project.

This persistence "exists on one of our layers, or should." Most likely: L5 (entity prompt) plus the accumulated context from L3 (project memory) and the per-entity reflection / field-note accumulation from Phase 3.5. The mechanism for role persistence is essentially the mechanism for behavioral-calibration accumulation.

This connects to F5.3 (memory-layer maintenance UX is Klatch's responsibility) and to the Phase 3.5 work already shipped — those aren't separate problems; they're the substrate of role persistence.

**xian's use case vs. general pattern:**

xian's specific use case: **it is roles he wants in his klatches** (group chats). When he composes a klatch, he's bringing together roles — entities that have matured to the point of carrying recognizable identity into the meeting.

Other users might compose klatches differently — putting together arbitrary entities for one-off purposes (e.g., a quick brainstorm involving a fresh entity that hasn't been used before). The product should support both, but xian's roles-in-klatches workflow is the canonical use case the design optimizes for.

**Implications:**

- The **entity manager** is really an entity *library* where some entries have role-status (matured into roles) and some don't (just chats).
- **Klatch composition** can filter to roles by default for the canonical use case, but allow any entity for flexibility.
- **Role status** might be a flag, a property, a tier, or just emergent from naming + persistence + use. To decide.
- **Tension 3 (what's in a project?) partially resolves:** roles play their function *in a project* — they're project-scoped by what they are. Entities-that-aren't-roles might be cross-project or uncategorized.

**Open questions to come back to:**

- **Lifecycle:** when does an entity become a role? Implicit (just keeps being used with recognizable identity) or explicit (you give it a name/title, formalize it)? Some hybrid?
- **Cross-project portability:** can a role move between projects? The bonus use case for today (migrate a role from Claude Code cloud session to local) implies cross-environment portability is a goal. Cross-project portability within Klatch is a separate question — open.
- **Vocabulary in UI:** the product's user-facing terminology may differ from this conceptual model. "Role" is likely user-facing; "entity" may stay internal. To decide alongside the next vocabulary pass.

---

### Tension 3 resolved (2026-05-11, xian)

**The model:**

A project *typically* contains:
- Channels (chats and klatches associated with it)
- Project instructions (L2)
- Project memory (L3)
- Knowledge base files
- The roles that play their function in it (canonical case)

**The principle:**

The object definition shouldn't encode constraints that are typical-but-not-mandatory. A role typically belongs to a project (canonical case). A role *may* not (allowed by the model, not forbidden). The relationship between role and project is contingent on the role's situation, not part of the role's definition.

**Consequences:**

- **No cross-project roles in xian's actual workflow.** Janus appears cross-project but is actually bound to the DinP project, which happens to be a meta-project that owns Klatch, PM, OpenLaws, etc.
- **"Cross-project" is a project property, not a role property.** A project may be structured as a parent-of-projects; roles in that project naturally interact across the child projects, but the role itself is still single-project.
- **Projects can have relationships to each other.** The current Klatch model doesn't have nested projects or project-of-projects. xian's actual workflow does (DinP → {Klatch, PM, OpenLaws, …}). The model should leave room for this relationship to exist without mandating it now.
- **The canonical case is one project per role.** Defaults optimize for this; the model doesn't enforce it.

**Open questions to come back to:**

- **Project relationships:** if projects can have parent-of-projects relationships (DinP pattern), what does that look like in the object model and UI? Defer until needed — xian's not asking for nested project structure in Klatch today.
- **Migration vs. cross-project usage:** environment migration (cloud → local) preserves identity, changes environment. Cross-project role usage (rare, allowed) would preserve identity, change project. These are different operations and the data model should distinguish them.

---

### Tension 4 tentatively resolved (2026-05-11, xian)

**The model (Candidate C):** L4 is a string AND something else exists alongside it.

- **L4 (channel context) stays a string** — the free-form context text that the agents see prepended to their prompts. This is what the agents actually experience. Honest about that.
- **A separate structural object lives alongside it** (likely "workflow" or "meeting" — names TBD in Tension 6). This object captures the structural pattern: name, purpose, expected participants, expected inputs, expected output, recurrence, phases. The system knows about this structure; the agents don't directly experience it as structure (they experience the orchestration via the synthetic-klatch mechanism from Tension 1).

**Why this works:**

- Respects the synthetic-klatch insight: the agents see a string of context; the system knows about phases and structure.
- Two audiences, two views (per Tension 1): the human sees structured meeting/workflow scaffolding; the agents see their normal chat with context injected.
- Doesn't conflate "what the agents see" with "what the system orchestrates" — those are different things and the design should honor the difference.

**Note:** xian flagged this as subtle and noted he may need to work with it more to fully understand it. The resolution is tentative. The model below is the working hypothesis; we should expect to refine it as we apply it to specific workflows in subsequent sessions.

**Open questions to come back to:**

- **What is the structural object called?** "Workflow," "meeting," "purpose," "shape," something else? Hangs together with Tension 6.
- **What fields does it have?** First pass: name, purpose statement, expected participants (roles), expected inputs (files), expected output, recurrence, phases. To refine.
- **How does the structural object drive L4?** Does the system generate L4 from the structural object? Does the user write L4 directly with the structural object as scaffolding? Some hybrid? To work out.
- **When does the structural object exist vs. not?** Is every channel required to have one, or only klatches, or only klatches-with-purpose? A one-off chat probably doesn't need a workflow object. To decide.

---

### Tension 5 resolved (2026-05-11, xian)

**The model:**

Field notes, micro-reflections, and handoff briefings attach to **the entity** (which equals the chat, per Tension 1/2). For the canonical case (one user, role bound to one project), this is correct and the simplest model. The relationship and project dimensions are *implicit* because they're constant — every field note is implicitly "how xian works with this entity on this project," and that's fine because there's only one xian and roles are project-scoped.

**The principle (same as Tension 3):** Don't encode constraints that are typical-but-not-mandatory. Field notes belong on the entity in the canonical case. The data model should *permit* qualifying them by project or user when situations arise (multi-user support, cross-project roles), but shouldn't *require* qualification today.

**Implications:**

- Current Phase 3.5 attachment (notes on the entity, generated at export per entity) is correct.
- If the data model gains an optional `project_id` or `user_id` on field notes for future support, that's an additive change with no required migration of existing notes.

---

### Tension 6 resolved (2026-05-11, xian)

**The model:**

- **Workflow** is the parent term — the structural object referenced in Tension 4's Candidate C.
- **Meeting** is one type of workflow. The branded term "klatch" already suggests meeting/group conversation, which gives us this affordance for free.
- **Every klatch has a workflow.** Not optional. A klatch without structure is incoherent.
- **The default workflow is broadcast** — add roles to the klatch, the user types a message, all roles receive the same message. Maps naturally to panel interaction mode. This is the simplest possible workflow shape; every klatch starts here and can evolve toward more structured forms.

**Implications:**

- Klatches are workflows-in-progress. The user creates a klatch, the system assigns a default broadcast workflow, the user can refine the workflow toward something more structured (roundtable, directed, multi-phase synthesis, etc.) as needs surface.
- "Workflow" is the parent category in the object model; specific workflow shapes (broadcast, meeting, multi-phase synthesis, etc.) are types or templates.
- "Meeting" can be a named workflow type for recurring gatherings — the daily omnibus, the weekly workstream review are meetings.

### Open question xian raised: expected vs. actual

xian raised: the workflow fields (expected participants, expected inputs, expected output) imply structure that doesn't yet exist. How do we handle expected-vs-actual information?

**Iris's thoughts (worth considering, not resolving today):**

The expected/actual distinction often signals a deeper distinction: **template vs. execution.**

- A **workflow template** is the structure: name, expected participants, expected inputs, expected output, recurrence, phases. The template is reusable.
- A **workflow execution** is one instance of the template running: which roles actually participated, what was actually produced, when each phase occurred. Each execution is one-off per cadence.
- A klatch *is associated with* a workflow template, and *has* a series of executions over time.

The weekly workstream review fits this naturally: the "weekly workstream review" is a template; "the week ending May 7" is an execution; "the week ending May 14" is the next execution; the Shipping News klatch holds both the template and the history of executions.

Or — alternative simpler model — there's no separate template/execution distinction. The workflow on a klatch evolves; you can see the history of how it was run, but there's just one workflow per klatch that gets refined over time. Less structured, less bookkeeping, fits Gall's Law.

To decide later. The simpler model is the right starting point; the template/execution distinction is an evolution if and when the canonical use cases need it.

---

## Status

- **Tension 1 — Channel / klatch / chat:** ✅ Resolved (with the synthetic-klatch insight as a load-bearing architectural truth)
- **Tension 2 — Entity / role / conversation:** ✅ Resolved (entity = continuous single-agent chat; role = entity with persistent identity in a project; role persistence is Klatch's value prop)
- **Tension 3 — What's in a project?:** ✅ Resolved (see below)
- **Tension 4 — L4 (channel context) as object or property?:** ✅ Tentatively resolved (see below; xian flagged subtle, may refine with use)
- **Tension 5 — Where do field notes / reflections / briefings attach?:** ✅ Resolved (see below)
- **Tension 6 — Workflow / meeting as first-class object?:** ✅ Resolved (see below)

---

## Vocabulary

User-facing language decisions. Downstream of the object model. Captures which words appear where, and which stay in implementation.

### V1 — Channel vs. chat vs. klatch vs. conversation in user-facing copy (2026-05-12)

**Rule:**

- **"Chats" and "klatches"** are the primary categorical pairing in user-facing copy. Two precise words.
- **"Conversation"** is the singular generic fallback when a single word genuinely reads better.
- **"Channel"** stays in implementation language; not in user-facing copy.

**Rationale:**

- "Chat" and "klatch" are the product's branded categories; they should do the work. Slack uses "channel" because in Slack channels ARE the distinctive thing — in Klatch, klatches are. Generic words for distinctive things dilute branding.
- "Conversation" maps to what the user *experiences* in either a chat or a klatch — a visible thread of messages. For a chat, with one agent. For a klatch, the synthetic group chat (regardless of what's happening underneath per the T1 resolution). It's the natural user-facing word for "the visible thread of messages."
- "Channel" is the implementation parent (database table, system abstraction). "Conversation" is the user-facing experience. They're at different layers, analogous not identical. Don't pretend "channel" is a user-facing word just because it's the data model.

**Application guide:**

- Sidebar list: no generic word needed; `@`/`#` prefix + name does the work
- "+ New" affordance: present two options ("Chat or Klatch?"), not a generic create
- Counts: prefer specific ("3 chats, 2 klatches") or just numeric ("5") over generic-with-word
- Documentation: "your chats and klatches" by default
- Settings copy: use the specific type when known ("Chat settings" / "Klatch settings"); avoid "Channel settings"
- Generic singular fallback: "Start your first conversation" / "Show recent conversations"

### V2 — Agent (not entity) as the broad user-facing word; role as the subset (2026-05-12)

**Rule:**

- **"Agent"** is the user-facing word for any AI participant in a chat or klatch.
- **"Role"** is the user-facing word for the subset of agents that have matured into persistent named identity (consistent name/title, ongoing function in a project).
- **"Entity"** stays in implementation (data model, code, internal docs). Not user-facing.

**The mapping:**

| Layer | Word |
|---|---|
| Database / implementation | `entity` |
| User-facing broad category | **agent** |
| User-facing subset with persistent identity | **role** |

**Why "agent" (and why not "chat" for the participant level):**

- Word-collision: "chat" already means a channel type (single-agent channel) in the resolved V1 vocabulary. Using "chat" for a participant within a channel would collide at two levels of nested concept (container vs. participant).
- "Agent" is the generic, widely-understood word for an AI participant — Anthropic uses it (Claude Agent SDK, Managed Agents), Klatch's own methodology uses it (AXT = Agent Experience Testing, kit briefing for agents).
- It preserves the role-vs-not distinction without inflating "role" to mean every agent: every role is an agent; not every agent is a role.

**Application guide:**

- Library surface (formerly "Entities") shows agents, with **Roles** as a primary subcategory and "other agents" as a secondary section (un-named, less-calibrated, one-off). Surface naming to be decided when we sketch.
- Channel header for a chat shows the agent's name (or default label).
- Channel header for a klatch shows multiple agents with names/role labels.
- Composition gesture (klatch creation): "Add agents to this klatch" — choose from existing agents, default-filter to roles.
- Promotion gesture (V5 territory): turn an agent into a role — the gesture for "this agent has earned persistent identity."

**Sanity check on the team:** Daedalus, Argus, Calliope, Iris are all agents AND roles by this definition (persistent identity AND AI participants). Same word, both true. No conflict.

### V3 — Neither "workflow" nor "meeting" is user-facing; both stay internal (2026-05-12)

**Rule:**

- **"Workflow"** stays in implementation/architecture vocabulary (object model, code, internal docs). Not user-facing.
- **"Meeting"** stays in implementation/architecture vocabulary. Not user-facing as a UI category. May appear in natural-language copy where it fits colloquially ("the daily standup," "your Friday review") but not as a load-bearing UI noun.

**The user experience instead:**

The user "sets up a klatch" directly. The setup surface asks field-level questions:
- **Purpose** — what is this klatch for?
- **Agents** — who participates?
- **Cadence** — when does it run (if recurring)?
- **Phases** — what structure does it have (if structured)?
- **What it produces** — the output / synthesis target (if defined)
- **Mode** / **Orchestration** — how messages flow (broadcast / panel / roundtable / directed)

No "Workflow type" picker. No "Meeting settings" header. No wrapper noun for the configuration object.

**Why:**

- **Panels are musculature, not admin** (F6.7). The configuration IS the work, not meta-configuration about workflows. Don't label the panel "Workflow editor" — label the fields directly.
- **Who bears the burden?** (design principles meta-principle). Exposing "workflow" and "meeting" as user-facing categories would force users to understand the distinction. They don't need to. The system bears it; the user just configures the klatch.
- **Three audiences, three views** (extending T1's two-audience insight). The agents experience normal chats. The user experiences a klatch. The system orchestrates a workflow (which may be meeting-shaped). Each audience sees the right abstraction for them.

**What survives as user-facing:**

- Klatch (channel type)
- Agents, roles (participants)
- The klatch's properties (purpose, agents, cadence, phases, mode, etc.)
- Natural-language "meeting" when it fits English usage colloquially

**What stays internal:**

- The terms "workflow" and "meeting" as object-model categories
- The distinction between meeting (the structural shape) and workflow (the orchestration mechanism)
- Documentation may use these when explaining how Klatch works, but they don't appear as UI labels

### V4 — Composition gesture verbs: "Invite" + "Convene" (2026-05-12)

**Rule:**

- **"Invite"** is the verb for adding an existing agent to an existing klatch.
  - Button label: "+ Invite agent"
  - Reads as a meeting-flavored verb (consistent with the meeting framing in our object model) without requiring the user to think in meeting nouns (V3).
  - Acknowledged tension: "invitation" colloquially implies optionality, but in Klatch (as in Slack) the agent is mechanically just added. The convention is familiar; users translate it correctly.

- **"Convene"** is the verb for creating a new klatch from agents.
  - Button label: "+ Convene" or "+ Convene a klatch"
  - Combines the creation gesture with the bringing-together quality of the act. Honest about what's happening: you're not "creating an empty container" — you're convening participants.

**Why not "Add" / "Compose" / "Bring":**

- "Add" is generic and weak; misses the intentional, bring-things-together quality.
- "Compose" is cold/structural; "convene" has meeting-energy.
- "Bring into" reads as literary, not button-shaped.

**Note on banished-meeting-noun consistency:** V3 banishes "meeting" and "workflow" as user-facing nouns. V4 uses meeting-flavored *verbs* (invite, convene) — that's compatible. Verbs carry meaning more lightly than nouns; "invite to a klatch" doesn't force the user to mentally categorize the klatch as a meeting.

### V5 — Promotion: naming is the promotion (2026-05-12)

**Rule:**

- **"Promote"** is the conceptual verb for the transition from un-named agent to role. Used in design documents, internal vocabulary, this object model — not in UI.
- **In the user-facing experience, naming the agent IS the promotion.** No separate "Promote" button. The user gives the agent a proper name, role title, and (optionally) refines its system prompt. The act of completing that identity flow IS the act of promotion.
- **Consequence is visible:** after promotion, the agent appears in the roles library, in role-pickers, and is invitable to klatches as a role by default. No announcement banner; the consequence speaks for itself.

**Why combined A+B (explicit gesture + implicit promotion):**

- Echoes V3's principle: the system bears the burden of understanding the category transition; the user does a simpler, more natural gesture.
- Naming an agent is *already* a deliberate act — the user is choosing to invest in that agent. No need to add a separate confirmation step.
- The lifecycle from un-named agent → named role becomes one continuous gesture, not two.

**Future enhancement (post-1.0):**

C-style system-suggested promotion. "This agent has been used in 5 sessions and is unnamed — would you like to give it an identity?" Nice-to-have feature; not needed for 1.0.

**Inverse / demotion:**

Not designed yet. If a user wants to remove role status, the conceptual verb is "demote" — but the user-facing gesture would likely be "clear name and role title" or equivalent. To handle if and when it surfaces.

---

## Vocabulary status

All five vocabulary questions resolved:

- **V1** ✅ Channel banished from user-facing; chats/klatches as primary categories; conversation as singular generic fallback
- **V2** ✅ Agent (broad) + role (subset with persistent identity); entity stays in implementation
- **V3** ✅ Workflow and meeting stay internal; the user "sets up a klatch" with direct field-level properties
- **V4** ✅ Composition verbs: invite (add agent to existing klatch); convene (create new klatch)
- **V5** ✅ Promotion: naming IS the promotion; "promote" is internal vocabulary only
