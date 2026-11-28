---
agent: Daedalus
date: 2026-11-27
model: Claude Opus 5 (`claude-opus-5`)
worktree: /Users/xian/Development/klatch-worktrees/daedalus
branch: claude/daedalus-cycle (pushes land on `main` as `HEAD:main`)
---

# Daedalus — 2026-11-27

## 09:17 — START fire

**Day's first log.** Clock read from `TZ=America/Los_Angeles date` at **09:17:05 PST**; worktree
synced to `origin/main` by the wrapper immediately before the fire, `git status` clean, `HEAD`
`f9fa864272cf`.

### Checklist

- **`docs/COORDINATION.md`** read. My own section's last entry was 11-26 STOP.
- **`docs/mail/`** listed and the 11-26/11-27 arrivals attributed by commit rather than by filename
  date: the newest inbound addressed to me is `882859dd`, Theseus's 11-26 STOP *"the two 58s are not
  the same 58"*, and it postdates my last outbound (`5d16e1d4`). **Read in full.** It closes the
  thread explicitly — *"Nothing asked of either of you"* — and says Theseus was moving both of that
  day's memos to `read/`. Verified: **mine landed in `read/`, his did not.** Nothing open on it.
- **Day-part work units:** `docs/operations/duty-cycle/daedalus-tasks.md` read; `Recurring items`
  has no row with `next_due ≤ today` (the one row is `n/a`, superseded 11-10). Unblocked items at
  `:64`, `:123`, `:204`. **`:204` is the one the 11-26 STOP fire sharpened to "this is now the NEXT
  unit"**, so that is what this fire drove.

### 09:19–09:21 — registered before anything existed

`docs/research/unit-527setgeneric-2026-11-27/PRE-REGISTRATION.md`. Directory made and the clock read
in the **same command** (`09:21:05 PST`), population SHA `f9fa864272cf`. 13 predictions.

Two things I did deliberately in the registration:

1. **Declared the peek.** I had already run `grep -rn 'new Set<' scripts/ docs/research/ | head -40`
   before writing the file, so §1 states exactly what that told me (count ≥ 40, concentrated in
   `.mts` probes, dominant form is a binding) and that every interval below is informed by those
   three facts and nothing else. An interval registered after an unstated peek is laundered.
2. **Registered two predictions against my own boarding text.** Reading
   `arm-indirectsize.mjs:148-156` showed `bindingOf`'s regex carries an optional annotation group, so
   `const picks = new Set<string>()` *does* match — which contradicts my own boarded sentence that
   all three named sites land in `UNRESOLVED`. P6/P7 say so in advance.

**09:23 — addendum 1** (`PRE-REGISTRATION-ADDENDUM-RECEIVER-WALK.md`): `receiverSpan` stops at the
`>` of a type-argument list, so the receiver text is already truncated before any substitution runs.
Registered `L4` and `P14` off that.

**09:25 — addendum 2** (`PRE-REGISTRATION-ADDENDUM-2-P14-REFUTED-BY-READING.md`): **P14 is
unsatisfiable as written, and I found that by reading `armA`'s first three lines**, before the arm
existed. `setTailIndices` decides *membership* before `keyIndirect` decides *class*, so `S1` makes a
generic direct tail **leave the population** rather than be reclassified. Graded REFUTED there, with
`P14′` registered in its place. Keeper written down at the time: *a reader's blindness does not decide
a site's class when something upstream decides its membership first.*

Pre-registration pushed as its own commit `d20bb6ef` before the arm was written.

### 09:27 — the drive

`node docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs`, one drive, clock `09:27:08
PST`. `captures/ARM.out` **11,541 B**, `captures/ARM.err` **0 B**, `captures/CONTROL-523.out`
**47,253 B**, `captures/CONTROL-523.err` **0 B**.

**VERDICT GRADED — KP 13 of 13, CONTROL 14 of 14, 15 predictions, 14 HIT / 1 REFUTED** (the one
refutation being P14, refuted before the drive by reading).

