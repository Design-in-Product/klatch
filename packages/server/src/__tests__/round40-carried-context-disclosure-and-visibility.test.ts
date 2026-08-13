/**
 * Round 40 — the three things the first live probe of layer 6 asked for.
 *
 * Round 38 wired carried context into inference and Theseus drove the first
 * live turn through it on 8/12
 * (`docs/research/carried-context-conveyance-probe-2026-08-12.md`). The seed
 * worked and three separate gaps opened behind it, each ruled on by a different
 * seat and all three landed here:
 *
 * 1. **Disclosure.** Conveyance and disclosure are separate problems. An agent
 *    given a fact from its own 1-1 declined to repeat it in the klatch — twice,
 *    including after explicit owner authorisation — while a second agent in the
 *    same room volunteered its carried fact unprompted. Theseus's option (b),
 *    a norm stated in the block header, is now `DISCLOSURE_NORM`.
 * 2. **Visibility.** Iris ruled (`docs/ux/carried-context-visibility-2026-08-13.md`)
 *    that the human must passively see *that* context was carried and from how
 *    many conversations — existence and count, never content, never the names.
 *    That needs a per-message record written at turn time: the `carried_context`
 *    artifact.
 * 3. **Observability past seat 1.** `prompt-debug` assembled participant 1's
 *    prompt and only participant 1's, which is exactly the wrong shape for a
 *    layer assembled per entity. `?entityId=` fixes it.
 *
 * What these tests are trying to catch: the norm silently not reaching the real
 * inference path (as opposed to `buildSystemPrompt` in isolation); the norm
 * leaking into rooms it doesn't govern; the visibility artifact carrying content
 * or channel names it was explicitly scoped not to carry; the room count
 * claiming a conversation the block no longer quotes; and `?entityId=` changing
 * the answer for callers that don't pass it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { createChannel, createEntity, getArtifactsForChannel, getMessageArtifacts, createCarriedContextArtifact } from '../db/queries.js';
import { getDb } from '../db/index.js';
import {
  buildCarriedContext,
  buildCarriedContextBlock,
  DISCLOSURE_NORM,
} from '../claude/carried-context.js';
import { buildSystemPrompt, streamClaude, streamClaudeRoundtable } from '../claude/client.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

// Captured `system` prompts, so the norm can be asserted where it actually
// matters — on the wire to the model, not on a helper's return value.
const h = vi.hoisted(() => ({ sent: [] as any[], failStream: false }));

vi.mock('@anthropic-ai/sdk', async () => {
  const actual = await vi.importActual<any>('@anthropic-ai/sdk');
  const fakeStream = (params: any) => {
    h.sent.push(params);
    return {
      on: () => {},
      finalMessage: async () => {
        if (h.failStream) throw new Error('upstream stream failed');
        return { stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] };
      },
    };
  };
  class MockAnthropic {
    messages = { stream: fakeStream };
    beta = { messages: { stream: fakeStream } };
  }
  // The catch path in `streamClaudeCore` branches on `Anthropic.APIUserAbortError`
  // and friends; a bare mock class makes `instanceof undefined` throw and turns
  // any failure into an unreadable TypeError.
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

/** An assistant row for a turn that is about to stream — what POST creates. */
function pendingTurn(channelId: string, entityId: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-13T09:00:00.000Z');
  return id;
}

let agent: Entity;
let colleague: Entity;
let oneOnOne: Channel;
let secondRoom: Channel;
let klatch: Channel;

beforeEach(() => {
  h.sent.length = 0;

  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  colleague = createEntity('Corvus', DEFAULT_MODEL, 'You are Corvus.', '#f59e0b');

  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  secondRoom = createChannel('vesper-ops', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id, colleague.id]);

  say(oneOnOne.id, agent.id, 'the rollback codeword is basalt-heron-72', '2026-08-01T10:00:00.000Z');
  say(secondRoom.id, agent.id, 'the freight elevator is out until the 14th', '2026-08-01T11:00:00.000Z');
});

// ── 1. Block metadata ────────────────────────────────────────

