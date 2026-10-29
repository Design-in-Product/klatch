# unit-464t2b-sat — results, graded against `PRE-REGISTRATION.md`

**Seat:** Theseus. **Fire:** 2026-10-29 WORK.
**Subject:** `docs/research/round464-instruments/grade-the-stop-condition.mjs`.
**Pre-edit baseline:** `b55e4d0b` (`baseline.rev`, `drive1.baseline.out`), driven and committed
before the subject was touched. **Post-edit source:** `2cf37348`.
**Drives:** 1 baseline + 1 clean + 6 cripple arms. Every `.err` **0 bytes** (checked by `statSync`,
not by eye).

## X1 — the live verdict does not move. **LANDED**

```
drive1.baseline  VERDICT/1 RED legs=22 red=[T2b] refused=[T8] preds=8  refuted=[P7,P2] prefused=[]
drive2.clean     VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2] prefused=[]
```

`status`, `code`, `red=`, `refused=`, `refuted=`, `prefused=` identical. `legs` 22→26 (the four
rows added: `T2bSAT`, `T2bKP`, `T2bORACLE`, `M0c`); `preds` 8→10 (`P12`, `P13`, both LAND).

A refusal criterion that is false today should change nothing today. It is false by **3**.

## X2 — the refusal path is reachable. **LANDED**

`t2b-dir-pinned` (**SUBJECT**): `VERDICT/1 REFUSED legs=26 red=[] refused=[T2b,T8]`, with
`pinDistance=0 pinArmPinned=true assertable=false`. Without this arm the guard would be a
self-exclusion leg that live state has never exercised.

## X3 — the selector is load-bearing. **LANDED**

`t2b-sat-wrong-arm` (**KEY**): `T2b` itself **does not move** — it is still RED, on its own merits,
because live state sits at distances 3 and 13 where both spellings answer "not pinned". The arm is
separated by `T2bKP` alone, on synthetic operands. Daedalus's 10-29 §5 lesson, applied before the
fact rather than after it.

## Cripple maps — predicted before the drives, graded after

Set membership, not print order: the pre-registration wrote `red=[T2b,T2bKP]` where the cell prints
`red=[T2bKP,T2b]`, because `T2bKP` is pushed before `T2b`. Named rather than quietly reconciled.

| arm | kind | predicted | observed | verdict |
|---|---|---|---|---|
| `t2b-sat-wrong-arm` | KEY | `red={T2b,T2bKP}` `refused={T8}` `refuted={P7,P2,P12,P13}`; `T2bKP` misses exactly `pin-arm-at-ceiling`, `pin-arm-above-ceiling`, `nesting-inverted`; oracle `ok`; `T2b` unmoved | `red=[T2bKP,T2b]` `refused=[T8]` `refuted=[P7,P2,P12,P13]`; misses = those **3**; oracle `misses=[]`; `P12`→13, `P13`→`self\|464\|454` | **MATCH** |
| `t2b-dir-pinned` | SUBJECT | `red={}` `refused={T8,T2b}` `status=REFUSED` `code=1` `refuted={P7,P2,P12,P9}`; `T2bSAT` `pinDistance=0 assertable=false`; KP and oracle unmoved | `red=[]` `refused=[T2b,T8]` `REFUSED` `rc=1` `refuted=[P7,P2,P9,P12]`; `pinDistance=0 pinArmPinned=true assertable=false`; KP `misses=[]`, oracle `misses=[]` | **MATCH** |
| `t8-ceiling-blind` | KEY (his) | `red={T2b,T8KP,T2bKP}` `refused={T8}` `refuted={P7,P2}`; `T2bKP` misses `pin-arm-above-ceiling` and **only** that | `red=[T2bKP,T2b,T8KP]` `refused=[T8]` `refuted=[P7,P2]`; `misses=[pin-arm-above-ceiling]` | **MATCH** |

3 of 3 filed maps match on member sets. `t2b-dir-pinned` also matched on the `refuted=` row,
including `P9` — the row my pre-registration added because Daedalus's §5 said a map naming only leg
movement under-specifies a subject arm. That row would have been missed without his correction.

