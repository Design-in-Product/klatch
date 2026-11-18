---
unit: unit-478migrationarm
agent: Argus
date: 2026-11-18
fire: WORK
opened: 13:35:26 PST (`date`, read not estimated)
state-at-registration: the arm does not exist; migration.test.ts is unedited
---

# unit-478migrationarm — what happens when migration.test.ts's ten simulated arms are pointed at the real `applySchema`?

## Why this unit exists, and who it is owed to

My own `unit-475schemasource` (11/18 START fire) found that `migration.test.ts`'s ten "Step 8"/
"Phase 2" arms each hand-build a `:memory:` DB already in its post-migration shape, then either
hand-type an `ALTER TABLE` or nothing at all — none imports or calls `applySchema`/`runMigrations`.
The file's own comment (`:62-65`) claims it "run[s] the migration function"; it doesn't. Daedalus's
reply (`c0ec635c`) confirmed the finding by direct read and named fixing it explicitly as my lane,
with no deadline: *"I am not touching `migration.test.ts`'s ten arms. Pointing them at the real
migration is a change to what they assert, that is your lane."* This fire takes it — it is
unblocked, named, and sized to one file, not the larger `setup.ts` architecture question Daedalus
and I both left open.

## What I read BEFORE registering, and what I deliberately did not

- `packages/server/src/__tests__/migration.test.ts` — all 298 lines, all ten arms plus the other
  nine non-schema `it(` blocks.
- `packages/server/src/db/index.ts` lines 1–100: `getDb`, `applySchema`, `initSchema` in full, and
  the start of `runMigrations`.
- `packages/server/src/db/index.ts` lines 100–370: the full body of `runMigrations`, read in full
  this time (unlike Daedalus's `unit-477` registration, which stopped at line 100) — because the
  exact ALTER text, column order, and default clauses the migration writes are the thing each
  prediction below turns on.

**Not read:** `db/index.ts` past line 370 (the files/file_refs backfill and anything after it) — not
relevant to channels/messages/message_artifacts, the three tables these ten arms touch.

## Predictions

Registered before the arm exists or `migration.test.ts` is touched.

- **P1.** Arm 3 ("source column defaults to NULL for existing channels") **refutes** once pointed
  at the real `applySchema`: the live migration's `ALTER TABLE channels ADD COLUMN source TEXT
  DEFAULT 'native'` (`db/index.ts:142`) back-fills the pre-existing row with `'native'`, not `NULL`
  — the test's own hand-simulated `ALTER TABLE channels ADD COLUMN source TEXT` (no default) is
  what currently makes `.toBeNull()` pass, and that clause is not what production runs.
- **P2.** Driving the real `applySchema` against the `message_artifacts` describe block's current
  legacy base — `channels(id, name, created_at)`, no `system_prompt` — **throws**, because
  `initSchema`'s `INSERT OR IGNORE INTO channels (id, name, system_prompt) VALUES (...)` names a
  column that table does not have, and `CREATE TABLE IF NOT EXISTS` does not add it to an existing
  table.
- **P3.** Once each describe block's legacy base is widened to carry the minimum original column
  set (`system_prompt` on `channels`, present since the oldest schema, wherever currently missing),
  the other eight arms (all except #3, and excluding the P2 crash site before its fixture is
  widened) pass against the real `applySchema` using the same assertions already written — the
  migration produces the same columns, table, and row values, modulo P1.
- **P4.** Arm 9 ("CASCADE deletes artifacts when message is deleted") still cascades correctly once
  driven through the real migration, even though the legacy `messages` base here has no `CHECK`
  naming `'incomplete'` and so triggers `runMigrations`'s table-rebuild branch (`db/index.ts:172-220`,
  which toggles `foreign_keys` OFF then back ON around the rebuild) — the pragma is restored to ON
  before the test's own `DELETE` runs, so the cascade still fires.
- **P5.** Arm 8 ("message_artifacts has correct columns") passes unchanged even though the real
  schema carries four columns (`file_name`, `file_mime_type`, `file_size_bytes`, `file_storage_key`)
  the hand-simulated version never had, because its assertion is a `toContain` check against a
  fixed subset, not an exact column-list comparison.
- **P6.** P1 is the **only** place among the ten arms where the hand-simulated ALTER's literal SQL
  text (default clause, NOT NULL, or CHECK) diverges from the real migration's for a column these
  tests read back. No second such mismatch surfaces.

## Registered refusals — what this unit cannot answer, stated before it runs

- **R1.** Does not re-litigate whether `setup.ts` itself should call `applySchema` instead of its
  own hand-typed DDL — the larger architecture question Daedalus and I both left open with no
  owner. Scope here is the ten `migration.test.ts` arms only.
- **R2.** Measures only `:memory:` handles built inside the arm/cure. Says nothing about any
  on-disk `klatch.db` or its migration history.
- **R3.** Does not re-measure `unit-477ddlcolumns`'s column-order/attribute findings — takes them as
  already answered and out of scope.
- **R4.** `npm test`'s pass count after the cure lands is evidence the suite still runs, not
  evidence the ten arms now assert anything they didn't already assert before — a rewritten arm
  that still passes could be passing on a weaker assertion. Each arm's assertion text is compared
  before/after in RESULTS.md, not just its exit code.

## Method — decided here so the cure cannot be shaped by its own result

One arm file in this unit's own directory, run under its own vitest config (outside `npm test`'s
`include`), that imports the real `applySchema` from `../../../db/index.js` and, for each of the
ten originals, rebuilds the same scenario with: (a) the minimum legacy base needed for `applySchema`
not to crash, (b) a call to the real `applySchema(db)` in place of the hand-typed `ALTER`/nothing,
(c) the original assertion, unedited, so a refutation is visible as a failing `expect` rather than a
quietly rewritten one. P1's assertion is driven as originally written (`.toBeNull()`) so the
refutation shows as a red test, not reasoned about from reading the source.

Only after the arm's drive is read and each prediction graded does the cure get applied to the
tracked `migration.test.ts` itself — and P1's assertion gets corrected there, not deleted.
