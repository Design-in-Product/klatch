# unit-484popnarrow — RESULTS

**Daedalus · 2026-11-19 WORK fire.** 1 arm, 1 cripple, 2 post-hoc legs, 11 drives, 10 predictions.
**8 HIT, 1 REFUTED, 1 SPLIT.** Pre-registration pushed in **`8149d6d3`** before the arm, the cure or
the migration existed. `date`-reads: **13:18:51 · 13:23:22 · 13:23:58 · 13:24:23 · 13:25:21 ·
13:25:57 · 13:26:49 · 13:27:10 · 13:28:07 · 13:32:21 · 13:36:33 PST**, read not estimated.

**The item:** the population-key narrowing I boarded on 11/19 START with the only deferral reason
being *"not this fire."* This is the next fire, so it was taken rather than re-deferred.

## 1. THE CURE LANDED, AND THE RED WAS DRIVEN BEFORE IT WAS CLEARED

`verify-decl-body-slicers.mjs`'s population key read `stripSource(raw, false)` — all string bodies
**kept** — so any file that merely **quotes** a comparison was a member. It now reads
`blankLongStrings(raw, 2)`: bodies of 2+ characters blanked, 1-character bodies kept, because **a
key's operand is a one-character body (`'{'`) and a fixture that carries a whole comparison is a
many-character one.** That threshold is the entire discrimination.

| | tracked | population | UNGUARDED | MARKED | GUARDED | baseline | rc |
|---|--:|--:|--:|--:|--:|--:|--:|
| `drive0` live gate, before anything | 1002 | 73 | 59 | 11 | 3 | 59 | **0** |
| `drive2` cure, **no migration** | 1003 | **65** | 58 | 4 | 3 | 59 | **1** |
| `drive3` after the migration | 1003 | **65** | **58** | **4** | **3** | **58** | **0** |

**`drive2` is the point of the sequence.** P3 registered that the cure without the migration would
print rc=1 with exactly the baselined departures stale and 0 new slicers, and it does:
`scripts/probe-round257-the-scanner-had-no-model-of-interpolation.mts → now ABSENT`. The migration
is **evidenced by the gate's own red**, not asserted in a commit message
(`feedback_a_restoration_leg_must_diff_a_pre_action_baseline` in the direction that matters here —
show the state you are about to change).

## 2. P1 LANDS AT THE TOP OF ITS BAND AND MY POINT ESTIMATE WAS WRONG

Registered **4..8, point estimate 5**. Measured **8**. The band holds; the estimate does not, and
the gap is the whole 11/18–11/19 run of instruments: my `unit-482` figure was **4 of 69**, and four
more fixture-carrying arms (two mine, one Theseus's `unit-483`, one of my own post-hocs) landed
between that reading and this one. **A figure recorded against a tree is not a figure about the
key** — the same shape as Theseus's 62 → 69 → 68 chain, arriving on me.

The 8 departures, named rather than counted:

| gate verdict | baselined | ob sites | file |
|---|---|--:|---|
| MARKED | — | 2 → 0 | `unit-480guardorder/arm-b.mjs` |
| MARKED | — | 2 → 0 | `unit-480guardorder/arm.mjs` |
| MARKED | — | 3 → 0 | `unit-481disjunctiononly/arm-disjunctiononly.mjs` |
| MARKED | — | 3 → 0 | `unit-482floorceiling/arm.mjs` |
| MARKED | — | 1 → 0 | `unit-482floorceiling/posthoc-quoted-fixtures.mjs` |
| MARKED | — | 1 → 0 | `unit-482floorceiling/posthoc-string-bodies.mjs` |
| MARKED | — | 2 → 0 | `unit-483columnnarrow/arm-columnnarrow.mjs` |
| UNGUARDED | **BASELINED** | 3 → 0 | `scripts/probe-round257-…interpolation.mts` |

**P2 HIT exactly: 1 baselined departure, and it is the file Theseus named.** My `unit-482` §5
counted it; his `unit-483` §2 named the consequence — *an exemption recorded for a file with nothing
to exempt.* He boarded it under the blocker *"a baseline migration cannot land in a fire that is
also measuring the gate"*, which is true of his fire and not of mine: this seat's subject **is** the
gate.

## 3. THE NARROWING CONVERTS ONE VISIBLE DEFECT INTO SEVEN INVISIBLE ONES — unregistered, and the sharpest thing here

7 of the 8 departures were **`MARKED`**: they carry `brace-slicer-deliberate:` at a site, which is
requirement 3's exemption. After the narrowing they are **out of the population entirely**, so
those 7 markers now grant an exemption nothing needs.

**The gate reddens on a stale BASELINE entry (requirement 2) and cannot see a stale MARKER at all.**
`MARKED 11 → 4` is that asymmetry as a number. The migration cleared the one the gate could see;
the seven it cannot are still there.

**Not built, with the blocker named rather than a priority attached:** reddening on an unneeded
marker would redden 7 files, **5 of them arms of published units**, and whether a frozen instrument
may be edited to drop a marker is a decision about what a published artefact is — the same class of
question as the `setup.ts`/`applySchema` one now sitting at item 9 of the rollup. It is xian's or
the authoring seat's call, not this edit's.

## 4. THE CRIPPLE'S FIRST FIXTURE CARRIED THE HARM INSTEAD OF THE PROPERTY — one leg after this unit quoted that lesson

P9 registered that deleting `blankLongStrings`'s span-extension loop must move ≥1 population member,
or the loop is decoration. **`drive5` refused at rc=4 and published nothing**, because its KP failed.

The fixture was `const fixture = "if (s[i] === '{') d += 1;";`, registered to **survive** the
cripple. It does not. Without the extension the body fragments at its own spaces into `if`,
`(s[i]`, `===`, `'{')`, `d`, `+=`, `1;` — and **the fragment carrying the operand is 4 characters,
still ≥ `minLen`, so it is blanked anyway.** A brace key's operand is the 3-byte run `'{'`, which
fragmentation **cannot** push below 2.

That is `feedback_a_known_positive_must_carry_the_property_not_an_analogy` landing on me **in the
unit whose own pre-registration quotes it from Theseus's `unit-483` §5**, one leg later. The
registered harm and the registered property were one inference apart, exactly as his were.

**`drive6`, repaired, splits P9 and both halves are published:**

- **READING level — HIT.** `KP-S`: the body `"a b"` is blanked by the live reader (3 chars ≥ 2) and
  **KEPT** by the crippled one (two 1-char fragments). The loop is what makes a span mean *the whole
  body* rather than *a run of non-space bytes*.
- **VERDICT level — REFUTED.** 0 of the gate's 65 members move. Registered ≥1.

**The disagreement is the finding, and the module's own docblock was corrected against it.** The
declared-blindness paragraph I had written claimed the extension is what stops a quoted fixture
surviving as a population member. That is false for this key family, and the cripple is what said
so. The paragraph now carries the scope and names the refutation — a caller passing a larger
`minLen`, or keying on a spelling that **can** fall under it, is relying on the loop; this gate is
not.

## 5. ONE READING FOR EVERY KEY, DECIDED ON A MEASUREMENT RATHER THAN ON TASTE

The narrowing was pre-registered for the **population** key alone, which would have left the gate
reading two keys from two readings — the exact shape its own drive-13 note warns about
(*"a key whose conjuncts are read from incompatible readings is not strict, it is unsatisfiable"*).

The arm's post-hoc column drove the **guard** key under both readings across the whole population:
**0 members change verdict.** So the coherent spelling costs nothing and the incoherent one never
shipped. Had it moved anybody, the registered scope would have held and the rest been boarded — a
`GUARDED → UNGUARDED` move can **redden** a file, which P7's "a narrowing can only remove members"
does not cover.

## 6. THE SHARED READER, AND WHAT IT DID NOT MOVE

`blankLongStrings` is a **third export of `scripts/lib/strip-source.mjs`**, derived from the two
readings that module already produces, not a fourth scanner and not hand-rolled in the gate — Round
258 measured three independent answers to *which bytes are code?* disagreeing on live input, which
is why the module exists. The blank character is read off the scanner's own output rather than
asserted to be `' '`. `strip-source.d.mts` carries the declaration, with its `minLen` default,
because that file is not checked against the `.mjs` and a previous round shipped three exports
present in one and not the other with typecheck green throughout.

**P10 HIT, in two halves.** `drive4`: both pre-existing readings are **byte-identical** before and
after, across **all 1004 tracked code files**, with length preservation re-asserted and a KP proving
the comparison can report a difference at all (`feedback_identical_runs_read_as_no_effect_when_all_are_dead`).
`drive7` gate **rc=0** — census 0 errors, typecheck 0 errors, server **147 files / 2294 passed / 1
skipped (2295)**, client **29/42 · 354/367 (13 skipped)**. `drive9` sweep **45 of 45 green, 0 red, 0
blocked, 0 census problems, 110 deferred**.

### `drive8` went red, and the red was mine but not my change's

The sweep at **13:28** reported **44 of 45**, with
`probe-round260-a-census-pin-has-two-axes…` red at its `[F2]`. `[F2]` is
`git status --porcelain -- scripts/verify-tsx-guard.mjs scripts/lib/strip-source.mjs` being empty —
Round 260 asserting its own blast radius. **My edit to `strip-source.mjs` was uncommitted at that
moment**; `drive9`, after the commit, is 45/45 with nothing else changed.

**This is the 11/17 round303 incident repeating with a different pin** (Calliope's 11/17 memo: *your
own round303 pin caught your own new file*). The standing 45/45 figure is a function of **working-tree
cleanliness of two named files**, so any seat mid-edit on `strip-source.mjs` or `verify-tsx-guard.mjs`
will read 44/45 and may read it as a regression. Recorded, not cured: the pin is **correct by its own
key** and the alternative — keying `[F2]` on a committed diff — would weaken an assertion that is
doing real work. **A sweep figure quoted from a dirty tree is not the sweep figure.**

## 7. THE DRIFT BOTH SEATS PUBLISHED FOUR TIMES IS CURED FOR THE FIXTURE-CARRYING CLASS

`drive10`, unregistered. The published sentence is **"+1 population member per instrument that
carries a brace comparison"** (Theseus's `unit-483` §6, sharpening four consecutive `UNGUARDED 59`
readings). Every one of those instruments carries its comparison as **quoted KP fixture text**,
which is precisely what this cure blanks.

At HEAD: **tracked 1006 · population under the OLD key 74 · under the LIVE key 65 · departures 9.**
Of the **6** code files added since `68c0bd5f`, the old key admits **2** and the live key admits
**0**. The pre-commit gate's own three reads say the same thing from the other side: **tracked 1003
→ 1004 → 1006 with population flat at 65.**

**Measured on this fire's own files, after the cure landed — not promised for the next fire.**
Scope, so it is not over-read: this cures the drift for instruments carrying their comparison as
**quoted fixture text**. An instrument that hand-rolls a **live** brace comparison still enters the
population, correctly, which is what the gate is for.

## 8. PREDICTION LEDGER

| # | registered | measured | |
|---|---|---|---|
| P1 | 4..8 dropped, est. 5 | **8** | HIT (band) / estimate wrong |
| P2 | exactly 1 baselined, `probe-round257` | **1, that file** | HIT |
| P3 | cure without migration → rc=1, that entry stale, 0 new | **exactly that** | HIT |
| P4 | `added` = 0, fourth corner unreachable tree-wide | **0** | HIT |
| P5 | `decl-body.mjs` stays IN and GUARDED | **GUARDED** | HIT |
| P6 | after migration rc=0, 65 · 58 · 4 · 3, baseline 58 | **exactly that** | HIT |
| P7 | `newOnes` 0 before and after | **0 / 0** | HIT |
| P8 | `KP-Q` OUT under BOTH readings — the escape was already unreachable | **OUT / OUT, ob 0 / 0** | HIT |
| P9 | cripple moves ≥1 member | **0 members; the READING moves** | **SPLIT** — refuted at verdict level, hit at reading level |
| P10 | readings byte-identical, gate rc=0, 2294 passed, 45/45 | **all four** | HIT |

## 9. GATE, AND THE RESTORE CONDITIONS

- **R1 discharged by naming, not by emptiness** — the permitted four files are the only ones
  changed under `scripts/`: `lib/strip-source.mjs`, `lib/strip-source.d.mts`,
  `verify-decl-body-slicers.mjs`, `decl-body-slicers.baseline`. **`packages/` untouched** —
  `git status --porcelain packages` empty throughout.
- **R2 held** — the arm's control reproduced the live gate exactly (`1003 · 73 · 59 · 11 · 3`),
  figures passed in from `drive0` rather than typed into the arm.
- **R3 held** — `drive2` is the red, driven before the migration.
- **R4 held** — the cripple ran on `scratch/strip-source.CRIPPLED.mjs`, `.gitignore`d by
  `docs/research/unit-*/scratch/`. **The tracked module was never edited for a cripple.** The
  ignored-code-file divergence Theseus predicted grows by two more here (the crippled copy and the
  extracted OLD copy), as he said it would, per unit.
- **R5 not triggered** — the one removed baseline entry is out of the population under the narrowed
  key and cannot redden with or without the entry. Nothing was relaxed to fit.
