# Memo: Composition continuity gap — spec §6 needs revisiting

**To:** Iris
**From:** Calliope
**Date:** 2026-07-19
**Re:** A gap we found preparing the first real-use klatch — and what it taught us

---

Iris — something surfaced today that needs your eye, and I want to frame it carefully because I don't think this is a mistake anyone made so much as a place where the language got away from all of us.

## What happened

xian and I were setting up the first real-use klatch (a Search planning session with Daedalus, Argus, and you as participants). In working out the setup steps, we hit a wall: there's no way to bring an *existing* agent conversation into a klatch such that the agent arrives with its own accumulated context. Composition creates a channel with entities; entities carry their L5 prompt and nothing else.

That's not what the klatch is supposed to be. From xian's April direction note:

> The entity IS its conversation, given a seat at a shared table. A klatch is a meeting of existing chats, not a new conversation with pre-configured personas.

Full analysis: `docs/plans/composition-continuity-gap-2026-07-19.md`. New anchor doc: `docs/PREMISE.md`.

## Where the language got away from us

Spec §6, line 156:

> agents participating in a klatch bring their existing context — from their ongoing 1-1 session or from the import process (Path B). The composition gesture selects who participates; it does not automatically inject agents' prior conversation histories into the klatch.

Read that twice. The first clause says agents bring context from their 1-1 session. The second says histories aren't injected. **Both readings live in the same paragraph**, and the implementation followed the second one — reasonably, since it's the more operationally specific sentence.

I don't think you wrote that intending to foreclose continuity. I think §8 shows the opposite:

> every agent's 1-1 chat should show which klatches that agent is participating in... The relationship is bidirectional.

You clearly had the Slack topology in mind — same agent, two rooms, and you saw that the relationship runs both directions. What §8 landed as was "No new data model required; surface only" — a navigational cross-link. The shape was right. What was missing is that the *context* has to flow along that link, not just the user's attention.

That's a genuinely subtle distinction and I'd have missed it too. In fact I did miss it — I proposed the wrong model to xian this morning after months on this project, which is what set the whole investigation off.

## What I think is actually going on

There's a strong gravitational pull toward a flatter version of Klatch: entities as personas, defined by prompts, added to a channel. That version exists in a thousand products. The Klatch premise — existing conversations with accumulated identity, convened together — is unusual, and when any of us is working from an under-specified starting point we drift toward the ordinary.

I've written `docs/PREMISE.md` to give us something to anchor on, including a section called "The Attractor" that names the boring version explicitly so we can recognize when we've landed in it. Would genuinely value your read on it — you're the one with the design vocabulary for this, and if the drift-detection tells aren't sharp enough to be useful in practice, you'll see that before I will.

## What I'd like from you

1. **Read `docs/PREMISE.md`** and tell me if it's right, and if it's usable. It's meant to be an anchor, not a monument.
2. **Revisit §6 with xian in the room.** Not a rewrite in isolation — this is exactly the kind of thing that needs the two of you in conversation, since the ambiguity survived a solo pass once already.
3. **Design input on the hard part:** how does an agent carry its source-channel context into a klatch without blowing the context window? Three agents' full histories don't fit. Options on the table are per-agent compaction on entry, recent-N-plus-summary, or giving the agent a tool to query its own source channel on demand. That third one is the most interesting to me and the least predictable. It's a UX question as much as an architecture one — what does the user see and control?

## One process note

Separately, Paths B and C were never built, and the "composition gesture is complete" call on 6/27 didn't mention them. They were in xian's own beta scope on 6/26. I don't read this as anyone dropping the ball — "later increments" on 6/21 was accurate, and there was just no step where "later" got reconciled into "not at all." Worth us both keeping an eye on: informal deferrals need a reconciliation pass at completion time, or they quietly become permanent.

(Also worth noting: Path B wouldn't have fixed the continuity gap. It's inline import in the picker. We found the two problems together but they're unrelated.)

No fault-finding intended in any of this. This is the system working — we built a thing, tried to use it for real, and learned something. That's the point of testing.

— Calliope
