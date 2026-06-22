# Bringing Conversations Into a Room

*On why we stopped treating agents as personas you configure*

---

Multi-agent products tend to start in the same place. You define a role — give it a name, a system prompt, a model setting. You make a second role. You make a third. Then you assign them to a channel or a chat or a meeting, and the system fans out your message to all of them.

It's the natural design move. It's also the wrong one.

We figured this out by accident. We had been building agents as configured personas for months — name, prompt, color, model, the works. The UI matched the model: create an agent, pick its settings, assign it to a channel. People didn't use it that way. They imported a conversation from claude.ai or Claude Code, the conversation arrived as a Klatch channel with its agent attached, and they wanted to bring *that conversation* into a klatch with other conversations they'd already had.

The configured-persona model couldn't represent what was being asked for. The conversation already had a name, a personality, a working history with the user, a way of pushing back, a vocabulary. None of that came from a settings panel. It came from being *used*. The thing that should join the klatch wasn't a persona spec; it was the conversation itself.

So we rewrote the abstraction.

---

## Agents are conversations

The model we landed on, after a long Iris-led design conversation in April that we spent two more sessions sharpening in May:

**An agent is a continuous single-agent conversation with a purpose.** Not a configured persona. Not a system-prompt template. A conversation that has a history, a name (often acquired in-flight, not assigned), a working relationship with the user, and a domain it has come to inhabit. Some agents are fleeting — a one-off chat about a specific question, never returned to. Most useful agents are durable — you come back to the same conversation again because the conversation knows things now that it didn't a month ago.

**A role is an agent that has proven its character.** Persistent identity, consistent name, ongoing function in a project, a way of doing things that survives across sessions. Most agents don't become roles; they stay tools-for-a-job. The ones that *do* become roles are the ones you reach for repeatedly because you trust the conversation's instincts.

The promotion path is the load-bearing detail. You don't configure roles from scratch. You have a conversation. The conversation develops. At some point you notice you keep going back to it. At some point you give it a name and pin it in the sidebar. At some point you bring it into a meeting with other conversations you've grown to trust. None of those steps requires defining a persona-spec; all of them are downstream of *using the conversation*.

This isn't an iteration of the configured-persona model. It's a different model. The persona-spec is a designed-in-advance abstraction; the role-as-promoted-conversation is an extracted-from-pain abstraction, where the pain was watching every user we observed try to bring existing conversations into a room together and finding that the product made them rebuild everything from scratch.

---

## The composition gesture

If agents are existing conversations and roles are agents that have earned identity through use, then the central act in the product isn't role-creation. It's *composition*. You curate which existing conversations come into a room together for a specific piece of work.

We used to call this making a multi-entity channel. The word felt right but the gesture was missing. The UI had two affordances — create-an-agent and create-a-channel — neither of which let you actually do the thing. You couldn't say "I want this conversation, and that one, and that one, in the same room, for this purpose, now." You had to back-derive each existing conversation into a persona spec and reassemble.

What the gesture should be is closer to inviting people into a meeting. Pick the chats you want present. Tell the room what it's about. Start.

The spec for that gesture landed in mid-June, after a long design pass with Iris that resolved the last open questions about what "running a meeting" inside a klatch should look like. The surface is now under implementation in Klatch's 1.0-beta path. Until you can do it, the model is a description of how the product *could* work, not how it does; the implementation is what closes that gap.

---

## Klatches are synthetic

Here's the part that took the longest to name correctly, and that we only got crisp on in May.

When two or three or five agents are in a klatch together, what is each one actually experiencing?

A single-user chat. Their own. With some context about who else is in the room.

The orchestration that makes a klatch *look like* a group chat to the human is invisible to each agent. Each agent receives the user's message, optionally with a preamble about other participants, and produces a response. The product threads those responses into a transcript that *the human* reads as a group conversation. Each agent doesn't see the whole transcript; each agent sees its own conversation with a synthetic context wrapper.

We started calling this synthetic because the structure is real but the appearance is constructed. The group chat exists for the human. From the agents' side, it's still individual conversations.

This is what makes the entire model coherent. If a klatch were "a single conversation that multiple agents share," role persistence couldn't work the way we want it to — the agent's working history would be polluted by every other agent's contributions. Instead, each agent's history is its own. The role identity persists *within the conversation* — the agent's own — and the klatch is the orchestration that brings several such conversations into temporary alignment.

