# unit-464vac — can `GTYPEDDEF` carry a `VACUOUS` branch, and what denominator would it read?

**Daedalus, 2026-10-31 STOP fire.** Written and pushed to `main` **before any instrument in
this directory exists.** Baseline rev `e6460aba` (`baseline.rev`);
`git status --porcelain -- packages/ scripts/` **empty** at open (`baseline.gitstatus.txt`,
0 bytes).

## The item, and why it is now takeable

My own open item, named across three memos and never built: **the `VACUOUS` branch for
`GTYPEDDEF`** in the live checker
(`docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs:1007-1025`). As it ships,
`GTYPEDDEF` publishes

```
GTYPEDDEF ok  typed-token defects: 0 typed tokens across N mapped arm(s); …
```

and that `0` has no denominator beside it. Its sibling `GSUBJ` (same file, `:952-993`)
already carries the idiom this gate lacks — two legs, each printing *its own* opportunity
count, with the explicit comment that "a leg whose denominator is 0 has not passed — it was
never given the chance to fail."

Theseus's `unit-464sat-2026-10-31` supplied the figure I said I lacked: **`SATCOUNT 1
saturated · 7 NOT saturated · 0 refused`** of the 8 scored maps. His memo reads that as "a
`VACUOUS` verdict would fire on exactly one cell today."

**I am not taking that reading on trust, and this unit is the reason.** His saturation
predicate is `price.length === 0` — *the cure's* price, measured at the **wide** boundary
(`sat-census.mjs:351`). `GTYPEDDEF` runs at the **live** boundary. A branch inside the live
gate can only read figures the live gate has. So the question this unit must answer first is
not "should VACUOUS fire" but:

> **Is there any denominator readable at the live boundary that separates the 1 saturated cell
> from the other 7?** If there is not, then a `VACUOUS` branch keyed on saturation is not
> buildable inside the gate at all, and the item resolves as a finding rather than a build.

## Population and provenance — declared, not re-derived

The 8 cells and their resolved argv are read **from Theseus's committed
`unit-464sat-2026-10-31/sat.json`** (`results[]`, each with `map`, `arm`, `argv`), not
re-selected by me. His argv key is his instrument's; re-deriving it here would grade his
selector, which is not this unit's question. **Declared dependency:** if his `sat.json` is
wrong about a cell's configuration, every figure below inherits that. Asserted, not assumed:
the slice must yield **exactly 8** cells, each with a `--map=` and at least one `--arm=`, or
the instrument refuses.

The checker driven is `unit-464absorb-2026-10-31/grade-filed-maps.INSTRUMENTED.mjs` — **my own
derived copy from this morning's unit**, which already dumps per-row `ownEmits`,
`quotedOfMe`, `typed` and per-arm `emitted`, `quoted`, `reached` (`:508`, `:543`). The live
checker is **not edited by this unit's measurement pass**. Because that copy carries
`ABSORB_CRIPPLE` hooks, every drive here runs with `ABSORB_CRIPPLE` **unset**, and the
instrument must **assert** the copy reproduces the live checker's own `GTYPEDDEF` and
`MAPVERDICT` lines on each cell — a derived copy that has drifted from its source cannot
measure its source.

## The candidate denominators

Each summed over the arms' **reached and mapped** members, per cell:

* **`D1 OPP-ARMWIDE`** = Σ_m |`emitted`(arm) \ `ownEmits`(m)| — names *some* member of the
  arm emits that **this** member does not. Pure emission side, so it cannot be computed from
  the thing it is a denominator for (the `GSUBJ` lesson: the opportunity and the measurement
  must come from different places).
* **`D2 OPP-SECQUOTED`** = Σ_m |`quoted`(section) \ `ownEmits`(m)| — names the section quotes
  *anywhere* that this member does not emit. This is the **wide** boundary's measurement.
* **`D3 CTXLINES`** = Σ_m `ctxLines`(m) — lines the live gate actually read.
* **`D4 QUOTING-MEMBERS`** = # of reached+mapped members with |`quotedOfMe`| > 0, over the
  total such members. The gate's **real** coverage at the live boundary.

## Predictions, stated before any drive

* **`V1`** — `D1 > 0` on **all 8** cells, the saturated one included. *Therefore `D1` does not
  separate, and a `VACUOUS` branch keyed on it would be a dead branch that never fires.*
* **`V2`** — `D2`, per cell, is **exactly** the union of Theseus's `price` and the live
  `tokensTyped` (set equality in both directions per cell, member-agnostic). *Therefore a
  branch keyed on `D2` is the cure wearing a different name, not an independent vacuity test.*
* **`V3`** — `D3 > 0` on all 8 cells.
* **`V4`** — **the decision.** No denominator readable at the live boundary separates the 1
  saturated cell from the 7 non-saturated. If `V4` lands, the `VACUOUS`-branch item as I named
  it is **not buildable inside the gate**, and saying so is the deliverable.
* **`V5`** — on **at least one** of the 8 cells, the count of reached+mapped members with
  `quotedOfMe` **empty** is `> 0`. *Therefore the shipped line's "across N mapped arm(s)"
  overstates the gate's coverage: it counts arms, and the gate measures members.*
* **`V6`** — on **no** cell is `D4`'s numerator 0. *Therefore a strict all-or-nothing
  `VACUOUS` verdict fires on 0 of 8 today, and the buildable thing is a published coverage
  denominator, not a verdict flip.*

`V5` and `V6` are deliberately a pair: together they say the honest repair is a denominator on
a green line, and **not** a new RED. If `V6` is refuted — some cell measures no member at all
— then a true `VACUOUS` verdict is warranted on that cell and I will say so.

## Refusal discipline

Every figure refuses rather than defaulting. A cell whose drive exits non-zero for a reason
other than a red gate, or whose `MAPVERDICT`/`GTYPEDDEF` lines do not match the live
checker's, is **UNMEASURED** — not 0, and not saturated. `REFUSALS > 0` suppresses the
summary figures rather than printing them beside a refusal.

## Scope

**Not** driven or edited this unit: the stop-condition cell, `npm test`, `npm run typecheck`,
the sweep, any file under `packages/` or `scripts/`. Every path written is under `docs/`.
Whether to **order** Theseus's boundary cure is xian's call and is not touched here.
