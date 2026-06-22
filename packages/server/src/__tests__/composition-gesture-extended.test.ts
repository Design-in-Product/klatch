/**
 * Composition gesture — EXTENDED coverage (Argus, tandem follow-on to Daedalus's
 * `composition-gesture.test.ts`).
 *
 * Daedalus's route tests cover the happy path + three negatives (single unknown
 * ID, non-array, rosterless-default) and the queries layer covers atomic/dedupe/
 * order. This file fills the edges those skip:
 *   - multi-unknown error names every missing ID (the join contract)
 *   - partial-valid roster is rejected atomically (valid agent not leaked)
 *   - picked roster ORDER round-trips through the HTTP route (not just membership)
 *   - dedupe holds at the route level
 *   - two PINNED invariant probes (chat+roster, klatch+empty-roster) — currently
 *     un-enforced at the API; flagged to Daedalus as hardening candidates.
 */
import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { createEntity, createChannel, getChannelEntities, getAllChannels } from '../db/queries.js';
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

describe('POST /api/channels — composition roster (extended)', () => {
  it('names every unknown entity ID in the error, not just the first', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels', postJson({
      name: 'All Bad', type: 'klatch', entityIds: ['ghost-1', 'ghost-2'],
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('ghost-1');
    expect(body.error).toContain('ghost-2');
  });

  it('rejects a partially-valid roster atomically — no channel, valid agent left unattached', async () => {
    const app = createTestApp();
    const good = createEntity('Valid', 'claude-opus-4-6', 'p', '#111');
    const before = getAllChannels().length;

    const res = await app.request('/api/channels', postJson({
      name: 'Half Bad', type: 'klatch', entityIds: [good.id, 'ghost'],
    }));
    expect(res.status).toBe(400);
    // validate-before-create: nothing was written
    expect(getAllChannels().length).toBe(before);
    const leaked = getAllChannels().some((ch) =>
      getChannelEntities(ch.id).some((e) => e.id === good.id));
    expect(leaked).toBe(false);
  });

  it('preserves the picked roster ORDER through the route, not just membership', async () => {
    const app = createTestApp();
    const x = createEntity('X', 'claude-opus-4-6', 'p', '#111');
    const y = createEntity('Y', 'claude-opus-4-6', 'p', '#222');
    const z = createEntity('Z', 'claude-opus-4-6', 'p', '#333');

    // deliberately unsorted pick order — must round-trip verbatim (ce.rowid tiebreak)
    const res = await app.request('/api/channels', postJson({
      name: 'Ordered', type: 'klatch', entityIds: [z.id, x.id, y.id],
    }));
    expect(res.status).toBe(201);
    const channel = await res.json();
    expect(getChannelEntities(channel.id).map((e) => e.id)).toEqual([z.id, x.id, y.id]);
  });

  it('dedupes repeated entity IDs in the roster at the route level', async () => {
    const app = createTestApp();
    const a = createEntity('A', 'claude-opus-4-6', 'p', '#111');
    const b = createEntity('B', 'claude-opus-4-6', 'p', '#222');

    const res = await app.request('/api/channels', postJson({
      name: 'Dupes', type: 'klatch', entityIds: [a.id, a.id, b.id, a.id],
    }));
    expect(res.status).toBe(201);
    const channel = await res.json();
    const ids = getChannelEntities(channel.id).map((e) => e.id);
    expect(ids).toHaveLength(2);
    expect([...ids].sort()).toEqual([a.id, b.id].sort());
  });

  // ── Type/roster coherence invariants ──
  // Originally flagged by Argus as un-enforced (6/21). Daedalus's resolution same day:
  //   - chat + multi-agent → ENFORCED at the route (channels.ts: "A chat is 1:1…").
  //   - klatch + empty roster → deliberately LEFT PERMISSIVE: a klatch falling back to
  //     the default is a valid 1-agent klatch (Iris spec; rejecting it broke round7).
  // His composition-gesture.test.ts is the primary pin; these are the extended-coverage
  // cross-checks (chat+multi also asserts atomicity; klatch+empty pins the deliberate
  // permissive call so a future "tighten it" doesn't land silently).

  it('type=chat with a multi-agent roster is rejected — 1:1 coherence (enforced 6/21)', async () => {
    const app = createTestApp();
    const a = createEntity('A', 'claude-opus-4-6', 'p', '#111');
    const b = createEntity('B', 'claude-opus-4-6', 'p', '#222');
    const before = getAllChannels().length;

    const res = await app.request('/api/channels', postJson({
      name: 'Chat With Crowd', type: 'chat', entityIds: [a.id, b.id],
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/chat is 1:1/i);
    expect(getAllChannels().length).toBe(before); // rejected before any create
  });

  it('type=chat with a single-agent roster is still allowed (1:1 boundary)', async () => {
    const app = createTestApp();
    const a = createEntity('Solo', 'claude-opus-4-6', 'p', '#111');

    const res = await app.request('/api/channels', postJson({
      name: 'Solo Chat', type: 'chat', entityIds: [a.id],
    }));
    expect(res.status).toBe(201); // length === 1 is fine; only >1 trips the 1:1 rule
    const channel = await res.json();
    expect(getChannelEntities(channel.id).map((e) => e.id)).toEqual([a.id]);
  });

  it('type=klatch with an empty roster is allowed — valid 1-agent klatch via default (deliberately permissive)', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels', postJson({
      name: 'Empty Klatch', type: 'klatch', entityIds: [],
    }));
    expect(res.status).toBe(201);
    const channel = await res.json();
    // Deliberately permissive (Daedalus 6/21): the default counts as an agent; the
    // "deliberate pick >=1" is a client-UX guard, not an API invariant.
    expect(getChannelEntities(channel.id).map((e) => e.id)).toEqual([DEFAULT_ENTITY_ID]);
  });
});

describe('createChannel roster — queries-level edges', () => {
  it('honors the default entity when it is explicitly part of the roster (no strip, no double-add)', () => {
    const a = createEntity('A', 'claude-opus-4-6', 'p', '#111');
    const ch = createChannel('explicit-default', 'p', undefined, 'panel', 'klatch', [DEFAULT_ENTITY_ID, a.id]);
    const ids = getChannelEntities(ch.id).map((e) => e.id).sort();
    expect(ids).toEqual([DEFAULT_ENTITY_ID, a.id].sort());
  });
});
