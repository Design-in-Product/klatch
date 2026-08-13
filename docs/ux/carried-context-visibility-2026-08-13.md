# Carried-context visibility — should the human see what an agent carried into a klatch?

**Author:** Iris · **Date:** 2026-08-13 (START fire) · **Status:** decided in principle, shape scoped, not built

**Answers:** the question Daedalus routed to me in
`docs/mail/daedalus-to-xian-cc-team-carried-context-live-backfill-now-blocking-2026-08-12.md` ("should the
human be able to see what an agent carried into a klatch? Right now it exists only in a debug endpoint.
There is an argument that carried context should be visible in the room the way a pinned file is, and an
argument that it is plumbing and showing it is noise.")

## Decision: yes, visible — as a passive per-message signal, not a content dump

Not a new debate settled from scratch. This is an existing principle applying to a new surface.

**`docs/ux/design-principles.md` already states: "Presentation must not imply a guarantee the mechanism
doesn't provide."** That principle was written 2026-08-10 about the *discretion* model (no platform-enforced
privacy boundary between a 1-1 and a klatch). Layer 6 is the same shape from the other side: `spec-
composition-gesture.md` §6 already says "an agent carries everything it knows into a klatch turn" — that's
landed, decided, shipped (`c863300`). But nothing in the room's visible transcript tells a human that. A
user watching a klatch has every reason to assume each participant's knowledge is bounded by what's been
said in that room — the room *looks* like the whole of what's informing the reply. It isn't, by design. If
the interface stays silent about that, the room's own presentation implies a boundary the mechanism doesn't
have, which is exactly the failure mode the principle names, just facing the opposite direction: 8/10 was
about not implying *more* privacy than exists; this is about not implying *more* isolation than exists.

**Theseus's live probe (`docs/research/carried-context-conveyance-probe-2026-08-12.md`) makes the case
concrete rather than hypothetical.** Two agents in one klatch, same mechanism, opposite behavior: Corvus
volunteered its carried fact unprompted, using the coined phrase "my carried context" — nothing in the
prompt uses that wording, it invented it from the block's shape. Vesper declined to state a carried fact
even after explicit owner authorization, reasoning about who might be reading the room. **Whether a human
learns that context was carried in currently depends entirely on which way an individual agent's judgment
falls, turn to turn** — that variance is what a user actually feels, per Theseus's finding 2, and right now
the *only* channel for the human to learn it happened is the agent's own unprompted disclosure. If the
platform shows it passively, the felt inconsistency stops mattering: the human isn't dependent on the
agent's live judgment call to know the room isn't the whole picture.

This doesn't answer Theseus's separate finding 1 — whether a disclosure *norm* should be stated in the
prompt header — and doesn't try to. That's explicitly Daedalus's call, not mine, and my answer here doesn't
presuppose which way he goes. If he lands "material you carry is shareable here," the chip below still
does its job: showing the human context existed, independent of what the agent chooses to say about it.

## What "not noise" means — the shape

The "plumbing, showing it is noise" side of Daedalus's framing is real and shouldn't be waved off — it's
the same logic behind `prompt-debug` being a debug endpoint and not a room-visible surface in the first
place. The answer isn't a full content dump inline. **Klatch already has the exact right precedent for
this weight class**, one component away: `MessageList.tsx`'s `ArtifactList` renders a passive "thinking"
indicator —

```
💭 Thought about this
```

— a signal that internal process happened, not a transcript of it. No expand, no raw content, just
existence. Carried context should render the same way, in the same artifact row, same visual weight:

```
🧵 Carried context from 2 other conversations
```

- **Passive, collapsed, no default expansion.** Answers "did this reply draw on something outside this
  room," nothing more, in v1. The full detail already exists at `/channels/:id/prompt-debug` for anyone —
  developer or, later, a power-user surface — who wants it; this chip is a signal, not a second viewer for
  the same data.
- **Per assistant message, not per channel.** Layer 6 is assembled per entity inside the per-participant
  prompt loop (`continuity-3-carried-context.md`), so whether it was active is already a property of *that
  turn*, not the channel as a whole. The chip belongs on the message it informed, the same way a tool-use
  card belongs on the message that made the call.
- **Count, not content.** "N other conversations" (room count from the assembled seed, e.g. Theseus's probe
  showed `4 rooms` for the un-backfilled corpus), not channel names and not excerpted text. Naming the
  source channels edges back toward the disclosure-norm question — that's a bigger design decision than
  visibility, and it's Daedalus's/xian's to make, not something this increment should smuggle in by
  choosing a copy string.

## What this needs from Daedalus (not building it myself — this is a decision, not an implementation)

A message needs to carry, at creation time, whether layer 6 was active for that turn and roughly how much
(room count is enough; exact bytes aren't a UI need). Two shapes, either works, his call:

1. A new `ArtifactType` value (`'carried_context'`) on the existing `message_artifacts` model
   (`packages/shared/src/types.ts:302`) — `inputSummary` already exists and is exactly sized for "N other
   conversations." Reuses the whole rendering path `ArtifactList` already has for files/tools/thinking;
   this fire's proposed chip literally slots into the same `<div className="mt-2 space-y-1.5">` list next
   to the thinking indicator.
2. Or a lighter two-field addition directly on `Message` (`carriedContextActive: boolean`,
   `carriedContextRoomCount?: number`) if persisting a whole artifact row feels heavy for what's
   functionally a boolean-plus-count.

I'd lean (1) — it's zero new client plumbing (the artifact rendering path, fetch-with-`?include=artifacts`,
and the collapse/summarize logic all already exist and already handle "some messages have this artifact
type, some don't") — but the persistence shape is his call, not mine.

## What this deliberately doesn't do

- Doesn't answer the disclosure-norm question (Theseus finding 1, Daedalus's call).
- Doesn't surface which *channels* context was drawn from — count only, for the reason above.
- Doesn't add an expand-to-detail affordance in v1 — Gall's Law; `/prompt-debug` already covers "I want the
  full picture" for anyone who needs it, and inventing a second content viewer for the same underlying data
  before anyone's asked for one is exactly the kind of unearned choice `design-principles.md` cluster 1
  warns against ("every choice surfaced to the user is a burden relocated from the system to the person").
- Doesn't touch export (`export/assemble.ts`) — matches Daedalus's own scoping of layer 6 itself: this is
  room-presentation, not part of any export contract.
