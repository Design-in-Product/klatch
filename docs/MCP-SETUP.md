# Klatch MCP server — setup for beta users

Klatch ships an [MCP](https://modelcontextprotocol.io) server that exposes
your channels, projects, and entities as live, queryable context for any
MCP-capable client (Claude Code, Claude Desktop, agent bootstrap scripts,
etc.). This doc is the setup walkthrough.

> Status: beta. The server is feature-complete for 1.0 (read + write +
> prompt) over **stdio**. HTTP transport is deferred. There is no auth and
> no network surface — the client launches the server as a child process
> under the same user.

## What you get

Once configured, an MCP client can:

| Primitive | Surface | Use |
| --- | --- | --- |
| Resources | `klatch://channels`, `klatch://channels/{id}`, `klatch://channels/{id}/manifest`, `klatch://projects/{id}`, `klatch://entities/{id}` | Browse and read context packages directly |
| Tools | `list_channels`, `get_context_package`, `get_manifest`, `reflect` | Search/filter, fetch with options (briefing/extraction), or write a micro-reflection back |
| Prompts | `kit_briefing(channel_id)` | Bootstrap a new conversation with Klatch's reverse kit briefing |

Everything served is in the canonical Klatch [package format](plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md)
— same shape as the export zip, same shape any other Klatch consumer sees.

## Prerequisites

- A working Klatch install (`npm run dev` works in this repo)
- `klatch.db` at the project root with at least one channel + entity
- Node 20+ (matches the Klatch dev requirement)
- An MCP-capable client (examples below)

## Configuration

### Claude Desktop

Edit your `claude_desktop_config.json`. Location varies by OS:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add a `klatch` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "klatch": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/klatch/packages/server/src/mcp/bin.ts"
      ]
    }
  }
}
```

Restart Claude Desktop. The Klatch resources should appear in the
attachment menu.

### Claude Code

Add to your project's `.mcp.json` (or your user-level MCP config):

```json
{
  "mcpServers": {
    "klatch": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/klatch/packages/server/src/mcp/bin.ts"
      ]
    }
  }
}
```

Then in a Claude Code session: `/mcp` to inspect, or reference
`klatch://channels` directly.

### Run by hand (for testing / debugging)

From the Klatch repo root:

```bash
npm run mcp --workspace=@klatch/server
```

This launches the server on stdin/stdout. Useful when paired with a
JSON-RPC harness for protocol-level inspection.

## Example calls

Once a client is connected, here are the things to try first:

**List channels:**

```json
{ "method": "resources/list" }
```

…or via the tool:

```json
{ "method": "tools/call", "params": { "name": "list_channels", "arguments": {} } }
```

**Fetch a channel's full context package:**

```json
{ "method": "tools/call", "params": {
  "name": "get_context_package",
  "arguments": { "channel_id": "<channel-uuid>" }
}}
```

Add `"include_briefing": true` to generate self-authored handoff briefings
(LLM-backed; one API call per assigned entity). Add `"include_extraction": true`
for behavioral pattern extraction.

**Cheap manifest peek (no payload):**

```json
{ "method": "tools/call", "params": {
  "name": "get_manifest",
  "arguments": { "channel_id": "<channel-uuid>" }
}}
```

**Write a reflection back:**

```json
{ "method": "tools/call", "params": {
  "name": "reflect",
  "arguments": {
    "channel_id": "<channel-uuid>",
    "entity_id": "<entity-uuid>",
    "note": "User leans formal in opening turns; prefers terse confirmations after.",
    "type": "observation"
  }
}}
```

The reflection is stamped `ingress: 'mcp'` and persists to the entity's
field notes; future fetches of the channel package will surface it.

**Bootstrap a new conversation with Klatch's briefing:**

```json
{ "method": "prompts/get", "params": {
  "name": "kit_briefing",
  "arguments": { "channel_id": "<channel-uuid>" }
}}
```

For imported channels this returns the reverse kit briefing text used by
Klatch itself; for native channels it returns a brief preamble naming the
source.

## Format versioning

Every package carries a `format_version`. Clients that need a specific
version can request it via `get_context_package` `format_version` option;
the server returns the highest version ≤ request. The current format is
`1.0`. See `docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md` for the spec.

## Cross-producer interop

Klatch follows the cross-producer convention agreed with PM Architect on
2026-04-18:

- Scheme is producer-specific: Klatch uses `klatch://`, Piper Morgan uses
  `piper-morgan://`. A multi-producer client can route by scheme.
- Tool name `get_context_package` is shared across producers; producer-specific
  options stay producer-specific.
- `/{id}/manifest` is the agreed cheap-preview pattern across producers.

This means a future client can install both Klatch's and PM's MCP servers
side-by-side and walk both surfaces with the same code.

## Known limitations

- **stdio only.** No HTTP transport in 1.0. If you need to reach Klatch's MCP
  server from a non-local process, this isn't ready yet. (Phase 5d, deferred
  past 1.0 until a concrete driver appears.)
- **No auth.** stdio under the same user means none is needed; this is
  intentional, not an oversight. HTTP transport (whenever it ships) will
  introduce a real auth model.
- **`reflect` requires explicit `note`.** The auto-reflect mode (no `note`,
  LLM generates one) is Phase 5c-ii, deferred until a client wants it.
- **`reflect` enforces channel membership.** The named entity must be
  assigned to the named channel. This is a feature, not a bug — it keeps the
  channel-as-context boundary meaningful across protocol boundaries.
- **Binary file retrieval is by reference.** Files referenced in the package
  carry an ID; inline binary fetch via `resources/read` is a post-1.0
  question.

## Troubleshooting

- **"Cannot find module" / `tsx` not found:** run `npm install` at the
  repo root. The MCP entry uses `tsx` to run TypeScript directly.
- **Empty channel list:** confirm `klatch.db` exists at the repo root and
  has channels; run `npm run dev` and check the UI first.
- **`reflect` rejects with "entity not in channel":** assign the entity to
  the channel from the Klatch UI first. The membership check is by design.
- **Format version negotiation returns isError:** the requested version is
  newer than the server supports. Omit the option to get the highest
  available, or upgrade your Klatch install.

## What's next

- Phase 5c-ii (auto-reflect mode) lands when a concrete client wants to call
  `reflect` without supplying a note.
- Phase 5d (HTTP transport + auth) ships only when a real remote use case
  names itself. Candidates: remote Claude Code over SSH, Managed Agents
  pulling live context, PM BYOC runtime consumption.

For the broader story, see `docs/plans/STEP-10-RETROSPECTIVE.md`.
