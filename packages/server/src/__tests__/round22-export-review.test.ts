/**
 * Round 22: Phase 3.5d — export preview endpoint tests
 *
 * Tests for GET /api/channels/:id/export-preview, which returns the
 * manifest JSON without producing a zip. Used by the export review UI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import {
  createChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
  insertMessage,
  appendReflection,
} from '../db/queries.js';

// Mock Anthropic client for briefing generation
const mockMessagesCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockMessagesCreate };
  },
}));

// Mock auxiliary LLM for external extraction
vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'openai', model: 'gpt-4o-mini' })),
}));

// Mock streaming
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

// Mock file storage
vi.mock('../files/storage.js', () => ({
  readFile: vi.fn(() => Buffer.from('test')),
  saveFile: vi.fn(),
  validateFile: vi.fn(),
  getFilePath: vi.fn(),
  isTextFile: vi.fn(),
  isImageFile: vi.fn(),
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
}));

import { queryAuxiliary } from '../aaxt/auxiliary.js';
import { Hono } from 'hono';
import { exportRoutes } from '../routes/export.js';

const mockQueryAuxiliary = vi.mocked(queryAuxiliary);

function createTestApp() {
  const app = new Hono();
  app.route('/api', exportRoutes);
  return app;
}

function setupTestChannel() {
  const proj = createProject('Preview Project', 'Use TypeScript.', 'native', {}, 'Dark mode.');
  const ch = createChannel('preview-test', 'Focus on quality.');
  setChannelProject(ch.id, proj.id);

  const entity = createEntity('PreviewBot', 'claude-opus-4-6', 'You are helpful.', '#3B82F6', undefined, 'high');
  assignEntityToChannel(ch.id, entity.id);

  for (let i = 0; i < 6; i++) {
    insertMessage(ch.id, i % 2 === 0 ? 'user' : 'assistant', `Message ${i + 1}`);
  }

  return { proj, ch, entity };
}

// ── Export preview endpoint ──────────────────────────────────

describe('GET /api/channels/:id/export-preview', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
    mockQueryAuxiliary.mockReset();
  });

  it('returns manifest JSON (not a zip)', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.format_version).toBeDefined();
    expect(body.source_type).toBeDefined();
  });

  it('includes all preamble fields', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview`);
    const body = await res.json();

    expect(body.format_version).toBe('1.0.0');
    expect(body.source_type).toBe('klatch');
    expect(body.package_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.package_kind).toBe('klatch.context.v1');
    expect(body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.provenance).toBeInstanceOf(Array);
    expect(body.files).toBeInstanceOf(Array);
    expect(body.extensions).toEqual({ klatch: {} });
  });

  it('includes body fields', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview`);
    const body = await res.json();

    expect(body.project).not.toBeNull();
    expect(body.conversation_context).toBeDefined();
    expect(body.entities).toBeInstanceOf(Array);
    expect(body.conversation_history).toBeDefined();
  });

  it('conversation_context has cross-source contract fields (id, name)', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview`);
    const body = await res.json();

    expect(body.conversation_context.id).toBe(ch.id);
    expect(body.conversation_context.name).toBe('preview-test');
  });

  it('returns 404 for unknown channel', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels/nonexistent/export-preview');
    expect(res.status).toBe(404);
  });

  it('returns 400 for channel with no entities', async () => {
    const ch = createChannel('no-entity-preview', '');
    const { getDb: getTestDb } = await import('../db/index.js');
    getTestDb().prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(ch.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview`);
    expect(res.status).toBe(400);
  });

  it('?briefing=true produces non-null field_notes', async () => {
    const { ch } = setupTestChannel();
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"notes": [{"observation": "Test briefing note", "citations": [], "category": "patterns", "confidence": "high"}]}' }],
    });

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview?briefing=true`);
    const body = await res.json();

    const entityWithNotes = body.entities.find((e: any) => e.field_notes !== null);
    expect(entityWithNotes).toBeDefined();
    expect(entityWithNotes.field_notes[0].source).toBe('self-authored-briefing');
  });

  it('?extract=true produces field_notes with source=external-extraction', async () => {
    const { ch } = setupTestChannel();
    mockQueryAuxiliary.mockResolvedValue('{"notes": [{"observation": "Extracted pattern", "citations": [], "category": "working-style", "confidence": "high"}]}');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview?extract=true`);
    const body = await res.json();

    const entityWithNotes = body.entities.find((e: any) => e.field_notes !== null);
    expect(entityWithNotes).toBeDefined();
    expect(entityWithNotes.field_notes.some((n: any) => n.source === 'external-extraction')).toBe(true);
  });

  it('?briefing=true&extract=true merges notes from both sources', async () => {
    const { ch } = setupTestChannel();
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"notes": [{"observation": "Briefing note", "citations": [], "category": "patterns", "confidence": "high"}]}' }],
    });
    mockQueryAuxiliary.mockResolvedValue('{"notes": [{"observation": "Extraction note", "citations": [], "category": "avoid", "confidence": "medium"}]}');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview?briefing=true&extract=true`);
    const body = await res.json();

    const entityWithNotes = body.entities.find((e: any) => e.field_notes !== null);
    const sources = entityWithNotes.field_notes.map((n: any) => n.source);
    expect(sources).toContain('self-authored-briefing');
    expect(sources).toContain('external-extraction');
  });

  it('without flags, field_notes is null (no reflections)', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview`);
    const body = await res.json();

    for (const entity of body.entities) {
      expect(entity.field_notes).toBeNull();
    }
  });

  it('without flags, field_notes includes accumulated reflections if present', async () => {
    const { ch, entity } = setupTestChannel();

    appendReflection(entity.id, {
      observation: 'Accumulated reflection from earlier.',
      createdAt: new Date().toISOString(),
      channelId: ch.id,
      type: 'session-end',
    });

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export-preview`);
    const body = await res.json();

    const entityData = body.entities.find((e: any) => e.id === entity.id);
    expect(entityData.field_notes).not.toBeNull();
    expect(entityData.field_notes.some((n: any) => n.source === 'micro-reflection')).toBe(true);
  });
});
