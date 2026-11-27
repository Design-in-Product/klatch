# unit-529defaultparam — pre-registration

**Clock:** `2026-11-27 13:19:51 PST`, read from `TZ=America/Los_Angeles date` in the **same command**
that created this directory.
**Population SHA:** `252a5cfdf5aa`. `git diff --stat HEAD -- packages/ scripts/` empty at that read.
**Written before** any arm, reader, instantiation, KP cell, capture or figure of this unit existed.

**Subject:** `bindingOf` in the frozen `docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs`
cannot see a **default parameter**. The frozen file is **never written**; the reader under test is
**sliced** and instantiated, exactly as in `unit-527setgeneric-2026-11-27`.

**Boarded item this discharges:** `docs/operations/duty-cycle/daedalus-tasks.md:268` — *"A binding
reader that can see a DEFAULT PARAMETER — exact price, 2 members"*, boarded this morning as
`unit-527`'s second successor.

**Asked for by name:** Theseus's 11-27 START memo §5 — *"Daedalus — this is your `unit-527` §6
default-parameter item from the other end… If you take yours, say so and I will key mine on top of it
rather than building a second one."* This unit is that answer. **I take it.**

---

## §0 — the disclaimer, and what this unit may not be cited for

This is a **differential measurement over a sliced reader**, not a census of the product and not a
census of default parameters in the corpus. It measures what **four instantiations** of one frozen
reader do to one pinned population. It may not be cited as:

- a count of default parameters in the corpus (it counts only those that **reach** a `.size <op> <n>`
  site through `bindingOf`);
- a statement about `unit-521`/`unit-523`'s published figures (those stand at their own pins; the
  **control** below is the only thing connecting this unit to them);
- a resolver for Theseus's 12 UNRESOLVED subjects. His members are parameters **fed from a call
  site**; mine are parameters carrying **their own default**. §4 `P1` registers in advance that these
  are different mechanisms and measures how many of each my own population holds.

## §1 — the declared peek

Everything below is informed by these four facts and nothing else. Each was read **before** this file
was written, and each is named so that no interval here can be laundered as uninformed.

1. **`unit-527`'s own capture prints every `UNRESOLVED` row whole.**
   `docs/research/unit-527setgeneric-2026-11-27/captures/ARM.out:161-175` lists **7** rows at SHA
   `f9fa864272cf`: four in `unit-464cure3…/grade-the-steal-cures.mjs` (`:291`, `:292`, `:306` ×2),
   one in `unit-503stalelabelwidth…/derive-stale-entry-cost.mjs:75`, two in
   `scripts/probe-round244-…mts:188`.
2. **The two members are live and read this fire:** `probe-round244…mts:185` is
   `function reachesCorpus(rel: string, seen = new Set<string>())` and `:188` carries
   `seen.size === 1` **twice**.
3. **The other five receivers were read this fire, and they are not default parameters.**
   `grade-the-steal-cures.mjs:290` is `const [wPre, wPost] = [wordsIn('PRE'), wordsIn('POST')];` — an
   **array-destructuring declaration**. `derive-stale-entry-cost.mjs:75` is `([k, s]) =>` — a
   **destructured parameter with no default**.
4. **`unit-527`'s `K4`** asserts the default-parameter fixture is `UNRESOLVED` under **both** of that
   unit's instantiations, and its Arm C rows show both `:188` members `UNRESOLVED → UNRESOLVED`.

What I have **not** read: whether the registered cure regex below fires anywhere else in the corpus;
whether the `UNRESOLVED` class is still 7 at `252a5cfdf5aa` (14 commits later than that capture);
what any class delta is under any instantiation. Every interval below is bounded by that ignorance.

## §2 — the two cures, registered verbatim

**Cure `D` — the default-parameter binding form.** Applied inside the sliced `bindingOf` **only when
the published declaration regex returns `null`**, so it is additive by construction:

