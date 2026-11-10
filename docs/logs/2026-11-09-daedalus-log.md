---
agent: Daedalus
date: 2026-11-09
model: Opus 5 (`claude-opus-5`)
---

# 2026-11-09 — Daedalus session log

## 09:17 — START fire opened

`date` run, not estimated: **09:17 PST**. Worktree synced by the wrapper; `git status` shows the
seven untracked `scratch/` dirs from earlier units and nothing else.

**Checkpoint re-derived by author rather than recalled:** my own last commit is `c0453a7d` (11/08
17:27). `git log --format='%h %cI %an' c0453a7d..HEAD` → **14 commits since, `%an`-checked: Theseus 3,
Calliope 3, Iris 2, Argus 2, Pard 1, Claude (automation) 2, and `c569ec12` mine (the 11/08 wrap
verification).** Four of the 14 arrived this morning.

**Mail read as a DELTA, not a re-read** — `git diff --name-status c0453a7d..HEAD -- docs/mail/` returns
exactly **2 added, 0 modified**:

1. `theseus-to-daedalus-…-item-2-is-mine-and-i-take-it-but-it-sits-behind-item-1…` (11/08 19:51) — to
   this seat.
2. `argus-to-theseus-…-your-1-is-not-my-blocker-its-the-reason-string-drift-pattern…` (11/09 09:06) —
   cc only, and it answers (1), so (1) was read first.

Both close on the same sentence: **item 1, `round377`'s six-site re-key, is Daedalus's and is not
started.** Argus's memo states it explicitly as the reason the thread is left in `docs/mail/` rather
than moved to `read/`. That is this fire's work; nothing about it needed a question first.

## 09:20–09:35 — unit `docs/research/unit-465rekey377-2026-11-09/`: item 1, landed and graded

Full write-up in the unit's `RESULTS.md`. What matters here:

**The six sites, read off the live file rather than from last night's memo** (`grep -n` for the
headline literal): `:137`/`:138` in `A1`, `:672`/`:673` in `C1`, `:686` in `C2`, `:698` in `C3`.
Baseline rev pinned to `3b086025` and recorded in `baseline-rev.txt` before the first edit.

**Two cures, not one — and my own 11/08 §3 proposal was right for four of the six and unavailable for
the other two.** `A1` reads the registry ALONE, so `expect.test(…)` has no second source to agree
with and would be vacuous; there the count is replaced by the SHAPE (`HEADLINE_SHAPE`), which
strengthens the clause it sits in. `C1`/`C2`/`C3` read a DRIVE against the registry, so the count is
replaced by AGREEMENT (`agrees`); shape-only would be a real weakening there because it still passes
a member whose arms silently vanish. I did not see the split until the file was open, and the memo
says so rather than presenting the design as planned.

**Behaviour preservation:** pre-cure bytes **exit 0, All 13**; cured bytes **exit 0, All 13**
(`drive-0-baseline.txt`, `drive-1-cured.txt`). Arm count derived not recalled — `check(` label scan
returns 13: `A1 A2 A3 B1 B1c C0 C0b C1 C2 C3 C4 C5 C6`. `round377`'s registry entry is **untouched**,
which is what keeps this commit the unconstrained head: no sibling's pin moves.

**A label error caught before it shipped.** I first wrote these docblocks as "Round 384". The round
track is dead — `unit-464t2-population` (my own, 10/28) established that every `unit-*` dir postdates
the last round dir and the dir measure does not move when a round happens — and a numeric max over
`Round \d{3,}` across `docs/` and `scripts/` returns **470**, so 384 is long taken. Relabelled to the
unit name at all three sites. Caught by checking the number, not by remembering the ruling.

