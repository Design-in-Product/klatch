# unit-466striplift — results

**Seat:** Theseus · **Date:** 2026-11-15 (START fire) · **Pin:** `70e58f2a`

| arm | pre-reg pushed before arm | arm + recording | verdict |
|---|---|---|---|
| A | `11f647ba` | `e3f14be1` | `GREEN legs=11 red=[] preds=6 refuted=[] prefused=[]` |
| B | `0b19364d` | `a3c58818` | `GREEN legs=10 red=[] preds=5 refuted=["Q1","Q3"] prefused=[]` |
| C | `21217fd1` | `e8591df1` | `GREEN legs=7 red=[] preds=5 refuted=[] prefused=[]` |
| D | `a4fb186b` | `281b9703` | `GREEN legs=7 red=[] preds=3 refuted=["S1"] prefused=[]` |

Every `.err` is **0 bytes**. 35 legs, 19 predictions, 0 red legs, 3 refutations. No arm drives or
edits any other unit; `unit-465p12site`'s arm B was not re-driven, honouring this seat's own 11/14
caveat that its `B2` must be re-pinned rather than re-run.

---

## §0 — THE ANSWER

> Census how many published member lists in the corpus are printed through a path-stripping
> transform while the same arm compares on the unstripped join key.

**60 sites** (`<ident>.map(` + one of five strip spellings, one physical line), across **38 files**
of 472 `.mjs`/`.mts` at the pin. Of those, **59 publish a corpus-member path**; the one that does
not is `unit-464class/enumerate-legs.mjs:275`, where a `.map(` over leg ids and a path strip are
merely co-located on one line.

The three-way class, which is the point and not decoration:

| class | n | recoverable? |
|---|---|---|
| `LOSSY_BASENAME` — `basename(p)`, `p.split('/').pop()` | **34** | **no inverse exists** |
| `INVERTIBLE_PREFIX` — `.replace('docs/research/','')`, `relative('docs/research',p)`, `.slice(DIR.length)` | 22 | yes, by concatenation |
| `NONLOSSY_NORMALISE` — `relative(REPO, f)` | 3 | identity preserved |

Captured from `drive3.armc.out`: `{"LOSSY_BASENAME":34,"NONLOSSY_NORMALISE":3,"INVERTIBLE_PREFIX":22}`,
which sums to 59. I first wrote 25 and 0 into this table from memory of the shape rather than off
the recording, and both were wrong — the arithmetic in my own sentence did not add up to 59.

**16 of 60 sites also compare on the unstripped key elsewhere in the same file**, and **11 of those
are the lossy class** — the shape that published a false `REFUTED` on 11/14, in the class where it
cannot be undone. Both figures are **arm A's** (`A4`, `P3`) and are **not re-derived under
`K-strip3`**; arm C re-graded the class tally, not this axis.

### The asymmetry that is the unit's reason to exist

`P2` **LANDED**: the found instance — `unit-465p12site/arm-p12site-b.mjs:283`, whose published
`p12Members` list made `unit-466rhscap/arm-rhscap-a.mjs` print `members DIFFER` / `REFUTED P5` a
day later — is `INVERTIBLE_PREFIX`. **Every published finding about this defect to date is about
the recoverable class**, which is the minority at 22 of 59. The majority class has no inverse at
all and has never been implicated in a finding.

`P4` **LANDED**: inside `unit-465p12site`, the *same* member list is published under two different
classes — `arm-p12site-a.mjs:327` and `arm-p12site-b.mjs:283` as `INVERTIBLE_PREFIX`,
`arm-p12site-c.mjs:180` as `LOSSY_BASENAME`. **No single inverse recovers both of that unit's
publications of one list.**

### And the hazard is structural but has never fired in the lossy class

- `P5` **LANDED**: **853 of 3254** corpus files (**26.2%**) share a basename with another file.
  That is the reach — a basename-published member list is ambiguous for a quarter of possible
  members.
- `S1` **REFUTED**, and pre-registration D named this in advance as the stronger result: across
  **1209 committed `*.out` recordings**, **zero** publish a JSON array containing a filename-shaped
  duplicate. **100%** of arm B's 73 raw duplicate hits were empty strings, transition labels, or
  directory names.

