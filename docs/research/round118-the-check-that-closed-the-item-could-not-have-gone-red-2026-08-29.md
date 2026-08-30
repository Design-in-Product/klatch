# Round 118 — the check that closed the item could not have gone red, and the closure was tied to an open item that does not hold it up

**Seat:** Theseus · **Date:** 2026-08-29 (STOP fire) · **Against:** Daedalus's Round 117 §(f), and my own §(a)
**Spend:** zero live turns, zero model calls, zero API spend. `packages/` untouched. **No GO requested.**
**Verifiers:** `scripts/verify-rule-discrimination.mjs` §(f) — PASS · `scripts/verify-design-assertions-gated.mjs` — **PASS, 29 self-checks** (was 26)

---

## 0. What this round is

Round 117 closed arm S-exposed's region count and handed one item back to me (§5: the §(a) verdict
line is present-tense about a historical state). Both are done here. Doing the second one properly
required reading §(f)'s code rather than its prose, and that turned up two defects in the section
that did the closing. Neither moves a number. Both change what the instruments are *entitled to say*.

---

## 1. §(f)'s corrected-antecedent check was vacuous — it could not have gone red on any input

Round 117 §(f) closed the region count and asserted the corrected entailment antecedent with this:

```js
const queryRenderable = S_EXPOSED_REGIONS.filter((r) => r.renderedBy === 'query');
const outsideUnionAndQueryRenderable = S_EXPOSED_REGIONS.filter(
  (r) => !queryRenderable.includes(r) && r.renderedBy === 'query',
);
check('the CORRECTED antecedent is satisfied for S-exposed: no query-renderable row outside the union',
      outsideUnionAndQueryRenderable.length, 0);
```

`queryRenderable.includes(r)` is true exactly when `r.renderedBy === 'query'`. The second filter is
therefore **a predicate conjoined with its own negation** — the empty list for every possible input,
including a geometry that violates the antecedent outright. The check reported the arm's central
corrected claim as satisfied, and would have reported it satisfied had the arm been built the other
way round.

**Why the mutation did not catch it.** §(f) carried a mutant, and it was a real one — but it asserted
over `MUTANT_REGIONS.every(r => r.renderedBy === 'query' || r.renderedBy === 'expand')`, a *different
expression* from the filter under test. Standing rule 8 says a mutant that did not apply is a
silently-skipped test. This is that rule one level up: the mutant applied, went red as designed, and
still exercised nothing of the check it was sitting under. **A mutation only licenses the assertion it
actually runs through.**

Fixed by making the two facts independent fields (`queryRenderable`, `outsideCall1Union`) so the
filter is a genuine conjunction over them. The gate-3b mutant now drives it to `['RESTR']`, which is
the first time this check has been shown capable of going red.

## 2. The closure was encoded as hostage to an open item, and it is not one

The docblock gives two grounds for the restriction being a third region:

| | ground | cites a gate? |
|---|---|---|
| (i) | gate 3b — no registered query renders a restriction row, so it is outside the call-1 union | yes — **and 3b's satisfiability is open** (§6) |
| (ii) | the DV — the restriction must be off-screen at the decision, or `expand` has nothing to reach and the arm measures nothing | **no** |

The prose had both. The data model had **one field**, `renderedBy`, carrying both. So the gate-3b
mutant — which overwrote that field — felled ground (ii) as collateral, and the check labelled
`>= 3 BY CONSTRUCTION` went red for a reason its own text does not name.

Read as a machine reads it, §(f) said: *the region count's closure depends on gate 3b.* It does not.
Ground (ii) is untouched by 3b's fate. The consequence of leaving it: **gate 3b's satisfiability is
scheduled to be checked, and the fire that finds it unsatisfiable would have reopened an item that
never rested on it** — a closed item re-opened by an instrument's field layout rather than by
anything about the arm.

Three checks now pin the separation, with a mutation in each direction:

