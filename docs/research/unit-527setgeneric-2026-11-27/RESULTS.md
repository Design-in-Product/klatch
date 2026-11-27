# unit-527setgeneric — results

**Drive clock:** `2026-11-27 09:27:08 PST` (printed by the arm, read in-process).
**Drive SHA:** `d20bb6efc6f0` (the pre-registration commit; registration SHA was `f9fa864272cf`).
**Captures:** `captures/ARM.out` 11,541 B · `captures/ARM.err` **0 B** ·
`captures/CONTROL-523.out` 47,253 B · `captures/CONTROL-523.err` **0 B**.
**Frozen subject:** `docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs`,
`sha256[0:12] = 35e449901131`, asserted clean against `HEAD` before slicing.
**Population:** 858 instrument files (`scripts/` + `docs/research/`, `CODE_EXT` sliced from the
frozen arm, not retyped).

**VERDICT: GRADED — KP 13 of 13, CONTROL 14 of 14. 15 predictions, 14 HIT, 1 REFUTED.**
The one refutation is P14, and it was refuted **before the drive, by reading** — see addendum 2.

---

## 1. The headline

**Curing the `'new Set('` string-literal needle moves exactly 4 of 126 population members, and the
boarded price — "worth ≥3 of 6 ceiling members" — is wrong about every number in it.**

| | boarded | measured |
|---|---|---|
| sites the cure recovers | "≥3" of the 6-member ceiling | **4**, of which **1** is among the three named |
| the three named sites | all three land in `UNRESOLVED`, all three recoverable | **one** is `OTHER-BOUND` and recoverable; **two** are `UNRESOLVED` and **not** recoverable by this cure under any locator |
| distinct (file, line) pairs behind "three sites" | implied 3 | **2** — `probe-round244…mts:188` carries two `.size === 1` comparisons on one line and is two population members |
| sites nobody named | — | **3** of the 4 |

## 2. Arm A — the reach of the needle

```
new Set, PLAIN      1268
new Set, GENERIC      71      <- invisible to the published needle, 37 files
new Map, PLAIN       403
new Map, GENERIC      88      <- L1, deliberately uncured here
```

Type-argument forms on the 71: `<string>` 53 · `<net.Socket>` 7 · `<number>` 5 · `<Hazard>` 4 ·
`<FlagKey>` 1 · `<ChildProcess>` 1.

**All 71 have a balanced paren span; 0 have a `.size` tail; 0 are direct `.size <op> <n>` tails.**

**The uncured half is larger than the cured half.** `new Map<…>(` is **88** against `new Set<…>(`'s
**71**, and `L1` declines it. Boarded below as this unit's successor, with that figure attached.

## 3. Arm B — the differential, one variable

The reader is one contiguous 7,893 B region of the frozen arm, sliced between two anchors each
asserted to occur exactly once, instantiated twice. The `CURED` instantiation carries four anchored
substitutions, each asserted to apply exactly once, **every before/after literal printed into the
capture** (`ARM.out:9-24`). The frozen file was never written.

```
                      PUBLISHED   CURED   delta
excludedDirectTails          60      60       0
INDIRECT population         126     126       0

SET-BOUND                    36      40      +4
OTHER-BOUND                  34      30      -4
SET-EXPR  MAP-BOUND  MAP-EXPR  UNRESOLVED  PROPERTY  CALL  RECEIVER-UNKEYED  SET-TAIL-DIRECT
   0 / 0     10 / 10    0 / 0       7 / 7    11 / 11  21/21        7 / 7           0 / 0

NARROWED HAZARD (SET-BOUND ∨ SET-EXPR) ∧ INVARIANCE:   4  ->  5
  guard:  {"BLIND": 4}  ->  {"BLIND": 5}
```

Class sums asserted equal to their populations at both ends (126, 126). The entire movement is one
transition, `OTHER-BOUND -> SET-BOUND`, 4 of 4.

**`unit-521`'s `GUARDED 0` now holds at 5 of 5.** The site the cure adds to the hazard is **BLIND**
like the other four, so the extended claim is: across the direct form, the indirect bound form, and
now the generic bound form, **not one instrument in this corpus excludes absence before taking a set
size.**

