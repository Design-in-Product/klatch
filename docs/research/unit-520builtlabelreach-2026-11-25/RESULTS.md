# `unit-520builtlabelreach-2026-11-25` — results

**Seat:** Theseus (Klatch) · **Fire:** 2026-11-25 STOP (19:47 PT) · **Model:** `claude-opus-5`

**Pre-registration** `2802d979` on `main`, pushed **19:49:56 PST**, before any arm, reader, cell, KP,
scratch file or capture existed. **Addendum** `db630b42`, pushed **19:53:06 PST**, after the arm's
only drive and **before the post-hoc that grades it existed**. One drive of each script; `.err`
**0 B** on both.

**16 predictions in two registrations: 12 HIT · 2 REFUTED · 1 OPEN · 1 PARTIAL.**
**Both refutations are mine, and one of them is about the sentence I registered rather than about
the corpus.**

No product change: `git diff --stat HEAD -- packages/ scripts/` **EMPTY**, asserted and printed
inside the arm before any measurement ran.

---

## 1. What this unit took, and why it was a measurement

`unit-516` §9 carried three items as *unblocked, mine, no blocker*. This is the third: **the
inherited concatenated-label blindness, declared by `unit-514` KP11 and never measured for reach.**

KP11 planted `num('tracked files ' + 'read:')` and asserted the miss — every matcher in this corpus
finds the label only inside a single unbroken quoted run, so a label assembled by concatenation
yields **0 occurrences**. That made the whole thread's consumer figures — **13**, **18**, **20**,
**22** — *floors with a declared blind spot* rather than counts.

A declared blindness with an unmeasured reach is indistinguishable, in every published figure, from
no blindness at all. This unit measures the reach and does **not** cure the key: the reach is what
decides whether a cure is worth its price, and the answer here is that it is not.

## 2. The answer: 3 sites of built-label text, and **0 consumers**

```
population (git ls-files, filter /\.(mjs|js)$/ EXTRACTED from published source)   646
  this unit's own files excluded by path                                          yes
files containing the label as committed                                            46   (146 occurrences)
files in which at least one concatenation joint was COLLAPSED                     382   (7164 joints)
label occurrences after collapse                                                  149   corpus gain 3
built-label FILES                                                                   2
built-label SITES (line level, each published with its own text)                    3
of those 3, keyed as a live CONSUMER of the gate label                              0
```

**The published floors are counts in practice.** There is not one consumer of this label, anywhere
in the tracked `.mjs`/`.js` tree, whose label is assembled by concatenation. `13 / 18 / 20 / 22` do
not understate by anything the blindness can reach.

The three sites, keyed mechanically (ordered key, both flags published, not just the winner):

| class | prose | nested | site |
|---|---|---|---|
| **PROSE** | true | true | `unit-513consumernull…/posthoc-nonliteral-matchers.mjs:33` — a docblock line *writing about* the form |
| **PLANT** | false | true | `unit-513consumernull…/posthoc-nonliteral-matchers.mjs:151` — KP5's planted fixture |
| **PLANT** | false | true | `unit-514equalityconsumer…/posthoc-rekey-prefix-and-binding.mjs:244` — **KP11's own plant** |

**`CONSUMER` is the fall-through cell of that key, so it was KP'd reachable before its 0 was allowed
to mean anything** — `K1` plants a built label as a plain own-line argument and asserts it keys
`CONSUMER`, `K4` does the same for a whole-literal consumer. 4 of 4 KP. A terminal bucket nothing can
reach absorbs every blindness, and "0 of 3 are consumers" off an unreachable bucket would have been
the same sentence with none of the content.

## 3. THE KEEPER — a declared blindness becomes its own census population

All three sites are **this thread's own instruments**: two are plants of the blindness, one is a
sentence describing it. `unit-514` KP11 declared the blindness *by planting the form in a tracked
file*. That plant is now a tracked occurrence of the very thing the declaration says cannot be seen.

> **The act of declaring a blindness put the only instances of it into the tree.** A later census
> keyed on the *text* rather than on the *role* of the text would report "3 built-label sites exist,
> so the published floors understate" — and every one of the three would be the studiers' own.

This is the rung below `unit-516` §6, where the entire published consumer figure turned out to be a
measurement of the studiers. That was about the *label*; this is about the *blindness*. The
mechanism is the same and it is now visible in two independent places, so it is a property of
self-instrumenting work and not a quirk of one census:

- a corpus that studies its own gate ends up containing the gate's vocabulary (§6 of `unit-516`);
- a corpus that *declares* a blindness ends up containing the blindness's own witnesses (here).

**The practical rule, and the reason this is worth a paragraph rather than a line:** a reach census
over a declared blindness must key **role before text**. Had this unit published its arm's number
and stopped, it would have published *3 built-label sites in the tracked tree* — true as text,
and the opposite of the finding.

## 4. Against me, first: P6 is refuted by my own registered sentence

