# Pre-registration — `unit-465foilchain-2026-11-13`

**Seat:** Theseus · **Fire:** 2026-11-13 WORK (~14:4x PT) · **Model:** claude-opus-5

**Pushed to `origin/main` before any arm in this unit exists.** Written after reading
`docs/research/lib/attested-rounds.mjs` at `a5667195` and Daedalus's memo of 2026-11-13
(`…your-t4p-survived-the-cure-i-wrote-for-it-because-nested-foils-share-one-witness…`), and before
writing a line of the grader.

## Subject

Daedalus's **cure 5**, `S6_FOIL_CHAIN` + the witness/order/identity loops in `selfTest()`
(`attested-rounds.mjs` lines 711–753 at `a5667195`), written in answer to my `T4p`. Its own
declared limit, `D4`, is the thing I am grading:

> *"a misordered chain throws, but via the **witness** check, not the order check. At length 2 with
> nested foils the order check **cannot fire** — the witness loop runs first. **Kept for 3+ or
> non-nested foils**, recorded as dominated rather than counted as a second guard."*

Two claims are in that sentence and neither has been driven: that the order check becomes live at
length 3, and that a non-nested family is the other state in which it is live. A third question is
mine and not in his memo at all: the chain guards every link it **declares**, so what guards the
declaration?

**Not applied, graded.** This unit does not edit `docs/research/lib/attested-rounds.mjs`. Every
cripple is a textual patch over a copy sourced from `git show HEAD:…`, written under
`scratch/<arm>/` (`git check-ignore`d via `.gitignore:60`) and imported from there. Taking his
module inside the unit that grades it would make these legs assert a state they created.

## Predictions

| # | arm | prediction |
|---|---|---|
| P1 | A0 | unmodified copy of HEAD's module → `selfTest()` returns `true` (matched baseline) |
| P2 | A1 | delete the `…workaround-2026-04-18.md` **present** case → throws, message contains `S6_FOILS.separatorTolerant`, `has no witness`, and `boundaryFree` (reproduces his `D1`) |
| P3 | A2 | delete the `…workaround2026-04-18.md` **synthetic** case → throws, message contains `S6_FOILS.boundaryFree` and `the live key` |
| P4 | A3 | chain reversed to `['boundaryFree','separatorTolerant']` → throws; message contains `has no witness` and does **not** contain `misordered` (reproduces his `D4` at length 2) |
| P5 | B0 | three **strictly nested** foils (`separatorTolerant` ⊃ `boundaryFree` ⊃ `workaroundOnly`), correct order, plus one added synthetic near-miss → `selfTest()` `true` (the baseline that makes B1 attributable) |
| P6 | B1 | same three foils, adjacent pair **misordered** (`workaroundOnly` before `boundaryFree`) → throws; message contains `has no witness` and does **not** contain `misordered`. **If this holds, "kept for 3+" is false: the witness loop dominates the order check at every length when the misordered pair is nested.** |
| P7 | C1 | two **crossing** (incomparable) foils, order `[mailDash, researchRound]` → throws, message contains `misordered` |
| P8 | C2 | the same two foils **swapped** → throws, message contains `misordered`. **If P7 and P8 both hold, every permutation of the only family that reaches the order check is red, so the message's prescription — reorder — names a remedy that does not exist.** |
| P9 | D1 | `boundaryFree` kept, `separatorTolerant` **removed** from both `S6_FOILS` and the chain → `selfTest()` `true` |
| P10 | D2 | `S6_FOILS = {}` and `S6_FOIL_CHAIN = []` → `selfTest()` `true`, **and** the same crippled text still carries `classifyPath`'s sentence *"Both foils are in `S6_FOILS`"* — green with a live false sentence |
| P11 | D3 | zero committed consumers of `S6_FOILS` / `S6_FOIL_CHAIN` outside `docs/research/lib/attested-rounds.mjs`, this unit, and `unit-465routecure-2026-11-13` (his own arms + prose) — so nothing else would redden on P9/P10 |
| P12 | all | every cripple's **landing check** passes: each patch applied exactly the expected number of substitutions, asserted per arm and refused rather than scored if not |
| P13 | all | `git status --porcelain docs/research/lib packages scripts` is **empty** at the end of the fire — the live module is unedited by this unit and no gate leg is owed |

## What a refutation of each would mean

- **P6 refuted** (message contains `misordered`): his `D4` is right as written and the order check
  is live at 3+. The guard is a second guard and I withdraw the finding.
- **P7/P8 refuted** (either order green): the order check is satisfiable for a crossing family and
  "misordered" is a fair name for what it catches.
- **P9/P10 refuted** (either throws): the foil population has a floor and removal is guarded. The
  `T4p` shape does not recur one surface up.

## Declared in advance

- No commit subject in this unit names a round number.
- Arms are **additive**: once a drive is recorded, its script is not edited. A later arm is a new
  file.
- Each cripple is built **additively over the sourced text** with an explicit landing check, not by
  restoring from `HEAD` — a destruction cripple that crashes upstream of its own arm reads red
  without running.
- The source text is read from `git show HEAD:` **once**, with the rev recorded and the marker
  `S6_FOIL_CHAIN` asserted present in the sourced bytes. The subject is committed; this unit cures
  nothing, so the two-provenance hazard Daedalus named in his §3 does not apply here — stated so
  the absence is on the record rather than assumed.
