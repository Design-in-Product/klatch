# unit-528 PRE-REGISTRATION — curing `unit-522`'s prefix-form blindness, and hand-reading the 28

- **Pin:** `8e49bb0f993cee1d3a545b7f6e4a12ee3db2cbc2` on `main` (`git rev-parse HEAD`).
- **Clock:** `10:50:12 PST`, 2026-11-27, read by `TZ=America/Los_Angeles date` **in the same command
  that created this directory** and read the SHA.
- **Product diff at that moment:** `git diff --stat HEAD -- packages/ scripts/` printed **nothing**
  in that same command. This unit is a no-op on product.
- **Written before:** `arm-prefixform.mjs` exists; before any reader, cure, KP, population or
  capture exists. The predictions in §4 are registered against nothing.

---

## 1. What has and has NOT been read — declared, because it is where the predictions point

**READ before writing this file (so no prediction below may claim to be blind to it):**

- `docs/research/unit-526fiftyeight-2026-11-26/RESULTS.md` §2 and `captures/ARM.out:248–304` —
  **the whole printed list of 28 sites, both lines of each**. I have read every one. Predictions
  about the *membership* of the 28 are therefore informed, and I say so at each one.
- `docs/research/unit-526fiftyeight-2026-11-26/arm-fiftyeight.mjs:118–235` — `classifyC`, `sitesT`,
  the three populations, the two selections.
- `docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs:95–200` — `UNIT_TAIL`,
  `keyOf`, the KP block, the census population.
- `docs/research/unit-522lengthasbytes-2026-11-26/posthoc-which-133.mjs:46–70` — how `UNIT_TAIL` and
  `regionOf` are sliced there.

**NOT read, deliberately, and these are exactly where the mechanism lives:**

- the **subject declarations** of any of the 28 — i.e. for a site printing `bytes: src.length` I have
  *not* opened the file to see what `src` is. §4's P8 is a prediction about a population I have not
  inspected.
- `scripts/lib/strip-source.mjs`'s `regionOf` body (sliced whole by the arm, never retyped).
- whether any of the 28 is also selected by the suffix key (P6).
- `arm-fiftyeight.mjs`'s figure driven **today** — the control in P1 has not been run.

## 2. The subject, stated once

`unit-522`'s selector locates a byte-unit label by reading **only the text after** `.length`:

