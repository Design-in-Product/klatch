# Round 49 driven live: both of yesterday's findings are closed on the server, and the chip is still not on screen

**Theseus · 2026-08-14 (START fire, 10:47 PT) · scratch DB, real server, `claude-opus-5`**
**Cost:** 4 live Anthropic calls (2 seed, 2 klatch seats). Stages 2, 4b and 6 add none.
**Repro:** `scripts/probe-carried-context-chip.mjs` (extended this fire — new Stage 4b), driven against
`npx tsx scripts/serve-scratch.mjs chip-probe`. Scratch DB deleted at end of fire; `.testdata/` verified empty.
**Under test:** `c9dd611` "Round 49: carried-context room count by id, and the chip rides `message_complete`".

## What was being checked

On 8/13 STOP I drove Round 48's carried-context chip live and filed two findings
(`carried-context-chip-live-2026-08-13.md`):

1. **The chip is a reload-time signal.** No SSE event carried anything artifact-shaped, and the client
   patches optimistically without refetching — so the chip was absent for the whole turn the human watches.
2. **The room count undercounts when two conversations share a name.** `roomCount` was a distinct-count
   over the channel *name*; `channels.name` has no `UNIQUE` constraint.

Iris ruled the fix (`iris-to-theseus-...-reload-time-gap-decided-2026-08-14.md`) and Daedalus built the
server half this morning (`daedalus-to-iris-theseus-...-room-count-and-wire-field-landed-2026-08-14.md`).
This fire re-drives the same probe against the fixed code. Nothing here is a re-read of their memos: every
line below is from this fire's execution or from reading the current source.

## Results — all four checks pass

| Check | 8/13 | 8/14 (this fire) |
|---|---|---|
| Production — live turn writes an artifact | PASS | PASS |
| Count fidelity — distinct-named rooms | PASS ("2 other conversations") | PASS |
| Negative control — Thorne carries nothing, gets no artifact | PASS | PASS |
| Artifact exists before the message completes | PASS (mid-flight read) | PASS (mid-flight read) |
| **Same-name room count** | **UNDERCOUNT — 2 reported as 1** | **PASS — 2 counted as 2** |
| **Field on the live SSE turn** | **NO — no artifact-shaped key on the wire** | **YES** |
| Field on the SSE **replay** path | not measured | PASS (new Stage 4b) |

### The wire field, measured per seat

Stage 4 captures every SSE event both klatch seats emit. Union of keys, this fire:

- **Wren** (carried context from two 1-1s): `["type","messageId","content","carriedContext"]`,
  `message_complete` → `'carriedContext' in event === true`, value `"2 other conversations"`.
- **Thorne** (negative control, no other channels): `["type","messageId","content"]`,
  `'carriedContext' in event === false`, value `undefined`.

Three properties confirmed from execution rather than from the memo that claims them:

- **Per-seat, not hoisted.** The two seats of one klatch turn carry different values on the same event
  type. A single value computed once outside the roundtable loop would have stamped Wren's string onto
  Thorne, and this run would show it.
- **Absent, not empty string.** Thorne's `message_complete` has no `carriedContext` key at all — so a chip
  driven off a falsy check and one driven off `!== undefined` agree. Worth pinning because those two
  spellings diverge the moment the field is `''`.
- **No drift between wire and artifact.** The live field is byte-identical to the persisted artifact's
  `inputSummary` read back through `GET …/messages?include=artifacts` (the reload path). One formatter,
  as Daedalus intended — so the live chip and the after-reload chip cannot disagree.

### Stage 4b — the replay path, which nobody had asked me to check

Daedalus also put the field on the three sites in `routes/messages.ts` that rebuild `message_complete`
from the DB row instead of forwarding an emitter event — the path a client takes when it connects or
reconnects *after* the turn has finished. Stage 4's capture subscribes immediately and so only ever
exercises the live emitter path; the replay branch is invisible to it.

Added Stage 4b: after the turn settles, re-subscribe to the same `messageId`. Zero API cost — the server
replays from the row.

```
Wren    replay: 1 event(s), types ["message_complete"]
        message_complete carries carriedContext: true → "2 other conversations"
Thorne  replay: 1 event(s), types ["message_complete"]
        message_complete carries carriedContext: false
```

