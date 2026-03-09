import { describe, it, expect, vi } from 'vitest';
import { createTestApp } from './app.js';
import { DEFAULT_ENTITY_ID, ENTITY_COLORS, DEFAULT_MODEL } from '@klatch/shared';

// Mock the claude client
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

// ── Phase 6b: Entity CRUD ───────────────────────────────────

describe('GET /api/entities', () => {
  it('returns array including default entity', async () => {
    const res = await req('GET', '/entities');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((e: any) => e.id === DEFAULT_ENTITY_ID)).toBe(true);
  });

  it('default entity has expected fields', async () => {
    const res = await req('GET', '/entities');
    const data = await res.json();
    const def = data.find((e: any) => e.id === DEFAULT_ENTITY_ID);
    expect(def.name).toBe('Claude');
    expect(def.model).toBe(DEFAULT_MODEL);
    expect(def.color).toBe(ENTITY_COLORS[0]);
    expect(def.systemPrompt).toBeTruthy();
    expect(def.createdAt).toBeTruthy();
  });
});

describe('POST /api/entities', () => {
  it('creates entity with name, model, systemPrompt, color', async () => {
    const res = await req('POST', '/entities', {
      name: 'Reviewer',
      model: 'claude-sonnet-4-6',
      systemPrompt: 'Review code.',
      color: '#ef4444',
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('Reviewer');
    expect(data.model).toBe('claude-sonnet-4-6');
    expect(data.systemPrompt).toBe('Review code.');
    expect(data.color).toBe('#ef4444');
    expect(data.id).toBeTruthy();
    expect(data.createdAt).toBeTruthy();
  });

  it('rejects empty name (400)', async () => {
    const res = await req('POST', '/entities', { name: '' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('rejects whitespace-only name (400)', async () => {
    const res = await req('POST', '/entities', { name: '   ' });
    expect(res.status).toBe(400);
  });

  it('defaults model and systemPrompt', async () => {
    const res = await req('POST', '/entities', { name: 'MinBot' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.model).toBe('claude-opus-4-6');
    expect(data.systemPrompt).toBe('You are a helpful assistant.');
  });

  it('auto-picks color when not provided', async () => {
    const res = await req('POST', '/entities', { name: 'ColorBot' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.color).toBeTruthy();
  });
});

describe('POST /api/entities (handle)', () => {
  it('creates entity with handle', async () => {
    const res = await req('POST', '/entities', {
      name: 'Chief of Staff',
      handle: 'exec',
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.handle).toBe('exec');
  });

  it('handle defaults to undefined when not provided', async () => {
    const res = await req('POST', '/entities', { name: 'NoHandle' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.handle).toBeUndefined();
  });
});

describe('PATCH /api/entities/:id (handle)', () => {
  it('updates handle', async () => {
    const create = await req('POST', '/entities', { name: 'HandleBot' });
    const { id } = await create.json();

    const res = await req('PATCH', `/entities/${id}`, { handle: 'hbot' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.handle).toBe('hbot');
  });

  it('clears handle when set to null', async () => {
    const create = await req('POST', '/entities', { name: 'ClearMe', handle: 'clear' });
    const { id } = await create.json();

    const res = await req('PATCH', `/entities/${id}`, { handle: null });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.handle).toBeUndefined();
  });

  it('clears handle when set to empty string', async () => {
    const create = await req('POST', '/entities', { name: 'EmptyH', handle: 'em' });
    const { id } = await create.json();

    const res = await req('PATCH', `/entities/${id}`, { handle: '' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.handle).toBeUndefined();
  });
});

describe('PATCH /api/entities/:id', () => {
  it('updates entity fields', async () => {
    const create = await req('POST', '/entities', { name: 'PatchMe' });
    const { id } = await create.json();

    const res = await req('PATCH', `/entities/${id}`, { name: 'Patched', color: '#000' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('Patched');
    expect(data.color).toBe('#000');
  });

  it('rejects invalid model (400)', async () => {
    const create = await req('POST', '/entities', { name: 'Bot' });
    const { id } = await create.json();

    const res = await req('PATCH', `/entities/${id}`, { model: 'gpt-4' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent entity', async () => {
    const res = await req('PATCH', '/entities/nope', { name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/entities/:id', () => {
  it('deletes an entity', async () => {
    const create = await req('POST', '/entities', { name: 'Doomed' });
    const { id } = await create.json();

    const res = await req('DELETE', `/entities/${id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);
  });

  it('cannot delete default entity (400)', async () => {
    const res = await req('DELETE', `/entities/${DEFAULT_ENTITY_ID}`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('default');
  });

  it('returns 404 for nonexistent entity', async () => {
    const res = await req('DELETE', '/entities/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ── Phase 6c: Channel-Entity Assignment ─────────────────────

describe('GET /api/channels/:id/entities', () => {
  it('returns assigned entities for default channel', async () => {
    const res = await req('GET', '/channels/default/entities');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((e: any) => e.id === DEFAULT_ENTITY_ID)).toBe(true);
  });

  it('returns 404 for nonexistent channel', async () => {
    const res = await req('GET', '/channels/nonexistent/entities');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/channels/:id/entities', () => {
  it('assigns an entity to a channel', async () => {
    // Create a new entity
    const createEntity = await req('POST', '/entities', { name: 'Assigner' });
    const entity = await createEntity.json();

    const res = await req('POST', '/channels/default/entities', { entityId: entity.id });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((e: any) => e.id === entity.id)).toBe(true);
  });

  it('returns 404 for nonexistent channel', async () => {
    const res = await req('POST', '/channels/nonexistent/entities', { entityId: DEFAULT_ENTITY_ID });
    expect(res.status).toBe(404);
  });

  it('returns 404 for nonexistent entity', async () => {
    const res = await req('POST', '/channels/default/entities', { entityId: 'fake-entity' });
    expect(res.status).toBe(404);
  });

  it('enforces max entities per channel', async () => {
    // Create a fresh channel
    const chRes = await req('POST', '/channels', { name: 'max-test' });
    const ch = await chRes.json();

    // Create and assign 4 more entities (1 default already assigned = 5 total)
    for (let i = 0; i < 4; i++) {
      const eRes = await req('POST', '/entities', { name: `Bot${i}` });
      const e = await eRes.json();
      await req('POST', `/channels/${ch.id}/entities`, { entityId: e.id });
    }

    // 6th should fail
    const eRes = await req('POST', '/entities', { name: 'TooMany' });
    const e = await eRes.json();
    const res = await req('POST', `/channels/${ch.id}/entities`, { entityId: e.id });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Maximum');
  });
});

describe('DELETE /api/channels/:id/entities/:entityId', () => {
  it('unassigns an entity from a channel', async () => {
    // Create entity and assign to default channel
    const eRes = await req('POST', '/entities', { name: 'Removable' });
    const entity = await eRes.json();
    await req('POST', '/channels/default/entities', { entityId: entity.id });

    // Now remove it
    const res = await req('DELETE', `/channels/default/entities/${entity.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.every((e: any) => e.id !== entity.id)).toBe(true);
  });

  it('cannot remove the last entity from a channel (400)', async () => {
    const res = await req('DELETE', `/channels/default/entities/${DEFAULT_ENTITY_ID}`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('last');
  });

  it('returns 404 if entity not assigned (when channel has >1 entity)', async () => {
    // Need >1 entity so the "can't remove last" check doesn't fire first
    const e1 = await req('POST', '/entities', { name: 'Extra' });
    const extra = await e1.json();
    await req('POST', '/channels/default/entities', { entityId: extra.id });

    // Now try to remove an entity that's NOT assigned
    const e2 = await req('POST', '/entities', { name: 'NotAssigned' });
    const notAssigned = await e2.json();

    const res = await req('DELETE', `/channels/default/entities/${notAssigned.id}`);
    expect(res.status).toBe(404);
  });
});

// ── Phase 6d: Multi-entity streaming ────────────────────────

describe('Multi-entity streaming response format', () => {
  it('returns assistants array for single-entity channel', async () => {
    const res = await req('POST', '/channels/default/messages', { content: 'hello' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userMessageId).toBeTruthy();
    expect(Array.isArray(data.assistants)).toBe(true);
    expect(data.assistants).toHaveLength(1);
    expect(data.assistants[0].entityId).toBe(DEFAULT_ENTITY_ID);
  });

  it('returns assistants array with N elements for multi-entity channel', async () => {
    // Create a channel and add a second entity
    const chRes = await req('POST', '/channels', { name: 'multi-test' });
    const ch = await chRes.json();

    const eRes = await req('POST', '/entities', { name: 'SecondBot', model: 'claude-sonnet-4-6' });
    const entity = await eRes.json();
    await req('POST', `/channels/${ch.id}/entities`, { entityId: entity.id });

    const res = await req('POST', `/channels/${ch.id}/messages`, { content: 'hello both' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assistants).toHaveLength(2);
  });

  it('each assistant element has { assistantMessageId, entityId, model }', async () => {
    const res = await req('POST', '/channels/default/messages', { content: 'check shape' });
    const data = await res.json();
    for (const a of data.assistants) {
      expect(a.assistantMessageId).toBeTruthy();
      expect(a.entityId).toBeTruthy();
      expect(a.model).toBeTruthy();
    }
  });
});
