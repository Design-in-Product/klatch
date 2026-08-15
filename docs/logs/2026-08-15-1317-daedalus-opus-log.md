# Daedalus session log — 2026-08-15 13:17 PT (WORK fire)

Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`,
synced to `origin/main` by the wrapper before the fire.

## 13:17 — Briefing

`docs/COORDINATION.md` §Daedalus read. `docs/mail/` swept: one new memo addressed to me —
`theseus-to-daedalus-cc-iris-xian-team-round53-the-marker-changed-the-rate-and-the-header-does-not-cover-the-edges-2026-08-15.md`,
with `docs/research/round53-scope-gap-marker-live-2026-08-15.md` behind it (4 turns, 8 recall calls,
`claude-opus-5`, real server, scratch DB deleted).

Its ask is narrow and explicit: **treat "the header covers it" as falsified, and price an edge marker
as a testable proposition.** Not a reversal request on his say-so. That is this fire's work.

## 13:20 — The finding I was wrong about

Round 52 marked scope gaps in an excerpt's **interior only**. My stated reason, in `recall.ts`:

> *"A message before the first row or after the last is outside the radius, which the header already
> accounts for ("Nothing outside these excerpts was read")."*

Measured: that sentence was present in every arm-F result in Round 51 (3/3) and in this fire's F
(1/1). **All four asserted absence anyway** — verbatim *"No restriction was attached to it there"*, a
property of a thirty-message thread stated from three lines, with the owner's restriction four rows
past the edge. **4 for 4, two fires, two builds.** The clause is false.

The *second* clause of that judgement survives and shaped the fix: one marker meaning both "turns
removed from inside this" and "the conversation continues past this" is worse than either. So Round
54 is a **second marker with its own vocabulary**, not a widening of the first.

Also recorded, because it is a correction to how I have been pricing my own work: Theseus's
separation of the standing finding — **prose in a header changes a failure's shape, not its rate
(4/4); structured evidence positioned at the point of the gap changed the rate (3/3, first
attempt)**. `LOSSY_WINDOW_NOTICE`, the excerpt header sentence and the recall miss text are the first
kind. The scope-gap marker is the first of the second kind on this project.

## 13:22 — What landed (Round 54)

**`packages/server/src/db/queries.ts`** — `scoped_total` / `raw_total` on
`getEntityTranscriptNeighbourhoods`, surfaced as `NeighbourhoodMessage.scopedTotal` / `.rawTotal`.
Both are `COUNT(*) OVER (PARTITION BY channel_id)` over partitions the query already computes, so no
extra scan. They exist because an ordinal describes a row's relation to what *precedes* it: between
two rendered rows the two ordinals are sufficient, at an edge there is no second row to subtract from.

**`packages/server/src/claude/recall.ts`** — `edgeGapLine`, emitted at each end of an excerpt where
the conversation runs on past what is shown:

```
[… 2 earlier message(s) in this conversation, not shown here: 1 that a different search of yours
   could reach; 1 that no search of yours can reach …]
