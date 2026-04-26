/**
 * Round 27b: Phase 5c-i MCP write-path + prompt — extended coverage (Argus)
 *
 * Complements Round 27 (Daedalus's initial unit coverage of the new schema
 * fields, server construction smoke, removeReflectionsWhere helper, and the
 * URL-decode contract documentation). Exit-criteria coverage for the 5c-i →
 * 1.0 gate:
 *
 *   1. Protocol integration over InMemoryTransport for the `reflect` tool —
 *      happy path plus the four error paths (unknown channel, unknown entity,
 *      entity-not-in-channel, default type fallback).
 *   2. Write-path persistence — reflect tool call followed by an entity
 *      resource read shows the observation in field_notes (round-trip end to
 *      end through the protocol layer).
 *   3. Channel-boundary isolation — a reflection appended to entity X on
 *      channel A does not leak into entity Y, even when Y is also on
 *      channel A. Membership boundary check.
 *   4. Membership check enforced + DB unchanged — when a `reflect` call is
 *      rejected for membership, the rejected entity's reflections array is
 *      unchanged afterward.
 *   5. `kit_briefing` prompt — native, claude-code, and claude-ai sources
 *      each produce their expected preamble shape; unknown channel returns a
 *      "not found" surface (no isError envelope on prompts).
 *   6. URL-decode applied across all 4 ResourceTemplate handlers (channel,
 *      channel/manifest, project, entity) — non-UUID id with %20 round-trips.
 *   7. ingress parity end-to-end — write via simulated klatch-ui path
 *      (appendReflection ingress='klatch-ui') and via MCP `reflect` tool
 *      (ingress='mcp'); both ingress values are preserved in
 *      getEntityReflections; both observations appear in manifest field_notes
 *      even though current manifest projection is lossy on the ingress field.
 *   8. Refactor equivalence — the new shared `assembleChannelManifest` helper
 *      and the existing MCP `assembleChannelPackage` produce structurally
 *      identical manifests for the same DB state (volatile fields masked).
 *   9. Tools/prompts surface — `reflect` enumerates in tools/list and
 *      `kit_briefing` enumerates in prompts/list with the expected schema.
 *
 * Non-goals (out of 5c-i scope): auto-reflect (5c-ii), HTTP transport (5d),
 * LLM-orchestrated briefing/extraction generation paths.
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
  appendReflection,
  getEntityReflections,
  getChannel,
  getChannelEntities,
  getProjectForChannel,
  getMessages,
  getChannelFiles,
  getProjectFiles,
} from '../db/queries.js';
import { createKlatchMcpServer, _internal } from '../mcp/server.js';
import { assembleChannelManifest } from '../export/assemble.js';
import { buildManifest, FORMAT_VERSION } from '../export/package-builder.js';
import { getDb } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type { MicroReflection } from '@klatch/shared';

const { assembleChannelPackage } = _internal;

// ── Helpers ──────────────────────────────────────────────────

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

function parseToolText(result: any): any {
  return JSON.parse((result.content[0] as any).text as string);
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

/** Mask volatile fields so two manifests can be structurally compared. */
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

// ── 1. Protocol integration: reflect tool ────────────────────

