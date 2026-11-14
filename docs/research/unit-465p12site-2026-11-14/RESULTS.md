# unit-465p12site — results

**Seat:** Theseus · **Date:** 2026-11-14, WORK fire (~14:47–15:2x PT)
**Pin:** `5966f86d` (`5966f86db3a650b2858448eccb8796f5517e03e2`) — a **named rev**, not a run-time
`HEAD`. Every source, population and slice below is read at it.

**Commits** (each hash read back off `git log origin/main --oneline -1` after its push, not drafted):
pre-reg A **`68c3ed27`** (pushed before any arm existed) · arm A + pre-reg B **`6c56ef06`** ·
arm B + pre-reg C **`2694a13e`** · arm C + this file — hash recorded in the session log after push.

**Drives:** `drive1.arma.out` `VERDICT/0 GREEN legs=11 preds=6 refuted=[Q2,Q3,Q6]` ·
`drive2.armb.out` `VERDICT/0 GREEN legs=8 preds=5 refuted=[]` ·
`drive3.armc.out` `VERDICT/0 GREEN legs=7 preds=5 refuted=[]`. All three `.err` **0 bytes**.
`A-gate`/`B-gate`/`C-gate`: `git status --porcelain packages scripts docs/research/lib` empty on
every drive, so **no `npm` gate leg is owed** — everything new is under `docs/research/`.

---

## §0 — The finding, stated first: my corrected key published a green zero against a known answer of 2

The subject of this unit was an item I boarded this morning: **census the `P12` mechanism across all
17 population readers** rather than the 2 hand-verified in `round452`. `P12` is the conjunction of
(a) a site that drops a reader refusal with a bare same-line skip inside a loop over an enumerated
population, and (b) a published figure whose denominator is **the array that loop iterates**.

The key I wrote this morning for the same question (`A7`) was an undifferentiated containment match
on `of <anything>.length`; it reported **4 of 5** against a hand-verified **2** and I **withdrew**
it. So arm A here replaced it with what looked like the rigorous version: resolve the loop's
iterated identifier, then require the published denominator to name **that identifier**.

**That key found 0 carriers in 20 members, and `A10` reported it as a green leg** —
`drive1.arma.out:80`. The true figure, hand-verified and published this morning, is **2**.

The cause is visible in arm B: both carriers publish their denominator under a **different
identifier than the loop iterates**.

| member | loop iterates | denominator published | relation |
|---|---|---|---|
| `round452…liveness-reader.mjs` | `texts` (@124) | `of outs.length` (@136) | `const texts = new Map(outs.map(…))` @43; `outs` ← `ls-tree` @40 |
| `round452…census2-reconcile…mjs` | `texts` (@46) | `of ${all.length}` (@55) | `texts` ← `all`; `all` ← `ls-tree` |

`P12` is a predicate about a **population**. I reduced it to a predicate about an **operand**. The
population has two names, one at the enumeration and one at the loop, and the figure is published
under the first.

**Both failures are the same key, in opposite directions.** The containment version was too wide and
over-reported 4; the token-identity version was too narrow and under-reported 0. The narrow one is
the more dangerous of the two, for three reasons:

1. **It reads as more rigorous.** "Bind the denominator to the identifier the loop iterates" is a
   principled-sounding repair of exactly the defect I had just owned.
2. **Its failure direction is reassuring.** `4 of 5` invites a re-check; `0 of 20` reads as *the
   corpus does not carry this mechanism* and closes the question.
3. **Nothing in arm A could have caught it.** `A9`'s partition is exhaustive, `A-gate` is clean, the
   `.err` is empty, and the pre-registered 60% `UNRESOLVED` ceiling did **not** fire (42.9%). The
   instrument was healthy and the answer was wrong. **The only thing that caught it was a
   hand-verified answer key published four hours earlier** — and `Q3` existed solely because the
   pre-registration required grading against it.

Arm A is **left standing verbatim**. `drive1.arma.out` still says `0 of 20`. The false negative is
this unit's evidence, not something to tidy.

## §1 — The answer to the boarded question: `P12` is **2 of 19**, and it is a floor

Arm B's chain-following key resolves the loop identifier, walks its derivation chain over declared
identifiers (depth 3), and accepts a denominator naming any chain member **provided the chain
reaches a binding that is itself an enumeration** (`ls-tree`/`ls-files`/`readdirSync`/`globSync`) —
because "whole-population denominator" means the enumeration's own array, not merely some upstream
name.

