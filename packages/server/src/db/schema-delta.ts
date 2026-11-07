/**
 * What would bringing this database up to the current schema change about it?
 *
 * ## Why this exists
 *
 * `getDb()` runs `applySchema()` — so every tool that opens a database through
 * it migrates that database as a side effect of looking at it. For the app's own
 * `klatch.db` that is the point. For `scripts/backfill-entity-bindings.mts` it is
 * a hazard, because the thing an operator most wants to run the backfill against
 * is a **backup**: Theseus's 2026-11-05 run pointed it at
 * `backups/klatch.db.backup-2026-03-14`, whose entire purpose is to answer *what
 * did this corpus look like in March*, and the apply silently upgraded it to the
 * November schema. Every row move was exact; the artefact stopped being the
 * artefact.
 *
 * A planner cannot plan against a schema it has not migrated, so the fix is not
 * avoidance. It is **disclosure** — say what will be added, before writing — and
 * an **opt-out** for the operator who would rather stop.
 *
 * ## Why it reads the real migration code
 *
 * The answer is computed by applying the live schema to a **temp copy** and
 * diffing, not by consulting a list of expected tables and columns. A list is a
 * sentence about the schema; this is a measurement of it. The list version is
 * correct on the day it is typed and silently wrong one migration later — and it
 * would be wrong in the dangerous direction, telling an operator that nothing
 * will change to a file that is about to be rebuilt.
 *
 * The copy is why nothing here writes to the caller's database: `delta.ts` is
 * called on the pre-write snapshot the tool has already taken, copies *that*, and
 * deletes the copy and its sidecars on the way out, including on a throw.
 *
 * ## Why it measures rows as well as schema
 *
 * The first version of this module answered only *what will change about the
 * container*, and `unit-465migrate` §7.2 censused the migration's row-writing
 * sites at **one** — the `MODEL_ALIASES` loop — and called it "structural and
 * currently empty." Theseus's 2026-11-06 §4 read the file and found **four**, and
 * drove the consequence: against a database already at the current schema,
 * `--apply --no-migrate` passed a run that wrote three rows and ended with
 * *"Nothing to apply. Snapshot discarded."* That sentence is true about the plan
 * and false about the file, and `--no-migrate`'s whole promise is about the file.
 *
 * The **six** sites — four in `runMigrations`, two in `initSchema`:
 *
 * 1. the `MODEL_ALIASES` loop — `UPDATE channels/messages SET model`, **in
 *    place**, so no row count moves;
 * 2. the `message_artifacts` → `files` + `file_refs` backfill — two `INSERT`s per
 *    `type='file'` artifact not yet in `files`, ids minted with `randomUUID()`;
 * 3. the default-entity `INSERT`, when `DEFAULT_ENTITY_ID` is absent;
 * 4. `INSERT INTO channel_entities (…, DEFAULT_ENTITY_ID)` for every channel with
 *    no entity row — a tool whose job is moving bindings *off* the default
 *    creating bindings *to* it, as a side effect of opening the file;
 * 5. `INSERT OR IGNORE INTO channels … 'default'` — `initSchema`, `index.ts:85`;
 * 6. `INSERT OR IGNORE INTO entities … DEFAULT_ENTITY_ID` — `initSchema`,
 *    `index.ts:90`.
 *
 * This list said **four, all in `runMigrations`** until Theseus's 2026-11-06 §4
 * found 5 and 6 and drove them: against a current-schema database with the
 * `default` channel row deleted, the tool refuses and names `+1 channels, +1
 * channel_entities`. Both no-op on a database that already has those rows, which
 * is why they are easy to miss.
 *
 * Counted twice, wrong twice: `unit-465migrate` §7.2 said **one** (five short) and
 * this header said **four** (two short). The **measurement** was right both times.
 * That is the argument for measuring rather than listing, and it is worth more
 * than the list it replaces — so the list above is here as orientation, not as the
 * thing the disclosure is keyed on.
 *
 * So the measurement is two numbers, not one. **Per-table row counts** either
 * side of the same `applySchema` call reach sites 2, 3 and 4 exactly. They are
 * blind to site 1, which changes rows without changing how many there are — so
 * **`total_changes()`** is read across the same call, and it sees the in-place
 * `UPDATE` while ignoring a pure `ALTER TABLE ADD COLUMN`. A cure keyed on counts
 * alone would hand `--no-migrate` a run that rewrites every legacy model id in
 * the corpus and call it clean.
 *
 * `total_changes()` has its own cost, which is why both numbers are reported
 * rather than just the bigger one: the `messages` rebuild is an `INSERT … SELECT`
 * over the whole table, so on any database behind that migration the write count
 * is dominated by rows that were **rewritten, not added** — 2,652 of them on the
 * March backup. Reported as "rows added" it would be wrong by three orders of
 * magnitude.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { applySchema } from './index.js';

export interface SchemaDelta {
  /** `type:name` for every `sqlite_master` object the schema would create. */
  addedObjects: string[];
  /**
   * `type:name` for every object that is in the database now and **not** there
   * after the migration — a net removal.
   *
   * Theseus's 2026-11-06 §2. Every other key in this interface was written as a
   * question about what the migration *adds*: `addedObjects` is a one-directional
   * set difference, and the three below iterate `after.cols`, so an object that
   * leaves is reached by none of them. A `DROP TABLE` of a populated table came
   * back `empty: true` on all four, `--no-migrate` returned **exit 0**, and the
   * tool printed `Nothing to apply.` over a file that had just lost a table.
   *
   * Nothing in the tree nets a removal today — the one `DROP TABLE` at
   * `index.ts:206` is paired with the rebuild's `RENAME`, so `messages` is in
   * `after` and reports as a rebuild. That is exactly why this is here: the key
   * has to exist before the migration that needs it, because the failure mode is
   * silence and the operator has no way to tell silence from "nothing happened."
   *
   * A table dropped with `DROP TABLE` takes its indexes with it, so this key
   * generally carries more than one entry per lost table.
   */
  droppedObjects: string[];
  /** `table.column` for every column it would add to a table that already exists. */
  addedColumns: string[];
  /**
   * Tables the schema does **not** reach by appending: anything other than
   * `before` being a prefix of `after` is a table *rebuild*. Called out
   * separately because a rebuild rewrites every row and leaves the file's pages
   * slack, which is where an 81% size increase comes from.
   */
  rebuiltTables: string[];
  /**
   * Tables whose `CREATE TABLE` text changes while their columns stay exactly as
   * they were, in order — a constraint change and nothing else.
   *
   * This is the cell the column-level keys above cannot see, and it is not
   * hypothetical: the migration that widened `messages`' status `CHECK` to admit
   * `'incomplete'` is a full table rebuild that adds no column. On the March
   * backup it registers as a rebuild only because that schema *also* predates
   * `stop_reason` and moves `created_at`. Against a database whose columns were
   * already current, that rebuild would move every message row and the delta
   * would have reported nothing at all.
   */
  alteredTables: string[];
  /** True when the database is already at the current schema. */
  empty: boolean;
}

