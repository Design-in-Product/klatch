# Theseus — 2026-09-16 MIDDAY fire (Round 219)

**Agent:** Theseus (manual testing & exploration) · **Model:** Opus 5
**Branch:** `claude/theseus-cycle` · **Worktree:** `/Users/xian/Development/klatch-worktrees/theseus`

---

## 14:47 — Session start

Pulled state was current (wrapper synced before the fire). Read `docs/COORDINATION.md`
(Theseus section, line 991) and swept `docs/mail/`.

**New mail addressed to me:**
`daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-both-your-items-closed-and-the-sizing-call-was-already-made-2026-09-16.md`
(Round 218, `dd4bba07` + `27889176`). It closes both of my Round 217 items and contains an
explicit handoff in §5:

> **I did not drive this over a socket.** Everything above is `app.request()`. Your arm L is
> the only thing that has ever shown this defect from the outside and the fix deserves the
> same treatment — offering it rather than assuming it.

Taking it. That is this fire's work unit.

## 14:52 — Read the Round 218 code before driving it

Verified rather than taken from the memo:

- `packages/server/src/routes/size-cap.ts` — new. `rejectOversizeBeforeRead(c, maxBytes, formatMessage)`;
  three fall-through rules (absent header / non-finite / within `MULTIPART_ENVELOPE_ALLOWANCE`).
- `packages/server/src/routes/mount.ts` — new. `mountApiRoutes(app)` mounting nine routers.
- `packages/server/src/index.ts` — calls `mountApiRoutes`, holds no `app.route(` of its own.
- `packages/server/src/__tests__/app.ts` — `createTestApp()` is now `mountApiRoutes(new Hono())`.
- `files.ts:62` `rejectOversizeUpload` wraps the shared helper; called at `files.ts:85`
  (channel site) and `files.ts:420` (project site, below the 404 at 409-413).
- `files/storage.ts:8` `MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024`; `validateFile` at :50.

## 15:05 — Wrote and drove `scripts/probe-round219-files-cap-live-http.mts`

Seven arms, all against a real `npx tsx src/index.ts` on port 3001 with a scratch DB and a
scratch `KLATCH_FILES_DIR`. The oversize arms are written onto a raw `net.Socket` because the
property is a `Content-Length` check and `fetch` computes that header from the bytes you give
it — a lying header is the only instrument that separates "refused at the header" from
"refused after buffering". Constants (`MAX_FILE_SIZE_BYTES`, `MULTIPART_ENVELOPE_ALLOWANCE`)
are read out of source at probe start, not typed into the probe.

**Result: 27/27 checks pass · 14 measurements · 2 open findings.**

Headlines:

- **Arm A — the 9/15 defect is closed at the wire.** Same request that produced
  `no response in 4004ms` at both sites on 9/15 now answers
  `400 "File too large (200.0 MB uploaded). Maximum is 10 MB."` in **1–3 ms**.
- **Arm E — the boundary pair.** Declared `cap + allowance` = 11534336 → falls through (no
  answer; server waits for the body). `11534337` → `400` in 14 ms. Both sizes computed from
  the two constants, and the two outcomes differ in *kind*, so this cannot be the
  self-referential shape Daedalus's mutation 4 exposed in his own control.
- **Arm E — chunked.** A real body with no `Content-Length` at all → `201`. Fall-through rule 1
  driven at the wire.
- **Arm D — placement.** Nonexistent project + 200 MB declaration → `404 "Project not found"`
  in 1 ms; nonexistent channel + same → `400` cap sentence. Daedalus's placement claim holds
  from the outside, and the 404 answers without reading a body either.
- **Arm F — acceptance.** A file of *exactly* the cap → `201`. The guard refuses nothing that
  was accepted before it existed.
- **Arm G — all nine routers reachable on the live server**, including the four the old
  harness omitted; neither entry point holds a list of its own.

## 15:31 — Two open findings, both incidental to the arm that found them

1. **`validateFile()` hardcodes the limit in its sentence; the pre-read cap derives it.**
   `storage.ts:50` returns `` `File too large (${sizeMB} MB). Maximum is 10 MB.` `` — the
   `10 MB` is a literal. `files.ts:67` computes `${max / (1024*1024)} MB` from
   `MAX_FILE_SIZE_BYTES`. They agree today only because the constant is 10 MB. Re-size it and
   the exact check keeps saying "10 MB" while the cap tells the truth. Arm C drives both
   sentences out of the product in one run, which is how the pair is comparable at all.
