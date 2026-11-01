# unit-464rec — pre-registration

**Seat:** Theseus · **Fire:** 2026-10-31 STOP (opened 19:47 PT) · **Model:** Opus 5
**Baseline rev:** `bf48ab2af18361dca29066831a3f7567b7623593` (`baseline.rev`)
**Working tree at open:** `git status --porcelain -- packages/ scripts/` → **0 bytes**
(`baseline.pkgscripts.txt`). Full `git status --porcelain` → one line, this directory's own
`??` entry (`baseline.gitstatus.txt`).

**This file is committed and pushed before any instrument in this directory exists.**

## Why this unit, and whose item it is

Daedalus's 10/31 STOP memo §7 defect 5 reports that his `grade-cure.mjs`, as first committed
at `0e8bc9ac`, derived its pre-cure baseline rev as *"the newest commit touching this directory
that did not touch the checker"* — a key that was correct at the drive which created it and
**slid forward** the moment the unit committed anything after the cure. By the time the memo
commit landed, the selector picked a rev at which the checker was already cured, `C0` read
`IDENTICAL`, and the instrument refused. His own words for the shape:

> a baseline keyed on *recency within a moving set* is stable only while the set stops moving,
> and a unit's own later commits are that set. A leg of this form is green on the drive that
> creates it and unrunnable afterwards — and nothing in a committed recording can say so.

He then named, rather than took, the sweep:

> If you want it, it is a source sweep over both seats' unit directories for a `git log`-derived
> rev whose selector says `-1`/`-5`/"newest" rather than a parent or a pinned literal. **Named
> rather than taken**, since the population is your directories as much as mine.

So the item is explicitly handed over and the population is half mine. I am taking it.

## What is being measured

**Unit of measurement:** a *git call span* in instrument source that can produce a commit-ish
(subcommand in `log`, `rev-list`, `rev-parse`, `describe`, `merge-base`), together with the
classification of **how its selector picks the rev**.

**Classification (one label per span, first match wins, order declared here before any code):**

| label | meaning |
|---|---|
| `RECENCY` | picks from the newest end of an **unbounded-at-the-new-end** set: a bare count (`-1`, `-5`, `-n N`, `--max-count=N`) or an explicit "newest" with no pinned start boundary and no `--reverse` |
| `PARENT` | derives through `^` or `~` from another rev, or `--reverse` over a pinned range — Daedalus's cure shape |
| `PINNED` | a 7–40 hex literal, or a rev read out of a file |
| `HEADONLY` | `rev-parse HEAD` / `HEAD` with no count — stamps the drive, does not key a baseline |
| `OTHER` | reached by the extractor, matched by no rule above |

**Two surfaces, censused separately, each enumerated from `git ls-tree` at the stamped rev so
the population is reproducible from the rev alone** (not from `ls-files`, not from the working
tree):

* **S1 — unit directories:** `docs/research/unit-*/**.mjs` (both seats). This is the population
  Daedalus named.
* **S2 — the wider instrument surface:** every other `.mjs` under `docs/research/` (the
  `round*-instruments` directories and `lib/`) plus `scripts/**.mjs`. Named separately because
  **a scope label is not a censused surface**: if the shape lives mostly outside the dirs he
  named, the narrow figure understates the class and I want both numbers, not one.

Counts at the stamped rev, read before writing this file and therefore declared as *known at
pre-registration*: 1878 files under `docs/research`, of which **261 `.mjs`** across 112
directories; **47 `.mjs`** under `scripts/`. The split of those 261 between S1 and S2 is **not**
yet computed.

## Known positive and control — a real pair, same file, two revs

Not hand-typed. Both are slices of real instrument source, differing in exactly the property:

* **KP** — `0e8bc9ac:docs/research/unit-464vac-2026-10-31/grade-cure.mjs`:
  `git('log', '--format=%H', '-5', '--', MY_DIR_REL)` → must classify **`RECENCY`**.
* **CONTROL** — `a901f189:` the same path, after his repair:
  `git('log', '--format=%H', '--reverse', \`${BASE_REV}..HEAD\`, '--', LIVE_REL)` followed by
  `git('rev-parse', \`${first}^\`)` → must **not** classify `RECENCY`; must reach `PARENT`.

The pair is sharp on purpose. Both revs call the same helper with the same subcommand and both
produce a baseline rev; a detector keyed on "a `git log` that yields a rev" flags both and
grades nothing. **The control is what makes the KP mean something** — and because the control is
*the cure*, a detector that cannot separate them is measuring authorship, not the property.

Both calls go through a one-line `git(...)` helper, not `execFileSync` at the call site, so the
extractor has to reach a **wrapped** call. That is `P4` below.

## Predictions, registered before any measurement

* **P1** — at least one `RECENCY` span exists in a **Theseus-authored** unit directory. (His
  claim is that the population is mine as much as his; if my seat has none, that claim is wrong
  about my half and I say so.)
* **P2** — the KP/control pair separates: KP → `RECENCY`, control → not `RECENCY`.
* **P3** — **the raw `RECENCY` count substantially overstates the defect class.** Most
  recency-keyed git calls in instruments stamp the drive's own rev or read recent history for
  display, which is harmless; the harm needs the derived rev to be used as a **baseline for
  comparison** (fed to `git show <rev>:path`, or stored as a pre-state). Registered
  quantitatively: **fewer than half** of `RECENCY` spans will have a baseline-consumer in the
  same file.
* **P4** — an adjacency pattern of the kind I would reach for first (`execFileSync` /
  `spawnSync` / `execSync` within a short window of the subcommand literal) **fails to reach the
  KP**, because the KP's call is wrapped. Registered as: adjacency reaches the KP = **no**,
  span extractor reaches the KP = **yes**.

## Gates

* **`GKP`** — KP classifies `RECENCY` and control does not. A detector that fails either leg is
  reported as unable to measure, and no population figure is published from it.
* **`GREACH`** — every file in S1 ∪ S2 is either parsed or recorded as a named refusal. A file
  the extractor silently drops is a blindness, and `catch { continue }` is not permitted: an
  unparseable file counts as `REFUSED` in the published denominator.
* **`GCRIPPLE`** — `--cripple=recency-blind` (drop the count-selector rule) must take the KP
  off `RECENCY`, and the published figure must **move**. A cripple that leaves the figure where
  it was grades nothing.
* **`GSELF`** — this unit's own `.mjs` files are **excluded** from both surfaces and the
  exclusion count is printed. An instrument does not census its own source.
* **`GHAND`** — every `RECENCY` span in S1 is hand-read and the hand verdict is published
  beside the detector's. The population is small enough that hand reading is primary and the
  detector grades the hand read, not the reverse.

## Declared limits, before the fact

* The consumer leg in `P3` is **file-scoped**, not dataflow. A file that derives a recency rev
  and compares against a baseline it got some other way will be counted as a consumer when it
  is not one. This over-reports, and the direction is declared here so the figure is read as a
  **ceiling** on the defect class, not an estimate of it.
* No instrument in any other unit directory is driven, edited, or re-stamped by this unit.
  Where I need a prior recording's content I read it with `git show` at a pinned rev.
* The live checker is not edited. The standing cell is not driven and not edited.
* Nothing in this unit bears on xian's stop/re-scope call, and `T2b`'s countdown is not re-read
  this fire and will therefore not be restated.

— Theseus
