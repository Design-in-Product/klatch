# Round 185: what the undo classifier knows a run by

**Theseus · 2026-09-10 (WORK fire) · drives Daedalus's Round 184 (`d8bb1a78`)**
Instrument: `scripts/probe-round185-what-the-undo-classifier-knows-a-run-by.mts`
Fixture: `.testdata/r185/` (gitignored), built by Round 176's builder. Zero model calls. `klatch.db`
is never opened. No product or CLI file is touched (arm Z asserts this at exit).

## Result

**15 checks · 0 failed · 3 open · 3 measurements.** The run count and shape are recorded in the session
log `docs/logs/2026-09-10-1051-theseus-opus-log.md`.

Round 184's own promises hold wherever I drove them, including one path none of its tests reach:
a real SQLite error part-way through an undo. The three open items:

| | finding | harm |
|---|---|---|
| **N4** | An older record undone after a newer apply **writes** the channel, exit 0, when both runs bound the **same agent id**. A1 exits 2 only because its second apply re-minted. | A reply the newer run moved is left stamped to an agent that is no longer seated on that chat. |
| **N5** | After that, the **newer** record (the right one) is refused for that channel: `CHANGED SINCE THE RUN`, exit 2. Its advice says to "undo with that run's record", which is the record being used. | The only way out is the snapshot the older undo took (N6: it works). |
| **M2** | A channel left as `changed-since` exits **2** in a one-channel record and **0** when other channels reverted beside it. | None to data. It is the exit code, the one part of the output a script reads. |

## Before building: re-vehicling my Round 183 probe

- **Unmodified on the fix:** 19 · 1 failed · 0 open, the number Daedalus reported. The failure was
  `B1 · …and removes the backfill's Wren, now orphaned`.
- **The ruling: my arm's premise was wrong.** `messages.entity_id` is added by `ALTER TABLE` with no
  `REFERENCES` (`db/index.ts:103`). The only foreign key on `entity_id` is `channel_entities`'s (`:75`).
  Deleting Wren would not have been blocked. It would have left the chat's assistant rows naming an
  agent that does not exist. Those rows are Wren's conversation, so Wren is not orphaned.
- **Re-vehicled** to Daedalus's suggested shape, and stronger:
  - roster **and** stamps are unchanged against a capture taken just before the undo
  - Wren's id appears in the `kept because` line
  - `seated now: Kestrel [` is printed
  - the exit is not 0
- **Re-run:** 19 · 0 · 0 · 8.

## Arm N — two runs, one agent id

**The question.** The classifier's `revert` test is `bound(channel, record.toEntityId)` and a
`fromEntityId` that exists (`entity-backfill.ts`, `undoClassifier`). It reads no rows on that branch.
In Round 183's A1, the re-apply re-minted Wren, because the first undo had deleted the old one and
`resolveImportEntity` matches by name (`entity-backfill.ts:442`). So the older record named a Wren id
the channel no longer held, and the channel read as `changed-since`.

The fixture's `reuse` channel is the other case. Its agent, Sable, exists before any run, so every
apply matches it by name and binds the **same** id.

**The ingredient that makes it matter.** An assistant reply written between the runs is stamped to the
seated agent (`routes/messages.ts:103`), which after the first undo is the default. The backfill's P2
is every default-or-NULL assistant row (`entity-backfill.ts:421-455`). So the newer record carries the
reply and the older one does not. The probe writes the reply through `insertMessage` and
`updateMessage`, in the route's order, from a subprocess.

**Controls first:**

- **N1:** apply → undo → apply `--channels=<reuse>` → undo the older record → undo the newer.
  Ends **row-for-row pristine**. With nothing written between the runs, the two records name identical
  rows, so which one is used makes no difference.
- **N2:** the same with one reply between the runs, undone with the **newer record only**. It settles
  correctly: roster `["default"]`, stamps `["NULL","default","default","default"]`, the rest of the
  database pristine.

**N3, setup.** The reply was stamped `default` when written and `Sable` after the newer apply. It is in
the newer record's P2 and not the older's.

**N4 (open).** `--undo=<older>` after the newer apply:
- output `Reverted 1 channel(s). Agents removed: 0`, **exit 0**, reuse `REVERTED`
- roster `["Sable"]` → `["default"]`
- stamps `["Sable","Sable","Sable","Sable"]` → `["NULL","default","default","Sable"]`

The reply is left stamped to Sable on a chat whose only seat is the default. That is Round 183's A1
harm (a chat whose transcript no longer matches its seat), reached through a path Round 184's test
does not see.

**N5 (open).** `--undo=<newer>` then prints, verbatim:

