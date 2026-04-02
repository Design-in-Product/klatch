import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import {
  createFile,
  getFile,
  getFileByStorageKey,
  createFileRef,
  deleteFileRef,
  getFilesAtScope,
  getProjectFiles,
  getChannelFiles,
  getEntityFiles,
  getMessageFiles,
  getFileRefs,
  createFileWithMessageRef,
  createChannel,
  createProject,
  insertMessage,
} from '../db/queries.js';
import { getDb } from '../db/index.js';

// Mock streaming to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
}));

// ── Schema tests ─────────────────────────────────────────────

describe('File Domain Model — schema', () => {
  it('files table has correct columns', () => {
    const cols = getDb().pragma('table_info(files)') as { name: string; type: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('mime_type');
    expect(colNames).toContain('size_bytes');
    expect(colNames).toContain('storage_key');
    expect(colNames).toContain('created_by');
    expect(colNames).toContain('created_at');
  });

  it('file_refs table has correct columns', () => {
    const cols = getDb().pragma('table_info(file_refs)') as { name: string; type: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('file_id');
    expect(colNames).toContain('scope');
    expect(colNames).toContain('scope_id');
    expect(colNames).toContain('ref_type');
    expect(colNames).toContain('added_at');
    expect(colNames).toContain('added_by');
  });

  it('file_refs has indexes on (scope, scope_id) and (file_id)', () => {
    const indexes = getDb().pragma('index_list(file_refs)') as { name: string }[];
    const indexNames = indexes.map((i) => i.name);
    expect(indexNames).toContain('idx_file_refs_scope');
    expect(indexNames).toContain('idx_file_refs_file');
  });
});

// ── Query function tests ─────────────────────────────────────

describe('File Domain Model — queries', () => {
  it('createFile + getFile round-trip', () => {
    const file = createFile('test.md', 'text/markdown', 256, 'key-001', 'user');
    expect(file.id).toBeDefined();
    expect(file.name).toBe('test.md');
    expect(file.mimeType).toBe('text/markdown');
    expect(file.sizeBytes).toBe(256);
    expect(file.storageKey).toBe('key-001');
    expect(file.createdBy).toBe('user');

    const fetched = getFile(file.id);
    expect(fetched).toBeDefined();
    expect(fetched!.name).toBe('test.md');
    expect(fetched!.storageKey).toBe('key-001');
  });

  it('getFile returns undefined for unknown ID', () => {
    expect(getFile('nonexistent')).toBeUndefined();
  });

  it('getFileByStorageKey looks up by storage key', () => {
    const file = createFile('lookup.txt', 'text/plain', 100, 'unique-key-42');
    const found = getFileByStorageKey('unique-key-42');
    expect(found).toBeDefined();
    expect(found!.id).toBe(file.id);
  });

  it('getFileByStorageKey returns undefined for unknown key', () => {
    expect(getFileByStorageKey('no-such-key')).toBeUndefined();
  });

  it('createFileRef + getFilesAtScope returns correct files', () => {
    const file = createFile('pinned.md', 'text/markdown', 512, 'key-pin-001');
    createFileRef(file.id, 'channel', 'ch-test', 'pinned', 'user');

    const files = getFilesAtScope('channel', 'ch-test');
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(file.id);
    expect(files[0].scope).toBe('channel');
    expect(files[0].scopeId).toBe('ch-test');
    expect(files[0].refType).toBe('pinned');
  });

  it('getFilesAtScope returns only files at the correct scope', () => {
    const file1 = createFile('ch-file.md', 'text/markdown', 100, 'sk-ch');
    const file2 = createFile('proj-file.md', 'text/markdown', 100, 'sk-proj');

    createFileRef(file1.id, 'channel', 'ch-A');
    createFileRef(file2.id, 'project', 'proj-A');

    const channelFiles = getFilesAtScope('channel', 'ch-A');
    expect(channelFiles).toHaveLength(1);
    expect(channelFiles[0].id).toBe(file1.id);

    const projectFiles = getFilesAtScope('project', 'proj-A');
    expect(projectFiles).toHaveLength(1);
    expect(projectFiles[0].id).toBe(file2.id);
  });

  it('getProjectFiles returns project-scoped files only', () => {
    const proj = createProject('Test Project', '');
    const file = createFile('spec.md', 'text/markdown', 200, 'sk-proj-spec');
    createFileRef(file.id, 'project', proj.id, 'pinned');

    // Also create a channel-scoped file that should NOT appear
    const otherFile = createFile('other.md', 'text/markdown', 100, 'sk-other');
    createFileRef(otherFile.id, 'channel', 'default');

    const files = getProjectFiles(proj.id);
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(file.id);
  });

  it('getChannelFiles returns channel-scoped files only', () => {
    const file = createFile('notes.md', 'text/markdown', 150, 'sk-ch-notes');
    createFileRef(file.id, 'channel', 'default', 'pinned');

    const files = getChannelFiles('default');
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(file.id);
    expect(files[0].scope).toBe('channel');
  });

  it('getEntityFiles returns entity-scoped files only', () => {
    const file = createFile('entity-doc.md', 'text/markdown', 300, 'sk-ent');
    createFileRef(file.id, 'entity', 'ent-001');

    const files = getEntityFiles('ent-001');
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(file.id);
  });

  it('getMessageFiles returns message-scoped files only', () => {
    const msg = insertMessage('default', 'user', 'Check this file');
    const file = createFile('upload.png', 'image/png', 5000, 'sk-msg-upload');
    createFileRef(file.id, 'message', msg.id);

    const files = getMessageFiles(msg.id);
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(file.id);
  });

  it('getFileRefs returns all refs for a file', () => {
    const file = createFile('shared.md', 'text/markdown', 100, 'sk-shared');
    createFileRef(file.id, 'channel', 'ch-1', 'pinned');
    createFileRef(file.id, 'project', 'proj-1', 'pinned');

    const refs = getFileRefs(file.id);
    expect(refs).toHaveLength(2);
    const scopes = refs.map((r) => r.scope).sort();
    expect(scopes).toEqual(['channel', 'project']);
  });

  it('deleteFileRef removes ref but file still exists', () => {
    const file = createFile('deletable.md', 'text/markdown', 100, 'sk-del');
    const ref = createFileRef(file.id, 'channel', 'ch-del');

    expect(getChannelFiles('ch-del')).toHaveLength(1);

    const deleted = deleteFileRef(ref.id);
    expect(deleted).toBe(true);
    expect(getChannelFiles('ch-del')).toHaveLength(0);

    // File itself still exists
    expect(getFile(file.id)).toBeDefined();
  });

  it('deleteFileRef returns false for unknown ref', () => {
    expect(deleteFileRef('no-such-ref')).toBe(false);
  });

  it('createFileWithMessageRef creates both file and ref in one transaction', () => {
    const msg = insertMessage('default', 'user', 'With attachment');
    const result = createFileWithMessageRef(
      'doc.pdf', 'application/pdf', 1024, 'sk-txn', msg.id, 'user'
    );

    expect(result.file.id).toBeDefined();
    expect(result.file.name).toBe('doc.pdf');
    expect(result.ref.scope).toBe('message');
    expect(result.ref.scopeId).toBe(msg.id);

    // Verify both exist in DB
    expect(getFile(result.file.id)).toBeDefined();
    expect(getMessageFiles(msg.id)).toHaveLength(1);
  });
});

// ── API endpoint tests ───────────────────────────────────────

import { Hono } from 'hono';
import { fileRoutes } from '../routes/files.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', fileRoutes);
  return app;
}

