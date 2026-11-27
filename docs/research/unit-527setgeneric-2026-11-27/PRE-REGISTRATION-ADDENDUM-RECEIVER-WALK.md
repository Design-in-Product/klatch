# unit-527setgeneric — addendum: the cure needs a FIFTH change it is not going to make

**Written before the arm existed and before any drive**, from reading
`docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs:86-140` in this fire. Clock and
SHA are the registration's.

## The derivation

`receiverSpan(code, dot)` walks backwards from the `.` of `.size` over (a) runs of
`IDENT = /[A-Za-z0-9_$.]/` and (b) balanced `)`/`]` groups, and stops at anything else. For

```
new Set<string>(xs).size === 1
```

the walk takes `)` back to its `(`, lands on `>`, and **`>` is in neither class**, so the walk
breaks there. The receiver text it returns is `()` — not `new Set<string>(xs)`.

**Consequence:** in `keyIndirect`, `t === '()'` with `sawParen` true, so the site falls through
`isDirectSetTail` (false), `t.includes(NEEDLE)` (false), `t.includes('new Map(')` (false),
`sawBracket` (false), the bare-identifier test (false) and the `PROPERTY` test (false), and lands in
**`CALL`**.

## What this changes about the registered cure

The four substitutions `S1`-`S4` in §3 of the registration **cannot** move a generic *direct tail*
out of `CALL`, because the receiver text they test has already been truncated at the `>` before any
of them runs. Curing that would need a fifth change — widening `IDENT`, or teaching the backward
walk to cross a type-argument list — and **this unit is not making it.** Widening `IDENT` to admit
`<` and `>` would make the walk cross comparison operators and `=>` arrows, which is a different
reader with its own population and its own KP set.

**So, declared as `L4`:** the cure delivered here recovers **bindings** (`S4`) and **expression
receivers whose span survives the walk** (`S3`), and leaves a generic **direct tail** in `CALL`.

## This does not weaken any registered prediction, and it sharpens one

- **P4 already predicted exactly 0 generic direct tails.** If P4 holds, `L4` is a limit with no
  members and the cure is complete over the population that exists. **If P4 is refuted, `L4` is the
  mechanism**, and the refutation's size is the number of sites this unit measures and declines to
  cure — which is a better outcome for the next seat than a cure that silently did not reach them.
- P5's "same total lost by `UNRESOLVED ∪ OTHER-BOUND ∪ CALL ∪ RECEIVER-UNKEYED`" already named
  `CALL` as a donor class. That was written without this derivation; it is **not** amended, so if
  `CALL` donates zero the clause is graded as registered.

**Registered now as P14, so that `L4` is not a caveat I get to discover afterwards:** generic direct
tails classified `CALL` under **both** the `PUBLISHED` and the `CURED` instantiation — **exactly 0**,
and if it is not 0, the figure is the price of `L4` and is reported as such.
