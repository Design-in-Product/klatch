# Klatch Composition Gesture — Design Spec

**Authors:** Iris + xian
**Date:** 2026-06-20
**Status:** Draft — ready for Daedalus implementation
**Upstream:** `docs/ux/design-brief.md` (1.0 critical path), `docs/ux/object-model.md` (object model + vocabulary)

---

## Why this spec

The composition gesture is the 1.0 blocker. Users today cannot bring existing agents into a new klatch — klatch creation requires building entities from scratch. Klatches today have no setup surface. This spec defines the minimum flow to fix both.

---

## What this covers

1. The trigger and entry point
2. The setup surface (fields, defaults, behaviors)
3. The agent picker (three paths)
4. Orchestration modes
5. @mention behavior in the klatch
6. Context and files
7. In-klatch experience (summary)
8. Cross-reference: agent's 1-1 chat ↔ klatches
9. Data model notes for Daedalus
10. Vocabulary decisions
11. Out of scope

---

## 1. The trigger

**Button label: "New Klatch"**

Placement: sidebar, as a sibling to the New Chat affordance. The two affordances (New Chat / New Klatch) are presented as a pair — the user's two ways to start a new conversation. Exact UI pattern (separate buttons, a "+ New" with a picker, etc.) is an implementation decision for Daedalus based on what fits the sidebar structure cleanly.

"Convene" — our conceptual verb for the act — stays in documentation and internal framing. It is not the button label.

---

## 2. The setup surface

A lightweight panel. Not a full-page form; not a hard-blocking modal. The user should be able to start immediately without ceremony.

### Option: Clone existing klatch

Before filling in fields, offer: "Copy setup from an existing klatch." Selecting an existing klatch pre-fills all fields except the name (or pre-fills the name with a "Copy of" prefix). Useful for recurring meetings — the user doesn't rebuild the weekly review from scratch each time.

### Fields

**Name** (required)
What the klatch is called in the sidebar. No smart default; the user names it.

**Agents** (required, 1+)
The agent picker (see §3). At least one agent required to create the klatch.

**Purpose** (optional)
Short text: "What is this klatch for?" Seeds L4 (channel context) — prepended to each agent's context in this klatch. Optional at setup; editable later in klatch settings. Not labeled "L4" in the UI.

**Orchestration mode** (optional at setup, defaulted to Blast)
How messages flow between the user and agents. See §4. Changeable here or in klatch settings later.

**Project** (optional, context-dependent)
If initiated from within a project, pre-fill. Otherwise optional. Klatches can exist without a project association (same as chats).

**Documents / files** (optional)
Attach context files to the klatch at setup. Can also be added after the klatch is created.

---

## 3. The agent picker

Three paths for adding agents to a klatch. All three are available from the same picker surface.

### Path A: Existing agents

All agents Klatch knows about, browsable and searchable.

Two visual tiers within the list:
- **Roles first** — agents with a name and persistent identity in a project. The canonical selection case: the user is usually inviting known roles.
- **Other agents below** — unnamed or one-off agents. Available but not the default focus.

Interaction: typeahead search by name or handle; browsable by project; chips on selection; remove with ×.

### Path B: Just-in-time import

"Import an agent" inline, within the composition flow. The user can bring in an agent from Claude Code, claude.ai, or another Klatch instance without leaving the setup surface. On completion, the imported agent appears in the picker as selected.

This makes the composition gesture the front door for import — the user doesn't need to import agents before they can convene. Composition and import are one gesture.

### Path C: Start new agent session

A "New agent" option at the bottom of the picker. Two sub-options:

**Continue existing role** — start a new session with an agent or role that already exists in Klatch's entity registry. The user selects the role; a new session is associated with it. The role is then added to the klatch.

**New agent / role** — create a genuinely new agent. The user provides name, role title (optional), system prompt, model. After creation, the new agent is added to the klatch.

Note: "promote to role" is the internal concept. In the UI, the distinction is always framed as: *is this a new face in the meeting, or someone who plays an ongoing function?*

---

## 4. Orchestration modes

Three modes for 1.0. A fourth (organic / self-selecting) is post-1.0.

