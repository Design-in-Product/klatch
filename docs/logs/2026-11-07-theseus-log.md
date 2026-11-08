---
agent: Theseus
date: 2026-11-07
model: claude-opus-5
---

# 2026-11-07 — Theseus session log

## 10:4x — START fire open, briefing

Pulled; worktree synced by the wrapper, `HEAD` == `origin/main` == `b4261648` (Daedalus's own
START-fire wrap commit). Tree clean. Read `docs/COORDINATION.md` (my section at `:4386`), listed
`docs/mail/`.

**No `2026-11-07-theseus-log.md` existed** — four other agents' logs for today did
(`argus`, `calliope`, `daedalus`, `iris`), so this is my first fire of the day and this file is new,
per the one-file-per-agent-per-day convention.

**Mail addressed to me, read in full in the same turn as the listing:**

1. `daedalus-to-theseus-cc-…-both-your-routed-items-are-cured-arm-d-was-ungradeable-not-blind-and-your-fix-as-written-reddens-on-a-healthy-product-2026-11-07.md`. Both of my routed §7 items cured
   and driven. His §1 goes further than my §4.2 did: arm D's fixture built its `-wal` with
   `writeFileSync(p + '-wal', '')` — **zero bytes** — so the arm was not weak but *ungradeable*. His
   §2 refutes my suggested fix as written (one byte check spanning both sidecars reddens on a
   healthy product, because the `-shm` legitimately moves 0 B → 32,768 B). Taken; he is right.
2. Calliope, 11-05 and 11-06 — both informational, nothing asked of me. Left live rather than moved:
   their boarded items are still open on xian, and they are addressed to agents other than me.

**His §5 listed one thing as nobody's:** *"Still ungraded, and neither of us should cite it as
measured: the size guard at the cleanup site. Your Y2 found it dead; X1 doesn't grade it either."*
The product source says the same thing about itself. That is the unclaimed, gradeable item on the
board, and grading a guard nothing reaches is this seat's work. Took it.

## 10:5x — pilot, declared as a pilot

Before registering anything: is the state even buildable? The source's own claim is that a non-zero
`-wal` at the cleanup can only come from another process *between the open and the close*. Window is
`:608` capture → `:611` read-only open → `:627` `await source.backup(...)` → `:691` cleanup.

`.scratch/u465sg/pilot.mts` (gitignored, not an instrument, not cited as a result): 66,678,784-byte
seeded WAL db, sidecars removed, tool spawned `--apply --no-migrate`, poll for the tool's own
`-wal`, one committed row from a second connection held open.

```
-wal appeared at +367ms (0B), commit done at +367ms, -wal now 8272B
child exit 1 at +615ms
after: -wal 8272B  -shm 32768B
```

Buildable, ~248 ms of slack. That is the pilot's whole contribution; its figures are superseded by
the driver's, because a feasibility run is not a measurement of its own subject.

## 11:0x — pre-registration, pushed as the only file in the directory

`docs/research/unit-465sizeguard-2026-11-07/PRE-REGISTRATION.md`, commit `2a8b9f75`. Verified rather
than asserted: `git ls-tree -r origin/main` over the directory returned **one** path.

2×2 over {race, cripple}, 11 predictions. §6 names the failure mode I was most exposed to — a
**vacuous green in drive 2**, because a commit landing after the cleanup leaves the same non-zero
`-wal`. That section is why drive 3 is load-bearing twice: it grades the guard, and it is the only
evidence drive 2's green is about the guard at all.

## 11:1x — driver and C1, committed before being driven

`55f48262`. Two instrument rules obeyed because Daedalus paid for them this morning: `spawn` with
both child streams echoed into the recording (his defects 1 and 2 — `execFileSync` drops stderr on
a run exiting 0, and the probe captures streams into a local it never echoes), and an empty sentinel
recorded as **"cannot say"**, never as "did not fire" (his defect 3, false on every drive of one
arm).

## 11:2x–11:4x — drives 1–7

```
drive 1  R off C off  66,678,784B  after -wal:absent -shm:absent
drive 2  R on  C off               after -wal:8272B -shm:32768B   row visible
drive 3  R on  C ON                after -wal:absent -shm:absent  row unreadable
                                   sentinel "C1 fired: -wal 8272B -> removing (destroyed 8272B)"
drive 4  R off C ON                sentinel "C1 fired: -wal 0B -> removing (destroyed 0B)"
drive 6  500 pad rows  16,732,160B WINDOW OPEN 10/10
drive 7  no padding        81,920B WINDOW OPEN 10/10
```

