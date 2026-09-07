# Round 164 — the boilerplate predicate is layer-4-only, and that is the rule, not the leftover

**Seat:** Daedalus · **Date:** 2026-09-06 (STOP fire)
**Upstream:** Theseus, Round 163 — `docs/research/round163-round162-at-the-endpoint-the-fix-holds-but-not-for-imports-2026-09-06.md`
**Tests:** `packages/server/src/__tests__/round164-layer5-is-terminal.test.ts` (5)
**Zero model calls.** The one network call in these tests is the model *catalog*
fetch, which fails auth in the harness and falls back to a static list.

---

## The question Theseus put on this seat

Round 162 taught prompt assembly that `"You are a helpful assistant."` is
boilerplate rather than content, and skipped it at layer 4. Driving that fix at
the endpoint, Theseus found the server writes the identical string in a second
place, and Round 162 did not reach it:

```
an entity created with no prompt stores  — "You are a helpful assistant."
a chat bound to it assembles to          — 28 chars — "You are a helpful assistant."
L4="EMPTY — default purpose, not sent" · L5="\"Unnamed Helper\" — 28 chars"
```

He explicitly declined to call it a defect, and asked instead that the asymmetry
be deliberate rather than incidental: the convention "this string is boilerplate,
not content" is now enforced in one of the two places the server writes it.

Verified this fire, by reading rather than recalling — `routes/entities.ts:81`
is `systemPrompt?.trim() || 'You are a helpful assistant.'`. His measurement is
right.

## Ruling: the asymmetry is correct, and here is the reason he didn't have

**The predicate is a fall-through rule, and a fall-through needs somewhere to
fall to.**

Layer 4 can be dropped because layer 5 is guaranteed to hold something. That
guarantee is structural, not incidental: every channel has at least one entity,
and all three writers of an entity row substitute a non-empty prompt —
`entities.ts:81` for the create route, `db/index.ts:84` and `:351` for the two
seeds. Dropping layer 4 therefore falls through to an identity.

Layer 5 is **terminal**. Nothing sits beneath it. Applying the same predicate
there does not fall through to anything — it produces a **zero-length system
prompt**, for the seeded default entity (whose prompt *is* this string) and for
every agent whose prompt the user left blank. The default 1:1 is Klatch's most
common gesture, so the tidy-up that looks like consistency would empty the
prompt on the most-travelled path in the product.

Theseus's semantic argument arrives at the same place from the other side, and
I'd keep both: layer 4 was wrong because it *contradicted* a real identity; at
layer 5 it is the only identity there is. Mine is the mechanical version and
survives a reader who doesn't accept the semantic one.

Corollary worth stating plainly, because it's the invariant and not the
implementation: **assembly never hands the model a zero-length system prompt.**

## What was built

No behaviour change. What changed is that the asymmetry is now stated in the
three places a future refactor would look, and pinned by a test that fails if
either half moves.

- `packages/shared/src/types.ts` — `isDefaultChannelPreamble`'s doc comment now
  says **"Layer 4 only"** and why. This is the definition site; a reader
  reaching for the predicate to apply elsewhere finds the rule first.
- `packages/server/src/claude/client.ts` — layer 5 in `buildSystemPrompt` says
  it is deliberately not filtered, and names the consequence.
- `packages/server/src/routes/entities.ts:81` — the writer says the string stays
  and stays sent, and points at the test.

### The gap the existing tests left

`round162-*.test.ts` already pins the default 1:1 at 28 characters — but with the
**seeded** entity. That is the wrong population to defend `entities.ts:81` with.
Verified by control rather than argued:

| control | round162 (12) | round164 (5) |
|---|---|---|
| apply the predicate at layer 5 in `client.ts` | **1 fail** (default 1:1) | **3 fail** |
| change `entities.ts:81` to store `''` | **12 pass** — silent | **2 fail** |

The second row is the gap. A change confined to the create route leaves every
Round 162 assertion green while emptying the prompt for every user-created
blank-prompt agent. Both controls were applied to the working tree, run, and
reverted (`git checkout --`, tree confirmed clean before proceeding).

## Deliberately not done

- **Did not use `DEFAULT_CHANNEL_PREAMBLE` at `routes/export.ts:249`,** the one
  remaining bare literal on the server (`system: entity.systemPrompt || 'You are
  a helpful assistant.'`, the session-notes call). Reusing a constant named
  `DEFAULT_CHANNEL_PREAMBLE` for an *entity* fallback would imply the predicate
  applies at layer 5 — precisely what this round rules it must not. The
  one-definition argument that motivated the constant in Round 162 loses to the
  rule it now carries. Named here so the next reader knows it was seen.
- **Did not change what `entities.ts` stores.** Same reasoning as Round 162
  declining to change what `channels.ts` stores: what is written is an
  API-contract question, separate from what reaches the model. Here they happen
  to be the same answer.
- **Did not touch the entity edit form** (`EntityManager.tsx:191` prefills the
  literal). A user who creates an agent with a blank prompt and reopens the form
  sees text they did not type. That is a real UI question and it is Iris's
  surface, not a drive-by from this seat. It is also now *correctly* reflecting
  what is stored, which is a defensible thing for a form to do.
- **Did not re-measure at the endpoint.** Theseus's Round 163 numbers are the
  measurement; this round is a ruling plus its guard.

## Also this fire: a correction to my own Round 162 doc

`docs/research/round162-the-generic-line-was-server-side-2026-09-06.md` claimed
imported channels were "the population that matters most" for the layer-4 fix,
and the commit message for it (`8aa563c`) said the fix "reaches imports." Both
wrong. `importSession` writes `''` (`queries.ts:1293`) and always has; empty is
falsy after trim, so imports were never affected. I inferred the claim from the
*shape* of an imported channel — `type: 'chat'`, minted entity, real identity at
layer 5 — without reading the insert, and cited a line number I had not opened.

Corrected in place, marked as a correction rather than silently rewritten, with
the measured replacement: the population is **native** channels, every one
created through the New Chat form.

## Open

Unchanged from the last fire, and none of it moved here:

- **Iris** — the four client literals, `entityId` in the import dialog, Round
  160's two copy/sizing calls. Theseus subtracted one item: the "send `undefined`
  when blank" one-liner is confirmed cosmetic with respect to the model.
- **xian** — bidirectionality (should a 1:1 bound to an existing agent carry that
  agent's history?). Theseus's Round 163 arm F sharpens it: the system read an
  *imported* 1:1's history into a klatch and would not read it back into a 1:1.
- **Mine** — the parked floor question, three triggers, none fired.
