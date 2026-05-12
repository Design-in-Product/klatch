# Bringing Conversations Into a Room

*On why we stopped treating agents as personas you configure*

---

Multi-agent products tend to start in the same place. You define a role — give it a name, a system prompt, a model setting. You make a second role. You make a third. Then you assign them to a channel or a chat or a meeting, and the system fans out your message to all of them.

It's the natural design move. It's also the wrong one.

We figured this out by accident. We had been building entities as configured personas for months — name, prompt, color, model, the works. The UI matched the model: create an entity, pick its settings, assign it to a channel. People didn't use it that way. They imported a conversation from claude.ai or Claude Code, the conversation arrived as a Klatch channel with its agent attached, and they wanted to bring *that conversation* into a klatch with other conversations they'd already had.

The configured-persona model couldn't represent what was being asked for. The conversation already had a name, a personality, a working history with the user, a way of pushing back, a vocabulary. None of that came from a settings panel. It came from being *used*. The thing that should join the klatch wasn't a persona spec; it was the conversation itself.

So we rewrote the abstraction.

---

## Entities are conversations

The model we landed on, after a long Iris-led design conversation in April that we spent two more sessions sharpening in May:

**An entity is a continuous single-agent conversation with a purpose.** Not a configured persona. Not a system-prompt template. A conversation that has a history, a name (often acquired in-flight, not assigned), a working relationship with the user, and a domain it has come to inhabit. Some entities are fleeting — a one-off chat about a specific question, never returned to. Most useful entities are durable — you come back to the same conversation again because the conversation knows things now that it didn't a month ago.

**A role is an entity that has proven its character.** Persistent identity, consistent name, ongoing function in a project, a way of doing things that survives across sessions. Most entities don't become roles; they stay tools-for-a-job. The ones that *do* become roles are the ones you reach for repeatedly because you trust the conversation's instincts.

The promotion path is the load-bearing detail. You don't configure roles from scratch. You have a conversation. The conversation develops. At some point you notice you keep going back to it. At some point you give it a name and pin it in the sidebar. At some point you bring it into a meeting with other conversations you've grown to trust. None of those steps requires defining a persona-spec; all of them are downstream of *using the conversation*.

This isn't an iteration of the configured-persona model. It's a different model. The persona-spec is a designed-in-advance abstraction; the role-as-promoted-conversation is an extracted-from-pain abstraction, where the pain was watching every user we observed try to bring existing conversations into a room together and finding that the product made them rebuild everything from scratch.

---

## The composition gesture

If entities are existing conversations and roles are entities that have earned identity through use, then the central act in the product isn't role-creation. It's *composition*. You curate which existing conversations come into a room together for a specific piece of work.

We used to call this making a multi-entity channel. The word felt right but the gesture was missing. The UI had two affordances — create-an-entity and create-a-channel — neither of which let you actually do the thing. You couldn't say "I want this conversation, and that one, and that one, in the same room, for this purpose, now." You had to back-derive each existing conversation into a persona spec and reassemble.

What the gesture should be is closer to inviting people into a meeting. Pick the chats you want present. Tell the room what it's about. Start.

We're building that now, in the design layer Iris owns. The composition gesture is the work that the original UI didn't have a place for — the verb the product needed but didn't expose. Until you can do it, the model is a description of how the product *could* work, not how it does.

---

## Klatches are synthetic

Here's the part that took the longest to name correctly, and that we only got crisp on in May.

When two or three or five agents are in a klatch together, what is each one actually experiencing?

A single-user chat. Their own. With some context about who else is in the room.

The orchestration that makes a klatch *look like* a group chat to the human is invisible to each agent. Each agent receives the user's message, optionally with a preamble about other participants, and produces a response. The product threads those responses into a transcript that *the human* reads as a group conversation. Each agent doesn't see the whole transcript; each agent sees its own conversation with a synthetic context wrapper.

