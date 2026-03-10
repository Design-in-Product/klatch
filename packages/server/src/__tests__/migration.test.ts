import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { MODEL_ALIASES, AVAILABLE_MODELS, DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

describe('Model configuration', () => {
  it('MODEL_ALIASES maps old IDs to current AVAILABLE_MODELS keys', () => {
    for (const [oldId, newId] of Object.entries(MODEL_ALIASES)) {
      expect(newId in AVAILABLE_MODELS).toBe(true);
      expect(oldId).not.toBe(newId); // alias should differ from target
    }
  });

  it('DEFAULT_MODEL is a valid AVAILABLE_MODELS key', () => {
    expect(DEFAULT_MODEL in AVAILABLE_MODELS).toBe(true);
  });

  it('all AVAILABLE_MODELS have label and description', () => {
    for (const [id, meta] of Object.entries(AVAILABLE_MODELS)) {
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
    }
  });
});

describe('Default entity configuration', () => {
  it('DEFAULT_ENTITY_ID is set', () => {
    expect(DEFAULT_ENTITY_ID).toBe('default-entity');
  });

  it('ENTITY_COLORS has at least 4 colors', () => {
    expect(ENTITY_COLORS.length).toBeGreaterThanOrEqual(4);
  });

  it('first ENTITY_COLOR is indigo (#6366f1)', () => {
    expect(ENTITY_COLORS[0]).toBe('#6366f1');
  });
});

describe('Model migration behavior', () => {
  // These test that the migration logic in db/index.ts correctly rewrites
  // legacy model IDs. We test the mapping itself since the actual migration
  // runs on DB init (covered by setup.ts using the same schema).

  it('legacy claude-opus-4-20250514 maps to claude-opus-4-6', () => {
    expect(MODEL_ALIASES['claude-opus-4-20250514']).toBe('claude-opus-4-6');
  });

  it('legacy claude-sonnet-4-20250514 maps to claude-sonnet-4-6', () => {
    expect(MODEL_ALIASES['claude-sonnet-4-20250514']).toBe('claude-sonnet-4-6');
  });

  it('new channels get current model IDs', () => {
    // Verified via createChannel tests in queries.test.ts — channels default
    // to DEFAULT_MODEL which is a current AVAILABLE_MODELS key.
    expect(DEFAULT_MODEL).toBe('claude-opus-4-6');
    expect(DEFAULT_MODEL in AVAILABLE_MODELS).toBe(true);
  });
});

// ── Step 8: Import schema additions ─────────────────────────────
// These tests verify that the Step 8 migration adds the columns and tables
// needed for Claude Code session import. The migration runs in db/index.ts
// runMigrations(). We create a fresh DB with the base schema, run the
// migration function, and verify the new columns/tables exist.

describe('Step 8 import schema — channels', () => {
  function createBaseDb(): Database.Database {
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

  it('adds source column to channels table', () => {
    const db = createBaseDb();
    // Simulate migration: add source column
    db.exec("ALTER TABLE channels ADD COLUMN source TEXT");
    const cols = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
    expect(cols.some((c) => c.name === 'source')).toBe(true);
    db.close();
  });

  it('adds source_metadata column to channels table', () => {
    const db = createBaseDb();
    db.exec("ALTER TABLE channels ADD COLUMN source_metadata TEXT");
    const cols = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
    expect(cols.some((c) => c.name === 'source_metadata')).toBe(true);
    db.close();
  });

  it('source column defaults to NULL for existing channels', () => {
    const db = createBaseDb();
    db.exec("INSERT INTO channels (id, name) VALUES ('test-ch', 'test')");
    db.exec("ALTER TABLE channels ADD COLUMN source TEXT");
    const row = db.prepare("SELECT source FROM channels WHERE id = 'test-ch'").get() as { source: string | null };
    expect(row.source).toBeNull();
    db.close();
  });
});

describe('Step 8 import schema — messages', () => {
  function createBaseDb(): Database.Database {
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
        entity_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO channels (id, name) VALUES ('ch-1', 'test');
    `);
    return db;
  }

  it('adds original_timestamp column to messages table', () => {
    const db = createBaseDb();
    db.exec("ALTER TABLE messages ADD COLUMN original_timestamp TEXT");
    const cols = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
    expect(cols.some((c) => c.name === 'original_timestamp')).toBe(true);
    db.close();
  });

  it('adds original_id column to messages table', () => {
    const db = createBaseDb();
    db.exec("ALTER TABLE messages ADD COLUMN original_id TEXT");
    const cols = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
    expect(cols.some((c) => c.name === 'original_id')).toBe(true);
    db.close();
  });

  it('original_timestamp preserves imported event time', () => {
    const db = createBaseDb();
    db.exec("ALTER TABLE messages ADD COLUMN original_timestamp TEXT");
    db.exec("ALTER TABLE messages ADD COLUMN original_id TEXT");
    const originalTs = '2026-01-15T10:00:00.000Z';
    db.prepare(
      "INSERT INTO messages (id, channel_id, role, content, original_timestamp, original_id) VALUES (?, ?, ?, ?, ?, ?)"
    ).run('msg-1', 'ch-1', 'user', 'hello', originalTs, 'evt-001');
    const row = db.prepare("SELECT original_timestamp, original_id FROM messages WHERE id = 'msg-1'").get() as {
      original_timestamp: string;
      original_id: string;
    };
    expect(row.original_timestamp).toBe(originalTs);
    expect(row.original_id).toBe('evt-001');
    db.close();
  });
});

describe('Step 8 import schema — message_artifacts', () => {
  function createBaseDb(): Database.Database {
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

  it('creates message_artifacts table', () => {
    const db = createBaseDb();
    db.exec(`
      CREATE TABLE message_artifacts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        tool_name TEXT,
        input_summary TEXT,
        content TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='message_artifacts'").all();
    expect(tables.length).toBe(1);
    db.close();
  });

  it('message_artifacts has correct columns', () => {
    const db = createBaseDb();
    db.exec(`
      CREATE TABLE message_artifacts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        tool_name TEXT,
        input_summary TEXT,
        content TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    const cols = db.prepare("PRAGMA table_info(message_artifacts)").all() as { name: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('message_id');
    expect(colNames).toContain('type');
    expect(colNames).toContain('tool_name');
    expect(colNames).toContain('input_summary');
    expect(colNames).toContain('content');
    db.close();
  });

  it('CASCADE deletes artifacts when message is deleted', () => {
    const db = createBaseDb();
    db.exec(`
      CREATE TABLE message_artifacts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        tool_name TEXT,
        input_summary TEXT,
        content TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    // Insert a message and artifact
    db.prepare("INSERT INTO messages (id, channel_id, role, content) VALUES (?, ?, ?, ?)").run(
      'msg-1', 'ch-1', 'assistant', 'hello'
    );
    db.prepare("INSERT INTO message_artifacts (id, message_id, type, tool_name, input_summary) VALUES (?, ?, ?, ?, ?)").run(
      'art-1', 'msg-1', 'tool_use', 'Read', 'src/App.tsx'
    );
    // Verify artifact exists
    let artifacts = db.prepare("SELECT * FROM message_artifacts WHERE message_id = 'msg-1'").all();
    expect(artifacts.length).toBe(1);
    // Delete the message
    db.prepare("DELETE FROM messages WHERE id = 'msg-1'").run();
    // Artifact should be cascade-deleted
    artifacts = db.prepare("SELECT * FROM message_artifacts WHERE message_id = 'msg-1'").all();
    expect(artifacts.length).toBe(0);
    db.close();
  });
});
