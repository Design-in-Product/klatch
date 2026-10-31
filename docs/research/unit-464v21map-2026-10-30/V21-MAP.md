# Cripple map — the first map authored under CRIPPLE-MAP-CONVENTION v2.1 (unit-464v21map)

```
MAPSTAMP v2
filing-rev: 6bd87f85f568daba006ff999d2659ada7db508b1
cell: docs/research/round464-instruments/grade-the-stop-condition.mjs
cell-size-at-filing: legs=26 preds=10
clean-recording: docs/research/unit-464t2b-sat-2026-10-29/drive2.clean.out
```

**`filing-rev` is the PARENT of the commit that files this map** (v2.1 §3.1), namely the
pre-registration commit `6bd87f85`. It is not `baseline.rev` — that was the unit's open rev
(`708712f1`) and stopped being the parent the moment the pre-registration landed. Stated, not
passed off.

`cell-size-at-filing` is read off the clean recording's own `VERDICT/` line
(`drive2.clean.out:279`: `VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2]
prefused=[]`), not counted by hand (§3.1).

**The document title deliberately does not contain the arm name** (§3.2, which exists because this
seat's morning map was correctly rejected for exactly that). The arm is named in its section
heading below, once.

**Prior knowledge is declared in `PRE-REGISTRATION.md`, not here, and it is material:** the reached
set and the moved token *names* were visible to me in a committed recording before authoring; the
token *values* were not. Read that section before reading the membership figures as a blind.

---

## Arm `t8-unpinned` — perturbs the SUBJECT

The arm appends a synthetic round `9467` to the counting population (cell lines 325-334:
`SYNTHETIC_ABOVE_CEILING = 9467`, spliced into `countingPopulation` when `CRIPPLE === 't8-unpinned'`).
It does not touch any comparison key, so a **key**-level known positive is structurally unable to
score it and `T8KP` is predicted NOT reached — the companion arm `t8-ceiling-blind` is the key-level
one. Everything downstream of `popMax` and of `consecutiveAbove()` (cell 337-341) moves.

**Predicted arm-caused reached members (§3.3/§3.3a): 12.**

`reachedArmCaused=[P11,P12,P7,P9,T10,T10COUNT,T2,T2b,T2bSAT,T2c,T8,T8CEIL]`

**Predicted DRIFT members, excluded from the above per §3.3a: 3.** `G1`, `W1`, `T9` — the commit
population size, the window counts over it, and the dated figure line. Named here so the map is
explicit that `reached` (raw) is predicted to be **15**, and that the 3-member difference is a
property of when the two recordings were taken, not of this arm.

**Predicted verdict movement, as a property of rows and not as the selector: 4.** `T8` `REF `→`RED `
(this arm exists to grade that refusal), and `P9`/`P11`/`P12` `LAND`→`REFU` as their actuals move
off the ceiling. `T2b` stays `RED `, `P7` stays `REFU`, and the three `[MEAS]` legs cannot enter a
verdict set at all.

### Rows

One physical line each (§3.4) however long. Every quoted figure is the exact `name=value` string the
tokenizer will cut from the **arm** recording — which means interior tokens carry their trailing
delimiter, because `tokensOf` runs a value to the next ` <ident>=` boundary and trims. That is why
`unionArmPinned=false;` is written with its semicolon and `assertable=true` without one.

- **`T2bSAT`** — `MEAS`, status unmoved; 3 moved tokens, all arithmetic on the new ceiling: `popMax=9467`, `pinDistance=9003` (9467 − dirLast 464), `freeDistance=9013` (9467 − selfLast 454). `pinArmPinned=false` and `freeArmPinned=false` do not move: both arms were already interior and the ceiling moved *away* from them. `assertable=true` and `key=>=` unmoved — this arm is not the key arm.
- **`T8CEIL`** — `MEAS`, status unmoved; 3 moved tokens: `popMax=9467`, `distance=9000` (9467 − lastUnion 467), and `pinned=false` — this is the single token the whole arm exists to flip, since the union arm was pinned at the ceiling only because the ceiling was 467.
- **`T8`** — status MOVES `REF `→`RED `; 2 moved tokens: `unionArmPinned=false;` (interior token, semicolon included) and `assertable=true`. Its `dir=464` and `union=467` tokens do not move; the `dir 2 vs union 0` prose does, outside any token boundary, which is why the member is reached by payload and not only by its two tokens.
- **`T2b`** — status unmoved `RED `; 2 moved tokens: `fired=true (consecutive 13);` and `pinDistance=9003;`. Both carry the trap: `fired` occurs TWICE on this line and `tokensOf` keeps the LAST, so the captured value is the self-attested arm's, not the dir arm's; and `pinDistance` here is semicolon-terminated where `T2bSAT`'s identically-named token is not. `incidental=[387,389,464];` and `pinArm=dir` unmoved. The `13` is derived — self-attested consecutive 12 + the one synthetic round above `selfLast=454` — and is the least certain figure in this map.
- **`T2`** — status unmoved ` ok `; **0 moved tokens**, and reached anyway. `N=5,` and `fired=false` both hold (the arm raises the run but not past N=5 in a way that fires the dir key), while `highest 464` and `consecutive 2` move in prose that carries no `=`. A row that is reached with nothing to capture is the shape §3.3a's `T9` moved-zero case found on the other side, and this is a second instance of it under an arm that really is doing something.
- **`T2c`** — status unmoved ` ok `; 1 moved token: `active=3 (key=attested) vs dir`. The captured value runs to the next boundary (` surface=`), so the parenthesised `(key=attested)` is INSIDE the value and must be quoted with it — `(` is not whitespace, so `key=` there is not a token at all. `max=467` does NOT move: T2c reads the attested and dir *surfaces*, not the counting population the arm perturbs.
- **`T10COUNT`** — `MEAS`, status unmoved; 5 moved tokens, 4 captured and 1 declared underivable: `sensitive=[T2,T2c,T2b,T8]`, `n=4;`, `refusing=[];`, `figure=3`, and **`probes` — UNDERIVABLE FROM SOURCE, no string quoted**. T8 leaves `refusing` and joins `sensitive` because the arm is what makes its comparison measurable. The probe set is the set of probe indexes at which the figure differs; which indexes those are after a round is appended above every existing one is not a function of anything the cell source or the clean recording states, so a quoted string here would be invented. Declaring it is the correct failure; `A3` predicts this row costs `fullyCaptured`.
- **`T10`** — status unmoved ` ok `; 2 moved tokens: `sensitive=[T2,T2c,T2b,T8]` and `refusing=[]`. `insensitive=[]` and `registered=4` unmoved — the registry is unchanged, only T8's bucket within it. Note `refusing=[]` here has no semicolon where `T10COUNT`'s does: the same name, two spellings of its captured value, one line apart.
- **`P7`** — status unmoved `REFU`; 1 moved token: `actual=13`. Its `expected=10` is the pinned prediction and cannot move. Still refuted, now by 3 instead of 2 — a row where the verdict is unmoved and the measurement is, which is the whole argument for §3.3's reach key over the v1 verdict key.
- **`P9`** — status MOVES `LAND`→`REFU`; 1 moved token: `actual="T2,T2c,T2b,T8|"` — T8 crosses the `|` from the refusing side to the sensitive side, so the string's two halves both change while its character count barely does.
- **`P11`** — status MOVES `LAND`→`REFU`; 1 moved token: `actual=9000`. This is the prediction that asserted T8's zero was structural; the arm removes the structure, which is the point of pairing it with `T8CEIL`.
- **`P12`** — status MOVES `LAND`→`REFU`; 1 moved token: `actual=9003`. Same shape one arm down: the pin arm's interior distance was 3 and is now 9003.

### Members predicted NOT reached, with the reason — so a later re-drive can tell a miss from a gap

- `T8KP` and `T2bKP` are **key**-level known positives: they drive the ceiling comparison over synthetic rows of their own, so a change to the live counting population does not reach them. If either IS reached, the key/subject label on this heading is wrong and §3.2's claim that the label is load-bearing gets its first counter-example.
- `T2bSATKP`, `GKP`-style tokenizer legs, and the `M0*` dispatch-site counts are functions of the cell's source, which this arm does not edit.
- `P2` is already refuted at the clean rev for an unrelated reason and its operands are not population-keyed.

### Known deficiencies of this map, stated in it

1. **Membership here is not blind** (`PRE-REGISTRATION.md`). The 12 ids were legible to me in a committed recording before authoring. The captured values were not, and that is the half this map should be read on.
2. **`T10COUNT`'s `probes` token is predicted to move and not quoted.** The map is knowingly incomplete on one token of one row rather than quoting an invented string, and it says which.
3. **Three `consecutive`-derived figures** — `T2b`'s `13`, `T2c`'s `3`, `T10COUNT`'s `figure=3` — rest on one reading of `consecutiveAbove()`, that appending a single round above every existing member adds exactly one to each arm's run. If that reading is wrong, all three miss together, and they are named here so the failure reads as one cause and not three.

*Filed before the arm recording `../unit-464t2b-sat-2026-10-29/drive-cripple-t8-unpinned.out` is opened.*