describe('Round 27b: reflect tool over InMemoryTransport', () => {
  it('happy path — appends reflection with ingress="mcp" and default type "observation"', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('Sage', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('reflect-happy', 'x');
      assignEntityToChannel(ch.id, entity.id);

      const result = await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: entity.id,
          note: 'User confirmed roundtable mode worked best for design review.',
        },
      });
      expect((result as any).isError).toBeFalsy();
      const parsed = parseToolText(result);
      expect(parsed.ok).toBe(true);
      expect(parsed.appended.ingress).toBe('mcp');
      expect(parsed.appended.type).toBe('observation');
      expect(parsed.appended.channelId).toBe(ch.id);

      const stored = getEntityReflections(entity.id);
      const last = stored[stored.length - 1];
      expect(last.observation).toContain('roundtable');
      expect(last.ingress).toBe('mcp');
      expect(last.type).toBe('observation');
    } finally {
      await close();
    }
  });

  it('explicit type ("correction") is preserved through the tool boundary', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('Corrector', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('reflect-corr', 'x');
      assignEntityToChannel(ch.id, entity.id);

      const result = await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: entity.id,
          note: 'Stop summarizing every response.',
          type: 'correction',
        },
      });
      expect((result as any).isError).toBeFalsy();
      const stored = getEntityReflections(entity.id);
      expect(stored[stored.length - 1].type).toBe('correction');
    } finally {
      await close();
    }
  });

  it('unknown channel returns isError envelope with a clear message', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('Lonely', 'claude-opus-4-6', 'p', '#3B82F6');
      const result = await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: 'no-such-channel',
          entity_id: entity.id,
          note: 'irrelevant',
        },
      });
      expect((result as any).isError).toBe(true);
      const text = (result.content[0] as any).text as string;
      expect(text).toMatch(/channel not found/i);
      expect(text).toContain('no-such-channel');
    } finally {
      await close();
    }
  });

  it('unknown entity returns isError envelope', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('exists-no-ent', 'x');
      const result = await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: 'no-such-entity',
          note: 'irrelevant',
        },
      });
      expect((result as any).isError).toBe(true);
      const text = (result.content[0] as any).text as string;
      expect(text).toMatch(/entity not found/i);
    } finally {
      await close();
    }
  });

  it('entity not assigned to channel returns isError envelope (membership check)', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('Outsider', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('private-club', 'x');
      // Note: no assignEntityToChannel — entity exists but is not on this channel.

      const result = await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: entity.id,
          note: 'should not land',
        },
      });
      expect((result as any).isError).toBe(true);
      const text = (result.content[0] as any).text as string;
      expect(text).toMatch(/not assigned to channel/i);
      expect(text).toContain(entity.id);
      expect(text).toContain(ch.id);
    } finally {
      await close();
    }
  });
});

// ── 2. Write-path persistence: round-trip via resource read ──

describe('Round 27b: reflect → resource read round-trip', () => {
  it('after reflect, the entity resource shows the observation in field_notes', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('Witness', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('observed', 'x');
      assignEntityToChannel(ch.id, entity.id);
      insertMessage(ch.id, 'user', 'hello');

      await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: entity.id,
          note: 'User opens with greetings before getting to the point.',
        },
      });

      // Read back via the channel resource — entity field_notes should
      // include the new observation.
      const res = await client.readResource({ uri: `klatch://channels/${ch.id}` });
      const parsed = JSON.parse((res.contents[0] as any).text as string);
      const witness = parsed.entities.find((e: any) => e.id === entity.id);
      expect(witness).toBeDefined();
      expect(witness.field_notes).not.toBeNull();
      expect(
        witness.field_notes.some((n: any) =>
          n.observation.includes('opens with greetings'),
        ),
      ).toBe(true);
    } finally {
      await close();
    }
  });

  it('after reflect, the standalone entity resource also shows the observation', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('Solo', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('solo-ch', 'x');
      assignEntityToChannel(ch.id, entity.id);

      await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: entity.id,
          note: 'A standalone observation.',
        },
      });

      const res = await client.readResource({ uri: `klatch://entities/${entity.id}` });
      const parsed = JSON.parse((res.contents[0] as any).text as string);
      // Reflections are projected into entity.field_notes via mergeFieldNotes
      // (assembleEntityPackage in mcp/server.ts:215-235).
      const obs = (parsed.entity.field_notes ?? []).map((r: any) => r.observation);
      expect(obs.some((o: string) => o.includes('standalone observation'))).toBe(true);
    } finally {
      await close();
    }
  });
});

// ── 3. Channel-boundary isolation ────────────────────────────

