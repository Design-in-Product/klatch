# Browse latency at the surface it's described at — Round 144

**Theseus, 2026-09-03 (WORK fire).**
Instrument: `scripts/probe-browse-latency-end-to-end.mts` (exit 0, 12 checks, 7 measurements).
Prior round: `docs/scan-cap-latency-2026-09-03.md` (Daedalus), `scripts/probe-scan-latency-vs-cap.mts`.

## Why this round exists

Daedalus routed a decision to xian this morning in these words:

> browse goes 1.39 s → 2.03 s on a 506-session corpus, in exchange for exact depth counts on the
> only sessions where depth matters

That sentence is user-facing — "browse" is a screen and those are seconds a person waits. The
measurement behind it sums `extractSessionFingerprint` calls in-process. The browse **endpoint** does
more than fingerprint: a readdir per project dir, a `statSync` per file, a per-file dedup lookup
against SQLite (`session-scanner.ts:271`), then `scanExportedSessions`, a `guessEntityName` per
session, and JSON serialisation of the payload (`routes/import.ts:48-75`).

This is the same class of gap as Round 141 arm F (`entityGuess` typed but never on the wire) and
Round 142 arm H (`turnCount` same): **a value measured one layer below the surface it is being
described at.** Nobody had timed the endpoint. Daedalus's probe never starts a server; my Round 142
arm H fetched the endpoint for correctness without timing it.

I expected the endpoint to carry meaningful non-fingerprint cost, which would have made the real
regression a smaller *fraction* of browse than +46% and the decision easier.

**I was wrong. The endpoint is 98% fingerprinting.** Reporting it as a negative result because the
conclusion is that xian should rule on Daedalus's number exactly as he stated it.

## What was measured

Real HTTP against a spawned server on :3001, scratch DB via `KLATCH_DB`, corpus read-only. Timing
spans request issued → body fully read → `JSON.parse` returned, because the client can't render a row
until the parse completes. Five samples per configuration; first reported separately, median of the
remaining four used.

The uncapped HTTP arm required changing `FINGERPRINT_LINE_CAP` for the life of one server process —
the product call sites deliberately don't pass `lineCap`. The probe captures the file's bytes and
sha256 at start, restores in a `finally`, and asserts byte-identity before exit; it exits 1 if the
restore failed. Nothing was committed in the patched state.

### Headline

| | fingerprint sum (in-process) | browse endpoint (real HTTP) |
|---|---|---|
| cap 1500 (shipped) | 1388 ms | **1417 ms** (first 1486) |
| uncapped | 2057 ms | **2129 ms** (first 2138) |
| delta | +669 ms | **+712 ms (+50%)** |

Corpus: 508 sessions / 549.9 MB across 16 projects. Payload 0.31 MB.

**Decomposition:** browse 1417 ms = fingerprint 1388 ms (98%) + everything else 29 ms (2%).

**The decomposition is self-validating.** If browse = fingerprinting + a fixed remainder, then
removing the cap should move the endpoint by exactly the fingerprint delta. Predicted 2086 ms,
measured 2129 ms — **2.0% off**. The attribution holds; the remainder really is fixed and really is
small.

### Independent reproduction of Daedalus's figures

Second instrument, my own harness, same shipped function:

| | Daedalus (506 files) | Theseus (508 files) |
|---|---|---|
| cap fires on | 11 files (2.2%) | 11 files (2.2%) |
| turns capped → uncapped | 815 → 1980 (41.2%) | 817 → 1989 (41.1%) |
| cost of removing the cap | +645 ms | +669 ms |

The corpus grew by two sessions between his fire and mine, which accounts for the drift. **His
numbers replicate.**

## What this changes about the decision in front of xian

**Nothing, and that's the finding.** The trade is +712 ms of real waiting for +143% of turn signal.
The number he was given was measured in the right units after all, and it is if anything slightly
understated (+712 measured end-to-end vs +645 quoted).

I have no product call to add beyond what's already on his seat. My Round 143 input to Iris stands
unchanged: the `+` marker question is real if the cap stays, and dissolves if it goes.

## Two things the decomposition exposes that weren't visible before

### 1. The fingerprint cache isn't an optimisation, it's a 48× cut

