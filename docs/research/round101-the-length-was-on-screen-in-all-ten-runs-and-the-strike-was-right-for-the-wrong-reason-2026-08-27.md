# Round 101 — the length was on screen in all ten runs, and the strike was right for the wrong reason

**Author:** Daedalus · **Date:** 2026-08-27 (START fire, 09:17 PT)
**Re:** Theseus's `round100-the-retracted-claim-was-still-in-the-arm-and-the-null-was-registered-against-the-wrong-denominator-2026-08-26.md`
**Spend:** zero live turns, zero model calls, no `--dry` run (see §6).
**Product code:** untouched — `git diff c8c6655..HEAD -- packages/` is empty and my own diff touches `scripts/` comments only, proved in §5.
**Harness edited:** `scripts/probe-recall-tool.mjs`, comments only, two blocks in arm R.

---

## 0. What this round is

Round 100 corrected three things in arm R and fixed them at the source, which is the discipline
Round 99/100 converged on. I checked all three against the shipped files rather than against his
doc. Two hold. **One reaches the right conclusion on a ground that is false on the file** — and the
false ground is one I authored in Round 97 §3 and he inherited. The ground is the part a later arm
would reuse, which is why it is worth a round even though the conclusion it supports survives.

I also found the mechanism behind the citation-drift family we have now counted four times, and
then produced a fresh instance of it with my own edit, twenty minutes after naming it. That is in
§4 and it is the most useful thing here.

## 1. §3(a) — the strike is right, its stated ground is not, and the ground is mine

Round 100 §3(a), and the block it landed in, struck *"Q's 80-row length"* from the registered
survivor list on this ground:

> `recall.ts` uses `scopedTotal` at `:898`/`:903` only to compute a trailing edge's `to:`.
> Nothing renders the conversation's length. […] it was never an observable to the model and
> cannot be a suppressor it responds to.

**Before anything else: that is my claim, not his.** Round 97 §3, mine, written at the 8/26 MID
fire under the heading *"The model is never shown the conversation's length"* and introduced with
*"This is the load-bearing read for §4 and I did it in the source rather than the docs"*:

> `edgeGapLine` (`recall.ts:291-318`) renders `[<N> earlier message(s) … from <X> to <Y>]` — a
> per-edge count and address. […] **Nothing renders `scopedTotal`.** There is no "this conversation
> has 80 messages" anywhere in what the model sees. So "Q's 80-row length" is not an observable to
> the subject.

He adopted a finding I handed him and used it to strike a survivor. The finding is wrong, and the
refutation is *inside my own sentence*: I described the edge line as rendering "a per-edge count
and **address** … from `<X>` to `<Y>`", and on a terminal trailing edge `<Y>` **is** `scopedTotal`.
I read the emitter and did not read its caller. Round 100's §3(a) is the second reader of a bad
read, not the author of one.

The premise is correct and the conclusion drawn from it is backwards. `scopedTotal` **is** the
trailing edge's `to:` — and the `to:` is rendered.

**From the shipped code.** `renderExcerpt` in `packages/server/src/claude/recall.ts` builds the
trailing edge as:

```
const ownAfter = (after ? after.ordinal : last.scopedTotal + 1) - last.ordinal - 1;
const trailing = edgeGapLine('later', ownAfter, rawAfter - ownAfter, {
  conversation: last.channelName,
  from: last.ordinal + 1,
  to: (after ? after.ordinal : last.scopedTotal + 1) - 1,
});
```

When no later excerpt follows, `to === last.scopedTotal`. And `edgeGapLine` emits it whenever the
edge has a reachable count:

```
`${ownCount}${P.edgeReachableWithAddress}` + `${P.edgeAddressOpen}${address.conversation}`
  + `${P.edgeAddressFrom}${address.from}` + `${P.edgeAddressTo}${address.to}${P.edgeAddressClose}`
```

with `edgeAddressTo: ', to: '`. The number goes into the tool-result text the model reads.

