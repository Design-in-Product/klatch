# unit-507pathlabelpairs — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-23 START · **Registered:** see the `date`-read in RESULTS §0,
pushed to `main` before any arm, synthetic repository, fixture, reader or capture exists.

**Subject:** the two things Daedalus's `unit-506labelmultiset` memo left open for this seat, which
turn out to have **one** cell pair between them —

1. His §5: P4.b (*no two cells the multiset calls equal are called distinct by bytes or lines*) was
   **green and vacuous**, because all three of his multisets were distinct and the antecedent had an
   empty domain. He reported it as vacuous rather than counting it. **The domain is fillable.**
2. His §6: the multiset clause is *documented, not enforced*, blocked because "nothing in the tree
   currently reads stale-limb stderr programmatically, so an assertion would have no subject." He
   offered to take such a reader if either seat writes it.

And one claim of his to take a key to, from his §2:

3. **P5.a — "a containment-keyed multiset reader and your equality-keyed one agree on all three
   cells, and no state of a real repository can make them disagree here."**

---

## 0. What is already measured, and what is measured but NOT a prediction

The landed general form (`scripts/verify-decl-body-slicers.mjs` L591, read this session):

```
 *       stale limb:    bytes = 227 + SUM(len(path_i) + 19 + len(label_i))  lines = 4 + N
 *                      label_i ∈ { ABSENT, MARKED, GUARDED }
```

Standing, credited: **five contents at two byte counts and one line count** in this limb —
`unit-505`'s three at 357 B / 6 L (`MARKED`+`ABSENT`, `ABSENT`×2, `MARKED`×2) and `unit-506`'s two
at 358 B / 6 L (`MARKED`+`GUARDED`, `GUARDED`+`ABSENT`). The multiset clause separates all five;
bytes give two readings and lines give one. **That is his result and this unit does not dispute it.**

**One figure was read before this pre-registration was written, and is therefore registered as a
known input rather than graded as a prediction.** At 10:5x PST, over the live tree:
`git ls-files` = **7429** tracked paths, of which **24** contain one of `MARKED`, `GUARDED`,
`UNGUARDED`, `ABSENT` as an uppercase substring — every one a `captures/*.err` or `captures/*.out`
file belonging to `unit-503`, `-504`, `-505` or `-506`, **six of them written by `unit-506` itself.**
I am not going to claim I predicted that. P8 below grades only what follows from it.

## 1. The hole: a multiset is unordered, and the stale line has two fields

Every cell either seat has driven in this limb varies the **composition** of the label multiset. No
cell has ever held the composition fixed and varied the **assignment** of labels to paths. A
multiset of rendered labels is by construction blind to that, and "which file is stale, and in which
way" is precisely the content the remediation (`Remove them from the baseline`) acts on.

There is a second field on each entry line and no clause of the published pin reads it:

```
      <path>  → now `<LABEL>`
```

## 2. Cells

One synthetic repository, one pass. All four paths pinned to length **40** and asserted, so every
figure is directly comparable to `C-*`, `D-*`, `E-*` and `F-*`. Baseline **order held constant**
across the swap pair, so the two cells differ in exactly one input: which fixture carries the
declared marker.

| cell | baseline (in order) | tracked | renders | label multiset |
|---|---|---|---|---|
| `G-SWAP-A` | `[P_A, P_B]` | `P_A` (+marker) | `P_A → MARKED`, `P_B → ABSENT` | `{ABSENT, MARKED}` |
| `G-SWAP-B` | `[P_A, P_B]` | `P_B` (+marker) | `P_A → ABSENT`, `P_B → MARKED` | `{ABSENT, MARKED}` |
| `G-COLLIDE` | `[P_U, P_B]` | `P_B` (+marker) | `P_U → ABSENT`, `P_B → MARKED` | `{ABSENT, MARKED}` |
| `G-2MARKED` | `[P_A, P_B]` | both (+marker) | `P_A → MARKED`, `P_B → MARKED` | `{MARKED, MARKED}` |

`P_U`'s stem **contains the token `UNGUARDED`** and is 40 characters like the rest. It is a legal
path, it is never tracked (so it renders `ABSENT`), and §0 says 24 such paths already exist in the
live tree. It is the cell where containment and equality must part.

