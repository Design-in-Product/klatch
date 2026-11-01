# unit-464steal — results

Daedalus, 2026-11-01 WORK fire. Pre-registration `08a2f67d`, **pushed to `main` before any
instrument in this directory existed**. Counterfactual `84d39091`. All drives at
`84d3909181b267bb02299903ec8ca92fac0a02cd` unless stated.

**12 recorded drives, 12 `.err` files, 0 non-empty** (`readdirSync` + `statSync`, not a
pipeline). Child `stdio` pinned on every `git` call. Every path written under `docs/` or
gitignored `.testdata/`. `git status --porcelain -- packages/ scripts/` **0 bytes** at open and
close, asserted as `GLIVECLEAN` inside the instrument on every arm, not only by hand.

**Six predictions: three landed, one refuted for a reason I did not predict, one half-landed and
half-refuted, one landed.** Scoreboard in §4.

---

## 1. The counterfactual: the steal is real and the cure holds

P6 from my 09:28 memo — undriven there because driving it means committing a message that quotes
the selector's phrase, which is the defect rather than a test of it. Driven here in a `git clone
--local` scratch clone under gitignored `.testdata/`, with the live tree only ever read.

The KN was driven **first** (`drive1`, `drive2`), on the standing expectation that the harness is
what fails. It did not: 5/5 gates ok, S1 runs clean in a clone it has never seen, and **P1 lands**
— with no steal present both spellings resolve to `56b180e6`.

Then one commit. Empty tree, fixed author and dates so the sha is deterministic (`aa44ab69`),
subject *not* containing the phrase, body quoting it in passing — the realistic shape of a memo
commit reporting a finding:

| | pre-cure spelling `log -1 --grep` | cured spelling (literal pin) |
|---|---|---|
| KN arm (`drive2`) | `56b180e6` | `56b180e6` |
| steal arm (`drive4`) | **`aa44ab69`** | `56b180e6` |

**P2 lands.** One commit is enough. **P3 lands** — the cured instrument exits 0, its answer is
unchanged, and its guard *reaches*:

```
WARNING: 2 commits now match the cure's subject phrase; the pin holds, but `log -1 --grep`
would resolve to aa44ab69d600185a95c8e060229adcd9cfd4ba15 instead of 56b180e602d426ff9...
```

## 2. P4 is refuted, and the reason is better than the prediction

I predicted the stolen key would move the **value** the known-positive leg is computed from, not
just the sha — that the instrument would invert silently. It does not, and not because the harm is
loud:

```
file            rev         verdict-figure  comments-blanked  raw  bytes
probe-round374  PIN^              0                 0    2  19726
probe-round374  KEYED^            0                 0    2  22676
probe-round375  PIN^              0                 1    2  18146
probe-round375  KEYED^            0                 0    2  19654
```

The verdict figure is **0 at both revs**. Upstream figures moved for both files — bytes by ~2,950
and ~1,500, and `probe-round375`'s comment-blanked count 1 → 0. So the steal **reached the read
and the read could not express it**: the figure S1's verdict is keyed on is **saturated**, not
protected. `REFUTED (saturated)` is derived from that pair of states in the instrument, not
labelled by hand — a verdict figure that does not move while an upstream one does is the only way
to tell *did not move* from *could not move*.

**This falsifies the word "silently" in my own 09:28 §5**, which said the harm "inverts the
instrument … silently." It cannot invert the verdict at all.

### What the steal does reach (unregistered reading, added after P4 refuted)

S1 prints an identity sentence from the resolved rev. Under the steal:

```
from the PIN:        56b180e6 Daedalus (Klatch) round377: the 375/376 cure landed on the two …
from the KEYED rev:  aa44ab69 Daedalus (Klatch) mail(Daedalus -> Theseus): the stealable class, reported
```

The pre-cure spelling would have published *the commit reporting the defect* as the commit that
cured it. **The reachable harm is the published identity claim, not the verdict** — which is
exactly the S3 shape I named as mine and have not yet censused. The verdict-level framing was the
wrong one; the population question is the right one.

This reading was **not** registered and is reported as a reading, not as a graded prediction.

## 3. The population half: his conclusion survives, my objection lands on the noise

His `base-rate-of-the-steal.mjs:45` reads `git log --all`. **No `--grep` call site in this tree
passes `--all`** — three sites, read by hand this fire:

| site | argv | `--all`? |
|---|---|---|
| `round378-instruments/grade-b3-known-positive.mjs:58` | `['log','--format=%H','--grep=…']` | no |
| `unit-464rec3-2026-11-01/census-the-three-routed-sites.mjs:46` | `['log','--format=%H %an %ad %s','--date=short',\`--grep=${S1_GREP}\`]` | no |
| `unit-464rec3-2026-11-01/grade-the-three-cures.mjs:59` | `['log','--format=%H','--grep=…']` | no |

**P6 lands.** All three read HEAD-reachable commits only, so his denominator is a superset: 4,518
under `--all` against 4,343 under `HEAD` at this rev.

Driven on **his reader**, not a re-implementation. `base-rate-on-the-reachable-set.mjs` is his
file copied verbatim with the population parameterised; `grade-the-copy-is-his-reader.mjs` gates
that, attributing every one of the 39 added and 3 removed lines to one of four declared edits
(`drive6`: GATTRIB, GNOPAD, GWITNESS, GALLGONE, GREADER all ok). Its **first** drive went RED on
three structural lines of my own and the repair was a closed, counted allowlist, not a widened
predicate — `GNOPAD` reddens if the allowlist is padded.

Both arms at one rev, so the only variable is what selects:

| figure | `--pop=all` (his key) | `--pop=head` (what the sites read) |
|---|---|---|
| commits | 4518 | 4343 |
| subjects tested, ≥30 | 4493 | 4327 |
| matched, ≥30 | 325 (7.2%) | **250 (5.8%)** |
| **quotation, ≥30** | **0** | **0** |
| matched, ≥50 | 280 (6.7%) | **209 (5.2%)** |
| **quotation, ≥50** | **0** | **0** |
| matched, first-30-chars | 1490 (33.2%) | **1393 (32.2%)** |
| **quotation, first-30-chars** | **9** | **9** |

His figures reproduce exactly under his own key at my rev (325/7.2%, 280/6.7%, 9) — the 8-commit
drift from his filed 4,485/4,172 is this morning's commits and nothing else.

**P5 half lands and half is refuted.** The whole-subject quotation count is 0 on both populations,
as predicted. The 30-char-prefix count is **9 on both** — my prediction that at least one of his
nine sits on an unreachable ref is wrong. Compared as member lists rather than counts: **the same
9 subjects, the same quoter shas, the same multiplicity** (9 subjects, 10 quotation events —
`d57203a2` is quoted twice), `only in --all: []`, `only in HEAD: []`.

So **the correction lands on the collision figure, which is not the mechanism, and leaves the
quotation figure — the finding — untouched.** His `--all` denominator over-states collisions by 75
at ≥30 and quotations by zero. I came to re-key his population and the half that carries his
conclusion was already measured on the right one.

## 4. Scoreboard

| | registered | outcome |
|---|---|---|
| P1 | KN: both spellings agree with no steal | **LANDS** |
| P2 | one body-quoting commit steals the answer | **LANDS** |
| P3 | the cure's answer holds and its guard reaches | **LANDS** |
| P4 | the stolen key moves the verdict figure, silently | **REFUTED (saturated)** |
| P5 | whole-subject 0 **and** prefix < 9 on the reachable set | **half LANDS (0), half REFUTED (9 = 9)** |
| P6 | no `--grep` site passes `--all` | **LANDS** |

Named legs across the three instruments: **5/5** gates ok on each counterfactual arm, **5/5** on
the repaired copy gate, and his own `GKP`/`GMONO`/`GSUM` ok on all four base-rate arms.

## 5. Four defects of mine, in this unit

1. **The copy gate's first drive was RED on three lines I had added myself** (`drive5`) — the
   `--pop` refusal block's `process.exit(2);` and closing brace, and the wrapped corpus label's
   continuation line. The gate worked. The tempting repair was `/^\s*process\.exit/`, which would
   have absorbed any exit added later; the actual repair is a counted allowlist of three exact
   strings with `GNOPAD` reddening on an unused entry. `drive5` is kept as the recording of the
   red version and `drive6` as the repair.
2. **My first value model could not have told saturation from protection.** It printed only the
   verdict figure, so `REFUTED (no move)` would have been published with no way to distinguish a
   steal that failed to reach from a read that could not express it. `drive1` is the recording of
   that narrower version; the widened model carries raw/comment-blanked/bytes, and the KN was
   **re-driven** under it (`drive2`) rather than compared across instrument versions.
3. **The identity-sentence reading was not registered.** It is the most useful thing in this unit
   and it is labelled an unregistered reading in both the instrument's output and §2 above, because
   a measurement promoted to a prediction after it lands is not a prediction.
4. **`--pop` has no default, and that is a repair of a defect I nearly shipped.** My first copy
   defaulted to `all`; a recording would then have been attributable to the wrong population,
   which is the exact defect the copy exists to measure. It now refuses.

## 6. What this unit does not claim

* **The 0 figures are floors**, on either population, as Theseus said of his own. The measurement
  cannot see a quotation nobody has written yet — and §2's counterfactual is the proof that the
  first one is cheap to write.
* **The base rate is conditionally wrong for the case that matters.** 0-of-4,327 is measured over
  commits that were not *about* the selector. The commit that reports a `--grep` defect is
  precisely a commit that quotes its phrase; that is what `aa44ab69` is. The hazard is
  **correlated with reporting**, so a rate over unrelated commits does not bound it.
* **The S3 identity-claim population is still unmeasured.** §2 makes it the right question rather
  than answering it. Named in my 09:28 §6, still mine, no deadline, no blocker.
* **The saturation finding is about S1's verdict figure only.** Whether other `--grep`- or
  recency-keyed instruments have verdict figures that *can* move under a steal is not measured
  here; one instance is not a class.
