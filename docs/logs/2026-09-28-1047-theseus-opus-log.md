# Theseus session log — 2026-09-28 (START fire, ~10:47 PT)

Seat: Theseus Prime (manual testing & exploration — CLI side)
Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`
Round: 288

## 10:47 — Session start, briefing

- `git log --oneline -3`: `49a378fc`, `0044abbe`, `a588c1f1` — all Daedalus, Round 287, this morning.
- Mail: one new memo addressed to me,
  `docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-your-db-judgement-could-not-be-made-because-the-sandbox-could-not-see-the-one-file-git-cannot-restore-2026-09-28.md`
  (Round 287). Read in full.
- My last round from this seat was 286 (2026-09-27 ~20:15). No Theseus log existed for 2026-09-28
  before this file.

Daedalus took my Round 286 §6 first item (the forced-drive judgement on the `db`-flagged DEFERRED
probes) and reported that the judgement could not be made as framed, because `drive()` set `HOME`
and not `KLATCH_DB` and the only write-detector was git-shaped over `scripts/` + `packages/`. He
built `scripts/lib/db-sentinel.mts`, predicate 8, and `probe-round287`.

## 10:50 — What I am taking this fire

The claim I want to test is not any of his figures — it is the one he did **not** make: that
predicate 8 can go red. §2 of his own memo names the vacuous-check family ("an arm that would
assert a presence it is structurally incapable of observing, and go *green* forever"). Reading
`probe-round287`'s 24 arms: A1/A2 pin the graded set non-empty, G4 and H2 pin that a drive did
**not** move a graded database. **No arm shows the driver reporting a graded database that DID
move.** Every arm that exercises movement (C1, D1–D3) does so against the module in-process; none
goes through `drive()`, which is where `DriveResult.db` — predicate 8's only input — is computed.

If `drive()` wired the sentinel up wrongly (snapshot order, graded-vs-scratch swap, wrong field),
predicate 8 would be green forever and all 24 arms would still pass. That is the missing known
positive, and it is the same shape as the finding he is reporting.

## 10:52 — Measurements first, on this tree

`snapshot(REPO)` via a throwaway script (since deleted):

```
graded=3 scratch=307
  graded · klatch.db · 1536000 bytes · hashed=true
  graded · klatch.db-shm · 32768 bytes · hashed=true
  graded · klatch.db-wal · 0 bytes · hashed=true
database files under PRUNED directories (invisible to the sentinel): 0
```

Daedalus's graded 3 is `klatch.db` + two orphan `sizing-copy` sidecars; mine is `klatch.db` + its
own two live sidecars. **The figure agrees across trees and its members do not** — worth catching
before "graded = 3" hardens into a fleet constant. Scratch is 307 here against his 273; also
worktree-local.

The PRUNE-list control (`node_modules`, `.git`, `dist`, `.claude`) reads 0, so the prune list costs
no coverage today. Recorded as a measurement, not a reassurance.

## 10:54 — probe-round288 built, and one arm came out the other way

`scripts/probe-round288-predicate-8s-red-branch-had-never-been-observed-to-fire.mts`.

First run: **14/14, exit 0**. Arms P0/P1/P3/P4 are the known positive and its two controls, driven
through the real exported `drive()`:

```
[P1] pass  run.db: changed: zz-round288-graded-canary.db · child exit 0
[P3] pass  run.db: appeared: zz-round288-graded-newcomer.db
[P0] pass  run.db: unchanged · child exit 0                (quiet child — control)
[P4] pass  run.db: unchanged · run.dbScratch: changed: .testdata/r288/scratch-target.db
```

Then W2 bothered me: it observed the sidecars **appearing**, because SQLite removes them when the
last connection closes. That is not the live case — `klatch.db-shm` exists on this tree right now.
Added W5/W6 for the case that matters: sidecars already present, a further reader arrives.

**W6 FAILED on its first run, and that is the finding.** `-shm sha fd4c9fda9cd3f9ae →
fd4c9fda9cd3f9ae` across a read-only open with a holder connection live. My hypothesis — "any
concurrent reader reddens predicate 8" — is **false**. Inverted W6 to assert the refutation and
added W7 for the narrowed claim:

```
[W6] pass  with the sidecars ALREADY present, a further read-only open does NOT move the -shm
[W7] pass  the sidecars VANISH when the last connection closes
```

So the exposure is the **transition**, not the traffic: a holder acquiring or releasing `klatch.db`
mid-drive. Went back and corrected the probe header and the Y2 detail string, both of which still
carried the broad version. Final: **17 checks · 0 failed · exit 0**.

## 10:56 — Re-deriving Daedalus's §5, and a correction that is mine

Independent scan with a **broader** detector than his (reads for the conclusion line itself, however
produced, rather than for the helper import):

```
DEFERRED total: 100
db-flagged (any combination): 76        ← WRONG, see below
db-ONLY (db is the sole hazard): 29
  of the db-only set, able to emit a conclusion line (BROAD detector): 0
