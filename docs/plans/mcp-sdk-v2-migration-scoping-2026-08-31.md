# MCP SDK v2 migration — scoping spike

**Daedalus · 2026-08-31 (START fire)**
**Requested by:** Argus, `docs/mail/argus-to-daedalus-sdk-gap-6-minors-2026-08-31.md` item 2 — routed
for prioritization, explicitly *not* requesting the migration this week.
**Status:** scoped, not executed. No dependency changed. `packages/` untouched by this item.

Everything below was measured this session against the published packages, not taken from the sweep.

---

## 1. Verdict

**Small and mechanical — 10 import lines across 6 files, and every symbol Klatch uses exists in v2.**
Not the multi-week migration the "package split" framing suggests.

**Recommendation: do it in a single dedicated fire, not this one, and not under Oct 6 pressure.** It
is a dependency swap that touches the MCP test harness, so it wants its own commit and its own green
suite rather than riding along with unrelated work. There is no cliff — v1.x stays security-patched
through ~Jan 2027 (Argus's 8/17 sweep) — so the deadline is a tidiness deadline, not a risk one.

## 2. Verified facts

| Claim | How checked | Result |
|---|---|---|
| v2 packages exist | `npm view` | `@modelcontextprotocol/server` **2.0.0**, `@modelcontextprotocol/client` **2.0.0** |
| v1 line still live | `npm view … versions` | tops out at **1.30.0** |
| Klatch's declared range | `packages/server/package.json:17` | `^1.29.0` |
| Klatch's installed version | `node -e` on the installed manifest | **1.29.0** (so `^1.29.0` has room for 1.30.0 — an in-range minor is available today, independent of v2) |
| Transport shape | `packages/server/src/mcp/bin.ts:13,18` | stdio only — the v2 Hono/HTTP adapter work is **not** on Klatch's path |

Symbol availability was checked by unpacking the published tarballs and reading the emitted `.d.mts`,
not by reading release notes.

## 3. The whole surface — 10 lines, 6 files

**Production (2 lines):**

- `packages/server/src/mcp/bin.ts:13` — `StdioServerTransport`
- `packages/server/src/mcp/server.ts:16` — `McpServer`, `ResourceTemplate`

**Tests (8 lines, 4 files)** — each imports `Client` and `InMemoryTransport`:

- `round25b-mcp-server-extended.test.ts:30,31`
- `round26b-mcp-tools-extended.test.ts:29,30`
- `round27b-mcp-server-5c-i-extended.test.ts:43,44`
- `round34-reflection-validity.test.ts:24,25`

## 4. Import mapping

v2 flattens the deep `sdk/server/*.js` paths. Each target below was confirmed present in the
published type declarations:

| v1 specifier (today) | symbol | v2 specifier |
|---|---|---|
| `@modelcontextprotocol/sdk/server/mcp.js` | `McpServer`, `ResourceTemplate` | `@modelcontextprotocol/server` |
| `@modelcontextprotocol/sdk/server/stdio.js` | `StdioServerTransport` | `@modelcontextprotocol/server/stdio` |
| `@modelcontextprotocol/sdk/client/index.js` | `Client` | `@modelcontextprotocol/client` |
| `@modelcontextprotocol/sdk/inMemory.js` | `InMemoryTransport` | root of **either** v2 package |

**The one thing worth flagging, because it looked like the risk and isn't.** Neither v2 package
publishes an `inMemory` *subpath* — the export maps are `.`, `./stdio`, `./_shims`,
`./validators/ajv`, `./validators/cf-worker` and nothing else. That reads as "the in-memory transport
is gone," which would have made the four MCP test files the expensive part of the migration. It is
not gone: `InMemoryTransport` is exported from the **root** of both packages (confirmed in each
package's `dist/index.d.mts`). The subpath moved; the symbol didn't.

## 5. What the spike did *not* settle

Scoped honestly — these are import-level findings, not behavioural ones:

1. **Constructor and option-bag signatures.** `McpServer`'s and `StdioServerTransport`'s v2
   signatures were not diffed against v1. `server.ts` is 802 lines and registers tools, resources and
   prompts; a changed registration API is the only place real work could hide.
2. **Whether both v2 packages are needed as direct dependencies**, or whether `client` pulls in what
   the tests need transitively. Declare both explicitly regardless.
3. **Protocol-version negotiation defaults.** v2's index exports
   `DEFAULT_NEGOTIATED_PROTOCOL_VERSION` and `SUPPORTED_PROTOCOL_VERSIONS`; whether the default
   changes the handshake against today's clients is unverified.
4. **`@modelcontextprotocol/sdk` 1.30.0** — an in-range minor we are not on. Cheap and independent of
   v2; worth taking in the same fire as the v2 work, or before it as a control.

## 6. Suggested execution order, when it is scheduled

1. Bump v1 `1.29.0 → 1.30.0` first (in range already), confirm the suite is green. Establishes a
   clean baseline and separates "v1 minor broke it" from "v2 broke it."
2. Swap the two production imports; `tsc --noEmit`. Signature drift surfaces here, cheaply.
3. Swap the eight test imports; run the four MCP test files.
4. Run the MCP server against a real client over stdio (`npm run mcp`) — the tests use
   `InMemoryTransport`, so stdio itself is unasserted by the suite.

Step 4 is the one that would be easy to skip and shouldn't be: the test harness deliberately does not
exercise the transport the product actually ships on.
