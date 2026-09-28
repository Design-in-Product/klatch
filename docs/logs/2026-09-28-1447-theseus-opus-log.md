# Theseus — 2026-09-28 14:47 PT (WORK fire) — Round 290

Model: Opus 5. Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`, synced to `origin/main` by the wrapper before the fire.

## 14:47 — Briefing

Read `docs/COORDINATION.md` (Theseus section current as of my 10:47 START fire) and `docs/mail/`.
One memo addressed to me since the last fire:

- `daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-all-three-of-your-items-are-built-and-the-sidecar-signature-is-not-evidence-of-no-write-2026-09-28.md` (Round 289).

He took all three items from my Round 288 §7 and routed exactly one back: **§3, arm W1 of
`probe-round288`, which FAILS on his tree and passes on mine.** Flagged, not patched — correctly, as
the fix is a judgement about what I meant to pin. That is this fire's work unit.

## 14:52 — First measurement, and it does not match his diagnosis

His §3: *"Your arm asserts the presence of a live holder on the machine it runs on, and it went green
for you because something on yours was holding it — a dev server, most likely."*

```
$ ls -la klatch.db*
klatch.db       1536000  Sep 17 19:58
klatch.db-shm     32768  Sep 20 19:55
klatch.db-wal         0  Sep 17 19:59

$ lsof klatch.db klatch.db-shm klatch.db-wal       → no rows, exit 1
```

Nothing holds `klatch.db` here either. The sidecars are eight days old — crash residue. My own
`probe-round288` line 318 asserted the same wrong thing from the other side ("which means something
is holding the real database open"). Both are reading a **file** and reporting a **process**.

## 15:05 — `probe-round290` written, and its first two drives were both holes

Wrote the probe to drive the mechanism rather than argue it. Drive 1 came back **4 of 15 FAILED**:

```
[L1a] FAIL  child pid 62907 · announced HELD: false · exitCode 1
[L3b] pass  … NO process holds them …
```

The holder child never started, and **L3b passed off that hole** — "no process holds it" is
trivially true of a holder that does not exist. L1a (the precondition arm) is the only reason it was
caught. Cause: the holder script was written under `mkdtemp`, and Node resolves bare specifiers by
walking up from the importing **file**, not from `cwd`, so `better-sqlite3` was unresolvable. Moved
the script under `.testdata/r290/`; added stderr capture so a future L1a failure names itself.

Drive 2: **3 of 15 FAILED**, and stranger — child alive, announced HELD, yet `lsof rows: 0` and
`-shm absent · -wal absent`.

## 15:20 — Six diagnostics, because the anomaly was load-bearing

Everything in §1 of the memo rests on "lsof shows no holder". If lsof could not see holders on this
machine, that claim was unfounded — the smaller-number detector family, and I was one step from
publishing it. So: validate the instrument before drawing the conclusion.

- **diag1** — WAL sidecars appear on open and vanish on clean close in tmpdir. Mechanism fine.
- **diag2** — reproduced the probe's sequence: `readdirSync` showed all three sidecars while
  `existsSync(-shm)` returned **false** and `-wal` **true**. A teardown caught mid-flight.
- **diag3** — same cycle in **both** filesystems (OS temp dir and inside the repo), with `statSync`
  alongside: sidecars present while held, and **present 1.5 s after SIGKILL** in both. So the
  orphan-survival hypothesis is right and diag2 was measuring something else.
- **diag4** — **the instrument, validated:** `lsof -- <file this process holds>` → status 0, 1 row,
  correctly resolving the `/var/…` symlink to `/private/var/…`. `lsof` works here. So the earlier
  zero was real and the child genuinely was not holding the database.
- **diag5** — four variants. `dropped` → no holder, no sidecars. `retained` → holder, sidecars.
- **diag6** — repeated, with a `FinalizationRegistry`: `dropped`/`retained` reproduce 2/2 each;
  `COLLECTED` **never fired** in 2.5 s.

**Finding:** a spawned child that drops its `db` reference stops holding the database within a few
hundred ms **while its process stays alive**. The reclamation path is *not* established — the
registry never fired, so "the GC finalizer closed it" is a plausible story, not a measured one. The
observable and the remedy are what `probe-round290` arms K pin. Rule: **process liveness is not
resource liveness.**

Fix: `globalThis.__klatchR290Holder = db;` in the holder. L3b now SKIPs rather than passing when no
holder was established.

## 15:40 — `probe-round290` green, 18/18 exit 0

`All 18 regression checks passed.` — L0/L1a/L1/L2/L2b/L3a/L3b/L4, K1–K3, G1–G5, Y1/Y2, plus M1–M3
as measurements.

```
[L3a] pass  the sidecars SURVIVE the holder being killed — after SIGKILL of pid 63813: -shm present · -wal present
[L4]  pass  and they are cleared by the NEXT clean writable close
[K2]  pass  a live process is not a live holder
[G3]  pass  NON-VACUITY: the same three names under .testdata/ are graded by NOTHING
[M2]  MEAS  processes holding this tree's klatch.db right now: 0 — ORPHANED residue, not a live holder
```

## 15:48 — W1 repaired in `probe-round288`

The portable premise, not the ambient fact: **the sentinel grades sidecars outside `.testdata/`** —
a property of `snapshot()`'s path rule, checked against a `mkdtemp` root (`snapshot()` takes its root
as a parameter — Daedalus's Round 289 §7 improvement, taken, so no graded litter at the repo root).
The ambient reading survives as measurement **W1m**. Header and the line-318 comment corrected.

Re-driven: **`All 17 regression checks passed.`** — same total, since W1m is a measurement.

Limit stated and not claimed away: I have **not** run this on a tree lacking the ambient sidecars.
It is independent of them by construction; "by construction" is an argument, not a drive. Daedalus's
tree is the known negative and §8 of the memo asks him for it.

## 16:02 — The sweep found a red I caused, and under it a defect I did not

`SWEEP FAILED — 16 of 18 green, 1 red` → `probe-round224`, arm G, naming `sweep-probes.mjs` — a file
I had edited this fire only to add a DEFERRED comment. Arm G:

```js
return /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
```

Raw source. Measured both versions rather than inferring:

```
HEAD      RAW      SKIP=false checksPassed=true  summariseAndExit=false  => flagged=false
          STRIPPED SKIP=false checksPassed=false summariseAndExit=false  => flagged=false
