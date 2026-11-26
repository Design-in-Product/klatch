# unit-519positionblindkey — results

**Seat:** Daedalus · **Fire:** 2026-11-25 STOP (bounded) · **Model:** claude-opus-5

| | |
|---|---|
| Pre-registration | `d653c236`, on `main` **17:21:18 PST**, before any script in this unit existed |
| Addendum (PH1–PH4) | `9c54ce2b`, after the arm's only drive and **before** the post-hoc that grades them existed |
| Arm | `8660aabc` — `arm-positionblindkey.mjs`, **9 of 10** |
| Post-hoc | `posthoc-overadmission.mjs`, **1 of 4** |
| Diagnostic (unregistered, labelled) | `diag-prefilter.mjs` |
| Total | **14 registered predictions, 10 HIT, 4 REFUTED — and all four refutations are claims I made about my own instrument, not about the corpus.** |
| Gate | rc 0 at every push: tracked files read **1110** at the pre-reg, **1111** at the arm and after; population **65**, **4 / 3 / 58**, baseline entries **58**. Neither new script joined the population. |
| `.err` | **0 B** on both drives |
| `packages/` + `scripts/` | `git diff --stat HEAD` **EMPTY**, asserted inside both scripts before any measurement |

## The headline

**My own `unit-517` PH3 held, and the refutation I published six hours ago was an artefact of my own
key.**

```
                                  published 13:3x    cured      
SHAPE reach   (quote-anchored)         6 of 6        6 of 6     unchanged
HAZARD reach  (blind to a live site)   2 of 6        1 of 6     the subject alone
gap                                      4             5        
PH3 "live-blind = 1 of 6"             REFUTED        HELD       
```

The subject is **this seat's own** reader, `unit-517branchorder/posthoc-hazard.mjs:144`:

```js
const KEY = new RegExp(`\\b${name}\\s*:`, 'g');
```

`\b` is satisfied by a preceding `.`. The key therefore matches the **tail of a member expression**
(`e.file`) whenever a **ternary's else-colon** follows it — and the value span it then captures
really is a ternary, so every downstream signal in `unit-517` agreed with it. Theseus's `unit-518`
routed the separating cell back; I re-read it off the tracked file here rather than adopting it:

```
docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs:83
  CRIPPLE === 'entry-shape-dot-file' ? e.file : typeof e === 'string' ? e : e.file;

  matched text "file :"   preceded by "."      position-blind 1 → cured 0
```

There is no property named `file` on that line. The only `file:` property in that file is at **line
89**. **That single site was the whole of `unit-517`'s cured `file` TERNARY-position census** — so
`probe-round373…mts`, which reads `file:`, is a SHAPE member and not a HAZARD member, and the hazard
collapses to the subject alone.

The cure is a preceding-character class, `(^|[^\w$.])<name>\s*:` with `m` and `g` — **deliberately a
regex character class and not a character comparison**, because a `=== '{'`-shaped comparison is
`scripts/verify-decl-body-slicers.mjs:97`'s population key and expressing "is this a property
position" that way would admit this unit to that gate's population. That is the over-admission that
reddened `unit-515`'s arm this morning. §0 of both scripts **asserts** the absence rather than
claiming it (`brace-comparison present in this file: false`), and the gate agrees: population stayed
**65** across all three pushes.

**The readers are sliced, not retyped.** `AT`/`OPENERS`/`CLOSERS`/`valueSpan`/`valueSpanV2`/
`ternaryQ`/`ternaryQV2`/`ternaryColon`/`literalsOf`/`sitesOf` come out of the published
`posthoc-hazard.mjs` at run time — a **4177 B** span, **13 markers asserted present** including the
position-blind key's own source text — and are compiled. So the `v1` and `v2` columns below are
produced by the code that published them. **The only thing the arm defines is the key**, which is
the variable under test, and no textual substitution is applied to the sliced span.

## P9 — the cure holds its cells, 5 of 5, and every cell is sliced out of a real file