/**
 * What bringing this database up to the current schema would do to its **rows**,
 * as distinct from its shape. Separate from `SchemaDelta` because the two are
 * independent: a database can be exactly at the current schema and still have
 * three rows written into it the moment it is opened for writing, which is the
 * defect this exists for.
 */
export interface DataDelta {
  /**
   * Net row-count change per table, zeros omitted. Reaches the migration's three
   * `INSERT` sites. A table the migration creates counts from 0, so its rows show
   * up here as well as the table showing up in `addedObjects`.
   *
   * Keyed on the **union** of the two censuses, not on `after` alone. A table that
   * stops existing holds zero rows afterwards, and counting only the tables that
   * survive makes the largest row loss reachable the one thing this cannot see.
   */
  rows: Record<string, number>;
  /**
   * `total_changes()` across the migration — every row an `INSERT`, `UPDATE` or
   * `DELETE` touched, whether or not the count moved.
   *
   * This is the key, not `rows`: it is the only one of the two that sees an
   * in-place `UPDATE`. It is **not** a count of rows *added* — a table rebuild's
   * `INSERT … SELECT` lands here in full — so `describeDataDelta` reports it
   * beside the net counts and says which is which.
   */
  rowWrites: number;
  /**
   * True when the migration neither writes a row nor loses one.
   *
   * This was `rowWrites === 0` alone, which is Theseus's 2026-11-06 §3: the
   * interface carries two measured quantities and the guard read one. In the
   * drop-and-recreate cell `rows` held `{ message_artifacts: -1 }` and `rowWrites`
   * held `0`, so the module **measured** the loss and then discarded it —
   * `describeDataDelta` returned `undefined` and the operator was told, in the
   * schema block, that *"every existing row survives this."* In that cell it did
   * not.
   *
   * A guard over an interface has to read every quantity the interface carries, or
   * the quantity it skips is measured for nothing.
   */
  empty: boolean;
}

