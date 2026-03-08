import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index.js';
import type { Channel, Message } from '@klatch/shared';

export function getChannel(id: string): Channel | undefined {
  const row = getDb().prepare('SELECT * FROM channels WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    systemPrompt: row.system_prompt,
    createdAt: row.created_at,
  };
}

export function getAllChannels(): Channel[] {
  const rows = getDb()
    .prepare('SELECT * FROM channels ORDER BY created_at ASC')
    .all() as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    systemPrompt: row.system_prompt,
    createdAt: row.created_at,
  }));
}

export function createChannel(name: string, systemPrompt: string): Channel {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare('INSERT INTO channels (id, name, system_prompt, created_at) VALUES (?, ?, ?, ?)')
    .run(id, name, systemPrompt, now);
  return { id, name, systemPrompt, createdAt: now };
}

export function getMessage(id: string): Message | undefined {
  const row = getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return {
    id: row.id,
    channelId: row.channel_id,
    role: row.role,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function getMessages(channelId: string): Message[] {
  const rows = getDb()
    .prepare('SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC')
    .all(channelId) as any[];
  return rows.map((row) => ({
    id: row.id,
    channelId: row.channel_id,
    role: row.role,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export function insertMessage(
  channelId: string,
  role: 'user' | 'assistant',
  content: string,
  status: 'complete' | 'streaming' = 'complete'
): Message {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, role, content, status, now);
  return { id, channelId, role, content, status, createdAt: now };
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
  return {
    id: row.id,
    channelId: row.channel_id,
    role: row.role,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
  };
}
