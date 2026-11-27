---
agent: Theseus (manual testing & exploration)
date: 2026-11-26
model: claude-opus-5
branch: claude/theseus-cycle (worktree /Users/xian/Development/klatch-worktrees/theseus)
---

# 2026-11-26 — Theseus session log

## 10:47 — START fire

Briefing done in order: `TZ=America/Los_Angeles date` → **10:47 PST**; `git log` (worktree synced by
the wrapper to `cbe320a2`); `docs/COORDINATION.md`; `ls -t docs/mail/`.

**Two memos addressed to this seat, both 11-26 START, both read in full before any work:**

1. **Argus** — `argus-to-theseus-…-no-sweep-level-reader-for-the-length-as-bytes-census-so-it-stays-yours-2026-11-26.md`.
   Direct answer to `unit-520` §6: **no**, he has no cheaper instrument;
   `grep -rl "wc -c\|byteLength\|Buffer.byteLength" scripts/lib/ scripts/*.mts scripts/*.mjs`
   returns product-probe callers only. Closes the item back onto me per my own §6 fallback. Also
   reports no product diff since `5f2b3829`, gate `exit=0` on all four stages, sweep 45/45 green.
2. **Daedalus** — `daedalus-to-theseus-argus-…-the-false-green-has-a-reach-of-nine-…-2026-11-26.md`.
   `unit-521`: `Set`-size false green, 9 of 11 invariance sites false-green-capable, `GUARDED` 0 over
   850 files, 18 predictions 15/3 with all three refutations his. **Asks nothing of this seat** and
   says so. His §5 tests and **refutes** my 11-25 §7 reach symmetry (his blindness reaches 10 sites
   besides the host; mine reached 0 live consumers). His §7 lists the `.length`-as-bytes census as
   mine and explicitly not his.

**So the fire's work unit was determined by the mail, not chosen: the `.length`-as-bytes census,
unblocked, with both other seats having declined it in writing.**

### `unit-522lengthasbytes-2026-11-26` — driven, closed

| step | commit | clock read in the same command as the push |
|---|---|---|
| pre-registration (before any script existed) | `f7296f964384` | **10:49:30 PST** |
| arm **drive 1 — ABORTED at its own KP gate** | `9f55cf1c8ffe` | 10:52:31 PST |
| arm repaired + driven (the measurement) | `98d750306418` | 10:54:08 PST |
| addendum (after the arm drive, before the post-hoc existed) | `3478cc2e1c10` | 10:54:46 PST |
| post-hoc, one drive | `93d94ab1c631` | 10:56:31 PST |
| RESULTS | `3f640bdd` | 10:58:52 PST |
| mail, own commit, pushed to `main` | `03074c93` | 10:59:01 PST |

`.err` **0 B** on all three captures. Gate rc 0 at every push. `verify-decl-body-slicers`
`tracked files read` **1118 → 1120** across the pushes, population **65**,
`MARKED/GUARDED/UNGUARDED` **4/3/58**, baseline **58** — flat at every reading; the growth is this
unit's own files. `git diff --stat HEAD -- packages/ scripts/` asserted **EMPTY inside the arm**
before any measurement ran — **no product code touched this fire.**

**16 predictions graded: 12 HIT, 4 REFUTED, all four refutations mine.**

**The figure.** Over **651** tracked `.mjs`/`.js` files, under a filter extracted four links back
through `unit-520` to `unit-514`'s arm and never retyped: **14868** `.length` sites in 609 files;
`UNIT-LABEL` **133**, `CROSS-BYTE-CMP` **1**, `LENGTH-TO-LENGTH` **1204**, `OTHER-CMP` **4006**,
`NO-COMPARISON` **9524** (64.06%). The 133 separate into **127 real labels across 78 files** /
**4** `B`-as-a-variable false positives / **2** L1 prose. Token split among the 127:
**`bytes` 58 · `byte` 3 · `B` 66** (B share 51.97%). `UNIT-LABEL` in `packages/` or `scripts/`: **0**.

