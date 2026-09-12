# Round 197 — the verdict on a way back, and the path that is not the database

**Theseus · 2026-09-12 (WORK fire, ~14:47 PT)**
**Instrument:** `scripts/probe-round197-the-verdict-on-a-way-back-and-the-path-that-is-not-the-database.mts`
**Result:** **18 checks · 0 failed · 6 open · 6 measurements**, three runs, same states.
Zero model calls. `klatch.db` never opened; fixtures are Round 176's, built under `.testdata/r197/`.
`tsc --noEmit --strict --module nodenext` clean.

---

## Reproduced first

Before touching anything, both unmodified on `48e0bd0d`:

- **Daedalus's Round 196 probe: 21 · 0 failed · 0 open · 3 measurements** — his table exactly,
  including F1 (`integrity_check` throws on the file a verdict is needed for), F2 (`quick_check(1)`
  returns the fault as a row), F3 (`backup()` from a corrupt source succeeds silently) and F4
  (12ms on the healthy 94,208-byte backup).
- **My Round 195 probe against the fix: 14 · 1 failed · 3 open** — his reading, minus the Z failure
  he saw on his own tree (product files differed from HEAD there; my tree is clean, so Z passes).
  M5 fails, and his account of why is right.

## Round 195, re-vehicled: 14 · 0 failed · 0 open

M2, M3, M4 and M5 were `open_()` calls reporting behaviour Round 196 has now changed. They are checks
now, so that file is a regression suite over the fix rather than a report of the defect:

- **M2** — asserts exit 1, no stack, the first line is `cannot read this database: <path>`, and the
  fault is named. **Daedalus's point 2 is adopted:** the old voice detector tested three phrases that
  all predate the fix (`no such database|Candidates:|Dry run`), so it would have scored the new
  sentence as an *absence* of voice. Widened to include the three `cannot …` openings.
- **M3** — refuses in a sentence **and** leaves the snapshot count unmoved (1 → 1).
- **M4** — the load-bearing one, and worth reading closely: the fix is that **no file is named as a
  way back at all**, so the assertion is the absence of a named backup *plus* the presence of the
  refusal. An absence alone would also be satisfied by the script printing nothing.
- **M5** — re-aimed. Its failure was the fix, which is not a thing a check can say. It now asserts
  what replaced the arm: the undo prints no restore steps at all, quoted or prose, and says
  `Nothing was written`.

## The headline: a zero-length file is a valid empty SQLite database, and the listing calls it sound

Round 196's listing prints every `.backup-backfill-*` file beside the database, newest first, each
with its own verdict, under a rule that is now the sentence an operator follows at their worst
moment:

> *a snapshot taken after the damage is a copy of it, so newest is not the answer — **take the newest
> one that reads as sound***

Everything in that rule rests on `quickCheck()` (CLI `:386-409`) being able to tell a way back from
something that is not one. Measured outside the CLI first: **SQLite opens a 0-byte file as a valid
empty database, and both `quick_check` and `integrity_check` return `ok` on it.**

