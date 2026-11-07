# unit-465sizeguard — RESULTS

**Agent:** Theseus · **Date:** 2026-11-07 (START fire) · **Base:** `b4261648`
**Pre-registration:** `2a8b9f75`, pushed as the only file in this directory before any instrument
in it existed (`git ls-tree -r origin/main` over the directory returned one path).
**Driver + C1 cripple:** `55f48262`, committed before being driven. **Drives 1–7:** `8c894499`.
**Arm E + cripple removal + source correction:** `429a8a11`.

## 0. The answer in one line

**The size test is live, and nothing in the repo graded it until this unit.** With it removed, the
cleanup destroys **8,272 bytes** of a live writer's committed frames and the database then refuses
to open for every other reader — and **arms A, B, C and D are all green while that happens**.

**11 predictions registered: 8 HELD, 1 REFUTED, 1 HELD-on-the-predicate-with-its-gloss-refuted,
1 ungradeable as I keyed it.** 2 cripples. 4 unregistered findings, two of them defects of mine.
Gate unchanged: `GATE ok exit=0` on census, typecheck, server, client and the aggregate; server
**143 / 2221 / 1 skipped (2222)**, client **26 / 13 skipped (39)** files and **333 / 13 skipped
(346)** tests.

## 1. Scoreboard

| # | Claim | Verdict |
|---|-------|---------|
| P1 | drive 1: refusal path leaves `-wal:absent -shm:absent` | **HELD** |
| P2 | drive 2: `-wal` present and non-zero after the run | **HELD** — `-wal:8272B` |
| P3 | drive 2: a fresh reader sees the racer's row | **HELD** — `visible` |
| P4 | drive 3: `-wal` absent, sentinel reports `destroyed > 0` | **HELD** — `destroyed 8272B` |
| P5 | drive 3: a fresh reader does not see the racer's row | **HELD on the predicate, gloss REFUTED** — §3 |
| P6 | drive 4: outcome identical to drive 1; cripple invisible without the race | **HELD** |
| P7 | the window needs a padded fixture | **REFUTED** — §4 |
| P8 | verdict unchanged by the concurrent write: exit 1 + refusal line | **HELD** (drives 2, 3) |
| P9 | the concurrent write does not reach `unreadable()` | **HELD** — `unreadable-line false` |
| P10 | drive 2: `-shm` left at 32,768 B, and here that is correct | **HELD** |
| P11 | a padding level ≤ 500 rows is 10/10 | **HELD** — and made moot by §4 |

## 2. The 2×2, read off the recordings

```
drive 1  R off C off  66,678,784B  exit 1  after -wal:absent -shm:absent
drive 2  R on  C off  66,678,784B  exit 1  -wal +340ms  commit +341ms (8272B)  exit +562ms
                                           after -wal:8272B -shm:32768B   row visible
drive 3  R on  C ON   66,678,784B  exit 1  -wal +331ms  commit +332ms (8272B)  exit +550ms
                                           after -wal:absent -shm:absent  row unreadable
                                           sentinel "C1 fired: -wal 8272B -> removing (destroyed 8272B)"
drive 4  R off C ON   66,678,784B  exit 1  after -wal:absent -shm:absent
                                           sentinel "C1 fired: -wal 0B -> removing (destroyed 0B)"
```

Exactly one cell differs, and it is the one the guard lives in. **Drive 4 is the cell that explains
the last two rounds**: the cripple *fires* and destroys 0 B, because without the race there is
nothing in the `-wal` to destroy. That is the same shape as Daedalus's `unit-465armd` drive 2
(`-wal 0B -> 0B (destroyed 0B)`) arriving from the other direction — his fixture could not carry
the property, mine has no fixture in that cell at all — and it is why `unit-465walcell`'s Y2 moved
nothing across 42 arm lines. The guard was never dead. It was unreachable.

**Drive 2 alone proves nothing, and PRE-REGISTRATION §6 said so before the drives.** A commit that
landed *after* the cleanup leaves the same `-wal:8272B` behind. What makes drive 2 a measurement is
drive 3: if the commit had landed late, the cripple would have had nothing to destroy.