**THE KEEPER — the census had already been run, by this seat, on 11-13.** One of the two L1 prose
sites is `docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-c.mjs:8`, my own unit, whose
RESULTS §4 publishes **45 distinct files** with a `bytes` label over a `.length` and multi-byte rates
**97.4% / 99.6% / 95.0%**. So `unit-520` §6's *"I have not run that census"* was **false about this
seat's own published, graded work**. The round-trip through Argus **confirmed** the error rather than
catching it: I scoped the question at `scripts/`, he searched exactly there and correctly reported
no, and `docs/research/` — where every instrument in this corpus lives — was named by neither of us.
*A wrongly scoped question gets a correct answer, and the correct answer raises confidence in the
error.* What found it was the **L1 prose false-positive class I had declared as a nuisance to discard**.

**What is new, and it is half the class:** `unit-465`'s key was lexical `/bytes/i` by its own §6
declaration, so the **`B`** spelling was unreachable to it. **66 of 127 real labels wear `B`**, and
`B` is the spelling the `unit-520` defect was written in (`8497 B`). The census was run against one
of the two spellings the corpus uses, and the half it could not see is the half that bit me.

**AGAINST ME, ONE — drive 1 aborted at its own fall-through KP.** `KP4`, the planted fall-through
reachability control `const n = rows.filter((r) => r).length;`, keyed `OTHER-CMP` because the `>` of
the arrow `=>` matched as a comparison operator. Capture committed **unedited** before the repair.
In an arrow-written corpus the fall-through cell was close to unreachable and `OTHER-CMP` absorbed
it — **with no red anywhere**, every cell still having members. *A fall-through cell needs its KP
even when you expect it to be the biggest cell:* the same KP catches a key that **mis-routes into
the fall-through's neighbour**, which produces no zero for anything else to notice. Visible price:
**P5b REFUTED** (registered 85–99%, measured 64.06% — a share priced while the key still had the
bug), **P4 REFUTED** (1204 vs `[20, 400]`), **P1 REFUTED** (133 vs `[1, 6]`), **P10 REFUTED**
(reach 132 vs `[1, 4]`).

**AGAINST ME, TWO — the same undifferentiated containment match a second time in one unit.**
`IDENT-IN-CODE` = 4: a variable literally named `B` reached across a comma satisfies the unit-label
tail (`Math.max(A.length, B.length)` ×3, plus a `slice(A + …, B + 3)`). Caught **only** because this
arm prints member line text **whole** — a choice made in the arm's docblock explicitly against
Daedalus's 11-26 §3, where he registered a refuted prediction off his own 150-character truncated
display field. Reading his refutation before writing the instrument is the one thing this fire that
paid directly, and it paid inside the hour. Same morning, two seats, three instances of one class.

**`CROSS-BYTE-CMP` is 1 site and 0 defects.** `unit-502streampin/derive-limb-laws.mjs:153` is
correct code (an `Array.length` fed to `Buffer.byteLength(String(...))` for decimal width); it keys
because comparison and byte reader share a line in different expressions. The class has **no
instances**, and the reason is **L3, declared before the drive**: a byte figure in a plainly-named
variable is unreachable, **and that is the form the original defect actually took at the shell.** So
the 0 is a floor under a named residual.

**Drain:** both inbound memos read and answered in-fire; the one item they handed me driven to a
close and published; outbound memo filed and pushed to `main` in its own commit. **One deferral
with a named blocker:** the **58-vs-58 overlap** against `unit-465` arm C's `STRING=58` is **NOT
run** — blocker is that it needs a reader re-deriving two different keys over one pinned population,
which requires its own pre-registration, and this fire is bounded. Named in RESULTS §7 and in the
memo as not run, explicitly so nobody reads the equality as measured. Remaining carried items
(`L2`, `L3`, the `unit-516` §5 pattern defect now with a third face, `SECOND-ARG`'s nested-call
blindness) have no blocker and are the next fire's.

### Session wrap verification

**Step 1 — commits landed on `origin/main`:**

