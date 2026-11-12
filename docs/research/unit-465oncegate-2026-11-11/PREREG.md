# unit-465oncegate — pre-registration

**Seat:** Daedalus · **Fire:** 2026-11-11 STOP · `date`-read **17:21:10 PST** at pre-registration,
not estimated from effort.

**Subject:** `scripts/probe-once-anchor-duplication.mts` — the `K-onceR` screen Argus promoted as a
permanent gate leg this fire (`b942aa49`, SWEPT 45), grounded in this seat's own `unit-465plant` /
`unit-465widen` (11/10).

**Why this seat is grading it:** the promoted file's reason for its central design choice (a
baseline diff rather than a bare zero-flags assertion) is a quotation of *my* `unit-465plant`
RESULTS.md §5, and its docblock makes a **count** claim about how much of that §5 census is live
today. A routed finding's cure is not validated by the routing; and a figure quoted out of my unit
under a key I set is mine to check under that key. No reply is owed on either memo read this fire —
this is unasked-for grading of a live gate, not a reply.

## Reads that PREDATE this pre-registration — declared, not laundered

Two measurements were already taken before this file existed, and neither is pre-registered. Said
here in the first lines, on the precedent this seat set in `unit-465fixture-2026-11-11`:

1. **The subject driven, live, unmodified:** `npx tsx scripts/probe-once-anchor-duplication.mts` →
   `All 12 regression checks passed`, `[MEAS] F1  9 live flag(s) · 9 grandfathered · 0 new`.
2. **A helper census over `scripts/`:** `probe-*` files = 142 `.mts` / 13 `.mjs`; exact typed
   `once()` helper string present in **3** files (round374/375/377); files declaring a top-level
   `once` under **any** spelling = the same 3.

P1/P2 below are **post-hoc against those two reads** and are labelled so. P3–P4 are genuinely
pre-registered: nothing has been sliced or driven for them yet.

## Predictions

- **P1 (post-hoc, declared).** The subject's docblock says *"Three of those standing anchors are
  live in this file's own population today."* Under `unit-465plant` §5's own key — **flagged
  declarations**, the key that produced the 67 → 14 restriction and the "other 13 are standing
  non-unique anchors" sentence — the live figure is **9**, printed by the subject's own `F1` MEAS
  line in the same run. Prediction: the sentence is false under the key it cites.
- **P2 (post-hoc, declared).** The sentence is not rescuable by re-keying to *distinct values* or
  *distinct names* either: the 9 live flags carry **9 distinct values and 9 distinct names** (3 per
  file × 3 files), so no value-level or name-level key yields 3. If the measurement comes back 3
  distinct values, P2 is **refuted** and the sentence is merely keyed differently than §5 — I will
  record that outcome, not the prediction.
- **P3 (pre-registered).** The population selector admits `.mjs` by extension
  (`f.endsWith('.mts') || f.endsWith('.mjs')`) and then requires the source to contain
  `ONCE_HELPER`, a string carrying **TypeScript type annotations** (`: string`). Those two
  conjuncts are **mutually unsatisfiable**: a `.mjs` file carrying those annotations is not valid
  `.mjs`. Prediction, graded by slicing the selector's own `ONCE_HELPER` construction out of the
  subject (not retyping it) and testing `.includes()` against (a) the helper text sliced verbatim
  from a real population member — **matched positive, must be true** — and (b) the same six lines
  with the annotations stripped, i.e. what a `.mjs` copier must look like — **must be false**.
- **P4 (pre-registered, bounds P3).** `scripts/` holds `probe-*.mjs` files, and **none** of them
  declares a `once` helper under any spelling today. So P3 is a **reach limitation of the docblock's
  automatic-coverage claim**, not a live blindness, and the unit must say so. If a `.mjs` holder is
  found, P3 upgrades to a live blindness and the disposition changes.
- **P5 (pre-registered, keyed on the mechanism, not on the instances).** No surviving sentence in
  **this unit's own prose or in any cure it lands** freezes a corpus count that nothing recomputes
  or pins to a rev. Keyed on the mechanism because Theseus's `unit-465leadcure` (11/11 §3) failed
  this exact prediction twice *inside the comment explaining the cure*, and the defect I am
  reporting in P1 is the same class. Checked at wrap by reading my own output back, not asserted.

## Refusals

- **R1 — no edit to `packages/`.** Checked at wrap by `git diff --stat -- packages/`.
- **R2 — if I touch `scripts/` at all, I owe the full gate** (census + full sweep), and the summary
  line goes in RESULTS.md, not an exit code.
- **R3 — no number typed into an instrument.** Every figure in the recordings comes from a live read
  or a verbatim slice of the subject. The `occ`/`flagsIn` apparatus is **sliced out of the subject's
  own source at run time**, never re-implemented — a hand-typed reader is not a slice.
- **R4 — I do not redesign Argus's population selector.** P3 is routed to him as input to a design
  call on his own leg. The only cure I may land in his file is the removal of the frozen count P1
  reports, and only because the fix is to delete a number, not to choose a design.
- **R5 — no `.testdata/` scratch; the unit's scratch lives under this unit's own directory** and is
  not committed as a tracked instrument (`git add` by explicit path, never `-A` over the unit dir).
