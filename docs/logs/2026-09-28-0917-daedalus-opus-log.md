# Daedalus session log — 2026-09-28 (START fire)

Model: Opus 5. Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch
`claude/daedalus-cycle`, synced to `origin/main` at `108fef44` by the wrapper before the fire.

---

## 09:17 — Session start, briefing

Pulled/verified: `git rev-list --left-right --count origin/main...HEAD` → `0 0`. Tree exactly
`origin/main` at `108fef44`. `git status --porcelain` clean.

Read `docs/COORDINATION.md` (Daedalus section) and both memos addressed to this seat:

- `theseus-to-daedalus-argus-…-your-6b-is-repaired-…-2026-09-27.md` (Round 286). §6 offers this
  seat "the forced-drive judgement calls on the 72 `db`-flagged DEFERRED probes, and I'd rather you
  took it."
- `argus-to-daedalus-theseus-…-your-4-call-is-made-census-is-wired-into-npm-test-last-2026-09-27.md`.
  §3 explicitly confirms the db item is unchanged and not assigned to his seat.

Both point at the same work unit. Took it.

## 09:2x — Baselines, taken before any change

Gate (`npx tsx scripts/gate.mts`, redirect to file, no pipe), exit 0:

```
GATE ok exit=0 census · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 typecheck · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 server · files: 140 passed (140) · tests: 2174 passed | 1 skipped (2175) · errors: 0
GATE ok exit=0 client · files: 25 passed | 13 skipped (38) · tests: 324 passed | 13 skipped (337) · errors: 0
GATE ok exit=0 gate(census+typecheck+server+client) · files: (no Test Files line) · tests: (no Tests line) · errors: 0
```

Byte-identical to Theseus's Round 286 §5 and Argus's first-from-that-seat run.

`promote-probes.mts --list`: 116 probe files · 18 SWEPT · 98 DEFERRED · hazard-clean candidates 3 ·
**not driven (db): 73**. Theseus's memo said 72; live figure at fire open was 73. Noted rather than
reconciled to the memo.

## 09:3x — The finding: the judgement could not be made as asked

Chased what the `db` flag actually guards, reading code rather than inferring from the flag name:

1. `promote-probes.mts` `drive()` passed `env: { ...process.env, HOME: home }` — `HOME` only. **No
   `KLATCH_DB`.**
2. `packages/server/src/dbPath.ts` `resolveDbPath(undefined)` → `defaultDbPath()` → repo-root
   `klatch.db`. Verified by reading the file.
3. Only write-detector in the path: `fingerprint()` over `scripts/` and `packages/`.
4. `ls klatch.db` → present at repo root, 434176 bytes. Outside both fingerprinted pathspecs.
5. `.gitignore` line 3 is `*.db`. So the file is ignored **and** untracked.

Conclusion: a force-driven `db`-flagged probe calling `getDb()` opens the real database and no
instrument in the sandbox would notice. The judgement Theseus offered is not makeable until the
sandbox can observe the thing being risked.

**The sharp part:** the obvious repair (widen the fingerprint pathspec to cover `klatch.db`) ships a
check that cannot go red, because `fingerprint` is git-shaped and git does not list ignored paths in
`status` without `--ignored`. Decided to drive that rather than assert it.

## 09:4x — Cost measurement that changed the design

First cut of the sentinel hashed every database file in the repo. Measured before accepting it:

```
graded  : 3 files 0.5 MB
scratch : 273 files 277.9 MB
largest : .testdata/r197/s/size-64mb.db 67.7 MB

full hash all 276 files: 235 ms
hash <=8MB only:          42 ms   (9 files exceed the cap, holding 215.1 MB)
```

235 ms × 2 snapshots × 2 drives ≈ 1 s of overhead per probe examined. Added an 8 MB hash cap **on
the scratch set only** — the graded set is never capped, because it is the evidence predicate 8
rests on. Arm F3 pins that.

Also found while enumerating: the graded set is **3**, not 1 — `klatch.db` plus two orphan sidecars
`sizing-copy.db-shm` / `sizing-copy.db-wal` at the repo root. Not mine, not cleaned up in a fire
about not touching databases. Flagged in the memo.

## 09:5x — Built

- `scripts/lib/db-sentinel.mts` (new) — filesystem-level, deliberately not git-shaped. `readdirSync`
  walk. graded (outside `.testdata/`) vs scratch (under it, reported never graded). WAL sidecars in
  the set because `getDb()` runs `journal_mode = WAL`.
- `scripts/promote-probes.mts` — `KLATCH_DB` redirected in `drive()` (optional param, but its
  **default** is a fresh temp path, so a forgetful call site is still safe); **predicate 8,
  db-preserving**, evaluated *before* predicates 5/6 so a green verdict cannot mask damage;
  `PROMOTE RED` now also fires on graded-db movement.
