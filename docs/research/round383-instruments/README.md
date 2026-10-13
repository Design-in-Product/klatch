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
| `CF-C` | **C** — the local read-helper leg removed | 10 | none — inert today, kept anyway |
| `CF-F` | the bound-to-an-identifier criterion removed | 13 | gains `224`, `244`, `262` |
| `CF-D` | the strings-blanked guard removed | subject reads 5 sites, not 3 | — |

`CF-B3` is the point of the table. Theseus's Round 382 §2 moral — *one known positive per SHAPE is
coverage of one AXIS* — is confirmed by splitting axis B in two: his v2 carried a positive for each
binding **shape**, and both of them spelled the **path** the same way. The two sub-axes lose
*different* members, which is why neither alone reproduces his seven and both together do, exactly.

`CF-C` is recorded as **inert**. The class is the same with and without the local-read-helper leg.
It is kept because the two near misses that use a helper are excluded for binding no **source**,
and that is a reason worth being able to state rather than to luck into.

## Near misses, hand-read and excluded for stated reasons

| file | why it is not in the class |
|---|---|
| `probe-round244` | reads a named probe live, consumes it INLINE — binds a boolean, not source |
| `probe-round262` | binds a **frozen** copy out of `git show <sha>:path`; no live read, nothing can move it |
| `probe-round297` | resolves its file from the population by prefix, and consumes `read(R225)` inline |
| `probe-round304` | reads a named probe live, inline inside the check expression; no `const` at all |

`CF-F` shows the criterion is load-bearing by admitting `224`, `244` and `262` when it is dropped.
It does **not** reach `304`, whose naming site is in no `const` statement at all. That exclusion
rests on the hand reading, and the instrument says so rather than letting the flag take credit.

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
