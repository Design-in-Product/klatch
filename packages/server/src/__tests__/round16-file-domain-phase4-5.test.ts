/**
 * Round 16: File Domain Model Phases 4+5 test coverage
 *
 * Phase 4: Dual-write completion — save_file tool creates both
 *   message_artifacts AND files/file_refs entries.
 * Phase 5: Promotion endpoint — POST /api/files/:id/promote creates
 *   refs at higher scopes (channel → project), idempotent.
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
  getChannelFiles,
  getMessageFiles,
  getFile,
  getFileRefs,
  createFileWithMessageRef,
  createFileArtifact,
  getMessageArtifacts,
} from '../db/queries.js';

// Mock streaming to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
}));

import { Hono } from 'hono';
import { fileRoutes } from '../routes/files.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', fileRoutes);
  return app;
}

// ── Phase 4: Dual-write — save_file tool creates both models ──

describe('Phase 4 — dual-write on save_file', () => {
  it('createFileWithMessageRef populates files + file_refs tables', () => {
    const msg = insertMessage('default', 'user', 'Save a file');
    const result = createFileWithMessageRef(
      'output.ts', 'text/typescript', 2048, 'sk-dual-write', msg.id, 'entity'
    );

    // File created
    const file = getFile(result.file.id);
    expect(file).toBeDefined();
    expect(file!.name).toBe('output.ts');
    expect(file!.createdBy).toBe('entity');

    // Ref created at message scope
    const refs = getFileRefs(result.file.id);
    expect(refs).toHaveLength(1);
    expect(refs[0].scope).toBe('message');
    expect(refs[0].scopeId).toBe(msg.id);
  });

  it('dual-write: both message_artifacts and files exist after tool use', () => {
    const msg = insertMessage('default', 'assistant', 'Here is your file');

    // Simulate what the save_file tool handler does: create both
    createFileArtifact(msg.id, 'generated.py', 'text/x-python', 512, 'sk-tool-gen');
    createFileWithMessageRef('generated.py', 'text/x-python', 512, 'sk-tool-gen', msg.id, 'entity');

    // message_artifacts has the file
    const artifacts = getMessageArtifacts(msg.id);
    const fileArtifact = artifacts.find((a) => a.type === 'file' && a.fileName === 'generated.py');
    expect(fileArtifact).toBeDefined();

    // files + file_refs also have it
    const files = getMessageFiles(msg.id);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('generated.py');
    expect(files[0].storageKey).toBe('sk-tool-gen');
  });
});

// ── Phase 5: Promotion endpoint ──────────────────────────────

describe('Phase 5 — POST /api/files/:id/promote', () => {
  it('promotes a file to channel scope', async () => {
    const file = createFile('promote-me.md', 'text/markdown', 100, 'sk-promote-ch');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'channel', targetId: 'default' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.file.id).toBe(file.id);
    expect(body.ref.scope).toBe('channel');
    expect(body.alreadyExists).toBe(false);

    // Verify ref was created
    expect(getChannelFiles('default')).toHaveLength(1);
  });

  it('promotes a file to project scope', async () => {
    const proj = createProject('Promote Target', '');
    const file = createFile('promote-proj.md', 'text/markdown', 100, 'sk-promote-proj');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'project', targetId: proj.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ref.scope).toBe('project');
    expect(body.alreadyExists).toBe(false);

    expect(getProjectFiles(proj.id)).toHaveLength(1);
  });

  it('returns alreadyExists when file is already at target scope', async () => {
    const file = createFile('already-there.md', 'text/markdown', 100, 'sk-already');
    createFileRef(file.id, 'channel', 'default', 'pinned');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'channel', targetId: 'default' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyExists).toBe(true);

    // Should still only have one ref, not two
    expect(getChannelFiles('default')).toHaveLength(1);
  });

  it('returns 404 for unknown file', async () => {
    const app = createTestApp();
    const res = await app.request('/api/files/no-such-file/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'channel', targetId: 'default' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 without targetScope or targetId', async () => {
    const file = createFile('missing-params.md', 'text/markdown', 100, 'sk-missing');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'channel' }), // missing targetId
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid targetScope', async () => {
    const file = createFile('bad-scope.md', 'text/markdown', 100, 'sk-bad-scope');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'entity', targetId: 'ent-1' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown channel target', async () => {
    const file = createFile('bad-target.md', 'text/markdown', 100, 'sk-bad-target');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'channel', targetId: 'nonexistent-channel' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown project target', async () => {
    const file = createFile('bad-proj.md', 'text/markdown', 100, 'sk-bad-proj');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'project', targetId: 'nonexistent-project' }),
    });
    expect(res.status).toBe(404);
  });

  it('promotion preserves original refs (additive, not destructive)', async () => {
    const msg = insertMessage('default', 'user', 'Promote test');
    const result = createFileWithMessageRef('multi-scope.md', 'text/markdown', 100, 'sk-multi', msg.id);

    // File starts with message ref
    expect(getFileRefs(result.file.id)).toHaveLength(1);

    // Promote to channel
    const app = createTestApp();
    await app.request(`/api/files/${result.file.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: 'channel', targetId: 'default' }),
    });

    // Should now have 2 refs: message + channel
    const refs = getFileRefs(result.file.id);
    expect(refs).toHaveLength(2);
    const scopes = refs.map((r) => r.scope).sort();
    expect(scopes).toEqual(['channel', 'message']);
  });
});