We started calling this synthetic because the structure is real but the appearance is constructed. The group chat exists for the human. From the agents' side, it's still individual conversations.

This is what makes the entire model coherent. If a klatch were "a single conversation that multiple agents share," role persistence couldn't work the way we want it to — the agent's working history would be polluted by every other agent's contributions. Instead, each agent's history is its own. The role identity persists *within the conversation* — the agent's own — and the klatch is the orchestration that brings several such conversations into temporary alignment.

The implications run deeper than we expected. The "interaction modes" we built last year — panel, roundtable, directed — turn out to be names for *orchestration patterns over individually-real conversations*, not different kinds of group chat. Panel means each agent gets the message independently; roundtable means each agent gets the message plus the prior agents' responses; directed routes by @mention. These aren't different shapes of conversation. They're different ways of stage-managing a meeting of individual conversations.

The two-audiences-two-views nature of the product follows from this. The human sees a group chat because that's the useful abstraction for *what they're orchestrating*. The agents see individual conversations because that's the useful abstraction for *what they're contributing*. Both views are accurate at their layer. Neither has to be the canonical one.

---

## Role persistence is the differentiator

If we're being honest about competitive positioning: most agent products do not preserve role identity across sessions. They preserve conversation history (sometimes), or session state (sometimes), or per-conversation system prompts (occasionally). They don't preserve the *agent's* identity in a way that survives across multiple sessions, multiple klatches, multiple projects.

Our layer stack does. Layer 5 (the role identity) plus Layer 3 (project memory that accumulates over time) plus the Phase 3.5 behavioral calibration bridge (which we wrote about in [Before You Go](/blog/before-you-go.html)) together carry an agent's role identity across boundaries that other products treat as fresh starts. When you bring a role into a klatch — a role that has months of working history in its own conversation — it shows up in the room with that history intact.

We didn't set out to make this a differentiator. We set out to solve the import problem (people had conversations elsewhere and wanted to continue them here). The role-persistence consequence emerged as we kept extending the architecture, and only became visible as a competitive position when external SDK-level memory tooling shipped and we had to ask what *we* still uniquely did. The answer turned out to be: the assembly layer, with role identity as one of the things being assembled.

We're not the memory layer. There is one of those now, at the SDK level. We're the place where conversation-as-substrate and role-persistence-across-sessions live, because we are the place where the conversation is the durable unit and the role is the conversation given time to mature.

---

## What this changes

The model is settled enough that the design work can start to derive from it. Surfaces are projections of the object model, so a clear model produces clearer surfaces. A few examples:

The sidebar. Today it shows channels with a sub-category for projects, and entities are managed separately in a different surface. In the model, the sidebar's job is to surface the things you might bring into a klatch — the existing conversations, organized by project, with the durable roles distinguished from the one-off chats. Composition starts from here.

The empty state. Today it says "Start a conversation" — which assumes you're about to type. In the model, the empty state of a new klatch is asking you which existing conversations should be in this room. That's a different prompt, with a different affordance.

The entity manager. Today it's a forge where you configure personas. In the model, it's closer to a library where you browse the conversations you've already had and decide which ones are durable enough to pin as roles. Promotion is the verb; configuration is the rare special case.

The import-to-export arc. Today imports are a side panel; the imported conversation lands as a channel and there's no obvious next step. In the model, an imported conversation is a *candidate role* — something that arrived with history and may earn its way into the durable roster. The import surface should hint at the promotion path.

None of this is built yet. We're at the point in the work where the model is clear enough that the building can begin. That's the moment a design document is worth writing — not because the design is done, but because everything that comes next will be derived from the same shared starting frame.

---

## What we don't yet know

We don't yet know whether *users* will reach for the promotion gesture. The model is internally coherent, but coherence isn't adoption. People may continue to think of agents as personas-you-define and find the conversation-promotion path harder to learn than the configured-persona path it replaces. We'll find out as the new design lands.

