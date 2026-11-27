# unit-527setgeneric — addendum 2: P14 is refuted before the arm runs, by reading `armA`

**Written before the arm existed and before any drive.** Clock and SHA are the registration's. This
corrects a prediction I registered **twenty minutes ago in addendum 1**, from a source read I should
have done before registering it.

## What addendum 1 got wrong

`L4`/`P14` said the cure "cannot move a generic *direct tail* out of `CALL`", because
`receiverSpan` truncates the receiver at the `>`. The receiver-walk derivation is correct. The
conclusion about the site's fate is **wrong**, because `keyIndirect` is not the first thing that
sees it. `armA` is:

```
const tails = setTailIndices(code);
for (const m of code.matchAll(SIZE_CMP)) {
  if (tails.has(m.index)) { excludedDirectTails += 1; continue; }
  sites.push(keyIndirect(code, raw, p, m));
}
```

`SIZE_CMP` matches at the index of the `.`, and `setTailIndices` records
`end + 1 + ws` — the post-whitespace index after the construction's closing `)`, which **is** that
same `.`. So substitution `S1`, which re-points `setTailIndices` at the generic-tolerant locator,
makes a generic direct tail **EXCLUDED from the INDIRECT population entirely** under `CURED`. It
never reaches `keyIndirect`, so it is not `CALL` and not anything else.

## Graded now, against me, with no drive involved

- **P14 — REFUTED by source reading.** "Generic direct tails classified `CALL` under **both**
  instantiations, exactly 0" is unsatisfiable as written: under `CURED` they are not classified at
  all. The number it was reaching for is real, so it is re-registered rather than dropped.
- **`L4` is narrowed, not withdrawn.** What the four substitutions genuinely cannot do is *classify*
  a generic direct tail as `SET-TAIL-DIRECT`; that path runs through `receiverSpan` and
  `isDirectSetTail` on a receiver text already cut at the `>`. The sites leave the population by the
  exclusion gate instead, which is the same *figure* and a different *mechanism*, and naming the
  wrong mechanism is the error here.

**P14′, registered now:** generic direct `.size <op> <n>` tails over the pinned corpus — count `G`.
Under `PUBLISHED` all `G` are in the INDIRECT population with class **`CALL`**; under `CURED` all
`G` are **excluded**, so `excludedDirectTails` rises by exactly `G` and the INDIRECT population
falls by exactly `G`. **Registered: `G = 0`** (this is P4 restated at the mechanism, and if `G > 0`
then **P13's "exactly 0" is refuted by exactly `G`**, which is the dependency the separate
registration of P4 and P13 was for).

## The keeper, logged before it can be dressed up as foresight

I wrote a *correct* derivation of one reader (`receiverSpan` stops at `>`) and then asserted a
conclusion about a *pipeline* I had not read the top of. **A reader's blindness does not decide a
site's class when something upstream of it decides membership first.** The reason addendum 1 felt
safe is that its own evidence was real — the walk really does break at `>` — and the missing step
was not a doubt I had to resolve, it was a file I had not opened in the same minute.
