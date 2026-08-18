# Daedalus session log — 2026-08-17

Model: Opus 5 · Worktree: `/Users/xian/Development/klatch-worktrees/daedalus` · Branch: `claude/daedalus-cycle`

---

## 09:17 PT — START fire

Briefing run in full: `git log` (worktree at `1c65289`, synced by the wrapper), my
COORDINATION section (lines 107–110), `ls docs/mail/`,
`docs/briefs/cross-pollination/current.md`.

**One inbound memo addressed to me, actioned and replied in this fire. Not a
no-op.** This is my first fire of 8/17 — the three earlier 8/17 commits are
Argus's, Calliope's and Iris's, not mine (checked `%an` rather than inferred from
the subject lines, all three of which say "START").

`theseus-to-daedalus-cc-iris-xian-team-sonnet-on-k-ran-and-the-partial-disclosure-was-never-a-sonnet-property-2026-08-16.md`
plus `docs/research/round60-sonnet-on-k-live-2026-08-16.md` and
`scripts/exact-tests.mjs` (new).

### 1. Verification — and one check was arithmetic, not a re-run

```
$ git diff 2496f72 HEAD --stat -- packages/server packages/shared
(empty)                              ← Rounds 59 and 60 ran on the same server
$ node scripts/exact-tests.mjs --check
ok  p=0.0079  (doc says 0.0079)  Round 59, arm F
ok  p=0.2308  (doc says 0.23)    Round 57, F vs K
ok  p=0.1667  (doc says 0.1667)  Round 60, arm K
ok  stratified F+K: T=8/8 to opus, one-tailed 3.307e-4, two-tailed 6.614e-4
all published figures reproduced
```

**Re-running his script confirms his script runs; it does not confirm the
number.** So the stratified figure was re-derived by hand: observed T = 8 is the
maximum of the convolved distribution, so
`p(T=8) = [C(5,5)C(5,0)/C(10,5)] × [C(5,3)C(5,0)/C(10,3)] = (1/252)(1/12) = 1/3024
= 3.307e-4`, and T = 0 carries the identical probability, giving **6.614e-4**
two-tailed. Matches. Also checked the aggregate two-tailed criterion is not
over-including: T=1 has probability 1.65e-3 > pObs and is correctly excluded.

**His §4 confound read from source, not from the memo:** `FILLER[0]` is the canary
error-rate exchange (`scripts/probe-recall-tool.mjs:216`) and `:714` slices
`filler.slice(0, arm.gapPairs)` between `seedAck` and `markUser`. The confound is
real and the mechanism is where he says it is.

**Pard's `.testdata/` account checked against the repo rather than only his
memo:** `e011935` exists with the message *"archive: pre-migration memory pool,
all 27 files verbatim + provenance README"*, and
`docs/review/pre-migration-memory-pool/` holds 28 entries. Closed non-event, and
`find` for `*.db` in this worktree returned zero hits again this fire.

### 2. The design record — two corrections, and both are to claims I wrote yesterday

Appended a Round 60 section to `docs/plans/continuity-3-carried-context.md`
(previously ended at Round 59). Both corrections quote my original sentence rather
than editing the Round 59 section, so the record carries the claim *and* its
correction.

**Correction 1 — "opus took the address 5/5" is a fact about arm F, not about
opus.** 3/5 on K; 9/15 pooled across two fires. Same-arm K contrast is p = 0.1667,
which is nothing. The powered statement is the stratified one (p = 6.6 × 10⁻⁴):
**expand rate is a model property; the 5/5 was not.** Sonnet is 0/10 across both
arms, and on K it *searched again 4/5* after reading an address — which rules out
the reading Round 59 left open ("one excerpt looked sufficient").

**Correction 2 — "It volunteered a caveat 5/5", which I filed as a sonnet
behaviour, is a property of not expanding.** 12/12 of non-expanders produced it
including two opus runs; 8/8 of expanders surfaced the deep condition. 20/20
determination.

**And that makes my Round 59 §3 wrong in its reason and broader in its
consequence.** I wrote that the mixed-model klatch is the sharp case *because two
models read the same render differently*. The mechanism is actually that two seats
can differ in whether they expanded — reachable **inside a single model**, at
opus's own 2/5 non-expand rate on K. Mixing models raises the rate; it does not
create the failure. **A hazard I filed as a configuration-specific edge case is a
property of the default configuration.** That is a strictly worse finding than the
one I recorded and it is his.

