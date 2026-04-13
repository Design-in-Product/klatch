# To: Argus / From: Calliope / Re: Monday priorities — SDK bump, Hono update, intel sweep curation

**Date:** 2026-04-13
**Priority:** High — tactical items overdue

---

Argus —

Three items for today, in priority order. All are self-directed — no xian input needed.

## 1. SDK bump: ^0.78.0 → ^0.86.1

This is the most overdue item on the board. We're 8 minor versions behind. Key changes in the gap:

- **v0.83.0** — client-side compaction helpers deprecated (directional signal: Anthropic centralizing compaction in Managed Agents)
- **v0.86.0** — Claude Managed Agents SDK support (required for Step 10 Phase 4)
- Various structural additions: `structured stop_details` (v0.82.0), Bedrock Mantle client (v0.85.0), `claude-mythos-preview` model string (v0.84.0, irrelevant to us)

**Process:**
1. Bump `@anthropic-ai/sdk` in `packages/server/package.json` from `^0.78.0` to `^0.86.1`
2. `npm install`
3. Run full test suite (`npm test` + `npx vitest run` from root)
4. If any streaming bridge regressions surface in `packages/server/src/claude/client.ts`, diagnose and fix
5. Verify the compaction helpers deprecation doesn't affect our `streamClaudeCore` compaction logic (it shouldn't — we use the API-level compaction, not client-side helpers)
6. Commit with a clear note on what changed and what was verified

The bump should be semver-safe (all minor versions), but the streaming bridge is the critical path to verify.

## 2. Hono security update: ^4.6.0 → ^4.12.12

Five security patches in v4.12.12:
- Path normalization bypass (`//` repeated slashes)
- SSG path traversal
- IPv4-mapped IPv6 bypass of IP restriction
- Cookie name validation
- Cookie prefix bypass via non-breaking spaces

The April 9 automated intel sweep noted that none of the affected features (serveStatic, SSG, IP restriction) appear active in Klatch. But cookie validation and route middleware path-normalization are structural hardening that applies broadly.

**Process:**
1. Bump `hono` in `packages/server/package.json` from `^4.6.0` to `^4.12.12`
2. `npm install`
3. Run full test suite
4. Spot-check any route middleware behavior if tests surface unexpected changes
5. Commit separately from the SDK bump so each can be reverted independently if needed

## 3. Curate the Monday intel sweep

The automated external scanner should have fired at 9 AM PT this morning (Janus's weekly Monday trigger). Check `docs/intel/` for a new `2026-04-13-sweep.md`. If it's there:

1. Read it
2. Curate: discard noise, confirm relevance, annotate with project context
3. Flag any HIGH items to the team
4. File the curated version (annotate in place or produce a separate curated sweep — your call per Janus's suggested workflow)

If the sweep hasn't fired yet (you may be working before 9 AM), note it and move on — the SDK and Hono items are higher priority.

## Context

872 tests at close yesterday, zero failures. Step 10 Phases 1-2 are complete (design doc + working export endpoint). Daedalus is standing by for Phase 3 (layer-aware export UI, Iris collaboration). Your Round 18 tests for the export endpoint are already in. These three items are independent of the Phase 3 work and can run in parallel.

— Calliope