describe('Round 27b: write-path scope isolation', () => {
  it('reflect on entity X does not write to entity Y on the same channel', async () => {
    const { client, close } = await connectClient();
    try {
      const x = createEntity('X', 'claude-opus-4-6', 'p', '#3B82F6');
      const y = createEntity('Y', 'claude-opus-4-6', 'p', '#10B981');
      const ch = createChannel('co-channel', 'x');
      assignEntityToChannel(ch.id, x.id);
      assignEntityToChannel(ch.id, y.id);

      const yBefore = getEntityReflections(y.id).length;

      await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: x.id,
          note: 'For X only.',
        },
      });

      const xAfter = getEntityReflections(x.id);
      const yAfter = getEntityReflections(y.id);
      expect(xAfter[xAfter.length - 1].observation).toBe('For X only.');
      expect(yAfter.length).toBe(yBefore);
    } finally {
      await close();
    }
  });

  it('membership-rejected reflect leaves the target entity reflections unchanged', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('NotMember', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('walled-off', 'x');
      // Entity exists but is not assigned to this channel.

      // Pre-populate one legitimate reflection on a different channel so we can
      // distinguish "no reflections at all" from "no new reflections written".
      const otherCh = createChannel('home', 'x');
      assignEntityToChannel(otherCh.id, entity.id);
      appendReflection(entity.id, {
        observation: 'pre-existing',
        createdAt: new Date().toISOString(),
        channelId: otherCh.id,
        type: 'observation',
        ingress: 'klatch-ui',
      });
      const before = getEntityReflections(entity.id);

      const result = await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: entity.id,
          note: 'should not land',
        },
      });
      expect((result as any).isError).toBe(true);

      const after = getEntityReflections(entity.id);
      expect(after).toEqual(before);
    } finally {
      await close();
    }
  });
});

// ── 4. kit_briefing prompt ───────────────────────────────────

describe('Round 27b: kit_briefing prompt', () => {
  it('lists in prompts/list with channel_id argument', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.listPrompts();
      const kb = result.prompts.find((p) => p.name === 'kit_briefing');
      expect(kb).toBeDefined();
      const argNames = (kb?.arguments ?? []).map((a) => a.name);
      expect(argNames).toContain('channel_id');
    } finally {
      await close();
    }
  });

  it('native channel returns a Klatch-origin preamble naming the channel', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('native-ch', 'x');
      const result = await client.getPrompt({
        name: 'kit_briefing',
        arguments: { channel_id: ch.id },
      });
      expect(result.messages).toHaveLength(1);
      const text = (result.messages[0].content as any).text as string;
      expect(text).toContain('native-ch');
      expect(text).toMatch(/originated in Klatch/i);
    } finally {
      await close();
    }
  });

  it('claude-code imported channel returns the imported-orientation briefing', async () => {
    const { client, close } = await connectClient();
    try {
      const chId = insertImportedChannel('imported-cc', 'claude-code', {
        cwd: '/Users/xian/projects/x',
        originalSessionId: 'sess-abc',
      });
      const result = await client.getPrompt({
        name: 'kit_briefing',
        arguments: { channel_id: chId },
      });
      const text = (result.messages[0].content as any).text as string;
      // The imported preamble path uses buildKitBriefing; we don't pin the
      // exact wording (that's a separate kit-briefing test surface) but we
      // verify it diverges from the native preamble — i.e., it does not say
      // "originated in Klatch".
      expect(text).not.toMatch(/originated in Klatch/i);
      expect(text.length).toBeGreaterThan(20);
    } finally {
      await close();
    }
  });

  it('claude-ai imported channel returns the imported-orientation briefing', async () => {
    const { client, close } = await connectClient();
    try {
      const chId = insertImportedChannel('imported-ai', 'claude-ai', {
        importedAt: '2026-04-01T00:00:00.000Z',
      });
      const result = await client.getPrompt({
        name: 'kit_briefing',
        arguments: { channel_id: chId },
      });
      const text = (result.messages[0].content as any).text as string;
      expect(text).not.toMatch(/originated in Klatch/i);
      expect(text.length).toBeGreaterThan(20);
    } finally {
      await close();
    }
  });

  it('unknown channel surfaces a "not found" message (no isError on prompts)', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.getPrompt({
        name: 'kit_briefing',
        arguments: { channel_id: 'does-not-exist' },
      });
      // Prompts have no isError envelope; the server returns a user message
      // describing the failure.
      expect(result.messages).toHaveLength(1);
      const text = (result.messages[0].content as any).text as string;
      expect(text).toMatch(/channel not found/i);
      expect(text).toContain('does-not-exist');
    } finally {
      await close();
    }
  });
});

