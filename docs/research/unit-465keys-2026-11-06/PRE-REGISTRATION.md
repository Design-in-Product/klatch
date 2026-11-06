# unit-465keys — what the migration delta's five keys cannot see

**Seat:** Theseus (manual testing & exploration)
**Opened:** 2026-11-06 ~14:5x PT (WORK fire)
**Subject:** `packages/server/src/db/schema-delta.ts` and the `--no-migrate` gate in
`scripts/backfill-entity-bindings.mts`, at the tree Daedalus left after `4d04227b` + `7b97bbb8`
(`unit-465rowdelta`, his 11/06 WORK fire).
**Routed by:** my own 11/06 §4/§5 (`unit-465rows`), which Daedalus cured, plus his memo
`daedalus-to-theseus-…-your-four-site-census-is-cured-…-2026-11-06.md`.

This file is pushed as the **only** file in this directory, before any instrument exists.

---

## 0. Why this unit, in one paragraph

Daedalus's cure replaces a hand-written list of writing sites with a **measurement**: copy the
snapshot, apply the real schema, diff the censuses, read `total_changes()`. His module header makes
the argument for why explicitly — *"A list is a sentence about the schema; this is a measurement of
it."* I accept that argument and attack the measurement at the only place it can still be a
sentence: **its keys**. Five keys carry the verdict — `addedObjects`, `addedColumns`,
`rebuiltTables`, `alteredTables` (via `SchemaDelta.empty`) and `rowWrites` (via `DataDelta.empty`).
Reading them, all five look **additive**: they ask what the migration *adds*. The defect I am
testing for is that a migration which **removes** something passes every one of them, prints
nothing, and is therefore let through by a gate whose whole promise is about the file.

I am also attacking his new prose census, and one cell of the sidecar cure he shipped in the same
fire.

## 1. Registered predictions

Registered before any instrument for them exists. Each says which way I expect it to go, so a
refutation is recorded as a refutation and not re-scoped.

