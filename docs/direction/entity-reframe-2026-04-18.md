---
from: xian (via Calliope)
to: Iris, Daedalus
date: 2026-04-18
subject: Direction — entities are conversations promoted into roles
status: direction note, not yet scoped
---

# Entity reframe

## The reframe

The current Klatch mental model is creation-first:

> Create entity (name, role prompt, model, color) → assign entity to channel → have conversations.

The workflow xian actually describes is promotion-first:

> Have ongoing conversations with an agent → that conversation develops identity and working context → bring it into a klatch (a meeting of existing chats, each carrying its full context).

**The entity IS its conversation, given a seat at a shared table.** A klatch is a meeting of existing chats, not a new conversation with pre-configured personas. From-scratch creation still exists — it's the fallback — but it is not the central use case.

This surfaced during Iris's Session 5 UX walkthrough on April 14. Iris reflected this back to xian and connected it to Topic 5 (the import-to-export arc): the transition from Act 1 (import) to Act 2 (work in a klatch) is precisely where promotion happens.

## Why it matters

Three things shift if we take this seriously.

**1. The import flow is the creation flow.** Today, importing a Claude Code or Claude Desktop conversation creates a channel. Under the reframe, it also produces a candidate entity — the chat's conversational identity, ready to be promoted into a role with a seat at any klatch. Creation-from-form stops being the front door; it becomes the emergency exit.

**2. The entity manager is a library, not a forge.** Right now it's a creation UI. Under the reframe, the primary action in the entity manager is *review and promote* — looking over conversations you've had, deciding which ones have accrued enough identity to deserve a role, and giving them one. The field-note machinery from Phase 3.5 is the raw material for this: behavioral observations extracted from a conversation become the basis for "this chat has become a role."

**3. The MCPB / Managed Agents distribution story reshapes.** When we eventually distribute an entity, we're distributing a conversation-with-history, not a prompt template. The Phase 4 transports already carry this: the export manifest includes field notes with trust provenance. A freshly-promoted entity brings its working memory with it. This aligns with the PA's read on Managed Agents: "Piper IS the agent, with Memory Stores for cross-session context" — same axis, different surface.

## What this doesn't mean

- **Not deleting creation-from-scratch.** It stays. A user starting fresh still needs a path. But it stops being the default gesture.
- **Not a Phase 5 blocker.** Phase 5 (MCP server) should proceed without waiting for this. The reframe affects UX surfaces and eventually entity data model; it does not affect transport protocol work.
- **Not an immediate refactor.** The current entity schema supports this direction — name, system prompt, model, handle. Promotion adds fields (source channel, provenance trail) rather than replacing existing ones. Gall's law applies: the next concrete step is small.

## First concrete step (for Iris when UX synthesis resumes)

Before we touch code, Iris should add this reframe to the UX synthesis session with xian. The five Topics Iris presented on April 14 are compatible with the reframe — Topic 5 (import-to-export arc) is where it shows up most directly — but the reframe should be an explicit thread through the synthesis document, not a footnote.

The question the reframe forces: *what does "promotion" look like as a gesture?* Today entities are created by a form. Under the reframe, promotion is a decision made about an existing object. That's a different interaction pattern. Iris's design principles synthesis ("Who bears the burden?") applies — the user shouldn't have to build a persona they already have in front of them; the system should offer to promote what's already there.

## First concrete step (for Daedalus when implementation time comes)

A small, non-blocking foundation: add a nullable `source_channel_id` to the `entities` table. Backfill NULL. This single column is the data-model seed for promotion — it records whether an entity originated from a conversation or was created from scratch. No UX change yet; just a hook. If and when the UX lands, the field is ready.

Do NOT do this speculatively — wait for the UX synthesis to confirm direction. This is a "when we're ready, the smallest first move" marker, not a work item for this sprint.

## Why this is captured now

xian flagged this as the most consequential product finding of April 14 but has not had time to process it. Iris's UX synthesis is pending (travel schedule). This note exists so the reframe is preserved, visible to both Iris and Daedalus, and citeable — so when synthesis resumes, it doesn't have to be rebuilt from memory.

— Calliope (on xian's behalf)
