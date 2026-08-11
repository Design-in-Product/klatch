/**
 * Round 15: File Domain Model Phases 2+3 test coverage
 *
 * Overlap note: Round 14 already covers Phase 1 schema, queries, and most
 * pin/unpin API endpoints. This round focuses on:
 *   - Phase 2: L4 context injection (channel files in prompt), prompt-debug
 *   - Phase 2: Pin with unknown storageKey → 404 (gap from Round 14)
 *   - Phase 3: Project upload/remove endpoints, L3 context injection, prompt-debug
 *
 * Tests already in Round 14 (NOT duplicated here):
 *   - POST /files/pin by fileId, by storageKey, duplicate/idempotent, 400 without channelId
 *   - DELETE /files/:fileId/pin/:channelId — unpin + 404
 *   - GET scope endpoints (projects, channels, entities, messages)
 *   - Schema, query functions, backfill
 */

import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import {
  createFile,
  createFileRef,
  createProject,
  createChannel,
  insertMessage,
  getProjectFiles,
  getMessageFiles,
} from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import type { Entity, Channel, Project } from '@klatch/shared';
import { DEFAULT_MODEL, DEFAULT_INTERACTION_MODE } from '@klatch/shared';

// Mock streaming to avoid real API calls
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

import { Hono } from 'hono';
import { fileRoutes } from '../routes/files.js';
import { channelRoutes } from '../routes/channels.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', fileRoutes);
  app.route('/api', channelRoutes);
  return app;
}

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'ent-test',
    name: 'TestBot',
    model: DEFAULT_MODEL,
    systemPrompt: 'You are a test entity.',
    color: '#3B82F6',
    effort: 'high',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'ch-test',
    name: 'Test',
    type: 'chat',
    systemPrompt: '',
    model: DEFAULT_MODEL,
    mode: DEFAULT_INTERACTION_MODE,
    createdAt: '2026-01-01T00:00:00.000Z',
    source: 'native',
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-test',
    name: 'Test Project',
    instructions: '',
    memory: '',
    source: 'native',
    sourceMetadata: '{}',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ── Phase 2: L4 context injection (channel files in prompt) ──

describe('Phase 2 — L4 channel file injection', () => {
  it('buildSystemPrompt includes channel files listing when present', () => {
    const entity = makeEntity();
    const channel = makeChannel();
    const channelFileNames = ['- spec.md (text/markdown, 1.2 KB)', '- design.png (image/png, 45 KB)'];

    const prompt = buildSystemPrompt(entity, undefined, channel, null, channelFileNames);
    expect(prompt).toContain('Channel files available:');
    expect(prompt).toContain('spec.md');
    expect(prompt).toContain('design.png');
  });

  it('buildSystemPrompt omits channel files section when list is empty', () => {
    const entity = makeEntity();
    const channel = makeChannel();

    const prompt = buildSystemPrompt(entity, undefined, channel, null, []);
    expect(prompt).not.toContain('Channel files available:');
  });

  it('buildSystemPrompt omits channel files section when undefined', () => {
    const entity = makeEntity();
    const channel = makeChannel();

    const prompt = buildSystemPrompt(entity, undefined, channel, null);
    expect(prompt).not.toContain('Channel files available:');
  });

  it('channel files appear alongside channel addendum in L4', () => {
    const entity = makeEntity();
    const channel = makeChannel();
    const channelFileNames = ['- notes.md (text/markdown, 500 B)'];

    const prompt = buildSystemPrompt(entity, 'Focus on architecture.', channel, null, channelFileNames);
    expect(prompt).toContain('Focus on architecture.');
    expect(prompt).toContain('Channel files available:');
    expect(prompt).toContain('notes.md');
  });
});

// ── Phase 2: Pin edge case not in Round 14 ───────────────────

describe('Phase 2 — pin edge cases', () => {
  it('POST /api/files/pin returns 404 for unknown storageKey', async () => {
    const app = createTestApp();
    const res = await app.request('/api/files/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: 'default', storageKey: 'nonexistent-key' }),
    });
    expect(res.status).toBe(404);
  });

  it('POST /api/files/pin returns 404 for unknown fileId', async () => {
    const app = createTestApp();
    const res = await app.request('/api/files/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: 'default', fileId: 'nonexistent-file' }),
    });
    expect(res.status).toBe(404);
  });
});

// ── Phase 3: L3 context injection (project files in prompt) ──

