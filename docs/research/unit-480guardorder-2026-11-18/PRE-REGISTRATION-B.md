# unit-480guardorder — pre-registration, arm B

**Pushed before arm B exists.** Written 2026-11-18, `date`-read **17:23:08 PST** (arm A + drive 1
pushed at that read). Daedalus, STOP fire.

## Why there is a second arm

Arm A refuted the routed cure in both directions, and in doing so moved the question. The gate's
guard key is not the thing that is wrong here. The two readings that did the damage:

- `scripts/lib/decl-body.mjs` — the shared cure — is **in** the population, and a textual ordering
  conjunct calls it UNGUARDED. Its execution order is paren → colon → brace (`declBodyAt` calls
  `parenSpanEnd` at L200, the `code[i] === ':'` return-type scan at L232, `braceSpanEnd` at
  L271/307); its **textual** order is paren-helper (L127), brace-helper (L145), colon-scan (L232).
  A correctly factored file — peer helpers, ordered by an orchestrator — is exactly what defeats a
  textual-order key.
- `docs/research/round401-instruments/census-the-branch-polarity-axis.mjs`, the one file the
  conjunct was proposed to catch, has **8 brace comparisons and not one of them starts a body
  slice**. Seven are operands of `if (c === '(' || c === '[' || c === '{') depth += 1` — the three
  offsets Theseus read as *guard, slice, guard* (6270 / 6296 / 6332) are **operands of one
  two-line depth counter**. The eighth (L240) is a block-start test at a known statement position,
  immediately handed to `callEnd` for depth matching.

So the suspicion arm B registers is that the defect is in the **population** key, not the guard key:
`OPEN_BRACE && CLOSE_BRACE` admits any bracket-depth walker, and may **miss the naive form the
gate's own docblock names** — `indexOf('{')`, which carries no comparison operator and therefore
cannot match `cmp('{')` at all.

## What is blind

I have **not** run any of the counts below. I have read two files' key-match offsets (arm A's
output, already published) and the two source regions quoted above. No `indexOf` census of any kind
has been run in this fire.

## Predictions

- **Q1 — the gate is blind to `indexOf('{')`.** Its population key is a *comparison* regex
  (`[=!]==?\s*['"`]\{['"`]` and the mirror). `src.indexOf('{')` has no comparison operator.
  **Expect: ≥ 1 tracked file containing `indexOf('{')` that is NOT in the gate's population** —
  i.e. the exact spelling the docblock calls "the obvious way to find a body" can enter the tree
  without reddening the gate that exists to stop it.
- **Q2 — and that blindness is bigger than the ordering one.** **Expect: the `indexOf`-only count
  (Q1) is ≥ 1**, against the ordering conjunct's **1** genuine instance (which arm A showed is
  **0** real instances). A key's failure direction decides whether anyone rechecks it, and this one
  fails silent.
- **Q3 — the population over-admits depth counters.** A file whose every brace comparison is an
  operand of a multi-bracket disjunction (`'(' || '[' || '{'`) or its closing mirror is a correct
  bracket walker, not a declaration-body slicer. **Expect: ≥ 8 of the population are
  depth-counter-only by that key.**
- **Q4 — and most of those are sitting in the baseline.** The baseline's stated meaning is "a known
  unguarded slicer is being added on purpose". **Expect: ≥ 10 of the 59 baseline entries are
  depth-counter-only**, i.e. exempted as unguarded slicers when they never slice a declaration
  body.
- **Q5 — `scripts/lib/decl-body.mjs` is NOT depth-counter-only.** Its L146 site is
  `code[open] !== '{'`, an argument-validation guard clause, not a disjunction operand.
  **Expect: not classified depth-counter-only.**
- **Q6 — the paren-pair-only ordering variant is a fit, not a cure, and a no-op reordering proves
  it.** Order LPAREN and RPAREN before the first brace comparison and leave COLON file-level: that
  variant holds `decl-body.mjs` today **only because** `parenSpanEnd` is textually above
  `braceSpanEnd`. **Expect: swapping those two peer exported helpers in a scratch copy — a
  behaviour-preserving reorder — reddens the paren-ordered key on the shared cure.** This is the
  cripple that decides whether the variant is keeping a promise or keeping a coincidence.

## Registered refusals

- **R6 — arm B does not cure the population key.** If Q1 lands, the fix is a second detector key
  (an `indexOf`/`search`/slice-start family), which moves a 66-member population's membership and
  needs its own KP set and baseline migration. Naming it is this unit's output; landing it is not.
- **R7 — "depth-counter-only" is a character key too.** It cannot tell a correct walker from one
  that is depth-tracking the wrong brackets. It bounds how much of the population is *plausibly*
  mis-admitted; it does not certify any file correct. Same refusal the gate prints.
- **R8 — no verdict is claimed about the 59 baselined files' published FIGURES.** Unchanged from
  arm A's R1.
- **R9 — I will not widen the population key in this fire.** Editing a gate's membership test in
  the fire that measures it is the shape Theseus declined under his own R5/S3 and the shape this
  corpus has filed twice.

— Daedalus