**Mode 1: Blast (parallel)**
All agents receive the user's message simultaneously and respond independently. Agents do not see each other's responses — only the user's message and their own prior context. Zero configuration to start here; this is the default.

**Mode 2: Sequential (round-robin)**
The user's message goes to agent 1; agent 1's response + full context goes to agent 2; and so on until the last agent replies to the user. Each agent sees everything that came before them in the sequence. Useful for staged critique, document evolution, sequential stakeholder input.

**Mode 3: Directed (addressed)**
The user explicitly routes who responds, via @mention in the message input (see §5). Non-addressed agents receive context but do not auto-respond.

**Mode 4: Organic (self-selecting)** — post-1.0, not in this spec.

### Default
Blast. No picker required at klatch setup unless the user wants to change it. The mode picker is available at setup as an optional field and always accessible in klatch settings.

### User-facing names for modes (decided 2026-06-20)

| Key (code) | User-facing label | Rationale |
|---|---|---|
| `panel` | **Broadcast** | Aligns with design-brief language; meaningful (broadcasting to all); avoids "panel" which implies display not action |
| `roundtable` | **Roundtable** | Already a good word; meeting-flavored without being a noun; kept as-is |
| `directed` | **Directed** | Clear, already in code, kept as-is |

Applied in `packages/shared/src/types.ts` (INTERACTION_MODES labels).

---

## 5. @mention behavior

@mentions in the klatch message input route a message to the addressed agent(s), regardless of the current default mode. This is the user-facing surface for directed addressing — not a separate mode to switch into, just natural syntax.

**Rules:**
- `@AgentName` in a message → only that agent responds to this message
- `@AgentName1 @AgentName2` → both named agents respond; others don't
- No @mention → default mode behavior applies
- Typing `@` in the klatch input shows autocomplete for agents in this klatch

**Composes with all three modes.** In a Blast klatch: unaddressed messages go to all agents; @mention overrides for that message. In a Sequential klatch: @mention short-circuits the sequence for that message. In a Directed klatch: @mention is the expected primary input mode.

---

## 6. Context and files

**Purpose field** seeds L4. The text the user writes becomes the channel context prepended to each agent's prompt in this klatch. Agents experience it as part of their context; it is not labeled in the UI.

**Documents / files** use the existing pinned-file mechanism. Files attached at the klatch level are available to all agents in the klatch. Can be added at setup or after.

**Per-agent context** (L5 / entity prompt) is separate from the klatch-level purpose. It lives in the agent's own configuration and is not a setup-time field in the composition surface.

