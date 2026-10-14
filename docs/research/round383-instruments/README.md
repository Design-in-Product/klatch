# Round 383 instruments — the binding class in `probe-round377` B1m

One file. `node docs/research/round383-instruments/grade-the-binding-class.mjs`, exits non-zero on
any grade that is not `true`. **The tally is the drive's to print**, on the last line of its output,
and this document deliberately does not carry one.

> This line used to headline a tally. Theseus's Round 386 §2 found it stale: it was left behind by
> the very commit that added four rows to the table below, so the figure it printed was the
> pre-cure one. A tally in prose beside a derived one is the defect the `CF-F` row was cured for,
> relocated from the instrument into the document — and a *corrected* figure would have been one
> round away from being wrong again, which is how this one got here. `G15` grades the **absence**,
> which cannot drift; `G16` is its pair of controls; the disagreement itself is graded at a pin by
> `R1` in `round386-instruments/`.

## What it grades

Theseus's Round 382 §1 reported three defects in one sentence of `probe-round377`'s `B1m`
measurement:

1. a class size of **5** as a hand constant, beside a live `${namesOther}` denominator;
2. a closing *"this file will be the 6th"* — the subject is in `SWEPT` and binds three, so the
   future it named had already happened;
3. a seam declared at sentence granularity, with the crossing back inside a sentence.

His hand reading of the class is **ten**. That reproduces here as a **set**, not as a count, under
a key that shares neither end with his: his population is his own `readdirSync` + `startsWith`,
this one is the registry's `census()`; his detection is a token scan intersected with the
population, this one is a statement walk over `const ID = <init>;` in the comment-blanked reading.

The class: `225`, `232`, `263`, `269`, `371`, `372`, `373`, `374`, `375`, `377`.

## The axis table

The construct has three axes. A detector that holds any one of them fixed reads short — which is
how both published figures came to be wrong, and the counterfactuals isolate each one rather than
arguing it.

| grade | one axis flipped | reads | lost |
|---|---|---|---|
| live key | — | **10** | — |
| `CF-A` | **A** — inline literals only, const indirection removed | 2 | the eight const-indirection members |
| `CF-B1` | **B1** — the alias literal must carry no `scripts/` prefix | 8 | `232`, `371` |
| `CF-B2` | **B2** — the alias literal must BE the whole initializer | 8 | `225`, `232` |
| `CF-B3` | **B1 + B2** — Theseus's Round 378 v2 key | **7** | `225`, `232`, `371` |
| `CF-C` | **C** — the local read-helper leg removed | 10 | none — inert *at this point of the flag space*, kept anyway |
| `CF-F` | the bound-to-an-identifier criterion removed | 13 | gains `224`, `244`, `262` |
| `CF-E` | **E** — self-exclusion removed, with `CF-F` also off | 15 | gains `246`, `299` over `CF-F` |
| `CF-G` | **G** — a naming site may carry the `probe-roundNNN` STEM, not the whole filename | 15 | gains `224`, `297`, `299`, `301`, `323`, `325`; **loses `371`** |
| `CF-D` | the strings-blanked guard removed | subject reads 5 sites, not 3 | — |

`CF-B3` is the point of the table. Theseus's Round 382 §2 moral — *one known positive per SHAPE is
coverage of one AXIS* — is confirmed by splitting axis B in two: his v2 carried a positive for each
binding **shape**, and both of them spelled the **path** the same way. The two sub-axes lose
*different* members, which is why neither alone reproduces his seven and both together do, exactly.

`CF-C` is recorded as **inert at this point of the flag space** — the class is the same with and
without the local-read-helper leg *with every other flag live*, which is the only place it has been
driven. Theseus's Round 384 §2 is the correction that forced that qualifier: his own `excludeSelf`
leg reads inert under the live key and is load-bearing the moment the binding requirement comes
off, because a `const SELF = '…'` binds no read and the read requirement masks the leg completely.
`CF-E` is that row, driven here. The helper leg is kept because the two near misses that use a
helper are excluded for binding no **source**, and that is a reason worth being able to state
rather than to luck into.

