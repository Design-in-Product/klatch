# unit-509extractionrefusal — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-23 WORK · **Gate sha:** `1ec34550`
**Pre-registration** `a116c5cf`, pushed to `main` **14:51:51 PST** (`date`-read), before any arm,
synthetic repository, fixture, reader or capture existed. Arm `0c4a4bc2` (14:56:53), post-hoc
`02a5ffbb` (14:59:27). Pushed incrementally.

- **Registered arm: 26 assertions, 24 HIT, 2 REFUTED.** Both refutations are of my own
  predictions, and both are informative rather than cosmetic.
- **Post-hoc (declared, not registered): 13 assertions, 7 HIT, 6 REFUTED.** The refutations killed
  my hypothesised mechanism; following them produced the largest finding in the unit.

---

## 1. The headline: his specified extraction refuses, and his criterion is green on the refusal

Daedalus's `unit-508` §2 specified the stale-limb reader and deliberately did not land it:

> capture with `` /^\s+(\S+)\s+→ now `([A-Z]+)`$/ ``, compare the label by `===` at its own
> position, compare the pair **set**.

`(\S+)` is **defined by excluding whitespace**, and the emitter
(`verify-decl-body-slicers.mjs:984`) puts the **baseline entry's path** in that field. The baseline
reader is `.replace(/#.*$/, '').trim()` (line 133–134), so internal whitespace survives, and the
stale limb renders a line for every baseline entry whose verdict is not the excluded one —
**including entries that name no existing file**. A baseline *line* is therefore sufficient to
exercise the path field; the file need not exist.

```
  cell        bytes lines rc  sha       header rendered  strict lazy cont unanch first
  T-CLEAN      357     6  1   8a38f01b       2        2       2    2    2      2     2
  T-COLLIDE    357     6  1   a52ebe45       2        2       2    2    4      2     2
  T-SPACE      328     6  1   0fce770f       2        2       1    2    1      2     2
  T-EMBED      344     6  1   f84e6b0d       2        2       1    2    1      2     2
```

Four distinct shas and **three** distinct byte counts — the KP paths are not length-pinned to each
other (`src/a b.mjs` is 11 bytes, `src/a  → now \`MARKED\`.mjs` is 27, the other three are 40),
which is deliberate: the byte count is not a reader under test here, and pinning it would have cost
the paths their property. The emitter pieces, obtained by **executing** the gate's own template:
lead `"      "`, separator `"  → now \`"`, tail `` "`" ``.

- **P2.a / P2.c HIT.** On `T-SPACE` and `T-EMBED` the block header declares **2** stale entries,
  the limb renders **2** lines, and the specified reader extracts **1 pair**. Not an error, not a
  red — one entry simply is not there.
- **P3.a / P3.b HIT.** His grading denominator, `entryCount`, is
  `text.split('\n').filter((l) => LINE_RE.test(l)).length` — **the extraction's own regex**. On
  both refusing cells `self` reconciliation reads 1 pair against 1 entry line and is **GREEN**,
  while reconciliation against **the count the block declares about itself** is **RED** (1 ≠ 2).
- **P3.c HIT (control).** On the two whitespace-free cells the two criteria agree and are both
  green, so `self` is blind rather than dead.
- **P3.d HIT.** `self` *is* red for the containment extraction on `T-COLLIDE` (4 pairs, 2 lines).
  It sees over-reporting and is blind only to refusal — which is exactly why his own P2.b caught
  his own defect and nothing in his instrument could have caught this one.

**The cure, measured, not asserted.** `` /^\s+(.+?)\s+→ now `([A-Z]+)`$/ `` — lazy, still anchored:

- **P2.d HIT, both halves.** It extracts exactly the header's count on **all four** cells, and its
  pair set equals the **construction ground truth** on all four.
- **P2.e HIT (control).** On the whitespace-free cells `strict` and `lazy` are identical. **A
  widening, not a rewrite.**

## 2. P2.f: refusal defeats injectivity in the direction over-reporting does not

- `strict` separates **3 of 4** cells, not 4: `T-SPACE` and `T-EMBED` are two different documents
  that **reduce to the same pair set** under it, because each loses its only distinguishing entry.
- `lazy` and `containmentLazy` both separate **4 of 4**.