/** `schemaDelta()`'s answer: the container and the rows, measured in one pass. */
export interface MigrationDelta extends SchemaDelta {
  data: DataDelta;
}

export interface Census {
  objects: string[];
  cols: Record<string, string[]>;
  /** `CREATE TABLE` text per table, as SQLite stores it. */
  sql: Record<string, string>;
}

function census(db: Database.Database): Census {
  const objects = (
    db.prepare('SELECT type, name FROM sqlite_master ORDER BY type, name').all() as {
      type: string;
      name: string;
    }[]
  )
    // `sqlite_autoindex_*` is SQLite's own bookkeeping for a PRIMARY KEY or
    // UNIQUE constraint; it arrives with the table it belongs to and naming it
    // separately would report one new table as two new objects.
    .filter((o) => !o.name.startsWith('sqlite_autoindex_'))
    .map((o) => `${o.type}:${o.name}`);
  const cols: Record<string, string[]> = {};
  const sql: Record<string, string> = {};
  const sqlOf = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`);
  for (const o of objects) {
    if (!o.startsWith('table:')) continue;
    const name = o.slice('table:'.length);
    cols[name] = (db.prepare(`PRAGMA table_info("${name}")`).all() as { name: string }[]).map(
      (c) => c.name
    );
    sql[name] = (sqlOf.get(name) as { sql: string | null } | undefined)?.sql ?? '';
  }
  return { objects, cols, sql };
}

/**
 * Diff two censuses. Exported for the tests, which exercise the comparison
 * without going near a file.
 */
export function diffCensus(before: Census, after: Census): SchemaDelta {
  const addedObjects = after.objects.filter((o) => !before.objects.includes(o));
  // The converse of the line above, and the only key in here that asks the
  // question in that direction. The three loops below cannot: they iterate
  // `after.cols`, so a table that is not in `after` is not visited at all.
  const droppedObjects = before.objects.filter((o) => !after.objects.includes(o));
  const addedColumns: string[] = [];
  const rebuiltTables: string[] = [];
  const alteredTables: string[] = [];
  for (const [table, cols] of Object.entries(after.cols)) {
    const was = before.cols[table];
    // A table that did not exist before is already reported as an added object;
    // listing all of its columns again would bury the one added column that
    // matters in a wall of ones that do not.
    if (!was) continue;
    for (const c of cols) if (!was.includes(c)) addedColumns.push(`${table}.${c}`);
    // `ALTER TABLE ADD COLUMN` can only **append**, so the one shape reachable
    // without a rebuild is `after === before ++ new`. Anything else — a column
    // inserted in the middle, a surviving column moved, a column gone — took a
    // rebuild to get there.
    //
    // The first version of this compared the *relative order of the survivors*,
    // which is weaker than it looks: `[id, b] -> [id, c, b]` preserves it and is
    // still a mid-list insert, so the check went green on a rebuild. It caught
    // the March case only because `created_at` happened to move past three other
    // columns. Found by this unit's own test before the cure shipped, not after.
    const appendOnly = was.every((c, i) => cols[i] === c);
    if (!appendOnly) {
      rebuiltTables.push(table);
    } else if (cols.length === was.length && before.sql[table] !== after.sql[table]) {
      // Same columns, same order, different `CREATE TABLE` text: a constraint
      // moved and nothing else did. Only reachable by a rebuild, and invisible
      // to every column-level comparison above.
      alteredTables.push(table);
    }
  }
  return {
    addedObjects,
    droppedObjects,
    addedColumns,
    rebuiltTables,
    alteredTables,
    empty:
      addedObjects.length === 0 &&
      droppedObjects.length === 0 &&
      addedColumns.length === 0 &&
      rebuiltTables.length === 0 &&
      alteredTables.length === 0,
  };
}

/** Row count per table named in a census. A table with no rows is still listed. */
function countRows(db: Database.Database, c: Census): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const name of Object.keys(c.cols)) {
    counts[name] = db.prepare(`SELECT COUNT(*) FROM "${name}"`).pluck().get() as number;
  }
  return counts;
}

/**
 * Rows this connection has inserted, updated or deleted since it was opened.
 * SQLite's own counter, so it needs no list of writing sites to stay current —
 * which is the point, given that the hand-written list of them came out five short
 * the first time and two short the second.
 *
 * It does **not** see DDL. A `DROP TABLE` moves this counter by zero however many
 * rows the table held, which is why `rows` is reported beside it and why
 * `DataDelta.empty` reads both.
 */
function totalChanges(db: Database.Database): number {
  return db.prepare('SELECT total_changes()').pluck().get() as number;
}

/**
 * Net row change per table over the **union** of the two sides.
 *
 * `Object.keys(after)` alone was the row half of Theseus's §2: a table that
 * ceases to exist is not in `after`, `countRows` never counted it on that side,
 * and every row it held vanished from the arithmetic along with it. The union
 * makes a missing table read as the zero it now holds.
 */
function diffRows(
  before: Record<string, number>,
  after: Record<string, number>
): Record<string, number> {
  const rows: Record<string, number> = {};
  for (const table of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const net = (after[table] ?? 0) - (before[table] ?? 0);
    if (net !== 0) rows[table] = net;
  }
  return rows;
}

/**
 * The schema delta between the database at `dbPath` and the current schema.
 *
 * Never writes to `dbPath`, and never opens it for writing: it is copied, the
 * copy is migrated, and the copy is removed. Pass the pre-write snapshot where
 * one exists — a copy of a copy costs the same and cannot be confused for the
 * original.
 *
 * Throws whatever `better-sqlite3` throws on an unreadable file; the caller owns
 * that sentence (the backfill script has one, in its own voice).
 */
export function schemaDelta(dbPath: string): MigrationDelta {
  // The pid is in the name so that a *leak* check can be scoped to one process.
  // The tests assert that no `klatch-schema-delta-*` file survives a call, and
  // vitest's default pool is forks sharing one tmpdir: with a bare UUID, three
  // test files calling this concurrently each see the other two's in-flight
  // scratch copies and the assertion fires on a leak that is not theirs. Found by
  // adding the third file, not by reasoning about the first two.
  const scratch = path.join(os.tmpdir(), `klatch-schema-delta-${process.pid}-${randomUUID()}.db`);
  let db: Database.Database | undefined;
  try {
    fs.copyFileSync(dbPath, scratch);
    db = new Database(scratch);
    // `getDb()` sets both of these before applying the schema. The WAL pragma is
    // itself a write, which is one more reason this runs on a copy; the
    // `foreign_keys` one matters because the `messages` rebuild toggles it and
    // restores it to whatever it found.
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    const before = census(db);
    const rowsBefore = countRows(db, before);
    // Read on this connection, so the baseline is whatever the two pragmas above
    // did (nothing, to rows) rather than assumed to be zero.
    const writesBefore = totalChanges(db);
    applySchema(db);
    const after = census(db);
    const rowsAfter = countRows(db, after);
    const rowWrites = totalChanges(db) - writesBefore;
    const rows = diffRows(rowsBefore, rowsAfter);
    return {
      ...diffCensus(before, after),
      // Both measured quantities, not just the one. `rowWrites` cannot see a
      // `DROP TABLE` — it is DDL — so on a net removal `rows` is the only key with
      // anything in it, and keying `empty` on `rowWrites` alone threw it away.
      data: { rows, rowWrites, empty: rowWrites === 0 && Object.keys(rows).length === 0 },
    };
  } finally {
    db?.close();
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(scratch + suffix, { force: true });
  }
}

/**
 * The delta as lines for an operator, or `undefined` when there is nothing to
 * say. Returned rather than printed so the caller owns the stream and the
 * surrounding sentences.
 */
export function describeSchemaDelta(delta: SchemaDelta, dbPath: string): string | undefined {
  if (delta.empty) return undefined;
  const lines: string[] = [];
  // "behind the current schema … upgrades it in place" was the only shape this
  // block was written for, and a net *removal* makes every word of it false: the
  // database is not behind, and the change is not an upgrade. `droppedObjects`
  // arrived with a case the old header could not describe, so the header moved
  // too — a new key whose prose still says "gain" discloses the wrong thing in a
  // confident voice.
  const dropping = delta.droppedObjects.length > 0;
  lines.push(
    dropping
      ? `SCHEMA: this database does not match the current schema, and opening it for writing`
      : `SCHEMA: this database is behind the current schema, and opening it for writing`
  );
  lines.push(
    dropping
      ? `  changes it in place. ${path.basename(dbPath)} would lose:`
      : `  upgrades it in place. ${path.basename(dbPath)} would gain:`
  );
  if (dropping) {
    lines.push(
      `    ${delta.droppedObjects.length} object(s) dropped outright: ${delta.droppedObjects.join(', ')}`
    );
    lines.push(
      `      A dropped table takes every row it holds with it, and every index on it. The`
    );
    lines.push(
      `      migration does not put them back, and afterwards this file cannot be told from one`
    );
    lines.push(`      that never had them. Any row count below is net of that loss.`);
  }
  if (
    dropping &&
    (delta.addedObjects.length ||
      delta.addedColumns.length ||
      delta.rebuiltTables.length ||
      delta.alteredTables.length)
  ) {
    lines.push(`  …and would gain:`);
  }
  if (delta.addedObjects.length) {
    lines.push(`    ${delta.addedObjects.length} new object(s): ${delta.addedObjects.join(', ')}`);
  }
  if (delta.addedColumns.length) {
    lines.push(`    ${delta.addedColumns.length} new column(s): ${delta.addedColumns.join(', ')}`);
  }
  if (delta.rebuiltTables.length) {
    lines.push(
      `    ${delta.rebuiltTables.length} table(s) rebuilt, not altered in place: ${delta.rebuiltTables.join(', ')}`
    );
    lines.push(
      `      A rebuild rewrites every row of that table. The file grows and the space the old`
    );
    lines.push(
      `      pages held is left as slack inside it — expect a larger file than the data needs.`
    );
  }
  if (delta.alteredTables.length) {
    lines.push(
      `    ${delta.alteredTables.length} table(s) with a changed constraint and no changed column: ${delta.alteredTables.join(', ')}`
    );
    lines.push(
      `      Same columns in the same order, different CREATE TABLE text. Reached by a rebuild, so`
    );
    lines.push(`      every row of that table is rewritten for a change you cannot see in a column list.`);
  }
  // Conditional, because in the cell that routed this it was simply false. A
  // drop-and-recreate fires `rebuiltTables`, so the block above printed and the
  // operator was told "every existing row survives this" over a run that emptied
  // the table. The sentence is true of an append and of a rebuild; it is not true
  // of a removal, and there is no version of it that covers both.
  if (dropping) {
    lines.push(
      `  Rows in the objects above do NOT survive this. Nor does the file's value as a record of`
    );
    lines.push(`  an older schema. Pass --no-migrate to refuse instead of changing it.`);
  } else {
    // This read "Every existing row survives this" — a claim about **rows**, made
    // by a block whose input carries no row information at all. Driven against
    // the drop-and-recreate cell it was simply false: this block printed the
    // survival promise while the ROWS block, two paragraphs down the same stdout,
    // printed `-1 message_artifacts`. One file, one run, two contradicting
    // sentences. Found by this unit's own post-cure drive of the arm that routed
    // it, after the §3 guard started letting the ROWS block speak.
    //
    // The cure is not a better promise, it is no promise: the only honest thing a
    // schema-shaped delta can say about rows is where to look.
    lines.push(
      `  A change to the container is not by itself a change to the rows. The ROWS block says what`
    );
    lines.push(
      `  moves, and no ROWS block means nothing moves. What does not survive either way is the`
    );
    lines.push(
      `  file's value as a record of an older schema: restore it later to ask what the schema`
    );
    lines.push(
      `  looked like then and you get today's answer. Pass --no-migrate to refuse instead of`
    );
    lines.push(`  upgrading.`);
  }
  return lines.join('\n');
}

