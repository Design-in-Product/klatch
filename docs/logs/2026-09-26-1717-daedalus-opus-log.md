# Daedalus — 2026-09-26 17:17 fire (Opus 5), Round 279

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Briefing: COORDINATION.md tail + `docs/mail/` + `docs/briefs/cross-pollination/current.md` read at open.

## 17:17 — open

Inbound: `theseus-to-daedalus-…-your-section-5-stands-and-the-instrument-that-said-3001-was-free-was-mine-2026-09-26.md`
(Round 278). Items landing on this seat:

- his §5 — widen round250's `Z2a` dot-file filter (flagged, not landed, because it is my file)
- his §6 — round251's `anEphemeralPort()`, the unrepaired twin of the `freePort()` I fixed in round250
- my own §6(a) from Round 277 — `scripts/*.mts` typechecked by nobody; I said "mine next fire", and
  Theseus agreed it is mine. **Taken as this fire's main unit.**

## 17:20 — measured the gate before building it

`npx tsc -p .testdata/r222-scratch/tsconfig.probes.json` (Round 222's never-landed scratch config,
found in the tree rather than rewritten): **20 errors across 8 files** of 107 `.mts`.
`TS7016 ×6` (untyped `.mjs` import — my two slips' class), `TS7006 ×7`, `TS18047 ×5`, `TS2769 ×1`,
`TS2339 ×1`. Tractable, so the gate can be wired rather than merely written.

## 17:22–17:27 — built

- `scripts/tsconfig.json` (new) — Round 222's compiler options verbatim so the figure is comparable
  across rounds; `include: ["**/*.mts"]`.
- `package.json` — `typecheck:scripts` added, chained into `typecheck`, so it runs under `npm test`.
- Three hand-written declarations: `scripts/lib/tsx-required.d.mts`, `scripts/lib/strip-source.d.mts`,
  `scripts/sweep-probes.d.mts`. These alone cleared **all 6 TS7016 and all 7 TS7006**.
- `probe-browse-count-vs-persisted-rows.mts:73` — `.filter(isHumanTurnBoundary)` bound `filter`'s
  INDEX to the function's `opts`. Real mis-binding, behaviourally inert by luck.
- `probe-browse-endpoint-second-corpus.mts:518` — arm F dereferenced a nullable `armF`; arm C has
  guarded the same return since the file was written. Latent, not live.
- `probe-round253:183` — `NodeJS.ProcessEnv` annotation so `delete a3Env.KLATCH_DB` typechecks.
- `probe-round245:93` + arm B's one-level read — exclude `.d.mts`/`.d.ts` from the module census.
- `scripts/lib/probe-source-constants.mts:78`, `round257-…test.ts:41`, `round259-…test.ts:32` —
  three stale `@ts-expect-error` directives, which became TS2578 once the declarations existed.

**Trap hit and recorded:** first `npm test` was run as `npm test > file 2>&1 || echo NONZERO`. The
task notification reported **exit 0** — that is `echo`'s code, not npm's; the file held
`npm error code 2`. Same shape as the `| tail` finding already in my notes. Re-run without the
`|| echo`.

## 17:27–17:28 — measured after

- `npx tsc -p scripts/tsconfig.json` → **0 bytes of output, exit 0.**
- `npm test` → server **140 files / 2174 tests (1 skipped)**, client **324 / 337 (13 skipped)**,
  exit 0, with `typecheck:scripts` inside the run.
- `probe-round245` → drove RED first, one arm: `[E] gate-line.mts covered but UNRECORDED`.
  **Pre-existing and mine**: `gate-line.mts` and its covering test both landed in `d00a5e08`
  (Daedalus, today 09:29). Arm E had been red all day with nothing to say so. Added to
  `COVERED_FLOOR`; re-drove → **4/4, `covered 14 / 16`, exit 0.**

## 17:28 — also landed

- round250 `Z2a` widened to any dot-entry under `scripts/` (Theseus 278 §5). Verified **0
  dot-entries under `scripts/` today** myself (`readdirSync`, 144 entries) before widening.
- round251 `anEphemeralPort()` → `trackedNetServer()` + `closeBounded()`, matching the
  `probe-round250:547` repair. The file already imported the library.

## 17:31 — final verification run (the citable one)

`npm test`, no `|| echo` in the command, exit 0:

```
> npm run typecheck -w packages/shared && … -w packages/client && npm run typecheck:scripts
 Test Files  140 passed (140)
      Tests  2174 passed | 1 skipped (2175)
 Test Files  25 passed | 13 skipped (38)
      Tests  324 passed | 13 skipped (337)
```

This run postdates every edit including round251's and round245's; the three earlier runs did not.

`wc -l docs/COORDINATION.md` → **3605** (Theseus measured 3586 before his own Round 278 entry
landed). Thirteenth flag filed in the memo.

Memo filed: `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-the-gate-is-built-and-its-first-run-found-a-check-that-had-been-red-all-day-2026-09-26.md`.

## 17:32 — pushed

`724371e5` → `origin/main` (`a5e8874c..724371e5`). Fast-forward, verified with
`git merge-base --is-ancestor` before pushing. 17 files.

## 17:35 — drove probe-round240, which I had just published as unmeasured

Converted the open `.d.mts`-in-census item into a measurement rather than leaving it reasoned:

```
scripts/ candidates: 138          (137 without sweep-probes.d.mts — it IS in the population)
sweep-probes.d.mts named anywhere in the report: false
10 checks · 1 failed · 4 MEAS
[I] FAIL  corpus-pin classifier separates found-ids from minted-ids (two-sided, on known cases)
            2 commit(s)  probe-browse-latency-end-to-end.mts
            2 commit(s)  probe-parse-encoding-confound.mts
```

Enrolment is harmless — every row the sweep emits needs a pinned subject or SHA and a declaration
file has neither. **But round240 exits non-zero on arm [I], naming two files this fire did not
touch.** Not bisected, so not asserted as pre-existing; consistent with Theseus's Round 278 note
that round240 reports `exit 1` from inside round250's transcript.

**Two probes driven outside their own rounds this fire, two reds found, both unscheduled.** Same
shape as the round245 finding, twice in one fire.

## Next / open

- round240 arm [I] — red, cause not established, not mine but now sighted and written down.
- round249's and round275's copies of `anEphemeralPort()` are the same unrepaired shape as
  round251's was. Three copies of one helper in three test files.
- My "2 of 12" intermittent in round250 stays open; no loop of runs this fire.
- Theseus's §3 half-close question (`destroy()` vs `end()` in `somethingIsAlreadyAnswering`)
  unmeasured and unclaimed by either seat.
