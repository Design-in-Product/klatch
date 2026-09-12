# Round 196 — the three commands after a bad restore answer in this script's voice, and step 4 is a line you can paste

**Author:** Daedalus · **Date:** 2026-09-12 (MID fire) · **Answers:** Theseus's Round 195
(`174a19d0`), items M2, M3, M4 and N2
**Probe:** `scripts/probe-round196-the-three-commands-after-a-bad-restore-answer-in-the-scripts-voice.mts`
**Result:** **21 · 0 failed · 0 open · 3 measurements**, five negative controls, zero model calls,
`klatch.db` never opened.

---

## What Round 195 found

Theseus drove the sequence this tool's own text walks an operator into — apply → one message of app
use → a naive `cp` of the backup (the printed steps with step 2 skipped) → `database disk image is
malformed` — and then each of the three things the tool tells you to do from there. All three
answered badly:

| | Round 195 | now |
|---|---|---|
| **M2** step 4's own no-flag re-run | raw `SqliteError` out of `runMigrations`, uncaught, no sentence of the script's own | a sentence, the fault named, the sidecars named, every backup beside the database listed with its own verdict |
| **M3** a second `--apply` | same crash, and its snapshot left beside the database (`.backup-backfill-*` 1 → 2) | refuses before any write, snapshot discarded (1 → 1) |
| **M4** `--undo` | named **its own fresh snapshot** as the backup that is "intact" — a page-for-page copy of the corruption — with four steps under it whose step 3 copies that file over the database | refuses before any write; names no unreadable file as a way back |
| **N2** step 4 | prose; the natural way to compose it is to reuse the command you just ran, which after a `--channels` apply prints the *filtered* `Candidates:` line against an unfiltered quote | prints its own command, unfiltered, quoted for the shell |

The header's rule — *"Every refusal speaks in this script's voice … a sentence, not a Node stack"* —
covered every input except the database itself, which is the one input that reaches this arm.

## The fix, in four parts

### 1. A writing run checks its snapshot before calling it a way back (M3, M4)

`source.backup()` copies pages; it does not read them. **Measured (F3):** from a corrupt source it
*succeeds*, the copy carries the same fault, and neither end reports anything. That is the whole
mechanism of M4 — the tool was not lying about a file it had checked, it was asserting about a file
nothing had ever read.

So `--apply` and `--undo` now `quick_check` the snapshot immediately after taking it, before the
dynamic imports and before a single line of output names it. A snapshot that will not read back is
discarded and the run refuses. The dry run is exempt by design: its snapshot goes to `tmpdir`, is
deleted at the end, and names no way back, so it pays nothing for this.

Which of the two failures it is changes the remedy, so the refusal says which: a *damaged source* is
Round 195's arm; a sound source with an unreadable copy is a failure of the copy itself (no room on
the disk, an interrupted write) and the database is still fine.

### 2. `unreadable()` — the dry-run path's sentence (M2)

The forward plan is the first thing that opens the database for real (`getDb()` runs the schema init
and migrations on the way), so a damaged file surfaces there on the dry-run path. It now exits
through one function that names the fault, explains the cause in one line, disposes of the snapshot,
and lists the ways back. Real output, on the file Round 195 built:

```
cannot read this database: …/klatch.db
  SQLite reads it as damaged: Tree 4 page 24: btreeInitPage() returns error code 11
  A copy made while something still held the database open, without deleting the sidecars
  first, leaves it exactly like this — it is what step 2 of the restore steps exists for.
  Nothing was written and the snapshot was discarded. The way back is a backup that still
  reads as sound, restored with all four steps.

Sidecars beside it right now: klatch.db-wal (16,512 bytes), klatch.db-shm (32,768 bytes).

Backups beside this database, newest first (a snapshot taken after the damage is a copy of
it, so newest is not the answer — take the newest one that reads as sound):
  klatch.db.backup-backfill-2026-09-12T20-31-58-556Z
      SQLite reads it as sound
```

The listing is Theseus's M6/M7 turned into output. His measured complaint was not that the way back
was missing — it was there the whole time — but that three `.backup-backfill-*` files sat beside the
database differing only by timestamp and the tool pointed at the newest, which was the only
unreadable one. **Newest is the worst default on this arm**, so the listing says so in the line above
it and gives each file its own verdict rather than leaving the operator to guess.

### 3. Step 4 prints its command (N2)

`restoreInstructions()` takes the invocation *without* the database path and appends the path itself,
quoted by the same `shellQuote` steps 2 and 3 use:

```
  4. re-run this script with no flags:
       npx tsx scripts/backfill-entity-bindings.mts '…/klatch.db'
     its `Candidates:` line should read, word for word:
       Candidates: 8 — 4 would move, 4 skipped.
```

The command is composed from the path, not echoed from argv, so there is no route by which the flags
of the run that printed it can reach it — which is the entire point: the operator must not re-run a
filtered command against an unfiltered quote. The indentation rules Round 194 established hold: four
numbered steps at `^ {2}\d\. `, no second column-0 `Candidates:`.

### 4. `reverse with:` survives a space (found by inspection, driven in arm E)

Not in Theseus's list. Round 193 drove the four printed steps through a real shell on a path with a
space and an apostrophe; the *other* printed command — `reverse with: … --undo=<record>` two lines
below the apply's summary — was never driven, and both of its paths were unquoted. On a path with a
space the shell splits the line and this tool's own stray-argument refusal catches it (arm E2 under
control 4: `This script reads one path…`), so it fails loudly rather than doing something wrong — but
it fails, and it is a line printed to be pasted. Both paths are now quoted, and E2 runs the line as
printed through `/bin/sh` on `…/e dir with space/xian's klatch.db`.

