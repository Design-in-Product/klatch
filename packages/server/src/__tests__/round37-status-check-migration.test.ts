/**
 * Round 37 — the `messages.status` CHECK-constraint rebuild.
 *
 * `'incomplete'` needs the status CHECK widened, and SQLite cannot alter a
 * CHECK in place. Every database created before this change — including the
 * real one, with thousands of messages in it — carries the three-value
 * version, so without a table rebuild the first truncated response throws a
 * constraint error instead of being recorded.
 *
 * A rebuild drops and recreates a table holding real conversation history, so
 * it gets tested against an actually-legacy database rather than the current
 * schema. This file deliberately does NOT use the shared in-memory harness:
 * `setup.ts` mocks the db module away and builds today's schema, which is the
 * one shape that cannot exercise this path. It uses `importActual` against a
 * real file on disk instead.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';

let tempDir: string;
let dbPath: string;
const originalDbEnv = process.env.KLATCH_DB;

/**
 * A database as it existed before this change: the three-value status CHECK,
 * no `stop_reason`, and every message column the later migrations added.
 */
function createLegacyDb(file: string) {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      system_prompt TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'streaming', 'error')),
      model TEXT,
      entity_id TEXT,
      original_timestamp TEXT,
      original_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE message_artifacts (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      tool_name TEXT,
      input_summary TEXT,
      content TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO channels (id, name) VALUES ('ch-1', 'imported conversation');

    INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, original_id, created_at)
    VALUES
      ('m-1', 'ch-1', 'user', 'an old question', 'complete', NULL, NULL, 'orig-1', '2026-01-01T00:00:00.000Z'),
      ('m-2', 'ch-1', 'assistant', 'an old answer', 'complete', 'claude-opus-4-6', 'ent-1', 'orig-2', '2026-01-01T00:00:01.000Z'),
      ('m-3', 'ch-1', 'assistant', 'a failure', 'error', NULL, NULL, NULL, '2026-01-01T00:00:02.000Z');

    INSERT INTO message_artifacts (id, message_id, type, tool_name)
    VALUES ('a-1', 'm-2', 'tool_use', 'Read');
  `);
  db.close();
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-migration-'));
  dbPath = path.join(tempDir, 'klatch.db');
  process.env.KLATCH_DB = dbPath;
  vi.resetModules();
});

afterEach(() => {
  if (originalDbEnv === undefined) delete process.env.KLATCH_DB;
  else process.env.KLATCH_DB = originalDbEnv;
  fs.rmSync(tempDir, { recursive: true, force: true });
});

/** The real db module, bypassing setup.ts's mock, bound to the temp file. */
async function openWithMigrations() {
  const mod = await vi.importActual<typeof import('../db/index.js')>('../db/index.js');
  return mod.getDb();
}

describe('messages.status CHECK rebuild', () => {
  it('widens the constraint so an incomplete message can be written', async () => {
    createLegacyDb(dbPath);

    // Precondition: prove the legacy database really does reject 'incomplete',
    // so a passing test below is evidence of the migration and not of a
    // constraint that was never there.
    const legacy = new Database(dbPath);
    expect(() =>
      legacy.prepare(`UPDATE messages SET status = 'incomplete' WHERE id = 'm-2'`).run()
    ).toThrow();
    legacy.close();

    const db = await openWithMigrations();
    expect(() =>
      db.prepare(`UPDATE messages SET status = ?, stop_reason = ? WHERE id = ?`)
        .run('incomplete', 'max_tokens', 'm-2')
    ).not.toThrow();

    const row = db.prepare(`SELECT status, stop_reason FROM messages WHERE id = 'm-2'`).get() as any;
    expect(row.status).toBe('incomplete');
    expect(row.stop_reason).toBe('max_tokens');
  });

  it('preserves every existing row and column value through the rebuild', async () => {
    createLegacyDb(dbPath);
    const db = await openWithMigrations();

    const rows = db.prepare('SELECT * FROM messages ORDER BY created_at').all() as any[];
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.id)).toEqual(['m-1', 'm-2', 'm-3']);

    const answer = rows[1];
    expect(answer.content).toBe('an old answer');
    expect(answer.status).toBe('complete');
    expect(answer.model).toBe('claude-opus-4-6');
    expect(answer.entity_id).toBe('ent-1');
    expect(answer.original_id).toBe('orig-2');
    expect(answer.created_at).toBe('2026-01-01T00:00:01.000Z');
    // Pre-existing statuses are untouched — this is additive, not a
    // reclassification of anything already recorded.
    expect(rows[2].status).toBe('error');
  });

  /**
   * The rebuild drops the table `message_artifacts` cascades from. With foreign
   * keys left on, that DROP would take the artifacts with it — silently
   * deleting tool-use and thinking history attached to imported conversations.
   */
  it('does not cascade-delete message_artifacts', async () => {
    createLegacyDb(dbPath);
    const db = await openWithMigrations();

    const artifacts = db.prepare('SELECT * FROM message_artifacts').all() as any[];
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].message_id).toBe('m-2');
    expect(artifacts[0].tool_name).toBe('Read');

    // And the relationship still resolves after the rename.
    const joined = db.prepare(
      `SELECT m.content FROM message_artifacts a JOIN messages m ON m.id = a.message_id`
    ).get() as any;
    expect(joined.content).toBe('an old answer');
  });

  it('leaves foreign keys enabled and satisfied afterwards', async () => {
    createLegacyDb(dbPath);
    const db = await openWithMigrations();

    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(db.pragma('foreign_key_check')).toHaveLength(0);
  });

  it('is a no-op on a database that already has the widened constraint', async () => {
    createLegacyDb(dbPath);
    // First open migrates.
    const first = await openWithMigrations();
    first.prepare(`UPDATE messages SET status = 'incomplete' WHERE id = 'm-3'`).run();
    first.close();

    // Second open must not rebuild again, and must not disturb the rows.
    vi.resetModules();
    const second = await openWithMigrations();
    const rows = second.prepare('SELECT id, status FROM messages ORDER BY created_at').all() as any[];
    expect(rows).toHaveLength(3);
    expect(rows[2].status).toBe('incomplete');

    // There should be exactly one messages table and no leftover scratch table.
    const tables = second.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'messages%'`
    ).all() as any[];
    expect(tables.map((t) => t.name)).toEqual(['messages']);
  });
});