| id | prediction | my call |
|---|---|---|
| **P1SHMONLY** | With `klatch.db-shm` present and `klatch.db-wal` **absent** before the run, a *refused* `--apply --no-migrate` leaves at least one sidecar beside the target that this script's own open created. The cleanup at `backfill-entity-bindings.mts:659` is a conjunction over both files (`!before['-wal'] && !before['-shm']`) where its own stated contract is per-file — *"only those this open created."* | HOLDS |
| **P2WALCREATE** | In that precondition the read-only open does create a **zero-length** `klatch.db-wal`. (If SQLite declines to, P1 fails for a reason that is not the guard's, and I want that separable.) | HOLDS |
| **P3DROPBLIND** | Under cripple **Y1** — a migration that `DROP`s a populated table and recreates it empty under the same name — `schemaDelta()` returns `SchemaDelta.empty === true` (all four schema keys empty) **and** `DataDelta.empty === true` (`rowWrites === 0`, because `DROP`/`CREATE` are DDL and `total_changes()` does not count them), while `rows` shows the loss. Both notes come back `undefined`, nothing prints, and `--apply --no-migrate` **exits 0**. | HOLDS |
| **P4DROPONLY** | Under cripple **Y2** — a pure `DROP TABLE` of a populated table, no recreate — the loss is invisible to **every** key including `rows`, because `diffRows` and `countRows` iterate `Object.keys(after)` and the table is not in `after`. | HOLDS |
| **P5INITSITES** | `applySchema`'s row-writing sites are **six, not four**: the published census in the `schema-delta.ts` header names four and says *"all in `runMigrations`"*, and `initSchema` holds two more (`INSERT OR IGNORE INTO channels … 'default'`, `INSERT OR IGNORE INTO entities … DEFAULT_ENTITY_ID`, `db/index.ts:85–91`). Against a database at the current schema with the `default` channel row deleted, `--apply --no-migrate` **refuses** and the `ROWS:` block names `+1 channels`. The measurement catches a site the prose does not name — which is the cure working as argued and the census still being short. | HOLDS |
| **P6TRUNCATE** | A bare `DELETE FROM t` **is** counted by `total_changes()` on this SQLite build, so the truncate optimization is **not** a second route into P3's hole. | HOLDS (i.e. no defect by this route) |
| **P7BACKUPWAL** | `source.backup(snapshotPath)` leaves no **non-zero** `-wal` beside the snapshot, so `schemaDelta`'s `fs.copyFileSync(dbPath, scratch)` of that snapshot is not reading a stale file. If this is refuted the whole gate is keyed on a copy that can be behind its own subject. | HOLDS (i.e. no defect by this route) |

## 2. Registered arms

| arm | precondition | what is read |
|---|---|---|
| **A1** | target at current schema, nothing pending, `--apply --no-migrate` | exit code — control, must stay 0 (Daedalus's A4) |
| **A2** | §4 seed (one unbound channel + one `type='file'` artifact not in `files`), `-shm` touched beside the target, no `-wal`, `--apply --no-migrate` | exit code, refusal text, **and the sidecars present after** |
| **A3** | same seed, **neither** sidecar present before, `--apply --no-migrate` | sidecars after — Daedalus's cured cell, re-run here as the matched baseline for A2 |
| **A4** | same seed, a **non-zero** `-wal` present before, `--apply --no-migrate` | sidecars after — must be left alone; the cure's other side |
| **A5** | cripple **Y1** (drop + recreate `message_artifacts`), target at current schema with one artifact row, `--apply --no-migrate` | `schemaDelta()` field-by-field, both notes, exit code, and the artifact row count after |
| **A6** | cripple **Y2** (pure drop), same target, `--apply --no-migrate` | same fields; specifically whether `rows` is silent |
| **A7** | target at current schema with `channels` row `'default'` deleted, `--apply --no-migrate` | exit code, refusal reason, `ROWS:` block contents |
| **A8** | standalone database, `DELETE FROM t` with no `WHERE`, over a populated table | `total_changes()` before/after |
| **A9** | a WAL-mode target with uncheckpointed committed frames; run `--apply --no-migrate`, then stat the snapshot's sidecars | `stat` of `<snapshot>-wal`, and whether `schemaDelta`'s subject could be behind |

A1 and A3 are controls, not findings. A2's value depends entirely on A3 coming back clean: a
sidecar left in both cells is a defect of the cure, not of the guard's conjunction.

## 3. Registered cripples

* **Y1** — `runMigrations` gains, at its end, `DROP TABLE message_artifacts` + a `CREATE TABLE`
  of the same name and columns. Perturbs the subject's **input** (the migration), not the subject
  (the delta module). That is deliberate: a key is graded by moving what it is supposed to see.
* **Y2** — the same, `DROP` only, no recreate.
* Both are restored from `git` after driving, and the restore is **verified by diff against a
  pre-action baseline captured before the cripple is applied**, not assumed from `git checkout`.

## 4. What I am not claiming

* No migration in the tree today drops a table or an index net. The `DROP TABLE messages` at
  `db/index.ts:206` is paired with a `RENAME` of the rebuild, so `messages` is in `after` and the
  rebuild is reported (as `rebuiltTables`, correctly). **If P3/P4 hold, they hold about the key, at
  the key's own granularity — reachable by the next migration of a shape SQLite's own ALTER TABLE
  documentation recommends (drop a deprecated table or index), not live today.** I will state them
  that way in RESULTS and not one notch stronger.
* P5 is a finding about **published prose**, not about the gate. If the measurement refuses as
  predicted, the cure is working exactly as Daedalus argued it would, and the census being short by
  two is a separate, smaller thing. I will not report it as a gate defect.
* I am not re-opening the flag's name, the `total_changes()`-cannot-say-which-site limit, or the
  probe's DEFERRED classification. All three are named in his RESULTS §7 and I agree with the
  framing.

## 5. Gate

`npm test -w packages/server` is re-run on the restored tree before RESULTS is filed, and its
figure reported against Daedalus's post-cure **142 files / 2207 passed / 1 skipped (2208)**.
