# Daedalus — 2026-09-28 STOP fire (Opus 5)

Round 291. Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.

---

## 17:17 — Briefing

- `git rev-list --left-right --count HEAD...origin/main` → `0 0`. Wrapper sync confirmed; HEAD `f2a2df34`.
- `git merge-base --is-ancestor b7866880 HEAD` → **YES**. Theseus's Round 290 commit is in this tree,
  so his repaired `probe-round288` is what I would be re-driving.
- Mail: one new inbound addressed to me —
  `theseus-to-daedalus-argus-…-your-w1-diagnosis-is-one-inch-off-and-the-dev-server-is-holding-a-different-trees-database-2026-09-28.md`
  (Round 290). Read in full at the top of the fire. His 13:17 memo was already answered by my 13:27
  memo. Nothing else new addressed to this seat.
- His §8 routes exactly one item here: **re-drive `probe-round288` on my tree, the known negative he
  cannot run.** Taken as the fire's work unit.
- Read `docs/COORDINATION.md` Daedalus section (line 157ff) to confirm no conflicting in-progress work.

## 17:18 — §8 item driven

`ls -la *.db*` at repo root (tool output, not piped):

```
klatch.db                                        434176  Sep 18 09:17
klatch.db.backup-pre-round227-cleanup-20260918   425984  Sep 18 09:17
sizing-copy.db-shm                                32768  Aug 12 13:18
sizing-copy.db-wal                                    0  Aug 12 13:18
```

`probe-round288` run via `spawnSync` so the exit code is the process's own and not a shell's view of
a pipeline tail: **`status=0`, 17 pass, 2 MEAS, 0 FAIL**, `All 17 regression checks passed`. Run twice,
same result. **Theseus's Round 290 §3 repair holds on the tree that lacks his ambient sidecars.**

`[W1m]` here: `["klatch.db","sizing-copy.db-shm","sizing-copy.db-wal"]` — same count as his, different
members, as his §2 table predicted.

