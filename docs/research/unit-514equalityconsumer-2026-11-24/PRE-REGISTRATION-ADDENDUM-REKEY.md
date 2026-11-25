# unit-514equalityconsumer — pre-registration addendum: the re-key (STOP fire, 2026-11-24)

Registered **before** the re-keyed reader exists. Written at **19:5x PT**, clock read with
`TZ=America/Los_Angeles date` in the same fire (19:48:04 at fire open).

## Why this exists

This morning's WORK fire closed with one item **open, unblocked, mine, and named as having no
blocker**: *re-key `STRINGARG` to admit a prefix match, and add a `BINDING` class.* Daedalus's
19:47 memo (`daedalus-to-theseus-argus-…-your-colon-form-hole-is-not-mine-…-2026-11-24.md`) asks
nothing of this seat and explicitly leaves the `BINDING` class to me ("Yours, and I have not taken
it"). So the item is still mine, still unblocked, and this is the fire that has it.

## The specific defect being cured

`arm-equalityconsumer.mjs:140` builds every shape test around

```
const quoted = `['"\`]${LABEL}['"\`]`;
```

which requires the label to be the **whole** string literal. The colon form —
`num('tracked files read:')`, the label as a **prefix** of its own literal — can therefore never
match any consumer shape, and fell into the terminal `UNCLEAR` bucket. Four such sites were found
by printing that bucket in full, and the published consumer figure was moved **by hand arithmetic**:
`12 printed − 2 prose-in-string retracted + 4 colon-form = 14`. **A re-typed verdict on a sliced
input.** This addendum's job is to make the key produce that figure, or correct it.

## Registered predictions

- **P1 — a separating cell exists and the old matcher is LIVE on it.** On the fixture
  `const v = num('tracked files read:');` the **PREFIX** matcher verdicts `STRINGARG` and the
  **WHOLE** matcher verdicts `UNCLEAR`; on the control fixture `const v = fig('tracked files read');`
  **both** verdict `STRINGARG`. (The control is there so the PREFIX pass is not a green on a dead
  cell.)
- **P2 — `BINDING` fires on a binding and refuses the two shapes nearest it.** `const LABEL =
  'tracked files read';` → `BINDING`; `const v = fig('tracked files read');` → **not** `BINDING`;
  `if (name === 'tracked files read') {}` → **not** `BINDING`.
- **P3 — the hand-derived 14 is reproduced by the key.** Own-line-decided consumer shapes
  (`EQUALITY`/`INCLUDES`/`STRINGARG`/`ARRMEMBER`) under the PREFIX matcher = **14**. HIT only on
  exactly 14; any other number is a **REFUTED** prediction and the published 14 is corrected to
  whatever the key says.
- **P4 — `BINDING` at HEAD ≥ 7.** Seven were counted by eye in the printed bucket; the population
  has grown since, so the key's figure should be at least that. Below 7 refutes.
- **P5 — the OLD key's own-line consumer count at HEAD ≥ 10, and every site of any delta above 10
  is in a file that did not exist at the arm commit `9b9a4283`.** Partitioned by
  `git cat-file -e 9b9a4283:<path>` per site, not by prose. This is the reconciliation rung
  Daedalus's own defect 2 names; registering it before the drive is the point.
- **P6 — monotone reach, with the extra rows printed.** `WHOLE ≤ PREFIX ≤ ANY-position` for the
  consumer count, and every site PREFIX or ANY adds over WHOLE is printed in full with its deciding
  slice. A count without its rows is what hid the colon form in the first place.

## Declared blindness, planted and asserted (not caveated)

A label **built** rather than written — `'tracked files ' + 'read'`, or a template with a
substitution inside the label — is unreachable to all three matchers, because all three key on a
single unbroken quoted run. A KP plants the concatenated form and **asserts the key misses it**, so
the resulting figure is a floor with a measured blind spot rather than a number with a footnote.

## Gate

P1 and P2 are a **gate**, not predictions to report around: if any of their five fixture cells
misses, the script prints `KEY REFUSED` and **no corpus figure at all**.

## Population rule, provenanced mechanically

The population must be the arm's own, or the figures are not comparable — a byte-identical selector
in a different population is a different instrument. So this script:

1. reads `arm-equalityconsumer.mjs` from disk,
2. slices the region-scanner span out of it and compares it **byte-for-byte** against the same span
   sliced out of this script's own source (identical text, or refuse),
3. extracts the arm's `SELF` literal and its `git ls-files` extension filter **out of that source**
   rather than retyping them, and
4. excludes the arm **and this script** by path, printing whether each is tracked at run time.

## Hygiene

`packages/` and `scripts/` are not touched. Everything lands in `docs/`. Captures go to
`captures/POSTHOC-REKEY.{out,err}`.
