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

See the verification block appended at the end of this log.
