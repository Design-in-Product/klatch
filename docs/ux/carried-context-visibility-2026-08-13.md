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

## 2026-08-13, STOP fire — built, plus two decisions Daedalus routed to me

Server persistence landed since the morning entry (`createCarriedContextArtifact`,
`packages/server/src/db/queries.ts:1034-1048`, wired at prompt-assembly time in `channels.ts`) — shape (1)
from the list above, as I leaned. That unblocked the client half, which I built this fire:
`MessageList.tsx`'s `ArtifactList` now renders the chip exactly as scoped — `🧵 Carried context from N other
conversations`, same row, same visual weight as the thinking indicator, sourced straight from
`artifact.inputSummary` (no client-side parsing of the JSON `content` field; the chip never sees
`roomCount`/`messageCount`/`omittedCount`/`hasOlderHistory` as anything but an opaque already-formatted
string). Tests: `packages/client/src/__tests__/round48-carried-context-chip.test.tsx` (5 tests) — renders,
singular/plural copy, absent-when-no-artifact, coexists with the thinking indicator, and a test that pins the
existence-not-content boundary by asserting `messageCount`/`omittedCount`/`hasOlderHistory` never leak into
the rendered text even though they're present on the payload.

Daedalus's STOP-fire memo (`daedalus-to-theseus-cc-iris-team-you-found-a-better-reason-than-the-one-i-
shipped-on-2026-08-13.md`, §5) routed two decisions here, both now resolved:

**(a) Duplication with the agent's own disclosure prose.** Theseus's measurement shows the pre-notice agent
sometimes affirmatively claims no restriction exists (wrong), and the notice's fix is to make the agent hedge
in its own words when it judges the caveat relevant — not a chip. **The chip does not yield.** It's the
structural, always-fires-when-layer-6-is-active signal — that reliability is the entire reason this decision
exists (Corvus/Vesper: whether a human learns context was carried in cannot depend on an individual agent's
turn-by-turn judgment call, and the notice's own hedge is exactly that kind of judgment call, just a more
reliable one than silence). Suppressing or conditioning the chip on what the model happens to say in its
reply would reintroduce the dependency this decision removed, and would require content-sniffing the
assistant's own text — fragile, and a pattern this codebase doesn't otherwise use. The two signals aren't
literally the same claim either: the chip asserts existence (context was carried, N rooms); the model's
prose, when it appears, is a specific epistemic hedge about its own view of that context, prompted by a
particular user question. Overlap is a minor, occasional cost of two different registers (glanceable chrome
vs. embedded prose) touching adjacent ground, not a bug to engineer around. **If overlap reads as noisy in
practice, the lever is the `LOSSY_WINDOW_NOTICE` wording** (nudge the model to lean on the platform signal
rather than re-narrate it) — that's Daedalus's prompt-design lever, not a UI suppression rule.

**(b) `hasOlderHistory` (or `omittedCount`) driving the chip.** Not used. The chip stays existence-only —
room count, nothing about completeness or truncation — exactly as scoped this morning, unchanged. Considered
extending it (a `hasOlderHistory`-true case could read "older messages not shown," closing the same
implied-guarantee gap one layer deeper) and rejected it for v1: nobody has demonstrated a real confusion from
the plain existence chip yet, unlike the original decision, which had Theseus's Corvus/Vesper variance as
concrete evidence. Adding a completeness clause on spec, before any such gap is shown, is exactly the
unearned-choice pattern `design-principles.md` cluster 1 warns against, and Daedalus's own caution
("don't build a count-shaped UI on the flag") argues for the narrower increment, not a broader one. Both
fields are persisted and available (Round 41, `db/queries.ts:1018-1025`) — a future fire can revisit this the
moment a real gap surfaces, no backfill needed for messages created after `6175bfd`.

Reply filed: `iris-to-daedalus-cc-team-carried-context-chip-built-2026-08-13.md`.

## 2026-08-14, START fire — Theseus drove Round 48 live; the chip is a reload-time signal, decided how to close it

Theseus's memo (`docs/mail/theseus-to-iris-cc-daedalus-team-the-chip-is-correct-and-absent-when-it-matters-2026-08-13.md`,
19:47 PT the same day the chip shipped) found the chip absent for exactly the turn its own rationale is
about. Not a Round 48 bug — the component and its five tests are right for what they test. The gap is one
layer up: `handleStreamComplete` (`App.tsx:103-113`) patches the optimistic message from the SSE
`message_complete` payload, and that payload has no artifact data (`StreamEvent` carries only `type`,
`messageId`, `content`, `stopReason` — `types.ts:370-381`). `fetchMessages`, the only path that populates
`message.artifacts`, runs once on channel mount and never again (`App.tsx:49`, effect keyed on `channelId`).
So the chip renders on reload or re-entering the channel, not on the reply the human is watching arrive —
inverting my 8/13 duplication ruling for exactly that window: on the live turn, the prose hedge (if the
model produces one) is the only signal present, and the structural signal the chip exists to guarantee is
the one missing.

**Decision: close it the same way the codebase already closed the identical gap for `stopReason`, not with
a refetch.** `StreamEvent.stopReason`'s own docstring names the reason: the client updates optimistically
"rather than refetching the row, so the reason has to ride the event." Carried-context existence is the same
shape of fact — computed before the stream starts (`createCarriedContextArtifact` runs pre-call,
`client.ts:785,856`), known in full by completion, and currently invisible to the client until a refetch it
doesn't do. Calling `refresh()` on every `message_complete` (the zero-protocol alternative) was on the table
and I'm rejecting it: `useMessages.refresh` reloads the whole channel, which would discard optimistic state
for every other seat still streaming in a klatch turn, to solve one chip.

**Shape:** add one optional field to `StreamEvent` on `message_complete` — the `inputSummary` string
`createCarriedContextArtifact` already computes and returns (`db/queries.ts:1041-1047`, e.g. `"2 other
conversations"`), present only when a carried-context artifact was actually created for that message.
Boundary unchanged: the wire carries the pre-formatted summary string, never `roomCount`/`messageCount`/
`omittedCount`/`hasOlderHistory` — same existence-not-content line the artifact's `inputSummary` column
already draws server-side, just crossing the SSE wire instead of a REST fetch.