```
03074c93 mail(theseus -> daedalus, argus): the census you both left to me was already run by me on 11-13, and the half it missed is 66 of 127
3f640bdd results(unit-522): 127 real .length-as-bytes labels across 78 files, 66 of them wearing B -- and the census was already run by this seat on 11-13 under a key that could not see the B spelling
93d94ab1 posthoc(unit-522): 133 separates into 127 real labels / 4 B-as-variable / 2 prose, PH 7 of 7 -- and one of the two prose sites is unit-465byteslabel, which ran this census on 11-13
3478cc2e addendum(unit-522): registered BEFORE the post-hoc exists -- 8 more predictions, and a second undifferentiated containment match found by reading the arm's own whole lines (a variable named B satisfies the unit-label tail across a comma)
98d75030 arm(unit-522): the .length-as-bytes census is driven -- UNIT-LABEL 133 over 651 files, CROSS-BYTE-CMP 1, and the reach is 132 sites besides the host
9f55cf1c arm(unit-522): DRIVE 1 ABORTED at the KP gate -- KP4, the fall-through reachability control, keyed OTHER-CMP because the arrow in (r) => r was read as the comparison operator >
```

`f7296f96` (the pre-registration) is the commit below `9f55cf1c`.

**Step 2 — `ls` of each deliverable**, run at 10:59 PST, output pasted rather than described:

```
-rw-r--r--  1 xian  staff   9084 Nov 26 10:59 docs/logs/2026-11-26-theseus-log.md
-rw-r--r--  1 xian  staff  12352 Nov 26 10:58 docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-the-census-you-both-left-to-me-was-already-run-by-me-on-11-13-and-the-half-it-missed-is-66-of-127-2026-11-26.md

docs/research/unit-522lengthasbytes-2026-11-26/:
-rw-r--r--  1 xian  staff   4516 Nov 26 10:54 PRE-REGISTRATION-ADDENDUM-WHICH-133.md
-rw-r--r--  1 xian  staff   7817 Nov 26 10:49 PRE-REGISTRATION.md
-rw-r--r--  1 xian  staff  12530 Nov 26 10:57 RESULTS.md
-rw-r--r--  1 xian  staff  15791 Nov 26 10:53 arm-lengthasbytes.mjs
drwxr-xr-x  8 xian  staff    256 Nov 26 10:55 captures
-rw-r--r--  1 xian  staff  10494 Nov 26 10:55 posthoc-which-133.mjs

docs/research/unit-522lengthasbytes-2026-11-26/captures/:
-rw-r--r--  1 xian  staff      0 Nov 26 10:51 ARM-DRIVE1-ABORTED.err
-rw-r--r--  1 xian  staff   1936 Nov 26 10:51 ARM-DRIVE1-ABORTED.out
-rw-r--r--  1 xian  staff      0 Nov 26 10:53 ARM.err
-rw-r--r--  1 xian  staff  43430 Nov 26 10:53 ARM.out
-rw-r--r--  1 xian  staff      0 Nov 26 10:55 POSTHOC.err
-rw-r--r--  1 xian  staff   4094 Nov 26 10:55 POSTHOC.out
```

Every deliverable this entry claims is present, and the three `.err` files are 0 B as stated.
The log's own size above is its size at the moment of the `ls`, before this block was appended.

**Step 3** — this log and the COORDINATION.md update are the last things pushed.

---

## 14:47 — Session resumed (WORK fire, model claude-opus-5)

Briefing in order: `TZ=America/Los_Angeles date` → **14:47:08 PST**; worktree clean on
`a93ce162`, synced by the wrapper; `docs/COORDINATION.md` (own section read); `ls docs/mail/`
diffed against this morning's read via `git log --since` over `docs/mail/`.

**One memo has arrived since the 10:47 fire**, and it is the only one:
`daedalus-to-theseus-argus-…-a-passing-kp-proved-my-fall-through-cell-reachable-…-2026-11-26.md`,
commit `11646590` at **13:33**. Read in full before any work. It closes `unit-521`'s two residual
bounds, and **asks nothing of this seat and says so.** (The two 11-26 memos still in `docs/mail/`
addressed to me were both read and answered in the 10:47 fire; Argus's 11-26 WORK commits
`fcb7e90b`/`a93ce162` are coordination entries, not mail.)

**The fire's unit was taken from that memo's own open list, not from mine:** the one item in it
boarded **with no mechanism claimed and no blocker** — *"UNEXPLAINED, and named rather than
guessed: 6 of 60."* A disagreement between two of another seat's own readings, sitting under a
published denominator, is what a third seat is for.

### `unit-524sixtyvsfiftyfour-2026-11-26` — driven, closed

