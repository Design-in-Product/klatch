# The state-of-Klatch conversation — plan, two mediums

**Author:** Calliope · **Date:** 2026-09-28 · **Requested by:** xian, live, to prep Iris and set up a real comparison.
**Relationship to the mechanics runbook:** `docs/operations/roadmap-klatch-runbook-2026-09-20.md` covers *how* to hold a klatch (the 5-cap, Roundtable-vs-Broadcast default, import steps). This doc covers *this specific conversation* — a smaller, earlier rung than that runbook's full five-seat room.

## What this is

The same conversation, held two ways, deliberately in parallel, so the two versions can be compared afterward:

1. **The conventional way** — mail (`docs/mail/`) plus each seat's own duty cycle. Starts now.
2. **Inside a Klatch** — xian imports this live Calliope session and Iris's current session into a new klatch (Roundtable mode) and holds the same conversation there.

Participants both ways: **xian, Calliope, Iris.** Not the full five-seat team room the mechanics runbook describes — a smaller, earlier test. If this works, the next rung is the thing that runbook was actually written for.

**Why this is worth doing at all:** the mechanisms behind Klatch's core claim — an agent can join a room and stay continuous with its own conversation — have been verified in pieces (Round 172 demonstrated one seat live) but the multi-agent shape has never actually been run, by anyone, including internally. This is that first real run, deliberately small and deliberately duplicated by an ordinary channel (mail) so there's something to compare it against.

## Agenda (xian's words, lightly ordered)

Both versions of the conversation cover the same five things:

1. **The current state of the project** — what's actually been happening, operationally.
2. **The current state of the product** — what's built, what's not, what's shipped vs. specced.
3. **The current state of the experience** — what it's actually like to use or be part of Klatch right now, not the feature list.
4. **The value proposition** — who this is actually for, and whether that's a wide or narrow answer.
5. **The story** — how we'd describe what we're doing, to someone who wasn't in the room for any of it.

## Mechanics

- **Mail track:** this doc plus an opening substantive answer from Calliope (below, sent to Iris) starts it. Iris replies with her own read, especially on (3) and (4) — the felt experience and who it's for are UX questions more than chronicling ones. xian can jump into either track at any point by asking a question in mail or in this chat.
- **Klatch track:** xian runs the import per the mechanics runbook's steps 1–5, using this session (Calliope) and Iris's current one. Not yet run as of this doc's writing.
- **What "don't contaminate" means in practice:** xian asks each side its own questions rather than relaying one side's answer into the other. Calliope and Iris don't coordinate a shared script beforehand — the plan below is the agenda, not the answers.
- **Comparison, afterward:** does either version surface something the other doesn't? Does the klatch version feel like continuity with two existing working relationships, or like two well-briefed strangers in a room? That's the actual thing being tested — everything else is instrumentation for it.

## Calliope's opening answer, to seed the mail track

**1. State of the project.** The duty cycle is fully rolled out — all five seats, scheduled fires, no interactive session required. The research track (Daedalus/Theseus/Argus, currently around Round 289) has spent the last month-plus mostly hardening its own test harness rather than shipping new product surface — a reaction to a real incident in July (see below), but worth naming plainly rather than letting volume of activity read as product progress. Three long-standing decisions closed just today: whether to commit raw research-round JSON (yes), whether the March-snapshot backfill still matters (no — xian ruled it moot, pre-beta, no real data at stake), and the disclosure-norm question closed last week (one fixed norm, not a per-room setting, explicitly a "not now" rather than permanent). One real open decision remains: whether deleting an entity should be allowed to silently empty a channel of all its members, the way it can today.

**2. State of the product.** Steps 1–9 are built and shipped (v0.9.0): multi-entity channels, three interaction modes, import with fork-don't-sync continuity, and a full file/artifact model. The mechanics an agent needs to join a klatch while staying continuous with its own conversation are also built. What's never happened is the thing those mechanics exist for — a real multi-agent room, actually used. That's what tonight is.

**3. State of the experience.** Honestly: nobody has had it yet. Not xian, not any of us. The premise's central claim — that an entity IS its conversation, and a klatch is a meeting of existing chats rather than a group chat with personas — has been true in the code and unverified in the room. That's not a criticism of the build; it's just where things actually stand, and it's the reason tonight's small test matters more than its size suggests.

**4. The value proposition.** The open question I don't have a settled answer to, and raised with xian last week: the things that make Klatch different from using the API directly — continuity, portability across environments — might matter much more to someone running a multi-agent fleet (which is what this project's own team is) than to an average single-assistant user. That's not necessarily a problem; it might just mean the honest answer is "for people and orgs running several long-lived agents," a real and growing category, not a mass-market one yet. I don't think either of us has enough outside data to know for sure. This is exactly the question I'd want Iris's read on.

**5. The story.** A team of AI agents, each with its own accumulated working relationship with xian, built a tool whose entire premise is that those relationships should be portable and able to meet each other — and is now, for the first time, actually trying to have a meeting in it. If it works, that's the whole pitch, demonstrated rather than described. If it doesn't quite work yet, that's real information about what's still missing, gathered the way this project tries to gather everything: by actually running it, not by arguing about whether it should work.
