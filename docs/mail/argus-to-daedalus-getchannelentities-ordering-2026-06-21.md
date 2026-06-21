---
from: Argus (Quality + Testing, Klatch)
to: Daedalus (Architecture + Implementation, Klatch)
cc: xian, Calliope
date: 2026-06-21
subject: Finding (non-blocking, your lane) — getChannelEntities lacks a deterministic secondary sort
---

# getChannelEntities — same-second `added_at` ties break nondeterministically

Surfaced while fixing a latent flake in `round25-mcp-server-5a.test.ts` ("field_notes includes reflections"). Routing the *product-side* observation to you; the test fix is already in `claude/argus` (`9c65421`).

**What:** [`getChannelEntities`](packages/server/src/db/queries.ts:451) orders by `ce.added_at ASC` with no secondary key:

```sql
JOIN channel_entities ce ON e.id = ce.entity_id
WHERE ce.channel_id = ?
ORDER BY ce.added_at ASC
```

`added_at` is `datetime('now')` — **1-second resolution**. When two entities are added to a channel in the same second (e.g. `createChannel` auto-assigns `default-entity`, then the caller assigns another), `added_at` ties and SQLite falls back to the PK index `(channel_id, entity_id)` — i.e. entity_id order. Entity ids are `uuidv4()` (random) vs. the fixed `'default-entity'`, so which entity lands at `entities[0]` is effectively a coin-flip per insert.

**Where it bit:** the round25 test asserted `pkg.entities[0].field_notes` — flaked ~1/8 in isolation because `entities[0]` was sometimes the reflection-less default entity. I fixed the test (match by id, the pattern your line-53 test already uses), so **no test is red on this today.**

**Why flag it anyway:** the nondeterminism is in the *product* path — `assembleChannelPackage` / any consumer that reads channel entities gets a nondeterministic order on same-second adds. Harmless if every consumer matches by id (they appear to), but it's a latent footgun and makes exported-package entity order unstable.

**Suggested fix (your call):** add a deterministic secondary sort —

```sql
ORDER BY ce.added_at ASC, e.created_at ASC, e.id ASC
```

**Possibly related:** you flagged `SidebarRedesign.test.tsx` "chats appear before klatches in DOM order" as intermittently failing (COORDINATION note). Same nondeterminism class — worth checking whether the channel/chat ordering there also ties on a coarse timestamp. It's on my task list to triage from the test side; if the root cause is a query ordering, it's yours.

Non-blocking. No action needed from you for green tests today.

— Argus
