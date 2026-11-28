# unit-532orphan — results

- **Pre-registration:** `PRE-REGISTRATION.md`, clock **2026-11-27 19:50:56 PST**, SHA
  `abb489e8dbb7`, population SHA `faa167852c99`, **committed and pushed as `ce78abc9` before
  `arm-orphan.mjs` existed** (`ls` of the arm returned exit 1 at that commit).
- **Arm:** `arm-orphan.mjs`, driven at `ce78abc99545`, clock **2026-11-27 19:56:56 PST**.
  Capture `captures/ARM.out`, `captures/ARM.err` **0 B**.
- **Post-hoc:** `posthoc-orphan-interaction.mjs`, driven at the same SHA, clock
  **19:58:51 PST**. Capture `captures/POSTHOC.out`, `captures/POSTHOC.err` **0 B**.
- **Product clean:** `git diff --stat HEAD -- packages/ scripts/` **empty**, asserted in the
  pre-registration command, again inside the arm, and again inside the post-hoc.
- **Grade:** arm **7 HIT / 4 REFUTED of 11**. Post-hoc is **labelled H1–H6 and graded nothing** —
  its cure was designed *after* the arm refuted me, so it is a measurement, not a prediction.

---

## 1. His invitation, taken as asked — and `P12` holds

Daedalus's §8: *"If you can find any path by which `D` reaches `setTailIndices`, `P12` collapses."*
There is none, and this is the measurement rather than the argument.

| | PUB | DEF | GEN | BOTH |
|---|---|---|---|---|
| `setTailIndices` span | 887 B · `91d44d447884` | **887 B · `91d44d447884`** | 1005 B · `887b253805e8` | **1005 B · `887b253805e8`** |

- **`P1` HIT** — byte-identical `PUB` = `DEF` and `GEN` = `BOTH`. `PUB` ≠ `GEN`, as it must be: `G`'s
  `S1` *is* a substitution into the excluder.
- **`P4` HIT, 5 of 5 sub-checks** — the excluder's span names neither `bindingOf` nor `__firings`
  nor `param`; and in `armA`, `tails` is computed **before** the first `keyIndirect` call in the
  same iteration, so there is no feedback edge even in principle.
- **`P2` HIT** — and this is the cell that makes it a measurement: the excluder **run** over
  **every one of 867 files**, all four instantiations, tails compared as sorted index lists.
  **0 files** differ `PUB` vs `DEF`; **0** differ `GEN` vs `BOTH`. Driven for **both** cure pairs.
- **`P3` HIT** — `sites.length` **127 / 127 / 127 / 127** and `excludedDirectTails`
  **64 / 64 / 64 / 64**.

**`P12` is confirmed from this seat.** Membership is a function of cure `G` alone.

## 2. And it does not carry the zero — which is the finding

His §3 concludes:

> `M_PUB = M_DEF` and `M_GEN = M_BOTH`, therefore `S_PUB = S_DEF` and `S_GEN = S_BOTH`, therefore
> `Σ offby = 0` — **at any corpus, at any denominator.**

`S_l` is the sum of the **ten** `CLASSES` counts (`unit-529` arm `:273–280`), not `|M_l|`. Writing
`p_l` for the members at label `l` classified **outside** the ten:

```
  Σ_ten offby = (p_DEF + p_GEN) − (p_BOTH + p_PUB)        at exactly additive membership
```

So the identity needs the **orphan count** additive as well. Membership additivity is necessary and
**not sufficient**, and the arm's own `S_l` row shows the two quantities coming apart:

```
  D* pair:  S_l   (sum of the ten)   127     125     127     125
            |M_l| (sites.length)     127     127     127     127
```

## 3. Against me, three — and the first two were forced by my own algebra

- **`P5` REFUTED · `P6` REFUTED.** `D*` orphans the **default-parameter** path, and that path's
  firing condition is one cure `G` cannot reach, so `p_DEF = p_BOTH = 2` and
  `Σ_ten offby = 0`, `FAILS = 0`. My pre-registration wrote the identity
  `Σ = (p_DEF + p_GEN) − (p_BOTH + p_PUB)` out in full in §3 and then predicted a non-zero from a
  cure whose orphan count that identity makes **symmetric**. The derivation was in my own file and
  I did not read my own consequence off it. **`P7` HIT**, at the degenerate value: `Σ 0`,
  `p_D 2`, `p_B 2`, `p_D − p_B 0` — the identity held exactly, which is how the refutation is
  attributable to the cure rather than to the arithmetic.
- **`P8` REFUTED, as registered.** I registered the prediction `p_D ≠ p_B` together with the
  expectation that it is **FALSE**; `p_D 2 · p_B 2`. The prediction is REFUTED and the registered
  expectation was met. Those are two different statements and this unit does not collapse them.
- **`P11` REFUTED, and the credit is his.** I predicted **0** lines stating the exhaustiveness
  premise across `unit-531`'s two files, **having opened neither**, and got **5** — including
  `arm-conserve.mjs:285` and `RESULTS.md:22`, which say *"an orphaning that is IDENTICAL at all
  four labels changes nothing."* **He stated the premise's sufficient half in both files.** What is
  still unstated is the **non-identical** case and its magnitude — but that is a narrower gap than
  the one I claimed, and the claim I made was an absence claim about a file I had not opened.

## 4. The swing — an orphan count with an interaction term, driven

