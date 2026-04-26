/**
 * Round 21: Phase 3.5 behavioral calibration pipeline tests
 *
 * Tests for all three Phase 3.5 sub-phases:
 *   3.5a: Self-authored handoff briefing (generateHandoffBriefing)
 *   3.5b: External behavioral extraction (extractBehavioralPatterns)
 *   3.5c: Micro-reflections (appendReflection, /reflect endpoint)
 *   Cross-cutting: field notes merging in export
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
  getEntity,
  appendReflection,
  getEntityReflections,
} from '../db/queries.js';
import { getDb } from '../db/index.js';

// Mock Anthropic client for briefing generation + reflections
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

// Mock streaming (imported by client.ts)
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
  readFile: vi.fn((key: string) => Buffer.from(`content of ${key}`)),
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

/** Helper: mock a successful briefing response */
function mockBriefingResponse(notes: Array<{ observation: string; category: string; confidence: string }>) {
  mockMessagesCreate.mockResolvedValue({
    content: [{
      type: 'text',
      text: JSON.stringify({
        notes: notes.map((n) => ({
          observation: n.observation,
          citations: ['example citation'],
          category: n.category,
          confidence: n.confidence,
        })),
      }),
    }],
  });
}

/** Helper: mock a successful extraction response */
function mockExtractionResponse(notes: Array<{ observation: string; category: string; confidence: string }>) {
  mockQueryAuxiliary.mockResolvedValue(JSON.stringify({
    notes: notes.map((n) => ({
      observation: n.observation,
      citations: ['observed pattern'],
      category: n.category,
      confidence: n.confidence,
    })),
  }));
}

function setupTestChannel() {
  const proj = createProject('Phase35 Project', 'Use TypeScript.', 'native', {}, 'User prefers dark mode.');
  const ch = createChannel('phase35-test', 'Focus on quality.');
  setChannelProject(ch.id, proj.id);

  const entity = createEntity('TestEntity', 'claude-opus-4-6', 'You are a helpful test assistant.', '#3B82F6', undefined, 'high');
  assignEntityToChannel(ch.id, entity.id);

  // Add enough messages for extraction (needs >=5)
  for (let i = 0; i < 6; i++) {
    insertMessage(ch.id, i % 2 === 0 ? 'user' : 'assistant', `Message ${i + 1} content here.`);
  }

  return { proj, ch, entity };
}

async function parseExportResponse(res: Response) {
  const arrayBuffer = await res.arrayBuffer();
  const zip = new AdmZip(Buffer.from(arrayBuffer));
  const manifestEntry = zip.getEntry('manifest.json');
  const manifest = JSON.parse(manifestEntry!.getData().toString('utf-8'));
  return { zip, manifest };
}

// ── Phase 3.5a: Self-authored handoff briefing ───────────────

