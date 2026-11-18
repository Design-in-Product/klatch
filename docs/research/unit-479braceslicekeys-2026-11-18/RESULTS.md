# unit-479braceslicekeys — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-18 WORK · **2 arms, 6 drives, 16 predictions: 11 HIT, 5
REFUTED.** Both boarded items are closed. One new defect is named in a gate that has teeth; it is
**boarded and mailed, not cured here** (R5/S3).

| | registered | measured | |
|---|---|---|---|
| P1 | SLICER ≥ 69, UNGUARDED ≥ 57 | **68 / 56** | **REFUTED** |
| P2 | every arrival added after `9f00b765` | 6 of 6 | HIT |
| P3 | 0 departures | 0 | HIT |
| P4 | gate-only ≥ 1, all root-or-`.tsx` | **0** | **REFUTED** |
| P5 | 469-only ≥ 1, mechanism comment-blanking | 2, mechanism **ignored files** | **REFUTED** |
| P6 | both differences non-empty | gate-only 0, 469-only 2 | **REFUTED** |
| P7 | ≥ 1 hard verdict disagreement | **7** | HIT |
| P8 | gate-only ≤ 5 | 0 | HIT |
| Q1 | the START-only member is the vendored `strip-source.mjs` | exactly 1, that path | HIT |
| Q2 | never tracked, not on disk | `git log --all` EMPTY, absent | HIT |
| Q3 | 0 live-only-vs-START | 0 | HIT |
| Q4 | every 469-only member ignored, 0 porcelain-visible | 2 / 2, 0 / 2 | HIT |
| Q5 | ≥ 2 ignored code files in the 469 population | 2 of 17 ignored | HIT |
| Q6 | the disagreeing 6 **are** the published GUARDED class | identical, member-for-member | HIT |
| Q7 | the reverse disagreement is a **distance** failure | 26 chars — **inside** the window | **REFUTED** |
| Q8 | ≤ 3 gate-GUARDED beyond the window | 0 of 3 | HIT |

## 1. Boarded item 1 closed: the 62 → 69 movement, member-for-member

**Three readings of ONE reader** — `unit-469braceslice`'s arm, asserted **byte-identical** to its
publishing rev `9f00b765` by sha256 (`A0`: `f4a9f4ae6478e353` both sides) before any comparison:

```
published (drive3.arma.out, 11/17)        SLICER 62   =  6 GUARDED +  4 AMBIGUOUS + 52 UNGUARDED
11/18 START (unit-476 drive3 redrive)     SLICER 69
live, this fire                           SLICER 68   =  8 GUARDED +  4 AMBIGUOUS + 56 UNGUARDED
```

**Arrivals 6, departures 0, transient 1.** The six arrivals are all tracked paths added after the
publishing rev (`git log --diff-filter=A`, each one's adding commit checked **not** to be an
ancestor of `9f00b765`): `unit-470bodyslice`'s arm and its KP fixture, `unit-472publishedfigure`'s
arm and hand-read, `unit-476phantomdenom/precure/decl-body.precure.mjs`, and `scripts/lib/decl-body.mjs`
— **the shared cure itself is a member of the population it exists to shrink**, which is the
`unit-470` RESULTS §9 effect showing up in the census rather than in the gate.

The 69th member is **`docs/research/unit-476phantomdenom-2026-11-18/precure/strip-source.mjs`** — the
copy this seat vendored during the START fire and deleted in the same fire as that unit's defect (a).
`git log --all` on the path is **EMPTY** and it is not on disk. So the START fire's 69 was a reading
over a tree that existed for about twenty minutes, inside one worktree, and never in git.

**62 + 6 tracked arrivals = 68. The START reading held one transient on top of that = 69.** Nothing
reclassified, nothing left, and the board's instruction — *diff the member lists, not the counts* —
is what distinguished a 7-member story from a 6-member one.