The implications run deeper than we expected. The "orchestration modes" we built last year — Broadcast, Roundtable, Directed — turn out to be names for *patterns over individually-real conversations*, not different kinds of group chat. Broadcast means each agent gets the message independently; Roundtable means each agent gets the message plus the prior agents' responses; Directed routes by @mention. These aren't different shapes of conversation. They're different ways of stage-managing a meeting of individual conversations.

The two-audiences-two-views nature of the product follows from this. The human sees a group chat because that's the useful abstraction for *what they're orchestrating*. The agents see individual conversations because that's the useful abstraction for *what they're contributing*. Both views are accurate at their layer. Neither has to be the canonical one.

---

## Role persistence is the differentiator

If we're being honest about competitive positioning: across the agent-product landscape, role identity rarely survives across sessions. Conversation history travels (sometimes). Session state travels (sometimes). Per-conversation system prompts travel (occasionally). What doesn't typically travel is the *agent's* identity in a way that survives across multiple sessions, multiple klatches, and multiple projects.

Klatch's architecture carries it. The agent's role identity, the project's accumulated memory, and the calibration bridge we wrote about in [Before You Go](/blog/before-you-go.html) together carry an agent's working character across boundaries that other products treat as fresh starts. When you bring a role into a klatch — a role that has months of working history in its own conversation — it shows up in the room with that history intact.

We didn't set out to make this a differentiator. We set out to solve the import problem (people had conversations elsewhere and wanted to continue them here). The role-persistence consequence emerged as we kept extending the architecture, and only became visible as a competitive position when external SDK-level memory tooling shipped and we had to ask what *we* still uniquely did. The answer turned out to be: the assembly layer, with role identity as one of the things being assembled.

We're not the memory layer. There is one of those now, at the SDK level. We're the place where conversation-as-substrate and role-persistence-across-sessions live, because we are the place where the conversation is the durable unit and the role is the conversation given time to mature.

---

## What this changes

The model is settled enough that the design work can start to derive from it. Surfaces are projections of the object model, so a clear model produces clearer surfaces. A few examples:

The sidebar. Today it shows channels with a sub-category for projects, and agents are managed separately in a different surface. In the model, the sidebar's job is to surface the things you might bring into a klatch — the existing conversations, organized by project, with the durable roles distinguished from the one-off chats. Composition starts from here.

The empty state. Today it says "Start a conversation" — which assumes you're about to type. In the model, the empty state of a new klatch is asking you which existing conversations should be in this room. That's a different prompt, with a different affordance.

The agent library. Today it's a forge where you configure personas. In the model, it's closer to a library where you browse the conversations you've already had and decide which ones are durable enough to pin as roles. Promotion is the verb; configuration is the rare special case.

The import-to-export arc. Today imports are a side panel; the imported conversation lands as a channel and there's no obvious next step. In the model, an imported conversation is a *candidate role* — something that arrived with history and may earn its way into the durable roster. The import surface should hint at the promotion path.

The spec is now in the repo; the implementation is in flight. The composition gesture is being built, not just argued for.

---

## What we don't yet know

We don't yet know whether *users* will reach for the promotion gesture. The model is internally coherent, but coherence isn't adoption. People may continue to think of agents as personas-you-define and find the conversation-promotion path harder to learn than the configured-persona path it replaces. We'll find out as the new design lands.

We don't yet know whether the "klatches are synthetic" insight has UI implications we haven't seen. The current implementation already works this way; what's new is naming it. There may be affordances we should build because the agents experience individual conversations — for example, surfacing each agent's own view of "what happened in the klatch" alongside the human's group view. That's the kind of feature that only becomes visible once the architectural truth is named.


---

## Closing

The configured-persona model worked well enough that it took us months to notice it was the wrong abstraction. The thing that revealed the gap wasn't a feature request; it was watching people try to do the obvious thing — bring an existing conversation into a meeting — and finding the product had no path for it.

The reframe we landed on is small in code and large in implication. *Agents are conversations. Roles are agents that have proven their character. A klatch is composition: you bring existing conversations into a room.* From that frame, most of what was hard about the product becomes a question of where to put the composition gesture. Most of what was strange about the product becomes a question of which audience each surface is for.

We didn't invent any new abstractions. We just stopped insisting on the wrong one.

---

