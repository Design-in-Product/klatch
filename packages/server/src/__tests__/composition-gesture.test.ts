/**
 * Composition gesture — POST /api/channels with an agent roster.
 *
 * Verifies the atomic-roster create path used by the "New Klatch" flow:
 * a klatch is seeded with exactly the selected agents (no stray default
 * entity), unknown entity IDs are rejected with a clean 400 before any
 * channel is created, and the default-entity fallback still holds for
 * rosterless creation (1:1 chat). Daedalus's implementation coverage;
 * Argus owns the extended-coverage round.
 */
import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { createEntity, getChannelEntities, getAllChannels } from '../db/queries.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';

// Mock streaming — not exercised here, but messageRoutes pulls in the client.
vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return { ...actual, streamClaude: vi.fn() };
});

function postJson(body: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('POST /api/channels — composition roster', () => {
  it('seeds a klatch with exactly the selected agents (no default entity)', async () => {
    const app = createTestApp();
    const a = createEntity('Alpha', 'claude-opus-4-6', 'p', '#111');
    const b = createEntity('Beta', 'claude-opus-4-6', 'p', '#222');

    const res = await app.request('/api/channels', postJson({
      name: 'Weekly Review', type: 'klatch', mode: 'panel', entityIds: [a.id, b.id],
    }));
    expect(res.status).toBe(201);
    const channel = await res.json();
    expect(channel.type).toBe('klatch');
    expect(channel.mode).toBe('panel');

    const ids = getChannelEntities(channel.id).map((e) => e.id).sort();
    expect(ids).toEqual([a.id, b.id].sort());
    expect(ids).not.toContain(DEFAULT_ENTITY_ID);
  });

  it('rejects an unknown entity ID with 400 and creates no channel', async () => {
    const app = createTestApp();
    const before = getAllChannels().length;

    const res = await app.request('/api/channels', postJson({
      name: 'Bad Roster', type: 'klatch', entityIds: ['does-not-exist'],
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unknown entity ID/i);
    expect(getAllChannels().length).toBe(before); // validated before createChannel
  });

  it('rejects a non-array entityIds with 400', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels', postJson({
      name: 'Bad Type', entityIds: 'not-an-array',
    }));
    expect(res.status).toBe(400);
  });

  it('falls back to the default entity when no roster is provided', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels', postJson({ name: 'Plain Chat' }));
    expect(res.status).toBe(201);
    const channel = await res.json();
    expect(getChannelEntities(channel.id).map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
  });
});
