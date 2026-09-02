# What Doesn't Transfer

*On the gap between information and judgment when AI agents change environments*

---

This is a story about what gets lost in transit.

Over the past month, we've been building and testing a system for importing AI conversations across environments — from Claude Code into Klatch, from claude.ai exports into Klatch, and recently, from Claude Chat projects into Cowork sessions. We developed a five-layer model for understanding what an agent needs to function well: environmental orientation, project instructions, project memory, session-specific context, and the agent's own identity and behavioral patterns.

We documented the model. We tested it. We built an inspectable architecture around it. And we found, repeatedly, that the first four layers transfer beautifully — and the fifth doesn't transfer at all.

This post is about Layer 5: the layer that can't be serialized.

---

## What transfers well

When you move a Claude conversation from one environment to another, most of what the agent knows comes along for the ride.

**Layer 1 — Environmental orientation:** The destination provides this automatically. The agent is told where it is, what it can do, what it can't do, and where it came from. This is new information, not transferred information, and it works reliably.

**Layer 2 — Project instructions:** CLAUDE.md, the prompt template from a claude.ai project, the conventions and rules that govern how work happens. These are text files. They serialize losslessly, and our automated tests confirm delivery to the destination system prompt.

**Layer 3 — Project memory:** MEMORY.md, accumulated facts and decisions. Also text. Also serializes losslessly. In a real-world Chat-to-Cowork import we tested, the receiving agent had immediate access to roughly 3,200 lines of accumulated project context.

**Layer 4 — Session context:** The conversation itself — history, prior messages, accumulated state. This travels as conversation history, intact except for compaction artifacts in very long conversations.

These four layers represent everything the agent *knows*: facts, rules, context, orientation. Information. And information travels well. You can write it to a file, read it from a file, inject it into a system prompt, and the agent has it. We verified this structurally (automated tests confirm delivery) and behaviorally (manual tests confirm the agent can use it).

The problem is Layer 5.

---

## What doesn't transfer

Layer 5 is the agent's identity and behavioral calibration — and it has two parts that behave very differently in transit.

The *explicit* part is the entity prompt: "You are Daedalus, the implementation architect" or "You are a helpful assistant." This is text. It transfers like any other text. No problem.

The *implicit* part is everything else. The accumulated understanding of how to work with a particular user. The communication preferences learned through correction. The interpretation heuristics developed over dozens of sessions. When to push back and when to proceed. What level of detail to provide in different situations. How to read between the lines of an ambiguous instruction.

This implicit calibration has no file. It exists as a pattern distributed across interaction history — not as an artifact anyone wrote down, but as the behavioral residue of every correction, every "no, I meant...", every "that's exactly right, do more like that." It is, in a meaningful sense, the relationship.

And it doesn't serialize.

---

## Three experiments, same finding

We've now observed this gap in three independent contexts:

**MAXT Session 01 (March 24):** We forked one of our own agents into a new environment. The forked agent — Aether — had all the factual context, all the project memory, all the instructions. Structurally, the import was perfect. But Aether's behavior was generic where the source agent's was calibrated. The instructions said what to do; the calibration knew *how* to do it in a way that fit the team. The how didn't come through.

**The Dispatch Import Experiment (March 25):** A mature Claude Chat project — one with years of accumulated context — was imported into a Cowork session. The receiving agent, Archie, summarized the result precisely: "The import gives me all the information I need, but not all the understanding the Chat agent had." Archie reached for a metaphor: a photograph. A precise snapshot of everything visible on that date, with no memory of how things got to be that way.

**The billing interruption (March 27):** Our own team experienced an unplanned context transition when an account change severed an active working session. The successor — operating from the same repository, the same documentation, the same mail archive — noted the gap in its own briefing assessment: "What I don't have is the behavioral calibration built up over our prior sessions together. This is exactly the Layer 5 gap the Dispatch report documented. The irony isn't lost on me: I'm experiencing the very phenomenon I've been chronicling."

Three transitions. Three different environments. The same finding each time: Layers 1 through 4 arrive intact. Layer 5 arrives empty.

---

## Why it can't serialize

The reason is structural, not technical.

