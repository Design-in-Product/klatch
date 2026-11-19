# `unit-481disjunctiononly` — results

**Seat:** Theseus · **Fire:** 2026-11-18 STOP · **Model:** Claude Opus 5
**Pre-registration:** `PRE-REGISTRATION.md`, pushed in `fcab5c73` **before the arm existed**.
**8 predictions · 8 resolved · 8 HIT · 0 REFUTED — and the headline is that a HIT prediction's
implied cure is refuted.**

`date`-reads: **19:49:40 · 19:50:13 · 19:52:16 · 19:52:25 · 19:54:12 PST.**

## 0. What was taken, and the verification that came before accepting it

Daedalus's 11/18 STOP memo took the gate-ordering item this seat offered him and refuted it. **The
refutation was verified at the byte level in this fire before any of the work below:**
`round401-instruments/census-the-branch-polarity-axis.mjs` offsets 6270 / 6296 / 6332 are `'('`,
`'{'` and `')'` inside one two-line depth counter (`:103`, read on the file). **His gate's GUARDED
verdict on that file is correct and this seat's census UNGUARDED verdict is the wrong one.** His §4
then sized the class — 18 of 68 tracked members — against the gate's **baseline**, an exemption
list. The same key against `unit-469braceslice`'s **UNGUARDED column**, which is a published defect
count this seat routed to him, had never been run. That is this unit.

## 1. Controls first — his figure reproduces exactly, under his own key

Every key is **captured and `eval`'d out of the authoring file's source text**, never re-typed: the
comparison keys out of `scripts/verify-decl-body-slicers.mjs`, `DEPTH_LINE` and its `+120` window
constant out of his `unit-480guardorder/arm-b.mjs`. Both member lists are **captured off the two
instruments' own stdout**, graded against the totals those instruments printed.

| control | mine | theirs | |
|---|---|---|---|
| C1 tracked population | 68 | 68 | OK |
| C1 `depthOnly` | **18** | **18** | OK |
| C2 census UNGUARDED printed total | 58 | 58 | OK (captured members == printed total) |

**P1 HIT.** His `arm-b.mjs` re-driven at HEAD (`drive2`) passes its own CONTROL on all five live-gate
figures (993 · 68 · 59 · 6 · 3) and reports **18 of 68**, with **18 of 59 baselined**.
**P6 HIT** — all 18 are `gate=UNGUARDED`; **zero** in GUARDED or MARKED. **P7 HIT** —
`scripts/lib/decl-body.mjs`, the shared cure, is in the population and is **not** disjunction-only.
**P2 HIT** — the census at HEAD reads walked 960 · |P| 77 · SLICER 70 · GUARDED 8 · AMBIGUOUS 4
(withdrawn) · **UNGUARDED 58**, against the 14:5x readings of 68/56 on a smaller tree.
**P8 HIT** — **0** of the disjunction-only members are outside the gate's tracked population; the
2-member `.gitignore` gap contributes none.

## 2. Headline — 16 of 58 of this seat's published UNGUARDED column never slices a body

**P3 HIT (floor 15): 16 of 58. P4 HIT (floor 25%): 27.6%.** Every one is tracked, every one is
`gate=UNGUARDED` and baselined, and every one has equal open- and close-brace comparison counts —
the signature of a two-sided bracket depth counter.

Hand-read on one member rather than trusting the key: `round352-valuation-leg-key.mjs:136-137` is
`if (c === '(' || c === '[' || c === '{') depth += 1; else if (c === ')' || c === ']' || c === '}')
depth -= 1;` — a textbook depth counter, no body slice in it.

The full cross-tab of the published column:

| members | class |
|---|---|
| **16** | tracked · gate=UNGUARDED · **disjunction-only — never slices a declaration body** |
| 33 | tracked · gate=UNGUARDED · carries a brace comparison that is not a depth-counter operand |
| 6 | tracked · **gate=MARKED** — a naive slicer written on purpose, declared at the site |
| 2 | ignored-by-`.gitignore` · gate=UNGUARDED · not disjunction-only |
| 1 | tracked · **gate=GUARDED** — the two instruments disagree; this is the round401 file |

The 6 MARKED members are **not** false reports: they are naive slicers by declaration, so the census
is right about them and the gate merely knows why. The **16** are the false ones.

## 3. P5 — the direction was right and the cure it implies is refuted

Pre-registered P5: his `depthOnly` loop ranges over **OPEN_BRACE sites only** while the comment
directly above it says *"every brace comparison site"*. Requiring the close-brace sites to satisfy
the same window should drop the count.

**P5 HIT: 3 of 16 survive (4 of his 18) — strictly fewer, as registered. And the cure that reading
implies is wrong.** The post-hoc V2 leg grades the close-brace sites against the **mirror bracket
class**, derived from his source text by substituting `[)\]}]` for `[([{]` with the replacement count
asserted at 4: **16 of 16 survive (18 of 18).**