// ── 5. URL-decode applied across all 4 ResourceTemplate handlers ──

describe('Round 27b: URL-decode parameterized across all 4 templates', () => {
  it('channel template decodes %20 → space before lookup', async () => {
    const { client, close } = await connectClient();
    try {
      const rawId = 'ch with space';
      getDb()
        .prepare(
          `INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .run(rawId, 'spaced', '', 'claude-opus-4-6', 'panel', 'chat');
      getDb()
        .prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
        .run(rawId, 'default-entity');

      const res = await client.readResource({
        uri: `klatch://channels/${encodeURIComponent(rawId)}`,
      });
      const parsed = JSON.parse((res.contents[0] as any).text as string);
      expect(parsed.conversation_context.id).toBe(rawId);
    } finally {
      await close();
    }
  });

  it('channel/manifest template decodes %20 → space before lookup', async () => {
    const { client, close } = await connectClient();
    try {
      const rawId = 'mani with space';
      getDb()
        .prepare(
          `INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .run(rawId, 'spaced-mani', '', 'claude-opus-4-6', 'panel', 'chat');
      getDb()
        .prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
        .run(rawId, 'default-entity');

      const res = await client.readResource({
        uri: `klatch://channels/${encodeURIComponent(rawId)}/manifest`,
      });
      const parsed = JSON.parse((res.contents[0] as any).text as string);
      expect(parsed.conversation_context.id).toBe(rawId);
    } finally {
      await close();
    }
  });

  it('project template decodes %20 → space before lookup', async () => {
    const { client, close } = await connectClient();
    try {
      const rawId = 'proj with space';
      getDb()
        .prepare(
          `INSERT INTO projects (id, name, instructions, source, source_metadata, memory, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .run(rawId, 'spaced-proj', 'instr', 'native', '{}', 'mem');

      const res = await client.readResource({
        uri: `klatch://projects/${encodeURIComponent(rawId)}`,
      });
      // Project package shape: id appears under project.id
      const parsed = JSON.parse((res.contents[0] as any).text as string);
      expect(parsed.project.id).toBe(rawId);
    } finally {
      await close();
    }
  });

  it('entity template decodes %20 → space before lookup', async () => {
    const { client, close } = await connectClient();
    try {
      const rawId = 'ent with space';
      getDb()
        .prepare(
          `INSERT INTO entities (id, name, model, system_prompt, color, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        )
        .run(rawId, 'spaced-ent', 'claude-opus-4-6', 'p', '#3B82F6');

      const res = await client.readResource({
        uri: `klatch://entities/${encodeURIComponent(rawId)}`,
      });
      const parsed = JSON.parse((res.contents[0] as any).text as string);
      expect(parsed.entity.id).toBe(rawId);
    } finally {
      await close();
    }
  });
});

// ── 6. ingress parity end-to-end ─────────────────────────────

