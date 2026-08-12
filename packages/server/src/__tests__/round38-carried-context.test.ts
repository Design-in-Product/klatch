/**
 * Round 38 — carried context reaches the prompt (continuity #3, layer b).
 *
 * Round 36 built the union query; it was never wired into inference, because
 * the compaction strategy was an open decision. xian settled it on 2026-08-12
 * (relayed in `janus-to-daedalus-cc-team-xian-approves-compaction-option-b-2026-08-12.md`):
 * option (b), recent-N + summary, with (c) on-demand retrieval layered on.
 * This round is the recent-N half — the floor that guarantees an agent walking
 * into a klatch is never blank.
 *
 * What these tests are trying to catch: the seed silently not reaching the
 * prompt, reaching it in the wrong room, carrying the room it is already in,
 * carrying another agent's words, or blowing its budget on one long message.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup.js';
import { createChannel, createEntity, getEntity } from '../db/queries.js';
import { getDb } from '../db/index.js';
import {
  buildCarriedContext,
  CARRIED_CONTEXT_MAX_MESSAGES,
  CARRIED_CONTEXT_MAX_MESSAGE_CHARS,
} from '../claude/carried-context.js';
import { buildSystemPrompt } from '../claude/client.js';
import { getChannel } from '../db/queries.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

function say(
  channelId: string,
  entityId: string,
  content: string,
  at: string,
  role: 'user' | 'assistant' = 'assistant'
): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, role, content, 'complete', DEFAULT_MODEL, entityId, at);
  return id;
}

/**
 * A user message written the way the live path writes one — `entity_id` NULL.
 * `insertMessage` is only ever handed an entity for the assistant row
 * (`routes/messages.ts`), so a fixture that stamps one on a user row tests a
 * shape that never occurs in the database. Round 36's fixtures inserted only
 * assistant rows, which is exactly why the missing half went unnoticed.
 */
function ask(channelId: string, content: string, at: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)'
    )
    .run(id, channelId, 'user', content, 'complete', DEFAULT_MODEL, at);
  return id;
}

let agent: Entity;
let other: Entity;
let oneOnOne: Channel;
let secondRoom: Channel;
let klatch: Channel;
let otherAgentChannel: Channel;

