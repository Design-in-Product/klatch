# Daedalus — 2026-08-14 STOP fire (17:18 PT)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Model: Opus 5. Unattended, network available.

---

## 17:18 — Briefing

`git log --oneline -5`: head at `ac258e1` (Calliope's 8/14 SWEEP log). Worktree clean, tracking
`origin/main`.

Mail sweep. One new item addressed to me since the 13:17 WORK fire:
`theseus-to-daedalus-cc-iris-team-recall-probe-the-tool-is-reached-and-the-eviction-hole-is-not-closed-2026-08-14.md`
(17:17, cc Iris/xian/Argus/Calliope/Pard). Read in full. Everything in it is on my surface except
one number routed to Iris and the option-(2) ruling, which is xian's.

`theseus-to-daedalus-iris-cc-team-round49-verified-live-and-one-flag-2026-08-14.md` is the earlier
thread; its items were actioned at 13:17 and it carries no open ask to me.

COORDINATION.md read; my own section's queued list has "(1) the summary half of (b)" next, but a
same-day measured finding against something I shipped this afternoon outranks a queued item.

## 17:20 — What the probe actually says

Three results are good news for Round 50 as shipped:

- Model reaches for the tool **13/13** turns, every one at least twice. Failure mode 1 (salience) did
  not occur once.
- Arm B: natural query ANDs to 0 rows 3/3; **3/3 retried and recovered**, substituting the source's
  vocabulary rather than merely narrowing. The multi-term miss text does what it was written to do.
- Arm C reproduces my own third-stage prediction: 2/2 called recall with the answer already in the
  prompt. One extra round per turn — a cost, not a defect.

The fourth is not good news. **Arms D and E are a controlled pair** differing in exactly one thing —
restriction co-located with the fact (D) vs one turn later (E) — with the same two queries issued in
every run. D: 2/2 recovered, 2/2 withheld. **E: 0/3 recovered, 3/3 disclosed.** The restriction in E
was reachable by keyword and no run issued a query that could have found it.

Recall recovers an evicted marking exactly when co-located with the fact — the case eviction could
never have separated. It does not help in the configuration his 8/13 finding was about. That
falsifies his own recorded sentence, on which the deferral of option (2) rested.

And the harmful shape is a **hit read as complete**, not a miss read as absence. Two of three runs
argued past `LOSSY_WINDOW_NOTICE` in near-verbatim the notice-OFF sentence I recorded at 8/13 STOP.

## 17:22 — Decision on scope for this fire

Take options (1) and (3); take the arm-C wording; fix the concatenation defect. **Do not** take
option (2): it is a policy surface, it needs xian, and the honest move is to route it rather than
re-defer it on a substitute rationale of my own now that its original one has been withdrawn.

## 17:23–17:29 — Implementation

`packages/server/src/db/queries.ts`:
- `searchClauses(search, column)` extracted from `entityTranscriptWhere`, so the flat query and the
  CTE cannot define "matches" differently.
- `getEntityTranscriptNeighbourhoods` — CTE with `ROW_NUMBER() OVER (PARTITION BY channel_id ...)`,
  a `hits` CTE carrying the keyword clauses and the `limit`, and a `BETWEEN h.seq ± radius` outer
  filter. `limit` bounds matches, not rows. Returns `isMatch` and `ordinal`.

`packages/server/src/claude/recall.ts`:
- `RECALL_NEIGHBOUR_RADIUS = 2`, chosen from the measured case.
- `groupIntoExcerpts` — bucket by channel, split on ordinal gaps, sort by each excerpt's newest row.
- Budget loop rewritten: excerpt is the unit; first-excerpt-overrun degrades to bare matches and
  announces it.
- Result header gains the extent sentence (option 3); tool description gains the neighbours clause
  and the arm-C clause.

`packages/server/src/claude/client.ts`:
- `appendText` shared by both stream branches; `pendingRoundSeparator` set at the `continue` in the
  tool-use branch; separator emitted as part of the delta.

**Bug found while writing `groupIntoExcerpts`, before any test existed for it:** rows arrive in one
global chronological order, so two rooms active the same morning interleave and a linear walk splits
every excerpt at the alternation. Fixed by bucketing per channel; a test now pins it.

## 17:26–17:29 — Tests

New file `packages/server/src/__tests__/round51-recall-neighbourhood.test.ts`, 22 tests: query layer
(radius-0 equivalence to `getEntityTranscript`, radius behaviour, per-channel ordinals, no
cross-channel neighbours, no other-entity neighbours, user messages as neighbours on membership,
limit-bounds-matches, overlap merging), arm-E end to end (with the failing direction asserted in the
same test), excerpt separation, interleaving, budget (whole-excerpt drop, bare-match degradation),
description wording, and five round-separator tests including deltas-equal-stored.

First run: 20/21 pass. The budget-degradation test's fixture was under the ceiling (3 × ~3,900 fits
12,000) so the fallback never fired — fixture raised to 4,500/message. Not a code defect; a test that
wasn't testing what it claimed.

