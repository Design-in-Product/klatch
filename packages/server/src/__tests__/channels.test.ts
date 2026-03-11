import { describe, it, expect } from 'vitest';
import { createTestApp } from './app.js';
import { importSession } from '../db/queries.js';
import { DEFAULT_MODEL, DEFAULT_INTERACTION_MODE, DEFAULT_ENTITY_ID } from '@klatch/shared';

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

  it('defaults mode to panel', async () => {
    const res = await req('POST', '/channels', { name: 'no-mode' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.mode).toBe(DEFAULT_INTERACTION_MODE);
  });

  it('accepts valid mode', async () => {
    const res = await req('POST', '/channels', { name: 'rt-ch', mode: 'roundtable' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.mode).toBe('roundtable');
  });

  it('rejects invalid mode (400)', async () => {
    const res = await req('POST', '/channels', { name: 'ch', mode: 'freeform' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid mode');
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

  it('updates mode', async () => {
    const create = await req('POST', '/channels', { name: 'mode-test' });
    const { id } = await create.json();

    const res = await req('PATCH', `/channels/${id}`, { mode: 'roundtable' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mode).toBe('roundtable');
  });

  it('rejects invalid mode (400)', async () => {
    const res = await req('PATCH', '/channels/default', { mode: 'invalid' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid mode');
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

// ── Sidebar grouping (entityCount) ───────────────────────────

describe('GET /api/channels entityCount for sidebar grouping', () => {
  it('default channel has entityCount of 1 (Roles group)', async () => {
    const res = await req('GET', '/channels');
    const data = await res.json();
    const defaultCh = data.find((c: any) => c.id === 'default');
    expect(defaultCh.entityCount).toBe(1);
  });

  it('channel with 2 entities has entityCount of 2 (Channels group)', async () => {
    // Create channel + second entity
    const chRes = await req('POST', '/channels', { name: 'duo' });
    const ch = await chRes.json();

    const eRes = await req('POST', '/entities', { name: 'Second' });
    const entity = await eRes.json();
    await req('POST', `/channels/${ch.id}/entities`, { entityId: entity.id });

    const listRes = await req('GET', '/channels');
    const channels = await listRes.json();
    const duo = channels.find((c: any) => c.id === ch.id);
    expect(duo.entityCount).toBe(2);
  });

  it('entityCount updates when entity is removed (2→1 transitions Channels→Roles)', async () => {
    // Create channel with 2 entities
    const chRes = await req('POST', '/channels', { name: 'shrink' });
    const ch = await chRes.json();

    const eRes = await req('POST', '/entities', { name: 'Temp' });
    const entity = await eRes.json();
    await req('POST', `/channels/${ch.id}/entities`, { entityId: entity.id });

    // Verify it has 2
    let listRes = await req('GET', '/channels');
    let channels = await listRes.json();
    expect(channels.find((c: any) => c.id === ch.id).entityCount).toBe(2);

    // Remove the extra entity
    await req('DELETE', `/channels/${ch.id}/entities/${entity.id}`);

    // Now should be 1
    listRes = await req('GET', '/channels');
    channels = await listRes.json();
    expect(channels.find((c: any) => c.id === ch.id).entityCount).toBe(1);
  });

  it('entityCount updates when entity is added (1→2 transitions Roles→Channels)', async () => {
    const chRes = await req('POST', '/channels', { name: 'grow' });
    const ch = await chRes.json();

    // Starts at 1 (default entity auto-assigned)
    let listRes = await req('GET', '/channels');
    let channels = await listRes.json();
    expect(channels.find((c: any) => c.id === ch.id).entityCount).toBe(1);

    // Add a second entity
    const eRes = await req('POST', '/entities', { name: 'NewBot' });
    const entity = await eRes.json();
    await req('POST', `/channels/${ch.id}/entities`, { entityId: entity.id });

    // Now should be 2
    listRes = await req('GET', '/channels');
    channels = await listRes.json();
    expect(channels.find((c: any) => c.id === ch.id).entityCount).toBe(2);
  });
});

// ── Context file endpoint ───────────────────────────────────

describe('GET /api/channels/:id/context-file', () => {
  it('returns 404 for nonexistent channel', async () => {
    const res = await req('GET', '/channels/nonexistent/context-file');
    expect(res.status).toBe(404);
  });

  it('returns 400 for channel without source metadata', async () => {
    const res = await req('GET', '/channels/default/context-file');
    expect(res.status).toBe(400);
  });

  it('returns 400 for channel without cwd in metadata', async () => {
    const result = importSession({
      channelName: 'no-cwd',
      source: 'claude-ai',
      sourceMetadata: { originalSessionId: 'ctx-test-001' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'ev-1', userText: 'Hi', assistantText: 'Hello' },
      ],
    });

    const res = await req('GET', `/channels/${result.channelId}/context-file`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No project path');
  });

  it('returns 403 for disallowed file paths', async () => {
    const result = importSession({
      channelName: 'path-test',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'ctx-test-002', cwd: '/tmp/test-project' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'ev-1', userText: 'Hi', assistantText: 'Hello' },
      ],
    });

    // Try path traversal
    const res = await req('GET', `/channels/${result.channelId}/context-file?path=../../etc/passwd`);
    expect(res.status).toBe(403);
  });

  it('returns 404 when CLAUDE.md does not exist', async () => {
    const result = importSession({
      channelName: 'missing-claude-md',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'ctx-test-003', cwd: '/tmp/nonexistent-project' },
      turns: [
        { timestamp: '2026-03-01T10:00:00Z', originalId: 'ev-1', userText: 'Hi', assistantText: 'Hello' },
      ],
    });

    const res = await req('GET', `/channels/${result.channelId}/context-file`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.hint).toContain('paste');
  });
});
