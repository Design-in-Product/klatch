# Theseus session log — 2026-10-28 (START fire, Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus` · branch `claude/theseus-cycle`,
pushed to `origin/main` incrementally.

---

## 10:47 PT — fire open, briefing

`git log --format='%h %an %s' -8`: **none of today's commits are mine** (author-checked with
`%an`, not `--oneline`). Daedalus ×3, Argus ×1, Calliope ×1, Iris ×1, Pard ×1, automated ×1. So
this is my first fire of 10/28 and this log is the day's first for this seat.

HEAD at open: `26f3a062`. Tree clean.

**Mail, identified by commit rather than mtime** (`git log 1d9c4b58..HEAD --name-only -- docs/mail/`,
because the wrapper's sync restamps mtimes and `find -newermt` would be keyed on checkout time):
exactly **one** new memo —

* `daedalus-to-argus-theseus-cc-xian-janus-calliope-iris-your-c4-red-is-repaired-and-two-cripples-leave-my-own-new-key-green-2026-10-28.md`
  (277 lines), read in full before any work.

Its §7 routes **one** item here: "`T2` reds as good news now that the run is 0, so the leg needs
re-aiming, and the standing line needs its new value carried." Everything else in it is his, or
Argus's (`tree-fingerprint.mts` false-red class under concurrency), or unclaimed.

**Not a round, deliberately.** Under this seat's own condition, self-directed work queues behind
gated work another seat named.

## 10:49 PT — reproduce before touching anything

`drive1.reproduce-at-head.out` at `26f3a062`, `.err` empty (`grep -c .` = 0):

```
VERDICT/1 RED legs=11 red=[T2] refused=[] preds=5 refuted=[P1,P3,P4] prefused=[]
  rounds that cured a gated surface (dir key): 381,383,387,389,391,417,454,464
  most recent such round : 464
  CONSECUTIVE rounds since, gated-cure-free : 0
```

His verdict line, byte-for-byte. His cause reproduces too, off `git show --name-only 87270c6f`
rather than inferred: that commit filed `grade-the-lib-mjs-gate.mjs` + `drive11.*` into
`docs/research/round464-instruments/` while curing `scripts/lib/characterisation-markers.mjs`
and `scripts/lib/offer-choice.mjs`.

**Correction to my own record, found here:** my 10/27 COORDINATION line published the cure set as
`383,387,389,391,417,454` (6). That was the **pre-repair clock-keyed** drive1 figure; the repaired
absolute-window `drive5.clean.out` the same afternoon already read **7** (`381` included). My
published line under-quoted the set by one member.

## 10:50 PT — the question the fire went to

Not "did the value move" (it did) but "**is the credit genuine**". Round 464 is this seat's
stop-condition round; its own COORDINATION entry says it touched nothing under `packages/` or
`scripts/`. `recon-credit-provenance.mjs` → `drive2`: for every credited round, the crediting
commits and the commit that created the round's directory, authors on both sides. **9 credit
edges, 8 same-author, 1 cross-author.**

First increment committed and pushed: `dcfce02c` → `origin/main`.

## 10:55 PT — the cell, and the key stated before it was measured

`grade-the-credit-key.mjs` — 9 legs, 5 predictions, 6 cripples. **SELF-ATTESTED**: a credit edge
is genuine iff (a) the crediting commit's subject names the round, or (b) the commit created the
round's directory. Clause (b) is load-bearing — round 417's credit comes from the commit that
created its dir and its subject names no round at all (`C7`, the known positive).

`drive3.clean.out`: `VERDICT/1 RED legs=9 red=[C3,C6] refused=[] preds=5 refuted=[] prefused=[]`,
all five predictions LAND, `.err` empty.

**The finding (`C3`):** same rev, dir key `454→464 / consecutive 0 / NOT FIRED`; self-attested
key `454 / consecutive 10 / FIRED`. Whether the track has already passed its own stop condition
is decided by a key neither seat stated. This changes my 10/27 `T8` report — the key ambiguity
was "latent today, load-bearing later"; it is load-bearing now.

**The incidental class is 3 of 9, not 1 (`C5`)** — and two of the three are same-author: round
`391`'s own commit `1588b85f` amended the 387 and 389 cells (2 and 12 lines) while curing
`scripts/lib/strip-source.d.mts`, so the dir key credits 387 and 389 for 391's cure. Daedalus's
`87270c6f` is the least unusual member of the class.

**`C6` grades the key I reached for first and it is wrong:** author mismatch catches **1 of 3**.
Published rather than adopted, with the confound named — every round dir in the cure set but 464
was created by Daedalus, so "cross-author" and "the one Theseus-created dir" are the same column
here, and no edge anywhere in the window tests the other direction.

Cripples, all six predicted in the grader before being driven:

| cripple | predicted | measured |
|---|---|---|
| `key-dir-only` | `red=[C4] refused=[C6]` | same |
| `key-subject-only` | `red=[C3,C6,C7]` | same |
| `author-key-as-truth` | `red=[C3]`, C6 green | same |
| `creator-unresolvable` | `REFUSED refused=[C2,C3,C4,C6,C7]`, Q5 refuted | same |
| `window-bare` | predicted **not** to separate | same (`red=[C3,C6]`) |
| `no-round-dirs` | `red=[G1,C6] refused=[C2,C3]` | `red=[G1,C2,C6] refused=[C3]` — **my map was wrong** |

One of six predicted maps wrong, toward a stricter outcome: `C2` carries a `g1` conjunct, so a
dead population is a RED there under Kleene strong AND, not a refusal. Leg right, prediction of
it wrong. `window-bare` labelled not-separating rather than counted, and it is informative
anyway: the bare window drops round **381** from both cure sets (610 commits vs 617), so the
erosion reaches a member and does not reach the finding — consistent with `W2`.

Second increment: `32c65775` → `origin/main`.

## 11:00 PT — the routed item landed in the standing cell

`docs/research/round464-instruments/grade-the-stop-condition.mjs`, design notes 7–9:

* **`T2` re-aimed** — `consecutive > 0` → `consecutive < N_PROPOSED`, `N_PROPOSED = 5` named in
  source with the leg printing which number it used. A RED now means the track should stop.
* **`T2b` added** — the key disagreement; the cell's live RED. Self-attested key **re-implemented**
  here, not imported (Round 453: a guard added in round N can kill an instrument from round N−k,
  and this is the cell I re-drive every fire). `P6` pins the two implementations agreeing; both
  read 454.
* **`T9`** `[MEAS]` — dated figure history `10-27 454/10` → `10-28 464/0`, causing commit named.
* **`M0`** — the `[MEAS]` exclusion from the refusal set is keyed on a declared id list, not leg
  text, and `M0` reddens if a declared MEAS leg carries a value. Otherwise a leg could opt out of
  the verdict by editing its own first six characters.
* **`P1`, `P3`, `P4` retired** — each landed 10-27, each decided against by a real event
  (`P1`/`P3` by `87270c6f`; `P4` by the drive clock). Not re-expected (a bent pin grades nothing),
  not left live (a refuted-but-live prediction asserts the old value in its own text every fire).

## 11:02 PT — a defect of my own that only re-driving found

Re-drove the three existing cripples after the re-aim. `t1-no-clock` **stopped separating**:
`red=[T2b]` where 10/27 read `red=[T1]`.

Cause, measured not reasoned: the cripple passed `SINCE_BARE` — the literal `'2026-10-13'` —
and git resolves a bare date against the **ambient clock**.

* 10-27 14:57 → reconstruction `6/169` vs published `8/169` → `T1` RED (separating)
* 10-28 ~11:0x → reconstruction `8/169` vs published `8/169` → `T1` green (not separating)

This fire ran near drive1's own `10:51`, so the eroded band nearly coincided and the figure
reproduced by accident. **The cripple was keyed on the hazard it exists to demonstrate**, so
`T1`'s green is load-bearing at some hours and vacuous at others with nothing saying which.
Reading the source would not have found it.

Repaired by pinning the recon clock to `2026-10-13 14:49:00` (drive2's actual clock, measured on
10-27 to give `6/169`). Graded three ways: `W4` asserts the key carries an explicit `HH:MM:SS`
and differs from drive1's; the new **`t1-bare-clock`** cripple puts the bare date back and
reproduces the regression deterministically; `W3` is a `[MEAS]` printing the ambient
reconstruction in every arm — today `coincides=true`, recorded rather than silently flipping a
verdict.

Final arms at the final source, every `.err` empty (`grep -c .` = 0 on each):

| drive | arm | verdict |
|---|---|---|
| `drive15` | clean | `RED legs=16 red=[T2b]` |
| `drive16` | `t1-no-clock` (repaired) | `RED red=[T1,T2b]` |
| `drive17` | `t1-bare-clock` (new) | `RED red=[W4,T2b]` |
| `drive18` | `window-bare` | `RED red=[W1,T2b]` |
| `drive19` | `memo-path` | `RED red=[T2b] refused=[T6] refuted=[P5]` |
| `drive20` | `t2-dir-only` | `ok refuted=[P6,P7,P8]` |

Third increment: `95adb3f7`. README: `bf5f87a4`.

## 11:04 PT — Daedalus's §5b acted on, not noted

`zw-scan.mjs` over this unit, all of `round464-instruments/` and `docs/mail/` — five code points,
built from `charCodeAt` so the scanner is itself scannable, excluding its own source by its own
path so the gate cannot redden on itself. `VERDICT/1 ok files=198 zeroWidthLines=0`. The gate
requires `files > 0`, so a scan that walked nothing is a RED rather than a pass.

## 11:05 PT — mail out, cross-repo checked

Reply filed and committed **in its own commit**, per the worktree mail discipline:
`docs/mail/theseus-to-daedalus-cc-argus-xian-janus-calliope-iris-your-t2-item-is-taken-and-the-credit-that-moved-your-figure-is-one-of-three-2026-10-28.md`.

Threads left **open** deliberately: the key choice is an action on Daedalus and xian, and
Argus's `tree-fingerprint.mts` item from the same memo is unresolved. Nothing moved to
`docs/mail/read/`.

All four cross-repo mailboxes checked: `designinproduct` — 2 hits, both Daedalus's own CI thread
with Janus, nothing to me; `mediajunkie` — 1 hit, Calliope's 10/23 memo cc'ing me, already seen;
`dispatch` — the one `theseus` hit is my **own** 10/25 outbound newsletter question
(`question-theseus-2026-10-25-the-dead-instance-of-a-live-shape.md`), no action owed;
`piper-morgan-product/mailboxes` — nothing for Klatch. Nothing owed from any.

## 11:05 PT — not run, and why

`npm test`, `npm run typecheck`, the driving sweep. `git diff --stat HEAD -- packages/ scripts/`
**empty**, confirmed directly — every file this fire wrote is under `docs/`. Under the condition
this cell grades, that is itself the finding, and `T2b` now reports it with its key named. Also
the safe shape under Daedalus's §6b: a `docs/`-only commit mid-sweep does not move a
`tree-fingerprint` bracket.

Nothing left running; the cells use `execFileSync`.

## 11:08 PT — wrap verification (Session Wrap Protocol)

**Step 1 — commits on `origin/main`** (after `git fetch -q origin`;
`git log origin/main --format='%h %an %ci %s' -7`):

```
35518aec Theseus (Klatch) 2026-10-28 11:07:55 -0700 coord+log: 10/28 START fire — T2 re-aimed off good news, and the stop-condition value is now key-dependent
d0bf106f Theseus (Klatch) 2026-10-28 11:05:06 -0700 mail(Daedalus, cc Argus/xian/Janus/Calliope/Iris): T2 re-aimed; the credit that moved your figure is 1 of 3; the keys disagree about whether the condition has fired
fc953bd2 Theseus (Klatch) 2026-10-28 11:05:00 -0700 unit-464t2: scan this fire's surface for zero-width characters, per Daedalus's 10/28 §5b
bf5f87a4 Theseus (Klatch) 2026-10-28 11:02:55 -0700 unit-464t2: README — the key, the three incidental credits, and the cripple that stopped separating
95adb3f7 Theseus (Klatch) 2026-10-28 11:01:37 -0700 round464: re-aim T2 off good news, publish the key disagreement, and repair a cripple keyed on the hour
32c65775 Theseus (Klatch) 2026-10-28 10:56:27 -0700 unit-464t2: the credit key decides whether the stop condition has fired, graded by 6 cripples
dcfce02c Theseus (Klatch) 2026-10-28 10:52:53 -0700 unit-464t2: reproduce the moved stop-condition value, and census who credits each round
```

Seven commits, all `%an`-checked as mine, all on `origin/main`. Pushed in six increments as the
fire went, per the 2400 s timeout discipline.

**Step 2 — deliverables, read off the pushed rev with `git ls-tree -r --name-only origin/main`,
not off the working tree:**

* `docs/research/unit-464t2-reaim-2026-10-28/` — **46 files**: 3 instruments
  (`recon-credit-provenance.mjs`, `grade-the-credit-key.mjs`, `zw-scan.mjs`), README, and 21
  drives with their 21 `.err` files
* `docs/mail/theseus-to-daedalus-cc-argus-xian-janus-calliope-iris-your-t2-item-is-taken-and-the-credit-that-moved-your-figure-is-one-of-three-2026-10-28.md` — present
* `docs/logs/2026-10-28-1047-theseus-opus-log.md` — present
* the standing cell's edits, verified by reading the **pushed** blob
  (`git show origin/main:docs/research/round464-instruments/grade-the-stop-condition.mjs`): 28
  occurrences of `T2b` / `'W3'` / `'W4'` / `'M0'` / `N_PROPOSED` / `t1-bare-clock`

**Step 3 — this log pushed last,** after Steps 1 and 2.

Nothing is missing and nothing is claimed that was not read off `origin/main`.

---

## 14:47 — Session resumed (WORK fire, model: Opus 5)

Appending to today's existing file rather than opening a second one. Calliope's
log-filename convention landed at 12:38 today (`e5ddfde2`, memo already closed into
`docs/mail/read/`): one file per agent per calendar day, migration forward-only, don't
rename existing logs. This file is today's; a new `2026-10-28-theseus-log.md` would make
two files for one day, which is the exact harm the convention replaces.

**14:47 — Briefing.** Pulled state as synced by the wrapper, `HEAD 41ae8657`. Inbound
identified **by commit, not mtime** (`git log d0bf106f..HEAD --name-only -- docs/mail/`),
because the wrapper's sync restamps mtimes and `find -newermt` would be keyed on checkout
time. Three memos since my last commit:

* Daedalus → Theseus, xian (`9b62fcf8`) — key adopted; §4 dates the regime change to round
  292 and says the run is 172; §8 routes one item here (`C3` to carry its reading).
* Argus → Daedalus, Theseus (`41ae8657`) — tree-fingerprint content-rekey; **routes
  nothing** to this seat (his §6 is explicit), and notes as a side effect he does not claim
  that it closes this seat's Round 334/335 clean-window collision.
* Calliope → team (`e5ddfde2`) — log-filename convention, already closed by her.

Author-checked at open with `%an`: none of 10/28's commits before this fire were mine.

**14:49 — Reproduced both of his cells before touching anything.** `drive1`/`drive2`,
`.err` 0 bytes each. `grade-the-surface-predicate.mjs` differs from his recording only in
`REV`, `CLOCK` and three population counts (627→633 commits, 22→26 windowGatedFiles,
4299→4322 tracked); **the entire 3 × 2 table is byte-identical**. `recon2` differs in
`REV` and `CLOCK` and nothing else.

**14:52 — Recon (`drive3`), and the §4 figure is keyed on a third key.** `recon2`'s key is
`SUBJECT_ROUND_RE` on the subject alone — clause (b) absent (its own lines 39/83, and its
header says so deliberately). Under the key he *adopted* in §3, both windows answer
`last=417 consecutive=45`, not `NONE` and not `292/91`, because `e2759907` creates
`round417-instruments/` and touches `packages/shared/src/types.ts` (confirmed from
`git show --stat`). Under adopted + a cure predicate: `292/91` again. So his number holds
for the cure reason rather than the label reason, and my cure model's recall is 2/19 —
safe here only because the one post-292 candidate is a hand-confirmed non-cure.

Also measured: highest attested round is **467** (his own `6190a0dd`, 09:36 today), filed
into `unit-307c4-rekey-2026-10-28/` with **no `round467-instruments/` anywhere**. Both
seats' `consecutive` figures count `roundNNN-instruments/` dirs; rounds now file into
`unit-*`. And a defect of mine: my union key credits round `465`, attested only by two
commits saying *"no Round 465"*.

**A tested objection that failed:** I expected his "by round NUMBER" span to rest on a
false density assumption. Of the 100 integers in `365..464`, 9 have no dir and **all 9 are
attested by commit subjects** — zero unattested. His assumption is supported. Recorded
because an objection that fails is worth what one that lands is worth.

**14:56 — The graded finding, found by reading an exit code rather than a verdict line.**
`grade-the-credit-key.mjs` prints `VERDICT/1 RED red=[C3,C6]` and **exits 0**
(`drive4`: status 0). The `/1` was a literal; no `process.exit` in the file. Censused the
mechanism rather than the instance: `round464-instruments/grade-the-stop-condition.mjs` —
**the cell whose figure the standing line quotes every fire** — has the same defect.

Nearly shipped the wrong key for it: a source scan keyed on the argument of
`process.exit(...)` calls `zw-scan.mjs` silent, but its gate is live in
`if (!ok) process.exit(1)`. Source key 3, drive key 2, one false positive. Graded legs
moved to a **live drive**; the scan kept as a `[MEAS]` with its confusion matrix, keyed on
the **pinned pre-repair rev** with `drive6`'s recording parsed as ground truth, because
post-cure the positive class is empty and the matrix is vacuous.

**15:0x — Pre-repair state committed before the cure landed** (`2fdd3ccc`, `drive6`: all
legs green, 3/3 predictions landed). An old cell sourced from HEAD inverts when the cure
arrives and a re-read cannot catch it, so the evidence went in at its own rev first.

**15:1x — Cure + 5 cripples** (`4400e370`). Three cells now derive the `/N` token and the
exit status from one `code`. Every cripple's verdict map hand-derived and committed in
`cripple-maps-predicted.md` **before** its drive — 5 of 5 as predicted, including two
predicted **not** to separate (`drive-blind`, `source-as-truth`), both for the same reason:
once the positive class is empty a key-choice cripple has nothing to disagree about.

Three further defects of my own, none found by reading:
1. `drive7`'s RED was caused by **my own uncommitted state** — the drive key runs the
   working tree, the source key read `git show REV:`. Split the readers; `M5` prints which
   tree each key read.
2. **My own cure's prose re-tripped the detector** — the comment explaining the defect
   quotes the literal token, so a raw-blob key called the cured files unfixed. Comment-blind
   now, keyed on non-comment lines.
3. `source-as-truth` had been **unrunnable** since the reader split (dead `sourceSilent`
   reference on a line the clean arm never evaluates). `drive13` crashed; only driving the
   cripple found it.

**15:2x — Memo filed in its own commit and pushed straight to `main`** (`a9b34939`), per the
worktree mail discipline. Scope stated in its own §0: §1–§4 are **recon**, not graded legs,
and I say so rather than present them at a graded strength.

**Routed item not done, named rather than half-filed:** Daedalus's §8 asks that `C3` carry
the reading it is computed under. No blocker — the fire went elsewhere. It is mine and open,
and the memo says so.

### 15:3x — WORK fire wrap verification

**Step 1 — commits on `origin/main`** (`git fetch` first, then `git log origin/main`):

```
ff65e27f Theseus (Klatch) coord+log: 10/28 WORK fire — the standing line carries THREE axes now…
a9b34939 Theseus (Klatch) mail(Theseus -> Daedalus, xian; …): his 292 is right for a better reason…
4400e370 Theseus (Klatch) exit-code cure: three cells derive the /N token and the exit status from one value…
2fdd3ccc Theseus (Klatch) unit-464t2-surface: two of my cells print RED and exit 0, and the standing…
96028336 Theseus (Klatch) unit-464t2-surface: his two cells reproduce byte-identically, and my own…
41ae8657 Argus  (Klatch) tree-fingerprint: re-key on content, not git bookkeeping…
```

All five of this fire's commits are present and all five are mine by `%an`.

**Step 2 — each deliverable read off `origin/main`, not off the working tree.** 9 named
paths all `PRESENT` via `git cat-file -e origin/main:<path>`. Unit directory as
`origin/main` holds it: **32 files**. `.err` files: **14, all of size 0**, checked with
`git cat-file -s` per file rather than by grep — grep drops a file containing a NUL byte,
and the figure would come out smaller without saying so. `VERIFY OK missing=0
nonemptyErr=0`.

**The cure verified at the blob, not at my claim** — all three cured cells on `origin/main`
carry both halves (`process.exit(code)` **and** the interpolated token), because fixing one
axis and not the other is the exact failure mode:

```
CURED  docs/research/round464-instruments/grade-the-stop-condition.mjs
CURED  docs/research/unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs
CURED  docs/research/unit-464t2-reaim-2026-10-28/zw-scan.mjs
```

**Step 3 — this log and the unit README pushed last,** after Steps 1 and 2.

Nothing is missing and nothing is claimed that was not read off `origin/main`. The one
routed item (`C3` carrying its reading) is **not done**, named as open in the memo, in
COORDINATION and here, rather than reported as finished.

---

## 19:47 — Session resumed (STOP fire, model: Opus 5)

**19:47 — Briefing.** Worktree synced by the wrapper, `HEAD 10ebefaa` = `origin/main`, tree
clean. Checked the **author** of each commit above my last before assuming any were mine:
`10ebefaa` Iris, `a2bd0a33` Argus, `1a97c176`/`47b42bb7` mine from the 15:3x wrap. My own last
commit of the day was `ff65e27f`.

**Mail:** one new memo addressed to this seat since 15:3x —
`daedalus-to-theseus-argus-...-the-key-was-never-the-live-defect-the-denominator-was-...-2026-10-28.md`
(his 17:2x–18:0x STOP fire). Read in full at fire open. The 14:47 memo was already read this
morning (logged above at 14:47), so it is not re-opened.

His §7 routes three items here: `C3` carrying its reading; re-keying my attested census to
exclude denials ("a one-line change against a known answer"); putting my §1–§4 under graded
legs. **I took the second and third as one item,** because the census re-key is only a
one-liner if his answer is right, and the thing that makes it checkable is grading it.

### The item, and why it was not a one-line change

His filter, verbatim from `unit-464t2-population-2026-10-28/grade-the-round-population.mjs:67`:

```js
const DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;
```

His `D1`/`D2`/`D3` are **all keyed on the member 465**. So a population-level claim — *the
removed set is exactly `[465]`* — is graded only by legs about its single known member, and
neither half of what a selector gets wrong is reachable from there.

**New unit `docs/research/unit-464t2-denial-2026-10-28/`.** One recon, one grader (9 legs,
5 cripples), 9 recorded drives, every `.err` 0 bytes. Predictions and the cripple hand map
**committed before the grader existed** (`f5bc7253`; grader lands in `e9901fae`).

### His figures reproduce — under my own reader, and by driving his cell

```
  G1  my independent reader : raw=175 filtered=174 removed=[465]              ok
  G2  HIS CELL driven as a child process, agreeing member-for-member on
      filtered=174 max=467 removed=[465]                                      ok
```

`G2` drives his cell rather than re-typing his reader, with `CRIPPLE: ''` so my cripple cannot
leak into his. His filter is **sufficient, not merely necessary** — I rebuilt the per-round
rule independently and got his member list. **The correction to my published 175 is adopted:
the figure is 174.**

### PRED-4, the finding: his key deletes round 467

```
  non-denial subject : round467: re-key probe-round307 C4 — there is no
                       round467-instruments directory in the tree
  key says           : DENIES 467  <-- round 467 deleted from the population
  RED  G4   fpSubjectMatched=true deniesRound=467
  ok   G4c  CONTROL: the key still matches a genuine denial (denies 465)
```

A denial of round N and a statement that an **artifact** of round N is absent are different
claims. 467 is the **highest attested round** and the one member whose existence does the work
in his §3 — it is how we know the dir population is frozen rather than merely behind. His
filter pointed at a subject of that shape deletes exactly the member carrying his finding, and
the figure comes back *smaller* and looks conservative. `G4c` is why that is a false positive
and not a key matching everything.

**The cure, graded:** `/\bno\s+round\s*(\d+)(?![-\w./])/i`. Driven as the `fp-safe-key`
cripple, **G4 flips RED → green and G1/G2/G3 do not move** — so it costs nothing on the 174.
Not applied to his cell by me.

### PRED-7 refuted at 6 — and my own figure was 29 first

I predicted **zero** landed instances of the FP shape in committed prose (the repo spells
directories in backticks; `\s+` cannot cross one). Measured over 2811 committed `.md` files at
the pinned rev: **44 lines matched, 6 false positives.**

```
  no Round 295  docs/COORDINATION.md
  no Round 445  docs/COORDINATION.md        <-- the file carrying the standing line
  No Round 365  docs/logs/2026-10-10-1332-argus-sonnet-log.md
  no Round 422  docs/logs/2026-10-19-1948-theseus-opus-log.md
  No Round 445  docs/logs/2026-10-23-1947-theseus-opus-log.md
  no Round 295  docs/mail/read/daedalus-to-theseus-...-2026-10-09.md
```

*"**No Round 445** reply memo to Daedalus"* — my own log, 10-23 — denies a **memo**, not a
round, and 445 exists. The shape is idiom, written three times by both seats, twice in
`COORDINATION.md`.

**And the figure was 29 before it was 6.** My classifier asked
`nonSubject.has(n) || subjectRounds.has(n)`, and `subjectRounds` contains 465 *precisely
because the two denials name it* — a round attested only by its own denials counted as
existing. Re-keyed onto `nonDenialSubjectRounds` (the predicate his filter uses for
sufficiency): **29 → 6**, `linesMatched` unchanged at 44, so the repair moved the
classification and not the scan. It over-reported by 5×, in the direction that flattered my
own finding.

A second one caught **before** its first drive: the `SELF` leg read its own source with
`git show REV:<path>`, and this file does not exist at the pinned rev. A rev-sourced self-test
would have refused on drive 1 and gone on refusing in any tree behind the pin. Re-keyed to
read the running file off disk via `import.meta.url`.

### Recall, stated as a floor and not a defect

`G5 [MEAS]`: the key reaches **0 of 4** alternate denial spellings (`not Round N`,
`never Round N`, `Round N does not exist`, `Round N was skipped`), with **0 instances in the
corpus** at this rev. One spelling is one axis of coverage — a floor on the filter's reach.
Labelled `[MEAS]`, not graded as a defect.

### Cripples: 5 of 5 separate, 2 of 5 match the map, and two misses are real

```
  MAP-OFF  no-denial-filter     actualRed=[G1,G2,G4] predicted=[G1,G2]
  MAP-OK   fp-safe-key          actualRed=[]         predicted=[]
  MAP-OFF  xcheck-wrong-figure  actualRed=[G1,G2,G4] predicted=[G2]
  MAP-OFF  hand-map-widened     actualRed=[G3,G4]    predicted=[G3,G7]
  MAP-OK   control-off          actualRed=[G4,G4c]   predicted=[G4,G4c]
  SUMMARY  maps=2/5 separating=5/5 exitMatchesToken=true
```

`predicted.md` was **not** edited to fit. Three misses, three causes:

1. I wrote the hand map as a **delta**; the grader reports an **absolute** red set, so every
   cripple that doesn't touch the key carries the clean arm's standing `[G4]`. My map's error.
2. **`xcheck-wrong-figure` reddens `G1` too** — it corrupts `mineRaw`/`mineFiltered` before
   `G1` reads them, so it is aimed at the cross-check and hits the gate leg first. This is
   Daedalus's own §5 third note reproduced in my instrument **in the same fire he wrote it**:
   a cripple that reddens the wrong leg reads as working if you only check that *something*
   went red. Only the member-list comparison caught it.
3. **`hand-map-widened` leaves `G7` green — a vacuity in `G7`.** It filters the hand set down
   to members of the candidate set, then compares it to the hand set: two keys sharing a
   denominator. It can only redden if a hand member falls *outside* the 207, far weaker than
   its own `why` string claims. The widened member `660d2b94` is inside the 207, so it passed.

The cripple I predicted would be wrong is the one that matched: `fp-safe-key` separates by
turning a leg **green**, which no verdict-level check could score at all.

**Items left open rather than half-filed:** `C3` carrying its reading (unchanged, third fire,
named not drifted); repairing `xcheck-wrong-figure` to corrupt only the copy `G2` compares;
re-keying `G7` onto something it cannot satisfy by construction. No blocker on any — the fire
went to the finding instead.

**One timekeeping correction on myself:** mid-fire I estimated the elapsed window from effort
and put the clock at ~20:25 when `date` said 19:58. Ran `date` instead of continuing to
estimate, and the real budget was there.

**Not run this fire:** `npm test`, `npm run typecheck`, the sweep.
`git status --porcelain -- packages/ scripts/` empty — every commit is `docs/`-only.

**Memo filed in its own commit and pushed straight to `main`** (`dc537465`), per the worktree
mail discipline.

**Drain:** the one new memo read at fire open and answered in the same fire; two of its three
routed items taken as one and graded; the third (`C3`) named open with no blocker. Deferrals
carry no deadline and no "next fire" — they are listed above as open, with the reason the fire
went elsewhere.
