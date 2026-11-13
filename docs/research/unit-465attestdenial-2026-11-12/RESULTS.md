# Unit 465-attestdenial — RESULTS

2026-11-12 WORK fire, Theseus. Pre-registration: `README.md`, pushed at `3d8cac59` **before the
grader existed**. Cripple maps: `cripple-maps-predicted.md`, pushed at `684dea64` **before the
first drive**.

```
drive1.clean.out                      VERDICT/1 RED legs=9 red=[T2,T4,T6] refused=[] preds=6 refuted=[P2,P4,P6]
drive4.cripple-blind-key.out          VERDICT/1 RED legs=9 red=[T1,T2,T6] refused=[] preds=6 refuted=[P1,P2,P6]
drive5.cripple-prior-as-now.out       VERDICT/1 RED legs=9 red=[T1,T2,T6] refused=[G3,T4,T5] prefused=[P4,P5]
drive6.clean-matched-to-cripples.out  VERDICT/1 RED legs=9 red=[T2,T4,T6] refused=[] preds=6 refuted=[P2,P4,P6]
```

**3 of 6 predictions refuted. The item is discharged, and the answer it was supposed to be checked
against is wrong.**

## 1. The item is done, and it is done by import

Daedalus's 10/28 §7 named *"re-keying your attested-round census to exclude denials"* as open on
this seat. It is now keyed by `grade-the-denial-rekey.mjs`, which **imports** `attestedRounds`,
`DENIAL_RE` and `LEGACY_DENIAL_RE` from `docs/research/lib/attested-rounds.mjs` and re-types none
of them. The 10/28 recon that published the denial-blind 175 was **not edited** — it is a stamped
recording, and the re-key belongs beside it, not inside it.

**P1 LANDED.** His published `M3` reproduces exactly at his own rev, under his own key, read by his
own module: `A=175 C=174 removed=[465] max=467` at `69cf9167`
(`drive1.clean.out:9-11`; his line is `unit-464t2-rekey-2026-10-29/drive5.pop-cured-f3-reaimed.out:10`).
So the pinning and the import are sound, and everything below is about the subject rather than the
instrument.

> **ANNOTATION, added 2026-11-12 STOP fire — the quantity these numbers count was never printed
> beside them, and it cost a peer a refuted prediction.** `A` and `C` are **cell names** from
> `drive1.clean.out:9-11`, not quantities. Keyed, from `unit-465keyed-2026-11-12/drive1.out:10`:
> at `69cf9167` the **population** count is **464**; **175** is the count of members **above the 292
> floor under the denial-blind key**; **174** is that same above-floor count **under the cured key**.
> Daedalus read the unlabelled `175 → 174` as a population count and pre-registered `P3b` on it
> (`unit-465srckeys-2026-11-12`, measured `464 → 464`, scored refuted); and my own re-prediction of
> **175** in `unit-465keyed` came back **RED at 174**, because I reached for the wrong one of my own
> two cells five hours later. The label existed at birth — his 10/28 memo `:93-94` reads *"attested
> above 292, raw : 175"* and *"above 292, denial-filtered: 174"* — and was dropped in that same
> memo's own summary line `:198`, which is the sentence everyone subsequently quoted. **Not
> rewritten:** the figures below are a stamped recording and are correct under their cells; what was
> missing is this paragraph. See `unit-465keyed-2026-11-12/RESULTS.md` §1.

## 2. P2 REFUTED — at HEAD the cure removes nothing, and his "known answer" was one filename from zero

> *"I've now measured the exact loss (`[465]`, 175 → 174), so that one is a one-line change against
> a known answer."*

At HEAD: **`loss = 0`, `removed = []`** (`drive1.clean.out:12-15`). The cured key and the
denial-blind key return the **same 175 members**.

**What changed, measured not inferred** (`drive3.recon.out`):

* **Zero** commit subjects in `69cf9167..HEAD` name round 465 at all — affirmatively or otherwise.
* The **raw** (denial-blind) population gained **0** and lost **0** members over the interval. The
  two 175s are the same 175 members, checked as a set difference in both directions and not as a
  count comparison.
* 465 is now credited by a **non-subject source**: three files named
  `packages/server/src/__tests__/round465-{data,drop,schema}-delta.test.ts`, added **2026-11-06** by
  Daedalus in `c16f53ac`, `4d04227b`, `b3344f75` — **three commits whose subjects name no round at
  all** (`git log --diff-filter=A` on the three paths, this fire).

And the module's filter is explicit about why that ends the removal: a round is dropped **only**
when every attestation of it is a denial — `nonSubject.has(n) || affirmedBySubject.has(n)` keeps it
otherwise (`attested-rounds.mjs:186`).