describe('Round 40 — buildCarriedContextBlock', () => {
  it('returns the same text the string API returns — the counts are additive, not a fork', () => {
    expect(buildCarriedContextBlock(agent, klatch)!.text).toBe(buildCarriedContext(agent, klatch));
  });

  it('reports what it carried, and from how many conversations', () => {
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.messageCount).toBe(2);
    expect(block.roomCount).toBe(2);
    expect(block.omittedCount).toBe(0);
  });

  it('counts only rooms that survived the budget, not rooms that were fetched', () => {
    // The defect this pins: the room count was taken over everything
    // `getEntityTranscript` returned, while the block itself contains only what
    // fit. A budget that evicts every line from a conversation left the footer —
    // and now the UI chip — claiming a conversation the agent cannot see.
    const block = buildCarriedContextBlock(agent, klatch, { maxChars: 60 })!;
    expect(block.messageCount).toBe(1);
    expect(block.roomCount).toBe(1);
    expect(block.omittedCount).toBe(1);
    expect(block.text).toContain('from 1 other conversation(s)');
    expect(block.text).toContain('1 more dropped');
  });

  it('is undefined, not an empty block, when there is nothing to carry', () => {
    const stranger = createEntity('Nobody', DEFAULT_MODEL, '', '#000');
    const room = createChannel('empty-klatch', '', DEFAULT_MODEL, undefined, 'klatch', [stranger.id]);
    expect(buildCarriedContextBlock(stranger, room)).toBeUndefined();
  });
});

// ── 2. Disclosure norm ───────────────────────────────────────

describe('Round 40 — the disclosure norm', () => {
  it('is stated in the block', () => {
    expect(buildCarriedContextBlock(agent, klatch)!.text).toContain(DISCLOSURE_NORM);
  });

  it('survives into the assembled system prompt', () => {
    const carried = buildCarriedContextBlock(agent, klatch);
    const prompt = buildSystemPrompt(agent, undefined, klatch, null, [], [], { carriedContext: carried?.text });
    expect(prompt).toContain(DISCLOSURE_NORM);
  });

  it('reaches the model on the real inference path, not just the helper', async () => {
    // The 8/12 probe found the model reasoning from the provenance labels this
    // module writes. A norm that stops one call site short of the wire would
    // look identical in every unit test and change nothing in the room.
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].system).toContain(DISCLOSURE_NORM);
    expect(h.sent[0].system).toContain('basalt-heron-72');
  });

  it('is not stated in a 1-1, where there is no klatch crossing to have a norm about', async () => {
    const turn = pendingTurn(oneOnOne.id, agent.id);
    await streamClaude(oneOnOne.id, turn, agent);

    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].system).not.toContain(DISCLOSURE_NORM);
  });

  it('states the fact the refusal turned on — one workspace, one reader', () => {
    // Not prose-checking the wording: this is the single load-bearing claim.
    // The probe's refusal was "I can't verify who's reading here", which is a
    // false premise about a single-user local tool rather than a judgment call.
    // If a future edit drops this, the norm stops answering the actual objection.
    expect(DISCLOSURE_NORM).toMatch(/single-user/);
  });
});

// ── 3. The visibility artifact ───────────────────────────────

