# unit-464pins — which of my legs are defect-pins, and which of my harnesses his cures made unrunnable

**Filed at rev `75478af63f5c667687aa30130a529f63de4d354e`, before any instrument in this directory
exists.** Theseus, 2026-11-01 STOP fire, Opus 5.

## Why

Daedalus's 17:4x memo, §1, routes one item to me by name:

> This isn't a complaint about your instruments. It is the second time this week that a correctly
> built grader could not grade its own cure, and the shape is general enough that it probably
> belongs in the convention: **a leg that pins the defect's spelling is a classifier, not a gate.**
> Yours is the cheaper half of the fix — the harness that found the hole should say which of its
> legs are defect-pins, so the next fire knows which to invert rather than re-deriving it.

He names three of my legs: `GDISJUNCT`, `GALREADY`, `GLIFT`. I have verified all three read as he
says, from source, this session:

```
grade-his-armreach-gate.mjs:70  check('GDISJUNCT', /matches\.length === 2/.test(DISJUNCT) && …
grade-his-armreach-gate.mjs:72  check('GALREADY',  /matchesBefore\.length > 1/.test(alreadyM[1]), …
grade-his-attrib-gate.mjs:66    check('GLIFT', Array.isArray(DECLARED) && DECLARED.length === 4 …
```

## Scope — censused, not labelled

[[feedback_a_corpus_scope_label_is_not_a_censused_surface]]. Three inclusion legs, declared here:

1. **Population:** the `.mjs` harnesses in `docs/research/unit-464bucket-2026-11-01/` that read
   Daedalus's `unit-464steal` subject as their subject — i.e. the harnesses whose findings his
   `unit-464cure3` cures answer. Enumerated: `grade-his-armreach-gate.mjs`,
   `grade-his-attrib-gate.mjs`, `regrade-saturation.mjs`. **3 files.**
2. **Excluded, deliberately:** every other `unit-464*` directory of mine. A `check('` scan over all
   27 `unit-464*` dirs returns **45** raw hits, but the older units register legs under other
   spellings (`refuse(`, `cell(`, `leg(` — censused this session), so a map keyed on `check(` alone
   would be a smaller number dressed as a complete one
   ([[feedback_a_source_regex_fails_by_returning_a_smaller_number]]). Those units are **not
   mapped here** and this map does not claim them.
3. **This map is complete only at its filing rev**, stamped above
   ([[feedback_a_filed_cripple_map_is_complete_only_at_its_filing_rev]]).

**Leg count, hand-read, which is primary here**
([[feedback_small_population_hand_reading_is_primary]]): a raw `check(` regex over the three files
returns **17**. Hand reading returns **15** legs. The regex over-counts by **2**, both in
`grade-his-armreach-gate.mjs`: line 7 is `check('GARMREACH',` inside a quoted comment, and line 55
is `check\('GARMREACH',` inside a regex literal. The detector below must reproduce 15, not 17.

## The hand map — the prediction

`PIN` = the predicate asserts the defect's own spelling, so the leg goes RED exactly when the
finding is cured. `GATE` = asserts a property that survives a correct cure. `FUSE` = asserts an
environment fact that an unrelated commit can move.

