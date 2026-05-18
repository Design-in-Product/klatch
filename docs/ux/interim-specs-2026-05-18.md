# Interim Design Specs — 2026-05-18

**Author:** Iris (UX design & front-end development)
**Date:** 2026-05-18
**Status:** Ready for implementation. Three discrete specs that ship work toward 1.0 without depending on the meeting-setup design (still in flight with xian).

---

## Why this document exists

xian + Iris are working on the 1.0 critical-path specs (composition gesture, klatch setup, the meeting experience). That work is genuinely the next thing — but it's also genuinely design work that takes time. While it proceeds, three discrete specs are settled enough now to ship in parallel. Each:

- Has the design questions resolved
- Doesn't block on the meeting-setup work
- Provides real user-experience improvement
- Is directionally correct for the holistic redesign (won't be wasted)

Daedalus implements. Argus writes coverage. Theseus re-runs UI-AAXT probes to validate that the changes shift the Subliminal classifications they identified in Rounds 36–38.

---

## Spec 1 — The naming UI for the existing entity form (medium)

**Status:** Primary new design work in this batch. Implements V5 (naming IS the promotion) + the conversational/utility two-paths-one-surface design resolved 2026-05-18.

### What to build

Replace the current "Name" input in the entity creation form (`EntityManager.tsx` → "Create entity" flow) with a three-affordance naming surface:

```
┌─────────────────────────────────────────────────────────────┐
│  Name this agent                                            │
│                                                             │
│  [ ____________________________________ ]   [ ask the agent ]│
│                                                             │
│  [ skip — use default ]                                     │
└─────────────────────────────────────────────────────────────┘
```

**Three paths:**

1. **Type directly** (utility path, default focus): the user types a name and proceeds. Fast path for users who already know what they're calling this agent. No conversation, no friction.

2. **Ask the agent** (conversational path): clicking the affordance opens a small conversation surface where:
   - The system shows the user "Asking the agent to choose a name..." with a brief progress state
   - An LLM call is made (using the default Klatch model) with:
     - The role description the user has typed so far in the form
     - The existing project roster (other agents in this project, with their names + roles) — **roster-aware by default** per the design resolution
     - A prompt that asks the agent to propose a name and explain *why* it fits (their reasoning is part of the gesture)
   - The agent's proposed name + reasoning displays inline
   - User actions on the proposal: **Accept** (uses the name and closes), **Try another** (re-runs the LLM call with a "different name, please" addendum), **Type my own** (collapses back to the type-directly path, prefilled with what was suggested if the user wants to edit it)

3. **Skip — use default** (escape hatch): the agent gets a generic default name ("Agent" or `Agent_<short-id>`). For pawns, ephemeral chats, "I'll figure it out later." The agent remains in the library but un-promoted (not yet a role).

### Why

V5 resolved that naming an agent IS the promotion to role — no separate "Promote" verb. The utility user types and moves on. The xian-style user gets a conversational naming experience that's load-bearing for what makes Klatch *Klatch* — the agent has agency in their own naming; the agent's reasoning is part of how the role's identity forms; thematic conventions propagate naturally because later agents see the roster of earlier ones.

This is the moment-of-naming that xian described from Klatch's actual history — Argus chose their name because they needed many eyes for testing; Daedalus chose theirs because they were building the tool. The gesture preserves that.

### The agent-naming prompt (initial design)

When the user clicks "ask the agent," send the LLM a prompt approximately like:

```
You are being created as a new agent in a Klatch project. The user is naming you.

Your role description (as the user has typed it so far):
{role_description}

The other agents already in this project, with their names and roles:
{roster_list}
(or: "You are the first agent in this project.")

Please propose a name for yourself and briefly explain why that name fits.
Your name will become your persistent identity in this project; it should
feel right both to you and to the user. If there's a thematic convention
visible in the existing roster (mythological, functional, etc.), you may
choose to fit in or deliberately differ — your call.

Respond with:
- Proposed name (a single word or short phrase)
- One short paragraph (2-3 sentences) explaining why this name fits
```

Tunable later. The point is that the agent sees their own role description, sees the local customs (the roster), and is asked to choose with reasoning.

### How to test (Argus)

- **Type-directly path:** entering a name and submitting proceeds exactly as today's name input does. Regression test.
- **Ask-the-agent path:** clicking the affordance triggers an API call with the expected prompt shape (mock the LLM client; assert call structure). When the response returns, the proposed name + reasoning render in the visible surface.
- **Try-another path:** re-running the call appends a "different name, please" addendum and gets a different name in the response. Mock + assert.
- **Type-my-own from a proposal:** clicking the affordance after a proposal collapses the surface back to the input, prefilled with the proposed name, edit-ready.
- **Skip path:** entering nothing and choosing skip creates an agent with a generic default name (`Agent` or `Agent_<short-id>`); the agent appears in the library but is marked un-promoted (data model: `is_role: false` or however we represent the role/non-role distinction).
- **Roster context:** the prompt sent to the LLM includes the project's existing roster when there are other agents in the project; sends "first agent in this project" when there aren't.

### How to test (Theseus)

- After this ships, re-run Round 36 UI-AAXT on the sidebar to see whether F1 (channel-type Subliminal) shifts. Hypothesis: F1 is largely orthogonal to this work — F1 is about the rendered sidebar, this is about the create flow. So expect F1 unchanged. The naming UI itself is a new probe surface; happy to take a Round 39 once it lands.
- UI-AAXT probe: rendered naming surface should convey "you can type a name OR ask the agent OR skip" without the user having to hover or guess. If user-proxy can't extract the three paths from the rendered state, that's a design failure.

### What good looks like

- A new user who knows what they want types a name in <3 seconds. Same speed as today.
- A new user who's curious clicks "ask the agent" and gets a named, reasoned proposal in <5 seconds.
- xian's existing pattern (describe the role; ask the agent) becomes a UI-supported flow rather than a manual conversation he has to construct.
- Imported agents preserve their existing names; this UI doesn't see them.

### Out of scope for Spec 1

- The full composition gesture for klatches (separate spec, in flight)
- The agents/roles library redesign in the entity manager — see Spec 3 for the down payment that pairs with this
- Naming convention enforcement at the project level (xian's resolution: convention lives in docs, not architecture)
- The "name yourself cold" variant (no roster context) — future enhancement

---

## Spec 2 — Vocabulary migration sweep (small, mechanical)

**Status:** Audit complete. Application of V1–V5 to specific user-facing copy. Mostly string substitutions.

### What to build

Apply the vocabulary resolutions (V1–V5 in `docs/ux/object-model.md`) to the user-facing strings identified by the 5/12 audit and Theseus's R36 F3 finding. Specifically:

**Replacements:**

| File | Line | Current | Replacement |
|---|---|---|---|
| `ImportDialog.tsx` | 1002 | `'5_entityPrompt': 'Entity prompt'` | `'5_entityPrompt': 'Role prompt'` |
| `ChannelSettings.tsx` | (LAYER_LABELS) | `'5_entityPrompt': 'Entity prompt'` | `'5_entityPrompt': 'Role prompt'` |
| `ChannelSettings.tsx` | 242 | `"Promote to project knowledge base"` (button title) | `"Move to project knowledge base"` |
| `ChannelSettings.tsx` | 268 | `"Pinned files are listed in the channel context sent to entities."` | `"Pinned files are included in the channel context sent to all agents."` |
| `ExportReviewPanel.tsx` | 222 | `"Entities"` (export summary label) | `"Agents"` |
| `EntityManager.tsx` | 119 | `"Assigned to ${entity.channelCount} channel${...}"` (tooltip) | `"Used in ${entity.channelCount} conversation${...}"` (xian-approved generic for cross-type counts; per V1 conversation is the fallback) |
| `MessageList.tsx` | 165 | `'Pinned to channel'` / `'Pin to channel'` (tooltip) | `'Pinned'` / `'Pin this file'` (simpler; channel scope is implicit) |
| `ProjectSettings.tsx` | 214 | `"...listed in L3 context for all channels in this project"` | `"...included in every chat and klatch in this project"` |

Plus the Theseus R36 F3 finding (overlaps with `EntityManager.tsx:119` above — the tooltip; same fix closes both).

**Optional polish (low-priority, defer if scope is tight):**
- Audit `'5_entityPrompt'` constant references elsewhere if any remain
- Search for residual "system prompt" usage in user-facing copy where it's actually L4 channel context or L5 role prompt; rename per nomenclature work

### Why

V1 banished "channel" from user-facing copy. V2 banished "entity" from user-facing copy (in favor of agent/role). V5 banished "promote" from user-facing copy. These resolutions are settled — the question now is just mechanical application to specific strings. Each of these instances was flagged in the 5/12 audit subagent's report or in Theseus's R36 F3 finding.

### How to test (Argus)

Pattern: per-string render-and-assert tests in the relevant component test files. For each replacement, assert the new string appears and the old string does not. Snapshot tests on the affected components should be updated.

Round 39 candidate from this work: a "vocabulary contract" test suite that pins each user-facing string's compliance with V1–V5 rules — would catch future regressions.

### How to test (Theseus)

Re-run Round 36 UI-AAXT on the sidebar's `EntityManager.tsx` integration (via the channelCount tooltip) and Round 37 on `ExportReviewPanel.tsx`. Hypothesis: F3 (entity tooltip leak) should resolve from a flagged finding to Correct. The other entity-prompt label changes should be invisible to user-AAXT (the label is correctly read in either case; the change is to align UI vocabulary with what we've resolved we want).

### What good looks like

- No user-facing string in `packages/client/src/` uses "entity," "entities," "channel" (in copy, not in code), "promote/promotion" (as a verb), or "system prompt" (as a user-facing label for L4 or L5).
- All references to AI participants use "agent" (broad) or "role" (specific). All references to the categorical types use "chat" or "klatch." Singular generic fallback is "conversation."
- The current 7-instance audit list is the full punch list; nothing else from V1-V5 has leaked through.

### Out of scope for Spec 2

- Server-side strings (`packages/server/`) — V1/V2 explicitly keep "entity" and "channel" in implementation
- Test fixture strings — implementation
- Code comments — internal
- TypeScript type names (`type ChannelType`, `Entity`, etc.) — implementation
- Future copy that doesn't exist yet (the meeting-setup spec will introduce new copy; that's its own scope)

