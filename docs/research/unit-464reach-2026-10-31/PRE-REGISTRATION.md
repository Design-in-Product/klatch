# Pre-registration — unit-464reach, 2026-10-31 START fire (Theseus)

**Written and pushed to `main` BEFORE any instrument in this directory exists.** Baseline rev
`baseline.rev` = `4df06a0198c41f1d5de9a9199b33340d7bdea9ca` (Daedalus's `4df06a01`, the tip his
`unit-464authored` closed on). `baseline.gitstatus.txt` is **0 bytes** — nothing dirty under
`packages/` or `scripts/` at open.

## What routed this

Nothing. Daedalus's 10-31 START memo §6 routes nothing here, and his §3 is a finding **against his
own gate**: `GTYPEDDEF`'s tokenizer sees `1 of 20` distinct `name=value` names on the map he just
filed as its only authored green cell, because `tokensOf`'s left boundary is `(?:^|\s)` and on a map
every figure sits behind a backtick.

Verified in the live source this session before this file was written:
`docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs:228` reads

```
  const re = /(?:^|\s)([A-Za-z][A-Za-z0-9_.]*)=/g;
```

That is the cause he names, present at the baseline rev. **What is not yet established is the scope
and the price**, and both are things this seat should grade rather than accept:

1. His figure is **per arm-section on 4 map/arm pairs**. The tree holds **10** maps by a positive
   key (below). Six real maps are unmeasured.
2. His stated cause — *"the only names it sees on a map are the second-and-later tokens inside a
   multi-token span"* — is a mechanism claim, and a mechanism claim is gradeable. A name at line
   start, a name inside a **fenced** block (where the preceding character really is whitespace), or
   a name in bare prose would all be reachable. His 4-pair sample may simply not contain one.
3. His honest expectation — *"a backtick-aware boundary reddens `GTYPEDDEF` on every filed map, this
   one included"* — is a prediction about **his own just-filed green cell**, and it has not been
   driven.

## Population, by positive inclusion legs (each leg's count printed, not a scope label)

Keyed on the rev in `baseline.rev` via `git ls-tree -r --name-only`, **not** `git ls-files`
(an `ls-files` population is irreproducible from any rev):

| leg | key | count |
|---|---|---|
| A | path starts `docs/research/` | 1642 |
| B | A ∧ ends `.md` | 388 |
| C | B ∧ basename matches `/MAP/` | 11 |
| D | C ∧ file has a heading matching `` /^##+ Arm `([^`]+)`/ `` | **to be printed by the instrument** |

Leg D is the **positive** key for "is a cripple map" — a heading that declares an arm the way §3.2
requires. `CRIPPLE-MAP-CONVENTION.md` is in C and is expected out of D; it is prose about maps, not
a map. Leg D's count and membership are published by the instrument. **D is not asserted here as 10**
— the hand count from the census that located this subject said 10, and a hand count is a lead.

## Gate legs — these must be RED-capable, and a refusal here stays a refusal

**`G1` — his round reproduces, read off HIS tree.** `quoted-denominator.mjs`, driven **unmodified
from its own directory** at `baseline.rev`, must reproduce the committed `quoted-denominator.out`
**byte-identically**. Not a re-implementation and not an eyeball: both strings hashed. If it does
not reproduce, every number below is unmeasured and this unit says so instead of publishing.

**`G2` — the reader is SLICED from the live checker, not copied, and the slice is gated
structurally.** Daedalus copied `tokensOf` verbatim and gated the copy on `GKP`'s real slice. A
verbatim copy is still a second implementation, and it goes stale silently the moment the cure he
deferred lands. This unit instead slices the function **text** out of
`grade-filed-maps.mjs` at the baseline rev and evaluates it, so the reader **is** the live source
bytes. Gated on all of:

* the declaration anchor `` `const tokensOf = (payload) => {` `` occurs **exactly once** (a start
  anchor that matches twice, or zero times, refuses — "sliced exactly once" does not pin the anchor
  on its own);
* the slice ends at the first line that is exactly `};` at column 0 after the anchor, and the sliced
  text **contains** the `(?:^|\s)` boundary — so a cured source cannot be sliced and silently graded
  as if uncured;
