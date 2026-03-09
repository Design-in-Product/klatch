import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index.js';
import type { Channel, Message, Entity, ModelId, InteractionMode } from '@klatch/shared';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

function rowToChannel(row: any): Channel {
  return {
    id: row.id,
    name: row.name,
    systemPrompt: row.system_prompt,
    model: row.model || DEFAULT_MODEL,
    mode: (row.mode as InteractionMode) || DEFAULT_INTERACTION_MODE,
    createdAt: row.created_at,
  };
}

function rowToMessage(row: any): Message {
  return {
    id: row.id,
    channelId: row.channel_id,
    role: row.role,
    content: row.content,
    status: row.status,
    model: row.model || undefined,
    entityId: row.entity_id || undefined,
    createdAt: row.created_at,
  };
}

function rowToEntity(row: any): Entity {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle || undefined,
    model: row.model || DEFAULT_MODEL,
    systemPrompt: row.system_prompt,
    color: row.color || ENTITY_COLORS[0],
    createdAt: row.created_at,
  };
}

export function getChannel(id: string): Channel | undefined {
  const row = getDb().prepare('SELECT * FROM channels WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToChannel(row);
}

export function getAllChannels(): Channel[] {
  const rows = getDb()
    .prepare(`
      SELECT c.*, COUNT(ce.entity_id) as entity_count
      FROM channels c
      LEFT JOIN channel_entities ce ON c.id = ce.channel_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `)
    .all() as any[];
  return rows.map((row) => ({
    ...rowToChannel(row),
    entityCount: row.entity_count ?? 0,
  }));
}

export function createChannel(name: string, systemPrompt: string, model?: ModelId, mode?: InteractionMode): Channel {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const channelModel = model || DEFAULT_MODEL;
  const channelMode = mode || DEFAULT_INTERACTION_MODE;

  const txn = db.transaction(() => {
    db.prepare('INSERT INTO channels (id, name, system_prompt, model, mode, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, systemPrompt, channelModel, channelMode, now);
    // Auto-assign default entity to new channels
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
      .run(id, DEFAULT_ENTITY_ID);
  });
  txn();

  return { id, name, systemPrompt, model: channelModel, mode: channelMode, createdAt: now };
}

export function updateChannel(
  id: string,
  updates: { name?: string; systemPrompt?: string; model?: ModelId; mode?: InteractionMode }
): Channel | undefined {
  const channel = getChannel(id);
  if (!channel) return undefined;

  const name = updates.name ?? channel.name;
  const systemPrompt = updates.systemPrompt ?? channel.systemPrompt;
  const model = updates.model ?? channel.model;
  const mode = updates.mode ?? channel.mode;

  getDb()
    .prepare('UPDATE channels SET name = ?, system_prompt = ?, model = ?, mode = ? WHERE id = ?')
    .run(name, systemPrompt, model, mode, id);

  return { ...channel, name, systemPrompt, model, mode };
}

export function getMessage(id: string): Message | undefined {
  const row = getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToMessage(row);
}

export function getMessages(channelId: string): Message[] {
  const rows = getDb()
    .prepare('SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC, rowid ASC')
    .all(channelId) as any[];
  return rows.map(rowToMessage);
}

export function insertMessage(
  channelId: string,
  role: 'user' | 'assistant',
  content: string,
  status: 'complete' | 'streaming' = 'complete',
  model?: ModelId,
  entityId?: string
): Message {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, role, content, status, model || null, entityId || null, now);
  return { id, channelId, role, content, status, model, entityId, createdAt: now };
}

/** Create a user message + assistant placeholder in a single transaction */
export function createMessagePair(
  channelId: string,
  content: string,
  model?: ModelId
): { userMsg: Message; assistantMsg: Message } {
  const db = getDb();
  const txn = db.transaction(() => {
    const userMsg = insertMessage(channelId, 'user', content, 'complete');
    const assistantMsg = insertMessage(channelId, 'assistant', '', 'streaming', model);
    return { userMsg, assistantMsg };
  });
  return txn();
}

export function updateMessage(id: string, content: string, status: 'complete' | 'error') {
  getDb()
    .prepare('UPDATE messages SET content = ?, status = ? WHERE id = ?')
    .run(content, status, id);
}

export function deleteMessage(id: string): boolean {
  const result = getDb()
    .prepare('DELETE FROM messages WHERE id = ?')
    .run(id);
  return result.changes > 0;
}

export function deleteAllMessages(channelId: string): number {
  const result = getDb()
    .prepare('DELETE FROM messages WHERE channel_id = ?')
    .run(channelId);
  return result.changes;
}

/** Delete a channel and all its messages + entity assignments (cascade) */
export function deleteChannel(id: string): boolean {
  const db = getDb();
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(id);
    db.prepare('DELETE FROM messages WHERE channel_id = ?').run(id);
    const result = db.prepare('DELETE FROM channels WHERE id = ?').run(id);
    return result.changes > 0;
  });
  return txn();
}

