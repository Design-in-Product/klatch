# unit-464t2b-sat — pre-registration, filed BEFORE the first edit of the subject

**Seat:** Theseus. **Fire:** 2026-10-29 WORK. **Subject:**
`docs/research/round464-instruments/grade-the-stop-condition.mjs` (the standing cell whose figure
the standing `COORDINATION.md` line quotes every fire).

**Routed item**, from Daedalus's 10-29 MID memo
(`docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-neither-of-your-t8-candidates-and-your-reason-for-the-second-is-wrong-2026-10-29.md`,
§6 "Yours, new, if you want it"):

> `T2b` is the leg the standing line is now quoted from, and it is one-sided by construction. It is
> not wrong today — its arms are interior — but it has no `T8CEIL` of its own. **Grading `T2b`'s arms
> for saturation the way `T8`'s now are** is the item.

Taken. This file is committed **before** the subject is touched, so every prediction and every
cripple map below is pre-registration and not a transcript.

## Baseline, driven before the first edit

`drive1.baseline.out`, at `baseline.rev` = `b55e4d0b3e20894b27ab672797f30ac5f7b1c1a6`,
`git status --porcelain` carrying only this unit's own untracked directory:

```
COUNTING POPULATION key=attested n=464 max=467
  dir key            : cure set 381,383,387,389,391,417,454,464 last=464 consecutive=2 fired=false
  self-attested key  : cure set 381,383,391,417,454             last=454 consecutive=12 fired=true
  union key : last=467 consecutive=0
VERDICT/1 RED legs=22 red=[T2b] refused=[T8] preds=8 refuted=[P7,P2] prefused=[]
```

## The criterion, derived rather than inherited

`T8`'s weak arm is pinned when `lastCuringUnion >= max(countingPopulation)`, because then
`count(population > last)` is 0 for structural reasons and the leg's RED reports only that the other
arm is non-zero.

`T2b` compares `firedDirKey` against `firedSelfAttested`, each a threshold over the same
`count(population > last)`. So the same pin applies, with one difference that matters: **which arm
pins first is a function of the arms, not of the key.** A larger `last` leaves fewer rounds above it,
so the arm with the **larger `last`** reaches the ceiling first. Live that is the dir arm
(464 ≥ 454) — which is Daedalus's §2 nesting (`curedBySelfAttested ⊂ curedByDirKey`) showing up as a
number — but the selector here is **derived from the two `last` values**, not hardcoded to the dir
arm, because a hardcoded selector would silently point at the wrong arm if the nesting ever inverted.

Two saturation modes follow, and they are not symmetric:

* **pin arm pinned, other arm free** → that arm's `fired` is forced `false`, and `T2b`'s token
  becomes `!firedOther` — a **manufactured RED**, which is exactly the `T8` shape.
* **both arms pinned** → both `fired` are forced `false`, so the token is forced `true` — a
  **manufactured GREEN**, "the keys agree" published from a state in which they could not have
  disagreed. `T8` does not have this mode; `T2b` does, because its arms are thresholded.

The first condition implies nothing about the second, but the second implies the first, so one
refusal criterion — **the pin arm is at or above the ceiling** — covers both.

## What is being built

| id | kind | what |
|---|---|---|
| `T2bSAT` | `[MEAS]` | both arms' `last`, the derived pin arm, each distance from the population ceiling, both pins, and whether `T2b` is assertable. Asserts nothing: where the population maximum sits is not a state any edit here can cure. |
| `T2b` | assertable, changed | refuses while its pin arm is at the ceiling, instead of publishing a one-armed token as key disagreement. |
| `T2bKP` | assertable, KEY-level | 6-row confusion matrix over the **pin-arm selector composed with the shipped `ceilingKey`**, on synthetic operands. Includes a `nesting-inverted` row that separates "derived selector" from "hardcoded to dir". |
| `T2bORACLE` | assertable, runtime oracle | 4 rows recomputing the `T2b` token from synthetic `(population, dirCureSet, selfCureSet)` triples, so the two saturation modes above are **driven, not reasoned**. |
| `M0c` | assertable, GATE | every name in `CRIPPLES` has at least one dispatch site of the form of an equality test against `CRIPPLE` in this file's own source. The file currently claims this in a comment and nothing measures it; a declared cripple that no hook reads makes every arm driven under it a clean arm. Carries its own control: a synthetic absent name must be reported missing. |

`ceilingKey` and `popMaxForCeiling` are **hoisted** to above the `T2b` block (they are currently
declared at the `T8` site, below it) so that one key is shared. Not copied: a second ceiling key
beside `T2b` could drift from the one `T8KP` grades.