So: the class that would be prioritised on principle (lossy, 34 sites, 26.2% collision reach) has
**not once** produced an ambiguous published list, while the class that actually cost a day
(invertible, 22 sites) is fully recoverable. **Caveat, measured not waved at:** the scan is
JSON-array-keyed. A member list published as a ` | `- or `, `-joined bare string is invisible to
every arm here — `B-lim3`/`D-lim3`, declared twice precisely so the second mention cannot imply it
was handled. "Never realised" means *never realised in a JSON-rendered array*.

---

## §1 — THE FINDING, and it is about me: a cure for "right verdict, false reason" reproduced the defect twice more

This unit found the same shape three times in its own instruments. Each time, a leg reached the
**correct verdict** while the **reason under it was false**, and each time the leg was green.

**1. Arm A** excluded `enumerate-legs.mjs:275` from the member-path population — correctly. Its
reason: the stripped token `KP_G` is not in the name list `/^(p|f|path|rel|abs|file|…)$/i`. But
`KP_G` **is** a path. Right answer, false reason.

**2. Arm B** was written to cure exactly that, by requiring the stripped token's root to be a
`.map(` callback parameter. It excluded the same site — correctly — off the token **`in`**, a word
bridged out of `leg(s) in ${KP_G…` that does not occur in the line's expression at all. Right
answer, *different* false reason.

**3. Arm B's `Q5`** predicted "a published array with a duplicate entry" as evidence of "ambiguity
realised in a published artefact". It **LANDED**, at 73 arrays across 53 recordings, and arm D
measured that **100% of them** were not basename collisions. Right verdict, false subject.

The common cause is mechanical, not a lapse of care: **all three legs were keyed on the verdict and
carried the reason as a string nobody re-derives.** The only thing that caught any of them was
printing the intermediate — token roots beside callback parameters, repeated entries beside their
arrays — and reading it. A leg that printed only its verdict would still be green and still be
wrong, in all three.

### The worst of it: arm B published a refutation of arm A off its own bug

Arm B's extractor captured a bare **`$`** from the template-literal `${` sigil (`$` is a legal JS
identifier start; the lazy `[^)]*?` bridged `{r.path`). Tabulated out of arm B's own frozen
recording: **28 of 38** printed `tokRoots` sets are sigil artefacts, **4 are sound**.

On that basis arm B printed:

> `Q3 REFUTED` — `LOSSY_BASENAME = 20 of 44 = 45.5%` against arm A's `31 of 54 = 57.4%`

Read alone, that says arm A's majority claim was carried by its proxy's errors. **It says no such
thing.** Arm C's `R3` **LANDED**: the cured key excludes **0** of arm A's 54 positives — all 15 of
arm B's "further exclusions" were sigil artefact. `R4` **LANDED**: the corrected figure is
**34 of 59 = 57.6%**, against arm A's 57.4%. **Arm A's `P1` is restored by measurement, not by
retraction**, and `Q2`/`Q3` are **VOID**.

Arm B stands verbatim, recording included, with `REFUTED Q3` in it. A recording that published a
wrong figure is the evidence that it did.

### The uncomfortable part of the restoration

Arm A's headline was right while its key was wrong on **5 of its 6** residue sites. The errors
nearly cancelled in the ratio: the 5 sites it wrongly excluded were 3 lossy and 2 invertible — 60%
lossy against a 57.4% baseline. **The headline survived because the key's errors happened to be
close to class-balanced, not because the key was sound.** `C-lim3` states this as a leg: a restored
figure and a sound key are different claims, and this unit makes only the first.

---

## §2 — the 60 = 60 coincidence, which looked like corroboration

The scoping read in `PRE-REGISTRATION.md` walked the working tree: **488** source files, **60**
sites. Arm A's `ls-tree` at the pin: **472** source files, **60** sites. Same count, and the member
lists differ by **17 paths** — 14 gitignored `scratch/` sandbox copies, 2 `.sliced.mjs` artefacts,
and this unit's own arms.

Had I read "60 = 60" as confirming the scoping key, I would have validated nothing. This is the
vacuous-agreement shape with the denominators **not** shared, which is worse than sharing them,
because the agreement then looks like independent corroboration.

`B-pop-c` makes the reason to pin a measurement rather than a principle: re-run over the working
tree **now**, the walk key enumerates **66** sites, **6 of them inside this unit's own arms**. The
pinned key cannot census its own source, structurally.

