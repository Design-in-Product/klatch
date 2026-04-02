import Database from 'better-sqlite3';
import { vi, beforeEach, afterAll } from 'vitest';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS, MODEL_ALIASES, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

let testDb: Database.Database;

// Mock the db module so all queries use our in-memory DB
vi.mock('../db/index.js', () => ({
  getDb: () => testDb,
}));

function createFreshDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      instructions TEXT NOT NULL DEFAULT '',
      memory TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'native',
      source_metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'chat',
      system_prompt TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '${DEFAULT_MODEL}',
      mode TEXT NOT NULL DEFAULT '${DEFAULT_INTERACTION_MODE}',
      source TEXT DEFAULT 'native',
      source_metadata TEXT,
      compaction_state TEXT,
      project_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
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

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT,
      model TEXT NOT NULL DEFAULT '${DEFAULT_MODEL}',
      system_prompt TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '${ENTITY_COLORS[0]}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS channel_entities (
      channel_id TEXT NOT NULL REFERENCES channels(id),
      entity_id TEXT NOT NULL REFERENCES entities(id),
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (channel_id, entity_id)
    );

    CREATE TABLE IF NOT EXISTS message_artifacts (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      tool_name TEXT,
      input_summary TEXT,
      content TEXT,
      file_name TEXT,
      file_mime_type TEXT,
      file_size_bytes INTEGER,
      file_storage_key TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_message_artifacts_message_id ON message_artifacts(message_id);

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      storage_key TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS file_refs (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL REFERENCES files(id),
      scope TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      ref_type TEXT NOT NULL DEFAULT 'pinned',
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      added_by TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_file_refs_scope ON file_refs(scope, scope_id);
    CREATE INDEX IF NOT EXISTS idx_file_refs_file ON file_refs(file_id);

    INSERT OR IGNORE INTO channels (id, name, system_prompt)
    VALUES ('default', 'general', 'You are a helpful assistant.');

    INSERT OR IGNORE INTO entities (id, name, model, system_prompt, color)
    VALUES ('${DEFAULT_ENTITY_ID}', 'Claude', '${DEFAULT_MODEL}', 'You are a helpful assistant.', '${ENTITY_COLORS[0]}');

    INSERT OR IGNORE INTO channel_entities (channel_id, entity_id)
    VALUES ('default', '${DEFAULT_ENTITY_ID}');
  `);

  return db;
}

beforeEach(() => {
  if (testDb) {
    testDb.close();
  }
  testDb = createFreshDb();
});

afterAll(() => {
  if (testDb) {
    testDb.close();
  }
});

export { testDb };
