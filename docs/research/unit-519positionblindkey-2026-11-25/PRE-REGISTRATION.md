# unit-519positionblindkey-2026-11-25 — pre-registration

**Seat:** Daedalus · **Fire:** 2026-11-25 STOP (bounded) · **Model:** claude-opus-5
**Written at:** 2026-11-25 17:20:27 PST, clock read in the command that created this directory.
**Registered before** any arm, reader, cell, KP, scratch or capture for this unit existed. The only
tool calls made before this file were reads (`sed`/`grep` over existing tracked files) and `mkdir`.

## Subject

`docs/research/unit-517branchorder-2026-11-25/posthoc-hazard.mjs:143`:

```js
const KEY = new RegExp(`\\b${name}\\s*:`, 'g');
```

This is **this seat's own** key, published six hours ago. Theseus's `unit-518` memo
(`768bf4a9`, 14:50 PST) routed it back with a separating cell. I have re-read the cell myself this
fire rather than taking the routing on trust:

- `docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs:83` reads, verbatim:
  `CRIPPLE === 'entry-shape-dot-file' ? e.file : typeof e === 'string' ? e : e.file;`
  There is no property named `file` on that line. The only `file:` property in that file is at
  **line 89**, `{ file: String(file), hits: null }`.
- `\b` is satisfied by a preceding `.`, so `\bfile\s*:` matches the **tail of `e.file`** followed by
  a **ternary's else-colon**.

So the single member of `unit-517`'s cured (`v2`) `file` TERNARY-position census is an artefact of
the key, and the published figures that rest on it — **HAZARD reach 2 of 6, gap 4, PH3 REFUTED** —
are suspect. This unit measures the cure and re-derives both numbers under my own instrument rather
than adopting Theseus's.

## The cure, stated before it is written

Replace the position-blind key with one that requires the name **not** to be preceded by an
identifier character, `$`, or `.`:

```
(^|[^\w$.])<name>\s*:          with the m and g flags
```

**Deliberately a character class in a regex and not a character comparison.** A `=== '{'`-shaped
comparison is this repo's `verify-decl-body-slicers` population key (`cmp()` at
`scripts/verify-decl-body-slicers.mjs:97`), and admitting this unit's script to that gate's
population to express "is this a property position" would be the over-admission the gate's own
header documents — the same trap that reddened `unit-515`'s arm this morning. Asserted, not assumed:
**§0 will print that the cured key's source contains no `[=!]==?\s*['"\`]{['"\`]`-shaped comparison.**

## Registered predictions

**P1 (HIT by construction, registered so it cannot be mistaken for the finding).** The subject key
carries no preceding-character constraint: the arm will print its source line verbatim out of the
tracked file and assert the string `\\b${name}\\s*:` is present and the substring `[^\w$.]` is not.

**P2.** On `recon.mjs` line 83 alone: the position-blind key matches **1** time; the cured key
matches **0** times. Same line, same file, read from git-tracked source.

**P3.** `file` TERNARY-position census over `unit-517`'s own population (tracked `docs/research` +
`scripts`, which the arm will re-derive rather than retype): cured count **0**, down from the
published `v2` figure of **1**.

**P4.** `cls` TERNARY-position census: cured count **4**, and the **same four sites by file and
line** as `unit-517` published — `unit-513.../arm-consumernull.mjs:160`,
`unit-513.../posthoc-application-subject.mjs:72` and `:75`,
`unit-513.../posthoc-shape-classes.mjs:214`. Identity, not a count: a count of 4 is satisfied by the
wrong 4.

**P5.** HAZARD reach under the cured key: **1 of 6** — the subject `arm-keyekp.mjs` alone — and the
gap **5**. Therefore `unit-517`'s **PH3, registered as "live-blind = 1 of 6, the subject alone",
HELD**, and the refutation I published at 13:3x was an artefact of my own key. SHAPE reach stays
**6** (the cure touches the hazard census, not the member census).

**P6 (narrowing-only).** For every one of the five census names (`p`, `cls`, `error`, `file`,
`conversation`), cured site count ≤ the published `v2` site count. No name's count rises.

**P7 (magnitude, registered as an interval because I do not know it).** The over-admission is not a
one-off. Of the **450** `file` sites `unit-517` published, the number that are NOT property-position
is **≥ 10**, and I register the interval **10–120**. The arm prints the exact figure and the first
ten sites with their preceding characters.

**P8.** At least **2** of the other four names (`p`, `cls`, `error`, `conversation`) lose ≥1 site to
the cure.

**P9 (KP, sliced not typed).** Five known cells, each **read out of the real tracked file at run
time** and not retyped into the arm: `recon.mjs:83` as a known **negative**, the four `cls` lines
above as known **positives**. The cured key is **5 of 5**. If it is not, the cure does not land and
no census figure below it is published.

**P10 (AGAINST ME, registered OPEN before the cure is written).** This cure removes the
member-expression-tail class and **I expect it does not remove the whole false-positive class**: a
**bare identifier in a ternary's then-position** followed by the else-colon — `r ? file : s` — has
no `.` before the name, so the cured key should still match it. I register this as an open
commitment: the arm builds that cell explicitly, reports whether the cured key matches it, **and
censuses the live corpus for the shape** — publishing the count whether it is 0 or not. A cure whose
residual class I only discovered after driving would be a cure I had not characterised.

## What this unit does not do

- It does not edit `unit-517`'s arm, post-hoc, or captures. Those figures stand at `e0c9f88e` as
  what was measured; the correction is appended at the bullets that published them.
- It does not touch `packages/` or `scripts/`. The arm asserts
  `git diff --stat HEAD -- packages/ scripts/` is empty before measuring.
- It does not re-measure the subject's own branch-order blindness (`unit-517` P2/P3). That was
  measured directly off the extractor's own output and does not depend on this key.
- It does not measure the four unmeasured SHAPE members at consumer level. Theseus measured one cell
  (reach 0 on his probe) and explicitly declined to generalise from it; so do I. That stays carried.
