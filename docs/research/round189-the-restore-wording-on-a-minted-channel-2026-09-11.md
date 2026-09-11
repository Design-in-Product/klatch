# Round 189 — Round 188's restore wording, on the channels it did not drive

**Theseus · 2026-09-11 START fire · zero model calls · fixture `.testdata/r189/` (gitignored), built by Round 176's builder**

Instrument: `scripts/probe-round189-the-restore-wording-on-a-minted-channel.mts`

---

## What came in

**Daedalus's Round 188** (`968d1006`, 09:24) closes my Round 187 items. As read from the diff:
- **S2.** Round 186's "different binding" is split in two:
  - `boundBeforeRun`: the seated binding of the record's agent is **earlier** than the run's, so the
    database is from before the run and the older record is the one to use.
  - `reboundSince`: the binding is **later**, so a later `--apply` or the app moved it.
  - The CLI's reason line and summary advice follow the split. Exit and disposition are unchanged.
- **G1/G2.** `checkUndoRecord` refuses `fromAddedAt`/`toAddedAt` unless they are absent, null, or
  `YYYY-MM-DD HH:MM:SS`.

No memo or board entry for Round 188 had landed on `origin/main` when this fire fetched.

**Argus** (9/11 START) reproduced R187 clean and found **R185's N0/N1 flaky**. On his second back-to-back
run, N0's two applies landed in one second, so N0 and N1 failed.

## Reproduced and re-vehicled first

| Probe | Result | Note |
|---|---|---|
| R187, unmodified on `968d1006` | **11 · 0 failed · 0 open · 4 meas** | S2/G1/G2 took their pass branches |
| R187, re-vehicled | **11 · 0 · 0 · 4**, two runs | S2 now asserts what 188 prints; G1/G2 open branches are failures |
| R185, hardened | **15 · 0 · 0 · 3**, two runs | `tick()` before N0's and N3's second apply |

**R187.** The unmodified green was weaker than it looked: S2's pass branch was a bare `true`, and the
voice filter didn't match 188's new advice line. Re-vehicled S2 asserts three things:
- the earlier-binding line is printed;
- `restored from a backup, the record that fits it is an older run's` is printed;
- neither `later binding` nor `If a later --apply` is printed.

G1/G2 assert exit 1 and the exact problem text.

**R185.** Argus's diagnosis is right, and the same gap sat one arm later. N3's second apply follows a
reply subprocess that usually, but not necessarily, spans a second, and N4 makes N1's comparison.
- Both second applies now wait past a second boundary.
- N3 also asserts the two `toAddedAt` differ.

Two green runs don't prove a coin-flip flake gone. The tick is what makes a same-second pair impossible,
and N0/N3 now fail loudly if one happens anyway.

## The question

Both new flags are computed inside `if (binding)` (`entity-backfill.ts:657-683`), so they exist only
when the record's agent is **still bound**. Round 188's tests and Round 187's arm S drove one channel,
`reuse`. Its agent, Sable, is matched by name, so it has one id in every run. **Most moved channels mint
their agent instead** (in this fixture: wren and the two tarns, against one reuse). Re-apply after an
undo re-mints, with a new uuid. After a restore, the newer run's agent is not in the database at all.

**Prediction, written in the session log before running:** the not-bound branch (`:684-699`) returns
`changed-since` with neither flag. The CLI (`backfill-entity-bindings.mts:380-386, 420`) then prints:
- "which no longer exists";
- "If a later --apply moved one, undo with that run's record first";
- no restore line.

## Results — 12 checks · 0 failed · 2 open · 6 measurements, two runs same shape

Run 1 and run 2 gave the same states. Arm E's measurement was re-instrumented after run 1 (below), and
run 3 is the first on the final instrument.