describe('Phase 3.5a — handoff briefing', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
    mockQueryAuxiliary.mockReset();
  });

  it('generateHandoffBriefing returns FieldNote[] with correct structure', async () => {
    mockBriefingResponse([
      { observation: 'User prefers terse responses', category: 'working-style', confidence: 'high' },
      { observation: 'Asks clarifying questions before acting', category: 'patterns', confidence: 'medium' },
    ]);

    const { generateHandoffBriefing } = await import('../export/briefing.js');
    const entity = createEntity('BriefBot', 'claude-opus-4-6', 'You are helpful.', '#FF0000');
    const messages = [
      { id: 'msg-1', channelId: 'ch', role: 'user' as const, content: 'Hello', status: 'complete' as const, createdAt: new Date().toISOString() },
      { id: 'msg-2', channelId: 'ch', role: 'assistant' as const, content: 'Hi there!', status: 'complete' as const, createdAt: new Date().toISOString() },
    ];

    const notes = await generateHandoffBriefing(entity, 'system prompt', messages);

    expect(notes).toHaveLength(2);
    expect(notes[0].observation).toBe('User prefers terse responses');
    expect(notes[0].source).toBe('self-authored-briefing');
    expect(notes[0].trust).toBe('agent-observed');
    expect(notes[0].status).toBe('draft');
    expect(notes[0].category).toBe('working-style');
    expect(notes[0].citations).toBeInstanceOf(Array);
  });

  it('returns empty array for empty messages', async () => {
    const { generateHandoffBriefing } = await import('../export/briefing.js');
    const entity = createEntity('EmptyBot', 'claude-opus-4-6', 'Hi.', '#00FF00');

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"notes": []}' }],
    });

    const notes = await generateHandoffBriefing(entity, 'system prompt', []);
    expect(notes).toHaveLength(0);
  });

  it('falls back to single FieldNote on malformed JSON', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not JSON but it is a useful briefing about how to work with the user.' }],
    });

    const { generateHandoffBriefing } = await import('../export/briefing.js');
    const entity = createEntity('FallbackBot', 'claude-opus-4-6', 'Hi.', '#0000FF');
    const messages = [
      { id: 'msg-1', channelId: 'ch', role: 'user' as const, content: 'Hello', status: 'complete' as const, createdAt: new Date().toISOString() },
    ];

    const notes = await generateHandoffBriefing(entity, 'prompt', messages);
    expect(notes).toHaveLength(1);
    expect(notes[0].source).toBe('self-authored-briefing');
    expect(notes[0].category).toBe('other');
    expect(notes[0].observation).toContain('useful briefing');
  });

  it('export with ?briefing=true includes field_notes on entities', async () => {
    const { ch } = setupTestChannel();
    mockBriefingResponse([
      { observation: 'Test note', category: 'patterns', confidence: 'high' },
    ]);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export?briefing=true`);
    expect(res.status).toBe(200);

    const { manifest } = await parseExportResponse(res);
    const entityWithNotes = manifest.entities.find((e: any) => e.field_notes !== null);
    expect(entityWithNotes).toBeDefined();
    expect(entityWithNotes.field_notes).toBeInstanceOf(Array);
    expect(entityWithNotes.field_notes.length).toBeGreaterThan(0);
    expect(entityWithNotes.field_notes[0].source).toBe('self-authored-briefing');
  });

  it('export without ?briefing=true has null field_notes', async () => {
    const { ch } = setupTestChannel();

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    // All entities should have null field_notes (no reflections accumulated either)
    for (const entity of manifest.entities) {
      expect(entity.field_notes).toBeNull();
    }
  });
});

// ── Phase 3.5c: Micro-reflections ────────────────────────────

describe('Phase 3.5c — micro-reflections', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
  });

  it('entities table has reflections column', () => {
    const cols = getDb().pragma('table_info(entities)') as { name: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain('reflections');
  });

  it('appendReflection stores and getEntityReflections retrieves', () => {
    const entity = createEntity('ReflectBot', 'claude-opus-4-6', 'Hi.', '#AABB00');

    appendReflection(entity.id, {
      observation: 'User prefers bullet points.',
      createdAt: new Date().toISOString(),
      channelId: 'ch-test',
      type: 'session-end',
    });

    const reflections = getEntityReflections(entity.id);
    expect(reflections).toHaveLength(1);
    expect(reflections[0].observation).toBe('User prefers bullet points.');
  });

  it('multiple reflections accumulate', () => {
    const entity = createEntity('MultiReflect', 'claude-opus-4-6', 'Hi.', '#CC0000');

    appendReflection(entity.id, {
      observation: 'First reflection.',
      createdAt: new Date().toISOString(),
      channelId: 'ch-1',
      type: 'session-end',
    });
    appendReflection(entity.id, {
      observation: 'Second reflection.',
      createdAt: new Date().toISOString(),
      channelId: 'ch-2',
      type: 'correction',
    });

    const reflections = getEntityReflections(entity.id);
    expect(reflections).toHaveLength(2);
  });

  it('POST /channels/:id/reflect returns reflections', async () => {
    const { ch } = setupTestChannel();

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'User prefers concise responses and values honesty over confidence.' }],
    });

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/reflect`, { method: 'POST' });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.count).toBeGreaterThanOrEqual(1);
    expect(body.reflections).toBeInstanceOf(Array);
    expect(body.reflections[0].observation).toContain('concise');
  });

  it('POST /channels/:id/reflect returns 404 for unknown channel', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels/nonexistent/reflect', { method: 'POST' });
    expect(res.status).toBe(404);
  });

  it('POST /channels/:id/reflect returns 400 for channel with no messages', async () => {
    const ch = createChannel('empty-reflect-ch', '');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/reflect`, { method: 'POST' });
    expect(res.status).toBe(400);
  });

  it('reflections persist on entity after reflect call', async () => {
    const { ch, entity } = setupTestChannel();

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Learned that user values test coverage.' }],
    });

    const app = createTestApp();
    await app.request(`/api/channels/${ch.id}/reflect`, { method: 'POST' });

    const reflections = getEntityReflections(entity.id);
    expect(reflections.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /channels/:id/reflect stamps ingress="klatch-ui" on the persisted reflection', async () => {
    // Phase 5c-i consistency: every reflection writer should stamp ingress
    // so the field-notes pipeline can attribute provenance regardless of
    // which transport/wrapper layer originated the write. UI/HTTP path
    // stamps 'klatch-ui'; MCP path stamps 'mcp'.
    const { ch, entity } = setupTestChannel();

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'User prefers terse over verbose framing.' }],
    });

    const app = createTestApp();
    await app.request(`/api/channels/${ch.id}/reflect`, { method: 'POST' });

    const reflections = getEntityReflections(entity.id);
    expect(reflections.length).toBeGreaterThanOrEqual(1);
    const last = reflections[reflections.length - 1];
    expect(last.ingress).toBe('klatch-ui');
    expect(last.type).toBe('session-end');
  });
});

// ── Phase 3.5b: External extraction ──────────────────────────

describe('Phase 3.5b — external behavioral extraction', () => {
  beforeEach(() => {
    mockQueryAuxiliary.mockReset();
    mockMessagesCreate.mockReset();
  });

  it('extractBehavioralPatterns returns FieldNote[] with correct structure', async () => {
    mockExtractionResponse([
      { observation: 'Agent asks clarifying questions 8/10 times', category: 'patterns', confidence: 'high' },
    ]);

    const { extractBehavioralPatterns } = await import('../export/external-extraction.js');
    const messages = Array.from({ length: 6 }, (_, i) => ({
      id: `msg-${i}`, channelId: 'ch', role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`, status: 'complete' as const, createdAt: new Date().toISOString(),
    }));

    const notes = await extractBehavioralPatterns('TestEntity', messages);

    expect(notes).toHaveLength(1);
    expect(notes[0].source).toBe('external-extraction');
    expect(notes[0].trust).toBe('synthesized');
    expect(notes[0].status).toBe('draft');
  });

  it('returns empty array for <5 messages', async () => {
    const { extractBehavioralPatterns } = await import('../export/external-extraction.js');
    const messages = Array.from({ length: 3 }, (_, i) => ({
      id: `msg-${i}`, channelId: 'ch', role: 'user' as const,
      content: `Short`, status: 'complete' as const, createdAt: new Date().toISOString(),
    }));

    const notes = await extractBehavioralPatterns('TestEntity', messages);
    expect(notes).toHaveLength(0);
    expect(mockQueryAuxiliary).not.toHaveBeenCalled();
  });

  it('export with ?extract=true includes external extraction notes', async () => {
    const { ch } = setupTestChannel();
    mockExtractionResponse([
      { observation: 'Extracted pattern', category: 'working-style', confidence: 'high' },
    ]);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export?extract=true`);
    expect(res.status).toBe(200);

    const { manifest } = await parseExportResponse(res);
    const entityWithNotes = manifest.entities.find((e: any) => e.field_notes !== null);
    expect(entityWithNotes).toBeDefined();
    expect(entityWithNotes.field_notes.some((n: any) => n.source === 'external-extraction')).toBe(true);
  });
});

// ── Cross-cutting: field notes merging ───────────────────────

describe('Phase 3.5 — field notes merging in export', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
    mockQueryAuxiliary.mockReset();
  });

  it('export with both ?briefing=true&extract=true merges notes from both sources', async () => {
    const { ch } = setupTestChannel();

    mockBriefingResponse([
      { observation: 'Briefing note', category: 'working-style', confidence: 'high' },
    ]);
    mockExtractionResponse([
      { observation: 'Extraction note', category: 'patterns', confidence: 'medium' },
    ]);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export?briefing=true&extract=true`);
    expect(res.status).toBe(200);

    const { manifest } = await parseExportResponse(res);
    const entityWithNotes = manifest.entities.find((e: any) => e.field_notes !== null);
    expect(entityWithNotes).toBeDefined();

    const sources = entityWithNotes.field_notes.map((n: any) => n.source);
    expect(sources).toContain('self-authored-briefing');
    expect(sources).toContain('external-extraction');
  });

  it('accumulated reflections appear in export alongside briefing notes', async () => {
    const { ch, entity } = setupTestChannel();

    // Accumulate a reflection first
    appendReflection(entity.id, {
      observation: 'Micro-reflection from earlier session.',
      createdAt: new Date().toISOString(),
      channelId: ch.id,
      type: 'session-end',
    });

    mockBriefingResponse([
      { observation: 'Briefing note at export time', category: 'patterns', confidence: 'high' },
    ]);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export?briefing=true`);
    const { manifest } = await parseExportResponse(res);

    const entityNotes = manifest.entities.find((e: any) => e.id === entity.id);
    expect(entityNotes).toBeDefined();
    expect(entityNotes.field_notes).not.toBeNull();

    const sources = entityNotes.field_notes.map((n: any) => n.source);
    expect(sources).toContain('self-authored-briefing');
    expect(sources).toContain('micro-reflection');
  });

  it('each note source field correctly identifies its origin', async () => {
    const { ch, entity } = setupTestChannel();

    appendReflection(entity.id, {
      observation: 'Reflection note.',
      createdAt: new Date().toISOString(),
      channelId: ch.id,
      type: 'correction',
    });

    mockBriefingResponse([
      { observation: 'Briefing note.', category: 'avoid', confidence: 'high' },
    ]);
    mockExtractionResponse([
      { observation: 'Extraction note.', category: 'relationship', confidence: 'medium' },
    ]);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export?briefing=true&extract=true`);
    const { manifest } = await parseExportResponse(res);

    const entityNotes = manifest.entities.find((e: any) => e.id === entity.id);
    const allSources = entityNotes.field_notes.map((n: any) => n.source);

    expect(allSources).toContain('self-authored-briefing');
    expect(allSources).toContain('external-extraction');
    expect(allSources).toContain('micro-reflection');

    // Verify trust levels match source
    const briefingNote = entityNotes.field_notes.find((n: any) => n.source === 'self-authored-briefing');
    expect(briefingNote.trust).toBe('agent-observed');

    const extractionNote = entityNotes.field_notes.find((n: any) => n.source === 'external-extraction');
    expect(extractionNote.trust).toBe('synthesized');

    const reflectionNote = entityNotes.field_notes.find((n: any) => n.source === 'micro-reflection');
    expect(reflectionNote.trust).toBe('agent-observed');
  });
});
