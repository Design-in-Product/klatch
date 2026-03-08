import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS, MODEL_ALIASES, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../../klatch.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    runMigrations();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      system_prompt TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '${DEFAULT_MODEL}',
      mode TEXT NOT NULL DEFAULT '${DEFAULT_INTERACTION_MODE}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id),
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete', 'streaming', 'error')),
      model TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
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

    INSERT OR IGNORE INTO channels (id, name, system_prompt)
    VALUES ('default', 'general', 'You are a helpful assistant.');

    INSERT OR IGNORE INTO entities (id, name, model, system_prompt, color)
    VALUES ('${DEFAULT_ENTITY_ID}', 'Claude', '${DEFAULT_MODEL}', 'You are a helpful assistant.', '${ENTITY_COLORS[0]}');
  `);
}

function runMigrations() {
  // Add model column to channels if it doesn't exist
  const channelCols = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
  if (!channelCols.some((c) => c.name === 'model')) {
    db.exec(`ALTER TABLE channels ADD COLUMN model TEXT NOT NULL DEFAULT '${DEFAULT_MODEL}'`);
  }

  // Add model column to messages if it doesn't exist
  const msgCols = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
  if (!msgCols.some((c) => c.name === 'model')) {
    db.exec(`ALTER TABLE messages ADD COLUMN model TEXT`);
  }

  // Add entity_id column to messages if it doesn't exist
  if (!msgCols.some((c) => c.name === 'entity_id')) {
    db.exec(`ALTER TABLE messages ADD COLUMN entity_id TEXT`);
  }

  // Add mode column to channels if it doesn't exist
  if (!channelCols.some((c) => c.name === 'mode')) {
    db.exec(`ALTER TABLE channels ADD COLUMN mode TEXT NOT NULL DEFAULT '${DEFAULT_INTERACTION_MODE}'`);
  }

  // Migrate legacy model IDs to current versions
  for (const [oldId, newId] of Object.entries(MODEL_ALIASES)) {
    db.prepare('UPDATE channels SET model = ? WHERE model = ?').run(newId, oldId);
    db.prepare('UPDATE messages SET model = ? WHERE model = ?').run(newId, oldId);
  }

  // Ensure default entity exists (for existing databases being upgraded)
  const defaultEntity = db.prepare('SELECT id FROM entities WHERE id = ?').get(DEFAULT_ENTITY_ID);
  if (!defaultEntity) {
    db.prepare(
      'INSERT INTO entities (id, name, model, system_prompt, color) VALUES (?, ?, ?, ?, ?)'
    ).run(DEFAULT_ENTITY_ID, 'Claude', DEFAULT_MODEL, 'You are a helpful assistant.', ENTITY_COLORS[0]);
  }

  // Auto-assign default entity to any channels that have no entities assigned
  const unassignedChannels = db.prepare(`
    SELECT c.id FROM channels c
    LEFT JOIN channel_entities ce ON c.id = ce.channel_id
    WHERE ce.channel_id IS NULL
  `).all() as { id: string }[];

  for (const ch of unassignedChannels) {
    db.prepare(
      'INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)'
    ).run(ch.id, DEFAULT_ENTITY_ID);
  }
}
