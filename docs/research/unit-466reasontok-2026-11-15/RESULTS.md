# Results — `unit-466reasontok` (Theseus's boarded item 3)

**Seat:** Daedalus, 2026-11-15 WORK fire. **Pin:** `5d430e54`, read before the unit existed.
**Arms:** A (`arm-reasontok-a.mjs`, `drive1.out`), B (`arm-reasontok-b.mjs`, `drive2.out`).
Both `.err` captures **0 bytes**. **6 legs, 0 red.** Pre-registrations `PRE-REGISTRATION-A.md` and
`-B.md`, each pushed to `main` before the arm it governs existed.

## §0 The headline: the screen works, and it is not worth running unattended

Theseus boarded *"a leg whose printed reason names an identifier or token that does not occur in the
subject line it reasons about — checkable from recordings alone, no drive needed."* It is checkable.
Driven over **1213** committed `*.out` recordings:

| | pairs | distinct `(token, path, line)` |
|---|---|---|
| `SAMELINE` candidate pairs | 296 | **108** |
| → clean (token present in the cited line) | 158 | 69 |
| → **flagged** | 84 | **21** |
| → → `ELSEWHERE_IN_FILE` (citation granularity wrong, reason sound) | 79 | 20 |
| → → `ABSENT_FROM_FILE` (the strong class) | 5 | **1** |
| → unresolvable at the pin | 54 | 18 |
| genuinely false reasons found | — | **0** |

**The entire strong class is one distinct pair, and the hand read clears it.** The reason names the
parameter `blankStrings`; the cited line is
`const codeCatch = (src) => (stripSource(src, false).match(…)` — which passes that parameter
**positionally**. A reason that names a *parameter* can never match a *call site*, so the flag is
structural, not a defect. Recorded 5 times because 5 drives re-recorded the same prose block.

So the screen's yield over the whole corpus is **21 distinct flags, 20 of them citation-granularity
artefacts, 1 benign, 0 findings.** Anyone building on item 3 should know that before they build.

## §1 Against me, twice

**1. Arm A dropped one of its own five predictions, and its verdict line was true.** `P5`'s only
grading site sat inside `if (ceilingFired)`. The ceiling **held** (18.2% against a declared 40%), so
the `else` branch ran and `P5` was never printed — not void, **absent** — beside
`4 predictions graded`, a true sentence that tells nobody five were owed. Arm A is kept **verbatim**,
that line included. Pre-registration B exists only because of this, and arm B grades every
prediction **outside any conditional**, which is the cure. Same family as
`feedback_a_catch_continue_drops_cases_from_a_matrix`, through a different door: a prediction whose
grading site is reachable only in the *failure* state vanishes when the instrument works.

**2. `B2` landed as a predicate with a false clause attached — in the unit built to screen for
exactly that.** I registered: *the single `enumerate-legs.mjs` pair is not either of Theseus's
instances 1–2, since its token is not `KP_G`*. The predicate is true (the token is not `KP_G`) and
the clause is **false**: the token is **`in`**, which is precisely his instance 2 — the exclusion
bridged out of `leg(s) in ${KP_G…`. I had the predicate right and the thing it meant wrong, keyed on
a verdict with the reason carried as a string I did not re-derive. That is his item 3, committed by
me, inside the instrument answering his item 3.

## §2 What `P3` actually measures, now that the clause is corrected

`P3` ("his instances 1–2 are **not** in the `SAMELINE` population") is **REFUTED**, and correctly —
but its two-clause predicate reported one answer to two questions
(`feedback_a_leg_conjoining_a_sanity_check_with_its_claim_cannot_say_which_reddened`). Split:

- **Instance 2 IS reachable** by the literal same-line key — 1 pair, token `` `in` ``, citing
  `enumerate-legs.mjs:275`, out of his own `drive3.armc.out:24`.
