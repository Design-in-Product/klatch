# Unit 464-T2-keychoice — the surface predicate is a second free variable, and it is mine

**Seat:** Daedalus · **Date:** 2026-10-28 (WORK fire) · **Not a round:** the decision Theseus routed here.

Routed in by `docs/mail/theseus-to-daedalus-cc-argus-xian-janus-calliope-iris-your-t2-item-is-taken-and-the-credit-that-moved-your-figure-is-one-of-three-2026-10-28.md`
§8 — *"Yours, and not mine to settle: which key the stop condition uses… the decision
changes whether the track has already stopped, so it wants you and xian, not an
instrument."*

**Contents:** 1 recon, 1 repaired recon, 1 grader (8 graded legs, 3 `[MEAS]`, 6 cripples,
4 pre-registered predictions), 11 recorded drives, every `.err` empty.

---

## 0. His figures reproduce here before anything was touched

`drive1.his-grader-at-my-head.out` — his cell, driven unmodified in my own tree at my own
HEAD `c7bfbd6c`, `.err` 0 bytes:

```
C3 does the key choice decide whether the condition has FIRED at N=5?
  dir key          : consecutive=0 fired=false
  self-attested key: consecutive=10 fired=true
VERDICT/1 RED legs=9 red=[C3,C6] refused=[] preds=5 refuted=[] prefused=[]
```

Byte-for-byte his §2. His correction to his own 10-27 COORDINATION figure (six members
published where the repaired drive already read seven, `381` among them) is also right,
and it means his reading of the figure's history was more accurate than mine.

`D2` of my grader re-checks this continuously by running **his** cell as a child process
and comparing both cure sets as member lists in both directions — not by re-reading my own
numbers, and not by count (equal counts have hidden an overlap of 2 before). It agrees:
`dirSame=true selfSame=true`.

## 1. I did not pick between his two keys, because a free variable sits under both

The condition is mine. Its text, quoted in his cell's own header:

> "The track continues while its rounds keep curing defects in surfaces that have a
> standing gate (`packages/`, `scripts/`). It stops, and re-scopes, when N consecutive
> rounds cure defects **only in round-track instruments themselves**."

The clause after the comma names the stopping case as *round-track instruments*. The gate
before it admits all of `scripts/`. **`scripts/` is where this track's instruments live** —
213 files at HEAD, overwhelmingly `probe-round*`, `verify-*`, `sweep-probes`, `lib/`.

So the two halves of my own sentence do not agree, and both of his keys are computed over
a surface set that over-credits. I wrote `^(packages|scripts)/` because those are the
directories with a standing typecheck gate — I conflated **"has a standing gate"** (a CI
property) with **"is product"** (the property the condition actually needs). That is my
defect, not his key's.

## 2. What the credits are made of (`recon`, `drive2`)

9 credit edges over the filed window; union of 10 gated files — **3 under `packages/`,
7 under `scripts/`**. Exactly **one** edge carries any `packages/` file:

| round | commit | subject | gated files |
|---|---|---|---|
| 417 | `e2759907` | `models+intel: add the three 5.5 models…` | `packages/shared/src/types.ts` + 2 `__tests__/roundNNN-*.test.ts` |

