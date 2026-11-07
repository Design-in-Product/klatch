# unit-465drop — pre-registration

**Agent:** Daedalus · **Date:** 2026-11-06 (STOP fire) · **Model:** Opus 5
**Subject:** `packages/server/src/db/schema-delta.ts` — the five keys of the migration delta
**Routed by:** `docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-a-drop-passes-all-five-of-your-keys-and-my-own-additive-claim-was-refuted-by-your-rebuilt-tables-key-2026-11-06.md`, §2 and §3 (his §8 names both as mine if I want them; I am taking both).

Written and pushed **before any instrument exists in this directory**. The arms below are
registered with their expected answers so that an answer I did not expect is visible as such
rather than absorbed.

---

## The two defects, read off the source this session rather than taken from the memo

Both confirmed by reading `schema-delta.ts` at `3d3809b9` before writing a line of this:

1. **§2 — the delta is one-directional.** `diffCensus:177` is
   `after.objects.filter((o) => !before.objects.includes(o))` and there is no converse. The three
   remaining schema keys (`addedColumns`, `rebuiltTables`, `alteredTables`) all iterate
   `Object.entries(after.cols)`, so an object that is in `before` and not in `after` is reached by
   none of them. `empty` is the conjunction of those four lengths, so it stays `true`.
2. **§2, the row half.** `countRows:224` iterates `Object.keys(c.cols)` and `diffRows:245`
   iterates `Object.keys(after)`. A table absent from `after` is in neither. `total_changes()` is
   blind by construction: `DROP TABLE` is DDL.
3. **§3 — `DataDelta.empty` discards a quantity it measured.** `schemaDelta:286` is
   `empty: rowWrites === 0`. The interface carries `rows` *and* `rowWrites`; the guard reads one.

Also verified this session, because the cure's blast radius depends on it: `grep -n "DROP"`
over `packages/server/src/db/index.ts` returns exactly **one** site, `DROP TABLE messages` at
`:206`, paired with `ALTER TABLE messages_rebuild RENAME TO messages` at `:207`. So nothing in
the tree nets a drop today, and Theseus's scoping of his own claim holds on my read too.

## The cure I intend to write

Three changes, all in `schema-delta.ts`:

- **`droppedObjects: string[]`** on `SchemaDelta` = `before.objects.filter((o) => !after.objects.includes(o))`, conjoined into `empty`, printed by `describeSchemaDelta`.
- **`countRows`/`diffRows` keyed on the union** of `before` and `after` table names, so a table
  that loses all its rows by ceasing to exist reports a negative net.
- **`DataDelta.empty` = `rowWrites === 0 && no non-zero row entry`**, and `describeDataDelta`
  given a sentence for the case where the only movement is a loss (today every branch in it is
  written for writes).

I am not adding a `droppedColumns` key. A column cannot leave a table without a rebuild, and
`rebuiltTables` already fires on that — the `appendOnly` check at `:198` is `was.every((c, i) => cols[i] === c)`, which a removal fails. If an arm below shows otherwise, that is a finding.

## Arms

Each arm names the file its output lands in. "Crippled" arms perturb `runMigrations` and are
restored afterwards; the restore is diffed against a **pre-action** baseline captured from the
working tree, not from `HEAD` (the cure will be uncommitted while the arms run — the trap I hit
in `unit-465rowdelta` X3).

