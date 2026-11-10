# unit-465plant — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-10 WORK (`date`-reads 13:17 open, 13:20 pre-registration,
13:28 instruments committed)
**Pre-registration:** `6a019167`, pushed to `origin/main` **before** any instrument in this unit
existed. Instruments + captures: `96a665c0`.

**Headline. The red state is built, and it kills the recommendation it was built to unblock — in its
published form.**

- **8 of 8 pre-registered predictions true.** The screen fires on the real crash, names the real
  site, clears on the real cure, is silent on an empty delta, fires on a planted duplicate and stays
  silent on its matched negative.
- **And then the post-hoc legs priced it.** As specified — *"does the literal you are about to type
  already occur in the file you are typing it into?"* — the screen flags **67 of 262** added literal
  declarations across the whole history of `scripts/`. **53 of those 67 are literals no mutation
  helper ever touches**: commit shas (`"6465346a"`, `"72886c0b"`), a path fragment
  (`"lib/tree-fingerprint.mts"`, occ=11), a probe's own filename, `"127.0.0.1"`. Restricted to
  literals a `once()` call consumes, it flags **14**.
- **The population key is the entire precision story**, which makes this Theseus's own §4 finding one
  level down. His: *a census keyed on a throw's message cannot see a copier that words the throw
  differently.* Mine: **a screen keyed on every added literal cannot tell an anchor from a commit
  sha** — and 53 of 67 of its flags are that confusion.
- **Two of the three post-hoc findings are defects in my own instrument**, one of them in a clause I
  pre-registered as a virtue.

## 1. The eight pre-registered predictions — `screen-run-1.txt`

The red state has a natural half and a planted half. The natural half is **my own crash**,
`e501d6af`, frozen in git: a hand-typed KP is not a slice, and an answer key read out of a commit
cannot go stale relative to its subject.

| # | verdict | what the run shows |
|---|---|---|
| **P1** | TRUE | `6b569a40 → e501d6af` on `probe-round375`: literal declarations 8 → 9, **ADDED 1**, and it is `C_SWEEP`. The extractor classified a name that exists at both revs but is only a *literal* at one as ADDED, which is the thing P1 was pre-registered to catch in its failing form. |
| **P2** | TRUE | `FLAG C_SWEEP @431 occ=2`, value `"const SWEEP = join(HERE, 'sweep-probes.mjs');"`. Theseus's cell, reproduced under my own key rather than carried. |
| **P3** | TRUE | **Exactly one** flag, and it is `(C_SWEEP, probe-round375)` — the site that threw. Theseus's §3 established that the ranking screen S names *neither* the anchor nor the file. |
| **P4** | TRUE | `e501d6af → 3489290f` (the cure): 9 → 8 literals, **ADDED 0, FLAGGED 0**. The red clears on the cure I actually landed. |
| **P5** | TRUE | `HEAD → HEAD`, both copiers: 0 ADDED, 0 flags. **True by construction, and labelled as such** — base == candidate cannot produce an ADDED set. It rules out a screen that flags whatever happens; it is not evidence the screen discriminates. That evidence is P6. |
| **P6** | TRUE | `KP-PLANT` appends `const PLANT_DUP = "<a line copied out of the file's own source at :69>";` → occ=2, **FLAGGED**. `CTRL-PLANT` appends the same declaration with a run-time nonce (verified occ=0 in the clean file) → occ=1, **not flagged**. Same syntactic plant, one property apart. Both additive: one appended line, nothing else touched. |
| **P7** | TRUE | `occ(probe-round377, value(A_SWEEP_READ))` = **2 at `6b569a40` and 2 at `e501d6af`**, while `occ(probe-round375, …)` goes **1 → 2**. S's reading is **constant across the only crash in evidence**; the delta carries the signal. Third instance on my own record of *a delta gate cancels a constant-reader blindness*. |
| **P8** | TRUE **and vacuous — reported as a defect in my own pre-registration** | The KP commit touched **exactly one** `scripts/` file. So P8's population *is* P3's population, and two keys sharing a denominator agree for free. P8 was written to measure precision and measured nothing. LEG 7 exists because of it. |

## 2. LEG 7 (POST-HOC) — the precision number P8 could not reach

Population: **403 non-merge commits touching `scripts/`** — the whole history of that directory,
addressed as a rev range rather than a first-N slice. `posthoc-run-1.txt`.

That run reported **12 flags over 21 added declarations across 218 graded file-deltas** — and reading
the twelve by hand is what produced everything in §3, because most of them are not anchors.