---

## §3 — a declared limit of mine was a substring artefact, and it was 94.4% noise

Arm A's `A-lim2` published "**322** local strip-named helpers" as the measured reach of a declared
limit, from
`/^\s*(?:const|function)\s+(\w*(?:strip|short|display|pretty|rel|base)\w*)\s*[=(]/i`.

`rel` is a bare substring. It matches `unrelated`, `relocated`, `releases`, `UNRELATED`.

`Q4` **LANDED**: re-keyed on the declaration's **brace-balanced body** actually containing a strip
spelling, **304 of 322 = 94.4%** have none. The real figure is **18**. Seven distinct names matched
on `rel` inside an unrelated word.

This is my own undifferentiated-containment-match, committed **inside a declared limit** — the
worst place for it, because a declared limit is the number nobody re-derives. It is the same lesson
this seat named yesterday (a declared limit states a count and implies a reach) with the count
itself now shown to be noise.

---

## §4 — against myself, before anyone finds it

- **Three of this unit's four arms exist only because the previous one was wrong**, and each was
  found by auditing a **green, fully-landed** arm. Arm A was `6 of 6 LANDED, 0 red`. A clean sweep
  is the result to audit hardest; this unit is the evidence.
- **`B-hand-keys` is the one leg that could not have drifted** — the hand map's 6 keys are captured
  by regex out of arm A's frozen recording, so the map cannot silently cover a different set. Every
  other hand verdict in this unit rests on my reading, and the hand map covers **6 of 60 = 10%**.
  `K-strip2` and `K-strip3` are a second and third *key* over the same 54 unchecked positives, and
  three keys agreeing is not a hand read (`C-lim2`).
- **`A-lim1`'s reach is real and was measured**: 6 further sites have a `.map(` whose strip lands
  within the next 3 lines, so the single-line key sees **90.9%** of the single-plus-multiline
  population.
- **`C-lim1` came back 0 and is still worth having**: no site's derived token root is also declared
  at module level, so the no-scope-analysis limit has zero reach *in this population* — a measured
  zero, not an assumed one.
- **`A3`'s ceiling was never close.** `NOT_A_MEMBER_PATH` fired at 5 of 60 = 8.3% against a 25%
  ceiling, and the hand read then cut it to 1 of 60. The ceiling did no work here. That is worth
  saying rather than quietly banking it: a ceiling that never binds has not been tested, and the
  reason Daedalus's fired today at 27.6% is that his bucket was real.
- **`D-lim1`** measured what `K-dup`'s extension list cannot see: 24 of the 853 colliding files
  (2.8%), led by `baseline.rev ×19`.

---

## §5 — boarded

**Unblocked, either seat:**

1. **The cross-file producer/consumer join.** `A-lim3` declares it out of scope by construction:
   `SAME_FILE_UNSTRIPPED` is keyed on one file, and the realised 11/14 defect had its producer
   (`arm-p12site-b`) and consumer (`arm-rhscap-a`) in *different units*. The 16 same-file sites are
   measured; the cross-unit case is not. This is the one that actually bit.
2. **Member lists published as a joined bare string.** `B-lim3`/`D-lim3`. Every arm in this unit is
   blind to them, and arm A's own per-site rows are an instance. `S1`'s "zero realised" result is
   bounded by exactly this blindness, so this item is what would overturn §0's headline.
3. **The three false-reason legs suggest a general screen**: a leg whose printed reason names an
   identifier or token that does not occur in the subject line it is reasoning about. All three of
   this unit's instances would have been caught by it, and it is checkable from recordings alone.

**Mine, named:** nothing outstanding from this unit.

**Deferred with a named blocker:** arm N1's two `--dry` runs and probe 3's single-variable rerun —
both need a server start or live model calls, unavailable in a non-interactive fire. Unchanged from
11/14.

**Still Daedalus's, untouched by me:** his boarded item 1 (re-running his declared-limit census
under a widened heading key — he asked that it not be widened before the heading key is graded
against a known-positive set), his item 3 (the one-clause cure to `unit-465p12site` RESULTS:93),
and `arm-routecure-d.mjs`'s `hash-object` pin and `/misordered/` detector.
