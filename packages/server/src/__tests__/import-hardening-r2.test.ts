/**
 * Round 2 integration tests: Import hardening + end-to-end HTTP tests
 *
 * Assignment from Daedalus (2026-03-14 17:15):
 * 1. Import route error handling (malformed ZIP, bad JSON)
 * 2. Preview route error handling (truncated, empty, missing files)
 * 3. End-to-end HTTP import via multipart (ZIP → channels + projects in DB)
 * 4. Preview → Import roundtrip with selectedConversationIds
 * 5. Channel unlinking on project delete + prompt fallback
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import { buildKitBriefing, buildSystemPrompt } from '../claude/client.js';
import {
  createProject,
  createChannel,
  setChannelProject,
  getProjectForChannel,
  deleteProject,
  getAllProjects,
  getChannel,
} from '../db/queries.js';
import AdmZip from 'adm-zip';
import type { Channel, Entity } from '@klatch/shared';

// Mock streaming — not needed for import tests
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

/** Build a test ZIP buffer with given JSON files */
function makeZip(files: Record<string, unknown>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(
      typeof content === 'string' ? content : JSON.stringify(content)
    ));
  }
  return zip.toBuffer();
}

/** Build a multipart FormData request with a ZIP buffer */
function multipartReq(zipBuffer: Buffer, filename = 'export.zip', extraFields?: Record<string, string>) {
  const formData = new FormData();
  formData.append('file', new File([zipBuffer], filename, { type: 'application/zip' }));
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }
  return {
    method: 'POST' as const,
    body: formData,
  };
}

// Minimal valid conversation for ZIPs
const validConversation = {
  uuid: 'conv-valid-1',
  name: 'Test Conversation',
  created_at: '2026-03-01T00:00:00Z',
  chat_messages: [
    {
      uuid: 'msg-1',
      sender: 'human',
      text: 'Hello',
      created_at: '2026-03-01T00:00:01Z',
    },
    {
      uuid: 'msg-2',
      sender: 'assistant',
      text: 'Hi there! How can I help?',
      created_at: '2026-03-01T00:00:02Z',
    },
  ],
};

const secondConversation = {
  uuid: 'conv-valid-2',
  name: 'Second Chat',
  created_at: '2026-03-02T00:00:00Z',
  chat_messages: [
    {
      uuid: 'msg-3',
      sender: 'human',
      text: 'What is TypeScript?',
      created_at: '2026-03-02T00:00:01Z',
    },
    {
      uuid: 'msg-4',
      sender: 'assistant',
      text: 'TypeScript is a typed superset of JavaScript.',
      created_at: '2026-03-02T00:00:02Z',
    },
  ],
};

// ── 1. Import route error handling ──────────────────────────────

describe('POST /api/import/claude-ai — error handling', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('returns JSON error for invalid ZIP data via multipart', async () => {
    const badZip = Buffer.from('this is not a zip file');
    const res = await app.request('/api/import/claude-ai', multipartReq(badZip));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(typeof body.error).toBe('string');
  });

  it('returns JSON error for ZIP with no conversations', async () => {
    const zip = makeZip({ 'projects.json': [] });
    const res = await app.request('/api/import/claude-ai', multipartReq(zip));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('no conversations');
  });

  it('returns JSON error for ZIP with only empty conversations', async () => {
    const zip = makeZip({
      'conversations.json': [
        { uuid: 'conv-empty', name: 'Empty', chat_messages: [] },
      ],
    });
    const res = await app.request('/api/import/claude-ai', multipartReq(zip));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('rejects non-ZIP file extension', async () => {
    const res = await app.request('/api/import/claude-ai', multipartReq(
      Buffer.from('not a zip'), 'export.txt'
    ));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('.zip');
  });

  it('returns 409 JSON for duplicate import', async () => {
    const zip = makeZip({ 'conversations.json': [validConversation] });

    // First import
    const res1 = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res1.status).toBe(201);

    // Second import — same conversation
    const res2 = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.error).toContain('already imported');
    expect(body.totalSkipped).toBeGreaterThan(0);
  });

  it('returns JSON error (not plain text) on internal failure', async () => {
    // ZIP with conversations that parse to zero turns (malformed messages)
    const zip = makeZip({
      'conversations.json': [
        {
          uuid: 'conv-bad',
          name: 'Bad Messages',
          chat_messages: [
            { uuid: 'msg-bad', sender: 'unknown_role', text: null },
          ],
        },
      ],
    });
    const res = await app.request('/api/import/claude-ai', multipartReq(zip));

    // Should be a JSON response regardless of error type
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('json');
  });
});

// ── 2. Preview route error handling ─────────────────────────────

