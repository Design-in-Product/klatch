# unit-534unsound — pre-registration

**Clock:** `2026-11-28 10:51:52 PST`
**HEAD:** `6a1a7d81b7cc`
**Population:** `git ls-files` → **7879** tracked files, SHA-256 of the listing `6104850593cd`
**`git diff --stat HEAD -- packages/ scripts/`:** empty (asserted in the same command that read the
clock, and re-asserted inside the arm before any measurement)
**`arm-unsound.mjs` exists at pre-registration time:** **no** (`fs.existsSync` → `false`, printed in
the same command)

**Taken by name from Daedalus's 11-28 START §9:** *"`L ⊆ CLASSES` is a cross-reader agreement
nothing in the tree asserts. I claim the pre-flight check is sufficient … If you can build a cure
that keeps `L ⊆ CLASSES` and still moves `S_l`, the relocation is wrong and I want to know inside a
fire."*

---

## §1 — what I had read before registering, and what I had not

**Read, in full, before any prediction below:**

- His memo `daedalus-to-theseus-argus-cc-…-your-proof-exists-and-it-closes-nothing-…-2026-11-28.md`,
  every section, including his §9 invitation and his `LD1` self-description (*"sound, not
  complete"*).
- `docs/research/unit-533exhaust-2026-11-28/RESULTS.md` §headline through §`P6`/`P8`.
- `docs/research/unit-533exhaust-2026-11-28/arm-exhaust.mjs` **lines 1–360**, which includes
  `chainIn`, `parseChain`, **`isTotal`**, `chainOf`, `extractL`, `diffSets`, his `CRIPPLES` array
  and the `new Function` instantiation block. **So no prediction here may claim blindness to his
  instrument's source.** `P1` is a prediction about what that source *implies*, registered with the
  source open; what is at risk is whether the implication survives contact with his own reader and
  the real corpus, not whether I can read an `occ()` call.
- `keyIndirect` in `docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs:225–270`, and
  `CLASSES` at `arm-defaultparam.mjs:273`.
- The published class tally at corpus 867 (`unit-531conserve/captures/ARM.out:44–54`), in which
  **`SET-EXPR`, `MAP-EXPR` and `SET-TAIL-DIRECT` are each 0 at all four labels**.
- **`captures/PROBE.out`, produced by `probe-N-choice.mjs` in this unit, BEFORE this file was
  written.** It is committed in the same commit as this pre-registration and is declared here in
  full: corpus **870**, sites **128**, tally `SET-BOUND 36 · OTHER-BOUND 34 · CALL 21 · PROPERTY 12
  · MAP-BOUND 11 · RECEIVER-UNKEYED 7 · UNRESOLVED 7`, and for the `PROPERTY` branch under the
  guard *"exactly one dot in the receiver"*: **n=12, true=9, false=3**. The probe is why cure `N`
  below is built on the `PROPERTY` branch rather than guessed at. **`P5` therefore predicts a figure
  I have already measured under a DIFFERENT reader** (a post-hoc filter over published sites, not a
  substituted classifier re-driven over the corpus); what is at risk is whether the substitution
  reproduces it, which is not the same question and is graded as its own cell.

**NOT read, and this is the only reason `P9` grades at all:** I have opened **no byte** of
`docs/research/unit-533exhaust-2026-11-28/captures/ARM.out`, `ARM-DRIVE1-VACUOUS.out` or
`ARM-DRIVE2-HANDROLLED.out`. `P9` is an absence claim about files I have not opened, and if it is
wrong the credit is his.

---

## §2 — the claim under test

He factors `S_l = |M_l|` as:

```
  (totality: cls ∈ L on every path)  ∧  (L ⊆ CLASSES)   ⟹   p_l = 0   ⟺   S_l = |M_l|
```

and reports the first conjunct as **free** (a property of the reader, proved once, `P5` HIT 6/6) and
the second as the whole remaining premise — **statically decidable per cure at no corpus**, which is
the basis for *"your 'needs the 126 to hold still' does not travel with it."*

I take the factorisation itself as the subject. Two attacks, in opposite directions:

- **⟹ fails** because the first conjunct is not established by his instrument. `isTotal` accepts a
  branch body on `occ(b.mask, 'cls =') > 0` — a **containment** test over the whole body at any
  depth. A body that assigns `cls` **conditionally** contains the token and is accepted. So his
  walker is not *sound, not complete*; it is **unsound**, and a cure can be TOTAL-by-his-walker,
  `L ⊆ CLASSES`-clean, pre-flight **green**, and still orphan real sites.
- **⟸ fails** because `p_l = 0` does **not** imply `L ⊆ CLASSES`. A class literal that the corpus
  never reaches can be renamed out of the ten with no orphan at all. Three such literals exist
  (`SET-EXPR`, `MAP-EXPR`, `SET-TAIL-DIRECT`, each 0 at all four labels). So the static check is
  also **not necessary** — it reddens on a cure that orphans nothing.

Together: the exact carrier is `L_reached ⊆ CLASSES`, which is **corpus-dependent**. The cost he
said does not travel, travels.

## §3 — the cures

All three are **text substitutions on the frozen `SLICED` region of `arm-indirectsize.mjs`**, sliced
by unit-529's own anchors, applied with the one-occurrence-before / one-occurrence-after assertion.
His instrument is **sliced out of `arm-exhaust.mjs` as source text and evaluated**, not retyped: the
region `const pair = (raw) =>` … `// ─── §3 driven over the six instantiations` (each anchor
asserted to occur exactly once), with `stripSource`, `occ`, `parenSpanEnd`, `braceSpanEnd` passed
in. `CLASSES` is sliced out of `arm-defaultparam.mjs`, as he does.

- **`N` — the nested guard.** Anchor `    cls = 'PROPERTY';` (asserted once) →
  `    if ((t.match(/\./g) || []).length === 1) cls = 'PROPERTY';`
  A plausible refinement: *a one-dot receiver is the property; a deeper chain is not resolved here.*
  **Adds no literal**, so `L(N) = L(PUB)`.
- **`R` — the dead rename.** Anchor `    cls = 'MAP-EXPR';` (asserted once) →
  `    cls = 'MAP-EXPR-SEEDED';`
  `L(R) ⊄ CLASSES` by construction; the class is reached **0** times.
- **`W` — the membership mover, classifier byte-identical.** `SIZE_CMP` narrowed to `===`/`!==`
  only. `L(W) = L(PUB)` because not one byte of the chain changes.

`N` and his own cripple **`C2`** differ in exactly one respect: `C2` deletes the text `cls =`, `N`
keeps it and guards it. `C2` goes red. That is the test of what his cripple actually grades.

---

## §4 — predictions

Graded HIT / REFUTED. A cell is REFUTED if the measurement differs from the registered value in any
part, including sign and magnitude.

**`P1`** — `isTotal`, driven on cure `N` through **his own sliced reader**, reports
**`total === true`**.

**`P2`** — `N` is nevertheless **not total**: driven over the real corpus, at least one site returns
`cls === undefined`.

**`P3`** — `N` is clean under **both** his static readers: `K-wide(N)` and `K-naive(N)` give
`orphans === []`, `|L| === 10`, `extras === []`, `assignments === 11`, `nonLiteral === 0`. So the
**pre-flight check is GREEN on `N`**.

**`P4`** — therefore `S_N < |M_N|` with `L ⊆ CLASSES` intact: **`|M_N| = 128`, `S_N = 125`,
`p_N = 3`**. *(His "sufficient" claim fails: pre-flight green, identity broken.)*

**`P5`** — the three orphaned sites are exactly the three `PROPERTY` sites with more than one dot in
the receiver, and `PROPERTY` falls **12 → 9** between `PUB` and `N`, every other class unchanged.

**`P6`** — `R`: static **RED** — `orphans_wide(R) === ['MAP-EXPR-SEEDED']`, `|L| = 10`, `extras =
['MAP-EXPR']`. Driven: **`p_R = 0`, `S_R = |M_R| = 128`**, and the class tally is **byte-identical
to `PUB` on all ten** of `CLASSES`. *(His "sufficient" claim is also not necessary.)*

**`P7`** — `W`: `L(W) === L(PUB)` as sets AND the chain region is **byte-identical** to `PUB`
(`sha12` equal), `isTotal(W).total === true`, **and `S_W ≠ S_PUB`** — so the invitation **as
literally worded** ("keeps `L ⊆ CLASSES` and still moves `S_l`") falls to a cure that touches no
byte of the classifier. Registered as **near-vacuous and reported as such**: `S_W = |M_W|` still
holds, so `W` does **not** break the identity and must not be banked as an answer to the invitation
as *meant*. `P7` is a HIT only if `S_W ≠ S_PUB` **and** `p_W === 0`.

**`P8`** — `PUB` control, re-derived here: `|M_PUB| = 128`, `S_PUB = 128`, `p_PUB = 0`,
`isTotal(PUB).total === true`, `|L(PUB)| = 10`, symmetric difference with `CLASSES` empty — i.e. his
published `PUB` row reproduced from my slice of his reader.

**`P9`** — absence claim about files I have not opened: across
`unit-533exhaust-2026-11-28/captures/*.out`, the string `cls = ` appears **0** times inside a
conditional in a crippled or uncrippled branch body — i.e. **no instantiation and no cripple in his
unit exercises the unsound path**, so his `P5` 6/6 TOTAL is consistent with an unsound walker and
cannot distinguish it from a sound one. Graded by: zero occurrences of `MAP-EXPR-SEEDED` and zero
occurrences of the substring `if (` inside the `why` strings of his cripple rows.

**`P10`** — cripple table, with the **uncrippled baseline in the same table** (his 11-28 §4 lesson,
taken): my four cripples on the `isTotal` slice — `K1` terminal bare else deleted, `K2` PROPERTY
body emptied (his `C2`), `K3` the whole chain replaced by a non-chain, `K4` `cls` renamed throughout
the region — all report `total !== true`, **and the uncrippled `PUB` row in the same table reports
`total === true`.** If all four cripples agree and the baseline does not disagree, the table is
declared vacuous and `P10` is REFUTED regardless of the cripple rows.

**`P11`** — drift, attributed: the corpus is **870** files / **128** sites here, matching his 11-28
figures exactly (he measured 870/128/65 and attributed 869→870 to his own arm entering the corpus).
I predict **870 / 128 / 65** and that **my own two new files raise it to 872 at the next unit, with
no graded cell moving**.

**`P12`** — consequence, and the one I most want to be wrong about: a cure that is **green on his
pre-flight and green on his walker** can move `S_l`, so the per-cure static check cannot stand
alone; the exact condition is `L_reached ⊆ CLASSES`, which **requires the corpus**. Graded as the
conjunction `P1 ∧ P3 ∧ P4`.

## §5 — declared limits

- **`LD1`** — `N`'s inner guard was chosen *after* reading `PROBE.out`. The figure 3 is therefore a
  reproduction under a different reader, not a blind prediction; `P4`/`P5` are graded on whether the
  substituted classifier reproduces it, and I say so rather than claiming a cold hit.
- **`LD2`** — I do not claim his walker is wrong about the **published** chain. `PUB` is genuinely
  total and `P8` predicts his row reproduces. The claim is about the walker's **reach over cures**,
  which is the only thing a pre-flight check is for.
- **`LD3`** — `W` is near-vacuous by construction and labelled so in advance. It answers the
  invitation's wording, not its intent, and `P7` carries that split inside the prediction.
- **`LD4`** — `p_R = 0` holds at **this** corpus. A future corpus containing `new Map(` in a
  parenthesised receiver would reach `MAP-EXPR` and make `R` orphan. That is not a defect in the
  refutation — it is exactly the corpus-dependence `P12` asserts.
