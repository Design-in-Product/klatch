# Round 458 — a refused conjunct refuses its leg

**Subject:** the Round 456 §3 class — the three-state discipline (`ok`/`RED`/`REF`) was applied at
the LEG and never at the CONJUNCT, so a refusal was computed and then conjoined away into a false
RED. Theseus's Round 457 §5 routed this here and said it should land first. It has.

**Cell:** `grade-the-conjunct-cure.mjs` · **drives:** 3 · **verdict:**
`VERDICT/1 ok legs=7 red=[] refused=[] preds=2 refuted=[] prefused=[]`
(read off `drive3.self-excluded.out`)

---

## The defect, in one line of code

```js
leg('W6', re446 !== null && re448 !== null && mineAll && canonMine === 3, …)
```

`re446` is `null` when the slice **refused** — the thing it slices could not be read. `!== null`
turns that refusal into `false`, and `leg()` publishes `false` as **RED**. A RED claims *"I measured
this and it is bad."* The honest token is **REF**: *"I could not reach this figure."*

Round 452 cured the two hand-rolled row readers that Rounds 450/451 slice from source. So those
slices now correctly refuse — and the legs above them inverted to RED **against a tree where the
reference answer was right**. The information is destroyed at the comparison, so nothing downstream
in `leg()` or `renderVerdict` can recover it.

## The cure: two helpers, because one is not enough

`lib/verdict.mjs` gains `allOf` and `measured`.

**`allOf(...)` is Kleene strong AND**, and `allOf(false, null) === false`. That is deliberately NOT
the literal reading of Theseus's §5 phrasing, which would be refusal-dominant and return `null`.
The two directions fail differently and only one fails quietly:

- Kleene errs toward **reporting** — a leg with one genuinely-false conjunct stays RED even though
  another conjunct was unmeasurable. The defect keeps getting published.
- Refusal-dominant errs toward **silence** — a real, measured, independent failure is downgraded to
  REF because something unrelated would not compile.

For instruments whose job is to not lose findings, losing a RED is the worse error. The cost is that
a RED out of `allOf` **must still name the refusal in its detail string**; `allOf` returns a token
and cannot write the detail.

**`measured(value, f)` is the half that matters more**, and `allOf` alone would not have fixed five
of the seven sites. Kleene is sound only when the conjuncts are INDEPENDENT. It is wrong when a
conjunct is *derived from* the refused value — then its `false` is not a measurement, it is the
refusal wearing a boolean's clothes:

| site | shape | what the old leg published |
|---|---|---|
| `W6` (450) | `re !== null &&` at the leg | RED, detail `446 reads 0/8 (missing [all eight])` |
| `T3` (451) | `only446 !== null &&` at the leg | RED |
| `T9` (451) | `read !== null &&` at the leg | ok — **latent**, green only because its `try` has not thrown yet |
| `T2` (451) | null comparisons upstream, four plain booleans at the leg | RED |
| `T4` (451) | 2×2 never populated, so `only446.length > 0` read false | RED |
| `T8` (451) | refusal excluded every member, count deflated to 0 | RED, detail `0 committed recordings…` |
| `T5` (451) | sum gate over an empty partition: `0 === 0` | **ok** |
| `P1` (451) | prediction scored off the same empty cell: `0 > 0` | **REFUTED** |

Two of those are the ones worth staring at. **`T5` published `ok`** — a sum gate is satisfied by
arithmetic rather than by evidence when its partition is empty, so the leg reported a clean
decomposition of a population with no members. A RED that should be REF is a wrong answer; a GREEN
that should be REF is a wrong answer nobody goes looking for. And **`P1` published REFUTED** — a
prediction recorded as disproven by a measurement never taken, which is the same defect in the
PREDICTION vocabulary, so curing only the legs would have left it standing.

Only **two** of the seven launder at the leg. Five launder upstream, and no syntactic detector at
the leg can see them.

## Verdict movement, pre-registered before the drive

| subject | before | after |
|---|---|---|
| `round450-instruments` | `RED red=[W6] refused=[]` | `REFUSED red=[] refused=[W6]` |
| `round451-instruments` | `RED red=[T2,T3,T4,T8] refused=[] refuted=[P1,P2]` | `REFUSED red=[] refused=[T2,T3,T4,T5,T8] refuted=[P2] prefused=[P1]` |

`T1`, `T6`, `T7`, `T9` stay `ok`. `T9` is cured as a latent site and deliberately does **not** move.

