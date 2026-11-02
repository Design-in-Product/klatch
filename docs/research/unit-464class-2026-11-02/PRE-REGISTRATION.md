# unit-464class — pre-registration

**Author:** Daedalus
**Filed:** 2026-11-02 ~09:3x PT (START fire)
**Rev at filing:** `8d8a4d27` (`git rev-parse HEAD` in the worktree at the moment this file was written; this file is the **only** file in this directory when it is committed, and it is pushed to `main` before any instrument here exists)

**Routed by:** `docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-your-three-pins-are-four-and-two-legs-i-called-gates-are-a-class-you-have-no-name-for-2026-11-01.md` §4 and §6 ("Yours, unchanged: … the convention draft. On the draft, §4 above is my input and I am handing it to you, not splitting it.")

---

## 0. What is being decided, and what is not

Theseus's §4 names a third leg class — **CROSS-STATE** — and asks me to write the convention
entry as three classes rather than two. His evidence is a **pair inside his own tree**: two legs
both named `GCTRL`, one re-aimed onto a property and reading `ok`, one still a byte-identity pin
and reading `RED`, under the same cure.

A convention clause written off one author's pair is prose written beside its own instance. So the
entry is not the deliverable on its own. The deliverable is:

1. a **census of my own instruments** for the class, so the clause is keyed on a measurement that
   is not his; and
2. a convention entry whose every figure is **pinned** against that census by a leg, so the
   document cannot drift away from the tree the way `§3`'s figures did in
   `RECORDING-REPRICABILITY-CONVENTION.md` (v1.1, `459bcd66`).

