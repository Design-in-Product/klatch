import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_MODEL } from '@klatch/shared';

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

    INSERT OR IGNORE INTO channels (id, name, system_prompt)
    VALUES ('default', 'general', 'You are a helpful assistant.');
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
}
