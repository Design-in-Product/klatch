---
agent: Theseus
date: 2026-11-07
model: claude-opus-5
---

# 2026-11-07 — Theseus session log

## 10:4x — START fire open, briefing

Pulled; worktree synced by the wrapper, `HEAD` == `origin/main` == `b4261648` (Daedalus's own
START-fire wrap commit). Tree clean. Read `docs/COORDINATION.md` (my section at `:4386`), listed
`docs/mail/`.

**No `2026-11-07-theseus-log.md` existed** — four other agents' logs for today did
(`argus`, `calliope`, `daedalus`, `iris`), so this is my first fire of the day and this file is new,
per the one-file-per-agent-per-day convention.

**Mail addressed to me, read in full in the same turn as the listing:**

1. `daedalus-to-theseus-cc-…-both-your-routed-items-are-cured-arm-d-was-ungradeable-not-blind-and-your-fix-as-written-reddens-on-a-healthy-product-2026-11-07.md`. Both of my routed §7 items cured
   and driven. His §1 goes further than my §4.2 did: arm D's fixture built its `-wal` with
   `writeFileSync(p + '-wal', '')` — **zero bytes** — so the arm was not weak but *ungradeable*. His
   §2 refutes my suggested fix as written (one byte check spanning both sidecars reddens on a
   healthy product, because the `-shm` legitimately moves 0 B → 32,768 B). Taken; he is right.
2. Calliope, 11-05 and 11-06 — both informational, nothing asked of me. Left live rather than moved:
   their boarded items are still open on xian, and they are addressed to agents other than me.

**His §5 listed one thing as nobody's:** *"Still ungraded, and neither of us should cite it as
measured: the size guard at the cleanup site. Your Y2 found it dead; X1 doesn't grade it either."*
The product source says the same thing about itself. That is the unclaimed, gradeable item on the
board, and grading a guard nothing reaches is this seat's work. Took it.

## 10:5x — pilot, declared as a pilot

Before registering anything: is the state even buildable? The source's own claim is that a non-zero
`-wal` at the cleanup can only come from another process *between the open and the close*. Window is
`:608` capture → `:611` read-only open → `:627` `await source.backup(...)` → `:691` cleanup.

`.scratch/u465sg/pilot.mts` (gitignored, not an instrument, not cited as a result): 66,678,784-byte
seeded WAL db, sidecars removed, tool spawned `--apply --no-migrate`, poll for the tool's own
`-wal`, one committed row from a second connection held open.

```
-wal appeared at +367ms (0B), commit done at +367ms, -wal now 8272B
child exit 1 at +615ms
after: -wal 8272B  -shm 32768B
```

Buildable, ~248 ms of slack. That is the pilot's whole contribution; its figures are superseded by
the driver's, because a feasibility run is not a measurement of its own subject.

## 11:0x — pre-registration, pushed as the only file in the directory

`docs/research/unit-465sizeguard-2026-11-07/PRE-REGISTRATION.md`, commit `2a8b9f75`. Verified rather
than asserted: `git ls-tree -r origin/main` over the directory returned **one** path.

2×2 over {race, cripple}, 11 predictions. §6 names the failure mode I was most exposed to — a
**vacuous green in drive 2**, because a commit landing after the cleanup leaves the same non-zero
`-wal`. That section is why drive 3 is load-bearing twice: it grades the guard, and it is the only
evidence drive 2's green is about the guard at all.

## 11:1x — driver and C1, committed before being driven

`55f48262`. Two instrument rules obeyed because Daedalus paid for them this morning: `spawn` with
both child streams echoed into the recording (his defects 1 and 2 — `execFileSync` drops stderr on
a run exiting 0, and the probe captures streams into a local it never echoes), and an empty sentinel
recorded as **"cannot say"**, never as "did not fire" (his defect 3, false on every drive of one
arm).

## 11:2x–11:4x — drives 1–7

```
drive 1  R off C off  66,678,784B  after -wal:absent -shm:absent
drive 2  R on  C off               after -wal:8272B -shm:32768B   row visible
drive 3  R on  C ON                after -wal:absent -shm:absent  row unreadable
                                   sentinel "C1 fired: -wal 8272B -> removing (destroyed 8272B)"
drive 4  R off C ON                sentinel "C1 fired: -wal 0B -> removing (destroyed 0B)"
drive 6  500 pad rows  16,732,160B WINDOW OPEN 10/10
drive 7  no padding        81,920B WINDOW OPEN 10/10
```

