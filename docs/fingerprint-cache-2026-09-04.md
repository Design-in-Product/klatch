# Round 147: the browse fingerprint cache — 1430 ms → 7 ms at the endpoint

**Author:** Daedalus · **Date:** 2026-09-04 (START fire)
**Origin:** Theseus, `docs/browse-latency-end-to-end-2026-09-03.md` (Round 144) and
`docs/dedup-hoist-at-the-endpoint-2026-09-03.md` (Round 146)
**Code:** `packages/server/src/import/session-scanner.ts` (commit `dba7699`)
**Instrument:** `scripts/probe-fingerprint-cache-endpoint.mts` (14 checks, 0 failed)
**Tests:** `packages/server/src/__tests__/round147-fingerprint-cache.test.ts` (10/10)

## What was wrong

Browse fingerprints every session file on every visit to the import screen.
`extractSessionFingerprint` streams and JSON-parses up to 1500 lines per file, and Theseus
measured browse as ~98% that work. The files are append-only Claude Code transcripts and are
overwhelmingly unchanged between two browses, so nearly all of that is re-parsing bytes that
have already been parsed.

This was flagged as a follow-on in Round 143 and left unbuilt on purpose through Rounds 144–146:
it is a design change, and the dedup scan (Round 145) had to be fixed first or the cache would
have landed onto a floor that was not a floor.

## The design

`getSessionFingerprint(path, stat, lineCap)` returns a previous result when the file is provably
unchanged. `extractSessionFingerprint` is untouched and still pure — two test files and five
probe scripts call it directly, and they should keep measuring the real thing.

Validity is `(mtimeMs, size, lineCap)`. Three decisions inside that are load-bearing:

**1. The dedup fields are not cached.** `alreadyImported` / `existingChannelId` /
`existingChannelName` are functions of the *database*, not of the file. Caching them alongside
the fingerprint — the obvious move, since they arrive together in `SessionInfo` — would leave
the browse screen calling a just-imported session unimported until its file happened to change.
That is a user-visible correctness bug with no natural repair, and it is the trap this design is
shaped around. They stay live on every scan, which is affordable only because Round 145 hoisted
that lookup out of the per-file loop. Pinned by a unit test and by arm F at the endpoint.

**2. `lineCap` is part of validity, not just `(path, mtime, size)`.** The cap is under an open
decision routed to xian (Round 143). If it is raised or removed, every cached `capped: true`
entry becomes a stale *undercount* for a file that never changed — mtime and size cannot see
that, because nothing about the file moved. Keying on the cap makes a cap change
self-invalidating, so whichever way xian rules, no stale count survives the change.

**3. One entry per path, not per version.** A changed file overwrites its own entry. The map is
bounded by the number of distinct session files this process has seen, not by how often they
change — so an actively-appended session (exactly the one a user browses most) re-keys in place
instead of adding a row on every browse.

Returned objects are frozen. The same object is handed to every later caller, and a caller that
mutated it would corrupt the cache for everyone after it.

## Measured — at the endpoint, over real HTTP

Theseus's Round 146 instruction, taken literally: *"when you size that cache, size it at the
endpoint."* Nothing below is measured beneath HTTP.

516-session corpus (531.2 MB) under `~/.claude/projects`, shipped cap, Apple M1 Max, scratch DB
under `.testdata/`, page cache pre-warmed before any arm.

| build | first browse | every browse after |
|---|---|---|
| pre-cache (`dba7699^`) | 1468 ms | **1430 ms** (median of 5) |
| cached (`dba7699`) | 1477 ms | **7 ms** (median of 5) |

**Steady-state browse: 1430 ms → 7 ms, a 204× cut, saving 1423 ms per repeat browse.**

The pre-cache column is a real A/B, not an assumption: the pre-cache `session-scanner.ts` is
restored from `git show dba7699^` for the duration of one server generation and restored
afterwards, sha256-verified. The probe refuses to start unless the file on disk is byte-identical
to `dba7699`.

**The cache fill is free.** Cached-build cold browse 1477 ms vs pre-cache 1468 ms — 0.7% apart,
inside run-to-run noise. Filling the cache costs nothing measurable; the first browse is the
browse you always had.

## The floor is 7 ms, not the 29 ms we have all been quoting — and Theseus predicted the direction

Round 144 put the non-fingerprint remainder of browse at 29 ms, and Rounds 145 and 146 both
reasoned against that figure. Measured directly, it is **7 ms** — 4× lower.

The reason is exactly the optimism Theseus identified in Round 146, with its sign flipped by a
subtraction. His remainder was computed as `endpoint − fingerprint_cost`, with the fingerprint
cost timed in a tight loop. His own Round 146 lesson is that a tight loop *underestimates* a cost
measured in situ. Underestimate the subtrahend and you overestimate the remainder. So:

- His lesson said arm P's 11 ms was a lower bound → in situ it was 27 ms. Confirmed.
- The same lesson says the 29 ms remainder was an *over*estimate → measured, it is 7 ms. Confirmed.

The transferable form is narrower than "tight loops are optimistic": **a cost obtained by
subtraction inherits the error of the term subtracted, inverted.** The 7 ms here is measured
directly rather than by difference, which is why it can settle the question. It is also not a
pure remainder — it still contains the dedup resolver build, 517 `statSync` calls, the directory
walk, 0.30 MB of JSON serialisation, and the HTTP round trip.

