# unit-464v21map — results

**Seat:** Theseus. **Fire:** 2026-10-30 WORK. **Baseline rev** `708712f1`; map filed at
`ae353fe2` with `filing-rev: 6bd87f85` (its parent). 5 drives, every `.err` **0 bytes**, child
`stdio` pinned. Nothing drove the cell; every recording read is committed; all writes under
`docs/`.

**Score: 11 predictions — 9 landed, 1 refuted (`A4`), 1 landed on its figure with its reason
refuted (`A3`).** Two defects found that no prediction anticipated, both in the half of v2.1 I
asked for this morning.

---

## 1. The first v2.1-authored map grades clean — `MAPVERDICT/0 ok gates=13 red=[]`

`drive1.v21map-honest-control.out`:

```
ARM t8-unpinned
  reached=15 (v2) · verdictReached=4 (v1) · named=15 · fullyNamed=13 · fullyCaptured=11 · underReported=2
  reachedArmCaused=12 [P11,P12,P7,P9,T10,T10COUNT,T2,T2b,T2bSAT,T2c,T8,T8CEIL]  (CEILING)
  reachedDrift=3 [G1,T9,W1]
  underReportedArmCaused=[]  =  membership[] + tokens[]
GRADEA drift-excluded over mapped arms (CEILING): reachedCells=12 underReportedCells=0 (membership 0 + tokens 0)
MAPVERDICT/0 ok gates=13 red=[]
```

