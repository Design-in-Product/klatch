# unit-482floorceiling — results

Daedalus, 2026-11-19 START fire. `date`-reads **09:19:56**, **09:22:17**, **09:23:03**,
**09:24:16**, **09:24:54**, **09:26:30**, **09:26:51 PST**, read not estimated.

Pre-registration pushed in **`0aa7cb65`** before the arm existed. **1 arm, 3 post-hoc legs, 5
drives, 10 predictions: 6 HIT, 4 REFUTED.** One post-hoc leg (`drive4`) was **vacuous and is kept
as a drive, not deleted**; `drive3` is a **refusal** (rc=3) from a capture guard that fired on the
gate's own docblock.

## The answer to Theseus's §2, in one line

**The floor cannot be widened into a measure by any proximity or name key, and this is a property
of the corpus rather than of the key.** `18 → 20` under a second sufficient condition, and that is
where it stops. The two candidate upper-bound keys **contradict the floor on 9 of its 20 members**
and **exclude the one file both seats hand-read as a member**, so the interval `[20, 43]` has no
upper end. His §2 is **conceded in direction and closed as a refusal to widen**, with the reason
written here so no seat re-proposes it.

## Grades

| | prediction | outcome |
|---|---|---|
| P1 | CONTROL reproduces the live gate on 5 figures | **HIT** — `995 / 69 / 59 / 7 / 3`, all OK, in all three CONTROL-bearing drives |
| P2 | M1 = 18 of 69, numerator unmoved by the `68 → 69` drift | **HIT** — 18 of 69, and 18 of the 59 baseline entries |
| P3 | M2 adds ≥ 1, union floor ≥ 19 | **HIT** — M2 = 2, both new, union floor **20** |
| P4 | round401 ∉ union floor | **HIT** — `m1=false m2=false`, 41 slice-family calls |
| P5 | D1 reaches ≥ 5 of the 7 MARKED | **REFUTED** — 4 of 7, and `drive5` says why: 3 of the 7 carry no reader to find |
| P6 | D1 does NOT reach `scripts/lib/decl-body.mjs` | **REFUTED in verdict, and the refutation is hollow** — see §3 |
| P7 | D2 does not reach it either | **HIT** — `d2=false` |
| P8 | round401 ∉ D1 ∪ D2 | **REFUTED** — `d1=true`, `d2=true` (ident `i`); the ceiling excludes a known class member |
| P9 | STRUCTURAL: floor ∩ D1 = 0 | **REFUTED** — **9** members are both "provably never slices" and "demonstrably slices" |
| P10 | interval width ≥ 20 | **HIT** arithmetically (23) and **void** in meaning, by P8 and P9 |

KPs: **KP-H, KP-I, KP-J all PASS** (`drive1`). KP-J is the crux — the round401 /
`decl-body.mjs` shape built by hand, `m1=false m2=false d1=false d2=false` — so the blindness P6/P7
report is a **property of the key family**, not an artefact of two files.

## 1. The floor is 20, and the two members M2 adds are both interesting

`M1` (every open-brace comparison sits on a multi-bracket disjunction, key **captured out of
`unit-480guardorder/arm-b.mjs` rather than re-typed**) holds at **18 of 69** across the population
drift Theseus named — his §4's *"the figure with teeth, UNGUARDED, held at 59"* extends to this
numerator too.

`M2` (**no slice-family call anywhere in the file** — sufficient by construction) adds exactly 2:

- `docs/research/unit-480guardorder-2026-11-18/arm.mjs` — MARKED, mine.
- **`scripts/lib/strip-source.mjs` — baselined, and it contains zero `.slice`/`.substring`/`.substr`
  calls** (`drive2`: 2 comparison sites, 0 slice sites). A baseline entry whose stated meaning is
  *"a known unguarded slicer is being added on purpose"* sits on a file that **cannot slice
  anything**. That is a second, different cause of the weak-sentence problem from the 18
  depth-counters, and it is in the shared library, not in a research instrument.

Union floor **20 of 69**, of which **19 are baselined — 32.2% of the 59-entry baseline.**

## 2. The ceiling is not an upper bound: it excludes the known positive

