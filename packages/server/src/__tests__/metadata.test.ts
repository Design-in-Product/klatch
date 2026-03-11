import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { getChannelStats, createChannel } from '../db/queries.js';
import { createTestApp } from './app.js';

const app = createTestApp();

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(`/api${path}`, init);
}

/** Seed a channel with messages and artifacts for testing stats queries */
function seedImportedChannel(opts?: { source?: string; cwd?: string }) {
  const db = getDb();
  const channelId = uuidv4();
  const source = opts?.source ?? 'claude-code';
  const cwd = opts?.cwd ?? '/home/user/my-project';
  const meta = JSON.stringify({
    originalSessionId: uuidv4(),
    cwd,
    importedAt: new Date().toISOString(),
  });

  db.prepare(
    `INSERT INTO channels (id, name, source, source_metadata, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(channelId, `test-${channelId.slice(0, 6)}`, source, meta);

  // Insert messages: 3 user, 2 assistant
  const msgIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const msgId = uuidv4();
    msgIds.push(msgId);
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, status, created_at)
       VALUES (?, ?, ?, ?, 'complete', datetime('now', '+${i} seconds'))`
    ).run(msgId, channelId, i % 2 === 0 ? 'user' : 'assistant', `msg ${i}`);
  }

  // Insert artifacts on assistant messages (msgIds[1] and msgIds[3])
  const artifacts = [
    { msgId: msgIds[1], type: 'tool_use', toolName: 'Read', summary: 'src/App.tsx' },
    { msgId: msgIds[1], type: 'tool_use', toolName: 'Read', summary: 'src/index.ts' },
    { msgId: msgIds[1], type: 'tool_use', toolName: 'Bash', summary: 'npm test' },
    { msgId: msgIds[1], type: 'tool_result', toolName: 'Read', summary: null },
    { msgId: msgIds[1], type: 'thinking', toolName: null, summary: null },
    { msgId: msgIds[3], type: 'tool_use', toolName: 'Grep', summary: '*.ts' },
    { msgId: msgIds[3], type: 'tool_result', toolName: 'Grep', summary: null },
    { msgId: msgIds[3], type: 'thinking', toolName: null, summary: null },
    { msgId: msgIds[3], type: 'image', toolName: null, summary: null },
  ];

  for (const a of artifacts) {
    db.prepare(
      `INSERT INTO message_artifacts (id, message_id, type, tool_name, input_summary)
       VALUES (?, ?, ?, ?, ?)`
    ).run(uuidv4(), a.msgId, a.type, a.toolName, a.summary);
  }

  return { channelId, msgIds };
}

// ── getChannelStats query tests ──────────────────────────────────

describe('getChannelStats', () => {
  it('returns correct counts for a populated channel', () => {
    const { channelId } = seedImportedChannel();
    const stats = getChannelStats(channelId);

    expect(stats).toBeDefined();
    expect(stats!.messageCount).toBe(5);
    expect(stats!.artifactCount).toBe(9);
    expect(stats!.lastMessageAt).toBeTruthy();
  });

  it('returns tool breakdown sorted by frequency', () => {
    const { channelId } = seedImportedChannel();
    const stats = getChannelStats(channelId)!;

    expect(stats.toolBreakdown.length).toBe(3); // Read, Bash, Grep
    // Read appears twice, so it should be first
    expect(stats.toolBreakdown[0]).toEqual({ tool: 'Read', count: 2 });
    // Bash and Grep each once (order may vary among ties)
    const otherTools = stats.toolBreakdown.slice(1).map((t) => t.tool).sort();
    expect(otherTools).toEqual(['Bash', 'Grep']);
  });

  it('only counts tool_use in toolBreakdown (not tool_result, thinking, image)', () => {
    const { channelId } = seedImportedChannel();
    const stats = getChannelStats(channelId)!;

    // 4 tool_use artifacts total (Read x2, Bash x1, Grep x1)
    const totalToolUses = stats.toolBreakdown.reduce((sum, t) => sum + t.count, 0);
    expect(totalToolUses).toBe(4);
  });

  it('returns zeros for an empty channel', () => {
    const channel = createChannel('empty-ch', 'prompt');
    const stats = getChannelStats(channel.id)!;

    expect(stats.messageCount).toBe(0);
    expect(stats.artifactCount).toBe(0);
    expect(stats.toolBreakdown).toEqual([]);
    expect(stats.lastMessageAt).toBeNull();
  });

  it('returns undefined for nonexistent channel', () => {
    const stats = getChannelStats('does-not-exist');
    expect(stats).toBeUndefined();
  });

  it('handles channel with messages but no artifacts', () => {
    const db = getDb();
    const channelId = uuidv4();
    db.prepare('INSERT INTO channels (id, name) VALUES (?, ?)').run(channelId, 'no-artifacts');
    db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, status) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), channelId, 'user', 'hello', 'complete');

    const stats = getChannelStats(channelId)!;
    expect(stats.messageCount).toBe(1);
    expect(stats.artifactCount).toBe(0);
    expect(stats.toolBreakdown).toEqual([]);
  });
});

