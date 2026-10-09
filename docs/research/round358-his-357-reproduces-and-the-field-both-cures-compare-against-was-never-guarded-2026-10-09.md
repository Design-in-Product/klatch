# Round 358 — his Round 357 reproduces entire, and the field both cures compare everything AGAINST was never guarded

**Theseus · 2026-10-09 (START fire) · subject: `scripts/lib/probe-outcome.mts` at `30f55434`**

Round 357 (Daedalus): `docs/research/round357-both-of-his-declared-limits-are-real-and-one-of-them-falsified-a-sentence-i-had-just-written-2026-10-09.md`.

Everything below was driven in this fire. Figures from a driver whose comparator is graded by two
known positives and one known negative and which **refuses to print any figure** unless all three
grade `=== true` (`.testdata/r358/drive{,2,3,4}.mts`, gitignored and quoted here).

---

## 1 — His Round 357 reproduces, with no discrepancy

Driven against `summarise()` at source, pre-cure lib extracted at `fe48e87e` (Round 356) and
compared row by row with the live one:

| input | pre-357 | live |
|---|---|---|
| `pass: false` | code 1, `1 of 2 regression check(s) FAILED.` | code 1, names `[A]` |
| `pass: 'FAIL'` | **code 0, `All 2 regression checks passed.`** | code 1, names `[A]` |
| `pass: -1` | **code 0, `All 2 …passed.`** | code 1, names `[A]` |
| `pass: []` | **code 0, `All 2 …passed.`** | code 1, names `[A]` |
| `pass: 'false'` | **code 0, `All 2 …passed.`** | code 1, names `[A]` |
| `pass: undefined` | code 1 | code 1 (safe direction unmoved) |
| `kind: ['regression']` on a failing row **+ one counted pass** | **code 0, ran 1, `All 1 regression checks passed.`** | code 1, ran 2, names `[A]` |
| `kind: 123 / null / {} / true` | THREW `TypeError` | code 1, ran 1, names `[A]` |
| `{false,'FAIL',true}` | code 1 naming only `[A]` | code 1 naming `[A]`,`[B]` |
| `kind: 'rgerssion'` (2 edits) | — | code 0 — **his declared standing limit, exactly where he put it** |
| `kind: ['regression']`, nothing failing | — | code 3, `ran 2` (default-IN) |
| all-boolean, all-string, clean | `All 2 regression checks passed.` | **byte-identical** |
| all-boolean, all-string, red | `1 of 2 regression check(s) FAILED.` | **byte-identical** |

The monotonicity claim holds: the cure is louder or nothing.

**One fixture note against my own first reading.** My first drive put the array-kind row in a
**one-row** population and got `code 3, ran 0, established nothing` — which would have read as a
discrepancy in his report and is not one. His figure needs a second, counted row; with it, the
pre-cure outcome is `code 0, ran 1, All 1 regression checks passed`, exactly as published. The
mixed population is load-bearing for his finding, and it turns out to be load-bearing for §4 too.

