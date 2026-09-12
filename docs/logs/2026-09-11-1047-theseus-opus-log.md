# Theseus — 2026-09-11 (START fire, Opus 5)

Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.

---

## 10:47 — briefing

Worktree at `968d1006` (Daedalus's Round 188), clean. `git fetch` shows `origin/main` at the same commit.
Read `docs/COORDINATION.md` (my section says Round 187, status available), swept `docs/mail/`, and
read `docs/briefs/cross-pollination/current.md`. Today's brief: a cleanup that installs no check is a
rollback (Piper Morgan's mailbox nesting).

New to me this fire:
- **Argus's memo** `argus-to-theseus-cc-daedalus-xian-round185-n0-n1-flaky-on-the-second-boundary-2026-09-11.md`.
  R187 reproduced clean. R185 re-vehicled is **flaky**: run 2 put N0's two `toAddedAt` in the same
  second, so N0 and N1 fail. His fix: a `tick()` before N0's second apply. Actioned this fire.
- **Daedalus's Round 188** (`968d1006`, 09:24) closes my R187 S2/G1/G2. The commit touches three files
  (`entity-backfill.ts`, the CLI, the test file). **No memo and no board entry** have landed on
  `origin/main` as of this fetch. That is recorded, not explained.

Checked before building: every `channel_entities` insert takes the column default
`datetime('now')`, except undo's re-INSERT of `fromAddedAt`, which Round 188 now validates.
Sites: `db/index.ts:363`, `entity-backfill.ts:438,753`, `klatch-import.ts:287,321`,
`queries.ts:184,495,1297`. So the database side of Round 188's "string order is time order" also
holds in the code as read.

## 10:5x — R187 unmodified on Round 188: 11 · 0 failed · 0 open · 4 measurements

S2, G1 and G2 all took their pass branches. Two things the green hides:
- **S2's pass branch was a bare `true`.** It asserted nothing about what 188 prints.
- **`voiceFor`'s filter didn't match 188's new restore-advice line**, so the captured voice never
  showed it.

Re-vehicled:
- **S2** now asserts the earlier-binding line and the older-record advice are printed, and that
  neither `later binding` nor `If a later --apply` is.
- **G1/G2's open branches are failures.** They also assert exit 1 and the precise problem text.

## 11:0x — Argus's N0/N1 finding: agreed, fixed

His diagnosis is right. N0 asserts the two `toAddedAt` differ, but nothing made them differ, and R187
had already solved this with `tick()`. Same gap one arm later: N3's second apply follows a reply
subprocess that *usually* spans a second, and N4 depends on the same comparison. Both second
applies now `await tick()`, and N3 also asserts the two `toAddedAt` differ.

**R185 hardened, run 1: 15 · 0 failed · 0 open · 3 measurements.** N0 `17:50:36 / 17:50:38`, N3
`17:50:41 / 17:50:44`.

## 11:0x — Round 189 prediction, written before building

Round 188 fixed the wording only in the branch where the record's agent is still **bound**
(`entity-backfill.ts:675-678`). Take the same restore (apply A → undo A, snapshot kept → re-apply B →
restore the snapshot) on a **minted** channel. B's re-minted agent doesn't exist in the restored DB,
so the channel goes through the not-bound branch (`:684-699`). There it is `changed-since` with
neither flag. The CLI (`backfill-entity-bindings.mts:380-386, 420`) will print "which no longer
exists." and "If a later --apply moved one, undo with that run's record first.", with no restore
line. That is S2's wrong direction again, on the channel kind that makes up most of the fixture's
moved channels (wren and both tarns vs one reuse).

## 11:1x — second runs, type checks

- **R185 hardened, run 2: 15 · 0 · 0 · 3.** N0 `17:52:13 / 17:52:15`, N3 `17:52:18 / 17:52:20`.
  Two runs green. Argus saw a coin flip on two runs, so two green runs don't prove the flake is gone.
  What closes it is that the tick makes a same-second pair impossible, and N0/N3 would now fail loud
  if one happened anyway.
- **R187 re-vehicled, run 1: 11 · 0 · 0 · 4.** S2 prints the earlier-binding line, the older-record
  advice, and no later-run wording. G1/G2 exit 1 with the precise problem text.
- `tsc --noEmit --strict --module nodenext`: R185, R187, and the new R189 probe all clean (no
  output).

Round 189 instrument written: `scripts/probe-round189-the-restore-wording-on-a-minted-channel.mts`.
Arms:
- **M:** restore after re-applying wren.
- **U:** restore after an unfiltered re-apply.
- **K:** control; the app re-seats wren, which really is later.
- **E:** the agent deleted in the app, leaving zero seats.
- **V:** well-shaped non-times, measured only.
- **Z:** no product file touched.

Run 1 started.

## 11:2x — R189 run 1: 12 checks · 0 failed · 2 open · 6 measurements

**The prediction held.**
- **M0/M1/M3 pass.** After the restore, B's record (`--channels=<wren>`) is refused, exit 2, and
  writes nothing. A's record then settles pristine.
- **M2 open.** The refusal prints "which no longer exists" and "If a later --apply moved one, undo with
  that run's record first", with no restore line. Wren's only seat is `17:54:55`, earlier than B's run
  at `17:54:57`.
- **U0/U1/U3 pass.**
- **U2 open.** One restore, four channels. Reuse gets 188's earlier-binding line; the three minted
  channels get "which no longer exists". The summary prints **both** "If a later --apply moved one,
  undo with that run's record first" and "the record that fits it is an older run's".
- **K (control) passes.** The app re-seat's only seat is later than the run (`17:55:02 > 17:55:01`),
  while in M every seat was earlier. The database does tell the two apart, even though neither
  record's agent is bound in either arm.
- **V (measured).** `toAddedAt "9999-99-99 99:99:99"` on an untouched DB is refused as "from before
  the run (a restored backup?)". `fromAddedAt "0000-00-00 00:00:00"` is accepted and written into the
  default's binding.

**Arm E does not add up yet, and I'm not reporting it until it does.** E0 left wren with **0 seats**.
The undo then printed `seated now: Claude [default-entity]` and "Nothing was written; the snapshot
was discarded". My dump says the database **changed** across that CLI call. Hypothesis, not yet
checked: `getDb()`'s migrations seat the default on a chat with no seat (`db/index.ts:363`), so the
write comes from opening the database, not from undo. Reading it now.

**Explained, from the code:** `db/index.ts:354-365` runs on every open. Any chat with no row in
`channel_entities` gets the default assigned. The CLI opened a zero-seat chat, so that code seated the
default, and only then did undo classify it. The write is that code's, not undo's. So:
- arm E's zero-seat state can't reach the classifier through the CLI;
- the app would do the same on its next start, since it opens the database the same way.

Arm E re-instrumented to print the exact row diff, so the next run *shows* where the write came
from instead of me asserting it. Runs 2 (old E wording, already started) and 3 (new) follow.

A caveat for any fix shaped as "every seat is earlier than the run". Undo restores the default's
binding with the **original** `fromAddedAt` (Round 178), which is also earlier than the run. So "this run
was undone, then something else disturbed the rows" would look like a restore too. The clean undone
case is caught first by `already-reverted`. The disturbed one is not driven here. Naming it for
Daedalus, not claiming it.

The CLI snapshots from a read-only handle (`backfill-entity-bindings.mts:304-305`) before setting
`KLATCH_DB` for `getDb()` (`:310`). So the snapshot undo discards is the pre-migration state.

## 11:3x — R189 run 2: 12 · 0 · 2 · 6, same states as run 1

Run 2 was on the old arm-E wording, and every check landed in run 1's state. `tsc --strict` on R189
after the E edit: clean. R187 re-vehicled run 2 is running. R189 run 3 (final E) follows it. The
writeup is drafted at `docs/research/round189-the-restore-wording-on-a-minted-channel-2026-09-11.md`,
with E's run-3 numbers still to fill.

## 11:4x — R187 run 2, memo, board

- **R187 re-vehicled, run 2: 11 · 0 · 0 · 4**, every check in run 1's state.
- Memo filed: `docs/mail/theseus-to-daedalus-argus-cc-xian-calliope-188-holds-and-on-a-minted-channel-the-restore-still-reads-as-a-later-run-2026-09-11.md`.
  - Argus: agreed, fixed, two runs.
  - Daedalus: 188 reproduces; M2/U2 open with a shape and two caveats.
  - xian: one line.
- Threads closed with `git mv` to `docs/mail/read/`: Argus's N0/N1 memo, and my Round 187 memo
  (S2/G1/G2 all closed by `968d1006`). Left in `docs/mail/`: Daedalus's 9/9 apply-pass memo (xian's
  dry run), which is still open.
- Writeup: one unverified sentence caught on re-read and softened. I had said a direct
  `undoEntityBackfill` call *can* see a zero-seat chat; it now says that wasn't checked.
- COORDINATION: my section's status is now Round 189. The Round 187 text is kept below it as a dated
  entry.
- `git fetch` at ~11:4x: `origin/main` is still `968d1006`. Daedalus's Round 188 memo/board entry
  hasn't landed.

## 11:4x — R189 run 3 (final instrument): 12 · 0 · 2 · 6, same states as runs 1–2

Arm E's row diff, measured rather than asserted:
- **Added:** exactly one row, `channel_entities {wren, default-entity, "17:58:31"}`.
- **Removed:** nothing.
- **Seats after:** the default only. `17:58:31` is later than the run's `toAddedAt` `17:58:29`.

The attribution to `db/index.ts:354-365` holds: that is the only row it writes, and nothing else
changed. Writeup's E section filled with these numbers.

## Carried, unchanged

**Round 170's frequency probe** still needs one path to the real `klatch.db` from xian.

## Wrap verification (START fire)

Step 1 — commits on `origin/main` (after push):

```
$ git log origin/main --oneline -3
1d623592 Round 189: R185 hardened past the second boundary, R187 re-vehicled on Round 188, and on a minted channel the restore still reads as a later run
723e8b70 mail: Round 189 reply to Daedalus + Argus -- 188 holds, R185 flake fixed, on a minted channel the restore still reads as a later run; Argus N0/N1 and R187 threads to read/
968d1006 Round 188: an earlier binding is named as a restore, not a later run, and undo records' added_at fields are checked
```

Both of this fire's work commits are on `origin/main`. Mail was pushed first, on its own.

Step 2 — deliverable files, each `ls`'d, all eight present:

```
docs/logs/2026-09-11-1047-theseus-opus-log.md
docs/mail/read/argus-to-theseus-cc-daedalus-xian-round185-n0-n1-flaky-on-the-second-boundary-2026-09-11.md
docs/mail/read/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-n1-and-n6-agreed-and-after-a-restore-the-refusal-blames-a-later-run-2026-09-10.md
docs/mail/theseus-to-daedalus-argus-cc-xian-calliope-188-holds-and-on-a-minted-channel-the-restore-still-reads-as-a-later-run-2026-09-11.md
docs/research/round189-the-restore-wording-on-a-minted-channel-2026-09-11.md
scripts/probe-round185-what-the-undo-classifier-knows-a-run-by.mts
scripts/probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts
scripts/probe-round189-the-restore-wording-on-a-minted-channel.mts
```

No product or CLI file changed:
- `1d623592`'s stat lists only the three probes and the writeup;
- `723e8b70`'s lists only mail;
- arm Z (`git status --porcelain -- packages scripts/backfill-entity-bindings.mts`) was clean on every
  R187/R189 run.

What I measured this fire:
- R187: three runs (unmodified, then re-vehicled twice)
- R185: two runs (hardened)
- R189: three runs
- `tsc --strict` on all three probes

**Not** re-run by me: the server and client suites (no product file changed), and
R176/178/179/181/182/183. Daedalus's commit message says server 1602 → 1606; that figure is his,
not re-measured here.

Step 3 — this log and the COORDINATION update are committed last.

## What xian needs from this fire

One line, and nothing in it blocks the dry run: **after restoring a backup, undo with the record
from the run the backup is in (the older one), whatever the refusal suggests.** On a chat whose
agent the backfill created, it still suggests the newer one. M2/U2 are Daedalus's to rule on.

---

# WORK fire (14:47 PT)

## 14:47 — briefing

Worktree at `309da3cd` (Argus's Round 190 sweep), clean, up to date with `origin/main`.

New to me since START:
- **Daedalus's Round 190** (`7a0ba775`, 13:25) and his memo
  `daedalus-to-theseus-argus-cc-xian-calliope-on-a-minted-channel-the-restore-now-reads-as-a-restore-2026-09-11.md`.
  It closes M2/U2 with my shape, narrowed on both caveats I named, and closes V as well: `checkUndoRecord` now
  round-trips each `added_at` through `Date`. His Round 188 memo gap is explained there too: the START
  fire left its docs uncommitted, and they are now at `8eae5c4d`.
- **Argus's sweep** (`309da3cd`): R189/R187/R185 match Daedalus's tables, server 1611, client 311. That's his
  measurement, not mine.
- His one invitation: *"If you can find a path that writes an older `added_at` some other way, the rule
  misnames it."*

## 14:5x — the premise, read before driving anything

- **V's round trip is UTC.** `Date.parse(at.replace(' ', 'T') + 'Z')` (`entity-backfill.ts`, `isSqliteDatetime`).
  So a daylight-saving gap can't make a real `datetime('now')` string fail. I had that down as a candidate;
  it's ruled out from the code.
- **Writers of `channel_entities`:** every INSERT takes the column default `datetime('now')`
  (`db/index.ts:76`), except undo's (`entity-backfill.ts:781`). No `UPDATE channel_entities` anywhere in
  `packages/server/src` or `scripts/`.
- **Writers of `messages.entity_id`:** only apply (`:443`) and undo (`:787`).
- **Candidacy:** `otherBindings > 0` → `multi-bound`, skipped (`:315`). So at apply time a candidate has exactly
  one seat, the default. And every record's `fromEntityId` is `DEFAULT_ENTITY_ID` (`:484`).
- **`.klatch` import** into an existing channel id forks under a new uuid (`klatch-import.ts:220`), so it can't
  add a seat to a recorded channel.
- **Consequence, from the code (not yet driven):** after a run, the only way a recorded channel can hold a
  seat older than `toAddedAt` that is neither the run's agent nor the default is a database from before the
  run. The rule looks sound at every writer I can find. Also, "undone, then disturbed" (default seated by
  undo **and** recorded stamps changed) needs stamps changed without apply's unseat. Apply unseats in the same
  transaction and nothing else stamps, so no product writer seems able to reach it. If so, the exclusion is
  defensive.

## 14:5x — reproduction, first attempt void

The first background chain wrote nowhere: its `mkdir` was in a command the tool layer refused. Every
redirect then failed, and `|| true` reported exit 0. **No result from it is counted.** Re-run with the
directory created first in the same chain.

## 14:53 — Round 190 reproduced on `309da3cd` (which contains `7a0ba775`)

- **R189 unmodified: 12 · 0 failed · 0 open · 6.** M2 and U2 took their pass branches. V1/V2 exit 1 at the record
  check.
- **R187: 11 · 0 · 0 · 4.**
- **R185: 15 · 0 · 0 · 3.**

All three are Daedalus's "After" column exactly. Outputs are in `.testdata/r191-repro/` (gitignored).

## 14:5x — R189 re-vehicled on Round 190

Same lesson as R187's S2: a pass branch that only greps for a restore word anywhere in the output would
go on passing a wrong line on the wrong channel.
- **M2** asserts wren's own reason line is the minted-channel sentence, verbatim. It also asserts the
  older-record advice prints once, with no later-run wording and no bound-branch "it is seated" sentence.
  The open branch is gone, so a regression now fails.
- **U2** is checked per channel. reuse must carry the earlier-binding sentence, and each of the three minted
  channels the no-longer-exists sentence. The advice prints ×1, with no later-run wording.
- **V1/V2** changed from measurements to checks: exit 1, `not a backfill undo record:`, the exact
  `channels[0].<field> is "<value>", expected …` problem, "Nothing was written and the snapshot was
  discarded.", no channel classified, nothing written, 0 snapshots. V2 also asserts the default's
  `added_at` on wren is still absent.
- `tsc --noEmit --strict`: clean.
- **Run 1: 14 checks · 0 failed · 0 open · 4 measurements.**

## 14:5x — the restore Round 190 now names, done the way a person does it

Round 190's refusal now says *"this database is from before the run (a restored backup?)"*. The CLI header
(`:37`) lists "restore the snapshot" as one of two ways back, and so do the scoping doc (`:273`) and
Daedalus's 9/9 dry-run memo (`:58`). **Nothing I can find says how.** I searched docs for "restore the
snapshot / restore the backup / copy the backup / backup-backfill". Every restore in R185/R187/R189 used the
probe's own `copyDb` (delete sidecars, then `db.backup()`), which is not what a person types.

Checked at source first:
- the DB is WAL (`db/index.ts:33`);
- the CLI never closes its writable connection (the only `close()` is the read-only source, `:306`);
- the server has no SIGINT/close handling, and `getDb()` is lazy;
- Round 176 told xian he can run the CLI with `npm run dev` up.

**Scouts, not scored** (`.testdata/r191-scout/`, gitignored):
- **Solo** (no other connection): `--apply` exits, `-wal` absent, db 98,304 bytes. `cp backup klatch.db` →
  **the backup's state** (2 entities, 10 default seats, 0 re-stamped, integrity ok). The restore works.
- **K** (a holder opened with `getDb()`, stopped with group SIGINT, then `cp`): `-wal` is 589,192 bytes after
  apply and **still 589,192 after the stop** (exit 130). After `cp`, a fresh reader sees **the post-run state**:
  4 entities, 6 default seats, 12 re-stamped, integrity ok.
- **L** (`cp` while the holder still runs): the holder and a fresh reader both see post-run. After a holder
  write and stop, still post-run.

**Reading, to be measured properly before it's reported:** with a second connection alive during apply,
the run's pages stay in `klatch.db-wal`. A stop without a close leaves them there. A file copy replaces
only `klatch.db`, and SQLite replays the stale WAL over it on next open. The "restore" gives back the run
it was meant to undo, silently, with integrity ok. The solo case works, which is why no probe so far would
have seen this.

Next: an instrument with the real dev server (`tsx watch src/index.ts`) on a scratch DB, and controls
for the procedure that does work.

## 15:0x — why the holder is not the Hono server

I read `packages/server/src/index.ts`. It loads `.env` with **`override: true`** (`:17`) and hardcodes port 3001
(`:48`). The `lsof :3001` and `grep -c KLATCH_DB .env` checks needed approval this fire can't get. So a real
server would rest scratch isolation on a file I haven't read, on a port xian may be using. The holder is
the server's own `getDb()` module under `tsx watch` (the dev server's runner). The substitution is stated
in the probe header.

## 15:0x — R189 re-vehicled run 2, R191 run 1

- **R189 re-vehicled, run 2: 14 · 0 · 0 · 4**, same as run 1.
- `tsc --strict` on R191: clean.
- **R191 run 1: 8 checks · 0 failed · 2 open · 6 measurements.**
  - **S1 (no other connection): `cp` gives back the backup**, row for row.
  - **K0:** the connection saw the backup's hash before the apply and the post-run hash after. Ctrl-C to its
    group ended every process of it without force (exit 130). The `-wal` was 589,192 bytes before and after
    the stop.
  - **K1 open:** after `cp`, the file reads **the post-run state, row for row** (hash `a2c9…`, integrity ok). No
    command printed an error.
  - **D:** the dry run on that file prints `Candidates: 4 — 0 would move, 4 skipped`. On the correctly
    restored S file it prints `Candidates: 8 — 4 would move, 4 skipped`, the same as before the apply. **So
    the dry run tells the two apart**, if the operator compares.
  - **U:** `--undo` with the run's record on K's file gives REVERTED ×4, exit 0, and the backup row for row.
    **Undo recovers a failed `cp` restore.**
  - **L1 open:** `cp` while the connection is up. The connection, a new reader, and the file after a write and
    Ctrl-C all read post-run.
  - **C1 (stop, delete both sidecars, then `cp`): the backup, row for row.** The dry run is back to
    `8 — 4 would move`.

**Three faults in my own instrument, caught before reporting:**
1. Arm A's "the file alone reads post-run" is wrong. `view()` opens the file **with** its WAL. What
   `klatch.db` holds by itself was never measured. Fix: view a sidecar-free copy.
2. The fixture's main file was 4,096 bytes, with everything in the WAL (the builder never checkpoints). A
   long-lived real DB has most pages in the main file. Fix: checkpoint (TRUNCATE) after build, so the WAL
   holds only what happens after.
3. The case most likely to do harm isn't driven. The app is used between the apply and the restore, long
   enough to cross the 1000-page autocheckpoint and restart the WAL. A stale WAL would then hold only recent
   frames, and replaying them over the backup could mix pages from two states. Adding arm H for that. I'm
   not claiming what it shows until it runs.

## 15:1x — instrument revised; predictions for run 2, written before it runs

Changes:
- every fixture is checkpointed (TRUNCATE) after build, with a guard that the WAL is empty and the main file is
  larger than one page;
- every state is read both with its WAL and as `klatch.db` by itself;
- views survive a corrupt file;
- arm H is new: the holder writes 1500 messages through `createChannel` + `insertMessage`, one transaction each,
  after the apply;
- C now also runs after the same 1500 writes, so the control covers H's case.

Predictions:
- **S1 passes** (no other connection).
- **K1 still open, checkpointed fixture or not.** The `-wal` holds only the apply's frames (plus the holder's
  open-time migration writes). After `cp`, the app reads post-run, and `klatch.db` by itself reads **the backup**:
  the whole difference is in the WAL.
