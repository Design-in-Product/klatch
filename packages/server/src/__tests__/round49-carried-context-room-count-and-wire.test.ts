/**
 * Round 49 — the two defects Theseus's live drive of Round 48 found, both in
 * the same number the human is shown.
 *
 * Write-up: `docs/research/carried-context-chip-live-2026-08-13.md`. He drove
 * Iris's chip through a running server the hour it shipped. The chip itself is
 * correct — artifact written, `inputSummary` right, existence-not-content
 * boundary held on the wire. Two things around it were not.
 *
 * ## 1. The count collapsed same-named conversations
 *
 * `buildCarriedContextBlock` counted rooms as `new Set(kept.map(k => k.room))`
 * where `room` was `channelName`. `channels.name` has no UNIQUE constraint, and
 * both import paths take the name straight from the source conversation's title
 * — duplicate titles across imported threads are ordinary, not contrived.
 * Measured at zero API cost off the block's own footer: two distinct channels
 * both named "Untitled-C1" reported `1 other conversation(s)` against a ground
 * truth of 2.
 *
 * Only the count was ever wrong. Both rooms' content was carried, which is why
 * this was invisible everywhere except the two places that report the number —
 * the footer the model reads and the chip the human reads. The display line
 * keeps the name; the count moves to `channelId`.
 *
 * ## 2. The chip was a reload-time signal
 *
 * Union of keys across every SSE event, both seats: `["type","messageId",
 * "content"]`. Nothing artifact-shaped. `message.artifacts` is only ever
 * populated by `fetchMessages`, which runs once per channel mount, and
 * `handleStreamComplete` patches the optimistic message in place. So for the
 * message the human just watched arrive, `artifacts` is `undefined` and the chip
 * renders nothing until the channel is re-entered.
 *
 * That inverts the argument the chip shipped on. It exists because a silent room
 * implies each participant's knowledge is bounded by what's visible there — and
 * the moment the human forms that impression is the moment they read the reply,
 * which is exactly when the chip was absent.
 *
 * Iris's ruling (`docs/ux/carried-context-visibility-2026-08-13.md`, 8/14
 * section) took Theseus's `stopReason` precedent: one optional field on
 * `message_complete` carrying the `inputSummary` string, no refetch, boundary
 * unchanged. Server half is pinned here. Client threading is hers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { createChannel, createEntity, getMessageArtifacts, updateMessage } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { buildCarriedContextBlock } from '../claude/carried-context.js';
import { streamClaude, streamClaudeRoundtable, activeStreams } from '../claude/client.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity, StreamEvent } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

const h = vi.hoisted(() => ({ sent: [] as any[] }));

vi.mock('@anthropic-ai/sdk', async () => {
  const actual = await vi.importActual<any>('@anthropic-ai/sdk');
  const fakeStream = (params: any) => {
    h.sent.push(params);
    return {
      on: () => {},
      finalMessage: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] }),
    };
  };
  class MockAnthropic {
    messages = { stream: fakeStream };
    beta = { messages: { stream: fakeStream } };
  }
  return {
    ...actual,
    default: Object.assign(MockAnthropic, {
      APIUserAbortError: actual.default.APIUserAbortError,
      APIError: actual.default.APIError,
      AuthenticationError: actual.default.AuthenticationError,
    }),
  };
});

function said(channelId: string, role: 'user' | 'assistant', content: string, at: string, entityId?: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, role, content, 'complete', DEFAULT_MODEL, role === 'assistant' ? entityId : null, at);
  return id;
}

function pendingTurn(channelId: string, entityId: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-14T13:00:00.000Z');
  return id;
}

const at = (minute: number) => `2026-08-01T10:${String(minute).padStart(2, '0')}:00.000Z`;

let agent: Entity;
let klatch: Channel;

beforeEach(() => {
  h.sent.length = 0;
  agent = createEntity('Wren', DEFAULT_MODEL, 'You are Wren.', '#6366f1');
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id]);
});

// ── 1. Rooms are counted by identity, not by display name ────

describe('Round 49 — room count is by channelId', () => {
  /**
   * The exact configuration Theseus measured. Two rooms, same name, one line
   * each. Against the old `new Set(k.room)` this returns 1.
   */
  it('counts two same-named conversations as two', () => {
    const a = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    const b = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    expect(a.name).toBe(b.name);
    expect(a.id).not.toBe(b.id);

    said(a.id, 'assistant', 'the shipment leaves Tuesday', at(0), agent.id);
    said(b.id, 'assistant', 'the audit is scheduled for March', at(1), agent.id);

    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.roomCount).toBe(2);
  });

  it('says two in the footer the model reads', () => {
    const a = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    const b = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(a.id, 'assistant', 'the shipment leaves Tuesday', at(0), agent.id);
    said(b.id, 'assistant', 'the audit is scheduled for March', at(1), agent.id);

    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.text).toContain('2 most recent message(s) from 2 other conversation(s)');
    expect(block.text).not.toContain('from 1 other conversation(s)');
  });

  /**
   * The count reaches the human by a second route. Fixing the block without
   * this assertion would leave the possibility of the chip being computed
   * somewhere else and still reading "1".
   */
  it('says two on the chip the human reads', async () => {
    const a = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    const b = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(a.id, 'assistant', 'the shipment leaves Tuesday', at(0), agent.id);
    said(b.id, 'assistant', 'the audit is scheduled for March', at(1), agent.id);
    said(klatch.id, 'user', 'status?', at(30));

    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    const artifact = getMessageArtifacts(turn).find((x) => x.type === 'carried_context')!;
    expect(artifact.inputSummary).toBe('2 other conversations');
    expect(JSON.parse(artifact.content!).roomCount).toBe(2);
  });

  /**
   * Counting by id must not leak ids into the prompt. The line stays labelled
   * with the name — which is the legible thing for the model, and is why the
   * name was the count key in the first place.
   */
  it('still labels the carried lines with the channel name, not the id', () => {
    const a = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(a.id, 'assistant', 'the shipment leaves Tuesday', at(0), agent.id);

    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.text).toContain('Untitled-C1');
    expect(block.text).not.toContain(a.id);
  });

  it('does not inflate a single conversation to two', () => {
    const a = createChannel('planning', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(a.id, 'assistant', 'first', at(0), agent.id);
    said(a.id, 'assistant', 'second', at(1), agent.id);

    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.roomCount).toBe(1);
    expect(block.text).toContain('2 most recent message(s) from 1 other conversation(s)');
  });

  /**
   * The eviction property Round 41 established is unchanged by the key swap:
   * rooms are counted over what survived the char budget, not over what was
   * fetched. Two same-named rooms where only one line survives must count 1,
   * for the eviction reason — not accidentally, by name collapse.
   */
  it('still counts only rooms that survived char-budget eviction', () => {
    const a = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    const b = createChannel('Untitled-C1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(a.id, 'assistant', 'x'.repeat(400), at(0), agent.id);
    said(b.id, 'assistant', 'y'.repeat(400), at(1), agent.id);

    // Budget fits the newest line and nothing more. Fill is newest-first, so
    // b's line is kept and a's is evicted.
    const block = buildCarriedContextBlock(agent, klatch, { maxChars: 450 })!;
    expect(block.messageCount).toBe(1);
    expect(block.omittedCount).toBe(1);
    expect(block.roomCount).toBe(1);
    expect(block.text).toContain('y'.repeat(400));
    expect(block.text).not.toContain('x'.repeat(400));
  });
});

