/**
 * Round 20: UX evaluation fix tests (server-side)
 *
 * Tests for Iris's UX evaluation fixes shipped by Daedalus (April 13).
 * Server-side coverage for O3 (channel context for chats) and prompt-debug
 * integration. Client-side tests (P2 delete confirm, O5 entity badge,
 * P3 fidelity readout) are in the client test file.
 */

import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import {
  createChannel,
  updateChannel,
  getChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
} from '../db/queries.js';

// Mock streaming
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

import { Hono } from 'hono';
import { channelRoutes } from '../routes/channels.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', channelRoutes);
  return app;
}

// ── O3: Channel context for chats ────────────────────────────

describe('O3 — channel context for chat-type channels', () => {
  it('chat-type channel stores system prompt via API', async () => {
    const ch = createChannel('chat-with-context', '');

    // Update the chat channel with a system prompt
    const updated = updateChannel(ch.id, { systemPrompt: 'Focus on debugging.' });
    expect(updated).toBeDefined();
    expect(updated!.systemPrompt).toBe('Focus on debugging.');

    const fetched = getChannel(ch.id);
    expect(fetched!.systemPrompt).toBe('Focus on debugging.');
  });

  it('chat-type channel system prompt appears in prompt-debug L4', async () => {
    const ch = createChannel('chat-l4-test', 'This chat is about architecture.');
    const entity = createEntity('DebugBot', 'claude-opus-4-6', 'You are helpful.', '#FF0000');
    assignEntityToChannel(ch.id, entity.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.layers['4_channelAddendum']).toContain('ACTIVE');
    expect(body.layers['4_channelAddendum']).toContain('32 chars');
    expect(body.assembledPrompt).toContain('This chat is about architecture.');
  });

  it('chat-type channel with empty system prompt shows EMPTY in prompt-debug L4', async () => {
    const ch = createChannel('chat-no-context', '');
    const entity = createEntity('EmptyBot', 'claude-opus-4-6', 'Hi.', '#00FF00');
    assignEntityToChannel(ch.id, entity.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.layers['4_channelAddendum']).toBe('EMPTY');
  });

  it('chat-type channel system prompt is included in assembled prompt', async () => {
    const ch = createChannel('chat-full-l4', 'We are reviewing the API design.');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    const body = await res.json();

    // L4 (channel context) should appear in assembled prompt
    expect(body.assembledPrompt).toContain('We are reviewing the API design.');
    // L5 (entity prompt) — uses default entity from createChannel
    expect(body.assembledPrompt).toContain('You are a helpful assistant.');
  });

  it('chat-type channel with project gets full 5-layer assembly', async () => {
    const proj = createProject('Chat Project', 'Use TypeScript.', 'native', {}, 'Remember dark mode.');
    const ch = createChannel('chat-with-project', 'Focus on testing.');
    setChannelProject(ch.id, proj.id);

    const entity = createEntity('FullBot', 'claude-opus-4-6', 'Be thorough.', '#FF00FF');
    assignEntityToChannel(ch.id, entity.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    const body = await res.json();

    // L2 (project instructions) present
    expect(body.layers['2_projectInstructions']).toContain('ACTIVE');
    // L3 (project memory) present
    expect(body.layers['3_projectMemory']).toContain('ACTIVE');
    // L4 (channel context) present
    expect(body.layers['4_channelAddendum']).toContain('ACTIVE');
    // L5 (entity prompt) present — uses first entity (default from createChannel)
    expect(body.layers['5_entityPrompt']).toBeDefined();

    // L2, L3, L4 content all in assembled prompt
    expect(body.assembledPrompt).toContain('Use TypeScript.');
    expect(body.assembledPrompt).toContain('Remember dark mode.');
    expect(body.assembledPrompt).toContain('Focus on testing.');
  });
});

// ── Entity count in enriched channel API ─────────────────────

describe('O5 — entity count in channel data', () => {
  it('enriched channel list includes entity count', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels');
    expect(res.status).toBe(200);

    const body = await res.json();
    // Default channel exists from setup with 1 entity
    const defaultChannel = body.find((ch: any) => ch.id === 'default');
    expect(defaultChannel).toBeDefined();
    expect(typeof defaultChannel.entityCount).toBe('number');
  });

  it('channel with multiple entities shows correct count', async () => {
    const ch = createChannel('multi-entity-count', '');
    const entity2 = createEntity('SecondBot', 'claude-opus-4-6', 'Hi.', '#AABB00');
    assignEntityToChannel(ch.id, entity2.id);

    const app = createTestApp();
    const res = await app.request('/api/channels');
    const body = await res.json();

    const found = body.find((c: any) => c.id === ch.id);
    expect(found).toBeDefined();
    // Default entity (auto-assigned) + SecondBot = 2
    expect(found.entityCount).toBe(2);
  });
});