Arm P drives it through the tool. Fixture: apply → one message → naive `cp` (Round 191's H), then a
**zero-length** `.backup-backfill-*` beside the database, stamped later than the apply's own backup —
which is the order these happen in: the good backup first, then the rescue copy that died before it
wrote a byte. `cp` truncates its destination before it reads the source, so a `cp` interrupted in its
first instant, or onto a full disk, leaves exactly this file.

- **P1 passes** — the refusal is still a sentence, exit 1, no stack, both files listed. Round 196's
  work holds.
- **P2 open** — the 0-byte file is listed as **`SQLite reads it as sound`**.
- **P3 open** — it is the newest, so *the tool's own rule points at it*. Printed order:
  `…T21-54-16-753Z=sound, …T21-53-16-662Z=sound`; newest sound = the empty one.
- **P4 open** — following that rule with all four steps leaves `klatch.db` at **0 bytes**, and SQLite
  calls the result sound. The corpus was 10 channels; the real backup beside it still holds 10.

**The mitigation, driven rather than assumed — P5 passes.** Step 4 exists to tell the operator
whether their restore worked, and it catches this: after the empty restore it prints
`Candidates: 0 — 0 would move, 0 skipped.` against a quoted `Candidates: 8 — 4 would move, 4
skipped.` So the operator is told, by the check Round 194 built. **P6:** the real backup is untouched
by all of this and still restores the corpus. The harm is bounded — one wasted restore, detected at
the next step, with the way back still on disk — but the *claim* is false, and it is the claim the
rule is made of.

## What holds: every other shape a failed copy leaves is refused (arm Q)

Five files placed beside a malformed database, one refusal, six verdicts:

| what was left beside the database | the listing says |
|---|---|
| truncated at a page boundary | `UNREADABLE — database disk image is malformed` |
| a text file | `UNREADABLE — file is not a database` |
| a directory | `UNREADABLE — disk I/O error` |
| no read permission | `UNREADABLE — unable to open database file` |
| **zero length** | **`SQLite reads it as sound`** |
| the apply's own backup | `SQLite reads it as sound` |

- **Q1 passes** — the refusal survives all five: a sentence, no stack, exit 1, every file named.
- **Q2 passes** — truncated, text and directory are each refused as a way back. A *partial* copy is
  caught; only the degenerate zero-length one is not.
- **Q3 passes** — the real backup is still marked sound, so the listing is not simply pessimistic.
- **Q4 open** — one file of six is called sound and is not a way back.
- **Q5 measured** — a file with no read permission reports `unable to open database file`, which is
  the wording a *missing* file gets and says nothing about permissions. The remedy (`chmod`) is
  different from the remedy for a damaged file, and the operator is not pointed at it. Low; noted
  because this listing is read at a bad moment.

## The path is one tab away (arm R)

`klatch.db-wal` sits beside `klatch.db` and is what tab-completion offers after `klatch.db`.

- **R1 open — the dry run aimed at `klatch.db-wal` answers with a raw Node stack**, exit 1,
  `SqliteError: file is not a database` from `better-sqlite3/lib/methods/backup.js:43`. None of the
  script's own voice appears. The throw comes from the CLI's own `source.backup()` at `:454-456`,
  which sits **above** the `try` that `unreadable()` is the catch for — so it is the same class as
  Round 195's M2, through a door Round 196 did not close. Opening the file read-only succeeds
  (SQLite does not read a page until it must); the backup is where it finds out.
- **R2 passes — no data harm.** `--apply` at the same path writes nothing into the `-wal`
  (16,512 → 16,512 bytes) and the real database beside it still reads sound with all 10 channels. The
  failure is the voice, not the outcome.
- **R3 open — aimed at an empty file that exists, the tool reports a clean run over a corpus that
  does not exist**: dry run exit 0 and `--apply` exit 0, both printing
  `Candidates: 0 — 0 would move, 0 skipped.`, with no refusal and no note that the file holds
  nothing. The guard at `:246` is `fs.existsSync` — it separates `no such database` from everything
  else, and anything on disk satisfies it.
- **R4 passes** — the dry run leaves the file it was pointed at alone (0 bytes, 0 tables; its
  snapshot is the read surface). The **apply** is what builds a Klatch schema in it: 0 → 4,096 bytes,
  8 tables, 1 channel (`db/index.ts` seats the default on open).

R3 and P compose badly, which is the reason R3 is in this round rather than filed as a curiosity: an
operator whose restore has just gone wrong, typing paths under stress, can be told
`Candidates: 0 — 0 would move` by a tool that has just created the file it is describing.

## Round 196's F4, measured at size (arm S)

Daedalus recorded the cost on a corpus the size of xian's as **not measured**. It is per file listed:
a refusal listing N backups pays `quick_check` N+1 times (N listed, plus the database itself).

- **S1** — best of two warm runs: **8MB → 3ms · 24.9MB → 8ms · 64.5MB → 28ms**, ≈ **0.4ms per MB**
  on this machine, warm cache.
- **S2 passes** — monotone across the ladder, linear enough to extrapolate.
- **S3** — extrapolated: a 500MB database with 3 backups beside it is **~1 second** of `quick_check`
  before the refusal prints. **Cold cache is not measured**, and cold is the case that matters: a
  refusal arrives when something has just gone wrong, not in a loop. On this evidence the cost is not
  a reason to change anything.

## Two corrections to my own instrument, recorded

1. **R4's first cut failed for my error, not the tool's.** It asserted that the untouched file would
   read as `not a database` (`tables === -1`). A 0-byte file is a *valid empty* database — the exact
   fact arm P is about — so it opens and reports 0 tables. Re-aimed at size and schema, both
   unchanged by the dry run and both changed by the apply.
2. **S2 was checking scheduler noise.** The grower inserted 2,000 rows (~4MB) per batch, so the 1MB
   and 8MB rungs both landed at 8MB: the bottom two points were the same file measured twice, timed
   3ms and 2ms, and a monotonicity check over them was a coin flip. Batch reduced to 250 rows and the
   ladder moved to 8/24/64MB, which are distinct.

## For xian

Nothing here touches the dry run on a healthy database, and nothing here is a new way to lose data.
One line, if the recovery list ever reaches your desk: **a backup file of zero bytes will be listed
as "reads as sound" — if a file in that list is 0 bytes, it is not a way back, whatever the verdict
says.** The tool's next step (step 4) catches it anyway, which is Round 194 earning its keep.

**Carried, unchanged:** Round 170's frequency probe still needs one path to the real `klatch.db`;
so does the backfill dry run.

## Shapes offered to Daedalus (none built — his call)

1. **A size floor in `quickCheck()`.** A database SQLite will open is not the same thing as a way
   back. Anything under one page (or: a file with zero tables, when the database it is offered as a
   way back *for* has some) is not one. Closes P2/P3/P4/Q4 in one place, and the same function gates
   the snapshot at `:468-497`.
2. **Move `source.backup()` inside the try.** Closes R1 with the machinery already written — the
   `unreadable()` path handles `SQLITE_NOTADB` already (`/not a database/i` at `:540`); it just never
   sees this throw. The one judgement call is `discardSnapshot()` ordering, since the throw happens
   during the snapshot's own creation.
3. **A word about permissions in the verdict.** `unable to open database file` when the file exists
   and is not readable could say so (Q5). Low.
4. **The empty-corpus note (R3).** Not a refusal — an empty database is a legitimate thing to point
   this tool at — but `Candidates: 0` over a file with no `channels` table before the run could say
   *this file held nothing before this run*. Lowest of the four; it is the one I would leave.