**So the generalisation, which is the part worth keeping:** the denial key is a **subject-level**
key, but membership is an **OR across four sources**. A figure quantifying a subject-level key's
price is therefore not a measurement of that key's hazard — it is a measurement of *which of the
four sources happened to name that round on the day you ran it*. `[465], 175 → 174` was one test
filename away from `[], 175 → 175` the whole time, and the filename that erased it was committed
**eight days after** the figure was published, by its author, in work that had nothing to do with
it.

His own docblock already says the cure is *"prophylactic for this population"*. This is stronger
than that: the **price** he measured was also an artefact, not just the benefit.

## 3. P4 REFUTED, and the refutation is the headline the README predicted for the wrong reason

Prediction was *no movement*. Actual: the cured measure **gained exactly one member — 465** — over
**765 commits** and **83 new `unit-*` dirs**, with **0** new `roundNNN-instruments/` dirs
(`drive1.clean.out:22-110`, `T5` green).

But the raw population moved by **nothing** (§2). So the single movement in the attested measure
over 15 days is **the denial filter releasing a member because a test file got named**, not a round
being attested.

**The measure that replaced a dead measure is dead in the same sense, and this unit's own figure
says why.** `drive7.units-per-round.out`, re-runnable off the committed recording:

```
unit dirs enumerated there: 83
  round 464: 45 unit dirs
  round 465: 38 unit dirs
distinct round numbers attested by the unit-dir naming: 2 → [464,465]
```

**83 units of work sit inside 2 round numbers.**

> **ANNOTATION, added 2026-11-12 STOP fire — this is an INTERVAL figure and the sentence did not say
> so.** 83 is the count of unit dirs **added over `69cf9167..684dea64`**, and it reproduces exactly at
> this unit's own drive rev (`unit-465keyed-2026-11-12/drive2.out:23` — dirs at `69cf9167` = 8, added
> to `684dea64` = **83**, rounds `{464,465}`). The **standing** figure at the same rev is **91 dirs
> inside 3 rounds** `{307,464,465}` (`307: 2 · 464: 51 · 465: 38`), because both `unit-307c4-*` dirs
> predate `69cf9167` and this enumeration excludes them by construction. Daedalus's §6 named this and
> published the standing figure as **92 inside 3**, which is right at `04414a41` — the commit that
> created his own unit dir, one commit after the rev his drive cited. **The §7 conclusion is untouched
> under either key** (~1 new round number per six weeks against `N_PROPOSED = 5`), but the figure to
> quote if the stop condition's unit is actually re-keyed is the standing one, with its rev.

The stop condition counts *rounds*
(`N_PROPOSED = 5`, `round464-instruments/grade-the-stop-condition.mjs:78`). The team stopped
working in rounds somewhere around 464 and started working in units; at ~1 new round number per
six weeks, `consecutive >= 5` is not a threshold the track can reach on any horizon anyone is
planning on. That is not staleness and it is not saturation — the dir measure was saturated. This
is a **unit mismatch**: the measure's unit is no longer the unit of work.

## 4. P6 REFUTED on both conjuncts, and one of the two is my error

Driving `round464-instruments/grade-the-stop-condition.mjs` as a child at HEAD
(`drive2.standing-cell-child.out`):

* `CONSECUTIVE rounds since, gated-cure-free : **3**` — his `M8` published **2** on 10-29. It moved,
  and §3 says the mover was a filename. The slice is `[465,466,467]` today against `[466,467]` at
  his rev (`drive3.recon.out:16-18`), and of the three, **465 is the only one with no affirming
  subject** — it is in there on the test-filename source alone, while also being denied elsewhere
  (`drive3.recon.out:21-23`).
* `exit = 1`, on `VERDICT/1 RED legs=26 red=[T2b] refused=[T8] refuted=[P7,P2]`. **This is the
  cell's standing state, not something this fire broke:** his own last clean drive publishes
  `red=[T2b] refused=[T8] … refuted=[P7,P2]` at `unit-464t8-2026-10-29/drive7.clean-final.out:262`.
  **Predicting exit 0 was my mistake and it was avoidable** — the subject's own last committed clean
  recording published the exit state, and I predicted it from the cell's design instead of reading
  the recording. *An exit-code prediction about a cell that has a committed clean drive should be
  read off that drive, never derived from its source.*

## 5. T3's green is vacuous at HEAD, and the cripple map is wrong in the same place for the same reason

`T3` asserts the as-filed key and the cure agree member-for-member. It is **green in every arm**,
including `blind-key` — where the live key is the never-matching one and the map predicted RED.

The reason is §2: at HEAD **neither** key removes anything, because 465 is credited by a
non-subject source that no denial key can touch. So `T3`'s agreement is an agreement about two
**empty removal sets**. At his rev the same leg was non-trivial — both keys removed `[465]`.

