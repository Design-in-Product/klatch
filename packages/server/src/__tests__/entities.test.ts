import './setup.js';
import { describe, it, expect, vi } from 'vitest';
import { createTestApp } from './app.js';
import { DEFAULT_ENTITY_ID, ENTITY_COLORS, DEFAULT_MODEL } from '@klatch/shared';
import { createEntity, createChannel } from '../db/queries.js';

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

describe('GET /api/entities/:id/klatches (cross-reference)', () => {
  it('returns only the klatches the entity is in (not its 1-1 chat)', async () => {
    const actor = createEntity('XActor', DEFAULT_MODEL, 'p', '#abc123');
    const other = createEntity('XOther', DEFAULT_MODEL, 'p', '#def456');
    createChannel('x-1-1', 'p', undefined, undefined, 'chat', [actor.id]);
    const k1 = createChannel('x-standup', 'p', undefined, 'panel', 'klatch', [actor.id, other.id]);

    const res = await req('GET', `/entities/${actor.id}/klatches`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.map((c: any) => c.id)).toContain(k1.id);
    expect(data.every((c: any) => c.type === 'klatch')).toBe(true);
  });

  it('404s for an unknown entity', async () => {
    const res = await req('GET', '/entities/does-not-exist/klatches');
    expect(res.status).toBe(404);
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
    expect(data.model).toBe(DEFAULT_MODEL);
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

  // ── Round 220's half of the 2026-10-06 entity-delete ruling ──────────
  //
  // xian ruled an entity-less channel legal; Daedalus's unconditional half was
  // that the delete must *name* the channels it empties, which it did not.
  // These four cases are the floor for that: the sole-seat case, the
  // other-seats-remain case (the one a naive "every channel it was in" key gets
  // wrong), a multi-channel case, and the seated-nowhere case.

  it('names the channel it empties when the entity was its sole seat', async () => {
    const solo = createEntity('XSoleSeat', DEFAULT_MODEL, 'p', '#abc123');
    const ch = createChannel('x-emptied-by-delete', 'p', undefined, undefined, 'klatch', [solo.id]);

    const res = await req('DELETE', `/entities/${solo.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);
    expect(data.emptiedChannels).toEqual([{ id: ch.id, name: 'x-emptied-by-delete' }]);
  });

  it('does not name a channel where another entity remains seated', async () => {
    const going = createEntity('XGoing', DEFAULT_MODEL, 'p', '#abc123');
    const staying = createEntity('XStaying', DEFAULT_MODEL, 'p', '#def456');
    const shared = createChannel('x-survives-delete', 'p', undefined, 'panel', 'klatch', [going.id, staying.id]);

    const res = await req('DELETE', `/entities/${going.id}`);
    const data = await res.json();
    expect(data.emptiedChannels).toEqual([]);

    // And the channel really does still have a seat — the response is not just
    // quiet about a channel it emptied anyway.
    const roster = await req('GET', `/channels/${shared.id}/entities`);
    expect((await roster.json()).map((e: any) => e.id)).toEqual([staying.id]);
  });

  it('names every channel it empties and only those', async () => {
    const multi = createEntity('XMulti', DEFAULT_MODEL, 'p', '#abc123');
    const other = createEntity('XOtherSeat', DEFAULT_MODEL, 'p', '#def456');
    const a = createChannel('x-multi-a', 'p', undefined, undefined, 'klatch', [multi.id]);
    const b = createChannel('x-multi-b', 'p', undefined, undefined, 'klatch', [multi.id]);
    createChannel('x-multi-shared', 'p', undefined, 'panel', 'klatch', [multi.id, other.id]);
    createChannel('x-multi-elsewhere', 'p', undefined, undefined, 'klatch', [other.id]);

    const res = await req('DELETE', `/entities/${multi.id}`);
    const data = await res.json();
    expect(data.emptiedChannels.map((ch: any) => ch.id).sort()).toEqual([a.id, b.id].sort());
  });

  it('returns an empty list — not a missing field — when the entity was seated nowhere', async () => {
    const create = await req('POST', '/entities', { name: 'XSeatedNowhere' });
    const { id } = await create.json();

    const res = await req('DELETE', `/entities/${id}`);
    const data = await res.json();
    expect(data.emptiedChannels).toEqual([]);
  });
});

// ── GET /entities/:id/delete-preview — the ask-before half of the ruling ──
//
// The delete above names what it emptied *afterwards*. xian's ruling asks the
// user first ("also delete this klatch?"), which needs the answer before the
// write. Every case here is keyed on the preview *agreeing with the delete*
// rather than on a hand-typed expectation: an endpoint whose answer is right in
// isolation and disagrees with the route it previews is the defect this exists
// to prevent, and a literal typed into both tests cannot see it.
describe('GET /api/entities/:id/delete-preview', () => {
  it('names the channels the delete then reports emptying — the two agree', async () => {
    const solo = createEntity('XPreviewSole', DEFAULT_MODEL, 'p', '#abc123');
    const other = createEntity('XPreviewOther', DEFAULT_MODEL, 'p', '#def456');
    const a = createChannel('x-preview-a', 'p', undefined, undefined, 'klatch', [solo.id]);
    const b = createChannel('x-preview-b', 'p', undefined, undefined, 'klatch', [solo.id]);
    // Shared and elsewhere: neither is emptied by this delete.
    createChannel('x-preview-shared', 'p', undefined, 'panel', 'klatch', [solo.id, other.id]);
    createChannel('x-preview-elsewhere', 'p', undefined, undefined, 'klatch', [other.id]);

    const preview = await req('GET', `/entities/${solo.id}/delete-preview`);
    expect(preview.status).toBe(200);
    const previewed = (await preview.json()).emptiedChannels;
    expect(previewed.map((ch: any) => ch.id).sort()).toEqual([a.id, b.id].sort());

    // The claim worth pinning is not the list — it is that the delete's own
    // answer is the same one. Compared whole (ids *and* names), because two
    // lists can agree on count and ids while a name drifts.
    const del = await req('DELETE', `/entities/${solo.id}`);
    expect(del.status).toBe(200);
    expect((await del.json()).emptiedChannels).toEqual(previewed);
  });

  it('is read-only — the entity and its seats survive a preview', async () => {
    const solo = createEntity('XPreviewReadOnly', DEFAULT_MODEL, 'p', '#abc123');
    const ch = createChannel('x-preview-readonly', 'p', undefined, undefined, 'klatch', [solo.id]);

    const first = await req('GET', `/entities/${solo.id}/delete-preview`);
    expect((await first.json()).emptiedChannels).toEqual([{ id: ch.id, name: 'x-preview-readonly' }]);

    // Entity still listed, seat still seated, and a second preview still finds
    // the channel — a preview that consumed the seats it reports would answer
    // `[]` the second time, which the single-call assertion above cannot see.
    const list = await req('GET', '/entities');
    expect((await list.json()).some((e: any) => e.id === solo.id)).toBe(true);
    const roster = await req('GET', `/channels/${ch.id}/entities`);
    expect((await roster.json()).map((e: any) => e.id)).toEqual([solo.id]);
    const second = await req('GET', `/entities/${solo.id}/delete-preview`);
    expect((await second.json()).emptiedChannels).toEqual([{ id: ch.id, name: 'x-preview-readonly' }]);
  });

  it('returns an empty list — not a missing field — when nothing would be emptied', async () => {
    const going = createEntity('XPreviewGoing', DEFAULT_MODEL, 'p', '#abc123');
    const staying = createEntity('XPreviewStaying', DEFAULT_MODEL, 'p', '#def456');
    createChannel('x-preview-survives', 'p', undefined, 'panel', 'klatch', [going.id, staying.id]);

    const res = await req('GET', `/entities/${going.id}/delete-preview`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.emptiedChannels).toEqual([]);
    expect('emptiedChannels' in data).toBe(true);
  });

  it('refuses an unknown entity exactly as the delete does', async () => {
    const preview = await req('GET', '/entities/does-not-exist/delete-preview');
    const del = await req('DELETE', '/entities/does-not-exist');
    expect(preview.status).toBe(404);
    expect(preview.status).toBe(del.status);
    const previewBody = await preview.json();
    // Non-vacuity first: two empty bodies would satisfy the equality below
    // while telling a client nothing.
    expect(typeof previewBody.error).toBe('string');
    expect(previewBody.error.length).toBeGreaterThan(0);
    expect(previewBody).toEqual(await del.json());
  });

  it('refuses the default entity exactly as the delete does', async () => {
    const preview = await req('GET', `/entities/${DEFAULT_ENTITY_ID}/delete-preview`);
    const del = await req('DELETE', `/entities/${DEFAULT_ENTITY_ID}`);
    expect(preview.status).toBe(400);
    expect(preview.status).toBe(del.status);
    const previewBody = await preview.json();
    expect(previewBody.error).toContain('default');
    // Compared against the delete rather than typed here: if either side's
    // wording changes, this goes red instead of the two silently diverging.
    expect(previewBody).toEqual(await del.json());
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

  it('allows removing the last entity from a channel, leaving it empty', async () => {
    // xian's ruling, 2026-10-06: an entity-less channel is a legal, if
    // anomalous, state — the client prompts to delete the klatch instead,
    // but the server no longer refuses.
    const res = await req('DELETE', `/channels/default/entities/${DEFAULT_ENTITY_ID}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);

    const entitiesRes = await req('GET', '/channels/default/entities');
    expect(await entitiesRes.json()).toEqual([]);
  });

  it('returns 404 if entity not assigned', async () => {
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
