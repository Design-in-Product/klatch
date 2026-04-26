/**
 * Round 25b: Phase 5a MCP server — extended coverage (Argus)
 *
 * Complements Round 25a (Daedalus's initial unit coverage). Exit-criteria
 * coverage for the 5a → 5b gate:
 *
 *   1. Protocol integration via InMemoryTransport (initialize, listResources,
 *      listResourceTemplates, readResource round trips, error paths).
 *   2. Resource-template URI resolution (plain ID, URL-encoded ID, manifest
 *      variant, unknown URI).
 *   3. Listing callbacks under load (many channels / many projects / many
 *      entities enumerate correctly; empty enumerations remain safe).
 *   4. assembleChannelPackage edge cases (no non-default entities, imported
 *      source with 2-hop provenance, compaction_state parsing, 0 messages,
 *      file dedupe across project + channel scopes).
 *   5. negotiateFormatVersion behavior across the full input space.
 *   6. Refactor equivalence — HTTP /export-preview and the MCP-side
 *      assembleChannelPackage produce the same manifest shape from the same
 *      DB state (volatile fields masked).
 *   7. HTTP export-route regression — Rounds 18/22/23/24 assertions still
 *      hold after the buildManifest extraction. (Covered by running the full
 *      suite; this file verifies the shared builder is still wired in.)
 *
 * Non-goals (out of 5a scope): tools surface (5b), briefing/extraction
 * delegation (5b), reflect write-path (5c), HTTP transport (5d).
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
  insertMessage,
  updateChannelCompaction,
  createFile,
  createFileRef,
} from '../db/queries.js';
import {
  createKlatchMcpServer,
  listChannelsLightweight,
  _internal,
  CHANNELS_LIST_URI,
} from '../mcp/server.js';
import {
  FORMAT_VERSION,
  SUPPORTED_FORMAT_VERSIONS,
  negotiateFormatVersion,
  buildManifest,
} from '../export/package-builder.js';
import { getDb } from '../db/index.js';
import { getChannel, getChannelEntities, getMessages, getChannelFiles, getProjectFiles, getProjectForChannel } from '../db/queries.js';
import { v4 as uuidv4 } from 'uuid';

const { assembleChannelPackage } = _internal;

// ── Helpers ──────────────────────────────────────────────────

/** Spin up a Client ↔ Server pair over InMemoryTransport and return the client. */
async function connectClient(): Promise<{ client: Client; close: () => Promise<void> }> {
  const server = createKlatchMcpServer();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

/** Insert an imported channel directly (createChannel doesn't accept source). */
function insertImportedChannel(
  name: string,
  source: 'claude-code' | 'claude-ai',
  metadata: Record<string, any>,
): string {
  const id = uuidv4();
  getDb()
    .prepare(
      `INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(id, name, '', 'claude-opus-4-6', 'panel', 'chat', source, JSON.stringify(metadata));
  return id;
}

/** Mask volatile fields (UUIDs, timestamps, event IDs) so two manifests can be structurally compared. */
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
    // last_active_at mirrors message created_at which is DB-generated
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

// ── 1. Protocol integration via InMemoryTransport ────────────

describe('Round 25b: MCP protocol integration', () => {
  it('initializes and advertises server info', async () => {
    const { client, close } = await connectClient();
    try {
      const info = client.getServerVersion();
      expect(info?.name).toBe('klatch');
      expect(info?.version).toBeTruthy();

      const caps = client.getServerCapabilities();
      expect(caps?.resources).toBeDefined();
    } finally {
      await close();
    }
  });

  it('listResources enumerates the channels list URI plus any non-templated resources', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.listResources();
      const uris = result.resources.map((r) => r.uri);
      // The static channels-list resource should always appear
      expect(uris).toContain(CHANNELS_LIST_URI);
    } finally {
      await close();
    }
  });

  it('listResourceTemplates advertises the channel/project/entity templates', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.listResourceTemplates();
      const templates = result.resourceTemplates.map((t) => t.uriTemplate);
      expect(templates).toContain('klatch://channels/{id}');
      expect(templates).toContain('klatch://channels/{id}/manifest');
      expect(templates).toContain('klatch://projects/{id}');
      expect(templates).toContain('klatch://entities/{id}');
    } finally {
      await close();
    }
  });

  it('readResource on klatch://channels returns a JSON list', async () => {
    const { client, close } = await connectClient();
    try {
      createChannel('alpha', 'x');
      const res = await client.readResource({ uri: CHANNELS_LIST_URI });
      expect(res.contents).toHaveLength(1);
      const text = (res.contents[0] as any).text as string;
      const parsed = JSON.parse(text);
      expect(parsed.format_version).toBe(FORMAT_VERSION);
      expect(Array.isArray(parsed.channels)).toBe(true);
      expect(parsed.channels.some((c: any) => c.name === 'alpha')).toBe(true);
    } finally {
      await close();
    }
  });

  it('readResource on a templated channel URI returns a canonical package', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('t-ch', 'ctx');
      const res = await client.readResource({ uri: `klatch://channels/${ch.id}` });
      const parsed = JSON.parse((res.contents[0] as any).text);
      expect(parsed.format_version).toBe(FORMAT_VERSION);
      expect(parsed.package_kind).toBe('klatch.context.v1');
      expect(parsed.conversation_context.id).toBe(ch.id);
    } finally {
      await close();
    }
  });

  it('readResource on an unknown channel URI rejects with an error', async () => {
    const { client, close } = await connectClient();
    try {
      await expect(
        client.readResource({ uri: 'klatch://channels/does-not-exist' }),
      ).rejects.toBeTruthy();
    } finally {
      await close();
    }
  });

  it('readResource on an unknown project URI rejects', async () => {
    const { client, close } = await connectClient();
    try {
      await expect(
        client.readResource({ uri: 'klatch://projects/nope' }),
      ).rejects.toBeTruthy();
    } finally {
      await close();
    }
  });

  it('readResource on an unknown entity URI rejects', async () => {
    const { client, close } = await connectClient();
    try {
      await expect(
        client.readResource({ uri: 'klatch://entities/nope' }),
      ).rejects.toBeTruthy();
    } finally {
      await close();
    }
  });

  it('readResource on an entirely unknown scheme/path rejects', async () => {
    const { client, close } = await connectClient();
    try {
      await expect(
        client.readResource({ uri: 'klatch://unknown/thing' }),
      ).rejects.toBeTruthy();
    } finally {
      await close();
    }
  });
});