## 3. P5's predicate held and my gloss was wrong — the data is not lost, the database is

I registered P5 as *"a fresh read-only connection does not see the racer's row. Not merely a
missing file: committed data gone."* The predicate held. The gloss is **refuted by my own
recording**, which I only caught because the driver prints the reader's error text rather than a
boolean:

```
racer-row(open)   open failed: disk I/O error      ← every crippled drive, 21 of 21
racer-row(closed) visible                          ← every crippled drive, 21 of 21
```

The row is not gone. Removing a live writer's `-wal` makes the database **unopenable for every
other process** — `SQLITE_IOERR`, not a missing row — and when the writer's own connection closes,
it checkpoints the frames back through the file descriptors it still holds and the row returns.
So the damage is **total while the writer is alive and reverts when it exits**, which is worse than
what I predicted in the way that matters operationally (the app is the writer, and the app is what
stays running) and better in the way that matters for recovery.

**Which removal causes it, measured rather than reasoned.** My first draft of this section said the
`-shm` removal was the cause, on the grounds that C1 removes both. That was a hypothesis wearing a
conclusion's clothes, so I built **C2** — the size test removed, the `-shm` **kept** — and drove the
probe under it (`drive13`):

```
4 of 14 regression check(s) FAILED.
  [A] no sidecar beside the refused target — -shm
  [B] no sidecar beside the dry-run target — -shm
  [E] a -wal written inside the window keeps every byte — -wal:8272B committed -> -wal:absent
  [E] another process can still read the database it is writing — unreadable (disk I/O error)
```

**Refuted.** With the `-shm` intact, the reader still gets `disk I/O error`. The unreadability comes
from unlinking the `-wal` under a live writer, full stop. Two things fall out of the same drive:
arms **A and B** turn out to grade the `-shm` removal (they redden the moment it is skipped), and
C2 is therefore a worse cripple than C1 for arm E's purposes and a better one for A and B's.
`drive14` re-drove the same mode after C2 was removed from the source: **14/14 green**, so the gate
variable is inert and the published tree carries no cripple.

## 4. P7 REFUTED — a promoted arm is nearly free, and I was wrong about the mechanism too

I predicted the race needed a padded fixture, and keyed P7 on **cell 5** — `R on, C off`. That is
precisely the cell my own §6 says cannot prove the window was open: `window OPEN` there is printed
off `commitAt > 0`, which is bookkeeping about my own driver, not evidence about the product. **A
defect in my own registration, caught by my own registration**, and the second time this week a
section I wrote to protect me from a vacuous green caught me writing one. Cell 7 was added to grade
it properly — same fixture size, cripple **on**, window keyed on destroyed bytes — after cells 1–5
were driven and before 6 and 7 were.

```
drive 6  500 pad rows  16,732,160B   WINDOW OPEN: 10/10   destroyed 8272B x10
drive 7  no padding        81,920B   WINDOW OPEN: 10/10   destroyed 8272B x10
```

**10/10 with no padding at all** — the probe's own fixture size. P7 refuted, P11 held and moot.

My reasoning was also wrong about where the time goes. The `-wal` appears at **+331–346 ms on every
fixture size**, 81,920 bytes and 66,678,784 bytes alike: that leg is `npx tsx` startup plus the
open, not the copy. What padding buys is the *remainder* of the child's life — 222 ms at 66 MB
versus 43 ms at 82 KB — and 43 ms is already ~40× the 1 ms the racer's commit costs. I had the
right factor and the wrong magnitude.

## 5. Arm E, and why it is keyed on an inode

Promoted into `probe-backfill-sidecar-neutrality.mts` as arm **E**, three checks, graded by the
same cripple **dead in the cells that existed before it and live in the one it adds**:

```
drive 8   probe + C1   [A][B][C][D] ALL GREEN (11 checks)
                       [E] ok   the race state is built — commit landed in the tool's own -wal (ino …)
                       [E] FAIL a -wal written inside the window keeps every byte — 8272B -> -wal:absent
                       [E] FAIL another process can still read the database it is writing — disk I/O error
                       2 of 14 FAILED
drive 9   probe clean  All 14 regression checks passed
drive 10  cripple removed from source, clean      14/14
drive 11  cripple removed from source, C1 set     14/14   (the gate variable is inert)
drive 12  five consecutive clean drives           5/5, 1 attempt each, 2478–2805 ms
```

Arm D grades the **outer** guard, arm E the **inner** one. They are not interchangeable and neither
substitutes for the other.

**The inode is the load-bearing design choice.** A race-shaped arm's failure mode is not a flake —
it is a *green*. If the commit lands after the cleanup, the `-wal` is present and non-zero exactly
as it is on a healthy product, and a byte-keyed assertion cannot tell the two apart. SQLite writes
into the `-wal` the tool's own open created, so the racer's commit landing **in that inode** is what
proves `sidecarsBefore` was captured with it absent and the cleanup had not yet run. A different
inode means the racer made its own file afterwards, and the arm **refuses rather than passes** —
three attempts, then red. This is the third instance of the two-greens-either-side blindness this
probe's history is made of, and the first caught before it shipped rather than after.

Across drives 3, 6, 7 and 8–14 the race state was built **32 times**: 21 keyed on destroyed bytes
and 11 keyed on the inode through the probe. Every one of the 11 that prints an attempt count prints
**1**. The retry loop has never reached its second attempt, let alone its third.

## 6. Unregistered findings

1. **The harm is unreadability, not loss** — §3. Not registered because I predicted the wrong
   failure and the driver's error text caught me.
2. **`racer-row GONE` in drives 1 and 4 is not evidence of anything.** The racer never inserted in
   an `R off` cell, so `GONE` there means "never written", and it sits in the same column as drive
   3's real finding. A `[false, false]` row cannot be told from an untouched defect by looking at
   it. The recording format invites exactly that misreading; this sentence is the fix, since
   re-keying the field would mean re-driving seven cells to say something I can say in a line.
3. **Arms A and B grade the `-shm` removal** (drive 13), which nobody had shown. That is a fact the
   E4/E5 decision now has to hold alongside: A and B hold down "no `-shm` left behind" in the
   both-absent-before state, and E4/E5 are the pre-existing-`-wal` state, which A and B do not
   reach. The nesting is graded in one state and undecided in the other.
4. **The window is startup-dominated** — §4. Worth recording because it means any future arm that
   wants to race this tool does not need a large fixture, and the next agent should not pay 66 MB
   of temp I/O to get one.

## 7. Who has what

* **Mine, closed this fire:** the size guard. Graded, driven, cripple-paired, source sentence
  corrected, `unit-465walcell`'s superseded reading pointed at rather than rewritten. Arm E is in
  the probe; the probe is green at 14/14 and the gate moved by nothing.
* **Daedalus's and Argus's to decide, and the one thing I did not do:** `probe-backfill-sidecar-
  neutrality.mts` is in the sweep's **DEFERRED** list, so **arm E is driven by hand and not by
  `npm test`**. The guard is graded; it is not *gated*. Promotion runs through
  `promote-probes.mts`, and the DEFERRED entry's own note says a hand drive is the reason to
  promote rather than the promotion. Named blocker: it is their instrument and their list, and arm
  E is one fire old. The measurement they need is in §5 — 32 builds, 0 retries consumed, ~0.4 s
  added to a 2.5 s probe, no padding required.
* **Still mine and still a decision, not a tidy-up:** `unit-465walcell` E4/E5, the `-shm` orphan
  when a `-wal` pre-exists. Finding 3 adds to it rather than resolving it.
* **Still open on xian, and I am not re-asking:** the 09-29 step-1 list, the `backups/`
  tracked-vs-ignored half, the March-backup restore from `c945e8aa`.

— Theseus
