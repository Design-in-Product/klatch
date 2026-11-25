# unit-517 — addendum: shape reach vs hazard reach

**Registered after the arm's only drive (`8189e3be`, pushed 13:26:28 PST) and before
`posthoc-hazard.mjs` existed.** The arm's figures are committed and unchanged by anything below.

## Why this rung

P7 came back **REFUTED**: the census finds **6 members / 11 hits**, not the 1 I asserted this
morning. But *6 files carry the shape* is not *6 files are blind*, and publishing 6 as the reach of a
blindness would be the same move as this morning's P3 — a figure standing in for a claim it does not
make. The hazard needs the read subject to actually contain the keyed property in a **non-literal
position**; a reader whose property never appears as a ternary operand anywhere is blind to nothing.

This is the ladder this corpus keeps re-finding one rung at a time: a **subject** census prices the
breakage, only a **consumer** census says whether anyone would notice.

## What I have and have not done before registering

**Have:** the arm's committed census output — the 6 member paths, their hit counts, and the first
matching line of each, as printed at `8189e3be`.

**Have not:** read any of the 5 non-subject members' bodies; extracted any property name by machine;
run the cured extractor against any name other than `cls`; counted a ternary occurrence anywhere
outside the Key E slice.

## Registered predictions

### PH1 — the property name each member reads is extractable from its own key
For each of the 6 members, the property name its regex reads is recoverable from the regex source by
the same colon-anchored shape the census keyed on. **Registered: 6 of 6 extractable, 0 unresolved.**
**Expected: HIT.**

### PH2 — the generalised extractor must be re-KP'd per name, not assumed
The extractor was KP'd on `cls`. Parameterised by name it is a **different key**, and inheriting the
9-of-9 would be an answer key stale relative to its own subject. The KP set re-runs with the name
substituted (`p`, `error`) and must come back green on all cells including the four refusals.
**Registered: 9 of 9 under each substituted name.** **Expected: HIT.** If it does not hold, no PH2/PH3
figure is reportable.

### PH3 — the hazard is a strict subset of the shape, and the gap is most of it
For each of the 6 property names, count occurrences in a **ternary-operand position** across the
tracked population, using the re-KP'd extractor. A member is **live-blind** iff its property has at
least one such occurrence.

**Registered: `cls` has ≥ 1 (known: 2, in the Key E slice, which is the subject's own read target);
the other 5 names have 0 each; so live-blind members = 1 of 6.** **Expected: HIT.**

If a second name returns non-zero, the blindness I found in my own instrument this morning is live in
another seat's instrument too, and that is an escalation rather than a tidier figure — it would be
reported as such, to the file and line.

### PH4 — the two figures must be published together or neither
**Registered as a commitment, not a measurement:** the memo and `RESULTS.md` state the shape figure
and the hazard figure in the same sentence. `6` alone overstates the reach of a blindness; `1` alone
hides that five other readers are one ternary away from the same failure. Neither number is the
finding; the **gap** is, and the gap is a property of the corpus today and can close without anyone
touching a reader.

## Declared limits, registered in advance

- The ternary count is over **tracked `.mjs`/`.js`/`.mts` under `docs/research` + `scripts`** — the
  arm's population, reused deliberately so the two figures share a denominator. A property appearing
  as a ternary operand in `packages/` is out of scope and this is a **floor**.
- A property name that is common English (`file`, `error`) will match object literals that have
  nothing to do with the member's read target. The count is therefore an **upper bound on the
  hazard** at the same time as the population is a floor, and the two do not cancel. Both directions
  are stated with the figure.
