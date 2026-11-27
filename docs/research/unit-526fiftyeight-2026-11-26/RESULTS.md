# unit-526 RESULTS — the two 58s are not the same 58, and the one that is mine is blind to 28 sites nobody declared

- **Pre-registration:** `PRE-REGISTRATION.md`, committed `9a658c48` on `main` at **19:48:58 PST**, before `arm-fiftyeight.mjs` existed
- **Arm:** `arm-fiftyeight.mjs`, driven once · capture `captures/ARM.out` (28,012 B) · `captures/ARM.err` **0 B**
- **Subject SHA inside the arm:** `9a658c48` · `git diff --stat HEAD -- packages/ scripts/` **EMPTY** (no-op on product, asserted in §0 before any measurement)
- **Graded: 12 — 9 HIT, 3 REFUTED.** All three refutations are against me and two of them are the finding.

## 0. The question, and the one it had to be replaced with

`unit-522` §7 named a deferral: its `bytes`-token figure is **58** and `unit-465` arm C published
`STRING=58`. *"Two different keys; equal numbers; the file-level and site-level overlap is not
measured."*

The published-set-to-published-set comparison is **not available** — the two figures were taken over
two different trees (11/13 and 11/26) — and §0 of the pre-registration said so before the reader
existed. What is available, and is the question that matters, is **key-level**: re-derived over ONE
pinned population at `9a658c48`, do the two keys select the same sites?

**They do not, and the published equality is a coincidence of two populations:**

```
arm C   STRING   re-derived over C-POP (651 tracked .mjs):   85     (published 58 at 2026-11-13)
u-522   bytes    re-derived over T-POP (654 .mjs|.js):       58     (published 58 at 2026-11-26)
```

`unit-522`'s figure **reproduces at 58 exactly**. Arm C's is **85** at today's tree, and *that is
corpus growth over thirteen days, not a correction* — registered as such in §0 of the
pre-registration so no later reader can take the 85 as a defect in the 58.

**Both keys were SLICED, never retyped** — arm C's `TIGHT` (3 literals), `BUFFERISH`, `ARRAYLIKE`,
`isComment` and `THIS_UNIT` out of `arm-byteslabel-c.mjs`; `UNIT_TAIL` out of
`arm-lengthasbytes.mjs`; `regionOf`'s whole 8-line function text out of `posthoc-which-133.mjs`,
instantiated over the live `scripts/lib/strip-source.mjs`; and `unit-522`'s population filter off
**its own capture**, which is where its arm published it. Every sliced literal is printed in §1 of
the capture. Any slice failure aborts. **7 of 7 known positives and known negatives pass**, in both
directions for both keys, on text outside both corpora, before any figure was computed.

## 1. The overlap: 52 of 58 — and P3/P4 are REFUTED against me

On `SHARED` (651 files both keys can reach):

| | |
|---|---|
| arm C `STRING` | **85** sites, 65 files |
| `unit-522` `bytes`-token | **58** sites, 44 files |
| **site-level overlap** | **52** — **89.66%** of the smaller selection |
| arm C only | **33** |
| `unit-522` only | **6** |
| file-level overlap | **42** |

I registered the overlap at **[5, 40]** and that the keys would be **< 80%** coincident. Both
**REFUTED**: 52, at 89.66%. **`unit-522`'s selection is very nearly a subset of arm C's** — 52 of
its 58 sites are also arm C `STRING` sites. *Two keys I had read and found structurally unalike
select almost the same sites. This is the same error `unit-524` recorded against me this morning
(P4/P10/P11, "one wrong model registered three times"): **seeing two keys shaped differently is not
evidence that they select differently** — and I registered it again, twelve hours later, having
written that sentence myself.* The lesson did not transfer because I filed it as being about those
two keys rather than about me.

## 2. THE KEEPER — `unit-522`'s key is blind to the prefix form, reach 28, and that blindness was never declared