**The guard is live.** 8,272 bytes of a live writer's committed frames destroyed with the test
removed. **Drive 4 is the cell that explains two rounds of "ungraded":** the cripple fires and
destroys **0 B**, because without the race there is nothing in the `-wal` to destroy. Same shape as
Daedalus's `unit-465armd` drive 2 from the other direction.

**Drive 5 caught a defect in my own registration.** P7 was keyed on cell 5 — `R on, C off` — which
is exactly the cell my own §6 says cannot prove the window was open: `window OPEN` there prints off
`commitAt > 0`, bookkeeping about my driver rather than evidence about the product. Added cell 7
(same fixture size, cripple on, window keyed on destroyed bytes) to grade it properly, after cells
1–5 were driven and before 6 and 7 were; the drive numbering and RESULTS §4 say so rather than
leaving it tidy and unmentioned.

**P7 REFUTED, in the cheap direction.** 10/10 at the probe's own fixture size, **no padding**. And
my mechanism was wrong too: the `-wal` appears at **+331–346 ms on both sizes** — that leg is
`npx tsx` startup plus the open, not the copy. Padding buys the remainder of the child's life
(222 ms at 66 MB, 43 ms at 82 KB), and 43 ms is already ~40× the 1 ms the commit costs.

## 11:5x — arm E promoted into the probe, and why it is keyed on an inode

A race-shaped arm's failure mode is a **green**, not a flake. So arm E is keyed on the `-wal`'s
**inode**: SQLite writes into the file the tool's own open created, so the racer's commit landing in
*that* inode proves `sidecarsBefore` was captured with it absent and the cleanup had not yet run. A
different inode means the racer made its own file afterwards, and the arm **refuses rather than
passes** — three attempts, then red. Would have been the fourth instance of the two-greens-either-
side shape, built by me, into a file four agents run; first one caught before shipping.

Graded the way every arm this round was — the same cripple, dead in the cells that existed before it
and live in the one it adds:

```
drive 8   probe + C1   [A][B][C][D] ALL GREEN (11 checks); [E] 2 of 3 red;  2 of 14 FAILED
drive 9   probe clean  14/14
drive 10  cripple removed from source, clean   14/14
drive 11  cripple removed from source, C1 set  14/14   (the gate variable is inert)
drive 12  five consecutive clean drives        5/5, 1 attempt each, 2,478–2,805 ms
```

## 12:0x — C2, because my draft had a hypothesis wearing a conclusion's clothes

My first draft of RESULTS §3 said the `-shm` removal is what makes the database unreadable, on the
grounds that C1 removes both. Not measured. Built **C2** — size test removed, `-shm` **kept** — and
drove the probe under it (`drive13`):

```
4 of 14 FAILED
  [A] no sidecar beside the refused target — -shm
  [B] no sidecar beside the dry-run target — -shm
  [E] a -wal written inside the window keeps every byte — -wal:8272B committed -> -wal:absent
  [E] another process can still read the database it is writing — unreadable (disk I/O error)
```

**Refuted.** With the `-shm` intact the reader still gets `disk I/O error`, so it is the `-wal`
unlink alone. Two things out of the same drive: **arms A and B grade the `-shm` removal**, which
nobody had shown and which the E4/E5 ordering decision now has to hold alongside; and `drive14`
re-drove the same mode after C2 was removed from source at **14/14**, so the published tree carries
no cripple and the gate variable is inert.

**And P5's gloss was wrong.** I registered *"committed data gone."* 21 reps of 21 say
`racer-row(open) open failed: disk I/O error` / `racer-row(closed) visible` — the row is **not**
lost. The database becomes unopenable for every *other* process, and when the writer's own
connection closes it checkpoints the frames back through the descriptors it still holds. Worse than
predicted operationally (the app is the writer, and the app is what stays running), better for
recovery. Counted with `grep -c`, 21/21 on both lines and 21 `destroyed 8272B` lines, before
publishing the figure.

## 12:1x — two false sentences, one of them mine

- The source comment's *"The size test is kept and is **NOT graded by anything**"* is now false.
  Replaced with what grades it, what the cripple destroys, and why the inode rather than timing.
- `unit-465walcell-2026-11-06/RESULTS.md:122` — *"The size test is therefore ungraded, and nobody
  should cite it as measured."* Correct on the day, wrong now. Carries a **superseded-note** rather
  than a rewrite: the Y2 figures stand (42 arm lines byte-identical) and a round's reading of its
  own recordings is part of the record; the pointer is there so nobody cites the sentence without
  the correction. Censused with `grep -rn` over `scripts/ docs/ packages/` for both spellings — two
  sites, both handled, no third.

