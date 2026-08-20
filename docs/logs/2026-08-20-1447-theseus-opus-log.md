# Theseus — 2026-08-20 WORK fire (14:47 PT), opus

## 14:47 — Briefing

Wrapper-synced worktree was current at `7d1813a`. `docs/COORDINATION.md` read. `docs/mail/` listed
— one memo addressed to me since my 10:47 START fire:
`daedalus-to-theseus-cc-xian-team-the-marking-is-inside-call-one-and-my-numbering-item-closes-with-no-edit-2026-08-20.md`
(commit `fb2b239`, 13:30). Read in full, acted on and replied in this same fire.

Note on my own method, since it nearly became a false report: an early `grep` for the two recall
caps came back showing `RECALL_MAX_CHARS` in `recall.ts` but **no** `RECALL_MAX_EXPAND_ROWS`, and
with line numbers that disagreed with both Daedalus's citations and my own 10:47 log. It looked
like a live discrepancy. It was my `| head -30` truncating the output. Re-grepped without the pipe:
`RECALL_MAX_EXPAND_ROWS = 30` at `:647`, the break at `:764`, exactly as cited. **The tool's
answer and the tool's *whole* answer are different things** — worth the same suspicion I apply to
recalled facts.

## 14:50 — The question worth spending the fire on

Daedalus's memo answers the validity question hanging over my proposed distance arm: is the
restriction reachable inside expand call 1, or could a cap truncate before it and make "the agent
stopped early" indistinguishable from "the tool stopped early". His answer is yes-reachable,
`+15 < 30`, and he re-derived my geometry independently to get there.

Both derivations are honest and were built separately. But they share one input: **`offeredStart =
2L + 4`**. That is not the probe's number — the probe seeds rows, it does not decide where an offer
begins. It comes out of the *search* path (`renderExcerpt`'s trailing edge marker, off a match at
`2L+1` with `RECALL_NEIGHBOUR_RADIUS = 2`). Both of us read it from `recall.ts` and reasoned
forward. Neither of us ran it. Two derivations sharing an unrun input are, on that step, one
derivation.

So: assemble the geometry with the code rather than with algebra.

## 15:05 — Item 10, and what it produced

`round56-recall-expand.test.ts` item 10 (+3 tests): seed the arm's exact 80-row `evictedMarking`
layout, run the real `recallFromOtherConversations`, follow the real offer into
`expandConversationRange`. No ordinal asserted that the code was not made to produce.

| claim | derived | produced |
|---|---|---|
| offers | 1–38 / 44–80 | **1–38 / 44–80** |
| call 1 page | 44–73 | **44–73** |
| restriction row 59 | offset +15 | **on call 1's page, text present** |
| call 1 chars | ~2,608 est. | **< 12,000**, no line truncated |
| calls to read whole | 2 | **2**, tiling 44–73 / 74–80 |

Daedalus's arithmetic survives contact with the render.

## 15:15 — Everything passed first run, so both controls were forced

**Control A — `GAP = 16`** (marking at +31). Two red, 22 green: call 1's page (44–73) lacks the
restriction, call 2's (74–80) has it.

**This caught a defect in my own test.** The ordinal comparison (`markRow ≤ offeredStart + 29`) sat
*above* the page assertion, so it went red first and aborted the test — leaving
`expect(first.text).toContain(RESTRICTION)`, the observation that actually matters, unexecuted and
unproven. An arithmetic restatement of the algebra was standing in front of the empirical claim and
passing for it. Reordered; re-ran the control; now the `toContain` is what goes red.

Same shape as Round 66 §2's fixture gate, one week apart. Generalisation worth keeping:
**assertion order decides which assertions ever get a chance to fail**, and reading a test will not
show you which of its claims have never been exercised.

**Control B — `OFFERED_START = 2L + 5`.** Three red, and the middle one is the result:

```
AssertionError: expected { from: 44, to: 73 } to deeply equal { from: 45, to: 74 }
```

The code produced **44** against a constant demanding 45. The shared step is now made rather than
read.

## 15:25 — The same control applied to Daedalus's item 8, rather than warned about

My memo draft said "if your item 8 has a precondition ahead of the page assertion, the same shadow
exists." Conditional claims are the thing this project's rules exist to prevent, so I ran it:
blunted the guard to `used + block.length > RECALL_MAX_CHARS`, exactly as he did, and ran his two
tests.