`T3` guards against an empty *filtered* population (`sameMembers` refuses when either side is
empty) and that guard is live and correct; it does not guard the thing that actually went vacuous.
**The leg needed a conjunct asserting the removal sets are non-empty — that the two keys agree
about something, not merely agree.** Not re-keyed here: re-keying a leg after its drive re-scores a
graded run. Named as the next edit, and named in the cripple map it falsified.

## 6. Cripple maps, scored against `drive6` (the matched baseline), not against `drive1`

`drive6` is a clean re-drive at **the cripples' own rev** (`d6f5616a`) and reproduces `drive1`
leg-for-leg. It exists because `REV_NOW` is HEAD at run time and three commits of mine landed
between `drive1` and the cripples — so the baseline is **checked** as matched rather than assumed.
*(Declared hazard, and it is not hypothetical: an instrument whose population includes commit
subjects is perturbed by the fire running it. Checked — none of this fire's subjects names a round.)*

| leg | clean | blind-key | prior-as-now | predicted | verdict |
|---|---|---|---|---|---|
| `G3` | ok | ok | **REF** | REF on prior-as-now | **HIT** |
| `T1` | ok | **RED** | **RED** | RED on blind-key; on prior-as-now *"passes only if 175/174/[465]/467 is also today's reading … if T4 lands, T1 must pass here"* | **HIT both** — T4 did not land, so the conditional's other branch is the one that fired |
| `T2` | RED | RED | RED | RED on blind-key | **UNGRADED** — red in the clean arm too, and `[false,false]` cannot be told from an untouched defect. The arm built to prove `T2` non-vacuous cannot, because `P2` was refuted. |
| `T3` | ok | ok | ok | RED on blind-key | **MISS** — §5 |
| `T4` | RED | **ok** | **REF** | ok on blind-key, REF on prior-as-now | **tokens HIT, one note FALSE** — the map said *"the growth finding does not rest on the denial key."* It does: the cripple takes `T4` from RED to green, because blinding the key removes the 465 release that is the entire movement. A cell can match while its reason is wrong. |
| `T5` | ok | ok | **REF** | REF on prior-as-now | **HIT** |
| `T6` | RED | RED | RED | "ok" on both | **map spelling error** — I wrote the *unchanged* cells as `ok`, which is only the same thing if the clean arm is green. Inherited from predicting all six predictions would land. |

**`prior-as-now` did exactly what it was built for:** a zero-length interval makes "the measure did
not move over the interval" true by construction, and `G3`/`T4`/`T5` **refuse** rather than passing
— `refused=[G3,T4,T5]`, the predicted set exactly.

## 7. Routed, not applied

**To Daedalus, his module and his standing line.** Two things, neither shipped here:

1. **The attested population cannot see `unit-*`.** A fifth source (`^docs/research/unit-(\d+)`)
   would make it see the live track. **Measured price today: zero new members** — the 83 unit dirs
   attest `{464, 465}` and both are already in. So this buys nothing today and does not fix §3's
   unit mismatch; it only stops the *next* round number arriving invisibly. Routed, not adopted:
   it is a change to the population a figure in `COORDINATION.md` is counted over.
2. **`T3`'s missing conjunct** (§5). One line, in his lib's consumers rather than the lib.

**To xian / Janus, because it is not a measurement question.** `consecutive` counts rounds;
83 units of work in 15 days produced **2** round numbers. Either the stop condition's unit becomes
the unit (and `N_PROPOSED = 5` means something again), or the condition is retired as unreachable.
My read: the condition as written cannot fire, and a condition that cannot fire is not a
conservative guard — it is the same dead-measure failure one level up, which is the finding
Daedalus's own lib docblock makes about the surface it replaced.

## 8. Not claimed

* **No `packages/` or `scripts/` change.** `git status --porcelain -- packages/ scripts/` empty at
  the end of the fire, so **no gate leg is owed and none is claimed**. The one new `.mjs` files are
  under `docs/research/`, which `typecheck:scripts` does not cover and `readdirSync('scripts')`
  does not see, so the probe population is unchanged.
* **The three `round465-*.test.ts` files are not touched and must not be renamed.** They are real
  tests; the defect is in a population key that reads filenames, not in the filenames.
* **Daedalus's other two items on this seat remain open** — `C3` carrying its reading, and putting
  his 10/28 §1–§4 under graded legs. This unit took the second of three and does not close the
  thread.
* **Declared blindness, carried:** nothing in this unit grades the census's **four source
  patterns**. `selfTest()` grades the denial key against a known positive and a control; a
  mis-written source regex would be green in all four arms here. §2's finding is precisely that the
  source patterns carry the load, so this is the blindness that matters most and it is not cured.
* Delivery is the wrapper's to log.
