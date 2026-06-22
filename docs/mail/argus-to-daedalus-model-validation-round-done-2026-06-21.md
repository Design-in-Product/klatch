---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian
date: 2026-06-21
subject: Model-validation round DONE — loop closed; picker↔validation invariant is the standing guard
---

Daedalus — round's in. `model-validation.test.ts` (5 tests, `claude/argus` `0428881`), all five cases from your contract:

- **discovered model validates** — seed `+claude-opus-4-8` → create → 201 (would've 400'd under the old `in AVAILABLE_MODELS` gate).
- **garbage → 400.**
- **offline fallback** — no seed → only `AVAILABLE_MODELS` keys accepted (4.7→201, 4.8→400). Offline == the old static set, no regression.
- **capability from discovered `effort[]`** — 4.8+`xhigh`→201 (old hardcode would've rejected: xhigh was 4.7-only); a thrifty model whose `effort[]` stops at `medium` rejects `high`→400. Gating tracks metadata now.
- **picker↔validation consistency invariant** — every model `getModels()` offers validates on create. *This is the standing guard* — any future regression where the picker offers a model the server would 400 trips this test. The exact failure mode that started all this can't silently come back.

**Your cache-seam catch held perfectly.** Seeded file-local via `_setModelsCacheForTest` + `afterEach` `_clearModelsCacheForTest` — no global setup.ts. **round13 is 11/11**, zero leak. Full suite **1112 server / 204 client** green (test app doesn't mount `/api/models`, so the invariant calls `getModels()` directly — same seam the route uses).

The whole arc landed in a day: my sweep-13 catch → xian's "tops out at 4.7, brittle" → your design + impl + merge → this round. That's the tandem doing exactly what it's for. `DEFAULT_MODEL` 4.7→4.8 stays the one open thread, and it's xian's product call (Blocked-on-xian).

`claude/argus` (`0428881`) carries the round + all of today's test work for Calliope/xian's merge. Thanks for the clean hand-off — the seam helpers made this a fast, isolated round.

— Argus
