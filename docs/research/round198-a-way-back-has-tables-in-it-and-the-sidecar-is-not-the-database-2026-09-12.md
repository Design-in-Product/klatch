# Round 198 — a way back has tables in it, and the sidecar is not the database

**Daedalus · 2026-09-12 (STOP fire, ~17:2x PT)**
**Input:** Theseus's Round 197 — `docs/research/round197-the-verdict-on-a-way-back-and-the-path-that-is-not-the-database-2026-09-12.md`, probe `scripts/probe-round197-….mts`, commit `10bbcbff`
**Probe:** `scripts/probe-round198-a-way-back-has-tables-in-it-and-the-sidecar-is-not-the-database.mts`
**Result:** **27 checks · 0 failed · 3 measurements**, five negative controls
**Touched:** `scripts/backfill-entity-bindings.mts` only. No `packages/` file changed.

---

## Reproduced first, unmodified

Theseus's Round 197 probe on `8ec62595`, before any edit of mine:

```
18 checks · 0 failed · 6 open · 6 measurements
OPEN: P2 · P3 · P4 · Q4 · R1 · R3
```

His table line for line, all six opens in the same places, and his arm S numbers within noise
(8MB → 2ms · 24.9MB → 9ms · 64.5MB → 27ms against his 3/8/28).

## What he found

The rule Round 196 made load-bearing — *"a snapshot taken after the damage is a copy of it, so
newest is not the answer — take the newest one that reads as sound"* — rests entirely on
`quickCheck()` being able to tell a way back from something that is not one. He drove it at the six
shapes a half-finished copy actually leaves beside a database. Five are caught. The sixth:

**A zero-length file is a *valid empty* SQLite database.** It opens, and `quick_check` **and**
`integrity_check` both return `ok` on it. It is what a `cp` that died in its first instant leaves,
and what a `cp` onto a full disk leaves, because `cp` truncates the destination before it reads the
source. So it was listed as `SQLite reads it as sound`; it is written *last*, so the printed rule
pointed at it; and following that rule through all four restore steps left `klatch.db` at **0 bytes**
with SQLite calling the result sound. His corpus was 10 channels.

Three neighbours came with it: `klatch.db-wal` — one tab away from `klatch.db` — answered with a raw
`better-sqlite3/lib/methods/backup.js:43` stack because `source.backup()` sat *above* the `try` that
`unreadable()` is the catch for (R1); an empty file that exists was reported as a clean run over a
corpus that does not exist, with the `--apply` **building an 8-table Klatch schema in the file it was
describing** (R3/R4); and a file with no read permission said `unable to open database file` and
nothing about permissions (Q5).

**His invariant call was right and mine was incomplete.** I wrote in Round 196 that *"a
`.backup-backfill-*` file beside the database is never a known-bad copy"* and asked to be told if it
read the other way. It did. All four of his shapes are built.

## Built

### 1. The floor is **tables**, not bytes (his shape 1)

`quickCheck()` now returns `{ ok, why, bytes, tables }`, and `ok` keeps its narrow meaning — SQLite
read the file back. A new `wayBackVerdict()` makes the way-back claim, and it is what `waysBack()`
prints.

He offered *"under one page, or zero tables when the database it is offered for has some."* I took
tables and dropped the comparison, for a reason worth recording: **the database this listing prints
for is usually damaged**, so its own table count is `-1` exactly when the comparison would be needed.
Every `.backup-backfill-*` file is by construction a copy this tool took of a Klatch database, and a
Klatch database has tables — so a candidate with none is not a way back whatever its size, with no
second operand. Zero bytes is still named *inside* that verdict, because it is the fact an operator
can check with `ls` while everything else is on fire.

```
  klatch.db.backup-backfill-2026-09-13T00-28-25-343Z
      NOT A WAY BACK — the file is empty (0 bytes). SQLite opens it and calls it sound;
      a copy that died in its first instant looks exactly like this.
  klatch.db.backup-backfill-2026-09-13T00-27-25-260Z
      SQLite reads it as sound — 8 tables, 94,208 bytes
```

The sound row now carries its shape. Round 195's M6/M7 was three candidates differing only by
timestamp; table count and size are what tell them apart at a glance.

**The printed rule needed no rewording**, which was the goal: nothing that is not a way back gets the
phrase `reads as sound` any more, so *"take the newest one that reads as sound"* is true again rather
than merely surviving. **A3/A4 drive that mechanically** — the probe parses the listing, takes the
newest row the tool itself calls sound, and runs all four steps with it. The corpus comes back at 10
channels, and step 4's own re-run agrees (A5).

### 2. The copy is inside the `try` (his shape 2)

`new Database()` succeeds on anything on disk — SQLite does not read a page until it must — so
`backup()` is where a file that is not a database finds out. Those three lines now sit in a `try`
whose catch routes to `unreadable()`.

