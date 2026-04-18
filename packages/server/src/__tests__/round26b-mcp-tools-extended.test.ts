/**
 * Round 26b: Phase 5b MCP tools surface — extended coverage (Argus)
 *
 * Complements Round 26 (Daedalus's initial unit coverage). Exit-criteria
 * coverage for the 5b → 5c gate:
 *
 *   1. Protocol integration via InMemoryTransport — tools/list enumerates the
 *      three expected tools with valid JSON Schema; tools/call round-trips
 *      for each. (Equivalent to a stdio spawn without the process overhead;
 *      both transports sit on the same Protocol layer.)
 *   2. list_channels edge cases — empty DB (without the seed), no-match filter,
 *      limit=1 returns single page, pagination preserves ordering across slices.
 *   3. get_context_package with no LLM options is equivalent to the resource
 *      fetch (hermetic: no LLM mocking required because the helpers are guarded).
 *   4. get_context_package format_version negotiation — supported proceeds;
 *      unsupported returns { isError: true } with a clear message.
 *   5. get_manifest ≡ klatch://channels/{id}/manifest resource (byte-identical
 *      after masking volatile fields).
 *   6. isError envelope on all three tools for unknown channel IDs (no throws).
 *   7. Cross-producer tool-name literal — the tool is registered as exactly
 *      `get_context_package` (per PM Architect alignment, 2026-04-18).
 *
 * Non-goals (out of 5b scope): reflect write-path (5c), kit_briefing prompt
 * (5c), HTTP transport (5d, deferred past 1.0).
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createChannel,
  createEntity,
  assignEntityToChannel,
  insertMessage,
} from '../db/queries.js';
import { createKlatchMcpServer } from '../mcp/server.js';
import { FORMAT_VERSION } from '../export/package-builder.js';
import { getDb } from '../db/index.js';

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
  const text = (result.content[0] as any).text as string;
  return JSON.parse(text);
}

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

// ── 1. Protocol integration via InMemoryTransport ────────────

describe('Round 26b: tools/list', () => {
  it('enumerates the three tools with required schemas', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain('list_channels');
      expect(names).toContain('get_context_package');
      expect(names).toContain('get_manifest');

      const gcp = result.tools.find((t) => t.name === 'get_context_package')!;
      expect(gcp.inputSchema).toBeDefined();
      expect(gcp.inputSchema.type).toBe('object');
      expect((gcp.inputSchema as any).properties).toHaveProperty('channel_id');

      const gm = result.tools.find((t) => t.name === 'get_manifest')!;
      expect((gm.inputSchema as any).properties).toHaveProperty('channel_id');
      // channel_id is required
      const required = (gm.inputSchema as any).required as string[] | undefined;
      expect(required).toContain('channel_id');
    } finally {
      await close();
    }
  });

  it('advertises tools capability', async () => {
    const { client, close } = await connectClient();
    try {
      const caps = client.getServerCapabilities();
      expect(caps?.tools).toBeDefined();
      expect(caps?.resources).toBeDefined();
    } finally {
      await close();
    }
  });
});

// ── 2. list_channels edge cases ──────────────────────────────

describe('Round 26b: list_channels tool', () => {
  it('round-trips via callTool — default args return seeded channels', async () => {
    const { client, close } = await connectClient();
    try {
      createChannel('alpha', 'x');
      createChannel('beta', 'x');
      const result = await client.callTool({ name: 'list_channels', arguments: {} });
      const parsed = parseToolText(result);
      expect(parsed.format_version).toBe(FORMAT_VERSION);
      expect(parsed.total).toBeGreaterThanOrEqual(2);
      expect(parsed.returned).toBe(parsed.channels.length);
      expect(parsed.channels.some((c: any) => c.name === 'alpha')).toBe(true);
    } finally {
      await close();
    }
  });

  it('empty DB (after removing seed channel) returns total=0', async () => {
    const { client, close } = await connectClient();
    try {
      // Strip the seed default channel to exercise the zero-row path.
      getDb().prepare('DELETE FROM channel_entities WHERE channel_id = ?').run('default');
      getDb().prepare('DELETE FROM channels WHERE id = ?').run('default');
      const result = await client.callTool({ name: 'list_channels', arguments: {} });
      const parsed = parseToolText(result);
      expect(parsed.total).toBe(0);
      expect(parsed.returned).toBe(0);
      expect(parsed.channels).toEqual([]);
    } finally {
      await close();
    }
  });

  it('filter with no matches returns total=0, returned=0', async () => {
    const { client, close } = await connectClient();
    try {
      createChannel('alpha', 'x');
      const result = await client.callTool({
        name: 'list_channels',
        arguments: { filter: 'zzz-no-such-channel' },
      });
      const parsed = parseToolText(result);
      expect(parsed.total).toBe(0);
      expect(parsed.returned).toBe(0);
      expect(parsed.channels).toEqual([]);
    } finally {
      await close();
    }
  });

  it('limit=1 returns a single channel', async () => {
    const { client, close } = await connectClient();
    try {
      createChannel('a', 'x');
      createChannel('b', 'x');
      const result = await client.callTool({
        name: 'list_channels',
        arguments: { limit: 1, offset: 0 },
      });
      const parsed = parseToolText(result);
      expect(parsed.returned).toBe(1);
      expect(parsed.channels).toHaveLength(1);
      expect(parsed.limit).toBe(1);
      expect(parsed.offset).toBe(0);
    } finally {
      await close();
    }
  });

  it('pagination preserves ordering across sliced calls', async () => {
    const { client, close } = await connectClient();
    try {
      createChannel('a', 'x');
      createChannel('b', 'x');
      createChannel('c', 'x');
      const full = await client.callTool({ name: 'list_channels', arguments: {} });
      const fullParsed = parseToolText(full);
      const total = fullParsed.total;

      const page1 = parseToolText(
        await client.callTool({ name: 'list_channels', arguments: { limit: 2, offset: 0 } }),
      );
      const page2 = parseToolText(
        await client.callTool({ name: 'list_channels', arguments: { limit: 2, offset: 2 } }),
      );
      const recombined = [...page1.channels, ...page2.channels];
      expect(recombined.map((c: any) => c.id)).toEqual(
        fullParsed.channels.slice(0, total).map((c: any) => c.id),
      );
    } finally {
      await close();
    }
  });

  it('offset beyond total yields empty page with total still populated', async () => {
    const { client, close } = await connectClient();
    try {
      createChannel('only-one', 'x');
      const full = parseToolText(
        await client.callTool({ name: 'list_channels', arguments: {} }),
      );
      const beyond = parseToolText(
        await client.callTool({
          name: 'list_channels',
          arguments: { limit: 10, offset: 10000 },
        }),
      );
      expect(beyond.total).toBe(full.total);
      expect(beyond.returned).toBe(0);
      expect(beyond.channels).toEqual([]);
    } finally {
      await close();
    }
  });
});

// ── 3. get_context_package — no LLM options = resource equivalence ──

describe('Round 26b: get_context_package tool', () => {
  it('with no LLM options, output matches resource fetch (masked)', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('gcp-eq', 'ctx');
      const entity = createEntity('E', 'claude-opus-4-6', 'p', '#3B82F6');
      assignEntityToChannel(ch.id, entity.id);
      insertMessage(ch.id, 'user', 'hi');

      const fromTool = parseToolText(
        await client.callTool({ name: 'get_context_package', arguments: { channel_id: ch.id } }),
      );
      const fromResource = JSON.parse(
        (
          await client.readResource({ uri: `klatch://channels/${ch.id}` })
        ).contents[0].text as string,
      );
      expect(maskVolatile(fromTool)).toEqual(maskVolatile(fromResource));
    } finally {
      await close();
    }
  });

  it('unknown channel returns isError envelope, not a throw', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.callTool({
        name: 'get_context_package',
        arguments: { channel_id: 'does-not-exist' },
      });
      expect((result as any).isError).toBe(true);
      const text = (result.content[0] as any).text as string;
      expect(text).toMatch(/not found/i);
    } finally {
      await close();
    }
  });

  it('format_version on an unsupported version returns isError and does not build a package', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('fv-test', 'x');
      const result = await client.callTool({
        name: 'get_context_package',
        arguments: { channel_id: ch.id, format_version: '0.0.1' },
      });
      expect((result as any).isError).toBe(true);
      const text = (result.content[0] as any).text as string;
      expect(text).toMatch(/unsupported format_version/i);
      expect(text).toContain('0.0.1');
    } finally {
      await close();
    }
  });

  it('format_version on a supported version proceeds', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('fv-ok', 'x');
      const result = await client.callTool({
        name: 'get_context_package',
        arguments: { channel_id: ch.id, format_version: FORMAT_VERSION },
      });
      expect((result as any).isError).toBeFalsy();
      const parsed = parseToolText(result);
      expect(parsed.conversation_context.id).toBe(ch.id);
    } finally {
      await close();
    }
  });

  it('format_version garbage input returns isError with clear message', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('fv-garbage', 'x');
      const result = await client.callTool({
        name: 'get_context_package',
        arguments: { channel_id: ch.id, format_version: 'not-a-version' },
      });
      expect((result as any).isError).toBe(true);
    } finally {
      await close();
    }
  });
});

// ── 4. get_manifest tool ─────────────────────────────────────

describe('Round 26b: get_manifest tool', () => {
  it('returns the same payload shape as klatch://channels/{id}/manifest', async () => {
    const { client, close } = await connectClient();
    try {
      const ch = createChannel('gm-eq', 'x');
      insertMessage(ch.id, 'user', 'hi');

      const fromTool = parseToolText(
        await client.callTool({ name: 'get_manifest', arguments: { channel_id: ch.id } }),
      );
      const fromResource = JSON.parse(
        (
          await client.readResource({ uri: `klatch://channels/${ch.id}/manifest` })
        ).contents[0].text as string,
      );
      expect(maskVolatile(fromTool)).toEqual(maskVolatile(fromResource));
    } finally {
      await close();
    }
  });

  it('unknown channel returns isError envelope, not a throw', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.callTool({
        name: 'get_manifest',
        arguments: { channel_id: 'nope' },
      });
      expect((result as any).isError).toBe(true);
      const text = (result.content[0] as any).text as string;
      expect(text).toMatch(/not found/i);
    } finally {
      await close();
    }
  });
});

// ── 5. list_channels: unknown channel irrelevant; assert isError not thrown on bad args ──

describe('Round 26b: tool input validation', () => {
  it('list_channels rejects invalid type enum with isError envelope', async () => {
    const { client, close } = await connectClient();
    try {
      // Zod-backed schema validation failures surface via the MCP isError envelope,
      // not as a thrown JSON-RPC error — consistent with MCP idiom for tool calls.
      const result = await client.callTool({
        name: 'list_channels',
        arguments: { type: 'bogus' } as any,
      });
      expect((result as any).isError).toBe(true);
    } finally {
      await close();
    }
  });

  it('get_context_package rejects missing required channel_id with isError envelope', async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.callTool({
        name: 'get_context_package',
        arguments: {} as any,
      });
      expect((result as any).isError).toBe(true);
      const text = (result.content[0] as any).text as string;
      expect(text).toMatch(/channel_id/i);
    } finally {
      await close();
    }
  });
});

// ── 6. Cross-producer tool-name literal ──────────────────────

describe('Round 26b: cross-producer tool naming', () => {
  it('the rich context tool is registered as exactly get_context_package', async () => {
    // Per PM Chief Architect memo 2026-04-18: multi-producer clients expect the
    // shared name. Any rename would break that alignment — so we pin it.
    const { client, close } = await connectClient();
    try {
      const result = await client.listTools();
      const names = result.tools.map((t) => t.name);
      expect(names).toContain('get_context_package');
      // And not some near-miss
      expect(names).not.toContain('getContextPackage');
      expect(names).not.toContain('get-context-package');
    } finally {
      await close();
    }
  });
});
