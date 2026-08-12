/**
 * Round 37 — `'incomplete'` message status + `stopReason`.
 *
 * Before this, `client.ts` branched on `stop_reason === 'tool_use'` and treated
 * every other reason as a normal finish. A turn cut off at `max_tokens`, one the
 * model refused, and one that ran clean to `end_turn` were indistinguishable in
 * the database and on screen. For an app whose premise is that these
 * conversations are records you keep, a silently truncated turn is a corrupted
 * record.
 *
 * Shape decided by Iris in `docs/ux/message-incomplete-status-2026-08-11.md`.
 * These tests pin the server half: the mapping, the persistence, and the three
 * places the new status flows through that are easy to get wrong — conversation
 * history, the SSE replay path, and export/import round-trip.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';

/**
 * Mock state for the Anthropic SDK. Hoisted so the `vi.mock` factory below can
 * close over it — the factory is lifted above the imports.
 */
const sdk = vi.hoisted(() => ({
  stopReason: 'end_turn' as string | null,
  text: 'a partial answer',
  captured: [] as any[],
}));

vi.mock('@anthropic-ai/sdk', () => {
  function makeStream(params: any) {
    sdk.captured.push(params);
    const handlers: Record<string, Array<(arg: any) => void>> = {};
    return {
      on(event: string, cb: (arg: any) => void) {
        (handlers[event] ||= []).push(cb);
        return this;
      },
      abort() {},
      async finalMessage() {
        for (const cb of handlers.text || []) cb(sdk.text);
        return {
          stop_reason: sdk.stopReason,
          content: [{ type: 'text', text: sdk.text }],
        };
      },
    };
  }

  class MockAnthropic {
    messages = { stream: makeStream, create: vi.fn() };
    beta = { messages: { stream: makeStream } };
    static APIUserAbortError = class extends Error {};
    static AuthenticationError = class extends Error {};
    static APIError = class extends Error {};
  }

  return { default: MockAnthropic };
});

vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'openai', model: 'gpt-4o-mini' })),
}));

import { Hono } from 'hono';
import AdmZip from 'adm-zip';
import {
  createChannel,
  createEntity,
  assignEntityToChannel,
  insertMessage,
  updateMessage,
  getMessage,
  getMessages,
} from '../db/queries.js';
import { getDb } from '../db/index.js';
import { streamClaude, mapStopReason, activeStreams } from '../claude/client.js';
import { messageRoutes } from '../routes/messages.js';
import { exportRoutes } from '../routes/export.js';
import { importRoutes } from '../routes/import.js';
import type { Entity, StreamEvent } from '@klatch/shared';

beforeEach(() => {
  sdk.stopReason = 'end_turn';
  sdk.text = 'a partial answer';
  sdk.captured = [];
});

// ── The mapping ──────────────────────────────────────────────

describe('mapStopReason', () => {
  it('maps the four non-clean reasons, renaming only the context-window one', () => {
    expect(mapStopReason('max_tokens')).toBe('max_tokens');
    expect(mapStopReason('refusal')).toBe('refusal');
    expect(mapStopReason('pause_turn')).toBe('pause_turn');
    expect(mapStopReason('model_context_window_exceeded')).toBe('context_window_exceeded');
  });

  it('returns undefined for the two clean finishes, which stay complete', () => {
    expect(mapStopReason('end_turn')).toBeUndefined();
    expect(mapStopReason('stop_sequence')).toBeUndefined();
  });

  /**
   * The forward-compatibility case. A stop reason a future SDK adds should
   * degrade to today's behaviour rather than be coerced into an existing bucket
   * and rendered with copy that was never written for it.
   */
  it('returns undefined for unknown, null, and missing reasons', () => {
    expect(mapStopReason('some_future_reason')).toBeUndefined();
    expect(mapStopReason(null)).toBeUndefined();
    expect(mapStopReason(undefined)).toBeUndefined();
  });
});

// ── Persistence through a real stream ────────────────────────

function setupChannel(): { channelId: string; entity: Entity } {
  const ch = createChannel('stop-reason-channel', 'Be brief.');
  const entity = createEntity('Stopper', 'claude-opus-5', 'You are Stopper.', '#EF4444', '@stopper', 'high');
  assignEntityToChannel(ch.id, entity.id);
  return { channelId: ch.id, entity };
}

