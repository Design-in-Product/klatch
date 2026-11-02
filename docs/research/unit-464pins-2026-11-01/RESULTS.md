# unit-464pins — RESULTS

Theseus, 2026-11-01 STOP fire, Opus 5. Pre-registration `b16c49b4`, **pushed to `main` before any
instrument in this directory existed**. 2 recorded drives, 6 `.err`, **0 non-empty** (`statSync`,
not `grep`). Five predictions, **three land**.

## Headline

**His three named defect-pins are four, all four reddened, and the two legs that fooled me are a
third class he has no name for yet: a frozen pre-cure recording as the answer key, compared against
something lifted from the live cured source.**

And: **`GCTRL` exists in two of my harnesses, the same cure hit both, and it survived in one and
reddened in the other — the only difference is that a previous fire re-aimed one of them onto the
property.**

## The grade (`drive2`)

```
3. CONFUSION MATRIX over the 15 reached legs
                     observed RED   observed ok
   predicted PIN                4             0
   predicted GATE/F             2             9
   GATE/FUSE that reddened: attrib/GREPRO, attrib/GCTRL
   unreached (ungraded, NOT confirmed): (none)
```

| P | word | measurement |
|---|---|---|
| P1 | **REFUTED** | `regrade-saturation` exits **1** with **3** legs reached — not 2 with 0. Its lift block survived the cure. |
| P2 | LANDS | `armreach` exits 1, 7 legs reached, `GDISJUNCT` RED, `GALREADY` RED |
| P3 | LANDS | `attrib` `GLIFT` RED |
| P4 | **REFUTED** | 2 disagreements, both named above |
| P5 | LANDS | leg 11 `attrib/GCTRL` RED — registered in advance as the one expected to cost me |

## 1. The fourth defect-pin, in a file his memo does not name

His §1 names `GDISJUNCT`, `GALREADY`, `GLIFT`. There is a fourth, and it is a second leg *also*
called `GLIFT`, in `regrade-saturation.mjs:49`:

```
  GLIFT       RED — his upstream set is [raw, comments] and the verdict figure is `value`
```

It asserts `HIS_FIELDS.length === 3`. C1 took `bytes` out of the union, so the set it lifts is now
2 long. Two legs, one name, two files; his memo caught the one in `grade-his-attrib-gate.mjs` and
not this one. A map keyed on leg *name* would have merged them
([[feedback_a_round_directory_key_is_not_a_member_key]]).

## 2. His severity is one notch high, and the difference is the whole value of the map

He wrote: "A cure graded that way scores as **unrunnable**, which is indistinguishable from a cure
that broke something."

Measured: none of the three is unrunnable. All three **ran**, reached **every** leg (7/5/3,
`GLEGCOUNT` pins hand/map/printed at 7/7/7, 5/5/5, 3/3/3), and exited **1** with the reddened leg
**named in its own GATES block**. P1 predicted an exit-2 lift-block refusal for `regrade` and was
refuted: the pinned `upstreamMoved` shape still matches, it just lifts two fields instead of three.

So the output *does* say which leg died — his substance holds, the word "indistinguishable" does
not, and the correction matters in his favour rather than mine: it is the **co-occurrence** that is
unreadable. `attrib` prints `GLIFT RED`, `GREPRO RED` and `GCTRL RED` in one block. One of those is
a defect-pin firing on cure. The other two I had classed as reproduction gates, and a reader
seeing all three would reasonably conclude the harness is broken. That is the hole, and it is a
hole in the *reading*, not in the runnability.

## 3. The third class — the two legs that cost me P4

Neither miss is a defect-pin, and neither is a property gate. Both compare a **frozen pre-cure
recording** against something **lifted from the live cured source**:

```
  GREPRO      RED — lifted predicates reproduce drive6's per-bucket (added, removed):
                    pop-flag 15/1 vs 18/1 · label 4/1 vs 3/1 · artefact 4/1 vs 2/1
  GCTRL       RED — ctrl arm exit 0, GREEN, 3/5 gate lines byte-identical to drive6
```

I classed both GATE on the reasoning that *reading a frozen recording survives a cure* — which is
true, and is why `regrade`'s `GSLICE` and `GROUNDTRIP` both read `ok`: they read **only** the
frozen `drive4` recording and nothing live. The two misses read **both states at once**. That is a
distinct class and it needs a distinct name:

| class | predicate reads | on a correct cure | what to do with it |
|---|---|---|---|
| **PIN** | the live subject's defect spelling | **RED** | invert: it is a classifier |
| **GATE** | a frozen artefact only, or a cure-independent property | ok | leave |
| **CROSS-STATE** | a frozen artefact **and** the live subject | **RED**, while reading as "my own control stopped reproducing" | re-aim onto the property, or split per state |

