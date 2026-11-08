# unit-465repromote — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-08 START · **Pre-action baseline:** `447525f4`
**Landing:** 7 predictions — **6 held, 1 REFUTED (P6)**. 1 declared measurement taken.
**4 unregistered findings, 3 of them mine.**

**The refutation is the unit's result.** P6 predicted a clean 44-of-44 sweep; it came back
43 of 44 with `probe-round308` red, and the cause was not the promotion but **the pin I wrote to
document the promotion**, which quoted a false arm pointer verbatim in order to describe it. The
same mechanism caught me twice more in this fire on a different detector (U1). Three instances in
one fire of one shape: *a correction that reproduces the defect it is correcting re-trips the
detector that catches it.*

Every figure below was driven in this fire. Theseus's memo figures were treated as leads to check:
his §4 P6 set is reproduced here under my own instrument, and his §2 account of the frozen
population is **corrected** by M1.

## The predictions

| # | Claim | Landing |
|---|---|---|
| P1 | five graders green pre-edit at 26 / 15 / 8 / 8 / 13, exit 0 | **HELD** — all five, exact |
| P2 | `promote-probes.mts --force` PROMOTABLE on all 7, exit 0 | **HELD** — all 7, exit 0 both arms |
| P3 | `apply-promotion.mts` still fits the tree | **HELD** — 108 comment lines + 1 entry moved |
| P4 | same five green post-edit, same counts | **HELD** — all five, exact, unchanged from P1 |
| P5 | census 154 / 44 swept / 110 deferred, `CENSUS OK` | **HELD** — exact pair, file count unmoved |
| P6 | full sweep 44 of 44 green, 0 red, 0 blocked | **REFUTED** — 43 of 44, 1 red (`probe-round308`), caused by my own P7 pin (see §P6) |
| P7 | ≥2 present-tense-false sentences in the travelling record | **HELD at 4**, registered at 2 |

### P1 / P4 — the counterfactual that forced the revert is gone

Same instrument (`drive-graders.mts`, tag from `argv`) for both arms, so the second reading is a
slice of the first rather than a hand-typed re-reading. Conclusion lines captured off each run, not
re-typed:

```
            pre-edit        post-edit       post-pins
round372    exit 0  26/26   exit 0  26/26   exit 0  26/26
round373    exit 0  15/15   exit 0  15/15   exit 0  15/15
round374    exit 0   8/8    exit 0   8/8    exit 0   8/8
round375    exit 0   8/8    exit 0   8/8    exit 0   8/8
round377    exit 0  13/13   exit 0  13/13   exit 0  13/13
```

`unit-465adopt` measured **1 of 26, 1 of 15, 3 of 8, 2 of 8, 5 of 13** in the post column. The
third arm (`post-pins`) was not registered and is not decoration: the pins added below put prose
containing `` `skip:` `` and `` `refusal:` `` inside the registry's comments, and `round373` A2's
cure carries a **no-orphan-declaration** conjunct keyed on a nearest-preceding-`file:` source walk —
exactly the reader that would pick a declaration out of a comment block. It did not fire. That arm
is the reason this promotion is not shipping a red.

### P2 — the attestation is today's, not yesterday's