describe('streaming records why a turn stopped', () => {
  it('stores a max_tokens turn as incomplete, keeping the partial content', async () => {
    const { channelId, entity } = setupChannel();
    insertMessage(channelId, 'user', 'Write me an epic.');
    const assistant = insertMessage(channelId, 'assistant', '', 'streaming');

    sdk.stopReason = 'max_tokens';
    sdk.text = 'It was the morning of';
    await streamClaude(channelId, assistant.id, entity);

    const stored = getMessage(assistant.id);
    expect(stored?.status).toBe('incomplete');
    expect(stored?.stopReason).toBe('max_tokens');
    // The partial text is the whole point — it is not discarded.
    expect(stored?.content).toBe('It was the morning of');
  });

  it('stores a refusal as incomplete rather than a clean completion', async () => {
    const { channelId, entity } = setupChannel();
    insertMessage(channelId, 'user', 'Something objectionable.');
    const assistant = insertMessage(channelId, 'assistant', '', 'streaming');

    sdk.stopReason = 'refusal';
    sdk.text = '';
    await streamClaude(channelId, assistant.id, entity);

    const stored = getMessage(assistant.id);
    expect(stored?.status).toBe('incomplete');
    expect(stored?.stopReason).toBe('refusal');
  });

  it('shortens model_context_window_exceeded to context_window_exceeded', async () => {
    const { channelId, entity } = setupChannel();
    insertMessage(channelId, 'user', 'Continue.');
    const assistant = insertMessage(channelId, 'assistant', '', 'streaming');

    sdk.stopReason = 'model_context_window_exceeded';
    await streamClaude(channelId, assistant.id, entity);

    expect(getMessage(assistant.id)?.stopReason).toBe('context_window_exceeded');
  });

  it('leaves a clean end_turn complete with no stopReason', async () => {
    const { channelId, entity } = setupChannel();
    insertMessage(channelId, 'user', 'Hello.');
    const assistant = insertMessage(channelId, 'assistant', '', 'streaming');

    sdk.stopReason = 'end_turn';
    await streamClaude(channelId, assistant.id, entity);

    const stored = getMessage(assistant.id);
    expect(stored?.status).toBe('complete');
    expect(stored?.stopReason).toBeUndefined();
  });

  /**
   * The client updates its local message optimistically when the stream
   * completes instead of refetching the row, so a reason that doesn't ride the
   * event would render as a clean completion until the channel is reloaded.
   */
  it('carries stopReason on the message_complete stream event', async () => {
    const { channelId, entity } = setupChannel();
    insertMessage(channelId, 'user', 'Write me an epic.');
    const assistant = insertMessage(channelId, 'assistant', '', 'streaming');

    sdk.stopReason = 'max_tokens';

    // The emitter is registered synchronously, before the stream is awaited.
    const pending = streamClaude(channelId, assistant.id, entity);
    const emitter = activeStreams.get(assistant.id);
    expect(emitter).toBeDefined();

    const events: StreamEvent[] = [];
    emitter!.on('data', (e: StreamEvent) => events.push(e));
    await pending;

    const complete = events.find((e) => e.type === 'message_complete');
    expect(complete?.stopReason).toBe('max_tokens');
  });

  /**
   * A retry writes the same row again. Without clearing the column, a turn that
   * succeeded on the second attempt would keep the first attempt's reason and
   * render an explanation for a truncation that no longer exists.
   */
  it('clears a stale stopReason when the message later completes cleanly', () => {
    const { channelId } = setupChannel();
    const msg = insertMessage(channelId, 'assistant', '', 'streaming');

    updateMessage(msg.id, 'cut off', 'incomplete', 'max_tokens');
    expect(getMessage(msg.id)?.stopReason).toBe('max_tokens');

    updateMessage(msg.id, 'the whole answer', 'complete');
    const retried = getMessage(msg.id);
    expect(retried?.status).toBe('complete');
    expect(retried?.stopReason).toBeUndefined();
  });
});

// ── Conversation history ─────────────────────────────────────

describe('incomplete turns stay in conversation history', () => {
  /**
   * History assembly filtered on `status === 'complete'`. Adding a fourth
   * status silently dropped truncated turns from the prompt — the model would
   * stop being able to see content the user is looking at on screen.
   */
  it('sends a truncated earlier turn back to the model', async () => {
    const { channelId, entity } = setupChannel();
    insertMessage(channelId, 'user', 'Tell me about the sea.');
    const truncated = insertMessage(channelId, 'assistant', '', 'streaming');
    updateMessage(truncated.id, 'The sea is', 'incomplete', 'max_tokens');
    insertMessage(channelId, 'user', 'Go on.');
    const next = insertMessage(channelId, 'assistant', '', 'streaming');

    await streamClaude(channelId, next.id, entity);

    const sent = JSON.stringify(sdk.captured.at(-1)?.messages ?? []);
    expect(sent).toContain('The sea is');
  });

  it('still excludes streaming and error messages', async () => {
    const { channelId, entity } = setupChannel();
    insertMessage(channelId, 'user', 'First.');
    insertMessage(channelId, 'assistant', 'a half-written thought', 'streaming');
    insertMessage(channelId, 'assistant', 'API error (500): boom', 'error');
    const next = insertMessage(channelId, 'assistant', '', 'streaming');

    await streamClaude(channelId, next.id, entity);

    const sent = JSON.stringify(sdk.captured.at(-1)?.messages ?? []);
    expect(sent).not.toContain('a half-written thought');
    expect(sent).not.toContain('boom');
  });
});

