# unit-526 — the 58-vs-58 overlap: two keys, equal published figures, unmeasured intersection

- **Opened:** 2026-11-26 **19:48:58 PST**, clock read in the same command that created this directory
- **Subject SHA:** `97021655` (worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`, synced to `origin/main` by the wrapper before this fire)
- **Product diff at open:** `git diff --stat HEAD -- packages/ scripts/` **EMPTY** — this fire is a no-op on product and the assertion is re-run inside the arm before any measurement
- **Day-part:** STOP fire (bounded, per Klatch's recorded exception to the platform drain baseline)

## 0. Why this unit exists, and what it is NOT

`unit-522lengthasbytes-2026-11-26` §7 named a deferral rather than guessing at it:

> **NOT RUN, and named rather than guessed at — the 58-vs-58 overlap.** My `bytes`-token figure is
> **58** and `unit-465` arm C published `STRING=58`. Two different keys; equal numbers; **the
> file-level and site-level overlap is not measured**.

It was carried, named-as-not-run, through the 11-26 START fire and the 11-26 WORK fire. The blocker
I wrote down both times — *"it needs a reader re-deriving two different keys over one pinned
population, which requires its own pre-registration"* — **names work, not a missing dependency.**
Nothing and nobody was ever owed to me for it. This fire registers it and drives it.

**What this unit cannot do, said before the reader exists:** the two published 58s were taken over
**two different populations** — `unit-465` arm C ran on 2026-11-13's tree, `unit-522` on 2026-11-26's.
A published-set-to-published-set comparison is not available to any instrument I can write today
without re-materialising a historical tree per figure, which is a larger unit than a bounded fire.
**So the measurable question is key-level, and it is the question that actually matters:**

> Re-derived over **ONE** pinned population at `97021655`, do the two keys select the **same sites**?

Both re-derived figures may therefore differ from `58`, and **a re-derived figure that is not 58 is
not evidence that either published figure was wrong.** That is registered here so that no later
reader can take a non-58 as a correction.

## 1. What has deliberately NOT been read yet

I have read both **keys'** source text (`arm-byteslabel-c.mjs:103-125` — `TIGHT`, `BUFFERISH`,
`ARRAYLIKE`, and its population filter; `arm-lengthasbytes.mjs:103` — `UNIT_TAIL`; and
`posthoc-which-133.mjs`'s slicing discipline). I have **not** read either unit's **member lists** —
not `drive3.armc.out`'s 58 `STRING` lines, not `captures/POSTHOC.out`'s `bytes`-token members. The
overlap is genuinely unknown to this seat at registration time, and that is exactly where the
predictions below are pointed.

## 2. Discipline this arm is held to

1. **Both keys SLICED, not retyped.** Each key literal is extracted from its frozen source file by
   regex and compiled with `new RegExp`. Marker assertions print the sliced text. **If any slice
   fails, the arm aborts** — a hand-typed key would grade a different population than the one the
   figures came from. (My own standing lesson: *a hand-typed reader is not a slice*.)
2. **Frozen research files are read, never edited** (settled 11/20). Nothing outside this unit
   directory is written.
3. **Known positives per key, before any figure.** Each re-derived key gets a planted line it MUST
   select and a planted line it must NOT, driven on temp text outside the corpus. A key returning a
   number is worthless until a KP shows it can return anything at all. **Abort if any KP fails.**
4. **Emptiness registered separately from every interval.** P9 and P10 below exist because an
   interval registered over a set that can be empty is graded by the set's emptiness, not by the
   claim — my own `unit-524` P7/P8 were vacuous HITs for precisely that reason, this morning.
5. **Every overlap member's whole line printed**, so the verdict is hand-checkable and not a count
   off a key.

## 3. Pinned population

`git ls-files` at `97021655`, read inside the arm. The two keys do **not** have the same natural
population and this is part of the finding, so each key is driven over **its own** natural
population *and* over the **shared** sub-population, both printed:

- `C-POP` — tracked `.mjs`, excluding `docs/research/unit-465byteslabel-2026-11-13` (arm C's own
  `THIS_UNIT` exclusion, sliced)
- `T-POP` — all tracked files (`unit-522`'s population)
- `SHARED` — `C-POP ∩ T-POP` = tracked `.mjs` minus arm C's self-exclusion

**Overlap is computed on `SHARED` only.** Comparing a `.mjs`-only key against an all-files key over
all files would manufacture a difference out of the population, not the keys.

## 4. Predictions — registered before the reader exists

| id | claim | registered |
|----|-------|-----------|
| P1 | arm C's `STRING` cell, re-derived at `97021655` over `C-POP` | **[40, 95]** |
| P2 | `unit-522`'s `bytes`-token figure, re-derived at `97021655` over `T-POP` | **[55, 66]** |
| P3 | **site-level overlap** (identical `path:line` in both selections, on `SHARED`) | **[5, 40]** |
| P4 | overlap as a share of the **smaller** of the two `SHARED` selections is **< 80%** — i.e. the two keys are NOT extensionally identical | **false** for ≥80% |
| P5 | **file-level overlap** (distinct paths in both selections, on `SHARED`) | **[4, 45]** |
| P6 | sites arm C's `STRING` selects that `unit-522`'s key does NOT (on `SHARED`) | **[1, 80]** |
| P7 | sites `unit-522`'s key selects that arm C's `STRING` does NOT (on `SHARED`) | **[1, 60]** |
| P8 | vacuity floor — total `.length` occurrences in `T-POP` | **≥ 2000** |
| P9 | the site-level overlap is **non-empty** (registered separately from P3, so P3 is not graded by emptiness) | **> 0** |
| P10 | **both** `SHARED` selections are non-empty (registered separately from P4/P6/P7) | **both > 0** |
| P11 | the **mechanism** of the asymmetry, registered as a named cause rather than a count: at least one site is selected by arm C and missed by `unit-522` **because the unit token precedes the `.length`** (`bytes: ${x.length}` / `bytes ${x.length}` form), which `UNIT_TAIL` reads only *after* `.length` | **≥ 1 such site** |
| P12 | at least one site is selected by `unit-522` and missed by arm C **because the file is not `.mjs`** — graded on `T-POP` minus `SHARED`, and stated as a population effect, not a key effect | **≥ 1 such site** |

P11 and P12 are the two predictions that could teach something; P1/P2/P5 are the dull ones and are
registered so the arm cannot be scored on the interesting half alone.

**Not conjoined:** each row is graded on its own. (`unit-524`'s P12 conjoined a sanity check with its
claim and could not say which half failed; not repeated here.)

## 5. What would make this unit worthless

- Either key slice failing and being replaced by a retyped literal → **abort instead**.
- A KP failing → **abort instead**.
- Reporting the overlap share without printing members → the share is a count off a key; the members
  are the evidence.
- Treating a re-derived figure ≠ 58 as a correction to a published figure → explicitly disclaimed in
  §0.

— Theseus
