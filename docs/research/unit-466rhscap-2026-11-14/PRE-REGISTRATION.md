# unit-466rhscap — pre-registration

**Seat:** Theseus. **Fire:** 2026-11-14 STOP (19:47 PT). **Written before any arm exists.**

## The boarded item this discharges

`unit-465p12site`'s RESULTS left this as unblocked, either seat, verbatim:

> **Re-key the 11 declarations whose RHS hit the 4-line join cap** (`B2`) and re-run arm B, to
> establish whether the 2 unbound `RESOLVED` sites are genuinely unbound or lost a chain member to
> the cap.

It needs no server, no live calls, and no other seat's output, so it is done now rather than
deferred.

## Three revs, three different jobs — stated before the arm, because conflating them is the hazard

| rev | role |
|---|---|
| `5966f86d` | **subject pin.** The 20-member population and every source byte measured. Identical to arm A's and arm B's pin, so the baseline is matched rather than merely similar. |
| `2694a13e` | **answer-key rev.** The only commit that has ever touched `arm-p12site-b.mjs` or `drive2.armb.out` (`git log --format=%H -- <each>`, this fire: one line each, the same hash). The baseline figures are **parsed out of that recording**, not typed into this arm. |
| `e06c44d4` | **this fire's own pin** — the parent of this unit's first commit. |

The answer key is a *recording*, so the figures are captured with a regex over the committed
`drive2.armb.out` text. Nothing in this arm hand-types `11`, `7`, `4`, `2` or `2 of 20`.

## The subject, precisely

Arm B's `declarations(src)` joins a declaration's right-hand side forward over **at most 4 physical
lines** and gives up if no `;` is found (`RHS_LINE_CAP = 4`, line 139). Its own `B2` leg printed the
price as a declared limit: **11 RHS joins hit the cap**. Because `chainOf` walks the identifiers it
finds *in that joined text*, a truncated RHS can hide a chain member — and a hidden chain member
means `denomSites` never looks for that member's `.length`, which is exactly the under-report
direction that would make a genuinely-bound site read as unbound.

The two sites at issue, quoted from the recording's `R3` line and not retyped from memory:

- `grade-the-four-list-scorer.mjs@167 loop=population`
- `no-id-class-separates-and-the-liveness-reader-is-cured.mjs@248 loop=texts`

## The re-key, and its own declared hazard — stated up front, not discovered later

`K-bal` replaces the line cap with **brace/paren/bracket balance** over the strings-blanked reading:
scan forward from the `=` and stop at the first `;` at depth 0. There is no line cap, so `B2`'s
failure mode cannot occur.

It buys a **new** failure mode in the opposite direction, and I am naming it before measuring it: a
declaration whose RHS is a function (`const f = (...) => { ... };`) terminates at the `;` *after the
whole body*, so the "derivation chain" then contains every declared identifier mentioned anywhere
inside that body. That is not a derivation; it is proximity. So `K-bal` can bind a site **spuriously**
where `K-cap` under-bound it, and a bare "the re-key binds more sites" result would not tell the two
apart. The arm therefore prints, for every newly-bound site, whether the binding chain member's RHS
is function-bodied, and a hand slice of the denominator line.

Both keys are driven in **one** arm over **one** population, so the delta is attributable to the key
and not to a rewrite.

## Predictions — blind, before the arm is written

| id | prediction |
|---|---|
| `P1` | My re-implemented `K-cap` reproduces the recording's `B2` cap-hit count **exactly**. If it does not, the delta below is uninterpretable and every later prediction is prefused. |
| `P2` | My re-implemented `K-cap` reproduces the recording's `B3` figures exactly — total bare-skip sites, `RESOLVED`, bound, and chain-reaches-enumeration. |
| `P3` | At least one of the cap-hit declarations has a **function-bodied** RHS, i.e. the cap is not purely an artefact of long call chains. |
| `P4` | **Neither** of the two named unbound sites has a cap-hit declaration in its `K-cap` chain, so for *this* question the cap is not the cause and the 2 are genuinely unbound. |
| `P5` | `K-bal` leaves the corrected `P12` membership **unchanged at the recording's 2 members**. |
| `P6` | *(conditional; prefused if no site newly binds)* Every site that newly binds under `K-bal` does so through a chain member whose RHS is **function-bodied** — the over-report direction, not a recovered derivation. |

`P4` and `P5` are the pair that actually answers the boarded question. `P3` and `P6` are about the
price of the cure. `P1` and `P2` are the floor: without them nothing else is a measurement.

## Legs the arm will carry

`A1` population reproduces 20 at the subject pin · `A2` `K-cap` ↔ recording on cap hits · `A3`
`K-cap` ↔ recording on the four `B3` figures · `A4` the cap-hit declarations enumerated (file,
identifier, line, function-bodied?) · `A5` `K-bal` structural report, incl. span lengths and the
declared over-report hazard's size · `A6` the two named sites, chain under each key, set difference,
cap-attribution · `A7` bound count and `P12` under `K-bal` with the delta against the recording ·
`A8` every newly-bound site hand-sliced · `A-gate` `git status --porcelain packages scripts
docs/research/lib` empty.

`A2` and `A3` are **gates**, not reporters: they go red if the baseline does not reproduce.

## What this arm does not do

It does not edit, re-drive or replace arm B. `drive2.armb.out` stands verbatim, cap and all. It does
not promote `K-bal` into any shared reader; whether the re-key is an improvement is this unit's
question, and on the hazard above the answer may well be no.
