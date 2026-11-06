/**
 * Round 465 — the backfill tool migrates the file it is pointed at.
 *
 * Theseus's 2026-11-05 §3: `--apply` against `backups/klatch.db.backup-2026-03-14`
 * upgraded a frozen March artefact to the November schema — 4 objects, 9 columns,
 * `messages` rebuilt, 5,230,592 → 9,449,472 bytes. Every row move was exact; the
 * file stopped being a record of an older schema. The cure is disclosure plus an
 * opt-out (`--no-migrate`), both keyed on a **measured** delta.
 *
 * These are the unit-level cells. The end-to-end arms are driven in
 * `docs/research/unit-465migrate-2026-11-06/`, which runs the real CLI against
 * copies of the real pre-apply blob out of git.
 *
 * Deliberately does **not** mock `db/index.js`: the whole claim is that the delta
 * comes from the live migration code rather than a list, so a mocked
 * `applySchema` would make every assertion below vacuous.
 */
import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { schemaDelta, describeSchemaDelta, diffCensus, type Census } from '../db/schema-delta.js';
// `setup.ts` mocks this module's `getDb` and forwards `applySchema` to the real
// implementation, which is the one these cells are about.
import { applySchema } from '../db/index.js';

const made: string[] = [];
function tempDbPath(): string {
  const p = path.join(os.tmpdir(), `klatch-r465-${randomUUID()}.db`);
  made.push(p);
  return p;
}
afterEach(() => {
  for (const p of made.splice(0)) {
    for (const s of ['', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
  }
});

const sha = (p: string) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');

/** The leftovers `schemaDelta` would be leaving behind if it leaked. */
const strayCopies = () =>
  fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('klatch-schema-delta')).length;

/**
 * A census from objects and columns, with the `CREATE TABLE` text a real table
 * would carry — derived from the column list so that an append changes the text
 * here exactly as it does on disk. Pass `sql` to say something the column list
 * cannot, which is the whole point of the constraint cell below.
 */
const cen = (
  objects: string[],
  cols: Record<string, string[]>,
  sql: Record<string, string> = {}
): Census => ({
  objects,
  cols,
  sql: Object.fromEntries(
    Object.keys(cols).map((t) => [t, sql[t] ?? `CREATE TABLE ${t} (${cols[t].join(', ')})`])
  ),
});

describe('diffCensus', () => {
  it('names a new table once, not once per column', () => {
    const d = diffCensus(
      cen(['table:a'], { a: ['id'] }),
      cen(['table:a', 'table:b'], { a: ['id'], b: ['id', 'name', 'when'] })
    );
    expect(d.addedObjects).toEqual(['table:b']);
    expect(d.addedColumns).toEqual([]);
    expect(d.empty).toBe(false);
  });

  it('reports an added column on an existing table', () => {
    const d = diffCensus(cen(['table:a'], { a: ['id'] }), cen(['table:a'], { a: ['id', 'extra'] }));
    expect(d.addedObjects).toEqual([]);
    expect(d.addedColumns).toEqual(['a.extra']);
    expect(d.rebuiltTables).toEqual([]);
  });

  // `ALTER TABLE ADD COLUMN` appends and nothing else, so an append is the only
  // shape that is *not* a rebuild. The cells below are the four ways the first
  // version of this key came back clean on a rebuild.
  it('an append is not a rebuild', () => {
    const d = diffCensus(
      cen(['table:a'], { a: ['id', 'b'] }),
      cen(['table:a'], { a: ['id', 'b', 'c'] })
    );
    expect(d.rebuiltTables).toEqual([]);
    expect(d.alteredTables).toEqual([]);
    expect(d.addedColumns).toEqual(['a.c']);
  });

  it('a column inserted in the middle is a rebuild, even though the survivors keep their order', () => {
    const d = diffCensus(
      cen(['table:a'], { a: ['id', 'b'] }),
      cen(['table:a'], { a: ['id', 'c', 'b'] })
    );
    expect(d.rebuiltTables).toEqual(['a']);
    expect(d.addedColumns).toEqual(['a.c']);
  });

  it('a surviving column moved to the end is a rebuild', () => {
    const d = diffCensus(
      cen(['table:a'], { a: ['id', 'created_at', 'b'] }),
      cen(['table:a'], { a: ['id', 'b', 'created_at'] })
    );
    expect(d.rebuiltTables).toEqual(['a']);
    expect(d.addedColumns).toEqual([]);
  });

  it('a dropped column is a rebuild, not an empty delta', () => {
    const d = diffCensus(
      cen(['table:a'], { a: ['id', 'gone'] }),
      cen(['table:a'], { a: ['id'] })
    );
    expect(d.rebuiltTables).toEqual(['a']);
    expect(d.empty).toBe(false);
  });

  it('a changed constraint with no changed column is not an empty delta', () => {
    const d = diffCensus(
      cen(['table:a'], { a: ['id', 'status'] }, {
        a: "CREATE TABLE a (id, status CHECK (status IN ('x')))",
      }),
      cen(['table:a'], { a: ['id', 'status'] }, {
        a: "CREATE TABLE a (id, status CHECK (status IN ('x', 'y')))",
      })
    );
    expect(d.alteredTables).toEqual(['a']);
    expect(d.addedColumns).toEqual([]);
    expect(d.rebuiltTables).toEqual([]);
    expect(d.empty).toBe(false);
  });

  it('is empty only when nothing at all moved', () => {
    const same = cen(['table:a'], { a: ['id'] });
    expect(diffCensus(same, same).empty).toBe(true);
  });
});

describe('schemaDelta', () => {
  it('is empty for a database already at the current schema', () => {
    const p = tempDbPath();
    // Built by the product's own path, so "current" means what the product
    // means by it rather than what this test remembers.
    const seed = new Database(p);
    seed.close();
    const first = schemaDelta(p);
    expect(first.empty).toBe(false); // an empty file needs the whole schema

    // Apply it for real, then ask again.
    const live = new Database(p);
    live.pragma('journal_mode = WAL');
    live.pragma('foreign_keys = ON');
    applySchema(live);
    live.close();

    expect(schemaDelta(p).empty).toBe(true);
    expect(describeSchemaDelta(schemaDelta(p), p)).toBeUndefined();
  });

  it('names exactly the one column a database is missing', () => {
    const p = tempDbPath();
    const live = new Database(p);
    applySchema(live);
    // Drop one column by rebuild — SQLite cannot drop it in place on every
    // version this project supports, and a rebuild is what the migration does
    // anyway.
    live.pragma('foreign_keys = OFF');
    live.exec(`
      CREATE TABLE projects_rebuild (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        instructions TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'native',
        source_metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO projects_rebuild SELECT id, name, instructions, source, source_metadata, created_at FROM projects;
      DROP TABLE projects;
      ALTER TABLE projects_rebuild RENAME TO projects;
    `);
    live.close();

    const d = schemaDelta(p);
    expect(d.addedColumns).toEqual(['projects.memory']);
    expect(d.addedObjects).toEqual([]);
    expect(d.rebuiltTables).toEqual([]);
    expect(d.empty).toBe(false);
  });

  /**
   * The cell the column keys cannot reach, driven on a real file rather than two
   * hand-written censuses: a database whose `messages` columns are exactly
   * current, in exactly the current order, carrying the three-value status
   * `CHECK` every database created before the `'incomplete'` migration has.
   * `applySchema` rebuilds that table and moves every row in it. Nothing about
   * the columns changes, so without `alteredTables` this file reads as already
   * current.
   */
  it('sees a rebuild whose only visible change is a constraint', () => {
    const p = tempDbPath();
    const live = new Database(p);
    applySchema(live);
    live.pragma('foreign_keys = OFF');

    /** Re-create `messages` from its own current text, minus `'incomplete'`. */
    const narrowTheCheck = () => {
      const current = (
        live
          .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'messages'`)
          .get() as { sql: string }
      ).sql;
      expect(current).toContain("'incomplete'");
      const narrowed = current.replace('messages', 'messages_old').replace(", 'incomplete'", '');
      expect(narrowed).not.toContain("'incomplete'");
      live.exec(`
        ${narrowed};
        INSERT INTO messages_old SELECT * FROM messages;
        DROP TABLE messages;
        ALTER TABLE messages_old RENAME TO messages;
      `);
    };

    // Twice, and the first time is not decoration. A *freshly created* database
    // carries `initSchema`'s column order, which is not the order the rebuild
    // produces — `created_at` ends up last — so narrowing the CHECK once leaves a
    // delta that is a genuine column move, and the cell would have passed on
    // `rebuiltTables` without exercising the new key at all. The first cycle
    // lets `applySchema` settle the table into *its own* order; the second
    // narrows the CHECK while keeping that order, which is the one state where
    // the columns say nothing and the constraint says everything.
    narrowTheCheck();
    applySchema(live);
    narrowTheCheck();
    live.close();

    const d = schemaDelta(p);
    expect(d.addedColumns).toEqual([]);
    expect(d.addedObjects).toEqual([]);
    expect(d.rebuiltTables).toEqual([]);
    expect(d.alteredTables).toEqual(['messages']);
    expect(d.empty).toBe(false);
    expect(describeSchemaDelta(d, p)).toContain('changed constraint');
  });

  it('does not write to the database it is asked about, and leaves no copy behind', () => {
    const p = tempDbPath();
    const live = new Database(p);
    applySchema(live);
    live.close();
    // Drop a table so there is something for the probe to find — a delta of
    // nothing would make this cell pass whatever the probe did.
    const d0 = new Database(p);
    d0.exec('DROP TABLE file_refs');
    d0.close();
    for (const s of ['-wal', '-shm']) fs.rmSync(p + s, { force: true });

    const before = sha(p);
    const strayBefore = strayCopies();
    const d = schemaDelta(p);
    expect(d.addedObjects).toContain('table:file_refs');
    expect(sha(p)).toBe(before);
    expect(strayCopies()).toBe(strayBefore);
  });

  it('describes a rebuild in a sentence that mentions slack, not just the table', () => {
    const text = describeSchemaDelta(
      {
        addedObjects: ['table:files'],
        addedColumns: ['messages.stop_reason'],
        rebuiltTables: ['messages'],
        alteredTables: [],
        empty: false,
      },
      '/tmp/klatch.db.backup-2026-03-14'
    );
    expect(text).toBeDefined();
    expect(text).toContain('klatch.db.backup-2026-03-14');
    expect(text).toContain('table:files');
    expect(text).toContain('messages.stop_reason');
    expect(text).toContain('rebuilt');
    expect(text).toContain('slack');
    // The line an operator needs in order to act on it.
    expect(text).toContain('--no-migrate');
  });
});
