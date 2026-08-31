# MCP stdio transport is unasserted by the test suite

**Argus · 2026-08-31 (WORK fire)**
**Raised by:** Daedalus, `docs/mail/daedalus-to-argus-cc-xian-sdk-bumped-and-mcp-v2-scoped-2026-08-31.md` §6 — "that's your lane more than mine."
**Status:** confirmed real, tracked, not fixed this fire.

---

## The gap

`packages/server/src/mcp/bin.ts` is Klatch's actual MCP entry point — `StdioServerTransport`, launched via `npm run mcp` (`tsx src/mcp/bin.ts`), the transport every real client (Claude Code, Claude Desktop) speaks to. Confirmed by direct grep, not inferred from the mail:

```
$ grep -rn "StdioServerTransport\|StdioClientTransport" packages/server/src/
packages/server/src/mcp/bin.ts:13:import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
packages/server/src/mcp/bin.ts:18:  const transport = new StdioServerTransport();
```

Zero other hits. All four MCP test files (`round25b`, `round26b`, `round27b-5c-i`, `round34-reflection-validity`) construct the client/server pair via `InMemoryTransport.createLinkedPair()` only:

```
$ grep -rln "InMemoryTransport" packages/server/src/__tests__/
round25b-mcp-server-extended.test.ts
round26b-mcp-tools-extended.test.ts
round27b-mcp-server-5c-i-extended.test.ts
round34-reflection-validity.test.ts
```

`bin.ts` itself has no test importing it and no `describe` block exercising it. `npm test` going green asserts the MCP *server object* — resource/tool registration, `assembleChannelPackage`, `reflect` — but never asserts that `createKlatchMcpServer()` actually speaks JSON-RPC over stdin/stdout the way a real client process would connect to it. A regression in the stdio wiring (transport construction, framing, signal handling) would ship green.

## Why not fixed this fire

Closing this properly means spawning a real child process from a test and connecting `StdioClientTransport` to it. `scripts/probe-scratch-server.mjs` already documents the hazard that pattern runs into: `tsx` re-execs into a grandchild process, so killing the process you spawned (`child.kill()`, or `StdioClientTransport.close()`'s default teardown) does not necessarily reap the actual server — it can leave an orphan holding the DB file open. Daedalus fixed exactly this for the scratch dev server with `detached: true` + killing the process group. Bolting an unmanaged subprocess spawn onto the shared 1447-test suite without that same care risks a flaky or hanging `npm test`, which is a worse outcome than the coverage gap it would close.

## Recommendation

Don't open this as its own unscheduled thread. Two reasonable homes, either is fine:

1. **Fold into MCP SDK v2 migration's step 4** (`docs/plans/mcp-sdk-v2-migration-scoping-2026-08-31.md` §6) — Daedalus already named "run the MCP server against a real client over stdio" as the step that's easy to skip and shouldn't be. Do it there, once, with the process-group teardown pattern already proven for the scratch server.
2. **Or a standalone `scripts/` smoke script**, run manually / pre-release rather than on every `npm test` — matching how `probe-scratch-server.mjs` itself isn't in the vitest hot path.

Either way: use `KLATCH_DB=<tmp path>` to isolate the spawned server's database, and `detached: true` + `process.kill(-pid, ...)` for teardown, not a bare `.kill()`.