**The grading leg, and the prediction I missed.** Eight predictions pre-registered and **committed
before the instrument existed** (`a8b366dd`). `grade-the-headline-rekey.mjs` slices every spelling but
one out of real bytes — `PRE` out of `git show 3b086025:<subject>`, `CUR` out of the live file, and
`HEADLINE_SHAPE`'s initializer and `agrees`'s body out of the live file too, each anchor asserted
unique. The single hand-typed column is the rejected shape-only alternative, labelled in the
instrument, in every printed row and in `RESULTS.md`, because it was never shipped and exists in no
bytes to slice.

Run 1: **1 of 12 FAILED — P3 DISAGREE**, kept as `grade-run-1.txt` rather than discarded. I had put
the pre-cure column at `false`; it is `true`. The pre-cure conjunct reads the drive against a frozen
literal and **never reads the registry at all**, so when the pin moves and the printed headline does
not, the headline still equals the literal and the old conjunct passes. **I predicted at arm level
while the cell grades one conjunct** — the same granularity error Theseus made at `:201`, in the
opposite direction, in the same 24 hours.

The miss bought a leg the pre-registration did not have (`P3b`): in that state the pre-cure file
reddens at `A1` and the cured file reddens at `C1`. The claim was never dropped by the re-key; it
moved from a source-text pin to a driven agreement pin. And the old `C1` conjunct was never an
agreement pin at all — a constant pin that happened to agree. **The re-key is a strengthening at
`C1`, not a desensitisation**, which is more than I claimed last night and not what I set out to
show. Run 2: **All 13 grades true, exit 0**.

Run 1's red is also the instrument's own known positive: it reddened at the single cell whose
expectation was wrong and named that cell.

**Argus's precedent adopted, and it reached three sites his memo did not aim at.** He aimed
`unit-465skipE`'s rule (remove the frozen number, don't refresh it) at Theseus's `:212`. Three
published sentences in MY file carried a sibling's arm total with no predicate reading them: `C1`'s
reason prose, `C5`'s reason prose, and the `drive()` comment that named `probe-round373`'s total to
explain why the LAST verdict line is taken. All three de-numbered his way. The precedent itself was
checked at `scripts/lib/probe-outcome.mts:142-145` rather than recalled.

**`L2` uses the repo's own reader rather than a hand-rolled one** (`scripts/lib/strip-source.mjs`,
comments blanked / strings kept): headline literals in live code **6 → 0**, with **2 raw occurrences
left**, both docblock prose describing this cure. A grep would have reported 2 and left me arguing
about them.

## 09:35 — mail and gate

Reply filed and pushed to `main` as its own commit (`584bf9d3`), per the worktree mail rule:
`daedalus-to-theseus-argus-cc-…-item-1-is-landed-and-graded-and-the-prediction-i-missed-showed-the-old-c1-was-never-an-agreement-pin-2026-11-09.md`.
It accepts Theseus's revised order including the part that costs this seat, takes his `:201` scope
correction whole, credits Argus's precedent and reports the three extra sites, and reports the P3 miss
with its mechanism rather than only the 13/13.

Typecheck: clean on both script tsconfigs. Census: **154 files, 44 swept / 110 deferred, CENSUS OK** —
matching Argus's independently-derived 11/09 figure. The full 44-probe sweep drive was started before
the memo was written and its result is recorded below, after it returned; the memo itself states that
it was in flight and does not state its outcome.

**Thread NOT moved to `docs/mail/read/`.** Item 1 is closed but step 3 is open and is a four-file
edit; the thread stays visible.

**Cross-pollination brief (session-start step 1):** `docs/briefs/cross-pollination/current.md` is
dated today and carries only a pointer — the brief itself is not copied into this public repo. Its
private source (`mediajunkie/designinproduct → src/internal/briefs/2026-11-09-brief.md`) is **outside
this fire's permitted read set** and the read was refused; the hosted copy is behind the private site.
So the brief was **not** read this fire, and that is recorded rather than glossed — this seat's
sandbox grants `mediajunkie/docs/mail` only.

## Standing items — re-derived this fire, not recalled

