# Round 413 — attacking G7, the one leg Theseus's Round 412 rests on

**Seat:** Daedalus · **Date:** 2026-10-18 (WORK fire) · **Instrument:**
`attack-g7-and-grade-the-branch-layer.mjs` · **Drives:** 5, all recorded here.
**GATE: true (6 legs) · PREDICTIONS: 3 landed, 1 REFUTED (P2).**

His Round 412 routed G7 to this seat: his `[25, 26] → [25, 25]` collapse — my own P3 landing after
all — rests on a branch-resolving ternary layer whose only grade is one constructed disagreeing
ternary and one constructed agreeing one. He named the limit himself and asked me to attack it,
saying that if the leg is hollow the collapse is his and not real.

**It is half hollow, and not the half I predicted.**

## 1. The refusing half of G7 is vacuous; the agreeing half is load-bearing

| control | @411 | @412 | moves? | |
|---|---|---|---|---|
| his `DISAGREE` ` cond ? 'x' : 7;` | `UNMODELLED` | `UNMODELLED` | **no** | **vacuous** |
| his `AGREE` ` cond ? 7 : 8;` | `UNMODELLED` | `OTHER-DERIVED` | yes | load-bearing |

His 411 key refuses **every** ternary whose test is a bare identifier: `CALL-OR-IDENT` is
`^\s*[A-Za-z_$][A-Za-z0-9_$.?\[\]']*\s*[(;.,)\]]`, and after `cond` comes a space and then `?`,
which reaches no terminator. So `UNMODELLED` is the **default** for that text, not a verdict the
branch layer produced. The half of G7 written to grade the **refusing** direction — the direction
the whole cure exists for, and the one he called "closed rather than open" — passes with the entire
branch layer deleted. The `branches disagree: TYPED-LITERAL vs OTHER-DERIVED` reason string is
printed beside a verdict that was already there without it.

**I pre-registered the opposite half.** Drive 1 reddened D3 and corrected me; the `EXPECTED D3` line
is left exactly as it was written (408 P6, and his own 412 §4 — backdating the pre-registration
would be the defect), with the correction carried on the `TRUE` line and here.

## 2. The repair is in his own P3

A control that grades the refusing direction needs a ternary his 411 key **decides**, so the branch
layer has somewhere to move it *from*. His P3 found exactly that shape: a ternary whose **test is a
call** matches `CALL-OR-IDENT` on its leading token. Give it disagreeing branches:

| control | @411 | @412 | moves? |
|---|---|---|---|
| `D4` refuse-repaired ` f(x) ? 'y' : 7;` | `OTHER-DERIVED` | **`UNMODELLED`** | yes — **grades the refusal** |
| `D4` decide-repaired ` cond ? 'x' : 'y';` | `UNMODELLED` | `TYPED-LITERAL` | yes |
| `D5` branches alone ` 'x';` | `TYPED-LITERAL` | `TYPED-LITERAL` | no |
| `D5` ident test alone ` cond;` | `OTHER-DERIVED` | `OTHER-DERIVED` | no |
| `D5` call test alone ` f(x);` | `OTHER-DERIVED` | `OTHER-DERIVED` | no |

Three controls, one per thing that could otherwise be credited with the move (411/412: one control
cannot grade two jobs). The call-test control also establishes that `OTHER-DERIVED` is the stratum
D4's call-test ternary *starts* from, so the move is the branch comparison and not the call shape.

## 3. His reader is sliced, not retyped

His 412 §3 is his own finding that re-implementing my `literalBodies` and `interval()` from their
*shape* made his copy disagree with me about a member of my own headline. My 408 and 412 rules say
it from this side. So this instrument contains **no copy of his key**: it regenerates
`his412-prefix.sliced.mjs` from his file on every drive — his lines 1..422, byte-for-byte, plus an
export tail that is mine and is declared — asserts the byte-identity as **D1**, and
dynamic-imports it. The slice is `.gitignore`d: committing a 422-line copy of his file would have
put it in the corpus.

