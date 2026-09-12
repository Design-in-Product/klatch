# Round 195 — step 4's own command, and `--undo`, on the database a bad restore already corrupted

**Author:** Theseus · **Date:** 2026-09-12 (START fire)
**Input:** Daedalus's Round 194 —
`docs/research/round194-step-4-checks-itself-and-the-corruption-arm-is-one-write-wide-2026-09-12.md`
**Probe:** `scripts/probe-round195-the-check-step-and-the-undo-path-on-a-database-a-bad-restore-corrupted.mts`
**Result:** 14 checks · 0 failed · **3 open** · 3 measurements (two runs, same states)

---

## Reproduced first, before touching anything (`10117853`)

- **Daedalus's Round 194 probe, unmodified: 14 · 0 failed · 0 open.** His table exactly — the
  unflagged apply quotes its own line, `--channels` and `--bases` quote the *no-flag* line, and the
  undo quotes the post-apply line. S2 confirms the indentation does its job: **exactly one column-0
  `Candidates:`** in an apply's output.
- **My Round 193 probe, unmodified, on this HEAD: 14 · 0 failed · 2 open · 4 measurements** — the
  same numbers as when I wrote it, with Z now passing (it failed on his uncommitted tree by design).
  Q4 still passes with the new step 4 in place. `-wal` at the copy: B11 **32,992**, B201 **346,112**,
  identical to both earlier runs.

Round 194 disturbs nothing Round 193 measured. His item-1 build is correct, and his adoption of my
H framing is in the code, the CLI header and the scoping doc.

## What this round drives

Round 194 made step 4 self-checking for the operator whose restore **worked**. The other branch —
the operator whose restore did **not** work — is the one `unflaggedCandidates()`'s own comment names:
*"a malformed database being exactly the arm where these steps matter most."* That fallback was
asserted in a comment and reached by no test and no probe. My own Round 193 stopped one step short
of it too: B1 measured that the dry run on such a file "exits 1 and prints no `Candidates:` line" —
not **what it prints instead**, and not what the other two commands do.

So this round drives the sequence the tool's own text walks an operator into:

1. `--apply` — exit 0, backup named, four steps printed, step 4 quoting `Candidates: 8 — 4 would
   move, 4 skipped.`
2. the app writes **one** message (Round 193's measured width).
3. a naive `cp` of the backup — the steps **with step 2 skipped**. Round 191's H:
   `database disk image is malformed`. (M1, reproduced.)
4. from there, each of the three things the tool tells you to do next.

All three answer badly, and they answer badly in the same direction: the tool stops speaking in its
own voice exactly when the operator most needs it to.

## M2 (open) — step 4's own command answers with a Node stack trace

`npx tsx scripts/backfill-entity-bindings.mts <db>` — the no-flag re-run step 4 asks for — on the
malformed database prints **nothing of its own**. No `Candidates:` line, no `Dry run` paragraph, no
sentence at all. The whole output is:

```
/Users/…/packages/server/src/db/index.ts:114
    db.prepare('UPDATE messages SET model = ? WHERE model = ?').run(newId, oldId);
                                                                ^
SqliteError: database disk image is malformed
    at runMigrations (…/db/index.ts:114:65)
    at getDb (…/db/index.ts:36:5)
    at planEntityBackfill (…/db/entity-backfill.ts:288:14)
    at <anonymous> (…/scripts/backfill-entity-bindings.mts:625:14) { code: 'SQLITE_CORRUPT' }
```

Exit 1. The CLI header's own rule is *"Every refusal speaks in this script's voice and disposes of
its snapshot. A missing or malformed `--undo` record is a sentence, not a Node stack"* — a rule
written in answer to my Round 179. The one input that rule does not cover is the database itself.

**Why it matters more here than anywhere else:** the operator running this command is running it
*because* step 4 told them to, to find out whether their restore worked. The answer they need is
"this database is malformed — you probably skipped step 2; here is how to redo the restore." The
answer they get is a stack trace inside `runMigrations`, which reads like the tool is broken rather
than like the database is.

**Measured alongside:** a dry run that completes disposes of its temp snapshot (delta 0); the
crashing one leaves it behind (delta 1, plus its two sidecars). That orphan is in `os.tmpdir()` — out
of the operator's sight, which is the mild version of M3.

## M3 (open) — a second `--apply` crashes the same way and leaves its snapshot beside the database

Same uncaught throw, same exit 1 — and the `.backup-backfill-*` files beside the database go
**1 → 2**. The snapshot is taken (CLI `:344`) before the plan (`:625`), and the throw is uncaught, so
no `discardSnapshot()` runs. This is the same header rule, broken in its second half.

The new file is itself malformed — a byte-for-byte copy of the corruption, with a timestamp newer
than the good backup's, sitting immediately beside it.

## M4 (open) — `--undo` names its own fresh snapshot as "intact", and that file is malformed

This is the one I would fix first. `--undo` is not an edge case here: the CLI header calls the record
and the snapshot *"two independent ways back"*, and reaching for `--undo` after a failed restore is
the documented move.

On the malformed database, `--undo`:

- takes its snapshot from a **read-only** handle and does not notice the corruption — SQLite's backup
  API copies pages, it does not validate them;
- prints `Backup (taken before anything was written): <the corrupt copy>` with the four restore steps
  under it;
- throws inside `undoEntityBackfill`, lands in its catch, and prints
  **`The backup from before this run is intact at:`** followed by that same corrupt file — and the
  four steps again, whose step 3 is `cp <corrupt file> <database>`.

So the tool's last word to an operator in trouble is a restore instruction pointing at a copy of the
thing they are trying to recover from, with the word **intact** attached to it.

**The way back did exist** (M6): the apply's own backup is still beside the database and still
readable — `integrity ok`, 10 channels, 2 entities. M7 confirms the full four steps against *that*
file recover the database byte-for-byte (`cmp` identical) and step 4's quoted line then matches. The
failure is not that recovery is impossible; it is that after this sequence **three**
`.backup-backfill-*` files sit beside the database, differing only in timestamp, and the tool has
pointed at the newest — the only unreadable one.

`--undo`'s catch also keeps its snapshot deliberately (the comment explains why: a part-way undo
means the snapshot may be the only pre-undo state). That reasoning is sound on a healthy database and
is what produces the third file here.

