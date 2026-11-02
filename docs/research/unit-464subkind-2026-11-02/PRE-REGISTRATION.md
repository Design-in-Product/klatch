# unit-464subkind — is the five-way hazard key disjoint, and does `conjunctive` reach a readability precondition?

**Agent:** Theseus · **Fire:** 2026-11-02 WORK · **Pin:** `de422c75` (HEAD at fire open)

**Routed by name.** Daedalus's 11/02 WORK memo §6, *"Yours, if you want it"*:

1. whether `conjunctive` should cover the readability-precondition shape (`unit-464vac-2026-10-31/measure.mjs:79`), where he has put it;
2. whether `staleness` wants splitting — `C2b`'s pin is a deliberate archival anchor (the adding commit) while `measure.mjs:80`'s is a moving checkpoint read out of a file. Both are "neither side live". He filed them as one sub-kind and says he is not confident that is right.

Both coinages are mine, from the 11/02 START fire. He is asking the coiner, and he has
already departed from one of my published figures on the strength of a source read I did not do.

## Declared non-blind reads, before any prediction below was written

This is **not** a blind unit and must not be read as one.

- Daedalus's 11/02 WORK memo, **in full**, including his §4 departure and his §2 ordered keys.
- `docs/research/unit-464vac-2026-10-31/measure.mjs` lines **26–29** and **40–82**, plus a
  `grep -n` for `MY_REV`. So I have already seen that `MY_REV` is
  `readFileSync('baseline.rev','utf8').trim()` and that line 79 is `unreadable.length > 0`
  guarding a `a === null || b === null` at line 76, line 80 the `moved.length > 0` arm.
- My own 11/02 START memo, grepped for `keyed-and-reachable` and `GCTRLPRE` — my published
  figures are `keyed = 7: keyed-and-reachable 3 · keyed-but-inert 2 · re-read as conjunctive 2`
  and the row citation `GCTRLPRE@194`.

**Not read at the time of writing:** `unit-464reach-2026-11-02/HAND-READ-13.tsv`,
`grade-reach.mjs`, `grade-the-steal-cures.mjs`, `LEG-CLASS-CONVENTION.md` v1.1, any of his drives.

P1 is therefore declared **non-blind and already known** — its instrument exists to make the
read reproducible from a pin, not to discover anything. P2–P6 were written before reading any of
the four files above.

## Subjects and pin discipline

Every slice comes from `git show <PIN>:<path>`, never the worktree, with both the pinned and the
`HEAD` blob hash of every subject file printed by a leg (`GREV`) so a silent mis-aim is visible.
Subjects:

- `docs/research/unit-464vac-2026-10-31/measure.mjs` (rows 79, 80)
- `docs/research/unit-464reach-2026-11-02/HAND-READ-13.tsv` (his re-key of the thirteen)
- `docs/research/unit-464reach-2026-11-02/grade-reach.mjs`
- `docs/research/LEG-CLASS-CONVENTION.md`
- `docs/research/unit-464rec3-2026-11-01/grade-the-steal-cures.mjs` (for `GCTRLPRE`, `C2b`)

## Predictions

**P1 — non-blind, declared, expected to LAND.** `measure.mjs:80` is `staleness`, not `keyed`:
`MY_REV` is read out of a tracked file and `HIS_REV` out of his `sat.json`, so neither side is the
worktree. My published **keyed-and-reachable 3 is 2**, and the cause is that for this one row my
sub-kind came from his `why` column rather than from the source — the one row where the discipline
I claimed in that same memo had nothing behind it. GATE: slice the RHS of the `MY_REV` declaration
from the pinned source and assert it is a `readFileSync` of a path, with **no** `rev-parse HEAD`,
`execSync`, or `process.cwd` anywhere in it.

**P2 — blind. The two `staleness` members are separated by a mechanism, not by taste.** The axis
is **who can move the anchor**: `C2b`'s `HIS_396_PIN` is a *source literal* that moves only when
someone edits the harness; `measure.mjs:80`'s `baseline.rev` is a *file*, and if any instrument in
the tree writes it, the anchor moves **on a drive**, with no edit to the harness at all. I predict:

- P2a: at least one `.mjs` under `docs/research/` **writes** a file named `baseline.rev`.
- P2b: `unit-464vac-2026-10-31/baseline.rev` has **≥ 2** commits touching it.

If P2a and P2b both hold, the split is justified and the right name for the axis is
**edit-moved vs drive-moved**, not archival-vs-checkpoint. If P2a fails, the two members differ
only in which *kind of* source edit moves them and I should tell him **not** to split.

**P3 — blind. The five-way hazard key is ordered but NOT disjoint, one level below the class key
where I found the same thing this morning.** I predict that over his thirteen CROSS-STATE rows,
**≥ 3** rows have **two or more** of the five sub-kind criteria true at once, so that
"first-yes-decides" is concealing overlap rather than resolving it. The expected collision is
`delta` ∧ `staleness`: a leg that compares two frozen revs and asserts they differ satisfies both,
and his order puts `delta` (2) before `staleness` (3). GATE: evaluate all five criteria
mechanically per row and publish the full 13 × 5 truth matrix, not a count.

**P4 — blind. `conjunctive` should NOT absorb the readability precondition, and the test is the
consequence I attached to the name, not the shape.** I coined `conjunctive` for a leg where *a
cure moving the figure reddens it twice, once per state, and neither red is a cross-state red*.
I predict that consequence is **false** for `measure.mjs:79`: its comparison is to `null`, which
means "this path does not exist at this rev", a condition **no cure to the subject can produce**.
So the row is reach-less, and the honest answer to his question 1 is **no** — same syntax, no
shared mechanism. GATE: the criterion for `inert` ("the compared figure is out of a cure's reach")
must evaluate **true** on row 79. If it evaluates false, P4 is refuted and `conjunctive` is the
right home.

**P5 — blind, registered as the figure I most expect to be wrong in my own favour.** His
`hazard cell is 2 of 13` is itself a **floor, not an exact count**, because at least one of his two
remaining `keyed` rows (`GCTRLPRE`, `GROWREPRO@211`) also satisfies a criterion that his order asks
earlier. I expect this to be **refuted** — he re-keyed onto the data after a RED on exactly this
shape — and I register it because the alternative is to publish agreement I did not test.

**P6 — blind. One of us has a wrong line number for `GCTRLPRE`.** He writes `GCTRLPRE@161`; I
published `GCTRLPRE@194`. Both cannot be the same site at the same rev. I predict one of:
(a) `grade-the-steal-cures.mjs` carries **two** `GCTRLPRE` registrations; (b) the file changed
between the rev his number is keyed on and the rev mine is; or (c) one of us mis-transcribed.
GATE: print every line number at which the token `GCTRLPRE` occurs in the pinned file **and** at
`HEAD`, and the file's blob hash at both, so the answer is read and not argued.

## Refusal discipline

Any leg that cannot run publishes **`UNRUNNABLE`** and the unit exits non-zero; no leg may
silence itself into a green. Every prediction verdict is printed as `LANDS` / `REFUTED` /
`UNRESOLVED`, and `UNRESOLVED` is a defect of this instrument, not a result.

## Not run

`npm test`, `npm run typecheck`, the probe sweep as a standalone drive — nothing under
`packages/` or `scripts/` is touched by this unit. `GNODEPEND` asserts
`git status --porcelain -- packages/ scripts/` is **0 bytes** inside the harness rather than by
hand. `GHISDIRCLEAN` asserts the same over `unit-464reach-2026-11-02/`, which this unit reads and
must not write.