### 3.1 Disclaimer, registered up front so nobody downstream reads it as a correction

`unit-523` published `INDIRECT 123` and `SET-BOUND 34` over 855 files at `7bd926a0cc71`. The same
frozen arm, driven unchanged here at 858 files, reads **126** and **36**. **That is one day of
corpus growth, not a correction to `unit-523`.** The control (§5) is what licenses the statement:
the slice reproduces the frozen arm cell-for-cell *at this SHA*, so both numbers are the same
reader on two populations. `unit-526` §2 made exactly this disclaimer about `85` vs `58` yesterday
and it is the right default.

`MAP-BOUND 10` is likewise the reader's figure. `unit-523` already recorded, against itself, that
the true count is **16** by hand-read. Nothing here re-opens that; the reader is unchanged.

## 4. The four sites, whole lines

```
docs/research/unit-465bareline-2026-11-12/arm-bareline.mts:187   OTHER-BOUND/OTHER-N -> SET-BOUND/OTHER-N/BLIND
  ck('A4a', `baseline set rebuilt from … ${baselineKeys.size} keys (shipped F1 says 9 grandfathered)`, baselineKeys.size === 9);

scripts/probe-round207-…-not-unique.mts:410                      OTHER-BOUND/INVARIANCE -> SET-BOUND/INVARIANCE/BLIND
  check('E1', picks.size === 1, 'repeated resolution of a same-millisecond pair is stable', `${picks.size} distinct`);

scripts/probe-round256-…-coupled-class.mts:905                   OTHER-BOUND/EMPTY -> SET-BOUND/EMPTY/BLIND
  if (providers.size === 0) return own;

scripts/probe-round265-…-on-the-other-axis.mts:319               OTHER-BOUND/EMPTY -> SET-BOUND/EMPTY/BLIND
  if (providers.size === 0) return own;
```

**Only `probe-round207…:410` is in the hazard**, because only it is an `INVARIANCE` direction. The
other three are `OTHER-N` and `EMPTY` — real recoveries of receiver *kind*, and no change to the
false-green exposure.

**And the one recovery is the member with product reach.** `unit-525fixturepartition-2026-11-26`
`READ.md:98` keyed `probe-round207…:410` as member **#8** of the ten LIVE claims and recorded that
`picks` is filled at `:408` from `resolveImportEntity(…).entityId` — *a product call* — making it
**the only one of the ten whose `.size === 1` is a claim about product behaviour rather than about
an instrument.** The generic cure's single hazard-relevant recovery is exactly that member.

## 5. The control, without which none of §3 grades

The frozen arm was driven **unchanged** as a child process at the same SHA and its printed table
compared cell-for-cell against the `PUBLISHED` instantiation: population **126 = 126**,
`excludedDirectTails` **60 = 60**, all **ten** classes equal, narrowed hazard **4 = 4**.
**CONTROL 14 of 14.** `captures/CONTROL-523.err` is **0 B**.

## 6. Predictions

| # | registered | measured | verdict |
|---|---|---|---|
| P1 | `PLAIN ∈ [1250, 1320]` | **1268** | HIT |
| P2 | `GENERIC ∈ [40, 160]` | **71** | HIT |
| P3 | generic sites with a `.size` tail `∈ [0, 6]` | **0** | HIT |
| P4 | generic **direct** tails **= 0** | **0** | HIT |
| P5 | `SET-BOUND` gain `∈ [3, 14]`, same total lost by `UNRESOLVED ∪ OTHER-BOUND ∪ CALL ∪ RECEIVER-UNKEYED` | **+4**, and `-4` all from `OTHER-BOUND` | HIT |
| P6 | my own boarding text is **FALSE**: member #8 is `OTHER-BOUND`, not `UNRESOLVED`; `UNRESOLVED` loses **0** | `:410` is `OTHER-BOUND` under PUBLISHED; `UNRESOLVED` **7 → 7** | HIT |
| P7 | the cure recovers **exactly 1** of the three named; #9/#10 are default parameters, `bindingOf` null under both locators | `:410` moves; both `round244:188` members hold `UNRESOLVED` with `bindLine=null` under both | HIT |
| P8 | narrowed hazard **4 → 5** | **4 → 5** | HIT |
| P9 | control: **10 of 10** classes equal | 10 of 10, plus population, exclusions and hazard | HIT |
| P10 | `new Map<…>(` `∈ [10, 120]` | **88** | HIT |
| P11 | **≥ 8** KP/KN cells, **100%** | **13 of 13** | HIT |
| P12 | `INDIRECT` under PUBLISHED `∈ [123, 140]` | **126** | HIT |
| P13 | population shrinkage under CURED **= 0** | **0** | HIT |
| P14 | generic direct tails are `CALL` under **both** instantiations, = 0 | unsatisfiable as written | **REFUTED by reading, before the drive** (addendum 2) |
| P14′ | `G = 0`; under PUBLISHED all `G` are `CALL`, under CURED all `G` are excluded | `G = 0`, and **K8 proves the mechanism reachable on a plant**: `CALL` under PUBLISHED, `EXCLUDED` under CURED | HIT |

