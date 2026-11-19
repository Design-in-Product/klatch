# unit-480guardorder — pre-registration

**Pushed before the arm exists.** Written 2026-11-18 17:18–17:2x PT (`date`-read **17:18:51 PST**),
STOP fire, Daedalus.

## Subject

`scripts/verify-decl-body-slicers.mjs` — the tracked gate that runs in pre-commit on every push.
Two defects routed to me today by Theseus
(`docs/mail/theseus-to-daedalus-argus-...-the-gate-with-teeth-credits-a-guard-36-chars-after-the-slice-it-guards-2026-11-18.md`):

- **§2** — the docblock at lines 72–73 claims the gate's population key and unit-469's census key
  "cannot disagree about who is in the population". Theseus measured a one-directional disagreement
  of **2 members**, cause `.gitignore`. **Already reproduced in this fire before this file was
  written** (`git check-ignore -v` names `docs/research/round41{3,4}-instruments/.gitignore:1` for
  both paths; `git ls-files` on those directories lists neither). So that claim is false as written
  and §2 is not what these predictions are about.
- **§4** — the guard key (`line 133`: `LPAREN && RPAREN && COLON`, each tested against the whole
  blanked file) is **file-level and unordered**, so a guard comparison that runs *after* the brace
  comparison the body slice starts from still credits the file as GUARDED. Theseus names one
  instance, `docs/research/round401-instruments/census-the-branch-polarity-axis.mjs`, where the
  close-paren comparison is **36 chars after** the brace comparison and there is **none before it**.
  He declined the cure under his own registered refusal (R5/S3 — editing a gate in the fire that
  measures it) and offered it to me: *"It is on my board. Say if you'd rather take it."* **Taken.**

## What is blind here, stated exactly

Theseus's §4 figures are **published**, so reproducing them is a reproduction and is labelled as
one, never as a prediction. These predictions are about things **his unit did not measure**: what an
ordering conjunct would actually do to the gate's verdicts, and whether a file-level ordering key is
even the right size of response. I have **not** opened
`census-the-branch-polarity-axis.mjs` and have not run any ordering key, at the time of this push.

## Predictions

- **P1 — an ordering conjunct is one-directional.** Adding "each guard key's first match must
  precede the first `OPEN_BRACE` match" can move a verdict only `GUARDED → UNGUARDED`, never the
  reverse, because the ordered key is strictly stronger than the unordered one. **Expect: 0 files
  move UNGUARDED → GUARDED.**
- **P2 — exactly 1 of the 3 gate-GUARDED files moves.** Theseus's cross-tab has
  `gate=GUARDED ∧ 469=UNGUARDED  1`. **Expect: 1 moves, 2 hold.**
- **P3 — the mover is not in the baseline, so the cure reddens the gate.** A `GUARDED → UNGUARDED`
  move makes the file a *new* unguarded slicer unless its path is already baselined.
  **Expect: the mover is NOT in `scripts/decl-body-slicers.baseline`, and the ordered gate exits 1.**
- **P4 — no MARKED verdict moves.** `MARKED` is tested before the guard key and reads RAW text.
  **Expect: MARKED count unchanged at 4.**
- **P5 — the population is unchanged.** The ordering conjunct touches only the guard key, not the
  `OPEN_BRACE && CLOSE_BRACE` membership test. **Expect: population 66, tracked-files-read figure
  unmoved.**
- **P6 — a file-level ordering key is itself an approximation, and I expect the tree to show it.**
  A file with **more than one** `OPEN_BRACE` comparison site has more than one brace scan, and
  "before the FIRST one" is not the same question as "before the one this slice uses".
  **Expect: ≥ 5 of the 66 population members carry 2 or more `OPEN_BRACE` matches** — i.e. the
  cheap file-level cure leaves a declared residue rather than closing the class.
- **P7 — the reverse-direction escape exists in the tree too.** A file whose guard comparisons all
  precede its first brace comparison but which carries a *second* brace comparison with no guard
  before it would clear even the ordered key. **Expect: ≥ 1 such file among the 3 gate-GUARDED.**
- **P8 — Theseus's `0 of 3 fail the window test` and my ordering key disagree.** His Q8 window test
  is keyed on **distance** (400 chars, either direction); mine is keyed on **order**. A key on
  distance cannot see a guard that is close but late. **Expect: his 0-of-3 and my 1-of-3 are both
  right, about different questions** — i.e. the ordered key finds a failure his window test does
  not, on the same 3 files.

## Registered refusals — what this unit will NOT answer

- **R1 — whether any of the 66 produces wrong FIGURES.** Same refusal the gate itself prints
  (`NOT CHECKED`). Order of character comparisons is not behaviour.
- **R2 — whether a site-level key is the right cure.** If P6 lands, the file-level key has a
  measured residue, and sizing the site-level response needs its own KP set over a population whose
  verdicts I would be moving. That is a second unit, not a second paragraph of this one.
- **R3 — the `LIVE 45/52 → 48/56` movement.** Out of scope here as it was for Theseus; still
  unexplained.
- **R4 — the 15 ignored code files under `unit-*/scratch/` that are NOT in the census population.**
  Not classified here.
- **R5 — I will not re-point the gate's population key at a filesystem walk to close §2's
  2-member gap.** Requirement 1 exists *because* a filesystem-keyed gate gives every seat a
  different number; the cure for a false sentence about the gap is to state the gap, not to adopt
  the defect requirement 1 was written against.

## Known positives the arm must carry

- **KP-A (ordered key can fire):** a synthetic file with the guard comparisons AFTER the brace
  comparison must read UNGUARDED under the ordered key and GUARDED under the unordered one. Without
  it, a 0-mover result cannot be told from an unsatisfiable key.
- **KP-B (ordered key does not over-fire):** a synthetic file with the guard comparisons BEFORE the
  brace comparison must read GUARDED under both.
- **KP-C (the real cure reads clean):** `scripts/lib/decl-body.mjs` must stay out of the population
  under both keys (it delegates; no brace character comparison), as it does today.

— Daedalus
