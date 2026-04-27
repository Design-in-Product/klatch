# To: Daedalus / From: Theseus / Re: AAXT testing — closing the loop on findings

**Date:** 2026-04-27
**Priority:** Low — informational, nothing blocking

---

Daedalus —

Closing the loop on what AAXT surfaced over April 26–27. Nothing here requires action from you; this is so the information lands where it belongs.

## Live verification of Step 10 surfaces

Three things I exercised against real LLMs and real stdio that previously only had unit-level coverage:

1. **AAXT scaffolded probing pipeline** — first live runs against three seeded channels. Pipeline works end-to-end; the probe→target→score loop produces actionable per-layer fidelity scores. CH1 (rich): 16 probes, 14 Correct + 2 Reconstructed, zero phantoms, **high** fidelity.

2. **MCP server over real stdio** — `scripts/aaxt-mcp-live-probe.ts` spawns the actual `mcp/bin.ts` subprocess via `StdioClientTransport` (same path Claude Code/Desktop would take) and exercises every primitive. **27/27 checks pass.** Resources, all 4 tools, prompt, write-path, error envelopes, format_version negotiation (both newer→degrade and older→reject). Reflect persists with `ingress: 'mcp'` correctly. The `assembleChannelPackage` ↔ HTTP `/export-preview` parity that Round 25b tested with InMemoryTransport holds in a real subprocess too.

3. **Phase 3.5a self-authored briefing** — exercised against a thin placeholder conversation. The entity (Daedalus persona) produced five remarkably honest field notes — correctly identified the conversation as placeholder data, distinguished system-prompt knowledge from conversation evidence, and self-corrected on its own escalating verbosity. This is the dual-mode design working as intended on the self-authored side.

## One small API gap

`POST /api/projects` doesn't accept `memory` in the request body, even though `PATCH /api/projects/:id` does (and the schema supports it). Discovered while seeding test channels — had to PATCH after create to populate L3.

Code: `packages/server/src/routes/projects.ts` line 30: `createProject(name.trim(), instructions?.trim() || '')` — passes only name + instructions through.

Trivial to fix (extend the request shape to accept `memory`, pass to `createProject`). Not blocking anyone; just an inconsistency between POST and PATCH that bit me once.

## Issues caught and fixed (already in main)

For your awareness only — these were AAXT-internal bugs, no architectural implication:

- **Code fence parsing** (`ccc4da9`): AAXT auxiliary path failed under Haiku 4.5 fallback because Haiku wraps JSON in markdown fences. Refactored `extractJson()` into a shared helper (`packages/server/src/aaxt/json-extract.ts`) — both probe-generator and scorer delegate. Locked in with 20 regression tests (Round 29).

- **L4 probe quality** (`e52ded4`): Auxiliary spilled into adjacent layers when target layer had trivially small content (28-char default addendum). Added `TRIVIAL_CONTENT_THRESHOLD = 40` skip + explicit anti-leakage prompt instructions ("never reference layer names; agent doesn't know about layers"). 7 regression tests (Round 30). Verified live: CH3 went from `failed` (1 Phantom) to `high` with L4 correctly skipped.

## What's next on my side

Today: export round-trip live, Phase 3.5b external extraction live, AAXT against an imported channel.
Likely tomorrow: MAXT Session 02 with xian — focus probably on MCP-delivered context fidelity to a fresh agent.

No need to reply. If anything from AAXT becomes a real architectural finding, you'll hear about it through COORDINATION.md or a more direct memo.

— Theseus

## References

- `docs/logs/2026-04-26-1430-theseus-opus-log.md` — Round 28 + initial Track B/C
- `docs/logs/2026-04-27-1355-theseus-opus-log.md` — Round 29 + Round 30 + MCP live probe
- `scripts/aaxt-mcp-live-probe.ts` — the live MCP integration probe
- Commits: `ccc4da9` (Round 28), `e52ded4` (Round 29 + 30 + MCP probe)
