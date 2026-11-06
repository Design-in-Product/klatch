# unit-465rowdelta — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-06 WORK · **Pre-registration:** `8f950dc8`, pushed to `main`
as the only file in this directory before any instrument or cure in it existed (`git ls-tree -r
origin/main -- docs/research/unit-465rowdelta-2026-11-06/` run, one path returned).

**8 registered arms: 8 HIT, 0 MISS, 0 VOID. 6 predictions: 5 HELD, 1 REFUTED — the refuted one is
mine, and curing it is the second half of this unit. 2 registered cripples, both behaved as
registered. 2 unregistered arms and 1 unregistered cripple, added after the refutation. 6
unregistered defects, all mine, all caught by this unit's own instruments or by the repo's gates
before anything was published.**

Gate on the final tree: **`GATE ok exit=0` on all four stages** — `server · files: 142 passed
(142) · tests: 2207 passed | 1 skipped (2208)`, `client · tests: 333 passed | 13 skipped (346)`,
census and typecheck clean. The server file count **141 → 142** is this unit's new test file;
Calliope's 11/06 MID memo recorded the 140 → 141 move at an identical commit, and this is the next
one, with a cause.

Cures: `4d04227b` (rows) and `7b97bbb8` (sidecars). Recordings: `drive1`–`drive12` in this
directory, `.err` sizes reported below.

---

## 1. The routed defect reproduces exactly, under my own hand

Theseus's §4, re-seeded here rather than copied from his scratch: a database built by the real
`applySchema` on an empty file, given one channel with no `channel_entities` row and one
`type='file'` artifact whose `file_storage_key` is not in `files`.

**PRE (`3d759879`), `--apply --no-migrate`** — `drive2.precure-A1toA5.out`:

| | |
|---|---|
| exit | **0**, no refusal |
| before | `channel_entities 1, unbound 1, files 0, file_refs 0` |
| after | `channel_entities 2, unbound 0, files 1, file_refs 1` |
| the output's last line | **`Nothing to apply. Snapshot discarded.`** |

His three row writes, his exit code, his closing sentence. **P1COUNT HELD**: the per-table counts
the cure computes are `+1 channel_entities, +1 files, +1 file_refs`, his figures to the row.

## 2. The eight registered arms

All POST readings from `drive12.final-all.out`, driven on the committed cure.

| arm | PRE | POST | |
|-----|-----|------|--|
| **A1** seeded, `--apply --no-migrate` | exit 0, 3 rows written, `Nothing to apply.` | **exit 1**, rows unchanged, `Refusing to run: --no-migrate, and this run would write the rows above.` | HIT |
| **A2** seeded, `--apply` | 3 rows written, no row disclosure | same 3 writes, `ROWS:` block **before** them, and the closing line now carries *"Nothing from the plan, that is…"* | HIT |
| **A3** seeded, no flags | target unchanged, no disclosure | target unchanged, `ROWS:` block in would-voice | HIT |
| **A4** clean, `--apply --no-migrate` | exit 0 | **exit 0, no refusal, no `ROWS:` block, and no added sentence on `Nothing to apply.`** | HIT |
| **A5** alias-only, `--apply --no-migrate` | exit 0, `legacyModels 1 → 0` silently | **exit 1**, `legacyModels` unchanged | HIT |
| **A6** pristine March backup, `--apply --no-migrate` | refuses on the schema delta | refuses, reason composed: *"would upgrade the schema **and write the rows** above"* | HIT |
| **A7** seeded, `--undo=<record> --no-migrate` | exit 0, 3 rows written | **exit 1**, rows unchanged | HIT |
| **A8** seeded, `--apply`, twice | — | both report `+1 channel_entities, +1 file_refs, +1 files`; the minted `files` ids **differ**; neither id appears anywhere in either run's output | HIT |

A7 is the arm Theseus declined to assert — *"I did not drive `--undo`… I expect the same three
writes there and am not asserting it."* He was right, and it is now measured rather than expected.

## 3. Predictions

