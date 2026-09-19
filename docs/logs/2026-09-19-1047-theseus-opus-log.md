# Theseus — 2026-09-19 START fire (10:47 PT)

Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`,
synced to `origin/main` by the wrapper immediately before the fire.

## 10:47 — briefing

- `git log --oneline -5`: head `1b5eb246` (Argus arrival). Three Wave-2 arrival commits from
  Calliope/Daedalus/Argus this morning, plus Daedalus's 9/19 START fire `d7147a2b` and his memo
  `c24c131b`.
- `docs/COORDINATION.md` — my section (line 1438) last updated 2026-09-18 STOP, status **available**.
- `docs/mail/` — **one memo addressed to me, filed 10:47 today**:
  `daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-arm-x-is-green-and-it-violates-the-clause-you-wrote-the-same-fire-2026-09-19.md`.
  Read in full this fire.
- `docs/briefs/cross-pollination/current.md` — 2026-09-19 brief; insight #1 is my own Round 233
  finding routed back. #2 (Piper, write-deletion invisible to an import sweep) and #3 (DinP,
  absence claims must name where the check was made) read.

## 10:50 — the assignment, as I read it

Daedalus landed the `routes/import.ts:106` cwd repair I routed in my 9/18 STOP memo §3. Arm X is
green: 1 of 1 exported sessions reachable under the shipped cwd, where my table read 0 of 1.

His fix made the browse endpoint walk **two** corpora (session roots ∪ the repo's
`exports/sessions`). Three of my arms were written against one:

| probe | arm | claim | why it went red |
|---|---|---|---|
| `probe-round233-…-different-corpora.mts` | **B** | every session the endpoint returned lives under the shipped resolver's roots | the 9th session is the export, under no session root |
| `probe-browse-latency-end-to-end.mts` (subject) | **Q** | arm M fingerprinted every file the browse endpoint walked | arm M sums session roots only; endpoint returned 9, arm M summed 8 |
| `probe-round233-…` | **A** | the subject reports its own corpus guard green and exits 0 | downstream of arm Q |
| `probe-round227-arm-o-…-cap-fires.mts` | **C** | the endpoint returns the synthetic corpus, and nothing else | same 9th session |

He did not touch my probes (`git status --porcelain` clean but his four files) and asked for my word
before proposing a repair. He is right that the guard firing is correct behaviour — arm Q caught a
real population change. The repair is to the arms' closed-world premise, not to the guard's strictness.

His §5 rule is the one I want to carry: *an asymmetry clause is a closed-world claim.* My 9/18 §2
said the dedup "can never return one arm M did not sum." The fix in the same fire added exactly one.

**Plan for this fire:** reproduce all three reds against his landed commit first (I do not repair an
arm I have not personally seen fail), then repair, then re-drive. Nothing claimed before it is driven.

## 10:49 — reproduced, all three, before touching anything

`probe-round233-…` → **2 of 8 FAIL** (`.testdata/r234-repro-233.txt`): arm B `9 session(s) at the
wire; 8/9 under getSessionRoots()`, arm A carrying `FAIL [Q] … endpoint returned 9 … arm M
fingerprinted 8`. `probe-round227-…` → **1 of 14 FAIL** (`.testdata/r234-repro-227.txt`): arm C
`9 sessions across 2 projects (expect 8 / 1)`. Daedalus's report matches to the arm and the count.

Verified his fix is what I'm testing against: `packages/server/src/paths.ts` exists,
`routes/import.ts:106` reads `scanExportedSessions(getProjectRoot())`.

## 10:55 — repair 1, subject arm M

`corpusFiles()` now appends `exportedCorpusFiles()` — `<getProjectRoot()>/exports/sessions`, flat,
`.jsonl`, `size >= 100`, mirroring `session-scanner.ts:639-650`. Resolved through the shipped
`getProjectRoot`, not a second literal. Arm M's skip message and arm Q's detail now name **both**
roots via a new `corpusRoots()` — an emptiness claim that doesn't say where it looked is the failure
mode this fire is about (and today's cross-pollination brief item #3).

Arm Q left strict. Wrote the closed-world correction into the arm's own comment block, next to the
clause that was wrong.

Driven: strict typecheck 0 errors; `probe-round233-…` → arm A **PASS, exit 0**, arm Q `9 … 9 … 0
walked-but-not-summed`. Still 1 FAIL (arm B).

## 11:00 — repairs 2 and 3

Arm B restated: *came from a root the server resolves*, export dir enumerated, unaccounted paths
named rather than counted. Arm X's detail text still described `scanExportedSessions(process.cwd())`
— stale in a **green** arm's output, fixed.

Round 227: arm C restated as a **file-set** comparison against `walkedFiles`. Larger than the red arm
— B/E/F/G were summing 8 files against endpoint timings over 9, the Round 233 defect passing quietly
in a second probe. Arm A keeps the synthetic fixture.

Driven: `probe-round233-…` **All 8 passed**; `probe-round227-…` **All 14 passed**. Arm F's remainder
`42 ms → 18 ms` as the sum rose 166 → 193 ms — the 24 ms was the export's fingerprint cost.

## 11:05 — arm O: the pass had zero margin, so I sampled it

First re-drive: arm O `residual 5 ms against a 2σ band of ±5 ms`. Took four more samples of identical
code against the identical corpus (`.testdata/r234-subject-sample-{3,4,5}.txt`, plus runs 1–2):

| run | fp Δ | endpoint Δ | residual | band | verdict |
|---|---|---|---|---|---|
| 1 | +103 | +98 | 5 | ±5 | PASS |
| 2 | +112 | +98 | 14 | ±4 | **FAIL** |
| 3 | +102 | +121 | 19 | ±35 | PASS |
| 4 | +114 | +80 | 34 | ±19 | **FAIL** |
| 5 | +101 | +84 | 17 | ±21 | PASS |

**2 of 5 fail**, and the grading is inverted: run 2 agreed *better* (14 ms) and failed; run 3 agreed
*worse* (19 ms) and passed. Band range ±4 → ±35 ms (**8.75×**) on identical input; across-run 2σ of
the residual **18.8 ms** vs narrowest band **4 ms**. The band is a within-run standard error — repeats
sharing a process, page cache and thermal state — so it measures precision, not reproducibility, and
punishes the quiet run.

Not fixed. Widening a band because it failed twice is the move I declined for arm Q an hour earlier.
Recorded with the numbers and left open for its own round.

**Correction filed against myself:** my 9/18 close of the cap-firing item cited arm O green at
"residual 10 ms vs ±24 ms" as if it were a stable grade. It was one sample of a 2-in-5 failure. The
conclusion survives; the confidence I attached to it didn't.

## 11:10 — Daedalus's parked isolation question, answered

`paths.ts` reads **no `process.env`**; `scanExportedSessions` has **one** call site, handed
`getProjectRoot()`; the three env vars the scanner honors all feed the session-root side. **No lever
exists** to relocate or suppress the export corpus. So `CLAUDE_CONFIG_DIR` relocation was complete
isolation only while the export scan was broken — his fix removed a property every relocating probe
relied on and none asserted. Routed to him and xian; the fix option is server code, not mine to take.

## 11:12 — controls

| | |
|---|---|
| server suite | **120 files · 1892 passed · 1 skipped** — matches Daedalus's Round 234 figure |
| client suite | **38 files (25 passed · 13 skipped) · 324 passed · 13 skipped** |
| `npm test` | **exit 0, unpiped to a file**, both summaries read directly (not tailed) |
| `npm run typecheck` | **0 errors** ×3 workspaces |
| strict typecheck, 3 changed probes | **0 errors** each |
| port 3001 / stray processes | **quiet / 0** — enumerated from `ps` via node, not pkill |
| repo `klatch.db` | **2 channels / 0 `probe-seed-%`** either side |
| `session-scanner.ts` sha | `e2c7445e12a5` before and after every run |
| production code | **untouched** — 3 probe scripts only |
| model calls | **0** |

## Wrap verification

**Step 1 — commits on `origin/main`** (`git log origin/main --oneline -3`):

```
dc24ab18 round234+coordination+log: Theseus 9/19 START -- all three arms Daedalus's export-scan fix turned red are repaired and green; Round 227 needed B/E/F/G too (8 summed vs 9 walked); arm O fails 2 runs in 5 and grades the better-agreeing run as the failure; export corpus has no isolation lever
43d7c5c6 mail: Theseus -> Daedalus (cc team) -- Round 234, all three arms repaired; arm O fails 2 runs in 5 and grades the quieter run harder
1b5eb246 coordination+log: Argus arrival -- Wave 2 renewal, handoff read, Round 234 flagged as live front
```

Push output: `43d7c5c6..dc24ab18  HEAD -> main`. Mail committed and pushed **separately and first**
(`1b5eb246..43d7c5c6`), per the worktree mail rule.

**Step 2 — each deliverable exists** (`ls`):

```
docs/research/round234-a-within-run-standard-error-…-2026-09-19.md   11617 B
docs/mail/theseus-to-daedalus-…-arm-o-fails-two-runs-in-five-…md      8577 B
docs/logs/2026-09-19-1047-theseus-opus-log.md                         7659 B
scripts/probe-browse-latency-end-to-end.mts                          58764 B  (modified)
scripts/probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts     30712 B  (modified)
scripts/probe-round233-…-different-corpora.mts                       29970 B  (modified)
```

**Step 3 — this log's wrap section committed and pushed last.**

### Open at end of fire

- **Arm O's band is the wrong band** — §5 of the research doc. Mine, needs its own round. Until then,
  **"arm O green" is not reportable from a single run** — three runs, or say you didn't.
- **Export-corpus isolation has no mechanism** — routed to Daedalus and xian. The server-side option
  (a root override for `scanExportedSessions`) is production code and not mine to take unilaterally.
- **`files/storage.ts:38`** — Daedalus's find, parked on xian. Untouched by me; I agree it is not a
  drive-by.
- **Why `tsx` runs `exit` listeners on a signal death plain node doesn't** — still mine, unmoved this
  fire, no third mechanism proposed.
- **Parked on xian:** backfill dry run (ten days), `DELETE /entities/:id` floor.
- **Gate:** `amber-fleet.sh gate` not attempted this fire; last three fires refused from this seat and
  Daedalus reports the same position today.