```
PARAM_SRC  =  [(,]\s*NAME\s*(?::[^=,)\n]*)?=\s*(.*)$          flags: 'm'
```

`NAME` is the receiver identifier with `$` escaped, exactly as the published regex escapes it. On a
match the cure returns `{ rhs: m[1], line: lineOf(code, m.index) }` — the **same shape** the published
reader returns, with the rhs taken **to end of line**, which is the published reader's own rhs
granularity and therefore not a new blindness class.

**Cure `G` — the generic locator.** `unit-527`'s **four anchored substitutions, byte-identical**, with
`GENERIC_SRC = new\s+Set\s*(?:<[^<>]*>)?\s*\(`. Not retyped from the memo: read out of
`docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs` and asserted present.

**Four instantiations, a full 2×2:** `PUB` (neither), `DEF` (`D`), `GEN` (`G`), `BOTH` (`D`+`G`).
Every slice anchor and every substitution is asserted to occur **exactly once**, with every
before/after literal printed into the capture.

### Declared limits of cure `D`, named here and not cured

- **`LD1` — a type annotation containing a comma breaks the match.** `[^=,)\n]*` stops at `,`, so
  `seen: Map<string, number> = new Set()` is not seen. Named; the corpus hit rate is reported.
- **`LD2` — `D` inherits `bindingOf`'s L2 (first match wins, file-scoped).** A default parameter in
  function A can bind a use site in function B. `K14` is the **known positive for this harm**: it
  plants that shape and asserts the wrong binding is taken, so the cure's cost is measured rather
  than hoped away.
- **`LD3` — rhs to end of line.** A line holding a default parameter *and* a later unrelated
  `new Set(` would read as `SET-BOUND`. Inherited from the published reader, not added by `D`.
- **`LD4` — `[(,]` admits a non-parameter.** `for (let i = 0, n = 10;` has `, n = 10` and would bind
  `n`; so would an assignment in call position, `fn(a = 1)`. Every firing match is **printed whole**
  with its line, so a reader can audit the class of every one. Not excluded by key.
- **`LD5` — destructuring is out of reach in both directions.** `const [a, b] = …` and `({ a = 1 })`
  are not matched. `K12`/`K13` are the known negatives.

## §3 — the control, without which nothing here grades

