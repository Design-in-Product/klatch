# Addendum 2 to `unit-464cons`'s pre-registration

**Registered 2026-11-04, WORK fire, after drive1 ran and BEFORE the grader is edited.** drive1's
recording (`drive1.compare.out` / `.err`, `VERDICT/1 RED legs=14 green=10 red=[GBOOT,GMOVEDKP]
unrun=[GORDER,P8R441]`) is committed **as it ran** in the same commit as this file. Neither change
below moves a threshold or a verdict on any substantive leg; both repair instruments of mine that
printed a **false reason**.

---

## 1. `GBOOT` went RED on all three slices, and nothing disagreed

drive1 printed `disagreements: sliceFrom,SELECTOR_WIDE,MOVABLE_WIDE` — all three. **That reason is
false.** The subject's own `sliceFrom`, at `268457d1:docs/research/unit-464presc-2026-11-03/census-presc.mjs:64-73`,
returns an **object**:

```js
return { text: lines.slice(a, b + 1).join('\n'), lines: b - a + 1 };
```

My bootstrap returns a **string**, and I compared the two with `!==`. Every comparison was
therefore unequal regardless of content, and my bootstrap check compared a type, not a slice.

**Direction of the failure, which is the only mitigating thing about it:** it **fails closed**. A
mis-keyed bootstrap check that can only go RED cannot launder a bad lift into a green — it can only
block. So nothing downstream of it was validated by a check that wasn't checking; `GARMS` carried
the real assurance independently, by asserting that arm `[3]` is **byte-identically** the published
`/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/`, and it passed.

**This is the same defect Theseus reports in his own `GBOOT` this morning** (his §8, defect 1:
"object compared to string, `die` not injected, a bare `catch` swallowing the `ReferenceError` —
fails closed, so it laundered nothing, but its printed reason was false"). Two seats, two
instruments, the same day, the same mis-key, each found by its own drive. That is worth recording
as a **class** rather than twice as an incident: *a lifted function's return SHAPE is part of its
interface, and a bootstrap check that does not read the shape is comparing types.*

**Repair, registered:** compare against `.text` when the lifted slicer returns an object, and
assert the shape explicitly so a future change of return type is a RED with a true reason rather
than a RED with a false one. **Threshold unchanged** — byte-identical on every slice.

## 2. `GMOVEDKP`'s matched negative was keyed on a path that does not exist at one of the two revs

drive1 printed `the OLDEST commit of unit-464presc-2026-11-03/census-presc.mjs is null at both revs
(stable=false)`. Measured this session, with `git`:

* `git ls-tree -r --name-only 0ae48068 -- docs/research/unit-464presc-2026-11-03/` returns **nothing**.
* `git merge-base --is-ancestor 268457d1 0ae48068` exits **1** — the **subject pin is NEWER than the
  population pin**.

So the subject's own directory **does not exist at the population pin**. That is not a bug in the
pins: it is why Theseus's population figure and mine both come to 310 with the subject's directory
absent, and his drive1 and mine agree on it. The bug is entirely mine — I chose the **subject** as
the declared path for the test's matched negative, and a matched negative over a path that is
**absent** at one rev is not a negative. It is an absence, and `null !== null` is `false`, so it
printed as a disagreement.

**The sharper version, and the reason this is worth a paragraph:** the leg read `stable=false` and
would have been reported as "this selection moved" if the sign had gone the other way. A
differential test that cannot tell *moved* from *absent at one end* has a third state it does not
represent — the same shape as the `UNRUN` state I had to add to drive1 of `unit-464kpspan` this
morning for a different reason.
[[feedback_a_false_false_row_cannot_be_told_from_an_untouched_defect]]

**Repair, registered, in two parts:**

1. **Re-key the matched negative** onto a path drawn from the arm-`[3]`-only set itself, which by
   construction exists at the population pin — `arm3Only[0]`, taken from the measurement rather
   than typed. Its **oldest** commit must be identical at both revs, because history is
   append-only behind a path that already exists.
2. **Add the missing state.** Before comparing, assert the path resolves at **both** revs. If it
   does not, the leg reports **UNRUN** with the absent rev named, never RED and never green.
   `moved`, `stable` and `unresolvable` are three different findings and the instrument must be
   able to say which one it got.

**Threshold unchanged:** the KP must still read MOVED and the matched negative must still read
STABLE, and `P8MOVED`'s registered asymmetry (addendum 1 §2 — `MOVED=true` is sound evidence for
**R**; `MOVED=false` is *not* evidence for **A**) is untouched.

## 3. What drive1 already established and is NOT re-opened by either repair

Recorded here so that the repairs cannot be read as having produced the findings:

* **`P1REPRO` GREEN** — 310 / 40 / 18 / **20**, against his figures **parsed from his committed
  `.out`**, ran and passed *before* any class was compared.
* **`P5AGREE` GREEN at 15 of 16** blind sites, floor 14. The single disagreement is
  `unit-464t2-population…#1`, mine **R**, his **A** — the row addendum 1 registered in advance as
  the one worth measuring.
* **`P2WITNESS` GREEN** — the witness file holds **0** occurrences of `--diff-filter=A`. His
  existence-negation stands on a mechanical fact and no classifier.
* **`P3OVER` GREEN** — round429's one flag occurrence (line 123) is outside its one arm-`[3]` match
  range (line 205), by index arithmetic.
* **`P7SYMDIFF` GREEN** — my ADD set re-derived per occurrence is **8**, so his "same size" framing
  is not downstream of an under-count of mine; and the symmetric difference against **my** FP-ONLY
  is **3**, not 2.
* **`P8MOVED` GREEN** — the disputed selection reads **40** unit-dir rows at the pin and **45** at
  HEAD.

Both repaired legs are **instrument checks**, not measurements. Neither one's repair can change a
single number above.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
