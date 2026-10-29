# unit-464t8 — 2026-10-29 MID fire

Both items routed to this seat in Theseus's 10-29 START memo
(`docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-t8s-red-is-produced-by-the-dir-arm-alone-and-the-union-0-is-still-a-ceiling-2026-10-29.md`,
§5 "Yours, new, if you want it"):

1. **`T8` is not repairable by re-aiming while its union arm is seeded from its dir arm.** His two
   candidates were: re-key the union arm onto a population it does not top out in, **or** retire
   `T8` in favour of `T2b`. **Neither was taken.** See §2 below — the reason he gave for the second
   candidate does not hold, and the first is not this seat's to make.
2. **`U6` independently: `T2c` and `T8` resting on one figure is a double count in the verdict
   line.** Taken, and the count is **3 assertable legs, not 2**.

Subject: `docs/research/round464-instruments/grade-the-stop-condition.mjs` (the standing cell whose
figure the standing `COORDINATION.md` line quotes every fire).

## His figures reproduce before anything here was edited

`drive1.baseline.out`, driven at `992e8ec7` **before** the first edit:

```
  COUNTING POPULATION key=attested n=464 max=467
  dir key            : cure set 381,383,387,389,391,417,454,464 last=464 consecutive=2 fired=false
  self-attested key  : cure set 381,383,391,417,454           last=454 consecutive=12 fired=true
  union key : last=467 consecutive=0
  VERDICT/1 RED legs=17 red=[T2b,T8] refused=[] preds=5 refuted=[P7,P2] prefused=[]
```

Both of his structural claims hold at this rev:

* **One-sided by construction.** `curedByUnionKey` is seeded from `curedByDirKey` and only `add`ed
  to — the printed union cure set contains all 8 dir rounds plus `249,371,382,393,396,467` — so
  `consecutiveUnion <= consecutiveSelfOnly` always.
* **Pinned at the ceiling.** `lastCuringUnion` 467 = `max(countingPopulation)` 467, so the union
  arm's 0 is structural. `T8CEIL` now prints the distance: **0**.

## 1. What was built instead of either of his candidates

`T8` keeps its assertion and **refuses while its comparison is unmeasurable**:

```js
const ceilingKey = (last, max) => (… last >= max);
const unionArmPinned = ceilingKey(lastCuringUnion, popMaxForCeiling);
const vT8 = readsFigure('T8', (cons) => {
  if (unionArmPinned === null) return null;
  if (unionArmPinned === true) return null;   // pinned -> REFUSED, not RED
  return cons === null || consecutiveUnion === null ? null : cons === consecutiveUnion;
});
```

A refusal, not a deletion and not a re-aim, because a refusal **becomes an assertion again by
itself** the moment an attested round above 467 lands that the union key does not credit — which is
the event his `U3` keeps live. Retiring the leg or re-aiming it would both discard that. And an
instrument that cannot refuse manufactures findings: this one manufactured a *key-disagreement*
finding out of a pinned zero, and published it to the one line xian reads this cell for.

Clean arm now: **`red=[T2b] refused=[T8]`** — down from `red=[T2b,T8]`.

Beside it, two new rows: `T8CEIL` (`[MEAS]`, the pin and its distance, no assertion — a leg
reddening on where the population maximum happens to sit would be red on a state no edit here can
cure) and `T8KP`, a **key-level** known positive, a 4-row confusion matrix over `ceilingKey` on
synthetic operands: `equal→pinned`, `above→pinned`, `below→free`, `absent→refusal`. 4/4.

## 2. Why neither of his candidates was taken — the reason for "retire in favour of T2b" is wrong

His §5: *"retire `T8` in favour of `T2b`, which already carries the key question with both arms
free."*

**`T2b`'s arms are not free; they are nested the other way.** `curedBySelfAttested` is built by
filtering `creditEdges`, which are built from `c.dirRounds` — so the self-attested cure set is a
**subset** of the dir set, visible in his own reproduced figures:
`{381,383,391,417,454} ⊂ {381,383,387,389,391,417,454,464}`. Therefore
`lastSelfAttested <= lastCuringRoundDirKey`, therefore `consecutiveSelfAttested >=
consecutiveSelfOnly`, always. `T2b` can fail in exactly one direction too.

So one-sidedness does not separate `T8` from `T2b`, and adopting his stated reason would have meant
retiring a leg for a property the replacement shares. What actually separates them is **saturation
alone**: `T2b`'s arms sit at 2 and 12, neither at a boundary; `T8`'s weak arm sits *at* its
population's maximum. His conclusion was right and his criterion was not — which matters because a
criterion is what the next fire reuses.

That is why the criterion is now **graded rather than written down**: `T8CEIL` measures the distance
every drive, and `T8` keys its own assertability on it. When `T2b`'s self-attested arm saturates,
the same shape will be visible there without anyone remembering this paragraph.

## 3. The double count is 3 legs, not 2 — measured by perturbation, not declared

`T10` (`T9` was taken; see §4) perturbs `consecutiveSelfOnly` **through the registry each leg's
verdict was published from**, so the map is the same code path as the verdict line. Declaring the
pairing in prose would have been a hand-typed claim about my own source, not a measurement of it.

```
T10 how many assertable legs move with `consecutiveSelfOnly`?
  live figure : 2
  probe set   : [0,1,4,5,6,12]
    T2         base=true    moved=true   over probes=[true,true,true,false,false,false]
    T2c        base=true    moved=true   over probes=[false,true,true,true,true,true]
    T2b        base=false   moved=true   over probes=[false,false,false,true,true,true]
    T8         base=null    moved=null   over probes=[null,null,null,null,null,null]
  sensitive   : [T2,T2c,T2b]  n=3
  refusing    : [T8]
```

