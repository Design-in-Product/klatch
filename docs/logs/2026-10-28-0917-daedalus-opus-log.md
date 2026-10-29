# Daedalus session log — 2026-10-28 (START fire)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Model: Opus 5.

## 09:17 PT — briefing

* `date` → `Wed Oct 28 09:17:09 PDT 2026`. First Daedalus log of the day (`ls docs/logs/` shows
  `2026-10-28-0722-iris`, `-0837-calliope`, `-0902-argus` and no daedalus entry).
* `git status` clean, `git log -3` → the three most recent commits are **not mine** (author-checked
  with `%an`: Argus `8fe017b4`, Calliope `08307b62`, Iris `660d2b94`, all 10/28 START fires, plus
  Pard's `7f764908` brief bump). Checked rather than assumed from the `10/28 START fire` subject
  line, which all three share with what mine would say.
* `docs/mail/` — two memos new since my last fire, both addressed to this seat:
  1. `argus-to-daedalus-...-your-lib-mjs-gate-landed-and-it-reddened-round307s-c4-2026-10-27.md`
  2. `theseus-to-argus-daedalus-...-your-unclaimed-110-is-zero-by-the-mechanism-and-your-13-is-three-modules-not-two-2026-10-27.md`
  Both read in full in this fire. Both route the same item to me: `probe-round307` arm `C4` is RED,
  caused by my own `scripts/lib/**/*.mjs` typecheck gate (`87270c6f`, 10/27 STOP), and the repair is
  mine to choose.

## 09:2x PT — reproduced the red in my own tree before touching anything

`npx tsx scripts/probe-round307-...mts` → `[C4] FAIL`, `1 of 17 regression check(s) FAILED`, exit 1.
`gradeable.length` **14**, printed `jsdocTags` line
`characterisation-markers 0 · strip-source 0 · tsx-required 8 · sweep-probes 0`. Argus's RED and
Theseus's reproduction both hold here, byte-for-byte on the figures they published.

Read the mechanism off the source rather than off the memos: `characterisation-markers` (8 fns,
inline `@type`), `strip-source` (2, inline `@type`), `tsx-required` (4, **block** `@param` and no
inline `@type` on any parameter), `sweep-probes.mjs` (13 readable, `grep -c '@param\|@returns\|@type'`
→ **0**). Theseus's attribution correction is the load-bearing one: `tsx-required`'s 3 extra gradeable
signatures gained no block tag, so the "scope the pin to the three original modules by name" repair
cannot work. Only the re-key survives.

## 09:3x–10:0x PT — the repair, and the grading

Unit: `docs/research/unit-307c4-rekey-2026-10-28/` — 1 grader, 5 cripples, 8 recorded drives, 4
recorded gate runs. Full write-up in that dir's `README.md`.

* `C4` re-keyed **per-signature and style-blind**, as SET equality in both directions. A count would
  have been green today by cancellation (annotated 14, gradeable 14).
* `C4a` added — the key's known positive on a **minted** mixed module, plus a refusal on an
  unanchorable name. `C4b` added — both styles are live in the population. `C4m` — the style census
  as a `[MEAS]`, keeping the block-tag figures the 10/27 memos quote printed.
* `grade-c4.mjs`: `VERDICT/1 ok legs=6 red=[]`. All five cripples landed **exactly** as predicted
  before the drive.

**The finding worth carrying (`G3`):** two of the five cripples leave `C4` **green** —
`k-inline-per-module` (abandon the per-signature slice, credit any `@type` in the module) and
`k-refuse-as-none` (collapse the refusal into `'none'`). Both are caught only by `C4a`. The live
population cannot grade the per-signature half of my own new key, because every module in it is
uniformly annotated or uniformly bare. Following the reds would have called both clean.

Two stale sentences in the probe's docblock corrected, each verified against git rather than recalled:
the arm-letter list has been off by one since the file's creation commit (`58debe3e`, 2026-10-01), and
finding 2's population figures predate `eea42c26` (2026-10-11), which gave
`characterisation-markers.mjs` a `.d.mts` and took the pair count 3 → 4.

## ~10:3x PT — the standing stop-condition value moved, and my own 10/27 commit moved it

Driving Theseus's cell (`docs/research/round464-instruments/grade-the-stop-condition.mjs`) rather
than retyping the standing number: `T2` reads `last gated-curing round 464, highest 464,
consecutive 0`, `VERDICT/1 RED legs=11 red=[T2] refused=[] preds=5 refuted=[P1,P3,P4]`. So the
standing line (`consecutive=10 · 454 · ALREADY FIRED`) is wrong, and `87270c6f` — mine, 10/27 17:33 —
is what moved it: it filed its grader under `docs/research/round464-instruments/` while touching two
`scripts/lib/*.mjs` files, and his dir key is `^docs/research/round(\d+)-` ∧ `^(packages|scripts)/`
(read off his source, lines 159–160 and 385).

**Theseus's 10/27 figure was already stale at his own commit**, and that is checked rather than
inferred: his cell's source is unchanged since `7a84c8d4` (10/27 15:00, before mine), `cc41fa53`
descends from `87270c6f` (`git log --ancestry-path`), and I drove his cell **in a scratch worktree at
his rev** — `git worktree add --detach .testdata/r467-cf cc41fa53`, removed afterwards, `git worktree
list` confirms it is gone — giving the identical `last=464 consecutive=0`. Never edited his tree.
`T2` reds **as good news** (its leg asserts the run is `> 0`); that is his leg to re-aim and it is
routed to him, not taken.

## ~11:0x PT — the pin bump reddened four independent detectors

Adding two arms moved `sweep-probes.mjs`'s `expect` pin 17 → 19. Bumping the pin alone left the
entry's `why` still quoting the old self-equal count, which `entryProblems` compares against
`expect`. Sweep 2: `40 of 43 green, 3 red, 1 census problem` — the census schema pass plus
`probe-round261`, `probe-round269` and `probe-round298`, four independent detectors on one line of
stale prose. **My first repair re-tripped them**: I rewrote the sentence to explain the bump and
quoted the old figure inside the explanation, so the regex found it again. Driven, not reasoned —
`entryProblems` over the live `SWEPT` list reads `43 entries, 0 problems` only once the self-equal
count was removed rather than described.

Also found by scanning rather than by reading: **six zero-width spaces of my own**, used to stop a
`*/` inside a block comment from closing it, two of them in sources the type programs read. A ZWSP is
invisible in every diff view. `zw-scan.mjs` found them, `zw-fix.mjs` replaced them with a visible
`*\/`, and the scan is the gate at `VERDICT/1 ok files=3 zeroWidthLines=0`. The grader was re-driven
after and still reads `VERDICT/1 ok legs=6 red=[]` with `G4` byte-identical.

## Gate

* `npm run typecheck` → exit 0, 0 `error TS` (`gate-typecheck.out`)
* `npm test` → 140 server files passed · 26 client passed / 13 skipped · `census PASSED`
  (`gate-npmtest.out`)
* `probe-round307` → **All 19 regression checks passed**, 6 measurements
  (`drive08-probe-clean-final.out`)
* `node scripts/sweep-probes.mjs` — full driving sweep, result recorded below rather than assumed
  from the census (the census drives zero probes and could not have seen this red at all)

## Sweep result — four drives, and the third one's red was my own commit

```
-1  SWEEP FAILED — 42 of 43 green, 1 red  (probe-round307: the C4 red Argus routed)
-2  SWEEP FAILED — 40 of 43 green, 3 red, 1 census problem  (the pin bump's why/expect drift)
-3  SWEEP FAILED — 42 of 43 green, 1 red  (probe-round264 — my own git commit, see below)
-4  SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did
    not finish), 0 census problem(s), 110 deferred
```

`-4` is the authoritative drive: the index was untouched from its start to its finish. `npm test`
re-run afterwards and recorded: 140 server files passed, 26 client passed / 13 skipped,
`census PASSED` (`gate-npmtest-final.out`).

**Sweep 3's one red.** `probe-round264` RED at `1 of 14`; driven standalone immediately afterwards,
`All 14 regression checks passed`. The variable was `git add` + `git commit` landing mid-sweep.
`scripts/lib/tree-fingerprint.mts`'s `fingerprint` hashes `git status --porcelain -- <pathspec>` and
`git diff HEAD -- <pathspec>`, both keyed on HEAD and the index rather than on content, so a commit
moves the bracket while writing nothing. Driven in a scratch git repo rather than argued
(`fp-commit-moves.mts`, `VERDICT/1 ok legs=5 red=[]`). **My first reason for it was wrong:** I
predicted a `docs/`-only commit would move a `scripts/` fingerprint, and `F3` refuted it — both
queries are path-filtered. Re-aimed rather than loosened; the rule is now exact and `6190a0dd`
(which committed two files under `scripts/`) is the instance. Routed to Argus, unrepaired: 37 probe
files reference that module, the class fires only under concurrency, and it is invisible to the
standalone re-drive that is everyone's first move.

## Mail handled

Both inbound memos read in full and answered in this fire. Reply:
`docs/mail/daedalus-to-argus-theseus-cc-xian-janus-calliope-iris-your-c4-red-is-repaired-and-two-cripples-leave-my-own-new-key-green-2026-10-28.md`.

**Not moved to `docs/mail/read/`**, deliberately: by the close-discipline a thread with an open
action item stays visible, and this one now has two — `T2`'s re-aim routed to Theseus, and the
`tree-fingerprint` concurrency class routed to Argus. Theseus's memo is also addressed to Argus, so
closing it is not this seat's unilateral call.

**Drain:** checkpoint is my own last commit before this fire, `c22ad290` (10/27 STOP). Everything
unblocked that this fire surfaced was done in it: the C4 repair, its grading, the pin bump and its
four-detector consequence, the zero-width defect, the stop-condition correction with the
counterfactual at Theseus's own rev, and the `tree-fingerprint` mechanism. Deferred, each with a
named blocker: driving any of Theseus's 19 deferred probes (two are live-HTTP/port probes and need a
window where a leaked server costs nothing); repairing `tree-fingerprint`'s bracket (what it should
mean is a call three seats depend on — routed, not parked); annotating `sweep-probes.mjs`'s 13
ungradeable signatures (unclaimed, **no** blocker — not done this fire only because the fire's own
budget went to the routed red, and it is named as unclaimed in both the memo and COORDINATION).

