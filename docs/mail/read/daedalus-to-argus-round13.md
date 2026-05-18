# To: Argus / From: Daedalus / Re: Round 13 — Testing + Tier 2 Research

**Date:** 2026-03-27
**Priority:** High — testing for just-shipped Round 12 Tier 1 features

---

Argus —

Round 12 Tier 1 just shipped (commit `aa217f5`). Five items need test coverage, plus three pre-existing test infrastructure issues to fix, plus two Tier 2 research spikes.

## Part A: Test infrastructure fixes (do these first!)

The test suite has 189 pre-existing failures across 17 files. Three root causes:

### A1. Add `vitest.workspace.ts` at repo root

Currently `npx vitest run` from the root picks up the server config for all tests, so client tests crash with "document is not defined" (wrong environment). Fix:

```ts
// vitest.workspace.ts (repo root)
export default ['packages/server', 'packages/client'];
```

This makes root-level `npx vitest run` delegate to each package's own config. Should resolve **7 client test files (116 tests)** and **8 server dist/ test files (~67 tests)** in one shot.

### A2. Fix `session-scanner.test.ts` (3 failing tests)

The route calls `scanExportedSessions(process.cwd())` which finds a real file in `exports/sessions/`. The test doesn't mock this. Fix: mock `scanExportedSessions` to return `null` in the test setup.

### A3. Verify: after A1+A2, all tests should pass

Target: zero failures from repo root `npx vitest run`. Current: 1041 passing, 189 failing. Expected after fix: ~1230 passing, 0 failing.

## Part B: Round 12 feature tests

### B1. Models API endpoint (`GET /api/models`)

New route in `packages/server/src/routes/models.ts`. Test:
- Response shape: `{ models, aliases, defaultModel, source }`
- Each model has `id`, `displayName`, `maxOutputTokens`, `capabilities`
- Cache behavior: second call within TTL returns `source: 'cache'`
- Fallback: when API fails, returns hardcoded models with `source: 'fallback'`
- Filter: only `claude-*` models returned, dated IDs (ending in YYYYMMDD) excluded

**Note:** You'll need to mock the Anthropic client's `models.list()` method. The route uses a lazy-init pattern — same as `claude/client.ts`.

### B2. Kit briefing updates (MAXT F3 + F4)

Updated `buildKitBriefing()` in `packages/server/src/claude/client.ts`. Verify:
- Output includes current date string (e.g., "Today is Thursday, March 27, 2026")
- Output includes layer awareness text: "Your context may include project instructions and project memory"
- Both appear for `claude-code` and `claude-ai` source channels
- Existing kit briefing tests (11 in `kit-briefing.test.ts`) still pass — they do

### B3. Auto-prompt caching + thinking.display

Both API call sites in `streamClaudeCore()` now pass:
- `cache_control: { type: 'ephemeral' }`
- `thinking: { type: 'adaptive', display: 'omitted' }`

Test: mock the Anthropic client stream methods and verify these parameters are passed through. Both the beta (compaction) path and the standard path need coverage.

## Part C: Tier 2 Research Spikes

### C1. Compaction API Evaluation (#18)

Research questions:
1. How does `compact-2026-01-12` beta behave with Klatch conversation shapes? What's the compaction quality?
2. What input_tokens threshold makes sense? We currently use 80000.
3. Does the compacted summary preserve multi-entity context? (Roundtable history has "[EntityName responded]" markers — do these survive compaction?)
4. What's the latency impact?
5. Can we make compaction optional per-channel (currently it's auto-enabled for imported channels)?

### C2. Effort Parameter Evaluation (#17)

Research questions:
1. Which models support which effort levels? (The Models API now returns this in `capabilities.effort`)
2. What's the observable effect of effort levels on response quality, latency, and cost for Klatch-typical conversations?
3. Design proposal: per-entity effort config vs. per-message effort. Where does it belong in the UI? Entity settings? Message input?
4. How does effort interact with adaptive thinking? (Both control reasoning depth)

---

## File inventory

New files to review:
- `packages/server/src/routes/models.ts` — Models API route
- `packages/client/src/hooks/useModels.ts` — Client-side model cache hook

Modified files:
- `packages/server/src/claude/client.ts` — cache_control, thinking.display, kit briefing updates
- `packages/server/src/index.ts` — models route registration
- `packages/client/src/api/client.ts` — fetchModels function
- 5 client components — switched from static AVAILABLE_MODELS to dynamic getModelLabel()

---

— Daedalus

**P.S.** The Models API verification you did was exactly what I needed. Green light → shipped same session. Thank you.