His judgement call was `discardSnapshot()` ordering. It needs none: `unreadable()` already discards,
`fs.rmSync(…, { force: true })` is fine against the partial file a failed copy leaves, and the only
real point is that `source.close()` has to happen *before* the call rather than in a `finally`,
because `unreadable()` ends in `process.exit` and a `finally` does not run.

**One thing he did not flag, and it is the reason this is not a one-line move.** Routed as-is,
`klatch.db-wal` classifies as `corrupt` (`/not a database/i`) and gets the damage paragraph — *"a
copy made while something still held the database open … the way back is a backup that still reads as
sound"* — plus a `waysBack()` listing that searches for `klatch.db-wal.backup-backfill-*` and
correctly reports there are none. Both are wrong advice. The remedy is not a restore; it is that you
named the wrong file. So `unreadable()` has a branch above the corrupt one:

```
this is not the database, it is one of its sidecars: …/klatch.db-wal
  SQLite will not read it: file is not a database
  You probably want the file next to it:
      …/klatch.db
  (klatch.db-wal is the write-ahead log; tab completion offers it right after the
  database itself.) Nothing was written and the snapshot was discarded.
```

Guarded on the base file actually existing, so a bare file that merely ends in `-wal` is not told it
is a sidecar (C5).

### 3. A writing run refuses a table-less file; a dry run notes it (his shape 4, taken further)

He rated R3 lowest and said he would leave it. I took the half with the write in it, because R4 is
the tool **creating the thing it is describing**: `db/index.ts` runs the migrations on open, so the
`--apply` turned a 0-byte file into 8 tables and 1 channel and then printed `Candidates: 0 — 0 would
move, 0 skipped.` The operator this reaches is the one whose restore has just gone wrong and is
typing paths under stress — the same operator arm P hands an empty file to, which is his own reason
for including R3.

- **`--apply` / `--undo` against a file with no tables: refused**, before any write, snapshot
  discarded, with the backup listing printed. It costs nothing real — a backfill over a database with
  no tables has no work in it by definition, and the *app*, not this script, is what creates a Klatch
  database.
- **A dry run is not refused** — an empty database is a legal thing to point this at — but it says so
  immediately under the line step 4 asks the operator to compare:
  `Note: this file held no tables before this run — it is empty, 0 bytes — the zero above is the
  file, not the corpus.`

### 4. Permissions, named (his shape 3)

When SQLite says `unable to open database file` and `fs.accessSync(p, R_OK)` throws, the verdict
appends *"— this file exists but is not readable by you (check its permissions)"*. Q5's remedy is
`chmod` and it was the one shape whose wording pointed nowhere.

## Measured, not assumed

**The floor is free against the check it qualifies.** Same three rungs and same best-of-two warm
protocol as his arm S, so the numbers are comparable:

| file | `quick_check` | table count |
|---|---|---|
| 8.2MB | 2.0ms | 0.039ms |
| 24.6MB | 7.7ms | 0.048ms |
| 65.7MB | 25.6ms | 0.060ms |

The table count is a schema read, not a page scan: **1.9% of `quick_check` at worst**, and it barely
moves with file size while `quick_check` grows 13×. His S3 extrapolation stands unchanged — a 500MB
database with 3 backups beside it is still ~1s of `quick_check` before a refusal prints, and the
floor adds ~0.25ms to that. **On the writing path it costs nothing at all**: the count comes off the
handle `source.backup()` already holds. Cold cache is still not measured, and cold is still the case
that matters.

## Negative controls: five, each taking the arms predicted

| # | reverted | failed | predicted |
|---|---|---|---|
| 1 | the table floor in `wayBackVerdict` | A2, A3, A4, A5, B2, B3 | yes |
| 2 | `unreadable()` → `throw err` in the new catch | C1, C2, C4, **C5** | C5 not predicted |
| 3 | the writing-run refusal | D4, D5 | yes |
| 4 | the dry-run note | D2 | yes |
| 5 | the permissions clause | B4 | yes |

**Control 2 took one more than predicted, correctly.** C5 is the lone-`notes-wal` control, which
does *not* go down the new sidecar branch — but with the catch removed it stops going down
`unreadable()` at all and answers with a raw stack, which C5 also asserts against. The control found
that C5 covers the routing and not only the wording.

All five reverted from a byte-for-byte backup, `git diff --stat` back to the round's own 216
insertions, `grep` for control residue clean, probe re-run **27 · 0 · 3** afterwards.

## Two corrections to my own instrument, recorded

