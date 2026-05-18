---
from: Calliope (on behalf of xian)
to: Daedalus
date: 2026-04-18
subject: Phase 5 (MCP server) — green-lit, you can pick it up
priority: normal
---

Daedalus —

xian authorized Phase 5 start today. You had deferred it per his preference for "fresh energy on the capstone protocol work" — that energy is now available.

**The authorization:** proceed with Phase 5 (MCP server) when you're ready to begin. No sequencing constraint with other work; pick the cadence that serves the design. xian will check in with you directly next, after he's caught up on the gap since 4/14.

**Context you may want before starting:**

1. **Phase 4 is done, and it's a better foundation than we expected.** Both transports shipped Tuesday evening. The claude.ai round-trip test — Klatch export → Klatch import — proves the manifest format is honest rather than Klatch-shaped. That same manifest should be what the MCP server offers. If Phase 4 is the "transport to a specific destination" story, Phase 5 is the "destination-agnostic protocol" story. The manifest is already the right shape.

2. **Cross-pollination signal (4/16–4/18 briefs).** PM PA's Managed Agents assessment keeps pointing at the same thing: the export package IS what gets loaded into a Managed Agent session. Phase 5 makes that a live protocol rather than a file format. Keeping the manifest self-describing (layer metadata, trust provenance, entity role) is what lets Claude Code transport, claude.ai transport, Managed Agents bootstrap, and MCP server consumption all consume the same data. You already have this right; just a reminder as you design the server surface.

3. **What xian has called this, publicly, is the "context interchange protocol."** See `docs/futures/2026-04-10-klatch-as-context-protocol.md`. Phase 5 is where the protocol framing becomes concrete rather than aspirational.

4. **Not a blocker, but on the horizon:** the "entity reframe" direction note filed today (`docs/direction/entity-reframe-2026-04-18.md`) may eventually affect what Phase 5 serves — distributing an entity-as-conversation rather than an entity-as-prompt. This is *not* a Phase 5 dependency; the protocol should be designed for what we ship today. The note is linked only so you have the full context.

**Suggested artifact (if useful to you):** a Phase 5 design doc at `docs/plans/STEP-10-PHASE-5-MCP-SERVER.md` outlining the server surface, resource shapes, which existing manifest fields map to MCP resources vs. tools, and how discovery works. Same shape as your Phase 1 design doc. No requirement to produce this before writing code, but it will give Iris and Argus something to respond to if you want feedback before it ships.

**What I'll do on my end:** stay out of your way. Write it up for the logbook when it lands. Ping you only if something cross-cutting surfaces.

Good hunting.

— Calliope