## What holds

- **M5 — Daedalus's "never fatal" claim is true where it is reachable.** On the undo path the plan
  throws, `unflaggedCandidates()` catches, and step 4 prints the **prose** fallback rather than a
  guessed line. Driven, not read.
- **C (control) — on a healthy database "intact" is true.** The undo's snapshot reads `integrity ok`,
  and step 4 carries the quoted line. So M4 discriminates: it is not "the undo always lies", it is
  "the undo cannot tell".
- **M7 — the printed steps, done in full, still work from the corrupt state.** Byte-identical to the
  backup, `integrity ok`, and the no-flag dry run then prints exactly the quoted line. Round 194's
  whole mechanism does its job on the arm it was built for.
- **N1** — run with literally no arguments (the most literal reading of *"re-run this script with no
  flags"*), the script refuses with its usage line, exit 1. No stack.

## N (measured) — step 4 is the only step you cannot paste

Steps 2 and 3 are literal shell commands. Steps 1 and 4 are prose. Step 4 is the one the operator has
to *compose*, and the natural way to compose it is to scroll up and reuse the command they just ran.

**N2, driven:** after a **correct** restore of a `--channels` apply, re-running with the flags they
used prints
`Candidates: 1 of 8 in scope matched your --channels filter — 1 would move, 0 skipped.`,
while step 4 quotes `Candidates: 8 — 4 would move, 4 skipped.` A correct restore, reported as a
failure — which is precisely the outcome Round 194 was built to prevent, arrived at from the
operator's side instead of the tool's.

The tool already prints a pasteable command in this exact situation: the apply's
`reverse with:  npx tsx scripts/backfill-entity-bindings.mts <db> --undo=<record>`. Step 4 has every
argument it needs to do the same.

## Shapes, offered not built — Daedalus's call

1. **Wrap the plan in the CLI's voice.** One `try` around `planEntityBackfill` (`:625`), and on
   `SQLITE_CORRUPT` say so as a sentence, name the sidecars, name the `.backup-backfill-*` files
   actually beside the database, and `discardSnapshot()`. Closes M2 and M3 together. The same
   catch is the natural place to distinguish "you skipped step 2" from "your disk is failing".
2. **Do not call a snapshot intact without checking it.** `PRAGMA quick_check` on the read-only
   source before the backup line is printed — on the undo path at minimum, where the word *intact*
   appears. If it fails: keep the snapshot (it is still evidence), but say what it is, and point at
   the older `.backup-backfill-*` file instead. Cost is O(database) and only on the undo path; worth
   measuring before adopting.
3. **Step 4 prints its command.** `re-run: npx tsx scripts/backfill-entity-bindings.mts '<db>'` on
   its own line, the way `reverse with:` already does. Removes N2's whole class.
4. **Shape 3 (`--restore=<backup>`) reads stronger again after M2–M4** — it would do step 1's stop,
   step 2's deletes and step 3's copy itself, and could verify the result before saying it worked.
   Still Daedalus's stated ordering objection (a new flag before the tool's first real dry run), and
   still xian's call. Named here so it is not lost, not argued for again.

## Not claimed

- **No real corpus.** Every arm is Round 176's fixture under `.testdata/r195/`. `klatch.db` was never
  opened. The dry run against xian's real database is still the one open item on this seat.
- **The corruption is produced one way only** — one message from a writer that exits without closing,
  then `cp`. That is Round 191/193's H route. Other corruptions (a truncated file, a failing disk)
  may take different paths through `getDb()` and are not driven.
- **Whether `PRAGMA quick_check` catches this particular corruption is not measured.** Shape 2 is a
  proposal, not a verified fix. The read-only open *succeeded* here and a page-level check is the
  obvious candidate, but I did not drive it.
- **M3's orphan count is 1 → 2 for one crashed apply.** I did not drive repeated runs to see it grow,
  and did not measure the file size cost on a large database.

## A correction to my own probe, recorded because it is this round's shape

The first cut of the probe reported **M7 as a FAIL**: after a correct restore, my reader returned
`disk I/O error` while the CLI, in its own process, read the same file fine and printed the right
`Candidates:` line. The file was byte-identical to the backup (`cmp`).

The cause was mine. `holds()` closed its handle on the success path only, and on this round's arms
most reads throw by design — so every failed read leaked an open connection to a file the probe then
deleted the sidecars of and copied over. Later opens **in the same process** failed. Fixed with
`try/finally`, and M7's claim is now also checked by `cmp`, outside SQLite entirely.

Worth writing down rather than quietly fixing: a probe reporting a correct restore as a failure, in a
round whose subject is instructions that report a correct restore as a failure. Daedalus flagged the
same class from his side this round (his R194 probe crashed on its own fixture choice). Both of us
grep these logs later.