### 3. What I contributed rather than relayed

**(a) His §3 does not inherit his §4.** Worth stating because the two findings
landed in one memo and a caveat propagates by proximity. §4's referential
ambiguity is a property of seq 5, which the 12 non-expanders **never read** — so
it cannot explain their non-expansion and cannot qualify their 0/12. It sits
strictly downstream of the expansion, qualifying how the 8 expanders *acted* on
the restriction (the `stated the codeword` column) and nothing about surfacing.
**So the 20/20 is clean.** Corollary pre-registered for him: the F-variant tests
whether expanders treat a clear restriction as binding, and will not move the
expand rate, because nothing about it is visible pre-decision.

**(b) His subrange datum is a demand estimate, not a supply bound.** He wrote that
because all three expansions were subranges, the cost of inlining is *"bounded by
what it would have pulled anyway."* That holds only for the 8/20 that expanded —
and the lever exists for the 12/20 that did not, so its cost is paid in full,
unoffset, in exactly the runs where it changes the outcome. Perfectly
anti-correlated with the offset. And for the expanders the arithmetic runs the
other way: `4–22` is **19 rows of the 37 offered**, so inlining the whole reachable
stretch costs ~**2×** what an expanding agent actually took. Kept, in a different
job: an **empirical ceiling on the threshold** (~19 rows, n=3, labelled weak).
First constraint on this lever that came from measurement rather than taste.

**(c) The lever is a retrieval change, and I priced it as a render change.** Read
the call chain this fire rather than inferring it from the marker work:

- `renderExcerpt` (`recall.ts:832`) receives the kept excerpts plus **one boundary
  row per side** — `EdgeReference = NeighbourhoodMessage | undefined` (`:814`).
- The reachable count is ordinal arithmetic: `ownBefore = first.ordinal -
  before.ordinal - 1` (`:846`; `:869` for the trailing side).
- **The gap rows were never fetched.** `getEntityTranscriptNeighbourhoods` (`:427`)
  returns hit neighbourhoods at `RECALL_NEIGHBOUR_RADIUS` and nothing else.

So "render those rows inline instead of offering an address" is not one branch in
`edgeGapLine`. It needs a second query or a widened first one, plus a decision
about `limit` / `RECALL_MAX_LIMIT` and about `RECALL_MAX_EXPAND_ROWS = 30`
(`:641`) becoming a second, differently-named budget for the same rows. Two budgets
for one thing is how `REACHABLE_R54` happened.

**The sonnet-on-K gate is released** — his fire released it — and the thing behind
the gate is bigger than I advertised. Still not recommended, now **for a reason
rather than a gate**, with the blocked-ness split honestly: per-turn ceiling is
derivable (n=3); aggregate cost needs a corpus we do not have.

### 4. Verification — run this fire, not recalled

```
$ npm test --workspace=@klatch/server
Test Files  82 passed (82)
     Tests  1378 passed (1378)

$ npm test            (client, in the full run)
Test Files  17 passed | 13 skipped (30)
     Tests  233 passed | 13 skipped (246)      exit 0

$ npm run typecheck   → clean ×3 (shared / server / client), exit 0
```

Server unchanged at 1378 — correct, since this fire touched no `packages/` file.
Client **230 → 233** is Iris's `tool_use` live card (`+3`), not mine; matches
Argus's 09:00 measurement independently. Put in the memo because Theseus's §7
correctly declined to derive the suite state himself.

### 5. What I deliberately did not do

**`probe-recall-tool.mjs:353`** — the comment still calls `gapPairs: 1` "the only
difference in the whole arm," which his own §4 shows is true of the diff and false
of what the agent reasons over. His file, cross-model comparison open, and
changing an instrument between arms is the confound this work has spent four
rounds removing. Flagged in the memo so it is not lost; not asked for now.

**The edge-line wording and the tool description's fourth clause** — unchanged for
the third fire running. The reason has narrowed (the wording hypothesis is two arms
old rather than one) but not gone: a more insistent expand clause still has a
documented failure direction, and the F-variant is a cleaner experiment than a
render change.

**Did not build the three-state schema.** It is his probe's schema, he adopted both
my (a) and (b) as specified, and he is deferring it mid-comparison with a stated
reason I agree with.

### 6. Mail

