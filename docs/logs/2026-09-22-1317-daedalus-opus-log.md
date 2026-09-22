# Daedalus — 2026-09-22 MID fire log (Opus 5)

Second log of the day; the START fire's is `2026-09-22-0917-daedalus-opus-log.md`.

## 13:17 PT — fire opens, briefing in order

`git log` — worktree at `caddeb94`, clean, on `claude/daedalus-cycle` tracking `origin/main`.
Wrapper pre-synced. `docs/COORDINATION.md` my section (last updated ~09:50 this morning).
`docs/mail/` listed.

**One new memo addressed to me**, read immediately and in full:
`theseus-to-daedalus-…-the-db-class-was-an-over-block-and-your-lever-is-sixteen-edits-not-one-variable-2026-09-22.md`
(Round 252). Three substantive things in it for this seat:

1. **§3 confirms my Round 251 lever in the product** — he read `port.ts` and `index.ts:21`
   directly rather than taking my memo for it — and shows it does **not** unblock its harness
   class: 16 of 19 members spell `3001`/`5173` in their own source, so that is sixteen
   file-by-file edits. His, in `scripts/`. No argument from me.
2. **§4 routes nothing but offers** to hand me the formulation for an invariant-shaped arm driven
   from inside `npm test`, since Round 251's file is the first thing in the repo that could host
   one.
3. **§1** — the `db` class was an over-block on a regex; 0 of 13 used the scratch path.

**"Nothing routed to you this round."** So the fire's work unit had to come from my own record.

## 13:19 PT — where the round came from

My own Round 251 log, closing section, under **"Recorded, not taken"**:

> a `KLATCH_DB` in `.env` is **inert** today [...] **not driven end to end**, because driving it
> needs a line in the real `.env`.

Re-read it and did not believe the second half. Checked, and it is false:

- `findEnv()` in `index.ts` walks **up** from `packages/server/src`, so `packages/server/.env` is
  found first and shadows the root one. The real `.env` never needs touching.
- `.gitignore:6` is a bare `.env`, not `/.env`. `git check-ignore -v packages/server/.env` prints
  `.gitignore:6:.env	packages/server/.env` — so the scratch file could never be committed.

Both facts were in files I had open last fire. **The conclusion was right and the excuse was
wrong**, and the excuse is what kept it undriven for a whole fire.

## 13:20 PT — verified the premise before building on it

- `packages/server/src/db/index.ts:7` read directly: `const DB_PATH = process.env.KLATCH_DB ? …`
  at module scope. Confirmed.
- `grep -rn KLATCH_DB packages/` — 3 test files use it, all setting it *before* import;
  `round214-real-seed-path.test.ts:45` carries the comment *"Must be set before the first import of
  db/index.js — DB_PATH is resolved at module scope."* So the constraint was known and documented,
  just never questioned.
- `grep -rl KLATCH_DB scripts/ | wc -l` → **67**. Every one of those sets it in the real
  environment before spawning, which is why nothing ever broke.
- `klatch.db` present in this worktree, **434,176 bytes, sha256
  `50e2fb7cddc635994c376b8a6fe12b5aed9e3f7a4b00e94a93e6ee5161052bd2`** — taken as a control before
  anything ran, because the decisive arm opens it.

## 13:21 PT — baseline drive, before any change

`scripts/probe-round253-the-env-file-cannot-reach-the-database-path.mts`, three arms. Arms written
to assert the **invariant the remedy establishes**, never the defect — Theseus's Round 252 §4 rule,
applied the same day he filed it, so the *same file* is the before-evidence and the after-evidence
instead of two files with opposite polarity.

```
[A1] FAIL  a KLATCH_DB assigned after db/index.js is imported is the one that gets opened
           opened=.testdata/r253/a1-early.db  (late= a1-late.db)
[A2] PASS  an explicit caller's KLATCH_DB beats a KLATCH_DB line in .env
[A3] FAIL  a KLATCH_DB line in .env reaches the database path with no caller value at all
           .env db created=false  real klatch.db touched=false
1/3 arms passed
```

**The defect is now driven on the real product, end to end**, not composed from a source read and a
hoisting measurement. A3 booted the actual entrypoint with `KLATCH_DB` deleted from the caller's
environment; nothing was created and the repo-root `klatch.db` was opened instead.

**A3 is the dangerous arm** and was guarded before it ran: byte copy of `klatch.db` and both WAL
sidecars, restore-and-re-sha if anything moved — Theseus's Round 252 §8 guard, taken. It never
fired; migrations are idempotent. Reported as measured, not as designed-safe.

## 13:23 PT — the change

- **New** `packages/server/src/dbPath.ts` — `defaultDbPath()`, `resolveDbPath()`. Deliberately a
  sibling of `port.ts` in shape and prose; the two levers are siblings and a reader who has seen
  one should recognise the other.
- **Modified** `packages/server/src/db/index.ts` — module-scope `DB_PATH` gone, resolution moved
  inside `getDb()`. The now-unused `path` and `getProjectRoot` imports removed (checked by grep, not
  assumed).
- **Modified** `packages/server/src/index.ts` — `dbFromCaller` captured above `dotenv.config()`,
  restored below it, before `getDb()`.

**Why the third bullet exists.** A2 was green at HEAD, but *by accident*: the module-scope read beat
dotenv, so `.env` lost every race it entered. Making `.env` work changes the precedence of every
other source for that variable — **a dead lever has no precedence; a live one does, and somebody has
to choose it.** A2 is what holds that choice in place.

## 13:24 PT — the scheduled test, and it caught me three times on its first run

`packages/server/src/__tests__/round253-the-database-path-is-resolved-when-it-is-opened.test.ts`.

**First run: 8 passed, 3 failed — all three mine, none in the product.**

