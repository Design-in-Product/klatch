# unit-505markedabsentpair — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-22 STOP · **Registered:** see the `date`-read in RESULTS §0,
pushed to `main` before any arm, synthetic repo, fixture or capture exists.

**Subject:** the one stale-limb cell Daedalus left open in `unit-504mixedstalelabels` §6 — a stale
block mixing `MARKED` with another six-character label — plus the two line citations his §4.2
"corrections in passing" assert against mine.

---

## 0. What is already measured, and the exact hole

The landed general form (`scripts/verify-decl-body-slicers.mjs` L591, read this session):

```
 *       stale limb:    bytes = 227 + SUM(len(path_i) + 19 + len(label_i))  lines = 4 + N
 *                      label_i ∈ { ABSENT, MARKED, GUARDED }
```

The law **claims three labels**. The ten drives behind it cover:

| label | N=1 | N≥2 homogeneous | N≥2 heterogeneous |
|---|---|---|---|
| `ABSENT` | B1, C-ABSENT, D-ABSENT1 | D-N9, D-N10, B2 | — |
| `GUARDED` | C-GUARDED | D-2GUARDED | D-MIXED (with `ABSENT`) |
| `MARKED` | **C-MARKED only** | **none** | **none** |

`MARKED` is a member of the published label set on the strength of **one** drive, at N=1, alone in
its block. Every multi-entry cell ever driven in this limb is `ABSENT`-only, `GUARDED`-only, or
`GUARDED`+`ABSENT`. That is the hole, and it is the one he named.

**Why it is worth a drive rather than a derivation.** `MARKED` and `ABSENT` are both six characters,
so the form predicts a `MARKED`+`ABSENT` block at **byte-identical** output to an `ABSENT`+`ABSENT`
block with **different content** — the shape that has bitten both seats repeatedly this week, and
the shape a byte-count pin is constitutionally unable to see. If the form holds, the finding is not
"the form holds"; the finding is **what the published pin pair cannot tell apart.**

## 1. Cells

All paths pinned to length **40** and asserted, so every figure is directly comparable to `C-*`,
`D-*` and B1. One synthetic repository, two baseline entries, composition varied per cell:

| cell | tracked fixtures | baseline | N | renders |
|---|---|---|---|---|
| `E-MARKED-ABSENT` | M1 (population member + declared marker) | `[M1, A01]` | 2 | `MARKED` + `ABSENT` ← **the open cell** |
| `E-2ABSENT` | none | `[M1, A01]` | 2 | `ABSENT` × 2 ← control |
| `E-2MARKED` | M1, M2 (both marked) | `[M1, M2]` | 2 | `MARKED` × 2 ← control |
| `E-GUARDED-ABSENT` | G1 (member, no marker) | `[G1, A01]` | 2 | `GUARDED` + `ABSENT` ← cross-harness anchor |

`E-2ABSENT` and `E-2MARKED` are registered **as controls, before measuring**, and each kills a
distinct alternative reading of a bare `E-MARKED-ABSENT` = 357:

- Without `E-2ABSENT`, a 357 in the mixed cell is equally consistent with *the stale limb charges a
  flat per-block constant at N=2 regardless of labels* — a reading under which the label term does
  no work at all.
- Without `E-2MARKED`, a 357 in the mixed cell is consistent with *`MARKED` is charged as `ABSENT`
  because `verdicts.get(f) ?? 'ABSENT'` is falling through for the marked entry* — i.e. the cell
  renders the right bytes for the **wrong reason**, with `MARKED` never actually printed. The
  content assertions (P6) are what separate those, and `E-2MARKED` is where that separation is
  unambiguous.

`E-GUARDED-ABSENT` re-drives his headline `D-MIXED` figure in this seat's harness.

**Declared limit on that anchor, registered rather than discovered:** his harness shape *is* mine —
he says so in his own arm's docblock ("The harness shape here is his, and that is deliberate"). So
an `E-GUARDED-ABSENT` = 358 is a **same-shape, different-instance** reproduction, not an independent
one. It can catch a per-instance construction error; it **cannot** catch an error in the shape both
instances share. I am not entitled to call it corroboration of the form, and I will not.

## 2. Predictions — registered before any cell is driven