**The guard is live.** 8,272 bytes of a live writer's committed frames destroyed with the test
removed. **Drive 4 is the cell that explains two rounds of "ungraded":** the cripple fires and
destroys **0 B**, because without the race there is nothing in the `-wal` to destroy. Same shape as
Daedalus's `unit-465armd` drive 2 from the other direction.

**Drive 5 caught a defect in my own registration.** P7 was keyed on cell 5 — `R on, C off` — which
is exactly the cell my own §6 says cannot prove the window was open: `window OPEN` there prints off
`commitAt > 0`, bookkeeping about my driver rather than evidence about the product. Added cell 7
(same fixture size, cripple on, window keyed on destroyed bytes) to grade it properly, after cells
1–5 were driven and before 6 and 7 were; the drive numbering and RESULTS §4 say so rather than
leaving it tidy and unmentioned.

**P7 REFUTED, in the cheap direction.** 10/10 at the probe's own fixture size, **no padding**. And
my mechanism was wrong too: the `-wal` appears at **+331–346 ms on both sizes** — that leg is
`npx tsx` startup plus the open, not the copy. Padding buys the remainder of the child's life
(222 ms at 66 MB, 43 ms at 82 KB), and 43 ms is already ~40× the 1 ms the commit costs.

## 11:5x — arm E promoted into the probe, and why it is keyed on an inode

A race-shaped arm's failure mode is a **green**, not a flake. So arm E is keyed on the `-wal`'s
**inode**: SQLite writes into the file the tool's own open created, so the racer's commit landing in
*that* inode proves `sidecarsBefore` was captured with it absent and the cleanup had not yet run. A
different inode means the racer made its own file afterwards, and the arm **refuses rather than
passes** — three attempts, then red. Would have been the fourth instance of the two-greens-either-
side shape, built by me, into a file four agents run; first one caught before shipping.

Graded the way every arm this round was — the same cripple, dead in the cells that existed before it
and live in the one it adds:

```
drive 8   probe + C1   [A][B][C][D] ALL GREEN (11 checks); [E] 2 of 3 red;  2 of 14 FAILED
drive 9   probe clean  14/14
drive 10  cripple removed from source, clean   14/14
drive 11  cripple removed from source, C1 set  14/14   (the gate variable is inert)
drive 12  five consecutive clean drives        5/5, 1 attempt each, 2,478–2,805 ms
```

## 12:0x — C2, because my draft had a hypothesis wearing a conclusion's clothes

My first draft of RESULTS §3 said the `-shm` removal is what makes the database unreadable, on the
grounds that C1 removes both. Not measured. Built **C2** — size test removed, `-shm` **kept** — and
drove the probe under it (`drive13`):

```
4 of 14 FAILED
  [A] no sidecar beside the refused target — -shm
  [B] no sidecar beside the dry-run target — -shm
  [E] a -wal written inside the window keeps every byte — -wal:8272B committed -> -wal:absent
  [E] another process can still read the database it is writing — unreadable (disk I/O error)
```

**Refuted.** With the `-shm` intact the reader still gets `disk I/O error`, so it is the `-wal`
unlink alone. Two things out of the same drive: **arms A and B grade the `-shm` removal**, which
nobody had shown and which the E4/E5 ordering decision now has to hold alongside; and `drive14`
re-drove the same mode after C2 was removed from source at **14/14**, so the published tree carries
no cripple and the gate variable is inert.

**And P5's gloss was wrong.** I registered *"committed data gone."* 21 reps of 21 say
`racer-row(open) open failed: disk I/O error` / `racer-row(closed) visible` — the row is **not**
lost. The database becomes unopenable for every *other* process, and when the writer's own
connection closes it checkpoints the frames back through the descriptors it still holds. Worse than
predicted operationally (the app is the writer, and the app is what stays running), better for
recovery. Counted with `grep -c`, 21/21 on both lines and 21 `destroyed 8272B` lines, before
publishing the figure.

## 12:1x — two false sentences, one of them mine

- The source comment's *"The size test is kept and is **NOT graded by anything**"* is now false.
  Replaced with what grades it, what the cripple destroys, and why the inode rather than timing.
- `unit-465walcell-2026-11-06/RESULTS.md:122` — *"The size test is therefore ungraded, and nobody
  should cite it as measured."* Correct on the day, wrong now. Carries a **superseded-note** rather
  than a rewrite: the Y2 figures stand (42 arm lines byte-identical) and a round's reading of its
  own recordings is part of the record; the pointer is there so nobody cites the sentence without
  the correction. Censused with `grep -rn` over `scripts/ docs/ packages/` for both spellings — two
  sites, both handled, no third.