We don't yet know whether the "klatches are synthetic" insight has UI implications we haven't seen. The current implementation already works this way; what's new is naming it. There may be affordances we should build because the agents experience individual conversations — for example, surfacing each agent's own view of "what happened in the klatch" alongside the human's group view. That's the kind of feature that only becomes visible once the architectural truth is named.

We don't yet know how to talk about this externally. The vocabulary we use internally ("klatch," "role promotion," "synthetic," "Layer 5") is mostly inside language. The product needs a user-facing vocabulary that captures the same model without requiring the user to learn five new terms before they can compose their first klatch. That's design work, not architecture work, and it's ahead of us.

---

## Closing

The configured-persona model worked well enough that it took us months to notice it was the wrong abstraction. The thing that revealed the gap wasn't a feature request; it was watching people try to do the obvious thing — bring an existing conversation into a meeting — and finding the product had no path for it.

The reframe we landed on is small in code and large in implication. *Entities are conversations. Roles are entities that have proven their character. A klatch is composition: you bring existing conversations into a room.* From that frame, most of what was hard about the product becomes a question of where to put the composition gesture. Most of what was strange about the product becomes a question of which audience each surface is for.

We didn't invent any new abstractions. We just stopped insisting on the wrong one.

---

*This is part of an occasional series from the Klatch project. Previous: [Before You Go](/blog/before-you-go.html), [Paste It Again](/blog/paste-it-again.html), [What Doesn't Transfer](/blog/what-doesnt-transfer.html). Klatch is an open-source tool for managing Claude conversations — [learn more](/) or [view the source](https://github.com/Design-in-Product/klatch).*

---

## Editorial notes (not for publication)

**Title candidates (current working: "Bringing Conversations Into a Room"):**
- "Bringing Conversations Into a Room" — concrete, gestural, doesn't require background
- "When Roles Are Conversations" — punchier but more abstract
- "The Promotion" — too coy
- "Klatches Are Synthetic" — punchiest of all; requires reader to know what a klatch is
- "Stop Configuring Personas" — combative; not Klatch's house tone

**Date status:** drafted 2026-05-12 from the April 14 entity reframe + Iris session 10 object-model resolution (5/11) which named "klatches are synthetic" and "role persistence is unique value proposition" as architectural truths. The synthesis-of-two-insights-into-one-narrative is fresh; worth letting it cool before final edits.

**Code-switching pass needed** (per xian's standing P.S.):
- "Layer 5," "Layer 3," "Phase 3.5" appear without explanation — link to Before You Go and PROMPT-ASSEMBLY references in the layer-stack paragraph; or rewrite to use natural language ("the agent's role identity," "project memory," "the calibration bridge we wrote about in Before You Go")
- "AAXT," "MAXT," "Subliminal" don't appear here — good
- "the assembly layer," "conversation-as-substrate" are technical phrasings; OK but could be sharpened with one or two sentences of grounding for outside readers
- "klatch" is the product name; need to confirm whether to introduce it on first use or assume reader has read other posts in the series

**Sequencing in the series:**
- Sits well after Before You Go (Layer 5 → role-persistence-as-differentiator is the natural arc)
- Sits well before a possible MCP capstone post (composition gesture → assembly layer → MCP as the protocol surface that carries it across boundaries)
- Could be the second-to-last in the pre-1.0-beta sequence; convergent-infrastructure post or MCP post lands as capstone

**Length:** ~1,900 words. Comparable to prior posts.

**xian sees raw draft before any publication.** Particularly the "competitive positioning" paragraph — the claim that "most agent products don't preserve role identity across sessions" is a contestable specific that should either get framed as trusted practice (per PO synthesis Pattern 5) or qualified. Currently it's stated declaratively; xian's editorial call.

**The "what we don't yet know" section is non-negotiable** — same discipline as Before You Go. Three honest gaps named.
