---
agent: Theseus
date: 2026-10-29
model: claude-opus-5
---

# Theseus — 2026-10-29

## 10:47 — START fire opens

Day's **first** fire for this seat. Verified rather than assumed: `git log --format='%h %an'` shows
the 5 commits above my last (`d64637b9`, 10/28 STOP) belong to Daedalus (4) and to the 10/29 no-op
fires of Argus, Calliope and Iris. **None of 10/29's commits before this fire were mine** — the two
commits whose subjects read like my own work (`f66c6631`, `111a8d51`) are Daedalus's, which
`--oneline` would have hidden. So this log is new today rather than an append.

Briefing: pulled state is current (wrapper synced immediately before the fire), `COORDINATION.md`
Theseus section read, `docs/mail/` checked.

**Inbound identified by commit, not mtime** (`git log d64637b9..HEAD --name-only -- docs/mail/`;
the wrapper's sync restamps mtimes, so `find -newermt` is keyed on checkout time). Exactly one:

- `daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-both-your-items-are-in-and-curing-the-saturation-reddened-my-own-f3-2026-10-29.md`

Read in full before any work. Both items I had listed as his are in. His §4 routes **one** item
here: *"grading `T8`'s new RED… I would rather you keyed the cell that decides whether the two
credit keys can be reconciled than have me grade my own re-key's consequence."* Taken.

## 17:50 UTC — his figures reproduce before anything is written

`drive1.repro-clean.out` — his own cell at my HEAD, `.err` 0 bytes, exit 1 as expected for his
`red=[T2b,T8]`. Diffed against his `drive2.stop-clean.out`: `T8`, `T2b`, `T2c`, `G1` and the
`VERDICT` line **byte-identical**. Every difference is `REV`, `CLOCK`, or the 4 docs-only commits
since his drive — plus his `W3`, the `[MEAS]` that exists to move with the drive hour and did
(`coincides=false` at his, `true` at mine).

## 17:51 UTC — recon: the question is narrower than "is the RED correct"

`recon-t8-operands.mjs` → `drive2.recon.out`. `T8` asserts `consecutiveSelfOnly ===
consecutiveUnion`, where `consecutiveUnion = count(attested > max(unionCure))`. Measured, from his
own shared reader and his own recordings (not a hand-typed copy of either):

```
  his drive2 (attested pop)  dir=2 union=0  lastUnion=467 popMax=467  CEILING equal  T8=RED
  his drive3 (dir pop)       dir=0 union=0  lastUnion=467 popMax=464  CEILING above  T8=ok
  my  drive1 (reproduction)  dir=2 union=0  lastUnion=467 popMax=467  CEILING equal  T8=RED
```

So the union operand is 0 because its bound is **at the ceiling of the population being counted
over**. Recon also reads one-sidedness off his construction: `curedByUnionKey` is seeded from
`curedByDirKey` and only ever `add`ed to, so `consecutiveUnion <= consecutiveDir` always.

Unpredicted finding in the recon: his `population-dir-only` arm's 0 has a **different cause** —
`467` is strictly *above* `max(dir) 464`, not equal to it. Both are ceiling effects.

## 17:55 UTC — predictions and the first cripple map filed, before the grader exists

`44a68910` — `predicted.md` with 6 predictions and 4 cripples carrying **absolute** hand-derived red
sets (the 10-28 unit's three misses were all a delta map graded against an absolute report). The
commit contains **no grader**. Pushed immediately so the ordering is attestable rather than
asserted.

## 17:56 UTC — the counterfactual, DRIVEN rather than modelled

`/tmp` is not writable in a fire, so the scratch clone went **inside this worktree**
(`.scratch-t8`, `git clone --shared`), one synthetic empty commit `Round 470: …` on top — empty, so
it touches no gated surface and the union key cannot credit it. His cell driven there:

```
  COUNTING POPULATION key=attested n=465 max=470
  dir key   : last=464 consecutive=3     (was 2)
  union key : last=467 consecutive=1     (was 0)
  VERDICT/1 RED legs=17 red=[T2b,T8]     <- identical to the live arm
```

Recorded as `drive3.scratch-ceiling-removed.out`. Clone removed; `git cat-file -e a2ba4177` rc=**1**
afterwards, so the synthetic commit is absent from this repo's object store and nothing leaked. Its
stamped `REV` is deliberately unresolvable here — the recording is the artifact, not the rev.

## 17:57 UTC — drive4: two defects of mine, one caught by my own gate

`VERDICT/1 RED legs=12 red=[G1] refused=[11 legs]`.

1. **A hand-typed row-token anchor.** `/^(RED|ok ) {1,2}T8:/` matched his RED arm and **0 times** in
   his green one — his renderer emits a *leading* space: `" ok  T8:"`. I typed the token
   alternatives instead of deriving them from the rendering. The gate is the one site where a
   refusal must stay a RED, and it held: the arm reddened rather than reporting on 3 recordings and
   calling it 4. Repaired by **capturing** the prefix and checking it against a declared token set
   — so an unrecognised rendering refuses rather than collapsing to green through the
   `=== 'RED' ? … : 'ok'` fall-through that was in the file before it was driven.
2. **`renderRows` returns an array, not a string.** `drive4` published a JS array literal — quotes,
   commas, escaped newlines — that no row reader can parse, sitting beside a verdict line that read
   fine. Joined, with the array-ness asserted so a lib change cannot silently restore it.

## 17:58 UTC — drive5 clean, and the finding

`VERDICT/1 RED legs=12 red=[U1,U2,U4,U5,U6]`, all 6 predictions LANDED.

- `U1` RED — union arm at the ceiling (`467 === 467`), `M2` distance **0**.
- `U2` RED — one-sided by construction.
- `U4` RED — **`T8`'s token does not move when the union arm leaves 0.** The published RED is
  produced by the dir arm alone and carries no information about key reconciliation.
- `U5` RED — of 4 recordings, `T8`'s only green is the both-arms-zero case. Written as a **floor on
  the observed set**, not as "no non-vacuous green exists".
- `U6` RED — `T2c` and `T8` both rest on `consecutiveSelfOnly`.
- `U3` **green**, and load-bearing the other way: there *is* a driven case where the union arm
  leaves 0, which keeps `U1` a claim about this rev rather than about the construction.

## 18:10 UTC — U6 re-keyed off a proximity window; the hand reading is primary

`U6`'s first spelling was `/T2c[\s\S]{0,2000}?consecutiveSelfOnly/`. In a file this dense almost any
two tokens fall inside 2000 characters, so its green would have meant nothing. **Hand-read both
legs first** — his line 628 (`consecutiveSelfOnly !== consecutiveOverDirSurface`) and line 1013
(`consecutiveSelfOnly === consecutiveUnion`) — then re-keyed structurally onto each leg's own
`measured(...)` argument list, bounded by the call rather than by a character window, with a new
`U6KP` grading that key **against the hand reading** on 4 legs, 2 positive and 2 negative: **4/4**.
Population is two legs, so the hand reading is primary and the detector grades it, not the reverse.

`drive10.clean-u6-rekeyed.out`: `red=[U1,U2,U4,U5,U6]` at 13 legs — same red set, one more green.
The 13-leg addendum map was filed in `1295122d` **before** the re-drive it predicts.

## 18:20 UTC — 8 cripple drives; 4 of 4 at 13 legs, 3 of 4 at 12

```
  anchor-drift                 red=[G1] refused=[11]  prefused=[PRED-1,PRED-4,PRED-5]
  containment-key-blind        red=[U1,U4,U5,U6]      refuted=[PRED-2]
  ceiling-key-equality         red=[U1,U1KP,U2,U4,U5,U6]
  figures-from-dir-population  red=[U1,U2,U5,U6]
```

**The miss, and it is worth more than the four matches.** `containment-key-blind` was predicted
`red=[U1,U2KP,U4,U5,U6]` and came out without `U2KP`, separating only through a refuted `PRED-2`.
Cause: the arm patches the **subject** (his source string), not the **key** — `nestingKey` then
correctly reports `nested=false` for a genuinely non-nested source, so a key-level known-positive is
**structurally unable** to score it. Paired with `ceiling-key-equality`, which perturbs the **key**
and *is* scored by `U1KP` exactly as predicted, the two give the rule: **a cripple's verdict map has
to name which of the two it perturbs, because the instrument that can see it differs.** I had been
writing maps as though one KP covered both.

**`U1` nearly shipped as the mirror image of the error I am reporting to him.** Keyed `===` rather
than `>=`, his `population-dir-only` arm reads *"not at the ceiling"* because `467 > 464` — the
worse case passing as the good one. `drive13` drives that mis-key; `U1KP`'s `above` row misses.

Also recorded rather than tidied: `ceiling-removed` was filed in `predicted.md` as a cripple and
**promoted to a real drive** once the scratch clone worked. `PRED-5` is DRIVEN, not modelled.

## 18:25 UTC — memo filed, drain, wrap

Memo in its own commit `5cb6a09c`, pushed straight to `main`:
`docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-t8s-red-is-produced-by-the-dir-arm-alone-and-the-union-0-is-still-a-ceiling-2026-10-29.md`

It carries one correction against him: both union `0`s are ceiling effects differing in `>` vs `=`,
so his §2 *"only one of them is a measurement"* is stronger than the figures support. His re-key
removed a **dead** measure, not a saturated one — still the right change, and his §2 argument stands
without the stronger sentence.

**Drain.** The one inbound read at open before any work and answered in the same fire. All four
cross-repo mailboxes checked by `readdirSync` walk: `designinproduct` 18 name-hits, `mediajunkie`
12, `dispatch` 9, `piper-morgan-product` 20 over 33,413 files — every one this seat's own outbound,
already-seen, or historical and filed in `read/`; nothing newer than 10-28 addressed here, **nothing
owed**. Inbound thread **left open in `docs/mail/`** deliberately: open items on both seats, and the
stop/re-scope decision is xian's.

*Not taken, no blocker, named so it stays claimable:* `C3` carrying the reading it is computed under
(mine, **fifth** fire); `xcheck-wrong-figure` corrupting only the copy `G2` compares; re-keying `G7`
onto something it cannot satisfy by construction; the untested direction of the author key; the 37
non-`lib` `.mjs` probes at 826; `sweep-probes.mjs`'s 13 signatures; whether `roundNNN-instruments/`
should remain the round population at all.
*Deferred with named blockers,* unchanged: driving any of the 19 probes that reference a cured lib
(two are live-HTTP/port, and a fire is not a window where a leaked server costs nothing); the
whole-cell drive of `455` cell A.
*Routed back to Daedalus by this fire:* `T8` is not repairable by re-aiming while its union arm is
seeded from its dir arm — re-key that arm onto a population it does not top out in, or retire `T8`
in favour of `T2b`, which carries the key question with both arms free; and `U6`'s double count,
independently of whatever happens to `T8`.

**Not run this fire:** `npm test`, `npm run typecheck`, the sweep. `git status --porcelain --
packages/ scripts/` **empty** — every file this fire wrote is under `docs/`. Nothing left running;
the cells use `spawnSync`.

Commits pushed **incrementally as each landed** rather than batched at wrap, so a fire that dies at
the timeout strands nothing.

## 18:35 UTC — wrap verification (Session Wrap Protocol)

**Step 1 — commits on `origin/main`** (`git fetch` then `git log origin/main`), author-checked:

```
f852738a Theseus (Klatch) | coord+log: 10/29 START fire — T8's RED is produced by the dir arm alone…
5cb6a09c Theseus (Klatch) | mail(Theseus -> Daedalus, xian; cc …): T8's RED is produced by the dir arm alone…
a1c28ae2 Theseus (Klatch) | unit-464t2-t8: 8 cripple drives recorded -- 4 of 4 maps match at 13 legs, 3 of 4 at 12
1295122d Theseus (Klatch) | unit-464t2-t8: re-key U6 off a proximity window onto the measured() argument…
e4caad5e Theseus (Klatch) | unit-464t2-t8: the grader, plus the cripple maps filed before their drives
44a68910 Theseus (Klatch) | unit-464t2-t8: recon T8's two operands and pre-register the predictions, before the grader
f66c6631 Daedalus (Klatch) | log: 10/29 START fire wrap verification …
```

All 5 of this fire's commits present, all authored `Theseus (Klatch)`.

**Step 2 — deliverables on `origin/main`,** selected with `git ls-tree -r origin/main` (a rev, not
`ls-files`, so the list is reproducible from the rev rather than from this working tree):

- `docs/research/unit-464t2-t8-2026-10-29/` — **32 files**: 1 recon, 1 grader, 2 pre-registration
  docs, 14 `.out` + 14 `.err`. Every `.err` **0 bytes**, 14 of 14, by `statSync`.
- `docs/mail/theseus-to-daedalus-…-t8s-red-is-produced-by-the-dir-arm-alone-and-the-union-0-is-still-a-ceiling-2026-10-29.md` — **present**
- `docs/logs/2026-10-29-theseus-log.md` — **present**
- `docs/COORDINATION.md` — **present**, and the new entry verified at line 2395, inside the Theseus
  section (2393–3537) rather than in a neighbour's.

**VERIFY OK.** Nothing claimed delivered — the wrapper owns delivery; this records what is on
`origin/main`.

---

## 14:47 — Session resumed (WORK fire, model claude-opus-5)

Opened with the session-start protocol. HEAD at `b55e4d0b`, worktree clean, branch
`claude/theseus-cycle` tracking `origin/main`. **Author-checked before assuming anything was mine:**
`b55e4d0b` is Argus's and `271d6ef9` is Daedalus's — the three commits above this morning's
`f852738a` belong to other seats, so this seat's day log already exists and this entry appends to it.

**Inbound: one, addressed here.**
`docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-neither-of-your-t8-candidates-and-your-reason-for-the-second-is-wrong-2026-10-29.md`
(`38bef389`, Daedalus, 13:29 PT). Read in full at open, before any work. He took neither of my T8
candidates — `T8` now **refuses** while its union arm is pinned — and he is right that my stated
reason for the second candidate was wrong: `T2b` is nested the *other* way
(`curedBySelfAttested ⊂ curedByDirKey`), so it is one-sided by construction too. Saturation, not
independence, is what separated the two legs. One item routed here, his §6: **grade `T2b`'s arms for
saturation the way `T8`'s now are.** Taken this fire.

## 14:5x — baseline before the edit, then pre-registration before the subject

`drive1.baseline.out` driven at `b55e4d0b` **before touching the subject**, with
`git status --porcelain` carrying only the unit's own untracked dir:

```
VERDICT/1 RED legs=22 red=[T2b] refused=[T8] preds=8 refuted=[P7,P2] prefused=[]
  dir key           last=464 consecutive=2   self-attested key  last=454 consecutive=12
  COUNTING POPULATION key=attested n=464 max=467
```

`PRE-REGISTRATION.md` committed in `d1ac7354` and pushed **before** the first edit: the criterion's
derivation, 2 in-cell predictions (`P12` distance=3, `P13` `dir|464|454`), 3 external predictions,
and 3 cripple maps each naming key-vs-subject **and** predicted `refuted=` movement — his 10-29 §5
rule, adopted.

**The criterion is not a copy of his.** Which arm pins first is a function of the arms, not the key:
a larger `last` leaves fewer rounds above it, so the pin arm is `max(lastDir, lastSelf)`. Live that
*is* the dir arm, but deriving it means an inverted nesting cannot silently point the guard at the
free arm. And `T2b` has a second saturation mode `T8` lacks, because its arms are thresholded: with
**both** arms pinned the token is forced **true** — "the keys agree" from a state where they could
not have disagreed. One arm pinned manufactures a RED; the pair manufactures a GREEN.

## 15:0x — the edit, and the clean arm does not move the line

`ceilingKey`/`popMaxForCeiling` **hoisted** above their first reader so one key serves both legs
(a second key beside `T2b` would be free to drift from the one `T8KP` grades). Added `T2bSAT`
`[MEAS]`, `T2bKP` (6-row key-level matrix on synthetic operands), `T2bORACLE` (runtime oracle: both
saturation modes recomputed, not asserted), and `T2b`'s refusal. `2cf37348`.

```
drive2.clean  VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2] prefused=[]
  T2bSAT: dirLast=464 selfLast=454 popMax=467 pinArm=dir(464) pinDistance=3 assertable=true
```

X1 **LANDED**: `status`, `code`, `red=`, `refused=`, `refuted=`, `prefused=` identical to the
pre-edit baseline; only `legs=` and `preds=` move. `P12`/`P13` both LAND.

## 15:1x — six cripple arms; 3 of 3 filed maps MATCH

| arm | kind | observed | vs map |
|---|---|---|---|
| `t2b-sat-wrong-arm` | KEY | `red=[T2bKP,T2b]` `refused=[T8]` `refuted=[P7,P2,P12,P13]`, misses = the 3 named | MATCH |
| `t2b-dir-pinned` | SUBJECT | `REFUSED red=[] refused=[T2b,T8]` `refuted=[P7,P2,P9,P12]`, `pinDistance=0` | MATCH |
| `t8-ceiling-blind` | KEY (his) | `red=[T2bKP,T2b,T8KP]`, misses=`[pin-arm-above-ceiling]` only | MATCH |

Member sets, not print order — the pre-registration wrote `[T2b,T2bKP]` where the cell prints
`[T2bKP,T2b]`, named rather than quietly reconciled. `t2b-sat-wrong-arm` leaves `T2b` **unmoved**
(live distances 3 and 13, where both spellings answer "not pinned"), so the arm separates through
`T2bKP` alone — his 10-29 §5 lesson applied before the fact instead of after it. And
`t2b-dir-pinned`'s map had to carry `refuted=`, where it moved **his** `P9`, because `T2b` leaves
the sensitivity gate's base arm for its refusal set.

## 15:2x — the finding, from two arms I drove without maps

**Mine:** `t2-dir-only`, driven as an unmapped regression check, refuted this fire's own `P13`
(`pinArm` → `both|464|464`). My pre-registration under-specified a pre-existing arm — the symmetric
half of the miss he reported.

**His, and nothing he built changed:** driven today at `2cf37348` against his 10-29 MID maps —
`t8-ceiling-blind` gains `T2bKP` in `red=`; `t8-unpinned` gains `P12` in `refuted=` (that arm moves
`popMax` to 9467, so a prediction keyed on the ceiling distance is pointed at it);
`t9-insensitive-leg` identical. **A cripple map is complete only at its filing rev.** The bite is
directional: the next fire re-driving `t8-unpinned` against the filed map reads `+P12` as a
regression. Routed to him with both deltas recorded, so the work is recording them, not finding
them — and offered to do it in his unit if he prefers.

Also built, unasked, with its reason in the memo: **`M0c`** — every one of the 11 declared cripples
has a dispatch site in the cell's own source. The comment above `CRIPPLES` has claimed this since
10-27 and nothing measured it; a declared name with no hook runs a **clean** arm, so every control
driven under it comes back clean and reads as survival. Keyed on the dispatch shape by literal
string search, with a control name known absent required to come back missing.

## 15:3x — drain, and what is for xian

**Drain.** One inbound, read at open before any work, answered in the same fire, its routed item
taken and graded. Thread left open in `docs/mail/` deliberately: open items on both seats and the
stop/re-scope call is xian's. Cross-repo mailboxes not re-walked this fire — this morning's walk
over 33,413 files found nothing owed and nothing newer than 10-28 addressed here, and no `git pull`
since has brought mail for this seat (the three intervening commits are Argus's and Daedalus's own
coord/log writes, checked by `%an` and `--name-only`).

**For xian, and it is timing rather than a new axis:** the standing line is byte-identical to this
morning — `red=[T2b]`, adopted reading **FIRED at 12 against N=5**. What is new is that `T2b`, the
leg the line is now quoted from, sits **3** rounds below the population ceiling. Three more attested
rounds above 464 with no gated cure and it refuses, the same way `T8` now does. `T2bSAT` prints the
distance every drive.

**Not run this fire:** `npm test`, `npm run typecheck`, the sweep. `git status --porcelain --
packages/ scripts/` **empty** — every path written is under `docs/`. Nothing left running; drives
are `execFileSync` with `stdio` pinned. Commits pushed incrementally as each landed.

## 15:4x — wrap verification (Session Wrap Protocol)

**Step 1 — commits on `origin/main`** (`git fetch`, then `git log origin/main`), author-checked with
`%an` rather than assumed:

```
a7c44cb7 | Theseus (Klatch) | coord+log: 10/29 WORK fire — T2b's arms graded for saturation…
3ec3e020 | Theseus (Klatch) | unit-464t2b-sat: 3 of 3 filed maps match, and two of Daedalus's three moved today
2cf37348 | Theseus (Klatch) | unit-464t2b-sat: T2b refuses while its pin arm is at the ceiling…
d1ac7354 | Theseus (Klatch) | unit-464t2b-sat: pre-registration filed before the subject is touched
b55e4d0b | Argus (Klatch)   | coord+log: 10/29 WORK fire — no-op on product…
```

All 4 of this fire's commits present, all authored `Theseus (Klatch)`.

**Step 2 — deliverables on `origin/main`,** selected with `git ls-tree -r origin/main` (a rev, not
`ls-files`, so the list is reproducible from the rev rather than from this working tree):

- `docs/research/unit-464t2b-sat-2026-10-29/` — **20 files**: pre-registration, results, 8 `.out`
  and 8 `.err`, `baseline.rev`, `baseline.gitstatus.txt`. **8 of 8 `.err` are 0 bytes**, read via
  `cat-file -s` on the blobs **on `origin/main`**, not off the working tree.
- `docs/research/round464-instruments/grade-the-stop-condition.mjs` — present (the subject).
- `docs/mail/theseus-to-daedalus-…-t2bs-arms-are-graded-and-two-of-your-three-filed-maps-moved-today-2026-10-29.md` — present.
- `docs/logs/2026-10-29-theseus-log.md`, `docs/COORDINATION.md` — present; the new coord entry
  verified at line **2423**, inside this seat's own section (**2421–3584**) rather than a
  neighbour's, by computing the section bounds rather than eyeballing them.
- Working tree clean (`git status --porcelain` empty) at wrap.

**VERIFY OK.** Nothing claimed delivered — the wrapper owns delivery; this records what is on
`origin/main`.

---

## 19:47 — STOP fire resumed (model: claude-opus-5)

Third fire of the day for this seat. One inbound, arrived **after** the WORK wrap: Daedalus's 10-29
STOP memo in `b92bd98b`. Identified by commit author and `--name-only` rather than by mtime (the
wrapper restamps those) — the 4 commits above my `a1abf9ba` are Calliope's, Daedalus's (3) and
Iris's; exactly one touches `docs/mail/` and exactly one routes an item here. Read at open, before
any work. Tree clean at open, `REV 296df7c1`.

**His §1, routed here:** a cripple map keyed on the verdict sets cannot name a **reached** `[MEAS]`
leg, because a `[MEAS]` leg has no verdict to move. He measured it over his 3 arms (18 cells, 4
reached, 2 nameable). The question left for this seat is whether the same deficiency sits in my own
filed maps at their own filing rev.

## 19:5x — it does, and worse: 0 of 3

Graded off recordings **already committed** in `unit-464t2b-sat-2026-10-29/` — no re-drive, no
instrument, no subject touched. `T2bSAT`'s own `detail:` line, token by token, against the clean
drive:

```
SUMMARY arms=6 reached=5 unmoved=1
GRADE   filedMaps=3 reached=3 fullyNamed=0 underReported=3
```

`t9-insensitive-leg` is the only arm of the six that does not reach the leg — which is also the one
arm he reports byte-identical across revs, the same fact arrived at from the other side. All three
filed maps reach it; **none** names its movement completely. Two never mention it; the third names 2
of the 5 tokens that moved. His maps under-report; mine under-report on every row. Both sets were
written the same week against the same convention, so the convention failed, not the care taken.

**The second defect, which his §1 does not cover.** The one map that mentions the leg writes
`pinned=true` where the cell prints `pinArmPinned=true` — a token **typed from the intent** instead
of **captured from the output**. Re-key the convention to "name reached members" and that row still
passes authoring and still fails comparison, because it was never keyed on the subject; it was keyed
on my spelling of it. Routed to him as a spec input for the convention item he is holding: the cure
wants both halves, and the captured half is what makes a machine-checked `legs=`/`preds=` comparator
possible at all.

**His convention applied to my own file.** COMPLETENESS STAMP above the three recorded tables in
`PRE-REGISTRATION.md` — filing rev `d1ac7354`, `legs=22 preds=8` at filing against `legs=26 preds=10`
at the grading drives, deficiency named, tables unchanged.

## 19:5x — two defects in this fire's own grading, recorded not replaced

1. **The first tokenizer split on whitespace**, which breaks `selector=max(pins first)` into two and
   invents a 12th token that does not exist. It reported `movedTokens=4` for `t2b-sat-wrong-arm`; the
   true figure is **3**. Re-keyed onto ` <ident>=` boundaries, with a self-test that exits `3` unless
   `selector` round-trips whole. The self-test's own printed prose still said "12 tokens expected,
   got 11" — the 12 was the artifact. The **gate** is on `selector` and is sound; only the sentence
   beside it was stale. A guard and the prose beside it fail separately.
2. **The first grading counted a token as named if the word appeared anywhere in the map's
   section** — scoring `selector` named under `t2b-sat-wrong-arm` and `key` named under
   `t8-ceiling-blind`, both off ordinary prose ("the **shipped** key rather than a copy of it").
   Gating the match on a line that mentions the leg took both to zero. An over-reporting grader is
   the more dangerous direction here: it manufactures the conclusion that the maps were fine.

Also: the stamp insert shifted every map section down by 10, so the addresses the grading run printed
(`L98–108`/`L109–122`/`L123–133`) went stale the moment it landed. Re-derived to
`L108–118`/`L119–132`/`L133–143`, and the addendum says why rather than quietly carrying the new ones.

## 19:5x — drain, and what is for xian

**Drain.** One inbound, read at open, answered in the same fire, its routed item taken and graded.
Cross-repo mailboxes not re-walked: this morning's walk over 33,413 files found nothing owed, and no
commit since has brought mail for this seat. Thread left open in `docs/mail/` deliberately — open
items on both seats and the stop/re-scope call is xian's.

**Declined rather than claimed, deliberately.** Re-keying the map convention plus the machine-checked
stamp comparator is unclaimed, has no blocker, and he explicitly offered it. This fire would not
finish it, and claim-and-sit is worse than leaving it visible — left with him, with the
captured-token finding as a spec input, and an offer to take it at the next WORK fire if he prefers.

**Question-box check (STOP procedure §4):** nothing filed this fire. The one thing here with a
question shape — whether a `[MEAS]` leg should be able to assert at all — is an ordinary work
question on an open thread, not a question-box question, and it is already with xian and Daedalus
through `docs/mail/`. A no, considered rather than skipped.

**For xian: no new axis and no new timing.** The standing line is byte-identical to this fire's own
WORK entry, and `T2b`'s countdown is the same **3** — re-read off `drive2.clean.out` this fire rather
than carried forward. Adopted reading remains **FIRED at 12 against N=5**. Needs-you count unchanged
at 4.

**Not run this fire:** `npm test`, `npm run typecheck`, the sweep. `git status --porcelain --
packages/ scripts/` **empty** at open and at close — every path written is under `docs/`. No
instrument built and no subject touched, so there was nothing to drive. Nothing left running.
