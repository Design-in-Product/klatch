/**
 * Round 18: Step 10 Phase 2 — export endpoint tests
 *
 * Tests for GET /api/channels/:id/export, which produces a context
 * package zip per the Phase 1 canonical format spec.
 *
 * Coverage:
 *   - Endpoint behavior (200/404/400)
 *   - Manifest preamble fields
 *   - Provenance chain (native + imported)
 *   - Project, conversation_context, entities, files sections
 *   - Zip contents (sidecars match manifest refs)
 *   - Conversation JSONL structure
 *   - Sparkline test (lengths from manifest alone)
 *   - Round-trip Tier 1 (export → re-import JSONL → export → compare)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import AdmZip from 'adm-zip';
import {
  createChannel,
  createProject,
  createEntity,
  insertMessage,
  assignEntityToChannel,
  setChannelProject,
  createFile,
  createFileRef,
  createFileArtifact,
} from '../db/queries.js';

// Mock streaming to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
}));

// Mock file storage to avoid real disk reads
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

/** Parse a zip response into AdmZip + manifest */
async function parseExportResponse(res: Response) {
  const arrayBuffer = await res.arrayBuffer();
  const zip = new AdmZip(Buffer.from(arrayBuffer));
  const manifestEntry = zip.getEntry('manifest.json');
  const manifest = JSON.parse(manifestEntry!.getData().toString('utf-8'));
  return { zip, manifest };
}

// ── Setup helper: a channel with all the trimmings ──────────

function setupFullChannel() {
  const proj = createProject('Export Test Project', 'Use TypeScript. Be thorough.', 'native', {}, 'User prefers dark mode.');
  const ch = createChannel('export-test-channel', 'Focus on architecture.');
  setChannelProject(ch.id, proj.id);

  const entity = createEntity('Daedalus', 'claude-opus-4-6', 'You are a systems architect.', '#6366f1', 'daedalus', 'high');
  assignEntityToChannel(ch.id, entity.id);

  const msg1 = insertMessage(ch.id, 'user', 'Tell me about the export format.');
  const msg2 = insertMessage(ch.id, 'assistant', 'The export format uses a manifest plus sidecars...');

  // Pin a file to the channel
  const chFile = createFile('design-notes.md', 'text/markdown', 256, 'sk-ch-export');
  createFileRef(chFile.id, 'channel', ch.id, 'pinned', 'user');

  // Add a file to the project KB
  const projFile = createFile('roadmap.md', 'text/markdown', 1024, 'sk-proj-export');
  createFileRef(projFile.id, 'project', proj.id, 'pinned', 'user');

  return { proj, ch, entity, msg1, msg2, chFile, projFile };
}

// ── Endpoint behavior ────────────────────────────────────────

describe('Export endpoint — basic behavior', () => {
  it('GET /api/channels/:id/export returns a zip', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/zip');
    expect(res.headers.get('content-disposition')).toContain('.zip');
  });

  it('returns 404 for unknown channel', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels/nonexistent/export');
    expect(res.status).toBe(404);
  });

  it('returns 400 for channel with no entities', async () => {
    // createChannel auto-assigns the default entity, so we must remove it
    const ch = createChannel('empty-entity-channel', '');
    const { getDb: getTestDb } = await import('../db/index.js');
    getTestDb().prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(ch.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    expect(res.status).toBe(400);
  });
});

// ── Manifest preamble ────────────────────────────────────────

describe('Export manifest — preamble', () => {
  it('has correct preamble fields', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.format_version).toBe('1.0.0');
    expect(manifest.source_type).toBe('klatch');
    expect(manifest.package_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(manifest.package_kind).toBe('klatch.context.v1');
    expect(manifest.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(manifest.extensions).toEqual({ klatch: {} });
  });
});

// ── Provenance ───────────────────────────────────────────────