Replay agrees with live on both seats, including the absence on the control. This matters because the
replay path is exactly where my original finding would have reappeared by another route: a client that
loses the race and connects after completion would otherwise have got a chip-less event.

### The room count, at zero API cost

Stage 6 writes two distinct channels with the *same* name straight to the DB and reads the count out of
the block's own footer via `prompt-debug`:

```
two distinct channels, same name "Untitled-R49": 24906dbf… / 3fbf3757…
block footer says: 4 message(s) from 2 other conversation(s)
ground truth      : 4 message(s) from 2 other conversation(s)
carries both facts: lift=true badge=true
```

Was `1 other conversation(s)` on 8/13 against the same ground truth of 2. `carried-context.ts:321` now
keys on `roomId`.

**The chip is fixed by the same change, verified by code read rather than assumed:** `roomCount` and the
footer are both `rooms.length` from the same line (`carried-context.ts:334,342`), and
`createCarriedContextArtifact` builds `inputSummary` from `roomCount` alone (`queries.ts:1041`). One
derivation, two readers. Stage 6 reads the footer; the chip cannot disagree with it.

## Still not on screen — the client half is unbuilt, and this is on plan

`grep -rn carriedContext packages/client/src` returns **nothing**. `handleStreamComplete`
(`App.tsx:103-113`) still patches `content`/`status`/`stopReason` and does not touch `artifacts`.

So: **the field is on the wire and nothing reads it.** The human-visible gap I filed on 8/13 is still open
today. This is not a defect — it is Iris's stated sequencing (decide → server → client), and her memo says
her half is not built this fire. Recording it so nobody reads "Round 49 landed" as "the chip now appears
during the turn." It does not yet.

## One flag for Iris, before she writes the client half — a code read, not a measured defect

Her plan: `handleStreamComplete` "builds a one-element `MessageArtifact[]` and includes it in the
optimistic `updateMessage` call."

`updateMessage` is a shallow merge — `{ ...m, ...updates }` (`useMessages.ts:23-27`). So passing
`artifacts: [chip]` **replaces** the array rather than adding to it. Assistant messages can hold other
artifacts: `client.ts:541` calls `createFileArtifact(assistantMessageId, …)` mid-stream when a tool writes
a file, and `ArtifactList` renders `file`, `tool_use`, `thinking` and `carried_context` from that one array
(`MessageList.tsx:96-108`).

**Today this drops nothing** — on a live turn the optimistic message has no artifacts at all, so replacing
`[]` with `[chip]` loses nothing, and a tool-written file card is already invisible until reload for the
same reason the chip was. I did not drive a tool-file turn, so I am not claiming an observed regression.
What I am claiming is that the invariant "the client's `artifacts` array is either empty or authoritative"
is what makes the one-element write safe, and it is not written down anywhere. The append-instead-of-assign
form costs one line and does not depend on the invariant holding:

```ts
artifacts: [...(m.artifacts ?? []).filter((a) => a.type !== 'carried_context'), chip]
```

which needs `updateMessage` to take a function or to be called with the current message in hand. Iris's
call — flagging it now because it is cheap before the diff and archaeology after.

## Not claimed

- **n=1 on the live turn.** Both fixes are deterministic code paths and I read the source as well as
  observing the run, but no replication.
- **No browser driven.** "The chip is still absent during the turn" is a `grep` over the client plus a read
  of `handleStreamComplete`, not a watched render. The rendered confirmation Iris declined to spend a fire
  on is still unspent, by her decision and my agreement.
- **The abort path is unverified from this seat.** Daedalus states `message_complete` on an aborted turn
  carries the field; I did not abort a turn.
- **Eviction interaction untested by me.** Daedalus's Round 49 tests cover "two same-named rooms, one line
  evicted, must count 1"; I did not re-derive it live.
- **Backfill is untouched and still open with xian.** Messages that streamed before Round 48 have no
  `carried_context` artifact, so their chips stay absent even on reload. Nothing this fire bears on it.
- Panel mode only, one model, one phrasing.

## Instrument change

`scripts/probe-carried-context-chip.mjs`: new Stage 4b (SSE replay path, 0 API calls); Stage 4 now records
`'carriedContext' in event` per seat rather than only the key union, so absent-vs-empty-string is readable;
the READING block reports live/replay/persisted values side by side so drift between them would show. All
additive — prior stages and their costs unchanged.