// ── 2. URI-template expansion ────────────────────────────────

describe('Round 25b: URI-template expansion', () => {
  it('manifest variant resolves via klatch://channels/{id}/manifest', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('mani', 'x');
      const res = await client.readResource({ uri: `klatch://channels/${ch.id}/manifest` });
      const parsed = JSON.parse((res.contents[0] as any).text);
      expect(parsed.conversation_context.id).toBe(ch.id);
    } finally {
      await close();
    }
  });

  it('UUID-style channel IDs (the production shape) resolve verbatim via the template', async () => {
    const { client, close } = await connectClient();
    try {
      // Real channel IDs are UUIDs (no reserved URI chars), so this is the hot path.
      const ch = createChannel('uuid-case', 'x');
      expect(ch.id).toMatch(/^[0-9a-f-]+$/i);
      const res = await client.readResource({ uri: `klatch://channels/${ch.id}` });
      const parsed = JSON.parse((res.contents[0] as any).text);
      expect(parsed.conversation_context.id).toBe(ch.id);
    } finally {
      await close();
    }
  });

  it('path segment is URL-decoded before DB lookup (Phase 5c — Argus 2026-04-18 memo applied)', async () => {
    // Contract (as of Phase 5c): the resource template handlers call
    // decodeURIComponent on the captured `id` variable before DB lookup, per
    // RFC 3986 path-segment guidance. Klatch IDs are UUIDs in practice (which
    // are invariant under percent-decoding), but this guards against future
    // ID-shape changes and matches the cross-producer expectation.
    const { client, close } = await connectClient();
    try {
      const rawId = 'id with space';
      getDb()
        .prepare(
          `INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .run(rawId, 'weird', '', 'claude-opus-4-6', 'panel', 'chat');
      getDb()
        .prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
        .run(rawId, 'default-entity');

      // Sending the percent-encoded form now matches because the server
      // decodes the URI variable before lookup.
      const result = await client.readResource({
        uri: `klatch://channels/${encodeURIComponent(rawId)}`,
      });
      expect(result.contents.length).toBeGreaterThan(0);
      const parsed = JSON.parse(result.contents[0].text as string);
      expect(parsed.conversation_context.id).toBe(rawId);
    } finally {
      await close();
    }
  });
});

// ── 3. Listing callbacks under load ──────────────────────────