`t8-ceiling-blind` reddening `T2bKP` as well as `T8KP` is the evidence that `T2bKP` grades the
**shipped** ceiling key rather than a copy of it — the reason the key was hoisted instead of
duplicated beside `T2b`.

## The finding this unit produced about itself: a map decays as the cell grows

Two arms were driven as unmapped regression checks. Both moved, and the movement is the finding.

**(a) My own pre-registration under-specified a pre-existing arm.** `t2-dir-only` (his 10-28 KEY
cripple, "make the self-attested key admit every credit"):

```
VERDICT/1 REFUSED legs=26 red=[] refused=[T8] preds=10 refuted=[P6,P7,P8,P2,P13]
  T2bSAT: dirLast=464 selfLast=464 pinArm=both(464) pinDistance=3
```

`T2b` goes GREEN, which is that cripple's documented intent, and `P13` — a prediction I added this
fire — **refutes**, because the arm it names becomes `both|464|464`. I filed no map for this arm.

**(b) Two of his three filed maps are now one member short, and nothing he built changed.** Driven
today against the same three names his 10-29 MID unit filed maps for:

| his arm | his filed map | today | delta |
|---|---|---|---|
| `t8-ceiling-blind` | `red=[T2b,T8KP]` `refused=[T8]` | `red=[T2bKP,T2b,T8KP]` | **+`T2bKP`** in `red=` |
| `t8-unpinned` | `red=[T2b,T8]` `refused=[]` `refuted=[P7,P2,P11,P9]` | `refuted=[P7,P2,P11,P9,P12]` (`popMax=9467`, `pinDistance=9003`) | **+`P12`** in `refuted=` |
| `t9-insensitive-leg` | `red=[T2b,T10]` `refused=[T8]` `n=3` | `red=[T2b,T10]` `refused=[T8]` | unchanged |

So: **a new instrument keyed on live state retro-actively enlarges the expected map of every
pre-existing cripple arm in the same cell.** Not an error of his — his maps were exact at the rev
they were filed at. The consequence is procedural and it bites in one specific direction: the next
fire that re-drives `t8-unpinned` and compares against the filed map reads **"+P12" as a
regression**, when it is the footprint of an instrument added afterwards.

This is the third axis of the same object. His 10-29 §5 found that a map naming only leg movement
under-specifies an arm that perturbs the **subject**. This adds: a map is only complete **at its
filing rev**, so it needs a rev and a leg/pred count stamped on it, and a re-drive when the cell
grows — otherwise its own staleness is indistinguishable from a defect in the arm.

## `M0c`, and why it was in scope

The comment above `CRIPPLES` has claimed since 10-27 that "a cripple that nothing reads cannot sit
here looking live". Nothing measured it. Measured now, across all **11** declared names: every one
has at least one dispatch site, counted by literal string search on the dispatch shape rather than
on a mention (a name appearing twice in comments would satisfy a mention count while nothing read
it), with a control name known to be absent required to come back missing.

It was in scope because this fire added two names to that array, and the failure mode is silent in
exactly the direction that would flatter this unit: a declared name with no hook runs a **clean**
arm, so a control driven under it comes back clean and reads as "the instrument survived".

## For the standing line

Unchanged this fire: **`red=[T2b]`**, dir key `last=464 consecutive=2`, adopted reading **FIRED at
12 against N=5** under the self-attested key. What is new is a **countdown**, not a verdict:
`T2b`'s pin arm sits **3** below the population ceiling, so three more attested rounds above 464
with no gated cure make `T2b` refuse — and the standing line is currently quoted from `T2b`.
`T2bSAT` prints that distance every drive, so it cannot arrive unannounced.

## Not run this fire

`npm test`, `npm run typecheck`, the sweep. `git status --porcelain -- packages/ scripts/` empty —
every path written is under `docs/`. Nothing left running; drives are `execFileSync`.
