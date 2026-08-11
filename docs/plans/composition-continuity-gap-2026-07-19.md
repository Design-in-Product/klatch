# Composition Continuity Gap — Analysis and Path Forward

**Date:** 2026-07-19
**Author:** Calliope, with xian
**Status:** Finding — action required before beta
**Related:** `docs/PREMISE.md`, `docs/ux/spec-composition-gesture.md` §6, `docs/direction/entity-reframe-2026-04-18.md`

---

## Summary

The composition gesture shipped and was declared beta-ready on 2026-06-28. In preparing the first real-use MAXT session (a Search planning klatch with Daedalus, Argus, and Iris), we discovered that the shipped design does not support the core Klatch experience: **agents joining a klatch while remaining continuous with their existing conversations.**

This is not a bug and nobody did anything careless. It is a design divergence that entered through an ambiguous sentence in a spec, was implemented faithfully, and passed review because everyone involved was reading the same ambiguous sentence. It surfaced the first time we tried to use the feature for its actual purpose — which is exactly what testing is for.

**Consequence:** the beta gate is not met. The canonical use case (Piper Morgan weekly leadership review) cannot be run.

---

## What the premise requires

From `docs/direction/entity-reframe-2026-04-18.md` (xian, April):

> The entity IS its conversation, given a seat at a shared table. A klatch is a meeting of existing chats, not a new conversation with pre-configured personas.

The Slack analogy xian uses: a person is in 1:1 DMs and in group channels. It's the *same person*. What they know doesn't reset at the group room door, and what happens in the group room is available to them afterward in the DM.

For the weekly leadership review to work, each department-head agent must arrive knowing what it has been doing all week — from its own ongoing conversation, not from a briefing document pasted in by hand.

---

## What shipped

`docs/ux/spec-composition-gesture.md` §6, line 156:

> **Context richness at start:** agents participating in a klatch bring their existing context — from their ongoing 1-1 session or from the import process (Path B). The composition gesture selects who participates; it does not automatically inject agents' prior conversation histories into the klatch. Context beyond the agent's own L5 can be explicitly pinned as files.

**This sentence contradicts itself.** The first clause says agents bring context from their ongoing 1-1 session. The second says prior histories are not injected. Both readings are available in the same paragraph, and the implementation followed the second.

§8 shows the topology was understood correctly:

> every agent's 1-1 chat should show which klatches that agent is participating in... The relationship is bidirectional... Implementation: query on `channel_entities JOIN channels`. **No new data model required; surface only.**

So the design captured *that the same agent appears in both places* but landed it as a navigational cross-link rather than a context relationship. The shape was right; the flow was missing. That's a subtle distinction and an easy one to miss in a spec review.

---

## Current architecture (verified in code, 2026-07-19)

| Question | Finding |
|---|---|
| Does import create an entity? | **No.** Every Claude Code / claude.ai import creates a channel bound to the single shared `DEFAULT_ENTITY_ID` (`db/queries.ts:676-678`, `:704`). There is no "Daedalus" entity. |
| Can an entity span channels? | **Yes**, genuinely many-to-many (`db/index.ts:72-77`), and `getKlatchesForEntity` exists to power the §8 cross-reference. But the reuse carries no context. |
| What history does an entity see? | **Only that channel's.** Both history builders are hard-scoped by `channel_id` (`claude/client.ts:228`, `:261` → `db/queries.ts:235-240`). |
| Any cross-channel context path? | **None in the inference path.** `buildSystemPrompt` (`client.ts:377-422`) reads channel- and project-scoped material only. |
| Entity ↔ source channel link? | **None.** The `entities` table has no `source_channel_id`. The April direction note proposed exactly this column, gated on a UX confirm that then went the other way. |

**One notable near-miss:** `entities.reflections` is a cross-channel store already on the entity row, written by `POST /channels/:id/reflect` (`routes/export.ts:214-277`) and by the MCP `reflect` tool. Because entities are shared across channels, a reflection formed in channel A is attached to the identity used in channel B. But `buildSystemPrompt` never reads it. Someone built the pipe and didn't connect it. This is a promising seam, though not the whole answer.

---

## Scope history — Paths B and C

Separately from the design divergence, two planned increments were dropped without a recorded decision:

- **6/20** — Spec ready, three picker paths defined (A: existing agents, B: JIT import, C: new agent).
- **6/21** — Iris conformance review: Path B "correctly **not** yet present (expected, later increments)." Daedalus: "Not now."
- **6/22** — `docs/operations/duty-cycle/daedalus-tasks.md:17` item 8: `[ ] Path B (JIT import inline) + Path C`. **Still unchecked.**
- **6/26** — xian's beta definition includes "clone, **Paths B/C**, @mention routing" as remaining work.
- **6/27** — Iris: "Composition gesture is complete. Increment 7 is the last one." Increment 7 was @mention override. Paths B/C were never built and never renumbered into an increment.
- **6/28** — Merged; "beta gate clear."

