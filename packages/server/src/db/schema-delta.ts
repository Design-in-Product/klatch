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
export function schemaDelta(dbPath: string): SchemaDelta {
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
    applySchema(db);
    const after = census(db);
    return diffCensus(before, after);
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