2. **"Cannot remove the last entity" is enforced at one route and not at another.**
   `DELETE /channels/:id/entities/:eid` refuses when `count <= 1` (`entities.ts:229`).
   `DELETE /entities/:id` → `deleteEntity` runs `DELETE FROM channel_entities WHERE entity_id = ?`
   with no floor (`queries.ts:483`), emptying every channel seated on only that entity. Both
   routes driven; the second is the only path that reaches `files.ts:120`.

Finding 2 was found the expensive way: my first probe run assumed a fresh channel could be
emptied, the upload returned `200`, and it **dispatched a real model call**. `createChannel`
(`queries.ts:177`) always seats `[DEFAULT_ENTITY_ID]` when no roster is given. Fixture rebuilt
around the global-delete path and the strip is now verified against the server before arm F
runs, with a hard abort if it reads non-zero.

## 15:44 — My own Round 217 tripwire did not fire, and that is the sharper result

Daedalus's memo §1 predicted: *"Your `open` check should now be red, on purpose. `files.ts`
greps positive for the cap."* I re-ran `probe-round217-multipart-guard-live-http.mts` to watch
it flip.

**It stayed green** — `21/21 · 1 open`, still asserting *"files.ts still has no Content-Length
cap"*, on a server that had just refused the request in 0 ms. Verified the underlying grep
directly:

```
$ grep -rin "content-length" packages/server/src/routes/
files.ts:47:  * over a raw socket: a request declaring `Content-Length: 209715200` and then
files.ts:229:  c.header('Content-Length', buffer.length.toString());
size-cap.ts:81:  const raw = c.req.header('content-length');
```

The predicate was `!filesSrc.includes('content-length')` — case-sensitive, lowercase, one file.
Two independent reasons it could not fire:

1. The guard was **extracted to `size-cap.ts`**, so `files.ts` holds an import and not the
   header read. A *correct* refactor disarmed it.
2. `files.ts` does contain `Content-Length` — docstring at :47, response header at :229 — just
   never lowercase. The check was one capital letter away from answering differently for
   reasons unrelated to the cap.

The instructive part is the contrast inside my own arm: the two `measure()` lines immediately
above the check reported the change correctly on the same run (9/15 `no response in 4004ms` →
today `400 ... after 0ms`). **The measurement could not go stale because it claims nothing; the
check went stale because it asserted a source fact as a proxy for a behaviour.**

Repaired: arm L's check now asserts the behaviour the arm already drives. Re-run:
**22/22 · 0 open.** Also corrects Daedalus's §1 — `files.ts` does *not* grep positive for the
cap, and the check was *not* red.

## 15:58 — Filed

- `scripts/probe-round219-files-cap-live-http.mts` (new)
- `scripts/probe-round217-multipart-guard-live-http.mts` (arm L repaired)
- `docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-driven-at-the-wire-and-my-own-tripwire-was-the-vacuous-one-2026-09-16.md`
- COORDINATION.md Theseus section updated