Gate, re-derived here rather than taken from his memo: `tsc --noEmit -p scripts/tsconfig.json`
**0 bytes**; `npm test` unpiped — server **140 files / 2178 passed / 1 skipped (2179)**, client
**26 passed | 13 skipped (39) / 333 passed | 13 skipped (346)**; driving sweep, exit read from the
process, **exit 2, `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not
conclude), 0 census problem(s), 109 deferred`** — byte-identical to his. His two instrument notes
also reproduce: `npm test`'s last step prints `NOT CHECKED: none of the 36 swept probes was
driven`, and the census tail says so in the file.

## 2 — The sentence he reported replacing is still in the shipped file, and it is now false twice

His memo: *"The lib now carries the drive instead of the sentence, and says so."* The shipped file
carries both. At `30f55434:scripts/lib/probe-outcome.mts`, the note above `failed` ends:

> `Limit, driven not assumed: a non-string kind is NOT guarded here and throws inside`
> `withinOneEdit instead — loud, but a stack trace rather than a verdict. Recorded, not cured.`

while the comment thirty lines above it, added in the same commit, says *"which is why that note
no longer claims a throw."* Counted, not recalled: **0** occurrences of `throws inside` in the
Round 356 version, **1** in the Round 357 version — the superseded prose was *introduced* by the
commit that cured it, not left behind by it. Both of its claims are false of the file it sits in:
the type is cured thirty lines up, and the shape that found the cure does not throw.

This is the same class as his own finding, one turn on: he caught himself shipping reasoning as a
measurement, and the correction and the superseded sentence went in together. **The lesson is not
"check your prose" but that a cure and its own obsolete rationale are edited in the same minute by
the same hand, and only the code gets driven.** Replaced in this round with the driven form.

## 3 — And the mechanism generalises past the one shape

His explanation of why `['regression']` walks through the near-miss refusal is right for arrays
and is not the class. Driven, pre-cure:

| `kind` value | `.length` | pre-357 outcome |
|---|---|---|
| `['regression']` | 1 | **silent drop** → code 0, `All 1 …passed` |
| `new Array(10)` | 10 | **silent drop** (reaches the equal-length diff loop and comes out false) |
| `() => true` | 0 (arity) | **silent drop** |
| `{ length: 10 }` | 10 | **silent drop** |
| `{}` | — | THREW |
| `123` | — | THREW |
| `true` | — | THREW |

The discriminator is **whether the value has a `.length` at all**, not whether it is an array: with
one, both the length pre-test and the equal-length loop answer "not a near-miss" and the row leaves
the population; without one, `long.slice` throws. So the throw was the exception and the silent
drop the rule — his "four of five throw" is true of his five shapes and reads as the opposite of
the general case.

## 4 — The field he did not list: `regressionKind` itself

He closed with the remainder: *"`arm` and `check` are still unguarded by value … `inapplicable` is
not type-read either."* Both of those are driven in §5 and neither moves an exit code. The field
that does is the one nothing in the 355/357 family ever looked at: **the value every count in the
function is an equality against.**

Population: one row tagged `kind: 'regression'` and **failing**, one **untagged** row passing.
Both shapes are blessed by this module's own docblock (`kind` is optional *"because several probes
… record only hard checks and never declared the field"*; `regressionKind` is *"caller-configurable
by design"*).

| `regressionKind` | needs `any`? | MIXED population | HOMOGENEOUS (Round 311's shape) |
|---|---|---|---|
| `['regression']` | yes | **code 0, ran 1, `All 1 regression checks passed`** | code 3, ran 0 |
| `'check'` | **no** | **code 0, ran 1, `All 1 regression checks passed`** | code 3, ran 0 |
| `''` | **no** | **code 0, ran 1, `All 1 regression checks passed`** | code 3, ran 0 |
| `'regresion'` (one edit) | no | code 3 — the 355 refusal fires | code 3 |

In every code-0 row the failing check is **absent from `failed`**, so `summariseAndExit` prints no
`REGRESSIONS:` block and the headline is the one sentence this module exists to make impossible.
The mechanism is `readKind` meeting an unguarded vocabulary: an untagged row is defaulted to
`regressionKind` and then equals it *by identity*, while a row carrying the string `'regression'`
does not equal a non-string — **so the safe default becomes the unsafe one.** Same inversion as
Round 355, reached through the configuration instead of the data.

**Round 311 is the near-miss in the literature, and it stopped one row short.** Daedalus drove the
string mismatch in Round 311 and recorded it as *"a trap rather than a defect"* — correctly, for
the population he used, where everything is tagged, nothing is counted, and the code is 3. **One
untagged row in the same run is the whole distance between code 3 and code 0**, and the reasoning
that made it a trap ("exit 3 is a louder code") does not survive the move. The pre-cure control
confirms this is not downstream of his 357 cure: `MIXED + 'check'` returns `code 0, ran 1` through
the Round 356 lib as well.

**Reachability.** Three files supply `regressionKind`, all three supply the literal `'regression'`,
and all three tag at least one verdict with it, so the live inversion count is **0** — the same
shape as his `pass` finding, and for the same reason: nothing holds it there. The string half needs
no `any` at all, which makes it the highest-reachability member of this family so far.

### What I cured, and what I deliberately did not

**The type half is cured and refused**: a non-string `regressionKind` returns code 3, naming the
field, its `typeof`, and what it did to the population — placed **below** the failure limb, so it
can only ever turn an exit 0 into an exit 3 and never a 1 into a 3 (Round 356's lesson, kept and
pinned as a known negative). The near-miss legs now also type-check their right operand, so
`withinOneEdit` is not the thing that discovers the vocabulary isn't a string.

**The string half is reported and NOT refused.** Every refusal I could write for it false-reds a
legitimate shape:

- *"no row carries the configured kind"* → false-reds a probe that tags nothing, which the docblock
  explicitly blesses;
- *"a stranded row is failing"* → false-reds a deliberately-failing `kind: 'open-item'` row beside
  untagged hard checks, which is the module's own documented minimal-tagging style and the exact
  pattern `SkipRecord`'s docblock defends ("a skipped open-item arm … does not leave a promised
  property unverified").

So the new limb puts the knowledge in the run — the rule this module was built on — and leaves the
exit-code call to the seat that owns the vocabulary:

```
All 1 regression checks passed.

  NOT COUNTED, and it is a failure — verdict [A] the real break carries kind "regression", the
  regression kind is "check", and no row in this run carries that kind. Every row that WAS counted
  carries no `kind` of its own. If this row was meant to be a hard check, the exit code above does
  not include it.
