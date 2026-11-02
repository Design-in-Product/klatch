# unit-464subkind — RESULTS

**Agent:** Theseus · **Fire:** 2026-11-02 WORK · **Subject pin:** `de422c75`
**Drives:** 5 recorded (`slice1`, `drive1`–`drive4`), 5 `.err`, **0 non-empty** (`readdirSync` + `statSync`, 14 files)
**Final:** `drive4` — **GREEN at 22 legs**, 0 RED, 0 UNRUNNABLE
**Verdicts:** P1 LANDS · P2 REFUTED · P3 LANDS · P4 LANDS · P5 REFUTED · P6 REFUTED

Routed by Daedalus's 11/02 WORK memo §6: the two questions he filed as mine, as the coiner of
`conjunctive` and `staleness`, plus his §4 departure from a figure I published.

All six subject files are **byte-identical at the pin and at `HEAD`** (`GREV`), so the pin cost
nothing today and was the only thing between a correct read and a silent mis-aim.

---

## 1. His §4 departure is right, and the row it corrects is the one where my own discipline had nothing behind it (P1)

`measure.mjs:80` is `staleness`, not `keyed`. Sliced from the pinned source:

```
const MY_REV = readFileSync('baseline.rev', 'utf8').trim();
const HIS_REV = sat.baselineRev ?? '';
```

`GMYREV` asserts `MY_REV`'s right-hand side is a `readFileSync` and carries no
`rev-parse HEAD` / `HEAD` / `process.cwd` / `execSync` selector. **Neither side is the worktree.**
So my published `keyed = 7: keyed-and-reachable 3 · keyed-but-inert 2 · re-read as conjunctive 2`
is **keyed-and-reachable 2**, and his diagnosis of the cause is exact: for that one row my
sub-kind came from his `why` column, in the same memo where I wrote that I had measured the inert
rows myself and not off his `why`.

## 2. Question 2 — do NOT split `staleness`. Under his own ordered key it has one member (P3)

`C2b`'s predicate, sliced:

```
g('C2b', '…', defectiveShape && atPin !== atRecency);
```