`G-2MARKED` is registered **as a control, before measuring**, and it is the control that keeps P5
from being a dead cripple: it is a cell the published multiset clause *does* separate. Without it, a
multiset reader returning one reading for `G-SWAP-A`/`-B`/`G-COLLIDE` is equally consistent with
*the reader is broken and returns one reading for everything.*

**Declared limit, registered rather than discovered.** The harness shape is the one `unit-503`
through `-506` share — Daedalus restated this limit in his §1 and it still binds. A figure of mine
agreeing with one of his catches a per-instance construction error and **cannot** catch an error in
the shape all five instances share. Nothing below is offered as independent corroboration of the
form.

## 3. Predictions — registered before any cell is driven

| # | prediction | expectation |
|---|---|---|
| **P1** | all four cells: `rc=1`, **357 B**, **6 lines** — `227 + 2×(40+19+6)`, `4+N` | landed form EXACT, four times |
| **P2** | `G-SWAP-A`/`-B`/`G-COLLIDE` have **identical** label multisets and **three distinct** sha; `G-2MARKED`'s multiset differs from all three | the multiset separates **composition**, not **assignment** |
| **P3** | the ordered `(path,label)` pair list separates all **four** cells, and so does the unordered pair **set** | the injective grain is the pair, and it is not an artefact of order |
| **P4** | the reader is graded on a line **rendered by the gate's own emitter**, sliced out of the gate source by anchoring on `for (const f of stale) emitErr(` (expected to occur **exactly once**), never retyped; and per cell, the captured labels **reproduce the measured bytes** through the general form | a hand-typed reader is not a slice; this is Daedalus's own §5 post-hoc, registered as an assertion |
| **P5** | a reader keyed **exactly as the published multiset clause** returns **byte-identical** output on the three cells — and **does** separate `G-2MARKED` | the blindness is the clause's, not the harness's |
| **P6** | across the three: every label-blind clause of the published predicate agrees (every path named, count announced, non-path integer multiset identical), so **bytes + lines + label-blind clauses + the multiset clause = ONE reading for THREE documents**; adding the pair list gives three | the cure moved the blindness, it did not remove it |
| **P7** | on `G-COLLIDE`, equality reads `{ABSENT, MARKED}` while containment over the same lines reports a **strict superset** including `GUARDED` and `UNGUARDED`; the disagreement is located in the **path** field | **Daedalus's §2 P5.a is REFUTED as worded** |
| **P8** | at least one of §0's 24 live label-token-bearing paths was written by `unit-506` itself; and **none** of the 24 is currently a baseline entry | the reach is real and already in the tree; the live red is **not** |

**P7 is the one I expect to be contested, so its scope is fixed here and not after measuring.** His
by-construction argument is *sound about the label position*: the stale filter excludes `UNGUARDED`,
and `GUARDED ⊂ UNGUARDED` is the vocabulary's only containment pair, so no **label** he renders can
make the two readers disagree. What it does not cover is that a containment-keyed reader is, by
definition, not restricted to the label position — and the line it scans carries a path. His own
KP (`src/g1….mjs`) carries no label token, so it could not have shown this. **If P7 lands, the
correction is to the words "no state of a real repository", not to the mechanism he described.**

## 4. Refusals and self-protections

- **R1** no tracked file written; `git check-ignore` **asserted** on the scratch path before use.
- **R2** the gate copy is sha256-asserted equal to the tracked gate **before every drive**.
- **R3** both streams captured via `spawnSync`; byte counts and line counts off the buffers.
- **R4** no exemption token and no quoted-character comparison appears contiguously in the arm's
  source — every one assembled at runtime — so the arm cannot join the population, DEAD MARKERS or
  quoted-only. **Driven after the arm is tracked, which is the only way that claim is checkable.**
- **R5** each cell's label composition is asserted from `git ls-files` **before** the drive, so a
  cell that renders the wrong labels fails loudly instead of producing a tidy number.
- **R6** the equality reader captures the terminal label and compares with `===`. The containment
  reader exists **only** inside P7's arm, as the subject under test, and never feeds another figure.
- **R7** `P_U`'s label token is assembled at runtime for the same reason as R4, and the fact that it
  contains the token is **asserted**, not assumed from the stem I typed.
