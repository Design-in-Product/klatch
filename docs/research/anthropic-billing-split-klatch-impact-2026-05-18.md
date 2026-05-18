# Anthropic June 15 Billing Split — Klatch Impact Assessment

**Filed by:** Subagent analysis (commissioned by Calliope, hand-off to xian)
**Date:** 2026-05-18
**Triggering memo:** `docs/intel/2026-05-18-sweep.md` item 1 (Anthropic June 15 billing split announcement, 2026-05-14)
**Scope:** Klatch-only. Klatch product runtime, Klatch team workflows, and Klatch-adjacent automation. Cross-project impact (PM, OpenLaws, DinP) is explicitly deferred.

---

## Executive summary

**The financial impact on xian's Max subscription from the June 15 billing split, scoped to Klatch, is $0/month with high confidence.** Nothing currently running on or around Klatch draws from the four affected surfaces (Agent SDK, `claude -p` headless, official Claude Code GitHub Actions, third-party Agent SDK apps). Klatch's product runtime has always been on direct API billing via `ANTHROPIC_API_KEY` (unchanged). The team's day-to-day work happens in interactive Claude Code CLI sessions, which stay in the subscription.

The interesting part is what the split *exposes*, not what it costs today. Two forward-looking surfaces will draw from the new Agent SDK credit pool once they exist: the Step 10 export-to-Claude-Code workflow (envisions seeding an Agent SDK session as the receiving end) and a future `transport-managed-agents.ts` target identified in the May 12 dreaming research spike. Neither is implemented; neither has users; neither costs anything today.

Confidence is **high** on the "no current impact" finding — full codebase scan, no Agent SDK or `claude -p` invocation found, no GitHub Actions, no scheduled jobs. Confidence is **medium** on the AAXT forward-looking risk: AAXT runs today go through the regular `@anthropic-ai/sdk` and the OpenAI auxiliary (both API-billed, unaffected). If AAXT ever migrates to the Agent SDK as a scaffold, that traffic *would* draw from the new pool. No current plan suggests this shift.

## What Klatch surfaces use what billing pool

| Surface | Billing pool (current) | Billing pool (June 15+) | Volume estimate | Notes |
|---|---|---|---|---|
| Klatch runtime API calls (`packages/server/src/claude/client.ts`) | Direct API key (`ANTHROPIC_API_KEY`) | Direct API key (unchanged) | All user conversation traffic — depends on xian's actual usage; not a subscription line item today | Uses `@anthropic-ai/sdk` v0.95.1; not the Agent SDK |
| AAXT auxiliary LLM (`packages/server/src/aaxt/auxiliary.ts`) | OpenAI by default (gpt-4o-mini), Anthropic Haiku fallback | Same; both via raw `fetch`, no Agent SDK | Single-digit AAXT live runs to date (Apr 26, Apr 27) | Direct API billing on either provider; not Agent SDK |
| AAXT target probing (`packages/server/src/aaxt/runner.ts`) | Direct API key, `@anthropic-ai/sdk` | Same (unchanged) | Stateless probes; ~3 channels × ~5 probes per run | Not Agent SDK; not subscription |
| MCP server (`packages/server/src/mcp/server.ts`) | N/A — Klatch *serves* MCP, doesn't call Claude | N/A | Read-only stdio resources | No Claude invocation from this surface |
| Claude Code dev sessions (Daedalus, Argus, Iris, Theseus, Calliope) | Max subscription (interactive CLI) | Max subscription (unchanged) | ~27 sessions in last 30 days across 5 active slugs | Interactive Claude Code CLI stays in subscription |
| GitHub Actions in Klatch repo | None | None | N/A | No `.github/workflows/` directory in the repo |
| `claude -p` headless invocations | None | N/A | N/A | Not invoked from any script |

## Investigation findings

**A1. Agent SDK usage in Klatch packages.** Grepped `packages/` for `@anthropic-ai/agent-sdk`, `agent-sdk`, `claude-agent`. No matches. `packages/server/package.json` lists `@anthropic-ai/sdk` (the regular API SDK) at `^0.95.1`. Five files import it: `claude/client.ts:1`, `aaxt/runner.ts:12`, `export/briefing.ts:8`, `routes/export.ts:10`, `routes/models.ts:2`. **Verdict: unaffected.**

**A2. `claude -p` headless invocations.** Grepped `packages/`, `scripts/`, and all `*.sh` files for `claude -p` and `claude --print`. The only matches are documentation references to the *external* announcement in `docs/intel/` and `docs/briefs/cross-pollination/`. No code in Klatch invokes `claude -p`. **Verdict: unaffected.**

**A3. GitHub Actions invoking Claude.** No `.github/workflows/` directory exists at the Klatch repo root. (Only `node_modules/*/.github/workflows/` from dependencies, which is irrelevant.) **Verdict: N/A.**

**A4. AAXT pipeline.** `packages/server/src/aaxt/runner.ts:12` uses `import Anthropic from '@anthropic-ai/sdk'` for target probing — regular SDK, direct API key. `packages/server/src/aaxt/auxiliary.ts:19-39` prefers OpenAI (`gpt-4o-mini`) when `OPENAI_API_KEY` is set, falls back to raw Anthropic API (Haiku 4.5) via `fetch`. No Agent SDK in either path. **Verdict: unaffected.**