- **A:** the app starting again doesn't merge the WAL (run 1's sidecars were unchanged after it), so
  `klatch.db` by itself is still the backup. Low confidence on the mechanism. Run 1's CLI solo exit did delete
  its WAL.
- **D, U:** as in run 1.
- **L1 open.**
- **H:** the 1500 writes cross 1000 pages, so an autocheckpoint copies the run's pages into the main file, and
  later writes restart the WAL. After `cp`, the replayed WAL holds only the recent frames. **Prediction:
  NEITHER state, and possibly an integrity failure.** Confidence on integrity: low. I don't know which pages
  the last frames touch.
- **C1 passes.**

## 15:2x — R191 run 2 (revised instrument): 10 checks · 0 failed · 3 open · 7 measurements

Every prediction held.
- **S1 passes.** After the apply the sidecars are absent, and `cp` gives the backup.
- **K1 open.** The `-wal` is 86,552 bytes after the apply, unchanged by Ctrl-C (exit 130, no process left, not
  forced). After `cp` the app reads **post-run**, and `klatch.db` by itself reads **the backup**. The whole
  difference is the stale WAL.
- **D:** `Candidates: 4 — 0 would move`, against `8 — 4 would move` before the apply and after a real restore.
- **A:** the app starting again (exit 0) sees post-run. After it exits the sidecars are unchanged, and `klatch.db`
  by itself is still the backup. It doesn't merge the WAL.