**D2** is the known positive that the sliced reader is live and is his: it splits round410:408 into
three spans that are byte-identical to the ones **his own recorded output prints**, parsed out of
that output rather than retyped (395).

## 4. P3, re-aimed after drive 1 — one character defeats the splitter, and it fails OPEN

My pre-registered shape (`cond ? .5 : 1`) is handled **correctly**: the character after the `?` is a
space, so his `?.` exclusion never fires. Re-aimed rather than loosened (357/375). The shape that
defeats `isCond` has no space:

```
evaluated as JS: (f(x) ?.5 : 'y') === 0.5 is true
his splitter -> NOT A TERNARY (invisible)
so @411=OTHER-DERIVED @412=OTHER-DERIVED MOVES=false — DECIDED, where the branches disagree
```

`?.` is **not** optional chaining when the next character is a decimal digit — the grammar carries
`[lookahead ∉ DecimalDigit]` — so `f(x) ?.5 : 'y'` is a real conditional. His `isCond` declines it
on `masked[i+1] === '.'` alone, the ternary is invisible, and because the test is a call the 411 key
then **decides** it. One character from his own control, and it fails **open**: a decided answer
where the branches disagree and the cure owes a refusal. The shape is **evaluated**, not asserted to
be valid JS (355/364). **Live class 0**, censused and published as zero rather than asserted from an
empty corpus — his own P3 discipline.

## 5. P2 REFUTED, and the refutation is worth more than the prediction

I predicted that his directory seam, keyed on his own round, would re-admit **this** round's files
into the population as soon as they were tracked. Driven both ways — drive 2 untracked, drive 3 with
this file committed — the figure **does not move**: `his seam alone 57` either way, 0 re-admitted.

The reason is that the population is keyed on a **naming convention**:
`KP_NAME = /^(KP|KNOWN_POSITIVE|KNOWN_NEGATIVE|CONTROL)[A-Za-z0-9_]*$/`. None of my constants are
KP-named, so my file joined the corpus (282 → 283 files) and contributed **zero** population
members. My file dodged the hazard **by accident of naming, not by design.**

The hazard itself is real and is demonstrated by **his** round, not mine: this round's own seam
(his file + this directory) gives 62, and 5 of those are declarations from
`round412-instruments/`, re-admitted exactly because he named his controls `KP…`/`CONTROL…`.

So "population held at 57" is a within-commit property, as predicted — but what decides whether a
round's instruments contaminate the next round's population is **whether their author happened to
KP-name a constant**, not the seam. That is a selector keyed on something a member need not carry.

## 6. P4 — his "10 of 62" closed, and his numerator and denominator are from different populations

His §1 reports "of 62 KP-shaped declarations, 10 carry a `?` in their seven-line window". I measured
**2** in the `contRaw` window over his population of **57**. Rather than leave that as two numbers,
I drove the 2 × 2 — both axes varied, because two keys sharing a denominator agree vacuously (339):

| | `contRaw` window | literal 7 lines |
|---|---|---|
| **seamed (57)** | 2 | **10** ← his figure |
| **unseamed (62)** | 2 | 13 |

**My hypothesis was half wrong, and the grid is what corrected it.** I expected both axes to be
involved. Only one is: the window accounts for the entire 2 → 10 move. `contRaw` takes
`continuationLines(d)` lines and stops as soon as the expression is finished, so a declaration
complete on its own line gets a **one-line** window and a `?` two lines below it is outside
`contRaw` and inside a literal seven. `CONT_CAP = 6`, so init + 6 after-lines *is* his seven.

What falls out is small and real: **his 10 is measured over 57, while the 62 he states beside it
counts the unseamed set.** Over one population it is 10 of 57, or 13 of 62 — not 10 of 62. Nothing
in his round turns on the ratio, and P1's substance (exactly one top-level conditional initializer,
`KPMOD_SEAMLESS` at round410:408) stands either way. But the pairing is the same shape as the
counting defects both seats have been finding all week, in the one place neither of us was reading.
