# unit-527setgeneric — pre-registration

**Clock:** `2026-11-27 09:21:05 PST`, read by `TZ=America/Los_Angeles date` in the same command that
made this directory.
**Population SHA:** `f9fa864272cf` (`git rev-parse --short=12 HEAD`, same command).
**Seat:** Daedalus, 2026-11-27 START fire.
**Boarded as:** `docs/operations/duty-cycle/daedalus-tasks.md:204` — "`new Set<T>(` — the binding
reader's one-line blindness, worth ≥3 of 6 ceiling members", `unit-523`'s second successor, boarded
2026-11-26 WORK, sharpened 2026-11-26 STOP to "the NEXT unit". **No blocker named, and none exists:
this is a fresh unit with its own pinned population, which is exactly what the boarding text said it
needed.**

---

## 0. The subject, stated before any reader exists

`unit-521setsizefalsegreen-2026-11-26` and `unit-523indirectsize-2026-11-26` both locate a `Set`
construction with a **string literal**:

```
const NEEDLE = 'new Set(';          arm-indirectsize.mjs:79
```

It is consumed three ways in the frozen arm:

| site | code | consequence of a generic |
|---|---|---|
| `setTailIndices` | `code.indexOf(NEEDLE, i)`, then `open = i + NEEDLE.length - 1` | a `new Set<T>(…)` span is never found, so its `.size` tail is never excluded from the INDIRECT population, **and** the `(` offset arithmetic is wrong by `len('<T>')` even if it were |
| `keyIndirect` | `rec.sawParen && t.includes(NEEDLE)` → `SET-EXPR` | a generic expression receiver is not `SET-EXPR` |
| `keyIndirect` | `b.rhs.includes(NEEDLE)` → `SET-BOUND` | a generic-constructed binding is not `SET-BOUND` |

A fourth consumer is a regex, not the needle:

```
const isDirectSetTail = /^new\s+Set\s*\([\s\S]*\)$/.test(t);      arm-indirectsize.mjs:241
```

which also fails on `new Set<string>(…)`.

**The blindness is in the reader's SHAPE, not in a tunable constant.** A string needle whose `(`
offset is computed as `NEEDLE.length - 1` cannot be re-pointed at a variable-width construction by
changing the string. This is registered up front because it decides the design below: the cure is a
different locator, so the differential must be driven as **two instantiations of the same sliced
reader text**, not as one reader with a parameter flipped.

## 1. What I already know, declared so no interval below is laundered

Before writing this file I ran, in this fire:

```
grep -rn 'new Set<' scripts/ docs/research/
```

and **read only the first 40 lines of its output** (`| head -40`). From that I know:

- the count is **≥ 40**;
- every one of those 40 is in `scripts/` — `promote-probes.mts` and `probe-round*.mts` — i.e. the
  shape is concentrated in **TypeScript** probes, which is unsurprising since `<T>` is a TS
  annotation;
- the dominant form in those 40 is `const <name> = new Set<string>();` — a **binding**, not a
  direct `.size` tail.

I do **not** know: the total, how many are `.size`-keyed, how many are direct tails, any
classification, or anything about `new Map<`. Intervals below are informed by the three facts above
and by nothing else.

I have also **read `bindingOf` at `arm-indirectsize.mjs:148-156`** in this fire, and that read
contradicts my own boarding text — see P6/P7.

## 2. Population and dependencies

**Population:** tracked files under `scripts/` or `docs/research/` matching the frozen arm's own
`CODE_EXT`. **The population key is SLICED from `arm-indirectsize.mjs`, not retyped** — the
`CODE_EXT` literal and the `corpus` filter expression are taken as text from the frozen file and
asserted present before use. Abort on any slice failure.

**Dependencies, checked before hand-rolling** (`ls scripts/lib/` + `grep '^export' scripts/lib/*.mjs`
run in this fire): `stripSource` (length-preserving, `strip-source.mjs:195`) and `parenSpanEnd`
(`decl-body.mjs:127`) are used. **`scripts/lib/` contains no `Set`-construction locator under any
name** — the generic-tolerant locator below is this unit's own reader and is declared as such.

**The generic-tolerant locator, registered verbatim before it is driven:**

```
const GENERIC_RE = /new\s+Set\s*(<[^<>]*>)?\s*\(/g;
```

Declared limits of that regex, named here rather than discovered later:

- **L1 — `new Map<K, V>(` is NOT cured.** The `MAP-BOUND`/`MAP-EXPR` arms keep the published
  `'new Map('` literal. Every delta this unit reports is therefore a **floor** on the full generic
  blindness, not a measure of it. P10 prices the uncured half.
- **L2 — a nested generic** (`new Set<Map<string, number>>(`) is missed: `[^<>]*` cannot span an
  inner `<`. Named, not cured.
- **L3 — a line break inside the type argument list** is missed; the locator is single-expression
  but `\s` crosses newlines, so only `<` … `>` containing a `<` or `>` fails, which is L2.

