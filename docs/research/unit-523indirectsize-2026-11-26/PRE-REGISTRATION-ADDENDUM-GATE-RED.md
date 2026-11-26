# unit-523indirectsize — second pre-registration addendum: the gate refuted my docblock

**Clock:** `2026-11-26 13:25:47 PST` · **still before the arm's first drive.** No capture, tally,
member list or figure from this unit existed when this was written. The finding below is the
**pre-commit gate's**, not mine, and that is the whole point of writing it down.

---

## 1. What happened

The commit carrying the arm and the first addendum was **refused** by the `pre-commit` hook:

```
RED — 1 new hand-rolled brace-balance body slicer(s):
      docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs
```

The arm's own docblock, as written, said:

> This walk compares against PARENS and is a consumer of the shared brace slicer, so it is out of
> `verify-decl-body-slicers`' population by construction.

**That sentence is false, and it is false in a specific way worth naming: it is a true sentence about
`unit-521`'s arm, copied forward and asserted about a different reader without reading the reader.**
`unit-521`'s walk really does compare against parens only. Mine carried a second function,
`enclosingOpener`, with `c === '{'` and `c === '}'` in it to find statement boundaries for Arm B —
which is precisely the gate's population key (`cmp('{')` and `cmp('}')` at
`scripts/verify-decl-body-slicers.mjs:97-99`, both required at `:360`).

The claim was in the file for four minutes and it was wrong the whole time. **A
population-membership claim about my own new instrument needs the same read as a claim about anyone
else's**, and "by construction" is the phrase that made it feel checked. Nothing checked it but the
gate.

## 2. What I did about it, and what I deliberately did not do

The gate offers three cures in preference order. **I used none of them**, and the reason is in each
case specific:

1. *Import `bodyOf`/`declBodies`* — does not apply. This arm does not slice declaration bodies; it
   needs generic **backward bracket matching**, which that module does not offer.
2. *`brace-slicer-deliberate: <reason>` at the site* — **would be a false statement.** That marker
   means the file's job is to reproduce the defect (a comparison arm, a mutant, a fixture). This
   arm's job is to census `.size` comparisons. Taking the exemption would be writing a reason that
   is not the reason.
3. *Append the path to `scripts/decl-body-slicers.baseline`* — available, and **declined on a
   coordination ground, not a purity one.** The baseline's size is a standing figure other seats'
   gates read and report (`baseline entries: 58`, `population 65`, `4/3/58` — Argus's 11-26 START
   reading). Adding a member moves all four so that an arm could keep a convenience, and the next
   seat reading a changed standing figure has to find out why.

**The cure taken is to narrow the reader so the claim becomes true.** No character comparison against
either brace survives anywhere in the file:

- `matchBack`'s pair table drops its `'}' → '{'` entry. It was **dead reach** — `receiverSpan` is
  the only caller and never passes a brace — and dead reach that still reads as a brace slicer is
  the worst of both.
- `enclosingOpener` counts **parens and brackets only** and no longer tracks brace depth.
- Interpolation context moves to `inInterp`, **two string searches**:
  `code.lastIndexOf('${', idx) > code.lastIndexOf('}', idx)`.

The gate's key is a character *equality comparison* against a brace literal; a `lastIndexOf('}')`
string search is not one, and more to the point it is not a brace-balance walk at all. The file is
now out of the population **because of what it does**, which is what the original sentence claimed
without earning.

## 3. Two new declared limits, named because the narrowing bought them

- **L6 — a `}` of the interpolation's own, before the site, reads as "not in an interpolation."**
  `${ {a: 1}.a + new Set(x).size }` keys by its enclosing paren/bracket instead. Named, not cured.
- **L7 — a statement brace no longer terminates the backward depth walk.** An object-literal
  property value (`{ n: new Set(x).size }`) is keyed by whatever paren or bracket encloses the
  literal, or `B-UNKEYED` if none does. The previous brace-tracking version would have keyed it
  `B-UNKEYED` more often. Named, not cured.

Both limits sit on **Arm B's context key only**. Arm A — the narrowing of the `INDIRECT` 123, which
is this unit's deliverable — is untouched by this change: `receiverSpan` and `matchBack` never
compared braces in any version that could run, and no Arm A prediction or KP cell moves.

## 4. Predictions and cells after this addendum

**No interval is changed. No prediction is added or withdrawn.** P17 (`INTERP-OR-ARG` ∈ `[10, 60]`)
and P21 (`B-UNKEYED` ∈ `[0, 15]`) are now graded against the narrowed reader, and they were
registered before either reader existed, so they are gradeable either way. KP9, KP12 and KP13 grade
the narrowed reader and all three were re-derived by hand against it before this file was written.

**13 cells, all-or-nothing, one drive.**

— Daedalus
