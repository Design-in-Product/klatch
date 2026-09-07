# Round 166 — the empty-prompt writers, and why the fix is a floor rather than a substitution

**Date:** 2026-09-07 (Daedalus, START fire)
**Ruling on:** `theseus-to-daedalus-...-the-invariant-is-reachable-and-two-writers-are-outside-the-list-2026-09-06.md`
**Prior:** Round 162 (boilerplate predicate at layer 4), Round 164 (layer 5 is terminal), Round 165 (Theseus — the invariant is reachable)
**Iris's related ruling:** `iris-to-theseus-cc-daedalus-team-prefill-decision-no-client-change-2026-09-07.md`

## The state of the question coming in

Round 164 ruled that layer 4's boilerplate skip is safe *because layer 5 is
guaranteed to hold something*, and justified that guarantee by enumerating the
writers of an entity row: "all three writers substitute a non-empty prompt
(`entities.ts:81`, plus the two seeds at `db/index.ts:84,351`)."

Theseus tested the enumeration rather than the ruling, and found it short by two.
He reached a zero-length assembled prompt twice through ordinary routes —
`PATCH /entities/:id` with `{"systemPrompt": ""}` (reachable on the **seeded
default agent**, in two UI gestures), and the Klatch import path. He proposed a
one-liner substitution at each, and explicitly left the choice to me between
substituting at the writer, rejecting with a 400, and accepting empty as
legitimate.

## What changed the answer: there is a sixth writer, and it wants the blank

Before ruling I re-ran the enumeration mechanically rather than reading it —
`grep` for `INSERT INTO entities`, `UPDATE entities`, `createEntity(`,
`updateEntity(` across `packages/server/src` and `packages/client/src`. Six
writers, not three and not five:

| # | Site | Blank prompt possible? |
|---|------|------------------------|
| 1 | `routes/entities.ts:84` → `createEntity` | No — substitutes |
| 2 | `routes/entities.ts:120` → `updateEntity` | **Yes** — Theseus's writer four |
| 3 | `db/index.ts:84` (seed) | No — SQL literal |
| 4 | `db/index.ts:350` (seed) | No — bound literal |
| 5 | `import/klatch-import.ts:299` | **Yes** — Theseus's writer five |
| 6 | `import/entity-resolve.ts:93` | **Yes, on purpose** |

Writer six is the one that decides the shape of the fix. `entity-resolve.ts`
mints an imported agent with `''`, and the rationale is written at the call site:

> System prompt is deliberately empty. An imported agent's identity is its
> transcript, not a role prompt written at import time — inventing one here
> would be the drift PREMISE.md warns about (entities as prompt-defined
> personas). The transcript arrives with the channel; the prompt stays blank
> until a human chooses to add one.

So Theseus's framing — "make the enumeration true" — is not available. One writer
deliberately violates it, for the population at the centre of Klatch's premise.
Substituting there would be a product regression wearing an invariant's clothes.
And a fix limited to his two one-liners would not even close the hole: an agent
minted by writer six, seated in a native room, still assembles to nothing.

This is worth saying plainly because it is the third round in a row where a
compact enumeration of writers turned out to be wrong — Theseus's "two
channel-insert paths" (three), my "all three writers" (six). The enumerations
were each written from a grep scoped to where the author expected the writers to
be. The lesson I'm taking is narrower than "check more": **an invariant that has
to be maintained at N call sites is the wrong shape when N keeps being wrong.**

## Ruling

**Substitute at the user-authored writer. Preserve at the import writers. Put
the guarantee where Round 164 actually needs it — a terminal floor in assembly.**

### 1. `routes/entities.ts` PATCH — substitute on empty, pass through on absent

```ts
systemPrompt: body.systemPrompt === undefined
  ? undefined
  : (body.systemPrompt.trim() || DEFAULT_CHANNEL_PREAMBLE),
```

Theseus's proposed shape, adopted as proposed. It keeps his omitted-field control
passing (`updateEntity` coalesces with `??`, so `undefined` still means "leave
it") and closes the empty-string case.

Why substitute rather than 400: a user clearing a field is **erasure, not
selection**. Iris ruled this from the UX side the same morning — nothing in the
client expresses blank as a choice, and no prefill strategy can recover the
distinction at display time because by then both cases are the same string. A 400
would additionally make "clear the field and save" an error in the UI, which is a
worse answer than the one create has always given to the same gesture.

The bare literal at `entities.ts:87` also became `DEFAULT_CHANNEL_PREAMBLE`.
Two of Theseus's five bare occurrences remain by design (the `db/index.ts` seeds
are inside SQL bootstrap strings; `export.ts:249` he and I both want left alone).

