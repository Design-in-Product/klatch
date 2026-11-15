# unit-466xjoin — pre-registration, arm B

**Written and pushed to `origin/main` before `arm-xjoin-b.mjs` exists.** Arm A is already pushed at
`2c3edaf0` with its recording; **it stands verbatim, including its three refutations.** Nothing
below retracts a line of it.

**Pin:** `bdaf99b95780d203b091b3d0c53a043ebeb2ab46` (`bdaf99b9`), unchanged.

## Why arm B exists

Arm A's `P2` and `P3` were refuted hard — 9.3% and 6.6% against a pre-registered ≥50%. But arm A's
own printed rows show the denominator is padded: the first two `CROSS_DIR` rows are
`docs/research/lib/attested-rounds.mjs → docs/mail/read`. `K-cons` matched **any** string literal
ending `.out` or `.md`, which swallows mail memos, `COORDINATION.md`, `CLAUDE.md` and every other
repo document into a tally that is supposed to be about **research recordings**. 1060 literals, 306
of them `CROSS_DIR`.

A refutation measured against a denominator two-thirds of which is not evidence is not a finding
about the hazard; it is a finding about the key. That is the padding failure, in my own arm, one day
after I published a memo about it.

## `K-cons-narrow`

Identical to `K-cons` except the resolved artefact path must be **under `docs/research/`** and end
**`.out`** — a drive recording, the only artefact class a producer's stdout actually becomes. `.md`
is dropped entirely, which also drops the `PRE-REGISTRATION.md` consumers arm A counted.

**Containment is asserted, not assumed** (`B1`): every `K-cons-narrow` hit must be a member of arm
A's `CROSS_DIR` + `SAME_DIR` hit set. A narrowing that *adds* a member is a different key, and every
comparison with arm A would be between two things.

## Legs

- `B1` containment: `K-cons-narrow` ⊆ arm A's resolved-hit set — **red if any member is new**.
- `B2` the KP (`arm-rhscap-a.mjs:47`) survives the narrowing and still lands `CROSS_DIR` + the
  producer dir still holds `arm-p12site-b.mjs:283`.
- `B3` arm A's padding is decomposed and printed: of arm A's `CROSS_DIR` literals, how many end
  `.md`, how many end `.out` outside `docs/research/`, how many survive.
- `B4` gate: `git status --porcelain packages scripts docs/research/lib` empty.

## Predictions — all graded unconditionally, printed above the verdict line

- `Q1` `K-cons-narrow` distinct `(consumer file → producer dir)` `CROSS_DIR` pairs: **≥20 and ≤150**.
- `Q2` share of those whose producer dir holds ≥1 `K-prod` site: **≥30%** (arm A: 9.3%).
- `Q3` share whose producer dir holds ≥1 `LOSSY_BASENAME` site: **≥20%** (arm A: 6.6%).
- `Q4` of arm A's 306 `CROSS_DIR` literals, the share that `K-cons-narrow` drops: **≥50%**. This is
  the size of the padding, stated as a prediction rather than asserted after the fact.
- `Q5` **artefact-level, and a weaker thing than it sounds.** For each narrowed pair whose artefact
  is committed at the pin, read the artefact and ask whether it contains a line publishing a
  **bare basename** `*.mjs`/`*.mts` token (no `/`). Prediction: **≥30%** of narrowed pairs consume
  such an artefact. A bare basename in the consumed artefact is the lossy publication *arriving at*
  a cross-file consumer — which is still **not** proof the consumer keys on it (`B-lim2`).

## Declared limits

*Limits — things this arm cannot see:*

- `B-lim1` **`A-lim1` is inherited unchanged**: producer identity stays at directory granularity, so
  `Q2`/`Q3` over-report by an unmeasured amount.
- `B-lim2` `Q5` measures what the artefact **publishes**, not what the consumer **reads out of it**.
  Realisation remains out of scope by construction (`A-lim3`), and `Q5` must not be read as it.
- `B-lim3` dropping `.md` drops real consumers — `unit-464dir/grade-direction.mjs:66` reads a
  `PRE-REGISTRATION.md`. The narrowed figure is a figure about **recordings**, deliberately, and is
  therefore not comparable to arm A's except in the direction `B3` prints.
- `B-lim4` interpolated literals stay unresolved, as in arm A.

*Housekeeping:*

- Arm A is not re-run and not edited; its recording is the frozen comparison and `B3` reads arm A's
  classification by re-deriving it in-process, not by parsing arm A's `.out`.

— Theseus, 2026-11-15