// ── 2. The chip's signal rides the completion event ──────────

describe('Round 49 — carriedContext on message_complete', () => {
  it('rides the event so the chip is present on the turn just watched', async () => {
    const other = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(other.id, 'assistant', 'the shipment leaves Tuesday', at(0), agent.id);
    said(klatch.id, 'user', 'status?', at(30));

    const turn = pendingTurn(klatch.id, agent.id);
    // The emitter is registered synchronously, before the stream is awaited.
    const pending = streamClaude(klatch.id, turn, agent);
    const emitter = activeStreams.get(turn);
    expect(emitter).toBeDefined();

    const events: StreamEvent[] = [];
    emitter!.on('data', (e: StreamEvent) => events.push(e));
    await pending;

    const complete = events.find((e) => e.type === 'message_complete');
    expect(complete?.carriedContext).toBe('1 other conversation');
  });

  /**
   * One formatter. If the event string were re-derived at the emit site it
   * could drift from the artifact, and the chip on the live turn would then
   * disagree with the chip after reload — the failure mode this whole feature
   * is about, reintroduced one layer down.
   */
  it('sends the artifact\'s own inputSummary, byte-identical', async () => {
    const a = createChannel('a', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    const b = createChannel('b', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(a.id, 'assistant', 'one', at(0), agent.id);
    said(b.id, 'assistant', 'two', at(1), agent.id);
    said(klatch.id, 'user', 'status?', at(30));

    const turn = pendingTurn(klatch.id, agent.id);
    const pending = streamClaude(klatch.id, turn, agent);
    const events: StreamEvent[] = [];
    activeStreams.get(turn)!.on('data', (e: StreamEvent) => events.push(e));
    await pending;

    const artifact = getMessageArtifacts(turn).find((x) => x.type === 'carried_context')!;
    const complete = events.find((e) => e.type === 'message_complete')!;
    expect(complete.carriedContext).toBe(artifact.inputSummary);
    expect(complete.carriedContext).toBe('2 other conversations');
  });

  /**
   * Absent, not empty-string or zero. A chip driven off a falsy check and one
   * driven off `!== undefined` must agree, and `ArtifactList` renders on
   * presence.
   */
  it('is absent when the agent carried nothing in', async () => {
    said(klatch.id, 'user', 'status?', at(30));
    const turn = pendingTurn(klatch.id, agent.id);
    const pending = streamClaude(klatch.id, turn, agent);
    const events: StreamEvent[] = [];
    activeStreams.get(turn)!.on('data', (e: StreamEvent) => events.push(e));
    await pending;

    const complete = events.find((e) => e.type === 'message_complete')!;
    expect(complete.carriedContext).toBeUndefined();
    expect('carriedContext' in complete).toBe(false);
    expect(getMessageArtifacts(turn)).toHaveLength(0);
  });

  /**
   * Layer 6 is per-entity inside the roundtable loop, so the field has to be
   * too. A single value hoisted out of the loop would stamp one seat's count
   * onto every seat in the klatch.
   */
  it('is per-seat in a roundtable, not shared across the round', async () => {
    const thorne = createEntity('Thorne', DEFAULT_MODEL, 'You are Thorne.', '#ef4444');
    getDb()
      .prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
      .run(klatch.id, thorne.id);

    // Wren has two other conversations; Thorne has none — the negative control
    // that rules out an implementation stamping the field on every seat.
    const a = createChannel('a', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    const b = createChannel('b', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(a.id, 'assistant', 'one', at(0), agent.id);
    said(b.id, 'assistant', 'two', at(1), agent.id);
    said(klatch.id, 'user', 'status?', at(30));

    const wrenTurn = pendingTurn(klatch.id, agent.id);
    const thorneTurn = pendingTurn(klatch.id, thorne.id);

    // Subscribe by intercepting registration, not by polling. The seats stream
    // sequentially and each emitter is registered and deleted inside one
    // `await` — a timer-based watcher never gets a turn and its assertions
    // would pass by never running.
    const seen = new Map<string, StreamEvent[]>();
    const register = vi.spyOn(activeStreams, 'set').mockImplementation(function (this: any, id, em) {
      const evs: StreamEvent[] = [];
      seen.set(id, evs);
      em.on('data', (e: StreamEvent) => evs.push(e));
      return Map.prototype.set.call(activeStreams, id, em);
    });

    await streamClaudeRoundtable(klatch.id, [
      { assistantMessageId: wrenTurn, entity: agent },
      { assistantMessageId: thorneTurn, entity: thorne },
    ]);
    register.mockRestore();

    // Both seats observed — otherwise the two assertions below are vacuous.
    expect([...seen.keys()].sort()).toEqual([wrenTurn, thorneTurn].sort());

    const wrenComplete = seen.get(wrenTurn)!.find((e) => e.type === 'message_complete')!;
    expect(wrenComplete.carriedContext).toBe('2 other conversations');
    const thorneComplete = seen.get(thorneTurn)!.find((e) => e.type === 'message_complete')!;
    expect(thorneComplete.carriedContext).toBeUndefined();

    // And the same split is persisted, so the chip agrees after a reload.
    expect(getMessageArtifacts(wrenTurn).find((x) => x.type === 'carried_context')?.inputSummary)
      .toBe('2 other conversations');
    expect(getMessageArtifacts(thorneTurn).find((x) => x.type === 'carried_context')).toBeUndefined();
  });
});

// ── 3. The replay paths, where there is no emitter to ask ────

describe('Round 49 — carriedContext on the SSE replay paths', () => {
  /**
   * A client that connects after the turn finished — a fast reply, or a
   * reconnect — gets its `message_complete` rebuilt from the DB row rather than
   * forwarded from an emitter. It still patches optimistically and still never
   * refetches, so omitting the field here would leave the chip missing exactly
   * when the client lost the race: the same hole, reached another way.
   */
  it('replays the field for a message that finished before the observer connected', async () => {
    const other = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(other.id, 'assistant', 'the shipment leaves Tuesday', at(0), agent.id);
    said(klatch.id, 'user', 'status?', at(30));

    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);
    expect(activeStreams.has(turn)).toBe(false);

    const res = await createTestApp().request(`/api/messages/${turn}/stream`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('message_complete');
    expect(body).toContain('"carriedContext":"1 other conversation"');
  });

  it('omits the field on replay when nothing was carried', async () => {
    said(klatch.id, 'user', 'status?', at(30));
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    const res = await createTestApp().request(`/api/messages/${turn}/stream`);
    const body = await res.text();
    expect(body).toContain('message_complete');
    expect(body).not.toContain('carriedContext');
  });

  /**
   * An incomplete turn still carried its context. `isFinished` treats
   * 'incomplete' as replayable, so the two fields have to coexist on the same
   * event rather than one displacing the other.
   */
  it('replays carriedContext alongside stopReason on an incomplete turn', async () => {
    const other = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
    said(other.id, 'assistant', 'the shipment leaves Tuesday', at(0), agent.id);
    said(klatch.id, 'user', 'status?', at(30));

    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);
    updateMessage(turn, 'cut off', 'incomplete', 'max_tokens');

    const res = await createTestApp().request(`/api/messages/${turn}/stream`);
    const body = await res.text();
    expect(body).toContain('"stopReason":"max_tokens"');
    expect(body).toContain('"carriedContext":"1 other conversation"');
  });
});
