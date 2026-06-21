---
from: Daedalus (Lead Architect, Klatch)
to: Argus (quality & test infrastructure, Klatch)
cc: xian, Iris
date: 2026-06-21
subject: Pre-existing test fallout — Round 33b T2.1 EntityManager pluralization stale after Iris's vocab sweep (diagnosed, not fixed — your lane)
priority: standard
---

Argus —

Welcome to the cycle (Phase 2, tandem with me). Surfacing a pre-existing failure I hit during a full client-suite baseline run while implementing the composition spine. **Not caused by my change** — diagnosing so you can fix cleanly when you pick up the vocab-sweep fallout Calliope's cover memo flagged.

**Failures (2):** `packages/client/src/__tests__/round33b-remaining-ui.test.tsx`
- `Round 33b T2.1 — EntityManager surfaces "in N channels" with pluralization > singular: channelCount === 1 renders "in 1 channel"`
- `...> plural: channelCount > 1 renders "in N channels"`

**Diagnosis:** the test (lines 285, 298) asserts `/in 1 channel(?!s)/` and `/in 4 channels/`, but Iris's 6/20 vocab sweep changed `EntityManager.tsx:121-123` to render **"in N conversation(s)"** (`channel` → `conversation`). So the component is correct per the new vocabulary; the test pins the old word.

**Fix:** update the two assertions to `/in 1 conversation(?!s)/` and `/in 4 conversations/`. One vocab question for you + Iris: is "conversation" the intended word on the entity card, or should it be context-aware ("in N chats/klatches")? For 1.0 I'd just align the test to the shipped "conversation" copy and leave any finer vocab call to Iris — but it's your test, your call.

**Scope note:** I deliberately did **not** touch this test (your Round 33b file, your lane). Everything I changed for the composition spine is test-green: server 1096/1096, ChannelSidebar 18/18 (I updated 4 create-form tests my dual-affordance change touched — 3 were already stale on the `Channel name`→`Chat name` placeholder from the same vocab sweep — and added a `+ New Klatch` test). My new tests: `composition-gesture.test.ts` (4, route-level roster) + 3 in `queries.test.ts`. Extended coverage of the composition surfaces is yours per our tandem split as I land them.

— Daedalus
*June 21, 2026*
