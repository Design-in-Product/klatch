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
 * The four sites, all in `runMigrations`:
 *
 * 1. the `MODEL_ALIASES` loop — `UPDATE channels/messages SET model`, **in
 *    place**, so no row count moves;
 * 2. the `message_artifacts` → `files` + `file_refs` backfill — two `INSERT`s per
 *    `type='file'` artifact not yet in `files`, ids minted with `randomUUID()`;
 * 3. the default-entity `INSERT`, when `DEFAULT_ENTITY_ID` is absent;
 * 4. `INSERT INTO channel_entities (…, DEFAULT_ENTITY_ID)` for every channel with
 *    no entity row — a tool whose job is moving bindings *off* the default
 *    creating bindings *to* it, as a side effect of opening the file.
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
  /** True when the migration writes no row at all. */
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
    addedColumns,
    rebuiltTables,
    alteredTables,
    empty:
      addedObjects.length === 0 &&
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
 * which is the point, given that the hand-written list of them came out three
 * short.
 */
function totalChanges(db: Database.Database): number {
  return db.prepare('SELECT total_changes()').pluck().get() as number;
}

function diffRows(
  before: Record<string, number>,
  after: Record<string, number>
): Record<string, number> {
  const rows: Record<string, number> = {};
  for (const table of Object.keys(after)) {
    const net = after[table]! - (before[table] ?? 0);
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
  const scratch = path.join(os.tmpdir(), `klatch-schema-delta-${randomUUID()}.db`);
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
    return {
      ...diffCensus(before, after),
      data: { rows: diffRows(rowsBefore, rowsAfter), rowWrites, empty: rowWrites === 0 },
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
  lines.push(`SCHEMA: this database is behind the current schema, and opening it for writing`);
  lines.push(`  upgrades it in place. ${path.basename(dbPath)} would gain:`);
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
  lines.push(
    `  Every existing row survives this. What does not survive is the file's value as a record`
  );
  lines.push(
    `  of an older schema: restore it later to ask what the schema looked like then and you get`
  );
  lines.push(`  today's answer. Pass --no-migrate to refuse instead of upgrading.`);
  return lines.join('\n');
}

/**
 * The migration's **row** writes as lines for an operator, or `undefined` when it
 * writes none.
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
  lines.push(`ROWS: opening this database for writing also writes rows to it. The migration would`);
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
    `  These are the migration's own writes, not this tool's plan. They happen on the way in, to any`
  );
  lines.push(
    `  database opened for writing, and a run that moves no channel still performs them. Pass`
  );
  lines.push(`  --no-migrate to refuse the run rather than let it write them.`);
  return lines.join('\n');
}
