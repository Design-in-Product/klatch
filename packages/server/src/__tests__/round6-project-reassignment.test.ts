/**
 * Round 6 integration tests: Post-import project reassignment
 *
 * Assignment from Daedalus (2026-03-15 21:10):
 * 1. PATCH /api/channels/:id with projectId
 * 2. Channel names don't include project prefix
 * 3. fetchProjects API (GET /api/projects)
 * 4. Project reassignment end-to-end
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  createProject,
  getAllChannelsEnriched,
  getAllProjects,
  getProjectForChannel,
} from '../db/queries.js';
import AdmZip from 'adm-zip';

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

function patchJson(body: unknown) {
  return {
    method: 'PATCH' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/** Build a test ZIP buffer */
function makeZip(files: Record<string, unknown>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(
      typeof content === 'string' ? content : JSON.stringify(content)
    ));
  }
  return zip.toBuffer();
}

function multipartReq(zipBuffer: Buffer, filename = 'export.zip', extraFields?: Record<string, string>) {
  const formData = new FormData();
  formData.append('file', new File([new Uint8Array(zipBuffer)], filename, { type: 'application/zip' }));
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }
  return { method: 'POST' as const, body: formData };
}

// Test data
const projectAlpha = {
  uuid: 'proj-alpha',
  name: 'Alpha',
  prompt_template: 'You are an alpha assistant.',
  docs: [],
};

const projectBeta = {
  uuid: 'proj-beta',
  name: 'Beta',
  prompt_template: 'You are a beta assistant.',
  docs: [],
};

const conv1 = {
  uuid: 'conv-r6-1',
  name: 'First Chat',
  created_at: '2026-03-15T10:00:00Z',
  project_uuid: 'proj-alpha',
  chat_messages: [
    { uuid: 'r6-m1', sender: 'human', text: 'Hello', created_at: '2026-03-15T10:00:01Z' },
    { uuid: 'r6-m2', sender: 'assistant', text: 'Hi!', created_at: '2026-03-15T10:00:02Z' },
  ],
};

const conv2 = {
  uuid: 'conv-r6-2',
  name: 'Second Chat',
  created_at: '2026-03-15T11:00:00Z',
  chat_messages: [
    { uuid: 'r6-m3', sender: 'human', text: 'Hey', created_at: '2026-03-15T11:00:01Z' },
    { uuid: 'r6-m4', sender: 'assistant', text: 'Hey there!', created_at: '2026-03-15T11:00:02Z' },
  ],
};

function makeTestZip() {
  return makeZip({
    'conversations.json': [conv1, conv2],
    'projects.json': [projectAlpha, projectBeta],
  });
}

// ── 1. PATCH /api/channels/:id with projectId ───────────────────

describe('PATCH /api/channels/:id — projectId', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('sets a project on a channel', async () => {
    const project = createProject('Test Project', 'Instructions');

    // Use the default #general channel
    const res = await app.request('/api/channels/default', patchJson({
      projectId: project.id,
    }));

    expect(res.status).toBe(200);

    // Verify via enriched query
    const enriched = getAllChannelsEnriched();
    const general = enriched.find((ch) => ch.id === 'default');
    expect(general!.projectId).toBe(project.id);
    expect(general!.projectName).toBe('Test Project');
  });

  it('changes project from one to another', async () => {
    const projA = createProject('Project A', 'A instructions');
    const projB = createProject('Project B', 'B instructions');

    // Set to A
    await app.request('/api/channels/default', patchJson({ projectId: projA.id }));
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === 'default')!.projectName).toBe('Project A');

    // Change to B
    await app.request('/api/channels/default', patchJson({ projectId: projB.id }));
    enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === 'default')!.projectName).toBe('Project B');
  });

  it('removes project by setting projectId to null', async () => {
    const project = createProject('Removable', 'Instructions');

    // Set project
    await app.request('/api/channels/default', patchJson({ projectId: project.id }));
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === 'default')!.projectName).toBe('Removable');

    // Remove project
    const res = await app.request('/api/channels/default', patchJson({ projectId: null }));
    expect(res.status).toBe(200);

    enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === 'default')!.projectId).toBeUndefined();
    expect(enriched.find((ch) => ch.id === 'default')!.projectName).toBeUndefined();
  });

  it('returns 404 for non-existent channel', async () => {
    const project = createProject('P', 'I');
    const res = await app.request('/api/channels/does-not-exist', patchJson({
      projectId: project.id,
    }));
    expect(res.status).toBe(404);
  });

  it('can set projectId alongside other fields in same PATCH', async () => {
    const project = createProject('Combo', 'Instructions');

    const res = await app.request('/api/channels/default', patchJson({
      name: 'renamed-general',
      projectId: project.id,
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('renamed-general');

    // Project should also be set
    const enriched = getAllChannelsEnriched();
    const ch = enriched.find((c) => c.id === 'default');
    expect(ch!.projectName).toBe('Combo');
    expect(ch!.name).toBe('renamed-general');
  });
});

// ── 2. Channel names don't include project prefix ────────────────

describe('Channel names — no project prefix', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('imported channel with project_uuid has name without project prefix', async () => {
    const zip = makeTestZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-r6-1']),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    // Channel name should be just the conversation name
    expect(body.imported[0].channelName).toBe('First Chat');
    expect(body.imported[0].channelName).not.toContain('Alpha');
  });

  it('imported channel with manual project assignment has name without prefix', async () => {
    const zip = makeTestZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-r6-2']),
      projectAssignments: JSON.stringify({ 'conv-r6-2': 'proj-beta' }),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.imported[0].channelName).toBe('Second Chat');
    expect(body.imported[0].channelName).not.toContain('Beta');
  });

  it('channel name stays unchanged after project reassignment via PATCH', async () => {
    const zip = makeTestZip();
    const importRes = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-r6-1']),
    }));

    const importBody = await importRes.json();
    const channelId = importBody.imported[0].channelId;

    // Get projects created during import
    const projects = getAllProjects();
    const beta = projects.find((p) => p.name === 'Beta');

    // Reassign to Beta
    const patchRes = await app.request(`/api/channels/${channelId}`, patchJson({
      projectId: beta!.id,
    }));
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();

    // Name should still be "First Chat", not "Beta: First Chat"
    expect(patchBody.name).toBe('First Chat');
  });
});