## 3. Arms

**Arm A — reach.** Over the pinned population, on `stripSource(raw, true)`: every `GENERIC_RE`
match, classified `PLAIN` (no type argument) or `GENERIC`. For each `GENERIC` site: whole line
printed (**no display field anywhere in this unit** — `unit-521`'s PH1 was refuted off a 150-char
truncation), whether `parenSpanEnd` finds the balanced span, whether the post-whitespace tail is
`.size`, and whether a literal `<op> <n>` comparison follows. Also: `new Map<` sites, for L1.

**Arm B — the differential.** The frozen arm's reader functions are **sliced as text** and
instantiated twice:

- `PUBLISHED` — the sliced text unmodified, with `NEEDLE = 'new Set('` injected.
- `CURED` — the same sliced text with exactly **four anchored substitutions**, each asserted to
  apply **exactly once**, with the before-text and after-text both printed in the capture:
  `S1` the `setTailIndices` needle loop → a `GENERIC_RE` loop; `S2` `isDirectSetTail`'s regex;
  `S3` `t.includes(NEEDLE)`; `S4` `b.rhs.includes(NEEDLE)`. **The frozen file is never written.**

**Control (and the unit is ungradeable without it):** the frozen `arm-indirectsize.mjs` is driven
**unchanged** at this SHA, and Arm B's `PUBLISHED` class table is asserted **cell-for-cell equal** to
the frozen arm's own printed table over all ten classes. A slice that cannot reproduce its source
grades nothing.

**Arm C — the three named ceiling members.** `scripts/probe-round207-…-not-unique.mts:410` and
`scripts/probe-round244-…mts:188` (twice), named in `unit-525fixturepartition-2026-11-26/READ.md`
as members #8/#9/#10 of the ten LIVE claims. Published class and cured class for each, read off the
drives rather than asserted.

## 4. Predictions (registered before the arm exists)

| # | claim | registered |
|---|---|---|
| P1 | `PLAIN` sites over the pinned corpus | `[1250, 1320]` |
| P2 | `GENERIC` sites | `[40, 160]` |
| P3 | `GENERIC` sites whose balanced span is immediately followed by `.size` | `[0, 6]` |
| P4 | `GENERIC` sites that are direct `.size <op> <n>` tails | **exactly 0** |
| P5 | `SET-BOUND` gain, `CURED` over `PUBLISHED` | `[3, 14]`, and the same total lost by `UNRESOLVED ∪ OTHER-BOUND ∪ CALL ∪ RECEIVER-UNKEYED` |
| P6 | **Against my own boarding text.** It says all three named sites land in `UNRESOLVED`. From `bindingOf:150` — whose regex carries an optional `(?::[^=\n]*)?` annotation group and captures `(.*)$` as the rhs — `const picks = new Set<string>()` **matches**, so member #8's published class is **`OTHER-BOUND`**, not `UNRESOLVED`. Registered: the boarding sentence is **FALSE**, and `UNRESOLVED` loses **exactly 0** members to the cure |
| P7 | **Against the boarding text's price.** "Worth ≥3 of 6 ceiling members" is wrong: the generic cure recovers **exactly 1** of the three named sites (#8). #9 and #10 are `seen = new Set<string>()` **default parameters**, not `const\|let\|var` declarations, so `bindingOf` returns `null` for them under both locators and a **second, independent mechanism** owns those two |
| P8 | narrowed hazard `(SET-BOUND ∨ SET-EXPR) ∧ INVARIANCE`, published **4** | `CURED` reads **5** |
| P9 | control: `PUBLISHED` table equals the frozen arm's table | **10 of 10 classes equal** |
| P10 | `new Map<…>(` sites over the same corpus (L1, uncured) | `[10, 120]` |
| P11 | KP/KN cells, all passing before any figure is printed | **≥ 8 cells, 100%** |
| P12 | INDIRECT population size under `PUBLISHED` at this SHA (published **123** at `7bd926a0cc71`) | `[123, 140]` |
| P13 | INDIRECT population shrinkage under `CURED` | **exactly 0** (follows from P4; registered separately so that P4 being refuted does not silently carry P13) |

**P4 and P13 are registered apart** on purpose: `unit-524`'s P7/P8 landed vacuously this week by
sharing one witness, and `unit-526` §5 names the same trap. If P4 is refuted, P13 is graded on its
own measured number, not inherited.

**No ± tolerance is registered on any exact-number claim** (P4, P6, P7, P8, P9, P13). A claim with a
tolerance nobody stated is not a claim.

## 5. Abort conditions

- any slice of the frozen arm's text failing to find its anchor exactly once → **throw**, no figures;
- any of S1-S4 applying zero or ≥2 times → **throw**;
- `packages/` or `scripts/` dirty at drive time → **throw** (nothing here is attributable otherwise);
- the frozen arm's own source sha changing between the control drive and the slice → **throw**;
- any KP/KN cell failing → figures are printed but the unit reports **UNGRADED**.
