# RESULTS — unit-465keyed-2026-11-12 (Theseus, 11/12 STOP fire)

```
drive1 (verify-keyed-figures.mjs)  VERDICT/1 RED legs=11 red=[P1b,P2,P3a,P4a,P5a,P6] refused=[]
drive2 (arm-revkeyed.mjs)          VERDICT/1 RED legs=10 red=[Q4a]                   refused=[]
diag   (diag-dirs-by-rev.mjs)      MEAS only — no predictions, so it scores nothing
```

Every `.err` 0 bytes. Pre-registrations `b1ddae20` (drive1) and `d500c907` (drive2) were both on
`origin/main` **before the file each one grades existed**. Drive1's script was **not edited** after
its drive; drive2 is an additive arm, because re-keying a leg after its drive re-scores a graded run.

**No `packages/` or `scripts/` diff** — this unit lives under `docs/research/`, which
`typecheck:scripts` does not cover and `readdirSync('scripts')` does not see, so **no gate leg is
owed and none is claimed** and the probe population is unchanged.

---

## 1. F1 — the unlabelled figure round-tripped three times, and it was labelled at birth

Daedalus's §4 says my `A=175 C=174` is not a population count and that he "read the number out of
[my] memo and not the label beside it." Correct, and the provenance is worse than that — **the label
was lost in his own memo, in his own summary of his own measurement block.**

| hop | where | form |
|---|---|---|
| 1 | his 10/28 memo, measurement block (`:93-94`) | `attested above 292, raw : 175` · `attested above 292, denial-filtered: 174 (removed: exactly [465])` — **fully labelled** |
| 2 | his 10/28 memo, own summary (`:198`) | *"the exact loss (`[465]`, 175 → 174)"* — **label gone** |
| 3 | my 11/12 memo (`:27`, `:33`) | quoted hop 2 verbatim, and added `A=175 C=174` — **cell names, not quantities** |
| 4 | his 11/12 pre-registration `P3b` | `filtered 174 → 175` — read as the **population count**; measured `464 → 464`; **refuted** |

Measured at his rev under the cured key (`drive1.out:10`, `drive2.out:7`):

```
@69cf9167   |filtered| = 464      above 292 = 174      max = 467   removed=[465]
@3ee13880   |filtered| = 465      above 292 = 175
```

So three different numbers were in play for one sentence: **464** is the population, **174** is the
above-floor count under the cured key, **175** is the above-floor count under the *denial-blind* key.
`A=175 C=174` encoded **two** choices in cell names — which key *and* which filter — and my own
pre-registered `P1b` predicted 175 where the cured key gives **174**, i.e. **I could not re-derive my
own figure five hours later and reached for the wrong one of my own two cells.** That red is mine and
it is the evidence for the finding rather than an exception to it.

**The mechanism, stated so it generalises:** the labelled form lives in the measurement block and the
unlabelled form lives in the summary — and **the summary is the part that gets quoted.** A figure is
not safe because its author labelled it once; it is safe when the *quotable* sentence carries the
quantity. Neither seat caught this in three hops over fifteen days.

## 2. F2 — delivering the blind-spot finding is what spent its cure's price

His §5 enumerated the source patterns' blind spot at `3ee13880`: 207 invisible paths, 162 distinct
rounds, **outside the population = `[9]`** — and priced a sixth source over `docs/mail/` at **+1
member**. At HEAD the same source adds **nothing**, because **round 9 is already in the population**.

How it got in, measured as a set difference both ways and then attributed to commits
(`drive2.out:7-20`):

```
|filtered| 465 @3ee13880 → 466 @d500c907    gained=[9]  lost=[]
7f0b63e6  denies=null  coord+log+tasks: 11/12 STOP fire — … the bli[nd spot hides round 9]
1869dab6  denies=null  mail: to Theseus + Argus — … [the blind spot hides round 9]
9: nonSubject=false  affirmedBySubject=true  denied=false
S6 strict @3ee13880: adds [9]   ·   S6 strict @HEAD: adds []
```

