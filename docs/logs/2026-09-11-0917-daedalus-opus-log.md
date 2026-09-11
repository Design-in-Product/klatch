# Daedalus session log — 2026-09-11 (Opus 5)

## 09:17 PT (START fire) — Round 188: S2 and G1/G2 from Theseus's Round 187

**Briefing.** Worktree at `63d7e6be`, clean. Read my COORDINATION section, `daedalus-tasks.md`,
`docs/mail/`, and today's cross-pollination brief (Piper Morgan: a cleanup that installs no check is a
rollback). No `xian-to-*` memo. Two memos touch my seat:

- `theseus-to-daedalus-xian-cc-…-n1-and-n6-agreed-and-after-a-restore-the-refusal-blames-a-later-run-2026-09-10.md`
  (Round 187, `7e69dbb9`). He agrees with N1/N6 and re-vehicled R185. He opens three items, all mine:
  - **S2:** after a snapshot restore, the refusal says "seated again by a later binding" when the
    binding it read is *earlier*.
  - **G1:** `checkUndoRecord` doesn't read `toAddedAt`.
  - **G2:** it doesn't read `fromAddedAt` either, so a hand-edited string gets written into the roster
    ordering column.
- `argus-to-theseus-cc-daedalus-xian-round185-n0-n1-flaky-on-the-second-boundary-2026-09-11.md`. R185's
  re-vehicled N0/N1 have no `tick()` before the second apply, so they fail when both applies land in one
  second. Addressed to Theseus, and the instrument is his. For me it only means an R185 regression
  failure on N0/N1 must be read against that before I call it a regression.

**Checked before designing.** `channel_entities.added_at` is created with `DEFAULT (datetime('now'))`
(`db/index.ts:76`). Every writer in `packages/server/src` lets the default fill it
(`queries.ts:184,495,1297`, `index.ts:363`, `klatch-import.ts:287,321`, apply's bind at
`entity-backfill.ts:438`). The one exception is undo's re-bind, which copies the record's `fromAddedAt`.
There's no ALTER or table rebuild. So:
- a record the CLI wrote always carries the `YYYY-MM-DD HH:MM:SS` form, and a strict check refuses
  none of them
- string order is time order
- no probe *checks* the summary advice line; R185:376 and R187:246 only quote it. R187's S2 check is
  `/later binding/` over the whole output.

**~09:20 — his baseline reproduced myself, unfixed code:** `probe-round187-…` → **11 checks · 0 failed ·
3 open · 4 measurements** (S2, G1, G2). Matches his memo and Argus's. Runner is still
`.testdata/r186-run.mjs` (gitignored); output in `.testdata/r186-r188base-r187.txt`.

**Predicted for R187 on the fix, stated before running it:** S2, G1 and G2 flip to pass. S0/S1/S3,
P0/P1 and G0 are unchanged. P1 still needs `/re-added in the app/`, which the later-binding wording
keeps. Z fails if run before the commit.

**~09:21 — built.**
- **G1/G2:** `checkUndoRecord` now requires each `added_at` field to be absent, `null`, or the
  `YYYY-MM-DD HH:MM:SS` form (`SQLITE_DATETIME`). The problem string names the field and the value.
  Absent/null are still accepted, so records from before either field existed still replay.
- **S2:** `UndoChannelState.boundBeforeRun` is new, and `reboundSince` now means strictly later. The
  classifier picks between them by comparing the strings (valid because of the format checks above).
  Disposition and exit are unchanged, as he offered.
- **CLI:** an earlier binding reads "seated by an earlier binding than this run's: this database is
  from before the run (a restored backup?)". The summary's "If a later --apply moved one…" now prints
  only if some *other* channel was left. When a channel is bound before the run, a line points to the
  older run's record.
- **Tests:** the Round 184 `toEqual` literal gains `boundBeforeRun: false`. Four new tests: the G
  refusals (number, "not a date", ISO `T` form, empty string); acceptance as-applied / null / absent;
  earlier → `boundBeforeRun`; later → still `reboundSince`.

**Verified so far:** test file **45/45** (41 + 4). `npm run typecheck` clean ×3. CLI
`tsc --noEmit --strict --module nodenext` clean.

**Negative controls,** both applied to the working tree at once and then reverted:
- **A:** the earlier branch forced off, so any difference means "later"
- **B:** the `added_at` format check bypassed

Result: **2 of 4 new tests fail**, as predicted.
- G refusal under B: `ok` true.
- S2 under A: received `reboundSince: true, boundBeforeRun: false`, the pre-fix classification.

The acceptance test and the later-binding test pass under both, as they should. All 41 earlier tests
pass. `grep -c NEGCTL` → 0 after the revert.

**~09:24 — full suite on the restored code:** server **101 files · 1602 → 1606/1606**, client **311
passed · 13 skipped** (unchanged, no client file touched), no TS errors. Code + tests committed on
their own, so his arm Z compares against a HEAD that has the fix.
