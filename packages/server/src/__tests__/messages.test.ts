import { describe, it, expect, vi } from 'vitest';
import { createTestApp } from './app.js';
import {
  insertMessage,
  createChannel,
  createEntity,
  assignEntityToChannel,
  getMessages,
  importSession,
} from '../db/queries.js';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS } from '@klatch/shared';

// Mock the claude client so streaming doesn't actually call the API
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

const app = createTestApp();

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(`/api${path}`, init);
}

// ── Helper: create a roundtable channel with 2 entities ──────
async function createRoundtableChannel(): Promise<{ channelId: string; entity1Id: string; entity2Id: string }> {
  const channel = createChannel('rt-test', 'You are helpful.', DEFAULT_MODEL, 'roundtable');
  const entity2 = createEntity('Analyst', DEFAULT_MODEL, 'You are an analyst.', ENTITY_COLORS[1]);
  assignEntityToChannel(channel.id, entity2.id);
  return { channelId: channel.id, entity1Id: 'default-entity', entity2Id: entity2.id };
}

// ── Panel mode (default) ─────────────────────────────────────

describe('POST /api/channels/:channelId/messages', () => {
  it('creates a message and returns user ID + assistants array', async () => {
    const res = await req('POST', '/channels/default/messages', { content: 'hello' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userMessageId).toBeTruthy();
    expect(data.assistants).toBeTruthy();
    expect(Array.isArray(data.assistants)).toBe(true);
    expect(data.assistants.length).toBeGreaterThanOrEqual(1);
    expect(data.assistants[0].assistantMessageId).toBeTruthy();
    expect(data.assistants[0].entityId).toBeTruthy();
    expect(data.assistants[0].model).toBeTruthy();
  });

  it('rejects empty content (400)', async () => {
    const res = await req('POST', '/channels/default/messages', { content: '' });
    expect(res.status).toBe(400);
  });

  it('rejects whitespace-only content (400)', async () => {
    const res = await req('POST', '/channels/default/messages', { content: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent channel', async () => {
    const res = await req('POST', '/channels/nonexistent/messages', { content: 'hi' });
    expect(res.status).toBe(404);
  });

  it('stores entity_id on assistant messages', async () => {
    const res = await req('POST', '/channels/default/messages', { content: 'track entity' });
    const data = await res.json();
    const msgs = getMessages('default');
    const assistantMsg = msgs.find((m) => m.id === data.assistants[0].assistantMessageId);
    expect(assistantMsg).toBeTruthy();
    expect(assistantMsg!.entityId).toBe(data.assistants[0].entityId);
  });
});

// ── Roundtable mode ──────────────────────────────────────────

describe('POST /api/channels/:channelId/messages (roundtable)', () => {
  it('creates placeholders for all entities in roundtable mode', async () => {
    const { channelId, entity1Id, entity2Id } = await createRoundtableChannel();

    const res = await req('POST', `/channels/${channelId}/messages`, { content: 'discuss this' });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.userMessageId).toBeTruthy();
    expect(data.assistants).toHaveLength(2);
    const entityIds = data.assistants.map((a: any) => a.entityId).sort();
    expect(entityIds).toEqual([entity1Id, entity2Id].sort());

    // Verify DB has the right messages
    const msgs = getMessages(channelId);
    const userMsgs = msgs.filter((m) => m.role === 'user');
    const assistantMsgs = msgs.filter((m) => m.role === 'assistant');
    expect(userMsgs).toHaveLength(1);
    expect(assistantMsgs).toHaveLength(2);
    const dbEntityIds = assistantMsgs.map((m) => m.entityId).sort();
    expect(dbEntityIds).toEqual([entity1Id, entity2Id].sort());
  });

  it('calls streamClaudeRoundtable (not streamClaude)', async () => {
    const { streamClaude, streamClaudeRoundtable } = await import('../claude/client.js');
    vi.mocked(streamClaude).mockClear();
    vi.mocked(streamClaudeRoundtable).mockClear();

    const { channelId } = await createRoundtableChannel();
    await req('POST', `/channels/${channelId}/messages`, { content: 'hello roundtable' });

    expect(streamClaudeRoundtable).toHaveBeenCalledTimes(1);
    expect(streamClaude).not.toHaveBeenCalled();
  });
});

// ── Directed mode ────────────────────────────────────────────

describe('POST /api/channels/:channelId/messages (directed)', () => {
  it('returns 400 when no @-mention in directed mode', async () => {
    const channel = createChannel('directed-ch', 'sys', DEFAULT_MODEL, 'directed');
    const res = await req('POST', `/channels/${channel.id}/messages`, { content: 'hello' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('No entity mentioned');
  });

  it('routes to mentioned entity by name', async () => {
    const channel = createChannel('dir-test', 'sys', DEFAULT_MODEL, 'directed');
    const res = await req('POST', `/channels/${channel.id}/messages`, { content: '@Claude hello' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistants).toHaveLength(1);
    expect(data.assistants[0].entityId).toBe(DEFAULT_ENTITY_ID);
  });

  it('routes to entity by handle', async () => {
    const channel = createChannel('dir-handle', 'sys', DEFAULT_MODEL, 'directed');
    // Create entity with handle
    const entity = createEntity('Chief of Staff', DEFAULT_MODEL, 'sys', ENTITY_COLORS[1], 'exec');
    assignEntityToChannel(channel.id, entity.id);

    const res = await req('POST', `/channels/${channel.id}/messages`, { content: '@exec what do you think?' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistants).toHaveLength(1);
    expect(data.assistants[0].entityId).toBe(entity.id);
  });

  it('supports multi-mention to reach multiple entities', async () => {
    const channel = createChannel('dir-multi', 'sys', DEFAULT_MODEL, 'directed');
    const entity2 = createEntity('Reviewer', DEFAULT_MODEL, 'sys', ENTITY_COLORS[1]);
    assignEntityToChannel(channel.id, entity2.id);

    const res = await req('POST', `/channels/${channel.id}/messages`, {
      content: '@Claude @Reviewer please review',
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistants).toHaveLength(2);
  });
});

// ── Delete messages ──────────────────────────────────────────

describe('DELETE /api/channels/:channelId/messages', () => {
  it('clears all messages', async () => {
    // Seed some messages
    insertMessage('default', 'user', 'a');
    insertMessage('default', 'assistant', 'b');

    const res = await req('DELETE', '/channels/default/messages');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBeGreaterThanOrEqual(2);
  });
});

describe('DELETE /api/messages/:id', () => {
  it('deletes a message', async () => {
    const msg = insertMessage('default', 'user', 'deleteme');
    const res = await req('DELETE', `/messages/${msg.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);
  });

  it('returns 404 for nonexistent message', async () => {
    const res = await req('DELETE', '/messages/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ── Stop streaming ───────────────────────────────────────────

describe('POST /api/messages/:id/stop', () => {
  it('returns 404 when no active stream exists', async () => {
    const msg = insertMessage('default', 'assistant', 'done', 'complete');
    const res = await req('POST', `/messages/${msg.id}/stop`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/channels/:channelId/stop', () => {
  it('returns stopped count (0 when nothing streaming)', async () => {
    const res = await req('POST', '/channels/default/stop');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.stopped).toBe(0);
  });
});

// ── Regenerate ───────────────────────────────────────────────

describe('POST /api/channels/:channelId/regenerate', () => {
  it('regenerates the last assistant message (panel mode)', async () => {
    insertMessage('default', 'user', 'question');
    insertMessage('default', 'assistant', 'answer', 'complete', 'claude-opus-4-6');

    const res = await req('POST', '/channels/default/regenerate');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistantMessageId).toBeTruthy();
    expect(data.model).toBeTruthy();
    expect(data.assistants).toHaveLength(1);
  });

  it('returns 404 when no assistant message exists', async () => {
    // Create a fresh channel with no messages
    const createRes = await app.request('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'empty-ch' }),
    });
    const { id } = await createRes.json();

    const res = await req('POST', `/channels/${id}/regenerate`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for nonexistent channel', async () => {
    const res = await req('POST', '/channels/nonexistent/regenerate');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/channels/:channelId/regenerate (roundtable)', () => {
  it('deletes all last-round assistant messages and recreates them', async () => {
    const { channelId, entity1Id, entity2Id } = await createRoundtableChannel();

    // Simulate a completed round: user msg + 2 assistant msgs
    insertMessage(channelId, 'user', 'discuss this');
    insertMessage(channelId, 'assistant', 'entity1 response', 'complete', DEFAULT_MODEL, entity1Id);
    insertMessage(channelId, 'assistant', 'entity2 response', 'complete', DEFAULT_MODEL, entity2Id);

    const res = await req('POST', `/channels/${channelId}/regenerate`);
    expect(res.status).toBe(200);
    const data = await res.json();

    // Should return assistants array with new IDs for both entities
    expect(data.assistants).toHaveLength(2);
    const entityIds = data.assistants.map((a: any) => a.entityId).sort();
    expect(entityIds).toEqual([entity1Id, entity2Id].sort());

    // DB should have: 1 user msg + 2 new assistant placeholders (old ones deleted)
    const msgs = getMessages(channelId);
    const userMsgs = msgs.filter((m) => m.role === 'user');
    const assistantMsgs = msgs.filter((m) => m.role === 'assistant');
    expect(userMsgs).toHaveLength(1);
    expect(assistantMsgs).toHaveLength(2);
    // New messages should be streaming status (placeholders)
    expect(assistantMsgs.every((m) => m.status === 'streaming')).toBe(true);
  });

  it('calls streamClaudeRoundtable on regenerate', async () => {
    const { streamClaudeRoundtable } = await import('../claude/client.js');
    vi.mocked(streamClaudeRoundtable).mockClear();

    const { channelId, entity1Id, entity2Id } = await createRoundtableChannel();
    insertMessage(channelId, 'user', 'q');
    insertMessage(channelId, 'assistant', 'a1', 'complete', DEFAULT_MODEL, entity1Id);
    insertMessage(channelId, 'assistant', 'a2', 'complete', DEFAULT_MODEL, entity2Id);

    await req('POST', `/channels/${channelId}/regenerate`);
    expect(streamClaudeRoundtable).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when roundtable channel has no assistant messages', async () => {
    const { channelId } = await createRoundtableChannel();

    const res = await req('POST', `/channels/${channelId}/regenerate`);
    expect(res.status).toBe(404);
  });
});

// ── Imported channel messaging ──────────────────────────────

describe('POST /api/channels/:channelId/messages (imported channel)', () => {
  it('accepts messages in an imported channel (fork continuity)', async () => {
    const { streamClaude } = await import('../claude/client.js');
    vi.mocked(streamClaude).mockClear();

    // Create an imported channel with some history
    const result = importSession({
      channelName: 'test-import',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'test-fork-001', cwd: '/tmp/test' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'ev-1', userText: 'What is this project?', assistantText: 'This is a test project.' },
        { timestamp: '2026-03-01T10:01:00Z', originalId: 'ev-2', userText: 'Show me the code', assistantText: 'Here is the code.' },
      ],
    });

    // Send a new message to the imported channel
    const res = await req('POST', `/channels/${result.channelId}/messages`, { content: 'Continue from here' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userMessageId).toBeTruthy();
    expect(data.assistants).toHaveLength(1);
    expect(data.assistants[0].assistantMessageId).toBeTruthy();

    // streamClaude should have been called
    expect(streamClaude).toHaveBeenCalledTimes(1);
  });

  it('filters out empty-content messages from imported history', async () => {
    // Import a session with an empty assistant message (has artifacts so it gets stored)
    const result = importSession({
      channelName: 'test-empty-filter',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'test-empty-001' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'ev-1', userText: 'Hello', assistantText: 'Hi there!' },
        { timestamp: '2026-03-01T10:01:00Z', originalId: 'ev-2', userText: 'Do something', assistantText: '', artifacts: [{ type: 'tool_use' as const, toolName: 'Bash', inputSummary: 'npm test' }] },
        { timestamp: '2026-03-01T10:02:00Z', originalId: 'ev-3', userText: 'What happened?', assistantText: 'I ran some tools.' },
      ],
    });

    // Verify all messages are in DB (3 user + 3 assistant, including empty one with artifact)
    const allMsgs = getMessages(result.channelId);
    expect(allMsgs).toHaveLength(6);

    // The empty assistant message should be in DB but filtered from history
    const emptyAssistant = allMsgs.find((m) => m.role === 'assistant' && m.content === '');
    expect(emptyAssistant).toBeTruthy();

    // Send a message — should succeed without sending empty content to API
    const res = await req('POST', `/channels/${result.channelId}/messages`, { content: 'Continue' });
    expect(res.status).toBe(200);
  });
});
