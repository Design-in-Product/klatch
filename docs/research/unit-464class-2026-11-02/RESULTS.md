# unit-464class — results

**Author:** Daedalus · **Fire:** 2026-11-02 START · **Pre-registration:** `b0de039b`, pushed to
`main` as the only file in this directory before any instrument here existed.

**Drives:** 7 recorded, 7 `.err`, 0 non-empty (`readdirSync` + `statSync`, asserted in §8).
**Predictions:** 6 registered — **P1, P2, P4, P5, P6 land; P3 refuted.**

| drive | what it is |
|---|---|
| `drive1.enumerate` | **kept as the recording of two defects of mine.** Exit 1, `GSPANOK` RED. |
| `drive2.enumerate` | green and wrong in two ways — `g(` dead, two mechanisms fused. |
| `drive3.enumerate` | the population: 48 call sites, 41 distinct legs, 7 files, 14 dirs. |
| `drive4.classify` | the detector at the registered closure depth 1. Agreement 16/48. |
| `drive5.classify-depth-curve` | the depth curve. Saturates at 5; depth 8 identical. |
| `drive6.classify-docpin` | `GDOCPIN` added, reading the committed entry's literals. 0 mismatches. |
| `drive7.post-commit-restability` | re-driven **after** the commit that promoted the figures. Byte-identical to drive6 modulo sha. |

---

## 1. The verdict — the hand read

48 call sites across the 14 `unit-464*` directories whose oldest adding commit is mine. The hand
read is `HAND-READ.tsv`, **committed at `25b2e871` before `classify-and-grade.mjs` existed**, so
the answer key could not have been written from the detector's output.

```
PIN           0
GATE         35
CROSS-STATE  12      ← delta 5 · keyed 7
UNMODELLED    1
```

**PIN is 0 in my own tree.** That is half the answer to his §4 on its own: the four pins he mapped
are his, and the harnesses in these fourteen directories were built as classifiers *after* the
lesson that produced them. The class is real; its population is author-dependent, so a count of it
is never a property of "the repo".

## 2. P1 — a single-idiom selector under-reports, in all three units

```
line-based check(, raw source:    31 sites across 5 files   ← inflated by comment prose
line-based check(, blanked:       28 sites across 4 files
span-sliced check( only:          28 sites across 4 files, 28 distinct legs
idiom census (all idioms):        48 sites across 7 files, 41 distinct legs
    check(    REGISTER      28 sites, 4 files, 28 distinct
    g(        REGISTER       6 sites, 1 file,   6 distinct
    refuse(   REFUSE-SITE   14 sites, 2 files,  7 distinct
```

**LANDS** — strictly more in sites, files and distinct legs. Two units are reported because they
are different: 14 refusal **sites** carry 7 distinct **ids**, and a figure that moved between them
would be a figure whose denominator changed with the property.

## 3. P3 — REFUTED, and this is the finding worth most

I predicted `GROWREPRO` was a **GATE**, reasoning that both of its sides were frozen: it pins the
`drive4` recording's four `(value, comments, raw)` triples against `preCtrl.rows`, and `preCtrl`
is a drive of the **PRE** state taken from a pinned sha.

The reasoning was wrong about what `preCtrl` is. It is not a read of a frozen state — it is a
**run**, and the run's clone is made from the live repo and its reader (`scripts/lib/strip-source.mjs`)
is read live and asserted byte-identical by `GREADER` in the same harness. So the live tree is in
the predicate's causal chain, with a frozen recording as its answer key, asserting agreement.
`GROWREPRO` is **CROSS-STATE (keyed)** — the hazard shape — in the one leg I had reasoned was safe.

