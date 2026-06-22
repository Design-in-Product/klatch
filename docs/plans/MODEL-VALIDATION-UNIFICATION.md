# Model Discovery/Validation Unification — Design

**Author:** Daedalus · **Date:** 2026-06-21 · **Status:** Designed, ModelId decision confirmed by xian; implementation pending (fresh focused pass + Argus test round)
**Origin:** Argus sweep #13 + `argus-to-daedalus-model-discovery-validation-split-2026-06-21.md`; xian flagged "Klatch tops out at 4.7" as brittle.

## Problem

Model **discovery is dynamic**, **validation/typing/capability-gating are static**, and they've diverged.

- **Dynamic half:** `GET /api/models` ([routes/models.ts](../../packages/server/src/routes/models.ts)) fetches the live lineup (`client.models.list()`, 1h cache, hardcoded fallback on fetch failure) with real capabilities (`thinking`, `effort[]`, `compaction`). The pickers render it via `useModels`. New models appear in the UI automatically.
- **Static half:** `AVAILABLE_MODELS` (4-entry dict in [types.ts](../../packages/shared/src/types.ts)) does **four jobs**: the `ModelId` type (`keyof typeof`), the validation gate (`model in AVAILABLE_MODELS → 400` at 4 sites: `entities.ts:52,89`, `channels.ts:105,156`), the capability map (`effortAllowedForModel`, `entities.ts:20` — hardcodes `xhigh⇒4-7`, `max⇒4-6/4-7`), and the import remap fallback (`import.ts`).

**Reachable bug today:** API returns Opus 4.8 → picker offers it → user selects → `POST`/`PATCH` → **400 "Invalid model."** Plus: `effortAllowedForModel` would reject `xhigh`/`max` for 4.8 (not in the literal switch).

## Decision (xian-confirmed 2026-06-21)

**`ModelId` becomes a readable `string` alias** (`export type ModelId = string`) — keep the name in signatures for readability, drop the compile-time union, validate at runtime against the discovered set. Trade: lose autocomplete/exhaustiveness; kill the per-release treadmill. `DEFAULT_MODEL` stays a manual constant (intentional — tokenizer/cost/behavior implications per release).

## Plan (do it coherently — NOT piecemeal)

The trap is a half-migration: accepting 4.8 at validation while capability-gating stays static → a 4.8 entity validates but its effort-gating is wrong. So validation + capability move together.

1. **`models.ts` exports** (cache-preferential, async): `getModels()` (already internal — export it); `isValidModel(id): Promise<boolean>` = `id` in discovered ids (the fallback already folds in `AVAILABLE_MODELS` on fetch-failure); `effortLevelsForModel(id): Promise<string[]|null>` from `capabilities.effort`.
2. **Validation → `isValidModel`** at the 4 sites (replaces `in AVAILABLE_MODELS`). Handlers are already `async`.
3. **Capability-gating → discovered metadata:** `effortAllowedForModel(effort, id)` becomes `(await effortLevelsForModel(id))?.includes(effort) ?? true` (permissive when capability data absent for a validated model).
4. **`ModelId` → `string` alias** (types.ts). Ripple: `AVAILABLE_MODELS[model]` lookups become `… | undefined` — guard with `?.` (there are few; the client `getModelLabel`/`useModels` already handle a dynamic list).
5. **Demote `AVAILABLE_MODELS`** to a curated overlay (labels/descriptions, `MODEL_ALIASES`, offline fallback, `DEFAULT_MODEL` source) — no longer the gate.

## Key implementation considerations

- **Test-environment coupling (the load-bearing one).** Validation now routes through `getModels()` → `getClient()` → `new Anthropic()` → `client.models.list()`. In tests there's no live API, so the first validation per test process triggers a failing fetch → fallback to `AVAILABLE_MODELS` → cached. Existing tests still pass *via the fallback*, but: (a) seed/mock the models cache in `__tests__/setup.ts` so creates don't each attempt a real fetch (latency/log-noise/flake), (b) confirm `getClient()` doesn't throw without an API key at import time. **This is why this wants a fresh pass + Argus's test round, not a tail-of-session change.**
- **Async gating:** `effortAllowedForModel` becomes async; thread `await` through the two entity sites.
- **Offline correctness:** when the API is down, `isValidModel` accepts exactly the `AVAILABLE_MODELS` keys (current behavior) — no regression.

## Test contract (for Argus's round)

- validation **accepts** a discovered model (e.g. seed cache with 4.8 → create entity/channel with it → 201)
- validation **rejects** garbage (`'not-a-model'` → 400)
- **offline fallback:** fetch fails → only `AVAILABLE_MODELS` keys accepted
- **capability from metadata:** effort allowed iff in the model's discovered `effort[]` (seed 4.8 with `['low','medium','high','xhigh','max']` → xhigh accepted)
- **picker↔validation consistency invariant:** no model `/api/models` offers that a create would 400

## Sequencing

The validation+capability+type changes land together (one coherent increment) with Argus's test round. The `import.ts` remap (job 4 of the static dict) can stay as-is initially (legacy dated-id remap is orthogonal). `DEFAULT_MODEL` flip 4.7→4.8 remains a separate product call (Blocked-on-xian).