- `scripts/probe-round287-the-sandbox-cannot-see-the-one-file-git-cannot-restore.mts` (new).
- Classified DEFERRED in `sweep-probes.mjs` in the same commit, per Argus's census wiring.

`npm run typecheck:scripts` — clean, exit 0, no pipe.

## 10:0x — Probe driven: 24 checks, 0 failed, exit 0

Headline arms, verbatim:

```
[B1] pass  KNOWN POSITIVE for blindness: fingerprint() reports the IGNORED db as unchanged across that edit
[B2] pass  KNOWN NEGATIVE: the SAME instrument DOES move for the same edit to a non-ignored file
[B3] pass  a fingerprint at klatch.db's OWN pathspec carries no U: term for it, though the file exists
      fingerprint(REPO, 'klatch.db') = P:e3b0c44298fc1c14 D:e3b0c44298fc1c14
      klatch.db exists: true
[B4] pass  and git agrees it is ignored, via check-ignore
```

`e3b0c442…` is the sha of empty input in both terms. Vacuity of the widened-pathspec fix is driven,
not argued. B0 exists so B1 means blindness rather than a no-op; B2 exists so B1 means *ignoring*
rather than `fingerprint` being broken.

Census after classifying: `117 probe files · swept 18 · deferred 99 · CENSUS OK`.

## 10:1x — Committed and pushed before continuing

`a588c1f1`, pushed `108fef44..a588c1f1 HEAD -> main`. Deliberately pushed mid-fire rather than at
the end — a fire that dies with the instrument stranded in a worktree helps nobody.

## 10:2x — Forced drives, and the real answer

Three forced drives with the sentinel armed (a `for` loop to batch five was refused by the harness;
`round183` and `dedup-resolver-scaling` were **not** driven):

| probe | verdict | graded dbs |
|---|---|---|
| `probe-round192-what-a-wal-beside-the-database-says.mjs` | held — predicate 5, no conclusion line | unchanged |
| `probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts` | held — predicate 5 | unchanged |
| `probe-round220-reassign-on-the-march-corpus.mts` | held — predicate 5 | unchanged |

round204 changed `.testdata/r204/apply-undo.db` and `kept.db`; round220 changed
`.testdata/r220/march14-reassign.db`, `-shm` **and** `-wal`. So the scratch/graded split is doing
real work on real probes, and round220 is the live justification for grading WAL sidecars — the
reasoned argument got there first but the drive confirmed it.

**All three held on the same predicate**, which reframes the ask. Scanned the 29 `db`-only DEFERRED
probes for verdict machinery: **0 of 29** import `probe-outcome`/`summariseAndExit` or emit a
"regression checks passed" line.

A detector reading zero across 29 files is precisely the smaller-number failure I put on the record
three times in Round 285, so it was validated both directions before being believed:

```
KNOWN POSITIVES (must all be true):   true round287 · true round285 · true round284 · true round232
KNOWN NEGATIVES (must all be false):  false round204 · false round220 · false round192
```

The negatives are the three probes actually driven this fire, each independently observed to produce
no conclusion line. Reading and drives agree 3 for 3.

So: the `db` class's promotion yield is **zero**, not because the probes are hazardous but because
they are the Round 176–220 backfill/undo/corpus *investigations* — scripts that print findings, not
probes that assert them. `--force` cannot help; the reading list was never what blocked them.

Count reconciliation, since three figures were in circulation: Theseus's 72 → 73 at fire open → 74
at fire end, the last one being **my own probe**, which trips `db` on the literal `KLATCH_DB` and
`homedir` on `process.env.HOME` (`hazards()` → `["db","homedir"]`). So it is not in the db-only 29,
which is consistent with 0 of 29 having verdict machinery.

## 10:3x — COORDINATION flag retired

`wc -l docs/COORDINATION.md` → **2989**. Calliope archived pre-2026-09-01 into
`docs/coordination-archive/2026-08.md` at `c30e3085` with xian's OK (3731 → 2989, 765 lines moved
verbatim). Twenty flags across two seats, ruled on and executed. **No twenty-first flag.**

## Discipline

No port bound. No model call. **No database outside `.testdata/` opened, read or written** —
`klatch.db` was hashed and nothing else. Every cited figure comes from a redirect to a file; no pipe
on anything quoted. Writes confined to `.testdata/r287/` (scratch), `scripts/` (the two new files
plus two edits), `docs/mail/`, `docs/logs/`, `docs/COORDINATION.md`. Arm B's repo-root known-negative
fixture was removed and arm H3 asserts its absence.

## Session wrap verification

See the verification block appended below at fire end.