- **U:** `--undo` gives REVERTED ×4, exit 0, and the backup.
- **L1 open.** Same reading, and after the connection writes and stops, `klatch.db` by itself is still the backup.
- **H0:** the 1500 `insertMessage` writes (3480 bytes each, autocheckpoint 1000) took the `-wal` to 4,132,392
  bytes. After Ctrl-C, `klatch.db` by itself held 1452 of 1554 messages. So the autocheckpoint had moved most
  of the run and the use into the main file, and the WAL held the rest.
- **H1 open: after `cp`, the database is corrupt.** `database disk image is malformed`, and `integrity_check`
  reports tree 4, pages 1343–1442, `btreeInitPage() returns error code 11`. `klatch.db` by itself is the backup,
  intact. The WAL replayed over it is what breaks it.
  - The app starting again: **exit 3, `database disk image is malformed`**.
  - `--undo` with the run's record: **exit 1**, `undo stopped on a database error: database disk image is
    malformed`, then "Channels before the failing one may already be reverted."
- **C1 passes after the same 1500 writes.** The `-wal` was 4,132,392 bytes when deleted. After `cp`, the backup row
  for row, and the dry run is back to `8 — 4 would move`.

Instrument fault: my integrity string split rows rather than lines, so H printed about 100 lines twice.
Fixed. Adding H2: from H's corrupt state, is the apply's backup file untouched, and does stop + delete sidecars
+ `cp` recover it? Then run 3 on the final instrument.

## 15:3x — R191 run 3 (final instrument): 11 checks · 0 failed · 3 open · 7 measurements

- `tsc --strict`: clean.
- **Every state is the same as run 2.** S1, K0, L0, H0, C1 and Z pass. K1, L1 and H1 are open. D/A/U read the same.
- **H1 is corrupt again:** 101 integrity lines from `Tree 4 page 1456`. `klatch.db` by itself held 1466 of 1554 messages
  after the stop (1452 in run 2), so the page ranges vary between runs and the corruption doesn't.
- **H2 passes:** after the app (exit 3) and undo (exit 1) both failed on the corrupt file, the apply's backup is
  untouched. Delete both sidecars, then `cp`, gives back the backup row for row, integrity ok.

## 15:3x — writeup, memo, board

- **Writeup** `docs/research/round191-restoring-the-backup-the-way-a-person-does-2026-09-11.md`. One overclaim was
  caught on re-read before commit. The draft said `--undo` "works in every case measured here"; it was driven on
  two files and failed on one. Shape 2's detection is marked open, because an idle connection holds no lock, so a
  TRUNCATE checkpoint may not see the server. Not measured.
- **Memo** `docs/mail/theseus-to-daedalus-cc-xian-argus-calliope-190-holds-and-the-restore-it-names-fails-with-the-dev-server-up-2026-09-11.md`.
- **Thread closed** with `git mv` to `docs/mail/read/`: my R189 memo and Daedalus's R190 reply (M2/U2/V closed,
  reproduced, re-vehicled).
- **COORDINATION:** my status is now Round 191, with Round 189 kept below as a dated entry.

## Wrap verification (WORK fire)

Step 1 — commits on `origin/main` (after push):

```
$ git log origin/main --oneline -3
c8483430 Round 191: Round 190 reproduces and its premise holds, and the restore its wording names gives back the run -- or a corrupt database
be3a93b4 mail: Round 191 to Daedalus cc xian/Argus/Calliope -- 190 reproduces and holds; the restore its wording names fails with the dev server up, and corrupts after app use; R189/R190 thread to read/
309da3cd coordination+log: Argus 9/11 WORK fire -- Round 190 swept per Daedalus's memo, all three probes reproduce clean
```

Both of this fire's work commits are on `origin/main`. Mail was pushed first, on its own, per the worktree
discipline.

Step 2 — deliverable files, each `ls`'d, all seven present:

```
docs/logs/2026-09-11-1047-theseus-opus-log.md
docs/mail/read/daedalus-to-theseus-argus-cc-xian-calliope-on-a-minted-channel-the-restore-now-reads-as-a-restore-2026-09-11.md
docs/mail/read/theseus-to-daedalus-argus-cc-xian-calliope-188-holds-and-on-a-minted-channel-the-restore-still-reads-as-a-later-run-2026-09-11.md
docs/mail/theseus-to-daedalus-cc-xian-argus-calliope-190-holds-and-the-restore-it-names-fails-with-the-dev-server-up-2026-09-11.md
docs/research/round191-restoring-the-backup-the-way-a-person-does-2026-09-11.md
scripts/probe-round189-the-restore-wording-on-a-minted-channel.mts
scripts/probe-round191-restoring-the-backup-the-way-a-person-does.mts
```

No product or CLI file changed. `c8483430`'s stat lists only `COORDINATION.md`, this log, the writeup and the two
probes; `be3a93b4`'s lists only mail. Arm Z (`git status --porcelain -- packages scripts/backfill-entity-bindings.mts`)
was clean on every R189 and R191 run.

What I measured this fire:
- R189: three runs (unmodified on Round 190, then re-vehicled twice)
- R187, R185: one run each (unmodified, reproduction)
- R191: three runs (run 1 on an earlier instrument; runs 2 and 3 on the final one, same states)
- two scouts before building the instrument
- `tsc --strict` on both probes, clean

**Not** re-run by me: the server and client suites (no product file changed) and R176/178/179/181/182/183.
Argus's sweep reports server 1611 / client 311 on `309da3cd`; that figure is his, not re-measured here.

Step 3 — this log is committed and pushed last.

## Carried, unchanged

**Round 170's frequency probe** still needs one path to the real `klatch.db` from xian.

## What xian needs from this fire

Three lines, none about the dry run: **stop `npm run dev` before any `--apply`; to undo an apply prefer
`--undo`; and if you ever copy the backup back by hand, stop the app and delete `klatch.db-wal` and
`klatch.db-shm` first.** A plain copy with the server up restores nothing and says nothing; after the app has
been used since the apply, it leaves a database the app cannot open. The backup file itself survives, and the
delete-then-copy procedure recovers from there.

---

# STOP fire (19:47 PT)

## 19:47 — briefing

Worktree at `4bf88d53` (Iris's 9/11 STOP no-op), clean, synced to `origin/main` by the wrapper.

New to me since WORK:
- **Daedalus's Round 192** (`5753eeb2`, 17:29) and his memo
  `daedalus-to-theseus-cc-xian-argus-calliope-shape-1-is-in-and-your-unmeasured-checkpoint-question-closes-two-of-your-three-open-arms-2026-09-11.md`.
  Adopts my shape 1 (`restoreInstructions()`, one source, three CLI sites + header), narrows one site I
  asked for with a classifier reason, and answers my §6 item 2: a TRUNCATE checkpoint returns `busy: 0`
  against an idle connection, so **shape 2 has no detector** — my caution was right. He turned the same
  fact into `checkpointAfterWrite()`. His numbers on my probe: 11 · 0 · 1 open · 7.
- **Argus's sweep** (`e4b4f455`): read the diff and all four tests, re-ran my R191 probe unmodified,
  **11 · 0 · 1 · 7**, server 1615, client 311 + 13 skipped. His measurement, not mine.
- **Iris's STOP fire** (`4bf88d53`): no-op.
- Cross-pollination brief re-read: a cleanup that installs no check is a rollback.

## 19:5x — a tool-layer trap I walked into again, recorded

My first attempt to start the R191 reproduction chained `mkdir -p … && npx tsx … > file` with a trailing
`echo "EXIT=$?"`. The tool layer refused the `echo` and **discarded the whole chain** — no directory, no
run, no output file. This is the same shape as the WORK fire's 14:5x void, one clause later. **Nothing
from that attempt is counted.** Re-issued without the trailing clause and it ran. Note for the next
fire: a refused clause voids the command it is in, so the `> file` redirect is not evidence the command
ran; check the file exists.

## 20:0x — R191 unmodified on Round 192: 11 · 0 failed · 1 open · 7 measurements

Reproduced from my own seat on `4bf88d53`. **K1 PASS, L1 PASS, H1 OPEN** — Daedalus's "After" column
exactly, and Argus's sweep number exactly.

What the pass branches rest on, read rather than assumed:
- `-wal` after the apply with the connection open is **0** (was 86,552 pre-192 on his rig, 589,192 on my
  run-1 fixture), and `klatch.db` by itself already reads the post-run state. The checkpoint moved the
  run into the main file, which is the whole mechanism.
- H1 is unchanged: 1500 messages, `-wal` 4,132,392 bytes, `database disk image is malformed`, 101
  integrity lines from `Tree 4 page 1442`.

## 20:0x — Round 192's product diff, read before building

- `restoreInstructions(dbPath, backupPath)` in `entity-backfill.ts`, four numbered steps, `shellQuote()`
  single-quoting both paths. `dbPath = path.resolve(dbArg)` (`backfill-entity-bindings.mts:217`), so the
  printed steps are absolute and don't depend on cwd.
- `restoreSteps()` called at the apply's backup line, the undo's, and the undo catch. Not at the
  `(a restored backup?)` site. I read the classifier after his memo and **agree** with the exclusion.
- `checkpointAfterWrite()` on the apply path, the undo path (unconditional, including the
  nothing-written branch), and the `--channels` refusal — never in the error path, where the file may be
  the malformed one.
- The `-wal` note is computed from `fs.statSync` **before** the script opens anything, and is a warning,
  not a refusal.

**The gap that reading opened.** Round 191 chose 1500 messages to cross SQLite's 1000-page
autocheckpoint, because pre-192 that was the only way to get frames into the WAL *on top of* a main file
that already held the run. Post-192 the checkpoint puts the run in the main file at the apply's exit — so
that condition is now reached by **any** write at all, and "any" was never measured. That is the round.

## 20:1x — Round 193 instrument, with predictions written before it ran

`scripts/probe-round193-the-printed-steps-run-as-written-and-how-little-use-reopens-h.mts`. Arms:
- **Q:** the four printed steps pasted into `/bin/sh -c` **verbatim**, on a fixture built under
  `.testdata/r193/q it's here/` — a space *and* an apostrophe, the case `shellQuote()` exists for.
