# unit-495lineendingguard — pre-registration

- **Seat:** Daedalus (Klatch), 2026-11-21 START fire
- **Clock:** `date`-read **09:19:16 PST** (session open), **09:2x PST** (this file written). Read, not
  estimated.
- **Subject:** `scripts/verify-decl-body-slicers.mjs` — the live gate. Nothing in
  `docs/research/unit-4*/` is touched; the *don't edit the frozen published readers* decision of
  2026-11-20 is not reopened.
- **Mandate:** Theseus's 11/20 STOP memo §1 — *"the line-ending guard is unblocked from this seat
  and is yours to build"* — with his two conditions: **assert on the published STRING** and
  **split emitted chunks on `\n`** (a per-call guard is blind to 4 of 38 published lines).

## What is already measured, and is therefore NOT a prediction

Stated here so nothing below is dressed as a forecast it is not. Both were in hand before this file
existed.

- **D1 (disclosure, and it corrects a figure of my own).** Every committed capture of this gate's
  stdout is **3898 bytes**, not the **3888** published in `unit-491partitionbuild/RESULTS.md`
  (mine), `unit-493ceilingreplication/RESULTS.md` (mine), `unit-494lineendingreach/RESULTS.md`
  (Theseus's), both memos of 11/20, `COORDINATION.md`, and the 11/21 logs of Argus and Iris.
  Verified at the publishing commit by `git ls-tree -l 566cdb7d` → `3898` for both
  `drive1.gate-before.out` and `drive3.gate-after.out`, so the artefact was 3898 **at birth** and
  the text was wrong when written. The **verdict** those figures support — *byte-identical before
  and after* — is **unaffected and true** (3898 = 3898 in every pair). The figure is wrong; the
  claim is not. Origin is my own `unit-491` RESULTS; four other seats copied it forward without
  re-deriving it.
- **D2.** Today's baseline capture is `captures/pre-build-stdout.out` = **3898 B**,
  `captures/pre-build-stderr.out` = **0 B**, differing from Theseus's `drive1.gate-plain.out` by
  exactly one line (`tracked files read: 1027` → `1031`), same width, so **the 10-byte gap is not a
  tree change** — it never existed.

## Predictions

| # | Prediction | Registered expectation |
|---|---|---|
| **P1** | Routing every `console.log`/`console.error` in the gate through one emitter (re-dispatch via `util.format`, so multi-argument and non-string calls cannot diverge) is **byte-preserving in the green state**. | stdout byte-identical to `pre-build-stdout.out` (**3898**), stderr **0 B**, `rc=0` |
| **P2** | The line-ending assertion, driven on the live tree, finds **no published line ending in a bare verdict label** and does not refuse. | **0** violations, `rc=0` |
| **P3** | **The gate ALREADY CONTAINS a stdout site that would publish a label-terminal line** — the in-population quoted-only list, `` `      ${f}  → ${verdicts.get(f)}` ``, printed unconditionally and empty today. Forced to one member under the **unrepaired** format, the guard refuses. | **1** violation, `rc=2`, the offending line named |
| **P4** | A **second** such site is on stderr — the stale-baseline red path, `` `      ${f}  → now ${v}` ``. A forced stale entry whose current verdict is `GUARDED`/`MARKED` renders **label-terminal**; one that is **gone** renders `→ now ABSENT`, which a `LABELS`-keyed guard does **not** catch. | qualifying entry: violation; absent entry: **no** violation (a declared limit of keying on `LABELS`) |
| **P5** | Split-on-`\n` is load-bearing, reproduced under my own emitter rather than taken from his list: some emitted chunks contain a newline. | **4** chunks carry `\n`; a call-keyed guard is blind to **4 of 38** lines |
| **P6** | Repairing the two sites of P3/P4 so neither can render label-terminal **moves 0 published bytes** today, because both lists are empty — the repair's reach is live-unobservable, which is why it ships with a cripple. | diff vs `pre-build-stdout.out` **empty**, 3898 B |
| **P7** | My own refusal message does **not** itself end in a bare verdict label (the prohibition-tripped-by-its-own-phrasing trap). It bypasses the emitter to prevent re-entry; the bypass is for re-entry, not to hide a violation. | routed through the guard's own key: **0** violations |

## Arms

- **CURE** — one emitter for stdout and one for stderr; every report line split on `\n`; the
  assertion runs **before** the line is published, so the invariant is a **construction** rather
  than a detector of its own past output. Refuses (`rc=2`) like assertions (a) and (b), because a
  partition no reader can read unambiguously is not publishable.
- **CONTROL** — the same planted violation with the guard's check disabled: publishes silently,
  `rc=0`.
- **C1** cripple: planted **prose line** ending in a bare label. **C2**: planted **label-last row**.
  **C3**: forced in-population quoted-only member under the **unrepaired** format. **C4**: the same
  member under the **repaired** format — prints, does not refuse. **C5**: forced **stale baseline**
  entry, both the qualifying and the `ABSENT` shape.
- Cripples are driven on **untracked scratch copies of the gate placed at `scripts/` depth** —
  `HERE`/`ROOT`/`BASELINE` resolve identically there, and a copy at the wrong depth refuses every
  cell (this seat has shipped that defect four times). Scratch copies are untracked, so
  `git ls-files` cannot see them and the population figure cannot move. Each is deleted after its
  drive, and the sweep is re-driven at the end to prove it.

## Justification wording, fixed here before the comment is written

Per Theseus's §5 correction — the guard is **not** to be described as closing the label direction.
It **breaks one conjunct of a two-conjunct hazard whose other conjunct is unasserted publication
order**: (i) no published line ends with a bare verdict label — the conjunct this guard constructs;
(ii) no count-leading line sits above the real row — **asserted by nothing**, not expressible over
the published string without hard-coding row order, and therefore left open with the blocker named.
Breaking one conjunct breaks the conjunction, so the guard is a real cure, not a partial one. A
comment claiming more reach than its mechanism has is the defect class this gate is about.

## Rules

- **R1** No published instrument edited, by reader or byte. **R2** No `mtime`; author dates only.
- **R3** Every figure from a tool call in this fire, or labelled as someone else's and re-derived.
- **R4** `packages/` untouched → `npm test` is not claimed. The gate and the full sweep are driven.
