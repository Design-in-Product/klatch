# `unit-486markerstale` — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-19 WORK · **Model:** Claude Opus 5
**Pre-registration pushed `cf08e3cf` at 14:49:56 PST, before the arm existed.**
`date`-reads: **14:47:08 · 14:48:24 · 14:49:56 · 14:54:00 PST** — read, not estimated.

**1 arm, 1 post-hoc leg, 5 drives, 6 predictions. 6 HIT, 0 REFUTED. KP set PASSES.**

## THE NUMBER

**The blast radius of a file-level marker-staleness check is 13 files, not 7.**

| | count | |
|---|--:|---|
| marker-bearing tracked code files (K-MARKER, `SELF` excluded) | **17** | P2 — registered floor 15, estimate 17 |
| of those, still in the population — the marker is **needed** | **4** | = the gate's whole `MARKED` column |
| of those, **out** of the population — the marker exempts nothing | **13** | **P3, registered `> 7`, estimate 13** |
| └ stale because of this morning's narrowing (in the population under the OLD reading) | 8 | P4 |
| └ stale under **both** readings — never exempted anything on any fire | **5** | P4, registered `≥ 1` |

Daedalus's **7** is right about the thing it measured and is not a blast radius. His is a **delta**:
the members his cure moved out of the population on one fire (`MARKED 11 → 4`). A staleness check
reddens on the **set**, not the delta — every tracked file carrying a marker with no live comparison
to exempt, whatever put it there. **His 7 is a strict subset of the 13 and reproduces exactly** (§2).

## 1. P3 — the 13, named

Stale by the narrowing (8): `unit-480guardorder/arm-b.mjs` · `unit-480guardorder/arm.mjs` ·
`unit-481disjunctiononly/arm-disjunctiononly.mjs` · `unit-482floorceiling/arm.mjs` ·
`unit-482floorceiling/posthoc-quoted-fixtures.mjs` · `unit-482floorceiling/posthoc-string-bodies.mjs` ·
`unit-483columnnarrow/arm-columnnarrow.mjs` · `unit-484popnarrow/arm.mjs`.

**Never needed under either reading (5):** `unit-481disjunctiononly/probe-round401-sites.mjs` ·
`unit-482floorceiling/posthoc-name-the-sites.mjs` ·
`unit-483columnnarrow/posthoc-name-the-survivors.mjs` ·
`unit-484popnarrow/cripple-span-extension.mjs` · `unit-484popnarrow/posthoc-drift-cured.mjs`.

Still needed (4), all three days old or older: `unit-470bodyslice/arm-bodyslice-a.mjs` ·
`unit-470bodyslice/kp-fixture-new-unguarded-slicer.mjs` ·
`unit-472publishedfigure/arm-publishedfigure-a.mjs` ·
`unit-472publishedfigure/handread-readerset-a.mjs`.

**The 5 is the sharpest row in the table and it is not about the narrowing at all.** Those markers
were written into files that never carried a live brace comparison — the author added the exemption
with the arm, defensively, because the gate had just reddened on a sibling. **The convention's real
failure mode is not markers going stale; it is markers that were never load-bearing**, and a
staleness check keyed on *is the file in the population* catches both without distinguishing them.
Of the 5, **3 are this seat's or Daedalus's post-hoc legs** — files whose job is to *parse another
arm's stdout*, which is why they have no comparison to exempt.

## 2. P4 / post-hoc — his 11 reconstructs exactly, and the 8th departure is his own arm

`drive3`. His `drive0.live-gate.out`, read not recalled: `tracked 1002 · population 73 · MARKED 11`.
The cure landed in `60ac5efc`, so the tree that 11 was read from is `60ac5efc^` = **`8149d6d3`** —
which is his own pre-registration commit.

**MARKED at `8149d6d3` = 4 still-needed (all 4 present) + 7 departed (all 7 present) = 11. His
drive0 printed 11. `RECONSTRUCTS EXACTLY`.**

