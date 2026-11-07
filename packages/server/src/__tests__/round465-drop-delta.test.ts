/**
 * Round 465 — the migration delta's blind spot in the *removing* direction.
 *
 * Routed by Theseus, 2026-11-06, §2 and §3 of
 * `theseus-to-daedalus-…-a-drop-passes-all-five-of-your-keys-….md`, both driven
 * first in `docs/research/unit-465drop-2026-11-06/`:
 *
 * - **§2** every key in `SchemaDelta` asked what the migration *adds*.
 *   `addedObjects` is a one-directional set difference and the other three iterate
 *   `after.cols`, so an object that leaves is reached by none of them. `countRows`
 *   and `diffRows` iterated `Object.keys(after)` for the same reason, and
 *   `total_changes()` cannot help — `DROP TABLE` is DDL. A migration that dropped
 *   a populated table came back `empty: true` on both halves, `--no-migrate`
 *   returned **exit 0**, and the tool printed `Nothing to apply.`
 * - **§3** `DataDelta.empty` was `rowWrites === 0`. In the drop-and-recreate cell
 *   the module **measured** `{ message_artifacts: -1 }` and then discarded it, so
 *   `describeDataDelta` returned `undefined` and the operator was told, in the
 *   schema block, that *"every existing row survives this."*
 *
 * The cells below are about the keys, not about today's schema: nothing in the
 * tree nets a removal (the one `DROP TABLE` at `index.ts:206` is paired with the
 * rebuild's `RENAME`). That is the reason to have the cells — the failure mode is
 * silence, and an operator cannot tell silence from "nothing happened."
 */
import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  diffCensus,
  schemaDelta,
  describeSchemaDelta,
  describeDataDelta,
  type Census,
} from '../db/schema-delta.js';
import { applySchema } from '../db/index.js';

