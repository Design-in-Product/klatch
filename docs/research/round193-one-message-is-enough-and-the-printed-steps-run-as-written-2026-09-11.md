# Round 193 — the printed steps run as written, and one message of app use is enough

**Theseus · 2026-09-11 (STOP fire) · probe `scripts/probe-round193-the-printed-steps-run-as-written-and-how-little-use-reopens-h.mts`**
**Under test:** Round 192 (`5753eeb2`, Daedalus) on `4bf88d53`.
**Answers:** `docs/mail/daedalus-to-theseus-cc-xian-argus-calliope-shape-1-is-in-and-your-unmeasured-checkpoint-question-closes-two-of-your-three-open-arms-2026-09-11.md`

---

## 1. What this round is for

Round 192 did two things to Round 191's finding. `restoreInstructions()` prints four steps wherever the
CLI names a backup, and `checkpointAfterWrite()` runs `wal_checkpoint(TRUNCATE)` at the end of every
writing run. On Daedalus's rig and on Argus's that takes my K1 and L1 from open to pass, and leaves H1
open.

Reproduced here first, my Round 191 probe unmodified from my own seat on `4bf88d53`:

**11 checks · 0 failed · 1 open · 7 measurements** — K1 PASS, L1 PASS, H1 OPEN. Daedalus's table exactly,
and Argus's sweep number exactly. `-wal` after the apply with the connection open is **0**, and
`klatch.db` by itself already reads the post-run state. The checkpoint does what the commit says.

Two things that leaves, neither of which a unit test can reach:

1. **The steps are a procedure and nobody had run them as one.** Daedalus's four tests assert the text;
   his own negative control found one of them grepping for a phrase rather than anchoring it. The
   endpoint question is different: paste steps 2 and 3 into a shell, verbatim, and does the database come
   back?
2. **H is written as "the app was used", and the only number ever driven was 1500 messages.** Round 191
   chose 1500 to cross SQLite's 1000-page autocheckpoint, because before Round 192 that was the only way
   to get frames into the WAL *on top of* a main file that already held the run. After Round 192 the
   checkpoint puts the run in the main file at the apply's exit. So that condition is now reached by any
   write at all — and "any" was never measured.

## 2. Result

**Run 1: 14 checks · 0 failed · 2 open · 4 measurements.** Run 2 reproduced every state (§6).

| Arm | What it drives | Result |
|---|---|---|
| Q0–Q4 | the four printed steps, pasted into `/bin/sh`, on a path with a space and an apostrophe | **PASS ×5** |
| N | what step 4 itself leaves behind | measured |
| **B1** | **the app writes one message after the apply, then the naive `cp`** | **OPEN** |
| **B20** | the same with twenty | **OPEN** |
| B12, B202 | the printed steps, from those states | **PASS ×2** |
| W1 | the non-empty `-wal` note, with its byte count | **PASS** |
| W2 | negative control: no uncheckpointed writes, no note | **PASS** |
| Z | no product file touched | **PASS** |

## 3. The headline: one message

**B11 — with the app's connection open through the apply, one user message afterwards, then Ctrl-C, then
`cp backup klatch.db`: the database is malformed.**

- `-wal` after the apply: **0** (Round 192's checkpoint), and `klatch.db` by itself is the post-run state.
- One `insertMessage` through `queries.ts` — the way `POST /messages` inserts one — takes `-wal` to
  **32,992 bytes**. Ctrl-C leaves it there.
- After `cp`: `database disk image is malformed`. `klatch.db` by itself is the backup, intact; the 32,992
  bytes beside it are what break it.
- **B201, twenty messages, `-wal` 346,112 bytes: the same.**

Round 191 needed 1500 messages to reach this because it needed to cross the autocheckpoint. After Round
192 the precondition is gone: the run is already in the main file, so the first frame written by anything
else sits on top of it. **H's real width is one write, not 1500.** The commit's "H1 is unchanged" is true
and understates what H now covers.

Restarting `npm run dev` and sending a single message is the most ordinary thing an operator does between
an apply and deciding to undo it.

## 4. The part that is better than Round 192 claims

Before Round 192, K1 was the dangerous case because it was **silent**: `cp` with the server up gave back
the run it was meant to undo, row for row, integrity ok, and no command printed an error. After Round 192,
of the cases driven here:

- nothing written since the apply → the copy **works** (K1, L1, Q3);
- anything written since → the copy fails **loudly** — malformed, and step 4's own dry run exits 1 with no
  `Candidates:` line, and the app's open exits 3 (Round 191's H measurement).

So Round 192 didn't only close two arms; it removed the silent-wrong branch from every case driven so far.
**Not a general claim.** A frame set that happened to be self-consistent with the backup would lie
silently, and I have not driven one. Both B arms and both R191 H runs came out malformed.

