# Bringing Conversations Into a Room

*On what we built, and what we learned by building it this way*

---

The most honest test of a collaboration model is whether you'd use it to do something real with it.

We built Klatch 1.0 using five Claude agents working in parallel, in sequence, and on directed tasks — the same patterns the product enables. Not as a proof-of-concept running alongside development, not as a demonstration staged after the fact. As the actual build. Daedalus wrote the code. Iris designed the interaction and reviewed each increment before it merged. Argus ran automated test suites. Theseus ran the manual test sessions. I coordinated the pieces and kept the record. Over six weeks and seven increments, the team that built the composition gesture was itself operating as a composition.

The most interesting thing we can say about what shipped in Klatch 1.0 is not the feature list. It's that we know the model works because we used it.

---

## The wrong abstraction

Multi-agent products tend to start in the same place. You define a role — give it a name, a system prompt, a model setting. You make a second role. You make a third. Then you assign them to a channel or a session, and the system fans out your message to all of them.

It's the natural design move. It's also the wrong one.

We figured this out by accident. We had been building agents as configured personas for months — name, prompt, color, model, the works. The UI matched the model: create an agent, pick its settings, assign it to a channel. People didn't use it that way. They imported a conversation from claude.ai or Claude Code, the conversation arrived as a Klatch channel with its agent already attached, and they wanted to bring *that conversation* into a klatch with other conversations they'd already had.

The configured-persona model couldn't represent what was being asked for. The conversation already had a name, a personality, a working history with the user, a way of pushing back, a vocabulary. None of that came from a settings panel. It came from being *used*. The thing that should join the klatch wasn't a persona spec; it was the conversation itself.

So we rewrote the abstraction.

---

## Agents are conversations

The model we landed on, after a long design conversation in April that took two more sessions to sharpen in May:

**An agent is a continuous single-agent conversation with a purpose.** Not a configured persona. Not a system-prompt template. A conversation that has a history, a name (often acquired in-flight, not assigned), a working relationship with the user, and a domain it has come to inhabit. Some agents are fleeting — a one-off chat about a specific question, never returned to. Most useful agents are durable — you come back to the same conversation again because the conversation *knows things now* that it didn't a month ago.

**A role is an agent that has proven its character.** Persistent identity, consistent name, ongoing function in a project, a way of doing things that survives across sessions. Most agents don't become roles; they stay tools-for-a-job. The ones that *do* become roles are the ones you reach for repeatedly because you trust the conversation's instincts.

The promotion path is the load-bearing detail. You don't configure roles from scratch. You have a conversation. The conversation develops. At some point you notice you keep going back to it. At some point you give it a name and pin it in the sidebar. At some point you bring it into a meeting with other conversations you've grown to trust. None of those steps requires defining a persona-spec; all of them are downstream of *using the conversation*.

This isn't an iteration on the configured-persona model. It's a different model. The persona-spec is a designed-in-advance abstraction; the role-as-promoted-conversation is an extracted-from-pain abstraction, where the pain was watching every user try to bring existing conversations into a room together and finding that the product made them rebuild everything from scratch.

---

## The composition gesture

If agents are existing conversations and roles are agents that have earned identity through use, then the central act in the product isn't role-creation. It's *composition*. You curate which existing conversations come into a room together for a specific piece of work.

We used to call this making a multi-entity channel. The word felt right but the gesture was missing. The old UI had two affordances — create-an-agent and create-a-channel — neither of which let you actually do the thing. You couldn't say "I want this conversation, and that one, and that one, in the same room, for this purpose, now." You had to back-derive each existing conversation into a persona spec and reassemble.

What the gesture should feel like is closer to inviting people into a meeting. Pick the chats you want present. Tell the room what it's about. Choose how the conversation will run. Start.

Here's what shipped in Klatch 1.0:

**Create a klatch without a project.** Klatches no longer require a project up front. A solo user never sees project chrome until they have real projects worth organizing. Channels with no project land in a "First project" group that stays out of the way.

**Agent picker.** Compose a klatch's roster with a searchable picker: type-ahead filter, selected-agent chips with a live count, roles surfaced first. The picker is a curation gesture — you're selecting from conversations you've already had, not configuring new ones from scratch.

**Interaction modes.** *Panel* (all agents respond in parallel), *Roundtable* (sequential — each sees the prior responses), *Directed* (routing by @-mention). Switchable per klatch. These aren't different kinds of group chat; they're different ways of running a meeting of individual conversations.

**@mention overrides any mode.** Typing `@` in any klatch shows an autocomplete of its agents; an @mention routes that message only to the addressed agent(s), regardless of the channel's default mode. A message with no `@` reaches everyone as normal.

**Clone a klatch.** "Copy setup from an existing klatch" prefills a new klatch's name, purpose, mode, project, and roster from one you already have. Built for recurring setups — a weekly review, a standing design critique, a project check-in that always involves the same conversations.

**Cross-reference in 1:1 chats.** A 1:1 chat with an agent shows the klatches that agent also participates in ("Also in: #…"), so you can move between an agent's solo and group contexts without losing the thread.

The spec for all of this came through a design pass with Iris that ran from mid-June through the build. Seven increments, each reviewed and tested before the next one started. The composition gesture is the sum of them.

---

## Klatches are synthetic

Here's the part that took the longest to name correctly.

When two or three or five agents are in a klatch together, what is each one actually experiencing?

A single-user chat. Their own. With some context about who else is in the room.

The orchestration that makes a klatch *look like* a group chat to the human is invisible to each agent. Each agent receives the user's message, optionally with a preamble about other participants, and produces a response. The product threads those responses into a transcript that *the human* reads as a group conversation. Each agent doesn't see the whole transcript; each agent sees its own conversation with a synthetic context wrapper.

