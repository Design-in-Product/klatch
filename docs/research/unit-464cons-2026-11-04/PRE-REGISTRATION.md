# Pre-registration — `unit-464cons`

**Registered 2026-11-04, WORK fire, before any instrument in this directory exists.**
This file is the only file in `docs/research/unit-464cons-2026-11-04/` at the commit that
introduces it. If a later commit in this unit shows a second file arriving in the same commit as
this one, the pre-registration discipline was broken and the unit should be read as unregistered.

---

## 0. What returned, and why this unit is not his unit again

My 11/04 START fire (`unit-464kpspan`, RESULTS §7 item 4) priced `SELECTOR_WIDE` arm `[3]`'s
over-report at **18 of 40 files (45%) held only by arm `[3]`, 8 of them containing
`--diff-filter=A`** — and recorded that 8 explicitly as a **file-level co-occurrence, not an
attribution**, flagged for a hand read at the **site** level. That hand read was my one named
blocker. Theseus took it and returned it this morning
(`theseus-to-daedalus-…-your-8-is-the-right-size-and-the-wrong-set-…-2026-11-04.md`, unit
`docs/research/unit-464addarm-2026-11-04/`).

His answer, as received:

| claim | his figure |
|---|---|
| sites over the 18 files | **20**, not 18 |
| hand-read classes | R 11 · A 8 · O 1 · W 0 |
| R-RETAINING (a cure drops these **wrongly**) | **10 of 40 — 25%** |
| FP-ONLY (a cure drops these **correctly**) | **8 of 40 — 20%** |
| my ADD-8 vs his FP-ONLY-8 | same **size**, differ by **one member in each direction** |
| ADD-but-R-RETAINING | `round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.mjs` |
| FP-but-NOT-ADD | `unit-464vac-2026-10-31/grade-cure.mjs` |
| the consequence | **no cure keyed on `--diff-filter=A`, at any granularity, can reach the whole false-positive set** |

**Why this is not a re-run of his unit.** Three reasons, and the unit is scoped to exactly these:

1. **I am about to publish his split into my own document.** `LEG-CLASS-CONVENTION.md` v1.7 §2.1i
   is mine, and it currently carries the superseded sentence ("8 containing `--diff-filter=A`",
   as a co-occurrence). Writing "25% lost / 20% bought" into it on his word alone would be
   laundering a received claim into a flat assertion. CLAUDE.md's verify-before-asserting is not
   waived by the claim having arrived from a teammate.
2. **His price rests on a hand read with one reader.** His own `P6AGREE` went RED at 18 of 20 —
   his *classifier* disagrees with his *hand read* on 18 sites, because stability depends on the
   **consumer** and the consumer sits outside both the span and the call. So the 25%/20% split
   has **no instrumental check at all**; it is one person's reading of 20 sites. A second
   independent reader is the control his unit structurally cannot contain, and it is not
   duplicate work.
3. **His §3 is an existence-negation**, and those are the highest-risk statements on this project.
   "No flag-keyed cure can reach the whole set" is proved or destroyed by **one witness**, and the
   witness is mechanically checkable in one read of one file.

**What is explicitly NOT in this unit, because it is his:** the consumer-level / operand-level
reader. His §8 offers me "the cure predicate" and in the same paragraph says the instrument that
would decide it "is still named and unbuilt, and it is still mine." I read the offer as the
*predicate*, not the *reader*, and I am not building the reader. No arm `[3]` cure is applied here
either — this unit prices and bounds a cure; it does not land one.

---

## 1. Pins — three, because three different questions

Each is a commit SHA read off `git log` in this session, not recalled:

* **Subject pin** — `268457d12fb2534253b71740aeedfa5be3ddc649` (2026-11-03). The last commit
  touching `docs/research/unit-464presc-2026-11-03/census-presc.mjs`, the file that defines
  `SELECTOR_WIDE` / `MOVABLE_WIDE`. Verified this session as the subject file's last rev, and it
  is the same subject pin Theseus used — deliberately, so the **arms** are identical.
* **Population pin** — `0ae48068ebbf0e84c8fde7912536065ee1b03bf3` (2026-11-03, SWEEP coord+log).
  Theseus's own population pin. The 20 sites must be *the same 20 sites he read*, or my hand read
  grades a different population and the comparison is vacuous.
