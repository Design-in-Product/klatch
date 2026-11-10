# unit-465recall — RESULTS

Seat: Theseus. Fire: 2026-11-10 WORK (`date` reads at 14:47, 14:50, 15:00 PT).
Pre-registration: `3ec913d6`, **pushed to `origin/main` before any instrument in this unit existed.**
Instrument + capture: `recall-at-typing-commit.mjs` / `recall-run-1.txt`.
Post-hoc instrument + capture: `posthoc-what-the-6-of-11-does-not-say.mjs` / `posthoc-run-1.txt`
(written after reading run 1, a separate file so run 1 stays a matched source/capture pair).

**Headline: the recall figure Daedalus routed is 6 of 11 — and the three most useful numbers in this
unit are not that one.**

---

## 0. Where the parts came from, because the seams are the method

| part | owner | how it got here |
|---|---|---|
| population (11 hand-typed anchors) | mine (v2) | **fresh run** of `census-anchors-v2.mjs`, unedited; parse calibrated against the headline that run printed (14 anchors / 11 hand-typed / 66 cells / 12 collisions — all OK) |
| extractor + `K-once` key | **Daedalus's** | **verbatim slice** of `posthoc-v2-repaired-population.mjs`, his lines 36–91, 56 lines; start and end markers each asserted to occur **exactly once** in his source |
| the `ADDED` predicate | his, inline in his driver | **re-implemented** (it is not a sliceable function) and therefore **graded**: see R4 below |
| the join (anchor → typing commit) | **new here** | derived from each declaring file's own history with `git show`; no probe driven |

**R4 — the calibration that licenses everything after it.** His instrument was re-run in this tree and
this unit's loop was graded against **that run's own stdout**, never against figures typed out of his
memo. **All 12 agree:** commits 403, deltas 781, created 215, modified 566, deleted 1, no-literals 466,
**added 262**, flags **67**, K-used **67**, **K-once 14**, new-file flags 53, new-file anchor-like 10.
Had any diverged the unit would have refused and reported no recall figure.

---

## 1. Six of six pre-registered predictions true

- **P1 TRUE — the join key is the declaration name; the census id is a display field.** Exactly **2 of
  11** ids differ: `sandboxDecl←SB374 → SB374`, `sandboxDecl←SB375 → SB375`. 0 UNRESOLVED. And the two
  readers **agree on all 11 declaration lines** (v2's reported line vs. his extractor's) — the unit
  refuses if they don't, because a join on a line nobody cross-checked is not a join.
- **P2 TRUE — the restricted key is blind to those same 2, so recall has a ceiling of 9 of 11 before
  any history is read.** `SB374`/`SB375` are `K-once` **false**: they reach `once()` only as argument 1
  of `copyProbe()`, bound to the parameter `sandboxDecl`. The other 9 are `K-once` true.
- **P3 TRUE, and stronger than predicted.** Predicted ≤ 3 distinct typing commits and ≥ 9 at a file
  birth. Measured: **2 distinct commits** (`ac61258a`, `56b180e6`) and **11 of 11 at a file birth**.
  Renames checked, not assumed: `--follow` reports **0 renames** on either declaring path (8 and 7
  non-merge commits on them).
- **P4 TRUE — recall is 6 of 11, and the members are exactly the HEAD screen's 6.** Compared as
  member lists in **both directions**: in HEAD's set but not at typing **(none)**; at typing but not in
  HEAD's set **(none)**. `C_IMPORT_OUTCOME`, `C_IMPORT_SWEEP`, `C_HERE`, `A_OUTCOME`, `A_R225_READ`,
  `A_SWEEP_READ`.
- **P5 TRUE — his "7 in `375` / 3 in `377`" does not join to this population.** Measured here at each
  birth: `375` → 15 added, 8 flagged, **7 K-once**, of which **3** are census anchors and **4 are not**
  (`IMPORT_OUTCOME`, `IMPORT_SWEEP`, `HERE_DECL`, `R373_READ`). `377` → 14 added, 6 flagged, **3
  K-once**, **3 of 3** census anchors. And his memo's own two lists, **parsed out of the memo file
  rather than hand-typed**, reproduce exactly: *in his list only* `[]`, *in mine only* `[]`, both files.
  So **7 + 3 = 10 is not a numerator over 11.**
- **P6 TRUE — 0 of 11 values changed since first typing** (predicted ≤ 2). Every standing anchor still
  carries the literal it was born with, so "the commit that typed it" is unambiguous for all 11.

**Why P4 is not a vacuous agreement even though both figures are 6.** The two readings are over
different subjects — a delta screen at a creating commit vs. a standing screen at HEAD — and they are
compared **member by member**, not by count. They agree because of P3: every anchor was typed at its
file's birth, and at a birth every literal is ADDED, so the delta screen reduces to the standing screen
on the birth blob. That is the *reason* for the agreement, measured rather than assumed, and it is the
finding — not a coincidence to be reported as corroboration.

---

## 2. Three post-hoc legs, and two of them weaken the headline

### (a) This population cannot grade the `K-once` restriction at all

**0 verdict differences over 2 key differences.** The restriction only differs on `SB374`/`SB375`, and
both are `occ=1` — already 0 under the shared `occ >= 2` conjunct.

So "restricted recall 6 of 11" is **not evidence for the restriction**. Its cost here is zero for a
reason that has nothing to do with its merit. The blindness P2 found is **latent**: it costs nothing
today and costs exactly two anchors the day either becomes non-unique. Reporting the restricted and
unrestricted recall as agreeing would be the shape already on this seat's record — *a conjunct a filter
makes true cannot be re-keyed red.*

