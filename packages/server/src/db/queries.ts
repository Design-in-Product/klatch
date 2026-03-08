import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index.js';
import type { Channel, Message, ModelId } from '@klatch/shared';
import { DEFAULT_MODEL } from '@klatch/shared';

function rowToChannel(row: any): Channel {
  return {
    id: row.id,
    name: row.name,
    systemPrompt: row.system_prompt,
    model: row.model || DEFAULT_MODEL,
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
    .prepare('SELECT * FROM channels ORDER BY created_at ASC')
    .all() as any[];
  return rows.map(rowToChannel);
}

export function createChannel(name: string, systemPrompt: string, model?: ModelId): Channel {
  const id = uuidv4();
  const now = new Date().toISOString();
  const channelModel = model || DEFAULT_MODEL;
  getDb()
    .prepare('INSERT INTO channels (id, name, system_prompt, model, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, systemPrompt, channelModel, now);
  return { id, name, systemPrompt, model: channelModel, createdAt: now };
}

export function updateChannel(
  id: string,
  updates: { name?: string; systemPrompt?: string; model?: ModelId }
): Channel | undefined {
  const channel = getChannel(id);
  if (!channel) return undefined;

  const name = updates.name ?? channel.name;
  const systemPrompt = updates.systemPrompt ?? channel.systemPrompt;
  const model = updates.model ?? channel.model;

  getDb()
    .prepare('UPDATE channels SET name = ?, system_prompt = ?, model = ? WHERE id = ?')
    .run(name, systemPrompt, model, id);

  return { ...channel, name, systemPrompt, model };
}

export function getMessage(id: string): Message | undefined {
  const row = getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return rowToMessage(row);
}

export function getMessages(channelId: string): Message[] {
  const rows = getDb()
    .prepare('SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC')
    .all(channelId) as any[];
  return rows.map(rowToMessage);
}

export function insertMessage(
  channelId: string,
  role: 'user' | 'assistant',
  content: string,
  status: 'complete' | 'streaming' = 'complete',
  model?: ModelId
): Message {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, role, content, status, model || null, now);
  return { id, channelId, role, content, status, model, createdAt: now };
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

export function getLastAssistantMessage(channelId: string): Message | undefined {
  const row = getDb()
    .prepare(
      'SELECT * FROM messages WHERE channel_id = ? AND role = ? ORDER BY created_at DESC LIMIT 1'
    )
    .get(channelId, 'assistant') as any;
  if (!row) return undefined;
  return rowToMessage(row);
}