- **ma-smoke:** `git ls-remote --heads origin` returns **27 refs**, and a case-insensitive filter for
  `smoke`/`managed` returns **0**. **Day 20** (day 1 = 2026-10-21; cross-checked against the rollup's
  own "day 17 today" on 11/06 rather than counted from memory). Named blocker on xian, unchanged.
- **Rollup:** read directly at `docs/operations/attention-rollup.md` — **v176, last refreshed
  2026-11-06 (Calliope), needs-you 3**, item 3 being ma-smoke and blocked on xian. Neither moved this
  fire, and neither is this seat's to move.

## Gate

- **Typecheck:** `npm run typecheck:scripts` clean on both script tsconfigs.
- **Census:** 154 files, **44 swept / 110 deferred, CENSUS OK** — ran on all four of this fire's
  commits via the pre-commit hook, and matches Argus's independently-derived 11/09 figure.
- **Full 44-probe sweep drive** (`node scripts/sweep-probes.mjs`, no flag — the census flag does NOT
  drive anything and is not this gate): **SWEEP PASSED — 44 of 44 swept probes green, 0 red, 0
  blocked (0 could not run, 0 ran but did not finish), 0 census problems, 110 deferred.** Exit 0.
  Capture: `docs/research/unit-465rekey377-2026-11-09/sweep-drive.txt`.

  The four family members' own rows, read off the capture rather than inferred from the total — this
  is the leg that says the edit moved no sibling:

  | member | sweep row |
  |---|---|
  | `probe-round372` | PASS exit 0 · All 26 |
  | `probe-round373` | PASS exit 0 · All 15 |
  | `probe-round374` | PASS exit 0 · All 8 |
  | `probe-round375` | PASS exit 0 · All 8 |
  | `probe-round377` | PASS exit 0 · **All 13** |

  Every pin is where it was before this fire. That is the whole claim of item 1 being the head.

## 09:33 — wrap verification

**Step 1 — commits landed.** `git fetch origin`, then `git log origin/main --author=Daedalus
--format='%h %cI | %s' -6`:

```
db748082 09:32:43  gate: the full sweep DRIVE returned SWEEP PASSED 44 of 44 …
5b9b1826 09:31:18  coord+log: 11/09 START fire — item 1 of the family pass landed and graded …
584bf9d3 09:29:22  mail: reply to Theseus+Argus — item 1 is landed and graded …
b3fe7a86 09:28:20  unit-465rekey377: the re-key is graded against its own pre-cure spelling …
a8b366dd 09:25:03  unit-465rekey377: item 1 is landed — round377's six hard-typed sibling counts …
c569ec12 (11/08)   [the checkpoint — the previous fire's last push]
```

**5 commits this fire.** As in previous fires the total is stated as the command that derives it
rather than as a number, because a log cannot contain the commit carrying its own total:

```
git rev-list --count --author=Daedalus c569ec12..origin/main
```

`git rev-list --left-right --count HEAD...origin/main` = **0 0**.

**Step 2 — deliverables present on the remote.** `git ls-tree -r origin/main --name-only` over
explicit path specs: **12 asked for, 12 returned** — the subject probe, all 8 files of
`unit-465rekey377-2026-11-09/` (`RESULTS.md`, `grade-the-headline-rekey.mjs`, `baseline-rev.txt`,
`drive-0-baseline.txt`, `drive-1-cured.txt`, `grade-run-1.txt`, `grade-run-2.txt`,
`sweep-drive.txt`), the memo, `COORDINATION.md` and this log. **0 files under `scratch/`** — this
unit has no `scratch/` directory, and the seven untracked `scratch/` dirs still in `git status` are
earlier units', present before this fire opened.

`git diff --stat 3b086025 origin/main -- packages/ scripts/` → **1 file changed, 75 insertions, 16
deletions**, and the one file is the subject probe. So the `SWEEP PASSED — 44 of 44` above was driven
against exactly these bytes, with no other code path touched in the interval. Nothing under
`packages/` moved. The pre-commit census ran on all five commits and printed `CENSUS OK` each time.

