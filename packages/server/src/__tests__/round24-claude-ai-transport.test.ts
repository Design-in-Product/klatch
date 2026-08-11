/**
 * Round 24: Phase 4 — claude.ai transport adapter + endpoint tests
 *
 * Tests for adaptToClaudeAi(), GET /api/channels/:id/export/claude-ai,
 * and the round-trip: Klatch → claude.ai format → import parser → back to Klatch.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import AdmZip from 'adm-zip';
import {
  createChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
  insertMessage,
  createFile,
  createFileRef,
  getMessages,
} from '../db/queries.js';
import type { Message } from '@klatch/shared';
import { adaptToClaudeAi } from '../export/transport-claude-ai.js';
import { extractFromZip } from '../import/claude-ai-zip.js';

// Mock streaming
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

// Mock Anthropic SDK (for routes that depend on it)
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: vi.fn() };
  },
}));

// Mock auxiliary LLM
vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'openai', model: 'gpt-4o-mini' })),
}));

// Mock file storage
vi.mock('../files/storage.js', () => ({
  readFile: vi.fn((key: string) => Buffer.from(`content of ${key}`)),
  saveFile: vi.fn(),
  validateFile: vi.fn(),
  getFilePath: vi.fn(),
  isTextFile: vi.fn(),
  isImageFile: vi.fn(),
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
}));

import { Hono } from 'hono';
import { exportRoutes } from '../routes/export.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', exportRoutes);
  return app;
}

// ── Test manifest builder ────────────────────────────────────

function makeManifest(overrides: any = {}) {
  return {
    format_version: '1.0.0',
    source_type: 'klatch',
    package_id: 'pkg-test',
    package_kind: 'klatch.context.v1',
    created_at: '2026-04-15T00:00:00Z',
    provenance: [{ event_id: 'ev-1', source: 'klatch', at: '2026-04-15T00:00:00Z' }],
    project: {
      id: 'proj-ca-test',
      name: 'CA Export Project',
      instructions: { ref: 'layer_2_instructions.md', length_chars: 100 },
      memory: { ref: 'layer_3_memory.md', length_chars: 50 },
      knowledge_base_file_ids: ['f1'],
    },
    conversation_context: {
      id: 'ch-ca-test',
      name: 'CA Export Channel',
    },
    entities: [{
      id: 'ent-1',
      name: 'TestEntity',
      field_notes: null,
    }],
    conversation_history: { message_count: 3 },
    files: [{ id: 'f1', name: 'readme.md', mime_type: 'text/markdown', ref: 'files/f1_readme.md' }],
    ...overrides,
  };
}

function makeMessages(): Message[] {
  return [
    { id: 'msg-1', channelId: 'ch-ca-test', role: 'user' as const, content: 'Hello', status: 'complete' as const, createdAt: '2026-04-15T00:00:00Z' },
    { id: 'msg-2', channelId: 'ch-ca-test', role: 'assistant' as const, content: 'Hi there!', status: 'complete' as const, createdAt: '2026-04-15T00:00:10Z' },
    { id: 'msg-3', channelId: 'ch-ca-test', role: 'user' as const, content: 'Thanks', status: 'complete' as const, createdAt: '2026-04-15T00:00:20Z' },
  ];
}

// ── adaptToClaudeAi() unit tests ─────────────────────────────

describe('adaptToClaudeAi — adapter', () => {
  it('returns conversationsJson, projectsJson, memoriesJson strings', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages());
    expect(result).toHaveProperty('conversationsJson');
    expect(result).toHaveProperty('projectsJson');
    expect(result).toHaveProperty('memoriesJson');
    expect(typeof result.conversationsJson).toBe('string');
    expect(typeof result.projectsJson).toBe('string');
    expect(typeof result.memoriesJson).toBe('string');
  });

  it('conversationsJson parses as array with exactly one conversation', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages());
    const conversations = JSON.parse(result.conversationsJson);
    expect(conversations).toBeInstanceOf(Array);
    expect(conversations).toHaveLength(1);
  });

  it('conversation has uuid, name, created_at, updated_at, chat_messages', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages());
    const [conv] = JSON.parse(result.conversationsJson);
    expect(conv.uuid).toBeDefined();
    expect(conv.name).toBe('CA Export Channel');
    expect(conv.created_at).toBeDefined();
    expect(conv.updated_at).toBeDefined();
    expect(conv.chat_messages).toBeInstanceOf(Array);
    expect(conv.chat_messages).toHaveLength(3);
  });

  it('each message has uuid, text, sender, created_at', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages());
    const [conv] = JSON.parse(result.conversationsJson);
    for (const msg of conv.chat_messages) {
      expect(msg.uuid).toBeDefined();
      expect(msg.text).toBeDefined();
      expect(['human', 'assistant']).toContain(msg.sender);
      expect(msg.created_at).toBeDefined();
    }
  });

  it('user role maps to human sender', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages());
    const [conv] = JSON.parse(result.conversationsJson);
    expect(conv.chat_messages[0].sender).toBe('human');
    expect(conv.chat_messages[1].sender).toBe('assistant');
    expect(conv.chat_messages[2].sender).toBe('human');
  });

  it('preserves originalId as uuid and originalTimestamp as created_at when present', () => {
    const messages = makeMessages();
    messages[0] = { ...messages[0], originalId: 'orig-uuid-1', originalTimestamp: '2025-12-01T00:00:00Z' };

    const result = adaptToClaudeAi(makeManifest(), messages);
    const [conv] = JSON.parse(result.conversationsJson);
    expect(conv.chat_messages[0].uuid).toBe('orig-uuid-1');
    expect(conv.chat_messages[0].created_at).toBe('2025-12-01T00:00:00Z');
  });

  it('projectsJson is empty array when no project', () => {
    const result = adaptToClaudeAi(makeManifest({ project: null }), makeMessages());
    const projects = JSON.parse(result.projectsJson);
    expect(projects).toEqual([]);
  });

  it('projectsJson contains project with uuid, name when present', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages());
    const projects = JSON.parse(result.projectsJson);
    expect(projects).toHaveLength(1);
    expect(projects[0].uuid).toBe('proj-ca-test');
    expect(projects[0].name).toBe('CA Export Project');
  });

  it('prompt_template is populated from layer2Content parameter', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages(), 'Use TypeScript. Run tests.');
    const projects = JSON.parse(result.projectsJson);
    expect(projects[0].prompt_template).toBe('Use TypeScript. Run tests.');
  });

  it('docs[] contains entries for KB files with text mime types', () => {
    const fileContents = new Map([['files/f1_readme.md', '# README content here']]);
    const result = adaptToClaudeAi(makeManifest(), makeMessages(), undefined, fileContents);
    const projects = JSON.parse(result.projectsJson);
    expect(projects[0].docs).toBeDefined();
    expect(projects[0].docs).toHaveLength(1);
    expect(projects[0].docs[0].filename).toBe('readme.md');
    expect(projects[0].docs[0].content).toBe('# README content here');
    expect(projects[0].docs[0].uuid).toBeDefined();
  });

  it('memoriesJson is empty array when no field notes', () => {
    const result = adaptToClaudeAi(makeManifest(), makeMessages());
    const memories = JSON.parse(result.memoriesJson);
    expect(memories).toEqual([]);
  });

  it('memoriesJson contains entries for non-rejected field notes', () => {
    const manifest = makeManifest({
      entities: [{
        id: 'ent-1',
        name: 'TestBot',
        field_notes: [
          { observation: 'User prefers concise responses', status: 'approved', trust: 'human-authored' },
          { observation: 'Asks clarifying questions', status: 'draft', trust: 'agent-observed' },
          { observation: 'This one is rejected', status: 'rejected', trust: 'synthesized' },
        ],
      }],
    });
    const result = adaptToClaudeAi(manifest, makeMessages());
    const memories = JSON.parse(result.memoriesJson);
    expect(memories).toHaveLength(2);
    expect(memories[0].content).toContain('TestBot');
    expect(memories[0].content).toContain('User prefers concise responses');
    expect(memories[0].uuid).toBeDefined();
    expect(memories[0].created_at).toBeDefined();
  });

  it('memory content prefixed with [EntityName] for attribution', () => {
    const manifest = makeManifest({
      entities: [{
        id: 'ent-1',
        name: 'Daedalus',
        field_notes: [{ observation: 'Plans carefully', status: 'draft', trust: 'agent-observed' }],
      }],
    });
    const result = adaptToClaudeAi(manifest, makeMessages());
    const memories = JSON.parse(result.memoriesJson);
    expect(memories[0].content).toBe('[Daedalus] Plans carefully');
  });
});

// ── Endpoint tests ───────────────────────────────────────────

describe('GET /api/channels/:id/export/claude-ai', () => {
  function setupChannel() {
    const proj = createProject('CA Test Project', 'Use TypeScript.', 'native', {}, 'Prefers dark mode.');
    const ch = createChannel('ca-test-channel', 'Test channel');
    setChannelProject(ch.id, proj.id);

    const entity = createEntity('CABot', 'claude-opus-4-6', 'Be helpful.', '#3B82F6', undefined, 'high');
    assignEntityToChannel(ch.id, entity.id);

    insertMessage(ch.id, 'user', 'Hello');
    insertMessage(ch.id, 'assistant', 'Hi there!');
    insertMessage(ch.id, 'user', 'Thanks');

    return { proj, ch, entity };
  }

  it('returns application/zip', async () => {
    const { ch } = setupChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/zip');
  });

  it('returns 404 for unknown channel', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels/nonexistent/export/claude-ai');
    expect(res.status).toBe(404);
  });

  it('returns 400 for channel with no entities', async () => {
    const ch = createChannel('no-ent-ca', '');
    const { getDb: getTestDb } = await import('../db/index.js');
    getTestDb().prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(ch.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    expect(res.status).toBe(400);
  });

  it('zip contains conversations.json, projects.json, memories.json', async () => {
    const { ch } = setupChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    const arrayBuffer = await res.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));

    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('conversations.json');
    expect(entries).toContain('projects.json');
    expect(entries).toContain('memories.json');
  });

  it('conversations.json parses to expected structure', async () => {
    const { ch } = setupChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    const arrayBuffer = await res.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));

    const content = zip.getEntry('conversations.json')!.getData().toString('utf-8');
    const parsed = JSON.parse(content);
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].chat_messages).toHaveLength(3);
  });

  it('projects.json is valid JSON', async () => {
    const { ch } = setupChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    const arrayBuffer = await res.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));

    const content = zip.getEntry('projects.json')!.getData().toString('utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('memories.json is valid JSON', async () => {
    const { ch } = setupChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    const arrayBuffer = await res.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));

    const content = zip.getEntry('memories.json')!.getData().toString('utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });
});

// ── ROUND-TRIP: Klatch → claude.ai format → import parser ────

describe('Round-trip: Klatch → claude.ai export → claude.ai import parser', () => {
  it('exported zip is accepted by the claude.ai import pipeline', async () => {
    // Setup: create a channel with known content
    const proj = createProject('Round Trip Project', 'Round-trip test instructions.', 'native', {}, 'Memory for round-trip.');
    const ch = createChannel('round-trip-channel', 'Channel for round-trip test');
    setChannelProject(ch.id, proj.id);

    const entity = createEntity('RoundTripBot', 'claude-opus-4-6', 'Test bot.', '#00AA00', undefined, 'high');
    assignEntityToChannel(ch.id, entity.id);

    insertMessage(ch.id, 'user', 'First message in round-trip');
    insertMessage(ch.id, 'assistant', 'Second message in round-trip');
    insertMessage(ch.id, 'user', 'Third message in round-trip');

    // Export via the claude-ai endpoint
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    expect(res.status).toBe(200);

    const arrayBuffer = await res.arrayBuffer();
    const zipBuffer = Buffer.from(arrayBuffer);

    // Feed the zip back into the import parser
    const extracted = extractFromZip(zipBuffer);

    // Verify the import side accepts our output
    expect(extracted.conversations).toHaveLength(1);
    const conv = extracted.conversations[0].conversation as any;
    expect(conv.name).toBe('round-trip-channel');
    expect(conv.chat_messages).toHaveLength(3);
    expect(conv.chat_messages[0].text).toBe('First message in round-trip');
    expect(conv.chat_messages[0].sender).toBe('human');
    expect(conv.chat_messages[1].sender).toBe('assistant');

    // Project should be extracted
    expect(extracted.projects.size).toBeGreaterThanOrEqual(1);
  });

  it('round-trip preserves project metadata', async () => {
    const proj = createProject('RT Project Meta', 'Specific instructions.', 'native', {}, 'Memory text.');
    const ch = createChannel('rt-meta-ch', '');
    setChannelProject(ch.id, proj.id);
    const entity = createEntity('MetaBot', 'claude-opus-4-6', 'Test.', '#FF00FF');
    assignEntityToChannel(ch.id, entity.id);
    insertMessage(ch.id, 'user', 'Trigger message');
    insertMessage(ch.id, 'assistant', 'Response');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    const arrayBuffer = await res.arrayBuffer();
    const zipBuffer = Buffer.from(arrayBuffer);

    const extracted = extractFromZip(zipBuffer);
    const projects = Array.from(extracted.projects.values());
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(projects[0].name).toBe('RT Project Meta');
  });

  it('round-trip preserves message count and order', async () => {
    const ch = createChannel('rt-msg-order', '');
    const entity = createEntity('OrderBot', 'claude-opus-4-6', 'Test.', '#0000FF');
    assignEntityToChannel(ch.id, entity.id);

    insertMessage(ch.id, 'user', 'Msg 1');
    insertMessage(ch.id, 'assistant', 'Msg 2');
    insertMessage(ch.id, 'user', 'Msg 3');
    insertMessage(ch.id, 'assistant', 'Msg 4');
    insertMessage(ch.id, 'user', 'Msg 5');

    const originalMessages = getMessages(ch.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-ai`);
    const arrayBuffer = await res.arrayBuffer();
    const extracted = extractFromZip(Buffer.from(arrayBuffer));

    const conv = extracted.conversations[0].conversation as any;
    expect(conv.chat_messages).toHaveLength(originalMessages.length);
    for (let i = 0; i < originalMessages.length; i++) {
      expect(conv.chat_messages[i].text).toBe(originalMessages[i].content);
    }
  });
});
