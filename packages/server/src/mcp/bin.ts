#!/usr/bin/env node
/**
 * Klatch MCP server — stdio entry point (Phase 5a).
 *
 * Launched as a child process by an MCP client (Claude Code, Claude Desktop,
 * etc.), speaks JSON-RPC over stdin/stdout per the MCP spec.
 *
 * Configuration: clients point at this file's compiled JS output. See
 * docs/plans/STEP-10-PHASE-5-MCP-SERVER.md for client setup instructions
 * once those are written.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createKlatchMcpServer } from './server.js';

async function main() {
  const server = createKlatchMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio transport keeps the process alive until the client disconnects
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Klatch MCP server failed to start:', err);
  process.exit(1);
});