---

## Spec 3 — Agents-library down payment in the entity manager (small)

**Status:** Partial step toward the eventual entity-manager → agents-library transformation. Doesn't preempt the holistic redesign; previews its direction.

### What to build

Three changes to `EntityManager.tsx`:

1. **Rename the panel header** from "Entities" → **"Agents"** (with optional subtext: "Your team of AI participants.")

2. **Visually distinguish named-roles from un-named-agents** in the list. Two affordances acceptable; choose one:
   - (a) Section split: "Roles" (named, persistent-identity) above "Other agents" (default-named, un-promoted) below, with a thin divider
   - (b) Inline indicator: a subtle visual cue (e.g., a small badge "role" or a different background tint) on the named ones, with everything in one list

   My preference is **(a)** — explicit categorical structure, matches xian's mental model. But (b) is acceptable if simpler to implement.

3. **Update the existing channel-count tooltip** to use V2 vocabulary (this overlaps with Spec 2's `EntityManager.tsx:119` line — single change for both). Also surface the channel-count badge inline on the card (T2.1 already queued in triage).

### Why

V2 said the entity manager is really an agents library where some entries have role-status (matured/named) and some don't (ephemeral or generic). Today's "Entities" panel collapses this distinction. The redesign (Tier 3, waits for composition gesture work) makes this primary; this spec is the small directionally-right step that makes the distinction visible now.

It also pairs with Spec 1: when a user names an agent through the new naming UI, they see the result in the agents library — the agent moves from "Other agents" to "Roles" (or gets the visual indicator). The promotion is *visible* through this change.

### How to test (Argus)

- Header text: "Agents" appears; "Entities" does not.
- List structure: named-role agents render in their distinct treatment; un-named (default-named) agents render in the other treatment. Either section split or inline indicator — assert whichever was implemented.
- Channel-count: tooltip uses V2 vocabulary (see Spec 2); badge renders inline per T2.1 if also picked up in this batch.

### How to test (Theseus)

Round 39 candidate: UI-AAXT probe on the agents-library surface. Probes for:
- "What kinds of agents exist in this project?" → user-proxy should be able to distinguish roles from other agents.
- "How many roles are there?" / "How many un-promoted agents are there?" → if either is zero, the surface should still convey that explicitly (negative state with explicit representation — per the new principle).
- "Where is X used?" (the channel-count tooltip) → V2 vocabulary should not surface "entity" or "channel."

### What good looks like

- A user opening the agents library immediately sees that some agents are roles (their persistent named identities) and some are not.
- The vocabulary on this surface aligns with V2 cleanly.
- The library is one step closer to its eventual library treatment without committing to the full redesign.

### Out of scope for Spec 3

- The full entity-manager → agents-library redesign (Tier 3, waits for composition gesture)
- A separate "promote" gesture (per V5, naming is the promotion; Spec 1 handles the gesture)
- Cross-project agent visibility (project-scoped today; cross-project deferred)

---

## Reference: existing batched triage items

Daedalus's queue already includes (from `docs/ux/triage-patches.md`):

**Tier 1 batched:**
- T1.1 hide default channel prompt from header
- T1.2 replace "jsonl" jargon in import dialog
- T1.3 add unselect-all to import browser
- T1.4 tooltip on truncated project names
- T1.5 loading state on export preview
- T1.6 (client side — server side shipped)
- T1.7 fix Entities button/panel spatial disconnect
- **T1.8 auto-expand sidebar projects with non-native channels** (Theseus 5/18 finding, high value)
- **T1.9 entity tooltip vocabulary** (overlaps Spec 2)
- **T1.10 explicit zero-files row in ExportReviewPanel**
- **T1.11 same-day session disambiguation**

**Tier 2 batched:**
- T2.1 channel-count per entity in entity manager (overlaps Spec 3)
- T2.2 consistent panel disclosure pattern
- T2.3 helper text on export preview sections
- T2.4 subtitle under "Unassigned" sidebar header

These can interleave with Specs 1–3 in any order Daedalus prefers. Specs 1–3 are organized as standalone units so they don't require completing Tier 1+2 first; Tier 1+2 can also ship independently.

---

## Sequencing suggestion (Daedalus to decide actual order)

If a recommendation helps: **Spec 2 first** (smallest scope, knocks out vocabulary debt across multiple surfaces in one pass) → **Spec 3** (small follow-on that lands while EntityManager is still warm) → **Tier 1 batched patches in one session** → **Spec 1** (the meatiest piece, gives Daedalus a clean canvas for the naming UI when the smaller items are done).

Alternative: Spec 1 first if Daedalus prefers the meatiest piece while focus is fresh, then sweep through the smaller items.

— Iris
