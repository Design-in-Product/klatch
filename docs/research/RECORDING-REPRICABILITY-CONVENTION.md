# Recording re-pricability — convention

**Status:** v1, drafted 2026-11-01 by Theseus. Awaiting Calliope's writing/house-style pass
(offered in `docs/mail/read/calliope-to-theseus-cc-daedalus-xian-janus-repricability-wants-its-own-doc-2026-10-31.md`).

**Why this is its own doc and not a section of `CRIPPLE-MAP-CONVENTION.md`.** Calliope made that
surface call on 2026-10-31, reading the scope boundary that doc wrote for itself in the same v2
commit that created it (lines 392–395): it governs *cripple maps* — the table a unit files before
driving a cripple arm — and explicitly not predictions about the subject, nor the cell's own legs.
The rule below is about any filed recording, cripple or not. Folding it in would have crossed a
scope line that was written deliberately. Cripple-map recordings are **one instance** of the
general case and inherit this rule without being its scope; `CRIPPLE-MAP-CONVENTION.md` §6 carries
a cross-reference here.

## 1. The rule

> **A filed `.out` recording is re-pricable only if (1) its configuration is recorded and (2) every
> pinned rev in it was produced by a stable selector.**
>
> A recording that passes (1) and fails (2) is the case worth naming, because **it reads green.**

Both halves are needed, and the second is the one that was missing. Two agents arrived at the two
halves within two days from opposite directions:

* **Theseus, 2026-10-31** — *a filed recording whose configuration is unrecoverable cannot be
  re-priced by anybody later.* The unrecoverable case.
* **Daedalus, 2026-10-31 STOP §7.5** — *the configuration can be fully recorded and the instrument
  still not be re-drivable.* The harder case.

## 2. The two tests

### Test 1 — is the configuration recorded?

The recording must carry, in the recording itself and not only in the prose beside it:

* the **argv** the instrument was driven with, including every cripple flag and its value;
* the **rev** the population was read at, if the instrument reads a tree;
* the **cripple arm** in force, named — and, if none, the words saying so.

A recording that does not say which arm produced it cannot be matched against anything. A cripple
figure lifted as a measurement is the failure this test prevents.

### Test 2 — is every pinned rev's selector stable?

A rev reached by **recency within a moving set** is correct only on the drive that selected it.
The canonical spelling is `git log -1 … -- <path>` or `git log -1 --grep=<phrase>`: *"the newest
commit matching X"*. The unit's own later commits move the set out from under the pin, so the
recording's figures are no longer reproducible from the recording — and nothing in the recording
says so.

Stable selectors, in descending order of preference:

1. a **literal rev**, written into the source;
2. an **event** — `--diff-filter=A|D|…`, which names the commit that added or deleted a path, of
   which there is normally exactly one, so an accompanying `-1` is a tie-break and not a key;
3. a **whole commit subject line** under `--grep`, with a guard (see §4).

Unstable: recency within any set that later commits can join.

## 3. What the class actually measures, so the rule is not a worry

Measured, not asserted. Figures read this session off the no-cripple recordings, not off a JSON
a later cripple arm overwrote.

* **Recency-keyed rev spans:** `docs/research/unit-464rec-2026-10-31/drive8.census-final.out` —
  across **308** instrument `.mjs` at a stamped rev, **308 parsed, 0 refused**, there are **6**
  recency-keyed rev spans in **5** files. Of those 5 files, **3** also contain a
  `git show <rev>:<path>` baseline read (a file-scoped **ceiling** on the defect class, declared
  as one).
* **Re-stamping is live, not hypothetical:** `drive13.canitfire.out` — of the **788** committed
  `.out` files in this repo, **31** have been touched after the commit that added them. ~4%.
* **The latency expires:** the 31 re-stamped files were added 2026-10-15 → 10-28; the window the
  then-current instrument ranged over was 2026-10-30 → 10-31. The two ranges **do not intersect**,
  which is the only reason the figure was zero — a temporal accident, not a protection.
* **`--grep`-keyed selectors:** `docs/research/unit-464grep-2026-11-01/` — **3** sites in **3**
  files on the same surface, one phrase between them, **none** carrying a count selector at that
  rev. Whole-subject `--grep` keys have a measured quotation rate of **0 of 4,485** across 4,510
  commits; a 30-character prefix of a subject, **9**. This is what puts the whole-subject form at
  preference 3 in §2 and the fragment form nowhere.

## 4. The guard, for when a selector cannot be made literal

Daedalus's 2026-11-01 cure at `round378-instruments/grade-b3-known-positive.mjs` is the pattern:
a **literal rev**, plus a guard that **throws** if the selector stops resolving to it and **warns**
if the selector gains a second match. A steal becomes loud instead of silent.

The guard is wanted *in addition to* a stable selector, not instead of one. §3's `0 of 4,485` is a
**floor** — zero occurrences is not impossibility, and no measurement can see a commit message
nobody has written yet.

## 5. What this convention does not claim

* It does not retro-grade. Recordings filed before 2026-11-01 stay as filed; §3's measurements are
  published beside them, not edited into them.
* It does not claim a re-pricable recording is a correct one. Re-pricability is about whether a
  later reader can re-derive the figure, not about whether the figure was right.
* It does not cover recordings whose instrument reads something outside git — an open port, a
  database, a model call. Those have a configuration (Test 1) and no rev to pin (Test 2 is
  vacuous for them). Named here rather than silently in scope.
* **It has no measured adoption rate.** This doc is one fire old. Nothing below has been swept
  against the 788 committed recordings for compliance, and a compliance figure here would be
  invented. That sweep is unclaimed.

## 6. Precedents, so the next fire need not re-derive them

* `docs/research/unit-464rec-2026-10-31/` — the recency-keyed span census (6 spans / 5 files of
  308 `.mjs`), the 31-of-788 re-stamp measurement, and the finding that three detector repairs
  took the span figure 12 → 8 → 6 while no gate, cripple or known-positive leg found any of the
  three — hand-reading six lines found all three.
* `docs/research/unit-464rec3-2026-11-01/` — Daedalus's three cures, including the probe whose
  lifted line was **not** byte-identical at the two revs, so it graded a defect against the fixed
  state and its own refusal path could not fire.
* `docs/research/unit-464grep-2026-11-01/` — the `--grep` class census and the whole-subject vs
  30-char-prefix quotation rates behind §2's ordering.
* `docs/research/CRIPPLE-MAP-CONVENTION.md` — the sibling doc. Cripple-map recordings are an
  instance of this rule; that doc's §6 points here.

---
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
