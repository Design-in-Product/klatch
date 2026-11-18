import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';
import { applySchema } from '../../../packages/server/src/db/index.js';
import { DEFAULT_MODEL, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

/**
 * unit-478migrationarm — arm.
 *
 * Rebuilds each of migration.test.ts's ten "Step 8"/"Phase 2" scenarios on a
 * legacy base, then calls the REAL exported `applySchema` in place of the
 * hand-typed `ALTER TABLE`/nothing the tracked file currently runs. Every
 * assertion below is copied verbatim from the tracked arm — a refutation has
 * to show up as a red `expect`, not as something reasoned about from reading
 * the migration's source.
 *
 * "Legacy base" means the oldest column set `initSchema` has always shipped
 * (system_prompt included — see P2), with only the column(s) the scenario is
 * about left off, so `applySchema` is simulating a real pre-migration
 * upgrade rather than an invented one.
 */

describe('unit-478migrationarm — pointing the ten simulated arms at the real applySchema', () => {
  // ── Step 8 import schema — channels (originals 1-3) ──────────────

  function legacyChannelsDb(): Database.Database {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        system_prompt TEXT NOT NULL DEFAULT '',
        model TEXT NOT NULL DEFAULT '${DEFAULT_MODEL}',
        mode TEXT NOT NULL DEFAULT '${DEFAULT_INTERACTION_MODE}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    return db;
  }

  it('[orig 1] adds source column to channels table', () => {
    const db = legacyChannelsDb();
    applySchema(db);
    const cols = db.prepare('PRAGMA table_info(channels)').all() as { name: string }[];
    expect(cols.some((c) => c.name === 'source')).toBe(true);
    db.close();
  });

  it('[orig 2] adds source_metadata column to channels table', () => {
    const db = legacyChannelsDb();
    applySchema(db);
    const cols = db.prepare('PRAGMA table_info(channels)').all() as { name: string }[];
    expect(cols.some((c) => c.name === 'source_metadata')).toBe(true);
    db.close();
  });

  it('[orig 3 / P1] source column defaults to NULL for existing channels -- registered to REFUTE', () => {
    const db = legacyChannelsDb();
    db.exec("INSERT INTO channels (id, name) VALUES ('test-ch', 'test')");
    applySchema(db);
    const row = db.prepare("SELECT source FROM channels WHERE id = 'test-ch'").get() as {
      source: string | null;
    };
    // Original assertion, unedited:
    expect(row.source).toBeNull();
    db.close();
  });

  it('[P1, other direction] what the real migration actually backfills existing rows with', () => {
    const db = legacyChannelsDb();
    db.exec("INSERT INTO channels (id, name) VALUES ('test-ch', 'test')");
    applySchema(db);
    const row = db.prepare("SELECT source FROM channels WHERE id = 'test-ch'").get() as {
      source: string | null;
    };
    expect(row.source).toBe('native');
    db.close();
  });

  // ── Step 8 import schema — messages (originals 4-6) ───────────────

  function legacyMessagesDb(): Database.Database {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
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
        status TEXT NOT NULL DEFAULT 'complete',
        model TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO channels (id, name) VALUES ('ch-1', 'test');
    `);
    return db;
  }

  it('[orig 4] adds original_timestamp column to messages table', () => {
    const db = legacyMessagesDb();
    applySchema(db);
    const cols = db.prepare('PRAGMA table_info(messages)').all() as { name: string }[];
    expect(cols.some((c) => c.name === 'original_timestamp')).toBe(true);
    db.close();
  });

  it('[orig 5] adds original_id column to messages table', () => {
    const db = legacyMessagesDb();
    applySchema(db);
    const cols = db.prepare('PRAGMA table_info(messages)').all() as { name: string }[];
    expect(cols.some((c) => c.name === 'original_id')).toBe(true);
    db.close();
  });

  it('[orig 6] original_timestamp preserves imported event time', () => {
    const db = legacyMessagesDb();
    applySchema(db);
    const originalTs = '2026-01-15T10:00:00.000Z';
    db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, original_timestamp, original_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('msg-1', 'ch-1', 'user', 'hello', originalTs, 'evt-001');
    const row = db.prepare("SELECT original_timestamp, original_id FROM messages WHERE id = 'msg-1'").get() as {
      original_timestamp: string;
      original_id: string;
    };
    expect(row.original_timestamp).toBe(originalTs);
    expect(row.original_id).toBe('evt-001');
    db.close();
  });

  // ── Step 8 import schema — message_artifacts (originals 7-9) ─────

  // The tracked file's base here is channels(id, name, created_at) -- no
  // system_prompt. P2 predicts THAT base crashes under the real applySchema.
  function trackedLegacyArtifactsDb(): Database.Database {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'complete',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO channels (id, name) VALUES ('ch-1', 'test');
    `);
    return db;
  }

  it('[P2] the tracked file\'s legacy base (no channels.system_prompt) throws under the real applySchema', () => {
    const db = trackedLegacyArtifactsDb();
    expect(() => applySchema(db)).toThrow(/system_prompt/);
    db.close();
  });

  // Minimum legacy base needed for applySchema not to crash: add
  // system_prompt, same as every other describe block's base already has.
  function legacyArtifactsDb(): Database.Database {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
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
        role TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'complete',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO channels (id, name) VALUES ('ch-1', 'test');
    `);
    return db;
  }

  it('[orig 7] creates message_artifacts table', () => {
    const db = legacyArtifactsDb();
    applySchema(db);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='message_artifacts'")
      .all();
    expect(tables.length).toBe(1);
    db.close();
  });

  it('[orig 8 / P5] message_artifacts has correct columns', () => {
    const db = legacyArtifactsDb();
    applySchema(db);
    const cols = db.prepare('PRAGMA table_info(message_artifacts)').all() as { name: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('message_id');
    expect(colNames).toContain('type');
    expect(colNames).toContain('tool_name');
    expect(colNames).toContain('input_summary');
    expect(colNames).toContain('content');
    db.close();
  });

  it('[orig 9 / P4] CASCADE deletes artifacts when message is deleted', () => {
    const db = legacyArtifactsDb();
    applySchema(db);
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    db.prepare('INSERT INTO messages (id, channel_id, role, content) VALUES (?, ?, ?, ?)').run(
      'msg-1',
      'ch-1',
      'assistant',
      'hello'
    );
    db.prepare(
      'INSERT INTO message_artifacts (id, message_id, type, tool_name, input_summary) VALUES (?, ?, ?, ?, ?)'
    ).run('art-1', 'msg-1', 'tool_use', 'Read', 'src/App.tsx');
    let artifacts = db.prepare("SELECT * FROM message_artifacts WHERE message_id = 'msg-1'").all();
    expect(artifacts.length).toBe(1);
    db.prepare("DELETE FROM messages WHERE id = 'msg-1'").run();
    artifacts = db.prepare("SELECT * FROM message_artifacts WHERE message_id = 'msg-1'").all();
    expect(artifacts.length).toBe(0);
    db.close();
  });

  // ── Phase 2: Compaction state column (original 10) ────────────────

  it('[orig 10] channels table supports compaction_state column', () => {
    const db = legacyChannelsDb();
    applySchema(db);
    db.exec("INSERT OR IGNORE INTO channels (id, name) VALUES ('ch-1', 'test')");
    const before = db.prepare("SELECT compaction_state FROM channels WHERE id = 'ch-1'").get() as any;
    expect(before.compaction_state).toBeNull();

    const state = JSON.stringify({
      summary: 'Compacted summary.',
      timestamp: '2026-03-10T12:00:00Z',
      beforeMessageId: 'msg-100',
    });
    db.prepare('UPDATE channels SET compaction_state = ? WHERE id = ?').run(state, 'ch-1');

    const after = db.prepare("SELECT compaction_state FROM channels WHERE id = 'ch-1'").get() as any;
    expect(after.compaction_state).toBe(state);
    const parsed = JSON.parse(after.compaction_state);
    expect(parsed.summary).toBe('Compacted summary.');
    expect(parsed.beforeMessageId).toBe('msg-100');

    db.close();
  });
});