```js
const UNIT_TAIL = /^[}\s)\]'"`,.:;+\-=]{0,8}(B|bytes|byte)\b/;
// applied to line.slice(idx + '.length'.length), cut at the next `${`
```

`unit-526` §2 measured the reach of the resulting blindness at **28 sites** — arm-C-`STRING` sites on
the shared population where the unit token sits **before** the `.length` (`bytes: src.length`,
`stdout bytes: ${(r.stdout || '').length}`, `bytes=${x.length}`). That blindness is in **neither** of
`unit-522`'s two declared limits (`L2` next-line, `L3` named-variable).

**It is a reach, not a defect count.** `unit-526` left two things open and this unit takes both:

- **Q1 — the cure.** What does a prefix-aware instantiation of the *same sliced key* do to the
  census, over one pinned population, against the published instantiation driven as a control?
- **Q2 — the hand-read.** Of the sites in question, which are **true mislabels** (a UTF-16
  code-unit count printed as "bytes") and which are **false positives**? `unit-526` put the
  false-positive floor at **1** and named it (`scripts/measure-marker-floor.mjs:296`) off
  `unit-465` §5's thirteen-day-old hand verification.

## 3. The cure, specified before it is written

Symmetric to the published key. Head = `line.slice(0, idx)`, then **cut at the last `}`** — the
mirror of the published key's cut at the next `${`, and for the same reason: text before a `}` is
inside a *previous* interpolation's expression and cannot be a label for this one.

```
PREFIX_UNIT = /\b(B|bytes|byte)\b(?:\s*[:=]\s*|\s+)(?:\$\{)?[A-Za-z0-9_$.\[\]'"`()?|&!\s+\-]{0,40}$/
// applied to head.slice(head.lastIndexOf('}') + 1)
```

A separator (`:`, `=`, or whitespace) is **required**, so a subject merely *named* `bytes`
(`bytes.length`) is refused rather than read as a label — that is `L3`'s territory, not this cure's.

**The frozen files are never written.** `UNIT_TAIL` and `regionOf` are sliced from
`unit-522`'s arm and `scripts/lib/strip-source.mjs`; the cure is an **addition** in this unit's own
file, and the published instantiation is driven unchanged so the two readings are comparable.

## 4. Predictions — 13, registered now

| id | claim | registered |
|---|---|---|
| **P1** | **CONTROL.** `unit-526`'s frozen `arm-fiftyeight.mjs`, driven unchanged as a child process at this pin, reports a "`unit-522` bytes-token LABEL-IN-STRING over T-POP" figure **exactly equal** to this arm's sliced PUBLISHED reading over the same T-POP. | equal (delta **0**) |
| **P2** | that figure today, one day after `unit-526` published **58** | **[58, 70]** |
| **P3** | T-POP today (`git ls-files` ∩ `extRe`, minus this fire's instruments) | **[654, 668]** |
| **P4** | **the cure's gross reach** — `bytes`-token LABEL-IN-STRING sites selected by PREFIX_UNIT and **not** by the published suffix key, over T-POP | **[28, 140]** — wide on purpose: the cure runs over T-POP (654 files, no `BUFFERISH`/`ARRAYLIKE` filter), whereas the 28 was over arm C's `STRING` selection on SHARED. I expect the cure to add **more** than 28 and cannot bound it from what I have read. |
| **P5** | of `unit-526`'s **28**, how many the cure adds | **≥ 24 of 28** (informed: I have read the list; `regionOf` LABEL-IN-STRING is a different test from arm C's `classifyC`, so I do not register 28) |
| **P6** | sites selected by **both** the published suffix key and the cure (a token on each side) | **> 0** |
| **P7** | **KN gate.** Every known negative passes, including `bytes.length` (subject merely named `bytes`) and a token 20+ characters from an unrelated `.length` in the same interpolation segment. | **100%, or the figure is published with the over-reach named** |
| **P8** | **THE HAND-READ'S HYPOTHESIS.** Among the 28, **at least one** site whose subject is a Buffer *declared on a different line* — a false positive **invisible to arm C's line-level `BUFFERISH` test**, because the prefix form is precisely the form that moves the subject away from the label. | **≥ 1** (I have not opened a single subject declaration) |
| **P9** | the cure **refuses** `scripts/measure-marker-floor.mjs:296` — arm C's own known false positive, where `bytes` is a division operand in a *previous* interpolation and the `}`-cut should exclude it | **refused** |
| **P10** | KP gate on the cure: every planted/sliced positive passes before any figure | **100% or ABORT** |
| **P11** | the published reading and the cured reading **disagree on 0 files in the direction of loss** — the cure is purely additive on this key (it adds a disjunct) | **0 lost** |
| **P12** | `.length` occurrences in T-POP, the vacuity floor | **≥ 2000** |
| **P13** | of the 28, true mislabels after the hand-read | **[18, 27]** — informed by having read the lines but not the subjects; the floor of 1 false positive is `unit-526`'s, so 27 is the ceiling it fixes |

**Non-emptiness is registered apart from the intervals** (`unit-524`'s vacuous P7/P8): P4, P5 and P6
each require a **non-empty** set, and an empty one is **REFUTED**, not a satisfied interval.

## 5. Abort conditions

- any slice anchor absent or non-unique → abort before any figure;
- any KP/KN failure on the **published** instantiation → abort (a slice that cannot reproduce its
  source grades nothing);
- the control child process exiting non-zero → the control is reported FAILED and P1 REFUTED, and no
  differential is published as licensed.

## 6. What this unit does NOT do

- It does not edit `unit-522`'s or `unit-526`'s frozen arms (settled 11/20). The cure exists as a
  specified regex plus its KP set in this unit's file; a seat that wants it has it.
- It does not re-publish `unit-522`'s census.
- It says nothing about item 10 (xian's and only his).
