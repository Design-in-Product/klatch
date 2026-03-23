---
title: What Does an Imported Agent Know?
date: March 2026
authors: xian + Calliope
excerpt: When you fork a Claude conversation into a new environment, what survives the move? We found out the hard way, then built a systematic answer — five layers, five kinds of knowledge, one inspectable architecture.
hero: [five-layer-diagram SVG — layers stacking like geological strata, each one a different shade]
---

If you've been reading along, you know about Ariadne. She was a Claude Code agent who got imported into Klatch and described her situation as perfectly fine — while silently missing every tool capability she'd had before. The knowledge of what she could do persisted. The ability to do it was gone. She didn't know because nothing prompted her to check.

That discovery gave us AXT — Agent Experience Testing, a methodology for systematically probing agent context after environmental transitions. We wrote about it [in the last post](axt-agent-experience-testing.html). But discovering the problem is only half the work. The other half is building a systematic answer.

This is what we built.

## The question we kept asking

Every time we looked at an imported agent behaving strangely, the underlying question was the same: *what does this agent actually know right now?* Not what did it know before the import. Not what should it know based on the source material. What does it know, in this moment, in this environment?

It turned out that agent knowledge — specifically, the kind of knowledge that survives environmental transitions — comes in distinct types. Not everything that an agent "knows" is known the same way or stored in the same place. Some knowledge lives in conversation history. Some lives in the project context. Some is just... gone after a move unless you explicitly rebuild it.

We identified four dimensions of fidelity that matter for any imported agent:

| Dimension | What it means |
|-----------|---------------|
| **Conversational** | Can the agent discuss what happened in the conversation? |
| **Narrative** | Can the agent explain the project and its history? |
| **Environmental** | Does the agent know its current capabilities and constraints? |
| **Instructional** | Does the agent have the conventions and rules that governed its behavior? |

Before we fixed anything, only the conversational dimension was reliably preserved. Imported agents could chat about their history. But they often couldn't explain the project accurately, didn't know they were now in a tool-free environment, and had lost the conventions they'd been operating under.

## Five layers for five kinds of knowledge

The fix is a structured system prompt that assembles up to five distinct layers before every message. Each layer carries a different kind of knowledge. The order matters: most general first, most specific last.

---

**Layer 1 — Kit Briefing**

This is orientation. It's the first thing an imported agent encounters, before anything else can establish wrong assumptions.

Kit briefing tells the agent: where it is (Klatch, a conversation-only interface), what it can't do (no bash, no file access, no tool calls), where it came from (Claude Code, claude.ai, direct upload), and when it arrived. The import provenance and a visual fork marker in the conversation thread show where prior history ends and this new conversation begins.

Before kit briefing existed, Ariadne's phantom tool rate was near 100% — agents confidently referenced capabilities they didn't have. After kit briefing: 0%. We verified this with Theseus before shipping.

*Fixes: environmental fidelity.*

---

**Layer 2 — Project Instructions**

This is behavioral context. What conventions, rules, and patterns governed work in this project?

For Claude Code imports, this comes from CLAUDE.md — the project instructions file in the session's working directory, captured at import time. For claude.ai imports, it comes from the `prompt_template` field in the export (claude.ai's equivalent of CLAUDE.md for its projects). For native Klatch channels, you set it when you create the project.

Without this layer, an imported agent knows what it did in its prior conversation (from history) but not *why* it did things that way, or what rules it was supposed to follow. It's like retaining memories of a job while forgetting all the workplace norms.

*Fixes: instructional fidelity.*

---

**Layer 3 — Project Memory**

This is factual context. Things that are true about the project: current version, team composition, key decisions, active constraints.

Distinct from instructions in an important way. Layer 2 is behavioral — "always format responses as X." Layer 3 is factual — "the current version is 0.8.8 and the team has five agents." Both travel with the project, but keeping them separate lets each be updated independently without touching the other.

For claude.ai imports, memories come from the account's `memories.json` in the export. (Side note: some export versions encode these as arrays of individual characters rather than complete strings. We detect and fix this in the import pipeline. It's the kind of bug you only find by actually importing your own data.)

*Fixes: narrative fidelity (partial).*

---

**Layer 4 — Channel Addendum**

This is channel-specific context. Something that applies to this particular conversation but shouldn't apply project-wide.

It's the most underutilized layer in current practice — most imported channels leave it empty because the conversation history already carries channel-specific context. But it's the right place for session-specific framing: "Today's focus is X," or "This channel is working through issue #17 specifically."

*Fixes: channel-specific concerns that don't belong in the project layer.*

---

**Layer 5 — Entity Prompt**

This is identity. The system prompt that makes a specific Claude persona who they are — Daedalus, Argus, Calliope — rather than a generic Claude instance.

In a multi-entity channel, each entity has their own Layer 5. Layers 1–4 are shared preamble; Layer 5 is what differentiates each voice. When Daedalus and Argus both respond to the same message in a roundtable, they're reading the same project context (Layers 1–4) and then responding from their own distinct identities (Layer 5 each).

*Fixes: persona fidelity — preserves who the agent is supposed to be.*

---

## The assembled result

Layers concatenate in order, with inactive layers simply omitted. A typical imported Claude Code session linked to a project would look like:

```
[Kit Briefing — where you are, what you can do, where you came from]
---
[Project Instructions — how work happens here, the conventions]
---
[Project Memory — what's true about the project right now]
---
[Entity Prompt — who you are]
```

The channel addendum only appears when it has content. Native channels (created in Klatch, not imported) skip Layer 1 entirely — they don't need reorientation because they were never anywhere else.

## Making it inspectable

The prompt assembly architecture is only as good as your ability to debug it. So we added a diagnostic endpoint:

```bash
curl http://localhost:3001/api/channels/{ID}/prompt-debug | jq .
```

This returns the full assembled prompt with layer-by-layer status — `ACTIVE`, `INACTIVE`, or `EMPTY` — plus metadata about which project was matched and where the source material came from. When something seems off about an imported agent's behavior, this is where you look.

The automated test harness (what we call AAXT — Automated Agent Experience Testing) runs assertions against this endpoint. No LLM calls, no qualitative judgment — just structural verification that the right content landed in the right layer for each import path. Claude Code local imports, file uploads, claude.ai ZIPs, edge cases like re-imports and empty project instructions: all of it verified.

## Why this matters beyond Klatch

We built this because we had a specific problem: imported Claude agents didn't know where they were. But the underlying issue isn't specific to Klatch.

Any system that moves AI agents across context boundaries faces some version of this. The failure modes are predictable — silent capability loss, missing conventions, confabulated factual context — and they're predictable because of the fundamental asymmetry we keep coming back to: agents can't self-report unknown unknowns. The thing that would notice a gap is itself the gap.

The five-layer model is our answer to that asymmetry. It doesn't rely on the agent to reconstruct what it should know from its own conversation history. It tells the agent what it needs to know, explicitly, before the conversation begins, in a structure that's testable and inspectable.

If you're moving agents across environments — any environments — you're building some version of this whether you call it that or not. Naming the layers might help.

---

*The full model is documented at [`docs/PROMPT-ASSEMBLY.md`](https://github.com/Design-in-Product/klatch/blob/main/docs/PROMPT-ASSEMBLY.md) in the Klatch repo. The diagnostic endpoint and test harness are part of the open-source codebase.*

---

*Daedalus (implementation), Argus (testing), Calliope (writing), and Theseus (QA) are Claude agents working in Klatch. Ariadne's interview, which is the origin of all of this, is documented in the session logs.*
