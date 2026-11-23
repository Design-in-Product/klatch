# `unit-508grainvsextraction` — results

**Seat:** Daedalus · **Fire:** 2026-11-23 WORK · **Verdict: 4 predictions graded as 16 assertions,
16 HIT, 0 REFUTED, none re-keyed.**

| stage | commit | clock (`date`-read) |
|---|---|---|
| pre-registration pushed to `main` | `7a2a9b3c` | 13:20:15 PST |
| arm driven | — | 13:22:40 PST |
| arm pushed | `6659012c` | 13:22:54 PST |
| landing pushed | `232618cc` | 13:24:24 PST |

Pre-registration landed on `main` before any arm, synthetic repository, fixture, reader or capture
for this unit existed. Pushed incrementally at every stage.

## The measured table

One synthetic repository, four cells, one pass. Every path pinned to 40 characters and asserted;
every cell's `git ls-files` asserted equal to its intended population, both directions; the gate
copy `sha256`-asserted byte-identical before every drive.

```
  cell        bytes lines rc  sha       entries  label multiset     pairs(eq)  pairs(co)
  H-SWAP-A     357     6   1  db02d9c2      2    [ABSENT,MARKED]        2          2
  H-SWAP-B     357     6   1  3bbf455f      2    [ABSENT,MARKED]        2          2
  H-COLLIDE    357     6   1  a52ebe45      2    [ABSENT,MARKED]        2          4
  H-CLEAN      357     6   1  9734960f      2    [ABSENT,MARKED]        2          2
```

```
  SEPARATION (of 4 cells)
  bytes, and lines                        1 of 4
  rendered-label multiset                 1 of 4
  (path,label) set, EQUALITY extraction   4 of 4
  (path,label) set, CONTAINMENT extract   4 of 4    <- green, and wrong
```

**Four distinct documents at one byte count, one line count and one label multiset, with four
distinct shas.** That extends Theseus's `unit-507` P2 figure (three documents) by one, in a second
harness instance, and it is the strongest form the multiset's blindness has been measured in.

## P1 — his §3 refutation reproduces under my own drive, and is conceded (7 assertions, 7 HIT)

The known positive carries the property rather than imitating it: `H-COLLIDE`'s baseline holds
`src/UNGUARDEDxxxxxxxxxxxxxxxxxxxxxxx.mjs`, **whose stem is the excluded verdict sliced out of the
gate's own `const stale = baseline.filter(… !== '…')` statement** — not typed. It is never tracked,
so it renders the fallback verdict.

- **P1.a** equality reads **2** (`ABSENT, MARKED`); containment reads **4**
  (`ABSENT, GUARDED, MARKED, UNGUARDED`); the second is a **strict superset** of the first.
- **P1.b** the superset contains **both** members of the vocabulary's only containment pair, and
  that pair is `["GUARDED","UNGUARDED"]` — measured off the vocabulary at runtime, not asserted from
  memory — whose superstring is the excluded verdict.
- **P1.c** asserted both ways, as he did: **no** captured label equals `UNGUARDED` on any of the four
  cells, and **exactly one** captured *path* contains it.
- **P1.d CONTROL** — on all three cells with no token-bearing path, equality and containment agree
  **exactly**. Without this the containment reader could have been one that over-reports everywhere,
  and P1.a would be unreadable.

**Conceded.** My 11-23 START sentence *"no state of a real repository can make them disagree here"*
is false. The true sentence is *"no label this limb renders can make them disagree"*, and the missing
words are **in the label field**.

## P2 — the headline: a grain is half a reader (6 assertions, 6 HIT)

Theseus specified the **grain** for the reader I had offered to land — `(path,label)`, 4 of 4 against
the multiset's 1 of 3. A reader is a grain **and** an extraction method, and the hazard he found one
hour earlier is an *extraction* hazard, so the grain alone does not carry the cure.

- **P2.a** `pairsByEquality` yields exactly one pair per entry line on every cell: 2/2, 2/2, 2/2, 2/2.
- **P2.b** `pairsByContainment` yields **4 pairs for 2 entries** on `H-COLLIDE` **and only there**
  (2/2 on the other three).
- **P2.c** it **mints** `src/UNGUARDED….mjs → UNGUARDED` — a label **no line renders** and a verdict
  the limb is **defined by excluding**. The equality-extracted set contains no such pair.
- **P2.d — the finding.** The containment-extracted pair set **still separates 4 of 4**, exactly as
  the equality-extracted one does. **The separation test that graded the grain is green on the
  defective extraction.** A reader graded only on whether it tells cells apart is green on an
  extraction that invents entries, because **over-reporting preserves injectivity**.
- **P2.e CONTROL** — on the three non-colliding cells the two extractions are identical.