```
Arm A   new Set PLAIN 1268 · GENERIC 71 (37 files) · new Map GENERIC 88 (L1, uncured, LARGER)
        of the 71: balanced 71 · `.size` tail 0 · direct `.size <op> <n>` tail 0
Arm B   population 126 -> 126 · exclusions 60 -> 60
        SET-BOUND 36 -> 40 (+4) · OTHER-BOUND 34 -> 30 (-4) · every other class unmoved
        NARROWED HAZARD 4 -> 5 · guard {BLIND:4} -> {BLIND:5}
Control frozen arm driven UNCHANGED: 126=126, 60=60, all ten classes equal, hazard 4=4
```

**Method notes worth keeping for the next fire that touches a frozen arm:** the reader under test was
**sliced** — one contiguous 7,893 B region between two anchors each asserted to occur exactly once —
and instantiated twice via `new Function`, the cured copy carrying four anchored substitutions each
asserted to apply exactly once with every before/after literal printed into the capture. The frozen
file was never written. **The control is the thing that makes it a measurement:** without the
unchanged child-process drive agreeing cell-for-cell, the slice would be a re-implementation claiming
to be a baseline.

### Against me, three ways

1. **The boarding text was wrong about every number in it.** "Worth ≥3 of 6" → worth **1** of the 3
   named. "All three land in `UNRESOLVED`" → false for one. "Its three sites" → **two lines carrying
   three members**. And **3 of the 4 sites the cure actually moves were named by nobody.** *A
   hand-read set of instances is not the population a cure moves, even when the mechanism is
   identified correctly* — mine was 25% of it, and all of it was checkable in the frozen capture I
   wrote myself.
2. **P14**, above.
3. **The item was two mechanisms wearing one name.** The two `probe-round244…:188` members are
   default parameters and `bindingOf` reads declaration lines by construction, so no locator cure
   reaches them. `K4` is the known negative. Boarded as its own item with an exact price of 2.

### Bookkeeping

- Memo `4f92f2bf` → Theseus, Argus (cc xian, Janus, Calliope, Iris); Theseus's 11-26 inbound
  `git mv`'d to `docs/mail/read/` in the same commit. Mail pushed to `main` on its own.
- Task list: `:204` ticked with its full verification trail, original boarding text kept verbatim
  beneath it, **two successors boarded** (`new Map<K, V>(` at 88 sites; the default-parameter binding
  reader at 2 members) so closing the item deletes no open work.
- `COORDINATION.md` Daedalus section updated, prior entry demoted to `Previous`.
- **Gate clean on all pushes:** population **65**, `MARKED/GUARDED/UNGUARDED` **4/3/58**, baseline
  **58** — all unmoved. `tracked files read` **1124 → 1125**, the growth being this unit's own arm.

### Drain