describe('File Domain Model — API endpoints', () => {
  it('GET /api/projects/:id/files returns project files', async () => {
    const proj = createProject('API Test Project', '');
    const file = createFile('api-test.md', 'text/markdown', 100, 'sk-api-proj');
    createFileRef(file.id, 'project', proj.id);

    const app = createTestApp();
    const res = await app.request(`/api/projects/${proj.id}/files`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('api-test.md');
  });

  it('GET /api/channels/:id/files returns channel files', async () => {
    const file = createFile('ch-api.md', 'text/markdown', 100, 'sk-api-ch');
    createFileRef(file.id, 'channel', 'default');

    const app = createTestApp();
    const res = await app.request('/api/channels/default/files');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('ch-api.md');
  });

  it('GET /api/entities/:id/files returns entity files', async () => {
    const file = createFile('ent-api.md', 'text/markdown', 100, 'sk-api-ent');
    createFileRef(file.id, 'entity', 'ent-api-test');

    const app = createTestApp();
    const res = await app.request('/api/entities/ent-api-test/files');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('ent-api.md');
  });

  it('GET /api/messages/:id/files returns message files', async () => {
    const msg = insertMessage('default', 'user', 'File message');
    const file = createFile('msg-api.md', 'text/markdown', 100, 'sk-api-msg');
    createFileRef(file.id, 'message', msg.id);

    const app = createTestApp();
    const res = await app.request(`/api/messages/${msg.id}/files`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('msg-api.md');
  });

  it('GET /api/files/:id/refs returns file with all refs', async () => {
    const file = createFile('multi-ref.md', 'text/markdown', 100, 'sk-api-refs');
    createFileRef(file.id, 'channel', 'default', 'pinned');
    createFileRef(file.id, 'project', 'proj-refs', 'pinned');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/refs`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.file.id).toBe(file.id);
    expect(body.refs).toHaveLength(2);
  });

  it('GET /api/files/:id/refs returns 404 for unknown file', async () => {
    const app = createTestApp();
    const res = await app.request('/api/files/nonexistent/refs');
    expect(res.status).toBe(404);
  });

  it('POST /api/files/pin pins a file to a channel', async () => {
    const file = createFile('pinnable.md', 'text/markdown', 100, 'sk-pin-test');

    const app = createTestApp();
    const res = await app.request('/api/files/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: 'default', fileId: file.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.file.id).toBe(file.id);
    expect(body.ref.scope).toBe('channel');
    expect(body.alreadyPinned).toBe(false);
  });

  it('POST /api/files/pin returns alreadyPinned when duplicate', async () => {
    const file = createFile('dup-pin.md', 'text/markdown', 100, 'sk-dup-pin');
    createFileRef(file.id, 'channel', 'default', 'pinned');

    const app = createTestApp();
    const res = await app.request('/api/files/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: 'default', fileId: file.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyPinned).toBe(true);
  });

  it('POST /api/files/pin resolves by storageKey', async () => {
    const file = createFile('by-key.md', 'text/markdown', 100, 'sk-by-key');

    const app = createTestApp();
    const res = await app.request('/api/files/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: 'default', storageKey: 'sk-by-key' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.file.id).toBe(file.id);
    expect(body.alreadyPinned).toBe(false);
  });

  it('POST /api/files/pin returns 400 without channelId', async () => {
    const app = createTestApp();
    const res = await app.request('/api/files/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: 'some-id' }),
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/files/:fileId/pin/:channelId unpins a file', async () => {
    const file = createFile('unpin-me.md', 'text/markdown', 100, 'sk-unpin');
    createFileRef(file.id, 'channel', 'default', 'pinned');

    const app = createTestApp();
    const res = await app.request(`/api/files/${file.id}/pin/default`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(getChannelFiles('default')).toHaveLength(0);
  });

  it('DELETE /api/files/:fileId/pin/:channelId returns 404 when not pinned', async () => {
    const app = createTestApp();
    const res = await app.request('/api/files/no-file/pin/default', {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});

// ── Backfill tests ───────────────────────────────────────────

describe('File Domain Model — backfill', () => {
  it('backfill creates files + file_refs from message_artifacts', () => {
    const db = getDb();
    const msg = insertMessage('default', 'user', 'Old upload');

    // Simulate a pre-existing message_artifact with file data
    db.prepare(`
      INSERT INTO message_artifacts (id, message_id, type, tool_name, file_name, file_mime_type, file_size_bytes, file_storage_key)
      VALUES (?, ?, 'file', NULL, ?, ?, ?, ?)
    `).run('art-backfill-1', msg.id, 'legacy.txt', 'text/plain', 42, 'sk-legacy-bf');

    // Run the backfill query manually (same logic as migration)
    const artifacts = db.prepare(
      `SELECT id, message_id, file_name, file_mime_type, file_size_bytes, file_storage_key, created_at
       FROM message_artifacts
       WHERE type = 'file' AND file_storage_key IS NOT NULL
       AND file_storage_key NOT IN (SELECT storage_key FROM files)`
    ).all() as any[];

    expect(artifacts).toHaveLength(1);

    const crypto = require('crypto');
    for (const a of artifacts) {
      const fileId = crypto.randomUUID();
      const refId = crypto.randomUUID();
      db.prepare(
        'INSERT OR IGNORE INTO files (id, name, mime_type, size_bytes, storage_key, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(fileId, a.file_name, a.file_mime_type, a.file_size_bytes, a.file_storage_key, 'user', a.created_at);
      db.prepare(
        'INSERT INTO file_refs (id, file_id, scope, scope_id, ref_type, added_at, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(refId, fileId, 'message', a.message_id, 'pinned', a.created_at, 'user');
    }

    // Verify the backfill created correct records
    const file = getFileByStorageKey('sk-legacy-bf');
    expect(file).toBeDefined();
    expect(file!.name).toBe('legacy.txt');
    expect(file!.mimeType).toBe('text/plain');
    expect(file!.sizeBytes).toBe(42);

    const refs = getMessageFiles(msg.id);
    expect(refs).toHaveLength(1);
    expect(refs[0].storageKey).toBe('sk-legacy-bf');
  });

  it('backfill is idempotent (running twice does not duplicate)', () => {
    const db = getDb();
    const msg = insertMessage('default', 'user', 'Idempotent test');

    db.prepare(`
      INSERT INTO message_artifacts (id, message_id, type, file_name, file_mime_type, file_size_bytes, file_storage_key)
      VALUES (?, ?, 'file', ?, ?, ?, ?)
    `).run('art-idem-1', msg.id, 'idem.txt', 'text/plain', 10, 'sk-idem');

    // Run backfill twice
    for (let i = 0; i < 2; i++) {
      const toBackfill = db.prepare(
        `SELECT id, message_id, file_name, file_mime_type, file_size_bytes, file_storage_key, created_at
         FROM message_artifacts
         WHERE type = 'file' AND file_storage_key IS NOT NULL
         AND file_storage_key NOT IN (SELECT storage_key FROM files)`
      ).all() as any[];

      const crypto = require('crypto');
      for (const a of toBackfill) {
        const fileId = crypto.randomUUID();
        const refId = crypto.randomUUID();
        db.prepare(
          'INSERT OR IGNORE INTO files (id, name, mime_type, size_bytes, storage_key, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(fileId, a.file_name, a.file_mime_type, a.file_size_bytes, a.file_storage_key, 'user', a.created_at);
        db.prepare(
          'INSERT INTO file_refs (id, file_id, scope, scope_id, ref_type, added_at, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(refId, fileId, 'message', a.message_id, 'pinned', a.created_at, 'user');
      }
    }

    // Should only have one file, not two
    const allFiles = db.prepare('SELECT * FROM files WHERE storage_key = ?').all('sk-idem');
    expect(allFiles).toHaveLength(1);
  });
});
