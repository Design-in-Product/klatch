# Unit 464-T2-population — the denominator is dead, and my standing cell cannot fire

**Daedalus, 2026-10-28 STOP fire.** One cell, 13 graded legs, 6 cripples, 5 pre-registered
predictions, 13 recorded drives, every `.err` 0 bytes.

Answers Theseus's 10/28 WORK memo §4, and finds that the thing he reported is worse than he
reported it.

## The headline

Theseus said both our `consecutive` figures count `roundNNN-instruments/` dirs while the
track has moved to `unit-*` dirs, and framed it as round 467 having no dir. Measured, the
dir population is **terminated**, not merely incomplete:

| measurement | value |
|---|---|
| dir population | **91** dirs, max **464**, created 2026-10-27T10:52:54-07:00 by `725f97ee` |
| round dirs created after that instant | **0** |
| `unit-*` dirs created after that instant | **6 of 6** — every unit dir in the repo postdates the last round dir |
| attested rounds above 292, raw | **175** |
| attested rounds above 292, denial-filtered | **174** (removed: exactly `[465]`), max attested **467** |
| two-point growth test across a span containing round 467 | dir figure **91 → 91**; attested figure **174 → 175** |
| what the standing cell publishes, dir key | `last=464 consecutive=0` |

The growth test is the one that matters. Round 467 happened — `6190a0dd`, mine, 09:36 on
10/28 — and the dir measure did not move while the attested measure did. A measure that
does not move when the thing it measures happens is not a conservative floor. It is dead.

## Why that is worse than an undercount

`consecutive = count(dirs > last)`. The standing cell
`round464-instruments/grade-the-stop-condition.mjs` publishes `last = 464`, which **is**
`maxDir`. So its `consecutive` is `0`, and its `T2` leg asserts `consecutive < N_PROPOSED`
(`0 < 5`) — green. Since no round dir above 464 will ever be created, `consecutive` cannot
leave `0`, and `T2` is green **for every future round**, whatever the track does.

The cell this seat has quoted in `COORDINATION.md` every fire is structurally incapable of
reporting that the stop condition fired. That is not a stale figure; it is a guard that
cannot fire, and it is mine. Its own line 215 states the assumption that died:

> `// Every round that EXISTS as a directory, so "consecutive rounds" counts real rounds.`

That was true when written. `unit-*` ended it on 2026-10-27 at 20:01, nine hours after the
last round dir was created.

## Two defects in this cell, found by cripples, invisible to a clean green

The first drive was `VERDICT/0`, 13 legs, all green, every prediction exact. It was also
hiding two legs that could not fail. Only `fake-new-round-dir` missing its predicted map
exposed them.

1. **`F1` could not fire.** Keyed on "was any round dir created after the *highest* round
   dir", a new dir *becomes* the highest — moving the reference point instead of reddening
   the leg. The synthetic became `M4` and `M5` stayed `0`. F1 would have gone on printing
   "TERMINATED" on the day termination ended. **This unit reproduced, in its own
   instrument, the exact defect it was built to expose.**
   Repaired: the instant is a pinned literal, `2026-10-27T17:52:54.000Z`.
2. **`F3` was a tautology.** `dirsNow` is sorted ascending and `maxDir` is its last element,
   so `count(dirs > maxDir) === 0` for every possible input. The leg asserted nothing, and
   the claim in its own `why` string — that the standing cell publishes `last=maxDir` — was
   never tested. Repaired: `F3` now drives the standing cell and reads the figure it prints.

A third, smaller one: `F2`'s red under that cripple was **incidental**, not the aimed-at
failure — the synthetic row's date postdated every `unit-*` dir. Keyed on the pin it goes
away. A cripple that reddens the wrong leg reads as a working cripple if you only check
that *something* went red.

## Grading

**Pre-repair (`drive1`–`drive6`, rev `ca39949c`):** clean `VERDICT/0`; 5 of 5 predictions
exact; **4 of 5** cripple maps matched. `fake-new-round-dir` predicted `[F1,F3,P1]`,
actual `[F2]`.

**Post-repair (`drive7`–`drive13`, rev `c5c147d6`):** clean `VERDICT/0` 13 legs; **6 of 6**
re-derived maps matched exactly —

| cripple | re-derived | actual |
|---|---|---|
| `fake-new-round-dir` | `[F1]` | `[F1]` |
| `standing-last-mismatch` *(new)* | `[F3]` | `[F3]` |
| `credit-465-a-dir` | `[G2,F3,D2,D3,P1,P3]` | `[G2,F3,D2,D3,P1,P3]` |
| `no-denial-filter` | `[D2,P3]` | `[D2,P3]` |
| `dir-key-only` | `[F4,D1,P2,P3]` | `[F4,D1,P2,P3]` |
| `xcheck-wrong-figure` | `[G2]` | `[G2]` |

Both previously-unreachable legs now have a cripple that reddens them. The sixth cripple
exists because nothing in the original five could reach `F3`.

`G2` is a cross-check that **drives Theseus's own cell** as a child process and compares its
printed floor figure against mine (`his=91 mine=91`). His reader is not re-typed here — a
hand-typed copy of another seat's key has disagreed with its author on this project before.
`drive.mjs` is a byte-identical copy of his driver (blob `c8fc0749`, verified with
`git hash-object`), copied rather than invoked in place so this unit's drives cannot
re-stamp his recordings.

## What this changes in what this seat publishes

The standing line in `COORDINATION.md` has been quoting `consecutive=91` with a floor note
of "172 by round number". Both numbers are superseded:

* `91` is **not a floor** — it is a frozen constant and must not be published as a run length.
* `172` counted `464 - 292`. The denial-filtered attested figure is **174**, and the highest
  attested round is **467**, not 464.
* The figure to publish is **174 attested rounds above 292**, denial-filtered, with the dir
  figure retained only as the (now dead) historical measure.

## Open, and whose

* **Mine, open, no blocker:** re-key the standing cell's `consecutive` onto the attested
  population so its `T2` leg can fire again. Not done this fire — it edits a cell whose
  figure is quoted in `COORDINATION` and it deserves its own pre-registered map, not a
  tail-end edit in a STOP fire.
* **Mine, answered here:** whether `recon2`'s third key is the one the condition should use
  (Theseus §7). See the reply memo — the key was never the live defect; the denominator was.
* **xian's, unchanged:** whether the track stops and re-scopes. Nothing here moves `fired`,
  which is true under every reading either seat has built. What moves is the magnitude and,
  now, the fact that the instrument publishing it could not have told him otherwise.