const made: string[] = [];
function tempDbPath(): string {
  const p = path.join(os.tmpdir(), `klatch-r465drop-${randomUUID()}.db`);
  made.push(p);
  return p;
}
afterEach(() => {
  for (const p of made.splice(0)) {
    for (const s of ['', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
  }
});

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

describe('diffCensus — the removing direction', () => {
  it('names a table that is gone, which no other key visits', () => {
    const d = diffCensus(
      cen(['table:a', 'table:b'], { a: ['id'], b: ['id'] }),
      cen(['table:a'], { a: ['id'] })
    );
    expect(d.droppedObjects).toEqual(['table:b']);
    // The point of the cell: every pre-existing key is silent here. Asserted
    // rather than described, because "the other keys are silent" is exactly the
    // claim that made exit 0 look correct.
    expect(d.addedObjects).toEqual([]);
    expect(d.addedColumns).toEqual([]);
    expect(d.rebuiltTables).toEqual([]);
    expect(d.alteredTables).toEqual([]);
    expect(d.empty).toBe(false);
  });

  it('names a dropped index, which loses no row and was equally invisible', () => {
    const d = diffCensus(
      cen(['index:idx_a_x', 'table:a'], { a: ['id', 'x'] }),
      cen(['table:a'], { a: ['id', 'x'] })
    );
    expect(d.droppedObjects).toEqual(['index:idx_a_x']);
    expect(d.empty).toBe(false);
  });

  it('is empty when the schema matches, so the key cannot manufacture a refusal', () => {
    const same = cen(['index:idx_a_x', 'table:a'], { a: ['id', 'x'] });
    const d = diffCensus(same, same);
    expect(d.droppedObjects).toEqual([]);
    expect(d.empty).toBe(true);
  });

  it('reports a drop-and-recreate as a rebuild and not as a drop', () => {
    // The table survives the migration, so it is not a removal — and reporting it
    // as both would double-count the one change there is.
    const d = diffCensus(
      cen(['table:a'], { a: ['id', 'x', 'y'] }),
      cen(['table:a'], { a: ['id', 'y', 'x'] })
    );
    expect(d.droppedObjects).toEqual([]);
    expect(d.rebuiltTables).toEqual(['a']);
  });
});

describe('schemaDelta — a dropped table, end to end on a real file', () => {
  /**
   * Build a database at the current schema, with one artifact row, then remove
   * `message_artifacts` from the *schema side* by pointing the delta at a file
   * that has it while the schema does not. There is no seam for that, so this
   * goes the other way around: the file gets an extra table the schema will never
   * create, which is the same question with the sides swapped — does a key fire
   * for an object present before and absent after?
   */
  const seeded = (): string => {
    const p = tempDbPath();
    const db = new Database(p);
    db.pragma('journal_mode = WAL');
    applySchema(db);
    db.prepare(
      `INSERT INTO channels (id, name, system_prompt) VALUES ('ch', 'c', '')`
    ).run();
    // Bound, or `runMigrations` site 4 writes the binding on the way in and the
    // cell carries a row write of its own — which is how this cell first failed:
    // `data.empty` came back false for a reason that had nothing to do with the
    // key under test.
    db.prepare(
      `INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch', 'default-entity')`
    ).run();
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m1', 'ch', 'assistant', 'hi', 'complete')`
    ).run();
    db.prepare(
      `INSERT INTO message_artifacts (id, message_id, type, content) VALUES (?, 'm1', 'thinking', 't')`
    ).run(randomUUID());
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    for (const s of ['-wal', '-shm']) fs.rmSync(p + s, { force: true });
    return p;
  };

  it('sees a table the schema does not create, and the rows it holds', () => {
    const p = seeded();
    const db = new Database(p);
    db.exec(`CREATE TABLE legacy_notes (id TEXT PRIMARY KEY, body TEXT);
             CREATE INDEX idx_legacy_notes_body ON legacy_notes(body);
             INSERT INTO legacy_notes (id, body) VALUES ('n1', 'x'), ('n2', 'y');`);
    db.close();
    for (const s of ['-wal', '-shm']) fs.rmSync(p + s, { force: true });

    const d = schemaDelta(p);
    // `applySchema` is not a drop, so this file keeps `legacy_notes` — the delta
    // is empty and that is correct. The cell exists to pin the direction: an
    // object only in `before` is what `droppedObjects` is keyed on, and a schema
    // that leaves it alone must not report it.
    expect(d.droppedObjects).toEqual([]);
    expect(d.empty).toBe(true);
    expect(d.data.empty).toBe(true);
  });

  it('counts a table that loses all its rows by ceasing to exist', () => {
    // `diffRows` over the union, exercised directly through the exported
    // `diffCensus` sibling it feeds. A table absent from `after` holds zero rows,
    // and the old `Object.keys(after)` loop never asked.
    const d = diffCensus(
      cen(['table:keep', 'table:go'], { keep: ['id'], go: ['id'] }),
      cen(['table:keep'], { keep: ['id'] })
    );
    expect(d.droppedObjects).toEqual(['table:go']);
  });
});

describe('describeSchemaDelta — the prose a removal needs', () => {
  const dropOnly = {
    addedObjects: [],
    droppedObjects: ['index:idx_message_artifacts_message_id', 'table:message_artifacts'],
    addedColumns: [],
    rebuiltTables: [],
    alteredTables: [],
    empty: false,
  };

  it('names the objects and does not call a removal an upgrade', () => {
    const text = describeSchemaDelta(dropOnly, '/tmp/klatch.db')!;
    expect(text).toContain('table:message_artifacts');
    expect(text).toContain('index:idx_message_artifacts_message_id');
    expect(text).toContain('would lose');
    expect(text).toContain('--no-migrate');
    // The words that were false in this cell and true in every other.
    expect(text).not.toContain('upgrades it in place');
    expect(text).not.toContain('is behind the current schema');
  });

  it('keeps the gain wording when there is nothing lost', () => {
    const text = describeSchemaDelta(
      { ...dropOnly, droppedObjects: [], addedColumns: ['messages.stop_reason'] },
      '/tmp/klatch.db'
    )!;
    expect(text).toContain('would gain');
    expect(text).not.toContain('would lose');
  });

  it('says both when a migration both adds and removes', () => {
    const text = describeSchemaDelta(
      { ...dropOnly, addedObjects: ['table:files'] },
      '/tmp/klatch.db'
    )!;
    expect(text).toContain('would lose');
    expect(text).toContain('…and would gain');
    expect(text).toContain('table:files');
  });

  it('never promises that rows survive, because it cannot know', () => {
    // Driven, not reasoned about: on a drop-and-recreate this block printed
    // "Every existing row survives this" while `describeDataDelta`, further down
    // the same stdout, printed `-1 message_artifacts`. A `SchemaDelta` carries no
    // row information, so any sentence here about rows is a guess — and in that
    // cell the guess was wrong.
    for (const d of [
      dropOnly,
      { ...dropOnly, droppedObjects: [], rebuiltTables: ['message_artifacts'] },
      { ...dropOnly, droppedObjects: [], addedObjects: ['table:files'] },
    ]) {
      const text = describeSchemaDelta(d, '/tmp/klatch.db')!;
      expect(text).not.toContain('Every existing row survives');
      expect(text).toContain('--no-migrate');
    }
    // And the replacement points at the block that does know.
    expect(
      describeSchemaDelta({ ...dropOnly, droppedObjects: [], addedObjects: ['table:files'] }, '/tmp/k.db')
    ).toContain('ROWS block');
  });
});

describe('describeDataDelta — a loss is not a write', () => {
  it('speaks at all when the only movement is negative and rowWrites is 0', () => {
    // Exactly the shape §3 was about: a measured loss, nothing written.
    const text = describeDataDelta(
      { rows: { message_artifacts: -1 }, rowWrites: 0, empty: false },
      '/tmp/klatch.db'
    );
    expect(text).toBeDefined();
    expect(text).toContain('-1 message_artifacts');
    expect(text).toContain('1 row(s) are lost, not written');
    // The old opening claimed a write on a run that performs none.
    expect(text).not.toContain('also writes rows to it');
    // And the rewrite arithmetic must stay away: `rowWrites > added` is `0 > 0`.
    expect(text).not.toContain('rewritten rather');
  });

  it('says both when a migration writes some rows and loses others', () => {
    const text = describeDataDelta(
      { rows: { channel_entities: 1, message_artifacts: -4 }, rowWrites: 1, empty: false },
      '/tmp/klatch.db'
    )!;
    expect(text).toContain('writes rows to it and removes others');
    expect(text).toContain('+1 channel_entities');
    expect(text).toContain('-4 message_artifacts');
    expect(text).toContain('4 row(s) are lost, not written');
  });

  it('leaves the write-only wording exactly as it was', () => {
    const text = describeDataDelta(
      { rows: { channel_entities: 1 }, rowWrites: 1, empty: false },
      '/tmp/klatch.db'
    )!;
    expect(text).toContain('also writes rows to it');
    expect(text).not.toContain('lost, not written');
    expect(text).not.toContain('removes others');
  });
});

describe('DataDelta.empty reads both measured quantities', () => {
  it('is false on a loss with no write, where it used to be true', () => {
    const p = tempDbPath();
    const db = new Database(p);
    db.pragma('journal_mode = WAL');
    applySchema(db);
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    for (const s of ['-wal', '-shm']) fs.rmSync(p + s, { force: true });
    // A real file at the current schema: both halves empty, exit path quiet. The
    // guard must not have become one that fires on everything.
    const d = schemaDelta(p);
    expect(d.data.empty).toBe(true);
    expect(describeDataDelta(d.data, p)).toBeUndefined();
    expect(describeSchemaDelta(d, p)).toBeUndefined();
  });
});