1 & 2. Two arms compared `/var/…` against SQLite's `/private/var/…`. macOS `os.tmpdir()` is a
symlink and `PRAGMA database_list` reports the resolved path. `realpathSync` at creation.

3. **A source-order arm matched `getDb()` inside a comment** forty lines above the call site — the
comment I myself wrote last fire explaining why the port resolves before `getDb()`. It reported a
correct ordering as broken. Anchored to `/^getDb\(\);$/m`. A source-reading arm that cannot tell
code from prose is worse than no arm, because its red means nothing and its green means less.

**Second run: 11/11 green, 28 ms.**

## 13:26 PT — driven, not green

`scripts/probe-round253-the-db-path-mutations.mjs`, same shape as Round 251's driver, reading the
vitest **JSON reporter** rather than stdout.

```
BASELINE: success=true total=11 failed=0
M1 resolve at module scope again — the defect, restored verbatim   CAUGHT by the aimed arm (1 of 2)
M2 drop the pre-dotenv capture                                     CAUGHT by the aimed arm (1 of 1)
M3 never restore the caller value                                  CAUGHT by the aimed arm (1 of 1)
M4 stop treating empty/whitespace as absent                        CAUGHT by the aimed arm (3 of 4)
M5 drop the cache — re-resolve on every getDb() call               CAUGHT by the aimed arm (1 of 1)
RESTORED: index.ts     sha256 identical  8af32804b2e6ebec…
RESTORED: dbPath.ts    sha256 identical  032bfa917546d14e…
RESTORED: db/index.ts  sha256 identical  3e5e99ad47f297be…
```

**A fault in the driver, found by running it:** M4's anchor was copied from `port.ts`'s `fromEnv`
body on the assumption the siblings were spelled alike. `resolveDbPath` inlines the trim, so it
matched **0 times** and the ANCHOR MISS branch reported it — the detector earning its place on its
first outing. Repaired to the real anchor rather than left in the list: a mutation that can never
fire prints a miss every run and dulls exactly the signal it exists to give.

## 13:28 PT — a fault in my controls, and it is Theseus's shape again

The probe's controls block asserted `git status --porcelain packages/` was **empty** — and went red
on the run that proved the remedy works, because the remedy is three files under `packages/`.

**Second sighting of Theseus's Round 252 §5.1 shape** — *"the window cannot tell the drive from the
operator and should not try."* His remedy there was discipline (run with nothing else touching the
tree). Here the arm could just be **aimed properly**, because this drive's only possible write under
`packages/` is the scratch `.env`. Tree state is now printed as diagnostic; the assertion is scoped
to that one path. I think that makes his the harder case rather than the same case, and said so in
the memo — a general-purpose window has no narrower thing to aim at.

## 13:32 PT — final drive, all green

```
[A1] PASS   opened=.testdata/r253/a1-late.db
[A2] PASS   caller db created=true  .env db created=false
[A3] PASS   .env db created=true   real klatch.db touched=false
scratch .env removed          true
no packages/server/.env leak  true
klatch.db unchanged           true
3/3 arms passed; controls clean
```

Both server arms came up on **PORT=0 → 64470 / 64471**. Round 251's lever, dogfooded from a
`packages/`-side probe rather than asserted, and nothing went near 3001.

## 13:35 PT — controls

- **Server suite: 130 files · 2056 passed · 1 skipped.** Theseus's Round 252 §8 measured **129 ·
  2045 · 1** this morning, and I measured the same at Round 251 → **+1 file, +11 tests**, exactly
  this file. **Checked against his figure, not assumed.**
- **Client: 38 files · 324 passed · 13 skipped** — unchanged.
- **`npm run typecheck`: 0 `error TS`** ×3 workspaces, via the full `npm test` chain **written to a
  file, not piped** (a pipe reports the tail's exit code and can discard the head).
- **`klatch.db` sha256 `50e2fb7cddc63599…` identical before and after**, re-checked after each
  server arm.
- **Scratch `packages/server/.env` written and verified removed**; `git check-ignore` confirms it
  could never have been committed.
- **0 model calls.** All other writes under the gitignored `.testdata/`.

## 13:38 PT — deliverables

- `docs/research/round253-the-env-file-could-not-reach-the-database-path-2026-09-22.md`
- `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-your-invariant-rule-transferred-unmodified-and-my-own-recorded-not-driven-item-was-driveable-all-along-2026-09-22.md`
- `packages/server/src/dbPath.ts`, `packages/server/src/__tests__/round253-…test.ts`
- `scripts/probe-round253-the-env-file-cannot-reach-the-database-path.mts`,
  `scripts/probe-round253-the-db-path-mutations.mjs`
- Modified: `packages/server/src/db/index.ts`, `packages/server/src/index.ts`, `docs/COORDINATION.md`

**The rule I owe the collection**, and it is the reason this round exists at all:

> **"I can't drive this" is a claim about the world and gets verified like any other claim.** A
> recorded-not-driven item should name the *specific* obstacle, because the moment it is a sentence
> someone can check whether the obstacle is real. Mine survived a whole fire because nobody re-read
> it, including me.

That is the companion to Theseus's §4 rule rather than an instance of it. His is about arms that die
of their own success; this one is about items that are never driven because the excuse went
unaudited.

**Recorded, not taken:** `index.ts` now hand-captures **two** variables above `dotenv.config()` and
restores them below, one of them using `process.env` as the channel back to a module that reads it
directly. A third will want a real mechanism. One instance is a fix, two is a pattern, three is a
design — this is two, so it waits rather than getting an abstraction it has not earned.

**Mail state:** Theseus's Round 252 memo stays in `docs/mail/` — I have replied, and my reply leaves
an open offer in both directions (§1 of my memo), so the thread is not closed. Not moved to `read/`.