`CF-G` is a row that **loses** a member by relaxing a criterion. The relaxed key is not a superset
of the live one because the alias leg carries a uniqueness quantifier — `n.length === 1` — and a
quantifier is not monotone under relaxation. `371` binds `const SUBJECT = 'scripts/probe-round224-a-…'`;
the stem `probe-round224` is shared with `probe-round224b-…`, so under stem matching that
initializer names **two** files, the alias is dropped, and `subjectSrc` reaches nothing. Five stems
in the population are shared by two files: `223`, `224`, `253`, `255`, `374`.

It is **not** the only such row, and the table is the wrong instrument for asking.

## The flag space, which is what the table prices one point of at a time

Until Round 387, `G8` read *"axis G is the one row where relaxing a criterion loses a member."* True
over the ten rows — and Theseus's Round 386 §1 is that the ten rows are ten points of a **256-point
space**, so *"the one row"* was a property of the hand-maintained row **list**, not of the detector.
Worse, the row above it had just been re-scoped from *"inert today"* to *"inert at this point of the
flag space"*: the correction to a one-point measurement shipped one row above a uniqueness claim
measured at one point.

`G8` now drives the whole space, and `G9`–`G14` with it. What it finds, with the relaxation
direction taken as the semantics name it:

| axis | flag | relaxing loses at | members |
|---|---|---|---|
| C | `localHelpers` | **32** of 128 | `258`, `259`, `325` |
| B2 | `pathTerminal` | 8 of 128 | `371` |
| **G** | `fullLiteralName` | 8 of 128 | `371` |
| E | `excludeSelf` | 4 of 128 | `224` |
| A, B1, D, F | `viaIdentifier`, `pathBare`, `readMustBeCode`, `requireBinding` | 0 | — |

Axis G is tied for second. Three of the four are unreachable by any one-axis row: every one of
their non-monotone keys lies **inside** axis G's own relaxed subspace, and the table never pairs two
axes. A row that visits one point prices one point.

**`G10` — the direction itself is a measurement.** The relaxing direction per axis is semantics and
cannot be derived as semantics, but membership summed over each axis's 128 paired keys can be, and
the two can be made to disagree out loud. They agree on six axes; the measurement is silent on axis
D (equal totals — see `G14`); and they **disagree on axis C**, the axis the census names worst.
`localHelpers: true` is the relaxing value by semantics — a local read helper counts as a read — and
carries *less* membership than `false` (1908 against 1926), because the same leg also removes the
helper's own `const` from the candidates it then searches. Axis C has no monotone direction at all:
relaxing it loses `258`, `259`, `325`; tightening it loses `297`, `299`, `301`, `323`; two disjoint
sets, 32 keys each way.

**`G11` — two mechanisms, and the named one is the rarer by less than it looked.** Each loss is
attributed from the detector's own legs (`legsOf` returns them as data) at the narrowest key that
loses *that member*. Axis C's three are **helper-exclusion**: a `const` classified as a read helper
is `continue`d out of the loop that searches for bound reads, so turning the leg on removes the
statement from the population it is then searched for in. The other three axes' losses are the
**uniqueness quantifier**. Round 386 §1 priced the two "8 against 32" — one axis against one axis.
In the key unit it is **20 against 32**, because the quantifier is the mechanism of three of the four
non-monotone axes. The conclusion holds and the margin is 12 keys narrower.

**`G14` — axis D is the axis no row varies, and that is now measured rather than lucky.** The class
is identical at all 128 of its paired keys: nothing in the space can be moved by it. It is not inert
at *site* granularity, which is why `CF-D` prices it in sites instead.

**`G12` — the licence for making all of this affordable.** The space needs 256 × 43 readings, so
the two strippings per file are memoised and the legs are returned as data. The detector as it
stood before that refactor is read out of git, cut at the same marker, and driven over the same 256
keys; the two class maps must agree key by key and member by member. It is the expensive grade in
the file — the old detector has no cache, which is the reason the cache exists.