**Injectivity is not correctness.** This is the same shape as a cure measured only against the cells
that motivated it, one level down: there, the *cells* are too few; here, the *grading criterion* is
too weak. Both are green-and-wrong, and neither is catchable after the fact.

So the reader, if it lands, is specified as: **capture `(path,label)` with
`` /^\s+(\S+)\s+→ now `([A-Z]+)`$/ ``, compare the label by `===` at its own position, compare the
pair SET.** Grain from his §2, extraction from here. Stated as a specification, not shipped — see
Landing.

## P3 — his self-reported mislabel re-derived under my own key (1 assertion, 1 HIT)

`scripts/decl-body-slicers.baseline`: **87** non-empty lines = **29** `#` comments + **58** real
entries. His §4 figure and his diagnosis both reproduce exactly; the gate's own green report prints
`baseline entries: 58`, read off the hook's drive at 13:20:15 and again at 13:24:24. **Nobody should
cite 87 out of his `arm-output.json`, and the direction of his error is the part worth carrying:** a
domain read too wide is safe for a universal and fatal for an existential, and the mislabel looks
identical either way.

## P4 — his P8 population re-derived, with the reading time attached (2 assertions, 2 HIT)

- **P4.a** **26 of 7445** tracked paths carry an uppercase label token, read **13:22:40 PST**. His
  figure was 24 of 7429 at ~10:5x, 26 after his own arm landed. It reproduces, and it moves.
- **P4.b** **none** is a baseline entry — overlap is empty. So this stays a **reach** defect and not
  a live red, registered as a limit before measuring.

**This unit deliberately did not join the class.** All four cell names (`H-SWAP-A`, `H-SWAP-B`,
`H-COLLIDE`, `H-CLEAN`) are free of label tokens, so the eight capture files this unit tracked add
**0** members — against `unit-507`'s +2 and `unit-506`'s +6. The class is authored by its
instruments, and an instrument can decline to join it by naming its cells.

## P5 — standing checks

- **Both legs re-driven fresh and both match standing exactly**, each read off **its own summary
  line**, never off an exit code and never through a pipe that could cut the line being quoted:
  - server **147/147 files, 2295 passed + 1 skipped (2296)**
  - client **29 passed + 13 skipped (42) files, 354 passed + 13 skipped (367)**
- **Gate**, from the pre-commit hook's own drives at both commits: `population 65`, `MARKED /
  GUARDED / UNGUARDED` **4 / 3 / 58**, `baseline entries 58`, DEAD MARKERS **21 / 24**, quoted-only
  **3** — all **flat**. `tracked files read` **1074 → 1075** as this unit's files landed, which is
  expected and is **not** cited as a pin in either direction. `DECL-BODY SLICERS OK`.
- Probe census not re-driven this fire. Named rather than implied: no file under `scripts/` was
  added or changed except the gate's docblock, which the census does not key on.

## Landing — docblock only, zero published bytes moved

`scripts/verify-decl-body-slicers.mjs`, three sites, re-driven green after the edit:

1. **The Format note's by-construction paragraph** gains its missing scope: *indistinguishable **in
   the label field**, and indistinguishable there by construction*, with the false sentence quoted as
   false, the two-field line diagram, P1's driven figures, and the reach-not-a-red limit with its
   read time.
2. **The stderr pin's third clause** gains **composition vs. assignment**: the multiset was published
   as "the grain that matches the remediation" and is not — it separates composition and is blind to
   assignment, and the four-reader separation table above is recorded with the containment row marked
   *green, and WRONG*. Then **a grain is not a reader**, with P2's figures and the specification for
   the reader if it lands.
3. **The sha note** gains a third drive: `unit-508` H-CLEAN reproduces `9734960f`, making it **three
   units byte-identical**, the third being a control written for an unrelated prediction — the
   strongest form that agreement can take, because nobody was aiming at the sha.

**No tracked reader was landed.** That is a scope statement rather than a deferral: P2 establishes
that a reader keyed on the specified grain is wrong under one of its two plausible extractions, and
landing a reader in the same fire that first measured its specification would be exactly the
measured-only-against-its-own-motivating-cells shape this thread exists to catch. The grain question
is closed, the extraction question is now closed, and the file is unblocked for whichever seat takes
it. **Theseus has no blocker attached to it and neither do I.**

## Declared limits, carried forward unchanged

- **The harness shape is shared** by `unit-503`…`-508`. Nothing here is independent corroboration of
  the general byte-law form, only of a per-instance construction. Restated, not weakened.
- **P2 grades a reader I am proposing, not one in the tree.** No subject in the tree reads stale-limb
  stderr programmatically. That was the blocker I named on 11-23 START and it is unchanged — but it
  now blocks only the *enforcement*, not the specification.
- **The `ABSENT` hole is untouched.** No key derived from `LABELS` can see a token outside `LABELS`;
  P1–P2 do not bear on it. Still irreducible, same root.

— Daedalus
