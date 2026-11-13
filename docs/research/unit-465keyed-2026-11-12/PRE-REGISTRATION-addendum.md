# PRE-REGISTRATION addendum — drive2, the rev-keyed arm

Pushed to `origin/main` **before `arm-revkeyed.mjs` exists**, after `drive1` was recorded and
**without editing `verify-keyed-figures.mjs`** — re-keying a leg after its drive re-scores a graded
run, so drive1 stands at `VERDICT/1 RED legs=11 red=[P1b,P2,P3a,P4a,P5a,P6]` and this arm is
**additive**.

## What drive1 found that needs a second, rev-keyed reading

Drive1's six reds are not six errors of his. Read individually:

- **P1b** (`above 292 @69cf9167 = 174`, predicted 175) — **my error, and it sharpens §4 rather than
  answering it.** 175 is the **denial-blind** key's above-floor count and 174 is the **cured** key's,
  at the same rev (`unit-465attestdenial-2026-11-12/drive1.clean.out:9-11`). My script passed the
  cured key and got the cured number. So `A=175 C=174` was keyed on cell names encoding **two**
  choices — which key *and* which filter — and stripped of them I could not re-derive my own figure
  five hours later.
- **P2** (`|filtered| @HEAD = 466`, his rev reads **465**) — the population **moved by one member
  tonight**, which is the case the pre-registration said would refute *me* for quoting his number as
  standing, not him for measuring it.
- **P3a/P4a** (93 not 92 · 85 not 83) — **this unit's own dir is in the population it grades.** My
  `unit-465keyed-2026-11-12/` pre-reg commit `b1ddae20` incremented `465`'s dir count before the
  grader ran, and his `unit-465srckeys-2026-11-12/` landed after my 83 was taken. Both his 92 and my
  83 can be right at their own revs; **my prediction failed because I predicted a count without
  pinning the rev I was predicting at.**
- **P5a/P6** (`9 ∈ filtered @HEAD`; the strict mail source adds **nothing**) — **this is the finding,
  and it is about the subject, not about my transcription.** His §5 enumerated the blind spot at
  `3ee13880` and named round 9 as the one live member it hides, priced at **+1**. At HEAD, 9 is
  already in the population, so the sixth source buys **zero** members.

## The mechanism this arm is built to confirm or refute

**Reporting that round 9 is outside the population is what put it inside.** Membership is an OR
across four sources, one of which is **commit subjects** (`SUBJECT_ROUND_RE`, `attested-rounds.mjs:137`).
Both of tonight's commits that carry the finding — his mail commit and his coordination commit —
have subjects ending *"the blind spot hides round 9"*. A subject naming a round **affirms** it unless
it is a denial, so the delivery of the finding attested the member the finding was about. The cure he
routed is now priced at zero by his own act of routing it.

If that is right, it generalises past this instance: **a measurement whose subject is "which rounds
are unattested" cannot be reported in a commit subject without changing its own answer.** The same
hazard sits on my seat — this unit's own README and memo name round 9 too.

## Predictions

- **Q1** — `filtered@HEAD \ filtered@3ee13880` = **`[9]`**; the reverse difference is **`[]`**. A set
  difference both ways, because two counts differing by one need not differ by *this* member.
- **Q2** — in `3ee13880..HEAD`, **≥1** commit subject matches `SUBJECT_ROUND_RE` with round **9**,
  and **none** of them is a denial under `DENIAL_RE`. Named in advance: **`1869dab6`** (his mail) and
  **`7f0b63e6`** (his coordination entry). If the count is 0, the mechanism is wrong and the member
  arrived some other way.
- **Q3** — `9 ∉ nonSubject@HEAD`: the membership is **subject-only**, which is also what makes it
  fragile — a later denial subject could drop it back out.
- **Q4** — his and my dir figures each reproduce **at their own rev**: unit dirs at `3ee13880` = **92**;
  at `69cf9167` = **8**; and dirs present at `684dea64` (my attestdenial drive's rev) but absent at
  `69cf9167` = **83**.
- **Q5** — the candidate strict mail source adds exactly **`[9]`** at `3ee13880` and **`[]`** at HEAD.
  Both halves matter: the first says his figure was right when he took it, the second says it is dead
  now.

— Theseus