I registered the reach at **0**, interval **0–2**. The arm measured **3**. Point and interval both
refuted.

And the refutation is not about the corpus — **the corpus answer is 0, which is what I believed.**
It is about what I wrote down. I registered "built-label **sites**" when the claim I cared about was
"built-label **consumers**", and those are 3 and 0. The arm graded the sentence I registered, which
is correct behaviour and is the whole point of registering it.

> **A prediction is graded on its text, not on its intent.** This seat has recorded the inverse
> failure four times — a foil run at a wider granularity than the claim, reddening against its
> author. This is the same defect entering through the registration rather than through the foil:
> the *claim* was written at the wider granularity, so an honest foil had to refute it.

The cure is the same on both sides and it is cheap: a prediction about a filtered class must name
the filter in the predicate. "0 built-label sites" and "0 built-label sites **that key as
consumers**" differ by six words and by a verdict.

## 5. Against me, second: P10 refuted at ±5 by a drift of exactly 7, and the 7 are all ours

Population **646** against `unit-516`'s published **635 read / 639 matching** — a drift of **7**,
outside my registered ±5. By my own registration, the comparison to the published **22** is
**void**. Rather than leave the difference unexplained, PH2 named it file by file, with the novelty
oracle (`git cat-file -e c99d1d91:<path>`) **KP'd in both directions first**, because an oracle that
answers "absent" for everything hands you this prediction for free:

```
+ unit-517branchorder…/arm-branchorder.mjs                      Daedalus (Klatch)
+ unit-517branchorder…/posthoc-hazard.mjs                       Daedalus (Klatch)
+ unit-518routedternaryreach…/arm-routedternaryreach.mjs        Theseus  (Klatch)
+ unit-518routedternaryreach…/posthoc-separate-the-cripples.mjs Theseus  (Klatch)
+ unit-519positionblindkey…/arm-positionblindkey.mjs            Daedalus (Klatch)
+ unit-519positionblindkey…/diag-prefilter.mjs                  Daedalus (Klatch)
+ unit-519positionblindkey…/posthoc-overadmission.mjs           Daedalus (Klatch)

PH2 HIT — 7 of 7, all units 517–519, all committed today after unit-516's drive
```

**And the drift resolves exactly.** Restricted to the files that existed at `c99d1d91`, the
population is **639** — `unit-516`'s published *639 matching*, to the file — and the built-label
site count is still **3** in the same 2 files (**PH3 HIT**). So the reach is not an artefact of the
growth, and the 646 is commensurate with the 22 *once it is pinned to a reading moment*.

This is Daedalus's `unit-519` PH2 arriving from the other direction. He found that a unit's own
script joins the population it measures between the arm's drive and the post-hoc's. Here the same
mechanism **refuted a registered tolerance**: I priced the drift at ±5 against a corpus that three
units added 7 files to in nine hours. A population figure is not a constant of the tree, and a
tolerance written against one is a tolerance written against a clock.

## 6. The detector, and what it cannot see

The detector is a **joint collapse**: every `(quote) ws* + ws* (quote)` is spliced out, and the
label is counted before and after. `gain > 0` means the file holds label text that exists only once
the joints are spliced.

**KP, 3 planted positives and 1 sliced negative, 5 of 5:**

```
P1  raw 0 → collapsed 1   num('tracked files ' + 'read:')        unit-514 KP11's exact form
P2  raw 0 → collapsed 1   num('tracked files re' + 'ad:')        split MID-WORD — a different shape
P3  raw 0 → collapsed 1   num('tracked ' + 'files ' + 'read')    three parts, two joints
P4  raw 1 → collapsed 1   gain 0, SLICED from unit-510quotepathskip…/arm-quotepathskip.mjs:160
```

**The positives are planted, and that is declared rather than hidden:** whether the live corpus holds
a built label is the question this unit asks, so a *sliced* positive would have presupposed the
answer. The **negative** is sliced — `readFileSync` → `split` → index on a real tracked line — which
is the direction where a real cell can be had.

**P5 — my own blindness, planted and asserted MISSED:** a label assembled through a **variable**
(`'tracked files ' + w`) and one through **template interpolation** (`` `tracked files ${verb}` ``)
both give gain 0. `.concat()`, `Array.join` and any run-time assembly are equally out of reach.
So the **0 consumers** of §2 is itself a floor under a *named* residual, and this unit does not
pretend otherwise.

**P7, the vacuity guard, and it is why the 0 is a finding at all.** The collapse fired in **382 of
646 files**, **7164 joints**, against a registered floor of 20. A reach of 0 consumers returned by a
reader that never ran would be a dead reader agreeing with my prior — the failure this seat has
recorded four times. **P8** publishes the pair that keeps them apart: files where the collapse
changed *text* (**382**) and files where it changed the *label count* (**2**) are different
populations, and the first strictly exceeds the second.

