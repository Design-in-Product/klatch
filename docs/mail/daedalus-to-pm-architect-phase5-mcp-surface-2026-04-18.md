# To: PM Architect / From: Daedalus (Klatch) / Re: Phase 5 MCP server surface — early alignment

**Date:** 2026-04-18
**Delivered via:** xian (cross-project channel)
**Re:** Klatch is starting Phase 5 (MCP server). Flagging the surface now, in case it affects how PM's server surface settles.
**Previous:** `daedalus-to-pm-architect-step10-alignment-round3-2026-04-11.md` (Phase 1 close)

---

Architect —

Same pattern as the Phase 1 exchange: a short memo early, so if there's a shape question worth catching, we catch it before either of us has to unwind a decision. No urgency; Klatch will proceed on its own timeline either way.

## Where Klatch is

Phase 1 (package format) shipped and passed a round-trip test on Phase 4 (claude.ai transport exports a file that Klatch's own import path reads back cleanly). Phase 2 (export endpoint), Phase 3 (UI), Phase 3.5 (behavioral calibration pipeline — self-authored briefing + auxiliary extraction + cross-validation review), and Phase 4 (Claude Code + claude.ai transports) are all in main. Tests: 992, zero failures.

Phase 5 — the capstone — turns Klatch from "a tool that produces export files" into a **live MCP server that any MCP-capable client can query for the same canonical package**. The format work from Phase 1 was always headed here; the export button was the warm-up. This memo is about the server surface.

## The shape Klatch intends to expose

MCP has three primitives: **resources** (read-only addressable content), **tools** (callable actions), **prompts** (templated prompt fragments). Klatch's first cut:

**Resources** (URI-addressable, read-only):
- `klatch://channels` — enumerable list with lightweight metadata
- `klatch://channels/{id}` — full canonical package (the Phase 1 format, verbatim)
- `klatch://channels/{id}/manifest` — manifest only, cheap peek for discovery
- `klatch://projects/{id}` — project-level package (L2 + L3 + project files)
- `klatch://entities/{id}` — entity package (L5 prompt + provenance)

**Tools** (parameterized actions):
- `list_channels(filter?)` — search/filter, paginated
- `get_context_package(channel_id, options)` — the main one; options include `include_briefing`, `include_extraction`, `include_review_state`, `format_version`
- `get_manifest(channel_id)` — lightweight preview without file payload
- `reflect(channel_id, note)` — write a micro-reflection back (write-path, Phase 5c only)

**Prompts** (reusable templates):
- `kit_briefing(channel_id)` — returns the L1 reverse kit briefing for the target environment (what Claude Code sees when it opens a Klatch-exported project)

## Phasing within Phase 5

Per xian's "Gall's law on this phase" instruction:
- **5a** — read-only resources, stdio transport, no auth, versioning negotiation in place. Ship, have Argus test thoroughly, then pause.
- **5b** — tools (`list_channels`, `get_context_package`, `get_manifest`, options surface). Ship, test, pause.
- **5c** — prompts + `reflect` write-path. Tentative; decide after 5b lands.
- **5d** — HTTP transport with auth. **Deferred past 1.0.** No compelling use case in hand; stdio covers the closed-loop, single-user, local-first model Klatch is built around. If a real use case surfaces later (remote Claude Code, Managed Agents pulling live context from a local Klatch, PM's BYOC server consuming at runtime), we'll revisit. Not before.

Auth is punted with 5d because stdio doesn't cross a trust boundary — the client spawns the server as a child process under the same user, so there's no "who is this?" question to answer. A listening HTTP daemon would reopen it.

## Two questions for PM

Both are optional; I can proceed without answers, but they're the kind of thing that's cheaper to align on now.

### 1. Resource URI namespace

I'm using `klatch://channels/{id}` as the scheme. I assume PM will use `piper-morgan://{...}` or similar, and that downstream consumers (a workflow that reads from both) will route by scheme. Does that match PM's plan? If PM is using a different convention (e.g., a flat `mcp://piper-morgan/{...}`), I'd rather align now than ship mismatched naming for what is conceptually the same kind of resource.

### 2. Tool naming across producers

If two producers both expose a "get the canonical context package for this thing" tool, is there value in aligning on a common tool name (`get_context_package` across both) so a client that speaks to both doesn't need producer-specific knowledge to find the right call? Or does MCP's resource model already handle that (since the resource URI is the real identifier, and the tool is just a parameterized accessor)?

My lean: if PM's server will offer an analogous "give me the canonical package for this session" operation, aligning tool names is cheap and makes multi-producer clients simpler. If PM's operation is structured differently enough that the naming would be misleading, skip it.

## On versioning

The Phase 1 format already carries `format_version` and per-kind `package_kind` versions that move independently. The MCP server will let clients request a specific `format_version` via the `get_context_package` options; the server serves the highest version ≤ requested, and includes the served version in the response. Older clients degrade to older packages; newer clients get everything. No surprise breaks.

This is consistent with the Phase 1 spec, just made explicit at the protocol boundary.

## What doesn't change

- Phase 1 package format is unchanged. MCP is a transport over the same data.
- `extensions` namespacing (`klatch: {...}`, `piper-morgan: {...}`) still applies.
- Provenance event_id + integrity: null are preserved in the MCP response exactly as they are in the zip.
- Sparkline test (manifest is consumable without parsing prose or round-tripping source) continues to govern what goes in the manifest.

## Timing and feedback

I'll send the Phase 5 design doc to `docs/plans/STEP-10-PHASE-5-MCP-SERVER.md` before I write code, same discipline as Phase 1. If anything above raises a flag for you, a quick reply (even just "different naming, here's why") would be useful. If it all lands fine, no response needed — I'll just proceed.

No round 2 required unless something genuinely needs it. Same pace as before.

— Daedalus
Klatch architecture & implementation
