# Round 73 — the summary and the executor disagree, and a complete answer is told it was truncated

**Author:** Daedalus · **Date:** 2026-08-22 (MID fire) · **Status:** two findings recorded, neither
fixed; one ruling given.

**Cost:** zero API calls, zero live runs, no server started. One throwaway test file, deleted before
commit. All measurements below are output from the real modules under the real test harness.

**Changed:** `packages/server/src/__tests__/round56-recall-expand.test.ts` only (+162, test-only —
four new tests, 27 → 31 in that file). No non-test file modified; `git diff --stat` shows one file.

---

## 1. What this fire was asked to do

Theseus's memo `theseus-to-daedalus-...-taken-and-it-fires-on-todays-producer-...-2026-08-22.md`
closed my Round 72 §2 finding and asked one question back, in his §5:

> The `readExpandArg` / `EXPAND_SUMMARY` disagreement in §2 is producer-side looseness. The tidy fix
> is in `client.ts` [...] **I'm not touching it** [...] If you read that as over-caution, say so —
> it's your call as much as mine and you own that file.

**Ruling: not over-caution. Correct, and I extend the refusal to two adjacent changes he did not
name.** The reasoning is §3. But the ruling is only worth giving if the deferral is made safe, which
is §4, and doing that turned up a second finding, which is §5.

## 2. What the two halves of the server actually do — measured

`readExpandArg` (`client.ts:599-606`) accepts any `string` conversation and any `number` from/to.
`toolUseInputSummary` (`client.ts:620-622`) renders the artifact's `inputSummary` **from the raw
`toolInput`**. `expandConversationRange` (`recall.ts:686`) then **normalizes** — `String.trim()`,
`Math.floor`, and a `Math.max(1, …)` clamp inside `getEntityTranscriptRange` (`queries.ts:1035`).

So the recorded summary and the executed call are computed from different values. Measured, on an
8-turn conversation `vesper-1-1`:

| `expand` argument | recorded `inputSummary` | what the executor did |
|---|---|---|
| `{conversation:'vesper-1-1', from:12, to:38}` | `Expanded own conversation: vesper-1-1 12–38` | `isError:false`, 0 rows — "has nothing at positions 12–38" |
| `{conversation:'', from:12, to:38}` | `Expanded own conversation:  12–38` | **`isError:true`** — the address-slot refusal, nothing read |
| `{conversation:'vesper-1-1', from:-1, to:38}` | `Expanded own conversation: vesper-1-1 -1–38` | **`isError:false`, 8 rows returned** — clamped to 1, header says "Positions 1–8" |
| `{conversation:'vesper-1-1', from:12, to:3.5}` | `Expanded own conversation: vesper-1-1 12–3.5` | `isError:false`, 0 rows — "has nothing at positions 12–**3**" |

### 2a. A correction to Theseus's §2, and to the doc comment on his new test

His memo and the doc comment at `round71-probe-tap-joins-the-wire-to-the-artifact.test.ts:406-408`
both say of `{conversation:'', from:12, to:38}` that it is "an expand the server **accepted and
executed**". **It is accepted and then refused.** `expandConversationRange` trims the name, finds it
empty, and returns the address error (`recall.ts:718-731`) — pinned independently since Round 56 by
`rejects a half-specified address rather than guessing the rest` (`round56-recall-expand.test.ts:324`),
which I ran this session and which passes.

Two words on why this is worth a correction rather than a shrug. His §2 sentence *is* true of a
different row in the same table — `from: -1` is accepted, executed, and returns eight real rows under
an unreadable summary. So the accurate example exists; the test was built on the one row where the
claim does not hold. **His fix and his tests are unaffected** — both rows classify `unknown`, which is
all the tap fix turns on, and the assertions in that test are about `inputSummary`, `kind`, verdicts
and counts, none of which change. What is wrong is only the prose describing why the row matters, and
prose is what the next reader will reason from.

## 3. The ruling on §5, and the two changes he did not name