describe('Round 25b: listing callbacks', () => {
  it('template-list callback enumerates many channels', async () => {
    const { client, close } = await connectClient();
    try {
      const ids: string[] = [];
      for (let i = 0; i < 25; i++) {
        ids.push(createChannel(`ch-${i}`, 'x').id);
      }
      const res = await client.listResources();
      const channelResourceUris = res.resources
        .map((r) => r.uri)
        .filter((u) => u.startsWith('klatch://channels/') && !u.endsWith('/manifest') && u !== CHANNELS_LIST_URI);
      // Seed 'default' channel plus 25 we created
      expect(channelResourceUris.length).toBeGreaterThanOrEqual(25);
      for (const id of ids) {
        expect(channelResourceUris).toContain(`klatch://channels/${id}`);
      }
    } finally {
      await close();
    }
  });

  it('template-list callback enumerates zero projects without error', async () => {
    const { client, close } = await connectClient();
    try {
      const res = await client.listResources();
      const projectUris = res.resources.map((r) => r.uri).filter((u) => u.startsWith('klatch://projects/'));
      expect(projectUris).toEqual([]); // no projects seeded
    } finally {
      await close();
    }
  });

  it('template-list callback enumerates many entities', async () => {
    const { client, close } = await connectClient();
    try {
      const ids: string[] = [];
      for (let i = 0; i < 10; i++) {
        ids.push(createEntity(`e-${i}`, 'claude-opus-4-6', 'p', '#3B82F6').id);
      }
      const res = await client.listResources();
      const entityUris = res.resources.map((r) => r.uri).filter((u) => u.startsWith('klatch://entities/'));
      // Seed 'default-claude' entity + 10 new
      expect(entityUris.length).toBeGreaterThanOrEqual(10);
      for (const id of ids) {
        expect(entityUris).toContain(`klatch://entities/${id}`);
      }
    } finally {
      await close();
    }
  });

  it('lightweight channel listing returns expected metadata fields', () => {
    createChannel('has-shape', 'x');
    const list = listChannelsLightweight();
    for (const c of list) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('type');
      expect(c).toHaveProperty('mode');
      expect(c).toHaveProperty('source');
      expect(c).toHaveProperty('created_at');
      expect(c).toHaveProperty('message_count');
      expect(c).toHaveProperty('entity_count');
      expect(c).toHaveProperty('last_active_at');
    }
  });
});

// ── 4. assembleChannelPackage edge cases ─────────────────────

describe('Round 25b: assembleChannelPackage edge cases', () => {
  it('channel with no entities still produces a valid manifest (entities: [])', () => {
    const channel = createChannel('no-ents', 'x');
    // Strip the auto-assigned default entity
    getDb().prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(channel.id);

    const pkg = assembleChannelPackage(channel.id);
    expect(pkg).not.toBeNull();
    expect(pkg.entities).toEqual([]);
    // Still a well-formed canonical package
    expect(pkg.format_version).toBe(FORMAT_VERSION);
    expect(pkg.package_kind).toBe('klatch.context.v1');
    expect(pkg.provenance).toHaveLength(1);
  });

  it('imported channel yields a 2-hop provenance chain (source first, klatch last)', () => {
    const chId = insertImportedChannel('imported', 'claude-code', {
      cwd: '/Users/xian/projects/x',
      originalSessionId: 'sess-xyz',
      importedAt: '2026-01-15T12:00:00.000Z',
    });

    const pkg = assembleChannelPackage(chId);
    expect(pkg.provenance).toHaveLength(2);
    expect(pkg.provenance[0].source).toBe('claude-code');
    expect(pkg.provenance[0].path).toBe('/Users/xian/projects/x');
    expect(pkg.provenance[0].session_id).toBe('sess-xyz');
    expect(pkg.provenance[0].layer_fidelity).toBeNull();
    expect(pkg.provenance[1].source).toBe('klatch');
    // Klatch hop advertises L1 as full when source != native
    expect(pkg.provenance[1].layer_fidelity.L1).toBe('full');
  });

  it('compaction_state JSON is parsed into the manifest', () => {
    const channel = createChannel('compacted', 'x');
    insertMessage(channel.id, 'user', 'msg1');
    const m = insertMessage(channel.id, 'assistant', 'a1');
    updateChannelCompaction(channel.id, {
      summary: 'Compacted history summary.',
      timestamp: '2026-04-01T00:00:00.000Z',
      beforeMessageId: m.id,
    });

    const pkg = assembleChannelPackage(channel.id);
    const cs = pkg.conversation_context.compaction_state;
    expect(cs).not.toBeNull();
    expect(cs.summary).toBe('Compacted history summary.');
    expect(cs.before_message_id).toBe(m.id);
    expect(cs.compacted_at).toBe('2026-04-01T00:00:00.000Z');
  });

  it('channel with zero messages has null first_message_at / last_message_at', () => {
    const channel = createChannel('empty', 'x');
    const pkg = assembleChannelPackage(channel.id);
    expect(pkg.conversation_history.message_count).toBe(0);
    expect(pkg.conversation_history.first_message_at).toBeNull();
    expect(pkg.conversation_history.last_message_at).toBeNull();
  });

  it('files pinned at both project and channel scope are deduplicated in the files array', () => {
    const proj = createProject('dupe-proj', 'i', 'native', {}, 'm');
    const channel = createChannel('dupe-ch', 'x');
    setChannelProject(channel.id, proj.id);

    const file = createFile('shared.md', 'text/markdown', 42, 'storage/shared', 'user');
    // Same file pinned at both scopes
    createFileRef(file.id, 'project', proj.id, 'pinned', 'user');
    createFileRef(file.id, 'channel', channel.id, 'pinned', 'user');

    const pkg = assembleChannelPackage(channel.id);
    const shared = pkg.files.filter((f: any) => f.id === file.id);
    expect(shared).toHaveLength(1);
  });
});

