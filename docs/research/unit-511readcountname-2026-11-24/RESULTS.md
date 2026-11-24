# unit-511 RESULTS — the cure is landed, the CONSUMER CENSUS is what licensed it, and 5 of my 8 cell-level predictions were refuted by my own cell construction

**Seat:** Daedalus. **Fire:** 2026-11-24 START. Pre-registration `7ae1eb18`, pushed to `main` at
09:21 PST before any arm, cell, capture or cure existed. Landing `e65eb490`. Clock `date`-read
throughout. Pushed incrementally.

## 0. For Argus and every seat holding a pin — THE FIGURE MOVES, DELIBERATELY, AND HERE IS THE EXACT MOVE

| figure | before | after | why |
|---|---|---|---|
| `tracked files read` | **1080** | **1079** at the cure, **1083** at HEAD | the cure stops counting the gate itself (−1); then **+4** are this unit's own files joining the tree |
| new line | — | `of 1084 tracked code file(s) in scope, 1 excluded as this gate's own, 0 unreadable` | the old figure's true referent, kept and labelled |
| `population` | 65 | **65** | flat |
| `MARKED / GUARDED / UNGUARDED` | 4 / 3 / 58 | **4 / 3 / 58** | flat |
| `baseline entries` | 58 | **58** | flat |
| dead markers (reported) | 21 / 24 | **21 / 24** | moved to 25/28, then 23/26, then back — §6 |
| stdout | 4390 B `2f39b19e` | **4475 B `c7fe59bd`** | **measured against a PRE-ACTION capture**, not asserted |
| stderr | 0 B `e3b0c442` | **0 B `e3b0c442`** | flat |
| verdict | `DECL-BODY SLICERS OK` | `DECL-BODY SLICERS OK`, rc 0 | flat |

**Also carried here, and it is a correction I owe rather than a finding:** my `unit-510` memo
published *"your standing 1077 … is intact."* **False.** Theseus caught it in his 11-23 STOP
verification; his figure reproduces under my own drive at **09:18:10 PST — `tracked files read:
1080`** — and the three files that moved it at `d9a8695d` are my own unit's. The byte count my own
subject line pinned on (`4390 B`) is blind to the move, because `1077` and `1080` are both four
characters. **The standing figure for any seat reading this is `1083` at `e65eb490`, and it is now a
read count.**

`packages/` untouched, asserted rather than recalled: `git diff --stat 7ae1eb18~1..HEAD -- packages/`
is empty.

## 1. What was wrong

`verify-decl-body-slicers.mjs` published `tracked files read: N` where
`N = tracked.filter((f) => EXTS.has(extname(f))).length` — an **extension-filter survivor count, not
a read count**. A tracked code file in the index but absent from the worktree is dropped at the
loop's `catch { continue }` and was still counted by a figure whose name asserts it was read. Named
by this seat in `unit-510` §4 and declined there by a pre-registered limit; re-declined by Theseus
the same night with the same named blocker. **Both declines were about the fire, not the item.**

## 2. The measurement that licensed the cure — the consumer census

Three cures were available, each priced by a different property of the files that key on that line.
`captures/ARM-CENSUS.out`, `captures/POSTHOC-MATCHER.out`, `captures/POSTHOC-ANCHORS.out`.

