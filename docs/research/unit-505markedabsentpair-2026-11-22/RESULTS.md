# unit-505markedabsentpair — results

**Seat:** Theseus · **Fire:** 2026-11-22 STOP

**Headline:** the open cell lands exactly — `MARKED`+`ABSENT` at `357 B / 6 L`, the landed general
form to the byte — and the finding is not that. The finding is that **three stale blocks saying
three different things publish at one byte count and read identically under every label-blind clause
of the published content predicate.** And the headline against me is **P8 REFUTED**: this unit moved
the standing figure `4309 → 4390` through a **comment**, and the comment was the one asserting the
token could not match this file — the lesson I filed this morning, shipped again the same day, in a
file whose docblock claims the rule it breaks.

## 0. Provenance

- **Pre-registration pushed to `main` at `19:51:32 PST`** (`date`-read), commit `b5a5e355`, **before
  any arm, synthetic repo, fixture or capture existed.** Nine predictions, P1–P9.
- Arm landed `cca63d0e`. Gate SHA asserted identical before every drive.
- **35 pre-registered assertions: 32 HIT, 3 REFUTED** (all three refusals are P8's sub-claims).
  Two labelled post-hocs, counted as HITs of nothing.

| prediction | assertions | HIT | REFUTED |
|---|---|---|---|
| P1 — the open `MARKED`+`ABSENT` cell | 3 | 3 | — |
| P2 — identical bytes, different content | 4 | 4 | — |
| P3 — a third content at the same count | 4 | 4 | — |
| P4 — cross-harness anchor on `D-MIXED` | 3 | 3 | — |
| P5 — bytes track label WIDTH alone | 3 | 3 | — |
| P6 — the labels are really printed | 5 | 5 | — |
| P7 — the published pin pair is label-blind | 5 | 5 | — |
| P8 — this unit moves no published figure | 5 | 2 | **3** |
| P9 — the two line citations | 8 | 8 | — |

## 1. The cell he left open

```
  cell               tracked          baseline      renders            bytes  lines  rc   sha
  E-MARKED-ABSENT    M1 (marked)      [M1, A01]     MARKED + ABSENT     357     6    1   9734960f
  E-2ABSENT          none             [M1, A01]     ABSENT  × 2         357     6    1   7624415c
  E-2MARKED          M1, M2 (marked)  [M1, M2]      MARKED  × 2         357     6    1   af1bd215
  E-GUARDED-ABSENT   M1 (unmarked)    [M1, A01]     GUARDED + ABSENT    358     6    1   9efe3853
```

All paths pinned to **40** and asserted. `227 + 2×(40+19+6) = 357`; `227 + (40+19+7) + (40+19+6) =
358`; `lines = 4 + N = 6`. **The landed general form is exact in all four cells, and `MARKED` now has
multi-entry evidence for the first time** — it was in the published label set on the strength of one
N=1 drive (`unit-503` C-MARKED) until this fire.

**`E-MARKED-ABSENT` and `E-GUARDED-ABSENT` differ in exactly one input.** Same baseline, same tracked
set, same path lengths; the only difference is whether the tracked fixture carries a declared marker
comment. That one input moves the output by **+1 byte**, which is the label-width term and nothing
else. This is the cleanest statement of the `+19+len(label)` form that has been driven: every other
cell in the corpus varies at least two things between the compared states.

**Both controls did real work, and were registered as controls before measuring:**

- `E-2ABSENT` kills *the limb charges a flat per-block constant at N=2*. Under that reading the
  label term does no work at all, and `E-MARKED-ABSENT` = 357 is equally consistent with it.
- `E-2MARKED` kills *`MARKED` is being charged as `ABSENT` because the verdict lookup fell through* —
  the right number for the wrong reason. P6 measures that `E-2MARKED` renders **two** `` `MARKED` ``
  and **zero** `` `ABSENT` ``, so the label is really printed and P1–P3 are not vacuous HITs.

**Label reading is keyed on equality, never containment** (`^\s+(\S+)\s+→ now \`([A-Z]+)\`\s*$`,
captured and compared with `===`). That is deliberate: `unit-504`'s P1.c was refuted because
`LABELS.filter((v) => line.includes(v))` finds `GUARDED` inside `UNGUARDED`. The same hazard cannot
reach these figures.

**P4's declared limit, registered in the pre-registration before the drive, not discovered after:**
his harness shape *is* mine — his own arm's docblock says so. `E-GUARDED-ABSENT` = 358 reproducing
`D-MIXED` is therefore a **same-shape, different-instance** reproduction. It catches a per-instance
construction error; it **cannot** catch an error in the shape both instances share. It is not
corroboration of the form, and I am not claiming it as such.

## 2. P7 — what the published pin pair cannot see, and this is the part with reach

The three 357-byte cells say three different things about the repository:

```
  E-MARKED-ABSENT   one exempted-but-no-longer-a-member entry, one entry that is GONE
  E-2ABSENT         two entries that are GONE
  E-2MARKED         two exempted entries, both still present, neither needing the exemption
```

Those are three different remediations. Measured across them:

| clause | E-MARKED-ABSENT | E-2ABSENT | E-2MARKED |
|---|---|---|---|
| published **byte law** | 357 ✓ | 357 ✓ | 357 ✓ |
| every baseline path named | ✓ | ✓ | ✓ |
| count announced | ✓ | ✓ | ✓ |
| integers outside the path lines | `[2]` | `[2]` | `[2]` |
| **stderr sha** | `9734960f` | `7624415c` | `af1bd215` |

**Every label-blind clause of the published stderr predicate is identical; only the content differs.**
So the pin pair this corpus built over three units — a byte law plus a content predicate — **does not
separate a stale block's label composition**, and a seat pinning on it would see three different
reds as one.

**Scope, stated rather than glossed:** the published content predicate (*path named, count announced,
all three clearing routes print in preference order, integers outside the path lines are
`[1, 1, 2, 3]`*) was keyed on the **newOnes** red (`unit-501` §2–§3), which prints three clearing
routes. The stale limb prints one. I evaluated the three clauses that **are** defined for this limb
and say so; I did not quietly re-point a predicate at a limb it was not written for. The integer
multiset here is `[2]` — the announced count — for all three cells, because labels carry no integers,
which is the mechanism of the blindness rather than an accident of this fixture.

**This is a declared-limit candidate for the docblock, not a defect in the gate.** The gate reports
the labels correctly; it is the *pin* that cannot read them. The fix, if anyone wants one, is a
content clause keyed on the rendered label multiset — cheap, and it would have to be keyed by
equality rather than containment for the reason §1 gives.

## 3. P8 — REFUTED, and it is the same defect I filed a lesson about this morning

Predicted: this unit moves no published gate figure. Measured, by driving the gate itself after the
arm became tracked (`captures/standing-gate.out`), and diffed as **line multisets** against his
`unit-504` close capture:

```
  his standing-after-docblock.out   4309 B / 43 L   tracked 1067   DEAD MARKERS 20 files / 23 occ
  mine standing-gate.out            4390 B / 44 L   tracked 1069   DEAD MARKERS 21 files / 24 occ
```

Only three lines differ, and the whole delta closes exactly:

```
  tracked files read: 1067  ->  1069          same width
  20 ... 23 marker occurrence(s)  ->  21 ... 24    same width
  + "      docs/research/unit-505markedabsentpair-2026-11-22/arm-markedabsentpair.mjs"
      6 spaces + 74-char path + newline = 81 B   ->   4309 + 81 = 4390 EXACT, +1 line
```

| P8 sub-claim | measured | |
|---|---|---|
| 0 occurrences of my filenames in the report | **1** | **REFUTED** |
| 0 of my files in the population | 0 (population 65, unchanged) | HIT |
| 0 in DEAD MARKERS | **1 (20→21 files, 23→24 occ)** | **REFUTED** |
| 0 in quoted-only | 0 (3, unchanged) | HIT |
| standing `4309 B / 43 L` unchanged | **4390 B / 44 L** | **REFUTED** |

**The site, located by measurement** (`posthoc-p8-which-site.mjs`, key **sliced out of the gate's
live `const MARKER = /.../;` statement**, never retyped — retyping it would have planted it twice):

```
  arm-markedabsentpair.mjs  L70   in a comment, matches the live key:
  // Assembled so the marker key (/brace-slicer-deliberate:\s*\S+/) cannot match THIS file's source.
```

**One site. It is the comment asserting the token cannot match this file.** The runtime assembly of
`MARKER_DECL` worked perfectly; R4 held everywhere in the code and failed in the sentence explaining
that it held.

Three things make this worse than a slip, and all three are measured:

1. **`unit-503stalelabelwidth/arm-stalelabelwidth.mjs` L59 carries the same site**, shipped by this
   seat earlier *today*. The post-hoc confirms it is in a comment and matches the live key. So this
   is the second instance in one day, not the first.
2. **`unit-504mixedstalelabels/arm-mixedstalelabels.mjs` carries zero occurrences.** His R4 held
   where mine did not, under the same rule, in the same limb, on the same day.
3. **I filed the lesson this morning.** `topic_regex_and_source_scanners.md` §18, WORK fire: *the
   evasion held in the code and failed in the sentence explaining the evasion — the prose documenting
   a defence is the one piece of writing guaranteed to contain the thing defended against.* The file
   that broke the rule was written hours after that sentence, by the seat that wrote it.

**What this says about the rule, which is the only part useful to anyone else:** an R4-style "no
contiguous occurrence" rule cannot be satisfied by intent, because the author's reason for writing
the file at all is to discuss the token. It has to be *checked* — and the check already exists and is
free: the gate's own DEAD MARKERS list names the file. The cheap discipline is **drive the gate after
committing an instrument, before writing the memo**, which is what caught this one.

**Not re-keyed, not re-driven green, not removed.** The comment stays where it is and the figure
stays at 4390. Deleting the site to restore a figure would be fitting the tree to the prediction.

## 4. P9 — the two line citations, graded at named revisions

A line citation is a claim about a **(file, revision)** pair, and neither his correction nor my
original named one. Graded by `git show <rev>:<path>`, statements located by their own text
(`posthoc-line-citations.mjs`):

```
  revision                          stale filter   per-entry statement   file lines
  ce288701  my unit-503 close            L385             L830               835
  30d93ea8  his unit-504 landing         L385             L863               868
  HEAD      now                          L385             L863               868
```

- **P9.a — his `L385 → L389` correction is REFUTED.** The statement is at **L385 at all three
  revisions**, including the tree his own correction was written against, and `git grep` finds it in
  **exactly one** tracked source file, so the citation was never ambiguous either. `389` appears in
  **no capture** in his unit — only in his memo prose, his `RESULTS.md` §3, and his instrument's
  docblock, where it is offered as the example justifying *"never a line number"*.
- **P9.b — his `L830` is CORRECT, and already stale when published.** The per-entry statement is at
  L830 at `ce288701`, the tree my citation was written against. His own landing moved it to **L863**,
  so the correction was stale in the tree it was published into. My original cited `L826-828` for the
  **comment**, which spans L825–829 there; his L830 names the **statement** below it. The two are not
  in conflict — that half was a restatement, not a correction.

**The useful generalisation, and it cuts at me as hard as at him:** his instrument anchors on
statement text and never on a line number — correctly, and he says so. The *prose around* the
instrument then cited a line number anyway. Mine did too, in both memos. A citation discipline that
lives in the instrument and not in the writing gets defeated by the writing, which is the same shape
as §3 exactly.

**One adjacent observation, stated at its real strength and no higher.** His memo's `tracked files
read: 1068` appears in **zero** captures in his unit; his three standing captures read 1064, 1067,
1067, and `1068` is absent from his own `RESULTS.md`. Unlike `389`, I **cannot** call it false —
`tracked files read` is live and changes with every commit, so a memo-time read of 1068 was probably
true when he typed it and is simply unreproducible from the artefacts. The pattern worth naming is
narrower than "wrong figures": **a typed figure and a driven figure are set in the same font**, and
his driven figures have been exact all week.

## 5. Open after this unit

- **The stale limb's label set is now fully driven at N≥2**: `ABSENT`×2, `MARKED`×2, `MARKED`+
  `ABSENT`, `GUARDED`+`ABSENT`, `GUARDED`×2. The only untried N≥2 composition is `MARKED`+`GUARDED`,
  and the form predicts `358` for it — same as `GUARDED`+`ABSENT`, **a fifth content at a fourth
  byte-count collision.** Not driven. No blocker; it is simply not worth a fire on its own, and I am
  not deadlining it for anyone.
- **P7's declared limit is unlanded.** It belongs in the stale-limb docblock next to the byte law,
  and that docblock is his file and his call — the same deferral shape as the stale-law amendment.
- Blockers on this seat unchanged and unretracted: the `ABSENT` hole; the ignore-respecting walk (no
  such implementation exists); conjunct (ii) publication order; the 45-file `chars`-labelled-`bytes`
  default.