WORKING   RAW      SKIP=true  checksPassed=true  summariseAndExit=false  => flagged=true
          STRIPPED SKIP=false checksPassed=false summariseAndExit=false  => flagged=false
```

**At HEAD, two of the three terms were already satisfied by COMMENTS.** The file sat one word from a
red about nothing, and had done for as long as the detector existed. I supplied the word.

Repaired to `stripSource(src, false)` — comments blanked, **strings kept** (a hand-rolled summary
line *is* a string literal; blanking strings is the smaller-number failure in the other direction,
which Daedalus's §4 measured at two files). Added the detector's own known positive and known
negative. **64/64 → 66/66.** Third instance of Round 288 §3's mechanism: a correct regex applied to
un-normalised input, where prose gets a vote.

## 16:15 — And I broke the census for two minutes

Updating round224's SWEPT pin 64 → 66, I wrote `why` as a two-line concatenation:
`CENSUS RED — 1 entry-schema problem(s)`, and `probe-round261` and `probe-round269` went red with it
because they read the entry table. **Three reds from a line break.** Daedalus's 267 §5 / 269 schema
check did exactly its job. Rewritten on one line in the existing `reports N/N` shape.

## 16:22 — Gate and sweep, no pipe

```
GATE ok exit=0 census
GATE ok exit=0 typecheck
GATE ok exit=0 server · files: 140 passed (140) · tests: 2174 passed | 1 skipped (2175)
GATE ok exit=0 client · files: 25 passed | 13 skipped (38) · tests: 324 passed | 13 skipped (337)
GATE ok exit=0 gate(census+typecheck+server+client)
```

Server and client byte-identical to Daedalus's Round 289 §7.

```
SWEEP BLOCKED — 17 of 18 swept probes green, 0 red, 1 blocked (did not conclude),
                0 census problem(s), 102 deferred
sweep-probes — 120 probe files under scripts/ · swept 18 · deferred 102
               verdict-bearing: 26 · no conclusion line: 76
CENSUS OK
```

The blocked one is `probe-round225`, and its cause is verified, not assumed:

```
3001 HELD · 5173 HELD    at 2026-09-28T22:04:35Z
```

Both held together is `npm run dev` (my Round 286 discriminator). Legitimate third state, fourth
consecutive fire.

## 16:30 — The dev server is holding a different tree's database

`npm run dev` is running, and `lsof` says nothing holds *this tree's* `klatch.db`. Resolved:

```
node 40766 xian 24u REG    4096  /Users/xian/Development/klatch/klatch.db
node 40766 xian 26u REG  210152  /Users/xian/Development/klatch/klatch.db-wal
node 40766 xian 27u REG   32768  /Users/xian/Development/klatch/klatch.db-shm
```

**The main checkout, not this worktree.** Daedalus's hypothesis was half right in a useful way:
there is a dev server, it holds a `klatch.db`, and it is not the one W1 read. Three trees, three
states, one phrase "the graded set" — his (no sidecars), mine (orphans, no holder), main checkout
(live holder, 210 KB `-wal`).

## 16:40 — A stale claim caught in my own draft

Drafted memo §8 with "**Twenty-first flag** on `COORDINATION.md` size: **3771** lines … unopposed,
unruled, xian's call" — the line I have written in some form for twenty fires. Measured before
sending:

```
$ wc -l docs/COORDINATION.md
    3030
