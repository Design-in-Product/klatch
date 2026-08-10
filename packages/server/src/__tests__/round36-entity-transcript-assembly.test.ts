/**
 * Round 36 — the entity-scoped assembly path (continuity #2).
 *
 * The query the continuity work was missing. History had always been assembled
 * per channel (`getMessages` → WHERE channel_id = ?), which is exactly why an
 * agent walking into a klatch arrived knowing nothing — there was no way to ask
 * "what does *this agent* know?".
 *
 * Confirmed model (xian, 2026-08-10): two write destinations, one read
 * transcript. Each channel keeps its own history; the entity's transcript is
 * the union across them. No schema change, no migration — the rows already
 * carried both keys.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import {
  getEntityChannels,
  getEntityTranscript,
  getMessages,
  createChannel,
  createEntity,
  assignEntityToChannel,
} from '../db/queries.js';
import { getDb } from '../db/index.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

/**
 * Insert with an EXPLICIT created_at.
 *
 * `insertMessage` stamps `created_at` itself, so messages written through it in
 * one test body land within milliseconds of each other and sort by rowid — i.e.
 * insertion order. A chronology assertion built on that would pass whether or
 * not the query sorts by time. Controlling the timestamp is what makes the
 * interleaving test test something.
 */
function say(channelId: string, entityId: string, content: string, at: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', content, 'complete', DEFAULT_MODEL, entityId, at);
  return id;
}

let agentId: string;
let oneOnOne: string;
let klatch: string;
let otherAgentChannel: string;

/**
 * Two rooms for one agent (a 1-1 and a klatch), plus a channel belonging to a
 * different agent — the negative case that proves scoping is by entity and not
 * merely by "every channel in the database".
 */
beforeEach(() => {
  const agent = createEntity('Daedalus', DEFAULT_MODEL, '', '#6366f1');
  agentId = agent.id;
  const other = createEntity('Calliope', DEFAULT_MODEL, '', '#f59e0b');

  oneOnOne = createChannel('daedalus-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agentId]).id;
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agentId]).id;
  otherAgentChannel = createChannel('calliope-1-1', '', DEFAULT_MODEL, undefined, 'chat', [other.id]).id;

  // Interleaved in time ACROSS channels, and deliberately inserted OUT of
  // chronological order (A2 written before K1) so that a query which merely
  // preserved insertion order would produce a different, failing sequence.
  say(oneOnOne, agentId, 'A1 — schema note', '2026-08-01T10:00:00.000Z');
  say(oneOnOne, agentId, 'A2 — follow-up', '2026-08-01T12:00:00.000Z');
  say(klatch, agentId, 'K1 — status to the room', '2026-08-01T11:00:00.000Z');
  say(otherAgentChannel, other.id, 'C1 — not ours', '2026-08-01T11:30:00.000Z');
});

describe('Round 36 — getEntityChannels', () => {
  it('returns every channel the entity is in, not just klatches', () => {
    const names = getEntityChannels(agentId).map((c) => c.name);
    expect(names).toContain('daedalus-1-1');
    expect(names).toContain('weekly-review');
  });

  it('excludes channels belonging to other entities', () => {
    expect(getEntityChannels(agentId).map((c) => c.name)).not.toContain('calliope-1-1');
  });

  it('grows as the agent is added to rooms — membership defines the transcript', () => {
    const before = getEntityChannels(agentId).length;
    const invited = createChannel('design-review', '', DEFAULT_MODEL, undefined, 'klatch');
    assignEntityToChannel(invited.id, agentId);
    expect(getEntityChannels(agentId).length).toBe(before + 1);
  });
});

describe('Round 36 — getEntityTranscript', () => {
  it('unions across channels, interleaved chronologically', () => {
    const contents = getEntityTranscript(agentId).map((m) => m.content);
    // Chronological across BOTH rooms — not channel-by-channel concatenation.
    expect(contents).toEqual([
      'A1 — schema note',
      'K1 — status to the room',
      'A2 — follow-up',
    ]);
  });

  it('carries provenance on every message', () => {
    const byContent = Object.fromEntries(
      getEntityTranscript(agentId).map((m) => [m.content, m])
    );
    expect(byContent['A1 — schema note'].channelName).toBe('daedalus-1-1');
    expect(byContent['A1 — schema note'].channelType).toBe('chat');
    expect(byContent['K1 — status to the room'].channelName).toBe('weekly-review');
    expect(byContent['K1 — status to the room'].channelType).toBe('klatch');
  });

  it('never includes another entity\'s messages', () => {
    const contents = getEntityTranscript(agentId).map((m) => m.content);
    expect(contents).not.toContain('C1 — not ours');
  });

  it('excludes the current room — carry what you know from ELSEWHERE', () => {
    // The klatch's own history is already in front of the agent; assembly is
    // for what it knows from its other conversations.
    const contents = getEntityTranscript(agentId, { excludeChannelId: klatch }).map((m) => m.content);
    expect(contents).toEqual(['A1 — schema note', 'A2 — follow-up']);
  });

  it('filters by channel type — the agent\'s own conversations vs rooms', () => {
    const chats = getEntityTranscript(agentId, { types: ['chat'] }).map((m) => m.content);
    expect(chats).toEqual(['A1 — schema note', 'A2 — follow-up']);

    const klatches = getEntityTranscript(agentId, { types: ['klatch'] }).map((m) => m.content);
    expect(klatches).toEqual(['K1 — status to the room']);
  });

  it('limit takes the most RECENT messages, still in chronological order', () => {
    // Oldest-N would be the exact opposite of what carrying context wants.
    const recent = getEntityTranscript(agentId, { limit: 2 }).map((m) => m.content);
    expect(recent).toEqual(['K1 — status to the room', 'A2 — follow-up']);
  });

  it('a single-channel slice matches that channel\'s own history exactly', () => {
    // The union must not perturb ordering — one channel's slice of the entity
    // transcript has to agree with getMessages() for that channel.
    const viaTranscript = getEntityTranscript(agentId, { excludeChannelId: klatch }).map((m) => m.id);
    const viaChannel = getMessages(oneOnOne)
      .filter((m) => m.entityId === agentId)
      .map((m) => m.id);
    expect(viaTranscript).toEqual(viaChannel);
  });

  it('returns empty for an entity with no messages, without throwing', () => {
    const fresh = createEntity('Newcomer', DEFAULT_MODEL, '', '#10b981');
    expect(getEntityTranscript(fresh.id)).toEqual([]);
    expect(getEntityChannels(fresh.id)).toEqual([]);
  });

  it('does not disturb per-channel history — both views stay valid', () => {
    // "Two write destinations, one read transcript": adding the union must
    // leave each channel's own history exactly as it was.
    expect(getMessages(klatch).map((m) => m.content)).toEqual(['K1 — status to the room']);
    expect(getMessages(oneOnOne).map((m) => m.content)).toEqual([
      'A1 — schema note',
      'A2 — follow-up',
    ]);
  });
});
