import { describe, it, expect } from 'vitest';
import { createTestApp } from './app.js';
import { DEFAULT_MODEL } from '@klatch/shared';

const app = createTestApp();

function req(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return app.request(`/api${path}`, init);
}

describe('GET /api/channels', () => {
  it('returns channels including default', async () => {
    const res = await req('GET', '/channels');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((c: any) => c.id === 'default')).toBe(true);
  });
});

describe('POST /api/channels', () => {
  it('creates a channel (201)', async () => {
    const res = await req('POST', '/channels', { name: 'test-ch' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('test-ch');
    expect(data.model).toBe(DEFAULT_MODEL);
    expect(data.id).toBeTruthy();
  });

  it('rejects empty name (400)', async () => {
    const res = await req('POST', '/channels', { name: '' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('rejects whitespace-only name (400)', async () => {
    const res = await req('POST', '/channels', { name: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid model (400)', async () => {
    const res = await req('POST', '/channels', { name: 'ch', model: 'gpt-4' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid model');
  });

  it('accepts valid model', async () => {
    const res = await req('POST', '/channels', { name: 'ch', model: 'claude-sonnet-4-6' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.model).toBe('claude-sonnet-4-6');
  });

  it('trims name and defaults systemPrompt', async () => {
    const res = await req('POST', '/channels', { name: '  trimmed  ' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('trimmed');
    expect(data.systemPrompt).toBe('You are a helpful assistant.');
  });
});

describe('PATCH /api/channels/:id', () => {
  it('updates a channel', async () => {
    const create = await req('POST', '/channels', { name: 'patchme' });
    const { id } = await create.json();

    const res = await req('PATCH', `/channels/${id}`, { name: 'patched' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('patched');
  });

  it('rejects invalid model (400)', async () => {
    const res = await req('PATCH', '/channels/default', { model: 'bad-model' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent channel', async () => {
    const res = await req('PATCH', '/channels/nope', { name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/channels/:id', () => {
  it('deletes a channel', async () => {
    const create = await req('POST', '/channels', { name: 'deleteme' });
    const { id } = await create.json();

    const res = await req('DELETE', `/channels/${id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);
  });

  it('rejects deleting default channel (400)', async () => {
    const res = await req('DELETE', '/channels/default');
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('default');
  });

  it('returns 404 for nonexistent channel', async () => {
    const res = await req('DELETE', '/channels/nonexistent');
    expect(res.status).toBe(404);
  });
});