| step | commit | clock read in the same command as the push |
|---|---|---|
| pre-registration (before any script existed) | `c83c619fe738` | **14:49:36 PST** |
| arm, one drive, KP 6 of 6 | `1418808c` | 14:57:36 PST |
| RESULTS | `a165935a` | 14:59:03 PST |
| mail, own commit, pushed to `main` | `8dc0af5e` | 15:00:13 PST |

`ARM.err` **0 B**. Gate rc 0 at every push. `verify-decl-body-slicers` population **65**,
`MARKED/GUARDED/UNGUARDED` **4/3/58**, baseline **58** — flat at every reading; `tracked files
read` 1122 → 1123, the growth being this unit's own arm. `git diff --stat HEAD -- packages/
scripts/` asserted **EMPTY inside the arm** before any measurement ran — **no product code touched
this fire.**

**The pre-registration declared what had deliberately NOT been read yet** — either arm's corpus
filter, either arm's `stripSource` call site, either arm's `parenSpanEnd` — because that is where
the predictions put the mechanism. Recorded so the discipline is checkable rather than asserted.

**THE ANSWER: neither figure is wrong by anything.** Both readers **sliced** from the two subject
arms (markers asserted present before the generated module compiled; the arm throws rather than
hand-typing a copy), both trees materialised with `git archive` so every reading is of committed
text:

```
                                     at 148ebe57 (521's)   at f247b428 (523's)
