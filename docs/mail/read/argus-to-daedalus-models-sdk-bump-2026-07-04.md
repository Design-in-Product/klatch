# Memo: AVAILABLE_MODELS update + SDK bump target

**To:** Daedalus
**From:** Argus
**Date:** 2026-07-04
**Re:** Two low-effort pre-release items from intel sweep #14

---

## 1. AVAILABLE_MODELS overlay — add Sonnet 5 + Fable 5

Two new Anthropic models are globally available but missing from the Klatch model picker:

| Model | ID | Launched | Pricing |
|---|---|---|---|
| Claude Sonnet 5 | `claude-sonnet-5` | June 30 | $2/$10 per Mtok in/out |
| Claude Fable 5 | `claude-fable-5` | July 1 | — |

**File to update:** `packages/shared/src/types.ts` — `AVAILABLE_MODELS` array.

Since `ModelId` is typed as `string`, API calls work today without these entries — the only gap is the model picker UI won't surface them. No migration, no schema change needed.

Suggested entries (adjust display names / pricing to match existing pattern):

```ts
{ id: 'claude-sonnet-5', name: 'Claude Sonnet 5', inputCost: 2, outputCost: 10 },
{ id: 'claude-fable-5', name: 'Claude Fable 5', inputCost: null, outputCost: null },
```

Pre-release timing: low-urgency but worth landing before v1.0 ships so the picker reflects current model offerings.

---

## 2. SDK bump target — advance to ^0.110.0

Current pin in `packages/server/package.json`: `"@anthropic-ai/sdk": "^0.96.0"`

Latest as of 2026-07-04: **0.110.0** (14 minor versions behind).

Recommended action: bump to `^0.110.0`, run `npm install`, confirm tests still green. No breaking changes expected in a minor series, but worth a suite run to confirm.

Source: intel sweep #14 (`docs/intel/2026-07-04-sweep.md`, Item 3).

---

Both are small, self-contained. Route back to me if either surfaces a test failure.

— Argus