| Arm | Sequence | Outcome |
|---|---|---|
| **M0–M1** | apply A → undo A (snapshot kept) → tick → apply B `--channels=<wren>` → restore the undo's snapshot → undo with B | exit 2, `CHANGED SINCE THE RUN`, wrote nothing, no snapshot left. **Safe.** |
| **M2 — open** | the same refusal's words | `This record moved it to […], which no longer exists.` · `If a later --apply moved one, undo with that run's record first.` · no restore line. Wren's only seat `17:54:55` < B's run `17:54:57`. |
| **M3** | then undo with A | exit 0, all four `REVERTED`, pristine row for row (bindings' `added_at` included) |
| **U0–U1** | the same with B unfiltered | all four channels `CHANGED SINCE THE RUN`, exit 2, wrote nothing |
| **U2 — open** | the same refusal's words | reuse gets 188's "from before the run"; wren and both tarns get "which no longer exists". The summary prints **both** "If a later --apply moved one, undo with that run's record first" **and** "the record that fits it is an older run's: undo with that one". |
| **U3** | then undo with A | exit 0, pristine |
| **K0–K1 (control)** | apply `--channels=<wren>` → tick → app: Kestrel on, Wren off → undo | exit 2, wrote nothing. Only seat `17:55:02` > run `17:55:01`. |
| **E (measured)** | apply `--channels=<wren>` → tick → `DELETE /entities/<Wren>` → undo | see below |
| **V (measured)** | the run's own record, hand-edited | see below |

### What the open items are, and are not

**No data harm in any arm.** Every refusal exits 2 and writes nothing, and the older record settles
every restore pristine. Round 188's disposition holds on minted channels too. What doesn't hold is the
**direction of the advice**:
- **M2:** an operator holding the newest record is told to find a later one. It doesn't exist.
- **U2:** one cause gets two instructions pointing opposite ways.

That is exactly Round 187's S2, which 188 fixed for the name-matched channel only.

### The database can tell M from K

In neither arm is the record's agent bound, so the flags are never computed. But the seats differ:
- **M:** every seat on the chat is **earlier** than the record's run.
- **K:** the only seat is **later**.

So the direction is decidable in the not-bound branch too, from the same column 188 already reads.

**A shape for Daedalus to weigh, not a claim that it is right.** In the not-bound branch: when the record
has `toAddedAt`, the chat has at least one seat, and every seat's `added_at` is earlier than it, set
`boundBeforeRun`. Then U's summary gives one direction (`changed + missing > beforeRun` goes false).

Two things any such shape has to face:
1. **A zero-seat chat can't reach it through the CLI.** See E: opening the database seats the default,
   with a fresh `added_at`, later than the run. So the vacuous "every seat is earlier" doesn't arise
   there. Whether a direct `undoEntityBackfill` call can see a zero-seat chat was not checked.
2. **Undo restores the default's binding with its original `fromAddedAt`** (Round 178), which is
   earlier than the run. "This run was undone, and then its rows were disturbed" therefore also has
   every seat earlier. The clean undone case is caught first by `already-reverted`. The disturbed case
   was **not driven** this round.

### E — the agent deleted in the app

`deleteEntity` (`queries.ts:467-476`) drops every binding and seats no one, so wren has **zero seats**
and its rows still carry the deleted id (E0). The undo then reported `seated now: Claude [default-entity]`
and printed "Nothing was written; the snapshot was discarded", but run 1's dump of the file changed
across the call.

The cause is in the code, not undo. `db/index.ts:354-365` runs on every `getDb()` open and assigns the
default to any channel with no `channel_entities` row. The CLI takes its snapshot from a read-only
handle (`backfill-entity-bindings.mts:304-305`) *before* pointing `getDb()` at the database (`:310`). So:
- the open-time write lands before undo classifies;
- the discarded snapshot is the pre-open state;
- "Nothing was written" is true of undo and not of the file.

The app does the same on its next start, so this is not a backfill defect. It is recorded because it
decides what the classifier can ever see.

**Run 3 (arm E re-instrumented to print the row diff):**
- **Added across the CLI call:** exactly one row, `channel_entities {wren, default-entity, added_at
  "17:58:31"}`.
- **Removed:** nothing.
- **Seats after:** the default only, `17:58:31`, which is **later** than the run's `toAddedAt`
  `17:58:29`.
- **Undo's verdict:** exit 2, `CHANGED SINCE THE RUN`, "which no longer exists", "If a later --apply
  moved one".

Here "later" happens to be the right direction: the app deleted the agent after the run. So the
open-time seat is also what keeps a "seats are earlier" rule from misnaming this case at the CLI.

### V — well-shaped values that are not times

Round 188's check is a shape regex, so these pass. Both need a hand-edited record.
- **V1.** `toAddedAt "9999-99-99 99:99:99"` on an **untouched** database: exit 2. Refused as "from
  before the run (a restored backup?)".
- **V2.** `fromAddedAt "0000-00-00 00:00:00"`: exit 0, `REVERTED`. Written into the default's binding,
  which now sorts first.

If it's worth closing, the SQLite form of "is a time" is `datetime(x) IS x`. I'd leave it: the record is
the CLI's own output.

## What this round did not do

- **No real corpus.** The 72 unverified, and xian's dry run unchanged.
- The **undone-then-disturbed** case (point 2 above) was not driven.
- The server and client suites were not run: no product file changed (arm Z, and
  `git status -- packages scripts/backfill-entity-bindings.mts` clean).

## For xian

Nothing here blocks the dry run. **If you ever restore a backup and then undo, use the record from the
run the backup is in — the older one — whatever the refusal suggests.** On most chats it still suggests
the newer one.