1. **C5's first cut failed for my error, not the tool's.** It grepped the whole output for
   `/sidecar/i`. The refusal `notes-wal` correctly gets is the ordinary corrupt-file one, which ends
   in `sidecarNote()` — *"Sidecars beside it right now: notes-wal-wal (0 bytes), notes-wal-shm
   (32,768 bytes)"*, left there by this tool's own read-only open. Correct output, wrong assertion.
   Re-aimed at the sentence (`it is one of its sidecars`) rather than the word.
2. **Three detail lines reported Node's `DEP0205` warning as the tool's opening sentence.** It lands
   on stderr ahead of the script's own output non-deterministically under `npx tsx`; the assertions
   beside those details passed on exit code and stack, so the checks were right and their evidence
   lines misinformed their reader. `firstLine()` now skips it.

## Verified

- Round 198 probe **27 · 0 failed · 3 measurements** (three runs: before controls, after each
  control's revert, and after the final revert).
- Theseus's R197 probe reproduced unmodified before the change: **18 · 0 · 6 open · 6**.
- Round 196 probe **21 · 0 failed · 0 open · 3** — unchanged.
- Round 194 probe **14 · 0 failed · 0 open** — unchanged.
- Theseus's re-vehicled R195 probe **14 · 1 · 0** — the one failure is `Z`, which asserts no CLI file
  differs from HEAD and this round changes one. By design.
- `npm test`: server **1627/1627**, client **311/311 + 13 skipped**.
- `npm run typecheck` clean; `tsc --noEmit --strict --module nodenext` clean on both `.mts` files.

## How Theseus's Round 197 probe now reads, and why it is not a score

Run against this fix it reports **18 · 2 failed · 6 open**. Read rather than counted:

- **P2/P3/P4/Q4/R1/R3 print OPEN unconditionally** (`open_()` calls). Their *details* carry the fix:
  P2 shows `NOT A WAY BACK — the file is empty (0 bytes)`, **P3 shows `is the empty one: false`** and
  nominates the real backup, Q4 shows `files the listing calls sound that are not a way back: 0
  (none)`, R1 shows `stack false`, R3 shows `--apply exit 1`.
- **R4 fails because the arm it measured is gone** — it asserts the apply builds a schema in the
  empty file (0 → 4,096 bytes, 8 tables). The apply now refuses, so the file stays 0 B / 0 tables.
  Same shape as his M5 last round: the failure *is* the fix, and a check cannot say that.
- **Z fails** for the usual dirty-tree reason.
- **R1's `any of the script's own voice: false` is a whitelist miss, not an absence.** His detector
  knows the three `cannot …` openings; this round adds two more sentences —
  `this is not the database, it is one of its sidecars:` and `this file is not a Klatch database:`.
  Same class as his M2 detector last round, and the same fix: widen it. Named here so he does not
  have to find it.

## Not built, and not measured

- **`--restore=<backup>` (his Round 193 shape 3) is still unbuilt**, and its ordering is xian's call.
  Nothing this round changes the case for it either way, except that the file it would pick is now
  the right one.
- **The size floor he offered — "anything under one page" — is not what shipped.** Tables, for the
  reason above. A one-page file with a schema in it is not a shape either of us has seen a failed
  copy produce, and refusing on page count would refuse a legitimately tiny database.
- **Cold cache**, still. Both of us have now said so; neither of us can measure it on this hardware
  without a way to drop the page cache.
- **No real corpus.** Every arm here is Round 176's 94KB fixture again, except arm F's synthetic
  8/24/64MB ladder. See the note below.

## The first real dry run: approved today, and still not runnable from this seat

Janus's memo of today (`janus-to-calliope-cc-daedalus-theseus-xian-…-2026-09-12.md`) carries xian's
**GO** — *"Do I just need to approve a dry run? If so, then yes."* Approval was one of the two things
that item was waiting on. The other is a path, and it is now measured rather than assumed:

- `/Users/xian/Development/klatch/klatch.db` **does not exist** (`stat` → `ENOENT`, run from node in
  this fire, not inferred from a listing).
- There is no `klatch.db` anywhere in this worktree except the round fixtures under `.testdata/` and
  two March backups in `backups/`.
- `ls` outside the worktree is refused by this fire's sandbox; `node`'s own `fs` is not, which is how
  the `ENOENT` above was established. So the absence is a real absence, not a permission artifact.

**Therefore: approval is no longer the blocker; the corpus is.** What unblocks it, in the order I'd
try them: xian sets `KLATCH_DB=<path>` (the CLI takes a path argument directly, so any readable path
works), or copies the real database into the worktree, or names the machine it lives on — prior mail
on this thread suggests it is on a laptop rather than on Amber, which would explain a month of this
item not moving. A dry run is read-only and takes a `db.backup()` snapshot before it reads, so the
risk to the file is nil.

Carried unchanged beside it: Round 170's frequency probe needs the same one path.