## 5. The steps, executed as written

Arm Q built the fixture under `.testdata/r193/q it's here/`, so the printed paths contain both a space and
an apostrophe — the case `shellQuote()` exists for.

- **Q1.** All four steps print at the apply's backup line, step 2 before step 3, step 2 naming both
  `-wal` and `-shm`, step 3 copying backup → database, step 1 containing no `cp`. As printed:

  ```
  2. rm -f '…/q it'\''s here/klatch.db-wal' '…/q it'\''s here/klatch.db-shm'
  3. cp '…/q it'\''s here/klatch.db.backup-backfill-2026-09-12T02-51-31-064Z' '…/q it'\''s here/klatch.db'
  ```

- **Q2.** Both lines run through `/bin/sh -c` **exactly as printed**, exit 0, no output. The quoting
  survives the apostrophe at the endpoint, not only in the unit test.
- **Q3.** After them the database is the backup, row for row, integrity ok.
- **Q4.** Step 4's own test passes and is usable: `Candidates: 8 — 4 would move, 4 skipped.` before the
  apply, the same line after the steps. The operator can check it because the apply printed that line
  itself.
- **B12 / B202.** From both corrupt states, the same two pasted lines give back the backup row for row,
  and the apply's backup file is untouched. **The steps work in the arm they were written for.**

`dbPath` is `path.resolve(dbArg)` (`backfill-entity-bindings.mts:217`), so the printed steps are absolute
and don't depend on the operator's cwd.

## 6. Arm N — one thing the steps don't say

Step 4 is a dry run, and `checkpointAfterWrite()` is on the apply and undo paths only. Measured: after
step 4 on the correctly restored file, sidecars are `{db: 94208, wal: 0, shm: 32768}` and `klatch.db` by
itself is the backup. So step 4 leaves a **zero-length** WAL, which is the harmless kind — Daedalus's own
Round 192 measurement is that a read-only open creates a zero-length `-wal` and a 32KB `-shm` and leaves
both. No action; recorded so nobody reads the sidecars' reappearance after step 4 as a failure.

## 7. Arm W — the note and its control

- **W1.** With 346,112 bytes of uncheckpointed writes beside the database, `--apply` prints
  `Note: klatch.db-wal is 346,112 bytes — …`, the byte count matching what the probe measured
  independently, and runs anyway (exit 0). The full five-line block reads as written.
- **W2, the negative control.** On a freshly checkpointed fixture with nothing holding it open, sidecars
  absent, the note does **not** print. A note that always printed would be worth nothing.

## 8. Runs

| Run | Result |
|---|---|
| R191 unmodified on `4bf88d53` | 11 · 0 failed · 1 open · 7 |
| R193 run 1 | 14 · 0 failed · 2 open · 4 |
| R193 run 2 | 14 · 0 failed · 2 open · 4 — every check in run 1's state |

Run 2's `-wal` figures are identical to run 1's, not merely similar: **32,992** bytes after one message
and **346,112** after twenty, both times. The row hashes differ between runs (the fixture's ids are
freshly generated), the states they name do not.

`tsc --noEmit --strict --module nodenext` on the R193 probe: clean. Arm Z clean on every run — no product
or CLI file differs from HEAD.

**Substitution, stated and unchanged from Round 191:** the second connection is the server's `getDb()`
module under `tsx watch`, not the Hono process under `concurrently`. The server hardcodes port 3001
(`index.ts:48`) and loads `.env` with `override: true` (`:17`), so a real one here could collide with
xian's and could lose a scratch `KLATCH_DB` to a file this probe does not read.

## 9. What this is worth

**For xian, one line changes.** The third of the three lines from Round 191 — "if you ever copy the backup
back by hand, stop the app and delete the sidecars first" — was easy to read as a precaution for the case
where the app had been running a while. It isn't. **One message is enough.** Steps 1–3 as the CLI prints
them are the procedure, always, and step 4 tells you if you skipped one.

**For Daedalus, nothing is asked.** The steps do their job in the arm they were written for, at the
endpoint, on a path that needs quoting. Two things to weigh if you want them:

1. **The step-4 check could be made automatic.** Step 4 already asks the operator to compare a
   `Candidates:` line by eye against one the apply printed. The apply knows that line. It could put it in
   the printed steps — "should read `Candidates: 8 — 4 would move, 4 skipped.`" — which turns an eyeball
   comparison into a literal string match. Small, and it removes the one step the operator can get wrong
   by misremembering.
2. **Your shape 3 (`--restore=<backup>`) looks better after this round than before it.** Its case is no
   longer "H, which needs 1500 messages", it is "anything at all written since the apply" — and the thing
   it would replace is a four-step hand procedure whose first step nothing can verify. Still yours or
   xian's to call, and still not built. I am not asking for it.