## 12:2x — mail out, mail closed

Memo to Daedalus and Argus, separate commit pushed to `main` on its own per the worktree mail rule:
`theseus-to-daedalus-argus-cc-…-the-size-guard-is-live-not-dead-it-was-unreachable-and-the-harm-is-unreadability-rather-than-loss-2026-11-07.md`.

Closed the superseded 11-06 Daedalus/Theseus pair into `read/`. Counted with `readdirSync`:
**70 live / 1185 read** before, **68 / 1187** after. Balances against yesterday's 68/1185 exactly —
the +2 live is his 11-07 memo and my reply. Today's pair left live (E4/E5 and the promotion decision
are open in it).

**Drain:** mail read, answered and closed in the same fire; the one item his §5 left unclaimed
taken, built, graded, cured, landed and gated; three defects of my own caught by my own
pre-registration and recordings, written down rather than folded into a HELD; one item routed with a
**named** blocker — the probe is in the sweep's DEFERRED list, so the guard is **graded but not
gated**, and promotion is Daedalus's instrument and Argus's list, their own DEFERRED entry saying a
hand drive is the reason to promote rather than the promotion. Nothing deferred to "later". The
three items standing on xian are unchanged and I am not re-asking them.

## Wrap verification

**Step 1 — my commits on `origin/main`.**

```
$ git log origin/main --oneline --author=Theseus --since="2026-11-07 00:00"
bedbe017 mail: close the superseded 11-06 Daedalus/Theseus pair — both carried forward in today's who-has-what
63655951 mail: Theseus -> Daedalus, Argus — the size guard was unreachable rather than dead, and arm E grades it
17ff180c unit-465sizeguard: RESULTS + C2 — the guard is live, and the harm is unreadability rather than loss
429a8a11 unit-465sizeguard: arm E promoted into the probe, cripple removed, source sentence corrected
8c894499 unit-465sizeguard: drives 1-7 — the guard is live, and the window is free to build
55f48262 unit-465sizeguard: driver + env-gated C1 cripple, committed before being driven
2a8b9f75 unit-465sizeguard: pre-registration — the race is the only state the size guard can fire in, and no existing fixture builds it
```

**Step 2 — every deliverable by path, read off `origin/main` rather than off the worktree.**

`git ls-tree -r origin/main` over the unit directory returned **33** files: `PRE-REGISTRATION.md`,
`RESULTS.md`, three instruments (`drive-sizeguard.mts`, `drive-probe.mts`, `stability-5.mjs`) and
`drive1`–`drive14` as `.out`/`.err` pairs — 2 + 3 + 28 = 33, and no scratch. A second `ls-tree` over
the eight named paths outside it — `scripts/probe-backfill-sidecar-neutrality.mts`,
`scripts/backfill-entity-bindings.mts`, `docs/research/unit-465walcell-2026-11-06/RESULTS.md`,
`docs/COORDINATION.md`, this log, the outbound memo, and the two closed memos under `docs/mail/read/`
— returned all eight. **41 asked for, 41 returned.**

**Step 2b — the cripples are actually gone from the published tree, read off the remote blob and
not off my worktree.** `git show origin/main:scripts/backfill-entity-bindings.mts` grepped for
`KLATCH_U465SG` and for the crippled branch conditions: **0 matches**, and the cleanup block as
pushed is

```
706:    const wal = fs.existsSync(dbPath + '-wal') ? fs.statSync(dbPath + '-wal').size : 0;
707-    if (wal === 0) {
708-      fs.rmSync(dbPath + '-wal', { force: true });
709-      if (!sidecarsBefore['-shm']) fs.rmSync(dbPath + '-shm', { force: true });
710-    }
```

which is the shipped form, unchanged by this unit. `drive11` and `drive14` are the behavioural half
of the same claim — both gate variables set, both at 14/14 — and neither of them is evidence on its
own: *a declared cripple no hook reads runs clean*. The reach evidence is `drive 8` and `drive 13`,
same variables, cripple present, red.

`git status --short` otherwise clean. The arms' temp databases live under `os.tmpdir()`; the pilot
and the commit-message files are under the gitignored `.scratch/`, and nothing from either was
staged — every commit in this fire staged **by name**, not by directory, which is the half I got
wrong yesterday.

**Step 3** — this log's own commit lands after the lines above were read off the remote.

---

## 14:4x — Session resumed (WORK fire), model `claude-opus-5`

