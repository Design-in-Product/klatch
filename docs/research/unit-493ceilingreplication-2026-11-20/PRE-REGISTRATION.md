---
unit: unit-493ceilingreplication
seat: Daedalus
date: 2026-11-20 (STOP fire)
subject: >
  Two things, both opened by reading rather than by a routed ask: (1) an independent
  replication of Theseus's unit-492 §1 re-drive ceiling under a key written from
  scratch, and (2) a grade of a claim my OWN gate's docblock makes twice — that a
  label-keyed reader pointed at a number-first line "returns NOTHING rather than the
  wrong row" — against the newline-crossing mechanism this seat measured today in the
  mirror direction.
---

## Why this unit exists

Neither inbound memo this fire asks anything of this seat. Argus: *"Nothing further asked
of either of you."* Theseus's §5 is addressed to Argus's pin and his §6/§7 report his own
defects. So the fire's substantive work is not a routed item; it is what reading the two
memos against the live subject turned up.

Two things did.

**(1) I am about to act on Theseus's census.** His §5 disposition — don't edit the two
frozen published readers, let the next reader written inherit the anchored form — is a
call partly in this seat's lane, and adopting it means asserting the figure under it. Per
CLAUDE.md I may not assert a figure I have not driven this session, and Argus modelled the
right answer this morning by re-driving both reader literals himself rather than taking
either memo's word. So: my own key, written from scratch, not adapted from
`arm-frozenredrive.mjs`.

**(2) Reading my own gate for the reply, I found a claim I cannot yet grade.** Lines
492–499 and 536–539 of `scripts/verify-decl-body-slicers.mjs` both assert that the
report lines are number-first *because* **"a label-keyed reader pointed at a number-first
line returns NOTHING rather than the wrong row, so the failure is loud instead of
silent."** Today's `unit-491` §2 finding — reproduced independently by Argus — is that
`/(\d+)\s+UNGUARDED/` reads **3** off the published output, because `\s+` crosses the
newline into the *preceding* verdict row. That is the same mechanism in the mirror
direction. If `\s+` crosses the newline one way it crosses it the other way, so the
docblock's "returns NOTHING" is a claim about adjacency in the published text, not a
property of number-first formatting — and it is asserted twice, in the voice of a
settled finding, in a file whose whole subject is readers that silently read the wrong row.

## Registered predictions

**Disclosure, and it changes what P1–P3 are worth.** `census-ceiling.mjs` and
`reconcile.mjs` were written and driven FIRST, at 17:18–17:22 PST, before this file
existed; this pre-registration was written at 17:2x after reading their output. So
**P1, P2 and P3 are POST-HOC statements of results already in hand, not predictions**,
and they are recorded here as such rather than dressed as forecasts — a replication
whose "prediction" was written after the drive is a replication, and calling it a
prediction would be the only dishonest thing in it. **P4–P6 are genuinely
pre-registered**: no reader has been applied to any capture of the gate's output in this
fire at the time of writing.

- **P1** *(post-hoc)* — the replication's **max gap** at which any `.out` in this corpus has been
  rewritten is **+2d**, matching unit-492 §1. *(Replication of his load-bearing figure.)*
- **P2** *(post-hoc)* — my event count will **not** equal his 48, because my key dedupes to
  (commit, unit) and his is file-level. Registered as a predicted *disagreement*, with the
  reconciliation owed: my file-level row count should be exactly **48**.
- **P3** *(post-hoc)* — my instrumented-unit count will be **191**, not his **190**, and the single
  added member will be **`unit-492frozenredrive-2026-11-20` itself**, which became
  instrumented when his own drive artefacts committed after his census ran.
- **P4** — at least one match of the form `/LABEL\s+(\d+)/` or `/(\d+)\s+LABEL/` over the
  gate's full published output **crosses a newline**, where LABEL ∈ {MARKED, GUARDED,
  UNGUARDED}. *(If this is false the docblock claim survives.)*
- **P5** — **the docblock's "returns NOTHING" claim is FALSE as written**: there exists a
  label-keyed reader that returns a *number* rather than nothing, sourced from a line
  other than the one the label is on.
- **P6** — the claim is nevertheless **true of the number-first report lines specifically**
  — i.e. no crossing match lands on a count published by one of the two `NOT CHECKED` /
  `NOT A MARKER` report blocks. Registered separately from P5 because they can both hold,
  and if they do the defect is the claim's **reach**, not its content: a true sentence
  about the report lines, written where it reads as a general property of the output.

## Restraints

- **R1** — this unit edits **no frozen published instrument**. `unit-479braceslicekeys`
  and `unit-487markerreport` are not touched, by either reader or byte. The disposition
  adopted in §5 of the reply is exactly "don't edit them," and a unit that argued it while
  editing one would be worthless.
- **R2** — `packages/` is not touched, so **`npm test` is not claimed**.
- **R3** — all dates are `git log` **author dates**; no `mtime` is read anywhere. The
  wrapper re-syncs this worktree before every fire, which would make all 238 unit
  directories look freshly touched.
- **R4** — if the docblock claim is false, the cure lands in the **gate's own comment**,
  which is this seat's live file. It does **not** land as an edit to any published
  reader — that is the call Theseus's §5 leaves open and this fire does not take it.
- **R5** — figures reported from a fresh drive in this fire, with the drive kept as a
  file, or labelled as another seat's unreproduced figure.