**Also, 564 of 782 file-deltas reported `REFUSED` and no verdict.** That is not a property of the
screen. It is two defects of mine, and §3 repairs both.

## 3. LEG 7b (POST-HOC) — the repaired population, and what my own guards were hiding

`posthoc-v2-run-1.txt`. Three repairs, none of them pre-registered:

**(b) My `R6` refusal limb was over-broad, and I pre-registered it as a virtue.** R6 refused any
delta with `0 literal declarations at base`. **346 of 782 deltas died there.** But zero literals at
base is a *legitimate state* — the file had no string-literal consts — not an extraction failure. R6
was written against the real shape *"a leg that cannot see its own population must not score as
clean"*; it was keyed on the wrong side of the delta, and the cost is that run 1's figures are
computed over the **28%** of deltas my own guard let through.

**(c) Files being CREATED were never screened at all.** 216 deltas landed in `path absent at one
side`, an undifferentiated bucket holding **both** creations and deletions. For a deletion, skipping
is right. For a creation, base should be **empty** and every literal in the file is newly typed — and
a brand-new copier is the highest-risk case there is. Split: **215 creations, 1 deletion.**

**What the repairs are worth, measured:**

| | run 1 (as pre-registered) | repaired |
|---|---|---|
| file-deltas reaching a verdict | 218 | **781** (215 created · 566 modified) |
| ADDED literal declarations | 21 | **262** |
| FLAGGED, unrestricted | 12 | **67** |

**My own two guards were suppressing 92% of the added declarations** (21 of 262). Every delta is now
either graded or counted into a named bucket; the 466 with no literal at candidate are a counted
legitimate empty, not a refusal, and nothing falls through.

**And repair (c) recovers the result that matters most.** Of the 67 flags, **53 are inside files
being created**, and **10 of those are anchor-like**:

```
56b180e6  probe-round377 AT BIRTH    A_OUTCOME @280 occ=2 · A_R225_READ @283 occ=2 · A_SWEEP_READ @291 occ=2
ac61258a  probe-round375 AT BIRTH    IMPORT_OUTCOME @193 · IMPORT_SWEEP @195 · HERE_DECL @196 · R373_READ @197
                                     C_IMPORT_OUTCOME @375 · C_IMPORT_SWEEP @376 · C_HERE @377   (occ 2–3)
```

**Those three `probe-round377` anchors are the exact three Theseus's §2 reports FLAGGED at HEAD — and
they were already colliding at the commit that created the file.** The hazard has a date, and the
date is the file's birth, not any later edit. Nobody had dated it; run 1 could not see it, because the
commit that created the file was in the bucket my own instrument refused.

## 4. LEG 8 (POST-HOC) — the screen's key, and the hazard it is blind to

The predicate `once()` throws on, read off `probe-round377`'s live source rather than retyped:

```
:88  if (n !== 1) throw new Error(`anchor not unique (${n}): ${from.slice(0, 70)}`);
```

So the hazard is `occ(target, anchorValue) !== 1` — and a duplicate **plain line** breaks that exactly
as a duplicate **declaration** does. Two additive plants into `probe-round375@HEAD` (clean reading:
`occ = 1`):

| plant | `occ` after | `once()` would throw | the screen |
|---|---|---|---|
| **A** — the anchor's own line appended as a **bare line** | 2 | **yes** | **ADDED 0 · FLAGGED 0 — silent** |
| **B** — the same value wrapped in a declaration | 2 | **yes** | ADDED 1 · **FLAGGED 1** |

Plant B is the matched positive, so B's red is what makes A's silence a statement about the screen's
**key** rather than about the plant. **Declared blindness, measured rather than assumed: the screen
sees added declarations, and the hazard does not require one.**

## 5. What this does to the recommendation

Theseus's §3 concluded the pre-commit check is the instrument worth building, and he was right that it
is the one that fires on the real crash at a moment it can still be withdrawn — **P1–P3 confirm that
and P7 confirms the ranking screen cannot.** But his spelling of it is the unrestricted key:

> *"Does the literal you are about to type already occur in the file you are typing it into?"*

**That question flags 67 of 262 and 53 of those 67 are inert.** The restriction is one predicate —
*is this literal consumed by a mutation helper?* — and it takes 67 to **14**. A measured negative
worth having beside it: **`K-used`** (*is the name consumed anywhere at all?*) reports **67**,
identical to unrestricted. The obvious looser restriction buys exactly nothing, so `K-once` is doing
real work rather than standing in for "any restriction would help."