**`T2` reads the figure too**, which his `U6` did not name. So `red=[T2b]` on the verdict line is
not a count of independent findings: one figure moving moves three legs, and a fourth when it comes
off its ceiling. `T10COUNT` publishes that as a `[MEAS]` so the verdict line cannot be read as a
tally.

**The probe set is not `cons + 1`, and that is pre-registered as `P10`, which LANDED at 0.** Every
leg here is a threshold comparison, so a unit perturbation moves **none** of them — a sensitivity
gate keyed on `+1` would have published a false RED against a figure that is in fact load-bearing in
three places. The set carries each threshold the legs compare against (`0, N-1, N, N+1`) plus the
three rival figures.

A leg REFUSED in the base arm is excluded from `T10`'s gate and reported separately, because the
sensitivity of a refused verdict is not measurable — and counting it as insensitive would have
reddened `T8` for the refusal §1 had just introduced on purpose.

## 4. Two id collisions in my own edit, one of which no existing gate could see

1. **A second leg named `T9`.** This cell already had a `T9`, declared in `MEAS_LEGS`. `M0` resolves
   a declared id with `legs.find`, which returns the **first** match — so `M0` graded the old leg,
   reported `drifted=[]`, and my new *assertable* leg rode along inheriting the `[MEAS]` exemption:
   a non-null value excluded from the refusal set by a name it was not entitled to.
2. **A second prediction named `P8`**, in the same edit. Both rows print, both count toward
   `preds=`, and `refuted=[P8]` would not have said which of the two refuted.

Renamed to `T10`/`T10COUNT` and `P11`. The rename was done by a script that **aborts unless each
substitution matches exactly once**, rather than by `sed`.

New gate `M0b` covers **both arrays**. Keyed on `legs` alone — which is where the defect I noticed
was — it would have been green over the second collision in the same commit that cured the first.

## 5. Cripples: 3 arms, 3 of 3 leg maps match; one map of mine was incomplete

Maps were filed in `cripple-maps-predicted.md` and committed **before** their drives, as
`df8c3b5f`.

**Rev-stamp caveat, recorded rather than quietly repaired.** That commit was originally `f5292720`
and both commits were re-authored after the first push attempt was rejected (this seat pushes as
`daedalus@klatch.local`; an explicit `-c user.email` override had put `xian@designinproduct.com` on
them). Neither had been pushed, so this was a local correction and not a force push. The
consequence is that `drive7.clean-final.out` stamps `REV f5292720` **internally**, and that object
no longer exists. The drive is still reproducible — its tree is `df8c3b5f`'s — but the stamp is an
address only in the pre-rebase tree, so it is named here instead of being edited inside a recording.
Each names **which of key or subject** it perturbs — the rule his own one map miss made visible.

| arm | perturbs | predicted | actual | |
|---|---|---|---|---|
| `t8-ceiling-blind` | **key** | `red=[T2b,T8KP] refused=[T8]`, `T8` unchanged | `red=[T2b,T8KP] refused=[T8]` | ✓ |
| `t8-unpinned` | **subject** | `red=[T2b,T8] refused=[]`, `T8KP` unchanged | `red=[T2b,T8] refused=[]` | ✓ |
| `t9-insensitive-leg` | registry | `red=[T2b,T10] refused=[T8]`, `n=3` | `red=[T2b,T10] refused=[T8]`, `n=3` | ✓ |

**The load-bearing row is the second cell of row 1.** `t8-ceiling-blind` spells the ceiling key
`===` instead of `>=`, and `T8` **did not move** — live state sits on the `equal` row where both
spellings agree. The arm separates through `T8KP` **alone**. Had the ceiling key been checked only
by `T8`'s own verdict, that mis-key would have shipped green, which is the whole reason the KP runs
on synthetic operands.

**The miss is in my map, not in an arm.** `t8-unpinned` also refuted `P11` and `P9`
(`refuted=[P7,P2,P11,P9]`), correctly — both are pinned on live state and a subject perturbation
moves them. My predicted map covered only the `red=`/`refused=` axis and said nothing about
`refuted=`, so two instruments scored that arm without having been predicted to. Recorded rather
than tidied: **a cripple map that names only leg movement under-specifies an arm that perturbs the
subject**, because every prediction keyed on live state is also an instrument pointed at it.

## Drives

| file | arm |
|---|---|
| `drive1.baseline.out` | pre-edit baseline at `992e8ec7` — his figures reproduced before anything was written |
| `drive2.clean.out` | first clean arm after the T8 refusal and T10 (still carrying both id collisions) |
| `drive3.clean-ids-unique.out` | clean, after the `T10`/`P11` renames and `M0b` |
| `drive4.cripple-t8-ceiling-blind.out` | key-level cripple |
| `drive5.cripple-t8-unpinned.out` | subject-level cripple |
| `drive6.cripple-t9-insensitive-leg.out` | registry cripple |
| `drive7.clean-final.out` | clean, against the shipped source |

`drive7` vs `drive3`: **10 differing lines, verdict byte-identical** — `REV`, `CLOCK` ×2, five
commit-count lines (this unit's own map commit entered the window), `T9`'s `live at` rev, and
`M0b`'s added pre-push note. Nothing else moved.

`.err` files are kept even when empty: an empty `.err` is the evidence a drive reached its verdict
rather than died. **7 `.err` files, 0 non-empty**, counted with `readdirSync`/`statSync`.

## Not run this fire

`npm test`, `npm run typecheck`, the sweep. `git status --porcelain -- packages/ scripts/` empty —
every commit is `docs/`-only. Nothing left running.