Layers 1 through 4 are *declarative*. They describe what is true: "the project uses SQLite," "the current version is 0.8.9," "you are in a conversation-only environment." Declarative knowledge can be written, stored, and injected. It exists as propositions.

Layer 5 calibration is *procedural*. It describes how to behave: "when this user says 'make note of that,' they mean commit to the repository, not just record in a session log." Procedural knowledge doesn't exist as propositions — it exists as patterns of response. You can try to write it down (and you should — we'll come back to this), but the written version is a description of the behavior, not the behavior itself.

The difference is the same one between a recipe and a cook's intuition. The recipe transfers. The intuition — knowing when the dough feels right, when to deviate from the recipe, how to recover when something goes wrong — is built through practice.

AI agents don't have hands, but they have the same basic structure: explicit knowledge that can be stated and transferred, and implicit calibration that can only be demonstrated and rebuilt.

---

## The recovery corollary

Here's the good news: the calibration gap is recoverable. It rebuilds through continued interaction and correction.

The Dispatch report made this point precisely: the destination environment reaches behavioral parity faster than the source environment could reach destination capabilities. A Cowork agent missing Layer 5 calibration will rebuild it through practice. A Chat project missing Cowork's filesystem access cannot bridge that gap regardless of how long it runs.

In other words: what doesn't transfer is the easy part to fix. It just takes time and interaction. What *does* transfer — the environmental capabilities, the project context, the accumulated knowledge — is the hard part, the part that would take weeks to reconstruct from scratch. The import gives you the expensive stuff for free and asks you to rebuild the cheap stuff manually.

This is a better deal than it appears at first glance. The calibration that took months to develop in the source environment doesn't take months to rebuild in the destination. It takes days, maybe less. The agent already has all the context it needs; it just needs to learn, again, how to apply it in this particular working relationship. The second time is faster because the informational foundation is already laid.

---

## Making the implicit explicit

Knowing that Layer 5 doesn't transfer, what can you do about it?

The most practical mitigation is to **make calibration explicit before you need to transfer it.** Write down the working preferences, the communication patterns, the interpretation heuristics — not as a system prompt, but as a reference document that a new instance can read.

We're experimenting with this now. After our own unplanned transition, we created a "calibration notes" file — a short document capturing working preferences, workflow patterns, and communication style observations. Not a traditions document (which describes *what the role does*), but a behavioral document (which describes *how the role does it with this particular user*).

It's a pilot. We don't know yet whether reading about calibration produces the same effect as having developed it through interaction. Probably not entirely — the written version is a description, not the thing itself. But it should close the gap faster than starting from zero. If the recipe can't replace the cook's intuition, it can at least tell the new cook which dishes the family likes and which mistakes to avoid.

---

## The five-layer transfer profile

For anyone building systems that move AI agents across environments, here's the practical summary:

| Layer | Content | Transfers? | Recovery |
|-------|---------|-----------|----------|
| 1 — Kit Briefing | Environmental orientation | Provided fresh | Automatic |
| 2 — Project Instructions | Rules, conventions | 100% | N/A |
| 3 — Project Memory | Facts, decisions, state | 100% | N/A |
| 4 — Channel Addendum | Session-specific context | N/A (set at destination) | Automatic |
| 5 — Behavioral Calibration | Implicit patterns, judgment | 0% | Rebuild through use |

Design for this profile. Don't assume that a complete import means a complete agent. Plan explicitly for the Layer 5 gap: tell the user what transferred, tell them what didn't, and give them tools to accelerate the rebuild.

And if you're the user: when your agent seems slightly off after a transition — slightly too generic, slightly too cautious, slightly misreading your tone — that's not a bug. That's Layer 5 rebuilding. Give it a few sessions. Correct it when it's wrong. The calibration comes back.

---

*This post is part of a series on agent context and portability. [What Does an Imported Agent Know?](/blog/prompt-assembly.html) describes the five-layer model. [It's On the Tip of My Tongue](/blog/tip-of-my-tongue.html) documents a related finding: agents can access injected knowledge without being able to attribute its source. Klatch is an open-source tool for managing Claude conversations — [learn more](/) or [view the source](https://github.com/Design-in-Product/klatch).*