```

Four decisions, each a way it could have gone quietly wrong:

1. **The two counts are separated and the line states the affordance, not the category.** Turns in
   the entity's own transcript that this search missed are reachable by another query; turns outside
   it are unreachable at any radius by any query, by construction. One number would send the agent
   looking for what it can never have. It also keeps the header's "search again" advice attached only
   to the case where searching again is real advice.
2. **Its own vocabulary, deliberately not `scopeGapLine`'s.** The interior header sentence promises
   *"the lines either side of it are not consecutive"*; an edge has one side. A test fails if the
   phrase migrates.
3. **Measured against the nearest *rendered* excerpt of the same conversation.** Two live bugs
   avoided: the kept list is chronological across rooms, so the array neighbour is routinely a
   different conversation; and an excerpt the char budget dropped is not on the page, so a count
   measured to it is true about the room and false about what the agent can check. This is why the
   render is now a **second pass after the budget loop** rather than part of it.
4. **The explaining header sentence is conditional on a marker being in the body** — Round 52's rule,
   for Round 52's reason.

**`round54-recall-excerpt-edges.test.ts`** — 11 tests. Three of them are timidity tests (excerpt
flush with the conversation; leading edge at the conversation's start; the "unreachable" clause on a
conversation with nothing unreachable).

The Round 52 test that pinned the reversed judgement (`does not mark the edges of an excerpt`) is
rewritten rather than deleted, and now asserts the *other* marker fires there and the interior phrase
does not.

## 13:28 — Verification

```
npm test    → 1344 server (+11) / 230 client, exit 0
typecheck   → clean ×3 workspaces (shared, server, client)
npm run build → green end to end
```

**Failing direction proven for all eight load-bearing pieces, each reverted on its own** rather than
as one batch — `scripts/round54-revert-probe.mjs` (committed, re-runnable, restores the file after
each revert and prints failing test names):

| revert | red |
|---|---|
| no edge markers at all | 7 |
| one collapsed count instead of two | 2 |
| always measure to the conversation boundary | 1 |
| reference not scoped to the conversation | 1 |
| unconditional header sentence | 1 |
| reference from all excerpts, not the kept ones | 1 |
| interior vocabulary reused on the edge line | 3 |
| `rawTotal` derived from the scoped total | 2 |

R3–R6 are disjoint singletons. The three timidity tests stay green under **every** revert — the right
shape: insensitive to the mechanism, sensitive only to over-marking.

**Found doing that, and it was mine, for the second time:** a new assertion read
`expect(result.text).not.toContain('---')` over the *whole* result, and the header contains `---` in
the sentence describing the separator — so it passed vacuously. Identical to the Round 51 instance.
Tightened to assert on the body. Twice now means it is a pattern in how I write these, not an
incident; Argus's stale-probe class.

**Also mine, caught by a failing test I wrote:** the first draft of the interleaved-rooms test put
the match in *both* rooms because the condition keyed on turn number without checking the room, which
made the cross-conversation reference unexercised. Rebuilt so both rooms match at different turns —
which is what makes the "reference not scoped to the conversation" revert go red at all.

## 13:40 — Not proven by this fire, stated rather than glossed

- **No live call, no browser.** The marker's effect is unmeasured. Arm F is Theseus's and he has
  offered to run it the same fire it lands.
- **The way this can fail is not the way the interior marker could fail.** The interior marker is
  rare and therefore salient. An edge marker renders on nearly every excerpt not flush with its
  conversation's ends — most of them. **Ubiquity is exactly the property that made the header
  sentence ignorable**, and this line has it. What it has that the header does not is a number and a
  position. Whether that is the load-bearing difference is the proposition, unsettled here. **A null
  result on arm F is a real result** — it would say the difference is *anchoring* (G's marker sits
  between two visible rows, anchored by the agent's own dangling reply) rather than positioning, and
  that narrows the class of interventions worth building.
- **The budget arithmetic is approximate by one integer's width.** Selection measures each excerpt
  with edges rendered against the conversation boundary; the final render may substitute a kept
  neighbour, changing digits but never whether a line is emitted. Written down at the point where it
  happens.
- **`"Nothing outside these excerpts was read."` is unchanged and still in the header.** Still true —
  counted is not read — and now the sentence four measurements say does no work. Not removed, because
  nothing measures what removing it does either.

## 13:45 — Mail

- Filed `daedalus-to-theseus-cc-iris-xian-team-round54-the-edge-is-marked-and-your-falsification-stands-2026-08-15.md`,
  with two asks that would sharpen his run (a flush-excerpt arm where the marker is correctly absent;
  the reachable/unreachable split as its own observable — nothing on this project has measured
  whether a clause asking for an *action* rather than a caution lands).
- Closed the 8/14 recall chain to `docs/mail/read/` — five memos, acked with no open action left:
  his recall-probe and round51 memos, my recall-tool-landed, neighbourhood-landed and round52 memos.
- Left open: his Round 53 memo (arm F is an open action on him), my Round 54 reply, and Iris's
  round49/card-weight memo (her client half of Round 52b is real open work).

## 13:50 — Unchanged and still with xian

- **Option (2), never evict a marking.** Round 52 makes G's hole visible; Round 54 makes F's visible.
  Neither fills one, and "the agent can now see the hole" must not drift into "the hole is handled".
- **Backfill** (gap doc open question 3). All 72 imports on `default-entity`.

## 13:57 — Wrap verification (Session Wrap Protocol)

**Step 1 — commits landed:**
```
$ git log origin/main --oneline -3
483c598 Round 54: the excerpt edge is marked — Theseus measured my 'the header covers it' as false 4/4
b5f207c log(calliope): 8/15 MID fire — wrap verification appended
aae7df3 rollup(v43) + coordination + log: 8/15 MID fire — Round 52/52b/53 folded in
```

**Step 2 — deliverables present on `origin/main`** (`git ls-tree -r --name-only origin/main`):
`packages/server/src/claude/recall.ts`, `packages/server/src/db/queries.ts`,
`packages/server/src/__tests__/round54-recall-excerpt-edges.test.ts`,
`packages/server/src/__tests__/round52-recall-scope-gap.test.ts`,
`scripts/round54-revert-probe.mjs`, `docs/plans/continuity-3-carried-context.md`,
`docs/mail/daedalus-to-theseus-cc-iris-xian-team-round54-the-edge-is-marked-and-your-falsification-stands-2026-08-15.md`,
`docs/logs/2026-08-15-1317-daedalus-opus-log.md`, `docs/COORDINATION.md`. All present.

**Step 3 — this log pushed last**, after Steps 1 and 2.

Substrate as measured this fire: `npm test` 1344 server / 230 client exit 0, typecheck clean ×3,
`npm run build` green. The revert probe restored both edited files after every revert; `git diff
--stat` before the build showed only the three intended files, so nothing from the probe leaked into
the commit.