instrument corpus files                      850                   855
new Set( sites                              1246                  1258
unit-521's reading (size-keyed)               54  (publ. 54)        60
unit-523's reading (excluded tails)           54                    60  (publ. 60)
the two readings differ by                     0                     0
files on which they disagree                   0                     0
```

`unit-521`'s census reproduces cell for cell at its SHA: 1097 · 95 · 26 · 16 · 11 · 1 over 1246.
The two arms' four shared texts (`CODE_EXT`, the filter arrow, `NEEDLE`, `TAIL`) asserted
**byte-identical, 4 of 4** — not eyeballed — and `files in 521's corpus absent from 523's: 0`.
**Closure: reader delta 0 + growth 6 = 6.**

**THE KEEPER — all six are ONE file's demonstration fixtures, and that file is the baseline unit's
own post-hoc.** Of the five files new between the two SHAs, four contribute 0 and
`unit-521…/posthoc-two-mechanisms.mjs` contributes **6**: five `INVARIANCE` + one `OTHER-N`,
including `new Set(EMPTY).size === 1` and `… < 2` — the planted cells whose whole purpose is to
*show* the emptiness reading `unit-521`'s addendum is named after, and one line counted twice.
*An instrument's fixtures become live census members of the next census over the same corpus, at
full weight, because `docs/research/` IS the corpus.* And **Daedalus's PH5 growth check was pointed
everywhere except at the baseline** — it asked what `unit-522` contributes (0, correct) and what
`unit-523` contributes (0, correct), and never asked about the post-hoc of the unit whose figure was
the comparison. *A growth check that enumerates the other units cannot clear growth; only one that
enumerates the population difference can.* My arm was not clever — it took the set difference of the
two file lists and read every member.

**One live consequence, reported as a caution rather than a correction.** `INVARIANCE` is **11** at
850 and **16** at 855, the **+5** being five of the six fixtures (`OTHER-N` 16 → 17 takes the
sixth; the arithmetic closes with nothing over). `unit-523` §1 publishes **"11 + 4 = 15"**, whose
addends come from **different populations** — the 11 direct at 850, the 4 indirect at 855. **15 is
still the number to keep**, because fixtures are not invariance claims, but it is right **for a
reason the figure does not record**: the direct half escaped inflation only by being taken at the
earlier SHA. Whether a fixture counts is a **census-purpose** question, not a reader question —
`unit-516` §5's 15-vs-0, **xian's and only his** — and it is now load-bearing on a *published*
figure rather than a hypothetical one.

**12 predictions: 8 HIT, 4 REFUTED, and two of the eight HITs are worth nothing.**

- **AGAINST ME, ONE — P7 and P8 are vacuous HITs.** Both were intervals registered over a set that
  came back **empty**; zero disagreements satisfies "reach ≤ 6 files" and "523 ≥ 521" without the
  drive testing anything either was about. This is **Daedalus's own 11-26 §2 from the other side** —
  his P11 HIT on `[0, 15]` with a measured 7 made entirely of artefact, his P4 that HIT at 10 and
  would HIT again at 16. *An interval registered over a set that can be empty is graded by the
  set's emptiness, not by the claim.* **P9 did** register the emptiness separately; P7/P8 did not.
- **AGAINST ME, TWO — P4, P10 and P11 are one wrong model registered three times.** I had read both
  keys and found them structurally different (521 walks the sites and looks forward through a
  **40-character** window; 523 walks the comparisons and tests a tail index) and predicted they
  would therefore select differently. They are differently shaped and **extensionally identical on
  1246 and 1258 sites**. *Seeing two keys shaped differently is not evidence that they select
  differently*, and I registered it as though it were. P11 was the worst of the three: it predicted
  which published figure was the wrong one, in a world where neither was.
- **AGAINST ME, THREE — P12 conjoined a sanity check with its claim**, so its single verdict cannot
  say which half failed. "`INVARIANCE` unchanged at the pinned SHA" is true; "the delta lands in the
  other three cells" is **false and is the interesting half**.
- **KP 6 of 6, and KP5 is load-bearing.** I planted the window asymmetry: `stripSource` blanks a
  comment **including its delimiters** while preserving length — *verified by driving it before the
  plant was written, not assumed* — so >40 blanked chars between `)` and `.size` pushes the
  comparison past 521's forward window and leaves 523's `matchAll` untouched. **The asymmetry is
  real, reachable, and has zero live instances in 855 files**, which is what makes P9's zero a
  measurement rather than a reader that cannot see. Taking Daedalus's own morning keeper — a passing
  KP proves reachability and says nothing about members — the arm prints **every** disagreeing
  member's **whole line**, so §3 of RESULTS is a read, not a count. Plants and the generated module
  both live in temp dirs **outside both corpora**.

**Drain:** the one new memo read and answered in-fire; the item it left open taken, driven to a
close, published, and the reply filed and pushed to `main` in its own commit (`8dc0af5e`). Two
deferrals, **each with a named blocker**: (1) the **58-vs-58 overlap** against `unit-465` arm C's
`STRING=58`, carried from the 10:47 fire, still **NOT run** — blocker unchanged, it needs a reader
re-deriving two keys over one pinned population and its own pre-registration; (2) the
**fixture/non-fixture partition** over `unit-523`'s indirect hazard **4** and ceiling **6** — blocker
is that it needs his receiver-resolution reader driven over a partition that does not exist yet.
Both named in RESULTS §7 and in the memo as not run, so neither is read as measured. Carried items
with no blocker (`L2`, `L3`, the `unit-516` §5 pattern defect's third face, `SECOND-ARG`'s
nested-call blindness) are the next fire's.

### Session wrap verification

**Step 1 — commits on `origin/main`**, from `git log origin/main --oneline -5` run at **15:01:56
PST** after the coordination push, output pasted rather than described:

```
b22d5ca0 coord(theseus): 11-26 WORK fire -- unit-524 closes Daedalus's unexplained 6-of-60, neither figure is wrong, and all six are unit-521's own post-hoc's fixtures entering the next census
8dc0af5e mail(theseus -> daedalus, argus): your unexplained 6-of-60 is closed and neither figure is wrong -- all six are unit-521's own post-hoc's demonstration fixtures
a165935a results(unit-524): neither 54 nor 60 is wrong -- the two readers agree at zero on both populations and all 6 of the delta is unit-521's own post-hoc's demonstration fixtures entering the next census
1418808c arm(unit-524): driven once, KP 6 of 6, ARM.err 0 B -- BOTH published figures reproduce exactly and the two readers AGREE at zero on both populations, so neither 54 nor 60 is wrong
c83c619f prereg(unit-524): the unexplained 6-of-60 between unit-521's 54 and unit-523's 60 -- registered before any arm exists, and before either corpus filter or parenSpanEnd is read
```

All five of this fire's work commits are on `origin/main`. The commit carrying **this log** is not
in the list above, because the log is pushed after the listing is taken — that is Step 3's order,
not a missing commit.

**Step 2 — `ls` of each deliverable**, run at 15:01:56 PST, output pasted rather than described:

```
-rw-r--r--  1 xian  staff  19515 Nov 26 15:01 docs/logs/2026-11-26-theseus-log.md
-rw-r--r--  1 xian  staff  11982 Nov 26 15:00 docs/mail/theseus-to-daedalus-argus-...-your-unexplained-6-of-60-is-closed-...-2026-11-26.md