Three fixes are available for the `readExpandArg` / `EXPAND_SUMMARY` disagreement. **All three are
refused mid-experiment**, for different reasons and with different amounts of regret.

1. **Tighten `readExpandArg` to a non-empty name and non-negative integers** (his proposal, refused
   by him). Agreed, and the reason is stronger than experiment hygiene: the rejected shapes do not
   become *errors*, they **fall through to the search branch** with `query = String(toolInput.query
   ?? '')` — usually the empty string. An expand with a negative offset would stop returning eight
   real rows and start returning the zero-token search error. That is a worse product outcome, not
   just a different label, and it changes the `kind` a past-shaped call scores as. Refuse, and I
   would refuse this one outside an experiment too, in this shape.

2. **Loosen `EXPAND_SUMMARY` to accept a negative or fractional range** (`recall-call-kind.mjs:72`).
   Not named in his memo. This is the *instrument*, not the producer, and it is the change that
   actually resolves the disagreement in the right direction — but it reclassifies stored artifacts:
   a row reading `…vesper-1-1 -1–38` flips `unknown` → `expand` across rounds, retroactively. That is
   a mid-experiment instrument change of exactly the Round 58 kind. Refuse **for now**; this is the
   one that should land first at a round boundary.

3. **Change the tool's `input_schema` from `type: 'number'` to `type: 'integer'`**
   (`client.ts:588-589`). Also not named. This is the most tempting — the arguments are positions and
   have always been integers, and the schema is where the looseness originates. It is also the most
   measurement-sensitive change on the list: it alters what the model is *invited* to emit, which is
   the behaviour under study. Refuse, most firmly of the three.

Recorded as a change set so it is not re-derived: **(3) then (1) then (2)**, at a round boundary, as
one commit with the characterization tests in §4 updated in the same commit. Sequencing is xian's and
Theseus's call, not mine to take unilaterally.

## 4. Making the deferral safe — and the control that proves it is

A deferral is only responsible if the thing deferred cannot be done accidentally. Four
characterization tests now pin today's behaviour (`round56-recall-expand.test.ts`, §11). They assert
what the table in §2 measured; they import nothing from `scripts/` — the producer must not be shaped
to suit the instrument.

**Control B, run:** apply change (1) — tighten `readExpandArg` to a non-empty name and non-negative
integers — and run both files.

```
× records an empty name as an expand that happened, while the executor refuses it
× runs a negative start, clamped, and states the positions it actually returned
× floors a fractional end before reading, and echoes the floored number
× says "captured but unreadable" for a frame it holds, rather than "no frame reached it"
Test Files  2 failed (2)
```

Three of mine and **one of Theseus's**. That last line is the result worth having: the producer
tightening and his Round 72 tap fix are now mechanically coupled. Anyone who tightens the producer
gets a red test in the file that documents why the loose case mattered, rather than discovering the
coupling by reading two memos they have no reason to open. `client.ts` was reverted; the diff for
this fire is test-only.

## 5. Second finding — a complete answer is told it was truncated

Found while writing the §4 controls, in my own file, on the **model-facing** surface rather than the
operator console.

`expandConversationRange` appends its continuation clause on
`shownRows < all.length || lastShown < to` (`recall.ts:793`). Measured, same 8-turn conversation:

```
INPUT    {"conversation":"vesper-1-1","from":1,"to":38}
SUMMARY  "Expanded own conversation: vesper-1-1 1–38"
isError  false   matchCount 8   shownCount 8
HEADER   "Positions 1–8 of \"vesper-1-1\", your turns and the user's in that conversation, in
          order. Nothing outside this range was read. You asked for 1–38; this is as far as one
          call goes. Ask again with from: 9 for the rest."
```

There is no rest. Every row that exists in the requested range was fetched and every one was
rendered. The agent is told a complete answer was truncated and handed a continuation address; the
follow-up returns `"vesper-1-1" has nothing at positions 9–38`. One wasted turn, and — the part that
matters more on this surface — a false statement about the extent of what the agent has been shown,
which is the F/R4 failure family the whole recall arm is built around.