**Filed (1):**
`docs/mail/daedalus-to-theseus-cc-iris-xian-team-your-two-findings-do-not-interact-and-my-lever-was-the-wrong-shape-2026-08-17.md`

**Closed to `read/` (1):** his sonnet-on-K memo, fully answered by the reply above.
Its outbound counterpart (my 8/16 `klatch-case` memo) was already in `read/` —
closed by Theseus in `2c98153`, checked rather than assumed.

**Left open, correctly:** my new reply (live thread — his F-variant, the
per-condition schema and the miss case all outstanding and all his);
`iris-to-daedalus-import-confirm-scope-2026-08-09.md` (Iris re-verified this
morning that it is still parked on xian's review, unmoved); and
`iris-to-daedalus-cc-team-carried-context-visibility-decision-2026-08-13.md`
(parent thread).

### 7. Unchanged and still with xian

**Option (2)** and **backfill** (all 72 imports on `default-entity`). No movement
this fire, and not restated at length to Theseus, since restating reads as
progress.

## Wrap verification — START fire

Per CLAUDE.md Session Wrap Protocol. Blocks below filled in from the actual
commands after the commit, not before.

**Step 1 — commits present** (`git log --oneline -2`):

```
f5e3793 design record + mail: 8/17 START — Round 60 corrects two of my own claims, and the lever is a retrieval change
1c65289 log+coordination: 8/17 START — Iris's tool_use live card re-verified   ← pre-fire HEAD (Argus's)
```

**Step 2 — deliverable files exist** (`ls`, all four returned):

```
docs/plans/continuity-3-carried-context.md   (+165 lines, Round 60 section)
docs/mail/daedalus-to-theseus-cc-iris-xian-team-your-two-findings-do-not-interact-and-my-lever-was-the-wrong-shape-2026-08-17.md
docs/mail/read/theseus-to-daedalus-cc-iris-xian-team-sonnet-on-k-ran-and-the-partial-disclosure-was-never-a-sonnet-property-2026-08-16.md
docs/COORDINATION.md
```

`git status --short` clean apart from this log, committed in the follow-up below.

**Step 3 — delivery.** The wrapper owns delivery. I pushed to `origin/main` this
fire per the fire prompt's instruction, and verified against the **remote ref**
rather than the push command's own output:

```
$ git log origin/main --oneline -2
f5e3793 design record + mail: 8/17 START — Round 60 corrects two of my own claims, and the lever is a retrieval change
1c65289 log+coordination: 8/17 START — Iris's tool_use live card re-verified

$ git ls-tree --name-only origin/main docs/mail/ | grep "two-findings"
docs/mail/daedalus-to-theseus-cc-iris-xian-team-your-two-findings-do-not-interact-and-my-lever-was-the-wrong-shape-2026-08-17.md

$ git ls-tree --name-only origin/main docs/mail/ | grep -c "sonnet-on-k-ran"
0                                     ← no longer in the open inbox
$ git ls-tree --name-only origin/main docs/mail/read/ | grep -c "sonnet-on-k-ran"
1                                     ← and it is in read/

$ git show origin/main:docs/plans/continuity-3-carried-context.md | grep -c "^# Round 60"
1
```

The memo is on `main`, which is where Theseus will look — per the worktree mail
discipline he would not find it on `claude/daedalus-cycle`.

*(Written with the blocks empty and filled in after the push, so the hashes are the
ones that landed rather than the ones I expected. The design-record commit carries
the empty version; the follow-up commit carries these.)*

---

## 13:17 PT — WORK fire

Briefing run in full: `git log --format='%h %an'` (checked authors rather than
inferring from subject lines — the three commits above mine today are Theseus's
and Calliope's), my COORDINATION section, `ls docs/mail/`.

**One inbound memo, arrived 13:17 in `e4c45dc`. Read, actioned and replied in
this fire. Not a no-op — and it contained the first `packages/` work anyone has
handed me in four fires.**

`theseus-to-daedalus-cc-team-arm-l-ran-withholding-was-real-and-your-ceiling-does-not-survive-2026-08-17.md`
plus `docs/research/round61-unambiguous-referent-live-2026-08-17.md` (new, 254
lines) and arm L in the probe.

### 1. His §4 — verified at both ends before touching either site

```
$ git show b9a9fd2:scripts/probe-recall-tool.mjs | sed -n '1057,1061p'
  const REACHABLE_R54 = /(\d+) that a different search of yours could reach/;   ← line 1059 exactly
$ grep -n REACHABLE_R54 scripts/lib/recall-recogniser.mjs
60:  const REACHABLE_R54 = new RegExp('(\\d+)' + rx(P.edgeReachableNoAddress));
$ grep -rn "\.mjs:[0-9]" packages/
recall.ts:122 · round58-recall-marker-phrases.test.ts:12                        ← exactly the two he named
```

His account is exact, including his check that his own Round 58 refactor caused
it and this fire's edits did not.

**Fixed by deleting the line number, not updating it to `:60`.** Updating re-arms
the same trap at the next refactor, and the paragraph those numbers sit inside is
*about* references that go stale silently instead of failing loudly. Both sites
now cite symbol + module, each with a dated parenthetical recording what it used
to say and why it changed — the record carries the claim and its correction
rather than the correction replacing the claim.

### 2. The class, measured rather than asserted — and my own edit demonstrated it

```
$ grep -rn "recall.ts:[0-9]" docs/ | wc -l
30                              across 15 files
```

Five added comment lines shifted every citation past line 129 by **6**:

| symbol | was | now |
|---|---|---|
| `getEntityTranscriptNeighbourhoods` | 427 | 433 |
| `RECALL_MAX_EXPAND_ROWS = 30` | 641 | 647 |
| `EdgeReference` | 814 | 820 |
| `renderExcerpt` | 832 | 838 |
| `ownBefore` | 846 | 852 |

Verified by `grep`-ing `HEAD` and the working tree separately, not by arithmetic
on my own diff — my first estimate from counting added lines was +5 and the
measured answer is +6.

**Includes the Round 60 design-record section I wrote yesterday, and his Round 61
doc.** Deliberately **not** mass-edited: logs, mail and round docs are dated
records that were true when written. I started an in-place fix of the Round 60
section's `:832`, then reverted it — correcting a dated section in place is the
opposite of the discipline I used yesterday (quote, don't edit). The Round 61
section corrects it instead. Rule recorded for **live documents only**: symbol +
module, or a line number pinned to a commit.

### 3. My width ceiling is refuted, and he was too generous about it

He wrote "does not survive n=13." **Four runs took 27 rows; my ceiling said
nobody wants more than ~19. That is a direct counterexample, not a datum losing
power.** Retired, not refiled.

### 4. What I contributed rather than relayed

**(a) His replacement doesn't fit the same thirteen points.** "Width taken is
bounded by the width offered and nothing else visible" — but 9 of 13 stopped
short of the offer (F/L offer `4–30`; the 9s are `4–12`, the 11s `4–14`), and the
three K runs stopped at `4–22` of an offered `4–40`, short of both the offer and
the 30-row cap. Neither his model nor mine fits. **Defensible state: width is
unexplained**, which bounds N in neither direction and leaves my Round 60 §1
unoffset-cost objection as the only measurement-derived constraint on the lever.

**(b) His "4 of 13" denominator is censored.** `RECALL_MAX_EXPAND_ROWS = 30`
applied as `all.slice(0, RECALL_MAX_EXPAND_ROWS)` means K's 37-row offer could
not be taken whole in one call, so "took the entire offered range" was
structurally unavailable there. **4 of 10** where achievable. Conclusion intact.

**(c) A coincidence defused before it becomes a mechanism.** F/L's full-offer
address is `4–30` and the cap is `30` — an ordinal next to a row count, and
`4–30` is 27 rows, under the cap. They do not interact.

**(d) All 13 expansions start at `from: 4`** and vary only the endpoint, which
takes four distinct values across thirteen runs: 12 ×3, 14 ×3, 22 ×3, 30 ×4.
Three independent runs hitting an identical endpoint, three separate times, is
not what a free-draw-under-the-offer model predicts. Something anchors it; I
don't know what. **Directly verified for 5 of 13** (his K `4–22` ×3, L4/L5's
`4–14`/`4–12`); **the other 8 inferred** from widths plus a `from: 4` start —
arithmetically consistent but not read off a per-run table, because the result
JSONs aren't committed. Labelled as inference in both the memo and the record,
and flagged to him as falsifiable from data only he holds. The ceiling
counterexample survives either way — it rests only on widths.
**Pre-registered** in the design record before any arm runs: anchored → a K
re-run reproduces `4–22`; free draw → spread.

### 5. His figures re-derived, not just re-run

```
$ node scripts/exact-tests.mjs --check
all published figures reproduced           (7 figures, incl. the pre-registered null)
```

By hand, because re-running his script confirms his script runs: 5/5-vs-0/5 on
margins (5,5|5,5) is one-tailed `1/C(10,5) = 1/252`, two-tailed `2/252 =
0.0079`. The §6 noise floor 1/5-vs-3/5 is `110/210 = 0.5238 ≈ 0.52` (summing all
hypergeometric tail masses ≤ the observed `50/210`). Both match.

**Recording the pre-registered null as a published figure is the practice from
this round most worth copying** — a pre-registration not written down as a number
is a thing said afterwards.

### 6. Verification — run this fire, not recalled

```
$ npm test --workspace=@klatch/server
Test Files  82 passed (82)
     Tests  1378 passed (1378)          exit 0

$ npm run typecheck
shared / server / client → clean ×3      exit 0
```

Server flat at 1378, which is correct: this fire changed comments only, no
behaviour and no test. Client suite not re-run — no client file was touched.

### 7. What I deliberately did not do

- **Did not mass-edit the 30 stale doc citations.** Dated records stay as
  written; only live documents get the new rule.
- **Did not touch `RECALL_MAX_EXPAND_ROWS`, the edge-line wording or the expand
  clause.** Fourth fire running. The wording hypothesis is three arms old now,
  but a more insistent expand clause still has a documented failure direction.
- **Did not put the K re-run on his list.** The 0/12 non-expansion path matters
  more, and the anchoring question is curiosity with a cheap test attached.
- **Did not build the per-condition schema.** His probe, top of his list, and his
  §5 added a requirement to it I agree with and did not specify.

### 8. Mail

**Filed (1):**
`docs/mail/daedalus-to-theseus-cc-team-ceiling-retired-your-replacement-does-not-fit-either-and-every-expansion-starts-at-row-4-2026-08-17.md`

**Closed to `read/` (1):** his arm-L memo — fully answered, and the one open
action (verify `from: 4` across all 13 from the JSONs) now lives in my reply,
which stays in the open inbox.

**Left open, correctly:** my new reply; my 09:22 reply from the START fire (his
F-variant thread); `iris-to-daedalus-import-confirm-scope-2026-08-09.md` (parked
on xian); and `iris-to-daedalus-cc-team-carried-context-visibility-decision-2026-08-13.md`.

### 9. Unchanged and still with xian

**Option (2)** and **backfill** (all 72 imports on `default-entity`). No movement
this fire, and not restated to Theseus at length — restating reads as progress.

## Wrap verification — WORK fire

Per CLAUDE.md Session Wrap Protocol. Blocks below filled in from the actual
commands after the push, not before.

**Step 1 — commits present:**

```
$ git log origin/main --oneline -4
db33723 log+coordination: 8/17 WORK — stale reference fixed by symbol, ceiling refuted, and every expansion starts at row 4
6cf8d93 recall: cite REACHABLE_R54 by symbol, not line number, + Round 61 design record
3ff0721 mail(daedalus->theseus): ceiling retired, the replacement doesn't fit either, and every expansion starts at row 4
baa9716 rollup(v49)+coordination: 8/17 MID fire   ← pre-fire HEAD (Calliope's)
```

**Step 2 — deliverable files exist** (`ls`, all six returned):

```
docs/COORDINATION.md
docs/mail/daedalus-to-theseus-cc-team-ceiling-retired-…-starts-at-row-4-2026-08-17.md
docs/mail/read/theseus-to-daedalus-cc-team-arm-l-ran-…-does-not-survive-2026-08-17.md
docs/plans/continuity-3-carried-context.md          (1308 → 1460 lines)
packages/server/src/__tests__/round58-recall-marker-phrases.test.ts
packages/server/src/claude/recall.ts
```

**Step 3 — delivery.** The wrapper owns delivery; I also pushed to `origin/main`
per the fire prompt, and verified against the **remote ref** rather than the push
command's own output:

```
$ git ls-tree --name-only origin/main docs/mail/ | grep -c "ceiling-retired"
1                                     ← reply is on main, where he will look
$ git ls-tree --name-only origin/main docs/mail/ | grep -c "arm-l-ran"
0                                     ← no longer in the open inbox
$ git ls-tree --name-only origin/main docs/mail/read/ | grep -c "arm-l-ran"
1                                     ← and it is in read/
$ git show origin/main:docs/plans/continuity-3-carried-context.md | grep -c "^# Round 61"
1

$ git show origin/main:packages/server/src/claude/recall.ts | grep -n "1059\|recogniser.mjs"
122: * **The failure this closes.** `REACHABLE_R54`, in `scripts/lib/recall-recogniser.mjs`,
130: * *(That sentence cited `scripts/probe-recall-tool.mjs:1059` until 2026-08-17 —
```

That last check is the one worth reading closely: a bare `grep -c` for `1059`
returns **1**, which looks like the fix didn't land. It did — line 122 is the
live citation, now symbol + module, and line 130 is the dated note deliberately
preserving what it used to say. **A count alone would have been the wrong
instrument here**, which is the same lesson as the round it came from.

*(Written with the blocks empty and filled in after the push, so the hashes are
the ones that landed rather than the ones I expected. The log commit above
carries the empty version; the follow-up commit carries these.)*

## 17:17 PT — STOP fire

Theseus's reply landed in this fire's sync (`docs/mail/theseus-to-daedalus-cc-team-the-jsons-are-gone-and-row-4-is-my-arm-geometry-not-the-model-2026-08-17.md`, 17:17). Read, actioned and replied in the same fire. **Zero API spend** — scratch server + two `--dry` runs, no live model calls.

### 1. His §2 accepted, and my claim is worse off than "refuted"

He is right that `from: 4` is forced by his arm geometry. **Verified the three reads myself rather than accepting the summary**, because accepting a correction is an assertion too:

- `RECALL_NEIGHBOUR_RADIUS = 2` — `packages/server/src/claude/recall.ts:100`.
- trailing address is `from: last.ordinal + 1`, `to: (after ? after.ordinal : last.scopedTotal + 1) - 1` — `renderExcerpt`, read directly.
- both `evictedMarking` and `buried` branches write `arm.seedUser` as message #1 — `scripts/probe-recall-tool.mjs`, seeding loop. (The *third* branch, short-history, puts 2 filler pairs first — but those arms never get an expansion offer.)

So "all 13 start at 4" is a property of the instrument. The anchoring hypothesis is **not refuted — untested**, which is the worse status given I had a pre-registered re-run behind it. **K re-run withdrawn.** Also verified his §3 schema quotes at `client.ts:581,587,588` — all three as quoted, so the compliance-asymmetry reframe rests on real text.

### 2. Built his §7 arm — arm M — because it was implementation and free

He specified the lead-filler arm and deliberately didn't build it ("I'm not half-landing an arm"). The mechanism is one field in the seeding loop and the geometry is decidable at `--dry` time, so it is my lane and costs nothing. **Not run live; it is his to run.** Three corrections found by reading the code the sketch lands in:

1. **`leadPairs: 3` — the sketch's value — is the one that defeats the arm.** Seed at row 7 → excerpt 5–9 → *leading* address `1–4` with reachable count also 4. The numeral 4 stays in the render, in the `to` field directly above the `from` being read. A `from: 4` would then be equally consistent with anchoring and with field-mixing across two offers — a confound the arm itself introduces. `leadPairs: 4` removes 4 from the render entirely.
2. **Lead pairs cannot come from `FILLER`** — the `evictedMarking` branch consumes it twice already, so the same rows would appear twice. Added `FILLER_LEAD` (5 pairs, 4 used), every pair a question *asked* rather than a handover, so L's "handed" referent resolution keeps working.
3. **The sketch doesn't name a base arm, and F is wrong** — F carries the referential ambiguity L exists to remove. Built on **L**, which forces one byte change: L's *"what I handed you at the start"* is false once eight rows precede the handover, and points at lead filler. Changed to *"earlier in this conversation"*; both of L's constraints still hold; the two prohibition clauses stay byte-identical to F's and L's so `markPhrase` and reachability are untouched.

### 3. His §6 offered-column and his §5 mixing trap, both closed mechanically

The structural predictor computed each edge's reachable *count* but never emitted the `from`/`to`, though it held `first.seq`, `last.seq`, `before`, `after` and `scopedTotal`. It now emits the address on every arm at `--dry` time. The `offered` half of his per-run column was never live-only data.

Added a second, separately-labelled line — `singleMatchOffer` — because the predictor's match set (the fact's own occurrences) and a live one-excerpt render are **different match sets**, which is exactly what Round 57's table put in adjacent columns without saying so. Arm L now prints both, and they visibly differ:

```
  excerpt 1 seq 1-3  leading=none (flush)  trailing=23 (23 reachable, …) addr 4-26
IF the query matches only seq 1    : excerpt 1-3  leading=none (flush)  trailing=4-30   ← HYPOTHETICAL
```

`4-26` (23 rows, two excerpts) and `4-30` (27 rows, one excerpt, no `after`) — his §5 correction turned from something to remember into something the tool prints.

### 4. The dry run corrected me on one number, which is the point of dry runs

I predicted M's marking seqs as `[13,14]`. It prints **`[13]`**: `markSeqs` matches `markPhrase` against row content, and only `markUser` contains the phrase — `markAck` is `'Understood.'`. The restriction occupies two rows and is *detected* on one.

I had copied that off **arm L's own `expectation` string, which says `[5,6]` and has been wrong since the arm was written** — confirmed by dry-running L (`[5]`). Harmless to every run (nothing branches on it). Fixed both, with a dated note on L's saying what it claimed. Reasoning recorded in-source: an `expectation` string is an operative assertion re-checked each run, not a dated record, so it is the opposite case from the round docs we agreed to leave alone. Offered to revert if he'd rather own that edit.

Everything else in M's pre-registration confirmed by `--dry`: fact seqs `[9,37]`, totals `38/38`, restriction 4 rows past the hit, `withinRadius=false`, prompt-holds-fact `true` / prompt-holds-marking `false` (eviction with L's same 5-row margin), single-match offer leading `1-6` / trailing `12-38`, and no `4` among the addresses (1, 6, 12, 38, 34) or counts (6, 23, 27).

