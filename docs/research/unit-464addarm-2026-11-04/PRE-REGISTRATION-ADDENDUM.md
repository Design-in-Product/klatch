# unit-464addarm — addendum 1: P3a as registered is keyed on the wrong unit

**Filed 2026-11-04, after drive1's enumeration and before any classifier exists.** drive1 is
committed at the rev before this file (`grade-addarm.mjs` at that rev contains **no classifier**),
and `HAND-ARM3.tsv` has not been written yet.

**Blindness declaration, honest and unflattering:** by the time I write this I have read all **20**
spans and their context in `drive1.enumerate.out`. The call-level key registered below is therefore
**NOT BLIND** — I am repairing a key after seeing what it does to the corpus. It is registered
*before the grader for it exists* and before the hand read is filed, which is the most I can claim;
it is not a blind prediction and is not labelled as one.
`[[feedback_prose_written_beside_its_own_cure_needs_a_pin]]`

---

## 1. What drive1 showed, and why P3a as written cannot answer the question

P3a was registered as: *of his 8 `ADD` files, the number whose arm-`[3]` site set contains at least
one site whose **own matched span** carries `--diff-filter=A` is fewer than 8.*

drive1 reports that number as **1 of 8** (`round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs#1`
is the only site of 20 whose span carries the flag). So P3a lands GREEN — and it lands GREEN for a
reason that is a defect of **my** key, not a fact about his.

Arm `[3]` is `/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/`. **Its match starts at `--format=`.** In
this corpus the conventional argument order puts git's own flags *before* `--format`:

```
'log',
'--diff-filter=A',      <- outside the span, structurally
'--reverse',
`--format=%H${SEP}%an`, <- the span STARTS here
'--',                   <- and ends here
```

So a span-level test for `--diff-filter=A` **under-reports addition-keyed calls almost by
construction**. The span is narrower than the thing that decides.

His unit is **the file**, which is too wide — that is his own stated limit and the reason he routed
this. Mine was **the span**, which is too narrow. Neither is the unit that decides.

**The unit that decides is the enclosing CALL.**
`[[feedback_a_proximity_window_consumer_key_over_reports]]`
`[[feedback_an_undifferentiated_containment_match_fuses_two_mechanisms]]`

## 2. P3a-CALL — the repair, registered here

**Enclosing call**, defined mechanically and not by eye: from the match start, scan **backwards**
tracking bracket depth — on `)`/`]`/`}` increment, on `(`/`[`/`{` decrement unless depth is already
0, in which case that character is the **opener**. Then scan **forwards** from the opener to its
matching close. The characters between are the call's argument list.

**P3a-CALL:** of his 8 `ADD` files, the number whose arm-`[3]` site set contains at least one site
whose **enclosing call** carries `--diff-filter=A`. The **over-credit** of his file-level flag is
`8 − that number`.

**P3b-CALL, its mirror:** of the 10 non-`ADD` files, the number with a site the hand read calls
**stable**. That is the **under-credit** — stable anchors his flag cannot see at all.

Reported as **member lists**, both directions, because a count that happens to be right is not the
same as a member list that is right, and two counts agreeing over a denominator neither of us
re-derived agree vacuously. `[[feedback_compare_member_lists_not_counts]]`

**P3a as originally registered is reported too, at its own figure (1 of 8), and declared MISKEYED
in the same breath.** It is not deleted and its GREEN is not claimed as a result — a leg whose
threshold was met by an artefact of its own key graded nothing.
`[[feedback_a_cell_name_key_is_not_a_measurement_key]]`

## 3. The classifier P7 grades, stated as branch literals

Three classes, in this order, from the branch literals and not from a sentence about them:
`[[feedback_derive_the_verdict_predicate_from_the_branch_literals]]`

```
if (depthMin <= -1)                        -> 'W'   // the span crossed a call boundary
else if (/--diff-filter=A/.test(callText)) -> 'A'   // addition-keyed: a STABLE anchor
else                                       -> 'R'   // history-keyed: moves as history grows
```

`R` is a **fall-through** bucket, so it absorbs every blindness above it and must not be read as a
positive finding on its own. P6 exists precisely to measure how much it absorbs.
`[[feedback_a_fall_through_terminal_bucket_absorbs_every_blindness]]`

## 4. The limit of this classifier, stated before it runs

**Stability is not mechanically decidable from the call.** Whether a selection *moves as history
grows* depends on what the **consuming** code does with the result — `[0]`, `.pop()`, `.find(pred)`,
`.length`, a literal-SHA membership test — and the consumer lies outside both the span and, often,
the call. A `--reverse` over a fixed base range is a **stable** anchor built without
`--diff-filter=A` at all.

So the division of labour, registered:

* the **hand read** (`HAND-ARM3.tsv`) classifies each site by reading its **consumer**, and is the
  **primary measurement** for P5. 20 sites is a small population and hand reading is the right
  instrument for it. `[[feedback_small_population_hand_reading_is_primary]]`
* the **classifier** automates only what is mechanical — `W` by depth return, `A` by call-level
  `--diff-filter=A` — and **P6 grades the classifier against the hand read**, never the reverse.

**P6 is expected to go RED, and its RED is the finding, not a bug.** If the classifier calls a site
`R` that the hand read calls stable, that is a measurement of how far *any* key built on
`--diff-filter=A` — file-level, span-level or call-level — falls short of the real false-positive
set. I register that expectation here so a RED cannot be re-read afterwards as a surprise, and so
a GREEN would be the informative outcome instead.
`[[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]`

## 5. P4's figure, already visible and registered as a real negative

Every one of the 20 sites has `depthMin = 0`. No span crossed a call boundary, so **P4 lands at 0**
and class `W` is **empty on this corpus**. P4 was registered as possibly 0 and this is that case:
the 240-character window is wide enough to fuse two calls, and this corpus does not exercise it.

The `W` branch is kept in the classifier anyway, with `KP-W` as its only witness, so the class is
**demonstrably alive and measured at zero** rather than absent and untested — a branch with no
witness and no members cannot be told from one that is dead.
`[[feedback_an_undefined_rival_is_silent_not_refuted]]`

## 6. No threshold moves

This addendum adds P3a-CALL and P3b-CALL and declares P3a MISKEYED. It changes **no** threshold on
P1, P2, P4, P5, P6, P7 or the cripple, and it does not touch P5's registered absence of a threshold.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
