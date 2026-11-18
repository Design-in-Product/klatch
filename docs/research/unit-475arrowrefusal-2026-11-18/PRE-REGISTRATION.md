# unit-475arrowrefusal — narrowing `decl-body.mjs`'s arrow return-type refusal

**Seat:** Daedalus · **Date:** 2026-11-18 (START fire) · **Pre-registered at:** `date` read
**09:19:49 PST**, fire opened **09:17:47 PST** — both read, not estimated, **before the arm
existed**.

## Why this unit, and who flagged it

This is the item I flagged on 2026-11-17 (STOP fire) as *"narrowing `decl-body.mjs`'s arrow refusal
(**needs its own KP set both ways**, including a `(a: string): (b: number) => void => {…}` positive
— **mine, next fire**, flagged so nobody else takes it)"* — `docs/COORDINATION.md`, Daedalus
section, Deferred list. Theseus's 11/17 STOP memo §6 asks explicitly: *"Your §3(b) left alone, as
you asked. If it is still open after your next fire, say so and I will take the KP set."* So this
unit either discharges it or reports it still open under a named blocker.

## The subject

`scripts/lib/decl-body.mjs:212-213`:

```js
if (code[i] === ':') {
  if (isArrow) return refuse('return-type-annotation-on-an-arrow-declaration');
```

Every `const`/`let`/`var` arrow or function-expression declaration carrying **any** return-type
annotation is refused, whole class, on the stated ground (module docblock `:65-66`) that *"a depth-0
`=>` inside a function-type return annotation is not distinguishable by character scan from the
arrow's own."*

**The claim this unit tests is that the ground is true of a SUBSET and the refusal covers the
CLASS.** `const f = (a: string): number => {…}` carries a return-type annotation with no `=>` in it
at all; there is nothing to confuse it with.

## Prior figures (from 11/17, NOT re-measured yet — they are the prior, not the finding)

`unit-470bodyslice` RESULTS §7/§7a and my own COORDINATION entry: reach over 469 tracked files read
**block 2072 · concise 547 · refused 910**, of which **510** were this refusal reason, with **at
most 152** carrying the ambiguity and **≥358** refused on a plain annotation. §7a recorded that
narrowing as a **negative result against my own key**: `if (arrows === 1) … else ambiguous` made the
second bucket a fall-through that also held `arrows === 0`, so **152 stands as an upper bound, 232
as a floor, and the narrowing's price was unmeasured.** This unit's job is the sound key.

## Predictions

Each is registered with the predicate that decides it and the direction that counts as a hit, so a
later reading cannot re-point it.

- **P1 — the class is still the majority of refusals.** Predicate: over the tracked tree,
  `count(reason === 'return-type-annotation-on-an-arrow-declaration') / count(kind === 'refused')`.
  **HIT if > 0.50.** (Prior: 510/910 = 0.56.)
- **P2 — most of the class is unambiguous.** Predicate: within that class, the count of **depth-0
  `=>` tokens in the annotation region** (from the `:` to the declaration's body or statement end),
  where depth counts `(`/`[`/`{` and where the `>` of a `=>` is **not** read as a bracket close.
  **HIT if ≥ 60% of the class has exactly zero such tokens** before the arrow's own is consumed —
  i.e. is resolvable with no ambiguity at all.
- **P3 — the `>` of `=>` corrupts the EXISTING non-arrow return-type scan.** `decl-body.mjs:220`
  decrements `depth` on any `>`, and `=>` ends in `>`. Predicate: a `function` declaration with a
  function-type return annotation (`function f(): (a: number) => void { … }`) is **refused** today
  with `no-body-brace-after-the-return-type`, despite being unambiguous (a `function` declaration
  has no arrow of its own). **HIT if that form refuses at HEAD.** Direction matters: this would be a
  defect I am predicting in my own module written yesterday, not a property.
- **P4 — the cure is purely additive.** Predicate: for every declaration head in the tracked tree
  that resolves to `kind: 'block'` at HEAD, the cured reader returns the **byte-identical**
  `bodyStart`/`bodyEnd`. **HIT if the diff is empty.** A narrowing that moves an existing span is
  not a narrowing; it is a new defect, and this is the leg that would catch it.
- **P5 — the genuinely ambiguous form stays refused.** Predicate: the cured reader on
  `const f = (a: string): (b: number) => void => { return; }`. **HIT if `kind === 'refused'`** (any
  reason naming the ambiguity). **A pass that resolves it to `concise` is the silent-under-report
  harm class this module exists to cure and counts as a REFUTATION, not a bonus.**
- **P6 — the price is visible and small.** Predicate: the count of this reason remaining after the
  cure. **Registered as a measurement, not a threshold** — I am not predicting a number, because
  §7a's lesson is that I had no sound key for it. It is reported, whatever it is.

## KP set, both ways — and its provenance, stated before it is built

The 11/17 deferral named "needs its own KP set both ways". Both directions:

- **KP-A (must resolve after the cure, must refuse before it):** a plain annotation.
  **Sliced from the corpus, not typed** — taken by `git show`/read from a tracked file that carries
  the form, with the file and line recorded in RESULTS.
- **KP-B (must refuse both before AND after):** the function-type return annotation on an arrow,
  `(a: string): (b: number) => void => {…}`. **If no tracked file carries this form, the KP is
  SYNTHETIC and will be labelled synthetic in RESULTS** — a hand-typed KP is not a slice, and the
  honest form of that is to say which one it is rather than to present a fixture as a census hit.
- **KP-C (the P3 direction):** a `function` declaration with a function-type return annotation.
  Same rule: sliced if live, labelled synthetic if not.

## Cripples

- **C1 — remove the ambiguity guard from the new path** (resolve every arrow annotation).
  Must redden on **KP-B**. A cripple that reddens nothing means the guard is decorative.
- **C2 — leave the guard but mis-key it on `arrows >= 1`** instead of the token scan.
  Must redden on **KP-A** (a plain annotation wrongly refused). This is the §7a fall-through
  bucket re-staged as a cripple, so the bucket defect cannot come back unnoticed.

Both restored and verified (`grep -c CRIPPLE` → 0, `git status --porcelain` empty) **before** the
gate runs.

## Gate

Typecheck ×4 programs, server suite, client suite, census, the `verify-decl-body-slicers.mjs`
detector, and the 45-file sweep. The sweep's standing figure at HEAD is **45 of 45** (my own 11/17
STOP cure); a narrowing of a shared reader that 56 instruments' worth of consumers sit downstream of
must not move it.

## Named limits of this unit

- It does **not** touch `probe-round322` A1 (Theseus's, and his two 11/17 memos keep it on his
  queue), and it does not touch the latent `probe-round300:185` instance his addendum §2 names.
- It does **not** re-measure `unit-470bodyslice`'s 59 baselined slicers against the fourth
  mechanism — still deferred, still mine, blocker: it needs the baseline re-cut, which is a
  different unit's worth of drives.
