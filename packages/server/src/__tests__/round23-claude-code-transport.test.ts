/**
 * Round 23: Phase 4 — Claude Code transport adapter + endpoint tests
 *
 * Tests for adaptToClaudeCode(), resolveTemplates(), and
 * GET /api/channels/:id/export/claude-code endpoint.
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
} from '../db/queries.js';
import { adaptToClaudeCode, resolveTemplates } from '../export/transport-claude-code.js';

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

async function parseZipResponse(res: Response) {
  const arrayBuffer = await res.arrayBuffer();
  return new AdmZip(Buffer.from(arrayBuffer));
}

function setupTestChannel() {
  const proj = createProject('CC Transport Project', 'Use TypeScript. Run Vitest.', 'native', {}, 'User prefers dark mode. Likes terse responses.');
  const ch = createChannel('cc-test-channel', 'Focus on architecture review.');
  setChannelProject(ch.id, proj.id);

  const entity = createEntity('Daedalus', 'claude-opus-4-6', 'You are a systems architect.', '#6366f1', 'daedalus', 'high');
  assignEntityToChannel(ch.id, entity.id);

  for (let i = 0; i < 6; i++) {
    insertMessage(ch.id, i % 2 === 0 ? 'user' : 'assistant', `Message ${i + 1} about architecture.`);
  }

  const projFile = createFile('roadmap.md', 'text/markdown', 1024, 'sk-cc-roadmap');
  createFileRef(projFile.id, 'project', proj.id, 'pinned', 'user');

  return { proj, ch, entity, projFile };
}

// ── Manifest for adapter tests ───────────────────────────────

function makeManifest(overrides: any = {}) {
  return {
    format_version: '1.0.0',
    source_type: 'klatch',
    package_id: 'pkg-test',
    package_kind: 'klatch.context.v1',
    created_at: '2026-04-15T00:00:00Z',
    provenance: [{ event_id: 'ev-1', source: 'klatch', at: '2026-04-15T00:00:00Z' }],
    project: {
      id: 'proj-1',
      name: 'Test Project',
      instructions: { ref: 'layer_2_instructions.md', length_chars: 500 },
      memory: { ref: 'layer_3_memory.md', length_chars: 200 },
      knowledge_base_file_ids: ['f1'],
    },
    conversation_context: {
      id: 'ch-1',
      name: 'Architecture Review',
      context: { ref: 'layer_4_context.md', length_chars: 100 },
    },
    entities: [{
      id: 'ent-1',
      name: 'Daedalus',
      field_notes: null,
    }],
    conversation_history: { message_count: 42 },
    files: [{ id: 'f1', name: 'roadmap.md', ref: 'files/f1_roadmap.md' }],
    ...overrides,
  };
}

// ── adaptToClaudeCode() unit tests ───────────────────────────

describe('adaptToClaudeCode — adapter', () => {
  it('produces { claudeMd, memoryMd, files } object', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result).toHaveProperty('claudeMd');
    expect(result).toHaveProperty('memoryMd');
    expect(result).toHaveProperty('files');
    expect(typeof result.claudeMd).toBe('string');
    expect(typeof result.memoryMd).toBe('string');
    expect(result.files).toBeInstanceOf(Array);
  });

  it('claudeMd contains reverse kit briefing text', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.claudeMd).toContain('Klatch');
    expect(result.claudeMd).toContain('Claude Code');
    expect(result.claudeMd).toContain('full tool access');
  });

  it('claudeMd contains L2 instructions placeholder when project has instructions', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.claudeMd).toContain('{{LAYER_2_INSTRUCTIONS}}');
  });

  it('claudeMd contains L4 context placeholder when channel has context', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.claudeMd).toContain('{{LAYER_4_CONTEXT}}');
  });

  it('claudeMd omits L2 placeholder when project has no instructions', () => {
    const manifest = makeManifest({
      project: { id: 'p', name: 'Empty', instructions: { ref: 'x', length_chars: 0 }, memory: { ref: 'y', length_chars: 0 }, knowledge_base_file_ids: [] },
    });
    const result = adaptToClaudeCode(manifest);
    expect(result.claudeMd).not.toContain('{{LAYER_2_INSTRUCTIONS}}');
  });

  it('memoryMd contains L3 memory placeholder when project has memory', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.memoryMd).toContain('{{LAYER_3_MEMORY}}');
  });

  it('memoryMd includes field notes with trust labels when entities have notes', () => {
    const manifest = makeManifest({
      entities: [{
        id: 'ent-1',
        name: 'Daedalus',
        field_notes: [
          { observation: 'User prefers terse responses', source: 'self-authored-briefing', trust: 'agent-observed', status: 'draft', category: 'avoid' },
          { observation: 'Asks clarifying questions', source: 'external-extraction', trust: 'synthesized', status: 'approved', category: 'patterns' },
          { observation: 'Approved and reviewed', source: 'self-authored-briefing', trust: 'human-authored', status: 'approved', category: 'working-style' },
        ],
      }],
    });
    const result = adaptToClaudeCode(manifest);
    expect(result.memoryMd).toContain('User prefers terse responses');
    expect(result.memoryMd).toContain('self-observed');
    expect(result.memoryMd).toContain('extracted');
    expect(result.memoryMd).toContain('reviewed');
  });

  it('memoryMd includes KB file listing when project has KB files', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.memoryMd).toContain('roadmap.md');
    expect(result.memoryMd).toContain('Knowledge Base');
  });

  it('files array contains all manifest file refs', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('roadmap.md');
  });
});

// ── resolveTemplates() unit tests ────────────────────────────

describe('resolveTemplates — template resolution', () => {
  it('replaces L2 instructions placeholder with content', () => {
    const exportData = adaptToClaudeCode(makeManifest());
    const resolved = resolveTemplates(exportData, { layer2Instructions: 'Use TypeScript. Run Vitest.' });
    expect(resolved.claudeMd).toContain('Use TypeScript. Run Vitest.');
    expect(resolved.claudeMd).not.toContain('{{LAYER_2_INSTRUCTIONS}}');
  });

  it('replaces L3 memory placeholder with content', () => {
    const exportData = adaptToClaudeCode(makeManifest());
    const resolved = resolveTemplates(exportData, { layer3Memory: 'User prefers dark mode.' });
    expect(resolved.memoryMd).toContain('User prefers dark mode.');
    expect(resolved.memoryMd).not.toContain('{{LAYER_3_MEMORY}}');
  });

  it('replaces L4 context placeholder with content', () => {
    const exportData = adaptToClaudeCode(makeManifest());
    const resolved = resolveTemplates(exportData, { layer4Context: 'Focus on architecture.' });
    expect(resolved.claudeMd).toContain('Focus on architecture.');
    expect(resolved.claudeMd).not.toContain('{{LAYER_4_CONTEXT}}');
  });

  it('leaves unreplaced placeholders when sidecars are missing', () => {
    const exportData = adaptToClaudeCode(makeManifest());
    const resolved = resolveTemplates(exportData, {});
    expect(resolved.claudeMd).toContain('{{LAYER_2_INSTRUCTIONS}}');
    expect(resolved.claudeMd).toContain('{{LAYER_4_CONTEXT}}');
    expect(resolved.memoryMd).toContain('{{LAYER_3_MEMORY}}');
  });
});

// ── Reverse kit briefing content ─────────────────────────────

describe('Reverse kit briefing', () => {
  it('mentions channel name', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.claudeMd).toContain('Architecture Review');
  });

  it('mentions entity names', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.claudeMd).toContain('Daedalus');
  });

  it('mentions message count', () => {
    const result = adaptToClaudeCode(makeManifest());
    expect(result.claudeMd).toContain('42 messages');
  });

  it('references MEMORY.md when field notes are present', () => {
    const manifest = makeManifest({
      entities: [{ id: 'e1', name: 'Bot', field_notes: [{ observation: 'test', status: 'draft', trust: 'agent-observed' }] }],
    });
    const result = adaptToClaudeCode(manifest);
    expect(result.claudeMd).toContain('MEMORY.md');
  });
});

// ── Endpoint tests ───────────────────────────────────────────

describe('GET /api/channels/:id/export/claude-code', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
    mockQueryAuxiliary.mockReset();
  });

  it('returns application/zip', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/zip');
    expect(res.headers.get('content-disposition')).toContain('claude-code.zip');
  });

  it('returns 404 for unknown channel', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels/nonexistent/export/claude-code');
    expect(res.status).toBe(404);
  });

  it('returns 400 for channel with no entities', async () => {
    const ch = createChannel('no-ent-cc', '');
    const { getDb: getTestDb } = await import('../db/index.js');
    getTestDb().prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(ch.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code`);
    expect(res.status).toBe(400);
  });

  it('zip contains CLAUDE.md with reverse kit briefing', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code`);
    const zip = await parseZipResponse(res);

    const claudeMd = zip.getEntry('CLAUDE.md')!.getData().toString('utf-8');
    expect(claudeMd).toContain('Klatch');
    expect(claudeMd).toContain('full tool access');
  });

  it('CLAUDE.md includes project instructions when project exists', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code`);
    const zip = await parseZipResponse(res);

    const claudeMd = zip.getEntry('CLAUDE.md')!.getData().toString('utf-8');
    expect(claudeMd).toContain('Use TypeScript. Run Vitest.');
  });

  it('zip contains MEMORY.md with project memory', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code`);
    const zip = await parseZipResponse(res);

    const memoryMd = zip.getEntry('MEMORY.md')!.getData().toString('utf-8');
    expect(memoryMd).toContain('User prefers dark mode');
  });

  it('MEMORY.md has field notes when ?briefing=true', async () => {
    const { ch } = setupTestChannel();
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"notes": [{"observation": "Likes concise code reviews", "citations": [], "category": "working-style", "confidence": "high"}]}' }],
    });

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code?briefing=true`);
    const zip = await parseZipResponse(res);

    const memoryMd = zip.getEntry('MEMORY.md')!.getData().toString('utf-8');
    expect(memoryMd).toContain('Likes concise code reviews');
    expect(memoryMd).toContain('Behavioral Notes');
  });

  it('without flags, MEMORY.md has no field notes section', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code`);
    const zip = await parseZipResponse(res);

    const memoryMd = zip.getEntry('MEMORY.md')!.getData().toString('utf-8');
    expect(memoryMd).not.toContain('Behavioral Notes');
  });

  it('with ?briefing=true&extract=true, MEMORY.md has notes from both sources', async () => {
    const { ch } = setupTestChannel();
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"notes": [{"observation": "Briefing note", "citations": [], "category": "patterns", "confidence": "high"}]}' }],
    });
    mockQueryAuxiliary.mockResolvedValue('{"notes": [{"observation": "Extraction note", "citations": [], "category": "avoid", "confidence": "medium"}]}');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code?briefing=true&extract=true`);
    const zip = await parseZipResponse(res);

    const memoryMd = zip.getEntry('MEMORY.md')!.getData().toString('utf-8');
    expect(memoryMd).toContain('Briefing note');
    expect(memoryMd).toContain('Extraction note');
  });

  it('zip contains files/ directory with attachments', async () => {
    const { ch } = setupTestChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export/claude-code`);
    const zip = await parseZipResponse(res);

    const fileEntries = zip.getEntries().filter((e) => e.entryName.startsWith('files/'));
    expect(fileEntries.length).toBeGreaterThanOrEqual(1);
    expect(fileEntries.some((e) => e.entryName.includes('roadmap.md'))).toBe(true);
  });
});