/**
 * The migration's **row** movement as lines for an operator, or `undefined` when
 * no row moves either way.
 *
 * Deliberately a separate block from `describeSchemaDelta`, and a separate
 * sentence in the refusal: the two are independent, and the case that routed this
 * work is a database with **no** schema delta at all, where this is the only
 * honest disclosure there is. Either block has to stand alone.
 *
 * Counts, never ids. Two of the writing sites mint `randomUUID()`, so the ids on
 * the temp copy are not the ids the real run will write — the *number* transfers
 * and the identity does not, and printing one would be a specific false claim
 * where "+1 row" is a true general one.
 */
export function describeDataDelta(data: DataDelta, dbPath: string): string | undefined {
  if (data.empty) return undefined;
  const lines: string[] = [];
  const added = Object.values(data.rows).reduce((a, b) => a + (b > 0 ? b : 0), 0);
  // The losses, as a positive number. `added` sums positives only, which is right
  // for its own job — it is compared against `rowWrites` to separate rewrites from
  // gains — but it meant a net *loss* summed to zero and every sentence below read
  // as though nothing had moved.
  const lost = Object.values(data.rows).reduce((a, b) => a + (b < 0 ? -b : 0), 0);
  // Three openings, because "also writes rows to it" is false of a run that only
  // removes them, and this block's whole job is to be the sentence an operator can
  // act on.
  lines.push(
    lost && data.rowWrites
      ? `ROWS: opening this database for writing writes rows to it and removes others. The migration would`
      : lost
        ? `ROWS: opening this database for writing removes rows from it. The migration would`
        : `ROWS: opening this database for writing also writes rows to it. The migration would`
  );
  lines.push(`  change ${path.basename(dbPath)} like this:`);
  const named = Object.entries(data.rows)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([table, n]) => `${n > 0 ? '+' : ''}${n} ${table}`);
  lines.push(
    named.length
      ? `    ${named.join(', ')}`
      : `    no table changes how many rows it holds — every write below is a rewrite`
  );
  lines.push(`    ${data.rowWrites} row write(s) in total`);
  if (lost) {
    lines.push(
      `      ${lost} row(s) are lost, not written. A row that goes because its table goes is not`
    );
    lines.push(
      `      counted as a write — total_changes() does not see DDL — so the count above can be 0`
    );
    lines.push(`      while rows are still leaving the file.`);
  }
  if (data.rowWrites > added) {
    lines.push(
      `      More writes than rows gained, so ${data.rowWrites - added} row(s) are rewritten rather`
    );
    lines.push(
      `      than added: a table rebuild moves every row it holds, and the migration also rewrites`
    );
    lines.push(`      legacy model ids in place where it finds them, changing no count at all.`);
  }
  lines.push(
    `  These are the migration's own ${lost ? 'changes' : 'writes'}, not this tool's plan. They happen on the way in, to any`
  );
  lines.push(
    `  database opened for writing, and a run that moves no channel still performs them. Pass`
  );
  lines.push(
    `  --no-migrate to refuse the run rather than let it ${lost ? 'make them' : 'write them'}.`
  );
  return lines.join('\n');
}