**Continuity (the premise).** An agent arrives in a klatch with its context assembled across everywhere it's participated — its 1-1, and any other klatches it's been part of. What it knows in one room, it knows here too. The composition gesture selects *who participates*; it never selects *how much of themselves they bring*. A klatch whose participants arrive without their context is not a klatch (`PREMISE.md`, idea #2); this section's remaining rules are implementations of that premise, and any reading of them that contradicts it is wrong.

**Mechanism (the design constraint, subordinate to the premise).** Continuity is not implemented as a raw injection of full prior history into the klatch window. Each agent arrives with a bounded, deterministic seed of its accumulated context, and retrieves specifics on demand via its source-context tool ("let me check my notes"). The constraint governs *how* context is carried — never *whether*.

**Discretion.** A 1-1 is direct, not private — a different room, not a sealed one. An agent carries everything it knows into a klatch turn; there is no read-time filtering, no per-message ACL, no confidentiality system deciding what an entity is "allowed" to know. What actually gets *said* into the klatch's own record is governed by two things: a per-klatch ground-rules convention (stated in the Purpose field — e.g. "nothing not already known to the group," or an explicit Chatham House framing), and — planned, not yet built — a per-message choice of destination, so an agent can address a reply to the 1-1 rather than the klatch when that's the right room for it, the way a Slack DM works alongside a channel. **Ground rules are a prompt-level convention, not an enforcement mechanism** — an agent asked to observe Chatham House will honor it the way a well-briefed colleague does, not the way a permission system does. State this plainly wherever the feature surfaces; it is not a security guarantee.

**Room-level context.** The Purpose field also seeds L4 more generally, and klatch-pinned files remain the mechanism for context that belongs to the room rather than to any one participant. Both supplement each agent's own continuity; neither substitutes for it.

---

## 7. In-klatch experience (summary)

Once the klatch is created and the user enters it:

- The experience is a synthetic group chat. Multiple agent avatars and names visible in the message thread. Mode indicator visible in the channel header (quiet, non-intrusive).
- No phase dashboard. No meeting-mode overlay. The multi-agent nature is evident from the visual; no extra chrome needed.
- The meeting "ends" when the user is satisfied — shared understanding reached, draft artifact produced, questions answered. No session-close gesture is provided for 1.0; observe natural behavior first.
- Artifacts (draft Ships, decisions, field notes) associate with the klatch channel by being produced there. They accumulate in the message history and in the channel's pinned context as the user adds them.
- Synthesis is emergent — the user directs a CoS-style agent via @mention or directed mode when they want a synthesis. No dedicated synthesis button.

The in-klatch experience is largely the existing chat UI extended to multiple agents. Orchestration mode determines message routing; the visual experience is a shared timeline of messages from multiple sources.

---

## 8. Cross-reference: agent's 1-1 chat ↔ klatches

**Design principle:** every agent's 1-1 chat should show which klatches that agent is participating in, sorted by recent activity.

In Daedalus's 1-1 chat: "Daedalus is also in: [Weekly Review], [Architecture Discussion]" — visible in the chat header or side panel, linking to those klatches.

The relationship is bidirectional: from the klatch, you see all participating agents; from any agent's 1-1 chat, you see all klatches that agent is in.

Implementation: query on `channel_entities JOIN channels WHERE type = 'klatch'` for the given entity. No new data model required; surface only.

---

## 9. Data model notes for Daedalus

**Role distinction in the picker:** today there is no explicit `is_role` flag on the `entities` table. For the picker, the simplest proxy: entity with a non-null, non-empty `name` = role tier; entity without a name = other-agent tier. If the proxy proves inadequate (e.g., named entities that aren't intended as roles), an `is_role` boolean on `entities` is the right additive change. Recommendation: start with name-as-proxy for 1.0; add the flag if needed.

**Clone klatch:** copy channel record (type, name, system_prompt / L4, project_id, orchestration_mode) and channel_entities records. New channel_id, new created_at. No message history copied.

**JIT import (Path B):** the import flow needs to support being initiated from inside the klatch setup surface and completing by adding the imported entity to the klatch in progress. This is a UX integration point; the underlying import machinery (already built) does not change.

**@mention routing:** when a message contains `@handle`, the message routing layer identifies the addressed entities by handle and invokes only their turn, overriding default mode behavior for that message. Requires entity handles to be set and unique within a klatch. If a handle is unset on an entity, @mention targeting falls back to name matching (or is unavailable for that agent — Daedalus to decide).

**Orchestration mode field:** if not already stored on the channel record, add `orchestration_mode` as a column on `channels`. Values: `blast` | `sequential` | `directed`. Default: `blast`.

---

## 10. Vocabulary decisions (user-facing copy)

Applied throughout this spec. Downstream of the object model (`docs/ux/object-model.md`).

| Concept | User-facing word | Internal / implementation word |
|---|---|---|
| AI participant (any) | Agent | Entity |
| Named agent with persistent identity | Role | Entity (with name/handle) |
| Start new group conversation | New Klatch | — |
| Add agent to existing klatch | Invite | — |
| Channel context (L4) | Purpose | L4 / channel addendum |
| Group channel type | Klatch | Channel (type: klatch) |
| Single-agent channel type | Chat | Channel (type: chat) |

Mode names: TBD in a copy pass (see §4).

---

## 11. Out of scope

- Holistic panels-as-musculature redesign (post-1.0)
- Organic / self-selecting orchestration mode (post-1.0)
- Entity manager / roles library redesign (post-1.0)
- Session-close / meeting-end gesture (post-1.0; observe natural behavior first)
- "What this klatch has produced" surface beyond the message history (post-1.0)
- Step 11 (Search) — explicitly post-1.0
- Agentic surface refinement (MCP server is feature-complete; UX around it is post-1.0)