describe('Phase 3 — L3 project file injection', () => {
  it('buildSystemPrompt includes project knowledge base listing when present', () => {
    const entity = makeEntity();
    const channel = makeChannel({ projectId: 'proj-test' });
    const project = makeProject();
    const projectFileNames = ['- roadmap.md (text/markdown, 3.4 KB)', '- schema.sql (text/plain, 1.1 KB)'];

    const prompt = buildSystemPrompt(entity, undefined, channel, project, [], projectFileNames);
    expect(prompt).toContain('Project knowledge base files:');
    expect(prompt).toContain('roadmap.md');
    expect(prompt).toContain('schema.sql');
  });

  it('buildSystemPrompt omits project files section when list is empty', () => {
    const entity = makeEntity();
    const channel = makeChannel({ projectId: 'proj-test' });
    const project = makeProject();

    const prompt = buildSystemPrompt(entity, undefined, channel, project, [], []);
    expect(prompt).not.toContain('Project knowledge base files:');
  });

  it('buildSystemPrompt includes both project memory and project files in L3', () => {
    const entity = makeEntity();
    const channel = makeChannel({ projectId: 'proj-test' });
    const project = makeProject({ memory: 'User prefers TypeScript.' });
    const projectFileNames = ['- conventions.md (text/markdown, 2 KB)'];

    const prompt = buildSystemPrompt(entity, undefined, channel, project, [], projectFileNames);
    // L3 memory
    expect(prompt).toContain('User prefers TypeScript.');
    // L3 files
    expect(prompt).toContain('Project knowledge base files:');
    expect(prompt).toContain('conventions.md');
  });

  it('buildSystemPrompt with both channel and project files includes both', () => {
    const entity = makeEntity();
    const channel = makeChannel({ projectId: 'proj-test' });
    const project = makeProject();
    const channelFileNames = ['- ch-file.md (text/markdown, 1 KB)'];
    const projectFileNames = ['- proj-file.md (text/markdown, 2 KB)'];

    const prompt = buildSystemPrompt(entity, undefined, channel, project, channelFileNames, projectFileNames);
    expect(prompt).toContain('Channel files available:');
    expect(prompt).toContain('ch-file.md');
    expect(prompt).toContain('Project knowledge base files:');
    expect(prompt).toContain('proj-file.md');
  });
});

// ── Phase 3: Project upload/remove endpoints ─────────────────

describe('Phase 3 — project file endpoints', () => {
  it('DELETE /api/projects/:id/files/:fileId removes file from project', async () => {
    const proj = createProject('Delete Test', '');
    const file = createFile('removable.md', 'text/markdown', 100, 'sk-removable');
    createFileRef(file.id, 'project', proj.id, 'pinned');

    expect(getProjectFiles(proj.id)).toHaveLength(1);

    const app = createTestApp();
    const res = await app.request(`/api/projects/${proj.id}/files/${file.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(getProjectFiles(proj.id)).toHaveLength(0);
  });

  it('DELETE /api/projects/:id/files/:fileId returns 404 when file not in project', async () => {
    const proj = createProject('Empty Project', '');

    const app = createTestApp();
    const res = await app.request(`/api/projects/${proj.id}/files/no-such-file`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});

// ── Prompt-debug with file info ──────────────────────────────

describe('Prompt-debug — file info in layers', () => {
  it('layer 4 includes pinned file info', async () => {
    const file = createFile('pinned-doc.md', 'text/markdown', 200, 'sk-debug-pin');
    createFileRef(file.id, 'channel', 'default', 'pinned');

    const app = createTestApp();
    const res = await app.request('/api/channels/default/prompt-debug');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.layers['4_channelAddendum']).toContain('pinned-doc.md');
    expect(body.layers['4_channelAddendum']).toContain('1 file(s) pinned');
  });

  it('layer 3 includes project file info when project has knowledge base', async () => {
    const proj = createProject('KB Project', '', 'native', {}, 'Some memory.');
    const ch = createChannel('kb-channel', '');
    // Link channel to project
    const { setChannelProject } = await import('../db/queries.js');
    setChannelProject(ch.id, proj.id);

    const file = createFile('kb-doc.md', 'text/markdown', 300, 'sk-debug-kb');
    createFileRef(file.id, 'project', proj.id, 'pinned');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.layers['3_projectMemory']).toContain('kb-doc.md');
    expect(body.layers['3_projectMemory']).toContain('1 knowledge base file(s)');
    expect(body.layers['3_projectMemory']).toContain('ACTIVE');
  });

  it('layer 3 shows EMPTY when project has no memory and no files', async () => {
    const proj = createProject('Empty KB Project', '');
    const ch = createChannel('empty-kb-channel', '');
    const { setChannelProject } = await import('../db/queries.js');
    setChannelProject(ch.id, proj.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.layers['3_projectMemory']).toContain('EMPTY');
  });

  it('layer 4 shows EMPTY when no addendum and no files pinned', async () => {
    // 'default' channel starts with system prompt "You are a helpful assistant."
    // Create a channel with no system prompt and no files
    const ch = createChannel('bare-channel', '');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/prompt-debug`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.layers['4_channelAddendum']).toBe('EMPTY');
  });
});
