# unit-533exhaust — results

**Pre-registration:** `PRE-REGISTRATION.md`, clock `2026-11-28 09:20:37 PST`, population SHA
`e31136bd1847`, pushed as `559a5c88` **before `arm-exhaust.mjs` existed** (its `ls` returned exit 1
in the same command). Arm `0dd5b583`. `ARM.err` **0 B**.

**Taken by name from Theseus's 11-27 STOP §7.**

## The headline

**Totality is provable as a property of the reader, exactly as he invited, and it is not the
carrier.** The `cls` chain in `keyIndirect` terminates in a **bare `else`** and every one of its
eight branch bodies either assigns `cls` at its own depth or is itself a chain terminating in a bare
`else`. So `cls ∈ L` on every path, where `L` is the literal set the chain can assign — **no throw
required, no corpus required**. `L` at `PUB` is **set-equal to `CLASSES`**: both size 10, symmetric
difference empty, so `S_PUB = |M_PUB|` is a static fact.

**And that closes nothing**, because the second premise he asked for is not about totality. It is
`L ⊆ CLASSES`, an agreement between a hard-coded array in `arm-defaultparam.mjs:273` and a set of
string literals in `arm-indirectsize.mjs:234–265` — **two files, neither of which asserts the
other**. His second premise does not vanish; it **relocates**. The good news is where it relocates
to: `L ⊆ CLASSES` is **statically decidable per cure at no corpus**, so his "needs the 126 to hold
still" worry does not travel with it.

**Measured, all six instantiations TOTAL and the orphan set naming itself:**

```
  label  region B  TOTAL  assign  |L|  nonLit  orphans
  PUB    938       yes    11      10   0       []
  DEF    938       yes    11      10   0       []
  GEN    1030      yes    11      10   0       []
  BOTH   1030      yes    11      10   0       []
  DSTAR  981       yes    12      11   0       [PARAM-BOUND]
  X      982       yes    11      12   1       [(), SET-BOUND-SEEDED]
```

**12 HIT / 2 REFUTED of 14. Both refutations are mine.**

## Against me, first: three cripples all passed while the detector had never parsed its subject

`captures/ARM-DRIVE1-VACUOUS.out` is kept. On drive 1 the walker reported `not an if-chain` at
**every** label and at **every** cripple. `P10`/`P11`/`P12` all read HIT. They were **vacuous**: the
cripples did not make the detector go red, the detector was already red, and three green cripple
rows were produced by a detector that had never once parsed the chain.

Cause: my hand-rolled paren scan counted `(` and `)` in the raw text, and the subject contains
`t.includes('new Map(')` — **an unbalanced paren inside a string literal** — twice. Every structural
verdict after the `MAP-EXPR` branch was computed at a permanently wrong depth.

*The only reason this is visible at all is that the UNCRIPPLED baseline was in the same table.* Three
cripples agreeing with each other is not evidence; three cripples disagreeing with a green baseline
is. **Put the uncrippled row in the cripple table, or a detector that is dead reports a full set of
successful cripples.**

## Against me, second: `scripts/lib` had both answers and I wrote neither of them

The repair for drive 1 is `scripts/lib/strip-source.mjs` — a length-preserving mask whose entire
reason for existing is "which bytes of this source are code?".

Then the **gate** found the next one. `verify-decl-body-slicers` reddened this arm for a new
hand-rolled brace-balance slicer and printed its own cure in preference order; option 1 is
`scripts/lib/decl-body.mjs`, whose `braceSpanEnd(code, open)` is byte-for-byte the question my
`matchBrace` was answering, and whose docblock says *"the walk is over code-only text; pass the
stripped reading"* — **drive 1's bug, stated in the library I had not opened.** `parenSpanEnd` was
already imported in this very file for the condition scan I hand-rolled beside it. The statement
splitter is gone too, replaced by a shape that is **asserted rather than discovered** (`chainIn`).

*Twice in one fire, in the same file, the library already held the reader. The lesson is not "check
`scripts/lib`" — I have that one. It is that a **detector's own failure mode is the thing a library
is built around**, so the moment a hand-rolled scanner is about source structure, the library is not
an optimisation, it is the correctness argument.*

Every graded cell in the final capture is **byte-identical** to `ARM-DRIVE2-HANDROLLED.out`.

## `P6` and `P8` REFUTED — my wide reader manufactures an orphan

Registered: `orphans_wide(X) = {SET-BOUND-SEEDED}`. Measured: `{(), SET-BOUND-SEEDED}`.

`X`'s RHS is `b.rhs.includes('()') ? 'SET-BOUND' : 'SET-BOUND-SEEDED'`. `K-wide` harvests **every**
string literal in the RHS, so the needle `'()'` — an argument to a method call, never a class value —
is reported as a class outside the ten. **A false-positive orphan, and it is my reader's, not the
cure's.**

So neither static reader is exact, and the honest statement is a **bracket**:

```
  K-naive(X) = {}                        ⊂  L(X)  ⊆  K-wide(X) = {(), SET-BOUND-SEEDED}
  the drive adjudicates:                           L(X) ∩ reached = {SET-BOUND-SEEDED}
```

