# The dedup hoist at the endpoint — Daedalus's number survives, and the slope is the real result

**Theseus, 2026-09-03 (STOP fire, Round 146)**
**Instrument:** `scripts/probe-browse-endpoint-vs-channel-count.mts` (exit 0; 14 checks, 8 measurements)
**Verifies:** `docs/dedup-lookup-hoist-2026-09-03.md` (Daedalus, Round 145, commit `afe0889`)
**Builds on:** `docs/browse-latency-end-to-end-2026-09-03.md` (Theseus, Round 144, arm P)

## Why this fire

Daedalus landed `createChannelBySessionIdResolver()` this afternoon and measured the dedup line at
**198.5 ms → 4.1 ms at 2000 channels**. He wrote his own limit down plainly:

> No end-to-end HTTP arm this fire — the unit numbers are directly comparable to your arm P, but I did
> not re-run your endpoint probe.

That is the gap this seat has now found three times (Round 141 arm F, Round 142 arm H, Round 144): a
value measured one layer below the surface it is described at. **My own arm P has it too** — I measured
the dedup slope by calling `findChannelByOriginalSessionId` directly, never through the route. And my
Round 144 headline ("browse is 98% fingerprinting, 29 ms remainder") was taken against a database with
**0 imported channels**, which is the left edge of the very table arm P then went on to draw.

So before this fire, nobody had measured what a user *with an import history* waits for.

A performance change also has to be a no-op at the surface, and nobody had checked that over HTTP
either. Daedalus's unit test compares resolver output against the per-call function; it does not check
that the browse payload a client renders is unchanged.

## Method

A/B over real HTTP against the same 512-session corpus, shipped cap throughout.

- **Hoisted** = the source as it stands on `main` (`afe0889`).
- **Pre-hoist** = the exact bytes of `session-scanner.ts` from `afe0889^`, restored from git,
  written to disk for the duration of one server generation, then restored and sha256-verified.
- The probe **refuses to run** unless the scanner on disk is byte-identical to `afe0889` — otherwise
  the "pre-hoist" baseline would not be a clean A/B.
- Two scratch DBs under `.testdata/`, seeded from the same deterministic id sequence so both versions
  see identical channel counts at every step (asserted: 1 / 501 / 2001 rows on both sides).
- 5 samples per configuration, first discarded, warm median reported. One discarded browse before
  anything, so the page cache is equally warm for both versions.
- `klatch.db` is never opened. Nothing under `packages/` is committed in the patched state.

**Debugging note worth carrying forward:** the first two runs died mid-measurement with
`SocketError: other side closed`. The cause was that `SIGTERM` is asynchronous — a previous server
generation was still answering the readiness probe when the next one had barely spawned, so the probe
was about to time **the wrong build**. A port that answers is not proof that the process you just
started is the one answering. The probe now waits for the port to be genuinely free *and* for the new
child to print its own listening banner before it measures. Any future probe that restarts a server on
a fixed port needs the same two conditions.

## Result 1 — the hoist reaches the endpoint, slightly larger than claimed

| seeded channels | pre-hoist | hoisted | saved |
|---|---|---|---|
| 0 | 1425 ms | 1399 ms | −27 ms (1.9%) |
| 500 | 1479 ms | 1421 ms | −58 ms (3.9%) |
| 2000 | 1634 ms | 1409 ms | **−224 ms (13.7%)** |

Daedalus's unit claim was ~194 ms of saving at 2000 channels (198.5 → 4.1). The endpoint gives back
**224 ms**. His number survives the trip to the wire, and if anything it is understated — the same
direction the Round 144 check went for the cap figure.

**The two numbers reconcile almost exactly.** 27 ms of the 224 is present at 0 channels, so it does not
scale with channel count. The channel-scaling portion is 224 − 27 = **~197 ms against a unit claim of
194 ms** — within 2%. That the constant and the slope separate this cleanly is the strongest evidence
the attribution is right, and it is the same self-validation shape as Round 144 arm O.

## Result 2 — the slope is the finding, not the point measurement

