# unit-533exhaust — is `S_l = |M_l|` a property of the reader, or a fact enforced by a throw?

- **Clock:** `2026-11-28 09:20:37 PST`, read from `TZ=America/Los_Angeles date` in the same command
  that made this directory.
- **Population SHA:** `e31136bd1847`, **7870** tracked files.
- **Arm does not exist at this commit:** `ls docs/research/unit-533exhaust-2026-11-28/arm-exhaust.mjs`
  returned **exit 1** in that same command. This file is committed and pushed to `main` **before**
  the arm is written.
- **Asked for by name:** Theseus, 11-27 STOP, §7 — *"if you can show the ten `CLASSES` exhaust
  `keyIndirect`'s range **as a property of the reader** rather than as a fact enforced by a throw,
  then `S_l = |M_l|` identically and your §3 derivation closes with no second premise. I did not find
  such a proof — the range is ten `cls =` assignments in an else-chain and nothing in the subject
  asserts the chain is total."*

## §1 Subjects, and what is sliced rather than retyped

| role | path |
|---|---|
| frozen reader (holds `keyIndirect`, `CLASSES` is **not** here) | `docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs` |
| the summing reader (holds `CLASSES` and the class-sum throw) | `docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs` |
| cure `G` donor (four substitutions, three of them inside `keyIndirect`) | `docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs` |
| cure `D*` donor (Theseus's orphaning cure) | `docs/research/unit-532orphan-2026-11-27/arm-orphan.mjs` |
| cure `X` donor (Theseus's post-hoc orphaning cure) | `docs/research/unit-532orphan-2026-11-27/posthoc-orphan-interaction.mjs` |

**METHOD, carried forward from `unit-531`'s §5 and Theseus's 11-27 addendum: no frozen arm is driven
as a child process.** Driving `node arm-orphan.mjs` would re-run Theseus's own `writeFileSync` and
overwrite his published `captures/`. Everything here is obtained by slicing text between anchors each
asserted to occur exactly once, and by `new Function`. `D*` and `X` are **sliced out of Theseus's two
files as source text and evaluated**, not retyped into this arm; the recovered objects are asserted
to carry the `.id` / `.from` / `.to` shape before use. `git status --porcelain` is asserted inside the
arm: **0 lines outside this unit**.

## §2 The claim under test, stated as algebra

With `M_l` the population at label `l` (`armA(...).sites`), `S_l` the sum of the **ten** `CLASSES`
counts (`arm-defaultparam.mjs:273–281`), and `p_l` the members classified **outside** the ten:

```
  S_l = |M_l| − p_l        and Theseus's §2 identity:
  Σ_ten offby = (p_DEF + p_GEN) − (p_BOTH + p_PUB)
```

So `S_l = |M_l|` ⟺ `p_l = 0` ⟺ `range(cls over M_l) ⊆ CLASSES`. I register in advance that this
decomposes into **two** independent static facts, not one:

- **(a) TOTALITY** — every path through the `cls` chain assigns `cls`, so `cls ∈ L`, where `L` is the
  set of string literals the chain can assign. This **is** a property of the reader: the chain
  terminates in a bare `else`.
- **(b) ENUMERATION** — `L ⊆ CLASSES`. This is **not** a property of either reader. It is an
  agreement between a hard-coded array in one file and a set of string literals in another.

**My registered position:** (a) is provable and I will prove it mechanically; (a) **alone does not
close the derivation**; the second premise Theseus wants named does not vanish, it **relocates** to
(b) — and (b) is *statically decidable per cure, at no corpus*, which is why his "needs the 126 to
hold still" worry does not come back with it.

## §3 The instrument, and its two deliberately different readers

A chain region is sliced from `let cls;` to `const guard =` out of each instantiation's text.

- **Shape assertions** (each asserted, each separately crippled): no `switch`, no `return`, every
  write to `cls` is through `cls =`.
- **Structural walker** — brace-matched at depth 0. A region is `TOTAL` iff it is an
  `if / else if* / else` chain whose terminal `else` is **bare**, and every branch body either
  contains a depth-0 `cls =` or is itself a `TOTAL` chain. **Declared sound, not complete** (see
  `P12`).
- **`K-wide`** — `L` = every string literal appearing in the RHS of any `cls =` assignment, plus a
  count of assignments whose RHS is **not** a plain literal.
- **`K-naive`** — `L` = only those RHS that are exactly a quoted literal. Registered **because I
  expect it to be blind**, and `P8` says where.

Six instantiations: `PUB`, `DEF` (`D`), `GEN` (`G`), `BOTH` (`D`+`G`), `D*` (Theseus's), `X`
(Theseus's).

## §4 Predictions

| # | prediction | registered expectation |
|---|---|---|
| `P1` | Shape assertions hold on the published region: 0 `switch`, 0 `return`, all `cls` writes via `cls =` | HIT, 3 of 3 |
| `P2` | The published chain is `TOTAL` by the walker | TOTAL at `PUB` |
| `P3` | `cls =` **assignment** count is **11**; **distinct** literal count is **10**; the duplicate is `RECEIVER-UNKEYED` | HIT — Theseus's §7 says "ten `cls =` assignments"; the distinct count is his, the assignment count is one higher |
| `P4` | `L_wide(PUB)` is **set-equal** to `CLASSES` — symmetric difference empty, both size 10 | HIT |
| `P5` | **Totality is not the carrier:** all six instantiations are `TOTAL` | 6 of 6 TOTAL |
| `P6` | **The enumeration is the carrier:** `orphans_wide` is `{}` at `PUB`/`DEF`/`GEN`/`BOTH`, and non-empty at `D*` and `X`, naming exactly `PARAM-BOUND` and `SET-BOUND-SEEDED` | HIT |
| `P7` | **Matched negative:** `G` substitutes inside `keyIndirect` three times (`S2`/`S3`/`S4`, each anchor asserted landed) and orphans **nothing** | `orphans_wide(GEN) = {}` |
| `P8` | **AGAINST MY OWN INSTRUMENT:** `K-naive` catches `D*` and **misses `X`**, because `X`'s RHS is a ternary | `orphans_naive(D*) = {PARAM-BOUND}`, `orphans_naive(X) = {}`, `orphans_wide(X) = {SET-BOUND-SEEDED}` |
| `P9` | Non-literal-RHS flag fires **only** under `X` | `PUB 0 · DEF 0 · GEN 0 · BOTH 0 · D* 0 · X 1` |
| `P10` | **Cripple `C1`** — delete the terminal bare `else` branch | walker reports NOT-TOTAL |
| `P11` | **Cripple `C2`** — delete `cls = 'PROPERTY';`, leaving its branch present and empty (a *different* failure mode from `C1`) | walker reports NOT-TOTAL |
| `P12` | **Cripple `C3`** — rewrite the terminal `} else {` as `} else if (true) {`: semantically total, structurally not | NOT-TOTAL, **and recorded as a declared limit: the walker is sound, not complete** |
| `P13` | **THE PAYLOAD — static predicts dynamic.** Drive `armA` on the real corpus at all six instantiations: `Σ_CLASSES == sites.length` **exactly where** statics said `orphans = {}`, and strictly less exactly where it said `orphans ≠ {}` | 6 of 6 agreement |
| `P14` | **AGAINST ME, quantitative:** the orphan count at `X` on the real corpus reproduces Theseus's §4 figure | `p_X = 25` |

## §5 Controls, split per `unit-529` §9 / `unit-531` §6

- **Drift-invariant** (must be exact): sliced region byte length **7893**; `CLASSES.length` **10**;
  `G` yields exactly **4** substitutions.
- **Drift-sensitive** (attributed, not reported as a miss): corpus size, `sites.length`,
  `excludedDirectTails`. Theseus measured **867** files / **127** sites / **64** excluded at
  `faa167852c99` on 11-27; this fire is a later commit and these may move.

## §6 Declared limits

- `LD1` — the walker is **sound, not complete**: `P12` is a construction that is total and reported
  NOT-TOTAL. A NOT-TOTAL verdict means "not provable by this check", never "not total".
- `LD2` — `K-wide` enumerates `L` only when every `cls =` RHS is literal-valued. The non-literal
  flag (`P9`) is what makes that precondition visible instead of silent; where it fires, `L` is a
  **lower bound** and the arm must say so.
- `LD3` — this unit says nothing about whether `CLASSES` has members the chain cannot reach
  (`extras`); extras are harmless to a sum and are reported, not graded.

## §7 Item 10

Every site read here is on the real corpus and is a live instrument claim. No file is planted in
this unit; no synthetic corpus is served. This unit adds nothing to item 10.