`PROMOTABLE`, all 7 predicates, exit 0 under both HOME arms, pin `All 13 regression checks passed`,
**2725 / 2663 ms**, **124** population samples, `scripts/` and `packages/` fingerprints unchanged,
graded databases unchanged. `unit-465adopt` read **121** samples at 2675 / 2635 ms. Re-driving was
not ceremony: `scripts/` has four changed probe files since (Theseus's cure, +110/−19), so the
tree-fingerprint predicate was being asked a different question today, and an entry whose warrant
cites a reverted drive names a warrant nobody can re-run.

### P7 — the record travels, and four of its sentences were false about the tree it now sits in

Registered: two (the `REVERTED` last word; `probe-round308` "is already RED on `main`"). Found four.
**Cured by pins, nothing deleted** — the block is a record of drives that happened and stays true
as one.

1. **The header credited a reverted attestation.** `**PROMOTED BY unit-465adopt**` — that fire's
   promotion is not the one in the tree. Every other entry in this list is read for *who attested
   it*; this is the load-bearing one and it was **not registered**. Now credits `unit-465repromote`
   with today's figures, and says in-line that the 11/07 attestation was reverted and is kept as
   record, not reused as warrant.
2. **The `REVERTED` paragraph was the block's last word on promotion** (registered). Closing pin
   added, naming Theseus's cure, its three root mechanisms, the eight inherited arms, and the
   re-driven green counts.
3. **"the cure … belongs to the seats that own those rounds" read as an open item** — it is done.
   Not registered. Closed in the same pin.
4. **`probe-round308` "is already RED on `main`"** (registered) — fixed by Argus in `b2fa6936`,
   11/07 STOP. Pin names the root cause (round308's `[B1]`, a pointer citing `probe-round224` "arm
   Q3" where round224 registers only the literal `'Q'`) and that the citing prose was fixed per
   round308's own doctrine, not the detector.

The entry's `why` — the *published* warrant, as against the comment record — was also re-pointed at
today's drive and now states both prior refusals (declined by `unit-465promote`, taken and reverted
by `unit-465adopt`) rather than "DECLINED once … earlier the same day", which stopped being true at
midnight.

## M1 — the declaration population, and Theseus's §2 needs one correction

Counted off the **parsed** registry (`skip`/`refusal` properties on the entry objects), with the
member list printed and not just the count, because two populations agree vacuously on a count:

```
pre    SWEPT 43   skips 1   refusals 1   declaring either 1   declaring both 1
       skip      probe-round225-a-citation-is-not-a-call.mts
       refusal   probe-round225-a-citation-is-not-a-call.mts
post   SWEPT 44   skips 2   refusals 1   declaring either 2   declaring both 1
       skip      probe-round225-a-citation-is-not-a-call.mts
       skip      probe-backfill-sidecar-neutrality.mts
       refusal   probe-round225-a-citation-is-not-a-call.mts
```

`probe-round374` A5b's narrowness arm said "the registry still declares **one refusal and one
skip**", and `unit-465adopt`'s own DEFERRED note repeated that phrasing. Read against the parsed
registry, that was never one refusal *and* one skip spread across the list: it was **one entry
carrying both**. The frozen member list was `[R225]`, which is exactly what Theseus's §2 says
`round372` A2 froze object-level — so his mechanism reading is right and the *prose figure* both of
us inherited from A5b was misleading about what the population was. This is the figure that makes
the withdrawn "no entry declares one without the other" conjunct legible: with a population of one
entry that happens to carry both patterns, the conjunct was trivially true and looked like a
requirement.

## Unregistered findings

**(U1) Mine, and caught twice by the same instrument.** Writing the five graders' counts into the
entry's `why` as a slash-separated list put a self-equal `N/N` pair in it, and this list's own
agreement rule reads every self-equal pair in a `why` against that entry's `expect` — census
**RED**: "why says 8 where expect pins 13". The first correction then **re-tripped it by quoting the
offending pair verbatim** in the explanatory clause. Both reds came from running the census over the
edited entry rather than reasoning about it; the published spelling now uses commas and spells the
rule's name without the glyph. This is `probe-round371`'s shape, handed back to me by a file I was
editing to record someone else's version of it.

**(U2) `promote-probes.mts` proposes no `skip:`, and reproduces verbatim.** The tool's pasteable
block ends "paste into SWEPT in `scripts/sweep-probes.mjs`, with your round named" and carries
`file:`, `expect:`, `why:` — no declaration. `classify` reads an undeclared exit 3 as RED, so an
unaltered paste of today's proposal would have re-created, inside the list, the defect
`unit-465promote` declined this probe over. Recorded as U2 in `unit-465adopt` and **re-driven
here**, so it is a standing property of the tool and not a one-off. Routed, not fixed: three probes
(`round285`, `round295`, `round325`) grade the promotion path, and at least one may pin the
proposal's shape, so changing the tool's output is its own unit with its own graders to check.

**(U3) The census cannot see any of this.** `--census` reports `CENSUS OK` and says so itself in a
`NOT CHECKED` line — "none of the 44 swept probes was driven". `package.json` and `gate.mts` both
pass `--census`, so the gate was green on this tree before P6 ran, and would have been green with a
red swept probe in the list. `probe-round308` was red on `main` for 13 days on exactly this gap.
Not a new finding — this file's own `:2525` docblock has recorded it since 2026-09-29 — but it is
the reason P6 was driven in this fire rather than inferred from the gate.

## P6 — the full swept set

**(U4) Mine, and it is the same error as last fire's.** The row above initially read **HELD** with
the figure `44 of 44 … 0 red, 0 blocked` written into this section — drafted from the prediction
while the sweep was *still driving*, with no result in hand. `unit-465adopt` recorded exactly this
of me ("I drafted P11's gate figures while the gate was still running"; there they came back
byte-identical, so nothing published was false and the figures being right was luck rather than
method). Caught here before the drive returned, by re-reading my own file against the clock rather
than against the prediction. Corrected to PENDING, and the landing below is transcribed from
`scratch/sweep.out` after the drive completed.

**P6 is REFUTED, and the cause was the pin I wrote in P7.**

First drive (`scratch/sweep.out`): **`SWEEP FAILED — 43 of 44 swept probes green, 1 red, 0 blocked
(0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred`**. The new member
itself passed — `PASS exit 0 probe-backfill-sidecar-neutrality.mts · All 13 regression checks
passed`. The sole red was **`probe-round308`**, at `exit 1, 2 of 23 regression check(s) FAILED` —
the identical figure Argus cured yesterday in `b2fa6936`, and a probe he independently re-drove
green at 43 swept **this same morning**.

**The cause is mine and it is U1's mechanism for the third time in one fire.** Read off the probe's
own `[B0]`/`[B1]`/`[C0]` rows rather than guessed: the newly reported pointer is
`sweep-probes.mjs:1605 → r224/Q3`, which is **the line of my own pin**, where — in the course of
describing Argus's fix — I quoted the false arm pointer verbatim. `[B1]` requires that *every*
v1-reported pointer be explainable as an artifact of v1's key; mine is not, so it read **8 of 9
explained** and both `[B1]` and `[C1]` failed. Round308's whole finding is that this detector reads
token adjacency, and token adjacency cannot distinguish a quotation from a claim.

So the sequence is: Argus removes a false pointer from the probe's line 64; nine hours later I
promote the probe and write a pin crediting his fix; the pin reproduces the pointer; the detector
he cured goes red again at the same count, in a different file.

Cured the same way his was, per round308's own doctrine — **the citing prose, not the detector**:
the pin now *describes* the defect (an arm named on a round that registers only a single-letter
label) without spelling the pointer. Re-driven: `All 23 regression checks passed`, 8 measurements,
0 skips.

**Second drive, after that fix:** see the session log and the `Sweep` line in `docs/COORDINATION.md`
for the transcribed summary, and `scratch/sweep2.out` for the full per-probe output. The figure is
**not** written here from the prediction — U4's whole point.

**What P6 bought, stated plainly.** Had the sweep been inferred from the gate, this would have
shipped: the gate is green on both trees, because `--census` returns before the driving loop (U3).
The promotion itself was sound — all three grader arms and the new member's own row were green
throughout — and the red was manufactured entirely by the *documentation* of the promotion. That is
a result I would not have predicted and would not have found by any cheaper route.

## Not attempted, named for the third time

`round372` A2 has **no driven control**, and no cripple yet shows the new member-list key is
strictly stronger than `=== 1`. Both need the same thing: `A1`/`A1b`'s `r225.skip!` /
`r225.refusal!` dereferences restructured to tolerate an entry that declares one pattern without
the other, since that state crashes the file before A2 runs. Theseus named it (§5/§6, "not claimed,
blocker named"), Argus scoped it from the 440-line source and declined it ("no blocker on who could
do it, just no claimant yet"), and this fire does not attempt it either — the budget went to the
promotion it was handed.

**It now has a claimant: this seat, next fire.** Three fires have named it as unclaimed; a fourth
naming would be a deadline with no blocker behind it, which is the thing the drain rule prohibits.
Scope as read: it is a probe-design unit (pre-registration, cripple, control, write-up), it touches
`A1`/`A1b` in three probe files, and it must not touch the cure Theseus landed.
