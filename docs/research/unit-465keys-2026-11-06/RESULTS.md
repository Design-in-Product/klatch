# unit-465keys — RESULTS

**Seat:** Theseus · **Driven:** 2026-11-06 ~14:5x PT (WORK fire) · **Subject rev:** `03113015`
(the tree Daedalus left after `4d04227b` + `7b97bbb8`, plus this unit's own pre-registration)

**10 arms driven — 9 registered, 1 declared post-hoc. 7 predictions: 5 HELD, 1 REFUTED, and the
refuted one is mine. 2 registered cripples, both as registered. 3 unregistered defects, all mine.**

Gate on the restored tree: `npm test -w packages/server` → **142 files · 2207 passed | 1 skipped
(2208)**, exit 0 — Daedalus's post-cure figure to the test. The cripples left nothing behind;
`git diff HEAD --stat -- packages/ scripts/` is empty and `grep -c U465KEYS_CRIPPLE
packages/server/src/db/index.ts` returns **0**, both run after the restore and both against the
pre-action baseline (`HEAD = 03113015`, product tree clean) captured *before* the cripple was
applied.

---

## 1. Verdict table

| id | prediction | verdict | the reading |
|---|---|---|---|
| **P1SHMONLY** | a `-shm`-only precondition leaves a sidecar this open created | **HELD** | A2: `-shm:32768B -wal:0B` after a *refused* run. A3, matched baseline, no sidecar before: **`(nothing)`** |
| **P2WALCREATE** | a read-only open creates a zero-length `-wal` when a `-shm` is already there | **HELD** | A2b: `-shm:32768B` → `-shm:32768B -wal:0B` across a bare open+`SELECT`+close |
| **P3DROPBLIND** | drop + recreate passes all four schema keys | **REFUTED** | A5: `rebuiltTables: ["message_artifacts"]`, `SchemaDelta.empty = false`, SCHEMA block printed, **exit 1**, row intact |
| **P4DROPONLY** | a pure drop is invisible to every key, `rows` included | **HELD** | A6: all five keys empty, both notes `undefined`, **exit 0**, `message_artifacts` **ABSENT** after |
| **P5INITSITES** | the published census is short by two sites, and the measurement catches one of them | **HELD** | A7: `rows: {channels: +1, channel_entities: +1}`, `rowWrites: 2`, ROWS block printed, exit 1 |
| **P6TRUNCATE** | a bare `DELETE FROM t` **is** counted, so no second route | **HELD** (no defect) | A8: `total_changes()` 17 → 34 over a 17-row `DELETE FROM t`; SQLite **3.53.2** |
| **P7BACKUPWAL** | `source.backup()` is not WAL-blind and leaves no `-wal` | **HELD** (no defect) | A9: live handle **3**, `fs.copyFileSync` of the `.db` **2**, `backup()` destination **3**, `(nothing)` beside the snapshot |

## 2. The live finding — A6: all five keys are blind to a removal

Cripple Y2 is one statement: `DROP TABLE IF EXISTS message_artifacts` at the end of
`runMigrations`. Input is the `artifact` seed — a database **at the current schema**, built by the
uncrippled `applySchema`, holding one `type='thinking'` artifact and nothing for the migration to
write.

`schemaDelta()` on that file, field by field, verbatim from `drive3.keys.out`:

```
{ "addedObjects": [], "addedColumns": [], "rebuiltTables": [], "alteredTables": [],
  "empty": true,
  "data": { "rows": {}, "rowWrites": 0, "empty": true } }
SchemaDelta.empty = true    DataDelta.empty = true
describeSchemaDelta -> undefined
describeDataDelta   -> undefined
```

`--apply --no-migrate` **exits 0**, prints `Nothing to apply. Snapshot discarded.`, and the table is
**gone**: `counts after: … message_artifacts=ABSENT`.

**Why `rows` is silent too, which is the part I would not have predicted from the prose.**
`countRows(db, c)` iterates `Object.keys(c.cols)` and `diffRows(before, after)` iterates
`Object.keys(after)`. A dropped table is not in `after`, so it is not counted and not differenced.
`total_changes()` does not see it either — `DROP TABLE` is DDL. The module's two numbers are
`rows` and `rowWrites`, and a removal is outside the domain of both.

**The matched baseline is what makes this exact.** `drive4.restored-baseline.out` is the same arm on
the restored tree:

| | `SchemaDelta.empty` | `DataDelta.empty` | both notes | exit | `message_artifacts` after |
|---|---|---|---|---|---|
| uncrippled (drive4) | `true` | `true` | `undefined` | **0** | **1** |
| Y2 (drive3) | `true` | `true` | `undefined` | **0** | **ABSENT** |

Every surface the tool prints is identical between a run that changes nothing and a run that
destroys a table. The exit code does not discriminate, the delta does not discriminate, and the
closing sentence is the same in both. The only thing that differs is the file.

**Scoped honestly:** **no migration in the tree today drops a table or an index net.** The
`DROP TABLE messages` at `db/index.ts:206` is paired with the rebuild's `RENAME`, so `messages` is
in `after` and that rebuild is reported — correctly, as `rebuiltTables`. This is a statement about
the five keys at the keys' own granularity, reachable by the next migration of a shape SQLite's own
ALTER TABLE documentation recommends. The sibling cell costs one more sentence: `addedObjects` is
`after.objects.filter(o => !before.objects.includes(o))`, so a dropped **index** is invisible as
well, and `rebuiltTables`/`alteredTables` iterate tables only. Klatch has created several indexes
(`idx_message_artifacts_message_id` among them); dropping one loses no row, which is why that cell
is the smaller one.

## 3. My own refutation — A5, and why `rebuiltTables` is not additive

I registered that drop **and recreate** would pass all four schema keys. It does not. On the
uncrippled seed the recreated `message_artifacts` has `file_name … file_storage_key` ahead of
`created_at`, where the real table has them appended *after* it by four `ALTER TABLE`s. So
`appendOnly` — `was.every((c, i) => cols[i] === c)` — is false, `rebuiltTables` fires,
`SchemaDelta.empty` is `false`, the SCHEMA block prints, and the gate **refuses at exit 1** with the
row intact.

I had read `addedObjects`'s filter, seen a pure additive set difference, and generalised "additive"
across all four schema keys. `rebuiltTables` and `alteredTables` are not set differences: they
iterate `after.cols` and compare each surviving table against `before`, so they fire on *any* change
of column order or of `CREATE TABLE` text — and a hand-written recreate essentially always has one.
**That is a real defence of Daedalus's, and it is the key that caught the case, not the one I aimed
at.** I read three keys and typed a claim about four.

What survives from that arm is narrower and worth recording: **the data half was still blind in the
cell the schema half caught.** `rows: {message_artifacts: -1}`, `rowWrites: 0`, `DataDelta.empty =
true`, `describeDataDelta -> undefined`. The refusal came entirely from `describeSchemaDelta`. So on
the one Y1 cell that refuses, the ROWS disclosure says nothing about a row that is about to be
destroyed — the operator is told the table will be *rebuilt* and that "every existing row survives
this," which in that cell is false.

`DataDelta.empty` is `rowWrites === 0`. The interface carries two measured quantities and keys the
guard on one of them. In A5 the module **measured the loss** (`rows: {message_artifacts: -1}`) and
then threw the measurement away at the guard.

## 4. A7 — the census is six, not four, and the measurement is why that is survivable

`schema-delta.ts`'s header names four row-writing sites and says **"all in `runMigrations`"**.
`applySchema` is `initSchema` then `runMigrations`, and `initSchema` holds two more
(`db/index.ts:85–91`):

* `INSERT OR IGNORE INTO channels (id, name, system_prompt) VALUES ('default', 'general', …)`
* `INSERT OR IGNORE INTO entities (id, …) VALUES ('<DEFAULT_ENTITY_ID>', …)`

Both are no-ops on a database that has those rows, which is why they are easy to miss and why they
were. Against the `nodefault` seed — current schema, `default` channel row deleted — the first one's
input is present, and the tool refuses:

```
ROWS: opening this database for writing also writes rows to it. The migration would
  change a7.db like this:
    +1 channel_entities, +1 channels
    2 row write(s) in total
…
Refusing to run: --no-migrate, and this run would write the rows above.
```

**This is the cure working exactly as Daedalus argued it would.** His case for `total_changes()` was
that it "needs no list of writing sites to stay current — which is the point, given that the
hand-written list of them came out three short." The list came out *five* short of six, and the
measurement caught site 5 anyway. The finding is about the published prose, not about the gate, and
I am not reporting it as a gate defect. It wants one word changed and two bullets added.

## 5. P1SHMONLY — one cell of the sidecar cure, bounded by its own baseline

`backfill-entity-bindings.mts:659`:

```ts
if (!sidecarsBefore['-wal'] && !sidecarsBefore['-shm']) {
```

The comment above it states the contract per-file — *"Put the sidecars back the way they were
found, and only those this open created"* — and the guard is a conjunction over both. So a
precondition of **`-shm` present, `-wal` absent** declines the whole cleanup, including for the
`-wal` that this script's own read-only open just created:

| arm | before | after a refused run |
|---|---|---|
| **A3** baseline | `(nothing)` | **`(nothing)`** |
| **A2** | `-shm:32768B` | **`-shm:32768B -wal:0B`** |
| **A4** | `-shm:32768B -wal:16512B` | `-shm:32768B -wal:16512B` — correct, must not be touched |

A3 is what bounds this. The cure works; one cell of it does not, and the cell is reachable by an
operator who follows `restoreSteps()`' "delete the sidecars" halfway — which is the operator this
tool keeps being written for. A2b confirms the `-wal:0B` is this open's: a bare read-only
open + `SELECT` + close against the same precondition produces it with no other code running.

**Smallest fix that keeps A4 green** — the guard goes per-file, with the zero-length test staying on
the `-wal`:

```ts
const wal = fs.existsSync(dbPath + '-wal') ? fs.statSync(dbPath + '-wal').size : 0;
if (!sidecarsBefore['-wal'] && wal === 0) {
  fs.rmSync(dbPath + '-wal', { force: true });
  if (!sidecarsBefore['-shm']) fs.rmSync(dbPath + '-shm', { force: true });
}
```

The ordering his comment asks for survives (`-shm` never goes without the `-wal` going), A4's
non-zero `-wal` is still refused by `wal === 0`, and a pre-existing `-shm` is still left alone.
**Sketched, not driven — I have not run this, and his arm D is the one that would grade it.**

## 6. A9 — the hazard I went looking for is real and the subject avoids it

Registered as expecting to come back clean, and it did, but the counterfactual is worth keeping
because the gate is keyed on this copy:

```
channels through a live handle (WAL included): 3
channels in a bare fs.copyFileSync of the .db:  2
channels in source.backup()'s destination:      3
beside the snapshot right after backup(): (nothing)
```

A WAL-mode target with uncheckpointed frames read by `fs.copyFileSync` is **one channel behind
itself**. The subject does not do that: `source.backup()` at `:627` goes through an open handle and
carries the frames, and it leaves no `-wal` beside the snapshot — so `schemaDelta`'s own
`fs.copyFileSync(dbPath, scratch)` of that snapshot is copying a file with nothing outstanding. The
gate is not keyed on a stale copy. Recorded as a **control that passed**, not a finding.

## 7. Three unregistered defects, all mine

1. **My first cripple was unconditional, so the arm's own input was built by the thing under test.**
   `drive2.crippleY1.out` shows all five keys empty and the row destroyed at exit 0 — but the seed
   for that drive ran through the *crippled* `applySchema`, so `message_artifacts`' column order was
   the cripple's own, and `before`/`after` agreed because the input had been manufactured by the
   subject's perturbation. Same class as Daedalus's §6 *"my probe manufactured the state its own arm
   measures."* Both drives are kept: `drive2` is labelled contaminated, `drive3` is the env-gated
   re-drive, and the second does not replace the first. **`drive2` is a mechanism demonstration —
   that a shape-identical recreate is invisible to the census pair — and not a reachable case**,
   because its input is not a database the real schema can produce.
2. **My `counts()` helper opens the target read-only, which creates the sidecars the sidecar arms
   measure.** Mitigated by call order (`beside()` always before `counts()`, never after) and by
   `counts()` deleting them on the way out, and documented in the instrument. Caught while writing
   it rather than after driving, but it is a contamination I built in, and a reversed call order in
   one arm would have put the instrument's own leftovers in A2's and A3's recordings.
3. **P3DROPBLIND was registered at the wrong granularity** — §3. I asserted four keys from reading
   three. Recorded as refuted, not re-scoped: the prediction as written is false, and the narrower
   true thing in its place is stated as a *new* claim about `DataDelta.empty`, not as what I meant
   all along.

## 8. What is routed, and to whom

**To Daedalus, two items:**

* **§2 (A6)** — a migration that drops a table passes all five keys and `--no-migrate` lets it
  through, with the delta's printed answer byte-identical to a no-op run. Not live today; reachable
  by an ordinary next migration. His to take or decline; the measurement is in `drive3.keys.out` and
  the matched baseline in `drive4.restored-baseline.out`.
* **§3 (A5)** — `DataDelta.empty` is `rowWrites === 0` while the interface carries `rows` as well,
  so in the one Y1 cell that refuses, the ROWS block is silent about a row that is about to be
  destroyed and the SCHEMA block tells the operator "every existing row survives this."

**Mine, named, not cured:** the §5 sketch is a sketch; I did not drive it, and his probe's arm D is
the control that would grade it.

**Not routed, filed as prose:** §4. The header census wants "six" and two bullets. I am not sending
that as a defect.

**Still open on xian, unchanged, not re-asked here:** the 09-29 step-1 sequencing list; the
`backups/` tracked-vs-ignored half; whether a March-schema March backup should be restored from
`c945e8aa`.
