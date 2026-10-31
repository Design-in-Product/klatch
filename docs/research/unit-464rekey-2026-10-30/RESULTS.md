# unit-464rekey — results

Pre-registration `41b9f85d`, pushed before any of the three routed changes existed. Work
`44f3d6d5`. 15 drives, every `.err` **0 bytes** with the child's `stdio` pinned. The cell was not
edited and not driven; every path is under `docs/`.
`git status --porcelain -- packages/ scripts/` empty at open (`baseline.gitstatus.txt`, 0 bytes).

**12 predictions: 6 landed, 4 refuted, 2 landed on the figure with the reason or the detail
wrong.** All three routed changes are in. Two defects in my own new gate failed on its first
drive and are recorded in place.

## Headline

**All three of Theseus's §5 items are built and driven**, in his declared order. The two findings
worth his eye are both about what the cure did *not* do:

1. **The §2 re-key fixes the attribution and not the count.** `T9`'s two typed tokens are gone,
   exactly as routed — and `moved` reappears as **`T2`'s** defect, because `T2`'s row is the row
   that actually quotes it. `MAP-A` therefore **still reddens** `GTYPEDDEF`. The order he specified
   was necessary and is not sufficient: a row that correctly cross-references another member still
   scores a typed token **against its own subject**. `drive15` settles what the whole red is — one
   string.
2. **The re-key removed a false CREDIT as well as a false defect**, and nobody predicted the second
   direction. `T9` went `named=[key]` → `named=[]`: the naming had come off *another* member's row.
   `fullyNamed` 13 → 12, raw `underReported` 2 → 3. A contaminating line inflates the completeness
   figure and deflates the defect figure at the same time, so the pre-fix key was wrong in **both**
   directions on the same member.

## 1. §2 — the subject re-key. R1 and R2 both refuted.

Same argv as his drive1, one code change apart. Sliced from both recordings by `grade-arms.mjs`,
not re-typed:

| figure | his `drive1` | mine `drive1` | |
|---|---|---|---|
| `tokensTyped` | `[N,moved]` | `[moved]` | **R1 refuted** — predicted `[]` |
| `fullyNamed` | 13 | **12** | unpredicted |
| `fullyCaptured` | 11 | 11 | same |
| `underReported` RAW | `[G1,W1]` | `[G1,T9,W1]` | **R2 refuted** on its axis |
| `underReportedArmCaused` | `[]` | `[]` | same — MAP-A's conformance verdict is untouched |
| `T9` row | `named=[key] … typed=[N,moved]` | `named=[] … typed=[]` | both directions moved |
| `T2` row | `typed=[moved]` | `typed=[moved]` | **unchanged — the defect was always T2's** |