`D1` (a slice-family call within ±200 chars of a brace comparison) and `D2` (an identifier from a
comparison line reappearing in a slice call's arguments) both fire on
`round401-instruments/census-the-branch-polarity-axis.mjs` — the file **both seats hand-read as never
slicing a declaration body**, me on 11/18 and Theseus by `node -e` at the byte level the same night.

`drive2` names the site, so this is not inferred:

```
    D1-FIRES cmp L 118  if (c === '(' || c === '[' || c === '{') depth += 1;
             +-> slice L 120 at +139 chars  else if (c === ',' && depth === 0) { args.push(inner.slice(start, i)); …
             +-> slice L 122 at +196 chars  args.push(inner.slice(start));
```

**That is an argument splitter.** The depth counter exists to find a comma at depth 0; the slice
takes the *argument text*. It is a correct depth counter driving a correct slice of something that
is not a declaration body — and there is no textual feature separating it from a body slicer.

`D2` fires on the same file via the identifier **`i`** — a loop variable that appears both on a
comparison line and inside a slice argument. A name collision, nothing more.

## 3. P6's refutation is hollow — the key got the right answer for the wrong reason

D1 **does** reach `scripts/lib/decl-body.mjs`, so the ceiling excludes it, which is the correct
outcome. `drive2` shows the mechanism is not the one that makes it correct:

```
             cmp L 270  else if (c === '{' && depth === 0) {
             cmp L 278  if (code[k] === '{' || nextIsArrow || …
    D1-FIRES cmp L 296  if (code[i] !== '{') {
             +-> slice L 300 at +184 chars  params: s.slice(parenOpen + 1, parenClose), body: null,
    D1-FIRES cmp L 304  if (code[i] !== '{') return refuse('no-body-brace-after-the-parameter-list');
             +-> slice L 300 at -80 chars  params: s.slice(parenOpen + 1, parenClose), body: null,
```

Both firing sites are **refusal guards**, and the nearby slice is the **parameter list**, not the
body. The body slice is `L312`, reached through `braceSpanEnd`'s returned index, and **no D1 site is
within 200 chars of it.** So the ceiling's one correct exclusion is a coincidence of the same kind
as its wrong one. A verdict-level matrix would have scored this cell a HIT.

## 4. P9 is the finding that closes the item: the two keys contradict each other on 9 files

**9 of the floor's 20 members are also in D1** — files whose every brace comparison is a
depth-counter operand *and* which D1 calls demonstrable slicers. `drive2` shows a contradiction
member (`round399-instruments/census-the-named-binding-form.mjs`) firing on the **identical shape**
as round401: `if (c === '(' || c === '[' || c === '{') depth += 1;` at +139 and +196 chars from
`args.push(inner.slice(start, i))`.

So this is one mechanism producing all three refutations, and it is the corpus's dominant shape:
**an argument-splitting depth counter beside its own slice.** Any proximity key must fire on it; any
name key must fire on its loop variable. The class *"never slices a declaration body"* is a
**dataflow** property — which index reaches which slice — and no reading of the text answers it.

**`18`, now `20`, is a floor, permanently, under this family of keys.** That is the call his §2 left
to me.

## 5. Two post-hoc legs, the first of which was vacuous, and the second of which is the new finding

**`drive3` (rc=3) is a refusal, not a result.** My capture guard read `stripSource(raw, true)` out
of the gate's **docblock** at `:127` — prose describing the Drive-13 defect the gate repaired — and
aborted claiming the tree had moved. The live call is `:137`, `stripSource(raw, false)`. A
source-scanning reader that reads comments as code is the exact defect `strip-source.mjs` exists to
answer; the capture now runs against the comments-blanked reading and anchors on the assignment.

**`drive4` is VACUOUS and is kept.** It asked "how much of the population is string-literal text?"
by re-driving the keys under `stripSource(raw, true)` and returned **69 of 69**, with
`UNGUARDED 0 · MARKED 0 · GUARDED 0`. That is the key's own definition, not a measurement: every
gate key is a comparison against a **quoted character**, so blanking string bodies turns `c === '{'`
into `c ===` + blanks and unsatisfies all of them. **The gate's docblock had already told me both
halves** — that `blankStrings: false` is deliberate (`:134`), and the tell I walked into
(`:132-134`): *"when a three-way classification returns zero in one class, check whether that class
is reachable at all before writing down the other two."* All three classes returned zero. `KP-K`
in that leg "PASSED" because it passes on **every** input — a vacuous KP, which is what a KP set is
supposed to prevent.

**`drive5` asks the question properly and it lands.** A gate key's operand is a **one-character**
string (`'{'`); a quoted KP fixture is a **many-character** string containing a whole comparison.
So: blank string bodies of length ≥ 2, keep length-1 bodies. The spans are **not re-scanned** —
they are derived from the two readings `strip-source.mjs` already produces, so the shared reader
answers "which bytes are a string body" and this leg only groups them. The blank character is read
off the module, not assumed. The self-blanking-char hazard is handled explicitly: seeds come from
the readings' disagreement, then extend through blank-in-`b` bytes, so a space inside a string body
does not split its span. **Declared blindness:** a string body made entirely of blanks is invisible
to the grouping, and cannot contain a brace comparison, so it moves no verdict.

**KP-L / KP-M / KP-N all PASS and land on opposite sides**, which is what `drive4`'s KP could not do.

> ### **4 of the 69 population members are in the population only because a multi-character string
> quotes a comparison. Three of them are my own arms. One is a baselined entry that carries no live
> brace comparison at all.**

```
      MARKED      —        2 site(s)  docs/research/unit-480guardorder-2026-11-18/arm-b.mjs
      MARKED      —        2 site(s)  docs/research/unit-480guardorder-2026-11-18/arm.mjs
      MARKED      —        3 site(s)  docs/research/unit-481disjunctiononly-2026-11-18/arm-disjunctiononly.mjs
      UNGUARDED baselined  3 site(s)  scripts/probe-round257-the-scanner-had-no-model-of-interpolation.mts
```

Population `69 → 65`; verdicts `UNGUARDED 59 → 58 · MARKED 7 → 4 · GUARDED 3 → 3`.
`scripts/lib/decl-body.mjs` survives as **GUARDED**, as it must.

**And this unit demonstrated the drift on itself, measured not argued.** With this unit's files in
the index, `drive7` reads **tracked 1000 · population 72 · UNGUARDED 59 · MARKED 10 · GUARDED 3**,
rc=0. Population `+3`, MARKED `+3`, **UNGUARDED unmoved at 59** — the three new members are this
unit's own three `.mjs` files, in the population because their KP fixtures quote comparisons, which
is precisely the mechanism `drive5` measured an hour earlier. Theseus's §4 sentence (*"the figure
with teeth, UNGUARDED, held at 59 across 992, 993 and 995 tracked"*) now extends to **1000 tracked**.

Three things follow, and they tie the whole fire together:

1. **Theseus's §4 drift mechanism is now named at the byte level.** We both wrote that the
   `+1`-per-marked-arm population drift comes from *"our own instruments"*. The mechanism is
   specifically that our arms **quote fixture comparisons in multi-character strings**, and the
   gate's deliberately string-keeping reading cannot tell a quoted fixture from a reader. The
   reading is **right** — Drive 13 proved the guard key needs it — and its consequence on the
   **population** key was unnamed. The docblock covers the comment case (`:135`) and not this one.
2. **My own pre-registered answer key was contaminated, and the arm found it.** The MARKED column
   was 7 of my 8 "known body slicers". **3 of those 7 carry no reader at all** — and they are
   **exactly** the 3 D1 missed in P5, cross-checked member-for-member between `drive1`'s MISSED list
   and `drive5`'s dropped list. P5's refutation is my answer key, not D1's reach.
3. **A second cause of the baseline's weak sentence.** `probe-round257…mts` is baselined as a known
   unguarded slicer and has no live brace comparison; `strip-source.mjs` is baselined and has no
   slice call. Neither is a depth-counter case. The ~30% figure in the gate's docblock has at least
   three distinct causes, and the docblock names one.

## 6. Nothing cured — R1, R3 and R4 all held

`scripts/` is untouched (`git status --porcelain scripts packages` empty at close). The one genuine
widening this unit found is `drive5`'s length-aware reading, and it is a **population-key** change,
not a class measurement: it would move 4 members out and one baseline entry with them. Under R3
that needs its own KP set and a baseline migration, in a fire that is not also measuring the gate.
**Boarded with no blocker.**

## What the next seat should not re-derive

- **The class is not textually measurable.** Three refutations, one mechanism, KP-J proves it is the
  key family. Do not propose a proximity or identifier-flow widening of `M1` without reading §2–§4.
- **`drive4`'s shape is a trap with a sign on it.** Blanking string bodies unsatisfies every key in
  this gate. If a leg of yours returns zero in all classes, read the gate's `:132-134` before
  publishing the other columns.
- **The MARKED column is not an answer key of body slicers.** It means "declared naive on purpose",
  and for 3 of 7 the declaration is attached to quoted fixture text.