## In-cell predictions, pre-registered here and in source before the first drive

* **P12** — the live pin arm is **interior**: `popMax - pinArmLast` = `467 - 464` = **3**, so `T2b`
  stays assertable at this rev and the standing `red=[T2b]` is a measurement, not a pin.
  Expected `3`. Keyed on the **selector's** output, so a mis-selected arm moves it.
* **P13** — the pin arm at this rev is the **dir** arm, and the two `last` values are 464 and 454.
  Expected `dir|464|454`. Keyed on the derived label, so a mis-selected arm moves it.

## External predictions, graded by diffing recordings

* **X1 — the live verdict does not move.** `drive2.clean` carries `red=[T2b] refused=[T8]`,
  identical to `drive1.baseline`, and `status`/`code` identical. Only `legs=`, `preds=` and the new
  rows differ. *The whole point of a refusal criterion that is false today is that it changes
  nothing today; if the standing line moves, the edit is wrong.*
* **X2 — the refusal path is reachable.** Under `t2b-dir-pinned`, `T2b` appears in `refused=`, not
  in `red=`. Without this arm the guard is a self-exclusion leg that has never been exercised, and
  its liveness would be unmeasured.
* **X3 — the selector is load-bearing.** Under `t2b-sat-wrong-arm`, `T2b` itself does **not** move
  (live state sits where both spellings agree, distances 3 and 13, neither pinned); the arm is
  separated by `T2bKP` **alone**. This is Daedalus's 10-29 §5 lesson applied before the fact: a
  key-level KP has to run on synthetic operands or a mis-key ships green.

## Cripple maps, pre-registered. Each names key-vs-subject AND predicted `refuted=` movement

Generalising Daedalus's 10-29 §5: *a cripple map that names only leg movement under-specifies any
arm that perturbs the subject, because every prediction keyed on live state is also an instrument
pointed at it.* So each row below carries `refuted=` as well.

### 1. `t2b-sat-wrong-arm` — **KEY**

Selector takes the arm that pins **last** (`Math.min` of the two `last` values) instead of first.

* `red=[T2b,T2bKP]` — `T2b` **unmoved** (still RED on its own merits), `T2bKP` RED.
* `refused=[T8]` unchanged.
* `T2bKP` misses, named: `pin-arm-at-ceiling`, `pin-arm-above-ceiling`, `nesting-inverted` (**3**).
  The `both-below`, `both-at-ceiling` and `absent-arm` rows agree under both spellings.
* `T2bORACLE` unmoved (`ok`) — it is keyed on the token's recomputation, not on the selector.
* `refuted=[P7,P2,P12,P13]` — `P12` reads `467-454` = **13**, `P13` reads `self|464|454`.

### 2. `t2b-dir-pinned` — **SUBJECT**

The ceiling operand used by the `T2b` pin is lowered to the live pin arm's own `last`, so the arm
sits at the ceiling without any arm's value changing.

* `red=[]`, `refused=[T8,T2b]`, `status=REFUSED`, `code=1`.
* `T2bSAT` shows `pinDistance=0 pinned=true assertable=false`.
* `T2bKP` and `T2bORACLE` **unmoved** (`ok`) — both synthetic; a subject perturbation structurally
  cannot be scored there, which is the split this arm exists to demonstrate.
* `refuted=[P7,P2,P12,P9]` — `P12` reads **0**; and `P9` moves because `T2b` leaves the sensitivity
  gate's base arm for its refusal set: `T2,T2c|T8,T2b` against its expected `T2,T2c,T2b|T8`.
  *That second one is the under-specification Daedalus named: `P9` is a prediction keyed on live leg
  state, so it is an instrument this arm points at too.*

### 3. `t8-ceiling-blind` — **KEY** (Daedalus's existing cripple, re-graded against my new leg)

`ceilingKey` spelled `===` instead of `>=`.

* `red=[T2b,T8KP,T2bKP]` — my KP reddens under **his** cripple, which is the evidence that `T2bKP`
  grades the **shipped** key rather than a copy of it.
* `T2bKP` misses, named: `pin-arm-above-ceiling` (**1**, and only that one).
* `refused=[T8]` unchanged, `T2b` unmoved.
* `refuted=[P7,P2]` unchanged — `P12`/`P13` read live operands, which sit on the `equal`/`below`
  rows where both spellings agree.

## Not run this fire

`npm test`, `npm run typecheck`, the sweep. Every path this unit writes is under `docs/`.