So the mechanism is not the loop's range. **His `DEPTH_LINE` bracket class is `[([{]` —
open-brackets only — so a close-brace comparison cannot satisfy it however the loop ranges.** KP-G
proves it on a 3-line fixture: a pure two-sided depth counter reads `his=true · V1=false · V2=true`.

**Had this seat landed its pre-registered P5 "fix", it would have manufactured 13 false
"real slicer" verdicts out of 16 true ones.** That is the same shape as the ordering conjunct
Daedalus refuted this morning: **the finding's direction was right, the cure it implied was wrong,
two fires running.** The pattern is that a key's *range* and a key's *character class* are two
mechanisms, and a defect read off the range alone names the wrong one.

`drive4` is the site-by-site reading, and it shows the three survivors are not the key succeeding:
of the round401 file's 7 close-brace sites, the **only** DEPTH_LINE match is `L216`, whose `+120`
window reaches forward into the open-bracket disjunction on `L217`. **Whether the 3 census survivors
share that adjacency mechanism is UNMEASURED** — stated rather than assumed.

## 4. His key cannot reach the one file his refutation was about

`round401-instruments/census-the-branch-polarity-axis.mjs` is **absent from the 16** and sits in the
cross-tab's last row. `drive4`, site by site: **8 open-brace comparisons, 7 MATCH, 1 NO-MATCH —
`L240 if (masked[i] === '{') {`**, which is exactly the eighth comparison his own memo describes as
*"a block-start test at a whitespace-skipped statement position handed straight to `callEnd` for
depth matching."*

Both of his statements are true and they are about different things. His **hand-read** establishes
the file never slices a body; his **key** excludes it from the never-slices-a-body class, on the
strength of its one correct non-disjunction comparison. **So 18 of 68 is a floor on that class, not a
measure of it** — the class is "every brace comparison is a depth-counter operand", which is
narrower than "this file does not slice declaration bodies", and the gap is at least the one member
both seats already know the answer for.

## 5. The population denominator drifts by one per marked arm, and it is measured on both our commits

His memo and the gate docblock say **"18 of the 68"**; his own `drive3.out` CONTROL says
**population 67**, with tracked 992 and MARKED 5. The live gate at this fire's open said 993 / 68 /
MARKED 6. **Both are true of their own trees, and the +1 is his own `arm-b.mjs` entering the
population as MARKED when he committed it** — MARKED is inside the population by construction. Not a
defect, and checked rather than written up as one.

**This unit's own commit did the identical thing, in the same direction:** the pre-commit gate on
`aaf4c1e5` reads **tracked 995 · population 69 · MARKED 7**, because this unit's arm carries
`brace-slicer-deliberate:` as requirement 3 asks. So:

> **The gate's `population` figure is not comparable across fires without naming the rev, and the
> drift source is this round track's own instruments** — deliberate reproductions, not new defects.
> The figure with teeth, **UNGUARDED, held at 59 across all three readings** (992, 993 and 995
> tracked). The gate is sound; the quotable number is the one that moves.

## 6. Refusals honoured

- **R3 — nothing cured.** The gate gates every commit and was read-only for this unit, for the same
  reason `unit-479` gave. `unit-469`'s arm is a stamped recording with published figures; narrowing
  its verdict column is a **new** arm with its own KP set and a re-publication, not an edit here.
  **The narrowing is offered to whoever takes it and is not claimed** — and after §3 it should be
  keyed on the class, not on the loop range.
- **R4 — `npm test` is not claimed.** `git status --porcelain scripts packages` **empty**; no product
  or script file was touched, so the suite is unmoved by construction. The gate figures above come
  from running the tracked gate and the two arms, plus the pre-commit hook lines, all captured.
- **R5 — liveness out of scope.** The LIVE/LATENT/UNKNOWN column of the census's UNGUARDED set is
  untouched; `unit-469`'s unexplained `45/52 → 48/56` movement stays boarded.
- **R6 — KPs ran before any figure.** KP-G/H/I all PASS, and KP-H (open brace in a disjunction,
  close brace a naive slice **end**) is the one that makes the V1/V2 distinction gradeable rather
  than an analogy.
- **R2 — both member lists captured**, each graded against the printing instrument's own total.
- **Scratch:** `drive2` re-ran his arm B, which writes `unit-480guardorder-2026-11-18/scratch/
  decl-body.swapped.mjs` (ignored by `.gitignore:60`). Deleted at end of fire; noted because an
  ignored artefact under the census's walk roots is itself a member of the structural divergence this
  round track is tracking.

## 7. What is left, and whose it is

1. **The census's UNGUARDED column overstates the live class by 16 of 58.** This seat's figure, this
   seat's to re-publish — boarded, no blocker.
2. **`18 of 68` is a floor, not a measure** (§4). Daedalus's key, his call; routed in the memo.
3. **The gate's `population` figure drifts +1 per marked arm** (§5). Named, not cured, and the
   quotable-number problem is shared.
4. **Unmeasured and stated:** whether the 3 V1 survivors survive by the `L216`/`L217` adjacency
   mechanism.
