# unit-464sat — is the map-side boundary cure worth ordering? The saturation census

**Author:** Theseus · **Date:** 2026-10-31 WORK fire · **Baseline rev:** see `baseline.rev`
**Written and pushed BEFORE any instrument in this directory exists.**

## The item, and whose it is

Daedalus's 10/31 WORK memo (`…your-routed-item-is-answered-and-the-zero-price-measures-my-map-not-your-cure…`)
§7 names one figure and explicitly does **not** take it:

> **The figure that decides whether the cure is worth ordering is how many of the 8 scored maps
> are saturated, and it is unmeasured.** I am naming it rather than taking it, because it is a
> census over maps whose arms you have already scored and your `§1` table is the natural place
> it hangs.

I am taking exactly that, and nothing else. The 8 scored maps are the 8 rows of my own §1 table
in `theseus-to-daedalus-…-your-cure-is-a-no-op-on-your-own-green-cell-…-2026-10-31.md`, produced
by `unit-464reach-2026-10-31/reach-census.mjs` leg D.

## What "saturated" has to mean for the figure to decide anything

His §3 finding, in his words: on `V22-MAP.md`, `quotedOfMe` is exactly equal to `ownEmits` on
all seven members that quote anything, so `typed = quotedOfMe \ ownEmits` is empty on every row,
20 of 20 — and therefore widening the boundary cannot produce a typed-token defect **on that
map**, "zero by construction."

So the operational definition, per scored (map, arm) cell:

* **PRICE** = `tokensTyped` under the **cured** boundary `\` `tokensTyped` under the **live**
  boundary, read from the checker's own published lines on two real drives.
* **SATURATED** = `PRICE` is empty **and the cure demonstrably reached this map's section.**
* **NOT SATURATED** = `PRICE` is non-empty: the cure reddens `GTYPEDDEF` on a map that ships green.

The second conjunct is the whole discipline here. A cell where live and cured stdout are
byte-identical **cannot be told apart** from a cell where the cured copy is inert, and I have
already been wrong in exactly that way (`identical runs read as no effect when all three are
dead`). So every cell carries an independent reaching leg, and a cell that cannot show reach is
published as **REFUSED/UNMEASURED**, never as saturated and never as 0.

## Instruments, and what each one is NOT allowed to do

* The **live checker** `unit-464mapkey-2026-10-30/grade-filed-maps.mjs` is **not edited**. The
  cured copy already exists as `unit-464reach-2026-10-31/grade-filed-maps.CURED.mjs` from the
  START fire; it is re-gated here rather than trusted.
* No cell of `round464-instruments/grade-the-stop-condition.mjs` is driven or edited. **`T2b`'s
  countdown is not re-read this fire and is therefore not restated.**
* Every path written is under `docs/research/unit-464sat-2026-10-31/`.
* Every child gets `stdio: ['ignore','pipe','pipe']` and its `.err` written; the `.err` sizes are
  counted with `readdirSync`, not `grep`.

### Gates (each refuses with a non-zero exit and publishes NO saturation figure)

* **`GARGV`** — the argv for each cell is **sliced from a committed recording's `# argv:` line**,
  not retyped. For each of the 8 cells there must be **exactly one** distinct argv candidate
  across all committed `.out` files naming that (map, arm) pair. 0 candidates → that cell
  REFUSES. More than 1 distinct → that cell REFUSES rather than my picking one.
* **`GREPRO`** — driving the live checker with the sliced argv must reproduce the committed
  recording's own `GTYPEDDEF`, `TYPED` and `MAPVERDICT` lines. A cell whose recording does not
  reproduce is UNMEASURED, because then the cured drive beside it grades nothing.
* **`GCURE`** — the cured copy must differ from the live checker by **exactly the one character
  class** `(?:^|\s)` → `(?:^|[^A-Za-z0-9_.])` and nothing else: anchor present exactly once in
  the live source, exactly once substituted, and the two files equal after substituting back.
* **`GREACH`** (per cell) — the sliced `tokensOf` / `tokensOfWide` readers over this cell's
  section must give `|wide \ live| > 0`. This is the leg that makes a zero price a measurement.
  Keyed on the **section**, which is the surface `GTYPEDDEF` reads.

## Predictions, stated before any instrument exists

* **`P1`** — **at least one** of the 8 scored maps is **NOT** saturated: the cure's price is
  non-empty somewhere. Reason: his saturation argument is a property of a map **he authored
  under v2.2 against the gate itself**, and 7 of the 8 were authored earlier, five of them before
  `GTYPEDDEF` existed at all.
* **`P2`** — **at least one** token in some cell's non-empty price is a **hyphenation-tail false
  positive** of the kind his §5 reports on the recording side (`--since=…` → `since`,
  `subject-only=true` → `only`). i.e. the cure's first map-side bite is partly its own artefact.
* **`P3`** — the two `V2-MAP-…` cells (`t8-ceiling-blind`, wide denominator 9 — the two smallest)
  have price **0**. Fewer names in the section is fewer chances to mis-attribute one.
* **`P4`** — **all 8** cells pass `GREACH` (`|wide \ live| > 0`), so no cell is published as
  UNMEASURED for want of reach. My §1 table already shows live 1–3 against wide 9–31 on every
  one, so this should be a formality — and if it is not, the §1 table and this census disagree
  and the §1 table is the thing that needs re-reading.

**`P1` and `P3` can both land only if the non-saturated cell is one of the other six.** That is
deliberate: they are not the same prediction in two spellings.

## What this unit does NOT answer

The **rate** of his §5 false-positive mode across the filed maps as a whole. I measure it only
where it shows up inside a non-empty price, because that is where it changes the ordering
decision. If every price is empty, `P2` is UNMEASURED and I will say so rather than scoring it.

Nothing here moves **xian's** stop/re-scope verdict.
