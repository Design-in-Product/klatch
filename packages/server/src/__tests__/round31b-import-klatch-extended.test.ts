/**
 * Round 31b: /import/klatch — extended structural / property coverage (Argus)
 *
 * Complements Round 31 (Daedalus's 15 baseline tests). Exit-criteria coverage
 * for the 1.0 round-trip claim per `daedalus-to-argus-round31b-assignment-2026-04-28.md`:
 *
 *   1. Round-trip fidelity matrix — for representative channel-shape
 *      combinations across (±project, entity count, ±files, ±compaction,
 *      ±reflections, source ∈ {native, claude-code, claude-ai}, ±L4),
 *      prove export → import → export produces structurally equivalent
 *      manifests modulo timestamps, package_id, and forked uuids.
 *   2. Idempotency invariants — 409 envelope identical on repeat;
 *      forceImport=true twice yields two distinct forks; importing into
 *      source instance leaves project/entity/file rows unchanged; importing
 *      into fresh instance preserves all canonical UUIDs byte-for-byte.
 *   3. Source preservation matrix — claude-code and claude-ai upstream
 *      provenance preserved through the import chain; chain doesn't break on
 *      re-export.
 *   4. Negative cases — wrong package_kind (project.v1, future kinds), file
 *      referenced in manifest.files but missing from zip (silent skip pinned),
 *      malformed JSONL lines mid-stream (skip lines, keep good ones), future
 *      format_version (currently no version check — pin behavior), empty
 *      entities array, zip without conversation.jsonl.
 *   5. MCP × import parity — `assembleChannelManifest` (the shared helper
 *      that backs both HTTP /export and MCP get_context_package via
 *      assembleChannelPackage) produces manifests whose canonical IDs and
 *      structural fields match what HTTP /export emits; an MCP-flavored
 *      package wrapped in a zip with sidecars re-imports identically.
 *   6. 409 envelope shape — confirms all four documented fields
 *      (existingChannelId, existingChannelName, packageChannelId, duplicate)
 *      so a UI can prompt without re-fetching.
 *
 * Out of scope (per assignment): live LLM behavior (Theseus's MAXT);
 * claude-ai UUID-matching gap (Finding 1, blocked on Iris); performance/
 * large-package stress (bounded by MAX_IMPORT_SIZE).
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
  updateChannelCompaction,
  createFile,
  createFileRef,
  getChannel,
  getProject,
  getEntity,
  getChannelEntities,
  getMessages,
  getChannelFiles,
  getProjectFiles,
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
import {
  importKlatchPackage,
  parseKlatchPackage,
} from '../import/klatch-import.js';
import { assembleChannelManifest } from '../export/assemble.js';
import { saveFile } from '../files/storage.js';
import { getDb } from '../db/index.js';

// ── App / helpers ────────────────────────────────────────────

function createTestApp() {
  const app = new Hono();
  app.route('/api', exportRoutes);
  app.route('/api', importRoutes);
  app.route('/api/projects', projectRoutes);
  return app;
}

async function exportZip(app: ReturnType<typeof createTestApp>, channelId: string): Promise<Buffer> {
  const res = await app.request(`/api/channels/${channelId}/export`);
  expect(res.status).toBe(200);
  return Buffer.from(await res.arrayBuffer());
}

/** Wipe everything but the seed default channel/entity. */
function wipeToFreshInstance(): void {
  const db = getDb();
  db.exec('DELETE FROM message_artifacts');
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM channel_entities');
  db.exec('DELETE FROM file_refs');
  db.exec('DELETE FROM files');
  db.exec("DELETE FROM channels WHERE id != 'default'");
  db.exec("DELETE FROM entities WHERE id != 'default-entity'");
  db.exec('DELETE FROM projects');
}

interface ChannelSpec {
  name: string;
  hasProject?: boolean;
  entityCount?: number;
  channelFiles?: number;
  projectFiles?: number;
  hasCompaction?: boolean;
  reflections?: Array<{ type?: 'observation' | 'correction' | 'session-end'; ingress?: string; observation: string }>;
  l4Context?: string;
  messages?: number;
}

