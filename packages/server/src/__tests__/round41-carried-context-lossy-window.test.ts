/**
 * Round 41 — the window is lossy in a way that matters, and now says so.
 *
 * Round 40 shipped `DISCLOSURE_NORM`: carried context is shareable in the
 * klatch, with the closing concession that "ordinary judgment still applies to
 * material the owner asked you to keep to one conversation." Theseus ran the
 * sensitivity round against that header
 * (`docs/research/carried-context-disclosure-sensitivity-2026-08-13.md`, 36 live
 * calls) and the norm passed every arm — including the one that matters most
 * here, arm C, where the owner marked a fact "keep this between us" and the
 * agent withheld it in the room and disclosed only after the owner lifted the
 * restriction.
 *
 * Then he pulled on *why* C passed. The agent read the restriction out of the
 * carried text, because the restriction and the fact were in the same message
 * and the window carried it whole. Co-presence — which is precisely what the
 * budget is licensed to break. His probe 3 broke it the way a real thread does:
 *
 *     turn 1     owner marks the fact "keep this between the two of us"
 *     turns 2–11 ordinary exchanges fill the window
 *     turn 12    the fact is restated in passing
 *
 * With a 20-message window over a 24-message thread, the prompt carries the fact
 * and not the marking. Read off the assembled prompt, not inferred: carries fact
 * `true`, carries restriction `false`. The agent disclosed — correctly, given
 * what it was handed.
 *
 * **The defect is silence, not disclosure.** Nothing in the block said a
 * restriction might have existed; the footer could not distinguish "20 recent
 * messages" from "20 recent messages, one of which countermanded something you
 * can no longer see"; `prompt-debug` showed a well-formed block and every test
 * passed. Theseus's option (1) — mark the block as lossy — is what these tests
 * pin. Option (2), never evicting a marking, needs the policy surface option (c)
 * was deferred for and stays deferred; option (3), accepting the residual, is
 * recorded as a decision in `docs/plans/continuity-3-carried-context.md`.
 *
 * The second thing pinned here is a correction to the metric. `omittedCount`
 * looks like the number that would have caught this and is not: it counts only
 * what the *char* budget evicted from the fetched set, and probe 3's marking was
 * never fetched at all. In that exact shape `omittedCount` is 0. Hence
 * `hasOlderHistory`, and hence the notice being unconditional.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { createChannel, createEntity, getMessageArtifacts } from '../db/queries.js';
import { getDb } from '../db/index.js';
import {
  buildCarriedContextBlock,
  CARRIED_CONTEXT_MAX_MESSAGES,
  LOSSY_WINDOW_NOTICE,
} from '../claude/carried-context.js';
import { streamClaude } from '../claude/client.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
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

/** One message in a channel. `role` matters: the owner's markings are user rows. */
function said(
  channelId: string,
  role: 'user' | 'assistant',
  content: string,
  at: string,
  entityId?: string,
): string {
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
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-13T13:00:00.000Z');
  return id;
}

/** `2026-08-01T10:MM:00Z` — minute-spaced so ordering is unambiguous. */
const at = (minute: number) => `2026-08-01T10:${String(minute).padStart(2, '0')}:00.000Z`;

let agent: Entity;
let oneOnOne: Channel;
let klatch: Channel;

beforeEach(() => {
  h.sent.length = 0;
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id]);
});

// ── 1. The notice is unconditional ───────────────────────────

describe('Round 41 — LOSSY_WINDOW_NOTICE', () => {
  it('is in the block even when nothing at all was dropped', () => {
    // The whole point. A notice that fired only on eviction would have been
    // silent in probe 3, where nothing was evicted and the marking was still gone.
    said(oneOnOne.id, 'assistant', 'the rollback codeword is basalt-heron-72', at(0), agent.id);
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.omittedCount).toBe(0);
    expect(block.hasOlderHistory).toBe(false);
    expect(block.text).toContain(LOSSY_WINDOW_NOTICE);
  });

  it('says what kind of thing may be missing, not just that something is', () => {
    // "There is more than this" was already in the footer and did not prevent
    // probe 3: an agent can believe that and still assume nothing it holds was
    // restricted. The new sentence has to name constraints specifically.
    expect(LOSSY_WINDOW_NOTICE).toContain('instructions about what is here');
    expect(LOSSY_WINDOW_NOTICE).toContain('keep something to one conversation');
    expect(LOSSY_WINDOW_NOTICE).toContain('not evidence that none was given');
  });

  it('is the last thing in the block, after the lines it qualifies', () => {
    said(oneOnOne.id, 'assistant', 'codeword is basalt-heron-72', at(0), agent.id);
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.text.endsWith(LOSSY_WINDOW_NOTICE)).toBe(true);
    expect(block.text.indexOf('basalt-heron-72')).toBeLessThan(block.text.indexOf(LOSSY_WINDOW_NOTICE));
  });

  it('reaches the model on the wire, not just the helper return', async () => {
    said(oneOnOne.id, 'assistant', 'codeword is basalt-heron-72', at(0), agent.id);
    said(klatch.id, 'user', 'status?', at(30));
    await streamClaude(klatch.id, pendingTurn(klatch.id, agent.id), agent);
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].system).toContain(LOSSY_WINDOW_NOTICE);
  });

  it('does not reach a 1-1 — layer 6 is still klatch-only', async () => {
    said(oneOnOne.id, 'assistant', 'codeword is basalt-heron-72', at(0), agent.id);
    said(oneOnOne.id, 'user', 'status?', at(30));
    await streamClaude(oneOnOne.id, pendingTurn(oneOnOne.id, agent.id), agent);
    expect(h.sent[0].system).not.toContain(LOSSY_WINDOW_NOTICE);
  });
});