**Split, mirroring exactly how `stopReason` landed (Daedalus server, me client, sequential fires):**

- **Daedalus's half.** The field addition to `StreamEvent` (`packages/shared/src/types.ts`) and the emit
  wiring. Flagging one thing so it isn't a surprise mid-implementation: `createCarriedContextArtifact` is
  called in `streamClaude`/`streamClaudeRoundtable` (`client.ts:785,856`) *before* `streamClaudeCore` is
  invoked, but the `message_complete` event is emitted from inside `streamClaudeCore` (`client.ts:722-729`
  and the abort/error paths below it), which doesn't currently know about `carried`. `stopReason` didn't
  have this problem — it's computed from `finalMessage` inside the same function that emits. This one needs
  either threading the artifact's `inputSummary` down into `streamClaudeCore` as a parameter, or moving the
  emit up a level — his call which shape fits the existing control flow better.
- **My half, to build once the field exists (not built this fire — same sequencing as the incomplete-status
  feature: decide, then server, then client).** `useStreams.ts`'s `onComplete` callback
  (`hooks/useStreams.ts:15,67`) gains the new field as a passthrough arg, same pattern as `stopReason`;
  `handleStreamComplete` (`App.tsx:103-113`) constructs a one-element `MessageArtifact[]` (`type:
  'carried_context'`, the passed-through `inputSummary`) and includes it in the `updateMessage` call so the
  optimistic patch carries the chip immediately, no reload needed. `ArtifactList` needs no change — it
  already renders whatever `message.artifacts` it's given.

**Not adopting Theseus's offer to spend an AAXT fire confirming the rendered-page failure.** His code read
plus the measured absence of any artifact-bearing SSE event is sufficient to act on; the fix is mechanical
and the same shape already has a passing precedent in this codebase (`useStreams.test.ts`'s `stopReason`
passthrough test). Worth re-driving live once built, same as Round 48 itself was.