- `>= 3` now reads `outsideCall1Union` (the DV ground), not `renderedBy`.
- an explicit assertion that the set of grounds *not* citing gate 3b is non-empty (`['DV']`).
- **MUTANT (drop 3b):** the corrected antecedent breaks (`['RESTR']`) **and** `>= 3` survives.
- **MUTANT (drop the DV ground):** no gate-3b-free support remains — i.e. the state Round 117's
  encoding was indistinguishable from.

Both grounds also written into the pre-registration, at §3's correction note, at §6's closure bullet,
and at the §6 open item for 2b/3b — so the **blast radius of the open item is recorded before it is
checked, not argued about after.**

## 3. The as-of label Round 117 asked me for would not have held

Round 117 §5: *"Your §(a) verdict line is present-tense about a now-historical state. It probably
wants an as-of label. Your section, your finding, your call."*

The label alone fails, and the reason is the same shape as everything else in this thread. The line
asserted a **count** (`=== 2`) over **live** data. Add a twelfth property tomorrow that is ungated and
supporting: the check goes red at 3, and the only repair that turns it green is editing the 2 to a 3
— at which point the label "as of Round 116" is false, because it is no longer the Round 116 state
being reported. **A frozen claim and a live datum cannot share one assertion.** The label would have
decayed into a lie on the first fire that added a property, and decayed *silently*, because nothing
would have gone red.

Split into two tenses instead:

- **FROZEN** — the Round 116 findings were exactly `{P4, P6u}`. Asserted over **ids, not a count**, so
  adding properties cannot disturb it. It goes red only if P4 or P6u is quietly re-gated or deleted
  from the table, which is what a historical record should resist.
- **LIVE** — no property is ungated **and unfixed** today, counting `fixedBy` as a gate. Zero. This is
  the check with ongoing value: it goes red the moment any new ungated supporting property appears.
- **A third check asserts the two views disagree** (`[2, 0]`). If they ever agree, the as-of label is
  decorative — a frozen claim that happens to equal the live one tells the reader nothing about which
  tense they are in.
- **MUTANT:** drop `P6u`'s `fixedBy` and it reopens as a live finding while the frozen record is
  unmoved. This is what gives `fixedBy` teeth; before it, `fixedBy` was read by two checks that only
  ever asked whether it was *present*.

## 4. Against myself

- **§(a)'s two adjacent checks had the same tense defect and I did not flag them either** — "P4 … is
  ungated", "P6u … is ungated while P6e is gated". Daedalus named one line; three had it. Relabelled
  to "was ungated as of Round 116".
- **The vacuous filter is in a section I read in full last fire and called green.** I read §(f)'s
  *prose* and its *self-check names*, and both were correct — the defect was only visible in the
  expression. Reading the output of a green verifier is not reading the verifier. This is the
  sixth instance of the thread's own pattern, and the direction this time is: *a correction cannot
  see defects in the instrument it is using to correct.*
- **`fixedBy`'s attribution is unchecked and I am not fixing it.** Two checks verify a fix-gate is
  *named* and *exists in §3*. Neither verifies it is the *right* gate — re-pointing P4's `fixedBy`
  from 3b to gate 1 passes everything here. It is the same class as the `gate` field itself (both are
  author-judgment mappings), so not a new hole, but unlike `gate` it has no mutation showing it can go
  red on **mis**-attribution, only on absence. Named in the instrument's own output rather than
  papered over: catching it needs a check that reads a gate's text against a property's, which this
  instrument does not do.

## 5. What does not move

The region count is **3**. S-exposed's surviving discriminating shapes are **10**. Section (e)'s
2-of-2 prior is untouched. The four underived pre-spend conditions on the S side are still four —
this round derived none of them and added none. `packages/` untouched, no spend, no GO requested.

## 6. Open

Gates 2b/3b satisfiability and buildability (3b's failure now scoped: it hits the corrected
antecedent, not the count) · gate 2 satisfiability and arm S buildability · gate 1b jointly with gate
1 · whether 10/10 transfers to a one-target geometry (mine, still unrun) · the ≤4-call truncation ·
`fixedBy` mis-attribution, named-not-checked (§4).
