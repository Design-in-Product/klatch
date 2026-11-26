# unit-521setsizefalsegreen-2026-11-26 — results

**Seat:** Daedalus · **Fire:** 2026-11-26 START (bounded) · **Model:** claude-opus-5
**Pre-registration:** `PRE-REGISTRATION.md`, commit `148ebe57c8f8`, written **09:19:09 PST** before
any script existed. **Addendum:** `PRE-REGISTRATION-ADDENDUM-TWO-MECHANISMS.md`, commit
`a77b7f4fdda0`, written after the arm's only drive and before this post-hoc existed.
**Drives:** one each. `captures/ARM.out` 8156 B / `ARM.err` **0 B**; `captures/POSTHOC.out` /
`POSTHOC.err` **0 B**. Gate rc 0 at every push.

**18 registered predictions — 15 HIT, 3 REFUTED, and all three refutations are mine.** Two are
underestimates of reach (P10, P12). The third (PH1) is the keeper: **I registered a prediction off
the arm's own 150-character truncated display field instead of off the span, and the truncation had
cut the deciding `.map(...)` off the end of both members.**

## Figures, as read

| | |
|---|---|
| Host SHA (pinned; no tolerance registered) | `148ebe57c8f8` |
| Arm clock | 2026-11-26 09:22:37 PST |
| Tracked files | 7748 |
| **Instrument corpus** (`scripts/` + `docs/research/`, `/\.(mjs\|mts\|js\|ts\|cjs)$/`) | **850** |
| Product corpus (`packages/`, same extensions) | 215 |
| `new Set(` sites (code reading only) | **1246** |
| — `NOT-SIZE-KEYED` 1097 · `NO-COMPARISON` 95 · `CHANGE` 26 · `OTHER-N` 16 · `INVARIANCE` 11 · `EMPTY` 1 | |
| Size-keyed sites | **54** |
| `SCAN-FAILED` | **0** |
| **`INVARIANCE`** | **11** — `BLIND` **11**, `GUARDED` **0** |
| `CHANGE` | 26 — `BLIND` 25, `GUARDED` 1 |
| `INVARIANCE` in `packages/` | **0** |
| `INDIRECT` upper bound | 123 |
| `new Set(` in prose/strings only (post-hoc, not registered) | 34 |
| KP | **7 of 7** · MK (sub-key mechanism cells, driven) **4 of 4** |

### The 11, sub-keyed

| sub-key | n | emptiness reading | n |
|---|---|---|---|
| `PROJ-SILENT` | 6 | `EMPTY-READS-VARIED` (`=== 1`) | 8 |
| `NO-PROJECTION` | 3 | `EMPTY-READS-INVARIANT` (`< 2`) | 3 |
| `PROJ-THROWING` | 1 | | |
| `PROJ-TOTAL` | 1 | | |

**False-green-capable (absence reachable *and* silent): 9 of 11**, across **6 files and 4 units**.
All 11 `BLIND` sites span **8 files and 6 units**; the 10 that are not the host span **7 files and
5 units**. Every file/unit count here was computed off the two captures, not counted by eye off the
member lists — the eye is what got PH1 wrong in §4.

## 1. The false green is DRIVEN, not inferred

P7 ran the published expression — **sliced** from
`unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs`, with five markers asserted
present in the slice before it was compiled, so the verdict is produced by the code that published
it and nothing here is retyped:

```
all-equal      figures: 1072, 1072, 1072  →  flatFigures ['tracked files read']   movedFigures []
all-undefined  figures: absent            →  flatFigures ['tracked files read']   movedFigures []
all-null       figures: null, null, null  →  flatFigures ['tracked files read']   movedFigures []
```

**Three different worlds, one verdict.** A figure the instrument never read is published among the
figures that *held constant across all three stages*, and is simultaneously absent from the moved
list. That is the false green, measured on the real host rather than argued from `Set` semantics —
and it reproduces Theseus's `unit-514` §2 P7 cell from the other end, by driving instead of by
renaming the gate.

## 2. `GUARDED 0` is a measured zero, because KP2 can reach it

`INVARIANCE / GUARDED` is **0** across 850 instrument files. That sentence is worth nothing off a
dead key arm, so **KP2 plants the guarded form** — the same expression with
`.filter((v) => v !== undefined)` inside the set's own argument — and it keys `GUARDED`, 1 of 1.
KP7 does the same job for the `OTHER-N` **fall-through** bucket: a terminal bucket nothing can reach
absorbs every blindness, and `OTHER-N 16` would otherwise be an unknown number of misfiled rows.

**Not one instrument in this corpus excludes absence before taking a set size.** The guard is not
rare here; it is absent.

## 3. The keeper — my own direction key fused two mechanisms with opposite failure directions

`=== 1` and `< 2` are the same invariance claim. On an **empty** collection they disagree, and the
post-hoc drives it rather than asserting it:

```
new Set([]).size === 1   →  false  →  reads VARIED     →  FALSE RED on empty
new Set([]).size < 2     →  true   →  reads INVARIANT  →  FALSE GREEN on empty
```

The pre-registration keyed **the claim** and not **the failure direction**, so all four operator
forms landed in one `INVARIANCE` bucket — 8 of the 11 false-red on empty, 3 false-green on empty.
This is an undifferentiated containment match fusing two mechanisms, committed by this seat **inside
the unit that went looking for a fused reading somewhere else**, and found only by hand-reading the
arm's own member list before publishing its number.

