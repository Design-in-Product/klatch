# unit-464addarm — RESULTS

**Seat:** Theseus · **Date:** 2026-11-04 (START fire) · **Routed by:** Daedalus, 11/04 START §7

**Pins:** subject `268457d1` (arm `[3]` itself) · population `0ae48068` (the files) ·
recording `3dbae1eb` (his committed 40/18/8 and the 18 names) · hand read `721fb5b4` (its own blob)

**Files:** 11 · 3 numbered drives · 3 `.out` · 3 `.err` · **0 non-empty `.err`** · 1 computed
`.txt` delta — counted with `readdirSync` + `statSync` over the directory, not from the shape of
the plan.

**Legs:** 13 · **11 GREEN · 2 RED**, and **both REDs were registered in advance** — P4 as
"possibly 0" in the pre-registration, P6's RED as the expected finding in addendum 1 §4.

---

## 1. The answer to the routed question

His 45% was a **ceiling**, and he said so. The real price, hand read at the site level:

```
arm-[3]-only files (his ceiling)                18 of 40   45%
hand-read site classes          R 11 · A 8 · O 1 · W 0     (20 sites, not 18)
R-RETAINING — a cure drops these WRONGLY        10 of 40   25%
FP-ONLY     — a cure drops these CORRECTLY       8 of 40   20%
```

So narrowing arm `[3]` buys about **20%** and costs about **25%**. The ceiling splits almost evenly,
and **not along the `--diff-filter=A` line.**

## 2. The sharper result: his 8 is the right size and the wrong set

```
|his ADD| 8      |my FP-ONLY| 8      ADD-not-FP 1      FP-not-ADD 1
  ADD-but-R-RETAINING   round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.mjs
  FP-but-NOT-ADD        unit-464vac-2026-10-31/grade-cure.mjs
```

Two counts agree exactly and the member lists are wrong **in both directions, by one each**. That is
the characteristic signature of a count standing in for a member list, and it is why he was right to
refuse to read the 8 as a false-positive count — had he read it off, he would have been numerically
almost exactly right and wrong about two of his eight members.
`[[feedback_compare_member_lists_not_counts]]`

**round429 — his flag over-credits.** arm `[3]` matches line 205,
`revsOf = (p) => git('log','--format=%H','--',p)`, consumed by
`newestWithout(p,token) = revsOf(p).find(r => !includes(token))` — newest rev lacking a token, which
moves whenever a newer commit lacks it. Genuinely history-keyed. The file's `--diff-filter=A` is a
**different call** at line 123 using `--format=%an`, which **arm `[3]` cannot match at all** —
neither `%h` nor `%H`. A true file-level co-occurrence.

**unit-464vac — his flag under-credits, and this is the one that matters.** arm `[3]` matches
`git('log','--format=%H','--reverse',`${BASE_REV}..HEAD`,'--',LIVE_REL)` then `[0]`: the **oldest**
commit since a fixed baseline that touched the checker. The subject's own comment, lines 50–52:

> anchored on the EVENT, not on recency ... **That rev cannot move however many commits this unit
> makes afterwards.**

A deliberately **stable** anchor, built from `--reverse` over a fixed range, with **no
`--diff-filter=A` anywhere in the file**. His flag is blind to it by construction.

**The consequence for the cure, and it is the headline:** **no tightening of arm `[3]` keyed on
`--diff-filter=A` — file-level, span-level or call-level — can reach the full false-positive set**,
because at least one false positive does not use that flag. A cure keyed on the flag has a known
blind spot of ≥1 before it is written.

## 3. His unit was too wide, and mine was too narrow

He keyed the flag on the **file**. My pre-registered P3a keyed it on the **span**. Both are the
wrong unit, in opposite directions:

| unit | ADD files attributed | why it is wrong |
|---|---|---|
| **file** (his) | 8 of 8 | `--diff-filter=A` anywhere counts — round429's is in a call arm `[3]` cannot match |
| **span** (my P3a) | **1** of 8 | arm `[3]`'s match **starts at `--format=`**, and this corpus puts git's flags *before* it |
| **call** (addendum 1) | **7** of 8 | the unit that actually decides |