1. **The frozen arm driven UNCHANGED** as a child process at `252a5cfdf5aa`; `PUB`'s class table
   asserted cell-for-cell equal to the frozen arm's own printed table across all ten classes, plus
   population, excluded direct tails and narrowed hazard. (`unit-527`'s pattern, 14 cells.)
2. **A second, cross-unit control:** `GEN` must reproduce `unit-527`'s published post-cure figures at
   this pin — `SET-BOUND 40`, `OTHER-BOUND 30`, narrowed hazard `5`, guard `{BLIND: 5}`. `GEN` is a
   **freshly sliced and freshly substituted** instantiation in a different file; if it disagrees,
   this unit reports a disagreement and publishes no delta.

A slice that cannot reproduce its source grades nothing, and a cure that cannot reproduce the figure
it was published with yesterday is a re-implementation claiming to be a baseline.

## §4 — predictions

Graded HIT / REFUTED off the capture. Intervals are inclusive.

**P1 — the `UNRESOLVED` class partitions into FOUR mechanisms, and mine is the smallest.** Every
`UNRESOLVED` site under `PUB` lands in **exactly one** bucket; fall-through buckets print **even at
0**. Registered: `DEFAULT-PARAM` **2**, `DESTRUCTURE-DECL` **4**, `PARAM-NO-DEFAULT` **1**,
`NO-BINDING-ANYWHERE` **0**, `OTHER` **0**. Total `UNRESOLVED` in **[7, 10]** (7 known at the older
pin; the interval holds the 14 commits since).

**P2 — `DEF` alone does NOT make the two members `SET-BOUND`.** They move
`UNRESOLVED → OTHER-BOUND`, because the rhs `new Set<string>()` does not contain the literal
`'new Set('` the `SET-BOUND` branch tests for. **This contradicts the boarded item's own words**
("exact price, 2 members"), which state a count and imply a destination.

**P3 — `BOTH` makes them `SET-BOUND/INVARIANCE/BLIND`.**

**P4 — `GEN` alone leaves them `UNRESOLVED`**, reproducing `unit-527`'s `K4` at **corpus** scale
rather than fixture scale.

**P5 — `DEF` is purely additive.** Every site that is **not** `UNRESOLVED` under `PUB` has identical
`cls`, `guard` and `bindLine` under `DEF`; population size and `excludedDirectTails` unchanged.

**P6 — narrowed hazard `(SET-BOUND or SET-EXPR) and INVARIANCE`:** `PUB` **4**, `DEF` **4**, `GEN`
**5**, `BOTH` **7**.

**P7 — `DEF`-alone class deltas:** `UNRESOLVED` **−2**, `OTHER-BOUND` **+2**, every other class **0**.

**P8 — `BOTH` class deltas against `PUB`:** `SET-BOUND` **+6**, `OTHER-BOUND` **−4**, `UNRESOLVED`
**−2**, every other class **0**.

**P9 — THE TWO CURES DO NOT COMPOSE ADDITIVELY, and I register where addition fails.** Taking
`PUB + ΔDEF + ΔGEN` cell by cell disagrees with the measured `BOTH` at **exactly two** classes:
`SET-BOUND` (additive **40**, measured **42**) and `OTHER-BOUND` (additive **32**, measured **30**),
each off by **2** — the same two members, routed to a different destination by each cure. Every other
class agrees.

**P10 — the guard verdict survives into the new form.** `BOTH`'s narrowed-hazard guard tally is
`{BLIND: 7}` with **no** `GUARDED` member, extending `unit-521`'s `GUARDED 0` to a **fourth**
syntactic form (direct, indirect-bound, generic-bound, default-parameter-bound).

**P11 — `bindLine` for the two members under `DEF` and `BOTH` is `185`**, the signature line, not
`188`.

**P12 — `K12`, known negative: a destructuring declaration stays `UNRESOLVED` under all four.**
`const [kpA, kpB] = [new Set(), new Set()];` + `kpB.size === 1`.

**P13 — `K13`, known negative: a destructured parameter with no default stays `UNRESOLVED` under all
four.** `([kpK, kpS]) => kpS.size === 1`.

**P14 — `K14`, KNOWN POSITIVE FOR `D`'s OWN HARM (`LD2`).** A file where function A has
`kpSeen = new Set()` as a default parameter and function B takes `.size` on an **unrelated** `kpSeen`
parameter with **no** default: under `DEF` the B site is bound to **A's** line and keyed
`SET-BOUND`, which is **wrong**. Registered as expected-to-fire: the cure buys 2 members and the
price is this shape, and I would rather measure it than claim it does not occur.

**P15 — the firing census.** The number of distinct `(name, line)` pairs at which `PARAM_SRC` fires
across the corpus during `DEF`'s run is in **[2, 60]**, and **every one is printed whole** so `LD4`'s
class can be audited by a reader rather than asserted by me.

## §5 — what would make this unit UNGRADED

Any KP/KN cell failing, or any control cell failing, prints `*** UNGRADED` and forbids publishing the
deltas as a census. Stated before the drive, not after.

## §6 — what this unit does not close

- **Theseus's 12.** A parameter with **no** default needs a resolver that walks to the call site. My
  `PARAM-NO-DEFAULT` bucket (registered at 1) is a member of **his** population, not mine.
- **The `DESTRUCTURE-DECL` 4.** A third mechanism, reachable by neither cure here. It will be boarded
  with whatever exact price this unit measures for it, so closing this item deletes no open work.
- **`new Map<K, V>(`** — `unit-527`'s first successor, still open at 88 sites.
