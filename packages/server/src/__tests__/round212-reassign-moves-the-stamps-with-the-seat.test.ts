/**
 * Round 212 — reassigning a channel's entity moves the message stamps with it.
 *
 * Iris asked for this endpoint by name (2026-09-14, `sameNameEntityIds`
 * disclosure built) and declined to build the one-click reassign without it.
 * Her reasoning is the spec: an imported channel carries its binding in **two**
 * places — the `channel_entities` join row, and `entity_id` stamped onto every
 * assistant message by `importSession` — and the only client-callable
 * primitives (`assignEntityToChannel` / `removeEntityFromChannel`) touch the
 * join row alone. Rebinding with that pair leaves every message pointing at the
 * old entity, silently.
 *
 * Theseus (Round 211 §4) named the same invariant from the other side: it is
 * `probe-round205` arm A5's property on the other rebinding path, and the thing
 * to test against when this endpoint lands.
 *
 * So the load-bearing assertions here are the ones that read `messages.entity_id`
 * back *after* the join row has moved. A test that only checks the roster would
 * pass against the exact implementation Iris refused to ship.
 *
 * Three deliberate refusals are pinned too, because each is a place where a
 * guess would be worse than an error: the source isn't bound (stale client
 * read), the target is already bound (that is a seat *merge*, not a reassign),
 * and source === target.
 */

import './setup.js';
import { describe, it, expect, vi } from 'vitest';
import { createTestApp } from './app.js';
import {
  createEntity,
  createChannel,
  importSession,
  assignEntityToChannel,
  getChannelEntities,
  reassignChannelEntity,
} from '../db/queries.js';
import { getDb } from '../db/index.js';
import { DEFAULT_ENTITY_ID, DEFAULT_MODEL } from '@klatch/shared';

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

/** Rows as the database holds them, so an assertion cannot read a mapper's default. */
function stampsIn(channelId: string): { role: string; entity_id: string | null }[] {
  return getDb()
    .prepare('SELECT role, entity_id FROM messages WHERE channel_id = ? ORDER BY rowid ASC')
    .all(channelId) as { role: string; entity_id: string | null }[];
}

function bindingsOf(channelId: string): string[] {
  return (
    getDb()
      .prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ? ORDER BY rowid ASC')
      .all(channelId) as { entity_id: string }[]
  ).map((r) => r.entity_id);
}

/** A real import, so the stamps under test are the ones `importSession` writes. */
function importedChannel(name: string, entityId: string) {
  return importSession({
    channelName: name,
    source: 'claude-code',
    sourceMetadata: { sessionId: `s-${name}` },
    entityId,
    turns: [
      { userText: 'q1', assistantText: 'a1', timestamp: '2026-01-01T00:00:00Z', originalId: 'u1' },
      { userText: 'q2', assistantText: 'a2', timestamp: '2026-01-01T00:01:00Z', originalId: 'u2' },
    ],
  });
}

