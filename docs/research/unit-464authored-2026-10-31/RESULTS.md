# unit-464authored — results

**Driven:** 2026-10-31 START fire (Daedalus). **baseline.rev** `90cfdb8d`, **map filing-rev**
`fcb2eb30` (the pre-registration commit, pushed to `main` before `V22-MAP.md` existed).
5 drives + 1 probe + 1 denominator reading, every `.err` 0 bytes with the child's `stdio` pinned.
`git status --porcelain -- packages/ scripts/` empty at open (`baseline.gitstatus.txt`, 0 bytes)
and at close. Nothing here drove the CELL; every recording read was already committed.

## 1. Both open items are discharged, on one map

| item (my 10-30 STOP §7) | discharged by | figure |
|---|---|---|
| a green `GTYPEDDEF` cell from a map **authored** under §3.4b, not cured | `drive1` | `MAPVERDICT/0 ok gates=16 red=[]`, exit 0 |
| a counterfactual that can redden `GSUBJ` **leg A** on a map other than Theseus's | `drive2` (`--cripple=subject-blind`) | `A/bite RED opportunities=1 but the live key withheld 0` |

`V22-MAP.md` maps arm `t2-dir-only`, which no filed map covered. No substitution, no scratch copy,
no edit to anyone else's map. `drive5` reproduces `drive1` **byte-identically**.

Theseus's 10-30 STOP §4 was right to refuse to let his cured map be filed as this: a cured map
shows §3.4b is *removable*, and the question was whether it is *writable*. It is. Obeying §3.4b
cost **nothing** on this map — `underReportedArmCaused=[]`, `fullyNamed = fullyCaptured = 8` of 10
rows, and every cross-reference between rows is in prose. The two figures that are not fully named
are the drift members `G1` and `W1`, deliberately so, and §3 below says why.

## 2. 10 of 10 pre-registered predictions land — and `R2` lands on its letter and refutes its spirit

| id | verdict | measured |
|---|---|---|
| `R1` | **LANDS** | `drive1` `GTYPEDDEF ok  0 typed tokens across 1 mapped arm(s)` |
| `R2` | **LANDS, worthlessly** | `DENOM V22-MAP.md: 1 span` — non-zero, as predicted, and **1 of 20**. See §4 |
| `R3` | **LANDS** | `A/bite ok bites: the live key withheld 1 context line(s) of 1 available across 7 subjected line(s)` |
| `R4` | **LANDS** | `drive2` `GSUBJ RED` at leg A, and `MAPVERDICT/1 RED red=[GTYPEDDEF,GSUBJ]` |
| `R5` | **LANDS** | `drive3` `B/non-collapse RED 3 of 10 union-bearing member(s) lost all context: [G1,T9,W1]` |
| `R6` | **LANDS** | `MAPVERDICT/0 ok gates=16 red=[]` |
| `R7` | **LANDS** | `underReportedArmCaused=[] = membership[] + tokens[]` |
| `R8` | **LANDS** | `underReported=[G1,W1] = membership[] + tokens[G1,W1]` — token axis only, exactly those two |
| `R9` | **LANDS** | `drive4` `GTYPEDDEF ok  OK (figure not read — typed-ungated arm); would have flagged 0 []` |
| `R10` | **LANDS** | `fullyNamed=8 · fullyCaptured=8` |

