# unit-524sixtyvsfiftyfour-2026-11-26 — results

**Seat:** Theseus · **Fire:** 2026-11-26 WORK (bounded) · **Model:** claude-opus-5
**Pre-registration:** `PRE-REGISTRATION.md`, commit `c83c619fe738`, clock **14:49:36 PST**, read in
the same command that created the directory, **before any arm, reader, corpus builder, KP or
capture existed** — and, by its own §1, before either arm's corpus filter, `stripSource` call site
or `parenSpanEnd` had been read.
**Drives:** one. `captures/ARM.out` 5237 B · `captures/ARM.err` **0 B**. Arm commit `1418808c`.
`git diff --stat HEAD -- packages/ scripts/` asserted **EMPTY inside the arm** before any
measurement ran. Gate rc 0 at every push; `verify-decl-body-slicers` population **65**,
`MARKED/GUARDED/UNGUARDED` **4/3/58**, baseline **58** — unmoved; `tracked files read` 1122 → 1123,
the growth being this unit's own arm.

**12 registered predictions — 8 HIT, 4 REFUTED, and two of the eight HITs are worth nothing.**

## The answer, in one line

**Neither figure is wrong.** `unit-521`'s **54** and `unit-523`'s **60** both reproduce **exactly**,
each under its own key *and* under the other's, and the two readers **agree at zero** on both
populations. The entire 6 is population growth, and **all 6 of it comes from one file:
`unit-521`'s own post-hoc.**

## 1. Figures, as read

| | at `148ebe57` (`unit-521`'s SHA) | at `f247b428` (`unit-523`'s) |
|---|---|---|
| instrument corpus files | **850** | **855** |
| `new Set(` sites | **1246** | **1258** |
| `NOT-SIZE-KEYED` | 1097 | 1101 |
| `NO-COMPARISON` | 95 | 97 |
| `CHANGE` | 26 | 26 |
| `OTHER-N` | 16 | **17** |
| `INVARIANCE` | **11** | **16** |
| `EMPTY` | 1 | 1 |
| `SCAN-FAILED` | 0 | 0 |
| **`unit-521`'s reading** (size-keyed sites) | **54** — *published 54* | **60** |
| **`unit-523`'s reading** (excluded direct tails) | **54** | **60** — *published 60* |
| the two readings differ by | **0** | **0** |
| files on which they disagree | **0** | **0** |

Every cell in the left column reproduces `unit-521`'s published census line for line
(1097 · 95 · 26 · 16 · 11 · 1 over 1246). Both readers were **sliced** from the two arms' own
source — `BLOCK521` is `NEEDLE` through the end of `sitesIn`; `SIZECMP523` and `TAILIDX523` are
`SIZE_CMP` and `setTailIndices` — with every marker asserted present before the generated module
was compiled. Both trees were materialised with `git archive`, so each reading is of the
**committed** text at that SHA and the worktree was never read for a figure.

**The two arms' four shared texts were asserted byte-identical, not eyeballed:** `CODE_EXT`, the
corpus-filter arrow, `NEEDLE`, `TAIL` — **4 of 4 IDENTICAL**, with the arm throwing on drift. So
the population definition did not move between the two units, and `files in 521's corpus absent
from 523's: 0` — the growth is pure addition.

## 2. The closure

```
published delta to explain:                     60 - 54 = 6
reader-level delta at ONE pinned population:    0        (unit-521's SHA, 850 files)
growth contribution to the 523 reading:         6
reader delta + growth:                          0 + 6  = 6
reproduced 521's published 54?                  YES
reproduced 523's published 60?                  YES
```

**So Daedalus's framing — *"one of them is wrong by 6 and `unit-521`'s is the one the floor-of-11
rests on"* — rests on a false premise. Neither is wrong by anything.** Each is exactly right over
the population it was taken on, and the two readings of the question are **equivalent** in this
corpus: 1246 sites, 1258 sites, zero disagreements either way.

## 3. Where the 6 lives — and it is the keeper

The five files in `unit-523`'s corpus and not `unit-521`'s, with each one's contribution:

| new file | 521-keyed | 523-excluded |
|---|---|---|
| `unit-521…/arm-setsizefalsegreen.mjs` | 0 | 0 |
| **`unit-521…/posthoc-two-mechanisms.mjs`** | **6** | **6** |
| `unit-522…/arm-lengthasbytes.mjs` | 0 | 0 |
| `unit-522…/posthoc-which-133.mjs` | 0 | 0 |
| `unit-523…/arm-indirectsize.mjs` | 0 | 0 |

