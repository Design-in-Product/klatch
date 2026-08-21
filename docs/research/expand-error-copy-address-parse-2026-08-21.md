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

---

## 7. Addendum, 2026-08-21 MID fire — two corrections from Theseus, both adopted

Theseus verified §§1–5 above from his own sandbox (reproducing the control byte-for-byte) and
returned two corrections. Write-up of his side:
`docs/research/round68-error-copy-fix-verified-and-the-quieter-failure-2026-08-21.md`.

### 7.1 The fix moves the artifact; it does not remove it

§5 above argued the fix was worth doing before the distance arm because a mis-addressed call would
otherwise land in the arm's primary DV as an expand at a conversation that does not exist. That
holds. What does not hold is §4's claim that the *new* copy, followed literally, fails the same way:

`readExpandArg` requires `from`/`to` to be **numbers**. `from: <first position>` has no digits —
the same property that makes the slot copy unparseable as an address — so a caller filling a tool
call from it emits strings, the expand argument is dropped whole, and `executeTool` routes to
`recallFromOtherConversations`. `expandConversationRange` is never reached.

| followed literally | recorded as | reply |
|---|---|---|
| old, filled-in | `Expanded own conversation: design-review 12–38` | `candidates.length === 0` — names the address problem again |
| new, slots | `Searched own conversations: ` | zero-token search error — never mentions addresses |

`createToolUseArtifact` persists `toolUseInputSummary`'s string and nothing else, so that row *is*
the DV. **The artifact moves from the expand column to the search column** — quieter for the model,
quieter for the scorer. Better on net (a followable address is worse than a confusing error, and
slots make the path rarer), but "removed" was overclaiming. The detector is the empty tail:
`Searched own conversations: ` with nothing after the colon. **Theseus's surface, not this doc's.**

Pinned by his test, `records a slot-shaped expand as a search, because the arg never survives
typing` — which also put the first assertion of any kind on `toolUseInputSummary`, an exported
function whose return value is the only persisted record of a recall call.

### 7.2 The family test's claim is about provenance, not emptiness

`offers no address from any error return` generalises over the three *branches* and fixes exactly
one point on the *input* axis. Two of those branches interpolate a caller-supplied name, so:

```
conversation: '{conversation: "design-review", from: 12, to: 38}'
→ isError: true, and addresses(text) parses one clean address back out
```

The outer quoting is what makes the inner address clean. **Not a bug, and the copy is unchanged.**
The property recall's design rests on is *provenance*: the harm is an address that came from
nowhere, pointing at a conversation that does not exist. An address-shaped name the caller typed one
call ago is not from nowhere — following it reproduces the error the caller already has. And the
remedy has a cost of its own: an error whose job is to make the model retype a name exactly is the
worst available place to alter that name.

So `addresses(text) === []` was a **proxy**, exact only for non-address-shaped inputs — which is the
only input the family test feeds it. What landed:

- Title narrowed to `offers no address **of its own** from any error return, including the one about
  addresses`. `recall.ts`'s comment reference updated **in the same commit** (Round 61 §4's trap).
- New test `reflects a caller's own address-shaped name back without inventing a second one`, over
  both interpolating branches, asserting **subset, not emptiness**: every address in the reply must
  be one the caller supplied. Stays green if an escape lands later (zero addresses is a subset of
  anything); goes red the moment a branch names a conversation of its own.
- Theseus's test's opening comment said "the test above" — de-positioned to name the family test,
  since a test was inserted between them.

**Wrong-reason green, caught before it was claimed.** A subset assertion over a possibly-empty set
passes vacuously. Rather than take §7.2's premise from the memo, a temporary
`expect(addresses(result.text).length, label).toBeGreaterThan(0)` was run on both cases — green, so
the reflection does parse today and the subset assertion has something to constrain. Line removed
before commit.

**Control**, a fabricated address restored to the `=== 0` branch:

```
× offers no address of its own from any error return, including the one about addresses
× reflects a caller's own address-shaped name back without inventing a second one
```

Both red; **nothing else in the file noticed**. Family test catches it on the branch axis, the new
one on the provenance axis, neither is a file-wide tripwire. Production reverted;
`git diff origin/main -- packages/server/src/claude/recall.ts` shows comment lines only.

### 7.3 Verification (MID fire)

```
$ npx vitest run packages/server/src/__tests__/round56-recall-expand.test.ts
  27 passed (27)                     ← 25 + Theseus's one + this fire's one
$ npm test
  server  1404 passed (1404), 84 files
  client   239 passed | 13 skipped   ← unchanged
$ npm run typecheck
  clean (shared, server, client)
```

**Unchanged and still xian's:** the distance arm go/no-go — `F=17, L=20, G=8`, 80 rows, five opus
runs. Nothing in this addendum adds to the case for spending it; correcting an instrument, and
correcting a claim about an instrument, are not arguments for running one.

Nothing here requests spend. Nothing here was spent.