**A5. MCP server.** `packages/server/src/mcp/server.ts:16` imports `@modelcontextprotocol/sdk/server/mcp.js`. The server exposes Klatch channels/projects/entities as read-only stdio resources for clients like Claude Code or Claude Desktop. It does not call Claude itself — it is an MCP *server*, not a client. **Verdict: N/A (doesn't draw from any pool).**

**B1. Scripts running Claude in headless/background mode.** `scripts/aaxt-seed.sh`, `scripts/demo-seed.sh`, `scripts/seed-demo.sh`, `scripts/aaxt-mcp-live-probe.ts`, `scripts/record-demo.ts` — all reviewed. Every script makes HTTP calls to the local Klatch server (`http://localhost:3001/api/...`) or spawns the MCP server over stdio. None invoke `claude` as a CLI subprocess. None use the Agent SDK. **Verdict: unaffected.**

**B2. Cross-pollination brief automation.** The Klatch repo *receives* daily briefs at `docs/briefs/cross-pollination/`. The generation is Janus-side (DinP project), not Klatch-side. Nothing in Klatch generates briefs. **Verdict: N/A for Klatch.**

**B3. Scheduled/cron tasks.** No cron files in the repo. No scheduled GitHub Actions (no workflows at all). No background daemons configured by Klatch. **Verdict: unaffected.**

**B4. Background CCR sessions / non-interactive CLI.** Every entry in `docs/internal/operations/agent-activity-log.csv` shows `environment=klatch-dev` (interactive Claude Code CLI). No CCR (cloud Claude runtime) entries, no headless agents. **Verdict: unaffected.**

## Volume baseline

From `docs/internal/operations/agent-activity-log.csv`, last ~30 days (2026-04-18 → 2026-05-18, 27 sessions total):

| Slug | Sessions | Environment | Surface |
|---|---|---|---|
| argus | 7 | klatch-dev | Interactive CC CLI |
| iris | 6 | klatch-dev | Interactive CC CLI |
| daedalus | 6 | klatch-dev | Interactive CC CLI |
| calliope | 6 | klatch-dev | Interactive CC CLI |
| theseus | 2 | klatch-dev | Interactive CC CLI |

All 27 sessions ran in surfaces unaffected by the June 15 split. Across the full log (110 rows since March 11), every entry shows `klatch-dev` environment — no headless, no Agent SDK, no GitHub Actions.

## Financial impact estimate

**Current impact: $0/month** against the new $200/month Max 20x Agent SDK credit ceiling. No traffic flows through the affected surfaces.

**Forward-looking, if implemented:**

- *Step 10 export-to-Claude-Code Agent SDK seeding:* unknown — depends on whether xian or any future user actually runs the seeded session, and at what token volume. A single Opus-grade Klatch context package + a multi-turn agent session could easily consume tens of thousands of tokens; at full API rates ($15/$75 per million input/output for Opus 4.7) one heavy session is order-of-magnitude $1–5. At Max 20x's $200/month ceiling, hundreds of such sessions/month would be required to cross it. Not a near-term concern.
- *AAXT scale-up if it migrates to Agent SDK:* not currently planned. If it did migrate and ran (say) 50 probing channels × 10 probes × ~5k tokens each per week, that's ~2.5M tokens/week, which at Opus rates is ~$50–100/week — would cross the $200 ceiling within 2–4 weeks. **Flag if Argus proposes this migration.**

## Recommendations

1. **No changes needed right now.** The codebase scan is clean; the team workflow is unaffected; nothing in flight crosses into the new pool.

2. **When Step 10 export-to-Claude-Code UX is implemented, add a one-line note in the export receiving-end UX** explaining that any Agent SDK session spawned to receive the package will draw from the user's Agent SDK credit pool, not their Claude subscription. The phrasing already drafted in `docs/intel/2026-05-18-sweep.md` item 1 ("Agent SDK sessions draw from your Agent SDK credit, not your Claude subscription") is fine.

3. **If/when `transport-managed-agents.ts` ships** (per the May 12 dreaming research spike, doc D2), include the same disclosure in its UX surface and in its README/transport docs. Symmetric work to recommendation 2.

4. **If Argus proposes migrating AAXT off the regular SDK and onto the Agent SDK** as a scaffold (e.g., to use multiagents/outcomes or webhooks for probe orchestration), treat that as a budget decision, not just an engineering decision — surface it to xian with a token-volume estimate before implementing. Reasonable trigger: if probing sessions/week × tokens/session × Opus rates crosses ~$100/month, raise it.

5. **Keep this memo's findings in mind during cross-project synthesis.** A clean Klatch finding does not generalize to a clean xian-wide finding; see caveat below.

## Cross-project caveat

This analysis is Klatch-only. The broader question — "is xian's Max subscription going to feel different across all his projects on June 15" — requires data from Piper Morgan, OpenLaws, DinP, and any other project xian runs that touch Claude. From inside Klatch we can't see whether PM's automation uses `claude -p`, whether OpenLaws has GitHub Actions workflows invoking Claude, or whether DinP's Dispatch agent is built on the Agent SDK. A PM Architect / Piper Alpha equivalent of this memo, plus a Janus-side scan of DinP, would be needed to answer the cross-project question. Defer to those analyses if/when they exist; do not extrapolate from Klatch's clean result.
