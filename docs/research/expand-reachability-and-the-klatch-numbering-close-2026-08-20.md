# The distance arm's marking is inside call 1, and the klatch half of the numbering fix closes with no edit

**Daedalus · 2026-08-20 (WORK fire) · zero API spend, zero live runs, no server started**

Two things, both open on my seat at the start of this fire:

1. Theseus's Round 66 §4 proposes a distance arm and flags — without resolving — that at its
   size both offers exceed the expand cap. I resolve it: the marking lands **inside the first
   expand call**, so a miss is an appetite miss and not a cap artefact. Along the way I
   re-derived his bound independently and found the one untested constant the answer rests on.
2. My own Round 64 leftover — *"correct in a 1-1 and correct-but-incomplete in a klatch"* —
   **closes with no wording change**, and the argument is below rather than in my head.

New: `scripts/verify-expand-reachability.mjs`, and item 8 of
`packages/server/src/__tests__/round56-recall-expand.test.ts` (2 tests).

---

## 1. The bound, re-derived from the seeding loop rather than read from the memo

Round 66 §4 states `gapPairs ≤ fillerPairs − 9`, from eviction. I did not check his script's
arithmetic; I re-derived the geometry from `probe-recall-tool.mjs`'s `evictedMarking` branch
(`:1218-1240`), reading the `put()` order and nothing else:

```
  1 … 2L            lead pairs         (FILLER_LEAD × L)
  2L+1, 2L+2        seedUser, seedAck  (the handover — the search match)
  2L+3 … 2L+2G+2    gap pairs          (filler.slice(0, G))
  2L+2G+3           markUser           ← the restriction
  2L+2G+4           markAck
  2L+2G+5 … 2L+2F+4 remaining filler   (filler.slice(G))
  2L+2F+5, 2L+2F+6  restateUser, restateAck
```

From which:

| quantity | expression | note |
|---|---|---|
| total | `2L + 2F + 6` | |
| excerpt | `2L−1 … 2L+3` | match at `2L+1`, `RECALL_NEIGHBOUR_RADIUS` 2 |
| offered start | `2L + 4` | `from: last.ordinal + 1` |
| **mark offset** | **`2G − 1`** | **independent of `L` and `F`** |
| leading offer | `2L − 2` | |
| trailing offer | `2F + 3` | |
| eviction margin | `2(F−G) − 17` | the probe's own `margin = 2P − 17` falls out |

Requiring `margin ≥ 1` gives `F − G ≥ 9`, i.e. **`G ≤ F − 9`**. Same bound, reached from the row
order. Two independent routes, which is the only reason to state it twice.

`markOffset = 2G − 1` being independent of `L` and `F` is what makes the cheap arm dead and makes
it dead *structurally*: on `FILLER` (F=12) eviction caps `G` at 3, so the offset caps at **+5**,
and +5 is below the observed appetite floor of +6. No choice of `leadPairs` moves it. Confirmed,
not assumed — the checker asserts the whole derivation against M's and N1's **published** ordinals
and margins before reporting anything, and reads `WINDOW`, `RADIUS`, and both caps from the
modules rather than copying their values.

## 2. The question §4 raises and leaves open, answered

§4's flag: at `F=17` both offers exceed `RECALL_MAX_EXPAND_ROWS`, so reading one whole takes two
calls — *"a task difference from N1 and I'd pre-register it rather than discover it."*

The sharper form of that worry is the one that decides whether the arm measures anything:

> **If a cap can truncate call 1 before offset +15, then "the agent stopped early" and "the tool
> stopped early" are the same observation.**

The arm's headline result and its most boring artefact would be indistinguishable — Round 59's
*"a recogniser matching nothing agrees trivially"* wearing a different hat. There are three caps
on that path and they do not behave alike:

| cap | value | applies at | can it shorten call 1? |
|---|---|---|---|
| `RECALL_MAX_EXPAND_ROWS` | 30 | `recall.ts:748` | yes — to exactly 30 rows |
| `RECALL_MAX_CHARS` | 12,000 | `recall.ts:764` | **no**, see §3 |
| `CARRIED_CONTEXT_MAX_MESSAGE_CHARS` | 4,000 | `recall.ts:807` | per line only, never drops a row |

Measured:

```
arm                          rows  offer  mark  in call1?  calls  call1 chars  trunc  missable
N1  (ran live ×5, Round 63)    60     27    +1        yes      1         2484       0  no
distance arm (Round 66 §4)     80     37   +15        yes      2         2608       0  yes
```

**+15 < 30, so the marking is on the page of call 1.** A run that does not hold the restriction
declined to read far enough, which is the thing the arm exists to measure. The row cap is a real
task difference — "read it whole" costs two calls where N1's cost one — but it is not a confound
on the primary DV.

