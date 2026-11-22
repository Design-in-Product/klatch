# unit-501redbranchpin — results

**Seat:** Theseus · **Fire:** 2026-11-22 START · **Pre-registration:** `4378f572`, pushed to `main`
**10:50:47 PST** (`date`-read), before any arm, plant, capture or post-hoc in this unit existed.

**6 predictions. 4 TRUE, 1 REFUTED as written, 1 (the recommendation) consequently REFUTED as
written and NOT re-keyed.** Plus one declared post-hoc that is the fire's headline and lands on a
figure neither seat was questioning.

---

## The question

Daedalus's `unit-500` §6: *"Whether the red branch's 742 bytes join the pin. … Whether the pin should
cover both outputs is a two-seat call about what the pin is for, and this fire did not make it
unilaterally."*

**The answer this unit measured is narrower than the question, and it goes the other way: a BYTE
figure is not a pin on either stream of this gate.** Not stderr's 742, and not stdout's 4160 either
— and the proof of the second half was already sitting in the repository in two captures, one his
and one mine, before this unit existed.

---

## The drives

Five drives of the real gate, both streams captured separately every time
(`spawnSync`, never `execFileSync` — returning stdout only on a clean exit is exactly the
stream-level blindness his P3 was refuted by).

```
  D0  green baseline                      rc=0   stdout 4160 B / 41 lines   stderr   0 B / 0 lines
  D1  plant A,  `git add -N`              rc=1   stdout 3935 B / 38 lines   stderr 722 B / 8 lines
  D2  plant B — SAME BYTES, +9-char path  rc=1   stdout 3935 B / 38 lines   stderr 731 B / 8 lines
  D3  both plants at once                 rc=1   stdout 3935 B / 38 lines   stderr 795 B / 9 lines
  D4  index reset, plants removed         rc=0   stdout 4160 B, sha == D0
```

`k = 9` is the difference in the two plants' repo-relative path lengths; plant contents are sha256
**identical** on both paths (`2724ef0bb85d…`), asserted by reading back off disk, so this arm
measures path length and nothing else.

---

## Predictions, graded

### P1 — TRUE. The red stderr's byte count is a function of the plant's path length.

`722 → 731`, delta **9**, against `k = 9`. Line counts equal at 8.

**Confirmed a second time, across units, against HIS published figure, with no re-run of his plant**
(`posthoc-crossunit-byte-figures.mjs` §3): his stderr is **742 B** at a **77-char** plant path, mine
is **722 B** at a **57-char** path — byte delta **20**, path delta **20**, line counts 8 and 8. Each
path is asserted present in its own capture rather than typed and trusted.

### P2 — TRUE. The red stdout is plant-path-independent.

D1 and D2 stdout are **byte-identical** (sha `f65bbf8bc880…`, 3935 B both). His refuted P3
established that *a* path is absent from stdout for *one* plant; this is the generalisation —
nothing about *which* plant reaches stdout at all.

### P3 — TRUE. The red stderr carries no tree-keyed figure.

Integers in red stderr, outside the path lines: **`[1, 1, 2, 3]`** — the announced new-slicer count
and the three clearing-route literals, exactly the pre-registered multiset. `tracked files read`,
`population`, `MARKED`, `UNGUARDED` and `baseline entries` are **ABSENT** from stderr and **PRESENT**
on stdout; the plant path and the announced count are **PRESENT** on stderr and **ABSENT** from
stdout (`posthoc-which-lines-move.mjs` §4).

*The predicate is keyed on integers rather than words on purpose: clearing route 3 prints the
baseline **path**, so a word-keyed predicate on "baseline" would have been wrong about this stderr
by construction.*

### P4 — REFUTED as written, and the refutation is mine.

Two of its three conjuncts held: stderr lines went `8 → 9` (**+1**, as registered) and the count
rendered as **2**. The third is false: **D3 and D1 stdout are *not* byte-identical.** They are both
**3935 bytes** and they are **different bytes**, on three lines:

```
  L2   tracked files read: 1052     ->  1053      byte widths 26 / 26
  L3   population …:         66     ->    67      byte widths 47 / 47
  L6   UNGUARDED            59      ->    60      byte widths 19 / 19
```

**My predicate conflated byte-identity with byte-count-identity.** The claim I cared about — that
stdout does not carry the plant's identity — is TRUE and is P2. What I actually wrote into P4 was a
sha equality that a defect-count change breaks while the byte figure survives. Registered wrong,
graded as registered, not re-keyed.

### P5 — REFUTED as written, and deliberately NOT re-keyed.

P5 was registered as conditional on `P1 ∧ P2 ∧ P4`. P4 is false, so P5 is false as written. The
pre-registration says in terms: *"If any antecedent is REFUTED, P5 is **not** re-keyed into a
recommendation that the surviving legs support."* So the recommendation below is a **declared
post-hoc**, labelled as such, and the two-seat call stays open with the measurement attached.

### P6 — TRUE, and it is also a finding.

Red stdout is **3935 B / 38 lines**, reproducing his `D2` exactly — at `tracked files read: 1052`
where his read **1048**. That is the **fourth consecutive unit** in which a published byte figure is
held constant by a digit count rather than by a property (`1046 → 1047`, `1042 → 1046`,
`1047 → 1050`, now `1050 → 1052`), as registered.

---

## The headline, as a declared post-hoc: 4160 has already been satisfied by two different reports

Not pre-registered. Read off captures **already committed before this unit existed**, so it needs no
drive and no plant (`posthoc-crossunit-byte-figures.mjs`):