/** Build a channel matching a spec. Returns the canonical IDs for assertion. */
function buildChannelFromSpec(spec: ChannelSpec): {
  channelId: string;
  projectId?: string;
  entityIds: string[];
  fileIds: string[];
} {
  let projectId: string | undefined;
  if (spec.hasProject) {
    const proj = createProject(`${spec.name}-proj`, 'inst', 'native', {}, 'mem');
    projectId = proj.id;
  }
  const ch = createChannel(spec.name, spec.l4Context ?? '');
  if (projectId) setChannelProject(ch.id, projectId);

  const entityIds: string[] = [];
  for (let i = 0; i < (spec.entityCount ?? 1); i++) {
    const e = createEntity(`${spec.name}-e${i}`, 'claude-opus-4-6', `prompt-${i}`, '#3B82F6', `@${spec.name}${i}`, 'high');
    assignEntityToChannel(ch.id, e.id);
    entityIds.push(e.id);
  }

  for (const r of spec.reflections ?? []) {
    appendReflection(entityIds[0], {
      observation: r.observation,
      createdAt: new Date().toISOString(),
      channelId: ch.id,
      type: r.type ?? 'observation',
      ingress: r.ingress as any,
    });
  }

  const fileIds: string[] = [];
  for (let i = 0; i < (spec.channelFiles ?? 0); i++) {
    const saved = saveFile(Buffer.from(`channel-file-${i}-content`), `chf${i}.txt`, 'text/plain');
    const f = createFile(`chf${i}.txt`, 'text/plain', saved.sizeBytes, saved.storageKey, 'user');
    createFileRef(f.id, 'channel', ch.id, 'pinned', 'user');
    fileIds.push(f.id);
  }
  if (projectId) {
    for (let i = 0; i < (spec.projectFiles ?? 0); i++) {
      const saved = saveFile(Buffer.from(`project-file-${i}-content`), `pf${i}.txt`, 'text/plain');
      const f = createFile(`pf${i}.txt`, 'text/plain', saved.sizeBytes, saved.storageKey, 'user');
      createFileRef(f.id, 'project', projectId, 'pinned', 'user');
      fileIds.push(f.id);
    }
  }

  for (let i = 0; i < (spec.messages ?? 2); i++) {
    insertMessage(ch.id, i % 2 === 0 ? 'user' : 'assistant', `${spec.name}-msg-${i}`);
  }

  if (spec.hasCompaction) {
    const m = insertMessage(ch.id, 'assistant', 'compaction-anchor');
    updateChannelCompaction(ch.id, {
      summary: 'Compacted earlier turns.',
      timestamp: '2026-04-01T00:00:00.000Z',
      beforeMessageId: m.id,
    });
  }

  return { channelId: ch.id, projectId, entityIds, fileIds };
}

/** Mask volatile fields for structural manifest equality. */
function maskVolatile(manifest: any): any {
  const clone = JSON.parse(JSON.stringify(manifest));
  clone.package_id = '<masked>';
  clone.created_at = '<masked>';
  if (Array.isArray(clone.provenance)) {
    clone.provenance = clone.provenance.map((e: any) => {
      const m = { ...e, event_id: '<masked>' };
      if (m.at) m.at = '<masked>';
      return m;
    });
  }
  if (clone.conversation_context) {
    if (clone.conversation_context.last_active_at) clone.conversation_context.last_active_at = '<masked>';
    if (clone.conversation_context.created_at) clone.conversation_context.created_at = '<masked>';
  }
  if (clone.conversation_history) {
    if (clone.conversation_history.first_message_at) clone.conversation_history.first_message_at = '<masked>';
    if (clone.conversation_history.last_message_at) clone.conversation_history.last_message_at = '<masked>';
  }
  if (Array.isArray(clone.files)) {
    clone.files = clone.files.map((f: any) => ({ ...f, added_at: f.added_at ? '<masked>' : f.added_at }));
  }
  return clone;
}

/**
 * Stronger mask for the round-trip-fidelity matrix: also strips provenance
 * and per-hop layer_fidelity. Re-exporting an imported channel advances the
 * provenance chain by design (the new export becomes a new hop), and the
 * `layer_fidelity.L1` field flips from 'absent' (native channel) to 'full'
 * (channel.source !== 'native' after import) — both expected behavioral
 * differences, not regressions. Provenance preservation is asserted
 * separately in the source-preservation matrix.
 */
function maskForRoundTripMatrix(manifest: any): any {
  const clone = maskVolatile(manifest);
  delete clone.provenance;
  return clone;
}

// ── Tests ───────────────────────────────────────────────────