* the evaluated function reproduces the **two figures the checker's own `GKP` publishes** on the
  same real slice `GKP` uses (`11` tokens, `selector` = `max(pins first)`), read from
  `../unit-464t2b-sat-2026-10-29/drive2.clean.out` and **not typed here**;
* the evaluated function agrees with **Daedalus's copy** on all 4 of his map/arm pairs, name-set for
  name-set — **member lists compared, not counts.**

A refusal on `G1` or `G2` exits non-zero and publishes **no** reach figure. `measured()`-style
silencing is not used on a gate leg.

## Predictions

**`P3` — population-scale reach.** On every map in leg D **that has rows**, the live tokenizer's
distinct-name count is **less than 10%** of the backtick-aware count. *Refutable:* any rows-bearing
map where live reach is ≥10% of wide refutes it. The rowless probe map is excluded from P3 by name
and reported separately (its denominator is 0 and a ratio over 0 refuses rather than scoring).

**`P4` — the mechanism claim is INCOMPLETE.** At least one name the live tokenizer sees, on at least
one map in leg D, is reached by a context class **other than** "second-or-later token inside a
multi-token inline code span". Every seen name is classified by the character actually preceding its
match and by whether its line is inside a fenced block, inside an inline span, or in bare prose, and
the classification is **printed per name**. *Refutable, and I expect it to be refuted:* if every
seen name across all 10 maps is a second-or-later token inside an inline span, Daedalus's cause is
exactly right at population scale and P4 is reported as **refuted**, which strengthens his §3
rather than weakening it. This prediction is written to be lost.

**`P5` — the cure reddens his own green cell.** With the one-character-class cure applied to a
**scratch copy of the checker at identical directory depth** (a scratch copy at the wrong depth has
refused whole cells on this track before, because `GMUST` realpaths the map's declared paths against
cwd), the real checker driven over `V22-MAP.md` / `t2-dir-only` — reusing the arm/clean/control
tuple **read out of his committed `drive.mjs`, not re-typed** — scores `GTYPEDDEF` **RED**.
*Refutable:* a green there refutes it and refutes his §4 expectation with it.

**`P6` — matched no-cripple, so P5's delta is attributable to the one character class.** The scratch
copy **without** the cure, driven from the same cwd with the same tuple, reproduces the committed
checker's `GTYPEDDEF` and `MAPVERDICT` lines byte-identically against `drive1.out`. *Refutable:* if
the uncured scratch copy already differs, P5's red is not attributable to the cure and is withdrawn.
**A cripple graded without a matched no-cripple drive is not graded.** The cure diff is asserted to
be **exactly one line** changed, by line-for-line comparison, FATAL rather than skipped.

## Explicitly NOT in this unit, with the reason

* **The cure is not landed.** It is Daedalus's named open item and he gave an ordering reason that
  holds: a unit that cures its own subject needs its baseline from git, and curing the grader in the
  same fire that authors the first map graded by it leaves neither able to grade the other. `P5`
  drives the cure in a **scratch** copy to produce a price; the live checker is not edited.
* **Pricing the cure's verdict on all 9 real maps.** Each map needs its own arm/clean/control tuple
  and those tuples live in different units' drive harnesses. `P5` prices it on the **one** map whose
  tuple is already committed in a harness I can read rather than retype. The remaining 8 are named
  as not-taken, not reported as blocked.
* **Retro-grading the six pre-10-30 maps** — my own standing open item, **fifth fire unclaimed.**
  Not taken this fire and not pretended blocked. Daedalus's §3 is the reason it is worth less than
  it looks and this unit is the measurement of how much less: a retro-grade against a detector that
  reads a fraction of each section grades the detector's blindness, not the maps.
* **The standing cell.** Not driven, not edited. `T2b`'s countdown is **not re-read this fire and is
  therefore not restated.** Nothing here moves xian's stop/re-scope call.

## Hygiene

Every drive captures stdout and stderr **separately** with the child's `stdio` pinned
(`['ignore','pipe','pipe']`), because `execFileSync` echoes child stderr into the parent's stream and
a 0-byte `.err` must be a property of the child, not of the capture. `.err` sizes read by
`statSync`. Counts by `readdirSync`/array length, never a `grep | wc` pipeline. No `kill`/`pkill`.
Nothing under `packages/` or `scripts/` is touched; every path written is under `docs/`.

— Theseus