## Wrap verification

**Step 1 — commits on `origin/main`** (`git fetch origin && git log origin/main --format='%h %an %s' -3`):

```
8e212c20 Daedalus (Klatch) coord+log+mail: 10/28 START fire — C4 repaired and graded, sweep green at 43/43, three defects of my own
6190a0dd Daedalus (Klatch) round467: re-key probe-round307 C4 per-signature and style-blind, graded by 5 cripples
8fe017b4 Argus (Klatch) coord+log: 10/28 START fire — no-op on product, mail thread confirmed closed with nothing routed, gate byte-identical
```

Both of mine are present, author-checked with `%an`.

**Step 2 — deliverables read off the pushed rev**, not off my worktree
(`git ls-tree -r --name-only origin/main -- …`): the log, the reply memo and all **43** files of
`docs/research/unit-307c4-rekey-2026-10-28/` are present on `origin/main`, including `grade-c4.mjs`,
`fp-commit-moves.mts`, `zw-scan.mjs`, `zw-fix.mjs`, the twelve recorded drives, `stop-condition.out`,
`stop-condition-at-cc41fa53.out` and all four sweep recordings. The two source changes
(`scripts/probe-round307-….mts`, `scripts/sweep-probes.mjs`) landed in `6190a0dd`.

**Step 3 — this log is pushed last**, after Steps 1 and 2 were run and their output pasted above.

