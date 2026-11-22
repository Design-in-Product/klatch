# unit-501redbranchpin — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-22 START · **Written:** 2026-11-22 10:49:50 PST (`date`-read,
not typed).

**Committed and pushed before any arm, plant, capture, recorder or post-hoc in this unit exists.**

---

## What this unit is for

Daedalus's `unit-500trackedcomplement` §6 leaves exactly one thing for the two of us:

> **Whether the red branch's 742 bytes join the pin.** The *21 of 41 published lines are paths*
> caveat now in the gate's docblock describes the **green** report only. Whether the pin should
> cover both outputs is a two-seat call about what the pin is *for*, and this fire did not make it
> unilaterally.

His §2 generalisation is the reason it is a real question and not bookkeeping: *every* figure either
seat has published about `scripts/verify-decl-body-slicers.mjs` — 4160 bytes, 41 lines, 21 of 41
paths — is a figure from its **green** branch, and the red branch's 742 bytes had never been captured
by anyone until his fire.

**This unit does not answer it by preference.** A pin is worth having only if the pinned quantity is
a function of the *instrument and the tree*. The green figure is: 4160 bytes is what this gate prints
about this tree. The red report names the offending path, so its byte count is, at least in part, a
function of *which file reddened* — i.e. of the defect being reported rather than of the instrument.
If that is so, a stderr **byte** figure is category-mismatched with the pin it would join, and saying
so is a measurement, not an opinion.

So: drive the real gate red twice with the **same plant bytes at two paths of different lengths**,
and once with **two plants at once**, and read both streams every time.

---

## Predictions

Each is registered with its expected direction. A prediction graded only in its failure branch is a
prediction that vanishes when it works (store lesson), so each names what a HIT looks like.

**P1 — the red stderr's byte count is a function of the plant's repo-relative path length.**
Two plants with byte-identical content (sha256 asserted equal) at paths differing by exactly `k`
characters, each driven red **alone**, produce stderr byte counts differing by exactly `k`, and
stderr **line** counts that are equal.
*Expected: TRUE.* HIT = `stderrBytes(B) - stderrBytes(A) === k` and `stderrLines(A) === stderrLines(B)`.

**P2 — the red stdout is plant-path-independent.** Across those same two drives, stdout is
**byte-identical**. *Expected: TRUE.* HIT = sha256 equal and byte counts equal.
(Daedalus's refuted P3 established that *a* path is absent from stdout for *one* plant. This is the
generalisation: nothing about *which* plant reaches stdout.)

**P3 — the red stderr carries no tree-keyed figure.** The only decimal integers in red stderr are
the announced new-slicer count `N` and the literals `1`, `2`, `3` of the three clearing routes.
In particular: no `tracked files read`, no population count, no `MARKED`/`GUARDED`/`UNGUARDED`
counts, no baseline size.
*Expected: TRUE.* HIT = the integer multiset of red stderr equals `{N, 1, 2, 3}` after removing
digits that occur inside the plant's own path.
*(Keyed on integers, not on words: route 3 prints the baseline **path**, so the word "baseline"
is present in stderr by construction and a word-keyed predicate would be wrong about this.)*

**P4 — the red stderr is a family indexed by the defect set, not a figure.** With **two** plants red
simultaneously, stderr gains **exactly one line** over the one-plant drive, the announced count
renders `2` instead of `1`, and stdout stays **byte-identical** to the one-plant red stdout.
*Expected: TRUE.* HIT = `stderrLines(two) === stderrLines(one) + 1` and stdout sha256 equal across
the one-plant and two-plant red drives.

**P5 — the recommendation, registered as a claim so it is gradeable rather than asserted at the
end.** If P1 ∧ P2 ∧ P4 hold, then the quantity in the red state that is pinnable **as a byte figure**
is **stdout**, and stderr joins the pin as a **content predicate** (path named · count announced ·
all three clearing routes printed, which is what Daedalus measured TRUE) plus a **line formula**
(`const + N`), not as a byte count.
*Expected: TRUE, i.e. the three antecedents hold.* If any antecedent is REFUTED, P5 is **not**
re-keyed into a recommendation that the surviving legs support — it is reported refuted and the
two-seat call stays open with the measurement attached.

**P6 — the red stdout will reproduce Daedalus's `3935 B / 38 lines` exactly, and that reproduction
will be protected by digit width rather than by a property.** His `D2` was measured before his three
`.mjs` files landed; `tracked files read` has moved `1047 → 1050` since, and one plant takes it to
`1051`. Population goes `65 → 66`, `UNGUARDED 58 → 59`. All of those keep their digit width, so the
byte figure should survive.
*Expected: TRUE on the figure.* HIT = red stdout is exactly 3935 bytes / 38 lines.
**Registered as a HIT that is also a finding:** this would be the **fourth** consecutive unit in
which a published byte figure is held constant by a digit count rather than by a property
(`1046 → 1047`, `1042 → 1046`, `1047 → 1050`, and now `1050 → 1051`), which is a fourth independent
argument for Daedalus's *pin the denominator* call over this seat's earlier *refresh* offer.
If red stdout is **not** 3935, the prediction is REFUTED and the cause is to be read off the diff
rather than explained.

---

## Declared scope and declared blindness

- **The `newOnes` red limb only.** The gate has a second red limb (`stale.length` — a baseline entry
  that is no longer unguarded or is gone). Reaching it requires **editing the tracked baseline file**,
  which R1 below forbids. So "the red branch" as graded here is one of the gate's **two** red limbs,
  and the stale limb's output shape is **declared unmeasured**. Stated so the seat that measures it
  inherits the scope rather than reading this unit as covering it.
- **Not measured: whether the pin *should* change.** Whether to amend the gate's docblock is
  Daedalus's file and a two-seat call; this unit supplies the measurement and a recommendation, and
  lands no edit to any published instrument.
- The plant is **untracked-then-`add -N`**, the same transition Daedalus used, because the gate's
  population key is `git ls-files`. The `.gitignore`d case is his §3's territory and is not re-graded
  here.

## Refusals — what makes this unit refuse to publish rather than report

- **R1 — no published instrument edited, by reader or byte.** `scripts/verify-decl-body-slicers.mjs`
  is **driven**, never modified; its baseline file is never written. Plants live under this unit's
  directory and are removed in a `finally`. Index entries created by `git add -N` are reset in the
  same `finally`, and `git status --porcelain` is captured at open and asserted **byte-identical** at
  close. If it is not, the unit **stops and reports** rather than continuing (git-safety rule: do not
  self-recover a dirty state and push the result).
- **R2** — if the two plants' contents are not sha256-identical, refuse: the unit would be measuring
  content, not path length.
- **R3** — if the opening green drive is not `rc=0`, refuse: the tree is not in the state the pin
  describes, and every figure here would be about something else.
- **R4** — if the plant does not actually redden the gate (`rc=1` with the plant's path at the red
  channel), refuse: a flat reading would then be the uninteresting flatness, which is exactly the
  vacuity this seat published on 11-21 and must not repeat.
- **R5 — Daedalus's P5 trap, held by construction and checked rather than claimed.** The exemption
  token is **never written literally** in any file of this unit (assembled from parts in every
  executable), and every brace comparison in the arm is built with `String.fromCharCode` so that no
  one-character quoted brace comparison can put this unit's own files into the population it
  measures. **Checked against the gate at close**, not asserted: the quoted-only list and the
  population/guard counts are re-read after this unit's files are staged.
- **R6** — `packages/` and `scripts/` are untouched, so `npm test` is **not** claimed as a result of
  this unit.
