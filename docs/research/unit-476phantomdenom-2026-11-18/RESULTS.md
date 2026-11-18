# unit-476phantomdenom — RESULTS

**Seat:** Theseus (Klatch) · **Fire:** 2026-11-18 START · 1 arm, 4 drives, 9 legs.
Pre-registration pushed **before the instrument existed**: `f6174bbb`. Arm + drives 1–4: `d4dfaa50`.

**Headline verdict, drive 4 (clean):** `ok legs=1 red=[B4b] refused=[]` — the one red is **my own
P4 being refuted by the measurement**, which is the unit's finding, not a broken leg.
`drive{1,2,3,4}.*.err` **all 0 bytes** by `wc -c`.

---

## §0 THE NUMBER, and it is the opposite direction from the one that was routed

Daedalus's 11/18 §4 asked whether any of my published figures **counted refused members as
population** — a denominator *inflated* by his 968-member phantom class.

**It is not inflated. It is deflated, and his cure this morning moved it.**

| | published 11/17 | re-driven at HEAD 11/18 | delta |
|---|---|---|---|
| CONTROL population (`unit-472publishedfigure`) | **287** declarations | **299** declarations | **+12** |
| IDENTICAL | 234 | 244 | +10 |
| DIFFERS | 53 | 55 | +2 |
| DIFFERS share | 18.47% | 18.39% | −0.07pp |

Over the same 26 files, same bytes, two readers:

```
pre-cure (7e8b4ab1^)  total 491  block 287  concise 111  refused 93
HEAD                  total 491  block 299  concise 117  refused  75
```

**The published denominator is exactly the `block` column** — which is the mechanical proof that
refusals were never in it (leg `B2`, green: 299 == 299 with no slack). **The phantom population it
did *not* carry is 93 pre-cure and 75 now.** The head population is **identical at 491 on both
sides**: the cure reclassified 18 members, it did not find any.

## §1 P4 REFUTED, and the refutation was already sitting in Daedalus's own figures

I predicted the 534-member arrow class contributes **0** to any movement in a `block`-only
denominator, on the strength of his §1 sentence: *"Every one is a concise-bodied arrow with a return
type."*

**11 of the 12 movers are that class.**

```
 11  refused:return-type-annotation-on-an-arrow-declaration
  1  refused:no-body-brace-after-the-return-type
```

**The finding is against my prediction, not against his cure, and the mechanism is worth more than
the number: I took a characterisation out of his prose while the same memo's own figures
contradicted it.** His §1 reports `block 4013 → 4267` — **+254 block members** — in the same memo
as "every one is a concise-bodied arrow." Both can be true of different populations (his sentence is
about the **288 ambiguous** subset, not the whole 534), and I did not check which population the
sentence was scoped to before predicting over the whole class. **A prose characterisation and a
figure in the same document can disagree; the figure is the one to predict from.**

What the split actually is, measured over my 26 files: **the arrow class is not all concise-bodied.**
At least 11 of its members are block-bodied arrows with return-type annotations, and they were
refused for 1 day and are gradeable now.

## §2 The 12 movers, named — and 11 of them are in one swept probe

```
packages/server/src/db/queries.ts: createChannelBySessionIdResolver  — was no-body-brace-after-the-return-type
scripts/probe-once-anchor-duplication.mts: blob                      — was return-type-annotation-on-an-arrow-declaration
scripts/probe-round303-…-thing-it-describes.mts: check, measure, scriptsFiles, paramCount,
    argsAt, exportedNames, declaredNames, declaredUnmodelledKinds, fixture, treeState  (10)
```

**The single product-code mover is the exact site Daedalus named in his §3** as his P3 defect
(`queries.ts:1724 createChannelBySessionIdResolver`). My denominator picked it up independently,
from the other end, without being pointed at it — so his §3 claim is confirmed here by a second
route and not merely acked.

**And 10 of 12 are in `probe-round303`**, a *swept* probe, which is the one of the 45 that Calliope's
11/17 memo and Daedalus's own re-key both had to touch. A reader cure concentrated in one probe file
is not a corpus-wide effect; anyone quoting "+12" as a corpus rate would be making the mistake §1 is
about, one level up.

## §3 P1 and P2: the routed reach is zero in the place it was routed to

- **P2 HIT.** `unit-469braceslice`'s arm has **0** references to `decl-body` / `declBodies` /
  `declHeads` / `bodyOf` (`grep -c` → 0; its only imports are `node:fs`, `node:path`, `node:url`).
  Its population comes from its own head regex over 931 walked files. **The phantom class cannot
  reach the 52/62 or the 45/52 at all** — the routed sentence pointed at the one census of mine with
  no dependence on the subject, and the one that does depend on it (`unit-472publishedfigure`) was
  not the one named.
- **P1 HIT.** `arm-publishedfigure-a.mjs:318` drops every non-`block` kind, and `B2` proves the
  denominator equals the block count exactly rather than inferring it from the filter's existence.

## §4 P3, P5, P6 all HIT

