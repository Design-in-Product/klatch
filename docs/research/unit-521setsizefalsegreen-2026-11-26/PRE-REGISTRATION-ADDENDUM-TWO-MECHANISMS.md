# unit-521 — addendum: `INVARIANCE 11` fuses two mechanisms, and one of them splits on the operator

**Written at:** 2026-11-26 09:24 PST. **Registered after** the arm's only drive
(`captures/ARM.out`, 8156 B, `.err` 0 B, commit `ab563ad3382d`) **and before** any post-hoc that
grades this addendum existed. Nothing below was measured when it was written; the arm's published
member list was hand-read, which is how both mechanisms were found.

## Why an addendum is owed

The arm's `INVARIANCE 11 / BLIND 11 / GUARDED 0` is an **upper bound on false-green-capable sites**,
not a count, and the published member list says so on its face in two different ways. Publishing 11
as the figure would be publishing a number whose own evidence refutes it.

### Mechanism A — `BLIND` is about the guard, not about whether absence is possible

`BLIND` means "no presence predicate inside the set's own argument span". It does **not** mean an
absent member is reachable. Three different sub-shapes are in the 11:

- `unit-505markedabsentpair…:301` and `:305` — `new Set(['E-MARKED-ABSENT', 'E-2ABSENT', …]` — the
  members are **string literals written at the site**. No absence is reachable, so no guard is owed
  and `BLIND` is a true statement about a non-risk.
- `unit-464subkind…/grade-subkind.mjs:336` — `new Set(ctrl.map((a) => a.split(':')[0]))` — an absent
  member makes the projection **throw**. Absence here is loud, which is the one failure direction
  this corpus does not have a recorded problem with.
- `unit-506…:88` — `new Set(rows.map((r) => r.figures[k]))` — a property read on a present object.
  An absent figure yields `undefined` **silently**. This is the subject, and it is the only shape
  that can produce the false green.

So the keying owed is **absence-reachability**, downstream of the guard key: `ARG-LITERAL`,
`PROJ-THROWING`, `PROJ-SILENT`, `PROJ-TOTAL` (projection cannot be absent — `.length`, a `Boolean()`
wrap), `NO-PROJECTION` (bare identifier; absence possible and silent).

### Mechanism B — the one that is worth the addendum on its own

`=== 1` and `< 2` are **the same invariance claim** and have **opposite failure directions on an
empty collection**:

```
new Set([]).size === 1   →  false   →  reads VARIED    →  a FALSE RED on an empty collection
new Set([]).size < 2     →  true    →  reads INVARIANT →  a FALSE GREEN on an empty collection
```

The arm's own `INVARIANCE` class fused both operator forms into one bucket — `=== 1`, `== 1`,
`<= 1`, `< 2` — because the pre-registration keyed *the claim* and not *the failure direction*. Three
of the 11 are `< 2` (`unit-465routecure…-b.mjs:209`, `:245`, `unit-465routecure….mjs:334`, each
`if (new Set(x).size < 2) continue;`). This is an **undifferentiated containment match fusing two
mechanisms**, a defect this seat has recorded before and has now committed in its own direction key
inside the same unit that went looking for a fused reading somewhere else.

It also matters more than the absence story for those three sites: a `continue` on "fewer than two
distinct values" **skips the row**, so an empty collection is skipped silently as if it were
uniform.

## Predictions, registered before the post-hoc exists

| # | Prediction | Interval |
|---|---|---|
| **PH1** | Of the 11, sites whose set argument is a **literal array** (absence unreachable) | `2` exact |
| **PH2** | Emptiness split of the 11: `EMPTY-READS-VARIED` (`=== 1`, `== 1`) / `EMPTY-READS-INVARIANT` (`<= 1`, `< 2`) | `8 / 3` exact |
| **PH3** | Driven, not asserted: `new Set([]).size === 1` and `new Set([]).size < 2` return **opposite** verdicts on the same empty input | exact |
| **PH4** | The false-green-capable subset of the 11 (absence reachable **and** silent, i.e. `PROJ-SILENT` + `NO-PROJECTION`) | `[4, 9]` |
| **PH5** | Of the 3 `EMPTY-READS-INVARIANT` sites, those that are false-green-capable **by emptiness alone** — i.e. not also absence-capable | `0` |
| **PH6** | Of the 26 `CHANGE` sites, those that are the paired opposite-direction reading of an `INVARIANCE` site **in the same file** (so one input makes one false-green and one false-red at once) | `[1, 4]` |

**PH5 is a zero and its precondition is PH1/PH4's key, not a new one** — if every `< 2` site is a
bare identifier, emptiness adds no site that absence did not already carry, and the mechanism is a
second *reason* rather than a wider *reach*. That is a worse-sounding and more useful result than a
larger number.

— Daedalus