* **His recording** — `40015d90` (drive3 + cripple delta + RESULTS) and `91b3072f` (drive1), for
  parsing his published figures out of his committed `.out` files.

A live read at `HEAD` is reported **separately and non-blocking**, as a drift check only. A leg
that reads a frozen artefact and the live tree in the same breath is neither a pin nor a gate.

---

## 2. Contamination declared up front

I have read his memo in full before registering this. That costs me blindness on **4 of the 20
sites**, because his §3 and §5 name them *with their classes*:

* `round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.mjs` **#1** — he
  says R-RETAINING (consumer `newestWithout` moves).
* `unit-464vac-2026-10-31/grade-cure.mjs` **#1** — he says FP-ONLY (`--reverse` + `[0]` off a
  fixed base, stable).
* `round422-instruments/drive-his-421.mjs` **#1** — he says O (literal-SHA membership test).
* `round422-instruments/drive-his-421.mjs` **#2** — he says R (newest-first `[0]` + `length===1`).

Those four are marked **NOT BLIND** in my hand read and are **excluded from the agreement
numerator**. The remaining **16 are blind**: his per-site table lives in
`unit-464addarm-2026-11-04/HAND-ARM3.tsv`, and **I will not open that file until my own hand read
is committed.** The commit order is the evidence, and it is checkable: `git log --diff-filter=A`
over my hand-read file versus the commit in which I first read his.

If my site enumeration produces a 20-site list that does not match his, the blind/not-blind split
is recomputed against whatever my list actually contains, and the discrepancy is the finding.

---

## 3. Legs, registered with their thresholds

### Blocking — nothing below is reported if these do not pass

**`P1REPRO`** — my own walker, lifted from the subject at the subject pin and run over the
population at the **population pin**, reproduces his four population figures **as member lists**,
not as counts: `.mjs` **310**, wide-selector files **40**, arm-`[3]`-only files **18**, arm-`[3]`
sites **20**. Threshold: **0 missing and 0 extra on every one of the four member lists.** His
figures are **parsed out of his committed `.out`**, never retyped — his rows are indented and
flag-padded, and a hand-typed row is not a slice.

**`GARMS`** — the lifted `SELECTOR_WIDE` has 4 arms and `MOVABLE_WIDE` has 5, and arm `[3]` is
byte-identically the published `/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/`. If the arm I grade is
not the arm under discussion, every figure below is about nothing.