* **P1COUNT — HELD.** §1 above.
* **P2UPDATEBLIND — HELD, and this is the amendment his §5 sketch needed.** Cripple **X1** forces
  `rowWrites` to 0, leaving counts only, which is his sketch as literally written
  (`drive6.crippleX1.out`): **A5 goes green** — exit 0, `legacyModels 1 → 0`, the alias rewritten
  under a flag that promised not to — while **A1 still refuses** and **A4 stays green**. One cell,
  exactly the one predicted, and nothing else moves.
* **P3REBUILD — HELD, to the row.** On the pristine March backup the measurement is **2652 row
  writes** with **no table changing its row count**: `messages`' row count from `unit-465migrate`,
  reproduced here as a write count. Reported as "rows added" that figure would be wrong by three
  orders of magnitude, which is why the block prints both numbers and names the difference.
* **P4NOREFUSE — HELD.** A4: no refusal, no `ROWS:` block, no extra sentence. The cure refuses
  only runs with something pending.
* **P5DRYINTACT — HELD, both halves.** A3 (seeded) and **A10** (pristine March backup, no flags):
  target byte-identical, 5,230,592 bytes before and after, and the March dry run prints **both**
  blocks while writing nothing.
* **P6SNAPSHOT — REFUTED.** I predicted the refusal path leaves no `-wal`/`-shm` beside the target.
  It left both: `beside target: precure-A1.db-shm precure-A1.db-wal`. See §5.

## 4. Cripples

| | what was disabled | result |
|---|---|---|
| **X1** | `rowWrites` forced to 0 in `schemaDelta` | A5 green, A1 red, A4 green — `drive6` |
| **X2** | the `dataNote` conjunct removed from the `--no-migrate` gate, disclosure left in | **A1, A5 and A7 all green, while the `ROWS:` block still prints** — `drive7` |
| **X3** | the sidecar cleanup (unregistered, added with the cure in §5) | the new probe reddens on exactly its two one-sided arms, C and D stay green — `drive11` |

**X2 is the one worth reading.** It says which half of the cure closes the routed defect: with the
disclosure intact and the gate blind, an operator gets a correct, specific, true `ROWS:` block
printed directly above a run that writes the rows anyway, at exit 0. Disclosure is not the cure;
the conjunct in the gate is. A reviewer checking only the output would have scored X2 as fixed.

## 5. The refuted prediction, and the cure for it

`--no-migrate`'s refusal path ends with *"Nothing was written and the snapshot was discarded."* It
left two files beside the target. The cause is not a write to the database: opening a **WAL-mode**
database **read-only** makes SQLite create `-shm`, and a `-wal` if one is absent, because that is
how a reader reaches the WAL at all. My own `unit-465migrate` §7.1 found this on the dry-run path
and Theseus reproduced it; this unit found the refusal path doing it too, which is worse, because
that path's last word is that nothing happened.

Cured at the one place that creates them — right after the read-only snapshot handle closes — under
two guards: the sidecar was **absent before** this script opened the file, and the `-wal` is
**zero-length**. A pre-existing `-wal` can hold committed frames, and deleting one is precisely the
corruption `restoreSteps()` spends four steps warning about.

Measured, **A9**, `drive12`:

| path | beside the target after |
|---|---|
| `--apply --no-migrate`, refused | **(nothing)** |
| no flags, dry run | **(nothing)** |
| `--apply --no-migrate` over a clean database (passes the gate, then writes) | `-shm -wal` |
| `--apply`, writes | `-shm -wal` |

The last two rows are the half that keeps this a tidy-up rather than an `rm` dressed as one:
`getDb()` opens the target for writing **after** this cleanup runs, and those sidecars are live.

**The control:** `scripts/probe-backfill-sidecar-neutrality.mts`, 9/9 green, four arms — refusal,
dry run, a writing run whose sidecars must survive (C), and a pre-existing sidecar that must be left
alone (D). Driven crippled as X3: exactly A and B redden. Classified **DEFERRED** in
`sweep-probes.mjs`, with the hand drive named and the promotion explicitly not claimed.

## 6. Six unregistered defects, all mine

Each was caught by this unit's own instruments or by the repo's gates, and each is recorded here
rather than quietly fixed.

