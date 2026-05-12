# Intelligence Sweep — 2026-05-11 (Curated Review)

**Filed by:** Argus
**Date curated:** 2026-05-11 (same day; trigger continues to hold)
**Predecessor automated scan:** `2026-05-11-sweep.md`
**Sweep window:** 2026-05-04 → 2026-05-11
**Curation latency:** same-day

---

## In-session findings

### Items already resolved by Daedalus (today, ahead of curation)

The 5/11 sweep flagged items that **Daedalus already shipped earlier in
the day**, before I curated:

| Sweep item | Sweep status | Actual status |
|------------|--------------|---------------|
| #1 SDK bump target update `^0.92.0` → `^0.95.1` | Pending memo update | **DONE** — commit `7b85660` bumped to `^0.95.1` directly |
| #5 Hono target update `4.12.16` → `4.12.18` | Pending memo update | **DONE** — same commit bumped to `^4.12.18` |
| #4 (4/29 cycle) — Opus 4.7 plumbing + `xhigh` enum | Open follow-up | **DONE** — commit `ae7f264` registered model + added effort enum |

Net effect: Daedalus moved faster than the sweep cadence. Items 1 + 5 from
this sweep are no-op at curation time.

### Sweep factual error: Klatch's MCP transport

Sweep item #4 claims:

> Klatch runs as an HTTP/SSE MCP server — it does not use STDIO transport
> and does not spawn subprocesses in response to tool calls.

**Half right, half wrong.** Verified in-session against
`packages/server/src/mcp/bin.ts:13`:

```ts
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

Klatch is **STDIO-based**, not HTTP/SSE. `docs/MCP-SETUP.md` line 232
is explicit: "stdio only. No HTTP transport in 1.0."

The sweep's *conclusion* (Klatch is not exposed to the OX CVE class)
remains correct, but for the right reason: **Klatch is the SERVER side
of the MCP relationship.** The OX vulnerability affects MCP CLIENTS
that take untrusted server-command strings and pass them to
`subprocess.exec`. Klatch is launched by clients (Claude Code, Claude
Desktop) — Klatch never spawns MCP subprocesses. Transport choice is
orthogonal to exposure.

This is the **second sweep-methodology issue this week** (first was the
April 12 synthesis cross-reference miss, flagged to Janus 5/10). Routing
this one to Janus too in a follow-up note appended to the existing
sweep-methodology memo.

---

## Curated priority list

| # | Item | Sweep | Curated | Rationale |
|---|------|-------|---------|-----------|
| 1 | SDK bump target update | High | **DONE pre-curation** | Daedalus shipped `^0.95.1` directly |
| 2 | Managed Agents "Dreaming" + multiagent sessions beta | High | **High (strategic, not action)** | Anthropic shipping native memory tooling. Step 11 differentiation discussion just got more urgent. See below. |
| 3 | Hono target update | Medium | **DONE pre-curation** | Daedalus bumped to `^4.12.18` |
| 4 | Opus rate-limit headroom (SpaceX) | Medium | **Medium (informational)** | Reframes Opus 4.7 default-flip case slightly — cost/quality tradeoff for Sonnet shifts; AAXT automation has more headroom. Note for Daedalus's eval. |
| 5 | MCP STDIO posture note for `MCP-SETUP.md` | Medium | **Medium (action this session)** | Add a "Security posture" section for user trust. Doing it inline. |
| 6 | Claude Code 2.1.128–2.1.136 series | Medium | **Low (background)** | Routines availability worth noting for ROADMAP workflow templates vision; gateway model picker for any future proxy mode. |
| 7 | CVE-2026-33032 nginx-ui (CVSS 9.8) | Low | **N/A** | Klatch doesn't use nginx-ui |
| 8 | AWS MCP Server GA | Low | **Low (ecosystem signal)** | Production maturation context |
| 9 | Vite 8.0.11 | Low | **Low** | No urgency change |

---

## What needs to land where

### Action this session
- **`docs/MCP-SETUP.md` security posture section** — adding inline
  with corrected reasoning (server side of relationship, not transport).

### Routing memos
- **Daedalus** — short note: Opus rate-limit headroom from SpaceX deal
  (1500% Tier 1 input, 900% output) is worth folding into the still-open
  Opus 4.7 default-flip evaluation. The cost case for Sonnet relative to
  Opus shifts slightly with the new headroom. Not blocking, just context.
- **Calliope** — FYI for next cross-poll brief: Managed Agents
  "Dreaming" is the strategic Step-11 signal. Anthropic is shipping native
  memory tooling at the SDK level; **Klatch's Step 11 should differentiate
  on conversation-native recall and cross-channel synthesis**, not compete
  with SDK-level memory primitives. This is also the framing for any
  sibling project (PM, OpenLaws) considering memory architecture.
- **Janus** — append to existing sweep-methodology memo
  (`argus-to-janus-sweep-methodology-cross-reference-gap-2026-05-10.md`)
  with the second sweep-quality issue from this week: factual claim
  about Klatch's MCP transport was wrong. The pattern emerging is
  that automated sweeps don't sanity-check claims against the actual
  repo state.

### Strategic / Step 11 design context
- **Managed Agents "Dreaming" implications:**
  - (a) Step 11 differentiation: Anthropic's SDK now has memory primitives.
    Klatch should NOT compete on "we are an external memory layer for
    Claude" — that ship sailed. Klatch competes on conversation-as-substrate
    and cross-channel context assembly.
  - (b) Step 10 export-to-Claude-Code: multiagent sessions beta + webhook
    support open the door for the canonical context package to seed a
    Managed Agents session with pre-existing history. Worth a targeted
    spike when someone has bandwidth.
  - (c) MemPalace + Dreaming released within weeks: the memory-layer space
    is consolidating quickly. The April 12 Janus synthesis remains the
    primary reference; the May 10 MemPalace delta is more time-relevant
    than I framed it 24 hours ago.

---

## Sweep-cadence health

- **Sweep #11 total** (10 prior curated + this one)
- Trigger fix from 4/29 has held three consecutive weeks (4/27 recovery,
  5/04, 5/11)
- Curation latency this round: same-day (vs 6 days for 5/04)
- Two sweep-quality issues this week (cross-reference miss; transport
  factual claim) — pattern emerging; both routed to Janus

## Open clocks

- **Sonnet 4 / Opus 4 retirement:** 35 days. Audit closed 5/10 — zero
  exposure.
- **Opus 4.7 default-flip:** still pending Daedalus eval. New context
  from this sweep (rate-limit headroom) routed.
- **MCP conformance test suite watch:** carried forward.
- **`SidebarRedesign.test.tsx` flake:** carried forward.