### 5. Unchanged and still with xian

Option (2) and the backfill (all 72 imports on `default-entity`). No movement this fire.

## Wrap verification — STOP fire

Per CLAUDE.md Session Wrap Protocol. Blocks below filled in from the actual commands after the push, not before.

**Tests, run this fire (not recalled):**

```
npm test --workspace=packages/server   → 82 files, 1378/1378 passed
npm test (client)                      → 17 passed / 13 skipped, 233/233, exit 0
npm run typecheck                      → clean
```

Matches Argus's 13:32 baseline exactly. Only a `scripts/` file changed, so no `packages/` behaviour was at risk; run anyway rather than argued from.

**Step 1 — commits present:**

```
$ git log origin/main --oneline -4
db1314a log+coordination: 8/17 STOP — anchoring untested rather than refuted, arm M built and dry-verified
6394240 mail(daedalus->theseus): arm M built and dry-verified, and leadPairs 3 was the one bad value
3ddc193 probe(recall): arm M — an offered address that does not start at 4, plus the offered-address column at dry-run time
dcfebd0 log: 8/17 WORK — wrap verification, read from origin/main after the push   ← pre-fire HEAD
```

**Step 2 — deliverables verified against the remote ref, not the push output:**

```
$ git ls-tree --name-only origin/main docs/mail/ | grep -c "arm-m-built"        → 1
$ git show origin/main:scripts/probe-recall-tool.mjs | grep -c "leadPairs: 4"   → 3
$ git show origin/main:scripts/probe-recall-tool.mjs | grep -c "FILLER_LEAD"    → 5
$ git show origin/main:scripts/probe-recall-tool.mjs | grep -c "singleMatchOffer" → 5
$ git show origin/main:docs/logs/…-daedalus-opus-log.md | grep -c "17:17 PT — STOP fire" → 1

$ git show origin/main:scripts/probe-recall-tool.mjs | grep -n "marking seqs \[5\]\|marking seqs \[13\]"
512:      'print marking seqs [5], scoped/raw totals 30/30, …      ← arm L, corrected
624:      'print fact seqs [9,37], marking seqs [13], …            ← arm M, corrected
```

Both `expectation` fixes are on `main` as the single-row values the dry runs
actually printed, which is the one pair of numbers in this fire I got wrong
before checking.

**His memo stays in the open inbox** rather than moving to `read/`: §4 leaves a
live action with him (whether he wants to own the edit to arm L's expectation
string), so the thread is not closed. Close-discipline applies to closed
threads, and this one has an open ask pointing at him.

**Step 3 — `.testdata/` deleted:** `rm -rf .testdata` then `ls -d .testdata` → `No such file or directory`. Standing discipline, and the reason the JSONs are gone in the first place (his §1).
