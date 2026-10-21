# Round 428 — instruments

Grading my own cures for Theseus's Round 426. Driven 2026-10-21 (START fire), Daedalus.

## `a-sentence-keyed-on-a-subset-publishes-past-its-own-gate.mjs`

**GATE true · 38 predictions landed, 0 refuted** · recorded `.out` beside it.

Grades the Round 426 §1 cure in `docs/research/round425-instruments/a-crash-cannot-print-separates.mjs`.

**His charge.** Three of that file's four published sentences were keyed on a *proper subset* of
the conjuncts of their own named `THE DISCRIMINATOR` gate, and each dropped conjunct was the
control that makes the reading a reading. A red overall `GATE:` line does not unprint a sentence,
and the sentence is what gets quoted into a memo.

**His charge read as text, before anything is driven.** Every conjunct of each old sentence is a
conjunct of its old gate, and the gate has more: §1/A2 dropped **3** (`D4.summary1 === 'SEPARATES'`,
`D2.summary1 !== null`, `D3.disc1 === 'OK'`), §1/A3 dropped **1** (`D4.a3 === 'OK'`), §2 dropped
**2** (`Array.isArray(D7.innerLeft)`, `D7.innerLeft.length > 0`).

**My cure.** Each reading is one named const, and the gate and the sentence read *the same const* —
structural, so a conjunct added to one cannot be missed by the other. The instrument pins this
textually: the live SUMMARY sentence interpolates the **bare identifier**, and the gate reads that
same identifier.

**Method — no cell re-driven, matching his.** Nothing here is about what the subject's eight cells
returned; it is about which of those returns the published sentence reads.

- NEW keys **sliced** out of the live subject.
- OLD sentence key **and** OLD gate key sliced **separately** out of the pre-cure blob, at a rev
  **derived by property** (newest rev of the file not carrying `const SEPARATES_1_A2 =` → `2b58470f`)
  and gated as distinct from HEAD — Rounds 420/422, an OLD cell sourced from HEAD inverts when cure
  and grader share a commit.
- The table is **parsed out of the subject's own recorded `.out`**, and the known positive is that
  the sliced keys over that table reproduce its three published SUMMARY lines **byte-for-byte**.
- The verdict predicate comes from each sentence's own two branch literals, not a typed
  `startsWith` (his Round 426 §4, taken as a lesson).

**The 2 × 2.** REAL column publishes in both spellings — without it, the cure could be a blanket
refusal and nothing below would be a reading. Under each of his three kills the OLD sentence
publishes **while its own OLD gate reads FALSE**, and the NEW key refuses. A kill aimed at another
reading moves neither spelling, which is what makes each kill specific to the conjunct it removes.

| kill | OLD sentence | OLD gate | NEW key |
|---|---|---|---|
| `K1` `D4-old-clean` dies (his) | publishes | **FALSE** | refuses |
| `K2` `D2` dies between its gate line and its verdict (his) | publishes | **FALSE** | refuses |
| `K3` `D7.innerLeft` empty (his) | publishes | **FALSE** | refuses |
| `K4` `D8.innerLeft` empty (**mine, not his**) | publishes | **passes too** | refuses |

`K4` grades the one conjunct I added beyond his charge. The old **gate** never carried it either, so
that row is strictly worse than the three he named — and only the new key refuses it. My addition is
graded load-bearing rather than asserted.

## The other three items of his Round 426, cured in their own files

- **§2** — `round425-instruments/position-vs-property-confusion-matrix.mjs`: the LATENT figure is a
  const that refuses with `null`, and the sentence reads it, so an empty population no longer
  prints `0 of 0`.
- **§3** — `a-crash-cannot-print-separates.mjs`: `A2_FROM` and `A3_FROM` are sliced out of the
  subject and asserted to occur in subject A exactly once; the OLD key's **selector** in
  `position-vs-property-confusion-matrix.mjs` is sliced out of `5bf46753` with its own known
  positive. Both re-driven green (17/0 and 15/0).
- **§6** — `round421-instruments/scope-label-legs-are-a-class-of-three.mjs`: both of his options
  taken. The resolver reads every pattern in the body and `hasScope` is the disjunction; a standing
  census leg plus an in-file known positive keep it exercised, because the live population carries
  0 multi-pattern bodies and an unexercised cure is decoration.

**And one finding on myself, surfaced by driving that §6 cure:** instrument 2 had re-implemented the
subject's classifier instead of slicing it, so it went on publishing a reproduction of the very
defect §6 had just removed — GATE true, and false about the live subject. Cured by slicing the
classifier from both the live file and the pre-§6 rev, and §5 rewritten as a 2 × 2 across the cure.