**Step 3 — this log pushed last**, after steps 1 and 2.

Delivery is the wrapper's to log; what is verified above is presence on `origin/main`, not delivery.

---

## 13:17 — Session resumed (WORK fire, model: Opus 5)

`date`-read at 13:17, 13:22, 13:28, 13:30, 13:35 and 13:4x PT. Worktree synced by the wrapper;
`git log origin/main -1` = `474d785b` at open.

### Briefing

- Checkpoint re-derived: my own **`db748082`** (09:32). **13 commits since, `%an`-checked — Theseus
  7, Calliope 1, five mine.** Commit author checked before assuming any were mine.
- Mail delta-read (`git diff --name-status db748082..HEAD -- docs/mail/`): **1 added, 0 modified** —
  Theseus's step-2 memo. Read in full. It closes on *"step 3's other three bumps are yours and your
  §5's blocker stands unchanged."* That blocker was the pre-registration slot, which a WORK fire has.

### Work: `unit-465guard375` — step 3's first member, landed and graded

Scope held to **two files**, as in steps 1 and 2: the subject
`probe-round375-…-passes-on-a-comment.mts` and its own registry row.

- **`35d736a7`** — pre-registration, committed **before the cure and before the grader existed**.
  Eleven predictions, three refusals named in advance, and **one guard DECLINED in advance** (P8).
- **`6f790f15`** — the cure. `A0g` (own `SWEPT.find(… R225)`, member-list keyed, arm recorded before
  the exit), `A0r` (the sibling entry `C1` is re-keyed onto, SHAPE conjunct), `C1` re-keyed to
  AGREEMENT, the sibling's frozen arm total **removed not refreshed** at all three live sites, pin
  **8 → 10**, `why` respelled so the agreement rule is neither violated nor vacuous.
- **`aae7aa98`** — grader, 9 drive captures, 2 runs. **13 of 13 grades true on the first run.**
- **`a4ec133a`** — memo to Theseus+Argus, pushed to `main` on its own per the worktree rule.

### The rows that did more than pass

- **P6 — the ordering leg.** Both my own 11/09 entry and Theseus's §7 carried step 3's remainder as
  an unordered list. It is not. `probe-round375`'s `C1` held `probe-round373`'s arm total as a live
  predicate conjunct, so the `373` bump could not have gone first. Driven with the live sibling plus
  one asserted inserted arm and its pin moved to match: **PRE exit 1, `C1` sole red, child printed
  All 16; CUR exit 0 at All 10.**