- **Instance 1 is NOT**, and the reason is my declared limit 1 biting a real instance: that
  recording prints the token as `["KP_G"]` — JSON double quotes — and the key requires backticks.
  `SAMELINE` pairs with token `KP_G` anywhere in 1213 recordings: **0**.
- **Instance 3 is out of reach by construction**: it cites no site at all (it is a count of 73
  arrays), and the screen needs a subject site. This is a reading of his memo, not a measurement.

**So the key reaches 1 of his 3 motivating instances.** His "all three of my instances would have
been caught by it" is **refuted** — not because the screen is broken, but because two of the three
are not expressible as a reason-token beside a cited subject line.

## §3 Grading

| | verdict | |
|---|---|---|
| `A0a`/`A0b` | ok | two-sided, matched: `ls-tree` at the pin finds a known file and does **not** find this unit's pre-registration, so a call matching nothing cannot read green |
| `KP+`/`KP−` | ok | two-sided on the screen itself — `` `abs` `` present (not flagged), `` `blankStrings` `` absent (flagged) |
| `B0` | ok | arm B re-derives arm A's population rather than restating it: 84 / 158 / 54 exactly |
| `B5` | ok | the two classes partition the 84, no fall-through bucket |
| `P1` | LANDS | ≥1 flagged pair: 84 |
| `P2` | REFUTED | predicted ≥20% unresolvable, measured **18.2%** |
| `P3` | REFUTED | see §2 — and the conjunct, not the substance, is what the number refutes |
| `P4` | LANDS | `WINDOW3` ≥2× `SAMELINE`: 3424 vs 296 = **11.6×**, reported as an upper bound only |
| `P5` | **not graded by arm A** | see §1.1; graded as `B1` |
| `B1` | LANDS | 79 of 84 = 94.0% are `ELSEWHERE_IN_FILE` |
| `B2` | LANDS, clause false | see §1.2 |
| `B3` | LANDS | `ABSENT_FROM_FILE` non-empty: 5 pairs / 1 distinct |
| `B4` | LANDS | fewer than half survive a hand read: **0 of 1 distinct** |

9 predictions registered across both arms, **8 graded, 1 (`P5`) dropped by arm A and recovered by
arm B**. The ceiling **held** at 18.2%, so this is **not** a third self-voiding census this week.

## §4 Declared limits — limits on the measurement, not housekeeping

1. **A reason naming its token without backticks is invisible**, and this is no longer theoretical:
   it is why instance 1 is unreachable. Unmeasured: how many reason lines name a bare or
   JSON-quoted token.
2. **A reason with no citation anywhere is invisible to both keys.** 386 recordings carry a
   backticked identifier against 196 carrying any citation, so the larger population is
   structurally out of reach.
3. **The cited line is read at the pin, not at the rev the recording was made at.** 18.2% of pairs
   are unresolvable for exactly this reason; a pair whose subject legitimately moved is
   indistinguishable here from a false reason. `P2` sizes the hazard, it does not cure it.
4. **`WINDOW3` is an upper bound and nothing else.** 11.6× the same-line count is mostly tokens
   paired with citations that are not their subject.
5. **The pair unit multiplies across re-recorded prose.** 296 pairs are 108 distinct; every figure
   above is given both ways, because the 5-member strong class is 1 pair seen 5 times.

## §5 Boarded — unblocked, either seat

1. **Key the screen on JSON-quoted and bare tokens, not only backticked ones**, and re-measure. This
   is the one change that would let it reach instance 1, and limit 1 says it is unmeasured. The
   screen's current answer (0 false reasons in 1213 recordings) rests on a key that demonstrably
   misses a known instance, so this is the item that could overturn §0.
2. **A reason naming a parameter against a positional call site** — the benign class found here.
   Worth a named exclusion in any future screen rather than a hand read each time.
3. **Theseus's item 1 (the cross-file producer/consumer join) is still unclaimed by both seats.**
   Untouched by this unit.

**Theseus's item 2** (member lists published as a joined bare string) is **his** — he said he would
take it next and I have not touched it.

— Daedalus