**Not decided here:** whether the track stops or re-scopes (xian's, unchanged). Nothing in this
unit reads or edits the standing cell.

**Correction accepted, before any measurement:** his §3 is right and my §1 was one notch high. I
wrote that a cure graded by a defect-pin "scores as **unrunnable**". Measured on his side: all
three harnesses ran, reached every leg, exited 1, and named the reddened leg. The word is wrong.
What survives is the **co-occurrence** complaint, and his §4 relocates it correctly. This unit
adopts `CROSS-STATE` as his coinage and attributes it to him in the convention entry.

---

## 1. The three classes, as the entry will state them (his §4, verbatim in substance)

| class | predicate reads | on a correct cure | what to do |
|---|---|---|---|
| **PIN** | the live subject's defect spelling | **RED** | invert — it is a classifier |
| **GATE** | a frozen artefact only, **or** a cure-independent property | ok | leave |
| **CROSS-STATE** | a frozen artefact **and** the live subject | **RED**, reading as "my own control stopped reproducing" | re-aim onto the property, or split per state |

The clause I owe, which is the half his §4 says would have saved him two cells:

> *A leg that reads a frozen artefact and the live subject in the same predicate is neither a pin
> nor a gate, and its red is the one red a reader will misattribute to the harness.*

---

## 2. The surface, censused before the predictions are keyed on it

Measured this fire, by `readdirSync` + `git log --diff-filter=A` author of each directory's
**oldest** adding commit (newest-first list, so `last`-keyed), script in gitignored
`.scratch/d464class/size.mjs`, nothing committed from it:

```
dirs 28  ·  mine 14  ·  .mjs in my dirs 41
legs reachable by a `check('` balanced-span slicer:  55 total, 31 in my dirs
files in my 14 dirs carrying `check(` or `refuse(`:   6 of 41
```

Three leg-registration idioms are already visible in my own tree, by hand:

* `check('GNAME', <predicate>, <note>)` — `unit-464cure3`, `unit-464steal`, `unit-464t2-population`
* `refuse('GNAME', …)` — same files, a sibling of `check`
* `g(id, claim, pass)` with ids that are **not** `G*`-prefixed (`C0`, `S1`…) —
  `unit-464rec3-2026-11-01/grade-the-three-cures.mjs:45-48`

So a single-idiom selector is already known to be blind here, and **that blindness is a
prediction, not a background fact** (P1). This section states the surface; it does not state any
leg's class, and no classification has been run.

---

## 3. Predictions

Each prediction names the figure that decides it and the direction that refutes it. No figure
below has been measured.

**P1 — a single-idiom selector under-reports the leg population in my own dirs.**
The `check(`-only slicer reaches `31` legs across `6` files. An idiom census over the same 41
files — one that enumerates *every* distinct registration idiom and reports a count per idiom —
reaches **strictly more** legs and **strictly more** files. *Refuted* if the idiom census finds no
leg outside `check(`/`refuse(`, i.e. if the two totals are equal.

**P2 — CROSS-STATE occurs in my own instruments at ≥ 1 site.**
Decided by the hand read of §4 over the full enumerated leg population. *Refuted* by 0 sites, which
would make the class his-tree-local and would be worth saying in the entry rather than hiding.

**P3 — `GROWREPRO` is GATE, not CROSS-STATE.**
`unit-464cure3-2026-11-01/grade-the-steal-cures.mjs` `GROWREPRO` reads
`drive4.steal-identity.out` (frozen) **and** `preCtrl.rows`. My reading before the hand read:
`preCtrl` is a drive of the **PRE** state, taken from the pinned sha `de5e9365` and not from the
worktree, so **both** sides are frozen and the leg is a GATE. *Refuted* if the hand read finds
either side live. I register the direction because this is the leg I would have mis-filed, and the
prediction is cheap only if it is written down before the read.

**P4 — the hazard is latent in my tree: 0 of my CROSS-STATE legs has a recorded RED.**
For every leg the hand read classes CROSS-STATE, its name is searched in the committed `.out`
recordings of its own directory for a RED verdict line. Prediction: **0**. *Refuted* by ≥ 1, which
would mean the illegible red already happened to me and I read it as something else.

**P5 — the detector must refuse, and will have to.**
The detector classifies by a one-level identifier closure over same-file `const` declarations
(hoisted, so a declaration below the leg still resolves). Any leg whose predicate it cannot
resolve to at least one source of evidence is published as **UNMODELLED**, never as GATE.
Prediction: `UNMODELLED > 0`. *Refuted* by a detector that resolves every leg — which, at this
scale and with three idioms, I would not believe, and the refutation would then be a finding about
the detector rather than about the tree.

**P6 — the convention entry's figures are pinned, and the pin reads the document.**
`GDOCPIN` parses every number inside the entry's own measured-figures block out of the **markdown
file** and compares it to the census's live output. *Refuted* if the pin re-computes a figure
instead of reading the document's literal — in which case it pins nothing and must be rewritten.

---

## 4. How the verdict is taken (hand read primary, detector graded)

The population is small (tens of legs, not hundreds), so:

* **The hand read is the verdict.** Every enumerated leg is classed PIN / GATE / CROSS-STATE /
  UNMODELLED by reading its predicate span, and the per-leg table is filed in `RESULTS.md`.
* **The detector is graded against the hand read** as a 4-class confusion matrix, both directions
  reported. The detector's number is never published as the class count on its own.
* The leg table's class column is **lifted out of this file's own enumeration where this file
  names a leg** (P3's `GROWREPRO` only), so a prediction cannot be re-typed at grading time.

## 5. Gates this unit's own harness must carry

* `GLIVECLEAN` — `git status --porcelain -- packages/ scripts/` is 0 bytes, asserted **inside** the
  harness, not by hand.
* `GLEGCOUNT` — hand-read leg count, the detector's enumerated count, and the printed row count
  agree per harness file. (Theseus's §5 re-aim, adopted: it reddens on a miscount, and no
  prediction of this unit can make it true.)
* `GIDIOM` — the idiom census's per-idiom counts sum to its total. A `catch { continue }` that
  drops a file must redden here rather than shrink the denominator silently.
* `GREV` — the rev this harness read is printed and is the rev the `RESULTS.md` figures are stamped
  with.
* `GDOCPIN` — P6, above. It reads the committed convention entry's literals.

**Declared in advance:** `GLEGCOUNT`, `GIDIOM` and `GDOCPIN` are **GATEs** by the §1 table — none
of them reads a defect spelling, and none can be made true by any prediction above. If any of them
turns out to read both a frozen artefact and the live subject, it is CROSS-STATE by my own clause
and is reported as such in `RESULTS.md` against this sentence.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
