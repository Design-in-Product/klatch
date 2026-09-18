# Session log — Daedalus (Opus), 2026-09-18 WORK fire

**Worktree:** `/Users/xian/Development/klatch-worktrees/daedalus` · **Branch:** `claude/daedalus-cycle`
**HEAD at fire start:** `5c9ce3c5` (origin/main, wrapper-synced) · **Working tree clean at start**

---

## 13:17 — Briefing

Read `docs/COORDINATION.md` (Daedalus section, lines 201+) and `ls docs/mail/`. One memo new to
this seat since the START fire:

- **`theseus-to-daedalus-…-the-monotonicity-item-is-mine-and-built-and-my-first-version-of-it-was-false-by-design-2026-09-18.md`** (13:17 today). Three things for me: §3 the `remainder` verdict
  (he wants beyond-band-negative hard, and is right); §4 **`reapOnExit` — "if it is not landed by
  your next fire, I take it"**; §5 a gate finding about board-title-vs-roster-name filenames.
  His §1 monotonicity item is built and is his.

**This fire's item was §4.** My own START-fire log had already written "next fire or dropped," so
the clock was mine before he set one.

## 13:18 — Survey, before touching anything [VERIFIED]

`readdirSync` walk of `scripts/` + `scripts/lib/` (not grep — per the standing note that grep has
silently dropped files from globs here):

```
33 files spawn a child · 5 carry reapOnExit · 28 do not
```

Classified the 28 by shape rather than treating them as one list. 20 hold a long-lived
`packages/server`; of those, **13 already carry** `process.on('exit', killServer)` +
`process.on('SIGINT', …)` and **7 carry no handler of any kind**. The remaining 8 spawn probes,
`tsx watch` holders, or are the scratch server itself.

## 13:20 — Why I did not do the retrofit as listed

The item had been argued four rounds from **reading source**. The case against the 13 was a POSIX
reading — SIGTERM/SIGHUP/SIGPIPE default to terminate, a signal-terminated process skips its
`exit` listeners. I had no measurement. Built the instrument first:
`scripts/probe-round230-a-killed-probe-must-not-leave-its-server.mts`.

## 13:22–13:40 — The instrument printed PASS twice before it could print FAIL

**Vacuous green #1.** `spawn('npx',['tsx',subject])` + `process.kill(child.pid,'SIGPIPE')` signals
the **npx shim**, not the process holding the server. And node **ignores SIGPIPE by default** —
measured directly, a bare node child sent one printed `SURVIVED` and exited 0. Wrong process,
inert signal; the subject ran to completion and shut down normally and the control credited the
reaper.

**The tell was in output I had already printed and not read: `exit code 0, signal null`.**

**A self-correction inside the correction:** my first attempt to measure the EPIPE mechanism used
`node -e` with nested escaping, the child died of `SyntaxError` before running a line, and I read
its exit-1 as a finding ("`process.on('exit')` did not run!"). Caught it by printing the child's
stderr. Re-ran from a fixture file. **The "finding" was an artifact of a test that never ran.**

**Vacuous green #2.** Pid targeting fixed, signal switched to SIGTERM —
`probe-import-multipart-cap` still came up quiet. That result is real, but that *run* wasn't
entitled to it: multipart-cap brings its server up and then **finishes**, faster than the control
can notice the port and signal. Added `subjectReachedItsOwnEnding()`, which hard-skips (exit 3).

**What actually fixed the instrument was a negative control, not care.** A fixture spawning the
server exactly as the probes do with no handler at all — run as both `.cjs` and `.mts`, because
tsx's handling of the two was a live confound. Both leak.

## 13:40 — THE RESULT [VERIFIED, driven]

| subject | handlers | SIGTERM verdict |
|---|---|---|
| leaky fixture (`.cjs`, `.mts`) | none | **LEAK** — HTTP 200 still on 3001 |
| `probe-round213-reassign-live-http` | **none** | **LEAK** — HTTP 200 still on 3001 |
| `probe-import-multipart-cap` | `exit` + `SIGINT` | quiet |

The source reading was wrong in the direction that mattered. **The 13 do not leak on this path.**
**A real probe in the tree does** — which is the Round 221 incident itself.

## 13:45 — Retrofit: 7 files, not 22 [VERIFIED]

`reapOnExit(() => server)` in every probe with no handler at all — `multi-root-browse`,
`path-c-chat-binding-live`, `round162`, `round164`, `round166`, `round167`, `round213`
(`?? undefined` in multi-root, which types the handle `null`). Applied by a scripted edit with
per-file assertions, not sed; each file's spawn block had to match or it threw.

## 13:50 — ⚠️ The retrofit does not work, and I said so in the code

Re-drove `probe-round213` with `reapOnExit` in place: **still LEAK.**

Chased to a `ps` topology and stopped:

```
npx → node .bin/tsx <probe>.mts   (supervisor; ONLY process carrying the subject path)
        → node --require tsx/…     (THE PROBE — where handlers register)
           → npm exec tsx src/index.ts → node .bin/tsx → node (the listener)
```

**Ruled out so the remedy isn't in doubt:** `server.kill('SIGTERM')` on the npx shim takes the
whole chain down — `port 3001: quiet`. The reaper works when it runs.

**I had already written a comment into all 7 files claiming the line fixed the leak. It does not.
Rewrote the comment in all 7** before committing — that sentence would have been the exact
sentence-level lie this project keeps cataloguing.

## 13:55 — A docstring correction I deliberately did NOT make

`probe-server-ownership.mts` records Round 221 as "pipe closed → node took SIGPIPE → `shutdown()`
never ran." Measured on a fixture whose stdout pipe is destroyed mid-write:

| case | exit | `process.on('exit')` ran? |
|---|---|---|
| pipe closes, no handlers | code 1, uncaught `EPIPE` | **yes** |
| pipe closes, SIGPIPE listener | code 130 | yes |
| SIGTERM direct, no handlers | killed by signal | **no** |
| SIGHUP direct, no handlers | killed by signal | **no** |

A closed pipe is an uncaught **exception**, not signal death. The mechanism I can correct; the
account of Theseus's own incident I left for him — the reverse of Round 226, where I edited two of
his probes and told him after.

## 14:00 — Verification [VERIFIED this fire]

```
npm test (UNPIPED, exit 0)   server 119 files · 1884 passed · 1 skipped
                             client  25 files ·  324 passed · 13 skipped
strict typecheck, 8 files    0 errors
git status --porcelain packages/   empty
port 3001                    ECONNREFUSED (quiet) after every run
```

Suites match Theseus's 9/18 figures and Argus's v136. Every edit is under `scripts/`.
The control deliberately creates leaks, so it enumerates descendants from `ps` and SIGKILLs every
survivor in a `finally` — it reported reaping 2–3 on each red run, and printed
`containment: port 3001 quiet` every time. Zero model calls.

Scratch fixtures live in `.testdata/round230/` — gitignored, disposable, absent from
`git status`.

## 14:05 — Wrap verification (Session Wrap Protocol)

**Step 1 — commits landed.** `git log origin/main --oneline -5` after a re-fetch:

```
fc770e93 Round 230: the reaper we had been arguing from the source, driven -- and it is 7 files, not 22
e1615881 mail(daedalus->theseus): Round 230 reply -- reapOnExit taken, it is 7 files not 22, and it does not work yet
5c9ce3c5 log: Calliope 9/18 MID fire -- reboot-gate handoff written, self-corrected same fire
9568e059 handoff+coordination(calliope): fix missing third standing item, ground rules Q since 8/9
eb8c16c5 handoff(calliope): 2026-09-18 reboot gate file, requested by Janus's 24-red memo
```

Pushed `5c9ce3c5..fc770e93 HEAD -> main`.

**Step 2 — each deliverable present on `origin/main`** (`git ls-tree origin/main -r`, not a local
`ls`):

```
docs/mail/daedalus-to-theseus-…-i-took-reaponexit-and-it-is-seven-files-not-twenty-two-and-it-does-not-work-yet-2026-09-18.md
docs/research/round230-the-reaper-we-had-been-arguing-from-the-source-2026-09-18.md
docs/logs/2026-09-18-1317-daedalus-opus-log.md
docs/COORDINATION.md
scripts/probe-round230-a-killed-probe-must-not-leave-its-server.mts
scripts/probe-multi-root-browse.mts
scripts/probe-path-c-chat-binding-live.mts
scripts/probe-round162-preamble-drop-and-roster-live.mts
scripts/probe-round164-layer5-terminality-live.mts
scripts/probe-round166-terminal-floor-live.mts
scripts/probe-round167-floor-report-live.mts
scripts/probe-round213-reassign-live-http.mts
```

All 12 present. **Step 3 — this verification block pushed last**, after Steps 1 and 2.

**Not done this fire, stated rather than implied:**

- **Theseus's §3** — `NEGATIVE BEYOND NOISE` → hard FAIL and the soft states printing `NOTE`.
  Agreed with in full; his cut is better than mine. The round went elsewhere. First thing next.
- **Why the handler is not reached.** The one thing that closes `reapOnExit`. Offered to Theseus
  in the memo as a separable piece, but it is still mine unless he says otherwise.
- **The Round 227 cap-firing corpus against the rewritten arm O.** Neither of us has run it; he
  named it his clearest next probe and he is right.
- **The reboot gate counter.** Filename and presence on `origin/main` verified at the START fire;
  I still have not watched the gate print GREEN.
- **The backfill dry run — parked on xian since 2026-09-09, ten days.** Not re-memoed; the
  existing one is unanswered and a second adds no information.
- **Mail:** Theseus's thread stays in `docs/mail/`, not `read/` — §3 and the topology question are
  open action items.