describe('Round 212 — the stamps move with the seat', () => {
  it('moves both the join row and every assistant stamp', () => {
    const wrong = createEntity('Calliope', DEFAULT_MODEL, '', '#111');
    const right = createEntity('Calliope', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-move', wrong.id);

    // Establish the subject before measuring it (Round 211 §3): if the import
    // stamped nothing, "no rows left on `wrong`" would pass vacuously.
    const before = stampsIn(channelId);
    expect(before.filter((m) => m.entity_id === wrong.id)).toHaveLength(2);
    expect(bindingsOf(channelId)).toEqual([wrong.id]);

    const result = reassignChannelEntity(channelId, wrong.id, right.id);

    expect(result.outcome).toBe('reassigned');
    expect(result.messagesReassigned).toBe(2);
    expect(bindingsOf(channelId)).toEqual([right.id]);
    // The assertion that fails against a `channel_entities`-only implementation.
    const after = stampsIn(channelId);
    expect(after.filter((m) => m.entity_id === wrong.id)).toHaveLength(0);
    expect(after.filter((m) => m.entity_id === right.id)).toHaveLength(2);
  });

  it('leaves user messages NULL — they belong to the roster, not to an agent', () => {
    const from = createEntity('From', DEFAULT_MODEL, '', '#111');
    const to = createEntity('To', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-null', from.id);

    expect(stampsIn(channelId).filter((m) => m.role === 'user')).toHaveLength(2);

    reassignChannelEntity(channelId, from.id, to.id);

    const users = stampsIn(channelId).filter((m) => m.role === 'user');
    expect(users).toHaveLength(2);
    expect(users.every((m) => m.entity_id === null)).toBe(true);
  });

  it('moves only the departing agent`s rows on a multi-bound channel', () => {
    const from = createEntity('From', DEFAULT_MODEL, '', '#111');
    const other = createEntity('Other', DEFAULT_MODEL, '', '#222');
    const to = createEntity('To', DEFAULT_MODEL, '', '#333');
    const { channelId } = importedChannel('c-multi', from.id);
    assignEntityToChannel(channelId, other.id);

    // Give `other` a stamped row of its own, so the claim below has a subject
    // that could move if the UPDATE were scoped to the channel instead.
    const mine = stampsIn(channelId);
    expect(mine.filter((m) => m.entity_id === from.id)).toHaveLength(2);
    getDb()
      .prepare(
        "UPDATE messages SET entity_id = ? WHERE channel_id = ? AND role = 'assistant' AND rowid = (SELECT MIN(rowid) FROM messages WHERE channel_id = ? AND role = 'assistant')"
      )
      .run(other.id, channelId, channelId);
    expect(stampsIn(channelId).filter((m) => m.entity_id === other.id)).toHaveLength(1);

    const result = reassignChannelEntity(channelId, from.id, to.id);

    expect(result.outcome).toBe('reassigned');
    expect(result.messagesReassigned).toBe(1);
    const after = stampsIn(channelId);
    expect(after.filter((m) => m.entity_id === other.id)).toHaveLength(1);
    expect(after.filter((m) => m.entity_id === to.id)).toHaveLength(1);
    expect(bindingsOf(channelId).sort()).toEqual([other.id, to.id].sort());
  });

  it('keeps the seat`s position in the roster rather than appending the new occupant', () => {
    const first = createEntity('First', DEFAULT_MODEL, '', '#111');
    const second = createEntity('Second', DEFAULT_MODEL, '', '#222');
    const replacement = createEntity('Replacement', DEFAULT_MODEL, '', '#333');
    const channel = createChannel('roster', '', undefined, undefined, 'klatch');
    const db = getDb();
    db.prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(channel.id);
    db.prepare(
      'INSERT INTO channel_entities (channel_id, entity_id, added_at) VALUES (?, ?, ?)'
    ).run(channel.id, first.id, '2026-01-01T00:00:00Z');
    db.prepare(
      'INSERT INTO channel_entities (channel_id, entity_id, added_at) VALUES (?, ?, ?)'
    ).run(channel.id, second.id, '2026-02-01T00:00:00Z');

    // Establish that the roster IS ordered by added_at before claiming it is preserved.
    expect(getChannelEntities(channel.id).map((e) => e.id)).toEqual([first.id, second.id]);

    reassignChannelEntity(channel.id, first.id, replacement.id);

    // Arranged so this fails if a fresh `datetime('now')` were written: the new
    // occupant would sort last, after `second`.
    expect(getChannelEntities(channel.id).map((e) => e.id)).toEqual([replacement.id, second.id]);
    const addedAt = (
      db
        .prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
        .get(channel.id, replacement.id) as { added_at: string }
    ).added_at;
    expect(addedAt).toBe('2026-01-01T00:00:00Z');
  });
});

describe('Round 212 — the refusals', () => {
  it('refuses when the source is not bound, and writes nothing', () => {
    const bound = createEntity('Bound', DEFAULT_MODEL, '', '#111');
    const stranger = createEntity('Stranger', DEFAULT_MODEL, '', '#222');
    const to = createEntity('To', DEFAULT_MODEL, '', '#333');
    const { channelId } = importedChannel('c-stale', bound.id);

    const result = reassignChannelEntity(channelId, stranger.id, to.id);

    expect(result.outcome).toBe('source-not-bound');
    expect(result.messagesReassigned).toBe(0);
    expect(bindingsOf(channelId)).toEqual([bound.id]);
    expect(stampsIn(channelId).filter((m) => m.entity_id === bound.id)).toHaveLength(2);
  });

  it('refuses a target already on the roster — that is a merge, not a reassign', () => {
    const from = createEntity('From', DEFAULT_MODEL, '', '#111');
    const already = createEntity('Already', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-merge', from.id);
    assignEntityToChannel(channelId, already.id);

    const result = reassignChannelEntity(channelId, from.id, already.id);

    expect(result.outcome).toBe('target-already-bound');
    expect(bindingsOf(channelId).sort()).toEqual([already.id, from.id].sort());
    expect(stampsIn(channelId).filter((m) => m.entity_id === from.id)).toHaveLength(2);
  });

  it('refuses source === target instead of silently rewriting the row', () => {
    const only = createEntity('Only', DEFAULT_MODEL, '', '#111');
    const { channelId } = importedChannel('c-same', only.id);

    const result = reassignChannelEntity(channelId, only.id, only.id);

    expect(result.outcome).toBe('same-entity');
    expect(bindingsOf(channelId)).toEqual([only.id]);
  });

  it('refuses an unknown target and an unknown channel', () => {
    const from = createEntity('From', DEFAULT_MODEL, '', '#111');
    const { channelId } = importedChannel('c-404', from.id);

    expect(reassignChannelEntity(channelId, from.id, 'no-such-entity').outcome).toBe(
      'target-not-found'
    );
    expect(reassignChannelEntity('no-such-channel', from.id, from.id).outcome).toBe(
      'channel-not-found'
    );
    expect(bindingsOf(channelId)).toEqual([from.id]);
  });
});

describe('Round 212 — orphan reporting, not orphan deletion', () => {
  it('reports the vacated entity as orphaned when nothing else holds it', () => {
    const minted = createEntity('Minted', DEFAULT_MODEL, '', '#111');
    const to = createEntity('To', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-orphan', minted.id);

    const result = reassignChannelEntity(channelId, minted.id, to.id);

    expect(result.fromEntityOrphaned).toBe(true);
    // Reported, not acted on. The entity is still there for the caller to decide about.
    expect(
      getDb().prepare('SELECT 1 FROM entities WHERE id = ?').get(minted.id)
    ).toBeTruthy();
  });

  it('does not report orphaned when the entity still holds another channel', () => {
    const shared = createEntity('Shared', DEFAULT_MODEL, '', '#111');
    const to = createEntity('To', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-a', shared.id);
    const second = importedChannel('c-b', shared.id);
    expect(second.channelId).not.toBe(channelId);

    const result = reassignChannelEntity(channelId, shared.id, to.id);

    expect(result.outcome).toBe('reassigned');
    expect(result.fromEntityOrphaned).toBe(false);
  });

  it('never reports the default entity as orphaned', () => {
    const to = createEntity('To', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-default', DEFAULT_ENTITY_ID);
    // Establish the condition that would otherwise make it orphaned: after the
    // move, the default holds nothing. Without this the guard is untested.
    getDb()
      .prepare('DELETE FROM channel_entities WHERE entity_id = ? AND channel_id != ?')
      .run(DEFAULT_ENTITY_ID, channelId);
    getDb()
      .prepare('UPDATE messages SET entity_id = NULL WHERE entity_id = ? AND channel_id != ?')
      .run(DEFAULT_ENTITY_ID, channelId);

    const result = reassignChannelEntity(channelId, DEFAULT_ENTITY_ID, to.id);

    expect(result.outcome).toBe('reassigned');
    expect(
      getDb()
        .prepare('SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = ?')
        .get(DEFAULT_ENTITY_ID)
    ).toEqual({ n: 0 });
    expect(result.fromEntityOrphaned).toBe(false);
  });
});

describe('Round 212 — through the HTTP endpoint', () => {
  it('PATCH reassigns and reports what it did', async () => {
    const from = createEntity('HttpFrom', DEFAULT_MODEL, '', '#111');
    const to = createEntity('HttpTo', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-http', from.id);

    const res = await req('PATCH', `/channels/${channelId}/entities/${from.id}`, {
      toEntityId: to.id,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fromEntityId).toBe(from.id);
    expect(body.toEntityId).toBe(to.id);
    expect(body.messagesReassigned).toBe(2);
    expect(body.fromEntityOrphaned).toBe(true);
    expect(body.entities.map((e: any) => e.id)).toEqual([to.id]);
    // Same invariant, asserted on the wire path: the stamps really moved.
    expect(stampsIn(channelId).filter((m) => m.entity_id === to.id)).toHaveLength(2);
  });

  it('maps each refusal to its own status rather than a blanket 400', async () => {
    const from = createEntity('StatusFrom', DEFAULT_MODEL, '', '#111');
    const already = createEntity('StatusAlready', DEFAULT_MODEL, '', '#222');
    const { channelId } = importedChannel('c-status', from.id);
    assignEntityToChannel(channelId, already.id);

    const unknownChannel = await req('PATCH', `/channels/nope/entities/${from.id}`, {
      toEntityId: already.id,
    });
    expect(unknownChannel.status).toBe(404);
    expect((await unknownChannel.json()).error).toMatch(/channel not found/i);

    const unknownTarget = await req('PATCH', `/channels/${channelId}/entities/${from.id}`, {
      toEntityId: 'nope',
    });
    expect(unknownTarget.status).toBe(404);
    expect((await unknownTarget.json()).error).toMatch(/entity not found/i);

    const merge = await req('PATCH', `/channels/${channelId}/entities/${from.id}`, {
      toEntityId: already.id,
    });
    expect(merge.status).toBe(409);
    expect((await merge.json()).error).toMatch(/already assigned/i);

    const same = await req('PATCH', `/channels/${channelId}/entities/${from.id}`, {
      toEntityId: from.id,
    });
    expect(same.status).toBe(400);

    const missing = await req('PATCH', `/channels/${channelId}/entities/${from.id}`, {});
    expect(missing.status).toBe(400);
    expect((await missing.json()).error).toMatch(/toEntityId is required/i);

    // Nothing above wrote: the refusal statuses are refusals, not reports.
    expect(bindingsOf(channelId).sort()).toEqual([already.id, from.id].sort());
    expect(stampsIn(channelId).filter((m) => m.entity_id === from.id)).toHaveLength(2);
  });
});