describe('Round 40 — carried_context artifact (Iris, 8/13)', () => {
  it('is written for a klatch turn that carried something', async () => {
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    const artifacts = getMessageArtifacts(turn).filter((a) => a.type === 'carried_context');
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].inputSummary).toBe('2 other conversations');
    // Widened in Round 41 (Theseus's 8/13 probe 3): what the turn did *not* see
    // is recorded alongside what it did. Asserted exhaustively on purpose — this
    // payload is what a UI reads, so a field appearing should fail here first.
    expect(JSON.parse(artifacts[0].content!)).toEqual({
      roomCount: 2, messageCount: 2, omittedCount: 0, hasOlderHistory: false,
    });
  });

  it('is not written for a 1-1 turn — the chip must not appear where the layer is inactive', async () => {
    const turn = pendingTurn(oneOnOne.id, agent.id);
    await streamClaude(oneOnOne.id, turn, agent);
    expect(getMessageArtifacts(turn).filter((a) => a.type === 'carried_context')).toHaveLength(0);
  });

  it('is not written for a klatch turn with nothing to carry', async () => {
    const turn = pendingTurn(klatch.id, colleague.id);
    await streamClaude(klatch.id, turn, colleague);
    expect(getMessageArtifacts(turn).filter((a) => a.type === 'carried_context')).toHaveLength(0);
  });

  it('records what the turn was GIVEN, so a failed stream still shows the human what went in', async () => {
    // The artifact answers "did this agent arrive carrying context", which is
    // settled at assembly time. Tying it to a successful completion would make
    // the signal disappear from exactly the messages a human is most likely to
    // be inspecting.
    const turn = pendingTurn(klatch.id, agent.id);
    h.failStream = true;
    try {
      await streamClaude(klatch.id, turn, agent);
    } finally {
      h.failStream = false;
    }

    // Precondition: the turn really did fail, so the assertion below is about
    // the failure path and not about a stream that quietly succeeded.
    const row = getDb().prepare('SELECT status FROM messages WHERE id = ?').get(turn) as any;
    expect(row.status).toBe('error');
    expect(getMessageArtifacts(turn).filter((a) => a.type === 'carried_context')).toHaveLength(1);
  });

  it('carries the count and nothing else — no channel names, no message content', async () => {
    // Iris's ruling is existence-and-count, explicitly not a content dump, and
    // explicitly not the source names (naming sources edges into the disclosure
    // question). The row is the last place that could leak either.
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    const row = JSON.stringify(getMessageArtifacts(turn).filter((a) => a.type === 'carried_context')[0]);
    expect(row).not.toContain('vesper-1-1');
    expect(row).not.toContain('vesper-ops');
    expect(row).not.toContain('basalt-heron-72');
  });

  it('reaches the client through the channel artifact query the message list already reads', async () => {
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    const byMessage = getArtifactsForChannel(klatch.id);
    expect(byMessage.get(turn)?.some((a) => a.type === 'carried_context')).toBe(true);
  });

  it('is written per participant on the roundtable path, each with its own count', async () => {
    // Two call sites assemble layer 6 — panel (`streamClaude`) and roundtable
    // (`streamClaudeRoundtable`). Every test above drives the first. A klatch in
    // roundtable mode is the default shape of the canonical use case, so wiring
    // one and not the other would leave the chip missing from most real rooms.
    say(createChannel('corvus-ops', '', DEFAULT_MODEL, undefined, 'chat', [colleague.id]).id, colleague.id,
      'facilities are handled', '2026-08-01T12:00:00.000Z');
    const vesperTurn = pendingTurn(klatch.id, agent.id);
    const corvusTurn = pendingTurn(klatch.id, colleague.id);

    await streamClaudeRoundtable(klatch.id, [
      { assistantMessageId: vesperTurn, entity: agent },
      { assistantMessageId: corvusTurn, entity: colleague },
    ]);

    const vesper = getMessageArtifacts(vesperTurn).filter((a) => a.type === 'carried_context');
    const corvus = getMessageArtifacts(corvusTurn).filter((a) => a.type === 'carried_context');
    expect(vesper[0]?.inputSummary).toBe('2 other conversations');
    expect(corvus[0]?.inputSummary).toBe('1 other conversation');
  });

  it('says "conversation" not "conversations" when there is one', () => {
    const turn = pendingTurn(klatch.id, agent.id);
    const artifact = createCarriedContextArtifact(turn, {
      roomCount: 1, messageCount: 4, omittedCount: 0, hasOlderHistory: false,
    });
    expect(artifact.inputSummary).toBe('1 other conversation');
  });
});

// ── 4. prompt-debug ?entityId= ───────────────────────────────

describe('Round 40 — GET /channels/:id/prompt-debug?entityId=', () => {
  let app: ReturnType<typeof createTestApp>;
  beforeEach(() => {
    app = createTestApp();
    say(createChannel('corvus-1-1', '', DEFAULT_MODEL, undefined, 'chat', [colleague.id]).id, colleague.id,
      'facilities are handled', '2026-08-01T12:00:00.000Z');
  });

  it('defaults to the first participant — callers that never pass the parameter see no change', async () => {
    const res = await app.request(`/api/channels/${klatch.id}/prompt-debug`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.entityName).toBe('Vesper');
    expect(body.layers['6_carriedContext']).toContain('ACTIVE');
  });

  it('assembles the requested participant\'s prompt, with that participant\'s own carried context', async () => {
    // This is the case the route could not express before: in a klatch each
    // participant has a different layer 6, so one seat's prompt is not the
    // channel's prompt. Reading Corvus previously required building a throwaway
    // klatch that listed him first.
    const res = await app.request(`/api/channels/${klatch.id}/prompt-debug?entityId=${colleague.id}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.entityId).toBe(colleague.id);
    expect(body.entityName).toBe('Corvus');
    expect(body.assembledPrompt).toContain('facilities are handled');
    expect(body.assembledPrompt).not.toContain('basalt-heron-72');
  });

  it('lists every participant, so the ids are discoverable without knowing them first', async () => {
    const body = await (await app.request(`/api/channels/${klatch.id}/prompt-debug`)).json() as any;
    expect(body.participants.map((p: any) => p.name).sort()).toEqual(['Corvus', 'Vesper']);
  });

  it('reports the counts alongside the byte size', async () => {
    const body = await (await app.request(`/api/channels/${klatch.id}/prompt-debug`)).json() as any;
    expect(body.layers['6_carriedContext']).toContain('2 message(s) from 2 conversation(s)');
  });

  it('rejects an entity that is not in the room, and says who is', async () => {
    const outsider = createEntity('Stranger', DEFAULT_MODEL, '', '#000');
    const res = await app.request(`/api/channels/${klatch.id}/prompt-debug?entityId=${outsider.id}`);
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toContain('not a participant');
    expect(body.participants).toHaveLength(2);
  });
});
