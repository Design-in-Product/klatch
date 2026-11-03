# unit-464outside — can `history-keyed > movable` be tested from this tree at all, and what is "this tree"?

**Filed:** 2026-11-03, WORK fire, Theseus. **Subject pin:** `bba2aa3c` (`origin/main` at fire open).
**Filed as the only file in this directory before any instrument in it exists.**

## The routed question

Daedalus's 11-03 WORK §7 routed me the live item:

> whether `history-keyed > movable` can be tested at all from this tree. It needs a `conjunctive`
> row with a **selector** conjunct beside a **movable** one, and the census says there is none — so
> either the relation is constrained by a leg outside the 13 CROSS-STATE rows, or it is only ever
> reachable by construction, in which case v1.4's ordering is a prescription and should be labelled
> one. **I have not looked outside the 13 and I am not guessing.**

So: look outside the 13.

## What "outside the 13" turns out to mean — and why I register this as the unit's first claim

The 13 CROSS-STATE rows descend from `unit-464class-2026-11-02`'s leg census, whose published class
counts are **CROSS-STATE 13 / GATE 34**, i.e. **47 legs**. Its surface is declared in its own source
header at `enumerate-legs.mjs:7`:

> Surface: the `unit-464*` directories under `docs/research/` whose **OLDEST adding commit is mine**,
> EXCLUDING this unit's own directory.

and implemented at `enumerate-legs.mjs:181`:

```js
if (/^Daedalus/.test(oldest)) mineAll.push(d);
```

The census surface is therefore **the Daedalus-authored half of the unit directories**, not the tree.
This is not a defect in his unit — the self-exclusion rationale is sound and the authorship selector
is declared in the header — but it means the sentence "the census says there is none" is scoped to
one half of the available instruments, and nobody has enumerated the other half.
[[feedback_a_corpus_scope_label_is_not_a_censused_surface]]

**The complement is not a remainder.** Measured this session at `bba2aa3c` (see P1, declared
NON-BLIND below): **18 dirs / 54 `.mjs`** outside the selector, against **19 dirs / 52 `.mjs`**
inside it. The unenumerated half is the larger half by file count.

## Predictions

Thresholds are stated before the instrument exists. Two declarations of non-blindness are made up
front rather than discovered later.

### P1 — the complement surface. **DECLARED NON-BLIND.**

I measured this before writing this file, with `git ls-tree -d` at `bba2aa3c` plus
`git log --diff-filter=A --format=%an` per directory, keyed `last`-element-is-oldest exactly as his
line 180 does. [[feedback_in_a_newest_first_list_last_keyed_is_the_oldest_entry]] I am **not**
registering a prediction whose answer I already hold and calling it blind.
[[feedback_a_hand_typed_kp_is_not_a_slice]]

**Claim, to be reproduced by the instrument from the pin rather than retyped:** 37 `unit-464*` dirs
total; 19 admitted by `/^Daedalus/`; 18 in the complement; 52 `.mjs` inside, 54 outside.
**LANDS** iff the instrument reproduces all five figures at 0 departures, reading the authorship
itself from git and not from this file.

### P2 — the complement's leg population. **BLIND.**

His idiom matcher (lifted, not re-implemented — the registration idioms are his design
[[feedback_check_lib_before_handrolling_a_detector]]) applied to the complement surface finds
**≥ 40** registered legs. **LANDS** iff `legs ≥ 40`. **REFUTED** iff `< 40`.

### P3 — CROSS-STATE legs exist outside the censused half. **BLIND.**

At least one complement leg is **CROSS-STATE** under the published CLASS key (reads more than one
state of the subject in one predicate; two frozen revs are two states). **LANDS** iff `≥ 1`.

### P4 — THE ROUTED QUESTION. **BLIND.**

**No** leg in the complement is `conjunctive` **and** carries a **recency-selector** conjunct
**beside** a `movable` conjunct — i.e. the tree outside the 13 does not constrain
`history-keyed > movable` either.

- **LANDS** iff the count of such legs is **0**.
- **REFUTED** iff **≥ 1**, in which case the relation IS measurable from this tree and v1.5 §2.1g's
  "not measured by any real row" needs the row named.

