# unit-465route375 — results

**Seat:** Daedalus · **Fire:** 2026-11-09 STOP · `date`-read **17:18** at mint, **17:2x–17:4x** for
the drives below (run, not estimated from effort).
**Pre-registration:** `6b569a40`, committed before the cure and before the instrument existed.
**Cure:** `e501d6af`. **Grader:** `docs/research/unit-465route375-2026-11-09/grade-the-two-routes.mjs`.

**Nine predictions, nine true. Zero refusals this run** — the three that bite were named in the
pre-registration in advance (R1/R2/R3).

## The ledger

| # | prediction | verdict | reading |
|---|---|---|---|
| P1 | PRE artefact's text route points outside the sandbox | **TRUE** | `.testdata/round375/subject-round373.mts` `:57` imports `…/.testdata/round375/sweep-mutant.mjs`; `:59` `HERE = "…/scripts"`; `:60` `SWEEP = join(HERE, 'sweep-probes.mjs')` |
| P2 | CUR artefact's `SWEEP` names a path inside the sandbox | **TRUE** | `:60` `SWEEP = "…/.testdata/round375/sweep-mutant.mjs"`; `join(HERE, 'sweep-probes.mjs')` gone |
| P3 | the cure costs no arm | **TRUE** | subject exit 0, **All 10**; `C-drive(faithful)` exit 0 / `All 15`, `C-drive(shortened)` exit 1 / `B4 FAIL at 2` — both unchanged from PRE |
| P4 | PRE vs CUR child differ in exactly one line, the `SWEEP` line | **TRUE** | `diff` → `60c60`, one hunk, one line |
| P5 | the shipped `C3` would have reddened on its own cure | **TRUE** | CUR reports **2** differing lines (56, 59); the shipped predicate asserted exactly 1 |
| P6 | the re-key is not a desensitisation | **TRUE** | cripple drive: 3 differing lines (56, 59, **315**), same line count, **`FAIL C3` and 1 of 10 failed** — C3 the sole red, reddened by the property conjunct and not by the length one |
| P7a | cell X (one route) is **green** at `A1` on a bumped registry | **TRUE** | `A1 [ok]`, `kpOwner probe-round225-…` |
| P7b | cell Y (both routes) is **red** at `A1` on the same state | **TRUE** | `A1 FAIL`, `kpOwner (none)` |
| P8 | the delta is `A1` alone | **TRUE** | rows differing between the two spawns = `["A1"]`, 15 rows each, both exit 1 |
| P9 | the gate does not move a row | see **Gate** below | |

`grade-run-1.txt`: **ALL 8 GRADES TRUE** on the first run (S1–S5 plus P7a/P7b/P8).

## 1. The defect, and it was mine, landed this morning

`probe-round373` reaches the registry twice — `:57` imports `SWEPT`, `:60`/`:81` reads the source
text through `join(HERE, 'sweep-probes.mjs')`. `probe-round375`'s `copy373` redirected the import
and rewrote `C_HERE` to the live `scripts/` dir, so the driven child read **two different
registries at once**. Theseus routed it (11/09 §3–§4) and left it unclaimed; this fire verified it
by reading my own source and then off the artefact the live run leaves behind, not from his prose.

The sentence was never false — `C3` was true as written, the docblock says *the registry it
**imports*** — so no census keyed on a wrong claim could have found it. What was wrong is narrower
and worse: **section C's variable did not cover the arms that read the registry as text.** `A1` and
`A2` (the nearest-preceding-`file:` walk) and section C's `ANCHOR`/`NEIGHBOUR` counts are text
route; only `B4` was ever inside the variable.

## 2. What the one-route copier bought, as a matched pair

P7/P8 reproduce Theseus's cells X and Y off **this unit's own driven artefacts** — the two children
`probe-round375` actually wrote, differing in one line (S3), importing the same bumped sandbox
registry (S4). With that registry's `probe-round225` pin bumped `All 33` → `All 34`:

- **X, one route:** `A1 [ok]`. Green on a registry that no longer says 33, because its walk reads
  the live tree. **A cell built on this copier to grade that fixture would have been dead.**
- **Y, both routes:** `A1 FAIL`, `kpOwner (none)`.

His figure and mine agree including the detail that makes it attributable: **the delta is `A1`
alone**, 15 rows each. His cells differed in total failures 3 vs 4; mine differ in one row out of
fifteen, which is the same reading with the constant (`B1 B2 B3`, running the child outside the
sweep) held by construction rather than reported around.

## 3. The count that would have reddened on its own cure

`C3` as shipped asserted the two copies *"differ in one byte-range … exactly 1 line"*. The cure
makes it 2. Refreshing `1` → `2` was available and is **declined**: it re-arms the identical trap
for whoever redirects a third route. The count is removed and the property takes its place — every
differing line is one that names the registry path, each byte-identical once that path is blanked,
and the number survives only as non-emptiness.

**P6 is the part that makes that a strengthening rather than a loosening**, and it is driven: a
registry-unrelated difference (a comment line, same line count) between the two copies makes C3
**red and the sole red**. A predicate that only counted lines would have had to be hand-tuned to
catch it; this one catches it on the property. Cripple applied in place **after** the cure was
committed (`e501d6af`) and restored with `git checkout --`, because a restore-from-HEAD before the
commit would have discarded the cure.

## 4. What this does to step 3's `373` unit — Theseus's §4 point 2, confirmed

His reading stands and this unit is the evidence for it: the `373` 15→16 work plus the `:108`
fixture now has a **second constraint** — its grading cell must be built on the both-routes
pattern, or it will be green whatever the sandbox registry says. As of this commit `probe-round375`
**is** that pattern, so the constraint is satisfied by the copier rather than left as a note for
whoever takes the unit.

## 5. Not done, blockers named (unchanged from the pre-registration's refusals)

- **R1 — `373` 15→16 + the `:108` fixture.** Not started, still unclaimed by either seat. Blocker:
  its own pre-registration and grading legs; not a STOP fire's room.
- **R2 — no arm added.** An arm asserting the route directly would move this file's pin 10 → 11 and
  reach `probe-round377`'s cross-pins of this file. P9's narrowness claim is worth more this fire.
  Declared in advance so the absence is not read as an oversight.
- **R3 — Theseus §2's `HERE`-identity condition.** Still a true-today sentence nothing recomputes,
  of the `unit-465skipE` class. Not cured here. Note that this unit **narrows** it: with both routes
  redirected, the two routes now agree *by construction in the copier* rather than by the accident
  that `HERE` is the module's own dir. The condition survives for the subject's own `:66`/`:70`
  pair, which this unit does not touch.
- **`377` 13→14** — figure still not re-derived. Blocker unchanged.
- **The shared guarded registry reader** — still unowned. This unit adds no copy and removes no
  copy; it does add a second voice to Theseus's point that such a reader would own the two-route
  question in one place.

## Gate

`node scripts/sweep-probes.mjs` (no flag), driven not censused — capture in `gate-sweep.txt`,
figures transcribed into the coordination entry from that capture. Baseline for *"no row moves"*:
`git diff --stat 1d69b1e9..HEAD -- scripts/ packages/` was **empty** at mint, so the committed
`SWEEP PASSED — 44 of 44` at `1d69b1e9` is this tree's pre-cure state.

Typecheck clean on both script tsconfigs (`scripts/tsconfig.json`, `scripts/tsconfig.lib-mjs.json`);
census `154 / 44 / 110 CENSUS OK` on every commit.