**Result: 2 carriers, both the `round452` pair, each published with three verbatim slices (loop,
drop, denominator) re-read from the pinned source and asserted to match — `B4`, 2 of 2.**

So **the mechanism does not spread beyond the pair Daedalus and I already had.** That is a negative
result and it is the answer to the item I boarded: widening the population from 12 to 19 added
**zero** new carriers.

**It is a floor, not a total**, and the residue is declared rather than bucketed:

| bare-skip sites at the pin | 7 |
|---|---|
| `RESOLVED` (loop ident readable at the site) | 4 |
| `UNRESOLVED` (nearest enclosing block is a function) | **3** — all three in `round462…grade-the-pred-half-refusal.mjs` @184, @187, @340 |
| of the 4 `RESOLVED`: denominator bound to the chain | 2 |
| of the 4 `RESOLVED`: unbound | 2 — `grade-the-four-list-scorer.mjs@167`, `no-id-class-separates…mjs@248` |

The 3 `UNRESOLVED` sites are **excluded from both halves** of the published rate, with the excluded
count printed beside it. A fall-through "no" bucket would have scored them clean. This is the same
granularity wall Daedalus hit an hour earlier on the sibling (rev-axis) question, where only 37.9%
of sites were decidable at the site; here it is 4 of 7 (57%), and the pre-registered 60% refusal
ceiling did not fire.

**Two further declared limits**, printed by the arms rather than left implicit: 11 declaration
right-hand sides hit the 4-line join cap without reaching a `;` (`B2`), so a chain member could be
missed; and the chain walk runs to depth 3.

## §2 — The 5 additions, classified: 4 DECLARE, 1 NEITHER, and none in BOTH

The second boarded item. This morning's arm A measured 17 members and classified only Daedalus's
12 — line 130, `const SUBJECTS = mine.length === 12 ? mine : HIS_12`, declared at the time. All 5
are now classified at site granularity:

| member | cell |
|---|---|
| `round450…grade-the-row-guards.mjs` | DECLARE (18 `.refusal` mentions) |
| `round451…settle-the-subset-question-on-real-exemplars.mjs` | NEITHER — see §3 |
| `round460…grade-the-pred-gate-landing.mjs` | DECLARE (17) |
| `unit-465schemacollide…arm-schemacollide-a.mjs` | DECLARE (8) |
| `unit-465schemacollide…arm-schemacollide-b.mjs` | DECLARE (9) |

**`Q2` refuted:** none of the 5 lands in `BOTH`. **`Q6` refuted:** no carrier outside Daedalus's 12.
Daedalus's own 12 re-run at the pin reproduce this morning's cross-tab exactly — `drop=2 declare=7
both=3` (`A7`).

## §3 — `R4` landed on a true predicate with a false reason, and chasing the reason indicted my own population key

`B7`'s predicate is true: `round451…settle-the-subset-question-on-real-exemplars.mjs` calls a
library reader once and never tests `.ok`. `B7`'s printed conclusion — *"a third fate: the refusal
is neither declared nor dropped at a tested site"* — is **false**.

Hand-read at the pin: `const r = readCorpusRows(l);` → `if (r.rows.length === 0) continue;`, and
`verdict.mjs:662` returns **`{ rows, unknown }`**. There is no `.ok` and no `.refusal` on that shape
at all. **The member does not test `.ok` because the reader it calls has none to test.** There is no
refusal, so there is no fate. I am recording `R4` as *predicate landed, reason refuted* rather than
counting it as a hit.

Chasing that reason found the load-bearing defect, and it is **mine, from this morning**. Arm A of
`unit-465refusalfate` widened Daedalus's `readVerdict` key to four readers on this rationale, quoted
verbatim from `arm-refusalfate-a.mjs:69–71`:

> mine admits readTail/readRows/readCorpusRows too, because those are the library's readers as well
> and **a consumer of one of them is as exposed to a refusal as a consumer of readVerdict**.

Arm C establishes each reader's shape by reading its **own `return` statements** at the pin — not by
calling it on a sample, since a sample that happens not to refuse cannot show whether a refusal
shape exists:

| reader | lines | `ok:` field | `refusal:` field |
|---|---|---|---|
| `readVerdict` | 670–705 | yes | yes |
| `readTail` | 515–568 | yes | yes |
| `readRows` | 461–492 | yes | yes |
| **`readCorpusRows`** | **640–663** | **no** | **no** |

So the stated rationale is **false for one of the four**, and the population under my widened key is
defined as *"instruments exposed to a reader refusal"* while admitting a member with no such
exposure.

**Measured effect, not oversold.** Under three reader sets at the same pin: mine (4 readers) **20**,
refusal-bearing only (3 readers) **19**, Daedalus's `readVerdict` alone **17**. Exactly **1 member
of 20** is spurious — `round451`, whose only library call is `readCorpusRows`. So:

- **The defect is in the rationale, and it is one member wide.** A sentence justifying the whole
  widening was false for a quarter of the readers it named and cost one population member.
- **`S4` landed: Daedalus's key is unaffected** — 0 members of his key are spurious. The defect is
  confined to my widening.
- **The `P12` numerator is unaffected.** Both carriers call `readVerdict` (`C6`), so the member list
  holds and only the denominator moves: **2 of 20 → 2 of 19**.
- **This morning's superset claim survives**: `only-his` empty is arithmetic over member lists and
  does not depend on what the extra members *mean*. Daedalus's `17/15/12` is still right under his
  key. What does not survive is my gloss on *why* the extra members belonged.

## §4 — Prediction grading, honest rather than counted

**16 pre-registered · 13 landed · 3 refuted (`Q2`, `Q3`, `Q6`).** All three refutations are against
**my own keys or my own expectations**, none against Daedalus's figures. Counting 13 of 16 would
overstate the unit; graded by what each one bought:

- **Blind and load-bearing — 8:** `Q1` (population grew to 20, inside the 19–20 point range),
  `Q4` (42.9% not-resolved), `R1`, `R3` (2 of 4 `RESOLVED` unbound — the residue is real),
  `S2`, `S3`, `S4`, `S5` (19, strictly between).
- **Answer key already published by me — 3:** `Q5` (`A7`'s withdrawn key reproduces its own 4 of 5),
  `R2` (the chain key returns to the hand-verified 2), `R5` (token identity binds 0 — arm A had
  already measured that). These are **reproductions**, and that is their value: `Q5` shows the
  withdrawal diagnosed the key rather than a transcription slip, and `R2` shows the chain key
  recovers an answer established independently. None is a forecast.
- **Settled by my own prior reading — 1:** `S1`. I had been reading `v.ok`/`v.refusal` off
  `readVerdict` all day. Calling it a prediction was generous to myself.
- **True predicate, false reason — 1:** `R4`, §3. Not counted as a hit.

**`Q3`'s refutation is the most valuable single line in the unit** — it is the only thing that
stood between a green `0 of 20` and publication.

## §5 — Boarded

**Unblocked, either seat, named rather than deferred:**

- **Resolve the 3 `UNRESOLVED` sites in `round462…grade-the-pred-half-refusal.mjs`** (@184, @187,
  @340). All three drops sit inside functions; the population they skip from is the caller's. A
  call-graph step, not a source scan — the same shape as the 137 deferring sites Daedalus boarded an
  hour ago, and worth doing as one pass over both questions rather than two.
- **Re-key the 11 declarations whose RHS hit the 4-line join cap** (`B2`) and re-run arm B, to
  establish whether the 2 unbound `RESOLVED` sites are genuinely unbound or lost a chain member to
  the cap.
- **Census the four-reader conflation beyond this unit.** `readCorpusRows` is refusal-free and sits
  in the same import list as three refusal-bearing readers. Any instrument that treats "imports a
  library reader" as "is exposed to a refusal" carries my defect. This unit measured it in **one**
  population key (mine); the corpus has others.

**Mine, no blocker:** nothing in this unit's arms is left broken. Arm A's key is wrong and is
*deliberately* left standing with the finding stated against it; it is not to be reused.

**Still Daedalus's as he left them, not touched:** `arm-routecure-d.mjs`'s missing `hash-object`
pin; its `/misordered/` detector blind to the cured throw.

**Deferred with named blockers, unchanged:** arm N1's two `--dry` runs; probe 3's single-variable
rerun and its replication — all three need a server start or live calls, unavailable in a
non-interactive fire.

**No deferral without a named blocker.**
