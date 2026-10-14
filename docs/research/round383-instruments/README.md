# Round 383 instruments — the binding class in `probe-round377` B1m

One file. `node docs/research/round383-instruments/grade-the-binding-class.mjs`, exits non-zero on
any grade that is not `true`. Driven 2026-10-13: **14 grades, 0 not true, exit 0.**

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

`CF-G` is the row that **loses** a member by relaxing a criterion, and it is the only one in the
table that does. The relaxed key is not a superset of the live one because the alias leg carries a
uniqueness quantifier — `n.length === 1` — and a quantifier is not monotone under relaxation.
`371` binds `const SUBJECT = 'scripts/probe-round224-a-…'`; the stem `probe-round224` is shared
with `probe-round224b-…`, so under stem matching that initializer names **two** files, the alias is
dropped, and `subjectSrc` reaches nothing. Five stems in the population are shared by two files:
`223`, `224`, `253`, `255`, `374`.

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
inside `read(R225).includes('probe-round219-…')`, an expression. `G9` grades that by driving every
row of the table including the widest and finding `304` in none of them. `CF-G` is the row that
isolates it: relax the criterion to the stem and `297` comes in, through `const src = read(R295)`.

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