```
  GREEN stdout   his unit-500 post-commit  4160 B   |  my unit-501 D0   4160 B
                 byte counts equal: TRUE            |  BYTES equal: FALSE
                 differing lines: 1  —  L2 `tracked files read: 1050` -> `1051`   widths 26 / 26

  RED   stdout   his tracked-plant         3935 B   |  my D1           3935 B
                 byte counts equal: TRUE            |  BYTES equal: FALSE
                 differing lines: 1  —  L2 `tracked files read: 1048` -> `1052`   widths 26 / 26
```

**The pin we have both been holding — "4160 bytes / 41 lines" — is satisfied right now by two
captures that are not the same bytes.** The digit-width coincidence has been reported in three
previous units as *a byte figure surviving a tree change by luck*. This is the first measurement
showing what the luck actually buys: it does not merely keep the figure alive across a change, **it
makes the figure unable to report the change at all.** Two seats, two trees, two different
`tracked files read` values, one byte count.

That is a stronger argument for Daedalus's *pin the denominator* call than either of us has made for
it, and it is the fourth and fifth independent instances in four days.

### The recommendation — post-hoc, offered not asserted, and it needs his word

The pin question has a narrower answer than either of us posed. What is pinnable on this gate is
**content, not bytes**, on both streams:

- **stdout** — the named figures (`tracked files read`, `population`, `MARKED` / `GUARDED` /
  `UNGUARDED`, `baseline entries`), each read by name. A byte count is a pin a content change can
  satisfy, measured above.
- **stderr** — a **content predicate**: the offending path is named, the count is announced, and all
  three clearing routes print in preference order (exactly what he measured TRUE), plus a **line
  formula** — `7 + N` lines, driven at `N=1 → 8` and `N=2 → 9`. A byte count here is a function of
  the path length of whatever file happened to redden it, which is a fact about the defect and not
  about the instrument.
- **The caveat in the gate's docblock** — *21 of 41 published lines are paths* — describes the green
  report, which is correct and should now also say **which stream**, because the red state's stdout
  is a different 38-line report and its stderr is a different document entirely.

**No edit landed.** The docblock is his file and the pin is a two-seat call; this unit supplies the
measurement.

---

## Against me, at face value

1. **P4's predicate conflated byte-identity with byte-count-identity** (above). The irony is exact:
   the unit whose finding is *a byte count cannot see a content change* registered a prediction that
   failed because **I** could not see the difference between those two things when writing it.
2. **My R1 refusal predicate was keyed on a surface wider than its claim, and it STOPped on the
   arm's own output.** R1 compares `git status --porcelain` at open and close and demands
   byte-identity. It fired:

   ```
   --- open ---   ?? …/arm-redbranchpin.mjs
   --- close ---  ?? …/arm-redbranchpin.mjs
                  ?? …/captures/
   ```

   The difference is the `captures/` directory the arm is *supposed* to create. **R1's substance
   holds and was verified by hand rather than by the arm that failed to check it:**
   `git ls-files -- docs/research/unit-501redbranchpin-2026-11-22/` returns **the pre-registration
   and nothing else**; `git diff --stat` is **empty**; no plant is on disk; no index entry survives.
   Not re-driven to make the predicate green — that would re-score a graded run. Recorded as the
   defect it is: a refusal that cannot tell the state it forbids from the output it requires.
3. **The one defensible part of the sequencing**, and it is the same one as 11-21: I priced this
   unit's own artefacts against the gate *before* writing a claim about them. Measured at close
   rather than asserted — see below.

---

## R1 / R5, checked at close rather than claimed

- **R1** — no published instrument edited, by reader or byte. The gate is driven, never modified; its
  baseline file never written. Plants were written and removed inside the arm; index entries created
  with `git add -N` were reset in the `finally`. Verified by hand after the run (above).
- **R5 — his P5 trap, held.** `grep -c` for the exemption-marker token returns **0 across all five
  files** of this unit (three executables and both markdown deliverables, so this write-up does not
  put itself on the dead-marker list either): it is assembled from parts in each, and every brace comparison in
  the plant is built from `String.fromCharCode`, so no one-character quoted brace comparison can put
  this unit's own files in the population it measures. **Checked against the gate at close**, not
  asserted — figures and the quoted-only list below.
- **R6** — `packages/` and `scripts/` untouched, so `npm test` is **not** claimed by this unit.

## Declared scope and declared blindness

- **The `newOnes` red limb only.** The gate's second red limb (`stale.length` — a baseline entry no
  longer unguarded, or gone) needs an edit to the **tracked** baseline file, which R1 forbids. Its
  output shape is **unmeasured**, and "the red branch" as graded here is one of two red limbs. Stated
  so the seat that measures it inherits the scope rather than reading this unit as covering it.
- The `.gitignore`d plant case is his §3's territory and is not re-graded here.
- Nothing here grades whether the pin *should* change. That is his file and a two-seat call.

## Artefacts

```
PRE-REGISTRATION.md                      pushed 10:50:47 PST, commit 4378f572
arm-redbranchpin.mjs                     5 drives, both streams, plants removed in a finally
posthoc-which-lines-move.mjs             declared post-hoc: which lines move, on which stream
posthoc-crossunit-byte-figures.mjs       declared post-hoc: his captures vs mine, no drive
captures/d0-green-baseline.{out,err}
captures/d1-red-plant-a.{out,err}
captures/d2-red-plant-b-longer-path.{out,err}
captures/d3-red-both-plants.{out,err}
captures/d4-green-after-reset.{out,err}
captures/figures.json
captures/posthoc-which-lines-move.out
captures/posthoc-crossunit-byte-figures.out
```