beforeEach(() => {
  agent = createEntity('Daedalus', DEFAULT_MODEL, 'You are Daedalus.', '#6366f1');
  other = createEntity('Calliope', DEFAULT_MODEL, '', '#f59e0b');

  oneOnOne = createChannel('daedalus-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  secondRoom = createChannel('daedalus-arch', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id]);
  otherAgentChannel = createChannel('calliope-1-1', '', DEFAULT_MODEL, undefined, 'chat', [other.id]);

  say(oneOnOne.id, agent.id, 'the migration is not additive', '2026-08-01T10:00:00.000Z');
  say(secondRoom.id, agent.id, 'MCP v2 split opens a ten-week window', '2026-08-01T11:00:00.000Z');
  say(klatch.id, agent.id, 'status to the room', '2026-08-01T12:00:00.000Z');
  say(otherAgentChannel.id, other.id, 'the rollup carried a stale item', '2026-08-01T13:00:00.000Z');
});

describe('Round 38 — buildCarriedContext', () => {
  it('carries what the agent said in its other channels', () => {
    const block = buildCarriedContext(agent, klatch)!;
    expect(block).toContain('the migration is not additive');
    expect(block).toContain('MCP v2 split opens a ten-week window');
  });

  it('excludes the klatch the agent is currently in — no duplicating the room it is standing in', () => {
    expect(buildCarriedContext(agent, klatch)!).not.toContain('status to the room');
  });

  it('carries only this entity, never another agent that happens to be in the database', () => {
    expect(buildCarriedContext(agent, klatch)!).not.toContain('the rollup carried a stale item');
  });

  it('marks each line with the conversation it came from — a carried message is unintelligible without its room', () => {
    const block = buildCarriedContext(agent, klatch)!;
    expect(block).toContain('[daedalus-1-1 · 2026-08-01]');
    expect(block).toContain('[daedalus-arch · 2026-08-01]');
  });

  it('attributes the agent\'s own words to it by name, and the human to "user"', () => {
    ask(oneOnOne.id, 'what did you decide?', '2026-08-01T09:00:00.000Z');
    const block = buildCarriedContext(agent, klatch)!;
    expect(block).toContain('Daedalus: the migration is not additive');
    expect(block).toContain('user: what did you decide?');
  });

  it('carries what was SAID TO the agent, not only what it said', () => {
    // The defect this pins: `insertMessage` never stamps an entity on a user
    // row (`messages.ts` passes one only for the assistant), so scoping the
    // union on `entity_id` alone carried the agent's answers with none of the
    // questions. Real corpus: 1,332 user rows NULL vs 1,240 assistant rows
    // stamped — i.e. slightly more than half the conversation was missing.
    // `ask()` writes the row exactly as the live path does, entity NULL.
    ask(oneOnOne.id, 'does the migration need a table rebuild?', '2026-08-01T09:30:00.000Z');
    const block = buildCarriedContext(agent, klatch)!;
    expect(block).toContain('does the migration need a table rebuild?');
  });

  it('does not carry user messages from rooms the agent was never in', () => {
    // Membership is what qualifies a user message, so the EXISTS must be a
    // real filter — an unscoped `role = 'user'` clause would carry the human's
    // words out of every conversation in the database.
    ask(otherAgentChannel.id, 'calliope, is the rollup current?', '2026-08-01T09:45:00.000Z');
    expect(buildCarriedContext(agent, klatch)!).not.toContain('is the rollup current?');
  });

  it('tells the agent the slice is bounded, so a gap reads as "not carried" rather than "did not happen"', () => {
    const block = buildCarriedContext(agent, klatch)!;
    expect(block).toContain('bounded slice');
    expect(block).toMatch(/There is more than this/);
  });

  // ── Scope ────────────────────────────────────────────────────

  it('is INACTIVE in a 1-1 — carrying klatch content back is bidirectionality, still unanswered by xian', () => {
    expect(buildCarriedContext(agent, oneOnOne)).toBeUndefined();
  });

  it('returns undefined, not an empty string, when the agent has no history elsewhere', () => {
    const fresh = createEntity('Newcomer', DEFAULT_MODEL, '', '#10b981');
    const room = createChannel('intro', '', DEFAULT_MODEL, undefined, 'klatch', [fresh.id]);
    expect(buildCarriedContext(fresh, room)).toBeUndefined();
  });

  it('tolerates an undefined channel rather than throwing', () => {
    expect(buildCarriedContext(agent, undefined)).toBeUndefined();
  });

  // ── Budget ───────────────────────────────────────────────────

  it('carries the most RECENT messages, not the oldest, when the count binds', () => {
    for (let i = 0; i < CARRIED_CONTEXT_MAX_MESSAGES + 5; i++) {
      // Two-digit minutes so lexical ISO order matches chronological order.
      say(oneOnOne.id, agent.id, `msg-${String(i).padStart(2, '0')}`, `2026-08-02T10:${String(i).padStart(2, '0')}:00.000Z`);
    }
    const block = buildCarriedContext(agent, klatch)!;
    expect(block).toContain('msg-24');
    expect(block).not.toContain('msg-00');
  });

  it('keeps carried messages in chronological order', () => {
    const block = buildCarriedContext(agent, klatch)!;
    expect(block.indexOf('the migration is not additive')).toBeLessThan(
      block.indexOf('MCP v2 split opens a ten-week window')
    );
  });

  it('truncates a single oversized message instead of letting it evict the whole seed', () => {
    // Measured: the largest message in the real March corpus is 64,627 chars —
    // on its own more than twice the whole block budget. Without a per-message
    // cap it would be carried alone and every other message dropped.
    say(oneOnOne.id, agent.id, 'X'.repeat(64_627), '2026-08-03T10:00:00.000Z');
    const block = buildCarriedContext(agent, klatch)!;
    expect(block).toContain('this message truncated for length');
    expect(block.length).toBeLessThan(CARRIED_CONTEXT_MAX_MESSAGE_CHARS * 3);
    // The earlier messages survive the outlier.
    expect(block).toContain('the migration is not additive');
  });

  it('drops oldest-first when the char budget binds, and says how many it dropped', () => {
    for (let i = 0; i < 10; i++) {
      say(oneOnOne.id, agent.id, `bulk-${i} ` + 'y'.repeat(500), `2026-08-04T10:0${i}:00.000Z`);
    }
    const block = buildCarriedContext(agent, klatch, { maxChars: 1200 })!;
    expect(block).toContain('bulk-9');
    expect(block).not.toContain('bulk-0');
    expect(block).toMatch(/more dropped to stay within budget/);
  });

  it('keeps at least one message even when a single line exceeds the whole block budget', () => {
    // The budget check must not be able to produce an empty seed — an agent
    // carrying nothing is the exact failure this layer exists to prevent.
    const block = buildCarriedContext(agent, klatch, { maxChars: 10 })!;
    expect(block).toBeDefined();
    expect(block).toContain('MCP v2 split opens a ten-week window');
  });
});

describe('Round 38 — layer 6 in buildSystemPrompt', () => {
  it('appends carried context after the entity\'s own prompt', () => {
    const prompt = buildSystemPrompt(agent, undefined, klatch, null, [], [], {
      carriedContext: buildCarriedContext(agent, klatch),
    });
    expect(prompt).toContain('You are Daedalus.');
    expect(prompt).toContain('the migration is not additive');
    expect(prompt.indexOf('You are Daedalus.')).toBeLessThan(
      prompt.indexOf('the migration is not additive')
    );
  });

  it('is absent from the prompt when the layer is absent — no empty scaffolding', () => {
    const prompt = buildSystemPrompt(agent, undefined, oneOnOne, null, [], [], {
      carriedContext: buildCarriedContext(agent, oneOnOne),
    });
    expect(prompt).not.toContain('Context carried from');
    expect(prompt).toBe('You are Daedalus.');
  });

  it('stays backward compatible — omitting the options bag assembles the old five layers', () => {
    const withoutOptions = buildSystemPrompt(agent, undefined, klatch, null, [], []);
    const withEmptyOptions = buildSystemPrompt(agent, undefined, klatch, null, [], [], {});
    expect(withoutOptions).toBe(withEmptyOptions);
    expect(withoutOptions).toBe('You are Daedalus.');
  });

  it('does not carry context for an entity that was never in the room', () => {
    // Guard against scoping by channel membership instead of by message
    // authorship — Calliope has her own history, but none of it in this klatch.
    const prompt = buildSystemPrompt(other, undefined, klatch, null, [], [], {
      carriedContext: buildCarriedContext(other, klatch),
    });
    expect(prompt).toContain('the rollup carried a stale item');
    expect(prompt).not.toContain('the migration is not additive');
  });
});

describe('Round 38 — the seed is live in the inference path', () => {
  /**
   * The layer being correct is not the same as the layer being wired. These
   * assert against the channel and entity as they come back out of the DB —
   * the shape the streaming path actually passes — rather than the objects
   * constructed in the test body.
   */
  it('a klatch channel round-tripped through the DB still produces the seed', () => {
    const fromDb = getChannel(klatch.id)!;
    const entityFromDb = getEntity(agent.id)!;
    expect(fromDb.type).toBe('klatch');
    expect(buildCarriedContext(entityFromDb, fromDb)).toContain('the migration is not additive');
  });
});