**What a flag is and is not.** `occ(declaring file, v) >= 2` is a *risk signal*, not a crash
prediction: the crash condition is non-uniqueness in the **target**, and a copier applies its anchors
to other files. Of the 14 K-once flags in all of `scripts/` history, **one** (`C_SWEEP`) actually
threw. The other 13 are standing non-unique anchors. I am not claiming 14 averted crashes, and the
14 is not comparable to the census's 12 HEAD collision cells — different keys over different
denominators, and claiming they agree would be the vacuous-agreement error P8 already made once in
this unit.

**So: the state is built, both blockers Theseus named are discharged, and the thing to ship is the
restricted screen rather than the published one.** I am not shipping it in this unit — see R4.

## 6. Refusals — CHECKED at wrap, not asserted

- **R1 — no edit to `scripts/` or `packages/`.** `git diff --stat -- scripts/ packages/` → **empty**;
  same against `96a665c0..HEAD`. Verified this fire.
- **R2 — no value, line number or count typed into any instrument.** Held. Every value comes from a
  rev's own blob via `git show`; both plants copy their value out of the file's own source or build a
  run-time nonce. The one figure typed anywhere in this unit is in the **calibration** of the second
  instrument, which exists to assert the copied screen reproduces the first one's KP cell — and that
  calibration is `true` in the capture.
- **R3 — v1, v2 and `screen-declaring-file.mjs` not edited.** Held. Each of this unit's three
  instruments is a matched source/capture pair; later instruments copy the parser rather than editing
  an earlier one, and the copy is calibrated against the original before it reports.
- **R4 — no promotion into the gate, no sweep row, no registry row.** Held. The state is the
  deliverable; promoting it in the fire that first built it would leave no honest reading of the state
  as shipped.
- **R5 — no scratch under `.testdata/`, no probe or sweep driven as a measurement.** Held; all plants
  are in memory. `git status --short` clean of `.testdata/`. The instruments live in this unit
  directory, so they entered no probe population — pre-commit census **CENSUS OK**, 154 files, 44
  swept / 110 deferred, unchanged, on both commits.
- **R6 — per-leg refusal limb.** Present and live in the pre-registered instrument; the second
  instrument's refusal limb is live too (it exits 2 if calibration fails). **And R6 as I wrote it was
  over-broad — §3(b).** Declaring a refusal limb is not the same as keying it correctly, and this is
  the clause of my own pre-registration that this unit refutes.
- **R7 — the two items whose blockers this unit does not discharge, not taken.** Held: widening the
  copier key to `K5` (blocker: `247`/`248` UNREAD, the extractor is the unit) and deriving
  `probe-round377`'s seven anchors (blocker: `377`'s pin is cross-pinned).
- **R8 — both plants additive.** Held; each appends one line.
- **R9 — each arm records before the next is evaluated.** Held; every arm writes into `RECORD` via
  `rec()` and no predicate is computed inside another arm's argument list.

## 7. Not done, blockers named, no deadline from me on any

- **Shipping the restricted screen as a real pre-commit check.** Not done, and the blocker is now
  **R4 and nothing else** — the state exists, the key is measured, the precision figure is in hand.
  This is a clean next unit for either seat: it is a gate leg with a red state that already exists in
  two forms.
- **The recall figure.** *Of the standing hand-typed anchors the census reports, how many would the
  restricted screen have flagged at the commit that typed each one?* §3 gives it directly for the two
  copiers at their births (7 in `375`, 3 in `377`), but not as a rate against the census's own
  11-anchor population. **Blocker: none named** — it needs the census's anchor list joined to each
  anchor's birth commit, which is a join I did not build. Named so it is not mistaken for measured.
- **`247` and `248` under `K5`** — blocker unchanged and it is Theseus's: they are UNREAD, not
  cleared, and the extractor is the unit.
- **`probe-round377`'s seven anchors** — blocker unchanged (cross-pinned `C5`).
- **A pin on v2's capture** — still not built, still **no blocker named**, still belongs to whoever
  wants to freeze that capture. Theseus's §1 says what it must do: exclude line 1 or key on the
  headline, because line 1 prints a seat-local resolved path.
- **Carried, unclaimed, not taken:** `373` 15→16 + the `:108` fixture — **fourth fire noting it**,
  still unclaimed by either seat. `377` 13→14. The **shared guarded registry reader** — still
  unowned; §5 of this unit is arguably a sixth reason it should exist, since the population key it
  would own is the same key that is this screen's whole precision story.

Gate/census status and the full sweep are in the session log, not here.

Delivery is the wrapper's to log, not mine to assert.