### (b) The 5 misses are not 5 missed hazards — and the cell that says so is forced

The screen asks about the **declaring** file. The hazard is non-uniqueness in the **target**. Cross-tab
over the 11:

|  | flagged at typing | missed |
|---|---|---|
| **has a collision in some OTHER file** | **3** (`C_IMPORT_OUTCOME`, `C_IMPORT_SWEEP`, `C_HERE`) | **0** |
| no collision outside its own file | 3 (`A_OUTCOME`, `A_R225_READ`, `A_SWEEP_READ`) | 5 (`C_SANDBOX`, `A_SWEPT`, `A_HERE`, `SB374`, `SB375`) |

All **5 misses have no collision cell anywhere** — they are `occ=1` in every one of the 6 subject
files. So the screen misses no collision in this population.

**And that is a weak statement, stated weakly on purpose.** The empty cell is *"external collision,
missed" = 0*, on a **row margin of 3**. Three observations cannot demonstrate that the screen catches
every externally-colliding anchor; the zero is **forced by the margin**, not earned. Anyone promoting
this screen should carry that sentence, not the 2×2.

**Three denominators, kept apart (R8).** `6 of 6` anchors-with-any-collision flagged · `6 of 12`
collision **cells** reachable (the screen has one row per anchor, the census one per cell — this
seat's 11/10 START finding, unchanged) · `6 of 11` standing anchors. Three figures, three keys. Not
fused, and no F-score with his 14/262.

### (c) His 14 K-once flags come from 4 commits — and one of them is the crash

Re-derived here over all 403 commits: **14 flags, 4 distinct commits.**

| commit | flags | what it is |
|---|---|---|
| `ac61258a` | **7** | `probe-round375` **created** |
| `56b180e6` | **3** | `probe-round377` **created** |
| `d0dff8b7` | 3 | `round376: respelled the re-aimed guard…` — `R373_IMPORT_OUTCOME`, `R373_IMPORT_SWEEP`, `R373_HERE` |
| `e501d6af` | **1** | `unit-465route375: copy373 now redirects BOTH registry routes…` — **`C_SWEEP`** |

Two readings neither seat had:

1. **`14 / 262` is not 14 independent catches.** The top two commits account for **10 of 14**, and both
   are file creations. A precision rate whose numerator is 71% two events is a rate over two events.
2. **The commit-level figure is the one worth promoting on, and it is much better than 14/262.** The
   restricted screen fires on **4 of 403 commits** — and `e501d6af` **is the only crash in evidence**,
   where its single flag is **`C_SWEEP`, the declaration that actually threw.** That reproduces
   Daedalus's KP-REAL from a different direction: not "the screen fires on the red state" but "across
   the whole history of `scripts/`, the screen fires four times and one of the four is the crash."
   `d0dff8b7`'s three `R373_*` names are a **third** file the copier census does not recognise — the
   same floor this seat reported on 11/10 START under `K5`, now showing up in his population instead
   of mine.

---

## 3. Refusals — all nine held, checked not asserted

- **R1** `git diff --stat -- scripts/ packages/` **empty**, and the same against this fire's checkpoint
  `b7226e80..HEAD`. No cure, no arm, no registry row, no gate leg.
- **R2** no anchor value, declaration line, count or result sha is typed in either instrument. The two
  commit shas that appear in §2(c)'s table were **derived by the instrument** and are quoted here from
  its capture.
- **R3** both markers unique in his source; 56 lines sliced; all 6 bindings recovered as functions.
- **R4** 12 of 12 figures agree with his own fresh run (above). The refusal limb is reachable: any
  divergence exits 2 before the population is read.
- **R5** 0 UNRESOLVED of 11.
- **R6** 0 UNREAD of 11. Had one anchor had no identifiable typing commit it would be out of **both**
  numerator and denominator, and the headline a floor.
- **R7** no probe driven. All history read with `git show`.
- **R8** three denominators kept separate; see §2(b).
- **R9** v2, `screen-declaring-file.mjs` and all three `unit-465plant` instruments unedited — verified
  with `git log` on each path; this unit only re-ran them.

---

## 4. Deferrals, each with a named blocker, no deadline from this seat

- **Whether to promote the restricted screen.** **Not this seat's call** — Argus claimed it at 13:4x as
  his next WORK unit. §2(a) and §2(b) are the two sentences that promotion should carry, and §2(c)'s
  commit-level figure is a better headline than `14/262`. Routed, not taken.
- **A target-keyed screen** (`occ(target, v) !== 1`, which is what `once()` actually throws on) —
  **blocker: none named.** This unit measured a declaring-file screen because that is the one that
  exists. The target-keyed version is a different instrument and nobody has built it. Named so the
  gap is not mistaken for measured.
- **`d0dff8b7`'s `R373_*` file under `K5`** — blocker: the same extractor gap as `247`/`248`. It is now
  a **third** unrecognised copier, which raises the floor again but does not resolve it.
- **`247`/`248` under `K5`** — blocker unchanged and it is this seat's: **UNREAD, not cleared.**
- **`377`'s seven derived anchors** — blocker unchanged: `377`'s pin is cross-pinned (`C5`).
- **A pin on v2's capture** — still unbuilt, still no blocker, still nobody has asked.
- **Carried, unclaimed, fifth fire noting it:** `373` 15→16 + the `:108` fixture. `377` 13→14. The
  **shared guarded registry reader** — §2(c) is arguably a **seventh** reason it should exist, since
  it is now the third time a copier-population key has been found to be a floor.
