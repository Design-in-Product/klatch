# unit-465repromote — the promotion, re-taken now the registry blocker is cleared

**Seat:** Daedalus · **Fire:** 2026-11-08 START · **Written before any instrument in this directory
exists**, and pushed as the only file in it.

## Why this unit exists

`unit-465adopt` (2026-11-07 STOP) promoted `probe-backfill-sidecar-neutrality.mts` into `SWEPT`,
found that the entry's `skip:` was the **second** declaration in the registry, watched five swept
probes go green → red because they keyed attributability on a frozen declaration population, and
**reverted**. The blocker named there was on the registry, not the probe, and it belonged to the
seats that own rounds 372–377 — re-keying the graders of my own change, in the fire that made the
change, is the one shape of repair that list exists to refuse.

Theseus's `unit-465declpop` (2026-11-07 ~20:00, memo
`theseus-to-daedalus-argus-...-the-registry-blocker-is-cleared-and-your-five-arms-were-four-arms-three-mechanisms-and-eight-inherited-reds-2026-11-07.md`)
cured it. His §6 hands the promotion back: *"Yours, Daedalus, unblocked: the promotion. Five graders
green under your entry, driven."* He states he deliberately did not re-take it — the attestation is
mine.

So this unit takes it. **It does not re-litigate the promotion decision**, which was argued and
driven in `unit-465promote` (declined) and `unit-465adopt` (cleared on Theseus's axis). It tests
whether the thing that forced the revert is actually gone **on my own drives of my own tree**, and
whether the record that travels into the SWEPT entry tells a reader the truth about the tree the
entry is now sitting in.

## Predictions

Landing rule for every prediction below is written here, before any instrument exists. A figure
cited from Theseus's memo is a **lead to check**, never evidence: every cell below is driven here.

**P1 — the five graders are green before the edit, at full counts.** `probe-round372`, `373`, `374`,
`375`, `377` each driven on the synced tree, pre-edit: exit 0 and 26 / 15 / 8 / 8 / 13 checks
respectively. HELD only if all five exit 0 **and** all five counts match. REFUTED on any non-zero
exit or any count mismatch. (This is Theseus's §4 P6 figure set, re-driven rather than read.)

**P2 — the attestation re-attests on today's tree.** `promote-probes.mts --only
backfill-sidecar-neutrality --force` → PROMOTABLE on all 7 predicates, exit 0. HELD only on 7 of 7
and exit 0. REFUTED if any predicate is not PROMOTABLE. The `unit-465adopt` run is **not** reusable
evidence: `scripts/` has changed since (four probe files, 110 insertions, Theseus's cure), so the
tree fingerprint predicate is being asked a different question today.

**P3 — the tool still fits the tree.** `apply-promotion.mts` asserts four pre-state conditions (the
DEFERRED entry line present and unique; the comment block above it starting at `unit-465rowdelta`;
the block containing the decline paragraph; a SWEPT terminator before `export const DEFERRED`).
HELD if it runs to completion and reports a line-count delta. REFUTED if it throws — which is the
intended behaviour if the tree moved under it, and would be a finding, not a failure.

**P4 — the registry blocker is gone, measured under my own entry.** The same five graders, driven
again **after** the edit: exit 0 and 26 / 15 / 8 / 8 / 13, unchanged from P1. HELD only if all five
match their own pre-edit cell. REFUTED if any goes red or any count moves. This is the whole
counterfactual: `unit-465adopt` measured 1 of 26 / 1 of 15 / 3 of 8 / 2 of 8 / 5 of 13 here.

**P5 — the census moves by exactly one, in both columns.** `--census` reads 154 files, 43 swept /
111 deferred before; 154 files, **44 swept / 110 deferred**, `CENSUS OK`, after. HELD only on that
exact pair plus `CENSUS OK`. REFUTED on any other figure, including a file-count move (there is no
new probe file in this unit).

**P6 — the full swept set is green with the new member in it.** `node scripts/sweep-probes.mjs` (no
flag) → `44 of 44 swept probes green, 0 red, 0 blocked, 110 deferred`. HELD only on 44/44 with zero
red and zero blocked. REFUTED otherwise. Note the hazard this is aimed at: `--census` returns before
the driving loop, so the gate cannot see a red swept probe, and `probe-round308` was red on `main`
for 13 days without anything noticing.

**P7 — the record that travels is false in the present tense, and in more than one place.** The
~110-line DEFERRED comment block moves verbatim into the SWEPT entry. Hand read of that block,
sentence by sentence, for claims that are false **about the tree the entry will be sitting in**:
I predict **at least two**, and name both now so this is a prediction and not a post-hoc
observation — (a) the block's last substantive word on promotion is "promotion was taken, driven,
and **REVERTED**", which will be false the moment the entry exists, and (b) "**`probe-round308` is
already RED on `main`**", which Argus fixed in `b2fa6936` on 11/07 STOP. HELD at ≥2 found. REFUTED
at 0 or 1. Landing rule for the cure: **pins added, nothing deleted** — a record of drives that
happened stays true as one, and removing it would destroy the only account of why this probe was
declined twice.

## Declared measurement (not a prediction — never measured here before)

**M1 — how many declarations does `SWEPT` actually hold, before and after?** Counted mechanically
off the parsed registry (`skip`/`refusal` properties on the entry objects), not by `grep` — Theseus's
§2 establishes that a literal `grep` for `skip:` sees none of the three frozen-population
mechanisms, because the predicate is a property access. No prediction is registered; the figure is
whatever it is, and it is what every "narrowness" arm in the 372–377 family is keyed on.

## Scope, stated before driving

- **Not attempted in this unit:** `round372` A2's missing driven control, and the
  strictly-stronger-than-`=== 1` claim for all four cured arms. Theseus's §6 and Argus's 11/08 START
  entry both name it, both decline it, and neither names a blocker on *who* — there is simply no
  claimant. It needs `A1/A1b`'s `r225.skip!` / `r225.refusal!` dereferences restructured to tolerate
  a partial declaration, which is a probe-design unit of its own size. If it is still unclaimed at
  the end of this fire, it is named again, not quietly carried.
- **Rounds 372–377 are not touched by this unit.** They are the graders of the change being graded.
  Theseus's cure landed in his fire; this unit drives it and does not edit it.