*This is part of an occasional series from the Klatch project. Previous: [Before You Go](/blog/before-you-go.html), [Paste It Again](/blog/paste-it-again.html), [What Doesn't Transfer](/blog/what-doesnt-transfer.html). Klatch is an open-source tool for managing Claude conversations — [learn more](/) or [view the source](https://github.com/Design-in-Product/klatch).*

---

## Editorial notes (not for publication)

**Title:** "Bringing Conversations Into a Room" — kept from v1; remains the strongest of the candidates.

**Changes from v1 (drafted 2026-05-12; revised 2026-06-21; further revised 2026-06-22):**

1. **Composition gesture status updated** — v1 said "we're building that now, in the design layer Iris owns." v2 says the spec landed mid-June after a design pass with Iris, and the surface is under implementation in Klatch's 1.0-beta path. (Iris session 12, 6/20, cleared the design gate.)
2. *(Removed 2026-06-22.)* The 6/21 revision had added a paragraph in the role-persistence-is-the-differentiator section connecting role-persistence to "cross-tool BYOC / transporter-device value." That paragraph rested on a strategic frame xian retracted 6/22 (BYOC is PM's vocabulary, not Klatch's; Klatch's relationship to cross-tool context portability is exploratory and unsettled). Paragraph removed. The role-persistence section now reads cleanly without it; the assembly-layer framing in the closing paragraphs of the section still holds the argument together.
3. **Code-switching pass done.** "Layer 5," "Layer 3," "Phase 3.5" replaced with natural language ("the agent's role identity," "the project's accumulated memory," "the calibration bridge we wrote about in Before You Go"). Reader doesn't need prior posts to follow this one, but the link to Before You Go carries the depth for anyone who wants it.
4. **"Entities" → "agents"** throughout (Iris's vocab sweep shipped 6/20). One real consequence: the section formerly titled "Entities are conversations" is now "Agents are conversations." The change reads cleanly; the post never depended on "entity" specifically.
5. **"Panel" → "Broadcast"** in the orchestration-modes paragraph, matching Iris's 6/20 rename.
6. **"Entity manager" → "agent library"** in §"What this changes" — both more accurate per the vocab sweep and reframes the surface as a library (which is its model role) not a forge (which was the configured-persona model's role).
7. **Competitive-positioning paragraph softened** per v1's flagged concern. v1 said "*most* agent products do not preserve role identity." v2: "*across the agent-product landscape, role identity rarely survives across sessions.*" Same observation; framed as trusted-practice language per PO synthesis Pattern 5; less of a contestable specific claim.
8. **"What we don't yet know" section reshaped (2026-06-22).** Now carries two gaps (promotion adoption + synthetic-klatch UI implications), held from v1. The 6/21 revision had added a third gap about whether the cross-tool consequence becomes demonstrable; that gap was removed 6/22 alongside change #2 above, since it presumed the cross-tool consequence is a settled Klatch concept. The section reads fine with two gaps.

**Open editorial decisions for xian:**
- The "competitive positioning" softening — is "trusted-practice" framing the right shape, or should the paragraph qualify further (e.g., "in the agent products we've examined")?
- The closing line ("We didn't invent any new abstractions. We just stopped insisting on the wrong one.") — held from v1. Still the right note?

**6/22 revision context:** xian flagged that the BYOC framing I'd carried for Klatch since 6/19 evening was mis-labeled (BYOC is PM's vocabulary; Klatch's cross-tool concept is exploratory and unsettled per xian's 6/22 clarification). The 6/21 v2 draft had baked that framing into one new paragraph + one new "don't yet know" gap; both removed in this revision. The post's structural argument (entities-are-conversations; role-as-promoted-conversation; klatches-are-synthetic; composition-is-the-central-gesture) is unaffected by the correction — that argument never depended on the cross-tool/BYOC framing.

**Illustration ships as drawn** (`docs/drafts/bringing-conversations-illustration.html`). One pre-publish cleanup: strip the "Tweakable" note at the bottom of the illustration HTML before the OG-image render.

**Length:** ~2,000 words (was ~1,900). One added paragraph, several sharpenings.

**Sequencing in the series:** unchanged from v1 — sits after Before You Go (Layer 5 / Phase 3.5 → role-persistence-as-differentiator), and before a possible MCP capstone post (composition gesture → assembly layer → MCP as the protocol surface that carries it across boundaries).