// ── GET /api/channels/:id/stats endpoint tests ──────────────────

describe('GET /api/channels/:id/stats', () => {
  it('returns stats for a valid channel (200)', async () => {
    const { channelId } = seedImportedChannel();
    const res = await req('GET', `/channels/${channelId}/stats`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.messageCount).toBe(5);
    expect(data.artifactCount).toBe(9);
    expect(Array.isArray(data.toolBreakdown)).toBe(true);
    expect(data.lastMessageAt).toBeTruthy();
  });

  it('returns 404 for nonexistent channel', async () => {
    const res = await req('GET', '/channels/nonexistent/stats');
    expect(res.status).toBe(404);
  });

  it('returns zero stats for default channel (no artifacts)', async () => {
    const res = await req('GET', '/channels/default/stats');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.messageCount).toBe(0);
    expect(data.artifactCount).toBe(0);
    expect(data.toolBreakdown).toEqual([]);
  });
});

// ── GET /api/channels enriched list tests ────────────────────────

describe('GET /api/channels (enriched)', () => {
  it('includes messageCount and lastMessageAt fields', async () => {
    seedImportedChannel();
    const res = await req('GET', '/channels');
    const data = await res.json();

    const importedCh = data.find((c: any) => c.source === 'claude-code');
    expect(importedCh).toBeDefined();
    expect(importedCh.messageCount).toBe(5);
    expect(importedCh.lastMessageAt).toBeTruthy();
  });

  it('default channel has zero messageCount', async () => {
    const res = await req('GET', '/channels');
    const data = await res.json();

    const defaultCh = data.find((c: any) => c.id === 'default');
    expect(defaultCh.messageCount).toBe(0);
    expect(defaultCh.lastMessageAt).toBeNull();
  });
});

// ── Sidebar grouping data (project grouping via source_metadata) ──

describe('project grouping edge cases', () => {
  it('channels with same cwd share a project', async () => {
    seedImportedChannel({ cwd: '/home/user/klatch' });
    seedImportedChannel({ cwd: '/home/user/klatch' });

    const res = await req('GET', '/channels');
    const data = await res.json();

    const klatchChannels = data.filter((c: any) => {
      if (!c.sourceMetadata) return false;
      try {
        return JSON.parse(c.sourceMetadata).cwd === '/home/user/klatch';
      } catch { return false; }
    });
    expect(klatchChannels.length).toBe(2);
  });

  it('channel with null source_metadata still returns in list', () => {
    const db = getDb();
    const channelId = uuidv4();
    db.prepare(
      `INSERT INTO channels (id, name, source, source_metadata)
       VALUES (?, ?, 'claude-code', NULL)`
    ).run(channelId, 'no-meta');

    const stats = getChannelStats(channelId);
    expect(stats).toBeDefined();
    expect(stats!.messageCount).toBe(0);
  });

  it('channel with malformed source_metadata JSON does not crash stats', () => {
    const db = getDb();
    const channelId = uuidv4();
    db.prepare(
      `INSERT INTO channels (id, name, source, source_metadata)
       VALUES (?, ?, 'claude-code', '{not valid json')`
    ).run(channelId, 'bad-meta');

    // Stats shouldn't depend on source_metadata parsing
    const stats = getChannelStats(channelId);
    expect(stats).toBeDefined();
    expect(stats!.messageCount).toBe(0);
  });

  it('channel with empty cwd in source_metadata is handled', () => {
    const db = getDb();
    const channelId = uuidv4();
    db.prepare(
      `INSERT INTO channels (id, name, source, source_metadata)
       VALUES (?, ?, 'claude-code', ?)`
    ).run(channelId, 'empty-cwd', JSON.stringify({ cwd: '' }));

    const stats = getChannelStats(channelId);
    expect(stats).toBeDefined();
  });
});