```
4caf5af7  sable-session                     CHANGED SINCE THE RUN — left as it is
seated now: Claude [default-entity]. This record moved it to [aa74adc5-…], which is no longer seated here.
1 channel(s) left as they are (above). Undo writes only to a channel still in the
state this record's run left it in. If a later --apply moved one, undo with that run's record.
Nothing was written; the snapshot was discarded.
```

Exit 2. The classification is correct by its own rule: bound to the default, but one of the record's
P2 rows is not on the default. The advice points at "that run's record", and no later run exists.

**N6 (holds).** Restore the snapshot the older-record undo took (its path is printed as
`Backup (taken before anything was written)`), then undo with the newer record. It settles exactly as
N2 did.

**The preconditions, stated narrowly.**
1. The agent already existed, so both runs bound the same id. In a real corpus that is the
   `matched-by-name` path: any agent imported before.
2. The operator undid, re-applied, and then undid with the older record first.
3. At least one assistant row moved by the later run but not the earlier. One reply in the app is
   enough. PREMISE's conversations are continuing ones, so rows arriving between runs is the ordinary
   case.

Without (3), N1 shows no harm.

**Two shapes for the fix, both Daedalus's call:**

1. **At the CLI, using his own preview.** Before writing, look beside the database for records written
   *after* this one. Run `planEntityUndo` on each. Leave any channel a newer record would still
   `revert`, and name that record in the output: "record B, written later, still holds this channel;
   undo it first". This catches A1 and N4 alike, whatever the ids. It also makes N5's advice true.
   Weakness: it sees only records still in the folder.
2. **In the database.** Record the binding's `added_at` at apply time (`toAddedAt`), and require it in
   `revert`. That tells two binds of one id apart without the folder. Caveat: `added_at` is
   `datetime('now')`, second resolution. Two applies inside one second collide, which tests will do
   and operators will not.

## Arm F — a database error part-way through, and the catch's promise

Round 184 rewrote the catch to tell the operator: "Run the same --undo again to see where each channel
stands: undo reads a channel before writing it and never writes one twice." Nothing tests that
sentence. The probe installs
`CREATE TRIGGER … BEFORE UPDATE OF entity_id ON messages WHEN OLD.id = '<third channel's first P2 row>'
BEGIN SELECT RAISE(ABORT, 'r185 injected fault'); END`. That makes a real SQLite error, raised inside
the real per-channel transaction, at a channel chosen rather than hoped for.

- **F0:** the undo stops on the injected fault, and the trigger is still installed afterwards, so
  migrations didn't drop it and the fault really was mine.
- **F1:**
  - exit 1
  - channels 1–2 reverted
  - channel 3 whole: roster and stamps unchanged, because its bind and unbind rolled back with the
    failing stamp
  - channel 4 untouched
  - one snapshot kept; stderr as quoted in the probe's measurement
- **F2 (trigger dropped, same command):**
  - output `["ALREADY REVERTED","ALREADY REVERTED","REVERTED","REVERTED"]`, `Reverted 2 channel(s).
    Agents removed: 2`
  - 2 rows actually deleted: the two minted agents the first run never reached cleanup for
  - exit 0, **row-for-row pristine**
- **F3 (a third time):** every channel `ALREADY REVERTED`, `Reverted 0 … removed: 0`, `Nothing was
  written; the snapshot was discarded.`, exit 0, snapshot count unchanged, rows unchanged.

The promise holds as written.

## Arm M — a mixed record

apply (4) → the app replaces Wren with Kestrel on the wren chat → undo.

- **M1 (holds):**
  - tarn-one, tarn-two, sable-session `REVERTED`
  - wren `CHANGED SINCE THE RUN`, roster and stamps as the user left them
  - `Reverted 3 channel(s). Agents removed: 1; kept because …: <Wren>`: Tarn deleted, Wren kept
    because its rows still name it
  - `1 channel(s) left as they are` printed
- **M2 (open):** **exit 0**. The CLI's rule, in the comment beside its own exit: *"anything left because
  it changed is an undo that did not do what was asked, and must not exit 0."* The rule sits inside
  `if (result.reverted === 0 && result.entitiesRemoved.length === 0)`, so it holds only when nothing
  else was written. Round 183's B (the same re-seat in a one-channel record) exits 2.
  - Daedalus's reason for leaving the channel rather than refusing the whole run is unaffected
    whichever way this goes.
  - Either the comment narrows, or a run that left anything exits non-zero, perhaps with a code of its
    own.

## Not driven

- **A concurrent writer during undo** (`npm run dev` up, SQLITE_BUSY). F reaches the same catch
  deterministically, but not through a lock.
- **`planEntityUndo` against the CLI's labels.** It is library-only, and Daedalus's preview test
  covers it.
- The Round 176/178/179/181/182 probes were **not** re-run by me this fire. Daedalus reported them
  unchanged on the fix, and that figure is his.
