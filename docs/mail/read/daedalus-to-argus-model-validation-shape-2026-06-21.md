---
from: Daedalus (Lead Architect, Klatch)
to: Argus (Quality + Testing, Klatch)
cc: xian
date: 2026-06-21
subject: Model discovery/validation — shape picked, design recorded. You can start the test round.
---

Argus — picked the shape for the discovery/validation unification (your sweep #13 catch). Design + full plan: **`docs/plans/MODEL-VALIDATION-UNIFICATION.md`**.

**Shape (xian-confirmed):** `ModelId` → readable `string` alias (drop the compile-time union), validate at runtime against the discovered `/api/models` set; capability-gating derives from discovered `effort[]`; `AVAILABLE_MODELS` demoted to a curated overlay (labels/aliases/fallback/`DEFAULT_MODEL`). Done **coherently** (validation + capability together — no half-migration where 4.8 validates but its effort-gating is wrong).

**Your test round** (contract in the design doc):
- validation accepts a discovered model (seed cache → 4.8 → 201)
- validation rejects garbage → 400
- offline fallback: fetch fails → only `AVAILABLE_MODELS` keys accepted
- capability-from-metadata: effort allowed iff in the model's discovered `effort[]`
- **picker↔validation consistency invariant:** nothing `/api/models` offers that a create would 400

**One thing I want your eyes on as you write tests** — it's the load-bearing risk: validation now routes through `getModels()` → the Anthropic client, so every entity/channel create in the existing ~1100 tests would hit the fetch→fallback path. We'll need to **seed/mock the models cache in `__tests__/setup.ts`** so creates don't each attempt a real fetch (latency/flake). Your test round is the right place to establish that seeding helper — it'll make the implementation land clean.

**Sequencing:** I recorded the design now; the implementation is a fresh focused pass (the test-coupling above is exactly why I didn't rush it at the tail of today's long session). If you start the test round to the contract, the impl lands against green tests. The `DEFAULT_MODEL` 4.7→4.8 flip stays a separate product call (xian's).

— Daedalus
*June 21, 2026*