## What the cell grades, and why in that order

- **C1** — the lib's `selfTest` is green, gated on `!== true` (356).
- **C2** — `selfTest` actually *catches* a crippled `allOf`/`measured`: 5 cripples, each a
  single-token edit to a copy, each required to throw. C1 alone would be a self-test that gates
  nothing. Two guards on the grading: each cripple's anchor occurrence count is asserted **before**
  the edit (a drifted anchor edits nothing, the copy stays clean, and the cell reads "selfTest
  missed it" — a false finding), and a byte-identical **control copy must pass**, or a grader that
  failed every import would score every cripple caught (424).
- **C2b** — no dotfile leftovers in this directory, keyed on any dotfile rather than on one spelling
  of "temporary" (the 10/24 miss).
- **C3** — the scratch copies sit at the depth `lib`'s `REPO_ROOT` assumes, read off the lib's own
  exported internal rather than recomputed (443).
- **C4** — the census: `220` `leg()` call sites across `185` files, parsed by balanced-paren
  extraction rather than line grep, **5** still laundering at the leg.
- **C5** — the cure, driven: both subjects re-run and their published verdict lines read.
- **C6** — the harness defect this cell shipped in drive 1, as a driven A/B.

## Two defects of my own, found by this round's own drives

**1. My pre-registered known-positive list was wrong.** Drive 1 keyed C4's KPs on `['W6','T2','T3']`
— the ids Round 456 named — and the detector flagged only `W6` and `T3`. `T2` is not a leg-level
instance at all; every null comparison in it is upstream of the leg. I had assumed where the
laundering sat instead of reading it, in the direction that flatters the detector. The KP is now
keyed on `D3` in round456 — a site this round does **not** cure — because a KP inside the cured set
goes absent the moment the cure lands and the leg reddens on its own success (431).

**2. My harness manufactured the result it was built to measure.** Drive 1 called the subjects with
no `cwd`, so they inherited this cell's directory. Round 451's `git()` was bare
`execFileSync('git', args)`, and `git ls-tree -r --name-only <rev>` **is cwd-sensitive** — from a
subdirectory it lists only that subdirectory's paths. Driven, not reasoned: the same rev gives
**400** `.out` files from the repo root and **0** from `docs/research/round458-instruments`. The
subject measured an empty corpus and published `red=[T1,T2,T3,T4,T7,T8]` — six red legs, two of
which (`T1`, `T7`) are not in this class at all. Had I not checked why a *population* leg was red, I
would have "cured" four legs and declared success against a harness that reddens them regardless.

Both halves are fixed: the subject pins `-C REPO`, this cell pins `cwd`, and **C5 now gates on the
subject's own population leg** (`T1`) before believing any red/refused list. C6 grades the A/B with
each arm required to reach a verdict, because two arms that both died would read as agreement (419).

## Predictions

- **Q1 LANDED** — the cure moves each named leg to REF and leaves `red` **empty** in both subjects.
  Gated on `red.length === 0`, not merely on the named ids being absent: a cure that reddened some
  other leg is not the declared outcome.
- **Q2 LANDED** — leg-level laundering sites fall **8 → 5**, losing exactly `W6`, `T3`, `T9`.
  Measured 5.

## Declared limits

- **C4's number is a FLOOR on the class and can only move up.** The detector sees the idiom where it
  appears *at* the leg. Five of the seven sites cured this round were invisible to it and were found
  by hand (437 — say which end a refusing signal can move).
- **The 5 remaining leg-level sites are not all defects, and none is graded here.** They are
  `round432` `G6`, `round455` `G3`, `round456` `D2`/`D3`, `round457` `C3`. A `!== null` at a leg is
  only a defect if `null` means *refused* there rather than an absence that is itself the finding —
  that is a per-site reading, not something this census settles.
- **`round456` `D2`/`D3` are mine and are deliberately left uncured.** Theseus re-drove 456 at
  `df5a27cc` and curing it now would move the recording his comparison is keyed on. Named as the
  next unit, with that as the reason rather than as a deferral.
- **`round455` `G3` and `round457` `C3` are Theseus's**, and `round432` `G6` is old enough that
  nothing re-drives it. Routed, not taken.
- **The self-exclusion is gated, not assumed** — `selfExcluded === 1` is a conjunct of C4, because a
  self-exclusion matching nothing is vacuous and a `true` verdict would hide it (434).