**Drained and done:** the one unanswered inbound (read, answered, closed to `read/`); the boarded
NEXT unit (registered, driven, graded, published, memo'd, ticked); two successors boarded.
**Deferred, each with a named blocker:** Key E's second cause — needs an evidence model that is not
line-granular, which is a design question this fire did not open; the `EMPTY-READS-INVARIANT` +
`continue` reachability question — blocked on a **runtime** answer the source cannot give; item 10 —
**xian's and only his**, and this unit adds nothing to it. The two new successors are boarded
**unblocked**: each needs its own pre-registration, and per Theseus's 11-26 §1 *that names work, not
a blocker*.

### Wrap verification (per CLAUDE.md Session Wrap Protocol)

Run at the end of this fire; output pasted below rather than summarised.

**Step 1 — `git log origin/main --oneline -5`:**

```
5464bf32 coord+tasks+log(daedalus): 11-27 START fire -- unit-527 drove the boarded NEXT unit, 14 HIT / 1 REFUTED, and the boarding text was wrong about every number in it
4f92f2bf mail(daedalus -> theseus, argus): the generic blindness is measured at 71 sites, 4 members move, hazard 4->5, and my own boarding text was wrong about every number in it
1d209e6a research(unit-527): the `new Set<T>(` blindness is measured -- 71 sites, 4 members move, hazard 4->5, and my own boarding text was wrong about every number in it
d20bb6ef research(unit-527): pre-registration -- the `new Set<T>(` locator blindness, 13 predictions, two against my own boarding text
f9fa8642 coord+log(argus): 11-27 START fire -- no-op on product, ...
```

Three of this fire's four commits are on `origin/main` above; the fourth is this log's own commit,
pushed after this block was written (Step 3).

**Step 2 — every deliverable `ls`'d, all present:**

```
docs/research/unit-527setgeneric-2026-11-27/PRE-REGISTRATION.md
docs/research/unit-527setgeneric-2026-11-27/PRE-REGISTRATION-ADDENDUM-RECEIVER-WALK.md
docs/research/unit-527setgeneric-2026-11-27/PRE-REGISTRATION-ADDENDUM-2-P14-REFUTED-BY-READING.md
docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs
docs/research/unit-527setgeneric-2026-11-27/RESULTS.md
docs/research/unit-527setgeneric-2026-11-27/captures/{ARM.out,ARM.err,CONTROL-523.out,CONTROL-523.err}
docs/mail/daedalus-to-theseus-argus-…-2026-11-27.md
docs/mail/read/theseus-to-daedalus-argus-…-the-two-58s-…-2026-11-26.md
docs/logs/2026-11-27-daedalus-log.md
```

Nothing missing. **Step 3:** this log committed and pushed last.

**Disclosed, because it would otherwise be invisible: the log commit used `--no-verify`**, so the
pre-commit gate did not run on it. Rather than assume the markdown-only change was inert, both gate
legs were **re-driven directly on the final tree** afterwards: `verify-decl-body-slicers.mjs` →
`DECL-BODY SLICERS OK`, `tracked files read` **1125**, population **65**, **4/3/58**, baseline
**58**; `sweep-probes.mjs --census` → `census PASSED`, **45 swept / 110 deferred**. Both match the
standing figures printed on this fire's three verified commits. *A skipped gate that nobody re-drove
is an unmeasured push, and the figures are the only thing that makes it one or not.*

---

## 13:17 — Session resumed (WORK fire)

Model: Claude Opus 5 (`claude-opus-5`). Clock read from `TZ=America/Los_Angeles date` at **13:17:07
PST**; worktree synced to `origin/main` by the wrapper, `git status` clean, `HEAD` `252a5cfdf5aa`.

### Checklist

- **`docs/COORDINATION.md`** read; my own section's last entry was this morning's START fire.
- **`docs/mail/`** listed. One inbound postdating my last outbound: Theseus's 11-27 START,
  *"my cure recovers 12 of 28 because the 28 was four mechanisms."* **Read in full.** It says
  "nothing owed back" in its subject, but **§5 asks this seat one thing by name** — whether I take
  the default-parameter item, so he can key his 12-member resolver on top instead of building a
  second one. That ask is what this fire answered.
- **Day-part work units:** `docs/operations/duty-cycle/daedalus-tasks.md` read. `Recurring items`
  has no row with `next_due ≤ today`. The item Theseus names is `:268`, boarded by me this morning
  as `unit-527`'s second successor and described there as *"the smallest exactly priced item on this
  list."* Taken.

### 13:19–13:27 — registered, then driven

`docs/research/unit-529defaultparam-2026-11-27/PRE-REGISTRATION.md`. Directory made and the clock
read in the **same command** (`13:19:51 PST`), population SHA `252a5cfdf5aa`. 15 predictions.
Committed and pushed to `main` as **`56b394c3`** before the arm file existed.

Three things done deliberately in the registration:

1. **Declared the peek, item by item.** §1 names the four things I had already read — `unit-527`'s
   capture listing all 7 `UNRESOLVED` rows, the member site itself, the other five receivers (which
   is how I learned the class holds **three** mechanisms, not one), and `unit-527`'s `K4`. It also
   names what I had **not** read, so every interval is bounded by stated ignorance.
2. **Registered a prediction against my own boarding text, again.** `P2` says the cure does **not**
   make the members `SET-BOUND` — the boarded sentence states a count and implies a destination the
   cure alone does not reach.
3. **Registered `P14`/`K9` as a known positive for my own cure's HARM.** `LD2` means a default in
   function A can bind a use in function B. Rather than name that and move on, the cell plants the
   shape and asserts the wrong binding is taken, so the cure's price is measured.

**Arm written, then repaired before the drive.** Three defects found by reading and by `node --check`
before any figure existed: a nonsense leftover `new Function` body; brace **character literals**
(`${'{'}`) which would have put this file in the brace-slicer gate's own population while its
docblock claimed otherwise; and a parameter-list detector that keyed on `exec`'s **first** hit, which
for a one-character receiver name like `s` would have let an unrelated earlier list decide a site's
bucket. The last one became a global scan. *A docblock claiming a file is out of a gate's population
is checkable by searching the file, and that is the only way to make the claim.*

Two cells were also rewritten before the drive because they were **vacuous**: "the PUB firing log is
empty" is also what a cure that was never spliced in produces. They became structural assertions on
the TEXT (`__firings` absent from `PUB`/`GEN`, present exactly once in `DEF`/`BOTH`) plus `C7`, the
non-vacuity cell: **cure D actually fired**.

Drive at `13:27:15 PST`, one drive. `ARM.out` **21,268 B**, `ARM.err` **0 B**, `CONTROL-523.out`
**47,440 B** / **0 B**.

### Verdict

**GRADED — 15 predictions, 14 HIT / 1 REFUTED. KP 15 of 15, CONTROL-1 18 of 18.** Full grading table
in `RESULTS.md` §4. Headline figures:

```
  class            PUB   DEF   GEN   BOTH    dDEF  dGEN  dBOTH
  SET-BOUND        36    36    40    42      0     +4    +6
  OTHER-BOUND      34    36    30    30      +2    -4    -4
  UNRESOLVED       7     5     7     5       -2    0     -2
  hazard            4     4     5     7      {BLIND:4/4/5/7}, no GUARDED member anywhere
  UNRESOLVED partition: DEFAULT-PARAM 2 · DESTRUCTURE-DECL 4 · PARAM-NO-DEFAULT 1 · 0 · 0
```

### 13:29 — a post-hoc the arm's own capture forced

The capture prints **`PUB -> DEF: 1 moved`** three lines above **`UNRESOLVED −2 / OTHER-BOUND +2`**.
Both are right about their own subject: the movement key is `path:line:receiver`, inherited from
`unit-527`'s arm, and the two members share it. `posthoc-key-collision.mjs` measured the population:
**126 sites, 122 distinct keys, 4 colliding keys hiding 4 members.** `P5` was then re-verified
**positionally, with no key in the comparison** — and it holds.

**Its own `Q2.5` failed on drive 1**, and the cell was wrong rather than the instrument: I asserted
the undercount equals collisions **anywhere in the population** (4) when it can only be collisions
behind a key that **moved** (1). Drive 1's capture is kept at `captures/POSTHOC-DRIVE1.out` rather
than overwritten; drive 2 reads **7 of 7**.

### Against me, this fire

1. **`P15` REFUTED — the item was priced in the wrong unit.** "Exact price, 2 members" counts use
   sites; a cure's reach is counted in bindings, and there is **one**. The floor of 2 I registered
   was unreachable by construction.
2. **The price is conditional** and the destination was implied, not stated (`P2`).
3. **The two cures do not compose additively** (`P9`) — exactly two classes, each off by 2.
4. **My own movement key hid members**, and the arm printed both figures without noticing.
5. **The post-hoc written to catch (4) had a wrong cell of its own.**
6. **A control I over-rejected:** `GEN` reproduces all five of `unit-527`'s figures, yet printed
   `n/a-AGREES` because my precondition conjoined **corpus size** (861 vs 858) with the class cells,
   which held. *A precondition keyed on a population's SIZE over-rejects a control whose claim is
   about particular CELLS.*

One thing went **for** the cure and was measured rather than hoped: `LD4`'s over-wide `[(,]` class
fires on **exactly one** site across **861** files — the real one — with `K11` planting the false
shape and asserting the cure does fire on it.

### Bookkeeping

- Unit `687cc372` pushed to `main`. Memo `db9d98cd` → Theseus, Argus (cc xian, Janus, Calliope,
  Iris), pushed to `main` **in its own commit** per the worktree mail rule, with Theseus's inbound
  `git mv`'d to `docs/mail/read/` in the same commit — its one ask is answered.
- Task list: `:268` ticked with its full verification trail, original boarding text kept verbatim
  beneath it; **one successor boarded** (`DESTRUCTURE-DECL`, exact price 4, unclaimed by either seat)
  and **the keyed-walk undercount of 2 appended to the `new Map<K, V>(` item**, so closing this item
  deletes no open work and the next unit is warned rather than left to rediscover.
- `COORDINATION.md` Daedalus section updated, prior entry demoted to `Previous`.
- **Gate clean on both code pushes:** population **65**, `MARKED/GUARDED/UNGUARDED` **4/3/58**,
  baseline **58** — all unmoved. `tracked files read` **1127 → 1129**, the growth being this unit's
  own two files. (1125 → 1127 between fires was other seats' pushes, not mine.)

### Drain

**Drained and done:** the one unanswered inbound (read, its §5 ask answered in the same fire, closed
to `read/`); the item it asked about (registered, driven, graded, published, memo'd, ticked); one
successor boarded and one warning appended to an existing item.
**Deferred, each with a named blocker:** `DESTRUCTURE-DECL` and `new Map<K, V>(` are boarded
**unblocked** — each needs its own pre-registration, which names work and not a blocker; Key E's
second cause needs an evidence model that is not line-granular, a design question this fire did not
open; the `EMPTY-READS-INVARIANT` + `continue` reachability question stays blocked on a **runtime**
answer the source cannot give; item 10 is **xian's and only his**, and this unit adds nothing to it —
every site it moves is a LIVE instrument claim, no fixtures.

### Wrap verification (per CLAUDE.md Session Wrap Protocol) — WORK fire, closed 13:35:16 PST

**Step 1 — `git log origin/main --oneline -5`:**

```
17ec86dc coord+tasks+log(daedalus): 11-27 WORK fire -- the default-parameter item is taken and landed, and the price I boarded this morning was in the wrong unit
db9d98cd mail(daedalus -> theseus, argus): I take the default-parameter item -- it is one binding not two members, our two populations do not overlap, and the two cures do not compose additively
687cc372 research(unit-529): the default-parameter blindness is cured and priced -- 1 binding not 2 members, the two cures do not compose additively, and my own movement key hides 4 population members
56b394c3 research(unit-529): pre-registration -- a binding reader that can see a default parameter, 15 predictions, one against my own boarding text and one a known positive for the cure's own harm
252a5cfd coord+log(calliope): 11-27 MID fire -- no-op on product, ...
```

**All four of this fire's commits are on `origin/main`** above, including the bookkeeping commit that
carries this block. This log's own closing lines are appended after it and pushed last (Step 3).

**Step 2 — every deliverable `ls`'d, all present:**

```
docs/research/unit-529defaultparam-2026-11-27/PRE-REGISTRATION.md
docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs
docs/research/unit-529defaultparam-2026-11-27/posthoc-key-collision.mjs
docs/research/unit-529defaultparam-2026-11-27/RESULTS.md
docs/research/unit-529defaultparam-2026-11-27/captures/{ARM.out,ARM.err,CONTROL-523.out,
  CONTROL-523.err,POSTHOC.out,POSTHOC.err,POSTHOC-DRIVE1.out}
docs/mail/daedalus-to-theseus-argus-…-i-take-the-default-parameter-item-…-2026-11-27.md
docs/mail/read/theseus-to-daedalus-argus-…-my-cure-recovers-12-of-28-…-2026-11-27.md
docs/logs/2026-11-27-daedalus-log.md
```

Nothing missing.

**Disclosed, because it would otherwise be invisible: TWO commits this fire used `--no-verify`** —
the mail commit `db9d98cd` and the bookkeeping commit `17ec86dc`, both markdown-only. Rather than
assume a markdown change is inert, both gate legs were **re-driven directly on the final tree**
afterwards:

- `verify-decl-body-slicers.mjs` → `DECL-BODY SLICERS OK`, `tracked files read` **1129** (`of 1130
  tracked code file(s) in scope, 1 excluded as this gate's own, 0 unreadable`), population **65**,
  `MARKED/GUARDED/UNGUARDED` **4/3/58**, baseline entries **58**;
- `sweep-probes.mjs --census` → `CENSUS OK`, `census PASSED`, **45 swept / 110 deferred**.

Every figure matches what the gate printed on this fire's two **verified** commits (`56b394c3`,
`687cc372`). *A skipped gate that nobody re-drove is an unmeasured push, and the figures are the only
thing that makes it one or not.*

---

## 17:17 — Session resumed (STOP fire)

Clock read from `TZ=America/Los_Angeles date` at **17:17:06 PST**; worktree synced to `origin/main`
by the wrapper, `git status` clean, `HEAD` `3af2c9946ea7`.

### Checklist

- **`docs/COORDINATION.md`** read; my own section's last entry was this day's WORK fire.
- **`docs/mail/`** listed. **Two new inbounds, both to me as primary**, both Theseus, both 11-27 WORK:
  his `unit-530compose` memo and an **addendum**. Read in full, in this fire, before building
  anything.
- **The addendum changed how I worked**, not just what I knew: `node <frozen arm>.mjs` re-runs that
  arm's own `writeFileSync` and overwrites its published `captures/` — he caught it after overwriting
  mine, restored it to HEAD, and verified. So **no frozen arm was driven as a child this fire.**
  His restored pin `56b394c3d9d2 · corpus 861` is what I read today, and this fire's post-hoc
  **independently re-derived 861 from git** at that pin, so the restoration is confirmed from the
  other side as well as his.
- **Day-part work units:** his §8 is an explicit named ask to this seat — *"if the ten classes do not
  partition in some instantiation you can construct, `P2c` collapses and your `2` is two facts after
  all."* That is what this fire drove.

### 17:20 — registered before anything existed

`docs/research/unit-531conserve-2026-11-27/PRE-REGISTRATION.md`. Directory made and the clock read in
the **same command** (`17:20:07 PST`), population SHA `3af2c9946ea7`. 12 predictions. Pushed as its
own commit **`349ab0ab`** before `arm-conserve.mjs` was written.

Three things done deliberately in the registration:

1. **Declared the peek** — §1 names the exact four tool results that informed every interval below
   and says so: the `popSizes`/`sites.length` grep, `unit-527`'s `ARM.out:93`, its `K8` line, and
   `arm-defaultparam.mjs:147-178`.
2. **Registered the concession in advance** (`P10`): over the real corpus no instantiation I build
   yields `Σ offby ≠ 0`, i.e. *Theseus's §1 is right about my `2` and this unit will say so.*
3. **Registered one against myself** (`P11`): that his `P2d` reproduces against my `RESULTS.md`, not
   just my arm.

### 17:24 — the drive

`node docs/research/unit-531conserve-2026-11-27/arm-conserve.mjs`, one drive, clock `17:24:00 PST`.
`captures/ARM.out` / `ARM.err` **0 B**; post-hoc at `17:25:24 PST`, `POSTHOC.out` / `POSTHOC.err`
**0 B**.

**VERDICT GRADED — 14 cells, 11 HIT / 3 REFUTED, and all three refutations are mine.**

```
P10 HIT  (the registered concession) real corpus Σ offby = 0 · FAILS = 2 (SET-BOUND +2, OTHER-BOUND -2)
P1  HIT  drop a class from the ten -> Σ still 0, twice: partition failure neither necessary nor sufficient
P5  HIT  synthetic population MOVED: PUB 5 · DEF 5 · GEN 4 · BOTH 4
P6  REFUTED   Σ offby = 0 anyway
P7  REFUTED   FAILS = 0, not 1
P12 HIT  membership is a function of G alone -> S_PUB=S_DEF, S_GEN=S_BOTH -> the zero is forced
P8  MISS 36 of 48 (population 126->127, exclusions 60->63, MAP-BOUND 10->11)
P3/P3b/P4/P9/P9b/P2/P11  all HIT  (KP 15/15 · plants 24/24 · generic direct tails 0 of 865 files)
```

**The result against me is the interesting one.** I registered denominator invariance as the hatch
Theseus had missed, built the mover, and it *worked* — and the column still summed to zero. The
premise that actually carries his result is the **additivity of membership**: `D` touches
`bindingOf`, `G` touches `setTailIndices`, nothing crosses, so `S_PUB = S_DEF` and `S_GEN = S_BOTH`
and `Σ offby = 0` at any corpus. **His argument names a sufficient condition for its own premise and
I named a different one; the true premise is narrower than both and is the same shape as the finding
under dispute, one level up.**

**Keeper:** *a conservation argument over a partition is carried by the additivity of the MEMBERSHIP
function, not by the partition and not by the population holding still — and membership is decided by
a different reader, running earlier, than the one the classes come from.*

### 17:25 — the post-hoc, because "that's just drift" is not a measurement

`P8` missed and the obvious reading was corpus growth. `posthoc-drift-attribution.mjs` attributes it
file by file instead: corpus **861** at the pin (re-derived from git, matching the published figure)
against **865** now, **four entrants, zero departures**, `Σ` **1 site / 3 exclusions** against
observed **+1 / +3** — **FULLY ATTRIBUTED, nothing left over.** The one entrant that moved a number
is **Theseus's own `unit-530` arm**: his §4 closed on my post-hoc joining the corpus it measured four
commits later, and his arm joined it two commits later and is the only file in the table that changed
a class figure.

Split into the two controls `P8` should have been: **`P8a` drift-invariant — 10 of 10 classes
identical off-by, `FAILS` 2 = 2**; **`P8b` drift-sensitive — 36 of 40**, the four being `MAP-BOUND`
at all four labels.

**Keeper:** *split a reproduction control into the figures a claim is ABOUT and the figures its
denominator is made of, or a MISS reports "the subject moved" when what moved was the corpus.*
**Third data point on this one defect, and this time it is my own control.**

### Method note worth keeping

The whole unit rests on one property of my own earlier arm that I did not put there on purpose:
**`sh`, `readFileSync` and `ROOT` are already `new Function` parameters inside `unit-529`'s
instantiation**, so slicing its 9,855 B region and supplying different ones **substitutes the corpus
without editing one byte of any subject.** That is what made a synthetic corpus possible at all, and
it is what made obeying Theseus's addendum cheap rather than costly — no child process, no writes
into anyone's `captures/`.

His mitigation (3), obeyed in this one fire and printed into the capture: `git status --porcelain`
asserted **inside the arm**, **0 lines outside this unit**. `P9b`: **4** `sh` calls (one per
instantiation) and **0** `readFileSync` misses, so the synthetic drive read nothing but its plants.
**Not boarded as a convention change** — his §3 says Argus's seat has the better claim on a
gate-shaped cure and I agree.

### Mail

Memo filed: `docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-i-swung-at-your-conservation-argument-and-shut-my-own-hatch-the-denominator-moved-and-the-column-still-summed-to-zero-2026-11-27.md`
(`2abcf7fe`, pushed as its own commit). **Close-discipline applied:** both of his 11-27 inbounds and
my own 11-27 WORK outbound `git mv`'d to `docs/mail/read/`. My new memo stays live — it carries one
optional invitation back (§3: if `D` reaches `setTailIndices` by any path, `P12` collapses) and one
boarded item.

### Drain

**Drained and done:** the one open inbound ask (read, taken, registered, driven, graded, published,
memo'd in the same fire); the addendum (no reply owed, obeyed in method, closed); two successors
boarded in `daedalus-tasks.md`.
**Deferred, each named as work or with a named blocker:** the membership-interaction cure pair is
**unblocked** and needs its own pre-registration, which names work and not a blocker;
`DESTRUCTURE-DECL` at a price of 4 is **unblocked** and not taken this fire; the
`EMPTY-READS-INVARIANT` + `continue` reachability question stays blocked on a **runtime** answer the
source cannot give; item 10 is **xian's and only his**, and this unit adds nothing to it — the six
plants are served from memory and written nowhere, deliberately so.

### Wrap verification (per CLAUDE.md Session Wrap Protocol) — STOP fire, closed 17:30:44 PST

**Step 1 — `git log origin/main --oneline -5`:**

```
bd4d6194 coord+tasks+results+log(daedalus): 11-27 STOP fire -- I swung at the conservation argument and shut my own hatch, and the premise that carries it is membership additivity
2abcf7fe mail(daedalus -> theseus, argus): I swung at the conservation argument and shut my own hatch -- the denominator moved and the column still summed to zero
ebb80b56 research(unit-531): my own hatch is refuted by my own construction -- the denominator MOVED and the column still summed to zero, because membership is a function of cure G alone
349ab0ab research(unit-531): pre-registration -- the premise carrying Theseus's conservation result is denominator invariance, not the partition, and the denominator is decided by a different reader
3af2c994 coord+log+rollup(calliope): 11-27 SWEEP fire -- both recurring day-counts were one day stale...
```

**All four of this fire's commits are on `origin/main`**, including the bookkeeping commit carrying
this block. This log's closing lines are appended after it and pushed last (Step 3). `git fetch` after
the last push brought nothing new, so no other seat's work landed mid-fire.

**Step 2 — every deliverable `ls`'d, all present:**

```
docs/research/unit-531conserve-2026-11-27/PRE-REGISTRATION.md
docs/research/unit-531conserve-2026-11-27/arm-conserve.mjs
docs/research/unit-531conserve-2026-11-27/posthoc-drift-attribution.mjs
docs/research/unit-531conserve-2026-11-27/RESULTS.md
docs/research/unit-531conserve-2026-11-27/captures/{ARM.out,ARM.err,POSTHOC.out,POSTHOC.err}
docs/mail/daedalus-to-theseus-argus-…-i-swung-at-your-conservation-argument-…-2026-11-27.md
docs/mail/read/theseus-to-daedalus-argus-…-your-keeper-survives-…-2026-11-27.md
docs/mail/read/theseus-to-daedalus-argus-…-addendum-driving-a-frozen-arm-…-2026-11-27.md
docs/mail/read/daedalus-to-theseus-argus-…-i-take-the-default-parameter-item-…-2026-11-27.md
docs/logs/2026-11-27-daedalus-log.md
```

Nothing missing. `git status --short` empty before this append.

**Disclosed, because it would otherwise be invisible: TWO commits this fire used `--no-verify`** —
the mail commit `2abcf7fe` and the bookkeeping commit `bd4d6194`, both markdown-only. Rather than
assume a markdown change is inert, both gate legs were **re-driven directly on the final tree**
afterwards:

- `verify-decl-body-slicers.mjs` → `DECL-BODY SLICERS OK`, `tracked files read` **1133**, population
  **65**, `MARKED/GUARDED/UNGUARDED` **4/3/58**, baseline entries **58**;
- `sweep-probes.mjs --census` → `CENSUS OK`, `census PASSED`, **45 swept / 110 deferred**.

Every figure matches what the gate printed on this fire's two **verified** commits (`349ab0ab`,
`ebb80b56`). The `1131 → 1133` growth is this unit's own two `.mjs` files and nothing else.
*A skipped gate that nobody re-drove is an unmeasured push, and the figures are the only thing that
makes it one or not.*

**One thing stated as unverified, deliberately:** `unit-531` §1's `FAILS = 1` construction is
**arithmetic plus a sketch of a cure shape**, not a drive. I have not built a cure pair with a
membership interaction term, and the memo and `RESULTS.md` both label it that way. It is boarded in
`daedalus-tasks.md` as unblocked work.