**P3aSPAN is reported at its own figure and declared MISKEYED in the same breath.** It met its
registered threshold (1 < 8) and it **graded nothing** — the threshold was met by an artefact of
where arm `[3]`'s match begins. Its GREEN is not claimed as a result.
`[[feedback_a_published_sentence_keyed_on_a_cell_name_is_not_keyed_on_a_measurement]]`

**P3a-CALL: over-credit = 1. P3b-CALL: under-credit = 1.** Both as member lists, §2.

## 4. 20 sites, not 18 — and one file's two sites take different classes

**P2SITES GREEN.** A global non-overlapping walk finds **20** arm-`[3]` match sites across the 18
files. His `.test` stops at the first match per file, so it never saw `round421#2` or `round422#2`.

`round422-instruments/drive-his-421.mjs` carries **`[O,R]`** — its two sites take **different
classes**:

* `#1` (line 122) → `curedAt = gradedHistory.find(r => r.startsWith('4adcc0bf'))`: a **literal-SHA
  membership test** over history. A new commit cannot change whether that SHA is in there. Does not
  move. Class **O**.
* `#2` (line 126) → `graderAddedAt.length === 1 && graderAddedAt[0] === curedAt`: a newest-first
  `[0]` plus a length assertion, both of which move the moment the grader is touched again. Class
  **R**.

A one-match-per-file key cannot represent a file whose matches disagree. That costs nothing *here*
— the file is R-RETAINING either way, because `#2` is R — but it is a representability limit, not a
rounding error, and a file whose only R site were its second would be classed from its first.

## 5. P4 is REFUTED at 0, and that is a real negative

**P4WINDOW RED: 0 of 20.** No arm-`[3]` span crossed a call boundary; every `depthMin` is 0.

Registered as **possibly 0** in the pre-registration and confirmed as that case in addendum 1 §5
*before* the grading run. The 240-character window **can** fuse two calls — `KP-W` constructs it and
reads `depthMin −2` — so the `W` branch is **alive and measured empty**, not absent and untested. A
branch with no witness and no members cannot be told from a dead one.
`[[feedback_an_undefined_rival_is_silent_not_refuted]]`

So the third mechanism I predicted does not occur in this corpus. My §3 of the pre-registration
asserted it would; it does not, and I am reporting my own prediction as refuted rather than
softening it.

## 6. P6 is RED at 18 of 20, and its RED is the measurement

**P6AGREE RED.** The classifier agrees with the hand read on **18 of 20**. Both disagreements run in
**one direction** — the classifier calls `R` what the hand read calls something stable:

```
round422#1      hand O / classifier R     literal-SHA membership test over history
unit-464vac#1   hand A / classifier R     --reverse over a fixed range, [0]
```

Addendum 1 §4 registered this RED in advance, with its reason: **stability is not mechanically
decidable from the call**, because it depends on the **consumer** — `[0]`, `.pop()`, `.find(pred)`,
`.length`, a literal-SHA test — which lies outside both the span and the call. The hand read is the
measurement; the classifier is what P6 grades, and it is the classifier that is wrong here.
`[[feedback_small_population_hand_reading_is_primary]]`

This is also why P5 is computed off the **hand read** and not off the classifier: the classifier's
own FP-ONLY count is **7**, against the hand read's **8**, and the missing member is unit-464vac —
the single most important row in the unit.

## 7. P7: a witness per class, and a refused negative

**P7WITNESS GREEN, blocking, run before any figure was reported.**

```
KP-A   HIS committed ADD_LINE, lifted from grade-kpspan.mjs at 3dbae1eb   1 site, class A
KP-R   HIS committed REC_LINE, same lift                                  1 site, class R
KP-W   two CLOSED calls inside the 240-char window                        1 site, class W (depthMin -2)
KN     --format=%h with no quoted `--` in the window                      0 sites — REFUSED
```

KP-A and KP-R are **his own committed literals**, lifted by anchored slice and evaluated, not
retyped and not analogies. `R` is the classifier's **fall-through** bucket, so it absorbs every
blindness above it — which is exactly what P6 then measured, and found absorbing 2 of 20.
`[[feedback_a_fall_through_terminal_bucket_absorbs_every_blindness]]`

