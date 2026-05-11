/**
 * Round 32: /import/klatch — format_version gating + empty-entities
 * auto-attach (Argus 31b follow-ups #2 + #3).
 *
 * Argus 31b's two FLAGGED tests in round31b-import-klatch-extended.test.ts
 * pinned the old behavior; those have been flipped to the new contract.
 * This file adds coverage for the boundary cases that didn't fit there:
 * - Missing format_version field at all (vs explicit unsupported value).
 * - HTTP route 400 envelope shape for both bodies (multipart + JSON).
 * - 1.0.0 still accepted (positive case for the gate).
 * - Auto-attach is idempotent if invoked twice (forceImport fork).
 */

import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import { getChannel, getChannelEntities, getEntity } from '../db/queries.js';

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
import { importRoutes } from '../routes/import.js';
import AdmZip from 'adm-zip';
import { importKlatchPackage } from '../import/klatch-import.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', importRoutes);
  return app;
}

function buildZip(manifest: any, jsonl = ''): Buffer {
  const zip = new AdmZip();
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
  zip.addFile('conversation.jsonl', Buffer.from(jsonl));
  return zip.toBuffer();
}

function makeManifest(overrides: Partial<any> = {}, channelId = 'r32-' + Math.random().toString(36).slice(2, 10)) {
  return {
    format_version: '1.0.0',
    source_type: 'klatch',
    package_id: 'pkg-r32',
    package_kind: 'klatch.context.v1',
    created_at: new Date().toISOString(),
    provenance: [{ source: 'klatch', at: new Date().toISOString(), channel_id: channelId }],
    project: null,
    conversation_context: { id: channelId, name: 'r32', type: 'chat', mode: 'roundtable', created_at: new Date().toISOString() },
    entities: [],
    files: [],
    conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
    extensions: { klatch: {} },
    ...overrides,
  };
}

describe('Round 32: import gating + auto-attach', () => {
  describe('format_version gate', () => {
    it('accepts the current supported version', () => {
      const outcome = importKlatchPackage({ zipBuffer: buildZip(makeManifest()) });
      expect(outcome.ok).toBe(true);
    });

    it('rejects missing format_version with 400 + versionMismatch', () => {
      const manifest = makeManifest();
      delete manifest.format_version;
      const outcome = importKlatchPackage({ zipBuffer: buildZip(manifest) });
      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.status).toBe(400);
      expect(outcome.versionMismatch).toBeDefined();
      expect(outcome.versionMismatch!.formatVersion).toBe('');
    });

    it('rejects a non-string format_version', () => {
      const outcome = importKlatchPackage({ zipBuffer: buildZip(makeManifest({ format_version: 42 })) });
      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.status).toBe(400);
      expect(outcome.versionMismatch).toBeDefined();
    });

    it('rejects a future version with structured 400 over the HTTP route', async () => {
      const app = createTestApp();
      const zipBuffer = buildZip(makeManifest({ format_version: '99.0.0' }));
      const formData = new FormData();
      formData.append('file', new File([zipBuffer], 'r32.zip', { type: 'application/zip' }));
      const res = await app.request('/api/import/klatch', { method: 'POST', body: formData });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Unsupported format_version');
      expect(body.formatVersion).toBe('99.0.0');
      expect(body.supportedVersions).toEqual(expect.arrayContaining(['1.0.0']));
    });

    it('does not create any DB rows when gated', () => {
      const channelId = 'gated-' + Math.random().toString(36).slice(2, 10);
      const manifest = makeManifest({ format_version: '2.5.0' }, channelId);
      importKlatchPackage({ zipBuffer: buildZip(manifest) });
      expect(getChannel(channelId)).toBeUndefined();
    });
  });

  describe('empty-entities auto-attach', () => {
    it('attaches default-entity when manifest.entities is missing entirely', () => {
      const channelId = 'no-ents-' + Math.random().toString(36).slice(2, 10);
      const manifest = makeManifest({}, channelId);
      delete manifest.entities;
      const outcome = importKlatchPackage({ zipBuffer: buildZip(manifest) });
      expect(outcome.ok).toBe(true);
      const ents = getChannelEntities(channelId);
      expect(ents).toHaveLength(1);
      expect(ents[0].id).toBe('default-entity');
    });

    it('does not duplicate default-entity if it is already in manifest.entities', () => {
      const channelId = 'def-already-' + Math.random().toString(36).slice(2, 10);
      const existing = getEntity('default-entity');
      expect(existing).toBeDefined();
      const manifest = makeManifest({
        entities: [{
          id: 'default-entity',
          name: existing!.name,
          handle: existing!.handle ?? null,
          model: existing!.model,
          color: existing!.color,
          prompt: existing!.systemPrompt,
          prompt_length_chars: existing!.systemPrompt.length,
          field_notes: null,
        }],
      }, channelId);
      const outcome = importKlatchPackage({ zipBuffer: buildZip(manifest) });
      expect(outcome.ok).toBe(true);
      const ents = getChannelEntities(channelId);
      expect(ents).toHaveLength(1);
      expect(ents[0].id).toBe('default-entity');
    });

    it('forked re-import of an empty-entities channel still auto-attaches default-entity', () => {
      const channelId = 'fork-empty-' + Math.random().toString(36).slice(2, 10);
      const zipBuffer = buildZip(makeManifest({}, channelId));
      const first = importKlatchPackage({ zipBuffer });
      expect(first.ok).toBe(true);
      const second = importKlatchPackage({ zipBuffer, forceImport: true });
      expect(second.ok).toBe(true);
      if (!second.ok) return;
      expect(second.result.forked).toBe(true);
      const forkedEnts = getChannelEntities(second.result.channelId);
      expect(forkedEnts).toHaveLength(1);
      expect(forkedEnts[0].id).toBe('default-entity');
    });
  });
});