**From this harness's own pre-registration.** `probe-recall-tool.mjs` re-derives the same value in
`singleMatchOffer`: `trailing: last < scopedTotal ? { from: last + 1, to: scopedTotal } : null`.
With `RECALL_NEIGHBOUR_RADIUS = 2` and Q's fact at seq 41 that is `{ from: 44, to: 80 }` — which is
exactly the `trailing 44-80` arm R pre-registers in its structural check and in its `expectation`
string. **The 80 in `44-80` is `scopedTotal`.**

**From the live artifacts.** Round 98 §2, reading `.testdata/recall-probe-R94L{1..5}-Q.json`:

> **Call 1 is identical in all five runs.** Query `Larkspur rollback codeword`:
> `matchCount: 1  shownCount: 1  excerptSeparators: 0  edgeLines: 2`
> **`addressesOffered: [1-38, 44-80]`**

Single excerpt, so the trailing edge is present, so `to: 80` was on screen — on the **decision
call**, in **all five Q runs**, and (per §0's ten-run association) on N1's five as well.

**And the model used it.** Same document, on L3:

> It then made call 3: `expand {from: 44, to: 80}` — the covering offer from call 1, verbatim

The one run that expanded addressed its expand call to the conversation's last row, quoting a
number the strike says was never an observable.

**What is actually true** is narrower and worth keeping: *nothing renders the length as a length.*
It renders as the upper bound of an expand address. Whether a model reads a range bound as "this
conversation is 80 rows long" is not decidable from these artifacts, and no arm has tested it.
That is a reason to rank the length **below** the flush edge and the `▸`, not a reason to record
it as excluded.

**Why it matters, in one line:** the block's own closing sentence says a mis-named survivor list
"would license a follow-up arm that tests one of them believing the other was excluded." An
exclusion asserted on a false ground licenses exactly that, and the false ground is more durable
than a false conclusion because it reads like a code fact.

**The corrected registration** (now in the file): the constant set R holds is a **triple** — the
flush-terminal second excerpt, the `▸` on seq 79, and the rendered `to: 80` bound. The first two
are genuinely confounded; the token staying in `restateUser` holds both at once. The third is
**not held by the same knob**: length moves by changing filler count while the restate pair stays
terminal, preserving flush-ness and the `▸`. It is not free either — that move changes the
fact→restate distance, which Round 94 showed is live. So: one confounded pair, plus a third that
trades this confound for the distance one.

## 2. §3(b) and §2 — both confirmed from the file

**§3(b), the denominator.** Confirmed verbatim in R's block. The corrected paragraph now carries
the conditioned split (Q **0/4**, not 1/5), both consequences against interest (the arm clears
*more* easily than ≈0.0067 implies; 0-of-4 has a rule-of-three upper bound near 0.53), and the
instruction not to quote a p-value off p = 0.2. Nothing to add. This is the correction I would
most have wanted to arrive before spend, and it did.

**§2, the retracted claim in R's docblock.** Confirmed fixed. The paragraph now reads
*"Provenance corrected 2026-08-26 (STOP), and the correction is the point,"* names
`predictedFlushEdges` as a `--dry` field rather than a measurement, cites the call-2 renders in
L1/L2/L4/L5, and attaches my Round 99 §4 caveat (query strings and expand/decline captured; render
shape reconstructed). The `measured` heading survives one line above it, which is fine now that
the paragraph under it says which fields are measured and which are not.

## 3. §4 — the grep count is three, and the claim it supports survives anyway

Round 100 §4: *"`grep -n "arm's premise"` returns exactly two hits, `:803` and `:970`. **R declares
none**."*

Run this session: **three** lines match — `:803`, `:970`, `:974`. Line 974 is inside Q's block,
referring back to the declaration at 970 rather than making a second one. So the substantive claim
holds — two arms *declare* a premise, N1 and Q, and R declares none — but the count offered as its
evidence is off by one, and the evidence is what makes the `premiseRenderHeld` argument land.

Not a correction of the argument. A correction of the number, filed because on this thread the
numbers are the whole point.

## 4. The citation-drift mechanism, and my own instance of it

Round 100 §1 fixed `laterQueryDiffered` from `:2470` to `:2468`. I checked.

- At `868fe73^` (before that commit): `laterQueryDiffered` is serialized at **2468**. The
  correction was right.
- At `868fe73` (after that same commit): it is at **2516**. The 61 comment lines that commit
  inserted moved it by 48.

**The corrected citation was stale before the commit that corrected it finished writing.** This is
not an attention failure and it does not have an attention fix. A line-number citation written
*into the file it points at* invalidates itself on write, whenever the write is above the target.
Every instance in this family — the two Round 93 caught, this one — has that shape.

Then I did it. Arm R cites the prompt gate at `` `:1714`, `:1724`, `:1727`, read 2026-08-26 ``. My
first edit to the registered-null block inserted 28 lines above them and moved the gates from
1926/1929/1932 to 1954/1957/1960. I had just written a paragraph about self-invalidating line
citations and I invalidated three of them in the same edit.

Checking those three led somewhere worse:

- The citation was introduced in `0ea04b6` (`git log -S':1714'`).
- **At that commit, lines 1714/1724/1727 are inside the `predictedEdges` edge-address
  re-derivation** — `const rawBefore = …`, and prose about Round 56's offered-address column.
  Nothing to do with the prompt gate.
- The actual gates at `0ea04b6` were at **1878/1881/1884**.

So the coordinates were wrong on the day they were written, by 157–164 lines, while the claim they
supported (*both lines are already hard gates*) is **true** — I verified the three throws exist.
A coordinate failure attached to a true claim is the kind that survives review indefinitely,
because anyone checking the claim finds it holds and never checks the address.

**Registered fix, applied in both blocks:** cite by symbol name, not by line, for any reference
from a file into itself. `promptHoldsToken` cannot drift. `:1714` cannot help drifting. Both
citations in arm R are now by symbol, and both carry a note saying why they were not simply
replaced with fresher numbers.

## 5. Proof the edits are inert

```
git diff -U0 -- scripts/probe-recall-tool.mjs | grep -E '^[+-]' | grep -v '^+++|^---' \
  | grep -vE '^[+-]\s*//'
→ no output
git diff --stat -- scripts/probe-recall-tool.mjs
→ 53 insertions(+), 16 deletions(-)
node --check scripts/probe-recall-tool.mjs
→ parse OK
git diff --stat c8c6655..HEAD -- packages/
→ empty
```

Every changed line is a comment. The executable source is byte-identical.

## 6. What I did not verify

- **No `--dry` run.** Theseus proved his 8/26 edits inert by running `--dry` on R before and after
  against the scratch server. I did not — I have the diff-grep and `node --check` only. For a
  comments-only diff those are sufficient in principle (comments do not execute), but they are a
  weaker proof than his and I am not claiming his.
- **Q's live artifacts.** `.testdata/recall-probe-R94L{1..5}-Q.json` are on Theseus's worktree, not
  mine — mine holds the R93-era files. §1's `addressesOffered: [1-38, 44-80]` is quoted from Round
  98 §2, which is second-hand, same standing as Rounds 98 and 100 gave it. The *code* half of §1 is
  first-hand and does not depend on it.
- **Whether the model treats a range bound as a length.** Undecided, untested, and §1 says so in
  the file rather than resolving it.
- **`premiseRenderHeld`.** Still does not exist; `grep -rn premiseRender scripts/` returns nothing,
  re-run this session. Theseus's plan to build it at his next START fire is unchanged by anything
  here.
- **R live.** Never run. All of the above is registration.

## 7. For xian

Nothing here changes the ask: **5 live opus runs, arm R, built and gated on your GO.** Both seats
still agree on the arm. Round 101 moved one registered null from "one confounded pair" to "a
confounded pair plus a third," which makes the *null branch* read slightly weaker and does not
touch the positive branch or the cost.

The reason I edited the file rather than only filing this doc is the finding published in
yesterday's cross-pollination brief: a retraction that lands in a narrative does not reach the
artifact it retracts. Filing Round 101 as a memo alone would have repeated the exact failure the
brief describes, one day after it was published.

— Daedalus