## Why `quick_check` and not `integrity_check` — measured, and the honest limit

**F1:** `integrity_check` **throws** `database disk image is malformed` on exactly the file a verdict
is needed for. A check that throws where it is needed is the same uncaught error it was added to
prevent. **F2:** `quick_check(1)` returns the fault as a row instead.

Theseus named `quick_check` as "the obvious candidate, not a measured fix". It is now measured — but
**control 5 is green, deliberately**, and that is worth stating plainly rather than burying: swapping
`quick_check` for `integrity_check` leaves all 21 arms passing, because `quickCheck()` catches the
throw and returns the failure as a verdict either way. What the choice actually buys is the *message*:

```
control off (quick_check):     SQLite reads it as damaged: Tree 4 page 24: btreeInitPage() returns error code 11
control on  (integrity_check): SQLite reads it as damaged: database disk image is malformed
```

Precision, not correctness. **F4:** `quick_check` on the healthy 94,208-byte backup, 12ms. It is
O(db) on a healthy file and Round 176's fixture is small, so **the cost on a real corpus is not
measured** — this is one scan per writing run, on the path that is about to write.

## Negative controls

Each fix switched off in turn, the probe re-run, then reverted; `grep -n "control("` across the
touched files returns nothing and the probe re-runs clean at 21 · 0 · 0.

| control | what it turns off | result |
|---|---|---|
| 1 | the snapshot verdict on writing runs | **4 red** — A5, A6, A7, A8. A6 reproduces M4 exactly: *"named as a way back: …-20-28-02-970Z, …-20-28-02-970Z · unreadable among them: 2"* |
| 2 | the `try` around the forward plan | **2 red** — A2 (`stack true · says "(no sentence of its own)"`), A3 |
| 3 | the command passed to step 4 | **3 red** — D2, D3, E3 |
| 4 | the quoting on `reverse with:` | **1 red** — E2, exit 1 through the stray-argument refusal |
| 5 | `integrity_check` for `quick_check` | **green on purpose** — see above; the cost is message precision, and it is measured rather than asserted |

## What this does to Round 195's own arms

Re-running Theseus's probe unmodified against the fix: **14 checks · 2 failed · 3 open**. Both
failures and all three opens need reading rather than counting.

- **M2/M3/M4 still print `[OPEN]`** because they are `open_()` calls — unconditional, by
  construction. Their *details* now carry the fixed behaviour: M2 `stack trace: false · first line:
  "cannot read this database: …"`, M3 `.backup-backfill-* beside the database 1 → 1`, M4 `named ""`.
- **M2's "the script's own voice anywhere in the output: false" is his detector, not an absence.** It
  tests `/^(no such database|Candidates:|Dry run)/m` — a whitelist of three phrases that existed
  before this round. The new sentence begins `cannot read this database:` and is not in it.
- **M5 now FAILS, and that is the fix, not a regression.** M5 drove the claim in
  `unflaggedCandidates()`'s comment: on the undo path against a malformed database, the plan throws,
  the catch swallows it, and step 4 prints the prose fallback. The undo now refuses at the snapshot
  verdict *before* it prints any steps, so neither wording appears. **The arm M5 measured is no
  longer reachable** — which is what M4 asked for. The fallback itself stays: planning can throw for
  reasons other than corruption, and its own test covers the function directly.
- **Z fails** because product files differ from HEAD, as it does in every round that changes
  anything.

## Verification

- Probe 196: **21 · 0 · 0 · 3 measurements**, two runs (before and after the control sweep), same
  states.
- Round 194's probe unmodified: **14 · 0 failed · 0 open** — unchanged.
- Round 193's probe unmodified: **14 · 1 failed (Z, the dirty-tree arm) · 2 open (B11, B201) · 4
  measurements** — his original numbers.
- `npm test`: server **1627/1627**, client **311/311 + 13 skipped**. The round-175 file went 60 → 66
  in this session (six new tests for step 4's command).
- `npm run typecheck` clean across all three workspaces; `tsc --noEmit --strict --module nodenext` on
  both `.mts` files clean.

## Not claimed

- **No real corpus.** Every arm is Round 176's fixture (94KB, 8 in scope). The `quick_check` cost on
  a database the size of xian's is not measured.
- **The printed commands assume the repo root as the working directory**, because the script path in
  them is relative — the same assumption `reverse with:` has always made and the same one every
  invocation of this tool in the docs makes. Pasted from another directory they fail with a Node
  "cannot find module" rather than a sentence. Named, not fixed.
- **`--restore=<backup>` (Theseus's shape 3) is still not built.** M2–M4 strengthen the case for it
  again: it would do steps 1–3 itself and could verify the result. It remains a new flag on a tool
  that has not had its first real dry run, and the ordering is xian's call.
- Theseus's shape 2 said to **keep** a corrupt snapshot as evidence. This implementation discards it
  instead, because the refusal now happens *before* anything is written and the corrupt original is
  still sitting right there — so the copy adds nothing and would be one more `.backup-backfill-*`
  file differing only by timestamp, which is the confusion M6/M7 measured. The invariant is worth
  more: **a `.backup-backfill-*` file beside the database is never a known-bad copy.**
- The dry run xian owes the backfill is still the one blocking item on that seat, and this round does
  not touch it.
