# Results — unit-464reach, 2026-10-31 START fire (Theseus)

Baseline rev `4df06a01`. Pre-registration pushed to `main` as `007d4fca` **before any
instrument in this directory existed**. `baseline.gitstatus.txt` 0 bytes at open and at close.

**Scoreline: 2 gate legs green, 2 more gates added mid-unit and green, 2 predictions landed,
2 refuted — and both refutations are mine.** The headline is `P5`.

---

## 0. What stands behind each number

| leg | what it gates | verdict | recording |
|---|---|---|---|
| `G1` | his `quoted-denominator.mjs`, re-driven unmodified from his own dir, argv sliced from his own `DENOM` lines | **ok** — stdout byte-identical, 1968B | `drive2.out`, `g1.redrive.out` |
| `G2` | the reader is **sliced** from `grade-filed-maps.mjs:226-237` at the baseline rev, boundary present exactly once, `WIDE` = same text with one character class substituted | **ok** | `drive2.out` |
| `G2KP` | the sliced reader reproduces `GKP`'s own expectation on `GKP`'s own real slice | **ok** after a real refusal — see §1 | `drive1.out` (refusal), `drive2.out` |
| `G2AGREE` | the sliced reader agrees with **his copy** on all 4 of his pairs, **name set for name set** | **ok** 4/4 | `drive2.out` |
| `CUREDIFF` | cured scratch copy differs from the checker on **exactly one line** (228), FATAL not skipped | **ok** | `priceA.out` |
| `G3` | a **dead** boundary MOVES the output, so the scratch file is the code executed | **ok** | `priceB.out`, `drive6.scratch-dead.out` |
| `G4` | the **map-side** call sites are reached, counted separately from the recording-side ones | **ok** — 17 of 158 calls | `priceD.out`, `drive7.tokcensus.out` |

`G1` and `G2` were pre-registered. **`G3` and `G4` were added mid-unit because `P5` came out
byte-identical and byte-identity is indistinguishable from a dead code path.** They are declared
as additions, not back-dated into the pre-registration.

---

## 1. `drive1` is a real refusal and it is kept

`drive1.out` records `G2KP REFUSED` and publishes **no** reach figure, exit 2. The cause was in my
**expectation extractor**, not the reader: it read the checker's *printed* `GKP` line, which says

```
GKP    ok  tokenizer on a real slice: selector round-trips whole; 11 tokens
```

— and never publishes the selector's **value**. So the expected value came back `null`, and the gate
refused rather than passing on a comparison against `undefined`. Repaired to slice the expectation
from the checker's **source** at `grade-filed-maps.mjs:613`, where `GKP` states it. `drive1` is not
overwritten; a drive edited to agree with a later drive stops being a record.

**A small correction to Daedalus's §3, in his favour on substance.** His `KPGATE` line reads
`selector="max(pins first)" (checker publishes "max(pins first)")`. The checker's **stdout** does not
publish that value; its **source** does, at `:613`, and that is the same literal his gate asserts. So
his KP is sound and only the provenance phrase is imprecise about which surface. I report it because
I tried to slice from the surface his sentence names and the slice came back empty.

---

## 2. `P3` is REFUTED, and the refutation is a unit error of mine

| map | arm | live | wide | % | §|
|---|---|---|---|---|---|
| `unit-464authored/V22-MAP.md` | `t2-dir-only` | 1 | 20 | 5.0% | ok |
| `unit-464nomoved/V21-MAP.baseline.md` | `t8-unpinned` | 3 | 31 | 9.7% | ok |
| `unit-464nomoved/V21-MAP.cured.md` | `t8-unpinned` | 2 | 30 | 6.7% | ok |
| `unit-464rekey/V21-MAP.nomoved.md` | `t8-unpinned` | 2 | 30 | 6.7% | ok |
| `unit-464rekey/V21-MAP.prose.md` | `t8-unpinned` | 3 | 31 | 9.7% | ok |
| `unit-464v21map/V21-MAP.md` | `t8-unpinned` | 2 | 30 | 6.7% | ok |
| `unit-464v2map/V2-MAP-…-RETITLED.md` | `t8-ceiling-blind` | 2 | 9 | **22.2%** | REFUTES |
| `unit-464v2map/V2-MAP-…-STAMP-STRIPPED.md` | `t8-ceiling-blind` | 2 | 9 | **22.2%** | REFUTES |
| `unit-464authored/PROBE-MAP-rowless.md` | `t2-dir-only` | 0 | 0 | — | REFUSED (ratio over 0) |
| `unit-464v2map/V2-MAP-t8-ceiling-blind.md` | `t8-ceiling-blind` | — | — | — | REFUSED (`sectionFor` null) |

`P3` predicted live reach < 10% of wide on every rows-bearing map. **Two of eight are at 22.2%, so
it is refuted** — and they refute it by having a **smaller denominator** (9, against 20–31), not by
the detector seeing more. Live reach on those two maps is **2 names**, the same absolute figure as
four of the maps that "pass".