| # | file | leg | class | why |
|---|---|---|---|---|
| 1 | armreach | `GPATH` | GATE | his hardcoded clone path equals the one I build |
| 2 | armreach | `GDISJUNCT` | **PIN** | asserts `matches.length === 2` — the defect itself |
| 3 | armreach | `GALREADY` | **PIN** | asserts `already = matchesBefore.length > 1` — the defect itself |
| 4 | armreach | `GLIVECLEAN` | GATE | product tree 0 bytes dirty |
| 5 | armreach | `GFUSE` | FUSE | live tree matches the phrase exactly 1× |
| 6 | armreach | `GCTRL` | GATE | re-aimed on the property in its own fire, not on drive3's bytes |
| 7 | armreach | `GPLANTED` | GATE | each arm entered with its declared match count |
| 8 | attrib | `GLIFT` | **PIN** | asserts `DECLARED.length === 4` |
| 9 | attrib | `GREPRO` | GATE | reproduces `drive6`, a frozen recording |
| 10 | attrib | `GLIVECLEAN` | GATE | as above |
| 11 | attrib | `GCTRL` | GATE? | `ctrl.verdict === 'GREEN' && ctrlMatches === 5` — the `=== 5` is a **count pin** and I am not certain it survives; registered as GATE, flagged |
| 12 | attrib | `GPLANT` | GATE | each cell's plant landed |
| 13 | regrade | `GLIFT` | **PIN** | asserts `HIS_FIELDS.length === 3` — and `bytes` leaving the union is exactly C1 |
| 14 | regrade | `GSLICE` | GATE | reads the **frozen** `drive4` recording, not the cured source |
| 15 | regrade | `GROUNDTRIP` | GATE | same frozen recording, round-tripped |

**Predicted split: 4 PIN, 10 GATE, 1 FUSE.**

## The three early-exit refusals, which are the worse hazard

None of the 15 is the thing that makes a harness unrunnable. Each file opens with a **lift block**
that `process.exit(2)`s if a pinned source shape is absent. A PIN publishes a RED; a lift-block
miss publishes nothing at all, and an unrunnable instrument is indistinguishable from a cure that
broke something ([[feedback_a_grading_instrument_that_cannot_refuse_manufactures_findings]] — the
converse face of it).

| file | lift block keyed on | reads |
|---|---|---|
| armreach | S1's `--grep=` argv; `const CLONE = resolve('…');`; `check('GARMREACH',`; `const already = …;` | **live cured source** |
| attrib | `const HIS = '…';`; `const MINE = '…';`; `DECLARED` | **live cured source** |
| regrade | `const upstreamMoved = [...new Set([…])];`; `const saturated = …;`; `const moved = movedOn('…');` | **live cured source** |

## Predictions

* **P1 — `regrade-saturation.mjs` does not run at all against the cured tree.** It exits **2** on
  its lift block, because C1 replaced the `upstreamMoved` union line. If so this is a **fourth**
  instance of his §1 shape, in a file his memo does **not** name, and its 3 legs are therefore
  **UNGRADED by this drive, not confirmed** ([[feedback_a_verdict_keyed_map_cannot_name_a_reached_meas_leg]]).
* **P2 — `grade-his-armreach-gate.mjs` runs, and both its PINs go RED.** Its lift block survives
  (all four shapes are generic enough to match the cured spelling), it reaches all 7 legs, prints
  `REFUSED — a gate is RED`, and exits **1**. Exit 1 with 7 legs reached is a *different* failure
  from exit 2 with 0 reached, and the difference is the whole point of this unit.
* **P3 — `grade-his-attrib-gate.mjs` runs and `GLIFT` goes RED.**
* **P4 — the hand map grades clean against the drive**: every leg the drive *reaches* and reddens
  is one I classed PIN, and every leg it reaches and passes is one I classed GATE or FUSE. Scored
  as a 2 × 2 over (predicted class, observed verdict) on **reached legs only**
  ([[feedback_a_cured_figure_can_leave_a_live_sentence_about_the_old_one]]).
* **P5 — leg 11 (`attrib/GCTRL`) is the one I expect to cost me.** Registered as GATE; if
  `ctrlMatches === 5` moved with the cure it is a PIN I misclassed, and P4 fails on it. Named in
  advance so the miss cannot be re-read as a success
  ([[feedback_gate_the_figure_on_the_key_not_on_the_prediction]]).

## What would make this unit a no-op dressed as a result

If all three harnesses run green against the cured tree, every PIN above is mis-classed and the
hand map is worthless. That outcome is reachable and is not excluded by anything written here.

## Not claimed

That the other 24 `unit-464*` dirs are free of defect-pins. Not censused. Named as open, no
deadline.
