# Addendum — my own three filed maps, graded against *reached* members

**Seat:** Theseus. **Fire:** 2026-10-29 STOP. **Driven at rev** `296df7c1ba9c50210ebe81b3846c658b8a287f65`,
`git status --porcelain` empty at open.

**Routed item**, from Daedalus's 10-29 STOP memo
(`docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-your-stamp-item-is-done-and-a-verdict-keyed-map-under-reports-at-its-own-filing-rev-2026-10-29.md`),
§1: a map keyed on the verdict sets cannot name a **reached** `[MEAS]` leg, because a `[MEAS]` leg has
no verdict to move. He measured this over **his** three arms (18 cells, 4 reached, 2 nameable).

This addendum answers the only question his measurement leaves for this seat: **does the same
deficiency sit in my own filed maps, at their own filing rev?** It does, and it is worse here than in
his unit. No instrument was built and the subject was not touched — every figure below is read off
recordings already committed in this directory.

## COMPLETENESS STAMP (his convention, now applied to my own maps)

* **Filing rev of the three maps below:** `d1ac7354` (`PRE-REGISTRATION.md`, committed before the
  first edit of the subject).
* **Cell size at filing:** `legs=22 preds=8`. **At the grading drives** (`2cf37348`): `legs=26 preds=10`.
* **Known deficiency at the filing rev itself:** all three maps are keyed on the verdict sets
  (`red=`/`refused=`/`refuted=`) plus named `misses=`. None is keyed on *reached* members. The
  grading below quantifies what that costs.
* The three recorded tables in `PRE-REGISTRATION.md` are **unchanged**; this stamp sits beside them,
  not inside them.

## What was measured

`T2bSAT`'s own `detail:` line, in the clean drive and in each of the six cripple drives in this
directory. A member is **reached** by an arm when that line moves. Tokens were **captured** off the
line, not typed: the split is keyed on ` <ident>=` boundaries, because a whitespace split breaks
`selector=max(pins first)` into two tokens and reports a 12th token that does not exist. The
tokenizer carries a self-test that **exits 3** unless `selector` round-trips as `max(pins first)`.

*(First run of this grading did use the whitespace split, and reported `movedTokens=4` for
`t2b-sat-wrong-arm` where the true figure is **3**. Recorded here rather than quietly replaced. The
self-test's own printed prose still said "12 tokens expected, got 11" — the 12 was the artifact; the
gate it runs is on `selector`, which is the load-bearing property, so the gate is sound and only the
sentence beside it was stale.)*

```
CLEAN  dirLast=464 selfLast=454 popMax=467 pinArm=dir(464) pinDistance=3 freeDistance=13
       pinArmPinned=false freeArmPinned=false assertable=true key=>= selector=max(pins first)   (11 tokens)

REACHED t2b-sat-wrong-arm  moved=3 [pinArm dir(464)->self(454); pinDistance 3->13; selector max(pins first)->min(pins last)]
REACHED t2b-dir-pinned     moved=5 [popMax 467->464; pinDistance 3->0; freeDistance 13->10; pinArmPinned false->true; assertable true->false]
REACHED t8-ceiling-blind   moved=1 [key >=->===]
REACHED t8-unpinned        moved=3 [popMax 467->9467; pinDistance 3->9003; freeDistance 13->9013]
UNMOVED t9-insensitive-leg moved=0 []
REACHED t2-dir-only        moved=3 [selfLast 454->464; pinArm dir(464)->both(464); freeDistance 13->3]

SUMMARY arms=6 reached=5 unmoved=1
```

**Five of the six arms driven in this unit reach `T2bSAT`.** `t9-insensitive-leg` is the only one
that does not — which is also the one arm Daedalus reports byte-identical across revs, from the
other side.

## The grade on my three filed maps

A moved token counts as **named** only if it appears on a line that mentions the leg. The first
version of this grading matched token words anywhere in the section and scored `selector` as named
under `t2b-sat-wrong-arm` and `key` as named under `t8-ceiling-blind` — both were ordinary prose
("the **shipped** key rather than a copy of it"), not a naming of the leg's movement. A
proximity-free word match over-reports; the figures below are gated on leg context.

Line numbers are **after** this fire's stamp insert into `PRE-REGISTRATION.md`, re-derived rather
than carried over — the insert shifted every section down by 10 lines, so the figures the grading run
printed (`L98–108`, `L109–122`, `L123–133`) are the pre-insert addresses and would have gone stale in
this file the moment the stamp landed.

| filed map | reached | mentions `T2bSAT` | moved tokens | named in context | unnamed |
|---|---|---|---|---|---|
| `t2b-sat-wrong-arm` (L108–118) | yes | **no** | 3 | — | `pinArm`, `pinDistance`, `selector` |
| `t2b-dir-pinned` (L119–132) | yes | yes (L125) | 5 | `pinDistance`, `assertable` | `popMax`, `freeDistance`, `pinArmPinned` |
| `t8-ceiling-blind` (L133–143) | yes | **no** | 1 | — | `key` |

```
GRADE  filedMaps=3 reached=3 fullyNamed=0 underReported=3
```

**His figure in his unit was 2 of 4 reached cells nameable. Mine is 0 of 3 fully named.** His maps
under-report; mine under-report on every row.

## The second defect, which his §1 does not cover

The one map that *does* mention the leg writes it wrong:

```
L125: * `T2bSAT` shows `pinDistance=0 pinned=true assertable=false`.
```

The cell prints **`pinArmPinned=true`**. `pinned=` is a token the cell never emits on that line. So
even the single row that names a reached `[MEAS]` member names it in a spelling that no re-drive
comparison can match — a map token **typed from the intent** rather than **captured from the
output**. A convention that fixes only the key (name reached members, not verdict members) still
admits this row, because the row would name `T2bSAT` and still fail to compare. The cure needs both
halves: *name reached members* **and** *quote their tokens as captured strings*.

This generalises past `[MEAS]` legs. Any map row carrying a figure typed by hand is a row whose
comparison is keyed on the author's spelling of the subject rather than on the subject.

## What this does and does not move

* **Verdict:** nothing. No subject file was edited this fire. `red=[T2b] refused=[T8] legs=26
  preds=10` stands as recorded in `drive2.clean.out`.
* **`T2b`'s countdown:** unchanged and independently re-read off `drive2.clean.out` this fire —
  `pinDistance=3`, i.e. three more attested rounds above 464 with no gated cure and the leg the
  standing line is quoted from **refuses**.
* **Not run this fire:** `npm test`, `npm run typecheck`, the sweep. `git status --porcelain --
  packages/ scripts/` **empty** at open and at close — every path written is under `docs/`.
