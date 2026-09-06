# Round 162 — the generic line was server-side, and one of the two fixes wasn't where we routed it

**Seat:** Daedalus · **Date:** 2026-09-06 (MID fire) · **Commit:** `aeef9f2`
**Upstream:** Theseus, Round 161 — `docs/research/round161-path-c-live-at-the-endpoint-the-binding-holds-and-the-agent-arrives-blank-2026-09-06.md`
**Tests:** `packages/server/src/__tests__/round162-boilerplate-preamble-and-distinct-roster.test.ts` (12)

---

## What this fixes

Theseus drove Path C (`717bfb6`, Round 160) at the real endpoint and reported
18/18 on the binding itself, plus two consequences and one boundary. This round
closes the two that are server-side. Neither is a defect in Path C. Both are
lines that were harmless because of *who they applied to*, and Path C changed
who they apply to.

## 1. The boilerplate channel preamble reached the model

### The measurement

Theseus's number, at the endpoint: a chat bound to Piper Morgan through the
form's own defaults assembles to 97 chars —

```
You are a helpful assistant.

You are Piper Morgan, a product manager. …
```

Generic instruction at char 0. Chosen identity at char 71.

His control is the part that explains why this sat here unnoticed. A default
1:1 — the only kind that existed before Path C — assembles to 58 chars:
`"You are a helpful assistant.\n\nYou are a helpful assistant."` The seeded
default entity's prompt (`db/index.ts:84`) is character-for-character the same
string as the channel fallback, so **layer 4 duplicated layer 5 and cost
nothing**. Path C is what puts a different identity at layer 5.

### The correction to the routing

Theseus routed this to Iris as a one-line client change: send `undefined` when
the "Custom instructions (optional)" field is blank, since layer 4 is already
`if (channelPreamble?.trim())` and an absent addendum is a supported state.

**That would not have fixed it.** Verified by reading the chain this session:

| step | file:line | what it does |
|---|---|---|
| client sends `undefined` | `ChannelSidebar.tsx:125` | (proposed fix) |
| route substitutes | `channels.ts:201` | `systemPrompt?.trim() \|\| 'You are a helpful assistant.'` |
| stored | `channels.system_prompt` | the generic string, again |
| read back | `messages.ts:112` | `channel.systemPrompt` → `channelPreamble` |
| assembled | `client.ts:482` | non-empty → pushed at layer 4 |

The route writes the string whether or not the client sends one. Iris's
one-liner would have changed the request body and nothing the model sees.

There is a second reason to fix it in assembly rather than at creation: **a
create-time fix only helps channels created after it lands.** Every channel that
already exists carries the stored boilerplate. Imported channels are the
population that matters most here — they are always `type: 'chat'` bound to the
minted entity (`queries.ts:1290`), which is precisely the "real identity at
layer 5" case. Assembly covers them; the route could not.

### The string already had four meanings, and prompt assembly held the odd one out

Before naming it, this exact literal appeared as "not real content" in four
places and as "a real channel addendum" in one:

- `App.tsx:526` — hides the channel-context panel when the purpose equals it
- `ChannelSidebar.tsx:143` — strips it from the clone-from-klatch prefill
- `probe-generator.ts:58` — L4 probes skipped below 40 chars, a threshold added
  in **Round 28 (Theseus, 4/26) specifically because this 28-char addendum
  produced a false-positive Phantom score**
- the create form itself — placeheld "(optional)", empty default
- **`buildSystemPrompt` layer 4** — sent it to the model

So the fix is not a new convention. It is prompt assembly joining one the
codebase already had, and Round 28 is prior art that the *server* already knew
this string was not content — it just worked around the symptom (probe scoring)
rather than the cause (the string being in the prompt at all).

### What changed

`DEFAULT_CHANNEL_PREAMBLE` and `isDefaultChannelPreamble()` in
`packages/shared/src/types.ts`; layer 4 skips it; **all three** prompt-debug L4
reporters (`channels.ts`, and both in `aaxt.ts`) follow assembly and report
`EMPTY — default purpose, not sent`.

The reporters matter as much as the assembly. A debug surface that says ACTIVE
for a layer assembly drops is how a fix like this silently rots — and AAXT reads
those exact strings to decide which layers to probe.

### What I did not do

- **Did not touch the client.** The four client literals stay as they are.
  `round33b-remaining-ui.test.ts:88` pins one of them by regex against the
  source text, so unifying them is a coordinated change on Iris's surface, not
  a drive-by. The constant is exported from `shared` and ready when she wants it.
- **Did not remove the route's fallback.** `channels.ts` still stores the string,
  so `POST /channels` returns the same `systemPrompt` it always has and
  `channels.test.ts:66` still holds. Changing what is *stored* is a separate,
  larger call about the API contract; changing what is *sent to the model* is
  the defect.
- **Did not claim a behavioural effect.** Theseus spent no model calls and
  neither did I. Nobody has measured whether a model resolves the contradiction
  in favour of layer 5. His framing is the right one: "usually does" is the
  wrong guarantee for the one gesture whose entire purpose is *be this specific
  agent*.

## 2. The chat roster guard counted array entries, not agents

`entityIds: [X, X]` was **400 on a chat** (`channels.ts` guard counted the raw
array) and **201 with one seat on a klatch** (`createChannel` dedups with
`[...new Set()]` plus `INSERT OR IGNORE`). Two layers disagreeing about what a
repeated id means.

A chat is 1:1 in *agents*. `[X, X]` is one agent said twice, so the guard was
enforcing the array's shape rather than the invariant it was written for. Fixed
by deduping before the count, and passing the deduped roster on to
`createChannel` so the guarded value and the used value cannot drift apart.

Dedup runs *after* the unknown-id validation, so a duplicated unknown id is
still a 400 — pinned by a test, because that ordering is the thing a future
refactor would get wrong.

No user path produces a duplicate today. Fixed because it was measuring the
wrong thing, not because anything broke.

## Verification

- **12 new tests**, all green.
- **Negative control** — stashed the three source files (keeping the shared
  constant so the suite compiles) and re-ran: **6 of 12 fail.** The 6 that pass
  are the predicate unit test, real-purpose passthrough, plain-`EMPTY`
  reporting, klatch dedup, chat+2-distinct → 400, and unknown-id → 400 — the
  unchanged-behaviour guards, which are supposed to pass either way. Restored
  with `git stash pop`, confirmed by `git status`.
- **Full suite:** server **1530/1530** (96 files; 1518 before), client
  **260/260** + 13 skipped (unchanged). `npm run typecheck` clean across all
  three workspaces.
- Notably green without edits: `round20-ux-evaluation-fixes.test.ts:94`, which
  asserts the assembled prompt contains the string — it still does, from layer 5
  where it belongs.

## Still open, not mine

- **Arm E, client half** — the form's fallback string. Now cosmetic rather than
  load-bearing (the request body still says something the model no longer
  hears), but the field still writes an instruction the user didn't type. Iris's.
- **`entityId` in the import dialog** — carried from Round 160. Iris's.
- **Bidirectionality** — should a 1:1 bound to an existing agent carry that
  agent's history? Theseus put this to xian directly and it is a design call
  with a real per-turn cost (2340 chars on his six-message fixture). Not a
  patch. Untouched here.
- **The stale channel-row model** — a bound chat's row holds `claude-opus-5`
  while the turn runs on `entity.model` (`client.ts:800`). Theseus flagged it as
  correct behaviour with an open question about whether any settings surface
  shows the stale row. Not investigated this fire.
