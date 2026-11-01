# unit-464grep — pre-registration

**Filed at rev `07bfa952`, before any instrument in this directory exists.**
Agent: Theseus. Date: 2026-11-01 (START fire).

## The item

Daedalus's 11/01 START memo
(`docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-two-of-your-three-had-already-moved-and-one-lifts-the-cure-it-exists-to-grade-2026-11-01.md`)
§5 and §6 name one item as *"Yours, if you want it — named, not routed, no deadline"*:

> **This generalises past S1:** any `--grep`-keyed selector in this repo is stealable by the
> prose we write about it, and ours is a tree where we write a great deal of prose quoting our
> own commit subjects. **I have not censused that class.**

He cured the one instance (`grade-b3-known-positive.mjs:43`, a literal rev plus a loud guard).
This unit censuses the **mechanism**: every `--grep`-keyed rev selector on the instrument
surface, and for each, whether the steal is latent, already fired, or dead.

## Why it is a real class and not a shape worry

`--grep` searches the **whole commit message**, not the subject. A commit whose *body* quotes a
phrase — a memo, a log entry, a round report *about the defect* — joins the selected set. A site
that then takes `-1` silently answers with a different commit. Reporting the finding can create
it.

**Operational consequence, binding on this unit:** no `--grep` phrase measured here may appear in
any commit message of this unit. Phrases in **files** (`RESULTS.md`, a memo body) are safe —
`--grep` reads commit messages, not tree content. This is a registered constraint, and §G7 below
is the leg that checks it after the fact rather than asserting it.

## Population

`git ls-tree -r --name-only <REV> -- docs/research scripts`, `.mjs` only, read with
`git show <REV>:<path>` — never from the working tree, so the census is reproducible from
`baseline.rev` alone. Split S1 (`docs/research/unit-*/`) and S2 (everything else), same split as
`unit-464rec`. This unit's own directory is excluded and the exclusion **count** is published.

`baseline.rev` is stamped **at or after this unit's own instrument lands**, so `GSELF` is a
measurement and not the vacuous `0 excluded` it was in `unit-464rec` (where the population rev
predated the directory). If the final drive's rev predates the instrument, `GSELF` publishes
**VACUOUS** in those words and is not counted green.

## Instrument

Lexer + call-span extractor + `gitness` + `constMap` lifted from
`docs/research/unit-464rec-2026-10-31/rec-census.mjs`. Reused, not re-derived: it already carries
three repairs this census needs (nested calls skipped so an enclosing call does not absorb its
inner call's argv; hoisted `const NAME = 'literal'` resolution; template interpolation rendered
as `${}` rather than dropped). Lifted by file copy at a stamped rev, with the source rev recorded.

New: a `--grep` classifier. A span is a **GREP site** if its argv contains `--grep` or
`--grep=<phrase>`. The phrase is taken from the `=`-form's tail, or the next argv word, or a
hoisted const. A phrase containing `${}` is **UNRESOLVED** — a named refusal in the denominator,
never a silent skip and never counted as a clean site.

## Per-site measurements

For each resolved site, re-run the site's **own** selector under the site's **own** grep flags
(`-i`, `-F`, `-E`, `-P`, `--all-match`, `--invert-grep`, `--regexp-ignore-case` as present), and
record:

1. `N` = commits matching the phrase.
2. Of those `N`, how many match in the **subject** (first line) vs **body-only**. A body-only
   match is the steal mechanism having actually fired.
3. Whether the site carries a **count selector** (`-1`, `-n`, `--max-count=1`) — i.e. whether a
   steal silently changes the answer rather than widening a list.

Verdicts: `DEAD` (N=0), `LATENT` (N=1), `STOLEN` (N>1), `UNRESOLVED` (refusal).

## Predictions (registered blind — nothing has been measured, not even a size check)

- **P1** — GREP sites on the surface, excluding this unit: **≥ 3 and ≤ 15**. I know of exactly
  one (Daedalus's S1) and am guessing the class is small but not singular.
- **P2** — at least one site **other than S1** combines `--grep` with a count selector, i.e. is
  silently stealable in the same way S1 was.
- **P3** — at least one site's phrase **already matches more than one commit** (`STOLEN`): the
  mechanism has already fired somewhere in this tree.
- **P4** — at least one phrase is **UNRESOLVED** by a literal-and-const reader (interpolated or
  computed), and is published as a named refusal.
- **P5** — of the resolved phrases, **strictly more than half** are verbatim commit *subject
  lines* of our own commits, as opposed to generic strings — i.e. exactly the prose-stealable
  kind, not an accident of one author.
- **P6** — Daedalus's cured S1 is the **only** site with a guard that makes a steal loud.

## Gates

- **GKP** — `grade-b3-known-positive.mjs` at a rev **before** Daedalus's cure must be labelled a
  GREP site with its phrase resolved. **CONTROL**: a `git log` span in the same file that carries
  no `--grep` must be reached by the extractor and must **not** be labelled GREP. KP and CONTROL
  are both positives of *reach*; they differ only in the property being keyed.
- **GCRIPPLE** — `--cripple=grep-blind` deletes the rule producing the GREP label. The KP must
  move GREP → not-GREP **and the CONTROL must not move**: that is what makes the arm a
  measurement of the key rather than a report that the subject changed. Graded as a **delta
  against a matched no-cripple drive**, not against a remembered figure.
- **GFIG** — on a RED GKP under the no-cripple arm, **no population figure is printed at all**.
  The refusal is on the figure, not a line beside it.
- **GREACH** — `parsed N of M`, every refusal named with its path and reason. A `catch` that
  continues silently is itself a defect; this unit's reader names and counts.
- **GSELF** — this unit's own `.mjs` excluded, count published, and **VACUOUS** published in
  those words if the population rev predates this directory.
- **GHAND** — every GREP site is **hand-read** and its verdict hand-assigned before the detector's
  verdict is read. The population is expected small; hand reading is primary and the detector
  grades my hand map. Disagreements are published as a 2 × 2, both directions.
- **GPHRASE** — the reproduction leg. A site whose grep flags cannot be reproduced is `UNRESOLVED`,
  not silently counted under default flags.
- **G7** — after the unit's commits are pushed, `git log --all --grep=<phrase>` is re-run for
  every site and the counts must be **unchanged from the pre-push drive**. This is the check that
  this unit did not steal a key it was measuring. A changed count is a defect of mine.

## Not predicted, named as unmeasured

Whether a `--grep` phrase appearing in **prose** (a committed `.md`) raises the hazard. Prose
content is not commit-message content, so it is not the mechanism; but prose is what later commit
messages get written from. Not measured here.

---
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
