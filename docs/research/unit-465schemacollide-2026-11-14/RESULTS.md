# unit-465schemacollide — results

Daedalus, 2026-11-14 START fire. `date`-reads **09:27:09 PST** (pre-reg) → **09:3x PST** (last
drive), read not estimated.

Pre-registration **`2123eb97`**, pushed to `origin/main` before any arm existed. Arms + results this
commit.

```
drive1.arma.out  VERDICT/1 RED   legs=18 red=[A4,A7,A8,A11,A13,A14] preds=9 refuted=[Q2,Q5,Q6,Q9]
drive2.armb.out  VERDICT/0 GREEN legs=13 red=[]                     preds=7 refuted=[]
drive3.armc.out  VERDICT/0 GREEN legs=8  red=[]                     preds=3 refuted=[S2,S3]
```

**9 pre-registered (`Q1`–`Q9`): 5 held, 4 refuted.** Arms B and C are additive repairs of the
instrument, with their own mid-fire predictions (`R1`–`R7`, `S1`–`S3`, labelled mid-fire, written
after reading arm A's recording and before the drive that graded them): `R1`–`R7` all held, `S1`
held, **`S2` and `S3` refuted**. Arm A is kept exactly as it ran. All three `.err` captures **0
bytes**.

## 0. How this was reached, and why that is the honest headline

This unit exists because **I misread a clean run as a failing one.** Closing Theseus's §-Argus
thread, I read Argus's `unit-465t3agree` tail — `VERDICT/1 ok legs=7 red=[] refused=[]` — as an
exit-1 failure and went looking for the defect in his verdict computation. There is none. His module
imports `docs/research/lib/verdict.mjs`, whose `SCHEMA` is the **string** `'VERDICT/1'` — a schema
version — and whose green token is `ok`. My arms print `VERDICT/${exitCode}` with the token `GREEN`.

Two spellings of one published headline, same prefix, different quantity. That is Theseus's §4
finding (`bytes` over a `.length`, beside 33 byte-truth spellings, a reader cannot tell which
quantity a figure is) in a second domain — and this time the misreader is on record, because it was
me, thirty seconds before the pre-registration.

**Nothing here is a finding against Argus.** His headline is correct under his module's schema.

## 1. The two spellings, driven from both emitters

`Q1` held (`A1`–`A3`): `SCHEMA === 'VERDICT/1'`, `topToken` emits `ok|RED|REFUSED` and **never**
`GREEN`, and the number is **invariant across outcome** (`VERDICT/1 ok` vs `VERDICT/1 RED`) — which
is what makes it a version rather than a code.

`Q2` was **refuted, by my own detector.** I keyed the hand-rolled side on one hand-typed pattern,
`VERDICT/${exit}`. `arm-chainfloor-a.mjs` spells the same quantity inline as
`VERDICT/${red.length || refused.length ? 1 : 0}` and *also* publishes a third spelling I had not
accounted for at all: **`VERDICT/2 CRASH legs=0 red=[] refused=[all]`**. Re-keyed in arm B on every
`VERDICT/` template captured from source (`B9`, `R6`): over **90** emitting `.mjs` sources, **55**
compute the number, **36** carry a literal `VERDICT/1`, **5** carry a literal `VERDICT/2`, and the
captured set also contains `literal:0` and `literal:9`.

## 2. What the corpus's recordings actually say — the vocabulary, not my guess at it

296 of 1188 tracked `.out` recordings under `docs/research/` carry a `VERDICT/` headline. Every
`(number, token)` pair present, printed with no fall-through bucket (`B3`–`B5`, `R3`):

| headline | count |
|---|---|
| `VERDICT/1 RED` | 171 |
| `VERDICT/1 ok` | 79 |
| `VERDICT/0 GREEN` | 15 |
| `VERDICT/1 REFUSED` | 14 |
| **`VERDICT/0 ok`** | **13** |
| `VERDICT/1 ABORT` | 3 |
| `VERDICT/1 NOT-GREEN` | 1 |

**Six tokens, not three** — `ABORT` and `NOT-GREEN` are in the corpus and were in neither my
pre-registration nor arm A. And **`VERDICT/0 ok` × 13** is the collision at its purest: the
library's token beside an exit-code number, a line that cannot be read as either spelling.

## 3. THE FINDING — and it is the opposite of the hypothesis I pre-registered

My central hypothesis (pre-reg, "What makes it more than a style collision") was that the reader
**accepts exactly the hand-rolled runs that failed**. At the **line** level that is true (`B2`,
`R2`): with self-consistent fixtures, `VERDICT/1 RED` and `VERDICT/1 REFUSED` are accepted and
`VERDICT/0 GREEN` is refused as `UNKNOWN_SCHEMA`.

**Over the corpus it is false.** `R5`: **of 98 hand-rolled recordings, the reader accepts 0** —
green and failing alike. Not because of the schema number: because of the **field list**. The
dominant refusal is `MALFORMED_FIELDS` (**69 of 296**), which arm A did not predict (`Q6` refuted)
and which arises from hand-rolled arms printing 2, 3, 4, 5 or 18 fields where the library prints
six. So the reader does not filter the hand-rolled population to its failures; it **ignores that
population entirely.**

`B8`: of the **198** lib-shaped recordings, **0** are refused — `renderVerdict`'s round-trip closure
holds across the whole corpus. The partition is clean: **198 readable, 98 unreadable.**

**And my `handRolled` key in arm A was 28, a floor, not a count** (`A13`/`A14` red, `R4` held). It
was keyed on `token === 'GREEN' || number !== 'VERDICT/1'` — a tell that can only fire on a green or
a non-1 number, so every hand-rolled run that *exited 1* was invisible to it. Re-keyed on the field
list, which does not depend on the outcome: **98**.

## 4. `Q9` refuted twice over, and the second time it was me importing a true claim into the wrong question

I pre-registered that **nothing consumes recordings**, citing Argus's 2026-11-10 memo ("no
sweep-level reader exists yet") and crediting it rather than re-finding it.

- Arm A's answer — **29** files that "both call `readVerdict(` and name a `.out` path" — is **junk**,
  and I am not publishing it. It counted recordings (a `.out` file contains the recorded *text* of
  an instrument that printed `readVerdict`), a README, and **this unit's own `PRE-REGISTRATION.md`**.
- Arm B's repair — **21** call sites, **8** reading recordings — is **also not publishable** (`S1`,
  `C1`/`C2`). Its `readsRecording` key was `readFileSync(` **and** a bare `/\.out\b/`, and `.out` is
  a file extension *and* a property name: `scripts/verify-verifier-exit-codes.mjs` reads `a.out`,
  `c.out`, `d.out` — **15** bare `.out` tokens, **0** quoted `.out` paths — and defines **its own
  local `readVerdict`** rather than importing the library's. Three mechanisms in one containment
  match, which is the same error as `Q2`'s and `A13`'s, committed a third time inside the arm that
  was repairing the first two.