## A confound I introduced and caught, worth carrying forward

The first run of this probe reported the cached build's cold browse at 1870 ms against the
pre-cache build's 1460 ms and flagged a **28% regression that does not exist**. The cached
generation ran first and paid to pull 531 MB off disk; by the time the pre-cache generation ran,
the OS page cache was holding all of it. The arm order *was* the finding.

Fixed by reading every corpus byte once before any arm, after which the same comparison reads
0.7%. Recording it because the failure was quiet and plausible — a 28% regression on first browse
is exactly the shape of a real cache-fill cost, and it would have been easy to write up. **Any
A/B over a multi-hundred-MB corpus needs the page cache equalised before the first arm, not
between arms.**

## What this does to the cap decision in front of xian

The cap trade xian was handed (Round 143) was: browse 1.39 s → 2.03 s on every browse, in
exchange for exact turn counts on the only sessions where depth matters. **Under the cache that
cost is paid once per server start rather than on every browse**, because the warm path is a Map
hit that does no line reading at all.

**This is reasoning from the code plus the measured 7 ms, not a measurement of the uncapped
configuration.** I did not run an uncapped arm at the endpoint this fire — the cap is a module
constant that the scan callers do not thread, so measuring it would mean patching in a build that
does not exist. What is measured is that the warm path is cap-independent by construction (a Map
hit keyed on the cap) and costs 7 ms. The prediction that follows is:

| | first browse | every browse after |
|---|---|---|
| capped + cache | 1.48 s (measured) | 7 ms (measured) |
| uncapped + cache | ~2.1 s (predicted, from Round 143/146) | 7 ms (predicted) |

**xian — I am not re-opening the decision, and I am not asking you to re-read it.** The
recommendation from Round 143 is unchanged. What has changed is the price: the regression you
were asked to accept is now a one-time cost at server start instead of a cost on every visit to
the import screen. If it was close before, this should make it less close. If you had already
ruled, nothing here reverses it. Measuring the uncapped arm at the endpoint is the obvious next
probe and I have not done it.

## The open decision I am NOT taking: persistence

The cache is in-memory and per-process. Every server restart pays the full 1.48 s cold browse
again. For a user launching the app that is once; under `npm run dev` it is often.

Persisting it in SQLite would make even the first browse fast and would make the cap question
moot at any corpus size. I have not built it, and there is a fact that bears on the decision:

**CLAUDE.md's Database section is stale.** It states "currently at 6" tables and lists six. The
schema in `packages/server/src/db/index.ts` has **eight** — the list omits `files` (`:288`) and
`file_refs` (`:298`). Verified by `grep -n "CREATE TABLE"` this session, not recalled.

That matters because CLAUDE.md's own rule is "add Drizzle when we hit 8+ tables." **We are
already at 8.** So a `session_fingerprints` table is not a free seventh table — it is the ninth,
and it lands on the far side of a threshold the project set for itself and has not noticed
crossing. That is a decision for xian and the team, not one to fold into a performance commit.
I have not edited CLAUDE.md (shared doc, out of this lane) — flagging it for whoever owns it.

Non-SQLite options exist (a JSON sidecar under the existing files directory) and would dodge the
table question entirely. I have not designed either. The in-memory half is the smallest working
increment and needs no decision from anyone, which is why it is what shipped.

## Verification run this fire

- New test file alone: **10/10 pass**.
- Server suite: **1487 passed, 92 files, 0 failed** — was 1477/91 at my 9/3 STOP fire; delta is
  exactly the +10 above.
- Client: **249 passed, 13 skipped, 0 failed** — unchanged.
- `npm run typecheck` — clean across shared, server, client.
- Probe: **14 checks, 0 failed**, including payload identity across 517 sessions (arm D),
  invalidation on append through the route (arm E), and dedup freshness across an import with the
  file untouched (arm F).

## Honest limits

- One machine, one corpus (516 sessions / 531.2 MB), warm page cache throughout. No cold-cache
  measurement — and note that under the cache the cold-cache case is now the *only* case where
  browse latency is visible at all, so it matters more than it used to and I have not measured it.
- The 7 ms warm figure is a median of 5 on one server generation. Run-to-run spread across the
  samples was 6–9 ms; I did not run multiple generations.
- **Concurrent browses are not deduplicated.** Two simultaneous first-browses both miss and both
  fingerprint the whole corpus; the result is correct (identical values, last write wins) but the
  work is done twice. Not worth a promise-map for a single-user local tool, but it is a real
  property and should not be discovered later.
- Cache entries for deleted files are never evicted. Bounded by real filesystem history over one
  process lifetime, so not a concern at Klatch's scale — but there is no eviction policy at all,
  which is a deliberate simplification and not an oversight.
- Validity cannot distinguish a file rewritten to the identical byte length within a single mtime
  tick. `stat.mtimeMs` carries sub-millisecond resolution on APFS (observed `...825.5498`), so the
  window is narrow, but it is not zero. Impossible for append-only JSONL; recorded because a
  future writer of these files might not be append-only.
- Arms E and F use a scratch session under `packages/server/exports/sessions/`, and the probe
  refuses to run them if that directory already has content. On a machine with real exported
  sessions those two arms will skip rather than run.
- The uncapped-plus-cache row in the cap table is predicted, not measured. Labelled as such above.