Daedalus flagged the durable fix and didn't build it: don't re-scan unchanged files; `(path, mtime,
size)` is a sound cache key because fingerprints are a pure function of content. He described it as
taking "steady-state browse toward zero."

The decomposition prices it. **The floor is 29 ms** — that's the whole non-fingerprint endpoint, and
a cache still pays the `statSync` that sits inside it. So the cache takes browse from 1417 ms to
roughly 29 ms: **a 48× cut, not a marginal win.**

That reframes the cap decision as a sequencing question rather than a trade. Removing the cap costs
+712 ms *of a cost that the cache deletes outright*. If the cache is going to be built, the honest
read is that the cap is a temporary tax on accuracy to defer a fix that removes both the tax and the
thing being taxed.

**Not my call to make** — this is a real design change and belongs in a decision, exactly as Daedalus
said. But the 48× is measured and it wasn't in front of xian when he was asked to rule.

### 2. The dedup lookup is an unindexed full-table JSON scan, and it's the cost that *becomes* browse

`findChannelByOriginalSessionId` (`queries.ts:1365`) tries the primary key, then falls back to:

```sql
SELECT * FROM channels
WHERE json_valid(source_metadata)
  AND json_extract(source_metadata, '$.originalSessionId') = ?
```

There is no index covering that predicate — `grep 'CREATE INDEX' packages/server/src/db/index.ts`
returns three, all on `message_artifacts` and `file_refs`. So each browsed file pays a full scan of
`channels` with a JSON parse per row, and browse runs it **once per session file**. The cost is
O(files × channels).

Measured, 508 lookups against a seeded scratch DB:

| channels | total | per lookup |
|---|---|---|
| 0 | 11 ms | 21 µs |
| 100 | 19 ms | 37 µs |
| 500 | 56 ms | 111 µs |
| 2000 | 201 ms | 396 µs |

Linear in channel count, as the code shape predicts.

**This is invisible today and that's the trap.** The repo's `klatch.db` has 2 channels, 0 with an
`originalSessionId` — so my 29 ms remainder, and any reading anyone takes on a dev machine, is
measured at the left edge of that table. A user who has actually imported 2000 conversations pays
201 ms on a 508-session corpus, and it scales in *both* dimensions: 2000 sessions × 2000 channels is
~790 ms.

Right now this hides entirely behind the 1388 ms of fingerprinting. **After the fingerprint cache
lands, it is browse latency** — 201 ms against a 29 ms floor.

Two obvious shapes, neither of which I've implemented (implementation is Daedalus's seat):

- An index on the extracted `originalSessionId` (SQLite supports indexes on expressions), or
- Hoist the lookup out of the loop — one scan building a `Map<originalSessionId, Channel>` before
  the file walk, instead of 508 scans inside it. Same result, one table scan total, no schema change.

The second is strictly cheaper to ship and doesn't touch migrations. I'd want Daedalus to pick.

## Honest limits

- One machine, one corpus, warm page cache throughout. Same limits Daedalus named; I inherit them.
- The 98%/2% split is measured against a **scratch DB with 0 real channels**. Arm P is exactly the
  correction for that, and it says the split moves with imports — at 2000 channels the remainder is
  201 ms — the remainder becomes 29 − 11 + 201 = 219 ms and browse ~1607 ms capped, not 1417 ms.
  The *delta* from removing the cap
  is unaffected (the dedup cost is paid identically either way); only the base moves.
- Arm P seeds synthetic ids that never match, so every lookup runs the full scan. That's the worst
  case and also the common case — browse's job is showing you sessions you haven't imported.
- The client-side render cost after `JSON.parse` is not measured. Payload is 0.31 MB, so I'd expect
  it to be small, but I have not checked it and am not claiming it.
- Cold-cache behaviour is not measured. First-sample readings (1486 / 2138 ms) are warm-ish, not cold.

## Reproduce

```bash
npx tsx scripts/probe-browse-latency-end-to-end.mts   # needs port 3001 free
```

Zero model calls. Scratch DB under `.testdata/browse-latency-e2e/`; `klatch.db` untouched. Arms L, N
and O skip with a note (not a silent pass) if 3001 is occupied; arms M and P still run.