// ── 3. GET /api/projects ─────────────────────────────────────────

describe('GET /api/projects — fetchProjects', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('returns empty array when no projects exist', async () => {
    const res = await app.request('/api/projects');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('returns manually created projects', async () => {
    createProject('Manual Project', 'Some instructions');
    createProject('Another Project', 'More instructions');

    const res = await app.request('/api/projects');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe('Manual Project');
    expect(body[1].name).toBe('Another Project');
  });

  it('returns projects created during import', async () => {
    const zip = makeTestZip();
    await app.request('/api/import/claude-ai', multipartReq(zip));

    const res = await app.request('/api/projects');
    expect(res.status).toBe(200);
    const body = await res.json();
    const names = body.map((p: any) => p.name);
    expect(names).toContain('Alpha');
    expect(names).toContain('Beta');
  });
});

// ── 4. Project reassignment end-to-end ──────────────────────────

describe('Project reassignment end-to-end', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('import to Project A → PATCH to Project B → enriched query reflects B', async () => {
    const zip = makeTestZip();
    const importRes = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-r6-1']),
    }));
    expect(importRes.status).toBe(201);
    const importBody = await importRes.json();
    const channelId = importBody.imported[0].channelId;

    // Confirm initially linked to Alpha
    let enriched = getAllChannelsEnriched();
    let ch = enriched.find((c) => c.id === channelId);
    expect(ch!.projectName).toBe('Alpha');

    // Get Beta project ID
    const projects = getAllProjects();
    const beta = projects.find((p) => p.name === 'Beta');

    // Reassign to Beta via PATCH
    const patchRes = await app.request(`/api/channels/${channelId}`, patchJson({
      projectId: beta!.id,
    }));
    expect(patchRes.status).toBe(200);

    // Enriched query now shows Beta
    enriched = getAllChannelsEnriched();
    ch = enriched.find((c) => c.id === channelId);
    expect(ch!.projectName).toBe('Beta');
    expect(ch!.projectId).toBe(beta!.id);
  });

  it('import to Project A → remove project → enriched query shows undefined', async () => {
    const zip = makeTestZip();
    const importRes = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-r6-1']),
    }));
    const importBody = await importRes.json();
    const channelId = importBody.imported[0].channelId;

    // Remove project
    await app.request(`/api/channels/${channelId}`, patchJson({ projectId: null }));

    const enriched = getAllChannelsEnriched();
    const ch = enriched.find((c) => c.id === channelId);
    expect(ch!.projectId).toBeUndefined();
    expect(ch!.projectName).toBeUndefined();
    // Source preserved
    expect(ch!.source).toBe('claude-ai');
  });

  it('unassigned import → PATCH to assign project → enriched reflects assignment', async () => {
    const zip = makeTestZip();
    const importRes = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-r6-2']),
      // no projectAssignments — conv2 has no project_uuid either
    }));
    const importBody = await importRes.json();
    const channelId = importBody.imported[0].channelId;

    // Initially no project
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((c) => c.id === channelId)!.projectName).toBeUndefined();

    // Assign to Alpha via PATCH
    const projects = getAllProjects();
    const alpha = projects.find((p) => p.name === 'Alpha');
    await app.request(`/api/channels/${channelId}`, patchJson({ projectId: alpha!.id }));

    // Now shows Alpha
    enriched = getAllChannelsEnriched();
    const ch = enriched.find((c) => c.id === channelId);
    expect(ch!.projectName).toBe('Alpha');
  });
});
