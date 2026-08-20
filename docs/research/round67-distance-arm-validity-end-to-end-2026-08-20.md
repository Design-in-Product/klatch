# Round 67 — the distance arm's validity, checked against the render instead of the algebra

**Author:** Theseus · **Date:** 2026-08-20 (WORK fire) · **Cost:** zero API calls, zero live runs,
no server started.
**Changed:** `packages/server/src/__tests__/round56-recall-expand.test.ts` — item 10, +3 tests.
**Verified:** `npm test` server **1401/1401 (84 files)**, +3 matching the three new tests exactly
against Daedalus's 1398; client **233 passed / 13 skipped**, unchanged. `npm run typecheck` clean.

---

## 1. What was already settled, and the one step it rested on

The proposed distance arm (`F=17, L=20, G=8`) hides a restriction 15 rows past the point where
a search hands over an address, and measures whether an agent reads far enough to hold it. The arm
is only worth running if a **cap cannot truncate the first expand call before that row** — otherwise
"the agent stopped early" and "the tool stopped early" are the same observation, and the headline
result is uninterpretable.

Two derivations now say it cannot:

- Round 66 §5 (mine) derived `markOffset = 2G − 1` and the eviction bound `G ≤ F − 9`.
- `scripts/verify-expand-reachability.mjs` (Daedalus, this morning) re-derived the row algebra
  from the probe's `put()` order and reached the same numbers, plus `+15 < 30`.

Both are honest, and they were built independently. But they share a starting point:

```
offeredStart = 2L + 4
```

**That is not the probe's number.** The probe seeds rows; it does not decide where an offer begins.
`offeredStart` is produced by the *search* path — `renderExcerpt`'s trailing edge marker, computed
off a match at `2L+1` with `RECALL_NEIGHBOUR_RADIUS = 2`. Both derivations read that value out of
`recall.ts` and then reasoned from it. Neither ran it.

If the offer the tool actually hands over were one row off, every offset above shifts with it, and
two agreeing derivations would agree on the wrong number. Round 53's rule: two readings of one
source are one reading.

## 2. The check — assemble the geometry with the code, not with arithmetic

Item 10 of `round56-recall-expand.test.ts` seeds the arm's exact corpus in the `evictedMarking`
layout (80 rows: 20 lead pairs, the handover at 41, 8 gap pairs, the restriction at 59, 9 tail
pairs, the restate pair), runs the real `recallFromOtherConversations`, and follows the real offer
into `expandConversationRange`. No ordinal in the assertions is one the code was not made to
produce.

| claim | derived | produced by the code |
|---|---|---|
| offer (leading) | 1–38 | **1–38** |
| offer (trailing) | 44–80 | **44–80** |
| call 1 page | 44–73 | **44–73** |
| restriction row | 59 → offset **+15** | on call 1's page, **text present** |
| call 1 chars | ~2,608 (est. by line formatter) | **< 12,000**, no line truncated |
| calls to read whole | 2 | **2**, tiling 44–73 / 74–80 |

Three preconditions are asserted rather than assumed, because each one silently voids the arm:

1. **The restriction is not on the search page.** If it were, the arm's DV would be visible without
   expanding and the experiment measures nothing.
2. **The offer is wider than one call** — the task difference from N1, pre-registered here rather
   than discovered in a run.
3. **The restriction is on call 1's page and only call 1's.** The second call is not a second
   chance at the DV.

## 3. Both controls were run, and the first one changed the test

Every assertion passed on the first execution. That is the state in which a test is least
trustworthy, so both failure modes were forced on a scratch copy.

**Control A — `GAP = 16`** (marking at offset +31, past the 30-row page). Two tests red, the other
22 green: call 1's page (44–73) did not contain the restriction, and call 2's page (74–80) did.
The suite discriminates the exact failure the arm's validity depends on.

