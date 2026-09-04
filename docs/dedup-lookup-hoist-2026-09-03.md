# Round 145: the browse dedup lookup was O(files × channels) — hoisted

**Author:** Daedalus · **Date:** 2026-09-03 (STOP fire) ·
**Origin:** Theseus, `docs/browse-latency-end-to-end-2026-09-03.md` (arm P)
**Instrument:** `scripts/probe-dedup-resolver-scaling.mts` ·
**Tests:** `packages/server/src/__tests__/round145-dedup-resolver.test.ts`

## What was wrong

Browse resolves "have I already imported this session?" by calling
`findChannelByOriginalSessionId` **once per session file**. That function is two-pass: a primary-key
lookup (indexed, cheap), then a fallback —

```sql
SELECT * FROM channels
WHERE json_valid(source_metadata)
  AND json_extract(source_metadata, '$.originalSessionId') = ?
```

No index covers that predicate. Verified this session, not recalled: `grep -n "CREATE INDEX"
packages/server/src/db/index.ts` returns three indexes, all on `message_artifacts` and `file_refs`.
So each call is a full table scan with a JSON parse per row, and the loop is **O(files × channels)**.

Theseus found this while decomposing browse latency and measured it (arm P, 508 lookups):
0 channels → 11 ms, 100 → 19 ms, 500 → 56 ms, 2000 → 201 ms.

**Why nobody saw it.** Per Theseus's memo — his reading, not re-verified by me, and I could not:
there is **no `klatch.db` anywhere in this worktree** (`find . -name klatch.db` empty, same boundary
Calliope hit on 9/2), and the sandbox denies reads outside it — the repo's DB has 2 channels, 0
carrying an `originalSessionId`. If that holds, every latency reading any of us has taken (his 1417 ms
endpoint, my 1387 ms scan) sits at the extreme left edge of that table, and the cost is real and
invisible on the machines we measure on simultaneously. Nothing in the fix depends on the exact
number; the shape of the curve below was measured directly on a seeded scratch DB.

## The fix

`createChannelBySessionIdResolver()` in `packages/server/src/db/queries.ts`. One scan of `channels`
builds both maps — canonical id, and `originalSessionId` — and each lookup is then a Map hit.
O(files × channels) becomes **O(files + channels)**.

Theseus offered two shapes and left the pick to this seat: an expression index, or hoisting the lookup
out of the loop. **Hoisted.** It needs no migration, no schema change, and no new index to keep
correct on write; and an expression index would still leave one query per file on the hot path.

Swapped at three call sites, all read-only:

| site | loop over | |
|---|---|---|
| `import/session-scanner.ts:241` | session files (`scanClaudeCodeSessions`) | the browse path Theseus measured |
| `import/session-scanner.ts:333` | exported files (`scanExportedSessions`) | same shape, same fix |
| `routes/import.ts:406` | conversations in a claude.ai ZIP (preview) | same shape — N conversations × M channels |

**One site deliberately left on the per-call function:** the bulk-import loop at `routes/import.ts:636`
imports as it goes, so it must see channels created earlier in the same batch. A snapshot resolver
would silently reintroduce duplicates *within* one ZIP. The reason is written at the call site and
pinned by a test, because this is the trap the next reader will walk into.

## Measured

Same scratch DB, same 508 lookups, same seeding as arm P, median of 5, Apple M1 Max / node v26.5.0:

| channels | per-call | resolver (incl. build) | speedup |
|---|---|---|---|
| 0 | 8.6 ms | 0.0 ms (0.0 ms build) | 180× |
| 100 | 17.5 ms | 0.2 ms (0.1 ms build) | 109× |
| 500 | 55.2 ms | 0.6 ms (0.6 ms build) | 88× |
| 2000 | 198.5 ms | 4.1 ms (4.1 ms build) | 49× |

**Theseus's arm P replicates almost exactly** — his 11/19/56/201 against my 8.6/17.5/55.2/198.5 on the
per-call column. Two independent instruments, same curve; the finding was not an artifact of either.

At 2000 imported conversations the dedup line of browse goes **198.5 ms → 4.1 ms**, and essentially all
of the remainder is the single build scan.

**Not claimed:** that this is user-visible today. On a 2-channel corpus it saves ~9 ms of a 1417 ms
endpoint — noise. It matters because of what it becomes; see below.

## Why it was worth doing now rather than after the cache

Theseus's second finding is the sequencing argument, and I agree with it. The fingerprint cache
`(path, mtime, size)` takes browse to a **29 ms** floor — that's his measured non-fingerprint
remainder, not an estimate. Against a 29 ms floor, an unfixed 201 ms dedup scan *is* browse latency:
the cache would have delivered a 48× cut on paper and a 7× regression against it in the hand of any
user with a real import history. Fixing it first means the cache lands into a floor that is actually a
floor.

## Honest limits

- One machine, one corpus, warm cache — I inherit Theseus's limits and my own from Round 143.
- The channel rows are synthetic and uniform (one small `source_metadata` blob each). A real corpus
  with larger `source_metadata` would make the per-call column **worse** and the resolver's build scan
  somewhat worse too; I have not measured that skew, so treat the 49× as the shape, not a constant.
- Lookup ids are non-matching by construction, which is the worst case for the per-call version (a
  primary-key hit short-circuits before the scan). A corpus where most browsed sessions *are* already
  imported would narrow the gap. The correctness cross-check in the probe covers the matching case
  (50 hits, 0 mismatches) but I did not build a timing arm for a mostly-matching corpus.
- Memory: the resolver holds every channel row for the duration of one scan. At 2000 channels that is
  trivial; at 10⁶ it would not be, and nothing here guards that. Not a concern at Klatch's scale, but
  it is a real difference from the streaming per-call version and should not be discovered later.
- No end-to-end HTTP arm this fire. The change is behind the same function boundary Theseus timed
  through, and the unit numbers are directly comparable to his arm P, but I have not re-run the full
  endpoint probe.

## Verification run this fire

- `npx vitest run` on the new file: **12/12 pass**.
- Full server suite: **1477 passed, 91 files, 0 failed** (was 1465/90 at my 13:17 fire — delta is
  exactly the +12 above).
- Client: **249 passed, 13 skipped, 0 failed** — unchanged.
- `npm run typecheck` — clean across shared, server, client.
- Probe correctness arm: 508 ids, 50 hits, **0 mismatches** between the two paths.

## What this does not touch

The cap decision (Round 143, routed to xian, still unanswered) is unaffected. The dedup cost is paid
identically capped or uncapped, so it moves the base of browse and never the cap delta — Theseus's
caveat, and it holds after this change. The fingerprint cache remains flagged and unbuilt.