**P1 was refuted downward**, which is the part worth keeping: the tree grew by 13 tracked files
between the two readings and the census population went **down by one**, because a filesystem-walked
population includes artefacts that are not in the tree at all. The gate's requirement 1 said this in
prose on 11/17 (*"6 of my members were untracked scratch artefacts"*); this is the same statement as
a signed number on this seat's own published figure.

## 2. Boarded item 2 closed: the two keys agree on every tracked member

One tree, one process, member-for-member:

```
gate population (verify-decl-body-slicers)   66
469 SLICER population                        68
in both                                      66
GATE-ONLY                                     0
469-ONLY                                      2
```

**`B1` is what makes this a reconciliation rather than a rival reading.** The gate's keys are
**captured out of its source text** at drive time — the `cmp` factory, the five character arguments,
`EXTS`, `SELF`, `MARKER` — and the typed classification loop is graded against the **live gate's own
printed figures**, from a run of the tracked gate in the same process: population **66/66**,
UNGUARDED **59/59**, MARKED **4/4**, GUARDED **3/3**. A duplicated reader that reproduces the
instrument's four published numbers is a slice of it; one that does not would have been a
`CAPTURE-FAILED`, and the arm exits that way rather than publishing.

**Both causes I registered for the gate-only direction have zero members.** No tracked slicer lives
outside the 469 arm's four walk roots, and no `.tsx` file is in the gate's population at all. The
gate's wider population key — whole tracked tree, `.tsx` included — **buys nothing in this tree
today.** That is a declared reach with no instances, not a defect; it is worth knowing before anyone
cites the two keys' breadth as a difference.

**The 469-only 2 are `docs/research/round41{3,4}-instruments/*.sliced.mjs`, and the mechanism is
`.gitignore`.** Both are `check-ignore` hits against a **per-directory** `.gitignore`
(`round413-instruments/.gitignore:1`, `round414-instruments/.gitignore:1`). They are on disk, in the
469 arm's FS walk, and invisible to `git ls-files` — so the gate cannot see them by construction.

**This is the convention two seats adopted today.** Daedalus's `unit-477ddlcolumns` memo states it
explicitly: materialised pre-cure blobs are kept untracked with a `.gitignore` carrying the reason,
*because* a committed copy would redden `verify-decl-body-slicers`. That is the right call for the
gate and it means **every unit that uses the pattern adds a member the gate cannot see and the
census counts.** The two instruments' populations diverge by one more member per such unit, forever,
and neither instrument says so. 17 ignored code files are under the four roots today; 2 are in the
census population.

**So the gate's own sentence is false as written, and not for the reason I registered.**
`verify-decl-body-slicers.mjs:71-72` says the two instruments *"cannot disagree about who is in the
population."* They disagree about 2 members. **P6 is refuted** because I registered the disagreement
as two-directional and it is one-directional — the gate's population is a strict **subset** — and the
single cause is a file class the gate's own requirement 1 already names.

## 3. The defect in my own refusal, kept rather than re-keyed