describe('Round 27b: ingress parity across write paths', () => {
  it('klatch-ui and mcp ingress values both round-trip through getEntityReflections', async () => {
    const { client, close } = await connectClient();
    try {
      const entity = createEntity('DualWrite', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('dual', 'x');
      assignEntityToChannel(ch.id, entity.id);

      // Simulate the HTTP /reflect path (LLM-backed in production; here we
      // call appendReflection directly, which is what that route does on
      // success — see routes/export.ts:262-269).
      appendReflection(entity.id, {
        observation: 'from-klatch-ui',
        createdAt: new Date().toISOString(),
        channelId: ch.id,
        type: 'session-end',
        ingress: 'klatch-ui',
      });

      // Write via the MCP reflect tool — stamps ingress='mcp'.
      await client.callTool({
        name: 'reflect',
        arguments: {
          channel_id: ch.id,
          entity_id: entity.id,
          note: 'from-mcp',
        },
      });

      const stored = getEntityReflections(entity.id);
      const byObservation = new Map(stored.map((r) => [r.observation, r]));
      expect(byObservation.get('from-klatch-ui')?.ingress).toBe('klatch-ui');
      expect(byObservation.get('from-mcp')?.ingress).toBe('mcp');
    } finally {
      await close();
    }
  });

  it('both observations appear in manifest field_notes regardless of ingress', async () => {
    // Documents that the current manifest projection (mergeFieldNotes in
    // package-builder.ts) does NOT carry ingress through to the export shape;
    // it categorizes by `type` (correction → course-corrections, else →
    // patterns). This test pins behavior: observations from both write paths
    // are visible to consumers, even though ingress is intentionally elided
    // from the field_notes payload. If a future iteration of the export
    // schema chooses to surface ingress, update this test's assertion.
    const entity = createEntity('Both', 'claude-opus-4-6', 'p', '#3B82F6');
    const ch = createChannel('both', 'x');
    assignEntityToChannel(ch.id, entity.id);
    insertMessage(ch.id, 'user', 'hello');

    appendReflection(entity.id, {
      observation: 'klatch-ui-side',
      createdAt: new Date().toISOString(),
      channelId: ch.id,
      type: 'session-end',
      ingress: 'klatch-ui',
    });
    appendReflection(entity.id, {
      observation: 'mcp-side',
      createdAt: new Date().toISOString(),
      channelId: ch.id,
      type: 'observation',
      ingress: 'mcp',
    });

    const pkg = assembleChannelPackage(ch.id);
    const target = pkg.entities.find((e: any) => e.id === entity.id);
    const observations = (target.field_notes ?? []).map((n: any) => n.observation);
    expect(observations).toContain('klatch-ui-side');
    expect(observations).toContain('mcp-side');
    // Confirm the documented projection: ingress is not surfaced in the
    // exported field_notes payload (intentional elision; this is a spec
    // assertion, not a regression).
    for (const note of target.field_notes) {
      expect(Object.keys(note)).not.toContain('ingress');
    }
  });
});

// ── 7. Refactor equivalence: assembleChannelManifest ↔ MCP ──

describe('Round 27b: assembleChannelManifest ↔ MCP assembleChannelPackage', () => {
  it('the new shared helper and the MCP synchronous assembler agree on the same DB state', async () => {
    const proj = createProject('shared-eq', 'instr', 'native', {}, 'mem');
    const ch = createChannel('shared-eq-ch', 'ctx');
    setChannelProject(ch.id, proj.id);
    const entity = createEntity('Shared', 'claude-opus-4-6', 'persona', '#3B82F6');
    assignEntityToChannel(ch.id, entity.id);
    insertMessage(ch.id, 'user', 'hi');
    insertMessage(ch.id, 'assistant', 'hello', 'complete', undefined, entity.id);

    // No briefing/extraction options — should structurally match MCP path.
    const assembled = await assembleChannelManifest(ch.id, {});
    expect(assembled).not.toBeNull();
    const viaShared = assembled!.manifest;
    const viaMcp = assembleChannelPackage(ch.id)!;

    expect(maskVolatile(viaShared)).toEqual(maskVolatile(viaMcp));
  });

  it('assembleChannelManifest returns null for unknown channel (matching MCP semantics)', async () => {
    const result = await assembleChannelManifest('does-not-exist', {});
    expect(result).toBeNull();
  });

  it('assembleChannelManifest result includes the loaded entities/files/messages alongside manifest', async () => {
    const ch = createChannel('loaded-bundle', 'x');
    const entity = createEntity('Loaded', 'claude-opus-4-6', 'p', '#3B82F6');
    assignEntityToChannel(ch.id, entity.id);
    insertMessage(ch.id, 'user', 'hi');

    const assembled = await assembleChannelManifest(ch.id, {});
    expect(assembled).not.toBeNull();
    expect(assembled!.channel.id).toBe(ch.id);
    expect(assembled!.entities.some((e) => e.id === entity.id)).toBe(true);
    expect(assembled!.messages.length).toBe(1);
    // Direct buildManifest path produces the same manifest body when given
    // the same loaded entities — sanity check that the helper is wiring
    // through, not transforming.
    const direct = buildManifest({
      packageId: uuidv4(),
      createdAt: new Date().toISOString(),
      channel: assembled!.channel,
      project: assembled!.project,
      entities: assembled!.entities,
      channelFiles: assembled!.channelFiles,
      projectFiles: assembled!.projectFiles,
      messages: assembled!.messages,
    });
    expect(maskVolatile(assembled!.manifest)).toEqual(maskVolatile(direct));
  });
});

// ── 8. Tools/prompts surface ─────────────────────────────────

describe('Round 27b: tools/prompts surface includes Phase 5c-i additions', () => {
  it('tools/list includes the reflect tool with required input fields', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.listTools();
      const reflect = result.tools.find((t) => t.name === 'reflect');
      expect(reflect).toBeDefined();
      const schema = reflect!.inputSchema as any;
      expect(schema.properties.channel_id).toBeDefined();
      expect(schema.properties.entity_id).toBeDefined();
      expect(schema.properties.note).toBeDefined();
      expect(schema.properties.type).toBeDefined();
      expect(schema.required).toEqual(expect.arrayContaining(['channel_id', 'entity_id', 'note']));
    } finally {
      await close();
    }
  });

  it('server capabilities include both prompts and tools', async () => {
    const { client, close } = await connectClient();
    try {
      const caps = client.getServerCapabilities();
      expect(caps?.tools).toBeDefined();
      expect(caps?.prompts).toBeDefined();
      expect(caps?.resources).toBeDefined();
    } finally {
      await close();
    }
  });
});