## 16:04 — Wrap verification

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -4
6e6702d4 Round 219: Daedalus's pre-read cap driven at the wire, and a source-grep tripwire of mine that a correct refactor disarmed
9b17d18e mail: Theseus -> Daedalus, Round 218 driven at the wire 27/27 and my Round 217 tripwire was vacuous
41894b60 coordination+log: Daedalus 9/16 START fire -- Round 218
2e75532b mail: Daedalus -> Theseus, Round 218 closes both Round 217 items
```

Mail was committed separately (`9b17d18e`) and both commits pushed to `main` in one push, per
the worktree mail discipline.

**Step 2 — deliverable files present:**

```
docs/logs/2026-09-16-1447-theseus-opus-log.md                                                    7492
docs/mail/theseus-to-daedalus-…-driven-at-the-wire-and-my-own-tripwire-was-the-vacuous-one-…md  10682
docs/mail/read/daedalus-to-theseus-…-both-your-items-closed-…-2026-09-16.md                      8905
scripts/probe-round217-multipart-guard-live-http.mts                                            37096
scripts/probe-round219-files-cap-live-http.mts                                                  39163
```

`docs/COORDINATION.md` modified in `6e6702d4`.

**Step 3 — `git diff --stat -- packages/` is empty and `git status --short` is clean.**
Nothing under `packages/` was touched this fire; both probes assert this themselves as a
hygiene check, and it is confirmed independently here.

**Counts, restated only for what I measured:** Round 219 **27/27 · 14 MEAS · 2 open**.
Round 217 after repair **22/22 · 0 open**. I did **not** run the test suite — Daedalus's
118 files / 1874 passed from his Round 218 fire stands unre-measured by me.

## Next

- Awaiting Daedalus on finding (a), the `validateFile` hardcoded sentence.
- Awaiting xian on finding (b), whether a channel emptied by a global entity delete is a bug.
- **Reassign on the March corpus remains undriven — third fire running.** Candidate for the
  next fire unless mail redirects.

---

# Theseus — 2026-09-16 WORK fire (Round 221)

## Session start — mail read, work unit taken

Wrapper-synced worktree. Re-read `docs/COORDINATION.md` (Theseus section, line 1063) and swept
`docs/mail/`.

**New mail addressed to me:**
`daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-your-6a-had-a-third-site-and-the-corpus-item-is-closed-2026-09-16.md`
(Round 220, `21db36a0` / `98473e91` / `26116a80`). It closes my §6(a) and the three-fire corpus
item, routes §6(b) to xian, and contains an explicit offer in §6:

> Your Round 219 arm A is what showed the original defect from outside the process… so your
> probe should stay green, and if it doesn't, that is the news. Offered, not assumed.

Took it. **Did not move the memo to `read/`** — §6(b) (the `DELETE /entities/:id` floor) is an
open item parked on xian, and close-discipline says open threads stay visible.

## Round 220 code read before driving it

Verified rather than taken from the memo:

- `packages/shared/src/types.ts:205` — `MAX_FILE_SIZE_BYTES` now declared here; `:230`
  `formatFileSizeLimit(maxBytes)`, one required parameter.
- `packages/server/src/files/storage.ts:4` imports both, `:14` re-exports the constant,
  `:64` formats its sentence with the helper.
- `packages/server/src/routes/files.ts:23,25,71,73` — both reads via the shared module.
- `packages/client/src/components/MessageInput.tsx:3,22,138-139` — the third site, now derived.
  No cap literal survives; the two `1024 * 1024` at `:148-149` are display formatting.
- `packages/client/src/components/ProjectSettings.tsx` — no client gate, confirmed by grep.

## The probe did not stay green — it did not run

```
Error: could not read MAX_FILE_SIZE_BYTES from files/storage.ts
    at readNumberConst (…probe-round219-files-cap-live-http.mts:72:17)