- **P7 — not a desensitisation.** Same cell, pin NOT moved → the **cured** `C1` reddens too. So
  agreement beats a frozen number (reddens on a legitimate bump) *and* a shape (passes when a
  member's arms vanish).
- **P2/P3 — the defect, in two files now.** Cured: exit 1, `A0g` sole red, 2 rows, headline present.
  Pre-cure, same registry copy: exit 1, **0 rows, no headline**, `TypeError: Cannot read properties
  of undefined (reading 'refusal')`. Theseus's equivalent row was hand-typed HISTORICAL because its
  subject was gone; mine is driven.
- **P8 — the pre-registered refusal, and the finding.** The registry counts 11 unguarded
  dereferences here; two are registry lookups; **one got an arm.** In the only state that could make
  the second `undefined`, **only `A0g` and `A0r` report at all** — no `A3` row, no `A5` row. Guarded
  by construction. An arm there would have been a vacuous pin counted as coverage. **A census of
  SITES is not a census of reachable defects** — which is why `377`'s `13→14` is not being landed
  until re-derived.

### A sentence of mine refuted by the check I ran on it

I wrote in the memo that the family grep now returns two lines, both prose in `probe-round377`, then
ran it. **Three.** `probe-round373:108` is a live predicate hard-typing **`probe-round225`'s** arm
total inside a known-positive fixture. Verified rather than inferred: that entry is
`sweep-probes.mjs:433`, and this fire's own sweep capture drives `probe-round225` at `All 33`, exit
0. One legitimate arm there reddens `probe-round373` `A1`. A **fourth** instance of the family
mechanism, in a shape no census for "asserts a sibling's count" can see — the line *selects* rather
than asserts — reaching outside the family to the file every member keys on. Corrected in the memo
as §4b before it was committed; `373`'s unit therefore has two sites, not one.

### Reported rather than tidied

My grader's `own headline` column reads the LAST `All \d+ …` in a run's output, and `A0r` prints the
pin it read — so the `A0g` cell shows `All 15 regression checks passed` while having 2 rows and never
reaching section C. A pin echoed in a verdict row, not a headline. It **decided nothing**: no red
cell's predicate reads the field, and `P3`'s `own === null` is conjoined with `rows === 0`. `[NOTE]
OWN-FIELD` in run 2 says so in the output; run 1 is kept beside it so the diff is readable. Theseus
flagged the same shape one level up this morning and I shipped it one level down the same day. The
subject's own `C-drive` line had the identical defect and that one is **cured**.

**Zero refusals this run** — all three were named in the pre-registration and spelled around in
advance. Steps 1 and 2 each lost whole runs to exactly these.

## Gate

- **Typecheck:** `npm run typecheck:scripts` clean on both script tsconfigs.
- **Census:** 154 files, **44 swept / 110 deferred, CENSUS OK** — ran via the pre-commit hook on all
  five of this fire's commits.
- **Full 44-probe sweep DRIVE** (`node scripts/sweep-probes.mjs`, no flag — the census flag drives
  nothing and is not this gate): **SWEEP PASSED — 44 of 44 swept probes green, 0 red, 0 blocked
  (0 could not run, 0 ran but did not finish), 0 census problems, 110 deferred.** Exit 0, 13:30:09 →
  13:35:14. Capture: `docs/research/unit-465guard375-2026-11-09/sweep-drive.txt`.

  The family's own rows, read off the capture rather than inferred from the total — this is the leg
  that says only my file moved:

  | member | sweep row |
  |---|---|
  | `probe-round372` | PASS exit 0 · All 26 |
  | `probe-round373` | PASS exit 0 · All 15 |
  | `probe-round374` | PASS exit 0 · All 10 |
  | `probe-round375` | PASS exit 0 · **All 10 ← moved** |
  | `probe-round377` | PASS exit 0 · All 13 |

  And at the right granularity rather than the file's (P9): `probe-round377`'s `C5` asserts the EXACT
  failing-arm list of a driven copy of my file under an unprefixed registry. Its row is `[ok]` and
  the list is still `A1 A2 A4 C2`, so the two new arms did not change it.

### Standing items, re-derived not recalled

- **ma-smoke:** `git ls-remote --heads origin` → **27 refs**; case-insensitive filter for
  `smoke`/`managed` → **0**. **Day 20** (day 1 = 2026-10-21). Named blocker on xian, unchanged, and
  not this seat's to move.
  Figures re-derived in this fire, not carried: `27`, `0`, and day 20 cross-checked against the
  rollup's own "day 17 today" written on 11/06 rather than counted from memory.
- **Rollup:** read directly at `docs/operations/attention-rollup.md` — **v176, last refreshed
  2026-11-06 (Calliope), needs-you 3**, item 3 being ma-smoke and blocked on xian. Neither moved this
  fire and neither is this seat's to move.

## 13:4x — wrap verification

**Step 1 — commits landed.** `git fetch origin`, then
`git log origin/main --author=Daedalus --format='%h %cI | %s' -6`:

```
da807685 13:39:20  coord+log: 11/09 WORK fire — step 3 is open and its first member is landed …
a4ec133a 13:37:32  mail: reply to Theseus+Argus — step 3's ordering was never a list …
aae7aa98 13:30:03  unit-465guard375: graded 13 of 13 true on the first run …
6f790f15 13:25:26  unit-465guard375: step 3's first member is landed — two guards, one agreement …
35d736a7 13:23:11  unit-465guard375: pre-registration, committed before the cure and the instrument …
af6c451d 09:33:17  [the START fire's own wrap-verification log — NOT this fire's]
```

**5 commits this fire.** `git rev-list --count --author=Daedalus db748082..origin/main` returns
**6**, and the sixth is `af6c451d` — the START fire's wrap log, which landed one minute *after* the
`db748082` checkpoint. Stated rather than smoothed, because the checkpoint figure and the fire figure
are not the same number and a reader comparing them would otherwise find a commit unaccounted for.
As in previous fires the per-fire total is given as the command that derives it rather than as a
bare number, since a log cannot contain the commit carrying its own total.

`git rev-list --left-right --count HEAD...origin/main` = **0 0**.

**Step 2 — deliverables present on the remote.** `git ls-tree -r origin/main --name-only` over
explicit path specs: **20 asked for, 20 returned** — the subject probe, the registry, all 16 files of
`unit-465guard375-2026-11-09/` (`PRE-REGISTRATION.md`, `RESULTS.md`, `grade.mjs`, `grade-run1.txt`,
`grade-run2.txt`, `sweep-drive.txt` and the 9 drive captures `cell-*.txt`), the memo,
`COORDINATION.md` and this log. **0 files under any `scratch/`** — this unit has no `scratch/`
directory, and the seven untracked `scratch/` dirs still in `git status` are earlier units', present
before this fire opened.

`git diff --stat 6f790f15^ origin/main -- packages/ scripts/` → **2 files changed, 136 insertions,
9 deletions**, and the two files are exactly the subject probe and its own registry row — the scope
the pre-registration declared, with nothing under `packages/` touched. So the `SWEEP PASSED — 44 of
44` above was driven against exactly these bytes. The pre-commit census ran on all five commits and
printed `CENSUS OK` each time.

**Step 3 — this log pushed last**, after steps 1 and 2.

Delivery is the wrapper's to log; what is verified above is presence on `origin/main`, not delivery.

---

## 17:18 — Session resumed (STOP fire, Opus 5)

`date`-read at start: **17:18 PT**. Note for whoever reads the cadence: the v0.2 STOP branch is
defined as *past the ~23:00 day-end threshold*; this fire was labelled STOP by the wrapper at 17:18.
Recorded, not worked around — I ran the bounded day-part checklist and the work it surfaced.

**Session-start checklist.** Worktree synced by the wrapper. `git log --format='%h %an'` from my own
last commit `7930fd79`: **6 commits since — Theseus 4, Argus 2, Calliope 1** (Argus's includes a
merge commit), **none mine**. `git diff --name-status 7930fd79..HEAD -- docs/mail/` → **1 added, 0
modified**: Theseus's `p8-is-sound-…` memo. Read in full before anything else. Argus's
`your-1-is-not-my-blocker-…` memo was checked for unread status and was **not** new — it landed in
`3b086025` at 09:06, inside this morning's START-fire delta, and was read there.

**What the memo asked.** Nothing, explicitly — but its §3–§4 names a defect in **my** file, landed
by me this morning, drives a matched pair showing what it costs, and closes with *"Still unclaimed by
either of us; I have not taken it."* That is the fire's work.

**Verified before accepting (CLAUDE.md, in full).** Read `probe-round373:57`/`:60`/`:81` and my own
`copy373` at `:411-421` directly; confirmed the anchor `const SWEEP = join(HERE,
'sweep-probes.mjs');` occurs exactly **1** time in `probe-round373`; confirmed `copy373` applies
four substitutions and none for the text route. Then read the claim off the artefact the live run
leaves at `.testdata/round375/subject-round373.mts`. His reading is correct in every particular.

**Unit `docs/research/unit-465route375-2026-11-09/` — DRIVEN.**

- Pre-registration `6b569a40`, **committed before the cure and before the instrument existed** —
  nine predictions, three named refusals.
- Pre-cure baseline drive → **P1 true**: artefact imports the sandbox registry at `:57` and reads
  the live one at `:60`. Two registries at once.
- Cure `e501d6af`: fifth asserted substitution in `copy373`, plus `C3` re-keyed off the count.
- Cured drive → **P2, P3, P4, P5 true**: `SWEEP` now inside the sandbox; subject exit 0 at **All
  10**; the two children differ in exactly one line and it is the `SWEEP` line; `C3` now reports 2
  differing lines, so the shipped `exactly 1` predicate **would have reddened on its own cure**.
- Grader `grade-the-two-routes.mjs` → **ALL 8 GRADES TRUE on the first run**. P7a/P7b reproduce
  Theseus's cells X and Y off my own artefacts: with the sandbox registry's `probe-round225` pin
  bumped `All 33` → `All 34`, the one-route child is `A1 [ok]` and the both-routes child is `A1
  FAIL` / `kpOwner (none)`. **P8: the delta is `A1` alone**, 15 rows each.
- **P6 — the re-key is not a desensitisation**, driven: a registry-unrelated comment-line difference
  (same line count) makes `C3` red and the **sole** red, `1 of 10` failed. Cripple applied in place
  **after** the cure was committed, because a `git checkout --` restore before the commit would have
  discarded the cure; restored and verified (`git diff --stat HEAD -- scripts/` empty, `grep -c
  CRIPPLE` → 0).
- Typecheck clean on **both** script tsconfigs. Census `154 / 44 / 110 CENSUS OK` on every commit.

**Declined in advance and recorded as refusals, not discovered as gaps:** no arm added (`R2` — it
would move the pin 10 → 11 into `probe-round377`'s cross-pins of this file); `373` 15→16 and the
`:108` fixture not started (`R1`); Theseus's §2 `HERE`-identity sentence not cured (`R3`) — though
this unit **narrows** it, since the two routes now agree by construction in the copier rather than by
the accident that `HERE` is the module's own dir.

**P9 REFUTED, and it is the fire's most useful row.** The gate came back **`SWEEP FAILED — 43 of 44
swept probes green, 1 red, 0 blocked, 0 census problem(s), 110 deferred`**. The red was
`probe-round377`, exit 1, **`summary line NOT FOUND`** — a crash, not an arm. Driven directly for
the stack rather than reasoned about:

```
Error: anchor not unique (2): const SWEEP = join(HERE, 'sweep-probes.mjs');
    at once (…/probe-round377…mts:88:22)
    at copyProbe (…:687:7)
```

My `C_SWEEP` typed `probe-round373`'s declaration verbatim, which put a **second** copy of that line
into `probe-round375`'s own bytes; `probe-round377`'s `copyProbe` redirects my text route using the
same literal and asserts it is unique. **Its assertion was right** — with two occurrences it could
not know which to redirect. The sibling refused loudly, and that loudness is the only reason this
was caught before the memo shipped.

The reading worth more than the fix: **a hand-typed spelling of another file's line is the exact
defect class Rounds 376 and 377 exist to cure** — Theseus's `374 A2` and my `375 A1`, both cured by
him in Round 377 — and I shipped a fresh one tonight in the same file, in the same hour, as part of
the cure for a different instance of it. So the repair is not an escape or a split string: the
anchor is now **derived**, `/^const SWEEP = join\(HERE, '[^']+'\);$/m` over `r373Src`. Repair
`3489290f`.

Confirmed per file before re-running the gate: `probe-round375` exit 0 **All 10**, `C3` green;
`probe-round377` exit 0 **All 13**, and `C5`'s asserted failing-arm list still exactly **`A1 A2 A4
C2`** — the route cure did not move the list the sibling pins on a driven copy of my file, which is
what `R2` was protecting. Anchor literal back to **1** occurrence by `grep -c`. Typecheck clean on
both script tsconfigs, run again after the repair.

P9 is **not** being retro-fitted into a pass. It said no row moves; a row moved for a reason the
prediction did not contemplate, and the pre-registration is the only thing that makes that legible
as a refutation rather than a surprise narrated afterwards.

**Question-box (STOP procedure item 4):** filed — `dispatch/mail/question-daedalus-2026-11-09-the-
sentence-that-was-true-about-less-than-you-thought.md`, committed `57bc64a` and **verified present
on `dispatch` `origin/main`** by `git -C … ls-tree -r origin/main`. Pushed with the worktree's own
identity; no `-c user.email` override.

**Gate run 2, post-repair (`3489290f`): `SWEEP PASSED — 44 of 44 swept probes green, 0 red, 0
blocked (0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred`**, exit 0,
capture `gate-sweep-2.txt`. Family rows read **off the capture**: `225` All 33, `372` All 26, `373`
All 15, `374` All 10, `375` **All 10**, `377` All 13 — **no row moved**, including the sibling whose
`C5` pins the exact failing-arm list of a driven copy of my file. P9's *claim* holds on the repaired
tree; P9 as pre-registered stays refuted, because it predicted the first gate after the cure would
not move a row and it did.

### Session wrap verification (CLAUDE.md protocol)

**Step 1 — commits on origin/main.** `git log origin/main --oneline -8`:

```
d0342299 coord+log: 11/09 STOP fire — the route cure is landed and graded 8 of 9, and the refuted prediction is my own anchor crashing round377
71695652 mail: reply to Theseus+Argus — the route cure is landed and graded, and my own hand-typed anchor crashed round377 in the same hour as the cure for that same defect class
3489290f unit-465route375: P9 REFUTED — my hand-typed anchor crashed probe-round377, and the repair is to derive it from the subject
61ded172 log: 11/09 STOP fire in progress — route cure landed and graded 9 of 9, gate still running
8e557ec6 unit-465route375: nine predictions, nine true — the cripple makes the re-keyed C3 the sole red, and Theseus's cells X and Y reproduce off my own artefacts
e501d6af unit-465route375: copy373 now redirects BOTH registry routes, and C3 is re-keyed off the count the cure itself moves
6b569a40 unit-465route375: pre-registration, committed before the cure and the instrument exist — nine predictions, three named refusals, and one arm declined in advance
d7f83b52 coord+log: 11/09 SWEEP fire — census-only no-op, 13 commits read none mine, a killed-background sweep-probes run verified as slow not hung, 44/44 confirmed
```

Note on `61ded172`'s subject line, since it is now wrong and a reader will hit it: it says *nine of
nine* because it was written while the gate was still driving and before P9 came back refuted. The
commit message is left as it was — rewriting history to look better than the sequence was is the
opposite of what the pre-registration discipline is for — and this line is the correction.

**Step 2 — deliverables present on the remote.** `git ls-tree -r origin/main` over explicit path
specs: at the coord/log push, **16 asked for, 16 returned** — the subject probe, `COORDINATION.md`,
this log and all 13 files of `unit-465route375-2026-11-09/`. **0 files under any `scratch/`** — this
unit's `scratch/` holds the four driven artefacts and is correctly untracked. The final push adds
`gate-sweep-2.txt` and the updated `RESULTS.md`, `COORDINATION.md` and this log; re-verified below.

`git diff --stat 6b569a40 origin/main -- packages/ scripts/` → **1 file changed, 69 insertions, 8
deletions**, and the one file is exactly the subject probe — no registry row and nothing under
`packages/`, which is the scope `R2` declared in advance. The pre-commit census ran on every commit
and printed `CENSUS OK` each time.

**Step 3 — this log pushed last.**

Delivery is the wrapper's to log; what is verified above is presence on `origin/main`, not delivery.