Nothing is claimed as delivered beyond this: the wrapper owns delivery and logs its own outcome.

---

## 13:17 PT — Session resumed (WORK fire)

Model: Opus 5. Same worktree, same branch. Filename kept as-is: the convention adopted in
`e5ddfde2` this morning is one file per agent per calendar day and migration is forward-only, so
this fire appends to the day's existing file rather than minting a disconnected second one.

### Briefing

* `date` → `2026-10-28 13:17 PDT`. `git status` clean; `git rev-list --left-right --count
  origin/main...HEAD` → `0 0`, so the wrapper's pre-fire sync is confirmed rather than assumed.
* `ls -la docs/mail/` → one new memo addressed to me, timestamped 13:17, i.e. it arrived with this
  fire's own sync: Theseus's `…your-t2-item-is-taken-and-the-credit-that-moved-your-figure-is-one-of-three…`.
  **Read and acted on in the same turn, not queued.** Argus's 10-27 `C4` memo was already answered
  by my 09:44 reply this morning; nothing else addressed to me is open.

### The routed item

His §8: *"Yours, and not mine to settle: which key the stop condition uses… the decision changes
whether the track should stop, which is yours and xian's."*

### What I did

1. **Reproduced his figures before touching anything.** Drove his `grade-the-credit-key.mjs`
   unmodified, in my tree, at my own HEAD `c7bfbd6c`. `C3` came out byte-for-byte as his memo
   quotes it — dir key `consecutive=0 fired=false` vs self-attested `consecutive=10 fired=true`;
   `.err` 0 bytes. Recorded as `drive1.his-grader-at-my-head.out`.
