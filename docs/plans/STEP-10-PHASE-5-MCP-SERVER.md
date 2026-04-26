# Step 10 Phase 5: Klatch as MCP Server

*Design document. Authored 2026-04-18 by Daedalus.*
*Status: Phase 5a ✓ shipped · Phase 5b ✓ shipped · Phase 5c-i ✓ shipped (kit_briefing prompt + reflect explicit-note write-path) · Phase 5c-ii (auto-reflect) deferred · Phase 5d deferred past 1.0.*

*Shaped by: xian (Gall's-law phasing, HTTP scope), Calliope (Phase 5 greenlight memo), Phase 1 format work (PM Architect + Argus + Iris + Janus).*

---

## What this document is

The design for turning Klatch from a tool that **produces** context packages (Phase 2) and **adapts** them to specific destinations (Phase 4) into a **live MCP server** that any MCP-capable client can query for context, in the same canonical format.

This is the capstone of Step 10. The format was designed for this from Phase 1 on; the export button was the warm-up. Phase 5 is where "canonical context interchange protocol" becomes concrete rather than aspirational.

## Design principles

1. **The manifest is the API.** The MCP server does not invent a second data shape. It serves exactly the Phase 1 canonical package, unchanged. Clients get the same structure whether they call the HTTP export endpoint, unzip a file on disk, or query over MCP.

2. **Local-first, closed-loop, single-user.** The MCP server ships as a stdio process inside the user's Klatch install. A client (Claude Code, Claude Desktop, a Managed Agent bootstrap script) spawns it as a child process under the same user. There is no network daemon, no port, no credentials, no multi-tenancy. HTTP is explicitly deferred past 1.0 until a concrete use case names itself.

3. **Gall's-law phasing.** Ship the smallest surface that works. Test thoroughly. Expand only when the prior slice is known-good. The phases below are separable; each can stop being built at any boundary.

4. **Versioning negotiation at the protocol boundary.** Clients may request a specific `format_version`. The server serves the highest version ≤ request. Older clients degrade to older packages; newer clients get everything. No surprise breaks. This is consistent with Phase 1's `format_version` + per-kind `package_kind` version independence.

5. **No new auth complexity.** stdio does not cross a trust boundary (the client launches the server as a child process under the same user). No authentication model is defined in 5a–5c. If HTTP ever lands (5d, post-1.0), auth becomes a real question; it is not one today.

---

## Server surface

MCP has three primitives: **resources** (read-only addressable content), **tools** (parameterized actions), **prompts** (templated prompt fragments). Klatch's surface:

### Resources (URI-addressable, read-only)

| URI                                     | Returns                                                       |
| --------------------------------------- | ------------------------------------------------------------- |
| `klatch://channels`                     | List of channels with lightweight metadata                    |
| `klatch://channels/{id}`                | Full canonical context package (Phase 1 format)              |
| `klatch://channels/{id}/manifest`       | Manifest only, cheap peek for discovery                       |
| `klatch://projects/{id}`                | Project-level package (L2 + L3 + project files)               |
| `klatch://entities/{id}`                | Entity package (L5 prompt + provenance + field notes)         |

Resources are the discovery surface. A client that only knows MCP can crawl `klatch://channels`, pick one, fetch the manifest, decide whether to pull the full package.

### Tools (parameterized actions)

| Tool                                     | Purpose                                                             |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `list_channels(filter?, limit?, offset?)` | Search/filter channels. Returns the same shape as `klatch://channels` |
| `get_context_package(channel_id, opts)`  | The rich accessor. `opts`: `include_briefing`, `include_extraction`, `include_review_state`, `format_version` |
| `get_manifest(channel_id)`               | Lightweight preview; equivalent to the `/manifest` resource         |
| `reflect(channel_id, note?)`             | **5c only.** Write a micro-reflection back. If `note` omitted, triggers the Phase 3.5c auto-reflection |

Tools are the rich accessor. A client that wants field notes with behavioral calibration calls `get_context_package` with `include_briefing: true`. Under the hood, this runs the Phase 3.5a/b pipeline; the cost and latency of that is worth naming to the client (Phase 3.5 is LLM-backed).

### Prompts (reusable templates)

| Prompt                           | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `kit_briefing(channel_id)`       | Returns the L1 reverse kit briefing for the target environment        |

Prompts let a client insert a Klatch-authored preamble into a new conversation without having to reconstruct it from the manifest. This is the MCP-native way to say "bootstrap this conversation with Klatch's perspective on what just got handed over."

---

## Phasing

### Phase 5a — Read-only resources, stdio, no auth

**Goal:** Any MCP-capable client can list and read Klatch channels.

**Ships:**
- `@modelcontextprotocol/sdk` added to `@klatch/server` dependencies
- New binary: `packages/server/src/mcp/bin.ts` (stdio entry point)
- Server module: `packages/server/src/mcp/server.ts` (wiring)
- Resource handlers for all five URIs above
- Extracted manifest builder (`packages/server/src/export/package-builder.ts`) shared between HTTP export route and MCP server, so there is exactly one definition of the canonical package shape
- Versioning negotiation: server advertises supported `format_version` list; `get_context_package` honors a requested version
- No field notes, no briefing/extraction generation at this phase — pure read of what's in the DB

**Test plan (Argus):**
- Resource enumeration returns expected channels
- Resource fetch produces manifest that matches `/export-preview` byte-for-byte
- Invalid channel ID returns MCP-idiomatic not-found
- Server starts cleanly under stdio, speaks JSON-RPC per MCP spec
- Integration: Claude Code configured with Klatch MCP server can list channels and fetch packages

**Exit:** Argus green on 5a test suite. Decision point: proceed to 5b, or pause.

### Phase 5b — Tools surface

**Goal:** Rich, parameterized access. Clients can ask for field notes, filtered listings, specific format versions.

**Ships:**
- `list_channels` tool with filter/pagination
- `get_context_package` tool with full options surface (delegates to Phase 3.5 briefing + extraction when requested)
- `get_manifest` tool
- Field note filtering (by status: include/exclude draft/approved/rejected)

**Test plan (Argus):**
- Tool invocations match resource fetch shape for equivalent calls
- Option toggles produce expected package variants
- Pagination consistent across calls

**Exit:** Argus green on 5b. Decision point: proceed to 5c, or pause.

### Phase 5c — Prompts + reflect write-path

Split into two slices after the 5b decision-point review (xian alignment 2026-04-26):

#### Phase 5c-i ✓ shipped (2026-04-26)

**Goal:** Close the loop with the smallest viable write-path.

**Ships:**
- `kit_briefing(channel_id)` MCP prompt — environment-orientation preamble. Reuses `buildKitBriefing` for imported channels; emits a brief native preamble for Klatch-originating channels.
- `reflect(channel_id, entity_id, note, type?)` tool — explicit-note write-path. Required `entity_id` (xian alignment: client knows what it observed; we don't guess). Default `type: 'observation'` (newly added to `MicroReflection.type`). Stamps `ingress: 'mcp'` (treat ingress as a thin transport/wrapper layer identifier; future ingresses get their own values without breaking the schema).
- Membership check: rejects if the requested entity is not assigned to the channel.
- Argus's URL-decode two-liner applied to all four resource template handlers (Argus 2026-04-18 memo). Test contract inverted accordingly.

**Round-trip demonstrated:** stdio client calls `reflect` → row appended → next `klatch://entities/{id}` or `klatch://channels/{id}` read includes the reflection in `field_notes`.

#### Phase 5c-ii (auto-reflect, deferred)

**Scope:** `reflect(channel_id, entity_id)` with no `note` triggers an LLM-backed reflection generation (parallel to Phase 3.5c auto-reflection). Same cost/latency caveat as `include_briefing`/`include_extraction`.

**Status:** Not blocked by anything; awaiting a real driver. Decision deferred until a concrete client wants to call it.

### Phase 5d — HTTP transport + auth (deferred past 1.0)

**Goal:** Klatch MCP reachable from non-local clients.

**Status:** Not planned for Step 10 or 1.0. Will ship only when a concrete use case justifies the auth/security work it implies. Candidate drivers (none load-bearing today): remote Claude Code over SSH, Managed Agents pulling live context from a local Klatch, PM BYOC runtime consumption.

Roadmap placement: someday/maybe.

---

## What doesn't change

- Phase 1 canonical format is unchanged. MCP is a transport over the same data.
- `extensions` namespacing (`klatch: {...}`, `piper-morgan: {...}`) still applies and is preserved verbatim in MCP responses.
- Provenance `event_id` + reserved `integrity: null` fields ride through unchanged.
- Sparkline test continues to govern manifest design.
- HTTP `/export`, `/export-preview`, `/export/claude-code`, `/export/claude-ai` endpoints remain and continue to work. MCP is additive.

---

## Refactoring prep (ships in 5a)

The HTTP route (`routes/export.ts`) currently holds the `buildManifest` function and its helpers (`mergeFieldNotes`, `parseSourceMetadata`). 5a extracts these to `packages/server/src/export/package-builder.ts` and re-imports them into the HTTP route. No behavior change; the HTTP export continues to produce the exact same manifest. The MCP server imports from the same module. Single source of truth for the canonical package shape.

---

## Open questions

1. **Resource URI namespace** — *resolved 2026-04-18.* `klatch://` scheme confirmed by PM Chief Architect's reply. PM will use `piper-morgan://`. Scheme-per-producer; downstream clients route by scheme. Parallel to Phase 1's `source_type` structural identification.

2. **Tool name alignment across producers** — *resolved 2026-04-18.* `get_context_package` adopted as the shared cross-producer tool name. Producer-specific options stay producer-specific (Klatch has `include_briefing`, `include_extraction`; PM will have its own); the response envelope is canonical. PM-specific tools (`save_artifact`, `retrieve_artifact`, `get_project_status`) use PM-specific names.

3. **`/{id}/manifest` sub-resource pattern** — *adopted as cross-producer convention 2026-04-18.* Both Klatch and PM expose `/{id}/manifest` for cheap preview. A multi-producer client can enumerate and preview packages from both servers without pulling full payloads. Zero alignment cost; small interop win.

4. **Write-path coordination (post-5b)** — Klatch's 5c `reflect(channel_id, note)` and PM's eventual `save_artifact(content, metadata)` are both tentative. No alignment needed until both are real. Worth noting that write-path coordination has provenance/trust implications that read-paths don't.

5. **Field note visibility controls** — should a channel carry a `mcp_visibility: private | public` flag so the user can exclude specific channels from MCP enumeration? Not in 5a or 5b; revisit if use case appears.

6. **Binary file handling** — MCP resources return text content by default. The current package already references files by ref (not inline); MCP responses do the same. Binary file retrieval (inline via `resources/read`) is a post-5b question.

---

## Success criteria for Phase 5 (overall)

Klatch ships as an MCP server that:
1. Any MCP-capable client can install via stdio configuration
2. Exposes every existing context package as a queryable resource with zero format translation
3. Preserves format versioning at the protocol boundary
4. Shares one codepath with HTTP export so the two never diverge
5. Covers the "closed-loop, local-first" use case completely, without opening a network surface that would require auth

Phase 5a is the first concrete step toward all five.