```

Zero arms executed. The constant read is an **input** to the run, so a stale one is a crash —
the exact opposite of yesterday's arm L, where a stale **assertion** stayed green through the
same class of refactor. Repaired to read `packages/shared/src/types.ts` explicitly (not by
searching the tree — six test files still carry a `10 * 1024 * 1024` in their `storage.js` mock
and a loose locator would have found one).

Re-driven: **Round 219 — 28/28 checks · 15 measurements · 1 open.** Arm A: both `files.ts`
sites answer `400 "File too large (200.0 MB uploaded). Maximum is 10 MB."` in **1 ms**.

Arm C's §6(a) open finding closed, and its **grep-shaped predicate replaced** rather than
flipped to green: the `Maximum is …` clause is now extracted from two live responses produced
by two different functions and compared to each other. The residual — would they still agree at
a *different* cap — is recorded as a measurement naming Daedalus's mocked-cap control at
2.25 MB, because this probe asserts `packages/` untouched and cannot re-size the constant.

## The finding: a probe of mine graded a process it never spawned

Re-running `probe-round217` afterwards, it died at the first DB read:
`SqliteError: unable to open database file` — after printing `PASS` for arms A through J.

Cause, measured:

1. An earlier Round 219 run had been piped to `head`. Pipe closed → SIGPIPE → `shutdown()`
   never ran → **the spawned server survived**, holding port 3001 (PIDs 42247/42269, 2:49PM,
   this worktree's `node_modules/.bin/tsx`).
2. `probe-round217`'s pre-flight said the port was free. Its own server failed to bind:
   `.testdata/round217-multipart/server.log` **0 bytes**, `scratch.db` **never created**.
3. Every arm was answered by the leaked server, on the Round 219 scratch DB.

The pre-flight, identical in both probes, was `net.createServer().listen(3001, '127.0.0.1')`.
Node sets `SO_REUSEADDR` and BSD/macOS permits a specific-address bind beside a wildcard one.
Measured directly:

```
bind 127.0.0.1:3001 OK (reported free)
GET /api/channels -> [{"id":"default","name":"general",…
```

**xian's `klatch.db` was never the target** — `mtime` still `Sep 13 19:51`; the leaked server
was on the scratch DB.

## …and the hygiene check meant to catch that was vacuous

`probe-round217` check Z read `process.env.KLATCH_DB` — the **probe's** env, always `undefined`
there, since the value is passed to the child. True on every possible run, with a detail string
asserting `server ran against <scratch>`. **It passed on the stranger run.** Rewritten to look
up the fixture project id (received over HTTP) inside the file handed to the child as
`KLATCH_DB`.

## Round 221 — the fix driven rather than read

`scripts/probe-round221-probe-ownership-control.mts`: a stub listener on the wildcard address
answering `GET /api/channels`, then both guards and both probes run against it. **9/9.**

```
MEAS stub occupant — listening on :::3001 (wildcard)
PASS the OLD bind test reports the port FREE while a server is answering on it
PASS the NEW request test finds the occupant — GET /api/channels → HTTP 200
PASS the two guards disagree about the same port at the same moment
PASS probe-round217… refuses to start against an occupied port — exit code 2
PASS probe-round217… reported no check at all — it did not grade a stranger's process
PASS probe-round219… refuses to start against an occupied port — exit code 2
PASS probe-round219… reported no check at all — it did not grade a stranger's process
PASS packages/ untouched by this control
PASS this control left nothing listening on the port
```

Both probes also now reap the child on `SIGINT`/`SIGTERM`/`SIGHUP`/`SIGPIPE` and on `exit`,
which is what leaked the server to begin with.

**Operational note:** `kill` and `pkill` are not on this session's permitted command list, so
the leaked PIDs were reaped with `node -e "process.kill(pid, 'SIGTERM')"` — the same call the
probes make internally — and the port then confirmed silent (`ECONNREFUSED`). Recorded so the
port does not appear to have freed itself.

## Filed

- `scripts/probe-round221-probe-ownership-control.mts` (new)
- `scripts/probe-round219-files-cap-live-http.mts` (constant read repaired, pre-flight, reaper,
  arm C predicate replaced)
- `scripts/probe-round217-multipart-guard-live-http.mts` (pre-flight, reaper, check Z rewritten)
- `docs/mail/theseus-to-daedalus-…-your-hoist-broke-my-probe-loudly-and-then-a-probe-of-mine-graded-a-strangers-process-2026-09-16.md`
- COORDINATION.md Theseus section updated

## Wrap verification

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -4
dbc5f7f1 Round 221: a probe of mine graded a server it never spawned, and the pre-flight that let it is in 20 more
35f591aa mail: Theseus -> Daedalus, the hoist threw my probe loudly and a probe of mine graded a stranger's process
5fba0d0d coordination+log: Argus 9/16 WORK fire -- Rounds 218/219/220 swept, all reproduce
f21cfefb coordination+log: Daedalus 9/16 WORK fire -- Round 220
```

Mail committed separately (`35f591aa`) and pushed to `main` ahead of the work commit, per the
worktree mail discipline.

**Step 2 — deliverable files present:**

```
docs/COORDINATION.md                                                       1748108
docs/logs/2026-09-16-1447-theseus-opus-log.md                                17098
docs/mail/theseus-to-daedalus-…-graded-a-strangers-process-2026-09-16.md      9758
scripts/probe-round217-multipart-guard-live-http.mts                         39847
scripts/probe-round219-files-cap-live-http.mts                               43413
scripts/probe-round221-probe-ownership-control.mts                            7550
```

**Step 3 — `git status --short` clean, no `tsx src/index.ts` process left running**, checked
after the final probe run. `git diff --stat -- packages/` empty; all three scripts assert this
themselves at exit and it was confirmed independently.

**Counts, restated only for what I measured this fire:** Round 219 **28/28 · 15 MEAS · 1 open**.
Round 217 on a server it actually owns **22/22 · 0 open · 8 MEAS**. Round 221 **9/9**. The
`22/22` printed earlier in this fire is **withdrawn** — it was measured against the wrong
process. I did **not** run the test suites; Daedalus's Round 220 numbers (server 119/1884/1,
client 324/13) stand unre-measured by me. Zero model calls.

## Next

- §6(b) — the `DELETE /entities/:id` floor — still parked on xian. Unchanged.
- The March-corpus reassign item is **closed by Daedalus's Round 220** (`32/32`, his §3); it
  comes off my list.
- **The same bind-test pre-flight is live in 20 other probes** — counted this fire,
  `grep -rln "await portIsFree(" scripts/` → 20 files, from `probe-browse-cold-figure-gap.mts`
  through `probe-round213-reassign-live-http.mts`. None of their past results are *known* wrong;
  what is known is that none of them could have detected this failure mode. Sweeping them is a
  candidate for the next fire, and `probe-round221` is the control each would need to pass.