```

Wrong by 741, and wrong in kind: the file has **shrunk**. `c30e3085`, Calliope, 08:38 this morning —
pre-9/1 history moved verbatim to `docs/coordination-archive/2026-08.md`, 3,743 → 2,985, on Janus's
relay of xian's OK, verified lossless by multiset diff. **The thing I had flagged twenty times was
done six hours before this fire, and my next act was nearly to report it as still open.** Corrected
in the memo rather than quietly dropped, because it is the precise failure the verify-before-
asserting rule exists for — and the cheap version of that rule (check the number) is what caught it.

## 16:45 — Discipline

No port bound — the 3001/5173 reads are connects that destroy the socket, recorded as timestamped
measurements and never as checks, because they are facts about this machine that decay. No model
call, no network beyond `git`. **No database inside this repository was opened, read or written** —
`klatch.db` was hashed by the sentinel and nothing else. Every live SQLite connection was to a
`mkdtemp` database under the OS temp dir; nothing was minted at the repo root at all, so round290's
graded delta is empty by construction rather than by cleanup (arm Y2). The only in-repo write was a
holder script under `.testdata/r290/`, removed in a `finally`. Six throwaway diagnostics deleted.
Every figure here is from a redirect to a file or direct tool output — **nothing piped**.

## 16:50 — Session wrap verification (CLAUDE.md protocol)

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -3
b7866880 Round 290: sidecar presence is not a live holder, and W1 pinned the wrong thing
efffd655 docs+mail: state-of-Klatch conversation plan (two mediums, xian+Calliope+Iris) and opening mail to Iris
aed025a8 mail(janus->calliope cc xian,…): backfill ruled moot; xian's answers on restrictions
```

`b7866880` is the work commit, rebased onto `efffd655` (another seat pushed mid-fire; rebase clean,
no conflicts, verified by `git log` before pushing) and pushed **during** the fire.

**Step 2 — every deliverable present in the `origin/main` TREE** (`git ls-tree -r origin/main`, not a
local `ls` — the memo-is-not-a-delivery rule):

```
docs/COORDINATION.md
docs/logs/2026-09-28-1447-theseus-opus-log.md
docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-w1-diagnosis-is-one-inch-off-and-the-dev-server-is-holding-a-different-trees-database-2026-09-28.md
scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts
scripts/probe-round288-predicate-8s-red-branch-had-never-been-observed-to-fire.mts
scripts/probe-round290-orphaned-sidecars-are-not-a-live-holder-and-w1-pinned-the-wrong-thing.mts
scripts/sweep-probes.mjs
```

All seven present. (This log file is amended and pushed after this block, per Step 3.)

**Re-driven on the committed files, after the push, no pipe:**

```
$ npx tsx scripts/probe-round290-…mts   → exit 0   All 18 regression checks passed.
$ npx tsx scripts/probe-round288-…mts   → exit 0   All 17 regression checks passed.
$ node scripts/sweep-probes.mjs --census → exit 0
  sweep-probes — 120 probe files under scripts/ · swept 18 · deferred 102
  CENSUS OK — every probe under scripts/ is in exactly one list, and every entry agrees with its own pin.
```

`git status --porcelain` is empty: nothing uncommitted, the `.testdata/r290/` holder script is gone,
and all six throwaway diagnostics are deleted.

**Nothing opened this fire that it could not finish.** Two items are named as handed on rather than
done, and neither is claimed: (1) the repaired W1 has not been driven on a tree *lacking* the ambient
sidecars — Daedalus's tree is the known negative and memo §8 asks him for it; (2) round290's `lsof`
dependency is a portability cost I accepted rather than solved, and I have not looked for a
Node-only holder oracle. The reclamation path behind the K arms is likewise explicitly **not**
claimed — only the observable and the remedy are pinned.

## Mail state

Daedalus's Round 289 memo answered in the same fire it was read. **Not** moved to `docs/mail/read/`:
open items remain on both sides (my §8 asks him to re-drive round288 on his tree; his own §8 carries
the predicate-8 CLI end-to-end, the round250 intermittent, and the six-round-old census
self-enrolment convention). Per close-discipline, open threads stay visible in `docs/mail/`.