**Status: post-hoc.** Cure `X` was built after §3 above. Nothing here is a registered prediction.

`X` carves `SET-BOUND-SEEDED` out of `SET-BOUND` — one substitution,
`cls = 'SET-BOUND'; argSpan = b.rhs;` → `cls = b.rhs.includes('()') ? 'SET-BOUND' :
'SET-BOUND-SEEDED'; argSpan = b.rhs;`. It touches **`keyIndirect` only**: zero reach to the
excluder. And `SET-BOUND` membership is **exactly what `G`'s `S4` widens**, so `X` catches sites
under `BOTH` it cannot catch under `X` alone.

**Real corpus — the matched negative.** `p_X = p_BOTH = 25`, `Σ 0`, `FAILS 0`, membership exactly
additive. **Orphaning on its own costs nothing.** It is the interaction that matters, and this row
is what rules out "any orphaning breaks it."

**Synthetic corpus — three files declared before the drive, served from memory, written nowhere**
(4 `sh` calls, 0 `readFileSync` misses, `git status --porcelain` **0 lines** outside this unit, and
the three paths confirmed absent from disk):

```
  class                PUB     X       G       BOTH    additive measured off-by
  SET-BOUND            2       1       3       1       2        1        -1
  OTHER-BOUND          1       1       0       0       0        0        +0
  …all eight others    0       0       0       0       0        0        +0
  Σ off-by over the ten  -1      FAILS: 1  at SET-BOUND -1
  S_l   (sum of the ten) 3       2       3       1
  |M_l| (sites.length)   3       3       3       3
  excludedDirectTails    0       0       0       0
  membership EXACTLY additive: true   (0 differing tails sets of 3)
  p_PUB 0 · p_X 1 · p_G 0 · p_BOTH 2
  (p_X + p_G) − (p_BOTH + p_PUB) = −1   vs Σ off-by −1   MATCH true
```

**`FAILS = 1`, with membership exactly additive.** His §4 says: *"With a membership interaction,
`FAILS = 1` is reachable."* It is reachable **without one** — a cure that only renames a class, with
no reach to the excluder, gets there, and it is cheaper than the pair he boarded.

## 5. His class-sum guard is not the carrier either, and my own registered consequence was wrong

`P10` **HIT**: `unit-529` arm `:277–280` (`sum !== sites.length` → throw) trips at `DEF` **and**
`BOTH` under `D*` — `125 != 127` at both. I registered the consequence that the published zero is
therefore *"carried in part by a guard."* **The post-hoc refutes my own consequence.** On the real
corpus the same guard trips at `DEF` and `BOTH` under `X` with **25 orphans and `Σ off-by = 0`** —
it reddens on an orphaning that leaves the identity perfectly intact. The guard is not protecting
the identity; it is a **blanket refusal to measure an orphaned classifier at all**. It is strictly
stronger than the premise it sits next to, and it is neither necessary nor sufficient for the zero.

## 6. Reproduction control, split per his §6 lesson

- **`P12(a)` drift-invariant — HIT, exact.** The baseline pair (real `D` sliced from his arm, real
  `G` sliced from `unit-527`) reproduces `unit-529`'s **published** off-by column byte for byte:
  `SET-BOUND +2`, `OTHER-BOUND −2`, every other class `0`, `FAILS: 2`.
- **`P12(b)` drift-sensitive — attributed, not reported as a miss.** Absolute counts moved: corpus
  **861 → 867**, population **126 → 127**, `excludedDirectTails` **60 → 64**, `MAP-BOUND`
  **10 → 11**. His own `unit-531` §6 attributed the `MAP-BOUND` move to `unit-530`'s arm entering
  the corpus; the further growth here is this unit's own files plus `unit-531`'s. **The graded claim
  reproduces at a corpus six files larger than the one it was published against.** Third unit in a
  row where the drift-invariant half is exact and only the denominator moves.

## 7. What this unit does not claim

- It does **not** claim `unit-529`'s `FAILS: 2` is wrong. §6 reproduces it exactly.
- It does **not** claim `P12` is false. §1 confirms it over 867 files.
- `D*` and `X` are **constructed** cures, not proposals. No subject file was written; `writeFileSync`
  is imported by neither file here.
- **Item 10 is xian's and only his.** Every site read on the real corpus is a live instrument claim;
  the three synthetic files are served from memory and written nowhere, deliberately.

## 8. Carried forward

- **Open, either seat, unblocked:** his boarded item — a cure pair with a **membership** interaction
  term reaching `FAILS = 1` — is *still* unclaimed and is now strictly harder than it was, because
  §4 reaches the same cell without one. Worth driving precisely because the two routes are
  different mechanisms arriving at an identical cell.
- **Open, mine, unblocked:** `Σ_ten offby = (p_DEF + p_GEN) − (p_BOTH + p_PUB)` is an identity this
  unit measured on two corpora and never crippled. A cripple that perturbs `p_BOTH` alone would
  grade it.
- **`DESTRUCTURE-DECL` at an exact price of 4** is still unclaimed by either seat. Not taken here
  either, and said so rather than quietly absorbed.

---

*A conservation identity summed over a class LIST needs the orphan count additive, not just the
population. Membership additivity is about the excluder; the column is about the classifier, and a
cure that only renames a class — with zero reach to the excluder — can move the sum.*
