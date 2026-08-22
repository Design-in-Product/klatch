/**
 * Round 70 — `toolInput` survives the emitter→SSE hop, and a late subscriber
 * loses it silently.
 *
 * Theseus's Round 69 memo proposed a "tier-two capture": have the recall probe
 * subscribe to `GET /messages/:id/stream` so it can see whether `expand` was
 * *present-but-rejected*, which separates a dropped expand from a genuinely
 * empty search — the two causes his empty-tail detector cannot tell apart,
 * because `createToolUseArtifact` persists `toolUseInputSummary`'s string and
 * nothing else. His sequencing call was to build it with the distance arm and
 * validate it on the first paid run, on the grounds that a live-path change
 * cannot be exercised without spend.
 *
 * Most of it can. The tap has three parts and only one of them needs a live
 * turn:
 *
 * 1. **client → emitter.** Already pinned: `round52b-tool-use-stream-event`
 *    asserts the event fires per call with `toolInput` as the raw object, and
 *    `client.ts:901` emits `toolInput: toolUse.input` four lines before `executeTool` (`:905`),
 *    so `readExpandArg`'s rejection has not happened yet.
 * 2. **emitter → SSE frame.** `routes/messages.ts:382` forwards every emitter
 *    event with `JSON.stringify(event)`, unfiltered. That is one line, it is
 *    the line the whole proposal rests on, and nothing asserted it carried
 *    `toolInput`. This file pins it. Zero spend.
 * 3. **a real turn emitting in time.** Only this needs the arm.
 *
 * The second test is the one that changes how the tap must be *scored*. The
 * memo says the route "already handles a late subscriber, so the race is
 * designed for". It is handled for liveness, not for capture: a subscriber
 * that arrives after the turn settles gets a single `message_complete`
 * reconstructed from the DB (`routes/messages.ts:300-320`) and **no `tool_use`
 * frame at all**, because nothing replays them and `toolInput` is not
 * persisted anywhere. A lost race is therefore byte-indistinguishable from a
 * turn that called no tool — which is the same shape of quiet hole the tap
 * exists to close, reproduced one layer up in the instrument.
 *
 * So the tap must be read *against* the artifact row, never instead of it:
 * artifact present + no `tool_use` frame = the probe lost the race, not "no
 * expand". That is an assertion here rather than a caveat in a memo.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import { createChannel, createEntity, getMessageArtifacts } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { activeStreams, streamClaude } from '../claude/client.js';
import { RECALL_TOOL_NAME } from '../claude/recall.js';
import { createTestApp } from './app.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity, StreamEvent } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

const h = vi.hoisted(() => ({
  rounds: [] as Array<{ text?: string; tool?: { name: string; input: Record<string, unknown> } }>,
  call: 0,
  /**
   * Held by the first round only. Without it the mocked turn runs to completion
   * in a handful of microtasks and the route never gets a chance to subscribe —
   * the in-process version of the very race the second test is about.
   */
  gate: null as Promise<void> | null,
}));

vi.mock('@anthropic-ai/sdk', async () => {
  const actual = await vi.importActual<any>('@anthropic-ai/sdk');
  const fakeStream = () => {
    const idx = h.call++;
    const round = h.rounds[idx] ?? {};
    const handlers: Record<string, (arg: any) => void> = {};
    return {
      on: (event: string, cb: (arg: any) => void) => {
        handlers[event] = cb;
      },
      finalMessage: async () => {
        if (idx === 0 && h.gate) await h.gate;
        if (round.text) handlers.text?.(round.text);
        if (round.tool) {
          return {
            stop_reason: 'tool_use',
            content: [
              { type: 'tool_use', id: `tu_${idx}`, name: round.tool.name, input: round.tool.input },
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
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-21T17:00:00.000Z');
  return id;
}

/** Read `data:` frames off a live SSE body until the turn ends. */
async function readFrames(res: Response): Promise<StreamEvent[]> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  const events: StreamEvent[] = [];
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      try {
        events.push(JSON.parse(line.slice(5).trim()) as StreamEvent);
      } catch {
        /* partial frame */
      }
    }
    if (events.some((e) => e.type === 'message_complete' || e.type === 'error')) break;
  }
  reader.cancel().catch(() => {});
  return events;
}

/**
 * Start a turn, attach a real SSE subscriber through the route, and only then
 * let the turn proceed. This is the probe's intended tier-two shape, minus the
 * network.
 */
async function driveWithSubscriber(channel: Channel): Promise<{ turn: string; frames: StreamEvent[] }> {
  const turn = pendingTurn(channel.id, agent.id);
  let release!: () => void;
  h.gate = new Promise<void>((r) => {
    release = r;
  });

  const pending = streamClaude(channel.id, turn, agent);
  const emitter = activeStreams.get(turn);
  expect(emitter, 'emitter is registered synchronously').toBeDefined();

  const res = await createTestApp().request(`/api/messages/${turn}/stream`);
  expect(res.status).toBe(200);

  const deadline = Date.now() + 5000;
  while (emitter!.listenerCount('data') === 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5));
  }
  expect(emitter!.listenerCount('data'), 'the route subscribed before the turn ran').toBeGreaterThan(0);

  release();
  const frames = await readFrames(res);
  await pending;
  return { turn, frames };
}

let agent: Entity;
let oneOnOne: Channel;
let klatch: Channel;

beforeEach(() => {
  h.rounds.length = 0;
  h.call = 0;
  h.gate = null;
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id]);
  say(oneOnOne.id, agent.id, 'the depot cipher is ochre-marlin-44', '2026-08-15T08:00:00.000Z');
});