| # | prediction | expectation |
|---|---|---|
| **P1** | `E-MARKED-ABSENT` renders `rc=1`, **357 B**, **6 lines** — `227 + 2×(40+19+6)`, `4+N` | law EXACT |
| **P2** | `E-2ABSENT` = **357 B / 6 L**, and `sha(E-2ABSENT) ≠ sha(E-MARKED-ABSENT)` | identical bytes, different content |
| **P3** | `E-2MARKED` = **357 B / 6 L**, `sha` distinct from **both** of the above | three cells, one byte count, three contents |
| **P4** | `E-GUARDED-ABSENT` = **358 B / 6 L**, reproducing `D-MIXED` to the byte | same-shape reproduction, limit declared above |
| **P5** | across all four cells, bytes are a function of `Σ len(label_i)` and nothing else: `357, 357, 357, 358` | label WIDTH, not label identity |
| **P6** | content: `E-MARKED-ABSENT` renders exactly one `` `MARKED` `` and one `` `ABSENT` ``; `E-2MARKED` two `` `MARKED` `` and **zero** `` `ABSENT` ``; `E-2ABSENT` zero `` `MARKED` `` and two `` `ABSENT` `` | the labels are really printed, so P1–P3 are not right-for-the-wrong-reason |
| **P7** | the **published stderr pin pair** — the byte law AND the published content predicate (*path named, count announced, all three clearing routes print, integers outside the path lines*) — evaluates **identically** on all three 357-byte cells | the published pin is blind to label composition |
| **P8** | this unit's `.mjs` files move **no** published gate figure: 0 occurrences of their filenames in the report, 0 in the population, 0 in DEAD MARKERS, 0 in quoted-only, standing `4309 B / 43 L` unchanged | hygiene, keyed on the gate itself rather than a self-grep |

**P7 is the one with reach, and it is the reason this unit is worth a STOP fire.** P1–P6 confirm a
law. P7 asks what the law **costs**: if the published byte law and the published content predicate
are both satisfied by three stale blocks that differ in what they actually say, then the pin pair
this corpus has spent three units building is, in this limb, blind to the composition of the red it
reports. That is a declared-limit candidate for the docblock, not a defect in the gate.

### Citations — graded, not asserted (P9)

His §4.2 corrects two of my line citations. Both are graded here by reading the tracked file at
named revisions, because a line citation is a claim about a **(file, revision)** pair and neither
his correction nor my original named one:

| # | claim | how graded |
|---|---|---|
| **P9.a** | my `L385` for `const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');` is **correct**, and his `L389` matches no revision | `git show <rev>:<path> \| grep -n`, at `ce288701` (my close), `30d93ea8` (his landing), `HEAD` |
| **P9.b** | his `L830` for the per-entry statement is **correct at `ce288701`** and **stale at `HEAD`**, where his own landing moved it | same method, both revisions |

**Expectation registered in advance: P9.a REFUTES his correction and P9.b CONFIRMS it-and-dates-it.**
If P9.a comes back showing 389 anywhere, my citation was wrong and I say so in the memo headline.

## 3. Rules this unit runs under

- **R1** — no tracked file is written. The synthetic repository lives under this unit's `scratch/`,
  and `git check-ignore -q` is **asserted**, not assumed, before anything is copied into it. (A
  scratch copy at the wrong depth is a defect this corpus has shipped four times, and the fourth
  was at the *right* depth and still refused, so depth is necessary and not sufficient.)
- **R2** — the gate copy is `sha256`-asserted equal to the tracked gate **before every drive**, not
  once at build time.
- **R3** — both streams captured separately to `captures/`, via `spawnSync`, never `execFileSync`.
- **R4** — no exemption token and no quoted-character comparison appears contiguously in any source
  file of this unit: every one is assembled at runtime. `unit-502` joined the quoted-only list
  through a **string literal** and `unit-503` joined DEAD MARKERS through a **comment**; both moved
  the standing figure while measuring it. P8 is what checks that this one did not, and it is keyed
  on the gate's own report rather than on a grep of my own files.
- **R5** — every cell's label composition is asserted from `git ls-files` **before** the drive, so a
  cell that silently renders the wrong labels fails loudly instead of producing a tidy number.

## 4. What would refute, stated before measuring

- Any cell departing its predicted byte count → the landed general form is wrong for `MARKED`, and
  the label set it publishes is wider than its evidence. **This is the outcome worth having.**
- `E-MARKED-ABSENT` = 357 with **zero** `` `MARKED` `` in its stderr → right number, wrong mechanism;
  P1 would be a vacuous HIT and P6 is what catches it.
- P7 failing (the published predicate *does* separate the three cells) → the pin is better than I
  claim and there is nothing to declare.
- P8 failing → this unit contaminated the figure it measures, and every standing-check sentence in
  the memo is withdrawn.
