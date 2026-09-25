import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { insertMessage, assignEntityToChannel } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { DEFAULT_MODEL, DEFAULT_ENTITY_ID } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

/**
 * Round 269, Daedalus. This literal was inline at eight call sites, byte-identical at each, and
 * missing `effort` and `createdAt` — both required on `Entity` — so `tsc --noEmit` reported TS2345
 * eight times and `npm test` never reached a suite. Hoisted rather than patched eight times: an
 * annotated single source cannot drift from itself, and the next required field on `Entity` breaks
 * one line instead of eight. Values match the fixture idiom in `mentions.test.ts`.
 */
const ENTITY: Entity = {
  id: DEFAULT_ENTITY_ID,
  name: 'Claude',
  model: DEFAULT_MODEL,
  effort: 'high',
  systemPrompt: '',
  color: '#6B7280',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// ── Mock Anthropic SDK to capture call parameters ───────────

const mockStream = vi.fn();
const mockBetaStream = vi.fn();

function createMockStreamObj() {
  const emitter = {
    _handlers: {} as Record<string, Function>,
    on(event: string, fn: Function) {
      emitter._handlers[event] = fn;
      return emitter;
    },
    async finalMessage() {
      if (emitter._handlers.text) emitter._handlers.text('Hello');
      return {
        id: 'msg-mock',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello' }],
        model: DEFAULT_MODEL,
        stop_reason: 'end_turn',
      };
    },
    abort() {},
  };
  return emitter;
}

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        stream: mockStream,
      };
      beta = {
        messages: {
          stream: mockBetaStream,
        },
      };
    },
  };
});

// Must import streamClaude AFTER mock is set up
const { streamClaude } = await import('../claude/client.js');

/** Create an imported channel directly in the DB (createChannel doesn't accept source) */
function createImportedChannel(name: string, source: string): string {
  const db = getDb();
  const id = `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(
    'INSERT INTO channels (id, name, system_prompt, model, mode, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, '', DEFAULT_MODEL, 'panel', source, new Date().toISOString());
  return id;
}

// ── Tests ───────────────────────────────────────────────────

describe('streamClaudeCore — API parameters (Round 13 B3)', () => {
  beforeEach(() => {
    mockStream.mockReset();
    mockBetaStream.mockReset();
    mockStream.mockReturnValue(createMockStreamObj());
    mockBetaStream.mockReturnValue(createMockStreamObj());
  });

  it('passes thinking.display = "omitted" in standard (non-compaction) path', async () => {
    const channelId = 'default'; // native channel from setup.ts
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    expect(mockStream).toHaveBeenCalledTimes(1);
    const params = mockStream.mock.calls[0][0];
    expect(params.thinking).toEqual({ type: 'adaptive', display: 'omitted' });
  });

  it('passes cache_control = { type: "ephemeral" } in standard path', async () => {
    const channelId = 'default';
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    const params = mockStream.mock.calls[0][0];
    expect(params.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('passes thinking.display = "omitted" in beta (compaction) path', async () => {
    const channelId = createImportedChannel('Imported Channel', 'claude-code');
    assignEntityToChannel(channelId, DEFAULT_ENTITY_ID);
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    expect(mockBetaStream).toHaveBeenCalledTimes(1);
    const params = mockBetaStream.mock.calls[0][0];
    expect(params.thinking).toEqual({ type: 'adaptive', display: 'omitted' });
  });

  it('passes cache_control = { type: "ephemeral" } in beta path', async () => {
    const channelId = createImportedChannel('Imported Channel 2', 'claude-code');
    assignEntityToChannel(channelId, DEFAULT_ENTITY_ID);
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    const params = mockBetaStream.mock.calls[0][0];
    expect(params.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('passes compaction beta and context_management in beta path', async () => {
    const channelId = createImportedChannel('Imported Channel 3', 'claude-code');
    assignEntityToChannel(channelId, DEFAULT_ENTITY_ID);
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    const params = mockBetaStream.mock.calls[0][0];
    expect(params.betas).toContain('compact-2026-01-12');
    expect(params.context_management).toBeDefined();
    expect(params.context_management.edits[0].type).toBe('compact_20260112');
    expect(params.context_management.edits[0].trigger.type).toBe('input_tokens');
  });

  it('uses standard path (not beta) for native channels', async () => {
    const channelId = 'default';
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    expect(mockStream).toHaveBeenCalledTimes(1);
    expect(mockBetaStream).not.toHaveBeenCalled();
  });

  it('uses beta path for imported (claude-code) channels', async () => {
    const channelId = createImportedChannel('CC Import', 'claude-code');
    assignEntityToChannel(channelId, DEFAULT_ENTITY_ID);
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    expect(mockBetaStream).toHaveBeenCalledTimes(1);
    expect(mockStream).not.toHaveBeenCalled();
  });

  it('uses beta path for imported (claude-ai) channels', async () => {
    const channelId = createImportedChannel('AI Import', 'claude-ai');
    assignEntityToChannel(channelId, DEFAULT_ENTITY_ID);
    insertMessage(channelId, 'user', 'Hello');
    const asst = insertMessage(channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, DEFAULT_ENTITY_ID);

    const entity = ENTITY;
    await streamClaude(channelId, asst.id, entity);

    expect(mockBetaStream).toHaveBeenCalledTimes(1);
    expect(mockStream).not.toHaveBeenCalled();
  });
});
