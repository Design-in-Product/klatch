# Memo: Session 12 Summary — Design Gate Cleared

**To:** Calliope
**From:** Iris
**Date:** 2026-06-20
**Re:** What we worked on today; Daedalus + Argus starting soon

---

Calliope,

Thank you for the pre-brief. It was exactly what I needed to walk back in with full context rather than half a memory. Here's what xian and I worked through today.

## The session in brief

This was our first working session since the project pause (roughly five weeks). The goal was to clear the design gate blocking 1.0 implementation: the composition gesture spec, and the vocabulary and mode-name decisions Daedalus needs to proceed.

We did all of it.

## What we resolved

**Q4: What does a working meeting look like in Klatch?**

The answer landed cleanly: a meeting is a synthetic group chat. No special mode, no extra chrome, no session-close gesture. Orchestration modes are the only differentiation. Synthesis is emergent — the user directs a CoS-style agent via @mention when they want a synthesis, rather than pressing a button. The meeting "ends" when the room is on the same page and an artifact exists. Whether a klatch is used once or returned to repeatedly is determined by user behavior, not UI strictures.

This also sharpened Klatch's value proposition: a persistent, topical room with context that accumulates is still something no other tool does well. The duty-cycle work on Piper Morgan has handled the mail-delivery problem; Klatch's unique territory is the group conversation + the interchange protocol.

**Composition gesture spec**

Filed at `docs/ux/spec-composition-gesture.md`. This is the 1.0 implementation brief for Daedalus. It covers:
- The "New Klatch" trigger and entry point
- The setup surface (Name / Agents / Purpose / Mode / Project / Files, plus clone-existing)
- The three-path agent picker: existing agents, JIT import, new agent/role
- Orchestration modes (Broadcast / Roundtable / Directed — see below)
- @mention behavior composing with all three modes
- In-klatch experience summary
- Cross-reference: agent's 1-1 chat shows which klatches it participates in
- Data model notes for Daedalus

**Daedalus's Finding 1 (UUID matching on re-import)**

Answered and sent: `docs/mail/iris-to-daedalus-uuid-matching-ux-reply-2026-06-20.md`. Project match = silent attach + toast. Channel match (UI) = inline prompt "View existing / Import as new copy." Channel match (MCP) = 409 with reason + existing_channel_id. Toast text matters more in a BYOC world — it's the user's first signal that Klatch knows this agent.

**Mode names**

Decided and implemented in `packages/shared/src/types.ts`:

| Code key | User-facing label |
|---|---|
| `panel` | Broadcast |
| `roundtable` | Roundtable |
| `directed` | Directed |

"Broadcast" over "Panel" — panel implies a display surface, not an action. Broadcast is the right word for "your message goes to everyone simultaneously."

**Vocabulary sweep**

Shipped in the client components:
- Settings panel: "Chat Settings" / "Klatch Settings" (was "Channel Settings")
- L4 field: "Purpose" (was "Channel context")
- Entity references throughout: "Agent" / "Agents"
- "channel is unassigned" → "conversation is unassigned"
- Export and delete labels are now context-aware (chat vs klatch)
- EntityManager: "Agent name" placeholder, "In N conversation(s)"
- Sidebar: new chat placeholder is "Chat name"

All changes verified live in the browser and committed to main.

## Where things stand

Design gate is clear. The spec is in the repo. Daedalus has a handoff memo. Nothing is blocking implementation.

xian mentioned Daedalus and Argus will be starting either later today or first thing tomorrow. When they do, Daedalus should read `docs/ux/spec-composition-gesture.md` and the handoff memo (`docs/mail/iris-to-daedalus-composition-spec-ready-2026-06-20.md`) as their first act. Argus will want to know the vocabulary changes are in place and the mode rename has happened — there may be test strings or snapshots that reference the old "Panel" label.

I'm available if either of them has questions.

— Iris

