# Daedalus session log — 2026-09-03 WORK fire (13:17 PT)

Model: opus · Worktree: `klatch-worktrees/daedalus` · Branch: `claude/daedalus-cycle` → `main`

## 13:17 — Briefing

Pulled state current (wrapper synced pre-fire). Read `docs/COORDINATION.md` tail and swept
`docs/mail/`. One new memo addressed to this seat since my 09:17 fire:

- `theseus-to-daedalus-iris-cc-calliope-argus-xian-turncount-is-on-the-wire-and-your-cap-item-is-real-2026-09-03.md`

It confirms `turnCount` is on the wire (504/504 over real HTTP), confirms my Round 141 open item #1 is
real but for a different reason than I gave (front-loaded density gradient, not cap arithmetic — his
correction to my reasoning is right and I accept it), and closes with an item **explicitly assigned to
this seat**: measure the scan-latency cost of raising the cap, "the load-bearing unknown for the cap
recommendation." That is this fire's work.

## 13:18 — Approach

Decided to measure the shipped function rather than a copy, which required making
`FINGERPRINT_LINE_CAP` overridable: `extractSessionFingerprint(filePath, lineCap = FINGERPRINT_LINE_CAP)`.
Default unchanged; no product caller passes it. Verified the real corpus is reachable from node:
**506 sessions, 547.3 MB** under `~/.claude/projects` (Theseus measured 504 on this machine at 09:17;
+2 since — consistent, not a discrepancy).

Structural fact found by reading the code, and it shaped the whole probe: the browse scan is
**sequential** — `scanClaudeSessions` awaits one file at a time (`session-scanner.ts:271`). So per-file
cost multiplies by corpus size, which is exactly why the cost needed measuring rather than eyeballing.

Two anti-bias decisions recorded before running: warm the page cache with an untimed full-corpus read
pass first (otherwise cap 1500 pays cold I/O and larger caps read from RAM — biased toward the answer
I wanted), and take median of 3 repeats.

## 13:20–13:23 — Measurement

`scripts/probe-scan-latency-vs-cap.mts`. Warm cache, median of 3, full 506-session corpus:

| cap | full scan | turns | capped | bytes read |
|---|---|---|---|---|
| 1500 (shipped) | 1387 ms | 815 (41.2%) | 11/506 | 364.9 MB (66.7%) |
| 3000 | 1522 ms | 1069 | 8/506 | 410.6 MB |
| 5000 | 1665 ms | 1373 | 7/506 | 447.3 MB |
| 10000 | 1959 ms | 1873 | 4/506 | 527.6 MB |
| uncapped | 2032 ms | 1980 (100%) | 0/506 | 547.3 MB |

**Removing the cap: +645 ms, +143% turns.**

Three findings I did not anticipate:

1. **The cap fires on 11/506 files (2.2%) but those hold 58.8% of all turns**, and it already reads
   66.7% of corpus bytes. It spends most of the turn signal to skip a third of the bytes.
2. **No knee.** Marginal cost per turn gained is flat (0.50–0.55 ms/turn at every cap). Intermediate
   caps are dominated; the choice is 1500 or nothing.
3. **Negative result on parallelism.** Added a concurrency arm expecting a promise pool would let
   uncapped-concurrent beat capped-sequential and dissolve the trade. It doesn't: 1370 → 1290 ms at
   width 8, and uncapped 1930 ms at 8 vs 1934 at 16. Work is CPU-bound in one Node thread, not
   I/O-bound. Recorded because I expected the opposite.

## 13:23 — A wrong assumption caught by a failing test

Wrote `round143-scan-cap-latency.test.ts`. Two failures, both mine, both worth recording:

- **Fixture measured 0 turns on a 330-turn session.** `isHumanTurnBoundary` (`parser.ts:257`) requires
  `message.role === 'user'`; my fixtures omitted `role`. The scanner's own event filter doesn't check
  it, so the events counted as messages but never as turns. Fixed the fixtures, not the assertions,
  and left the reason in a comment since it's a trap for the next fixture author.
- **My "turns gain more than events" assertion was the wrong ratio.** `messageCount` skips
  `tool_result` rows (`:175`) while the cap counts *lines* (`:158`). So events-per-turn from
  `messageCount` doesn't price the cap and makes a tool-heavy prefix look turn-dense. Rewrote the test
  to assert on **turns per line** (0.02 before the cut vs 0.50 after, 25x marginal yield). This is a
  real correction to a unit both Theseus and I had been leaning on; it changes neither of our
  conclusions but it's in the memo and the doc.

7/7 pass after the fix.

## 13:24–13:26 — Deliverables and recommendation

- `docs/scan-cap-latency-2026-09-03.md` — full method, table, three findings, honest limits.
- Recommendation stated: **remove the cap or raise it to a ~50000 pathological-file guard.** Notably
  it *dissolves* Iris's open labelling question rather than answering it — Theseus's `11+`-is-useless
  problem only exists while sessions are capped; at 0/506 capped, `turnCount` is exact and the `+`
  goes away.
- **Cap not changed.** The measurement is mine; the latency/accuracy trade is a user-facing product
  call touching Iris's browse UI and Theseus's labelling input. Routed to xian for the ruling rather
  than folded into a probe commit.
- Follow-on flagged, not built: cache fingerprints on `(path, mtime, size)`. That takes steady-state
  browse toward zero and makes the cap question moot at any corpus size. Design change, not a
  measurement fire.

## Test + typecheck results (run this fire, not inherited)

- Server: **1465 passed**, 90 files, 0 failed. Was 1458/89 this morning — delta is exactly my +7.
- Client: **249 passed**, 13 skipped, 0 failed. Unchanged, as expected.
- `npm run typecheck` — clean across shared, server, client.

## Wrap verification

**Step 1 — commits landed.** `git log origin/main --oneline -5`:

```
2dc64a4 round143: measure the scan-latency cost of the fingerprint line cap
2b77ac4 mail: Daedalus -> Theseus, Iris (cap cost measured: +645ms buys +143% turns; removing the cap dissolves the labelling question)
0ba5a09 rollup+coordination+log: browse-count question answered, folded into v98
6dbc639 log: round142 wrap verification block (steps 1+2 output pasted)
efad1bf round142: verify turnCount over the wire, then measure the cap item Daedalus left open
```

**Step 2 — every deliverable `ls -l`'d, all present:**

```
5824 docs/mail/daedalus-to-theseus-iris-cc-...-cap-cost-measured-...-2026-09-03.md
7359 docs/scan-cap-latency-2026-09-03.md
8973 packages/server/src/__tests__/round143-scan-cap-latency.test.ts
8720 scripts/probe-scan-latency-vs-cap.mts
```

**Step 3 —** mail committed separately (`2b77ac4`) and pushed to `main` before the code commit, per
worktree mail discipline, so Theseus and Iris see it without waiting on the rest.

**Delivery:** not claimed beyond what the two pushes above show. The wrapper owns delivery.

## Mail close-discipline

**Nothing moved to `docs/mail/read/`.** Theseus's memo now carries an open item on Iris (the labelling
call, which I've asked her to defer pending the cap ruling) and an open decision on xian (the cap
itself). The Calliope backfill thread still has its live ask. Open threads stay visible.

## Open on this seat, for the next fire

1. **The cap decision** — routed to xian, unanswered as of this fire. If ruled "remove," the change is
   one constant plus a rollup of the `capped`/`+` handling in the browse UI (Iris's side).
2. **The fingerprint cache** `(path, mtime, size)` — flagged, unbuilt, no decision requested yet.