It bites hardest at the three `< 2` sites, all of the form
`if (new Set(x).size < 2) continue;` (`unit-465routecure…-b.mjs:209`, `:245`,
`unit-465routecure….mjs:334`): the false green on empty is a **`continue`**, so an empty collection
is skipped in silence as though it were uniform.

**PH5 = 0, and that zero is the useful half.** All three `< 2` sites take a bare identifier
(`named`, `all`), so every one of them is absence-capable too. Emptiness is therefore a second
**reason** the same nine sites can read green, not a wider **reach**. A larger number would have
been the weaker result.

## 4. Against me — three refutations

**PH1 REFUTED, and this is the one to keep. `2 → 0`.** I registered "two of the 11 are sets over
string literals, so absence is unreachable" after reading these two published member lines:

```
unit-505markedabsentpair…:301  new Set(['E-MARKED-ABSENT', 'E-2ABSENT', 'E-2MARKED']
```

The arm's member field is **truncated at 150 characters** (`text: raw.split('\n')[line-1].trim().slice(0, 150)`),
and the truncation fell exactly where the next line continues
`.map((c) => JSON.stringify(results[c].predicate.nonPathIntegers))`. The literal array is the **key
list**, not the set's members; the projection reads two properties deep and `JSON.stringify` of an
absent leaf is `undefined`. Both sites are `PROJ-SILENT` — **false-green-capable, the opposite of
what I registered** — and `ARG-LITERAL` has **zero** members in this corpus.

> **A prediction registered off a display field is a prediction about the display.** This seat has
> recorded the padded-row version of this (capture the token, don't type it) and the truncated-field
> version is the same defect with the truncation supplied by my own instrument. The member list
> existed to be read; it was read, and the thing that decided the class was past the cut.

**P10 REFUTED, `[1, 8]` measures 10.** `INVARIANCE / BLIND` sites other than the `unit-506` host.
This was the question the unit existed to ask and the answer is the wider one: the false green is a
**corpus property across 7 files and 5 units**, not a property of one host. The symmetry Theseus
named in his 11-25 §7 — *my cures have a reach of one unit* — does **not** hold here for the defect.

**P12 REFUTED, `[1, 40]` measures 123.** The `INDIRECT` bound (every literal `.size` comparison that
is not the tail of a balanced `new Set(...)`). Registered as an over-count by construction, and it
over-counts by more than I priced. It is a bound, not a count, and this unit does not narrow it.

## 5. The declared blindness that was cured instead of declared

The pre-registration declared a **STRING/COMMENT PARENS** limit — a paren inside a string or comment
mis-closing the balanced scan. `scripts/lib/strip-source.mjs` blanks comment *and* string bodies
while **preserving length**, so the limit is gone rather than named: `SCAN-FAILED` **0**, and every
index into the stripped reading indexes the original. Searching the stripped text also makes **34**
prose/quoted occurrences of `new Set(` non-sites *by construction* — which is `unit-520` §5's P9
resolution (a comment *about* the form is not an instance of it) arriving as a dependency instead of
as a hand-read afterwards.

Checking `scripts/lib` before hand-rolling is a banked lesson of this seat. Here it removed a
declared limit and a false-positive class in one import.

**One reading artefact to state, because it is visible in the published spans:** the spans are
sliced from the **stripped** reading, so string bodies appear blanked —
`grade-subkind.mjs:336` prints as `a.split(' ')[0]` where the source reads `a.split(':')[0]`. The
delimiter is not what the span shows; the structure is.

## 6. Limits, named and not pretended otherwise

- **`INDIRECT` (123, bound).** `const s = new Set(…)` then `s.size === 1` later is not keyed. The
  bound also holds every `Map`/other-collection `.size`, so it is an over-count by construction.
- **Other dedupe idioms are not in this population.** `[...new Map(…)].length`,
  `uniq(xs).length === 1`, `every(x => x === xs[0])`. Named, uncounted.
- **`NO-COMPARISON` 95** sites read `.size` without an immediate literal comparison. Some will be
  invariance claims one binding away. Not keyed here.
- **The product tree is in scope only for P9** (`INVARIANCE 0` of 35 sites in `packages/`), which
  prices the exclusion rather than declaring it.
- **The 11 are a census of 850 instrument files at one SHA.** The population carries **no ±
  tolerance** by design — `unit-520` P10 was refuted by a drift of 7 against a registered ±5, every
  one of the 7 being this corpus's own instruments committed inside nine hours.

## 7. Open, and what is owed

- **Closed by drive:** the reach of the `Set`-size false green. **9 of 11** invariance sites in the
  instrument corpus are false-green-capable; `GUARDED` is **0** against a reachable key arm; the
  false green is driven on the real host. **Nothing is owed back to Theseus or Argus on it** — the
  item was mine, boarded 11-25 WORK, and it closes here.
- **Mine, unblocked, boarded by this unit:**
  1. **The `EMPTY-READS-INVARIANT` + `continue` shape** (3 sites) — an empty collection skipped as
     uniform. Whether any of the three can actually *see* an empty collection needs the runtime, not
     the source; this unit keys the hazard and does not price it.
  2. **`NO-COMPARISON` 95** — how many are invariance claims one binding away, which is also the
     `INDIRECT` 123's real content.
  3. **The evidence-model question**, unchanged and still the deeper one: Key E's second cause (a
     subject assembled incrementally across a file) is the same shape as this — a reader whose
     evidence model is one line per fact cannot see a fact assembled from several.
- **Not mine to take:** the `.length`-as-bytes census (Theseus's §6, Argus declined it 11-26, so it
  is back on Theseus).
- **xian's, and only his:** `unit-516` §5's 15-vs-0 census-purpose choice. Unchanged.

— Daedalus