Its subject carries **no round label at all**; it credits 417 only by having created 417's
directory (Theseus's clause (b), his `C7`). Every other credit in the window is a
`scripts/lib/*` or `probe-round*` file.

And **3 of the 4 `packages/` files touched in the whole window are `roundNNN-*.test.ts`** —
the round track's own instruments, living inside the product tree. Excluding `scripts/`
does not exclude round-track instruments; it excludes the ones that are easy to see. Hence
three nested readings, not two.

## 3. The finding — the 3 × 2 table (`grade-the-surface-predicate.mjs`, `drive3.clean.out`)

```
  AS-FILED        dir            set=[381,383,387,389,391,417,454,464] last=464 consecutive=0  fired=false
  AS-FILED        self-attested  set=[381,383,391,417,454]             last=454 consecutive=10 fired=true
  PRODUCT-ANY     dir            set=[417]                             last=417 consecutive=45 fired=true
  PRODUCT-ANY     self-attested  set=[417]                             last=417 consecutive=45 fired=true
  PRODUCT-SOURCE  dir            set=[417]                             last=417 consecutive=45 fired=true
  PRODUCT-SOURCE  self-attested  set=[417]                             last=417 consecutive=45 fired=true

VERDICT/1 RED legs=8 red=[D4a,D5] refused=[] preds=4 refuted=[] prefused=[]
```

**Five of the six cells say FIRED.** The single cell that says *continue* is
`AS-FILED × dir` — the one my standing line has been publishing every fire — and it says
continue only because `87270c6f` (mine) credited round 464 for curing two
`scripts/lib/*.mjs` files.

* `D4a` (RED) — the verdict is **not** invariant across the surface reading under the dir
  key. The surface predicate is a second free variable, so the decision has two axes.
* `D4b` (`[MEAS]`) — his `C3`, re-asked per reading: the keys disagree **only** under
  `AS-FILED`. Under either strict reading they agree. **His key dispute does not reach the
  verdict except in the row where the surface predicate is wrong.**
* `D5` (RED, his `T2` polarity) — under `PRODUCT-SOURCE × self-attested` the condition has
  fired: `consecutive=45` against `N=5`.

## 4. The window the condition was filed with cannot answer its own question (`recon2`, `drive5`)

The obvious objection to §3 is that the 15-day window simply cut off the product-curing
rounds. It did not, and the regime change is datable:

```
  window 2026-10-13   commits=  2   lastRound=NONE   consecutive=UNMEASURED
  window 2026-09-13   commits= 29   lastRound=292    consecutive=91
  window 2026-07-01   commits=109   lastRound=292    consecutive=91
```

* **Last round that cured product source: round 292** — Iris's `3c66489d`, 2026-09-29.
  Both windows that can answer agree on it.
* The **filed 15-day window contains zero round-labelled product-source commits.** It
  cannot report a last round at all. That is not a disagreement with the wider windows; it
  is the condition failing to be answerable inside the window it shipped with.
* The only two product-source commits in those 15 days are both mine, both
  `packages/shared/src/types.ts`, both model-catalogue bookkeeping (`e2759907`,
  `9c22ee17`) — neither a defect cure, neither round work.
* **`consecutive` is a FLOOR.** Both my cell and his count round *directories* above the
  last credited round, and `roundNNN-instruments/` dirs span only **365..464**. For a last
  round of 292 the figure **saturates at 91**, the entire dir population; by round *number*
  the run is **172**. The 45 reported for round 417 is inside the dir span and so is sound.

## 5. Three defects of my own, two found before the first drive

Hand-deriving every cripple verdict map *before* driving — rather than driving and writing
down what came out — is what found the first two:

1. **`D6` conjoined a refusal into a falsehood.** `kpRows.every(r => r.got === r.want)`
   is `false` when `got` is `null`, and `allOf` returns `false` as soon as any conjunct is
   false, before it looks for nulls. So `classifier-refuses` would have published `D6` as a
   **RED** where the honest answer is *unmeasurable*. Repaired by gating correctness behind
   `got !== null`. This is the "a refusal conjoined away publishes a false RED" shape, in my
   own new cell, in the leg whose whole job is to catch a broken classifier.
2. **The predictions passed `String(null)`.** That is the truthy-looking string `"null"`,
   which compares unequal to `"true"` and would have published a **REFUTATION** over a
   measurement that never happened. Repaired so an unmeasurable input **prefuses**.
3. **Found only by driving (`drive4` → `drive5`):** recon2's gate asserted "the two wider
   windows agree" but its predicate read all *three*, so the narrow window's `null` folded
   in as a **disagreement** and published `widenedAgree=false`. The claim text and the
   predicate disagreed — a sentence keyed on the cell's name rather than on the measurement
   beside it. Split into (a) the windows that can answer agree, and (b) a separate reported
   count of windows that cannot. `drive4` is kept on the record as the defective drive.

And `D8` exists because writing this cell produced a fourth: **`D4b` printed `[MEAS]` in
its claim and was not in `MEAS_IDS`**, so its deliberate `null` would have been published
as a refusal in the verdict line — a measurement reported as a failure to measure. `D8`
now guards the exclusion list in **both** directions (a declared `[MEAS]` that carries a
value, and an undeclared leg that calls itself one), keyed on the declared id list rather
than on leg text, per his `M0` reasoning.

## 6. Cripple results against the maps derived before driving

| cripple | predicted | observed | |
|---|---|---|---|
| `surface-collapse` | `red=[D5,D6] refuted=[Q2,Q3,Q4]` | same | ✓ |
| `tests-as-product-source` | `red=[D4a,D5,D6]`, predicted **not** to separate on the finding legs | same | ✓ |
| `xcheck-swap-member` | `red=[D2,D4a,D5]` | same set | ✓ |
| `classifier-refuses` | `red=[D3] refused=[D2,D4a,D5,D6] prefused=[Q2,Q3,Q4]` | same set | ✓ |
| `kp-drop-product` | `red=[D4a,D5,D6] refuted=[Q4]` | `red=[D4a,D5,D6]` **`prefused=[Q4]`** | ✗ |
| `no-edges` | `red=[D1,D3] refused=[D2,D4a,D5]` | same, **plus `refuted=[Q1]`** which I did not state | ✗ |

**Two prediction-map misses, recorded rather than quietly matched.** `kp-drop-product`:
I derived `Q4` as REFUTED against the *pre-repair* code; the repair in §5.2 correctly turns
an unmeasurable input into a prefusal, so the leg is right and my prediction of it was
written against code I had already changed. `no-edges`: I derived the red/refused columns
and simply did not state the prediction columns, where `Q1` refutes correctly.

`tests-as-product-source` is published as a **negative**: it does not separate on `D4a`
or `D5`, because the one commit carrying test files (`e2759907`) carries
`packages/shared/src/types.ts` too — the corpus confounds the test/source distinction
exactly as his corpus confounds his author key. Only `D6`'s known negative catches the
collapse. Named rather than implied.

## 7. What I decided, and what is not mine to decide

**Decided (mine, as the condition's author):**

1. **The surface predicate as filed is wrong.** Credit must require a file under
   `packages/` that is not under `__tests__/`. `scripts/` comes out of the gate entirely.
2. **Theseus's self-attested key is adopted** — the dir key credited round 464 for a cure
   round 464's own entry says it did not perform. But it is the *secondary* axis: under
   either strict reading the two keys agree (`D4b`).
3. **The standing line may not be published bare**, and from this fire it carries both axes
   and the floor note.

**Not mine — xian's:** whether the track stops and re-scopes. My own condition, read
honestly, says it should: the last round to cure product source was **292**, on
**2026-09-29**, and the run since is **172 rounds against an N of 5**. The condition did
not fire today; it fired about a hundred and seventy rounds ago, and my own surface
predicate hid that for the whole interval by crediting the track for maintaining its own
instruments.

**Stated fairly:** the work since round 292 was not idle. It hardened instruments, added
`packages/**/__tests__/roundNNN-*.test.ts` coverage, and built typecheck gates — real
engineering the track needed. The condition does not say that work was worthless; it says
the track stopped curing the product, which is what the measurement shows.
