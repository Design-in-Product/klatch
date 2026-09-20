# Daedalus session log — 2026-09-20 (START fire)

**Agent:** Daedalus · **Model:** Opus 5 · **Worktree:** `/Users/xian/Development/klatch-worktrees/daedalus` · **Branch:** `claude/daedalus-cycle`

---

## 09:17 — Briefing

Wrapper synced the worktree to `origin/main` at `57b8fa8c`. Read `docs/COORDINATION.md`
(my section at :208) and `ls docs/mail/`. One new memo addressed to me:
`theseus-to-daedalus-…-all-three-are-converted-and-your-unexplained-number-is-live-growth-2026-09-19.md`
(Round 238). Read in full.

Its §5 answers my Round 237 open item — the 536-vs-539 corpus count — as **live growth
plus the export group**, three observers on the same day, and the transferable point that
a corpus count is not quotable without its root set and timestamp. Accepted; no action.

Its §6 routes one thing to this seat: my two unlevered workarounds
(`probe-fingerprint-cache-endpoint`, `probe-browse-endpoint-vs-channel-count`), which he
declined as *"a pricing question before it is a build question, and it is yours."* Taking
it. Its §1 also suggests one change to `probe-browse-cold-figure-gap`, which is mine.

Today's day-part work unit: Round 239.

## 09:18 — Priced the two probes by reading them, not the memo

Read both. They are **not one class**, which my own Round 237 note got wrong:

- `probe-fingerprint-cache-endpoint` arm C restores `git show dba7699^` — it wants this
  binary with the cache off. Behaviour the code still has. **Leverable.**
- `probe-browse-endpoint-vs-channel-count` arm S inverse-transforms today's disk bytes to
  un-do the Round 145 hoist — it wants a behaviour the code no longer has.
  **Not leverable**, §6 of the writeup.

## 09:19 — FINDING: the cache probe is dead, and has been since the day after it was written

Drove it unmodified before touching it. It does not run:

```
!! packages/server/src/import/session-scanner.ts on disk is not byte-identical to dba7699;
   arm C would not be a clean A/B. Refusing to run.
```

exit 1, before a single arm. Verified from git rather than inferred:

- `git log --format=... -- scripts/probe-fingerprint-cache-endpoint.mts` → born
  `040c434a`, 2026-09-04.
- `git diff --stat dba7699 040c434a -- …/session-scanner.ts` → **empty**. So it worked
  at birth; it was not born dead.
- First scanner commit after it that is an ancestor of HEAD: `18d46318`, 2026-09-04.
  Six scanner commits since.

A pin to a commit, in a file expected to move, is a dead man's switch; a refusal is
indistinguishable in a sweep from a probe nobody ran.

## 09:20 — Built `KLATCH_FINGERPRINT_CACHE`

`resolveFingerprintCacheEnabled()` in `session-scanner.ts`, in the shape
`resolveFingerprintLineCap()` established. Read per call; explicit argument wins;
unrecognised values throw. Verified the throw reaches the wire by reading the call chain
(`getSessionFingerprint` at `:695` is outside the per-file `try/catch`, which only wraps
`statSync`) — not assumed from the Round 237 note. Off means neither read nor write, and
is a bypass rather than a flush; frozen in both modes so reuse is the only difference.

34 tests, `round239-the-fingerprint-cache-takes-an-override.test.ts`. **34/34.**

## 09:21 — Red capability, twice

1. Unwired lever (resolver exported, body ignores the flag): **4 of 34 fail**, exactly
   the bypass assertions. The 26 resolver tests cannot tell a wired lever from an inert
   one — same proportion and same lesson as Round 237.
2. Skip the read, keep the write — the subtler failure, *faster* in the expected
   direction, so a timing-only probe would never catch it: **3 of 34 fail**, led by
   `does not populate the cache`.

Ran the second because a comment in my own test file asserted that test would catch it.
A claim in a comment is still a claim. Restored; 34/34, and 62/62 with the two
neighbouring cache/cap suites.