## 8. The cripple is REACHED on a figure, and the delta *is* the over-credit

`--cripple=wholefile` degrades the ADD test's unit from the **call** back to the **file** — his unit,
one level up. Computed in `cripple-delta.txt`, not eyeballed:

| figure | call (published) | whole file (crippled) | delta |
|---|---|---|---|
| P3a-CALL numerator | 7 | 8 | **+1** |
| classifier FP-ONLY files | 7 | 8 | **+1** |
| classifier `A` sites | 7 | 8 | +1 |
| classifier `R` sites | 13 | 12 | −1 |

Registered threshold: at least one of (P3a-CALL numerator, FP-ONLY count) must differ. **Both do.**
**CRIPPLE REACHED on a FIGURE**, so P3a-CALL is graded rather than ungraded.

And the delta is not a generic "the key matters" — **the one member it manufactures is round429**,
the same single member measured as the over-credit in §2. The cripple and the finding are the same
fact approached from two directions. The whole-file arm also drives P6 from 2 disagreements to **3**,
in the wrong direction, newly calling round429 class `A` when the hand read says `R`.

**The cripple switches the key, not the subject.** `git status --porcelain` over `docs/research/`
shows only this unit's own three new recordings; nothing under `packages/` or `scripts/` was touched
at all.

## 9. Defects of mine, this unit

1. **GBOOT could only ever go RED.** The subject's `sliceFrom` closes over `die` and returns
   `{ text, lines }`; I injected nothing and compared an object to a string, and a bare
   `catch { return false }` swallowed the `ReferenceError` that said so. It failed **closed**, so it
   laundered nothing — but it graded nothing either, and the reason it printed ("the bootstrap
   disagrees") was **false**. Both repairs lifted from how **his own passing control** does it
   (`grade-kpspan.mjs:132-145`), not invented to make my leg pass.
   `[[feedback_a_guard_on_identity_does_not_guard_value]]`
2. **A display line shadowed the row I wanted.** My first parse of his recording searched the whole
   file for `wide-selector files`; his P6REPRO **leg note** carries that label earlier and ends
   `(pub 40)`, so my trailing-number capture returned `null` and GANSWERKEY went RED for a reason
   that had nothing to do with his recording. Re-anchored on the P5 **section**.
   `[[feedback_a_display_field_can_shadow_the_join_key]]`
3. **The classifier silently ran at the wrong unit.** The sites never recorded `start`/`end`, so
   `enclosingCall` scanned `undefined`, returned `null` for all 20, and my `?? site.span` fallback
   **restored the exact span-level unit addendum 1 exists to replace**. P3a-CALL printed 7
   over-credits against my hand read's 1 and looked like a measurement. The null case is now
   UNRUNNABLE. A fallback to the unit under repair is not a fallback.
4. **P3a as pre-registered was keyed on the span**, which is the wrong unit — caught from drive1's
   own dump, declared MISKEYED in an addendum pushed **before** the grader for the repair existed,
   and still reported at its own figure rather than deleted. The repair is **NOT BLIND** and is
   declared as such: I had read all 20 spans before writing it.
5. **My §3 prediction was wrong.** I predicted the 240-char window would be fusing calls in this
   corpus. It is not — 0 of 20. Reported as refuted (§5).

## 10. What this does not touch

* **The label.** `history-keyed > movable` is a PRESCRIPTION because my own hand read of all 11
  candidates found **0 conjunct pairs with disagreeing figures**
  (`unit-464inspan-2026-11-03/HAND-READ-11.tsv`). Nothing here bears on that in either direction.
* **Arm `[3]` is not cured.** Same reason he gave and I agree with: the prescription rests on the
  wide arm, so tightening it moves the figure the label is published on. This unit **prices** the
  cure. §2's blind spot now also means a flag-keyed cure is known-incomplete before it is written.
* **The other three `SELECTOR_WIDE` arms**, and §2.1h's narrow-arm under-report, are untouched —
  a different direction and a different measurement.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
