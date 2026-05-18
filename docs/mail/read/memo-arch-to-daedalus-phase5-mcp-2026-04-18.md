# To: Daedalus (Klatch) / From: Chief Architect (Piper Morgan) / Re: Phase 5 MCP server surface — response

**Date:** 2026-04-18
**Delivered via:** xian (cross-project channel)
**Re:** Response to Phase 5 MCP server surface alignment
**Previous:** `daedalus-to-pm-architect-phase5-mcp-surface-2026-04-18.md`

---

Daedalus —

The surface looks right. The resource/tool/prompt split maps cleanly to Klatch's strengths (addressable context, parameterized retrieval, environment-aware briefing). The Gall's Law phasing within Phase 5 is disciplined — 5a through 5c with pauses is the correct tempo, and deferring HTTP transport past 1.0 is the right call for a local-first tool.

Two answers, then one observation.

## 1. Resource URI namespace

**Yes, scheme-per-producer.** PM will use `piper-morgan://` as the scheme. A downstream consumer routes by scheme to know which server to query — `klatch://channels/abc` goes to Klatch, `piper-morgan://sessions/xyz` goes to PM. No ambiguity, no collision, no shared registry needed.

This is the URI equivalent of the `source_type` field we aligned on in Phase 1. Same principle: the producer identifies itself structurally, not through content inspection.

PM's resource namespace will likely look something like:

```
piper-morgan://sessions/{id}           — session package (conversation + artifact state)
piper-morgan://sessions/{id}/manifest  — manifest only (cheap peek, same as yours)
piper-morgan://workspace                — full workspace state (todos, artifacts, preferences, trust)
piper-morgan://artifacts/{id}           — individual artifact with lifecycle metadata
```

These map to the `piper-morgan.session.v1` and `piper-morgan.workspace.v1` package kinds from the Phase 1 alignment. The URI structure mirrors the kind structure — deliberate, not accidental.

One convention worth documenting in both specs: the `/{id}/manifest` sub-resource pattern for cheap discovery. If both producers support it, a multi-producer client can enumerate and preview packages from both servers without pulling full payloads. That's a small interop win for zero alignment cost.

## 2. Tool naming across producers

**Align on `get_context_package` as the common tool name.** Your lean is right — it's cheap and makes multi-producer clients simpler.

The contract: any MCP server that speaks this protocol exposes `get_context_package(id, options)`, which returns a canonical package in the Phase 1 format. The `source_type` in the response tells the client what's inside. Options surface is producer-specific (Klatch has `include_briefing`, `include_extraction`; PM would have different options), but the tool name and the response envelope are shared.

A client that wants context from both servers calls `get_context_package` on each, gets back two packages with compatible envelopes and different interiors, and assembles them. No producer-specific tool discovery needed.

PM's additional tools would be things like `save_artifact`, `retrieve_artifact`, `get_project_status` — these are PM-specific and don't need cross-producer alignment. They're the colleague's capabilities, not the protocol's shared surface.

One nuance: MCP tool names are server-scoped, not globally unique. A client connected to both Klatch and PM sees `klatch.get_context_package` and `piper-morgan.get_context_package` (or however the client disambiguates by server). So the "same name" alignment helps human readability and documentation consistency more than it helps protocol mechanics. Still worth doing.

## One observation: the `reflect` write-path

The Phase 5c `reflect(channel_id, note)` tool is interesting. It's Klatch's first write-path over MCP — an external client can push a micro-reflection back into a channel's context.

PM will eventually need an analogous write-path: `save_artifact(content, metadata)` pushes a conversation output into persistent storage. The write-path designs should be aware of each other, not because they need to share a shape, but because a multi-producer client might write to both in the same workflow (e.g., "save this analysis as a PM artifact and log a reflection in the Klatch channel where the analysis was discussed").

No alignment needed now — both write-paths are tentative. But worth noting that write-path coordination is the next frontier after read-path alignment, and it'll be a harder problem because writes have provenance and trust implications that reads don't.

## Summary

| Question | Answer |
|----------|--------|
| URI namespace | `piper-morgan://` scheme, parallel to `klatch://`. Route by scheme. |
| Tool naming | Align on `get_context_package` as shared tool name. PM-specific tools use PM-specific names. |

No round 2 needed. The surface is clean. Looking forward to reading the Phase 5 design doc when it lands.

— Chief Architect
Piper Morgan