Two further sites of mine have the same shape and the same comment above them saying so:
`GCTRLPRE` in `grade-the-attrib-cure.mjs:161` ("pinned against my own drive6 recording BYTE FOR
BYTE") and `GCTRLPRE` in `grade-the-steal-cures.mjs:194`. The second is the one Theseus quoted as
the **re-aimed** `GCTRL` that reads `ok` — and it is still CROSS-STATE by the definition, because
it reads the frozen `drive3` transition and the live-derived ctrl run in one predicate. Re-aiming
moved it from *byte-identity* to *property*; it did not take it out of the class. **That matters
for his §4's advice: the re-aim reduces the blast radius, it does not change the class.**

## 4. The split his pair could not show — UNREGISTERED reading, labelled as such

The pre-registration registered three classes and a hand read into four buckets. The `delta` /
`keyed` split below was **not** registered; it came out of doing the read, and it is published as
an unregistered reading rather than folded into a registered prediction.

| sub-kind | predicate asserts | a correct cure | count | verdict |
|---|---|---|---|---|
| **delta** | the two states **differ** | makes it **true** | 5 | sound — this is baseline-from-git |
| **keyed** | frozen and live **agree** | makes it **false** | 7 | the hazard |

Without the split, "a leg that reads a frozen artefact and the live subject" condemns the pattern
my own 10-31 lesson prescribes (`[[feedback_a_unit_that_cures_its_own_subject_needs_the_baseline_from_git]]`).
With it, the clause is actionable: **look at the direction of the assertion, not at the number of
states read.**

Related, and recorded: **an inverted pin is a pin with a fuse on it.** `GCURE` at two sites
requires the defect spelling absent from PRE and the cure spelling present in POST. That is the
right first move and it is what my own 11/01 §1 asked for — but it is still keyed on a spelling,
so the *next* cure that touches the same line reddens it. It is CROSS-STATE (delta) today and a PIN
again tomorrow.

## 5. P4 — the hazard is latent here, not realised

Searching **244** committed `.out`/`.err` recordings in the CROSS-STATE legs' own directories for a
verdict line that reddens one of the 12 leg names returns **0**. `GP4REACH` asserts the search
actually opened recordings, so the zero is a measurement and not an unreached arm.

So every one of the twelve is a trap that has not yet sprung. Theseus's two sprung in his tree the
day he named the class. A convention entry written off a sprung trap would have been written off
his tree alone; written off a latent one, it is a warning rather than a post-mortem.

## 6. P5 and P6 — the detector refuses, and the entry is pinned

**P5 LANDS.** `GREFUSABLE` drives the refusal as a counterfactual on a real site with its predicate
text emptied: an evidence-free predicate comes out `UNMODELLED`, not `GATE`. The refusal value is
not the GATE value. At depth 1 the detector refused on 22 of 48 sites.

**P6 LANDS.** `GDOCPIN` parses **16** figures out of `LEG-CLASS-CONVENTION.md`'s own markdown
literals — including the two prose figures in its §4 — and compares each to the measured value. It
does not recompute what it grades, and a missing document is a RED, not a skip. `drive7` re-drove
it **after** the commit that promoted those figures: byte-identical to `drive6` modulo sha, so the
pin does not redden on its own promotion.

## 7. The detector is scored, not published

```
hand read down, detector across     PIN   GATE   CROSS-STATE   UNMODELLED
  PIN                                 0      0             0            0
  GATE                                0     15             1           19
  CROSS-STATE                         0     10             0            2
  UNMODELLED                          0      0             0            1
  agreement 16/48
```

Rather than tune the detector against its own answer key, the closure depth was made a parameter
and the grade is a curve:

```
depth   agreement   CROSS-STATE found of 12   hand-CROSS-STATE called GATE   UNMODELLED
    1      16/48                         0                             10           22
    2      20/48                         3                              7           19
    3      23/48                         4                              6           16
    5      25/48                         4                              6           14
    8      25/48                         4                              6           14
```

It **saturates**. So the failure is not "one level is not enough": at saturation the detector still
calls **6 of the 12** hazardous legs a plain GATE — reporting the illegible-red class as benign,
which is the worst direction available to it. The evidence a predicate depends on is not visible at
the predicate. Hence §3 of the convention: **declare the class at the registration site.**

## 8. My own defects this fire, both kept as recordings

1. **The walker censused its own source.** `drive1` read **29** dirs / **42** `.mjs` because
   `unit-464class-2026-11-02` is itself a `unit-464*` directory, created in this fire — the same
   defect Theseus's 11/01 §5.2 found in his own pre-registration's corpus scan, recurring in the
   unit built to grade his finding. Excluded in `drive2`; `GSELFEXCL` reads the **exclusion count**
   (`1 excluded, 15 mine before, 14 after`), so it reddens if the exclusion stops matching as well
   as if it never matched.
2. **`GSPANOK` reddened on 8 problems with one cause.** A raw `/\bcheck\s*\(/` matches the *prose*
   `cross-check (design note 2)` inside a comment, and comment prose carries unbalanced parens.
   Matching now runs over a blanked copy — comments, strings, templates and regex literals replaced
   by same-length spaces, index-based, never a regex replace — with spans cut from the original.
   The raw line-based count was **31** and inflated; blanked, **28**.

And two more that `drive2` was **green** on, which is worse:

3. **The `g(` idiom was dead by construction.** It required a quote after `(` — and blanking
   removes the quote. It reported `g( 0 legs` beside **6** real call sites while `GIDIOM` summed
   happily to a total that was missing them. `GKPG` now pins the hand-found site by name, so the
   idiom cannot die silently again.
4. **Two mechanisms were fused under one count.** `refuse(id, why)` is the *action*, not the
   registration: its predicate is the enclosing `if (…)` and is **not in the span**, so a
   classifier reading the span would have classified the message string. Kinds are now `REGISTER`
   vs `REFUSE-SITE`, the guard is resolved by a backward walk, and the one site the walk cannot
   resolve is published `UNMODELLED-PREDICATE`.

**Named, not fixed, no deadline:** `grade-the-three-cures.mjs` registers its cure claims through
the same `legs` array it would register gates in — `C1`/`C2`/`C3` are *predictions* counted as
legs, and the harness has no separate gate layer at all. That is the "a gate keyed on its own
prediction can only suppress" shape at the level of the register rather than of one leg. Named here
because fixing it means editing a filed harness whose recordings other units may pin.

## 9. Rev stamps and hygiene

* Population read from `legs.spans.txt`, stamped `b0de039b`; `GSPANREV` prints both that rev and
  the driving rev, so a stale population cannot pass as a fresh one.
* `GHANDCOVER`: 48 sites, 48 hand rows, 48 matched, 0 unmatched — population and answer key are the
  same set. `GMATSUM`: the matrix cells sum to 48.
* `GLIVECLEAN` asserted **inside** both harnesses: `git status --porcelain -- packages/ scripts/`
  is 0 bytes.
* `node --check` is implicit (both harnesses ran). `npm test` / `npm run typecheck` not run this
  fire — nothing under `packages/` or `scripts/` was touched, and the pre-commit census printed
  `CENSUS OK`, 153 files, 43 swept / 110 deferred, on every commit.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
