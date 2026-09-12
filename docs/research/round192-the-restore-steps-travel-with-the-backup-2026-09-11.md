# Round 192 — the restore steps travel with the backup, and the apply ends the same way whether or not the app is up

**Daedalus · 2026-09-11 (STOP fire) · baseline `67fa5b64`**
**Input:** Theseus's Round 191 (`docs/research/round191-restoring-the-backup-the-way-a-person-does-2026-09-11.md`)
**Instruments:** `scripts/probe-round192-what-a-wal-beside-the-database-says.mjs` (committed — it is the
one measurement another seat will want to re-run); `.testdata/r192-cli-voice.mjs`, `.testdata/r192-negctl.mjs`
(gitignored, per the convention the earlier rounds' controls follow)

---

## 0. For xian

Theseus's three lines still hold, and the tool now says them itself:

1. **Stop `npm run dev` before any `--apply`.** If you don't, the run now prints a note saying so.
2. **To undo an apply, prefer `--undo`.**
3. **If you ever copy the backup back by hand:** stop the app, delete `klatch.db-wal` and `klatch.db-shm`,
   then copy. The CLI now prints those exact steps, with your paths filled in, every time it names a backup.

One thing changed underneath, and it is the reason line 3's failure existed at all: **an `--apply` now
empties the write-ahead log before it exits**, so the database file it leaves is the same whether or not
something else had it open. On Theseus's rig that turns two of his three open arms into passes — a plain
`cp` of the backup now works both with the server stopped and with it still running. The third arm (the
app used heavily *between* the apply and the copy) is unchanged and still needs the sidecars deleted.

**Nothing here touches the dry run.** The one item on your seat is still the dry run against the real
`klatch.db`.

## 1. Reproduced first

Theseus's probes, unmodified, on `67fa5b64`, from my seat before anything was touched:

| Probe | My run | His memo |
|---|---|---|
| R189 (re-vehicled) | **14 · 0 failed · 0 open · 4** | 14 · 0 · 0 · 4 |
| R187 | **11 · 0 · 0 · 4** | 11 · 0 · 0 · 4 |
| R185 | **15 · 0 · 0 · 3** | 15 · 0 · 0 · 3 |
| R191 | **11 · 0 · 3 open · 7** (K1, L1, H1) | 11 · 0 · 3 · 7 |

His numbers reproduce exactly, R191 included. That baseline run is also this round's negative control for
the checkpoint (§4).

## 2. What I measured before designing

`scripts/probe-round192-what-a-wal-beside-the-database-says.mjs`, a scratch DB in tmp, zero model calls:

```
after create+insert (still open)       db=4096 wal=12392 shm=32768
after TRUNCATE checkpoint (still open) db=8192 wal=0     shm=32768
after close                            db=8192 wal=-1    shm=-1
read-only open + select                db=8192 wal=0     shm=32768
after read-only close                  db=8192 wal=0     shm=32768
writer closed, holder still open       db=8192 wal=4152  shm=32768
TRUNCATE, idle holder open     -> [{"busy":0,"log":0,"checkpointed":0}]
after that checkpoint                  db=8192 wal=0     shm=32768
TRUNCATE, holder in a read txn -> [{"busy":1,"log":1,"checkpointed":0}]
```

Three results, two of which changed the design:

1. **A read-only open creates a zero-length `-wal` and a 32KB `-shm`, and leaves both behind on close.**
   So neither sidecar *existing* is evidence of anything — this script's own dry run creates them. Only a
   **non-zero** `-wal` says something, and what it says is "there are committed frames nothing has
   checkpointed", which does not distinguish a live server from a crash.
2. **Theseus's shape 2 is not available by the route he named, and his caution was right.** A
   `wal_checkpoint(TRUNCATE)` with an *idle* second connection open returns `busy: 0` and empties the WAL.
   It only reports busy against a connection inside an open read transaction. **There is no checkpoint-based
   test that detects an idle server**, so "refuse `--apply` while another connection holds the database"
   has no detector here. Item closed as measured-and-unavailable, not deferred.
3. **The same fact read the other way is a fix.** A TRUNCATE checkpoint *succeeds* with another connection
   open. Round 191's K arm exists because SQLite checkpoints when the **last** connection closes: with the
   dev server also holding the file, the CLI's exit is not the last close, and the run's frames stay in the
   WAL. Doing the checkpoint ourselves removes the branch.

## 3. What shipped

**Shape 1, adopted as Theseus recommended, with one site narrowed.**

`restoreInstructions(dbPath, backupPath)` is new in `packages/server/src/db/entity-backfill.ts` — one source,
next to the undo logic and reachable by the unit tests, rather than three copies in the CLI. That is the same
move Round 169 made on `FLOOR_REPORT` one level up, for the same reason: aligning three copies leaves three
copies. It prints, with the operator's real paths single-quoted so a pasted line survives a space:

```
To put that file back by hand, stop the app and delete the sidecars first. A plain copy while
something still holds the database open restores nothing — the app goes on reading the run — and
after further use it can leave a database SQLite calls malformed (Theseus's Round 191):
  1. stop `npm run dev`, and anything else holding this database open
  2. rm -f '<db>-wal' '<db>-shm'
  3. cp '<backup>' '<db>'
  4. re-run this script with no flags: the `Candidates:` line should read as it did before the run
```

Printed at all three sites that name a backup — the apply's `Backup (taken before anything was written)`,
the undo's, and the catch that prints `The backup from before this run is intact at:` — plus the CLI header.
The catch is the one that matters most: Round 191's H arm is a database a hand copy already corrupted, undo
exits there on it, and his H2 showed those four steps are that arm's only way back.

**The one site of his I did not take, and why.** He asked for the same change "wherever `(a restored
backup?)` is printed". I read the classifier rather than assuming, and that sentence only prints when the
restore **already succeeded**: a failed hand copy leaves the database in the post-run state, where the
record's agent is still seated and the disposition is `revert`, not `changed-since` (his K1 measured exactly
that — `--undo` reverted all four). A corrupt one exits at the catch, which does print the steps. So the
diagnosis line names a restore that worked, and restore steps under it would be noise. The steps belong at
the sites that **offer** a backup, not the one that recognises one. Two of his own arms are the evidence.

**The checkpoint, which is shape 2's measurement turned around.** `checkpointAfterWrite()` runs
`wal_checkpoint(TRUNCATE)` at the end of every writing run — the apply, the undo, and the undo refusal that
writes no channel (`getDb()` runs migrations on open, so even that one has put frames in the WAL). It is
never fatal, it is not called in the error path (the file there may be the malformed one), and when it
returns busy the run says so and points at step 2.

**The `-wal` note.** Before anything is opened, if `--apply` or `--undo` is given and `<db>-wal` is
non-empty, the run prints what that means and that it is **running anyway**. A warning and not a refusal,
because §2.1 says the proxy cannot tell a live server from a crash, and refusing on it would block a
legitimate run on a database nothing has open — the "bigger than what was asked for" direction this script
exists to refuse, one step over.

## 4. Verification

**Theseus's R191, on the change: 11 · 1 failed · 1 open · 7.** The failure is arm Z (working tree differs
from HEAD — the code was uncommitted when the probe ran). **K1 and L1 flip from open to pass; H1 does not**,
which is what I predicted from §2 and what he predicted in his §6.

| Arm | Baseline (`67fa5b64`) | On the change |
|---|---|---|
| K0 | `-wal` 86,552 bytes after the apply | **`-wal` 0** after the apply, connection still open |
| **K1** | **OPEN** — after `cp`, the app reads the post-run state | **PASS** — the backup, row for row, integrity ok |
| **L1** | **OPEN** — `cp` with the server up reads post-run | **PASS** — the backup, to the open connection, to a new reader, and it stays back |
| H0 | — | `-wal` 0 after the apply, then 4,136,512 after the app's 1500 writes |
| **H1** | **OPEN** — `database disk image is malformed` | **still OPEN**, unchanged. The checkpoint cannot reach it |
| S1, H2, C1, D, A, U | pass | pass |

L1 passing is more than I expected: I thought the running server's page cache might still show the old
state after the copy. Measured, all three reads agree on the backup.

**His limit carries to my result.** This is his substitution — the server's own `getDb()` module under
`tsx watch`, not the Hono process under `concurrently`. Not driven by either of us: `npm run dev` itself,
SIGHUP, Finder/`mv`/Time Machine, and a corpus of xian's size.

**R189 / R187 / R185:** 14 · 11 · 15 checks, **0 failed** in each but arm Z, which fails in all three for
the same uncommitted-tree reason and passes on the committed HEAD (§5).

**Unit tests:** 4 new in `round175-entity-backfill.test.ts`, server **1611 → 1615** across 101 files, client
**311 passed · 13 skipped** unchanged (no client file touched). `npm run typecheck` clean; the CLI is not
covered by it, so `tsc --noEmit --strict --module nodenext` was run against it directly, clean.

**Negative controls** (`.testdata/r192-negctl.mjs`, one mutation at a time, bytes restored, sha identical,
`NEGCTL` count 0 after):

| Mutation | Predicted | Result |
|---|---|---|
| copy the database over the backup | direction test fails | **2 fail** (direction, spaces) |
| delete the *backup's* sidecars | direction test fails | **2 fail** (direction, spaces) |
| stop quoting the paths | 2 fail | **2 fail** (direction, spaces) |
| copy first, stop the app after | **0 fail — my test is too loose** | **0 fail**, as predicted |
| drop the sentence saying what a copy costs | 1 fail | **1 fail** |

**The fourth control found a hole in my own test, which is why it was written that way.** The step-order
test grepped for ``stop `npm run dev` `` *anywhere in step 1*, so a version that said "copy it now, stop
`npm run dev` afterwards" passed all 54 tests. Re-anchored on the start of the step, plus an assertion that
step 1 contains no `cp`. On the re-run that control fails the step-order test, as it should. The 0-fail row
above is the run before the repair, reported as it ran.

**Read by hand** (`.testdata/r192-cli-voice.mjs`): the dry run prints no steps and no note (it keeps no
backup); apply and undo each print the steps under their backup path with real interpolated paths; the note
fires with a real byte count when a second connection leaves an 8,272-byte WAL. No test reads the CLI's own
output, so it was read.

## 5. Not claimed

- **Still no run against any real corpus.** Every number here is from unit tests or the gitignored
  8-channel `.testdata` fixture. The 72 remains unverified.
- The checkpoint is measured on Theseus's substituted server, not the real one.
- Whether H's corruption happens every time is still his open question; nothing here changes it.
- A `--restore=<backup>` mode (his shape 3) is **not built**. It is the only shape that does not rely on
  the operator, and §2 now supplies the pieces it would need — but after the checkpoint, the arm it would
  cover is H alone, and the steps cover H for someone who reads them. Sized and left as a decision, not
  rejected.
