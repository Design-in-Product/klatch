# unit-465rows — `--no-migrate` is an opt-out from a schema change, and `runMigrations` is not only a schema change

**Agent:** Theseus · **Date:** 2026-11-06 · **Fire:** START (~10:5x PT)
**Subject pin:** `origin/main` at `6db293bf` (Daedalus's 11/06 wrap). Instruments live in this
directory and are *not* pinned to that rev — they are written after it, which is the only way they
can be written at all.

## Why

Daedalus cured my §3 finding this morning (`docs/research/unit-465migrate-2026-11-06/`,
`c16f53ac`): `scripts/backfill-entity-bindings.mts` now discloses the schema delta before a write
and `--no-migrate` refuses a writing run whose delta is non-empty. His own §7.2 names a residual:

> `runMigrations` rewrites row data, not only schema — the `MODEL_ALIASES` loop runs `UPDATE
> channels/messages SET model = ?`. `--no-migrate` would not stop it and the delta cannot see it.
> … on this corpus it moves **0** rows … Structural and currently empty, which is when to write it
> down.

That is a census of **one** instance of the mechanism. Reading `packages/server/src/db/index.ts` at
`6db293bf` by hand, I count **four** row-writing sites in `runMigrations`, three of which his memo
does not name, and two of which are keyed on data states *the backfill tool itself is about*. The
shape of the error is the one I have routed him twice and he has routed me once: census the
mechanism, not the reported instance.

The question this unit asks is not "is the delta schema-only" — it is by construction. It is:
**when an operator passes `--no-migrate` to protect an artefact, and the delta is empty, what does
the tool still write into that artefact?**

## Cells

Hand-listed before any drive. Each cell is HIT only if the stated observable lands; a cell whose
observable is absent is MISS even if the surrounding story holds.

### A — census of the mechanism

* **A1.** `runMigrations` contains exactly **4** sites that write row data (as opposed to schema):
  (i) the `MODEL_ALIASES` `UPDATE` loop; (ii) the `files` + `file_refs` backfill from
  `message_artifacts`; (iii) the default-entity `INSERT` when absent; (iv) the auto-assign
  `INSERT INTO channel_entities` for every channel with no entity row. Prediction: 4, and no fifth.
* **A2.** Of those four, **three** are unnamed in Daedalus's 11/06 memo §7.2. Prediction: only (i)
  is named.

### B — reachability on the real corpus

Measured read-only against `klatch.db` and against `backups/klatch.db.backup-2026-03-14` as it
stands on `main` (already migrated by my 11-05 apply, so already at the current schema — which is
exactly the state in which `--no-migrate` says yes).

* **B1.** Channels with **no** `channel_entities` row, in each database. Prediction: **0** in both
  (my 11-05 apply re-pointed rather than removed, and the auto-assign has run many times).
* **B2.** `message_artifacts` rows with `type='file'` and `file_storage_key IS NOT NULL` whose
  `file_storage_key` is not in `files.storage_key`, in each database. Prediction: **0** in both.
* **B3.** `MODEL_ALIASES` matches in each database. Prediction: **0** in both — reproducing
  Daedalus's figure under my own read rather than quoting it.

If B1–B3 are all 0, the correct verdict is *the mechanism is live and the corpus is currently
empty of it* — the same verdict he reached for site (i), now extended to the set. That is a weaker
claim than "this is a live hazard today" and I am registering it as the expected one.

### C — the opt-out does not opt out (constructed)

A database built by `applySchema` on an empty file, so `delta.empty === true` and `--no-migrate`
permits the run; then seeded by hand with the two data states above.

* **C1.** `schemaDelta()` on it returns `empty: true` and `describeSchemaDelta()` returns
  `undefined` — the operator is shown **nothing**.
* **C2.** `--apply --no-migrate` against it is **not** refused (no `REFUSED` line, exit 0).
* **C3.** After that run, the seeded channel with no entity row **has** a `channel_entities` row
  pointing at `default-entity` — written by the migration, not by the backfill's plan.
* **C4.** After that run, `files` and `file_refs` have gained **1** row each, with ids that differ
  between two runs (`randomUUID()`), so the write is not even idempotent in its ids.
* **C5.** The backfill's own output does not mention either write. Prediction: it does not.

### D — a rebuild the cured delta still reports as a plain column append

Daedalus's §6b closed the case where a rebuild changes constraint text and no column. The sibling
case is a rebuild that changes constraint text **and appends a column**: `appendOnly` is then true
and `cols.length === was.length` is false, so `rebuiltTables` and `alteredTables` are both empty
and the table reports as `addedColumns` only.

* **D1.** Constructed `messages` carrying the rebuild's column order **minus trailing
  `created_at`**, with the narrow three-value `status` CHECK. Prediction: `rebuiltTables: []`,
  `alteredTables: []`, `addedColumns: ['messages.created_at']`.
* **D2.** The rendered disclosure for D1 therefore omits the "rewrites every row / file grows /
  slack" sentences, while the migration does rebuild the table. Prediction: omitted.
* **D3.** Reachability of D1 from a *shipped* schema version. Prediction: **not reachable** —
  `created_at` is in `initSchema`'s `messages` from the first version, so no real Klatch database
  lacks it. D1 is a property-carrying known positive for the key, not a live hazard, and I register
  that distinction before measuring rather than discovering it in my own favour afterwards.

### E — control

* **E1.** The *frozen* pre-cure script (`git show c16f53ac^:scripts/backfill-entity-bindings.mts`)
  does not accept `--no-migrate` at all. Prediction: refused as an unknown flag. This is the cell
  that makes C2 mean something: if the old script also ran clean, C2 would not be about the cure.

## What would refute me

* A1 landing at 1 or 2 — then his §7.2 census is complete and my headline is wrong.
* C2 refusing — then `--no-migrate` is keyed on something broader than the schema delta and the
  opt-out does protect the artefact.
* C3/C4 showing no rows written — then `runMigrations`' data sites are unreachable through this
  script's call path, and the whole unit collapses to a documentation note.
* D1 reporting the table in `rebuiltTables` — then the `appendOnly` key is stronger than I read it.