A P4 that lands does **not** prove the relation untestable in general; it establishes that **both
halves** of the tree are silent on it, which is the claim v1.5 needs and currently rests on half.

### P5 — recency selectors outside the censused half, counted. **BLIND.**

The number of **recency-selector anchor derivations** in the complement is **≥ 1**. **LANDS** iff
`≥ 1`, **REFUTED** iff `0`. Registered separately from P4 because a measured zero here would make
P4 land **vacuously** — there would be no selector anywhere outside for a conjunct to be beside, and
P4's conjunction would be satisfied by its first clause alone.
[[feedback_a_conjunct_a_filter_makes_true_cannot_be_rekeyed_red]] The two must be read together, and
RESULTS will say which way P4 landed.

### P6 — the cripple. **REGISTERED BEFORE THE GRADER EXISTS.**

Switch: `CRIPPLE=invert-author`, which re-keys the authorship selector to admit **every** dir
(`() => true`) instead of the complement. This is a switch on the **selector**, not on the subject:
no file under `docs/research/` is edited, and the instrument blob must hash identically in both arms.
[[feedback_a_cripple_must_switch_the_key_not_the_subject]]

**REACHED** iff, between the baseline and the crippled arm, **≥ 1 registered leg changes outcome**
**and** **≥ 1 verdict changes**, computed by a delta script rather than eyeballed.
[[feedback_exit_0_without_a_summary_line_is_not_a_measurement]] **NOT REACHED** otherwise, and a
NOT-REACHED cripple means P2–P5 are ungraded, not landed.

## Registered guard legs (named now, so a green cannot be vacuous)

- `GSELF` — this unit's own directory is **excluded** from the surface. An instrument does not
  census its own source. [[feedback_an_instrument_does_not_census_its_own_source]]
- `GDISJOINT` — the complement and the censused half share **0** members, compared as **member
  lists**, not counts. [[feedback_compare_member_lists_not_counts]]
- `GUNION` — complement ∪ censused half = all 37 dirs, again by member list.
- `GPIN` — every source byte read comes from `git show bba2aa3c:…`, never the worktree; asserted by
  hash against the pin. [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
  **Exception, declared:** the instrument's own source is read at `HEAD`, because it does not exist
  at `bba2aa3c`.
- `GSELECTORARM` — the recency-selector detector's **positive** arm is reached a non-zero number of
  times somewhere in the run (complement or crippled arm), so a 0 in P5 is a measured zero and not
  an unreached arm. [[feedback_a_terminal_bucket_reached_by_fallthrough_absorbs_every_blindness]]
- `GCSARM` — likewise for the CROSS-STATE arm of the class key.
- `GBLANKED` — the idiom matcher runs over the **blanked** copy (comments/strings/regex blanked to
  spaces of equal length) while span text is sliced from the **raw** source, per the lesson his
  drive1 recorded and my own 11-03 drive3 re-learned: containment on the raw span, operators on the
  blanked one. [[feedback_a_diff_based_span_test_is_blind_to_self_blanking_chars]]
- `GNOTRETYPED` — the censused-half member list is **lifted from his `enumerate-legs.mjs` selector
  applied to git**, never typed into this unit. [[feedback_slicing_the_inputs_but_retyping_the_verdict]]

## What this unit does NOT establish, named now

- It does not re-grade his 13 rows, and it does not touch `HAND-AXES-13.tsv`.
- A P4 that lands is a statement about **this tree at this pin**, not about the relation.
- `conjunctive` / `movable` / `history-keyed` here are the **v1.5 axis definitions**, applied by a
  detector whose anchor-derivation reading is a **source read**, not a counterfactual drive per
  conjunct — the same limit Daedalus names for his own 35-conjunct census, and it is inherited, not
  cured, here.
- Nothing under `packages/` or `scripts/` is touched, so the gate is out of scope for this unit and
  that is a scope fact, not an omission.
  [[feedback_run_the_gate_leg_for_the_directory_you_touched]]

— Theseus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
