/**
 * Round 465, the row half — `--no-migrate` passed three row writes.
 *
 * `round465-schema-delta.test.ts` covers what the migration does to the
 * *container*. Theseus's 2026-11-06 §4 found that this closed the schema hazard
 * and left the row one wide open: against a database **already at** the current
 * schema, `SchemaDelta.empty` is true, nothing is disclosed, `--no-migrate`
 * passes — and `runMigrations` still writes three rows on the way in, because it
 * has four row-writing sites and the census of them in `unit-465migrate` §7.2
 * named one.
 *
 * The cells below are built by the product's own `applySchema` and then seeded,
 * so "already at the current schema" means what the product means by it rather
 * than what this file remembers. `db/index.js` is deliberately **not** mocked:
 * the whole claim is that the measurement comes from the live migration code, and
 * a mocked `applySchema` would make every assertion here vacuous.
 *
 * The end-to-end arms — the real CLI, the real flags, a pristine March backup out
 * of git — are driven in `docs/research/unit-465rowdelta-2026-11-06/`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID, createHash } from 'crypto';
import { MODEL_ALIASES } from '@klatch/shared';
import { schemaDelta, describeDataDelta } from '../db/schema-delta.js';
import { applySchema } from '../db/index.js';

const made: string[] = [];
function tempDbPath(): string {
  const p = path.join(os.tmpdir(), `klatch-r465rows-${randomUUID()}.db`);
  made.push(p);
  return p;
}
afterEach(() => {
  for (const p of made.splice(0)) {
    for (const s of ['', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
  }
});

const sha = (p: string) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
/** This process's leftovers only — see the same helper in `round465-schema-delta.test.ts`. */
const strayCopies = () =>
  fs
    .readdirSync(os.tmpdir())
    .filter((f) => f.startsWith(`klatch-schema-delta-${process.pid}-`)).length;

/** A current-schema database, by the product's own path, with its sidecars folded in. */
function current(): string {
  const p = tempDbPath();
  const live = new Database(p);
  live.pragma('journal_mode = WAL');
  live.pragma('foreign_keys = ON');
  applySchema(live);
  live.pragma('wal_checkpoint(TRUNCATE)');
  live.close();
  for (const s of ['-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
  return p;
}

/** Seed one, without going near the module singleton. */
function edit(p: string, fn: (db: Database.Database) => void): void {
  const db = new Database(p);
  db.pragma('foreign_keys = ON');
  fn(db);
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  for (const s of ['-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
}

describe('schemaDelta — the rows the migration writes', () => {
  it('reports no row writes for a database with nothing pending', () => {
    // The non-vacuity cell. If this goes red, the refusal starts refusing every
    // run, which is a worse failure than the one it exists to cure.
    const p = current();
    const d = schemaDelta(p);
    expect(d.empty).toBe(true);
    expect(d.data).toEqual({ rows: {}, rowWrites: 0, empty: true });
    expect(describeDataDelta(d.data, p)).toBeUndefined();
  });

  it('counts the three rows a schema-current database still gains', () => {
    const p = current();
    edit(p, (db) => {
      // An unbound channel: the auto-assign site. The tool's whole job is moving
      // bindings off `default-entity`, and opening the file creates one to it.
      db.prepare(
        `INSERT INTO channels (id, name, system_prompt, source) VALUES ('ch', 'unbound', '', 'claude-code')`
      ).run();
      db.prepare(
        `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m', 'ch', 'user', 'hi', 'complete')`
      ).run();
      // A file artifact not yet in `files`: the files + file_refs backfill.
      db.prepare(
        `INSERT INTO message_artifacts (id, message_id, type, file_name, file_mime_type, file_size_bytes, file_storage_key)
         VALUES ('a', 'm', 'file', 'a.txt', 'text/plain', 3, 'storage/a.txt')`
      ).run();
    });

    const d = schemaDelta(p);
    // The schema is current, which is exactly why no schema key can see any of
    // this — `empty: true` here is not a claim that nothing happens.
    expect(d.empty).toBe(true);
    expect(d.data.rows).toEqual({ channel_entities: 1, files: 1, file_refs: 1 });
    expect(d.data.rowWrites).toBe(3);
    expect(d.data.empty).toBe(false);
  });

  it('sees an in-place UPDATE that no row count can', () => {
    // The cell a counts-only measurement is blind to, and the reason
    // `rowWrites` is the key rather than `rows`.
    const legacy = Object.keys(MODEL_ALIASES)[0];
    expect(legacy).toBeDefined();
    const p = current();
    edit(p, (db) => {
      db.prepare(
        `INSERT INTO channels (id, name, system_prompt, model, source) VALUES ('ch', 'legacy', '', ?, 'claude-code')`
      ).run(legacy);
      db.prepare(
        `INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch', 'default-entity')`
      ).run();
    });

    const d = schemaDelta(p);
    expect(d.empty).toBe(true);
    expect(d.data.rows).toEqual({}); // every count identical on both sides
    expect(d.data.rowWrites).toBe(1);
    expect(d.data.empty).toBe(false);
  });

  it('does not write to the database it is measuring', () => {
    const p = current();
    edit(p, (db) => {
      db.prepare(
        `INSERT INTO channels (id, name, system_prompt, source) VALUES ('ch', 'unbound', '', 'claude-code')`
      ).run();
    });
    const before = sha(p);
    const strays = strayCopies();
    const d = schemaDelta(p);
    expect(d.data.empty).toBe(false); // the measurement had something to find
    expect(sha(p)).toBe(before);
    expect(strayCopies()).toBe(strays);
  });
});

describe('describeDataDelta', () => {
  it('says nothing when no row is written', () => {
    expect(describeDataDelta({ rows: {}, rowWrites: 0, empty: true }, '/tmp/k.db')).toBeUndefined();
  });

  it('names the per-table counts, the total, and the flag', () => {
    const text = describeDataDelta(
      { rows: { channel_entities: 1, files: 1, file_refs: 1 }, rowWrites: 3, empty: false },
      '/tmp/klatch.db'
    );
    expect(text).toBeDefined();
    expect(text).toContain('klatch.db');
    expect(text).toContain('+1 channel_entities');
    expect(text).toContain('+1 file_refs');
    expect(text).toContain('3 row write(s)');
    expect(text).toContain('--no-migrate');
    // Nothing was rewritten here, so the rewrite sentence must be absent: it
    // would be a true-sounding claim about the migration that is false of this
    // run of it.
    expect(text).not.toContain('rewritten rather');
  });

  it('separates rows rewritten from rows gained', () => {
    // The March backup's shape: `messages` rebuilt, every row of it moved, not
    // one count anywhere changed. Reported as rows *added*, 2652 would be wrong
    // by three orders of magnitude.
    const text = describeDataDelta({ rows: {}, rowWrites: 2652, empty: false }, '/tmp/march.db');
    expect(text).toContain('2652 row write(s)');
    expect(text).toContain('2652 row(s) are rewritten rather');
    expect(text).toContain('no table changes how many rows it holds');
  });

  it('never prints a minted id, because the copy mints different ones', () => {
    // Two of the writing sites mint `randomUUID()`. The count transfers from the
    // temp copy to the real run; the identity does not.
    const text = describeDataDelta({ rows: { files: 1 }, rowWrites: 1, empty: false }, '/tmp/k.db');
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });
});
