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
- `ANTHROPIC_API_KEY` in `.env` at the project root **only if** you intend to
  call `get_context_package` with `include_briefing: true` or
  `include_extraction: true`. Both are LLM-backed and make one Anthropic API
  call per assigned entity. Read-only fetches without those flags need no key.

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

## Common workflows

The four primitives above compose into a handful of recurring shapes. Worth
internalizing these before invoking the API directly — the JSON-RPC examples
above are easier to read once the *why* is clear.

**Bootstrap a new conversation from a Klatch channel.** Call the
`kit_briefing` prompt with a `channel_id`. The returned text is what Klatch
itself injects as Layer 1 when running an imported conversation — it orients
a fresh agent to the source environment, the tooling boundary, and what's
about to be loaded. Drop it in as the new conversation's first system or
preamble message and follow with `get_context_package` for the substance.

**Survey before fetching.** The full context package can be heavy
(conversation history, files, briefings, extraction). When you don't yet
know which channel you want, call `list_channels` (cheap; metadata only) or
`klatch://channels/{id}/manifest` (cheap; structural overview without the
payload). Pull the full package only after you've identified the right
channel. The `/{id}/manifest` resource exists for exactly this peek.

**Annotate after a session.** After a meaningful exchange, call `reflect`
with a one-sentence observation that the entity wouldn't have noticed about
itself. The reflection is stamped `ingress: 'mcp'`, persists to the entity's
field notes, and surfaces in every subsequent context package fetch — the
mechanism by which Layer 5 (behavioral self-model) accumulates across
sessions and across protocol boundaries. The membership check (entity must
be assigned to the named channel) is a feature, not a bug — it keeps the
channel-as-context boundary meaningful.

**Pull an enriched package for handoff.** When the goal is to *transfer* a
conversation to another environment (claude.ai, Claude Code, another
Klatch-aware tool), call `get_context_package` with both
`include_briefing: true` and `include_extraction: true`. The first asks each
assigned entity to write what a future-self should know to continue
effectively; the second runs an external extraction pass to surface
patterns the entity wouldn't articulate about itself. Both are opt-in
because both cost API calls. The two passes intentionally use different
prompt framings — where they agree, the observation is high-confidence;
where they disagree, a human reviewer decides. See
[`AXT.md`](AXT.md) for why this dual-mode approach exists, and
[`STEP10-RETROSPECTIVE-CALLIOPE.md`](STEP10-RETROSPECTIVE-CALLIOPE.md) §
"Phase 3.5" for what we've learned about the gap between *delivered* and
*received* context.

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

## Security posture

Klatch's MCP server is **STDIO-based and runs as a child process spawned
by an MCP client** (Claude Desktop, Claude Code, etc.) under the same
local user. Two implications worth naming explicitly:

- **The MCP STDIO command-injection class (OX Security advisory,
  April–May 2026; multiple CVEs in the MCP SDK ecosystem) does not
  apply to Klatch.** Those CVEs affect MCP *clients* that take untrusted
  server-command strings and pass them to `subprocess.exec`. Klatch is
  the *server side* of the relationship — it is launched by clients,
  it never spawns MCP subprocesses. Transport choice is orthogonal
  to this exposure class.
- **No auth is intentional, not an oversight.** STDIO under the same
  local user means the MCP client has already passed the OS-level trust
  boundary by spawning the process. There is no remote attack surface
  to authenticate. If/when HTTP transport ships (Phase 5d, deferred),
  a real auth model arrives with it.

If you connect to Klatch via Claude Code or Claude Desktop and *also*
run other STDIO-based MCP servers on the same machine, those other
servers may have their own exposure to the OX class. That's a
client-configuration concern, not a Klatch concern.

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
- **Empty channel list despite a known-good `klatch.db`:** the MCP server
  resolves `klatch.db` relative to its own working directory, not yours.
  Most clients launch the child process with the client's cwd, not the
  repo's. Either (a) point the `command`/`args` at an absolute path that
  `cd`'s into the Klatch repo before invoking `tsx`, or (b) symlink your
  `klatch.db` into the cwd the client uses. The "run by hand" path above
  works because you're already in the repo root.
- **`include_briefing` / `include_extraction` returns an error:** missing
  `ANTHROPIC_API_KEY`. These options are LLM-backed and need the same key
  Klatch uses for `npm run dev`. Read-only fetches don't.

## What's next

- Phase 5c-ii (auto-reflect mode) lands when a concrete client wants to call
  `reflect` without supplying a note.
- Phase 5d (HTTP transport + auth) ships only when a real remote use case
  names itself. Candidates: remote Claude Code over SSH, Managed Agents
  pulling live context, PM BYOC runtime consumption.

For the broader story, see [`docs/plans/STEP-10-RETROSPECTIVE.md`](plans/STEP-10-RETROSPECTIVE.md)
(Daedalus's shipped-code close-out) and
[`docs/STEP10-RETROSPECTIVE-CALLIOPE.md`](STEP10-RETROSPECTIVE-CALLIOPE.md)
(design-discipline complement). The first MCP-ingressed reflection — the
artifact that proved the write-path round-trip — is preserved at
[`docs/firsts/2026-04-26-mcp-first-reflection.md`](firsts/2026-04-26-mcp-first-reflection.md).
For the methodology behind the dual-mode behavioral calibration that
`include_briefing` / `include_extraction` invoke, see
[`docs/AXT.md`](AXT.md). For the five-layer model that the canonical
package format encodes, see [`docs/PROMPT-ASSEMBLY.md`](PROMPT-ASSEMBLY.md).