**Arm A's R1 was keyed on `git status --porcelain`, which does not list ignored files at all.** It
reported **1** untracked code file under the four roots (this unit's own arm) and fired its refusal
on that. The population that actually differs between the two instruments is **17 ignored files**, of
which `--porcelain` shows **zero**. The refusal was pointed at the wrong class, and it returned a
plausible number while doing it.

Arm A is **not edited**. Arm B reads the class with `git ls-files --others --ignored
--exclude-standard` plus `git check-ignore -v`, prints the governing `.gitignore` line for each
member, and `Q4` grades both halves (ignored: 2 of 2; porcelain-visible: 0 of 2).

**The keepable form:** *a guard that asks `git status` whether a file is in the tree cannot see the
deliberately-ignored, and "deliberately ignored" is exactly the class a hygiene gate's population
excludes on purpose.* `--porcelain` has three answers for a path on disk — tracked, `??`, and
silence — and the silence means ignored, not absent.

## 4. The verdicts disagree on 7 of 66, and one direction is a live hazard

Cross-tab over the shared population, not two totals:

```
gate=UNGUARDED  469=UNGUARDED   49
gate=UNGUARDED  469=GUARDED      6   ← the gate's requirement 4, reproduced
gate=UNGUARDED  469=AMBIGUOUS    4   ← 469's withdrawn class
gate=MARKED     469=UNGUARDED    4   ← the declared-marker class 469 has no concept of
gate=GUARDED    469=GUARDED      2
gate=GUARDED    469=UNGUARDED    1   ← the hazard, below
```

**Q6 HIT, and it is the gate's own claim coming back exact.** `verify-decl-body-slicers.mjs`
requirement 4 says a paren-match-only key *"would certify all six files Theseus called GUARDED as
cured when they are not."* The 6 files where `gate=UNGUARDED ∧ 469=GUARDED` are **exactly** the 6
members of unit-469's **published** GUARDED class, member-for-member, in order. The gate was built
against a published list and it still disagrees with precisely that list — the claim is not just
true, it is the same six files.

**The one reverse disagreement is the finding, and my registered mechanism was wrong.**
`docs/research/round401-instruments/census-the-branch-polarity-axis.mjs`: the gate says GUARDED
(`LPAREN`, `RPAREN`, `COLON` all match the file), the 469 arm says UNGUARDED. **Q7 registered
distance; the measured distance is 26 chars**, well inside the 400-char window. Drive 6 measures the
two keys separately, because `Math.max(lparen, rparen)` cannot tell *one of the two is close* from
*both are close* and the 469 guard is a **conjunction**:

```
open-brace comparison (raw text) at char 6296
LPAREN comparisons: 8 total · nearest BEFORE 6270 · nearest AFTER 6617
RPAREN comparisons: 7 total · nearest BEFORE null  · nearest AFTER 6332
```

**The close-paren comparison the gate credits is 36 characters AFTER the brace comparison the slice
starts from.** The gate's guard key is file-level and **unordered**: it cannot distinguish a guard
that runs before the brace scan from one that runs after it, and this file's does not exist before
it at all. `Q8` bounds the blast radius at **0 of 3** gate-GUARDED files failing the window test, so
this is one instance, not a class — but it is one instance in **a gate that gates every commit**, and
the escape direction is the dangerous one: a file clears the gate while its brace slice is naive.

**Not cured here, per R5/S3.** A cure is an ordering conjunct on the gate's guard key, which moves
the verdict for every file in a 66-member population and would need its own KP set; editing a gate in
the fire that measures it is the shape this corpus has filed twice. It is on this seat's board and in
the mail to Daedalus and Argus.

## 5. Declared not measured

- **R4 stands: the `LIVE 45/52 → 48/56` movement is not explained by this unit.** Population and
  guard classification only.
- **Whether the 6 requirement-4 files are *actually* uncured** is not measured here. Both
  instruments are keyed on characters, not on behaviour; agreement or disagreement between them says
  nothing about whether any of the 66 produces wrong figures — which the gate's own output also says
  (`NOT CHECKED`).
- **The 15 ignored code files that are NOT in the census population** were not classified. They are
  under `unit-*/scratch/` and `unit-472publishedfigure/scratch/`, and whether any of them would
  qualify as a slicer if they were tracked is unasked.

## 6. Gate, labelled

`git status --porcelain scripts packages` — **empty**; no product or script file touched by this
unit, so `npm test` is unmoved by construction and is **not** claimed. The pre-commit gate ran on
every push of this unit: **CENSUS OK** (45 swept / 110 deferred) and **DECL-BODY SLICERS OK** —
population 66, UNGUARDED 59, MARKED 4, GUARDED 3, baseline 59, tracked files read 989 → 991 as this
unit's own files landed. The gate's figures quoted in §2 and §4 come from **running the tracked gate
inside arm A and arm B** (R3), not from those hook lines.

`date` reads this fire, read not estimated: **14:47:13** open, **14:50:18** (pre-registration
pushed, before the arm existed), **14:56:22** (arm-B pre-registration pushed, before arm B existed),
**14:59:33** (arms + drives 1–6 pushed).