2. **Recon first, decision second.** Before picking a key I read what the credits are *made of*
   (edge enumeration written independently of his, so a cross-check would not be my own copy of his
   key agreeing with him). My going-in hypothesis — that no credit touches `packages/` at all —
   was **wrong**, and measuring it instead of asserting it is what produced the better finding.
3. **Built and graded the surface predicate.** `grade-the-surface-predicate.mjs`: 8 graded legs,
   3 `[MEAS]`, 6 cripples, 4 predictions registered in source before the first drive. The clean
   drive matched the hand-derived map exactly: `red=[D4a,D5] refused=[] refuted=[]`, all 4 landing.
4. **Widened the window** (`recon2`) to answer the obvious objection — that the filed 15-day window
   had simply cut off the product-curing rounds. It had not.

### Findings

* **The 3 × 2 table: 5 of 6 cells say FIRED.** The one that says continue is `AS-FILED × dir` — the
  cell my own standing line had been publishing — and it says continue only because my `87270c6f`
  credited round 464 for curing two `scripts/lib/*.mjs`.
* **His key is adopted, and `D4b` shows it is the secondary axis:** the two keys disagree *only*
  under `AS-FILED`. Under either strict reading they agree exactly.
* **The free variable under both keys is mine.** I filed `^(packages|scripts)/`, conflating "has a
  standing typecheck gate" (a CI property) with "is product" (the property the condition needs),
  while the condition's own second clause names the stopping case as "round-track instruments
  themselves" — and `scripts/` is where this track's instruments live, 213 files at HEAD.
* Of 9 credit edges, exactly **one** carries any `packages/` file (round 417 via `e2759907`,
  subject "models+intel", no round label), and **3 of the 4** `packages/` files in the window are
  `roundNNN-*.test.ts` — round-track instruments inside the product tree.
* **The last round that cured product source is round 292** (Iris, `3c66489d`, 2026-09-29), agreed
  by both windows that can answer. By round number the run is **172 against N=5**. The filed 15-day
  window holds **zero** round-labelled product-source commits and cannot answer its own question.
* **`consecutive` is a floor in both our cells** — it counts round *directories* above the last
  credited round, and those dirs span only 365..464, so below 365 it saturates at 91.

### Four defects of my own

Two were caught by hand-deriving every cripple's verdict map *before* driving it:

1. `D6` conjoined a refused classification into `got !== want`, so `classifier-refuses` would have
   published a **false RED** where the honest answer is unmeasurable — in the one leg whose whole
   job is catching a broken classifier.
2. The predictions passed `String(null)` — the truthy-looking string `"null"` — and would have
   published a **REFUTATION** over a measurement that never happened.
3. `D4b` printed `[MEAS]` without being in `MEAS_IDS`, so a deliberate `null` would have been
   published as a refusal in the verdict line. `D8` now guards the list in both directions, keyed
   on the declared id list rather than leg text (his `M0` reasoning).
4. Found only by driving: recon2's gate asserted "the two wider windows agree" while its predicate
   read all three, so a window with *nothing to report* folded in as a **disagreement**. `drive4`
   is kept as the defective drive and `drive5` as the repair — and the split is what turned the
   silent window into the §4 finding.

### Two prediction-map misses, published rather than matched

* `kp-drop-product`: I derived `Q4` as REFUTED against **pre-repair** code; defect 2's fix
  correctly makes it PREFUSE. The leg is right and my prediction was written against code I had
  already changed. A hand-derived map has to be re-derived after any repair to what it grades.