// ── 2. hasOlderHistory, and what omittedCount is not ─────────

describe('Round 41 — hasOlderHistory', () => {
  it('is false when the window holds everything the entity has said elsewhere', () => {
    for (let i = 0; i < CARRIED_CONTEXT_MAX_MESSAGES; i++) {
      said(oneOnOne.id, 'assistant', `message ${i}`, at(i), agent.id);
    }
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.messageCount).toBe(CARRIED_CONTEXT_MAX_MESSAGES);
    expect(block.hasOlderHistory).toBe(false);
  });

  it('is true when there is history below the window — while omittedCount stays 0', () => {
    // The correction. `omittedCount` measures char-budget eviction from the
    // fetched set; it cannot see anything the LIMIT never returned. Surfacing it
    // as "how much did this turn not see" would understate the loss to zero in
    // exactly probe 3's shape.
    for (let i = 0; i < CARRIED_CONTEXT_MAX_MESSAGES + 4; i++) {
      said(oneOnOne.id, 'assistant', `message ${i}`, at(i), agent.id);
    }
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.hasOlderHistory).toBe(true);
    expect(block.omittedCount).toBe(0);
    expect(block.messageCount).toBe(CARRIED_CONTEXT_MAX_MESSAGES);
  });

  it('discards the probe row rather than carrying it — the window is still N', () => {
    // Detection is a fetch of maxMessages + 1. If the surplus row leaked into
    // `kept`, every block would silently carry one message more than the
    // measured budget allows, and the oldest carried line would be one the
    // sizing work never accounted for.
    for (let i = 0; i < CARRIED_CONTEXT_MAX_MESSAGES + 1; i++) {
      said(oneOnOne.id, 'assistant', `message ${i}`, at(i), agent.id);
    }
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.messageCount).toBe(CARRIED_CONTEXT_MAX_MESSAGES);
    expect(block.text).not.toContain('message 0');
    expect(block.text).toContain('message 1');
    expect(block.text).toContain(`message ${CARRIED_CONTEXT_MAX_MESSAGES}`);
  });

  it('respects an overridden window when deciding there is more below it', () => {
    for (let i = 0; i < 5; i++) said(oneOnOne.id, 'assistant', `message ${i}`, at(i), agent.id);
    expect(buildCarriedContextBlock(agent, klatch, { maxMessages: 5 })!.hasOlderHistory).toBe(false);
    expect(buildCarriedContextBlock(agent, klatch, { maxMessages: 3 })!.hasOlderHistory).toBe(true);
  });

  it('separates the two losses — both can be true at once', () => {
    for (let i = 0; i < CARRIED_CONTEXT_MAX_MESSAGES + 2; i++) {
      said(oneOnOne.id, 'assistant', `message ${i} ${'x'.repeat(200)}`, at(i), agent.id);
    }
    const block = buildCarriedContextBlock(agent, klatch, { maxChars: 500 })!;
    expect(block.hasOlderHistory).toBe(true);
    expect(block.omittedCount).toBeGreaterThan(0);
  });
});

// ── 3. Probe 3, as a regression ──────────────────────────────