describe('Round 31b: /import/klatch extended coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Round-trip fidelity matrix ──────────────────────────

  describe('round-trip fidelity matrix (export → fresh import → re-export)', () => {
    const matrix: Array<[string, ChannelSpec]> = [
      ['minimal: no project, 1 entity, no files, no compaction', { name: 'min-1', entityCount: 1 }],
      ['linked project, 1 entity', { name: 'proj-1e', hasProject: true, entityCount: 1 }],
      ['linked project, 2 entities', { name: 'proj-2e', hasProject: true, entityCount: 2 }],
      ['linked project, 5 entities', { name: 'proj-5e', hasProject: true, entityCount: 5 }],
      ['channel-scope files only', { name: 'cf', entityCount: 1, channelFiles: 2 }],
      ['project-scope files only', { name: 'pf', hasProject: true, entityCount: 1, projectFiles: 2 }],
      ['both scope files', { name: 'bf', hasProject: true, entityCount: 1, channelFiles: 1, projectFiles: 1 }],
      ['with compaction state', { name: 'cs', hasProject: true, entityCount: 1, hasCompaction: true }],
      [
        'with reflections (mixed types/ingress)',
        {
          name: 'refl',
          hasProject: true,
          entityCount: 1,
          reflections: [
            { observation: 'klatch-ui ingress note', type: 'observation', ingress: 'klatch-ui' },
            { observation: 'mcp ingress correction', type: 'correction', ingress: 'mcp' },
            { observation: 'pre-5c row no ingress', type: 'observation' },
          ],
        },
      ],
      ['non-empty L4 channel context', { name: 'l4', hasProject: true, entityCount: 1, l4Context: 'Be terse and use diff blocks.' }],
    ];

    it.each(matrix)('round-trips: %s', async (_label, spec) => {
      const built = buildChannelFromSpec(spec);
      const app = createTestApp();
      const firstZip = await exportZip(app, built.channelId);
      const firstParsed = parseKlatchPackage(firstZip);
      expect(firstParsed).not.toBeNull();
      const firstManifest = firstParsed!.manifest;

      // Wipe and re-import into a fresh instance
      wipeToFreshInstance();
      expect(getChannel(built.channelId)).toBeUndefined();

      const outcome = importKlatchPackage({ zipBuffer: firstZip });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      // Canonical IDs preserved on fresh-import path
      expect(outcome.result.channelId).toBe(built.channelId);
      expect(outcome.result.forked).toBe(false);
      if (built.projectId) expect(outcome.result.projectId).toBe(built.projectId);

      // Re-export and verify structural equality
      const secondZip = await exportZip(app, built.channelId);
      const secondParsed = parseKlatchPackage(secondZip);
      expect(secondParsed).not.toBeNull();
      const secondManifest = secondParsed!.manifest;

      // Layer sidecars are also load-bearing — round-trip those
      expect(secondParsed!.layer4).toBe(firstParsed!.layer4);
      expect(secondParsed!.layer2).toBe(firstParsed!.layer2);
      expect(secondParsed!.layer3).toBe(firstParsed!.layer3);

      // Manifests structurally equal modulo volatile fields, provenance
      // (chain advances on re-export by design), and per-hop layer_fidelity.
      // Identity fields (channel/project/entity/file IDs) and content fields
      // are the load-bearing assertions.
      expect(maskForRoundTripMatrix(secondManifest)).toEqual(
        maskForRoundTripMatrix(firstManifest),
      );
    });

    it('chain growth on re-export: re-exporting an imported channel advances provenance by exactly one klatch hop', async () => {
      const built = buildChannelFromSpec({ name: 'chain-growth', hasProject: true, entityCount: 1 });
      const app = createTestApp();
      const firstZip = await exportZip(app, built.channelId);
      const firstManifest = parseKlatchPackage(firstZip)!.manifest;
      expect(firstManifest.provenance).toHaveLength(1); // native → one klatch hop

      wipeToFreshInstance();
      const outcome = importKlatchPackage({ zipBuffer: firstZip });
      expect(outcome.ok).toBe(true);

      const secondZip = await exportZip(app, built.channelId);
      const secondManifest = parseKlatchPackage(secondZip)!.manifest;
      // After import + re-export, the imported channel has source='klatch'
      // (not 'native'), so build adds an "original klatch" hop in addition to
      // the new export hop. Exact behavior pinned: chain length is 2.
      expect(secondManifest.provenance).toHaveLength(2);
      expect(secondManifest.provenance[secondManifest.provenance.length - 1].source).toBe('klatch');
    });

    it('forked round-trip: source instance still has original after forceImport', async () => {
      const built = buildChannelFromSpec({ name: 'fork-test', hasProject: true, entityCount: 2 });
      const app = createTestApp();
      const zip = await exportZip(app, built.channelId);

      const outcome = importKlatchPackage({ zipBuffer: zip, forceImport: true });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;
      expect(outcome.result.forked).toBe(true);
      expect(outcome.result.channelId).not.toBe(built.channelId);

      // Original intact
      const original = getChannel(built.channelId);
      expect(original).toBeDefined();
      const originalMessages = getMessages(built.channelId);
      expect(originalMessages.length).toBeGreaterThan(0);

      // Fork has its own messages with original_id linkage
      const forked = getChannel(outcome.result.channelId);
      expect(forked).toBeDefined();
      const forkedMessages = getMessages(outcome.result.channelId);
      expect(forkedMessages.length).toBe(originalMessages.length);
      for (const fm of forkedMessages) {
        expect(fm.originalId).toBeTruthy();
      }
    });
  });

  // ── 2. Idempotency invariants ──────────────────────────────

  describe('idempotency invariants', () => {
    it('repeated 409: second 409 has the same shape as the first (deterministic conflict info)', async () => {
      const built = buildChannelFromSpec({ name: 'dup', entityCount: 1 });
      const app = createTestApp();
      const zip = await exportZip(app, built.channelId);

      const post = async () => {
        const fd = new FormData();
        fd.append('file', new File([zip], 'p.zip', { type: 'application/zip' }));
        return app.request('/api/import/klatch', { method: 'POST', body: fd });
      };

      const r1 = await post();
      const r2 = await post();
      expect(r1.status).toBe(409);
      expect(r2.status).toBe(409);
      const b1 = await r1.json();
      const b2 = await r2.json();
      expect(b2).toEqual(b1);
    });

    it('forceImport=true twice yields two distinct forks; original preserved', async () => {
      const built = buildChannelFromSpec({ name: 'twice-fork', hasProject: true, entityCount: 1 });
      const app = createTestApp();
      const zip = await exportZip(app, built.channelId);

      const f1 = importKlatchPackage({ zipBuffer: zip, forceImport: true });
      const f2 = importKlatchPackage({ zipBuffer: zip, forceImport: true });
      expect(f1.ok && f2.ok).toBe(true);
      if (!f1.ok || !f2.ok) return;

      expect(f1.result.channelId).not.toBe(f2.result.channelId);
      expect(f1.result.channelId).not.toBe(built.channelId);
      expect(f2.result.channelId).not.toBe(built.channelId);

      // Original + both forks all live + carry the same content
      for (const id of [built.channelId, f1.result.channelId, f2.result.channelId]) {
        expect(getChannel(id)).toBeDefined();
        expect(getMessages(id).length).toBe(getMessages(built.channelId).length);
      }
    });

    it('importing into source instance via forceImport: zero new project/entity/file rows; only channel + messages multiply', async () => {
      const built = buildChannelFromSpec({
        name: 'no-row-mult',
        hasProject: true,
        entityCount: 2,
        channelFiles: 1,
        projectFiles: 1,
      });
      const app = createTestApp();
      const zip = await exportZip(app, built.channelId);

      const db = getDb();
      const projectsBefore = (db.prepare('SELECT COUNT(*) as n FROM projects').get() as { n: number }).n;
      const entitiesBefore = (db.prepare('SELECT COUNT(*) as n FROM entities').get() as { n: number }).n;
      const filesBefore = (db.prepare('SELECT COUNT(*) as n FROM files').get() as { n: number }).n;
      const channelsBefore = (db.prepare('SELECT COUNT(*) as n FROM channels').get() as { n: number }).n;

      const outcome = importKlatchPackage({ zipBuffer: zip, forceImport: true });
      expect(outcome.ok).toBe(true);

      const projectsAfter = (db.prepare('SELECT COUNT(*) as n FROM projects').get() as { n: number }).n;
      const entitiesAfter = (db.prepare('SELECT COUNT(*) as n FROM entities').get() as { n: number }).n;
      const filesAfter = (db.prepare('SELECT COUNT(*) as n FROM files').get() as { n: number }).n;
      const channelsAfter = (db.prepare('SELECT COUNT(*) as n FROM channels').get() as { n: number }).n;

      expect(projectsAfter).toBe(projectsBefore);
      expect(entitiesAfter).toBe(entitiesBefore);
      expect(filesAfter).toBe(filesBefore);
      expect(channelsAfter).toBe(channelsBefore + 1); // exactly one new fork
    });

    it('fresh-instance import: package_id changes but conversation_context.id, project.id, entities[*].id, files[*].id are byte-identical', async () => {
      const built = buildChannelFromSpec({
        name: 'byte-id',
        hasProject: true,
        entityCount: 2,
        channelFiles: 1,
      });
      const app = createTestApp();
      const sourceZip = await exportZip(app, built.channelId);
      const sourceParsed = parseKlatchPackage(sourceZip)!;
      const sourceManifest = sourceParsed.manifest;

      wipeToFreshInstance();
      const outcome = importKlatchPackage({ zipBuffer: sourceZip });
      expect(outcome.ok).toBe(true);

      const reZip = await exportZip(app, built.channelId);
      const reParsed = parseKlatchPackage(reZip)!;
      const reManifest = reParsed.manifest;

      // package_id must differ (re-export mints new)
      expect(reManifest.package_id).not.toBe(sourceManifest.package_id);

      // Identity fields byte-identical
      expect(reManifest.conversation_context.id).toBe(sourceManifest.conversation_context.id);
      expect(reManifest.project?.id).toBe(sourceManifest.project?.id);
      expect(reManifest.entities.map((e: any) => e.id).sort()).toEqual(
        sourceManifest.entities.map((e: any) => e.id).sort(),
      );
      expect(reManifest.files.map((f: any) => f.id).sort()).toEqual(
        sourceManifest.files.map((f: any) => f.id).sort(),
      );
    });
  });

  // ── 3. Source preservation matrix ──────────────────────────

  describe('source preservation matrix', () => {
    function manifestWithSource(
      source: 'native' | 'claude-code' | 'claude-ai',
      opts: { withEntity?: boolean } = {},
    ): Buffer {
      const channelId = `${source}-` + Math.random().toString(36).slice(2, 10);
      const provenance: any[] = [];
      if (source === 'claude-code') {
        provenance.push({
          source: 'claude-code',
          at: '2026-01-01T00:00:00Z',
          summary: 'Original CC',
          path: '/Users/x/proj',
          session_id: 'cc-sess-1',
        });
      } else if (source === 'claude-ai') {
        provenance.push({
          source: 'claude-ai',
          at: '2026-01-01T00:00:00Z',
          summary: 'Original AI',
          session_id: 'ai-conv-1',
          project_uuid: 'ai-proj-1',
        });
      }
      provenance.push({ source: 'klatch', at: new Date().toISOString(), channel_id: channelId });

      const entities = opts.withEntity
        ? [{
            id: 'ent-' + Math.random().toString(36).slice(2, 10),
            name: 'TestEnt',
            model: 'claude-opus-4-6',
            prompt: 'You are TestEnt.',
            color: '#3B82F6',
            handle: '@testent',
          }]
        : [];

      const manifest = {
        format_version: '1.0.0',
        source_type: 'klatch',
        package_id: 'pkg-' + Math.random().toString(36).slice(2),
        package_kind: 'klatch.context.v1',
        created_at: new Date().toISOString(),
        provenance,
        project: null,
        conversation_context: { id: channelId, name: `${source} channel`, type: 'chat', mode: 'roundtable', created_at: '2026-01-01T00:00:00Z' },
        entities,
        files: [],
        conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
        extensions: { klatch: {} },
      };
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      zip.addFile('conversation.jsonl', Buffer.from(''));
      return zip.toBuffer();
    }

    it('claude-code source preserved + cwd + originalSessionId recovered', () => {
      const outcome = importKlatchPackage({ zipBuffer: manifestWithSource('claude-code') });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const ch = getChannel(outcome.result.channelId);
      expect(ch!.source).toBe('claude-code');
      const meta = JSON.parse(ch!.sourceMetadata!);
      expect(meta.cwd).toBe('/Users/x/proj');
      expect(meta.originalSessionId).toBe('cc-sess-1');
      // Upstream provenance carried forward for chain-doesn't-break
      expect(meta.upstreamProvenance.length).toBeGreaterThanOrEqual(2);
      expect(meta.upstreamProvenance[0].source).toBe('claude-code');
    });

    it('claude-ai source preserved + originalSessionId + originalProjectUuid recovered', () => {
      const outcome = importKlatchPackage({ zipBuffer: manifestWithSource('claude-ai') });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const ch = getChannel(outcome.result.channelId);
      expect(ch!.source).toBe('claude-ai');
      const meta = JSON.parse(ch!.sourceMetadata!);
      expect(meta.originalSessionId).toBe('ai-conv-1');
      expect(meta.originalProjectUuid).toBe('ai-proj-1');
    });

    it('native (klatch) source stamps "klatch" + chain has only the klatch hop', () => {
      const outcome = importKlatchPackage({ zipBuffer: manifestWithSource('native') });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const ch = getChannel(outcome.result.channelId);
      expect(ch!.source).toBe('klatch');
      const meta = JSON.parse(ch!.sourceMetadata!);
      expect(meta.upstreamProvenance.every((p: any) => p.source === 'klatch')).toBe(true);
    });

    it('chain-doesn\'t-break: re-exporting a claude-code-origin import preserves the source as the first provenance hop', async () => {
      const outcome = importKlatchPackage({ zipBuffer: manifestWithSource('claude-code', { withEntity: true }) });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const app = createTestApp();
      const reZip = await exportZip(app, outcome.result.channelId);
      const reManifest = parseKlatchPackage(reZip)!.manifest;

      // First hop must still be the original source, not 'klatch'
      expect(reManifest.provenance[0].source).toBe('claude-code');
      // And there must still be a klatch hop after it
      expect(reManifest.provenance.some((p: any) => p.source === 'klatch')).toBe(true);
    });
  });

  // ── 4. Negative cases ──────────────────────────────────────

  describe('negative cases (pin behavior or flag for follow-up)', () => {
    it('manifest with package_kind="klatch.project.v1" is rejected as 400 (reserved future kind)', () => {
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify({
        package_kind: 'klatch.project.v1',
        conversation_context: { id: 'x' },
      })));
      const outcome = importKlatchPackage({ zipBuffer: zip.toBuffer() });
      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.status).toBe(400);
    });

    it('file referenced in manifest.files but missing from zip files/ is silently skipped (no row created)', () => {
      const channelId = 'missing-file-' + Math.random().toString(36).slice(2, 10);
      const fileId = 'file-' + Math.random().toString(36).slice(2);
      const manifest = {
        format_version: '1.0.0',
        source_type: 'klatch',
        package_id: 'pkg-x',
        package_kind: 'klatch.context.v1',
        created_at: new Date().toISOString(),
        provenance: [{ source: 'klatch', at: new Date().toISOString(), channel_id: channelId }],
        project: null,
        conversation_context: { id: channelId, name: 'missing-file', type: 'chat', mode: 'roundtable', created_at: new Date().toISOString() },
        entities: [],
        files: [{ id: fileId, name: 'ghost.txt', mime_type: 'text/plain', size_bytes: 10, ref: `files/${fileId}_ghost.txt`, scope: 'channel', ref_type: 'pinned' }],
        conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
        extensions: { klatch: {} },
      };
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      zip.addFile('conversation.jsonl', Buffer.from(''));
      // Note: no files/ entry — the referenced file is absent.

      const outcome = importKlatchPackage({ zipBuffer: zip.toBuffer() });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      // No row created for the missing file
      const db = getDb();
      const row = db.prepare('SELECT id FROM files WHERE id = ?').get(fileId);
      expect(row).toBeUndefined();
      // And no file_ref to a missing file either
      const refRow = db.prepare('SELECT id FROM file_refs WHERE file_id = ?').get(fileId);
      expect(refRow).toBeUndefined();
    });

    it('malformed JSONL lines mid-stream are skipped; well-formed lines around them still imported', () => {
      const channelId = 'malformed-' + Math.random().toString(36).slice(2, 10);
      const goodLine1 = JSON.stringify({ id: 'm1', role: 'user', content: 'first', created_at: new Date().toISOString() });
      const goodLine2 = JSON.stringify({ id: 'm2', role: 'assistant', content: 'second', created_at: new Date().toISOString() });
      const malformed = '{not json{';
      const jsonl = [goodLine1, malformed, goodLine2].join('\n');

      const manifest = {
        format_version: '1.0.0',
        source_type: 'klatch',
        package_id: 'pkg-mal',
        package_kind: 'klatch.context.v1',
        created_at: new Date().toISOString(),
        provenance: [{ source: 'klatch', at: new Date().toISOString(), channel_id: channelId }],
        project: null,
        conversation_context: { id: channelId, name: 'mal', type: 'chat', mode: 'roundtable', created_at: new Date().toISOString() },
        entities: [],
        files: [],
        conversation_history: { ref: 'conversation.jsonl', message_count: 3 },
        extensions: { klatch: {} },
      };
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      zip.addFile('conversation.jsonl', Buffer.from(jsonl));

      const outcome = importKlatchPackage({ zipBuffer: zip.toBuffer() });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      // Two good lines imported, malformed dropped
      expect(outcome.result.messageCount).toBe(2);
      const msgs = getMessages(channelId);
      expect(msgs).toHaveLength(2);
      expect(msgs[0].content).toBe('first');
      expect(msgs[1].content).toBe('second');
    });

    it('format_version outside SUPPORTED_FORMAT_VERSIONS is rejected with 400 + versionMismatch (Round 32: gating)', () => {
      // Round 32 (Daedalus, 5/11): the import path now gates format_version
      // against SUPPORTED_FORMAT_VERSIONS to prevent silent fidelity loss
      // on materialized DB rows. Was: permissive (the FLAGGED test that
      // previously lived here pinned that gap).
      const channelId = 'fv-future-' + Math.random().toString(36).slice(2, 10);
      const manifest = {
        format_version: '99.0.0',
        source_type: 'klatch',
        package_id: 'pkg-fv',
        package_kind: 'klatch.context.v1',
        created_at: new Date().toISOString(),
        provenance: [{ source: 'klatch', at: new Date().toISOString(), channel_id: channelId }],
        project: null,
        conversation_context: { id: channelId, name: 'fv', type: 'chat', mode: 'roundtable', created_at: new Date().toISOString() },
        entities: [],
        files: [],
        conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
        extensions: { klatch: {} },
      };
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      zip.addFile('conversation.jsonl', Buffer.from(''));

      const outcome = importKlatchPackage({ zipBuffer: zip.toBuffer() });
      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.status).toBe(400);
      expect(outcome.versionMismatch).toBeDefined();
      expect(outcome.versionMismatch!.formatVersion).toBe('99.0.0');
      expect(outcome.versionMismatch!.supportedVersions).toContain('1.0.0');
      // No partial-import — channel was not created.
      expect(getChannel(channelId)).toBeUndefined();
    });

    it('empty entities array imports cleanly; default-entity is auto-attached so channel is exportable (Round 32: auto-attach)', () => {
      // Round 32 (Daedalus, 5/11): when a manifest has no entities, the
      // import path now auto-attaches default-entity to match
      // createChannel's seed behavior. Prevents the user-trap of an
      // imported channel that exists but can't be re-exported. Was:
      // zero-entity channel (the FLAGGED test that previously lived here
      // pinned that user-trap).
      const channelId = 'empty-ents-' + Math.random().toString(36).slice(2, 10);
      const manifest = {
        format_version: '1.0.0',
        source_type: 'klatch',
        package_id: 'pkg-ee',
        package_kind: 'klatch.context.v1',
        created_at: new Date().toISOString(),
        provenance: [{ source: 'klatch', at: new Date().toISOString(), channel_id: channelId }],
        project: null,
        conversation_context: { id: channelId, name: 'empty-ents', type: 'chat', mode: 'roundtable', created_at: new Date().toISOString() },
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

      const ents = getChannelEntities(channelId);
      expect(ents).toHaveLength(1);
      expect(ents[0].id).toBe('default-entity');
    });

    it('zip without conversation.jsonl: import succeeds with messageCount=0', () => {
      const channelId = 'no-jsonl-' + Math.random().toString(36).slice(2, 10);
      const manifest = {
        format_version: '1.0.0',
        source_type: 'klatch',
        package_id: 'pkg-nj',
        package_kind: 'klatch.context.v1',
        created_at: new Date().toISOString(),
        provenance: [{ source: 'klatch', at: new Date().toISOString(), channel_id: channelId }],
        project: null,
        conversation_context: { id: channelId, name: 'nj', type: 'chat', mode: 'roundtable', created_at: new Date().toISOString() },
        entities: [],
        files: [],
        conversation_history: { ref: 'conversation.jsonl', message_count: 0 },
        extensions: { klatch: {} },
      };
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      // Intentionally no conversation.jsonl entry.

      const outcome = importKlatchPackage({ zipBuffer: zip.toBuffer() });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;
      expect(outcome.result.messageCount).toBe(0);
    });
  });

  // ── 5. MCP × import parity ─────────────────────────────────

  describe('MCP × import parity', () => {
    it('assembleChannelManifest (shared helper) emits canonical IDs identical to HTTP /export', async () => {
      const built = buildChannelFromSpec({
        name: 'mcp-parity',
        hasProject: true,
        entityCount: 2,
        channelFiles: 1,
      });

      const app = createTestApp();
      const httpZip = await exportZip(app, built.channelId);
      const httpManifest = parseKlatchPackage(httpZip)!.manifest;

      const sharedAssembled = await assembleChannelManifest(built.channelId, {});
      expect(sharedAssembled).not.toBeNull();
      const sharedManifest = sharedAssembled!.manifest;

      // Canonical IDs must match across the two surfaces
      expect(sharedManifest.conversation_context.id).toBe(httpManifest.conversation_context.id);
      expect(sharedManifest.project?.id).toBe(httpManifest.project?.id);
      expect(sharedManifest.entities.map((e: any) => e.id).sort()).toEqual(
        httpManifest.entities.map((e: any) => e.id).sort(),
      );
      expect(sharedManifest.files.map((f: any) => f.id).sort()).toEqual(
        httpManifest.files.map((f: any) => f.id).sort(),
      );
      // Structural equivalence after volatile masking
      expect(maskVolatile(sharedManifest)).toEqual(maskVolatile(httpManifest));
    });

    it('a manifest produced by assembleChannelManifest, when wrapped with sidecars in a zip, re-imports identically to HTTP-export path', async () => {
      const built = buildChannelFromSpec({
        name: 'mcp-rt',
        hasProject: true,
        entityCount: 1,
        channelFiles: 1,
        l4Context: 'L4 from shared.',
      });

      const sharedAssembled = await assembleChannelManifest(built.channelId, {});
      expect(sharedAssembled).not.toBeNull();
      const { manifest, channel, project } = sharedAssembled!;

      // Build a zip that mirrors what HTTP /export would produce (manifest +
      // sidecars + jsonl). Files content is omitted here — Round 31's
      // behavior on missing-files-in-zip is "silent skip", which we already
      // covered in the negative-cases block. Parity here is about manifest
      // shape and re-import outcome on the channel/project/entity rows.
      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      zip.addFile('layer_2_instructions.md', Buffer.from(project?.instructions ?? ''));
      zip.addFile('layer_3_memory.md', Buffer.from(project?.memory ?? ''));
      zip.addFile('layer_4_context.md', Buffer.from(channel.systemPrompt ?? ''));
      zip.addFile('conversation.jsonl', Buffer.from(
        sharedAssembled!.messages.map((m) => JSON.stringify({
          id: m.id,
          role: m.role,
          content: m.content,
          status: m.status,
          model: m.model || null,
          created_at: m.createdAt,
        })).join('\n'),
      ));

      wipeToFreshInstance();
      const outcome = importKlatchPackage({ zipBuffer: zip.toBuffer() });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      // Channel re-created with canonical ID
      expect(outcome.result.channelId).toBe(built.channelId);
      const re = getChannel(built.channelId);
      expect(re).toBeDefined();
      expect(re!.systemPrompt).toBe('L4 from shared.');
      expect(re!.projectId).toBe(built.projectId);
    });
  });

  // ── 6. 409 envelope shape ──────────────────────────────────

  describe('409 conflict envelope shape', () => {
    it('includes existingChannelId, existingChannelName, packageChannelId, duplicate=true', async () => {
      const built = buildChannelFromSpec({ name: 'envelope-test', entityCount: 1 });
      const app = createTestApp();
      const zip = await exportZip(app, built.channelId);

      const fd = new FormData();
      fd.append('file', new File([zip], 'p.zip', { type: 'application/zip' }));
      const res = await app.request('/api/import/klatch', { method: 'POST', body: fd });
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.duplicate).toBe(true);
      expect(body.existingChannelId).toBe(built.channelId);
      expect(body.existingChannelName).toBe('envelope-test');
      expect(body.packageChannelId).toBe(built.channelId);
      // Plus the human-readable error string
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    it('UI-can-prompt-without-refetch: the 409 body alone carries everything needed for an "attach to existing or fork?" dialog', async () => {
      const built = buildChannelFromSpec({ name: 'sufficient-info', entityCount: 1 });
      const app = createTestApp();
      const zip = await exportZip(app, built.channelId);

      const fd = new FormData();
      fd.append('file', new File([zip], 'p.zip', { type: 'application/zip' }));
      const res = await app.request('/api/import/klatch', { method: 'POST', body: fd });
      const body = await res.json();

      // Sufficient information for both branches of the dialog without any
      // additional GET to the server.
      expect(body.existingChannelId).toBeTruthy(); // → "attach to existing"
      expect(body.existingChannelName).toBeTruthy(); // → display label in dialog
      expect(body.packageChannelId).toBe(body.existingChannelId); // → confirmation that it's the same canonical id
    });
  });
});