**28 of the 33 arm-C-only sites are missed by `unit-522`'s key for one structural reason: the unit
token sits BEFORE the `.length`.** `UNIT_TAIL` is `/^[}\s)\]'"`,.:;+\-=]{0,8}(B|bytes|byte)\b/`
applied to the text *after* `.length`; it cannot see a label that precedes it:

```
say(`exit: ${r.status}   stdout bytes: ${(r.stdout || '').length}   stderr bytes: ${(r.stderr || '').length}`);
return { ok: same, detail: `bytes=${armSrc.length} identical=${same}` };
bytes: src.length,
```

`unit-522`'s declared limits were **`L2`** (the label on the next line) and **`L3`** (a byte figure
in a plainly-named variable). **The prefix form on the *same* line is in neither.** It is a new
blindness in a figure published this morning, and its reach on the same population is **28 sites**.

**What the 28 is NOT:** a defect count. Arm C's `STRING` cell carries its own hand-verified false
positives, and `unit-465` §5 named one — `scripts/measure-marker-floor.mjs:296`,
`contributing.length` / `accounting.length`, **array** lengths next to variables genuinely named
`chars` and `bytes`. **That exact site is one of the 28.** So the figure is the *reach of the
blindness* — sites one key selects and the other structurally cannot see — and not a count of
mislabels. Resolving which of the 28 are real needs hand-reading, which this bounded fire did not
do, and the 28 whole lines are printed in the capture for whoever does.

**A third mechanism, 5 sites, named rather than left in a residue:** the remaining 5 arm-C-only
sites are missed because **an expression sits between the `.length` and the token** —
`${headSrc?.length ?? 0} bytes` (the `?` is outside `UNIT_TAIL`'s punctuation class) and
`${t.length - m.index} bytes` (a subtraction). 28 + 5 = 33, and the asymmetry closes with nothing
over.

## 3. The other direction, 6 sites — and it lands exactly on the class `unit-465` §5 declared about itself

The **6** sites `unit-522` finds and arm C misses are all one shape, and it is the shape `unit-465`
§5 declared as its own under-count thirteen days ago:

> *"Arm C's 3-way classifier is order-dependent, and the bottom cell is the only order-invariant
> one. … A line carrying **both** an array `.length` and a string `.length` lands in `ARRAYLIKE` and
> its string claim is **hidden** — `round425…:77` and `:163` are exactly that."*

All six are `${x.split('\n').length} lines, ${x.length} bytes`. **`round425…:77` and `:163` are two
of them — the two members `unit-465` §5 hand-named.** The other four were not named by anyone:

```
docs/research/round426-instruments/a-published-sentence-is-not-its-discriminator.mjs:126, :127
docs/research/unit-464conj-2026-11-03/occupy-conj-history.mjs:138
docs/research/unit-465recall-2026-11-10/recall-at-typing-commit.mjs:60
```

So a declared limit that named two instances has **six**, and the instrument that measures it is a
*different unit's key run over the same population.* **A declared blindness is a hypothesis about a
population until another key is pointed at it** — `unit-465` was right about the mechanism and
under-counted its own instances by a factor of three, in the direction that flattered its figure.

## 4. Against me, third — P12 was a prediction about a population I had mis-stated

P12 registered that at least one `unit-522` site sits in a file arm C cannot reach, and §3 of the
pre-registration described `T-POP` as *"all tracked files (`unit-522`'s population)."* **That is
wrong, and the slice corrected me:** `unit-522`'s own filter, read off its own capture, is
`/\.(mjs|js)$/`. The two populations are 651 and 654, not 651 and 7792. **P12 measured 0 and is
REFUTED** — there is no non-`.mjs` member for it to find, because the mechanism I predicted does not
exist.

*The prediction was wrong because I described a frozen unit's population from memory while holding
the file that states it.* The arm's own slice is what caught it — the same discipline that made the
figures trustworthy also graded my description of them.

## 5. Vacuity

`.length` occurrences in `T-POP`: **14,955** (floor registered 2000, P8 HIT). Both `SHARED`
selections non-empty and the overlap non-empty, registered separately as P9/P10 so that no interval
here is graded by an empty set — the exact defect `unit-524`'s P7/P8 landed on this morning.

## 6. Declared limits

- **Neither key is a defect reader.** Arm C's `STRING` is lexical and order-dependent (its own §5);
  `unit-522`'s is a tail match plus a region. Every figure here is a *selection* count.
- **One pinned population, one SHA.** Nothing here says what either published figure's set *was* on
  its own tree. Measuring that needs two `git archive` materialisations and is a larger unit.
- **The 28 and the 6 are not hand-read.** Whole lines are printed; the judgement is not made.
- **`L2` (multi-line) is untouched** — both keys are one-line readers, so the overlap says nothing
  about labels that span lines.
- Nothing outside this unit directory was written. `git status --porcelain` on both frozen subject
  units and `scripts/lib` asserted **empty inside the arm** before any slice.

## 7. Open

- **Closed by drive:** the 58-vs-58 overlap, carried named-as-not-run through two fires. **They are
  not the same 58**; 52 of 58 coincide on one population; `unit-522`'s 58 reproduces exactly.
- **New, mine, unblocked:** the **prefix-form blindness** in `unit-522`'s `UNIT_TAIL`, reach **28**.
  A cure is a second tail direction, and re-keying `unit-522` republishes its census, so it needs its
  own unit and its own pinned population (frozen research files are not edited — settled 11/20).
- **New, nobody's yet:** hand-reading the **28** to separate real mislabels from arm C's own false
  positives. `scripts/measure-marker-floor.mjs:296` is already hand-verified as one of the latter by
  `unit-465` §5, so the floor on false positives in the 28 is **1**, not 0.
- **For `unit-465`'s record, not a correction to it:** its §5 declared under-count has **6**
  instances, of which it named 2.
- **Still mine, carried, unblocked:** `L2`, `L3`, the `unit-516` §5 frozen-population-prediction
  pattern defect, `SECOND-ARG`'s nested-call blindness.
- **xian's, and only his:** `unit-516` §5's 15-vs-0 census-purpose choice, boarded by Calliope as
  attention item 10. Daedalus's `unit-525` priced the corpus-boundary option today; **this unit adds
  nothing to that choice** and does not claim to.
- **Nothing asked of any other agent.**

— Theseus
