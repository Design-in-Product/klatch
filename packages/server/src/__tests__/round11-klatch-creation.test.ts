/**
 * Round 11: Klatch creation UI + model provenance test coverage
 *
 * Assignment from Daedalus (2026-03-21):
 * 1. Channel creation with type and project (POST /api/channels)
 * 2. Sidebar grouping: klatches appear under project with correct prefixes
 * 3. Entity assignment during creation
 * 4. Model provenance regression (modelLabel utility)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createChannel,
  createProject,
  setChannelProject,
  getAllChannelsEnriched,
  getChannel,
  getChannelEntities,
  assignEntityToChannel,
  createEntity,
  insertMessage,
} from '../db/queries.js';
import { AVAILABLE_MODELS } from '@klatch/shared';
import type { ModelId } from '@klatch/shared';

// Mock streaming — not needed for these tests
vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return {
    ...actual,
    streamClaude: vi.fn(),
  };
});

function createApp() {
  return createTestApp();
}

function jsonReq(body: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── 1. Channel creation with type and project ─────────────────────

describe('Channel creation with type and project (POST /api/channels)', () => {
  it('creates a channel with type "klatch" via API', async () => {
    const app = createApp();
    const project = createProject('Test Project', 'instructions');
    const res = await app.request(
      '/api/channels',
      jsonReq({ name: 'Design Review', type: 'klatch', projectId: project.id })
    );
    expect(res.status).toBe(201);
    const channel = await res.json();
    expect(channel.type).toBe('klatch');
    expect(channel.projectId).toBe(project.id);
  });

  it('creates a channel with type "klatch" and mode "roundtable"', async () => {
    const app = createApp();
    const project = createProject('P', 'I');
    const res = await app.request(
      '/api/channels',
      jsonReq({ name: 'Standup', type: 'klatch', mode: 'roundtable', projectId: project.id })
    );
    expect(res.status).toBe(201);
    const channel = await res.json();
    expect(channel.type).toBe('klatch');
    expect(channel.mode).toBe('roundtable');
  });

  it('rejects invalid type value', async () => {
    const app = createApp();
    const res = await app.request(
      '/api/channels',
      jsonReq({ name: 'Bad Type', type: 'forum' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid type');
  });

  it('defaults to type "chat" when type is omitted', async () => {
    const app = createApp();
    const res = await app.request(
      '/api/channels',
      jsonReq({ name: 'Regular Chat' })
    );
    expect(res.status).toBe(201);
    const channel = await res.json();
    // Type should be 'chat' (the default) or undefined — either way not 'klatch'
    expect(channel.type || 'chat').toBe('chat');
  });

  it('links channel to project when projectId is provided', async () => {
    const app = createApp();
    const project = createProject('My Project', 'Some instructions');
    const res = await app.request(
      '/api/channels',
      jsonReq({ name: 'Linked Chat', projectId: project.id })
    );
    expect(res.status).toBe(201);
    const channel = await res.json();
    expect(channel.projectId).toBe(project.id);

    // Verify in DB
    const dbChannel = getChannel(channel.id);
    expect(dbChannel?.projectId).toBe(project.id);
  });

  it('creates channel without project when projectId is omitted', async () => {
    const app = createApp();
    const res = await app.request(
      '/api/channels',
      jsonReq({ name: 'No Project Chat' })
    );
    expect(res.status).toBe(201);
    const channel = await res.json();
    expect(channel.projectId).toBeUndefined();
  });
});

// ── 2. Sidebar grouping for klatches ──────────────────────────────

describe('Sidebar grouping: klatches under projects', () => {
  it('klatch with projectId appears in enriched list with project name', () => {
    const project = createProject('Klatch Project', 'instructions');
    const ch = createChannel('Team Discussion', 'prompt', undefined, undefined, 'klatch');
    setChannelProject(ch.id, project.id);

    const enriched = getAllChannelsEnriched();
    const klatchChannel = enriched.find((c) => c.id === ch.id);
    expect(klatchChannel).toBeDefined();
    expect(klatchChannel!.type).toBe('klatch');
    expect(klatchChannel!.projectId).toBe(project.id);
    expect(klatchChannel!.projectName).toBe('Klatch Project');
  });

  it('project with both chats and klatches returns both types', () => {
    const project = createProject('Mixed Project', 'instructions');
    const chat = createChannel('Chat 1', 'prompt');
    setChannelProject(chat.id, project.id);
    const klatch = createChannel('Klatch 1', 'prompt', undefined, undefined, 'klatch');
    setChannelProject(klatch.id, project.id);

    const enriched = getAllChannelsEnriched();
    const projectChannels = enriched.filter((c) => c.projectId === project.id);
    expect(projectChannels).toHaveLength(2);

    const types = projectChannels.map((c) => c.type);
    expect(types).toContain('chat');
    expect(types).toContain('klatch');
  });

  it('unassigned channels have no projectId', () => {
    const unassigned = createChannel('Orphan Chat', 'prompt');
    const enriched = getAllChannelsEnriched();
    const found = enriched.find((c) => c.id === unassigned.id);
    expect(found).toBeDefined();
    expect(found!.projectId).toBeUndefined();
  });

  it('getAllChannelsEnriched returns type field for all channels', () => {
    const enriched = getAllChannelsEnriched();
    for (const ch of enriched) {
      expect(ch.type).toBeDefined();
      expect(['chat', 'klatch']).toContain(ch.type);
    }
  });
});

// ── 3. Entity assignment during creation ──────────────────────────

describe('Entity assignment for klatches', () => {
  it('default entity is auto-assigned to new channel', () => {
    const ch = createChannel('New Chat', 'prompt');
    const entities = getChannelEntities(ch.id);
    expect(entities.length).toBeGreaterThanOrEqual(1);
    expect(entities[0].id).toBe('default-entity');
  });

  it('can assign additional entities to a klatch', () => {
    const project = createProject('Entity Test', 'instructions');
    const klatch = createChannel('Multi Agent', 'prompt', undefined, undefined, 'klatch');
    setChannelProject(klatch.id, project.id);

    const entity1 = createEntity('Bot A', 'claude-sonnet-4-6', 'You are Bot A', '#ff0000');
    const entity2 = createEntity('Bot B', 'claude-haiku-4-5-20251001', 'You are Bot B', '#00ff00');

    assignEntityToChannel(klatch.id, entity1.id);
    assignEntityToChannel(klatch.id, entity2.id);

    const assigned = getChannelEntities(klatch.id);
    // default-entity + 2 new ones = 3
    expect(assigned.length).toBe(3);
    const ids = assigned.map((e) => e.id);
    expect(ids).toContain(entity1.id);
    expect(ids).toContain(entity2.id);
  });

  it('assigning the same entity twice is idempotent (INSERT OR IGNORE)', () => {
    const ch = createChannel('Dup Test', 'prompt');
    const entity = createEntity('Dup Bot', 'claude-sonnet-4-6', 'prompt', '#aaa');
    assignEntityToChannel(ch.id, entity.id);
    assignEntityToChannel(ch.id, entity.id); // duplicate — should not throw

    const assigned = getChannelEntities(ch.id);
    const count = assigned.filter((e) => e.id === entity.id).length;
    expect(count).toBe(1);
  });

  it('can assign up to 5 entities to a klatch', () => {
    const project = createProject('Big Klatch', 'instructions');
    const klatch = createChannel('Five Bots', 'prompt', undefined, undefined, 'klatch');
    setChannelProject(klatch.id, project.id);

    // default-entity is already assigned; add 4 more to reach 5 total
    for (let i = 0; i < 4; i++) {
      const ent = createEntity(`Bot ${i}`, 'claude-sonnet-4-6', `Bot ${i}`, `#${i}${i}${i}`);
      assignEntityToChannel(klatch.id, ent.id);
    }

    const assigned = getChannelEntities(klatch.id);
    expect(assigned.length).toBe(5);
  });
});

// ── 4. Model provenance (regression) ──────────────────────────────

describe('Model provenance', () => {
  // Test modelLabel logic directly (same logic as MessageList.tsx:19-22)
  function modelLabel(modelId?: ModelId): string | undefined {
    if (!modelId) return undefined;
    return AVAILABLE_MODELS[modelId]?.label;
  }

  it('resolves known model IDs to labels', () => {
    expect(modelLabel('claude-opus-4-6')).toBe('Opus');
    expect(modelLabel('claude-sonnet-4-6')).toBe('Sonnet');
    expect(modelLabel('claude-haiku-4-5-20251001')).toBe('Haiku');
  });

  it('returns undefined for unknown model IDs', () => {
    expect(modelLabel('some-unknown-model' as ModelId)).toBeUndefined();
  });

  it('returns undefined for missing model ID', () => {
    expect(modelLabel(undefined)).toBeUndefined();
  });

  it('messages store model field in the database', () => {
    const ch = createChannel('Model Test', 'prompt');
    const msg = insertMessage(ch.id, 'assistant', 'Hello', 'complete', 'claude-opus-4-6');
    expect(msg.model).toBe('claude-opus-4-6');
  });

  it('messages without model field return undefined', () => {
    const ch = createChannel('No Model', 'prompt');
    const msg = insertMessage(ch.id, 'assistant', 'Hello', 'complete');
    expect(msg.model).toBeUndefined();
  });

  it('model field is included in API response', async () => {
    const app = createApp();
    const ch = createChannel('API Model Test', 'prompt');
    insertMessage(ch.id, 'assistant', 'Response', 'complete', 'claude-sonnet-4-6');

    const res = await app.request(`/api/channels/${ch.id}/messages`);
    expect(res.status).toBe(200);
    const messages = await res.json();
    const assistant = messages.find((m: any) => m.role === 'assistant');
    expect(assistant).toBeDefined();
    expect(assistant.model).toBe('claude-sonnet-4-6');
  });

  it('messages with NULL model return gracefully from API', async () => {
    const app = createApp();
    const ch = createChannel('NULL Model', 'prompt');
    insertMessage(ch.id, 'assistant', 'Legacy', 'complete'); // no model

    const res = await app.request(`/api/channels/${ch.id}/messages`);
    expect(res.status).toBe(200);
    const messages = await res.json();
    const assistant = messages.find((m: any) => m.role === 'assistant');
    expect(assistant).toBeDefined();
    // model should be absent or undefined, not throw
    expect(assistant.model).toBeUndefined();
  });
});