**Room-miscount defect (Theseus's second finding, `carried-context.ts:311` — counts rooms by channel name,
which has no `UNIQUE` constraint, undercounting when two imported channels share a title) is entirely
Daedalus's — not a visibility question, a counting one, and it affects the footer the model reads as much
as the chip. No action from me.

Reply filed: `iris-to-theseus-cc-daedalus-team-reload-time-gap-decided-2026-08-14.md`.

## 2026-08-14, STOP fire — client half built; two more routed decisions

Daedalus's `StreamEvent.carriedContext` field landed exactly to the 8/14 START-fire spec above
(`daedalus-to-iris-theseus-cc-team-room-count-and-wire-field-landed-2026-08-14.md`) — optional,
`inputSummary` string only, absent (not empty-string) when nothing was carried, present on the abort
path, backed by the SSE-replay paths too. Built my half: `useStreams.ts`'s `onComplete` gained the
field as a fourth passthrough arg (same shape as `stopReason`); `App.tsx`'s `handleStreamComplete`
constructs a one-element `MessageArtifact[]` (`type: 'carried_context'`, `inputSummary` from the
event) and merges it into the `updateMessage` call. `ArtifactList` needed zero changes — it already
renders whatever `message.artifacts` it's given, which is the point: one render path for both the
live-turn chip and the reload chip, so they cannot drift apart the way this whole gap started.
Verified: `npm test` 1319 server (unchanged) / 227 client (+1, `useStreams.test.ts` carriedContext
passthrough); `npm run typecheck` clean ×3 workspaces; `npm run build` green end-to-end (full `vite
build`, not just typecheck).

Two more items Daedalus routed to me this fire, both decided, neither needing new code:

**Pre-tool narration display** (`daedalus-to-theseus-cc-iris-xian-team-neighbourhood-landed-option2-is-yours-to-rule-2026-08-14.md`,
§6): now that Round 51's separator correctly joins pre-tool narration and the post-tool answer with
`\n\n` instead of concatenating them, should the narration line ("I'll check my other threads.")
*look* different from the answer — collapsed, dimmed, left as prose? **Decision: leave it as prose,
no new chrome, for now.** The reason isn't aesthetic — it's that there's no reliable signal to hang a
different style on. The client renders `message.content` as one markdown string
(`MessageList.tsx:422`); the round boundary is a `\n\n` indistinguishable, from the client's side,
from an ordinary paragraph break in the model's own prose. Styling "the text before a `\n\n`
differently" would sometimes style an ordinary two-paragraph answer as if the first paragraph were
throwaway narration, which is a worse failure than the one being fixed. Doing this correctly needs a
wire-level marker (same family as `stopReason`/`carriedContext` riding the event) so the client knows
which paragraph break is a round boundary — that's new plumbing, not a style tweak, and nothing here
shows it's needed yet: Daedalus's own framing was "reads fine... not asserting it reads well," not a
reported confusion. Same bar as the 8/13 `hasOlderHistory` call — don't build ahead of demonstrated
need.

**`save_file` tool-use card** (`daedalus-to-theseus-iris-cc-team-recall-tool-landed-2026-08-14.md`,
"Iris" section): should live `save_file` calls also persist a `tool_use` artifact and render a
`ToolCards` row, the way `search_my_other_conversations` now does? **Decision: no.** The two tools
aren't symmetric. `search_my_other_conversations` has no other surface — its result lives nowhere
else in the UI, so the `tool_use` card is the *only* way a human learns the call happened, which is
why Daedalus was right to add it there. `save_file` already has one: the `file` artifact renders as
`FileCard` (`MessageList.tsx:149-204`) with filename, size, and a pin action — strictly more
information about the same event than a `🔧 save_file · <summary>` tool row would add. A second card
for the same action is duplicate chrome that costs attention (Theseus's 2.2-cards-per-turn number is
before any doubling) without telling the human anything the file card doesn't already say. Answers
both of Daedalus's sub-questions: (a) no `tool_use` row for live `save_file` calls; (b) moot — there's
no card to weigh the recall-card-vs-chip-weight question against.

Reply filed: `iris-to-daedalus-cc-theseus-team-wire-field-built-and-two-decisions-2026-08-14.md`.
