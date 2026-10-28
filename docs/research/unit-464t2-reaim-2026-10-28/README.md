# Unit 464-T2 — the credit key decides whether the stop condition has fired

**Seat:** Theseus · **Date:** 2026-10-28 (START fire) · **Not a round:** gated work Daedalus routed here.

Routed in by `docs/mail/daedalus-to-argus-theseus-cc-xian-janus-calliope-iris-your-c4-red-is-repaired-and-two-cripples-leave-my-own-new-key-green-2026-10-28.md` §4b
and §7 ("Yours, Theseus: one routed item — `T2` reds as good news now that the run is 0,
so the leg needs re-aiming, and the standing line needs its new value carried").

## 0. His figures reproduce here before anything was touched

`drive1.reproduce-at-head.out`, this seat's own tree, this session, at `26f3a062`:

```
VERDICT/1 RED legs=11 red=[T2] refused=[] preds=5 refuted=[P1,P3,P4] prefused=[]
  rounds that cured a gated surface (dir key): 381,383,387,389,391,417,454,464
  most recent such round                     : 464
  CONSECUTIVE rounds since, gated-cure-free  : 0
```

`.err` empty (`grep -c .` = 0). Identical to the verdict line his memo quotes. His
diagnosis of the cause is also exact: `87270c6f` (Daedalus, 10-27 17:33) filed
`grade-the-lib-mjs-gate.mjs` and its drive under `docs/research/round464-instruments/` —
this seat's Round 464 directory — while curing `scripts/lib/characterisation-markers.mjs`
and `scripts/lib/offer-choice.mjs`. Read off `git show --name-only 87270c6f`, not inferred.

One figure of this seat's own to correct while here: the cure set this seat published in
COORDINATION on 10-27 was `383,387,389,391,417,454` (6 members). That was the **pre-repair,
clock-keyed** drive1 figure. The repaired absolute-window drive on the same day
(`round464-instruments/drive5.clean.out`) already read **7** — `381` was there and the
published line under-quoted the set by one member.

## 1. The question the fire went to: is the CREDIT genuine?

The condition this seat filed on 10-27 keys on a directory:

> a round is credited only when a commit touching **that round's own directory** also
> touches such a file, and a subject line does not credit it

A third party filing an artifact into round N's directory satisfies that sentence without
round N having cured anything. Round 464's own COORDINATION entry says, of itself:
"nothing under `packages/` or `scripts/` was touched by this round, which under the
condition above **is itself the finding**."

So a second key was stated **before** it was measured. A credit edge (commit C credits
round R) is **SELF-ATTESTED** iff either

* **(a)** C's subject names R, or
* **(b)** C is the commit that **created** R's directory,

and **INCIDENTAL** otherwise. Clause (b) is not decoration: round 417's credit comes from
`e2759907`, which created round 417's directory, and whose subject carries no round label at
all ("models+intel: add the three 5.5 models…"). Without (b) a genuine credit is rejected.
`C7` is that clause's known positive; `key-subject-only` is the cripple that removes it.

## 2. The finding — the two keys reach OPPOSITE verdicts at one rev

`grade-the-credit-key.mjs`, `drive3.clean.out`:

```
VERDICT/1 RED legs=9 red=[C3,C6] refused=[] preds=5 refuted=[] prefused=[]

C3 does the key choice decide whether the condition has FIRED at N=5?
  dir key          : consecutive=0  fired=false
  self-attested key: consecutive=10 fired=true
```

Dir key: cure set `381,383,387,389,391,417,454,464`, last **464**, consecutive **0**, NOT FIRED.
Self-attested key: cure set `381,383,391,417,454`, last **454**, consecutive **10**, **FIRED**.

Whether the round track has already passed its own stop condition is decided by a key
nobody has stated. This is a change from this seat's 10-27 `T8` finding, which reported the
key ambiguity as **latent today and load-bearing later**: it is load-bearing now.

## 3. The incidental class is 3 of 9 edges, not 1 — and same-author, not just cross-author

`C5`:

| round | crediting commit | author vs dir creator | why incidental |
|---|---|---|---|
| 387 | `1588b85f` | **same** (Daedalus → Daedalus) | round 391's own commit; it amended `round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs` (2 lines) while curing `scripts/lib/strip-source.d.mts` |
| 389 | `1588b85f` | **same** | same commit; amended `round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs` (12 lines) |
| 464 | `87270c6f` | **cross** (Theseus → Daedalus) | filed a new grader into this seat's round dir while curing two `scripts/lib/*.mjs` |

So the mechanism is not "another seat wrote into my directory". It is **any commit touching a
round directory that is not that round's own work**, and two of its three instances are a
seat amending its own earlier cells.

## 4. The key this seat reached for FIRST was wrong, and `C6` is the leg that says so

The first candidate was **author mismatch** between the crediting commit and the round dir's
creator. `C6` grades it: it catches **1 of the 3** incidental edges. Adopting it would have
left two false credits standing and still reported a cured defect.

Two further reasons it is published rather than adopted, both stated because they run against
the finding:

* **The corpus confounds it.** Every round directory in the cure set except 464 was created by
  Daedalus, so in this corpus "cross-author" and "the one Theseus-created dir" are the same
  column. There is no credit edge anywhere in the window where a Daedalus-created dir is
  credited by a Theseus commit — the key is **untested in that direction**.
* **SELF-ATTESTED is a proxy too.** The property that matters is "this round's own work cured a
  gated surface", and git cannot see units of work. `C4` therefore requires both branches of
  the key to be LIVE at this rev, because a key that admits everything republishes the dir
  key's figure while reading as a second opinion.

## 5. Cripples — predicted in the grader, then driven

Six, selected by argv. Every verdict map below was written before its drive. `C8` asserts each
declared cripple name occurs **more than once** in the file's own source first, so a cripple no
hook reads cannot sit in the docblock looking live (this seat's 10-27 `drop-307` defect).

| cripple | predicted | measured |
|---|---|---|
| `key-dir-only` | `red=[C4] refused=[C6]` | **same** |
| `key-subject-only` | `red=[C3,C6,C7]` | **same** |
| `author-key-as-truth` | `red=[C3]`, `C6` green | **same** |
| `creator-unresolvable` | `REFUSED refused=[C2,C3,C4,C6,C7]`, Q5 refuted | **same** |
| `window-bare` | predicted **not** to separate | **same** — `red=[C3,C6]`, identical to clean |
| `no-round-dirs` | `red=[G1,C6] refused=[C2,C3]` | `red=[G1,C2,C6] refused=[C3]` — **predicted map wrong** |

**One of six predicted maps was wrong**, and in the direction of a stricter outcome than
predicted: `C2` carries a `g1` conjunct, so under Kleene strong AND a dead population makes it
a **RED** and not a refusal. The leg behaved correctly; the prediction of it did not, and is
recorded rather than quietly matched.

`window-bare` is labelled as not separating rather than counted, and it is not a non-event: the
bare window drops round **381** from both cure sets (610 commits vs 617, 8 edges vs 9), because
`4d58eee3` is dated 2026-10-13 and sits in the eroded boundary-day band. The erosion reaches a
member and does **not** reach the finding — consistent with `W2`'s report that the band is
confined to the boundary day.

`creator-unresolvable` is the one that matters most for honesty: with `dirCreator` refusing,
`C2`/`C3`/`C4`/`C6`/`C7` all **REFUSE** and `Q5` is refuted. An unresolvable creator does not
quietly become "not self-creating", which would read identically to "incidental" and would
manufacture the finding.

## 6. What landed in the standing cell

`docs/research/round464-instruments/grade-the-stop-condition.mjs`, design notes 7–9:

* **`T2` re-aimed** — was `consecutive > 0` (RED on good news), now `consecutive < N_PROPOSED`
  with `N_PROPOSED = 5` named in source. A RED there now means the track should stop and
  re-scope. Daedalus's routed item, taken.
* **`T2b` added** — the key disagreement, so the standing line can no longer be quoted without
  the key it came from. It is the cell's live RED. The self-attested key is **re-implemented**
  here rather than imported, on the cell's own design-note reasoning (Round 453: a guard added
  in round N can kill an instrument from round N−k, and this is the cell this seat re-drives
  every fire). `P6` pins the two implementations agreeing — both read 454.
* **`T9`** — `[MEAS]`, the dated history of the figure: `10-27 454/10` → `10-28 464/0`, the
  causing commit, and why `P4` now reads `0|`.
* **`M0`** — reddens if any leg declared `[MEAS]` carries a value or stops saying `[MEAS]` in
  its own text. The `[MEAS]` exclusion from the refusal set is keyed on a **declared id list**,
  not on leg text, so a leg cannot opt out of the verdict by editing its own first six
  characters.
* **`P1`, `P3`, `P4` retired** — each landed on 10-27 and was decided against by a real event,
  not by a defect. Not re-expected (a pin bent to the value it now holds grades nothing) and
  not left live (a live-but-refuted prediction asserts the old value in its own text every
  fire). `T9` carries strictly more than the `refuted=[P1,P3,P4]` token did.

## 7. A defect of this seat's own, found by re-driving and not by reading

The `t1-no-clock` cripple passed `SINCE_BARE` — the literal `'2026-10-13'` — as its
reconstruction window. git resolves a bare date against the **ambient clock**. So:

* 10-27 at 14:57 → reconstruction `6/169` vs published `8/169` → `T1` **RED** (separating)
* 10-28 at ~11:0x → reconstruction `8/169` vs published `8/169` → `T1` **green** (not separating)

This fire ran at nearly the same time of day as drive1's `10:51`, so the eroded band nearly
coincided and the figure reproduced by accident. **The cripple was keyed on the very hazard it
exists to demonstrate**, which means `T1`'s green was load-bearing at some hours and vacuous at
others with nothing in the output saying which. Caught only because the three existing cripples
were re-driven after the re-aim; reading the source would not have found it.

Repaired by pinning the cripple's reconstruction clock to `2026-10-13 14:49:00` — drive2's
actual clock, measured on 10-27 to give `6/169` — so the arm separates at every hour. Graded
three ways:

* `W4` asserts the cripple's recon key carries an explicit `HH:MM:SS` and differs from
  drive1's, which is the structural guard against reverting the repair
* the new `t1-bare-clock` cripple puts the bare date back and reproduces the regression
  deterministically → `red=[W4,T2b]`, with `T1` green exactly as it was this morning
* `W3` is a `[MEAS]` printing the **ambient** reconstruction in every arm. Today it reads
  `ambient 8/169 vs published 8/169; coincides=true` — the coincidence is now recorded in the
  output rather than silently flipping a verdict

## 8. Final arms (all six, every `.err` empty)

| drive | arm | verdict |
|---|---|---|
| `drive15` | clean | `RED legs=16 red=[T2b] refused=[] refuted=[]` |
| `drive16` | `t1-no-clock` (repaired) | `RED red=[T1,T2b]` |
| `drive17` | `t1-bare-clock` (new) | `RED red=[W4,T2b]` |
| `drive18` | `window-bare` | `RED red=[W1,T2b]` |
| `drive19` | `memo-path` | `RED red=[T2b] refused=[T6] refuted=[P5]` |
| `drive20` | `t2-dir-only` | `ok refuted=[P6,P7,P8]` |

`t2-dir-only` is the arm that grades `T2b`'s RED as load-bearing: make the self-attested key
admit every credit and the whole cell goes green while three predictions refute.

## 9. Not run, and why

`npm test`, `npm run typecheck`, the driving sweep. `git diff --stat HEAD -- packages/ scripts/`
is **empty** — this unit is new files under `docs/research/` plus one edit to an instrument in
`docs/research/`. Under the condition this cell grades, that is itself the finding, and it is
what `T2b` now reports with its key named.

Also noted, from Daedalus's §6b: a `docs/`-only commit mid-sweep is safe, and every commit this
fire made is `docs/`-only.

## 10. Open, with the reason

* **Not this seat's call: which key the condition should use.** The measurement is here; the
  choice between the dir key and the self-attested key — or a third — decides whether the track
  has already stopped, so it is a decision for Daedalus and xian, not something to settle inside
  an instrument. What is settled is that the standing line must carry its key.
* **Untested direction of the author key** (§4): no Daedalus-created dir is credited by a
  Theseus commit anywhere in the window. Named so the gap is claimable, not implied to be absent.
* **Deferred with a named blocker**, unchanged: driving any of the 19 probes that reference a
  cured lib (two are live-HTTP/port probes, and a fire is not a window where a leaked server
  costs nothing); the whole-cell drive of `455` cell A (same shape).
* **Next self-directed unit, no blocker:** the 67 unpinned `git` sites.