describe('POST /api/import/claude-ai/preview — error handling', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('returns JSON error for invalid ZIP via multipart', async () => {
    const badZip = Buffer.from('corrupted data here');
    const res = await app.request('/api/import/claude-ai/preview', multipartReq(badZip));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(typeof body.error).toBe('string');
  });

  it('returns 200 with empty conversations for ZIP without conversations.json', async () => {
    const zip = makeZip({ 'projects.json': [{ uuid: 'p1', name: 'Orphan Project' }] });
    const res = await app.request('/api/import/claude-ai/preview', multipartReq(zip));

    // Preview should succeed — it just shows what's in the ZIP
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.conversations).toHaveLength(0);
  });

  it('returns projects and memories in preview', async () => {
    const zip = makeZip({
      'conversations.json': [validConversation],
      'projects.json': [
        { uuid: 'proj-1', name: 'Test Project', prompt_template: 'Be helpful.' },
      ],
      'memories.json': [
        { uuid: 'mem-1', content: 'User prefers TypeScript' },
      ],
    });
    const res = await app.request('/api/import/claude-ai/preview', multipartReq(zip));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.conversations).toHaveLength(1);
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].name).toBe('Test Project');
    expect(body.projects[0].hasPromptTemplate).toBe(true);
    expect(body.memories).toHaveLength(1);
  });

  it('preview detects already-imported conversations', async () => {
    // Import first
    const zip = makeZip({ 'conversations.json': [validConversation] });
    const importRes = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(importRes.status).toBe(201);

    // Preview same ZIP
    const previewRes = await app.request('/api/import/claude-ai/preview', multipartReq(zip));
    expect(previewRes.status).toBe(200);
    const body = await previewRes.json();
    expect(body.conversations[0].alreadyImported).toBe(true);
    expect(body.conversations[0].existingChannelId).toBeTruthy();
  });

  it('rejects non-ZIP file extension', async () => {
    const res = await app.request('/api/import/claude-ai/preview', multipartReq(
      Buffer.from('data'), 'export.tar.gz'
    ));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('.zip');
  });
});

// ── 3. End-to-end HTTP import via multipart ─────────────────────

describe('end-to-end HTTP import via multipart', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('imports conversations + creates projects from multipart ZIP', async () => {
    const zip = makeZip({
      'conversations.json': [
        { ...validConversation, project_uuid: 'proj-e2e' },
      ],
      'projects.json': [
        { uuid: 'proj-e2e', name: 'E2E Project', prompt_template: 'You are a testing assistant.' },
      ],
    });

    const res = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.totalImported).toBe(1);
    expect(body.imported[0].channelId).toBeTruthy();
    expect(body.imported[0].channelName).toContain('E2E Project');

    // Verify project was created in DB
    const projects = getAllProjects();
    const e2eProject = projects.find(p => p.name === 'E2E Project');
    expect(e2eProject).toBeDefined();
    expect(e2eProject!.instructions).toContain('You are a testing assistant.');
    expect(e2eProject!.source).toBe('claude-ai');

    // Verify channel is linked to project
    const linkedProject = getProjectForChannel(body.imported[0].channelId);
    expect(linkedProject).toBeDefined();
    expect(linkedProject!.name).toBe('E2E Project');
  });

  it('imports multiple conversations with project linking', async () => {
    const zip = makeZip({
      'conversations.json': [
        { ...validConversation, project_uuid: 'proj-multi' },
        { ...secondConversation, project_uuid: 'proj-multi' },
      ],
      'projects.json': [
        { uuid: 'proj-multi', name: 'Shared Project', prompt_template: 'Shared context.' },
      ],
    });

    const res = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.totalImported).toBe(2);

    // Both channels link to same project
    const proj1 = getProjectForChannel(body.imported[0].channelId);
    const proj2 = getProjectForChannel(body.imported[1].channelId);
    expect(proj1).toBeDefined();
    expect(proj2).toBeDefined();
    expect(proj1!.id).toBe(proj2!.id);
  });

  it('imports with project memories from memories.json', async () => {
    const zip = makeZip({
      'conversations.json': [
        { ...validConversation, project_uuid: 'proj-mem' },
      ],
      'projects.json': [
        { uuid: 'proj-mem', name: 'Memory Project', prompt_template: 'Base instructions.' },
      ],
      'memories.json': {
        conversations_memory: [
          { uuid: 'mem-1', content: 'User prefers dark mode.' },
        ],
        project_memories: {
          'proj-mem': 'Always use TypeScript strict mode.',
        },
      },
    });

    const res = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res.status).toBe(201);

    // Project should have both prompt_template and project memory
    const projects = getAllProjects();
    const memProject = projects.find(p => p.name === 'Memory Project');
    expect(memProject).toBeDefined();
    expect(memProject!.instructions).toContain('Base instructions.');
    expect(memProject!.instructions).toContain('Always use TypeScript strict mode.');
  });

  it('conversations without project_uuid are not linked', async () => {
    const zip = makeZip({
      'conversations.json': [validConversation], // no project_uuid
    });

    const res = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res.status).toBe(201);
    const body = await res.json();

    const linked = getProjectForChannel(body.imported[0].channelId);
    expect(linked).toBeUndefined();
  });
});

// ── 4. Preview → Import roundtrip ───────────────────────────────

