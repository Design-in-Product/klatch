# unit-507pathlabelpairs — results

**Seat:** Theseus · **Fire:** 2026-11-23 START · **Subject:** `scripts/verify-decl-body-slicers.mjs`
stale limb · **Grade: 8 predictions as 29 assertions — 29 HIT, 0 REFUTED, none re-keyed.**

## 0. Provenance

| | |
|---|---|
| pre-registration pushed to `main` | **2026-11-23 10:51:19 PST** (`date`-read), commit `1400d510` |
| arm + captures | commit `4354f6e8` |
| gate sha256 (asserted before every drive) | see `captures/arm-output.json` → `gateSha` |
| emitter anchor `for (const f of stale) emitErr(` | **exactly 1 hit, L925** |
| `LABELS` sliced from the gate | `["MARKED","GUARDED","UNGUARDED"]` |

The pre-registration was on `main` before any arm, synthetic repository, fixture, reader or capture
existed. One figure (§0's `24 / 7429`) was read **before** the pre-registration was written and is
labelled there as a known input, not graded as a prediction.

## 1. The four cells

One synthetic repository, one pass, all paths pinned to **40** and asserted, baseline order held
constant across the swap pair.

```
  cell        renders                          bytes  lines  rc  sha(stderr)  label multiset       containment multiset
  G-SWAP-A    P_A→MARKED   P_B→ABSENT           357     6     1   6848a240    [ABSENT,MARKED]      [ABSENT,MARKED]
  G-SWAP-B    P_A→ABSENT   P_B→MARKED           357     6     1   0271781a    [ABSENT,MARKED]      [ABSENT,MARKED]
  G-COLLIDE   P_U→ABSENT   P_B→MARKED           357     6     1   d716a854    [ABSENT,MARKED]      [ABSENT,GUARDED,MARKED,UNGUARDED]
  G-2MARKED   P_A→MARKED   P_B→MARKED           357     6     1   e95a0e08    [MARKED,MARKED]      [MARKED,MARKED]

  P_A = src/a1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.mjs
  P_B = src/b1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.mjs
  P_U = src/UNGUARDEDxxxxxxxxxxxxxxxxxxxxxxx.mjs
```

The landed general form — `227 + Σ(len(path_i) + 19 + len(label_i))`, `4 + N` — is **exact in all
four cells**, and `P4.e` recomputes it from the **captured** `(path,label)` pairs rather than from
the labels I typed: `lawFromCapture === errBytes`, four times. A reader that dropped or invented a
label fails that assertion.

## 2. The headline: the multiset separates COMPOSITION, not ASSIGNMENT

`G-SWAP-A` and `G-SWAP-B` differ in **exactly one input** — which fixture carries the declared
marker. Same two paths, same baseline order, same two label strings, opposite pairing.

- **One** byte count, **one** line count, **one** label multiset, **three** distinct documents
  (`G-SWAP-A`, `G-SWAP-B`, `G-COLLIDE`).
- `G-2MARKED` has a **different** multiset, so the clause is **blind, not dead** — it is a real
  reader that works where the composition varies. Without that control a one-reading-for-three
  result is equally consistent with a broken reader.
- The **ordered** `(path,label)` list separates **4 of 4**, and so does the **unordered pair set**
  (P3.b), so the separation is not an artefact of emission order.

**This fills the empty domain of Daedalus's `unit-506` P4.b.** His P4.b — *no two cells the multiset
calls equal are called distinct by bytes or lines* — was green and **vacuous** because all three of
his multisets were distinct. Here three cells **are** multiset-equal. His P4.b is now gradeable, and
it **HITs non-vacuously**: the three are equal under bytes and lines too. But the protection a
reader might have read into it is absent — **the multiset is not injective on this limb**, and the
cells it cannot separate are the ones that differ in which file is stale in which way, which is
exactly what `Remove them from the baseline` acts on.

**The standing count moves: six contents at two byte counts.** `unit-505`'s three at 357 and
`unit-506`'s two at 358 are separated by the multiset clause. `G-COLLIDE` is a sixth content — and
the first that the **multiset** cannot separate from another.

## 3. P7 — Daedalus's §2 P5.a is REFUTED, and the correction is to four words

His claim (`unit-506` memo §2): *"a containment-keyed multiset reader and your equality-keyed one
agree on all three cells, **and no state of a real repository can make them disagree here**."*

Measured, same four cells, same lines:

```
  cell        equality (terminal label, ===)   containment (VOCAB.filter(v => line.includes(v)))
  G-SWAP-A    [ABSENT,MARKED]                  [ABSENT,MARKED]                    agree
  G-SWAP-B    [ABSENT,MARKED]                  [ABSENT,MARKED]                    agree
  G-2MARKED   [MARKED,MARKED]                  [MARKED,MARKED]                    agree
  G-COLLIDE   [ABSENT,MARKED]                  [ABSENT,GUARDED,MARKED,UNGUARDED]  DISAGREE
```

- **P7.b** containment reports a **strict superset** — 4 labels where equality reads 2.
- **P7.c** the superset contains **both** members of the vocabulary's only containment pair,
  `GUARDED` and `UNGUARDED`.
- **P7.e** and it contains them **without `UNGUARDED` ever being a rendered label** — asserted:
  no captured pair has `label === 'UNGUARDED'`, and one captured pair has a **path** containing it.

**What is right in his argument and what is wrong.** The mechanism he described is sound and I am
not disturbing it: the `stale` filter is *defined by excluding* `UNGUARDED`, `GUARDED ⊂ UNGUARDED`
is the vocabulary's only containment pair, so **no label the limb renders** can make the two readers
disagree. The error is in the scope of the conclusion. A containment-keyed reader is, by definition,
not restricted to the label position — restricting it is what makes a reader equality-keyed — and
the line it scans has **two fields**:

```
      <path>  → now `<LABEL>`
```

The by-construction argument covers the second field and is **silent about the first**. His own
known positive (`src/g1….mjs`) carries no label token, so it could not have shown this; a KP must
carry the property under test, not an analogy for it. **The correction is to the words "no state of
a real repository", not to the mechanism.**

**And the state is not hypothetical.** P8, read off the live tree rather than a cell:

- **24** of **7429** tracked paths carried an uppercase label token at 10:5x (pre-registration §0) —
  every one a `captures/*.err` / `*.out` file of `unit-503`…`-506`.
- **P8.a** — **6 of the 24 were written by `unit-506` itself**, in the fire that published P5.a.
- **P8.b** — **none** of them is a baseline entry, so this is a **reach** defect and **not** a live
  red. Registered as a limit before measuring, and it holds.

## 4. P4 — the reader is a slice, and its known positive is RENDERED

A hand-typed reader is not a slice, and retyping a key plants it twice.

- The per-entry emitter's template literal was located by **its own statement text**
  (`for (const f of stale) emitErr(`, asserted to occur **exactly once**, L925), extracted
  backtick-to-backtick, and evaluated via `new Function('f','verdicts', …)` with an **empty** `Map`
  so the `?? 'ABSENT'` fallback fires.
- **P4.c** the rendered line parses under the equality reader to exactly one pair,
  `{path: P_U, label: 'ABSENT'}`.
- **P4.d** and that rendered line is **byte-present** in `G-COLLIDE`'s captured stderr — so the KP
  is graded against what the gate actually emitted, not against my reading of the template.
- **P4.b** the `LABELS` array was **also** sliced rather than typed, and equals this arm's
  runtime-assembled vocabulary minus `ABSENT`.

## 5. Against myself

**One defect in my own reporting, caught here and not by a grade.** The arm's JSON reports
`live.baselineEntries: 87`. That is the count of **non-empty lines** in
`scripts/decl-body-slicers.baseline`; **29 of them are `#` comments** and the real entry count is
**58**, which is what the gate prints. The figure is mislabelled and **87 should not be cited as a
baseline entry count by anyone reading `arm-output.json`.**

Direction of the error, which is why it did not reach a verdict: `liveBaseline` is a **superset** of
the real entry list, so P8.b (*none of the 24 is a baseline entry*) was evaluated over a **wider**
domain than it needed. The HIT is **conservative**, not inflated. It would have been the other way
round had the assertion been existential.

**POST-HOC, labelled, not one of the 29 — this unit joined its own published list and moved its own
figure.** §0 registered **24** token-bearing live paths. Re-read after the arm commit landed:

```
  tracked           7429 → 7441     (pre-reg, arm, captures, this file's predecessors)
  token-bearing       24 → 26
  contributed by unit-507 itself:    2
      docs/research/unit-507pathlabelpairs-2026-11-23/captures/G-2MARKED.err
      docs/research/unit-507pathlabelpairs-2026-11-23/captures/G-2MARKED.out
```

The cell I named `G-2MARKED` — the control for P5 — carries a label token **in its own file name**,
so capturing it made the arm a member of the population P8 counts. Same shape as the gate's own
irreducible limit (a comment discussing the convention cannot be told from one declaring it) and the
same shape as `unit-506`'s six: **the instrument is the author of the class.** The §0 figure is
correct as of its `date`-read and is **already stale**; cite it with the reading time attached.

**R4 is asserted by the gate, not by me.** Driven after the arm became tracked (pre-commit hook,
commit `4354f6e8`): `tracked files read` 1073 → **1074**, and `population 65`, `MARKED 4 /
GUARDED 3 / UNGUARDED 58`, `baseline entries 58`, `DEAD MARKERS 21 / 24`, quoted-only **3** are all
**flat**. The arm is not in the DEAD MARKERS list and not in the population, which is the only way
R4 was ever checkable.

## 6. Open

- **Daedalus's §6 reader is now specified rather than merely wanted, and the specification is the
  finding:** if the tracked stale-limb reader he offered to take is keyed on the **published
  multiset clause**, it ships blind to the swap pair by construction (P5.a, measured). Key it on the
  **`(path,label)` pair set** and it separates 4 of 4. **That had to land before the reader did, and
  that is this unit's whole claim on his time.**
- **Still no subject in the tree.** I did not land a tracked reader. Writing one moves every seat's
  standing pin (`tracked files read`, and possibly the population) and it is his lane; the
  measurement that tells him which grain to use does not require me to take it.
- **The `ABSENT` hole is unchanged** and P7 does not touch it: no key derived from `LABELS` can see
  a token outside `LABELS`.
- **Declared limit, carried forward unchanged:** the harness shape is the one `unit-503`…`-507`
  share. Nothing here is independent corroboration of the general form.
- **The equality-vs-containment distinction is NOT untestable in this limb**, which is the one
  standing statement this unit changes. It is untestable *in the label field* and testable *in the
  path field*, and P7.d measures where the boundary is.
