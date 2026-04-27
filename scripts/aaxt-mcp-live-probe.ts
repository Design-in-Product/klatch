#!/usr/bin/env tsx
/**
 * Live MCP probe — exercises Klatch's MCP server end-to-end via stdio.
 *
 * Spawns the actual MCP server subprocess (same way Claude Code/Desktop would),
 * connects via the official MCP TypeScript SDK over StdioClientTransport, and
 * exercises every primitive: resources, tools, prompts, write-path.
 *
 * Verifies real-world behavior beyond the InMemoryTransport unit tests
 * in rounds 25b/26b/27b. Run against the live klatch.db.
 *
 * Usage: npx tsx scripts/aaxt-mcp-live-probe.ts
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const serverEntry = path.join(repoRoot, 'packages/server/src/mcp/bin.ts');

// ── Output helpers ───────────────────────────────────────────

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passCount = 0;
let failCount = 0;
const findings: string[] = [];

function pass(label: string, detail?: string) {
  passCount++;
  console.log(`${GREEN}✓${RESET} ${label}${detail ? `  ${CYAN}${detail}${RESET}` : ''}`);
}

function fail(label: string, error: string) {
  failCount++;
  console.log(`${RED}✗${RESET} ${label}\n  ${RED}${error}${RESET}`);
  findings.push(`FAIL: ${label} — ${error}`);
}

function note(label: string) {
  console.log(`${YELLOW}!${RESET} ${label}`);
  findings.push(`NOTE: ${label}`);
}

function section(name: string) {
  console.log(`\n${BOLD}━━ ${name} ━━${RESET}`);
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(`${BOLD}Klatch MCP Live Probe${RESET}`);
  console.log(`Repo: ${repoRoot}`);
  console.log(`Server: ${serverEntry}`);

  // Spawn server via tsx
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', serverEntry],
    cwd: repoRoot,
  });

  const client = new Client({ name: 'aaxt-mcp-live-probe', version: '0.1.0' });

  try {
    section('Connection');
    await client.connect(transport);
    pass('client connected to MCP server over stdio');

    const info = client.getServerVersion();
    if (info?.name === 'klatch') {
      pass('server identifies as klatch', `version=${info.version}`);
    } else {
      fail('server identity', `expected name='klatch', got name='${info?.name}'`);
    }

    const caps = client.getServerCapabilities();
    if (caps?.resources) pass('server advertises resources capability');
    else fail('resources capability', 'missing');
    if (caps?.tools) pass('server advertises tools capability');
    else fail('tools capability', 'missing');
    if (caps?.prompts) pass('server advertises prompts capability');
    else fail('prompts capability', 'missing');

    // ── Resources ──
    section('Resources');

    const resources = await client.listResources();
    if (resources.resources.length > 0) {
      pass(`listResources returned ${resources.resources.length} resource(s)`,
           resources.resources.map((r) => r.uri).join(', '));
    } else {
      fail('listResources', 'empty resources list');
    }

    const templates = await client.listResourceTemplates();
    if (templates.resourceTemplates.length >= 4) {
      pass(`listResourceTemplates returned ${templates.resourceTemplates.length} template(s)`,
           templates.resourceTemplates.map((t) => t.uriTemplate).join(' | '));
    } else {
      fail('listResourceTemplates', `expected ≥4 templates, got ${templates.resourceTemplates.length}`);
    }

    // Read klatch://channels — the static channel list
    try {
      const channelsList = await client.readResource({ uri: 'klatch://channels' });
      const text = (channelsList.contents[0] as any).text;
      const parsed = JSON.parse(text);
      // Server wraps the list with format_version per design (forward-compat envelope)
      if (parsed.format_version && Array.isArray(parsed.channels)) {
        pass(`readResource klatch://channels returned ${parsed.channels.length} channel(s)`,
             `format_version=${parsed.format_version}`);
        const target = parsed.channels.find((c: any) => c.id !== 'default') || parsed.channels[0];
        if (target) {
          await testChannelResource(client, target.id, target.name);
          await testManifestResource(client, target.id);
        }
      } else {
        fail('channels list envelope', `expected {format_version, channels[]}, got: ${text.slice(0, 80)}`);
      }
    } catch (err) {
      fail('readResource klatch://channels', String(err));
    }

    // ── Tools ──
    section('Tools');

    const tools = await client.listTools();
    const toolNames = tools.tools.map((t) => t.name).sort();
    const expected = ['get_context_package', 'get_manifest', 'list_channels', 'reflect'];
    const missing = expected.filter((t) => !toolNames.includes(t));
    if (missing.length === 0) {
      pass(`all expected tools present`, toolNames.join(', '));
    } else {
      fail('tools list', `missing: ${missing.join(', ')}`);
    }

    await testListChannelsTool(client);
    const targetChannelId = await getFirstNonDefaultChannelId(client);
    if (targetChannelId) {
      await testGetManifestTool(client, targetChannelId);
      await testGetContextPackageTool(client, targetChannelId);
      await testReflectTool(client, targetChannelId);
    }

    // ── Prompts ──
    section('Prompts');

    const prompts = await client.listPrompts();
    if (prompts.prompts.find((p) => p.name === 'kit_briefing')) {
      pass('kit_briefing prompt registered');
    } else {
      fail('prompts list', 'kit_briefing missing');
    }

    if (targetChannelId) {
      await testKitBriefingPrompt(client, targetChannelId);
    }

    // ── Error handling ──
    section('Error handling');

    try {
      await client.readResource({ uri: 'klatch://channels/nonexistent-uuid' });
      fail('error on unknown channel', 'expected error envelope, got success');
    } catch (err) {
      pass('error on unknown channel resource', String(err).slice(0, 80));
    }

  } catch (err) {
    fail('top-level', String(err));
  } finally {
    await client.close();
  }

  // ── Summary ──
  console.log(`\n${BOLD}━━ Summary ━━${RESET}`);
  console.log(`${GREEN}${passCount} passed${RESET}, ${failCount > 0 ? RED : GREEN}${failCount} failed${RESET}`);
  if (findings.length > 0) {
    console.log(`\n${BOLD}Findings:${RESET}`);
    for (const f of findings) console.log(`  ${f}`);
  }
  process.exit(failCount > 0 ? 1 : 0);
}

// ── Test helpers ─────────────────────────────────────────────

async function getFirstNonDefaultChannelId(client: Client): Promise<string | null> {
  try {
    const result = await client.callTool({
      name: 'list_channels',
      arguments: { limit: 10 },
    });
    const text = (result.content as any[]).find((c) => c.type === 'text')?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    const channel = parsed.channels?.find((c: any) => c.id !== 'default');
    return channel?.id || null;
  } catch {
    return null;
  }
}

async function testChannelResource(client: Client, channelId: string, channelName: string) {
  try {
    const result = await client.readResource({ uri: `klatch://channels/${channelId}` });
    const text = (result.contents[0] as any).text;
    const pkg = JSON.parse(text);

    if (pkg.format_version) pass(`channel ${channelName.slice(0, 20)} → manifest with format_version=${pkg.format_version}`);
    else fail('manifest format_version', 'missing');

    if (pkg.source_type === 'klatch') pass('manifest source_type=klatch');
    else fail('manifest source_type', `got '${pkg.source_type}'`);

    if (Array.isArray(pkg.provenance) && pkg.provenance.length >= 1) {
      pass(`manifest provenance chain (${pkg.provenance.length} hop)`);
    } else {
      fail('manifest provenance', 'missing or empty');
    }

    if (pkg.conversation_context?.id === channelId) pass('conversation_context.id matches');
    else fail('conversation_context.id', `expected ${channelId}, got ${pkg.conversation_context?.id}`);

    if (Array.isArray(pkg.entities)) pass(`manifest entities (${pkg.entities.length})`);
    else fail('manifest entities', 'not an array');
  } catch (err) {
    fail(`readResource klatch://channels/${channelId}`, String(err));
  }
}

async function testManifestResource(client: Client, channelId: string) {
  try {
    const result = await client.readResource({ uri: `klatch://channels/${channelId}/manifest` });
    const text = (result.contents[0] as any).text;
    const pkg = JSON.parse(text);
    if (pkg.format_version) pass(`klatch://channels/{id}/manifest returned manifest`);
    else fail('manifest sub-resource', 'missing format_version');
  } catch (err) {
    fail(`readResource manifest sub-resource`, String(err));
  }
}

async function testListChannelsTool(client: Client) {
  try {
    const result = await client.callTool({ name: 'list_channels', arguments: {} });
    const text = (result.content as any[]).find((c) => c.type === 'text')?.text;
    const parsed = JSON.parse(text);
    if (typeof parsed.total === 'number' && Array.isArray(parsed.channels)) {
      pass(`list_channels tool returned total=${parsed.total}, returned=${parsed.returned}`);
    } else {
      fail('list_channels tool', 'unexpected response shape');
    }
  } catch (err) {
    fail('list_channels tool', String(err));
  }
}

async function testGetManifestTool(client: Client, channelId: string) {
  try {
    const result = await client.callTool({ name: 'get_manifest', arguments: { channel_id: channelId } });
    const text = (result.content as any[]).find((c) => c.type === 'text')?.text;
    const pkg = JSON.parse(text);
    if (pkg.format_version) pass('get_manifest tool returned manifest');
    else fail('get_manifest tool', 'missing format_version');
  } catch (err) {
    fail('get_manifest tool', String(err));
  }
}

async function testGetContextPackageTool(client: Client, channelId: string) {
  try {
    const result = await client.callTool({
      name: 'get_context_package',
      arguments: { channel_id: channelId },
    });
    if ((result as any).isError) {
      fail('get_context_package tool', `isError envelope: ${JSON.stringify(result.content)}`);
      return;
    }
    const text = (result.content as any[]).find((c) => c.type === 'text')?.text;
    const pkg = JSON.parse(text);
    if (pkg.format_version) pass('get_context_package tool (no LLM options) returned manifest');
    else fail('get_context_package tool', 'missing format_version');
  } catch (err) {
    fail('get_context_package tool', String(err));
  }

  // Test format_version negotiation:
  // - newer request (99.0.0) → graceful degrade to highest supported
  // - older request (0.9.0)  → isError (nothing to serve)
  try {
    const newer = await client.callTool({
      name: 'get_context_package',
      arguments: { channel_id: channelId, format_version: '99.0.0' },
    });
    if ((newer as any).isError) {
      fail('format_version=99.0.0', 'server returned isError; expected graceful degradation');
    } else {
      pass('format_version=99.0.0 → graceful degradation (server returns highest supported)');
    }

    const older = await client.callTool({
      name: 'get_context_package',
      arguments: { channel_id: channelId, format_version: '0.9.0' },
    });
    if ((older as any).isError) {
      pass('format_version=0.9.0 → isError (older than supported, correctly rejected)');
    } else {
      fail('format_version=0.9.0', 'server accepted version older than anything supported');
    }
  } catch (err) {
    fail('format_version negotiation', String(err).slice(0, 60));
  }
}

async function testReflectTool(client: Client, channelId: string) {
  // Find an entity assigned to this channel
  try {
    const channelResult = await client.readResource({ uri: `klatch://channels/${channelId}` });
    const pkg = JSON.parse((channelResult.contents[0] as any).text);
    const entity = pkg.entities?.[0];
    if (!entity) {
      note('reflect test skipped — no entities on target channel');
      return;
    }

    const result = await client.callTool({
      name: 'reflect',
      arguments: {
        channel_id: channelId,
        entity_id: entity.id,
        note: 'Live MCP probe test reflection — automated, can be removed.',
        type: 'observation',
      },
    });
    if ((result as any).isError) {
      fail('reflect tool', `isError envelope: ${JSON.stringify(result.content)}`);
      return;
    }
    const text = (result.content as any[]).find((c) => c.type === 'text')?.text;
    const parsed = JSON.parse(text);
    if (parsed.ok && parsed.appended) {
      pass('reflect tool wrote reflection', `ingress=${parsed.appended.ingress}`);
      if (parsed.appended.ingress === 'mcp') {
        pass('reflect ingress stamp = "mcp"');
      } else {
        fail('reflect ingress stamp', `expected 'mcp', got '${parsed.appended.ingress}'`);
      }
    } else {
      fail('reflect tool', 'response missing ok/appended');
    }

    // Test channel-membership enforcement
    const otherEntityResult = await client.callTool({
      name: 'reflect',
      arguments: {
        channel_id: channelId,
        entity_id: 'nonexistent-entity-id',
        note: 'Should fail',
      },
    });
    if ((otherEntityResult as any).isError) {
      pass('reflect rejects unknown entity');
    } else {
      fail('reflect should reject unknown entity', 'got success');
    }
  } catch (err) {
    fail('reflect tool', String(err));
  }
}

async function testKitBriefingPrompt(client: Client, channelId: string) {
  try {
    const result = await client.getPrompt({
      name: 'kit_briefing',
      arguments: { channel_id: channelId },
    });
    if (result.messages && result.messages.length > 0) {
      pass(`kit_briefing prompt returned ${result.messages.length} message(s)`);
      const text = (result.messages[0].content as any).text;
      if (text && text.length > 0) {
        pass(`kit_briefing content non-empty (${text.length} chars)`);
      } else {
        fail('kit_briefing content', 'empty');
      }
    } else {
      fail('kit_briefing prompt', 'no messages returned');
    }
  } catch (err) {
    fail('kit_briefing prompt', String(err));
  }
}

main().catch((err) => {
  console.error('Probe failed:', err);
  process.exit(1);
});