describe('Export manifest — provenance', () => {
  it('native channel has one provenance entry with source klatch', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.provenance).toHaveLength(1);
    expect(manifest.provenance[0].source).toBe('klatch');
    expect(manifest.provenance[0].event_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(manifest.provenance[0].integrity).toBeNull();
  });

  it('klatch provenance entry has layer_fidelity object', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    const klatchEntry = manifest.provenance.find((e: any) => e.source === 'klatch');
    expect(klatchEntry.layer_fidelity).toBeDefined();
    expect(klatchEntry.layer_fidelity.L5).toBe('full');
  });

  it('imported channel has two provenance entries', async () => {
    // createChannel doesn't accept source/sourceMetadata, so insert directly
    const { getDb: getTestDb } = await import('../db/index.js');
    const { v4: uuid } = await import('uuid');
    const chId = uuid();
    getTestDb().prepare(
      `INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(chId, 'imported-ch', '', 'claude-opus-4-6', 'panel', 'chat', 'claude-code',
      JSON.stringify({ cwd: '/Users/xian/projects/test', originalSessionId: 'sess-abc-123' }));

    const entity = createEntity('ImportBot', 'claude-opus-4-6', 'Hi.', '#FF0000');
    assignEntityToChannel(chId, entity.id);
    insertMessage(chId, 'user', 'Hello from import');

    const ch = { id: chId };

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.provenance).toHaveLength(2);
    expect(manifest.provenance[0].source).toBe('claude-code');
    expect(manifest.provenance[0].path).toBe('/Users/xian/projects/test');
    expect(manifest.provenance[0].session_id).toBe('sess-abc-123');
    expect(manifest.provenance[1].source).toBe('klatch');
  });
});

// ── Project ──────────────────────────────────────────────────

describe('Export manifest — project', () => {
  it('channel with project includes project object', async () => {
    const { ch, proj, projFile } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.project).not.toBeNull();
    expect(manifest.project.id).toBe(proj.id);
    expect(manifest.project.name).toBe('Export Test Project');
    expect(manifest.project.instructions.ref).toBe('layer_2_instructions.md');
    expect(manifest.project.instructions.length_chars).toBe('Use TypeScript. Be thorough.'.length);
    expect(manifest.project.memory.ref).toBe('layer_3_memory.md');
    expect(manifest.project.memory.length_chars).toBe('User prefers dark mode.'.length);
    expect(manifest.project.memory.memory_format).toBe('flat');
    expect(manifest.project.knowledge_base_file_ids).toContain(projFile.id);
  });

  it('channel without project has null project', async () => {
    const ch = createChannel('no-proj-ch', '');
    const entity = createEntity('Solo', 'claude-opus-4-6', 'Hi.', '#00FF00');
    assignEntityToChannel(ch.id, entity.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.project).toBeNull();
  });
});

// ── Conversation context ─────────────────────────────────────

describe('Export manifest — conversation_context', () => {
  it('has correct channel fields', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.conversation_context.id).toBe(ch.id);
    expect(manifest.conversation_context.name).toBe('export-test-channel');
    expect(manifest.conversation_context.context.ref).toBe('layer_4_context.md');
    expect(manifest.conversation_context.context.length_chars).toBe('Focus on architecture.'.length);
    expect(manifest.conversation_context.compaction_state).toBeNull();
  });

  it('pinned_file_ids lists channel-pinned files', async () => {
    const { ch, chFile } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.conversation_context.pinned_file_ids).toContain(chFile.id);
  });

  it('last_active_at reflects last message timestamp', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.conversation_context.last_active_at).toBeDefined();
    // last_active_at should be after or equal to created_at
    expect(new Date(manifest.conversation_context.last_active_at).getTime())
      .toBeGreaterThanOrEqual(new Date(manifest.conversation_context.created_at).getTime());
  });
});

// ── Entities ─────────────────────────────────────────────────

describe('Export manifest — entities', () => {
  it('includes all channel entities with correct fields', async () => {
    const { ch, entity } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    // Channel has default entity + our custom one
    expect(manifest.entities.length).toBeGreaterThanOrEqual(1);
    const exported = manifest.entities.find((e: any) => e.id === entity.id);
    expect(exported).toBeDefined();
    expect(exported.name).toBe('Daedalus');
    expect(exported.model).toBe('claude-opus-4-6');
    expect(exported.effort).toBe('high');
    expect(exported.prompt).toBe('You are a systems architect.');
    expect(exported.prompt_length_chars).toBe('You are a systems architect.'.length);
    expect(exported.field_notes).toBeNull();
  });
});

// ── Files ────────────────────────────────────────────────────

describe('Export manifest — files', () => {
  it('includes project and channel files with required fields', async () => {
    const { ch, chFile, projFile } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.files.length).toBeGreaterThanOrEqual(2);

    const exportedProjFile = manifest.files.find((f: any) => f.id === projFile.id);
    expect(exportedProjFile).toBeDefined();
    expect(exportedProjFile.name).toBe('roadmap.md');
    expect(exportedProjFile.scope).toBe('project');
    expect(exportedProjFile.trust).toBe('unattributed');
    expect(exportedProjFile.ref).toContain('files/');

    const exportedChFile = manifest.files.find((f: any) => f.id === chFile.id);
    expect(exportedChFile).toBeDefined();
    expect(exportedChFile.scope).toBe('channel');
  });

  it('deduplicates files at multiple scopes', async () => {
    const ch = createChannel('dedup-ch', '');
    const entity = createEntity('DedupBot', 'claude-opus-4-6', 'Hi.', '#AABB00');
    assignEntityToChannel(ch.id, entity.id);

    const proj = createProject('Dedup Proj', '');
    setChannelProject(ch.id, proj.id);

    // Same file at both project and channel scope
    const file = createFile('shared.md', 'text/markdown', 100, 'sk-dedup');
    createFileRef(file.id, 'project', proj.id);
    createFileRef(file.id, 'channel', ch.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    const matching = manifest.files.filter((f: any) => f.id === file.id);
    expect(matching).toHaveLength(1);
  });
});

// ── Conversation history ─────────────────────────────────────

describe('Export manifest — conversation history', () => {
  it('has correct message count and timestamps', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    expect(manifest.conversation_history.ref).toBe('conversation.jsonl');
    expect(manifest.conversation_history.message_count).toBe(2);
    expect(manifest.conversation_history.first_message_at).toBeDefined();
    expect(manifest.conversation_history.last_message_at).toBeDefined();
  });
});

// ── Zip contents ─────────────────────────────────────────────

describe('Export zip contents', () => {
  it('contains all expected sidecar files', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { zip } = await parseExportResponse(res);

    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('manifest.json');
    expect(entries).toContain('conversation.jsonl');
    expect(entries).toContain('layer_2_instructions.md');
    expect(entries).toContain('layer_3_memory.md');
    expect(entries).toContain('layer_4_context.md');
  });

  it('layer sidecars match project/channel content', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { zip } = await parseExportResponse(res);

    const l2 = zip.getEntry('layer_2_instructions.md')!.getData().toString('utf-8');
    expect(l2).toBe('Use TypeScript. Be thorough.');

    const l3 = zip.getEntry('layer_3_memory.md')!.getData().toString('utf-8');
    expect(l3).toBe('User prefers dark mode.');

    const l4 = zip.getEntry('layer_4_context.md')!.getData().toString('utf-8');
    expect(l4).toBe('Focus on architecture.');
  });

  it('conversation.jsonl has one valid JSON line per message', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { zip } = await parseExportResponse(res);

    const jsonl = zip.getEntry('conversation.jsonl')!.getData().toString('utf-8');
    const lines = jsonl.split('\n').filter((l) => l.trim());
    expect(lines).toHaveLength(2);

    const row1 = JSON.parse(lines[0]);
    expect(row1.role).toBe('user');
    expect(row1.content).toBe('Tell me about the export format.');
    expect(row1.id).toBeDefined();
    expect(row1.created_at).toBeDefined();

    const row2 = JSON.parse(lines[1]);
    expect(row2.role).toBe('assistant');
  });

  it('JSONL rows include artifacts when present', async () => {
    const ch = createChannel('artifact-ch', '');
    const entity = createEntity('ArtBot', 'claude-opus-4-6', 'Hi.', '#112233');
    assignEntityToChannel(ch.id, entity.id);

    const msg = insertMessage(ch.id, 'assistant', 'Here is a file.');
    createFileArtifact(msg.id, 'output.md', 'text/markdown', 128, 'sk-art-export');

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { zip } = await parseExportResponse(res);

    const jsonl = zip.getEntry('conversation.jsonl')!.getData().toString('utf-8');
    const row = JSON.parse(jsonl.split('\n')[0]);
    expect(row.artifacts).toBeDefined();
    expect(row.artifacts).toHaveLength(1);
    expect(row.artifacts[0].file_name).toBe('output.md');
  });

  it('files/ directory contains referenced file content', async () => {
    const { ch, chFile } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { zip, manifest } = await parseExportResponse(res);

    const fileEntry = manifest.files.find((f: any) => f.id === chFile.id);
    const zipEntry = zip.getEntry(fileEntry.ref);
    expect(zipEntry).toBeDefined();
    // readFile mock returns `Buffer.from('content of ${key}')`
    expect(zipEntry!.getData().toString('utf-8')).toContain('content of');
  });
});

// ── Sparkline test ───────────────────────────────────────────

describe('Export — sparkline test (design heuristic)', () => {
  it('all active layers have length_chars derivable from manifest alone', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest } = await parseExportResponse(res);

    // L2 — project instructions
    expect(typeof manifest.project.instructions.length_chars).toBe('number');

    // L3 — project memory
    expect(typeof manifest.project.memory.length_chars).toBe('number');

    // L4 — channel context
    expect(typeof manifest.conversation_context.context.length_chars).toBe('number');

    // L5 — entity prompt
    for (const entity of manifest.entities) {
      expect(typeof entity.prompt_length_chars).toBe('number');
      expect(entity.prompt_length_chars).toBe(entity.prompt.length);
    }

    // Files — length_chars present
    for (const file of manifest.files) {
      expect(typeof file.length_chars).toBe('number');
    }
  });
});

// ── Round-trip Tier 1 ────────────────────────────────────────

describe('Export — round-trip Tier 1', () => {
  it('two exports of same channel produce structurally equivalent manifests', async () => {
    const { ch } = setupFullChannel();
    const app = createTestApp();

    const res1 = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest: m1 } = await parseExportResponse(res1);

    const res2 = await app.request(`/api/channels/${ch.id}/export`);
    const { manifest: m2 } = await parseExportResponse(res2);

    // Package IDs differ (each export is a new package)
    expect(m1.package_id).not.toBe(m2.package_id);

    // But structural content matches
    expect(m1.format_version).toBe(m2.format_version);
    expect(m1.source_type).toBe(m2.source_type);
    expect(m1.package_kind).toBe(m2.package_kind);
    expect(m1.conversation_context.name).toBe(m2.conversation_context.name);
    expect(m1.conversation_history.message_count).toBe(m2.conversation_history.message_count);
    expect(m1.entities.length).toBe(m2.entities.length);
    expect(m1.entities[0].prompt).toBe(m2.entities[0].prompt);
    expect(m1.files.length).toBe(m2.files.length);

    // Project content matches
    expect(m1.project.instructions.length_chars).toBe(m2.project.instructions.length_chars);
    expect(m1.project.memory.length_chars).toBe(m2.project.memory.length_chars);
  });
});