**Pre-hoist: +104 ms of browse latency per 1000 imported channels. Hoisted: +5 ms per 1000.**

That is the O(files × channels) → O(files + channels) shape change, visible at the user-facing surface
rather than inferred from the code. Read forward, on this 512-session corpus:

| imported channels | pre-hoist browse | hoisted browse |
|---|---|---|
| 0 | ~1.43 s | ~1.40 s |
| 2 000 | 1.63 s (measured) | 1.41 s (measured) |
| 5 000 | ~1.95 s (extrapolated) | ~1.43 s (extrapolated) |
| 10 000 | ~2.47 s (extrapolated) | ~1.45 s (extrapolated) |

The extrapolated rows are linear projection from a two-point slope, not measurement — flagged as such.
The measured rows are the claim.

**The practical consequence for the cap decision in front of xian:** browse latency is now
approximately independent of how much the user has imported. Before the hoist, the cap trade-off
("1.42 s → 2.13 s") was a number that got worse in a second dimension nobody had priced — a user with
5 000 imported channels was reading a different trade than the one they were shown. After the hoist it
is one number. I did not re-measure the capped-vs-uncapped delta this fire, so I make no claim that the
delta itself moved; what I measured is that the **base** it sits on has stopped growing.

## Result 3 — the 27 ms constant is real, and larger than arm P predicted

At 0 seeded channels the two versions still differ by 27 ms. That is not the unindexed scan — with one
channel row there is nothing to scan. It is the per-file `getChannel(sessionId)` primary-key lookup:
512 prepared-statement round trips that the resolver replaces with one `Map` build.

Arm P measured 11 ms for 508 of those lookups in a tight loop. Through the route it costs 27 ms.
**Hypothesis, not measured:** the endpoint interleaves ~1.4 s of file reading between consecutive
lookups, so statement and page-cache locality is worse than in a tight loop. I did not test this and it
should not be quoted as fact. What is measured is the 27 ms.

The general lesson is the one this seat keeps re-finding: **a cost measured in a tight loop is a lower
bound on the same cost measured in situ.** Arm P was not wrong, but it was optimistic, and my Round 144
"29 ms remainder" figure inherits the same optimism.

## Result 4 — behaviourally identical at the surface, non-trivially

With 50 channels seeded to genuinely match real corpus session ids (so `alreadyImported` is true for a
real subset, not vacuously false everywhere):

- **512 sessions compared** on `(sessionId, alreadyImported, existingChannelId)` — the exact tuple that
  drives the import UI. Byte-identical between the two versions.
- **50 sessions came back already-imported in both** — the check is not trivially true.
- Same session count, same 0.32 MB payload.

This is the arm Daedalus's unit test cannot provide: identity of the *rendered payload*, not identity
of a function's return value.

## Honest limits

- One machine, one corpus (512 sessions / ~0.32 MB payload), warm page cache throughout. No cold-cache
  measurement, as in Round 144.
- Seeded channels are synthetic and uniform. A real corpus with fatter `source_metadata` makes the
  per-call column worse and the resolver's build scan somewhat worse. Daedalus flagged this same limit;
  I have not closed it either. Read the slope as shape, not constant.
- The 500 and 2000 rows are two points; the "per 1000 channels" slope is a two-point fit. The 5 000 and
  10 000 rows are extrapolation and labelled as such.
- Only three K values, and only the shipped cap. I did not cross the channel-count sweep with the
  cap-removed configuration, so I cannot say whether the two interact. I would expect not — they are
  independent costs — but that is reasoning, not measurement.
- Arm U's matching set is 50 of 512 sessions (~10%). A corpus that is mostly already-imported would
  exercise the resolver's `byId` path harder than this does.
- Run-to-run variation on the warm medians is roughly ±15 ms (visible in the sample arrays), so the
  27 ms constant at K=0 is above noise but not by a wide margin.

## What is not changed

Nothing under `packages/`. `git diff --stat -- packages/` is empty, and the probe's own sha256
assertion confirms `session-scanner.ts` is byte-identical to what it read at start. Zero model calls.
No test run is claimed because no product code changed; the empty diff is the stronger evidence.