**P9, the false-positive direction, registered OPEN before the drive:** the collapse can manufacture
a label nobody wrote. All 3 gain sites are therefore published with their own line text, and the
hand reading is what turned a 3 into a 0 — site `:33` is a comment *about* the form, which is a true
positive of "built-label text" and a false positive of "built label". Registered as a hazard with
unknown count, resolved at 1 of 3 by reading rather than by counting.

## 7. A unit error, found by comparing two readings of one file

The post-hoc prints the arm capture's size as **`8497 B`**. `wc -c` on the same file returns
**8569**. Both are right about different things: `String.length` is **UTF-16 code units**, and the
capture contains multi-byte characters (`—`, `·`, `⇔`, `−`). The post-hoc's label is wrong, not its
number. The addendum's **8569 B** is the byte count and stands.

Small, and recorded because the class is not: **a size assertion in characters wearing a `B` label
will agree with a byte-count assertion on pure-ASCII content and disagree silently the moment a
dash is typed.** Every span-intactness assertion in this corpus that compares `span.length` to a
number is measuring code units; the ones that compare two `.length` values to each other are
unaffected, and the ones that compare a `.length` to a figure read with `wc -c` are not.

## 8. Verdicts

| id | verdict | note |
|---|---|---|
| P1 | **HIT** | KP11's exact form: raw 0, collapsed 1 |
| P2 | **HIT** | mid-word split — a second shape, not a second instance of one |
| P3 | **HIT** | three parts, two joints |
| P4 | **HIT** | sliced known negative, gain 0 — the collapse invents nothing |
| P5 | **HIT** | my own blindness asserted: variable and interpolated forms both gain 0 |
| **P6** | **REFUTED** | reach registered 0, interval 0–2; measured **3 sites**. Refuted on the sentence I wrote; **0** at the granularity I meant (§4) |
| P7 | **HIT** | vacuity guard: collapse fired in 382 files / 7164 joints against a floor of 20 |
| P8 | **HIT** | 382 text-changed vs 2 count-changed — different populations, as registered |
| P9 | **OPEN→resolved** | manufactured-hit hazard: 1 of 3 sites is one, found by hand reading the published line text |
| **P10** | **REFUTED** | population 646 vs published 635/639, drift **7** against a registered ±5 → comparison void as registered; **explained and resolved** at §5 |
| PH1a | **HIT** | 0 of 3 key as CONSUMER, bucket KP'd reachable |
| PH1b | **HIT** | 3 of 3 under `docs/research/unit-*/` |
| PH1c | **HIT** | the keeper: the declaration created its own census population |
| PH2 | **HIT** | 7 of 7 added files are units 517–519 |
| PH3 | **HIT** | 3 sites in the old population of **639** — exactly `unit-516`'s published 639 |
| PH4 | **PARTIAL** | graded only as far as a per-unit *count* allows; 3 of 3 gain lines hold no whole-literal label, so none could have been found by the region-aware key. The row-level coincidence is **declared unresolved**, not claimed either way |

**12 HIT · 2 REFUTED · 1 OPEN(resolved) · 1 PARTIAL of 16.**

## 9. Open after this unit

- **Closed by drive:** the concatenated-label blindness's **reach**, carried unmeasured since
  `unit-514` KP11. **0 consumers** across 646 tracked `.mjs`/`.js` files, under a detector KP'd 5 of
  5 with the vacuity guard at 382 files / 7164 joints. The thread's consumer figures are counts in
  practice, under the named residual of §6. **No cure is owed:** a paren- or binding-aware key would
  buy 0 rows today, and the class the cure cannot reach is declared rather than discovered.
- **Unblocked, mine, not done, no blocker:** the **frozen-population-prediction pattern defect**
  (`unit-516` §5) — still the pattern, not the instance. §4 of this unit is a second face of it:
  the granularity can be wrong in the *registration* as well as in the foil, and nothing in either
  seat's corpus checks that a prediction's predicate names the filter its subject is under.
- **Unblocked, mine, not done, no blocker:** `SECOND-ARG`'s nested-call blindness (`unit-516` P6) —
  a paren-aware argument splitter would reach it; no reader in either seat's corpus has one.
- **Mine, newly named, no blocker:** the `.length`-as-bytes class of §7. One mislabel found; the
  census of span assertions that compare `.length` to a figure taken with `wc -c` is **not run**.
- **xian's, and only his:** `unit-516` §5's 15-vs-0 census-purpose choice. Unchanged by this unit.
- **No owner, twentieth night:** the `ABSENT` hole.
- **Figures to carry, each with its reading moment:** **0** built-label *consumers* and **3**
  built-label *text sites* at `db630b42` over a population of **646**; **639** and the same **3** at
  `c99d1d91`, which reproduces `unit-516`'s published 639 exactly; **382 / 7164** as the vacuity
  reading; **46 / 146** label-bearing files and occurrences as committed.

— Theseus
