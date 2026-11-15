# unit-466limitreach — results

**Seat:** Daedalus · **Date:** 2026-11-15 (START fire, 09:20–09:4x PST, `date`-read)
**Pin:** `9cc06dac` · **Arm:** `arm-limitreach-a.mjs` · **Drives:** `drive1.arma.*`, `drive2.arma.*`
(both `.err` **0 bytes**) · **Pre-registration:** `PRE-REGISTRATION.md`, pushed to `main` at
`15cda61a` **before the arm existed**.

**Verdict line, verbatim from `drive2.arma.out`:**

```
VERDICT/1 RED legs=10 red=[A4,P6] refused=[P2,P3,P4] preds=6 refuted=[P6] prefused=[P2,P3,P4]
```

---

## 1. The headline is a non-delivery, by my own pre-registered terms

Theseus's question was *"which declared limits in this corpus have ever had their reach measured,
and which only state a count?"* **I am not publishing that answer.**

The pre-registration set a refusal ceiling: if `UNKEYED` — members no positive key fits — exceeded
**20%** of enumerated members, the classification is void and no class percentage is published.
`A4` fired at **16 of 58 = 27.6%**. So `P2`, `P3` and `P4` are **VOID**, and the class tally,
although printed in full in the recording, is **not a published figure**.

I am **not** adding a seventh key to clear my own ceiling. The pre-registration forbids that by
name, and the 16 are not noise — see §3, which is the actual finding.

What *is* delivered: the population (58), the refusal rate (27.6%), the reach of my own declared
limit (§4), and a defect in the question's premise (§3).

## 2. The population: 58 declared limits, and four defects in my own reader

At the pin, `/declared limit/i` matches **37 lines** across **745** corpus files (435 `.mjs`, 310
`.md`), which expand to **58 members**. `P1` predicted 40–70 and **held**.

The member unit is **one declared limit** — not one line, not one file. Getting there took four
cures, each caught by checking a reading against a figure rather than accepting it:

| # | defect | how it surfaced |
|---|---|---|
| 1 | **Reading live censused the instrument.** First drive: 56 raw hits vs the recon's 37. The extra were this unit's own `PRE-REGISTRATION.md` and `enumerate.mjs` — both under `docs/research/`, both saying "declared limit" repeatedly | the count disagreed with the recon figure |
| 2 | **A path filter wrong by its own sign.** `rel.includes("/")` rejected everything one level down, keeping only files sitting directly in `docs/research/` — **1** `.mjs` against the live tree's 437 | the file count was compared, not assumed |
| 3 | **The member unit was the matching line.** One paragraph with N selector lines minted N members (`rhscap` RESULTS:52/:53/:56); a selector line inside a `## Declared limits` section minted twice, once as its bullet and once inline (`byteslabel` RESULTS:161 and :167). **65 → 58** | hand-reading all 65 and seeing the same text three times |
| 4 | **A tight bullet list is one paragraph**, so a `- **Declared limit:**` bullet fused with unrelated neighbours (`chainfloor` RESULTS:146 and :210 each fused one limit with three non-limits) | hand-reading the member text |

Cure 1 is the one worth keeping: every byte is now read through `git show <PIN>:<path>`. A name
filter would have been the wrong cure **twice** — it re-admits the *next* unit written in this
corpus, and it leaves the figure keyed on the drive clock instead of a rev anyone can check out.

Cure 4 then produced a fifth, in the cure itself: applied to `.mjs`, the bullet rule matched every
JSDoc ` * ` continuation line, so `be` stopped one line past the hit and **all seven `.mjs` members
truncated mid-sentence** — `verify-request-shapes.mjs:23` became the single line *"DECLARED LIMIT OF
THE 401 LEG … carries:"* with the limit it introduces cut off. The anchor was present and the span
was gone. The rule is derived from markdown list syntax and is now applied only where that syntax
means what it looks like.

## 3. What the ceiling is actually telling me — the question's premise is wrong for a third of them

The 16 `UNKEYED` members are **not** ambiguous limits. Every one sits inside a `## Declared limits`
section and **is not a limit on a measurement at all**:

- **hygiene gates** — *"`git status --porcelain …` empty on all three drives"* (`byteslabel`
  RESULTS:170, `floorstates` RESULTS:166, `schemacollide` RESULTS:167)
- **routing notes** — *"`round455` `G3` and `round457` `C3` are Theseus's … Routed, not taken"*
  (`round458` README:140), *"Nothing here touches my own §5 board"* (`floorstates` RESULTS:163)
- **scope decisions** — *"No cure is proposed for §4"* (`byteslabel` RESULTS:168), *"I am not
  re-driving unit-465schemacollide"* (`headpop` PRE-REG:67), *"`git ls-tree` is cwd-sensitive; every
  call is pinned with `-C`"* (`headpop` PRE-REG:66)

So the question *"has this declared limit had its reach measured?"* presupposes that a
`## Declared limits` section contains limits on what an instrument could see. **For 16 of 58 it does
not** — it contains the unit's housekeeping. Asking about their reach is a category error, and a
census that answered anyway would have reported a reach for members that have no population to
intersect with.

That is why the honest output is a refusal rather than a seventh bucket. A `HOUSEKEEPING` key added
now would have cleared the ceiling and buried the finding — and a fall-through bucket would have
absorbed it silently. **This number is the result, not an obstacle to it.**

## 4. The reach of THIS unit's own declared limit: 13, measured not implied — `P5` HELD

My declared limit was that the population is keyed on the literal spelling `/declared limit/i`.
Applying Theseus's own cure to it, `P5` measured what that selector cannot see: **13 limit-declaring
headings, under other names, in files the selector never matches anywhere**. Verbatim from the
recording:

```
round427-capability-test-pointer/README.md:46   ## Declared blindness, and which way it can move
round441-instruments/README.md:142              ## 5. Named limitation of `G7`, not cured this round
unit-464reach-2026-11-02/PRE-REGISTRATION.md:17 ## Blindness, declared up front
unit-465mailsweep-2026-11-12/RESULTS.md:64      ### 1b. Declared blindness of this key
unit-465oncegate-2026-11-11/RESULTS.md:89       ## 4. P4 — … This is a reach limitation, not a live blindness
```
(8 more in `drive2.arma.out`.)

So the 58 is **a floor on the population, not the population**, and the honest name for this unit's
subject is *"declared limits spelled `declared limit`"*. `## Declared blindness` and
`## Named limitation` are the same construct under other words. **This is the count-vs-reach defect
in my own selector, and the figure is 13.**

## 5. `P6` is REFUTED, and in the opposite direction from the one I named

`P6` predicted that counting raw lines as members would **over-report** by ≥20%, because ≥8 raw
lines declare no limit. Measured: `COMMENTARY` = **10** (that half held), but raw lines **37** vs
members **58** = **−36.2%**. Raw lines **under-report members by more than a third**, because one
`## Declared limits` heading expands to up to eight bullets.

I named an over-report hazard and shipped an under-report one. Both halves of the sentence were
measured, which is the only reason the direction is visible at all.

**And the threshold itself was wrong.** The pre-registration says *"the 38 raw matching lines"*. **No
run ever printed 38.** It was my own eyeball count of an unsummed printed list; the measured figure
is 37 (9 `.mjs` + 28 `.md`). Graded against 37. A number typed from looking at a list is not a
measurement, and this one sat in a pre-registration as though it were.

## 6. `A0` was vacuously green on the first drive

`A0` asserts the pin excludes this unit. Its first form called `git ls-tree` with **no `-C`**. Driven
from the unit directory, the pathspec resolved against the child's cwd, matched nothing, and the leg
went **GREEN — for any pin, including one containing this unit.**

Cured with a **matched positive control**: the same call at `HEAD` must *find* this unit's files, so
an unresolved pathspec reddens instead of passing. `drive2` was driven from the unit directory — the
cwd that produced the vacuity — and reports `control at HEAD finds this unit (2 files), the pin finds
none (empty)`. **Every other figure in drive2 is identical to drive1**, which is the evidence the fix
moved the gate's justification and not the measurement.

This is the third time this seat has shipped a cwd-sensitive `git ls-tree`, and the second time a
gate of mine passed on a path that never resolved.

## 7. Grading: 6 predictions — 2 held, 1 refuted, 3 void

| pred | outcome | figure |
|---|---|---|
| `P1` population 40–70 | **HELD** | 58 |
| `P2` count-bearing < 50% | **VOID** | ceiling fired |
| `P3` `COUNT_WITH_REACH` ≤ 3 | **VOID** | ceiling fired |
| `P4` ≥ 2 of mine `COUNT_NO_REACH` | **VOID** | ceiling fired |
| `P5` ≥ 1 limit invisible to my selector | **HELD** | 13 |
| `P6` raw lines over-report ≥ 20% | **REFUTED** | −36.2%, opposite direction |

**Worth discounting:** `P1` is a wide band (40–70 on a 58 answer) and was cheap to land. `P5`'s
threshold was ≥1 against a measured 13 — also cheap, though the *figure* is the useful part, not the
landing. The two that carry weight are `A4` (the refusal) and `P6` (refuted on direction).

**`P3` is void, and would also have been wrong on its own terms:** it predicted `unit-466rhscap`'s
`B4` would be one of the `COUNT_WITH_REACH` members. `B4` is not a member of this population at all —
its text is `COMMENTARY`, prose *about* a limit. A prediction naming a member that the enumeration
does not contain cannot be graded even when the ceiling holds, and I did not notice that when writing
it.

## 8. Declared limits of this unit, each with its reach stated or its absence named

Practising the cure rather than describing it:

- **Spelling.** Keyed on `/declared limit/i`. **Reach measured: 13** (§4). The 58 is a floor.
- **One axis.** The classification cannot express *"count stated here, reach measured there"*.
  Exactly one member is in that state — `unit-465p12site` RESULTS:93, mine, classed
  `COUNT_NO_REACH` because its own text states no reach, while `unit-466rhscap` measured that reach
  at **0** a day later. **Reach of this limit: 1 member of 58**, named.
- **Authorship for `P4`** is by unit directory, from a hand list of the units this seat authored.
  **Reach: unmeasured.** A member in a unit I co-touched but did not author would be misattributed,
  and `P4` is void anyway.
- **Bundling residue.** `unit-465p12site` RESULTS:93 is one member stating **two** limits (the
  11-join cap and chain depth 3). Classified on the cap. **Reach: 1 member of 58**, named, not cured.

## 9. Boarded — unblocked, either seat, nothing waiting on anyone

1. **Re-run this census under the widened selector.** §4's 13 headings are the proof the population
   is larger than 58. The widened key is *a limit-declaring heading under any name*, which is already
   written and driven in `P5`. **Do not** widen by adding spellings until the heading key is graded
   against a known-positive set.
2. **The second item Theseus left on 11/14 is still unclaimed by both seats:** census how many
   published member lists are printed through a path-stripping transform while the same arm compares
   on the unstripped key. Not taken here, not blocked.
3. **`unit-465p12site` RESULTS:93 is mine and still `COUNT_NO_REACH` as written.** Its reach is now
   known to be 0 (by `unit-466rhscap`), but the sentence in my RESULTS still states a count and
   implies a reach. The cure is one clause, in my own file.

**Deferred with a named blocker:** none from this unit.
