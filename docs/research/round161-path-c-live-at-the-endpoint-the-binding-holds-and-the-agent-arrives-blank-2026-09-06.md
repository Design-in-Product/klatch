# Round 161 — Path C at the endpoint: the binding holds, and the agent arrives blank

**Theseus · 2026-09-06 START fire · zero model calls, zero API spend**
**Instrument:** `scripts/probe-path-c-chat-binding-live.mts`
**Under test:** `717bfb6` (Daedalus, 2026-09-06 09:27 PT) — Path C, "continue existing role"
**Runs:** three independent full runs, identical results (entity UUIDs differ, nothing else)
**Result:** **18/18 regression checks pass · 2 open arms confirmed open · 12 measurements**
**Hygiene:** `git diff --stat -- packages/` empty before and after, asserted in-probe (arm Z);
scratch DB under `.testdata/path-c-chat-binding/`; `klatch.db` never opened.

---

## Why this probe

Daedalus shipped Path C three hours before this fire. The gap it closed is real and was worth
closing: the agent picker was gated on `newType === 'klatch'`, so you could import an agent,
watch it mint, see it in the registry — and have no way to open a one-to-one with it.

His 11 new tests are React component tests against a mocked callback. The commit message says
*"Verified end-to-end, not assumed"* and then cites `messages.ts:87` and `client.ts:491`. Those
are source line numbers. It is a code read, and it is almost certainly right — but Round 141
arm F is the standing reason not to let that stand as the verification: `entityGuess` was
typed, populated, and unit-tested against mocked fetch, and would have shipped a permanently
blank field because the route never spread it.

So: drive it over real HTTP, against a real server, with a real DB.

Every arm reads `GET /api/channels/:id/prompt-debug`, which assembles the exact prompt the
Anthropic API *would* receive and returns it without sending it. That is what makes a probe
about prompt composition free.

---

## 1. The binding holds. All of it.

Sent exactly as the shipped form sends it — `type` omitted (`ChannelSidebar.tsx:125` passes
`undefined` for a chat), the client's own prompt fallback, one entity in `entityIds`:

| check | result |
|---|---|
| POST with a one-agent roster | **201** |
| server resolves omitted `type` | `chat` |
| resolved entity | the picked one, not the default |
| roster | exactly one seat, and it is the picked agent |
| default entity in the room | **no** |
| enriched channel list | `entityCount: 1` |
| layer 5 | `"Piper Morgan" — 67 chars` |
| the agent's identity text in the assembled prompt | **present** |
| a second agent's identity | absent |
| empty roster | still lands on `default-entity`, unchanged |
| chat + 2 agents | **400** — *"A chat is 1:1 — use type klatch for multiple agents"* |
| unknown entity id | **400** — *"Unknown entity ID(s): no-such-entity"* |
| klatch + 2 agents | **201** |

**Daedalus's end-to-end claim survives contact with the endpoint.** There is no `entityGuess`
here — the field is on the wire, the route reads it, the roster persists, and prompt assembly
resolves the bound agent. I went looking for the Round 141 shape and did not find it.

One boundary the form cannot reach and the API can, recorded without a ruling:

> `entityIds: [X, X]` on a chat returns **400**, because the coherence guard counts the raw
> array (`routes/channels.ts:183`) while dedup happens one level below it in `createChannel`
> (`queries.ts:178`). The same input on a klatch returns **201 with one seat**. The two layers
> disagree about what a duplicated id means. No user path produces it (the form holds a `Set`),
> and I have no opinion on which layer is right.

---

## 2. Arm E — the form injects "You are a helpful assistant." above the agent's identity

**Measured, all three runs.** A chat bound to Piper Morgan, created through the form's own
defaults, assembles to **97 chars**:

```
You are a helpful assistant.

You are Piper Morgan, a product manager. PIPER-IDENTITY-MARKER-R161
```

The generic line is at **char 0**. The agent's identity starts at **char 71**. `buildSystemPrompt`
pushes layer 4 (channel addendum) at `client.ts:482` and layer 5 (entity prompt) at `:491`, so
the ordering is structural, not incidental.

Where it comes from: `ChannelSidebar.tsx:125` sends `newPrompt.trim() || 'You are a helpful
assistant.'`. The field it falls back from is a textarea placeheld **"Custom instructions
(optional)"** with an empty default. Nothing tells the user that leaving an optional field
empty writes an instruction into the prompt.

**The line did not change. The population did.** The control is exact — a default 1:1, the
only kind that existed before Path C, assembles to **58 chars**:

```
You are a helpful assistant.

You are a helpful assistant.
```

The default entity's own seeded prompt (`db/index.ts:84`) is character-for-character the same
string as the client's fallback. Layer 4 duplicated layer 5 and cost nothing, which is why this
has sat here harmlessly. Path C is what puts a *different* identity at layer 5 and turns a
redundant line into a contradictory one.

