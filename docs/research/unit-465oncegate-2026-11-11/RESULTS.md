# unit-465oncegate — results

**Seat:** Daedalus · **Fire:** 2026-11-11 STOP · `date`-read **17:21:10 PST** at pre-registration;
arm driven at `2026-11-12T01:22:56Z` (the recording's own stamp, UTC).
**Pre-registration:** `PREREG.md`, committed and pushed to `origin/main` as `b8fd9ae6` **before the
arm existed** — not back-dated.
**Subject:** `scripts/probe-once-anchor-duplication.mts`, the `K-onceR` gate leg Argus promoted this
fire (`b942aa49`, SWEPT 45), at blob `f20d6710` (pre-cure, recorded by the arm itself).
**Recording:** `recording-oncegate.txt`, 15 of 15 checks passed, written by the arm, not by hand.

## 0. What is and isn't claimed

The gate's **predicate is sound and I am not disputing it.** Driven unmodified: `All 12 regression
checks passed`, `[MEAS] F1  9 live flag(s) · 9 grandfathered · 0 new`. Argus's own headline figure
reproduces exactly from this seat, and so does the census: `CENSUS OK — 155 / 45 / 110`.

What this unit grades is the subject's **prose**, in the two places where it states a figure or a
reach that the predicate does not assert — because a count-free predicate stays green forever while
a sentence beside it goes false, which is the exact mechanism three seats have now been caught by in
48 hours (`unit-465fixture` §4, Theseus's `unit-465leadcure` §3, and this).

## 1. P1 — CONFIRMED. The docblock's "three … are live" was false under the key it cites

The sentence read: *"Three of those standing anchors are live in this file's own population today."*
It sits immediately after a quotation of `unit-465plant` RESULTS.md §5, so §5's key is the key it
invites. §5's key is **flagged declarations** — the unit of the 67 → 14 restriction and of "the other
13 are standing non-unique anchors."

Under that key the live figure is **9**, and it is not a figure anyone had to go looking for: the
subject's own `F1` `[MEAS]` line prints it in the same run, three lines below the claim.

| key | live figure | is it 3? |
|---|---|---|
| flagged declarations (`unit-465plant` §5's own key) | **9** | no |
| distinct names | **9** | no |
| distinct values | **6** | no |
| flagged declarations **per population member** | **3** | **yes** |

So the sentence was a **per-file figure stated as a population-wide one**, off by the population
size. Cured by deleting the number and pointing at `F1`'s own MEAS line, which reports it every run.

## 2. P2 — the claim held and MY PREDICTED FIGURE WAS WRONG. Recorded as the refutation it is

I pre-registered that the 9 live flags carry **9 distinct values**. Measured: **6**. `probe-round374`
and `probe-round375` flag *identical values* under different names — `from './lib/probe-outcome.mts';`,
`} from './sweep-probes.mjs';`, and the `const HERE = dirname(fileURLToPath(import.meta.url));` line
— so the three shared values plus `probe-round377`'s three unshared ones make 6, not 9.

The **claim** P2 tested survives (6 ≠ 3, so no value-level re-keying rescues the sentence either);
the **figure in my prediction** was refuted. I had reasoned that three files × three anchors must be
nine distinct values without reading the values, and PREREG.md committed me to recording that
outcome rather than the prediction. This is the live instance of why the figure goes in the arm and
not in the sentence: **I made, inside the unit reporting a frozen-count defect, exactly one frozen
count — and it was wrong.**

A second thing the values show, which no count would have: the docblock's parenthetical named the
live flags as *"import-continuation fragments and the universal `const HERE = ...` boilerplate
line."* That covers `probe-round374` and `probe-round375`. It does **not** cover
`probe-round377`'s `A_R225_READ` (`const r225Src = readFileSync(join(HERE, R225), 'utf8');`) or
`A_SWEEP_READ` (`const SWEEP = join(HERE, 'sweep-probes.mjs');`) — neither is an import continuation
nor the `HERE` line. Named as members rather than counted, so this sentence cannot drift.

## 3. P3 — CONFIRMED, with the matched positive. The `.mjs` branch cannot be satisfied

The selector is `f.endsWith('.mts') || f.endsWith('.mjs')`, then
`readFileSync(...).includes(ONCE_HELPER)`, where `ONCE_HELPER` is sliced from the subject's own
defining line:

```
"const once = (src: string, from: string, to: string) => {"   (57 chars, sliced not retyped)
```

Those two conjuncts are mutually unsatisfiable: `: string` is not valid in `.mjs`. Graded against
text sliced from a real population member, never typed:

| arm | text | satisfies `ONCE_HELPER`? |
|---|---|---|
| **P3a** matched positive | the six-line helper sliced verbatim from `probe-round374` | **yes** |
| **P3b** | the same slice with `: string` deleted — what a `.mjs` copy must look like | no |
| **P3c** | the same slice merely re-wrapped across lines by a formatter, still `.mts` | no |

P3a is what makes P3b and P3c statements about the **selector** and not about a broken slice; S5/S6
separately assert each derived variant actually differs from the slice it came from, so neither
negative can be vacuous. The apparatus under every figure above (`occ`, `literalDecls`,
`consumedByOnce`, `flagsIn`) is **sliced out of the subject at run time and imported** — 7108 bytes,
171 lines, with S1/S2 asserting the span was found and the import produced a callable, so a failed
slice reads red rather than clean.

## 4. P4 — CONFIRMED, and it is the bound on §3. This is a reach limitation, not a live blindness

Censused live, not reasoned about: `scripts/` holds **142** `probe-*.mts` and **13** `probe-*.mjs`;
of the `.mjs` files, **0** declare a `once` helper under any spelling; of all `probe-*` files, **3**
do, and the selector reaches exactly those **3**. The population is therefore **exactly right
today**, and §3 indicts the docblock's sentence *"a fourth copier … is covered automatically"* — a
claim about the future — not the gate's present coverage. Stated this way in the cure rather than
reported as a hole in the gate, which it is not.

## 5. Cures landed, and the one deliberately not taken

Both cures are in the subject's **docblock only**; no predicate, arm, population selector or
baseline rev was touched.

1. **The frozen count is deleted, not refreshed** (P1). The docblock now says the count is
   deliberately absent and names `F1`'s MEAS line as the live reporter, records what the old sentence
   actually was (the per-file figure) so the next reader doesn't re-derive the question, and widens
   the class parenthetical to cover `probe-round377`'s two members that it missed.
2. **The automatic-coverage claim is qualified** (P3/P4) with both negatives, the matched positive,
   the live `.mjs` census that bounds them, and a pointer to this unit.

**Not taken: widening the selector.** That is a design call on Argus's own leg — a looser match
(normalising whitespace, or matching the helper's body rather than its signature) trades a
precision risk this seat has not measured, and `R4` committed me to routing it rather than choosing
it. Routed as input, not as work.

## 6. Refusals — CHECKED at wrap, not asserted

- **R1 — no edit to `packages/`.** `git diff --stat -- packages/` → **empty**. Verified this fire.
- **R2 — `scripts/` touched, so the full gate is owed and was driven**, summary lines not exit codes:
  - `npm run typecheck:scripts` → clean (both projects).
  - `node scripts/sweep-probes.mjs --census` → `CENSUS OK — 155 / 45 / 110`.
  - `node scripts/sweep-probes.mjs` → **`SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0
    blocked (0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred`**.
  - the subject re-driven after the cure, as part of that sweep: `All 12 regression checks passed`.
- **R3 — no number typed into an instrument.** Held. Every figure comes from a live read or a
  verbatim slice; the apparatus is the subject's own source, imported.
- **R4 — Argus's population selector not redesigned.** Held; routed instead.
- **R5 — no `.testdata/` scratch.** Held. The unit's scratch is under this unit's own directory and
  is added by explicit path, never `-A` over the unit dir.

## 7. P5 — checked by reading my own output back, and it is not clean

Pre-registered: *no surviving sentence in this unit's prose or in any cure it lands freezes a corpus
count that nothing recomputes or pins.* Read back at wrap:

- **The cure text in the subject: passes.** No live count survives in either cured passage; both
  defer to the MEAS line that prints them.
- **This file: fails as written, and the failures are kept deliberately.** §4 states `142`, `13`,
  `0` and `3`; §1 states `9` and `6`. A **RESULTS.md is a dated recording** and these are pinned to
  a stamped arm run against a named blob (`f20d6710`) — the thing P5 exists to forbid is a frozen
  count in **standing** prose that a reader will take as current, which is the defect in §1 and the
  reason the cure deletes rather than refreshes. Recording the distinction rather than claiming a
  clean P5, because "my unit passed its own mechanism-keyed prediction" is the sentence most worth
  distrusting here.
- **And the one that actually bit: §2.** My own pre-registered figure (`9` distinct values) was a
  frozen count typed into a prediction without reading the values. P5 did not catch it — P2's own
  measurement did, because I had committed in advance to recording the measured outcome over the
  predicted one. That is the mechanism that worked; P5 is not what saved it.
