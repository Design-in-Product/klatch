# The carried-context chip, driven live — it is correct, and it is not there when the human is looking

**Theseus · 2026-08-13 (STOP fire, 19:47 PT) · 4 live `claude-opus-5` calls, real server, scratch DB deleted at end of fire**

Repro: `scripts/probe-carried-context-chip.mjs` (`node scripts/probe-carried-context-chip.mjs C1`
against `npx tsx scripts/serve-scratch.mjs chip-probe`).

Round 48 (Iris, this evening) shipped `🧵 Carried context from N other conversations` in
`MessageList.tsx`'s `ArtifactList`, with five component tests. Those tests hand the component an
artifact and assert it renders — which is the right test for the component and cannot answer three
other questions: does a real turn produce an artifact, is `N` right, and does it reach the client
while the human is reading the reply. This probe answers all three against the running server.

**Two of the three pass. The third does not, and one count is wrong in a case the product will
actually hit.**

---

## What was measured

Two entities in one panel klatch. **Wren** was seeded in **two separate 1-1s** (so ground truth for
the chip is a specific, falsifiable "2 other conversations" rather than a plausible "1"). **Thorne**
has no other channels at all and is the negative control — an implementation that stamped an
artifact on every assistant message would also pass a production check, and Thorne is what
separates those.

Preconditions read off the assembled prompt before anything was asked, at zero API cost:

```
Wren    6_carriedContext: ACTIVE — 2173 chars carried from "Wren-C1"'s other channels
                                   (4 message(s) from 2 conversation(s), no older history)
Thorne  6_carriedContext: EMPTY  — "Thorne-C1" has no history in any other channel
```

---

## 1. Production and count fidelity — PASS, and the artifact exists before the turn finishes

The mid-flight read (taken 1.5s after POST, while both assistant messages were still `streaming`)
already shows the artifact written:

```
Wren    status=streaming  carried_context artifacts: 1 → inputSummary: "2 other conversations"
Thorne  status=streaming  carried_context artifacts: 0
```

That timing is not incidental — it is the fact that makes finding 3 a delivery problem rather than
a data problem. `createCarriedContextArtifact` is called at stream *start*
(`claude/client.ts:785`), before the Anthropic call, so the row is available for the entire
lifetime of the stream the human is watching.

Final state via `GET /channels/:id/messages?include=artifacts` — the same URL the client fetches
(`api/client.ts:256-259`):

```
Wren   : 1 artifact → chip reads "🧵 Carried context from 2 other conversations"
         server-side content (never rendered):
         {"roomCount":2,"messageCount":4,"omittedCount":0,"hasOlderHistory":false}
Thorne : 0 artifacts
```

Count correct, negative control clean, and the existence-not-content boundary holds on the wire:
the four numbers are present in `content` and the only string the client renders off is
`inputSummary`.

## 2. Two conversations with the same name are counted as one — UNDERCOUNT

`buildCarriedContextBlock` derives rooms as `[...new Set(kept.map(k => k.room))]`, and `k.room` is
the channel **name** (`carried-context.ts:311`). `channels.name` has no `UNIQUE` constraint
(`db/index.ts:44-45`), and nothing in the create path enforces one — the probe made two
same-named channels through the ordinary `POST /channels` route the UI uses.

Measured with **zero API calls**, by reading the count out of the block's own footer:

```
two distinct channels, both named "Untitled-C1"
block footer says : 4 message(s) from 1 other conversation(s)
ground truth      : 4 message(s) from 2 other conversation(s)
carries both facts: lift=true badge=true
```

**Both conversations' content is carried correctly. Only the count is wrong** — so this is
invisible in the prompt and visible only in the two places that report the number: the footer the
model reads, and the chip the human reads. The chip's entire content is that number.

**Why this is not a contrived case.** Klatch's premise is *imported* conversations, and the import
path names a channel from the source conversation's title (`queries.ts:824,838`). Duplicate titles
across imported threads are ordinary — "Untitled", a repeated project name, two sessions started
from the same template. Two imported threads that happen to share a title become one conversation
in the count.

The fix is one line and does not need new plumbing: `TranscriptMessage extends Message`, so
`recent[i].channelId` is already on every row (`queries.ts:34-46`, `:556-560`). Counting distinct
`channelId` while keeping `channelName` for the display line fixes both reporting surfaces at once.
**Daedalus's surface, not mine to patch.**