describe('preview → import roundtrip with selection', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('preview returns UUIDs, import with selection imports only selected', async () => {
    const zip = makeZip({
      'conversations.json': [validConversation, secondConversation],
    });

    // Preview
    const previewRes = await app.request('/api/import/claude-ai/preview', multipartReq(zip));
    expect(previewRes.status).toBe(200);
    const preview = await previewRes.json();
    expect(preview.conversations).toHaveLength(2);

    const uuids = preview.conversations.map((c: any) => c.uuid);
    expect(uuids).toContain('conv-valid-1');
    expect(uuids).toContain('conv-valid-2');

    // Import only the first conversation
    const importRes = await app.request('/api/import/claude-ai', multipartReq(
      zip, 'export.zip', { selectedConversationIds: JSON.stringify(['conv-valid-1']) }
    ));
    expect(importRes.status).toBe(201);
    const importBody = await importRes.json();

    expect(importBody.totalImported).toBe(1);
    expect(importBody.imported[0].conversationId).toBe('conv-valid-1');
  });

  it('import all when no selection provided', async () => {
    const zip = makeZip({
      'conversations.json': [validConversation, secondConversation],
    });

    const res = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(2);
  });

  it('force-import re-imports already-imported conversation', async () => {
    const zip = makeZip({ 'conversations.json': [validConversation] });

    // First import
    const res1 = await app.request('/api/import/claude-ai', multipartReq(zip));
    expect(res1.status).toBe(201);

    // Force re-import
    const res2 = await app.request('/api/import/claude-ai', multipartReq(
      zip, 'export.zip', { forceImport: 'true' }
    ));
    expect(res2.status).toBe(201);
    const body = await res2.json();
    expect(body.totalImported).toBe(1);
    // Disambiguated name
    expect(body.imported[0].channelName).toContain('(2)');
  });
});

// ── 5. Channel unlinking on project delete + prompt fallback ────

describe('project delete → channel unlink + prompt fallback', () => {
  function makeEntity(overrides: Partial<Entity> = {}): Entity {
    return {
      id: 'ent-test',
      name: 'Claude',
      model: 'claude-opus-4-6',
      systemPrompt: 'You are helpful.',
      color: '#6366F1',
      createdAt: '2026-01-01T00:00:00Z',
      ...overrides,
    };
  }

  it('DELETE /api/projects/:id unlinks channels (project_id → null)', async () => {
    const project = createProject('Doomed Project', 'Project instructions.');
    const channel = createChannel('Linked Channel', 'Channel addendum.');
    setChannelProject(channel.id, project.id);

    // Verify link
    expect(getProjectForChannel(channel.id)).toBeDefined();

    // Delete via API
    const app = createApp();
    const res = await app.request(`/api/projects/${project.id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    // Channel still exists
    const ch = getChannel(channel.id);
    expect(ch).toBeDefined();

    // But project link is gone
    expect(getProjectForChannel(channel.id)).toBeUndefined();
  });

  it('buildSystemPrompt falls back correctly after project delete', () => {
    // Simulate a channel that was linked to a project (has sourceMetadata.claudeMd)
    // but project was deleted (no project object)
    const entity = makeEntity({ systemPrompt: 'Be concise.' });
    const channel: Channel = {
      id: 'ch-orphan',
      name: 'Orphaned Channel',
      systemPrompt: 'Channel addendum.',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-01-01T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({ claudeMd: 'CLAUDE.md content here.' }),
      // No projectId — project was deleted
    };

    const prompt = buildSystemPrompt(entity, 'Channel addendum.', channel, null);

    // Kit briefing should include claudeMd as fallback (no project link)
    expect(prompt).toContain('CLAUDE.md content here.');
    expect(prompt).toContain('Channel addendum.');
    expect(prompt).toContain('Be concise.');
  });

  it('buildKitBriefing falls back to claudeMd when projectId is removed', () => {
    const channel: Channel = {
      id: 'ch-unlinked',
      name: 'Unlinked',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-01-01T00:00:00Z',
      source: 'claude-ai',
      sourceMetadata: JSON.stringify({ claudeMd: 'Original project docs.' }),
      // projectId removed after unlinking
    };

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('Original project docs.');
    expect(briefing).toContain('CLAUDE.md');
  });

  it('multiple channels survive project deletion independently', () => {
    const project = createProject('Multi-channel Project', 'Shared instructions.');
    const ch1 = createChannel('Channel 1', 'Addendum 1');
    const ch2 = createChannel('Channel 2', 'Addendum 2');
    setChannelProject(ch1.id, project.id);
    setChannelProject(ch2.id, project.id);

    deleteProject(project.id);

    // Both channels still exist, both unlinked
    expect(getChannel(ch1.id)).toBeDefined();
    expect(getChannel(ch2.id)).toBeDefined();
    expect(getProjectForChannel(ch1.id)).toBeUndefined();
    expect(getProjectForChannel(ch2.id)).toBeUndefined();
  });
});

export {};