1. **My "target intact" key was blind to the write it existed to catch.** It was `sha256` of the
   main database file. A1's very first drive wrote three rows, and the sha did **not** move — the
   writes were in `-wal`, uncheckpointed. A sha-only verdict read a three-row write as an untouched
   target. Re-keyed on the row counts and ids read through a handle that sees the WAL, with the
   byte claim kept and reported separately so the two cannot be confused.
2. **My `ROWS:` block detector matched the tool's own prose.** The key was
   `/^ROWS:|^  .*row|^    [+-]\d/`, and the tool has printed `message rows re-stamped:` for many
   rounds — so the **pre-cure** tree reported `ROWS block lines: 1` on a tree with no `ROWS:` block
   in it at all. Re-anchored on the block's own first token.
3. **My probe manufactured the state the sidecar arm measures.** `probe()` opens the target
   read-only, which *creates* `-wal` and `-shm` — so by the time the tool ran, the sidecars were
   already there, the cure's "absent before" guard correctly declined, and the first sidecar drive
   (`drive8`) read the cure as having done nothing. The cure was right and the instrument was
   contaminating its own input. `probe()` now undoes what it creates, and `drive9` shows the effect.
4. **A7 voided for want of an input, not for anything about the subject.** The seed wrote
   `I am <name>`, which matches none of `entity-guess.ts`'s four identity patterns, and appended it
   *behind* the channel's opening turn besides. Re-seeded off the live pattern list: the arm drives.
5. **The cripple's restore-from-`HEAD` wiped an uncommitted cure.** X3 was driven while the sidecar
   cure was still only in the working tree; the cripple applied, the probe reddened correctly, and
   the restore then put the file back to a `HEAD` that did not contain the cure. Detected by
   `grep -c sidecarsBefore` → `0`, re-applied, committed, and X3 re-driven on the committed tree
   (`drive11`) so the recording comes from a tree where restore-from-`HEAD` is sound.
6. **My commit message asserted a default the census does not have.** It said an unclassified probe
   "lands in DEFERRED automatically." The census is a **partition**, not an allowlist with a
   fall-through, and the pre-commit hook went red naming the file. Classified explicitly, and the
   claim corrected in the message that shipped.

## 7. What is not cured, named rather than left implied

* **`total_changes()` cannot say *which* site wrote.** It is a total. The block names the two ways
  to get a rewrite (a rebuild, and the in-place alias update) without claiming which applies to the
  run in hand. On the March backup, where both are possible and only the rebuild fires, the
  sentence is true and underdetermined.
* **A deletion and an insertion of equal size cancel in `rows` but not in `rowWrites`.** No current
  site deletes, so there is no instance to drive; the key that would catch it is the one already
  used.
* **`--undo`'s own writes are gated, not disclosed per-site.** A7 shows the gate covers it. The
  `ROWS:` block describes the migration, which is the same on that path; the undo's channel-level
  writes have their own disclosure elsewhere in the script and were not touched here.
* **The probe is DEFERRED, not SWEPT.** It runs when driven, not every fire. Promotion needs
  `promote-probes.mts`, which is this list's own standard for what "was run" means.

## 8. Recordings

| file | what |
|---|---|
| `drive1.precure.out` | A1 only, the first drive — the one that caught defect 1 |
| `drive2.precure-A1toA5.out` | PRE, A1–A5 |
| `drive3.precure-all.out` | PRE, all arms; A7 VOID here (defect 4) |
| `drive4.precure-A7.out` | PRE, A7 re-seeded and driven |
| `drive5.postcure-all.out` | POST, rows cure only |
| `drive6.crippleX1.out` | X1 |
| `drive7.crippleX2.out` | X2 |
| `drive8.sidecar-cure.out` | the contaminated sidecar drive (defect 3) |
| `drive9.sidecar-cure-neutral.out` | the same arms, neutral probe |
| `drive10.crippleX3.out` | X3 on an uncommitted subject (defect 5) |
| `drive11.crippleX3-committed.out` | X3 re-driven, committed subject |
| `drive12.final-all.out` | POST, final tree, all ten arms |

Every `.err` is **0 bytes**, counted off `wc -c` rather than off a list typed from memory.

— Daedalus
