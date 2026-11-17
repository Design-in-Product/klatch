# unit-472publishedfigure — RESULTS

**Seat:** Theseus · **Date:** 2026-11-17 (WORK fire) · **Model:** claude-opus-5
**Pre-registration:** `95d120a5`, pushed to `origin/main` before the arm existed.
**Arm + drives 1–3:** `a77fc784` · **narrowing + hand read:** `9304ce1f`
**1 arm + 1 hand read · 7 drives · 13 legs · 3 defects kept, all three mine**

## §0 THE NUMBER

**The 469 LIVE figure is an over-count by 25 of 41. An import is not a call site, and `strip-source.mjs`
is the most-imported helper in the corpus.** Re-keyed on the site kind of the path literal, 41
CANDIDATE exposures become **16**. And the first hand read — the only one this fire completed —
comes back **NOT WRONG**: the instrument's naive reading really was wrong (5 of its 12 readings
move), and its committed write-up published the **cured** numbers anyway, having already caught the
defect itself.

So the answer to the question my 469 §7 left open is, so far: **one instrument's figures were
checked against its own write-up, and the write-up was right.** Fifteen candidates are unread and
named individually in §6.

## §1 The question, and why it needed a different instrument than I expected

469 §7: *"whether any of the 45 live exposures has actually produced a wrong figure in a committed
write-up … a per-file hand read of 45 instruments against their own published numbers."* Daedalus's
11/17 addendum confirms his `pre-commit` detector does not touch it — *"it grades the reader each
file uses, not the figures any file has published"* — and his detector prints that limit in its own
green output, which is why it is still visible rather than closed by assumption.

I expected to build a screen that narrowed 45 hand reads to a few. The screen narrowed **the
population**, not the hand read, and for a reason that was a defect in my own prior key (§3).

## §2 The screen, and the one design choice that carried the unit

For each `(instrument, subject, declaration)` triple:

| reader | rule |
|---|---|
| naive-raw | first `{` at/after the declaration head, brace-balanced over raw text |
| naive-stripped | the same over `stripSource(src, true)` |
| cured | `scripts/lib/decl-body.mjs` (Daedalus, `c8b8fd73`) |

**DIFFERS iff the cured body is not byte-identical to a naive variant's.** Byte identity, not
containment and not length. Daedalus's C2 cripple read green against a containment predicate having
shortened a span by 3357 characters: *a cure whose damage is a wrong SPAN cannot be graded by a
predicate keyed on the span's CONTENTS.* Length alone would also be defeated by a compensating
shift.

Two naive variants rather than one, because his C1 showed the three mechanisms are cured by **two
different lines** — the JSDoc case by `stripSource`, the other two by the paren walk. One variant
would have made the JSDoc class invisible.

**Sound in the negative direction only.** All-IDENTICAL means no spelling of that instrument's
slicer could have read a different body — a refutation. DIFFERS makes it a CANDIDATE and nothing
more. The arm does **not** execute each instrument's own slicer: 46 instruments spell the walk 46
ways, and the naive readers above are the *weakest* reading any of them could use, so DIFFERS is an
upper bound on exposure and IDENTICAL is sound for all of them at once.

## §3 THE FINDING — 469's subject key counted import specifiers as subjects

`arm-braceslice-a.mjs:139-158`, `subjectsOf`, resolves "which files does this scanner read" from
**any path-like string literal in the instrument's own source that resolves to a file**:

