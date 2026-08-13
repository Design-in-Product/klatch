/**
 * Round 38b — pinning the fixture gap Daedalus flagged in his 8/12 17:17 memo
 * (`daedalus-to-xian-cc-team-carried-context-live-backfill-now-blocking-2026-08-12.md`).
 *
 * `getEntityTranscript`'s contract changed when carried context landed
 * (continuity #3): user messages now qualify by ROOM MEMBERSHIP
 * (`channel_entities`), not by `entity_id`, because `insertMessage` only ever
 * stamps `entity_id` on the assistant row — every user row is written NULL.
 * Round 36's twelve tests still pass unmodified against that change because
 * their fixtures (the `say` helper) never insert a user row at all, so the
 * `entity_id = ?` half of the new OR-clause is the only one they ever
 * exercise. A passing suite there is silent on whether the new half works.
 *
 * This file inserts real user rows (via `insertMessage`, the same path
 * production code uses) and exercises the membership branch directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import {
  getEntityTranscript,
  createChannel,
  createEntity,
  insertMessage,
} from '../db/queries.js';
import { DEFAULT_MODEL } from '@klatch/shared';

let agentId: string;
let otherAgentId: string;
let oneOnOne: string;
let klatch: string; // agent + otherAgent both present
let otherAgentOnly: string;

beforeEach(() => {
  const agent = createEntity('Daedalus', DEFAULT_MODEL, '', '#6366f1');
  agentId = agent.id;
  const other = createEntity('Calliope', DEFAULT_MODEL, '', '#f59e0b');
  otherAgentId = other.id;

  oneOnOne = createChannel('daedalus-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agentId]).id;
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [
    agentId,
    otherAgentId,
  ]).id;
  otherAgentOnly = createChannel('calliope-1-1', '', DEFAULT_MODEL, undefined, 'chat', [
    otherAgentId,
  ]).id;
});

describe('Round 38b — getEntityTranscript includes user messages by room membership', () => {
  it('carries a user message from a room the entity is in', () => {
    insertMessage(oneOnOne, 'user', 'what does the schema look like?', 'complete');

    const contents = getEntityTranscript(agentId).map((m) => m.content);
    expect(contents).toContain('what does the schema look like?');
  });

  it('excludes a user message from a room the entity is NOT in', () => {
    insertMessage(otherAgentOnly, 'user', 'not addressed to you', 'complete');

    const contents = getEntityTranscript(agentId).map((m) => m.content);
    expect(contents).not.toContain('not addressed to you');
  });

  it('a user message addressed to a klatch is carried by EVERY member present, not just one', () => {
    insertMessage(klatch, 'user', 'status update please', 'complete');

    expect(getEntityTranscript(agentId).map((m) => m.content)).toContain('status update please');
    expect(getEntityTranscript(otherAgentId).map((m) => m.content)).toContain(
      'status update please'
    );
  });

  it('interleaves user and assistant turns chronologically, not user-then-assistant', () => {
    insertMessage(oneOnOne, 'user', 'question', 'complete');
    insertMessage(oneOnOne, 'assistant', 'answer', 'complete', DEFAULT_MODEL, agentId);
    insertMessage(oneOnOne, 'user', 'follow-up', 'complete');

    const contents = getEntityTranscript(agentId).map((m) => m.content);
    expect(contents).toEqual(['question', 'answer', 'follow-up']);
  });

  it('excludeChannelId drops that room\'s user messages along with its assistant ones', () => {
    insertMessage(oneOnOne, 'user', 'in the 1-1', 'complete');
    insertMessage(klatch, 'user', 'in the klatch', 'complete');

    const contents = getEntityTranscript(agentId, { excludeChannelId: klatch }).map(
      (m) => m.content
    );
    expect(contents).toContain('in the 1-1');
    expect(contents).not.toContain('in the klatch');
  });

  it('a user message with entity_id NULL still carries channel provenance', () => {
    insertMessage(oneOnOne, 'user', 'provenance check', 'complete');

    const row = getEntityTranscript(agentId).find((m) => m.content === 'provenance check');
    expect(row?.channelName).toBe('daedalus-1-1');
    expect(row?.channelType).toBe('chat');
    expect(row?.entityId).toBeUndefined();
  });
});