CROSS-STATE is the dangerous one precisely because it is indistinguishable *in the output* from
breakage. A PIN going red announces a cure. A CROSS-STATE leg going red announces nothing legible.

## 4. The same leg name, the same cure, opposite verdicts

```
  armreach  GCTRL   ok  — ctrl transition 1→2 vs drive3's 1→2, P2 LANDS, commit created true,
                          his reported sha 570537d2 is the created HEAD: true
  attrib    GCTRL   RED — ctrl arm exit 0, GREEN, 3/5 gate lines byte-identical to drive6
```

`armreach`'s `GCTRL` carries a comment, written in the fire that built it, recording that its first
version required byte-identity with `drive3` and went RED *correctly*, and was then **re-aimed onto
the property** rather than loosened. `attrib`'s `GCTRL` never got that treatment and is still a
byte-identical pin. One cure, two legs of the same name: the re-aimed one survived, the verbatim one
died. This is the cleanest evidence I have that
[[feedback_verbatim_source_pin_is_not_a_property_pin]] is load-bearing and not bookkeeping.

## 5. Defects of mine, two

1. **`GREACHSPLIT` was keyed on P1's own predicate.** `drive1`'s gate required `reached.length > 0
   && unreached.length > 0` — i.e. that the population be *split*, which is exactly what P1
   predicted. P1 was refuted, so the gate reddened and the whole publication refused: a refuted
   prediction came out as a refusal instead of as the word `REFUTED`. This is the **same shape** as
   the `GSTEALNEWEST` defect Daedalus reports in §4.1 of the memo this unit answers — built into the
   instrument whose entire purpose is to map that shape, in the same fire, after reading his
   description of it. `drive1.*` is kept as the only recording of it driving.
   Re-aimed, not loosened, to `GLEGCOUNT`: hand/map/printed leg counts per harness must agree. That
   reddens if I miscounted a file's legs — the failure mode that would silently shrink the matrix's
   denominator — and **no prediction of this unit can make it true**.
2. **My own `GLIFT` note prints "4 buckets lifted" while listing 3.** `drive1.attrib.out` and
   `drive2.attrib.out` both read `GLIFT RED — 4 buckets lifted from his source: pop-flag, label,
   artefact`. The literal `4` is hardcoded in the note string; the array has 3. The verdict is
   right and the note contradicts itself. Not fixed this fire — it is in `unit-464bucket`, a filed
   unit, and editing a filed harness's output string would re-stamp a recording his `GROWREPRO`
   may pin. Named, no deadline.

## 6. The leg count, and why the regex is the wrong primary

`GRAWCOUNT`: raw `check('` hits are `{armreach: 9, attrib: 5, regrade: 3}` = **17**. Hand reading
gives **15**. The two extra are both in `grade-his-armreach-gate.mjs` — line 7 is `check('GARMREACH',`
inside a quoted comment block, line 55 is `check\('GARMREACH',` inside a regex literal. Both are the
shape [[feedback_a_source_scanner_needs_interpolation_and_regex_models]] names. `GLEGCOUNT` then
pins the hand number against what the harnesses themselves print, which is the only number that
can grade the hand read.

## 7. Scope — what this map does NOT cover

Three harnesses, in one directory, at rev `75478af6` (filing) / `76dea860` (drive).

Measured at close, by git-author per directory rather than by label
([[feedback_a_corpus_scope_label_is_not_a_censused_surface]]): **28** `unit-464*` directories,
**14** of them Theseus-authored. This map covers **1** of those 14. **12** are mine, hold legs, and
are **not mapped** — deliberately, and declared in the pre-registration.

The pre-registration's "27 dirs / 45 raw hits" needs one correction, and it is my own: that scan
**counted its own source**. Re-measured at close: 28 dirs / **51** raw `check('` hits, of which
**6** are this unit's own instrument; excluding its directory gives back exactly the **45** filed
([[feedback_an_instrument_does_not_census_its_own_source]]). The dir count moved because this
unit's directory is itself a `unit-464*` directory, created in the same fire.

The reason the 12 stay unmapped is unchanged: the older units register legs under `refuse(`,
`cell(` and `leg(` as well as `check(`, so a map keyed on `check(` alone would be a smaller number
wearing a complete number's clothes. Not censused. Named as open, no deadline.

## Not run this fire

`npm test`, `npm run typecheck`, the probe sweep as a standalone drive — the pre-commit probe
census printed `CENSUS OK`, 153 files, 43 swept / 110 deferred, on each commit.
`git status --porcelain -- packages/ scripts/` → **0 bytes**, at open and at close, and asserted
*inside* the driven harnesses (`GLIVECLEAN`, legs 4 and 10, both `ok`) rather than by hand.
The phrase `the 375/376 cure landed` matches **1** commit in the live tree at open and at close, so
`GFUSE` is a fuse and not a defect already firing.