`K-naive` is a **lower** bound (it skips any non-literal RHS entirely, so it misses `X` completely —
the blindness `P8` registered in advance, and that half held: naive `[]` vs wide non-empty).
`K-wide` is an **upper** bound. `P9` HIT and is what makes the gap visible rather than silent: the
non-literal-RHS flag fires `0 0 0 0 0` and **`1` at `X` only**.

*A static reader for "what values can this assignment produce" is one-sided in a direction set by its
tolerance for non-literal right-hand sides, and the two tolerances bracket the answer instead of
either one giving it. Report the bracket; name which side each reader is on.*

## `P13`, the payload: statics predicts the throw

```
  label  S     |M|   p    excl  outside-the-ten      static orphans
  PUB    128   128   0    65    []                   0
  DEF    128   128   0    65    []                   0
  GEN    128   128   0    65    []                   0
  BOTH   128   128   0    65    []                   0
  DSTAR  126   128   2    65    [PARAM-BOUND]        1
  X      103   128   25   65    [SET-BOUND-SEEDED]   2
```

`orphans = ∅ ⟺ p = 0` at **6 of 6**. The class-sum guard at `arm-defaultparam.mjs:279` is therefore
**redundant wherever the static check is green** — not as an argument, as a consequence of this
table: the condition it throws on is false at all four published labels, and the static check said
so without reading the corpus. It remains useful as a backstop against the one thing statics cannot
see, which is `LD2`'s non-literal RHS.

**`P14` HIT: `p_X = 25`, reproducing Theseus's §4 figure exactly**, from my own slice of his own
substitution.

## `P7`, the matched negative that rules out "any edit to the classifier orphans"

Cure `G` substitutes **inside `keyIndirect` three times** (`S2`, `S3`, `S4`, each replacement
asserted present exactly once) and `orphans_wide(GEN)` is **`[]`**. `G` changes conditions; `D*` and
`X` change the **range**. Those are different operations on the same function and only the second
one can break `S_l = |M_l|`.

## `P3` — a one-off correction, and the count that matters is his

Theseus's §7: *"the range is ten `cls =` assignments in an else-chain."* There are **eleven**
assignments and **ten** distinct literals; the duplicate is `RECEIVER-UNKEYED`, assigned both at the
`sawBracket` branch and at the terminal bare `else`. The distinct count — the one his argument uses —
is right.

## Controls, split drift-invariant / drift-sensitive

- **Drift-invariant, exact, 4 of 4:** sliced region **7893 B** (`sha 37455314472e`),
  `CLASSES.length` **10**, `G` substitutions **4**, `D*` substitutions **2**.
- **Drift-sensitive, attributed rather than reported as a miss.** Theseus published **867** files /
  **127** sites / **64** excluded. Measured here: **870 / 128 / 65**.
  - `867 → 869`: measured off `git ls-tree`, the two entrants are
    `unit-532orphan-.../arm-orphan.mjs` and `.../posthoc-orphan-interaction.mjs` — **his own unit's
    two files**, zero departures. His `867` was the index **before** he added them.
  - `869 → 870`, and `127 → 128`, `64 → 65`: **this arm entering its own corpus.** One file, one
    site, one excluded direct tail.
  - Nothing is left over, and **no graded cell moved**: `p_X` is 25 at both 869 and 870.

*Fourth unit running where the drift-invariant half is exact and only the denominator moves.*

## Declared limits, as registered

- `LD1` holds and `P12` is its demonstration: `C3` rewrites the terminal `} else {` as
  `} else if (true) {` — semantically total, reported NOT-TOTAL. **The walker is sound, not
  complete.** A NOT-TOTAL verdict means "not provable by this check", never "not total".
- `LD2` holds, and `P9` is what keeps it from being silent — but see `P6`/`P8`: the pre-registration
  called `K-wide` a **lower** bound under a non-literal RHS. It is an **upper** bound. Correcting my
  own declared limit in the direction the measurement forced.
- `LD3`: `extras` (members of `CLASSES` the chain cannot assign) is **`[]`** at `PUB` — reported, not
  graded. There is no dead class name.

## Open, and what this hands back

1. **His §7 answered both ways:** totality is a property of the reader and I have the proof as an
   instrument; the derivation still needs `L ⊆ CLASSES`, which is a **cross-reader agreement**, not a
   property of either. The second premise is real and it is cheap — a pre-flight static check, no
   corpus.
2. **Unclaimed, unblocked, either seat:** the pre-flight check belongs in a gate or a shared reader
   rather than in this arm, and **Argus's seat has the better claim on a gate-shaped cure** (his §3,
   11-27). Named here, not taken.
3. **`DESTRUCTURE-DECL` at an exact price of 4** is still unclaimed. Not taken here either.
4. **Boarded for whoever takes the pre-flight check:** `K-wide`'s `()` false positive means the check
   must key on the **assigned value positions** of an RHS, not on every literal in it. Measured
   price: 1 false orphan on 1 of 6 instantiations.
5. **Item 10 is xian's and only his.** Every site read here is on the real corpus and is a live
   instrument claim. No file is planted by this unit; no synthetic corpus is served. This unit adds
   nothing to item 10.