```js
const PATHLIT = /['"`]([^'"`\n]*\.(?:ts|mts|js|mjs|tsx))['"`]/g;
```

An `import { stripSource } from '../../../scripts/lib/strip-source.mjs'` specifier **is** a
path-like string literal that resolves. So every instrument that merely *imports* the shared
stripper was credited with it as a subject it *slices*. `strip-source.mjs` carries **70 of this
screen's 104 DIFFERS triples** — far more than any other subject, because it is the most-imported
helper in the corpus, not because it is the most-sliced file.

Re-keyed on the **site kind** of each occurrence (`A8`):

| | |
|---|---|
| CANDIDATE before | **41** |
| narrowed out as IMPORT-ONLY | **25** |
| CANDIDATE after | **16** |
| site-kind UNRESOLVED | 0 |

The key runs per triple, not per file, which matters: `round408-instruments/stratify-the-live-interval.mjs`
**reads** `sweep-probes.mjs` (a `git show` argument at `:526`, a path array at `:686`) while
**only importing** `strip-source.mjs` (`:77`). Hand-verified both directions on that file before
believing the count.

**I hold "an import is not a call site" in my own store and wrote the key anyway, one fire earlier.**
The same lesson fired against me on 11/17 START from the other side — there I narrowed a
writer/reader co-occurrence key *because* an import is not a call site, in the same session in which
`subjectsOf` shipped with exactly that defect.

**Declared limit, and it runs one way.** This narrows the **over**-count only. An instrument that
reaches its subject through a glob or a directory walk has no path literal at all and was never in
469's key either — those are its UNKNOWN bucket. **16 is a floor, not the exposure.**

## §4 Three defects in my own instrument, all kept

**(a) Drive 1 — the population was the output of a selector keyed on the defect.** The screen read
**0 IDENTICAL of 104** resolved triples and `A6a` fired *"saturated DIFFERS, grades nothing"*.
Cause: 469's LIVE verdict means *"N of M resolved subjects **carry a braced parameter list**"*, and
its printed subject lines are the ones that matched. The triples I parsed out of it were the output
of a filter already keyed on the defect's presence. IDENTICAL was **unreachable by construction**,
so a CANDIDATE rate of 41/46 measured my own input filter. Repaired by adding a **control
population** — every block declaration in the 26 subject files, not selected on the defect:
**287 declarations, 234 IDENTICAL / 53 DIFFERS**, both classes reachable. `A6c` now asserts the
469-derived population reads *exactly* 0 IDENTICAL, so if I ever mis-parse which lines 469 prints,
that reddens instead of passing.

**(b) Drive 1 — an aligned row token is padded.** My member parse read `^ {6}(GUARDED|UNGUARDED|AMBIGUOUS) {2,}(\S+)`.
The verdict tokens print in an **aligned column**, so the longest one — `UNGUARDED` — is followed by
exactly **one** space. The parse read **7 members of 65** and silently dropped the entire class the
unit is about, which also made `A1`'s untracked test vacuous at 0 of 7.

**(c) Drive 2 — my known-positive selector filtered on the wrong reading.** `A5` picked its negative
by requiring no brace in the parameter list — tested over the **stripped** text. It picked
`regexLiteralEnd`, whose JSDoc braces are **live in the raw reading**, the reading the naive-raw
variant uses. Daedalus's §4 had already named that exact declaration as *"a fourth positive I had
picked and called the negative"*; I reached it from the other side — he by hand, I with a selector
keyed on text that blanks the very construct that makes it positive. The filter now runs over both
readings, and the negative moved to a **planted fixture** (§5).

## §5 Known positives, one per mechanism, on authored source

Drive 2's corpus-resolved negative found **no** plain declaration in `strip-source.mjs` at all —
every block export there carries a brace in its parameter list or return-type region under some
reading. True of that file, not of the screen, so the negative moved to
`scratch/kp-fixture.mts` (untracked on purpose, which is why the population key is `git ls-files`):

| fixture | mechanism | want | got |
|---|---|---|---|
| `kpNegativePlain` | none | IDENTICAL | **IDENTICAL** |
| `kpPositiveReturnType` | brace-bearing return type | DIFFERS | **DIFFERS** 32 vs 60 |
| `kpPositiveDestructured` | braced parameter | DIFFERS | **DIFFERS** 8 vs 19 |
| `kpPositiveObjectDefault` | object default | DIFFERS | **DIFFERS** 12 vs 28 |
| KP-A, live corpus | return type, `client.ts: assembleSystemPrompt` | DIFFERS | **DIFFERS** 2 vs 5558 |

One known positive per shape is coverage of one axis, so all three mechanisms are present rather
than one standing in for the family. Selecting the negative out of the screen's own IDENTICAL set
would have been the screen grading itself; authoring the property is not.

## §6 The hand read — 1 of 16 done, 15 named as owed (R1 FIRED)

**Done: `unit-465readerset-2026-11-14/arm-readerset-a.mjs`, at its own pin `e96741bf`.**

Its slicer and its three classifier keys are copied verbatim into `handread-readerset-a.mjs`, so the
differential compares *its* reading against the cured one, not my paraphrase of it.

4 of its 22 declarations are mis-sliced (`renderVerdict` 25 vs 4676, `writeRecording` 42 vs 451,
`renderTail` 25 vs 129, `attestedRounds` 24 vs 1954), and **5 of its 12 readings move**:

| reading | naive | cured |
|---|---|---|
| reader-shaped | 9 | **10** |
| STATE_READ | 5 | **6** |
| NEITHER | 13 | **12** |
| not-bearing readers | 6 | **7** |
| attested-rounds reader count | 4 | **5** |

**VERDICT: NOT WRONG.** The committed write-up publishes *"**10 reader-shaped exports, 3
refusal-bearing and 7 not**"* — captured from `RESULTS.md` by regex, not typed — which is the
**cured** triple. Its "Self-defect 2" already names all four affected exports with their line
numbers and records that only `attestedRounds` changed class. The instrument was wrong; the write-up
was not. **P7 lands, with a mechanism rather than a coincidence.**

### A finding against this hand read's own first drive

Drive 6 printed **`VERDICT: WRONG — 5 of 12 published figures move`**. That label was false. The
block it read compares the instrument's naive reading against the cured one and **had never opened
the write-up**; calling the naive re-derivation "the published figure" assumed the write-up published
whatever the instrument's first drive printed. The verdict is now keyed on a figure captured out of
the artefact, and a capture that matches nothing reports **UNRESOLVED**, not "not wrong" — a
selector that matches nothing is silent, not exonerating.

### The 15 owed, individually, with what each needs

Not a count. Each needs the same treatment: its own slicer copied verbatim, its own input rev, its
own published figures captured from its own write-up.

1. `round390-instruments/grade-the-declaration-and-the-object-key.mjs` — `sweep-probes.mjs: probeRowAnnotations, verdictLine`
2. `round391-instruments/grade-the-machine-state-conjunct-and-the-floor-of-the-explicit-cure.mjs` — `strip-source.mjs: regexLiteralEnd, stripSource`
3. `round399-instruments/census-the-named-binding-form.mjs` — same two
4. `round400-instruments/regrade-the-file-scoped-guard.mjs` — same two
5. `round408-instruments/stratify-the-live-interval.mjs` — `sweep-probes.mjs` ×2 **REV-PINNED**, `probe-import-large-session.mts: startServer, importOne`
6. `round410-instruments/census-the-wrapped-call-and-the-body-granularity.mjs` — `probe-import-large-session.mts` ×2
7. `round441-instruments/key-the-silent-class-from-source.mjs` — `round430-instruments/grade-the-convention-gate.mjs: retyped`
8. `round454-instruments/census2-does-any-call-site-feed-stripsource-a-non-string.mjs` — `strip-source.mjs` ×2
9. `round454-instruments/census3-resolve-the-324-unmodelled-one-level.mjs` — `strip-source.mjs` ×2
10. `unit-465census-v2-2026-11-10/census-anchors-v2.mjs` — `sweep-probes.mjs` ×2
11–16. the remainder as listed verbatim in `drive5.arma.out` under *"CANDIDATE after narrowing"*.

**Blocker: none. Named as owed because this fire is bounded, not because anything is missing.**

## §7 The rev-pin refusal, and why its own count is a floor

`A9`: **2 READ triples are REV-PINNED** — read via `git show <rev>:<path>`, while this screen read
the working tree. *A subject and its instrument's input can take different revs*, so for those
triples DIFFERS is a fact about HEAD's bytes and not about the bytes sliced. Refused, not counted.

**A9's own key is blind, and the hand read proved it.** It keys on `show`/`cat-file` appearing near
the **path literal**. `unit-465readerset` reaches its subject as ``git(['show', `${PIN}:${p}`])``
with the path sitting in a `LIBS` array a line earlier — so a literal-adjacency key cannot see a
path reached **through a variable**, the same shape as a path key reading 0 because the path is
`${BASE}${pathname}`. By hand that instrument is at least the third rev-pinned case and contributes
4 more triples. **2 is a floor.** Re-screening each pinned triple at its own rev is real work and is
owed, not estimated.

## §8 Prediction grading

| | prediction | outcome |
|---|---|---|
| P1 | ≥1 untracked member in **my** worktree | **LANDED** — exactly **2**, both `*.sliced.mjs` under `round413-`/`round414-instruments`, the same two files Daedalus named. His inference reproduces at his count; tracked figure **63**, agreeing with his detector's tracked population |
| P2 | the screen is not vacuously clean | **LANDED** — 104 DIFFERS, and the control population 53/287 |
| P3 | `queries.ts` among affected subjects | **LANDED** — 3 declarations |
| P4 | CANDIDATE < the live-exposure count | **LANDED** — 16 of 46, but by the site-kind key of §3, not by the span screen I pre-registered for the job |
| P5 | UNRESOLVED non-empty | **LANDED** — 44 triples, 5 wholly-unresolved exposures, all named |
| P6 | the planted KP reads DIFFERS | **LANDED** — and widened to one per mechanism (§5) |
| P7 | ≥1 CANDIDATE survives as not wrong | **LANDED** — §6, and the mechanism is that the write-up had already caught it |

**7 of 7 landed, and the unit's finding is in none of them.** §3 was not predicted: I pre-registered
a span screen to do the narrowing and the narrowing came from re-keying my own prior subject
resolution. P4 landed for the wrong reason, which is recorded here rather than smoothed over.

## §9 Gate

Driven fresh this fire, hand-run and labelled as such:

- `git status --porcelain packages scripts` — **empty**. Nothing outside `docs/research/`,
  `docs/logs/`, `docs/mail/` and `COORDINATION.md` was touched. **No product or script file was
  modified by this unit at all**, so `npm test` is unmoved by construction and is not claimed here.
- Census hook `CENSUS OK — 155 probe files, 45 swept / 110 deferred` on all three pushes.
- Daedalus's new `verify-decl-body-slicers` leg ran on all three pushes and read
  **`DECL-BODY SLICERS OK`** each time, with `MARKED` rising 2 → 3 → 4 as this unit's deliberate
  naive readers landed carrying `brace-slicer-deliberate`. That is his gate's first exercise on
  cases it did not plant for itself, and it behaved: it saw them, classified them MARKED rather than
  new, and stayed green.
- `drive3`, `drive4`, `drive5`, `drive7` `.err` files all **0 bytes** by `wc -c`.

**What this unit does not say:** that the other 15 candidates are clean, that 16 is the true
exposure (§3 and §7 are both floors), or that any published figure anywhere is wrong. One was
checked and it was right.

— Theseus
