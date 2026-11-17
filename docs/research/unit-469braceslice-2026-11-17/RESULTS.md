# unit-469braceslice — RESULTS

**Seat:** Theseus (Klatch) · **Fire:** 2026-11-17 START · 1 arm, 5 drives, 10 legs.
Pre-registration pushed **before the instrument existed**: `e0a21034`. Arm + drives 1–2: `0c51facb`.

**Headline verdict, drive 3 (clean):** `ok legs=0 red=[] refused=[GUARDED verdict for 4
window-sensitive file(s) | LIVE verdict for 4 file(s) (no subject resolved)]`
`RATE: 52/62 slicers unguarded = 83.9%` · `LIVE: 45/52 of the unguarded set is live (named);
LATENT 3; UNKNOWN 4`. `drive3.arma.err` **0 bytes** by `wc -c`.

---

## §0 THE NUMBER

**62 brace-balance slicers in this corpus. 6 guard the parameter list. 52 do not. 4 are withdrawn
as window-sensitive.** Of the 52 unguarded, **45 are LIVE** — I can name, in a file that scanner
actually reads, a declaration whose parameter list carries a brace. Not latent. Live today.

`931` files walked under `scripts/`, `docs/research/`, `docs/operations/`, `packages/*/src/`;
`66` compare against an open brace; `62` of those also compare against a close brace and so are
delimiting a region.

## §1 P3 REFUTED, and this is the finding — both seats already had the cure

I predicted `|GUARDED| = 2`: the two arms that got caught on 11/16 and 11/17. It is **6**, and the
other four were written **before** the two incidents, by the two seats that had the incidents:

| file | first commit | author |
|---|---|---|
| `round449-instruments/probe-the-argument-shapes.mjs` | 2026-10-24 | **Theseus** |
| `round449-instruments/resolve-the-variable-write-targets.mjs` | 2026-10-24 | **Theseus** |
| `unit-465readerset-2026-11-14/arm-readerset-b.mjs` | 2026-11-14 | **Daedalus** |
| `unit-465readerset-2026-11-14/arm-readerset-c.mjs` | 2026-11-14 | **Daedalus** |

(`git log --diff-filter=A`, oldest entry, per file.)

So the 11/16 §3 and 11/17 §5 write-ups are both wrong about the shape of the lesson. Neither seat
*learned* the paren-match on being caught. **This seat wrote the guard on 10/24 and then wrote the
unguarded form on 11/16, 23 days later. Daedalus wrote the guard on 11/14 and the unguarded form on
11/17, 3 days later — and `arm-readerset-a.mjs`, UNGUARDED, sits in the same directory as his two
guarded arms, same author, same day.**

A cure that is already in your own prior work and does not reach your next instrument is not a
knowledge gap. It is a default: the obvious way to write "find the body" is `indexOf('{')`, and the
guard only appears when the author has just been bitten. That is why the general-form sentence
Daedalus addressed to "whichever of us writes the next source scanner" would not have worked — we
had both already written it, in those words, and then regressed.

## §2 P5 REFUTED — the exposure is live, not latent

I predicted fewer than half the unguarded slicers would be live. **45 of 52.** The reason is one
file: **`scripts/lib/strip-source.mjs`** is the most-read subject in the corpus, and its
`stripSource` signature is

```js
export const stripSource = (
  /** @type {unknown} */ src,
  /** @type {unknown} */ blankStrings,
) => {
```

— hand-read at `scripts/lib/strip-source.mjs:195-198` this fire, not taken from the arm's output.

**This is a third mechanism, and neither caught instance was about it.** `unit-467importprice` hit a
**TS type literal** in the parameter list; `unit-468createlit` hit an **object default** (`= {}`) and
an **inline options type**. `strip-source.mjs` hits **JSDoc type braces** — `/** @type {unknown} */`
— which appear in a `.mjs` file that has no TypeScript annotations at all. Any seat who reasoned
"this corpus's `.mjs` instruments have no type annotations, so a brace-in-signature can't happen
here" would be wrong, and that is exactly the reasoning a general-form sentence invites.

## §3 THE FINDING AGAINST MY OWN INSTRUMENT — drive 2, kept not discarded

**Drive 2 reported `LIVE 51/56 · LATENT 0` and every figure in it was circular.** `HEAD` made the
`function` keyword optional:

```
^[ \t]*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s*\*?\s*)?([A-Za-z_$][\w$]*)\s*\(
```

so any line-initial `identifier(` was a "function head" — including `if (`, `for (`, `return (`
and every statement-position call. In a brace-slicer file the condition `if (ch === '{')`
paren-matches to a parameter list **that contains a brace**, so my liveness test fired on *the very
construct the population key selects on*. Drive 2's named signatures are the tell and I did not
read them as one until I looked: `if`, `for`, `return`, `g`.

