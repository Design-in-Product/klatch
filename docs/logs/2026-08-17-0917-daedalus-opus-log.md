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