- **B1 / B20:** the app writes 1, then 20, messages after the apply; Ctrl-C; the naive `cp`.
- **W:** the `-wal` note fires with the right byte count (W1) and a negative control where it must stay
  silent (W2).
- **N:** what step 4's own dry run leaves behind. Measured only.
- **Z:** no product file touched.

Predictions recorded in the probe header before run 1: Q passes; **B1 already fails**, with the failure
mode left unpredicted (1554 messages' frames produced malformed, but one message's may land on pages the
backup also has and lie silently instead); W1 prints, W2 doesn't; N leaves a WAL. `tsc --noEmit --strict
--module nodenext`: clean.

## 20:2x — R193 run 1: 14 checks · 0 failed · 2 open · 4 measurements

Every prediction held, and **B came out stronger than I predicted** — malformed, not merely wrong.

- **B11 OPEN. One message is enough.** `-wal` 0 after the apply; one `insertMessage` takes it to
  **32,992 bytes**; Ctrl-C leaves it; after `cp` the database is `database disk image is malformed`.
  `klatch.db` by itself is the backup, intact — the 32,992 bytes beside it are what break it.
- **B201 OPEN**, twenty messages, `-wal` **346,112 bytes**, same result.
- **B12 / B202 PASS:** from both states the printed steps recover the backup row for row, backup file
  untouched.
- **Q0–Q4 PASS.** Steps 2 and 3 through a real shell exit 0 with no output; the quoting survives the
  apostrophe at the endpoint, not only in Daedalus's unit test. Step 4's own test is usable:
  `Candidates: 8 — 4 would move, 4 skipped.` before the apply and after the steps.
- **W1/W2 PASS.** The note's byte count matches what the probe measured independently; on a freshly
  checkpointed solo fixture it does not print.
- **N (measured):** step 4 leaves `{db: 94208, wal: 0, shm: 32768}` — a *zero-length* WAL, the harmless
  kind, which is Daedalus's own Round 192 measurement about read-only opens. Recorded so nobody reads the
  sidecars' reappearance as a failure.

**A dry-run signal worth naming:** on both B files the dry run exits **1** with no `Candidates:` line.
So step 4 catches the failure. That was not driven in Round 191 (D ran on K's file, not H's).

## 20:3x — R193 run 2: 14 · 0 · 2 · 4, every state matching

The `-wal` figures are **identical**, not merely similar: 32,992 after one message and 346,112 after
twenty, both runs. Row hashes differ between runs because the fixture's ids are freshly generated; the
states they name do not.

## 20:3x — a claim I narrowed on re-read before committing

The draft writeup said Round 192 "removed the silent-wrong branch." Pre-192, K1 was dangerous precisely
because it was silent; post-192 every case I drove either works or fails loudly. But that is four arms,
not a proof — a frame set that happened to be self-consistent with the backup would lie silently and I
have not driven one. The writeup and the memo both say so explicitly (§4 / "The part that is better").

## 20:4x — writeup, memo, board

- **Writeup** `docs/research/round193-one-message-is-enough-and-the-printed-steps-run-as-written-2026-09-11.md`.
- **Memo** `docs/mail/theseus-to-daedalus-cc-xian-argus-calliope-192-reproduces-and-the-steps-run-as-written-but-h-is-one-message-wide-not-1500-2026-09-11.md`.
  Two items offered, **neither asked for**: step 4 could print the expected `Candidates:` line so the
  operator matches a string instead of a memory; and shape 3 (`--restore=`) reads better after this round
  because its case is no longer "1500 messages" but "anything written since the apply". Both Daedalus's
  or xian's to call.
- **Thread closed** with `git mv` to `docs/mail/read/`: Daedalus's Round 192 reply and my Round 191 memo.
  Left in `docs/mail/`: Daedalus's 9/9 apply-pass memo (xian's dry run), still open.
- **COORDINATION:** my status is now Round 193, with Round 191 kept below as a dated entry.
- Mail committed and pushed to `main` on its own first, per the worktree discipline: `9184b16c`.

## Wrap verification (STOP fire)

Step 1 — commits on `origin/main`:

```
(filled in below, after the push)
```

Step 2 — deliverable files, each `ls`'d:

```
(filled in below)
```

Step 3 — this log is committed last.

## Carried, unchanged

**Round 170's frequency probe** still needs one path to the real `klatch.db` from xian.

## What xian needs from this fire

One line, and it sharpens the third line from the WORK fire rather than adding a fourth: **one message of
app use after an `--apply` is enough to make a hand `cp` of the backup leave a database the app cannot
open.** So steps 1–3 as the CLI prints them are the procedure *always*, not a precaution for long
sessions. The backup file survives every case measured, and the tool's own printed steps recover it.
Nothing here touches the dry run, which is still the one item on your seat.
