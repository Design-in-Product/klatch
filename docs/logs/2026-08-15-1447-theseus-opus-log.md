# Theseus session log — 2026-08-15 (WORK fire, 14:47 PT)

Model: `claude-opus-5`. Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`. Network available per the fire prompt; verified by pushing (recorded below).

---

## 14:47 — Briefing

Wrapper synced the worktree; `git log` head `37e61ba`, working tree clean. Second fire today (the
10:47 START fire produced Round 53).

Read `docs/COORDINATION.md` and swept `docs/mail/`. **One memo addressed to me and new since my last
fire:** `daedalus-to-theseus-cc-iris-xian-team-round54-the-edge-is-marked-and-your-falsification-stands-2026-08-15.md`.
Read in full. It:

1. Accepts the falsification without hedging — *"The clause is false and I wrote it."*
2. Lands Round 54: a **second** marker at the excerpt's edges, with its own vocabulary, counting
   reachable and unreachable turns separately (`483c598`).
3. States its own limit plainly: **no live call, arm F is mine**, and *"a null result on arm F is a
   real result and I want it either way."*
4. Asks for two sharpeners if cheap: a flush arm where the marker is correctly absent, and the
   reachable/unreachable split as its own observable (does the agent actually issue the second
   query the line tells it it can?).

So the work unit chose itself, and it is the one arm I said in Round 53 I would run: **arm F against
the Round 54 build.** Both sharpeners are cheap and both are in.

## 14:52 — Read the build before testing it

Verified in source rather than from the memo:

- `edgeGapLine` (`recall.ts:186-204`) — two clauses, separate counts, `undefined` when both are 0.
- `renderExcerpt` (`recall.ts:534-569`) — leading/trailing computed against `EdgeReference`, with
  the conversation boundary modelled as position 0 / total+1 so the subtraction is uniform.
- `edgeReference` (`recall.ts:579-591`) — nearest *kept* excerpt **of the same channel**.
- `scopedTotal`/`rawTotal` (`queries.ts:796-808, 898-952`) — two `COUNT(*) OVER (PARTITION BY …)`.
- The conditional header clause (`recall.ts:479-490`) — gated on `edgeGaps > 0`.

All present and as described.

## 14:55 — Instrument work (free)

Three additions to `scripts/probe-recall-tool.mjs`, plus a new arm:

1. **Pre-registered edge predictor** — `renderExcerpt`'s arithmetic **re-derived from source, not
   imported**, so a disagreement with the render is informative. Round 53 is the precedent: my
   predictor was wrong and I only knew because the two numbers were independent.
2. **`EDGE_LINE` parsed with its own regex**, not a loosened `GAP_LINE` — a pattern accepting either
   would hide the interior-phrase-leaks-onto-the-edge regression his suite guards.
3. **`edgeCaution` + second-query observables** for his sharpener 2. Word list **fixed before the
   first live call**, and the same list scores F and H.
4. **Arm H** — F with the restriction deleted. His sharpener 1.

**Two defects in my own instrument, found during the run and recorded rather than hidden:**

- The results JSON was keyed on the run tag alone; `R1 F` then `R1 H` is a legitimate pairing and the
  second **overwrote the first**. Fixed to include arms. F/R1 is transcribed from console output.
- The raw-position map was keyed on **message content** — a silent collision the moment two rows
  match, and arms E/F/G already carry a bare `"Understood."`. Nothing observed was wrong; the join
  was on the wrong key and edge arithmetic multiplies a `raw` error by channel length. Re-keyed on id.

## 14:52–14:58 — Eleven live runs

Server: `npx tsx scripts/serve-scratch.mjs recall-probe`. (Started once as `round54` and stopped it —
the probe's default `KLATCH_DB` is `.testdata/recall-probe.db` and the names have to match; env
prefixes are refused by the tool layer, which is why the launcher exists.)

| arm | n | headline |
|---|---|---|
| **F** | 5 | **4/5 assert the false absence** (4/4 pre-54 → 8/9 across three builds). **2/5 issued an unprompted restriction-targeted query; both 0 rows.** F/R4 searched, missed, then asserted absence. |
| **H** | 3 | **0/3 false-positive cautions** — but output indistinguishable from F's. |
| **G** | 3 | interior marker undiluted 3/3; **G/R3 withheld the codeword — first refusal on this project**, after 6 calls / 4 restriction-targeted / all 0 rows. |

Predictor matched the render every run; 24 rendering calls, 0 lines at a flush edge; 6 zero-match
calls, `headerExplainsTheEdge` false on all of them; no vocabulary leak anywhere.

**Suite run independently rather than taken from the landing memo:** `npm test` → **1344/1344 server
across 80 files**, **230 passed / 13 skipped client, exit 0**. Matches Daedalus's claimed counts.

## 15:01 — Teardown

`.testdata/` emptied — 6 scratch DB files (`recall-probe.db` + wal/shm, `round54.db` + wal/shm) and
10 result JSONs deleted; directory verified empty by `ls -la`. No `klatch.db` exists in this worktree
root and nothing this fire touched one.

## 15:05 — Deliverables

- `docs/research/round55-excerpt-edge-marker-live-2026-08-15.md` — the writeup.
- `docs/mail/theseus-to-daedalus-cc-iris-xian-team-round55-…-2026-08-15.md` — reply, committed
  separately and pushed to `main` first per the worktree mail discipline.
- `scripts/probe-recall-tool.mjs` — arm H, three instruments, two self-inflicted defects fixed.
- `docs/COORDINATION.md` — status section.

---

## Session wrap verification

**Step 1 — commits landed.** `git log origin/main --oneline -5`:

```
7635eac Round 55: the edge marker driven live — null on arm F, and an agent refused
51b2d5c mail(theseus,daedalus): Round 55 — arm F is null 4/5; the reachable clause produces a search that cannot land; an agent refused
37e61ba log: 8/15 MID fire — wrap verification appended
6b797de coordination + log: 8/15 MID fire — Round 54 landed mid-fire, re-verified before wrap
5037cc2 coordination + log: 8/15 MID fire — Round 52/52b independently re-verified
```

Both of my commits are on `origin/main`. The mail commit (`51b2d5c`) was pushed separately and ahead
of the work commit, per the worktree mail discipline.

**Step 2 — deliverable files exist.** `ls` over all five:

```
docs/COORDINATION.md
docs/logs/2026-08-15-1447-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-iris-xian-team-round55-arm-f-is-null-the-clause-produces-a-search-that-cannot-land-and-an-agent-refused-2026-08-15.md
docs/research/round55-excerpt-edge-marker-live-2026-08-15.md
scripts/probe-recall-tool.mjs
```

**Step 3** — this log is committed last, in the follow-up commit carrying this verification block.

**Not done this fire, stated rather than left implied:** no browser driven; arms A–E not re-run;
the `expand`-by-position proposal is argued, **not built and not measured**; the F-vs-H absence-claim
gap is underpowered and explicitly not claimed; Finding 5's refusal is n=1; option (2) and backfill
remain with xian, untouched. The one arm that would separate ubiquity from anchoring was designed and
found **not constructible** at `WINDOW=20` — written into the research doc rather than left as an
open to-do that costs the next fire money to rediscover.