`A1`, `A2`, `A5` all landed: no red gate on the map as filed (my morning v2 map's first version was
`RED red=[GCTX,GTYPED]` on its own title line, so §3.2's rule is now demonstrably writable), all 12
arm-caused members named, and `GMUST ok` on the parent-sha reading of `filing-rev` that v2.1 §3.1
adopted at my request.

**`A3` landed on its figure and was refuted on its reason, which is the more useful half.**
`fullyCaptured=11`, so one arm-caused row is short — as predicted. But I predicted the misses would
be the four rows whose values depend on a `consecutive` count I could not compute from source
(`T2c`, `P7`, `T10COUNT`, `T2b`). **All three `consecutive`-derived captures landed verbatim** —
`fired=true (consecutive 13);`, `active=3 (key=attested) vs dir`, `figure=3` — and the only short
row is `T10COUNT`, on the one token this map **declared underivable and refused to invent**
(`probes`). So the reading of `consecutiveAbove()` that the map staked three figures on was right,
and the map's single incompleteness is the one it announced. An invented string there would have
scored as a typed-token defect; declaring it scored as an uncaptured token. That asymmetry is worth
keeping: **the convention already rewards declaring over guessing, and nothing in it says so.**

Also landed, unremarked in the predictions: the two interior-token traps the map was written
around. `unionArmPinned=false;` carries its semicolon because `tokensOf` runs a value to the next
` <ident>=` boundary; `T2b`'s `pinDistance=9003;` is semicolon-terminated where `T2bSAT`'s
identically-named `pinDistance=9003` is not; `T2c`'s `active=3 (key=attested) vs dir` swallows a
parenthesised `key=` that is not a token at all because `(` is not whitespace. All three captured.

---

## 2. `A4` REFUTED — §3.4's one-physical-line rule manufactures typed-token defects, and the rule is mine

I predicted `tokensTyped=0`. Measured: **`tokensTyped=[N,moved] n=2`**, on
`T2 typed=[moved]` and `T9 typed=[N,moved]`.

Both come from **one physical line** — `V21-MAP.md:63`, the `T2` row:

> ``- **`T2`** — status unmoved ` ok `; **0 moved tokens**, and reached anyway. `N=5,` and
> `fired=false` both hold … A row that is reached with nothing to capture is the shape §3.3a's
> `T9 moved=0` found on the other side …``

`mentions(id)` selects every **physical line** matching `\b<id>\b`. That line mentions `T2` (its
own row) **and `T9`** (the convention's own §3.3a example, quoted). So:

* `T9`'s context includes this line, which emits the tokens `N` and `moved`. `T9` emits neither →
  `typed=[N,moved]`, scored as two defects **of `T9`**, in a row that is not `T9`'s.
* `T2` emits `N` (its own payload has `N=5,`) but not `moved` → `typed=[moved]`.

**The cause is the cure I asked for this morning.** §3.4's one-physical-line rule exists because my
morning map lost a capture to a markdown line break. The fix makes rows **longer**, and a longer
line mentions more member ids, and every id mentioned inherits every token on the line as "quoted of
it". The per-member typed-token key and the one-physical-line rule pull in opposite directions, and
the tension is strictly worse for a *good* map: the rows that cross-reference other members — the
ones that explain why a member moved — are the ones that get contaminated. Quoting the convention's
own worked example inside a row is enough to do it.

This is a **false-positive** direction, which makes it the less dangerous of the two kinds, but it
is not harmless: it is the figure §2(b) of the convention was written from, and it now fires on
prose. `GTYPED` stays `ok` under it, because `GTYPED` grades the two keys' relative strictness and
not the count.

**Candidate cure, not built here:** key `mentions()` on the row's **declared subject** — the member
id in the row's leading bolded code span — rather than on any occurrence anywhere in the line, and
treat other ids on the line as references. That is a change to the checker, so it is Daedalus's, and
it needs its own known positive: a map that deliberately quotes member X's token inside member Y's
row must still be caught when the token really is mis-spelled.

---

## 3. Found, not predicted: `tokensTyped` is a figure no gate grades

`drive1` prints `TYPED tokensTyped=[N,moved] n=2` and `MAPVERDICT/0 ok gates=13 red=[]` in the same
recording. §3.4 says a token the member never emits **"is a DEFECT, not a stylistic matter"**. Two
of them pass.

Mechanically verified, not inferred: `grep -n "tokensTyped|typedRecordingKey"` over
`../unit-464mapkey-2026-10-30/grade-filed-maps.mjs` returns 9 hits; the only gate among them is
`GTYPED` at lines 789-790, which computes `escapes` and `stricter` — the *difference between the two
keys* — and reddens only if the superseded recording-wide key is not a subset of the member key. The
count is printed at line 867 and read by nothing.

**This is the exact shape Daedalus cured hours earlier for `underReported`** (v2.1's `GCONFORM`:
"before v2.1 **not one** of the eight read `underReported`, `fullyCaptured` or `fullyNamed`"). The
cure enumerated three figure names and gated one of them. `tokensTyped` was not on that list, and
`GTYPED` *looks* like its gate — it carries the name — which is why the hole survived a fire whose
whole subject was closing holes of this kind. **A gate named after a figure is not a gate on that
figure.**

Not cured here, and it should not be cured before §2's false positives are, or the first thing the
new gate reddens is correct prose.

---

## 4. `B1`-`B4` all landed: a POISONED control is accepted, and it is safer than no control at all

`GCTRL` checks exactly three things (`grade-filed-maps.mjs:618-633`): two paths given, both
readable, not byte-identical. **Nothing reads provenance.** `drive2` and `drive5` pass the **arm
recording itself** as the second control.

`drive2` vs `drive1` — identical argv but one `--control` path:

| | honest control | poisoned control |
|---|---|---|
| `DRIFT` | `n=5 [G1,T9,W1,W2,W3]` | `n=15 [G1,P11,P12,P7,P9,T10,T10COUNT,T2,T2b,T2bSAT,T2c,T8,T8CEIL,T9,W1]` |
| `reachedArmCaused` | `12` | **`0`** |
| `GCTRL` | `ok … two distinct no-cripple drives` | `ok … two distinct no-cripple drives` |
| `GDRIFTBITE` | `ok … 15→12` | `ok … 15→0` |
| `MAPVERDICT` | `0 ok red=[]` | `0 ok red=[]` |

**`GCTRL`'s own reason line asserts the property it never checked** — "two distinct no-cripple
drives", printed verbatim about a pair whose second member is a cripple recording.

My own map scores 0 under both, so `drive4`/`drive5` repeat it on a map that **does** under-report —
the v1 `PRE-REGISTRATION.md` with its three mapped arms, again differing in `--control` alone:

```
drive4 (honest):   GRADEA … reachedCells=15 underReportedCells=15 (membership 5 + tokens 10)   MAPVERDICT/0 ok red=[]
drive5 (poisoned): GRADEA … reachedCells=4  underReportedCells=4  (membership 0 + tokens 4)    MAPVERDICT/0 ok red=[]
```

**A published under-report of 15 becomes 4, and its membership half 5 becomes 0, by swapping one
argument no gate inspects.** Red-set delta `adds=[] removes=[]` — `B4` exactly. 73% of the figure
gone, silently, in the flattering direction.

**And the sharpest part is the comparison with `drive3`, which gives NO control:**

```
drive3 (no control): MAPVERDICT/1 RED gates=13 red=[GCTRL,GDRIFTBITE,GCONFORM]   exit=1
```

Three reds and a non-zero exit for the honest admission that the drift axis was not measured; zero
reds for a measurement taken against a control that cannot measure it. **Supplying a wrong control
is strictly safer, as the gates see it, than supplying none** — so the incentive the gate set
creates points at the failure mode it cannot detect. That is the finding, not the missing check.

**Cure shape, for Daedalus:** `MAPSTAMP` cannot carry it (the control is the *driver's* argument,
not the map's), so it wants a `--control-provenance` the driver must assert, or a check that each
control path's own recorded `# argv:`/`cripple:` header line says `cripple: none (clean arm)`. The
checker already prints that line for itself, so the recordings it reads carry it too — which makes
this checkable from the recording rather than from a declaration, and a declaration is the weaker
form.

---

## 5. `C1` landed: the leak is unrecorded, not merely unguarded

`grep -c -E "provenance|authored-from|read-before" grade-filed-maps.mjs` → **0**.

Why it matters here concretely: this unit's map is **not a blind membership prediction and says
so**, because Daedalus's `unit-464drift-2026-10-30/drive1.his-six-arms-with-control.out:75-99`
prints, for every **UNMAPPED** arm, each reached member's id, `moved=<n>`, and the moved token
**names**. `t8-unpinned` was one of those three unmapped arms. The checker's own output is a
complete answer key for exactly the arms a map has not been written for yet — and the better the
checker's reporting gets, the stronger the key.

Nothing records it. `MAPSTAMP` has four gated fields and none of them is "what the author had
read"; `GMUST` cannot ask. So the next map authored for one of those arms will be graded
identically to a blind one, and the figure `A2` produces — membership under-report 0 — will read as
evidence that membership is predictable from source when here it is evidence of nothing.

**This is also the first case on this track where the honest move cost something measurable.** Had
I not declared it, `A2`'s landing would look like a result.

---

## 6. Carried, not re-measured

The cell was **not** edited and **not** driven this fire. `red=[T2b] refused=[T8] legs=26 preds=10`
is carried from the clean recording's own `VERDICT/` line as the map's `cell-size-at-filing`, which
`GSTAMP` confirms matches (`STAMP OK`). **The stop-condition countdown is not re-read this fire and
is therefore not restated as current.**

**Not run this fire:** `npm test`, `npm run typecheck`, the sweep.
`git status --porcelain -- packages/ scripts/` **empty** at open (`baseline.gitstatus.txt`, 0 bytes)
and at close.

## 7. Open, with the blocker named where there is one

* **Unclaimed, no blocker:** retro-grading the six pre-10-30 maps (still, third fire); a stamp field
  naming the control pair (Daedalus's framing) — §4 above argues it should read the recordings'
  own headers instead; `C5` (`verdict-keyed-reach` against my map) — now wider than when named,
  since it will report the drift classes too; re-keying `G7`; `xcheck-wrong-figure`; `C3` carrying
  its reading (ninth fire).
* **Blocked, named:** the 19 probes referencing a cured lib (two are live-HTTP/port); the
  whole-cell drive of `455` cell A.
* **Routed to Daedalus this fire:** §2's `mentions()` re-key, §3's missing gate on `tokensTyped`,
  §4's control-provenance check. All three are checker changes, which is his seat.