| | file | name | position-blind | cured | want |
|---|---|---|---|---|---|
| NEGATIVE | `unit-307c4…/recon.mjs:83` | `file` | 1 | **0** | 0 |
| POSITIVE | `unit-513…/arm-consumernull.mjs:160` | `cls` | 1 | **1** | 1 |
| POSITIVE | `unit-513…/posthoc-application-subject.mjs:72` | `cls` | 1 | **1** | 1 |
| POSITIVE | `unit-513…/posthoc-application-subject.mjs:75` | `cls` | 1 | **1** | 1 |
| POSITIVE | `unit-513…/posthoc-shape-classes.mjs:214` | `cls` | 1 | **1** | 1 |

No cell is typed into the arm. Each is `readFileSync` of the tracked file, `split('\n')`, index. P4
then holds the four `cls` ternary sites by **file and line**, not by count — a count of 4 is
satisfied by the wrong 4.

## The censuses, one population, three columns

```
name            sites v1 →  v2 → cured     TERNARY-position  v1 → v2 → cured
p                   121   121   121                           0    0     0
cls                  91    91    89                           5    4     4
error                12    12     9                           0    0     0
file                450   450   449                           4    1     0
conversation         17    17    17                           0    0     0
```

Population **839** tracked `.mjs`/`.js`/`.mts` under `docs/research` + `scripts`, re-derived with the
subject's own `ls-files` call and extension filter rather than retyped.

## P7 REFUTED, and it is the keeper of this unit

I registered the interval **10–120** for the number of the 450 `file` sites that are not property
position. **It is 1.**

```
p              0 of 121    0.00%
cls            2 of  91    2.20%
error          3 of  12   25.00%
file           1 of 450    0.22%
conversation   0 of  17    0.00%
```

> **A key whose false-positive rate is 0.22% supplied 100% of the census it fed.** The census is a
> filter on a rare property — ternary position — so the base rate of the key's defect over *all*
> sites does not bound its share of the *reported* ones. 449 of 450 `file` sites were read correctly
> and the one that was not was the entire finding.

And the rate is not a number for the key, it is a number per **name**: **0% to 25%**, and PH3 held
that the two names with ≥100 sites are the two clean ones while the highest rate belongs to the name
with the fewest sites. **I registered my interval against the name where the rate is lowest** —
which is also the name whose large site count made the interval feel conservative.

## PH4 REFUTED — one mechanism, not two

I registered ≥2 distinct mechanisms among the over-admitted sites, as a prediction that could
embarrass me. There is **one**: all 6 sites have `.` as the preceding character.

```
[cls]    unit-514…/arm-equalityconsumer.mjs:183            … ? shapeOf(src, occ[0].offset).cls : null;
[cls]    unit-514…/posthoc-rekey-prefix-and-binding.mjs:233 … ? shapeOf(src, occ[0].offset, v).cls : `REGION=…
[error]  unit-464dir-2026-11-02/grade-direction.mjs:112     … ${r.preLits ? r.preLits.length : 0} …
[error]  scripts/probe-round217-multipart-guard-live-http.mts:183   error = typeof j?.error === 'string' ? j.error : null;
[error]  scripts/probe-round219-files-cap-live-http.mts:195         error = typeof j?.error === 'string' ? j.error : null;
[file]   unit-307c4…/recon.mjs:83                           … ? e.file : typeof e === 'string' ? e : e.file;
```

The class is exactly characterised and the cure is exactly sized to it: **the member-expression tail
before a ternary's else-colon, 6 occurrences, 0 residual.** A refuted prediction that the class was
messier than it is, is the cheapest possible way to learn that it is not.

## P10 HIT against me — the cure does not remove the whole false-positive class

Registered **OPEN** before the cure was written, as a commitment that I would characterise the
residual rather than discover it later:

```
const x = { a: cond ? file : other, b: 1 };      cured key matches: 1
```

A **bare identifier** in a ternary's then-position has no `.` before it, so the cured key still
matches it. **Live corpus count of that shape: 0** — which is why the cure's figures are clean today
and why the figure is a property of the corpus rather than of the key. The class is named here so
that the first file to write `cond ? file : other` inside an object literal does not get discovered
as a new mystery.

## PH1 and PH2 REFUTED — and PH2's refutation is that my own unit grew the population it measures

The arm reproduced `unit-517`'s published `v2` column **exactly on 4 of 5 names** (121 / 91 / 450 /
17) and read **12** for `error` where the published figure is **11**. I registered PH1: population
growth. **Wrong.** Recomputed over the then-population with the published reader, `error` is **11** —
equal to published — and **0** of the 3 added files carries an `error:` site.

PH2 registered the delta as 3 files, all Theseus's. The delta **is** 3, and the third is **mine**:

```
+ unit-518routedternaryreach/arm-routedternaryreach.mjs        Theseus (Klatch)
+ unit-518routedternaryreach/posthoc-separate-the-cripples.mjs  Theseus (Klatch)
+ unit-519positionblindkey/arm-positionblindkey.mjs             Daedalus (Klatch)   ← this unit's own arm
```

> **A unit's own script joins the population between the arm's drive and the post-hoc's.** The arm
> measured 839; the post-hoc measures 840, and the extra file is the arm. The same mechanism is
> visible one step earlier in the same numbers: `unit-517` **published** `836` and `git ls-tree` at
> its own commit returns **837**, because the post-hoc script was committed *in* the commit the
> `ls-tree` names, and the drive ran before it. Neither figure is wrong; the denominator simply is
> not a constant of the tree, it is a function of **when in the commit cycle you read it**.

## The cause PH1 failed to find, named by measurement

A refuted prediction that leaves its own difference unexplained is worse than no prediction, so this
was measured rather than guessed. **Unregistered diagnostic, labelled as such wherever quoted** —
`diag-prefilter.mjs`, capture `DIAG-PREFILTER.out`:

```
p              bare-name 121   `p:` 121             difference 0
cls            bare-name  91   `cls:` 91            difference 0
error          bare-name  12   `error:` 11          difference 1
      invisible to the published prefilter: docs/research/unit-464dir-2026-11-02/grade-direction.mjs  line 112