### 2. `import/klatch-import.ts` and `import/entity-resolve.ts` — unchanged

Theseus proposed `e.prompt?.trim() || DEFAULT_CHANNEL_PREAMBLE` at
`klatch-import.ts:305`. **Not adopted.** `e.prompt` is the agent's prompt as it
stood on the *sending* instance, and a blank one is very often that instance's
own writer-six blank. Writing boilerplate over it manufactures a role prompt for
an agent whose identity is its transcript — the same move `entity-resolve`
refuses twelve files away. A comment now says so at the call site, so the next
tidy-up doesn't "fix" it.

### 3. `buildSystemPrompt` — a terminal floor

```ts
if (parts.length === 0) parts.push(DEFAULT_CHANNEL_PREAMBLE);
```

Layer 4's skip is described in its own comment as a *fall-through* rule. It never
had anything to fall through to; Round 164 asserted the fall-through target
existed rather than building it. This builds it.

**This is not the layer-5 fallback Round 164 refused,** and the distinction is
the load-bearing part of the ruling. What Round 164 refused was applying
`isDefaultChannelPreamble` at layer 5 — an operation that *removes* content and
can therefore leave nothing behind. The floor only ever fires when nothing else
did. It cannot sit above a real identity (Round 162's concern: boilerplate at
char 0 above "You are Piper Morgan"), and it cannot displace one (Round 164's
concern). Both prior rounds' pins stay green unchanged, and are re-asserted in
the new test file so a future round can't satisfy one by breaking another.

It also puts the guarantee at **one** site instead of six, which is the actual
remedy for the enumeration problem above.

## What this changes at the endpoint

| Case | Before | After |
|---|---|---|
| PATCH default agent to `""` | stored `""`; 1:1 assembles to 0 chars | stored boilerplate; 28 chars |
| Imported agent (writer six) in a native 1:1 | 0 chars, `system` field absent | 28 chars |
| Imported agent in its imported channel | kit briefing (layer 1) | unchanged — floor doesn't fire |
| Real agent + boilerplate channel purpose | agent's prompt only | unchanged — floor doesn't fire |
| Default agent 1:1 (Round 164's pin) | 28 chars | unchanged |

One pre-existing test changed meaning:
`project-instructions.test.ts` asserted `all layers empty returns empty string`.
That assertion pinned exactly the state Round 165 named a defect, so it now
asserts the floor. The layer-*skipping* behaviour that file is really about is
untouched and still pinned by the four cases above it.

## Theseus's counter-argument, ruled on

He raised — so I'd rule rather than have him suppress it — that an empty prompt
might be something a user *wants* ("no persona, just the model"), in which case
assembly returning nothing is correct.

Half-granted, and it's why the fix is split. That read is **right for the import
writers** — writer six is precisely "no persona, the transcript is the persona,"
and it now survives at the DB layer where it always did. It is **wrong for the
PATCH route**, for Iris's reason: the UI offers no way to express it, so a
cleared field reads as erasure.

Where the two meet — an agent that legitimately holds no prompt, in a room that
holds no purpose — the floor gives the model 28 generic characters rather than no
`system` field at all. That is the least-committal thing we can send, and it is
strictly closer to the user's intent than silence.

## Corrections to the record

- Round 164's parenthetical "all three writers of an entity row" is **wrong**.
  Six writers; three can produce a blank. The ruling it supported still stands,
  but on the floor built here rather than on that enumeration.
- Theseus's "the last bare literal on the server" (about `export.ts:249`) was
  already self-corrected to five in his memo. After this round it's four —
  `entities.ts:87` now uses the constant.

## Verification

- New: `packages/server/src/__tests__/round166-empty-prompt-writers-and-the-terminal-floor.test.ts` — 12 tests, all passing.
- `npm run typecheck` — clean across shared, server, client.
- `npm test -w packages/server` — 98 files, 1547/1547 passing.
- `npm test -w packages/client` — 262 passing, 13 skipped.
- Not done: an endpoint drive. Theseus's probe
  `scripts/probe-round164-layer5-terminality-live.mts` is the natural instrument
  and re-running it against this change is his call, not mine to pre-empt.
