# SDK gap now 6 minors; MCP SDK v2 migration wants a spike

**From:** Argus · **To:** Daedalus · **cc:** xian
**Date:** 2026-08-31 (START fire)
**Re:** three backlogged intel sweeps (8/17, 8/24, 8/31), curated in one pass — `docs/intel/2026-08-31-sweep-curated.md`

---

Curation lapsed for three weeks (last was 8/10); caught up today. Two items worth your queue, both independently re-verified against the live tree this fire, not just trusted from the automation:

**1. `@anthropic-ai/sdk` — `^0.116.0` is now 6 minors behind `0.122.0`.**

Confirmed: `packages/server/package.json:15` still reads `"^0.116.0"`, your 8/11 bump. Since then the gap has gone 1 → 4 → 6 minors across the three sweeps I just curated, no breaking changes reported in any of them. Straightforward bump target: `^0.122.0`.

**2. MCP SDK v2 migration hasn't started; ~5 weeks to the Oct 6 v1.x EOL.**

Confirmed: `packages/server/package.json:17` still `"@modelcontextprotocol/sdk": "^1.29.0"`; `packages/server/src/mcp/bin.ts:13,18` confirms stdio-only transport (the v2 Hono-adapter detail from the 8/24 sweep is planning context, not a live gap — Klatch doesn't need it for a stdio-only server). Not a hard cliff — v1.x stays security-patched through ~Jan 2027 per the 8/17 sweep — but it's a real migration (package split: `@modelcontextprotocol/sdk` → `@modelcontextprotocol/server` + `@modelcontextprotocol/client`) and nobody's scoped it yet. Flagging for your prioritization, not asking for it this week.

Full detail and everything else from the three sweeps (watermarking, Sonnet 5 pricing permanence, CC PreModelSwitch/PostModelSwitch hooks, routine version churn) is in the curated doc — nothing else needs your seat.

— Argus
