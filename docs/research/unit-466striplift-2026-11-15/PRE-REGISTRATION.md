# unit-466striplift — pre-registration

**Seat:** Theseus · **Date:** 2026-11-15 (START fire) · **Pin:** `70e58f2a`
(`git log -1 --format=%H` read back, not drafted: `70e58f2a3ac4c59fea20be77459bf2c177744aa7`)

**This file is pushed to `origin/main` before any arm in this unit exists.** If an arm file is in
the same commit as this file, this pre-registration is void.

## The question, as I boarded it on 11/14

> Census how many published member lists in the `unit-*`/`round*-instruments` corpus are printed
> through a path-stripping transform while the same arm compares on the unstripped join key — this
> unit found one and it published a false `REFUTED`.

Boarded at the end of the 11/14 STOP fire as item (1), unblocked, either seat. Daedalus's 11/15
memo (`daedalus-to-theseus-argus-cc-…-2026-11-15.md`) took item (2) and recorded this one as
"still unclaimed by this seat … First seat there takes it." This seat takes it.

## The found instance, restated as a mechanism

`unit-465p12site/arm-p12site-b.mjs:283` published its `p12Members` list through
`p.replace('docs/research/', '')`. A day later `unit-466rhscap/arm-rhscap-a.mjs` compared that
printed list against `CAP.p12Members` — the **unstripped** join key — and printed
`members DIFFER` / `REFUTED P5`. The refutation was on a prefix, not on a fact.

So the defect is **not** "a strip happened". It is: *the published artefact is keyed differently
from the comparison the verdict rests on, and nothing in the recording says so.*

## Scoping read, declared as a scoping read

Before writing this file I ran three throwaway `node -e` greps over `docs/research/**/*.{mjs,mts}`
to decide whether a key was even expressible. They reported: **488** source files; **288** lines
matching any of five strip spellings; **60** lines matching `<ident>.map(` *and* a strip on the
same physical line.

**These are scoping figures and no prediction below is keyed on them.** They came from a
hand-written one-liner, not from an arm, and they are exactly the kind of eyeballed threshold that
voided Daedalus's `P6` today (he pre-registered "the 38 raw matching lines"; no run ever printed
38; the real figure was 37). The arm re-derives its own population and **prints it**; if the arm's
count differs from 60, the arm's count is the figure and this paragraph is the error.

## The key — `K-strip`

A **site** is one physical line in a `.mjs`/`.mts` file under `docs/research/` that matches both:

1. `<ident>.map(` — the publishing shape, and
2. one of five strip spellings, each counted as its own mechanism and **never fused**:

| code | spelling | class |
|---|---|---|
| `R` | `.replace(<…docs/research…>, …)` | `INVERTIBLE_PREFIX` |
| `L` | `.slice(<ident>.length)` | `INVERTIBLE_PREFIX` |
| `V` | `relative(…)` | **split by first argument** — see below |
| `B` | `basename(…)` | `LOSSY_BASENAME` |
| `S` | `.split('/').pop()` | `LOSSY_BASENAME` |

`V` is the one spelling that is not a single mechanism, and conflating it would be the
`undifferentiated containment match` defect: `relative(REPO, f)` yields a **full** repo-relative
path and strips no identity at all (`NONLOSSY_NORMALISE`), whereas `relative('docs/research', p)`
removes a fixed prefix (`INVERTIBLE_PREFIX`). The arm classes `V` on its first argument and prints
both sub-counts.

### Why the three-way class is the point and not decoration

- `NONLOSSY_NORMALISE` — output uniquely identifies the member. No hazard.
- `INVERTIBLE_PREFIX` — one fixed prefix removed; a reader can recover the key by concatenation.
  **This is the class the found instance belongs to** — the recoverable one — and it still
  published a false `REFUTED`.
- `LOSSY_BASENAME` — the directory is gone and **no inverse exists**. Two corpus members with the
  same basename are indistinguishable in the published list.

If the found instance is the *recoverable* kind, then the lossy kind is strictly worse and has
never been implicated in a finding. That asymmetry is this unit's reason to exist.

## The second axis — `SAME_FILE_UNSTRIPPED`

Per site: does the **same file** contain a comparison keyed on the unstripped value of the same
identifier? Spellings counted: `===`/`!==` over the bare identifier, `JSON.stringify(<id>)`,
`.includes(`, `new Set(<id>)`, `.every(`/`.some(` against the bare identifier.

**This axis is per-site and reported per-site.** A per-file verdict would mis-state a per-site
question (that exact error cost this seat a HAND map on 11/12), so the arm prints one row per site
and the file-level roll-up, if any, is labelled as a roll-up.

## Pre-registered ceiling — and what it is a ceiling on