Briefing done in order: `git fetch`, `docs/COORDINATION.md`, `ls docs/mail/`. Checkpoint is Argus's
WORK-fire tip `3e429dee`. The 10 commits above my own START-fire tip (`b4164916`) were
**author-checked before use** with `git log --format='%h %an'`: 8 Daedalus's, 2 Argus's, **none
mine** — and this matters, because the memo I spent the fire on was one of Daedalus's and I would
otherwise have been reading my own commit subjects as his.

**Mail.** One memo addressed to me, landed after my START fire closed: Daedalus, ~13:5x — *my inode
key is right and sound on APFS (0 reuses in 500 trials, both controls carried), and promotion is
declined because arm E has no refusal limb for its own race.* Read in full. Its §7 assigns me two
things by name — the §4 cure shape and the §1 platform line — and says explicitly why he did not
write them himself: *"It is your arm, one fire old, and you asked for a reading rather than an
edit."* One memo cc'd to me (Argus → Daedalus, restoration diff claim stale, substance clean); read,
nothing asked of me. Also checked, before assuming it was new: his *"both your routed items are
cured"* memo (`fefa3b8e`) predates my START fire and was already actioned there — `git log -1 --
<path>` on each of the three, rather than reading the dates in the filenames.

**Took both items, same fire.** Unit `docs/research/unit-465skipE-2026-11-07/`.

## 15:0x — pre-registration, and the trade I had to declare before driving

Pushed `PRE-REGISTRATION.md` as the only file in the directory before any instrument in it existed
(`git ls-tree -r origin/main` over the directory, one path returned). 9 predictions, one cripple
(C1, the size test removed), one **state builder** (X1, a deterministically lost race), landing rule
set before any result: the cure reverts if the real probe does not produce exit 3 *and* the
structural `did not run:` line. Daedalus measured that pair against a fixture, and *a foil must run
at the granularity of its claim*.

The thing that needed registering before driving rather than explaining afterwards: arm E's first
check, `'the race state is built'`, is a **precondition**, not a claim about the product. Under the
cure the exit code enforces it, so a row emitted only on the branch that makes it true is **green by
construction**. It becomes an evidence line, the arm publishes two claims instead of three, and the
green conclusion reads **13, not 14**. Declared with its consequence — every `14 of 14` / `2 of 14` /
`3 of 14` figure in three units and the `DEFERRED` note is a record of a drive that happened and
stays true as one; what needed handling was any live sentence asserting the count in the present
tense.

## 15:1x — cure, X1, C1, committed before being driven

Cure: `skipped.push('the race state could not be built')` on the not-built path, through
`probe-outcome.mts`'s hard-skip channel, with the two downstream claims moved into the `else`. The
label carries **no attempt count** on purpose — `ATTEMPTS` is a constant above it and a number baked
into a declared label drifts the moment it changes, while the sweep's `skip:` pattern is matched
against that exact line. The count goes on the evidence line.

`skipped` is a module-level `const … : string[] = []`, never re-assigned, elements pushed as string
literals — the three properties `probe-round224` arm Q3 holds over every caller of that field. I
read `lib/skipped-shape-census.mts` and Q3 **before** writing the caller rather than after, because
the one thing that reddens Q3 is a caller shaped carelessly.

Also in the same commit: the §1 platform line (the inode key is sound on APFS where this probe runs
and would need re-measuring on ext4, with his figures cited at the place they were taken), and the
`skip:` regex a promoting entry needs written into the probe's own `skipped` docblock — because the
exit-3 pair is only half of what `classify`'s BLOCKED limb accepts and the other half is a
declaration in a file I do not own.

## 15:2x — drives 0–4, and a red from my own detector on the first pass

`classify` **imported** from `sweep-probes.mjs`, never re-spelled. Five arms, each a real `npx tsx`
run of the real probe:

```
drive0  control             exit 0  2558 ms  All 13 regression checks passed.           PASS
drive1  X1, race lost       exit 3  3416 ms  did not run: the race state could not …    BLOCKED
drive2  C1, size removed    exit 1  2692 ms  2 of 13 FAILED: -wal:absent / unreadable   RED
drive3  X1 + C1             exit 3  3575 ms  did not run: …                             BLOCKED
drive4  control, repeat     exit 0  2539 ms  All 13 regression checks passed.           PASS
```

**P4 is the one that decides promotion**, and the declaration is load-bearing in both directions:
`drive1` reads BLOCKED with `skip:` declared and on the line, **RED** with no declaration, **RED**
with a declared label absent from the line. Arm E emits **0** check rows in that state, so the two
lines whose reason text used to contradict their own verdict are not reached rather than suppressed.

**My own P3 detector went red, and it was the detector.** `out.includes('keeps every byte')`
reported `EMITTED` in the skip state. Arm **D**'s row is `a pre-existing -wal keeps every byte` — an
undifferentiated containment match, fusing two arms' claims. The substance of P3 was fine from the
first drive; my reader could not say so. Re-keyed on arm E's own `[E]`-prefixed rows and re-driven.

**And a second one.** My conclusion reader printed `(none)` for the red drive, because I had copied
the sweep's `CONCLUSION` list — `[/^INCONCLUSIVE — /, /^FAILED — /, /^All \d+ …/]` — and
`probe-outcome`'s failure headline is `N of M regression check(s) FAILED.`, matching none of the
three. I went looking for a dead pattern in the sweep and **did not find one**: `/^FAILED — /` is
live for the hand-rolled probes that do not summarise through `probe-outcome` (`probe-round298`,
`-299`, `-305`, `verify-expand-reachability.mjs`, `probe-scratch-server.mjs`, censused with
`grep -rn`), and the sweep reaches `probe-outcome`'s headline through its `NOT_A_CONCLUSION`
fallback. A defect in my reader, none in his; recorded as **refuted** rather than dropped.

Both repairs are written into the driver beside the code that was wrong. Also made the driver write
its grading rows to a **file** — the first pass left them in a terminal, which makes the one artefact
carrying a verdict the one artefact nobody can re-read — and gave every artefact a `tag:` prefix, so
the clean re-drive could not overwrite the cripple-present recordings under the same names.

## 15:3x — P6 and P7: a prose figure in his module had drifted five sites

**P6 to every digit.** Predicted 55 sites, 32 files, 24 literal arrays, 31 identifiers (29 locals + 2
params), 29 declarations all array-initialised with 0 re-assignments, 52 pushes all literal. Q3 —
the gate, not my scratch reader — printed exactly that, at `All 192 regression checks passed`.

**P7 held, and it is the finding.** `probe-outcome.mts`'s `skipped` docblock froze its caller
population at *"50 argument sites in 29 files: 21 array literals and 29 bare identifiers (27 …
locals …). All 50 elements …"*. Measured **before** this unit touched anything: **54 sites in 31
files, 24 literal arrays, 30 identifiers, 51 pushes** — four sites and two files past the sentence,
before I added the 55th. The **gate never drifted**: Q3's predicate is `reachable === 0` and every
count in its label and `got` string is computed each run. Only the paragraph did, whose own closing
line reads *"prose beside a decision is not the record — the arm is."* It had become its own
counter-example.

Cured by **removing** the frozen counts rather than refreshing them — a refresh re-arms the same
drift at a later date — with the old sentence quoted and dated so the drift stays legible. And
registered as a prediction before being read, which is the only reason it is a finding rather than a
repair nobody can grade.

**Unregistered finding from a drive nobody designed for it.** `drive3` — a lost race against a
**crippled** product — also reads BLOCKED. Correct: nothing was measured, so nothing may be
concluded. But it is the cure's own shadow — arm E's power is conditional on winning the race, and a
BLOCKED row is *"we do not know"*, never *"the guard is intact"*. Before the cure that state was a
red that looked like a product defect; after it, the comfortable misreading is the wrong one. In
RESULTS §5, the memo §5 and the `DEFERRED` note.

## 15:4x — restoration, gate, mail

**Restoration against a pre-action baseline**, not a quiet `git status`:
`grep -rln 'U465SKIPE' scripts/ packages/` → no files, and `git diff --stat a7a91c12 -- scripts/
packages/` returns `scripts/probe-backfill-sidecar-neutrality.mts | 75 insertions(+), 16
deletions(-)` and **nothing else**, so `backfill-entity-bindings.mts` is byte-identical to the
pre-cripple tree. The five post-removal drives are **bookkeeping, not evidence** — *a declared
cripple no hook reads runs clean*; the reach evidence is `drive1`/`drive3` (3 attempts consumed, two
different inodes printed) and `drive2` (8,272 bytes destroyed).

**Gate:** `GATE ok exit=0` on census, typecheck, server, client and the aggregate — server
**143 / 2221 / 1 skipped (2222)**, client **26 / 13 skipped (39)** files and **333 / 13 skipped
(346)** tests. This unit adds no vitest test, so a moving gate would have been the finding.

**Mail out**, separate commit pushed straight to `main` per the worktree mail rule:
`theseus-to-daedalus-argus-cc-…-both-your-items-are-in-the-probe-the-promoting-entry-needs-this-exact-regex-and-your-own-modules-prose-had-drifted-five-sites-2026-11-07.md`.
Counted with `readdirSync`: **71 live / 1187 read** — the +3 live since my START fire's 68 being his
memo, Argus's memo and my reply, which balances exactly. His memo left **live**: its §5 is still
Argus's open item and E4/E5 is still a decision, and close-discipline says an open thread stays
visible.

**Drain:** mail read and answered in the same fire; both items his §7 assigned me taken, built,
graded, landed and gated; one finding in his module registered before it was read; two defects of my
own written in beside the code that was wrong. **Nothing deferred** — the promotion decision is his
to take and the entry is Argus's to write, and both now have the regex and the three-cell
measurement in hand. E4/E5 is the single open item and it is a decision, not unblocked work. The
three items standing on xian are unchanged and I am not re-asking them.

## Wrap verification

**Step 1 — my commits on `origin/main`.**

```
$ git log origin/main --oneline --author=Theseus --since="2026-11-07 13:00"
7840e10e mail: Theseus -> Daedalus, Argus — both §7 items landed, the promoting entry needs one regex, and probe-outcome's own prose had drifted
82d8300d unit-465skipE: cripples removed, RESULTS — the cure lands, and a prose census figure had drifted five sites
9ed11d18 unit-465skipE: drives 0-4 — a lost race is BLOCKED only with the declaration, and RED without it
d2637ffe unit-465skipE: driver, committed before being driven — classify imported, not re-spelled
c71aacf0 unit-465skipE: the cure + X1 + C1, committed before being driven
a7a91c12 unit-465skipE: pre-registration — a lost race is a precondition failure, and the built row stops being a check
```

**Step 2 — every deliverable by path, read off `origin/main` rather than off the worktree.**

`git ls-tree -r origin/main` over the unit directory returned **27** files: `PRE-REGISTRATION.md`,
`RESULTS.md`, `drive-skipE.mts`, `drive0`–`drive4` and `clean-drive0`–`clean-drive4` as `.out`/`.err`
pairs (20), two grading files and the `round224` pair — 3 + 20 + 2 + 2 = 27, and **no scratch**. A
second `ls-tree` over the five named paths outside it — `scripts/probe-backfill-sidecar-neutrality.mts`,
`scripts/backfill-entity-bindings.mts`, `scripts/lib/probe-outcome.mts`, `scripts/sweep-probes.mjs`
and the outbound memo — returned all five. **32 asked for, 32 returned.** `docs/COORDINATION.md` and
this log land in the commit below.

**Step 2b — the cripples are gone from the published tree, read off the remote blobs rather than
the worktree.** `git show origin/main:` on both files, grepped for `U465SKIPE`: **0 and 0**, and the
cleanup block as published is

```
704:if (!sidecarsBefore['-wal']) {
705-  try {
706-    const wal = fs.existsSync(dbPath + '-wal') ? fs.statSync(dbPath + '-wal').size : 0;
707-    if (wal === 0) {
708-      fs.rmSync(dbPath + '-wal', { force: true });
709-      if (!sidecarsBefore['-shm']) fs.rmSync(dbPath + '-shm', { force: true });
```

— the shipped form, unchanged by this unit, with the size test at `:707` intact.

**Step 3** — this log's own commit lands after the lines above were read off the remote. The arms'
temp databases live under `os.tmpdir()`; the census reader, the gate capture and the
commit-message files are under the gitignored `.scratch/`, and nothing from either was staged.

---

## 19:4x — Session resumed (STOP fire), model `claude-opus-5`

Briefing: pulled state is `f9d3127f`. `COORDINATION.md` read. Mail: **one new memo addressed to
me**, Daedalus's `~17:3x` (`…-swept-can-hold-exactly-one-skip-2026-11-07.md`, commit `94e6558b`),
newer than my last-logged WORK-fire entry. Live/read mail counted with `readdirSync`: **72 / 1188**
at wrap, the +1 live since my WORK fire being my own reply below — his memo was already in the 71 I
counted then.

His §6 assigned rounds 372–377's declaration-population arms to **me and Argus**. Argus's 11/07
STOP entry in `COORDINATION.md` took his §4 (`probe-round308`, found red and fixed) and carried §3
forward **unclaimed, "not urgent — currently green"**. Unblocked work with no named blocker, so it
is this fire's unit: `docs/research/unit-465declpop-2026-11-07/`.

## 19:4x — pre-registration, and the trap I registered before falling into it

`PRE-REGISTRATION.md` pushed at `ce5144fe` as the only file in the directory. 8 predictions, one
declared measurement, landing rule set before a result was read: **P1–P3 are publishable alone**,
and P5/P7 are controls that void the cure on a miss.

Registered, because it is the thing that would have made this unit wrong: **a literal grep for
`skip:` across `scripts/` hits three files and none of them in the predicate that fires.** The real
key is a property access, `SWEPT.filter((s) => s.skip).length === 1`, which a census over
`.(skip|refusal)).length` finds in exactly **two** of the five files. Five probes redden, two carry
the predicate the memo names — so **at least one further mechanism existed that neither the memo nor
my grep had named**, and the unit had to census what each failing arm asserts narrowness *over*,
read off the failing row. Also registered in advance (P4): `probe-round377` drives sandbox copies of
374/375 as **children** (`c375Drift.failed` at `:718`), so some of its reds may be inherited.

## 19:4x — driver, committed before being driven

`drive-five.mts` at `e3dd28d3`. The arm scrape keys on `summariseAndExit`'s `REGRESSIONS:` block
(`scripts/lib/probe-outcome.mts:938`) rather than on a `FAIL` token — my first draft scraped for
`/\bFAIL\b/`, which is not what this family prints. Block terminated by the first blank line **after
a row has been taken**, so the row I am looking for cannot become its own terminator.

## 19:5x — P1 and P2: his table reproduced, and the census is bigger than his axis

**P1 HELD:** 26/15/8/8/13, exit 0. **P2 HELD cell for cell** with his `apply-promotion.mts` run
verbatim (three declarations in `SWEPT`, nothing else changed): 1 of 26, 1 of 15, 3 of 8, 2 of 8,
5 of 13.

**P3, the finding.** Eleven failing arms, **three** root mechanisms over **four** arms:

1. `round372` A2 — a frozen **member list**, object-level, plus "no entry declares one without the
   other", which his entry violates *legitimately* (a `skip:` and no `refusal:`).
2. `round373` A2 — the same population frozen under an **independent source-text selector**
   (nearest-preceding-`file:` walk, `owners.length === 2`).
3. `round374` A5b / `round375` A5 — the frozen pair count. His, and the only one the grep could see.

**P4 HELD:** the other **eight** arms (374 A0/A1, 375 C1, 377 C1–C5) are controls driving child
copies against a verbatim copy of the live registry. They reddened because their children did.
`probe-round377` needed **no edit** and its five asserted child-drive arm lists did not move.

## 20:0x — the cure, and the one place his prescription needed changing

Cure at `7b1214db`, **committed before being driven under the treatment**, so a restore-from-HEAD
during the cripples could not discard it. `round374` A5b / `round375` A5 keyed on the declaring
**member list** rather than a live count — stricter than `=== 1`, which passes a declaration that
*moved* entries. `round372` A2 **re-aimed**, not re-keyed: its clauses were not stale freezes, they
were *true*, and his entry made them *false* correctly, so keying them "live" would have been a
deleted check. The two clauses are **withdrawn as pass conditions** because neither was ever a
requirement of that probe, and the load-bearing property (the graded entry declares *both*) is now
what is asserted. `round373` A2 keeps its cross-key agreement, compared entry-by-entry and
count-by-count, plus a new no-**orphan**-declaration conjunct.

Caught in my own draft before it was driven: I had written `owners.length === objectPop.length -
objectPop.length + owners.length` as a conjunct — a tautology, which is the vacuous-conjunct defect
this file family exists to refuse. Replaced with the orphan check, which is what I had meant.

**P7 HELD and driven BEFORE the cure was committed:** green at the P1 counts on the clean tree, so
the arms were not moved to fit the treatment. **P6 HELD:** cure in, entry pasted — 26/15/8/8/13,
exit 0 on all five. The registry blocker is cleared.

## 20:0x — P5, and the arm I could not grade

Three declared cripples, each the **sole** failing arm of its probe: `X2` → `round374` A5b 1 of 8;
`Y1` → `round375` A5 1 of 8; `Z1` → `round373` A2 1 of 15 (and it printed `3 of 45 declaration
line(s) found`, so the orphan conjunct caught it too).

**`round372` A2 has no driven control and RESULTS says so.** Its deciding state crashes `A1b`'s
`r225.skip!` upstream. I know that shape is real rather than suspected because my **first** cripple
walked into it: `X1` destroyed round225's declaration in `round374`'s mutant and the probe died at
`:366` on `mutantR225.refusal!.source` (`TypeError`, `cripple-X1.err`) **before A5b ran**. A crash
is a non-zero exit the sweep reads as red and it is **not the arm reddening** — X1 establishes
nothing about A5b, and it is in the record as the reason X2 had to be built the way it was.

**Named as argued rather than driven:** no cripple here shows the new key is strictly *stronger*
than `=== 1`. X2/Y1/Z1 all move the population in ways the old count also caught; the separating
state is a count-preserving membership *move*, unreachable through these arms for the same reason
A2's control is.

## 20:0x — gate, restoration, mail

**Gate:** `GATE ok exit=0` on census, typecheck, server, client and the aggregate — server
**143 / 2221 / 1 skipped (2222)**, client **26 / 13 skipped (39)** files and **333 / 13 skipped
(346)** tests, byte-identical to this morning's. This unit adds no vitest test, so a moving gate
would have been the finding.

**Restoration, against a pre-action baseline from git rather than a quiet `git status`:**
`grep -rln 'U465DECLPOP' scripts/ packages/` → no files; `git diff --stat 7b1214db -- scripts/
packages/` → empty; `git diff --stat f9d3127f -- scripts/ packages/` → exactly the four cure files,
**110 insertions / 19 deletions**, nothing else. `sweep-probes.mjs` untouched — his entry applied
twice and restored twice, declaration count back at **2**.

**Mail out**, separate commit pushed straight to `main` per the worktree mail rule: `theseus-to-
daedalus-argus-cc-…-the-registry-blocker-is-cleared-…-2026-11-07.md`. His memo stays **live** in
`docs/mail/`: E4/E5 is still an open decision of mine in his §6, and my reply opens the unclaimed
item below, so close-discipline keeps the thread visible.

**Drain:** his §3, which Argus named unclaimed, taken and finished in one fire — reproduced, cured,
controlled, gated and routed. **One deferral with a named blocker:** `round372` A2's deciding
control and the strictly-stronger claim for all four arms both need an entry whose declarations can
move without the probes' upstream `r225.skip!` / `r225.refusal!` dereferences crashing first. That
is a change to those probes' A1/A1b arms, not to the cure, and it is its own unit. The promotion
itself is **his** — the graders are green under his entry and I did not re-take his attestation.
E4/E5 unchanged; the three items standing on xian unchanged and not re-asked.

## Wrap verification

**Step 1 — my commits on `origin/main`.**

```
$ git log origin/main --oneline --author=Theseus --since="2026-11-07 19:40"
a8ff43e0 mail: Theseus -> Daedalus, Argus — the registry blocker is cleared, and the five arms …
e6bfb4e6 unit-465declpop: RESULTS — the registry blocker is cleared, 5 of 5 green under a second …
7b1214db unit-465declpop: the cure — three root arms re-keyed on a live declaration population, …
7571b1bb unit-465declpop: drives pre/post — P1 and P2 hold exactly, and the census finds THREE …
e3dd28d3 unit-465declpop: driver, committed before being driven — the arm scrape keys on the …
ce5144fe unit-465declpop: pre-registration — the frozen declaration pair blocks every hard-skipping …
```

**Step 2 — every deliverable by path, read off `origin/main` rather than off the worktree.**
`git ls-tree -r origin/main` over the unit directory returned **56** files: `PRE-REGISTRATION.md`,
`RESULTS.md`, `drive-five.mts`, `gate.out`, four drive tags × (5 `.out` + 5 `.err` + 1 grading) = 44,
and four cripples × `.out`/`.err` = 8 — 4 + 44 + 8 = 56, and **no scratch**. A second `ls-tree` over
the six named paths outside it (the four cured probes, `sweep-probes.mjs`, the outbound memo)
returned all **6**. **62 asked for, 62 returned.** `docs/COORDINATION.md` and this log land in the
commit below.

**Step 2b — the cure and the cripples' absence, read off the remote blobs rather than the worktree.**
`git show origin/main:` on `probe-round374…` grepped for `U465DECLPOP` → **0**. The same on
`sweep-probes.mjs` grepped for `^    (skip|refusal): /` → **2**, so the published registry is back
to one refusal and one skip and carries no entry of mine. `probe-round372…` as published carries the
cure at `:148`: `declaringMembers.includes(R225) && Boolean(r225.refusal) && Boolean(r225.skip),`.

**Step 3** — this log's own commit lands after the lines above were read off the remote. The probes'
sandboxes are under the gitignored `.testdata/`; nothing from them was staged.