**A ratio was the wrong unit for the quantity and that is my error.** `P3ABS`, printed by the
instrument and labelled there as added after the drive:

> across 8 scored map(s): live reach **min=1 max=3**, wide denominator min=9 max=31.

The blindness is in the absolute number. **Every one of the 8 scored maps is seen by the live
detector at 1–3 distinct names.** Daedalus's `1 of 20` is not an outlier; it is the middle of the
distribution, and his finding is **broader than the four pairs he measured**.

**Population, by positive legs** (`git ls-tree` at the baseline rev, not `ls-files`):
`A=1642` under `docs/research/` · `B=388` `.md` · `C=11` basename `/MAP/` · **`D=10`** has a
`` `## Arm `name`` `` heading. In `C` but not `D`: `CRIPPLE-MAP-CONVENTION.md` alone, as expected —
it is prose about maps.

**One map is unsectionable and that bears on my own retro-grade item.**
`V2-MAP-t8-ceiling-blind.md` refuses: `sectionFor` finds more than one heading naming the arm, so
the checker cannot section it at all. Its `-RETITLED` sibling exists precisely because of this. **A
retro-grade of the filed maps therefore has one refusal in it before it starts**, and that refusal is
a property of the original filing, not of the retro-grade.

---

## 3. `P4` LANDS — the mechanism is narrower than reality, and the span §3.4b was adopted on is in the gap

Daedalus's §3 states the cause as: *"The only names it sees on a map are the second-and-later tokens
inside a multi-token span, where a space does precede the name."*

Measured over all 17 seen names, every class keyed **positively** (nothing reaches "on mechanism" by
falling through): **12 of 17 are off that mechanism.**

```
P4CLASS off-mechanism by class: BARE-PROSE=5 · INLINE-SPAN-FIRST-PADDED=7
```

* **`BARE-PROSE` (5).** `N` on section line 33 of all five `V21-MAP*` files. Not in a span at all:
  the reached occurrence is the prose `…not past N=5 in a way that fires the dir key…`. The *same
  line* also carries `` `N=5,` `` inside a span, which the detector cannot see. **The figure is
  visible only in the place where the author forgot to quote it.**
* **`INLINE-SPAN-FIRST-PADDED` (7).** The **first and only** `name=` token in its span, reached
  because something non-token precedes it *inside the backticks*: `` ` surface=` `` (a leading pad)
  and — **this one matters** — `` `T9 moved=0` ``, where the member id `T9` supplies the space.

**The correct mechanism is: any whitespace inside the span before the name.** A member-id prefix
counts. A leading pad counts. "Multi-token span" is neither necessary nor the common case here.

**Why that is worth a round rather than a footnote.** Daedalus's §3 says *"`` `moved=0` `` alone on
that row, one backtick's distance from the shape that reddened, would have been invisible."* That is
exactly right, and the measurement sharpens it: the red §3.4b was adopted on was reachable **only
because the author wrote the member id inside the same span as the figure.** `` `T9 moved=0` `` is
seen; `` `moved=0` `` is not. One space, no semantic difference, and it decides whether the gate can
see the row at all.

Which inverts the gate's relationship to its own convention. §3.4 tells authors to quote figures as
captured strings. The tighter a span is quoted — one figure, no prefix, no padding — the more
invisible it is to `GTYPEDDEF`. **The detector's residual sight is anti-correlated with conformance
to the rule it is supposed to enforce,** and `BARE-PROSE=5` is the limiting case: a figure that
violates §3.4 outright is the one class the gate sees reliably.

---

## 4. `P5` — THE FINDING. The cure is a no-op on his own green cell

Driven with the arm/clean/control tuple **sliced out of his committed `drive.mjs`** and not retyped,
`cwd` set to his unit directory so his relative paths resolve exactly as they did for him, and the
scratch copies placed at **identical directory depth** to the checker's own:

```
CUREDIFF ok  1 line(s) differ (line 228)
         -  const re = /(?:^|\s)([A-Za-z][A-Za-z0-9_.]*)=/g;
         +  const re = /(?:^|[^A-Za-z0-9_.])([A-Za-z][A-Za-z0-9_.]*)=/g;
```

**The cured and uncured stdout are byte-identical: 4816B, 59 lines, 0 differing lines.**
`GTYPEDDEF` stays **green** on `V22-MAP.md`.

So **Daedalus's §4 expectation — "a backtick-aware boundary reddens `GTYPEDDEF` on every filed map,
this one included" — does not hold on the one map it has now been driven against, which is his own.**
His §4 offered it as an *honest expectation* and priced the cure as "a round's work"; the price on
this cell, measured, is **zero**.

### Why that is a result and not a dead code path

Byte-identity is exactly what a never-loaded file produces, so it is gated three ways:

1. **`CUREDIFF`** — the cured copy differs from the checker on exactly line 228, FATAL otherwise.
2. **`G3`, the reaching arm (`priceB`).** A third copy with a boundary that can match almost nothing
   (`(?:)`) **moves** the output — `GKP` goes `RED tokenizer … size=0`, every `DRIFTMEM
   movedTokens` collapses to 0, `fullyNamed` 8→10, 4816B→3860B. The scratch file **is** the code
   being executed.
3. **`G4`, map-side reach (`priceD`).** `G3` is not enough: everything it moved is on the
   **recording** side, so it grades a seam I was not asking about. **One control cannot grade a seam
   and a write path.** A counter on the declaration, keyed **positively** on the payload carrying a
   backtick (map lines do; recording payloads do not):

   ```
   TOKCENSUS total=158 withBacktick=17 noBacktick=141
   TOKSAMPLE "- **`P13`** — status MOVES `LAND`→`REFU`; 1 moved token: `actual=\"both|464|464\"`. `expecte"
   ```

   **17 of 158 calls are on map rows.** The map-side call sites are reached. The probe perturbs no
   regex and the instrument asserts that before publishing.

### And the comfortable explanation is refuted — by me, about my own reasoning

My first reading was that the cure reaches only map vocabulary the cell never emits, so it
intersects nothing. **Measured, that is false:**

```
WHY REFUTES-ZERO — of the 19 names the cure exposes on this map, 19 are in the
recordings' emitted set: [actual,assertable,dirLast,expected,figure,fired,freeArmPinned,
freeDistance,incidental,key,pinArm,pinArmPinned,pinDistance,popMax,probes,refusing,
selector,selfLast,sensitive]
```

All **19** exposed names are emitted (the two recordings emit 91 distinct names). So the state is:
**the cure newly reaches 19 emitted names across 17 map-side calls, and moves not one of 19
published gate lines.**

**Which predicate absorbs it is OPEN, and I am not guessing at it.** It is a downstream question
about how the typed-token and completeness keys combine `emitted`, `quoted` and `quotedOfMe`, and it
needs its own arms. What is measured and closed is the thing his §4 asserted: on this cell, the cure
costs nothing, and the three gates above are why that is a measurement.

---

## 5. `P6` failed on my own hand-typed list, and the restatement lands

Pre-registered `P6` compared 6 anchors. **Two of them — `GCOMPLETE`, `GCONFORM` — are not prefixes
the checker prints at all** (it prints `GCOMP` and `GCONF`). My absent-anchor rule fired correctly in
spirit and refused rather than scoring two absences equal, so `P6` reads `FAILS` in `priceA.out` on a
defect in my own anchor list. **A hand-typed anchor list is not a slice**, and it refused on my guess
rather than on a disagreement.

`P6R` (`priceC`) restates it with the anchor set **derived from his committed recording** — every
`^(MAPVERDICT|G[A-Z]+)` line the checker actually prints, so a gate I have never heard of is still
compared and one I invent cannot refuse on its own absence:

```
P6ANCHORS derived: 19 — [GABS,GCOMP,GCONF,GCTRL,GCTRLPROV,GCTX,GDRIFTB,GDRIFTR,GKP,
GMUST,GRADE,GRADEA,GREACH,GREFUSE,GSTAMP,GSUBJ,GTYPED,GTYPEDDEF,MAPVERDICT]
P6R LANDS — 19 derived anchor(s), 0 differ, 0 refused. WHOLE-STDOUT byte-identical
to his committed drive1.out: true (4816B vs 4816B)
```

So the matched no-cripple drive does land, in its strongest form: a scratch copy of the checker at
identical depth, driven from his cwd with his tuple, reproduces **his entire committed recording**.
`P5`'s delta is attributable. **Both readings are reported: `P6` as written failed, `P6R` lands.**

---

## 6. Hygiene

Every drive captured stdout and stderr separately with the child's `stdio` pinned
(`['ignore','pipe','pipe']`). **All 12 `.err` files are 0 bytes, 0 non-zero, by `statSync` over
`readdirSync`** — including `drive6.scratch-dead.err`, whose child exits **1** on its own verdict.
A 0-byte `.err` beside a non-zero exit is exactly what pinning the child's `stdio` buys; unpinned,
`execFileSync` would have echoed that child's stream into the parent's. Counts by array length,
never `grep | wc`. No `kill`/`pkill`. The **live checker was not edited** — four scratch copies
(`.SCRATCH`, `.CURED`, `.DEAD`, `.TOKCENSUS`) live in this directory, and the working tree under
`packages/` and `scripts/` is clean at close. Nothing under `packages/` or `scripts/` touched; every path written is
under `docs/`.

**Not run this fire:** `npm test`, `npm run typecheck`, the sweep. The pre-commit census printed
`CENSUS OK` on each commit, which is not the same thing and is not offered as a gate figure.

**The standing cell was not driven and not edited. `T2b`'s countdown is not re-read this fire and is
therefore not restated.** Nothing here moves xian's stop/re-scope call.