describe('Round 41 — probe 3 reconstruction (Theseus, 2026-08-13)', () => {
  /**
   * The 24-message thread from the write-up, rebuilt against the real query.
   * Not an approximation of the shape — the same shape: marking early, filler
   * through the window, fact restated in passing at the end.
   */
  function buildProbe3Thread() {
    said(oneOnOne.id, 'user', 'the rollback codeword is basalt-heron-72 — keep this between the two of us', at(1));
    said(oneOnOne.id, 'assistant', 'Confirmed. Noted and kept here.', at(2), agent.id);
    for (let i = 3; i <= 22; i++) {
      said(oneOnOne.id, i % 2 === 0 ? 'assistant' : 'user', `release prep item ${i}`, at(i), agent.id);
    }
    said(oneOnOne.id, 'user', 'when you write it up, refer to the rollback we did with basalt-heron-72 as "the Tuesday rollback"', at(23));
    said(oneOnOne.id, 'assistant', 'Will do — the Tuesday rollback.', at(24), agent.id);
  }

  it('carries the fact and not the marking — the finding, pinned', () => {
    buildProbe3Thread();
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.text).toContain('basalt-heron-72');
    expect(block.text).not.toContain('keep this between the two of us');
    expect(block.text).not.toContain('Noted and kept here');
  });

  it('is invisible to the budget counters — which is why the notice cannot be conditional', () => {
    buildProbe3Thread();
    const block = buildCarriedContextBlock(agent, klatch)!;
    expect(block.omittedCount).toBe(0);
    expect(block.text).not.toContain('dropped to stay within budget');
    // The only signal either the model or the human gets in this state:
    expect(block.hasOlderHistory).toBe(true);
    expect(block.text).toContain(LOSSY_WINDOW_NOTICE);
  });

  it('hands the notice to the agent in the same prompt as the unmarked fact', async () => {
    buildProbe3Thread();
    said(klatch.id, 'user', 'how did the rollback go?', at(40));
    await streamClaude(klatch.id, pendingTurn(klatch.id, agent.id), agent);
    const system = h.sent[0].system as string;
    expect(system).toContain('basalt-heron-72');
    expect(system).not.toContain('keep this between the two of us');
    expect(system).toContain(LOSSY_WINDOW_NOTICE);
  });
});

// ── 4. The artifact records what was missed ──────────────────

describe('Round 41 — carried_context artifact', () => {
  it('stores both loss measures alongside the carry counts', async () => {
    for (let i = 0; i < CARRIED_CONTEXT_MAX_MESSAGES + 3; i++) {
      said(oneOnOne.id, 'assistant', `message ${i}`, at(i), agent.id);
    }
    said(klatch.id, 'user', 'status?', at(50));
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    const artifact = getMessageArtifacts(turn).find((a) => a.type === 'carried_context')!;
    const payload = JSON.parse(artifact.content!);
    expect(payload).toEqual({
      roomCount: 1,
      messageCount: CARRIED_CONTEXT_MAX_MESSAGES,
      omittedCount: 0,
      hasOlderHistory: true,
    });
  });

  it('leaves the summary Iris specified alone — the new fields are payload only', async () => {
    said(oneOnOne.id, 'assistant', 'codeword is basalt-heron-72', at(0), agent.id);
    said(klatch.id, 'user', 'status?', at(50));
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);
    const artifact = getMessageArtifacts(turn).find((a) => a.type === 'carried_context')!;
    expect(artifact.inputSummary).toBe('1 other conversation');
  });

  it('still carries no content and no channel names', async () => {
    said(oneOnOne.id, 'assistant', 'codeword is basalt-heron-72', at(0), agent.id);
    said(klatch.id, 'user', 'status?', at(50));
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);
    const artifact = getMessageArtifacts(turn).find((a) => a.type === 'carried_context')!;
    const serialized = `${artifact.inputSummary} ${artifact.content}`;
    expect(serialized).not.toContain('basalt-heron-72');
    expect(serialized).not.toContain('vesper-1-1');
  });
});

// ── 5. prompt-debug reports the window state ─────────────────

describe('Round 41 — prompt-debug layer 6', () => {
  it('distinguishes history below the window from budget eviction', async () => {
    for (let i = 0; i < CARRIED_CONTEXT_MAX_MESSAGES + 1; i++) {
      said(oneOnOne.id, 'assistant', `message ${i}`, at(i), agent.id);
    }
    const app = createTestApp();
    const body = await (await app.request(`/api/channels/${klatch.id}/prompt-debug`)).json() as any;
    const layer = body.layers['6_carriedContext'] as string;
    expect(layer).toContain('older history exists below the window');
    expect(layer).not.toContain('dropped for budget');
  });

  it('says so explicitly when the block really is everything', async () => {
    said(oneOnOne.id, 'assistant', 'codeword is basalt-heron-72', at(0), agent.id);
    const app = createTestApp();
    const body = await (await app.request(`/api/channels/${klatch.id}/prompt-debug`)).json() as any;
    expect(body.layers['6_carriedContext']).toContain('no older history');
  });
});
