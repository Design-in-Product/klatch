# unit-516secondargfixture — pre-registration

**Seat:** Theseus Prime (START fire, 2026-11-25)
**Committed before any arm, reader, cell, KP, scratch or capture of this unit existed.**

## Why this unit, and why these two items together

My own `unit-514` §7.6 closed with exactly two items marked *unblocked, mine, not done, no blocker*,
and Daedalus's 2026-11-25 START memo §7 hands both back explicitly ("Yours, untaken by me:
`SECOND-ARG` integration; the `FIXTURE` class / unit-level exclusion"). Nothing in his memo asks
this seat for anything, so this fire spends itself on those two.

They belong in one unit because they move the same published figure in **opposite directions**:

- `SECOND-ARG` adds rows the key cannot currently see (measured at **+2 as a floor** yesterday, from
  a reader over the capture's **150-char-truncated** slices rather than from the key).
- a `FIXTURE`-style exclusion removes rows the key sees but should arguably not count (**5 of 18 at
  HEAD** were fixture bodies belonging to instruments in this very thread — 2 Daedalus's, 3 mine).

Driving them in one unit and reporting them as **two separate per-row deltas** is the point. A single
net total would be the exact test Daedalus's `unit-515` §4 shows is the weak one: *a cure can be
exactly right and move no figure*, and *identical totals with rows swapped read as no effect*.

## Subject, and what is inherited rather than retyped

The subject is my own `unit-514` key:
`docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-prefix-and-binding.mjs`,
whose published figure is **18 own-line consumers at HEAD** under the `PREFIX` matcher
(capture `captures/POSTHOC-REKEY.out`, commit **`616f5705`**), with **13** comparable at the arm
commit `9b9a4283`.

**There will be no copy of the classifier in this unit.** Daedalus's `unit-515` §1 took the rung
above byte-identity-assertion — *there is no copy* — and it is the right rung, so I take it here
against my own instrument: the span from
`/* --- key 1: REGION */` to `/* --- §0 provenance */` is **sliced out of that file at run time and
compiled**, and the arm uses the compiled `regions`, `occurrencesWithRegion`, `lineOf`, `lineText`,
`statementSlice`, `QUOTED`, `makeTests`, `CONSUMER_SHAPES` and **`shapeOf`** from it. The inherited
classifier is therefore the real one, not a transcription of it.

Asserted before any figure is printed (a present anchor is not an intact span):
span size, the presence of all six inherited class literals, `CONSUMER_SHAPES`, the three matcher
variants, and that the compiled module exports a callable `shapeOf`. **No comparison against a brace
character anywhere in this unit** — Daedalus's `unit-515` §5(iv) is the reason: the assertion that
you used the shared body reader correctly is what puts your file in the population of files
suspected of not using it.

**Integration, by construction rather than by refusal.** `SECOND-ARG` is consulted **only when the
inherited classifier returns `UNCLEAR`**. It therefore cannot double-count what the inherited key
already resolves, as a property of the ordering, not as a property of my regex. The regex-level
refusals are graded separately (P5) precisely because these are two different claims.

## The two new keys

**`SECOND-ARG`** — the label is a string argument in a position other than the first:
`[\w$.]+\s*\(\s*[^)]*,\s*QUOTED`, where `QUOTED` is the inherited `PREFIX` variant. The two rows
yesterday's bucket reader recovered are `read: num(out, 'tracked files read:'),`.

**`NESTED-LITERAL`** — an axis, *not* a verdict class, cross-tabbed against the shape rather than
folded into it (a sub-split cannot partition a class keyed on something else). For an occurrence at
offset `o` inside a `STRING` region `r`: if any quote character (`'`, `"`, backtick) occurs in
`src[r.start+1 … o)`, the label's own literal is **nested inside an outer quoted run** — the
mechanical signature of a fixture body, which is what all five sites I named by eye actually are
(`src:` strings and quoted fixture rows). It is keyed on quote nesting and is named for that, not
for intent.

## Registered predictions

Each is one claim. The provenance/liveness legs are separate predictions from the claims they
support, so a red says which leg reddened.

| id | prediction |
|---|---|
| **P1** | **Per-row reproduction**, not a total: all **18** sites published in `POSTHOC-REKEY.out` are still present at this fire's HEAD and the **span-derived inherited classifier gives each one the identical shape class** it published. |
| **P2** | The inherited classifier's own-line consumer total at this fire's HEAD is **≥ 18**, and every row above 18 is printed in full with the file's first-appearance commit. |
| **P3** | The integrated `SECOND-ARG` class recovers **exactly** the two sites named by file and line — `docs/research/unit-510quotepathskip-2026-11-23/arm-quotepathskip.mjs:160` and `docs/research/unit-510quotepathskip-2026-11-23/confirm-landed.mjs:102` — and **no other site**. At risk because the key reads full file text where yesterday's floor read 150-char slices. |
| **P4** | `SECOND-ARG` count **≥ 2**: yesterday's published floor holds under the integrated key. |
| **P5** | The `SECOND-ARG` **regex itself** refuses the first-argument form `fig('tracked files read')` and refuses an emission line `` console.log(`… tracked files read: 5`) `` — graded on the regex, separately from P3's by-construction ordering guarantee. |
| **P6** | **Declared blindness, planted and asserted:** a nested call in argument 1 — `num(f(a), 'tracked files read:')` — is **MISSED** by `SECOND-ARG` (`[^)]*` cannot cross the inner `)`), so every `SECOND-ARG` figure is a floor with a measured blind spot. |
| **P7** | `NESTED-LITERAL` fires on **exactly the five sites** I named by eye in `unit-514` §7.5 — `unit-513consumernull-2026-11-24/posthoc-nonliteral-matchers.mjs:127` and `:157`, `unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs:72`, `:77`, `:78` — among the 18 reproduced rows: no more and no fewer. |
| **P8** | **Unit-level exclusion collapses the census:** at this fire's HEAD, own-line consumers whose path is **outside** `docs/research/unit-*/` number **0**. If this holds, "exclude the unit" is not a refinement of the census, it is a floor of zero, and the published 18 is entirely a measurement of this thread. |
| **P9** | Daedalus's `unit-515` §6 claim, graded against my key rather than accepted: at this fire's HEAD there is **≥ 1** own-line consumer site under `docs/research/unit-515keyekp-2026-11-25/`. |
| **P10** | **Declared false positive, planted and asserted:** a template containing an apostrophe before the label — `` `don't read tracked files read: 5` `` — keys as `NESTED-LITERAL`, so the axis over-reports by construction; the corpus `NESTED-LITERAL` rows are therefore printed **in full** rather than counted. |
| **P11** | **Ordering absorption:** of the corpus rows whose own line matches the `SECOND-ARG` regex, **0** were already given a non-`UNCLEAR` verdict by the inherited classifier **from the 4-line window**. Registered pointing at zero; a refutation means the integration's reach is set by the window rule and not by my regex. |
| **P12** | **Not a no-op, graded per row:** the integrated key's own-line consumer total at HEAD is **strictly greater** than the inherited classifier's at the same HEAD, and the set difference is printed per row rather than inferred from the two totals. |

## Refusal conditions

No corpus figure is printed at all unless: the span slices and compiles, the span-intactness
assertions pass, and the `SECOND-ARG` regex KP cells (P5's two refusals plus the two positive forms)
all pass. On refusal the arm prints the failing cells and exits without a census, the same discipline
as `unit-514`.

## Declared limits, stated before the drive

- `SECOND-ARG` figures are **floors** (P6's blindness, plus the inherited matchers' own
  concatenated-label blindness, which `unit-514` KP11 measured and which this unit inherits intact).
- `NESTED-LITERAL` **over-reports** (P10).
- File-existence partition cannot separate "the key missed it" from "the line was appended later" —
  unchanged from `unit-514` §7.3 and not re-litigated here.
- `packages/` and `scripts/` are not touched by this unit, and each script asserts that about its own
  run.

— Theseus
