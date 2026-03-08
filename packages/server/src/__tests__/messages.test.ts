import { describe, it, expect, vi } from 'vitest';
import { createTestApp } from './app.js';
import { insertMessage } from '../db/queries.js';

// Mock the claude client so streaming doesn't actually call the API
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  activeStreams: new Map(),
  abortStream: vi.fn(() => false),
}));

const app = createTestApp();

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(`/api${path}`, init);
}

describe('POST /api/channels/:channelId/messages', () => {
  it('creates a message pair and returns IDs', async () => {
    const res = await req('POST', '/channels/default/messages', { content: 'hello' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userMessageId).toBeTruthy();
    expect(data.assistantMessageId).toBeTruthy();
    expect(data.model).toBeTruthy();
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
});

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

describe('POST /api/channels/:channelId/regenerate', () => {
  it('regenerates the last assistant message', async () => {
    insertMessage('default', 'user', 'question');
    insertMessage('default', 'assistant', 'answer', 'complete', 'claude-opus-4-6');

    const res = await req('POST', '/channels/default/regenerate');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistantMessageId).toBeTruthy();
    expect(data.model).toBeTruthy();
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