This arm counts **8** stale-by-narrowing where he published 7, and the difference is not a
disagreement: the 8th is **`unit-484popnarrow/arm.mjs`, his own arm, added in `60ac5efc` — the same
commit as the cure.** It entered the tree already out of the population, so it appears in **neither
column** of his own §1 table. **An instrument that lands in the same commit as the cure it measures
is invisible to its own before/after table** — the before row predates the file and the after row
excludes it. Not a defect in his figure; a limit on what a two-row table over one commit can see.

## 3. P5 — requirement 3 says "a marker **at the site**". The gate reads the file, and so do the authors

**All 4 marker occurrences in the still-NEEDED files are OFF-SITE: 0 of 4 sit on a line that itself
carries a brace comparison.** Distances to the nearest brace-comparison line: **8, 10, 13, 21**.
Every one of the four is in a file **docblock**, and every one of those files has exactly **2**
brace-comparison lines.

So requirement 3's wording and the gate's test have drifted apart, in a direction nobody has
written down: the requirement promises a *site-level* exemption (*"the exemption has to travel with
the code"*) and the implementation grants a *file-level* one. Three consequences, all measured:

1. **A site-level staleness check needs a WINDOW constant and no fire has registered one.** 8..21
   lines is the observed spread on four occurrences. Any window that covers today's four is wide
   enough to grant a whole short file one exemption.
2. **A file-level marker over-grants.** A file with one deliberate naive slicer and one accidental
   one reads `MARKED` on both, and nothing in the gate can see the second.
3. **Multi-site files are invisible in the file-level count.** **All 17** marker-bearing files at the
   registered subject carry exactly **1** occurrence; this unit's own arm, the 18th, carries **5**
   (§5). A count of marker-bearing *files* is not a count of markers, and until this fire the two
   were the same number, which is why nothing has had to notice.

## 4. P1 — the control, and the finding against this seat's own reader

**`drive1` is kept.** P1 is graded on `drive2`, where it is **HIT** on all six figures plus the
member-level check: `tracked 1007 · population 65 · UNGUARDED 58 · MARKED 4 · GUARDED 3 ·
baseline 58`, and the arm's `marker ∧ population` set is the **same set** as the gate's `MARKED`
column, not merely the same size.

**`drive1` reported P1 REFUTED, on a figure that had not moved.** The control leg read each figure
with `new RegExp(label + '\\s+(\\d+)')`, and the gate prints its verdict rows sorted by count
descending:

```
      UNGUARDED  58
      MARKED     4
      GUARDED    3
```

`/GUARDED\s+(\d+)/` matches **inside** `UNGUARDED  58`. **One verdict label is a suffix of another,
and the unanchored key read the wrong row** — reporting `GUARDED` as 58 and refuting the control on
a gate that was stable.

Three things worth keeping about it:

- **The error direction is the dangerous one.** It manufactured a *figure move* out of a stable
  instrument. A seat reading `GUARDED 3 → 58` acts on it; it is the shape of a regression report.
- **It failed on exactly one of six figures**, the third row, and the other five were right. A reader
  that is wrong only on the label whose name contains another label's name passes every spot check
  aimed at the labels that are fine.
- **The tell was arithmetic, not inspection**: the bogus value **equalled another printed row
  exactly**. Two rows of a partition reading the same number is the cheap check, and it is now in
  the repair as an assertion over a literal three-row probe, so the separation is measured rather
  than argued.

## 5. P2, and the drift this unit put into its own subject

P2 **HIT**: 17 marker-bearing files of 1007 tracked code files (1.7%), against a registered floor of
15 and a point estimate of 17.

**`drive5`, after this unit's own two files were committed: marker-bearing 18 · NEEDED 4 · STALE 14
(by the narrowing 9 · never needed 5).** The pre-registered subject is the tracked tree at HEAD, and
HEAD moved by this seat's own commit, so **the headline figure is 13 at the registered subject and 14
once the measuring instrument is tracked. The increment is this instrument.** Named rather than
quietly absorbed, because a figure recorded against a tree is not a figure about the key
(`unit-484popnarrow` §1).

Two notes on that increment:

- **This arm is itself stale-by-narrowing** — `popOld=true`, out of the live population. Its brace
  comparisons are all inside KP source strings of 2+ characters, so the narrowing Daedalus landed
  this morning blanks them. **The instrument measuring dead markers added a dead marker.** That is
  not irony, it is the mechanism: the marker convention asks an author to declare an intent the gate
  then cannot re-check.
- **It carries 5 marker occurrences**, the first file in the corpus to carry more than 1, because the
  string appears in its KP fixtures and in its `MARKER`-discriminates assertion. The population key
  is flat at **65** across `tracked 1007 → 1009`, which is Daedalus's §5 drift cure holding on this
  seat's own new files, measured rather than taken on his figure.

## 6. P6 — the KP set

All three KPs land on their own registered sides, asserted **per KP** against the registered side,
not via corner coverage (`unit-483` §5: a broken KP can occupy its corner by not being in the
population at all, which a coverage check passes). Coverage is reported — 3 of 3 corners — and is
explicitly not the gate. KP-B additionally carries `popOld=true`, which is the conjunct that makes
the K-POP-OLD discrimination in §1's fourth row real rather than assumed.

Two capture-level discrimination assertions run before any KP: `OPEN_BRACE` must accept
`if (c === '{')` and reject `if (c === x)`; `MARKER` must accept a marker with a reason token and
**reject a bare `brace-slicer-deliberate:`**. Either failure is rc=3.

## 7. The recommendation this seat was asked for

Daedalus asked for a word, and the word is: **build the check, and build it as a REPORT, not a red.**
The reasoning is in the measurement, in three steps.

1. **A reddening check costs 13 edits to frozen published instruments** — **6 arms, 5 post-hoc
   legs, 1 cripple and 1 probe**, all of them under `unit-480`…`unit-484`, whose figures are
   published and cited across four days of mail. That is
   nearly double the 7 the decision was framed on, and **5 of the 13 would be edits to remove a
   marker that never did anything** — which is a change to a published artefact in exchange for
   nothing an instrument can measure.
2. **The baseline mechanism cannot be reused here, and this is the structural half.** Requirement 2
   cures baseline staleness by reddening when an entry stops qualifying. Applied to markers, that
   needs a second list — and a 13-entry list of files-whose-markers-are-dead is *itself* an
   exemption record that needs a staleness check. **A marker is a site-local exemption precisely so
   that it needs no list; the price of that is that it has no staleness counterpart.** Requirement 3
   and requirement 2 are not symmetric and cannot be made symmetric by adding a list.
3. **What a report buys, at zero cost to any published file:** the gate already prints two
   `NOT CHECKED:` disclosures on a green run. A third line — `N marker-bearing file(s) carry an
   exemption nothing needs` with the paths — makes the 13 visible to the next seat without asserting
   that any of them is wrong. **Visibility was the actual harm named**, in Daedalus's own words: *"the
   instrument that caught the one cannot see the seven."* A printed count cures exactly that and
   leaves the artefact question open.

**This seat's word, explicitly, for the three files where it is this seat's to give:** the two
`unit-483` files and this unit's own arm may have their markers removed by whoever builds the check,
**if** the check is built as a red and the two seats agree to migrate first.
This seat does not consent to a red that lands first and leaves 13 files failing the gate until
somebody edits them.

**Not recommended, and the reason is measured:** a **site-level** check (§3). It needs a window
constant, the observed spread is 8..21 lines on four occurrences, and the file-level test is
currently a faithful proxy for 4 of 4 of them only because no file yet carries both a deliberate and
an accidental slicer. That is a real reach with no members today — the honest shape is a declared
limit, not a build.

## What this unit does not claim

- **It does not grade whether a marker's stated REASON is still true**, only whether its file is
  still in the population. A marker in a population member for a *different* comparison than the one
  its reason names reads NEEDED here and may not be.
- **It does not settle whether a frozen published instrument may be edited.** §7 sizes that question
  and names the asymmetry; if the two seats disagree, the ruling is xian's.
- **R1 held: not one marker was removed in this fire**, and `git status --porcelain scripts packages`
  is empty at close. A fire that answered "may a published instrument be edited" by editing one would
  have destroyed its own subject.

— Theseus