**A hypothesis of mine that died on contact, worth recording because it would otherwise get
re-raised:** I expected `FILLER_LONG` to put long rows on the page and pressure the char budget.
It does not. `FILLER_LONG` is `[...FILLER, 5 more]` (`probe-recall-tool.mjs:259`) — a longer
**list**, not longer **rows**. Call 1 renders 2,608 chars against a 12,000 cap, 4× clear, with
zero lines meeting the 4,000-char per-line cut. The distance arm reads at N1's exact texture; its
five extra pairs buy eviction headroom and nothing else. That is a *smaller* task difference than
§4 implies, and it is a number rather than an adjective.

## 3. The constant the answer rests on had no test, and now has two

`RECALL_MAX_CHARS` was referenced **nowhere outside `recall.ts`** — no test, no probe, no
recogniser. At the start of this fire `grep -rl RECALL_MAX_CHARS packages/ scripts/` returned that
one file; it now returns three (the module, the new test, the new checker). The expand path's
break is:

```ts
if (used > 0 && used + block.length > RECALL_MAX_CHARS) break;
```

The `used > 0` guard keeps the **first** block whatever its size, and in a 1-1 with no scope gaps
`groupIntoExcerpts` returns the fetched rows as one contiguous block — so on this shape the char
cap can never drop a row. That is deliberate (an agent that followed the address it was handed and
got fewer rows than its own `Positions X–Y` header promises is reading a page that contradicts
itself), and it was undefended.

Item 8 of `round56-recall-expand.test.ts` pins it: 30 rows × 1,000 chars ≈ 31k rendered against a
12k cap, asserting the full row cap comes back, that the header's claim matches the page, and —
separately, because a row *dropped* and a row *cut short* are different failures and only one of
them moves `shownCount` — that no line carries the truncation marker.

**Run as a negative control, not concluded to pass.** Blunting the guard to
`used + block.length > RECALL_MAX_CHARS`: both new tests red, **the other 19 green**. So nothing
else in the suite was covering it, which is the claim above, demonstrated rather than grepped.
`recall.ts` reverted and byte-identical to `HEAD` (`git diff --stat` empty).

## 4. Not a licence

The arm is `F=17, L=20, G=8`: five new `FILLER_LEAD` pairs against five constraints now, an 80-row
seed, five opus runs. This fire says the arithmetic is available and the primary DV is clean. It
does not say the arm should run. That is xian's call and Theseus's instrument.

---

## 5. The klatch half of the Round 64 numbering fix — closed, no edit

Round 64 landed *"your turns and the user's"* at three sites and I deferred one thing explicitly:
in a klatch a third agent's turns genuinely have no position, so the replacement is *correct in a
1-1 and correct-but-incomplete in a klatch* — flagged as a design question, not settled inside a
typo fix. Both this doc's predecessors and `COORDINATION.md` have carried it as open since.

**Reachability first, because if it were unreachable the rest would be moot: it is reachable.**
`recall.ts` passes only `excludeChannelId` to `findEntityTranscriptChannelsByName` (`:428`,
`:705`) — no `types` filter — so recall can and does address a klatch.

**The header's enumeration is exhaustive by construction, not by luck.** Two facts, both read
this fire rather than recalled:

- `entityTranscriptWhere` (`queries.ts:647-652`) admits `m.entity_id = you` **or** a `role='user'`
  row with NULL `entity_id` in a channel you belong to. Another entity's assistant row carries
  its own `entity_id` and fails both arms. So exactly two kinds of row can be numbered.
- `formatTranscriptLine` (`carried-context.ts:258`) labels a row `entityName` if
  `role === 'assistant'`, else `user`. So exactly two labels can be printed.

*"Your turns and the user's"* names both, and there is no third thing for it to omit. The klatch
fact — that another agent's turns are unnumbered and unreachable — is stated **where it occurs and
with a count**, by the interior scope-gap marker: `[… N message(s) here are part of that
conversation but not of your transcript, and were not read …]`. That path is exercised on a klatch
in `round56-recall-expand.test.ts:222` (the colleague's turn has no position, the marker renders,
`shownCount` counts four).

**Decision: no wording change.** Adding a third clause to the header would restate in a sentence
that Round 54 measured as ignorable what the body already says with a number, at the only moment
it is true. The two failures this surface has actually produced — false absence claims from three
lines, and a 2× miscount — were both fixed by making the *body* carry the fact, not by lengthening
the header.

**What would reopen it**, stated so a later fire has a trigger rather than an instinct: a render
that can number a row `formatTranscriptLine` labels neither `user` nor this entity, or a klatch
scope gap that produces no interior marker. Either breaks the exhaustiveness argument above, and
neither exists today.

This item is off my list. Round 66 §5 item 5 can be struck.

---

**Verified this fire:** `npm test` — server **1398/1398 (84 files)**, +2 exactly matching the two
new tests, against my 8/20 START baseline of 1396; client **233 passed / 13 skipped**, unchanged.
`npm run typecheck` clean across shared, server and client.
`npx tsx scripts/verify-expand-reachability.mjs` exit 0.
`npx tsx scripts/verify-filler-constraints.mjs` — 32 pairs, all constraints, run myself rather
than trusted from Round 66.
`npx tsx scripts/geometry-distance-arm.mjs` — both measured arms reproduce, run myself.
