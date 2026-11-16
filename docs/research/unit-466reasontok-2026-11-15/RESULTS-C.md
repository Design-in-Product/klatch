# unit-466reasontok — RESULTS C (arm C: the re-key of my own declared limit 1)

**Daedalus, 2026-11-15, STOP fire.** Pin **`5d430e54`** (arm A's pin, held constant on purpose).
Pre-registration C **`216072b2`**, pushed to `main` **before `arm-reasontok-c.mjs` existed**.
Arms A and B are **unedited**; `RESULTS.md` is unedited. `drive3.armc.err` is **0 bytes**.

**8 legs, 0 red. 6 predictions graded, 3 refuted, 0 void — and 6 of 6 registered were graded**,
which is the thing arm A failed to do.

## §0 The answer, and it is not the one the re-key was built to find

The re-key **does not overturn** arm A §0's "0 genuinely false reasons." It does something I did
not pre-register as an outcome at all: **it destroys the screen's precision.**

| | arm A, as published | arm C, widened + repaired |
|---|---|---|
| token key | backtick only | BACKTICK + DQUOTE + SQUOTE |
| (token,site) pairs | 296 | **829** (296 / 348 / 185 by form) |
| recordings reached | 25 | **43** |
| citation resolution | as-printed | + unique bare basename |
| screenable pairs | 242 | **718** |
| unresolvable | 54 — 18.2% | **111 — 13.4%** |
| FLAGGED, substring test | 84 — **34.7%** of screened | **432 — 60.2%** |
| FLAGGED, boundary test | — | 436 — 60.7% |
| FLAGGED, boundary-on-stripped | — | **594 — 82.7%** |

**A screen that flags 83% of its own population is not a screen.** And the composition says why:
of the **348 newly flagged** pairs, **201 — 57.8% (`Q7` LANDS)** have their token absent from the
**whole cited file**, not merely from the cited line. Those 348 pairs collapse to **24 distinct
tokens**, and the list is its own argument:

```
["A1b","C1","DEFECT","E","GRADE","HEAD","MAX_HISTORY_MESSAGES","REFUTED","bba2aa3c",
 "conjunctive","execFileSync","files","git","knownPositiveSeen","members","pin",
 "round373","round374","round431","round433","round435","show","sites","utf8"]
```

`bba2aa3c` is a **commit sha** — it matches `[A-Za-z_$][\w$]*` perfectly. `round373`, `A1b`, `C1`,
`GRADE`, `REFUTED`, `DEFECT` are leg ids and round labels. These are quoted *strings in a
recording*, not identifiers a leg is reasoning about, and the key cannot tell the difference.

**The finding, stated against myself:** arm A's narrow backtick key was not merely narrow. It was
**silently doing the work of a precision filter that nothing else in the screen supplies** — in
this corpus an author backticks an identifier and double-quotes a label, a sha or a round name.
Widening the key removes that filter and nothing replaces it. "0 genuinely false reasons in 1213
recordings" is therefore **not a figure the re-key overturns; it is a figure the re-key makes
uncheckable at this scale** — 594 flags is past hand-reading, which is what arm A's §0 rested on.

## §1 The four answer keys all hold, and together they correct my own arm A §0

All four were read out of `git show` **before the arm was written** and declared in pre-reg C, so
they carry no predictive credit. All four read as declared.

- **KPa ok** — instance 1 is found by **`DQUOTE` only**: `forms that find it: ["DQUOTE"]`. The
  widening reaches it; the published key still misses it.
- **KPb ok** — once reached, instance 1 reads **CLEAN** under substring *and* boundary. `KP_G`
  really is in `enumerate-legs.mjs:275`. **The screen clears it, correctly.** So "it would have
  been caught" fails for a second reason entirely independent of the key: there was nothing there
  to catch.
- **KPc ok** — instance 2's citation is a **bare basename**, and arm A bucketed it
  `noFileInTree`. **It was reached into the pair population and never screened at all.**
  `BASENAME_UNIQUE` screens it.
- **KPd ok** — instance 2 reads **CLEAN under substring AND under boundary**. The word `in` is in
  the subject twice over: inside `join`, *and* standalone as English prose inside the line's own
  template literal (`leg(s) in ${KP_G…`). **The boundary repair alone does not rescue it.**

**Correcting arm A §0 in my own words:** I wrote that instance 2 "is reachable." That is true and
it is **not the claim a reader takes from it**. Reached ≠ screened. Under the published key, arm A
**reached one of Theseus's three instances and screened none of them.** Under arm C's full chain it
reaches and screens two, and flags exactly the one that is a false reason — instance 2, and only
under `BOUNDARY_STRIPPED`. **The screen's logic was never the problem. Its key is the whole cost.**

## §2 The three refutations, including one refuted by a single member

- **`Q3` REFUTED at 13.4%** against <10%. The rate fell from 18.2% — and the **absolute count rose,
  54 → 111**. All 111 remaining unresolvables carry a **directory** (`noFileInTree_hadDir`); every
  one of the **87** bare-basename pairs resolved, because all 87 basenames are **unique** in a tree
  of 6589 files (5837 distinct basenames, 5683 unique, 154 shared). The repair I built worked
  completely and the rate still missed, because the widening brought in **its own new class** of
  unresolvables faster than the repair cleared the old one. A rate improving while its numerator
  doubles is a thing I should expect to see again.
- **`Q4` REFUTED at 4** against ≥5 — **refuted by one member**. The `in` ⊂ `join` shape is rarer in
  the screened set than I guessed; boundary matching is nearly free here. All four flips are printed
  in `drive3.armc.out`, and all four are **comment lines**, which is a hint `Q6` then confirms.
- **`Q5` REFUTED, and this is the useful one.** I predicted `stripSource(src, true)` would blank a
  template literal's `${…}` interpolations along with its prose, manufacturing a false positive on
  instance 1. **It does not — the scanner is interpolation-aware.** The stripped line, printed
  verbatim by the arm rather than asserted:

  ```
  "`                                   ${kpGLegs.length}           ${KP_G.replace('              ', '')}  ${kpGLegs.map((l) => l.id).join(' ')} `);"
  ```

  Prose blanked, every interpolation's **code** intact, same length. `KP_G` survives, instance 1
  stays correctly clean, and **instance 2's `in` is gone** — `BOUNDARY_STRIPPED` flags it. So the
  strip repair is **sound on both members I can hand-check**, which is exactly why `Q6` matters.

- **`Q6` LANDS at 48 vs 4 — 12×, not 2×.** The strip repair is sound per-member and **expensive
  across the population**: it flips 48 of arm A's own 158 CLEAN pairs. Combined with the 83% flag
  rate, the honest reading is that `BOUNDARY_STRIPPED` is the **right test and an unaffordable one**
  under this pairing key. The pairing key — SAMELINE — is what needs the next cure, not the
  containment test.
- **`Q1` LANDS at 348** DQUOTE pairs vs arm A's 296 backtick ones, and `Q7` as above.

## §3 `REPRO` — why the comparison is a key delta and not two measurements

`REPRO ok`: arm C recomputes the published key (BACKTICK + AS_PRINTED + SUBSTRING) off the same pin
and reproduces **all five** of arm A's printed figures exactly — `296 / 242 / 54 / 84 / 158`. Arm A's
drive1.out is the answer key; I read it this fire before writing arm C, so `REPRO` is a **leg, not a
prediction**. Without it, every number in §0's right-hand column would be a second measurement of
an unknown instrument rather than a delta on one key.

`Q2 ok` — monotonicity, **lost = 0**: no pair the published key screened is missing from the widened
pass. A widening that drops a member is a defect, and this one does not.

## §4 Declared limits

1. **The population is frozen at `5d430e54` on purpose, so arm C is not a current census.** Every
   recording committed after that pin — all of Theseus's `unit-466xjoin` — is outside it. Quoting
   any figure here as "the corpus" is wrong.
2. **Resolution is reported per-pass, not per-form.** `resolved how: {basenameUnique: 87, exact:
   631}` is over all three forms together. How many of arm A's own 54 unresolvables were bare
   basenames is **not** published here; I did not split it and am not asserting it.
3. **`newlyFlagged` is published as 348 pairs over 24 distinct tokens.** The distinct *pair* count
   for that subset was not printed. Pair-level dedupe is near-identity corpus-wide (829 → 819), so
   the inflation is **token-level multiplicity on long recording lines**, but the subset figure is
   a limit, not a measurement.
4. **`tokenAbsentFromWholeCitedFile` uses the boundary test over the whole blob**, not the stripped
   blob. A token appearing only inside a comment elsewhere in the file counts as present.
5. **`Q7`'s 57.8% is not a false-reason rate.** It is the share of new flags whose token is absent
   from the whole cited file — a *pairing* defect, which is the opposite diagnosis.

## §5 Boarded by this arm, unblocked, either seat

1. **The SAMELINE pairing key is the live defect, not the containment test.** A single long
   recording line carrying one quoted label and four citations yields four pairs, none of them a
   reasoning relation. A cure keyed on **proximity within the line** (token adjacent to its
   citation, not merely co-resident) is the next cut, and `Q7`'s 201 members are its known-positive
   set.
2. **A form-aware precision rule.** This corpus backticks identifiers and double-quotes labels,
   shas and round names. If that holds as a census over the 43 recordings, `DQUOTE` should be
   screened under a *different* rule, not the same one — which is a census, not a guess.
3. **A sha/round-label exclusion**, which is the cheap partial of item 2: `/^[0-9a-f]{7,40}$/` and
   `/^round\d+$/` would remove a named share of the 24 tokens. Worth exactly what the census in
   item 2 says it is worth, and not more.

— Daedalus
