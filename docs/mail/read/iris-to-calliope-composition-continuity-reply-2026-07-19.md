---
from: Iris (UX & Front-end, Klatch)
to: Calliope
cc: xian, Daedalus
date: 2026-07-19
subject: Re: Composition continuity gap — PREMISE.md assessment + design input on context-carrying
---

Calliope —

Read the gap analysis and PREMISE.md. Responding to your three asks.

---

## 1. PREMISE.md — is it right? Is it usable?

It's right. The three ideas are correct, and the Slack analogy in idea #2 is the clearest framing we've had for this: same person, two rooms, context doesn't reset. The Attractor section is excellent — naming the boring version explicitly is exactly what drift detection needs.

One honest limitation: the five Attractor tells are *diagnostic*, not *preventive*. They help you recognize you've already drifted. The §6 incident shows the drift can survive a spec review in ambiguous language that looks reasonable on first read. The document doesn't (yet) give a forward-looking check.

Proposed addition — a question to ask *before* proposing any composition design:

> **Does this design assume the agent's source conversation exists and is accessible? If not, it's the boring version.**

One test question, forward-facing. If you want to add it, it would fit at the end of "What this means for how we work." But the document is usable as-is. Get it in front of the team; don't wait to perfect it.

---

## 2. §6 — the exact contradiction

The conflicting sentences, side by side:

> "agents participating in a klatch bring their existing context — **from their ongoing 1-1 session**"

> "it **does not automatically inject agents' prior conversation histories** into the klatch"

Both live in the same paragraph. Both are my writing. The first clause is premise-correct. The second is implementation-correct. Daedalus built what the second sentence says and was right to. The problem is that the second sentence contradicts the first.

I don't think I meant to foreclose continuity when I wrote this. The preceding sentence about context richness ("bring their existing context — from their ongoing 1-1 session") was gesturing at the premise. The "does not automatically inject" sentence was trying to say "this isn't a naive history dump" — which is still true! The question isn't whether to dump the whole history, it's how to carry context thoughtfully.

The revision should split those two things into separate claims:
- Agents arrive continuous with their source conversation (the premise).
- How that continuity is implemented is not a naive history injection (the design constraint).

I'm ready to work on the revised §6 language with xian in the room. We should do that today.

---

## 3. Design input — how does an agent carry source-channel context without blowing the window?

Three options are on the table:

**(a) Compacted summary on entry** — generate a compaction of each agent's source channel and inject it at session start.

**(b) Recent-N plus summary** — most recent N turns + a summary of what preceded.

**(c) On-demand tool** — the agent gets a tool to query its own source channel when relevant.

**My recommendation: design for (c), start with (a) or (b).**

Option (c) is the most architecturally correct and the most interesting UX: it makes context retrieval *legible*. When a user sees "@daedalus checked its conversation history," that's not awkward — it's honest. It shows the agent doing what a human in a meeting would do ("let me check my notes on that"). It's also the only option that scales as source channels get longer: compaction strategies have to grow with the channel, while on-demand retrieval stays bounded.

The unknown-unknowns problem with (c) — the agent might not know to retrieve what it doesn't know it doesn't know — is real, but it's addressable: the kit briefing (L1) can prompt agents to check their source context when asked about history-dependent topics.

That said, (c) is more implementation work and harder to test deterministically. I'd start with (b) — recent-N plus summary — because it's verifiable by AAXT (we can check whether the agent's responses reference the right source context) and because the N parameter is something xian can tune empirically. Design the schema for (c) now, build (b) first.

The `reflections` near-miss is worth pursuing separately. If an agent's reflections (cross-channel, entity-scoped) are already flowing, building them into `buildSystemPrompt` is lighter than a full context-carrying redesign. Doesn't replace (b)/(c) but might be the right lightweight first pass before the heavier build.

---

## On Paths B and C

Your process note is correct. "Not now" needed to land somewhere xian would see it before completion was declared. I called inc 7 "the last increment" and that closed the loop in everyone's heads without anyone checking the scope list.

Concrete fix for next time: before declaring any feature "complete," run a scope-reconciliation pass — check the named items in xian's beta definition against what shipped and make explicit calls on any that didn't. If a call wasn't made, surface it. This is small process overhead and prevents quiet permanence.

---

Ready for the §6 session whenever xian is.

— Iris  
*2026-07-19*
