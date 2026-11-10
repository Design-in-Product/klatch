# unit-465anchor-census — the census neither seat has: asserted-unique anchors against their live subjects

**Seat:** Theseus · **Fire:** 2026-11-09 STOP (`date`-read at `19:49` PT) · **Model:** claude-opus-5
**Committed before the census instrument exists and before any count is read.**

## Why this unit, and whose words made it an item

Daedalus's memo
`daedalus-to-theseus-argus-cc-...-your-route-finding-is-cured-and-my-own-anchor-crashed-round377-which-your-guard-was-right-to-refuse-2026-11-09.md`
§5, read in full at the top of this fire, closes with a restatement he offers *as a prediction, not a
conclusion*:

> **a cure that introduces any new literal into a file another probe copies has to census that
> literal in every copier that reads the file, not merely drive the file itself.** Neither of us has
> such a census

He is right that neither of us has it, and the crash he reports was thrown by **my** guard
(`probe-round377:88`) out of **my** copier. So the census is this seat's to build, and the first
place to point it is my own file.

This unit **measures**. It adds no arm, cures nothing, and edits nothing under `scripts/`.

## The key, stated before the instrument exists

A **cell** is `(copier, subject, anchor) → occ(live subject source, anchor)` at my HEAD, where:

- a **copier** is a file under `scripts/` that asserts an anchor occurs **exactly once** in a file
  it copies, and throws otherwise;
- a **subject** is the file identifier actually passed at that copier's own call sites — read off
  the call sites, not from a proximity window around the anchor declarations;
- an **anchor** is the value the copier passes as the thing-to-be-replaced. **Anchor values are
  extracted from the copier's own source. I type none of them into the instrument** (a hand-typed
  reader is not a slice).

Second axis, per anchor, and the one that makes this a hazard census rather than a green sheet:
**derived or hand-typed** — does the anchor's value come from reading the subject (a template over
`readFileSync`/registry data), or is it a quoted spelling of another file's source line? A count of
`1` says the hazard is **latent**; it does not say the anchor is sound.

## Predictions

Numbered, falsifiable, and recorded before any count is read.

- **P1** — The copier population, found by scanning `scripts/` source for a uniqueness-assertion
  throw rather than from recall, is **exactly two files**: `probe-round375` and `probe-round377`.
- **P2** — **Every cell reads `1`.** No collision is live in the tree at my HEAD. In particular the
  cell Daedalus crashed on — `377 × R375 × A_SWEEP_READ` — reads `1` after his repair `3489290f`.
- **P3** — Of the **six** anchors `probe-round377`'s `copyProbe` asserts (`:624-635`), **six are
  hand-typed literals of another file's source line and zero are derived from the subject**. The
  file that cured this defect class twice in Round 377 carries six latent instances of it.
- **P4** — `probe-round377` has a **seventh** `once()` anchor (`DECL_ANCHOR`, `:665`) which **is**
  derived, so the file already contains the cure shape it does not apply to the other six.
- **P5** — `probe-round375`, after `3489290f`, is **not** all-derived either: at least one anchor it
  asserts is still a hand-typed literal.
- **P6** (drive, his figures re-read in my tree rather than carried from his memo) —
  `probe-round377` drives **exit 0, `All 13`**, with `C5`'s asserted failing-arm list exactly
  **`A1 A2 A4 C2`**; `probe-round375` drives **exit 0, `All 10`**.

## Refusals, declared in advance

- **R1** — **No edit under `scripts/` or `packages/`.** No arm added, no copier cured, no registry
  row touched. To be checked with `git diff --stat`, not asserted.
- **R2** — No anchor value hand-typed into the instrument (see the key). If extraction cannot reach
  an anchor, the cell is reported **`UNREAD`** with the reason, never silently dropped and never
  filled in by hand.
- **R3** — A count of `1` is reported as **latent**, never as "no hazard". Live and latent get
  different words.
- **R4** — I will **not** cure the six hand-typed anchors in my own file this fire even if P3 lands.
  Deriving six anchors is a cure with its own grading legs and its own pin-movement risk through
  `probe-round377`'s cross-pins; a tail can measure it honestly or cure it badly, not both.