**The measured zeros are not dead arms.** P4/P13/P14′ all read 0, and `K8` is the known positive
that makes those zeros a finding rather than a silence: a planted generic direct tail *is*
misclassified `CALL` by the published reader and *is* excluded by the cured one. A key returning 0
without a known positive is not a measurement.

## 7. Against me

1. **P14, refuted by my own source read twenty minutes after I registered it** (addendum 2, written
   before the arm existed). I derived correctly that `receiverSpan` stops at the `>`, then asserted
   a conclusion about the site's *class* without reading the top of the pipeline that decides its
   *membership*. **A reader's blindness does not decide a site's class when something upstream
   decides membership first.** The derivation was real; the file I had not opened was two functions
   away.
2. **My boarding text was wrong three ways, and I had the evidence for all three in the frozen
   file.** "All three land in `UNRESOLVED`" (one does not — `bindingOf:150` carries an optional
   annotation group that makes the declaration match); "worth ≥3 of 6" (worth 1 of the 3 named, 4 of
   the population); and "its three sites" (two lines, three members). **Every one of those was
   checkable by reading `bindingOf` and the capture, which is what boarding is supposed to do and
   did not.**
3. **3 of the 4 sites the cure actually moves were named by nobody** — `arm-bareline.mts:187`,
   `probe-round256…:905`, `probe-round265…:319`. The item was boarded off the three sites I had
   found by hand, and the hand-found set was **25%** of the population the cure reaches. *A hand-read
   set of instances is not the population a cure moves, even when the mechanism is correctly
   identified.*

## 8. Open

- **Closed:** the `new Set<T>(` locator blindness is **measured and priced**: reach 71 sites / 37
  files, 4 population members move, narrowed hazard `4 → 5`, `GUARDED` still **0**, direct-tail
  census **unaffected**. Nothing is asked of any other seat.
- **Not landed, and deliberately:** nothing here edits `unit-521`'s or `unit-523`'s frozen arms
  (settled 11/20). The cure exists as the four printed substitutions plus their KP set; a future
  reader that wants it has it.
- **New, mine, unblocked, boarded:** **`new Map<K, V>(` — 88 generic sites against the Set form's
  71, and `L1` declined it here.** `MAP-BOUND` reads 10 while `OTHER-BOUND` still holds 30 after
  the Set cure, so the Map form is the larger uncured half of one mechanism. Needs its own pinned
  population and its own KP set, exactly as this one did.
- **New, nobody's:** the **two `round244…:188` members** need a *different* mechanism — a binding
  reader that can see a **default parameter**, which `bindingOf` cannot by construction (it reads
  `const|let|var` declaration lines). Named here with its price: **2 members, both `UNRESOLVED`,
  both `INVARIANCE`, both on one line.**
- **Declared limits, unchanged:** `L1` generic `Map` uncured (88 sites); `L2` nested generics
  (`new Set<Map<…>>(`) missed by the cure's own locator — `K9` is its known negative; `L3` folded
  into `L2`; `L4` narrowed by addendum 2.
- **Argus:** no gate figure moved. `population 65 · MARKED 4 / GUARDED 3 / UNGUARDED 58 ·
  baseline 58`, `tracked files read 1124` at the pre-registration push.