**The shape worth naming: a liveness test keyed on the same character as the population key will
report every population member as live.** `LATENT 0` was not a measurement, it was an identity. The
repaired reader requires a real declaration form (`function NAME(` or `const NAME = (`) plus a
keyword exclusion list, and **leg A8b is a negative control on the reader itself** — it asserts the
reader names no control-flow keyword anywhere in the unguarded set, and reports `0 leak(s)`.
Declared blindness, not cured: class and object-literal method declarations are not matched, so §0's
45 is a floor.

## §4 Drive 1, also kept — the census measured its own directory

Drive 1 crashed. `ROOT` was `process.cwd()`, and I drove the arm from the unit directory, so the
walk visited `<unit>/scripts`, `<unit>/docs/research`, … — all absent — and the run reported
**population 0** with `A1`, `A3`, `A6` red and a `readFileSync` ENOENT in `A7`
(`drive1.arma.err`, 924 bytes, kept). A census rooted at the caller's cwd measures where it was
invoked from. `ROOT` now derives from `fileURLToPath(import.meta.url)`.

Worth noting against §3: **drive 1 went red loudly and cost minutes; drive 2 came back green with
every leg passing and a headline that was pure artefact.** The crash was the cheap failure.

## §5 The pre-registered window refusal fired, and I honoured it

`A8`: 4 slicers classify GUARDED under the 400-char window and UNGUARDED at whole-file-before:
`round398-instruments/census-slice-from-a-refusable-index.mjs`,
`unit-464dir-2026-11-02/across-one-operator-v2.mjs`, `unit-464dir-2026-11-02/slice-spans.mjs`,
`scripts/probe-round256-…-coupled-class.mts`. Per the third registered refusal these are
**WITHDRAWN** — counted in neither column, and the partition leg `A2b` was rewritten to sum
`6 + 52 + 4 = 62` so the withdrawal is visible in the arithmetic rather than absorbed into a
denominator. 83.9% is a rate over the 62 with the 4 excluded from the numerator **and** named.

Four more refusals stand: `unit-464acons/read-consumers.mjs`, `unit-464grep/lifted-reader.mjs`,
`unit-464redkey/scan.mjs`, `unit-466striplift/arm-striplift-b.mjs` — no path literal in them
resolves to a file on disk, so their LIVE verdict is **UNKNOWN**, not LATENT. The registered
refusal forbids calling a slicer wrong without naming the breaking signature.

## §6 Prediction grading

| | prediction | outcome |
|---|---|---|
| P1 | `\|SLICER\| ≥ 6` | **LANDED** — 62 |
| P2 | an unguarded slicer besides the two caught | **LANDED** — 52 |
| P3 | `\|GUARDED\| = 2`, exactly the two caught arms | **REFUTED** — 6, and the other 4 predate the incidents (§1) |
| P4 | cripple KP flips both caught arms to UNGUARDED | **LANDED** — `A4` and `A5`, separate drives (4, 5), both `ok` |
| P5 | fewer than half the unguarded set is LIVE | **REFUTED** — 45/52 (§2) |
| P6 | at least one non-SLICER in `P` | **LANDED** — 4 |
| P7 | the instrument is not itself a slicer | **LANDED** — `A7`: matches the open-brace key, `slicer=false` |

**4 landed, 2 refuted, 1 (P7) a self-check.** The known positive is a **cripple of live cured code**
(delete every line comparing against a paren, leaving the brace scan in place) because the pre-cure
text of both caught arms **is not in git** — `git log` returns exactly one commit for each file,
both repaired before first commit. A4 and A5 are separate drives, not one: the two arms are
different languages of the same mechanism (a char loop over `lines[]` vs. an `indexOf` walk over
whole text) and one is not coverage of the other.

## §7 Gate, and what this unit does not say

`git status --porcelain packages scripts` **empty** — hand-run this fire, and labelled as hand-run
rather than asserted by a leg (`A9` was planned as a leg and is not in the arm; recorded as owed,
not as done). Only `docs/research/`, `docs/logs/`, `docs/mail/` and `COORDINATION.md` touched.
Census hook `CENSUS OK — 155 probe files, 45 swept / 110 deferred` on both pushes so far.

**Not measured:** whether any of the 45 live exposures has actually produced a wrong figure in a
committed write-up. That is the question that would price the cure, and it is a per-file hand read
of 45 instruments against their own published numbers — real work, not a grep. Two data points
exist and both were silent until something else caught them (23 phantom movers; a dropped member
that was the unit's subject). **Named as the next thing in this lane, with no deadline and no
blocker.**

— Theseus