**What I am not claiming.** I have not measured whether a model given this prompt behaves as a
generic assistant or as Piper Morgan. That costs live turns and I spent none. The finding is a
statement about what is in the prompt, not about what comes out of it. My guess is that layer 5
wins most of the time — and "most of the time" is the wrong guarantee for the one gesture whose
entire purpose is *be this specific agent*.

**Cheapest fix, if xian or Iris wants one:** send `undefined` when the field is empty rather
than the fallback string. Layer 4 is already `if (channelPreamble?.trim())` — an absent
addendum is a supported state, and the server's own default only applies to the DB column. That
is a one-line change in `handleSubmit`. It also fixes the default chat, which currently says the
same sentence to itself twice.

---

## 3. Arm F — the bound agent arrives blank, and the klatch beside it does not

Same agent, same prior conversation, two rooms, measured side by side:

| | bound 1:1 | klatch seating the same agent |
|---|---|---|
| layer 6 | `INACTIVE — carried context applies to klatches only` | `ACTIVE — 2338 chars carried from "Piper Morgan"'s other channels (6 message(s) from 1 conversation(s), no older history)` |
| the prior conversation's content in the prompt | **no** | **yes** |
| assembled length | **97 chars** | **2437 chars** |
| recall tool offered | **no** | yes |

`buildCarriedContextBlock` returns `undefined` unless `channel.type === 'klatch'`
(`carried-context.ts:303`). The recall tool rides the same value — `...(carried ? { recall:
{ entity, channel } } : {})`, two occurrences in `client.ts` — so a 1:1 gets neither layer 6
nor the means to ask for it.

**This is a decided scope, not a bug.** `docs/plans/continuity-3-carried-context.md:11`:

> **Scope: klatches only.** In a 1-1 the channel's own history is already the whole of what the
> agent knows there. Carrying klatch content *back* into the 1-1 is bidirectionality — open
> question 2 in the gap doc, still unanswered — so this builds the direction that was decided
> and leaves the other alone.

**The finding is that the second sentence is the rationale, and Path C is the thing that makes
it false.** "The channel's own history is the whole of what the agent knows there" is true of a
brand-new 1:1 with the shared default entity. It is false by construction of a 1:1 you created
*specifically to continue with an agent who has history elsewhere* — that history is the entire
reason you picked them.

Three things sharpen it:

1. **The population predates Path C.** Imported channels are always `type: 'chat'` and bound to
   the confirmed or minted entity (`queries.ts:1290`, `:1280`, `:1295-1297`). Every imported
   conversation has been in this class since imports began minting per-agent entities. Path C
   did not create the asymmetry; it created the first UI gesture that walks a user straight
   into it and names the expectation out loud.
2. **The direction is already half-built.** In my fixture, the conversation the klatch carried
   *from* is itself a 1:1. The system already reads chat history out of 1:1s and into klatches.
   It has never read it back in. That is exactly open question 2 — bidirectionality — and it has
   been "unanswered, out of scope by that fact" since 2026-07-19.
3. **The gesture states the expectation in the UI.** Daedalus rendered the affordance
   "Continue with an existing agent." A user who clicks that and gets an agent with the right
   name, the right colour, the right model and none of the conversation has been told something
   that isn't so — and unlike a klatch, there is no chip to tell them what did or didn't arrive.

**Also not claiming:** that layer 6 *should* be on for bound chats. Turning it on has a real
cost (2340 chars per turn here, on a fixture of six messages) and a real design question behind
it — a 1:1's own history is already in the message list, so carrying the *other* rooms in means
deciding whether the room you're in should be excluded, which `excludeChannelId` already
supports but nobody has ruled on. That is xian's call and Daedalus's design, not my measurement.

---

## 4. Arm G — which model a bound chat runs on

Recorded, not judged. `App.tsx handleCreateChannel` passes `undefined` for the channel model, so
the channel row gets `DEFAULT_MODEL`, while the turn runs on `entity.model` (`client.ts:800`):

```
channel.model = claude-opus-5 · entity.model = claude-fable-5-1
```

The turn is called on the entity's model, which is the behaviour I'd want. The note is that the
channel row now holds a model that will never be used for that channel, and any surface reading
the channel row will show it. Whether that surfaces anywhere user-visible is Iris's to check —
I did not drive the settings panel.

---

## What this changes

- **Path C works.** Nothing about the binding needs a fix. 18/18 at the endpoint.
- **Two consequences are live**, both of the same shape — a line that was harmless because of
  who it applied to, and is no longer harmless because Path C changed who it applies to.
  Neither is a defect in `717bfb6`.
- **Arm E has a one-line fix** and I have not made it; it is Iris's component and Daedalus's
  call whether the empty-addendum path is the right answer.
- **Arm F is a design question that has been open since 2026-07-19** and now has a user gesture
  pointed at it. It needs xian, not a patch.

The probe's E and F arms are written in the positive, so the day either passes is the day the
item genuinely closed. They report and do not exit 1.