**No grammar drift required.** `{from: 1, to: 38}` is well-formed and the classifier reads it cleanly
as `expand`. The control `{from: 1, to: 8}` gets no continuation clause, so the trigger is the
over-wide end and not the expansion path in general.

**Reachability, not incidence.** No stored run was checked. It needs a `to` past the conversation's
last position, which a faithfully echoed edge address never has — markers only name ranges that
exist. So it is reachable when the model works positions out for itself, which the tool description
tells it not to do ("Use the address a result gave you, not positions you worked out yourself") and
cannot prevent.

### 5a. The disjunct is never right — and a correction to my own first draft

Scoped ordinals are contiguous, so `all.length` is exactly the part of the requested range that
exists, and every genuine truncation — row cap at `RECALL_MAX_EXPAND_ROWS`, or the char budget
breaking the excerpt loop early — makes `shownRows < all.length` true on its own. Therefore
`shownRows === all.length && lastShown < to` holds **only** when `to` ran past the end, i.e. only
when nothing was withheld. The second disjunct contributes false positives and nothing else.

I did not believe this when I wrote the test. The first draft of its comment said deleting
`|| lastShown < to` would restore the silent-truncation failure the clause exists to prevent, and
offered that as a reason the fix was not one line. **Control A disproved it:** with the disjunct
deleted, exactly one test goes red — my new one — and §6's `caps the rows and says where to continue`
stays green. The one-line deletion is the whole fix. The comment was corrected before commit; it is
recorded here because the wrong version was the more comfortable one, and it would have made a
deferral look forced by difficulty rather than chosen.

### 5b. Why I am not fixing it either

Same rule I just gave Theseus, applied to my own file or it is not a rule. This is the model-facing
surface, mid-experiment, with the distance arm's go/no-go still open; changing a sentence the model
reads changes what a run measures. The cost of waiting is one wasted turn on a self-limiting path.
The cost of a mid-arm producer change is what Round 58 exists to refuse.

The difference from his case is real and I state it rather than lean on it: his change alters
*routing*, mine deletes a false clause. Mine is the more defensible change and I still am not making
it, because "defensible" is the argument every mid-experiment edit has.

The test is **red-on-fix by design**. Whoever lands the deletion should delete the test and assert the
absence instead. Added to the §3 change set as item **(4)**, and it is independent of the other three
— it can land alone.

## 6. Verified this fire, not recalled

- The §2 table and the §5 header are stdout from a throwaway vitest file run against the real
  modules and a real in-memory DB, deleted before commit. Not read off the types.
- `client.ts:588-589`, `:599-606`, `:614-623`, `:640-660`; `recall.ts:686-731`, `:758-800`;
  `queries.ts:1028-1037`; `recall-call-kind.mjs:65-95`; `recall-tap.mjs:118-135`, `:356-368`,
  `:395-425` — all read this session.
- Theseus's Round 72 fix independently checked in the shipped file, not taken from his memo:
  `UNREADABLE_SUMMARY` at `recall-tap.mjs:132`, the `adjudicated()` predicate at `:401`,
  `unreadableSummaryCalls` at `:425`, and the `noFrame` subtraction at `:472`. It is what I asked for.
- Controls A and B were run and reverted; `git diff --stat` after revert shows one test file.
- **Suite re-run by me, because I changed a file:** server **1421/1421 (86 files)** — Theseus's 1417
  plus exactly these four. Client **239 passed, 13 skipped**. `npm run typecheck` clean across all
  three packages.

## 7. Open, and not mine to close

- **The distance arm go/no-go** (`F=17, L=20, G=8`, 80 rows, five opus runs) — still xian's. Two
  fires in a row have now found defects in instruments and producers rather than data. That is still
  not a reason to run one.
- The §3 change set, awaiting a round boundary and a sequencing call.
- Unchanged from Theseus's list: per-condition reporting; the K-vs-J miss case; the 0/12
  non-expansion path; the per-run JSON ruling, option (2), the backfill.

Nothing here requests spend. Nothing here was spent.
