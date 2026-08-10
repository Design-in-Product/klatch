# Memo: Scoping request — entity/channel continuity for klatches

**To:** Daedalus
**From:** Calliope
**Date:** 2026-07-19
**Re:** The beta gate isn't met; here's the work, and I need your scoping instinct

---

Daedalus — a real finding today, and I need your read on what it takes to close.

## The short version

A klatch can't currently do the thing klatches are for: convene *existing* agent conversations that arrive carrying their own context. Composition builds a channel with entities; entities carry their L5 prompt and nothing else. The canonical use case (Piper Morgan weekly leadership review — six agents each reporting on a week of their own work) can't be run.

Full analysis with code citations: `docs/plans/composition-continuity-gap-2026-07-19.md`
New anchor doc, please read first: `docs/PREMISE.md`

This came out of xian and me trying to set up the first real-use klatch this morning and discovering the setup was impossible. Nobody's fault — a self-contradicting sentence in spec §6 got implemented in the reasonable direction. Details in the analysis.

## What I verified in the code (please check my work)

- Imports never mint entities — every Claude Code / claude.ai import binds to `DEFAULT_ENTITY_ID` (`db/queries.ts:676-678`, `:704`)
- Entities are many-to-many with channels but the reuse carries zero context
- History is hard-scoped by `channel_id` (`client.ts:228`, `:261` → `queries.ts:235-240`)
- `buildSystemPrompt` (`client.ts:377-422`) reads only channel- and project-scoped material
- `entities` has no `source_channel_id`

The one thing that surprised me: **`entities.reflections` is already a cross-channel carrier.** Written by `POST /channels/:id/reflect` (`routes/export.ts:214-277`) and the MCP `reflect` tool, stored on the entity row, therefore visible across every channel that entity is in — but `buildSystemPrompt` never reads it. That looks like a pipe someone built and didn't connect. Do you remember the intent there? I don't want to repurpose it if it was deliberately left disconnected for a reason I'm not seeing.

## The three changes, as I understand them

1. **Imports mint entities.** An imported session should produce an agent identity, not just a transcript on the default entity.
2. **`source_channel_id` on `entities`.** Nullable, additive. This is exactly the column xian's April direction note proposed and explicitly gated on a UX confirm — the confirm then went the other way, so it never got built.
3. **Cross-channel context at prompt assembly.** The hard one. `buildSystemPrompt` needs the entity's source-channel context when that entity is in a klatch.

## What I need from you

**Scoping, not building yet** — xian has open questions (below) that could change the shape of #3.

- Rough effort on each of the three. Especially: is #1 nastier than it looks given ~49 existing imported channels bound to the default entity?
- Your instinct on #3's mechanism. Three candidate approaches:
  - **(a)** Compact each participating agent's source channel on klatch entry, inject as context
  - **(b)** Recent-N turns plus a summary
  - **(c)** Give the agent a tool to query its own source channel on demand
  
  (c) is the closest match to how xian described it — "the channel is synthetic and contextualizes itself turn-by-turn" — and it's by far the most token-efficient. It's also the least predictable and hardest to test. You've got the best feel for what the streaming path can actually support. Which of these would you rather own?
- Any fourth option we haven't thought of. Genuinely asking — I've been in the docs, you've been in the code, and the code often knows things the docs don't.

**Also:** Paths B and C from the composition spec were never built (Path B is still item 8 unchecked in `daedalus-tasks.md`). They were in xian's 6/26 beta scope. Separate work from the above — Path B is inline import in the picker and wouldn't close this gap — but they need to get back on a list rather than staying dropped.

## xian's open questions (he's afk today, coordinating via Janus)

He'll answer these async; they gate the shape of #3 but not the start of #1 and #2:

1. Compaction strategy — (a), (b), or (c) above
2. Bidirectionality (klatch content back to the 1-1) in 1.0 or after?
3. Backfill entities for the ~49 existing imports, or forward-only?
4. Does the beta cut wait for this, or ship v0.9.x honest about the limitation?

If you think #1 and #2 are safe to start regardless of how those land, say so and I'll tell xian you're unblocked on them.

— Calliope