## 3. The chip does not appear on the turn the human is watching — it appears on reload

Every SSE event for both seats was captured for the live turn:

```
Wren  : 5 events {"text_delta":4,"message_complete":1}
        union of keys across all events: ["type","messageId","content"]
Thorne: 5 events {"text_delta":4,"message_complete":1}
        union of keys across all events: ["type","messageId","content"]
```

No event carries artifact data — matching `StreamEvent` at `shared/src/types.ts:370-381`, which is
`type | messageId | content | stopReason?` and nothing else.

The client side (read, not inferred):

- `App.tsx:103-113` `handleStreamComplete` calls `updateMessage(messageId, {content, status,
  stopReason})` — an in-memory patch of the optimistic message object created at send time
  (`App.tsx:144-153`), which has no `artifacts` field.
- `useMessages.refresh` is the only thing that ever calls `fetchMessages`
  (`useMessages.ts:9-13`), and it runs in one place: a `useEffect` keyed on `channelId`
  (`:15-17`). It is destructured in `App.tsx:49` and **never called** — grep for `refresh` in
  `App.tsx` returns that line and two unrelated `fetchChannels` lines.

So for the message you just watched arrive, `artifacts` is `undefined` and `ArtifactList` returns
`null`. The chip appears when the channel is re-entered or the page reloaded.

**Why this matters more than it would for another artifact type.** The same gap applies to the
thinking indicator and tool cards, and there it is cosmetic — a detail that shows up later. The
chip was shipped on a specific argument (`docs/ux/carried-context-visibility-2026-08-13.md`, from
`design-principles.md`): *a silent room implies each participant's knowledge is bounded by what is
visible there, so staying silent is the thing that misleads.* The moment the human forms that
impression is the moment they read the reply. Right now the room is silent in exactly that moment
and speaks afterwards, if the human happens to come back.

It also breaks the ranking Iris's duplication ruling rests on. The chip was kept as the reliable
structural signal, with the agent's prose hedge as the model-judgment-dependent one. On the live
turn the ordering inverts: the prose is the only thing present, and the structural signal is the
one that is missing.

**This is not a Round 48 regression** — nothing about the chip's implementation caused it, and the
artifact is in the DB in time. It is a pre-existing property of the optimistic-update path that the
chip is the first feature to actually depend on.

**The codebase has already solved this once, for the same reason.** `StreamEvent.stopReason`
exists with this docstring (`types.ts:374-379`):

> *The client updates its local message optimistically on stream completion rather than refetching
> the row, so the reason has to ride the event or the bubble renders as a clean completion until
> the channel is reloaded.*

That is this problem, one field over, with the precedent already set.

**Options, for Iris and Daedalus — not mine to choose:**

1. **Ride it on `message_complete`.** One optional field on `StreamEvent` (the `inputSummary`
   string, or `roomCount`), set from the artifact that already exists before the stream opens.
   Follows `stopReason`'s precedent exactly, keeps existence-not-content, no refetch. My read: this
   one.
2. **Call `refresh()` on stream completion.** Zero new protocol, and `refresh` is already
   destructured-and-unused as if someone intended it — but it is a full channel refetch per
   completed message, and it discards optimistic state mid-render for every other seat in a klatch.
3. **Accept and record** — the chip is a reload-time signal. Defensible, but it should be written
   down that the signal is absent at the moment its own rationale is about.

---

## What this does not establish

- **n=1 per finding.** Findings 2 and 3 are deterministic code paths — a `Set` over names, and a
  protocol shape with no field to carry the data — both read in source as well as observed, so a
  replicate would re-measure the same branch. Finding 1 is the one that is model-adjacent, and it
  is the one that passed.
- **No browser was driven.** Finding 3's client half is a code read plus the measured absence of
  any artifact-bearing event on the wire; I did not watch the chip fail to appear in a rendered
  page. The server half is measured. If someone wants the visual confirmation it is an AAXT run,
  not another probe.
- **One model, one klatch mode.** Panel only. Roundtable creates the artifact on the same terms
  (`client.ts:856`) but was not exercised.
- **Whether a human finds the chip useful is still untested** — unchanged from this morning, and
  not answerable from the server side.
