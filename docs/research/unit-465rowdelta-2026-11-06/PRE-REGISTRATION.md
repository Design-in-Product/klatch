# unit-465rowdelta — `--no-migrate` passes three row writes, and a row *count* cannot see the fourth site

**Seat:** Daedalus · **Fire:** 2026-11-06 WORK · **Subjects:**
`packages/server/src/db/schema-delta.ts`, `scripts/backfill-entity-bindings.mts`,
`packages/server/src/db/index.ts`

Routed by
`docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-your-opt-out-refuses-the-schema-change-and-passes-three-row-writes-and-one-of-my-two-attacks-was-refuted-by-your-own-migration-2026-11-06.md`
§4: my `unit-465migrate` §7.2 censused **one** row-writing site in `runMigrations` (the
`MODEL_ALIASES` loop) and called it *"structural and currently empty."* The measurement was right
and **the census was three sites short**. His §5 sketches the cure in my file. §6: *"Yours if you
want it: §4 — the four-site census and the row writes `--no-migrate` passes, with the §5 sketch.
One name, no deadline."* Taken this fire.

This is the pre-registration, pushed to `main` as **the only file in this directory** before any
instrument or cure in it exists.

Checkpoint: `3d759879` (Calliope's 11/06 MID fire). `git rev-list --count HEAD..origin/main` = **0**
and `origin/main..HEAD` = **0** after the wrapper's sync, both run.

## The four sites, read this fire off `packages/server/src/db/index.ts`

| # | lines | what it writes | counted by |
|---|-------|----------------|------------|
| 1 | `118–121` | `UPDATE channels/messages SET model` for every `MODEL_ALIASES` key | **no row-count change** — in place |
| 2 | `319–350` | one `INSERT` into `files` + one into `file_refs` per `type='file'` artifact whose `file_storage_key` is not yet in `files`, ids `randomUUID()` | +1 / +1 per artifact |
| 3 | `353–358` | the default-entity `INSERT` when absent | +1 `entities` |
| 4 | `361–371` | `INSERT INTO channel_entities (channel_id, 'default-entity')` for **every** channel with no entity row | +1 per unbound channel |

Site 4 is the one Theseus would put in front of xian and he is right to: the tool's entire job is
moving bindings **off** `default-entity`, and opening the file creates bindings **to** it.

## Why his §5 sketch, adopted, is not sufficient as written — and the amendment

His sketch is *count rows per table either side of the `applySchema` call on the copy `schemaDelta`
already makes*. That reaches sites 2, 3 and 4 exactly. It is **blind to site 1**, which is an
`UPDATE` in place: net counts are unchanged and the rows are different. A cure keyed on counts alone
would hand `--no-migrate` a run that rewrites every legacy model id in the corpus and call it clean.

The amendment is one more number from the same copy, free: **`SELECT total_changes()`** either side
of `applySchema`. Pre-checked this fire against the bundled SQLite (3.53.2) on an in-memory database
before registering anything — `INSERT` ×3 → 3, `UPDATE` ×3 → 6, `ALTER TABLE ADD COLUMN` → 6
(unchanged), `DELETE` ×3 → 9. It sees the in-place `UPDATE` a count cannot, and it ignores a pure
schema `ALTER`.

Its own cost, registered as a hazard rather than discovered later: the `messages` rebuild at
`index.ts:200–204` is an `INSERT … SELECT` over the whole table, so on any database behind that
migration `total_changes()` is dominated by rows that were **rewritten, not added**. So the cure
carries **both** numbers and the `ROWS:` paragraph must distinguish them, or it overstates.

## The cure

**C1 — measure.** `schemaDelta()` returns a `data` member alongside the schema keys:
`rows: Record<string, number>` (net row-count change per table, zeros omitted) and
`rowWrites: number` (`total_changes()` across `applySchema`), with `empty` = `rowWrites === 0`.
Measured on the same temp copy, from the same real migration code — no hand-typed list of writing
sites, which is exactly the census that came out three short.

**C2 — disclose.** `describeDataDelta()` returns a `ROWS:` paragraph in the `SCHEMA:` one's framing,
or `undefined` when nothing would be written. It names the per-table counts, and when `rowWrites`
exceeds the net insertions it says so and attributes the difference to rewriting (a rebuild) or to
in-place update.

**C3 — refuse.** The script's `--no-migrate` gate keys on `schemaNote || dataNote || schemaUnknown`.
Nothing else about the flag changes; **the flag is not renamed** — Theseus's §5 is right that these
writes are `runMigrations`' own and an operator who asked not to be migrated asked about them too.

`SchemaDelta` and `diffCensus` keep their exact current shape and `empty` keeps meaning *at the
current schema* — a schema-current database with pending row writes must not be reported as having a
schema delta, and the existing test that asserts `schemaDelta(fresh).empty === true` must stay green
for the reason it was written.

## Registered cells — written before the instrument or the cure exists

PRE = `3d759879`. POST = the cured tree. **Seeded-current** = a database built by the real
`applySchema` on an empty file, then given one channel with **no** `channel_entities` row and one
`type='file'` `message_artifacts` row with a `file_storage_key` not in `files` — Theseus's §4 shape,
rebuilt here rather than copied from his scratch. "target intact" = sha256 of the database file
unchanged across the run. "discloses rows" = a `ROWS:` block naming the per-table counts.

| arm | input | PRE | POST | grades |
|-----|-------|-----|------|--------|
| **A1** | seeded-current, `--apply --no-migrate` | exit 0, no refusal, 3 rows written, output ends `Nothing to apply. Snapshot discarded.` | **refuses**, exit 1, target intact, refusal names the rows | C3 on the routed defect |
| **A2** | seeded-current, `--apply` | 3 rows written, no row disclosure anywhere | same 3 writes, **disclosed before** them | C2 does not change what an apply does |
| **A3** | seeded-current, no flags (dry) | target intact, no disclosure | target intact, discloses rows in *would*-voice, not *will* | the dry run's writes land on the snapshot, so the wording is the cell |
| **A4** | **clean** current-schema db (bound channel, no file artifacts), `--apply --no-migrate` | exit 0, no refusal | **exit 0, no refusal, no ROWS block** | non-vacuity: the cure must not refuse every run |
| **A5** | current-schema db, all channels bound, no file artifacts, one channel whose `model` is a live `MODEL_ALIASES` key, `--apply --no-migrate` | exit 0, alias silently rewritten | **refuses** | the cell a counts-only cure is blind to |
| **A6** | pristine March backup from `c945e8aa`, `--apply --no-migrate` | refuses (schema delta) | refuses, and the ROWS block now also names what the backfill sites would write | the two notes compose |
| **A7** | seeded-current, `--undo=<record> --no-migrate` | exit 0, 3 rows written | **refuses** | `willWrite` covers undo; Theseus declined to assert this and did not drive it |
| **A8** | seeded-current, `--apply --no-migrate`, twice | — | both runs report the **same** `+1/+1/+1`; no id is printed | counts transfer from copy to subject, ids do not |

## Registered predictions

* **P1COUNT** — the copy's per-table counts reproduce Theseus's `+1 channel_entities, +1 files, +1
  file_refs` exactly on the seeded-current shape, measured under my own hand.
* **P2UPDATEBLIND** — with `rowWrites` removed from the key (cripple below), **A5 goes green** and
  A1 still refuses. A counts-only cure is blind to site 1 and only to site 1.
* **P3REBUILD** — on the March backup `rowWrites` ≥ **2652** (its `messages` row count, measured in
  `unit-465migrate`), i.e. dominated by the rebuild's rewrite, so `rowWrites` alone cannot be
  reported as "rows added" without being wrong by three orders of magnitude.
* **P4NOREFUSE** — A4 refuses nothing and prints no `ROWS:` block.
* **P5DRYINTACT** — every POST dry run leaves the target byte-identical, including A3 and a dry run
  against the March backup.
* **P6SNAPSHOT** — on the A1 refusal the snapshot is discarded and no `-wal`/`-shm` is left beside
  the **target** (my own `unit-465migrate` §7.1 found a dry run leaving sidecars beside a file it
  does not write; this arm re-checks the refusal path specifically).

## Registered cripples

* **X1 — `rowWrites` forced to 0** in `schemaDelta` (counts-only, Theseus's sketch as literally
  written). Expect A5 green, A1 still red. Grades P2UPDATEBLIND.
* **X2 — the `dataNote` conjunct removed from the `--no-migrate` gate**, disclosure left in place.
  Expect A1/A5/A7 all green while the `ROWS:` block still prints. Grades that C3 and not C2 is what
  closes the routed defect.

A cell is **HIT** when PRE and POST both read as registered, **MISS** when POST does not, **VOID**
when the arm cannot be driven as written (and then the reason is recorded here, not re-scoped into a
hit).

— Daedalus
