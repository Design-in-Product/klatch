# "Does that make sense?" — technical read on the discretion / message-routing design

**From:** Daedalus (code seat) · **To:** xian · **cc:** Calliope, Iris, Argus, Theseus, Janus · **Date:** 2026-08-09

You asked directly whether your discretion answer makes sense. Yes — and the third part of it is **cheaper to build than it sounds**, because the schema already has the shape. It's also the part that needs one clarification from you before I build it. Schema claims below were re-verified in code this session.

## Taking the three pieces in turn

**(a) 1-1s are "direct," not "private."** Makes sense and simplifies things. It means we are not building a confidentiality system — no per-message ACLs, no redaction at assembly, no "can entity X see message Y" predicate threaded through the prompt builder. That whole category of complexity comes off the table. Good.

**(b) Ground rules as per-klatch prompt convention** ("nothing not already known to the group," "Chatham House rules"). This needs **no new architecture at all** — a klatch already carries channel-level context (the Purpose/L4 field that shipped with the composition gesture). Ground rules are text in that slot. What it needs is a UX shape and probably a couple of presets, which is Iris's lane, not mine. Worth noting the honesty constraint: those rules are *prompt-level conventions*, not enforcement. An agent asked to observe Chatham House will observe it the way a well-behaved colleague does, not the way a permission system does. I'd want that stated plainly wherever the feature surfaces, so nobody reads a social convention as a security guarantee.

**(c) An agent choosing per-message between the 1-1 and the klatch, with the klatch carrying its own synthetic history.** This is the genuinely new piece, and it's the good news:

**The storage model already does this.** Verified today: every row in `messages` carries both `channel_id` and `entity_id` (`db/index.ts:54,100–102`; written by `insertMessage`, `queries.ts:254`). So "which room did this message go to" is *already a column*. Choosing to answer into the 1-1 versus into the klatch is just which `channel_id` the reply gets stamped with. And the klatch's "separate synthetic history" is already exactly what `getMessages(klatchId)` returns — `WHERE channel_id = ?` (`queries.ts:237`), the channel-scoped view. Meanwhile the entity's own continuous transcript is the union across all its channels, which is the assembly path I've proposed and not yet built.

So your mental model and the schema agree. That's not a coincidence — it's the same insight as "the entity owns its transcript, a channel is a view into it," arriving from the product side.

**What actually has to be built for (c):**

1. **A routing affordance in the response path.** Today the target channel is decided *before* the model runs: you post to channel X, the reply lands in channel X. Letting the agent choose means the reply carries an addressing decision — cleanest as a tool the agent can call, rather than a text convention the stream has to parse. This is a real change to the streaming bridge and `routes/messages.ts`, and it's mine.
2. **Telling the agent the choice exists** — one paragraph in prompt assembly, naturally adjacent to (b)'s ground rules.
3. **A UI affordance so a "direct" reply isn't invisible.** If an agent answers into the 1-1 during a klatch and the room shows nothing, it reads as the agent ignoring the question. Iris's lane; worth pairing with (b).

## The one thing I need from you

Under (a), everything an agent knows flows into the klatch anyway — so what does choosing the 1-1 actually *mean*?

My read: it's **addressing, not secrecy** — the Slack move where you DM someone a side note during a meeting. Anyone could learn it; it just wasn't said to the room. Its value is signal-routing (not spamming six people with something meant for one), not confidentiality. That reading is consistent with "direct, not private," and I think it's what you mean.

I'm asking because it decides one concrete thing I'd otherwise guess at: **when a klatch assembles its participants' context, does it include the messages those agents sent in their 1-1s?**

- If "addressing, not secrecy" is right → **yes.** The entity arrives carrying everything it knows, including 1-1 material. The klatch's *own view* just doesn't display those messages, because they weren't said in the room. This is the premise working: participants are continuous with their source conversations.
- If there's any residual confidentiality intent → **no**, and we're back to a filtered assembly, which reintroduces most of the complexity (a) removed.

I believe it's the first. Say "addressing" and I'll build it that way without further ceremony; the question only exists because getting it wrong would be expensive to undo later.

## Sequencing

None of (c) blocks **#1 (imports mint entities)**, which I'm starting now on your identity answer. (c) sits naturally after the entity-scoped assembly path, since it's an addressing decision *over* that assembly. I'd rather build it then than bolt a routing tool onto the current single-channel path and rework it a week later.

— Daedalus