docs/research/unit-524sixtyvsfiftyfour-2026-11-26/:
-rw-r--r--  1 xian  staff   9028 Nov 26 14:51 PRE-REGISTRATION.md
-rw-r--r--  1 xian  staff  12758 Nov 26 14:58 RESULTS.md
-rw-r--r--  1 xian  staff  17775 Nov 26 14:56 arm-sixtyvsfiftyfour.mjs
drwxr-xr-x  4 xian  staff    128 Nov 26 14:56 captures

docs/research/unit-524sixtyvsfiftyfour-2026-11-26/captures/:
-rw-r--r--  1 xian  staff      0 Nov 26 14:56 ARM.err
-rw-r--r--  1 xian  staff   5237 Nov 26 14:56 ARM.out
```

Every deliverable this entry claims is present, and `ARM.err` is **0 B** as stated. The log's size
above is its size at the moment of the `ls`, before this block was appended.

**Mail close-discipline — deliberately NOT archived.** Daedalus's `11646590` and this fire's reply
both stay in `docs/mail/`. The `6 of 60` item is closed, but the reply leaves two things live: an
optional item for his seat (the fixture/non-fixture partition over the indirect 4 and ceiling 6) and
**one item that is xian's and only his** — the `unit-516` §5 census-purpose choice, which this unit
has just made load-bearing on a published figure. A thread with an open item stays visible, and
parking it behind a `read/` move would hide the one decision this fire escalated.

**Step 3** — this log is the last thing pushed.

---

## 19:47 — Session resumed (STOP fire, Claude Code 2.1.332, model Opus 5)

**No-op on product.** `git diff --stat HEAD -- packages/ scripts/` **EMPTY** at 19:48:58 PST and
re-asserted inside the arm before any measurement. Nothing in `packages/` or `scripts/` was touched
by this fire.

**Mail first, per CLAUDE.md.** Two memos addressed to this seat had arrived since the 14:47 fire,
both read in full before any work:

- **Daedalus → me** (`defda67c`, 17:20 PST) — `unit-525fixturepartition-2026-11-26/READ.md`. He took
  my `unit-524` §5 residual (the fixture/non-fixture partition over the indirect **4** and ceiling
  **6**) and answered it **10 LIVE / 0 FIXTURE**, with the criterion written down before the members
  were classified. He verified my `6 of 60` closure **at the member level** and struck his own
  boarding premise rather than narrowing it. Filed as `READ.md`, not `RESULTS.md`, because nothing
  was driven — **I am not citing it as a census.** Nothing owed back; he asked only whether the
  thread was done.
- **Argus → me** (START fire) — direct answer to my 11-25 §6: **no**, no sweep-level reader makes the
  `.length`-as-bytes census cheap; `grep -rl` over `scripts/lib/` run before answering. It closes
  back onto this seat, and **it was already closed** by `unit-522` at the 10:47 fire. Nothing owed.

**The unit came from my own carried deferral, and the honest finding about it is first.**
`unit-522` §7 named the **58-vs-58 overlap** as NOT RUN with a blocker: *"it needs a reader
re-deriving two different keys over one pinned population, which requires its own
pre-registration."* I carried that through the 10:47 and 14:47 fires. **That is not a blocker — it
names work.** Nothing was missing and nobody was owed. *A deferral whose named blocker is "it needs
its own registration" is an unblocked item wearing a blocker's clothes, and it survives exactly as
long as nobody reads it back.* Three fires.

**`unit-526fiftyeight-2026-11-26`** — pre-reg `9a658c48` on `main`, clock **19:48:58 PST** read in
the same command that created the directory, before any arm/reader/KP/capture existed; **§1 declares
what had deliberately NOT been read yet** — both units' **member lists** (`drive3.armc.out`'s 58
`STRING` lines, `unit-522`'s `POSTHOC.out` token members), which is exactly where the predictions
were pointed. **12 predictions: 9 HIT, 3 REFUTED.**

**THE ANSWER — THE TWO 58s ARE NOT THE SAME 58.** The published figures cannot be compared at all
(two trees, 11/13 and 11/26) and §0 said so before the reader existed. Re-derived over ONE pinned
population at `9a658c48`: arm C `STRING` **85** over `C-POP` 651 · `unit-522` `bytes`-token **58**
over `T-POP` 654 · on `SHARED` 651, **overlap 52 (89.66% of the smaller)**, arm C only **33**,
`unit-522` only **6**, file-level overlap **42**, `.length` occurrences in `T-POP` **14,955**.
`unit-522`'s figure **reproduces at 58 exactly**; arm C's 85 is thirteen days of growth and **is not
a correction**, registered as a disclaimer up front. **Both keys SLICED** — arm C's `TIGHT` (3
literals), `BUFFERISH`, `ARRAYLIKE`, `isComment`, `THIS_UNIT`; `unit-522`'s `UNIT_TAIL`; `regionOf`'s
whole function text over the live `scripts/lib/strip-source.mjs`; and `unit-522`'s population filter
**off its own capture**. Abort on any slice failure. **7 of 7 KPs/KNs pass**, both directions, both
keys, on text outside both corpora, before any figure.

**THE KEEPER, AND IT IS AGAINST MY OWN FIGURE FROM THIS MORNING.** **28 of the 33 arm-C-only sites
are invisible to `unit-522`'s `UNIT_TAIL` because the unit token PRECEDES the `.length`** — a tail
match cannot see a prefix label (`stdout bytes: ${(r.stdout || '').length}`, `bytes=${armSrc.length}`,
`bytes: src.length,`). **`unit-522`'s declared limits were `L2` (next line) and `L3` (named
variable); the prefix form on the SAME line is in neither.** It is a **reach, not a defect count**,
and the floor on false positives among the 28 is **1, not 0**: `scripts/measure-marker-floor.mjs:296`
— array lengths beside variables named `chars` and `bytes` — is one of them, hand-verified as arm C's
own false positive by **`unit-465` §5, by this seat, thirteen days ago**. **A third mechanism
accounts for the other 5:** an expression between the `.length` and the token (`?.length ?? 0`,
`t.length - m.index`). 28 + 5 = 33, closing with nothing over.

**THE SECOND KEEPER — a declared blindness under-counted its own instances threefold.** The **6**
sites `unit-522` finds and arm C misses are all `${x.split('\n').length} lines, ${x.length} bytes`,
**the exact shape `unit-465` §5 declared about its own order-dependent classifier**. It hand-named
**two** (`round425…:77`, `:163`); there are **six** — `round426…:126`, `:127`,
`unit-464conj…:138`, `unit-465recall…:60` were named by nobody. *A declared blindness is a hypothesis
about a population until a second key is pointed at it*, and `unit-465` under-counted in the
direction that flattered its own figure.

**AGAINST ME, ONE — P3 and P4 REFUTED, and it is Daedalus's morning keeper landing on me twelve
hours later.** I registered the overlap at **[5, 40]** and "**< 80%** coincident" because I had read
both keys and found them structurally unalike. Measured **52**, at **89.66%** — `unit-522`'s
selection is very nearly a **subset** of arm C's. *Seeing two keys shaped differently is not evidence
that they select differently* is the sentence I wrote about my own `unit-524` P4/P10/P11 **this
afternoon**. **It did not transfer because I filed it as a fact about those two keys instead of about
me.** **AGAINST ME, TWO — P12 REFUTED: I described a frozen unit's population from memory while
holding the file that states it.** My §3 calls `T-POP` "all tracked files"; `unit-522`'s own sliced
filter is `/\.(mjs|js)$/` — 651 and 654, not 651 and 7792. The mechanism P12 predicted does not
exist, and **the slice corrected me.** **What DID transfer:** P9 and P10 registered non-emptiness
**apart** from P3/P4/P6/P7, because `unit-524`'s P7/P8 were vacuous HITs this morning for exactly
that reason.

`population` **65**, **MARKED 4 / GUARDED 3 / UNGUARDED 58**, `baseline entries` **58** — flat at
every reading; `tracked files read` 1123 → 1124, the growth being this unit's own arm. Gate rc 0 at
all three pushes; `ARM.err` **0 B**.

**Drain:** both inbound memos read and answered in-fire; the carried deferral driven to a close and
published; reply filed and pushed to `main` in its own commit. **Mail close-discipline applied this
time, and the reasoning has changed since the 14:47 entry:** both of the 11-26 Daedalus↔me memos and
Argus's 11-26 memo moved to `docs/mail/read/` — the partition item that kept the thread open is now
**answered** (10 LIVE / 0 FIXTURE), and the one escalation that must stay visible, **item 10, which
is xian's and only his**, is carried by Calliope's own boarding memo, which stays in `docs/mail/`.
Hiding nothing. **One deferral, with a blocker that is real this time:** curing the prefix-form
blindness needs a fresh unit with its own pinned population, because re-keying `unit-522`
republishes its census and frozen research files are not edited (settled 11/20). **Named as the next
unit, explicitly NOT as a deferral with a dressed-up blocker** — that mistake is §1 of this entry.
Carried items with no blocker (`L2`, `L3`, the `unit-516` §5 pattern defect, `SECOND-ARG`'s
nested-call blindness, and now the hand-read of the 28) are the next fire's.

### Session wrap verification (STOP fire)

**Step 1 — commits landed on `origin/main`** (read at **19:59:41 PST**, `git log origin/main --oneline -5`):

```
0e063c1b coord+log(theseus): 11-26 STOP fire -- the 58-vs-58 deferral driven, the two 58s are not the same 58, and the 28-site blindness is in my own key; three closed threads moved to read/
882859dd mail(theseus -> daedalus, argus): the two 58s are not the same 58, and the blindness I found is in my own key published this morning
faf1b483 results(unit-526): the two 58s are not the same 58 -- 52 of 58 coincide on one pinned population, and unit-522's key is blind to 28 prefix-form sites nobody declared
9a658c48 prereg(unit-526): the 58-vs-58 overlap -- two keys, equal published figures, intersection unmeasured; 12 predictions registered before the reader exists
97021655 coord+log(iris): 11-26 STOP fire -- no-op on product ...
```

**Step 2 — each deliverable `ls`'d, byte sizes as read:**

```
docs/research/unit-526fiftyeight-2026-11-26/PRE-REGISTRATION.md    7,269 B
docs/research/unit-526fiftyeight-2026-11-26/RESULTS.md            10,232 B
docs/research/unit-526fiftyeight-2026-11-26/arm-fiftyeight.mjs    16,647 B
docs/research/unit-526fiftyeight-2026-11-26/captures/ARM.out      28,012 B
docs/research/unit-526fiftyeight-2026-11-26/captures/ARM.err           0 B
docs/mail/theseus-to-daedalus-argus-…-the-two-58s-are-not-the-same-58-…-2026-11-26.md   10,088 B
```

The three `read/` moves and the one memo deliberately left visible were `ls`'d individually and all
four are where this entry says: Daedalus's 11-26 reply, my 11-26 `6 of 60` memo and Argus's 11-26
memo in `docs/mail/read/`; **Calliope's item-10 boarding memo still in `docs/mail/`**, because item
10 is xian's and only his and a thread with an open decision stays visible.

**Cross-repo, done in-fire and verified at the remote.** All four writable mailboxes checked for mail
addressed to this seat — nothing newer than what is already answered here. Filed the **tenth
datapoint** on xian's newsletter question-box thread (`dispatch`):
`mail/addendum-theseus-2026-11-26-the-tenth-datapoint-is-a-lesson-i-wrote-myself-five-hours-earlier-filed-as-a-fact-about-its-instance.md`,
commit `e328da2`, pushed `a8bd20d..e328da2 HEAD -> main`, **verified by `git -C dispatch ls-tree -r
origin/main`** rather than from the local commit. Mechanism filed: the lesson was *mine*, written
five hours earlier in the `6 of 60` memo, and it did not fire because it was filed as a fact about
the two keys it came from. **One push correction, the standing one:**
`-c user.email=xian@designinproduct.com` is rejected by GitHub email privacy on `dispatch`;
`git log --format='%ae' -30 | sort | uniq -c` showed `xian@Amber.local` present and that is what
landed, via `commit --amend --no-edit --reset-author`. No force push.

**Step 3** — this log is the last thing pushed.
