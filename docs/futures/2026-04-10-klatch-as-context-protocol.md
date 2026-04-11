# Klatch as a Context Interchange Protocol — A Future Direction

**Filed:** 2026-04-10
**Author:** Calliope (capturing xian's framing)
**Status:** Speculative / for later discussion
**Related:** ROADMAP.md "Klatch as universal context transport (and MCP service)" Someday/Maybe item, Step 10 Phase 5 (deferred MCP server), Apr 9 intel sweep (Claude Managed Agents launch)

---

## The thought

> Klatch may have some future not just as a place for chat agents to congregate and discuss things, but potentially as a standard interchange protocol for context-preservation. The trend in a lot of my work this week has been to start to think of our products as being services for agents to interact with and not just for people. People will be bringing their own chats, and MCP or its future equivalent is an important paradigm to consider. One thing we can think about on the road map is what does Klatch look like as an MCP or as a service that other services can call?
>
> — xian, April 10, 2026

## Why now

Three things converged this week that make this thought load-bearing rather than aspirational:

### 1. Claude Managed Agents launched (April 8)

Anthropic shipped a server-side agent harness with built-in tool execution, compaction, prompt caching, **MCP server support**, and persistent SSE streaming sessions. The Agents/Sessions/Environments model maps onto Klatch's entity/channel/project model. Klatch's Step 10 export plan now has a concrete infrastructure target — and that target speaks MCP natively.

### 2. SDK compaction helpers were deprecated (v0.83.0)

Anthropic is centralizing context-management infrastructure inside Managed Agents. The directional signal: Anthropic wants to own the agent execution layer, not just the model API. This affects Klatch's posture on infrastructure work. The cross-pollination brief (April 10) put it crisply: for each piece of duplicated infrastructure, decide whether to **hold** (Managed Agents won't cover our case), **migrate** (Managed Agents does it better), or **shim** (use ours behind an interface so migration is cheap).

### 3. xian's broader work this week pointed the same direction

Across Klatch, Piper Morgan, and the DinP projects, xian has been thinking about products as **services for agents to interact with**, not just for people. Piper Morgan's BYOC thesis ("Piper ships as an MCP server that plugs into any MCP-capable client") is the same shape from a different angle. Both projects are independently arriving at "be a service other services can call."

## What Klatch becomes in this framing

Today, Klatch is a place where humans (and named agents) work together in conversations. The five-layer prompt assembly is internal infrastructure that makes those conversations work better.

In the future framing, Klatch is **also**:

- **A context interchange protocol.** The five-layer model is a portable specification for what any AI agent needs to function well. Klatch becomes the reference implementation, not the only consumer.
- **An MCP service that other services can call.** Any MCP-capable client (Claude Code, Claude Managed Agents, a custom agent, another Klatch instance, Piper Morgan's BYOC server) can request: *"give me the assembled context for this channel"* — and get a complete five-layer package back. No copy-pasting prompts across sessions.
- **A bring-your-own-chat host.** Users arrive with conversations from anywhere. Klatch normalizes them into the five-layer model and serves them back to whatever target environment they want. The conversation isn't bound to Klatch — it's *passed through* Klatch on its way somewhere else.

## What this changes about the roadmap

It doesn't replace Step 10 — it extends it. Step 10 already plans for an export package format and (in Phase 5, deferred) an MCP server. The future direction sharpens **why** Phase 5 matters: it's not a nice-to-have, it's the destination Steps 9 and 10 have been pointing at all along.

Concretely:

- **Step 10 Phase 1 (canonical package format)** becomes more important. The format isn't just "what we export to a file" — it's "what we serve over MCP." Defining it well is defining the protocol.
- **Step 10 Phase 5 (MCP server)** moves from "deferred maybe" to "the natural endpoint of this work."
- **Anything past Step 11** should consider the agent-as-consumer use case as a first-class design constraint. What do we build that's only useful if a person clicks it, vs. what do we build that any agent could call programmatically?

## What this changes about the philosophy

The five-layer model started as Klatch internals. RFC-001 (March 30) was the first formal recognition that it could be a cross-project standard. This thought is the next step: it could be a cross-tool standard. A serialization format. A protocol.

That's a shift in stance. Klatch stops being "the place where the model is implemented" and starts being "the reference implementation of a model that other tools can adopt." This is closer to how npm became a registry standard, or how MCP itself became an interchange standard. The product is the protocol.

## What this changes about the audience

Today's audience is **power users who want a better interface for managing their Claude work**. Tomorrow's audience could be a superset: power users *plus* **other tools that need to exchange context with each other**. The blog and LinkedIn voice doesn't change immediately, but the eventual product surface does — APIs, MCP endpoints, schema documentation, and probably a developer-facing site alongside the user-facing one.

It also opens the door to a different go-to-market: rather than trying to win users one at a time, win adoption one tool at a time. Each tool that integrates becomes a distribution channel for Klatch's context model.

## The Tesler's Law connection

Design Principle 8 says the irreducible complexity of cross-environment context management exists and can only be relocated. Klatch's current move is to absorb that complexity into the software so users don't have to.

This future direction is a layer above: **other tools** also struggle with that complexity. If Klatch can absorb it on their behalf via an MCP service, the whole ecosystem benefits. The complexity moves not just from users to Klatch, but from every tool to one shared protocol. That's a much bigger Tesler's Law win than the per-user version.

## Open questions to come back to

1. **What is the canonical context package?** The Phase 1 format spec is the foundation. Does it need a name? (RFC-001 is the model; the package format is the encoding.)
2. **Who are the first integration partners?** Piper Morgan is the obvious one (sibling project, same author, MCP-ready). What about Cursor, LangGraph, AutoGen, CrewAI? Are there folks already publishing MCP servers we should talk to?
3. **What does the developer experience look like?** API docs, schema published as JSON Schema or Protobuf, an OpenAPI spec for the MCP endpoints, sample bundles, a "try it" playground?
4. **Does this change the Klatch business model conversation?** "Run your own MCP server" is open source. "Hosted Klatch as an MCP service" is hosted infrastructure. The protocol is free; the convenience is paid. That's a healthy shape.
5. **What does v1.0 look like in this framing?** Is v1.0 still "the conversation tool is good enough for general use," or does it become "the protocol is stable"? Probably still the former, but the latter is now visible on the horizon.
6. **How does this interact with the cross-vendor entity channels vision item?** A cross-vendor roundtable convened over MCP is even more interesting than one assembled in a single Klatch instance. The protocol could route to multiple model providers natively.

## Status

This is a thought to come back to, not a plan to execute. Step 10 is the immediate work. But every Step 10 design decision should be informed by this direction — especially the Phase 1 format spec, which is the thing that becomes the protocol if this future plays out.

— Calliope
