# unit-466striplift — pre-registration C

**Seat:** Theseus · **Date:** 2026-11-15 (START fire, same fire as arms A and B) · **Pin:** `70e58f2a`
**Arm B's recording is frozen at `a3c58818`** (read back off `git log origin/main` after the push).
This file is pushed **before `arm-striplift-c.mjs` exists**.

## Why there is a C: arm B published a refutation that is arm B's own bug

Arm B exists to cure arm A's "right verdict, false reason" defect. **Arm B reproduced that exact
defect one level down, and then published a refutation of arm A's headline on the back of it.**

`drive2.armb.out` reports `Q3 REFUTED` — `LOSSY_BASENAME = 20 of 44 = 45.5%` against arm A's
published `31 of 54 = 57.4%`. Read alone, that says *arm A's majority claim was carried by its
proxy's errors*. **It says no such thing.** `Q3`'s denominator comes from `Q2`'s 15 exclusions, and
those exclusions come from a token extractor that captures a **bare `$` from the template-literal
`${` sigil**:

```
round410-instruments/census-the-wrapped-call-and-the-body-granularity.mjs:451
  params=["r"] tokRoots=["$"]
  + WRAPPED.map((r) => `${r.path.split('/').pop()}:${r.line} …`).join(' | '));
```

`$` is a legal JS identifier start, so `[A-Za-z_$]` matches the sigil, the lazy `[^)]*?` bridges
`{r.path`, and the extractor reports the stripped token as `$`. `$` is not a callback parameter, so
`K-strip2` excluded the site — and nearly every publication site in this corpus is inside a
template literal.

Tabulated out of arm B's own recording (`grep -o 'tokRoots=\[[^]]*\]' | sort | uniq -c`):

| captured root | count | sound? |
|---|---|---|
| `["$"]` | 26 | no — sigil |
| `["$","$"]` | 2 | no — sigil |
| `["round$"]` | 2 | no — sigil (`round${p.round}`) |
| `["in"]` | 2 | no — wrong identifier, bridged from `leg(s) in ${KP_G…` |
| `["anchor"]` | 2 | no — wrong identifier |
| `["r"]` | 3 | yes |
| `["o"]` | 1 | yes |

**4 of 38 printed token-root sets are sound.** So:

- **`Q2` is VOID.** Its 15 "further exclusions" are the sigil defect, not the
  co-located-but-unrelated shape it claims to have found.
- **`Q3` is VOID.** Its 45.5% is computed over a denominator the defect produced. **Arm A's `P1`
  is not refuted and this unit does not claim it is.**
- **`Q1`'s one disagreement** (`round411…:628`, `tokRoots=["$"]`) is the same defect, so `K-strip2`
  agrees with the hand read on 6 of 6 once the sigil is handled — to be measured, not assumed.
- **And `K-strip2`'s one *agreeing* exclusion is itself false-reasoned**: it classed
  `unit-464class/enumerate-legs.mjs:275` `NOT_A_MEMBER_PATH` off `tokRoots=["in"]`. The verdict
  matches hand; the token does not exist. Arm A got that site right for a false reason, arm B
  "cured" it and got it right for a *different* false reason.

That is the finding, and it is about me, not the corpus: **a cure written against "right verdict,
false reason" can satisfy its own grading leg while reproducing the defect, because the leg is keyed
on the verdict and the reason is a string nobody re-derives.** The only thing that caught it was
printing the token roots next to the parameters and reading them.

## The cure — `K-strip3`

Two changes, both to token extraction only. The site key (`<ident>.map(` + a strip spelling) is
untouched, so the 60-member population cannot move; `C1` asserts that it does not.

1. **Normalise the sigil before extracting.** Replace every `${` with two spaces in a working copy
   of the line. Column positions are preserved and no identifier is altered.
2. **Anchor the receiver.** Drop the lazy `[^)]*?` bridge; accept only two shapes — the identifier
   *immediately* before the strip call, or a parenthesised receiver `(<ident>…)` immediately before
   it. The bridge is what let `in` and `anchor` be captured from text unrelated to the strip.

## Predictions

- **`R1`** — under `K-strip3`, **zero** extracted token roots are `$`, `round$`, or otherwise
  non-identifier. Measured over all 60 sites, printed as a tally like the one above.
- **`R2`** — `K-strip3` agrees with the hand read on **6 of 6** residue sites (arm B managed 5 of 6,
  arm A's proxy 1 of 6).
- **`R3`** — `Q2` collapses: `K-strip3` excludes **≤3** of arm A's 54 positives, against arm B's 15.
  If it excludes 0, the co-located-but-unrelated shape is unique to `enumerate-legs.mjs:275` and
  `Q2` was false as well as void.
- **`R4`** — **arm A's `P1` headline is restored**: `LOSSY_BASENAME` ≥50% of member-path sites under
  `K-strip3` + the hand map. This is the prediction that matters, because arm B published the
  opposite and the published figure must be corrected by a measurement, not by a retraction.
- **`R5`** — `enumerate-legs.mjs:275` is still excluded, now for the **right** reason: its token
  roots under `K-strip3` are real identifiers and none of them is a `.map(` callback parameter.

## Declared limits

1. **`K-strip3` is still a single-line regex and still has no scope analysis.** A callback parameter
   shadowed by an outer binding of the same name would be mis-attributed. **Reach to be measured**
   (`C-lim1`): count of sites whose strip-token root matches a `.map(` parameter name that is *also*
   declared at module level in the same file — printed, not assumed empty.
2. **The hand map still covers 6 of 60 (10%).** `K-strip3` is a third key over the same 54, and
   three keys agreeing is still not a hand read. `R3`'s exclusions are hand-sliced in `RESULTS.md`;
   the remaining positives are not.
3. **`R4` restores a figure; it does not validate arm A's proxy.** Arm A's proxy was wrong on 5 of
   6 residue sites regardless of what `K-strip3` says about the other 54. A restored headline and a
   sound key are different claims and this unit makes only the first.

## Housekeeping

- Arm C reads arm B's recording frozen at `a3c58818` via `git show`, and re-derives live from `PIN`,
  as separate legs.
- Arms A and B stand verbatim, recordings included. Nothing is rewritten.
- `C-gate`: `git status --porcelain packages scripts docs/research/lib` empty.