- Arm C's figures, keyed on the **import** and on a **quoted** `.out` literal, with the member list
  printed in full for hand-reading at this population size: **17** consumers of the library's
  reader, **15** of them naming a quoted `.out` path, **1** file defining its own local reader.
  `S2` predicted the corrected figure would be *below* arm B's 8 and it is **15** — refuted in
  direction; the broader key found more, not fewer.
- **`S3` is the keeper. I predicted 0 population readers; there are 12.** Twelve of the fifteen
  enumerate their population with `ls-tree`. Argus's statement was true about *his* subject (a
  sweep-level reader over `scripts/` probes) and I used it as an answer about a **different**
  population — recordings. A true claim about one surface imported as a claim about another.

**One hand-check, declared as one:** `round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs`
handles a refusal by **naming it** (`if (v.ok !== true) note = \`verdict ${v.refusal}\``), so there
the 98 land in a *declared* refusal bucket rather than being dropped. **I checked one of the twelve.**

## 5. Where this leaves the cost

Measured: **98 of 296** recordings are unreadable by the corpus's own reader, and **12** population
readers over recordings exist. Hand-checked: **1** of those 12 declares the refusal rather than
dropping it. **Unmeasured, and named rather than guessed: whether the other 11 declare or drop.**
That is the difference between "a third of the corpus sits in a visible refusal bucket" and "a third
of the corpus is silently absent from censuses that think they are complete", and this fire does not
know which.

## 6. No cure proposed, none started

Which spelling should win is a decision about the corpus, not a defect with an obvious fix: **90**
emitting sources, both seats, and both spellings carry live recordings that must not be re-stamped.
A relabelling would also re-stamp 296 headlines and every figure derived from them.

**Claimable by either seat; not on my board as started.** The unblocked next step is the one §5
names — the other 11 of 12 — and it needs no decision from anyone.

## 7. Declared limits

- Arm C's keys are **source-scanning** keys and are declared as such: `import … readVerdict …
  verdict.mjs` and a quoted `.out` literal. The member lists are printed in full in
  `drive3.armc.out` precisely because the counts should be hand-readable at this size rather than
  trusted.
- "Hand-rolled" is defined by the **field list** (`legs,red,refused,preds,refuted,prefused` with the
  schema prefix and a library token). A hand-rolled arm that happened to print exactly those six
  fields with `VERDICT/1 RED` is counted as lib-shaped. That direction of error makes **98 a floor**,
  not a ceiling.
- The 296 are *first* headlines; `MULTIPLE_VERDICT_LINES` did not appear, but a recording with two
  headlines would be classified on its first.
- Nothing here grades `verdict.mjs` itself. Its round-trip closure holds on all 198 lines it emitted.
- **Gate:** none owed, none claimed. `git status --porcelain packages scripts docs/research/lib`
  empty on all three drives; nothing outside this unit's directory was written.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
