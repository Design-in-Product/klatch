# Round 191 — Round 190 holds, and the restore it now names does not work the way a person does it

**Theseus · 2026-09-11 (WORK fire) · code at `309da3cd` (contains Daedalus's Round 190, `7a0ba775`)**
**Instrument:** `scripts/probe-round191-restoring-the-backup-the-way-a-person-does.mts`
**Also:** `scripts/probe-round189-the-restore-wording-on-a-minted-channel.mts` (re-vehicled)

---

## For xian, first

Nothing here touches the dry run. It concerns the way back **after an `--apply`**.

1. **Stop `npm run dev` before you `--apply`.** Round 176 said the CLI can run with it up, and for the dry run
   that's still true. For an apply it's the condition everything below needs.
2. **To undo an apply, prefer `--undo`.** On a database a failed copy had left in the post-run state, it reverted
   all four channels to the backup, row for row (arm U). The one place it failed was the corrupt file (arm H),
   where only step 3 works.
3. **If you ever restore the backup file by hand:** stop the app, **delete `klatch.db-wal` and `klatch.db-shm`**,
   then copy the backup over `klatch.db`. Then run the dry run: its `Candidates:` line should match the one printed
   before the apply.

**What happens if you don't:** with the app's server running during an apply, a plain `cp` of the backup restores
nothing. The app reads the database exactly as the apply left it, with no error. If the app was also used for a
while between the apply and the copy, **the copy left a corrupt database** in both runs
(`database disk image is malformed`): the app won't open it and undo fails on it. The backup file itself survives,
and step 3 recovers from there (H2).

## 1. Round 190, reproduced first

Unmodified probes on `309da3cd`, before touching anything:

| Probe | Result | Daedalus's "After" |
|---|---|---|
| R189 | **12 · 0 failed · 0 open · 6** (M2, U2 pass; V1/V2 exit 1 at the record check) | 12 · 0 · 0 · 6 |
| R187 | **11 · 0 · 0 · 4** | 11 · 0 · 0 · 4 |
| R185 | **15 · 0 · 0 · 3** | 15 · 0 · 0 · 3 |

The server/client suites weren't re-run by me. Argus's sweep (`309da3cd`) reports 1611 / 311; that's his number.

**R189 re-vehicled**, for the same reason as R187's S2: a pass branch that greps for a restore word anywhere would
go on passing a wrong line on the wrong channel.
- **M2** asserts wren's own reason line is Round 190's minted-channel sentence verbatim. It also asserts the
  older-record advice prints once, with no later-run wording and no bound-branch "it is seated". The open branch
  is gone.
- **U2** is checked per channel. reuse must carry the earlier-binding sentence, and each of the three minted
  channels the no-longer-exists sentence, with the advice ×1.
- **V1/V2** changed from measurements to checks: exit 1, the field and value named, "Nothing was written and the
  snapshot was discarded", no channel classified, nothing written.

**14 checks · 0 failed · 0 open · 4 measurements, two runs.**

### The rule's premise, read

Daedalus's invitation: *"If you can find a path that writes an older `added_at` some other way, the rule
misnames it."* I couldn't find one:
- every `channel_entities` INSERT takes the column default `datetime('now')` (`db/index.ts:76`), except undo's
  (`entity-backfill.ts:781`);
- nothing UPDATEs the table;
- only apply (`:443`) and undo (`:787`) write `messages.entity_id`;
- a candidate has exactly one seat, the default (`multi-bound` skip, `:315`);
- every record's `fromEntityId` is the default (`:484`);
- a `.klatch` import into an existing channel id forks under a new id (`klatch-import.ts:220`).

So after a run, a recorded channel can only hold a seat older than `toAddedAt` (that is neither the run's agent
nor the default) in a database from before the run. The same reading says the excluded "undone, then disturbed"
state needs stamps changed without apply's unseat. Nothing but apply and undo stamps, so no product writer
reaches it, and the exclusion is defensive. That comes from the code, not from driving.

`isSqliteDatetime` parses with a `Z` suffix, so it's UTC. A daylight-saving gap can't refuse a real
`datetime('now')` string. I had that down as a candidate, and the code rules it out.

## 2. The question

Round 190's refusal now tells an operator *"this database is from before the run (a restored backup?)"*. Three
places name restoring the snapshot as a way back:
- the CLI header (`backfill-entity-bindings.mts:37`);
- the scoping doc (`docs/plans/entity-backfill-scoping-2026-09-02.md:273`);
- the 9/9 dry-run memo (`:58`).

**None says how.** I searched `docs/` for "restore the snapshot", "restore the backup", "copy the backup" and
`backup-backfill`. Every restore in my Rounds 185–189 used the probes' own `copyDb`: delete the sidecars, then
`db.backup()`. No probe has restored the way a person does, with `cp`.

Read before driving:
- the database is WAL (`db/index.ts:33`);
- the server opens it lazily with `getDb()` and has no shutdown handler (`packages/server/src/index.ts`);
- `npm run dev` is `tsx watch src/index.ts` under `concurrently`;
- the CLI never closes its writable connection.

## 3. The instrument

Real CLI subprocesses, on Round 176's fixture. The fixture is checkpointed after build, so the main file holds
everything and the WAL nothing, as in a long-lived database. The second connection is the server's own
`getDb()` module under `tsx watch`, in its own process group. It is stopped with SIGINT to the group, which is
what Ctrl-C sends.

State is compared as a hash of the rows undo writes (message stamps, bindings with `added_at`, agents). Each is
read two ways:
- **with its WAL**, which is what the app sees;
- **as `klatch.db` by itself**, a sidecar-free copy.

Zero model calls. `klatch.db` is never opened.

**Substitution, stated:** this is the server's `getDb()`, not the Hono process. The server hardcodes port 3001
(`index.ts:48`), so a real one could collide with xian's. It also loads `.env` with `override: true`
(`index.ts:17`), so a scratch `KLATCH_DB` in the environment would lose to one in `.env`, which I didn't read.
`tsx watch` runs alone here, not under `concurrently`.

## 4. Results — run 3 (final instrument): 11 checks · 0 failed · 3 open · 7 measurements

Predictions were written in the session log before run 2. Run 2 was the same instrument without H2:
**10 · 0 · 3 · 7**, with every other state the same as run 3.

| Arm | What | Result |
|---|---|---|
| **S1** | No other connection: apply, `cp` | **Pass.** The backup, row for row. The sidecars were absent after the apply. |
| **K0** | Connection open through apply; Ctrl-C | Connection saw the backup, then post-run. Ctrl-C: exit 130, no process left, not forced. `-wal` 86,552 bytes before and after the stop. |
| **K1** | …then `cp` | **Open.** The app reads **the post-run state**, row for row, integrity ok. `klatch.db` by itself **is the backup**. No command printed an error. |
| D | Dry run on K's file | `Candidates: 4 — 0 would move, 4 skipped`, against `8 — 4 would move` before the apply and after a real restore. |
| A | The app starting again on K's file | Exit 0, sees post-run. The sidecars are unchanged after it exits: it doesn't merge the WAL, and `klatch.db` by itself is still the backup. |
| U | `--undo` on K's file | REVERTED ×4, exit 0, the backup row for row. **Undo recovers a failed `cp`.** |
| **L1** | `cp` while the connection is up | **Open.** The connection, a new reader, and the file after a write and Ctrl-C all read post-run. `klatch.db` by itself is the backup. |
| **H0** | K, plus 1500 messages through `insertMessage` after the apply | `-wal` 4,132,392 bytes (autocheckpoint 1000). After Ctrl-C, `klatch.db` by itself held 1466 of 1554 messages (1452 in run 2). |
| **H1** | …then `cp` | **Open. `database disk image is malformed`.** `integrity_check`: 101 lines, from `Tree 4 page 1456: btreeInitPage() returns error code 11` (run 2: pages 1343–1442). `klatch.db` by itself is the backup, intact. |
| H | App start / `--undo` on H's file | App: **exit 3, malformed**. Undo: **exit 1**, `undo stopped on a database error: database disk image is malformed`, then "Channels before the failing one may already be reverted". |
| **H2** | From there: delete both sidecars, `cp` | **Pass.** The apply's backup file is untouched, and the file is the backup row for row, integrity ok. |
| **C1** | Stop, delete `-wal` and `-shm`, `cp`, after the same 1500 writes | **Pass.** The backup row for row; dry run back to `8 — 4 would move`. |
| Z | No product file touched | Pass. |

**Run 1** used an earlier instrument: an un-checkpointed fixture, no H, and no sidecar-free reads. Same K1/L1
direction, **8 · 0 · 2 · 6**.

## 5. What it means

Measured: in K, L and H, the file `cp` wrote is the backup. What the app reads is that file with the old
`klatch.db-wal` beside it. A copy replaces the database file and leaves the WAL.
- In K and L, the WAL holds the run's pages, and the backup comes back as the run.
- In H, an autocheckpoint had already moved most of the run and the use into the main file, and the WAL held
  the rest. Replayed over the backup, those pages belong to neither state: the b-tree is broken.

Why SQLite applies an unrelated WAL to a file is my understanding of its design (a database and the `-wal` of the
same name are paired by name). It is not measured here; the outcomes are.

Why nobody saw it: **with no other connection, the apply's exit leaves no `-wal`, and `cp` works (S1).** That's
the condition every probe so far has run under.

This isn't Round 190's defect. Its wording is right. It points an operator at a way back that fails silently
under the condition Round 176 said was fine.

## 6. Fix shapes — Daedalus's call

1. **Say how, where it's needed.** Where the CLI prints `Backup (taken before anything was written): <path>`,
   also print the three steps from "For xian" item 3. Make the same change in the header and wherever
   `(a restored backup?)` is printed. That's cheapest, and it closes K, L and H for someone who reads the output.
2. **Don't `--apply` while another connection holds the database.** This removes the condition, and reverses
   Round 176's "run it with `npm run dev` up" for apply only. **How to detect that is open:** an idle connection
   holds no lock, so a `wal_checkpoint(TRUNCATE)` may succeed with the server open. Whether a checkpoint at the
   end of an apply alone would close K (though not H) is also not measured.
3. **A `--restore=<backup>` mode** that deletes the sidecars itself (or restores through the backup API), and
   refuses what it can't make safe. That's the most work, and the only shape that doesn't rely on the operator.

**My recommendation: shape 1 now.** It's cheap, it covers every arm here, and it's true whatever is decided
about 2 or 3. A server shutdown handler that closes the database would narrow K. It does nothing for L or for a
server killed any other way.

## 7. Not driven

- `npm run dev` itself, under `concurrently`.
- A terminal closed on the server (SIGHUP).
- Finder copy, `mv`, a Time Machine restore.
- A corpus the size of xian's.
- Whether H's corruption happens every time. It did in both runs, with different page ranges, and depends on
  which pages the WAL still holds.
- Whether an undo snapshot taken from a corrupt file is itself usable.

## 8. Corrections to myself this fire

1. **A reproduction chain that measured nothing.** Its `mkdir` was in a command the tool layer refused, and every
   redirect failed silently behind `|| true`. I caught it before counting any result.
2. **Arm A in run 1 said "the file alone".** It opened the file together with its WAL. Now read from a
   sidecar-free copy.
3. **Run 1's fixture had everything in the WAL**, which is not like a long-lived database. It's now checkpointed,
   with a guard.
4. **The integrity string split rows rather than lines**, so H printed about 100 lines twice. Fixed before run 3.
5. **A draft of this doc said `--undo` "works in every case measured here".** Undo was driven on two files: it
   worked on one and failed on the other. Corrected before commit.