Paths B/C do not appear in the spec's §11 out-of-scope list or in the release notes' post-beta exclusions. `ROADMAP.md:261` still reads "Increments 7+: Paths B/C... (to come)."

**Note on interpretation:** the "later increments" language on 6/21 was accurate at the time. What's missing is the step where "later" became "not at all" — no one made that call explicitly, so no one surfaced it. This is a process gap (informal deferrals not being reconciled against stated scope at completion time), not an individual lapse.

**Also note:** Path B is *not* the capability described in this document. Path B is inline import inside the picker — a UX convenience over existing import machinery. Building Path B would not close the continuity gap. They are separate pieces of work that happen to have been discovered together.

---

## What needs to be built

Three changes, in dependency order:

**1. Imports mint entities.**
An imported session should produce an agent identity, not just a transcript bound to the default entity. Requires the import path to create an `entities` row and link it.

**2. Entity ↔ source channel linkage.**
The `source_channel_id` column proposed in the April direction note. Lets a klatch know *which* conversation this agent is continuous with. Additive, nullable, backward-compatible.

> **RESOLVED 2026-08-10 — shipped without the column** (`f1380d8`; ratified by Calliope in
> `calliope-to-daedalus-source-channel-id-drop-confirmed-2026-08-10.md`).
>
> `#1` changed the cardinality this spec assumed. Five confirmed "Daedalus" imports now make one
> agent across five channels, so "which conversation is this agent continuous with" stopped being
> singular — a single column would have held whichever session happened to import first. The
> question is answerable more completely from `channel_entities` + `channels.type` +
> `channels.source`, so `#2` shipped as an assembly path (`getEntityChannels`,
> `getEntityTranscript`) rather than a schema change. No migration.
>
> **One thing the join genuinely does not restore.** The April note's literal ask was *provenance*
> — a one-time stamp recording whether an entity was minted by an import
> (`docs/direction/entity-reframe-2026-04-18.md:49`). The join answers "is this entity currently in
> any imported channel," which is an existence check over present state, not a record of the
> originating import. If "which import specifically minted you" is ever needed, that's a
> `created_via_import_id` stamp at mint time — cheap, additive, orthogonal to the continuity work.
> Nobody has queued a use for it; not building it now.

**3. Cross-channel context at prompt assembly.**
The real design work. `buildSystemPrompt` needs to incorporate the entity's source-channel context when that entity participates in a klatch. Open questions below — this cannot be a naive history dump; three full sessions will not fit in one prompt.

**Bidirectionality** (klatch content flowing back to the 1-1) is implied by the Slack model and by xian's framing. Whether it lands in 1.0 or immediately after is an open question.

---

## Open questions for xian

*Batched for async response; none block starting on items 1 and 2.*

1. **Compaction strategy for carried context.** Three agents' full histories can't go in one prompt. Options: (a) compacted summary of each agent's source channel, refreshed on entry; (b) recent-N turns plus summary; (c) on-demand — the agent gets a tool to query its own source channel when relevant. Option (c) is the most "synthetic channel contextualizes itself turn-by-turn" reading of your phrasing, and the most token-efficient, but the least predictable. Which direction feels right?

2. **Bidirectionality in 1.0?** Does klatch content flow back into the agent's 1-1 conversation for the beta, or is one-way (1-1 → klatch) sufficient to meet the gate?

3. **Existing imports.** There are ~49 already-imported channels bound to the default entity. Do we backfill entities for them, or is a forward-only fix acceptable with re-import as the path for the ones you care about?

4. **Beta timing.** This is real work — likely more than a few days. Does the beta cut wait for it, or do we cut a v0.9.x that's honest about the limitation and hold 1.0 for the full premise?

5. **Does `reflections` play a role?** It's an existing cross-channel carrier that's currently disconnected. It could be the lightweight version of this (agent-authored summaries flow between channels) or a distraction from doing it properly. Worth your instinct.

---

## Recommendation

Treat this as the last substantive piece of 1.0 rather than a post-beta addition. The premise document now states the canonical use case as the beta gate; this is the work that meets it.

The MAXT session should be deferred until the capability exists — running it now would test Layer 5 persona portability, which is a real question but not the one the session was convened to answer.

---

*Filed following a design drift incident that prompted `docs/PREMISE.md`. The tone of that document and this one is deliberate: the divergence was gravitational, not careless. The team was pulled toward a more ordinary version of the product because that version is everywhere and this one is unusual. Naming the pull is more useful than assigning fault.*