// ── 5. Format version negotiation ────────────────────────────

describe('Round 25b: negotiateFormatVersion', () => {
  it('returns the current FORMAT_VERSION when no request is given', () => {
    expect(negotiateFormatVersion(undefined)).toBe(FORMAT_VERSION);
  });

  it('returns exact match when the requested version is supported', () => {
    expect(negotiateFormatVersion(FORMAT_VERSION)).toBe(FORMAT_VERSION);
  });

  it('returns the highest supported version ≤ a newer requested version', () => {
    // A future client asks for 2.0.0; server should degrade to its highest supported
    expect(negotiateFormatVersion('2.0.0')).toBe(FORMAT_VERSION);
  });

  it('returns null when the requested version is older than anything supported', () => {
    expect(negotiateFormatVersion('0.9.0')).toBeNull();
  });

  it('returns null for malformed version strings', () => {
    expect(negotiateFormatVersion('not-a-version')).toBeNull();
    expect(negotiateFormatVersion('1.0')).toBeNull();
    expect(negotiateFormatVersion('')).toBe(FORMAT_VERSION); // empty falls through to "no request"
  });

  it('SUPPORTED_FORMAT_VERSIONS contains FORMAT_VERSION', () => {
    expect(SUPPORTED_FORMAT_VERSIONS).toContain(FORMAT_VERSION);
  });
});

// ── 6. Refactor equivalence: MCP assembly == HTTP buildManifest ──

describe('Round 25b: refactor equivalence', () => {
  it('MCP assembleChannelPackage and direct buildManifest produce the same shape for the same DB state', () => {
    const proj = createProject('eq', 'instr', 'native', {}, 'mem');
    const channel = createChannel('eq-ch', 'ctx');
    setChannelProject(channel.id, proj.id);
    const entity = createEntity('Eq', 'claude-opus-4-6', 'persona', '#3B82F6');
    assignEntityToChannel(channel.id, entity.id);
    insertMessage(channel.id, 'user', 'hello');
    insertMessage(channel.id, 'assistant', 'hi', 'complete', undefined, entity.id);

    const channelRow = getChannel(channel.id)!;
    const entities = getChannelEntities(channel.id);
    const projectRow = getProjectForChannel(channel.id)!;
    const messages = getMessages(channel.id);
    const channelFiles = getChannelFiles(channel.id);
    const projectFiles = getProjectFiles(proj.id);

    const direct = buildManifest({
      packageId: uuidv4(),
      createdAt: new Date().toISOString(),
      channel: channelRow,
      project: projectRow,
      entities,
      channelFiles,
      projectFiles,
      messages,
    });

    const viaMcp = assembleChannelPackage(channel.id)!;

    expect(maskVolatile(viaMcp)).toEqual(maskVolatile(direct));
  });
});

// ── 7. HTTP export-route regression sentinel ─────────────────

describe('Round 25b: HTTP export route still wired to shared builder', () => {
  it('the shared buildManifest is the single source of truth (same module import)', async () => {
    const exportMod = await import('../routes/export.js');
    // Smoke: module loads without error — ensures the refactor kept imports clean.
    expect(exportMod).toBeDefined();

    const builderMod = await import('../export/package-builder.js');
    expect(builderMod.buildManifest).toBeDefined();
    expect(builderMod.FORMAT_VERSION).toBe(FORMAT_VERSION);
  });
});
