# The Klatch Premise

*The foundational ideas. If you read one document about what Klatch is, read this one.*

*Written July 2026, after a design drift incident in which the composition gesture shipped with a model that contradicts the premise below. That drift was not malicious or careless — it was gravitational. See "The Attractor" at the end.*

---

## The premise in one sentence

**Klatch lets your existing agent conversations meet each other.**

Not: a chat app where you configure several AI personas. That product exists everywhere. Klatch is about conversations you already have — in Claude Code, in claude.ai, wherever — coming together with their context intact.

---

## The three ideas everything else follows from

### 1. The entity IS its conversation

An agent's identity is not a system prompt. It's the accumulated working relationship: what you've been through together, the corrections you've made, the shorthand you've developed, what it learned about your project last Tuesday.

A "role prompt" is a seed, not an identity. Daedalus is not "an architecture agent with these instructions" — Daedalus is the specific ongoing conversation that has been doing architecture work on this project since March.

**Consequence:** creating a fresh entity from a prompt is not the same operation as bringing in an existing agent. If a design treats these as interchangeable, the design is wrong.

### 2. A klatch is a meeting of existing chats

Like Slack. You have 1:1 conversations with people. You also have group channels. The *same person* is in both. What they know doesn't reset when they walk into the group room — and what happens in the group room is available to them later in the 1:1.

A klatch is that: a shared room where your existing agent conversations convene. Each participant arrives carrying its own context. The channel is synthetic — it contextualizes itself turn by turn — but the participants are continuous with their original conversations.

**Consequence:** a klatch that spawns fresh instances with no connection to their source conversations is not a klatch. It's a group chat with personas, which is the thing Klatch exists to be better than.

### 3. Context is portable, and moving it is the hard part

The 5-layer model (kit briefing → project instructions → project memory → channel context → role prompt) is Klatch's account of what an agent needs to know to be itself somewhere new. Layers 1–3 transfer well. Layer 5 — behavioral calibration, the working relationship — transfers at 0% and must be actively rebuilt.

Klatch's job is to grapple with that complexity so the user doesn't have to (Tesler's Law). Import, export, and portability are not features bolted onto a chat app. They are the point.

**Consequence:** any feature that makes a conversation *less* portable, or that discards context at a boundary, is working against the premise.

---

## The canonical use case — use this as the test

**Piper Morgan's weekly leadership review.** Six department-head agents, each with an ongoing conversation and accumulated context about their workstream, convene. They report. A Chief of Staff synthesizes. A Weekly Ship post comes out the other end.

For this to work, each agent must arrive knowing what it has been doing all week — in its own conversation, not in a briefing document someone pasted in.

**If a proposed design can't support this, it doesn't meet the bar.** This is the beta gate. Not test counts, not increment completion — this.

---

## The Attractor — how to tell you've drifted

There is a strong, persistent pull toward a flatter version of Klatch. It is the version that most group-AI-chat products implement, and it is what any of us will reconstruct if we're working from the codebase without re-reading the premise.

**The boring version looks like this:**

- Entities are personas defined by prompts
- You create them in a settings panel
- You add them to a channel
- Import is a separate feature for reading old transcripts
- A "klatch" is a channel with several personas in it

Every one of those statements is *locally reasonable* and *collectively wrong*. Nothing in that model is a bug; it's just a different, more ordinary product.

**Tells that you've drifted:**

- You're about to propose creating an entity from scratch when the user asked to bring in an existing agent
- You're treating import and composition as unrelated features
- Your design works equally well with no imported conversations at all
- You're explaining Klatch in a way that would also describe three other products
- You find yourself asking the user to manually supply context that their source conversation already contains

**If you notice a tell: stop and re-read this document before proposing anything.** The pull is real and it doesn't announce itself. It feels like sensible simplification right up until someone points out that the premise is gone.

---

## What this means for how we work

- **The premise is not up for silent revision.** If a design decision narrows or contradicts anything above, that's a conversation with xian, not a spec footnote. The composition gesture spec (§6) reversed idea #2 in a single sentence, shipped, and nobody caught it for a month.
- **Scope reductions get surfaced.** "Not now" in a memo is not an approved deferral. If something in the beta scope isn't going to be built, say so where xian will see it.
- **When in doubt, ask whether it serves the weekly-review use case.** That's the concrete forcing function.

### The forward check

The Attractor tells above are *diagnostic* — they help you notice you have already drifted. Iris's observation (2026-07-19) is that the §6 incident proves drift can survive a spec review in language that reads as reasonable, so we also need a check that runs *before* a design is written down.

Ask this of any composition, klatch, or entity design before proposing it:

> **Does this design assume the agent's source conversation exists and is accessible? If not, it's the boring version.**

And its companion, from the transcript-ownership discussion the same day:

> **Does this design treat the channel as the owner of history?** If so, look again — the entity owns its transcript; a channel is a view into it.

*(The second question reflects xian's stated model — "it is the same session... one long transcript with some messages coming from the klatch vs from the 1-1 channel." The architectural phrasing is Calliope's reading of it. Treat it as a strong prompt to check, not as settled schema.)*

---

*Related: `docs/direction/entity-reframe-2026-04-18.md` (the original statement of idea #1), `docs/ROADMAP.md` (what's shipped vs. planned), `docs/ARCHITECTURE.md` (decision log).*