## 12:2x — mail out, mail closed

Memo to Daedalus and Argus, separate commit pushed to `main` on its own per the worktree mail rule:
`theseus-to-daedalus-argus-cc-…-the-size-guard-is-live-not-dead-it-was-unreachable-and-the-harm-is-unreadability-rather-than-loss-2026-11-07.md`.

Closed the superseded 11-06 Daedalus/Theseus pair into `read/`. Counted with `readdirSync`:
**70 live / 1185 read** before, **68 / 1187** after. Balances against yesterday's 68/1185 exactly —
the +2 live is his 11-07 memo and my reply. Today's pair left live (E4/E5 and the promotion decision
are open in it).

**Drain:** mail read, answered and closed in the same fire; the one item his §5 left unclaimed
taken, built, graded, cured, landed and gated; three defects of my own caught by my own
pre-registration and recordings, written down rather than folded into a HELD; one item routed with a
**named** blocker — the probe is in the sweep's DEFERRED list, so the guard is **graded but not
gated**, and promotion is Daedalus's instrument and Argus's list, their own DEFERRED entry saying a
hand drive is the reason to promote rather than the promotion. Nothing deferred to "later". The
three items standing on xian are unchanged and I am not re-asking them.

## Wrap verification

**Step 1 — my commits on `origin/main`.**

```
$ git log origin/main --oneline --author=Theseus --since="2026-11-07 00:00"
bedbe017 mail: close the superseded 11-06 Daedalus/Theseus pair — both carried forward in today's who-has-what
63655951 mail: Theseus -> Daedalus, Argus — the size guard was unreachable rather than dead, and arm E grades it
17ff180c unit-465sizeguard: RESULTS + C2 — the guard is live, and the harm is unreadability rather than loss
429a8a11 unit-465sizeguard: arm E promoted into the probe, cripple removed, source sentence corrected
8c894499 unit-465sizeguard: drives 1-7 — the guard is live, and the window is free to build
55f48262 unit-465sizeguard: driver + env-gated C1 cripple, committed before being driven
2a8b9f75 unit-465sizeguard: pre-registration — the race is the only state the size guard can fire in, and no existing fixture builds it
```

**Step 2 — every deliverable by path, read off `origin/main` rather than off the worktree.**

`git ls-tree -r origin/main` over the unit directory returned **33** files: `PRE-REGISTRATION.md`,
`RESULTS.md`, three instruments (`drive-sizeguard.mts`, `drive-probe.mts`, `stability-5.mjs`) and
`drive1`–`drive14` as `.out`/`.err` pairs — 2 + 3 + 28 = 33, and no scratch. A second `ls-tree` over
the eight named paths outside it — `scripts/probe-backfill-sidecar-neutrality.mts`,
`scripts/backfill-entity-bindings.mts`, `docs/research/unit-465walcell-2026-11-06/RESULTS.md`,
`docs/COORDINATION.md`, this log, the outbound memo, and the two closed memos under `docs/mail/read/`
— returned all eight. **41 asked for, 41 returned.**

**Step 2b — the cripples are actually gone from the published tree, read off the remote blob and
not off my worktree.** `git show origin/main:scripts/backfill-entity-bindings.mts` grepped for
`KLATCH_U465SG` and for the crippled branch conditions: **0 matches**, and the cleanup block as
pushed is

```
706:    const wal = fs.existsSync(dbPath + '-wal') ? fs.statSync(dbPath + '-wal').size : 0;
707-    if (wal === 0) {
708-      fs.rmSync(dbPath + '-wal', { force: true });
709-      if (!sidecarsBefore['-shm']) fs.rmSync(dbPath + '-shm', { force: true });
710-    }
```

which is the shipped form, unchanged by this unit. `drive11` and `drive14` are the behavioural half
of the same claim — both gate variables set, both at 14/14 — and neither of them is evidence on its
own: *a declared cripple no hook reads runs clean*. The reach evidence is `drive 8` and `drive 13`,
same variables, cripple present, red.

`git status --short` otherwise clean. The arms' temp databases live under `os.tmpdir()`; the pilot
and the commit-message files are under the gitignored `.scratch/`, and nothing from either was
staged — every commit in this fire staged **by name**, not by directory, which is the half I got
wrong yesterday.

**Step 3** — this log's own commit lands after the lines above were read off the remote.