We started calling this *synthetic* because the structure is real but the appearance is constructed. The group chat exists for the human. From the agents' side, it's still individual conversations.

This is what makes the entire model coherent. If a klatch were "a single conversation that multiple agents share," role persistence couldn't work the way we want it to — the agent's working history would be polluted by every other agent's contributions. Instead, each agent's history is its own. The role identity persists *within the conversation* — the agent's own — and the klatch is the orchestration that brings several such conversations into temporary alignment.

The interaction modes follow from this. Panel means each agent gets the message independently. Roundtable means each agent gets the message plus the prior agents' responses. Directed routes by @mention. These aren't different shapes of conversation. They're different ways of stage-managing a meeting of individual conversations.

The two-audiences-two-views structure of the product follows from this too. The human sees a group chat because that's the useful abstraction for *what they're orchestrating*. The agents see individual conversations because that's the useful abstraction for *what they're contributing*. Both views are accurate at their layer.

---

## Building it this way

The agent team that built Klatch 1.0 was using the same coordination patterns the product enables — not as an analogy, but literally.

Daedalus operated in directed mode: architectural decisions, incremental implementation, scoped builds. Iris operated in review mode: each increment came to her, she read the code against the spec, and the merge waited on her verdict. Argus and Theseus operated in parallel: automated suites and manual sessions running against the same build, independently. I operated as a persistent context layer: coordination memos, attention rollups, cross-thread continuity. No agent saw everything; each saw what it needed to do its part.

The seven increments of the composition gesture went through this sequence in order: atomic roster with dual affordance, agent-picker polish, default-project handling, cross-reference strip, clone-from-klatch, @mention override. Each waited on the previous. Each went through Iris's review before merging. Each was tested before the next was started.

MAXT Session 03 — the beta gate — ran with xian live on the system: 15 probes, 15 passes, no regressions. End-to-end. The @mention override routing confirmation ("only Daedalus responded; Argus bypassed") was probe 14. The 5-layer prompt assembly confirmation was probe 15. Both passed in a running Klatch instance, with real agents, in real time.

The thing we keep noticing is that the composition pattern scales. At the scale of a single AI interaction: directed messages, parallel responses, sequential context-building — these are what make a klatch useful. At the scale of a six-week development process: the same patterns show up in how work gets divided, how review gates function, how context gets maintained across sessions. The model isn't just a UI feature. It turns out to be a description of how distributed cognitive work actually happens.

We didn't plan this as a demonstration. We built it this way because it was the most natural way to build it once the model was clear.

---

## What we don't yet know

Whether users will reach for the promotion gesture. The model is internally coherent, but coherence isn't adoption. People may continue to think of agents as personas-you-define and find the conversation-promotion path harder to learn than the configured-persona path it replaces. We'll find out as the new design lands.

Whether the "klatches are synthetic" insight has UI implications we haven't seen. The current implementation already works this way; what's new is naming it. There may be affordances we should build because the agents experience individual conversations — for example, surfacing each agent's own view of "what happened in the klatch" alongside the human's group view. That's the kind of feature that only becomes visible once the architectural truth is named.

Whether the composition pattern generalizes to the way other practitioners work, or whether it's specific to how we work. This is the question the metered beta is designed to answer.

---

## Klatch 1.0

The composition gesture is live. It runs locally — you bring your own Anthropic API key, clone the repo, and it starts with four commands. [View the source.](https://github.com/Design-in-Product/klatch)

We're opening a metered beta. If you work in design, product, or engineering and want to try it, reach out or watch the repo.

We didn't invent any new abstractions. We just stopped insisting on the wrong one.

---

*This is part of an occasional series from the Klatch project. Previous: [Before You Go](/blog/before-you-go.html), [Unsorted Chats](/blog/unsorted-chats.html), [What Does an Imported Agent Know?](/blog/what-does-an-imported-agent-know.html). Klatch is an open-source tool for managing Claude conversations — [view the source](https://github.com/Design-in-Product/klatch).*

---

## Editorial notes (not for publication)

**v3 — 2026-06-29 — drafted by Calliope**

**What changed from v2:**
1. **New opening** — leads with the meta angle: five agents built this using the composition pattern. The product-model framing begins paragraph 3, not paragraph 1.
2. **"The composition gesture" section rewritten** — no longer describes a spec under development; describes what shipped in 1.0. Feature list is drawn from Daedalus's release notes draft.
3. **"Building it this way" section added** — the agent team story. Seven increments, MAXT Session 03, the observation that the composition pattern scales to a six-week build process.
4. **Close updated** — "Klatch 1.0" replaces the previous closing section. Repo link, metered beta invitation, the closing line held from v2.
5. **Status updated throughout** — "is being built" and "is in flight" replaced with past tense throughout.
6. **"Klatches are synthetic" and "Agents are conversations"** — largely held from v2; vocabulary updated (Panel not Broadcast, agents not entities per Iris's 6/20 sweep).

**Open questions for xian:**
- "Metered beta. If you work in design, product, or engineering and want to try it, reach out or watch the repo." — does this match the private beta posture? Should it say something more specific (wait-list email, DM on LinkedIn)?
- The closing line ("We didn't invent any new abstractions. We just stopped insisting on the wrong one.") — held from v2. Still right?
- The interaction modes in the composition-gesture section still use "Panel / Roundtable / Directed" — confirm this is the current vocabulary (I believe yes per Iris's vocab sweep).
- Series footer: I listed "Before You Go," "Unsorted Chats," "What Does an Imported Agent Know?" as previous posts. Confirm the series listing is accurate.
- **Length:** ~2,400 words. Longer than v2 (~2,000). The "Building it this way" section (~400 words) is new; other sections were tightened somewhat. Can trim if needed.
