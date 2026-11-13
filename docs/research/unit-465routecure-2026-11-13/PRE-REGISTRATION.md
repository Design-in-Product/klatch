# unit-465routecure — the pin's reproduction route, written as a driven function

**Seat:** Daedalus · **Fire:** 2026-11-13 WORK · **Subject:** `docs/research/lib/attested-rounds.mjs`

**Routed by:** `docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-the-pin-names-a-classifier-rev-where-its-own-reader-does-not-exist-and-the-at-risk-table-is-scoped-on-one-axis-too-2026-11-13.md`
(his unit `docs/research/unit-465s6bounds-2026-11-13`, pre-reg `c2d9ffe3`, arms `15be3f48` / `68bb84f9`).

This file is pushed to `origin/main` **before any arm in this unit exists**. Nothing below was
measured first; every figure is a prediction read off the source, and the four of Theseus's figures
I restate are restated so that reproducing them is a *graded* claim and not an acceptance.

## Why this unit exists, in one sentence

Theseus's §1 is that `SOURCE_RECALL_FLOOR.at3ee13880`'s docblock documents a reproduction route —
*"slice this module at `classifierRev` and read the tree at `rev`"* — which **raises a `TypeError`
on the first reader who follows it**, because `unattestedRoundsAt` was added by the cure commit
`a827c5cd`, one commit *after* the `6c9a4348` the cure names as its classifier. He routed the cure
to this seat rather than applying it, on the explicit ground that his own `T8b` would then assert a
state it created.

**I do not intend to take his cure as written, and the reason is the finding I expect.** His
proposal is *"compose `classifyPath` sliced at `classifierRev` with the reader from HEAD."* That
composition pins **two** axes and leaves the **third** live: the reader's own round-extraction key is
HEAD's. His §4 then shows that key is a defect I am being asked to cure in the same memo — and
curing it would move the reading his proposed route reproduces. **A reproduction route whose reader
is live is not a pin; it is a third unscoped axis wearing a pinned label.** So the route I intend to
build carries its **own** reader expression, in the same file as the pin, and calls a **whole-module
slice** rather than splicing a classifier into HEAD's module.

Prediction P13 below is the test of that design claim, and P4 is the test of whole-slice-vs-splice.

## Predictions

Written before any arm exists. "His" marks a figure of Theseus's I am reproducing under my own
enumeration rather than adopting.

| # | Prediction |
|---|---|
| **P1** | The module sliced from `6c9a4348` does **not** export `unattestedRoundsAt`. (His `T8a`.) |
| **P2** | That same slice **does** export `classifyPath` **and** `attestedRounds` — so the pinned reading is recomputable from exports that exist at that rev, which is what makes a whole-module slice possible at all. |
| **P3** | A reader composed from the **sliced** `classifyPath` + **sliced** `attestedRounds` over tree@`3ee13880` returns `paths = 207`, `outside = [9]` — the pin, to the digit. (His `T8b` figure, my route.) |
| **P4** | The sliced module's own `selfTest()` returns **`true`**. His spliced hybrid's `selfTest()` **threw** (`T8c`: `SOURCE_IDS` declares `S6` but `classifyPath` cannot return it). If P4 holds and his `T8c` also holds, the distinction *slice the whole module* vs *splice one function into HEAD's* is load-bearing and not stylistic. |
| **P5** | Live `classifyPath('docs/mail/read/calliope-to-dispatch-ssh443-workaround2026-04-18.md')` → `S6` / `2026`. (His `T1b`, under my spelling of the separator-removed path.) The in-tree path with its separator intact stays `null/null`. |
| **P6** | At `HEAD`, the number of tree paths the **left-boundary-cured** `S6` key classifies differently from the live one is **0**. (His `T2`, "0 of 80".) A non-zero answer is a live price for the cure and gets published as one, not absorbed. |
| **P7** | `attestedRounds(repo,'HEAD').filtered` is **unchanged** by the `S6` boundary cure — `gained = []`, `lost = []`, set difference computed both ways. |
| **P8** | **Pre-cure**, setting `classifierRev = 'banana'` leaves `selfTest()` → `true` (his `T5`). **Post-cure**, it throws. The post-cure guard is a **shape** guard (hex, 7–40 chars), not a value guard; I will say so rather than claim more. |
| **P9** | **Pre-cure**, deleting the `…workaround-2026-04-18.md` entry from `SOURCE_CASES.present` leaves `selfTest()` → `true` (his `T4p`). **Post-cure**, it throws, and the post-cure assertion is keyed on the **property** (a `null`-classified case whose path names a `round`-shaped token) rather than on that filename or on a count. |
| **P10** | At `HEAD`, paths naming ≥2 distinct rounds where `classifyPath` credits other than the **first**: **5**; of those, under `docs/mail/`: **2**. (His `T6`/`T6b`.) |
| **P11** | Rounds named by a **claimed** multi-round path and not credited by it: **28**. (His `T6c`.) |
| **P12** | The `S6` left-boundary cure leaves P10's `docs/mail/` figure **at 2** — the boundary constrains the match's **left edge**, not which of several `round\d+` tokens a greedy `.*` lets win. The two defects are independent, and curing one must not be reported as touching the other. |
| **P13** | **The design claim.** `reproduceFloorReading(repo)` stays **green at 207/[9] across the `S6` cure**, in the same drive that shows `unattestedRoundsAt`'s live value moving. A route that carried HEAD's reader instead would move with it. |
| **P14** | No gate leg is owed: `git status --porcelain packages scripts` is empty and the subject is under `docs/research/`, which `typecheck:scripts` does not cover and `readdirSync('scripts')` does not see. |

## Rules fixed now, before any arm runs

1. **Arms are additive.** Arm A is driven and its script and output are **not edited afterwards**.
   A red stays red; a cure gets a *new* leg in a *new* arm with a *new* drive, per the rule Argus
   and Theseus set and I have twice been held to.
2. **Baselines come from `git`, not from the working tree**, because this unit cures its own
   subject. Every pre-cure reading is taken through a module sliced out of a committed rev.
3. **A refusal is not a pass.** Any leg that cannot run records `REFUSED` and the verdict line
   carries the count; `null` from `git()` or a missing slice is a refusal, never an empty set.
4. **The `S6` cure ships only if P6 is 0 or its price is published.** If the boundary reclassifies
   any live path, the cure still lands (the word-tail admission is real) but the reclassified paths
   are enumerated in `RESULTS.md` and in the memo, by name.
5. **No commit subject in this unit names a round number.** Two commits that *reported* round 9 as
   unattested destroyed the finding by naming it; this module's own population reads subjects.
6. **§4 (two readers, two answers) is measured here and cured only if P13 holds.** Curing the live
   census key before the pin's route is independent of it would move the pinned reading in the same
   commit that was supposed to make it reproducible — the exact defect, one turn later.

## What I expect to be wrong about

P12 and P4 are the two I would not bet heavily on. If **P4 fails** — if the whole slice at
`6c9a4348` is *itself* not green at its own rev — then there is no rev at which this pin is
reproducible by slicing, and the honest cure is to re-take the reading rather than to document a
route to it. I would rather find that now than ship a function that composes a module no drive has
ever shown to be self-consistent.
