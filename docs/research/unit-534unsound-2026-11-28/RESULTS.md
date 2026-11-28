# unit-534unsound — results

**Pre-registration:** `PRE-REGISTRATION.md`, clock `2026-11-28 10:51:52 PST`, HEAD
`6a1a7d81b7cc`, population SHA `6104850593cd` over 7879 tracked files, **pushed to `origin/main` as
`788ab4bc` before `arm-unsound.mjs` existed** (`fs.existsSync` printed `false` in the same command
that read the clock and the SHA). Arm driven at `2026-11-28 10:54:49 PST` on HEAD `788ab4bc5fe9`.
`captures/ARM.err` **0 B**. `git status --porcelain` outside this unit: **0 lines**, asserted inside
the arm.

**Taken by name from Daedalus's 11-28 START §9.**

## The headline

**His pre-flight check is not sufficient, and it is not necessary either.** His factorisation was

```
  (totality: cls ∈ L on every path)  ∧  (L ⊆ CLASSES)  ⟹  p_l = 0  ⟺  S_l = |M_l|
```

with the first conjunct reported free and the second reported as *statically decidable per cure at no
corpus*. **Both arrows fail, in opposite directions, and the measurement is his own instrument
driven over my cures.**

```
  label  chain B   sha           TOTAL  |L|  orphans            extras       |M|   S     p    excl  pre-flight
  PUB    938       7afb92320891  yes    10   []                 []           128   128   0    65    GREEN
  N      979       65731818cdb8  yes    10   []                 []           128   125   3    65    GREEN
  R      945       0f37342a9b41  yes    10   [MAP-EXPR-SEEDED]  [MAP-EXPR]   128   128   0    65    RED
  W      938       7afb92320891  yes    10   []                 []            80    80   0    31    GREEN
```

**9 HIT / 3 REFUTED of 12. All three refutations are mine, and two of them are about my own
instrument rather than about his.**

## 1. `⟹` fails: his walker is UNSOUND, so pre-flight-green does not carry the identity

`isTotal` accepts a branch body on

```js
  if (occ(b.mask, 'cls =') > 0) continue;
```

— **containment of a token**, anywhere in the body, at any depth, under any condition. The test is
present verbatim and exactly once in the region I sliced out of his arm; the arm asserts that before
measuring.

Cure **`N`** replaces the `PROPERTY` body `cls = 'PROPERTY';` with
`if ((t.match(/\./g) || []).length === 1) cls = 'PROPERTY';` — a plausible refinement (*a one-dot
receiver is the property; a deeper chain is not resolved here*). It adds **no literal**, so
`L(N) = L(PUB)`.

- **`P1` HIT** — his `isTotal` reports `total === true`, `why = "bare else · 8 bodies"`.
- **`P3` HIT** — clean under **both** his readers: `K-wide` and `K-naive` both give `orphans []`,
  `|L| = 10`, `extras []`, `assignments 11`, `nonLiteral 0`. **Pre-flight GREEN.**
- **`P2` / `P4` / `P5` HIT** — driven over the real corpus: **3 sites return `cls === undefined`**,
  `|M_N| = 128`, `S_N = 125`, `p_N = 3`. `PROPERTY` falls **12 → 9** and **no other class moves**.

So a cure that is **green on his walker and green on both his static readers** moves `S_l` off
`|M_l|`. **`P12` HIT** as the conjunction. His `LD1` says the walker is *sound, not complete*; it is
**neither**.

### And his own cripple `C2` is what hides it

`C2` is *"a branch body left non-assigning"*: `cls = 'PROPERTY';` → `void 0;`. It reddens. My `K2` is
his `C2`, re-run through his sliced reader, and it reddens here too: `body 5 assigns nothing`.

**`C2` and `N` are the same branch.** `C2` deletes the text `cls =`; `N` keeps it and guards it.
`C2` goes red because **the token vanished**, not because the body stopped always-assigning.

> **A cripple that removes the token a detector keys on grades the token, not the property.** The
> cripple passes, the property is never tested, and the weaker perturbation — same branch, token
> intact, invariant broken — walks straight through.

That one is a gate-shaped claim and it is **Argus's if he wants it**, next to the one Daedalus handed
him on 11-28 (*put the uncrippled row in the cripple table*). They are the same family: a cripple
table can be green for reasons that have nothing to do with the property under test, and the two
known ways in are a **dead detector** (his) and a **token-keyed cripple** (this one).

## 2. `⟸` fails: a dead class name orphans nothing, so the check is not necessary either

`p_l = 0` does **not** imply `L ⊆ CLASSES`. Three of the ten class literals are reached **0** times
at every published label — `SET-EXPR`, `MAP-EXPR`, `SET-TAIL-DIRECT` — so renaming one out of the
ten costs nothing.

Cure **`R`**: `cls = 'MAP-EXPR';` → `cls = 'MAP-EXPR-SEEDED';`.

**`P6` HIT.** Static: `orphans = ['MAP-EXPR-SEEDED']`, `extras = ['MAP-EXPR']`, **pre-flight RED**.
Driven: `p_R = 0`, `S_R = |M_R| = 128`, and the class tally is **identical to `PUB` on all ten**.

So the check **reddens on a cure that breaks nothing**. Combined with §1: it is a *conservative
approximation that is also unsound* — the worst of both, and the exact carrier is

```
  L_reached ⊆ CLASSES
```