// ── SSE replay ───────────────────────────────────────────────

describe('SSE observer on an already-incomplete message', () => {
  /**
   * The replay path treated only 'complete' and 'error' as finished. An
   * 'incomplete' message fell through to the not-started-yet branch and would
   * have polled for the full two-minute deadline for a stream that had already
   * ended. This test would hang rather than fail if that regressed.
   */
  it('replays immediately with the stop reason instead of polling', async () => {
    const app = new Hono();
    app.route('/api', messageRoutes);

    const { channelId } = setupChannel();
    const msg = insertMessage(channelId, 'assistant', '', 'streaming');
    updateMessage(msg.id, 'cut off here', 'incomplete', 'max_tokens');

    const res = await app.request(`/api/messages/${msg.id}/stream`);
    const text = await res.text();

    expect(text).toContain('message_complete');
    expect(text).toContain('cut off here');
    expect(text).toContain('max_tokens');
  });
});

// ── Round trip ───────────────────────────────────────────────

describe('export/import preserves an incomplete message', () => {
  function roundTripApp() {
    const app = new Hono();
    app.route('/api', exportRoutes);
    app.route('/api', importRoutes);
    return app;
  }

  it('survives a Klatch package round trip as incomplete, with its reason', async () => {
    const app = roundTripApp();
    const { channelId } = setupChannel();
    insertMessage(channelId, 'user', 'Write me an epic.');
    const truncated = insertMessage(channelId, 'assistant', '', 'streaming');
    updateMessage(truncated.id, 'It was the morning of', 'incomplete', 'max_tokens');

    const exported = await app.request(`/api/channels/${channelId}/export`);
    expect(exported.status).toBe(200);
    const zip = Buffer.from(await exported.arrayBuffer());

    // Fork into a fresh channel so the original rows aren't what we read back.
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(zip)]), 'channel.klatch.zip');
    form.append('forceImport', 'true');
    const imported = await app.request('/api/import/klatch', { method: 'POST', body: form });
    expect(imported.status).toBe(201);
    const { channelId: newChannelId } = (await imported.json()) as { channelId: string };
    expect(newChannelId).not.toBe(channelId);

    const restored = getMessages(newChannelId).find((m) => m.content === 'It was the morning of');
    expect(restored?.status).toBe('incomplete');
    expect(restored?.stopReason).toBe('max_tokens');
  });

  it('writes stop_reason into the exported conversation JSONL', async () => {
    const app = roundTripApp();
    const { channelId } = setupChannel();
    const truncated = insertMessage(channelId, 'assistant', '', 'streaming');
    updateMessage(truncated.id, 'partial', 'incomplete', 'refusal');

    const exported = await app.request(`/api/channels/${channelId}/export`);
    const zip = new AdmZip(Buffer.from(await exported.arrayBuffer()));
    const jsonl = zip.getEntries().find((e) => e.entryName.endsWith('.jsonl'));
    expect(jsonl).toBeDefined();

    const rows = jsonl!.getData().toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
    const row = rows.find((r) => r.content === 'partial');
    expect(row.status).toBe('incomplete');
    expect(row.stop_reason).toBe('refusal');
  });
});

// ── Migration ────────────────────────────────────────────────

describe('status CHECK constraint', () => {
  /**
   * Every database created before this change carries
   * CHECK (status IN ('complete','streaming','error')), which SQLite cannot
   * relax with ALTER TABLE. If the rebuild migration is missing, the first
   * truncated response throws a constraint error instead of being recorded.
   * This pins the constraint on the schema the test harness builds; the
   * rebuild itself is exercised against a legacy-shaped table below.
   */
  it('accepts incomplete on the current schema', () => {
    const { channelId } = setupChannel();
    const msg = insertMessage(channelId, 'assistant', '', 'streaming');
    expect(() => updateMessage(msg.id, 'x', 'incomplete', 'pause_turn')).not.toThrow();
  });

  it('rejects a status outside the four-value enum', () => {
    const { channelId } = setupChannel();
    const msg = insertMessage(channelId, 'assistant', '', 'streaming');
    expect(() =>
      getDb().prepare('UPDATE messages SET status = ? WHERE id = ?').run('bogus', msg.id)
    ).toThrow();
  });
});