**R1** predicted `tokensTyped=[]`. Measured `[moved] n=1`. The cure landed on `N` (T2's own token,
quoted in T2's own row, which the pre-fix key had charged to T9) and **re-attributed** `moved`
rather than clearing it. `moved=0` is `grade-filed-maps`' own output vocabulary, quoted out of
§3.3a's worked example; it does not occur in the cell recording at all, so by the letter of §3.4 —
*any figure a row quotes must be a substring copied from the recording* — quoting it inside a row
**is** a defect. §3.4 has no exemption for quoting the convention's or the checker's own
vocabulary, and the gate I built in §3 makes that unwritten exemption cost a RED.

**R2** predicted `T9` would become `mentioned=false`. It did not: `T9` still has context from
**unsubjected prose lines**, which is D2's union working as designed. The membership axis did not
move; the **token** axis did, by the false-credit route above.

**R4 refuted.** I predicted `subject-rows-only` would be VACUOUS on MAP-A. It bites:
`adds=[GSUBJ]`, collapsing `[G1,T9,W1]` — the three **drift** members, which appear in MAP-A only
in unsubjected prose and nowhere in a declared row. The union is load-bearing for precisely the
members a map does not give rows to, which is a better argument for D2 than the one I wrote.

**R5 lands on its letter and is refuted on what it was for.** `subject-bold-only` differs from the
broader parse on MAP-B only in `linesSubjected` (and `unionBearing` on one of three arms) — both
figures **I added this fire as GSUBJ's own denominators**. Every graded figure is identical:
`fullyNamed`, `fullyCaptured`, `underReported`, `tokensTyped` all SAME on all three arms. So:

> **D1's broader parse changes no grade on this population.** The convention may require the bolded
> form without changing any map's score. The broader parse is a *tolerance* for the six pre-10-30
> maps' spelling, not a cure — and I should not route it to Theseus as though it were one.

`drive4` says the same from the other side: on MAP-A, whose rows **are** bolded, bold-only is
`adds=[] removes=[]` against drive1.

## 2. My own gate, wrong twice on its first drive

Both failures were in `GSUBJ` leg A, and both are the same class — a leg that cannot see its own
subject.

**(1) Leg A was keyed on a cripple-INDEPENDENT figure.** It read `refDropped`, computed from the
subject parse rather than from the live key. `subject-blind` reverts the whole key, and the leg
printed `refDropped=17` and **stayed green** under the one arm built to redden it:

```
round 1  drive2.mapA-subject-blind   red=[GTYPEDDEF]            GSUBJ ok  A/bite ok bites: 17 …
round 2  drive2.mapA-subject-blind   red=[GTYPEDDEF,GSUBJ]      GSUBJ RED A/bite RED opportunities=17 but the live key withheld 0
```

Leg A now measures `Σ(looseLines − ctxLines)` — what the **live** key withheld — against
`refDropped` as the opportunity denominator. The general form, and it is the third time this class
has appeared on this track in a week: **a gate leg must read a figure the cripple can move.**

**(2) Its vacuity escape was keyed on the wrong denominator.** `linesSubjected` counts declared
subjects in the **map**; the leg needed the count of contaminable **member/line pairs**. The
de-bolded prose map has 2 subjected lines with no cross-reference between them, so `drops=0` is
correct there — and leg A published a RED for a map it should have called VACUOUS:

```
round 1  drive5.mapA-prose  red=[GTYPEDDEF,GSUBJ]   A/bite RED linesSubjected=2 but drops=0
round 2  drive5.mapA-prose  red=[GTYPEDDEF]         A/bite ok  VACUOUS (opportunities=0 across 2 subjected line(s))
```

**R3 refuted on its figure.** Predicted delta `adds=[GSUBJ,GTYPEDDEF]`; measured `adds=[GSUBJ]`,
because drive1 is **already** red on `GTYPEDDEF` — the matched drive was not where I left it when I
wrote the prediction. Direction right, figure wrong, and the reason is R1's refutation upstream.

## 3. §3 — `GTYPEDDEF`, and the green cell it did not have

**R6 landed.** `tokensTyped=[pinned] n=1` on MAP-B **survives** the re-key, under every variant
(`drive6`, `drive8`, `drive9`, `drive10`). This is the known positive Theseus asked for — *a map
that quotes member X's token inside member Y's row must still be caught when the token really is
mis-spelled* — and it is a real 2(b) defect off a filed map, not a hand-typed fixture. The re-key
did **not** narrow to nothing.

**R7 landed on its figure and named the wrong arm.** `GTYPEDDEF RED … [t2b-dir-pinned:pinned]`, and
MAP-B's exit is 1 where his `drive4` printed `MAPVERDICT/0 ok gates=13 red=[]`. I predicted
`t2b-sat-wrong-arm`. **His own recording had the right name in it** —
`drive4.v1map-honest-control.out`'s `GTYPED` line reads `stricter by 1 token(s)
[t2b-dir-pinned:pinned]` — so this is a figure I recalled instead of slicing, in a fire whose whole
subject is figures that must be sliced.

**R8 landed.** `typed-ungated` delta against the matched drive: `adds=[] removes=[GTYPEDDEF]`,
exit 1 → 0, while `TYPED tokensTyped=[pinned] n=1` still prints in the crippled recording. The gate
is the only thing between that map and a clean exit.

**`drive15`, added after round 1 refuted R1, because a gate with no green cell has not been shown
to discriminate.** MAP-A with one scripted substitution — `` `T9 moved=0` `` → `T9 moved zero
tokens`, the string quoted out of §3.3a's own example — and nothing else:

```
drive1.mapA-honest    exit=1 red=[GTYPEDDEF]   1 typed token(s): [t8-unpinned:moved]
drive15.mapA-nomoved  exit=0 red=[]            0 typed tokens across 1 mapped arm(s)
```

**One quoted example string is the entire red on the first map ever authored under v2.1.** The
drive asserts the substring is present before substituting, so the counterfactual cannot be a
silent no-op.

## 4. §4 — control provenance. R9–R12 all land.

| drive | `--control` / `--clean` | `GCTRL` | `GCTRLPROV` | verdict |
|---|---|---|---|---|
| `drive1` | honest pair | ok | **ok** `[clean=none control1=none control2=none]` | `1 RED [GTYPEDDEF]` |
| `drive11` | his **poisoned** pair | ok | **RED** `[control2:CRIPPLE t8-unpinned]` | `1 RED [GCTRLPROV,GTYPEDDEF]` |
| `drive12` | poisoned + `control-header-blind` | ok | ok (not read) | delta `removes=[GCTRLPROV]` |
| `drive13` | a **foreign-family** recording | RED | **RED** `[control2:REFUSED(no CRIPPLE header)]` | `1 RED` ×5 |
| `drive14` | an **arm** recording as `--clean` | ok | **RED** `[clean:CRIPPLE t8-unpinned]` | `1 RED` ×5 |

**R10 landed, and it inverts his §4 table row.** His `drive2` printed `MAPVERDICT/0 ok gates=13
red=[]` for the argv that passes the arm recording as a control. The same argv now exits 1 and
names the recording's own `CRIPPLE t8-unpinned`. **R11 landed**: the matched delta is
`removes=[GCTRLPROV]`, so the gate is the only thing standing between that argv and a green
verdict — which is what his finding said the gate set lacked.

**R9 landed.** Honest pair green, and `GCTRL`'s reason line no longer asserts what it never read:
it now says *"two distinct readable recordings (NOT checked here: whether either is a no-cripple
drive — that is GCTRLPROV)"*. The false sentence he caught is gone rather than merely out-voted.

**R12 landed, with a caveat that matters.** A `grade-filed-maps` `.out` passed as a control REFUSES
with *no `CRIPPLE` header* and reddens `GCTRLPROV` — so D3's strict reader is right, and a reader
lenient enough to accept `cripple: none (clean arm)` would have read `none` and passed it.
**But `GCTRL` reddens on that drive too**, by its *readability* leg: `membersOf` parses no members
out of a foreign recording, so `controlA === null`. The foreign-family hole was therefore already
half-covered — by a different route, and not by provenance. The poisoned-pair hole (`drive11`) was
not covered by anything, and that is the one `GCTRLPROV` is load-bearing for.

**The clean-path leg is included and bites** (`drive14`): a crippled `--clean=` makes every reach
figure a comparison between two arm recordings, which is the same hole one argument over. Theseus
routed the control; this leg is the same read and is gated with it.

## 5. What this does not claim

* The cell was not re-driven. `red=[T2b] refused=[T8]` is **not** re-read here and is not restated
  as current. Nothing in this unit moves the 464 verdict.
* `reachedArmCaused` remains a **CEILING**.
* `GTYPEDDEF` has exactly **one** green cell in this population (`drive15`) and it was manufactured
  by a scripted substitution. Its discrimination is therefore shown on a one-string delta, not on a
  population of correct maps — there is no map in the repo today that passes it unedited.
* `GSUBJ` leg B is graded only by `subject-rows-only`, on both maps. Leg A's VACUOUS branch is
  exercised by `drive5`/`drive9`/`drive10` and its RED branch only by `subject-blind` on MAP-A —
  MAP-B has `opportunities=0`, so leg A cannot be reddened there at all.

— Daedalus, 2026-10-30 STOP fire
