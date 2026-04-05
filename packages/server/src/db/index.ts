import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS, MODEL_ALIASES, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Walk up to find the monorepo root (contains package.json with workspaces)
function findProjectRoot(dir: string): string {
  const pkg = path.join(dir, 'package.json');
  if (fs.existsSync(pkg)) {
    try {
      const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
      if (json.workspaces) return dir;
    } catch { /* keep walking */ }
  }
  const parent = path.dirname(dir);
  if (parent === dir) return process.cwd(); // fallback
  return findProjectRoot(parent);
}

const DB_PATH = process.env.KLATCH_DB
  ? path.resolve(process.env.KLATCH_DB)
  : path.join(findProjectRoot(__dirname), 'klatch.db');

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

  // Add handle column to entities if it doesn't exist
  const entityCols = db.prepare("PRAGMA table_info(entities)").all() as { name: string }[];
  if (!entityCols.some((c) => c.name === 'handle')) {
    db.exec(`ALTER TABLE entities ADD COLUMN handle TEXT`);
  }

  // Add effort column to entities if it doesn't exist
  const entityCols2 = db.prepare("PRAGMA table_info(entities)").all() as { name: string }[];
  if (!entityCols2.some((c) => c.name === 'effort')) {
    db.exec(`ALTER TABLE entities ADD COLUMN effort TEXT NOT NULL DEFAULT 'high'`);
  }

  // ── Step 8: Import support ─────────────────────────────────

  // Add source tracking columns to channels
  if (!channelCols.some((c) => c.name === 'source')) {
    db.exec(`ALTER TABLE channels ADD COLUMN source TEXT DEFAULT 'native'`);
  }
  if (!channelCols.some((c) => c.name === 'source_metadata')) {
    db.exec(`ALTER TABLE channels ADD COLUMN source_metadata TEXT`);
  }

  // Add original IDs to messages for imported conversations
  // Re-read msgCols since we might have added columns above
  const msgCols2 = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
  if (!msgCols2.some((c) => c.name === 'original_timestamp')) {
    db.exec(`ALTER TABLE messages ADD COLUMN original_timestamp TEXT`);
  }
  if (!msgCols2.some((c) => c.name === 'original_id')) {
    db.exec(`ALTER TABLE messages ADD COLUMN original_id TEXT`);
  }

  // Create message_artifacts table for tool use, thinking, images from imports
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_artifacts (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      tool_name TEXT,
      input_summary TEXT,
      content TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_message_artifacts_message_id ON message_artifacts(message_id);
  `);

  // ── Phase 2: Compaction support ──────────────────────────────

  // Add compaction_state to channels for storing API compaction summaries
  const channelCols3 = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
  if (!channelCols3.some((c) => c.name === 'compaction_state')) {
    db.exec(`ALTER TABLE channels ADD COLUMN compaction_state TEXT`);
  }

  // ── Step 8¾a: Projects table + project context injection ──────

  // First-class projects table — shared context across channels
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      instructions TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'native',
      source_metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add project_id FK column to channels (nullable — channels can be unlinked)
  const channelCols4 = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
  if (!channelCols4.some((c) => c.name === 'project_id')) {
    db.exec(`ALTER TABLE channels ADD COLUMN project_id TEXT`);
  }

  // ── Sidebar redesign: chat/klatch type column ──────────────
  const channelCols5 = db.prepare("PRAGMA table_info(channels)").all() as { name: string }[];
  if (!channelCols5.some((c) => c.name === 'type')) {
    db.exec(`ALTER TABLE channels ADD COLUMN type TEXT NOT NULL DEFAULT 'chat'`);
  }

  // ── Decision 1: MEMORY.md → project level ──────────────────
  const projectCols = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  if (!projectCols.some((c) => c.name === 'memory')) {
    db.exec(`ALTER TABLE projects ADD COLUMN memory TEXT NOT NULL DEFAULT ''`);
  }

  // ── Step 9: File attachment columns on message_artifacts ──
  const artifactCols = db.prepare("PRAGMA table_info(message_artifacts)").all() as { name: string }[];
  if (!artifactCols.some((c) => c.name === 'file_name')) {
    db.exec(`ALTER TABLE message_artifacts ADD COLUMN file_name TEXT`);
  }
  if (!artifactCols.some((c) => c.name === 'file_mime_type')) {
    db.exec(`ALTER TABLE message_artifacts ADD COLUMN file_mime_type TEXT`);
  }
  if (!artifactCols.some((c) => c.name === 'file_size_bytes')) {
    db.exec(`ALTER TABLE message_artifacts ADD COLUMN file_size_bytes INTEGER`);
  }
  if (!artifactCols.some((c) => c.name === 'file_storage_key')) {
    db.exec(`ALTER TABLE message_artifacts ADD COLUMN file_storage_key TEXT`);
  }

  // ── File Domain Model Phase 1: files + file_refs tables ─────

  db.exec(`
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
  `);

  // Backfill: migrate existing message_artifacts (type='file') into files + file_refs
  const needsBackfill = db.prepare(
    `SELECT COUNT(*) as count FROM message_artifacts
     WHERE type = 'file' AND file_storage_key IS NOT NULL
     AND file_storage_key NOT IN (SELECT storage_key FROM files)`
  ).get() as { count: number };

  if (needsBackfill.count > 0) {
    const artifacts = db.prepare(
      `SELECT id, message_id, file_name, file_mime_type, file_size_bytes, file_storage_key, created_at
       FROM message_artifacts
       WHERE type = 'file' AND file_storage_key IS NOT NULL
       AND file_storage_key NOT IN (SELECT storage_key FROM files)`
    ).all() as {
      id: string; message_id: string; file_name: string;
      file_mime_type: string; file_size_bytes: number;
      file_storage_key: string; created_at: string;
    }[];

    const insertFile = db.prepare(
      'INSERT OR IGNORE INTO files (id, name, mime_type, size_bytes, storage_key, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertRef = db.prepare(
      'INSERT INTO file_refs (id, file_id, scope, scope_id, ref_type, added_at, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    for (const a of artifacts) {
      const fileId = randomUUID();
      const refId = randomUUID();
      insertFile.run(fileId, a.file_name, a.file_mime_type, a.file_size_bytes, a.file_storage_key, 'user', a.created_at);
      insertRef.run(refId, fileId, 'message', a.message_id, 'pinned', a.created_at, 'user');
    }
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
