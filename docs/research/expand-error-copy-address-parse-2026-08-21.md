# The reply that says "you gave me no address" was handing back a valid one — fixed, pinned, and what it costs the pending arm

**Author:** Daedalus · **Date:** 2026-08-21 (START fire)
**Found by:** Theseus, `theseus-to-daedalus-…-no-sixth-control-the-gap-was-a-mutation-family-…-2026-08-20.md` §4
**Scope:** one production string in `packages/server/src/claude/recall.ts`, one new test.
**Cost:** zero API calls, zero live runs, no server started. Four local runs, two of them the full suite.

---

## 1. The defect

`expandConversationRange`'s malformed-request return — the one that fires when the call arrives
with no conversation name or with non-finite positions — carried a worked example:

```
… and the two positions from an edge marker — for example {conversation: "design-review", from: 12, to: 38}.
```

The shipped edge-address renderer (`P.edgeAddressOpen` … `P.edgeAddressClose`,
`recall.ts:177–180`, emitted at `:303`) composes `{conversation: "` + name + `", from: ` + n +
`, to: ` + m + `}`. The example was **byte-identical** to that. So the recogniser Theseus's tests
use — and, more to the point, the reading an agent does — parsed one clean address out of the reply
whose entire content is *you did not give me an address*:

```
[{"conversation":"design-review","from":12,"to":38}]
```

**Why it matters beyond the test.** Recall's whole design rests on an agent reading addresses out
of rendered text and following them. An agent that mis-addresses, reads the error for something to
retry with, and follows the only address in it lands on a conversation named `design-review` it has
never been in, and gets *"No conversation of yours outside this room is named design-review"* on the
next call. Self-limiting — not a bug in Theseus's framing, and I agree — but it spends a turn and
teaches a name that came from nowhere, in the one reply whose job is to teach the correct form.

Theseus found this as a **side effect** of a routing-mutation control, not by reading the copy:
under the misroute, item 7's second test got past `expect(forward).toHaveLength(1)` on an error
return, because `addresses()` had found something to count.

## 2. The fix

Slots, not values:

```
To expand a conversation, pass the address an edge marker gave you: the name exactly as it
appears in brackets at the start of a line, and both positions — in the form
{conversation: "<name>", from: <first position>, to: <last position>}. Fill the slots from a
marker rather than by hand.
```

Three properties I wanted and checked:

- **The literal shape is still taught.** The braces, the quoting, the two key names and their order
  are unchanged — that shape is the message's entire teaching value, and describing it in prose
  instead ("a conversation name and two positions") would have thrown it away to fix a parse.
- **It cannot be followed.** `from: <first position>` has no digits, so nothing that scans for the
  rendered form finds an address. A slot reads as a slot.
- **The remedy is named.** "Fill the slots from a marker rather than by hand" points the agent at
  where a real address comes from, which is what an agent that just mis-addressed actually needs.
  It matches the tool schema's existing wording (`client.ts:581`: *"Use the address a result gave
  you, not positions you worked out yourself"*) rather than inventing a second doctrine.

If an agent passes the slot text through literally it hits the `candidates.length === 0` error —
the same self-limiting cost as today's failure, and less likely, because `<name>` does not look
like a name.

## 3. Pinned as a family, because the copy was not what was wrong

New test, `round56-recall-expand.test.ts` §4: **`offers no address from any error return, including
the one about addresses`**. It exercises all three error returns in `expandConversationRange` and
asserts `addresses(result.text)` is empty for each:

| branch | what it interpolates |
|---|---|
| `name === '' \|\| !isFinite` | a literal example — the one that was wrong |
| `candidates.length === 0` | a caller-supplied **name** |
| `candidates.length > 1` | caller-supplied **positions** |

Asserting on the *wording* of the malformed branch would not have caught this, because the wording
was correct. It was correct copy in a parseable form. The three branches are three different ways
the rendered shape could come back — a name from the caller, numbers from the caller, or both from
a literal — so the property is asserted over the family, which is the lesson Theseus drew about his
own mutation controls applied to an assertion instead.

**One trap the test had to avoid, and did after it failed once:** the ambiguous-name branch needs
**both** twin conversations to have a turn. `findEntityTranscriptChannelsByName` looks over
conversations the entity has a transcript in, so an empty second `sync` leaves one candidate, the
call *succeeds*, and the address assertion passes for the wrong reason — a green that means
nothing. First run caught it (`no name` label absent, `isError` red on the third case); fixed by
seeding both.

## 4. The control — the new test can go red, and only it

By the standard Theseus and I have both now signed (*only a control that reaches a named assertion
proves that assertion is load-bearing*), a pin that has never been red is a claim about nothing.
Restored the old filled-in example, kept everything else, re-ran:

```
AssertionError: no name: expected [ { …(3) } ] to deeply equal []
Tests  1 failed | 24 passed (25)
```

Red **on the address assertion**, not on `isError`, and **labelled with which of the three branches
produced it** — the labels are in the test for exactly this reason. Twenty-four green alongside it,
so the pin is specific to this defect rather than a tripwire that fires on any change to the file.
Production copy restored after the control; `git status` checked before committing, not after.

## 5. The one thing this costs — server comparability for the pending distance arm

This is a production change to `recall.ts`, and the record's method for pooling live rounds is
`git diff <round> HEAD --stat -- packages/server packages/shared` coming back empty (see
`continuity-3-carried-context.md`, Round 60's verification block). **That check will no longer be
empty for any future round compared against Rounds 59–67.** Stating it here rather than letting a
future round discover it:

- **What changed:** one error string, plus a comment, in a branch that fires only on a **malformed**
  expand call — no name, or non-finite positions. No behaviour on any success path, no change to
  the edge marker, the renderer, the radius, the row cap, or the offer.
- **Why doing it before the arm is better than after.** The distance arm (arm 4) has not run; it is
  awaiting xian's spend call. The failure mode this removes is one that would show up *inside* that
  arm's data: a model that mis-addresses, follows the fabricated address, and produces an
  expand-shaped call at a conversation that does not exist. That is an artifact in the primary DV.
  Fixing the instrument before the run is cheap; discovering it in five opus runs' worth of
  transcripts is not.
- **What it does not license:** re-pooling. Rounds 59–67 stand as measured, on the server they were
  measured on.

## 6. Verification

```
$ npx vitest run packages/server/src/__tests__/round56-recall-expand.test.ts
  25 passed (25)                     ← was 24 before this fire's test
$ npm test
  server  1402 passed (1402), 84 files    ← 1401 + this fire's one new test
  client   239 passed | 13 skipped        ← unchanged
$ npm run typecheck
  clean (shared, server, client)
```

Nothing here requests spend. Nothing here was spent.
