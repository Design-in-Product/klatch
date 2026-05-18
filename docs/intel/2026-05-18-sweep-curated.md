# Intelligence Sweep — 2026-05-18 (Curated Review)

**Filed by:** Argus
**Date curated:** 2026-05-18 (same day)
**Predecessor automated scan:** `2026-05-18-sweep.md`
**Sweep window:** 2026-05-11 → 2026-05-18

---

## Methodology improvement landed (worth flagging)

This sweep uses the Prior-mentions + Verified-against fields I'd routed to
Janus in `argus-to-janus-sweep-methodology-cross-reference-gap-2026-05-10.md`
and the follow-up on 5/11. **The fix has landed in the sweep automation.**
Every item now lists prior mentions in our docs and (where applicable)
verification against actual code state. Two side benefits visible in
today's sweep:

- Item 2 (SDK 0.96.0) explicitly checks `packages/server/package.json`
  and cites the current pin — no false-novelty claim possible.
- Item 3 (MCP stateless HTTP SEP) flags `[VERIFICATION NEEDED: HTTP
  transport status in packages/server/src/mcp/]` and explicitly asks
  Argus to verify before framing — this is the discipline working.

Routing a short ack note to Janus.

---

## In-session verifications

### Item 2 (sweep) — SDK 0.96.0 gap

Verified: `packages/server/package.json` shows `"@anthropic-ai/sdk": "^0.95.1"`.
Gap is exactly one minor version. New material in 0.96.0:
`BetaManagedAgentsSearchResultBlock` types + cache diagnostics beta.
Cache diagnostics is the AAXT-relevant addition (could observe
prompt-cache hit rates on probing sessions). Routing to Daedalus along
with the billing item.

### Item 3 (sweep) — MCP stateless HTTP / .well-known status in Klatch

Verified: `packages/server/src/mcp/bin.ts:13` imports
`StdioServerTransport` only. **No HTTP transport in Klatch's MCP server
today.** Confirmed previously in the 4/29 + 5/11 sweep curations; status
unchanged. The MCP 2026 roadmap's stateless HTTP SEP would only matter
to Klatch if/when Phase 5d ships (deferred past 1.0). `.well-known`
metadata discovery is a Someday/Maybe item for "Klatch as universal
context transport." No action this cycle.

### Item 1 (sweep) — Billing change Klatch exposure audit

Ran `grep -rn 'claude -p' packages/ scripts/` and `ls .github/workflows/`
in this session. **Zero `claude -p` usage in Klatch code; no GitHub
Actions workflows configured.** Klatch's exposure to the 6/15 Agent
SDK split is exactly what the sweep said: (a) Klatch uses direct
ANTHROPIC_API_KEY — unaffected for own tokens; (b) future Step 10
"export to Claude Code" / seed-an-Agent-SDK-session path will draw
from users' Agent SDK credit pool; (c) any future AAXT automation
routed through Managed Agents has the $20/$100/$200 monthly ceilings
to consider. Routing to Daedalus + Calliope.

---

## Curated priority list

| # | Item | Sweep | Curated | Action |
|---|------|-------|---------|--------|
| 1 | Anthropic 6/15 Agent SDK billing split | High | **High (forward-only — Klatch unaffected today)** | Memo to Daedalus + Calliope (export UX framing + cross-poll brief) |
| 2 | SDK 0.96.0 (cache diagnostics + SearchResultBlock) | High | **Medium** | Memo to Daedalus — cache diagnostics has AAXT tooling potential; one-minor gap (no rush) |
| 3 | MCP stateless HTTP SEP + .well-known | Medium | **Low** — confirmed not exposed | No action; Phase 5d/Someday-Maybe context |
| 4 | Claude Code 2.1.143 worktree.bgIsolation | Medium | **Low (informational)** | Note for CCR; no Klatch code touched |
| 5 | Erika Flowers Substack | Low | **Low (status quo)** | No product news |
| 6 | Hono 4.12.19 | Low | **Low (auto-resolved)** | `^` range will pick up |
| 7 | React 19.2.6 | Low | **N/A** | Patch only |
| 8 | Vite 8.0.13 | Low | **Low** | Migration posture unchanged |
| 9 | MemPalace OpenCode plugin | Low | **Low** | Ecosystem expansion; reference doc current |

---

## What needs to land where

### Action this session
- Three routing memos (covered below)
- Sweep methodology ack to Janus

### Strategic context — separate from sweep
- **Outcomes spike** filed in parallel: `docs/research/anthropic-outcomes-working-processes-2026-05-18.md`
  per xian's 5/18 ask. Conclusion: Outcomes is most useful as a *pattern*
  (gradeable rubric format for round assignments + Iris triage); the
  mechanism (Managed Agents sessions) requires re-platforming agent
  identity and isn't worth the cost. Three short routing memos
  (Daedalus, Iris, Calliope) follow from the spike.

### Routing memos this session
- **Daedalus:** combined SDK 0.96.0 + billing-change-impact + Outcomes
  pattern proposal for round assignments
- **Calliope:** billing-change framing + Outcomes "pattern not mechanism"
  context for cross-poll brief
- **Iris:** Outcomes pattern fit for triage docs (light-touch suggestion)
- **Janus:** ack on sweep methodology fix landing cleanly

---

## Sweep-cadence health

- **Sweep #12 total** (11 prior curated + this one)
- Trigger fix from 4/29 has held **four consecutive weeks** clean
- **Methodology fix from 5/10 + 5/11 memos has landed in the automation** —
  Prior-mentions + Verified-against fields visible on every item
- Curation latency: same-day

## Open clocks

- **Sonnet 4 / Opus 4 retirement:** 28 days. Audit closed 5/10 — zero
  exposure.
- **6/15 Agent SDK billing split:** 28 days. Klatch direct-API path
  unaffected; export-to-Claude-Code path needs a UX note when that
  ships.
- **MCP conformance test suite watch:** carried forward.
