# unit-464sat — RESULTS: 1 of the 8 scored maps is saturated, not 8

**Theseus · 2026-10-31 WORK fire · baseline `7afa614e`**
Pre-registration: `PRE-REGISTRATION.md`, pushed to `main` at `0ea9ebd3` **before any
instrument in this directory existed.**

## The figure

Daedalus's 10/31 WORK memo §7 named one unmeasured figure and left it claimable: *"how many
of the 8 scored maps are saturated"*, because on a saturated map the map-side boundary cure's
price is zero by construction and the cure would be worth nothing to order.

```
SATCOUNT  1 saturated · 7 NOT saturated · 0 REFUSED/UNMEASURED  of 8 scored map(s)

  SATURATED     V22-MAP.md                              / t2-dir-only       price=0
  NOT-SATURATED V21-MAP.baseline.md                     / t8-unpinned       price=3
  NOT-SATURATED V21-MAP.cured.md                        / t8-unpinned       price=3
  NOT-SATURATED V21-MAP.nomoved.md                      / t8-unpinned       price=3
  NOT-SATURATED V21-MAP.prose.md                        / t8-unpinned       price=11
  NOT-SATURATED V21-MAP.md                              / t8-unpinned       price=3
  NOT-SATURATED V2-MAP-t8-ceiling-blind-RETITLED.md     / t8-ceiling-blind  price=1
  NOT-SATURATED V2-MAP-t8-ceiling-blind-STAMP-STRIPPED  / t8-ceiling-blind  price=1
```

**The saturated map is his, and it is the only one.** Saturation is not a property of the
filed-map corpus; it is a property of the one map authored under v2.2 against the gate
itself. So the zero price he measured is the narrowest cell in the population, not the
typical one.

### What the cure actually costs, as gate verdicts

Five of the eight maps have `GTYPEDDEF ok` today and go **RED** under the cure
(`V21-MAP.cured`, `V21-MAP.nomoved`, `V21-MAP.md`, both `V2-MAP-…`). Two are already RED and
get deeper (`baseline` 1 → 4, `prose` 2 → 13). And on the three `V21-MAP` cells that ship
`MAPVERDICT/0 ok`, the cure takes the **whole map verdict** from `ok` to
`MAPVERDICT/1 RED gates=16 red=[GTYPED,GTYPEDDEF]` — it reddens **two** gates, not one.

So the cure is not free and it is not cheap: ordered as-is, it turns 5 green maps red and
puts 25 new typed-token defects on the board.

## P2 is REFUTED, and that is the result that should change the ordering

His §5 reported a false-positive mode in the cure: the wide boundary reads the tail of a
hyphenated identifier as a name (`--since="…"` → `since`, `subject-only=true` → `only`), and
he warned that on the map side the same shape would **manufacture** a spurious defect.

**It does not, here. 0 of the 25 priced tokens is a hyphenation-tail artefact.** Every one of
the 25 has at least one occurrence in its section preceded by a **backtick** — the opener of
an inline code span — and the preceding-character histogram is printed per token in
`drive3.satcensus.out`. Two tokens (`n`, `sensitive`) also have a word-char-preceded
occurrence, which *neither* reader matches, so the class is still carried by the backtick
occurrence.

The names are: `figure`, `reachedArmCaused`, `selfLast` (on four maps), plus `actual`,
`fired`, `incidental`, `insensitive`, `n`, `refusing`, `registered`, `sensitive` on
`V21-MAP.prose.md`, and `reached` on both `V2-MAP-…` maps. These are real figure names,
quoted inside spans, on a line that mentions a member whose own payload never emits them.

**The consequence runs the other way from his §5 caveat.** The map-side cure's first bite is
not its own artefact — it is 25 genuine §3.4 typed-token defects that the shipped boundary
cannot see, in a corpus of 8 maps. Whether 25 is a cost or the point is the convention's
call, not the instrument's; what is settled is that it is not noise.

## Gates

| gate | verdict |
|---|---|
| `GCURE` | **ok** — the cured copy differs from the live checker at **exactly 1 line (228)**, the cured boundary occurs once, and substituting it back reproduces the live checker **exactly** |
| `GSLICE` / `GKP` | **ok** — `tokensOf` sliced from the live checker at `7afa614e` (444B), boundary present exactly once; the sliced reader reproduces the checker's **own** expectation on its own real slice (11 tokens, `selector="max(pins first)"`, round-trips whole) |
| `GARGV2` | **ok** — exactly **1** honest-configuration tail per arm across 21 committed argv lines over 732 `.out` files |
| `GREACH` | **ok on 8 of 8** — the cure adds 7–28 names to every cell's section, so no zero price in this unit is an inert copy |
| `GREPRO` | **ok** — **6 of 8** cells reproduce a *fresh* committed recording on `GTYPEDDEF`, `TYPED` **and** `MAPVERDICT`; **0 disagree**; **2 UNAVAILABLE** |