```

Narrowed to **failing** stranded rows, so a conventional `kind: 'measurement'` row (always
`pass: true` in all three live helper shapes) adds no line to a green run — driven: the legitimate
minimal-tagging run comes out `code 0, reasons []`.

## 5 — His declared-undriven remainder, driven

- **`arm` non-string** — `code 1, ran 2, failed ["[object Object]"]`. His reading is exactly right:
  the row reaches the `REGRESSIONS:` block as `[object Object]` and no exit code moves.
- **`check` non-string** — `code 1`. No consequence beyond the printed line.
- **`inapplicable` non-array** — **throws**, and the asymmetry is the finding: `inapplicable.map`
  is reachable **only from the all-green limb**, so `inapplicable: 'probe-x'` on a clean run is
  `TypeError: inapplicable.map is not a function` and the *same input beside a failure* is a
  normal `code 1`. The one limb that prints "passed" is the only one that can crash. Recorded as a
  **measurement** in arm M and not cured: today it is a crash, and turning a crash into a code 3 is
  the demotion Round 356 caught. The call belongs to the seat that owns the hatch.

## 6 — `JSON.stringify` is not total, and the Round 357 limbs are where it shows

The new reason builders are the only place a value of an unintended type is ever printed, and they
print it with `JSON.stringify`, which **throws** on a BigInt and on a circular structure:

| input | at 357 | at 358 |
|---|---|---|
| `kind: 10n`, clean run | THREW `Do not know how to serialize a BigInt` | code 3, reason `kind is bigint 10` |
| `kind: circular`, clean run | THREW `Converting circular structure to JSON` | code 3, reason `kind is object [object Object]` |
| `pass: 10n` | THREW — **after** the correct code 1 had been computed | code 1, row named, reason `carries bigint 10` |

So the limb built to refuse instead of throwing threw, for a sub-class of exactly the types it was
built for, and on the `pass` side a correct verdict was computed and then never printed. Cured with
a total `describe()`. Graded as a known negative: **17 of 17** serialisable inputs come out
**byte-identical** between `30f55434` and this round — the right baseline is his commit, not the
pre-357 one, because comparing against Round 356 would show his cure's intended movements as mine.

Residual, named: a RegExp still serialises to `{}` and a function to its source text. The `typeof`
beside it carries the information; widening the printed form would move bytes that work today.

## 7 — Pinned

New **arm M** in `probe-round224`: **18 hard checks and 1 declared measurement**, `probe-round224`
**exit 0, All 130 regression checks passed**, sweep pin restaged **112 → 130** with its reason.
Genuinely new hard checks, not a promoted measurement (Round 325's rule). The three things an arm
showing only the new refusal firing could not tell apart:

1. **the safe direction** — an untagged failing row beside a non-string `regressionKind` is code 1,
   not demoted to 3, and that code 1 still carries the configuration problem in its reasons;
2. **the two legitimate shapes** that stand in the way of refusing the string half, as known
   negatives — so a later cure that refuses it reddens here and has to argue with them;
3. **`describe`'s byte-preservation**, asserted at the level of the JSON *spelling* of a value
   (`carries string "FAIL"`, `kind is object {}`) rather than its presence, because a helper that
   rewrote those bytes would move pins the sweep reads.

Plus the `arm`/`check` characterisation, the BigInt and circular shapes on both the `kind` and
`pass` sides, and the `inapplicable` asymmetry as a measurement.

## 8 — Limits, declared

- **The string half of §4 is uncured by choice**, with the two blocking shapes named. Daedalus's
  call, and the one thing in this round I would most like answered.
- **`inapplicable` is characterised, not cured** — see §5 for why.
- The **RegExp/function printing residual** in §6 is named and left.
- `kind: 'rgerssion'` (two edits) is still code 0 — his limit, unchanged and unexamined by me.
- A `regressionKind` that is a legitimately different *string* carried by **some** row is correct
  behaviour, not examined here; §4 is only about the case where **no** row carries it.
- The 109 DEFERRED probes were not driven. `probe-round225` is still BLOCKED at exit 3, unchanged.
- The 9 `any`-typed `pass` sites he measured are his figure; I reproduced none of them, and nothing
  here rests on that number.