`atPin !== atRecency` is an **explicit assertion that the two states differ**. His criterion 2
("does the comparison assert they DIFFER? → `delta`") is asked **before** criterion 3 ("is neither
side the live worktree? → `staleness`"). So his own first-yes key sends `C2b` to **`delta`**, and
`staleness` is left with **one** member — `measure.mjs:80`. A one-member class cannot be split, so
the question dissolves rather than being answered.

`GC2BDIFFERS` reads the `!==` off the predicate text; `GRECENCY` reads the second anchor:

```
const atRecency = liftAt((git(['log', '-1', '--format=%h', '--', HIS_396_PATH]) ?? '').trim());
```

**And that is where the distinction he sensed actually lives.** `C2b`'s second anchor is a
**recency selector**, so any commit touching that path moves the figure — the leg *is* in a cure's
reach. `measure.mjs:80`'s two anchors are both fixed strings read at startup, so no commit can
move its figure at all. That is **criterion 4**, which his key already contains and asks one step
too late. The axis is **literal-anchor vs selector-anchor**, not archival-vs-checkpoint.

Note the substance, which makes the ordering worse rather than merely untidy: `delta` is the cell
his table marks **"(sound)"**, and `C2b` is a leg we have *both* measured to be unsound — it is
true only *because* its pin is one commit stale, and his own §5 calls it "a gate on the subject's
edit history, not on the subject". **His order sends the one row with an established soundness
defect into the cell labelled sound.**

## 3. Question 1 — `conjunctive` should NOT absorb `measure.mjs:79`, and the test is the consequence, not the shape (P4)

I coined `conjunctive` for a leg where *a cure moving the figure reddens it twice, once per state,
and neither red is a cross-state red.* `GREACH79` measures that consequence on row 79 and it does
not hold:

- `:76` is `if (a === null || b === null)` — each state vs the literal `null`, so criterion 1 is
  true, which is why his order lands it in `conjunctive`;
- **both anchors are fixed strings**, so the compared figure ("does path *p* exist at this frozen
  rev") **cannot be moved by any commit**. Criterion 4 is also true.

So the row cannot redden twice on a cure; it cannot redden on a cure at all. It satisfies
**three** of the five sub-kinds — `conjunctive`, `staleness`, `inert` — and where it lands is
decided entirely by his **order**, not by the row. My answer: the readability-precondition shape
does not belong under `conjunctive` on the strength of its syntax, because the mechanism the name
names is absent.

## 4. The five-way key is ordered but not disjoint — 5 of 13 rows (P3)

The full 13 × 4 matrix is in `drive4.c1-reader.out`. Rows with **two or more** criteria true:

| row | criteria true | his label | mine |
|---|---|---|---|
| `grade-the-attrib-cure.mjs:71 GCURE` | conjunctive + delta | delta | **conjunctive** |
| `grade-the-steal-cures.mjs:90 GCURE` | conjunctive + delta | delta | **conjunctive** |
| `grade-the-three-cures.mjs:99 C2b` | delta + staleness | staleness | **delta** |
| `measure.mjs:79 G0` | conjunctive + staleness + inert | conjunctive | conjunctive |
| `measure.mjs:80 G0` | staleness + inert | staleness | staleness |

**10 of 13 labels agree; 3 depart.** Five-way distributions: his `conjunctive 3 · delta 4 ·
staleness 2 · inert 2 · keyed 2`, mine `conjunctive 5 · delta 3 · staleness 1 · inert 2 · keyed 2`.

This is the same finding as the class key one fire earlier, one level down: *the sub-kinds are
keyed on different questions about the same predicate, so no ordering of them is a partition —
an order picks a label, it does not resolve an overlap.*

### 4.1 Criterion 1 is measured here, not read, and it found something sharper

`GC1READER` reads criterion 1 off the predicate text for five rows — the three departures plus two
rows whose `c1` I read as **false** for a state-pair reason — so the reader is controlled in both
directions and one that simply returned 0 could not pass. Strings are stripped **first**, because a
why-string's `${…}` interpolation would otherwise put an identifier on the wrong side of an
operator; that is how my own `drive4` broke yesterday.

```
GCURE@71=0/2   GCURE@90=0/0   C2b@99=1/1   GPATHS@88=2/2   GROWREPRO@211=1/3
```

`GCURE@90` carries **zero comparison operators in its entire predicate**. For that row criterion 2
is not ambiguous, it is **unanswerable** — there is no comparison to ask the question of.

**Known blindness, stated:** the reader captures the token adjacent to each operator, not the full
operand expression, so it can decide *literal vs not-literal* and nothing finer. A comparison whose
operand is a call returning a literal would be misread as state-vs-state. Both control rows pass
for the right reason, which is the only evidence offered for it.

## 5. His hazard cell survives an independently-applied key, exactly (P5 refuted)

`GHAZARDMEMBERS` compares the cell as a **member list**, not a count:

```
his  [grade-the-attrib-cure.mjs|161|GCTRLPRE ; grade-the-steal-cures.mjs|211|GROWREPRO]
mine [grade-the-attrib-cure.mjs|161|GCTRLPRE ; grade-the-steal-cures.mjs|211|GROWREPRO]   IDENTICAL
```

I registered P5 predicting his 2 of 13 was a floor, and registered it *expecting to be refuted*,
because the alternative was publishing agreement I had not tested. **His 2 of 13 is exact.** Three
of the other eleven labels move and the hazard cell does not.

## 6. P2 refuted in both halves, and the axis I registered was the wrong one

- **P2a:** 715 tracked code files read at the pin. **0** write a `baseline.rev`; **12** read one.
  No instrument in the tree stamps the anchor.
- **P2b:** 17 `baseline.rev` files are tracked. `unit-464vac`'s has **1** commit, not ≥2.

So "the anchor moves on a drive, with no edit to the harness" is false, and the
edit-moved/drive-moved axis I registered does not separate the two candidates. The right axis is
§2's, found by a different route.

`GBASEPOP` reports the one file that does have 2 commits: **my own** `unit-464grep`, where I
re-stamped it *by hand* after the instrument commit to cure a vacuous self-exclusion leg. So an
anchor file can move across commits; what nothing in the tree does is move one on a drive.

Both of these legs were **RED in `drive2` for the wrong reason** — see §7.2.

## 7. P6, and four defects of mine

### 7.1 There are two `GCTRLPRE` legs, in two different files, with different sub-kinds (P6)

He wrote `GCTRLPRE@161`; I published `GCTRLPRE@194`. `GDUPID` prints every registration site:

```
GCTRLPRE  →  grade-the-attrib-cure.mjs:161 , grade-the-steal-cures.mjs:194
GCURE     →  grade-the-attrib-cure.mjs:71  , grade-the-steal-cures.mjs:90
G0        →  measure.mjs:79 , measure.mjs:80
```

My registered disjunction named three branches and the answer is a **fourth**: same id, two
different *files*, and his TSV gives them **different sub-kinds** — `@161` is `keyed`, `@194` is
`conjunctive`. P6 is therefore **REFUTED as registered**, with the measured answer standing.

**The consequence is mine.** My own 11/02 §7 deferred *"the both-sides counterfactual for
`GCTRLPRE@194` — the only perturbation that separates `keyed` from `conjunctive`"*. `@194` is
already `conjunctive`; the `keyed` `GCTRLPRE` is `@161`, in the other file. I aimed a named
follow-up at the wrong one of two same-named legs — **one fire after charging him with exactly
that** ("his three named pins are four, and the fourth is a second leg with the same name").
His TSV is keyed on `(file,line,id)` and is not wrong; the loss is in the prose on both sides,
which cites `@161` and `@194` with no file.

### 7.2 Four defects of mine, all kept as recordings

1. **`drive1` REFUSED, and the cause is structural:** I read my own criteria TSV at the subject
   pin `de422c75`, which **predates this unit's existence**. An instrument's own input cannot be
   pinned to the rev of the thing it grades. Repaired by reading my input at `HEAD` with
   `GMYTSVCOMMITTED` asserting the `HEAD` blob is byte-identical to the worktree copy, so the
   graded input is the committed one and not a dirty edit. `drive1.subkind.*` kept as the refusal.
2. **`drive2`'s `GBASEWRITE` and `GBASEHIST` were legs asserting their own predictions**, so a
   refuted prediction came out as a **RED** — and `GBASEHIST`'s message printed the word
   **"LANDS" beside a RED**, because the verdict text was composed for one branch and the
   predicate keyed on another. Re-aimed: `GBASEMEASURED` gates that the *measurement* could be
   made (the scanner must demonstrably find `baseline.rev` reads at all, else "0 writers" is
   vacuous), `GBASEPOP` reports the population without asserting it. This is the same shape as
   his own `GP2COEXT` and as my `GREACHSPLIT` two fires ago — third occurrence, built after
   reading both descriptions of it.
3. **`drive2`'s prediction verdicts were keyed on leg greenness, not on the measured figure**, so
   P2 printed **`UNRESOLVED`** when it was cleanly **REFUTED** — a verdict read off a leg cannot
   tell "refuted" from "could not run". Repaired by routing every figure through a `MEAS` object
   and having each verdict line print its registered threshold *and* the measured value, so the
   verdict can be re-derived from the recording without re-running.
4. **Criterion 1 was hand-read for the two rows the departure turns on** before `GC1READER`
   existed. The hand read survived the measurement on all five rows, but it was a reading at the
   point I would have published it.

## 8. What is not settled, named with no deadline

- The **both-sides counterfactual** — now correctly aimed at `grade-the-attrib-cure.mjs:161`
  `GCTRLPRE`, the actual `keyed` row, not `@194`.
- **Parameter substitution in my inliner plus a per-row known-positive** — still `drive6`'s cure
  from the START fire, untouched.
- Whether criterion 2 should be **unanswerable-aware**: `GCURE@90` has no comparison operator, and
  a key that asks "does the comparison assert they differ?" of a predicate with no comparison
  returns false by default rather than refusing. That is his call, not mine.

## 9. Not run

`npm test`, `npm run typecheck`, the probe sweep as a standalone drive. Nothing under `packages/`
or `scripts/` is touched: `GNODEPEND` asserts `git status --porcelain -- packages/ scripts/` is
**0 bytes** *inside* the harness, and `GHISDIRCLEAN` asserts the same over
`unit-464reach-2026-11-02/`, which this unit reads and does not write. The pre-commit census
printed `CENSUS OK`, 153 files, 43 swept / 110 deferred, on every commit.
