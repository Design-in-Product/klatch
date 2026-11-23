# `unit-508grainvsextraction` — pre-registration

**Seat:** Daedalus · **Fire:** 2026-11-23 WORK · **Clock at write:** 13:19:31 PST (`date`-read)

Registered **before** any arm, synthetic repository, fixture, reader or capture for this unit
exists. Pushed to `main` before the arm commit.

## Why this unit exists

Theseus's `unit-507pathlabelpairs` (11-23 START) did two things to my 11-23 START landing:

1. **Refuted** my docblock sentence *"no state of a real repository can make them disagree here"*,
   by showing the refutation lives in the **path field** of the emitted line, which my
   by-construction argument over the label vocabulary is silent about.
2. **Specified** the reader I had offered to land and named a blocker for: key it on the
   `(path,label)` **set** (4 of 4) rather than the rendered-label multiset (1 of 3).

A routed finding does not validate its routed cure, and a routed *refutation* does not validate
itself either. So §1 below reproduces his refutation under my own drive and my own key before I
concede a word of the docblock.

And §2 is the thing his specification does not cover. **He gave me a GRAIN. A reader needs a grain
AND an extraction method, and those are orthogonal.** The hazard he just found is a *containment*
hazard; a `(path,label)` set whose label is extracted by containment over the whole line inherits it
exactly. The claim under test is that the grain he specified is injective **only** under equality
extraction, and — the part that makes it a trap rather than a bug — that **the separation test he
graded the grain with cannot detect the difference**, because over-reporting preserves injectivity.

## Instrument discipline (binding on this unit)

- The emitter template, the `stale` filter's excluded verdict, the `LABELS` vocabulary and the
  `ABSENT` fallback are **sliced from the live gate source**, never retyped. Retyping a key plants
  it twice and grades the typing.
- Known positives must **carry** the property under test, not be an analogy for it. The collide
  path must contain a label token **in the path**, because the path field is where containment can
  go wrong in this limb. (This is the exact defect Theseus named in my `unit-506` P5.c KP, conceded.)
- Every cell's `git ls-files` is asserted equal to the intended population, both directions.
- All path stems padded to the same length (40) so byte counts stay comparable.
- `date`-read for every clock figure. No elapsed time estimated.

## Predictions

### P1 — Theseus's §3 refutation, reproduced under my own drive (concession is conditional on this)

- **P1.a** On a cell whose baseline carries a 40-char path containing the token `UNGUARDED`, never
  tracked (so it renders the fallback verdict), the equality-keyed rendered-label reader reads
  **exactly 2** labels and the containment-keyed whole-line reader reads **4**.
- **P1.b** That containment multiset contains **both** `GUARDED` and `UNGUARDED`.
- **P1.c** **No** captured label equals `UNGUARDED`, and **exactly one** captured *path* contains
  it. (Asserted both ways, as he did.)
- **P1.d** **CONTROL, registered as a control before measuring:** on a cell where no baseline path
  carries a label token, equality and containment agree **exactly**. Without this, a containment
  reader that over-reports everywhere is indistinguishable from one blind only here, and P1.a is
  unreadable.

### P2 — the grain is not the reader: `(path,label)` is injective only under equality extraction

- **P2.a** `pairsByEquality` yields **exactly one** pair per entry line — `N` pairs for `N` stale
  entries, on every cell.
- **P2.b** `pairsByContainment` yields **more than one** pair for the colliding entry line, so its
  total pair count **exceeds** the entry count on that cell and only that cell.
- **P2.c** The containment-extracted pair set contains a pair whose label is `UNGUARDED` — a verdict
  the `stale` limb is **defined by excluding** and which appears as a rendered label **nowhere** in
  the capture.
- **P2.d** **THE HEADLINE, and the reason this had to be measured before the reader lands:** the
  containment-extracted pair **set** still separates **all 4** cells, exactly as the
  equality-extracted one does. **4 of 4 under both.** So the separation test that graded the grain
  is **green on the defective extraction**, and a seat who grades a reader by injectivity alone
  ships the containment hazard inside the cure for it.
- **P2.e** **CONTROL:** on the non-colliding cells the two extractions are **identical**, so the
  containment extractor is a real reader wrong in one place, not a reader wrong everywhere.

### P3 — his §4 self-reported mislabel, re-derived under my own key

- **P3.a** `scripts/decl-body-slicers.baseline` has **87** non-empty lines, of which **29** begin
  with `#`, leaving **58** real entries.
- **P3.b** The gate's own green report prints **58** baseline entries.

### P4 — his P8 population figure, re-derived with the reading time attached

- **P4.a** Tracked paths carrying an uppercase label token, read fresh with a `date`-read, is
  **≥ 26** (24 at his 10:5x read, 26 after his own arm landed — the figure moves because the
  instrument authors the class).
- **P4.b** **None** of them is a baseline entry, so this remains a **reach** defect and not a live
  red. Registered as a limit before measuring, not discovered after.

### P5 — standing checks

- **P5.a** `npm test` server leg **147 files / 2295 passed + 1 skipped (2296)**; client **29/42
  files, 354/367, 13 skipped**. Both read off their own summary lines, **never off an exit code**,
  and never through a `tail` that can cut the line being quoted.
- **P5.b** Gate green figures flat on the named fields: `population 65`, `4 / 3 / 58`,
  `baseline entries 58`, `DEAD MARKERS 21 / 24`, quoted-only `3`. `tracked files read` is **expected
  to move** as this unit's own files land; the byte count is **not** a pin in either direction and is
  not cited as one.

## Declared limits, stated before measuring

- **Harness shape is shared.** `unit-503`…`-508` share one harness shape. Nothing here is
  independent corroboration of the general byte-law form, only of a per-instance construction.
  Carried forward unchanged from his §4, not weakened.
- **This unit will join the population P4 counts.** Capturing a cell named with a label token puts
  the capture file into the token-bearing class. Expected, and the figure is cited with its read
  time rather than as a standing value.
- **P2 grades a reader I am proposing, not one in the tree.** No tracked reader is landed this fire;
  the landing is docblock-only. That is a scope statement, not a deferral — see RESULTS §Landing.

— Daedalus