file           bare-name 450   `file:` 450          difference 0
conversation   bare-name  17   `conversation:` 17   difference 0
```

`unit-517`'s census pre-filtered each file on `src.includes(`${n}:`)`. `grade-direction.mjs` contains
**no `error:` substring anywhere** — its only site is `error :` with a space, inside
`${r.preLits ? r.preLits.length : 0}` — so the published census **skipped the whole file**, and my
bare-name prefilter picked it up. Exactly 1 site, exactly 1 file, named.

**And the site is itself an over-admission the cure removes.** So:

> **The published `11` is right under its own prefilter, my `12` is right under mine, the single
> site of difference is a FALSE site either way, and under the cured key the figure is `9` under
> both.** Two different numbers, neither wrong, and neither of them the count of the property.

**The arm's own §4b looked for this and could not see it**: it reported "cured sites found in files
the narrow prefilter would have SKIPPED: **0**" — true, and useless, because the cure *drops* the
very site the prefilter difference adds. **I measured the difference in the column where it had
already been cancelled.** That is the third face of the same shape this thread keeps finding, now at
prefilter level: a difference exists in one column and the check for it ran in another.

## Against me, four, all about my own instrument

1. **P7** — interval 10–120, actual **1**, and I registered it against the name where the rate is
   lowest (0.22%) while the name with the highest (25%) has 12 sites.
2. **PH4** — predicted ≥2 mechanisms, there is **1**. The class is tighter than I guessed.
3. **PH1** — predicted population growth explained the `error` difference. It did not; the prefilter
   did, and I had to measure to find that out.
4. **PH2** — predicted all 3 new population members were Theseus's. **One is mine, and it is this
   unit's own arm.**

## Open

- **Closed by drive:** `unit-517`'s HAZARD/gap pair is corrected (2/4 → **1/5**) at the bullets that
  published it, and PH3 is restored to **HELD**. The key is cured, KP'd 5 of 5, its residual class
  named and censused at 0.
- **Not done, and not blocked:** the cure lives in this unit's two scripts. Nothing shared reads it
  and no gate leg enforces it. **Carried, mine, no blocker** — same carry as `unit-517`'s cured
  branch-order extractor, and this is now the second cured reader in two fires sitting in a unit
  directory rather than in `scripts/lib/`. That pattern is itself the item.
- **Theseus's, as he stated:** the four unmeasured SHAPE members at consumer level. He measured one
  cell (reach 0) and declined to generalise; this unit does not generalise from it either.
- **Unchanged by this unit:** `unit-516` §5's 15-vs-0 census-purpose choice is **xian's**. The
  `ABSENT` hole still has no owner.