The six members, whole lines, as the arm printed them:

```
L37 INVARIANCE  new Set([{ figures: {} }, { figures: {} }, { figures: {} }].map((r) => r.figures.x)).size === 1,
L39 OTHER-N     new Set([[], [1]].map((x) => x.length)).size === 2,
L47 INVARIANCE  'new Set([]).size === 1': new Set(EMPTY).size === 1,
L48 INVARIANCE  'new Set([]).size < 2': new Set(EMPTY).size < 2,
L49 INVARIANCE  opposite: (new Set(EMPTY).size === 1) !== (new Set(EMPTY).size < 2),
L49 INVARIANCE  opposite: (new Set(EMPTY).size === 1) !== (new Set(EMPTY).size < 2),
```

> **THE KEEPER. The six are that post-hoc's own demonstration fixtures** — the planted cells whose
> entire purpose is to *show* the two emptiness readings (`=== 1` against `< 2`) that `unit-521`'s
> own addendum is named after. **An instrument's fixtures become live census members of the next
> census over the same corpus**, at full weight, indistinguishable from real sites, because
> `docs/research/` *is* the corpus. `L49` is counted **twice** — two matches on one line — and that
> is correct for both readers.

> **And the self-inclusion check was pointed everywhere except at the baseline.** `unit-523`'s PH5
> asked what `unit-522` contributes (**0**, correct) and what `unit-523` contributes (**0**,
> correct). Three of the five new files really do contribute nothing. The file it did not ask about
> is **the post-hoc of the very unit whose figure was the comparison baseline** — and it carries
> all six. *A growth check that enumerates the other units cannot clear growth; only one that
> enumerates the population difference can.* The arm here did not need to be clever: it took the
> set difference of the two file lists and read every member.

## 4. A live published figure moves, and this is a caution rather than a correction

`INVARIANCE` is **11** at `148ebe57` and **16** at `f247b428`, and the **+5** is exactly five of
the six fixture sites above (`OTHER-N` takes the sixth: 16 → 17). The arithmetic closes with
nothing left over.

`unit-523` §1 publishes **"11 + 4 = 15 measured `Set`-size invariance claims"**. Those two
addends come from **different populations**: the 11 is the direct form at 850 files, the 4 is the
narrowed indirect hazard at 855. A re-drive of the direct form **today** reads **16**, of which
**5 are that post-hoc's fixtures**. So:

- **15 is the number to keep**, and keeping it is right — fixtures are not invariance claims.
- But it is right **for a reason the figure does not record**: the direct half escaped inflation
  only because it was taken at the earlier SHA. Re-deriving "11" at any later SHA returns 16 and
  the five extra are self-inflicted.
- **Whether a fixture counts is a census-purpose question, not a reader question** — the same
  choice `unit-516` §5 holds open at 15-vs-0, which that record puts to xian and nobody else. This
  unit does **not** decide it; it measures that the choice is now load-bearing on a *published*
  figure rather than a hypothetical one.

## 5. The prediction grade

| id | prediction | measured | verdict |
|---|---|---|---|
| P1 | `54 == 11 + 26 + 1 + 16`, excluding `NO-COMPARISON` | the sliced membership list is exactly those four cells; 54 | **HIT** |
| P2 | the two corpus filters produce the same list | 4 of 4 shared texts byte-identical; 850 reproduced; 0 files lost | **HIT** |
| P3 | 5 new files, ≥1 of them neither 522's nor 523's | **5**, of which **2** are `unit-521`'s own | **HIT** |
| P4 | the readers **disagree** at one pinned population (`>= 1`) | **0** | **REFUTED** |
| P5 | the two causes sum to exactly 6 | `0 + 6 = 6` | **HIT** |
| P6 | both read `stripSource(raw, true)` | both, and both import the same `parenSpanEnd` | **HIT** |
| P7 | disagreeing sites reach ≤ 6 files | 0 files | **HIT, and VACUOUS** |
| P8 | direction: `523 >= 521` | equal, so the inequality holds | **HIT, and VACUOUS** |
| P9 | window-explained sites == 0 | **0**, with KP5 proving the mechanism reachable | **HIT** |
| P10 | a differing `parenSpanEnd`, or a skipped site, ≥ 1 | 0 — both arms **import the same lib** | **REFUTED** |
| P11 | `unit-521`'s 54 is the **low** reading / under-counts | neither under-counts; both exact | **REFUTED** |
| P12 | `INVARIANCE` unchanged **and** the delta lands in the other cells | 11 at the pinned SHA, but **5 of 6 land in `INVARIANCE`** | **REFUTED** |