## 17:30 — Verification

- `npm run typecheck` — clean ×3 workspaces.
- `npm test` — **1319 server (+22) / 226 client, exit 0**, 13 skipped (AAXT-gated).
- `npm run build` — green end to end.

**Failing direction, six reverts applied together, one run:**

| revert | expected | observed |
|---|---|---|
| (a) `neighbourRadius` → 0 | arm-E recovery, match marking | 2 |
| (b) budget per line, not per excerpt | whole-excerpt drop, bare-match degradation | 2 |
| (c) `pendingRoundSeparator` never set | separation, stream parity, no-stacking | 3 |
| (d) linear walk, no channel bucketing | interleaving | 1 |
| (e) contiguity check removed | distant matches, whole-excerpt drop | 1 |
| (f) entity scope dropped from `scoped` | other-entity neighbour + 3 Round 50 scope tests | 4 |

**13 failures**, disjoint as expected. Restored via `git checkout --` and re-verified green
(1319/226, exit 0).

**Found during the revert run, and it was my error:** the "does not render two distant matches as one
continuous exchange" test asserted `toContain('---')` over the whole result, and the header contains
`---` inside the sentence *describing* the separator — so it passed under revert (e), which merges
every excerpt into one. Tightened to assert on the body (`split('---')` length 2), and the same
correction applied to the interleaving test. Committed separately (`2be8dfb`) so the weak assertion
and its fix are legible. Same family as Argus's stale-probe class: an assertion satisfied by the
prose about the thing rather than by the thing.

## 17:35 — Docs and mail

- `docs/plans/continuity-3-carried-context.md` — new 2026-08-14 STOP section.
- `docs/mail/daedalus-to-theseus-cc-iris-xian-team-neighbourhood-landed-option2-is-yours-to-rule-2026-08-14.md`
  — reply with the four scope decisions, the two limits I want him to know before re-probing (another
  agent's restriction is never a neighbour; radius 2 covers his case and nothing further), the
  option-(2) ask to xian, and two new probe arms.
- Thread left **open** in `docs/mail/` — option (2) is unresolved with xian and Iris's two items are
  live. Not moved to `read/`.

## Not proven by this fire

**No live call.** Everything mocks the SDK. Nothing here shows an agent handed arm E's excerpt now
withholds. Asked Theseus for the D/E rerun and said explicitly that a null result is a real result —
it would prove the remaining distance is policy (2), not retrieval.

Radius 2 covers the measured case and was chosen from it. Nothing measures how often a real
restriction lands further away.

---

## Session wrap verification

**Step 1 — commits on `origin/main`** (pushed this fire; `git fetch` first, so this reads the remote
and not a local ref):

```
$ git log origin/main --oneline -5
b1c17f6 coordination + log: 8/14 STOP fire — Round 51, option (2) re-opened
17d8066 mail + plan: Round 51 landed, option (2) re-opened and routed to xian
2be8dfb Round 51: tighten two assertions that could pass on the header
8776346 Round 51: neighbourhood retrieval, and a separator between tool rounds
ac258e1 log(calliope): 8/14 SWEEP fire — wrap verification appended
```

**Step 2 — deliverable files:**

```
$ ls packages/server/src/__tests__/round51-recall-neighbourhood.test.ts \
     docs/plans/continuity-3-carried-context.md \
     docs/mail/daedalus-to-theseus-cc-iris-xian-team-neighbourhood-landed-option2-is-yours-to-rule-2026-08-14.md \
     docs/logs/2026-08-14-1718-daedalus-opus-log.md
docs/logs/2026-08-14-1718-daedalus-opus-log.md
docs/mail/daedalus-to-theseus-cc-iris-xian-team-neighbourhood-landed-option2-is-yours-to-rule-2026-08-14.md
docs/plans/continuity-3-carried-context.md
packages/server/src/__tests__/round51-recall-neighbourhood.test.ts
```

All four present. The modified sources (`queries.ts`, `recall.ts`, `client.ts`) are inside `8776346`
and `2be8dfb`, both above.

**Step 3 — this log** is committed after Steps 1 and 2, in its own commit; that commit is not in the
listing above because the listing is what it verifies. The `b1c17f6` entry above covers the log's
first version; this verification block is the amendment on top.

**Caveat, stated rather than glossed:** this fire's own final commit (the one carrying this block)
is by construction not in the output it quotes. The wrapper owns delivery of it.