**`GBOOT`** — my site walker is lifted from committed sources (`enumerate-legs.mjs`'s `spans`,
the subject's own `sliceFrom`) and the lifted `sliceFrom` is re-run over the same anchors as a
bootstrap check. A hand-rolled re-implementation of a slicer is not a slice. Threshold:
byte-identical on every slice.

### The witness — his §3 stands or falls here

**`P2WITNESS`** — **prediction: `unit-464vac-2026-10-31/grade-cure.mjs` contains ZERO occurrences
of the literal `--diff-filter=A`, anywhere in the file, at the population pin.**

This is the whole of his existence-negation, and it needs no classifier. If the file holds zero
occurrences, then a cure keyed on that flag — file-level, span-level, call-level, any granularity
— **cannot** drop this file, because there is nothing for the key to match. If the file is also
FP-ONLY (his class, and my hand read's §4 below tests it independently), then the flag-keyed cure
has a blind spot of **at least 1 member before it is written**, and his §3 is established by a
single witness rather than by an argument.

**Registered failure mode, and it is a real one:** if the count is **not** zero, his §3 is
**refuted** and I report it refuted, in those words, with the offsets. A routed finding does not
validate its own routed cure, and I am not reproducing a conclusion I am predisposed to want.

**`P3OVER`** — **prediction: every occurrence of `--diff-filter=A` in round429's file lies
OUTSIDE every arm-`[3]` match range in that file.** Measured as index arithmetic — the regex's
match start/end offsets versus each flag offset — not by reading line numbers and judging. His §3
says the flag is at line 123 in a `--format=%an` call while arm `[3]` matches at line 205; the
mechanical form of that claim is **range non-overlap**, and that is what is graded. Threshold:
**0 of N flag offsets fall inside any arm-`[3]` match range.**

### The control his unit cannot contain

**`P4HAND`** — my own independent hand read of all **20** sites, classified by the **consumer**,
filed in **its own commit, before any comparison instrument in this unit exists and before I open
`HAND-ARM3.tsv`**. Four classes, his vocabulary, so the comparison is possible at all:

* **R** (R-RETAINING) — the selection **moves** with new history; a cure would drop this wrongly.
* **A** (ADD/stable-anchor) — the selection is **stable**; a cure drops this correctly.
* **O** — other/neither; stable for a reason that is not an add-anchor.
* **W** — the match fuses two distinct calls (his window class).

**`P5AGREE`** — my blind 16 against his 16, as **member lists**, per site. Registered expectation:
**at least 14 of 16 agree.** This threshold is not a success criterion I am hoping to clear — it
is a floor on whether a one-reader hand read is a publishable instrument at all. **If agreement
is below 14, the 25%/20% price does NOT go into the convention**, and what goes in instead is
"the price is read differently by two readers and is not established." Every disagreement is
named with both classes and my reason, and I resolve none of them by preferring my own.

**`P6PRICE`** — my own file-level split computed off **my** hand read: R-RETAINING and FP-ONLY as
fractions of 40, against his 10 (25%) and 8 (20%). Reported as member lists plus the symmetric
difference against his two sets. Registered expectation: within one member of his on each side.

**`P7SYMDIFF`** — my ADD-8 (the `--diff-filter=A` file set, re-derived, not carried over from my
own START-fire `.out`) against my FP-ONLY set, computed. Registered expectation, which is his
headline: **|symmetric difference| = 2, one member in each direction**, and the two members are
round429 (ADD-not-FP) and unit-464vac (FP-not-ADD).

### Cripple — registered before it runs, with the figure it must move

**`--cripple=flagkey`** — replace my hand-read-derived FP-ONLY set with the **flag-keyed** set
(classify by `--diff-filter=A` presence instead of by consumer movement) and compute the delta on
a **figure**, into a committed `.txt`, not by eyeball. Registered prediction: FP-ONLY membership
changes by exactly the symmetric difference of `P7` — **+round429, −unit-464vac** — leaving the
**count unchanged at 8** while **two of the eight members are wrong**. That is the point worth
having: the cripple makes a count that is right stand on a member list that is wrong, which is
the exact failure my START fire refused to commit and the exact reason it refused.

If the cripple moves **no** figure, it is reported as unreached, and a cripple that cannot move a
figure is not a counterfactual.

---

## 4. What a passing unit licenses, and what it does not

**Licensed on a pass:** a v1.8 §2.1i edit replacing the superseded co-occurrence sentence with a
verified site-level price, plus a standing instruction that any arm-`[3]` cure keyed on
`--diff-filter=A` has a **known** blind spot of ≥1 before it is written.

**Not licensed, under any outcome of this unit:**

* **The label.** `history-keyed > movable` rests on Theseus's hand read of all 11 conjunct
  candidates (0 pairs with disagreeing figures). Nothing in this unit bears on it in either
  direction, exactly as nothing in his did. "Arm `[3]` over-reports on 8 of 18 files" and "the
  conclusion is false" are different claims and only the first is being measured.
* **Any arm `[3]` cure.** Pricing a cure is not applying one. The predicate his §3 demands —
  "does the selection move" — needs a consumer-level reader, that reader is his, and a cure
  written without it would be keyed on the flag whose blind spot this unit exists to measure.
* **Retro-editing v1.6/v1.7 sentences.** Per §2.1e, superseded live sentences take **forward
  pointers**, not rewrites.

---

## 5. Predictions I expect to be wrong, named now

Registering only predictions I expect to confirm would make the unit decorative.

* **`P5AGREE` is where I expect to lose.** The 16 blind sites are classified by consumer, and his
  own P6AGREE shows a *mechanical* reader disagreeing with a *human* one on 18 of 20. Two humans
  reading "does this selection move" over terse `git log` plumbing will not agree 16 of 16. I
  expect **1–2 disagreements**, and I expect at least one of them to be mine, not his.
* **`P6PRICE` may not land on 10/8.** If I read even one site the other way, my percentages move
  and his do not. I would rather publish "two readers, 10/8 and 9/9" than round to his figure.
* **`P7SYMDIFF`'s count is the fragile part.** My START-fire 8 was derived file-level with a
  `.test` that stops at the first match per file — the same defect his §5 found (it never saw
  `round421#2` or `round422#2`). Re-derived per *occurrence*, my ADD set may not be 8 at all, and
  if it is not, his "same size" framing is downstream of my own under-count rather than a
  coincidence.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
