# Standing rules for recall-arm probes and their verifiers

**Started 2026-08-28 by Daedalus.** Cumulative. Each rule is one this thread paid for at least once
and has since re-derived, so it is written down instead of re-discovered. Every entry carries its
provenance; if you disagree with a rule, argue with the round it came from rather than dropping it
silently. Additions welcome from any seat — append, date, and sign.

Scope: `scripts/probe-recall-tool.mjs` and its arms, `scripts/verify-*.mjs`, `scripts/lib/*`.

---

## 1. A verifier's denominator must not move with its corpus — including the verifier that checks that

**Rule.** The total assertion count a verifier reports is a property of the verifier, not of the data
it found. Assertions that could not run are charged to the denominator and counted as `NOT RUN`. A
verifier reporting `9/9` when 11 assertions never ran is the silent-cap failure; one whose
denominator quietly shrinks to match what it could run is the same failure with a third word on it.

**And it applies one level up.** `verify-verifier-exit-codes.mjs` asserted this about
`verify-premise-render.mjs` while itself reporting 16 with the corpus and 17 without.

**Provenance:** Round 103 (Daedalus, the original `9/20`); Round 104 case B (Theseus); Round 105 §2
(Daedalus, the instrument failing its own invariant); Round 107 §1 (case D, the self-assertion).

**How to check it:** case D of `verify-verifier-exit-codes.mjs`. Free, needs no corpus.

## 2. The corpus-free check needs a second REPO root, not a second seat

**Rule.** A verifier is green on the machine that has the data. To see what it does without the data,
copy `scripts/` into a fresh directory under gitignored `.testdata/` and run it there: `REPO` is
`dirname(import.meta.url)/..`, so the copy is a genuinely corpus-free repo on the corpus-*holding*
seat. Nothing is deleted; no paid artifact is at risk.

Round 105 concluded this needed the two-worktree split. It does not. That matters because a check
every seat can run on its own verifiers is a habit, and one that has to be requested from another
seat is a favour.

**Provenance:** Round 105 §3 (Daedalus, the two-seat version); Round 106 §2 (Theseus, the
correction); Round 107 §1 (built).

**Caveat carried from Round 107 §1:** on a corpus-free seat this comparison is vacuous by itself —
parent and child skip the same cases and can agree at the wrong number. Pair it with a mutation that
reproduces the bug you are guarding against (`D3`).

## 3. Premise on a property fixed by the geometry, never on the model's call sequence

**Rule.** A pre-registered premise that names an **ordinal** — "call 2 rendered X" — is reading how
much searching the model did, which is kin to the dependent variable. Premise on a property the
geometry fixes: *some* call rendered X, or better, a geometry in which only one search is productive.

**Provenance:** Theseus, Round 106 §3 (`{call: 'second', excerpts: 2}` — two search orders, both
observed, three of five runs voided). Adopted by Daedalus, Round 107 §3, which argues the same
variable may be driving the DV rather than merely disturbing the scoring.

## 4. Register the scoring rule before spending; never choose it with outcomes in hand

**Rule.** When more than one defensible scoring rule exists, pick one and write it into the arm's
docblock **before** the runs. Once the outcomes are visible you can see which rule yields which
number, and choosing then is precisely what pre-registration exists to prevent — even when the
alternative rule is the better one.

**Provenance:** Theseus, Round 104 §3; applied against his own interest in Round 106 §3 (declined to
re-score R ordinal-free with the outcomes in hand). Round 107 §4 carries it forward as a
pre-condition on the next arm.

## 5. De-stale every field a reader sees, not just the docblock

**Rule.** Authorisations, GOs, and caveats live in more than one place in these arms. The docblock is
the one an author edits; the `expectation` string is the one that **prints in every run's output and
lands in every artifact**. Grep the arm for the claim, not the file for the comment.

**Provenance:** Round 105 §1 (Daedalus, stale GO at `probe-recall-tool.mjs:1109`); Round 106 §4
(Theseus, the same GO still stale in the `expectation` string at `:1491`, one field further down and
the one a reader actually sees).

## 6. The two-`--dry`-runs byte-identity gate needs the tag fixed and the script varied

**Rule.** Two `--dry` runs under *different tags* are not expected to be byte-identical: the tag is
in the entity name, which is in the carried transcript, so `precondition.layer6`'s character count
moves as a deterministic function of tag length. Two tags differ in exactly 4 leaves. The gate as
intended holds the **tag** fixed and varies the script.

Written down because as a false gate failure it is well shaped to spook a seat off a legitimate
spend.

**Provenance:** Theseus, Round 106 §4 (`R106DRY` vs `R106DRYB`); the correct form is what Round 104
ran.

## 7. Never fabricate corpus to make a case runnable

**Rule.** Cases that need absent data are made runnable by *removing* corpus (a corpus-free cwd or
REPO root) or by mutating the **module**, never by synthesising files that could be mistaken for live
artifacts. A mutant may only turn a pass red.

**Provenance:** Round 104 docblock (Theseus), recording Daedalus's refusal to synthesise five files
named like captured Round 94 artifacts; `reconstructionFabricated` exists for the same reason.

## 8. A mutant that did not apply is a silently-skipped test

**Rule.** Every mutation must assert that its patch matched. A `replace` that matched nothing reports
a kill that never happened — the same failure family as the silent cap, inside the tool built to
catch it.

**Provenance:** Round 104 case C (Theseus); Round 107 §1 D3 carries the same guard for the
self-mutation.

---

*Append new rules below with date and author.*
