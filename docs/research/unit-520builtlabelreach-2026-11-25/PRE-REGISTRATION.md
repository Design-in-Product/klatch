# `unit-520builtlabelreach-2026-11-25` — pre-registration

**Seat:** Theseus (Klatch) · **Fire:** 2026-11-25 STOP (19:47 PT)
**Clock when this directory was created:** read with `TZ=America/Los_Angeles date` in the same
command as the `mkdir`; the value is in the commit message of the commit that lands this file.
**Written before any arm, reader, cell, KP, scratch file or capture exists.**

## 0. Which carried item this is, and why it is a measurement rather than a cure

`unit-516` §9 carries three items as *unblocked, mine, no blocker*. This unit takes the third:

> **the inherited concatenated-label blindness, carried since `unit-514` KP11 and still unmeasured
> in the integrated key.**

`unit-514` KP11 **planted** the form `num('tracked files ' + 'read:')` and **asserted the miss** —
every matcher in that corpus finds the label only inside a single unbroken quoted run, so a label
assembled by concatenation yields **0 occurrences** and is invisible to the whole pipeline. That
made every consumer figure in the thread (`13`, `18`, `20`, `22`) a **floor with a declared blind
spot** rather than a count.

What has never been done is the next step: **the blindness's reach over the live corpus.** A
declared blindness with an unmeasured reach is indistinguishable, in every published figure, from
no blindness at all — and the lesson this seat has recorded five times is that *a declared
blindness does not survive a change of form*. If the live reach is 0, the floors are counts in
practice and that is worth publishing. If it is not 0, every figure in the thread is short by a
named amount.

This unit measures the reach. It does **not** cure the key: a cure belongs in the key's own file,
and the reach is what decides whether the cure is worth its price.

## 1. Subject, population, and what is frozen

- **Label under test:** the string `tracked files read`, which is `LABEL` in
  `docs/research/unit-516secondargfixture-2026-11-25/arm-secondargfixture.mjs:37`.
- **Population:** `git ls-files` at this fire's HEAD, filtered to the **same extension rule the
  inherited instrument used** (`/\.(mjs|js)$/`), so the result is commensurate with the published
  **22**. The filter is **extracted from published source at run time, not retyped** — if the
  extraction fails the arm aborts rather than falling back to a typed literal.
- **Frozen instruments, never executed, edited or copied:** `unit-514`'s
  `posthoc-rekey-prefix-and-binding.mjs`, `unit-516`'s `arm-secondargfixture.mjs`. Anything this
  arm needs from them is **sliced from source at run time** and asserted intact before use.
- **No product change.** `git diff --stat HEAD -- packages/ scripts/` is asserted **EMPTY inside
  the arm, before any measurement runs**, and printed.

## 2. The detector, specified before it is written

A built label is one whose text is assembled across a **concatenation joint** — a closing quote, an
optional-whitespace `+`, and an opening quote — so that no single literal contains the label.

The detector is a **joint collapse**: rewrite every occurrence of
`(quote) optional-ws + optional-ws (quote)` to the empty string, which splices the two adjacent
string literals into one, then count label occurrences in the collapsed text and compare against
the count in the raw text.

```
raw count        occurrences of LABEL in the file as committed
collapsed count  occurrences of LABEL after every concatenation joint is spliced
gain             collapsed − raw        gain > 0  ⇒  at least one built-label site in that file
```

The collapse is deliberately **position-blind and syntax-blind** — it is not a parser — and both of
its error directions are registered below rather than discovered.

## 3. Predictions

Graded by the arm. Each is a claim about something that can come back against me.

- **P1 (KP, positive, necessarily planted).** `unit-514` KP11's exact form,
  `num('tracked files ' + 'read:')`, gives **raw 0** and **collapsed ≥ 1**. The positive cell
  **must** be planted rather than sliced, because whether the live corpus contains one is the
  question this unit asks; a sliced positive would presuppose the answer. Declared, not hidden.
- **P2 (KP, positive, second form).** A split at a different position — mid-word,
  `'tracked files re' + 'ad'` — also gives raw 0 and collapsed ≥ 1. One KP per shape is coverage of
  one axis; a detector that only handles a split at whitespace is a different detector.
- **P3 (KP, positive, three-part).** `'tracked ' + 'files ' + 'read'` gives raw 0, collapsed ≥ 1.
- **P4 (KP, known negative, SLICED from a real tracked file).** A real line that contains the label
  in one unbroken literal has **gain 0** — the collapse does not invent a label where one was
  already whole. The cell is read with `readFileSync` → `split` → index out of a tracked file, not
  typed.
- **P5 (KP, declared blindness of MY detector, planted and asserted MISSED).** A label assembled
  through a **variable** (`const w = 'read'; num('tracked files ' + w)`) and one assembled through
  **template interpolation** (`` num(`tracked files ${verb}`) ``) both give **gain 0**. My detector
  is blind to them. Asserted, so the residual class is measured as missed rather than caveated.
- **P6 (the headline, with an interval).** Live reach of the blindness across the population:
  **I register 0, with an interval of 0–2 built-label sites.** A figure above 2 refutes the
  interval; a figure above 0 refutes the point prediction and makes every published consumer
  figure in this thread short by a named amount.
- **P7 (vacuity guard — the one that decides whether a 0 is a finding at all).** The collapse must
  **fire somewhere**: the number of files in the population in which at least one joint was
  collapsed is **> 0**, and I register the interval **≥ 20 files**. If the collapse rewrites
  nothing, a label-gain of 0 is a dead reader agreeing with my prior, not a measurement. This is
  registered because a 0 returned by a reader that never ran is the failure this seat has recorded
  four times.
- **P8 (the two counts are different counts).** Files where the collapse changed *any* text, and
  files where it changed the *label count*, are different populations, and I predict the first
  strictly exceeds the second. Published as a pair; publishing only the second would make the
  reader unable to tell a measured 0 from a dead one.
- **P9 (false-positive direction, registered OPEN).** The collapse can **manufacture** a label that
  nobody wrote, by splicing two literals whose adjacency is not an assembly of this label
  (fixture text, an array of fragments printed with `+`, a quoted run that merely contains `' + '`
  as text). I register this as a real hazard with **unknown count**, and the arm reports every
  gain site with its own line text so a manufactured hit is visible as one rather than counted as
  a finding.
- **P10 (commensurability).** The population this arm reads, under the extracted filter, is within
  **±5 files** of `unit-516`'s published **635–639 files read**; a larger drift means I am not
  measuring the population the 22 was measured over, and the comparison to 22 is void.

## 4. Declared limits

- **The detector is not a parser.** It cannot distinguish a concatenation of two literals in one
  expression from two literals adjacent for any other reason; P9 covers that direction and the
  per-site line text is published.
- **Variable- and interpolation-assembled labels are out of reach** (P5), and so are labels built
  by `.concat()`, `Array.join`, or any run-time assembly. Named here rather than discovered later.
- **This unit does not touch the key.** No file outside this unit directory is written.

## 5. Stop condition

One drive of the arm. If a prediction's cell cannot be constructed, the prediction is published
**UNGRADED** with the reason, not quietly dropped.

— Theseus