**This control found a defect in my own test.** On the first pass the ordinal comparison
(`markRow ≤ offeredStart + 29`) sat *above* the page assertion, so it went red first and aborted
the test — leaving `expect(first.text).toContain(RESTRICTION)`, the observation that actually
matters, unexecuted and unproven. An arithmetic restatement of the algebra was standing in front of
the empirical claim. Reordered so the rendered text fails first; re-ran the control, and it is now
the `toContain` that goes red. Same failure as Round 66 §2's fixture gate, one week apart: **an
assertion can only be trusted once something has made it fail**, and ordering decides which
assertions ever get the chance.

### 3a. The same shadow, verified on Daedalus's item 8

Rather than warn about the pattern in the abstract, I ran his control myself — guard blunted to
`used + block.length > RECALL_MAX_CHARS`, his two tests only:

```
× returns the full row cap even when the block is three times the char cap
    TypeError: Cannot read properties of undefined (reading 'ordinal')
× is not truncating inside the lines either
    TypeError: Cannot read properties of undefined (reading 'ordinal')
```

Both go red by **crashing inside `recall.ts`**, not by failing any assertion. With the guard
removed `kept` is empty, so `shownRows` is 0 and `shown[0].ordinal` (`recall.ts:775`) throws before
any `expect` past `isError` runs. His `shownCount`, `shownRange` and page assertions were never
executed under his own control.

His stated claim survives — the other 19 green does prove nothing else covered that line. What is
not established is that the new assertions bind. A test that dies inside the code under test is red
for a reason unrelated to what it asserts.

Reported to him; not fixed here, because the repair has two shapes (assert on something that
survives the blunting, or blunt something that degrades instead of crashing) and the choice is his.

**Noted separately:** `shown[0].ordinal` is unguarded against an empty `kept`. It cannot fire today
— the `used > 0` carve-out keeps the first block, which is exactly Daedalus's §3 point and it
holds. Not a live bug. But the guard turns out to be load-bearing for two reasons and only one is
documented: it keeps the page honest, *and* it is the only thing between that line and a TypeError.
`recall.ts` reverted immediately; `git status` clean.

**Control B — `OFFERED_START = 2L + 5`.** Three tests red, and the middle one is the result:

```
AssertionError: expected { from: 44, to: 73 } to deeply equal { from: 45, to: 74 }
```

The code produced **44** against a constant asserting 45. `offeredStart = 2L + 4` is now *made* by
the search path rather than read out of it — the step both derivations shared and neither tested.

## 4. What this does and does not license

**Does:** removes the last validity question hanging over the distance arm. The primary DV is
clean, the two-call read is a real but non-confounding task difference, and the geometry survives
contact with the code that renders it. Three agreeing accounts now exist, and exactly one of them
is empirical.

**Does not:** license the arm. It still costs five opus runs, five new `FILLER_LEAD` pairs and an
80-row seed, and the case *for* running it is unchanged from Round 66 §5. **xian's call.** Nothing
here requests spend; nothing here was spent.

A cheaper thing this buys regardless of that decision: the arm's geometry is now regression-tested.
If `RECALL_NEIGHBOUR_RADIUS`, the edge-marker arithmetic or the row cap ever moves, item 10 goes
red and names the offset that changed — instead of a future round discovering it in a live run at
five runs' cost.

## 5. Order, as I have it

1. ~~cleanup fix~~ · 2. ~~fifth filler constraint~~ · 3. ~~swap, cancelled~~
4. **The distance arm** — arithmetic available, primary DV clean, corpus texture unchanged from N1,
   **geometry now confirmed end-to-end against the render.** Still xian's call.
5. ~~`"your own turns"` wording~~ — closed by Daedalus, no edit, and I agree with the close:
   `entityTranscriptWhere` admits two kinds of row and `formatTranscriptLine` prints two labels, so
   the enumeration is exhaustive by construction. His reopening trigger is the right shape — a
   condition, not an instinct.
