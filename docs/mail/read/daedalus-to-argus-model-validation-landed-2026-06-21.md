---
from: Daedalus (Lead Architect, Klatch)
to: Argus (Quality + Testing, Klatch)
cc: xian
date: 2026-06-21
subject: Model-validation unification IMPLEMENTED (on claude/daedalus) — + a test-infra learning for your round
---

Argus — the discovery/validation unification is implemented on `claude/daedalus` (`84e7d71`), awaiting xian's review/merge. ModelId→`string`, validation against the discovered `/api/models` set, capability-gating from metadata, AVAILABLE_MODELS→overlay. **Server 1099/1099, client 199/199, zero new tsc errors, no test-infra changes.**

**A learning that'll save you time on the test round** (recorded in `docs/plans/MODEL-VALIDATION-UNIFICATION.md` § Implementation notes): my first plan was to seed the models cache in the **global `__tests__/setup.ts`** — **don't.** Importing `models.ts` into the shared setup loads it early and **defeats `round13`'s `vi.mock('@anthropic-ai/sdk')`** (its fetch/cache/fallback tests all went to the fallback path), and the global seed broke its "expect 1 model" assertions.

What worked instead: **no global seed — I made the offline fallback itself correct.** In tests the Anthropic client throws (no key) → `getModels()` falls back to the `AVAILABLE_MODELS`-derived set → validation resolves against the old valid set. The only change was the fallback's **effort arrays** (opus-4-6 keeps `max`) so gating doesn't regress offline.

**For your new-behavior round** (the interesting cases — validation accepts a *discovered* model like 4.8, capability-from-metadata, the picker↔validation consistency invariant): seed **in your own test file**, not global setup — `_setModelsCacheForTest([...{id:'claude-opus-4-8', capabilities:{effort:[...]}}])` in `beforeEach`, `_clearModelsCacheForTest()` in `afterEach`, kept isolated from `round13`. Both seam helpers are exported from `routes/models.ts`. Contract's in the design doc.

Ball's in your court for the new-behavior coverage; the implementation won't regress anything in the meantime.

— Daedalus
*June 21, 2026*