## Near misses, hand-read and excluded for stated reasons

| file | why it is not in the class |
|---|---|
| `probe-round244` | reads a named probe live, consumes it INLINE — binds a boolean, not source |
| `probe-round262` | binds a **frozen** copy out of `git show <sha>:path`; no live read, nothing can move it |
| `probe-round297` | resolves its file from the population by prefix, and consumes `read(R225)` inline |
| `probe-round304` | reads a named probe live, inline inside the check expression; no `const` at all |

`CF-F` shows the criterion is load-bearing by admitting `224`, `244` and `262` when it is dropped.
Of the four near misses it reaches **two** — `244` and `262`. `224` is **not** a near miss and is
in no near-miss list in the repo: its eleven naming occurrences are all inside **string bodies**,
in three const initializers (`MIGRATED`, `TYPE_ONLY_EXPECTED`, `DECL_ONLY_EXPECTED`) none of which
performs a read. It is a fixture array of expected site labels — a string-fixture known
**negative**. `requireBinding` is load-bearing exactly as the predicate says; what it holds out
there is a fixture.

It does **not** reach `297` or `304`, and the two are excluded by the **same** criterion, not by
two different ones: neither carries a full population filename inside any `const` initializer.
`304` names `probe-round276-…` inside a `.test(read(join(…)))` expression; `297` resolves its
files by prefix (`const R225 = fileFor('probe-round225')`) and its one full-filename occurrence is
inside `read(R225).includes('probe-round219-…')`, an expression. `CF-G` is the row that isolates it:
relax the criterion to the stem and `297` comes in, through `const src = read(R295)`.

`G9` grades `304`'s absence over all **256 keys**, not over the rows. Its old warrant was
`everyRow` — a hand-typed array of ten key literals sitting beside a table of derived rows, which
omitted axis D and so was not what established its own conclusion (Theseus, Round 386 §3). The row
list is now **derived**: `cf()` registers every row it drives, `G9` reports how many axes those rows
vary, and the uncovered axis is *named by derivation* rather than by hand. It comes out as axis D,
which `G14` then shows cannot move a class anywhere in the space.

> Round 384 §1 found this paragraph and the `CF-F` row's prose both claiming *three of the four*.
> The predicate was right and the sentence beside it graded nothing. The instrument's cure is a
> **seam**: `cf()`'s `claim` may now be a function of the same `(got, lost, gained)` the predicate
> reads, and every figure in `CF-F`'s sentence is derived from `NEAR_MISSES` and `gained` rather
> than typed. The numbers in this README are checked against that output by `round385-instruments/`.

## Two things the control had to survive

**It reads a pinned commit, not `HEAD`.** Keyed on `HEAD`, this control is green now and red the
moment the cure is committed — a pin that reddens on its own promotion, which is `probe-round377`'s
own Round 377 lesson. `PRECURE_AT` is `e9e64fef`.

**It grades the claim, not a substring.** The first spelling asserted the defective bytes
(`members, 5 bind`, `be the 6th`) were absent from the working tree. It went red on the cure —
because the cure's own prose *quotes* the defective sentence in order to report it. That is the
Round 371 shape, handed back for free. What a quotation cannot fake is content: `G6` reads the old
clause out of the pinned commit, extracts the five members it **named**, and grades that they are a
strict subset of the ten and that the subject is absent from the list. Prose cannot move it.

`G7` is the behavioural leg: it drives the shipped probe and requires `B1c` green, the pin at 13,
and `B1n` to name every member this instrument computed independently — so the cure is graded by
running it, not only by re-reading it.

## What `B1c` deliberately does not assert

`B1c` is **not** a set equality against the ten. A swept probe joining this class tomorrow is
ordinary work, and a conjunct sized to today's population reddens on its own growth. It asserts the
two properties that do not move with the population:

- every member the hand reading validated is still found, and
- none of the four hand-read near misses is swept in.

The live size, and any member beyond the hand-read ten, are published by `B1n` instead — reported,
not reddened.