## 09:23 — Converted the probe; first drive found a second staleness

Removed the `dba7699` pin, the wholesale restore, `restoreScanner()` and the exit hook
(Round 237: a restore with no patch outstanding can only overwrite someone else's
concurrent edit and report success). Arm C now spawns the shipped binary with
`KLATCH_FINGERPRINT_CACHE=off`. Strict typecheck clean.

First drive: arm C **live for the first time since 9/04** — 211x, 2810 ms saved. But
**arms E and F red**: `scratch session is visible in the browse payload — not found`.

Diagnosed rather than explained away: the probe writes to
`packages/server/exports/sessions`; `scanExportedSessions` (`:748`) joins
`<repoRoot>/exports/sessions`. Correct when the probe was written (the scan took the
server's working directory); **stale since Round 234 moved it to the repo root**. Not
caused by my edit — my only env change deletes `KLATCH_FINGERPRINT_CACHE`.

And correcting the path alone would have been worse: the probe's non-empty guard vs
`exports/sessions/theseus-2026-03-22.jsonl` (present since 8/04, confirmed with `ls`)
would have made E/F skip on every real checkout, permanently.

Fixed with `KLATCH_EXPORT_ROOT` (Round 235): scratch export root under `.testdata/`.
Deleted the guard, `ownsExportDir`, and the skip path. Added **arm G**, isolation
asserted two independent ways with the negative half proven non-vacuous.

Also took Theseus's §1 addition here and in `probe-browse-cold-figure-gap`: not-setting a
lever now **deletes** it from the child.

## 09:25 — Re-drove: 16 checks, 0 failed, 0 skipped

Every arm of this probe has now run for the first time since it was written.

| | |
|---|---|
| cache off, every browse | **2844 ms** |
| cache on, first browse | **2888 ms** |
| cache on, every browse after | **13 ms** |
| saved per repeat browse | **2832 ms — 222x** |
| cost of filling the cache | **0.8%** of a cold browse |

Proof the lever bit: arm C's *"with the cache off, a repeat browse costs the same as the
first (no reuse existed)"* at **-0.7%**. Had the lever silently resolved to `on`, that
line would read 13 ms and every other arm would have stayed green.

## 09:26–09:30 — Controls

- Server suite **123 files · 1952 passed · 1 skipped** (was 122 · 1918 · 1 — +1 file,
  +34 tests, both mine). Client **unchanged**: 38 files (25 passed · 13 skipped) · **324
  passed · 13 skipped**.
- **Correction to my own method mid-fire:** my first `npm test 2>&1 | tail -25` printed
  only the *client* summary — the server summary had scrolled past, and I nearly had no
  server number at all. Re-ran unpiped into `.testdata/suite-239.txt` and read both
  summaries out of the file. Do not pipe what you intend to quote.
- `npm run typecheck` **0 errors**, 3 workspaces. Strict typecheck on both edited probes:
  0 errors.
- Ports 3001/5173 quiet, 0 stray processes. Repo `klatch.db` **1 channel, 0
  `probe-seed%`** — arm F's import went to the scratch DB under `.testdata/`. Scanner
  sha256 `d52bec53da15` identical at start and exit of every drive. **0 model calls.**

## 09:35 — Wrote up, filed, coordinated

- `docs/research/round239-the-fingerprint-cache-gets-a-lever-and-the-probe-it-revives-had-been-dead-since-the-day-after-it-was-written-2026-09-20.md`
- `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-i-priced-both-and-one-of-them-had-been-refusing-to-run-since-september-4-2026-09-20.md`
- `docs/COORDINATION.md` — Daedalus section updated.

Left the Theseus↔Daedalus round thread in `docs/mail/` rather than moving it to `read/`:
it is an active alternating thread and his §6 carries open items of his own (arm O's
noise band) plus four parked on xian.

## Verification — Session Wrap Protocol

Recorded below at close of fire.
