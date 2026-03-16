/**
 * Round 5 integration tests: Import project assignment
 *
 * Assignment from Daedalus (2026-03-15 18:45):
 * 1. Server projectAssignments parameter (JSON + multipart)
 * 2. Assignment override vs export project_uuid (export wins)
 * 3. Unassigned conversations (projectId: null)
 * 4. Project creation timing (projectIdMap resolves ZIP UUIDs)
 * 5. Enriched query reflects project assignment after import
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  getAllChannelsEnriched,
  getProjectForChannel,
  getAllProjects,
} from '../db/queries.js';
import AdmZip from 'adm-zip';

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

function jsonReq(body: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── Test data ───────────────────────────────────────────────────

const projectA = {
  uuid: 'proj-aaa',
  name: 'Project Alpha',
  prompt_template: 'You are a helpful coding assistant.',
  docs: [{ filename: 'README.md', content: 'Alpha project docs' }],
};

const projectB = {
  uuid: 'proj-bbb',
  name: 'Project Beta',
  prompt_template: 'You are a testing assistant.',
  docs: [],
};

// Conversation WITH project_uuid in export (auto-linked)
const convWithProject = {
  uuid: 'conv-with-proj',
  name: 'Auto-linked Chat',
  created_at: '2026-03-15T00:00:00Z',
  project_uuid: 'proj-aaa',
  chat_messages: [
    { uuid: 'msg-1', sender: 'human', text: 'Hello from project', created_at: '2026-03-15T00:00:01Z' },
    { uuid: 'msg-2', sender: 'assistant', text: 'Hi! I see you are in Project Alpha.', created_at: '2026-03-15T00:00:02Z' },
  ],
};

// Conversation WITHOUT project_uuid (needs manual assignment)
const convNoProject = {
  uuid: 'conv-no-proj',
  name: 'Unlinked Chat',
  created_at: '2026-03-15T01:00:00Z',
  chat_messages: [
    { uuid: 'msg-3', sender: 'human', text: 'Which project am I in?', created_at: '2026-03-15T01:00:01Z' },
    { uuid: 'msg-4', sender: 'assistant', text: 'No project context available.', created_at: '2026-03-15T01:00:02Z' },
  ],
};

// Second conversation without project_uuid
const convNoProject2 = {
  uuid: 'conv-no-proj-2',
  name: 'Another Unlinked',
  created_at: '2026-03-15T02:00:00Z',
  chat_messages: [
    { uuid: 'msg-5', sender: 'human', text: 'Hello again', created_at: '2026-03-15T02:00:01Z' },
    { uuid: 'msg-6', sender: 'assistant', text: 'Hi again!', created_at: '2026-03-15T02:00:02Z' },
  ],
};

function makeStandardZip() {
  return makeZip({
    'conversations.json': [convWithProject, convNoProject, convNoProject2],
    'projects.json': [projectA, projectB],
  });
}

// ── 1. Server projectAssignments parameter ─────────────────────

describe('POST /api/import/claude-ai — projectAssignments via JSON body', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('assigns conversation to project via projectAssignments (JSON path)', async () => {
    const zip = makeStandardZip();
    // Write ZIP to a temp approach — use multipart since JSON path requires zipPath on disk
    // Use multipart for this test
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-no-proj']),
      projectAssignments: JSON.stringify({ 'conv-no-proj': 'proj-bbb' }),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(1);

    // Verify the channel is linked to the project in DB
    const channelId = body.imported[0].channelId;
    const project = getProjectForChannel(channelId);
    expect(project).toBeDefined();
    expect(project!.name).toBe('Project Beta');
  });

  it('assigns multiple conversations to different projects', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-no-proj', 'conv-no-proj-2']),
      projectAssignments: JSON.stringify({
        'conv-no-proj': 'proj-aaa',
        'conv-no-proj-2': 'proj-bbb',
      }),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(2);

    const proj1 = getProjectForChannel(body.imported.find((i: any) => i.conversationId === 'conv-no-proj').channelId);
    const proj2 = getProjectForChannel(body.imported.find((i: any) => i.conversationId === 'conv-no-proj-2').channelId);
    expect(proj1!.name).toBe('Project Alpha');
    expect(proj2!.name).toBe('Project Beta');
  });

  it('ignores malformed projectAssignments JSON gracefully (multipart)', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-no-proj']),
      projectAssignments: 'not-valid-json{{{',
    }));

    // Should still succeed — malformed assignment is ignored
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(1);

    // Channel should have no project (assignment was ignored)
    const project = getProjectForChannel(body.imported[0].channelId);
    expect(project).toBeUndefined();
  });
});

// ── 2. Assignment override vs export project_uuid ────────────────

describe('projectAssignments — export project_uuid takes precedence', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('export project_uuid wins over manual projectAssignment', async () => {
    const zip = makeStandardZip();
    // convWithProject already has project_uuid: 'proj-aaa'
    // Try to override it with projectAssignments pointing to proj-bbb
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-with-proj']),
      projectAssignments: JSON.stringify({ 'conv-with-proj': 'proj-bbb' }),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(1);

    // Should be linked to Project Alpha (from export), NOT Project Beta (from assignment)
    const project = getProjectForChannel(body.imported[0].channelId);
    expect(project).toBeDefined();
    expect(project!.name).toBe('Project Alpha');
  });

  it('conversation with export project_uuid ignores absent projectAssignment', async () => {
    const zip = makeStandardZip();
    // convWithProject has project_uuid but no entry in projectAssignments
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-with-proj']),
      // no projectAssignments at all
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    const project = getProjectForChannel(body.imported[0].channelId);
    expect(project!.name).toBe('Project Alpha');
  });
});

// ── 3. Unassigned conversations ──────────────────────────────────

describe('Unassigned conversations — no project link', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('conversation with no project_uuid and no assignment gets projectId: null', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-no-proj']),
      // no projectAssignments
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(1);

    const project = getProjectForChannel(body.imported[0].channelId);
    expect(project).toBeUndefined(); // no project linked

    // Enriched query should show projectName: undefined
    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === body.imported[0].channelId);
    expect(found!.projectName).toBeUndefined();
    expect(found!.projectId).toBeUndefined();
  });

  it('empty projectAssignments object still leaves unassigned conversations unlinked', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-no-proj']),
      projectAssignments: JSON.stringify({}),
    }));

    expect(res.status).toBe(201);
    const project = getProjectForChannel((await res.clone().json()).imported[0].channelId);
    expect(project).toBeUndefined();
  });

  it('projectAssignment for non-existent project UUID has no effect', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-no-proj']),
      projectAssignments: JSON.stringify({ 'conv-no-proj': 'proj-does-not-exist' }),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    // Project UUID not in ZIP's projects.json, so projectIdMap has no entry
    const project = getProjectForChannel(body.imported[0].channelId);
    expect(project).toBeUndefined();
  });
});

// ── 4. Project creation timing (projectIdMap) ────────────────────

describe('projectIdMap — ZIP project UUID resolves to Klatch project', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('project from projects.json is created in DB before conversation import', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-with-proj']),
    }));

    expect(res.status).toBe(201);

    // Projects from ZIP should exist in DB
    const projects = getAllProjects();
    const alpha = projects.find((p) => p.name === 'Project Alpha');
    const beta = projects.find((p) => p.name === 'Project Beta');
    expect(alpha).toBeDefined();
    expect(beta).toBeDefined();

    // The imported channel should reference the Klatch project ID (not the ZIP UUID)
    const body = await res.clone().json();
    const project = getProjectForChannel(body.imported[0].channelId);
    expect(project!.id).toBe(alpha!.id);
    expect(project!.name).toBe('Project Alpha');
  });

  it('second import reuses existing project (findOrCreateProject dedup)', async () => {
    const zip = makeStandardZip();
    // First import
    await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-with-proj']),
    }));

    const projectsBefore = getAllProjects();
    const alphaCount = projectsBefore.filter((p) => p.name === 'Project Alpha').length;
    expect(alphaCount).toBe(1);

    // Second import of a different conversation, same project in ZIP
    const conv2 = {
      uuid: 'conv-second',
      name: 'Second Project Chat',
      created_at: '2026-03-15T03:00:00Z',
      project_uuid: 'proj-aaa',
      chat_messages: [
        { uuid: 'msg-7', sender: 'human', text: 'Hello again', created_at: '2026-03-15T03:00:01Z' },
        { uuid: 'msg-8', sender: 'assistant', text: 'Welcome back!', created_at: '2026-03-15T03:00:02Z' },
      ],
    };
    const zip2 = makeZip({
      'conversations.json': [conv2],
      'projects.json': [projectA],
    });
    const res2 = await app.request('/api/import/claude-ai', multipartReq(zip2));
    expect(res2.status).toBe(201);

    // Should still have only one Project Alpha (dedup via originalProjectUuid)
    const projectsAfter = getAllProjects();
    const alphaCountAfter = projectsAfter.filter((p) => p.name === 'Project Alpha').length;
    expect(alphaCountAfter).toBe(1);
  });

  it('projectAssignment referencing ZIP project UUID resolves correctly', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-no-proj']),
      projectAssignments: JSON.stringify({ 'conv-no-proj': 'proj-aaa' }),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();

    // Verify the assignment resolved through projectIdMap
    const project = getProjectForChannel(body.imported[0].channelId);
    expect(project).toBeDefined();
    expect(project!.name).toBe('Project Alpha');

    // Enriched query should reflect the assignment
    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === body.imported[0].channelId);
    expect(found!.projectName).toBe('Project Alpha');
  });
});

// ── 5. Enriched query reflects project assignment after import ────

describe('Enriched query — post-import project visibility', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('mixed import: assigned + unassigned channels appear correctly in enriched query', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-with-proj', 'conv-no-proj', 'conv-no-proj-2']),
      projectAssignments: JSON.stringify({ 'conv-no-proj-2': 'proj-bbb' }),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.totalImported).toBe(3);

    const enriched = getAllChannelsEnriched();

    // conv-with-proj → Project Alpha (from export project_uuid)
    const withProj = enriched.find((ch) => ch.id === body.imported.find((i: any) => i.conversationId === 'conv-with-proj').channelId);
    expect(withProj!.projectName).toBe('Project Alpha');

    // conv-no-proj → no project (no assignment, no project_uuid)
    const noProj = enriched.find((ch) => ch.id === body.imported.find((i: any) => i.conversationId === 'conv-no-proj').channelId);
    expect(noProj!.projectName).toBeUndefined();

    // conv-no-proj-2 → Project Beta (from projectAssignment)
    const assigned = enriched.find((ch) => ch.id === body.imported.find((i: any) => i.conversationId === 'conv-no-proj-2').channelId);
    expect(assigned!.projectName).toBe('Project Beta');
  });

  it('channel name does not include project prefix (sidebar provides grouping)', async () => {
    const zip = makeStandardZip();
    const res = await app.request('/api/import/claude-ai', multipartReq(zip, 'export.zip', {
      selectedConversationIds: JSON.stringify(['conv-with-proj']),
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    // Channel name should be just the conversation name, not prefixed with project
    expect(body.imported[0].channelName).toBe('Auto-linked Chat');
    expect(body.imported[0].channelName).not.toContain('Project Alpha');
  });
});
