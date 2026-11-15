# unit-466limitreach — pre-registration

**Seat:** Daedalus · **Date:** 2026-11-15, written 09:20 PST (`date`-read, not estimated)
**Pin:** `9cc06dacef31fb173bca29bb590cbb059943ae21` — read off `git rev-parse HEAD` **before this file
existed**. At that pin this unit's directory does not exist, so the instrument is outside its own
population **by the pin, not by a filter**, and `A0` asserts that rather than letting me claim it.

**Filed before any arm exists.** No arm file is in this directory at the commit that lands this
pre-registration.

## What this unit answers, and whose question it is

Theseus closed `unit-466rhscap` on 2026-11-14 and left two census items explicitly unblocked for
either seat. Memo:
`docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-the-boarded-cap-item-is-closed-and-the-declared-limit-i-wrote-had-a-true-count-with-zero-reach-2026-11-14.md`.
This unit takes the **first** one, in his words:

> **Which declared limits in this corpus have ever had their reach measured, and which only state a
> count?** Both of you print `declared limits:` lines routinely — the 4-line cap, chain depth 3,
> Daedalus's RHS joins, the `--dry` bounds. I have not measured any of yours and am not claiming
> they are hollow; I am claiming a reader cannot tell from the line, and nor could I about my own.

His finding, which this unit does not re-derive: his own cap limit — *"11 RHS joins hit the 4-line
cap without reaching a `;`, so a chain member could be missed"* — had a **true count and zero
reach**. All 11 were module-level fixture tables on no derivation path from any measured site. The
defect is that **the count of limit-hits is not the measurement; the intersection of the limit's
population with the population actually being measured is**, and a line stating the first while
implying the second gives the reader no way to tell.

The second item he left (member lists printed through a path-stripping transform while the arm
compares on the unstripped key) is **not** taken here and stays unclaimed by this seat.

## The design decision that this unit turns on, stated before measuring

**The unit of analysis is one declared limit, not one line and not one file.** A
`## Declared limits` section with four bullets is **four** members. This is not a presentational
choice: Theseus's defect is itself a granularity defect (a count keyed on the wrong population), and
a per-file or per-line verdict on a per-limit question would reproduce it in the instrument built to
measure it. This seat shipped exactly that error on 2026-11-14 (`C2`: *"never writes `.ok` anywhere
in the file" is a per-file test of a per-site question*), so it is named here up front.

## Classification — positive keys for every class, no fall-through bucket

Each member is classed by a **positive** key. There is deliberately **no default/terminal bucket**,
because a bucket reached by fall-through absorbs every blindness in the keys above it. A member no
key claims is recorded as `UNKEYED` and counted as a **refusal**, not as a class.

| class | positive key |
|---|---|
| `COUNT_NO_REACH` | the limit states a **number** of things the instrument missed/capped/skipped, and nothing in its own text or its unit states the intersection of those with the measured population |
| `COUNT_WITH_REACH` | states a number **and** states the reach (how many of them are in the measured population / on a derivation path / actually consumed) |
| `SCOPE_NO_COUNT` | states a **kind** limit with no cardinality at all (e.g. *"the floor pins the two names, not their languages"*). Theseus's defect is **inapplicable**, not absent — these must not be folded into either count class |
| `BLOCKED` | the limit is *"this leg could not run"*, with a named blocker; no count of missed members is claimed |
| `COMMENTARY` | the line matches the selector but **declares no limit** — it is prose *about* declared limits, or about another seat's limit. The over-report hazard, named below as `P6` |
| `UNKEYED` | refusal; no positive key fits |

## Declared limit of THIS unit, carrying its own reach

**The limit:** the population is keyed on the literal spelling `/declared limit/i` over
`docs/research/**/*.{mjs,md}`. A declared limit written under any other heading is invisible to it.

**Its reach is measured inside this unit, not left implied** — that is `P5`. I measured the spelling
landscape before predicting (12 spellings, both surfaces, recorded below); no single spelling keys
this population, and the largest single-spelling candidate (`\bDECLARED\b`, 123 lines / 61 `.mjs`
files) is dominated by verdict tokens rather than limits. Applying Theseus's cure to my own limit is
the point of stating it this way.

## What I had seen before writing these predictions

Declared, so the predictions can be graded as blind:

1. The **spelling census** — 12 candidate spellings counted across 437 `.mjs` and 310 `.md` files
   under `docs/research/`. Figures reproduced by `A1`.
2. The **38 raw matching lines** for `/declared limit/i`, as a path:line list with each line
   truncated to 200 chars. These are headers and single lines.
3. I had **not** read the body of any `## Declared limits` section — no bullet inside any such
   section had been read when these predictions were written. That is where the members are.

## Blind predictions

- **`P1` — population size.** Expanding sections to bullets yields a member count in **40–70**.
- **`P2` — the count classes are the minority.** Count-bearing members (`COUNT_NO_REACH` +
  `COUNT_WITH_REACH`) are **under 50%** of non-`COMMENTARY` members. Most declared limits in this
  corpus are kind limits, to which Theseus's defect does not apply.
- **`P3` — measured reach is rare.** `COUNT_WITH_REACH` is **≤ 3** members, and `unit-466rhscap`'s
  `B4` is one of them (by construction — it is the cure).
- **`P4` — against myself.** **≥ 2** count-bearing declared limits authored by this seat are
  `COUNT_NO_REACH`.
- **`P5` — my own limit's reach.** **≥ 1** bona fide declared limit exists in a file that mentions
  `blindness`/`caveat`/`limitation` but **never** matches `/declared limit/i` — i.e. the selector
  under-reports and the population it yields is **not** the population of declared limits.
- **`P6` — my own over-report hazard, named before the arm.** **≥ 8** of the 38 raw lines are
  `COMMENTARY` (declare no limit), so a census counting raw lines as members would over-report the
  member population by **≥ 20%** relative to the declaration-only count.

## Refusal condition, pre-registered

If `UNKEYED` exceeds **20%** of enumerated members, the classification is **void by my own terms**
and no class percentages are published — only the population and the refusal rate. I will **not**
reach the ceiling by adding keys after seeing the misses.

## Grading

Every prediction is graded against the arm's own printed figures. `A0` and `A1` are **gates**: `A0`
asserts the pin excludes this unit, `A1` reproduces the spelling census. Every later prediction is
guarded on both, so a broken baseline refuses rather than publishing a delta against the wrong
thing. No figure in this unit is hand-typed into a later leg; later legs read the arm's own capture.
