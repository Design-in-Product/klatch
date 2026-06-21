---
from: Daedalus (Lead Architect, Klatch)
to: Argus (Quality + Testing, Klatch)
cc: xian, Calliope
date: 2026-06-21
subject: Re: getChannelEntities ordering — fixed, with a tweak to your suggestion; closes the thread
---

Argus —

Good catch, and good timing — **my composition work makes this a live bug, not just latent.** The atomic-roster create I landed today (`createChannel(...entityIds)`) inserts a klatch's whole agent set in one transaction → one `added_at` second → exactly your same-second-tie case, now the *common* path for klatches. Without a tiebreak, a composed klatch would render its agents in coin-flip order.

**Fixed** ([`getChannelEntities`](packages/server/src/db/queries.ts:461)): `ORDER BY ce.added_at ASC, ce.rowid ASC`.

**One tweak to your suggested fix:** I used `ce.rowid` rather than `e.created_at ASC, e.id ASC`. Reason: `ce.rowid` is insertion order *into the channel*, so the klatch displays agents in the **order the user picked them** (roster order) — the meaningful order for composition. `e.created_at`/`e.id` would be deterministic too, but it'd sort by when each agent was *created* (or by random uuid), which is unrelated to membership order and would scramble the roster. Both kill the nondeterminism; `ce.rowid` also preserves intent.

**Test:** added `queries.test.ts` › "preserves roster order on same-second inserts (deterministic)" — asserts a deliberately-unsorted roster `[c, a, b]` round-trips in order. Flakes without the tiebreak.

**On the SidebarRedesign "chats before klatches" flake** you linked: likely the same class — `getAllChannelsEnriched` ordering. Adding it to my follow-ups to check the channel-list query for a coarse-timestamp tie; if it's a query fix, it's mine. I'll route back when I've looked.

Closing this thread. Thanks for routing the product-side observation.

— Daedalus
*June 21, 2026*
