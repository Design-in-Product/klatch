/**
 * Round 35: claude.ai round-trip idempotency by canonical UUID.
 *
 * Closes Theseus's 4/27 Finding 1: re-importing a Klatch export rendered
 * as claude.ai produced a duplicate project ("AAXT Test Project × 2")
 * instead of attaching to the original.
 *
 * Two halves of the fix:
 *
 * 1. EXPORT side — `adaptToClaudeAi` preserves the canonical Klatch
 *    channel id in the produced `conversations.json`. Previously it
 *    minted a fresh uuid, so the round-trip's match key was lost.
 *
 * 2. IMPORT side — `findOrCreateProject` and `findChannelByOriginalSessionId`
 *    are now two-pass: canonical Klatch id first (round-trip), then
 *    source-metadata match (true claude-ai origin). Existing claude-ai
 *    imports continue to dedupe by `originalProjectUuid` /
 *    `originalSessionId`; round-trips of Klatch-native rows dedupe by id.
 *
 * Iris's UX-shape memo from 4/28 is still pending; the visible behavior
 * on conflict (toast / silent attach / dialog) is hers to decide. This
 * round ships the CORRECTNESS layer with the most conservative default
 * (silent attach via existing skip-on-match logic). Visible shape can be
 * revised without changing the dedup semantics.
 */

import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import {
  createChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
  insertMessage,
  findOrCreateProject,
  findChannelByOriginalSessionId,
  getAllProjects,
  getAllChannels,
} from '../db/queries.js';
import { adaptToClaudeAi } from '../export/transport-claude-ai.js';
import { buildManifest } from '../export/package-builder.js';

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

describe('Round 35: claude.ai round-trip — canonical UUID dedup', () => {
  describe('export side: adaptToClaudeAi preserves canonical channel id', () => {
    it('conversations.json uses the manifest channel id, not a fresh uuid', () => {
      const proj = createProject('Roundtrip', 'inst', 'native', {}, '');
      const ch = createChannel('rt-export-uuid', 'ctx');
      setChannelProject(ch.id, proj.id);
      const entity = createEntity('E', 'claude-opus-4-6', 'p', '#3B82F6');
      assignEntityToChannel(ch.id, entity.id);
      const msgs = [
        insertMessage(ch.id, 'user', 'hi'),
        insertMessage(ch.id, 'assistant', 'hey'),
      ];

      const manifest = buildManifest({
        packageId: 'pkg-1',
        createdAt: new Date().toISOString(),
        channel: { ...ch, source: 'native' },
        project: proj,
        entities: [entity],
        channelFiles: [],
        projectFiles: [],
        messages: msgs,
      });

      const exported = adaptToClaudeAi(manifest, msgs);
      const conversations = JSON.parse(exported.conversationsJson);
      expect(conversations).toHaveLength(1);
      expect(conversations[0].uuid).toBe(ch.id);
    });

    it('projects.json already preserved canonical project id (regression pin)', () => {
      const proj = createProject('PinId', 'inst', 'native', {}, '');
      const ch = createChannel('rt-proj-uuid', '');
      setChannelProject(ch.id, proj.id);
      const entity = createEntity('E2', 'claude-opus-4-6', 'p', '#3B82F6');
      assignEntityToChannel(ch.id, entity.id);

      const manifest = buildManifest({
        packageId: 'pkg-2',
        createdAt: new Date().toISOString(),
        channel: { ...ch, source: 'native' },
        project: proj,
        entities: [entity],
        channelFiles: [],
        projectFiles: [],
        messages: [],
      });

      const exported = adaptToClaudeAi(manifest, []);
      const projects = JSON.parse(exported.projectsJson);
      expect(projects).toHaveLength(1);
      expect(projects[0].uuid).toBe(proj.id);
    });
  });

  describe('import side: findOrCreateProject two-pass', () => {
    it('matches existing project by canonical id when matchValue is the project id', () => {
      const existing = createProject('Existing native', 'inst', 'native', {}, 'mem');
      const projCountBefore = getAllProjects().length;

      // Simulate the import path's call shape: the zip's project_uuid is the
      // canonical Klatch project id (because we just exported it via claude-ai
      // adapter). The importer treats matchValue=canonicalId.
      const result = findOrCreateProject(
        existing.name,
        existing.instructions,
        'claude-ai',
        { originalProjectUuid: existing.id, importedAt: new Date().toISOString() },
        'originalProjectUuid',
        existing.id,
        existing.memory,
      );

      expect(result.id).toBe(existing.id);
      expect(getAllProjects().length).toBe(projCountBefore);
    });

    it('still matches by originalProjectUuid when project originated from claude.ai', () => {
      const originUuid = 'claude-ai-project-uuid-' + Math.random().toString(36).slice(2);
      const fromClaudeAi = createProject(
        'From claude.ai',
        'inst',
        'claude-ai',
        { originalProjectUuid: originUuid },
        'mem',
      );
      const projCountBefore = getAllProjects().length;

      const result = findOrCreateProject(
        'New name attempt',
        'new inst',
        'claude-ai',
        { originalProjectUuid: originUuid, importedAt: new Date().toISOString() },
        'originalProjectUuid',
        originUuid,
        'new mem',
      );

      expect(result.id).toBe(fromClaudeAi.id);
      expect(getAllProjects().length).toBe(projCountBefore);
    });

    it('creates a fresh row when neither pass matches', () => {
      const projCountBefore = getAllProjects().length;
      const result = findOrCreateProject(
        'Genuinely new',
        'inst',
        'claude-ai',
        { originalProjectUuid: 'no-such-uuid' },
        'originalProjectUuid',
        'no-such-uuid',
        '',
      );
      expect(getAllProjects().length).toBe(projCountBefore + 1);
      expect(result.id).not.toBe('no-such-uuid'); // newly minted id
    });
  });

  describe('import side: findChannelByOriginalSessionId two-pass', () => {
    it('matches existing channel by canonical id when sessionId is the channel id', () => {
      const ch = createChannel('rt-channel-uuid', '');
      const result = findChannelByOriginalSessionId(ch.id);
      expect(result?.id).toBe(ch.id);
    });

    it('still matches by source_metadata.originalSessionId when channel originated from claude.ai', async () => {
      const originSessionId = 'orig-sess-' + Math.random().toString(36).slice(2);
      const db = (await import('../db/index.js')).getDb();
      const importedId = 'imported-' + Math.random().toString(36).slice(2);
      db.prepare(
        'INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        importedId, 'From claude.ai', '', 'claude-opus-4-6', 'roundtable', 'chat',
        'claude-ai',
        JSON.stringify({ originalSessionId: originSessionId }),
        new Date().toISOString(),
      );

      const result = findChannelByOriginalSessionId(originSessionId);
      expect(result?.id).toBe(importedId);
    });

    it('returns undefined when neither pass matches', () => {
      expect(findChannelByOriginalSessionId('does-not-exist-anywhere')).toBeUndefined();
    });
  });
});