* `no-edges`: I derived the red/refused columns and never stated the prediction column at all,
  where `Q1` refutes correctly.

### Decided, and not decided

**Decided (mine, as the condition's author):** the surface predicate is repaired to "a file under
`packages/` not under `__tests__/`"; `scripts/` leaves the gate; Theseus's self-attested key is
adopted; the standing line carries both axes and the floor note from this fire on.

**Not decided — xian's:** whether the track stops and re-scopes. My own condition, read honestly,
says it should, by 172 rounds against an N of 5. I did not make that call, and surfaced it in §4 of
the memo rather than parking it. Stated fairly in the memo, COORDINATION and the unit README: the
work since round 292 hardened instruments, added `__tests__/roundNNN-*.test.ts` coverage and built
typecheck gates — the condition says the track stopped curing the *product*, not that the work was
worthless.

### Wrap verification

**Step 1 — commits on `origin/main`** (`git log origin/main --oneline -4`, run at 13:32 PDT):

```
9b62fcf8 mail(Daedalus → Theseus, xian; cc Janus/Argus/Calliope/Iris): key adopted, the free variable under both keys is mine, and the condition fired ~170 rounds ago
22945c5a unit-464t2-keychoice: the surface predicate is a second free variable, and it is mine — 5 of 6 cells say FIRED
5b7b8449 unit-464t2-keychoice: recon — of 9 credit edges exactly 1 carries a packages/ file, and its commit's subject is not round work
c7bfbd6c log: note mediajunkie mail commit's borrowed git identity (Pard's, not mine) and hook flag
```

Three of those are this fire's; `c7bfbd6c` is this morning's. Step 2 and Step 3 are recorded below,
after this log and the COORDINATION update land.

**Not run this fire:** `npm test`, `npm run typecheck`, the sweep. `git diff --stat HEAD --
packages/ scripts/` and `git status --porcelain -- packages/ scripts/` both **empty** (verified at
13:3x), so every commit this fire made is `docs/`-only.

**Step 2 — deliverables read off the pushed rev**, not off my worktree. `git ls-tree -r
--name-only origin/main -- docs/research/unit-464t2-keychoice-2026-10-28/` → **26** files;
the memo, this log and `docs/COORDINATION.md` all PRESENT on `origin/main`. All **11** `.err`
files read with `git show origin/main:<path>` — **0 non-empty**, checked on the pushed rev rather
than in the worktree. `git rev-list --left-right --count origin/main...HEAD` → `0 0`;
`git status --porcelain` empty.

**Step 2 caught a real miss.** The unit `README.md` was written *after* the unit's code commit and
was the one deliverable **not** on `origin/main` when I first ran this check — it would have been a
"done" claim over an absent file. Pushed as `c76f7d98` and re-verified. This is exactly what the
step is for, and it only worked because the check reads the pushed rev instead of the worktree.

Five commits on `origin/main`, all author-checked with `%an`:

```
c76f7d98 Daedalus (Klatch) unit-464t2-keychoice: README — the 3x2 table, the regime change dated to round 292, and the four defects of my own
49baee40 Daedalus (Klatch) coord+log: 10/28 WORK fire — the standing line now carries BOTH axes, and the condition fired ~170 rounds ago
9b62fcf8 Daedalus (Klatch) mail(Daedalus → Theseus, xian; cc Janus/Argus/Calliope/Iris): key adopted, the free variable under both keys is mine, and the condition fired ~170 rounds ago
22945c5a Daedalus (Klatch) unit-464t2-keychoice: the surface predicate is a second free variable, and it is mine — 5 of 6 cells say FIRED
5b7b8449 Daedalus (Klatch) unit-464t2-keychoice: recon — of 9 credit edges exactly 1 carries a packages/ file, and its commit's subject is not round work
```

**Step 3 — this log is pushed last.** Nothing is claimed as delivered beyond the above: the wrapper
owns delivery and logs its own outcome.

---

## 17:2x PT — Session resumed (STOP fire)

**Briefing.** Pulled; local `claude/daedalus-cycle` was already at `origin/main` `4b4db618`
(the wrapper synced immediately before the fire). Read `docs/COORDINATION.md` and
`ls docs/mail/` — **two memos dated today at 17:17, both addressed to me:**

* Argus, `~14:0x`: the `tree-fingerprint.mts` false red I routed to him is fixed by
  re-keying on file content instead of git's index/HEAD bookkeeping. **Nothing routed back.**
* Theseus, `~14:47–15:2x` (WORK fire): my `292` is right for a better reason than my cell
  gives, and my run figure is keyed on a population the track stopped filing into. **One
  decision routed to me (§7): whether `recon2`'s third key is the one the condition should
  use.**

Both read immediately, both acted on in this fire. Per STOP procedure
(`docs/operations/duty-cycle-klatch-v0.2.md`): final sync, closing log entry, question-box
check.

### Verified his figures in my own tree before writing anything

Not taken from the memo — read from git here:

* `e2759907` — mine, 10-19 09:31, subject `models+intel: add the three 5.5 models…`, **no
  round label**; `--diff-filter=A` confirms it creates all five files of
  `round417-instruments/`, `--stat -- packages/` confirms `packages/shared/src/types.ts`.
  His §1 is exact: clause (b) credits 417, the subject does not.
* `6190a0dd` — mine, 10-28 09:36, `round467: …`. **Zero paths at `origin/main` contain
  `467`.** His §4 is exact.
* Round 465 — `ff0cae98` and `c03773ed`, both subjects containing *"no Round 465"*. His
  self-reported defect is real.

### The finding: the denominator is dead, not just incomplete

He framed it as round 467 lacking a dir. `git ls-tree -d docs/research/` reads worse than
that: `round464-instruments` is the **last** round dir and **five** `unit-*` dirs follow it.
So I built the unit around the denominator rather than the key.

Unit `docs/research/unit-464t2-population-2026-10-28/` — 1 grader, 13 legs, 8 `[MEAS]`,
6 cripples, 5 pre-registered predictions, **13 recorded drives, every `.err` 0 bytes**.
Predictions and hand-derived cripple maps were **committed before the first drive**
(`ca39949c`).

| measurement | value |
|---|---|
| dir population | 91 dirs, max 464, created 2026-10-27T10:52:54-07:00 by `725f97ee` |
| round dirs created after that instant | **0** |
| `unit-*` dirs created after that instant | **6 of 6** — every unit dir in the repo |
| attested above 292, raw / denial-filtered | 175 / **174**, removed exactly `[465]` |
| highest attested round | **467** |
| growth test `8fe017b4` → HEAD (contains round 467) | dir **91 → 91**, attested **174 → 175** |
| standing cell, dir key (`M8`) | `last=464 consecutive=0` |

All five predictions landed exactly on the first drive. The growth test is the leg that
settles it: a measure that does not move when the thing it measures happens is not a
conservative floor, it is dead.

### The consequence, and it is a defect in the cell I quote every fire

`round464-instruments/grade-the-stop-condition.mjs` publishes `last=464`, and 464 **is**
`maxDir`, so `consecutive=0` and `T2` (`consecutive < N_PROPOSED`) is green — and since no
round dir above 464 will be created, **green for every future round whatever the track
does.** The cell this seat has pointed xian at every fire is structurally incapable of
reporting that the stop condition fired. Its own line 215 states the assumption that died:
`// Every round that EXISTS as a directory, so "consecutive rounds" counts real rounds.`
True when written; `unit-*` ended it on 10-27 at 20:01.

Read off the cell by driving it (`F3` after repair), not inferred from its source.

### Two defects of my own — and the clean green was hiding both

`drive1` was `VERDICT/0`, 13 legs, all green, all five predictions exact. It was also hiding
two legs that **could not fail**. Only `fake-new-round-dir` missing its hand-derived map
exposed them (predicted `[F1,F3,P1]`, actual `[F2]`):

1. **`F1` could not fire** — keyed on "created after the *highest* round dir", a new dir
   becomes the reference point instead of reddening the leg (`M4` shifted to the synthetic,
   `M5` stayed 0). It would have printed `TERMINATED` on the day termination ended. **The
   unit reproduced, in its own instrument, the exact defect it was built to expose.**
   Repaired to a pinned literal instant.
2. **`F3` was a tautology** — `dirsNow` is sorted ascending and `maxDir` is its last
   element, so `count(dirs > maxDir) === 0` for every possible input. It asserted nothing,
   and the claim in its own `why` string was never tested. Repaired to drive the standing
   cell and read the printed figure — which is the only reason §4 of the memo exists.

Third, smaller, and the generalisable one: **`F2`'s red under that cripple was incidental**,
not the aimed-at failure (the synthetic's date postdated every `unit-*` dir). A cripple that
reddens the wrong leg reads as working if you only check that *something* went red. Checking
the member list against the hand map caught it; a verdict-level check would have scored that
cripple as separating.

Maps **re-derived** against the repaired cell and committed before the re-drives
(`c5c147d6`) — a map derived against a pre-repair subject goes stale the moment the subject
is fixed. Pre-repair **4 of 5** matched; post-repair **6 of 6**, with a sixth cripple
(`standing-last-mismatch`) added because nothing in the original five could reach `F3`.

Two method notes: `G2` cross-checks by **driving Theseus's cell as a child process**
(`his=91 mine=91`) rather than re-typing his reader; `drive.mjs` is a byte-identical copy of
his driver (blob `c8fc0749`, verified with `git hash-object` on both paths), copied into my
unit rather than invoked in place so my drives cannot re-stamp his recordings.

### Decided this fire

**Mine, as the condition's author (§7 answered):** cure-ness is the definition of the `last`
term; but no published figure rests on his 2-of-19 cure regex alone — the measurement is the
adopted attestation key **and** a cure predicate, cross-checked against the label-only key,
**refusing when they disagree**. They agree at 292 today. For the one-member candidate set
above 292, the two independent hand reads of `e2759907` are the evidence, not either regex.
`recon2`'s third key is a proxy that agrees today, not the mechanism.

**Also decided:** the published figure is **174 attested rounds above 292**, denial-filtered;
`91` is demoted from "floor" to frozen constant; `~170`/`172` are superseded and kept in
`COORDINATION` only so the correction has something to point at. The standing line now
carries a **third axis — the population**.

**Not decided — xian's, unchanged:** whether the track stops and re-scopes. `fired` is true
under every reading either seat has built; what moved is the magnitude and the fact that the
instrument reporting it could not have reported otherwise.

### Mail handled

* **Argus** — acked in §0 of the reply; nothing routed back either way; thread closed and
  `git mv`'d to `docs/mail/read/` per close-discipline.
* **Theseus** — replied in full:
  `docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-the-key-was-never-the-live-defect-the-denominator-was-and-my-standing-cell-could-not-have-told-us-2026-10-28.md`,
  committed separately and pushed to `main` as `06fbfff0` before the rest of the fire's work,
  per the worktree mail rule. **Left in `docs/mail/`** rather than moved: the thread still
  carries an open action item, and it is mine (the standing-cell re-key).

### Mine, open, no blocker

Re-key the standing cell's `consecutive` onto the denial-filtered attested population so its
`T2` leg can fire again. **Deliberately not done this fire** — it edits the cell whose figure
is quoted in `COORDINATION.md` and deserves its own pre-registered map, not a tail-end edit
in a STOP fire. First thing next fire.

### Not run this fire

`npm test`, `npm run typecheck`, the sweep. `git status --porcelain -- packages/ scripts/`
**empty** — every commit this fire is `docs/`-only, so none of them reaches those gates.

### Question-box check (STOP step 4)

Considered, and a no this fire — but a considered one. The candidate I turned over: this
fire's finding is that an instrument can be *structurally* unable to deliver bad news while
reporting green, and that I only found it because a cripple missed its predicted map rather
than because anything failed. That is a question about how xian reads our green reports, and
it is close to question-box shape. I'm holding it because it is really a *work* question —
it belongs in the standing-cell re-key and in the reply memo, both of which xian is cc'd on
— and filing it as curiosity would be routing live work through the newsletter. Nothing
filed to `dispatch/mail/`.

### Wrap verification

**Step 1 — commits on `origin/main`** (`git log origin/main --format='%h %an %s'`, run at
~18:0x PT), recorded below after the final push.

**Step 2 — each deliverable read off the pushed rev**, not the worktree.

**Step 3 — this log pushed last.**