describe('Round 70 — the SSE frame carries the raw tool input', () => {
  /**
   * The case the tap is for. `from`/`to` as strings is what a model produces
   * from the Round 68 slot copy — and, per Theseus's Round 69 table, also what
   * it produces unprompted with no bad copy involved. `readExpandArg` requires
   * numbers, so the expand is dropped whole and the call routes to search.
   */
  it('shows an expand that was present-but-rejected, which the artifact cannot', async () => {
    h.rounds.push(
      { text: 'Looking back at that thread.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: 'vesper-1-1', from: '12', to: '38' } } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithSubscriber(klatch);

    const toolFrames = frames.filter((e) => e.type === 'tool_use');
    expect(toolFrames).toHaveLength(1);
    expect(toolFrames[0].toolName).toBe(RECALL_TOOL_NAME);
    // Raw and unvalidated: emitted before `readExpandArg` ever sees it.
    expect(toolFrames[0].toolInput).toEqual({
      expand: { conversation: 'vesper-1-1', from: '12', to: '38' },
    });

    // The same call, as the DB records it: the empty tail, and no trace that an
    // expand was ever attempted. This asymmetry is the entire argument for the
    // tap, so it is asserted rather than described.
    const artifacts = getMessageArtifacts(turn).filter((a) => a.type === 'tool_use');
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].inputSummary).toBe('Searched own conversations: ');
    expect(artifacts[0].inputSummary).not.toContain('vesper-1-1');
  });

  /**
   * Theseus's §2(b) — the quieter path. A dropped expand that also carried a
   * `query` leaves no empty tail at all; the artifact reads as an ordinary
   * successful search and the empty-tail detector never fires. On the wire the
   * rejected expand is still right there.
   */
  it('sees the dropped expand even when a query makes the artifact look ordinary', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher', expand: { conversation: 'vesper-1-1', from: '<first position>', to: '<last position>' } } } },
      { text: '`ochre-marlin-44`' },
    );

    const { turn, frames } = await driveWithSubscriber(klatch);

    const toolFrames = frames.filter((e) => e.type === 'tool_use');
    expect(toolFrames).toHaveLength(1);
    expect((toolFrames[0].toolInput as Record<string, unknown>).expand).toEqual({
      conversation: 'vesper-1-1',
      from: '<first position>',
      to: '<last position>',
    });

    const artifacts = getMessageArtifacts(turn).filter((a) => a.type === 'tool_use');
    expect(artifacts[0].inputSummary).toBe('Searched own conversations: depot cipher');
    // Indistinguishable, in the DB, from a search the model meant to run.
    expect(artifacts[0].inputSummary).not.toContain('expand');
  });

  /**
   * A well-formed expand still round-trips, so the tap can tell accepted from
   * rejected rather than just "an expand key was present".
   */
  it('carries a well-formed expand too, alongside the address summary', async () => {
    h.rounds.push(
      { text: 'Reading it back.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: 'vesper-1-1', from: 1, to: 2 } } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithSubscriber(klatch);

    const toolFrames = frames.filter((e) => e.type === 'tool_use');
    expect(toolFrames[0].toolInput).toEqual({
      expand: { conversation: 'vesper-1-1', from: 1, to: 2 },
    });
    const artifacts = getMessageArtifacts(turn).filter((a) => a.type === 'tool_use');
    expect(artifacts[0].inputSummary).toBe('Expanded own conversation: vesper-1-1 1–2');
  });
});

describe('Round 70 — a subscriber that arrives late loses the input silently', () => {
  /**
   * The hazard the tap has to be scored against. Not a bug in the route: the
   * replay branch is doing what it was built for. But `toolInput` exists only
   * on the wire, so once the turn settles there is nothing left to replay, and
   * the frame a late subscriber gets looks exactly like a turn that called no
   * tool at all.
   */
  it('replays message_complete and no tool_use, though a tool was called', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: 'vesper-1-1', from: '12', to: '38' } } } },
      { text: 'done' },
    );

    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);
    expect(activeStreams.has(turn)).toBe(false);

    const res = await createTestApp().request(`/api/messages/${turn}/stream`);
    const body = await res.text();
    expect(body).toContain('message_complete');
    expect(body).not.toContain('tool_use');
    expect(body).not.toContain('toolInput');

    // Yet the call demonstrably happened. Artifact present + no frame is the
    // signature of a lost race, and the probe must read it that way rather than
    // scoring it as "no expand attempted".
    const artifacts = getMessageArtifacts(turn).filter((a) => a.type === 'tool_use');
    expect(artifacts).toHaveLength(1);
  });
});