**Against me, one — P7 and P8 are HITs that are worth nothing, and the reason is structural.**
Both were registered as intervals over a set that came back **empty**. "Reach ≤ 6 files" and
"523 ≥ 521" are both satisfied by *zero disagreements* without the drive having tested anything
either one was about. Daedalus's 11-26 §2 reported the same shape from the other side — a `P11`
HIT on `[0, 15]` satisfied by a figure made entirely of artefact, and a `P4` that HIT at 10 and
would have HIT again at 16. **An interval registered over a set that can be empty is graded by the
set's emptiness, not by the claim.** The cure is to register the emptiness separately, which P9
did and P7/P8 did not.

**Against me, two — P12 conjoined a sanity check with the claim, so its verdict cannot say which
half failed.** "`INVARIANCE` unchanged at the pinned SHA" is **true**; "the delta lands in the other
three cells" is **false, and it is the interesting half** — the growth lands almost entirely in the
one cell the floor-of-11 is made of. Graded REFUTED, but a single verdict over two claims is the
defect, and this seat has recorded it before.

**Against me, three — P4, P10 and P11 are one wrong model, registered three times.** I expected the
disagreement to be in the readers because I had read the two keys and found them structurally
different (521 walks the sites and looks forward through a 40-character window; 523 walks the
comparisons and tests a tail index). They *are* structurally different, and they are **extensionally
identical on 1246 and 1258 sites**. Reading two keys and finding them differently shaped is not
evidence that they differ in what they select, and I registered it as though it were.

## 6. KP gate — 6 of 6, and KP5 is why P9's zero is a measurement

| id | plant | required | result |
|---|---|---|---|
| KP1 | `new Set([1, 1]).size === 1` | counted by both | PASS |
| KP2 | `const kpS = new Set(kpArr)` then `kpS.size === 1` | counted by neither | PASS |
| KP3 | the same text inside a **string literal** | excluded by both — the strip is live | PASS |
| KP4 | `.size === kpN`, non-literal RHS | excluded by both | PASS |
| KP5 | **>40 blanked comment chars** between `)` and `.size` | counted by 523, **missed** by 521 | PASS |
| KP6 | the member's reported text is the **whole line** | PASS |

**KP5 is the load-bearing one.** `stripSource` blanks a comment *including its delimiters* and
preserves length — verified directly before the plant was written, not assumed — so a long comment
between a close paren and its `.size` pushes the comparison past `unit-521`'s 40-character forward
window while leaving `unit-523`'s `matchAll` unaffected. **The asymmetry is real and reachable, and
it has zero live instances in 855 files.** That is what makes P9's zero a measured zero: the
mechanism was planted and caught, then looked for and not found. Without KP5 the same zero would
have been indistinguishable from a reader that cannot see the thing at all.

The plants live in a temp directory **outside both corpora**, and the generated sliced-reader
module does too — a KP planted inside the corpus is a measured contaminant of the census it gates.

## 7. Limits, as declared, and one residual

- **L1 held** — this unit re-derived two keys over two pinned populations. It publishes **no**
  replacement for `INVARIANCE 11`, for the hazard **4**, or for the ceiling **10**, and it did not
  re-run either census.
- **L2 held** — both readings are of committed text via `git archive`; a file changed since is read
  as it was.
- **L3 held** — both readers sliced, markers asserted, nothing retyped; the arm throws rather than
  falling back to a hand-typed copy.
- **L4 held** — product tree asserted empty inside the arm.
- **RESIDUAL, named and NOT run:** whether the other direction of §4 holds — i.e. whether any of
  the **four** indirect hazard sites, or the **six** ceiling members, is itself a fixture rather
  than a claim. The blocker is that it needs `unit-523`'s receiver-resolution reader driven over a
  fixture/non-fixture partition that does not exist yet, and this fire is bounded. Stated so that
  nobody reads §4's "15 is the number to keep" as covering the indirect half: **it covers the
  direct half only.**

— Theseus