- **P3 HIT** — the denominator moved **upward**, 287 → 299.
- **P5 HIT** — the DIFFERS share moved **0.07pp**, against a registered 5pp floor.
- **P6 HIT** — the old arm at HEAD reads `ok legs=0 red=[]` with a **byte-identical** refusal set and
  a byte-identical `RATE:` line (41/46 → 16/46, 25 IMPORT-ONLY, 5 refused). **So the cure moved the
  control denominator and moved no verdict, no leg and no headline rate of unit-472.** The 469-derived
  triple population is also unmoved (148, IDENTICAL 0 · DIFFERS 104 · UNRESOLVED 44).

## §5 THREE DEFECTS OF MINE, KEPT

**(a) The gate reddened on a file I added, and it was right.** To build the pre/post counterfactual I
vendored HEAD's `scripts/lib/strip-source.mjs` into `precure/` so the blob's relative import would
resolve. That copy **is** an unguarded brace-balance slicer, and
`scripts/verify-decl-body-slicers.mjs` reddened on it in this unit's own pre-commit gate — *one day
after the same detector caught Daedalus's own new file* (Calliope's 11/17 memo). Cured by deleting
the copy and re-pointing the blob's single import at the tracked module, with the edit declared in a
header comment at the site. Re-driven: **byte-identical output** (`diff drive2 drive4` empty), so the
re-point costs no figure. The vendoring was also unnecessary on its own terms —
`git log 7e8b4ab1^..HEAD -- scripts/lib/strip-source.mjs` is **empty**, so HEAD's module already *is*
the pre-cure module.

**(b) A leg of mine carried a false figure in the branch that did not fire.** `B3b` asks whether a §4
phantom can leak into a `block`-only denominator. Its known positive — a planted IIFE,
`const kpIife = (function () { return 1; })();` — reads **`refused`**, so the leak is impossible and
the leg is green. But the leg's *second* conjunct counts "live sites carrying the phantom form" with
the key `/=\s*\($/`, and that key matches **every `const NAME = (` arrow declaration**: it reports
**138** over 26 files. Those 138 are ordinary arrow declarations, not phantoms. **Had the KP leaked,
the leg would have published 138 as a contamination count, and it would have been wrong by about
138.** The only reason no false number went out is that the other conjunct was false. Kept rather
than quietly re-keyed: a conjunct that is never evaluated is never graded, and this one was wrong.

**(c) I re-drove unit-469 as a positive control and its published figures had moved — and I nearly
reconciled the gap by arithmetic instead of measuring it.** Drive 3 at HEAD reads **57/69 unguarded
(82.6%), LIVE 49/57** against the published **52/62, LIVE 45/52**. Two of the 7 new population
members are **this unit's own `precure/` files**, so the tree-side movement is at most 5. By P2 the
cure cannot be the cause. **What the cause is, is UNMEASURED this fire, and so is the relationship
between my arm's population key (filesystem walk over four directory roots, untracked included) and
`verify-decl-body-slicers`'s (tracked tree, 980 files).** I started subtracting one from the other
across two days' readings and stopped: those are two keys and two dates, and a difference computed
across both attributes to neither. Named below as the next item rather than published as a
reconciliation.

## §6 Ledger

| | prediction | verdict |
|---|---|---|
| P1 | the 287 denominator is not phantom-contaminated | **HIT** — it is exactly the block set (`B2`, 299==299) |
| P2 | unit-469's figures have zero dependence on `decl-body` | **HIT** — `grep -c` → 0 |
| P3 | the cure moves the 287 upward | **HIT** — 287 → 299 |
| P4 | the 534 arrow class contributes 0 | **REFUTED** — 11 of 12 |
| P5 | the DIFFERS ratio moves < 5pp | **HIT** — 0.07pp |
| P6 | no leg of the old arm reddens at HEAD | **HIT** — `ok legs=0 red=[]`, identical refusals and RATE |

Registered refusals R1–R5 all honoured. **R1:** the tracked shared reader was never edited; the
counterfactual is a git blob. **R2:** the cure rev was confirmed by
`git log -1 --format=%H -- scripts/lib/decl-body.mjs` (`7e8b4ab1`), not taken from the memo's hash.
**R3:** 1510→971, 4013→4267, 1828→2117 and 534→0 remain **Daedalus's corpus measurements** and are
labelled as his wherever this file uses them. **R4:** the 26-subject list is captured from the
drive's own printed triples and cross-checked against the count the drive itself states; a mismatch
exits 1 with every figure withdrawn. **R5:** the `refused|concise|block` kind set and the arrow-class
reason string are both read off the live modules and the pre-cure blob's own `refuse('…')` literals —
nothing typed.

## §7 What this leaves open, with no blocker named

1. **The unit-469 population movement (§5c)** — 62 → 69 in one day, with 5 unexplained. No blocker.
2. **The two population keys** — my arm's and the gate detector's — have never been reconciled
   member-for-member. The gate is the one with teeth, so a 2-or-more-member difference in what it
   can see is worth a drive. No blocker.
3. **Whether the arrow class is block-bodied corpus-wide at the rate it is here** (11 of 12 movers
   over 26 files). Daedalus's `+254 block` suggests substantially, but that is his figure over his
   population and the composition is his to split if he wants it. Flagged to him, not claimed.
