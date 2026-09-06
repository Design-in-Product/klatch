# Round 159 — the arm-S re-pin, built: what the dedup hoist is worth under the cache

**Theseus, 2026-09-05 (STOP fire)**
**Instrument:** `scripts/probe-browse-endpoint-vs-channel-count.mts` (Round 146's probe, re-pinned)
**21 checks (9 regression, 12 measurement), 0 failed, 0 skipped. Four independent full runs.**
**`git diff -- packages/` empty; `session-scanner.ts` sha256 `2ae9ecd1c431` identical before and after every run; `klatch.db` never opened; zero model calls.**

## Why this existed at all

Round 146's probe has been **refusing to run since 2026-09-04**, correctly. Its arm S got pre-hoist
code by restoring `afe0889^` **wholesale**, guarded by a check that the scanner on disk was
byte-identical to `afe0889`. Four commits have landed on that file since:

```
4602561  round149: the session scanner walks more than one Claude config root
e1ee197  correct the guard's headroom claim -- measured against the wrong corpus
18d4631  cap ruled removed (xian 9/4) + CI landed, path-filtered
dba7699  round147: cache browse fingerprints on (path, mtime, size, cap)
```

The obvious fix — re-pin `HOIST_COMMIT` at HEAD — is wrong, and wrong *quietly*: `afe0889^` is
missing all four, so the A/B would have measured **hoist + cache + cap + multi-root** and printed it
as the hoist. No error. A plausible number. `dba7699` alone is ~200× the effect under test.

I scoped the correct fix on 9/4 and then carried it, unbuilt, for three rounds. Daedalus offered to
take it in a WORK fire. **It is built.**

## The mechanism: arm V

Arm S no longer diffs against a commit. It applies the **inverse of the hoist** to the bytes on disk
today — three edits, five textual sites, each with an **asserted occurrence count**:

| # | edit | sites |
|---|---|---|
| 1 | `createChannelBySessionIdResolver` import → `findChannelByOriginalSessionId` | 1 |
| 2 | resolver construction + its comment block + trailing blank, in both scanners | 2 |
| 3 | `findChannel(sessionId)` → `findChannelByOriginalSessionId(sessionId)` | 2 |

Plus post-conditions: no `createChannelBySessionIdResolver` survives, no `findChannel(` survives,
exactly two per-call lookups exist, and the output differs from the input. Any count mismatch is a
refusal, not a partial transform.

**The transform is not trusted on its own say-so.** Arm V validates it against the hoist commit pair
*before anything is patched*: apply the same transform to `afe0889` and require the output to be
**byte-identical to `afe0889^`**.

```
transform applied to afe0889 reproduces afe0889^ byte-for-byte
  (12,763 bytes, sha256 d31e0352dc26)   — all four runs
```

**The commit pair became a test fixture for the transform rather than the source of the patched
bytes.** That is the whole trick, and it is the transferable part: when a controlled A/B's baseline
has drifted out from under you, don't re-pin the baseline — derive it, and use the old pin to prove
the derivation is exact.

Applied to today's disk: `2ae9ecd1c431` → `c7a5044c5497`, 27,373 → 26,784 bytes (−589).

## The headline: the hoist is now 96% of warm browse, not 13.7%

Four runs, 0 / 500 / 2000 seeded channels, 528 real sessions, real HTTP, `connection: close`,
median of samples 2–5 with sample 1 (cache-filling) reported separately.

| seeded channels | pre-hoist warm | hoisted warm | saving | **% of warm browse** |
|---|---|---|---|---|
| 0 | 19 / 19 / 21 / 20 ms | 7 / 8 / 7 / 7 ms | 12 / 10 / 13 / 13 ms | 56–66% |
| 500 | 69 / 68 / 69 / 68 ms | 8 / 8 / 8 / 8 ms | ~61 ms | 88.2–89.0% |
| **2000** | **222 / 218 / 218 / 220 ms** | **9 / 9 / 9 / 9 ms** | **212 / 210 / 208 / 211 ms** | **95.8–96.0%** |

Warm growth per 1000 imported channels: **pre-hoist +99 to +101 ms, hoisted +0 to +1 ms.**

**Round 146's 13.7% is stale in its denominator, not its numerator.** Its row was 1634 → 1409 ms,
−224 ms, at 2000 channels. The saving today is **208–212 ms** — the same quantity, well inside
cross-run agreement with 224 ms. What changed is what it is a share *of*: `dba7699` removed
re-fingerprinting from the warm path and did not touch the dedup scan, which was deliberately left
uncached because `alreadyImported` is a function of the database, not the file.

**So the cache did not make the hoist more valuable. It made the hoist's value visible.** Both
numbers were correct on the day. A percentage-of-total is a statement about the *other* work in the
total, and it goes stale when that work is optimised — which is a different failure mode from a
wrong measurement and does not announce itself.

## The cold column, which does not agree with the warm one

| seeded channels | % of **cold** (cache-filling) browse |
|---|---|
| 0 | −0.2 / +0.9 / +3.2 / +0.6 % |
| 500 | +0.1 / +5.0 / +7.4 / +2.6 % |
| 2000 | **+8.8 / +9.4 / +9.2 / +8.5 %** |

Cold browse is ~2.25 s in both versions; the same ~210 ms saving is 8.5–9.4% of it. **"The hoist is
96% of browse" and "the hoist is 9% of browse" are both true and differ only in which browse.** Since
`dba7699` there is exactly one cold browse per server generation and every browse after is warm, so
the warm figure is the one a user experiences repeatedly and the cold figure is the one they meet
once. Reported as two rows because a single blended percentage is now ambiguous, and that ambiguity
is precisely what made 13.7% read as stale rather than as scoped.

## A non-reproduction, reported open rather than smoothed over

Round 146 isolated **27 ms** of its 224 ms as present at 0 channels and not scaling with channel
count — the per-call lookup's fixed cost, one prepared-statement round trip per session *file*.

Re-measured: **12 / 10 / 13 / 13 ms — 0.37× to 0.48× of 27 ms — on MORE files** (528 now vs 508
then). The direction is wrong for a per-file cost: more files should mean more floor.

**The floor is real** — positive in all four runs, and at 0 channels it is 56–66% of the entire warm
browse, which is a genuinely surprising place for it to be. **Its Round 146 magnitude is not
confirmed.** The likeliest explanation is that 27 ms was 1.7% of a 1634 ms disk-bound browse and
inside that run's variance, whereas here the same quantity is ~60% of a 19 ms one — the same
"visibility, not value" effect as the headline, applied to my own earlier number instead of to the
percentage. **I have not tested that explanation** and am not asserting it; the alternative (the
floor genuinely shrank) is not excluded by anything here.

Round 146's arm-T annotation on this quantity read *"expect ~0"*. It was never ~0. That annotation is
now corrected in the probe.

## What did not change

**Arm U, behavioural identity, all four runs:** 528 sessions compared on `(sessionId,
alreadyImported, existingChannelId)`; **identical**, hoisted vs pre-hoist. 50 channels seeded to
genuinely match real corpus session ids; **50 came back already-imported in both**, so the check is
not trivially true. Same session count, same payload size (0.33 MB). The hoist is still a no-op at
the surface, now verified against today's cache/cap/multi-root scanner rather than against
September 3rd's.

## Limits, stated

- **One corpus.** `~/.claude/projects`, 528 sessions, 0.33 MB response. Not run against
  `~/.claude-pm/projects`, where the file count is 76 — and the floor is per-*file*, so the
  zero-channel component should be ~7× smaller there. **Not measured.**
- **Seeded channels are synthetic and non-matching** (`no-such-session-N`), so every pre-hoist lookup
  runs a full scan. That is the worst case and the common case for a user browsing un-imported
  sessions; a user whose channels mostly match would see less.
- **Page cache warmed by construction** — one discarded browse before any arm. These are parse and
  query costs, not disk.
- **The cold column is one sample per configuration** (sample 1 of 5), not a median. Its run-to-run
  spread at 0 channels (−0.2% to +3.2%) is consistent with that and should not be read as a trend.
- **The 27 ms non-reproduction is not diagnosed**, only bounded.

## Left open, named rather than finished

- **Why the zero-channel floor is half Round 146's** — variance-in-the-denominator vs a real
  reduction. Untested. A re-run of Round 146's probe at its own commit would settle it and is cheap.
- **The floor on the second corpus** — 76 files instead of 528; the per-file prediction is falsifiable
  and unrun.
- **The union cold browse** — unchanged from Rounds 155/157. Still arithmetic-not-a-measurement if
  the two single-root figures are added.
- **Whether ~1.9 s per server start on PM is acceptable** — xian's call, ruling already his.

## Provenance

Every figure above was measured this fire across four full runs of the instrument, except:
Round 146's 1634 / 1409 / −224 ms / 13.7% and its 27 ms floor and 508-file count, which are quoted
from `docs/dedup-hoist-at-the-endpoint-2026-09-03.md` and are the things being checked; and
Daedalus's 198.5 → 4.1 ms unit claim (`afe0889`), cited not re-derived. The two Round-146-comparison
checks were added after run 3 and appear in run 4 only — but they are computed from `savedAtK` and
`savedAtZero`, which were recorded in all four runs, and all four values are listed above.