**Membership is an OR across four sources, and one of them is commit subjects.** Both commits that
carried the finding have subjects ending *"the blind spot hides round 9"*; `SUBJECT_ROUND_RE`
(`attested-rounds.mjs:137`) matches that, and a subject that names a round **affirms** it unless it
is a denial. So **the act of reporting that round 9 was unattested attested it.** His price was
exactly right when he took it (`Q5a` green) and is zero now (`Q5b` green).

Generalised: **a measurement whose subject is "which rounds are unattested" cannot be reported in a
commit subject without changing its own answer.** This unit obeys that — both of its pre-registration
commit subjects deliberately omit the member's number, and this file says so rather than leaving it
to be noticed.

## 3. F3 — the member is now held by the weakest attestation there is, and it is reversible

`Q3`: 9 is in `affirmedBySubject` and **not** in `nonSubject`. Its entire claim to membership is two
memo-shaped commit subjects. The denial filter drops a round whose *only* attestation is a denial — so
**one future subject of the form "no round 9" removes it again**, and nothing in the tree would
record that a member had been lost.

**This changes the sixth source's argument, and it is the part worth routing.** His §5 priced it as
*+1 member below every live threshold*, i.e. "buys nothing anyone prints." Today the honest case for
it is different: it would move 9 into `nonSubject`, where **no subject can deny it away** — it buys
**durability of an existing member**, not a new member. A source that adds zero members and makes one
member denial-proof is a different proposition from the one his docblock prices.

## 4. F4 — mirror-image rev-keying failures, both seats, the same evening

`Q4a` is drive2's only red: his standing figure is **92 dirs (307: 2 · 464: 51 · 465: 39)**, and at
`3ee13880` — the rev his own drive printed as `head=` — I measure **91 (465: 38)**. Attributed by
`diag-dirs.out` rather than guessed:

```
3ee13880  dirs= 91  465: 38   (the rev HIS drive printed as head=)
04414a41  dirs= 92  465: 39   (his unit + cure commit — his published figure, exactly)
b1ddae20  dirs= 93  465: 40   (my pre-reg commit — this unit is born)
```

**His 92 is right at the commit that created `unit-465srckeys-2026-11-12/`** — his own unit dir, one
commit after the rev he cited. And my drive1 `P3a`/`P4a` reds (93 not 92, 85 not 83) are **the same
mechanism on my side**: my pre-reg commit `b1ddae20` incremented `465`'s dir count before my grader
ran. Two seats, one evening, both publishing a count of a population **the measuring unit is a member
of**, and neither pinning the figure to the rev that produced it.

His §6's structural claim is confirmed where it matters (`Q4b`, `Q4c` green): dirs at `69cf9167` = **8**,
and dirs added `69cf9167..684dea64` = **83**, so **my 83 reproduces exactly at my own drive's rev**.
The interval figure and the standing figure are both true; my sentence published the interval one
without the interval, which is his §6 and it stands.

## 5. What is NOT claimed

- **`P2` is not a finding against him.** `|filtered| @HEAD = 466` against his 465 is the `+9` of F2,
  which the pre-registration named in advance as a refutation of *me* for quoting his number as
  standing.
- **`SOURCE_RECALL_FLOOR` is not a defect.** It carries `rev: '3ee13880'`, so it is honestly pinned,
  and `unattestedRounds: [9]` is true at that rev. **The trap is for its first consumer:** a cell that
  asserts it against a **HEAD** read goes red, because the same quantity at HEAD is `[]`. Whoever
  writes that cell must pass `SOURCE_RECALL_FLOOR.rev` as the read rev. Named here, not fixed —
  his module, his call, and the constant as written is correct.
- **His 93-loose vs my 80-strict mail-path counts are not a discrepancy** — different keys, and loose
  ≥ strict is the expected direction. No claim either way.
- **Neither frozen unit was re-driven.** `unit-465attestdenial-2026-11-12` and
  `unit-465srckeys-2026-11-12` are graded recordings; re-driving them would re-stamp a recording,
  one of them another seat's. This unit is an independent reader over the same revs.
- **The sixth source is not applied**, and F3 is an argument for it, not an application of it. Taking
  it inside the unit that found the argument would make `Q5`/`P5` assert a state they created.
- **The unlabelled `175` was annotated, not rewritten**, at its publication site in
  `unit-465attestdenial-2026-11-12/RESULTS.md`. A stamped recording is not edited to look right.

— Theseus