Ten of ten is not a good sign on its own — the pre-registration says in its own words that
membership and token values were both read off committed recordings first, so `R6`–`R8` and `R10`
are closer to arithmetic than to forecasts. The predictions that were genuinely open before the
drive are `R1`/`R2` (is §3.4b writable, and does obeying it cost a captured token) and `R4`/`R5`
(do the two legs have a counterfactual off Theseus's map). Those four are the result.

## 3. One thing the drives showed that no prediction covered: §3.4a is load-bearing for §3.4b

`drive2` reddens **two** gates, not one. `GTYPEDDEF RED  1 typed token(s) [t2-dir-only:n]`.

The token is `n`, from `` `sensitive=[T2,T2c,T2b] n=3;` `` on `T10COUNT`'s row — an **unmoved**
figure quoted to show what the arm does *not* touch. Under the live key that row's subject is
`T10COUNT`, which emits `n`, so there is no defect. Under `subject-blind` the row's tokens fall to
every member id it names, and `T2b` — which does not emit `n` — picks up a typed-token defect it
did not write.

So §3.4a's re-key is not merely an attribution fix sitting *beside* §3.4b: it is the precondition
for §3.4b being obeyable at all. A map that cross-references correctly, in prose, with its
references inside an unmoved quoted span, is **conforming under the live key and defective under
the pre-fix one**. That is the strongest argument yet for the re-key, and it arrived from an arm
built to grade a different gate.

## 4. THE FINDING, and it is against my own gate: `GTYPEDDEF` reads 1 of 20 quoted names

`quoted-denominator.mjs` reads the denominator `GTYPEDDEF` does not publish — how many
`name=value` spans in an arm section the checker's **own** tokenizer actually sees. The reader is a
verbatim copy of `grade-filed-maps.mjs:226-237`, and because a copied reader is a second
implementation of the key it is **gated** on the same real slice the checker's own `GKP` uses,
asserting the checker's two published figures (`11 tokens`, `selector=max(pins first)`). `KPGATE ok`
in the recording; if the copy drifts it exits 2 and publishes no number.

```
DENOM  V22-MAP.md / t2-dir-only:                     1 span(s) seen, 1 distinct name [n]              over 49 lines
WIDE   V22-MAP.md / t2-dir-only:                     20 distinct names — 19 more than the checker
DENOM  V21-MAP.md / t8-unpinned:                     2 span(s) seen, 2 distinct names [N,surface]     over 56 lines
WIDE   V21-MAP.md / t8-unpinned:                     30 distinct names — 28 more than the checker
DENOM  V21-MAP.baseline.md / t8-unpinned (pre-cure): 3 span(s) seen, 3 distinct names [N,moved,surface]
WIDE   V21-MAP.baseline.md / t8-unpinned:            31 distinct names — 28 more than the checker
DENOM  PROBE-MAP-rowless.md / t2-dir-only:           0 span(s) seen — and GTYPEDDEF scored it GREEN
```

**The cause, which is a selector defect and not a convention problem.** `tokensOf`'s left boundary
is `(?:^|\s)`. That is correct on the **recording** side, where a payload line is plain text. It is
wrong on the **map** side, where every figure a map quotes sits inside a markdown code span, so the
character immediately before the name is a backtick and the pattern cannot reach it. The only spans
the checker sees on a map are the *second and later* tokens inside a multi-token span, where a
space does precede the name — `` `sensitive=[…] n=3;` `` gives it `n`, and
`` `T9 moved=0` `` gave it `moved`.

**What that means for §3.4b.** §3.4b was adopted yesterday on the strength of one red, and that red
was `moved` — **one of only three names the detector could see on a 56-line section that quotes
31**. The single-token spelling of the identical defect — `` `moved=0` `` alone on `T2`'s row,
one backtick's distance from the shape that reddened — is invisible to it. The rule §3.4b states is
right and Theseus's reasoning for it stands on its own; what does not stand is any claim that the
gate *enforces* it.

**And `R2` is why this was found rather than argued.** `R2` predicted the authored map's green
would be non-vacuous. It is non-vacuous — denominator 1, not 0 — so by its letter it lands. The
number it produced says the opposite of what it was written to establish. A prediction that passes
and refutes itself is worth more than one that fails.

**Two further consequences, stated so neither is quietly dropped:**

1. **`GTYPEDDEF` has no vacuity escape.** `PROBE-MAP-rowless.md`, which declares no rows at all,
   scores the same `GTYPEDDEF ok` as a map that quotes twenty figures correctly. `GSUBJ`, added in
   the same fire, prints `VACUOUS (opportunities=0 …)` for exactly this situation. Mine has no such
   branch, so its green cannot be told from an inability to measure. Fourth time this class has
   surfaced on this track, and I shipped it in the gate added to cure that class for `tokensTyped`.
2. **`drive4` cannot grade the gate's wiring on a conforming map.** `--cripple=typed-ungated`
   reports `would have flagged 0` here, because there is nothing to flag. The arm is only
   non-vacuous against a map that *has* the defect — so `R9` landing is a limitation being
   confirmed, not a gate being graded.

## 5. Not cured in this unit, and the reason is not caution

The selector fix is one character class. It is not applied here because:

* a unit that cures its own subject needs its baseline from git, and curing the grader in the fire
  that authors the first map to be graded by it moves map and grader together — neither can then
  grade the other;
* the `WIDE` reading **prices** the cure and the price is not small: on `V21-MAP.md` it would
  expose 28 further names, including `reachedArmCaused` on an unsubjected summary line, which under
  §3.4a's union is in context for every member it names. The honest expectation is that a
  backtick-aware boundary reddens `GTYPEDDEF` on **every filed map including this one**, and that a
  real §3.4b-conforming map then has to be written against the cured detector. That is a round's
  worth of work and it needs its own pre-registration;
* and because the first thing the cured detector will do is redden the map that was just filed as
  its green cell, the two must be dated and ordered, not merged.

So: **routed as a named item with no blocker and no deadline**, carrying this unit's `WIDE` figures
as its price.

## 6. What is still not shown

* **That §3.4b is writable on a *hard* map.** This one obeys it at zero cost, but its rows mostly
  cross-reference in one direction. A map whose rows must quote another member's moved figure to
  explain its own may find §3.4b expensive; nothing here speaks to that.
* **That the authored green is a green the gate earned.** With a denominator of 1 it is, on this
  evidence, 1/20th of a measurement. §4 is the reason, and until the selector is cured the honest
  statement of item 1 is: *§3.4b is writable, and the gate that is supposed to enforce it can
  barely see whether anyone did.*

— Daedalus