```

76 disagreed with `promote-probes --list`, which reads:

```
promote-probes — 118 probe files · 18 SWEPT · 100 DEFERRED
  hazard-clean DEFERRED candidates: 3
  not driven (db): 75
```

Chased it rather than picking a number. Cause: I hand-copied the `DETECTORS` block instead of
importing `hazards()`, and `hazards()` blanks comments before matching (`stripSource(src, false)`).
So one file's prose voted. Re-ran importing the real export: **75**, matching `--list` exactly.
`db-only` stayed 29 and conclusion-capable stayed 0.

**Daedalus's 29-of-29 stands, corroborated by an instrument that could have found more.** The
correction is mine and its lesson is new: not a regex written wrong, but a correct regex applied
without the normalisation that goes with it. *Import the constant, never re-type it.*

## 10:55 — Gate, no pipe

`npm test > .testdata/r288-gate.txt 2>&1`, exit 0, file verified present (52077 bytes):

```
Test Files  140 passed (140)                    ← server
     Tests  2174 passed | 1 skipped (2175)
Test Files  25 passed | 13 skipped (38)         ← client
     Tests  324 passed | 13 skipped (337)
sweep-probes — 118 probe files under scripts/
  swept:    18
  deferred: 100
CENSUS OK — every probe under scripts/ is in exactly one list, and every entry agrees with its own pin.
```

Server and client byte-identical to Daedalus's Round 287 §6. Census moved by exactly my one file
(117→118, deferred 99→100), classified DEFERRED in the same commit as the probe.

## 11:05 — Session wrap verification

Commit `b904fb23` pushed to `origin/main` before the memo was written (incremental push, per the
stranded-worktree rule). Verification of all deliverables below.

Discipline for the fire: no port bound, no model call, no network beyond git. **No database outside
`.testdata/` was opened, read or written** — `klatch.db` was hashed and nothing else. Two gitignored
`zz-round288-*.db` files existed at the repo root for the duration of the P arms and were removed in
a `finally` (arm Y3 pins their absence); they have to be at the root because "graded" is *defined* as
outside `.testdata/`. Both throwaway measurement scripts deleted. Every figure above is from a
redirect to a file or from direct tool output; nothing was piped.

## 11:00 — Session wrap verification (CLAUDE.md protocol)

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -5
865efacf coord+log+mail: Round 288 — predicate 8's red branch, and no third list
b904fb23 Round 288: predicate 8's red branch had never been observed to fire
49a378fc log: Round 287 session wrap verification — gate/sweep/round285 re-driven post-change
0044abbe coord+log+mail: Round 287 — predicate 8, and the db class's yield is zero
a588c1f1 Round 287: predicate 8 — the sandbox could not see the one file git cannot restore
```

**Step 2 — every deliverable present in the `origin/main` tree** (`git ls-tree -r origin/main`,
not a local `ls` — the memo-is-not-a-delivery rule):

```
docs/COORDINATION.md
docs/logs/2026-09-28-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-predicate-8-works-and-its-red-branch-had-never-been-observed-to-fire-2026-09-28.md
scripts/probe-round288-predicate-8s-red-branch-had-never-been-observed-to-fire.mts
scripts/sweep-probes.mjs
```

All five present. (This log file is amended and pushed after this block, per Step 3.)

**Re-driven post-change, on the committed files, no pipe:**

```
$ npx tsx scripts/probe-round288-…mts > .testdata/r288-final.txt   → exit 0
All 17 regression checks passed.

$ node scripts/sweep-probes.mjs --census > .testdata/r288-census.txt → exit 0
sweep-probes — 118 probe files under scripts/
  swept:    18
  deferred: 100
CENSUS OK — every probe under scripts/ is in exactly one list, and every entry agrees with its own pin.
```

The probe's final 17/17 is on the file as committed, after the header and Y2 corrections — the
earlier 17/17 was on a tree that still carried the broad W6 claim in prose, so it is re-driven here
rather than inherited.

`git status --porcelain` is empty: nothing uncommitted, and both `zz-round288-*.db` fixtures and both
throwaway measurement scripts are gone.

**Nothing opened this fire that it could not finish.** The two items I handed back to Daedalus (the
predicate 8 sidecar-transition message, and closing P2's last inch via an `evaluate()` export or a
hazardous DEFERRED fixture) are named in the memo §7 as his, not started by me, and neither is
claimed as done.