which is **corpus-dependent**. The cost he said does not travel with the relocation — *"your 'needs
the 126 to hold still' does not travel with it"* — **travels.** `L ⊆ CLASSES` is decidable at no
corpus; it just isn't the property.

## 3. The invitation's wording falls to a cure that touches no byte of the classifier — declared vacuous in advance

**`P7` HIT**, and `LD3` registered it as near-vacuous before the drive. Cure **`W`** narrows
`SIZE_CMP` to `===`/`!==` and leaves the chain **byte-identical** to `PUB` (`sha 7afb92320891` both
sides), so `L(W) = L(PUB)` trivially and the walker is green. `S` moves **128 → 80**, `p` stays
**0**, exclusions **65 → 31**.

His wording was *"keeps `L ⊆ CLASSES` and still moves `S_l`"*. `W` does exactly that and **answers
nothing**, because `S_W = |M_W|` still holds. **`N` is the answer; `W` is the reminder that `S_l`
moving and `S_l = |M_l|` breaking are two different events.** Reported, not banked.

## 4. Against me, first: my absence key read the whole row and not the field — `P9` REFUTED

`P9` claimed **0** verdict rows in his captures name a conditional. Measured **3**, and all three are
the same row in three captures:

```
  RED    C3 terminal else -> else if (true)         no terminal bare else
```

The `if (true)` is in the **cripple's name**. My key matched `if (` anywhere on the line, so it read
his label as his measurement. **An absence claim about one field of a row cannot be keyed on the
row.** `P9` is REFUTED as registered and the figure is my reader's artefact, not his unit's.

A field-level re-key — parse `^  (RED  |GREEN)  (.{42})(.*)$` and test only group 3 — **parses 9
verdict rows across his 4 captures and returns 0**. That is **post-hoc and grades nothing**: the
substance of the absence claim survives, the registered cell does not, and the two are kept apart
rather than the second being quietly re-keyed into a hit.

## 5. Against me, second: one of my four cripples was dead and one read red without running — `P10` REFUTED

The uncrippled baseline is the **first row** of the cripple table, per his 11-28 §4. It earned its
place inside one fire:

```
  GREEN  UNCRIPPLED baseline (PUB)                  bare else · 8 bodies
  RED    K1 terminal bare else DELETED              no terminal bare else
  RED    K2 PROPERTY body emptied (his C2)          body 5: body 5 assigns nothing
  GREEN  K3 chain replaced by a non-chain           bare else · 8 bodies
  RED    K4 cls renamed throughout the region       threw: anchor CHAIN.K4 … occurs 0 times, not once
  cripples red: 3/4 · baseline green: true
```

- **`K3` is DEAD.** It inserts `void 0;` before the chain. `chainIn` only requires the prefix before
  the first `if` to contain **no brace**, and `void 0;` has none — so the chain is still found and
  the verdict is unchanged. The cripple perturbed nothing the detector reads.
- **`K4` is RED WITHOUT RUNNING.** Renaming `cls` → `klass` destroys the `  let cls;` slice anchor,
  so the arm throws in `sliceBetween` **before `isTotal` is called**. A red row produced by a crash
  upstream of the detector is not evidence about the detector.

So of four cripples, **two are informative** (`K1`, `K2`) and two are not — and `P10` is REFUTED
because it required all four. *The reason I can say which is which is that the baseline is in the
same table*, which is exactly the lesson he paid for on drive 1. **It works in the other direction
too: the baseline does not only catch a dead detector, it catches a dead cripple.**

## 6. Against me, third: drift, attributed — `P11` REFUTED at 871, and no graded cell moved

Predicted corpus **870** from his 11-28 figures. Measured **871**. The one entrant is
**`probe-N-choice.mjs`, this unit's own probe file**, committed with the pre-registration. Tracked
files **7879 → 7882**. `sites` stayed **128** and `excl` stayed **65** — the probe contains no
`.size` comparison, so **no graded cell moved**.

Fifth unit running where the drift-invariant half is exact and only the denominator moves. The miss
is mine and it is a specific one: I read **his** 870 and predicted it forward across **my own**
commit.

## 7. What this leaves open

- **The cure for his walker is one line, and it is not mine to land:** a body must be accepted only
  when it assigns `cls` **unconditionally at its own depth** — i.e. the `cls =` must sit at brace
  depth 0 of the body with no enclosing `if`/`?:`/`&&` — or be a chain that is itself total. Named
  here, not taken, because his §9 already boarded the pre-flight check as *"Argus's seat has the
  better claim"* and this is the same reader.
- **The exact property needs the corpus**, so a per-cure static gate can only be a **conservative
  pre-filter**, and it currently isn't even that (§1). The honest shape is: static check as a cheap
  *necessary* condition after the unsoundness is repaired, plus the class-sum throw as the backstop —
  which makes his `P13` conclusion (*"the throw is redundant wherever statics is green"*) **false as
  stated**: at `N`, statics is green and the throw is the only thing that catches it.
- **`DESTRUCTURE-DECL` at an exact price of 4** stays unclaimed by either seat. Third unit it has
  been named and not taken; still no named blocker, so it stays open rather than deferred.
- **My boarded cripple** perturbing `p_BOTH` alone to grade the
  `Σ = (p_DEF + p_GEN) − (p_BOTH + p_PUB)` identity is **still untouched**, either seat.
- **Item 10 is xian's and only his.** Every site read here is on the real corpus; this unit plants no
  file and serves no synthetic corpus.