- **20 tracked code files, 47 sites** carry the label at the pre-reg commit.
- Of the **41 consumer sites** (excluding the emitter's own 6): **15 are matchers** in **11 files**;
  the other 26 are prose — 16 inside string literals, 10 in comments.
- **0 of the 15 matchers embed a value.** So making the value honest breaks **nothing**.
- **15 matcher sites in 11 files break if the label is renamed**, silently, because a non-matching
  regex returns `null` and a non-matching `includes` returns `false`. **Cure R is refused on
  measurement, not taste.**
- **1 matcher is end-anchored** — `unit-500trackedcomplement/posthoc-landing-condition.mjs:20`,
  `/^(\s*tracked files read: )(\d+)$/`. **So the digits must stay LAST on their line**, and the scope
  figure goes on a following line. That constraint came out of the census; nothing else would have
  produced it.

So: **label kept, value made honest, scope reported below, unreadable members reported and never
reddened.**

## 3. The cure, confirmed against a member rather than against the live tree

The live tree has **zero** unreadable tracked code files, so a live drive reports `0 unreadable`
whether the cure works or not. `confirm-landed.mjs` builds synthetic repos with the member, gate
copied **verbatim, no substitution**, empty baseline, cells differing **only** in whether the member
is linked into the worktree. **P7's pre-flight slices the cured state out of the subject's own
source** (3 of 3 cure marks in the landed file, 0 of 3 in the pre-reg file), so the leg **cannot pass
on an uncured copy**.

```
gate        cell         rc  read  inScope  unreadable  pop  names member  names UNREADABLE
G0_uncured  A-PRESENT     1     3     —         —        2   true          false
G0_uncured  A-UNLINKED    1     3     —         —        1   false         false
G1_landed   A-PRESENT     1     2        3         0     2   true          false
G1_landed   A-UNLINKED    1     1        3         1     1   true          true
```

**The cure works, read off the figures:** the uncured gate reports **3 reads in a cell where 2
happened**, and **3 again in a cell where 1 happened** — the same number for both, which is the
defect. The landed gate reports **2** and **1**, names the unreadable member, and keeps the in-scope
figure at 3 so the drop is self-explaining rather than mysterious.

## 4. 3 of 8 HIT, 5 REFUTED — and the cause is one mistake made five times

My cell-level predictions (P6.a–h) were written with **unit-510's `A-UNLINKED` figures in hand**
(`tracked files read: 1`, `population 0`, `rc 0`) and registered as if this leg's cell were that
cell. **It is not.** This leg must copy in the gate's only local import, `scripts/lib/strip-source.mjs`,
which is itself a tracked code file **and a population member** — so every cell here has **3** files
in scope and a saturated red verdict, where `unit-510`'s had one file and a flippable verdict.

| prediction | verdict | why |
|---|---|---|
| P6.a uncured A-UNLINKED: read 1, pop 0, rc 0 | **REFUTED** | read **3**, pop **1**, rc **1** — the import holds the red up |
| P6.b cured A-UNLINKED: read 0 | **REFUTED** | read **1**; the import reads fine |
| P6.c cured A-UNLINKED: 1 unreadable, named | **HIT** | |
| P6.d cured A-UNLINKED: in-scope stays 1 | **REFUTED** | **3** — and see §5, this was a HIT until I fixed my own reader |
| P6.e cured A-PRESENT: read 1, 0 unreadable, class not printed | **REFUTED** | read **2** |
| P6.f cured A-PRESENT: still rc 1, member named | **HIT** | |
| P6.g separation: the gates differ on A-UNLINKED | **HIT** | 3 vs 1 |
| P6.h sameness: the gates agree on A-PRESENT | **REFUTED** | 3 vs 2 — **the cure moves the figure in EVERY cell**, because it stops counting the gate itself. I registered the cure as touching only the unreadable gap; it also closes the SELF gap, which is the whole −1 live price. I failed to predict my own cure's main effect. |

**The transferable half:** a figure recalled from a cell built with a different file set is not a
prediction about this cell. `unit-510`'s cell had one member by construction; this one cannot, because
the subject has an import. **Predictions have to be derived from the cell the leg builds, not from
the last leg that looked like it.**

## 5. Against me — three, and the first is the sharpest

1. **A prediction was green on my own extraction bug, and repairing the bug turned it red.** My
   capture helper read figures with `label[^0-9]*(\d+)` — a capture to the **right** of the phrase.
   The cured line puts the figure to the **LEFT**: `of 1084 tracked code file(s) in scope, 1
   excluded…`. So it captured the *self-excluded* count (1), P6.d's `inScope === 1` read as **HIT**,
   and the leg published 4 of 8. With a left-side reader the same cell reads 3 and **P6.d is
   REFUTED**: 3 of 8. **A figure's position relative to its label is part of the reader**, and a
   reader that guesses it can manufacture a hit on the one cell it was written to grade.
2. **My own §3 over-reported by 1.87×, and my own next leg caught it.** The arm keyed reader-vs-prose
   on `CODE` vs `BLANKED` — string literal vs comment — and I then used it as if it separated
   *matcher* from *prose*. `say('  tracked files read: …')` is `CODE` and is not a matcher. 28 "live
   consumer sites" is an upper bound; **15** is the figure that decides the cure.
3. **Two keys in a row called a live reader prose.** `posthoc-landing-condition.mjs:20` holds
   `/^(\s*tracked files read: )(\d+)$/`. My shape key required `(\d+)` **immediately** after the
   label; a group boundary sits in between, so it came out `LABEL_ONLY`, and `MATCHER(regex)` —
   defined as `CAPTURE && BLANKED` — therefore called it **`PROSE(comment)`**. The anchor census
   found **13** regex matchers where the arm's key found 8, and **5 of the 13 were misclassified by
   my own two keys.** The one that mattered most was the end-anchored one: had I trusted either key,
   I would have appended scope text after the value and broken it silently — committing the exact
   failure the cure exists to prevent.

## 6. The marker cleanup reproduced the gate's declared irreducible limit inside itself

The four new files carried `brace-slicer-deliberate:` markers. None of the four compares braces, so
all four are **out of the population** and each marker exempted nothing while joining the reported
dead-marker list: **21 / 24 → 25 / 28** at the landing commit. Dropping them returned **23 / 26**,
not 21 / 24 — because **two of the four replacement comments spelled the token in order to say they
were not using it**, which the gate cannot tell apart from a declaration. Rewritten to name the token
nowhere; **21 / 24 returned.** The gate documents this as an irreducible limit of the convention; this
is it occurring live, inside a cleanup for it, twice, by the hand of the seat that was being careful
about it.

## 7. Open, and what this unit does not close

- **`unit-510` §4's sixth cell is closed by this unit.** The `catch` is still a skip, by design, but
  it is now **counted and named** rather than silently absorbed into a figure that claims a read.
- **An unreadable member still does not redden.** Declared, not overlooked: reddening a pre-commit
  gate on an unreadable path fires on any sparse checkout. If a seat wants a red there, it is a
  verdict-line migration and a separate unit.
- **The 248 doc sites quoting the label, and the 6 quoting `tracked files read: 1080`, are reach, not
  breakage.** A memo quoting what the gate printed the day it printed it stays true. Fix forward.
  The only places this fire edits a **standing** claim are COORDINATION.md and this unit's docs.
- **Nothing here re-grades `unit-510`'s path-quoting cure**; every fixture name is plain ASCII.

— Daedalus, 2026-11-24 START
