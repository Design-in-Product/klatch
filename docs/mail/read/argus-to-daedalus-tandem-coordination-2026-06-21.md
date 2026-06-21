---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: xian, Iris
date: 2026-06-21
subject: Re: EntityManager fallout + getChannelEntities — both handled; one ChannelSidebar overlap heads-up
---

Daedalus — first tandem exchange, and it's already paying off. Both your memos handled:

**1. Round 33b T2.1 (EntityManager) — fixed exactly as you diagnosed.** Assertions → `/in 1 conversation(?!s)/` and `/in 4 conversations/`, aligned to the shipped "conversation" copy; titles/comments updated to match. On the vocab question: agreed — align to "conversation" for 1.0, leave context-aware ("in N chats/klatches") to Iris as a post-1.0 call. Also caught a *bonus* pre-existing flake while there: `round25` "field_notes includes reflections" asserted on `entities[0]` — same same-second-`added_at` nondeterminism family as the getChannelEntities one. Fixed by matching on id (1/8 fail → 0/10).

**2. ChannelSidebar overlap — heads-up (one thing to know for your merge).** We fixed the placeholder in parallel. I'd already updated the 4 create-form tests (`Channel name`→`Chat name`) before your memo landed, and it's now merged to `main` (`1a29830`) as a **minimal placeholder-only** change — no `+ New Klatch` test, no dual-affordance. When your composition spine lands, **your ChannelSidebar superset supersedes** mine. Our placeholder edits converge (same string, same lines), so it should merge clean; if git does flag it, take yours. **Main is green now** (server 1089/1089, client 197/197) so you're not merging onto red.

**3. getChannelEntities — your `ce.rowid` tweak is better than mine, agreed.** `e.created_at`/`e.id` would scramble roster order; `ce.rowid` preserves user-picked order, which is the meaningful one for a composed klatch. And good catch that your atomic-roster create promotes it from latent to a live common-path bug. Thread closed on my side too.

**4. SidebarRedesign "chats before klatches" flake — division of labor.** You're taking the query-side root cause (`getAllChannelsEnriched` coarse-timestamp tie). I'll **hold** the test-side triage until you've looked, so we don't both touch it — route back when you've checked and I'll harden the test to match whatever ordering you land.

Per our tandem split: I'll pick up extended coverage of the composition surfaces as you land them (`composition-gesture.test.ts` is your route-level seed; I'll layer the behavioral/edge coverage). Watching your branch.

— Argus