| # | Arm | Tree | Expected |
|---|---|---|---|
| A1 | Y2 reproduced: `DROP TABLE IF EXISTS message_artifacts` appended to `runMigrations`; target at current schema with 1 artifact row | pre-cure | all five keys silent, `empty` both halves `true`, both notes `undefined`, `--apply --no-migrate` **exit 0**, table **absent** after |
| A2 | Y1 reproduced: drop **and recreate** `message_artifacts`; same target | pre-cure | `rebuiltTables` fires → exit 1, **and** `rows: {message_artifacts: -1}` with `rowWrites: 0`, `data.empty: true`, `describeDataDelta` **undefined** |
| A3 | A1 re-driven | post-cure | `droppedObjects` non-empty, SCHEMA block prints, `--apply --no-migrate` **exit 1**, table **present** after (refusal wrote nothing) |
| A4 | A2 re-driven | post-cure | `data.empty: false`, ROWS block prints and names the loss |
| A5 | `DROP INDEX idx_message_artifacts_message_id` only (Theseus's sibling sentence), table left alone | post-cure | `droppedObjects` = `['index:idx_message_artifacts_message_id']`, exit 1, no row movement |
| A6 | **Control, uncrippled**, target at current schema with 1 artifact row | post-cure | both halves `empty`, both notes `undefined`, exit 0 — the cure must not manufacture a refusal where there was none |
| A7 | **Control, behind-schema**: a copy of `backups/klatch.db.backup-2026-03-14` | post-cure | the schema note still prints; whether `droppedObjects` is empty on it is **measured, not predicted** — see P5 |
| A8 | **Matched baseline**: A6 and A7 driven on the restored pre-cure tree as well, same session | both | A6 identical either side; A7's schema note identical except for anything P5 turns up |

## Predictions

Registered so a miss is a miss.

- **P1 — the drop takes the index with it.** `index.ts:233` creates
  `idx_message_artifacts_message_id` on that table, and SQLite drops a table's indexes with it.
  So A1's cured `droppedObjects` has **two** entries, not one, and the operator sentence must not
  say "1 object".
- **P2 — `droppedObjects` is empty on A2.** The table is recreated, so the object key cannot be
  what cures §3. §3 is cured by the row key alone, and if I had only written `droppedObjects` I
  would have shipped a cure that leaves A2 exactly as blind as it is now.
- **P3 — `rowWrites` stays 0 on both A1 and A4.** `DROP TABLE` is DDL and `CREATE TABLE` writes
  no row, so the whole of the row-half cure has to come from `rows`, and `data.empty` has to stop
  being keyed on `rowWrites`.
- **P4 — `describeDataDelta`'s existing arithmetic reads wrong on a pure loss.** `added` at `:357`
  sums positives only, so on A4 it is `0`, `rowWrites > added` is `0 > 0` → false, and the only
  lines printed are the per-table list and `0 row write(s) in total`. A block whose own heading is
  *"opening this database for writing also writes rows to it"* and whose body says `0 row write(s)`
  is not a sentence I am willing to ship; expect to need new prose, not just a new guard.
- **P5 — the March backup nets at least one dropped object.** Low confidence, registered because
  the control is where it would hurt: a 2026-03 database may hold an index or table the November
  schema no longer creates, which would make `droppedObjects` fire on the *control* arm. If it
  does, that is a true disclosure and not a false positive — but it changes A7's published figures
  and I would rather have predicted it than explain it afterwards.
- **P6 — the refusal needs no change in the backfill script.** `backfill-entity-bindings.mts:971`
  keys on `schemaNote || dataNote || schemaUnknown`, so curing either key makes the refusal fire
  with no edit there. The `reason` ternary at `:976` will then say "would upgrade the schema",
  which for a *drop* is a false reason for a correct refusal — the same class of defect the
  granularity note at `:973` was written to fix. Expect one edit there after all.

## Registered cripples

| id | Perturbation | Restored how |
|---|---|---|
| Y2′ | `DROP TABLE IF EXISTS message_artifacts;` appended inside `runMigrations` | env-gated in the probe, written to the working tree and restored from a pre-action byte copy |
| Y1′ | the same, followed by the `CREATE TABLE`/`CREATE INDEX` pair copied from `:224–233` | same |
| Y3′ | `DROP INDEX IF EXISTS idx_message_artifacts_message_id;` appended | same |

Every cripple is applied to the working tree, driven, and restored by writing back a byte copy
taken **before** the perturbation. `shasum` of the file before and after the whole sequence is
part of the recorded output, not an assertion in prose.

## What would refute the cure

- A6 going from exit 0 to exit 1. That is the cure manufacturing a refusal, and it is worse than
  the defect.
- `droppedObjects` firing on the uncrippled current schema at all.
- The server suite losing a test, or `diffCensus`'s existing eight cases changing answers.

— Daedalus
