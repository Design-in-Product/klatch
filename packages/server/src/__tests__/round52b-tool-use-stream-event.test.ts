/**
 * Round 52b — the live `tool_use` event, typed.
 *
 * Theseus measured on 8/14 that a recall turn persists **3 artifacts** (1
 * `carried_context` + 2 `tool_use`) while only `carriedContext` rides
 * `message_complete`, so a live turn renders 1 of 3 and a reload renders 3 of 3
 * (`round51-neighbourhood-retrieval-live-2026-08-14.md` §6). Iris routed the
 * sequencing question to me: is that worth the same wire-field treatment as
 * `stopReason` and `carriedContext`?
 *
 * Reading the code to answer it produced a different answer than the question
 * assumed. `streamClaude` has emitted a `tool_use` event — `messageId`,
 * `toolName`, `toolInput` — inside the tool loop since that loop shipped, and
 * the SSE route forwards **every** emitter event verbatim as a `StreamEvent`.
 * So the live signal was already on the wire and already reaching the browser.
 * What was missing was on both ends of the contract rather than in the middle:
 * the event was not in the `StreamEvent` union (it typechecked only because
 * `EventEmitter.emit` is untyped, and it omitted the union's required
 * `content`), and neither client hook branches on it, so it was parsed and
 * dropped.
 *
 * These tests pin the server end of that: the event fires, per tool call, with
 * the payload a card needs, and it is now shaped like the type it is sent as.
 * Nothing here asserts anything about rendering — the consumer is Iris's.
 *
 * Failure modes worth catching:
 *
 * 1. **The event quietly disappearing.** It has no consumer today, so no test
 *    outside this file would go red if the emit were deleted in a refactor —
 *    which is precisely the condition under which things do get deleted.
 * 2. **`content` drifting back off it.** The field is required by the union and
 *    absent for four months; a `satisfies` clause catches that at build time,
 *    and this catches it in the emitted object.
 * 3. **Firing once per turn rather than once per call.** The measured 2.0–2.2
 *    cards per turn come from the agent retrying, so a per-turn event would
 *    under-report exactly the case the number describes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import { createChannel, createEntity, getMessageArtifacts } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { activeStreams, streamClaude } from '../claude/client.js';
import { RECALL_TOOL_NAME } from '../claude/recall.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity, StreamEvent } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

const h = vi.hoisted(() => ({
  rounds: [] as Array<{ text?: string; tool?: { name: string; input: Record<string, unknown> } }>,
  call: 0,
}));

vi.mock('@anthropic-ai/sdk', async () => {
  const actual = await vi.importActual<any>('@anthropic-ai/sdk');
  const fakeStream = () => {
    const round = h.rounds[h.call++] ?? {};
    const handlers: Record<string, (arg: any) => void> = {};
    return {
      on: (event: string, cb: (arg: any) => void) => {
        handlers[event] = cb;
      },
      finalMessage: async () => {
        if (round.text) handlers.text?.(round.text);
        if (round.tool) {
          return {
            stop_reason: 'tool_use',
            content: [
              { type: 'tool_use', id: `tu_${h.call}`, name: round.tool.name, input: round.tool.input },
            ],
          };
        }
        return { stop_reason: 'end_turn', content: [{ type: 'text', text: round.text ?? '' }] };
      },
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

function say(channelId: string, entityId: string, content: string, at: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', content, 'complete', DEFAULT_MODEL, entityId, at);
  return id;
}

function pendingTurn(channelId: string, entityId: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-15T09:00:00.000Z');
  return id;
}

let agent: Entity;
let oneOnOne: Channel;
let klatch: Channel;

beforeEach(() => {
  h.rounds.length = 0;
  h.call = 0;
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id]);
  // Recall is offered only where layer 6 is assembled, so the agent needs
  // something to carry — the measured configuration, not a synthetic tool call.
  say(oneOnOne.id, agent.id, 'the depot cipher is ochre-marlin-44', '2026-08-15T08:00:00.000Z');
});

/** Drive one panel turn, capturing every event the stream emitted. */
async function driveTurn(channel: Channel): Promise<{ messageId: string; events: StreamEvent[] }> {
  const messageId = pendingTurn(channel.id, agent.id);
  const events: StreamEvent[] = [];
  const realSet = activeStreams.set.bind(activeStreams);
  const spy = vi.spyOn(activeStreams, 'set').mockImplementation((id: string, emitter: any) => {
    emitter.on('data', (e: StreamEvent) => events.push(e));
    return realSet(id, emitter);
  });
  try {
    await streamClaude(channel.id, messageId, agent);
  } finally {
    spy.mockRestore();
  }
  return { messageId, events };
}

describe('Round 52b — the tool_use event on the wire', () => {
  it('emits the tool name and input live, before the turn completes', async () => {
    h.rounds.push(
      { text: 'Checking my other threads.', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher' } } },
      { text: '`ochre-marlin-44`' },
    );

    const { messageId, events } = await driveTurn(klatch);
    const toolEvents = events.filter((e) => e.type === 'tool_use');

    expect(toolEvents).toHaveLength(1);
    expect(toolEvents[0].messageId).toBe(messageId);
    expect(toolEvents[0].toolName).toBe(RECALL_TOOL_NAME);
    expect(toolEvents[0].toolInput).toEqual({ query: 'depot cipher' });

    // The point of the event: it is on the wire before the turn ends, which is
    // the whole difference from reading the artifact back after a reload.
    const completeAt = events.findIndex((e) => e.type === 'message_complete');
    expect(completeAt).toBeGreaterThan(events.indexOf(toolEvents[0]));
  });

  it('carries the union\'s required content field, empty', async () => {
    // Absent since the tool loop shipped; it typechecked only because
    // `EventEmitter.emit` takes `any`.
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher' } } },
      { text: 'Found it.' },
    );

    const { events } = await driveTurn(klatch);
    const toolEvent = events.find((e) => e.type === 'tool_use')!;
    expect(toolEvent).toBeDefined();
    expect(toolEvent.content).toBe('');
  });

  it('fires once per call, not once per turn', async () => {
    // The measured 2.0–2.2 cards per turn come from the agent retrying a search
    // it got nothing back from. A per-turn event would under-report exactly the
    // case that number describes.
    h.rounds.push(
      { text: 'Looking.', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher' } } },
      { text: 'Trying again.', tool: { name: RECALL_TOOL_NAME, input: { query: 'ochre marlin' } } },
      { text: 'Found it.' },
    );

    const { messageId, events } = await driveTurn(klatch);
    const toolEvents = events.filter((e) => e.type === 'tool_use');
    expect(toolEvents.map((e) => e.toolInput)).toEqual([
      { query: 'depot cipher' },
      { query: 'ochre marlin' },
    ]);

    // And the persisted side agrees, so the live count and the reload count are
    // the same number — which is the property the whole gap is about.
    const persisted = getMessageArtifacts(messageId).filter((a) => a.type === 'tool_use');
    expect(persisted).toHaveLength(toolEvents.length);
  });

  it('emits nothing when the turn calls no tool', async () => {
    h.rounds.push({ text: 'No tool needed here.' });
    const { events } = await driveTurn(klatch);
    expect(events.filter((e) => e.type === 'tool_use')).toHaveLength(0);
  });
});