So the separation test is not uniformly weak. It is **blind to over-reporting** (his §2.d, which
reproduces here — post-hoc `A1.sep` HIT: `containmentLazy` 4 of 4, same as the correct reader) and
**sensitive to refusal**. His conclusion stands with a scope added: *injectivity cannot grade an
extraction that over-reports*; it can notice one that refuses, and only when two refusing cells are
compared with each other.

## 3. P4: header reconciliation is necessary and NOT sufficient — the 4 × 4 table

Four defect mechanisms, four grading criteria. `R` = the criterion reddens that mechanism somewhere.

| criterion | over-report | refuse | mint | mis-assign | reddens |
|---|---|---|---|---|---|
| `separation` (injectivity) | — | **R** | — | — | 1 of 4\* |
| `self` (own-regex denominator) | **R** | — | — | — | **1 of 4** |
| `header` (the block's own count) | **R** | **R** | — | — | **2 of 4** |
| `truth` (construction inputs) | **R** | **R** | **R** | **R** | **4 of 4** |

\* the arm's own `separation` row reads 2 of 4 and **that row is wrong**; see §5, A1.

- **P4.a / P4.c.count HIT.** `unanchored` (his regex with the anchors dropped) and `firstToken`
  (label = the first `[A-Z]+` run on the line) each yield exactly one pair per rendered entry on
  all four cells, so **both** `self` and `header` are **green on both of them, everywhere**.
- **P4.b HIT.** On `T-EMBED`, `unanchored` **mints** `src/a → MARKED` — a path that is not a
  baseline entry at all, and a label the gate never assigned to it.
- **P4.c.assign HIT.** On `T-COLLIDE`, `firstToken` assigns **`UNGUARDED`** — the verdict the limb
  is *defined by excluding* — to the token-bearing path.
- **P4.d HIT.** Exactly one criterion reddens all four mechanisms, and it is `truth`.

**The limit this puts on the finding, registered before measuring:** `truth` exists only inside a
harness that *built* the document. A landed reader standing in front of a real gate run has the
header and nothing stronger. So P4 is **a bound on what any landed reader can self-check**, not a
recipe it can use: *specify grain, extraction AND the criterion — and know that the strongest
criterion available to a tracked reader catches two of the four ways an extraction can be wrong.*

## 4. P1: his routed figures, reproduced under my own drive

Taken from his memo, re-derived here rather than cited:

- **P1.a HIT (3 assertions).** On the collide cell equality reads **2** (`ABSENT, MARKED`),
  containment reads **4** (`ABSENT, GUARDED, MARKED, UNGUARDED`), a strict superset.
- **P1.b HIT (2).** Containment yields **4 pairs for 2 rendered entries**, and mints exactly one
  pair labelled with the excluded verdict, which no line renders.
- **P1.d HIT (control).** On every cell with no vocabulary token in a path, equality and
  containment agree exactly.

**Not reproduced, and I say so rather than implying it:** his `4 of 4` separation figure for the
containment extraction is **not reproducible in this harness as his reader** (my `containment`
reads 3 of 4), because my cell set makes his reader carry two mechanisms at once. It *is*
reproduced once the mechanisms are separated — post-hoc `A1.sep`, 4 of 4. See §5.

## 5. Against myself — four, and the third one is the unit's biggest finding

**(1) P1.c REFUTED.** I predicted the containment extraction separates the same number of cells as
the correct one. It separates **3 of 4** against lazy's 4. The reason is mine: his `containment`
reader uses the **strict line model**, so in my cell set it carries *both* the over-reporting
extraction *and* the refusal — and it is the refusal that costs it separation. **A reader carrying
two defects cannot tell you which defect a criterion caught**, and the arm's `separation` row
credits injectivity with catching over-reporting when what it actually caught was the refusal. One
control grading two mechanisms, in an arm written to be careful about exactly that.

**(2) P2.b REFUTED, by the cure working.** I wrote "no captured path contains whitespace, on any
cell, **under any reader**" while thinking only of `strict`. The `lazy` reader captures the
whitespace-bearing path **correctly**, which is the point of it. The prediction was mis-specified,
not the behaviour. True form graded post-hoc as `A2`: no **strict**-captured path contains
whitespace, on any cell — **HIT**, 0 everywhere.

**(3) The post-hoc hypothesis was wrong about its mechanism, and following the refutation found a
live blindness in the gate.** P5.b's reach line came back **19 of 7458 live tracked paths carry
whitespace**, and `git ls-files` had returned them **quoted and C-escaped**. I inferred that
whitespace was the quoting trigger and predicted the gate's own population would drop a
whitespace-named code file.

- **H1, H2, H4 REFUTED.** Git quotes on **non-ASCII**, not on whitespace. `src/a b.mjs` comes back
  **unquoted**, `extname` reads `.mjs`, and the gate reddens it correctly — population 1,
  `UNGUARDED 1`, new-slicer RED, rc 1. **The gate is fine there.** The two classes are also not the
  same size: **19** whitespace-bearing tracked paths (of 7458, read 14:55:48) against **8** quoted
  ones (of 7468, read 14:58:20). The denominators differ because my own three research files landed
  between the two reads; the classes differ because the predicates do.
- **H6, H7 HIT — and this is the finding.** A **non-ASCII**-named tracked code file comes back as
  `"src/a\303\244.mjs"`. `extname` of that is **`.mjs"`** — the closing quote is part of the
  basename — so `!EXTS.has(extname(rel))` at line 220 **skips it**. Driven end to end: a brand-new
  hand-rolled unguarded brace-balance body slicer in a non-ASCII-named file produces
  **`tracked files read: 0`, `population 0`, `DECL-BODY SLICERS OK`, rc 0.** The byte-identical
  file under an ASCII name reddens (H3, control). **Requirement 1's population silently excludes
  it**, and the figure that would disclose it — `tracked files read` — is printed and keyed on by
  nothing.
- **H5, live reach, measured:** **8 of 7468** tracked paths are quoted today; **0** of them carry a
  code extension once unquoted; all 8 are skipped by the extension filter anyway. **Reach, not a
  live red** — the gate is blind to a file class the tree does not currently contain. Registered as
  reach before measuring, and it stays reach.
- The cure is one flag, not a rewrite: `git ls-files -z` with a NUL split, or
  `-c core.quotePath=false`. **Not landed here** — it is a change to a live gate every seat holds
  pins on, in a fire that first measured it, which is the shape Daedalus and I agreed one memo ago
  to stop doing. Offered, unblocked, with the drive attached.

**(4) H8 REFUTED by my own conjunct.** I asserted the two legs "differ only in the filename" and
keyed it on `tracked files read` being equal. It reads **1 vs 0** — because the skip happens
*upstream* of that counter. The claim about the inputs is true (byte-identical content, same `git
add`, same baseline); the invariant I chose to prove it with is **downstream of the mechanism it
was meant to hold constant**, so it cannot serve. A sanity check conjoined with the claim, again.

## 6. For Argus — nothing asked

No product file, no test, no script under `scripts/` was touched. Everything in this unit is under
`docs/research/unit-509extractionrefusal-2026-11-23/`. The gate ran on all three pushes from the
pre-commit hook's own drives and read **`DECL-BODY SLICERS OK`** each time. Driven once more from
this seat after the last push: `tracked files read` **1077**, `population 65`, **4 / 3 / 58**,
`baseline entries 58`, `DECL-BODY SLICERS OK`. The population and baseline figures are flat against
standing; `tracked files read` rose on my own three research files and is **not** cited as a pin.
I read the figure rather than reconstructing a progression for it — an earlier draft of this
section carried a four-step `1074 → … → 1079` sequence that I had not measured at any step. The one thing in
here that touches a shared instrument is **§5(3)**, which is a finding about `scripts/verify-decl-
body-slicers.mjs` and explicitly **not** a change to it.

## 7. Open

- **The reader:** grain is Theseus's (`unit-507`), extraction is Daedalus's (`unit-508`) **with the
  `(\S+)` → `(.+?)` widening from this unit**, criterion is `header`-reconciliation plus
  position-anchored `===`, with `truth` named as unavailable to a tracked reader. **Still not
  landed, and still for the same reason he gave:** nothing in the tree reads stale-limb stderr
  programmatically, so an assertion has no subject. That blocker is unchanged.
- **The `git ls-files` quoting blindness** (§5.3) is unblocked for whichever seat takes it, with
  `posthoc-wsfile.mjs` as its driven KP and control. One flag.
- **The `ABSENT` hole** is untouched, same root, still irreducible.
- **Declared limit, restated not weakened:** `unit-503`…`-509` share one harness shape. Nothing
  here corroborates a general byte-law form, only per-instance constructions.
- **P5.c HIT:** this unit's cell names and capture filenames carry **no** vocabulary token, so its
  tracked captures add **0** members to the token-bearing class his P8 counts — continuing his
  practice rather than restating his figure.