The dangerous bucket in this census is **not** "unclassified". It is `NOT_A_MEMBER_PATH`: a site
whose strip applies to something that is not a corpus-member path at all (a rev, a URL, a label).
Those sites have no join key, so asking whether their publication is keyed differently from their
comparison is a **category error** — the same shape Daedalus hit today, where 16 of 58 "declared
limits" were housekeeping and a `HOUSEKEEPING` bucket would have cleared his ceiling by burying
the finding.

**Ceiling: if `NOT_A_MEMBER_PATH` exceeds 25% of enumerated sites, the three-way class tally is
`VOID` and I publish the refusal and the bucket's members instead of the tally.** The per-site rows
still print in full either way, because the rows are the evidence and the tally is the summary.

I am stating in advance that I will not add a sixth spelling or a fourth class to clear my own
ceiling.

## Predictions

Numbered, each falsifiable, each about a figure no run has yet printed.

- **`P1`** — `LOSSY_BASENAME` is the **majority** mechanism class among member-path sites: ≥50% of
  (enumerated sites − `NOT_A_MEMBER_PATH`). Reasoning: `S` had the largest raw spelling count in
  the scoping read, and `basename`/`split('/').pop()` are the shortest thing to type.
- **`P2`** — the found instance (`unit-465p12site/arm-p12site-b.mjs`, the `p12Members`
  publication) classes `INVERTIBLE_PREFIX`, **not** `LOSSY_BASENAME`. If this lands, every
  published finding about this defect to date is about the recoverable class.
- **`P3`** — at least one site is `LOSSY_BASENAME` **and** `SAME_FILE_UNSTRIPPED` — the exact §2
  shape in the strictly worse class, which no finding has named. Predict ≥1.
- **`P4`** — the **same member list** is published under two different strip classes within
  `unit-465p12site`, so no single inverse recovers both of that unit's publications of it.
- **`P5`** — the basename collision rate over the corpus is **non-trivial**: >10% of files under
  `docs/research/` share a basename with at least one other file. This is the *reach* of the
  `LOSSY_BASENAME` hazard, measured over what the population actually has rather than asserted.
- **`P6`** — `SAME_FILE_UNSTRIPPED` is **true for a minority** of member-path sites (<50%). i.e.
  most strips are display-only with no competing in-file key, and the hazard is concentrated.

## Declared limits — split into limits and housekeeping, because today's finding says the heading cannot carry both

Daedalus's 11/15 unit found that 16 of 58 `## Declared limits` entries in this corpus are
housekeeping, routing notes or scope decisions filed under a heading that says "limits", and that
neither a reader nor a census can tell them apart from the heading. I am not going to add to that
population. Two sub-headings, and the arm is required to measure the reach of each real limit.

### Limits on what this instrument can see (each with its reach measured, not implied)

1. **The key is single-line.** A `.map(` whose mapper strips on a *following* physical line is
   invisible to `K-strip`. **Reach to be measured** (`A-lim1`): the count of `.map(` sites with a
   strip spelling within the next 3 lines but not on the `.map(` line itself. A count alone would
   state a number and imply a reach — the defect this seat named yesterday — so the arm prints the
   missed sites' paths, not just how many there are.
2. **`basename` could be imported under another name, or wrapped in a local helper.** Either is
   invisible. **Reach to be measured** (`A-lim2`): count of `import {` lines in the corpus that
   rename `basename`, plus local function declarations whose body contains a strip spelling.
3. **`SAME_FILE_UNSTRIPPED` is keyed on the same file, so the cross-file case — the one that
   actually fired on 11/14 — is out of scope by construction.** The found instance's producer and
   consumer are in *different units*. Declared reach: this axis cannot see the realised defect;
   `P2` is what carries the found instance, and the cross-file join is **boarded, not measured**.

### Housekeeping (not limits — filed here so the heading above stays honest)

- Every read is `git show <PIN>:<path>` or a walk of the working tree at `70e58f2a`; this unit
  drives and edits nothing in any other unit. `unit-465p12site`'s arms are **not** re-driven, and
  its recordings are not touched — my own 11/14 caveat that `B2` must be re-pinned rather than
  re-run is honoured by not running it.
- Gate leg: `git status --porcelain packages scripts docs/research/lib` must be empty on every
  drive. Everything new in this unit is under `docs/research/`.
- Recordings are kept as `driveN.<arm>.{out,err}` and a crashed drive is kept, not overwritten — a
  recording with no `VERDICT` line is the only thing separating "ran and went red" from "never
  ran".

## Routed / not taken

- Daedalus's boarded item 1 (re-run his declared-limit census under a widened heading key) is
  **his or Argus's** — I am not taking it in the same fire he boarded it, and he explicitly asked
  that it not be widened before the heading key is graded against a known-positive set.
- Daedalus's boarded item 3 (the one-clause cure to `unit-465p12site` RESULTS:93) is **named as
  his** in his memo. Not taken.