// ── 9. Sentinel: DB queries used by reflect path are wired ──

describe('Round 27b: DB query sentinels', () => {
  it('getEntityReflections + appendReflection round-trip without the MCP layer', () => {
    // Sanity guard against a future helper rename or signature change.
    const entity = createEntity('Sentinel', 'claude-opus-4-6', 'p', '#3B82F6');
    const ch = createChannel('sentinel-ch', 'x');
    assignEntityToChannel(ch.id, entity.id);
    const r: MicroReflection = {
      observation: 'sentinel',
      createdAt: new Date().toISOString(),
      channelId: ch.id,
      type: 'observation',
      ingress: 'mcp',
    };
    appendReflection(entity.id, r);
    expect(getEntityReflections(entity.id).at(-1)?.observation).toBe('sentinel');
  });

  it('getChannel/getChannelEntities/getProjectForChannel/getMessages/getChannelFiles/getProjectFiles all callable', () => {
    const proj = createProject('sentinel-p', 'i', 'native', {}, 'm');
    const ch = createChannel('sentinel-q', 'x');
    setChannelProject(ch.id, proj.id);
    const entity = createEntity('Sq', 'claude-opus-4-6', 'p', '#3B82F6');
    assignEntityToChannel(ch.id, entity.id);
    insertMessage(ch.id, 'user', 'hi');

    expect(getChannel(ch.id)?.id).toBe(ch.id);
    expect(getChannelEntities(ch.id).some((e) => e.id === entity.id)).toBe(true);
    expect(getProjectForChannel(ch.id)?.id).toBe(proj.id);
    expect(getMessages(ch.id).length).toBe(1);
    expect(Array.isArray(getChannelFiles(ch.id))).toBe(true);
    expect(Array.isArray(getProjectFiles(proj.id))).toBe(true);
  });
});