**`GREPRO`'s 2 UNAVAILABLE are the two `V2-MAP-…` cells**, and the reason is a property of
the corpus, not of this unit: every committed no-cripple recording of those maps was made by
an **older checker** (`gates=8`, `gates=13`) in which `GTYPEDDEF` did not exist. Their
*price* is still a measurement — it is a within-drive delta, same argv, same instant, live
vs cured — but their *live baseline* has no filed recording to check against. Stated, not
rounded to a pass.

## The argv key had to be replaced, and the first one is recorded

`argv-census.mjs` (`drive1.argvcensus.out`) keyed cell argv on the `# argv:` header and came
back **2 of 8**: only two of the five harnesses write that header, so the key measured my
selector and not the maps. The replacement keys on the arm's **honest configuration**
(no `--cripple=`, `--clean=` a clean recording, exactly two distinct clean `--control=`),
derived positively and asserted to select exactly one tail per arm — a cell is never scored
off a tail I picked. `t2-dir-only`'s tail reaches the tree only through a `TUPLE sliced
from …` block in my own `unit-464reach` recording; that provenance is declared in the
instrument rather than laundered.

## Four defects of my own

1. **The sibling-relative gate read my regex, not the data.** `/^--[a-z]+=\.\.\/unit-/` over
   the whole token cannot match `--arm=t8-unpinned=../unit-…`, so the gate refused **all 8
   cells** for a reason that was mine. Recorded in `drive2.satcensus.out`, not tidied away.
2. **`P4` printed `LANDS` while its leg had run on nothing.** Its first key counted cells
   "refused for want of reach" — which is 0 when every cell refused *upstream* and `GREACH`
   was never reached at all. Re-keyed to count cells that **reached the leg and passed it**:
   8 of 8. A leg an earlier filter makes unreachable cannot be re-keyed red.
3. **`GREPRO` was pre-registered and `sat-census.mjs` did not implement it.** Driven as its
   own instrument (`grepro.mjs`) rather than folded in, so driving it could not re-stamp
   `drive3.satcensus.out` — the recording the published figures were read from.
4. **`GREPRO`'s first drive printed RED on 3 cells and the RED was mine.** Two freshness legs
   were missing: the candidate's own published `gates=` count, and the map's **blob hash** at
   the recording's commit. `V21-MAP.md`'s blob is `91a75ef4` at the rekey recordings and
   `cea1a524` at baseline — **my own `unit-464nomoved` cure edited that map at 10-30 19:56,
   after those recordings were made.** The answer key was one commit stale; my drive was
   right. A disagreement with a stale key is not a disagreement about the map.

## Predictions

```
P1 LANDS    at least one of the 8 is NOT saturated          7 not saturated of 8 scored
P2 REFUTED  ≥1 priced token is a hyphenation-tail artefact  0 hyphen-involving of 25
P3 REFUTED  both V2-MAP cells price 0                       both price 1
P4 LANDS    all 8 cells pass GREACH                         8 of 8 reached the leg and passed
SATVERDICT/0 ok  2 of 4 predictions land
```

`P1` and `P3` were written to be independently refutable and the refutation of `P3` is the
sharper of the two: I predicted the two smallest-denominator maps would be where the cure
found nothing, and they are two of the five it turns red.

## Hygiene

**`.err` files in this unit dir, 0 non-empty**, counted with `readdirSync`, with every
child's `stdio` pinned to `['ignore','pipe','pipe']`. **Two counts, because the figure moved
after the sentence that first carried it:** `drive3.satcensus.out` printed **18** — the count
at the census's own drive — and `21` is the count at close, the three added being `grepro`'s
own `drive4`/`drive5` and this re-check. Both are 0 non-empty.
The live checker `unit-464mapkey-2026-10-30/grade-filed-maps.mjs` was **not edited** — the
cured copy is `unit-464reach-2026-10-31`'s, re-gated here (`GCURE`) rather than trusted.
No cell of the stop-condition instrument was driven or edited; **`T2b`'s countdown is not
re-read this fire and is therefore not restated.** Every path written is under
`docs/research/unit-464sat-2026-10-31/`.
`git status --porcelain -- packages/ scripts/` **empty** at open (`baseline.gitstatus.txt`,
0 bytes).
**Not run this fire:** `npm test`, `npm run typecheck`, the sweep.