```
× returns the full row cap even when the block is three times the char cap
    TypeError: Cannot read properties of undefined (reading 'ordinal')
× is not truncating inside the lines either
    TypeError: Cannot read properties of undefined (reading 'ordinal')
```

**Both go red by crashing inside `recall.ts`, not by failing any assertion of his.** Guard removed
⇒ `kept` empty ⇒ `shownRows` 0 ⇒ `shown[0].ordinal` (`recall.ts:775`) throws before any `expect`
past `isError` runs. His `shownCount`, `shownRange`, `toContain('turn 30')` and
`not.toContain('turn 31')` were never executed under his own control.

What his control does establish is untouched — the other 19 green proves nothing else in the suite
covered that line, which is the claim he made for it. What it does not establish is that his new
assertions bind. Reported to him; **not fixed by me**, because the repair has two shapes (assert on
something that survives the blunting, or blunt something that degrades instead of crashing) and the
choice is his.

**Separately, and not a live bug:** `shown[0].ordinal` is unguarded against an empty `kept`. It
cannot fire today — the `used > 0` carve-out keeps the first block, which is his §3 point and it
holds. The note is that the guard is load-bearing for *two* reasons and only one is documented.

`recall.ts` reverted immediately after the control; `git status` confirmed unmodified before any
commit.

## 15:30 — Cost and position

**Zero API calls, zero live runs, no server started.** Nothing requests spend.

The distance arm's validity is now closed on all three grounds — arithmetic available, primary DV
clean, geometry confirmed against the render. **The cost question is the only one left and it is
xian's:** 80 rows, five new `FILLER_LEAD` pairs, five opus runs. I have added nothing to the case
*for* running it; I have removed the last reason to hesitate on validity grounds.

Item 10 earns its keep regardless of that decision: the arm's geometry is regression-tested, so a
move in `RECALL_NEIGHBOUR_RADIUS`, the edge-marker arithmetic or the row cap goes red and names the
offset that changed, instead of a future round paying five runs to discover it live.

I also accept Daedalus's §4 close on `"your own turns"` — exhaustive by construction, and his
reopening trigger is a condition rather than an instinct. And his correction on reachability:
`recall.ts` passes only `excludeChannelId` with no `types` filter, so recall does address klatches.
I should have checked that before arguing about it.

## 15:35 — Wrap verification

Per CLAUDE.md Session Wrap Protocol. **Read from `origin/main` after the push, not from the
worktree.**

**Suite (run in full, twice — before and after the `recall.ts` revert):**
`npm test` server **1401/1401 (84 files)** — +3 against Daedalus's 1398, matching my three new
tests exactly. Client **233 passed / 13 skipped**, unchanged. `npm run typecheck` clean, no output.

**Step 1 — `git log origin/main --oneline`:**

```
4cefa89 test(recall): item 10 — the distance arm's geometry, produced by the search path rather than derived
34bf6be mail: reply to Daedalus — offeredStart ran end-to-end, and his item 8 control never reached its assertions
```

Both present on `origin/main`. Mail committed separately and pushed to `main` ahead of the work
commit, per the worktree mail discipline.

**Step 2 — deliverables, verified in the pushed tree.** `git fetch origin` then
`git ls-tree -r origin/main --name-only`, filtered:

```
docs/mail/theseus-to-daedalus-cc-xian-team-your-reachability-answer-holds-but-it-rested-on-a-number-neither-of-us-ran-2026-08-20.md
docs/research/round67-distance-arm-validity-end-to-end-2026-08-20.md
```

Both present. `packages/server/src/__tests__/round56-recall-expand.test.ts` is a modification,
carried in `4cefa89`'s diffstat. This log and `docs/COORDINATION.md` were **not** in that listing
when it was run — they are pushed in the commit below, and re-verified after it.

`ls -d .testdata` → **No such file or directory.** No scratch corpus, no server started this fire.
The one file I mutated outside my own work (`recall.ts`, for the control on Daedalus's item 8) was
reverted and confirmed absent from `git status` **before** the first commit, not after.

**Step 3 — this log and `docs/COORDINATION.md` are committed and pushed last, as the final record.**

**Nothing is claimed as delivered.** Delivery is the wrapper's and it logs the outcome.
