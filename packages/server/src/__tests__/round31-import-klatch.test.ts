/**
 * Round 31: /import/klatch — canonical Klatch package re-import.
 *
 * End-to-end shape: build a channel, export it via /export, re-import the
 * resulting zip via /import/klatch, then verify the destination state
 * matches the source (idempotent attach for same instance; fresh rows for
 * fork-via-forceImport).
 *
 * Also covers: Finding 3 (POST /api/projects accepts memory), invalid zip,
 * missing manifest, duplicate without forceImport, file round-trip,
 * source preservation across re-imports.
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
  getChannel,
  getProject,
  getEntity,
  getChannelEntities,
  getMessages,
} from '../db/queries.js';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic { messages = { create: vi.fn() } },
}));
vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'openai', model: 'gpt-4o-mini' })),
}));
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return { ...actual, streamClaude: vi.fn(), streamClaudeRoundtable: vi.fn() };
});

import { Hono } from 'hono';
import { exportRoutes } from '../routes/export.js';
import { importRoutes } from '../routes/import.js';
import { projectRoutes } from '../routes/projects.js';
import AdmZip from 'adm-zip';
import { importKlatchPackage, parseKlatchPackage } from '../import/klatch-import.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', exportRoutes);
  app.route('/api', importRoutes);
  app.route('/api/projects', projectRoutes);
  return app;
}

function setupSourceChannel() {
  const proj = createProject('Round-trip Project', 'Be terse.', 'native', {}, 'User likes lists.');
  const ch = createChannel('rt-source', 'Channel context here.');
  setChannelProject(ch.id, proj.id);

  const entity = createEntity('RT-Bot', 'claude-opus-4-6', 'You are RT-Bot.', '#EF4444', '@rtbot', 'high');
  assignEntityToChannel(ch.id, entity.id);

  appendReflection(entity.id, {
    observation: 'User prefers diff view over wall of text.',
    createdAt: new Date().toISOString(),
    channelId: ch.id,
    type: 'observation',
    ingress: 'klatch-ui',
  });

  for (let i = 0; i < 4; i++) {
    insertMessage(ch.id, i % 2 === 0 ? 'user' : 'assistant', `Round-trip message ${i + 1}`);
  }

  return { proj, ch, entity };
}

async function exportZip(app: ReturnType<typeof createTestApp>, channelId: string): Promise<Buffer> {
  const res = await app.request(`/api/channels/${channelId}/export`);
  expect(res.status).toBe(200);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

describe('Round 31: /import/klatch — canonical package re-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseKlatchPackage (pure parser)', () => {
    it('rejects non-zip bytes', () => {
      const result = parseKlatchPackage(Buffer.from('not a zip'));
      expect(result).toBeNull();
    });

    it('rejects zip without manifest.json', () => {
      const zip = new AdmZip();
      zip.addFile('layer_2_instructions.md', Buffer.from('hello'));
      const result = parseKlatchPackage(zip.toBuffer());
      expect(result).toBeNull();
    });

    it('rejects zip whose manifest.json is malformed', () => {
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from('{not json'));
      const result = parseKlatchPackage(zip.toBuffer());
      expect(result).toBeNull();
    });

    it('rejects manifest with wrong package_kind', () => {
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify({
        package_kind: 'something-else',
        conversation_context: { id: 'x' },
      })));
      const result = parseKlatchPackage(zip.toBuffer());
      expect(result).toBeNull();
    });

    it('rejects manifest missing conversation_context.id', () => {
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify({
        package_kind: 'klatch.context.v1',
      })));
      const result = parseKlatchPackage(zip.toBuffer());
      expect(result).toBeNull();
    });

    it('extracts a real exported zip', async () => {
      const { ch } = setupSourceChannel();
      const app = createTestApp();
      const zipBuffer = await exportZip(app, ch.id);
      const parsed = parseKlatchPackage(zipBuffer);
      expect(parsed).not.toBeNull();
      expect(parsed!.manifest.package_kind).toBe('klatch.context.v1');
      expect(parsed!.manifest.conversation_context.id).toBe(ch.id);
      expect(parsed!.layer4).toBe('Channel context here.');
      expect(parsed!.conversationJsonl).toContain('Round-trip message 1');
    });
  });

  describe('round-trip into the same instance (idempotent attach)', () => {
    it('re-importing without forceImport returns 409 with conflict info', async () => {
      const { ch } = setupSourceChannel();
      const app = createTestApp();
      const zipBuffer = await exportZip(app, ch.id);

      const formData = new FormData();
      formData.append('file', new File([zipBuffer], 'export.zip', { type: 'application/zip' }));

      const res = await app.request('/api/import/klatch', { method: 'POST', body: formData });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.duplicate).toBe(true);
      expect(body.existingChannelId).toBe(ch.id);
      expect(body.packageChannelId).toBe(ch.id);
    });

    it('forceImport=true creates a forked channel under a new uuid, preserving original messages', async () => {
      const { ch } = setupSourceChannel();
      const app = createTestApp();
      const zipBuffer = await exportZip(app, ch.id);

      const result = importKlatchPackage({ zipBuffer, forceImport: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.result.forked).toBe(true);
      expect(result.result.channelId).not.toBe(ch.id);
      expect(result.result.messageCount).toBe(4);
      // Project and entities are reused (same canonical UUIDs already present)
      expect(result.result.reused.project).toBe(true);
      expect(result.result.reused.entities).toBeGreaterThanOrEqual(1);

      // Forked channel exists; original still intact
      const forked = getChannel(result.result.channelId);
      expect(forked).toBeDefined();
      expect(forked!.name).toBe(ch.name);
      const original = getChannel(ch.id);
      expect(original).toBeDefined();

      // Both channels carry their messages independently
      const forkedMsgs = getMessages(result.result.channelId);
      expect(forkedMsgs).toHaveLength(4);
      expect(forkedMsgs[0].content).toContain('Round-trip message');

      // Forked messages have the original ids stored in original_id
      expect(forkedMsgs[0].originalId).toBeTruthy();
    });
  });

  describe('round-trip into a fresh database (Klatch-to-Klatch)', () => {
    it('preserves canonical UUIDs and re-creates project + channel + entity + messages', async () => {
      // Step 1: build + export from "instance A"
      const { proj, ch, entity } = setupSourceChannel();
      const app = createTestApp();
      const zipBuffer = await exportZip(app, ch.id);

      // Step 2: tear it all down to simulate a fresh instance.
      // FK order: message_artifacts → messages → channel_entities → file_refs
      // → channels → entities (custom) → projects.
      const db = (await import('../db/index.js')).getDb();
      db.exec('DELETE FROM message_artifacts');
      db.exec('DELETE FROM messages');
      db.exec('DELETE FROM channel_entities');
      db.exec('DELETE FROM file_refs');
      db.exec("DELETE FROM channels WHERE id != 'default'");
      db.exec("DELETE FROM entities WHERE id != 'default-entity'");
      db.exec('DELETE FROM projects');

      expect(getChannel(ch.id)).toBeUndefined();
      expect(getProject(proj.id)).toBeUndefined();
      expect(getEntity(entity.id)).toBeUndefined();

      // Step 3: import the zip into the fresh DB
      const outcome = importKlatchPackage({ zipBuffer });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      // Canonical IDs preserved
      expect(outcome.result.channelId).toBe(ch.id);
      expect(outcome.result.projectId).toBe(proj.id);
      expect(outcome.result.forked).toBe(false);
      expect(outcome.result.reused.project).toBe(false);
      // default-entity is auto-assigned by createChannel and seeded by setup.ts,
      // so it shows up in the manifest entities and gets "reused" on import.
      // RT-Bot is the freshly-created one. Total reused entities should be
      // exactly the count of seed-overlap entities (default-entity = 1).
      expect(outcome.result.reused.entities).toBe(1);
      expect(outcome.result.messageCount).toBe(4);

      // Database state
      const importedChannel = getChannel(ch.id);
      expect(importedChannel).toBeDefined();
      expect(importedChannel!.name).toBe(ch.name);
      expect(importedChannel!.systemPrompt).toBe('Channel context here.');
      expect(importedChannel!.projectId).toBe(proj.id);
      expect(importedChannel!.source).toBe('klatch');

      const importedProject = getProject(proj.id);
      expect(importedProject).toBeDefined();
      expect(importedProject!.name).toBe('Round-trip Project');
      expect(importedProject!.instructions).toBe('Be terse.');
      expect(importedProject!.memory).toBe('User likes lists.');

      const importedEntity = getEntity(entity.id);
      expect(importedEntity).toBeDefined();
      expect(importedEntity!.name).toBe('RT-Bot');
      expect(importedEntity!.handle).toBe('@rtbot');
      // Reflection survived the round trip via field_notes recovery
      expect(importedEntity!.reflections).toHaveLength(1);
      expect(importedEntity!.reflections![0].observation).toContain('diff view');
      expect(importedEntity!.reflections![0].ingress).toBe('import');

      const channelEntities = getChannelEntities(ch.id);
      expect(channelEntities.find((e) => e.id === entity.id)).toBeDefined();

      const msgs = getMessages(ch.id);
      expect(msgs).toHaveLength(4);
      expect(msgs[0].role).toBe('user');
      expect(msgs[0].content).toBe('Round-trip message 1');
    });
  });

  describe('source preservation across re-imports', () => {
    it('stamps source="klatch" when the package originated from a native Klatch channel', async () => {
      const { ch } = setupSourceChannel();
      const app = createTestApp();
      const zipBuffer = await exportZip(app, ch.id);

      const db = (await import('../db/index.js')).getDb();
      db.exec('DELETE FROM message_artifacts');
      db.exec('DELETE FROM messages');
      db.exec('DELETE FROM channel_entities');
      db.exec('DELETE FROM file_refs');
      db.exec("DELETE FROM channels WHERE id != 'default'");
      db.exec("DELETE FROM entities WHERE id != 'default-entity'");
      db.exec('DELETE FROM projects');

      const outcome = importKlatchPackage({ zipBuffer });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;
      expect(getChannel(outcome.result.channelId)!.source).toBe('klatch');
    });

    it('preserves source="claude-code" when re-importing a package that originated as a claude-code import', async () => {
      // Manually construct a manifest where provenance[0] indicates claude-code
      const channelId = 'cc-' + Math.random().toString(36).slice(2, 10);
      const manifest = {
        format_version: '1.0.0',
        source_type: 'klatch',
        package_id: 'pkg-1',
        package_kind: 'klatch.context.v1',
        created_at: new Date().toISOString(),
        provenance: [
          { source: 'claude-code', at: '2026-01-01T00:00:00Z', summary: 'Original Claude Code session', path: '/some/project', session_id: 'sess-99' },
          { source: 'klatch', at: new Date().toISOString(), channel_id: channelId },
        ],
        project: null,
        conversation_context: { id: channelId, name: 'Imported CC channel', type: 'chat', mode: 'roundtable', created_at: '2026-01-01T00:00:00Z' },
        entities: [],
        files: [],
        conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
        extensions: { klatch: {} },
      };
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      zip.addFile('conversation.jsonl', Buffer.from(''));

      const outcome = importKlatchPackage({ zipBuffer: zip.toBuffer() });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const imported = getChannel(channelId);
      expect(imported).toBeDefined();
      expect(imported!.source).toBe('claude-code');
      // Upstream metadata recovered into source_metadata
      const meta = JSON.parse(imported!.sourceMetadata!);
      expect(meta.cwd).toBe('/some/project');
      expect(meta.originalSessionId).toBe('sess-99');
    });
  });

  describe('error responses', () => {
    it('returns 400 for non-zip bytes', () => {
      const outcome = importKlatchPackage({ zipBuffer: Buffer.from('garbage') });
      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.status).toBe(400);
    });

    it('HTTP route returns 400 for invalid zip', async () => {
      const app = createTestApp();
      const formData = new FormData();
      formData.append('file', new File([Buffer.from('garbage')], 'bad.zip', { type: 'application/zip' }));
      const res = await app.request('/api/import/klatch', { method: 'POST', body: formData });
      expect(res.status).toBe(400);
    });
  });

  describe('Finding 3: POST /api/projects accepts memory field', () => {
    it('persists memory passed to POST /api/projects (matching PATCH behavior)', async () => {
      const app = createTestApp();
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Project With Memory',
          instructions: 'Use TS.',
          memory: 'Prefer functional style.',
        }),
      });
      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.name).toBe('Project With Memory');
      expect(created.instructions).toBe('Use TS.');
      expect(created.memory).toBe('Prefer functional style.');

      const fetched = getProject(created.id);
      expect(fetched!.memory).toBe('Prefer functional style.');
    });

    it('still works without memory (back-compat)', async () => {
      const app = createTestApp();
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Memoryless', instructions: 'x' }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.memory).toBe('');
    });
  });
});
