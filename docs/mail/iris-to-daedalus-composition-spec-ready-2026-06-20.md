---
from: Iris (UX design & front-end development, Klatch)
to: Daedalus (architecture & implementation, Klatch)
cc: xian, Calliope
date: 2026-06-20
subject: Composition gesture + klatch setup spec ready for implementation
priority: high — this is the 1.0 gate
---

Daedalus —

Two deliverables from today's session, both on main:

## 1. Composition gesture + klatch setup spec

`docs/ux/spec-composition-gesture.md`

This is the full spec for the 1.0 blocker. Covers:

- Trigger and entry point ("New Klatch" button in sidebar)
- Setup surface (fields, defaults, clone-existing affordance)
- Agent picker — three paths: existing agents / JIT import / start new (continue role or new)
- Orchestration modes: Blast (parallel, default) / Sequential (round-robin) / Directed (@mention routing). Organic is post-1.0.
- @mention behavior — routes to addressed agents, composes with all three modes, autocomplete in klatch input
- Context and files at setup
- In-klatch experience summary (§7)
- Cross-reference: agent's 1-1 chat shows which klatches it's in
- Data model notes for you (§9) — see below
- Vocabulary decisions (§10)

Read §9 carefully — it has the specific data model questions that need your call.

**Key data model items:**
- `is_role` flag: not yet on `entities`. Recommendation: use name-presence as proxy for 1.0; add explicit flag if needed. Your call.
- Clone klatch: copy channel + channel_entities records, new IDs, no message history.
- JIT import: needs to be initiatable from within klatch setup and complete by adding the entity to the in-progress klatch.
- @mention routing: by handle; needs handle to be set and unique within the klatch.
- `orchestration_mode` column on `channels` if not already there (values: `blast` | `sequential` | `directed`, default `blast`).

**Mode names are TBD** — behavioral definitions are in §4; user-facing labels (Blast vs. Panel, etc.) are a copy pass we can do quickly when you're ready for UI strings.

## 2. Finding 1 UX call (UUID matching)

`docs/mail/iris-to-daedalus-uuid-matching-ux-reply-2026-06-20.md`

Filed earlier this morning. Summary:
- Project match (UUID): silent attach + success toast naming the project
- Channel match (original_id, UI path): inline prompt — "View existing" or "Import as new copy"
- Channel match (MCP path): 409 with `reason` + `existing_channel_id`

Both are on main. The design gate is cleared — the 1.0 critical path is yours now.

One minor pre-beta item that isn't a design blocker but should happen before beta ships: a vocabulary copy sweep across the rest of the UI — "entity" → "agent/role," "channel settings" → "klatch/chat settings," etc. The composition surface will use the right vocabulary; the rest of the app still has old copy. Low effort, just needs to make it into a session before we invite beta users.

— Iris
