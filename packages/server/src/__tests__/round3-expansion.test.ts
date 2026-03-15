/**
 * Round 3 integration tests: Test expansion across four areas
 *
 * Assignment from Daedalus (2026-03-14 21:34):
 * 1. Claude Code import via HTTP (JSONL path endpoint)
 * 2. Compaction API (state storage, continuation, clear on delete)
 * 3. Entity CRUD edge cases (assignment, modes, limits, deletion cascade)
 * 4. Streaming route tests (SSE lifecycle, abort, race conditions)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createChannel,
  createEntity,
  getChannel,
  getChannelEntities,
  assignEntityToChannel,
  removeEntityFromChannel,
  getChannelEntityCount,
  updateChannelCompaction,
  clearChannelCompaction,
  insertMessage,
  getMessages,
  deleteAllMessages,
  getMessage,
  deleteEntity,
  updateMessage,
} from '../db/queries.js';
import { activeStreams } from '../claude/client.js';
import { EventEmitter } from 'events';
import type { StreamEvent } from '@klatch/shared';
import { DEFAULT_ENTITY_ID, AVAILABLE_MODELS, ENTITY_COLORS } from '@klatch/shared';

// Mock streaming to avoid real API calls
vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

function createApp() {
  return createTestApp();
}

function jsonReq(body: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── 1. Claude Code import via HTTP ──────────────────────────────

describe('POST /api/import/claude-code — HTTP integration', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('returns 400 when sessionPath is missing', async () => {
    const res = await app.request('/api/import/claude-code', jsonReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('sessionPath');
  });

  it('returns 400 for non-.jsonl file extension', async () => {
    const res = await app.request('/api/import/claude-code', jsonReq({
      sessionPath: '/tmp/session.json',
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('.jsonl');
  });

  it('returns 404 for non-existent file', async () => {
    const res = await app.request('/api/import/claude-code', jsonReq({
      sessionPath: '/tmp/nonexistent-session-abc123.jsonl',
    }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('not found');
  });

  it('returns 400 for path with directory traversal', async () => {
    const res = await app.request('/api/import/claude-code', jsonReq({
      sessionPath: '/tmp/../../../etc/passwd.jsonl',
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  it('returns JSON error response (not plain text)', async () => {
    const res = await app.request('/api/import/claude-code', jsonReq({
      sessionPath: '/nonexistent/path.jsonl',
    }));
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('json');
  });
});

// ── 2. Compaction API ───────────────────────────────────────────

describe('compaction state storage and continuation', () => {
  it('stores compaction state on channel', () => {
    const channel = createChannel('Test', '');
    const compState = {
      summary: 'User discussed TypeScript best practices and Vitest testing.',
      timestamp: '2026-03-14T10:00:00Z',
      beforeMessageId: 'msg-boundary',
    };

    updateChannelCompaction(channel.id, compState);

    const updated = getChannel(channel.id);
    expect(updated).toBeDefined();
    expect(updated!.compactionState).toBeTruthy();
    const parsed = JSON.parse(updated!.compactionState!);
    expect(parsed.summary).toBe('User discussed TypeScript best practices and Vitest testing.');
    expect(parsed.timestamp).toBe('2026-03-14T10:00:00Z');
    expect(parsed.beforeMessageId).toBe('msg-boundary');
  });

  it('overwrites compaction state on subsequent update', () => {
    const channel = createChannel('Test', '');

    updateChannelCompaction(channel.id, {
      summary: 'First summary.',
      timestamp: '2026-03-14T10:00:00Z',
      beforeMessageId: 'msg-1',
    });

    updateChannelCompaction(channel.id, {
      summary: 'Second summary (compacted again).',
      timestamp: '2026-03-14T11:00:00Z',
      beforeMessageId: 'msg-5',
    });

    const updated = getChannel(channel.id);
    const parsed = JSON.parse(updated!.compactionState!);
    expect(parsed.summary).toBe('Second summary (compacted again).');
    expect(parsed.beforeMessageId).toBe('msg-5');
  });

  it('clearChannelCompaction removes state', () => {
    const channel = createChannel('Test', '');
    updateChannelCompaction(channel.id, {
      summary: 'Will be cleared.',
      timestamp: '2026-03-14T10:00:00Z',
      beforeMessageId: 'msg-1',
    });

    clearChannelCompaction(channel.id);

    const updated = getChannel(channel.id);
    expect(updated!.compactionState).toBeFalsy();
  });

  it('DELETE /api/channels/:id/messages clears compaction state', async () => {
    const channel = createChannel('Compacted Channel', '');
    insertMessage(channel.id, 'user', 'Hello', 'complete');
    insertMessage(channel.id, 'assistant', 'Hi there!', 'complete');

    updateChannelCompaction(channel.id, {
      summary: 'User said hello.',
      timestamp: '2026-03-14T10:00:00Z',
      beforeMessageId: 'msg-1',
    });

    // Verify compaction exists
    let ch = getChannel(channel.id);
    expect(ch!.compactionState).toBeTruthy();

    // Delete all messages via API
    const app = createApp();
    const res = await app.request(`/api/channels/${channel.id}/messages`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    // Compaction state should be cleared
    ch = getChannel(channel.id);
    expect(ch!.compactionState).toBeFalsy();

    // Messages should be gone
    const messages = getMessages(channel.id);
    expect(messages).toHaveLength(0);
  });

  it('compaction state survives channel updates', async () => {
    const channel = createChannel('Test', 'Original prompt');
    updateChannelCompaction(channel.id, {
      summary: 'Important context.',
      timestamp: '2026-03-14T10:00:00Z',
      beforeMessageId: 'msg-1',
    });

    // Update channel name via API
    const app = createApp();
    await app.request(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed Channel' }),
    });

    // Compaction state should still be there
    const ch = getChannel(channel.id);
    expect(ch!.name).toBe('Renamed Channel');
    expect(ch!.compactionState).toBeTruthy();
    const parsed = JSON.parse(ch!.compactionState!);
    expect(parsed.summary).toBe('Important context.');
  });
});

// ── 3. Entity CRUD edge cases ───────────────────────────────────

describe('entity assignment edge cases', () => {
  it('assigns multiple entities up to max (5)', () => {
    const channel = createChannel('Multi-entity', '');
    const entities = [];
    for (let i = 0; i < 4; i++) {
      const e = createEntity(`Entity ${i}`, 'claude-opus-4-6', '', ENTITY_COLORS[i % ENTITY_COLORS.length]);
      entities.push(e);
      assignEntityToChannel(channel.id, e.id);
    }

    // Default entity + 4 added = 5 total
    expect(getChannelEntityCount(channel.id)).toBe(5);
  });

  it('enforces max entities per channel via API', async () => {
    const channel = createChannel('Full Channel', '');
    // Default entity already assigned (1), add 4 more to reach limit
    for (let i = 0; i < 4; i++) {
      const e = createEntity(`Fill ${i}`, 'claude-opus-4-6', '', ENTITY_COLORS[i % ENTITY_COLORS.length]);
      assignEntityToChannel(channel.id, e.id);
    }
    expect(getChannelEntityCount(channel.id)).toBe(5);

    // Try to add a 6th via API
    const extra = createEntity('Too Many', 'claude-opus-4-6', '', '#FF0000');
    const app = createApp();
    const res = await app.request(`/api/channels/${channel.id}/entities`, jsonReq({
      entityId: extra.id,
    }));
    expect(res.status).toBe(400);
  });

  it('prevents removal of last entity from channel via API', async () => {
    const channel = createChannel('Solo Entity', '');
    // Only default entity assigned
    expect(getChannelEntityCount(channel.id)).toBe(1);

    const app = createApp();
    const res = await app.request(`/api/channels/${channel.id}/entities/${DEFAULT_ENTITY_ID}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('entity deletion cascades removal from channels', () => {
    const channel = createChannel('Test', '');
    const entity = createEntity('Temp Entity', 'claude-opus-4-6', '', '#00FF00');
    assignEntityToChannel(channel.id, entity.id);

    expect(getChannelEntityCount(channel.id)).toBe(2); // default + temp

    // Delete entity
    deleteEntity(entity.id);

    // Should be down to just default entity
    expect(getChannelEntityCount(channel.id)).toBe(1);
    const remaining = getChannelEntities(channel.id);
    expect(remaining[0].id).toBe(DEFAULT_ENTITY_ID);
  });

  it('cannot delete default entity via API', async () => {
    const app = createApp();
    const res = await app.request(`/api/entities/${DEFAULT_ENTITY_ID}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(400);
  });

  it('duplicate assignment is idempotent (INSERT OR IGNORE)', () => {
    const channel = createChannel('Test', '');
    const entity = createEntity('Dup Test', 'claude-opus-4-6', '', '#0000FF');
    assignEntityToChannel(channel.id, entity.id);
    assignEntityToChannel(channel.id, entity.id); // duplicate

    expect(getChannelEntityCount(channel.id)).toBe(2); // default + entity, not 3
  });
});

describe('entity handle and model validation', () => {
  it('creates entity with handle', async () => {
    const app = createApp();
    const res = await app.request('/api/entities', jsonReq({
      name: 'Research Bot',
      handle: 'researcher',
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.handle).toBe('researcher');
  });

  it('allows multiple entities with same handle (no uniqueness constraint)', async () => {
    const app = createApp();
    await app.request('/api/entities', jsonReq({ name: 'Bot A', handle: 'shared-handle' }));
    const res = await app.request('/api/entities', jsonReq({ name: 'Bot B', handle: 'shared-handle' }));
    expect(res.status).toBe(201);
  });

  it('rejects invalid model on create', async () => {
    const app = createApp();
    const res = await app.request('/api/entities', jsonReq({
      name: 'Bad Model',
      model: 'gpt-4-not-real',
    }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid model on update', async () => {
    const entity = createEntity('Test', 'claude-opus-4-6', '', '#FF0000');
    const app = createApp();
    const res = await app.request(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'fake-model-123' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('channel mode switching', () => {
  it('PATCH /api/channels/:id sets mode to roundtable', async () => {
    const channel = createChannel('Panel Channel', '');
    const app = createApp();
    const res = await app.request(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'roundtable' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe('roundtable');
  });

  it('PATCH /api/channels/:id sets mode to directed', async () => {
    const channel = createChannel('Panel Channel', '');
    const app = createApp();
    const res = await app.request(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'directed' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe('directed');
  });

  it('directed mode requires @-mention (returns 400 without)', async () => {
    const channel = createChannel('Directed Channel', '');

    // Set mode to directed
    const app = createApp();
    await app.request(`/api/channels/${channel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'directed' }),
    });

    // Send message without @-mention
    const res = await app.request(`/api/channels/${channel.id}/messages`, jsonReq({
      content: 'Hello without mention',
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No entity mentioned');
  });
});

// ── 4. Streaming route tests ────────────────────────────────────

describe('SSE streaming lifecycle', () => {
  it('GET /messages/:id/stream returns complete content for finished message', async () => {
    const channel = createChannel('Stream Test', '');
    const msg = insertMessage(channel.id, 'assistant', 'Hello, world!', 'complete');

    const app = createApp();
    const res = await app.request(`/api/messages/${msg.id}/stream`);
    expect(res.status).toBe(200);

    // SSE response contains message_complete event
    const text = await res.text();
    expect(text).toContain('message_complete');
    expect(text).toContain('Hello, world!');
  });

  it('GET /messages/:id/stream returns error content for errored message', async () => {
    const channel = createChannel('Error Test', '');
    const msg = insertMessage(channel.id, 'assistant', 'Something went wrong', 'error');

    const app = createApp();
    const res = await app.request(`/api/messages/${msg.id}/stream`);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain('error');
    expect(text).toContain('Something went wrong');
  });

  it('race condition: stream finished before SSE connects — DB fallback', async () => {
    const channel = createChannel('Race Test', '');
    const msg = insertMessage(channel.id, 'assistant', '', 'streaming');

    // Simulate: stream completed and emitter was cleaned up before SSE connects
    // Update message to complete in DB (as if stream finished)
    updateMessage(msg.id, 'Completed before SSE connected.', 'complete');

    // No active emitter — SSE should fall back to DB
    const app = createApp();
    const res = await app.request(`/api/messages/${msg.id}/stream`);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain('message_complete');
    expect(text).toContain('Completed before SSE connected.');
  });

  it('POST /messages/:id/stop returns 404 for non-streaming message', async () => {
    const channel = createChannel('Stop Test', '');
    const msg = insertMessage(channel.id, 'assistant', 'Done', 'complete');

    const app = createApp();
    const res = await app.request(`/api/messages/${msg.id}/stop`, { method: 'POST' });
    expect(res.status).toBe(404);
  });

  it('POST /channels/:channelId/stop stops active streams', async () => {
    const channel = createChannel('Bulk Stop', '');
    // No active streams — should return stopped: 0
    const app = createApp();
    const res = await app.request(`/api/channels/${channel.id}/stop`, { method: 'POST' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stopped).toBe(0);
  });
});

describe('SSE with active emitter', () => {
  it('forwards events from emitter to SSE client', async () => {
    const channel = createChannel('Emitter Test', '');
    const msg = insertMessage(channel.id, 'assistant', '', 'streaming');

    // Create an emitter and register it
    const emitter = new EventEmitter();
    activeStreams.set(msg.id, emitter);

    // Start SSE request (don't await — it blocks until stream completes)
    const app = createApp();
    const responsePromise = app.request(`/api/messages/${msg.id}/stream`);

    // Give SSE time to connect and subscribe
    await new Promise(r => setTimeout(r, 50));

    // Emit events
    emitter.emit('data', {
      type: 'text_delta',
      messageId: msg.id,
      content: 'Hello',
    } satisfies StreamEvent);

    emitter.emit('data', {
      type: 'message_complete',
      messageId: msg.id,
      content: 'Hello, world!',
    } satisfies StreamEvent);

    // Clean up
    activeStreams.delete(msg.id);

    const res = await responsePromise;
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain('text_delta');
    expect(text).toContain('message_complete');
    expect(text).toContain('Hello, world!');
  });
});

describe('message posting', () => {
  it('POST to channel requires non-empty content', async () => {
    const app = createApp();
    const res = await app.request('/api/channels/default/messages', jsonReq({
      content: '   ',
    }));
    expect(res.status).toBe(400);
  });

  it('POST to non-existent channel returns 404', async () => {
    const app = createApp();
    const res = await app.request('/api/channels/doesnt-exist/messages', jsonReq({
      content: 'Hello',
    }));
    expect(res.status).toBe(404);
  });

  it('panel mode creates user message + assistant placeholders', async () => {
    const app = createApp();
    const res = await app.request('/api/channels/default/messages', jsonReq({
      content: 'Hello Claude',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.userMessageId).toBeTruthy();
    expect(body.assistants).toBeDefined();
    expect(body.assistants.length).toBeGreaterThan(0);
    expect(body.assistants[0].assistantMessageId).toBeTruthy();
    expect(body.assistants[0].entityId).toBe(DEFAULT_ENTITY_ID);
  });

  it('regenerate on empty channel returns 404', async () => {
    const channel = createChannel('Empty Regen', '');
    const app = createApp();
    const res = await app.request(`/api/channels/${channel.id}/regenerate`, { method: 'POST' });
    expect(res.status).toBe(404);
  });
});

export {};