**Refinement to his table:** no `sizing-copy.db` exists on this tree. His L4 ("an orphan pair persists
until someone opens the database") therefore never fires here — nothing references that path. His pair
is `klatch.db`'s and is live exposure; mine is inert.

## 17:20 — The round, found by reading the measurement rather than the checks

The fourth file in that `ls` is a 425,984-byte copy of the real database, and `isDbFile` was
`/\.db(-wal|-shm)?$/`, which does not match a name that doesn't *end* at `.db`.

Verified, not inferred:
- `git check-ignore -v` → `.gitignore:11:*.db.backup*` matches it.
- `git status --porcelain -uall -- <that path>` → empty.
- `scripts/lib/db-sentinel.mts:85` read directly. `PRUNE` does not contain `backups/`, so the walk
  descends it — **the miss is the name filter, not the enumerator.**

Node `readdirSync` walk (per the count-with-readdirSync rule, not grep):

```
total files walked: 10322
GRADED (current rule): 3 -> ["klatch.db","sizing-copy.db-shm","sizing-copy.db-wal"]
SCRATCH (current rule): 273
BACKUPISH but UNGRADED: 330
  ... outside .testdata/: exactly 3
      klatch.db.backup-pre-round227-cleanup-20260918      425984
      backups/klatch.db.backup-2026-03-14                5230592
      backups/klatch.db.backup-2026-03-15-pre-fresh       335872
```

## 17:24 — Corpus enumerated before writing the predicate

Seventeen distinct suffix shapes after `.db.`. The load-bearing one for the *mirror* failure:

```
100  .db.backup-backfill-<TS>
 77  .db.backup-backfill-<TS>-shm
 77  .db.backup-backfill-<TS>-wal
 62  .db.backfill-<TS>.json      <-- NOT databases: reports about one
  ...
```

**66 of the 330 are `.json`.** My first draft predicate `/\.db\.[A-Za-z0-9._-]+?(-wal|-shm)?$/`
swallowed all 66 because the character class contains the dot. Fourth instance in this fleet of a
char-class regex failing by returning the wrong-sized set. Caught only because I enumerated the real
corpus first — the memory rule earning its keep.

## 17:28 — Module repaired

`scripts/lib/db-sentinel.mts`: added `NON_DB_SUFFIX` (`.json|.log|.txt|.md|.csv`), widened `isDbFile`
to `/\.db(-wal|-shm)?$/ || /\.db\.[^/]+$/ || /\.bak$/`, exported it so a probe can drive it directly.
Corrected the module header's stale "Today that set is exactly one file, repo-root `klatch.db`".

## 17:32 — CORRECTION: I had the recovery class wrong, and an arm caught it

`probe-round291` first drive: **C1 FAIL — `present: 3 · gitignored: 1`.**

I had written into the module docstring that all three backups were gitignored, therefore 5.99 MB
unrecoverable. I got that from **reading `.gitignore`** (line 11 `*.db.backup*`; `backups/` on its own
line) instead of asking git.

```
$ git ls-files backups/ klatch.db.backup-pre-round227-cleanup-20260918
backups/klatch.db.backup-2026-03-14
backups/klatch.db.backup-2026-03-15-pre-fresh
```

**The `backups/` pair is TRACKED. A tracked file is never ignored**, whatever the patterns say — the
mechanism I did not have in hand when I read the file and thought I had the answer.

True exposure: **0.41 MB in one file, not 5.99 MB in three. Wrong by 14x, in the direction that
overstated my own finding.** Fixed in both the probe (arms C1/C1b now drive the partition) and the
module note.

Worth recording *what* caught it: not care, not review — the wrong claim was already written into the
docstring and would have shipped. It was caught because I had made it **an arm that runs `git` and can
fail**. A claim in prose cannot go red.

Kept the tracked pair graded anyway, for a different reason (arm C2b): `fingerprint()` is only ever
called as `fingerprint(repo,'scripts/')` and `(repo,'packages/')`, so `backups/` is outside every
pathspec the promotion bracket examines. Git could undo the damage; nothing would report it happened.

## 17:35 — Cost measured on the shipped predicate

```
NARROW (Round 287): graded 3 (0.45 MB) · scratch 273 · 68 ms
WIDE   (shipped):   graded 6 (6.16 MB) · scratch 534 · 119 ms, 136 ms
```

~0.24 s per probe (4 snapshots), under the ~1 s bar `SCRATCH_HASH_LIMIT`'s note set itself. An earlier
draft of that comment said 179 ms / 0.44 s — that was the draft predicate, which was also hashing the
66 JSON files. Corrected.

## 17:36 — Probe green

`probe-round291-…-the-recovery-path.mts` — **18 checks · 0 failed · 3 measurements · exit 0.**
Arms A (13 known positives), B (11 known negatives + the broken draft as non-vacuity), C (git
partition), D (the Round 287 predicate reporting `unchanged` across the deletion), E (mkdtemp roots,
no ambient dependence), F (the walk reached all 3), R (round288 re-drive), M, Y.

## 17:38 — Census red first, then gate, then sweep

```
CENSUS RED — 1 probe(s) in neither list.
    unclassified  probe-round291-…-the-recovery-path.mts
```

Working as designed. **Seventh consecutive fire** where the agreed census self-enrolment convention
would have made this step unnecessary; six rounds old, both seats agreed, neither built it. Classified
DEFERRED in the same commit — sixth distinct reason, and the first that is *inherited*: arm R spawns
round288, so it takes on round288's reasons.

Gate, each leg via `spawnSync` with output to a file and read back — **nothing piped**:

```
GATE ok exit=0 census
GATE ok exit=0 typecheck
GATE ok exit=0 server · files: 140 passed (140) · tests: 2174 passed | 1 skipped (2175)
GATE ok exit=0 client · files: 25 passed | 13 skipped (38) · tests: 324 passed | 13 skipped (337)
```

Sweep — the load-bearing check for this change, since widening the graded set is exactly what would
redden innocent probes:

```
SWEEP BLOCKED — 17 of 18 swept probes green, 0 red, 1 blocked (did not conclude),
                0 census problem(s), 103 deferred
```

**Byte-identical to Theseus's §7 except `102 deferred` → `103`** (my one file). **Zero red.** Blocked
one is round225, the same legitimate BLOCKED he recorded — dev server still holds 3001/5173.

## 17:41 — Pushed

```
$ git push origin HEAD:main
   f2a2df34..610824e1  HEAD -> main
```

Pushed before the memo and log were written, per the incremental-push discipline.

## 17:48 — Session wrap verification

Step 1 — commits landed on `origin/main` (after `git fetch origin`):

```
$ git log origin/main --oneline -5
144b08e1 mail+coord+log: Round 291 -- W1 re-drive closed at 17/17, and the backup git cannot restore was ungraded
610824e1 round291: the sentinel graded the primary database and not the backup git cannot restore
f2a2df34 mail+rollup+coord: SWEEP -- backfill GO flagged ready-to-run (unassigned), eviction closure proposed, entity-delete opened with Iris
c725804e docs: fix self-referencing paths in three docs -- full repo-root paths were doubling when resolved relative to the containing file's own directory
f64309e8 mail(cio->argus cc janus,themis,xian): research hub Q1 -- Klatch decision-model candidates?

$ git rev-list --left-right --count HEAD...origin/main
0	0
```

Both fire commits are on `origin/main`.

Step 2 — every deliverable verified **in the `origin/main` tree**, not merely on disk locally
(`git ls-tree -r origin/main --name-only -- <each path>`) — checking the remote tree rather than the
working copy, because a local `ls` cannot distinguish delivered from stranded:

```
docs/COORDINATION.md
docs/logs/2026-09-28-1717-daedalus-opus-log.md
docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-your-w1-is-17-17-here-and-the-sentinel-was-not-grading-the-backup-git-cannot-restore-2026-09-28.md
scripts/lib/db-sentinel.mts
scripts/probe-round291-the-sentinel-did-not-grade-the-backups-that-are-the-recovery-path.mts
scripts/sweep-probes.mjs
```

All six returned. Step 3 — this log's own verification block is committed and pushed last, so the
`origin/main` listing above names the log at commit `144b08e1`; this appended block lands in the
follow-up commit recorded at the end of this file.

Nothing was left uncommitted. The wrapper owns delivery; this section records only what I could verify
from `origin/main` this session.

## Discipline

No port bound. No model call. No network beyond `git`. **No database inside this repository was
opened, read or written** — the three real backups were `statSync`'d and name-tested, never read;
`klatch.db` was hashed by the sentinel and nothing else. Arms D/E build replicas under `mkdtemp` in
the OS temp dir using the real *names* with fake bytes, so arm D's "destruction of 5.71 MB" destroys
nothing real. Arm Y2 pins the graded set unmoved. All probe and gate output went to files under
`.testdata/r290-daedalus/` and was read back; every exit code above is `spawnSync().status`.

## Open at close

- **Mine, carried, untouched this fire** (stated, not implied): CLI end-to-end for predicate 8; the
  "2 of 12" intermittent in round250; predicate 8's write-then-restore blindness.
- **New, deliberately not done:** the inert `sizing-copy` sidecar pair. Deleting two files in the
  graded set is what predicate 8 exists to notice; it needs a commit that says so, not a tidy-up.
- **For xian:** the 0.41 MB Sept-18 `klatch.db` backup at this worktree's root is now guarded but may
  not need to exist. Judgement about his data; untouched.
- **Both seats:** census self-enrolment. I will build it by Round 295 if neither seat takes it, and
  stop flagging it either way.
- **Sweep still has no scheduled channel.** Nothing this fire touched it.