export function getLastAssistantMessage(channelId: string): Message | undefined {
  const row = getDb()
    .prepare(
      'SELECT * FROM messages WHERE channel_id = ? AND role = ? ORDER BY created_at DESC, rowid DESC LIMIT 1'
    )
    .get(channelId, 'assistant') as any;
  if (!row) return undefined;
  return rowToMessage(row);
}

/** Get all assistant messages from the last round (after the last user message). */
export function getLastRoundAssistantMessages(channelId: string): Message[] {
  const db = getDb();
  // Find the last user message's rowid
  const lastUser = db.prepare(
    'SELECT rowid FROM messages WHERE channel_id = ? AND role = ? ORDER BY created_at DESC, rowid DESC LIMIT 1'
  ).get(channelId, 'user') as { rowid: number } | undefined;

  if (!lastUser) return [];

  // Get all assistant messages after that user message
  const rows = db.prepare(
    'SELECT * FROM messages WHERE channel_id = ? AND role = ? AND rowid > ? ORDER BY created_at ASC, rowid ASC'
  ).all(channelId, 'assistant', lastUser.rowid) as any[];

  return rows.map(rowToMessage);
}

// ── Entity CRUD ──────────────────────────────────────────────

export function getEntity(id: string): Entity | undefined {
  const row = getDb().prepare('SELECT * FROM entities WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToEntity(row);
}

export function getAllEntities(): Entity[] {
  const rows = getDb()
    .prepare('SELECT * FROM entities ORDER BY created_at ASC')
    .all() as any[];
  return rows.map(rowToEntity);
}

export function createEntity(
  name: string,
  model: ModelId,
  systemPrompt: string,
  color: string,
  handle?: string
): Entity {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare('INSERT INTO entities (id, name, handle, model, system_prompt, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, handle || null, model, systemPrompt, color, now);
  return { id, name, handle: handle || undefined, model, systemPrompt, color, createdAt: now };
}

export function updateEntity(
  id: string,
  updates: { name?: string; handle?: string | null; model?: ModelId; systemPrompt?: string; color?: string }
): Entity | undefined {
  const entity = getEntity(id);
  if (!entity) return undefined;

  const name = updates.name ?? entity.name;
  const handle = updates.handle !== undefined ? (updates.handle || undefined) : entity.handle;
  const model = updates.model ?? entity.model;
  const systemPrompt = updates.systemPrompt ?? entity.systemPrompt;
  const color = updates.color ?? entity.color;

  getDb()
    .prepare('UPDATE entities SET name = ?, handle = ?, model = ?, system_prompt = ?, color = ? WHERE id = ?')
    .run(name, handle || null, model, systemPrompt, color, id);

  return { ...entity, name, handle, model, systemPrompt, color };
}

export function deleteEntity(id: string): boolean {
  const db = getDb();
  const txn = db.transaction(() => {
    // Remove from all channel assignments first
    db.prepare('DELETE FROM channel_entities WHERE entity_id = ?').run(id);
    const result = db.prepare('DELETE FROM entities WHERE id = ?').run(id);
    return result.changes > 0;
  });
  return txn();
}

// ── Channel-Entity Assignment ────────────────────────────────

export function getChannelEntities(channelId: string): Entity[] {
  const rows = getDb()
    .prepare(`
      SELECT e.* FROM entities e
      JOIN channel_entities ce ON e.id = ce.entity_id
      WHERE ce.channel_id = ?
      ORDER BY ce.added_at ASC
    `)
    .all(channelId) as any[];
  return rows.map(rowToEntity);
}

export function assignEntityToChannel(channelId: string, entityId: string): boolean {
  try {
    getDb()
      .prepare('INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
      .run(channelId, entityId);
    return true;
  } catch {
    return false;
  }
}

export function removeEntityFromChannel(channelId: string, entityId: string): boolean {
  const result = getDb()
    .prepare('DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
    .run(channelId, entityId);
  return result.changes > 0;
}

export function getChannelEntityCount(channelId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) as count FROM channel_entities WHERE channel_id = ?')
    .get(channelId) as { count: number };
  return row.count;
}
